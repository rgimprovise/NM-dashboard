/**
 * TypeScript интерфейсы для нормализованных данных из 1C Excel файлов
 * 
 * Источники данных:
 * - products.xlsx (Список_стандартный поиск номенклатура)
 * - stock_turnover.xlsx (склад-доп)
 * - sales_margin.xlsx (отчет продажи-маржа)
 * - returns.xlsx
 * - categories.xlsx
 */

/**
 * Строка из products.xlsx (Список_стандартный поиск номенклатура)
 */
export interface OneCProductRow {
  /** Наименование товара */
  name: string;
  
  /** Артикул товара */
  article: string;
  
  /** Остаток товара на складе */
  stock: number;
  
  /** Остаток образца */
  sampleStock: number;
  
  /** Розничная цена */
  retailPrice: number;
  
  /** Уценка */
  markdown: number;
}

/**
 * Строка из stock_turnover.xlsx (склад-доп)
 */
export interface OneCStockTurnoverRow {
  /** Артикул товара */
  article: string;
  
  /** Наименование товара */
  name: string;
  
  /** Единица измерения */
  uom: string;
  
  /** Начальный остаток */
  openingQty: number;
  
  /** Приход */
  incomingQty: number;
  
  /** Расход */
  outgoingQty: number;
  
  /** Конечный остаток */
  closingQty: number;
}

/**
 * Строка из sales_margin.xlsx (отчет продажи-маржа)
 * Уровень документа продажи
 */
export interface OneCSalesMarginRow {
  /** Менеджер */
  manager: string;
  
  /** Номер документа */
  documentNumber: string;
  
  /** Дата документа */
  date: string;
  
  /** Выручка */
  revenue: number;
  
  /** Себестоимость */
  cost: number;
  
  /** Маржа (абсолютная) */
  margin: number;
  
  /** Маржа (процентная) */
  marginPercent: number;
}

/**
 * Строка из returns.xlsx
 */
export interface OneCReturnRow {
  /** Номер документа */
  documentNumber: string;
  
  /** Дата документа */
  date: string;
  
  /** Сумма возврата */
  amount: number;
  
  /** Клиент */
  customer: string;
  
  /** Операция */
  operation: string;
}

/**
 * Строка из categories.xlsx
 */
export interface OneCCategoryRow {
  /** Название категории */
  name: string;
  
  /** Описание категории */
  description: string;
}

/**
 * Агрегированный снимок товара для фронтенда
 * Объединяет данные из OneCProductRow с привязкой к категории
 */
export interface ProductSnapshot {
  /** Наименование товара */
  name: string;
  
  /** Артикул товара */
  article: string;
  
  /** Остаток товара на складе */
  stock: number;
  
  /** Остаток образца */
  sampleStock: number;
  
  /** Розничная цена */
  retailPrice: number;
  
  /** Уценка */
  markdown: number;
  
  /** Категория товара (опционально) */
  category?: string;
}

/**
 * Агрегированные продажи и маржа по менеджеру
 */
export interface SalesSummaryByManager {
  /** Имя менеджера */
  manager: string;
  
  /** Общая выручка */
  totalRevenue: number;
  
  /** Общая себестоимость */
  totalCost: number;
  
  /** Общая маржа (абсолютная) */
  totalMargin: number;
  
  /** Средняя маржа (процентная) */
  averageMarginPercent: number;
  
  /** Количество документов продажи */
  documentCount: number;
  
  /** Период (опционально) */
  period?: {
    from: string;
    to: string;
  };
}

/**
 * Результат загрузки файла номенклатуры 1C
 */
export interface UploadResult {
  /** Уникальный идентификатор загрузки */
  id: number;
  
  /** Имя загруженного файла */
  filename: string;
  
  /** Дата и время загрузки (ISO string) */
  uploaded_at: string;
  
  /** Пользователь, выполнивший загрузку */
  user: string;
  
  /** Статус загрузки */
  status: "success" | "error" | "partial";
  
  /** Общее количество строк в файле */
  total_rows: number;
  
  /** Количество успешно импортированных строк */
  imported: number;
  
  /** Количество обновленных строк */
  updated: number;
  
  /** Количество строк с ошибками */
  errors: number;
  
  /** Лог ошибок (опционально) */
  errors_log?: Array<{
    row: number;
    field: string;
    error: string;
  }>;
}

