// Crusader Kings 3 Style Visual & Attribute Calculation Helpers
import { ParsedState } from './parser';
import { parsePersonalRelation } from './characterRelations';
import { calculatePopulationGrowth, PopulationGrowthBreakdown } from './populationEconomy';

export interface CKAttributeDetail {
  value: number;
  label: string;
  grade: string;
  keyStats: string[];
  effects: string[];
  bonusValue: number;
}

export interface CKAttributes {
  diplomacy: CKAttributeDetail;
  martial: CKAttributeDetail;
  stewardship: CKAttributeDetail;
  intrigue: CKAttributeDetail;
  learning: CKAttributeDetail;
  prowess: CKAttributeDetail;
  synergies: {
    domainLimit: number;
    constructionSlotsBonus: number;
    goldIncomeModifier: number;
    levyModifier: number;
    prestigeModifier: number;
    pietyModifier: number;
    stressResistance: number;
  };
}

export interface CKStressState {
  value: number; // 0 to 100
  tier: 0 | 1 | 2 | 3;
  tierLabel: string;
  color: string;
  breakdownRisk: string;
}

export type PlayerArchetype = 'noble' | 'wanderer' | 'company' | 'clergy';

export interface CKResourceLabels {
  goldLabel: string;
  goldIcon: string;
  prestigeLabel: string;
  prestigeIcon: string;
  pietyLabel: string;
  pietyIcon: string;
  leviesLabel: string;
  leviesIcon: string;
  domainLabel: string;
  domainIcon: string;
}

export interface CKIncomeItem {
  id: string;
  name: string;
  amount: number;
  category: 'rank' | 'estate' | 'relation' | 'stewardship' | 'upkeep' | 'military' | 'tithe';
  desc: string;
}

export interface CKIncomeBreakdown {
  grossIncome: number;
  grossExpense: number;
  netIncome: number;
  currencyName: string;
  formattedNet: string;
  incomeItems: CKIncomeItem[];
  expenseItems: CKIncomeItem[];
  statusLabel: string;
  statusColor: string;
}

export interface CKResources {
  gold: string;
  prestige: string;
  piety: string;
  levies: string;
  domain: string;
  archetype: PlayerArchetype;
  archetypeTitle: string;
  labels: CKResourceLabels;
  income: CKIncomeBreakdown;
  populationGrowth?: PopulationGrowthBreakdown;
}

export function detectPlayerArchetype(gameState: ParsedState): PlayerArchetype {
  const status = (gameState.personalInfo?.['신분'] || '').toLowerCase();
  const title = (gameState.personalInfo?.['칭호'] || gameState.personalInfo?.['직위'] || '').toLowerCase();
  const estateType = (gameState.estate?.type || '').toLowerCase();

  if (
    status.includes('성직') || status.includes('사제') || status.includes('수도') ||
    status.includes('주교') || status.includes('신부') || status.includes('승려') ||
    status.includes('도사') || status.includes('수사') || status.includes('교황') ||
    status.includes('평신도') || status.includes('추기경') || title.includes('사제') ||
    title.includes('주교') || title.includes('교황') || title.includes('추기경') ||
    estateType.includes('예배당') || estateType.includes('수도원') ||
    estateType.includes('성좌') || estateType.includes('바티칸')
  ) {
    return 'clergy';
  }

  if (
    status.includes('용병대장') || status.includes('용병단') || status.includes('상단') ||
    status.includes('행수') || status.includes('두목') || status.includes('대장') ||
    status.includes('집단') || status.includes('선단') || status.includes('길드') ||
    status.includes('조합') || status.includes('도편수') || status.includes('촌장') ||
    status.includes('관리인') || status.includes('도당') || status.includes('의적') ||
    title.includes('단장') || title.includes('행수') || title.includes('대장') ||
    title.includes('선장') || title.includes('길드마스터') || title.includes('조합장') ||
    title.includes('촌장')
  ) {
    return 'company';
  }

  if (
    status.includes('방랑') || status.includes('낭인') || status.includes('검객') ||
    status.includes('검사') || status.includes('무인') || status.includes('모험가') ||
    status.includes('유랑') || status.includes('평민') || status.includes('소작') ||
    status.includes('농민') || status.includes('도제') || status.includes('장인') ||
    status.includes('부랑') || status.includes('무숙') || status.includes('학사') ||
    status.includes('음유시인') || status.includes('사냥꾼') || status.includes('용병') ||
    title.includes('방랑자') || title.includes('소작농') || title.includes('도제') ||
    title.includes('용병') || estateType.includes('야영지')
  ) {
    return 'wanderer';
  }

  return 'noble';
}

export function getArchetypeLabels(archetype: PlayerArchetype): CKResourceLabels {
  switch (archetype) {
    case 'clergy':
      return {
        goldLabel: '교회 헌금',
        goldIcon: '🪙',
        prestigeLabel: '교단 발언권',
        prestigeIcon: '📜',
        pietyLabel: '신앙 / 경건',
        pietyIcon: '🕊️',
        leviesLabel: '수도사 / 신도',
        leviesIcon: '👥',
        domainLabel: '교구 / 예배당',
        domainIcon: '⛪'
      };
    case 'company':
      return {
        goldLabel: '단원 군자금',
        goldIcon: '🪙',
        prestigeLabel: '용병단 명성',
        prestigeIcon: '🚩',
        pietyLabel: '부대 사기',
        pietyIcon: '🔥',
        leviesLabel: '고용 단원',
        leviesIcon: '⚔️',
        domainLabel: '숙영지 / 본진',
        domainIcon: '⛺'
      };
    case 'wanderer':
      return {
        goldLabel: '소지 여비',
        goldIcon: '💰',
        prestigeLabel: '개인 명망',
        prestigeIcon: '🗡️',
        pietyLabel: '의기 / 사기',
        pietyIcon: '🔥',
        leviesLabel: '동행 동료',
        leviesIcon: '👥',
        domainLabel: '임시 거처',
        domainIcon: '🏕️'
      };
    case 'noble':
    default:
      return {
        goldLabel: '국고 / 금화',
        goldIcon: '🪙',
        prestigeLabel: '가문 위신',
        prestigeIcon: '👑',
        pietyLabel: '신앙 / 경건',
        pietyIcon: '🕊️',
        leviesLabel: '병력 / 징집병',
        leviesIcon: '⚔️',
        domainLabel: '직할령 / 성채',
        domainIcon: '🏰'
      };
  }
}

