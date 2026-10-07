export type TraitCategoryKey = 
  | 'physical' 
  | 'mental' 
  | 'sensory' 
  | 'professional' 
  | 'lineage' 
  | 'temporary' 
  | 'general';

export interface TraitCategoryMeta {
  key: TraitCategoryKey;
  label: string;
  shortLabel: string;
  icon: string;
  color: string;
  borderColor: string;
  bgColor: string;
  gradientBg: string;
  description: string;
  emptyHint: string;
  examples: string[];
}

export const TRAIT_CATEGORIES: Record<TraitCategoryKey, TraitCategoryMeta> = {
  physical: {
    key: 'physical',
    label: '신체 특성 (Physical Traits)',
    shortLabel: '신체',
    icon: '💪',
    color: '#f87171',
    borderColor: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.12)',
    gradientBg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(15, 23, 42, 0.7))',
    description: '선천적 체질, 근력, 신체적 강인함, 상흔 및 유전적 골격과 관련된 체질적 특성입니다.',
    emptyHint: '아직 발현된 고유 신체 특성이 없습니다. 혹독한 전장이나 생사의 고비를 극복하면 특화된 신체 특성이 발현될 수 있습니다.',
    examples: ['강철 체력', '거구', '민첩한 몸놀림', '질병 저항', '맹수와 같은 지구력']
  },
  mental: {
    key: 'mental',
    label: '정신 / 성격 특성 (Personality & Mind)',
    shortLabel: '정신·성격',
    icon: '🧠',
    color: '#60a5fa',
    borderColor: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.12)',
    gradientBg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(15, 23, 42, 0.7))',
    description: '군주의 의지, 기질, 도덕적 지향, 스트레스 취약성 및 대인 상호작용의 심리적 특성입니다.',
    emptyHint: '현재 확립된 극단적 성격 특성이 없습니다. 중요한 정치적 결단과 도덕적 딜레마를 마주하며 굳건한 성격 특성이 형성됩니다.',
    examples: ['냉철한 이성', '불요불굴', '야심가', '자비로움', '신중한 모략가']
  },
  sensory: {
    key: 'sensory',
    label: '감각 / 직관 특성 (Sensory & Intuition)',
    shortLabel: '감각·직관',
    icon: '👁️',
    color: '#34d399',
    borderColor: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.12)',
    gradientBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(15, 23, 42, 0.7))',
    description: '환경에 대한 육감, 기척 감지, 관찰력, 심리 파악 및 위험 회피 본능과 관련된 특성입니다.',
    emptyHint: '아직 개화된 고유 감각 특성이 없습니다. 어둠 속의 잠행, 암살 위기, 야외 생존 상황에서 예리한 직관이 각성할 수 있습니다.',
    examples: ['매의 눈', '살기 감지', '예민한 청각', '직관적 통찰', '야간 시야']
  },
  professional: {
    key: 'professional',
    label: '전문 / 기예 특성 (Professional & Mastery)',
    shortLabel: '전문·기술',
    icon: '🎖️',
    color: '#facc15',
    borderColor: '#d4af37',
    bgColor: 'rgba(212, 175, 55, 0.12)',
    gradientBg: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(15, 23, 42, 0.7))',
    description: '훈련과 경험으로 연마된 무예, 전술, 외교, 행정, 학문 및 장인 기술 분야의 숙련도입니다.',
    emptyHint: '아직 확립된 전문 기술 특성이 없습니다. 무예 수련, 영지 경영, 외교 협상 등 실전 경험을 누적하면 전문 특성을 획득합니다.',
    examples: ['명검술사', '기병 지휘관', '고문서 해독가', '노련한 재정가', '성채 축조 전문가']
  },
  lineage: {
    key: 'lineage',
    label: '잠재 / 혈통 특성 (Lineage & Destiny)',
    shortLabel: '잠재·혈통',
    icon: '✨',
    color: '#c084fc',
    borderColor: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.12)',
    gradientBg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(15, 23, 42, 0.7))',
    description: '가문 대대로 전해지는 혈통의 비밀, 천부적 재능, 영적 감응력 및 군주로서의 천명입니다.',
    emptyHint: '잠재된 혈통 특성이 아직 봉인되어 있습니다. 가문의 유물 발견이나 신성한 계시, 운명적인 만남을 통해 잠재력이 개화합니다.',
    examples: ['명문 혈통', '군주의 카리스마', '신성한 영감', '천재적 두뇌', '고대 왕조의 피']
  },
  temporary: {
    key: 'temporary',
    label: '일시적 / 상황 특성 (Temporary & Status)',
    shortLabel: '일시·상황',
    icon: '⏳',
    color: '#f472b6',
    borderColor: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.12)',
    gradientBg: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(15, 23, 42, 0.7))',
    description: '최근 겪은 사건, 부상 후유증, 승전의 고양감 등 시간의 경과나 상황에 따라 해제되는 특성입니다.',
    emptyHint: '현재 부여된 일시적 특성이 없습니다. 격렬한 사건이나 승패의 여파에 따라 일시적인 버프/디버프 특성이 부여됩니다.',
    examples: ['승전의 도취', '숙취', '결사항전의 맹세', '심한 타박상', '순례의 은총']
  },
  general: {
    key: 'general',
    label: '일반 / 고유 특성 (General & Unique)',
    shortLabel: '일반',
    icon: '🏷️',
    color: '#cbd5e1',
    borderColor: '#94a3b8',
    bgColor: 'rgba(148, 163, 184, 0.12)',
    gradientBg: 'linear-gradient(135deg, rgba(148, 163, 184, 0.15), rgba(15, 23, 42, 0.7))',
    description: '세계관 특유의 사회적 위치, 명예 호칭, 이벤트성 관계 등 범용적인 특성입니다.',
    emptyHint: '별도의 일반 특성이 없습니다.',
    examples: ['방랑 모험가', '약탈자의 낙인', '십자군 참가자']
  }
};

