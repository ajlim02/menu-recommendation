import { useQuery } from "@tanstack/react-query";
import { RecommendationCard } from "@/components/recommendation-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Recommendation } from "@shared/schema";
import { Sparkles, RefreshCw, UtensilsCrossed } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

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

  const { data: recommendations, isLoading, error, refetch, isFetching } = useQuery<Recommendation[]>({
    queryKey: ["/api/recommendations"],
  });

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">오늘의 추천</h1>
          <p className="text-muted-foreground">추천을 불러오는 중...</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">TOP 3 추천</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <RecommendationSkeleton key={i} large />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">추가 후보</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <RecommendationSkeleton key={i} />
            ))}
          </div>
        </section>
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
  const additionalCandidates = recommendations.slice(3, 13);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="flex items-center gap-2 text-3xl font-bold" data-testid="text-page-title">
            <Sparkles className="h-8 w-8 text-primary" />
            오늘의 추천
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            최근 기록과 선호도를 바탕으로 메뉴를 추천해드려요.
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

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            TOP
          </span>
          오늘의 추천 3
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {topPicks.map((rec, index) => (
            <RecommendationCard
              key={rec.menu.id}
              recommendation={rec}
              isTopPick
              rank={index + 1}
            />
          ))}
        </div>
      </section>

      {additionalCandidates.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            추가 후보 {additionalCandidates.length}개
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {additionalCandidates.map((rec) => (
              <RecommendationCard key={rec.menu.id} recommendation={rec} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
