/**
 * Утилиты для работы с периодами времени
 * 
 * Предоставляет единообразный способ расчета периодов для аналитики
 */

export type PeriodCode = "7d" | "30d" | "90d" | "ytd";

export interface PeriodRange {
  code: PeriodCode;
  label: string;
  dateFrom: string; // YYYY-MM-DD
  dateTo: string;   // YYYY-MM-DD
}

/**
 * Получить диапазон дат для указанного периода
 * 
 * @param code - Код периода: "7d", "30d", "90d", "ytd"
 * @param now - Опциональная дата "сегодня" (по умолчанию текущая дата)
 * @returns PeriodRange с диапазоном дат и меткой
 */
export function getPeriodRange(code: PeriodCode, now?: Date): PeriodRange {
  const today = now || new Date();
  const dateTo = new Date(today);
  dateTo.setHours(23, 59, 59, 999); // Конец дня
  
  const dateFrom = new Date(today);

  switch (code) {
    case "7d":
      dateFrom.setDate(today.getDate() - 7);
      dateFrom.setHours(0, 0, 0, 0);
      return {
        code,
        label: "7 дней",
        dateFrom: dateFrom.toISOString().split("T")[0],
        dateTo: dateTo.toISOString().split("T")[0],
      };

    case "30d":
      dateFrom.setDate(today.getDate() - 30);
      dateFrom.setHours(0, 0, 0, 0);
      return {
        code,
        label: "30 дней",
        dateFrom: dateFrom.toISOString().split("T")[0],
        dateTo: dateTo.toISOString().split("T")[0],
      };

    case "90d":
      dateFrom.setDate(today.getDate() - 90);
      dateFrom.setHours(0, 0, 0, 0);
      return {
        code,
        label: "90 дней",
        dateFrom: dateFrom.toISOString().split("T")[0],
        dateTo: dateTo.toISOString().split("T")[0],
      };

    case "ytd":
      dateFrom.setMonth(0, 1); // 1 января
      dateFrom.setHours(0, 0, 0, 0);
      return {
        code,
        label: "С начала года",
        dateFrom: dateFrom.toISOString().split("T")[0],
        dateTo: dateTo.toISOString().split("T")[0],
      };

    default:
      // Fallback на 30 дней
      dateFrom.setDate(today.getDate() - 30);
      dateFrom.setHours(0, 0, 0, 0);
      return {
        code: "30d",
        label: "30 дней",
        dateFrom: dateFrom.toISOString().split("T")[0],
        dateTo: dateTo.toISOString().split("T")[0],
      };
  }
}

/**
 * Предопределенные опции периодов для использования в селекторах
 */
export const PERIOD_OPTIONS: PeriodRange[] = [
  getPeriodRange("7d"),
  getPeriodRange("30d"),
  getPeriodRange("90d"),
  getPeriodRange("ytd"),
];

