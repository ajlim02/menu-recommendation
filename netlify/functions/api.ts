import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

import {
  MealRecord,
  InsertMealRecord,
  UserPreferences,
  Feedback,
  InsertFeedback,
  Menu,
  insertMealRecordSchema,
  insertFeedbackSchema,
  userPreferencesSchema,
  mealTypes,
  MealType,
} from "../../shared/schema";
import { menuDatabase } from "../../server/menu-database";
import { calculateRecommendations, calculateInsights, getMenuCandidatesByCategory } from "../../server/recommendation-engine";
import { getMenuMatcher } from "../../server/menu-matcher";
import { z } from "zod";
import { randomUUID } from "crypto";

const defaultPreferences: UserPreferences = {
  preferredCuisines: [],
  preferredBases: [],
  preferredProteins: [],
  preferSoup: null,
  maxSpicyLevel: 2,
  preferredHeavyLevel: 2,
  preferredPriceRange: ["low", "medium", "high"],
  excludedIngredients: [],
  favoriteMenuIds: [],
  preferHealthy: false,
  fitnessGoal: "none",
  onboardingCompleted: false,
};

let mealRecords: Map<string, MealRecord> = new Map();
let preferences: UserPreferences = { ...defaultPreferences };
let feedback: Map<string, Feedback> = new Map();

function findMenuByName(name: string): Menu | undefined {
  const lowerName = name.toLowerCase().trim();
  return menuDatabase.find(
    (m) =>
      m.displayName.toLowerCase() === lowerName ||
      m.aliases?.some((a) => a.toLowerCase() === lowerName)
  );
}

function getMealRecords(): MealRecord[] {
  const records = Array.from(mealRecords.values());
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const cutoff = sevenDaysAgo.toISOString().split("T")[0];
  return records.filter((r) => r.date >= cutoff).sort((a, b) => b.date.localeCompare(a.date));
}

function createMealRecord(record: InsertMealRecord): MealRecord {
  const id = randomUUID();
  const canonicalMenu = findMenuByName(record.menuText);
  const newRecord: MealRecord = { ...record, id, canonicalMenuId: canonicalMenu?.id };
  mealRecords.set(id, newRecord);
  return newRecord;
}

function deleteMealRecord(id: string): boolean {
  return mealRecords.delete(id);
}

