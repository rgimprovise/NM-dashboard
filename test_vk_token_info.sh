#!/bin/bash

VK_TOKEN="r9B7KIzD1b5dOftBBTg3ZQFxXItmAhqPPkx2FteFzwjLnmgh16OqYY0XUMSuqfyyQCL9bhO7S3AWwxMvZ0RyfZ0WtftPWSRLNYDIihJXP82GCKBeAJltixe4O8ztvJSee1KmtAf76PfqvhtCIJpDOhJev2EYwlugSIku0qCnpuV6tXonVGvk62K0N55vFapvM1YsTxWI6PYqtPjafq9UlmadsBAWFa9smJavKjasQhzfdjhbLN4M5xObOK3M"

echo "======================================"
echo "ПРОВЕРКА ПРАВ И SCOPE ТОКЕНА VK"
echo "======================================"

echo -e "\n1. Проверка токена (whoami):"
curl -s -X GET "https://ads.vk.com/api/v2/account.json" \
  -H "Authorization: Bearer $VK_TOKEN" | jq '.'

echo -e "\n2. User info:"
curl -s -X GET "https://ads.vk.com/api/v2/users/current.json" \
  -H "Authorization: Bearer $VK_TOKEN" | jq '.'

echo -e "\n3. Список всех Ad Plans (детальная информация):"
curl -s -X GET "https://ads.vk.com/api/v2/ad_plans.json" \
  -H "Authorization: Bearer $VK_TOKEN" | jq '.items[0:2]'

echo -e "\n4. Campaigns с полной информацией:"
curl -s -X GET "https://ads.vk.com/api/v2/campaigns.json?limit=2" \
  -H "Authorization: Bearer $VK_TOKEN" | jq '.items'

echo -e "\n5. Ad Groups с детальной информацией:"
curl -s -X GET "https://ads.vk.com/api/v2/ad_groups.json?limit=2" \
  -H "Authorization: Bearer $VK_TOKEN" | jq '.items'

echo -e "\n6. Banners с полной информацией:"
curl -s -X GET "https://ads.vk.com/api/v2/banners.json?limit=2" \
  -H "Authorization: Bearer $VK_TOKEN" | jq '.items'

echo -e "\n7. Проверка доступных endpoints (users):"
curl -s -X GET "https://ads.vk.com/api/v2/users.json" \
  -H "Authorization: Bearer $VK_TOKEN" | head -c 300

echo -e "\n\n8. Pricelist (прайс листы):"
curl -s -X GET "https://ads.vk.com/api/v2/pricelists.json" \
  -H "Authorization: Bearer $VK_TOKEN" | head -c 300

