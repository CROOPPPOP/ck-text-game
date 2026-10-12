import { extractNumericValue } from '../ckVisuals';

// ==========================================
// 1축: 5대 핵심 능력치 & 기량 실시간 환산
// ==========================================
export interface CoreAttributeSummary {
  score: number;       // 1 ~ 30 점수
  label: string;       // 한국어 명칭
  icon: string;        // 아이콘
  color: string;       // 테마 색상
  grade: string;       // 최상/우수/보통/미흡/치명
  effectDesc: string;  // 실제 시스템 보너스 설명
}

export interface Calculated5Attributes {
  diplomacy: CoreAttributeSummary;
  martial: CoreAttributeSummary;
  stewardship: CoreAttributeSummary;
  intrigue: CoreAttributeSummary;
  learning: CoreAttributeSummary;
  prowess: CoreAttributeSummary;
}

export function calculate5AttributesFromStats(stats: Record<string, number | string>): Calculated5Attributes {
  const getAvg = (names: string[]): number => {
    let sum = 0;
    let count = 0;
    for (const [key, val] of Object.entries(stats)) {
      if (names.some(n => key.includes(n))) {
        sum += typeof val === 'number' ? val : extractNumericValue(String(val), 50);
        count++;
      }
    }
    return count > 0 ? (sum / count) : 50;
  };

  const toScore = (avg: number) => Math.min(30, Math.max(1, Math.round((avg / 100) * 26)));

  const getGrade = (score: number) => {
    if (score >= 22) return '전설 (신화)';
    if (score >= 17) return '탁월 (우수)';
    if (score >= 12) return '준수 (보통)';
    if (score >= 7) return '미흡 (부족)';
    return '열등 (결함)';
  };

  // 1. 외교력
  const dipAvg = getAvg(['외교력', '외교', '매력', '설득력', '설득', '지능']);
  const dipScore = toScore(dipAvg);

  // 2. 무력
  const marAvg = getAvg(['통솔력', '통솔', '전략', '전술', '의지력', '집중력']);
  const marScore = toScore(marAvg);

  // 3. 관리력
  const stewAvg = getAvg(['행정력', '행정', '기술 숙련도', '장인 기술', '학습 능력', '기억력']);
  const stewScore = toScore(stewAvg);

  // 4. 계책력
  const intAvg = getAvg(['기만술', '위협', '은밀 행동', '은밀', '수사력', '지각력', '반사 신경']);
  const intScore = toScore(intAvg);

  // 5. 학습력
  const lrnAvg = getAvg(['학문', '의술', '지능', '기억력', '학습 능력']);
  const lrnScore = toScore(lrnAvg);

  // 6. 기량
  const prowAvg = getAvg(['전투력', '무기 숙련도', '기마술', '생존술', '근력', '체력', '지구력', '민첩성', '속도', '신체 조정력']);
  const prowScore = toScore(prowAvg);

  return {
    diplomacy: {
      score: dipScore,
      label: '외교력',
      icon: '🕊️',
      color: '#60a5fa',
      grade: getGrade(dipScore),
      effectDesc: `위신 획득 +${dipScore * 2}%, 교황 및 봉신 호감도 +${Math.round(dipScore * 1.5)}`
    },
    martial: {
      score: marScore,
      label: '무력',
      icon: '⚔️',
      color: '#f87171',
      grade: getGrade(marScore),
      effectDesc: `징집병 한도 +${Math.round(marScore * 2.5)}%, 성채 방어도 +${marScore * 2}`
    },
    stewardship: {
      score: stewScore,
      label: '관리력',
      icon: '💰',
      color: '#fbbf24',
      grade: getGrade(stewScore),
      effectDesc: `영지 세수 +${stewScore * 2}%, 건설 소요 기간 단축`
    },
    intrigue: {
      score: intScore,
      label: '계책력',
      icon: '🗡️',
      color: '#c084fc',
      grade: getGrade(intScore),
      effectDesc: `암살/음모 성공률 +${Math.round(intScore * 2)}%, 주교 약점 포섭 유리`
    },
    learning: {
      score: lrnScore,
      label: '학습력',
      icon: '📖',
      color: '#34d399',
      grade: getGrade(lrnScore),
      effectDesc: `신앙 획득 +${Math.round(lrnScore * 2.5)}%, 역병 격리 치료율 대폭 상승`
    },
    prowess: {
      score: prowScore,
      label: '기량',
      icon: '🛡️',
      color: '#fb923c',
      grade: getGrade(prowScore),
      effectDesc: `1:1 결투 및 마상시합 승률 +${prowScore * 3}%, 전장 생존력 최상`
    }
  };
}

