import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Settings() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-right mb-8">הגדרות</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-right">מצב פיתוח</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-right">״הגדרות יגיעו בשלב מאוחר יותר״</p>
        </CardContent>
      </Card>
    </div>
  );
}