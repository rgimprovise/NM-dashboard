/**
 * API routes для данных 1C
 * 
 * Предоставляет доступ к нормализованным данным из Excel файлов 1C
 */

import { RequestHandler } from "express";
import * as fs from "fs";
import * as path from "path";
import multer from "multer";
import {
  loadOneCProducts,
  loadOneCStockTurnover,
  loadOneCSalesMargin,
  loadOneCReturns,
  loadOneCCategories,
} from "../services/oneCDataLoader";
import { ProductSnapshot, UploadResult } from "../../shared/types/oneC";
import { logInfo, logError, logDataParse } from "../utils/logger";

// Настройка multer для загрузки файлов
const upload = multer({
  storage: multer.memoryStorage(), // Храним в памяти, потом сохраним в файл
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (_req, file, cb) => {
    // Разрешаем только Excel и CSV файлы
    const allowedMimes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
      "text/csv",
      "application/csv",
    ];
    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel (.xlsx, .xls) and CSV files are allowed"));
    }
  },
});

/**
 * GET /api/1c/products
 * Возвращает список продуктов (ProductSnapshot[])
 */
export const getProducts: RequestHandler = async (req, res) => {
  try {
    const { forceReload } = req.query;
    const products = await loadOneCProducts(forceReload === "true");

    // Преобразуем OneCProductRow[] в ProductSnapshot[]
    // Пока категории оставляем undefined
    const snapshots: ProductSnapshot[] = products.map((product) => ({
      ...product,
      category: undefined,
    }));

    return res.json({
      success: true,
      data: snapshots,
    });
  } catch (error) {
    console.error("1C getProducts error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to load products",
    });
  }
};

/**
 * GET /api/1c/sales
 * Возвращает список продаж и маржи
 */
export const getSales: RequestHandler = async (req, res) => {
  try {
    const { forceReload } = req.query;
    const sales = await loadOneCSalesMargin(forceReload === "true");

    return res.json({
      success: true,
      data: sales,
    });
  } catch (error) {
    console.error("1C getSales error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to load sales",
    });
  }
};

/**
 * GET /api/1c/returns
 * Возвращает список возвратов
 */
export const getReturns: RequestHandler = async (req, res) => {
  try {
    const { forceReload } = req.query;
    const returns = await loadOneCReturns(forceReload === "true");

    return res.json({
      success: true,
      data: returns,
    });
  } catch (error) {
    console.error("1C getReturns error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to load returns",
    });
  }
};

/**
 * GET /api/1c/stock-turnover
 * Возвращает оборот склада
 */
export const getStockTurnover: RequestHandler = async (req, res) => {
  try {
    const { forceReload } = req.query;
    const stockTurnover = await loadOneCStockTurnover(forceReload === "true");

    return res.json({
      success: true,
      data: stockTurnover,
    });
  } catch (error) {
    console.error("1C getStockTurnover error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to load stock turnover",
    });
  }
};

/**
 * GET /api/1c/categories
 * Возвращает список категорий
 */
export const getCategories: RequestHandler = async (req, res) => {
  try {
    const { forceReload } = req.query;
    const categories = await loadOneCCategories(forceReload === "true");

    return res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("1C getCategories error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to load categories",
    });
  }
};

/**
 * POST /api/1c/upload-products
 * Загрузка файла 1C (номенклатура, возвраты, продажи, оборачиваемость, категории)
 * 
 * Принимает multipart/form-data с полями:
 * - 'file' - файл для загрузки
 * - 'fileType' - тип файла: products, returns, sales, stock-turnover, categories
 * 
 * Сохраняет файл в соответствующее место и парсит через соответствующий loader
 */
