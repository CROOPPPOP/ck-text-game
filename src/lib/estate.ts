import { ESTATE_LEVELS } from './estateTheme';
import { mergeAndDeduplicateFactionRelations } from './factionRelations';
import { normalizeParsedState } from './parser';

export interface Building {
  name: string;
  desc?: string;
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
 * factionStats 객체에서 치안/민심/개발도 수치를 한국어/영문 키 모두 대응하여 안전하게 추출합니다.
 */
export function getFactionMetric(stats: any, metric: 'order' | 'sentiment' | 'dev'): string {
  if (!stats) return '';
  if (metric === 'order') {
    return stats.publicOrder || stats['치안'] || stats['치안 상태'] || stats['치안상태'] || '';
  }
  if (metric === 'sentiment') {
    return stats.publicSentiment || stats['민심'] || stats['민심 상태'] || stats['민심상태'] || '';
  }
  if (metric === 'dev') {
    return stats.development || stats['개발도'] || stats['영지 개발도'] || stats['영지개발도'] || '';
  }
  return '';
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
  const currentLevelSum = buildings.reduce((sum, b) => sum + Math.max(1, b?.level || 1), 0);
  if (currentLevelSum < requiredLevelSum) {
    reasons.push(`건물 레벨 합 부족 (현재: ${currentLevelSum}, 필요: ${requiredLevelSum})`);
  }

  // 3. 태그 다양성: ≥ min(N + 1, 4)종
  const requiredTagCount = Math.min(currentEstateLevel + 1, 4);
  const uniqueTags = new Set<string>();
  buildings.forEach(b => (b?.tags || []).forEach(t => uniqueTags.add(t)));
  if (uniqueTags.size < requiredTagCount) {
    reasons.push(`건물 효과 태그 다양성 부족 (현재: ${uniqueTags.size}종, 필요: ${requiredTagCount}종)`);
  }

  // 세력 수치 조건 (세력 상태가 활성일 때만)
  if (isFactionActive && factionStats) {
    const orderVal = getFactionMetric(factionStats, 'order');
    const sentimentVal = getFactionMetric(factionStats, 'sentiment');
    const devVal = getFactionMetric(factionStats, 'dev');

    const badKeywords = ['나쁨', '불안', '낮음', '악화', '위험', '폭동', '파탄', '혼란', '반란'];
    const isGood = (val?: string) => {
      if (!val) return true; // 값이 없으면 기본 양호로 간주
      return badKeywords.every(k => !val.includes(k));
    };

    if (nextLevel >= 3) {
      // 치안과 민심이 모두 '보통' 이상
      if (!isGood(orderVal)) reasons.push(`치안 상태가 '보통' 이상이어야 합니다. (현재: ${orderVal || '보통'})`);
      if (!isGood(sentimentVal)) reasons.push(`민심 상태가 '보통' 이상이어야 합니다. (현재: ${sentimentVal || '보통'})`);
    }
    
    if (nextLevel >= 4) {
      // 개발도 '높음' 이상
      const highKeywords = ['높음', '우수', '매우', '번영', '발달', '전성'];
      const isHigh = (val?: string) => {
        if (!val) return true; // 값이 없으면 기본 통과
        return highKeywords.some(k => val.includes(k));
      };
      if (!isHigh(devVal)) reasons.push(`개발도가 '높음' 이상이어야 합니다. (현재: ${devVal || '보통'})`);
    }
  }

  return {
    canPromote: reasons.length === 0,
    reasons
  };
}

export interface PromotionRequirementDetail {
  label: string;
  current: number;
  required: number;
  met: boolean;
  desc: string;
}

export interface EstatePromotionMilestone {
  currentLevel: number;
  currentTitle: string;
  nextLevel: number;
  nextTitle: string;
  isMaxLevel: boolean;
  canPromote: boolean;
  overallProgressPercent: number;
  buildingCount: PromotionRequirementDetail;
  levelSum: PromotionRequirementDetail;
  tagDiversity: PromotionRequirementDetail & {
    existingTags: string[];
    missingSuggestedTags: string[];
  };
  factionRequirements?: {
    publicOrder?: { current: string; met: boolean; required: string };
    publicSentiment?: { current: string; met: boolean; required: string };
    development?: { current: string; met: boolean; required: string };
    allMet: boolean;
  };
  actionTips: string[];
}

/**
 * 거점 대시보드에서 승격에 필요한 건물 수, 레벨 합, 기능 태그 다양성 및 달성 팁을 산출합니다.
 */
export function getEstatePromotionMilestones(
  currentEstateLevel: number,
  buildings: Building[] = [],
  archetype: any = 'noble',
  factionStats?: FactionStats,
  isFactionActive: boolean = false
): EstatePromotionMilestone {
  const safeCurrentLevel = Math.max(1, Math.min(5, typeof currentEstateLevel === 'number' ? currentEstateLevel : 1));
  const isMaxLevel = safeCurrentLevel >= 5;
  const nextLevel = Math.min(5, safeCurrentLevel + 1);

  const getThemeTitle = (lvl: number) => {
    const entry = ESTATE_LEVELS[lvl as keyof typeof ESTATE_LEVELS];
    if (!entry) return `Lv.${lvl} 거점`;
    if (archetype === 'clergy') return `Lv.${lvl} ${entry.parish}`;
    if (archetype === 'company' || archetype === 'wanderer') return `Lv.${lvl} ${entry.camp}`;
    return `Lv.${lvl} ${entry.manor}`;
  };

  const currentTitle = getThemeTitle(safeCurrentLevel);
  const nextTitle = isMaxLevel ? '최대 규모 도달' : getThemeTitle(nextLevel);

  if (isMaxLevel) {
    return {
      currentLevel: safeCurrentLevel,
      currentTitle,
      nextLevel: 5,
      nextTitle,
      isMaxLevel: true,
      canPromote: false,
      overallProgressPercent: 100,
      buildingCount: { label: '보유 시설 수', current: buildings.length, required: buildings.length, met: true, desc: '최대 수용 규모 도달' },
      levelSum: { label: '시설 레벨 합계', current: buildings.reduce((s, b) => s + (b.level || 1), 0), required: 0, met: true, desc: '최고 번영 거점' },
      tagDiversity: { label: '기능 태그 다양성', current: 4, required: 4, met: true, desc: '완벽한 다원 인프라', existingTags: [], missingSuggestedTags: [] },
      actionTips: ['이미 당대 최고위 거점에 도달했습니다. 더 이상의 거점 승격은 필요하지 않습니다.']
    };
  }

  // 1. 보유 건물 수
  const requiredBuildings = nextLevel + 1;
  const currentBuildings = buildings.length;
  const buildingMet = currentBuildings >= requiredBuildings;

  // 2. 건물 레벨 합
  const requiredLevelSum = safeCurrentLevel * 3;
  const currentLevelSum = buildings.reduce((sum, b) => sum + Math.max(1, b.level || 1), 0);
  const levelSumMet = currentLevelSum >= requiredLevelSum;

  // 3. 태그 다양성
  const requiredTagCount = Math.min(safeCurrentLevel + 1, 4);
  const uniqueTags = new Set<string>();
  buildings.forEach(b => (b.tags || []).forEach(t => uniqueTags.add(t)));
  const existingTags = Array.from(uniqueTags);
  const tagMet = existingTags.length >= requiredTagCount;

  // 결여된 추천 태그 선별
  const coreTagPool = ['생산', '군사', '치안', '행정', '신앙', '민생'];
  const missingSuggestedTags = coreTagPool.filter(t => !existingTags.some(et => et.includes(t))).slice(0, 3);

  // 4. 세력 조건 (활성 시)
  let factionAllMet = true;
  let factionReqs = undefined;
  if (isFactionActive && factionStats) {
    const orderVal = getFactionMetric(factionStats, 'order');
    const sentimentVal = getFactionMetric(factionStats, 'sentiment');
    const devVal = getFactionMetric(factionStats, 'dev');

    const badKeywords = ['나쁨', '불안', '낮음', '악화', '위험', '폭동', '파탄', '혼란', '반란'];
    const isGood = (val?: string) => val ? badKeywords.every(k => !val.includes(k)) : true;

    const poMet = nextLevel >= 3 ? isGood(orderVal) : true;
    const psMet = nextLevel >= 3 ? isGood(sentimentVal) : true;
    const devMet = nextLevel >= 4 ? ['높음', '우수', '매우', '번영', '발달', '전성'].some(k => devVal.includes(k)) : true;

    factionAllMet = poMet && psMet && devMet;
    factionReqs = {
      publicOrder: nextLevel >= 3 ? { current: orderVal || '보통', met: poMet, required: '보통 이상' } : undefined,
      publicSentiment: nextLevel >= 3 ? { current: sentimentVal || '보통', met: psMet, required: '보통 이상' } : undefined,
      development: nextLevel >= 4 ? { current: devVal || '보통', met: devMet, required: '높음 이상' } : undefined,
      allMet: factionAllMet
    };
  }

  // 5. 달성율 계산
  const totalChecks = 3 + (isFactionActive ? 1 : 0);
  let passedChecks = (buildingMet ? 1 : 0) + (levelSumMet ? 1 : 0) + (tagMet ? 1 : 0);
  if (isFactionActive) passedChecks += (factionAllMet ? 1 : 0);
  const overallProgressPercent = Math.round((passedChecks / totalChecks) * 100);

  const canPromote = buildingMet && levelSumMet && tagMet && factionAllMet;

  // 6. 구체적인 액션 조언 팁 도출
  const actionTips: string[] = [];
  if (!buildingMet) {
    actionTips.push(`시설 수 부족: 신규 시설 ${requiredBuildings - currentBuildings}동을 추가 건설해야 합니다.`);
  }
  if (!levelSumMet) {
    actionTips.push(`시설 등급 합 부족: 기존 건물을 증축하여 레벨 합계를 최소 ${requiredLevelSum - currentLevelSum} 더 올려야 합니다.`);
  }
  if (!tagMet) {
    actionTips.push(`기능 다양성 부족: [${missingSuggestedTags.join(', ')}] 계열의 신규 시설을 건설하여 거점 기능을 다변화하세요.`);
  }
  if (isFactionActive && !factionAllMet) {
    actionTips.push(`세력 안정도 부족: 거점의 치안과 민심을 안정시키고 영지 개발도를 높여야 합니다.`);
  }
  if (canPromote) {
    actionTips.push(`모든 건축 및 영지 조건 충족 완료! 하단의 [⭐ 거점 승격 공사]를 착수하여 거점을 확장하세요.`);
  }

  return {
    currentLevel: safeCurrentLevel,
    currentTitle,
    nextLevel,
    nextTitle,
    isMaxLevel: false,
    canPromote,
    overallProgressPercent,
    buildingCount: {
      label: '보유 시설 수',
      current: currentBuildings,
      required: requiredBuildings,
      met: buildingMet,
      desc: `${currentBuildings}동 / 필요 ${requiredBuildings}동 (${buildingMet ? '충족' : `${requiredBuildings - currentBuildings}동 부족`})`
    },
    levelSum: {
      label: '시설 레벨 총합',
      current: currentLevelSum,
      required: requiredLevelSum,
      met: levelSumMet,
      desc: `합계 ${currentLevelSum} / 필요 ${requiredLevelSum} (${levelSumMet ? '충족' : `${requiredLevelSum - currentLevelSum} 부족`})`
    },
    tagDiversity: {
      label: '기능 태그 다양성',
      current: existingTags.length,
      required: requiredTagCount,
      met: tagMet,
      desc: `${existingTags.length}종 / 필요 ${requiredTagCount}종 (${tagMet ? '충족' : `${requiredTagCount - existingTags.length}종 부족`})`,
      existingTags,
      missingSuggestedTags
    },
    factionRequirements: factionReqs,
    actionTips
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
  buildings: Building[] = [],
  archetype: PlayerArchetype = 'noble',
  stewardshipScore: number = 10
): UpgradeCandidate[] {
  const safeBuildings = Array.isArray(buildings) ? buildings : [];
  const maxBuildingLevel = ESTATE_LEVELS[currentEstateLevel as keyof typeof ESTATE_LEVELS]?.maxBuildingLevel || 1;
  
  return safeBuildings
    .filter(b => b && typeof b.level === 'number' && b.level < maxBuildingLevel)
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

/**
 * 건물 목록을 안전하게 병합합니다.
 * 1) 이전 턴(prevBuildings)에 이미 달성된 레벨은 AI가 이번 턴에 Lv 표기를 누락했더라도 절대 다운그레이드(초기화)되지 않도록 보존합니다.
 * 2) 이번 턴에 완공된 건설 큐 항목(completedQueueItems)의 목표 레벨(targetLevel)을 확정 반영합니다.
 * 3) 새로운 설명(desc)이나 효과 태그(tags)는 최신 AI 서사를 우선 반영합니다.
 */
export function mergeEstateBuildings(
  prevBuildings: Building[] = [],
  newBuildings: Building[] = [],
  completedQueueItems: Array<{ building: string; targetLevel?: number; tags?: string[]; desc?: string }> = []
): Building[] {
  const getCleanKey = (name: string) => 
    (name || '')
      .replace(/\s*업그레이드.*$/i, '')
      .replace(/[\(\[\{]?(?:Lv\.?|레벨)\s*\d+.*$/i, '')
      .replace(/^[\[\{]+|[\]\}]+$/g, '')
      .replace(/\s+/g, '')
      .trim();

  const targetLevelMap = new Map<string, { targetLevel: number; tags?: string[]; desc?: string }>();
  (completedQueueItems || []).forEach(q => {
    if (!q || !q.building) return;
    const k = getCleanKey(q.building);
    if (k && q.targetLevel) {
      targetLevelMap.set(k, { targetLevel: q.targetLevel, tags: q.tags, desc: q.desc });
    }
  });

  const prevMap = new Map<string, Building>();
  (prevBuildings || []).forEach(b => {
    if (!b || !b.name) return;
    const k = getCleanKey(b.name);
    if (k) {
      prevMap.set(k, b);
    }
  });

  const mergedList: Building[] = [];
  const visitedKeys = new Set<string>();

  (newBuildings || []).forEach(newB => {
    if (!newB || !newB.name) return;
    const k = getCleanKey(newB.name);
    visitedKeys.add(k);

    const prevB = prevMap.get(k);
    const queuedTarget = targetLevelMap.get(k);

    let finalLevel = Math.max(1, typeof newB.level === 'number' ? newB.level : 1);

    // 1. 이전 턴에 이미 달성된 레벨이 더 높다면 다운그레이드 방어 (AI Lv 표기 누락 완벽 보호)
    if (prevB && typeof prevB.level === 'number' && prevB.level > finalLevel) {
      finalLevel = prevB.level;
    }

    // 2. 이번 턴에 완공된 큐 항목의 목표 레벨이 있다면 승격 확정 반영
    if (queuedTarget && queuedTarget.targetLevel > finalLevel) {
      finalLevel = queuedTarget.targetLevel;
    }

    // 3. '장원 올리브 압착장'의 경우 2레벨 서사(신형 나선식, 2배 등)가 있거나 이전 레벨이 2였으면 Lv.2 확정 보장
    if (k.includes('올리브압착장') || k.includes('올리브')) {
      const descText = `${newB.desc || ''} ${prevB?.desc || ''} ${queuedTarget?.desc || ''}`;
      if (prevB?.level === 2 || /신형|나선식|2배|납품|압착기가동/.test(descText)) {
        finalLevel = Math.max(finalLevel, 2);
      }
    }

    // 태그 보존 및 최신화
    const finalTags = (newB.tags && newB.tags.length > 0)
      ? newB.tags
      : (prevB?.tags && prevB.tags.length > 0 ? prevB.tags : (queuedTarget?.tags || ['수익', '산업', '생산']));

    mergedList.push({
      name: newB.name,
      desc: newB.desc || prevB?.desc || queuedTarget?.desc || '',
      level: finalLevel,
      tags: finalTags
    });
  });

  // 이전 턴에 있었으나 AI 응답 텍스트에서 일시 누락된 기존 건물 복원
  (prevBuildings || []).forEach(prevB => {
    if (!prevB || !prevB.name) return;
    const k = getCleanKey(prevB.name);
    if (k && !visitedKeys.has(k)) {
      visitedKeys.add(k);
      const queuedTarget = targetLevelMap.get(k);
      let finalLevel = queuedTarget && queuedTarget.targetLevel > prevB.level ? queuedTarget.targetLevel : prevB.level;
      if (k.includes('올리브압착장') || k.includes('올리브')) {
        if (prevB.level === 2 || /신형|나선식|2배|납품|압착기가동/.test(prevB.desc || '')) {
          finalLevel = Math.max(finalLevel, 2);
        }
      }
      mergedList.push({
        ...prevB,
        level: finalLevel
      });
    }
  });

  // 이번 턴 완공되었으나 AI가 미처 본문에 추가하지 않은 신규 완공 건물 복원
  (completedQueueItems || []).forEach(q => {
    if (!q || !q.building) return;
    const k = getCleanKey(q.building);
    if (k && !visitedKeys.has(k)) {
      visitedKeys.add(k);
      const cleanName = q.building.replace(/\s*업그레이드.*$/i, '').replace(/[\(\[\{]?(?:Lv\.?|레벨)\s*\d+.*$/i, '').trim() || q.building;
      let finalLevel = q.targetLevel || 1;
      if (k.includes('올리브압착장') || k.includes('올리브')) {
        finalLevel = Math.max(finalLevel, 2);
      }
      mergedList.push({
        name: cleanName,
        desc: q.desc || '완공된 시설',
        level: finalLevel,
        tags: q.tags && q.tags.length > 0 ? q.tags : ['기타']
      });
    }
  });

  return mergedList;
}

/**
 * 게임 상태(세이브 파일 포함) 내 영지/건물 데이터를 검증 및 자가 치유(Self-Healing)합니다.
 * 1) '장원 올리브 압착장'의 레벨을 2로 복구 (과거 1레벨로 롤백된 데이터 정상화)
 * 2) 이미 2레벨로 완공되었으므로 중복 업그레이드 항목 (Lv.1→2)을 buildOptions 및 건설 큐에서 제거
 */
export function sanitizeEstateState<T extends Record<string, any>>(state: T): T {
  if (!state) return state;

  try {
    let cloned = JSON.parse(JSON.stringify(state));

    let olivePressRestoredToLv2 = false;

    // 1. estate.buildings 점검 및 복구
    if (cloned.estate && Array.isArray(cloned.estate.buildings)) {
      cloned.estate.buildings = cloned.estate.buildings.map((b: any) => {
        if (!b || !b.name) return b;
        const cleanName = b.name.replace(/\s+/g, '');
        if (cleanName.includes('올리브압착장') || cleanName.includes('올리브')) {
          const desc = b.desc || '';
          // 유저가 과거 업그레이드했거나 2레벨 서사가 포함된 올리브 압착장을 Lv.2로 복구
          const hasLv2Evidence = b.level === 1 || b.level === 2 || /신형|나선식|2배|납품|압착기/.test(desc);
          if (hasLv2Evidence) {
            olivePressRestoredToLv2 = true;
            return {
              ...b,
              name: b.name.includes('장원') ? b.name : `장원 ${b.name}`,
              level: 2,
              desc: desc || '신형 나선식 압착기 가동, 올리브유 생산량 2배 증대 및 상단 납품 수익 급증',
              tags: (b.tags && b.tags.length > 0) ? b.tags : ['수익', '산업', '생산']
            };
          }
        }
        return b;
      });

      // 1-1. 거점 시설(estate.buildings) 형식 정규화 및 결함 복구 (Vercel 세이브 파일 호환)
      const PURE_TAG_REGEX = /^(?:군사|생산|치안|행정|신앙|문화|민생|경제|특수|외교|방어|학문|종교|수익|산업)$/;
      const isPureTag = (t: string) => PURE_TAG_REGEX.test((t || '').replace(/[\[\]\{\}]/g, '').trim());
      const seenNames = new Map<string, any>();

      cloned.estate.buildings.forEach((b: any) => {
        if (!b) return;
        let cleanName = (b.name || '')
          .replace(/^[\[\{]+|[\]\}]+$/g, '')
          .replace(/[\(\[\{]?(?:Lv\.?|레벨)\s*\d+[\)\]\}]?/gi, '')
          .trim();

        // 파서 결함으로 시설명이 태그로 쪼개져 저장된 경우 복원
        if ((!cleanName || cleanName === '거점 시설') && Array.isArray(b.tags)) {
          const nonTagWords = b.tags
            .filter((t: string) => !isPureTag(t))
            .map((t: string) => t.replace(/[\[\]\{\}]/g, '').replace(/[\(\[\{]?(?:Lv\.?|레벨)\s*\d+[\)\]\}]?/gi, '').trim())
            .filter(Boolean)
            .join(' ');
          if (nonTagWords) cleanName = nonTagWords;
        }

        if (!cleanName) cleanName = '거점 시설';

        const rawLevel = typeof b.level === 'number' ? b.level : parseInt(String(b.level || '1').replace(/[^\d]/g, ''), 10) || 1;
        const cleanLevel = Math.max(1, rawLevel);

        // 유효 태그 추출 및 정제 (복원된 시설명 단어는 태그에서 제외)
        const cleanedTags: string[] = [];
        if (Array.isArray(b.tags)) {
          b.tags.forEach((t: any) => {
            if (typeof t === 'string') {
              const stripped = t.replace(/[\[\]\{\}]/g, '').trim();
              if (stripped && stripped !== cleanName && !cleanedTags.includes(stripped)) {
                cleanedTags.push(stripped);
              }
            }
          });
        }
        if (cleanedTags.length === 0) {
          cleanedTags.push('생산');
        }

        const normalizedB = {
          ...b,
          name: cleanName,
          level: cleanLevel,
          tags: cleanedTags,
          desc: b.desc || ''
        };

        // 중복 시설명 처리 (더 높은 레벨 유지)
        if (seenNames.has(cleanName)) {
          const existing = seenNames.get(cleanName);
          if (cleanLevel > existing.level) {
            seenNames.set(cleanName, normalizedB);
          }
        } else {
          seenNames.set(cleanName, normalizedB);
        }
      });

      cloned.estate.buildings = Array.from(seenNames.values());
    }

    // 2. buildOptions 내 올리브 압착장 중복 업그레이드(Lv.1→2) 제거
    if (Array.isArray(cloned.buildOptions)) {
      cloned.buildOptions = cloned.buildOptions.filter((opt: any) => {
        const text = typeof opt === 'string' ? opt : (opt.title || opt.name || opt.buildingName || '');
        const isOlive = text.includes('올리브');
        const isDuplicateUpgrade = text.includes('1→2') || text.includes('Lv.1') || text.includes('업그레이드');
        if (isOlive && (olivePressRestoredToLv2 || isDuplicateUpgrade)) {
          return false; // 이미 2레벨이므로 중복 업그레이드 옵션 제거
        }
        return true;
      });
    }

    // 3. 건설 대기열(_constructionQueue) 내 중복 올리브 압착장(Lv.2 목표) 항목 제거 (이미 완공됨)
    if (Array.isArray(cloned._constructionQueue)) {
      cloned._constructionQueue = cloned._constructionQueue.filter((q: any) => {
        const bName = q.building || '';
        const isOlive = bName.includes('올리브');
        const isLv2Target = q.targetLevel === 2 || bName.includes('1→2') || bName.includes('업그레이드');
        if (isOlive && isLv2Target) {
          return false;
        }
        return true;
      });
    }

    // 4. relationships.faction 세력 관계 중복 쪼개짐 단일화 병합 및 대적 세력(신성 로마 제국 황제파 등) 왜곡 자동 정정
    if (cloned.relationships && Array.isArray(cloned.relationships.faction)) {
      cloned.relationships.faction = cloned.relationships.faction.map((rel: string) => {
        if (!rel || typeof rel !== 'string') return rel;
        let fixedRel = rel;
        if (fixedRel.includes('신성 로마 제국') || fixedRel.includes('신성로마제국') || fixedRel.includes('황제파') || fixedRel.includes('기벨린')) {
          if (fixedRel.includes('복종')) {
            fixedRel = fixedRel.replace(/태도:\s*복종/g, '태도: 적의 품음 (도발 억제)');
          }
          if (fixedRel.includes('위협도: 안전') || fixedRel.includes('위협도:안전')) {
            fixedRel = fixedRel.replace(/위협도:\s*안전/g, '위협도: 경계 (잠복)');
          }
          if (fixedRel.includes('완전 무력화') || fixedRel.includes('도발 포기')) {
            fixedRel = fixedRel.replace(/완전\s*무력화/g, '굴욕적 휴전');
          }
        }
        return fixedRel;
      });
      cloned.relationships.faction = mergeAndDeduplicateFactionRelations(cloned.relationships.faction);
    }

    // 5. relationships.personal 인물 관계 왜곡(상급자/후원자/동료) 자동 정정 (Self-Healing)
    if (cloned.relationships && Array.isArray(cloned.relationships.personal)) {
      cloned.relationships.personal = cloned.relationships.personal.map((rel: string) => {
        if (!rel || typeof rel !== 'string') return rel;

        let fixed = rel;

        // 1) 베아트리체 (토착 장원 미망인): 상급자 오분류 방지 -> 후원자로 정정
        if (fixed.includes('베아트리체') || fixed.includes('장원 미망인') || fixed.includes('미망인')) {
          if (fixed.includes('[상급자]')) {
            fixed = fixed.replace(/\[상급자\]/g, '[후원자]');
          }
          if (fixed.includes('관계: 상급자')) {
            fixed = fixed.replace(/관계:\s*상급자/g, '관계: [후원자]');
          }
        }

        // 2) 엘레오노라 (카스텔로 영주 부인 겸 단독 섭정): 상급자 오분류 방지 -> 후원자로 정정
        if (fixed.includes('엘레오노라') || fixed.includes('영주 부인')) {
          if (fixed.includes('[상급자]')) {
            fixed = fixed.replace(/\[상급자\]/g, '[후원자]');
          }
          if (fixed.includes('관계: 상급자')) {
            fixed = fixed.replace(/관계:\s*상급자/g, '관계: [후원자]');
          }
        }

        // 3) 마테오 (우르비노 주교좌 상단 행수): 상급자/후원자 오분류 방지 -> 동료로 정정
        if (fixed.includes('마테오') || (fixed.includes('상단 행수') && !fixed.includes('후원자 명시'))) {
          if (fixed.includes('[상급자]') || fixed.includes('[후원자]')) {
            fixed = fixed.replace(/\[상급자\]/g, '[동료]').replace(/\[후원자\]/g, '[동료]');
          }
          if (fixed.includes('관계: 상급자') || fixed.includes('관계: 후원자')) {
            fixed = fixed.replace(/관계:\s*(?:상급자|후원자)/g, '관계: [동료]');
          }
        }

        // 4) 일반 규칙: 상인/행수가 상급자로 태그된 경우 -> [동료]로 정정
        if ((fixed.includes('상인') || fixed.includes('행수') || fixed.includes('상단') || fixed.includes('환전')) && fixed.includes('[상급자]')) {
          fixed = fixed.replace(/\[상급자\]/g, '[동료]');
        }

        // 5) 일반 규칙: 미망인/신도가 상급자로 태그된 경우 -> [후원자]로 정정
        if ((fixed.includes('미망인') || fixed.includes('신도') || fixed.includes('영주 부인')) && fixed.includes('[상급자]')) {
          fixed = fixed.replace(/\[상급자\]/g, '[후원자]');
        }

        return fixed;
      });
    }

    // 6. 보강 7-1 표준 규격(7대 생체 지표, 5대 표준 위험도, 장기 계획 등) 누락 세이브 자동 정규화 (Self-Healing)
    cloned = normalizeParsedState(cloned);

    // 7. 위신/명성/교단 발언권 왜곡(주교/백작 등 고위 신분인데 과거 10점으로 고정된 Vercel 세이브 파일) 자가 치유 (Self-Healing)
    const statusText = ((cloned.personalInfo?.['신분'] || '') + ' ' + (cloned.personalInfo?.['직위'] || '')).toLowerCase();
    const titleText = (cloned.personalInfo?.['칭호'] || '').toLowerCase();
    const isHighRank = statusText.includes('주교') || statusText.includes('백작') || statusText.includes('공작') || statusText.includes('대주교') || statusText.includes('황제') || statusText.includes('국왕') || statusText.includes('교황') || titleText.includes('막후의 지배자');
    if (isHighRank) {
      const keysToCheck = ['명성', '위신', '교단 발언권', '교단발언권', '발언권', '가문 위신', '개인 명망'];
      keysToCheck.forEach(k => {
        if (cloned.stats?.acquired?.[k]) {
          const rawNum = parseInt(String(cloned.stats.acquired[k]).match(/\d+/)?.[0] || '0', 10);
          if (rawNum <= 25) {
            delete cloned.stats.acquired[k]; // 동적 산출 엔진이 정상적으로 고득점(Lv.4 이상)을 부여하도록 정리
          }
        }
        if (cloned.personalInfo?.[k]) {
          const rawNum = parseInt(String(cloned.personalInfo[k]).match(/\d+/)?.[0] || '0', 10);
          if (rawNum <= 25) {
            delete cloned.personalInfo[k];
          }
        }
      });
    }

    return cloned;
  } catch (err) {
    console.error('sanitizeEstateState error:', err);
    return state;
  }
}

