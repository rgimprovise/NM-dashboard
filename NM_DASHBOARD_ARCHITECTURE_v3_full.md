# 📊 NM Dashboard — Архитектура и модель данных

**Версия:** 3.0  
**Дата:** Декабрь 2025  
**Проект:** NM Dashboard — аналитический дашборд для мебельной компании «Недорогая мебель»

---

## 📑 Содержание

1. [Overview / Общий обзор](#1-overview--общий-обзор)  
2. [High-Level Architecture](#2-high-level-architecture)  
   - 2.1 [Frontend](#21-frontend-react)  
   - 2.2 [Backend](#22-backend-expressjs)  
   - 2.3 [Структура директорий](#23-структура-директорий)  
3. [Data Sources](#3-data-sources)  
   - 3.1 [Yandex Market API](#31-yandex-market-api)  
   - 3.2 [VK Ads API](#32-vk-ads-api)  
   - 3.3 [1C (Manual Upload)](#33-1c-manual-upload)  
4. [Data Routing & API Layer](#4-data-routing--api-layer)  
   - 4.1 [Поток данных Yandex Market → UI](#41-поток-данных-yandex-market--ui)  
   - 4.2 [Поток данных VK Ads → UI](#42-поток-данных-vk-ads--ui)  
   - 4.3 [API Endpoints](#43-api-endpoints)  
   - 4.4 [Кэширование и токены](#44-кэширование-и-токены)  
5. [Data Model (Star Schema)](#5-data-model-star-schema)  
   - 5.1 [Fact Tables](#51-fact-tables)  
   - 5.2 [Dimension Tables](#52-dimension-tables)  
   - 5.3 [Связи между таблицами](#53-связи-между-таблицами)  
6. [KPI Framework (Методология метрик)](#6-kpi-framework-методология-метрик)  
   - 6.1 [Маркетинговые метрики](#61-маркетинговые-метрики)  
   - 6.2 [Метрики продаж и товаров](#62-метрики-продаж-и-товаров)  
   - 6.3 [Финансовые и сравнительные метрики](#63-финансовые-и-сравнительные-метрики)  
7. [Time Periods & Aggregations](#7-time-periods--aggregations)  
8. [Manual File Upload & 1C Integration Layer](#8-manual-file-upload--1c-integration-layer)  
   - 8.1 [Процесс загрузки файлов](#81-процесс-загрузки-файлов)  
   - 8.2 [Структура данных 1C-файлов](#82-структура-данных-1c-файлов)  
   - 8.3 [Маппинг колонок](#83-маппинг-колонок)  
   - 8.4 [Валидация и ошибки](#84-валидация-и-ошибки)  
   - 8.5 [История загрузок](#85-история-загрузок)  
9. [Cross-System Mapping (VK → Yandex Market → 1C)](#9-cross-system-mapping-vk--yandex-market--1c)  
10. [Deduplication & Data Quality](#10-deduplication--data-quality)  
11. [Logging & Monitoring](#11-logging--monitoring)  
12. [Future Extensions / Roadmap](#12-future-extensions--roadmap)

---

## 1. Overview / Общий обзор

NM Dashboard — это аналитическая система для «Недорогой мебели», которая объединяет данные:

- из **Yandex Market** (заказы, товары, остатки, статистика),
- из **VK Ads** (кампании, показы, клики, расходы),
- из **1С** (номенклатура, продажи, себестоимость, остатки — через ручной или полуавтоматический экспорт).

Цель дашборда:

- дать управляемую и прозрачную аналитику по воронке  
  **Реклама → Маркетплейс → 1С-продажи → Маржа**,  
- обеспечить удобную работу аналитикам и собственнику,
- иметь устойчивую архитектуру, которую можно развивать 3–5 лет.

---

## 2. High-Level Architecture

### 2.1 Frontend (React)

Frontend реализован на **React + TypeScript** и включает несколько ключевых страниц:

- `Dashboard.tsx` — главная витрина (сводные KPI),
- `Marketing.tsx` — аналитика рекламных кампаний VK и их влияния,
- `Sales.tsx` — аналитика продаж по заказам, товарам, каналам,
- `Upload1C.tsx` — интерфейс загрузки и маппинга файлов 1C.

Все страницы используют **DataService** (`client/services/dataService.ts`), который:

- инкапсулирует работу с API (Yandex, VK, backend),
- агрегирует сырые данные в удобные структуры для UI,
- рассчитывает часть метрик и KPI.

Схема:

```text
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Dashboard   │  │  Marketing   │  │    Sales     │      │
│  │   Page       │  │    Page      │  │    Page      │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│         └─────────────────┼─────────────────┘               │
│                           │                                 │
│                   ┌───────▼───────┐                         │
│                   │  DataService  │                         │
│                   └───────┬───────┘                         │
└───────────────────────────┼─────────────────────────────────┘
                            │ HTTP
                            ▼
```

### 2.2 Backend (Express.js)

Backend реализован на **Express.js (TypeScript)** и:

- принимает запросы от фронтенда,
- ходит к внешним API (Yandex, VK),
- применяет кэширование,
- управляет VK-токенами,
- подготавливает данные в удобном для фронта формате.

```text
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Express.js)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              server/index.ts                        │   │
│  │  - Инициализация Express                            │   │
│  │  - Middleware (CORS, JSON)                          │   │
│  │  - Регистрация роутов                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  Yandex Routes   │         │    VK Routes     │          │
│  │  (yandex.ts)     │         │    (vk.ts)       │          │
│  └────────┬─────────┘         └────────┬─────────┘          │
│           │                            │                     │
│           ▼                            ▼                     │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  Yandex Market   │         │     VK Ads       │          │
│  │      API v2      │         │      API v2      │          │
│  └──────────────────┘         └──────────────────┘          │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Cache Manager (cacheManager.ts)            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │      VK Token Manager (vkTokenManager.ts)            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Структура директорий

```text
vortex-home2/
├── client/                      # Frontend (React + TS)
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Marketing.tsx
│   │   ├── Sales.tsx
│   │   └── Upload1C.tsx
│   ├── services/
│   │   ├── dataService.ts       # Агрегация и расчеты
│   │   ├── api/
│   │   │   ├── yandexClient.ts
│   │   │   └── vkClient.ts
│   │   └── excelParser.ts       # Парсер Excel/CSV (1C)
│   ├── components/
│   └── types/
│
├── server/                      # Backend (Express.js)
│   ├── index.ts
│   ├── routes/
│   │   ├── yandex.ts
│   │   ├── vk.ts
│   │   └── demo.ts
│   ├── cache/
│   │   └── cacheManager.ts
│   └── utils/
│       └── vkTokenManager.ts
│
└── shared/                      # Общий код
```

---

## 3. Data Sources

### 3.1 Yandex Market API

Используется **Yandex Market API v2**. Основные сущности:

- Кампании,
- Заказы,
- Товары (offers),
- Остатки,
- Статистика заказов.

Основные эндпоинты перечислены в разделе [4.3 API Endpoints](#43-api-endpoints).

### 3.2 VK Ads API

Используется VK Ads API для получения:

- Рекламных планов,
- Кампаний,
- Групп объявлений,
- Баннеров,
- Статистики (показы, клики, расходы).

### 3.3 1C (Manual Upload)

Данные 1С пока загружаются вручную (через CSV/XLSX):

- справочник номенклатуры,
- в перспективе: продажи, себестоимость, остатки, цены.

Загрузка реализована через страницу `Upload1C.tsx` и парсер `excelParser.ts`.

---

## 4. Data Routing & API Layer

### 4.1 Поток данных Yandex Market → UI

```text
┌─────────────────┐
│  Yandex Market  │
│      API v2     │
└────────┬────────┘
         │ GET /campaigns/{id}/orders
         ▼
┌─────────────────────────────────────┐
│ server/routes/yandex.ts             │
│ - Проверка кэша                     │
│ - Запрос к API (если нет в кэше)    │
│ - Сохранение в кэш                  │
│ - Ответ клиенту                     │
└────────┬────────────────────────────┘
         │ JSON { success, data }
         ▼
┌─────────────────────────────────────┐
│ client/services/api/yandexClient.ts │
│ - getOrders(dateFrom, dateTo)       │
└────────┬────────────────────────────┘
         │ Promise<Order[]>
         ▼
┌─────────────────────────────────────┐
│ client/services/dataService.ts      │
│ - Агрегация заказов и метрик        │
└────────┬────────────────────────────┘
         ▼
┌─────────────────────────────────────┐
│ Dashboard / Marketing / Sales       │
└─────────────────────────────────────┘
```

### 4.2 Поток данных VK Ads → UI

Аналогично Yandex:

1. `client` → `/api/vk/...`  
2. `server/routes/vk.ts` → VK API (через `vkTokenManager`)  
3. Кэширование результатов  
4. Возврат агрегированных данных на фронт.

### 4.3 API Endpoints

#### Yandex Market API (backend endpoints)

| Endpoint                    | Метод | Описание                       | Кэш TTL |
|----------------------------|-------|--------------------------------|---------|
| `/api/yandex/campaigns`    | GET   | Список кампаний               | 60 мин  |
| `/api/yandex/orders`       | GET   | Заказы (с пагинацией)         | 5 мин   |
| `/api/yandex/products`     | GET   | Товары                        | 30 мин  |
| `/api/yandex/stocks`       | GET   | Остатки товаров               | 15 мин  |
| `/api/yandex/stats/orders` | GET   | Статистика заказов            | 5 мин   |

Параметры: `date_from`, `date_to`, `page`, `pageSize`.

#### VK Ads API (backend endpoints)

| Endpoint              | Метод | Описание                 | Кэш TTL |
|-----------------------|-------|--------------------------|---------|
| `/api/vk/ad-plans`    | GET   | Рекламные планы         | 30 мин  |
| `/api/vk/campaigns`   | GET   | Кампании                | 15 мин  |
| `/api/vk/ad-groups`   | GET   | Группы объявлений       | 15 мин  |
| `/api/vk/banners`     | GET   | Баннеры                 | 15 мин  |
| `/api/vk/statistics`  | GET/POST | Статистика           | 10 мин  |

Параметры: `date_from`, `date_to`, `ad_plan_id`, `campaign_id`.

### 4.4 Кэширование и токены

#### Cache Manager

- In-memory кэш с TTL для каждого типа данных,
- Ключи кэша формируются с учётом параметров запроса:

```ts
`yandex:orders:all:${date_from}:${date_to}`
`yandex:products:all`
`vk:campaigns:${ad_plan_id || 'all'}`
`vk:stats:${date_from}:${date_to}`
```

- Периодическая очистка устаревших записей.

#### VK Token Manager

- Автоматически проверяет срок действия токена,
- При необходимости обновляет `access_token` по `refresh_token`,
- Сохраняет токены в `.env` и в памяти.

---

## 5. Data Model (Star Schema)

В основе NM Dashboard — **звёздная схема (Star Schema)**: набор факт-таблиц (события, транзакции) и измерений (справочники).

### 5.1 Fact Tables

#### `fact_yandex_orders`

| Поле               | Тип       | Описание                                  |
|--------------------|-----------|-------------------------------------------|
| `order_id`         | string PK | ID заказа в Yandex Market                |
| `campaign_id`      | string FK | ID кампании Маркета                      |
| `product_id`       | string FK | Ссылка на `dim_products.id`              |
| `shop_sku`         | string    | SKU в магазине                           |
| `creation_date`    | date      | Дата создания заказа                     |
| `status`           | string    | Статус заказа                            |
| `quantity`         | number    | Кол-во единиц товара                     |
| `buyer_price`      | number    | Цена для покупателя за единицу           |
| `revenue`          | number    | Выручка по строке (`buyer_price * qty`)  |

#### `fact_vk_ads`

| Поле               | Тип       | Описание                                   |
|--------------------|-----------|--------------------------------------------|
| `date`             | date PK   | Дата                                      |
| `campaign_id`      | string FK | Рекламная кампания VK                     |
| `ad_group_id`      | string    | Группа объявлений                         |
| `banner_id`        | string    | Конкретный креатив                        |
| `impressions`      | number    | Показов                                   |
| `clicks`           | number    | Кликов                                    |
| `spend`            | number    | Расход                                    |

#### `fact_1c_sales` *(на перспективу)*

| Поле                 | Тип       | Описание                                     |
|----------------------|-----------|----------------------------------------------|
| `sale_id`            | string PK | ID документа продажи / чека                 |
| `external_order_id`  | string    | Внешний номер (из Маркета/сайта)           |
| `date`               | date      | Дата документа                              |
| `product_id`         | string FK | Ссылка на `dim_products`                    |
| `warehouse_id`       | string FK | Склад / точка продаж                        |
| `quantity`           | number    | Кол-во                                      |
| `price`              | number    | Цена продажи                                |
| `revenue`            | number    | Выручка по строке                           |

#### `fact_1c_margin` *(на перспективу)*

| Поле           | Тип       | Описание                                |
|----------------|-----------|-----------------------------------------|
| `sale_id`      | string FK | Ссылка на `fact_1c_sales`              |
| `product_id`   | string FK | Товар                                  |
| `cost`         | number    | Себестоимость                           |
| `margin`       | number    | Валовая прибыль (revenue − cost)       |

#### `fact_stock` *(на перспективу)*

| Поле           | Тип       | Описание                          |
|----------------|-----------|-----------------------------------|
| `snapshot_date`| date      | Дата среза                        |
| `product_id`   | string FK | Товар                             |
| `warehouse_id` | string FK | Склад                             |
| `stock_qty`    | number    | Кол-во на складе                  |
| `stock_value`  | number    | Стоимость остатков (опционально) |

### 5.2 Dimension Tables

#### `dim_products`

| Поле           | Тип       | Описание                            |
|----------------|-----------|-------------------------------------|
| `id`           | string PK | Внутренний product_id              |
| `1c_code`      | string    | Код номенклатуры 1С                |
| `article`      | string    | Артикул                             |
| `offer_id`     | string    | offerId Яндекс Маркета              |
| `shop_sku`     | string    | SKU магазина/Маркет                 |
| `name`         | string    | Наименование                        |
| `category_id`  | string FK | Категория                           |
| `brand`        | string    | Бренд                               |
| `collection`   | string    | Коллекция                           |

#### `dim_categories`

| Поле         | Тип       | Описание              |
|--------------|-----------|-----------------------|
| `id`         | string PK | ID категории          |
| `name`       | string    | Название категории    |
| `parent_id`  | string    | ID родительской       |

#### `dim_campaigns`

| Поле          | Тип       | Описание                    |
|---------------|-----------|-----------------------------|
| `id`          | string PK | ID кампании (VK / Yandex)   |
| `source`      | string    | 'vk' / 'yandex'             |
| `name`        | string    | Название кампании           |
| `objective`   | string    | Цель кампании               |
| `status`      | string    | Статус                      |

#### `dim_calendar`

| Поле          | Тип       | Описание                     |
|---------------|-----------|------------------------------|
| `date`        | date PK   | Дата                         |
| `day`         | number    | День                         |
| `month`       | number    | Месяц (1–12)                 |
| `month_name`  | string    | Название месяца              |
| `year`        | number    | Год                          |
| `week`        | number    | Номер недели                 |
| `quarter`     | string    | Q1–Q4                        |
| `is_weekend`  | boolean   | Признак выходного            |

#### `dim_warehouses`

| Поле          | Тип       | Описание                        |
|---------------|-----------|---------------------------------|
| `id`          | string PK | ID склада/точки                 |
| `name`        | string    | Наименование                    |
| `city`        | string    | Город                           |

#### `dim_price_types` *(опционально)*

| Поле          | Тип       | Описание                        |
|---------------|-----------|---------------------------------|
| `id`          | string PK | Тип цены                        |
| `name`        | string    | Розничная, оптовая, маркет и т.п.|

### 5.3 Связи между таблицами

- `fact_yandex_orders.product_id → dim_products.id`
- `fact_vk_ads.campaign_id → dim_campaigns.id`
- `fact_1c_sales.product_id → dim_products.id`
- `fact_1c_sales.warehouse_id → dim_warehouses.id`
- `fact_1c_sales.date → dim_calendar.date`
- `fact_1c_margin.sale_id → fact_1c_sales.sale_id`
- `fact_stock.product_id → dim_products.id`
- `fact_stock.warehouse_id → dim_warehouses.id`
- `fact_stock.snapshot_date → dim_calendar.date`

---

## 6. KPI Framework (Методология метрик)

### 6.1 Маркетинговые метрики

**ROAS (Return on Ad Spend)**  
Источник: `fact_vk_ads` + `fact_yandex_orders` / `fact_1c_sales`

```text
ROAS = Total Revenue / Ad Spend
Ad Spend = SUM(spend) из fact_vk_ads
Total Revenue = SUM(revenue) из fact_yandex_orders или fact_1c_sales
```

**CTR (Click-Through Rate)**  
Источник: `fact_vk_ads`

```text
CTR = (Total Clicks / Total Shows) × 100%
```

**CPC (Cost Per Click)**  

```text
CPC = Ad Spend / Total Clicks
```

**CPM (Cost Per Mille)**  

```text
CPM = (Ad Spend / Total Shows) × 1,000
```

**Conversion Rate (Конверсия клики → заказы)**  
Источник: `fact_vk_ads` + `fact_yandex_orders`

```text
Conversion Rate = (Total Orders / Total Clicks) × 100%
```

### 6.2 Метрики продаж и товаров

**AOV (Average Order Value / Средний чек)**  

```text
AOV = Total Revenue / Total Orders
```

**Revenue Share (Доля выручки товара/категории)**  

```text
Revenue Share = (Product Revenue / Total Revenue) × 100%
```

**Average Price (Средняя цена товара)**  

```text
Average Price = Product Revenue / Total Quantity
```

### 6.3 Финансовые и сравнительные метрики

**Маржа (валовая)**  
Источник: `fact_1c_margin` (на перспективу)

```text
Margin = Revenue − Cost
Margin % = Margin / Revenue × 100%
```

**Сравнение периодов (Δ% к предыдущему периоду)**

```ts
function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}
```

**Правила консистентности:**

- Выручка: при наличии 1С — **source of truth** = `fact_1c_sales`; до интеграции — `fact_yandex_orders`.
- Расходы: всегда `fact_vk_ads`.
- Маржа: только `fact_1c_margin`.
- Кол-во заказов: для маркетплейса — `fact_yandex_orders`, для оффлайна — `fact_1c_sales`.

---

## 7. Time Periods & Aggregations

Поддерживаемые периоды:

| Код | Описание         | Формула                    |
|-----|------------------|----------------------------|
| 7d  | Последние 7 дней | today − 7                  |
| 30d | Последние 30 дней| today − 30                 |
| 90d | Последние 90 дней| today − 90                 |
| ytd | Year-to-date     | c 1 января текущего года   |

Реализация в коде — через `getPeriodParams(period)` (формирует `date_from` / `date_to` в формате `YYYY-MM-DD`).

Планируемая/частичная реализация:

- агрегация по месяцам (ключ `YYYY-MM`),
- агрегация по кварталам (ключ `YYYY-QX`).

---

## 8. Manual File Upload & 1C Integration Layer

### 8.1 Процесс загрузки файлов

Страница `Upload1C.tsx` реализует следующий поток:

1. Пользователь выбирает файл (CSV/XLSX).  
2. `excelParser.getSheetNames()` — выбор листа.  
3. `excelParser.getColumns()` — чтение заголовков.  
4. Пользователь маппит колонки файла на поля системы.  
5. `excelParser.parseFile()` — парсинг и валидация.  
6. Предпросмотр данных + список ошибок.  
7. Импорт в систему (и возможная отправка на backend).  

### 8.2 Структура данных 1C-файлов

**Обязательные поля:**

- `code` — уникальный код товара (1С),
- `name` — наименование.

**Опциональные:**

- `article` — артикул,
- `category` — категория,
- `base_price` — розничная цена,
- `cost_price` — себестоимость,
- `brand` — бренд,
- `collection` — коллекция.

### 8.3 Маппинг колонок

```ts
interface ColumnMapping {
  code: string;
  name: string;
  article?: string;
  category?: string;
  base_price?: string;
  cost_price?: string;
  brand?: string;
  collection?: string;
}
```

### 8.4 Валидация и ошибки

- Проверка обязательных полей (`code`),
- Проверка числовых полей (цены, количества),
- Формирование списка ошибок вида:

```ts
{
  row: number;
  field: string;
  error: string;
}
```

### 8.5 История загрузок

Хранится история загрузок:

```ts
interface UploadResult {
  id: number;
  filename: string;
  uploaded_at: string;
  user: string;
  status: "success" | "error" | "partial";
  total_rows: number;
  imported: number;
  updated: number;
  errors: number;
  errors_log?: { row: number; field: string; error: string }[];
}
```

---

## 9. Cross-System Mapping (VK → Yandex Market → 1C)

### 9.1 Маппинг товаров

- Yandex Market: `offerId`, `shopSku`, `offerName`.
- 1C: `Номенклатура.Код`, `Артикул`, `Наименование`.

Единый `product_id` в `dim_products` может формироваться, например, как:

```text
product_id = hash(1c_code || shopSku || offerId)
```

Настроечная стратегия:

- приоритет — `1c_code` (если есть),
- fallback — `shopSku`,
- fallback 2 — `offerId`.

### 9.2 Связь заказов Маркета и продаж 1С

Для сквозной аналитики:

- из Маркета берётся `order.id` и при импорте в 1С должен сохраняться в отдельном реквизите документа (например, «Внешний номер заказа»),
- `fact_yandex_orders.order_id` ↔ `fact_1c_sales.external_order_id`.

Если поле в 1С пока не заведено — это нужно предусмотреть в регламенте и доработке.

### 9.3 Связь рекламных показателей VK и заказов

Логическая воронка:

1. `fact_vk_ads` — показы, клики, расходы по `campaign_id`, `banner_id`, `date`.  
2. `fact_yandex_orders` — заказы по датам и кампаниям (при наличии разметки).  
3. `fact_1c_sales` — факт продаж (выручка, маржа).

На первых этапах связь делается:

- по периоду (date),
- по кампаниям/каналам,
- позднее — по UTM-меткам и более точным айдишникам.

### 9.4 Карта полей (примерная)

| Сущность | Yandex Market                  | VK Ads                 | 1C                             | Data Model              |
|----------|--------------------------------|------------------------|--------------------------------|-------------------------|
| Товар    | `offerId`, `shopSku`, `name`  | —                      | `Код`, `Артикул`, `Наименование` | `dim_products.*`     |
| Заказ    | `order.id`, `creationDate`    | —                      | `Внешний номер`, `Документ`     | `fact_yandex_orders`, `fact_1c_sales` |
| Клиент   | (ограничено API)              | —                      | `Контрагент`                   | *(на перспективу)*      |
| Кампания | `campaignId`                  | `campaign_id`          | —                              | `dim_campaigns`         |

---

## 10. Deduplication & Data Quality

### 10.1 Дедупликация через кэш

- ключи кэша включают все параметры запроса (`date_from`, `date_to`, ids), чтобы разные выборки не смешивались,
- при наличии данных в кэше — запрос к внешнему API не делается.

### 10.2 Дедупликация при пагинации

При сборе заказов по страницам:

- собранные заказы для кампаний объединяются,
- каждому заказу добавляется `campaignId`,
- при необходимости можно дополнительно фильтровать по `order.id`.

### 10.3 Дедупликация по ID

Рекомендованный утилитарный метод:

```ts
function deduplicateOrders(orders: Order[]): Order[] {
  const seen = new Set<number>();
  return orders.filter(order => {
    if (seen.has(order.id)) return false;
    seen.add(order.id);
    return true;
  });
}
```

---

## 11. Logging & Monitoring

Сейчас используется базовое логирование через `console.log/warn/error`:

- логируются запросы к API,
- попадания/промахи кэша,
- ошибки VK/Yandex.

Рекомендуемое развитие:

- добавить структурированное логирование (например, `winston` / `pino`),
- собирать события в отдельную таблицу `analytics_events`,
- агрегировать метрики (среднее время ответа, hit-rate кэша, количество ошибок по источникам).

Пример структуры события:

```ts
interface AnalyticsEvent {
  event: string;
  source: string;
  endpoint?: string;
  duration?: number;
  cacheHit?: boolean;
  recordsCount?: number;
  error?: string;
  userId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}
```

---

## 12. Future Extensions / Roadmap

Планируемые и возможные доработки:

1. **Полноценная интеграция 1С**: автоматический экспорт продаж, себестоимости, остатков.  
2. **RFM-анализ клиентов** (если появятся данные по клиентам).  
3. **ABC/XYZ анализ номенклатуры** для оптимизации склада.  
4. **Executive Dashboard** с акцентом на:
   - общую выручку и маржу,
   - вклад каналов,
   - проблемные категории/товары,
   - оборачиваемость складов.  
5. **Отдельная аналитическая БД** (ClickHouse / Postgres + OLAP) при росте объёмов данных.  
6. **Интеграция с внешними системами мониторинга**: Sentry, DataDog и т.п.

---

**Документ создан:** Декабрь 2025  
**Версия:** 3.0  
**Статус:** Актуально, базовый референс для разработки и аналитики