export const uploadProducts: RequestHandler = async (req, res) => {
  try {
    const file = (req as any).file;
    // Multer сохраняет текстовые поля из multipart/form-data в req.body
    // Если fileType не пришел, используем "products" по умолчанию
    const fileType = (req.body?.fileType as string) || "products";
    
    logInfo("1C upload request", {
      source: "1c-upload",
      metadata: {
        hasFile: !!file,
        fileType,
        bodyKeys: Object.keys(req.body || {}),
      },
    });
    
    if (!file) {
      return res.status(400).json({
        success: false,
        error: "File not provided. Use multipart/form-data with 'file' field",
      });
    }

    // Определяем путь для сохранения в зависимости от типа файла
    const dataDir = path.resolve(process.cwd(), "data", "1c");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Определяем имя файла в зависимости от типа
    const originalExt = path.extname(file.originalname || "").toLowerCase();
    const fileNames: Record<string, string> = {
      products: "products",
      returns: "returns",
      sales: "sales_margin",
      "stock-turnover": "stock_turnover",
      categories: "categories",
    };
    
    const fileName = fileNames[fileType] || "products";
    const targetPath = path.join(dataDir, `${fileName}${originalExt || ".xlsx"}`);
    
    // Сохраняем файл из буфера
    if (file.buffer) {
      fs.writeFileSync(targetPath, file.buffer);
    } else {
      return res.status(400).json({
        success: false,
        error: "Invalid file format",
      });
    }

    logInfo(`1C ${fileType} file uploaded`, {
      source: "1c-upload",
      metadata: {
        filename: file.originalname || `${fileName}.xlsx`,
        fileType,
        size: file.size || 0,
        targetPath,
      },
    });

    // Парсим файл через соответствующий loader (с forceReload)
    const startTime = Date.now();
    let totalRows = 0;
    let processed = 0;
    let withErrors = 0;
    
    try {
      switch (fileType) {
        case "products": {
          const products = await loadOneCProducts(true);
          totalRows = products.length;
          withErrors = products.filter(p => !p.name || !p.article).length;
          processed = totalRows - withErrors;
          logDataParse("1c-products", targetPath, processed, withErrors);
          break;
        }
        case "returns": {
          const returns = await loadOneCReturns(true);
          totalRows = returns.length;
          withErrors = returns.filter(r => !r.documentNumber).length;
          processed = totalRows - withErrors;
          logDataParse("1c-returns", targetPath, processed, withErrors);
          break;
        }
        case "sales": {
          const sales = await loadOneCSalesMargin(true);
          totalRows = sales.length;
          withErrors = sales.filter(s => !s.manager || !s.documentNumber).length;
          processed = totalRows - withErrors;
          logDataParse("1c-sales", targetPath, processed, withErrors);
          break;
        }
        case "stock-turnover": {
          const stock = await loadOneCStockTurnover(true);
          totalRows = stock.length;
          withErrors = stock.filter(s => !s.article || !s.name).length;
          processed = totalRows - withErrors;
          logDataParse("1c-stock-turnover", targetPath, processed, withErrors);
          break;
        }
        case "categories": {
          const categories = await loadOneCCategories(true);
          totalRows = categories.length;
          withErrors = categories.filter(c => !c.name).length;
          processed = totalRows - withErrors;
          logDataParse("1c-categories", targetPath, processed, withErrors);
          break;
        }
        default:
          throw new Error(`Unknown file type: ${fileType}`);
      }
    } catch (parseError) {
      logError(`1C ${fileType} parse error`, parseError, { source: "1c-upload" });
      throw parseError;
    }
    
    const duration = (Date.now() - startTime) / 1000;

    // Сохраняем в историю загрузок
    const uploadResult: UploadResult = {
      id: Date.now(),
      filename: file.originalname || `${fileName}.xlsx`,
      uploaded_at: new Date().toISOString(),
      user: "admin", // TODO: получить из сессии/токена
      status: withErrors === 0 ? "success" : withErrors < totalRows ? "partial" : "error",
      total_rows: totalRows,
      imported: processed,
      updated: 0,
      errors: withErrors,
      errors_log: withErrors > 0 ? [] : undefined, // TODO: детальные ошибки
    };

    const history = loadUploadHistory();
    history.unshift(uploadResult); // Добавляем в начало
    saveUploadHistory(history);

    return res.json({
      success: true,
      imported: processed,
      updated: 0,
      errors: withErrors,
      details: {
        filename: file.originalname || `${fileName}.xlsx`,
        fileType,
        total_rows: totalRows,
        processed,
        created: processed,
        updated: 0,
        skipped: withErrors,
        duration_seconds: duration,
      },
      errors_log: withErrors > 0 ? [] : undefined, // TODO: детальные ошибки
    });
  } catch (error) {
    logError("1C uploadProducts error", error, { source: "1c-upload" });
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload file",
    });
  }
};

const UPLOAD_HISTORY_FILE = path.resolve(process.cwd(), "data", "1c", "upload_history.json");

// Загрузка истории из файла
function loadUploadHistory(): UploadResult[] {
  try {
    if (fs.existsSync(UPLOAD_HISTORY_FILE)) {
      const content = fs.readFileSync(UPLOAD_HISTORY_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    logError("Failed to load upload history", error, { source: "1c-upload" });
  }
  return [];
}

// Сохранение истории в файл
function saveUploadHistory(history: UploadResult[]): void {
  try {
    const dir = path.dirname(UPLOAD_HISTORY_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    // Сохраняем только последние 100 записей
    const limited = history.slice(0, 100);
    fs.writeFileSync(UPLOAD_HISTORY_FILE, JSON.stringify(limited, null, 2), "utf-8");
  } catch (error) {
    logError("Failed to save upload history", error, { source: "1c-upload" });
  }
}


/**
 * GET /api/1c/upload-history
 * История загрузок номенклатуры
 */
export const getUploadHistory: RequestHandler = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const history = loadUploadHistory();
    
    // Применяем пагинацию
    const paginated = history.slice(Number(offset), Number(offset) + Number(limit));
    
    return res.json({
      success: true,
      items: paginated,
      total: history.length,
    });
  } catch (error) {
    logError("1C getUploadHistory error", error, { source: "1c-upload" });
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to load upload history",
    });
  }
};

// Middleware для обработки загрузки файла и текстовых полей
// Multer обрабатывает файлы, express.urlencoded обрабатывает текстовые поля
export const uploadProductsMiddleware = upload.single("file");

