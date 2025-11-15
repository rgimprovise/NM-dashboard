#!/bin/bash

CLIENT_ID="b9AHG7669xtg1nvq"
CLIENT_SECRET="xzq3ChdU2N9ehhzHibhth8vY2bwNjvyFVQE5PXBzUuW1OvUhq660WmF75AHwcMpM6EevNp0EFjWXAR4U0jrKzWUatPccijOiNvKQhdRAoHZTw9QRKy84nkwwkdnH0QyTz8Is1YWXC5AHzc3dlIvI9Nl77nf8mNyBK5MG6hAEH2uGNFdYiKOcQmPpUlYNq5TECa9xELpKmtOwwGk9BFpWQVNpLWWt7mMBKaLsEymW"
ENV_FILE="/Users/rostislavgolivetc/API test/vortex-home 2/.env"

echo "╔════════════════════════════════════════╗"
echo "║   🔄 ОБНОВЛЕНИЕ VK ТОКЕНА              ║"
echo "║      Через Refresh Token              ║"
echo "╚════════════════════════════════════════╝"
echo

# Читаем существующий refresh_token
REFRESH_TOKEN=$(grep "^VK_REFRESH_TOKEN=" "$ENV_FILE" | cut -d'"' -f2)

if [ -z "$REFRESH_TOKEN" ]; then
    echo "❌ VK_REFRESH_TOKEN не найден в .env"
    echo
    echo "Попробуйте получить токен через веб-интерфейс:"
    echo "https://ads.vk.com/hq/settings/access"
    exit 1
fi

echo "📝 Найден refresh_token: ${REFRESH_TOKEN:0:30}..."
echo
echo "🔄 Обновляем токен..."

RESPONSE=$(curl -s -X POST "https://ads.vk.com/api/v2/oauth2/token.json" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token&refresh_token=$REFRESH_TOKEN&client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET")

echo
echo "Ответ VK:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo

ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.access_token // empty')
NEW_REFRESH_TOKEN=$(echo "$RESPONSE" | jq -r '.refresh_token // empty')

if [ -n "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "null" ]; then
    echo "✅ ТОКЕН УСПЕШНО ОБНОВЛЕН!"
    echo
    
    # Обновляем .env
    cp "$ENV_FILE" "${ENV_FILE}.backup"
    sed -i.tmp "s|^VK_TOKEN=.*|VK_TOKEN=\"$ACCESS_TOKEN\"|" "$ENV_FILE"
    
    if [ -n "$NEW_REFRESH_TOKEN" ] && [ "$NEW_REFRESH_TOKEN" != "null" ]; then
        sed -i.tmp "s|^VK_REFRESH_TOKEN=.*|VK_REFRESH_TOKEN=\"$NEW_REFRESH_TOKEN\"|" "$ENV_FILE"
    fi
    
    EXPIRES_AT=$(($(date +%s) * 1000 + 86400 * 1000))
    if grep -q "^VK_TOKEN_EXPIRES_AT=" "$ENV_FILE"; then
        sed -i.tmp "s|^VK_TOKEN_EXPIRES_AT=.*|VK_TOKEN_EXPIRES_AT=\"$EXPIRES_AT\"|" "$ENV_FILE"
    else
        echo "VK_TOKEN_EXPIRES_AT=\"$EXPIRES_AT\"" >> "$ENV_FILE"
    fi
    
    rm -f "${ENV_FILE}.tmp"
    
    echo "✅ Токены сохранены в .env"
    echo "   VK_TOKEN: ${ACCESS_TOKEN:0:30}..."
    echo "   Действителен: 24 часа"
    echo
    
    # Перезапускаем сервер
    echo "🔄 Перезапускаем сервер..."
    pkill -f "npm run dev" 2>/dev/null || true
    sleep 2
    
    cd "/Users/rostislavgolivetc/API test/vortex-home 2"
    npm run dev > /tmp/vortex_server.log 2>&1 &
    
    echo "✅ Сервер перезапущен"
    echo
    echo "🌐 Дашборд: http://localhost:8080"
    
else
    echo "❌ ОШИБКА при обновлении токена"
    echo
    if echo "$RESPONSE" | grep -q "invalid_grant"; then
        echo "⚠️  Refresh token недействителен или истек"
        echo
        echo "Получите новый токен через веб-интерфейс:"
        echo "https://ads.vk.com/hq/settings/access"
    fi
fi

