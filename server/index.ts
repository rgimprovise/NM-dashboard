// Load .env file FIRST, before any other imports
// Use createRequire for ES modules compatibility
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Try to load loadEnv.cjs, but fallback to manual loading if not found
try {
  // Try to require from source location first
  const loadEnvPath = require.resolve("./loadEnv.cjs");
  require(loadEnvPath);
  console.log("✅ loadEnv.cjs executed");
} catch (error) {
  // Fallback: load .env manually (works in both source and dist)
  try {
    const fs = require("fs");
    const path = require("path");
    const cwd = process.cwd();
    const envPaths = [
      path.resolve(cwd, ".env"),
      path.resolve(cwd, "..", ".env"),
    ];
    
    let envLoaded = false;
    for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      envContent.split("\n").forEach((line: string) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const [key, ...valueParts] = trimmed.split("=");
          if (key && valueParts.length > 0) {
            let value = valueParts.join("=").trim();
            value = value.replace(/^["']|["']$/g, "");
            process.env[key.trim()] = value;
          }
        }
      });
      console.log("✅ .env loaded manually from:", envPath);
        envLoaded = true;
        break;
      }
    }
    
    if (!envLoaded) {
      console.warn("⚠️ Could not load loadEnv.cjs and .env file not found in:", envPaths);
    }
  } catch (err) {
    console.warn("⚠️ Could not load .env manually:", err instanceof Error ? err.message : String(err));
  }
}

// Tokens are now loaded via dotenv/config in package.json script

import express from "express";
import cors from "cors";
import * as yandexRoutes from "./routes/yandex";
import * as vkRoutes from "./routes/vk";
import * as oneCRoutes from "./routes/oneC";
import * as analyticsRoutes from "./routes/analytics";
import * as mappingRoutes from "./routes/productMapping";
import * as dashboardRoutes from "./routes/dashboardRoutes";
import * as settingsRoutes from "./routes/settingsRoutes";
import { initTokenManager } from "./utils/vkTokenManager";

// Function to load .env file manually (kept for createServer call)
function loadEnvFile(): void {
  if (typeof process === 'undefined' || !process.env) {
    return;
  }
  
  try {
    // Use Node.js built-in modules (available in Node.js runtime)
    // require is already available from createRequire at top level
    const fs = require("fs");
    const path = require("path");
    
    // Try multiple paths to find .env file
    const cwd = process.cwd();
    const envPaths = [
      path.resolve(cwd, ".env"),
      path.resolve(cwd, "..", ".env"),
    ];
    
    for (const envPath of envPaths) {
      try {
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, "utf-8");
          // Parse .env file manually
          envContent.split("\n").forEach((line) => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
              const [key, ...valueParts] = trimmed.split("=");
              if (key && valueParts.length > 0) {
                let value = valueParts.join("=").trim();
                // Remove surrounding quotes
                value = value.replace(/^["']|["']$/g, "");
                process.env[key.trim()] = value;
              }
            }
          });
          console.log("✅ .env loaded from:", envPath);
          
          // Verify tokens are loaded
          console.log("✅ YANDEX_TOKEN:", process.env.YANDEX_TOKEN ? `SET (${process.env.YANDEX_TOKEN.substring(0, 20)}...)` : "NOT SET");
          console.log("✅ VK_TOKEN:", process.env.VK_TOKEN ? `SET (${process.env.VK_TOKEN.substring(0, 20)}...)` : "NOT SET");
          return;
        }
      } catch (err) {
        // Try next path
      }
    }
    
    console.warn("⚠️ .env file not found in:", envPaths);
  } catch (error) {
    console.warn("⚠️ Could not load .env manually:", error instanceof Error ? error.message : String(error));
  }
}

export function createServer() {
  const app = express();

  // Initialize VK Token Manager (with error handling)
  try {
    initTokenManager();
  } catch (error) {
    console.warn('⚠️ Token manager initialization failed, continuing without it:', error instanceof Error ? error.message : String(error));
  }

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // Yandex Market API proxy routes
  app.get("/api/yandex/campaigns", yandexRoutes.getCampaigns);
  app.get("/api/yandex/orders", yandexRoutes.getOrders);
  app.get("/api/yandex/products", yandexRoutes.getProducts);
  app.get("/api/yandex/stocks", yandexRoutes.getStocks);
  app.get("/api/yandex/stats/orders", yandexRoutes.getOrderStats);

  // VK Ads API proxy routes
  app.get("/api/vk/ad-plans", vkRoutes.getAdPlans);
  app.get("/api/vk/campaigns", vkRoutes.getCampaigns);
  app.get("/api/vk/ad-groups", vkRoutes.getAdGroups);
  app.get("/api/vk/banners", vkRoutes.getBanners);
  app.post("/api/vk/statistics", vkRoutes.getStatistics);
  app.get("/api/vk/statistics", vkRoutes.getStatistics);

  // 1C Data routes
  app.get("/api/1c/products", oneCRoutes.getProducts);
  app.get("/api/1c/sales", oneCRoutes.getSales);
  app.get("/api/1c/returns", oneCRoutes.getReturns);
  app.get("/api/1c/stock-turnover", oneCRoutes.getStockTurnover);
  app.get("/api/1c/categories", oneCRoutes.getCategories);
  app.post("/api/1c/upload-products", oneCRoutes.uploadProductsMiddleware, oneCRoutes.uploadProducts);
  app.get("/api/1c/upload-history", oneCRoutes.getUploadHistory);

  // Analytics routes
  app.get("/api/analytics/funnel", analyticsRoutes.getFunnel);
  app.get("/api/analytics/data-quality", analyticsRoutes.getDataQuality);

  // Dashboard routes
  app.get("/api/dashboard/summary", dashboardRoutes.getDashboardSummary);

  // Settings routes
  app.get("/api/settings/token-status", settingsRoutes.getTokenStatus);
  app.get("/api/settings/all", settingsRoutes.getAllSettings);
  app.post("/api/settings/save", settingsRoutes.saveAllSettings);
  app.post("/api/settings/yandex", settingsRoutes.saveYandexSettings);
  app.post("/api/settings/vk", settingsRoutes.saveVKSettings);
  app.post("/api/settings/test-connection", settingsRoutes.testConnection);
  app.get("/api/settings/sync-status", settingsRoutes.getSyncStatus);
  app.post("/api/settings/trigger-sync", settingsRoutes.triggerSync);
  app.get("/api/settings/sync-history", settingsRoutes.getSyncHistory);

  // Product mapping routes
  app.get("/api/mapping/products", mappingRoutes.getProductMappings);
  app.post("/api/mapping/products", mappingRoutes.createProductMapping);
  app.post("/api/mapping/auto", mappingRoutes.autoMapProducts);

  // 404 handler for API routes (must be before SPA middleware)
  app.use("/api/*", (req, res) => {
    res.status(404).json({
      success: false,
      error: `API endpoint not found: ${req.method} ${req.path}`,
    });
  });

  // Global error handler for API routes
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Only handle errors for API routes
    if (req.path.startsWith("/api/")) {
      console.error("API Error:", err);
      res.status(500).json({
        success: false,
        error: err.message || "Internal server error",
      });
    } else {
      next(err);
    }
  });

  return app;
}
