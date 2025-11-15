"""
Утилита для загрузки переменных окружения из .env файла
"""

import os


def load_env(env_file='.env'):
    """
    Загружает переменные окружения из .env файла
    """
    if not os.path.exists(env_file):
        print(f"⚠️  Файл {env_file} не найден")
        return False
    
    try:
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                
                # Пропускаем пустые строки и комментарии
                if not line or line.startswith('#'):
                    continue
                
                # Разделяем на ключ и значение
                if '=' in line:
                    key, value = line.split('=', 1)
                    key = key.strip()
                    value = value.strip()
                    
                    # Устанавливаем переменную окружения
                    os.environ[key] = value
        
        print(f"✅ Переменные окружения загружены из {env_file}")
        return True
    
    except Exception as e:
        print(f"❌ Ошибка при загрузке {env_file}: {e}")
        return False


def get_env_var(key, default=None):
    """
    Получает значение переменной окружения
    """
    return os.getenv(key, default)


if __name__ == "__main__":
    # Тестируем загрузку
    if load_env():
        print("\nЗагруженные переменные:")
        print(f"VK_CLIENT_ID: {get_env_var('VK_CLIENT_ID')}")
        print(f"VK_ACCESS_TOKEN: {get_env_var('VK_ACCESS_TOKEN', 'НЕ УСТАНОВЛЕН')}")
        print(f"VK_ACCOUNT_ID: {get_env_var('VK_ACCOUNT_ID', 'НЕ УСТАНОВЛЕН')}")
        print(f"YANDEX_OAUTH_TOKEN: {get_env_var('YANDEX_OAUTH_TOKEN')}")

