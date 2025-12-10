/**
 * Нормализация данных Yandex Market в star-schema
 * 
 * Конвертирует сырые данные из Yandex API в FactYandexOrder
 */

import { FactYandexOrder } from "../../shared/types/dataModel";

/**
 * Интерфейс сырого заказа из Yandex API
 */
interface RawYandexOrder {
  id: number;
  status: string;
  creationDate: string;
  itemsTotal?: number;
  total?: number;
  buyerTotal?: number;
  items?: Array<{
    offerId?: string;
    shopSku?: string;
    offerName?: string;
    price?: number;
    buyerPrice?: number;
    count?: number;
  }>;
  campaignId?: number;
  delivery?: {
    region?: string;
  };
}

/**
 * Преобразование сырых заказов Yandex в FactYandexOrder
 * 
 * @param rawOrders - Массив сырых заказов из Yandex API
 * @returns Массив нормализованных фактов заказов
 */
export function toFactYandexOrders(rawOrders: RawYandexOrder[]): FactYandexOrder[] {
  const facts: FactYandexOrder[] = [];

  rawOrders.forEach(order => {
    // Если в заказе несколько товаров, создаем отдельный факт для каждого
    if (order.items && order.items.length > 0) {
      order.items.forEach(item => {
        const orderId = String(order.id);
        const offerId = item.offerId || item.shopSku || "";
        const productId = offerId ? `yandex_${offerId}` : null;
        
        facts.push({
          orderId,
          campaignId: order.campaignId ? String(order.campaignId) : null,
          productId,
          shopSku: item.shopSku || item.offerId || null,
          creationDate: order.creationDate,
          status: order.status,
          quantity: item.count || 1,
          buyerPrice: item.buyerPrice || item.price || 0,
          revenue: (item.buyerPrice || item.price || 0) * (item.count || 1),
        });
      });
    } else {
      // Если нет детализации по товарам, создаем один факт на заказ
      const orderId = String(order.id);
      const total = order.buyerTotal || order.total || order.itemsTotal || 0;
      
      facts.push({
        orderId,
        campaignId: order.campaignId ? String(order.campaignId) : null,
        productId: null,
        shopSku: null,
        creationDate: order.creationDate,
        status: order.status,
        quantity: 1,
        buyerPrice: total,
        revenue: total,
      });
    }
  });

  return facts;
}

