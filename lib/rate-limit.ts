/**
 * Rate limiting for the unauthenticated public endpoints.
 *
 * State lives in process memory, deliberately. The alternatives both cost more
 * than they are worth here: a Postgres-backed counter would add a database
 * round trip to the hottest endpoint we have, on a Neon plan we are already
 * rationing, and a Redis add-on is another paid dependency and another secret.
 *
 * The trade-off that buys is real and worth stating plainly: each serverless
 * instance keeps its own counters, so the effective ceiling is the configured
 * limit multiplied by however many instances are warm, and a cold start resets
 * a counter to zero. This stops a single client hammering an endpoint in a
 * loop — the realistic abuse and the one that costs money. It does not stop a
 * determined distributed attacker. The hard spend ceiling in `createSpendCap`
 * is what bounds the damage when the limiter is evaded.
 */

export type RateLimitRule = {
  /** Requests permitted inside the window. */
  limit: number;
  windowMs: number;
};

export type RateLimitVerdict = {
  allowed: boolean;
  remaining: number;
  /** Seconds until the caller may retry. Zero when allowed. */
  retryAfterSeconds: number;
};

/** Beyond this many tracked keys we start shedding, so memory stays bounded. */
const MAX_TRACKED_KEYS = 5000;

export type RateLimiter = {
  check(key: string, rule: RateLimitRule): RateLimitVerdict;
  /** Test seam. */
  size(): number;
};

/**
 * Sliding window, kept as a log of hit timestamps per key.
 *
 * A fixed window would be cheaper but lets a caller fire `limit` requests at
 * the end of one window and `limit` again at the start of the next — double the
 * intended rate, in a burst, which is exactly the shape we are trying to stop.
 * Limits here are small enough that keeping the timestamps is inexpensive.
 */
export function createRateLimiter(now: () => number = Date.now): RateLimiter {
  const hits = new Map<string, number[]>();

  /** Drop keys whose entire window has elapsed; clear outright if still over. */
  const evict = (at: number) => {
    for (const [key, stamps] of hits) {
      if (stamps.length === 0 || stamps[stamps.length - 1]! < at) hits.delete(key);
    }
    // Nothing expired and we are still over budget — a flood of distinct keys.
    // Dropping everything is the safe direction: it forgives, never blocks.
    if (hits.size > MAX_TRACKED_KEYS) hits.clear();
  };

  return {
    check(key, rule) {
      const at = now();
      const windowStart = at - rule.windowMs;

      const previous = hits.get(key) ?? [];
      // Prune in place rather than filtering the whole map on a timer; the only
      // keys worth the work are the ones actually being used.
      const current = previous.filter((stamp) => stamp > windowStart);

      if (current.length >= rule.limit) {
        hits.set(key, current);
        const oldest = current[0]!;
        const retryMs = oldest + rule.windowMs - at;
        return {
          allowed: false,
          remaining: 0,
          retryAfterSeconds: Math.max(1, Math.ceil(retryMs / 1000)),
        };
      }

      current.push(at);
      hits.set(key, current);
      if (hits.size > MAX_TRACKED_KEYS) evict(windowStart);

      return {
        allowed: true,
        remaining: rule.limit - current.length,
        retryAfterSeconds: 0,
      };
    },
    size: () => hits.size,
  };
}

/**
 * Identify the caller.
 *
 * Every request reaches this code through Vercel's proxy, which appends the
 * real client address to `x-forwarded-for`. The *last* entry is the one Vercel
 * itself observed; earlier entries are whatever the client chose to send and
 * are trivially forged, so keying on the first entry would let anyone mint a
 * fresh identity per request and bypass the limiter entirely.
 */
export function clientIp(headers: Record<string, string | string[] | undefined>): string {
  const raw = headers['x-forwarded-for'];
  const value = Array.isArray(raw) ? raw.join(',') : raw;
  const parts = (value ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length > 0) return parts[parts.length - 1]!;

  const realIp = headers['x-real-ip'];
  const single = Array.isArray(realIp) ? realIp[0] : realIp;
  return single?.trim() || 'unknown';
}

export type SpendCap = {
  /** True when the call may proceed. Records the call as spent. */
  tryConsume(): boolean;
  spentToday(): number;
};

