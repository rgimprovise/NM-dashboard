"""
Скрипт для сбора данных из Yandex Market API
Для интеграции с Power BI Dashboard
"""

import sys
import os
from datetime import datetime, timedelta

# Добавляем корневую папку в путь для импорта
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.yandex_market_api import YandexMarketAPI
from core.data_exporter import DataExporter


def collect_all_yandex_data(api: YandexMarketAPI, output_dir: str = "data/yandex_data", 
                            export_formats: list = ['json', 'csv', 'excel']):
    """
    Собрать все доступные данные из Yandex Market API
    
    Args:
        api: Экземпляр YandexMarketAPI
        output_dir: Директория для сохранения данных
        export_formats: Список форматов экспорта ['json', 'csv', 'excel']
    """
    print("\n" + "="*70)
    print("СБОР ДАННЫХ ИЗ YANDEX MARKET API")
    print("="*70)
    print()
    
    exporter = DataExporter()
    exporter.create_directory(output_dir)
    
    # Словарь для сохранения всех данных для Excel
    all_data = {}
    
    # ========== КАМПАНИИ ==========
    print("📦 Кампании и настройки...")
    
    campaigns = api.get_campaigns()
    if campaigns:
        if 'json' in export_formats:
            exporter.save_to_json(campaigns, f"{output_dir}/campaigns.json")
        if 'csv' in export_formats:
            exporter.save_to_csv(campaigns.get('campaigns', []), f"{output_dir}/campaigns.csv")
        if 'excel' in export_formats and campaigns.get('campaigns'):
            all_data['Campaigns'] = campaigns.get('campaigns', [])
    
    campaign_info = api.get_campaign_info()
    if campaign_info:
        if 'json' in export_formats:
            exporter.save_to_json(campaign_info, f"{output_dir}/campaign_info.json")
        if 'excel' in export_formats:
            all_data['Campaign_Info'] = [campaign_info]
    
    campaign_settings = api.get_campaign_settings()
    if campaign_settings:
        if 'json' in export_formats:
            exporter.save_to_json(campaign_settings, f"{output_dir}/campaign_settings.json")
        if 'excel' in export_formats:
            all_data['Settings'] = [campaign_settings]
    
    print()
    
    # ========== ТОВАРЫ ==========
    print("📦 Товары и карточки...")
    
    offer_mappings = api.get_offer_mappings()
    if offer_mappings:
        if 'json' in export_formats:
            exporter.save_to_json(offer_mappings, f"{output_dir}/offer_mappings.json")
        if 'csv' in export_formats:
            exporter.save_to_csv(offer_mappings.get('result', {}).get('offerMappings', []), 
                                f"{output_dir}/offer_mappings.csv")
        if 'excel' in export_formats:
            all_data['Offer_Mappings'] = offer_mappings.get('result', {}).get('offerMappings', [])
    
    offers = api.get_offers()
    if offers:
        if 'json' in export_formats:
            exporter.save_to_json(offers, f"{output_dir}/offers.json")
        if 'csv' in export_formats:
            exporter.save_to_csv(offers.get('result', {}).get('offers', []), 
                                f"{output_dir}/offers.csv")
        if 'excel' in export_formats:
            all_data['Offers'] = offers.get('result', {}).get('offers', [])
    
    offer_cards = api.get_offer_cards()
    if offer_cards:
        if 'json' in export_formats:
            exporter.save_to_json(offer_cards, f"{output_dir}/offer_cards.json")
        if 'excel' in export_formats:
            all_data['Offer_Cards'] = offer_cards.get('result', {}).get('offerCards', [])
    
    print()
    
    # ========== ЦЕНЫ И ОСТАТКИ ==========
    print("💰 Цены и остатки...")
    
    prices = api.get_prices()
    if prices:
        if 'json' in export_formats:
            exporter.save_to_json(prices, f"{output_dir}/prices.json")
        if 'csv' in export_formats:
            exporter.save_to_csv(prices.get('result', {}).get('offers', []), 
                                f"{output_dir}/prices.csv")
        if 'excel' in export_formats:
            all_data['Prices'] = prices.get('result', {}).get('offers', [])
    
    stocks = api.get_stocks()
    if stocks:
        if 'json' in export_formats:
            exporter.save_to_json(stocks, f"{output_dir}/stocks.json")
        if 'csv' in export_formats:
            exporter.save_to_csv(stocks.get('result', {}).get('warehouses', []), 
                                f"{output_dir}/stocks.csv")
        if 'excel' in export_formats:
            all_data['Stocks'] = stocks.get('result', {}).get('warehouses', [])
    
    print()
    
    # ========== ЗАКАЗЫ ==========
    print("📋 Заказы...")
    
    # Заказы за последние 30 дней
    date_to = datetime.now().strftime("%Y-%m-%d")
    date_from = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    
    orders_recent = api.get_orders(from_date=date_from, to_date=date_to, page_size=50)
    if orders_recent:
        if 'json' in export_formats:
            exporter.save_to_json(orders_recent, f"{output_dir}/orders_recent_30days.json")
        orders_list = orders_recent.get('orders', [])
        if orders_list:
            if 'csv' in export_formats:
                exporter.save_to_csv(orders_list, f"{output_dir}/orders_recent.csv")
            if 'excel' in export_formats:
                all_data['Orders_Recent'] = orders_list
    
    # Заказы по статусам
    for status in ['DELIVERED', 'PROCESSING', 'CANCELLED']:
        orders_status = api.get_orders(status=status, page_size=50)
        if orders_status:
            if 'json' in export_formats:
                exporter.save_to_json(orders_status, f"{output_dir}/orders_{status.lower()}.json")
            orders_list = orders_status.get('orders', [])
            if orders_list and 'excel' in export_formats:
                all_data[f'Orders_{status}'] = orders_list
    
    print()
    
    # ========== СТАТИСТИКА ==========
    print("📈 Статистика...")
    
    order_stats = api.get_order_stats(date_from=date_from, date_to=date_to)
    if order_stats:
        exporter.save_to_json(order_stats, f"{output_dir}/order_stats.json")
    
    print()
    
    # ========== ОТЗЫВЫ ==========
    print("⭐ Отзывы...")
    
    feedbacks = api.get_feedbacks()
    if feedbacks:
        exporter.save_to_json(feedbacks, f"{output_dir}/feedbacks.json")
    
    print()
    
    # ========== ВОЗВРАТЫ ==========
    print("🔄 Возвраты...")
    
    returns = api.get_returns()
    if returns:
        exporter.save_to_json(returns, f"{output_dir}/returns.json")
    
    print()
    
    # ========== СКЛАДЫ ==========
    print("🏢 Склады и доставка...")
    
    warehouses = api.get_warehouses()
    if warehouses:
        exporter.save_to_json(warehouses, f"{output_dir}/warehouses.json")
    
    delivery_services = api.get_delivery_services()
    if delivery_services:
        exporter.save_to_json(delivery_services, f"{output_dir}/delivery_services.json")
    
    regions = api.get_regions()
    if regions:
        exporter.save_to_json(regions, f"{output_dir}/regions.json")
    
    # ========== СОЗДАНИЕ ОБЩЕГО EXCEL ФАЙЛА ==========
    if 'excel' in export_formats and all_data:
        print()
        print("📊 Создание общего Excel файла...")
        exporter.save_to_excel(all_data, f"{output_dir}/yandex_market_data_full.xlsx")
    
    print()
    print("="*70)
    print(f"✅ Сбор данных завершен! Все файлы сохранены в: {output_dir}/")
    print("="*70)
    print()
    if 'json' in export_formats:
        print("✓ JSON файлы - для Power BI и программной обработки")
    if 'csv' in export_formats:
        print("✓ CSV файлы - для Excel и анализа данных")
    if 'excel' in export_formats:
        print("✓ XLSX файл - полный набор данных на разных листах")
    print()


