/**
 * Модуль для загрузки и нормализации данных из Excel файлов 1C
 * 
 * Читает Excel файлы из data/1c/ и возвращает нормализованные массивы
 * типов из shared/types/oneC.ts
 */

import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import {
  OneCProductRow,
  OneCStockTurnoverRow,
  OneCSalesMarginRow,
  OneCReturnRow,
  OneCCategoryRow,
} from "../../shared/types/oneC";

// Пути к файлам (относительно корня проекта)
const DATA_DIR = path.resolve(process.cwd(), "data", "1c");
const FILE_PATHS = {
  products: path.join(DATA_DIR, "products.xlsx"),
  stockTurnover: path.join(DATA_DIR, "stock_turnover.xlsx"),
  salesMargin: path.join(DATA_DIR, "sales_margin.xlsx"),
  returns: path.join(DATA_DIR, "returns.xlsx"),
  categories: path.join(DATA_DIR, "categories.xlsx"),
};

// Кэш в памяти
const cache: {
  products?: OneCProductRow[];
  stockTurnover?: OneCStockTurnoverRow[];
  salesMargin?: OneCSalesMarginRow[];
  returns?: OneCReturnRow[];
  categories?: OneCCategoryRow[];
} = {};

/**
 * Вспомогательная функция для нормализации строки
 * Убирает пробелы, заменяет запятую на точку для чисел
 */
function normalizeString(value: any): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

/**
 * Вспомогательная функция для нормализации числа
 * Убирает пробелы, заменяет запятую на точку
 */
function normalizeNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  const str = String(value).trim().replace(/\s+/g, "").replace(",", ".");
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Проверка, является ли строка пустой или итоговой
 */
function isEmptyOrTotal(row: any[]): boolean {
  if (!row || row.length === 0) return true;
  
  // Проверяем, все ли значения пустые
  const allEmpty = row.every(cell => {
    const val = String(cell || "").trim().toLowerCase();
    return val === "" || val === "null" || val === "undefined";
  });
  
  if (allEmpty) return true;
  
  // Проверяем, является ли строка итоговой
  const firstCell = String(row[0] || "").trim().toLowerCase();
  return firstCell === "итого" || firstCell === "итого:" || firstCell.startsWith("итого");
}

/**
 * Чтение первого листа Excel файла
 */
function readFirstSheet(filePath: string): any[][] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const workbook = XLSX.readFile(filePath);
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Конвертируем в массив массивов
  const data = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as any[][];

  return data;
}

/**
 * Маппинг заголовков для products.xlsx
 */
function mapProductsHeaders(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {};
  
  headers.forEach((header, index) => {
    const normalized = header.trim().toLowerCase();
    
    if (normalized.includes("наименование")) {
      mapping.name = index;
    } else if (normalized.includes("артикул")) {
      mapping.article = index;
    } else if (normalized.includes("остаток") && !normalized.includes("образца")) {
      mapping.stock = index;
    } else if (normalized.includes("остаток образца") || (normalized.includes("остаток") && normalized.includes("образца"))) {
      mapping.sampleStock = index;
    } else if (normalized.includes("розничн") || normalized.includes("розничные цены")) {
      mapping.retailPrice = index;
    } else if (normalized.includes("уценка")) {
      mapping.markdown = index;
    }
  });
  
  return mapping;
}

/**
 * Маппинг заголовков для stock_turnover.xlsx
 */
function mapStockTurnoverHeaders(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {};
  
  headers.forEach((header, index) => {
    const normalized = header.trim().toLowerCase();
    
    if (normalized.includes("артикул")) {
      mapping.article = index;
    } else if (normalized.includes("наименование")) {
      mapping.name = index;
    } else if (normalized.includes("ед. изм") || normalized.includes("единица измерения")) {
      mapping.uom = index;
    } else if (normalized.includes("начальн") && normalized.includes("остаток")) {
      mapping.openingQty = index;
    } else if (normalized.includes("приход")) {
      mapping.incomingQty = index;
    } else if (normalized.includes("расход")) {
      mapping.outgoingQty = index;
    } else if (normalized.includes("конечн") && normalized.includes("остаток")) {
      mapping.closingQty = index;
    }
  });
  
  return mapping;
}

