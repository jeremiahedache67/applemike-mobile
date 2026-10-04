const ngn = new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 });

export const naira = (n: number) => `₦${ngn.format(n)}`;

export const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

/** Turns network / Supabase errors into a short message customers can act on. */
export function friendlyError(e: unknown, fallback = 'Something went wrong. Please try again.') {
  const msg =
    e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as { message: unknown }).message) : '';
  if (/network|fetch|timed? ?out|offline|connection/i.test(msg)) {
    return "You're offline or the connection is weak. Check your internet and try again.";
  }
  if (/JWT|expired|refresh token/i.test(msg)) return 'Your session has expired. Please sign in again.';
  return fallback;
}

/** Retries a request a couple of times on network errors (not on validation/permission errors). */
export async function withRetry<T>(fn: () => PromiseLike<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      const msg = e instanceof Error ? e.message : String(e);
      if (!/network|fetch|timed? ?out/i.test(msg)) throw e;
      await new Promise((r) => setTimeout(r, 500 * 2 ** i));
    }
  }
  throw lastError;
}
