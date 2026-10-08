// Single Source of Truth (SSOT) for Estate & Building Upgrade Economy
// 거점 및 시설 승격 비용의 정밀 산정 엔진 (CK3 경제 및 아키타입 연동)

import { PlayerArchetype } from './ckVisuals';
import { Building } from './estate';
import { ParsedState } from './parser';

export interface BuildingCostEstimate {
  amount: number;
  currency: string;
  formattedCost: string;
  turns: number;
  discountPercent: number;
  typeMultiplier: number;
  category: 'production' | 'faith_military' | 'admin' | 'public_supplies';
}

export interface EstatePromotionCostEstimate {
  currentLevel: number;
  targetLevel: number;
  amount: number;
  currency: string;
  formattedCost: string;
  turns: number;
  discountPercent: number;
  name: string;
}

// 1. 아키타입별 표준 통화 정의
export function getCurrencyForArchetype(archetype: PlayerArchetype): string {
  switch (archetype) {
    case 'clergy':
      return '은화';
    case 'wanderer':
      return '동화';
    case 'company':
    case 'noble':
    default:
      return '금화';
  }
}

// 2. 아키타입별 시설 기본 단가 (Base Cost)
const ARCHETYPE_BASE_BUILDING_COST: Record<PlayerArchetype, number> = {
  clergy: 25,    // 은화 25닢 (턴당 순수익 +15~20 은화 기준 약 1.5턴 저축액)
  noble: 15,     // 금화 15닢 (턴당 순수익 +1.5~3 금화 기준 약 5턴 저축액)
  company: 20,   // 금화 20닢 (턴당 순수익 +3~6 금화 기준 약 4턴 저축액)
  wanderer: 25   // 동화 25닢 (턴당 순수익 +5~10 동화 기준 약 3턴 저축액)
};

// 3. 건물 유형별 가중치 및 분류 판별
export function getBuildingTypeMultiplier(building: { name: string; desc?: string; tags?: string[] }): {
  multiplier: number;
  category: 'production' | 'faith_military' | 'admin' | 'public_supplies';
} {
  const tagsStr = (building.tags || []).join(' ');
  const combined = `${building.name} ${building.desc || ''} ${tagsStr}`;

  // 1) 생산 / 재정 / 상업 (투자금 회수형, 턴 수입 영구 증대) -> 1.2배
  if (
    combined.includes('생산') || combined.includes('재정') || combined.includes('상업') ||
    combined.includes('무역') || combined.includes('압착') || combined.includes('양조') ||
    combined.includes('제분') || combined.includes('공방') || combined.includes('대장간') ||
    combined.includes('광산') || combined.includes('방직') || combined.includes('주조')
  ) {
    return { multiplier: 1.2, category: 'production' };
  }

  // 2) 행정 / 학문 / 서재 -> 0.9배 (비교적 적은 자재 소모)
  if (
    combined.includes('행정') || combined.includes('학문') || combined.includes('서재') ||
    combined.includes('서기') || combined.includes('집사') || combined.includes('문서') ||
    combined.includes('필사') || combined.includes('참사')
  ) {
    return { multiplier: 0.9, category: 'admin' };
  }

  // 3) 민생 / 보급 / 창고 -> 0.8배 (기초 생활 인프라)
  if (
    combined.includes('민생') || combined.includes('보급') || combined.includes('식료') ||
    combined.includes('창고') || combined.includes('우물') || combined.includes('구빈') ||
    combined.includes('숙소') || combined.includes('의무')
  ) {
    return { multiplier: 0.8, category: 'public_supplies' };
  }

  // 4) 신앙 / 군사 / 방어 -> 1.0배 (표준 시설)
  return { multiplier: 1.0, category: 'faith_military' };
}

// 4. 건물 레벨 승격 비용 정밀 산출
export function calculateBuildingUpgradeCost(
  building: Building,
  currentEstateLevel: number = 1,
  archetype: PlayerArchetype = 'noble',
  stewardshipScore: number = 10
): BuildingCostEstimate {
  const currency = getCurrencyForArchetype(archetype);
  const baseCost = ARCHETYPE_BASE_BUILDING_COST[archetype] || 20;

  // 레벨 배율: Lv.1->2는 1.0, Lv.2->3은 1.5, Lv.3->4는 2.2, Lv.4->5는 3.0
  const currentLevel = Math.max(1, building.level || 1);
  const levelMultipliers: Record<number, number> = {
    1: 1.0,
    2: 1.5,
    3: 2.2,
    4: 3.0
  };
  const lvlMult = levelMultipliers[currentLevel] || Math.pow(1.5, currentLevel - 1);

  // 유형별 계수
  const { multiplier: typeMultiplier, category } = getBuildingTypeMultiplier(building);

  // 관리력 할인율 (최대 25%)
  const discountPercent = Math.min(25, Math.max(0, Math.floor(stewardshipScore * 1.2)));
  const discountFactor = (100 - discountPercent) / 100;

  // 최종 금액 (최소 5 단위)
  const rawAmount = baseCost * lvlMult * typeMultiplier * discountFactor;
  const amount = Math.max(5, Math.round(rawAmount));

  // 소요 턴수 (Lv.1->2: 2턴, Lv.2->3: 3턴, Lv.3->4: 4턴, Lv.4->5: 5턴)
  const turns = Math.min(6, Math.max(2, currentLevel + 1));

  const formattedCost = `${currency} ${amount}닢`;

  return {
    amount,
    currency,
    formattedCost,
    turns,
    discountPercent,
    typeMultiplier,
    category
  };
}

