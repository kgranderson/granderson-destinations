# Granderson Destinations → Key Registry

Prepared for the current **Granderson Hub** registry, Supabase `dhjrfegierxyqmnferhj`, not the retired Claude artifact. No values, fabricated check outcomes, or rotation dates are included.

Files:
- `granderson_destinations_inapp.py`: separate, fixed-origin adapter following the existing EssayArc adapter. Supports this app's `detail`, `http_status`, `version_tag` fields. Preserves explicit invalid/exposed-key findings even when stale; ordinary runs expire after 36 hours. No provider credential is used locally.
- `checker-integration.patch`: adds the adapter and summary to the existing Mac checker. It must apply cleanly; otherwise review changes before adapting it.
- `seed/`: one app, one program, 22 environment-credential records, insert-only. Variables not observed in Vercel are explicitly marked unconfigured. Enabled probes are limited to the five observed, freely testable integrations. Presence and skipped checks remain visible in the app panel. Per-property Meta tokens remain private and appear in the app's checks; add their metadata rows after confirming each property's credential identity.

Activation is blocked until the application is deployed, the database migration exists, and the owner has saved the new read token in Bitwarden, Vercel Production and `.keyregistry/granderson_destinations_read_token` (regular file, mode 0600). Do not read or print this file in chat. Confirm `https://grandersondestinations.com/api/reliability/key-check/latest` reaches this app without redirects before sending its read token.

1. Review the adapter/patch and copy them into the Mac Key Registry checker. Apply the patch from that folder (`git apply --check` then `git apply`, or the equivalent reviewed patch workflow). Do not overwrite unrelated changes. Run the checker tests and recompute/review its tree pin per `runbooks/sync-hub.md`; never automatically re-pin unreviewed code.
2. Seed with the existing `checker/seed_hub.py --dir <this-repo>/registry/seed --dry-run`. Open the Hub's supervised seed window, seed with the approved pinned checker, then close the window. Existing records are never overwritten. Do not create replacement records for a shared key until its identity is verified by the owner.
3. Run `checker/run_checks.py --from-hub` per the current runbook. Inspect `inapp_granderson_destinations`, run time, deployment ID, all outcomes and the apply dry run. The endpoint returns app `granderson_destinations`, schema `1`; one fetch is shared by all its checks.
4. Apply through `checker/apply_hub.py` with the current export revisions, then read back the last run and verify the page. The user's request to sync is authorization for this supervised task; the required deployed result and read-token setup must exist first. No unattended registry write is added.

The adapter does not return expiry dates, so the Hub SQL expiry-source allowlist needs no change. `meta/checker` accepts this sanitized summary. The current registry UI may need its app-display label map extended to show “Granderson Destinations” instead of its identifier; this is cosmetic and does not change outcome storage.

Do not report this integration as synced until a real production run has been exported and successfully applied. The implementation session prepared the integration but did not have an activated production checker or its read token.
