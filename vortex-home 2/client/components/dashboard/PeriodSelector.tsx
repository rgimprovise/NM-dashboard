import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

interface PeriodSelectorProps {
  onPeriodChange?: (period: string, from?: string, to?: string) => void;
  className?: string;
}

export default function PeriodSelector({
  onPeriodChange,
  className,
}: PeriodSelectorProps) {
  const periodOptions = [
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
    { value: "90d", label: "Last 90 days" },
    { value: "ytd", label: "Year to date" },
  ];

  const handlePeriodChange = (value: string) => {
    if (onPeriodChange) {
      const today = new Date();
      const from = new Date();

      switch (value) {
        case "7d":
          from.setDate(today.getDate() - 7);
          break;
        case "30d":
          from.setDate(today.getDate() - 30);
          break;
        case "90d":
          from.setDate(today.getDate() - 90);
          break;
        case "ytd":
          from.setMonth(0);
          from.setDate(1);
          break;
        default:
          from.setDate(today.getDate() - 30);
      }

      const fromStr = from.toISOString().split("T")[0];
      const toStr = today.toISOString().split("T")[0];

      onPeriodChange(value, fromStr, toStr);
    }
  };

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          Period:
        </span>
      </div>
      <select
        onChange={(e) => handlePeriodChange(e.target.value)}
        defaultValue="30d"
        className="px-3 py-2 border border-input rounded-md bg-background text-sm"
      >
        {periodOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
