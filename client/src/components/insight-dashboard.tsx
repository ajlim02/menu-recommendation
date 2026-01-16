import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cuisineLabels, baseLabels, CuisineType, BaseType } from "@shared/schema";
import { BarChart3, ThumbsUp, ThumbsDown, TrendingUp } from "lucide-react";

interface InsightData {
  recentCategoryDistribution: Record<string, number>;
  recentBaseDistribution: Record<string, number>;
  topLiked: string[];
  topDisliked: string[];
  diversityScore: number;
  totalRecords: number;
  totalFeedback: number;
}

export function InsightDashboard() {
  const { data: insights, isLoading } = useQuery<InsightData>({
    queryKey: ["/api/insights"],
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!insights) {
    return null;
  }

  const totalCategory = Object.values(insights.recentCategoryDistribution).reduce(
    (a, b) => a + b,
    0
  );
  const totalBase = Object.values(insights.recentBaseDistribution).reduce(
    (a, b) => a + b,
    0
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-primary" />
            최근 카테고리 분포
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(insights.recentCategoryDistribution).length === 0 ? (
            <p className="text-sm text-muted-foreground">아직 데이터가 없어요</p>
          ) : (
            Object.entries(insights.recentCategoryDistribution)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([cuisine, count]) => (
                <div key={cuisine} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{cuisineLabels[cuisine as CuisineType] || cuisine}</span>
                    <span className="text-muted-foreground">
                      {Math.round((count / totalCategory) * 100)}%
                    </span>
                  </div>
                  <Progress
                    value={(count / totalCategory) * 100}
                    className="h-2"
                  />
                </div>
              ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-primary" />
            최근 베이스 분포
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(insights.recentBaseDistribution).length === 0 ? (
            <p className="text-sm text-muted-foreground">아직 데이터가 없어요</p>
          ) : (
            Object.entries(insights.recentBaseDistribution)
              .sort(([, a], [, b]) => b - a)
              .map(([base, count]) => (
                <div key={base} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{baseLabels[base as BaseType] || base}</span>
                    <span className="text-muted-foreground">
                      {Math.round((count / totalBase) * 100)}%
                    </span>
                  </div>
                  <Progress value={(count / totalBase) * 100} className="h-2" />
                </div>
              ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ThumbsUp className="h-4 w-4 text-green-500" />
            선호 메뉴 TOP 3
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insights.topLiked.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              아직 선택한 메뉴가 없어요
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {insights.topLiked.map((menu, i) => (
                <Badge key={i} variant="secondary" className="text-sm">
                  {menu}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ThumbsDown className="h-4 w-4 text-red-500" />
            기피 메뉴 TOP 3
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insights.topDisliked.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              아직 거절한 메뉴가 없어요
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {insights.topDisliked.map((menu, i) => (
                <Badge key={i} variant="outline" className="text-sm">
                  {menu}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            다양성 점수
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-primary">
              {insights.diversityScore}%
            </div>
            <div className="flex-1">
              <Progress value={insights.diversityScore} className="h-3" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            최근 7일간 식사의 다양성을 나타내요. 다양한 카테고리를 먹을수록 점수가
            높아져요.
          </p>
          <div className="flex gap-4 text-sm">
            <span className="text-muted-foreground">
              총 기록: <span className="font-medium text-foreground">{insights.totalRecords}개</span>
            </span>
            <span className="text-muted-foreground">
              총 피드백: <span className="font-medium text-foreground">{insights.totalFeedback}개</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
