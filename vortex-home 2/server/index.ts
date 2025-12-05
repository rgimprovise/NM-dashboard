// Load dotenv only in Node.js environment
// Use a simple check to avoid issues in Builder.io
if (typeof process !== 'undefined' && process.env) {
  // Use dynamic import that won't block if dotenv fails
  // This is safe because it's in a try-catch and won't break the module
  try {
    // dotenv/config is loaded via side-effect import
    // If it fails, we continue without it
    void import("dotenv/config");
  } catch {
    // Continue without dotenv - environment variables may be set another way
  }
}

import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import * as yandexRoutes from "./routes/yandex";
import * as vkRoutes from "./routes/vk";
import { initTokenManager } from "./utils/vkTokenManager";

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

  app.get("/api/demo", handleDemo);

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

  return app;
}
