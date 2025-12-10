import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Loader,
  Save,
  Edit2,
  X,
} from "lucide-react";

interface TokenStatus {
  yandex: {
    token: string | null;
    campaignIds: string[];
    accountId: string | null;
    connected: boolean;
    lastCheck: string;
    error?: string;
  };
  vk: {
    accountId: string | null;
    clientId: string | null;
    hasToken: boolean;
    connected: boolean;
    expiresAt: string | null;
    hoursUntilExpiry: number | null;
    lastCheck: string;
  };
}

interface SyncStatus {
  name: string;
  display_name: string;
  frequency: string;
  status: "success" | "error" | "pending";
  last_sync: string;
  next_sync: string;
  records_processed: number;
  duration_seconds: number;
}

interface SyncHistoryItem {
  timestamp: string;
  source: string;
  status: string;
  records: string;
  duration: string;
}

// Form state for editing
interface YandexFormData {
  token: string;
  campaignIds: string;
  businessId: string;
}

interface VKFormData {
  token: string;
  accountId: string;
  clientId: string;
  clientSecret: string;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("tokens");
  const [showYandexToken, setShowYandexToken] = useState(false);
  const [showVKToken, setShowVKToken] = useState(false);
  const [syncRunning, setSyncRunning] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus[]>([]);
  const [syncHistory, setSyncHistory] = useState<SyncHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  
  // Edit mode states
  const [editingYandex, setEditingYandex] = useState(false);
  const [editingVK, setEditingVK] = useState(false);
  const [savingYandex, setSavingYandex] = useState(false);
  const [savingVK, setSavingVK] = useState(false);
  
  // Form data
  const [yandexForm, setYandexForm] = useState<YandexFormData>({
    token: "",
    campaignIds: "",
    businessId: "",
  });
  
  const [vkForm, setVKForm] = useState<VKFormData>({
    token: "",
    accountId: "",
    clientId: "",
    clientSecret: "",
  });

