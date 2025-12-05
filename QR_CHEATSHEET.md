# QR Code Generator - Шпаргалка

## ⚡ Быстрые команды

### Установка
```bash
pip install qrcode[pil]
```

### Основные команды

```bash
# Перейти в директорию со скриптами
cd scripts

# Простой QR-код
python3 generate_qr_code.py "https://example.com"

# С указанием файла
python3 generate_qr_code.py "https://example.com" -o my_qr.png

# С размером
python3 generate_qr_code.py "https://example.com" --size 500

# Цветной QR-код
python3 generate_qr_code.py "https://example.com" --fill-color blue --back-color yellow

# Высокая коррекция (для печати)
python3 generate_qr_code.py "https://example.com" -e H

# Интерактивный режим
python3 interactive_qr.py

# Массовая генерация из txt
python3 batch_qr_generator.py urls.txt

# Массовая генерация из csv
python3 batch_qr_generator.py urls.csv --column url --name-column name

# Справка
python3 generate_qr_code.py --help
```

## 📋 Параметры

| Короткий | Полный | Описание | По умолчанию |
|----------|--------|----------|--------------|
| - | `url` | URL для QR-кода | обязательно |
| `-o` | `--output` | Имя файла | `qr_code.png` |
| `-s` | `--size` | Размер в px | авто |
| `-e` | `--error-correction` | Коррекция (L/M/Q/H) | `M` |
| - | `--fill-color` | Цвет QR-кода | `black` |
| - | `--back-color` | Цвет фона | `white` |
| - | `--box-size` | Размер блока | `10` |
| - | `--border` | Толщина рамки | `4` |

## 🎨 Примеры

### Соцсети
```bash
# VK
python3 generate_qr_code.py "https://vk.com/your_page" -o vk_qr.png

# Instagram  
python3 generate_qr_code.py "https://instagram.com/profile" -o instagram_qr.png

# Telegram
python3 generate_qr_code.py "https://t.me/channel" -o telegram_qr.png
```

### Для бизнеса
```bash
# Меню ресторана
python3 generate_qr_code.py "https://menu.restaurant.com" -o menu.png -e H

# Отзывы Google
python3 generate_qr_code.py "https://g.page/business/review" -o reviews.png

# Визитка (средний размер)
python3 generate_qr_code.py "https://mycard.com" -o card.png --size 400 -e H
```

### Для печати
```bash
# Флаер A5
python3 generate_qr_code.py "https://example.com" -o flyer.png --size 600 -e Q

# Баннер (большой)
python3 generate_qr_code.py "https://example.com" -o banner.png --size 1200 -e H

# Наклейка
python3 generate_qr_code.py "https://example.com" -o sticker.png --size 300 -e H
```

## 📐 Рекомендуемые размеры

| Применение | Размер | Коррекция |
|------------|--------|-----------|
| Экран смартфона | 200-300 | M |
| Визитка | 300-400 | H |
| Флаер A5/A4 | 500-800 | Q или H |
| Баннер | 1000+ | H |
| Наклейка | 300-400 | H |

## 🛡️ Коррекция ошибок

| Уровень | Восстановление | Когда использовать |
|---------|----------------|-------------------|
| **L** | ~7% | Экраны, идеальные условия |
| **M** | ~15% | Обычная печать (по умолчанию) |
| **Q** | ~25% | Условия с повреждениями |
| **H** | ~30% | Визитки, стикеры, улица |

## 🐍 Python API

```python
from scripts.generate_qr_code import QRCodeGenerator

# Создать генератор
gen = QRCodeGenerator()

# Простой QR-код
gen.generate("https://example.com", "qr.png")

# С размером
gen.generate_with_custom_size("https://example.com", "qr.png", size=500)

# Цветной
gen = QRCodeGenerator(fill_color="blue", back_color="yellow")
gen.generate("https://example.com", "qr.png")
```

## 📝 Форматы файлов

### TXT файл (urls.txt)
```
https://example.com
https://vk.com
https://yandex.ru
# Комментарий
```

### CSV файл (urls.csv)
```csv
name,url
Example,https://example.com
VK,https://vk.com
Yandex,https://yandex.ru
```

## 🎯 Популярные цвета брендов

```bash
# Instagram
--fill-color "#E1306C"

# VK
--fill-color "#0077FF"

# Telegram
--fill-color "#0088cc"

# WhatsApp
--fill-color "#25D366"

# YouTube
--fill-color "#FF0000"
```

## 💡 Советы

✅ **Делать:**
- Тестируйте перед печатью
- Используйте контрастные цвета
- Для печати: коррекция H
- Добавляйте небольшой текст под QR-кодом

❌ **Не делать:**
- Очень светлые цвета для QR-кода
- Слишком маленький размер для печати (< 2x2 см)
- Низкую коррекцию для улицы

## 📚 Документация

- [QUICK_START_QR.md](QUICK_START_QR.md) - Быстрый старт
- [docs/QR_CODE_GENERATOR_GUIDE.md](docs/QR_CODE_GENERATOR_GUIDE.md) - Полное руководство
- [scripts/README_QR.md](scripts/README_QR.md) - README для скриптов

---

💾 **Сохраните эту шпаргалку для быстрого доступа!**

