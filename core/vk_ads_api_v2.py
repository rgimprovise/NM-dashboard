"""
Класс для работы с VK Ads API v2 (ads.vk.com)
Документация: https://ads.vk.com/doc/api/info
"""

import requests
import json
from typing import Dict, List, Optional
from datetime import datetime


class VKAdsAPIv2:
    """
    Класс для работы с VK Ads API v2
    Использует новый API ads.vk.com с OAuth2 Bearer токенами
    """
    
    def __init__(self, access_token: str, account_id: str = None):
        self.base_url = "https://ads.vk.com/api/v2"
        self.access_token = access_token
        self.account_id = account_id
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
    
    def _make_request(self, endpoint: str, method: str = "GET", 
                     params: Optional[Dict] = None, data: Optional[Dict] = None) -> Optional[Dict]:
        """Базовый метод для выполнения запросов к API"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method == "GET":
                response = requests.get(url, headers=self.headers, params=params, timeout=30)
            elif method == "POST":
                response = requests.post(url, headers=self.headers, json=data, timeout=30)
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Ошибка API (код {response.status_code}): {response.text}")
                return None
                
        except requests.exceptions.Timeout:
            print(f"Превышено время ожидания при запросе к {url}")
            return None
        except requests.exceptions.RequestException as e:
            print(f"Ошибка при запросе к {url}: {e}")
            return None
    
    # ========== РЕКЛАМНЫЕ ПЛАНЫ (AD PLANS) ==========
    
    def get_ad_plans(self) -> Optional[Dict]:
        """
        Получить список рекламных кабинетов (ad plans)
        Endpoint: GET /ad_plans.json
        """
        print("Получение списка рекламных кабинетов...")
        return self._make_request("/ad_plans.json")
    
    def get_ad_plan_by_id(self, ad_plan_id: str) -> Optional[Dict]:
        """
        Получить информацию о конкретном рекламном кабинете
        Endpoint: GET /ad_plans/{id}.json
        """
        print(f"Получение информации о кабинете {ad_plan_id}...")
        return self._make_request(f"/ad_plans/{ad_plan_id}.json")
    
    # ========== КАМПАНИИ (CAMPAIGNS) ==========
    
    def get_campaigns(self, ad_plan_id: str = None) -> Optional[Dict]:
        """
        Получить список кампаний
        Endpoint: GET /campaigns.json
        """
        print("Получение списка кампаний...")
        params = {}
        if ad_plan_id:
            params["ad_plan_id"] = ad_plan_id
        elif self.account_id:
            params["ad_plan_id"] = self.account_id
        
        return self._make_request("/campaigns.json", params=params)
    
    def get_campaign_by_id(self, campaign_id: str) -> Optional[Dict]:
        """
        Получить информацию о конкретной кампании
        Endpoint: GET /campaigns/{id}.json
        """
        print(f"Получение информации о кампании {campaign_id}...")
        return self._make_request(f"/campaigns/{campaign_id}.json")
    
    # ========== ГРУППЫ ОБЪЯВЛЕНИЙ (AD GROUPS) ==========
    
    def get_ad_groups(self, campaign_id: str = None) -> Optional[Dict]:
        """
        Получить список групп объявлений
        Endpoint: GET /ad_groups.json
        """
        print("Получение списка групп объявлений...")
        params = {}
        if campaign_id:
            params["campaign_id"] = campaign_id
        
        return self._make_request("/ad_groups.json", params=params)
    
    def get_ad_group_by_id(self, ad_group_id: str) -> Optional[Dict]:
        """
        Получить информацию о конкретной группе объявлений
        Endpoint: GET /ad_groups/{id}.json
        """
        print(f"Получение информации о группе объявлений {ad_group_id}...")
        return self._make_request(f"/ad_groups/{ad_group_id}.json")
    
    # ========== ОБЪЯВЛЕНИЯ (ADS) ==========
    
    def get_ads(self, ad_group_id: str = None, campaign_id: str = None) -> Optional[Dict]:
        """
        Получить список объявлений
        Endpoint: GET /ads.json
        """
        print("Получение списка объявлений...")
        params = {}
        if ad_group_id:
            params["ad_group_id"] = ad_group_id
        if campaign_id:
            params["campaign_id"] = campaign_id
        
        return self._make_request("/ads.json", params=params)
    
    def get_ad_by_id(self, ad_id: str) -> Optional[Dict]:
        """
        Получить информацию о конкретном объявлении
        Endpoint: GET /ads/{id}.json
        """
        print(f"Получение информации об объявлении {ad_id}...")
        return self._make_request(f"/ads/{ad_id}.json")
    
    # ========== СТАТИСТИКА (STATISTICS) ==========
    
    def get_statistics(self, metrics: List[str] = None, 
                      date_from: str = None, date_to: str = None,
                      dimensions: List[str] = None,
                      filters: Dict = None) -> Optional[Dict]:
        """
        Получить статистику
        Endpoint: POST /statistics.json
        
        metrics: список метрик, например ["shows", "clicks", "spent", "conversions"]
        date_from/date_to: формат YYYY-MM-DD
        dimensions: список измерений, например ["date", "campaign_id", "banner_id"]
        """
        print("Получение статистики...")
        
        if not metrics:
            metrics = ["shows", "clicks", "spent", "cpm", "cpc", "ctr"]
        
        if not dimensions:
            dimensions = ["date"]
        
        data = {
            "metrics": metrics,
            "dimensions": dimensions
        }
        
        if date_from:
            data["date_from"] = date_from
        if date_to:
            data["date_to"] = date_to
        if filters:
            data["filters"] = filters
        
        return self._make_request("/statistics.json", method="POST", data=data)
    
    def get_statistics_by_ads(self, ad_ids: List[str] = None,
                             date_from: str = None, date_to: str = None,
                             metrics: List[str] = None) -> Optional[Dict]:
        """
        Получить статистику по конкретным объявлениям
        
        ad_ids: список ID объявлений
        date_from/date_to: период
        metrics: список метрик
        """
        print("Получение статистики по объявлениям...")
        
        if not metrics:
            metrics = ["shows", "clicks", "spent", "conversions", "ctr", "cpc", "cpm"]
        
        filters = {}
        if ad_ids:
            filters["banner_id"] = {"in": ad_ids}
        
        return self.get_statistics(
            metrics=metrics,
            dimensions=["banner_id", "date"],
            date_from=date_from,
            date_to=date_to,
            filters=filters if filters else None
        )
    
    def get_statistics_by_campaigns(self, campaign_ids: List[str] = None,
                                   date_from: str = None, date_to: str = None,
                                   metrics: List[str] = None) -> Optional[Dict]:
        """
        Получить статистику по кампаниям
        
        campaign_ids: список ID кампаний
        date_from/date_to: период
        metrics: список метрик
        """
        print("Получение статистики по кампаниям...")
        
        if not metrics:
            metrics = ["shows", "clicks", "spent", "conversions", "ctr", "cpc", "cpm", "goals"]
        
        filters = {}
        if campaign_ids:
            filters["campaign_id"] = {"in": campaign_ids}
        
        return self.get_statistics(
            metrics=metrics,
            dimensions=["campaign_id", "date"],
            date_from=date_from,
            date_to=date_to,
            filters=filters if filters else None
        )
    
    def get_statistics_by_groups(self, group_ids: List[str] = None,
                                date_from: str = None, date_to: str = None,
                                metrics: List[str] = None) -> Optional[Dict]:
        """
        Получить статистику по группам объявлений
        
        group_ids: список ID групп
        date_from/date_to: период
        metrics: список метрик
        """
        print("Получение статистики по группам объявлений...")
        
        if not metrics:
            metrics = ["shows", "clicks", "spent", "conversions", "ctr", "cpc"]
        
        filters = {}
        if group_ids:
            filters["ad_group_id"] = {"in": group_ids}
        
        return self.get_statistics(
            metrics=metrics,
            dimensions=["ad_group_id", "date"],
            date_from=date_from,
            date_to=date_to,
            filters=filters if filters else None
        )
    
    def get_statistics_with_demographics(self, date_from: str = None, 
                                        date_to: str = None,
                                        campaign_ids: List[str] = None) -> Optional[Dict]:
        """
        Получить статистику с разбивкой по демографии (пол, возраст)
        
        date_from/date_to: период
        campaign_ids: список ID кампаний
        """
        print("Получение статистики с демографией...")
        
        metrics = ["shows", "clicks", "spent", "ctr", "cpc"]
        dimensions = ["sex", "age", "date"]
        
        filters = {}
        if campaign_ids:
            filters["campaign_id"] = {"in": campaign_ids}
        
        return self.get_statistics(
            metrics=metrics,
            dimensions=dimensions,
            date_from=date_from,
            date_to=date_to,
            filters=filters if filters else None
        )
    
    def get_statistics_with_geo(self, date_from: str = None, 
                               date_to: str = None,
                               campaign_ids: List[str] = None) -> Optional[Dict]:
        """
        Получить статистику с разбивкой по географии (регионы)
        
        date_from/date_to: период
        campaign_ids: список ID кампаний
        """
        print("Получение статистики по регионам...")
        
        metrics = ["shows", "clicks", "spent", "ctr", "cpc"]
        dimensions = ["uniq_geo_id", "date"]
        
        filters = {}
        if campaign_ids:
            filters["campaign_id"] = {"in": campaign_ids}
        
        return self.get_statistics(
            metrics=metrics,
            dimensions=dimensions,
            date_from=date_from,
            date_to=date_to,
            filters=filters if filters else None
        )
    
    # ========== АУДИТОРИИ (AUDIENCES) ==========
    
    def get_audiences(self) -> Optional[Dict]:
        """
        Получить список аудиторий
        Endpoint: GET /audiences.json
        """
        print("Получение списка аудиторий...")
        return self._make_request("/audiences.json")
    
    def get_audience_by_id(self, audience_id: str) -> Optional[Dict]:
        """
        Получить информацию о конкретной аудитории
        Endpoint: GET /audiences/{id}.json
        """
        print(f"Получение информации об аудитории {audience_id}...")
        return self._make_request(f"/audiences/{audience_id}.json")
    
    # ========== ПИКСЕЛИ (PIXELS) ==========
    
    def get_pixels(self) -> Optional[Dict]:
        """
        Получить список пикселей
        Endpoint: GET /pixels.json
        """
        print("Получение списка пикселей...")
        return self._make_request("/pixels.json")
    
    # ========== ТАРГЕТИНГ (TARGETING) ==========
    
    def get_ad_targeting(self, ad_id: str) -> Optional[Dict]:
        """
        Получить настройки таргетинга для объявления
        
        ad_id: ID объявления
        """
        print(f"Получение таргетинга для объявления {ad_id}...")
        ad_info = self.get_ad_by_id(ad_id)
        
        if ad_info and 'targeting' in ad_info:
            return ad_info.get('targeting')
        
        return ad_info
    
    def get_campaign_targeting(self, campaign_id: str) -> Optional[Dict]:
        """
        Получить настройки таргетинга для кампании
        
        campaign_id: ID кампании
        """
        print(f"Получение таргетинга для кампании {campaign_id}...")
        campaign_info = self.get_campaign_by_id(campaign_id)
        
        if campaign_info and 'targeting' in campaign_info:
            return campaign_info.get('targeting')
        
        return campaign_info
    
    # ========== ПОЛЬЗОВАТЕЛИ (USERS) ==========
    
    def get_current_user(self) -> Optional[Dict]:
        """
        Получить информацию о текущем пользователе
        Endpoint: GET /users/me.json
        """
        print("Получение информации о текущем пользователе...")
        return self._make_request("/users/me.json")
    
    # ========== БЮДЖЕТ ==========
    
    def get_budget_info(self, ad_plan_id: str = None) -> Optional[Dict]:
        """
        Получить информацию о бюджете кабинета
        """
        if not ad_plan_id:
            ad_plan_id = self.account_id
        
        if not ad_plan_id:
            print("Не указан ID рекламного кабинета")
            return None
        
        print(f"Получение информации о бюджете кабинета {ad_plan_id}...")
        return self.get_ad_plan_by_id(ad_plan_id)
    
    def get_campaign_budget(self, campaign_id: str) -> Optional[Dict]:
        """
        Получить информацию о бюджете кампании
        
        campaign_id: ID кампании
        """
        print(f"Получение бюджета кампании {campaign_id}...")
        campaign = self.get_campaign_by_id(campaign_id)
        
        if campaign:
            return {
                "campaign_id": campaign_id,
                "budget_limit": campaign.get('budget_limit'),
                "budget_limit_day": campaign.get('budget_limit_day'),
                "spent": campaign.get('spent'),
                "status": campaign.get('status')
            }
        
        return None
    
    # ========== СПРАВОЧНИКИ (DICTIONARIES) ==========
    
    def get_categories(self) -> Optional[Dict]:
        """
        Получить список категорий/тематик
        """
        print("Получение списка категорий...")
        return self._make_request("/content_categories.json")
    
    def get_geo_regions(self) -> Optional[Dict]:
        """
        Получить справочник регионов для таргетинга
        """
        print("Получение справочника регионов...")
        # В API v2 это может быть частью targeting options
        return self._make_request("/targeting/geo.json")
    
    # ========== КЛИЕНТЫ И АГЕНТСТВА ==========
    
    def get_clients(self) -> Optional[Dict]:
        """
        Получить список клиентов (для агентских кабинетов)
        """
        print("Получение списка клиентов...")
        return self._make_request("/clients.json")
    
    # ========== ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ ==========
    
    def get_all_campaigns_with_stats(self, date_from: str = None, date_to: str = None) -> Optional[Dict]:
        """
        Получить все кампании со статистикой
        """
        campaigns = self.get_campaigns()
        
        if not campaigns or 'items' not in campaigns:
            return None
        
        # Получаем статистику для всех кампаний
        campaign_ids = [str(c.get('id')) for c in campaigns['items'] if c.get('id')]
        
        if not campaign_ids:
            return campaigns
        
        # Запрашиваем статистику
        stats = self.get_statistics(
            metrics=["shows", "clicks", "spent", "conversions", "ctr", "cpc"],
            dimensions=["campaign_id", "date"],
            date_from=date_from,
            date_to=date_to,
            filters={"campaign_id": {"in": campaign_ids[:50]}}  # Ограничиваем 50 кампаниями
        )
        
        return {
            "campaigns": campaigns,
            "statistics": stats
        }
    
    def get_comprehensive_statistics(self, date_from: str = None, date_to: str = None,
                                    campaign_ids: List[str] = None) -> Dict:
        """
        Получить комплексную статистику:
        - По кампаниям
        - По объявлениям
        - С демографией
        - С географией
        
        Возвращает словарь со всеми типами статистики
        """
        print("\n📊 Получение комплексной статистики...")
        
        result = {
            "period": {
                "from": date_from,
                "to": date_to
            },
            "stats": {}
        }
        
        # 1. Статистика по кампаниям
        stats_campaigns = self.get_statistics_by_campaigns(
            campaign_ids=campaign_ids,
            date_from=date_from,
            date_to=date_to
        )
        if stats_campaigns:
            result["stats"]["by_campaigns"] = stats_campaigns
        
        # 2. Статистика с демографией
        stats_demo = self.get_statistics_with_demographics(
            date_from=date_from,
            date_to=date_to,
            campaign_ids=campaign_ids
        )
        if stats_demo:
            result["stats"]["demographics"] = stats_demo
        
        # 3. Статистика с географией
        stats_geo = self.get_statistics_with_geo(
            date_from=date_from,
            date_to=date_to,
            campaign_ids=campaign_ids
        )
        if stats_geo:
            result["stats"]["geography"] = stats_geo
        
        return result


def test_vk_api():
    """Тестирование VK Ads API v2"""
    from config import VK_ACCESS_TOKEN, VK_ACCOUNT_ID
    
    api = VKAdsAPIv2(VK_ACCESS_TOKEN, VK_ACCOUNT_ID)
    
    print("\n=== ТЕСТ VK ADS API V2 ===\n")
    
    # Тест 1: Получение кабинетов
    ad_plans = api.get_ad_plans()
    if ad_plans and 'items' in ad_plans:
        print(f"✅ Найдено кабинетов: {len(ad_plans['items'])}")
    else:
        print("❌ Не удалось получить кабинеты")
    
    # Тест 2: Получение кампаний
    campaigns = api.get_campaigns()
    if campaigns and 'items' in campaigns:
        print(f"✅ Найдено кампаний: {len(campaigns['items'])}")
    else:
        print("❌ Не удалось получить кампании")
    
    # Тест 3: Получение текущего пользователя
    user = api.get_current_user()
    if user:
        print(f"✅ Текущий пользователь получен")
    else:
        print("❌ Не удалось получить информацию о пользователе")


if __name__ == "__main__":
    test_vk_api()

