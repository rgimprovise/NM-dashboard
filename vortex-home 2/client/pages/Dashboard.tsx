import { useState, useEffect } from "react";
import KPICard from "@/components/dashboard/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Zap,
  Target,
  BarChart3,
  MapPin,
  AlertCircle,
  Loader,
  Info,
} from "lucide-react";
import { dataService, getPeriodParams, type PeriodParams, type FunnelSummary } from "@/services/dataService";
import { DashboardSummary, RevenueChartPoint, TopProduct, Region } from "@/types/dashboard";
import { SalesSummaryByManager } from "../../shared/types/oneC";
import { mockRevenueChartData, mockRegions } from "@/lib/mockData";
import { calcRoas, calcRevenueShare, calcAov } from "../../shared/utils/metrics";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [period, setPeriod] = useState("30d");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 1C Data state
  const [oneCSalesSummary, setOneCSalesSummary] = useState<{
    totalRevenue: number;
    totalMargin: number;
    totalReturns: number;
    netRevenue: number;
    byManager: SalesSummaryByManager[];
  } | null>(null);
  const [oneCProductCount, setOneCProductCount] = useState<number>(0);
  const [oneCLoading, setOneCLoading] = useState(true);
  
  // Executive Overview / Funnel Summary state
  const [funnelSummary, setFunnelSummary] = useState<FunnelSummary | null>(null);
  const [funnelLoading, setFunnelLoading] = useState(true);

  // Generate chart data based on period - sorted by date
  const generateChartData = (periodParams: PeriodParams): RevenueChartPoint[] => {
    const from = new Date(periodParams.from);
    const to = new Date(periodParams.to);
    const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

    const data: RevenueChartPoint[] = [];
    for (let i = 0; i <= days; i++) {
      const date = new Date(from);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];

      const revenue = 75000 + Math.random() * 80000;
      const adSpend = 25000 + Math.random() * 30000;

      data.push({
        date: dateStr,
        revenue: revenue,
        ad_spend: adSpend,
        orders: 4 + Math.floor(Math.random() * 8),
        clicks: 350 + Math.floor(Math.random() * 400),
        roas: calcRoas(revenue, adSpend),
      });
    }
    // Sort by date ascending
    return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load data from API
        const [summaryData, productsData, ordersData] = await Promise.all([
          dataService.getDashboardSummary(period),
          dataService.getTopProducts(period),
          dataService.getOrders(period),
        ]);

        setSummary(summaryData);
        setTopProducts(productsData);
        
        // Calculate regions from orders
        if (ordersData && ordersData.length > 0) {
          const regionStats: Record<string, { orders: number; revenue: number }> = {};
          
          ordersData.forEach((order) => {
            const region = order.region || "Неизвестно";
            if (!regionStats[region]) {
              regionStats[region] = { orders: 0, revenue: 0 };
            }
            regionStats[region].orders += 1;
            regionStats[region].revenue += order.total;
          });

          const totalRevenue = Object.values(regionStats).reduce((sum, r) => sum + r.revenue, 0);
          
          const regionsData = Object.entries(regionStats)
            .map(([region, stats]) => ({
              region,
              orders: stats.orders,
              revenue: stats.revenue,
              share: calcRevenueShare(stats.revenue, totalRevenue),
              avg_order_value: calcAov(stats.revenue, stats.orders),
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 6);
          
          setRegions(regionsData);
        } else {
          setRegions(mockRegions);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load data";
        setError(message);
        console.error("Dashboard error:", err);
        setRegions(mockRegions);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [period]);

  // Load 1C data on mount
  useEffect(() => {
    const loadOneCData = async () => {
      try {
        setOneCLoading(true);
        const [salesSummary, products] = await Promise.all([
          dataService.getOneCSalesSummary(),
          dataService.getOneCProductSnapshot(),
        ]);

        setOneCSalesSummary(salesSummary);
        setOneCProductCount(products.length);
      } catch (err) {
        console.error("Error loading 1C data:", err);
        // Set defaults on error
        setOneCSalesSummary({
          totalRevenue: 0,
          totalMargin: 0,
          totalReturns: 0,
          netRevenue: 0,
          byManager: [],
        });
        setOneCProductCount(0);
      } finally {
        setOneCLoading(false);
      }
    };

    loadOneCData();
  }, []);

  // Load Executive Overview / Funnel Summary data
  useEffect(() => {
    const loadFunnelSummary = async () => {
      try {
        setFunnelLoading(true);
        const summary = await dataService.getUnifiedFunnelSummary("30d");
        setFunnelSummary(summary);
      } catch (err) {
        console.error("Error loading funnel summary:", err);
        setFunnelSummary(null);
      } finally {
        setFunnelLoading(false);
      }
    };

    loadFunnelSummary();
  }, []);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Дашборд</h1>
            <p className="text-muted-foreground mt-1">
              Обзор бизнес-метрик и производительности
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Загрузка данных...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Да��борд</h1>
          </div>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Ошибка при загрузке</h3>
                <p className="text-sm text-red-700">{error || "Данные не загружены"}</p>
                <p className="text-xs text-red-600 mt-2">
                  Убедитесь, что API токены актуальны и имеют доступ
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const chartData = generateChartData(getPeriodParams(period));

  return (
    <div className="space-y-8">
      {/* Header with Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Дашборд</h1>
          <p className="text-muted-foreground mt-1">
            Обзор бизнес-метрик и производительности
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">Период:</span>
          <select
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background text-sm"
          >
            <option value="7d">За последние 7 дней</option>
            <option value="30d">За последние 30 дней</option>
            <option value="90d">За последние 90 дней</option>
            <option value="ytd">Год к дате</option>
          </select>
        </div>
      </div>

      {/* VK Statistics Info */}
      {summary.metrics.ad_spend === 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">Нет расходов VK Ads</AlertTitle>
          <AlertDescription className="text-blue-700 text-sm">
            Расходы на рекламу VK за выбранный период равны нулю. Возможно, кампании не были активны или данные еще обрабатываются.{" "}
            <a href="/marketing" className="underline hover:text-blue-900">
              Посмотреть кампании
            </a>
          </AlertDescription>
        </Alert>
      )}

      {/* Executive Overview / Общий обзор */}
      {(funnelLoading || oneCLoading) ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Общий обзор</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Ключевые бизнес-метрики за 30 дней
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center h-32">
            <Loader className="w-6 h-6 animate-spin text-primary" />
          </div>
        </div>
      ) : funnelSummary && oneCSalesSummary ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Общий обзор</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Ключевые бизнес-метрики за 30 дней
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Чистая выручка 1С */}
            <KPICard
              title="Чистая выручка 1С"
              value={`${(oneCSalesSummary.netRevenue / 1000000).toFixed(2)}M`}
              unit="₽"
              icon={<DollarSign className="w-5 h-5" />}
              className={cn(
                oneCSalesSummary.netRevenue <= 0 && "border-orange-200 bg-orange-50"
              )}
            />
            
            {/* Валовая прибыль 1С */}
            <KPICard
              title="Валовая прибыль 1С"
              value={`${(oneCSalesSummary.totalMargin / 1000000).toFixed(2)}M`}
              unit="₽"
              icon={<TrendingUp className="w-5 h-5" />}
              className={cn(
                oneCSalesSummary.totalRevenue > 0 && 
                (oneCSalesSummary.totalMargin / oneCSalesSummary.totalRevenue) * 100 < 30 &&
                "border-red-200 bg-red-50"
              )}
            />
            
            {/* Расходы на рекламу VK */}
            <KPICard
              title="Расходы на рекламу VK"
              value={`${(funnelSummary.vk.spend / 1000).toFixed(0)}K`}
              unit="₽"
              icon={<Zap className="w-5 h-5" />}
            />
            
            {/* ROAS */}
            <KPICard
              title="ROAS"
              value={funnelSummary.kpi.roas.toFixed(2)}
              icon={<Target className="w-5 h-5" />}
              className={cn(
                funnelSummary.kpi.roas < 3 && "border-red-200 bg-red-50"
              )}
            />
            
            {/* Конверсия клики → заказы */}
            <KPICard
              title="Конверсия"
              value={funnelSummary.kpi.conversionRate.toFixed(2)}
              unit="%"
              icon={<BarChart3 className="w-5 h-5" />}
            />
            
            {/* Средний чек (AOV) */}
            <KPICard
              title="Средний чек"
              value={`${(funnelSummary.kpi.aov / 1000).toFixed(1)}K`}
              unit="₽"
              icon={<ShoppingCart className="w-5 h-5" />}
            />
          </div>
        </div>
      ) : null}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Общая выручка"
          value={`${(summary.metrics.total_revenue / 1000000).toFixed(2)}M`}
          unit="₽"
          change={summary.metrics.total_revenue_change}
          icon={<DollarSign className="w-5 h-5" />}
          trend={summary.metrics.total_revenue_change > 0 ? "up" : "down"}
        />
        <KPICard
          title="Всего заказов"
          value={summary.metrics.total_orders}
          change={summary.metrics.total_orders_change}
          icon={<ShoppingCart className="w-5 h-5" />}
          trend={summary.metrics.total_orders_change > 0 ? "up" : "down"}
        />
        <KPICard
          title="Расходы на рекламу"
          value={`${(summary.metrics.ad_spend / 1000).toFixed(0)}K`}
          unit="₽"
          change={summary.metrics.ad_spend_change}
          icon={<Zap className="w-5 h-5" />}
          trend={summary.metrics.ad_spend_change > 0 ? "up" : "down"}
        />
        <KPICard
          title="ROAS"
          value={summary.metrics.roas.toFixed(2)}
          change={summary.metrics.roas_change}
          icon={<Target className="w-5 h-5" />}
          trend={summary.metrics.roas_change > 0 ? "up" : "down"}
        />
      </div>

      {/* Second Row KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Средний чек"
          value={`${(summary.metrics.aov / 1000).toFixed(1)}K`}
          unit="₽"
          change={summary.metrics.aov_change}
          icon={<BarChart3 className="w-5 h-5" />}
          trend={summary.metrics.aov_change > 0 ? "up" : "down"}
        />
        <KPICard
          title="Конверсия"
          value={summary.metrics.conversion_rate.toFixed(2)}
          unit="%"
          change={summary.metrics.conversion_rate_change}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={summary.metrics.conversion_rate_change > 0 ? "up" : "down"}
        />
        <KPICard
          title="CTR"
          value={summary.metrics.ctr.toFixed(2)}
          unit="%"
          icon={<Zap className="w-5 h-5" />}
        />
        <KPICard
          title="CPC"
          value={summary.metrics.cpc.toFixed(0)}
          unit="₽"
          icon={<DollarSign className="w-5 h-5" />}
        />
      </div>

      {/* Revenue Trend Table */}
      <Card>
        <CardHeader>
          <CardTitle>Тренд выручки (ежедневно)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Дата</th>
                  <th className="text-right py-3 px-4 font-semibold">Выручка</th>
                  <th className="text-right py-3 px-4 font-semibold">Расходы на рекламу</th>
                  <th className="text-right py-3 px-4 font-semibold">Заказы</th>
                  <th className="text-right py-3 px-4 font-semibold">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {chartData.slice(-7).map((day, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted">
                    <td className="py-3 px-4">{day.date}</td>
                    <td className="text-right py-3 px-4 font-medium">
                      ₽{(day.revenue / 1000).toFixed(0)}K
                    </td>
                    <td className="text-right py-3 px-4">
                      ₽{(day.ad_spend / 1000).toFixed(0)}K
                    </td>
                    <td className="text-right py-3 px-4">{day.orders}</td>
                    <td className="text-right py-3 px-4">
                      <Badge variant="secondary">{day.roas.toFixed(2)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Products & Geography */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Топ 5 товаров по выручке</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product) => (
                <div
                  key={product.product_id}
                  className="flex items-center gap-4 pb-4 border-b last:border-0"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground text-sm">
                      {product.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">{product.share.toFixed(1)}%</Badge>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      ₽{(product.revenue / 1000).toFixed(0)}K
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Geography */}
        <Card>
          <CardHeader>
            <CardTitle>Топ регионов по выручке</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {regions.slice(0, 5).map((region) => (
                <div key={region.region} className="flex items-center gap-3 pb-4 border-b last:border-0">
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground text-sm">
                      {region.region}
                    </h4>
                    <p className="text-xs text-muted-foreground">{region.orders} заказов</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">{region.share.toFixed(1)}%</Badge>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      ₽{(region.revenue / 1000).toFixed(0)}K
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Category Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Выручка по категориям</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topProducts.map((product) => {
              const percentage = product.share;
              return (
                <div key={product.product_id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-foreground">
                      {product.category}
                    </span>
                    <span className="text-muted-foreground">{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 1C Basic Metrics Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">1С · Базовые показатели</h2>
          <p className="text-muted-foreground mt-1">
            Показатели из системы 1С (продажи, возвраты, склад)
          </p>
        </div>

        {oneCLoading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 animate-spin text-primary mr-3" />
                <p className="text-muted-foreground">Загрузка данных 1С...</p>
              </div>
            </CardContent>
          </Card>
        ) : oneCSalesSummary ? (
          <>
            {/* 1C KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <KPICard
                title="Выручка 1С"
                value={`${(oneCSalesSummary.totalRevenue / 1000000).toFixed(2)}M`}
                unit="₽"
                icon={<DollarSign className="w-5 h-5" />}
              />
              <KPICard
                title="Возвраты"
                value={`${(oneCSalesSummary.totalReturns / 1000).toFixed(0)}K`}
                unit="₽"
                icon={<AlertCircle className="w-5 h-5" />}
              />
              <KPICard
                title="Чистая выручка"
                value={`${(oneCSalesSummary.netRevenue / 1000000).toFixed(2)}M`}
                unit="₽"
                icon={<TrendingUp className="w-5 h-5" />}
              />
              <KPICard
                title="Валовая прибыль"
                value={`${(oneCSalesSummary.totalMargin / 1000000).toFixed(2)}M`}
                unit="₽"
                icon={<BarChart3 className="w-5 h-5" />}
              />
              <KPICard
                title="Кол-во SKU в базе"
                value={oneCProductCount}
                icon={<ShoppingCart className="w-5 h-5" />}
              />
            </div>

            {/* Top Managers Table */}
            <Card>
              <CardHeader>
                <CardTitle>Топ менеджеров по выручке и марже</CardTitle>
              </CardHeader>
              <CardContent>
                {oneCSalesSummary.byManager.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">Менеджер</th>
                          <th className="text-right py-3 px-4 font-semibold">Выручка</th>
                          <th className="text-right py-3 px-4 font-semibold">Маржа</th>
                          <th className="text-right py-3 px-4 font-semibold">Маржа %</th>
                          <th className="text-right py-3 px-4 font-semibold">Документов</th>
                        </tr>
                      </thead>
                      <tbody>
                        {oneCSalesSummary.byManager.slice(0, 10).map((manager, idx) => (
                          <tr key={idx} className="border-b hover:bg-muted">
                            <td className="py-3 px-4 font-medium">{manager.manager}</td>
                            <td className="text-right py-3 px-4">
                              ₽{(manager.totalRevenue / 1000).toFixed(0)}K
                            </td>
                            <td className="text-right py-3 px-4">
                              ₽{(manager.totalMargin / 1000).toFixed(0)}K
                            </td>
                            <td className="text-right py-3 px-4">
                              <Badge variant="secondary">
                                {manager.averageMarginPercent.toFixed(1)}%
                              </Badge>
                            </td>
                            <td className="text-right py-3 px-4">{manager.documentCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Нет данных о менеджерах
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-muted-foreground" />
                <p className="text-muted-foreground">Не удалось загрузить данные 1С</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
