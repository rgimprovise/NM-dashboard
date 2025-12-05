# 🔥 VK Ads Statistics - Быстрое решение

## ❌ Проблема

VK Statistics endpoint (`/statistics.json`) возвращает **404 Not Found**.

**Причина**: OAuth-клиент зарегистрирован ТОЛЬКО с правами `read_ads` и `read_payments`.  
Для доступа к статистике требуется **scope `read_stats`**, который НЕ зарегистрирован на уровне OAuth-клиента.

---

## ✅ ЧТО МЫ УЗНАЛИ

### Доступные scope для вашего OAuth-клиента:
- ✅ `read_ads` - чтение кампаний, объявлений (работает)
- ✅ `read_payments` - чтение платежей (зарегистрирован, но endpoints не найдены)
- ❌ `read_stats` - **НЕ зарегистрирован** (критически необходим для статистики)
- ❌ `read_billing`, `read_clients` - не зарегистрированы

### Правильный формат перечисления scope:
- ✅ `scope=read_ads,read_payments` (запятая без пробелов)
- ❌ `scope=read_ads read_payments` (пробел - не работает)

### Удаление токенов (при достижении лимита):
```bash
curl -X POST "https://ads.vk.com/api/v2/oauth2/token/delete.json" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=b9AHG7669xtg1nvq" \
  -d "client_secret=ВАШ_SECRET" \
  -d "user_id=23937410"
```

### Получение токена с несколькими scope:
```bash
curl -X POST "https://ads.vk.com/api/v2/oauth2/token.json" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=b9AHG7669xtg1nvq" \
  -d "client_secret=ВАШ_SECRET" \
  -d "scope=read_ads,read_payments"  # Запятая без пробелов!
```

---

## 📧 РЕШЕНИЕ: Обращение в поддержку VK

Email: **ads_api@vk.team**

**Тема**: Добавление scope read_stats для OAuth-клиента

```
Здравствуйте!

Прошу добавить scope read_stats для OAuth-клиента:

Client ID: b9AHG7669xtg1nvq
User ID: 23937410

Текущие scope: read_ads, read_payments
Требуется: read_stats (для endpoint /statistics.json)

Цель: интеграция VK Ads API v2 в корпоративный дашборд
для аналитики рекламных кампаний в режиме реального времени.

Endpoint /statistics.json возвращает "Not found" без read_stats.

С уважением,
[Ваше имя]
```

**Время ответа**: 1-3 рабочих дня

---

## 🔍 Поисковые запросы для поиска решения

### Русский:
- `VK Ads API v2 read_stats scope как получить`
- `VK Ads API добавление scope OAuth-клиент read_stats`
- `VK Ads API statistics.json not found read_stats`
- `VK Ads API v2 расширение прав OAuth приложения`

### Английский:
- `VK Ads API v2 read_stats scope request`
- `VK Ads API OAuth client add read_stats scope`
- `VK Ads API v2 statistics endpoint read_stats permission`
- `VK Ads API v2 OAuth application scope modification`

### Форумы и сообщества:
- `site:vk.com/dev VK Ads API read_stats scope`
- `site:habr.com VK Ads API статистика scope`
- `VK Ads API v2 scope registration process`

---

## 📝 Текущий статус дашборда

### ✅ Работает (85%):
- Yandex Market: 515 заказов, 7.2M₽ выручка
- VK Ads: 55 кампаний (базовые данные)
- VK Token: автообновление (read_ads, read_payments)
- 1C импорт: работает
- Интерфейс: 100% на русском

### ⚠️ Не работает (15%):
- VK Statistics: недоступна (требуется read_stats)
- VK финансовые метрики (расходы, ROAS, CTR, CPC)

### 🎯 Для 100% функциональности:
Необходимо получить read_stats от поддержки VK

---

## 🌐 Запуск дашборда

```bash
cd "/Users/rostislavgolivetc/API test/vortex-home 2"
npm run dev
```

Откройте: http://localhost:8080

---

## 📞 Полезные ссылки

- Подробный отчет: `VK_STATUS.md`
- VK Ads поддержка: https://vk.com/ads_support
- Документация API: https://ads.vk.com/doc/api
- Email поддержки: ads_api@vk.team
