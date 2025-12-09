/**
 * API routes для данных 1C
 * 
 * Предоставляет доступ к нормализованным данным из Excel файлов 1C
 */

import { RequestHandler } from "express";
import {
  loadOneCProducts,
  loadOneCStockTurnover,
  loadOneCSalesMargin,
  loadOneCReturns,
  loadOneCCategories,
} from "../services/oneCDataLoader";
import { ProductSnapshot } from "../../shared/types/oneC";

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

