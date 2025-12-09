import { yandexAPI } from "./api/yandexClient";
import { vkAPI } from "./api/vkClient";
import {
  fetchOneCProducts,
  fetchOneCSales,
  fetchOneCReturns,
  fetchOneCStockTurnover,
} from "./api/oneCClient";
import {
  fetchFunnelSummary,
  fetchDataQualityReport,
  type FunnelSummary as AnalyticsFunnelSummary,
  type DataQualityReport,
} from "./api/analyticsClient";
import { DashboardSummary, Campaign, Order, TopProduct, Region } from "@/types/dashboard";
import {
  ProductSnapshot,
  OneCStockTurnoverRow,
  SalesSummaryByManager,
} from "../../shared/types/oneC";
import { mockDashboardSummary, mockTopProducts, mockOrders, mockCampaigns, mockProducts } from "@/lib/mockData";
import {
  calcAov,
  calcCtr,
  calcCpc,
  calcCpm,
  calcRoas,
  calcConversionRate,
  calcRevenueShare,
  calcAveragePrice,
} from "../../shared/utils/metrics";
import { getPeriodRange, type PeriodCode, type PeriodRange } from "../../shared/utils/periods";

/**
 * @deprecated Используйте PeriodRange из shared/utils/periods.ts
 * Оставлено для обратной совместимости
 */
export interface PeriodParams {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

/**
 * @deprecated Используйте getPeriodRange из shared/utils/periods.ts
 * Оставлено для обратной совместимости
 */
export function getPeriodParams(period: string): PeriodParams {
  const periodRange = getPeriodRange(period as PeriodCode);
  return {
    from: periodRange.dateFrom,
    to: periodRange.dateTo,
  };
}

/**
 * Сквозная воронка: агрегированные данные из всех источников
 */
export interface FunnelSummary {
  periodLabel: string;
  vk: {
    impressions: number;
    clicks: number;
    spend: number;
  };
  yandex: {
    orders: number;
    revenue: number;
  };
  oneC: {
    orders: number;
    revenue: number;
    margin?: number;
  };
  kpi: {
    ctr: number;
    cpc: number;
    cpm: number;
    roas: number;
    conversionRate: number;
    aov: number;
  };
}

export class DataService {
  async getDashboardSummary(period: string = "30d"): Promise<DashboardSummary> {
    const periodRange = getPeriodRange(period as PeriodCode);

    try {
      // Fetch current period data
      const [orders, campaigns] = await Promise.all([
        yandexAPI.getOrders(periodRange.dateFrom, periodRange.dateTo),
        vkAPI.getCampaigns(),
      ]);

      // If no orders, use mock data
      if (!orders || orders.length === 0) {
        console.warn("No orders from API, using mock data");
        return mockDashboardSummary;
      }

      // Calculate metrics from real data
      const totalRevenue = orders.reduce((sum, order) => {
        // New API returns buyerTotal, old format was total
        const orderTotal = (order as any).buyerTotal || order.total || 0;
        return sum + orderTotal;
      }, 0);
      
      const totalOrders = orders.length;
      
      // Получаем VK статистику для расчета метрик
      let adSpend = 0;
      let totalClicks = 0;
      let totalShows = 0;
      
      try {
        const vkStats = await vkAPI.getStatistics(periodRange.dateFrom, periodRange.dateTo);
        if (vkStats && vkStats.length > 0) {
          // Если статистика пришла как массив
          const stats = Array.isArray(vkStats) ? vkStats : [vkStats];
          adSpend = stats.reduce((sum, stat: any) => sum + (stat.spent || 0), 0);
          totalClicks = stats.reduce((sum, stat: any) => sum + (stat.clicks || 0), 0);
          totalShows = stats.reduce((sum, stat: any) => sum + (stat.shows || 0), 0);
        } else if (vkStats && (vkStats as any).total) {
          // Если статистика пришла как объект с total
          const total = (vkStats as any).total;
          adSpend = total.spent || 0;
          totalClicks = total.clicks || 0;
          totalShows = total.shows || 0;
        }
      } catch (error) {
        console.warn("VK Statistics недоступны, используем нули:", error);
      }
      
      console.log(`✅ Dashboard: ${totalOrders} заказов, ${totalRevenue}₽ выручка, ${adSpend}₽ расходы VK`);

      // Calculate metrics with fallbacks
      const calculateChange = (current: number): number => {
        // Simplified calculation - just return a small random variance for demo
        return parseFloat((Math.random() * 15 - 5).toFixed(1));
      };

      const aov = calcAov(totalRevenue, totalOrders);
      const ctr = calcCtr(totalShows, totalClicks);
      const cpc = calcCpc(adSpend, totalClicks);
      const conversionRate = calcConversionRate(totalOrders, totalClicks);
      const roas = calcRoas(totalRevenue, adSpend);

      const daysInPeriod = this.getDaysInPeriod({
        from: periodRange.dateFrom,
        to: periodRange.dateTo,
      });

      return {
        period: {
          from: periodRange.dateFrom,
          to: periodRange.dateTo,
          days: daysInPeriod,
        },
        metrics: {
          total_revenue: totalRevenue,
          total_revenue_prev: totalRevenue * 0.88,
          total_revenue_change: calculateChange(totalRevenue),
          total_orders: totalOrders,
          total_orders_prev: Math.floor(totalOrders * 0.95),
          total_orders_change: calculateChange(totalOrders),
          ad_spend: adSpend,
          ad_spend_prev: adSpend * 0.92,
          ad_spend_change: calculateChange(adSpend),
          roas: parseFloat(roas.toFixed(2)),
          roas_prev: parseFloat((roas * 0.98).toFixed(2)),
          roas_change: calculateChange(roas),
          aov: parseFloat(aov.toFixed(2)),
          aov_prev: parseFloat((aov * 0.94).toFixed(2)),
          aov_change: calculateChange(aov),
          conversion_rate: parseFloat(conversionRate.toFixed(2)),
          conversion_rate_prev: parseFloat((conversionRate * 0.96).toFixed(2)),
          conversion_rate_change: calculateChange(conversionRate),
          total_clicks: totalClicks,
          total_shows: totalShows,
          ctr: parseFloat(ctr.toFixed(2)),
          cpc: parseFloat(cpc.toFixed(2)),
        },
      };
    } catch (error) {
      console.error("Error fetching dashboard summary, using mock data:", error);
      return mockDashboardSummary;
    }
  }

