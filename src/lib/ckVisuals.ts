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

export interface CKResources {
  gold: string;
  prestige: string;
  piety: string;
  levies: string;
  domain: string;
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
  
  // 금화
  let gold = faction['세력 재정'] || faction['재정'] || faction['금화'] || '';
  if (!gold && wealthItems.length > 0) {
    const goldFound = wealthItems.find(w => w.includes('금') || w.includes('은') || w.includes('전') || w.includes('동'));
    if (goldFound) gold = goldFound;
  }
  if (!gold) gold = '금화 120개';

  // 위신 (명성)
  let prestige = gameState.stats?.acquired?.['명성'] || gameState.personalInfo?.['명성'] || '';
  if (!prestige) {
    const rank = gameState.personalInfo?.['직위'] || gameState.personalInfo?.['신분'] || '귀족';
    prestige = `${rank}의 명망`;
  }

  // 신앙 / 사기
  const piety = gameState.personalInfo?.['종교'] || gameState.playerStatus?.find(s => s.name.includes('사기') || s.name.includes('신앙'))?.value || '신앙심 깊음';

  // 병력
  const levies = faction['병력'] || faction['군사'] || '상비군 50명';

  // 직할령 / 거점
  const estateType = gameState.estate?.type || '야영지';
  const buildingCount = gameState.estate?.buildings?.length || 0;
  const domain = `${estateType} (시설 ${buildingCount}동)`;

  return {
    gold,
    prestige,
    piety,
    levies,
    domain
  };
}

// 가문 문장 엠블럼 심볼
export function getHeraldryEmblem(name: string, culture: string = ''): { icon: string; border: string; bg: string } {
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