/**
 * Маппинг заголовков для sales_margin.xlsx
 */
function mapSalesMarginHeaders(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {};
  
  headers.forEach((header, index) => {
    const normalized = header.trim().toLowerCase();
    
    if (normalized.includes("менеджер")) {
      mapping.manager = index;
    } else if (normalized.includes("номер") && normalized.includes("документ")) {
      mapping.documentNumber = index;
    } else if (normalized.includes("дата")) {
      mapping.date = index;
    } else if (normalized.includes("выручка")) {
      mapping.revenue = index;
    } else if (normalized.includes("себестоимость")) {
      mapping.cost = index;
    } else if (normalized.includes("маржа") && !normalized.includes("%") && !normalized.includes("процент")) {
      mapping.margin = index;
    } else if ((normalized.includes("маржа") && normalized.includes("%")) || (normalized.includes("маржа") && normalized.includes("процент"))) {
      mapping.marginPercent = index;
    }
  });
  
  return mapping;
}

/**
 * Маппинг заголовков для returns.xlsx
 */
function mapReturnsHeaders(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {};
  
  headers.forEach((header, index) => {
    const normalized = header.trim().toLowerCase();
    
    if (normalized.includes("номер") && normalized.includes("документ")) {
      mapping.documentNumber = index;
    } else if (normalized.includes("дата")) {
      mapping.date = index;
    } else if (normalized.includes("сумма")) {
      mapping.amount = index;
    } else if (normalized.includes("клиент")) {
      mapping.customer = index;
    } else if (normalized.includes("операция")) {
      mapping.operation = index;
    }
  });
  
  return mapping;
}

/**
 * Маппинг заголовков для categories.xlsx
 */
function mapCategoriesHeaders(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {};
  
  headers.forEach((header, index) => {
    const normalized = header.trim().toLowerCase();
    
    if (normalized.includes("название") || normalized.includes("наименование")) {
      mapping.name = index;
    } else if (normalized.includes("описание")) {
      mapping.description = index;
    }
  });
  
  return mapping;
}

/**
 * Загрузка продуктов из products.xlsx
 */
export async function loadOneCProducts(forceReload: boolean = false): Promise<OneCProductRow[]> {
  if (!forceReload && cache.products) {
    return cache.products;
  }

  const data = readFirstSheet(FILE_PATHS.products);
  
  if (data.length < 2) {
    cache.products = [];
    return [];
  }

  const headers = data[0].map((h: any) => String(h || ""));
  const mapping = mapProductsHeaders(headers);
  
  // Проверяем наличие обязательных полей
  if (mapping.name === undefined || mapping.article === undefined) {
    throw new Error("Required columns not found in products.xlsx (name, article)");
  }

  const products: OneCProductRow[] = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    if (isEmptyOrTotal(row)) continue;

    const product: OneCProductRow = {
      name: normalizeString(row[mapping.name]),
      article: normalizeString(row[mapping.article]),
      stock: normalizeNumber(row[mapping.stock]),
      sampleStock: normalizeNumber(row[mapping.sampleStock]),
      retailPrice: normalizeNumber(row[mapping.retailPrice]),
      markdown: normalizeNumber(row[mapping.markdown]),
    };

    // Пропускаем строки без обязательных полей
    if (!product.name || !product.article) continue;

    products.push(product);
  }

  cache.products = products;
  return products;
}

/**
 * Загрузка оборота склада из stock_turnover.xlsx
 */
export async function loadOneCStockTurnover(forceReload: boolean = false): Promise<OneCStockTurnoverRow[]> {
  if (!forceReload && cache.stockTurnover) {
    return cache.stockTurnover;
  }

  const data = readFirstSheet(FILE_PATHS.stockTurnover);
  
  if (data.length < 2) {
    cache.stockTurnover = [];
    return [];
  }

  const headers = data[0].map((h: any) => String(h || ""));
  const mapping = mapStockTurnoverHeaders(headers);
  
  if (mapping.article === undefined || mapping.name === undefined) {
    throw new Error("Required columns not found in stock_turnover.xlsx (article, name)");
  }

  const stockTurnover: OneCStockTurnoverRow[] = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    if (isEmptyOrTotal(row)) continue;

    const item: OneCStockTurnoverRow = {
      article: normalizeString(row[mapping.article]),
      name: normalizeString(row[mapping.name]),
      uom: normalizeString(row[mapping.uom]),
      openingQty: normalizeNumber(row[mapping.openingQty]),
      incomingQty: normalizeNumber(row[mapping.incomingQty]),
      outgoingQty: normalizeNumber(row[mapping.outgoingQty]),
      closingQty: normalizeNumber(row[mapping.closingQty]),
    };

    if (!item.article || !item.name) continue;

    stockTurnover.push(item);
  }

  cache.stockTurnover = stockTurnover;
  return stockTurnover;
}

