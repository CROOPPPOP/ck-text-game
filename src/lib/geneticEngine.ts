/**
 * CK3 혈통 및 유전 특성(Congenital Traits) 엔진
 * - 3단계 유전 특성 (지능, 신체, 외모)
 * - 유전적 결함 (둔재, 백치, 허약, 추남, 혈우병, 근친혼의 낙인)
 * - 특수 성스러운 혈통 (성스러운 혈통, 전설의 혈통, 카롤링거의 후예)
 * - 멘델 유전 확률 및 티어 승급/상속 알고리즘
 */

export type CongenitalCategory = 'intelligence' | 'physical' | 'beauty' | 'flaw' | 'bloodline';

export interface CongenitalTraitDef {
  id: string;
  name: string;
  category: CongenitalCategory;
  tier: number; // 1, 2, 3 (결함이나 특수 혈통은 고유 단계)
  ck3Key: string;
  icon: string;
  color: string;
  borderColor: string;
  bgColor: string;
  description: string;
  effects: string[];
  statBonuses: Record<string, number>;
  fertilityBonusPercent?: number;
  healthBonus?: number;
  opinionBonus?: number;
  dominant?: boolean;
}

// 1. 지능 계열 (Intelligence) 3단계
export const INTELLIGENCE_TRAITS: CongenitalTraitDef[] = [
  {
    id: 'quick',
    name: '총명함 (Quick)',
    category: 'intelligence',
    tier: 1,
    ck3Key: 'quick',
    icon: '🧠',
    color: '#60a5fa',
    borderColor: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    description: '어릴 때부터 두뇌 회전이 빠르고 새로운 지식을 신속하게 습득하는 천부적 총명함입니다.',
    effects: ['모든 능력치 +1', '학습(Learning) +2', '스트레스 축적률 -10%'],
    statBonuses: { diplomacy: 1, martial: 1, stewardship: 1, intrigue: 1, learning: 2 }
  },
  {
    id: 'intelligent',
    name: '영민함 (Intelligent)',
    category: 'intelligence',
    tier: 2,
    ck3Key: 'intelligent',
    icon: '💡',
    color: '#818cf8',
    borderColor: '#6366f1',
    bgColor: 'rgba(99, 102, 241, 0.15)',
    description: '복잡한 정치와 서적의 비의를 꿰뚫어 보는 비범하고 날카로운 지성을 소유하고 있습니다.',
    effects: ['모든 능력치 +3', '학습(Learning) +3', '월간 문화 혁신 속도 +15%'],
    statBonuses: { diplomacy: 3, martial: 3, stewardship: 3, intrigue: 3, learning: 4 }
  },
  {
    id: 'genius',
    name: '천재 (Genius)',
    category: 'intelligence',
    tier: 3,
    ck3Key: 'genius',
    icon: '🌟',
    color: '#facc15',
    borderColor: '#eab308',
    bgColor: 'rgba(234, 179, 8, 0.18)',
    description: '한 세기에 한 명 태어날까 말까 한 불세출의 천재로, 군주론과 제왕학의 정점에 서 있습니다.',
    effects: ['모든 능력치 +5', '학습(Learning) +5', '모든 봉신·가신 호감도 +10', '스트레스 해소율 +30%'],
    statBonuses: { diplomacy: 5, martial: 5, stewardship: 5, intrigue: 5, learning: 6 }
  }
];

// 2. 신체 계열 (Physical) 3단계
export const PHYSICAL_TRAITS: CongenitalTraitDef[] = [
  {
    id: 'hale',
    name: '건장함 (Hale)',
    category: 'physical',
    tier: 1,
    ck3Key: 'hale',
    icon: '💪',
    color: '#34d399',
    borderColor: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    description: '선천적으로 골격이 튼튼하고 잔병치레를 하지 않는 단단한 육체를 지녔습니다.',
    effects: ['건강 +0.5', '기량(Prowess) +2', '무력(Martial) +1', '질병 저항력 소폭 증가'],
    statBonuses: { martial: 1, prowess: 2 },
    healthBonus: 0.5
  },
  {
    id: 'robust',
    name: '강인함 (Robust)',
    category: 'physical',
    tier: 2,
    ck3Key: 'robust',
    icon: '🛡️',
    color: '#2dd4bf',
    borderColor: '#14b8a6',
    bgColor: 'rgba(20, 184, 166, 0.15)',
    description: '전장의 격렬한 부상과 혹독한 풍토병 속에서도 거뜬히 살아남는 강철 같은 체력입니다.',
    effects: ['건강 +1.0', '기량(Prowess) +4', '무력(Martial) +2', '중병 회복 확률 대폭 증가'],
    statBonuses: { martial: 2, prowess: 4 },
    healthBonus: 1.0
  },
  {
    id: 'herculean',
    name: '헤라클레스 / 아마조네스 (Herculean)',
    category: 'physical',
    tier: 3,
    ck3Key: 'herculean',
    icon: '⚡',
    color: '#f87171',
    borderColor: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.18)',
    description: '신화 속 영웅의 육체를 물려받아 맨손으로 맹수를 때려잡고 백전불패의 무위를 뽐냅니다.',
    effects: ['건강 +1.5', '기량(Prowess) +8', '무력(Martial) +4', '매력 호감도 +15', '수명 대폭 연장'],
    statBonuses: { martial: 4, prowess: 8 },
    healthBonus: 1.5,
    opinionBonus: 15
  }
];