// ==========================================
// 2축: CK3 정통 성격 트레잇 (Personality)
// ==========================================
export interface PersonalityTraitDef {
  id: string;
  name: string;
  oppositeId: string;
  icon: string;
  color: string;
  desc: string;
  statBonus: string;
}

export const PERSONALITY_PAIRS: { positive: PersonalityTraitDef; opposite: PersonalityTraitDef }[] = [
  {
    positive: {
      id: 'brave',
      name: '용감함 (Brave)',
      oppositeId: 'craven',
      icon: '🦁',
      color: '#ef4444',
      desc: '전투와 위기 앞에서 물러서지 않고 앞장섭니다.',
      statBonus: '기량 +4, 결투 성공률 +20%, 부상 위험 +10%'
    },
    opposite: {
      id: 'craven',
      name: '비겁함 (Craven)',
      oppositeId: 'brave',
      icon: '🐇',
      color: '#94a3b8',
      desc: '신변의 안전을 최우선으로 생각하여 위험을 피합니다.',
      statBonus: '암살 회피율 +35%, 스트레스 저항력 증가, 기량 -3'
    }
  },
  {
    positive: {
      id: 'greedy',
      name: '탐욕 (Greedy)',
      oppositeId: 'generous',
      icon: '🪙',
      color: '#eab308',
      desc: '금화 한 닢도 허투루 쓰지 않으며 국고를 불립니다.',
      statBonus: '영지 세수(골드) +20%, 교회 관계도 -10'
    },
    opposite: {
      id: 'generous',
      name: '관대함 (Generous)',
      oppositeId: 'greedy',
      icon: '🎁',
      color: '#10b981',
      desc: '가신과 백성에게 아낌없이 베풀어 인망을 얻습니다.',
      statBonus: '영지 민심 +25, 위신 획득 +15%, 지출 증가'
    }
  },
  {
    positive: {
      id: 'zealous',
      name: '열성 (Zealous)',
      oppositeId: 'cynical',
      icon: '✝️',
      color: '#3b82f6',
      desc: '하느님의 뜻을 목숨 바쳐 받들며 이단을 배격합니다.',
      statBonus: '신앙 획득 +35%, 교황청 호감도 +20, 서임권 분쟁 우위'
    },
    opposite: {
      id: 'cynical',
      name: '냉소 (Cynical)',
      oppositeId: 'zealous',
      icon: '🎭',
      color: '#8b5cf6',
      desc: '종교적 교리보다 세속적 실리와 이성을 신뢰합니다.',
      statBonus: '계책력 +3, 파문 위협에 대한 스트레스 면역, 신앙 -15%'
    }
  },
  {
    positive: {
      id: 'ambitious',
      name: '야심가 (Ambitious)',
      oppositeId: 'content',
      icon: '👑',
      color: '#ec4899',
      desc: '더 높은 작위와 영광을 쟁취하기 위해 끊임없이 전진합니다.',
      statBonus: '모든 능력치 +1, 정복 명분 날조 성공률 +25%'
    },
    opposite: {
      id: 'content',
      name: '만족 (Content)',
      oppositeId: 'ambitious',
      icon: '☕',
      color: '#14b8a6',
      desc: '현재의 지위에 만족하며 평온한 영지 다스리기를 즐깁니다.',
      statBonus: '스트레스 축적률 -30%, 봉신/주군 호감도 +15'
    }
  }
];

// ==========================================
// 3축: 선천적 유전 트레잇 (Point-Buy)
// ==========================================
export interface CongenitalPointTrait {
  id: string;
  name: string;
  icon: string;
  cost: number; // 양수: 포인트 소모, 음수: 포인트 환급 (결함)
  isFlaw?: boolean;
  desc: string;
  effects: string;
}

