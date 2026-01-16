import {
  MealRecord,
  InsertMealRecord,
  UserPreferences,
  Feedback,
  InsertFeedback,
  Menu,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { menuDatabase } from "./menu-database";

export interface IStorage {
  getMealRecords(): Promise<MealRecord[]>;
  getMealRecord(id: string): Promise<MealRecord | undefined>;
  createMealRecord(record: InsertMealRecord): Promise<MealRecord>;
  deleteMealRecord(id: string): Promise<boolean>;
  clearMealRecords(): Promise<void>;

  getPreferences(): Promise<UserPreferences>;
  updatePreferences(prefs: UserPreferences): Promise<UserPreferences>;

  getFeedback(): Promise<Feedback[]>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  clearFeedback(): Promise<void>;

  getMenuDatabase(): Menu[];
  findMenuByName(name: string): Menu | undefined;
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
  favoriteMenuIds: [],
  preferHealthy: false,
  fitnessGoal: "none",
  onboardingCompleted: false,
};

export class MemStorage implements IStorage {
  private mealRecords: Map<string, MealRecord>;
  private preferences: UserPreferences;
  private feedback: Map<string, Feedback>;
  private menus: Menu[];

  constructor() {
    this.mealRecords = new Map();
    this.preferences = { ...defaultPreferences };
    this.feedback = new Map();
    this.menus = menuDatabase;
  }

  async getMealRecords(): Promise<MealRecord[]> {
    const records = Array.from(this.mealRecords.values());
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoff = sevenDaysAgo.toISOString().split("T")[0];

    return records
      .filter((r) => r.date >= cutoff)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  async getMealRecord(id: string): Promise<MealRecord | undefined> {
    return this.mealRecords.get(id);
  }

  async createMealRecord(record: InsertMealRecord): Promise<MealRecord> {
    const id = randomUUID();
    const canonicalMenu = this.findMenuByName(record.menuText);
    const newRecord: MealRecord = {
      ...record,
      id,
      canonicalMenuId: canonicalMenu?.id,
    };
    this.mealRecords.set(id, newRecord);
    return newRecord;
  }

  async deleteMealRecord(id: string): Promise<boolean> {
    return this.mealRecords.delete(id);
  }

  async clearMealRecords(): Promise<void> {
    this.mealRecords.clear();
  }

  async getPreferences(): Promise<UserPreferences> {
    return { ...this.preferences };
  }

  async updatePreferences(prefs: UserPreferences): Promise<UserPreferences> {
    this.preferences = { ...prefs };
    return this.preferences;
  }

  async getFeedback(): Promise<Feedback[]> {
    return Array.from(this.feedback.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    const id = randomUUID();
    const newFeedback: Feedback = {
      ...feedbackData,
      id,
      timestamp: new Date().toISOString(),
    };
    this.feedback.set(id, newFeedback);
    return newFeedback;
  }

  async clearFeedback(): Promise<void> {
    this.feedback.clear();
  }

  getMenuDatabase(): Menu[] {
    return this.menus;
  }

  findMenuByName(name: string): Menu | undefined {
    const normalized = name.toLowerCase().trim();
    return this.menus.find(
      (m) =>
        m.displayName.toLowerCase() === normalized ||
        m.canonicalName.toLowerCase() === normalized ||
        m.synonyms?.some((s) => s.toLowerCase() === normalized)
    );
  }
}

export const storage = new MemStorage();
