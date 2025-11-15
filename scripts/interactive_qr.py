#!/usr/bin/env python3
"""
Интерактивный генератор QR-кодов.
Позволяет создавать QR-коды через простой интерфейс в терминале.
"""

from generate_qr_code import QRCodeGenerator
from pathlib import Path


def get_input(prompt: str, default: str = None) -> str:
    """Получает ввод пользователя с возможностью значения по умолчанию."""
    if default:
        user_input = input(f"{prompt} [{default}]: ").strip()
        return user_input if user_input else default
    return input(f"{prompt}: ").strip()


def get_yes_no(prompt: str, default: bool = False) -> bool:
    """Получает ответ да/нет от пользователя."""
    default_str = "Y/n" if default else "y/N"
    response = input(f"{prompt} [{default_str}]: ").strip().lower()
    
    if not response:
        return default
    
    return response in ['y', 'yes', 'да', 'д']


def main():
    """Интерактивный интерфейс для создания QR-кодов."""
    print("=" * 60)
    print("Генератор QR-кодов".center(60))
    print("=" * 60)
    print()
    
    # Получаем URL
    url = get_input("Введите URL для QR-кода")
    
    if not url:
        print("❌ URL не может быть пустым!")
        return 1
    
    # Добавляем https:// если не указан протокол
    if not url.startswith(('http://', 'https://')):
        if get_yes_no(f"Добавить 'https://' к URL?", default=True):
            url = f"https://{url}"
    
    print(f"\n📎 URL: {url}")
    
    # Получаем имя файла
    default_filename = "qr_code.png"
    output_path = get_input("\nВведите имя файла для сохранения", default=default_filename)
    
    # Создаём путь в директории qr_codes
    qr_dir = Path("../data/qr_codes")
    qr_dir.mkdir(parents=True, exist_ok=True)
    full_output_path = qr_dir / output_path
    
    # Настройки
    print("\n" + "=" * 60)
    print("Дополнительные настройки (Enter для значений по умолчанию)")
    print("=" * 60)
    
    # Размер
    size_input = get_input("Размер изображения в пикселях (или Enter для автоматического)", default="")
    size = int(size_input) if size_input and size_input.isdigit() else None
    
    # Уровень коррекции ошибок
    print("\nУровень коррекции ошибок:")
    print("  L - 7%  (минимальная)")
    print("  M - 15% (средняя, рекомендуется)")
    print("  Q - 25% (хорошая)")
    print("  H - 30% (максимальная)")
    error_correction = get_input("Выберите уровень коррекции", default="M").upper()
    
    if error_correction not in ['L', 'M', 'Q', 'H']:
        error_correction = 'M'
    
    # Цвета
    use_custom_colors = get_yes_no("\nИспользовать пользовательские цвета?", default=False)
    
    fill_color = "black"
    back_color = "white"
    
    if use_custom_colors:
        fill_color = get_input("Цвет QR-кода", default="black")
        back_color = get_input("Цвет фона", default="white")
    
    # Создаём генератор
    generator = QRCodeGenerator(
        fill_color=fill_color,
        back_color=back_color
    )
    
    # Генерируем QR-код
    print("\n" + "=" * 60)
    print("Создание QR-кода...")
    print("=" * 60)
    
    try:
        if size:
            result_path = generator.generate_with_custom_size(
                url=url,
                output_path=str(full_output_path),
                size=size,
                error_correction=error_correction
            )
        else:
            result_path = generator.generate(
                url=url,
                output_path=str(full_output_path),
                error_correction=error_correction
            )
        
        print(f"\n✅ QR-код успешно создан!")
        print(f"📁 Путь: {result_path}")
        print(f"🔗 URL: {url}")
        
        if size:
            print(f"📏 Размер: ~{size} пикселей")
        
        print(f"🛡️  Коррекция ошибок: {error_correction}")
        
        if use_custom_colors:
            print(f"🎨 Цвета: {fill_color} на {back_color}")
        
        print("\n" + "=" * 60)
        
        # Предложение создать ещё один
        if get_yes_no("\nСоздать ещё один QR-код?", default=False):
            print("\n")
            return main()
        
    except Exception as e:
        print(f"\n❌ Ошибка при создании QR-кода: {e}")
        return 1
    
    print("\n👋 До свидания!")
    return 0


if __name__ == "__main__":
    try:
        exit(main())
    except KeyboardInterrupt:
        print("\n\n👋 Прервано пользователем. До свидания!")
        exit(0)