// 5. 거점 승격(Estate Promotion) 비용 고정 표준 테이블
const ESTATE_PROMOTION_TABLE: Record<number, Record<PlayerArchetype, { cost: number; turns: number }>> = {
  1: { // Lv.1 -> Lv.2
    clergy: { cost: 60, turns: 3 },
    noble: { cost: 40, turns: 3 },
    company: { cost: 50, turns: 3 },
    wanderer: { cost: 60, turns: 3 }
  },
  2: { // Lv.2 -> Lv.3
    clergy: { cost: 120, turns: 4 },
    noble: { cost: 80, turns: 4 },
    company: { cost: 90, turns: 4 },
    wanderer: { cost: 120, turns: 4 }
  },
  3: { // Lv.3 -> Lv.4
    clergy: { cost: 220, turns: 5 },
    noble: { cost: 150, turns: 5 },
    company: { cost: 160, turns: 5 },
    wanderer: { cost: 220, turns: 5 }
  },
  4: { // Lv.4 -> Lv.5
    clergy: { cost: 380, turns: 6 },
    noble: { cost: 280, turns: 6 },
    company: { cost: 280, turns: 6 },
    wanderer: { cost: 380, turns: 6 }
  }
};

// 6. 거점 승격 비용 정밀 산출
export function calculateEstatePromotionCost(
  currentLevel: number,
  archetype: PlayerArchetype = 'noble',
  stewardshipScore: number = 10
): EstatePromotionCostEstimate {
  const targetLevel = Math.min(5, currentLevel + 1);
  const currency = getCurrencyForArchetype(archetype);

  const baseInfo = ESTATE_PROMOTION_TABLE[currentLevel]?.[archetype] || { cost: 100, turns: 4 };

  // 관리력 할인율 (최대 25%)
  const discountPercent = Math.min(25, Math.max(0, Math.floor(stewardshipScore * 1.2)));
  const discountFactor = (100 - discountPercent) / 100;

  const amount = Math.max(10, Math.round(baseInfo.cost * discountFactor));
  const turns = baseInfo.turns;
  const formattedCost = `${currency} ${amount}닢`;
  const name = `거점 승격 공사 (Lv.${currentLevel} → Lv.${targetLevel})`;

  return {
    currentLevel,
    targetLevel,
    amount,
    currency,
    formattedCost,
    turns,
    discountPercent,
    name
  };
}

// 7. 플레이어 보유 재화 추출 (지불 능력 검증용)
export function getPlayerWealthAmount(gameState: ParsedState, currencyName: string): number {
  if (!gameState) return 0;

  const faction = gameState.factionState || {};
  const toSafeArray = (v: any): string[] => Array.isArray(v) ? v : typeof v === 'string' && v.trim() ? [v.trim()] : [];
  const wealthList: string[] = [
    ...toSafeArray(gameState.inventory?.wealth),
    ...toSafeArray(gameState.inventory?.['재산및병력']),
    ...toSafeArray(gameState.inventory?.['소지품']),
    faction['세력 재정'] || '',
    faction['재정'] || '',
    faction['금화'] || '',
    faction['은화'] || '',
    faction['동화'] || ''
  ].filter(Boolean);

  let bestAmount = 0;

  wealthList.forEach(item => {
    // 플레이어의 주요 화폐와 일치하는 항목 우선 탐색
    if (item.includes(currencyName)) {
      const match = item.match(/(\d+)/);
      if (match) {
        const val = parseInt(match[1], 10);
        if (val > bestAmount) bestAmount = val;
      }
    }
  });

  if (bestAmount > 0) return bestAmount;

  // 화폐명이 명시되지 않은 일반 정수 탐색
  for (const item of wealthList) {
    const match = item.match(/(\d+)/);
    if (match) {
      const val = parseInt(match[1], 10);
      if (val > bestAmount) bestAmount = val;
    }
  }

  return bestAmount;
}
