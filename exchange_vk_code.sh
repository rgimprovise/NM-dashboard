#!/bin/bash

echo "════════════════════════════════════════"
echo "ОБМЕН VK CODE НА ACCESS TOKEN"
echo "════════════════════════════════════════"
echo

if [ -z "$1" ]; then
    echo "❌ ОШИБКА: Не указан code"
    echo
    echo "Использование:"
    echo "  ./exchange_vk_code.sh YOUR_CODE_HERE"
    echo
    echo "Как получить code:"
    echo "  1. Откройте в браузере:"
    echo "     https://ads.vk.com/hq/settings/access?action=oauth2&response_type=code&client_id=b9AHG7669xtg1nvq&state=random123&redirect_uri=https://localhost"
    echo
    echo "  2. Авторизуйтесь и разрешите доступ"
    echo
    echo "  3. Скопируйте 'code' из URL:"
    echo "     https://localhost/?code=ВАШ_КОД_ЗДЕСЬ&state=..."
    echo
    echo "  4. Запустите:"
    echo "     ./exchange_vk_code.sh ВАШ_КОД_ЗДЕСЬ"
    echo
    exit 1
fi

CODE="$1"
CLIENT_ID="b9AHG7669xtg1nvq"

echo "📝 Обмениваем code на токен..."
echo "Code: ${CODE:0:20}..."
echo

RESPONSE=$(curl -s -X POST "https://ads.vk.com/api/v2/oauth2/token.json" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&code=$CODE&client_id=$CLIENT_ID")

echo "Ответ VK API:"
echo "$RESPONSE" | jq '.'

ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.access_token // empty')
REFRESH_TOKEN=$(echo "$RESPONSE" | jq -r '.refresh_token // empty')
SCOPE=$(echo "$RESPONSE" | jq -r '.scope // empty')
EXPIRES_IN=$(echo "$RESPONSE" | jq -r '.expires_in // empty')

if [ -n "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "null" ]; then
    echo
    echo "✅ ТОКЕН УСПЕШНО ПОЛУЧЕН!"
    echo
    echo "Access Token: $ACCESS_TOKEN"
    echo "Refresh Token: $REFRESH_TOKEN"
    echo "Scope: $SCOPE"
    echo "Expires in: $EXPIRES_IN секунд ($(($EXPIRES_IN / 3600)) часов)"
    echo
    
    # Тестируем токен
    echo "🧪 ТЕСТИРУЕМ ТОКЕН..."
    echo
    
    echo "1. Campaigns:"
    curl -s -X GET "https://ads.vk.com/api/v2/campaigns.json?limit=2" \
      -H "Authorization: Bearer $ACCESS_TOKEN" | jq '. | {count: (.items | length), first: .items[0].name}'
    
    echo
    echo "2. Statistics:"
    STATS_RESPONSE=$(curl -s -X POST "https://ads.vk.com/api/v2/statistics.json" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "date_from": "2024-11-01",
        "date_to": "2024-11-14",
        "metrics": ["base"]
      }')
    
    echo "$STATS_RESPONSE" | head -c 500
    
    if echo "$STATS_RESPONSE" | grep -q "Not found"; then
        echo
        echo
        echo "❌ Statistics все еще недоступна"
        echo "   OAuth-клиент не имеет прав даже через Authorization Code"
        echo
        echo "💡 РЕШЕНИЕ: Обратитесь в поддержку VK Ads"
        echo "   • https://vk.com/ads_support"
        echo "   • Запросите добавление scope для Client ID: $CLIENT_ID"
        echo "   • Нужные права: read_stats, read_billing"
    elif echo "$STATS_RESPONSE" | grep -q "error"; then
        echo
        echo
        echo "⚠️  Statistics вернула ошибку:"
        echo "$STATS_RESPONSE" | jq '.error'
    else
        echo
        echo
        echo "✅✅✅ STATISTICS РАБОТАЕТ! ✅✅✅"
        echo
        echo "🎉 Поздравляю! Токен с полными правами получен!"
    fi
    
    echo
    echo "════════════════════════════════════════"
    echo "ОБНОВИТЕ .env ФАЙЛ:"
    echo "════════════════════════════════════════"
    echo
    echo "cd \"/Users/rostislavgolivetc/API test/vortex-home 2\""
    echo "nano .env"
    echo
    echo "# Замените строки:"
    echo "VK_TOKEN=\"$ACCESS_TOKEN\""
    echo "VK_REFRESH_TOKEN=\"$REFRESH_TOKEN\""
    echo
    echo "# Сохраните (Ctrl+O, Enter, Ctrl+X)"
    echo "# Перезапустите сервер:"
    echo "pkill -f \"npm run dev\" && npm run dev"
    echo
    
else
    echo
    echo "❌ ОШИБКА при получении токена"
    echo
    if echo "$RESPONSE" | grep -q "invalid_grant"; then
        echo "⚠️  Code недействителен или уже использован"
        echo
        echo "Code истекает через 1 час после получения!"
        echo "Получите новый code:"
        echo "  https://ads.vk.com/hq/settings/access?action=oauth2&response_type=code&client_id=b9AHG7669xtg1nvq&state=random123&redirect_uri=https://localhost"
    else
        echo "Полный ответ:"
        echo "$RESPONSE"
    fi
    echo
fi

