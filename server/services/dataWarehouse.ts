/**
 * Data Warehouse - единая точка агрегации данных из всех источников
 * 
 * Агрегирует данные VK, Yandex и 1C в структуру star-schema
 */

import { PeriodRange } from "../../shared/utils/periods";
import {
  FactYandexOrder,
  FactVkAd,
  Fact1cSale,
  Fact1cMargin,
  FactStockSnapshot,
  DimProduct,
  DimCategory,
  DimCampaign,
} from "../../shared/types/dataModel";
import {
  normalizeOneCProductsToDimProducts,
  normalizeOneCSalesToFacts,
  normalizeOneCStockToFactSnapshots,
  normalizeOneCCategoriesToDimCategories,
} from "./oneCDataLoader";
import { toFactYandexOrders } from "./yandexNormalizer";
import { toFactVkAds } from "./vkNormalizer";

/**
 * Структура агрегированных данных для периода
 */
export interface FactsAndDimsForPeriod {
  facts: {
    yandexOrders: FactYandexOrder[];
    vkAds: FactVkAd[];
    oneCSales: Fact1cSale[];
    oneCMargins: Fact1cMargin[];
    stockSnapshots: FactStockSnapshot[];
  };
  dims: {
    products: DimProduct[];
    categories: DimCategory[];
    campaigns: DimCampaign[];
  };
}

/**
 * Получить агрегированные данные из всех источников за период
 * 
 * @param periodRange - Диапазон дат для выборки
 * @param options - Опции загрузки
 * @returns Агрегированные факты и измерения
 */
export async function getFactsAndDimsForPeriod(
  periodRange: PeriodRange,
  options: {
    forceReload?: boolean;
    includeYandex?: boolean;
    includeVK?: boolean;
    include1C?: boolean;
  } = {}
): Promise<FactsAndDimsForPeriod> {
  const {
    forceReload = false,
    includeYandex = true,
    includeVK = true,
    include1C = true,
  } = options;

  // Инициализируем структуру результата
  const result: FactsAndDimsForPeriod = {
    facts: {
      yandexOrders: [],
      vkAds: [],
      oneCSales: [],
      oneCMargins: [],
      stockSnapshots: [],
    },
    dims: {
      products: [],
      categories: [],
      campaigns: [],
    },
  };

  // Загружаем данные 1C (если включено)
  if (include1C) {
    try {
      // Нормализуем продукты и категории
      const [products, categories, salesData, stockSnapshots] = await Promise.all([
        normalizeOneCProductsToDimProducts(forceReload),
        normalizeOneCCategoriesToDimCategories(forceReload),
        normalizeOneCSalesToFacts(forceReload),
        normalizeOneCStockToFactSnapshots(forceReload),
      ]);

      result.dims.products = products;
      result.dims.categories = categories;
      result.facts.oneCSales = salesData.sales;
      result.facts.oneCMargins = salesData.margins;
      result.facts.stockSnapshots = stockSnapshots;

      // Фильтруем продажи по периоду
      result.facts.oneCSales = result.facts.oneCSales.filter(sale => {
        const saleDate = new Date(sale.date);
        const fromDate = new Date(periodRange.dateFrom);
        const toDate = new Date(periodRange.dateTo);
        toDate.setHours(23, 59, 59, 999);
        return saleDate >= fromDate && saleDate <= toDate;
      });

      // Фильтруем маржу по продажам в периоде
      const saleIdsInPeriod = new Set(result.facts.oneCSales.map(s => s.saleId));
      result.facts.oneCMargins = result.facts.oneCMargins.filter(m => 
        saleIdsInPeriod.has(m.saleId)
      );
    } catch (error) {
      console.error("Error loading 1C data:", error);
      // Продолжаем работу, даже если 1C данные недоступны
    }
  }

  // TODO: Добавить загрузку Yandex и VK данных через их API
  // Пока оставляем пустые массивы, так как загрузка требует доступа к routes
  // Это будет реализовано в следующем шаге через вызовы API

  return result;
}

/**
 * Получить только факты за период (без измерений)
 */
export async function getFactsForPeriod(
  periodRange: PeriodRange,
  options?: { forceReload?: boolean }
): Promise<FactsAndDimsForPeriod["facts"]> {
  const data = await getFactsAndDimsForPeriod(periodRange, options);
  return data.facts;
}

/**
 * Получить только измерения (справочники)
 */
export async function getDims(
  options?: { forceReload?: boolean }
): Promise<FactsAndDimsForPeriod["dims"]> {
  const data = await getFactsAndDimsForPeriod(
    { code: "30d", label: "30 дней", dateFrom: "", dateTo: "" },
    { includeYandex: false, includeVK: false, ...options }
  );
  return data.dims;
}

