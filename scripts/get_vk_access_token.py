"""
Скрипт для получения VK Access Token через Client Credentials Grant
Использует официальный VK Ads API OAuth2
Документация: https://ads.vk.com/doc/api/info/Авторизация в API
"""

import requests
import json
from config import VK_CLIENT_ID, VK_CLIENT_SECRET


def get_access_token_client_credentials():
    """
    Получение токена через Client Credentials Grant
    Этот метод используется для работы с данными собственного аккаунта через API
    """
    print("="*70)
    print("ПОЛУЧЕНИЕ VK ACCESS TOKEN (Client Credentials Grant)")
    print("="*70)
    print()
    
    url = "https://ads.vk.com/api/v2/oauth2/token.json"
    
    data = {
        "grant_type": "client_credentials",
        "client_id": VK_CLIENT_ID,
        "client_secret": VK_CLIENT_SECRET
    }
    
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    print("Отправка запроса на VK Ads API...")
    print(f"URL: {url}")
    print(f"Client ID: {VK_CLIENT_ID}")
    print()
    
    try:
        response = requests.post(url, data=data, headers=headers)
        
        print(f"Статус ответа: {response.status_code}")
        print()
        
        if response.status_code == 200:
            result = response.json()
            
            access_token = result.get("access_token")
            token_type = result.get("token_type")
            scope = result.get("scope")
            expires_in = result.get("expires_in")
            refresh_token = result.get("refresh_token")
            
            print("✅ ACCESS TOKEN УСПЕШНО ПОЛУЧЕН!")
            print("="*70)
            print()
            print(f"Access Token: {access_token}")
            print(f"Token Type: {token_type}")
            print(f"Scope: {scope}")
            print(f"Expires In: {expires_in} секунд ({int(expires_in)/3600:.1f} часов)")
            print(f"Refresh Token: {refresh_token}")
            print()
            print("="*70)
            
            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "expires_in": expires_in,
                "token_type": token_type,
                "scope": scope
            }
        else:
            print("❌ ОШИБКА ПРИ ПОЛУЧЕНИИ ТОКЕНА")
            print("="*70)
            print(f"Код ошибки: {response.status_code}")
            print(f"Ответ сервера:")
            print(response.text)
            print()
            
            try:
                error_data = response.json()
                print(f"Код ошибки: {error_data.get('code')}")
                print(f"Сообщение: {error_data.get('message')}")
            except:
                pass
            
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Ошибка при подключении к API: {e}")
        return None
    except Exception as e:
        print(f"❌ Неожиданная ошибка: {e}")
        return None


def get_accounts_info(access_token):
    """
    Получение информации о доступных рекламных кабинетах
    """
    print("\n" + "="*70)
    print("ПОЛУЧЕНИЕ ИНФОРМАЦИИ О РЕКЛАМНЫХ КАБИНЕТАХ")
    print("="*70)
    print()
    
    url = "https://ads.vk.com/api/v2/ad_plans.json"
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    try:
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            
            if 'items' in result and len(result['items']) > 0:
                print(f"✅ Найдено кабинетов: {len(result['items'])}")
                print()
                
                for i, account in enumerate(result['items'], 1):
                    account_id = account.get('id')
                    account_name = account.get('name', 'Без названия')
                    status = account.get('status')
                    
                    print(f"{i}. Account ID: {account_id}")
                    print(f"   Название: {account_name}")
                    print(f"   Статус: {status}")
                    print()
                
                # Возвращаем ID первого кабинета
                first_account_id = result['items'][0].get('id')
                print(f"✅ Используем Account ID: {first_account_id}")
                return str(first_account_id)
            else:
                print("⚠️  Рекламные кабинеты не найдены")
                return None
        else:
            print(f"❌ Ошибка при получении кабинетов: {response.status_code}")
            print(response.text)
            return None
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return None


