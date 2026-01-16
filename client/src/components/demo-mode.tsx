import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Wand2, Loader2, Info, X } from "lucide-react";

export function DemoMode() {
  const [isDismissed, setIsDismissed] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/demo/fill-data");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/insights"] });
      queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
      toast({
        title: "데모 데이터 생성 완료!",
        description: "7일치 식사 기록과 선호도가 자동으로 채워졌어요.",
      });
    },
    onError: () => {
      toast({
        title: "오류 발생",
        description: "데모 데이터 생성에 실패했어요.",
        variant: "destructive",
      });
    },
  });

  if (isDismissed) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Info className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium" data-testid="text-demo-title">
              처음이신가요? 데모 모드를 사용해보세요
            </p>
            <p className="text-sm text-muted-foreground">
              버튼을 누르면 최근 7일 식사 기록이 자동으로 채워져요. 추천이 어떻게
              작동하는지 확인해보세요!
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="gap-2"
            data-testid="button-fill-demo"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            데모 데이터 채우기
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDismissed(true)}
            data-testid="button-dismiss-demo"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
