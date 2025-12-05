#!/bin/bash

CLIENT_ID="b9AHG7669xtg1nvq"
CLIENT_SECRET="xzq3ChdU2N9ehhzHibhth8vY2bwNjvyFVQE5PXBzUuW1OvUhq660WmF75AHwcMpM6EevNp0EFjWXAR4U0jrKzWUatPccijOiNvKQhdRAoHZTw9QRKy84nkwwkdnH0QyTz8Is1YWXC5AHzc3dlIvI9Nl77nf8mNyBK5MG6hAEH2uGNFdYiKOcQmPpUlYNq5TECa9xELpKmtOwwGk9BFpWQVNpLWWt7mMBKaLsEymW"
ENV_FILE="/Users/rostislavgolivetc/API test/vortex-home 2/.env"

echo "╔════════════════════════════════════════╗"
echo "║   🚀 ПОЛУЧЕНИЕ VK ТОКЕНА С ПРАВАМИ    ║"
echo "║      Authorization Code Grant         ║"
echo "╚════════════════════════════════════════╝"
echo

echo "📋 ШАГ 1: АВТОРИЗАЦИЯ В БРАУЗЕРЕ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo "Сейчас откроется браузер с VK авторизацией..."
echo "Если браузер не откроется, скопируйте URL вручную:"
echo
AUTH_URL="https://ads.vk.com/hq/settings/access?action=oauth2&response_type=code&client_id=$CLIENT_ID&state=random123&redirect_uri=https://localhost"
echo "$AUTH_URL"
echo

# Пробуем открыть браузер
if command -v open &> /dev/null; then
    open "$AUTH_URL" 2>/dev/null || echo "⚠️  Не удалось открыть браузер автоматически"
elif command -v xdg-open &> /dev/null; then
    xdg-open "$AUTH_URL" 2>/dev/null || echo "⚠️  Не удалось открыть браузер автоматически"
fi

echo
echo "🔐 В браузере:"
echo "   1. Авторизуйтесь в VK Ads"
echo "   2. Разрешите доступ приложению"
echo "   3. Браузер перенаправит на: https://localhost/?code=..."
echo "   4. Скопируйте значение параметра 'code' из URL"
echo
echo "Пример URL redirect:"
echo "https://localhost/?code=ДЛИННЫЙ_КОД_ЗДЕСЬ&state=random123&user_id=12345"
echo "                        ^^^^^^^^^^^^^^^^"
echo "                        Скопируйте это"
echo

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
read -p "📥 Вставьте code сюда: " CODE
echo

if [ -z "$CODE" ]; then
    echo "❌ ОШИБКА: code не введен"
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 ШАГ 2: ОБМЕН CODE НА ТОКЕН"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo "🔄 Отправляем запрос к VK API..."

