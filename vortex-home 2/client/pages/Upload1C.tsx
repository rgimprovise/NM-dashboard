import { useState } from "react";
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

interface UploadResult {
  id: number;
  filename: string;
  uploaded_at: string;
  user: string;
  status: "success" | "error" | "partial";
  total_rows: number;
  imported: number;
  updated: number;
  errors: number;
  errors_log?: Array<{ row: number; field: string; error: string }>;
}

interface ColumnMapping {
  code: string;
  name: string;
  article?: string;
  category?: string;
  base_price?: string;
  cost_price?: string;
  brand?: string;
  collection?: string;
}

export default function Upload1C() {
  const [activeTab, setActiveTab] = useState("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [encoding, setEncoding] = useState("utf-8");
  const [separator, setSeparator] = useState(";");
  const [sheetName, setSheetName] = useState<string>("");
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [headerRow, setHeaderRow] = useState("1");
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    code: "Артикул ",
    name: "Наименование",
    article: "Артикул ",
    category: "",
    base_price: "Розничные цены",
    cost_price: "",
    brand: "",
    collection: "",
  });
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
  const [uploadHistory, setUploadHistory] = useState<UploadResult[]>([
    {
      id: 1,
      filename: "nomenclature_2025-11-12.xlsx",
      uploaded_at: "2025-11-12T10:30:00Z",
      user: "admin",
      status: "success",
      total_rows: 200,
      imported: 150,
      updated: 45,
      errors: 5,
    },
  ]);

  const mockMappings = [
    {
      id: 1,
      c1_code: "00001234",
      c1_name: "Кухня Модерн 3200 белый глянец",
      yandex_offer_id: "KUH-MOD-001",
      yandex_name: "Кухня 'Модерн' белый глянец 3.2м",
      confidence: 1.0,
      type: "auto",
    },
    {
      id: 2,
      c1_code: "00001235",
      c1_name: "Шкаф Классик 4-дверный дуб",
      yandex_offer_id: "SHKF-KLAS-002",
      yandex_name: "Шкаф 'Классик' 4-дверный дуб",
      confidence: 0.95,
      type: "auto",
    },
  ];

  const handleFileSelect = async (file: File) => {
    try {
      setSelectedFile(file);
      setParsedProducts([]);
      setParseErrors([]);
      setParseStats(null);
      setAvailableColumns([]);

      // Get sheet names
      const names = await ExcelParser.getSheetNames(file);
      setSheetNames(names);
      setSheetName(names[0] || "");

      // Extract and store available columns
      const columns = await ExcelParser.getColumns(file, names[0] || undefined);
      if (columns && columns.length > 0) {
        setAvailableColumns(columns);
        console.log("Available columns in file:", columns);
      }
    } catch (error) {
      alert(
        `Ошибка при чтении файла: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      setSelectedFile(null);
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
    if (parsedProducts.length === 0) {
      alert("Нет товаров для импорта");
      return;
    }

    try {
      // Here you would send data to backend API
      // For now, just add to upload history
      const newUpload: UploadResult = {
        id: uploadHistory.length + 1,
        filename: selectedFile?.name || "unknown.xlsx",
        uploaded_at: new Date().toISOString(),
        user: "admin",
        status: parseErrors.length === 0 ? "success" : "partial",
        total_rows: parseStats?.total_rows || 0,
        imported: parsedProducts.length,
        updated: 0,
        errors: parseErrors.length,
        errors_log: parseErrors,
      };

      setUploadHistory([newUpload, ...uploadHistory]);
      alert(`Импортировано ${parsedProducts.length} товаров`);
      setSelectedFile(null);
      setParsedProducts([]);
      setParseErrors([]);
    } catch (error) {
      alert(`Ошибка при импорте: ${error instanceof Error ? error.message : "Unknown error"}`);
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
                  Укажите названия колонок из файла для каждого поля (напишите точное название)
                </p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(columnMapping).map(([field, value]) => (
                      <div key={field}>
                        <label className="text-xs text-muted-foreground block mb-1 capitalize">
                          {field === "base_price"
                            ? "Базовая цена"
                            : field === "cost_price"
                              ? "Себестоимость"
                              : field}
                        </label>
                        <div className="flex gap-2">
                          <Input
                            value={value}
                            onChange={(e) =>
                              setColumnMapping({
                                ...columnMapping,
                                [field]: e.target.value,
                              })
                            }
                            placeholder={`Названиe колонки`}
                            list={`columns-${field}`}
                          />
                          <datalist id={`columns-${field}`}>
                            {availableColumns.map((col) => (
                              <option key={col} value={col} />
                            ))}
                          </datalist>
                        </div>
                      </div>
                    ))}
                  </div>
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
                <Button size="sm">Автоматическая связь</Button>
              </div>
            </CardHeader>
            <CardContent>
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
                    {mockMappings.map((mapping) => (
                      <TableRow key={mapping.id}>
                        <TableCell className="font-mono text-sm">
                          {mapping.c1_code}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm max-w-xs">{mapping.c1_name}</div>
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
                            {mapping.yandex_name || "Не связан"}
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
                    ))}
                  </TableBody>
                </Table>
              </div>
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
