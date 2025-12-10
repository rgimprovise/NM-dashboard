import { RequestHandler } from "express";
import { ensureValidToken } from "../utils/vkTokenManager";
import { cacheManager, CACHE_TTL } from "../cache/cacheManager";
import { logInfo, logError, logWarn } from "../utils/logger";

const VK_BASE_URL = "https://ads.vk.com/api/v2";

// Функция для получения VK_ACCOUNT_ID (читается динамически)
function getVKAccountId(): string | undefined {
  return process.env.VK_ACCOUNT_ID;
}

async function vkFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  addAccountId: boolean = false
): Promise<T> {
  // Получаем актуальный токен (автообновится если истек)
  const token = await ensureValidToken();
  
  if (!token) {
    throw new Error("VK token not available");
  }
  
  let url = `${VK_BASE_URL}${endpoint}`;
  
  // Добавляем account_id если требуется и он не присутствует в endpoint
  if (addAccountId && !endpoint.includes("account_id")) {
    const accountId = getVKAccountId();
    if (accountId) {
      const separator = endpoint.includes("?") ? "&" : "?";
      url = `${VK_BASE_URL}${endpoint}${separator}account_id=${accountId}`;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`VK API Error ${response.status}:`, errorText);
    throw new Error(`VK API Error: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
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

    const accountId = getVKAccountId();
    const params = new URLSearchParams();
    if (ad_plan_id) params.append("ad_plan_id", ad_plan_id as string);
    if (accountId) params.append("account_id", accountId);
    params.append("limit", "100");

    const endpoint = `/campaigns.json?${params.toString()}`;
    logInfo(`VK: Fetching campaigns`, { accountId, ad_plan_id, endpoint });
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

    const accountId = getVKAccountId();
    const params = new URLSearchParams();
    if (campaign_id) params.append("campaign_id", campaign_id as string);
    if (accountId) params.append("account_id", accountId);
    params.append("limit", "100");

    const endpoint = `/ad_groups.json?${params.toString()}`;
    logInfo(`VK: Fetching ad_groups`, { accountId, campaign_id, endpoint });
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

    const accountId = getVKAccountId();
    const params = new URLSearchParams();
    if (campaign_id) params.append("campaign_id", campaign_id as string);
    if (ad_group_id) params.append("ad_group_id", ad_group_id as string);
    if (accountId) params.append("account_id", accountId);
    params.append("limit", "200");

    const endpoint = `/banners.json?${params.toString()}`;
    logInfo(`VK: Fetching banners`, { accountId, campaign_id, ad_group_id, endpoint });
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
    
    // Получаем campaigns для статистики (статистика по campaigns, а не по ad_groups)
    const campaignsCacheKey = `vk:campaigns:all`;
    let campaigns = cacheManager.get<any[]>(campaignsCacheKey);
    
    if (!campaigns) {
      // Получаем campaigns с account_id
      const accountId = getVKAccountId();
      const campaignsParams = new URLSearchParams({ limit: "200" });
      if (accountId) {
        campaignsParams.append("account_id", accountId);
      }
      const campaignsEndpoint = `/campaigns.json?${campaignsParams.toString()}`;
      logInfo(`VK: Fetching campaigns for statistics`, { accountId, endpoint: campaignsEndpoint });
      const campaignsData = await vkFetch<{ items: any[] }>(campaignsEndpoint);
      campaigns = campaignsData.items || [];
      cacheManager.set(campaignsCacheKey, campaigns, CACHE_TTL.VK_CAMPAIGNS);
      logInfo(`VK: получено ${campaigns.length} campaigns`, { accountId, count: campaigns.length });
    }
    
    if (campaigns.length === 0) {
      return res.json({
        success: true,
        data: [],
        campaignStats: {},
        total: {
          shows: 0,
          clicks: 0,
          spent: 0,
          ctr: 0,
          cpc: 0,
        },
      });
    }

    // Собираем ID campaigns
    const campaignIds = campaigns.map(c => c.id).join(",");
    
    // Формируем запрос статистики ПО КАМПАНИЯМ (не по ad_groups!)
    const accountId = getVKAccountId();
    const params = new URLSearchParams({ 
      id: campaignIds, 
      metrics: "base" 
    });
    
    // Добавляем account_id если доступен (может быть обязательным)
    if (accountId) {
      params.append("account_id", accountId);
    }
    
    if (date_from) params.append("date_from", date_from as string);
    if (date_to) params.append("date_to", date_to as string);
    
    // Выбираем endpoint: day.json если указаны даты, иначе summary.json
    // ИСПОЛЬЗУЕМ /statistics/campaigns/ вместо /statistics/ad_groups/
    const statsEndpoint = date_from && date_to ? "day" : "summary";
    const endpoint = `/statistics/campaigns/${statsEndpoint}.json?${params.toString()}`;
    
    logInfo(`VK Statistics request`, {
      endpoint,
      accountId,
      campaignsCount: campaigns.length,
      dateFrom: date_from,
      dateTo: date_to,
    });
    
    let statsData: any;
    try {
      statsData = await vkFetch<{
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
      
      logInfo(`VK Statistics response received`, {
        hasItems: !!statsData.items,
        itemsCount: statsData.items?.length || 0,
        hasTotal: !!statsData.total,
        totalShows: statsData.total?.base?.shows || 0,
        totalClicks: statsData.total?.base?.clicks || 0,
        totalSpent: statsData.total?.base?.spent || "0",
        totalCtr: statsData.total?.base?.ctr || 0,
        totalCpc: statsData.total?.base?.cpc || "0",
      });
    } catch (error) {
      logError("VK Statistics fetch failed", error, {
        endpoint,
        accountId,
        adGroupsCount: adGroups.length,
        dateFrom: date_from,
        dateTo: date_to,
      });
      throw error;
    }

    // Форматируем ответ
    // VK API возвращает items с rows (по дням) для каждого campaign
    // Преобразуем в плоский массив по дням для фронтенда
    const dailyStatsMap = new Map<string, { shows: number; clicks: number; spent: number }>();
    
    // Также создаем мапу для агрегации статистики по campaign_id
    const campaignStatsMap = new Map<number, { shows: number; clicks: number; spent: number }>();
    
    if (statsData.items && Array.isArray(statsData.items)) {
      statsData.items.forEach((item: any) => {
        const campaignId = item.id; // ID campaign из ответа (теперь это campaign, а не ad_group!)
        
        if (item.rows && Array.isArray(item.rows)) {
          item.rows.forEach((row: any) => {
            const date = row.date || new Date().toISOString().split("T")[0];
            const base = row.base || {};
            
            // Агрегируем по дням (для таблицы динамики)
            const existing = dailyStatsMap.get(date) || { shows: 0, clicks: 0, spent: 0 };
            dailyStatsMap.set(date, {
              shows: existing.shows + (base.shows || 0),
              clicks: existing.clicks + (base.clicks || 0),
              spent: existing.spent + parseFloat(base.spent || "0"),
            });
            
            // Агрегируем по campaign_id (для кампаний) - теперь campaignId всегда есть!
            if (campaignId) {
              const existingCampaign = campaignStatsMap.get(campaignId) || { shows: 0, clicks: 0, spent: 0 };
              campaignStatsMap.set(campaignId, {
                shows: existingCampaign.shows + (base.shows || 0),
                clicks: existingCampaign.clicks + (base.clicks || 0),
                spent: existingCampaign.spent + parseFloat(base.spent || "0"),
              });
            }
          });
        }
      });
    }
    
    // Преобразуем в массив объектов для фронтенда
    const dailyStats = Array.from(dailyStatsMap.entries())
      .map(([date, data]) => ({
        date,
        shows: data.shows,
        clicks: data.clicks,
        spent: data.spent,
        ctr: data.shows > 0 ? (data.clicks / data.shows) * 100 : 0,
        cpc: data.clicks > 0 ? data.spent / data.clicks : 0,
        cpm: data.shows > 0 ? (data.spent / data.shows) * 1000 : 0,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Преобразуем статистику по кампаниям в объект для фронтенда
    const campaignStats: Record<number, { shows: number; clicks: number; spent: number }> = {};
    campaignStatsMap.forEach((stats, campaignId) => {
      campaignStats[campaignId] = stats;
    });
    
    const result = {
      data: dailyStats, // Плоский массив по дням для фронтенда
      campaignStats: campaignStats, // Статистика по campaign_id для привязки к кампаниям
      total: {
        shows: statsData.total?.base?.shows || 0,
        clicks: statsData.total?.base?.clicks || 0,
        spent: parseFloat(statsData.total?.base?.spent || "0"),
        ctr: statsData.total?.base?.ctr || 0,
        cpc: parseFloat(statsData.total?.base?.cpc || "0"),
        cpm: parseFloat(statsData.total?.base?.cpm || "0"),
        goals: statsData.total?.base?.vk?.goals || statsData.total?.base?.goals || 0,
      },
    };
    
    logInfo(`VK Statistics processed`, {
      dailyStatsCount: dailyStats.length,
      campaignStatsCount: Object.keys(campaignStats).length,
      sampleCampaignIds: Object.keys(campaignStats).slice(0, 5)
    });
    
    // Сохраняем в кэш
    cacheManager.set(cacheKey, result, CACHE_TTL.VK_STATISTICS);
    logInfo(`VK Statistics cached`, {
      cacheKey,
      ttl: CACHE_TTL.VK_STATISTICS / 1000,
      totalShows: result.total.shows,
      totalClicks: result.total.clicks,
      totalSpent: result.total.spent,
    });

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
