import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RecommendationCard } from "@/components/recommendation-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Recommendation, MealType, mealTypeLabels, UserPreferences } from "@shared/schema";
import { Sparkles, RefreshCw, UtensilsCrossed, Sunrise, Sun, Moon, Cookie, Check, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TasteOnboarding } from "@/components/taste-onboarding";

const mealTypeIcons: Record<MealType, typeof Sunrise> = {
  breakfast: Sunrise,
  lunch: Sun,
  dinner: Moon,
  snack: Cookie,
};

const mealTypeOrder: MealType[] = ["breakfast", "lunch", "dinner"];

function RecommendationSkeleton({ large = false }: { large?: boolean }) {
  return (
    <Card className={large ? "shadow-md" : ""}>
      <CardContent className="space-y-3 pt-6">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-12" />
        </div>
        <Skeleton className="h-16 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      </CardContent>
      <div className="flex gap-2 px-6 pb-6">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
      </div>
    </Card>
  );
}

export default function RecommendationsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [currentMealIndex, setCurrentMealIndex] = useState(0);
  const [excludedMenuIds, setExcludedMenuIds] = useState<string[]>([]);
  const [completedMeals, setCompletedMeals] = useState<MealType[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const currentMealType = mealTypeOrder[currentMealIndex];
  const MealIcon = mealTypeIcons[currentMealType];

  const { data: preferences, isLoading: prefsLoading } = useQuery<UserPreferences>({
    queryKey: ["/api/preferences"],
  });

  const queryString = `?mealType=${currentMealType}${excludedMenuIds.length > 0 ? `&excludeIds=${excludedMenuIds.join(",")}` : ""}`;

  const { data: recommendations, isLoading, error, refetch, isFetching } = useQuery<Recommendation[]>({
    queryKey: ["/api/recommendations", currentMealType, excludedMenuIds.join(",")],
    queryFn: async () => {
      const response = await fetch(`/api/recommendations${queryString}`);
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: async ({ menuId, action }: { menuId: string; action: "select" | "reject" | "skip" }) => {
      return apiRequest("POST", "/api/feedback", { menuId, action });
    },
  });

  useEffect(() => {
    if (preferences && !preferences.onboardingCompleted && !prefsLoading) {
      setShowOnboarding(true);
    }
  }, [preferences, prefsLoading]);

  const handleFeedback = (menuId: string, action: "select" | "reject" | "skip") => {
    feedbackMutation.mutate({ menuId, action });

    if (action === "select") {
      toast({
        title: `${mealTypeLabels[currentMealType]} 선택 완료`,
        description: "다음 끼니를 추천해드릴게요!",
      });

      setCompletedMeals((prev) => [...prev, currentMealType]);

      if (currentMealIndex < mealTypeOrder.length - 1) {
        setCurrentMealIndex((prev) => prev + 1);
        setExcludedMenuIds([]);
      }
    } else {
      setExcludedMenuIds((prev) => [...prev, menuId]);
      toast({
        title: action === "reject" ? "다른 메뉴를 보여드릴게요" : "나중에 다시 추천해드릴게요",
      });
    }
  };

  const handleRefresh = () => {
    setExcludedMenuIds([]);
    refetch();
  };

  const handleMealSelect = (mealType: MealType) => {
    const index = mealTypeOrder.indexOf(mealType);
    if (index !== -1) {
      setCurrentMealIndex(index);
      setExcludedMenuIds([]);
    }
  };

  if (showOnboarding) {
    return <TasteOnboarding onComplete={() => setShowOnboarding(false)} />;
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 md:px-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">오늘의 추천</h1>
          <p className="text-muted-foreground">추천을 불러오는 중...</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <RecommendationSkeleton key={i} large />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 md:px-8">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <RefreshCw className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">추천을 불러오지 못했어요</h2>
            <p className="mb-4 text-muted-foreground">잠시 후 다시 시도해주세요.</p>
            <Button onClick={handleRefresh} variant="outline" data-testid="button-retry">
              <RefreshCw className="mr-2 h-4 w-4" />
              다시 시도
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 md:px-8">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mb-4 text-5xl">
              <UtensilsCrossed className="mx-auto h-16 w-16 text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-xl font-semibold" data-testid="text-no-recommendations">
              아직 추천할 수 없어요
            </h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              먼저 최근 식사 기록을 입력하거나<br />
              데모 데이터를 채워보세요!
            </p>
            <Link href="/">
              <Button data-testid="link-go-records">
                기록 입력하러 가기
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const topPicks = recommendations.slice(0, 3);
  const additionalCandidates = recommendations.slice(3, 10);
  const allDone = completedMeals.length === mealTypeOrder.length;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 md:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="flex items-center gap-2 text-3xl font-bold" data-testid="text-page-title">
            <Sparkles className="h-8 w-8 text-primary" />
            오늘의 추천
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            끼니별로 맞춤 메뉴를 추천해드려요.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isFetching}
          className="shrink-0"
          data-testid="button-refresh"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          새로고침
        </Button>
      </div>

      <div className="flex items-center justify-center gap-2 rounded-lg border bg-muted/30 p-3">
        {mealTypeOrder.map((mealType, index) => {
          const Icon = mealTypeIcons[mealType];
          const isCompleted = completedMeals.includes(mealType);
          const isCurrent = index === currentMealIndex;

          return (
            <div key={mealType} className="flex items-center gap-2">
              <Button
                variant={isCurrent ? "default" : isCompleted ? "secondary" : "ghost"}
                size="sm"
                className="gap-1.5"
                onClick={() => handleMealSelect(mealType)}
                data-testid={`button-meal-${mealType}`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                {mealTypeLabels[mealType]}
              </Button>
              {index < mealTypeOrder.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          );
        })}
      </div>

      {allDone ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">오늘 추천 완료</h2>
            <p className="mb-6 text-muted-foreground">
              모든 끼니를 선택하셨어요. 맛있게 드세요!
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/">
                <Button variant="outline">기록 확인하기</Button>
              </Link>
              <Button
                onClick={() => {
                  setCompletedMeals([]);
                  setCurrentMealIndex(0);
                  setExcludedMenuIds([]);
                }}
                data-testid="button-restart"
              >
                다시 추천받기
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <MealIcon className="h-5 w-5 text-primary" />
                {mealTypeLabels[currentMealType]} 추천 TOP 3
              </h2>
              {excludedMenuIds.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {excludedMenuIds.length}개 제외됨
                </Badge>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {topPicks.map((rec, index) => (
                <RecommendationCard
                  key={rec.menu.id}
                  recommendation={rec}
                  isTopPick
                  rank={index + 1}
                  onFeedback={handleFeedback}
                />
              ))}
            </div>
          </section>

          {additionalCandidates.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-medium text-muted-foreground">
                다른 후보도 있어요
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {additionalCandidates.map((rec) => (
                  <RecommendationCard 
                    key={rec.menu.id} 
                    recommendation={rec}
                    onFeedback={handleFeedback}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
