/**
 * Cache Manager Service
 * ניהול חכם של cache עם TTL (Time To Live)
 * 
 * תפקיד: לוודא שנתונים מקומיים לא ישנים מדי
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  forceRefresh?: boolean;
}

export class CacheManager {
  // Cache expires after 5 minutes by default
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  
  /**
   * שמירת נתונים ל-cache עם timestamp
   */
  static set<T>(key: string, data: T, version: string = '1.0'): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version
    };
    
    try {
      localStorage.setItem(key, JSON.stringify(entry));
      console.log(`✅ Cache saved: ${key} (version: ${version})`);
    } catch (error) {
      console.error('Failed to save to cache:', error);
    }
  }

  /**
   * קריאת נתונים מ-cache עם בדיקת תקינות
   */
  static get<T>(key: string, options: CacheOptions = {}): T | null {
    const { ttl = this.DEFAULT_TTL, forceRefresh = false } = options;
    
    // אם מבוקש refresh מאולץ, לא מחזירים cache
    if (forceRefresh) {
      console.log(`🔄 Force refresh requested for: ${key}`);
      return null;
    }

    try {
      const cached = localStorage.getItem(key);
      if (!cached) {
        console.log(`📭 No cache found for: ${key}`);
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(cached);
      const age = Date.now() - entry.timestamp;

      // בדיקה אם ה-cache פג תוקף
      if (age > ttl) {
        console.log(`⏰ Cache expired for: ${key} (age: ${Math.round(age / 1000)}s, ttl: ${Math.round(ttl / 1000)}s)`);
        this.remove(key);
        return null;
      }

      console.log(`✅ Cache hit: ${key} (age: ${Math.round(age / 1000)}s, version: ${entry.version})`);
      return entry.data;
    } catch (error) {
      console.error('Failed to read from cache:', error);
      return null;
    }
  }

  /**
   * מחיקת cache
   */
  static remove(key: string): void {
    localStorage.removeItem(key);
    console.log(`🗑️ Cache removed: ${key}`);
  }

  /**
   * ניקוי כל ה-cache
   */
  static clear(): void {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => 
      key.startsWith('mirpeset-') || 
      key === 'recordings'
    );
    
    cacheKeys.forEach(key => localStorage.removeItem(key));
    console.log(`🧹 Cleared ${cacheKeys.length} cache entries`);
  }

  /**
   * בדיקה האם cache תקף
   */
  static isValid(key: string, ttl: number = this.DEFAULT_TTL): boolean {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return false;

      const entry: CacheEntry<any> = JSON.parse(cached);
      const age = Date.now() - entry.timestamp;
      
      return age <= ttl;
    } catch {
      return false;
    }
  }

  /**
   * קבלת גיל ה-cache (בשניות)
   */
  static getAge(key: string): number | null {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const entry: CacheEntry<any> = JSON.parse(cached);
      return Math.round((Date.now() - entry.timestamp) / 1000);
    } catch {
      return null;
    }
  }

  /**
   * עדכון timestamp בלבד (refresh the cache timer)
   */
  static touch(key: string): void {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return;

      const entry: CacheEntry<any> = JSON.parse(cached);
      entry.timestamp = Date.now();
      localStorage.setItem(key, JSON.stringify(entry));
      console.log(`👆 Cache touched: ${key}`);
    } catch (error) {
      console.error('Failed to touch cache:', error);
    }
  }
}

export default CacheManager;
