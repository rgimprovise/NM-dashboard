import { RequestHandler } from "express";
import { ensureValidToken } from "../utils/vkTokenManager";
import { cacheManager, CACHE_TTL } from "../cache/cacheManager";

const VK_BASE_URL = "https://ads.vk.com/api/v2";
const VK_ACCOUNT_ID = process.env.VK_ACCOUNT_ID;

async function vkFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Получаем актуальный токен (автообновится если истек)
  const token = await ensureValidToken();
  
  if (!token) {
    throw new Error("VK token not available");
  }
  
  const url = `${VK_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`VK API Error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export const getAdPlans: RequestHandler = async (req, res) => {
  try {
    const token = await ensureValidToken();
    if (!token) {
      console.warn("VK config missing - using mock data");
      return res.json({
        success: true,
        data: [],
      });
    }

    const cacheKey = `vk:adplans:all`;
    const cachedData = cacheManager.get<any[]>(cacheKey);
    
    if (cachedData) {
      console.log(`✅ Cache HIT: ${cacheKey}`);
      return res.json({
        success: true,
        data: cachedData,
        cached: true,
      });
    }

    try {
      const data = await vkFetch<{ items: any[] }>("/ad_plans.json");
      const adPlans = data.items || [];
      
      cacheManager.set(cacheKey, adPlans, CACHE_TTL.VK_AD_PLANS);
      
      res.json({
        success: true,
        data: adPlans,
        cached: false,
      });
    } catch (error) {
      console.warn("VK API fetch failed, returning empty data:", error);
      res.json({
        success: true,
        data: [],
      });
    }
  } catch (error) {
    console.error("VK getAdPlans error:", error);
    res.json({
      success: true,
      data: [],
    });
  }
};

