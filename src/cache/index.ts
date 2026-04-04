interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class Cache {
  private readonly store = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  /** Remove all expired entries (call periodically if needed). */
  purgeExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }
}

// Shared singleton across all tools
export const cache = new Cache();

// TTLs in seconds
export const TTL = {
  companies: Number(process.env['CACHE_TTL_COMPANIES'] ?? 300),
  services: 300,
  availableDates: 60,
  sessions: 30,
  customFields: 120,
} as const;