def update_env_file(access_token, refresh_token, account_id=None):
    """
    Обновление .env файла с полученными токенами
    """
    print("\n" + "="*70)
    print("ОБНОВЛЕНИЕ ФАЙЛА .ENV")
    print("="*70)
    print()
    
    try:
        with open('.env', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Обновляем токены
        import re
        content = re.sub(
            r'VK_ACCESS_TOKEN=.*',
            f'VK_ACCESS_TOKEN={access_token}',
            content
        )
        
        content = re.sub(
            r'VK_REFRESH_TOKEN=.*',
            f'VK_REFRESH_TOKEN={refresh_token}',
            content
        )
        
        # Если нет строки VK_REFRESH_TOKEN, добавляем ее
        if 'VK_REFRESH_TOKEN=' not in content:
            # Находим строку VK_ACCESS_TOKEN и добавляем после нее
            content = re.sub(
                r'(VK_ACCESS_TOKEN=.*\n)',
                f'\\1VK_REFRESH_TOKEN={refresh_token}\n',
                content
            )
        
        if account_id:
            content = re.sub(
                r'VK_ACCOUNT_ID=.*',
                f'VK_ACCOUNT_ID={account_id}',
                content
            )
        
        with open('.env', 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✅ Файл .env успешно обновлен!")
        
        # Также обновляем config.py
        try:
            with open('config.py', 'r', encoding='utf-8') as f:
                config_content = f.read()
            
            config_content = re.sub(
                r'VK_ACCESS_TOKEN = "[^"]*"',
                f'VK_ACCESS_TOKEN = "{access_token}"',
                config_content
            )
            
            if account_id:
                config_content = re.sub(
                    r'VK_ACCOUNT_ID = "[^"]*"',
                    f'VK_ACCOUNT_ID = "{account_id}"',
                    config_content
                )
            
            with open('config.py', 'w', encoding='utf-8') as f:
                f.write(config_content)
            
            print("✅ Файл config.py также обновлен!")
        except Exception as e:
            print(f"⚠️  Не удалось обновить config.py: {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка при обновлении .env: {e}")
        return False


def main():
    """
    Основная функция
    """
    print("\n")
    print("╔═══════════════════════════════════════════════════════════════════╗")
    print("║   ПОЛУЧЕНИЕ VK ADS API ACCESS TOKEN (OAuth2)                      ║")
    print("╚═══════════════════════════════════════════════════════════════════╝")
    print()
    
    # Шаг 1: Получаем Access Token
    token_data = get_access_token_client_credentials()
    
    if not token_data:
        print("\n❌ Не удалось получить Access Token")
        print("\nВозможные причины:")
        print("1. Неверный Client ID или Client Secret")
        print("2. Нет доступа к VK Ads API")
        print("3. OAuth-клиент заблокирован")
        print("\nПроверьте данные в config.py и .env")
        return
    
    access_token = token_data["access_token"]
    refresh_token = token_data["refresh_token"]
    
    # Шаг 2: Получаем информацию о рекламных кабинетах
    account_id = get_accounts_info(access_token)
    
    # Шаг 3: Обновляем конфигурационные файлы
    if update_env_file(access_token, refresh_token, account_id):
        print("\n" + "="*70)
        print("✅ ВСЁ ГОТОВО!")
        print("="*70)
        print()
        print("Полученные данные сохранены в .env и config.py")
        print()
        print("Следующие шаги:")
        print("1. Проверьте подключение: python3 test_connection.py")
        print("2. Запустите сбор данных: python3 api_data_collector.py")
        print()
        print("💡 Токен действует 86400 секунд (24 часа)")
        print("   Для обновления токена используйте refresh_token")
        print()
    else:
        print("\n⚠️  Токены получены, но не удалось обновить файлы")
        print("\nСкопируйте данные вручную:")
        print(f"VK_ACCESS_TOKEN={access_token}")
        print(f"VK_REFRESH_TOKEN={refresh_token}")
        if account_id:
            print(f"VK_ACCOUNT_ID={account_id}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Прервано пользователем")
    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()

