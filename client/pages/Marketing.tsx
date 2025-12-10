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
import { cn } from "@/lib/utils";

export default function Marketing() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "ytd">("30d");
  const [source, setSource] = useState<"vk" | "vk+yandex" | "all">("all");
  const [funnelSummary, setFunnelSummary] = useState<FunnelSummary | null>(null);
  const [vkDailyStats, setVkDailyStats] = useState<VKStatistic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // VK Active Campaigns state
  const [vkCampaigns, setVkCampaigns] = useState<any[]>([]);
  const [vkCampaignsLoading, setVkCampaignsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const periodRange = getPeriodRange(period);

        // Загружаем данные параллельно
        const [funnel, vkStatsResponse] = await Promise.all([
          dataService.getUnifiedFunnelSummary(period).catch(() => null),
          vkAPI.getStatistics(periodRange.dateFrom, periodRange.dateTo).catch(() => ({ data: [] })),
        ]);

        setFunnelSummary(funnel);
        
        // Бэкенд возвращает { success: true, data: [...], campaignStats: {...}, total: {...} }
        // Извлекаем массив данных для таблицы динамики
        const statsArray = Array.isArray(vkStatsResponse) 
          ? vkStatsResponse 
          : (vkStatsResponse?.data || []);
        
        const dailyStats: VKStatistic[] = statsArray
          .map((stat: any) => ({
            date: stat.date || new Date().toISOString().split("T")[0],
            campaign_id: 0,
            shows: stat.shows || 0,
            clicks: stat.clicks || 0,
            spent: stat.spent || 0,
          }))
          .sort((a, b) => {
            // Сортировка в обратном порядке: новые даты вверху
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA;
          });

        setVkDailyStats(dailyStats);
        
        console.log(`[Marketing] Loaded ${dailyStats.length} days of VK stats`, {
          totalShows: dailyStats.reduce((sum, s) => sum + s.shows, 0),
          totalClicks: dailyStats.reduce((sum, s) => sum + s.clicks, 0),
          totalSpent: dailyStats.reduce((sum, s) => sum + s.spent, 0),
        });
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

  // Load VK Active Campaigns
  useEffect(() => {
    const loadVkCampaigns = async () => {
      try {
        setVkCampaignsLoading(true);
        const allCampaigns = await dataService.getCampaigns(period);
        console.log(`[Marketing] Received ${allCampaigns.length} campaigns from API`);
        
        // Фильтруем только кампании с реальной статистикой за период
        // Активная кампания = та, у которой есть показы, клики или расходы за выбранный период
        const activeCampaigns = allCampaigns
          .filter((c: any) => {
            // Проверяем наличие реальной статистики за период
            const stats = c.statistics || {};
            const hasStats = (
              (stats.shows && stats.shows > 0) || 
              (stats.clicks && stats.clicks > 0) || 
              (stats.spent && stats.spent > 0)
            );
            
            if (hasStats) {
              console.log(`[Marketing] Active campaign: ${c.name} (ID: ${c.id})`, {
                shows: stats.shows,
                clicks: stats.clicks,
                spent: stats.spent
              });
            }
            
            return hasStats;
          })
          .sort((a: any, b: any) => {
            // Сортируем по расходам (убывание) - самые активные вверху
            const aSpent = a.statistics?.spent || 0;
            const bSpent = b.statistics?.spent || 0;
            return bSpent - aSpent;
          });
        
        // Не ограничиваем количество - показываем все активные кампании
        // (в интерфейсе VK их 3, у нас должно быть столько же или больше, если есть данные)
        
        console.log(`[Marketing] Filtered campaigns: ${activeCampaigns.length} out of ${allCampaigns.length}`);
        setVkCampaigns(activeCampaigns);
      } catch (err) {
        console.error("Error loading VK campaigns:", err);
        setVkCampaigns([]);
      } finally {
        setVkCampaignsLoading(false);
      }
    };

    loadVkCampaigns();
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
                Показатель кликабельности
              </p>
              <p className="text-xs text-muted-foreground mt-1 text-center">
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
                Стоимость за клик
              </p>
              <p className="text-xs text-muted-foreground mt-1 text-center">
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
                Стоимость за тысячу показов
              </p>
              <p className="text-xs text-muted-foreground mt-1 text-center">
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
                Процент конверсии кликов в заказы
              </p>
              <p className="text-xs text-muted-foreground mt-1 text-center">
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
                Окупаемость рекламных расходов
              </p>
              <p className="text-xs text-muted-foreground mt-1 text-center">
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
                Средняя стоимость заказа
              </p>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Источник: Yandex + 1C (выручка, заказы)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active VK Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Активные кампании VK Ads</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Топ активных рекламных кампаний за выбранный период
          </p>
        </CardHeader>
        <CardContent>
          {vkCampaignsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-primary mr-3" />
              <p className="text-muted-foreground">Загрузка активных кампаний VK...</p>
            </div>
          ) : vkCampaigns.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название кампании</TableHead>
                      <TableHead className="text-right">Показы</TableHead>
                      <TableHead className="text-right">Клики</TableHead>
                      <TableHead className="text-right">
                        <div>CTR</div>
                        <div className="text-xs font-normal text-muted-foreground">Показатель кликабельности</div>
                      </TableHead>
                      <TableHead className="text-right">Расходы</TableHead>
                      <TableHead className="text-right">
                        <div>CPC</div>
                        <div className="text-xs font-normal text-muted-foreground">Стоимость за клик</div>
                      </TableHead>
                      <TableHead className="text-center">Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vkCampaigns.map((campaign: any) => {
                      const stats = campaign.statistics || {};
                      const shows = stats.shows || 0;
                      const clicks = stats.clicks || 0;
                      const spent = campaign.spent || stats.spent || 0;
                      const ctr = stats.ctr || (shows > 0 ? (clicks / shows) * 100 : 0);
                      const cpc = stats.cpc || (clicks > 0 ? spent / clicks : 0);
                      
                      return (
                        <TableRow key={campaign.id}>
                          <TableCell>
                            <div className="font-medium text-foreground">{campaign.name || `Кампания #${campaign.id}`}</div>
                            <div className="text-xs text-muted-foreground">ID: {campaign.id}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            {shows.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {clicks.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{ctr.toFixed(2)}%</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₽{spent.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </TableCell>
                          <TableCell className="text-right">
                            {cpc > 0 ? `₽${cpc.toFixed(2)}` : "—"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              className={cn(
                                "text-xs",
                                campaign.status === "active" || campaign.status === "running" || !campaign.status
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              )}
                            >
                              {campaign.status === "active" || campaign.status === "running" || !campaign.status
                                ? "Активна"
                                : campaign.status || "Неизвестно"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {vkCampaigns.length >= 10 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Показано {vkCampaigns.length} из {vkCampaigns.length} кампаний
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Нет активных кампаний с данными за выбранный период</p>
              <p className="text-xs mt-1">Проверьте, что кампании VK активны и есть статистика</p>
            </div>
          )}
        </CardContent>
      </Card>

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
                    <TableHead className="text-right">
                      <div>CTR</div>
                      <div className="text-xs font-normal text-muted-foreground">Показатель кликабельности</div>
                    </TableHead>
                    <TableHead className="text-right">Расходы</TableHead>
                    <TableHead className="text-right">
                      <div>CPC</div>
                      <div className="text-xs font-normal text-muted-foreground">Стоимость за клик</div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div>CPM</div>
                      <div className="text-xs font-normal text-muted-foreground">Стоимость за тысячу показов</div>
                    </TableHead>
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