function getFeedbackList(): Feedback[] {
  return Array.from(feedback.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

function createFeedback(feedbackData: InsertFeedback): Feedback {
  const id = randomUUID();
  const newFeedback: Feedback = { ...feedbackData, id, timestamp: new Date().toISOString() };
  feedback.set(id, newFeedback);
  return newFeedback;
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const path = event.path.replace("/.netlify/functions/api", "").replace("/api", "") || "/";
  const method = event.httpMethod;

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  };

  if (method === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    if (path === "/meal-records" || path === "/meal-records/") {
      if (method === "GET") {
        return { statusCode: 200, headers, body: JSON.stringify(getMealRecords()) };
      }
      if (method === "POST") {
        const body = JSON.parse(event.body || "{}");
        const parsed = insertMealRecordSchema.parse(body);
        const matcher = getMenuMatcher(menuDatabase);
        const matchResult = matcher.findBestMatch(parsed.menuText);
        
        let finalMenuText = parsed.menuText;
        let matchedMenuId: string | undefined;
        
        if (matchResult.menu && matchResult.confidence >= 0.5) {
          finalMenuText = matchResult.menu.displayName;
          matchedMenuId = matchResult.menu.id;
        }
        
        const record = createMealRecord({ ...parsed, menuText: finalMenuText });
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            ...record,
            matchedMenuId,
            matchConfidence: matchResult.confidence,
            matchType: matchResult.matchType,
            originalInput: parsed.menuText !== finalMenuText ? parsed.menuText : undefined,
          }),
        };
      }
    }

    const mealRecordMatch = path.match(/^\/meal-records\/([^/]+)$/);
    if (mealRecordMatch && method === "DELETE") {
      const id = mealRecordMatch[1];
      const deleted = deleteMealRecord(id);
      return deleted
        ? { statusCode: 204, headers, body: "" }
        : { statusCode: 404, headers, body: JSON.stringify({ error: "Record not found" }) };
    }

    if (path === "/menu-suggestions" || path === "/menu-suggestions/") {
      const query = event.queryStringParameters?.q || "";
      if (!query || query.length < 1) {
        return { statusCode: 200, headers, body: JSON.stringify([]) };
      }
      const matcher = getMenuMatcher(menuDatabase);
      const suggestions = matcher.findSuggestions(query, 8);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(
          suggestions.map((s) => ({
            id: s.menu.id,
            displayName: s.menu.displayName,
            cuisine: s.menu.cuisine,
            confidence: s.confidence,
          }))
        ),
      };
    }

    if (path === "/preferences" || path === "/preferences/") {
      if (method === "GET") {
        return { statusCode: 200, headers, body: JSON.stringify(preferences) };
      }
      if (method === "PUT") {
        const body = JSON.parse(event.body || "{}");
        const parsed = userPreferencesSchema.parse(body);
        preferences = { ...parsed };
        return { statusCode: 200, headers, body: JSON.stringify(preferences) };
      }
    }

    if (path === "/recommendations" || path === "/recommendations/") {
      const mealType = event.queryStringParameters?.mealType as MealType | undefined;
      const excludeIds = event.queryStringParameters?.excludeIds?.split(",") || undefined;
      const validMealType = mealType && mealTypes.includes(mealType) ? mealType : undefined;

      const recommendations = calculateRecommendations(
        menuDatabase,
        getMealRecords(),
        preferences,
        getFeedbackList(),
        validMealType,
        excludeIds
      );
      return { statusCode: 200, headers, body: JSON.stringify(recommendations) };
    }

    if (path === "/menu-candidates" || path === "/menu-candidates/") {
      const candidates = getMenuCandidatesByCategory(menuDatabase, preferences);
      return { statusCode: 200, headers, body: JSON.stringify(candidates) };
    }

    if ((path === "/feedback" || path === "/feedback/") && method === "POST") {
      const body = JSON.parse(event.body || "{}");
      const parsed = insertFeedbackSchema.parse(body);
      const newFeedback = createFeedback(parsed);
      return { statusCode: 201, headers, body: JSON.stringify(newFeedback) };
    }

    if (path === "/insights" || path === "/insights/") {
      const insights = calculateInsights(getMealRecords(), menuDatabase, getFeedbackList());
      return { statusCode: 200, headers, body: JSON.stringify(insights) };
    }

    if ((path === "/demo/fill-data" || path === "/demo/fill-data/") && method === "POST") {
      mealRecords.clear();
      feedback.clear();

      const today = new Date();
      const demoMeals = [
        { daysAgo: 0, mealType: "lunch" as MealType, menuIndex: 0 },
        { daysAgo: 0, mealType: "dinner" as MealType, menuIndex: 28 },
        { daysAgo: 1, mealType: "breakfast" as MealType, menuIndex: 81 },
        { daysAgo: 1, mealType: "lunch" as MealType, menuIndex: 56 },
        { daysAgo: 1, mealType: "dinner" as MealType, menuIndex: 15 },
        { daysAgo: 2, mealType: "lunch" as MealType, menuIndex: 38 },
        { daysAgo: 2, mealType: "dinner" as MealType, menuIndex: 93 },
      ];

      for (const meal of demoMeals) {
        const date = new Date(today);
        date.setDate(date.getDate() - meal.daysAgo);
        const dateStr = date.toISOString().split("T")[0];
        const menu = menuDatabase[meal.menuIndex % menuDatabase.length];
        createMealRecord({ date: dateStr, mealType: meal.mealType, menuText: menu.displayName });
      }

      preferences = {
        ...defaultPreferences,
        preferredCuisines: ["korean", "japanese"],
        preferredBases: ["rice", "noodle"],
        preferredProteins: ["pork", "chicken"],
        onboardingCompleted: true,
      };

      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: "Not found" }) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: error.errors }) };
    }
    console.error("API error:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Internal server error" }) };
  }
};

export { handler };
