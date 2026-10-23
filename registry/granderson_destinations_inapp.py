"""Granderson Destinations outcome-only adapter. Install in Key Registry/checker/adapters.
No provider credential leaves the application. The local read token is sent only
to the fixed production endpoint, with no redirects and a 15-second timeout.
"""
import http.client
import json
import os
import re
import stat
import threading
import time
import urllib.error
import urllib.request

APP = "granderson_destinations"
SCHEMA = 1
LATEST_URL = "https://grandersondestinations.com/api/reliability/key-check/latest"
TOKEN_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
                          ".keyregistry", "granderson_destinations_read_token")
RUN_MAX_AGE_S = 36 * 3600
TIMEOUT_S = 15

# Granderson Destinations detail codes (DETAILS in src/lib/reliability/key-check.ts) meaning "the key is accepted, or is the
# wrong kind of key, and cannot do what its slot needs". 
# (restricted_key is left out: Granderson Destinations sends it only with pass or degraded, never as the cause of permission_or_resource.)
AUTH_SCOPE_DETAILS = frozenset({"forbidden", "key_restricted", "api_blocked", "wrong_role", "project_mismatch", "wrong_key_type"})
# A server secret found in a NEXT_PUBLIC_ variable (Granderson Destinations's supabase_anon check): it ships to every browser, so the
# row keeps its result even when the run is old, and run_checks raises a critical alert on the first run.
EXPOSED_DETAIL = "secret_in_public_var"
FAILING_OUTCOME_CODES = frozenset({"invalid_credential", "expired_credential", "out_of_credit"})
# Every detail _load_run can attach to a load failure (the same words as granted_inapp).
LOAD_ERROR_DETAILS = frozenset({"token_file_missing", "token_file_perms", "token_file_unreadable", "token_file_malformed",
                                "read_token_rejected", "no_runs", "inapp_unreachable", "bad_payload"})
_ID = re.compile(r"^[A-Za-z0-9_\-]{1,40}$")
_VERSION = re.compile(r"^[A-Za-z0-9_\-]{8}$")

_lock = threading.Lock()
_cache = {}  # {"run": dict} or {"error": (code, detail, http_status)} for this process


def reset_cache():
    with _lock:
        _cache.clear()


def _read_token(path):
    """Returns (token, error_detail). The token is used for one header and never logged."""
    try:
        st = os.stat(path)
    except OSError:
        return None, "token_file_missing"
    if not stat.S_ISREG(st.st_mode) or (stat.S_IMODE(st.st_mode) & 0o077):
        return None, "token_file_perms"
    try:
        with open(path, encoding="utf-8") as fh:
            token = fh.read().strip()
    except OSError:
        return None, "token_file_unreadable"
    if not (16 <= len(token) <= 200) or not re.fullmatch(r"[A-Za-z0-9_\-]+", token):
        return None, "token_file_malformed"
    return token, None


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    """A redirect would carry the Authorization header to another location; refuse it. The 3xx surfaces as an HTTPError."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise urllib.error.HTTPError(req.full_url, code, "redirect refused", headers, fp)


_OPENER = urllib.request.build_opener(_NoRedirect)


def _fetch(url, token, timeout):
    """One GET; returns (status, parsed_json_or_None). Raises urllib errors on transport failure."""
    req = urllib.request.Request(url, headers={"Authorization": "Bearer " + token, "Accept": "application/json",
                                               "User-Agent": "key-registry-checker"})
    with _OPENER.open(req, timeout=timeout) as resp:
        raw = resp.read(1_000_000)
        try:
            return resp.status, json.loads(raw.decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            return resp.status, None


def _load_run(token_path=None, url=None, fetch=None, timeout=TIMEOUT_S):
    """Fetch the latest run once per process; every credential's check shares it."""
    with _lock:
        if _cache:
            return _cache
        token, err = _read_token(token_path or TOKEN_PATH)
        if err:
            _cache["error"] = ("misconfigured", err, None)
            return _cache
        try:
            status, body = (fetch or _fetch)(url or LATEST_URL, token, timeout)
        except urllib.error.HTTPError as exc:
            code = exc.code
            if code in (401, 403):
                _cache["error"] = ("misconfigured", "read_token_rejected", code)
            elif code == 404:
                _cache["error"] = ("provider_error", "no_runs", code)
            else:  # a refused redirect, a 5xx (Granderson Destinations answers 503 when its database is unavailable), or anything else
                _cache["error"] = ("provider_error", "inapp_unreachable", code)
            return _cache
        except (urllib.error.URLError, http.client.HTTPException, TimeoutError, OSError, ValueError):
            _cache["error"] = ("provider_error", "inapp_unreachable", None)
            return _cache
        ok_shape = (isinstance(body, dict) and body.get("app") == APP and type(body.get("schema")) is int and body["schema"] == SCHEMA
                    and isinstance(body.get("run"), dict) and isinstance(body["run"].get("results"), list))
        if status != 200 or not ok_shape:
            _cache["error"] = ("provider_error", "bad_payload", status if isinstance(status, int) else None)
            return _cache
        _cache["run"] = body["run"]
        return _cache


