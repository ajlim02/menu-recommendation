import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  UserPreferences,
  cuisineTypes,
  cuisineLabels,
  baseTypes,
  baseLabels,
  proteinTypes,
  proteinLabels,
  spicyLabels,
  heavyLabels,
  priceLabels,
  CuisineType,
  BaseType,
  ProteinType,
} from "@shared/schema";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Settings, Flame, Scale, Banknote, X, Plus, Soup } from "lucide-react";

interface ToggleChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  testId?: string;
}

function ToggleChip({ label, selected, onClick, testId }: ToggleChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors toggle-elevate",
        selected
          ? "border-primary bg-primary text-primary-foreground toggle-elevated"
          : "border-border bg-background text-foreground"
      )}
      data-testid={testId}
    >
      {label}
    </button>
  );
}

const defaultPreferences: UserPreferences = {
  preferredCuisines: [],
  preferredBases: [],
  preferredProteins: [],
  preferSoup: null,
  maxSpicyLevel: 2,
  preferredHeavyLevel: 2,
  preferredPriceRange: ["low", "medium", "high"],
  excludedIngredients: [],
};

export function PreferenceControls() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newExclusion, setNewExclusion] = useState("");

  const { data: preferences, isLoading } = useQuery<UserPreferences>({
    queryKey: ["/api/preferences"],
  });

  const [localPrefs, setLocalPrefs] = useState<UserPreferences>(defaultPreferences);

  useEffect(() => {
    if (preferences) {
      setLocalPrefs(preferences);
    }
  }, [preferences]);

  const mutation = useMutation({
    mutationFn: async (data: UserPreferences) => {
      return apiRequest("PUT", "/api/preferences", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      toast({
        title: "설정 저장됨",
        description: "선호도가 업데이트되었어요.",
      });
    },
    onError: () => {
      toast({
        title: "오류 발생",
        description: "설정 저장에 실패했어요.",
        variant: "destructive",
      });
    },
  });

  const toggleArrayItem = <T extends string>(arr: T[], item: T): T[] => {
    return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
  };

  const handleSave = () => {
    mutation.mutate(localPrefs);
  };

  const addExclusion = () => {
    if (newExclusion.trim() && !localPrefs.excludedIngredients.includes(newExclusion.trim())) {
      setLocalPrefs({
        ...localPrefs,
        excludedIngredients: [...localPrefs.excludedIngredients, newExclusion.trim()],
      });
      setNewExclusion("");
    }
  };

  const removeExclusion = (item: string) => {
    setLocalPrefs({
      ...localPrefs,
      excludedIngredients: localPrefs.excludedIngredients.filter((i) => i !== item),
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Settings className="h-5 w-5 text-primary" />
          선호도 설정
        </CardTitle>
        <CardDescription>
          선호하는 옵션을 선택하면 추천에 반영돼요 (필터가 아닌 가중치로 적용)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-3">
          <h4 className="text-sm font-medium">선호 카테고리</h4>
          <div className="flex flex-wrap gap-2">
            {cuisineTypes.map((cuisine) => (
              <ToggleChip
                key={cuisine}
                label={cuisineLabels[cuisine]}
                selected={localPrefs.preferredCuisines.includes(cuisine)}
                onClick={() =>
                  setLocalPrefs({
                    ...localPrefs,
                    preferredCuisines: toggleArrayItem(localPrefs.preferredCuisines, cuisine),
                  })
                }
                testId={`chip-cuisine-${cuisine}`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium">선호 베이스</h4>
          <div className="flex flex-wrap gap-2">
            {baseTypes.map((base) => (
              <ToggleChip
                key={base}
                label={baseLabels[base]}
                selected={localPrefs.preferredBases.includes(base)}
                onClick={() =>
                  setLocalPrefs({
                    ...localPrefs,
                    preferredBases: toggleArrayItem(localPrefs.preferredBases, base),
                  })
                }
                testId={`chip-base-${base}`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="flex items-center gap-1.5 text-sm font-medium">
            <Soup className="h-4 w-4" />
            국물 선호
          </h4>
          <div className="flex gap-2">
            <ToggleChip
              label="상관없음"
              selected={localPrefs.preferSoup === null}
              onClick={() => setLocalPrefs({ ...localPrefs, preferSoup: null })}
              testId="chip-soup-any"
            />
            <ToggleChip
              label="국물 있는 것"
              selected={localPrefs.preferSoup === true}
              onClick={() => setLocalPrefs({ ...localPrefs, preferSoup: true })}
              testId="chip-soup-yes"
            />
            <ToggleChip
              label="비국물"
              selected={localPrefs.preferSoup === false}
              onClick={() => setLocalPrefs({ ...localPrefs, preferSoup: false })}
              testId="chip-soup-no"
            />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium">선호 단백질</h4>
          <div className="flex flex-wrap gap-2">
            {proteinTypes.map((protein) => (
              <ToggleChip
                key={protein}
                label={proteinLabels[protein]}
                selected={localPrefs.preferredProteins.includes(protein)}
                onClick={() =>
                  setLocalPrefs({
                    ...localPrefs,
                    preferredProteins: toggleArrayItem(localPrefs.preferredProteins, protein),
                  })
                }
                testId={`chip-protein-${protein}`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="flex items-center gap-1.5 text-sm font-medium">
            <Flame className="h-4 w-4 text-orange-500" />
            최대 매운 정도
          </h4>
          <div className="px-2">
            <Slider
              value={[localPrefs.maxSpicyLevel]}
              onValueChange={([value]) =>
                setLocalPrefs({ ...localPrefs, maxSpicyLevel: value })
              }
              max={3}
              step={1}
              className="w-full"
              data-testid="slider-spicy"
            />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              {spicyLabels.map((label, i) => (
                <span
                  key={i}
                  className={cn(
                    localPrefs.maxSpicyLevel === i && "font-medium text-foreground"
                  )}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="flex items-center gap-1.5 text-sm font-medium">
            <Scale className="h-4 w-4 text-blue-500" />
            선호 무거움 정도
          </h4>
          <div className="px-2">
            <Slider
              value={[localPrefs.preferredHeavyLevel]}
              onValueChange={([value]) =>
                setLocalPrefs({ ...localPrefs, preferredHeavyLevel: value })
              }
              min={1}
              max={3}
              step={1}
              className="w-full"
              data-testid="slider-heavy"
            />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              {heavyLabels.map((label, i) => (
                <span
                  key={i}
                  className={cn(
                    localPrefs.preferredHeavyLevel === i + 1 && "font-medium text-foreground"
                  )}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="flex items-center gap-1.5 text-sm font-medium">
            <Banknote className="h-4 w-4 text-green-500" />
            예산대
          </h4>
          <div className="flex flex-wrap gap-2">
            {(["low", "medium", "high"] as const).map((price) => (
              <ToggleChip
                key={price}
                label={priceLabels[price]}
                selected={localPrefs.preferredPriceRange.includes(price)}
                onClick={() =>
                  setLocalPrefs({
                    ...localPrefs,
                    preferredPriceRange: toggleArrayItem(localPrefs.preferredPriceRange, price),
                  })
                }
                testId={`chip-price-${price}`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-destructive">제외할 재료 / 알레르기</h4>
          <div className="flex gap-2">
            <Input
              value={newExclusion}
              onChange={(e) => setNewExclusion(e.target.value)}
              placeholder="예: 땅콩, 우유, 새우..."
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addExclusion())}
              data-testid="input-exclusion"
            />
            <Button type="button" variant="outline" size="icon" onClick={addExclusion} data-testid="button-add-exclusion">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {localPrefs.excludedIngredients.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {localPrefs.excludedIngredients.map((item) => (
                <Badge key={item} variant="destructive" className="gap-1 pr-1">
                  {item}
                  <button
                    type="button"
                    onClick={() => removeExclusion(item)}
                    className="ml-1 rounded-full p-0.5 hover:bg-destructive-foreground/20"
                    data-testid={`button-remove-${item}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={handleSave}
          className="w-full"
          disabled={mutation.isPending}
          data-testid="button-save-preferences"
        >
          {mutation.isPending ? "저장 중..." : "선호도 저장하기"}
        </Button>
      </CardContent>
    </Card>
  );
}