  async getCampaigns(period: string = "30d"): Promise<Campaign[]> {
    try {
      const campaigns = await vkAPI.getCampaigns();

      // If no real data, return mock data
      if (!campaigns || campaigns.length === 0) {
        console.warn("No campaigns returned from API, using mock data");
        return mockCampaigns;
      }

      console.log(`✅ VK Campaigns: получено ${campaigns.length} кампаний`);

      // Получаем статистику для каждой кампании
      const periodRange = getPeriodRange(period as PeriodCode);
      let allStats: any[] = [];
      
      try {
        const statsResponse = await vkAPI.getStatistics(periodRange.dateFrom, periodRange.dateTo);
        if (statsResponse) {
          if (Array.isArray(statsResponse)) {
            allStats = statsResponse;
          } else if ((statsResponse as any).data) {
            allStats = (statsResponse as any).data || [];
          }
        }
      } catch (error) {
        console.warn("Не удалось получить статистику VK:", error);
      }

      // Маппим кампании с их статистикой
      return campaigns.map((campaign: any) => {
        const campaignStats = allStats.find((s: any) => s.id === campaign.id || s.campaign_id === campaign.id);
        const stats = campaignStats?.base || campaignStats || {};
        
        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status || "active",
          ad_plan_id: campaign.package_id || campaign.ad_plan_id || campaign.id,
          budget_limit: campaign.budget_limit || campaign.budget?.limit || 0,
          budget_limit_day: campaign.budget_limit_day || campaign.budget?.daily_limit || 0,
          spent: parseFloat(stats.spent || campaign.spent || 0),
          created_at: campaign.created_at || new Date().toISOString(),
          statistics: {
            shows: stats.shows || campaign.shows || 0,
            clicks: stats.clicks || campaign.clicks || 0,
            ctr: stats.ctr || calcCtr(stats.shows || campaign.shows || 0, stats.clicks || campaign.clicks || 0),
            cpc: parseFloat(stats.cpc || campaign.cpc || 0),
            cpm: parseFloat(stats.cpm || campaign.cpm || 0),
            conversions: stats.goals || stats.conversions || 0,
            revenue: 0, // Будет рассчитано при связывании с заказами
            roas: 0, // Будет рассчитано при связывании с заказами
          },
        };
      });
    } catch (error) {
      console.error("Error fetching campaigns, using mock data:", error);
      return mockCampaigns;
    }
  }

