# Генератор QR-кодов

Простой и мощный инструмент для создания QR-кодов для статических ссылок.

## Быстрый старт

### 1. Установка зависимостей

```bash
pip install qrcode[pil]
# или
pip install -r requirements.txt
```

### 2. Использование из командной строки

#### Простой пример
```bash
python3 generate_qr_code.py "https://example.com"
```

#### С указанием имени файла
```bash
python3 generate_qr_code.py "https://vk.com/your_page" --output my_qr.png
```

#### С заданным размером
```bash
python3 generate_qr_code.py "https://example.com" --size 500 --output large_qr.png
```

#### Цветной QR-код
```bash
python3 generate_qr_code.py "https://example.com" \
    --fill-color blue \
    --back-color lightyellow \
    --output colored_qr.png
```

### 3. Использование в Python

```python
from generate_qr_code import QRCodeGenerator

# Создаём генератор
generator = QRCodeGenerator()

# Генерируем QR-код
output = generator.generate(
    url="https://example.com",
    output_path="my_qr.png"
)

print(f"QR-код создан: {output}")
```

### 4. Запуск примеров

```bash
python3 example_qr_generator.py
```

Этот скрипт создаст несколько примеров QR-кодов в папке `../data/qr_codes/`.

## Параметры командной строки

- `url` - URL для QR-кода (обязательный)
- `-o`, `--output` - Путь к выходному файлу (по умолчанию: qr_code.png)
- `-s`, `--size` - Размер изображения в пикселях
- `-e`, `--error-correction` - Уровень коррекции: L, M, Q, H (по умолчанию: M)
- `--box-size` - Размер каждого блока (по умолчанию: 10)
- `--border` - Толщина рамки (по умолчанию: 4)
- `--fill-color` - Цвет QR-кода (по умолчанию: black)
- `--back-color` - Цвет фона (по умолчанию: white)

## Помощь

```bash
python3 generate_qr_code.py --help
```

## Полная документация

См. [QR_CODE_GENERATOR_GUIDE.md](../docs/QR_CODE_GENERATOR_GUIDE.md) для подробной документации.

## Примеры использования

### Для бизнеса
- Меню ресторана
- Ссылки на отзывы
- Контактная информация

### Для маркетинга
- Социальные сети (VK, Instagram, Telegram)
- Лендинги и промо-страницы
- Рекламные материалы

### Для мероприятий
- Регистрация на события
- Программа мероприятия
- Контакты организаторов

## Рекомендуемые размеры

- **Визитки**: 300-400 px
- **Флаеры**: 500-800 px
- **Баннеры**: 1000+ px

## Уровни коррекции ошибок

- **L** (7%) - Для экранов
- **M** (15%) - Для печати (по умолчанию)
- **Q** (25%) - С возможными повреждениями
- **H** (30%) - Для наружной рекламы

