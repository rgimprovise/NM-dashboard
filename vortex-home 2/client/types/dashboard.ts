export interface MetricCard {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
}

export interface DashboardSummary {
  period: {
    from: string;
    to: string;
    days: number;
  };
  metrics: {
    total_revenue: number;
    total_revenue_prev: number;
    total_revenue_change: number;
    total_orders: number;
    total_orders_prev: number;
    total_orders_change: number;
    ad_spend: number;
    ad_spend_prev: number;
    ad_spend_change: number;
    roas: number;
    roas_prev: number;
    roas_change: number;
    aov: number;
    aov_prev: number;
    aov_change: number;
    conversion_rate: number;
    conversion_rate_prev: number;
    conversion_rate_change: number;
    total_clicks: number;
    total_shows: number;
    ctr: number;
    cpc: number;
  };
}

export interface RevenueChartPoint {
  date: string;
  revenue: number;
  ad_spend: number;
  orders: number;
  clicks: number;
  roas: number;
}

export interface TopProduct {
  product_id: number;
  offer_id: string;
  name: string;
  category: string;
  orders: number;
  total_quantity: number;
  revenue: number;
  share: number;
  avg_price: number;
  image_url?: string;
}

export interface Region {
  region: string;
  orders: number;
  revenue: number;
  share: number;
  avg_order_value: number;
}

export interface Campaign {
  id: number;
  name: string;
  status: string;
  ad_plan_id: number;
  budget_limit: number;
  budget_limit_day: number;
  spent: number;
  created_at: string;
  statistics?: {
    shows: number;
    clicks: number;
    ctr: number;
    cpc: number;
    cpm: number;
    conversions: number;
    revenue: number;
    roas: number;
  };
}

export interface Order {
  id: number;
  campaign_id: number;
  status: string;
  creation_date: string;
  items_total: number;
  delivery_cost: number;
  total: number;
  region: string;
  items_count: number;
}

export interface Product {
  id: number;
  offer_id: string;
  name: string;
  category: string;
  price: number;
  availability: boolean;
  stock_total: number;
  stock_status: "in_stock" | "low_stock" | "out_of_stock";
  has_c1_mapping: boolean;
  c1_product?: {
    code: string;
    base_price: number;
    margin: number;
  };
  last_updated: string;
}

export interface SyncStatus {
  name: string;
  display_name: string;
  frequency: string;
  last_sync: string;
  next_sync: string;
  status: "success" | "error" | "pending";
  records_processed: number;
  duration_seconds: number;
}
