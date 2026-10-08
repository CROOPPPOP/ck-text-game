import { ParsedState } from './parser';
import { parseCKResources, calculateCKAttributes, extractNumericValue } from './ckVisuals';

export interface PromotionRequirement {
  id: string;
  label: string;
  current: string | number;
  target: string | number;
  met: boolean;
  desc: string;
}

export interface PromotionTarget {
  targetRank: string;
  targetArchetype: 'wanderer' | 'company' | 'clergy' | 'noble';
  ceremonyName: string;
  ceremonyType: 'investiture' | 'knighting' | 'charter' | 'conclave' | 'enfeoffment' | 'usurpation';
  historicalLore: string;
  requirements: PromotionRequirement[];
  canPromote: boolean;
  progressPercent: number;
}

export interface PromotionStatusReport {
  currentRank: string;
  currentTier: number;
  archetype: 'wanderer' | 'company' | 'clergy' | 'noble';
  possibleTargets: PromotionTarget[];
  overallCanPromote: boolean;
  bestTarget?: PromotionTarget;
}

// 29개 신분 프리셋별 승격 사다리 정의
export const STATUS_LADDER: Record<string, {
  tier: number;
  archetype: 'wanderer' | 'company' | 'clergy' | 'noble';
  nextRanks: Array<{
    target: string;
    archetype: 'wanderer' | 'company' | 'clergy' | 'noble';
    ceremony: string;
    ceremonyType: 'investiture' | 'knighting' | 'charter' | 'conclave' | 'enfeoffment' | 'usurpation';
    minGold: number;
    minPrestigeOrPiety: number;
    minEstateLevel: number;
    superiorTrustReq: number;
    lore: string;
  }>;
}> = {
  // 1. 개인 및 방랑자 (9종)
  '부랑자': {
    tier: 0,
    archetype: 'wanderer',
    nextRanks: [
      { target: '평민', archetype: 'wanderer', ceremony: '마을 호적 등록', ceremonyType: 'charter', minGold: 10, minPrestigeOrPiety: 10, minEstateLevel: 1, superiorTrustReq: 30, lore: '떠돌이 신세를 청산하고 마을에 정착하여 평민으로 거듭납니다.' },
      { target: '소작농', archetype: 'wanderer', ceremony: '장원 경작 계약', ceremonyType: 'charter', minGold: 5, minPrestigeOrPiety: 5, minEstateLevel: 1, superiorTrustReq: 25, lore: '영주나 장원 관리인과 소작 계약을 맺고 땅을 일굽니다.' }
    ]
  },
  '소작농': {
    tier: 1,
    archetype: 'wanderer',
    nextRanks: [
      { target: '평민', archetype: 'wanderer', ceremony: '지대 면제 및 자영농 공인', ceremonyType: 'charter', minGold: 25, minPrestigeOrPiety: 20, minEstateLevel: 1, superiorTrustReq: 40, lore: '빚을 청산하고 독립 자영농이자 자유민으로 신분을 상승시킵니다.' },
      { target: '도제', archetype: 'wanderer', ceremony: '공방 입회식', ceremonyType: 'charter', minGold: 20, minPrestigeOrPiety: 15, minEstateLevel: 1, superiorTrustReq: 35, lore: '장인의 공방에 도제로 들어가 기술을 배웁니다.' }
    ]
  },
  '평민': {
    tier: 1,
    archetype: 'wanderer',
    nextRanks: [
      { target: '용병', archetype: 'wanderer', ceremony: '용병대 무구 계약', ceremonyType: 'charter', minGold: 30, minPrestigeOrPiety: 25, minEstateLevel: 1, superiorTrustReq: 30, lore: '무기를 갖추고 전투에 참전하는 용병으로 전업합니다.' },
      { target: '학사', archetype: 'wanderer', ceremony: '수도원/대학 입학 및 학사 서임', ceremonyType: 'charter', minGold: 40, minPrestigeOrPiety: 35, minEstateLevel: 1, superiorTrustReq: 45, lore: '학문을 닦아 학술과 행정을 다루는 학사로 진출합니다.' },
      { target: '평신도', archetype: 'clergy', ceremony: '교구 정식 신자 입교', ceremonyType: 'investiture', minGold: 20, minPrestigeOrPiety: 30, minEstateLevel: 1, superiorTrustReq: 40, lore: '세속 생활을 뒤로하고 교단에 헌신하는 신앙인의 길을 걷습니다.' }
    ]
  },
  '도제': {
    tier: 2,
    archetype: 'wanderer',
    nextRanks: [
      { target: '장인', archetype: 'wanderer', ceremony: '길드 마스터피스(걸작) 공인식', ceremonyType: 'charter', minGold: 60, minPrestigeOrPiety: 40, minEstateLevel: 1, superiorTrustReq: 50, lore: '독자적인 공방을 열 수 있는 정식 장인(Meister)으로 승격합니다.' }
    ]
  },
  '용병': {
    tier: 2,
    archetype: 'wanderer',
    nextRanks: [
      { target: '방랑 검사', archetype: 'wanderer', ceremony: '무예 칭호 수여', ceremonyType: 'charter', minGold: 50, minPrestigeOrPiety: 45, minEstateLevel: 1, superiorTrustReq: 40, lore: '일선 졸병을 넘어 독보적인 검술을 지닌 방랑 무인으로 이름을 떨칩니다.' },
      { target: '용병대장', archetype: 'company', ceremony: '용병단 창설 선언', ceremonyType: 'charter', minGold: 80, minPrestigeOrPiety: 50, minEstateLevel: 2, superiorTrustReq: 45, lore: '동료들을 규합하여 깃발을 올리고 정식 용병대장으로 출범합니다.' }
    ]
  },
  '학사': {
    tier: 2,
    archetype: 'wanderer',
    nextRanks: [
      { target: '장원 관리인', archetype: 'company', ceremony: '영주 장원 집사장 임명', ceremonyType: 'enfeoffment', minGold: 60, minPrestigeOrPiety: 50, minEstateLevel: 2, superiorTrustReq: 60, lore: '학식과 회계 능력을 인정받아 영주의 대리인으로 장원을 총괄합니다.' },
      { target: '수사', archetype: 'clergy', ceremony: '수도회 정식 입회 및 삭발례', ceremonyType: 'investiture', minGold: 30, minPrestigeOrPiety: 50, minEstateLevel: 1, superiorTrustReq: 55, lore: '수도원에 입회하여 수도서약을 바치고 수사가 됩니다.' }
    ]
  },
  '음유시인': {
    tier: 2,
    archetype: 'wanderer',
    nextRanks: [
      { target: '방랑 검사', archetype: 'wanderer', ceremony: '명검 수여식', ceremonyType: 'charter', minGold: 60, minPrestigeOrPiety: 55, minEstateLevel: 1, superiorTrustReq: 45, lore: '노래와 검을 함께 다루는 낭만적 무인으로 승격합니다.' },
      { target: '기사', archetype: 'noble', ceremony: '영주 궁정 기사 서임식 (Knighting)', ceremonyType: 'knighting', minGold: 100, minPrestigeOrPiety: 70, minEstateLevel: 2, superiorTrustReq: 65, lore: '귀족 영주의 눈에 띄어 정식 기사(Knight)로 서임받아 귀족 반열에 오릅니다.' }
    ]
  },
  '장인': {
    tier: 3,
    archetype: 'wanderer',
    nextRanks: [
      { target: '상단주', archetype: 'company', ceremony: '대상단 결성식', ceremonyType: 'charter', minGold: 120, minPrestigeOrPiety: 60, minEstateLevel: 2, superiorTrustReq: 55, lore: '생산을 넘어 무역 유통망을 쥐고 대규모 상단을 이끕니다.' },
      { target: '길드마스터', archetype: 'company', ceremony: '도시 상공업 길드장 추대식', ceremonyType: 'charter', minGold: 150, minPrestigeOrPiety: 65, minEstateLevel: 2, superiorTrustReq: 60, lore: '도시 길드의 최고 수장으로 추대되어 막강한 상권을 장악합니다.' }
    ]
  },
  '방랑 검사': {
    tier: 3,
    archetype: 'wanderer',
    nextRanks: [
      { target: '기사', archetype: 'noble', ceremony: '봉건 영주 기사 서임식 (Knighting)', ceremonyType: 'knighting', minGold: 120, minPrestigeOrPiety: 75, minEstateLevel: 2, superiorTrustReq: 65, lore: '주군 영주에게 충성 서약을 맹세하고 정식 식읍 기사로 서임받아 귀족이 됩니다.' },
      { target: '용병대장', archetype: 'company', ceremony: '자유 용병 연대 결성', ceremonyType: 'charter', minGold: 100, minPrestigeOrPiety: 60, minEstateLevel: 2, superiorTrustReq: 50, lore: '자신의 무용에 모여든 전사들을 이끌고 독립 용병 연대를 지휘합니다.' }
    ]
  },

  // 2. 소규모 집단 및 용병/상단 (6종)
  '도적단 두목': {
    tier: 1,
    archetype: 'company',
    nextRanks: [
      { target: '용병대장', archetype: 'company', ceremony: '영주 사면령 및 용병대 정규화', ceremonyType: 'charter', minGold: 80, minPrestigeOrPiety: 40, minEstateLevel: 2, superiorTrustReq: 50, lore: '산적 무리를 정규 사설 용병대로 전환하고 합법적 지위를 획득합니다.' }
    ]
  },
  '촌장': {
    tier: 2,
    archetype: 'company',
    nextRanks: [
      { target: '장원 관리인', archetype: 'company', ceremony: '영주 장원 총집사 임명', ceremonyType: 'enfeoffment', minGold: 80, minPrestigeOrPiety: 50, minEstateLevel: 2, superiorTrustReq: 60, lore: '단일 마을을 넘어 영주의 직할 장원 전체를 총괄하는 관리인으로 영전합니다.' }
    ]
  },
  '장원 관리인': {
    tier: 3,
    archetype: 'company',
    nextRanks: [
      { target: '남작', archetype: 'noble', ceremony: '황제/국왕 봉토 수봉 칙서 (Enfeoffment)', ceremonyType: 'enfeoffment', minGold: 200, minPrestigeOrPiety: 75, minEstateLevel: 3, superiorTrustReq: 70, lore: '장원 관리를 통해 축적한 세력과 공로로 정식 남작(Baron)으로 분봉받습니다.' }
    ]
  },
  '용병대장': {
    tier: 3,
    archetype: 'company',
    nextRanks: [
      { target: '기사', archetype: 'noble', ceremony: '국왕 친위 기사 서임', ceremonyType: 'knighting', minGold: 120, minPrestigeOrPiety: 70, minEstateLevel: 2, superiorTrustReq: 60, lore: '용병단을 이끌어 세운 군공으로 국왕이나 공작의 정식 가신 기사로 입적합니다.' },
      { target: '남작', archetype: 'noble', ceremony: '폐성 점거 및 봉토 공인 (Enfeoffment)', ceremonyType: 'enfeoffment', minGold: 220, minPrestigeOrPiety: 80, minEstateLevel: 3, superiorTrustReq: 65, lore: '군사력으로 성채를 확보하고 주군 제후에게 충성을 맹세하여 정식 남작령을 영유합니다.' }
    ]
  },
  '상단주': {
    tier: 3,
    archetype: 'company',
    nextRanks: [
      { target: '길드마스터', archetype: 'company', ceremony: '상인 대길드 총회장 취임', ceremonyType: 'charter', minGold: 180, minPrestigeOrPiety: 70, minEstateLevel: 2, superiorTrustReq: 65, lore: '권역 내 모든 상단을 아우르는 최고 길드마스터로 등극합니다.' }
    ]
  },
  '길드마스터': {
    tier: 4,
    archetype: 'company',
    nextRanks: [
      { target: '남작', archetype: 'noble', ceremony: '영지 매입 및 자유도시 참사관 서임', ceremonyType: 'enfeoffment', minGold: 280, minPrestigeOrPiety: 85, minEstateLevel: 3, superiorTrustReq: 70, lore: '재정 파탄에 빠진 제후의 영지를 매입하거나 특허장을 얻어 남작 지위를 획득합니다.' }
    ]
  },

  // 3. 성직자 및 수도자 (7종)
  '평신도': {
    tier: 1,
    archetype: 'clergy',
    nextRanks: [
      { target: '수사', archetype: 'clergy', ceremony: '수도원 입회 서약식 (Monastic Vow)', ceremonyType: 'investiture', minGold: 20, minPrestigeOrPiety: 35, minEstateLevel: 1, superiorTrustReq: 40, lore: '세속을 떠나 수도회에 입회하고 청빈·정결·순명의 서약을 바칩니다.' }
    ]
  },
  '수사': {
    tier: 2,
    archetype: 'clergy',
    nextRanks: [
      { target: '사제', archetype: 'clergy', ceremony: '교구 주교 사제 서품식 (Ordination)', ceremonyType: 'investiture', minGold: 40, minPrestigeOrPiety: 50, minEstateLevel: 1, superiorTrustReq: 55, lore: '주교의 안수를 받아 거룩한 성체성사를 집전하는 주임 사제로 서품됩니다.' }
    ]
  },
  '사제': {
    tier: 3,
    archetype: 'clergy',
    nextRanks: [
      { target: '수도원장', archetype: 'clergy', ceremony: '수도원 참사회 수도원장 선출 (Abbot)', ceremonyType: 'investiture', minGold: 100, minPrestigeOrPiety: 70, minEstateLevel: 2, superiorTrustReq: 65, lore: '수도원 총회의 추대를 받아 장원과 수도자들을 관할하는 대수도원장에 취임합니다.' },
      { target: '주교', archetype: 'clergy', ceremony: '교황청 주교 서임 칙서 (Episcopal Consecration)', ceremonyType: 'investiture', minGold: 150, minPrestigeOrPiety: 80, minEstateLevel: 2, superiorTrustReq: 70, lore: '탁월한 목회와 유력 후원자들의 천거로 교구의 최고 목자인 주교로 서임됩니다.' }
    ]
  },
  '수도원장': {
    tier: 4,
    archetype: 'clergy',
    nextRanks: [
      { target: '주교', archetype: 'clergy', ceremony: '교황 칙령 주교 성별식 (Bishop Consecration)', ceremonyType: 'investiture', minGold: 160, minPrestigeOrPiety: 85, minEstateLevel: 3, superiorTrustReq: 75, lore: '교황청 칙령을 통해 주교좌 성당을 관할하는 교구장 주교로 승품됩니다.' }
    ]
  },
  '주교': {
    tier: 5,
    archetype: 'clergy',
    nextRanks: [
      { target: '대주교', archetype: 'clergy', ceremony: '팔리움(Pallium) 수여 및 대주교 착좌식', ceremonyType: 'investiture', minGold: 250, minPrestigeOrPiety: 90, minEstateLevel: 3, superiorTrustReq: 80, lore: '교황으로부터 팔리움을 수여받고 관구 전체를 총괄하는 대주교(추기경급)로 착좌합니다.' }
    ]
  },
  '대주교': {
    tier: 6,
    archetype: 'clergy',
    nextRanks: [
      { target: '교황', archetype: 'clergy', ceremony: '바티칸 콘클라베(Conclave) 교황 선출', ceremonyType: 'conclave', minGold: 350, minPrestigeOrPiety: 95, minEstateLevel: 4, superiorTrustReq: 85, lore: '추기경단의 콘클라베 비밀 투표에서 2/3 이상의 지지를 얻어 성 베드로의 후계자, 교황으로 즉위합니다.' }
    ]
  },
  '교황': {
    tier: 7,
    archetype: 'clergy',
    nextRanks: [] // 최고위 정점
  },

  // 4. 봉건 영주 및 귀족 (7종)
  '기사': {
    tier: 1,
    archetype: 'noble',
    nextRanks: [
      { target: '남작', archetype: 'noble', ceremony: '주군 제후 남작령 분봉식 (Barony Enfeoffment)', ceremonyType: 'enfeoffment', minGold: 150, minPrestigeOrPiety: 65, minEstateLevel: 2, superiorTrustReq: 65, lore: '단일 성채와 장원 백성들을 공식 하사받아 정식 봉건 남작으로 등극합니다.' }
    ]
  },
  '남작': {
    tier: 2,
    archetype: 'noble',
    nextRanks: [
      { target: '자작', archetype: 'noble', ceremony: '백작령 부영주/자작 임명 칙서', ceremonyType: 'enfeoffment', minGold: 220, minPrestigeOrPiety: 75, minEstateLevel: 3, superiorTrustReq: 70, lore: '백작의 직속 대리인이자 주요 성채군을 영유하는 자작(Viscount)으로 승격합니다.' }
    ]
  },
  '자작': {
    tier: 3,
    archetype: 'noble',
    nextRanks: [
      { target: '백작', archetype: 'noble', ceremony: '국왕 칙허 백작령(County) 수봉식', ceremonyType: 'enfeoffment', minGold: 300, minPrestigeOrPiety: 85, minEstateLevel: 3, superiorTrustReq: 75, lore: '하나의 주(County) 전체를 관할하는 실력파 봉건 백작으로 영지를 확장합니다.' }
    ]
  },
  '백작': {
    tier: 4,
    archetype: 'noble',
    nextRanks: [
      { target: '후작', archetype: 'noble', ceremony: '국경 변경백(Margrave) 군권 칙허식', ceremonyType: 'enfeoffment', minGold: 380, minPrestigeOrPiety: 90, minEstateLevel: 4, superiorTrustReq: 80, lore: '국경 지대의 막강한 군사권을 위임받아 변경백(Marquis)으로 승격합니다.' }
    ]
  },
  '후작': {
    tier: 5,
    archetype: 'noble',
    nextRanks: [
      { target: '공작', archetype: 'noble', ceremony: '대공국 승격 및 공작관 착용식 (Ducal Coronation)', ceremonyType: 'enfeoffment', minGold: 480, minPrestigeOrPiety: 95, minEstateLevel: 4, superiorTrustReq: 85, lore: '여러 백작 가문을 거느린 최고위 대제후, 공작(Duke)으로 등극합니다.' }
    ]
  },
  '공작': {
    tier: 6,
    archetype: 'noble',
    nextRanks: [
      { target: '황제', archetype: 'noble', ceremony: '제국 대관식 (Imperial Coronation)', ceremonyType: 'conclave', minGold: 600, minPrestigeOrPiety: 100, minEstateLevel: 5, superiorTrustReq: 90, lore: '선제후 회의 추대 또는 교황의 황제관 대관을 통해 신성 제국의 최고 주권자로 즉위합니다.' }
    ]
  },
  '황제': {
    tier: 7,
    archetype: 'noble',
    nextRanks: [] // 최고위 정점
  }
};

