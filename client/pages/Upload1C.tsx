import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  Link2,
  Loader,
} from "lucide-react";
import { ExcelParser, type ParsedProduct } from "@/services/excelParser";
import { UploadResult } from "../../shared/types/oneC";
import { dataService } from "@/services/dataService";

type FileType = "products" | "returns" | "sales" | "stock-turnover" | "categories";

interface ColumnMapping {
  // Для номенклатуры (products)
  code?: string;
  name?: string;
  article?: string;
  category?: string;
  base_price?: string;
  cost_price?: string;
  brand?: string;
  collection?: string;
  stock?: string;
  sampleStock?: string;
  retailPrice?: string;
  markdown?: string;
  // Для возвратов (returns)
  documentNumber?: string;
  date?: string;
  amount?: string;
  customer?: string;
  operation?: string;
  // Для продаж (sales)
  manager?: string;
  revenue?: string;
  cost?: string;
  margin?: string;
  marginPercent?: string;
  // Для оборачиваемости (stock-turnover)
  uom?: string;
  openingQty?: string;
  incomingQty?: string;
  outgoingQty?: string;
  closingQty?: string;
  // Для категорий (categories)
  description?: string;
}

// Определение полей для каждого типа файла
const FILE_TYPE_FIELDS: Record<FileType, Array<{ key: keyof ColumnMapping; label: string; required: boolean }>> = {
  products: [
    { key: "name", label: "Наименование", required: true },
    { key: "article", label: "Артикул", required: true },
    { key: "stock", label: "Остаток", required: false },
    { key: "sampleStock", label: "Остаток образца", required: false },
    { key: "retailPrice", label: "Розничные цены", required: false },
    { key: "markdown", label: "Уценка", required: false },
    { key: "category", label: "Категория", required: false },
    { key: "brand", label: "Бренд", required: false },
    { key: "collection", label: "Коллекция", required: false },
  ],
  returns: [
    { key: "documentNumber", label: "Номер документа", required: true },
    { key: "date", label: "Дата", required: false },
    { key: "amount", label: "Сумма", required: false },
    { key: "customer", label: "Клиент", required: false },
    { key: "operation", label: "Операция", required: false },
  ],
  sales: [
    { key: "manager", label: "Менеджер", required: true },
    { key: "documentNumber", label: "Номер документа", required: true },
    { key: "date", label: "Дата", required: false },
    { key: "revenue", label: "Выручка", required: false },
    { key: "cost", label: "Себестоимость", required: false },
    { key: "margin", label: "Маржа", required: false },
    { key: "marginPercent", label: "Маржа %", required: false },
  ],
  "stock-turnover": [
    { key: "article", label: "Артикул", required: true },
    { key: "name", label: "Наименование", required: true },
    { key: "uom", label: "Ед. изм.", required: false },
    { key: "openingQty", label: "Начальный остаток", required: false },
    { key: "incomingQty", label: "Приход", required: false },
    { key: "outgoingQty", label: "Расход", required: false },
    { key: "closingQty", label: "Конечный остаток", required: false },
  ],
  categories: [
    { key: "name", label: "Название", required: true },
    { key: "description", label: "Описание", required: false },
  ],
};

