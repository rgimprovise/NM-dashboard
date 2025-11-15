"""
Класс для работы с Yandex Market Partner API v2
Документация: https://yandex.ru/dev/market/partner-api/doc/ru/
"""

import requests
from typing import Dict, Optional


class YandexMarketAPI:
    """
    Класс для работы с Yandex Market Partner API
    
    Формат авторизации: Api-Key: YOUR_TOKEN
    """
    
    def __init__(self, api_key: str, campaign_id: str):
        """
        Инициализация API клиента
        
        Args:
            api_key: API ключ (токен) для авторизации
            campaign_id: ID кампании (магазина)
        """
        self.base_url = "https://api.partner.market.yandex.ru"
        self.api_key = api_key
        self.campaign_id = campaign_id
        self.headers = {
            "Api-Key": api_key,
            "Content-Type": "application/json"
        }
    
    def _make_request(self, endpoint: str, method: str = "GET", 
                     params: Optional[Dict] = None, 
                     data: Optional[Dict] = None) -> Optional[Dict]:
        """
        Базовый метод для выполнения запросов к API
        
        Args:
            endpoint: URL endpoint (например, "/campaigns")
            method: HTTP метод (GET, POST)
            params: Query параметры
            data: Данные для POST запроса
            
        Returns:
            Dict с ответом API или None при ошибке
        """
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method == "GET":
                response = requests.get(url, headers=self.headers, params=params, timeout=30)
            elif method == "POST":
                response = requests.post(url, headers=self.headers, json=data, timeout=30)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.Timeout:
            print(f"⏱️  Timeout при запросе к {url}")
            return None
        except requests.exceptions.HTTPError as e:
            print(f"❌ HTTP ошибка при запросе к {url}: {e}")
            print(f"   Ответ: {e.response.text[:200]}")
            return None
        except requests.exceptions.RequestException as e:
            print(f"❌ Ошибка при запросе к {url}: {e}")
            return None
    
    # ========== КАМПАНИИ ==========
    
    def get_campaigns(self) -> Optional[Dict]:
        """Получить список всех кампаний"""
        print("📦 Получение списка кампаний...")
        return self._make_request("/campaigns")
    
    def get_campaign_info(self) -> Optional[Dict]:
        """Получить информацию о конкретной кампании"""
        print(f"📦 Получение информации о кампании {self.campaign_id}...")
        return self._make_request(f"/campaigns/{self.campaign_id}")
    
    def get_campaign_settings(self) -> Optional[Dict]:
        """Получить настройки кампании"""
        print(f"⚙️  Получение настроек кампании {self.campaign_id}...")
        return self._make_request(f"/campaigns/{self.campaign_id}/settings")
    
    # ========== ТОВАРЫ ==========
    
    def get_offer_mappings(self, page_token: Optional[str] = None, limit: int = 200) -> Optional[Dict]:
        """
        Получить список товаров (офферов) с маппингом
        
        Args:
            page_token: Токен для пагинации
            limit: Количество элементов на странице (макс 200)
        """
        print("📦 Получение списка товаров (offer mappings)...")
        params = {"limit": limit}
        if page_token:
            params["page_token"] = page_token
        return self._make_request(f"/campaigns/{self.campaign_id}/offer-mappings", params=params)
    
    def get_offers(self, page_token: Optional[str] = None, limit: int = 200) -> Optional[Dict]:
        """Получить список офферов"""
        print("📦 Получение списка офферов...")
        params = {"limit": limit}
        if page_token:
            params["page_token"] = page_token
        return self._make_request(f"/campaigns/{self.campaign_id}/offers", params=params)
    
    def get_offer_cards(self) -> Optional[Dict]:
        """Получить карточки товаров"""
        print("🃏 Получение карточек товаров...")
        return self._make_request(f"/campaigns/{self.campaign_id}/offer-cards")
    
    # ========== ЗАКАЗЫ ==========
    
    def get_orders(self, status: Optional[str] = None, 
                   from_date: Optional[str] = None, 
                   to_date: Optional[str] = None, 
                   page: int = 1, 
                   page_size: int = 50) -> Optional[Dict]:
        """
        Получить список заказов
        
        Args:
            status: Статус заказа (PROCESSING, DELIVERY, DELIVERED, CANCELLED, etc.)
            from_date: Дата начала (YYYY-MM-DD)
            to_date: Дата окончания (YYYY-MM-DD)
            page: Номер страницы
            page_size: Размер страницы (макс 50)
        """
        print(f"📋 Получение заказов (статус: {status or 'все'})...")
        params = {
            "page": page,
            "pageSize": page_size
        }
        if status:
            params["status"] = status
        if from_date:
            params["fromDate"] = from_date
        if to_date:
            params["toDate"] = to_date
        return self._make_request(f"/campaigns/{self.campaign_id}/orders", params=params)
    
    def get_order_details(self, order_id: str) -> Optional[Dict]:
        """Получить детальную информацию о заказе"""
        print(f"🔍 Получение деталей заказа {order_id}...")
        return self._make_request(f"/campaigns/{self.campaign_id}/orders/{order_id}")
    
    # ========== ОСТАТКИ И ЦЕНЫ ==========
    
    def get_stocks(self, page_token: Optional[str] = None, limit: int = 200) -> Optional[Dict]:
        """Получить остатки товаров"""
        print("📊 Получение остатков товаров...")
        params = {"limit": limit}
        if page_token:
            params["page_token"] = page_token
        return self._make_request(f"/campaigns/{self.campaign_id}/offers/stocks", params=params)
    
    def get_prices(self, page_token: Optional[str] = None, limit: int = 200) -> Optional[Dict]:
        """Получить цены на товары"""
        print("💰 Получение цен на товары...")
        params = {"limit": limit}
        if page_token:
            params["page_token"] = page_token
        return self._make_request(f"/campaigns/{self.campaign_id}/offer-prices", params=params)
    
    # ========== СТАТИСТИКА ==========
    
    def get_order_stats(self, date_from: str, date_to: str) -> Optional[Dict]:
        """
        Получить статистику по заказам
        
        Args:
            date_from: Дата начала (YYYY-MM-DD)
            date_to: Дата окончания (YYYY-MM-DD)
        """
        print(f"📈 Получение статистики по заказам с {date_from} по {date_to}...")
        params = {
            "dateFrom": date_from,
            "dateTo": date_to
        }
        return self._make_request(f"/campaigns/{self.campaign_id}/stats/orders", params=params)
    
    # ========== ОТЗЫВЫ ==========
    
    def get_feedbacks(self, page: int = 1, page_size: int = 20) -> Optional[Dict]:
        """Получить отзывы о товарах"""
        print("⭐ Получение отзывов о товарах...")
        params = {
            "page": page,
            "pageSize": page_size
        }
        return self._make_request(f"/campaigns/{self.campaign_id}/feedback", params=params)
    
    # ========== ВОЗВРАТЫ ==========
    
    def get_returns(self, page: int = 1, page_size: int = 50) -> Optional[Dict]:
        """Получить информацию о возвратах"""
        print("🔄 Получение информации о возвратах...")
        params = {
            "page": page,
            "pageSize": page_size
        }
        return self._make_request(f"/campaigns/{self.campaign_id}/returns", params=params)
    
    # ========== СКЛАДЫ ==========
    
    def get_warehouses(self) -> Optional[Dict]:
        """Получить список складов"""
        print("🏢 Получение списка складов...")
        return self._make_request(f"/campaigns/{self.campaign_id}/warehouses")
    
    # ========== РЕГИОНЫ И ДОСТАВКА ==========
    
    def get_delivery_services(self) -> Optional[Dict]:
        """Получить список служб доставки"""
        print("🚚 Получение списка служб доставки...")
        return self._make_request(f"/campaigns/{self.campaign_id}/delivery/services")
    
    def get_regions(self) -> Optional[Dict]:
        """Получить список регионов доставки"""
        print("🗺️  Получение списка регионов...")
        return self._make_request("/regions")

