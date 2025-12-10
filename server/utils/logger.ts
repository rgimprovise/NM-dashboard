/**
 * Простое структурированное логирование
 * 
 * Обертка над console.log/warn/error для единообразного логирования
 * В будущем можно заменить на winston/pino
 * 
 * Логи также записываются в файлы в папке logs/
 */

// Импорт Node.js модулей (ES modules совместимость)
import * as fs from "fs";
import * as path from "path";

// Инициализация пути к логам
const LOGS_DIR = path.resolve(process.cwd(), "logs");

// Создаем папку logs если её нет (при первой загрузке модуля)
try {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
    console.log(`📁 Created logs directory: ${LOGS_DIR}`);
  }
} catch (error) {
  console.warn(`⚠️ Failed to create logs directory: ${error instanceof Error ? error.message : String(error)}`);
}

/**
 * Записать лог в файл
 */
function writeLogToFile(filename: string, message: string): void {
  try {
    const logPath = path.join(LOGS_DIR, filename);
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message}\n`;
    
    fs.appendFileSync(logPath, logLine, 'utf-8');
  } catch (error) {
    // Логируем ошибку записи только в консоль (чтобы не было рекурсии)
    console.error(`[Logger] Failed to write to ${filename}:`, error instanceof Error ? error.message : String(error));
  }
}

export interface LogContext {
  source?: string;
  endpoint?: string;
  duration?: number;
  cacheHit?: boolean;
  recordsCount?: number;
  error?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * Логирование информационных сообщений
 */
export function logInfo(message: string, context?: LogContext): void {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : "";
  const logMessage = `[INFO] ${timestamp} ${message}${contextStr}`;
  console.log(logMessage);
  writeLogToFile("info.log", logMessage);
}

/**
 * Логирование предупреждений
 */
export function logWarn(message: string, context?: LogContext): void {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : "";
  const logMessage = `[WARN] ${timestamp} ${message}${contextStr}`;
  console.warn(logMessage);
  writeLogToFile("warn.log", logMessage);
}

/**
 * Логирование ошибок
 */
export function logError(message: string, error?: Error | unknown, context?: LogContext): void {
  const timestamp = new Date().toISOString();
  const errorStr = error instanceof Error ? ` ${error.message}` : error ? ` ${String(error)}` : "";
  const contextStr = context ? ` ${JSON.stringify(context)}` : "";
  const logMessage = `[ERROR] ${timestamp} ${message}${errorStr}${contextStr}`;
  console.error(logMessage);
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
    writeLogToFile("errors.log", `${logMessage}\n${error.stack}`);
  } else {
    writeLogToFile("errors.log", logMessage);
  }
}

/**
 * Логирование событий API запросов
 */
export function logApiRequest(
  method: string,
  endpoint: string,
  duration?: number,
  cacheHit?: boolean,
  recordsCount?: number,
  error?: string
): void {
  const context: LogContext = {
    source: "api",
    endpoint: `${method} ${endpoint}`,
    duration,
    cacheHit,
    recordsCount,
    error,
  };

  if (error) {
    logError(`API Request failed: ${method} ${endpoint}`, undefined, context);
  } else {
    logInfo(`API Request: ${method} ${endpoint}`, context);
    // Дополнительно пишем в отдельный файл для API запросов
    const apiLogMessage = `${method} ${endpoint} | Duration: ${duration}ms | Cache: ${cacheHit ? 'HIT' : 'MISS'} | Records: ${recordsCount || 0}`;
    writeLogToFile("api-requests.log", apiLogMessage);
  }
}

/**
 * Логирование событий парсинга данных
 */
export function logDataParse(
  source: string,
  filePath: string,
  recordsCount: number,
  errors?: number
): void {
  const context: LogContext = {
    source: "data-parse",
    metadata: {
      filePath,
      recordsCount,
      errors: errors || 0,
    },
  };

  if (errors && errors > 0) {
    logWarn(`Data parse completed with errors: ${source}`, context);
    writeLogToFile("data-parse-errors.log", `${source} | ${filePath} | Records: ${recordsCount} | Errors: ${errors}`);
  } else {
    logInfo(`Data parse completed: ${source}`, context);
    writeLogToFile("data-parse.log", `${source} | ${filePath} | Records: ${recordsCount}`);
  }
}