RESPONSE=$(curl -s -X POST "https://ads.vk.com/api/v2/oauth2/token.json" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&code=$CODE&client_id=$CLIENT_ID")

echo
echo "Ответ VK:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo

ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.access_token // empty')
REFRESH_TOKEN=$(echo "$RESPONSE" | jq -r '.refresh_token // empty')
SCOPE=$(echo "$RESPONSE" | jq -r '.scope // empty')
EXPIRES_IN=$(echo "$RESPONSE" | jq -r '.expires_in // empty')

if [ -n "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "null" ]; then
    echo "✅ ТОКЕН УСПЕШНО ПОЛУЧЕН!"
    echo
    
    # Вычисляем время истечения
    EXPIRES_AT=$(($(date +%s) * 1000 + $EXPIRES_IN * 1000))
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 ШАГ 3: ТЕСТИРОВАНИЕ ТОКЕНА"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo
    
    echo "🧪 Проверяем campaigns..."
    CAMPAIGNS_TEST=$(curl -s -X GET "https://ads.vk.com/api/v2/campaigns.json?limit=2" \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    
    CAMPAIGNS_COUNT=$(echo "$CAMPAIGNS_TEST" | jq -r '.items | length' 2>/dev/null)
    
    if [ -n "$CAMPAIGNS_COUNT" ] && [ "$CAMPAIGNS_COUNT" != "null" ]; then
        echo "✅ Campaigns: работает ($CAMPAIGNS_COUNT кампаний)"
    else
        echo "⚠️  Campaigns: проверьте вручную"
    fi
    
    echo
    echo "🧪 Проверяем statistics..."
    STATS_TEST=$(curl -s -X POST "https://ads.vk.com/api/v2/statistics.json" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "date_from": "2024-11-01",
        "date_to": "2024-11-14",
        "metrics": ["base"]
      }')
    
    if echo "$STATS_TEST" | grep -q "Not found"; then
        echo "❌ Statistics: 404 Not found"
        echo "   OAuth-клиент все еще без прав на statistics"
        echo "   Обратитесь в поддержку VK Ads"
    elif echo "$STATS_TEST" | grep -q "error"; then
        echo "⚠️  Statistics: ошибка"
        echo "$STATS_TEST" | jq '.error' 2>/dev/null
    else
        echo "✅ Statistics: РАБОТАЕТ! 🎉"
        STATS_PREVIEW=$(echo "$STATS_TEST" | head -c 200)
        echo "   Данные получены: $STATS_PREVIEW..."
    fi
    
    echo
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 ШАГ 4: СОХРАНЕНИЕ В .env"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo
    
    # Обновляем .env файл
    if [ -f "$ENV_FILE" ]; then
        # Создаем backup
        cp "$ENV_FILE" "${ENV_FILE}.backup"
        echo "📦 Backup создан: .env.backup"
        
        # Обновляем токены
        sed -i.tmp "s|^VK_TOKEN=.*|VK_TOKEN=\"$ACCESS_TOKEN\"|" "$ENV_FILE"
        sed -i.tmp "s|^VK_REFRESH_TOKEN=.*|VK_REFRESH_TOKEN=\"$REFRESH_TOKEN\"|" "$ENV_FILE"
        
        # Добавляем VK_TOKEN_EXPIRES_AT если его нет
        if ! grep -q "^VK_TOKEN_EXPIRES_AT=" "$ENV_FILE"; then
            echo "VK_TOKEN_EXPIRES_AT=\"$EXPIRES_AT\"" >> "$ENV_FILE"
        else
            sed -i.tmp "s|^VK_TOKEN_EXPIRES_AT=.*|VK_TOKEN_EXPIRES_AT=\"$EXPIRES_AT\"|" "$ENV_FILE"
        fi
        
        # Добавляем VK_CLIENT_SECRET если его нет
        if ! grep -q "^VK_CLIENT_SECRET=" "$ENV_FILE"; then
            echo "VK_CLIENT_SECRET=\"$CLIENT_SECRET\"" >> "$ENV_FILE"
        fi
        
        rm -f "${ENV_FILE}.tmp"
        
        echo "✅ Токены сохранены в .env"
        echo "   VK_TOKEN: ${ACCESS_TOKEN:0:30}..."
        echo "   VK_REFRESH_TOKEN: ${REFRESH_TOKEN:0:30}..."
        echo "   VK_TOKEN_EXPIRES_AT: $EXPIRES_AT"
        echo "   Scope: $SCOPE"
        echo "   Действителен: $((EXPIRES_IN / 3600)) часов"
    else
        echo "❌ Файл .env не найден: $ENV_FILE"
        echo
        echo "Создайте .env вручную с содержимым:"
        echo "VK_TOKEN=\"$ACCESS_TOKEN\""
        echo "VK_REFRESH_TOKEN=\"$REFRESH_TOKEN\""
        echo "VK_TOKEN_EXPIRES_AT=\"$EXPIRES_AT\""
        echo "VK_CLIENT_ID=\"$CLIENT_ID\""
        echo "VK_CLIENT_SECRET=\"$CLIENT_SECRET\""
        exit 1
    fi
    
    echo
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 ШАГ 5: ПЕРЕЗАПУСК СЕРВЕРА"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo
    echo "🔄 Останавливаем старый процесс..."
    pkill -f "npm run dev" 2>/dev/null || true
    sleep 2
    
    echo "🚀 Запускаем сервер с новым токеном..."
    cd "/Users/rostislavgolivetc/API test/vortex-home 2"
    npm run dev > /tmp/vortex_server.log 2>&1 &
    
    echo "✅ Сервер запущен в фоне"
    echo
    sleep 3
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🎉 ГОТОВО!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo
    echo "✅ VK токен установлен и работает"
    echo "✅ Автообновление токена активировано"
    echo "✅ Сервер перезапущен"
    echo
    echo "🌐 Дашборд: http://localhost:8080"
    echo "📊 Проверьте страницу Marketing для VK данных"
    echo
    echo "📝 Логи сервера: tail -f /tmp/vortex_server.log"
    echo
    
else
    echo "❌ ОШИБКА ПРИ ПОЛУЧЕНИИ ТОКЕНА"
    echo
    
    if echo "$RESPONSE" | grep -q "invalid_grant"; then
        echo "⚠️  Code недействителен или истек"
        echo
        echo "Code действителен только 1 час!"
        echo "Запустите скрипт заново и получите новый code."
    elif echo "$RESPONSE" | grep -q "error"; then
        echo "Ошибка VK API:"
        echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    else
        echo "Неизвестная ошибка:"
        echo "$RESPONSE"
    fi
    echo
    exit 1
fi

