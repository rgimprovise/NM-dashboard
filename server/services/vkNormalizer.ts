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
    
    // Для данных по дням campaign_id может отсутствовать (это агрегированные данные)
    // Используем фиктивный campaign_id для агрегированных данных
    const campaignId = stat.campaign_id ? String(stat.campaign_id) : "aggregated";

    facts.push({
      date,
      campaignId,
      adGroupId: stat.ad_group_id ? String(stat.ad_group_id) : undefined,
      bannerId: stat.banner_id ? String(stat.banner_id) : undefined,
      impressions: stat.shows || stat.impressions || 0,
      clicks: stat.clicks || 0,
      spend: typeof stat.spent === 'number' ? stat.spent : (typeof stat.spend === 'number' ? stat.spend : parseFloat(String(stat.spent || stat.spend || 0))),
    });
  });

  return facts;
}

