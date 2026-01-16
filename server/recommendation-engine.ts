import {
  Menu,
  MealRecord,
  UserPreferences,
  Feedback,
  Recommendation,
  cuisineLabels,
  baseLabels,
  CuisineType,
  BaseType,
  MealType,
} from "@shared/schema";

interface FeedbackWeights {
  [menuId: string]: number;
}

function getTargetHeavyLevel(mealType: MealType): { min: number; max: number; ideal: number } {
  switch (mealType) {
    case "breakfast":
      return { min: 1, max: 2, ideal: 1 };
    case "lunch":
      return { min: 1, max: 3, ideal: 2 };
    case "dinner":
      return { min: 2, max: 3, ideal: 3 };
    case "snack":
      return { min: 1, max: 1, ideal: 1 };
    default:
      return { min: 1, max: 3, ideal: 2 };
  }
}

export function calculateRecommendations(
  menus: Menu[],
  mealRecords: MealRecord[],
  preferences: UserPreferences,
  feedbackHistory: Feedback[],
  mealType?: MealType,
  excludeMenuIds?: string[]
): Recommendation[] {
  const feedbackWeights = calculateFeedbackWeights(feedbackHistory);
  const recentMenuIds = new Set(
    mealRecords.map((r) => r.canonicalMenuId).filter(Boolean)
  );
  const recentMenuTexts = new Set(
    mealRecords.map((r) => r.menuText.toLowerCase())
  );

  const recentCuisines = countCategories(mealRecords, menus, "cuisine");
  const recentBases = countCategories(mealRecords, menus, "base");

  const excludeSet = new Set(excludeMenuIds || []);
  const filteredMenus = menus.filter((m) => !excludeSet.has(m.id));

  const scored = filteredMenus.map((menu) => {
    const preferenceScore = calculatePreferenceScore(menu, preferences);
    const diversityBonus = calculateDiversityBonus(
      menu,
      recentCuisines,
      recentBases,
      mealRecords.length
    );
    const repetitionPenalty = calculateRepetitionPenalty(
      menu,
      recentMenuIds,
      recentMenuTexts,
      recentCuisines
    );
    const feedbackWeight = feedbackWeights[menu.id] || 0;

    let mealTypeBonus = 0;
    if (mealType) {
      const target = getTargetHeavyLevel(mealType);
      if (menu.heavyLevel >= target.min && menu.heavyLevel <= target.max) {
        mealTypeBonus = 15;
        if (menu.heavyLevel === target.ideal) {
          mealTypeBonus = 25;
        }
      } else {
        mealTypeBonus = -20;
      }
    }

    let healthBonus = 0;
    if (preferences.preferHealthy) {
      if (menu.protein === "vegetarian" || menu.base === "salad") {
        healthBonus = 20;
      }
      if (menu.heavyLevel === 1) {
        healthBonus += 10;
      }
      if (menu.heavyLevel === 3) {
        healthBonus -= 15;
      }
      
      if (preferences.fitnessGoal === "diet") {
        if (menu.heavyLevel === 1) {
          healthBonus += 15;
        }
        if (menu.base === "salad") {
          healthBonus += 10;
        }
        if (menu.heavyLevel === 3) {
          healthBonus -= 20;
        }
      } else if (preferences.fitnessGoal === "muscle") {
        if (menu.protein === "chicken" || menu.protein === "beef") {
          healthBonus += 20;
        }
        if (menu.protein === "seafood" || menu.protein === "pork") {
          healthBonus += 10;
        }
        if (menu.heavyLevel >= 2) {
          healthBonus += 5;
        }
      }
    }

    let favoriteBonus = 0;
    if (preferences.favoriteMenuIds?.includes(menu.id)) {
      favoriteBonus = 20;
    }

    const score =
      preferenceScore * 0.25 +
      diversityBonus * 0.2 +
      repetitionPenalty * 0.25 +
      feedbackWeight * 0.1 +
      mealTypeBonus * 0.1 +
      healthBonus * 0.05 +
      favoriteBonus * 0.05;

    const reason = generateReason(
      menu,
      mealRecords,
      preferences,
      recentCuisines,
      recentBases,
      feedbackWeight,
      mealType
    );

    return {
      menu,
      score,
      preferenceScore,
      diversityBonus,
      repetitionPenalty,
      feedbackWeight,
      reason,
    };
  });

  return scored
    .filter((r) => r.score > -50)
    .sort((a, b) => b.score - a.score)
    .slice(0, 13);
}

export function getMenuCandidatesByCategory(
  menus: Menu[],
  preferences: UserPreferences
): Record<CuisineType, Menu[]> {
  const result: Record<string, Menu[]> = {};
  const cuisines: CuisineType[] = ["korean", "chinese", "japanese", "western", "bunsik", "asian", "other"];

  cuisines.forEach((cuisine) => {
    const filtered = menus
      .filter((m) => m.cuisine === cuisine)
      .filter((m) => m.spicyLevel <= preferences.maxSpicyLevel)
      .sort(() => Math.random() - 0.5)
      .slice(0, 8);
    result[cuisine] = filtered;
  });

  return result as Record<CuisineType, Menu[]>;
}

