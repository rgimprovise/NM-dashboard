"""
Скрипт для получения Yandex Market Campaign ID
"""

import requests
from config import YANDEX_OAUTH_TOKEN


def get_yandex_campaigns():
    """
    Получение списка кампаний Yandex Market
    """
    print("="*70)
    print("ПОЛУЧЕНИЕ YANDEX MARKET CAMPAIGN ID")
    print("="*70)
    print()
    
    # Проверяем формат токена
    print(f"OAuth Token: {YANDEX_OAUTH_TOKEN[:30]}...")
    print()
    
    url = "https://api.partner.market.yandex.ru/campaigns"
    
    # Правильный формат заголовка для Yandex Market API
    headers = {
        "Api-Key": YANDEX_OAUTH_TOKEN,
        "Content-Type": "application/json"
    }
    
    print(f"Отправка запроса на: {url}")
    print()
    
    try:
        response = requests.get(url, headers=headers, timeout=15)
        
        print(f"Статус ответа: {response.status_code}")
        print()
        
        if response.status_code == 200:
            data = response.json()
            campaigns = data.get('campaigns', [])
            
            if campaigns:
                print(f"✅ Найдено кампаний: {len(campaigns)}")
                print()
                print("Ваши кампании:")
                print("-" * 70)
                
                for i, campaign in enumerate(campaigns, 1):
                    campaign_id = campaign.get('id')
                    domain = campaign.get('domain', 'N/A')
                    business = campaign.get('business', 'N/A')
                    
                    print(f"{i}. Campaign ID: {campaign_id}")
                    print(f"   Домен: {domain}")
                    print(f"   Тип: {business}")
                    print()
                
                # Возвращаем первый campaign_id
                first_campaign_id = campaigns[0].get('id')
                print("="*70)
                print(f"✅ Рекомендуем использовать Campaign ID: {first_campaign_id}")
                print("="*70)
                
                return str(first_campaign_id)
            else:
                print("⚠️  У вас нет кампаний в Yandex Market")
                return None
                
        elif response.status_code == 401:
            print("❌ ОШИБКА АВТОРИЗАЦИИ (401)")
            print()
            print("Возможные причины:")
            print("1. Неверный OAuth Token")
            print("2. Токен истек")
            print("3. Токен не имеет прав доступа к Yandex Market API")
            print()
            print("Ответ сервера:")
            print(response.text)
            return None
        else:
            print(f"❌ Ошибка: {response.status_code}")
            print(f"Ответ сервера:")
            print(response.text)
            return None
            
    except requests.exceptions.Timeout:
        print("❌ Превышено время ожидания ответа от сервера")
        return None
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return None


def update_config_with_campaign_id(campaign_id):
    """
    Обновление config.py и .env с Campaign ID
    """
    print("\n" + "="*70)
    print("ОБНОВЛЕНИЕ КОНФИГУРАЦИОННЫХ ФАЙЛОВ")
    print("="*70)
    print()
    
    import re
    
    # Обновляем config.py
    try:
        with open('config.py', 'r', encoding='utf-8') as f:
            config_content = f.read()
        
        config_content = re.sub(
            r'YANDEX_CAMPAIGN_ID = "[^"]*"',
            f'YANDEX_CAMPAIGN_ID = "{campaign_id}"',
            config_content
        )
        
        with open('config.py', 'w', encoding='utf-8') as f:
            f.write(config_content)
        
        print("✅ Файл config.py обновлен")
    except Exception as e:
        print(f"⚠️  Не удалось обновить config.py: {e}")
    
    # Обновляем .env
    try:
        with open('.env', 'r', encoding='utf-8') as f:
            env_content = f.read()
        
        env_content = re.sub(
            r'YANDEX_CAMPAIGN_ID=.*',
            f'YANDEX_CAMPAIGN_ID={campaign_id}',
            env_content
        )
        
        with open('.env', 'w', encoding='utf-8') as f:
            f.write(env_content)
        
        print("✅ Файл .env обновлен")
    except Exception as e:
        print(f"⚠️  Не удалось обновить .env: {e}")


def main():
    print("\n")
    print("╔═══════════════════════════════════════════════════════════════════╗")
    print("║   ПОЛУЧЕНИЕ YANDEX MARKET CAMPAIGN ID                             ║")
    print("╚═══════════════════════════════════════════════════════════════════╝")
    print()
    
    campaign_id = get_yandex_campaigns()
    
    if campaign_id:
        update_config_with_campaign_id(campaign_id)
        
        print("\n" + "="*70)
        print("✅ ВСЁ ГОТОВО!")
        print("="*70)
        print()
        print(f"Campaign ID установлен: {campaign_id}")
        print()
        print("Следующие шаги:")
        print("1. Проверьте подключение: python3 test_connection.py")
        print("2. Запустите сбор данных: python3 api_data_collector.py")
        print()
    else:
        print("\n❌ Не удалось получить Campaign ID")
        print()
        print("Проверьте:")
        print("1. Правильность OAuth токена в config.py")
        print("2. Наличие магазинов в Yandex Market")
        print("3. Права доступа OAuth токена")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Прервано пользователем")
    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()

