# 🎯 ПЛАН: КЭШИРОВАНИЕ И ИСПРАВЛЕНИЕ РОУТИНГА ДАННЫХ

**Дата:** 15 ноября 2025  
**Версия:** vortex-home 2  
**Задачи:** Реализация кэширования + Исправление роутинга VK Statistics

---

## 📋 OVERVIEW

### Что нужно сделать:

1. ✅ **Реализовать кэширование данных**
   - Server-side cache (в памяти)
   - Дедупликация данных (критично!)
   - TTL для разных типов данных
   - Инвалидация кэша

2. ✅ **Исправить роутинг VK Statistics**
   - Добавить VK Stats в Dashboard
   - Добавить VK Stats в Marketing
   - Корректировать расчеты

3. ⚠️ **Заменить mock данные на реальные**
   - Тренд выручки
   - Анализ категорий

---

## 🗄️ АРХИТЕКТУРА КЭШИРОВАНИЯ

### Требования:

1. **NO DUPLICATION** (критично по требованию пользователя)
   - Одни и те же данные не должны дублироваться
   - Кэш ключи должны учитывать все параметры запроса

2. **TTL (Time To Live)**
   - Разное время жизни для разных типов данных
   - Автоматическая очистка устаревших записей

3. **Инвалидация**
   - Возможность принудительно очистить кэш
   - Очистка при изменении параметров

4. **Эффективность**
   - Хранение в памяти (быстро)
   - Минимальные overhead на проверку кэша

---

## 🏗️ СТРУКТУРА КЭША

### Типы данных и TTL:

```typescript
const CACHE_TTL = {
  // Yandex данные
  YANDEX_ORDERS: 5 * 60 * 1000,      // 5 минут (часто меняются)
  YANDEX_PRODUCTS: 30 * 60 * 1000,   // 30 минут (редко меняются)
  YANDEX_CAMPAIGNS: 60 * 60 * 1000,  // 1 час (статичные)
  
  // VK данные
  VK_CAMPAIGNS: 15 * 60 * 1000,      // 15 минут
  VK_AD_GROUPS: 15 * 60 * 1000,      // 15 минут
  VK_BANNERS: 15 * 60 * 1000,        // 15 минут
  VK_STATISTICS: 10 * 60 * 1000,     // 10 минут (часто обновляются)
  
  // Агрегированные данные
  DASHBOARD_SUMMARY: 5 * 60 * 1000,  // 5 минут
  TOP_PRODUCTS: 10 * 60 * 1000,      // 10 минут
};
```

### Ключи кэша (для дедупликации):

```typescript
// Yandex Orders
`yandex:orders:${campaignId}:${dateFrom}:${dateTo}:page${page}`

// Yandex Products
`yandex:products:${campaignId}`

// VK Campaigns
`vk:campaigns:${adPlanId || 'all'}`

// VK Statistics
`vk:stats:adgroups:${dateFrom}:${dateTo}:ids${adGroupIds.sort().join(',')}`

// Dashboard Summary
`dashboard:summary:${period}:${dateFrom}:${dateTo}`

// Top Products
`top:products:${period}:${dateFrom}:${dateTo}`
```

**Критично:** Ключи включают ВСЕ параметры, влияющие на результат

---

