#!/usr/bin/env python3
"""
Генератор QR-кодов для статических ссылок.

Использование:
    python generate_qr_code.py <URL> [--output <путь_к_файлу>] [--size <размер>]

Примеры:
    python generate_qr_code.py https://example.com
    python generate_qr_code.py https://example.com --output qr.png --size 300
"""

import argparse
import qrcode
from pathlib import Path
from typing import Optional


class QRCodeGenerator:
    """Генератор QR-кодов для статических ссылок."""
    
    def __init__(
        self,
        box_size: int = 10,
        border: int = 4,
        fill_color: str = "black",
        back_color: str = "white"
    ):
        """
        Инициализация генератора QR-кодов.
        
        Args:
            box_size: Размер каждого блока в QR-коде (в пикселях)
            border: Толщина рамки (в блоках)
            fill_color: Цвет переднего плана (QR-код)
            back_color: Цвет фона
        """
        self.box_size = box_size
        self.border = border
        self.fill_color = fill_color
        self.back_color = back_color
    
    def generate(
        self,
        url: str,
        output_path: Optional[str] = None,
        error_correction: str = "M"
    ) -> str:
        """
        Генерирует QR-код для указанной ссылки.
        
        Args:
            url: URL для кодирования в QR-код
            output_path: Путь для сохранения изображения (по умолчанию: qr_code.png)
            error_correction: Уровень коррекции ошибок (L, M, Q, H)
        
        Returns:
            Путь к созданному файлу
        """
        # Словарь уровней коррекции ошибок
        error_levels = {
            "L": qrcode.constants.ERROR_CORRECT_L,  # ~7% коррекция
            "M": qrcode.constants.ERROR_CORRECT_M,  # ~15% коррекция
            "Q": qrcode.constants.ERROR_CORRECT_Q,  # ~25% коррекция
            "H": qrcode.constants.ERROR_CORRECT_H,  # ~30% коррекция
        }
        
        # Создаём объект QR-кода
        qr = qrcode.QRCode(
            version=1,  # Размер QR-кода (1-40), None = автоматически
            error_correction=error_levels.get(error_correction.upper(), qrcode.constants.ERROR_CORRECT_M),
            box_size=self.box_size,
            border=self.border,
        )
        
        # Добавляем данные
        qr.add_data(url)
        qr.make(fit=True)
        
        # Создаём изображение
        img = qr.make_image(fill_color=self.fill_color, back_color=self.back_color)
        
        # Определяем путь для сохранения
        if output_path is None:
            output_path = "qr_code.png"
        
        # Создаём директорию, если её нет
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Сохраняем изображение
        img.save(str(output_file))
        
        return str(output_file.absolute())
    
    def generate_with_custom_size(
        self,
        url: str,
        output_path: Optional[str] = None,
        size: int = 300,
        error_correction: str = "M"
    ) -> str:
        """
        Генерирует QR-код с заданным размером изображения.
        
        Args:
            url: URL для кодирования в QR-код
            output_path: Путь для сохранения изображения
            size: Приблизительный размер изображения в пикселях
            error_correction: Уровень коррекции ошибок (L, M, Q, H)
        
        Returns:
            Путь к созданному файлу
        """
        # Вычисляем подходящий box_size
        estimated_modules = 21  # Минимальное количество модулей в QR-коде
        calculated_box_size = max(1, size // (estimated_modules + 2 * self.border))
        
        original_box_size = self.box_size
        self.box_size = calculated_box_size
        
        result = self.generate(url, output_path, error_correction)
        
        self.box_size = original_box_size
        return result


def main():
    """Основная функция для работы из командной строки."""
    parser = argparse.ArgumentParser(
        description="Генератор QR-кодов для статических ссылок",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Примеры использования:
  %(prog)s https://example.com
  %(prog)s https://example.com --output my_qr.png
  %(prog)s https://example.com --output qr.png --size 500
  %(prog)s https://example.com --error-correction H --fill-color blue
        """
    )
    
    parser.add_argument(
        "url",
        help="URL-адрес для генерации QR-кода"
    )
    
    parser.add_argument(
        "-o", "--output",
        default="qr_code.png",
        help="Путь к выходному файлу (по умолчанию: qr_code.png)"
    )
    
    parser.add_argument(
        "-s", "--size",
        type=int,
        help="Приблизительный размер изображения в пикселях (опционально)"
    )
    
    parser.add_argument(
        "-e", "--error-correction",
        choices=["L", "M", "Q", "H"],
        default="M",
        help="Уровень коррекции ошибок: L (7%%), M (15%%), Q (25%%), H (30%%). По умолчанию: M"
    )
    
    parser.add_argument(
        "--box-size",
        type=int,
        default=10,
        help="Размер каждого блока QR-кода в пикселях (по умолчанию: 10)"
    )
    
    parser.add_argument(
        "--border",
        type=int,
        default=4,
        help="Толщина рамки в блоках (по умолчанию: 4)"
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
    
    # Создаём генератор
    generator = QRCodeGenerator(
        box_size=args.box_size,
        border=args.border,
        fill_color=args.fill_color,
        back_color=args.back_color
    )
    
    # Генерируем QR-код
    try:
        if args.size:
            output_file = generator.generate_with_custom_size(
                url=args.url,
                output_path=args.output,
                size=args.size,
                error_correction=args.error_correction
            )
        else:
            output_file = generator.generate(
                url=args.url,
                output_path=args.output,
                error_correction=args.error_correction
            )
        
        print(f"✓ QR-код успешно создан: {output_file}")
        print(f"  URL: {args.url}")
        
    except Exception as e:
        print(f"✗ Ошибка при создании QR-кода: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())