/**
 * Загрузка продаж и маржи из sales_margin.xlsx
 */
export async function loadOneCSalesMargin(forceReload: boolean = false): Promise<OneCSalesMarginRow[]> {
  if (!forceReload && cache.salesMargin) {
    return cache.salesMargin;
  }

  const data = readFirstSheet(FILE_PATHS.salesMargin);
  
  if (data.length < 2) {
    cache.salesMargin = [];
    return [];
  }

  const headers = data[0].map((h: any) => String(h || ""));
  const mapping = mapSalesMarginHeaders(headers);
  
  if (mapping.manager === undefined || mapping.documentNumber === undefined) {
    throw new Error("Required columns not found in sales_margin.xlsx (manager, documentNumber)");
  }

  const salesMargin: OneCSalesMarginRow[] = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    if (isEmptyOrTotal(row)) continue;

    const item: OneCSalesMarginRow = {
      manager: normalizeString(row[mapping.manager]),
      documentNumber: normalizeString(row[mapping.documentNumber]),
      date: normalizeString(row[mapping.date]),
      revenue: normalizeNumber(row[mapping.revenue]),
      cost: normalizeNumber(row[mapping.cost]),
      margin: normalizeNumber(row[mapping.margin]),
      marginPercent: normalizeNumber(row[mapping.marginPercent]),
    };

    if (!item.manager || !item.documentNumber) continue;

    salesMargin.push(item);
  }

  cache.salesMargin = salesMargin;
  return salesMargin;
}

/**
 * Загрузка возвратов из returns.xlsx
 */
export async function loadOneCReturns(forceReload: boolean = false): Promise<OneCReturnRow[]> {
  if (!forceReload && cache.returns) {
    return cache.returns;
  }

  const data = readFirstSheet(FILE_PATHS.returns);
  
  if (data.length < 2) {
    cache.returns = [];
    return [];
  }

  const headers = data[0].map((h: any) => String(h || ""));
  const mapping = mapReturnsHeaders(headers);
  
  if (mapping.documentNumber === undefined) {
    throw new Error("Required columns not found in returns.xlsx (documentNumber)");
  }

  const returns: OneCReturnRow[] = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    if (isEmptyOrTotal(row)) continue;

    const item: OneCReturnRow = {
      documentNumber: normalizeString(row[mapping.documentNumber]),
      date: normalizeString(row[mapping.date]),
      amount: normalizeNumber(row[mapping.amount]),
      customer: normalizeString(row[mapping.customer]),
      operation: normalizeString(row[mapping.operation]),
    };

    if (!item.documentNumber) continue;

    returns.push(item);
  }

  cache.returns = returns;
  return returns;
}

/**
 * Загрузка категорий из categories.xlsx
 */
export async function loadOneCCategories(forceReload: boolean = false): Promise<OneCCategoryRow[]> {
  if (!forceReload && cache.categories) {
    return cache.categories;
  }

  const data = readFirstSheet(FILE_PATHS.categories);
  
  if (data.length < 2) {
    cache.categories = [];
    return [];
  }

  const headers = data[0].map((h: any) => String(h || ""));
  const mapping = mapCategoriesHeaders(headers);
  
  if (mapping.name === undefined) {
    throw new Error("Required columns not found in categories.xlsx (name)");
  }

  const categories: OneCCategoryRow[] = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    if (isEmptyOrTotal(row)) continue;

    const item: OneCCategoryRow = {
      name: normalizeString(row[mapping.name]),
      description: normalizeString(row[mapping.description]),
    };

    if (!item.name) continue;

    categories.push(item);
  }

  cache.categories = categories;
  return categories;
}

