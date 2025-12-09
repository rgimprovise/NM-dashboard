/**
 * Client for 1C Data API
 * 
 * Provides functions to fetch normalized data from 1C Excel files
 */

import {
  ProductSnapshot,
  OneCSalesMarginRow,
  OneCReturnRow,
  OneCStockTurnoverRow,
  OneCCategoryRow,
} from "../../../shared/types/oneC";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const BASE_URL = "/api/1c";

/**
 * Helper function for making API requests
 * Handles success/error response format and throws on failure
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
 * Fetch products from 1C
 * @param forceReload - Force reload from files (bypass cache)
 * @returns Array of ProductSnapshot
 */
export async function fetchOneCProducts(
  forceReload: boolean = false
): Promise<ProductSnapshot[]> {
  try {
    const params = new URLSearchParams();
    if (forceReload) params.append("forceReload", "true");

    const endpoint = `/products${params.toString() ? "?" + params.toString() : ""}`;
    const data = await fetchAPI<ProductSnapshot[]>(endpoint);
    return data || [];
  } catch (error) {
    console.error("Error fetching 1C products:", error);
    throw error;
  }
}

/**
 * Fetch sales and margin data from 1C
 * @param forceReload - Force reload from files (bypass cache)
 * @returns Array of OneCSalesMarginRow
 */
export async function fetchOneCSales(
  forceReload: boolean = false
): Promise<OneCSalesMarginRow[]> {
  try {
    const params = new URLSearchParams();
    if (forceReload) params.append("forceReload", "true");

    const endpoint = `/sales${params.toString() ? "?" + params.toString() : ""}`;
    const data = await fetchAPI<OneCSalesMarginRow[]>(endpoint);
    return data || [];
  } catch (error) {
    console.error("Error fetching 1C sales:", error);
    throw error;
  }
}

/**
 * Fetch returns data from 1C
 * @param forceReload - Force reload from files (bypass cache)
 * @returns Array of OneCReturnRow
 */
export async function fetchOneCReturns(
  forceReload: boolean = false
): Promise<OneCReturnRow[]> {
  try {
    const params = new URLSearchParams();
    if (forceReload) params.append("forceReload", "true");

    const endpoint = `/returns${params.toString() ? "?" + params.toString() : ""}`;
    const data = await fetchAPI<OneCReturnRow[]>(endpoint);
    return data || [];
  } catch (error) {
    console.error("Error fetching 1C returns:", error);
    throw error;
  }
}

/**
 * Fetch stock turnover data from 1C
 * @param forceReload - Force reload from files (bypass cache)
 * @returns Array of OneCStockTurnoverRow
 */
export async function fetchOneCStockTurnover(
  forceReload: boolean = false
): Promise<OneCStockTurnoverRow[]> {
  try {
    const params = new URLSearchParams();
    if (forceReload) params.append("forceReload", "true");

    const endpoint = `/stock-turnover${params.toString() ? "?" + params.toString() : ""}`;
    const data = await fetchAPI<OneCStockTurnoverRow[]>(endpoint);
    return data || [];
  } catch (error) {
    console.error("Error fetching 1C stock turnover:", error);
    throw error;
  }
}

/**
 * Fetch categories from 1C
 * @param forceReload - Force reload from files (bypass cache)
 * @returns Array of OneCCategoryRow
 */
export async function fetchOneCCategories(
  forceReload: boolean = false
): Promise<OneCCategoryRow[]> {
  try {
    const params = new URLSearchParams();
    if (forceReload) params.append("forceReload", "true");

    const endpoint = `/categories${params.toString() ? "?" + params.toString() : ""}`;
    const data = await fetchAPI<OneCCategoryRow[]>(endpoint);
    return data || [];
  } catch (error) {
    console.error("Error fetching 1C categories:", error);
    throw error;
  }
}

