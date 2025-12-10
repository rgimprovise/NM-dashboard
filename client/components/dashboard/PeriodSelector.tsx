import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";
import { getPeriodRange, PERIOD_OPTIONS, type PeriodCode } from "@shared/utils/periods";

interface PeriodSelectorProps {
  onPeriodChange?: (period: string, from?: string, to?: string) => void;
  className?: string;
}

export default function PeriodSelector({
  onPeriodChange,
  className,
}: PeriodSelectorProps) {
  const handlePeriodChange = (value: string) => {
    if (onPeriodChange) {
      const periodRange = getPeriodRange(value as PeriodCode);
      onPeriodChange(periodRange.code, periodRange.dateFrom, periodRange.dateTo);
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
        {PERIOD_OPTIONS.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
