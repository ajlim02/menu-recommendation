import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Recommendation,
  cuisineLabels,
  baseLabels,
  spicyLabels,
  heavyLabels,
  priceLabels,
} from "@shared/schema";
import { cn } from "@/lib/utils";
import { Check, X, Clock, Flame, Soup, Scale, Sparkles } from "lucide-react";

interface RecommendationCardProps {
  recommendation: Recommendation;
  isTopPick?: boolean;
  rank?: number;
  onFeedback?: (menuId: string, action: "select" | "reject" | "skip") => void;
}

function getSpicyIcon(level: number) {
  if (level === 0) return null;
  return (
    <span className="flex items-center gap-0.5 text-orange-500">
      {Array.from({ length: level }).map((_, i) => (
        <Flame key={i} className="h-3 w-3" />
      ))}
    </span>
  );
}

export function RecommendationCard({ recommendation, isTopPick, rank, onFeedback }: RecommendationCardProps) {
  const { menu, reason } = recommendation;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const feedbackMutation = useMutation({
    mutationFn: async (action: "select" | "reject" | "skip") => {
      return apiRequest("POST", "/api/feedback", { menuId: menu.id, action });
    },
    onSuccess: (_, action) => {
      if (!onFeedback) {
        queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
        queryClient.invalidateQueries({ queryKey: ["/api/insights"] });
        const messages = {
          select: { title: "선택 완료!", description: `${menu.displayName}을(를) 선택하셨어요.` },
          reject: { title: "거절됨", description: "다음엔 덜 추천할게요." },
          skip: { title: "나중에", description: "다음에 다시 추천할게요." },
        };
        toast(messages[action]);
      }
    },
  });

  const handleAction = (action: "select" | "reject" | "skip") => {
    if (onFeedback) {
      onFeedback(menu.id, action);
    }
    feedbackMutation.mutate(action);
  };

  return (
    <Card
      className={cn(
        "relative overflow-visible transition-all",
        isTopPick && "border-primary/30 shadow-md"
      )}
    >
      {isTopPick && rank && (
        <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {rank}
        </div>
      )}
      {isTopPick && (
        <div className="absolute -top-2 left-3">
          <Badge className="gap-1 bg-primary text-primary-foreground">
            <Sparkles className="h-3 w-3" />
            추천
          </Badge>
        </div>
      )}

      <CardContent className={cn("space-y-3", isTopPick ? "pt-8" : "pt-6")}>
        <div className="space-y-1">
          <h3
            className={cn(
              "font-semibold leading-tight",
              isTopPick ? "text-lg" : "text-base"
            )}
            data-testid={`text-menu-name-${menu.id}`}
          >
            {menu.displayName}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-xs">
              {cuisineLabels[menu.cuisine]}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {baseLabels[menu.base]}
            </Badge>
            {menu.hasSoup && (
              <span className="flex items-center text-blue-500">
                <Soup className="h-3.5 w-3.5" />
              </span>
            )}
            {getSpicyIcon(menu.spicyLevel)}
          </div>
        </div>

        <div className="rounded-md bg-muted/50 p-3">
          <p
            className="text-sm italic text-muted-foreground leading-relaxed"
            data-testid={`text-reason-${menu.id}`}
          >
            "{reason}"
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Scale className="h-3 w-3" />
            {heavyLabels[menu.heavyLevel - 1]}
          </span>
          <span>·</span>
          <span>{priceLabels[menu.priceRange]}</span>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 pt-0">
        <Button
          variant="default"
          size="default"
          className="w-full gap-2"
          onClick={() => handleAction("select")}
          disabled={feedbackMutation.isPending}
          data-testid={`button-select-${menu.id}`}
        >
          <Check className="h-4 w-4" />
          선택할래요
        </Button>
        <div className="flex w-full gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => handleAction("reject")}
            disabled={feedbackMutation.isPending}
            data-testid={`button-reject-${menu.id}`}
          >
            <X className="h-4 w-4" />
            별로예요
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => handleAction("skip")}
            disabled={feedbackMutation.isPending}
            data-testid={`button-skip-${menu.id}`}
          >
            <Clock className="h-4 w-4" />
            나중에
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
