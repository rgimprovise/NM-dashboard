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
import { dataService, getPeriodParams, type PeriodParams } from "@/services/dataService";
import { DashboardSummary, RevenueChartPoint, TopProduct, Region } from "@/types/dashboard";
import { mockRevenueChartData, mockRegions } from "@/lib/mockData";

export default function Dashboard() {
  const [period, setPeriod] = useState("30d");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        roas: adSpend > 0 ? revenue / adSpend : 0,
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
              share: totalRevenue > 0 ? (stats.revenue / totalRevenue) * 100 : 0,
              avg_order_value: stats.orders > 0 ? stats.revenue / stats.orders : 0,
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
    </div>
  );
}
