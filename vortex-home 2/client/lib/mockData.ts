import {
  DashboardSummary,
  RevenueChartPoint,
  TopProduct,
  Region,
  Campaign,
  Order,
  Product,
  SyncStatus,
} from "@/types/dashboard";

export const mockDashboardSummary: DashboardSummary = {
  period: {
    from: "2025-01-01",
    to: "2025-01-01",
    days: 1,
  },
  metrics: {
    total_revenue: 0,
    total_revenue_prev: 0,
    total_revenue_change: 0,
    total_orders: 0,
    total_orders_prev: 0,
    total_orders_change: 0,
    ad_spend: 0,
    ad_spend_prev: 0,
    ad_spend_change: 0,
    roas: 0,
    roas_prev: 0,
    roas_change: 0,
    aov: 0,
    aov_prev: 0,
    aov_change: 0,
    conversion_rate: 0,
    conversion_rate_prev: 0,
    conversion_rate_change: 0,
    total_clicks: 0,
    total_shows: 0,
    ctr: 0,
    cpc: 0,
  },
};

export const mockRevenueChartData: RevenueChartPoint[] = [{
  date: "2025-01-01",
  revenue: 0,
  ad_spend: 0,
  orders: 0,
  clicks: 0,
  roas: 0,
}];

export const mockTopProducts: TopProduct[] = [{
  product_id: 1,
  offer_id: "TEST-001",
  name: "Тестовый товар",
  category: "Тест",
  orders: 0,
  total_quantity: 0,
  revenue: 0,
  share: 0,
  avg_price: 0,
}];

export const mockRegions: Region[] = [{
  region: "Тест",
  orders: 0,
  revenue: 0,
  share: 0,
  avg_order_value: 0,
}];

export const mockCampaigns: Campaign[] = [{
  id: 1,
  name: "Тестовая кампания",
  status: "active",
  ad_plan_id: 1,
  budget_limit: 0,
  budget_limit_day: 0,
  spent: 0,
  created_at: "2025-01-01T00:00:00Z",
  statistics: {
    shows: 0,
    clicks: 0,
    ctr: 0,
    cpc: 0,
    cpm: 0,
    conversions: 0,
    revenue: 0,
    roas: 0,
  },
}];

export const mockOrders: Order[] = [{
  id: 1,
  campaign_id: 1,
  status: "PROCESSING",
  creation_date: "2025-01-01T00:00:00Z",
  items_total: 0,
  delivery_cost: 0,
  total: 0,
  region: "Тест",
  items_count: 0,
}];

export const mockProducts: Product[] = [{
  id: 1,
  offer_id: "TEST-001",
  name: "Тестовый товар",
  category: "Тест",
  price: 0,
  availability: false,
  stock_total: 0,
  stock_status: "out_of_stock",
  has_c1_mapping: false,
  last_updated: "2025-01-01T00:00:00Z",
}];

export const mockSyncStatus: SyncStatus[] = [
  {
    name: "yandex_orders",
    display_name: "Яндекс.Маркет - Заказы",
    frequency: "Каждый час",
    last_sync: "2025-01-01T00:00:00Z",
    next_sync: "2025-01-01T00:00:00Z",
    status: "pending",
    records_processed: 0,
    duration_seconds: 0,
  },
  {
    name: "yandex_products",
    display_name: "Яндекс.Маркет - Товары",
    frequency: "Каждые 4 часа",
    last_sync: "2025-01-01T00:00:00Z",
    next_sync: "2025-01-01T00:00:00Z",
    status: "pending",
    records_processed: 0,
    duration_seconds: 0,
  },
  {
    name: "vk_statistics",
    display_name: "VK Ads - Статистика",
    frequency: "Каждый час",
    last_sync: "2025-01-01T00:00:00Z",
    next_sync: "2025-01-01T00:00:00Z",
    status: "pending",
    records_processed: 0,
    duration_seconds: 0,
  },
];