/**
 * 플레이어의 현재 신분을 바탕으로 신분 승격 가능성을 평가합니다.
 */
export function checkStatusPromotion(gameState: ParsedState): PromotionStatusReport {
  const rawStatus = gameState.personalInfo?.['신분'] || gameState.personalInfo?.['직위'] || '평민';
  const cleanStatus = rawStatus.split('/')[0].split('(')[0].trim();

  const resources = parseCKResources(gameState);
  
  // 1. 화폐/자금 수치 추출
  let playerGold = 0;
  if (resources.gold) {
    playerGold = extractNumericValue(resources.gold);
  }
  if (gameState.inventory?.wealth) {
    gameState.inventory.wealth.forEach(w => {
      const v = extractNumericValue(w);
      if (v > playerGold) playerGold = v;
    });
  }
  if ((gameState.inventory as any)?.['재산및병력']) {
    const rawInv = (gameState.inventory as any)['재산및병력'];
    if (Array.isArray(rawInv)) {
      rawInv.forEach((w: string) => {
        const v = extractNumericValue(w);
        if (v > playerGold) playerGold = v;
      });
    }
  }

  // 2. 명성 / 위신 수치 추출
  let playerPrestige = 30;
  const rawPrestige = gameState.stats?.acquired?.['명성'] || gameState.personalInfo?.['명성'];
  if (rawPrestige) {
    playerPrestige = extractNumericValue(rawPrestige);
  } else {
    const attr = calculateCKAttributes(gameState);
    playerPrestige = Math.min(100, Math.round(attr.diplomacy.value * 2.0 + attr.martial.value * 1.5 + attr.prowess.value * 1.5));
  }
  const prestigeTrait = gameState.traits?.find(t => t.name.includes('명성') || t.name.includes('위신') || t.name.includes('영웅'));
  if (prestigeTrait) {
    playerPrestige = Math.min(100, playerPrestige + 25);
  }

  // 3. 신앙 / 경건 수치 추출
  let playerPiety = 30;
  const pietyStatus = gameState.playerStatus?.find(s => s.name.includes('신앙') || s.name.includes('경건'));
  if (pietyStatus) {
    playerPiety = extractNumericValue(pietyStatus.value);
  } else {
    const attr = calculateCKAttributes(gameState);
    playerPiety = Math.min(100, Math.round(attr.learning.value * 3.5));
  }
  const pietyTrait = gameState.traits?.find(t => t.name.includes('신앙') || t.name.includes('성직') || t.name.includes('독실') || t.name.includes('순례'));
  if (pietyTrait) {
    playerPiety = Math.min(100, playerPiety + 25);
  }

  // 거점 레벨 추출
  let estateLevel = 1;
  if (gameState.estate?.level) {
    const lvMatch = gameState.estate.level.match(/(?:Lv\.?|레벨)\s*(\d+)/i);
    if (lvMatch) estateLevel = parseInt(lvMatch[1], 10);
  }

  // 상급자/후원자 최고 신뢰도 추출
  let maxSuperiorTrust = 30; // 기본값
  if (gameState.relationships?.personal) {
    gameState.relationships.personal.forEach(rel => {
      const parts = rel.split('|').map(s => s.trim());
      const rawRelDesc = parts[3] || '';
      const rawTrust = parts[1] || '';

      const isNotSuperior = rawRelDesc.includes('[동료]') || rawRelDesc.includes('[직속부하]') || rawRelDesc.includes('[가신]') || rawRelDesc.includes('[적대]');
      const isSuperior = !isNotSuperior && (
        rawRelDesc.includes('[상급자]') || rawRelDesc.includes('[후원자]') ||
        rawRelDesc.includes('상급자') || rawRelDesc.includes('후원자') ||
        (rawRelDesc.includes('주교') && !rawRelDesc.includes('주교좌')) ||
        rawRelDesc.includes('교구장') || rawRelDesc.includes('대주교') || rawRelDesc.includes('교황') ||
        rawRelDesc.includes('주군') || rawRelDesc.includes('국왕') || rawRelDesc.includes('황제') || rawRelDesc.includes('촌장')
      );
      if (isSuperior) {
        const trustM = rawTrust.match(/신뢰도\s*\[?(\d+)\]?/);
        if (trustM) {
          const val = parseInt(trustM[1], 10);
          if (val > maxSuperiorTrust) maxSuperiorTrust = val;
        }
      }
    });
  }

  const ladderInfo = STATUS_LADDER[cleanStatus] || STATUS_LADDER['평민'];
  
  // 현재 신분 티어에 따른 기본 입지 가산 (고위직일수록 기본 입지와 신망 반영)
  const tierBonus = (ladderInfo.tier || 0) * 8;
  playerPrestige = Math.min(100, playerPrestige + tierBonus);
  playerPiety = Math.min(100, playerPiety + tierBonus);

  const possibleTargets: PromotionTarget[] = [];

  ladderInfo.nextRanks.forEach(next => {
    // 성직자는 신앙도 우선, 나머지는 명성 우선
    const testScore = next.archetype === 'clergy' ? Math.max(playerPiety, playerPrestige) : Math.max(playerPrestige, playerPiety);
    const scoreLabel = next.archetype === 'clergy' ? '신앙심' : '명성 및 위신';

    const reqs: PromotionRequirement[] = [
      {
        id: 'gold',
        label: `${resources.labels?.goldLabel || '자금'} 보유고`,
        current: playerGold,
        target: next.minGold,
        met: playerGold >= next.minGold,
        desc: `승격 공납금 및 의식 기금 (${playerGold} / ${next.minGold})`
      },
      {
        id: 'reputation',
        label: scoreLabel,
        current: testScore,
        target: next.minPrestigeOrPiety,
        met: testScore >= next.minPrestigeOrPiety,
        desc: `사회적 신망 및 입지 (${testScore} / ${next.minPrestigeOrPiety})`
      },
      {
        id: 'estate',
        label: '거점 및 기반 규모',
        current: `Lv.${estateLevel}`,
        target: `Lv.${next.minEstateLevel}`,
        met: estateLevel >= next.minEstateLevel,
        desc: `거점 인프라 (${estateLevel} / ${next.minEstateLevel})`
      },
      {
        id: 'superior',
        label: '상급자/후원자 승인',
        current: maxSuperiorTrust,
        target: next.superiorTrustReq,
        met: maxSuperiorTrust >= next.superiorTrustReq,
        desc: `상관 신뢰도 (${maxSuperiorTrust} / ${next.superiorTrustReq})`
      }
    ];

    const metCount = reqs.filter(r => r.met).length;
    const progressPercent = Math.round((metCount / reqs.length) * 100);
    const canPromote = metCount === reqs.length;

    possibleTargets.push({
      targetRank: next.target,
      targetArchetype: next.archetype,
      ceremonyName: next.ceremony,
      ceremonyType: next.ceremonyType,
      historicalLore: next.lore,
      requirements: reqs,
      canPromote,
      progressPercent
    });
  });

  const bestTarget = possibleTargets.sort((a, b) => (b.canPromote ? 1 : 0) - (a.canPromote ? 1 : 0) || b.progressPercent - a.progressPercent)[0];
  const overallCanPromote = possibleTargets.some(t => t.canPromote);

  return {
    currentRank: cleanStatus,
    currentTier: ladderInfo.tier,
    archetype: ladderInfo.archetype,
    possibleTargets,
    overallCanPromote,
    bestTarget
  };
}
