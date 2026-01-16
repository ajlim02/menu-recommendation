import { z } from "zod";

export const cuisineTypes = ["korean", "chinese", "japanese", "western", "bunsik", "asian", "other"] as const;
export type CuisineType = typeof cuisineTypes[number];

export const baseTypes = ["rice", "noodle", "bread", "salad", "other"] as const;
export type BaseType = typeof baseTypes[number];

export const proteinTypes = ["pork", "beef", "chicken", "seafood", "vegetarian", "mixed"] as const;
export type ProteinType = typeof proteinTypes[number];

export const mealTypes = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealType = typeof mealTypes[number];

export const menuSchema = z.object({
  id: z.string(),
  canonicalName: z.string(),
  displayName: z.string(),
  cuisine: z.enum(cuisineTypes),
  base: z.enum(baseTypes),
  hasSoup: z.boolean(),
  protein: z.enum(proteinTypes),
  spicyLevel: z.number().min(0).max(3),
  heavyLevel: z.number().min(1).max(3),
  priceRange: z.enum(["low", "medium", "high"]),
  synonyms: z.array(z.string()).optional(),
});

export type Menu = z.infer<typeof menuSchema>;

export const mealRecordSchema = z.object({
  id: z.string(),
  date: z.string(),
  mealType: z.enum(mealTypes),
  menuText: z.string(),
  canonicalMenuId: z.string().optional(),
});

export type MealRecord = z.infer<typeof mealRecordSchema>;

export const insertMealRecordSchema = mealRecordSchema.omit({ id: true });
export type InsertMealRecord = z.infer<typeof insertMealRecordSchema>;

export const userPreferencesSchema = z.object({
  preferredCuisines: z.array(z.enum(cuisineTypes)),
  preferredBases: z.array(z.enum(baseTypes)),
  preferredProteins: z.array(z.enum(proteinTypes)),
  preferSoup: z.boolean().nullable(),
  maxSpicyLevel: z.number().min(0).max(3),
  preferredHeavyLevel: z.number().min(1).max(3),
  preferredPriceRange: z.array(z.enum(["low", "medium", "high"])),
  excludedIngredients: z.array(z.string()),
  favoriteMenuIds: z.array(z.string()).default([]),
  preferHealthy: z.boolean().default(false),
  onboardingCompleted: z.boolean().default(false),
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;

export const feedbackSchema = z.object({
  id: z.string(),
  menuId: z.string(),
  action: z.enum(["select", "reject", "skip"]),
  timestamp: z.string(),
});

export type Feedback = z.infer<typeof feedbackSchema>;

export const insertFeedbackSchema = feedbackSchema.omit({ id: true, timestamp: true });
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

export const recommendationSchema = z.object({
  menu: menuSchema,
  score: z.number(),
  preferenceScore: z.number(),
  diversityBonus: z.number(),
  repetitionPenalty: z.number(),
  feedbackWeight: z.number(),
  reason: z.string(),
});

export type Recommendation = z.infer<typeof recommendationSchema>;

export const cuisineLabels: Record<CuisineType, string> = {
  korean: "한식",
  chinese: "중식",
  japanese: "일식",
  western: "양식",
  bunsik: "분식",
  asian: "아시안",
  other: "기타",
};

export const baseLabels: Record<BaseType, string> = {
  rice: "밥",
  noodle: "면",
  bread: "빵",
  salad: "샐러드",
  other: "기타",
};

export const proteinLabels: Record<ProteinType, string> = {
  pork: "돼지고기",
  beef: "소고기",
  chicken: "닭고기",
  seafood: "해산물",
  vegetarian: "채식",
  mixed: "혼합",
};

export const mealTypeLabels: Record<MealType, string> = {
  breakfast: "아침",
  lunch: "점심",
  dinner: "저녁",
  snack: "간식",
};

export const spicyLabels = ["안 매움", "약간 매움", "매움", "아주 매움"];
export const heavyLabels = ["가벼움", "보통", "묵직함"];
export const priceLabels: Record<string, string> = {
  low: "저가",
  medium: "중가",
  high: "고가",
};

export const users = {} as any;
export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = { id: string; username: string; password: string };
