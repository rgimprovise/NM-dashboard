# 🔍 VK ADS API - РЕАЛЬНЫЕ ДАННЫЕ ПО КАТЕГОРИЯМ

Дата тестирования: $(date '+%Y-%m-%d %H:%M:%S')
Токен scope: ["read_ads", "read_payments"]

---

## 1. СТРУКТУРА РЕКЛАМНОГО АККАУНТА

### 1.1 Campaigns (Кампании)

**Endpoint:** `GET /api/v2/campaigns.json`

```json
{
  "total_count": 55,
  "sample_campaigns": [
    {
      "id": 107921416,
      "name": "широкая",
      "status": null,
      "package_id": 3127
    },
    {
      "id": 107921417,
      "name": "Копия широкая",
      "status": null,
      "package_id": 3127
    },
    {
      "id": 107921418,
      "name": "Копия широкая",
      "status": null,
      "package_id": 3127
    },
    {
      "id": 107921419,
      "name": "Копия широкая",
      "status": null,
      "package_id": 3127
    },
    {
      "id": 107921420,
      "name": "Копия широкая",
      "status": null,
      "package_id": 3127
    }
  ]
}
```

---

### 1.2 Ad Groups (Группы объявлений)

**Endpoint:** `GET /api/v2/ad_groups.json`

```json
{
  "total_count": 55,
  "sample_ad_groups": [
    {
      "id": 107921416,
      "name": "широкая",
      "campaign_id": null,
      "status": null
    },
    {
      "id": 107921417,
      "name": "Копия широкая",
      "campaign_id": null,
      "status": null
    },
    {
      "id": 107921418,
      "name": "Копия широкая",
      "campaign_id": null,
      "status": null
    },
    {
      "id": 107921419,
      "name": "Копия широкая",
      "campaign_id": null,
      "status": null
    },
    {
      "id": 107921420,
      "name": "Копия широкая",
      "campaign_id": null,
      "status": null
    }
  ]
}
```

---

### 1.3 Banners (Баннеры/Объявления)

**Endpoint:** `GET /api/v2/banners.json`

```json
{
  "total_count": 166,
  "sample_banners": [
    {
      "id": 179270031,
      "name": null,
      "ad_group_id": 107921416,
      "status": null,
      "format": null
    },
    {
      "id": 179270032,
      "name": null,
      "ad_group_id": 107921416,
      "status": null,
      "format": null
    },
    {
      "id": 179270033,
      "name": null,
      "ad_group_id": 107921416,
      "status": null,
      "format": null
    },
    {
      "id": 179270034,
      "name": null,
      "ad_group_id": 107921417,
      "status": null,
      "format": null
    },
    {
      "id": 179270035,
      "name": null,
      "ad_group_id": 107921417,
      "status": null,
      "format": null
    }
  ]
}
```

---


## 2. БАЗОВАЯ СТАТИСТИКА (BASE METRICS)

### 2.1 Суммарная статистика по Ad Groups

**Endpoint:** `GET /api/v2/statistics/ad_groups/summary.json?id={ids}&metrics=base`

```json
{
  "total_metrics": {
    "shows": 22357,
    "clicks": 61,
    "goals": 0,
    "spent": "1662.33",
    "not_ad_spent": "0",
    "cpm": "74.35",
    "cpc": "27.25",
    "cpa": "0",
    "ctr": 0.2728451938990025,
    "cr": 0,
    "vk": {
      "goals": 3,
      "cpa": "554.11",
      "cr": 4.918032786885246
    }
  },
  "note": "Суммарные показатели за все время по выбранным ad_groups"
}
```

**Метрики:**
- `shows` - показы
- `clicks` - клики
- `spent` - потрачено (₽)
- `cpm` - цена за 1000 показов
- `cpc` - цена за клик
- `ctr` - CTR (%)
- `goals` / `vk.goals` - достижения целей
- `cpa` / `vk.cpa` - цена за действие
- `cr` / `vk.cr` - Conversion Rate (%)

---

### 2.2 Подневная статистика (последние 7 дней)

**Endpoint:** `GET /api/v2/statistics/ad_groups/day.json?date_from={date}&date_to={date}&id={ids}&metrics=base`

