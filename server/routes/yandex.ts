import { RequestHandler } from "express";
import { cacheManager, CACHE_TTL } from "../cache/cacheManager";
import { logInfo, logError, logWarn, logApiRequest } from "../utils/logger";

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
    const errorDetails = {
      status: response.status,
      statusText: response.statusText,
      endpoint,
      errorBody: errorText.substring(0, 500)
    };
    
    if (response.status === 400) {
      logError(`Yandex API 400 Bad Request`, new Error(errorText), errorDetails);
    } else {
      logError(`Yandex API Error ${response.status}`, new Error(errorText), errorDetails);
    }
    
    throw new Error(
      `Yandex API Error: ${response.status} ${response.statusText}`
    );
  }

  return response.json() as Promise<T>;
}

export const getOrders: RequestHandler = async (req, res) => {
  const startTime = Date.now();
  try {
    const { date_from, date_to } = req.query;

    logInfo(`Yandex getOrders request`, { 
      endpoint: "/api/yandex/orders",
      date_from: date_from as string,
      date_to: date_to as string 
    });

    const token = getYandexToken();
    if (!token) {
      logWarn("Yandex token missing", { endpoint: "/api/yandex/orders" });
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
      const duration = Date.now() - startTime;
      logApiRequest("GET", "/api/yandex/orders", duration, true, cachedData.length);
      logInfo(`Cache HIT: ${cacheKey}`, { 
        recordsCount: cachedData.length,
        cacheKey 
      });
      return res.json({
        success: true,
        data: cachedData,
        cached: true,
      });
    }
    
    logInfo(`Cache MISS: ${cacheKey}`, { 
      date_from: date_from as string,
      date_to: date_to as string,
      cacheKey 
    });

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
          
          // Yandex Market API требует формат YYYY-MM-DD для дат (ISO 8601)
          if (date_from) {
            params.fromDate = date_from as string;
          }
          if (date_to) {
            params.toDate = date_to as string;
          }

          const queryString = new URLSearchParams(params).toString();
          const endpoint = `/campaigns/${campaignId}/orders?${queryString}`;
          
          logInfo(`Fetching orders from campaign ${campaignId}`, {
            page,
            fromDate: params.fromDate,
            toDate: params.toDate,
            endpoint
          });
          
          const data = await yandexFetch<{ orders: any[]; pager: any }>(endpoint);
          
          logInfo(`Campaign ${campaignId} page ${page} response`, {
            ordersCount: data.orders?.length || 0,
            hasPager: !!data.pager,
            pagesCount: data.pager?.pagesCount || 0
          });
          
          if (data.orders && data.orders.length > 0) {
            campaignOrders += data.orders.length;
            
            // Добавляем campaignId к каждому заказу и нормализуем дату
            data.orders.forEach(order => {
              // Нормализуем формат даты для единообразия
              let normalizedDate = order.creationDate;
              if (normalizedDate && normalizedDate.includes('-') && normalizedDate.includes(' ')) {
                // Формат "DD-MM-YYYY HH:mm:ss" -> конвертируем в ISO
                const [datePart, timePart] = normalizedDate.split(' ');
                const parts = datePart.split('-');
                if (parts.length === 3 && parts[0].length === 2) {
                  // DD-MM-YYYY
                  const [day, month, year] = parts;
                  normalizedDate = `${year}-${month}-${day} ${timePart || '00:00:00'}`;
                }
              }
              
              allOrders.push({
                ...order,
                campaignId: campaignId,
                creationDate: normalizedDate,
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
        const errorMessage = error instanceof Error ? error.message : String(error);
        const is400Error = errorMessage.includes('400');
        
        logError(`Campaign ${campaignId} orders fetch failed`, error, {
          campaignId,
          date_from: date_from as string,
          date_to: date_to as string,
          is400Error
        });
        
        // Если ошибка 400 (Bad Request), возможно проблема с датами
        // Пробуем запросить без фильтра по датам для этой кампании и отфильтровать вручную
        if (is400Error && date_from && date_to) {
          try {
            logInfo(`Retrying campaign ${campaignId} without date filter due to 400 error`, { 
              campaignId,
              date_from: date_from as string,
              date_to: date_to as string
            });
            
            // Запрашиваем все заказы без фильтра по датам (с пагинацией)
            let pageNoDate = 1;
            let hasMoreNoDate = true;
            const fromDate = new Date(date_from as string);
            fromDate.setHours(0, 0, 0, 0);
            const toDate = new Date(date_to as string);
            toDate.setHours(23, 59, 59, 999);
            let totalFiltered = 0;
            
            while (hasMoreNoDate && pageNoDate <= 10) { // Увеличиваем лимит страниц для retry
              const paramsNoDate: any = {
                page: pageNoDate,
                pageSize: 50,
              };
              const queryStringNoDate = new URLSearchParams(paramsNoDate).toString();
              const endpointNoDate = `/campaigns/${campaignId}/orders?${queryStringNoDate}`;
              const dataNoDate = await yandexFetch<{ orders: any[]; pager: any }>(endpointNoDate);
              
              if (dataNoDate.orders && dataNoDate.orders.length > 0) {
                // Фильтруем заказы по датам вручную
                const filteredOrders = dataNoDate.orders.filter((order: any) => {
                  if (!order.creationDate) return false;
                  
                  // Парсим дату из разных форматов
                  let orderDate: Date;
                  try {
                    const dateStr = order.creationDate;
                    // Формат может быть: "DD-MM-YYYY HH:mm:ss" или ISO "YYYY-MM-DD" или "YYYY-MM-DDTHH:mm:ss"
                    if (dateStr.includes('T')) {
                      // ISO format
                      orderDate = new Date(dateStr);
                    } else if (dateStr.includes('-') && dateStr.length === 10) {
                      // YYYY-MM-DD
                      orderDate = new Date(dateStr);
                    } else if (dateStr.includes('-') && dateStr.includes(' ')) {
                      // DD-MM-YYYY HH:mm:ss или YYYY-MM-DD HH:mm:ss
                      const [datePart, timePart] = dateStr.split(' ');
                      const parts = datePart.split('-');
                      if (parts[0].length === 4) {
                        // YYYY-MM-DD
                        orderDate = new Date(`${datePart} ${timePart || '00:00:00'}`);
                      } else {
                        // DD-MM-YYYY
                        const [day, month, year] = parts;
                        orderDate = new Date(`${year}-${month}-${day} ${timePart || '00:00:00'}`);
                      }
                    } else {
                      orderDate = new Date(dateStr);
                    }
                  } catch {
                    return false;
                  }
                  
                  return orderDate >= fromDate && orderDate <= toDate;
                });
                
                filteredOrders.forEach((order: any) => {
                  // Нормализуем формат даты для единообразия
                  let normalizedDate = order.creationDate;
                  if (normalizedDate && normalizedDate.includes('-') && normalizedDate.includes(' ')) {
                    const [datePart, timePart] = normalizedDate.split(' ');
                    const parts = datePart.split('-');
                    if (parts.length === 3 && parts[0].length === 2) {
                      // DD-MM-YYYY
                      const [day, month, year] = parts;
                      normalizedDate = `${year}-${month}-${day} ${timePart || '00:00:00'}`;
                    }
                  }
                  
                  allOrders.push({
                    ...order,
                    campaignId: campaignId,
                    creationDate: normalizedDate,
                  });
                });
                
                totalFiltered += filteredOrders.length;
                
                // Проверяем есть ли еще страницы
                if (dataNoDate.pager && dataNoDate.pager.pagesCount && pageNoDate < dataNoDate.pager.pagesCount) {
                  pageNoDate++;
                } else {
                  hasMoreNoDate = false;
                }
              } else {
                hasMoreNoDate = false;
              }
            }
            
            if (totalFiltered > 0) {
              logInfo(`Campaign ${campaignId} retry successful`, {
                campaignId,
                filteredOrders: totalFiltered,
                pagesProcessed: pageNoDate
              });
            }
          } catch (retryError) {
            logError(`Campaign ${campaignId} retry also failed`, retryError, { campaignId });
          }
        }
      }
    }
    
    logInfo(`Yandex: всего получено ${allOrders.length} заказов из ${campaignIds.length} кампаний`, {
      recordsCount: allOrders.length,
      campaignsCount: campaignIds.length
    });
    
    // Сохраняем в кэш
    cacheManager.set(cacheKey, allOrders, CACHE_TTL.YANDEX_ORDERS);
    logInfo(`Cached: ${cacheKey}`, {
      recordsCount: allOrders.length,
      ttl: CACHE_TTL.YANDEX_ORDERS / 1000
    });
    
    const duration = Date.now() - startTime;
    logApiRequest("GET", "/api/yandex/orders", duration, false, allOrders.length);
    
    res.json({
      success: true,
      data: allOrders,
      cached: false,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logError("Yandex getOrders error", error, { 
      endpoint: "/api/yandex/orders",
      duration 
    });
    logApiRequest("GET", "/api/yandex/orders", duration, false, 0, error instanceof Error ? error.message : String(error));
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
