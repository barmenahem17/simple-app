import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: ReactNode;
  valueClassName?: string;
}

export function MetricCard({ title, value, valueClassName }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-right">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl md:text-3xl font-bold text-right", valueClassName)}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}