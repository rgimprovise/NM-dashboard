#!/bin/bash

VK_TOKEN="r9B7KIzD1b5dOftBBTg3ZQFxXItmAhqPPkx2FteFzwjLnmgh16OqYY0XUMSuqfyyQCL9bhO7S3AWwxMvZ0RyfZ0WtftPWSRLNYDIihJXP82GCKBeAJltixe4O8ztvJSee1KmtAf76PfqvhtCIJpDOhJev2EYwlugSIku0qCnpuV6tXonVGvk62K0N55vFapvM1YsTxWI6PYqtPjafq9UlmadsBAWFa9smJavKjasQhzfdjhbLN4M5xObOK3M"

echo "======================================"
echo "ГЛУБОКИЙ ТЕСТ VK STATISTICS API"
echo "======================================"

# Получаем ID первой кампании
CAMPAIGN_ID=$(curl -s -X GET "https://ads.vk.com/api/v2/campaigns.json?limit=1" \
  -H "Authorization: Bearer $VK_TOKEN" | jq -r '.items[0].id')

echo "Используем Campaign ID: $CAMPAIGN_ID"

echo -e "\n1. Statistics (POST с базовыми метриками):"
curl -s -X POST "https://ads.vk.com/api/v2/statistics.json" \
  -H "Authorization: Bearer $VK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date_from": "2024-11-01",
    "date_to": "2024-11-14",
    "metrics": ["base"]
  }' | head -c 500

echo -e "\n\n2. Statistics по конкретной кампании:"
curl -s -X POST "https://ads.vk.com/api/v2/statistics.json" \
  -H "Authorization: Bearer $VK_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"date_from\": \"2024-11-01\",
    \"date_to\": \"2024-11-14\",
    \"metrics\": [\"base\"],
    \"filters\": [{
      \"field\": \"campaign_id\",
      \"operator\": \"=\",
      \"value\": $CAMPAIGN_ID
    }]
  }" | head -c 500

echo -e "\n\n3. Statistics через campaigns endpoint:"
curl -s -X GET "https://ads.vk.com/api/v2/campaigns/$CAMPAIGN_ID/statistics.json?date_from=2024-11-01&date_to=2024-11-14" \
  -H "Authorization: Bearer $VK_TOKEN" | head -c 500

echo -e "\n\n4. Detailed Statistics (metrics):"
curl -s -X POST "https://ads.vk.com/api/v2/statistics.json" \
  -H "Authorization: Bearer $VK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date_from": "2024-11-01",
    "date_to": "2024-11-14",
    "metrics": ["shows", "clicks", "spent", "ctr", "cpc"]
  }' | head -c 500

echo -e "\n\n5. Budget info для кампании:"
curl -s -X GET "https://ads.vk.com/api/v2/campaigns/$CAMPAIGN_ID/budget.json" \
  -H "Authorization: Bearer $VK_TOKEN" | jq '.'

echo -e "\n\n6. Информация о баннере с метриками:"
BANNER_ID=$(curl -s -X GET "https://ads.vk.com/api/v2/banners.json?limit=1" \
  -H "Authorization: Bearer $VK_TOKEN" | jq -r '.items[0].id')

echo "Banner ID: $BANNER_ID"
curl -s -X GET "https://ads.vk.com/api/v2/banners/$BANNER_ID.json" \
  -H "Authorization: Bearer $VK_TOKEN" | jq '.'

echo -e "\n\n7. Массовый запрос (mass_action):"
curl -s -X POST "https://ads.vk.com/api/v2/statistics/mass.json" \
  -H "Authorization: Bearer $VK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date_from": "2024-11-01",
    "date_to": "2024-11-14"
  }' | head -c 500

