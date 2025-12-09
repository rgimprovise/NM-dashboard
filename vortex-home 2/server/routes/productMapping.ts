/**
 * API routes для маппинга товаров 1C ↔ Yandex Market
 * 
 * Пока использует JSON файл для хранения маппингов
 * В будущем можно заменить на БД
 */

import { RequestHandler } from "express";
import * as fs from "fs";
import * as path from "path";
import { loadOneCProducts } from "../services/oneCDataLoader";
import { logInfo, logError } from "../utils/logger";

// Вспомогательная функция для получения товаров Yandex
async function getYandexProducts(): Promise<any[]> {
  try {
    // Используем внутренний вызов к API
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 8080}`;
    const response = await fetch(`${baseUrl}/api/yandex/products`, {
      headers: { "Content-Type": "application/json" },
    }).catch(() => null);
    
    if (response?.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        return Array.isArray(data.data) ? data.data : [];
      }
    }
  } catch (error) {
    logError("Failed to fetch Yandex products for mapping", error);
  }
  return [];
}

interface ProductMapping {
  id: number;
  c1_code: string;
  c1_name: string;
  c1_article?: string;
  yandex_offer_id: string | null;
  yandex_name: string | null;
  mapping_type: "auto" | "manual" | null;
  confidence: number | null;
  created_at: string | null;
}

const MAPPINGS_FILE = path.resolve(process.cwd(), "data", "1c", "product_mappings.json");

// Загрузка маппингов из файла
function loadMappings(): ProductMapping[] {
  try {
    if (fs.existsSync(MAPPINGS_FILE)) {
      const content = fs.readFileSync(MAPPINGS_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    logError("Failed to load product mappings", error, { source: "product-mapping" });
  }
  return [];
}

// Сохранение маппингов в файл
function saveMappings(mappings: ProductMapping[]): void {
  try {
    const dir = path.dirname(MAPPINGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(MAPPINGS_FILE, JSON.stringify(mappings, null, 2), "utf-8");
  } catch (error) {
    logError("Failed to save product mappings", error, { source: "product-mapping" });
  }
}

/**
 * GET /api/mapping/products
 * Получить маппинг товаров
 */
export const getProductMappings: RequestHandler = async (req, res) => {
  try {
    const { unmapped_only, confidence_min, limit = 50, offset = 0 } = req.query;

    // Загружаем товары из 1C и Yandex
    const [oneCProducts, yandexProducts] = await Promise.all([
      loadOneCProducts().catch(() => []),
      getYandexProducts(),
    ]);

    // Загружаем существующие маппинги
    const existingMappings = loadMappings();
    const mappingsMap = new Map<string, ProductMapping>();
    existingMappings.forEach(m => {
      mappingsMap.set(m.c1_code, m);
    });

    // Создаем полный список маппингов (включая несвязанные товары)
    const allMappings: ProductMapping[] = oneCProducts.map((product, idx) => {
      const existing = mappingsMap.get(product.article || "");
      if (existing) {
        return existing;
      }

      // Ищем автоматическое совпадение
      const yandexMatch = yandexProducts.find((yp: any) => {
        // Сравнение по артикулу
        if (product.article && yp.offerId && product.article.toLowerCase().trim() === yp.offerId.toLowerCase().trim()) {
          return true;
        }
        // Сравнение по shopSku
        if (product.article && yp.shopSku && product.article.toLowerCase().trim() === yp.shopSku.toLowerCase().trim()) {
          return true;
        }
        // Фаззи-сравнение по названию
        const name1 = product.name.toLowerCase().trim().replace(/\s+/g, " ");
        const name2 = (yp.name || "").toLowerCase().trim().replace(/\s+/g, " ");
        if (name1 && name2 && name1 === name2) {
          return true;
        }
        return false;
      });

      return {
        id: Date.now() + idx,
        c1_code: product.article || `product_${idx}`,
        c1_name: product.name,
        c1_article: product.article,
        yandex_offer_id: yandexMatch ? (yandexMatch.offerId || yandexMatch.shopSku || null) : null,
        yandex_name: yandexMatch ? (yandexMatch.name || null) : null,
        mapping_type: yandexMatch ? "auto" : null,
        confidence: yandexMatch ? 0.9 : null,
        created_at: null,
      };
    });

    // Фильтруем по параметрам
    let filtered = allMappings;
    if (unmapped_only === "true") {
      filtered = filtered.filter(m => !m.yandex_offer_id);
    }
    if (confidence_min) {
      const min = parseFloat(confidence_min as string);
      filtered = filtered.filter(m => m.confidence !== null && m.confidence >= min);
    }

    // Применяем пагинацию
    const paginated = filtered.slice(Number(offset), Number(offset) + Number(limit));

    const mapped = allMappings.filter(m => m.yandex_offer_id).length;
    const unmapped = allMappings.filter(m => !m.yandex_offer_id).length;

    return res.json({
      success: true,
      mappings: paginated,
      total: filtered.length,
      mapped,
      unmapped,
    });
  } catch (error) {
    logError("getProductMappings error", error, { source: "product-mapping" });
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to load product mappings",
    });
  }
};

/**
 * POST /api/mapping/products
 * Создать/обновить маппинг товара
 */
export const createProductMapping: RequestHandler = async (req, res) => {
  try {
    const { c1_code, yandex_offer_id } = req.body;

    if (!c1_code || !yandex_offer_id) {
      return res.status(400).json({
        success: false,
        error: "c1_code and yandex_offer_id are required",
      });
    }

    const mappings = loadMappings();
    const existingIndex = mappings.findIndex(m => m.c1_code === c1_code);

    const mapping: ProductMapping = {
      id: existingIndex >= 0 ? mappings[existingIndex].id : Date.now(),
      c1_code,
      c1_name: "", // Будет заполнено из 1C данных
      c1_article: c1_code,
      yandex_offer_id,
      yandex_name: null, // Будет заполнено из Yandex данных
      mapping_type: "manual",
      confidence: 1.0,
      created_at: new Date().toISOString(),
    };

    // Заполняем названия из данных
    const oneCProducts = await loadOneCProducts().catch(() => []);
    const oneCProduct = oneCProducts.find(p => p.article === c1_code);
    if (oneCProduct) {
      mapping.c1_name = oneCProduct.name;
    }

    const yandexProducts = await getYandexProducts();
    const yandexProduct = yandexProducts.find((p: any) => p.offerId === yandex_offer_id || p.shopSku === yandex_offer_id);
    if (yandexProduct) {
      mapping.yandex_name = yandexProduct.name;
    }

    if (existingIndex >= 0) {
      mappings[existingIndex] = mapping;
    } else {
      mappings.push(mapping);
    }

    saveMappings(mappings);

    logInfo("Product mapping created/updated", {
      source: "product-mapping",
      metadata: { c1_code, yandex_offer_id },
    });

    return res.json({
      success: true,
      mapping,
    });
  } catch (error) {
    logError("createProductMapping error", error, { source: "product-mapping" });
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create product mapping",
    });
  }
};

/**
 * POST /api/mapping/auto
 * Автоматический маппинг товаров
 */
export const autoMapProducts: RequestHandler = async (req, res) => {
  try {
    const { confidence_threshold = 0.8, method = "both" } = req.body;

    const [oneCProducts, yandexProducts] = await Promise.all([
      loadOneCProducts().catch(() => []),
      getYandexProducts(),
    ]);

    const mappings = loadMappings();
    const mappingsMap = new Map<string, ProductMapping>();
    mappings.forEach(m => mappingsMap.set(m.c1_code, m));

    let mapped = 0;
    const suggested: Array<{ c1_code: string; yandex_offer_id: string; confidence: number }> = [];

    oneCProducts.forEach(product => {
      const article = product.article || "";
      if (!article || mappingsMap.has(article)) {
        return; // Пропускаем если уже есть маппинг
      }

      // Ищем совпадения
      let bestMatch: any = null;
      let bestConfidence = 0;

      yandexProducts.forEach((yp: any) => {
        let confidence = 0;

        // Сравнение по артикулу
        if (method === "article" || method === "both") {
          if (article && yp.offerId && article.toLowerCase().trim() === yp.offerId.toLowerCase().trim()) {
            confidence = 1.0;
          } else if (article && yp.shopSku && article.toLowerCase().trim() === yp.shopSku.toLowerCase().trim()) {
            confidence = 0.95;
          }
        }

        // Сравнение по названию
        if (confidence < confidence_threshold && (method === "name" || method === "both")) {
          const name1 = product.name.toLowerCase().trim().replace(/\s+/g, " ");
          const name2 = (yp.name || "").toLowerCase().trim().replace(/\s+/g, " ");
          if (name1 && name2) {
            if (name1 === name2) {
              confidence = Math.max(confidence, 0.9);
            } else if (name1.includes(name2) || name2.includes(name1)) {
              confidence = Math.max(confidence, 0.7);
            }
          }
        }

        if (confidence > bestConfidence && confidence >= confidence_threshold) {
          bestConfidence = confidence;
          bestMatch = yp;
        }
      });

      if (bestMatch && bestConfidence >= confidence_threshold) {
        const mapping: ProductMapping = {
          id: Date.now() + mapped,
          c1_code: article,
          c1_name: product.name,
          c1_article: article,
          yandex_offer_id: bestMatch.offerId || bestMatch.shopSku || null,
          yandex_name: bestMatch.name || null,
          mapping_type: "auto",
          confidence: bestConfidence,
          created_at: new Date().toISOString(),
        };
        mappings.push(mapping);
        mappingsMap.set(article, mapping);
        mapped++;
      } else if (bestMatch) {
        suggested.push({
          c1_code: article,
          yandex_offer_id: bestMatch.offerId || bestMatch.shopSku || "",
          confidence: bestConfidence,
        });
      }
    });

    saveMappings(mappings);

    logInfo("Auto mapping completed", {
      source: "product-mapping",
      metadata: { mapped, suggested: suggested.length },
    });

    return res.json({
      success: true,
      mapped,
      suggested,
    });
  } catch (error) {
    logError("autoMapProducts error", error, { source: "product-mapping" });
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to auto-map products",
    });
  }
};

