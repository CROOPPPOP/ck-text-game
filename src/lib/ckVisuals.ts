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

export interface CKResourceGainItem {
  id: string;
  name: string;
  amount: number;
  desc: string;
}

export interface CKResourceGainBreakdown {
  totalGain: number;           // 턴 당 최종 증가치
  formattedGain: string;       // UI 표기용 (예: "+2.8/턴")
  baseRankGain: number;        // 신분 기본치
  facilityGain: number;        // 거점 부속 시설 기여
  relationGain: number;        // 인맥 / 후원자 / 특성 기여
  statModifierPercent: number; // 능력치 시너지 증폭율 (+38%)
  tierBonusPercent: number;    // 명망/신앙 단계별 증폭율 (+55%)
  breakdownItems: CKResourceGainItem[];
}

export interface CKMilitaryUnit {
  name: string;
  count: number;
  category: 'knight' | 'infantry' | 'cavalry' | 'scout' | 'garrison' | 'retinue';
  desc: string;
  badge: string;
  icon?: string;
  type?: string;
  description?: string;
  morale?: string;
}

export interface CKDynamicLeviesBreakdown {
  totalCount: number;
  formattedTotal: string;
  combatReadiness: number; // 0~100%
  units: CKMilitaryUnit[];
  garrisonCount: number;
  retinueCount: number;
  combatTroopsCount?: number;
  rankBaseCount: number;
  // UI 호환 별칭 속성
  totalLevies: number;
  baseLevies: number;
  holdingBonus: number;
  unitsBonus: number;
  breakdownText?: string;
}

/**
 * 부동소수점 연산 오차 방지 및 점수/수치 포맷터 (IEEE 754 보정)
 * 예: 36.599999999999994 -> '36.6', 30.0 -> '30', 100.19999999999999 -> '100.2'
 */
