import * as XLSX from "xlsx";

export interface ParsedProduct {
  code: string;
  name: string;
  article?: string;
  category?: string;
  base_price?: number;
  cost_price?: number;
  brand?: string;
  collection?: string;
}

export interface ParseOptions {
  sheetName?: string;
  headerRow?: number;
  encoding?: string;
  separator?: string;
  mapping: Record<string, string>;
  fileType?: "products" | "returns" | "sales" | "stock-turnover" | "categories";
}

export class ExcelParser {
  static async parseFile(
    file: File,
    options: ParseOptions
  ): Promise<{
    success: boolean;
    data: ParsedProduct[];
    errors: Array<{ row: number; field: string; error: string }>;
    stats: {
      total_rows: number;
      processed: number;
      created: number;
      errors: number;
    };
  }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      // Get the sheet
      const sheetName = options.sheetName || workbook.SheetNames[0];
      if (!workbook.SheetNames.includes(sheetName)) {
        throw new Error(`Sheet "${sheetName}" not found`);
      }

      const worksheet = workbook.Sheets[sheetName];
      
      // Parse with headers
      const headerRowIndex = (options.headerRow || 1) - 1;
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        defval: "",
        blankrows: false,
        header: 1,
      });

      if (!Array.isArray(jsonData) || jsonData.length <= headerRowIndex) {
        throw new Error("Invalid file structure or header row not found");
      }

      // Get headers
      const headers = jsonData[headerRowIndex] as string[];
      const dataRows = jsonData.slice(headerRowIndex + 1) as string[][];

      // Create reverse mapping (field name -> column index)
      const reverseMapping: Record<string, number> = {};
      Object.entries(options.mapping).forEach(([field, columnName]) => {
        const index = headers.findIndex(
          (h) => h.toLowerCase().trim() === columnName.toLowerCase().trim()
        );
        if (index !== -1) {
          reverseMapping[field] = index;
        }
      });

      const errors: Array<{ row: number; field: string; error: string }> = [];
      const products: ParsedProduct[] = [];

      // Process rows
      dataRows.forEach((row, rowIndex) => {
        const actualRowIndex = headerRowIndex + rowIndex + 2; // +2 because rows are 1-indexed and we skip header
        
        if (!row || row.length === 0) return; // Skip empty rows

        try {
          const product: ParsedProduct = {
            code: "",
            name: "",
          };

          // Extract name (required только для products и categories)
          const fileType = options.fileType || "products";
          const requiresName = fileType === "products" || fileType === "categories";
          
          if (requiresName) {
            if (reverseMapping["name"] !== undefined) {
              const name = row[reverseMapping["name"]]?.toString().trim();
              if (!name) {
                errors.push({
                  row: actualRowIndex,
                  field: "name",
                  error: "Name is required",
                });
                return;
              }
              product.name = name;
            } else {
              errors.push({
                row: actualRowIndex,
                field: "name",
                error: "Name column not mapped",
              });
              return;
            }
          } else {
            // Для других типов файлов name опциональное или берется из другого поля
            if (reverseMapping["name"] !== undefined) {
              product.name = row[reverseMapping["name"]]?.toString().trim() || "";
            } else if (reverseMapping["operation"] !== undefined) {
              // Для возвратов можно использовать operation как name
              product.name = row[reverseMapping["operation"]]?.toString().trim() || "";
            } else {
              product.name = "";
            }
          }
          
          // Для возвратов проверяем обязательное поле documentNumber
          if (fileType === "returns") {
            if (reverseMapping["documentNumber"] === undefined) {
              errors.push({
                row: actualRowIndex,
                field: "documentNumber",
                error: "Document number column not mapped",
              });
              return;
            }
            const docNumber = row[reverseMapping["documentNumber"]]?.toString().trim();
            if (!docNumber) {
              errors.push({
                row: actualRowIndex,
                field: "documentNumber",
                error: "Document number is required",
              });
              return;
            }
            // Используем documentNumber как code для возвратов
            product.code = docNumber;
          }
          
          // Для продаж проверяем обязательные поля
          if (fileType === "sales") {
            if (reverseMapping["manager"] === undefined || reverseMapping["documentNumber"] === undefined) {
              const missingField = reverseMapping["manager"] === undefined ? "manager" : "documentNumber";
              errors.push({
                row: actualRowIndex,
                field: missingField,
                error: `${missingField} column not mapped`,
              });
              return;
            }
            const manager = row[reverseMapping["manager"]]?.toString().trim();
            const docNumber = row[reverseMapping["documentNumber"]]?.toString().trim();
            if (!manager || !docNumber) {
              errors.push({
                row: actualRowIndex,
                field: !manager ? "manager" : "documentNumber",
                error: `${!manager ? "Manager" : "Document number"} is required`,
              });
              return;
            }
            product.code = docNumber;
            product.name = manager; // Используем manager как name для продаж
          }
          
          // Для оборачиваемости проверяем обязательные поля
          if (fileType === "stock-turnover") {
            if (reverseMapping["article"] === undefined || reverseMapping["name"] === undefined) {
              const missingField = reverseMapping["article"] === undefined ? "article" : "name";
              errors.push({
                row: actualRowIndex,
                field: missingField,
                error: `${missingField} column not mapped`,
              });
              return;
            }
            const article = row[reverseMapping["article"]]?.toString().trim();
            const name = row[reverseMapping["name"]]?.toString().trim();
            if (!article || !name) {
              errors.push({
                row: actualRowIndex,
                field: !article ? "article" : "name",
                error: `${!article ? "Article" : "Name"} is required`,
              });
              return;
            }
            product.code = article;
            product.name = name;
          }
          
          // Для категорий name уже обработано выше

          // Extract code (optional, может быть равен article)
          if (reverseMapping["code"] !== undefined) {
            const code = row[reverseMapping["code"]]?.toString().trim();
            product.code = code || "";
          } else if (reverseMapping["article"] !== undefined) {
            // Если code не указан, используем article как code
            const article = row[reverseMapping["article"]]?.toString().trim();
            product.code = article || "";
          } else {
            // Если ни code, ни article не указаны, оставляем пустым
            product.code = "";
          }

          // Extract optional fields
          if (reverseMapping["article"] !== undefined) {
            product.article = row[reverseMapping["article"]]?.toString().trim();
          }

          if (reverseMapping["category"] !== undefined) {
            product.category = row[reverseMapping["category"]]?.toString().trim();
          }

          if (reverseMapping["base_price"] !== undefined) {
            const price = row[reverseMapping["base_price"]];
            if (price) {
              const parsed = parseFloat(price.toString().replace(",", "."));
              if (!isNaN(parsed)) {
                product.base_price = parsed;
              } else {
                errors.push({
                  row: actualRowIndex,
                  field: "base_price",
                  error: "Invalid number format",
                });
                return;
              }
            }
          }

          if (reverseMapping["cost_price"] !== undefined) {
            const price = row[reverseMapping["cost_price"]];
            if (price) {
              const parsed = parseFloat(price.toString().replace(",", "."));
              if (!isNaN(parsed)) {
                product.cost_price = parsed;
              } else {
                errors.push({
                  row: actualRowIndex,
                  field: "cost_price",
                  error: "Invalid number format",
                });
                return;
              }
            }
          }

          if (reverseMapping["brand"] !== undefined) {
            product.brand = row[reverseMapping["brand"]]?.toString().trim();
          }

          if (reverseMapping["collection"] !== undefined) {
            product.collection = row[reverseMapping["collection"]]?.toString().trim();
          }

          products.push(product);
        } catch (error) {
          errors.push({
            row: actualRowIndex,
            field: "general",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      });

      return {
        success: errors.length === 0,
        data: products,
        errors,
        stats: {
          total_rows: dataRows.length,
          processed: dataRows.length - errors.length,
          created: products.length,
          errors: errors.length,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to parse file: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  static getSheetNames(file: File): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "array" });
          resolve(workbook.SheetNames);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  }

  static async getColumns(file: File, sheetName?: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "array" });
          const sheet = sheetName ? workbook.Sheets[sheetName] : workbook.Sheets[workbook.SheetNames[0]];

          if (!sheet) {
            reject(new Error("Sheet not found"));
            return;
          }

          // Parse first row as headers
          const jsonData = XLSX.utils.sheet_to_json(sheet, {
            defval: "",
            blankrows: false,
            header: 1,
          });

          if (Array.isArray(jsonData) && jsonData.length > 0) {
            const headers = jsonData[0] as string[];
            resolve(headers.filter((h) => h && h.trim()));
          } else {
            resolve([]);
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  }
}
