/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Dashboard Summary DTO
 * Used by both backend and frontend for dashboard KPI
 */
export interface DashboardSummary {
  period: {
    from: string; // YYYY-MM-DD
    to: string;   // YYYY-MM-DD
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