// 3. 외모 및 매력 계열 (Beauty) 3단계
export const BEAUTY_TRAITS: CongenitalTraitDef[] = [
  {
    id: 'comely',
    name: '준수함 (Comely)',
    category: 'beauty',
    tier: 1,
    ck3Key: 'comely',
    icon: '🌸',
    color: '#f472b6',
    borderColor: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.15)',
    description: '이목구비가 반듯하고 온화한 인상으로 주변인들에게 호감을 사는 매력적인 외모입니다.',
    effects: ['외교(Diplomacy) +1', '매혹 호감도 +10', '번식력 +10%'],
    statBonuses: { diplomacy: 1 },
    fertilityBonusPercent: 10,
    opinionBonus: 10
  },
  {
    id: 'pretty',
    name: '아름다움 (Pretty)',
    category: 'beauty',
    tier: 2,
    ck3Key: 'pretty',
    icon: '🌹',
    color: '#fb7185',
    borderColor: '#f43f5e',
    bgColor: 'rgba(244, 63, 94, 0.15)',
    description: '어느 무도회에 가도 시선을 한 몸에 사로잡는 눈부신 미모와 우아한 태도입니다.',
    effects: ['외교(Diplomacy) +2', '매혹 호감도 +20', '번식력 +20%'],
    statBonuses: { diplomacy: 2 },
    fertilityBonusPercent: 20,
    opinionBonus: 20
  },
  {
    id: 'beautiful',
    name: '아름다움의 극치 (Beautiful)',
    category: 'beauty',
    tier: 3,
    ck3Key: 'beautiful',
    icon: '💎',
    color: '#c084fc',
    borderColor: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.18)',
    description: '천상의 존재가 강림한 듯한 숨 막히는 미색으로, 시인들이 찬가를 바치는 절세의 미모입니다.',
    effects: ['외교(Diplomacy) +3', '매혹 호감도 +30', '번식력 +30%', '타 영주 정략결혼 수락률 +40%'],
    statBonuses: { diplomacy: 3 },
    fertilityBonusPercent: 30,
    opinionBonus: 30
  }
];

// 4. 유전적 결함 (Congenital Flaws)
export const FLAW_TRAITS: CongenitalTraitDef[] = [
  {
    id: 'slow',
    name: '둔재 (Slow)',
    category: 'flaw',
    tier: 1,
    ck3Key: 'slow',
    icon: '🐢',
    color: '#94a3b8',
    borderColor: '#64748b',
    bgColor: 'rgba(100, 116, 139, 0.15)',
    description: '선천적으로 두뇌 회전이 굼뜨고 복잡한 사안을 이해하는 데 오랜 시간이 걸립니다.',
    effects: ['모든 능력치 -2', '학습(Learning) -2'],
    statBonuses: { diplomacy: -2, martial: -2, stewardship: -2, intrigue: -2, learning: -2 }
  },
  {
    id: 'feeble',
    name: '허약함 (Feeble)',
    category: 'flaw',
    tier: 1,
    ck3Key: 'feeble',
    icon: '🍂',
    color: '#fb923c',
    borderColor: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    description: '조금만 바람이 불어도 병상에 눕는 선천적으로 연약한 체질입니다.',
    effects: ['건강 -1.0', '기량(Prowess) -4', '전염병 감염 확률 증가'],
    statBonuses: { prowess: -4 },
    healthBonus: -1.0
  },
  {
    id: 'homely',
    name: '추남 / 추녀 (Homely)',
    category: 'flaw',
    tier: 1,
    ck3Key: 'homely',
    icon: '👺',
    color: '#a8a29e',
    borderColor: '#78716c',
    bgColor: 'rgba(120, 113, 108, 0.15)',
    description: '얼굴 생김새가 매우 험악하거나 흉하여 대면하는 이들에게 거부감을 줍니다.',
    effects: ['외교(Diplomacy) -2', '매혹 호감도 -20'],
    statBonuses: { diplomacy: -2 },
    opinionBonus: -20
  },
  {
    id: 'inbred',
    name: '근친혼의 낙인 (Inbred)',
    category: 'flaw',
    tier: 3,
    ck3Key: 'inbred',
    icon: '⚠️',
    color: '#ef4444',
    borderColor: '#dc2626',
    bgColor: 'rgba(220, 38, 38, 0.25)',
    description: '가문의 폐쇄적인 근친혼 누적으로 인해 신체와 지능에 심각한 유전병이 발현되었습니다.',
    effects: ['건강 -1.5', '모든 능력치 -5', '번식력 -50%', '수명 극단적 단축'],
    statBonuses: { diplomacy: -5, martial: -5, stewardship: -5, intrigue: -5, learning: -5 },
    healthBonus: -1.5,
    fertilityBonusPercent: -50
  }
];

