import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { mockSyncStatus } from "@/lib/mockData";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("tokens");
  const [showYandexToken, setShowYandexToken] = useState(false);
  const [showVKToken, setShowVKToken] = useState(false);
  const [syncRunning, setSyncRunning] = useState(false);

  const handleTestConnection = async (provider: string) => {
    alert(`Testing ${provider} connection...`);
  };

  const handleTriggerSync = async (source: string) => {
    setSyncRunning(true);
    setTimeout(() => setSyncRunning(false), 2000);
    alert(`Syncing ${source}...`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Настройки</h1>
        <p className="text-muted-foreground mt-1">
          Конфигурирование API токенов, расписания синхронизации и системных настроек
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tokens">API токены</TabsTrigger>
          <TabsTrigger value="sync">Статус синхронизации</TabsTrigger>
          <TabsTrigger value="history">История</TabsTrigger>
          <TabsTrigger value="preferences">Настройки</TabsTrigger>
        </TabsList>

        {/* API Tokens Tab */}
        <TabsContent value="tokens" className="space-y-4">
          {/* Yandex Token */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Yandex Market API</CardTitle>
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Активно
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-muted-foreground block mb-2">
                  ID кампании
                </label>
                <div className="bg-muted p-3 rounded font-mono text-sm">
                  21621656
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-muted-foreground block mb-2">
                  API токен
                </label>
                <div className="flex gap-2">
                  <input
                    type={showYandexToken ? "text" : "password"}
                    value="ACMA:MukyCiS4d6yMaOjDKWDJffZewiixE2SkAP8IKFdJ:31f52c26"
                    readOnly
                    className="flex-1 px-3 py-2 border border-input rounded-md bg-muted font-mono text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowYandexToken(!showYandexToken)}
                  >
                    {showYandexToken ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-muted-foreground block mb-1">
                    Статус
                  </label>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-foreground">Подключено</span>
                  </div>
                </div>
                <div>
                  <label className="text-muted-foreground block mb-1">
                    Последняя проверка
                  </label>
                  <span className="text-foreground">12 ноября 2025 15:30</span>
                </div>
              </div>

              <div className="flex gap-3 justify-end border-t pt-4">
                <Button variant="outline">Обновить токен</Button>
                <Button
                  variant="outline"
                  onClick={() => handleTestConnection("Yandex")}
                >
                  Тест подключения
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* VK Token */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>VK Ads API v2</CardTitle>
                <Badge className="bg-yellow-100 text-yellow-800">
                  <Clock className="w-3 h-3 mr-1" />
                  Истекает через 20ч
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <p className="text-sm text-yellow-800">
                  Ваш VK токен доступа истекает через 20 часов. Пожалуйста, обновите его
                  для поддержания непрерывной синхронизации данных.
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-muted-foreground block mb-2">
                  ID аккаунта
                </label>
                <div className="bg-muted p-3 rounded font-mono text-sm">
                  8798776
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-muted-foreground block mb-2">
                  Токен доступа
                </label>
                <div className="flex gap-2">
                  <input
                    type={showVKToken ? "text" : "password"}
                    value="6kNLB8xON9Bdg5Ft4I7izBGHwGnn0lmO..."
                    readOnly
                    className="flex-1 px-3 py-2 border border-input rounded-md bg-muted font-mono text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowVKToken(!showVKToken)}
                  >
                    {showVKToken ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-muted-foreground block mb-1">
                    Статус
                  </label>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-foreground">Подключено</span>
                  </div>
                </div>
                <div>
                  <label className="text-muted-foreground block mb-1">
                    Истекает
                  </label>
                  <span className="text-yellow-600 font-medium">
                    13 ноября 2025 10:00
                  </span>
                </div>
              </div>

              <div className="flex gap-3 justify-end border-t pt-4">
                <Button
                  variant="default"
                  onClick={() => handleTestConnection("VK")}
                >
                  Обновить токен (OAuth)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleTestConnection("VK")}
                >
                  Тест подключения
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync Status Tab */}
        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Статус синхронизации данных</CardTitle>
                <Button
                  size="sm"
                  disabled={syncRunning}
                  onClick={() => handleTriggerSync("all")}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {syncRunning ? "Синхронизация..." : "Синхронизировать"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Источник</TableHead>
                      <TableHead>Частота</TableHead>
                      <TableHead className="text-center">Статус</TableHead>
                      <TableHead>Последняя синхр.</TableHead>
                      <TableHead>Следующая синхр.</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockSyncStatus.map((sync) => (
                      <TableRow key={sync.name}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">
                              {sync.display_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {sync.records_processed} записей
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {sync.frequency}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={
                              sync.status === "success"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {sync.status === "success" ? (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <AlertCircle className="w-3 h-3 mr-1" />
                            )}
                            {sync.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(sync.last_sync).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(sync.next_sync).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTriggerSync(sync.display_name)}
                          >
                            Синхр.
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>История синхронизации</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Время</TableHead>
                      <TableHead>Источник</TableHead>
                      <TableHead className="text-center">Статус</TableHead>
                      <TableHead className="text-right">Записей</TableHead>
                      <TableHead className="text-right">Длительность</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        timestamp: "2025-11-12 15:00",
                        source: "Заказы Yandex",
                        status: "успех",
                        records: "5",
                        duration: "12с",
                      },
                      {
                        timestamp: "2025-11-12 14:00",
                        source: "Товары Yandex",
                        status: "успех",
                        records: "450",
                        duration: "45с",
                      },
                      {
                        timestamp: "2025-11-12 14:00",
                        source: "Статистика VK",
                        status: "успех",
                        records: "55",
                        duration: "18с",
                      },
                      {
                        timestamp: "2025-11-12 12:00",
                        source: "Товары Yandex",
                        status: "успех",
                        records: "450",
                        duration: "43с",
                      },
                    ].map((record, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-sm">
                          {record.timestamp}
                        </TableCell>
                        <TableCell className="text-sm">
                          {record.source}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {record.records}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {record.duration}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Пользовательские настройки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-semibold block mb-2">
                  Язык
                </label>
                <Select defaultValue="ru">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ru">Русский</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">
                  Часовой пояс
                </label>
                <Select defaultValue="msk">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="msk">Москва (GMT+3)</SelectItem>
                    <SelectItem value="ekb">Екатеринбург (GMT+5)</SelectItem>
                    <SelectItem value="sib">Новосибирск (GMT+7)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">
                  Валюта
                </label>
                <Select defaultValue="rub">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rub">RUB (₽)</SelectItem>
                    <SelectItem value="usd">USD ($)</SelectItem>
                    <SelectItem value="eur">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Уведомления</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" defaultChecked />
                    <span>Ошибки синхронизации</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" defaultChecked />
                    <span>Предупреждения о нехватке товаров</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" defaultChecked />
                    <span>Еженедельный сводный отчет</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" />
                    <span>Уведомления о крупных заказах (&gt; ₽100К)</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 justify-end border-t pt-6">
                <Button variant="outline">Сбросить до умолчаний</Button>
                <Button>Сохранить изменения</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
