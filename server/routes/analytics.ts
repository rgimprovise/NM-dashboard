/**
 * API routes для аналитики
 * 
 * Предоставляет агрегированные данные из всех источников (VK, Yandex, 1C)
 * в формате, удобном для построения воронок и KPI
 */

import { RequestHandler } from "express";
import { getPeriodRange, type PeriodCode } from "../../shared/utils/periods";
import { getFactsAndDimsForPeriod } from "../services/dataWarehouse";
import {
  calcCtr,
  calcCpc,
  calcCpm,
  calcRoas,
  calcConversionRate,
  calcAov,
} from "../../shared/utils/metrics";
import {
  loadOneCProducts,
  loadOneCSalesMargin,
  loadOneCReturns,
} from "../services/oneCDataLoader";
import { toFactYandexOrders } from "../services/yandexNormalizer";
import { toFactVkAds } from "../services/vkNormalizer";
import * as yandexRoutes from "./yandex";
import * as vkRoutes from "./vk";

/**
 * GET /api/analytics/funnel?period=7d|30d|90d|ytd
 * Возвращает сквозную воронку с агрегированными данными и KPI
 */
export const getFunnel: RequestHandler = async (req, res) => {
  try {
    const { period = "30d" } = req.query;
    const periodCode = period as PeriodCode;
    
    if (!["7d", "30d", "90d", "ytd"].includes(periodCode)) {
      return res.status(400).json({
        success: false,
        error: "Invalid period. Must be one of: 7d, 30d, 90d, ytd",
      });
    }

    const periodRange = getPeriodRange(periodCode);

    // Загружаем данные из всех источников
    // TODO: Интегрировать загрузку Yandex и VK через их API endpoints
    // Пока используем упрощенный подход через прямые вызовы
    
    // Загружаем 1C данные через dataWarehouse
    const warehouseData = await getFactsAndDimsForPeriod(periodRange, {
      includeYandex: false,
      includeVK: false,
      include1C: true,
    });

    // Загружаем Yandex и VK данные через прямые вызовы функций
    let yandexOrders: any[] = [];
    let vkStats: any[] = [];

    try {
      // Прямой вызов функции getOrders из yandex.ts
      const mockReq = {
        query: {
          date_from: periodRange.dateFrom,
          date_to: periodRange.dateTo,
        },
      } as any;
      
      let yandexData: any = null;
      const mockRes = {
        json: (data: any) => {
          yandexData = data;
        },
      } as any;
      
      await yandexRoutes.getOrders(mockReq, mockRes, () => {});
      
      if (yandexData?.success && yandexData?.data) {
        yandexOrders = yandexData.data;
        console.log(`✅ Analytics: получено ${yandexOrders.length} заказов Yandex`);
      }
    } catch (error) {
      console.warn("Failed to fetch Yandex orders for funnel:", error);
    }

    try {
      // Прямой вызов функции getStatistics из vk.ts
      const mockReq = {
        query: {
          date_from: periodRange.dateFrom,
          date_to: periodRange.dateTo,
        },
      } as any;
      
      let vkData: any = null;
      const mockRes = {
        json: (data: any) => {
          vkData = data;
        },
      } as any;
      
      await vkRoutes.getStatistics(mockReq, mockRes, () => {});
      
      if (vkData?.success) {
        // VK statistics возвращает { data: [{ date, shows, clicks, spent, ... }], total: {...} }
        // data уже преобразован в плоский массив по дням в vk.ts
        if (Array.isArray(vkData.data)) {
          vkStats = vkData.data;
          console.log(`✅ Analytics: получено ${vkStats.length} записей статистики VK (плоский массив по дням)`);
        } else if (vkData.data && Array.isArray(vkData.data.items)) {
          // Fallback: если формат старый (items[])
          vkStats = vkData.data.items;
          console.log(`✅ Analytics: получено ${vkStats.length} записей статистики VK (формат items)`);
        } else if (vkData.total) {
          // Если есть только total, создаем один объект статистики
          vkStats = [{
            date: periodRange.dateFrom,
            shows: vkData.total.shows || 0,
            clicks: vkData.total.clicks || 0,
            spent: vkData.total.spent || 0,
          }];
          console.log(`✅ Analytics: использован total из VK статистики`);
        }
        
        // Логируем агрегированные данные для диагностики
        if (vkStats.length > 0) {
          const totalShows = vkStats.reduce((sum, s: any) => sum + (s.shows || s.impressions || 0), 0);
          const totalClicks = vkStats.reduce((sum, s: any) => sum + (s.clicks || 0), 0);
          const totalSpent = vkStats.reduce((sum, s: any) => sum + (s.spent || s.spend || 0), 0);
          console.log(`📊 Analytics VK агрегация: ${totalShows} показов, ${totalClicks} кликов, ${totalSpent}₽ расходов`);
        }
      }
    } catch (error) {
      console.warn("Failed to fetch VK stats for funnel:", error);
    }

    // Нормализуем данные в факты
    const factYandexOrders = toFactYandexOrders(yandexOrders);
    const factVkAds = toFactVkAds(vkStats);

    // Агрегируем VK данные
    const vkAggregated = factVkAds.reduce(
      (acc, ad) => {
        acc.impressions += ad.impressions;
        acc.clicks += ad.clicks;
        acc.spend += ad.spend;
        return acc;
      },
      { impressions: 0, clicks: 0, spend: 0 }
    );

    // Агрегируем Yandex данные
    const yandexAggregated = factYandexOrders.reduce(
      (acc, order) => {
        acc.orders += 1;
        acc.revenue += order.revenue;
        return acc;
      },
      { orders: 0, revenue: 0 }
    );

    // Агрегируем 1C данные
    const oneCAggregated = warehouseData.facts.oneCSales.reduce(
      (acc, sale) => {
        acc.orders += 1;
        acc.revenue += sale.revenue;
        return acc;
      },
      { orders: 0, revenue: 0 }
    );

    // Суммируем маржу из 1C
    const oneCMargin = warehouseData.facts.oneCMargins.reduce(
      (sum, margin) => sum + margin.margin,
      0
    );

    // Рассчитываем KPI
    const totalRevenue = yandexAggregated.revenue + oneCAggregated.revenue;
    const totalOrders = yandexAggregated.orders + oneCAggregated.orders;
    const totalAdSpend = vkAggregated.spend;

    const kpi = {
      ctr: calcCtr(vkAggregated.impressions, vkAggregated.clicks),
      cpc: calcCpc(vkAggregated.spend, vkAggregated.clicks),
      cpm: calcCpm(vkAggregated.spend, vkAggregated.impressions),
      roas: calcRoas(totalRevenue, totalAdSpend),
      conversionRate: calcConversionRate(totalOrders, vkAggregated.clicks),
      aov: calcAov(totalRevenue, totalOrders),
    };

    return res.json({
      success: true,
      data: {
        periodLabel: periodRange.label,
        vk: {
          impressions: vkAggregated.impressions,
          clicks: vkAggregated.clicks,
          spend: vkAggregated.spend,
        },
        yandex: {
          orders: yandexAggregated.orders,
          revenue: yandexAggregated.revenue,
        },
        oneC: {
          orders: oneCAggregated.orders,
          revenue: oneCAggregated.revenue,
          margin: oneCMargin > 0 ? oneCMargin : undefined,
        },
        kpi,
      },
    });
  } catch (error) {
    console.error("Analytics getFunnel error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to load funnel data",
    });
  }
};