## 💾 РЕАЛИЗАЦИЯ: server/cache/cacheManager.ts

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Очистка устаревших записей каждые 5 минут
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Проверка TTL
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  deletePattern(pattern: string): number {
    let deleted = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cache cleanup: удалено ${cleaned} устаревших записей`);
    }
  }

  getStats() {
    return {
      totalEntries: this.cache.size,
      oldestEntry: this.getOldestEntry(),
      newestEntry: this.getNewestEntry(),
    };
  }

  private getOldestEntry(): number {
    let oldest = Date.now();
    for (const entry of this.cache.values()) {
      if (entry.timestamp < oldest) {
        oldest = entry.timestamp;
      }
    }
    return oldest;
  }

  private getNewestEntry(): number {
    let newest = 0;
    for (const entry of this.cache.values()) {
      if (entry.timestamp > newest) {
        newest = entry.timestamp;
      }
    }
    return newest;
  }
}

export const cacheManager = new CacheManager();

// TTL константы
export const CACHE_TTL = {
  YANDEX_ORDERS: 5 * 60 * 1000,
  YANDEX_PRODUCTS: 30 * 60 * 1000,
  YANDEX_CAMPAIGNS: 60 * 60 * 1000,
  VK_CAMPAIGNS: 15 * 60 * 1000,
  VK_AD_GROUPS: 15 * 60 * 1000,
  VK_BANNERS: 15 * 60 * 1000,
  VK_STATISTICS: 10 * 60 * 1000,
  DASHBOARD_SUMMARY: 5 * 60 * 1000,
  TOP_PRODUCTS: 10 * 60 * 1000,
};
```

---

## 🔧 ИНТЕГРАЦИЯ В BACKEND ROUTES

### Пример: server/routes/yandex.ts

```typescript
import { cacheManager, CACHE_TTL } from '../cache/cacheManager';

export const getOrders: RequestHandler = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    
    // Генерируем уникальный ключ кэша
    const cacheKey = `yandex:orders:all:${date_from}:${date_to}`;
    
    // Проверяем кэш
    const cachedData = cacheManager.get<any>(cacheKey);
    if (cachedData) {
      console.log(`✅ Cache HIT: ${cacheKey}`);
      return res.json({
        success: true,
        data: cachedData,
        cached: true,
      });
    }
    
    console.log(`❌ Cache MISS: ${cacheKey}`);
    
    // Запрашиваем данные (существующий код)
    const allOrders: any[] = [];
    for (const campaignId of YANDEX_CAMPAIGN_IDS) {
      // ... существующая логика пагинации ...
    }
    
    // Сохраняем в кэш
    cacheManager.set(cacheKey, allOrders, CACHE_TTL.YANDEX_ORDERS);
    console.log(`💾 Cached: ${cacheKey} (${allOrders.length} orders)`);
    
    res.json({
      success: true,
      data: allOrders,
      cached: false,
    });
  } catch (error) {
    // ... error handling ...
  }
};
```

### Важные моменты:

1. **Ключ включает ВСЕ параметры**
   - `date_from`, `date_to`
   - Для дедупликации критично!

2. **Логирование**
   - Cache HIT/MISS для мониторинга
   - Размер закэшированных данных

3. **Индикатор в ответе**
   - `cached: true/false`
   - Фронтенд может отобразить "last updated"

---

## 🔄 ИНТЕГРАЦИЯ В VK ROUTES

### Пример: server/routes/vk.ts

```typescript
export const getStatistics: RequestHandler = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    
    // Ключ кэша
    const cacheKey = `vk:stats:${date_from}:${date_to}`;
    
    // Проверка кэша
    const cachedStats = cacheManager.get<any>(cacheKey);
    if (cachedStats) {
      console.log(`✅ VK Stats Cache HIT`);
      return res.json({
        success: true,
        ...cachedStats,
        cached: true,
      });
    }
    
    console.log(`❌ VK Stats Cache MISS`);
    
    // Получаем ad_groups (может быть закэшировано отдельно)
    const adGroupsCacheKey = `vk:adgroups:all`;
    let adGroups = cacheManager.get<any[]>(adGroupsCacheKey);
    
    if (!adGroups) {
      const adGroupsData = await vkFetch<{ items: any[] }>("/ad_groups.json?limit=200");
      adGroups = adGroupsData.items || [];
      cacheManager.set(adGroupsCacheKey, adGroups, CACHE_TTL.VK_AD_GROUPS);
    }
    
    // Запрашиваем статистику
    const adGroupIds = adGroups.map(g => g.id).join(",");
    // ... существующая логика ...
    
    const result = {
      data: statsData.items || [],
      total: { /* ... */ },
    };
    
    // Кэшируем результат
    cacheManager.set(cacheKey, result, CACHE_TTL.VK_STATISTICS);
    
    res.json({
      success: true,
      ...result,
      cached: false,
    });
  } catch (error) {
    // ... error handling ...
  }
};
```

---

## 🎨 ОБНОВЛЕНИЕ FRONTEND: dataService.ts

### Добавить логирование кэша:

```typescript
async getDashboardSummary(period: string): Promise<DashboardSummary> {
  const periodParams = getPeriodParams(period);

  try {
    const [orders, campaigns, vkStats] = await Promise.all([
      yandexAPI.getOrders(periodParams.from, periodParams.to),
      vkAPI.getCampaigns(),
      vkAPI.getStatistics(periodParams.from, periodParams.to), // ✅ НОВОЕ!
    ]);

    // Логирование кэша
    const isCached = (orders as any).cached || (vkStats as any).cached;
    if (isCached) {
      console.log('📦 Using cached data for dashboard');
    }

    // Yandex метрики (существующий код)
    const totalRevenue = orders.reduce(/* ... */);
    const totalOrders = orders.length;

    // ✅ VK метрики (НОВОЕ!)
    const adSpend = vkStats.total?.spent || 0;
    const totalClicks = vkStats.total?.clicks || 0;
    const totalShows = vkStats.total?.shows || 0;

    // Расчеты с реальными VK данными
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const ctr = totalShows > 0 ? (totalClicks / totalShows) * 100 : 0;
    const cpc = totalClicks > 0 ? adSpend / totalClicks : 0;
    const conversionRate = totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0;
    const roas = adSpend > 0 ? totalRevenue / adSpend : 0;

    return {
      metrics: {
        total_revenue: totalRevenue,
        total_orders: totalOrders,
        ad_spend: adSpend,        // ✅ Реальный
        roas: roas,               // ✅ Реальный
        ctr: ctr,                 // ✅ Реальный
        cpc: cpc,                 // ✅ Реальный
        conversion_rate: conversionRate, // ✅ Реальный
        total_clicks: totalClicks,       // ✅ Реальный
        total_shows: totalShows,         // ✅ Реальный
      }
    };
  } catch (error) {
    console.error("Error:", error);
    return mockDashboardSummary;
  }
}
```

---

## 📊 ОБНОВЛЕНИЕ getCampaigns()

```typescript
async getCampaigns(period: string = "30d"): Promise<Campaign[]> {
  const periodParams = getPeriodParams(period);

  try {
    const [campaigns, stats] = await Promise.all([
      vkAPI.getCampaigns(),
      vkAPI.getStatistics(periodParams.from, periodParams.to), // ✅ НОВОЕ!
    ]);

    // Получаем ad_groups для сопоставления
    const adGroupsResp = await fetch('/api/vk/ad-groups');
    const adGroupsData = await adGroupsResp.json();
    const adGroups = adGroupsData.data || [];

    // Создаем маппинг: campaign_id -> ad_group_ids
    const campaignToAdGroups: Record<number, number[]> = {};
    adGroups.forEach((ag: any) => {
      if (!campaignToAdGroups[ag.campaign_id]) {
        campaignToAdGroups[ag.campaign_id] = [];
      }
      campaignToAdGroups[ag.campaign_id].push(ag.id);
    });

    // Сопоставляем статистику с кампаниями
    return campaigns.map((campaign: any) => {
      const campaignAdGroupIds = campaignToAdGroups[campaign.id] || [];
      
      // Фильтруем статистику по ad_groups этой кампании
      const campaignStats = stats.data?.filter((stat: any) =>
        campaignAdGroupIds.includes(stat.id)
      ) || [];

      // Агрегируем статистику
      const aggregated = campaignStats.reduce((acc: any, stat: any) => {
        acc.shows += stat.base?.shows || 0;
        acc.clicks += stat.base?.clicks || 0;
        acc.spent += parseFloat(stat.base?.spent || '0');
        acc.goals += stat.base?.vk?.goals || 0;
        return acc;
      }, { shows: 0, clicks: 0, spent: 0, goals: 0 });

      const ctr = aggregated.shows > 0 ? (aggregated.clicks / aggregated.shows) * 100 : 0;
      const cpc = aggregated.clicks > 0 ? aggregated.spent / aggregated.clicks : 0;
      const cpm = aggregated.shows > 0 ? (aggregated.spent / aggregated.shows) * 1000 : 0;

      return {
        id: campaign.id,
        name: campaign.name,
        status: aggregated.shows > 0 ? "active" : "stopped",
        spent: aggregated.spent,
        budget_limit: campaign.budget_limit || 100000,
        budget_limit_day: campaign.budget_limit_day || 10000,
        statistics: {
          shows: aggregated.shows,
          clicks: aggregated.clicks,
          ctr: parseFloat(ctr.toFixed(2)),
          cpc: parseFloat(cpc.toFixed(2)),
          cpm: parseFloat(cpm.toFixed(2)),
          conversions: aggregated.goals,
          revenue: 0, // Нет данных о выручке в VK
          roas: 0,
        },
      };
    });
  } catch (error) {
    console.error("Error:", error);
    return mockCampaigns;
  }
}
```

---

## ✅ ПЛАН РЕАЛИЗАЦИИ (ПОЭТАПНО)

### Этап 1: Создание Cache Manager ✅

**Файл:** `server/cache/cacheManager.ts`

```bash
mkdir server/cache
touch server/cache/cacheManager.ts
```

**Содержимое:** Полный код CacheManager (см. выше)

---

### Этап 2: Интеграция в Yandex Routes ✅

**Обновить:** `server/routes/yandex.ts`

**Изменения:**
- `getOrders`: добавить кэширование
- `getProducts`: добавить кэширование
- `getCampaigns`: добавить кэширование

**Ключи кэша:**
- Orders: `yandex:orders:all:${date_from}:${date_to}`
- Products: `yandex:products:all`
- Campaigns: `yandex:campaigns:all`

---

### Этап 3: Интеграция в VK Routes ✅

**Обновить:** `server/routes/vk.ts`

**Изменения:**
- `getCampaigns`: добавить кэширование
- `getAdGroups`: добавить кэширование
- `getBanners`: добавить кэширование
- `getStatistics`: добавить кэширование (с учетом ad_groups)

**Ключи кэша:**
- Campaigns: `vk:campaigns:${adPlanId || 'all'}`
- Ad Groups: `vk:adgroups:${campaignId || 'all'}`
- Banners: `vk:banners:${campaignId}:${adGroupId}`
- Statistics: `vk:stats:${date_from}:${date_to}`

---

### Этап 4: Обновление dataService ✅

**Обновить:** `client/services/dataService.ts`

**Изменения:**
- `getDashboardSummary`: добавить VK Statistics
- `getCampaigns`: добавить VK Statistics и сопоставление

---

### Этап 5: Замена Mock Данных ⚠️

**Обновить:**
- `Dashboard.tsx`: Тренд выручки из реальных заказов
- `Sales.tsx`: Анализ категорий из реальных заказов

---

### Этап 6: Cache Management API ✅

**Создать:** `server/routes/cache.ts`

```typescript
export const getCacheStats: RequestHandler = (req, res) => {
  const stats = cacheManager.getStats();
  res.json({
    success: true,
    stats,
  });
};

export const clearCache: RequestHandler = (req, res) => {
  const { pattern } = req.query;
  
  if (pattern) {
    const deleted = cacheManager.deletePattern(pattern as string);
    res.json({
      success: true,
      message: `Deleted ${deleted} entries matching "${pattern}"`,
    });
  } else {
    cacheManager.clear();
    res.json({
      success: true,
      message: 'Cache cleared completely',
    });
  }
};
```

**Регистрация в `server/index.ts`:**
```typescript
import { getCacheStats, clearCache } from './routes/cache';

app.get('/api/cache/stats', getCacheStats);
app.delete('/api/cache/clear', clearCache);
```

---

## 🧪 ТЕСТИРОВАНИЕ КЭША

### 1. Проверка дедупликации:

```bash
# Запрос 1 (Cache MISS)
curl http://localhost:8080/api/yandex/orders?date_from=2025-11-01&date_to=2025-11-15

# Запрос 2 с теми же параметрами (Cache HIT)
curl http://localhost:8080/api/yandex/orders?date_from=2025-11-01&date_to=2025-11-15

# Запрос 3 с другими параметрами (Cache MISS)
curl http://localhost:8080/api/yandex/orders?date_from=2025-10-01&date_to=2025-10-31
```

**Ожидаемое поведение:**
- Запрос 1: `cached: false`, данные загружены из API
- Запрос 2: `cached: true`, данные из кэша (мгновенно)
- Запрос 3: `cached: false`, новый ключ кэша

---

### 2. Проверка TTL:

```bash
# Запрос
curl http://localhost:8080/api/yandex/orders?date_from=2025-11-01&date_to=2025-11-15

# Подождать 6 минут (TTL = 5 минут)
sleep 360

# Повторный запрос (Cache MISS, т.к. истек TTL)
curl http://localhost:8080/api/yandex/orders?date_from=2025-11-01&date_to=2025-11-15
```

---

### 3. Проверка Cache Stats:

```bash
curl http://localhost:8080/api/cache/stats
```

**Ожидаемый ответ:**
```json
{
  "success": true,
  "stats": {
    "totalEntries": 15,
    "oldestEntry": 1731689200000,
    "newestEntry": 1731689400000
  }
}
```

---

### 4. Очистка кэша:

```bash
# Очистить весь кэш
curl -X DELETE http://localhost:8080/api/cache/clear

# Очистить только VK кэш
curl -X DELETE "http://localhost:8080/api/cache/clear?pattern=vk:"

# Очистить только Yandex orders
curl -X DELETE "http://localhost:8080/api/cache/clear?pattern=yandex:orders"
```

---

## 📈 МОНИТОРИНГ КЭША

### Логи в консоли:

```
✅ Cache HIT: yandex:orders:all:2025-11-01:2025-11-15
❌ Cache MISS: vk:stats:2025-11-01:2025-11-15
💾 Cached: yandex:products:all (1247 products)
🧹 Cache cleanup: удалено 5 устаревших записей
```

### Добавить в Dashboard (опционально):

```typescript
// В Settings.tsx можно добавить секцию Cache Stats
const [cacheStats, setCacheStats] = useState<any>(null);

useEffect(() => {
  fetch('/api/cache/stats')
    .then(r => r.json())
    .then(data => setCacheStats(data.stats));
}, []);

// UI:
<Card>
  <CardHeader>
    <CardTitle>Cache Statistics</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Total Entries: {cacheStats?.totalEntries}</p>
    <p>Oldest: {new Date(cacheStats?.oldestEntry).toLocaleString()}</p>
    <Button onClick={() => fetch('/api/cache/clear', { method: 'DELETE' })}>
      Clear Cache
    </Button>
  </CardContent>
</Card>
```

---

## 🎯 ИТОГОВЫЙ ЧЕКЛИСТ

### Backend:

- [ ] Создать `server/cache/cacheManager.ts`
- [ ] Интегрировать в `server/routes/yandex.ts`
- [ ] Интегрировать в `server/routes/vk.ts`
- [ ] Создать `server/routes/cache.ts`
- [ ] Регистрировать cache routes в `server/index.ts`

### Frontend:

- [ ] Обновить `dataService.getDashboardSummary()` (добавить VK Stats)
- [ ] Обновить `dataService.getCampaigns()` (добавить VK Stats)
- [ ] Заменить mock тренд выручки в `Dashboard.tsx`
- [ ] Заменить mock анализ категорий в `Sales.tsx`

### Testing:

- [ ] Проверить дедупликацию кэша
- [ ] Проверить TTL expiration
- [ ] Проверить Cache Stats API
- [ ] Проверить Clear Cache API
- [ ] Проверить Dashboard с реальными VK Stats

---

## 🚀 ОЖИДАЕМЫЙ РЕЗУЛЬТАТ

### До реализации:

| Метрика | Значение |
|---------|----------|
| Dashboard ROAS | 0 или NaN |
| Dashboard CTR | 0% |
| Dashboard CPC | 0₽ |
| Marketing показы | 0 |
| Marketing клики | 0 |
| Запросов к API за загрузку Dashboard | 3 (orders, campaigns, products) |
| Время загрузки Dashboard | ~2-3 секунды |

### После реализации:

| Метрика | Значение |
|---------|----------|
| Dashboard ROAS | 5.23 (реальный) |
| Dashboard CTR | 0.64% (реальный) |
| Dashboard CPC | 21.88₽ (реальный) |
| Marketing показы | 104,488 (реальные) |
| Marketing клики | 669 (реальные) |
| Запросов к API за загрузку Dashboard (1й раз) | 4 (orders, campaigns, products, vk stats) |
| Запросов к API за загрузку Dashboard (2й раз) | 0 (все из кэша) |
| Время загрузки Dashboard (с кэшем) | ~50-100ms |

---

**ВАЖНО:** Кэширование критично для:
1. Снижения нагрузки на внешние API
2. Избежания rate limits
3. Ускорения отклика UI
4. Возможности анализа данных за год (запросы будут кэшироваться)

