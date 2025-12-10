# Конфигурация Caddy для NM Dashboard

## Проблема: API запросы возвращают HTML вместо JSON

Если API запросы возвращают HTML (ошибка `"<!doctype "... is not valid JSON"`), проблема в конфигурации Caddy.

## Правильная конфигурация Caddyfile

```caddyfile
dashboard.n8nrgimprovise.space {
    # КРИТИЧЕСКИ ВАЖНО: Проксирование API запросов ДОЛЖНО быть ПЕРВЫМ
    # И использовать правильный синтаксис для всех методов (GET, POST, PUT, DELETE)
    reverse_proxy /api/* localhost:3003 {
        # Убедитесь, что все методы проксируются
        methods GET POST PUT DELETE PATCH OPTIONS
    }

    # Статические файлы фронтенда
    root * /var/www/nm-dashboard/dist/spa
    file_server

    # SPA fallback (для React Router) - только для НЕ-API роутов
    try_files {path} /index.html
}
```

## Альтернативная конфигурация (если первая не работает)

```caddyfile
dashboard.n8nrgimprovise.space {
    # Используем handle для явного разделения API и статики
    handle /api/* {
        reverse_proxy localhost:3003 {
            # Убедитесь, что заголовки передаются правильно
            header_up Host {host}
            header_up X-Real-IP {remote}
            header_up X-Forwarded-For {remote}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    # Статические файлы
    handle {
        root * /var/www/nm-dashboard/dist/spa
        file_server
        try_files {path} /index.html
    }
}
```

## Проверка конфигурации

```bash
# 1. Проверить синтаксис
sudo caddy validate --config /etc/caddy/Caddyfile

# 2. Перезагрузить Caddy
sudo systemctl reload caddy

# 3. Проверить логи Caddy
sudo journalctl -u caddy -n 50

# 4. Проверить, что API проксируется
curl -X POST https://dashboard.n8nrgimprovise.space/api/settings/yandex \
  -H "Content-Type: application/json" \
  -d '{"campaignIds":["123"]}'
```

## Диагностика проблем

### Проблема: POST запросы возвращают HTML

**Причина:** Caddy не проксирует POST запросы правильно.

**Решение:**
1. Убедитесь, что `reverse_proxy /api/*` стоит ПЕРВЫМ в конфигурации
2. Проверьте, что используется правильный синтаксис `reverse_proxy /api/*`
3. Убедитесь, что порт правильный (3003 или тот, который указан в .env)

### Проблема: Запросы не доходят до Express

**Причина:** Express сервер не запущен или не слушает на правильном порту.

**Решение:**
```bash
# Проверить, что сервер запущен
pm2 status

# Проверить, что сервер слушает на правильном порту
netstat -tulpn | grep 3003

# Проверить логи
pm2 logs nm-dashboard --lines 50
```

### Проблема: CORS ошибки

**Причина:** Caddy не передает заголовки правильно.

**Решение:** Добавьте в конфигурацию Caddy:
```caddyfile
reverse_proxy /api/* localhost:3003 {
    header_up Host {host}
    header_up X-Real-IP {remote}
    header_up X-Forwarded-For {remote}
    header_up X-Forwarded-Proto {scheme}
}
```

