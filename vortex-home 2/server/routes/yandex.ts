import { RequestHandler } from "express";
import { cacheManager, CACHE_TTL } from "../cache/cacheManager";

const YANDEX_BASE_URL = "https://api.partner.market.yandex.ru";

// Функции для получения переменных окружения (читаются динамически, после загрузки dotenv)
function getYandexToken(): string | undefined {
  return process.env.YANDEX_TOKEN;
}

function getYandexBusinessId(): string | undefined {
  return process.env.YANDEX_BUSINESS_ID;
}

function getYandexCampaignIds(): string[] {
  return (process.env.YANDEX_CAMPAIGN_IDS || "21621656")
    .split(",")
    .map(id => id.trim());
}

interface YandexResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function yandexFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getYandexToken();
  if (!token) {
    throw new Error("Yandex token not configured");
  }
  
  const url = `${YANDEX_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      "Api-Key": token,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Yandex API Error ${response.status}: ${errorText}`);
    throw new Error(
      `Yandex API Error: ${response.status} ${response.statusText}`
    );
  }

  return response.json() as Promise<T>;
}

export const getOrders: RequestHandler = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;

    const token = getYandexToken();
    if (!token) {
      console.warn("Yandex token missing - using mock data");
      return res.json({
        success: true,
        data: [],
      });
    }

    // Генерируем уникальный ключ кэша (включает все параметры для дедупликации)
    const cacheKey = `yandex:orders:all:${date_from || 'nodate'}:${date_to || 'nodate'}`;
    
    // Проверяем кэш
    const cachedData = cacheManager.get<any[]>(cacheKey);
    if (cachedData) {
      console.log(`✅ Cache HIT: ${cacheKey} (${cachedData.length} orders)`);
      return res.json({
        success: true,
        data: cachedData,
        cached: true,
      });
    }
    
    console.log(`❌ Cache MISS: ${cacheKey}`);

    // Запрашиваем заказы со ВСЕХ кампаний с пагинацией
    const allOrders: any[] = [];
    const campaignIds = getYandexCampaignIds();
    
    for (const campaignId of campaignIds) {
      try {
        let page = 1;
        let hasMore = true;
        let campaignOrders = 0;
        
        // Пагинация: получаем все страницы (макс 5 страниц = 250 заказов на кампанию)
        while (hasMore && page <= 5) {
          const params: any = {
            page: page,
            pageSize: 50,  // Максимум по API
          };
          
          if (date_from) params.fromDate = date_from;
          if (date_to) params.toDate = date_to;

          const queryString = new URLSearchParams(params).toString();
          const endpoint = `/campaigns/${campaignId}/orders?${queryString}`;
          
          const data = await yandexFetch<{ orders: any[]; pager: any }>(endpoint);
          
          if (data.orders && data.orders.length > 0) {
            campaignOrders += data.orders.length;
            
            // Добавляем campaignId к каждому заказу
            data.orders.forEach(order => {
              allOrders.push({
                ...order,
                campaignId: campaignId,
              });
            });
            
            // Проверяем есть ли еще страницы
            if (data.pager && data.pager.pagesCount && page < data.pager.pagesCount) {
              page++;
            } else {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        }
        
        if (campaignOrders > 0) {
          console.log(`✅ Campaign ${campaignId}: ${campaignOrders} заказов`);
        }
      } catch (error) {
        console.warn(`Campaign ${campaignId} orders fetch failed:`, error);
      }
    }
    
    console.log(`✅ Yandex: всего получено ${allOrders.length} заказов из ${campaignIds.length} кампаний`);
    
    // Сохраняем в кэш
    cacheManager.set(cacheKey, allOrders, CACHE_TTL.YANDEX_ORDERS);
    console.log(`💾 Cached: ${cacheKey} (${allOrders.length} orders, TTL: ${CACHE_TTL.YANDEX_ORDERS / 1000}s)`);
    
    res.json({
      success: true,
      data: allOrders,
      cached: false,
    });
  } catch (error) {
    console.error("Yandex getOrders error:", error);
    res.json({
      success: true,
      data: [],
    });
  }
};

export const getProducts: RequestHandler = async (req, res) => {
  try {
    const token = getYandexToken();
    if (!token) {
      console.warn("Yandex token missing - using mock data");
      return res.json({
        success: true,
        data: [],
      });
    }

    // Ключ кэша для продуктов (без дат, т.к. меняются редко)
    const cacheKey = `yandex:products:all`;
    
    const cachedData = cacheManager.get<any[]>(cacheKey);
    if (cachedData) {
      console.log(`✅ Cache HIT: ${cacheKey} (${cachedData.length} products)`);
      return res.json({
        success: true,
        data: cachedData,
        cached: true,
      });
    }
    
    console.log(`❌ Cache MISS: ${cacheKey}`);

    const allProducts: any[] = [];
    const campaignIds = getYandexCampaignIds();
    
    // Получаем товары со ВСЕХ кампаний
    for (const campaignId of campaignIds) {
      try {
        const stocksEndpoint = `/campaigns/${campaignId}/offers/stocks`;
        
        const stocksData = await yandexFetch<{ result: { warehouses: any[] } }>(stocksEndpoint, {
          method: "POST",
          body: JSON.stringify({ limit: 200 }),
        });
        
        const warehouses = stocksData?.result?.warehouses || [];
        
        warehouses.forEach((warehouse: any) => {
          const offers = warehouse.offers || [];
          
          offers.forEach((offer: any) => {
            allProducts.push({
              offerId: offer.offerId,
              name: offer.offerId,
              campaignId: campaignId,
              category: "",
              price: 0,
              available: (offer.stocks && offer.stocks.length > 0),
              stocks: offer.stocks || [],
              warehouseId: warehouse.warehouseId,
            });
          });
        });
        
        console.log(`✅ Campaign ${campaignId}: ${warehouses.length} складов`);
      } catch (error) {
        console.warn(`Campaign ${campaignId} stocks fetch failed:`, error);
      }
    }
    
    console.log(`✅ Yandex: всего получено ${allProducts.length} товаров из ${campaignIds.length} кампаний`);
    
    // Сохраняем в кэш
    cacheManager.set(cacheKey, allProducts, CACHE_TTL.YANDEX_PRODUCTS);
    console.log(`💾 Cached: ${cacheKey} (${allProducts.length} products, TTL: ${CACHE_TTL.YANDEX_PRODUCTS / 1000}s)`);
    
    res.json({
      success: true,
      data: allProducts,
      cached: false,
    });
  } catch (error) {
    console.error("Yandex getProducts error:", error);
    res.json({
      success: true,
      data: [],
    });
  }
};

