import { useState, useEffect } from "react";
import KPICard from "@/components/dashboard/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  TrendingUp,
  MousePointerClick,
  Eye,
  DollarSign,
  Target,
  BarChart3,
  Loader,
  Info,
} from "lucide-react";
import { dataService, type FunnelSummary } from "@/services/dataService";
import { vkAPI } from "@/services/api/vkClient";
import type { VKStatistic } from "@/services/api/vkClient";
import { getPeriodRange } from "../../shared/utils/periods";

export default function Marketing() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "ytd">("30d");
  const [source, setSource] = useState<"vk" | "vk+yandex" | "all">("all");
  const [funnelSummary, setFunnelSummary] = useState<FunnelSummary | null>(null);
  const [vkDailyStats, setVkDailyStats] = useState<VKStatistic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const periodRange = getPeriodRange(period);

        // Загружаем данные параллельно
        const [funnel, vkStats] = await Promise.all([
          dataService.getUnifiedFunnelSummary(period).catch(() => null),
          vkAPI.getStatistics(periodRange.dateFrom, periodRange.dateTo).catch(() => []),
        ]);

        setFunnelSummary(funnel);
        
        // Обрабатываем VK статистику - группируем по дням
        const statsArray = Array.isArray(vkStats) ? vkStats : [];
        const dailyStatsMap = new Map<string, { shows: number; clicks: number; spent: number }>();
        
        statsArray.forEach((stat: any) => {
          const date = stat.date || stat.day || new Date().toISOString().split("T")[0];
          const existing = dailyStatsMap.get(date) || { shows: 0, clicks: 0, spent: 0 };
          dailyStatsMap.set(date, {
            shows: existing.shows + (stat.shows || stat.impressions || 0),
            clicks: existing.clicks + (stat.clicks || 0),
            spent: existing.spent + (stat.spent || stat.spend || 0),
          });
        });

        // Преобразуем в массив и сортируем по дате
        const dailyStats: VKStatistic[] = Array.from(dailyStatsMap.entries())
          .map(([date, data]) => ({
            date,
            campaign_id: 0,
            shows: data.shows,
            clicks: data.clicks,
            spent: data.spent,
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setVkDailyStats(dailyStats);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Ошибка загрузки данных";
        setError(message);
        console.error("Marketing error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [period]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Аналитика маркетинга</h1>
            <p className="text-muted-foreground mt-1">
              Маркетинговые KPI и динамика рекламных кампаний
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

  return (
    <div className="space-y-8">
      {/* Header with Period and Source Selectors */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Аналитика маркетинга</h1>
          <p className="text-muted-foreground mt-1">
            Маркетинговые KPI и динамика рекламных кампаний
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Период:</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as "7d" | "30d" | "90d" | "ytd")}
              className="px-3 py-2 border border-input rounded-md bg-background text-sm"
            >
              <option value="7d">7 дней</option>
              <option value="30d">30 дней</option>
              <option value="90d">90 дней</option>
              <option value="ytd">С начала года</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Источник:</span>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as "vk" | "vk+yandex" | "all")}
              className="px-3 py-2 border border-input rounded-md bg-background text-sm"
            >
              <option value="vk">VK</option>
              <option value="vk+yandex">VK + Yandex</option>
              <option value="all">Все</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Info className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-900">Предупреждение</AlertTitle>
          <AlertDescription className="text-yellow-700">{error}</AlertDescription>
        </Alert>
      )}

      {/* Маркетинговые KPI */}
      {funnelSummary && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Маркетинговые KPI</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Ключевые показатели эффективности рекламы
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* CTR */}
            <div>
              <KPICard
                title="CTR"
                value={funnelSummary.kpi.ctr.toFixed(2)}
                unit="%"
                icon={<MousePointerClick className="w-5 h-5" />}
              />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Источник: VK (показы, клики)
              </p>
            </div>

            {/* CPC */}
            <div>
              <KPICard
                title="CPC"
                value={funnelSummary.kpi.cpc.toFixed(0)}
                unit="₽"
                icon={<DollarSign className="w-5 h-5" />}
              />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Источник: VK (расходы, клики)
              </p>
            </div>

            {/* CPM */}
            <div>
              <KPICard
                title="CPM"
                value={funnelSummary.kpi.cpm.toFixed(0)}
                unit="₽"
                icon={<Eye className="w-5 h-5" />}
              />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Источник: VK (расходы, показы)
              </p>
            </div>

            {/* Conversion Rate */}
            <div>
              <KPICard
                title="Конверсия"
                value={funnelSummary.kpi.conversionRate.toFixed(2)}
                unit="%"
                icon={<TrendingUp className="w-5 h-5" />}
              />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Источник: VK (клики) → Yandex + 1C (заказы)
              </p>
            </div>

            {/* ROAS */}
            <div>
              <KPICard
                title="ROAS"
                value={funnelSummary.kpi.roas.toFixed(2)}
                icon={<Target className="w-5 h-5" />}
              />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Источник: VK (расходы) → Yandex + 1C (выручка)
              </p>
            </div>

            {/* AOV */}
            <div>
              <KPICard
                title="AOV"
                value={`${(funnelSummary.kpi.aov / 1000).toFixed(1)}K`}
                unit="₽"
                icon={<BarChart3 className="w-5 h-5" />}
              />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Источник: Yandex + 1C (выручка, заказы)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Динамика показов/кликов/расходов */}
      <Card>
        <CardHeader>
          <CardTitle>Динамика показов/кликов/расходов</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Ежедневная статистика по рекламным кампаниям VK Ads
          </p>
        </CardHeader>
        <CardContent>
          {vkDailyStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Нет данных за выбранный период</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead className="text-right">Показы</TableHead>
                    <TableHead className="text-right">Клики</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">Расходы</TableHead>
                    <TableHead className="text-right">CPC</TableHead>
                    <TableHead className="text-right">CPM</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vkDailyStats.map((stat, idx) => {
                    const ctr = stat.shows > 0 ? (stat.clicks / stat.shows) * 100 : 0;
                    const cpc = stat.clicks > 0 ? stat.spent / stat.clicks : 0;
                    const cpm = stat.shows > 0 ? (stat.spent / stat.shows) * 1000 : 0;

                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          {new Date(stat.date).toLocaleDateString("ru-RU", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          {stat.shows.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {stat.clicks.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {ctr.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-right">
                          ₽{(stat.spent / 1000).toFixed(0)}K
                        </TableCell>
                        <TableCell className="text-right">
                          ₽{cpc.toFixed(0)}
                        </TableCell>
                        <TableCell className="text-right">
                          ₽{cpm.toFixed(0)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
