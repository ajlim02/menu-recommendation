import Fuse from "fuse.js";
import { Menu } from "@shared/schema";

const JAMO_START = 0x1100;
const JAMO_CHO = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", 
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"
];
const JAMO_JUNG = [
  "ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ",
  "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"
];
const JAMO_JONG = [
  "", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ",
  "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"
];

function decomposeHangul(str: string): string {
  let result = "";
  for (const char of str) {
    const code = char.charCodeAt(0);
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const syllableIndex = code - 0xAC00;
      const choIndex = Math.floor(syllableIndex / 588);
      const jungIndex = Math.floor((syllableIndex % 588) / 28);
      const jongIndex = syllableIndex % 28;
      result += JAMO_CHO[choIndex] + JAMO_JUNG[jungIndex] + JAMO_JONG[jongIndex];
    } else {
      result += char;
    }
  }
  return result;
}

function extractChosung(str: string): string {
  let result = "";
  for (const char of str) {
    const code = char.charCodeAt(0);
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const syllableIndex = code - 0xAC00;
      const choIndex = Math.floor(syllableIndex / 588);
      result += JAMO_CHO[choIndex];
    } else {
      result += char;
    }
  }
  return result;
}

const SIMILAR_MENU_ALIASES: Record<string, string[]> = {
  "김치찌개": ["김찌", "김치찌게", "김치찌깨", "김치 찌개", "김치찌개~"],
  "된장찌개": ["된찌", "된장찌게", "된장찌깨", "된장 찌개"],
  "제육볶음": ["제육", "제육복음", "제육볶음~", "제육볶"],
  "김치볶음밥": ["김볶", "김치볶음밥~", "김치 볶음밥", "김치볶음밥!"],
  "불고기": ["불고기~", "소불고기", "불고기정식"],
  "비빔밥": ["비빔밥~", "비빔", "비빔밥!"],
  "삼겹살": ["삼겹", "삼겹살구이", "삼겹살~"],
  "돈까스": ["돈가스", "돈까쓰", "돈카츠", "톤카츠", "돈까스~", "등심돈까스", "안심돈까스"],
  "짜장면": ["짜장", "자장면", "짜장면~", "짜장밥"],
  "짬뽕": ["짬뽕~", "짬뽕!"],
  "볶음밥": ["볶밥", "볶음밥~"],
  "라면": ["라면~", "라멘"],
  "우동": ["우동~", "우동면"],
  "초밥": ["초밥~", "스시", "스시~"],
  "삼계탕": ["삼계탕~", "삼게탕", "삼겨탕"],
  "냉면": ["냉면~", "랭면", "물냉면", "비빔냉면"],
  "부대찌개": ["부찌", "부대찌게", "부대찌깨"],
  "순두부찌개": ["순두부", "순두부찌게", "순찌"],
  "떡볶이": ["떡볶기", "떡볶이~", "떡볶", "떡복이"],
  "튀김": ["튀김~", "튀김!"],
  "만두": ["만두~", "군만두", "물만두", "찐만두"],
  "칼국수": ["칼국수~", "칼국", "칼국쑤"],
  "수제비": ["수제비~", "수제비!"],
  "김밥": ["김밥~", "김밥!"],
  "햄버거": ["햄버거~", "버거", "햄벅거", "함버거"],
  "피자": ["피자~", "피짜", "피자!"],
  "파스타": ["파스타~", "스파게티", "파스타!"],
  "샐러드": ["샐러드~", "사라다", "샐러드!"],
  "카레": ["카레~", "카레라이스", "카레!"],
  "오므라이스": ["오므라이스~", "오믈렛", "오므라이스!"],
  "치킨": ["치킨~", "후라이드", "양념치킨", "치킨!"],
  "족발": ["족발~", "족발!"],
  "보쌈": ["보쌈~", "보쌈!"],
  "갈비": ["갈비~", "소갈비", "돼지갈비", "갈비구이"],
  "갈비탕": ["갈비탕~", "갈비탕!"],
  "설렁탕": ["설렁탕~", "설렁탕!", "설농탕"],
  "곰탕": ["곰탕~", "곰탕!"],
  "육개장": ["육개장~", "육개장!"],
  "해장국": ["해장국~", "해장국!", "뼈해장국"],
  "감자탕": ["감자탕~", "감자탕!"],
  "닭갈비": ["닭갈비~", "닭갈비!", "춘천닭갈비"],
  "닭볶음탕": ["닭볶음탕~", "닭볶음탕!", "닭도리탕"],
  "쌀국수": ["쌀국수~", "포", "pho", "퍼"],
  "팟타이": ["팟타이~", "팟타이!", "패드타이"],
  "카오팟": ["카오팟~", "카오팟!"],
  "마라탕": ["마라탕~", "마라탕!", "마라샹궈"],
  "훠궈": ["훠궈~", "훠거", "훠꿔", "샤브샤브"],
  "탕수육": ["탕수육~", "탕수육!", "탕쑤육"],
  "깐풍기": ["깐풍기~", "깐풍기!", "깐퐁기"],
  "볶음면": ["볶음면~", "볶음면!"],
  "회": ["회~", "사시미", "회!"],
  "덮밥": ["덮밥~", "덮밥!"],
  "정식": ["정식~", "정식!"],
  "국밥": ["국밥~", "국밥!"],
};

