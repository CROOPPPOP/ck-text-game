// Crusader Kings 3 Style Visual & Attribute Calculation Helpers
import { ParsedState } from './parser';

export interface CKAttributes {
  diplomacy: { value: number; label: string; grade: string; keyStats: string[] };
  martial: { value: number; label: string; grade: string; keyStats: string[] };
  stewardship: { value: number; label: string; grade: string; keyStats: string[] };
  intrigue: { value: number; label: string; grade: string; keyStats: string[] };
  learning: { value: number; label: string; grade: string; keyStats: string[] };
  prowess: { value: number; label: string; grade: string; keyStats: string[] };
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

export interface CKResources {
  gold: string;
  prestige: string;
  piety: string;
  levies: string;
  domain: string;
  archetype: PlayerArchetype;
  archetypeTitle: string;
  labels: CKResourceLabels;
}

export function detectPlayerArchetype(gameState: ParsedState): PlayerArchetype {
  const status = (gameState.personalInfo?.['신분'] || '').toLowerCase();
  const title = (gameState.personalInfo?.['칭호'] || gameState.personalInfo?.['직위'] || '').toLowerCase();
  const estateType = (gameState.estate?.type || '').toLowerCase();

  if (
    status.includes('성직') || status.includes('사제') || status.includes('수도') ||
    status.includes('주교') || status.includes('신부') || status.includes('승려') ||
    status.includes('도사') || status.includes('수사') || title.includes('사제') ||
    title.includes('주교') || estateType.includes('예배당') || estateType.includes('수도원')
  ) {
    return 'clergy';
  }

  if (
    status.includes('용병단') || status.includes('상단') || status.includes('행수') ||
    status.includes('두목') || status.includes('대장') || status.includes('집단') ||
    title.includes('단장') || title.includes('행수') || title.includes('대장')
  ) {
    return 'company';
  }

  if (
    status.includes('방랑') || status.includes('낭인') || status.includes('검객') ||
    status.includes('모험가') || status.includes('유랑') || status.includes('평민') ||
    status.includes('용병') || title.includes('방랑자') || estateType.includes('야영지')
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
function extractNumericValue(raw: string | undefined): number {
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

  const getStat = (names: string[]): number => {
    let sum = 0;
    let count = 0;
    for (const [key, val] of Object.entries(allStats)) {
      if (names.some(n => key.includes(n))) {
        sum += extractNumericValue(val);
        count++;
      }
    }
    return count > 0 ? Math.round(sum / count) : 10;
  };

  // 1. 외교력 (Diplomacy): 매력, 화술, 교섭, 명성, 외교, 신뢰
  const dipScore = getStat(['매력', '화술', '교섭', '외교', '명성', '말솜씨']);
  
  // 2. 무력 (Martial): 근력, 전술, 무술, 통솔, 군사, 통솔력
  const marScore = getStat(['통솔', '전술', '군사', '지휘', '전략', '무술']);

  // 3. 관리력 (Stewardship): 계산, 재정, 지능, 행정, 통치, 내정
  const stewScore = getStat(['행정', '재정', '내정', '지능', '계산', '관리']);

  // 4. 계책력 (Intrigue): 민첩, 눈치, 잠행, 은밀, 독술, 음모, 정보
  const intScore = getStat(['민첩', '눈치', '잠행', '은밀', '음모', '정보', '순발력']);

  // 5. 학습력 (Learning): 학식, 지식, 신앙, 의술, 언어, 교양
  const lrnScore = getStat(['학식', '지식', '신앙', '의술', '언어', '교양', '지혜']);

  // 6. 기량 (Prowess): 근력, 무예, 결투, 체력, 검술
  const prowScore = getStat(['근력', '무예', '체력', '검술', '활', '결투', '무술']);

  return {
    diplomacy: {
      value: dipScore,
      label: '외교력 (Diplomacy)',
      grade: getGradeFromScore(dipScore),
      keyStats: ['매력', '교섭', '화술']
    },
    martial: {
      value: marScore,
      label: '무력 (Martial)',
      grade: getGradeFromScore(marScore),
      keyStats: ['통솔', '전술', '군사']
    },
    stewardship: {
      value: stewScore,
      label: '관리력 (Stewardship)',
      grade: getGradeFromScore(stewScore),
      keyStats: ['행정', '재정', '내정']
    },
    intrigue: {
      value: intScore,
      label: '계책력 (Intrigue)',
      grade: getGradeFromScore(intScore),
      keyStats: ['민첩', '잠행', '눈치']
    },
    learning: {
      value: lrnScore,
      label: '학습력 (Learning)',
      grade: getGradeFromScore(lrnScore),
      keyStats: ['학식', '신앙', '의술']
    },
    prowess: {
      value: prowScore,
      label: '기량 (Prowess)',
      grade: getGradeFromScore(prowScore),
      keyStats: ['근력', '체력', '결투']
    }
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
export function parseCKResources(gameState: ParsedState): CKResources {
  const faction = gameState.factionState || {};
  const wealthItems = gameState.inventory?.wealth || [];
  const archetype = detectPlayerArchetype(gameState);
  const labels = getArchetypeLabels(archetype);

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

  // 직할령 / 거점
  const estateType = gameState.estate?.type || (archetype === 'clergy' ? '작은 예배당' : archetype === 'wanderer' ? '임시 야영지' : archetype === 'company' ? '상설 숙영지' : '봉건 장원');
  const buildingCount = gameState.estate?.buildings?.length || 0;
  const domain = `${estateType} (시설 ${buildingCount}동)`;

  const archetypeTitleMap: Record<PlayerArchetype, string> = {
    noble: '👑 봉건 영주',
    wanderer: '🗡️ 방랑 모험가',
    company: '👥 소규모 집단',
    clergy: '⛪ 성직자 / 수도자'
  };

  return {
    gold,
    prestige,
    piety,
    levies,
    domain,
    archetype,
    archetypeTitle: archetypeTitleMap[archetype],
    labels
  };
}

// 가문 문장 엠블럼 심볼
export function getHeraldryEmblem(name: string, culture: string = '', archetype?: PlayerArchetype): { icon: string; border: string; bg: string } {
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
