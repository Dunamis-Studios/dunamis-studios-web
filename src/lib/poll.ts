/**
 * Generic poll-until-match helper. Used by the subscribe and buy-credits
 * modals to wait for Stripe's webhook to land before closing the modal —
 * the server API response happens instantly, but the webhook that updates
 * Redis is asynchronous. Polling prevents the classic "click subscribe,
 * close modal, see stale state, manual refresh" race.
 *
 * Returns { matched: true } the first iteration the predicate holds, or
 * { matched: false, lastValue } when the timeout elapses. Swallowed
 * fetcher errors keep polling — transient network blips shouldn't fail
 * the match.
 */
export async function pollUntil<T>(
  fetcher: () => Promise<T>,
  match: (value: T) => boolean,
  opts: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<{ matched: boolean; lastValue: T | null }> {
  const interval = Math.max(50, opts.intervalMs ?? 500);
  const timeout = Math.max(interval, opts.timeoutMs ?? 10_000);
  const deadline = Date.now() + timeout;
  let last: T | null = null;

  while (Date.now() < deadline) {
    try {
      last = await fetcher();
      if (match(last)) return { matched: true, lastValue: last };
    } catch {
      // ignore — poll again
    }
    if (Date.now() + interval >= deadline) break;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  return { matched: false, lastValue: last };
}
