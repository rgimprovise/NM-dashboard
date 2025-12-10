export interface YandexCampaign {
  id: number;
  domain: string;
  business_id: number;
  business_name: string;
  created_at: string;
  updated_at: string;
}

export interface YandexOrder {
  id: number;
  status: string;
  creationDate: string;
  itemsTotal: number;
  total: number;
  deliveryCost: number;
  items: Array<{
    offerId: string;
    offerName: string;
    price: number;
    count: number;
  }>;
  delivery?: {
    region: string;
  };
}

export interface YandexProduct {
  offerId: string;
  name: string;
  category: string;
  vendor?: string;
  price: number;
  availability: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class YandexMarketAPI {
  private baseUrl = "/api/yandex";

  private async fetchAPI<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(
        `API Error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as ApiResponse<T>;
    
    if (!data.success) {
      throw new Error(data.error || "Unknown error");
    }

    return data.data as T;
  }

  async getCampaigns(): Promise<YandexCampaign[]> {
    try {
      const data = await this.fetchAPI<YandexCampaign[]>("/campaigns");
      return data || [];
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      return [];
    }
  }

  async getOrders(dateFrom?: string, dateTo?: string): Promise<YandexOrder[]> {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);

      const endpoint = `/orders${params.toString() ? "?" + params.toString() : ""}`;
      const data = await this.fetchAPI<YandexOrder[]>(endpoint);
      return data || [];
    } catch (error) {
      console.error("Error fetching orders:", error);
      return [];
    }
  }

  async getProducts(): Promise<YandexProduct[]> {
    try {
      const data = await this.fetchAPI<YandexProduct[]>("/products");
      return data || [];
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  }

  async getOrderStats(dateFrom: string, dateTo: string) {
    try {
      const params = new URLSearchParams({
        date_from: dateFrom,
        date_to: dateTo,
      });
      const endpoint = `/stats/orders?${params.toString()}`;
      const data = await this.fetchAPI<any>(endpoint);
      return data;
    } catch (error) {
      console.error("Error fetching order stats:", error);
      return null;
    }
  }
}

export const yandexAPI = new YandexMarketAPI();
