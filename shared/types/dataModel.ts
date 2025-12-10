/**
 * Единая модель данных (Star-Schema)
 * 
 * Определяет типы для фактовых таблиц (fact_*) и справочников (dim_*)
 * в соответствии с архитектурой аналитической системы
 * 
 * Соответствие с существующими типами:
 * - FactYandexOrder соответствует YandexOrder из yandexClient.ts
 * - FactVkAd соответствует VKStatistic из vkClient.ts
 * - Fact1cSale соответствует OneCSalesMarginRow из oneC.ts
 * - Fact1cMargin соответствует OneCSalesMarginRow из oneC.ts
 * - DimProduct соответствует YandexProduct и ProductSnapshot
 * - DimCampaign соответствует YandexCampaign и VKCampaign
 */

// ============================================
// FACT TABLES (Фактовые таблицы)
// ============================================

/**
 * Фактовая таблица: Заказы Yandex Market
 */
export interface FactYandexOrder {
  /** Уникальный идентификатор заказа */
  orderId: string;
  
  /** ID кампании Yandex Market */
  campaignId: string | null;
  
  /** ID товара (связь с dim_products) */
  productId: string | null;
  
  /** SKU товара в магазине */
  shopSku: string | null;
  
  /** Дата создания заказа (ISO date) */
  creationDate: string;
  
  /** Статус заказа */
  status: string;
  
  /** Количество товара */
  quantity: number;
  
  /** Цена для покупателя */
  buyerPrice: number;
  
  /** Выручка (revenue) */
  revenue: number;
}

/**
 * Фактовая таблица: Рекламные объявления VK Ads
 */
export interface FactVkAd {
  /** Дата события (ISO date) */
  date: string;
  
  /** ID кампании VK Ads */
  campaignId: string;
  
  /** ID группы объявлений (опционально) */
  adGroupId?: string;
  
  /** ID баннера/объявления (опционально) */
  bannerId?: string;
  
  /** Количество показов */
  impressions: number;
  
  /** Количество кликов */
  clicks: number;
  
  /** Расходы на рекламу */
  spend: number;
}

/**
 * Фактовая таблица: Продажи из 1С
 */
export interface Fact1cSale {
  /** Уникальный идентификатор продажи */
  saleId: string;
  
  /** Внешний ID заказа (связь с другими системами) */
  externalOrderId?: string;
  
  /** Дата продажи (ISO date) */
  date: string;
  
  /** ID товара (связь с dim_products) */
  productId?: string;
  
  /** ID склада (связь с dim_warehouses) */
  warehouseId?: string;
  
  /** Количество товара */
  quantity: number;
  
  /** Цена продажи */
  price: number;
  
  /** Выручка */
  revenue: number;
}

/**
 * Фактовая таблица: Маржа из 1С
 */
export interface Fact1cMargin {
  /** ID продажи (связь с fact_1c_sales) */
  saleId: string;
  
  /** ID товара (связь с dim_products) */
  productId?: string;
  
  /** Себестоимость */
  cost: number;
  
  /** Маржа (абсолютная) */
  margin: number;
}

/**
 * Фактовая таблица: Снимки остатков на складе
 */
export interface FactStockSnapshot {
  /** Дата снимка (ISO date) */
  snapshotDate: string;
  
  /** ID товара (связь с dim_products) */
  productId: string;
  
  /** ID склада (связь с dim_warehouses) */
  warehouseId?: string;
  
  /** Количество на складе */
  stockQty: number;
  
  /** Стоимость остатков (опционально) */
  stockValue?: number;
}

// ============================================
// DIMENSION TABLES (Справочники)
// ============================================

/**
 * Справочник: Товары
 */
export interface DimProduct {
  /** Уникальный идентификатор товара */
  id: string;
  
  /** Наименование товара */
  name: string;
  
  /** Артикул */
  article?: string;
  
  /** Код из 1С */
  oneCCode?: string;
  
  /** Offer ID из Yandex Market */
  offerId?: string;
  
  /** SKU в магазине */
  shopSku?: string;
  
  /** ID категории (связь с dim_categories) */
  categoryId?: string;
  
  /** Бренд */
  brand?: string;
  
  /** Коллекция */
  collection?: string;
}

/**
 * Справочник: Категории
 */
export interface DimCategory {
  /** Уникальный идентификатор категории */
  id: string;
  
  /** Название категории */
  name: string;
  
  /** ID родительской категории (для иерархии) */
  parentId?: string;
}

/**
 * Справочник: Рекламные кампании
 */
export interface DimCampaign {
  /** Уникальный идентификатор кампании */
  id: string;
  
  /** Источник кампании */
  source: "vk" | "yandex" | "other";
  
  /** Название кампании */
  name: string;
  
  /** Цель кампании */
  objective?: string;
  
  /** Статус кампании */
  status?: string;
}

/**
 * Справочник: Календарь
 */
export interface DimCalendar {
  /** Дата (ISO date) */
  date: string;
  
  /** День месяца (1-31) */
  day: number;
  
  /** Месяц (1-12) */
  month: number;
  
  /** Название месяца */
  monthName: string;
  
  /** Год */
  year: number;
  
  /** Номер недели в году */
  week: number;
  
  /** Квартал (Q1, Q2, Q3, Q4) */
  quarter: string;
  
  /** Выходной день */
  isWeekend: boolean;
}

/**
 * Справочник: Склады
 */
export interface DimWarehouse {
  /** Уникальный идентификатор склада */
  id: string;
  
  /** Название склада */
  name: string;
  
  /** Город расположения склада */
  city?: string;
}

// ============================================
// AGGREGATED TYPES (Агрегированные типы)
// ============================================

/**
 * Унифицированное событие заказа
 * Объединяет заказы из разных источников (Yandex, 1C)
 */
export interface UnifiedOrderEvent {
  /** Дата заказа (ISO date) */
  date: string;
  
  /** Источник заказа */
  source: "yandex" | "1c";
  
  /** ID заказа */
  orderId: string;
  
  /** Внешний ID (для связи между системами) */
  externalId?: string;
  
  /** Выручка */
  revenue: number;
  
  /** Маржа (опционально, если доступна) */
  margin?: number;
  
  /** ID кампании (если заказ связан с рекламой) */
  campaignId?: string;
}