export function formatDecimal(val: number | string | undefined | null): string {
  if (val === undefined || val === null) return '0';
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  if (isNaN(num)) return '0';
  const rounded = Math.round(num * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
}

export interface CKResources {
  gold: string;
  wealth?: string;             // UI 호환 별칭 (보유 재산 문자열)
  wealthGain?: { formattedNet?: string }; // UI 호환 별칭 (순수익)
  prestige: string;
  prestigeScore: number;       // 현재 보유 위신 (소모 가능한 수치, 상한 없음)
  prestigeLifetimeScore?: number; // 역대 누적 위신
  prestigeLevel: string;       // CK3 스타일 위신 단계 명칭 (예: '저명인사', '살아있는 전설')
  prestigeTier: number;        // 위신 단계 티어 (1 ~ 5, 점수 소모 시에도 강등되지 않는 영구 등급)
  prestigeGain: CKResourceGainBreakdown; // 턴 당 위신 증가치
  piety: string;
  pietyScore: number;          // 현재 보유 신앙 (소모 가능한 수치, 상한 없음)
  pietyLifetimeScore?: number; // 역대 누적 신앙
  pietyLevel: string;          // CK3 스타일 신앙 단계 명칭 (예: '신앙의 귀감', '지상의 성인')
  pietyTier: number;           // 신앙 단계 티어 (1 ~ 5, 점수 소모 시에도 강등되지 않는 영구 등급)
  pietyGain: CKResourceGainBreakdown;    // 턴 당 신앙 증가치
  levies: string;
  military: CKDynamicLeviesBreakdown;    // 동적 병력 및 군사 조직 상세
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

// 텍스트에서 숫자 추출 (예: "15 (+2)" -> 17, "35.8 (+0.8/턴)" -> 35.8, "보통 (65%)" -> 65)
export function extractNumericValue(raw: string | undefined, defaultValue: number = 0): number {
  if (!raw || typeof raw !== 'string') return defaultValue;
  const trimmed = raw.trim();
  if (!trimmed) return defaultValue;
  
  // (15 (+2)) 또는 (35.8 (+0.8/턴)) 포맷
  const matchWithBonus = trimmed.match(/(\d+(?:\.\d+)?)\s*\(([+-]?\d+(?:\.\d+)?)/);
  if (matchWithBonus) {
    const base = parseFloat(matchWithBonus[1]);
    const bonus = parseFloat(matchWithBonus[2]);
    // 괄호 안에 이미 턴당 증가율 등이 표시된 경우, 앞의 base가 누적 총합임
    if (trimmed.includes('/턴') || trimmed.includes('/turn') || trimmed.includes('/t')) {
      return Math.max(0, Math.round(base * 10) / 10);
    }
    return Math.max(0, Math.round((base + bonus) * 10) / 10);
  }

  // 단순 숫자 (소수점 포함)
  const numMatch = trimmed.match(/(\d+(?:\.\d+)?)/);
  if (numMatch) {
    return Math.max(0, Math.round(parseFloat(numMatch[1]) * 10) / 10);
  }

  // 등급형 텍스트
  if (trimmed.includes('전설') || trimmed.includes('극') || trimmed.includes('초인') || trimmed.includes('최상')) return 22;
  if (trimmed.includes('상') || trimmed.includes('높음') || trimmed.includes('탁월') || trimmed.includes('우수')) return 16;
  if (trimmed.includes('중') || trimmed.includes('보통') || trimmed.includes('평범')) return 10;
  if (trimmed.includes('하') || trimmed.includes('낮음') || trimmed.includes('미흡')) return 6;
  if (trimmed.includes('최하') || trimmed.includes('위태') || trimmed.includes('취약')) return 3;

  return defaultValue;
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
        sum += extractNumericValue(val, 40);
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

// 명망/위신 단계별 턴 당 획득량 증폭율 (Tier Bonus Percent)
export function getPrestigeTierBonusPercent(tier: number): number {
  if (tier >= 5) return 90; // Lv.5 불멸의 귀감: +90%
  if (tier >= 4) return 55; // Lv.4 살아있는 전설: +55%
  if (tier >= 3) return 30; // Lv.3 저명인사: +30%
  if (tier >= 2) return 15; // Lv.2 인정받음: +15%
  return 0;                 // Lv.1 무명인: +0%
}

// 신앙 단계별 턴 당 획득량 증폭율 (Tier Bonus Percent)
export function getPietyTierBonusPercent(tier: number): number {
  if (tier >= 5) return 90; // Lv.5 지상의 성인: +90%
  if (tier >= 4) return 55; // Lv.4 신앙의 모범: +55%
  if (tier >= 3) return 30; // Lv.3 신앙의 기둥: +30%
  if (tier >= 2) return 15; // Lv.2 독실함: +15%
  return 0;                 // Lv.1 형식적 신도: +0%
}

// 위신 단계 룰 (CK3 5-Tier Level of Fame & Reputation)
// permanentTierFloor: 신분/칭호/도달 이력에 따른 최저 보장 단계
export function getPrestigeLevelInfo(score: number, permanentTierFloor: number = 1): { tier: number; label: string; nextThreshold: number; desc: string } {
  let naturalTier = 1;
  let label = '무명인';
  let desc = '세간에 널리 알려지지 않은 평범한 인물';
  let nextThreshold = 40;

  if (score >= 300) {
    naturalTier = 5;
    label = '불멸의 귀감';
    desc = '역사에 영원히 기록될 불멸의 군주이자 성현 (모든 최고위 결단 개방)';
    nextThreshold = 500;
  } else if (score >= 160) {
    naturalTier = 4;
    label = '살아있는 전설';
    desc = '당대 최고의 영향력과 위세를 지닌 위대한 영걸 (막후 권력 행사 가능)';
    nextThreshold = 300;
  } else if (score >= 90) {
    naturalTier = 3;
    label = '저명인사';
    desc = '인근 제후들과 고위 성직자들 사이에서 이름이 널리 알려짐';
    nextThreshold = 160;
  } else if (score >= 40) {
    naturalTier = 2;
    label = '인정받음';
    desc = '지역 교구와 영지 일대에서 신망을 얻기 시작함';
    nextThreshold = 90;
  } else {
    naturalTier = 1;
    label = '무명인';
    desc = '세간에 널리 알려지지 않은 평범한 인물';
    nextThreshold = 40;
  }

  // 영구 단계 보장: 점수를 소모하여 현재 점수가 낮아졌더라도 한 번 도달한 단계는 떨어지지 않음!
  const finalTier = Math.max(naturalTier, permanentTierFloor);
  if (finalTier > naturalTier) {
    if (finalTier === 5) { label = '불멸의 귀감'; desc = '역사에 영원히 기록될 불멸의 군주이자 성현 (영구 위상 유지)'; nextThreshold = 500; }
    else if (finalTier === 4) { label = '살아있는 전설'; desc = '당대 최고의 영향력과 위세를 지닌 위대한 영걸 (영구 위상 유지)'; nextThreshold = 300; }
    else if (finalTier === 3) { label = '저명인사'; desc = '인근 제후들과 고위 성직자들 사이에서 이름이 널리 알려짐 (영구 위상 유지)'; nextThreshold = 160; }
    else if (finalTier === 2) { label = '인정받음'; desc = '지역 교구와 영지 일대에서 신망을 얻기 시작함 (영구 위상 유지)'; nextThreshold = 90; }
  }

  return { tier: finalTier, label, nextThreshold, desc };
}

// 신앙 단계 룰 (CK3 5-Tier Level of Devotion & Morale)
export function getPietyLevelInfo(score: number, archetype: PlayerArchetype = 'noble', permanentTierFloor: number = 1): { tier: number; label: string; nextThreshold: number; desc: string } {
  let naturalTier = 1;
  let label = '형식적 신도';
  let desc = '의무적인 종교 의례만 준수함';
  let nextThreshold = 40;

  if (archetype === 'company' || archetype === 'wanderer') {
    if (score >= 300) { naturalTier = 5; label = '전설적 의기'; desc = '죽음도 두려워하지 않는 완벽한 맹세'; nextThreshold = 500; }
    else if (score >= 160) { naturalTier = 4; label = '일기당천'; desc = '불굴의 결속력으로 어떤 역경도 돌파함'; nextThreshold = 300; }
    else if (score >= 90) { naturalTier = 3; label = '용기백배'; desc = '자신감이 넘치고 전투 의지가 충천함'; nextThreshold = 160; }
    else if (score >= 40) { naturalTier = 2; label = '평온'; desc = '명령에 순응하며 기본 임무 수행 가능'; nextThreshold = 90; }
    else { naturalTier = 1; label = '사기 저하'; desc = '규율이 흐트러지고 동요가 심함'; nextThreshold = 40; }
  } else {
    if (score >= 300) { naturalTier = 5; label = '지상의 성인'; desc = '기적과 성스러움으로 추앙받는 살아있는 성인 (최고위 신성 결단 개방)'; nextThreshold = 500; }
    else if (score >= 160) { naturalTier = 4; label = '신앙의 모범'; desc = '교황청과 고위 성직자들도 경의를 표하는 성덕'; nextThreshold = 300; }
    else if (score >= 90) { naturalTier = 3; label = '신앙의 기둥'; desc = '교단과 교구 신도들의 영적 본보기가 됨'; nextThreshold = 160; }
    else if (score >= 40) { naturalTier = 2; label = '독실함'; desc = '성실한 신앙생활과 기도로 덕망을 쌓음'; nextThreshold = 90; }
    else { naturalTier = 1; label = '형식적 신도'; desc = '의무적인 종교 의례만 준수함'; nextThreshold = 40; }
  }

  const finalTier = Math.max(naturalTier, permanentTierFloor);
  if (finalTier > naturalTier) {
    if (archetype === 'company' || archetype === 'wanderer') {
      if (finalTier === 5) { label = '전설적 의기'; desc = '죽음도 두려워하지 않는 완벽한 맹세 (영구 위상 유지)'; nextThreshold = 500; }
      else if (finalTier === 4) { label = '일기당천'; desc = '불굴의 결속력으로 어떤 역경도 돌파함 (영구 위상 유지)'; nextThreshold = 300; }
      else if (finalTier === 3) { label = '용기백배'; desc = '자신감이 넘치고 전투 의지가 충천함 (영구 위상 유지)'; nextThreshold = 160; }
      else if (finalTier === 2) { label = '평온'; desc = '명령에 순응하며 기본 임무 수행 가능 (영구 위상 유지)'; nextThreshold = 90; }
    } else {
      if (finalTier === 5) { label = '지상의 성인'; desc = '기적과 성스러움으로 추앙받는 살아있는 성인 (영구 위상 유지)'; nextThreshold = 500; }
      else if (finalTier === 4) { label = '신앙의 모범'; desc = '교황청과 고위 성직자들도 경의를 표하는 성덕 (영구 위상 유지)'; nextThreshold = 300; }
      else if (finalTier === 3) { label = '신앙의 기둥'; desc = '교단과 교구 신도들의 영적 본보기가 됨 (영구 위상 유지)'; nextThreshold = 160; }
      else if (finalTier === 2) { label = '독실함'; desc = '성실한 신앙생활과 기도로 덕망을 쌓음 (영구 위상 유지)'; nextThreshold = 90; }
    }
  }

  return { tier: finalTier, label, nextThreshold, desc };
}

// 턴 당 위신 증가치 산출 함수
export function calculateTurnPrestigeGain(gameState: ParsedState, prestigeTier: number = 1): CKResourceGainBreakdown {
  const archetype = detectPlayerArchetype(gameState);
  const attributes = calculateCKAttributes(gameState);
  const statusStr = ((gameState.personalInfo?.['신분'] || '') + ' ' + (gameState.personalInfo?.['직위'] || '')).toLowerCase();
  const titleStr = (gameState.personalInfo?.['칭호'] || '').toLowerCase();
  const items: CKResourceGainItem[] = [];

  // 1. 신분 품계 기본 증가치
  let baseRankGain = 0.5;
  if (statusStr.includes('황제') || statusStr.includes('교황')) baseRankGain = 3.0;
  else if (statusStr.includes('국왕') || statusStr.includes('대공') || statusStr.includes('추기경')) baseRankGain = 2.4;
  else if (statusStr.includes('공작') || statusStr.includes('대주교')) baseRankGain = 1.8;
  else if (statusStr.includes('백작') || statusStr.includes('주교')) baseRankGain = 1.4;
  else if (statusStr.includes('자작') || statusStr.includes('수도원장') || statusStr.includes('남작')) baseRankGain = 1.0;
  else if (statusStr.includes('사제') || statusStr.includes('기사')) baseRankGain = 0.6;
  else baseRankGain = 0.3;

  items.push({
    id: 'rank_base',
    name: '신분 품계 기본 위신',
    amount: baseRankGain,
    desc: '현재 신분 및 직위에 따른 기본 위세'
  });

  // 칭호 보너스
  let titleBonus = 0;
  if (titleStr.includes('막후의 지배자') || titleStr.includes('흑막')) titleBonus = 0.8;
  else if (titleStr.includes('살아있는 전설') || titleStr.includes('영웅')) titleBonus = 1.0;
  else if (titleStr.includes('정복자') || titleStr.includes('대제')) titleBonus = 0.6;
  else if (titleStr && titleStr !== '없음' && titleStr !== '-') titleBonus = 0.4;

  if (titleBonus > 0) {
    items.push({
      id: 'title_bonus',
      name: `'${gameState.personalInfo?.['칭호']}' 칭호 위세`,
      amount: titleBonus,
      desc: '명예로운 칭호에서 비롯되는 막강한 명망'
    });
  }

  // 2. 직할 거점 부속 시설 기여
  let facilityGain = 0;
  const buildings = gameState.estate?.buildings || [];
  buildings.forEach(b => {
    const combined = `${b.name} ${b.desc} ${(b.tags || []).join(' ')}`;
    if (combined.includes('병영') || combined.includes('성벽') || combined.includes('요새') || combined.includes('개선') || combined.includes('무기고') || combined.includes('영주관') || combined.includes('대성당')) {
      facilityGain += 0.3 * (b.level || 1);
    }
  });
  facilityGain = Math.round(facilityGain * 10) / 10;
  if (facilityGain > 0) {
    items.push({
      id: 'facility_prestige',
      name: '거점 위세 시설 기여',
      amount: facilityGain,
      desc: '웅장한 성벽, 병영 및 대성당의 위용'
    });
  }

  // 3. 인맥 및 특성 기여
  let relationGain = 0;
  const personalRels = gameState.relationships?.personal || [];
  personalRels.forEach(rel => {
    if (rel.includes('[직속부하]') || rel.includes('가신') || rel.includes('봉신')) relationGain += 0.1;
  });
  if (gameState.traits?.some(t => t.name.includes('용맹') || t.name.includes('카리스마') || t.name.includes('명성') || t.name.includes('영웅'))) {
    relationGain += 0.5;
  }
  relationGain = Math.round(relationGain * 10) / 10;
  if (relationGain > 0) {
    items.push({
      id: 'relation_prestige',
      name: '가신망 및 특성 명망',
      amount: relationGain,
      desc: '복종하는 부하들과 영웅적 성품'
    });
  }

  // 4. 능력치 시너지 증폭 (외교력 기반)
  const statModifierPercent = attributes.synergies.prestigeModifier; // e.g. +38%

  // 5. 단계별 계단식 증폭 (Tier Bonus)
  const tierBonusPercent = getPrestigeTierBonusPercent(prestigeTier); // e.g. Lv.4 -> +55%

  const baseSum = baseRankGain + titleBonus + facilityGain + relationGain;
  const statMult = 1 + (statModifierPercent / 100);
  const tierMult = 1 + (tierBonusPercent / 100);
  const totalGain = Math.round(baseSum * statMult * tierMult * 10) / 10;

  return {
    totalGain,
    formattedGain: `+${totalGain.toFixed(1)}/턴`,
    baseRankGain,
    facilityGain,
    relationGain,
    statModifierPercent,
    tierBonusPercent,
    breakdownItems: items
  };
}

// 턴 당 신앙 증가치 산출 함수
export function calculateTurnPietyGain(gameState: ParsedState, pietyTier: number = 1): CKResourceGainBreakdown {
  const archetype = detectPlayerArchetype(gameState);
  const attributes = calculateCKAttributes(gameState);
  const statusStr = ((gameState.personalInfo?.['신분'] || '') + ' ' + (gameState.personalInfo?.['직위'] || '')).toLowerCase();
  const items: CKResourceGainItem[] = [];

  // 1. 신분 품계 기본 증가치
  let baseRankGain = 0.4;
  if (archetype === 'clergy') {
    if (statusStr.includes('교황')) baseRankGain = 3.5;
    else if (statusStr.includes('추기경') || statusStr.includes('대주교')) baseRankGain = 2.8;
    else if (statusStr.includes('주교')) baseRankGain = 2.0;
    else if (statusStr.includes('수도원장')) baseRankGain = 1.4;
    else if (statusStr.includes('사제') || statusStr.includes('신부')) baseRankGain = 1.0;
    else baseRankGain = 0.5;
  } else {
    baseRankGain = 0.4;
  }

  items.push({
    id: 'rank_base_piety',
    name: '성직 품계 기본 신앙',
    amount: baseRankGain,
    desc: '기도, 미사 집전 및 성직 직무에 따른 영성 축적'
  });

  // 2. 성당 / 수도원 부속 시설 기여
  let facilityGain = 0;
  const buildings = gameState.estate?.buildings || [];
  buildings.forEach(b => {
    const combined = `${b.name} ${b.desc} ${(b.tags || []).join(' ')}`;
    if (combined.includes('예배당') || combined.includes('성당') || combined.includes('수도원') || combined.includes('서재') || combined.includes('성유물') || combined.includes('안치실') || combined.includes('약초원') || combined.includes('구빈원')) {
      facilityGain += 0.4 * (b.level || 1);
    }
  });
  facilityGain = Math.round(facilityGain * 10) / 10;
  if (facilityGain > 0) {
    items.push({
      id: 'facility_piety',
      name: '성당 및 수도원 시설 기여',
      amount: facilityGain,
      desc: '신도 기도실, 성경 필사실 및 구빈원의 성덕'
    });
  }

  // 3. 후원자 및 특성 기여
  let relationGain = 0;
  const personalRels = gameState.relationships?.personal || [];
  personalRels.forEach(rel => {
    if (rel.includes('[후원자]') || rel.includes('미망인') || rel.includes('신도')) relationGain += 0.3;
  });
  if (gameState.traits?.some(t => t.name.includes('신앙') || t.name.includes('독실') || t.name.includes('순례') || t.name.includes('성자') || t.name.includes('학자'))) {
    relationGain += 0.5;
  }
  relationGain = Math.round(relationGain * 10) / 10;
  if (relationGain > 0) {
    items.push({
      id: 'relation_piety',
      name: '독실한 후원자 및 성덕 특성',
      amount: relationGain,
      desc: '유력 신도의 십일조 후원과 경건한 영성'
    });
  }

  // 4. 능력치 시너지 증폭 (학습력 기반)
  const statModifierPercent = attributes.synergies.pietyModifier; // e.g. +40%

  // 5. 단계별 계단식 증폭 (Tier Bonus)
  const tierBonusPercent = getPietyTierBonusPercent(pietyTier); // e.g. Lv.5 -> +90%

  const baseSum = baseRankGain + facilityGain + relationGain;
  const statMult = 1 + (statModifierPercent / 100);
  const tierMult = 1 + (tierBonusPercent / 100);
  const totalGain = Math.round(baseSum * statMult * tierMult * 10) / 10;

  return {
    totalGain,
    formattedGain: `+${totalGain.toFixed(1)}/턴`,
    baseRankGain,
    facilityGain,
    relationGain,
    statModifierPercent,
    tierBonusPercent,
    breakdownItems: items
  };
}

// 군사 부대 및 수행단 아이템 판별 헬퍼 (엄격 판별 및 문서/영지/소지품 오분류 방지)
export function isMilitaryOrRetinueItem(name: string, desc: string = ''): boolean {
  const cleanName = (name || '').trim();
  if (!cleanName || cleanName === '재산' || cleanName.includes('은화') || cleanName.includes('금화') || cleanName.includes('동화')) {
    return false;
  }

  // 1. 헤더/이름 추출 (콜론, 대괄호, 괄호 분리)
  let itemName = cleanName;
  const bracketMatch = cleanName.match(/^\[(.*?)\]/);
  if (bracketMatch) {
    itemName = bracketMatch[1].trim();
  } else if (cleanName.includes(':') || cleanName.includes('：')) {
    itemName = cleanName.split(/[:：]/)[0].trim();
  } else if (cleanName.includes('(')) {
    itemName = cleanName.split('(')[0].trim();
  }
  itemName = itemName.replace(/^[:：\s▶•\-○]+/, '').trim();

  // 2. 비군사 / 비부대 아이템 엄격 제외 키워드 (Exclusion Rules)
  // 1) 기밀 문서, 서적, 일지, 기록물 (절대 병력/수행단이 아님)
  const documentKeywords = [
    '문서', '문서록', '문서철', '치부', '치부책', '서적', '책', '일지', '장부',
    '기록', '서찰', '비망록', '원고', '성경', '고문서', '원본', '양피지', '계약서', '밀서', '칙서', '교서'
  ];
  if (documentKeywords.some(k => itemName.includes(k))) {
    return false;
  }

  // 2) 영지, 장원, 건물, 시설 (건물/인프라는 garrison/estate로 별도 처리)
  const estateKeywords = [
    '장원', '영지', '거점', '별장', '공방', '서재', '식료창고', '조제실',
    '시장', '대시장', '성당 건물', '대사제관', '본당', '압착장', '방앗간', '대장간', '안치실'
  ];
  if (estateKeywords.some(k => itemName.includes(k))) {
    return false;
  }

  // 3) 재화, 화폐, 원자재
  const wealthKeywords = ['재산', '은화', '금화', '동화', '화폐', '금괴', '식량', '목재', '석재', '자금', '닢'];
  if (wealthKeywords.some(k => itemName.includes(k))) {
    return false;
  }

  // 4) 장비, 성물, 의복
  const equipKeywords = ['성의', '성물', '유물', '갑옷', '투구', '방패', '십자가', '성배', '반지', '지팡이', '유골', '유품'];
  if (equipKeywords.some(k => itemName.includes(k)) && !itemName.includes('기사') && !itemName.includes('보병') && !itemName.includes('수비')) {
    return false;
  }

  // 3. 군사 부대 및 가신 수행단 키워드 매칭
  // 주의: 설명문(desc)에 단순 언급된 부대명(예: "밀정단이 수집한 문서")으로 인한 오판 방지를 위해
  // 아이템 이름(itemName) 또는 대괄호 안의 명칭을 1차 기준으로 검사합니다.
  const militaryKeywords = [
    '기사', '기사단', '수도회', '수도보병', '보병', '궁수', '기병', '상비군', '민병',
    '용병', '군단', '부대', '전투원', '사병', '경비', '경비대', '호위', '호위대', '수비대', '방위군',
    '결사대', '친위대', '척후', '척후병',
    '첩보', '첩보대', '밀정', '밀정단', '공작원', '암영',
    '수사', '수도사', '서기', '복사', '산파', '산파단', '장인 길드'
  ];

  // 이름 자체가 군사/수행단 키워드를 가지고 있는지 확인
  const isNameMilitary = militaryKeywords.some(k => itemName.includes(k));
  if (isNameMilitary) return true;

  // 이름에 인원수(예: 76명, 10인 등)가 명시되어 있고 설명문에 부대 키워드가 포함된 경우 허용
  const hasCount = /\d+\s*(?:명|인|기|대)/.test(itemName);
  const isDescMilitary = militaryKeywords.some(k => desc.includes(k));

  return hasCount && isDescMilitary;
}

// 동적 병력 산정 엔진 (Dynamic Levies Engine)
export function calculateDynamicLevies(gameState: ParsedState): CKDynamicLeviesBreakdown {
  const statusStr = ((gameState.personalInfo?.['신분'] || '') + ' ' + (gameState.personalInfo?.['직위'] || '')).toLowerCase();
  const units: CKMilitaryUnit[] = [];

  // 1. 소지품 / 자원 / 세력 내 부대 및 군사 조직 파싱
  const allInventoryItems: string[] = [];
  if (gameState.inventory) {
    Object.values(gameState.inventory).forEach(items => {
      if (Array.isArray(items)) {
        allInventoryItems.push(...items);
      }
    });
  }

  allInventoryItems.forEach(itemStr => {
    const raw = String(itemStr || '').trim();
    if (!raw) return;

    if (isMilitaryOrRetinueItem(raw)) {
      // 1) 인원수 추출 (총 X명 최우선 인식)
      let count = 0;
      const totalMatch = raw.match(/총\s*(\d+)\s*(?:명|인|기|대)/);
      if (totalMatch) {
        count = parseInt(totalMatch[1], 10);
      } else {
        const bracketMatch = raw.match(/\[\s*(\d+)\s*(?:명|인|기|대)\s*\]/);
        if (bracketMatch) {
          count = parseInt(bracketMatch[1], 10);
        } else {
          const numMatch = raw.match(/(\d+)\s*(?:명|인|기|대)/);
          if (numMatch) {
            count = parseInt(numMatch[1], 10);
          }
        }
      }
      if (count === 0) count = 1;

      // 2) 괄호 안의 설명문 분리
      let uDesc = '';
      const parenMatch = raw.match(/\((.*?)\)/);
      if (parenMatch) {
        uDesc = parenMatch[1].trim();
      }

      // 3) 부대 이름 분리
      let uName = '';
      const leadBracket = raw.match(/^\[(.*?)\]\s*(.*)/);
      if (leadBracket && !/^\d+\s*(?:명|인|기|대)$/.test(leadBracket[1].trim())) {
        uName = leadBracket[1].trim();
        // 대괄호 안에 부대명과 인원수가 함께 들어있다면 인원수 제거 (예: [성 미카엘 기사수도회 25명] -> 성 미카엘 기사수도회)
        uName = uName.replace(/\d+\s*(?:명|인|기|대)/g, '').trim();
        if (!uDesc && leadBracket[2]) uDesc = leadBracket[2].replace(/\(.*?\)/, '').trim();
      } else {
        // [76명] 패턴 및 괄호 제거 후 이름 추출
        uName = raw
          .replace(/\[\d+\s*(?:명|인|기|대)\]/g, '')
          .replace(/\(.*?\)/g, '')
          .replace(/^[:：\s▶•\-○]+/, '')
          .trim();
        uName = uName.replace(/\d+\s*(?:명|인|기|대)/g, '').trim();
        if (uName.includes(':') || uName.includes('：')) {
          const parts = uName.split(/[:：]/);
          uName = parts[0].trim();
          if (!uDesc && parts[1]) uDesc = parts[1].trim();
        }
      }
      if (!uName) uName = raw.split(/[:：(]/)[0].replace(/^[:：\s▶•\-○]+/, '').trim() || '직속 부대';

      if (uDesc.startsWith(':') || uDesc.startsWith('：')) {
        uDesc = uDesc.slice(1).trim();
      }

      let category: CKMilitaryUnit['category'] = 'retinue';
      let badge = '🛡️ 직속 조직';
      let icon = '🛡️';
      let type = '직속 제대';
      let morale = '높음 (사기 충만)';

      if (uName.includes('기사') || uDesc.includes('기사') || uName.includes('보병') || uDesc.includes('보병') || uName.includes('수도회') || uName.includes('군단') || uName.includes('용병')) {
        category = 'knight';
        badge = '⚔️ 정예 군단';
        icon = '⚔️';
        type = '정예 기사단';
      } else if (uName.includes('첩보') || uName.includes('밀정') || uDesc.includes('공작원') || uName.includes('암영')) {
        category = 'scout';
        badge = '🗡️ 특수 공작';
        icon = '🗡️';
        type = '특수 첩보단';
        morale = '신중 (비밀 공작)';
      } else if (uName.includes('수비') || uName.includes('경비') || uName.includes('순찰') || uName.includes('방위')) {
        category = 'garrison';
        badge = '🏹 방어 병력';
        icon = '🏹';
        type = '거점 수비대';
        morale = '보통 (상비 주둔)';
      } else {
        category = 'retinue';
        badge = '📜 가신 수행단';
        icon = '📜';
        type = '가신 수행단';
        morale = '높음 (사기 충만)';
      }

      units.push({
        name: uName,
        count,
        category,
        desc: uDesc || badge,
        badge,
        icon,
        type,
        description: uDesc || badge,
        morale
      });
    }
  });

  // 2. 거점 군사 시설 기여 (Garrison)
  let garrisonCount = 0;
  const buildings = gameState.estate?.buildings || [];
  buildings.forEach(b => {
    const combined = `${b.name} ${b.desc || ''} ${(b.tags || []).join(' ')}`;
    if (combined.includes('병영') || combined.includes('훈련') || combined.includes('요새') || combined.includes('성벽') || combined.includes('망루') || combined.includes('군사') || combined.includes('치안')) {
      const bLv = Math.max(1, b.level || 1);
      garrisonCount += bLv * 15;
    }
  });

  if (garrisonCount > 0) {
    const rawEstateType = gameState.estate?.type || '거점';
    const cleanEstateType = rawEstateType
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .trim() || '거점';
    units.push({
      name: `${cleanEstateType} 직할 수비대`,
      count: garrisonCount,
      category: 'garrison',
      desc: '영지 군사 훈련소 및 성벽에 주둔하는 상비 징집 경비병',
      badge: '🏹 거점 수비병',
      icon: '🏹',
      type: '거점 방위군',
      description: '영지 군사 훈련소 및 성벽에 주둔하는 상비 징집 경비병',
      morale: '보통 (상비 주둔)'
    });
  }

  // 3. 신분 기본 병력
  let rankBaseCount = 10;
  if (statusStr.includes('황제') || statusStr.includes('교황')) rankBaseCount = 300;
  else if (statusStr.includes('국왕') || statusStr.includes('대주교') || statusStr.includes('대공')) rankBaseCount = 150;
  else if (statusStr.includes('공작') || statusStr.includes('주교')) rankBaseCount = 60;
  else if (statusStr.includes('백작') || statusStr.includes('수도원장')) rankBaseCount = 35;
  else if (statusStr.includes('자작') || statusStr.includes('남작')) rankBaseCount = 25;
  else if (statusStr.includes('기사') || statusStr.includes('용병대장')) rankBaseCount = 20;
  else if (statusStr.includes('사제')) rankBaseCount = 12;
  else rankBaseCount = 5;

  // 4. 총 병력 합산 (직속 부대 + 거점 수비대 + 직위 기본 상비군)
  const unitsBonus = units.filter(u => u.category !== 'garrison').reduce((acc, u) => acc + u.count, 0);
  const holdingBonus = garrisonCount;
  const baseLevies = rankBaseCount;
  const totalCount = unitsBonus > 0 ? (unitsBonus + holdingBonus + baseLevies) : (holdingBonus + baseLevies);
  const totalLevies = totalCount;

  // 세부 군종 카운트
  const eliteCount = units.filter(u => u.category === 'knight').reduce((acc, u) => acc + u.count, 0);
  const scoutCount = units.filter(u => u.category === 'scout').reduce((acc, u) => acc + u.count, 0);
  const retinueTotal = units.filter(u => u.category === 'retinue').reduce((acc, u) => acc + u.count, 0);
  const combatTroopsCount = eliteCount + scoutCount + units.filter(u => u.category === 'infantry' || u.category === 'cavalry').reduce((acc, u) => acc + u.count, 0);

  let formattedTotal = `총 ${totalCount}명`;
  if (eliteCount > 0 && scoutCount > 0) {
    formattedTotal = `총 ${totalCount}명 (정예 ${eliteCount}명, 첩보 ${scoutCount}명)`;
  } else if (eliteCount > 0) {
    formattedTotal = `총 ${totalCount}명 (정예 ${eliteCount}명)`;
  } else if (holdingBonus > 0) {
    formattedTotal = `총 ${totalCount}명 (수비대 ${holdingBonus}명)`;
  }

  const combatReadiness = Math.min(98, Math.max(50, 75 + (eliteCount > 0 ? 15 : 0) + (holdingBonus > 0 ? 10 : 0)));

  return {
    totalCount,
    totalLevies,
    baseLevies,
    holdingBonus,
    unitsBonus,
    formattedTotal,
    combatReadiness,
    units,
    garrisonCount,
    retinueCount: retinueTotal,
    combatTroopsCount,
    rankBaseCount,
    breakdownText: `직속 제대(${unitsBonus}명) + 거점 군사 시설(${holdingBonus}명) + 신분 상비군(${baseLevies}명) = 총 ${totalLevies}명`
  };
}

// CK3 핵심 자원 요약 추출
export function parseCKResources(gameState: ParsedState, previousPopulation?: number): CKResources {
  const faction = gameState.factionState || {};
  const rawWealth: any = gameState.inventory?.wealth;
  const wealthItems: string[] = Array.isArray(rawWealth)
    ? rawWealth
    : typeof rawWealth === 'string' && rawWealth.trim()
    ? [rawWealth.trim()]
    : [];
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

  const statusStr = ((gameState.personalInfo?.['신분'] || '') + ' ' + (gameState.personalInfo?.['직위'] || '')).toLowerCase();
  const titleStr = (gameState.personalInfo?.['칭호'] || '').toLowerCase();

  // 칭호 가중치
  let titlePrestigeBonus = 0;
  if (titleStr.includes('막후의 지배자') || titleStr.includes('흑막')) titlePrestigeBonus = 25;
  else if (titleStr.includes('살아있는 전설') || titleStr.includes('영웅')) titlePrestigeBonus = 30;
  else if (titleStr.includes('정복자') || titleStr.includes('대제')) titlePrestigeBonus = 20;
  else if (titleStr.includes('성자') || titleStr.includes('현자')) titlePrestigeBonus = 20;
  else if (titleStr && titleStr !== '없음' && titleStr !== '-') titlePrestigeBonus = 12;

  // 신분 및 칭호 기반 최저 보장 단계 (Permanent Tier Floor)
  let prestigeTierFloor = 1;
  let pietyTierFloor = 1;

  if (statusStr.includes('교황') || statusStr.includes('황제')) {
    prestigeTierFloor = 5;
    pietyTierFloor = 5;
  } else if (statusStr.includes('추기경') || statusStr.includes('대주교') || statusStr.includes('대공') || statusStr.includes('국왕')) {
    prestigeTierFloor = 4;
    pietyTierFloor = 4;
  } else if (statusStr.includes('주교') || statusStr.includes('백작') || statusStr.includes('공작')) {
    // 주교 + 막후의 지배자 = Tier 4 보장
    prestigeTierFloor = titlePrestigeBonus >= 20 ? 4 : 3;
    pietyTierFloor = 4;
  } else if (statusStr.includes('수도원장') || statusStr.includes('자작') || statusStr.includes('남작')) {
    prestigeTierFloor = 2;
    pietyTierFloor = 3;
  } else if (statusStr.includes('사제') || statusStr.includes('기사')) {
    prestigeTierFloor = 2;
    pietyTierFloor = 2;
  }

  // 1) 위신 (명성) 점수 및 단계 정밀 산출 (소모성 자원, 상한 100 철폐)
  let prestigeScore = 30;
  const rawPrestige = gameState.stats?.acquired?.['명성'] || 
                      gameState.stats?.acquired?.['위신'] || 
                      gameState.stats?.acquired?.['교단 발언권'] || 
                      gameState.stats?.acquired?.['교단발언권'] || 
                      gameState.stats?.acquired?.['발언권'] || 
                      gameState.personalInfo?.['명성'] || 
                      gameState.personalInfo?.['위신'] || 
                      gameState.personalInfo?.['교단 발언권'] || 
                      gameState.personalInfo?.['교단발언권'] || '';
  const parsedPrestigeNum = extractNumericValue(rawPrestige, 0);

  if (parsedPrestigeNum > 0) {
    prestigeScore = parsedPrestigeNum;
  } else {
    // 신분 티어 기반 기본 점수 산출
    let basePrestige = 35;
    if (statusStr.includes('황제') || statusStr.includes('교황')) basePrestige = 180;
    else if (statusStr.includes('국왕') || statusStr.includes('대공') || statusStr.includes('추기경')) basePrestige = 140;
    else if (statusStr.includes('공작') || statusStr.includes('대주교')) basePrestige = 110;
    else if (statusStr.includes('백작') || statusStr.includes('주교')) basePrestige = 85;
    else if (statusStr.includes('보좌주교') || statusStr.includes('자작')) basePrestige = 65;
    else if (statusStr.includes('남작') || statusStr.includes('수도원장')) basePrestige = 50;
    else if (statusStr.includes('사제') || statusStr.includes('기사')) basePrestige = 38;
    else if (statusStr.includes('평민') || statusStr.includes('수도사')) basePrestige = 25;

    // 능력치 시너지 (외교, 군사, 기량)
    const synergyBonus = Math.round(attributes.diplomacy.value * 0.4 + attributes.martial.value * 0.25 + attributes.prowess.value * 0.15);
    const traitBonus = (gameState.traits?.some(t => t.name.includes('명성') || t.name.includes('위신') || t.name.includes('영웅')) ? 20 : 0);
    prestigeScore = Math.max(10, basePrestige + titlePrestigeBonus + synergyBonus + traitBonus);
  }

  const prestigeLevelInfo = getPrestigeLevelInfo(prestigeScore, prestigeTierFloor);
  const prestigeGain = calculateTurnPrestigeGain(gameState, prestigeLevelInfo.tier);
  const prestige = `${prestigeScore}점 (${prestigeLevelInfo.label})`;

  // 2) 신앙 / 사기 점수 및 단계 정밀 산출 (소모성 자원, 상한 100 철폐)
  let pietyScore = 40;
  const pietyStatus = gameState.playerStatus?.find(s => s.name.includes('신앙') || s.name.includes('경건') || s.name.includes('사기'));
  const parsedPietyNum = pietyStatus ? extractNumericValue(pietyStatus.value, 0) : 0;

  if (parsedPietyNum > 0) {
    pietyScore = parsedPietyNum;
  } else {
    // 신분 티어 기반 기본 점수 산출
    let basePiety = 40;
    if (archetype === 'clergy') {
      if (statusStr.includes('교황') || statusStr.includes('추기경')) basePiety = 180;
      else if (statusStr.includes('대주교') || statusStr.includes('주교')) basePiety = 110;
      else if (statusStr.includes('보좌주교') || statusStr.includes('수도원장')) basePiety = 75;
      else if (statusStr.includes('사제') || statusStr.includes('신부')) basePiety = 55;
      else basePiety = 45;
    } else {
      basePiety = 35;
    }

    // 학문/영성(Learning) 시너지
    const learningBonus = Math.round(attributes.learning.value * 0.7);
    const traitBonus = (gameState.traits?.some(t => t.name.includes('신앙') || t.name.includes('성직') || t.name.includes('독실') || t.name.includes('순례')) ? 20 : 0);
    pietyScore = Math.max(10, basePiety + learningBonus + traitBonus);
  }

  const pietyLevelInfo = getPietyLevelInfo(pietyScore, archetype, pietyTierFloor);
  const pietyGain = calculateTurnPietyGain(gameState, pietyLevelInfo.tier);
  const piety = `${pietyScore}점 (${pietyLevelInfo.label})`;

  // 동적 병력 산정 엔진 (군사 조직, 거점 군사 시설, 신분 기본치 합산)
  const military = calculateDynamicLevies(gameState);
  let levies = faction['병력'] || faction['군사'] || '';
  if (!levies || levies.includes('수도사 12명') || levies.includes('상비군 50명') || levies.includes('단신') || levies.includes('정예 단원 24명') || military.units.length > 0) {
    levies = military.formattedTotal;
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
    wealth: gold,
    wealthGain: { formattedNet: income.formattedNet },
    prestige,
    prestigeScore,
    prestigeLevel: prestigeLevelInfo.label,
    prestigeTier: prestigeLevelInfo.tier,
    prestigeGain,
    piety,
    pietyScore,
    pietyLevel: pietyLevelInfo.label,
    pietyTier: pietyLevelInfo.tier,
    pietyGain,
    levies,
    military,
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
  if (estate?.level !== undefined && estate?.level !== null) {
    if (typeof estate.level === 'number') {
      estateLevelNum = estate.level;
    } else {
      const lvMatch = String(estate.level).match(/(?:Lv\.?|레벨)?\s*(\d+)/i);
      if (lvMatch) estateLevelNum = parseInt(lvMatch[1], 10);
    }
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

/**
 * 턴 경과 시 경제 수지(세력 재정/골드), 명망(위신), 영성(신앙)을 실제 게임 상태에 누적 반영합니다.
 * - AI가 턴마다 수치를 갱신하지 않고 텍스트를 고정 출력하는 한계를 보완하여,
 *   UI 명세서에 표시된 턴당 수지(+N/턴)가 실제 데이터에 정확히 가산/누적되도록 합니다.
 */
export function applyTurnResourceAccumulation(
  newState: ParsedState,
  prevState: ParsedState
): ParsedState {
  if (!newState || !prevState) return newState;

  try {
    // 1. 턴 당 재정 수지 (Net Income) 가산
    const prevIncome = calculateTurnIncome(prevState);
    const netIncome = prevIncome.netIncome; // e.g. +3.2 or -1.5
    const archetype = detectPlayerArchetype(prevState);
    const currencyName = prevIncome.currencyName || (archetype === 'clergy' ? '은화' : archetype === 'wanderer' ? '동화' : '금화');

    // 재정 문자열 업데이트 헬퍼: 기존 포맷("금화 150닢", "은화 45.0닢" 등)을 보존하며 가산
    const updateWealthString = (orig: string, delta: number): string => {
      if (!orig) return `${currencyName} ${Math.max(0, Math.round(delta * 10) / 10)}닢`;
      const match = orig.match(/(\D*?)(\d+(?:\.\d+)?)(.*)/);
      if (match) {
        const prefix = match[1] || '';
        const oldVal = parseFloat(match[2]);
        const suffix = match[3] || '';
        const rawNew = Math.max(0, oldVal + delta);
        const newVal = Number.isInteger(rawNew) ? rawNew : Math.round(rawNew * 10) / 10;
        return `${prefix}${newVal}${suffix}`;
      }
      const rawNew = Math.max(0, delta);
      const newVal = Number.isInteger(rawNew) ? rawNew : Math.round(rawNew * 10) / 10;
      return `${currencyName} ${newVal}닢`;
    };

    // 1-1. 세력 재정 업데이트
    if (newState.factionState && !newState.factionState.none) {
      const curGoldKey = ['세력 재정', '재정', '군자금', '금화'].find(k => newState.factionState?.[k] !== undefined) || '세력 재정';
      const oldVal = newState.factionState[curGoldKey] || prevState.factionState?.[curGoldKey] || '';
      newState.factionState[curGoldKey] = updateWealthString(oldVal, netIncome);
    }

    // 1-2. 개인 소지품(재산) 업데이트
    if (newState.inventory) {
      const origWealth: any = newState.inventory.wealth;
      if (Array.isArray(origWealth) && origWealth.length > 0) {
        newState.inventory.wealth = origWealth.map(w => updateWealthString(String(w), netIncome));
      } else if (typeof origWealth === 'string' && origWealth.trim()) {
        newState.inventory.wealth = [updateWealthString(origWealth.trim(), netIncome)];
      } else {
        const initialWealth = Math.max(0, Math.round(netIncome * 10) / 10);
        newState.inventory.wealth = [`${currencyName} ${initialWealth}닢`];
      }
    }

    // 2. 턴 당 위신 (Prestige / 명성) 가산
    const prevPrestige = parseCKResources(prevState);
    const prestigeGain = calculateTurnPrestigeGain(prevState, prevPrestige.prestigeTier);
    const pGain = prestigeGain.totalGain; // e.g. +1.5

    if (pGain > 0) {
      if (!newState.stats) {
        newState.stats = { innate: {}, acquired: {} };
      }
      if (!newState.stats.acquired) {
        newState.stats.acquired = {};
      }
      if (!newState.stats.innate) {
        newState.stats.innate = {};
      }

      const curPrestigeScore = prevPrestige.prestigeScore;
      const rawNewPrestige = curPrestigeScore + pGain;
      const newPrestigeScore = Number.isInteger(rawNewPrestige) ? rawNewPrestige : Math.round(rawNewPrestige * 10) / 10;

      // acquired 스탯에 명성/위신 수치 누적 갱신
      const prestigeKey = newState.stats.acquired['명성'] !== undefined ? '명성' :
                          newState.stats.acquired['위신'] !== undefined ? '위신' : '명성';
      newState.stats.acquired[prestigeKey] = `${newPrestigeScore} (${prestigeGain.formattedGain})`;

      if (newState.personalInfo) {
        if (newState.personalInfo['명성'] !== undefined) newState.personalInfo['명성'] = `${newPrestigeScore}`;
        if (newState.personalInfo['위신'] !== undefined) newState.personalInfo['위신'] = `${newPrestigeScore}`;
      }
    }

    // 3. 턴 당 신앙 (Piety / 신앙·경건) 가산
    const prevPiety = parseCKResources(prevState);
    const pietyGain = calculateTurnPietyGain(prevState, prevPiety.pietyTier);
    const pietyGainVal = pietyGain.totalGain; // e.g. +2.0

    if (pietyGainVal > 0) {
      const curPietyScore = prevPiety.pietyScore;
      const rawNewPiety = curPietyScore + pietyGainVal;
      const newPietyScore = Number.isInteger(rawNewPiety) ? rawNewPiety : Math.round(rawNewPiety * 10) / 10;

      if (!Array.isArray(newState.playerStatus)) {
        newState.playerStatus = [];
      }
      const pietyIdx = newState.playerStatus.findIndex(s => s && s.name && (s.name.includes('신앙') || s.name.includes('경건') || s.name.includes('사기')));
      if (pietyIdx !== -1) {
        newState.playerStatus[pietyIdx] = {
          ...newState.playerStatus[pietyIdx],
          value: `${newPietyScore}점 (${pietyGain.formattedGain})`
        };
      } else {
        const pietyLabel = archetype === 'clergy' ? '신앙심' : archetype === 'company' ? '부대 사기' : '경건함';
        newState.playerStatus.push({
          name: pietyLabel,
          value: `${newPietyScore}점 (${pietyGain.formattedGain})`,
          risk: '안정',
          description: '턴당 자연 경건성 및 성직 직무 축적'
        });
      }

      if (newState.stats?.acquired) {
        if (newState.stats.acquired['신앙'] !== undefined) newState.stats.acquired['신앙'] = `${newPietyScore}`;
        if (newState.stats.acquired['경건'] !== undefined) newState.stats.acquired['경건'] = `${newPietyScore}`;
      }
    }

    // 4. 동적 병력 (Military & Levies) 갱신 동기화
    const dynamicMilitary = calculateDynamicLevies(newState);
    if (newState.factionState && !newState.factionState.none) {
      const curLevy = newState.factionState['병력'] || newState.factionState['군사'] || '';
      if (!curLevy || curLevy.includes('수도사 12명') || curLevy.includes('상비군 50명') || curLevy.includes('단신') || dynamicMilitary.units.length > 0) {
        newState.factionState['병력'] = dynamicMilitary.formattedTotal;
      }
    }
  } catch (err) {
    console.error('applyTurnResourceAccumulation error:', err);
  }

  return newState;
}

