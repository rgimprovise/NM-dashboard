/**
 * Адаптеры для преобразования существующих типов в единую модель данных (Star-Schema)
 * 
 * Эти функции позволяют постепенно мигрировать на новую модель данных,
 * преобразуя данные из существующих API в типы fact_* и dim_*
 */

import {
  FactYandexOrder,
  FactVkAd,
  Fact1cSale,
  Fact1cMargin,
  DimProduct,
  DimCampaign,
  UnifiedOrderEvent,
} from "../types/dataModel";

// Импортируем существующие типы
import type { YandexOrder } from "../../client/services/api/yandexClient";
import type { VKStatistic } from "../../client/services/api/vkClient";
import type { OneCSalesMarginRow } from "../types/oneC";

/**
 * Преобразует YandexOrder в FactYandexOrder
 */
export function adaptYandexOrderToFact(order: YandexOrder): FactYandexOrder {
  // Извлекаем первый товар для productId и shopSku
  const firstItem = order.items?.[0];
  
  return {
    orderId: String(order.id),
    campaignId: null, // Будет заполнено при связывании с кампаниями
    productId: firstItem?.offerId ? `yandex_${firstItem.offerId}` : null,
    shopSku: firstItem?.offerId || null,
    creationDate: order.creationDate,
    status: order.status,
    quantity: firstItem?.count || 0,
    buyerPrice: firstItem?.price || 0,
    revenue: order.total || order.itemsTotal || 0,
  };
}

/**
 * Преобразует VKStatistic в FactVkAd
 */
export function adaptVkStatisticToFact(stat: VKStatistic): FactVkAd {
  return {
    date: stat.date,
    campaignId: String(stat.campaign_id),
    adGroupId: undefined, // Не доступно в текущем API
    bannerId: undefined, // Не доступно в текущем API
    impressions: stat.shows || 0,
    clicks: stat.clicks || 0,
    spend: stat.spent || 0,
  };
}

/**
 * Преобразует OneCSalesMarginRow в Fact1cSale и Fact1cMargin
 */
export function adaptOneCSalesToFacts(
  sale: OneCSalesMarginRow,
  saleId?: string
): { sale: Fact1cSale; margin: Fact1cMargin } {
  const id = saleId || `1c_${sale.documentNumber}_${sale.date}`;
  
  const factSale: Fact1cSale = {
    saleId: id,
    externalOrderId: sale.documentNumber,
    date: sale.date,
    productId: undefined, // Будет заполнено при связывании с товарами
    warehouseId: undefined, // Будет заполнено при связывании со складами
    quantity: 1, // По умолчанию, если не указано
    price: sale.revenue,
    revenue: sale.revenue,
  };
  
  const factMargin: Fact1cMargin = {
    saleId: id,
    productId: undefined, // Будет заполнено при связывании с товарами
    cost: sale.cost,
    margin: sale.margin,
  };
  
  return { sale: factSale, margin: factMargin };
}

/**
 * Создает UnifiedOrderEvent из заказа Yandex
 */
export function createUnifiedOrderFromYandex(
  order: YandexOrder,
  campaignId?: string
): UnifiedOrderEvent {
  return {
    date: order.creationDate,
    source: "yandex",
    orderId: String(order.id),
    externalId: String(order.id),
    revenue: order.total || order.itemsTotal || 0,
    margin: undefined, // Не доступно для Yandex заказов
    campaignId: campaignId || undefined,
  };
}

/**
 * Создает UnifiedOrderEvent из продажи 1C
 */
export function createUnifiedOrderFrom1C(
  sale: OneCSalesMarginRow,
  saleId?: string
): UnifiedOrderEvent {
  const id = saleId || `1c_${sale.documentNumber}_${sale.date}`;
  
  return {
    date: sale.date,
    source: "1c",
    orderId: id,
    externalId: sale.documentNumber,
    revenue: sale.revenue,
    margin: sale.margin,
    campaignId: undefined, // 1C продажи не связаны с рекламными кампаниями напрямую
  };
}

/**
 * Преобразует YandexProduct в DimProduct
 */
export function adaptYandexProductToDim(
  product: { offerId: string; name: string; category?: string },
  productId?: string
): DimProduct {
  return {
    id: productId || `yandex_${product.offerId}`,
    name: product.name,
    article: undefined,
    oneCCode: undefined,
    offerId: product.offerId,
    shopSku: product.offerId,
    categoryId: product.category ? `cat_${product.category}` : undefined,
    brand: undefined,
    collection: undefined,
  };
}

/**
 * Преобразует VKCampaign в DimCampaign
 */
export function adaptVkCampaignToDim(
  campaign: { id: number; name: string; status?: string }
): DimCampaign {
  return {
    id: `vk_${campaign.id}`,
    source: "vk",
    name: campaign.name,
    objective: undefined,
    status: campaign.status,
  };
}

/**
 * Преобразует YandexCampaign в DimCampaign
 */
export function adaptYandexCampaignToDim(
  campaign: { id: number; domain?: string; business_name?: string }
): DimCampaign {
  return {
    id: `yandex_${campaign.id}`,
    source: "yandex",
    name: campaign.business_name || campaign.domain || `Campaign ${campaign.id}`,
    objective: undefined,
    status: undefined,
  };
}

