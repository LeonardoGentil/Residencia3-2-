"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TTL = exports.cache = void 0;
class Cache {
    store = new Map();
    set(key, data, ttlSeconds) {
        this.store.set(key, {
            data,
            expiresAt: Date.now() + ttlSeconds * 1000,
        });
    }
    get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return entry.data;
    }
    invalidate(key) {
        this.store.delete(key);
    }
    /** Remove all expired entries (call periodically if needed). */
    purgeExpired() {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (now > entry.expiresAt)
                this.store.delete(key);
        }
    }
}
// Shared singleton across all tools
exports.cache = new Cache();
// TTLs in seconds
exports.TTL = {
    companies: Number(process.env['CACHE_TTL_COMPANIES'] ?? 300),
    services: 300,
    availableDates: 60,
    sessions: 30,
    customFields: 120,
};