  // Load token status on mount and when tokens tab is active
  useEffect(() => {
    if (activeTab === "tokens") {
      loadTokenStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Load sync status when sync tab is active
  useEffect(() => {
    if (activeTab === "sync") {
      loadSyncStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Load sync history when history tab is active
  useEffect(() => {
    if (activeTab === "history") {
      loadSyncHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadTokenStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/settings/token-status");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.success && result.data) {
        setTokenStatus(result.data);
      }
    } catch (error) {
      console.error("Error loading token status:", error);
      setTokenStatus({
        yandex: {
          token: null,
          campaignIds: [],
          accountId: null,
          connected: false,
          lastCheck: new Date().toISOString(),
        },
        vk: {
          accountId: null,
          clientId: null,
          hasToken: false,
          connected: false,
          expiresAt: null,
          hoursUntilExpiry: null,
          lastCheck: new Date().toISOString(),
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSyncStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/settings/sync-status");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.success && result.data) {
        setSyncStatus(result.data);
      }
    } catch (error) {
      console.error("Error loading sync status:", error);
      setSyncStatus([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSyncHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/settings/sync-history");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.success && result.data) {
        setSyncHistory(result.data);
      }
    } catch (error) {
      console.error("Error loading sync history:", error);
      setSyncHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (provider: "yandex" | "vk") => {
    try {
      setTestingConnection(provider);
      const response = await fetch("/api/settings/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ ${provider === "yandex" ? "Yandex" : "VK"} подключение успешно!\n${result.message || ""}`);
        await loadTokenStatus();
      } else {
        alert(`❌ Ошибка подключения к ${provider === "yandex" ? "Yandex" : "VK"}:\n${result.error || "Unknown error"}`);
      }
    } catch (error) {
      alert(`❌ Ошибка при тестировании подключения: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setTestingConnection(null);
    }
  };

  const handleTriggerSync = async (source: string) => {
    try {
      setSyncRunning(true);
      const response = await fetch("/api/settings/trigger-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ Синхронизация ${source === "all" ? "всех источников" : source} запущена`);
        await Promise.all([loadSyncStatus(), loadSyncHistory()]);
      } else {
        alert(`❌ Ошибка синхронизации: ${result.error || "Unknown error"}`);
      }
    } catch (error) {
      alert(`❌ Ошибка при запуске синхронизации: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSyncRunning(false);
    }
  };

  // Save Yandex settings
  const handleSaveYandex = async () => {
    try {
      setSavingYandex(true);
      const response = await fetch("/api/settings/yandex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: yandexForm.token || null,
          campaignIds: yandexForm.campaignIds
            .split(",")
            .map(id => id.trim())
            .filter(Boolean),
          businessId: yandexForm.businessId || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert("✅ Настройки Yandex сохранены!");
        setEditingYandex(false);
        await loadTokenStatus();
      } else {
        alert(`❌ Ошибка сохранения: ${result.error || "Unknown error"}`);
      }
    } catch (error) {
      alert(`❌ Ошибка: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSavingYandex(false);
    }
  };

  // Save VK settings
  const handleSaveVK = async () => {
    try {
      setSavingVK(true);
      const response = await fetch("/api/settings/vk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: vkForm.token || null,
          accountId: vkForm.accountId || null,
          clientId: vkForm.clientId || null,
          clientSecret: vkForm.clientSecret || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert("✅ Настройки VK сохранены!");
        setEditingVK(false);
        await loadTokenStatus();
      } else {
        alert(`❌ Ошибка сохранения: ${result.error || "Unknown error"}`);
      }
    } catch (error) {
      alert(`❌ Ошибка: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSavingVK(false);
    }
  };

  // Start editing Yandex
  const startEditingYandex = () => {
    setYandexForm({
      token: "",
      campaignIds: tokenStatus?.yandex?.campaignIds?.join(", ") || "",
      businessId: tokenStatus?.yandex?.accountId || "",
    });
    setEditingYandex(true);
  };

  // Start editing VK
  const startEditingVK = () => {
    setVKForm({
      token: "",
      accountId: tokenStatus?.vk?.accountId || "",
      clientId: tokenStatus?.vk?.clientId || "",
      clientSecret: "",
    });
    setEditingVK(true);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getVKExpiryBadge = (hoursUntilExpiry: number | null) => {
    if (hoursUntilExpiry === null) return null;
    
    if (hoursUntilExpiry < 0) {
      return (
        <Badge className="bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Истек
        </Badge>
      );
    } else if (hoursUntilExpiry < 24) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Истекает через {Math.round(hoursUntilExpiry)}ч
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Активно
        </Badge>
      );
    }
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
          {loading && !tokenStatus ? (
            <div className="flex items-center justify-center h-64">
              <Loader className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Yandex Token */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Yandex Market API</CardTitle>
                    <div className="flex items-center gap-2">
                      {tokenStatus?.yandex?.connected ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Активно
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Не подключено
                        </Badge>
                      )}
                      {!editingYandex && (
                        <Button variant="outline" size="sm" onClick={startEditingYandex}>
                          <Edit2 className="w-4 h-4 mr-1" />
                          Редактировать
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingYandex ? (
                    // Edit mode
                    <>
                      <div>
                        <label className="text-sm font-semibold text-muted-foreground block mb-2">
                          API токен
                        </label>
                        <Input
                          type="password"
                          value={yandexForm.token}
                          onChange={(e) => setYandexForm({ ...yandexForm, token: e.target.value })}
                          placeholder="Введите API токен Yandex Market"
                          className="font-mono"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Оставьте пустым, чтобы сохранить текущий токен
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-muted-foreground block mb-2">
                          ID кампаний (через запятую)
                        </label>
                        <Input
                          value={yandexForm.campaignIds}
                          onChange={(e) => setYandexForm({ ...yandexForm, campaignIds: e.target.value })}
                          placeholder="21621656, 22303110, ..."
                          className="font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-muted-foreground block mb-2">
                          ID аккаунта (Business ID)
                        </label>
                        <Input
                          value={yandexForm.businessId}
                          onChange={(e) => setYandexForm({ ...yandexForm, businessId: e.target.value })}
                          placeholder="892689"
                          className="font-mono"
                        />
                      </div>

                      <div className="flex gap-3 justify-end border-t pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setEditingYandex(false)}
                          disabled={savingYandex}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Отмена
                        </Button>
                        <Button onClick={handleSaveYandex} disabled={savingYandex}>
                          {savingYandex ? (
                            <Loader className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 mr-1" />
                          )}
                          Сохранить
                        </Button>
                      </div>
                    </>
                  ) : (
                    // View mode
                    <>
                      <div>
                        <label className="text-sm font-semibold text-muted-foreground block mb-2">
                          ID кампании
                        </label>
                        <div className="bg-muted p-3 rounded font-mono text-sm">
                          {tokenStatus?.yandex?.campaignIds?.join(", ") || "Не настроено"}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-muted-foreground block mb-2">
                          API токен
                        </label>
                        <div className="flex gap-2">
                          <input
                            type={showYandexToken ? "text" : "password"}
                            value={tokenStatus?.yandex?.token || "Токен не настроен"}
                            readOnly
                            className="flex-1 px-3 py-2 border border-input rounded-md bg-muted font-mono text-sm"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowYandexToken(!showYandexToken)}
                            disabled={!tokenStatus?.yandex?.token}
                          >
                            {showYandexToken ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {tokenStatus?.yandex?.error && (
                        <div className="bg-red-50 border border-red-200 p-3 rounded text-sm text-red-800">
                          <AlertCircle className="w-4 h-4 inline mr-2" />
                          Ошибка: {tokenStatus.yandex?.error}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="text-muted-foreground block mb-1">
                            Статус
                          </label>
                          <div className="flex items-center gap-2">
                            {tokenStatus?.yandex?.connected ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-foreground">Подключено</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-4 h-4 text-red-600" />
                                <span className="text-foreground">Не подключено</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="text-muted-foreground block mb-1">
                            Последняя проверка
                          </label>
                          <span className="text-foreground">
                            {tokenStatus?.yandex?.lastCheck ? formatDate(tokenStatus.yandex?.lastCheck) : "Никогда"}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end border-t pt-4">
                        <Button
                          variant="outline"
                          onClick={() => handleTestConnection("yandex")}
                          disabled={testingConnection === "yandex" || !tokenStatus?.yandex?.token}
                        >
                          {testingConnection === "yandex" ? (
                            <>
                              <Loader className="w-4 h-4 mr-2 animate-spin" />
                              Тестирование...
                            </>
                          ) : (
                            "Тест подключения"
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* VK Token */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>VK Ads API v2</CardTitle>
                    <div className="flex items-center gap-2">
                      {getVKExpiryBadge(tokenStatus?.vk?.hoursUntilExpiry || null)}
                      {!editingVK && (
                        <Button variant="outline" size="sm" onClick={startEditingVK}>
                          <Edit2 className="w-4 h-4 mr-1" />
                          Редактировать
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingVK ? (
                    // Edit mode
                    <>
                      <div>
                        <label className="text-sm font-semibold text-muted-foreground block mb-2">
                          Access Token
                        </label>
                        <Input
                          type="password"
                          value={vkForm.token}
                          onChange={(e) => setVKForm({ ...vkForm, token: e.target.value })}
                          placeholder="Введите Access Token VK Ads"
                          className="font-mono"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Оставьте пустым, чтобы сохранить текущий токен
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-muted-foreground block mb-2">
                          ID аккаунта
                        </label>
                        <Input
                          value={vkForm.accountId}
                          onChange={(e) => setVKForm({ ...vkForm, accountId: e.target.value })}
                          placeholder="8798776"
                          className="font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-muted-foreground block mb-2">
                          Client ID
                        </label>
                        <Input
                          value={vkForm.clientId}
                          onChange={(e) => setVKForm({ ...vkForm, clientId: e.target.value })}
                          placeholder="b9AHG7669xtg1nvq"
                          className="font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-muted-foreground block mb-2">
                          Client Secret
                        </label>
                        <Input
                          type="password"
                          value={vkForm.clientSecret}
                          onChange={(e) => setVKForm({ ...vkForm, clientSecret: e.target.value })}
                          placeholder="Введите Client Secret"
                          className="font-mono"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Оставьте пустым, чтобы сохранить текущий secret
                        </p>
                      </div>

                      <div className="flex gap-3 justify-end border-t pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setEditingVK(false)}
                          disabled={savingVK}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Отмена
                        </Button>
                        <Button onClick={handleSaveVK} disabled={savingVK}>
                          {savingVK ? (
                            <Loader className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 mr-1" />
                          )}
                          Сохранить
                        </Button>
                      </div>
                    </>
                  ) : (
                    // View mode
                    <>
                      {tokenStatus?.vk?.hoursUntilExpiry !== null && tokenStatus?.vk?.hoursUntilExpiry !== undefined && tokenStatus?.vk?.hoursUntilExpiry < 24 && tokenStatus?.vk?.hoursUntilExpiry > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded flex gap-3">
                          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                          <p className="text-sm text-yellow-800">
                            Ваш VK токен доступа истекает через {Math.round(tokenStatus.vk?.hoursUntilExpiry || 0)} часов. Пожалуйста, обновите его
                            для поддержания непрерывной синхронизации данных.
                          </p>
                        </div>
                      )}

                      {tokenStatus?.vk?.hoursUntilExpiry !== null && tokenStatus?.vk?.hoursUntilExpiry !== undefined && tokenStatus?.vk?.hoursUntilExpiry < 0 && (
                        <div className="bg-red-50 border border-red-200 p-3 rounded flex gap-3">
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                          <p className="text-sm text-red-800">
                            Ваш VK токен доступа истек. Необходимо обновить токен для продолжения работы.
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-semibold text-muted-foreground block mb-2">
                          ID аккаунта
                        </label>
                        <div className="bg-muted p-3 rounded font-mono text-sm">
                          {tokenStatus?.vk?.accountId || "Не настроено"}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-muted-foreground block mb-2">
                          Токен доступа
                        </label>
                        <div className="flex gap-2">
                          <input
                            type={showVKToken ? "text" : "password"}
                            value={tokenStatus?.vk?.hasToken ? "Токен настроен (скрыт)" : "Токен не настроен"}
                            readOnly
                            className="flex-1 px-3 py-2 border border-input rounded-md bg-muted font-mono text-sm"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowVKToken(!showVKToken)}
                            disabled={!tokenStatus?.vk?.hasToken}
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
                            {tokenStatus?.vk?.connected ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-foreground">Подключено</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-4 h-4 text-red-600" />
                                <span className="text-foreground">Не подключено</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="text-muted-foreground block mb-1">
                            Истекает
                          </label>
                          <span className={tokenStatus?.vk?.hoursUntilExpiry && tokenStatus?.vk?.hoursUntilExpiry < 24 ? "text-yellow-600 font-medium" : "text-foreground"}>
                            {tokenStatus?.vk?.expiresAt ? formatDate(tokenStatus.vk?.expiresAt) : "Неизвестно"}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end border-t pt-4">
                        <Button
                          variant="outline"
                          onClick={() => handleTestConnection("vk")}
                          disabled={testingConnection === "vk" || !tokenStatus?.vk?.hasToken}
                        >
                          {testingConnection === "vk" ? (
                            <>
                              <Loader className="w-4 h-4 mr-2 animate-spin" />
                              Тестирование...
                            </>
                          ) : (
                            "Тест подключения"
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          )}
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
                  <RefreshCw className={`w-4 h-4 mr-2 ${syncRunning ? "animate-spin" : ""}`} />
                  {syncRunning ? "Синхронизация..." : "Синхронизировать"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading && syncStatus.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <Loader className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
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
                      {syncStatus.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            Нет данных о синхронизации
                          </TableCell>
                        </TableRow>
                      ) : (
                        syncStatus.map((sync) => (
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
                                    : sync.status === "error"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }
                              >
                                {sync.status === "success" ? (
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                ) : (
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                )}
                                {sync.status === "success" ? "успех" : sync.status === "error" ? "ошибка" : "ожидание"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDate(sync.last_sync)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDate(sync.next_sync)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleTriggerSync(sync.name)}
                                disabled={syncRunning}
                              >
                                Синхр.
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
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
              {loading && syncHistory.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <Loader className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
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
                      {syncHistory.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            Нет истории синхронизации
                          </TableCell>
                        </TableRow>
                      ) : (
                        syncHistory.map((record, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-sm">
                              {formatDate(record.timestamp)}
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
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
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
