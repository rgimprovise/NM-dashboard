/**
 * Простое структурированное логирование
 * 
 * Обертка над console.log/warn/error для единообразного логирования
 * В будущем можно заменить на winston/pino
 */

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
  console.log(`[INFO] ${timestamp} ${message}${contextStr}`);
}

/**
 * Логирование предупреждений
 */
export function logWarn(message: string, context?: LogContext): void {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : "";
  console.warn(`[WARN] ${timestamp} ${message}${contextStr}`);
}

/**
 * Логирование ошибок
 */
export function logError(message: string, error?: Error | unknown, context?: LogContext): void {
  const timestamp = new Date().toISOString();
  const errorStr = error instanceof Error ? ` ${error.message}` : error ? ` ${String(error)}` : "";
  const contextStr = context ? ` ${JSON.stringify(context)}` : "";
  console.error(`[ERROR] ${timestamp} ${message}${errorStr}${contextStr}`);
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
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
  } else {
    logInfo(`Data parse completed: ${source}`, context);
  }
}

