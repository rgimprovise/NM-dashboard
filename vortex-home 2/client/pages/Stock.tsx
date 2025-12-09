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
import { Search, Loader, AlertCircle, Package } from "lucide-react";
import { dataService } from "@/services/dataService";
import { ProductSnapshot } from "../../shared/types/oneC";
import { OneCStockTurnoverRow } from "../../shared/types/oneC";

export default function Stock() {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<ProductSnapshot[]>([]);
  const [stockAnalytics, setStockAnalytics] = useState<{
    stockTurnover: OneCStockTurnoverRow[];
    slowMovers: OneCStockTurnoverRow[];
    fastMovers: OneCStockTurnoverRow[];
    totalTurnover: number;
    averageTurnover: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [productsData, analyticsData] = await Promise.all([
          dataService.getOneCProductSnapshot(),
          dataService.getOneCStockAnalytics(),
        ]);
        setProducts(productsData);
        setStockAnalytics(analyticsData);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load stock data";
        setError(message);
        console.error("Stock error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter products by search term (name or article)
  const filteredProducts = products.filter((product) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.article.toLowerCase().includes(searchLower)
    );
  });

  // Filter stock turnover by search term
  const filteredStockTurnover = stockAnalytics?.stockTurnover.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchLower) ||
      item.article.toLowerCase().includes(searchLower)
    );
  }) || [];

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Склад и остатки</h1>
          <p className="text-muted-foreground mt-1">
            Управление остатками товаров и оборачиваемостью склада
          </p>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Загрузка данных склада...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Склад и остатки</h1>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Ошибка при загрузке</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Склад и остатки</h1>
        <p className="text-muted-foreground mt-1">
          Управление остатками товаров и оборачиваемостью склада из 1С
        </p>
      </div>

      {/* Search Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Поиск по наименованию или артикулу..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Товары (1С)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Наименование</th>
                    <th className="text-left py-3 px-4 font-semibold">Артикул</th>
                    <th className="text-right py-3 px-4 font-semibold">Остаток</th>
                    <th className="text-right py-3 px-4 font-semibold">Остаток образца</th>
                    <th className="text-right py-3 px-4 font-semibold">Розничная цена</th>
                    <th className="text-right py-3 px-4 font-semibold">Уценка</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted">
                      <td className="py-3 px-4 font-medium">{product.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{product.article}</td>
                      <td className="text-right py-3 px-4">
                        <Badge
                          variant={product.stock > 0 ? "secondary" : "destructive"}
                        >
                          {product.stock}
                        </Badge>
                      </td>
                      <td className="text-right py-3 px-4">{product.sampleStock}</td>
                      <td className="text-right py-3 px-4 font-medium">
                        ₽{product.retailPrice.toLocaleString("ru-RU")}
                      </td>
                      <td className="text-right py-3 px-4">
                        {product.markdown > 0 ? (
                          <Badge variant="outline" className="text-orange-600">
                            ₽{product.markdown.toLocaleString("ru-RU")}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "Товары не найдены" : "Нет данных о товарах"}
            </div>
          )}
          {searchTerm && (
            <div className="mt-4 text-sm text-muted-foreground">
              Найдено: {filteredProducts.length} из {products.length}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Turnover Table */}
      {stockAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle>Оборачиваемость склада</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Общий оборот: {stockAnalytics.totalTurnover.toLocaleString("ru-RU")} | 
              Средний оборот: {stockAnalytics.averageTurnover.toFixed(2)}
            </p>
          </CardHeader>
          <CardContent>
            {filteredStockTurnover.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Артикул</th>
                      <th className="text-left py-3 px-4 font-semibold">Наименование</th>
                      <th className="text-left py-3 px-4 font-semibold">Ед. изм.</th>
                      <th className="text-right py-3 px-4 font-semibold">Начальный остаток</th>
                      <th className="text-right py-3 px-4 font-semibold">Приход</th>
                      <th className="text-right py-3 px-4 font-semibold">Расход</th>
                      <th className="text-right py-3 px-4 font-semibold">Конечный остаток</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStockTurnover.map((item, idx) => {
                      const turnover = item.incomingQty + item.outgoingQty;
                      const isFastMover = stockAnalytics.fastMovers.some(
                        (fm) => fm.article === item.article
                      );
                      const isSlowMover = stockAnalytics.slowMovers.some(
                        (sm) => sm.article === item.article
                      );

                      return (
                        <tr key={idx} className="border-b hover:bg-muted">
                          <td className="py-3 px-4 font-medium">{item.article}</td>
                          <td className="py-3 px-4">{item.name}</td>
                          <td className="py-3 px-4 text-muted-foreground">{item.uom}</td>
                          <td className="text-right py-3 px-4">{item.openingQty}</td>
                          <td className="text-right py-3 px-4">
                            <span className="text-green-600 font-medium">
                              +{item.incomingQty}
                            </span>
                          </td>
                          <td className="text-right py-3 px-4">
                            <span className="text-red-600 font-medium">
                              -{item.outgoingQty}
                            </span>
                          </td>
                          <td className="text-right py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <span className="font-medium">{item.closingQty}</span>
                              {isFastMover && (
                                <Badge variant="default" className="text-xs">
                                  Fast
                                </Badge>
                              )}
                              {isSlowMover && (
                                <Badge variant="outline" className="text-xs">
                                  Slow
                                </Badge>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "Данные не найдены" : "Нет данных об оборачиваемости"}
              </div>
            )}
            {searchTerm && (
              <div className="mt-4 text-sm text-muted-foreground">
                Найдено: {filteredStockTurnover.length} из {stockAnalytics.stockTurnover.length}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

