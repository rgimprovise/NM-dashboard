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
// import { mockProducts } from "@/lib/mockData"; // Убрано - используем реальные данные из 1C
import { Search, AlertCircle, Link2, Loader } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { dataService } from "@/services/dataService";

const STOCK_STATUS_COLORS = {
  in_stock: "bg-green-100 text-green-800",
  low_stock: "bg-yellow-100 text-yellow-800",
  out_of_stock: "bg-red-100 text-red-800",
};

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        // Используем данные из 1C (единый источник)
        const data = await dataService.getOneCProductSnapshot();
        setProducts(data.map(p => ({
          id: p.article || p.name,
          name: p.name,
          offer_id: p.article || "",
          category: p.category || "Без категории",
          price: p.retailPrice || 0,
          stock_total: p.stock || 0,
          stock_status: p.stock > 0 ? "in_stock" : "out_of_stock",
        })));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load products";
        setError(message);
        console.error("Products error:", err);
        // Не используем mockProducts - показываем пустой список
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Get unique categories
  const categories = ["all", ...new Set(products.map((p) => p.category))];

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.offer_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;
    const matchesStock =
      stockFilter === "all" || product.stock_status === stockFilter;
    return matchesSearch && matchesCategory && matchesStock;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "price") return b.price - a.price;
    if (sortBy === "stock") return b.stock_total - a.stock_total;
    return 0;
  });

  // Out of stock products
  const outOfStockProducts = products.filter((p) => p.stock_status === "out_of_stock");

  // Low stock products
  const lowStockProducts = products.filter((p) => p.stock_status === "low_stock");

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Товары и склад</h1>
          <p className="text-muted-foreground mt-1">
            Управление товарами, уровнем запасов и ценообразованием
          </p>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Загрузка товаров...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Товары и склад</h1>
        <p className="text-muted-foreground mt-1">
          Управление товарами, уровнем запасов и ценообразованием
        </p>
      </div>

      {/* Error Alert */}
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

      {/* Alerts */}
      {(outOfStockProducts.length > 0 || lowStockProducts.length > 0) && (
        <div className="space-y-3">
          {outOfStockProducts.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <h3 className="font-semibold text-red-900">
                      {outOfStockProducts.length} товаров нет в наличии
                    </h3>
                    <p className="text-sm text-red-700">
                      Требуется немедленное действие, чтобы предотвратить потерю продаж
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {lowStockProducts.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <h3 className="font-semibold text-yellow-900">
                      {lowStockProducts.length} товаров с низким остатком
                    </h3>
                    <p className="text-sm text-yellow-700">
                      Эти товары рискуют остаться без остатков
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по названию или артикулу..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-sm"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "all" ? "Все категории" : cat}
                </option>
              ))}
            </select>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-sm"
            >
              <option value="all">Все статусы</option>
              <option value="in_stock">В наличии</option>
              <option value="low_stock">Низкий остаток</option>
              <option value="out_of_stock">Нет в наличии</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-sm"
            >
              <option value="name">По названию</option>
              <option value="price">По цене</option>
              <option value="stock">По остатку</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Товары ({sortedProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название товара</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Артикул</TableHead>
                  <TableHead className="text-right">Цена</TableHead>
                  <TableHead className="text-right">Остаток</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-center">Связь с 1C</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setDialogOpen(true);
                        }}
                        className="font-medium text-primary hover:underline text-sm"
                      >
                        {product.name}
                      </button>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {product.category}
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {product.offer_id}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ₽{product.price.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold">{product.stock_total}</span>
                      <p className="text-xs text-muted-foreground">шт.</p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          STOCK_STATUS_COLORS[
                            product.stock_status as keyof typeof STOCK_STATUS_COLORS
                          ] || "bg-gray-100 text-gray-800"
                        }
                      >
                        {product.stock_status === "in_stock"
                          ? "В наличии"
                          : product.stock_status === "low_stock"
                            ? "Мало"
                            : "Нет"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {product.has_c1_mapping ? (
                        <Link2 className="w-4 h-4 text-green-600 mx-auto" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-dashed border-gray-300 mx-auto rounded" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedProduct(product);
                          setDialogOpen(true);
                        }}
                      >
                        Детали
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Stock Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Всего товаров</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              В системе
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">В наличии</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {products.filter((p) => p.stock_total > 0).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Доступно для продажи
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Критический уровень</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {products.filter((p) => p.stock_status !== "in_stock").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Требует внимания
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Product Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Детали товара</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">
                    Название
                  </label>
                  <p className="text-foreground mt-1">{selectedProduct.name}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">
                    Категория
                  </label>
                  <p className="text-foreground mt-1">{selectedProduct.category}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">
                    Артикул
                  </label>
                  <p className="text-foreground mt-1 font-mono">{selectedProduct.offer_id}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">
                    Цена
                  </label>
                  <p className="text-foreground mt-1 font-semibold">
                    ₽{selectedProduct.price.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Stock Info */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Информация об остатках</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">
                      Текущий остаток
                    </label>
                    <p className="text-foreground mt-1 text-lg font-bold">
                      {selectedProduct.stock_total} шт.
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">
                      Статус
                    </label>
                    <Badge
                      className={
                        STOCK_STATUS_COLORS[
                          selectedProduct.stock_status as keyof typeof STOCK_STATUS_COLORS
                        ]
                      }
                    >
                      {selectedProduct.stock_status === "in_stock"
                        ? "В наличии"
                        : selectedProduct.stock_status === "low_stock"
                          ? "Низкий остаток"
                          : "Нет в наличии"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 1C Mapping */}
              {selectedProduct.c1_product && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-green-600" />
                    Связь с 1C
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-green-50 p-3 rounded">
                    <div>
                      <label className="text-sm font-semibold text-muted-foreground">
                        Код 1C
                      </label>
                      <p className="text-foreground mt-1 font-mono">
                        {selectedProduct.c1_product.code}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-muted-foreground">
                        Базовая цена
                      </label>
                      <p className="text-foreground mt-1">
                        ₽{selectedProduct.c1_product.base_price.toLocaleString()}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-semibold text-muted-foreground">
                        Маржа
                      </label>
                      <p className="text-foreground mt-1 font-semibold">
                        {selectedProduct.c1_product.margin}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end border-t pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Закрыть
                </Button>
                <Button>Редактировать</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