interface MenuWithSearchFields {
  menu: Menu;
  displayName: string;
  decomposed: string;
  chosung: string;
  aliases: string[];
  synonyms: string[];
}

export class MenuMatcher {
  private fuse: Fuse<MenuWithSearchFields>;
  private aliasMap: Map<string, string>;
  private exactMap: Map<string, Menu>;
  private menusWithSearchFields: MenuWithSearchFields[];

  constructor(menus: Menu[]) {
    this.menusWithSearchFields = menus.map((menu) => ({
      menu,
      displayName: menu.displayName.toLowerCase(),
      decomposed: decomposeHangul(menu.displayName.toLowerCase()),
      chosung: extractChosung(menu.displayName),
      aliases: this.getAliases(menu.displayName),
      synonyms: menu.synonyms || [],
    }));

    this.fuse = new Fuse(this.menusWithSearchFields, {
      keys: [
        { name: "displayName", weight: 3 },
        { name: "synonyms", weight: 3 },
        { name: "decomposed", weight: 2 },
        { name: "aliases", weight: 2 },
        { name: "chosung", weight: 1 },
      ],
      threshold: 0.4,
      includeScore: true,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });

    this.aliasMap = new Map();
    for (const [main, aliases] of Object.entries(SIMILAR_MENU_ALIASES)) {
      for (const alias of aliases) {
        this.aliasMap.set(alias.toLowerCase(), main.toLowerCase());
      }
    }
    
    for (const menu of menus) {
      if (menu.synonyms) {
        for (const synonym of menu.synonyms) {
          this.aliasMap.set(synonym.toLowerCase(), menu.displayName.toLowerCase());
        }
      }
    }

    this.exactMap = new Map();
    for (const menu of menus) {
      this.exactMap.set(menu.displayName.toLowerCase(), menu);
    }
  }

  private getAliases(menuName: string): string[] {
    const aliases: string[] = [];
    for (const [main, aliasList] of Object.entries(SIMILAR_MENU_ALIASES)) {
      if (menuName.includes(main)) {
        aliases.push(...aliasList);
      }
    }
    return aliases;
  }

  findBestMatch(input: string): { menu: Menu | null; confidence: number; matchType: string } {
    const normalizedInput = input.toLowerCase().trim()
      .replace(/[~!?.,\s]+/g, "")
      .replace(/\s+/g, "");

    const exactMatch = this.exactMap.get(input.toLowerCase().trim());
    if (exactMatch) {
      return { menu: exactMatch, confidence: 1.0, matchType: "exact" };
    }

    const aliasTarget = this.aliasMap.get(input.toLowerCase().trim());
    if (aliasTarget) {
      const aliasMatch = this.exactMap.get(aliasTarget);
      if (aliasMatch) {
        return { menu: aliasMatch, confidence: 0.95, matchType: "alias" };
      }
    }

    const exactEntries = Array.from(this.exactMap.entries());
    for (let i = 0; i < exactEntries.length; i++) {
      const [displayName, menu] = exactEntries[i];
      const normalizedMenu = displayName.replace(/[~!?.,\s]+/g, "").replace(/\s+/g, "");
      if (normalizedInput === normalizedMenu) {
        return { menu, confidence: 0.95, matchType: "normalized" };
      }
    }

    for (const item of this.menusWithSearchFields) {
      if (item.displayName.includes(normalizedInput) || normalizedInput.includes(item.displayName.replace(/\s+/g, ""))) {
        return { menu: item.menu, confidence: 0.85, matchType: "partial" };
      }
    }

    const inputChosung = extractChosung(input);
    for (const item of this.menusWithSearchFields) {
      if (item.chosung === inputChosung && inputChosung.length >= 2) {
        return { menu: item.menu, confidence: 0.75, matchType: "chosung" };
      }
    }

    const fuseResults = this.fuse.search(input);
    if (fuseResults.length > 0) {
      const best = fuseResults[0];
      const confidence = 1 - (best.score || 0);
      if (confidence >= 0.5) {
        return { menu: best.item.menu, confidence, matchType: "fuzzy" };
      }
    }

    const decomposedInput = decomposeHangul(input.toLowerCase());
    const decomposedResults = this.fuse.search(decomposedInput);
    if (decomposedResults.length > 0) {
      const best = decomposedResults[0];
      const confidence = 1 - (best.score || 0);
      if (confidence >= 0.45) {
        return { menu: best.item.menu, confidence, matchType: "decomposed" };
      }
    }

    return { menu: null, confidence: 0, matchType: "none" };
  }

  findSuggestions(input: string, limit: number = 5): Array<{ menu: Menu; confidence: number }> {
    if (!input || input.length < 1) return [];

    const results = this.fuse.search(input, { limit });
    return results.map((r) => ({
      menu: r.item.menu,
      confidence: 1 - (r.score || 0),
    }));
  }
}

let matcherInstance: MenuMatcher | null = null;

export function getMenuMatcher(menus: Menu[]): MenuMatcher {
  if (!matcherInstance) {
    matcherInstance = new MenuMatcher(menus);
  }
  return matcherInstance;
}

export function resetMenuMatcher(): void {
  matcherInstance = null;
}
