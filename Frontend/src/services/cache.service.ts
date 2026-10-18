/**
 * AgriFlux High-Performance Memory & Local Storage Caching Service
 * Optimizes memory consumption, eliminates redundant API calls, and preserves working page state.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

class CacheService {
  private static instance: CacheService;
  private memoryCache: Map<string, CacheEntry<unknown>> = new Map();
  private maxMemoryEntries: number = 100;

  private constructor() {
    // Periodic garbage collector every 5 minutes to release stale memory
    setInterval(
      () => {
        this.evictExpired();
      },
      5 * 60 * 1000
    );
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Set in-memory cache with configurable TTL (default 5 minutes)
   */
  public set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    if (this.memoryCache.size >= this.maxMemoryEntries) {
      // LRU Eviction: delete oldest entry
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) this.memoryCache.delete(oldestKey);
    }

    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttlMs,
    });
  }

  /**
   * Get cached data if not expired
   */
  public get<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttlMs) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if cache has valid key
   */
  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Invalidate specific key or prefix pattern
   */
  public invalidate(keyOrPrefix: string): void {
    for (const key of this.memoryCache.keys()) {
      if (key === keyOrPrefix || key.startsWith(keyOrPrefix)) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Persist user working state / form draft to SessionStorage (survives tab navigation)
   */
  public setDraft<T>(pageKey: string, draftData: T): void {
    try {
      sessionStorage.setItem(`agriflux_draft_${pageKey}`, JSON.stringify(draftData));
    } catch (e) {
      console.warn('Draft persistence warning:', e);
    }
  }

  /**
   * Retrieve working state / form draft
   */
  public getDraft<T>(pageKey: string): T | null {
    try {
      const item = sessionStorage.getItem(`agriflux_draft_${pageKey}`);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  /**
   * Clear working draft after submission
   */
  public clearDraft(pageKey: string): void {
    try {
      sessionStorage.removeItem(`agriflux_draft_${pageKey}`);
    } catch {
      /* ignore */
    }
  }

  /**
   * Evict all expired memory entries
   */
  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttlMs) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Clear all memory cache
   */
  public clearAll(): void {
    this.memoryCache.clear();
  }
}

export const cacheService = CacheService.getInstance();
