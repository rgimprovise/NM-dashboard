import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { mockOrders, mockTopProducts } from "@/lib/mockData";
import { Search, MapPin, AlertCircle, Loader } from "lucide-react";
import { dataService } from "@/services/dataService";
import type { Order } from "@/types/dashboard";

const STATUS_COLORS = {
  DELIVERED: "bg-green-100 text-green-800",
  DELIVERY: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-yellow-100 text-yellow-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function Sales() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [period, setPeriod] = useState("30d");
  const [orders, setOrders] = useState<Order[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [ordersData, productsData] = await Promise.all([
          dataService.getOrders(period),
          dataService.getTopProducts(period),
        ]);
        setOrders(ordersData);
        setTopProducts(productsData);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load orders";
        setError(message);
        console.error("Sales error:", err);
        // Fallback to mock data
        setOrders(mockOrders);
        setTopProducts(mockTopProducts);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [period]);

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.id.toString().includes(searchTerm);
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesRegion = regionFilter === "all" || order.region === regionFilter;
    return matchesSearch && matchesStatus && matchesRegion;
  });

  // Get unique regions
  const regions = ["all", ...new Set(orders.map((o) => o.region))];

  // Category breakdown
  const categoryBreakdown = [
    { name: "Кухонные гарнитуры", value: 850000, count: 125 },
    { name: "Шкафы", value: 520000, count: 98 },
    { name: "Диваны", value: 525000, count: 35 },
    { name: "Столы", value: 280000, count: 45 },
    { name: "Кресла", value: 140000, count: 28 },
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Аналитика продаж</h1>
          <p className="text-muted-foreground mt-1">
            Отслеживание заказов и мониторинг производительности товаров
          </p>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Загрузка заказов...</p>
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
          <h1 className="text-3xl font-bold text-foreground">Аналитика продаж</h1>
          <p className="text-muted-foreground mt-1">
            Отслеживание заказов и мониторинг производительности товаров
          </p>
        </div>
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">
              {orders.length}
            </div>
            <p className="text-sm text-muted-foreground">Всего заказов</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">
              ₽{(orders.reduce((sum, o) => sum + o.total, 0) / 1000000).toFixed(2)}M
            </div>
            <p className="text-sm text-muted-foreground">Общая выручка</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">
              {orders.length > 0
                ? `${(orders.reduce((sum, o) => sum + o.total, 0) / orders.length / 1000).toFixed(0)}K`
                : "0K"}
            </div>
            <p className="text-sm text-muted-foreground">Средний чек</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">
              {orders.length > 0 ? (
                (orders.filter((o) => o.status === "DELIVERED").length /
                  orders.length) *
                100
              ).toFixed(0) : "0"}
              %
            </div>
            <p className="text-sm text-muted-foreground">% доставленных</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по ID заказа..."
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
              <option value="DELIVERED">Доставлен</option>
              <option value="DELIVERY">На доставке</option>
              <option value="PROCESSING">В обработке</option>
              <option value="CANCELLED">Отменен</option>
            </select>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-sm"
            >
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region === "all" ? "Все регионы" : region}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Последние заказы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID заказа</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Регион</TableHead>
                  <TableHead className="text-right">Товаров</TableHead>
                  <TableHead className="text-right">Сумма</TableHead>
                  <TableHead className="text-right">Доставка</TableHead>
                  <TableHead className="text-right">Итого</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(order.creation_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        {order.region}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{order.items_count}</TableCell>
                    <TableCell className="text-right">
                      ₽{(order.items_total / 1000).toFixed(0)}K
                    </TableCell>
                    <TableCell className="text-right">
                      ₽{(order.delivery_cost / 1000).toFixed(1)}K
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ₽{(order.total / 1000).toFixed(0)}K
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          STATUS_COLORS[
                            order.status as keyof typeof STATUS_COLORS
                          ] || "bg-gray-100 text-gray-800"
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Category Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Анализ категорий</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Категория</TableHead>
                  <TableHead className="text-right">Заказы</TableHead>
                  <TableHead className="text-right">Выручка</TableHead>
                  <TableHead className="text-right">Средний чек</TableHead>
                  <TableHead className="text-right">Доля</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryBreakdown.map((cat) => (
                  <TableRow key={cat.name}>
                    <TableCell className="font-medium text-sm">{cat.name}</TableCell>
                    <TableCell className="text-right">{cat.count}</TableCell>
                    <TableCell className="text-right font-semibold">
                      ₽{(cat.value / 1000).toFixed(0)}K
                    </TableCell>
                    <TableCell className="text-right">
                      ₽{(cat.value / cat.count / 1000).toFixed(1)}K
                    </TableCell>
                    <TableCell className="text-right">
                      {(
                        (cat.value /
                          categoryBreakdown.reduce((sum, c) => sum + c.value, 0)) *
                        100
                      ).toFixed(1)}
                      %
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Product Performance Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Производительность топ-товаров</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProducts.map((product) => (
              <div key={product.product_id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-foreground">
                    {product.name.substring(0, 40)}
                  </span>
                  <span className="text-muted-foreground">
                    ₽{(product.revenue / 1000).toFixed(0)}K ({product.orders} заказов)
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{
                      width: `${product.share}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
