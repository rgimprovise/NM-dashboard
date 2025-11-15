#!/usr/bin/env python3
"""
Массовый генератор QR-кодов из CSV файла или списка URL.

Использование:
    python batch_qr_generator.py urls.txt
    python batch_qr_generator.py urls.csv --column url --name-column name
"""

import argparse
import csv
from pathlib import Path
from typing import List, Dict
from generate_qr_code import QRCodeGenerator


def read_urls_from_txt(file_path: str) -> List[Dict[str, str]]:
    """
    Читает URL из текстового файла (по одному на строку).
    
    Args:
        file_path: Путь к текстовому файлу
    
    Returns:
        Список словарей с URL и именами файлов
    """
    urls = []
    with open(file_path, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f, start=1):
            line = line.strip()
            if line and not line.startswith('#'):  # Игнорируем пустые строки и комментарии
                urls.append({
                    'url': line,
                    'name': f'qr_{i:03d}'
                })
    return urls


def read_urls_from_csv(
    file_path: str,
    url_column: str = 'url',
    name_column: str = None
) -> List[Dict[str, str]]:
    """
    Читает URL из CSV файла.
    
    Args:
        file_path: Путь к CSV файлу
        url_column: Название колонки с URL
        name_column: Название колонки с именами (опционально)
    
    Returns:
        Список словарей с URL и именами файлов
    """
    urls = []
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        if url_column not in reader.fieldnames:
            raise ValueError(f"Колонка '{url_column}' не найдена в CSV файле")
        
        for i, row in enumerate(reader, start=1):
            url = row.get(url_column, '').strip()
            if url:
                name = row.get(name_column, f'qr_{i:03d}') if name_column else f'qr_{i:03d}'
                # Очищаем имя от недопустимых символов
                name = "".join(c if c.isalnum() or c in ('-', '_') else '_' for c in name)
                urls.append({
                    'url': url,
                    'name': name
                })
    
    return urls


def generate_batch_qr_codes(
    urls: List[Dict[str, str]],
    output_dir: str,
    size: int = None,
    error_correction: str = "M",
    fill_color: str = "black",
    back_color: str = "white"
) -> List[str]:
    """
    Генерирует QR-коды для списка URL.
    
    Args:
        urls: Список словарей с 'url' и 'name'
        output_dir: Директория для сохранения QR-кодов
        size: Размер изображения в пикселях
        error_correction: Уровень коррекции ошибок
        fill_color: Цвет QR-кода
        back_color: Цвет фона
    
    Returns:
        Список путей к созданным файлам
    """
    # Создаём директорию
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Создаём генератор
    generator = QRCodeGenerator(
        fill_color=fill_color,
        back_color=back_color
    )
    
    created_files = []
    
    print(f"Начинаем генерацию {len(urls)} QR-кодов...")
    print("=" * 60)
    
    for i, item in enumerate(urls, start=1):
        url = item['url']
        name = item['name']
        output_file = output_path / f"{name}.png"
        
        try:
            if size:
                result = generator.generate_with_custom_size(
                    url=url,
                    output_path=str(output_file),
                    size=size,
                    error_correction=error_correction
                )
            else:
                result = generator.generate(
                    url=url,
                    output_path=str(output_file),
                    error_correction=error_correction
                )
            
            created_files.append(result)
            print(f"✓ [{i}/{len(urls)}] {name}.png - {url[:50]}{'...' if len(url) > 50 else ''}")
            
        except Exception as e:
            print(f"✗ [{i}/{len(urls)}] Ошибка для {name}: {e}")
    
    print("=" * 60)
    print(f"Завершено! Создано {len(created_files)} из {len(urls)} QR-кодов")
    
    return created_files


def main():
    """Основная функция."""
    parser = argparse.ArgumentParser(
        description="Массовый генератор QR-кодов",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Примеры использования:

  1. Из текстового файла (по одному URL на строку):
     %(prog)s urls.txt

  2. Из CSV файла с колонкой 'url':
     %(prog)s urls.csv

  3. Из CSV с указанием колонок:
     %(prog)s urls.csv --column link --name-column title

  4. С дополнительными настройками:
     %(prog)s urls.txt --output qr_codes --size 500 --error-correction H

Формат текстового файла (urls.txt):
  https://example.com
  https://vk.com/page
  # Это комментарий, будет пропущен
  https://instagram.com/profile

Формат CSV файла (urls.csv):
  name,url
  Example,https://example.com
  VK Page,https://vk.com/page
  Instagram,https://instagram.com/profile
        """
    )
    
    parser.add_argument(
        "input_file",
        help="Путь к файлу с URL (txt или csv)"
    )
    
    parser.add_argument(
        "-o", "--output",
        default="../data/qr_codes",
        help="Директория для сохранения QR-кодов (по умолчанию: ../data/qr_codes)"
    )
    
    parser.add_argument(
        "-c", "--column",
        default="url",
        help="Название колонки с URL в CSV файле (по умолчанию: url)"
    )
    
    parser.add_argument(
        "-n", "--name-column",
        help="Название колонки с именами файлов в CSV (опционально)"
    )
    
    parser.add_argument(
        "-s", "--size",
        type=int,
        help="Размер изображения в пикселях (опционально)"
    )
    
    parser.add_argument(
        "-e", "--error-correction",
        choices=["L", "M", "Q", "H"],
        default="M",
        help="Уровень коррекции ошибок (по умолчанию: M)"
    )
    
    parser.add_argument(
        "--fill-color",
        default="black",
        help="Цвет QR-кода (по умолчанию: black)"
    )
    
    parser.add_argument(
        "--back-color",
        default="white",
        help="Цвет фона (по умолчанию: white)"
    )
    
    args = parser.parse_args()
    
    # Проверяем существование входного файла
    input_path = Path(args.input_file)
    if not input_path.exists():
        print(f"❌ Файл не найден: {args.input_file}")
        return 1
    
    # Читаем URL из файла
    try:
        if input_path.suffix.lower() == '.csv':
            urls = read_urls_from_csv(
                str(input_path),
                url_column=args.column,
                name_column=args.name_column
            )
        else:
            urls = read_urls_from_txt(str(input_path))
        
        if not urls:
            print("❌ Не найдено URL в файле")
            return 1
        
        print(f"📋 Загружено {len(urls)} URL из {args.input_file}")
        
    except Exception as e:
        print(f"❌ Ошибка при чтении файла: {e}")
        return 1
    
    # Генерируем QR-коды
    try:
        created_files = generate_batch_qr_codes(
            urls=urls,
            output_dir=args.output,
            size=args.size,
            error_correction=args.error_correction,
            fill_color=args.fill_color,
            back_color=args.back_color
        )
        
        if created_files:
            print(f"\n📁 QR-коды сохранены в: {Path(args.output).absolute()}")
            return 0
        else:
            print("\n❌ Не удалось создать ни одного QR-кода")
            return 1
            
    except Exception as e:
        print(f"\n❌ Ошибка при генерации: {e}")
        return 1


if __name__ == "__main__":
    exit(main())

