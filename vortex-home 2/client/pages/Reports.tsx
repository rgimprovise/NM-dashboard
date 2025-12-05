import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Calendar } from "lucide-react";

const reportTemplates = [
  {
    id: "marketing",
    name: "Отчет по маркетингу",
    description: "Комплексный анализ всех рекламных кампаний",
    icon: "📊",
    formats: ["PDF", "XLSX", "CSV"],
  },
  {
    id: "sales",
    name: "Отчет по продажам",
    description: "Анализ заказов, выручки и клиентов",
    icon: "💰",
    formats: ["PDF", "XLSX", "CSV"],
  },
  {
    id: "products",
    name: "Производительность товаров",
    description: "Метрики продаж и статус инвентаря по товарам",
    icon: "📦",
    formats: ["PDF", "XLSX", "CSV"],
  },
  {
    id: "executive",
    name: "Сводная информация",
    description: "Ключевые метрики и стратегические выводы",
    icon: "📈",
    formats: ["PDF"],
  },
];

const recentReports = [
  {
    id: 1,
    name: "Отчет по маркетингу - Ноябрь 2025",
    template: "marketing",
    created: "2025-11-12T10:30:00Z",
    format: "PDF",
    size: "2.4 MB",
  },
  {
    id: 2,
    name: "Отчет по продажам - Октябрь 2025",
    template: "sales",
    created: "2025-10-31T16:45:00Z",
    format: "XLSX",
    size: "1.2 MB",
  },
  {
    id: 3,
    name: "Сводная информация - Q4 2025",
    template: "executive",
    created: "2025-10-30T14:20:00Z",
    format: "PDF",
    size: "3.1 MB",
  },
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState("templates");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState("PDF");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Отчеты</h1>
        <p className="text-muted-foreground mt-1">
          Генерирование и экспорт отчетов аналитики
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates">Шаблоны</TabsTrigger>
          <TabsTrigger value="recent">Последние отчеты</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportTemplates.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all ${
                  selectedTemplate === template.id
                    ? "border-primary ring-1 ring-primary"
                    : ""
                }`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-3xl mb-2">{template.icon}</div>
                      <CardTitle className="text-lg">
                        {template.name}
                      </CardTitle>
                    </div>
                    {selectedTemplate === template.id && (
                      <Badge className="bg-primary">Выбран</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-2">
                      Доступные форматы:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {template.formats.map((format) => (
                        <Badge key={format} variant="secondary">
                          {format}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle>Параметры отчета</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold block mb-2">
                      От даты
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      defaultValue="2025-10-13"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold block mb-2">
                      До даты
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      defaultValue="2025-11-12"
                    />
                  </div>
                </div>

                {/* Format Selection */}
                <div>
                  <label className="text-sm font-semibold block mb-2">
                    Формат экспорта
                  </label>
                  <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTemplates
                        .find((t) => t.id === selectedTemplate)
                        ?.formats.map((format) => (
                          <SelectItem key={format} value={format}>
                            {format}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Advanced Options */}
                <div className="border-t pt-4">
                  <label className="text-sm font-semibold block mb-3">
                    Дополнительные опции
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" defaultChecked />
                      <span>Включить графики и визуализации</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" defaultChecked />
                      <span>Включить детальные таблицы</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" />
                      <span>Включить стратегические рекомендации</span>
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end border-t pt-6">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedTemplate(null)}
                  >
                    Отменить
                  </Button>
                  <Button className="gap-2">
                    <Download className="w-4 h-4" />
                    Сгенерировать отчет
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recent Reports Tab */}
        <TabsContent value="recent" className="space-y-4">
          <div className="space-y-3">
            {recentReports.map((report) => (
              <Card key={report.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {report.name}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{report.format}</span>
                          <span>•</span>
                          <span>{report.size}</span>
                          <span>•</span>
                          <span>
                            {new Date(report.created).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Скачать
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Report Templates Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">О отчетах</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Отчеты генерируются на основе выбранных данных и периода. Вы можете
            настроить содержание и формат в соответствии с вашими потребностями.
          </p>
          <p>
            Формат PDF лучше всего подходит для обмена и печати, а XLSX и CSV
            идеальны для дальнейшего анализа в Excel или других инструментах.
          </p>
          <p>
            Созданные отчеты хранятся в течение 30 дней и могут быть скачаны в
            любое время. Старые отчеты автоматически архи��ируются.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
