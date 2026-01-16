# Personalized Meal Recommendation Service

## Overview

This is a personalized meal recommendation web application built for Korean users. The app helps users decide what to eat by tracking their recent meals and providing AI-powered menu suggestions based on their preferences, dietary restrictions, and eating patterns.

**Core Features:**
- Meal record tracking (last 7 days)
- Taste onboarding flow (select favorite foods by category to build taste profile)
- Personalized preference settings (cuisine type, base, protein, spiciness, health preference, etc.)
- Smart menu recommendations with diversity scoring and meal-type awareness
- Meal-by-meal recommendation flow (breakfast → lunch → dinner with auto-progression)
- Dynamic alternatives (reject/skip shows new options immediately)
- Feedback system to improve future recommendations
- Insights dashboard showing eating patterns

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework:** React 18 with TypeScript, built using Vite
- **Routing:** Wouter (lightweight client-side routing)
- **State Management:** TanStack React Query for server state
- **UI Components:** shadcn/ui component library with Radix UI primitives
- **Styling:** Tailwind CSS with custom design tokens and CSS variables for theming
- **Typography:** Pretendard Variable font (optimized for Korean/English)

**Key Design Decisions:**
- Three main pages: Records (meal input), Recommendations, Settings
- Card-based layouts with mobile-first responsive design
- Light/dark theme support via CSS variables
- Form handling with react-hook-form and Zod validation

### Backend Architecture
- **Runtime:** Node.js with Express
- **Language:** TypeScript with ESM modules
- **API Pattern:** RESTful JSON API under `/api/*` prefix
- **Build:** esbuild for production bundling, tsx for development

**Key API Endpoints:**
- `GET/POST/DELETE /api/meal-records` - CRUD for meal history
- `GET/PUT /api/preferences` - User preference management (includes favoriteMenuIds, preferHealthy, onboardingCompleted)
- `GET /api/recommendations?mealType=lunch&excludeIds=id1,id2` - Get personalized menu suggestions with meal-type and exclusion support
- `GET /api/menu-candidates` - Get category-grouped menu candidates for taste onboarding
- `POST /api/feedback` - Record user actions on recommendations
- `GET /api/insights` - Eating pattern analytics

### Data Layer
- **Schema Definition:** Zod schemas in `shared/schema.ts` shared between client and server
- **ORM:** Drizzle ORM configured for PostgreSQL
- **Current Storage:** In-memory storage (MemStorage class) with interface for future DB migration
- **Menu Database:** Static menu catalog with 100+ Korean/Asian menu items in `server/menu-database.ts`

**Data Models:**
- MealRecord: User's meal history entries
- UserPreferences: Cuisine, protein, spiciness preferences
- Feedback: User reactions to recommendations
- Menu: Canonical menu items with attributes

### Recommendation Engine
Located in `server/recommendation-engine.ts`, the engine calculates menu scores based on:
- Preference matching (25%) - weighted by user settings (cuisine, base, protein, soup, spicy, heavy, price)
- Diversity bonus (20%) - avoid repetition of cuisine/base types
- Repetition penalty (25%) - recently eaten items scored lower
- Feedback weight (10%) - liked/disliked items adjusted
- Meal-type bonus (10%) - breakfast prefers lighter foods (heavyLevel 1-2), dinner prefers heavier foods (heavyLevel 2-3)
- Health bonus (5%) - vegetarian, salad, light menus preferred when preferHealthy is enabled
- Favorite bonus (5%) - menus selected during taste onboarding get extra score

**Key Features:**
- Dynamic exclusion via excludeMenuIds parameter (for reject/skip alternatives)
- Meal-type-aware scoring adjustments
- Category-based menu candidates for onboarding (getMenuCandidatesByCategory)

## External Dependencies

### Database
- **PostgreSQL:** Primary database (Drizzle ORM configured)
- **Drizzle Kit:** Database migrations via `db:push` command
- **Connection:** Requires `DATABASE_URL` environment variable

### Key NPM Packages
- **UI:** @radix-ui/* primitives, class-variance-authority, tailwind-merge
- **Forms:** react-hook-form, @hookform/resolvers, zod
- **Date handling:** date-fns with Korean locale
- **HTTP:** TanStack React Query for data fetching

### Development Tools
- **Vite plugins:** @replit/vite-plugin-runtime-error-modal, cartographer, dev-banner
- **TypeScript:** Strict mode, ESNext target, bundler module resolution

### Fonts (CDN)
- Pretendard Variable from jsDelivr CDN