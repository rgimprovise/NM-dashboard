/**
 * Cache Manager
 * 
 * In-memory cache для API данных с поддержкой:
 * - TTL (Time To Live) для автоматического истечения
 * - Дедупликация данных (ключи включают все параметры)
 * - Автоматическая очистка устаревших записей
 * - Паттерн-based удаление (например, все VK кэши)
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout;
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  };

  constructor() {
    try {
      // Автоочистка устаревших записей каждые 5 минут
      // Check if setInterval is available (may not be in all environments)
      if (typeof setInterval !== 'undefined') {
        this.cleanupInterval = setInterval(() => {
          this.cleanup();
        }, 5 * 60 * 1000);
      }
      console.log('🗄️  Cache Manager initialized');
    } catch (error) {
      console.warn('⚠️ Cache Manager initialization warning:', error instanceof Error ? error.message : String(error));
      // Continue without cleanup interval
    }
  }

  /**
   * Получить данные из кэша
   * Возвращает null если данных нет или они устарели
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // Проверка TTL
    const now = Date.now();
    const age = now - entry.timestamp;
    
    if (age > entry.ttl) {
      // Данные устарели, удаляем
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return entry.data as T;
  }

  /**
   * Сохранить данные в кэш
   */
  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      key,
    });
    this.stats.sets++;
  }

  /**
   * Удалить конкретную запись
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }

  /**
   * Удалить все записи, содержащие паттерн
   * Например: deletePattern('vk:') удалит все VK кэши
   */
  deletePattern(pattern: string): number {
    let deleted = 0;
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        deleted++;
        this.stats.deletes++;
      }
    }
    
    if (deleted > 0) {
      console.log(`🗑️  Deleted ${deleted} cache entries matching "${pattern}"`);
    }
    
    return deleted;
  }

  /**
   * Очистить весь кэш
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.deletes += size;
    console.log(`🗑️  Cache cleared: ${size} entries`);
  }

  /**
   * Автоматическая очистка устаревших записей
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cache cleanup: удалено ${cleaned} устаревших записей`);
    }
  }

  /**
   * Получить статистику кэша
   */
  getStats() {
    const entries = Array.from(this.cache.values());
    const now = Date.now();
    
    return {
      totalEntries: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: this.stats.hits + this.stats.misses > 0 
        ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2) + '%'
        : '0%',
      sets: this.stats.sets,
      deletes: this.stats.deletes,
      oldestEntry: entries.length > 0 
        ? Math.min(...entries.map(e => e.timestamp))
        : null,
      newestEntry: entries.length > 0
        ? Math.max(...entries.map(e => e.timestamp))
        : null,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Оценка используемой памяти (приблизительно)
   */
  private estimateMemoryUsage(): string {
    const entries = Array.from(this.cache.values());
    let totalSize = 0;
    
    for (const entry of entries) {
      // Приблизительная оценка размера в байтах
      const jsonSize = JSON.stringify(entry.data).length;
      totalSize += jsonSize;
    }
    
    // Конвертация в человекочитаемый формат
    if (totalSize < 1024) return `${totalSize} B`;
    if (totalSize < 1024 * 1024) return `${(totalSize / 1024).toFixed(2)} KB`;
    return `${(totalSize / (1024 * 1024)).toFixed(2)} MB`;
  }

  /**
   * Получить детальную информацию о всех записях
   */
  getDetailedInfo() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => {
      const age = now - entry.timestamp;
      const remaining = entry.ttl - age;
      
      return {
        key,
        age: `${Math.floor(age / 1000)}s`,
        remaining: remaining > 0 ? `${Math.floor(remaining / 1000)}s` : 'expired',
        size: JSON.stringify(entry.data).length,
      };
    });
    
    return entries;
  }

  /**
   * Деструктор (вызывается при завершении процесса)
   */
  destroy(): void {
    try {
      if (this.cleanupInterval && typeof clearInterval !== 'undefined') {
        clearInterval(this.cleanupInterval);
      }
      this.cache.clear();
      console.log('🗄️  Cache Manager destroyed');
    } catch (error) {
      console.warn('⚠️ Cache Manager destroy warning:', error instanceof Error ? error.message : String(error));
    }
  }
}

// Singleton instance
export const cacheManager = new CacheManager();

// TTL константы (в миллисекундах)
export const CACHE_TTL = {
  // Yandex данные
  YANDEX_ORDERS: 5 * 60 * 1000,      // 5 минут (часто меняются)
  YANDEX_PRODUCTS: 30 * 60 * 1000,   // 30 минут (редко меняются)
  YANDEX_CAMPAIGNS: 60 * 60 * 1000,  // 1 час (статичные)
  YANDEX_STOCKS: 15 * 60 * 1000,     // 15 минут
  
  // VK данные
  VK_CAMPAIGNS: 15 * 60 * 1000,      // 15 минут
  VK_AD_PLANS: 30 * 60 * 1000,       // 30 минут (редко меняются)
  VK_AD_GROUPS: 15 * 60 * 1000,      // 15 минут
  VK_BANNERS: 15 * 60 * 1000,        // 15 минут
  VK_STATISTICS: 10 * 60 * 1000,     // 10 минут (часто обновляются)
  
  // Агрегированные данные (короткий TTL, т.к. зависят от других данных)
  DASHBOARD_SUMMARY: 5 * 60 * 1000,  // 5 минут
  TOP_PRODUCTS: 10 * 60 * 1000,      // 10 минут
};

// Graceful shutdown (only in Node.js environment)
if (typeof process !== 'undefined' && process.on) {
  try {
    process.on('SIGINT', () => {
      cacheManager.destroy();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      cacheManager.destroy();
      process.exit(0);
    });
  } catch (error) {
    // Ignore errors in environments that don't support process signals
    console.warn('⚠️ Could not register process signal handlers');
  }
}