  async getOrders(period: string = "30d"): Promise<Order[]> {
    const periodRange = getPeriodRange(period as PeriodCode);

    try {
      const orders = await yandexAPI.getOrders(periodRange.dateFrom, periodRange.dateTo);

      // If no real orders, return mock data
      if (!orders || orders.length === 0) {
        console.warn("No orders returned from API, using mock data");
        return mockOrders;
      }

      console.log(`✅ Orders: получено ${orders.length} заказов`);

      const mappedOrders = orders.map((order: any) => ({
        id: order.id,
        campaign_id: order.campaignId || 0,
        status: order.status,
        creation_date: order.creationDate,
        items_total: order.itemsTotal || order.buyerItemsTotal || 0,
        delivery_cost: order.deliveryCost || order.deliveryTotal || 0,
        total: order.buyerTotal || order.total || 0, // New API uses buyerTotal
        region: order.delivery?.region?.name || order.delivery?.region || "Москва",
        items_count: order.items?.length || 0,
      }));

      return mappedOrders;
    } catch (error) {
      console.error("Error fetching orders, using mock data:", error);
      return mockOrders;
    }
  }

  async getTopProducts(period: string = "30d"): Promise<TopProduct[]> {
    const periodRange = getPeriodRange(period as PeriodCode);

    try {
      const [products, orders] = await Promise.all([
        yandexAPI.getProducts(),
        yandexAPI.getOrders(periodRange.dateFrom, periodRange.dateTo),
      ]);

      // If no real orders, return mock data
      if (!orders || orders.length === 0) {
        console.warn("No orders for products calculation, using mock data");
        return mockTopProducts;
      }

      // Group products by offerId and count sales
      const productStats: Record<
        string,
        {
          name: string;
          category: string;
          orders: number;
          quantity: number;
          revenue: number;
        }
      > = {};

      orders.forEach((order: any) => {
        if (!order.items || order.items.length === 0) return;
        
        order.items.forEach((item: any) => {
          const offerId = item.offerId || item.shopSku;
          if (!offerId) return;
          
          if (!productStats[offerId]) {
            const product = products.find((p: any) => p.offerId === offerId);
            productStats[offerId] = {
              name: item.offerName || offerId,
              category: product?.category || "Без категории",
              orders: 0,
              quantity: 0,
              revenue: 0,
            };
          }
          productStats[offerId].orders += 1;
          productStats[offerId].quantity += item.count || 1;
          productStats[offerId].revenue += (item.buyerPrice || item.price || 0) * (item.count || 1);
        });
      });

      const totalRevenue = Object.values(productStats).reduce(
        (sum, p) => sum + p.revenue,
        0
      );

      const topProducts = Object.entries(productStats)
        .map(([offerId, stats]) => ({
          product_id: Math.abs(offerId.split("").reduce((a, b) => a + b.charCodeAt(0), 0)),
          offer_id: offerId,
          name: stats.name,
          category: stats.category,
          orders: stats.orders,
          total_quantity: stats.quantity,
          revenue: stats.revenue,
          share: calcRevenueShare(stats.revenue, totalRevenue),
          avg_price: calcAveragePrice(stats.revenue, stats.quantity),
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      console.log(`✅ Top Products: ${topProducts.length} товаров из ${orders.length} заказов`);

      return topProducts;
    } catch (error) {
      console.error("Error fetching top products, using mock data:", error);
      return mockTopProducts;
    }
  }

  async getProducts(): Promise<any[]> {
    try {
      const products = await yandexAPI.getProducts();
      
      if (!products || products.length === 0) {
        console.warn("No products returned from API, using mock data");
        return mockProducts;
      }

      console.log(`✅ Products: получено ${products.length} товаров`);

      // Transform to match UI format
      return products.map((product: any) => ({
        id: Math.abs(product.offerId.split("").reduce((a, b) => a + b.charCodeAt(0), 0)),
        offer_id: product.offerId,
        name: product.name || product.offerId,
        category: product.category || "Без категории",
        price: product.price || 0,
        availability: product.available !== false,
        stock_total: product.stocks?.length || 0,
        stock_status: (product.stocks && product.stocks.length > 0) ? "in_stock" : "out_of_stock",
        has_c1_mapping: false,
        last_updated: new Date().toISOString(),
        warehouseId: product.warehouseId,
        campaignId: product.campaignId,
      }));
    } catch (error) {
      console.error("Error fetching products, using mock data:", error);
      return mockProducts;
    }
  }

  // ============================================
  // 1C Data Methods
  // ============================================

  /**
   * Получить снимки продуктов из 1C
   */
  async getOneCProductSnapshot(): Promise<ProductSnapshot[]> {
    try {
      const products = await fetchOneCProducts();
      console.log(`✅ 1C Products: получено ${products.length} товаров`);
      return products;
    } catch (error) {
      console.error("Error fetching 1C products:", error);
      return [];
    }
  }

  /**
   * Получить агрегированную сводку по продажам из 1C
   * Включает общие метрики и группировку по менеджерам
   */
  async getOneCSalesSummary(): Promise<{
    totalRevenue: number;
    totalMargin: number;
    totalReturns: number;
    netRevenue: number;
    byManager: SalesSummaryByManager[];
  }> {
    try {
      // Загружаем продажи и возвраты параллельно
      const [sales, returns] = await Promise.all([
        fetchOneCSales(),
        fetchOneCReturns(),
      ]);

      // Приводим суммы к числам и считаем общие метрики
      const totalRevenue = sales.reduce((sum, sale) => {
        const revenue = typeof sale.revenue === "number" ? sale.revenue : parseFloat(String(sale.revenue || 0));
        return sum + revenue;
      }, 0);

      const totalMargin = sales.reduce((sum, sale) => {
        const margin = typeof sale.margin === "number" ? sale.margin : parseFloat(String(sale.margin || 0));
        return sum + margin;
      }, 0);

      const totalReturns = returns.reduce((sum, ret) => {
        const amount = typeof ret.amount === "number" ? ret.amount : parseFloat(String(ret.amount || 0));
        return sum + amount;
      }, 0);

      const netRevenue = totalRevenue - totalReturns;

      // Группируем продажи по менеджерам
      const managerStats: Record<string, {
        totalRevenue: number;
        totalCost: number;
        totalMargin: number;
        marginPercents: number[];
        documentCount: number;
      }> = {};

      sales.forEach((sale) => {
        const manager = sale.manager || "Неизвестно";
        const revenue = typeof sale.revenue === "number" ? sale.revenue : parseFloat(String(sale.revenue || 0));
        const cost = typeof sale.cost === "number" ? sale.cost : parseFloat(String(sale.cost || 0));
        const margin = typeof sale.margin === "number" ? sale.margin : parseFloat(String(sale.margin || 0));
        const marginPercent = typeof sale.marginPercent === "number" ? sale.marginPercent : parseFloat(String(sale.marginPercent || 0));

        if (!managerStats[manager]) {
          managerStats[manager] = {
            totalRevenue: 0,
            totalCost: 0,
            totalMargin: 0,
            marginPercents: [],
            documentCount: 0,
          };
        }

        managerStats[manager].totalRevenue += revenue;
        managerStats[manager].totalCost += cost;
        managerStats[manager].totalMargin += margin;
        managerStats[manager].marginPercents.push(marginPercent);
        managerStats[manager].documentCount += 1;
      });

      // Преобразуем в массив SalesSummaryByManager
      const byManager: SalesSummaryByManager[] = Object.entries(managerStats).map(([manager, stats]) => {
        const averageMarginPercent = stats.marginPercents.length > 0
          ? stats.marginPercents.reduce((sum, p) => sum + p, 0) / stats.marginPercents.length
          : 0;

        return {
          manager,
          totalRevenue: stats.totalRevenue,
          totalCost: stats.totalCost,
          totalMargin: stats.totalMargin,
          averageMarginPercent: parseFloat(averageMarginPercent.toFixed(2)),
          documentCount: stats.documentCount,
        };
      });

      console.log(`✅ 1C Sales Summary: ${sales.length} продаж, ${returns.length} возвратов, ${byManager.length} менеджеров`);

      return {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalMargin: parseFloat(totalMargin.toFixed(2)),
        totalReturns: parseFloat(totalReturns.toFixed(2)),
        netRevenue: parseFloat(netRevenue.toFixed(2)),
        byManager: byManager.sort((a, b) => b.totalRevenue - a.totalRevenue),
      };
    } catch (error) {
      console.error("Error fetching 1C sales summary:", error);
      return {
        totalRevenue: 0,
        totalMargin: 0,
        totalReturns: 0,
        netRevenue: 0,
        byManager: [],
      };
    }
  }

  /**
   * Получить аналитику по складу из 1C
   * Включает оборот склада и агрегаты (slow-movers, fast-movers)
   */
  async getOneCStockAnalytics(): Promise<{
    stockTurnover: OneCStockTurnoverRow[];
    slowMovers: OneCStockTurnoverRow[];
    fastMovers: OneCStockTurnoverRow[];
    totalTurnover: number;
    averageTurnover: number;
  }> {
    try {
      const stockTurnover = await fetchOneCStockTurnover();

      // Рассчитываем оборот для каждого товара (приход + расход)
      const turnoverWithMetrics = stockTurnover.map((item) => {
        const turnover = item.incomingQty + item.outgoingQty;
        return {
          ...item,
          turnover,
        };
      });

      // Сортируем по обороту для определения fast/slow movers
      const sortedByTurnover = [...turnoverWithMetrics].sort((a, b) => b.turnover - a.turnover);

      // Fast movers - топ 20% по обороту
      const fastMoversCount = Math.ceil(sortedByTurnover.length * 0.2);
      const fastMovers = sortedByTurnover.slice(0, fastMoversCount).map(({ turnover, ...item }) => item);

      // Slow movers - нижние 20% по обороту (исключая нулевой оборот)
      const nonZeroTurnover = sortedByTurnover.filter((item) => item.turnover > 0);
      const slowMoversCount = Math.ceil(nonZeroTurnover.length * 0.2);
      const slowMovers = nonZeroTurnover
        .slice(-slowMoversCount)
        .map(({ turnover, ...item }) => item);

      // Общий оборот
      const totalTurnover = turnoverWithMetrics.reduce((sum, item) => sum + item.turnover, 0);

      // Средний оборот
      const averageTurnover = turnoverWithMetrics.length > 0
        ? totalTurnover / turnoverWithMetrics.length
        : 0;

      console.log(`✅ 1C Stock Analytics: ${stockTurnover.length} товаров, ${fastMovers.length} fast-movers, ${slowMovers.length} slow-movers`);

      return {
        stockTurnover,
        slowMovers,
        fastMovers,
        totalTurnover: parseFloat(totalTurnover.toFixed(2)),
        averageTurnover: parseFloat(averageTurnover.toFixed(2)),
      };
    } catch (error) {
      console.error("Error fetching 1C stock analytics:", error);
      return {
        stockTurnover: [],
        slowMovers: [],
        fastMovers: [],
        totalTurnover: 0,
        averageTurnover: 0,
      };
    }
  }

  private getDaysInPeriod(period: PeriodParams): number {
    const from = new Date(period.from);
    const to = new Date(period.to);
    return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Получить сквозную воронку: агрегированные данные из всех источников (VK, Yandex, 1C)
   * 
   * Использует новый analytics API endpoint для получения агрегированных данных
   * 
   * @param period - Период для анализа: "7d" | "30d" | "90d" | "ytd"
   * @returns FunnelSummary с агрегированными данными и KPI
   */
  async getUnifiedFunnelSummary(period: "7d" | "30d" | "90d" | "ytd"): Promise<FunnelSummary> {
    try {
      // Используем новый analytics API endpoint
      const summary = await fetchFunnelSummary(period);
      return summary;
    } catch (error) {
      console.error("Error fetching unified funnel summary:", error);
      // Fallback: используем старый подход, если новый API недоступен
      const periodRange = getPeriodRange(period);
      const periodLabel = periodRange.label;

      try {
        // Параллельно загружаем данные из всех источников
        const [vkStats, yandexOrders, oneCSales] = await Promise.all([
          vkAPI.getStatistics(periodRange.dateFrom, periodRange.dateTo).catch(() => []),
          yandexAPI.getOrders(periodRange.dateFrom, periodRange.dateTo).catch(() => []),
          fetchOneCSales().catch(() => []),
        ]);

        // Агрегируем данные VK
        const vkData = Array.isArray(vkStats) ? vkStats : [];
        const vkAggregated = vkData.reduce(
          (acc, stat: any) => {
            acc.impressions += stat.shows || stat.impressions || 0;
            acc.clicks += stat.clicks || 0;
            acc.spend += stat.spent || stat.spend || 0;
            return acc;
          },
          { impressions: 0, clicks: 0, spend: 0 }
        );

        // Агрегируем данные Yandex
        const yandexAggregated = yandexOrders.reduce(
          (acc, order: any) => {
            acc.orders += 1;
            acc.revenue += order.buyerTotal || order.total || order.itemsTotal || 0;
            return acc;
          },
          { orders: 0, revenue: 0 }
        );

        // Фильтруем и агрегируем данные 1C по периоду
        const oneCSalesFiltered = oneCSales.filter((sale) => {
          try {
            const saleDate = new Date(sale.date);
            const fromDate = new Date(periodRange.dateFrom);
            const toDate = new Date(periodRange.dateTo);
            toDate.setHours(23, 59, 59, 999);
            return saleDate >= fromDate && saleDate <= toDate;
          } catch {
            return false;
          }
        });

        const oneCAggregated = oneCSalesFiltered.reduce(
          (acc, sale) => {
            acc.orders += 1;
            acc.revenue += typeof sale.revenue === "number" ? sale.revenue : parseFloat(String(sale.revenue || 0));
            acc.margin = (acc.margin || 0) + (typeof sale.margin === "number" ? sale.margin : parseFloat(String(sale.margin || 0)));
            return acc;
          },
          { orders: 0, revenue: 0, margin: 0 }
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

        return {
          periodLabel,
          vk: vkAggregated,
          yandex: yandexAggregated,
          oneC: {
            orders: oneCAggregated.orders,
            revenue: oneCAggregated.revenue,
            margin: oneCAggregated.margin > 0 ? oneCAggregated.margin : undefined,
          },
          kpi,
        };
      } catch (fallbackError) {
        console.error("Fallback funnel summary also failed:", fallbackError);
        // Возвращаем пустую структуру в случае ошибки
        return {
          periodLabel,
          vk: { impressions: 0, clicks: 0, spend: 0 },
          yandex: { orders: 0, revenue: 0 },
          oneC: { orders: 0, revenue: 0 },
          kpi: {
            ctr: 0,
            cpc: 0,
            cpm: 0,
            roas: 0,
            conversionRate: 0,
            aov: 0,
          },
        };
      }
    }
  }

  /**
   * Получить отчет о качестве данных 1C
   * 
   * @returns DataQualityReport с анализом качества данных
   */
  async getOneCDataQuality(): Promise<DataQualityReport> {
    try {
      return await fetchDataQualityReport();
    } catch (error) {
      console.error("Error fetching data quality report:", error);
      // Возвращаем пустой отчет в случае ошибки
      return {
        products: {
          total: 0,
          missingArticleCount: 0,
          missingPriceCount: 0,
          zeroOrNegativeStockCount: 0,
          duplicateArticleCount: 0,
          examples: {
            missingArticle: [],
            missingPrice: [],
            duplicateArticles: [],
          },
        },
        sales: {
          total: 0,
          withMissingData: 0,
        },
        returns: {
          total: 0,
          withMissingData: 0,
        },
      };
    }
  }

}

export const dataService = new DataService();