export interface ArchetypeDetails {
  archetype: PlayerArchetype;
  num: string;
  title: string;
  subtitle: string;
  icon: string;
  coreRule: string;
  badgeList: Array<{ label: string; value: string; icon: string; color: string }>;
}

export function getArchetypeDetails(gameState: ParsedState): ArchetypeDetails {
  const archetype = detectPlayerArchetype(gameState);
  const resources = parseCKResources(gameState);

  if (archetype === 'wanderer') {
    return {
      archetype,
      num: '1번',
      title: '개인 및 방랑자 (Wanderer / Adventurer)',
      subtitle: '낭인 · 검객 · 모험가 · 유랑 학자',
      icon: '🗡️',
      coreRule: '1인칭 생존 & 의뢰 수주. 여관 노숙 시 체온/피로 위험 관리. 마을 및 영주 의뢰 해결로 무예 명성 축적 및 입신양명.',
      badgeList: [
        { label: '소지 여비', value: resources.gold, icon: '💰', color: '#fbbf24' },
        { label: '개인 명망', value: resources.prestige, icon: '🗡️', color: '#38bdf8' },
        { label: '임시 거처', value: resources.domain, icon: '🏕️', color: '#34d399' },
        { label: '동행 인원', value: resources.levies, icon: '👥', color: '#f87171' }
      ]
    };
  }

  if (archetype === 'company') {
    return {
      archetype,
      num: '2번',
      title: '소규모 집단 및 용병단 (Company / Mercenary Band)',
      subtitle: '용병단장 · 상단 행수 · 의적 두목',
      icon: '👥',
      coreRule: '집단 통솔 & 군자금 관리. 매 턴 단원 주급 및 식량 유지비 소모. 군자금 고갈 시 사기 급락 및 하극상 위험. 참전 계약으로 영지 획득.',
      badgeList: [
        { label: '단원 군자금', value: resources.gold, icon: '🪙', color: '#fbbf24' },
        { label: '용병단 명성', value: resources.prestige, icon: '🚩', color: '#38bdf8' },
        { label: '부대 사기', value: resources.piety, icon: '🔥', color: '#f97316' },
        { label: '정예 단원', value: resources.levies, icon: '⚔️', color: '#ef4444' }
      ]
    };
  }

  if (archetype === 'clergy') {
    return {
      archetype,
      num: '3번',
      title: '성직자 및 수도자 (Clergy / Monastic Order)',
      subtitle: '사제 · 수도승 · 순례자 · 이단 심문관',
      icon: '⛪',
      coreRule: '신앙 & 교단 발언권. 독신 서약 및 금욕 수호. 십일조 수취와 고문서 필사, 세속 영주와의 신성 갈등 대처 및 주교 서품 경쟁.',
      badgeList: [
        { label: '교회 헌금', value: resources.gold, icon: '🪙', color: '#fbbf24' },
        { label: '신앙 / 경건', value: resources.piety, icon: '🕊️', color: '#c084fc' },
        { label: '교단 발언권', value: resources.prestige, icon: '📜', color: '#38bdf8' },
        { label: '수도원 장원', value: resources.domain, icon: '⛪', color: '#34d399' }
      ]
    };
  }

  return {
    archetype: 'noble',
    num: '4번',
    title: '봉건 영주 및 귀족 (Feudal Noble)',
    subtitle: '성주 · 남작 · 백작 · 제후',
    icon: '👑',
    coreRule: '영지 통치 & 가문 혈통. 장원 백성 통치, 봉건 징집병 동원, 가문 대를 잇는 정략혼과 계승권 전쟁.',
    badgeList: [
      { label: '영지 국고', value: resources.gold, icon: '🪙', color: '#fbbf24' },
      { label: '가문 위신', value: resources.prestige, icon: '👑', color: '#38bdf8' },
      { label: '직할 영지', value: resources.domain, icon: '🏰', color: '#34d399' },
      { label: '동원 병력', value: resources.levies, icon: '⚔️', color: '#ef4444' }
    ]
  };
}

