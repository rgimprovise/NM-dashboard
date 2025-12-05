"""
Пример файла конфигурации для API токенов
Скопируйте этот файл в config.py и заполните своими данными
"""

# ========== YANDEX MARKET API ==========
YANDEX_OAUTH_TOKEN = "YOUR_YANDEX_OAUTH_TOKEN"
YANDEX_CAMPAIGN_ID = "YOUR_CAMPAIGN_ID"

# ========== VK ADS API ==========
VK_ACCESS_TOKEN = "YOUR_VK_ACCESS_TOKEN"
VK_ACCOUNT_ID = "YOUR_VK_ACCOUNT_ID"

# ========== ДОПОЛНИТЕЛЬНЫЕ НАСТРОЙКИ ==========
# Папки для сохранения данных
YANDEX_OUTPUT_DIR = "yandex_data"
VK_OUTPUT_DIR = "vk_data"

# Период для статистики (в днях)
STATS_PERIOD_DAYS = 30

# Лимиты для пагинации
YANDEX_PAGE_LIMIT = 200
VK_MAX_CAMPAIGNS = 5  # Максимум кампаний для получения статистики