export const getStocks: RequestHandler = async (req, res) => {
  try {
    const token = getYandexToken();
    if (!token) {
      console.warn("Yandex token missing - using mock data");
      return res.json({
        success: true,
        data: [],
      });
    }

    const cacheKey = `yandex:stocks:all`;
    const cachedData = cacheManager.get<any[]>(cacheKey);
    
    if (cachedData) {
      console.log(`✅ Cache HIT: ${cacheKey}`);
      return res.json({
        success: true,
        data: cachedData,
        cached: true,
      });
    }

    const allStocks: any[] = [];
    const campaignIds = getYandexCampaignIds();
    
    for (const campaignId of campaignIds) {
      try {
        const endpoint = `/campaigns/${campaignId}/offers/stocks`;
        const data = await yandexFetch<{ result: { warehouses: any[] } }>(endpoint, {
          method: "POST",
          body: JSON.stringify({ limit: 200 }),
        });
        
        const warehouses = data?.result?.warehouses || [];
        
        warehouses.forEach((warehouse: any) => {
          const offers = warehouse.offers || [];
          offers.forEach((offer: any) => {
            allStocks.push({
              offerId: offer.offerId,
              campaignId: campaignId,
              warehouseId: warehouse.warehouseId,
              stocks: offer.stocks || [],
              name: offer.offerId,
              available: (offer.stocks && offer.stocks.length > 0),
            });
          });
        });
      } catch (error) {
        console.warn(`Campaign ${campaignId} stocks fetch failed:`, error);
      }
    }
    
    console.log(`✅ Yandex: получено ${allStocks.length} товаров с остатками`);
    
    cacheManager.set(cacheKey, allStocks, CACHE_TTL.YANDEX_STOCKS);
    
    res.json({
      success: true,
      data: allStocks,
      cached: false,
    });
  } catch (error) {
    console.error("Yandex getStocks error:", error);
    res.json({
      success: true,
      data: [],
    });
  }
};

export const getOrderStats: RequestHandler = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;

    const token = getYandexToken();
    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Yandex API configuration missing",
      });
    }

    const allStats: any[] = [];
    const campaignIds = getYandexCampaignIds();
    
    for (const campaignId of campaignIds) {
      try {
        const endpoint = `/campaigns/${campaignId}/stats/orders`;
        
        const data = await yandexFetch<{ result: any }>(endpoint, {
          method: "POST",
          body: JSON.stringify({
            dateFrom: date_from,
            dateTo: date_to,
          }),
        });
        
        if (data.result) {
          allStats.push({
            campaignId: campaignId,
            stats: data.result,
          });
        }
      } catch (error) {
        console.warn(`Campaign ${campaignId} stats fetch failed:`, error);
      }
    }

    res.json({
      success: true,
      data: allStats,
    });
  } catch (error) {
    console.error("Yandex getOrderStats error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Новый endpoint для получения информации о кампаниях
export const getCampaigns: RequestHandler = async (req, res) => {
  try {
    const token = getYandexToken();
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Yandex API configuration missing",
      });
    }

    const cacheKey = `yandex:campaigns:all`;
    const cachedData = cacheManager.get<any[]>(cacheKey);
    
    if (cachedData) {
      console.log(`✅ Cache HIT: ${cacheKey}`);
      return res.json({
        success: true,
        data: cachedData,
        cached: true,
      });
    }

    const campaigns: any[] = [];
    const campaignIds = getYandexCampaignIds();
    
    for (const campaignId of campaignIds) {
      try {
        const endpoint = `/campaigns/${campaignId}`;
        const data = await yandexFetch<{ campaign: any }>(endpoint);
        
        if (data.campaign) {
          campaigns.push({
            id: campaignId,
            ...data.campaign,
          });
        }
      } catch (error) {
        console.warn(`Campaign ${campaignId} info fetch failed:`, error);
      }
    }
    
    console.log(`✅ Yandex: получено ${campaigns.length} кампаний`);

    cacheManager.set(cacheKey, campaigns, CACHE_TTL.YANDEX_CAMPAIGNS);

    res.json({
      success: true,
      data: campaigns,
      cached: false,
    });
  } catch (error) {
    console.error("Yandex getCampaigns error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
