import { MetricCard } from "@/components/MetricCard";

export default function Home() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-right text-foreground">
          ברוך הבא, בר!
        </h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="סה״כ שווי כל התיקים"
          value="—"
        />
        <MetricCard
          title="סה״כ רווח/הפסד על כל התיקים"
          value="—% / —"
          valueClassName="text-green-600"
        />
        <MetricCard
          title="סה״כ מזומן בשקל ומזומן בדולר"
          value="₪ — | $ —"
        />
      </div>
    </div>
  );
}