export const ORDERED_TRAIT_CATEGORY_KEYS: TraitCategoryKey[] = [
  'physical',
  'mental',
  'sensory',
  'professional',
  'lineage',
  'temporary',
  'general'
];

/**
 * 임의의 카테고리 문자열을 표준 세션 카테고리 키로 안전하게 변환
 */
export function normalizeTraitCategory(rawCategory?: string): TraitCategoryKey {
  if (!rawCategory) return 'general';
  const clean = rawCategory.trim().replace(/[\[\]]/g, '');

  if (clean.includes('신체') || clean.includes('육체') || clean.includes('체질') || clean.includes('건강')) {
    return 'physical';
  }
  if (clean.includes('정신') || clean.includes('성격') || clean.includes('심리') || clean.includes('도덕')) {
    return 'mental';
  }
  if (clean.includes('감각') || clean.includes('직관') || clean.includes('통찰') || clean.includes('시각') || clean.includes('청각')) {
    return 'sensory';
  }
  if (clean.includes('전문') || clean.includes('기술') || clean.includes('기예') || clean.includes('직업') || clean.includes('무예') || clean.includes('전술') || clean.includes('학술')) {
    return 'professional';
  }
  if (clean.includes('잠재') || clean.includes('혈통') || clean.includes('가문') || clean.includes('천부') || clean.includes('신성')) {
    return 'lineage';
  }
  if (clean.includes('일시') || clean.includes('상태') || clean.includes('후유') || clean.includes('임시')) {
    return 'temporary';
  }
  return 'general';
}

export interface TraitTierInfo {
  level: number; // 1 to 5
  maxLevel: number;
  label: string;
  color: string;
  pips: boolean[]; // e.g. [true, true, true, false, false]
}

/**
 * 5단계 성장단계(티어) 분석 함수
 * 1단계: 일시적 성향
 * 2단계: 반복 성향
 * 3단계: 잠재 특성
 * 4단계: 확립된 특성
 * 5단계: 강한 특성
 */
export function parseTraitTier(tierStr?: string): TraitTierInfo {
  let level = 3; // 기본값: 중간
  const raw = (tierStr || '').trim();

  if (raw.includes('일시적') || raw.includes('초급') || raw.includes('1단계') || raw.includes('Lv.1') || raw.includes('티어 1') || raw.includes('티어1')) {
    level = 1;
  } else if (raw.includes('반복') || raw.includes('중급') || raw.includes('2단계') || raw.includes('Lv.2') || raw.includes('티어 2') || raw.includes('티어2')) {
    level = 2;
  } else if (raw.includes('잠재') || raw.includes('상급') || raw.includes('3단계') || raw.includes('Lv.3') || raw.includes('티어 3') || raw.includes('티어3')) {
    level = 3;
  } else if (raw.includes('확립') || raw.includes('달인') || raw.includes('4단계') || raw.includes('Lv.4') || raw.includes('티어 4') || raw.includes('티어4')) {
    level = 4;
  } else if (raw.includes('강한') || raw.includes('정점') || raw.includes('완성') || raw.includes('5단계') || raw.includes('Lv.5') || raw.includes('티어 5') || raw.includes('티어5')) {
    level = 5;
  } else if (raw) {
    // 숫자가 포함된 경우
    const numMatch = raw.match(/\d+/);
    if (numMatch) {
      const parsed = parseInt(numMatch[0], 10);
      if (parsed >= 1 && parsed <= 5) level = parsed;
    }
  }

  const tierLabels = [
    '일시적 성향 (Lv.1)',
    '반복 성향 (Lv.2)',
    '잠재 특성 (Lv.3)',
    '확립된 특성 (Lv.4)',
    '강한 특성 (Lv.5)'
  ];

  const tierColors = ['#94a3b8', '#60a5fa', '#34d399', '#facc15', '#f43f5e'];

  return {
    level,
    maxLevel: 5,
    label: raw || tierLabels[level - 1],
    color: tierColors[level - 1],
    pips: [1, 2, 3, 4, 5].map(idx => idx <= level)
  };
}

export interface NormalizedTrait {
  originalCategory: string;
  categoryKey: TraitCategoryKey;
  name: string;
  tier?: string;
  tierInfo: TraitTierInfo;
  description: string;
  isNew?: boolean;
}

/**
 * 원본 traits 배열을 카테고리 키별로 분류 및 정규화
 */
export function groupTraitsBySession(
  traits: Array<{ category: string; name: string; tier?: string; description: string; isNew?: boolean }> = []
): Record<TraitCategoryKey, NormalizedTrait[]> {
  const result: Record<TraitCategoryKey, NormalizedTrait[]> = {
    physical: [],
    mental: [],
    sensory: [],
    professional: [],
    lineage: [],
    temporary: [],
    general: []
  };

  traits.forEach(t => {
    const categoryKey = normalizeTraitCategory(t.category);
    const tierInfo = parseTraitTier(t.tier);
    result[categoryKey].push({
      originalCategory: t.category,
      categoryKey,
      name: t.name,
      tier: t.tier,
      tierInfo,
      description: t.description,
      isNew: t.isNew
    });
  });

  return result;
}