export const CONGENITAL_POINT_TRAITS: CongenitalPointTrait[] = [
  // 긍정적 유전 특성 (소모)
  {
    id: 'genius',
    name: '천재 (Genius)',
    icon: '🌟',
    cost: 70,
    desc: '세기에 한 번 태어나는 천재적 두뇌',
    effects: '모든 핵심 능력치 +5, 학습력 +5'
  },
  {
    id: 'herculean',
    name: '헤라클레스 (Herculean)',
    icon: '⚡',
    cost: 50,
    desc: '신화 속 영웅의 강인한 체구와 골격',
    effects: '기량 +8, 무력 +4, 건강 최상 고정'
  },
  {
    id: 'beautiful',
    name: '아름다움의 극치 (Beautiful)',
    icon: '💎',
    cost: 40,
    desc: '모든 이들의 시선을 사로잡는 절세의 미모',
    effects: '외교력 +3, 매혹 호감도 +30, 정략결혼 수락률 +40%'
  },
  {
    id: 'quick',
    name: '총명함 (Quick)',
    icon: '🧠',
    cost: 30,
    desc: '영민하고 두뇌 회전이 빠른 천부적 재능',
    effects: '모든 핵심 능력치 +1, 학습력 +2'
  },
  // 부정적 유전 결함 (환급)
  {
    id: 'slow',
    name: '둔재 (Slow)',
    icon: '🐢',
    cost: -40,
    isFlaw: true,
    desc: '사리분별과 이해가 남들보다 현저히 굼뜸',
    effects: '모든 능력치 -2 (포인트 40 환급)'
  },
  {
    id: 'feeble',
    name: '허약함 (Feeble)',
    icon: '🍂',
    cost: -40,
    isFlaw: true,
    desc: '바람만 불어도 병상에 눕는 선천적 약체',
    effects: '기량 -4, 전염병 감염률 증가 (포인트 40 환급)'
  },
  {
    id: 'homely',
    name: '추남 / 추녀 (Homely)',
    icon: '👺',
    cost: -30,
    isFlaw: true,
    desc: '보는 이들에게 거부감을 주는 험악한 용모',
    effects: '외교력 -2, 매혹 호감도 -20 (포인트 30 환급)'
  }
];

// ==========================================
// 4축: 가문 유산 (Dynasty Legacy) 대업 프리셋
// ==========================================
export interface DynastyLegacyDef {
  id: string;
  name: string;
  icon: string;
  title: string;
  badge: string;
  description: string;
  bonusSummary: string[];
}

export const DYNASTY_LEGACIES: DynastyLegacyDef[] = [
  {
    id: 'martial',
    name: '무인의 가문 (Martial Bloodline)',
    icon: '⚔️',
    title: '강철과 피의 맹세',
    badge: '군사 & 정복 특화',
    description: '선대로부터 전장을 누비며 검 한 자루로 영지를 일군 무가(武家) 혈통입니다.',
    bonusSummary: [
      '시작 징집병 +30명 추가 배속',
      '가문 가보 무기 [선대의 강철 장검] 즉시 장착',
      '초기 무력 능력치 +2 보너스'
    ]
  },
  {
    id: 'holy',
    name: '성자의 가문 (Holy Bloodline)',
    icon: '⛪',
    title: '성좌의 축복을 받은 혈통',
    badge: '종교 & 정통성 특화',
    description: '교회에 헌신하고 성인(Saint)을 배출하여 교황청의 각별한 비호를 받는 경건한 가문입니다.',
    bonusSummary: [
      '시작 신앙(Piety) +50점 부여',
      '로마 교황청 기본 호감도 +30 (우호 관계)',
      '성유물 가보 [성십자가의 파편] 즉시 장착'
    ]
  },
  {
    id: 'merchant',
    name: '상인의 가문 (Merchant Bloodline)',
    icon: '💰',
    title: '황금과 장원의 번영',
    badge: '경제 & 개발 특화',
    description: '무역로 요충지와 장원을 경영하며 막대한 금권으로 군주들을 쥐락펴락해 온 부호 가문입니다.',
    bonusSummary: [
      '시작 재정 금화 +80닢 추가 확보',
      '영지 특산품 시설 [올리브 압착장 Lv.1] 완공 상태 시작',
      '초기 관리력 능력치 +2 보너스'
    ]
  }
];
