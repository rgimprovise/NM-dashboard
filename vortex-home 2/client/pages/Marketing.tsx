import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { mockCampaigns } from "@/lib/mockData";
import { Search, AlertCircle, Loader, Info } from "lucide-react";
import { dataService } from "@/services/dataService";
import type { Campaign } from "@/types/dashboard";

export default function Marketing() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("spent");
  const [selectedCampaigns, setSelectedCampaigns] = useState<number[]>([]);
  const [period, setPeriod] = useState("30d");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await dataService.getCampaigns(period);
        setCampaigns(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load campaigns";
        setError(message);
        console.error("Marketing error:", err);
        // Fallback to mock data
        setCampaigns(mockCampaigns);
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, [period]);

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    if (sortBy === "spent") {
      return b.spent - a.spent;
    } else if (sortBy === "roas") {
      return (b.statistics?.roas || 0) - (a.statistics?.roas || 0);
    } else if (sortBy === "revenue") {
      return (b.statistics?.revenue || 0) - (a.statistics?.revenue || 0);
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Аналитика маркетинга</h1>
            <p className="text-muted-foreground mt-1">
              Мониторинг производительности рекламных кампаний VK Ads
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Загрузка данных кампаний...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Аналитика маркетинга</h1>
          <p className="text-muted-foreground mt-1">
            Мониторинг производительности рекламных кампаний VK Ads
          </p>
        </div>
        <div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background text-sm"
          >
            <option value="7d">За последние 7 дней</option>
            <option value="30d">За последние 30 дней</option>
            <option value="90d">За последние 90 дней</option>
          </select>
        </div>
      </div>

      {error && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-900">
                  Используются тестовые данные
                </h3>
                <p className="text-sm text-yellow-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* VK Statistics Info - показываем только если есть проблемы */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-900 font-semibold">
            Ошибка загрузки данных
          </AlertTitle>
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      {!error && campaigns.length > 0 && (
        <Alert className="border-green-200 bg-green-50">
          <Info className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900 font-semibold">
            VK Ads подключен
          </AlertTitle>
          <AlertDescription className="text-green-700">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>✅ {campaigns.length} кампаний VK Ads</li>
              <li>✅ Статистика и метрики доступны</li>
              <li>✅ Автообновление токена активно</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по кампаниям..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-sm"
            >
              <option value="all">Все статусы</option>
              <option value="active">Активная</option>
              <option value="stopped">Остановленная</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-sm"
            >
              <option value="spent">По расходам</option>
              <option value="revenue">По выручке</option>
              <option value="roas">По ROAS</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Активные кампании</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input type="checkbox" className="rounded" />
                  </TableHead>
                  <TableHead>Название кампании</TableHead>
                  <TableHead className="text-right">Статус</TableHead>
                  <TableHead className="text-right">Показы</TableHead>
                  <TableHead className="text-right">Клики</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">Расход</TableHead>
                  <TableHead className="text-right">CPC</TableHead>
                  <TableHead className="text-right">Выручка</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCampaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedCampaigns.includes(campaign.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCampaigns([...selectedCampaigns, campaign.id]);
                          } else {
                            setSelectedCampaigns(
                              selectedCampaigns.filter((id) => id !== campaign.id)
                            );
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{campaign.name}</div>
                        <div className="text-xs text-muted-foreground">
                          ID: {campaign.id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          campaign.status === "active" ? "default" : "secondary"
                        }
                      >
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {(campaign.statistics?.shows || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {(campaign.statistics?.clicks || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {campaign.statistics?.ctr.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right">
                      ₽{(campaign.spent / 1000).toFixed(0)}K
                    </TableCell>
                    <TableCell className="text-right">
                      ₽{campaign.statistics?.cpc.toFixed(0)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ₽{((campaign.statistics?.revenue || 0) / 1000).toFixed(0)}K
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          (campaign.statistics?.roas || 0) > 3
                            ? "default"
                            : (campaign.statistics?.roas || 0) > 2
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {campaign.statistics?.roas.toFixed(2)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Budget Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Обзор бюджета</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedCampaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {campaign.name.substring(0, 25)}
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 mt-1">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width: `${(campaign.spent / campaign.budget_limit) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-semibold">
                      {((campaign.spent / campaign.budget_limit) * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ₽{(campaign.spent / 1000).toFixed(0)}K
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Рейтинг производительности</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedCampaigns.map((campaign, index) => (
                <div key={campaign.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {campaign.name.substring(0, 30)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ROAS: {campaign.statistics?.roas.toFixed(2)}
                    </div>
                  </div>
                  <Badge variant="outline">
                    {campaign.status === "active" ? "Активна" : "Остановлена"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
