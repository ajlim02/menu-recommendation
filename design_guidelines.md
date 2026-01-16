# Design Guidelines: Personalized Meal Recommendation Service

## Design Approach

**Selected Approach:** Hybrid System - Drawing from Material Design's component richness and Notion's clean data presentation, adapted for food-focused content with Korean UX sensibilities (inspired by Coupang Eats, Yogiyo).

**Core Principles:**
- Information clarity over decoration
- Progressive disclosure for complex preferences
- Trust through transparent explanations
- Delightful micro-moments without distraction

## Typography System

**Font Family:**
- Primary: 'Pretendard Variable' via CDN (excellent Korean/English support)
- Fallback: system-ui, -apple-system

**Hierarchy:**
- Hero/Page titles: text-3xl font-bold (Korean menus deserve prominence)
- Section headers: text-xl font-semibold
- Card titles: text-lg font-medium
- Body text: text-base font-normal
- Helper text/tags: text-sm font-medium
- Micro-labels: text-xs

## Layout System

**Spacing Units:** Consistent use of Tailwind units 2, 4, 6, 8, 12, 16
- Component internal padding: p-4 to p-6
- Section spacing: py-8 to py-12
- Card gaps: gap-4 to gap-6
- Screen margins: px-4 (mobile), px-8 (desktop)

**Container Strategy:**
- Max-width: max-w-6xl mx-auto for main content
- Full-width sections for immersive moments
- Card grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3

## Component Library

### Navigation & Header
- Sticky top navigation with minimal height
- Logo/title + quick stats (e.g., "7일 기록 완료")
- Clean horizontal menu for: 기록 입력 | 추천 | 설정

### Meal Record Cards
- Compact timeline view with date/time/meal type
- Tag pills showing detected categories
- Delete action (subtle, right-aligned icon)
- Grouped by day with clear date separators

### Recommendation Cards (Primary Focus)
**Structure:**
- Prominent menu name at top (text-lg font-semibold)
- Visual tag system: cuisine badge + 3-4 attribute icons (국물/비국물, 매운맛 등)
- Recommendation reason in subtle box (bg-gray-50, p-3, rounded, text-sm, italic)
- Three-button footer: "선택" (primary), "거절" (secondary), "나중에" (ghost)

**Top 3 Recommendations:**
- Larger cards with subtle elevation (shadow-md)
- "추천" badge in corner
- More prominent reasoning text

**Additional Candidates:**
- Slightly smaller cards in 2-3 column grid
- Simpler layout but same information density

### Preference Controls
**Multi-Select Chips:**
- Pill-shaped toggles for categories (한식, 중식, 일식, 양식, 분식, etc.)
- Active state: filled background
- Inactive state: bordered, transparent

**Range Sliders:**
- For spicy level (0-3), heaviness, budget
- Custom thumb with value label
- Track shows gradient hint

**Exclusion Tags:**
- Separate section with red accent
- Easy add/remove with X button

### Insight Dashboard
Small cards showing:
- Recent category distribution (simple bar chart or pills with percentages)
- Preference weights (top 3 liked/disliked)
- Diversity score visualization

### Demo Mode Banner
- Prominent "데모 데이터 채우기" button
- Dismissible info card explaining auto-fill

## Images

**Hero Section:** NO large hero image - this is a utility app. Instead, use:
- Clean illustrated icon/graphic showing diverse food items (kimchi, pasta, sushi, burger) as decorative header element
- Keep it minimal, under 200px height

**Menu Cards:** DO NOT use food photos in PoC (placeholder text only: "<!-- 메뉴 이미지 자리 -->")
- Real implementation would use small thumbnail (80x80px, rounded-lg)
- For PoC: use emoji or icon placeholders

**Empty States:** Friendly illustration when no records exist
- Simple line drawing of person thinking "오늘 뭐 먹지?"

## Interactions & Feedback

**Button States:**
- Primary ("선택"): Solid fill, subtle scale on hover
- Secondary ("거절"): Outlined, no background
- Ghost ("나중에"): Text only, subtle background on hover
- All buttons: rounded-lg, px-6, py-2.5

**Card Interactions:**
- Subtle hover elevation (shadow-lg)
- NO slide/flip animations
- Selected state: border accent + checkmark icon

**Feedback Messages:**
- Toast notifications for actions (선택/거절)
- Position: top-center, slide-down entrance
- Auto-dismiss after 2s

**Loading States:**
- Skeleton screens for recommendation cards
- Pulse animation on loading

## Accessibility

- All form inputs with visible labels (not just placeholders)
- Sufficient contrast ratios (WCAG AA minimum)
- Focus indicators on all interactive elements (ring-2 ring-offset-2)
- Tag text alongside icon indicators
- Screen reader text for icon-only actions

## Mobile Optimization

- Single column card layout on mobile
- Preference controls stack vertically
- Bottom sheet pattern for detailed settings
- Larger touch targets (min 44x44px)
- Fixed bottom CTA bar on recommendation screen

## Korean UX Patterns

- Polite informal tone in UI text ("~했어요", "~해요")
- Date format: M월 D일 (화)
- Meal types: 아침/점심/저녁/간식
- Clear hierarchical information (Korean reading pattern)
- Generous line-height for Korean text (leading-relaxed)

---

**Critical Success Factors:**
1. Recommendation reasoning MUST be immediately visible and conversational
2. Recent meal records displayed prominently to build trust
3. Preference controls feel powerful but not overwhelming
4. Three-button pattern on every recommendation card
5. Instant visual feedback for all user actions