import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MealRecord, mealTypeLabels } from "@shared/schema";
import { Trash2, Calendar, Clock, Sunrise, Sun, Moon, Cookie, UtensilsCrossed } from "lucide-react";
import { format, parseISO, isToday, isYesterday, differenceInDays } from "date-fns";
import { ko } from "date-fns/locale";

function formatDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "오늘";
  if (isYesterday(date)) return "어제";
  const days = differenceInDays(new Date(), date);
  if (days <= 7) return `${days}일 전`;
  return format(date, "M월 d일 (E)", { locale: ko });
}

function getMealTypeIcon(mealType: string) {
  const iconProps = { className: "h-4 w-4 text-muted-foreground" };
  switch (mealType) {
    case "breakfast":
      return <Sunrise {...iconProps} />;
    case "lunch":
      return <Sun {...iconProps} />;
    case "dinner":
      return <Moon {...iconProps} />;
    case "snack":
      return <Cookie {...iconProps} />;
    default:
      return <UtensilsCrossed {...iconProps} />;
  }
}

interface GroupedRecords {
  [date: string]: MealRecord[];
}

export function MealRecordList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: records, isLoading, error } = useQuery<MealRecord[]>({
    queryKey: ["/api/meal-records"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/meal-records/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      toast({
        title: "삭제 완료",
        description: "식사 기록이 삭제되었어요.",
      });
    },
    onError: () => {
      toast({
        title: "오류 발생",
        description: "삭제에 실패했어요.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary" />
            최근 7일 식사 기록
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          기록을 불러오는데 실패했어요.
        </CardContent>
      </Card>
    );
  }

  if (!records || records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary" />
            최근 7일 식사 기록
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <UtensilsCrossed className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground" data-testid="text-empty-records">
            아직 기록이 없어요.
          </p>
          <p className="text-sm text-muted-foreground">
            위에서 오늘 드신 메뉴를 기록해보세요!
          </p>
        </CardContent>
      </Card>
    );
  }

  const grouped: GroupedRecords = records.reduce((acc, record) => {
    if (!acc[record.date]) {
      acc[record.date] = [];
    }
    acc[record.date].push(record);
    return acc;
  }, {} as GroupedRecords);

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-primary" />
          최근 7일 식사 기록
          <Badge variant="secondary" className="ml-auto">
            {records.length}개
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedDates.map((date) => (
          <div key={date} className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(date)}
            </div>
            <div className="space-y-2 pl-5">
              {grouped[date].map((record) => (
                <div
                  key={record.id}
                  className="group flex items-center gap-3 rounded-md border bg-card p-3 transition-colors hover-elevate"
                  data-testid={`record-item-${record.id}`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    {getMealTypeIcon(record.mealType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" data-testid={`text-menu-${record.id}`}>
                      {record.menuText}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {mealTypeLabels[record.mealType]}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="invisible h-8 w-8 shrink-0 text-muted-foreground group-hover:visible"
                    onClick={() => deleteMutation.mutate(record.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${record.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">삭제</span>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
