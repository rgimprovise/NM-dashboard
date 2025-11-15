# 🔌 API Endpoints Reference - Справочник для разработки

**Версия API:** v1  
**Base URL:** `/api/v1`  
**Формат:** JSON  
**Дата:** 12 ноября 2025

---

## 📋 Содержание

1. [Dashboard](#dashboard-endpoints)
2. [Marketing](#marketing-endpoints)
3. [Sales](#sales-endpoints)
4. [Products & Inventory](#products--inventory-endpoints)
5. [1C Integration](#1c-integration-endpoints)
6. [Reports](#reports-endpoints)
7. [Settings](#settings-endpoints)
8. [Общие принципы](#общие-принципы)

---

## Dashboard Endpoints

### GET `/dashboard/summary`

**Описание:** Получить общую сводку для главной страницы

**Query параметры:**
```
period: string = "30d"  // 7d|30d|90d|custom
date_from: string?      // YYYY-MM-DD (если period=custom)
date_to: string?        // YYYY-MM-DD (если period=custom)
```

**Пример запроса:**
```bash
GET /api/v1/dashboard/summary?period=30d
GET /api/v1/dashboard/summary?period=custom&date_from=2025-10-01&date_to=2025-11-12
```

**Response 200:**
```json
{
  "period": {
    "from": "2025-10-13",
    "to": "2025-11-12",
    "days": 30
  },
  "metrics": {
    "total_revenue": 2547000.00,
    "total_revenue_prev": 2260000.00,
    "total_revenue_change": 12.7,
    
    "total_orders": 147,
    "total_orders_prev": 140,
    "total_orders_change": 5.0,
    
    "ad_spend": 850000.00,
    "ad_spend_prev": 785000.00,
    "ad_spend_change": 8.3,
    
    "roas": 2.94,
    "roas_prev": 3.01,
    "roas_change": -2.3,
    
    "aov": 17320.41,
    "aov_prev": 16142.86,
    "aov_change": 7.3,
    
    "conversion_rate": 1.24,
    "conversion_rate_prev": 1.18,
    "conversion_rate_change": 5.1,
    
    "total_clicks": 11854,
    "total_shows": 568420,
    "ctr": 2.09,
    "cpc": 71.70
  }
}
```

---

### GET `/dashboard/revenue-chart`

**Описание:** Данные для графика выручки и расходов

**Query параметры:**
```
date_from: string       // YYYY-MM-DD
date_to: string         // YYYY-MM-DD
group_by: string = "day" // day|week|month
```

**Пример запроса:**
```bash
GET /api/v1/dashboard/revenue-chart?date_from=2025-11-01&date_to=2025-11-12&group_by=day
```

**Response 200:**
```json
{
  "period": {
    "from": "2025-11-01",
    "to": "2025-11-12",
    "group_by": "day"
  },
  "data": [
    {
      "date": "2025-11-01",
      "revenue": 185000.00,
      "ad_spend": 68000.00,
      "orders": 11,
      "clicks": 980,
      "roas": 2.72
    },
    {
      "date": "2025-11-02",
      "revenue": 220000.00,
      "ad_spend": 72000.00,
      "orders": 13,
      "clicks": 1050,
      "roas": 3.06
    }
    // ... остальные дни
  ],
  "summary": {
    "total_revenue": 2547000.00,
    "total_ad_spend": 850000.00,
    "total_orders": 147,
    "avg_roas": 2.94
  }
}
```

---

### GET `/dashboard/top-products`

**Описание:** Топ товаров по продажам

**Query параметры:**
```
limit: int = 5          // Количество товаров
date_from: string       // YYYY-MM-DD
date_to: string         // YYYY-MM-DD
sort_by: string = "revenue"  // revenue|orders|avg_price
```

**Response 200:**
```json
{
  "products": [
    {
      "product_id": 12345,
      "offer_id": "KUH-MOD-001",
      "name": "Кухня 'Модерн' белый глянец 3.2м",
      "category": "Кухонные гарнитуры",
      "orders": 125,
      "total_quantity": 128,
      "revenue": 850000.00,
      "share": 33.4,
      "avg_price": 6640.63,
      "image_url": null
    },
    {
      "product_id": 12346,
      "offer_id": "SHKF-KLAS-002",
      "name": "Шкаф 'Классик' 4-дверный дуб",
      "category": "Шкафы",
      "orders": 98,
      "total_quantity": 105,
      "revenue": 520000.00,
      "share": 20.4,
      "avg_price": 4952.38,
      "image_url": null
    }
    // ... еще 3 товара
  ],
  "total_revenue": 2547000.00
}
```

---

### GET `/dashboard/geography`

**Описание:** География продаж по регионам

**Query параметры:**
```
date_from: string       // YYYY-MM-DD
date_to: string         // YYYY-MM-DD
limit: int = 10         // Топ N регионов
```

**Response 200:**
```json
{
  "regions": [
    {
      "region": "Москва",
      "orders": 66,
      "revenue": 1146150.00,
      "share": 45.0,
      "avg_order_value": 17366.67
    },
    {
      "region": "Санкт-Петербург",
      "orders": 32,
      "revenue": 560340.00,
      "share": 22.0,
      "avg_order_value": 17510.63
    }
    // ... еще 8 регионов
  ],
  "total_orders": 147,
  "total_revenue": 2547000.00,
  "regions_count": 45
}
```

---

## Marketing Endpoints

### GET `/marketing/campaigns`

**Описание:** Список рекламных кампаний VK

**Query параметры:**
```
status: string?         // active|stopped|deleted|all
ad_plan_id: int?       // Фильтр по кабинету
search: string?         // Поиск по названию
sort_by: string = "spent"  // id|name|spent|roas|ctr|status
order: string = "desc"  // asc|desc
limit: int = 20         // Записей на странице
offset: int = 0         // Смещение для пагинации
date_from: string?      // Для статистики
date_to: string?        // Для статистики
```

**Пример запроса:**
```bash
GET /api/v1/marketing/campaigns?status=active&limit=20&offset=0&sort_by=spent&order=desc
```

**Response 200:**
```json
{
  "items": [
    {
      "id": 5028691,
      "name": "Кухни Москва | Ремаркетинг",
      "status": "active",
      "ad_plan_id": 8798776,
      "budget_limit": 500000.00,
      "budget_limit_day": 20000.00,
      "spent": 487300.00,
      "created_at": "2025-09-15T10:30:00Z",
      "statistics": {
        "shows": 145820,
        "clicks": 3245,
        "ctr": 2.23,
        "cpc": 150.15,
        "cpm": 3342.10,
        "conversions": 42,
        "revenue": 1450000.00,
        "roas": 2.98
      }
    }
    // ... еще кампании
  ],
  "total": 55,
  "page": 1,
  "pages": 3,
  "limit": 20
}
```

---

### GET `/marketing/campaigns/:id`

**Описание:** Детальная информация о кампании

**Path параметры:**
```
id: int  // ID кампании
```

**Query параметры:**
```
date_from: string?  // Для статистики
date_to: string?    // Для статистики
```

**Response 200:**
```json
{
  "campaign": {
    "id": 5028691,
    "name": "Кухни Москва | Ремаркетинг",
    "status": "active",
    "ad_plan_id": 8798776,
    "ad_plan_name": "Реклама на кухни / все города",
    "budget_limit": 500000.00,
    "budget_limit_day": 20000.00,
    "spent": 487300.00,
    "budget_remaining": 12700.00,
    "created_at": "2025-09-15T10:30:00Z",
    "updated_at": "2025-11-12T14:20:00Z"
  },
  "statistics": {
    "period": {
      "from": "2025-10-13",
      "to": "2025-11-12"
    },
    "summary": {
      "shows": 145820,
      "clicks": 3245,
      "spent": 487300.00,
      "conversions": 42,
      "ctr": 2.23,
      "cpc": 150.15,
      "cpm": 3342.10,
      "revenue": 1450000.00,
      "roas": 2.98
    },
    "daily": [
      {
        "date": "2025-11-01",
        "shows": 5240,
        "clicks": 118,
        "spent": 17700.00,
        "conversions": 2,
        "ctr": 2.25,
        "cpc": 150.00
      }
      // ... по дням
    ]
  },
  "ad_groups_count": 3,
  "ads_count": 12
}
```

---

### GET `/marketing/statistics`

**Описание:** Гибкая статистика с группировкой

**Query параметры:**
```
campaign_ids: array[int]?  // Фильтр по кампаниям
date_from: string           // YYYY-MM-DD
date_to: string             // YYYY-MM-DD
group_by: array[string] = ["date"]  // date|campaign_id|banner_id
metrics: array[string]?     // shows,clicks,spent,ctr,cpc,cpm,conversions
```

**Response 200:**
```json
{
  "period": {
    "from": "2025-11-01",
    "to": "2025-11-12"
  },
  "group_by": ["date", "campaign_id"],
  "rows": [
    {
      "date": "2025-11-01",
      "campaign_id": 5028691,
      "shows": 5240,
      "clicks": 118,
      "spent": 17700.00,
      "ctr": 2.25,
      "cpc": 150.00,
      "cpm": 3377.86
    }
    // ... еще строки
  ],
  "summary": {
    "shows": 568420,
    "clicks": 11854,
    "spent": 850000.00,
    "avg_ctr": 2.09,
    "avg_cpc": 71.70
  }
}
```

---

### GET `/marketing/demographics`

**Описание:** Статистика по демографии (пол, возраст)

**Query параметры:**
```
campaign_ids: array[int]?
date_from: string
date_to: string
```

**Response 200:**
```json
{
  "demographics": [
    {
      "sex": "male",
      "age": "25-34",
      "shows": 85420,
      "clicks": 2140,
      "spent": 321000.00,
      "ctr": 2.51,
      "cpc": 150.00,
      "share": 18.1
    },
    {
      "sex": "female",
      "age": "25-34",
      "shows": 120540,
      "clicks": 2850,
      "spent": 427500.00,
      "ctr": 2.36,
      "cpc": 150.00,
      "share": 24.0
    }
    // ... другие группы
  ],
  "summary": {
    "total_shows": 568420,
    "total_clicks": 11854,
    "total_spent": 850000.00
  }
}
```

---

### POST `/marketing/campaigns/compare`

**Описание:** Сравнение нескольких кампаний

**Body:**
```json
{
  "campaign_ids": [5028691, 5028692, 5028693],
  "date_from": "2025-10-13",
  "date_to": "2025-11-12"
}
```

**Response 200:**
```json
{
  "campaigns": [
    {
      "id": 5028691,
      "name": "Кухни Москва | Ремаркетинг",
      "spent": 487300.00,
      "revenue": 1450000.00,
      "roas": 2.98,
      "shows": 145820,
      "clicks": 3245,
      "ctr": 2.23,
      "cpc": 150.15,
      "conversions": 42
    }
    // ... другие кампании
  ],
  "best_campaign": {
    "id": 5028691,
    "reason": "Highest ROAS (2.98)"
  }
}
```

---

## Sales Endpoints

### GET `/sales/orders`

**Описание:** Список заказов

**Query параметры:**
```
status: string?         // PROCESSING|DELIVERY|DELIVERED|CANCELLED|all
date_from: string?      // YYYY-MM-DD
date_to: string?        // YYYY-MM-DD
region: string?         // Фильтр по региону
min_total: float?       // Минимальная сумма
max_total: float?       // Максимальная сумма
search: string?         // Поиск по ID заказа
sort_by: string = "creation_date"  // id|creation_date|total|region|status
order: string = "desc"  // asc|desc
limit: int = 20
offset: int = 0
```

**Response 200:**
```json
{
  "items": [
    {
      "id": 87654321,
      "campaign_id": 21621656,
      "status": "DELIVERED",
      "creation_date": "2025-11-10T14:30:00Z",
      "items_total": 65000.00,
      "delivery_cost": 2000.00,
      "total": 67000.00,
      "region": "Москва",
      "items_count": 2
    }
    // ... еще заказы
  ],
  "total": 147,
  "page": 1,
  "pages": 8,
  "limit": 20
}
```

---

### GET `/sales/orders/:id`

**Описание:** Детали заказа

**Response 200:**
```json
{
  "order": {
    "id": 87654321,
    "campaign_id": 21621656,
    "campaign_name": "Недорогая-мебель.РФ",
    "status": "DELIVERED",
    "creation_date": "2025-11-10T14:30:00Z",
    "delivery_date": "2025-11-15T00:00:00Z",
    "items_total": 65000.00,
    "delivery_cost": 2000.00,
    "total": 67000.00,
    "region": "Москва",
    "delivery_address": "г. Москва, ул. Примерная, д. 10"
  },
  "items": [
    {
      "id": 1,
      "offer_id": "KUH-MOD-001",
      "offer_name": "Кухня 'Модерн' белый глянец 3.2м",
      "price": 45000.00,
      "count": 1,
      "total": 45000.00,
      "product": {
        "id": 12345,
        "category": "Кухонные гарнитуры",
        "current_price": 45000.00,
        "availability": true,
        "c1_product": {
          "code": "00001234",
          "base_price": 48000.00,
          "cost_price": 32000.00,
          "margin": 40.6
        }
      }
    },
    {
      "id": 2,
      "offer_id": "STOL-OB-015",
      "offer_name": "Стол обеденный 'Венеция' дуб 180x90",
      "price": 20000.00,
      "count": 1,
      "total": 20000.00,
      "product": {
        "id": 12350,
        "category": "Столы",
        "current_price": 20000.00,
        "availability": true,
        "c1_product": null
      }
    }
  ],
  "profit": {
    "items_cost": 32000.00,
    "items_revenue": 65000.00,
    "gross_profit": 33000.00,
    "margin_percent": 50.8
  }
}
```

---

### GET `/sales/products-performance`

**Описание:** Эффективность товаров

**Query параметры:**
```
date_from: string
date_to: string
category: string?
sort_by: string = "revenue"  // revenue|orders|margin|velocity
limit: int = 50
offset: int = 0
```

**Response 200:**
```json
{
  "products": [
    {
      "product_id": 12345,
      "offer_id": "KUH-MOD-001",
      "name": "Кухня 'Модерн' белый глянец 3.2м",
      "category": "Кухонные гарнитуры",
      "orders_count": 125,
      "total_quantity": 128,
      "revenue": 850000.00,
      "share": 33.4,
      "avg_price": 6640.63,
      "current_price": 45000.00,
      "stock": 15,
      "velocity": 4.3,
      "stock_coverage_days": 3,
      "c1_data": {
        "code": "00001234",
        "base_price": 48000.00,
        "cost_price": 32000.00,
        "margin_percent": 40.6
      }
    }
    // ... еще товары
  ],
  "total": 450,
  "total_revenue": 2547000.00
}
```

---

### GET `/sales/categories-analysis`

**Описание:** Анализ категорий

**Query параметры:**
```
date_from: string
date_to: string
```

**Response 200:**
```json
{
  "categories": [
    {
      "category": "Кухонные гарнитуры",
      "orders": 125,
      "revenue": 850000.00,
      "share": 33.4,
      "avg_order_value": 6800.00,
      "products_count": 45,
      "growth": 12.5
    },
    {
      "category": "Шкафы",
      "orders": 98,
      "revenue": 520000.00,
      "share": 20.4,
      "avg_order_value": 5306.12,
      "products_count": 78,
      "growth": -3.2
    }
    // ... другие категории
  ],
  "total_revenue": 2547000.00,
  "categories_count": 12
}
```

---

## Products & Inventory Endpoints

### GET `/products`

**Описание:** Список товаров

**Query параметры:**
```
category: string?
availability: string?   // in_stock|out_of_stock|low_stock|all
search: string?         // По названию/артикулу
has_c1_mapping: bool?   // true|false
sort_by: string = "name"  // name|price|stock|sales
order: string = "asc"
limit: int = 50
offset: int = 0
```

**Response 200:**
```json
{
  "items": [
    {
      "id": 12345,
      "offer_id": "KUH-MOD-001",
      "name": "Кухня 'Модерн' белый глянец 3.2м",
      "category": "Кухонные гарнитуры",
      "price": 45000.00,
      "availability": true,
      "stock_total": 15,
      "stock_status": "in_stock",
      "has_c1_mapping": true,
      "c1_product": {
        "code": "00001234",
        "base_price": 48000.00,
        "margin": -6.25
      },
      "last_updated": "2025-11-12T14:00:00Z"
    }
    // ... еще товары
  ],
  "total": 450,
  "filters": {
    "categories": ["Кухонные гарнитуры", "Шкафы", "Столы", "..."],
    "in_stock_count": 380,
    "out_of_stock_count": 45,
    "low_stock_count": 25
  }
}
```

---

### GET `/products/:id`

**Описание:** Детальная информация о товаре

**Response 200:**
```json
{
  "product": {
    "id": 12345,
    "offer_id": "KUH-MOD-001",
    "name": "Кухня 'Модерн' белый глянец 3.2м",
    "category": "Кухонные гарнитуры",
    "vendor": "Фабрика Мебели №1",
    "price": 45000.00,
    "availability": true,
    "description": "Современная кухня в стиле модерн...",
    "created_at": "2025-01-15T10:00:00Z",
    "updated_at": "2025-11-12T14:00:00Z"
  },
  "stocks": [
    {
      "warehouse_id": "MSK-001",
      "warehouse_name": "Склад Москва",
      "count": 10
    },
    {
      "warehouse_id": "SPB-001",
      "warehouse_name": "Склад СПБ",
      "count": 5
    }
  ],
  "stock_total": 15,
  "stock_coverage_days": 3,
  "c1_product": {
    "code": "00001234",
    "name": "Кухня Модерн 3200 белый глянец",
    "article": "KUH-MOD-001",
    "category": "Кухни",
    "base_price": 48000.00,
    "cost_price": 32000.00,
    "margin": -6.25,
    "brand": "Собственное производство",
    "collection": "Модерн 2024"
  },
  "sales_stats": {
    "period": "last_30_days",
    "orders": 125,
    "quantity": 128,
    "revenue": 850000.00,
    "avg_price": 6640.63,
    "velocity": 4.3
  },
  "price_history": [
    {"date": "2025-10-01", "price": 45000.00},
    {"date": "2025-09-15", "price": 47000.00},
    {"date": "2025-09-01", "price": 47000.00}
  ],
  "reviews": {
    "average_rating": 4.7,
    "total_reviews": 23,
    "distribution": {
      "5": 15,
      "4": 6,
      "3": 1,
      "2": 1,
      "1": 0
    },
    "recent": [
      {
        "id": 123,
        "rating": 5,
        "text": "Отличная кухня! Качество супер!",
        "author": "Иван С.",
        "date": "2025-11-10"
      }
    ]
  }
}
```

---

### GET `/inventory/stocks`

**Описание:** Остатки товаров

**Query параметры:**
```
low_stock: bool?        // Только с низким остатком
out_of_stock: bool?     // Только без остатков
warehouse_id: string?   // Фильтр по складу
category: string?
limit: int = 50
offset: int = 0
```

**Response 200:**
```json
{
  "items": [
    {
      "product_id": 12345,
      "offer_id": "KUH-MOD-001",
      "name": "Кухня 'Модерн' белый глянец 3.2м",
      "category": "Кухонные гарнитуры",
      "stock_total": 15,
      "stock_status": "in_stock",
      "velocity": 4.3,
      "coverage_days": 3,
      "warehouses": [
        {"id": "MSK-001", "name": "Москва", "count": 10},
        {"id": "SPB-001", "name": "СПБ", "count": 5}
      ],
      "updated_at": "2025-11-12T14:00:00Z"
    }
  ],
  "total": 450
}
```

---

### GET `/inventory/alerts`

**Описание:** Алерты по складу

**Response 200:**
```json
{
  "out_of_stock": [
    {
      "product_id": 12400,
      "offer_id": "DIV-LUX-020",
      "name": "Диван 'Люкс' угловой серый",
      "category": "Диваны",
      "last_sale": "2025-11-10",
      "days_out_of_stock": 3,
      "lost_orders_estimate": 5
    }
  ],
  "low_stock": [
    {
      "product_id": 12345,
      "offer_id": "KUH-MOD-001",
      "name": "Кухня 'Модерн' белый глянец 3.2м",
      "category": "Кухонные гарнитуры",
      "stock_total": 15,
      "velocity": 4.3,
      "coverage_days": 3,
      "reorder_recommended": true
    }
  ],
  "slow_moving": [
    {
      "product_id": 12500,
      "offer_id": "KRES-VIN-035",
      "name": "Кресло 'Винтаж' кожа коричневая",
      "category": "Кресла",
      "stock_total": 25,
      "last_sale": "2025-09-15",
      "days_without_sales": 58
    }
  ],
  "counts": {
    "out_of_stock": 45,
    "low_stock": 25,
    "slow_moving": 32
  }
}
```

---

## 1C Integration Endpoints

### POST `/upload/1c-nomenclature`

**Описание:** Загрузка номенклатуры из 1C

**Content-Type:** `multipart/form-data`

**Form fields:**
```
file: File              // CSV или XLSX файл
encoding: string = "utf-8"  // utf-8|windows-1251|cp1251
separator: string = ";"     // Для CSV: ;|,|\t
sheet_name: string?         // Для Excel
header_row: int = 1         // Номер строки с заголовками
mapping: JSON           // Маппинг колонок
```

**Mapping JSON:**
```json
{
  "code": "Код товара",
  "name": "Наименование",
  "article": "Артикул",
  "category": "Категория",
  "base_price": "Базовая цена",
  "cost_price": "Себестоимость",
  "brand": "Бренд",
  "collection": "Коллекция"
}
```

**Response 200:**
```json
{
  "success": true,
  "imported": 150,
  "updated": 45,
  "errors": 5,
  "details": {
    "filename": "nomenclature_2025-11-12.xlsx",
    "total_rows": 200,
    "processed": 195,
    "created": 150,
    "updated": 45,
    "skipped": 5,
    "duration_seconds": 12
  },
  "errors_log": [
    {
      "row": 15,
      "field": "base_price",
      "error": "Неверный формат числа"
    },
    {
      "row": 42,
      "field": "code",
      "error": "Дублирующийся код товара"
    }
  ],
  "log_file_url": "/api/v1/uploads/logs/123456.txt"
}
```

---

### GET `/upload/history`

**Описание:** История загрузок

**Query параметры:**
```
limit: int = 20
offset: int = 0
```

**Response 200:**
```json
{
  "items": [
    {
      "id": 123,
      "filename": "nomenclature_2025-11-12.xlsx",
      "uploaded_at": "2025-11-12T10:30:00Z",
      "user": "admin",
      "status": "success",
      "total_rows": 200,
      "imported": 150,
      "updated": 45,
      "errors": 5,
      "log_url": "/api/v1/uploads/logs/123456.txt"
    }
  ],
  "total": 15
}
```

---

### GET `/mapping/products`

**Описание:** Получить маппинг товаров

**Query параметры:**
```
unmapped_only: bool?    // Только несвязанные
confidence_min: float?  // Минимальная уверенность (0-1)
limit: int = 50
offset: int = 0
```

**Response 200:**
```json
{
  "mappings": [
    {
      "id": 1,
      "c1_code": "00001234",
      "c1_name": "Кухня Модерн 3200 белый глянец",
      "c1_article": "KUH-MOD-001",
      "yandex_offer_id": "KUH-MOD-001",
      "yandex_name": "Кухня 'Модерн' белый глянец 3.2м",
      "mapping_type": "auto",
      "confidence": 1.0,
      "created_at": "2025-11-01T12:00:00Z"
    },
    {
      "id": 2,
      "c1_code": "00001235",
      "c1_name": "Кухня Модерн 2800 дуб",
      "c1_article": "KUH-MOD-002",
      "yandex_offer_id": null,
      "yandex_name": null,
      "mapping_type": null,
      "confidence": null,
      "created_at": null
    }
  ],
  "total": 450,
  "mapped": 380,
  "unmapped": 70
}
```

---

### POST `/mapping/products`

**Описание:** Создать/обновить маппинг товара

**Body:**
```json
{
  "c1_code": "00001235",
  "yandex_offer_id": "KUH-MOD-002"
}
```

**Response 200:**
```json
{
  "success": true,
  "mapping": {
    "id": 71,
    "c1_code": "00001235",
    "yandex_offer_id": "KUH-MOD-002",
    "mapping_type": "manual",
    "confidence": 1.0,
    "created_at": "2025-11-12T15:45:00Z"
  }
}
```

---

### POST `/mapping/auto`

**Описание:** Автоматический маппинг

**Body:**
```json
{
  "confidence_threshold": 0.8,
  "method": "article"  // article|name|both
}
```

**Response 200:**
```json
{
  "success": true,
  "mapped": 45,
  "suggested": [
    {
      "c1_code": "00001240",
      "c1_name": "Шкаф Классик 4-дверный дуб",
      "yandex_offer_id": "SHKF-KLAS-002",
      "yandex_name": "Шкаф 'Классик' 4-дверный дуб",
      "confidence": 0.85,
      "match_reason": "Name similarity 85%"
    }
  ]
}
```

---

## Reports Endpoints

### GET `/reports/templates`

**Описание:** Список шаблонов отчетов

**Response 200:**
```json
{
  "templates": [
    {
      "id": "marketing",
      "name": "Отчет по маркетингу",
      "description": "Статистика всех рекламных кампаний",
      "parameters": ["date_from", "date_to", "campaign_ids"],
      "formats": ["pdf", "xlsx", "csv"]
    },
    {
      "id": "sales",
      "name": "Отчет по продажам",
      "description": "Заказы, товары, выручка",
      "parameters": ["date_from", "date_to", "status", "region"],
      "formats": ["pdf", "xlsx", "csv"]
    }
  ]
}
```

---

### POST `/reports/generate`

**Описание:** Сгенерировать отчет

**Body:**
```json
{
  "template_id": "marketing",
  "format": "pdf",
  "parameters": {
    "date_from": "2025-10-13",
    "date_to": "2025-11-12",
    "campaign_ids": [5028691, 5028692]
  }
}
```

**Response 200:**
```json
{
  "success": true,
  "report_id": "rpt_abc123",
  "file_url": "/api/v1/reports/files/rpt_abc123.pdf",
  "expires_at": "2025-11-13T15:45:00Z",
  "size_bytes": 524288
}
```

---

## Settings Endpoints

### GET `/settings/api-tokens`

**Описание:** Статус API токенов

**Response 200:**
```json
{
  "yandex": {
    "configured": true,
    "status": "active",
    "campaign_id": "21621656",
    "last_check": "2025-11-12T14:30:00Z",
    "last_check_result": "success"
  },
  "vk": {
    "configured": true,
    "status": "active",
    "account_id": "8798776",
    "expires_at": "2025-11-13T10:30:00Z",
    "hours_until_expiry": 20,
    "last_check": "2025-11-12T14:30:00Z",
    "last_check_result": "success"
  }
}
```

---

### POST `/settings/api-tokens/test`

**Описание:** Тест подключения к API

**Body:**
```json
{
  "provider": "yandex"  // yandex|vk
}
```

**Response 200:**
```json
{
  "success": true,
  "provider": "yandex",
  "message": "Connection successful",
  "details": {
    "campaigns_count": 6,
    "current_campaign": "21621656"
  }
}
```

---

### GET `/settings/sync-status`

**Описание:** Статус синхронизации

**Response 200:**
```json
{
  "sources": [
    {
      "name": "yandex_orders",
      "display_name": "Яндекс.Маркет - Заказы",
      "frequency": "hourly",
      "last_sync": "2025-11-12T15:00:00Z",
      "next_sync": "2025-11-12T16:00:00Z",
      "status": "success",
      "records_processed": 5,
      "duration_seconds": 12
    },
    {
      "name": "yandex_products",
      "display_name": "Яндекс.Маркет - Товары",
      "frequency": "every_4_hours",
      "last_sync": "2025-11-12T12:00:00Z",
      "next_sync": "2025-11-12T16:00:00Z",
      "status": "success",
      "records_processed": 450,
      "duration_seconds": 45
    },
    {
      "name": "vk_statistics",
      "display_name": "VK Ads - Статистика",
      "frequency": "hourly",
      "last_sync": "2025-11-12T15:00:00Z",
      "next_sync": "2025-11-12T16:00:00Z",
      "status": "success",
      "records_processed": 55,
      "duration_seconds": 18
    }
  ],
  "overall_status": "healthy"
}
```

---

### POST `/settings/sync-trigger`

**Описание:** Запустить синхронизацию вручную

**Body:**
```json
{
  "source": "yandex"  // yandex|vk|all
}
```

**Response 200:**
```json
{
  "success": true,
  "task_id": "task_abc123",
  "status": "started",
  "sources": ["yandex_orders", "yandex_products", "yandex_prices", "yandex_stocks"],
  "estimated_duration_seconds": 120
}
```

---

### GET `/settings/sync-history`

**Описание:** История синхронизаций

**Query параметры:**
```
source: string?  // Фильтр по источнику
status: string?  // success|error|partial
limit: int = 20
offset: int = 0
```

**Response 200:**
```json
{
  "items": [
    {
      "id": 12345,
      "source": "yandex_orders",
      "started_at": "2025-11-12T15:00:00Z",
      "finished_at": "2025-11-12T15:00:12Z",
      "status": "success",
      "records_processed": 5,
      "records_created": 3,
      "records_updated": 2,
      "records_failed": 0,
      "duration_seconds": 12,
      "error_message": null
    }
  ],
  "total": 500
}
```

---

## Общие принципы

### Формат дат
Все даты в формате **ISO 8601**: `YYYY-MM-DDTHH:MM:SSZ` (UTC)

### Пагинация
```
limit: количество записей
offset: смещение
```

Response всегда содержит:
```json
{
  "items": [],
  "total": 450,
  "page": 1,
  "pages": 23,
  "limit": 20
}
```

### Коды ответов
- `200` OK - успешно
- `201` Created - создано
- `400` Bad Request - неверные параметры
- `401` Unauthorized - требуется авторизация
- `404` Not Found - не найдено
- `500` Internal Server Error - ошибка сервера

### Формат ошибок
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Неверные параметры запроса",
    "details": {
      "date_from": "Неверный формат даты. Ожидается YYYY-MM-DD"
    }
  }
}
```

### Сортировка
```
sort_by: поле для сортировки
order: asc|desc
```

### Фильтрация
Query параметры с суффиксом `?` являются опциональными

### Headers
```
Content-Type: application/json
Accept: application/json
```

---

**Итого endpoints:** 35+  
**Версия:** 1.0  
**Дата:** 12 ноября 2025

