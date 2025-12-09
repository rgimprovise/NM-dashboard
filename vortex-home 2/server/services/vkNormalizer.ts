/**
 * Нормализация данных VK Ads в star-schema
 * 
 * Конвертирует сырые данные из VK API в FactVkAd
 */

import { FactVkAd } from "../../shared/types/dataModel";

/**
 * Интерфейс сырой статистики из VK API
 */
interface RawVKStatistic {
  date?: string;
  day?: string;
  campaign_id?: number;
  ad_group_id?: number;
  banner_id?: number;
  shows?: number;
  impressions?: number;
  clicks?: number;
  spent?: number;
  spend?: number;
}

/**
 * Преобразование сырой статистики VK в FactVkAd
 * 
 * @param rawStats - Массив сырой статистики из VK API
 * @returns Массив нормализованных фактов рекламы
 */
export function toFactVkAds(rawStats: RawVKStatistic[]): FactVkAd[] {
  const facts: FactVkAd[] = [];

  rawStats.forEach(stat => {
    const date = stat.date || stat.day || new Date().toISOString().split("T")[0];
    
    if (!stat.campaign_id) {
      console.warn("VK statistic missing campaign_id, skipping");
      return;
    }

    facts.push({
      date,
      campaignId: String(stat.campaign_id),
      adGroupId: stat.ad_group_id ? String(stat.ad_group_id) : undefined,
      bannerId: stat.banner_id ? String(stat.banner_id) : undefined,
      impressions: stat.shows || stat.impressions || 0,
      clicks: stat.clicks || 0,
      spend: stat.spent || stat.spend || 0,
    });
  });

  return facts;
}