/**
 * GET /api/analytics/data-quality
 * Возвращает отчет о качестве данных 1C
 */
export const getDataQuality: RequestHandler = async (req, res) => {
  try {
    const [products, sales, returns] = await Promise.all([
      loadOneCProducts().catch(() => []),
      loadOneCSalesMargin().catch(() => []),
      loadOneCReturns().catch(() => []),
    ]);

    // Анализ качества данных продуктов
    const missingArticle = products.filter(p => !p.article || p.article.trim() === "");
    const missingPrice = products.filter(p => !p.retailPrice || p.retailPrice <= 0);
    const zeroOrNegativeStock = products.filter(p => p.stock <= 0);

    // Проверка дубликатов артикулов
    const articleMap = new Map<string, number>();
    products.forEach(p => {
      if (p.article && p.article.trim()) {
        const key = p.article.toLowerCase().trim();
        articleMap.set(key, (articleMap.get(key) || 0) + 1);
      }
    });
    const duplicateArticles = Array.from(articleMap.entries())
      .filter(([_, count]) => count > 1)
      .map(([article, count]) => ({ article, count }));

    // Примеры проблемных записей (первые 10)
    const missingArticleExamples = missingArticle.slice(0, 10).map(p => ({
      name: p.name,
      article: p.article || "(пусто)",
    }));

    const missingPriceExamples = missingPrice.slice(0, 10).map(p => ({
      name: p.name,
      article: p.article,
      retailPrice: p.retailPrice,
    }));

    const duplicateArticleExamples = duplicateArticles.slice(0, 10).map(({ article, count }) => {
      const examples = products.filter(p => p.article?.toLowerCase().trim() === article).slice(0, 3);
      return {
        article,
        count,
        examples: examples.map(p => p.name),
      };
    });

    return res.json({
      success: true,
      data: {
        products: {
          total: products.length,
          missingArticleCount: missingArticle.length,
          missingPriceCount: missingPrice.length,
          zeroOrNegativeStockCount: zeroOrNegativeStock.length,
          duplicateArticleCount: duplicateArticles.length,
          examples: {
            missingArticle: missingArticleExamples,
            missingPrice: missingPriceExamples,
            duplicateArticles: duplicateArticleExamples,
          },
        },
        sales: {
          total: sales.length,
          withMissingData: sales.filter(s => !s.documentNumber || !s.date).length,
        },
        returns: {
          total: returns.length,
          withMissingData: returns.filter(r => !r.documentNumber || !r.date).length,
        },
      },
    });
  } catch (error) {
    console.error("Analytics getDataQuality error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to analyze data quality",
    });
  }
};