// 텍스트에서 숫자 추출 (예: "15 (+2)" -> 17, "보통 (65%)" -> 65)
export function extractNumericValue(raw: string | undefined): number {
  if (!raw) return 10;
  
  // (15 (+2)) 포맷
  const matchWithBonus = raw.match(/(\d+)\s*\(([+-]?\d+)\)/);
  if (matchWithBonus) {
    const base = parseInt(matchWithBonus[1], 10);
    const bonus = parseInt(matchWithBonus[2], 10);
    return Math.max(1, base + bonus);
  }

  // 단순 정수
  const numMatch = raw.match(/(\d+)/);
  if (numMatch) {
    return parseInt(numMatch[1], 10);
  }

  // 등급형 텍스트
  if (raw.includes('전설') || raw.includes('극') || raw.includes('초인') || raw.includes('최상')) return 22;
  if (raw.includes('상') || raw.includes('높음') || raw.includes('탁월') || raw.includes('우수')) return 16;
  if (raw.includes('중') || raw.includes('보통') || raw.includes('평범')) return 10;
  if (raw.includes('하') || raw.includes('낮음') || raw.includes('미흡')) return 6;
  if (raw.includes('최하') || raw.includes('위태') || raw.includes('취약')) return 3;

  return 10;
}

function getGradeFromScore(score: number): string {
  if (score >= 22) return 'S+ (전설)';
  if (score >= 18) return 'S (초인적)';
  if (score >= 14) return 'A (탁월)';
  if (score >= 10) return 'B (우수)';
  if (score >= 6) return 'C (평범)';
  return 'D (미흡)';
}

// CK3 5대 핵심 능력치 + 기량 계산
export function calculateCKAttributes(gameState: ParsedState): CKAttributes {
  const allStats: Record<string, string> = {
    ...(gameState.stats?.innate || {}),
    ...(gameState.stats?.acquired || {})
  };

  const getStatAvg = (names: string[]): number => {
    let sum = 0;
    let count = 0;
    for (const [key, val] of Object.entries(allStats)) {
      if (names.some(n => key.includes(n))) {
        sum += extractNumericValue(val);
        count++;
      }
    }
    return count > 0 ? (sum / count) : 40;
  };

  // 0~100 스탯을 크킹식 1~30 정수 수치로 정규화
  const toCKScore = (rawAvg: number): number => {
    return Math.min(30, Math.max(1, Math.round((rawAvg / 100) * 26)));
  };

  // 1. 외교력 (Diplomacy): 외교력, 매력, 설득력 (선천: 지능)
  const dipRaw = getStatAvg(['외교력', '외교', '매력', '설득력', '설득', '지능']);
  const dipScore = toCKScore(dipRaw);
  
  // 2. 무력 (Martial): 통솔력, 전략, 전술 (선천: 의지력, 집중력)
  const marRaw = getStatAvg(['통솔력', '통솔', '전략', '전술', '의지력', '집중력']);
  const marScore = toCKScore(marRaw);

  // 3. 관리력 (Stewardship): 행정력, 기술 숙련도, 장인 기술 (선천: 학습 능력, 기억력)
  const stewRaw = getStatAvg(['행정력', '행정', '기술 숙련도', '장인 기술', '학습 능력', '기억력']);
  const stewScore = toCKScore(stewRaw);

  // 4. 계책력 (Intrigue): 기만술, 위협, 은밀 행동, 수사력 (선천: 지각력, 반사 신경)
  const intRaw = getStatAvg(['기만술', '위협', '은밀 행동', '은밀', '수사력', '지각력', '반사 신경']);
  const intScore = toCKScore(intRaw);

  // 5. 학습력 (Learning): 학문, 의술 (선천: 지능, 기억력, 학습 능력)
  const lrnRaw = getStatAvg(['학문', '의술', '지능', '기억력', '학습 능력']);
  const lrnScore = toCKScore(lrnRaw);

  // 6. 기량 (Prowess): 전투력, 무기 숙련도, 기마술, 생존술 (선천: 근력, 체력, 지구력, 민첩성, 속도, 신체 조정력)
  const prowRaw = getStatAvg(['전투력', '무기 숙련도', '기마술', '생존술', '근력', '체력', '지구력', '민첩성', '속도', '신체 조정력']);
  const prowScore = toCKScore(prowRaw);

  // 일관성 있는 영지/거점 및 범용 자원 연동 시너지 수치 계산
  const rawStatus = gameState.personalInfo?.['신분'] || gameState.personalInfo?.['직위'] || '평민';
  const cleanStatus = rawStatus.split('/')[0].split('(')[0].trim();
  let tierBonus = 0;
  if (['황제', '교황'].some(k => cleanStatus.includes(k))) tierBonus = 4;
  else if (['대주교', '공작'].some(k => cleanStatus.includes(k))) tierBonus = 3;
  else if (['주교', '수도원장', '백작', '후작', '상단주', '길드마스터'].some(k => cleanStatus.includes(k))) tierBonus = 2;
  else if (['사제', '남작', '자작', '용병대장', '장원 관리인', '촌장'].some(k => cleanStatus.includes(k))) tierBonus = 1;
  else tierBonus = 0;

  const domainBonus = Math.floor(stewScore / 6);
  const totalDomainLimit = 1 + tierBonus + domainBonus;
  const constructionSlotsBonus = stewScore >= 18 ? 1 : 0;
  const goldIncomeModifier = Math.round(stewScore * 2);
  const levyModifier = Math.round(marScore * 2.5);
  const prestigeModifier = Math.round(dipScore * 2);
  const pietyModifier = Math.round(lrnScore * 2.5);
  const stressResistance = Math.round((lrnScore + stewScore) / 2);

  return {
    diplomacy: {
      value: dipScore,
      label: '외교력 (Diplomacy)',
      grade: getGradeFromScore(dipScore),
      keyStats: ['외교력', '설득력', '매력'],
      bonusValue: prestigeModifier,
      effects: [
        `가문/개인 위신 획득량 +${prestigeModifier}%`,
        `영지 민심 및 제후 호감도 보너스 +${Math.round(dipScore * 1.5)}`,
        '결혼 및 외교 조약 협상 성공률 증가'
      ]
    },
    martial: {
      value: marScore,
      label: '무력 (Martial)',
      grade: getGradeFromScore(marScore),
      keyStats: ['통솔력', '전술', '전략'],
      bonusValue: levyModifier,
      effects: [
        `병력 징집 및 군사 동원 한계 +${levyModifier}%`,
        `거점/성채 방어도 보너스 +${Math.round(marScore * 2)}`,
        '전투 지휘 시 아군 피해 감소 및 사기 유지'
      ]
    },
    stewardship: {
      value: stewScore,
      label: '관리력 (Stewardship)',
      grade: getGradeFromScore(stewScore),
      keyStats: ['행정력', '기술 숙련도', '장인 기술'],
      bonusValue: domainBonus,
      effects: [
        `직할 영지/거점 보유 한계: ${totalDomainLimit}개소 (기본 1 + 품계 +${tierBonus} + 관리력 +${domainBonus})`,
        `영지 세금 및 국고 수입 +${goldIncomeModifier}%`,
        `거점 시설 건설 비용 절감 -${Math.min(25, Math.floor(stewScore * 1.2))}%`,
        constructionSlotsBonus > 0 ? '동시 건설 슬롯 +1 추가 개방' : '안정적 시설 공정 관리'
      ]
    },
    intrigue: {
      value: intScore,
      label: '계책력 (Intrigue)',
      grade: getGradeFromScore(intScore),
      keyStats: ['기만술', '은밀 행동', '위협'],
      bonusValue: Math.round(intScore * 2),
      effects: [
        `암살 및 적대적 음모 방어 확률 +${Math.round(intScore * 2)}%`,
        `영지 치안 안정화 및 범죄 조직 단속 +${Math.round(intScore * 1.5)}`,
        '비밀 정보 수집 및 첩보망 효율 극대화'
      ]
    },
    learning: {
      value: lrnScore,
      label: '학습력 (Learning)',
      grade: getGradeFromScore(lrnScore),
      keyStats: ['학문', '의술', '학습 능력'],
      bonusValue: pietyModifier,
      effects: [
        `신앙 및 경건 획득량 +${pietyModifier}%`,
        `문화 및 기술 혁신 속도 +${Math.round(lrnScore * 2)}%`,
        '질병 치료 성공률 및 스트레스 자연 완화'
      ]
    },
    prowess: {
      value: prowScore,
      label: '기량 (Prowess)',
      grade: getGradeFromScore(prowScore),
      keyStats: ['전투력', '무기 숙련도', '근력'],
      bonusValue: Math.round(prowScore * 3),
      effects: [
        `1:1 결투 및 개인 무예 피해량 +${Math.round(prowScore * 3)}%`,
        `전장에서의 부상/전사 위험 저하 -${Math.round(prowScore * 2)}%`,
        '야외 혹한/노숙 환경 체력 생존력 증대'
      ]
    },
    synergies: {
      domainLimit: totalDomainLimit,
      constructionSlotsBonus,
      goldIncomeModifier,
      levyModifier,
      prestigeModifier,
      pietyModifier,
      stressResistance
    }
  };
}

