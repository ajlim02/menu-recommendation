import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Menu, CuisineType, cuisineLabels, UserPreferences } from "@shared/schema";
import { Check, ChevronRight, Heart, Utensils } from "lucide-react";

interface TasteOnboardingProps {
  onComplete: () => void;
}

export function TasteOnboarding({ onComplete }: TasteOnboardingProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [currentCuisineIndex, setCurrentCuisineIndex] = useState(0);

  const { data: candidates, isLoading } = useQuery<Record<CuisineType, Menu[]>>({
    queryKey: ["/api/menu-candidates"],
  });

  const { data: preferences } = useQuery<UserPreferences>({
    queryKey: ["/api/preferences"],
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (prefs: UserPreferences) => {
      return apiRequest("PUT", "/api/preferences", prefs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      toast({
        title: "취향 저장 완료",
        description: "선호하는 음식이 저장되었어요!",
      });
      onComplete();
    },
    onError: () => {
      toast({
        title: "오류",
        description: "저장에 실패했어요. 다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  const cuisines: CuisineType[] = ["korean", "chinese", "japanese", "western", "bunsik", "asian"];
  const currentCuisine = cuisines[currentCuisineIndex];

  const toggleMenu = (menuId: string) => {
    setSelectedMenuIds((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleNext = () => {
    if (currentCuisineIndex < cuisines.length - 1) {
      setCurrentCuisineIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    if (!preferences) return;

    const updatedPrefs: UserPreferences = {
      ...preferences,
      favoriteMenuIds: selectedMenuIds,
      onboardingCompleted: true,
    };

    updatePreferencesMutation.mutate(updatedPrefs);
  };

  if (isLoading || !candidates) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentMenus = candidates[currentCuisine] || [];

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div className="space-y-2 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Heart className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">좋아하는 음식을 알려주세요</h1>
        <p className="text-muted-foreground">
          선택하신 음식을 바탕으로 더 정확한 추천을 해드릴게요.
        </p>
      </div>

      <div className="flex items-center justify-center gap-2">
        {cuisines.map((cuisine, index) => (
          <div
            key={cuisine}
            className={`h-2 w-8 rounded-full transition-colors ${
              index <= currentCuisineIndex ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-primary" />
            {cuisineLabels[currentCuisine]} 메뉴
          </CardTitle>
          <CardDescription>
            마음에 드는 메뉴를 선택해주세요 (여러 개 가능)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {currentMenus.map((menu) => {
              const isSelected = selectedMenuIds.includes(menu.id);
              return (
                <Button
                  key={menu.id}
                  variant={isSelected ? "default" : "outline"}
                  className="h-auto justify-start gap-2 py-3 text-left"
                  onClick={() => toggleMenu(menu.id)}
                  data-testid={`button-menu-${menu.id}`}
                >
                  {isSelected && <Check className="h-4 w-4 shrink-0" />}
                  <span className="truncate">{menu.displayName}</span>
                </Button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button variant="ghost" onClick={handleSkip} data-testid="button-skip-onboarding">
              건너뛰기
            </Button>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {selectedMenuIds.length}개 선택
              </Badge>
              <Button onClick={handleNext} data-testid="button-next-cuisine">
                {currentCuisineIndex < cuisines.length - 1 ? (
                  <>
                    다음
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                ) : (
                  "완료"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