// 5. 특수 및 신성 혈통 (Bloodlines)
export const BLOODLINE_TRAITS: CongenitalTraitDef[] = [
  {
    id: 'consecrated_bloodline',
    name: '성스러운 혈통 (Consecrated Bloodline)',
    category: 'bloodline',
    tier: 3,
    ck3Key: 'consecrated_bloodline',
    icon: '🕊️',
    color: '#34d399',
    borderColor: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.22)',
    description: '교황청과 대주교의 축성으로 가문 전체에 성령의 가호가 깃든 불멸의 신성 혈통입니다. 자손 대대로 신앙과 정통성이 온전히 계승됩니다.',
    effects: [
      '신앙 턴당 획득 +1.5',
      '동일 종교 모든 성직자 및 신도 호감도 +15',
      '파문(Excommunication) 선고 면역 확률 대폭 상승',
      '가문 후계자 초기 신앙 단계 Lv.2 보장'
    ],
    statBonuses: { learning: 2, diplomacy: 2 },
    dominant: true
  },
  {
    id: 'legendary_bloodline',
    name: '전설의 가문 혈통 (Legendary Bloodline)',
    category: 'bloodline',
    tier: 3,
    ck3Key: 'legendary_bloodline',
    icon: '👑',
    color: '#eab308',
    borderColor: '#ca8a04',
    bgColor: 'rgba(202, 138, 4, 0.22)',
    description: '죽은 자의 전설(Legends of the Dead)을 통해 음유시인들이 노래하는 신화적 영웅의 혈통입니다.',
    effects: [
      '위신 턴당 획득 +2.0',
      '모든 봉신 및 가신 충성도 +20',
      '정통성(Legitimacy) 최고치 영구 보존',
      '가문 명망 획득 속도 +25%'
    ],
    statBonuses: { martial: 2, diplomacy: 3 },
    dominant: true
  },
  {
    id: 'carolingian_blood',
    name: '카롤링거의 후예 (Blood of Charlemagne)',
    category: 'bloodline',
    tier: 3,
    ck3Key: 'carolingian_blood',
    icon: '🦅',
    color: '#a855f7',
    borderColor: '#9333ea',
    bgColor: 'rgba(147, 51, 234, 0.22)',
    description: '서유럽을 호령했던 카를 대제의 혈맥을 이어받아 제국 황제위에 대한 정당한 혈통 명분을 지닙니다.',
    effects: ['명분 조작 및 전쟁 선포 위신 소모 -30%', '제국령 봉신 복종도 +15'],
    statBonuses: { martial: 3, stewardship: 2 },
    dominant: true
  }
];

export const ALL_CONGENITAL_TRAITS: CongenitalTraitDef[] = [
  ...INTELLIGENCE_TRAITS,
  ...PHYSICAL_TRAITS,
  ...BEAUTY_TRAITS,
  ...FLAW_TRAITS,
  ...BLOODLINE_TRAITS
];

/**
 * 특성 이름으로 유전 특성 메타데이터 조회
 */
export function getCongenitalTraitMeta(name: string): CongenitalTraitDef | undefined {
  if (!name) return undefined;
  const clean = name.trim();
  return ALL_CONGENITAL_TRAITS.find(t => 
    clean.includes(t.name) || 
    t.name.includes(clean) || 
    clean.includes(t.id) ||
    clean.toLowerCase().includes(t.ck3Key.toLowerCase())
  );
}

