import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMealRecordSchema, insertFeedbackSchema, userPreferencesSchema, mealTypes, MealType } from "@shared/schema";
import { calculateRecommendations, calculateInsights, getMenuCandidatesByCategory } from "./recommendation-engine";
import { getMenuMatcher } from "./menu-matcher";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/meal-records", async (req, res) => {
    try {
      const records = await storage.getMealRecords();
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch meal records" });
    }
  });

  app.post("/api/meal-records", async (req, res) => {
    try {
      const parsed = insertMealRecordSchema.parse(req.body);
      const menus = storage.getMenuDatabase();
      const matcher = getMenuMatcher(menus);
      
      const matchResult = matcher.findBestMatch(parsed.menuText);
      
      let finalMenuText = parsed.menuText;
      let matchedMenuId: string | undefined;
      
      if (matchResult.menu && matchResult.confidence >= 0.5) {
        finalMenuText = matchResult.menu.displayName;
        matchedMenuId = matchResult.menu.id;
      }
      
      const record = await storage.createMealRecord({
        ...parsed,
        menuText: finalMenuText,
      });
      
      res.status(201).json({
        ...record,
        matchedMenuId,
        matchConfidence: matchResult.confidence,
        matchType: matchResult.matchType,
        originalInput: parsed.menuText !== finalMenuText ? parsed.menuText : undefined,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create meal record" });
      }
    }
  });

  app.get("/api/menu-suggestions", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 1) {
        return res.json([]);
      }
      
      const menus = storage.getMenuDatabase();
      const matcher = getMenuMatcher(menus);
      const suggestions = matcher.findSuggestions(query, 8);
      
      res.json(suggestions.map(s => ({
        id: s.menu.id,
        displayName: s.menu.displayName,
        cuisine: s.menu.cuisine,
        confidence: s.confidence,
      })));
    } catch (error) {
      res.status(500).json({ error: "Failed to get suggestions" });
    }
  });

  app.delete("/api/meal-records/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteMealRecord(req.params.id);
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "Record not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete meal record" });
    }
  });

  app.get("/api/preferences", async (req, res) => {
    try {
      const preferences = await storage.getPreferences();
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  app.put("/api/preferences", async (req, res) => {
    try {
      const parsed = userPreferencesSchema.parse(req.body);
      const preferences = await storage.updatePreferences(parsed);
      res.json(preferences);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update preferences" });
      }
    }
  });

  app.get("/api/recommendations", async (req, res) => {
    try {
      const mealRecords = await storage.getMealRecords();
      const preferences = await storage.getPreferences();
      const feedback = await storage.getFeedback();
      const menus = storage.getMenuDatabase();

      const mealType = req.query.mealType as MealType | undefined;
      const excludeIds = req.query.excludeIds 
        ? (req.query.excludeIds as string).split(",") 
        : undefined;

      const validMealType = mealType && mealTypes.includes(mealType) ? mealType : undefined;

      const recommendations = calculateRecommendations(
        menus,
        mealRecords,
        preferences,
        feedback,
        validMealType,
        excludeIds
      );

      res.json(recommendations);
    } catch (error) {
      console.error("Recommendation error:", error);
      res.status(500).json({ error: "Failed to generate recommendations" });
    }
  });

  app.get("/api/menu-candidates", async (req, res) => {
    try {
      const preferences = await storage.getPreferences();
      const menus = storage.getMenuDatabase();
      const candidates = getMenuCandidatesByCategory(menus, preferences);
      res.json(candidates);
    } catch (error) {
      res.status(500).json({ error: "Failed to get menu candidates" });
    }
  });

  app.post("/api/feedback", async (req, res) => {
    try {
      const parsed = insertFeedbackSchema.parse(req.body);
      const feedback = await storage.createFeedback(parsed);
      res.status(201).json(feedback);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to save feedback" });
      }
    }
  });

  app.get("/api/insights", async (req, res) => {
    try {
      const mealRecords = await storage.getMealRecords();
      const feedback = await storage.getFeedback();
      const menus = storage.getMenuDatabase();

      const insights = calculateInsights(mealRecords, menus, feedback);
      res.json(insights);
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate insights" });
    }
  });

  app.post("/api/demo/fill-data", async (req, res) => {
    try {
      await storage.clearMealRecords();
      await storage.clearFeedback();

      const menus = storage.getMenuDatabase();
      const today = new Date();

      const demoMeals: { daysAgo: number; mealType: MealType; menuIndex: number }[] = [
        { daysAgo: 0, mealType: "lunch", menuIndex: 0 },
        { daysAgo: 0, mealType: "dinner", menuIndex: 28 },
        { daysAgo: 1, mealType: "breakfast", menuIndex: 81 },
        { daysAgo: 1, mealType: "lunch", menuIndex: 56 },
        { daysAgo: 1, mealType: "dinner", menuIndex: 15 },
        { daysAgo: 2, mealType: "lunch", menuIndex: 38 },
        { daysAgo: 2, mealType: "dinner", menuIndex: 93 },
        { daysAgo: 3, mealType: "lunch", menuIndex: 11 },
        { daysAgo: 3, mealType: "dinner", menuIndex: 44 },
        { daysAgo: 4, mealType: "lunch", menuIndex: 76 },
        { daysAgo: 4, mealType: "dinner", menuIndex: 2 },
        { daysAgo: 5, mealType: "lunch", menuIndex: 29 },
        { daysAgo: 5, mealType: "dinner", menuIndex: 89 },
        { daysAgo: 6, mealType: "lunch", menuIndex: 22 },
        { daysAgo: 6, mealType: "dinner", menuIndex: 51 },
      ];

      for (const meal of demoMeals) {
        const date = new Date(today);
        date.setDate(date.getDate() - meal.daysAgo);
        const dateStr = date.toISOString().split("T")[0];

        const menu = menus[meal.menuIndex % menus.length];

        await storage.createMealRecord({
          date: dateStr,
          mealType: meal.mealType,
          menuText: menu.displayName,
        });
      }

      const demoPrefs = {
        preferredCuisines: ["korean" as const, "japanese" as const],
        preferredBases: ["rice" as const, "noodle" as const],
        preferredProteins: ["pork" as const, "chicken" as const],
        preferSoup: null,
        maxSpicyLevel: 2,
        preferredHeavyLevel: 2,
        preferredPriceRange: ["low" as const, "medium" as const],
        excludedIngredients: [],
        favoriteMenuIds: [],
        preferHealthy: false,
        onboardingCompleted: true,
      };

      await storage.updatePreferences(demoPrefs);

      res.json({ success: true, message: "Demo data filled successfully" });
    } catch (error) {
      console.error("Demo fill error:", error);
      res.status(500).json({ error: "Failed to fill demo data" });
    }
  });

  return httpServer;
}
