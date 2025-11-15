export interface VKCampaign {
  id: number;
  name: string;
  status: string;
  budget_limit: number;
  budget_limit_day: number;
  spent: number;
  created_at: string;
  updated_at?: string;
}

export interface VKStatistic {
  date: string;
  campaign_id: number;
  shows: number;
  clicks: number;
  spent: number;
  conversions?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
}

export interface VKAdPlan {
  id: number;
  name: string;
  status: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class VKAdsAPI {
  private baseUrl = "/api/vk";

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
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as ApiResponse<T>;

    if (!data.success) {
      throw new Error(data.error || "Unknown error");
    }

    return data.data as T;
  }

  async getAdPlans(): Promise<VKAdPlan[]> {
    try {
      const data = await this.fetchAPI<VKAdPlan[]>("/ad-plans");
      return data || [];
    } catch (error) {
      console.error("Error fetching ad plans:", error);
      return [];
    }
  }

  async getCampaigns(adPlanId?: string): Promise<VKCampaign[]> {
    try {
      const params = new URLSearchParams();
      if (adPlanId) params.append("ad_plan_id", adPlanId);

      const endpoint = `/campaigns${params.toString() ? "?" + params.toString() : ""}`;
      const data = await this.fetchAPI<VKCampaign[]>(endpoint);
      return data || [];
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      return [];
    }
  }

  async getStatistics(
    dateFrom: string,
    dateTo: string,
    campaignIds?: number[]
  ): Promise<VKStatistic[]> {
    try {
      const body: any = {
        date_from: dateFrom,
        date_to: dateTo,
        dimensions: ["date", "campaign_id"],
        metrics: ["shows", "clicks", "spent", "conversions"],
      };

      if (campaignIds && campaignIds.length > 0) {
        body.filter = {
          campaign_ids: campaignIds,
        };
      }

      const data = await this.fetchAPI<VKStatistic[]>("/statistics", {
        method: "POST",
        body: JSON.stringify(body),
      });

      return data || [];
    } catch (error) {
      console.error("Error fetching statistics:", error);
      return [];
    }
  }

  async getCampaignStats(campaignId: number, dateFrom: string, dateTo: string) {
    try {
      const stats = await this.getStatistics(dateFrom, dateTo, [campaignId]);
      return stats.filter((s) => s.campaign_id === campaignId);
    } catch (error) {
      console.error("Error fetching campaign stats:", error);
      return [];
    }
  }
}

export const vkAPI = new VKAdsAPI();