export default function Upload1C() {
  const [activeTab, setActiveTab] = useState("upload");
  const [fileType, setFileType] = useState<FileType>("products");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [encoding, setEncoding] = useState("utf-8");
  const [separator, setSeparator] = useState(";");
  const [sheetName, setSheetName] = useState<string>("");
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [headerRow, setHeaderRow] = useState("1");
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [parseErrors, setParseErrors] = useState<
    Array<{ row: number; field: string; error: string }>
  >([]);
  const [parseStats, setParseStats] = useState<{
    total_rows: number;
    processed: number;
    created: number;
    errors: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<UploadResult[]>([]);

  // Загружаем историю и маппинги при монтировании
  useEffect(() => {
    loadUploadHistory();
    if (activeTab === "mappings") {
      loadMappings();
    }
  }, [activeTab]);

  // Автоматическое определение типа файла по колонкам
  const detectFileType = (columns: string[]): FileType => {
    const normalized = columns.map(c => c.toLowerCase().trim()).join(" ");
    
    // Проверяем признаки разных типов файлов
    const hasReturnFields = normalized.includes("номер") && 
                           (normalized.includes("клиент") || normalized.includes("операция") || normalized.includes("возврат"));
    const hasSalesFields = normalized.includes("менеджер") && 
                          (normalized.includes("выручка") || normalized.includes("маржа"));
    const hasStockTurnoverFields = normalized.includes("приход") || 
                                   normalized.includes("расход") || 
                                   normalized.includes("начальный остаток");
    const hasCategoryFields = normalized.includes("описание") && 
                             (normalized.includes("название") || normalized.includes("наименование"));
    const hasProductFields = (normalized.includes("артикул") || normalized.includes("наименование")) && 
                            (normalized.includes("остаток") || normalized.includes("цена"));
    
    if (hasReturnFields) return "returns";
    if (hasSalesFields) return "sales";
    if (hasStockTurnoverFields) return "stock-turnover";
    if (hasCategoryFields) return "categories";
    if (hasProductFields) return "products";
    
    // По умолчанию возвращаем текущий тип
    return fileType;
  };

  // Автоматический маппинг на основе названий колонок
  const attemptAutoMapping = (columns: string[], type: FileType) => {
    const mapping: ColumnMapping = {};
    const fields = FILE_TYPE_FIELDS[type];
    
    // Создаем мапу для быстрого поиска
    const columnMap = new Map<string, string>();
    columns.forEach(col => {
      const normalized = col.toLowerCase().trim();
      columnMap.set(normalized, col);
    });
    
    // Маппинг для каждого поля
    fields.forEach((field) => {
      const fieldLabel = field.label.toLowerCase();
      const fieldKey = field.key;
      
      // Список возможных вариантов названий для каждого поля
      const possibleNames: string[] = [];
      
      switch (fieldKey) {
        // Номенклатура
        case "name":
          possibleNames.push("наименование", "название", "наименование товара", "товар");
          break;
        case "article":
          possibleNames.push("артикул", "код", "код товара", "артикул товара");
          break;
        case "stock":
          possibleNames.push("остаток", "остатки", "количество", "кол-во");
          break;
        case "sampleStock":
          possibleNames.push("остаток образца", "образец", "остатки образца");
          break;
        case "retailPrice":
          possibleNames.push("розничные цены", "розничная цена", "цена", "цена розничная");
          break;
        case "markdown":
          possibleNames.push("уценка", "скидка", "скидка %");
          break;
        case "category":
          possibleNames.push("категория", "группа", "группа товаров");
          break;
        case "brand":
          possibleNames.push("бренд", "производитель", "марка");
          break;
        case "collection":
          possibleNames.push("коллекция", "серия");
          break;
        
        // Возвраты
        case "documentNumber":
          possibleNames.push("номер", "номер документа", "документ", "№ документа");
          break;
        case "date":
          possibleNames.push("дата", "дата документа", "дата создания");
          break;
        case "amount":
          possibleNames.push("сумма", "сумма возврата", "стоимость");
          break;
        case "customer":
          possibleNames.push("клиент", "покупатель", "контрагент");
          break;
        case "operation":
          possibleNames.push("операция", "тип операции", "вид операции");
          break;
        
        // Продажи
        case "manager":
          possibleNames.push("менеджер", "продавец", "ответственный");
          break;
        case "revenue":
          possibleNames.push("выручка", "сумма", "сумма продажи");
          break;
        case "cost":
          possibleNames.push("себестоимость", "себестоимость продажи", "стоимость");
          break;
        case "margin":
          possibleNames.push("маржа", "прибыль", "валовая прибыль");
          break;
        case "marginPercent":
          possibleNames.push("маржа %", "маржа проц", "процент маржи");
          break;
        
        // Оборачиваемость
        case "uom":
          possibleNames.push("ед. изм", "единица измерения", "единица");
          break;
        case "openingQty":
          possibleNames.push("начальный остаток", "остаток на начало", "начало");
          break;
        case "incomingQty":
          possibleNames.push("приход", "поступление", "приход товара");
          break;
        case "outgoingQty":
          possibleNames.push("расход", "продажа", "расход товара");
          break;
        case "closingQty":
          possibleNames.push("конечный остаток", "остаток на конец", "конец");
          break;
        
        // Категории
        case "description":
          possibleNames.push("описание", "комментарий", "примечание");
          break;
      }
      
      // Ищем совпадение
      for (const possibleName of possibleNames) {
        // Точное совпадение
        if (columnMap.has(possibleName)) {
          mapping[fieldKey] = columnMap.get(possibleName)!;
          break;
        }
        
        // Частичное совпадение
        for (const [normalizedCol, originalCol] of columnMap.entries()) {
          if (normalizedCol.includes(possibleName) || possibleName.includes(normalizedCol)) {
            mapping[fieldKey] = originalCol;
            break;
          }
        }
        
        if (mapping[fieldKey]) break;
      }
    });
    
    // Для номенклатуры: если article есть, но code нет - маппим article на code
    if (type === "products" && mapping.article && !mapping.code) {
      mapping.code = mapping.article;
    }
    
    setColumnMapping(mapping);
  };

  // Обновляем маппинг при смене типа файла (только если есть загруженные колонки)
  useEffect(() => {
    if (availableColumns.length > 0 && selectedFile) {
      // Пересоздаем маппинг при смене типа файла
      attemptAutoMapping(availableColumns, fileType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileType]);

  const loadUploadHistory = async () => {
    try {
      const history = await dataService.getOneCUploadHistory();
      setUploadHistory(history);
    } catch (error) {
      console.error("Error loading upload history:", error);
      setUploadHistory([]);
    }
  };

  const [mappings, setMappings] = useState<any[]>([]);
  const [mappingsLoading, setMappingsLoading] = useState(false);

  const loadMappings = async () => {
    try {
      setMappingsLoading(true);
      const response = await fetch("/api/mapping/products?limit=100");
      const result = await response.json();
      if (result.success && result.mappings) {
        setMappings(result.mappings);
      }
    } catch (error) {
      console.error("Error loading mappings:", error);
    } finally {
      setMappingsLoading(false);
    }
  };

  const handleAutoMap = async () => {
    try {
      setMappingsLoading(true);
      const response = await fetch("/api/mapping/auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confidence_threshold: 0.8, method: "both" }),
      });
      const result = await response.json();
      if (result.success) {
        alert(`Автоматически связано ${result.mapped} товаров`);
        await loadMappings();
      }
    } catch (error) {
      alert(`Ошибка при автоматической связи: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setMappingsLoading(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    try {
      // Полностью очищаем все состояние перед загрузкой нового файла
      setSelectedFile(file);
      setParsedProducts([]);
      setParseErrors([]);
      setParseStats(null);
      setAvailableColumns([]);
      setColumnMapping({}); // Очищаем маппинг
      setSheetNames([]);
      setSheetName("");

      // Get sheet names
      const names = await ExcelParser.getSheetNames(file);
      setSheetNames(names);
      setSheetName(names[0] || "");

      // Extract and store available columns
      const columns = await ExcelParser.getColumns(file, names[0] || undefined);
      if (columns && columns.length > 0) {
        setAvailableColumns(columns);
        console.log("Available columns in file:", columns);
        
        // Автоматически определяем тип файла по колонкам
        const detectedType = detectFileType(columns);
        if (detectedType !== fileType) {
          console.log(`Auto-detected file type: ${detectedType} (was ${fileType})`);
          setFileType(detectedType);
        }
        
        // Попытка автоматического маппинга на основе обнаруженных колонок
        attemptAutoMapping(columns, detectedType);
      } else {
        // Если колонки не найдены, очищаем маппинг
        setColumnMapping({});
      }
    } catch (error) {
      alert(
        `Ошибка при чтении файла: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      setSelectedFile(null);
      setAvailableColumns([]);
      setColumnMapping({});
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) {
      alert("Пожалуйста, выберите файл");
      return;
    }

    try {
      setLoading(true);

      const result = await ExcelParser.parseFile(selectedFile, {
        sheetName: sheetName || undefined,
        headerRow: parseInt(headerRow, 10),
        encoding,
        separator,
        mapping: columnMapping as any,
        fileType: fileType, // Передаем тип файла в парсер
      });

      setParsedProducts(result.data);
      setParseErrors(result.errors);
      setParseStats(result.stats);
    } catch (error) {
      alert(`Ошибка при парсинге: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      alert("Пожалуйста, выберите файл");
      return;
    }

    try {
      setLoading(true);

      // Отправляем файл на backend с типом файла
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("fileType", fileType); // Передаем тип файла

      const response = await fetch("/api/1c/upload-products", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Ошибка при загрузке файла");
      }

      // Обновляем историю загрузок
      const newUpload: UploadResult = {
        id: Date.now(),
        filename: selectedFile.name,
        uploaded_at: new Date().toISOString(),
        user: "admin",
        status: result.errors === 0 ? "success" : result.errors < result.details.total_rows ? "partial" : "error",
        total_rows: result.details.total_rows,
        imported: result.imported,
        updated: result.updated,
        errors: result.errors,
        errors_log: result.errors_log,
      };

      setUploadHistory([newUpload, ...uploadHistory]);
      
      // Показываем результат
      if (result.errors === 0) {
        alert(`✅ Успешно импортировано ${result.imported} товаров`);
      } else {
        alert(`⚠️ Импортировано ${result.imported} товаров, ошибок: ${result.errors}`);
      }

      // Очищаем форму полностью
      setSelectedFile(null);
      setParsedProducts([]);
      setParseErrors([]);
      setParseStats(null);
      setAvailableColumns([]);
      setColumnMapping({});
      setSheetNames([]);
      setSheetName("");
      
      // Обновляем историю загрузок с сервера
      await loadUploadHistory();
    } catch (error) {
      alert(`Ошибка при импорте: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Интеграция с 1C</h1>
        <p className="text-muted-foreground mt-1">
          Загрузка номенклатуры из 1C и управление связью товаров
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Загрузка файла</TabsTrigger>
          <TabsTrigger value="mappings">Связи товаров</TabsTrigger>
          <TabsTrigger value="history">История</TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Загрузка файла номенклатуры</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload Area */}
              <div>
                <label className="block text-sm font-semibold mb-3">
                  Выберите файл (CSV или XLSX)
                </label>
                <div
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => document.getElementById("file-input")?.click()}
                >
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">
                    Перетащите файл сюда или нажмите для выбора
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Поддерживаются CSV, XLSX, XLS
                  </p>
                  <input
                    id="file-input"
                    type="file"
                    className="hidden"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />
                </div>
                {selectedFile && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-800">{selectedFile.name}</span>
                  </div>
                )}
              </div>

              {/* File Type Selection */}
              <div>
                <label className="block text-sm font-semibold mb-2">Тип файла</label>
                <Select value={fileType} onValueChange={(value) => setFileType(value as FileType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="products">Номенклатура (products.xlsx)</SelectItem>
                    <SelectItem value="returns">Возвраты (returns.xlsx)</SelectItem>
                    <SelectItem value="sales">Продажи и маржа (sales_margin.xlsx)</SelectItem>
                    <SelectItem value="stock-turnover">Оборачиваемость склада (stock_turnover.xlsx)</SelectItem>
                    <SelectItem value="categories">Категории (categories.xlsx)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Выберите тип загружаемого файла для правильного маппинга колонок
                </p>
              </div>

              {/* Import Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Кодировка</label>
                  <select
                    value={encoding}
                    onChange={(e) => setEncoding(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                  >
                    <option value="utf-8">UTF-8</option>
                    <option value="windows-1251">Windows-1251</option>
                    <option value="cp1251">CP1251</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Разделитель CSV (есл�� CSV)
                  </label>
                  <select
                    value={separator}
                    onChange={(e) => setSeparator(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                  >
                    <option value=";">Точка с запятой (;)</option>
                    <option value=",">.Запятая (,)</option>
                    <option value="\t">Tab</option>
                    <option value="|">Pipe (|)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Лист Excel</label>
                  <select
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                    disabled={sheetNames.length === 0}
                  >
                    {sheetNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Строка с заголовками
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={headerRow}
                    onChange={(e) => setHeaderRow(e.target.value)}
                  />
                </div>
              </div>

              {/* Available Columns Info */}
              {availableColumns.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">
                    Обнаруженные колонки в файле:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {availableColumns.map((col) => (
                      <Badge key={col} variant="secondary">
                        {col}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Column Mapping */}
              <div>
                <label className="block text-sm font-semibold mb-3">Маппинг колонок</label>
                <p className="text-xs text-muted-foreground mb-3">
                  Укажите названия колонок из файла для каждого поля (напишите точное название или выберите из списка)
                </p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {FILE_TYPE_FIELDS[fileType].map((field) => {
                      const value = columnMapping[field.key] || "";
                      return (
                        <div key={field.key}>
                          <label className="text-xs text-muted-foreground block mb-1">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <div className="flex gap-2">
                            <Input
                              value={value}
                              onChange={(e) =>
                                setColumnMapping({
                                  ...columnMapping,
                                  [field.key]: e.target.value,
                                })
                              }
                              placeholder={`Название колонки`}
                              list={`columns-${field.key}`}
                              className={field.required && !value ? "border-red-300" : ""}
                            />
                            <datalist id={`columns-${field.key}`}>
                              {availableColumns.map((col) => (
                                <option key={col} value={col} />
                              ))}
                            </datalist>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {FILE_TYPE_FIELDS[fileType].some((f) => f.required && !columnMapping[f.key]) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <p className="text-xs text-yellow-800">
                        ⚠️ Заполните все обязательные поля (отмечены *)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Parse Results */}
              {parseStats && (
                <div className="border-t pt-4">
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-xs text-muted-foreground">Всего строк</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {parseStats.total_rows}
                      </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <p className="text-xs text-muted-foreground">Обработано</p>
                      <p className="text-2xl font-bold text-green-600">
                        {parseStats.processed}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <p className="text-xs text-muted-foreground">Товаров</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {parseStats.created}
                      </p>
                    </div>
                    <div className="bg-red-50 p-3 rounded">
                      <p className="text-xs text-muted-foreground">Ошибок</p>
                      <p className="text-2xl font-bold text-red-600">{parseStats.errors}</p>
                    </div>
                  </div>

                  {parseErrors.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold mb-2">Ошибки парсинга:</h4>
                      <div className="bg-red-50 border border-red-200 rounded p-3 max-h-48 overflow-y-auto">
                        <ul className="space-y-1 text-xs">
                          {parseErrors.map((err, idx) => (
                            <li key={idx} className="text-red-700">
                              Строка {err.row}, поле {err.field}: {err.error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {parsedProducts.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">
                        Предпросмотр товаров ({parsedProducts.length}):
                      </h4>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Код</TableHead>
                              <TableHead>Название</TableHead>
                              <TableHead>Категория</TableHead>
                              <TableHead>Цена</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {parsedProducts.slice(0, 10).map((product, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-mono text-sm">
                                  {product.code}
                                </TableCell>
                                <TableCell className="text-sm">{product.name}</TableCell>
                                <TableCell className="text-sm">
                                  {product.category || "-"}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {product.base_price
                                    ? `₽${product.base_price.toLocaleString()}`
                                    : "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {parsedProducts.length > 10 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            И еще {parsedProducts.length - 10} товаров...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-end border-t pt-6">
                <Button
                  variant="outline"
                  onClick={handlePreview}
                  disabled={!selectedFile || loading}
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Парсинг...
                    </>
                  ) : (
                    "Предпросмотр"
                  )}
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={parsedProducts.length === 0 || loading}
                >
                  Импортировать
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mappings Tab */}
        <TabsContent value="mappings" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Связи товаров (1C ↔ Yandex)</CardTitle>
                <Button size="sm" onClick={handleAutoMap} disabled={mappingsLoading}>
                  {mappingsLoading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Обработка...
                    </>
                  ) : (
                    "Автоматическая связь"
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {mappingsLoading && mappings.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Код 1C</TableHead>
                        <TableHead>Название 1C</TableHead>
                        <TableHead className="text-center">Статус</TableHead>
                        <TableHead>Товар Yandex</TableHead>
                        <TableHead className="text-center">Совпадение</TableHead>
                        <TableHead className="text-right">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mappings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Нет данных о связях. Нажмите "Автоматическая связь" для создания маппингов.
                          </TableCell>
                        </TableRow>
                      ) : (
                        mappings.map((mapping) => (
                      <TableRow key={mapping.id}>
                          <TableCell className="font-mono text-sm">
                            {mapping.c1_code || mapping.c1_article || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm max-w-xs">{mapping.c1_name || "-"}</div>
                          </TableCell>
                          <TableCell className="text-center">
                            {mapping.yandex_offer_id ? (
                              <Link2 className="w-4 h-4 text-green-600 mx-auto" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-yellow-600 mx-auto" />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm max-w-xs">
                              {mapping.yandex_name || mapping.yandex_offer_id || "Не связан"}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {mapping.confidence ? (
                              <Badge variant="secondary">
                                {(mapping.confidence * 100).toFixed(0)}%
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              Редактировать
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

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>История загрузок</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Файл</TableHead>
                      <TableHead>Дата</TableHead>
                      <TableHead>Пользователь</TableHead>
                      <TableHead className="text-center">Ст��тус</TableHead>
                      <TableHead className="text-center">Результаты</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploadHistory.map((upload) => (
                      <TableRow key={upload.id}>
                        <TableCell className="font-mono text-sm">
                          {upload.filename}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(upload.uploaded_at).toLocaleString()}
                        </TableCell>
                        <TableCell>{upload.user}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              upload.status === "success" ? "default" : "destructive"
                            }
                          >
                            {upload.status === "success"
                              ? "Успех"
                              : upload.status === "error"
                                ? "Ошибка"
                                : "Частич"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div>
                              <span className="text-green-600 font-semibold">
                                {upload.imported}
                              </span>{" "}
                              создано
                            </div>
                            <div>
                              <span className="text-blue-600 font-semibold">
                                {upload.updated}
                              </span>{" "}
                              обновлено
                            </div>
                            {upload.errors > 0 && (
                              <div>
                                <span className="text-red-600 font-semibold">
                                  {upload.errors}
                                </span>{" "}
                                ошибок
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
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
      </Tabs>
    </div>
  );
}