/** 거점 규모(Lv.1~Lv.5)에 따른 최대 수용 가능한 시설(건물) 상한 수 (단위: 동) */
export function getMaxHoldingCapacity(estateLevelOrStr: number | string | undefined): number {
  let lv = 1;
  if (typeof estateLevelOrStr === 'number') {
    lv = estateLevelOrStr;
  } else if (typeof estateLevelOrStr === 'string') {
    const m = estateLevelOrStr.match(/(?:Lv\.?|레벨)\s*(\d+)/i);
    if (m) lv = parseInt(m[1], 10);
  }
  
  if (lv >= 5) return 12;
  if (lv === 4) return 9;
  if (lv === 3) return 7;
  if (lv === 2) return 5;
  return 3;
}

export interface DomainLimitBreakdown {
  total: number;
  base: number;
  tierBonus: number;
  stewBonus: number;
  vassalBonus: number;
  heldCount: number;
  maxBuildingCapacity: number;
  currentBuildingsCount: number;
  isOverCapacity: boolean;
}

/** 직할 영지 한계 및 거점 시설 수용량의 정밀 명세 산출 */
export function getDomainLimitBreakdown(gameState: ParsedState): DomainLimitBreakdown {
  const rawStatus = gameState?.personalInfo?.['신분'] || gameState?.personalInfo?.['직위'] || '평민';
  const cleanStatus = rawStatus.split('/')[0].split('(')[0].trim();
  
  const attr = calculateCKAttributes(gameState || {});
  const stewScore = attr.stewardship.value;
  const stewBonus = Math.floor(stewScore / 6);
  
  let tierBonus = 0;
  if (['황제', '교황'].some(k => cleanStatus.includes(k))) tierBonus = 4;
  else if (['대주교', '공작'].some(k => cleanStatus.includes(k))) tierBonus = 3;
  else if (['주교', '수도원장', '백작', '후작', '상단주', '길드마스터'].some(k => cleanStatus.includes(k))) tierBonus = 2;
  else if (['사제', '남작', '자작', '용병대장', '장원 관리인', '촌장'].some(k => cleanStatus.includes(k))) tierBonus = 1;
  else tierBonus = 0;

  let vassalBonus = 0;
  if (gameState?.relationships?.personal) {
    const hasSteward = gameState.relationships.personal.some(r => 
      (r.includes('집사장') || r.includes('행정') || r.includes('서기관') || r.includes('관리인')) && r.includes('신뢰도')
    );
    if (hasSteward) vassalBonus = 1;
  }

  const base = 1;
  const total = base + tierBonus + stewBonus + vassalBonus;
  const heldCount = (gameState?.estate?.type && gameState.estate.type !== '거점 없음') ? 1 : 0;
  const currentBuildingsCount = gameState?.estate?.buildings?.length || 0;
  const maxBuildingCapacity = getMaxHoldingCapacity(gameState?.estate?.level);
  const isOverCapacity = currentBuildingsCount > maxBuildingCapacity;

  return {
    total,
    base,
    tierBonus,
    stewBonus,
    vassalBonus,
    heldCount,
    maxBuildingCapacity,
    currentBuildingsCount,
    isOverCapacity
  };
}

