import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  TrendingUp,
  ShoppingCart,
  Package,
  Upload,
  FileText,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  {
    name: "Дашборд",
    href: "/",
    icon: BarChart3,
    description: "Обзор и KPI",
  },
  {
    name: "Маркетинг",
    href: "/marketing",
    icon: TrendingUp,
    description: "Кампании и аналитика",
  },
  {
    name: "Продажи",
    href: "/sales",
    icon: ShoppingCart,
    description: "Заказы и эффективность",
  },
  {
    name: "Товары",
    href: "/products",
    icon: Package,
    description: "Остатки и товары",
  },
  {
    name: "Загрузка 1C",
    href: "/upload",
    icon: Upload,
    description: "Импорт номенклатуры",
  },
  {
    name: "Отчеты",
    href: "/reports",
    icon: FileText,
    description: "Экспорт и аналитика",
  },
  {
    name: "Настройки",
    href: "/settings",
    icon: Settings,
    description: "Конфигурация",
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={cn(
          "bg-card border-r border-border transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="flex flex-col h-full p-4">
          {/* Logo/Brand */}
          <div className="flex items-center justify-between mb-8">
            <div className={cn("flex items-center gap-3", !sidebarOpen && "justify-center w-full")}>
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary-foreground" />
              </div>
              {sidebarOpen && (
                <div className="flex flex-col">
                  <h1 className="text-sm font-bold text-foreground">Мебель</h1>
                  <p className="text-xs text-muted-foreground">Аналитика</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link key={item.href} to={item.href}>
                  <button
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                    title={!sidebarOpen ? item.name : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && (
                      <div className="flex-1 text-left">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs opacity-70">{item.description}</div>
                      </div>
                    )}
                  </button>
                </Link>
              );
            })}
          </nav>

          {/* Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full mt-auto"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-card border-b border-border sticky top-0 z-10">
          <div className="px-8 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              Дашборд аналитики мебельной компании
            </h2>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                Справка
              </Button>
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">АД</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