/**
 * A hard daily ceiling on calls to a metered third party.
 *
 * This is the backstop, not the primary control. If the rate limiter is evaded
 * — distributed clients, a stampede of cold instances — this is what keeps a
 * bill bounded, by refusing to make the call at all once the day's budget is
 * gone. Callers degrade rather than fail: an absent suggestion already routes
 * the homeowner to manual review, which is a worse experience but a correct
 * one.
 */
export function createSpendCap(
  dailyLimit: number,
  now: () => number = Date.now
): SpendCap {
  let day = '';
  let spent = 0;

  const rollover = () => {
    const today = new Date(now()).toISOString().slice(0, 10);
    if (today !== day) {
      day = today;
      spent = 0;
    }
  };

  return {
    tryConsume() {
      rollover();
      if (spent >= dailyLimit) return false;
      spent += 1;
      return true;
    },
    spentToday() {
      rollover();
      return spent;
    },
  };
}

export type SharedSpendCap = {
  /** Resolves true when the call may proceed. */
  tryConsume(): Promise<boolean>;
};

export type SharedSpendCapOptions = {
  /** Identifies the metered API; combined with the UTC date to key the counter. */
  api: string;
  dailyLimit: number;
  /**
   * Atomically add one to the counter for `key` and return the new total.
   * Injected so the policy here can be tested without a database.
   */
  increment: (key: string) => Promise<number>;
  now?: () => number;
};

/**
 * A daily ceiling on a metered API, counted in shared storage.
 *
 * Unlike `createSpendCap`, this one actually holds across instances, which is
 * the only way a ceiling means anything on a platform that fans requests out
 * over many lambdas.
 *
 * Two behaviours are deliberate:
 *
 *  - Once an instance learns the budget is gone, it remembers that for the rest
 *    of the UTC day and stops querying. During a flood that caps the database
 *    traffic at roughly one write per instance rather than one per request, so
 *    defending against a Google bill cannot itself run up a Neon bill.
 *
 *  - If the counter cannot be reached, the call is allowed. Failing closed
 *    would mean a database blip silently degrades every address lookup to
 *    manual review, which is a far more likely event than an attack and a much
 *    worse outcome. The exposure while the database is down is bounded by the
 *    quota configured on Google's side, which is the authoritative limit.
 */
export function createSharedSpendCap(options: SharedSpendCapOptions): SharedSpendCap {
  const now = options.now ?? Date.now;
  let exhaustedForDay = '';

  return {
    async tryConsume() {
      const day = new Date(now()).toISOString().slice(0, 10);
      if (exhaustedForDay === day) return false;

      try {
        const total = await options.increment(`${options.api}:${day}`);
        if (total > options.dailyLimit) {
          exhaustedForDay = day;
          return false;
        }
        return true;
      } catch {
        return true;
      }
    },
  };
}

export type TtlCache<T> = {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
};

/**
 * Small time-boxed cache, used to collapse repeated identical lookups.
 *
 * Autocomplete is billed per request, and the same prefix gets requested over
 * and over — a homeowner correcting a typo, two people on the same street, a
 * retry after a dropped connection. Serving those from memory cuts spend on
 * legitimate traffic, which the rate limiter alone does not do.
 */
export function createTtlCache<T>(
  ttlMs: number,
  maxEntries = 500,
  now: () => number = Date.now
): TtlCache<T> {
  const entries = new Map<string, { value: T; expiresAt: number }>();

  return {
    get(key) {
      const found = entries.get(key);
      if (!found) return undefined;
      if (found.expiresAt <= now()) {
        entries.delete(key);
        return undefined;
      }
      return found.value;
    },
    set(key, value) {
      if (entries.size >= maxEntries) {
        const at = now();
        for (const [k, v] of entries) if (v.expiresAt <= at) entries.delete(k);
        // Still full of live entries — evict the oldest inserted, which is the
        // first key Map iteration yields.
        if (entries.size >= maxEntries) {
          const oldest = entries.keys().next().value;
          if (oldest !== undefined) entries.delete(oldest);
        }
      }
      entries.set(key, { value, expiresAt: now() + ttlMs });
    },
  };
}