// CK3 스트레스 시스템 분석
export function parseCKStress(gameState: ParsedState): CKStressState {
  let stressVal = 15; // 기본 평상치

  // 플레이어 상태에서 스트레스/정신 관련 항목 검색
  const stressStatus = gameState.playerStatus?.find(s => 
    s.name.includes('스트레스') || s.name.includes('정신') || s.name.includes('불안') || s.name.includes('압박')
  );

  if (stressStatus) {
    const rawVal = stressStatus.value;
    const num = extractNumericValue(rawVal);
    // 만약 80/100 형태라면
    const fracMatch = rawVal.match(/(\d+)\s*\/\s*(\d+)/);
    if (fracMatch) {
      stressVal = Math.min(100, Math.max(0, parseInt(fracMatch[1], 10)));
    } else if (rawVal.includes('%')) {
      stressVal = Math.min(100, Math.max(0, num));
    } else {
      stressVal = Math.min(100, Math.max(0, num * 5)); // 10점 척도일 경우 대비
    }
  }

  if (stressVal >= 90) {
    return {
      value: stressVal,
      tier: 3,
      tierLabel: '3단계 임계 (붕괴 직전)',
      color: '#ef4444',
      breakdownRisk: '심장마비 / 광기 폭발 / 돌연사 위기'
    };
  }
  if (stressVal >= 65) {
    return {
      value: stressVal,
      tier: 2,
      tierLabel: '2단계 위험 (심각한 압박)',
      color: '#f97316',
      breakdownRisk: '신경 쇠약 / 극단적 선택 위험'
    };
  }
  if (stressVal >= 35) {
    return {
      value: stressVal,
      tier: 1,
      tierLabel: '1단계 주의 (경미한 긴장)',
      color: '#fbbf24',
      breakdownRisk: '수면 장애 / 피로 누적'
    };
  }

  return {
    value: stressVal,
    tier: 0,
    tierLabel: '안정 (심신 평온)',
    color: '#10b981',
    breakdownRisk: '안정 상태'
  };
}

// CK3 핵심 자원 요약 추출
export function parseCKResources(gameState: ParsedState, previousPopulation?: number): CKResources {
  const faction = gameState.factionState || {};
  const wealthItems = gameState.inventory?.wealth || [];
  const archetype = detectPlayerArchetype(gameState);
  const labels = getArchetypeLabels(archetype);
  const attributes = calculateCKAttributes(gameState);

  // 금화
  let gold = faction['세력 재정'] || faction['재정'] || faction['금화'] || '';
  if (!gold && wealthItems.length > 0) {
    const goldFound = wealthItems.find(w => w.includes('금') || w.includes('은') || w.includes('전') || w.includes('동'));
    if (goldFound) gold = goldFound;
  }
  if (!gold) {
    gold = archetype === 'clergy' ? '은화 45닢' : archetype === 'wanderer' ? '동화 30개' : archetype === 'company' ? '금화 150닢' : '금화 350개';
  }

  // 위신 (명성)
  let prestige = gameState.stats?.acquired?.['명성'] || gameState.personalInfo?.['명성'] || '';
  if (!prestige) {
    const rank = gameState.personalInfo?.['직위'] || gameState.personalInfo?.['신분'] || (archetype === 'clergy' ? '수도사' : archetype === 'company' ? '용병대장' : archetype === 'wanderer' ? '방랑자' : '귀족');
    prestige = `${rank}의 명망`;
  }

  // 신앙 / 사기
  const piety = gameState.personalInfo?.['종교'] || gameState.playerStatus?.find(s => s.name.includes('사기') || s.name.includes('신앙'))?.value || (archetype === 'clergy' ? '깊은 신앙 (95%)' : archetype === 'company' ? '부대 사기 높음' : '의기 충천');

  // 병력
  let levies = faction['병력'] || faction['군사'] || '';
  if (!levies) {
    levies = archetype === 'clergy' ? '수도사 12명' : archetype === 'company' ? '정예 단원 24명' : archetype === 'wanderer' ? '단신 (동행 1명)' : '상비군 50명';
  }

  // 직할령 / 거점: 관리력(Stewardship) 기반 직할 한계치와 일관성 연동
  const estateType = gameState.estate?.type || (archetype === 'clergy' ? '작은 예배당' : archetype === 'wanderer' ? '임시 야영지' : archetype === 'company' ? '상설 숙영지' : '봉건 장원');
  const buildingCount = gameState.estate?.buildings?.length || 0;
  const domainLimit = attributes.synergies.domainLimit;
  const domain = `${estateType} (시설 ${buildingCount}동 / 직할 한계 ${domainLimit})`;

  const archetypeTitleMap: Record<PlayerArchetype, string> = {
    noble: '👑 봉건 영주 및 귀족',
    wanderer: '🗡️ 개인 및 방랑자',
    company: '👥 소규모 집단',
    clergy: '⛪ 성직자 및 수도자'
  };

  const income = calculateTurnIncome(gameState);
  const populationGrowth = calculatePopulationGrowth(gameState, previousPopulation);

  return {
    gold,
    prestige,
    piety,
    levies,
    domain,
    archetype,
    archetypeTitle: archetypeTitleMap[archetype],
    labels,
    income,
    populationGrowth
  };
}

