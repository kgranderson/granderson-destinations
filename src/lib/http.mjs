export function boundedFetch(input, init = {}) {
  const timeout = AbortSignal.timeout(8000);
  const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  return fetch(input, { ...init, redirect: 'error', signal });
}

// Enforce the limit while reading, before buffering an entire upstream response.
export async function boundedJson(response, limit = 1000000) {
  if (Number(response.headers.get('content-length')) > limit) throw new Error('invalid_provider_payload');
  const reader = response.body?.getReader();
  if (!reader) throw new Error('invalid_provider_payload');
  const parts = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) throw new Error('invalid_provider_payload');
      parts.push(value);
    }
    return JSON.parse(Buffer.concat(parts).toString('utf8'));
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
