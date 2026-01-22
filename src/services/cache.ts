interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

export class Cache<T> {
    private cache: Map<string, CacheEntry<T>> = new Map();
    private defaultTtl: number;

    constructor(defaultTtlMs: number = 30000) {
        this.defaultTtl = defaultTtlMs;
    }

    set(key: string, value: T, ttlMs?: number): void {
        const ttl = ttlMs ?? this.defaultTtl;
        const expiresAt = Date.now() + ttl;
        this.cache.set(key, { data: value, expiresAt });
    }

    get(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        // Check if entry has expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) {
            return false;
        }

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    delete(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    // Clean up expired entries
    cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
            }
        }
    }

    // Get cache statistics
    getStats(): { size: number; entries: number } {
        this.cleanup();
        return {
            size: this.cache.size,
            entries: this.cache.size,
        };
    }
}
