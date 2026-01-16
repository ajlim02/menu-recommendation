import { MealRecordForm } from "@/components/meal-record-form";
import { MealRecordList } from "@/components/meal-record-list";
import { DemoMode } from "@/components/demo-mode";
import { useQuery } from "@tanstack/react-query";
import { MealRecord } from "@shared/schema";

export default function RecordsPage() {
  const { data: records } = useQuery<MealRecord[]>({
    queryKey: ["/api/meal-records"],
  });

  const showDemo = !records || records.length === 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 md:px-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold leading-tight" data-testid="text-page-title">
          오늘 뭐 먹었어요?
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          최근 7일간의 식사를 기록하면, 맞춤 추천을 받을 수 있어요.
        </p>
      </div>

      {showDemo && <DemoMode />}

      <MealRecordForm />

      <MealRecordList />
    </div>
  );
}
