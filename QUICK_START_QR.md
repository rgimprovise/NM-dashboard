# 🎯 Быстрый старт: Генератор QR-кодов

## Что это?

Мощный инструмент для создания QR-кодов, которые ведут на статические ссылки. Поддерживает как одиночную, так и массовую генерацию.

## ⚡ Установка

```bash
# Установите зависимость
pip install qrcode[pil]

# Или используйте requirements.txt
pip install -r requirements.txt
```

## 🚀 Использование

### 1️⃣ Простая генерация (командная строка)

```bash
cd scripts
python3 generate_qr_code.py "https://example.com"
```

Результат: создаст файл `qr_code.png` в текущей директории.

### 2️⃣ С настройками

```bash
# С указанием имени файла и размера
python3 generate_qr_code.py "https://vk.com/your_page" --output vk_qr.png --size 500

# Цветной QR-код
python3 generate_qr_code.py "https://example.com" \
    --fill-color blue \
    --back-color lightyellow \
    --output colored_qr.png

# С высокой коррекцией ошибок (для печати)
python3 generate_qr_code.py "https://example.com" \
    --error-correction H \
    --output print_qr.png
```

### 3️⃣ Интерактивный режим

```bash
python3 interactive_qr.py
```

Программа задаст вопросы и создаст QR-код на основе ваших ответов.

### 4️⃣ Массовая генерация

#### Из текстового файла

Создайте файл `urls.txt`:
```
https://example.com
https://vk.com
https://yandex.ru
```

Запустите:
```bash
python3 batch_qr_generator.py urls.txt
```

#### Из CSV файла

Создайте файл `urls.csv`:
```csv
name,url
Example,https://example.com
VK,https://vk.com
Yandex,https://yandex.ru
```

Запустите:
```bash
python3 batch_qr_generator.py urls.csv --column url --name-column name
```

### 5️⃣ Использование в Python коде

```python
from scripts.generate_qr_code import QRCodeGenerator

# Создайте генератор
generator = QRCodeGenerator()

# Простая генерация
generator.generate(
    url="https://example.com",
    output_path="qr_code.png"
)

# С заданным размером
generator.generate_with_custom_size(
    url="https://example.com",
    output_path="large_qr.png",
    size=500
)

# Цветной QR-код
generator_color = QRCodeGenerator(
    fill_color="darkblue",
    back_color="lightyellow"
)
generator_color.generate(
    url="https://example.com",
    output_path="colored_qr.png"
)
```

## 📋 Основные параметры

| Параметр | Описание | Значение по умолчанию |
|----------|----------|----------------------|
| `url` | URL для QR-кода | - |
| `--output` | Имя выходного файла | `qr_code.png` |
| `--size` | Размер в пикселях | авто |
| `--error-correction` | Уровень коррекции (L/M/Q/H) | `M` |
| `--fill-color` | Цвет QR-кода | `black` |
| `--back-color` | Цвет фона | `white` |

## 🎨 Примеры использования

### Для бизнеса
```bash
# Меню ресторана
python3 generate_qr_code.py "https://restaurant.com/menu" --output menu_qr.png

# Ссылка на отзывы
python3 generate_qr_code.py "https://g.page/your-business/review" --output reviews_qr.png --error-correction H
```

### Для соцсетей
```bash
# Instagram
python3 generate_qr_code.py "https://instagram.com/your_profile" --output instagram_qr.png

# VK
python3 generate_qr_code.py "https://vk.com/your_page" --output vk_qr.png

# Telegram
python3 generate_qr_code.py "https://t.me/your_channel" --output telegram_qr.png
```

### Для мероприятий
```bash
# Регистрация на событие (большой размер для баннера)
python3 generate_qr_code.py "https://event.com/register" \
    --output event_qr.png \
    --size 1000 \
    --error-correction H
```

## 💡 Рекомендации

### Размеры для разных целей
- **Экран смартфона**: 200-300 px
- **Визитная карточка**: 300-400 px
- **Флаер A5/A4**: 500-800 px
- **Баннер/постер**: 1000+ px

### Коррекция ошибок
- **L (7%)**: Для экранов, минимальные повреждения
- **M (15%)**: Для обычной печати ✅ *рекомендуется*
- **Q (25%)**: Для условий с повреждениями
- **H (30%)**: Для наружной рекламы, стикеров

### Советы
- ✅ Всегда тестируйте QR-код перед печатью
- ✅ Используйте контрастные цвета (тёмный на светлом)
- ✅ Для печати используйте коррекцию H
- ❌ Избегайте очень светлых цветов для `fill_color`

## 📚 Дополнительная документация

- [Полное руководство](docs/QR_CODE_GENERATOR_GUIDE.md)
- [README для скриптов](scripts/README_QR.md)
- [Примеры использования](scripts/example_qr_generator.py)

## 🆘 Помощь

```bash
# Справка по основному генератору
python3 generate_qr_code.py --help

# Справка по массовому генератору
python3 batch_qr_generator.py --help
```

## 🎉 Готовые примеры

В проекте уже созданы примеры QR-кодов:
- `data/qr_codes/` - примеры одиночных QR-кодов
- `data/qr_codes/batch_test/` - примеры из txt файла
- `data/qr_codes/batch_csv_test/` - примеры из csv файла

## 🔥 Быстрые команды

```bash
# Перейти в директорию со скриптами
cd scripts

# Создать простой QR-код
python3 generate_qr_code.py "https://example.com"

# Запустить интерактивный режим
python3 interactive_qr.py

# Создать примеры
python3 example_qr_generator.py

# Массовая генерация из CSV
python3 batch_qr_generator.py ../data/qr_codes/example_urls.csv --column url --name-column name
```

---

**Готово! Теперь вы можете создавать QR-коды для любых статических ссылок! 🚀**

