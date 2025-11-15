# Руководство по генератору QR-кодов

## Описание

Генератор QR-кодов для создания QR-кодов, ведущих на статические ссылки. Поддерживает настройку размера, цветов и уровня коррекции ошибок.

## Установка зависимостей

```bash
pip install -r requirements.txt
```

Основная библиотека: `qrcode[pil]` - для генерации и сохранения QR-кодов в формате PNG.

## Быстрый старт

### Использование из командной строки

#### 1. Простая генерация QR-кода

```bash
cd scripts
python generate_qr_code.py "https://example.com"
```

Создаст файл `qr_code.png` в текущей директории.

#### 2. Указание выходного файла

```bash
python generate_qr_code.py "https://vk.com/your_page" --output my_vk_qr.png
```

#### 3. Создание QR-кода определённого размера

```bash
python generate_qr_code.py "https://example.com" --size 500 --output large_qr.png
```

#### 4. Настройка коррекции ошибок

```bash
python generate_qr_code.py "https://example.com" --error-correction H --output qr_high.png
```

Уровни коррекции ошибок:
- **L** - ~7% (минимальная)
- **M** - ~15% (средняя, по умолчанию)
- **Q** - ~25% (хорошая)
- **H** - ~30% (максимальная)

#### 5. Цветной QR-код

```bash
python generate_qr_code.py "https://example.com" \
    --fill-color darkblue \
    --back-color lightyellow \
    --output colored_qr.png
```

#### 6. Полная настройка

```bash
python generate_qr_code.py "https://example.com" \
    --output custom_qr.png \
    --size 400 \
    --error-correction Q \
    --box-size 8 \
    --border 2 \
    --fill-color "#1a1a1a" \
    --back-color "#f0f0f0"
```

### Использование в Python-коде

#### Пример 1: Простая генерация

```python
from scripts.generate_qr_code import QRCodeGenerator

# Создаём генератор
generator = QRCodeGenerator()

# Генерируем QR-код
output_path = generator.generate(
    url="https://example.com",
    output_path="qr_code.png"
)

print(f"QR-код создан: {output_path}")
```

#### Пример 2: С заданным размером

```python
from scripts.generate_qr_code import QRCodeGenerator

generator = QRCodeGenerator()

output_path = generator.generate_with_custom_size(
    url="https://vk.com/your_page",
    output_path="vk_qr.png",
    size=500,  # размер в пикселях
    error_correction="M"
)
```

#### Пример 3: Настройка внешнего вида

```python
from scripts.generate_qr_code import QRCodeGenerator

# Создаём генератор с кастомными параметрами
generator = QRCodeGenerator(
    box_size=10,        # размер каждого блока в пикселях
    border=4,           # толщина рамки в блоках
    fill_color="blue",  # цвет QR-кода
    back_color="white"  # цвет фона
)

output_path = generator.generate(
    url="https://your-website.com",
    output_path="styled_qr.png",
    error_correction="H"  # высокая коррекция ошибок
)
```

#### Пример 4: Массовая генерация

```python
from scripts.generate_qr_code import QRCodeGenerator
from pathlib import Path

generator = QRCodeGenerator()

# Список ссылок
urls = {
    "vk": "https://vk.com/your_page",
    "instagram": "https://instagram.com/your_profile",
    "website": "https://your-website.com",
    "telegram": "https://t.me/your_channel"
}

# Создаём директорию для QR-кодов
output_dir = Path("../data/qr_codes")
output_dir.mkdir(parents=True, exist_ok=True)

# Генерируем QR-код для каждой ссылки
for name, url in urls.items():
    output_path = generator.generate(
        url=url,
        output_path=str(output_dir / f"{name}_qr.png")
    )
    print(f"✓ {name}: {output_path}")
```

## Параметры генератора

### Класс QRCodeGenerator

#### Инициализация

```python
QRCodeGenerator(
    box_size: int = 10,        # Размер каждого блока QR-кода
    border: int = 4,            # Толщина рамки (минимум 4)
    fill_color: str = "black",  # Цвет переднего плана
    back_color: str = "white"   # Цвет фона
)
```

#### Метод generate()

```python
generator.generate(
    url: str,                    # URL для кодирования
    output_path: str = None,     # Путь к выходному файлу
    error_correction: str = "M"  # Уровень коррекции (L, M, Q, H)
) -> str  # Возвращает путь к созданному файлу
```

