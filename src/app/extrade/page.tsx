import { MetricCard } from "@/components/MetricCard";

export default function Extrade() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-right mb-8">Extrade</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="שווי תיק כולל"
          value="—"
        />
        <MetricCard
          title="רווח/הפסד (באחוזים ובמטבע) על כל התקופה"
          value="—% / —"
          valueClassName="text-green-600"
        />
        <MetricCard
          title="מזומן בשקל ומזומן בדולר"
          value="₪ — | $ —"
        />
      </div>
    </div>
  );
}