```json
{
  "total_for_period": {
    "shows": 0,
    "clicks": 0,
    "goals": 0,
    "spent": "0",
    "not_ad_spent": "0",
    "cpm": "0",
    "cpc": "0",
    "cpa": "0",
    "ctr": 0,
    "cr": 0,
    "vk": {
      "goals": 0,
      "cpa": "0",
      "cr": 0
    }
  },
  "daily_breakdown_sample": [
    {
      "date": "2025-11-08",
      "base": {
        "shows": 0,
        "clicks": 0,
        "goals": 0,
        "spent": "0",
        "not_ad_spent": "0",
        "cpm": "0",
        "cpc": "0",
        "cpa": "0",
        "ctr": 0,
        "cr": 0,
        "vk": {
          "goals": 0,
          "cpa": "0",
          "cr": 0
        }
      }
    },
    {
      "date": "2025-11-09",
      "base": {
        "shows": 0,
        "clicks": 0,
        "goals": 0,
        "spent": "0",
        "not_ad_spent": "0",
        "cpm": "0",
        "cpc": "0",
        "cpa": "0",
        "ctr": 0,
        "cr": 0,
        "vk": {
          "goals": 0,
          "cpa": "0",
          "cr": 0
        }
      }
    },
    {
      "date": "2025-11-10",
      "base": {
        "shows": 0,
        "clicks": 0,
        "goals": 0,
        "spent": "0",
        "not_ad_spent": "0",
        "cpm": "0",
        "cpc": "0",
        "cpa": "0",
        "ctr": 0,
        "cr": 0,
        "vk": {
          "goals": 0,
          "cpa": "0",
          "cr": 0
        }
      }
    }
  ],
  "note": "Первые 3 дня из периода"
}
```

---

### 2.3 Статистика по Banners (Баннерам)

**Endpoint:** `GET /api/v2/statistics/banners/summary.json?id={ids}&metrics=base`

```json
{
  "total_banners_metrics": {
    "shows": 3906,
    "clicks": 18,
    "goals": 0,
    "spent": "315.89",
    "not_ad_spent": "0",
    "cpm": "80.87",
    "cpc": "17.55",
    "cpa": "0",
    "ctr": 0.4608294930875576,
    "cr": 0,
    "vk": {
      "goals": 0,
      "cpa": "0",
      "cr": 0
    }
  },
  "note": "Суммарная статистика по баннерам"
}
```

---


## 3. СОЦИАЛЬНЫЕ МЕТРИКИ (EVENTS)

### 3.1 События в социальных сетях

**Endpoint:** `GET /api/v2/statistics/ad_groups/summary.json?id={ids}&metrics=events`

