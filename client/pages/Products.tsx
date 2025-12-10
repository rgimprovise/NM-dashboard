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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, AlertCircle, Link2, Loader } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { dataService } from "@/services/dataService";

const STOCK_STATUS_COLORS = {
  in_stock: "bg-green-100 text-green-800",
  low_stock: "bg-yellow-100 text-yellow-800",
  out_of_stock: "bg-red-100 text-red-800",
};

type ProductSource = "yandex" | "onec" | "unified";

interface Product {
  id: string;
  name: string;
  offer_id: string;
  article?: string;
  category: string;
  price: number;
  stock_total: number;
  stock_status: "in_stock" | "low_stock" | "out_of_stock";
  source: ProductSource;
  has_c1_mapping?: boolean;
  yandexData?: any;
  oneCData?: any;
}

export default function Products() {
  const [activeTab, setActiveTab] = useState<ProductSource>("yandex");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  // Data states for each source
  const [yandexProducts, setYandexProducts] = useState<Product[]>([]);
  const [oneCProducts, setOneCProducts] = useState<Product[]>([]);
  const [unifiedProducts, setUnifiedProducts] = useState<Product[]>([]);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load Yandex products
  useEffect(() => {
    const loadYandexProducts = async () => {
      try {
        console.log("[Products] Loading Yandex products...");
        const data = await dataService.getProducts();
        console.log(`[Products] Received ${data.length} Yandex products`);
        
        const mapped = data.map((p: any) => ({
          id: p.offer_id || p.id,
          name: p.name || p.offer_id,
          offer_id: p.offer_id || "",
          article: p.offer_id, // Yandex uses offerId as article
          category: p.category || "Без категории",
          price: p.price || 0,
          stock_total: p.stock_total || 0,
          stock_status: p.stock_status || (p.stock_total > 0 ? "in_stock" : "out_of_stock"),
          source: "yandex" as ProductSource,
          has_c1_mapping: p.has_c1_mapping || false,
          yandexData: p,
        }));
        
        setYandexProducts(mapped);
      } catch (err) {
        console.error("[Products] Error loading Yandex products:", err);
        setYandexProducts([]);
      }
    };

    loadYandexProducts();
  }, []);

  // Load 1C products
  useEffect(() => {
    const loadOneCProducts = async () => {
      try {
        console.log("[Products] Loading 1C products...");
        const data = await dataService.getOneCProductSnapshot();
        console.log(`[Products] Received ${data.length} 1C products`);
        
        const mapped = data.map((p: any) => ({
          id: p.article || p.name,
          name: p.name,
          offer_id: p.article || "",
          article: p.article || "",
          category: p.category || "Без категории",
          price: p.retailPrice || 0,
          stock_total: p.stock || 0,
          stock_status: p.stock > 10 ? "in_stock" : (p.stock > 0 ? "low_stock" : "out_of_stock"),
          source: "onec" as ProductSource,
          has_c1_mapping: false,
          oneCData: p,
        }));
        
        setOneCProducts(mapped);
      } catch (err) {
        console.error("[Products] Error loading 1C products:", err);
        setOneCProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadOneCProducts();
  }, []);

  // Create unified products (matched by article/offerId)
  useEffect(() => {
    if (yandexProducts.length === 0 && oneCProducts.length === 0) {
      setUnifiedProducts([]);
      return;
    }

    console.log("[Products] Creating unified products...");
    
    // Create maps for quick lookup
    const yandexMap = new Map<string, Product>();
    yandexProducts.forEach(p => {
      const key = p.offer_id?.toLowerCase() || p.article?.toLowerCase() || "";
      if (key) yandexMap.set(key, p);
    });

    const oneCMap = new Map<string, Product>();
    oneCProducts.forEach(p => {
      const key = p.article?.toLowerCase() || p.offer_id?.toLowerCase() || "";
      if (key) oneCMap.set(key, p);
    });

    // Find matches and create unified products
    const unified: Product[] = [];
    const processedKeys = new Set<string>();

    // Process Yandex products
    yandexProducts.forEach(yandexProduct => {
      const key = yandexProduct.offer_id?.toLowerCase() || yandexProduct.article?.toLowerCase() || "";
      if (!key) return;

      const oneCProduct = oneCMap.get(key);
      
      if (oneCProduct) {
        // Match found - create unified product
        unified.push({
          id: key,
          name: oneCProduct.name || yandexProduct.name,
          offer_id: yandexProduct.offer_id || "",
          article: oneCProduct.article || yandexProduct.article || "",
          category: oneCProduct.category || yandexProduct.category || "Без категории",
          price: oneCProduct.price || yandexProduct.price || 0,
          stock_total: oneCProduct.stock_total || yandexProduct.stock_total || 0,
          stock_status: oneCProduct.stock_total > 10 ? "in_stock" : 
                       (oneCProduct.stock_total > 0 ? "low_stock" : "out_of_stock"),
          source: "unified" as ProductSource,
          has_c1_mapping: true,
          yandexData: yandexProduct.yandexData,
          oneCData: oneCProduct.oneCData,
        });
        processedKeys.add(key);
      }
    });

    console.log(`[Products] Created ${unified.length} unified products`);
    setUnifiedProducts(unified);
  }, [yandexProducts, oneCProducts]);

  // Get current products based on active tab
  const getCurrentProducts = (): Product[] => {
    switch (activeTab) {
      case "yandex":
        return yandexProducts;
      case "onec":
        return oneCProducts;
      case "unified":
        return unifiedProducts;
      default:
        return [];
    }
  };

  const products = getCurrentProducts();

  // Get unique categories
  const uniqueCategories = new Set(products.map((p) => p.category).filter((cat): cat is string => !!cat));
  const categories = ["all", ...Array.from(uniqueCategories)];

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.offer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.article?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;
    const matchesStock =
      stockFilter === "all" || product.stock_status === stockFilter;
    return matchesSearch && matchesCategory && matchesStock;
  });

  // Sort products with direction
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let result = 0;
    if (sortBy === "name") {
      result = a.name.localeCompare(b.name);
    } else if (sortBy === "price") {
      result = a.price - b.price;
    } else if (sortBy === "stock") {
      result = a.stock_total - b.stock_total;
    }
    return sortDirection === "asc" ? result : -result;
  });

  // Out of stock products
  const outOfStockProducts = products.filter((p) => p.stock_status === "out_of_stock");
  const lowStockProducts = products.filter((p) => p.stock_status === "low_stock");

  const getTabLabel = (tab: ProductSource) => {
    switch (tab) {
      case "yandex":
        return `Яндекс Маркет (${yandexProducts.length})`;
      case "onec":
        return `1C (${oneCProducts.length})`;
      case "unified":
        return `Сводная (${unifiedProducts.length})`;
    }
  };

  if (loading && activeTab === "onec") {
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ProductSource)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="yandex">{getTabLabel("yandex")}</TabsTrigger>
          <TabsTrigger value="onec">{getTabLabel("onec")}</TabsTrigger>
          <TabsTrigger value="unified">{getTabLabel("unified")}</TabsTrigger>
        </TabsList>

        {/* Filters - shown for all tabs */}
        <Card className="mt-4">
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
                onChange={(e) => {
                  const newSortBy = e.target.value;
                  if (sortBy === newSortBy) {
                    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                  } else {
                    setSortBy(newSortBy);
                    setSortDirection("asc");
                  }
                }}
              className="px-3 py-2 border border-input rounded-md bg-background text-sm"
            >
                <option value="name">По названию {sortBy === "name" ? (sortDirection === "asc" ? "↑" : "↓") : ""}</option>
                <option value="price">По цене {sortBy === "price" ? (sortDirection === "asc" ? "↑" : "↓") : ""}</option>
                <option value="stock">По остатку {sortBy === "stock" ? (sortDirection === "asc" ? "↑" : "↓") : ""}</option>
            </select>
              <button
                onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                className="px-3 py-2 border border-input rounded-md bg-background text-sm hover:bg-muted"
                title={sortDirection === "asc" ? "По возрастанию" : "По убыванию"}
              >
                {sortDirection === "asc" ? "↑" : "↓"}
              </button>
          </div>
        </CardContent>
      </Card>

        {/* Yandex Products Tab */}
        <TabsContent value="yandex" className="space-y-4">
      <Card>
        <CardHeader>
              <CardTitle>Товары Яндекс Маркет ({sortedProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название товара</TableHead>
                  <TableHead>Категория</TableHead>
                      <TableHead>Артикул (offerId)</TableHead>
                  <TableHead className="text-right">Цена</TableHead>
                  <TableHead className="text-right">Остаток</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-center">Связь с 1C</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                    {sortedProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          Нет товаров из Яндекс Маркет
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedProducts.map((product) => (
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
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 1C Products Tab */}
        <TabsContent value="onec" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Товары 1C ({sortedProducts.length})</CardTitle>
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
                      <TableHead className="text-center">Связь с Яндекс</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          Нет товаров из 1C. Загрузите файл номенклатуры через "Загрузка 1С".
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedProducts.map((product) => (
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
                            {product.article || product.offer_id}
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
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Unified Products Tab */}
        <TabsContent value="unified" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Сводная статистика ({sortedProducts.length})</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Товары, которые найдены и в Яндекс Маркет, и в 1C (совпадение по артикулу)
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название товара</TableHead>
                      <TableHead>Категория</TableHead>
                      <TableHead>Артикул</TableHead>
                      <TableHead className="text-right">Цена (1C)</TableHead>
                      <TableHead className="text-right">Остаток (1C)</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead className="text-center">Связь</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          Нет совпадающих товаров. Загрузите данные из Яндекс Маркет и 1C.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedProducts.map((product) => (
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
                            {product.article || product.offer_id}
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
                            <Link2 className="w-4 h-4 text-green-600 mx-auto" />
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
                      ))
                    )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>

      {/* Stock Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Всего товаров</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              В системе ({activeTab === "yandex" ? "Яндекс" : activeTab === "onec" ? "1C" : "Сводная"})
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">В наличии</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {products.filter((p) => p.stock_status === "in_stock").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Доступно для продажи (остаток ≥ 10)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Критический уровень</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {products.filter((p) => p.stock_status === "out_of_stock" || p.stock_status === "low_stock").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Нет в наличии или низкий остаток
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
                  <p className="text-foreground mt-1 font-mono">{selectedProduct.article || selectedProduct.offer_id}</p>
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

              {/* Source Info */}
                <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Источники данных</h3>
                <div className="space-y-2">
                  {selectedProduct.source === "yandex" && (
                    <Badge variant="outline" className="bg-blue-50">Яндекс Маркет</Badge>
                  )}
                  {selectedProduct.source === "onec" && (
                    <Badge variant="outline" className="bg-green-50">1C</Badge>
                  )}
                  {selectedProduct.source === "unified" && (
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-blue-50">Яндекс Маркет</Badge>
                      <Badge variant="outline" className="bg-green-50">1C</Badge>
                    </div>
                  )}
                </div>
              </div>

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
