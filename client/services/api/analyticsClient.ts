/**
 * Client for Analytics API
 * 
 * Provides functions to fetch aggregated analytics data from all sources
 */

import { PeriodCode } from "../../../shared/utils/periods";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const BASE_URL = "/api/analytics";

/**
 * Helper function for making API requests
 */
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as ApiResponse<T>;

  if (!data.success) {
    throw new Error(data.error || "Unknown error");
  }

  if (data.data === undefined) {
    throw new Error("Response data is undefined");
  }

  return data.data;
}

/**
 * Структура сквозной воронки
 */
export interface FunnelSummary {
  periodLabel: string;
  vk: {
    impressions: number;
    clicks: number;
    spend: number;
  };
  yandex: {
    orders: number;
    revenue: number;
  };
  oneC: {
    orders: number;
    revenue: number;
    margin?: number;
  };
  kpi: {
    ctr: number;
    cpc: number;
    cpm: number;
    roas: number;
    conversionRate: number;
    aov: number;
  };
}

/**
 * Структура отчета о качестве данных
 */
export interface DataQualityReport {
  products: {
    total: number;
    missingArticleCount: number;
    missingPriceCount: number;
    zeroOrNegativeStockCount: number;
    duplicateArticleCount: number;
    examples: {
      missingArticle: Array<{ name: string; article: string }>;
      missingPrice: Array<{ name: string; article?: string; retailPrice: number }>;
      duplicateArticles: Array<{ article: string; count: number; examples: string[] }>;
    };
  };
  sales: {
    total: number;
    withMissingData: number;
  };
  returns: {
    total: number;
    withMissingData: number;
  };
}

/**
 * Fetch funnel summary for a period
 * @param period - Period code (7d, 30d, 90d, ytd)
 * @returns FunnelSummary with aggregated data and KPIs
 */
export async function fetchFunnelSummary(
  period: PeriodCode
): Promise<FunnelSummary> {
  try {
    const params = new URLSearchParams({ period });
    const endpoint = `/funnel?${params.toString()}`;
    const data = await fetchAPI<FunnelSummary>(endpoint);
    return data;
  } catch (error) {
    console.error("Error fetching funnel summary:", error);
    throw error;
  }
}

/**
 * Fetch data quality report
 * @returns DataQualityReport with analysis of 1C data quality
 */
export async function fetchDataQualityReport(): Promise<DataQualityReport> {
  try {
    const endpoint = "/data-quality";
    const data = await fetchAPI<DataQualityReport>(endpoint);
    return data;
  } catch (error) {
    console.error("Error fetching data quality report:", error);
    throw error;
  }
}

