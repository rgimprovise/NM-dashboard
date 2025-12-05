#!/usr/bin/env python3
"""
Пример использования генератора QR-кодов.
Создаёт QR-коды для различных ссылок.
"""

from generate_qr_code import QRCodeGenerator
from pathlib import Path


def main():
    """Примеры создания QR-кодов."""
    
    # Создаём папку для QR-кодов
    output_dir = Path("../data/qr_codes")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Инициализируем генератор
    generator = QRCodeGenerator()
    
    # Пример 1: Простой QR-код
    print("Генерация простого QR-кода...")
    url1 = "https://example.com"
    output1 = generator.generate(
        url=url1,
        output_path=str(output_dir / "simple_qr.png")
    )
    print(f"✓ Создан: {output1}")
    
    # Пример 2: QR-код с заданным размером
    print("\nГенерация QR-кода с заданным размером...")
    url2 = "https://vk.com/your_page"
    output2 = generator.generate_with_custom_size(
        url=url2,
        output_path=str(output_dir / "vk_qr_large.png"),
        size=500
    )
    print(f"✓ Создан: {output2}")
    
    # Пример 3: QR-код с высокой коррекцией ошибок
    print("\nГенерация QR-кода с высокой коррекцией ошибок...")
    url3 = "https://ya.ru/market"
    output3 = generator.generate(
        url=url3,
        output_path=str(output_dir / "yandex_qr_high_correction.png"),
        error_correction="H"
    )
    print(f"✓ Создан: {output3}")
    
    # Пример 4: Цветной QR-код
    print("\nГенерация цветного QR-кода...")
    generator_color = QRCodeGenerator(
        box_size=10,
        border=2,
        fill_color="darkblue",
        back_color="lightyellow"
    )
    url4 = "https://your-website.com"
    output4 = generator_color.generate(
        url=url4,
        output_path=str(output_dir / "colored_qr.png")
    )
    print(f"✓ Создан: {output4}")
    
    print(f"\n{'='*50}")
    print(f"Все QR-коды сохранены в: {output_dir.absolute()}")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()

