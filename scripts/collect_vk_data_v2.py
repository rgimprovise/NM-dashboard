"""
Скрипт для сбора данных из VK Ads API v2 (ads.vk.com)
Для интеграции с Power BI Azure Dashboard
"""

import sys
import os
from datetime import datetime, timedelta

# Добавляем корневую папку в путь для импорта
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.vk_ads_api_v2 import VKAdsAPIv2
from core.data_exporter import DataExporter


def collect_all_vk_data(api: VKAdsAPIv2, output_dir: str = "data/vk_data",
                        export_formats: list = ['json', 'csv', 'excel']):
    """
    Собрать все доступные данные из VK Ads API v2
    
    Args:
        api: Экземпляр VKAdsAPIv2
        output_dir: Директория для сохранения данных
        export_formats: Список форматов экспорта ['json', 'csv', 'excel']
    """
    print("\n" + "="*70)
    print("СБОР ДАННЫХ ИЗ VK ADS API V2")
    print("="*70)
    print()
    
    exporter = DataExporter()
    exporter.create_directory(output_dir)
    
    # Словарь для сохранения всех данных для Excel
    all_data = {}
    
    # ========== РЕКЛАМНЫЕ КАБИНЕТЫ ==========
    print("📁 Рекламные кабинеты...")
    ad_plans = api.get_ad_plans()
    if ad_plans:
        if 'json' in export_formats:
            exporter.save_to_json(ad_plans, f"{output_dir}/ad_plans.json")
        if 'csv' in export_formats:
            exporter.save_to_csv(ad_plans.get('items', []), f"{output_dir}/ad_plans.csv")
        if 'excel' in export_formats:
            all_data['Ad_Plans'] = ad_plans.get('items', [])
        
        # Получаем детальную информацию о текущем кабинете
        if api.account_id:
            ad_plan_info = api.get_ad_plan_by_id(api.account_id)
            if ad_plan_info:
                if 'json' in export_formats:
                    exporter.save_to_json(ad_plan_info, f"{output_dir}/ad_plan_current.json")
                if 'excel' in export_formats:
                    all_data['Current_Plan'] = [ad_plan_info]
    
    print()
    
    # ========== КАМПАНИИ ==========
    print("📊 Кампании...")
    campaigns = api.get_campaigns()
    campaign_ids = []
    
    if campaigns and 'items' in campaigns:
        if 'json' in export_formats:
            exporter.save_to_json(campaigns, f"{output_dir}/campaigns.json")
        if 'csv' in export_formats:
            exporter.save_to_csv(campaigns.get('items', []), f"{output_dir}/campaigns.csv")
        if 'excel' in export_formats:
            all_data['Campaigns'] = campaigns.get('items', [])
        campaign_ids = [str(c.get('id')) for c in campaigns['items'] if c.get('id')]
        print(f"  Найдено кампаний: {len(campaign_ids)}")
    
    print()
    
    # ========== ГРУППЫ ОБЪЯВЛЕНИЙ ==========
    print("📋 Группы объявлений...")
    all_ad_groups = []
    
    # Получаем группы объявлений для каждой кампании
    for campaign_id in campaign_ids[:10]:  # Ограничиваем первыми 10 кампаниями
        ad_groups = api.get_ad_groups(campaign_id=campaign_id)
        if ad_groups and 'items' in ad_groups:
            all_ad_groups.extend(ad_groups['items'])
    
    if all_ad_groups:
        if 'json' in export_formats:
            exporter.save_to_json({'items': all_ad_groups, 'count': len(all_ad_groups)}, 
                                 f"{output_dir}/ad_groups.json")
        if 'csv' in export_formats:
            exporter.save_to_csv(all_ad_groups, f"{output_dir}/ad_groups.csv")
        if 'excel' in export_formats:
            all_data['Ad_Groups'] = all_ad_groups
        print(f"  Найдено групп объявлений: {len(all_ad_groups)}")
    
    print()
    
    # ========== ОБЪЯВЛЕНИЯ ==========
    print("🎯 Объявления...")
    all_ads = []
    
    # Получаем объявления для каждой кампании
    for campaign_id in campaign_ids[:10]:  # Ограничиваем первыми 10 кампаниями
        ads = api.get_ads(campaign_id=campaign_id)
        if ads and 'items' in ads:
            all_ads.extend(ads['items'])
    
    if all_ads:
        exporter.save_to_json({'items': all_ads, 'count': len(all_ads)}, 
                             f"{output_dir}/ads.json")
        print(f"  Найдено объявлений: {len(all_ads)}")
    
    print()
    
    # ========== СТАТИСТИКА ==========
    print("📈 Статистика...")
    
    # Период за последние 30 дней
    date_to = datetime.now().strftime("%Y-%m-%d")
    date_from = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    
    print(f"  Период: {date_from} - {date_to}")
    
    # Статистика по дням
    stats_daily = api.get_statistics(
        metrics=["shows", "clicks", "spent", "conversions", "ctr", "cpc", "cpm", "uniq_views_count"],
        dimensions=["date", "campaign_id"],
        date_from=date_from,
        date_to=date_to
    )
    if stats_daily:
        if 'json' in export_formats:
            exporter.save_to_json(stats_daily, f"{output_dir}/statistics_daily.json")
        if stats_daily.get('rows') and 'csv' in export_formats:
            exporter.save_to_csv(stats_daily.get('rows', []), f"{output_dir}/statistics_daily.csv")
        if stats_daily.get('rows') and 'excel' in export_formats:
            all_data['Statistics_Daily'] = stats_daily.get('rows', [])
    
    # Статистика по кампаниям (используем новый метод)
    stats_campaigns = api.get_statistics_by_campaigns(
        campaign_ids=campaign_ids[:20] if campaign_ids else None,
        date_from=date_from,
        date_to=date_to
    )
    if stats_campaigns:
        if 'json' in export_formats:
            exporter.save_to_json(stats_campaigns, f"{output_dir}/statistics_by_campaign.json")
        if stats_campaigns.get('rows') and 'csv' in export_formats:
            exporter.save_to_csv(stats_campaigns.get('rows', []), f"{output_dir}/statistics_by_campaign.csv")
        if stats_campaigns.get('rows') and 'excel' in export_formats:
            all_data['Statistics_Campaigns'] = stats_campaigns.get('rows', [])
    
    # Статистика по объявлениям (если есть объявления)
    if all_ads:
        ad_ids = [str(ad.get('id')) for ad in all_ads if ad.get('id')][:20]
        stats_ads = api.get_statistics_by_ads(
            ad_ids=ad_ids,
            date_from=date_from,
            date_to=date_to
        )
        if stats_ads:
            if 'json' in export_formats:
                exporter.save_to_json(stats_ads, f"{output_dir}/statistics_by_ads.json")
            if stats_ads.get('rows') and 'excel' in export_formats:
                all_data['Statistics_Ads'] = stats_ads.get('rows', [])
    
    print()
    
    # ========== ДЕМОГРАФИЯ И ГЕОГРАФИЯ ==========
    print("📊 Демография и география...")
    
    # Статистика с демографией (пол, возраст)
    stats_demo = api.get_statistics_with_demographics(
        date_from=date_from,
        date_to=date_to,
        campaign_ids=campaign_ids[:10] if campaign_ids else None
    )
    if stats_demo:
        if 'json' in export_formats:
            exporter.save_to_json(stats_demo, f"{output_dir}/statistics_demographics.json")
        if stats_demo.get('rows') and 'csv' in export_formats:
            exporter.save_to_csv(stats_demo.get('rows', []), f"{output_dir}/statistics_demographics.csv")
        if stats_demo.get('rows') and 'excel' in export_formats:
            all_data['Demographics'] = stats_demo.get('rows', [])
    
    # Статистика с географией
    stats_geo = api.get_statistics_with_geo(
        date_from=date_from,
        date_to=date_to,
        campaign_ids=campaign_ids[:10] if campaign_ids else None
    )
    if stats_geo:
        if 'json' in export_formats:
            exporter.save_to_json(stats_geo, f"{output_dir}/statistics_geography.json")
        if stats_geo.get('rows') and 'csv' in export_formats:
            exporter.save_to_csv(stats_geo.get('rows', []), f"{output_dir}/statistics_geography.csv")
        if stats_geo.get('rows') and 'excel' in export_formats:
            all_data['Geography'] = stats_geo.get('rows', [])
    
    print()
    
    # ========== БЮДЖЕТЫ КАМПАНИЙ ==========
    print("💰 Бюджеты кампаний...")
    
    campaign_budgets = []
    for campaign_id in campaign_ids[:10]:  # Первые 10 кампаний
        budget = api.get_campaign_budget(campaign_id)
        if budget:
            campaign_budgets.append(budget)
    
    if campaign_budgets:
        if 'json' in export_formats:
            exporter.save_to_json({'items': campaign_budgets, 'count': len(campaign_budgets)}, 
                                 f"{output_dir}/campaign_budgets.json")
        if 'csv' in export_formats:
            exporter.save_to_csv(campaign_budgets, f"{output_dir}/campaign_budgets.csv")
        if 'excel' in export_formats:
            all_data['Campaign_Budgets'] = campaign_budgets
        print(f"  Получено бюджетов: {len(campaign_budgets)}")
    
    print()
    
    # ========== АУДИТОРИИ ==========
    print("👥 Аудитории...")
    audiences = api.get_audiences()
    if audiences:
        if 'json' in export_formats:
            exporter.save_to_json(audiences, f"{output_dir}/audiences.json")
        if audiences.get('items') and 'excel' in export_formats:
            all_data['Audiences'] = audiences.get('items', [])
    
    print()
    
    # ========== ПИКСЕЛИ ==========
    print("🔍 Пиксели...")
    pixels = api.get_pixels()
    if pixels:
        if 'json' in export_formats:
            exporter.save_to_json(pixels, f"{output_dir}/pixels.json")
        if pixels.get('items') and 'excel' in export_formats:
            all_data['Pixels'] = pixels.get('items', [])
    
    print()
    
    # ========== СПРАВОЧНИКИ ==========
    print("📚 Справочники...")
    
    # Категории
    categories = api.get_categories()
    if categories:
        if 'json' in export_formats:
            exporter.save_to_json(categories, f"{output_dir}/categories.json")
    
    # Клиенты (для агентских кабинетов)
    clients = api.get_clients()
    if clients:
        if 'json' in export_formats:
            exporter.save_to_json(clients, f"{output_dir}/clients.json")
        if clients.get('items') and 'excel' in export_formats:
            all_data['Clients'] = clients.get('items', [])
    
    # ========== СОЗДАНИЕ ОБЩЕГО EXCEL ФАЙЛА ==========
    if 'excel' in export_formats and all_data:
        print()
        print("📊 Создание общего Excel файла...")
        exporter.save_to_excel(all_data, f"{output_dir}/vk_ads_data_full.xlsx")
    
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
    print("СБОРЩИК ДАННЫХ VK ADS API V2 ДЛЯ POWER BI")
    print("="*70)
    print()
    
    # Загрузка конфигурации
    try:
        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from config import VK_ACCESS_TOKEN, VK_ACCOUNT_ID
        print("✅ Конфигурация загружена")
        print(f"   Access Token: {VK_ACCESS_TOKEN[:30]}...")
        print(f"   Account ID: {VK_ACCOUNT_ID}")
        print()
    except ImportError:
        print("❌ Файл config.py не найден!")
        print("\nВыполните: python3 get_vk_access_token.py")
        return 1
    
    # Проверка токенов
    if "YOUR_" in VK_ACCESS_TOKEN or "YOUR_" in VK_ACCOUNT_ID:
        print("❌ VK токены не настроены!")
        print("\nВыполните: python3 get_vk_access_token.py")
        return 1
    
    # Создание API
    try:
        api = VKAdsAPIv2(VK_ACCESS_TOKEN, VK_ACCOUNT_ID)
        print("✅ VK Ads API v2 инициализирован")
        print()
    except Exception as e:
        print(f"❌ Ошибка инициализации: {e}")
        return 1
    
    # Сбор данных
    try:
        output_dir = "data/vk_data"
        collect_all_vk_data(api, output_dir=output_dir, export_formats=['json', 'csv', 'excel'])
        
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
        print("   • campaigns.json - список кампаний")
        print("   • ads.json - список объявлений")
        print("   • statistics_daily.json - статистика по дням")
        print("   • statistics_by_campaign.json - статистика по кампаниям")
        print("   • audiences.json - аудитории")
        print()
        print("3. Основные метрики:")
        print("   - shows: показы")
        print("   - clicks: клики")
        print("   - spent: расходы")
        print("   - conversions: конверсии")
        print("   - ctr: CTR (Click-Through Rate)")
        print("   - cpc: CPC (Cost Per Click)")
        print("   - cpm: CPM (Cost Per Mille)")
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
    import sys
    sys.exit(main())