// 가문 문장 엠블럼 심볼
export function getHeraldryEmblem(name: string, culture: string = '', archetype?: PlayerArchetype): { icon: string; border: string; bg: string } {
  const normName = (name || '').toLowerCase();

  if (normName.includes('교황') || normName.includes('성하') || normName.includes('바티칸') || normName.includes('로마 성좌')) {
    return { icon: '🗝️', border: '#facc15', bg: 'linear-gradient(135deg, #1e3a8a, #78350f)' };
  }
  if (normName.includes('황제') || normName.includes('카이저') || normName.includes('차르') || normName.includes('바실레우스') || normName.includes('폐하')) {
    return { icon: '🦅', border: '#f59e0b', bg: 'linear-gradient(135deg, #581c87, #b45309)' };
  }
  if (archetype === 'wanderer') {
    return { icon: '🗡️', border: '#94a3b8', bg: 'linear-gradient(135deg, #1e293b, #334155)' };
  }
  if (archetype === 'company') {
    return { icon: '⚔️', border: '#f87171', bg: 'linear-gradient(135deg, #7f1d1d, #991b1b)' };
  }
  if (archetype === 'clergy') {
    return { icon: '✝️', border: '#38bdf8', bg: 'linear-gradient(135deg, #0c4a6e, #1e3a8a)' };
  }
  if (name.includes('사자') || culture.includes('서양') || culture.includes('유럽')) {
    return { icon: '🦁', border: '#d4af37', bg: 'linear-gradient(135deg, #78350f, #b45309)' };
  }
  if (name.includes('독수리') || culture.includes('로마') || culture.includes('제국')) {
    return { icon: '🦅', border: '#9333ea', bg: 'linear-gradient(135deg, #4c1d95, #701a75)' };
  }
  if (name.includes('용') || culture.includes('동양') || culture.includes('중원') || culture.includes('한국')) {
    return { icon: '🐉', border: '#e11d48', bg: 'linear-gradient(135deg, #881337, #be123c)' };
  }
  if (name.includes('십자가') || name.includes('성') || name.includes('교')) {
    return { icon: '✝️', border: '#38bdf8', bg: 'linear-gradient(135deg, #0c4a6e, #0284c7)' };
  }
  return { icon: '🛡️', border: '#d4af37', bg: 'linear-gradient(135deg, #1e293b, #0f172a)' };
}

export interface RelationTierInfo {
  id: 'superior' | 'patron' | 'peer' | 'subordinate' | 'rival';
  label: string;
  color: string;
  bg: string;
  border: string;
}

// 이름 및 직책 문자열 정제 (예: "[베르나르도 (성 미카엘 수호대장)]" -> { name: "베르나르도", role: "성 미카엘 수호대장" })
export function parseNameAndRole(rawName: string): { name: string; role: string } {
  if (!rawName) return { name: '', role: '' };
  const cleanRaw = rawName.replace(/^\[|\]$/g, '').trim();
  const roleMatch = cleanRaw.match(/^(.*?)\s*\((.*?)\)$/);
  if (roleMatch) {
    return {
      name: roleMatch[1].trim(),
      role: roleMatch[2].trim()
    };
  }
  return {
    name: cleanRaw,
    role: ''
  };
}

// 5대 관계 위계(Tier) 판별 함수 (SSOT characterRelations.ts 위임)
export function determineRelationTier(
  rawName: string,
  descStr: string,
  affStr: string = '',
  role: string = '',
  subordinateName: string = '직속 가신 / 보좌'
): RelationTierInfo {
  const synthesizedRel = `${rawName} | 신뢰도 50 | ${affStr} | ${descStr}`;
  const p = parsePersonalRelation(synthesizedRel);
  return {
    id: p.tierId,
    label: p.tierLabel,
    color: p.tierColor,
    bg: p.tierBg,
    border: p.tierBorder
  };
}

// 29개 신분 프리셋별 턴당 기초 소득 기준표
const RANK_BASE_INCOME: Record<string, number> = {
  // 방랑자 (1.0 ~ 3.5)
  '부랑자': 1.0, '소작농': 1.5, '평민': 2.0, '도제': 2.2, '용병': 2.5,
  '음유시인': 2.8, '학사': 3.0, '장인': 3.2, '방랑 검사': 3.5,
  // 소규모 집단 (3.5 ~ 9.5)
  '도적단 두목': 3.5, '촌장': 4.5, '장원 관리인': 6.0, '상단주': 7.5,
  '용병대장': 8.0, '길드마스터': 9.5,
  // 성직자 (2.0 ~ 38.0)
  '평신도': 2.0, '수사': 3.5, '사제': 6.0, '수도원장': 10.0,
  '주교': 16.0, '대주교': 24.0, '교황': 38.0,
  // 봉건 귀족 (5.0 ~ 48.0)
  '기사': 5.0, '남작': 8.5, '자작': 13.0, '백작': 19.0,
  '후작': 26.0, '공작': 34.0, '황제': 48.0
};

