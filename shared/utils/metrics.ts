/**
 * Чистые функции для расчета KPI и метрик
 * 
 * Все функции:
 * - Корректно обрабатывают деление на ноль (возвращают 0)
 * - Защищены от NaN (проверяют входные значения)
 * - Работают только с number типами
 * - Не имеют побочных эффектов
 */

/**
 * CTR (Click-Through Rate) - Кликабельность рекламы
 * Формула: (Clicks / Impressions) × 100%
 * 
 * @param impressions - Количество показов
 * @param clicks - Количество кликов
 * @returns CTR в процентах (0-100), или 0 если impressions = 0
 */
export function calcCtr(impressions: number, clicks: number): number {
  if (!isFinite(impressions) || !isFinite(clicks)) return 0;
  if (impressions <= 0) return 0;
  return (clicks / impressions) * 100;
}

/**
 * CPC (Cost Per Click) - Цена за клик
 * Формула: Ad Spend / Clicks
 * 
 * @param spend - Расходы на рекламу
 * @param clicks - Количество кликов
 * @returns CPC в рублях, или 0 если clicks = 0
 */
export function calcCpc(spend: number, clicks: number): number {
  if (!isFinite(spend) || !isFinite(clicks)) return 0;
  if (clicks <= 0) return 0;
  return spend / clicks;
}

/**
 * CPM (Cost Per Mille) - Цена за тысячу показов
 * Формула: (Ad Spend / Impressions) × 1,000
 * 
 * @param spend - Расходы на рекламу
 * @param impressions - Количество показов
 * @returns CPM в рублях, или 0 если impressions = 0
 */
export function calcCpm(spend: number, impressions: number): number {
  if (!isFinite(spend) || !isFinite(impressions)) return 0;
  if (impressions <= 0) return 0;
  return (spend / impressions) * 1000;
}

/**
 * ROAS (Return on Ad Spend) - Окупаемость рекламных расходов
 * Формула: Revenue / Ad Spend
 * 
 * @param revenue - Выручка
 * @param adSpend - Расходы на рекламу
 * @returns ROAS (коэффициент), или 0 если adSpend = 0
 */
export function calcRoas(revenue: number, adSpend: number): number {
  if (!isFinite(revenue) || !isFinite(adSpend)) return 0;
  if (adSpend <= 0) return 0;
  return revenue / adSpend;
}

/**
 * Conversion Rate - Конверсия из кликов в заказы
 * Формула: (Orders / Clicks) × 100%
 * 
 * @param orders - Количество заказов
 * @param clicks - Количество кликов
 * @returns Conversion Rate в процентах (0-100), или 0 если clicks = 0
 */
export function calcConversionRate(orders: number, clicks: number): number {
  if (!isFinite(orders) || !isFinite(clicks)) return 0;
  if (clicks <= 0) return 0;
  return (orders / clicks) * 100;
}

/**
 * AOV (Average Order Value) - Средний чек
 * Формула: Total Revenue / Total Orders
 * 
 * @param totalRevenue - Общая выручка
 * @param orders - Количество заказов
 * @returns AOV в рублях, или 0 если orders = 0
 */
export function calcAov(totalRevenue: number, orders: number): number {
  if (!isFinite(totalRevenue) || !isFinite(orders)) return 0;
  if (orders <= 0) return 0;
  return totalRevenue / orders;
}

/**
 * Revenue Share - Доля выручки
 * Формула: (Part Revenue / Total Revenue) × 100%
 * 
 * @param partRevenue - Выручка по части (товару, категории и т.д.)
 * @param totalRevenue - Общая выручка
 * @returns Revenue Share в процентах (0-100), или 0 если totalRevenue = 0
 */
export function calcRevenueShare(partRevenue: number, totalRevenue: number): number {
  if (!isFinite(partRevenue) || !isFinite(totalRevenue)) return 0;
  if (totalRevenue <= 0) return 0;
  return (partRevenue / totalRevenue) * 100;
}

/**
 * Average Price - Средняя цена
 * Формула: Revenue / Quantity
 * 
 * @param revenue - Выручка
 * @param quantity - Количество проданных единиц
 * @returns Average Price в рублях, или 0 если quantity = 0
 */
export function calcAveragePrice(revenue: number, quantity: number): number {
  if (!isFinite(revenue) || !isFinite(quantity)) return 0;
  if (quantity <= 0) return 0;
  return revenue / quantity;
}

/**
 * Margin - Маржа (абсолютная и процентная)
 * Формула:
 *   - margin = revenue - cost
 *   - marginPercent = (margin / revenue) × 100%
 * 
 * @param revenue - Выручка
 * @param cost - Себестоимость
 * @returns Объект с margin (абсолютная маржа) и marginPercent (процентная маржа)
 */
export function calcMargin(revenue: number, cost: number): { margin: number; marginPercent: number } {
  if (!isFinite(revenue) || !isFinite(cost)) {
    return { margin: 0, marginPercent: 0 };
  }
  
  const margin = revenue - cost;
  const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0;
  
  return {
    margin: margin >= 0 ? margin : 0,
    marginPercent: marginPercent >= 0 ? marginPercent : 0,
  };
}

/**
 * Percent Change - Процентное изменение
 * Формула: ((Current - Previous) / Previous) × 100%
 * 
 * Правила:
 * - Если previous = 0 и current > 0, возвращает 100 (рост на 100%)
 * - Если previous = 0 и current = 0, возвращает 0 (нет изменения)
 * - Если previous = 0 и current < 0, возвращает -100 (падение на 100%)
 * - Иначе: ((current - previous) / previous) × 100
 * 
 * @param current - Текущее значение
 * @param previous - Предыдущее значение
 * @returns Процентное изменение (может быть отрицательным)
 */
export function calcPercentChange(current: number, previous: number): number {
  if (!isFinite(current) || !isFinite(previous)) return 0;
  
  if (previous === 0) {
    if (current > 0) return 100;
    if (current < 0) return -100;
    return 0;
  }
  
  return ((current - previous) / previous) * 100;
}