def _parse_ts(value):
    """Seconds since the epoch, or None. Uses the checker's shared parser (checker/expiry.py)."""
    import expiry
    ms = expiry.parse_ts(value) if isinstance(value, str) else None
    return None if ms is None else ms / 1000.0


def _fmt(epoch_s):
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(int(epoch_s)))


def first_detail(details):
    """Granderson Destinations sends a list of detail codes; the registry keeps the first string one."""
    if isinstance(details, list):
        return next((d for d in details if isinstance(d, str) and d), None)
    return None


def map_outcome(outcome, detail):
    """(code, detail) for one in-app check outcome, per PLAN 16.4 and 17.3."""
    d = detail if isinstance(detail, str) and detail else None
    head = d.split(":", 1)[0] if d else None
    if outcome == "pass":
        return "ok", d
    if outcome == "degraded":
        return "misconfigured", d
    if outcome == "invalid_auth":
        return ("expired_credential" if head == "token_expired" else "invalid_credential"), d
    if outcome == "permission_or_resource":
        return ("insufficient_permissions" if head in AUTH_SCOPE_DETAILS else "misconfigured"), d
    if outcome == "quota_rate":
        return ("out_of_credit" if head == "quota_exhausted" else "rate_limited"), d
    if outcome == "provider_unavailable":
        return "provider_error", d
    if outcome == "missing":
        return "misconfigured", d or "env_missing"
    if outcome in ("configured", "skipped"):
        return "untestable", "present" if outcome == "configured" else (d or "skipped")
    return "provider_error", "unknown_outcome"


def check(target, now=None, **loader):
    from . import result
    target = target if isinstance(target, dict) else {}
    check_id = target.get("check_id")
    if not isinstance(check_id, str) or not _ID.match(check_id):
        return result("misconfigured", detail="no_check_id")
    state = _load_run(**loader)
    if "error" in state:
        code, detail, http_status = state["error"]
        return result(code, http_status=http_status, detail=detail)
    run = state["run"]
    entry = next((c for c in run["results"] if isinstance(c, dict) and c.get("id") == check_id), None)
    if entry is None:
        return result("misconfigured", detail="check_id_unknown")
    run_at = _parse_ts(run.get("started_at"))
    now_s = now if now is not None else time.time()
    extra = {}
    if run_at is not None:
        extra["inapp_run_at"] = _fmt(run_at)
    dep = run.get("deployment_id")
    if isinstance(dep, str) and _ID.match(dep):
        extra["deployment_id"] = dep[:12]
    ver = entry.get("version_tag")
    if isinstance(ver, str) and _VERSION.match(ver):
        extra["version_tag"] = ver
    if entry.get("legacy_jwt") is True:  # Granderson Destinations sends the flag only when true; merge_check clears it when it goes away
        extra["legacy"] = True
    raw_http = entry.get("http_status")
    http_status = raw_http if isinstance(raw_http, int) and not isinstance(raw_http, bool) else None
    code, detail = map_outcome(entry.get("outcome"), entry.get("detail"))
    identity = entry.get("identity")
    if run_at is None:
        return result("no_recent_run", http_status=http_status, identity_hint=identity, detail="run_missing", extra=extra)
    exposed = isinstance(detail, str) and detail.split(":", 1)[0] == EXPOSED_DETAIL
    if now_s - run_at > RUN_MAX_AGE_S and code not in FAILING_OUTCOME_CODES and not exposed:
        # Dated by the old run (extra.inapp_run_at), so the page reads it as stale; a failing or exposed result keeps its code.
        return result("no_recent_run", http_status=http_status, identity_hint=identity, detail="run_too_old", extra=extra)
    return result(code, http_status=http_status, identity_hint=identity, detail=detail, extra=extra)