// 턴 당 수입 및 재정 수지(Financial Ledger) 정밀 산정 함수
export function calculateTurnIncome(gameState: ParsedState): CKIncomeBreakdown {
  const archetype = detectPlayerArchetype(gameState);
  const currencyName = archetype === 'clergy' ? '은화' : archetype === 'wanderer' ? '동화' : '금화';
  const attributes = calculateCKAttributes(gameState);
  const stewScore = attributes.stewardship.value; // 1~30

  const incomeItems: CKIncomeItem[] = [];
  const expenseItems: CKIncomeItem[] = [];

  // 1. 신분 기본 품계 소득 (Rank Base Income)
  const rawStatus = gameState.personalInfo?.['신분'] || gameState.personalInfo?.['직위'] || '평민';
  const cleanStatus = rawStatus.split('/')[0].split('(')[0].trim();
  const baseRankIncome = RANK_BASE_INCOME[cleanStatus] || (
    archetype === 'wanderer' ? 2.0 :
    archetype === 'company' ? 5.0 :
    archetype === 'clergy' ? 5.0 : 8.0
  );
  incomeItems.push({
    id: 'rank_base',
    name: `${cleanStatus} 기본 품계 소득`,
    amount: baseRankIncome,
    category: 'rank',
    desc: `${cleanStatus} 신분 위계에 따른 기본 생활비 및 직무 수당`
  });

  // 2. 직할 거점 및 생산 시설 수입 (Holding & Buildings)
  const estate = gameState.estate;
  let estateLevelNum = 1;
  if (estate?.level) {
    const lvMatch = estate.level.match(/(?:Lv\.?|레벨)\s*(\d+)/i);
    if (lvMatch) estateLevelNum = parseInt(lvMatch[1], 10);
  }
  const estateBaseAmount = Math.round(estateLevelNum * 1.5 * 10) / 10;
  incomeItems.push({
    id: 'estate_base',
    name: `${estate?.type || '직할 거점'} 기본 생산성 (Lv.${estateLevelNum})`,
    amount: estateBaseAmount,
    category: 'estate',
    desc: `거점 규모에 따른 직할지 기초 생산력`
  });

  if (estate?.buildings && estate.buildings.length > 0) {
    estate.buildings.forEach((b, idx) => {
      const bTags = (b.tags || []).join(' ');
      const bCombined = `${b.name} ${b.desc} ${bTags}`;
      let bIncome = 1.0;
      let bCategoryDesc = '기본 부대시설 수익';

      if (bCombined.includes('생산') || bCombined.includes('재정') || bCombined.includes('무역') || bCombined.includes('상업') || bCombined.includes('제분') || bCombined.includes('양조') || bCombined.includes('착유') || bCombined.includes('공방') || bCombined.includes('대장간')) {
        bIncome = 3.0;
        bCategoryDesc = '고부가가치 물품 생산 및 상업 교역';
      } else if (bCombined.includes('행정') || bCombined.includes('민생') || bCombined.includes('서재') || bCombined.includes('서기관')) {
        bIncome = 1.8;
        bCategoryDesc = '조세 징수 및 행정 효율 증대';
      } else if (bCombined.includes('신앙') || bCombined.includes('문화') || bCombined.includes('예배') || bCombined.includes('기도')) {
        bIncome = archetype === 'clergy' ? 2.2 : 1.2;
        bCategoryDesc = '신도 헌금 및 미사 예물 수취';
      } else if (bCombined.includes('군사') || bCombined.includes('치안') || bCombined.includes('훈련') || bCombined.includes('방벽')) {
        bIncome = 0.5;
        bCategoryDesc = '치안 유지 및 통행세 보전';
      }

      incomeItems.push({
        id: `building_${idx}`,
        name: `${b.name} 생산 수익`,
        amount: bIncome,
        category: 'estate',
        desc: `${bCategoryDesc} (${b.desc || '거점 확충 시설'})`
      });
    });
  }

  // 3. 인간 관계망 기여 (Patrons, Trade Deals, Feudal Vassals)
  const personalRels = gameState.relationships?.personal || [];
  let superiorFound = false;
  let subordinateCount = 0;

  personalRels.forEach((rel, idx) => {
    const p = parsePersonalRelation(rel, archetype);
    const { name, trust: trustVal, isSuperior, isSubordinate, isPatron, role, descStr } = p;

    if (isSuperior) {
      superiorFound = true;
    } else if (isSubordinate) {
      subordinateCount++;
      if (archetype === 'noble') {
        incomeItems.push({
          id: `vassal_${idx}`,
          name: `${name} 봉신 공납세`,
          amount: 1.2,
          category: 'relation',
          desc: `직속 가신의 봉건 공납금`
        });
      }
    } else if (isPatron) {
      const patronAmount = Math.round((2.0 + (trustVal / 100) * 3.0) * 10) / 10;
      incomeItems.push({
        id: `patron_${idx}`,
        name: `${name} 후원금/헌납금`,
        amount: patronAmount,
        category: 'relation',
        desc: `유력 신도/외부 후원자의 정기 지원금 (신뢰도 ${trustVal}%)`
      });
    } else if (p.tierId === 'peer') {
      const isTrade = role.includes('행수') || role.includes('상단') || role.includes('상인') ||
                      descStr.includes('공급') || descStr.includes('독점') || descStr.includes('무역') || descStr.includes('계약');
      if (isTrade) {
        incomeItems.push({
          id: `trade_${idx}`,
          name: `${name} 상업 교역 배당금`,
          amount: 2.5,
          category: 'relation',
          desc: `상단 독점 물품 공급 및 무역 협정 이익`
        });
      }
    }
  });

  // 4. 관리력(Stewardship) 세무 보너스
  const baseSubtotal = incomeItems.reduce((acc, i) => acc + i.amount, 0);
  const stewBonusRate = stewScore * 0.02; // e.g. 15 -> 30%
  const stewBonusAmount = Math.round(baseSubtotal * stewBonusRate * 10) / 10;
  if (stewBonusAmount > 0) {
    incomeItems.push({
      id: 'stewardship_bonus',
      name: `관리력 세무 효율 (+${Math.round(stewScore * 2)}%)`,
      amount: stewBonusAmount,
      category: 'stewardship',
      desc: `높은 관리력(${stewScore})으로 인한 탈세 방지 및 조세 징수 최적화`
    });
  }

  // 5. 세출 계산 (Gross Expense)
  // 5-1. 거점 시설 유지 보수비
  const buildingCount = estate?.buildings?.length || 0;
  const domainBreakdown = getDomainLimitBreakdown(gameState);
  const baseUpkeep = Math.round(buildingCount * 0.5 * 10) / 10;
  if (baseUpkeep > 0) {
    expenseItems.push({
      id: 'facility_upkeep',
      name: `거점 시설 유지비 (${buildingCount}동)`,
      amount: baseUpkeep,
      category: 'upkeep',
      desc: `시설 난방, 시설 감가상각 및 청소/유지보수 비용`
    });
  }
  if (domainBreakdown.isOverCapacity) {
    const overCount = Math.max(1, buildingCount - domainBreakdown.maxBuildingCapacity);
    const overPenalty = Math.round(overCount * 1.5 * 10) / 10;
    expenseItems.push({
      id: 'overcapacity_penalty',
      name: `거점 시설 과밀 페널티 (${overCount}동 초과)`,
      amount: overPenalty,
      category: 'upkeep',
      desc: `거점 수용 한도 초과로 인한 부대 관리비 및 임차료 급증`
    });
  }

  // 5-2. 군비 및 부대/가신 급료
  const faction = gameState.factionState || {};
  const leviesStr = faction['병력'] || faction['군사'] || '';
  const leviesMatch = leviesStr.match(/(\d+)/);
  const leviesCount = leviesMatch ? parseInt(leviesMatch[1], 10) : (archetype === 'company' ? 20 : archetype === 'noble' ? 30 : 10);
  const militaryUpkeep = Math.round(Math.max(0.5, (leviesCount / 12) * 1.0) * 10) / 10;
  expenseItems.push({
    id: 'military_upkeep',
    name: `${archetype === 'company' ? '용병단원' : archetype === 'clergy' ? '성당 경비단' : '상비군'} 급료 및 군비`,
    amount: militaryUpkeep,
    category: 'military',
    desc: `동원 병력/단원(${leviesCount}명)의 식량 조달 및 정기 급료`
  });

  if (subordinateCount > 0) {
    const subordinateUpkeep = Math.round(subordinateCount * 0.5 * 10) / 10;
    expenseItems.push({
      id: 'subordinate_upkeep',
      name: `직속 보좌/복사/시종 수당 (${subordinateCount}인)`,
      amount: subordinateUpkeep,
      category: 'upkeep',
      desc: `가신단 및 성당 복사 소년들의 숙식 제공 및 생활 보조비`
    });
  }

  // 5-3. 상급자 십일조 / 주군 공납금
  if (superiorFound) {
    const titheRate = archetype === 'clergy' ? 0.10 : archetype === 'noble' ? 0.15 : 0.08;
    const titheAmount = Math.round(baseSubtotal * titheRate * 10) / 10;
    if (titheAmount > 0) {
      expenseItems.push({
        id: 'superior_tithe',
        name: archetype === 'clergy' ? '교단 상급자 십일조 (10%)' : '주군 영주 봉건 공납 (15%)',
        amount: titheAmount,
        category: 'tithe',
        desc: `상급 교구장 주교 또는 주군 제후에 대한 의무적 조세 상납`
      });
    }
  }

  // 6. 합산 및 최종 순수입
  const grossIncome = Math.round(incomeItems.reduce((acc, i) => acc + i.amount, 0) * 10) / 10;
  const grossExpense = Math.round(expenseItems.reduce((acc, i) => acc + i.amount, 0) * 10) / 10;
  const netIncome = Math.round((grossIncome - grossExpense) * 10) / 10;

  const formattedNet = netIncome > 0 ? `+${netIncome.toFixed(1)}` : netIncome < 0 ? `${netIncome.toFixed(1)}` : '±0.0';

  let statusLabel = '⚖️ 균형 재정 (수지 균형)';
  let statusColor = '#38bdf8';
  if (netIncome >= 10.0) {
    statusLabel = '✨ 고도 번영 (초과 흑자)';
    statusColor = '#10b981';
  } else if (netIncome >= 3.0) {
    statusLabel = '📈 안정 흑자 (거점 확장 추천)';
    statusColor = '#34d399';
  } else if (netIncome >= 0) {
    statusLabel = '⚖️ 균형 재정 (건전 재정)';
    statusColor = '#38bdf8';
  } else if (netIncome >= -5.0) {
    statusLabel = '⚠️ 경미한 적자 (지출 점검 필요)';
    statusColor = '#fbbf24';
  } else {
    statusLabel = '🚨 심각한 재정 적자 (군비 감축 시급)';
    statusColor = '#f87171';
  }

  return {
    grossIncome,
    grossExpense,
    netIncome,
    currencyName,
    formattedNet,
    incomeItems,
    expenseItems,
    statusLabel,
    statusColor
  };
}
