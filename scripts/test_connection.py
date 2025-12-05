"""
Тестирование подключения к API
Проверяет все токены и выводит базовую информацию
"""

import requests

print("\n" + "="*60)
print("ТЕСТИРОВАНИЕ ПОДКЛЮЧЕНИЯ К API")
print("="*60 + "\n")

# Загрузка конфигурации
try:
    from config import (
        YANDEX_OAUTH_TOKEN,
        YANDEX_CAMPAIGN_ID,
        VK_ACCESS_TOKEN,
        VK_ACCOUNT_ID
    )
    print("✅ Файл config.py загружен\n")
except ImportError:
    print("❌ Файл config.py не найден!")
    print("Запустите: python3 setup_tokens.py")
    exit(1)

# Проверка заполненности
print("Проверка конфигурации:")
print(f"  Yandex Token: {'✅' if YANDEX_OAUTH_TOKEN and 'YOUR_' not in YANDEX_OAUTH_TOKEN else '❌'} {YANDEX_OAUTH_TOKEN[:20]}..." if YANDEX_OAUTH_TOKEN else "❌ Не указан")
print(f"  Yandex Campaign ID: {'✅' if YANDEX_CAMPAIGN_ID and 'YOUR_' not in YANDEX_CAMPAIGN_ID else '❌'} {YANDEX_CAMPAIGN_ID}")
print(f"  VK Token: {'✅' if VK_ACCESS_TOKEN and 'YOUR_' not in VK_ACCESS_TOKEN else '❌'} {VK_ACCESS_TOKEN[:20]}..." if VK_ACCESS_TOKEN else "❌ Не указан")
print(f"  VK Account ID: {'✅' if VK_ACCOUNT_ID and 'YOUR_' not in VK_ACCOUNT_ID else '❌'} {VK_ACCOUNT_ID}")
print()

# Тест Yandex Market API
print("="*60)
print("ТЕСТ: Yandex Market API")
print("="*60)

if YANDEX_OAUTH_TOKEN and 'YOUR_' not in YANDEX_OAUTH_TOKEN:
    try:
        url = "https://api.partner.market.yandex.ru/campaigns"
        headers = {
            "Api-Key": YANDEX_OAUTH_TOKEN,
            "Content-Type": "application/json"
        }
        response = requests.get(url, headers=headers, timeout=10)
        
        print(f"Статус: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            campaigns = data.get('campaigns', [])
            print(f"✅ Подключение успешно!")
            print(f"Найдено кампаний: {len(campaigns)}")
            
            if campaigns:
                print("\nВаши кампании:")
                for i, camp in enumerate(campaigns, 1):
                    print(f"  {i}. ID: {camp.get('id')} - {camp.get('domain', 'N/A')}")
                
                # Если Campaign ID не указан, предложить первый
                if 'YOUR_' in YANDEX_CAMPAIGN_ID:
                    print(f"\n💡 Используйте Campaign ID: {campaigns[0].get('id')}")
                    print("   Обновите в config.py:")
                    print(f"   YANDEX_CAMPAIGN_ID = \"{campaigns[0].get('id')}\"")
            else:
                print("⚠️  У вас нет кампаний в Yandex Market")
        else:
            print(f"❌ Ошибка: {response.status_code}")
            print(f"Ответ: {response.text[:200]}")
            
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")
else:
    print("⏭️  Токен не указан, пропускаем")

print()

# Тест VK Ads API
print("="*60)
print("ТЕСТ: VK Ads API")
print("="*60)

if VK_ACCESS_TOKEN and 'YOUR_' not in VK_ACCESS_TOKEN:
    try:
        # Используем новый VK Ads API (ads.vk.com)
        url = "https://ads.vk.com/api/v2/ad_plans.json"
        headers = {
            "Authorization": f"Bearer {VK_ACCESS_TOKEN}"
        }
        response = requests.get(url, headers=headers, timeout=10)
        
        print(f"Статус: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            if 'error' in data:
                print(f"❌ Ошибка API: {data['error']}")
            elif 'items' in data:
                accounts = data.get('items', [])
                print(f"✅ Подключение успешно!")
                print(f"Найдено рекламных кабинетов: {len(accounts)}")
                
                if accounts:
                    print("\nВаши кабинеты:")
                    for i, acc in enumerate(accounts[:10], 1):  # Показываем первые 10
                        print(f"  {i}. Account ID: {acc.get('id')} - {acc.get('name', 'Без названия')}")
                    
                    if len(accounts) > 10:
                        print(f"  ... и ещё {len(accounts) - 10} кабинетов")
                    
                    # Если Account ID не указан, предложить первый
                    if 'YOUR_' in VK_ACCOUNT_ID:
                        print(f"\n💡 Используйте Account ID: {accounts[0].get('id')}")
                        print("   Обновите в config.py:")
                        print(f"   VK_ACCOUNT_ID = \"{accounts[0].get('id')}\"")
                else:
                    print("⚠️  У вас нет доступных рекламных кабинетов")
            else:
                print(f"❌ Неожиданный формат ответа: {data}")
        else:
            print(f"❌ Ошибка: {response.status_code}")
            print(f"Ответ: {response.text[:200]}")
            
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")
else:
    print("⏭️  Токен не указан, пропускаем")

print()
print("="*60)
print("РЕЗУЛЬТАТ")
print("="*60)

all_ok = (
    YANDEX_OAUTH_TOKEN and 'YOUR_' not in YANDEX_OAUTH_TOKEN and
    YANDEX_CAMPAIGN_ID and 'YOUR_' not in YANDEX_CAMPAIGN_ID and
    VK_ACCESS_TOKEN and 'YOUR_' not in VK_ACCESS_TOKEN and
    VK_ACCOUNT_ID and 'YOUR_' not in VK_ACCOUNT_ID
)

if all_ok:
    print("✅ Все данные настроены правильно!")
    print("\n🚀 Можно запускать основной скрипт:")
    print("   python3 api_data_collector.py")
else:
    print("⚠️  Не все данные настроены")
    print("\nЧто нужно сделать:")
    
    if 'YOUR_' in YANDEX_OAUTH_TOKEN:
        print("  ❌ Указать Yandex OAuth Token")
    if 'YOUR_' in YANDEX_CAMPAIGN_ID:
        print("  ❌ Указать Yandex Campaign ID")
    if 'YOUR_' in VK_ACCESS_TOKEN:
        print("  ❌ Указать VK Access Token")
    if 'YOUR_' in VK_ACCOUNT_ID:
        print("  ❌ Указать VK Account ID")
    
    print("\nДля помощи запустите: python3 setup_tokens.py")

print()

