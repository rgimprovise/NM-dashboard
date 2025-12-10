/**
 * Dashboard API routes
 * 
 * Provides aggregated dashboard KPI computed on the backend
 */

import { RequestHandler } from "express";
import { getPeriodRange, type PeriodCode } from "../../shared/utils/periods";
import {
  calcAov,
  calcCtr,
  calcCpc,
  calcRoas,
  calcConversionRate,
  calcPercentChange,
} from "../../shared/utils/metrics";
import { DashboardSummary } from "../../shared/api";
import * as yandexRoutes from "./yandex";
import * as vkRoutes from "./vk";
import { logInfo, logError, logWarn, logApiRequest } from "../utils/logger";

/**
 * Helper function to get days in period
 */
function getDaysInPeriod(dateFrom: string, dateTo: string): number {
  const from = new Date(dateFrom);
  const to = new Date(dateTo);
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Helper function to create empty DashboardSummary
 */
function createEmptyDashboardSummary(periodRange: ReturnType<typeof getPeriodRange>): DashboardSummary {
  const daysInPeriod = getDaysInPeriod(periodRange.dateFrom, periodRange.dateTo);
  
  return {
    period: {
      from: periodRange.dateFrom,
      to: periodRange.dateTo,
      days: daysInPeriod,
    },
    metrics: {
      total_revenue: 0,
      total_revenue_prev: 0,
      total_revenue_change: 0,
      total_orders: 0,
      total_orders_prev: 0,
      total_orders_change: 0,
      ad_spend: 0,
      ad_spend_prev: 0,
      ad_spend_change: 0,
      roas: 0,
      roas_prev: 0,
      roas_change: 0,
      aov: 0,
      aov_prev: 0,
      aov_change: 0,
      conversion_rate: 0,
      conversion_rate_prev: 0,
      conversion_rate_change: 0,
      total_clicks: 0,
      total_shows: 0,
      ctr: 0,
      cpc: 0,
    },
  };
}

/**
 * GET /api/dashboard/summary?period=7d|30d|90d|ytd
 * 
 * Returns aggregated dashboard KPI computed from Yandex orders and VK statistics
 * All KPI calculations are done on the backend (no mock data)
 */
export const getDashboardSummary: RequestHandler = async (req, res) => {
  const startTime = Date.now();
  try {
    const { period = "30d" } = req.query;
    const periodCode = period as PeriodCode;
    
    logInfo(`Dashboard summary request`, { 
      endpoint: "/api/dashboard/summary",
      period: periodCode 
    });
    
    if (!["7d", "30d", "90d", "ytd"].includes(periodCode)) {
      return res.status(400).json({
        success: false,
        error: "Invalid period. Must be one of: 7d, 30d, 90d, ytd",
      });
    }

    const periodRange = getPeriodRange(periodCode);
    logInfo(`Period range calculated`, { 
      dateFrom: periodRange.dateFrom,
      dateTo: periodRange.dateTo 
    });

    // Calculate previous period range (same duration, shifted back)
    const currentFrom = new Date(periodRange.dateFrom);
    const currentTo = new Date(periodRange.dateTo);
    const daysDiff = Math.ceil((currentTo.getTime() - currentFrom.getTime()) / (1000 * 60 * 60 * 24));
    
    const prevTo = new Date(currentFrom);
    prevTo.setDate(prevTo.getDate() - 1); // Day before current period starts
    const prevFrom = new Date(prevTo);
    prevFrom.setDate(prevFrom.getDate() - daysDiff + 1); // Same duration as current period
    
    const prevPeriodRange = {
      dateFrom: prevFrom.toISOString().split("T")[0],
      dateTo: prevTo.toISOString().split("T")[0],
    };
    
    logInfo(`Previous period range calculated`, { 
      dateFrom: prevPeriodRange.dateFrom,
      dateTo: prevPeriodRange.dateTo,
      daysDiff
    });

    // Fetch data from Yandex and VK APIs for CURRENT period
    let yandexOrders: any[] = [];
    let vkStats: any[] = [];
    
    // Fetch data from Yandex and VK APIs for PREVIOUS period
    let yandexOrdersPrev: any[] = [];
    let vkStatsPrev: any[] = [];

    // Fetch Yandex orders
    try {
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
      
      // Детальное логирование ответа
      logInfo(`Dashboard: Yandex response received`, {
        yandexDataExists: !!yandexData,
        success: yandexData?.success,
        hasData: !!yandexData?.data,
        dataType: typeof yandexData?.data,
        dataIsArray: Array.isArray(yandexData?.data),
        dataLength: Array.isArray(yandexData?.data) ? yandexData?.data.length : 'not array',
        cached: yandexData?.cached,
        error: yandexData?.error,
      });
      
      if (yandexData?.success && yandexData?.data) {
        yandexOrders = Array.isArray(yandexData.data) ? yandexData.data : [];
        logInfo(`Dashboard: получено ${yandexOrders.length} заказов Yandex`, {
          recordsCount: yandexOrders.length,
          firstOrder: yandexOrders[0] ? JSON.stringify(yandexOrders[0]).substring(0, 100) : 'none'
        });
      } else {
        logWarn(`Dashboard: Yandex orders response invalid`, {
          success: yandexData?.success,
          hasData: !!yandexData?.data,
          dataType: typeof yandexData?.data,
          error: yandexData?.error,
          fullResponse: JSON.stringify(yandexData).substring(0, 200),
        });
      }
    } catch (error) {
      logError("Failed to fetch Yandex orders for dashboard", error);
    }

    // Fetch VK statistics
    try {
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
      
      logInfo(`Dashboard: VK response received`, {
        vkDataExists: !!vkData,
        success: vkData?.success,
        hasData: !!vkData?.data,
        hasTotal: !!vkData?.total,
        totalShows: vkData?.total?.shows,
        totalClicks: vkData?.total?.clicks,
        totalSpent: vkData?.total?.spent,
        dataType: typeof vkData?.data,
        dataIsArray: Array.isArray(vkData?.data),
        dataLength: Array.isArray(vkData?.data) ? vkData?.data.length : 'not array',
      });
      
      if (vkData?.success) {
        // VK statistics returns { data: [...], campaignStats: {...}, total: { shows, clicks, spent, ctr, cpc } }
        // Используем total для агрегированных значений
        if (vkData.total) {
          // Извлекаем агрегированные значения из total
          vkStats = [{
            date: periodRange.dateFrom,
            shows: vkData.total.shows || 0,
            clicks: vkData.total.clicks || 0,
            spent: typeof vkData.total.spent === 'string' ? parseFloat(vkData.total.spent) : (vkData.total.spent || 0),
          }];
          
          logInfo(`Dashboard: получено агрегированных данных VK из total`, {
            shows: vkData.total.shows,
            clicks: vkData.total.clicks,
            spent: vkData.total.spent,
          });
        } else if (Array.isArray(vkData.data) && vkData.data.length > 0) {
          // Fallback: если total нет, агрегируем из data (daily stats)
          const aggregated = vkData.data.reduce((acc: any, item: any) => {
            acc.shows += item.shows || 0;
            acc.clicks += item.clicks || 0;
            acc.spent += typeof item.spent === 'number' ? item.spent : parseFloat(item.spent || "0");
            return acc;
          }, { shows: 0, clicks: 0, spent: 0 });
          
          vkStats = [{
            date: periodRange.dateFrom,
            shows: aggregated.shows,
            clicks: aggregated.clicks,
            spent: aggregated.spent,
          }];
          
          logInfo(`Dashboard: агрегировано из daily stats`, {
            shows: aggregated.shows,
            clicks: aggregated.clicks,
            spent: aggregated.spent,
          });
        } else {
          logWarn(`Dashboard: VK stats - нет ни total, ни data для агрегации`);
        }
      } else {
        logWarn(`Dashboard: VK stats response invalid`, {
          success: vkData?.success,
          hasData: !!vkData?.data,
          hasTotal: !!vkData?.total,
          error: vkData?.error,
          fullResponse: JSON.stringify(vkData).substring(0, 300),
        });
      }
    } catch (error) {
      console.error("❌ Failed to fetch VK stats for dashboard:", error);
    }

    // Fetch PREVIOUS period data for comparison
    try {
      // Fetch Yandex orders for previous period
      const mockReqPrev = {
        query: {
          date_from: prevPeriodRange.dateFrom,
          date_to: prevPeriodRange.dateTo,
        },
      } as any;
      
      let yandexDataPrev: any = null;
      const mockResPrev = {
        json: (data: any) => {
          yandexDataPrev = data;
        },
      } as any;
      
      await yandexRoutes.getOrders(mockReqPrev, mockResPrev, () => {});
      
      if (yandexDataPrev?.success && yandexDataPrev?.data) {
        yandexOrdersPrev = Array.isArray(yandexDataPrev.data) ? yandexDataPrev.data : [];
        logInfo(`Dashboard: получено ${yandexOrdersPrev.length} заказов Yandex за предыдущий период`);
      }
    } catch (error) {
      logWarn("Failed to fetch previous period Yandex orders", error);
    }

    // Fetch VK statistics for previous period
    try {
      const mockReqPrev = {
        query: {
          date_from: prevPeriodRange.dateFrom,
          date_to: prevPeriodRange.dateTo,
        },
      } as any;
      
      let vkDataPrev: any = null;
      const mockResPrev = {
        json: (data: any) => {
          vkDataPrev = data;
        },
      } as any;
      
      await vkRoutes.getStatistics(mockReqPrev, mockResPrev, () => {});
      
      if (vkDataPrev?.success && vkDataPrev?.total) {
        vkStatsPrev = [{
          date: prevPeriodRange.dateFrom,
          shows: vkDataPrev.total.shows || 0,
          clicks: vkDataPrev.total.clicks || 0,
          spent: typeof vkDataPrev.total.spent === 'string' ? parseFloat(vkDataPrev.total.spent) : (vkDataPrev.total.spent || 0),
        }];
        logInfo(`Dashboard: получено данных VK за предыдущий период`, {
          shows: vkDataPrev.total.shows,
          clicks: vkDataPrev.total.clicks,
          spent: vkDataPrev.total.spent,
        });
      }
    } catch (error) {
      logWarn("Failed to fetch previous period VK stats", error);
    }

    // Calculate metrics from real data (even if empty) - CURRENT period
    const totalRevenue = (yandexOrders || []).reduce((sum, order) => {
      const orderTotal = order.buyerTotal || order.total || 0;
      return sum + orderTotal;
    }, 0);
    
    const totalOrders = (yandexOrders || []).length;

    // Aggregate VK statistics - CURRENT period
    let adSpend = 0;
    let totalClicks = 0;
    let totalShows = 0;

    if (vkStats && vkStats.length > 0) {
      // vkStats теперь содержит массив с одним элементом (агрегированные значения из total)
      const stats = Array.isArray(vkStats) ? vkStats : [vkStats];
      adSpend = stats.reduce((sum, stat: any) => {
        const spent = typeof stat.spent === 'string' ? parseFloat(stat.spent) : (stat.spent || 0);
        return sum + spent;
      }, 0);
      totalClicks = stats.reduce((sum, stat: any) => sum + (stat.clicks || 0), 0);
      totalShows = stats.reduce((sum, stat: any) => sum + (stat.shows || 0), 0);
      
      logInfo(`Dashboard: VK stats aggregated`, {
        recordsCount: stats.length,
        totalShows,
        totalClicks,
        adSpend,
      });
    } else {
      logWarn(`Dashboard: VK stats пустые или не найдены`);
    }

    // Calculate PREVIOUS period metrics
    const totalRevenuePrev = (yandexOrdersPrev || []).reduce((sum, order) => {
      const orderTotal = order.buyerTotal || order.total || 0;
      return sum + orderTotal;
    }, 0);
    
    const totalOrdersPrev = (yandexOrdersPrev || []).length;

    let adSpendPrev = 0;
    let totalClicksPrev = 0;
    let totalShowsPrev = 0;

    if (vkStatsPrev && vkStatsPrev.length > 0) {
      const stats = Array.isArray(vkStatsPrev) ? vkStatsPrev : [vkStatsPrev];
      adSpendPrev = stats.reduce((sum, stat: any) => {
        const spent = typeof stat.spent === 'string' ? parseFloat(stat.spent) : (stat.spent || 0);
        return sum + spent;
      }, 0);
      totalClicksPrev = stats.reduce((sum, stat: any) => sum + (stat.clicks || 0), 0);
      totalShowsPrev = stats.reduce((sum, stat: any) => sum + (stat.shows || 0), 0);
      
      logInfo(`Dashboard: VK stats предыдущего периода агрегированы`, {
        totalShows: totalShowsPrev,
        totalClicks: totalClicksPrev,
        adSpend: adSpendPrev,
      });
    }

    logInfo(`Dashboard API: ${totalOrders} заказов, ${totalRevenue}₽ выручка, ${adSpend}₽ расходы VK`, {
      totalOrders,
      totalRevenue,
      adSpend
    });

    // Calculate KPI metrics using shared utility functions - CURRENT period
    const aov = calcAov(totalRevenue, totalOrders);
    const ctr = calcCtr(totalShows, totalClicks);
    const cpc = calcCpc(adSpend, totalClicks);
    const conversionRate = calcConversionRate(totalOrders, totalClicks);
    const roas = calcRoas(totalRevenue, adSpend);

    // Calculate KPI metrics for PREVIOUS period
    const aovPrev = calcAov(totalRevenuePrev, totalOrdersPrev);
    const ctrPrev = calcCtr(totalShowsPrev, totalClicksPrev);
    const cpcPrev = calcCpc(adSpendPrev, totalClicksPrev);
    const conversionRatePrev = calcConversionRate(totalOrdersPrev, totalClicksPrev);
    const roasPrev = calcRoas(totalRevenuePrev, adSpendPrev);

    // Calculate percentage changes
    const totalRevenueChange = calcPercentChange(totalRevenue, totalRevenuePrev);
    const totalOrdersChange = calcPercentChange(totalOrders, totalOrdersPrev);
    const adSpendChange = calcPercentChange(adSpend, adSpendPrev);
    const roasChange = calcPercentChange(roas, roasPrev);
    const aovChange = calcPercentChange(aov, aovPrev);
    const conversionRateChange = calcPercentChange(conversionRate, conversionRatePrev);

    const daysInPeriod = getDaysInPeriod(periodRange.dateFrom, periodRange.dateTo);

    // Return real data with previous period comparison
    const summary: DashboardSummary = {
      period: {
        from: periodRange.dateFrom,
        to: periodRange.dateTo,
        days: daysInPeriod,
      },
      metrics: {
        total_revenue: totalRevenue,
        total_revenue_prev: totalRevenuePrev,
        total_revenue_change: parseFloat(totalRevenueChange.toFixed(2)),
        total_orders: totalOrders,
        total_orders_prev: totalOrdersPrev,
        total_orders_change: parseFloat(totalOrdersChange.toFixed(2)),
        ad_spend: adSpend,
        ad_spend_prev: adSpendPrev,
        ad_spend_change: parseFloat(adSpendChange.toFixed(2)),
        roas: parseFloat(roas.toFixed(2)),
        roas_prev: parseFloat(roasPrev.toFixed(2)),
        roas_change: parseFloat(roasChange.toFixed(2)),
        aov: parseFloat(aov.toFixed(2)),
        aov_prev: parseFloat(aovPrev.toFixed(2)),
        aov_change: parseFloat(aovChange.toFixed(2)),
        conversion_rate: parseFloat(conversionRate.toFixed(2)),
        conversion_rate_prev: parseFloat(conversionRatePrev.toFixed(2)),
        conversion_rate_change: parseFloat(conversionRateChange.toFixed(2)),
        total_clicks: totalClicks,
        total_shows: totalShows,
        ctr: parseFloat(ctr.toFixed(2)),
        cpc: parseFloat(cpc.toFixed(2)),
      },
    };

    const duration = Date.now() - startTime;
    logApiRequest("GET", "/api/dashboard/summary", duration, false, totalOrders);
    logInfo(`Dashboard summary calculated`, {
      totalRevenue,
      totalOrders,
      adSpend,
      roas: summary.metrics.roas
    });

    return res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logError("Error computing dashboard summary", error, {
      endpoint: "/api/dashboard/summary",
      duration
    });
    
    // Return empty summary with zeros (no mock data)
    const period = (req.query.period as PeriodCode) || "30d";
    const periodRange = getPeriodRange(period);
    const emptySummary = createEmptyDashboardSummary(periodRange);
    
    return res.json({
      success: true,
      data: emptySummary,
    });
  }
};