def main():
    """Основная функция"""
    
    print("\n" + "="*70)
    print("СБОРЩИК ДАННЫХ YANDEX MARKET API ДЛЯ POWER BI")
    print("="*70)
    print()
    
    # Загрузка конфигурации
    try:
        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from config import YANDEX_OAUTH_TOKEN, YANDEX_CAMPAIGN_ID
        
        print("✅ Конфигурация загружена")
        print(f"   API Key: {YANDEX_OAUTH_TOKEN[:30]}...")
        print(f"   Campaign ID: {YANDEX_CAMPAIGN_ID}")
        print()
        
    except ImportError:
        print("❌ Файл config.py не найден!")
        print("\nВыполните: python3 get_yandex_campaign.py")
        return 1
    
    # Проверка токенов
    if "YOUR_" in YANDEX_OAUTH_TOKEN or "YOUR_" in YANDEX_CAMPAIGN_ID:
        print("❌ Yandex токены не настроены!")
        print("\nВыполните: python3 get_yandex_campaign.py")
        return 1
    
    # Создание API
    try:
        api = YandexMarketAPI(YANDEX_OAUTH_TOKEN, YANDEX_CAMPAIGN_ID)
        print("✅ Yandex Market API инициализирован")
        print()
    except Exception as e:
        print(f"❌ Ошибка инициализации: {e}")
        return 1
    
    # Сбор данных
    try:
        output_dir = "data/yandex_data"
        collect_all_yandex_data(api, output_dir=output_dir)
        
        # Показываем итоги
        print()
        print("="*70)
        print("📊 ИТОГИ СБОРА ДАННЫХ")
        print("="*70)
        print()
        
        if os.path.exists(output_dir):
            files = sorted([f for f in os.listdir(output_dir) if f.endswith('.json')])
            print(f"Создано файлов: {len(files)}")
            print()
            print("Собранные данные:")
            
            for file in files:
                file_path = os.path.join(output_dir, file)
                file_size = os.path.getsize(file_path) / 1024
                print(f"  • {file} ({file_size:.1f} KB)")
        
        print()
        print("="*70)
        print("СЛЕДУЮЩИЕ ШАГИ:")
        print("="*70)
        print()
        print("1. Импортируйте JSON файлы в Power BI Desktop:")
        print("   Получить данные → JSON → Выберите файл")
        print()
        print("2. Ключевые файлы для анализа:")
        print("   • campaigns.json - информация о магазине")
        print("   • offers.json - список товаров")
        print("   • orders_all.json - все заказы")
        print("   • orders_delivered.json - доставленные заказы")
        print("   • order_stats.json - статистика заказов")
        print("   • prices.json - цены на товары")
        print("   • stocks.json - остатки товаров")
        print("   • feedbacks.json - отзывы покупателей")
        print()
        
        return 0
        
    except KeyboardInterrupt:
        print("\n\n❌ Прервано пользователем")
        return 1
    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())