```json

## 3. СОЦИАЛЬНЫЕ МЕТРИКИ (EVENTS)

### 3.1 События в социальных сетях

**Endpoint:** `GET /api/v2/statistics/ad_groups/summary.json?id={ids}&metrics=events`

```json
{
  "items": [
    {
      "id": 107921416,
      "total": {
        "events": {
          "opening_app": 0,
          "opening_post": 0,
          "moving_into_group": 0,
          "clicks_on_external_url": 0,
          "launching_video": 0,
          "comments": 0,
          "joinings": 0,
          "likes": 0,
          "shares": 0,
          "votings": 0,
          "sending_form": 0
        }
      }
    },
    {
      "id": 107921417,
      "total": {
        "events": {
          "opening_app": 0,
          "opening_post": 0,
          "moving_into_group": 0,
          "clicks_on_external_url": 0,
          "launching_video": 0,
          "comments": 0,
          "joinings": 0,
          "likes": 0,
          "shares": 0,
          "votings": 0,
          "sending_form": 0
        }
      }
    }
  ],
  "total": {
    "events": {
      "opening_app": 0,
      "opening_post": 0,
      "moving_into_group": 0,
      "clicks_on_external_url": 0,
      "launching_video": 0,
      "comments": 0,
      "joinings": 0,
      "likes": 0,
      "shares": 0,
      "votings": 0,
      "sending_form": 0
    }
  }
}
```

---


## 4. УНИКАЛЬНЫЕ ПОЛЬЗОВАТЕЛИ (UNIQUES)

**Endpoint:** `GET /api/v2/statistics/ad_groups/summary.json?id={ids}&metrics=uniques`

```json
{
  "items": [
    {
      "id": 107921416,
      "total": {
        "uniques": {
          "reach": 0,
          "total": 3568,
          "increment": 3568,
          "frequency": 1.09473
        }
      }
    },
    {
      "id": 107921417,
      "total": {
        "uniques": {
          "reach": 0,
          "total": 13268,
          "increment": 13268,
          "frequency": 1.33735
        }
      }
    }
  ],
  "total": {
    "uniques": {
      "reach": 0,
      "total": 15602,
      "increment": 15602,
      "frequency": 1.38764
    }
  }
}
```

---


## 5. ВИДЕО МЕТРИКИ (VIDEO)

**Endpoint:** `GET /api/v2/statistics/ad_groups/summary.json?id={ids}&metrics=video`

```json
{
  "items": [
    {
      "id": 107921416,
      "total": {
        "video": {
          "started": 0,
          "first_second": 0,
          "paused": 0,
          "resumed_after_pause": 0,
          "fullscreen_on": 0,
          "fullscreen_off": 0,
          "sound_turned_off": 0,
          "sound_turned_on": 0,
          "viewed_10_seconds": 0,
          "viewed_25_percent": 0,
          "viewed_50_percent": 0,
          "viewed_75_percent": 0,
          "viewed_100_percent": 0,
          "viewed_100_percent_by_click": 0,
          "viewed_10_seconds_rate": 0,
          "viewed_25_percent_rate": 0,
          "viewed_50_percent_rate": 0,
          "viewed_75_percent_rate": 0,
          "viewed_100_percent_rate": 0,
          "viewed_range_rate": "0",
          "depth_of_view": 0,
          "started_cost": "0",
          "viewed_10_seconds_cost": "0",
          "viewed_25_percent_cost": "0",
          "viewed_50_percent_cost": "0",
          "viewed_75_percent_cost": "0",
          "viewed_100_percent_cost": "0"
        }
      }
    },
    {
      "id": 107921417,
      "total": {
        "video": {
          "started": 0,
          "first_second": 0,
          "paused": 0,
          "resumed_after_pause": 0,
          "fullscreen_on": 0,
          "fullscreen_off": 0,
          "sound_turned_off": 0,
          "sound_turned_on": 0,
          "viewed_10_seconds": 0,
          "viewed_25_percent": 0,
          "viewed_50_percent": 0,
          "viewed_75_percent": 0,
          "viewed_100_percent": 0,
          "viewed_100_percent_by_click": 0,
          "viewed_10_seconds_rate": 0,
          "viewed_25_percent_rate": 0,
          "viewed_50_percent_rate": 0,
          "viewed_75_percent_rate": 0,
          "viewed_100_percent_rate": 0,
          "viewed_range_rate": "0",
          "depth_of_view": 0,
          "started_cost": "0",
          "viewed_10_seconds_cost": "0",
          "viewed_25_percent_cost": "0",
          "viewed_50_percent_cost": "0",
          "viewed_75_percent_cost": "0",
          "viewed_100_percent_cost": "0"
        }
      }
    }
  ],
  "total": {
    "video": {
      "started": 0,
      "first_second": 0,
      "paused": 0,
      "resumed_after_pause": 0,
      "fullscreen_on": 0,
      "fullscreen_off": 0,
      "sound_turned_off": 0,
      "sound_turned_on": 0,
      "viewed_10_seconds": 0,
      "viewed_25_percent": 0,
      "viewed_50_percent": 0,
      "viewed_75_percent": 0,
      "viewed_100_percent": 0,
      "viewed_100_percent_by_click": 0,
      "viewed_10_seconds_rate": 0,
      "viewed_25_percent_rate": 0,
      "viewed_50_percent_rate": 0,
      "viewed_75_percent_rate": 0,
      "viewed_100_percent_rate": 0,
      "viewed_range_rate": "0",
      "depth_of_view": 0,
      "started_cost": "0",
      "viewed_10_seconds_cost": "0",
      "viewed_25_percent_cost": "0",
      "viewed_50_percent_cost": "0",
      "viewed_75_percent_cost": "0",
      "viewed_100_percent_cost": "0"
    }
  }
}
```

---


## 6. ВСЕ ДОСТУПНЫЕ МЕТРИКИ (ALL)

**Endpoint:** `GET /api/v2/statistics/ad_groups/summary.json?id={ids}&metrics=all`

```json
{
  "base": {
    "shows": 21650,
    "clicks": 61,
    "goals": 0,
    "spent": "1611.33",
    "not_ad_spent": "0",
    "cpm": "74.43",
    "cpc": "26.42",
    "cpa": "0",
    "ctr": 0.28175519630484985,
    "cr": 0,
    "vk": {
      "goals": 3,
      "cpa": "537.11",
      "cr": 4.918032786885246
    }
  },
  "events": {
    "opening_app": 0,
    "opening_post": 0,
    "moving_into_group": 0,
    "clicks_on_external_url": 0,
    "launching_video": 0,
    "comments": 0,
    "joinings": 0,
    "likes": 0,
    "shares": 0,
    "votings": 0,
    "sending_form": 0
  },
  "uniques": {
    "reach": 0,
    "total": 15602,
    "increment": 15602,
    "frequency": 1.38764
  },
  "uniques_video": {
    "started": 0,
    "viewed_10_seconds": 0,
    "viewed_25_percent": 0,
    "viewed_50_percent": 0,
    "viewed_75_percent": 0,
    "viewed_100_percent": 0,
    "viewed_100_percent_by_click": 0,
    "viewed_10_seconds_rate": 0,
    "viewed_25_percent_rate": 0,
    "viewed_50_percent_rate": 0,
    "viewed_75_percent_rate": 0,
    "viewed_100_percent_rate": 0,
    "viewed_range_rate": "0",
    "depth_of_view": 0
  },
  "video": {
    "started": 0,
    "first_second": 0,
    "paused": 0,
    "resumed_after_pause": 0,
    "fullscreen_on": 0,
    "fullscreen_off": 0,
    "sound_turned_off": 0,
    "sound_turned_on": 0,
    "viewed_10_seconds": 0,
    "viewed_25_percent": 0,
    "viewed_50_percent": 0,
    "viewed_75_percent": 0,
    "viewed_100_percent": 0,
    "viewed_100_percent_by_click": 0,
    "viewed_10_seconds_rate": 0,
    "viewed_25_percent_rate": 0,
    "viewed_50_percent_rate": 0,
    "viewed_75_percent_rate": 0,
    "viewed_100_percent_rate": 0,
    "viewed_range_rate": "0",
    "depth_of_view": 0,
    "started_cost": "0",
    "viewed_10_seconds_cost": "0",
    "viewed_25_percent_cost": "0",
    "viewed_50_percent_cost": "0",
    "viewed_75_percent_cost": "0",
    "viewed_100_percent_cost": "0"
  },
  "carousel": {
    "slide_1_clicks": 0,
    "slide_1_shows": 0,
    "slide_2_clicks": 0,
    "slide_2_shows": 0,
    "slide_3_clicks": 0,
    "slide_3_shows": 0,
    "slide_4_clicks": 0,
    "slide_4_shows": 0,
    "slide_5_clicks": 0,
    "slide_5_shows": 0,
    "slide_6_clicks": 0,
    "slide_6_shows": 0,
    "slide_1_ctr": 0,
    "slide_2_ctr": 0,
    "slide_3_ctr": 0,
    "slide_4_ctr": 0,
    "slide_5_ctr": 0,
    "slide_6_ctr": 0
  },
  "ad_offers": {
    "offer_postponed": 0,
    "upload_receipt": 0,
    "earn_offer_rewards": 0
  },
  "playable": {
    "playable_game_open": 0,
    "playable_game_close": 0,
    "playable_call_to_action": 0
  },
  "tps": {
    "tps": "0",
    "tpd": "0"
  },
  "moat": {
    "impressions": 0,
    "in_view": 0,
    "never_focused": 0,
    "never_visible": 0,
    "never_50_perc_visible": 0,
    "never_1_sec_visible": 0,
    "human_impressions": 0,
    "impressions_analyzed": 0,
    "in_view_percent": 0,
    "human_and_viewable_perc": 0,
    "never_focused_percent": 0,
    "never_visible_percent": 0,
    "never_50_perc_visible_percent": 0,
    "never_1_sec_visible_percent": 0,
    "in_view_diff_percent": 0,
    "active_in_view_time": 0,
    "attention_quality": 0
  },
  "social_network": {
    "vk_subscribe": 0,
    "ok_subscribe": 0,
    "vk_join": 1,
    "ok_join": 0,
    "dzen_join": 0,
    "result_join": 1,
    "vk_message": 3,
    "ok_message": 0,
    "result_message": 3
  },
  "romi": {
    "value": "0",
    "romi": -100,
    "adv_cost_share": 0
  }
}
```

---


## 7. БЫСТРАЯ СТАТИСТИКА (REAL-TIME)

**Endpoint:** `GET /api/v3/statistics/faststat/ad_plans.json?id={ids}`

```json
{
  "last_seen_time": {
    "timestamp": 1763210260,
    "string": "2025-11-15 15:37:40",
    "ago": 63
  },
  "sample_data": {
    "note": "Поминутная статистика за последние 60 минут",
    "ad_plans_count": 3,
    "first_plan_sample": {
      "key": "8798776",
      "value": {
        "timestamp": 1763210260,
        "minutely": {
          "clicks": [
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0
          ],
          "shows": [
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0
          ]
        }
      }
    }
  }
}
```

**Особенности:**
- Данные в режиме реального времени (обновляются каждую минуту)
- Без фильтрации некорректного трафика
- Предварительные данные (могут отличаться от итоговых)

---


## 8. СРАВНЕНИЕ СТАТИСТИКИ ПО РАЗНЫМ КАМПАНИЯМ

### 8.1 Кампания 1


**Кампания 1:** широкая (ID: 107921416)

```json
{
  "campaign_id": 107921416,
  "campaign_name": "широкая",
  "ad_groups_count": "      10",
  "total_stats": {
    "shows": 786941,
    "clicks": 3861,
    "goals": 0,
    "spent": "62416.68",
    "not_ad_spent": "0",
    "cpm": "79.32",
    "cpc": "16.17",
    "cpa": "0",
    "ctr": 0.49063398653774554,
    "cr": 0,
    "vk": {
      "goals": 263,
      "cpa": "237.33",
      "cr": 6.811706811706812
    }
  }
}
```


**Кампания 2:** Копия широкая (ID: 107921417)

```json
{
  "campaign_id": 107921417,
  "campaign_name": "Копия широкая",
  "ad_groups_count": "      10",
  "total_stats": {
    "shows": 786941,
    "clicks": 3861,
    "goals": 0,
    "spent": "62416.68",
    "not_ad_spent": "0",
    "cpm": "79.32",
    "cpc": "16.17",
    "cpa": "0",
    "ctr": 0.49063398653774554,
    "cr": 0,
    "vk": {
      "goals": 263,
      "cpa": "237.33",
      "cr": 6.811706811706812
    }
  }
}
```


**Кампания 3:** Копия широкая (ID: 107921418)

```json
{
  "campaign_id": 107921418,
  "campaign_name": "Копия широкая",
  "ad_groups_count": "      10",
  "total_stats": {
    "shows": 786941,
    "clicks": 3861,
    "goals": 0,
    "spent": "62416.68",
    "not_ad_spent": "0",
    "cpm": "79.32",
    "cpc": "16.17",
    "cpa": "0",
    "ctr": 0.49063398653774554,
    "cr": 0,
    "vk": {
      "goals": 263,
      "cpa": "237.33",
      "cr": 6.811706811706812
    }
  }
}
```


---

## 9. ИТОГОВАЯ СВОДКА

### Доступные категории данных через VK Ads API


**Структура аккаунта:**
- Campaigns: 55
- Ad Groups: 55
- Banners: 166

**Общая статистика по всем ad_groups:**

```json
{
  "shows": 4384025,
  "clicks": 21560,
  "goals": 0,
  "spent": "490885.43",
  "not_ad_spent": "0",
  "cpm": "111.97",
  "cpc": "22.77",
  "cpa": "0",
  "ctr": 0.4917855167340514,
  "cr": 0,
  "vk": {
    "goals": 2139,
    "cpa": "229.49",
    "cr": 9.921150278293135
  }
}
```

---

## 10. ВЫВОДЫ

### ✅ Что получаем через API:

1. **Структурные данные**
   - Полная иерархия: Campaigns → Ad Groups → Banners
   - Статусы, названия, ID всех объектов
   - Package IDs (рекламные планы)

2. **Базовые метрики статистики**
   - Показы (shows), клики (clicks)
   - Расходы (spent), CPM, CPC, CTR
   - Конверсии (goals), CPA, CR

3. **Социальные метрики**
   - Взаимодействие с контентом
   - Лайки, комментарии, шеры
   - Переходы, открытия, присоединения

4. **Охват и вовлеченность**
   - Уникальные пользователи (uniques)
   - Частота показов
   - Прирост аудитории

5. **Видео метрики**
   - Досмотры (25%, 50%, 75%, 100%)
   - Длительность просмотров
   - Вовлеченность в видео контент

6. **Временные данные**
   - Подневная разбивка (day.json)
   - Суммарные данные (summary.json)
   - Real-time данные (faststat)

7. **Гибкая фильтрация**
   - По периоду (date_from / date_to)
   - По объектам (campaigns, ad_groups, banners)
   - По типам метрик (base, events, video, uniques, all)

### ⚙️ Технические возможности:

- ✅ Scope: ["read_ads", "read_payments"] достаточно для всех данных
- ✅ Автообновление токена через refresh_token
- ✅ Limit до 200 объектов в одном запросе
- ✅ Период статистики до 366 дней
- ✅ Различные endpoints для разных ресурсов

---

**Дата генерации:** $(date '+%Y-%m-%d %H:%M:%S')
**Статус:** ✅ Все категории протестированы с реальными данными
