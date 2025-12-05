#!/bin/bash

ENV_FILE="/Users/rostislavgolivetc/API test/vortex-home 2/.env"

echo "╔════════════════════════════════════════╗"
echo "║   💾 СОХРАНЕНИЕ VK ТОКЕНА              ║"
echo "╚════════════════════════════════════════╝"
echo

read -p "📥 Вставьте Access Token: " ACCESS_TOKEN
echo

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Токен не введен"
    exit 1
fi

read -p "📥 Вставьте Refresh Token (или Enter если нет): " REFRESH_TOKEN
echo

# Создаем backup
cp "$ENV_FILE" "${ENV_FILE}.backup"
echo "📦 Backup создан: .env.backup"

# Обновляем токены
sed -i.tmp "s|^VK_TOKEN=.*|VK_TOKEN=$ACCESS_TOKEN|" "$ENV_FILE"

if [ -n "$REFRESH_TOKEN" ]; then
    sed -i.tmp "s|^VK_REFRESH_TOKEN=.*|VK_REFRESH_TOKEN=$REFRESH_TOKEN|" "$ENV_FILE"
fi

EXPIRES_AT=$(($(date +%s) * 1000 + 86400 * 1000))
if grep -q "^VK_TOKEN_EXPIRES_AT=" "$ENV_FILE"; then
    sed -i.tmp "s|^VK_TOKEN_EXPIRES_AT=.*|VK_TOKEN_EXPIRES_AT=$EXPIRES_AT|" "$ENV_FILE"
else
    echo "VK_TOKEN_EXPIRES_AT=$EXPIRES_AT" >> "$ENV_FILE"
fi

rm -f "${ENV_FILE}.tmp"

echo "✅ Токены сохранены в .env"
echo

# Тестируем токен
echo "🧪 Тестируем токен..."
TEST_RESPONSE=$(curl -s -X GET "https://ads.vk.com/api/v2/campaigns.json?limit=2" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$TEST_RESPONSE" | grep -q '"items"'; then
    COUNT=$(echo "$TEST_RESPONSE" | jq '.items | length' 2>/dev/null)
    echo "✅ Токен работает! Найдено кампаний: $COUNT"
    
    # Проверяем статистику
    echo
    echo "🧪 Проверяем доступ к statistics..."
    STATS_TEST=$(curl -s -X POST "https://ads.vk.com/api/v2/statistics.json" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"date_from": "2024-11-01", "date_to": "2024-11-14", "metrics": ["base"]}')
    
    if echo "$STATS_TEST" | grep -q "Not found"; then
        echo "⚠️  Statistics: недоступна (требуются расширенные права)"
    elif echo "$STATS_TEST" | grep -q "error"; then
        echo "⚠️  Statistics: ошибка"
    else
        echo "✅ Statistics: РАБОТАЕТ! 🎉"
    fi
else
    echo "⚠️  Не удалось проверить токен"
    echo "$TEST_RESPONSE"
fi

echo
echo "🔄 Перезапускаем сервер..."
pkill -f "npm run dev" 2>/dev/null || true
sleep 2

cd "/Users/rostislavgolivetc/API test/vortex-home 2"
npm run dev > /tmp/vortex_server.log 2>&1 &

echo "✅ Сервер перезапущен"
echo
echo "🌐 Дашборд: http://localhost:8080"
echo "📊 Проверьте страницу /marketing"
echo