function calculatePreferenceScore(
  menu: Menu,
  preferences: UserPreferences
): number {
  let score = 50;

  if (preferences.preferredCuisines.length > 0) {
    if (preferences.preferredCuisines.includes(menu.cuisine)) {
      score += 20;
    } else {
      score -= 5;
    }
  }

  if (preferences.preferredBases.length > 0) {
    if (preferences.preferredBases.includes(menu.base)) {
      score += 15;
    } else {
      score -= 3;
    }
  }

  if (preferences.preferredProteins.length > 0) {
    if (preferences.preferredProteins.includes(menu.protein)) {
      score += 15;
    } else {
      score -= 3;
    }
  }

  if (preferences.preferSoup !== null) {
    if (menu.hasSoup === preferences.preferSoup) {
      score += 10;
    } else {
      score -= 5;
    }
  }

  if (menu.spicyLevel > preferences.maxSpicyLevel) {
    score -= (menu.spicyLevel - preferences.maxSpicyLevel) * 15;
  } else if (menu.spicyLevel === preferences.maxSpicyLevel) {
    score += 5;
  }

  const heavyDiff = Math.abs(menu.heavyLevel - preferences.preferredHeavyLevel);
  score -= heavyDiff * 8;

  if (!preferences.preferredPriceRange.includes(menu.priceRange)) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateDiversityBonus(
  menu: Menu,
  recentCuisines: Record<string, number>,
  recentBases: Record<string, number>,
  totalRecords: number
): number {
  if (totalRecords === 0) return 50;

  let bonus = 50;

  const cuisineCount = recentCuisines[menu.cuisine] || 0;
  const cuisineRatio = cuisineCount / totalRecords;

  if (cuisineRatio === 0) {
    bonus += 30;
  } else if (cuisineRatio < 0.2) {
    bonus += 20;
  } else if (cuisineRatio < 0.4) {
    bonus += 5;
  } else {
    bonus -= cuisineRatio * 30;
  }

  const baseCount = recentBases[menu.base] || 0;
  const baseRatio = baseCount / totalRecords;

  if (baseRatio === 0) {
    bonus += 20;
  } else if (baseRatio < 0.3) {
    bonus += 10;
  } else {
    bonus -= baseRatio * 20;
  }

  return Math.max(0, Math.min(100, bonus));
}

function calculateRepetitionPenalty(
  menu: Menu,
  recentMenuIds: Set<string | undefined>,
  recentMenuTexts: Set<string>,
  recentCuisines: Record<string, number>
): number {
  let penalty = 100;

  if (recentMenuIds.has(menu.id)) {
    penalty -= 80;
  }

  if (recentMenuTexts.has(menu.displayName.toLowerCase())) {
    penalty -= 70;
  }

  const cuisineCount = recentCuisines[menu.cuisine] || 0;
  if (cuisineCount >= 3) {
    penalty -= 30;
  } else if (cuisineCount >= 2) {
    penalty -= 15;
  }

  return Math.max(0, penalty);
}

function calculateFeedbackWeights(feedbackHistory: Feedback[]): FeedbackWeights {
  const weights: FeedbackWeights = {};

  feedbackHistory.forEach((fb) => {
    if (!weights[fb.menuId]) {
      weights[fb.menuId] = 0;
    }

    switch (fb.action) {
      case "select":
        weights[fb.menuId] += 15;
        break;
      case "reject":
        weights[fb.menuId] -= 25;
        break;
      case "skip":
        break;
    }
  });

  Object.keys(weights).forEach((id) => {
    weights[id] = Math.max(-50, Math.min(50, weights[id]));
  });

  return weights;
}

function countCategories(
  records: MealRecord[],
  menus: Menu[],
  category: "cuisine" | "base"
): Record<string, number> {
  const counts: Record<string, number> = {};

  records.forEach((record) => {
    const menu = menus.find(
      (m) =>
        m.id === record.canonicalMenuId ||
        m.displayName.toLowerCase() === record.menuText.toLowerCase()
    );

    if (menu) {
      const value = menu[category];
      counts[value] = (counts[value] || 0) + 1;
    }
  });

  return counts;
}

function generateReason(
  menu: Menu,
  records: MealRecord[],
  preferences: UserPreferences,
  recentCuisines: Record<string, number>,
  recentBases: Record<string, number>,
  feedbackWeight: number,
  mealType?: MealType
): string {
  const reasons: string[] = [];

  if (records.length === 0) {
    return "새로운 시작! 이 메뉴로 오늘의 첫 식사를 즐겨보세요.";
  }

  if (mealType === "breakfast" && menu.heavyLevel === 1) {
    reasons.push("아침에 딱 맞는 가벼운 메뉴예요.");
  } else if (mealType === "dinner" && menu.heavyLevel === 3) {
    reasons.push("저녁에 든든하게 드시기 좋은 메뉴예요.");
  } else if (mealType === "lunch" && menu.heavyLevel === 2) {
    reasons.push("점심으로 적당한 메뉴예요.");
  }

  if (preferences.preferHealthy && (menu.protein === "vegetarian" || menu.base === "salad")) {
    reasons.push("건강을 생각하시는 분께 추천해요.");
  }

  const cuisineCount = recentCuisines[menu.cuisine] || 0;
  const totalRecords = records.length;

  if (cuisineCount === 0) {
    reasons.push(
      `최근 7일 동안 ${cuisineLabels[menu.cuisine]}을(를) 드시지 않아서 추천했어요.`
    );
  }

  const mostCommonCuisine = Object.entries(recentCuisines).sort(
    ([, a], [, b]) => b - a
  )[0];
  if (mostCommonCuisine && mostCommonCuisine[0] !== menu.cuisine) {
    const ratio = mostCommonCuisine[1] / totalRecords;
    if (ratio > 0.4) {
      reasons.push(
        `${cuisineLabels[mostCommonCuisine[0] as CuisineType]}이(가) 많았어서 다른 종류를 추천했어요.`
      );
    }
  }

  const mostCommonBase = Object.entries(recentBases).sort(
    ([, a], [, b]) => b - a
  )[0];
  if (mostCommonBase && mostCommonBase[0] !== menu.base) {
    const ratio = mostCommonBase[1] / totalRecords;
    if (ratio > 0.5) {
      reasons.push(
        `${baseLabels[mostCommonBase[0] as BaseType]} 요리가 많아 오늘은 ${baseLabels[menu.base]} 메뉴를 추천했어요.`
      );
    }
  }

  const hasSoupRecently = records.some((r) => {
    const matchedMenu = records.find(
      (rec) => rec.menuText.toLowerCase() === r.menuText.toLowerCase()
    );
    return matchedMenu;
  });

  if (menu.hasSoup && preferences.preferSoup === true) {
    reasons.push("국물 있는 메뉴를 선호하셔서 추천했어요.");
  } else if (!menu.hasSoup && preferences.preferSoup === false) {
    reasons.push("비국물 메뉴를 선호하셔서 추천했어요.");
  }

  if (feedbackWeight > 10) {
    reasons.push("이전에 선택하신 적이 있어서 다시 추천해요.");
  }

  if (
    preferences.preferredCuisines.length > 0 &&
    preferences.preferredCuisines.includes(menu.cuisine)
  ) {
    reasons.push(`선호하시는 ${cuisineLabels[menu.cuisine]}이에요.`);
  }

  if (menu.spicyLevel > 0 && menu.spicyLevel <= preferences.maxSpicyLevel) {
    const recentSpicy = records.filter((r) => {
      return r.menuText.includes("매운") || r.menuText.includes("불");
    });
    if (recentSpicy.length > 0) {
      reasons.push("매운 음식을 좋아하시는 것 같아 추천했어요.");
    }
  }

  if (reasons.length === 0) {
    const defaultReasons = [
      "오늘의 기분 전환에 딱 맞는 메뉴예요.",
      "균형 잡힌 식사로 추천해요.",
      "새로운 맛을 경험해보세요!",
      "당신의 취향에 맞을 거예요.",
    ];
    reasons.push(defaultReasons[Math.floor(Math.random() * defaultReasons.length)]);
  }

  return reasons[0];
}

export function calculateInsights(
  mealRecords: MealRecord[],
  menus: Menu[],
  feedbackHistory: Feedback[]
) {
  const recentCuisines = countCategories(mealRecords, menus, "cuisine");
  const recentBases = countCategories(mealRecords, menus, "base");

  const selectFeedback = feedbackHistory.filter((f) => f.action === "select");
  const rejectFeedback = feedbackHistory.filter((f) => f.action === "reject");

  const menuCounts: Record<string, { menu: Menu; count: number }> = {};

  selectFeedback.forEach((f) => {
    const menu = menus.find((m) => m.id === f.menuId);
    if (menu) {
      if (!menuCounts[f.menuId]) {
        menuCounts[f.menuId] = { menu, count: 0 };
      }
      menuCounts[f.menuId].count++;
    }
  });

  const topLiked = Object.values(menuCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((m) => m.menu.displayName);

  const rejectCounts: Record<string, { menu: Menu; count: number }> = {};
  rejectFeedback.forEach((f) => {
    const menu = menus.find((m) => m.id === f.menuId);
    if (menu) {
      if (!rejectCounts[f.menuId]) {
        rejectCounts[f.menuId] = { menu, count: 0 };
      }
      rejectCounts[f.menuId].count++;
    }
  });

  const topDisliked = Object.values(rejectCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((m) => m.menu.displayName);

  const uniqueCuisines = Object.keys(recentCuisines).length;
  const uniqueBases = Object.keys(recentBases).length;
  const maxDiversity = 7 + 5;
  const diversityScore = Math.round(
    ((uniqueCuisines + uniqueBases) / maxDiversity) * 100
  );

  return {
    recentCategoryDistribution: recentCuisines,
    recentBaseDistribution: recentBases,
    topLiked,
    topDisliked,
    diversityScore: Math.min(100, diversityScore),
    totalRecords: mealRecords.length,
    totalFeedback: feedbackHistory.length,
  };
}
