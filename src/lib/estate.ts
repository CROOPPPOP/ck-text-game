import { ESTATE_LEVELS } from './estateTheme';

export interface Building {
  name: string;
  desc: string;
  level: number;
  tags: string[];
}

export interface Estate {
  type: string;
  level: string; // e.g., "Lv.3 성채"
  buildings: Building[];
}

export interface FactionStats {
  population?: string;
  finance?: string;
  publicOrder?: string;
  publicSentiment?: string;
  military?: string;
  development?: string;
  [key: string]: string | undefined;
}

/**
 * 건물 이름에서 레벨을 파싱합니다 (예: "대장간(Lv.2)" -> 2)
 * 레벨이 없으면 1을 반환합니다.
 */
export function parseBuildingLevel(name: string): number {
  const match = name.match(/Lv\.?(\d+)/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 1;
}

/**
 * 거점 규모 문자열에서 레벨을 추출합니다 (예: "Lv.3 성채" -> 3)
 */
export function getEstateLevel(estateLevelStr?: string): number {
  if (!estateLevelStr) return 1;
  const match = estateLevelStr.match(/Lv\.?(\d+)/i);
  if (match) {
    return Math.min(Math.max(parseInt(match[1], 10), 1), 5); // 1~5 사이로 제한
  }
  return 1; // 기본값
}

/**
 * 승격 가능 여부와 부족한 조건을 반환합니다.
 */
export function checkPromotion(
  currentEstateLevel: number,
  buildings: Building[],
  factionStats?: FactionStats,
  isFactionActive: boolean = false
) {
  const nextLevel = currentEstateLevel + 1;
  if (nextLevel > 5) return { canPromote: false, reasons: ['이미 최대 레벨입니다.'] };

  const reasons: string[] = [];

  // 1. 건물 수: ≥ N + 2
  const requiredBuildings = nextLevel + 1; // N이 nextLevel이므로
  if (buildings.length < requiredBuildings) {
    reasons.push(`건물 수 부족 (현재: ${buildings.length}, 필요: ${requiredBuildings})`);
  }

  // 2. 건물 레벨 합: Σ 건물 Lv ≥ N × 3 (N은 currentEstateLevel)
  const requiredLevelSum = currentEstateLevel * 3;
  const currentLevelSum = buildings.reduce((sum, b) => sum + Math.max(1, b.level), 0);
  if (currentLevelSum < requiredLevelSum) {
    reasons.push(`건물 레벨 합 부족 (현재: ${currentLevelSum}, 필요: ${requiredLevelSum})`);
  }

  // 3. 태그 다양성: ≥ min(N + 1, 4)종
  const requiredTagCount = Math.min(currentEstateLevel + 1, 4);
  const uniqueTags = new Set<string>();
  buildings.forEach(b => b.tags.forEach(t => uniqueTags.add(t)));
  if (uniqueTags.size < requiredTagCount) {
    reasons.push(`건물 효과 태그 다양성 부족 (현재: ${uniqueTags.size}종, 필요: ${requiredTagCount}종)`);
  }

  // 세력 수치 조건 (세력 상태가 활성일 때만)
  if (isFactionActive && factionStats) {
    if (nextLevel >= 3) {
      // 치안과 민심이 모두 '보통' 이상
      const goodKeywords = ['보통', '안정', '좋음', '높음', '우수', '평온', '매우'];
      const badKeywords = ['나쁨', '불안', '낮음', '악화', '위험', '폭동']; // 단순화를 위해 bad 키워드 없으면 통과로 처리하거나 good 포함 시 통과
      
      const isGood = (val?: string) => {
        if (!val) return false;
        return badKeywords.every(k => !val.includes(k)); // 나쁜 키워드가 없으면 보통 이상으로 간주
      };

      if (!isGood(factionStats.publicOrder)) reasons.push(`치안 상태가 '보통' 이상이어야 합니다.`);
      if (!isGood(factionStats.publicSentiment)) reasons.push(`민심 상태가 '보통' 이상이어야 합니다.`);
    }
    
    if (nextLevel >= 4) {
      // 개발도 '높음' 이상
      const highKeywords = ['높음', '우수', '매우', '번영', '발달'];
      const isHigh = (val?: string) => {
        if (!val) return false;
        return highKeywords.some(k => val.includes(k));
      };
      if (!isHigh(factionStats.development)) reasons.push(`개발도가 '높음' 이상이어야 합니다.`);
    }
  }

  return {
    canPromote: reasons.length === 0,
    reasons
  };
}

import { PlayerArchetype } from './ckVisuals';
import { 
  calculateBuildingUpgradeCost, 
  calculateEstatePromotionCost,
  BuildingCostEstimate,
  EstatePromotionCostEstimate 
} from './estateEconomy';

export interface UpgradeCandidate {
  buildingName: string;
  currentLevel: number;
  targetLevel: number;
  cost: number;
  currency: string;
  formattedCost: string;
  turns: number;
  discountPercent: number;
  category: string;
}

/**
 * 업그레이드 가능한 건물 목록을 생성합니다. (SSOT estateEconomy 공식 연동)
 */
export function getUpgradeCandidates(
  currentEstateLevel: number,
  buildings: Building[],
  archetype: PlayerArchetype = 'noble',
  stewardshipScore: number = 10
): UpgradeCandidate[] {
  const maxBuildingLevel = ESTATE_LEVELS[currentEstateLevel as keyof typeof ESTATE_LEVELS]?.maxBuildingLevel || 1;
  
  return buildings
    .filter(b => b.level < maxBuildingLevel)
    .map(b => {
      const targetLevel = b.level + 1;
      const estimate = calculateBuildingUpgradeCost(b, currentEstateLevel, archetype, stewardshipScore);
      
      return {
        buildingName: b.name,
        currentLevel: b.level,
        targetLevel,
        cost: estimate.amount,
        currency: estimate.currency,
        formattedCost: estimate.formattedCost,
        turns: estimate.turns,
        discountPercent: estimate.discountPercent,
        category: estimate.category
      };
    });
}

/**
 * 세력 활성화 단계를 반환합니다.
 * 0: 비활성, 1: 축소판 활성, 2: 전체 활성
 */
export function getFactionTier(estateLevel: number, hasAuthority: boolean): 0 | 1 | 2 {
  if (estateLevel >= 3) return 2;
  if (estateLevel >= 2 || hasAuthority) return 1;
  return 0;
}