#### Метод generate_with_custom_size()

```python
generator.generate_with_custom_size(
    url: str,                    # URL для кодирования
    output_path: str = None,     # Путь к выходному файлу
    size: int = 300,             # Желаемый размер в пикселях
    error_correction: str = "M"  # Уровень коррекции (L, M, Q, H)
) -> str  # Возвращает путь к созданному файлу
```

## Цвета

Вы можете использовать:
- Названия цветов: `"black"`, `"white"`, `"red"`, `"blue"`, `"green"`, `"yellow"`, и т.д.
- HEX-коды: `"#FF0000"`, `"#00FF00"`, `"#0000FF"`, и т.д.
- RGB-кортежи: `(255, 0, 0)`, `(0, 255, 0)`, `(0, 0, 255)`, и т.д.

## Примеры использования

### Для бизнеса

```python
# QR-код для меню ресторана
generator.generate(
    url="https://restaurant.com/menu",
    output_path="menu_qr.png"
)

# QR-код для отзывов
generator.generate(
    url="https://google.com/maps/place/your-place",
    output_path="reviews_qr.png",
    error_correction="H"  # высокая надёжность для печати
)
```

### Для маркетинга

```python
# QR-код для Instagram
generator_instagram = QRCodeGenerator(
    fill_color="#E1306C",  # цвет Instagram
    back_color="white"
)
generator_instagram.generate(
    url="https://instagram.com/your_profile",
    output_path="instagram_qr.png"
)

# QR-код для VK
generator_vk = QRCodeGenerator(
    fill_color="#0077FF",  # цвет VK
    back_color="white"
)
generator_vk.generate(
    url="https://vk.com/your_page",
    output_path="vk_qr.png"
)
```

### Для мероприятий

```python
# Регистрация на мероприятие
generator.generate_with_custom_size(
    url="https://event.com/register?code=ABC123",
    output_path="event_registration_qr.png",
    size=800,  # большой размер для печати на баннере
    error_correction="H"
)
```

## Рекомендации

### Размеры

- **Маленькие стикеры**: 200-300 пикселей
- **Визитки**: 300-400 пикселей
- **Флаеры A5/A4**: 500-800 пикселей
- **Баннеры/постеры**: 1000+ пикселей

### Коррекция ошибок

- **L (7%)**: Для цифровых экранов
- **M (15%)**: Для обычной печати (по умолчанию)
- **Q (25%)**: Для условий с возможными повреждениями
- **H (30%)**: Для визиток, наклеек, наружной рекламы

### Цвета

- **Контрастность**: Убедитесь в достаточном контрасте между `fill_color` и `back_color`
- **Тёмный на светлом**: Обычно работает лучше всего
- **Печать**: Избегайте очень светлых цветов для печати

## Тестирование QR-кодов

После создания QR-кода протестируйте его:
1. Откройте камеру на смартфоне
2. Наведите на QR-код
3. Убедитесь, что ссылка открывается корректно

## Устранение неполадок

### QR-код не сканируется

- Увеличьте контрастность цветов
- Увеличьте параметр `border` (минимум 4)
- Повысьте уровень коррекции ошибок до Q или H
- Увеличьте размер изображения

### Изображение слишком маленькое/большое

- Используйте `generate_with_custom_size()` с параметром `size`
- Или настройте `box_size` при создании генератора

### Ошибки импорта

```bash
# Переустановите библиотеку
pip install --upgrade qrcode[pil]
```

## Интеграция с существующим проектом

Генератор можно легко интегрировать в существующие скрипты:

```python
# В вашем скрипте
from scripts.generate_qr_code import QRCodeGenerator

# После получения данных из API
campaign_url = "https://vk.com/ads?campaign_id=12345"

# Создаём QR-код для кампании
generator = QRCodeGenerator()
qr_path = generator.generate(
    url=campaign_url,
    output_path=f"data/qr_codes/campaign_12345.png"
)

print(f"QR-код для кампании: {qr_path}")
```

## Дополнительные ресурсы

- Документация qrcode: https://github.com/lincolnloop/python-qrcode
- Спецификация QR-кодов: https://www.qrcode.com/en/about/standards.html

## Поддержка

При возникновении вопросов или проблем создайте Issue в репозитории проекта.

