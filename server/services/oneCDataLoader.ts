/**
 * Модуль для загрузки и нормализации данных из Excel файлов 1C
 * 
 * Читает Excel файлы из data/1c/ и возвращает нормализованные массивы
 * типов из shared/types/oneC.ts
 */

import XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import {
  OneCProductRow,
  OneCStockTurnoverRow,
  OneCSalesMarginRow,
  OneCReturnRow,
  OneCCategoryRow,
} from "../../shared/types/oneC";
import {
  DimProduct,
  DimCategory,
  Fact1cSale,
  Fact1cMargin,
  FactStockSnapshot,
} from "../../shared/types/dataModel";

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
    
    // name: ищем "наименование", "название"
    if ((normalized.includes("наименование") || normalized.includes("название")) && !mapping.name) {
      mapping.name = index;
    }
    // article: ищем "артикул", "код" (но не "номер документа")
    if ((normalized.includes("артикул") || (normalized.includes("код") && !normalized.includes("номер"))) && !mapping.article) {
      mapping.article = index;
    }
    // stock: ищем "остаток" (но не "остаток образца")
    if (normalized.includes("остаток") && !normalized.includes("образца") && !mapping.stock) {
      mapping.stock = index;
    }
    // sampleStock: ищем "остаток образца"
    if ((normalized.includes("остаток образца") || (normalized.includes("остаток") && normalized.includes("образца"))) && !mapping.sampleStock) {
      mapping.sampleStock = index;
    }
    // retailPrice: ищем "розничные цены", "розничная цена", "цена"
    if ((normalized.includes("розничн") || normalized.includes("розничные цены") || (normalized.includes("цена") && !normalized.includes("себестоимость"))) && !mapping.retailPrice) {
      mapping.retailPrice = index;
    }
    // markdown: ищем "уценка"
    if (normalized.includes("уценка") && !mapping.markdown) {
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
    
    // manager: ищем "менеджер", "продавец", "ответственный"
    if ((normalized.includes("менеджер") || normalized.includes("продавец") || normalized.includes("ответственный")) && !mapping.manager) {
      mapping.manager = index;
    }
    // documentNumber: ищем "номер документа" или просто "номер" (если нет других полей с "номер")
    if (normalized.includes("номер")) {
      if (normalized.includes("документ") || !mapping.documentNumber) {
      mapping.documentNumber = index;
      }
    }
    // date: ищем "дата"
    if (normalized.includes("дата") && !mapping.date) {
      mapping.date = index;
    }
    // revenue: ищем "выручка", "сумма продажи"
    if ((normalized.includes("выручка") || (normalized.includes("сумма") && normalized.includes("продаж"))) && !mapping.revenue) {
      mapping.revenue = index;
    }
    // cost: ищем "себестоимость"
    if (normalized.includes("себестоимость") && !mapping.cost) {
      mapping.cost = index;
    }
    // margin: ищем "маржа" (но не "%")
    if (normalized.includes("маржа") && !normalized.includes("%") && !normalized.includes("процент") && !mapping.margin) {
      mapping.margin = index;
    }
    // marginPercent: ищем "маржа %" или "маржа процент"
    if ((normalized.includes("маржа") && (normalized.includes("%") || normalized.includes("процент"))) && !mapping.marginPercent) {
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
    
    // documentNumber: ищем "номер документа" или просто "номер" (если нет других полей с "номер")
    if (normalized.includes("номер")) {
      if (normalized.includes("документ") || !mapping.documentNumber) {
      mapping.documentNumber = index;
      }
    }
    // date: ищем "дата"
    if (normalized.includes("дата") && !mapping.date) {
      mapping.date = index;
    }
    // amount: ищем "сумма"
    if (normalized.includes("сумма") && !mapping.amount) {
      mapping.amount = index;
    }
    // customer: ищем "клиент", "покупатель", "контрагент"
    if ((normalized.includes("клиент") || normalized.includes("покупатель") || normalized.includes("контрагент")) && !mapping.customer) {
      mapping.customer = index;
    }
    // operation: ищем "операция"
    if (normalized.includes("операция") && !mapping.operation) {
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
  
  // Логируем для отладки
  console.log("Returns headers:", headers);
  console.log("Returns mapping:", mapping);
  
  if (mapping.documentNumber === undefined) {
    throw new Error(`Required columns not found in returns.xlsx (documentNumber). Available headers: ${headers.join(", ")}`);
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

// ============================================
// НОРМАЛИЗАЦИЯ В STAR-SCHEMA
// ============================================

/**
 * Генерация стабильного ID для товара на основе артикула и наименования
 */
function generateProductId(article: string, name: string, oneCCode?: string): string {
  // Приоритет: oneCCode > article > hash(name)
  if (oneCCode && oneCCode.trim()) {
    return `1c_${oneCCode.trim()}`;
  }
  if (article && article.trim()) {
    return `1c_${article.trim()}`;
  }
  // Fallback: хэш от имени
  const hash = name.split("").reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0) | 0;
  }, 0);
  return `1c_hash_${Math.abs(hash)}`;
}

/**
 * Генерация стабильного ID для категории на основе названия
 */
function generateCategoryId(name: string): string {
  // Создаем slug из названия
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-zа-я0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `cat_${slug}`;
}

/**
 * Преобразование OneCProductRow в DimProduct
 */
export async function normalizeOneCProductsToDimProducts(
  forceReload: boolean = false
): Promise<DimProduct[]> {
  const products = await loadOneCProducts(forceReload);
  const categories = await loadOneCCategories(forceReload);
  
  // Создаем мапу категорий по названию
  const categoryMap = new Map<string, string>();
  categories.forEach(cat => {
    const catId = generateCategoryId(cat.name);
    categoryMap.set(cat.name.toLowerCase().trim(), catId);
  });

  return products.map(product => {
    const productId = generateProductId(product.article, product.name);
    
    // Пытаемся найти категорию (пока упрощенно, можно улучшить маппинг)
    let categoryId: string | undefined;
    // TODO: улучшить маппинг категорий, если в products.xlsx есть поле категории
    
    return {
      id: productId,
      name: product.name,
      article: product.article || undefined,
      oneCCode: product.article || undefined, // Используем артикул как код 1С
      categoryId,
    };
  });
}

/**
 * Преобразование OneCSalesMarginRow в Fact1cSale и Fact1cMargin
 */
export async function normalizeOneCSalesToFacts(
  forceReload: boolean = false
): Promise<{ sales: Fact1cSale[]; margins: Fact1cMargin[] }> {
  const salesMargin = await loadOneCSalesMargin(forceReload);
  const products = await loadOneCProducts(forceReload);
  
  // Создаем мапу товаров по артикулу для поиска productId
  const productMap = new Map<string, string>();
  products.forEach(product => {
    if (product.article) {
      const productId = generateProductId(product.article, product.name);
      productMap.set(product.article.toLowerCase().trim(), productId);
    }
  });

  const sales: Fact1cSale[] = [];
  const margins: Fact1cMargin[] = [];

  salesMargin.forEach(row => {
    const saleId = `1c_sale_${row.documentNumber}_${row.date}`;
    
    // Пытаемся найти productId (пока undefined, так как в sales_margin нет артикула)
    // TODO: если в sales_margin.xlsx появится артикул/код товара, добавить маппинг
    
    const sale: Fact1cSale = {
      saleId,
      externalOrderId: row.documentNumber,
      date: row.date,
      productId: undefined, // Будет заполнено при наличии артикула в данных
      warehouseId: undefined,
      quantity: 1, // По умолчанию, если нет детализации
      price: row.revenue,
      revenue: row.revenue,
    };

    const margin: Fact1cMargin = {
      saleId,
      productId: undefined, // Будет заполнено при наличии артикула в данных
      cost: row.cost,
      margin: row.margin,
    };

    sales.push(sale);
    margins.push(margin);
  });

  return { sales, margins };
}

/**
 * Преобразование OneCProductRow и OneCStockTurnoverRow в FactStockSnapshot
 */
export async function normalizeOneCStockToFactSnapshots(
  forceReload: boolean = false
): Promise<FactStockSnapshot[]> {
  const products = await loadOneCProducts(forceReload);
  const stockTurnover = await loadOneCStockTurnover(forceReload);
  const today = new Date().toISOString().split("T")[0];

  const snapshots: FactStockSnapshot[] = [];

  // Используем products.xlsx как основной источник остатков
  products.forEach(product => {
    const productId = generateProductId(product.article, product.name);
    
    snapshots.push({
      snapshotDate: today,
      productId,
      warehouseId: undefined, // Пока не различаем склады
      stockQty: product.stock,
      stockValue: product.retailPrice > 0 ? product.stock * product.retailPrice : undefined,
    });
  });

  // Дополняем данными из stock_turnover.xlsx (используем closingQty)
  const turnoverMap = new Map<string, number>();
  stockTurnover.forEach(item => {
    if (item.article) {
      turnoverMap.set(item.article.toLowerCase().trim(), item.closingQty);
    }
  });

  // Обновляем snapshots данными из turnover, если есть
  snapshots.forEach(snapshot => {
    const product = products.find(p => {
      const pid = generateProductId(p.article, p.name);
      return pid === snapshot.productId;
    });
    if (product && product.article) {
      const turnoverQty = turnoverMap.get(product.article.toLowerCase().trim());
      if (turnoverQty !== undefined) {
        snapshot.stockQty = turnoverQty;
        if (product.retailPrice > 0) {
          snapshot.stockValue = turnoverQty * product.retailPrice;
        }
      }
    }
  });

  return snapshots;
}

/**
 * Преобразование OneCCategoryRow в DimCategory
 */
export async function normalizeOneCCategoriesToDimCategories(
  forceReload: boolean = false
): Promise<DimCategory[]> {
  const categories = await loadOneCCategories(forceReload);

  return categories.map(cat => ({
    id: generateCategoryId(cat.name),
    name: cat.name,
    parentId: undefined, // Пока нет иерархии
  }));
}

