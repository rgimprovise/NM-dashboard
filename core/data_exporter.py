"""
Утилиты для экспорта данных в различные форматы
"""

import json
import os
import pandas as pd
from typing import Dict, Any, List


class DataExporter:
    """Класс для экспорта данных в различные форматы"""
    
    @staticmethod
    def save_to_json(data: Any, filename: str, indent: int = 2):
        """
        Сохранить данные в JSON файл
        
        Args:
            data: Данные для сохранения
            filename: Путь к файлу
            indent: Отступы в JSON (по умолчанию 2)
        """
        if not data:
            print(f"⚠️  Нет данных для сохранения в {filename}")
            return
        
        try:
            # Создаем директорию если нужно
            os.makedirs(os.path.dirname(filename) if os.path.dirname(filename) else ".", exist_ok=True)
            
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=indent)
            
            file_size = os.path.getsize(filename) / 1024
            print(f"✓ {os.path.basename(filename)} ({file_size:.1f} KB)")
            
        except Exception as e:
            print(f"❌ Ошибка при сохранении {filename}: {e}")
    
    @staticmethod
    def save_to_csv(data: Any, filename: str, encoding: str = 'utf-8'):
        """
        Сохранить данные в CSV файл
        
        Args:
            data: Данные для сохранения (dict, list, или DataFrame)
            filename: Путь к файлу
            encoding: Кодировка файла
        """
        if not data:
            print(f"⚠️  Нет данных для сохранения в {filename}")
            return
        
        try:
            # Создаем директорию если нужно
            os.makedirs(os.path.dirname(filename) if os.path.dirname(filename) else ".", exist_ok=True)
            
            # Конвертируем в DataFrame если нужно
            if isinstance(data, dict):
                df = pd.DataFrame([data])
            elif isinstance(data, list):
                df = pd.DataFrame(data)
            elif isinstance(data, pd.DataFrame):
                df = data
            else:
                df = pd.DataFrame(data)
            
            df.to_csv(filename, index=False, encoding=encoding)
            
            file_size = os.path.getsize(filename) / 1024
            print(f"✓ {os.path.basename(filename)} ({file_size:.1f} KB)")
            
        except Exception as e:
            print(f"❌ Ошибка при сохранении {filename}: {e}")
    
    @staticmethod
    def save_to_excel(data: Dict[str, Any], filename: str):
        """
        Сохранить данные в Excel файл (несколько листов)
        
        Args:
            data: Словарь {имя_листа: данные}
            filename: Путь к файлу
        """
        if not data:
            print(f"⚠️  Нет данных для сохранения в {filename}")
            return
        
        try:
            # Создаем директорию если нужно
            os.makedirs(os.path.dirname(filename) if os.path.dirname(filename) else ".", exist_ok=True)
            
            with pd.ExcelWriter(filename, engine='openpyxl') as writer:
                for sheet_name, sheet_data in data.items():
                    # Конвертируем в DataFrame если нужно
                    if isinstance(sheet_data, dict):
                        df = pd.DataFrame([sheet_data])
                    elif isinstance(sheet_data, list):
                        df = pd.DataFrame(sheet_data)
                    elif isinstance(sheet_data, pd.DataFrame):
                        df = sheet_data
                    else:
                        df = pd.DataFrame(sheet_data)
                    
                    df.to_excel(writer, sheet_name=sheet_name[:31], index=False)  # Excel ограничение 31 символ
            
            file_size = os.path.getsize(filename) / 1024
            print(f"✓ {os.path.basename(filename)} ({file_size:.1f} KB)")
            
        except Exception as e:
            print(f"❌ Ошибка при сохранении {filename}: {e}")
    
    @staticmethod
    def load_from_json(filename: str) -> Any:
        """
        Загрузить данные из JSON файла
        
        Args:
            filename: Путь к файлу
            
        Returns:
            Загруженные данные или None при ошибке
        """
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"❌ Файл не найден: {filename}")
            return None
        except Exception as e:
            print(f"❌ Ошибка при загрузке {filename}: {e}")
            return None
    
    @staticmethod
    def create_directory(directory: str):
        """
        Создать директорию если её нет
        
        Args:
            directory: Путь к директории
        """
        try:
            os.makedirs(directory, exist_ok=True)
            print(f"✓ Директория создана/проверена: {directory}")
        except Exception as e:
            print(f"❌ Ошибка при создании директории {directory}: {e}")