export const getCampaigns: RequestHandler = async (req, res) => {
  try {
    const token = await ensureValidToken();
    if (!token) {
      return res.status(400).json({
        success: false,
        error: "VK API configuration missing",
      });
    }

    const { ad_plan_id } = req.query;

    const cacheKey = `vk:campaigns:${ad_plan_id || 'all'}`;
    const cachedData = cacheManager.get<any[]>(cacheKey);
    
    if (cachedData) {
      console.log(`✅ Cache HIT: ${cacheKey}`);
      return res.json({
        success: true,
        data: cachedData,
        cached: true,
      });
    }

    const params = new URLSearchParams();
    if (ad_plan_id) params.append("ad_plan_id", ad_plan_id as string);
    params.append("limit", "100");

    const endpoint = `/campaigns.json?${params.toString()}`;
    const data = await vkFetch<{ items: any[] }>(endpoint);
    const campaigns = data.items || [];

    cacheManager.set(cacheKey, campaigns, CACHE_TTL.VK_CAMPAIGNS);

    res.json({
      success: true,
      data: campaigns,
      cached: false,
    });
  } catch (error) {
    console.error("VK getCampaigns error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getAdGroups: RequestHandler = async (req, res) => {
  try {
    const token = await ensureValidToken();
    if (!token) {
      return res.status(400).json({
        success: false,
        error: "VK API configuration missing",
      });
    }

    const { campaign_id } = req.query;

    const cacheKey = `vk:adgroups:${campaign_id || 'all'}`;
    const cachedData = cacheManager.get<any[]>(cacheKey);
    
    if (cachedData) {
      console.log(`✅ Cache HIT: ${cacheKey}`);
      return res.json({
        success: true,
        data: cachedData,
        cached: true,
      });
    }

    const params = new URLSearchParams();
    if (campaign_id) params.append("campaign_id", campaign_id as string);
    params.append("limit", "100");

    const endpoint = `/ad_groups.json?${params.toString()}`;
    const data = await vkFetch<{ items: any[] }>(endpoint);
    const adGroups = data.items || [];

    cacheManager.set(cacheKey, adGroups, CACHE_TTL.VK_AD_GROUPS);

    res.json({
      success: true,
      data: adGroups,
      cached: false,
    });
  } catch (error) {
    console.error("VK getAdGroups error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getBanners: RequestHandler = async (req, res) => {
  try {
    const token = await ensureValidToken();
    if (!token) {
      return res.status(400).json({
        success: false,
        error: "VK API configuration missing",
      });
    }

    const { campaign_id, ad_group_id } = req.query;

    const cacheKey = `vk:banners:${campaign_id || 'all'}:${ad_group_id || 'all'}`;
    const cachedData = cacheManager.get<any[]>(cacheKey);
    
    if (cachedData) {
      console.log(`✅ Cache HIT: ${cacheKey}`);
      return res.json({
        success: true,
        data: cachedData,
        cached: true,
      });
    }

    const params = new URLSearchParams();
    if (campaign_id) params.append("campaign_id", campaign_id as string);
    if (ad_group_id) params.append("ad_group_id", ad_group_id as string);
    params.append("limit", "200");

    const endpoint = `/banners.json?${params.toString()}`;
    const data = await vkFetch<{ items: any[] }>(endpoint);
    const banners = data.items || [];

    cacheManager.set(cacheKey, banners, CACHE_TTL.VK_BANNERS);

    res.json({
      success: true,
      data: banners,
      cached: false,
    });
  } catch (error) {
    console.error("VK getBanners error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getStatistics: RequestHandler = async (req, res) => {
  try {
    const token = await ensureValidToken();
    if (!token) {
      return res.status(400).json({
        success: false,
        error: "VK API configuration missing",
      });
    }

    const { date_from, date_to } = req.query;
    
    // Ключ кэша для статистики (включает даты для дедупликации)
    const cacheKey = `vk:stats:${date_from || 'nodate'}:${date_to || 'nodate'}`;
    const cachedData = cacheManager.get<any>(cacheKey);
    
    if (cachedData) {
      console.log(`✅ Cache HIT: ${cacheKey}`);
      return res.json({
        success: true,
        ...cachedData,
        cached: true,
      });
    }
    
    console.log(`❌ Cache MISS: ${cacheKey}`);
    
    // Получаем все ad_groups (может быть закэшировано отдельно)
    const adGroupsCacheKey = `vk:adgroups:all`;
    let adGroups = cacheManager.get<any[]>(adGroupsCacheKey);
    
    if (!adGroups) {
      const adGroupsData = await vkFetch<{ items: any[] }>("/ad_groups.json?limit=200");
      adGroups = adGroupsData.items || [];
      cacheManager.set(adGroupsCacheKey, adGroups, CACHE_TTL.VK_AD_GROUPS);
    }
    
    if (adGroups.length === 0) {
      return res.json({
        success: true,
        data: [],
        total: {
          shows: 0,
          clicks: 0,
          spent: 0,
          ctr: 0,
          cpc: 0,
        },
      });
    }

    // Собираем ID ad_groups
    const adGroupIds = adGroups.map(g => g.id).join(",");
    
    // Формируем запрос статистики
    const params = new URLSearchParams({ id: adGroupIds, metrics: "base" });
    if (date_from) params.append("date_from", date_from as string);
    if (date_to) params.append("date_to", date_to as string);
    
    // Выбираем endpoint: day.json если указаны даты, иначе summary.json
    const statsEndpoint = date_from && date_to ? "day" : "summary";
    const endpoint = `/statistics/ad_groups/${statsEndpoint}.json?${params.toString()}`;
    
    const statsData = await vkFetch<{
      items?: any[];
      total: {
        base: {
          shows: number;
          clicks: number;
          spent: string;
          ctr: number;
          cpc: string;
          cpm: string;
          goals: number;
          vk?: {
            goals: number;
            cpa: string;
            cr: number;
          };
        };
      };
    }>(endpoint);

    // Форматируем ответ
    const result = {
      data: statsData.items || [],
      total: {
        shows: statsData.total.base.shows,
        clicks: statsData.total.base.clicks,
        spent: parseFloat(statsData.total.base.spent),
        ctr: statsData.total.base.ctr,
        cpc: parseFloat(statsData.total.base.cpc),
        cpm: parseFloat(statsData.total.base.cpm),
        goals: statsData.total.base.vk?.goals || statsData.total.base.goals,
      },
    };
    
    // Сохраняем в кэш
    cacheManager.set(cacheKey, result, CACHE_TTL.VK_STATISTICS);
    console.log(`💾 Cached VK Statistics: ${cacheKey} (TTL: ${CACHE_TTL.VK_STATISTICS / 1000}s)`);

    res.json({
      success: true,
      ...result,
      cached: false,
    });
  } catch (error) {
    console.error("VK getStatistics error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