/**
 * 주어진 특성이 CK3 선천적/혈통 유전 특성인지 판별
 */
export function isCongenitalTrait(name: string): boolean {
  return !!getCongenitalTraitMeta(name);
}

/**
 * 부모의 유전 특성을 기반으로 멘델 상속 계산
 * @param parentATraits 부친/모친 A의 특성명 목록
 * @param parentBTraits 부친/모친 B의 특성명 목록
 * @param bloodLegacyTier 가문 피의 유산(Blood Legacy) 단계 (0 ~ 5)
 */
export function inheritCongenitalTraits(
  parentATraits: string[] = [],
  parentBTraits: string[] = [],
  bloodLegacyTier = 0
): string[] {
  const resultTraits: string[] = [];
  const bonusChance = bloodLegacyTier * 0.05; // 피의 유산 레벨당 5% 보정

  // 1. 혈통(Bloodline) 특성은 부모 중 한 명이라도 있으면 100% 영구 상속
  BLOODLINE_TRAITS.forEach(bloodline => {
    const parentAHas = parentATraits.some(t => t.includes(bloodline.name) || t.includes(bloodline.id));
    const parentBHas = parentBTraits.some(t => t.includes(bloodline.name) || t.includes(bloodline.id));
    if (parentAHas || parentBHas) {
      resultTraits.push(bloodline.name);
    }
  });

  // 2. 3대 긍정적 유전 특성군 상속 계산
  const categories: Array<{ list: CongenitalTraitDef[]; label: string }> = [
    { list: INTELLIGENCE_TRAITS, label: 'intelligence' },
    { list: PHYSICAL_TRAITS, label: 'physical' },
    { list: BEAUTY_TRAITS, label: 'beauty' }
  ];

  categories.forEach(({ list }) => {
    // 부모의 해당 카테고리 최고 티어 확인
    const aTrait = list.slice().reverse().find(t => parentATraits.some(p => p.includes(t.name) || p.includes(t.id)));
    const bTrait = list.slice().reverse().find(t => parentBTraits.some(p => p.includes(t.name) || p.includes(t.id)));

    const aTier = aTrait ? aTrait.tier : 0;
    const bTier = bTrait ? bTrait.tier : 0;

    if (aTier === 0 && bTier === 0) {
      // 양 부모 모두 없음: 1% 확률로 돌연변이 Lv.1 발현
      if (Math.random() < 0.01 + bonusChance * 0.2) {
        resultTraits.push(list[0].name);
      }
      return;
    }

    const maxTier = Math.max(aTier, bTier);
    const minTier = Math.min(aTier, bTier);

    if (minTier > 0) {
      // 양 부모 모두 보유: 고확률 상속 및 티어 승급(Upgrade) 기회
      const roll = Math.random();
      if (maxTier === 3 && minTier >= 2) {
        // 최고 등급 유지 확률 85%
        resultTraits.push(list[2].name);
      } else if (roll < 0.25 + bonusChance) {
        // 다음 티어 승급! (예: Quick + Quick -> Intelligent)
        const targetTier = Math.min(3, maxTier + 1);
        resultTraits.push(list[targetTier - 1].name);
      } else {
        // 상위 티어 상속
        resultTraits.push(list[maxTier - 1].name);
      }
    } else {
      // 한 부모만 보유: 50% 확률 상속
      const inheritRoll = Math.random();
      if (inheritRoll < 0.50 + bonusChance) {
        resultTraits.push(list[maxTier - 1].name);
      }
    }
  });

  return Array.from(new Set(resultTraits));
}

/**
 * 유전 특성 뱃지 렌더링 정보 생성
 */
export function getCongenitalBadgeStyle(name: string): {
  icon: string;
  label: string;
  color: string;
  borderColor: string;
  bgColor: string;
  tierStars: string;
  isBloodline: boolean;
} {
  const meta = getCongenitalTraitMeta(name);
  if (!meta) {
    return {
      icon: '🧬',
      label: name,
      color: '#cbd5e1',
      borderColor: '#94a3b8',
      bgColor: 'rgba(148, 163, 184, 0.15)',
      tierStars: '★',
      isBloodline: false
    };
  }

  const stars = meta.category === 'bloodline' ? '👑 혈통' : '★'.repeat(meta.tier);
  return {
    icon: meta.icon,
    label: meta.name,
    color: meta.color,
    borderColor: meta.borderColor,
    bgColor: meta.bgColor,
    tierStars: stars,
    isBloodline: meta.category === 'bloodline'
  };
}
