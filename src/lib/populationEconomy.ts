// Single Source of Truth (SSOT) for Population Growth Dynamics & Ledger
// 크루세이더 킹즈 3(CK3) 스타일 턴당 인구 증감 산정 및 성장 장부 엔진

import { ParsedState } from './parser';
import { PlayerArchetype, calculateCKAttributes, extractNumericValue } from './ckVisuals';

export interface PopulationGrowthItem {
  id: string;
  name: string;
  label: string;
  amount: number;
  icon: string;
  category: 'base' | 'estate' | 'building' | 'governance' | 'stat';
  desc: string;
}

export interface PopulationGrowthBreakdown {
  currentPopulation: number;
  previousPopulation?: number;
  rawString: string;
  delta?: number;
  formattedDelta?: string;
  recentDeltaLabel?: string;
  growthRate: number; // 턴당 순증가 인원 수 (소수점 1자리)
  formattedGrowth: string; // 예: "+6.5명"
  growthPercent: number; // 백분율 성장률
  formattedGrowthPercent: string; // 예: "+4.5%"
  capacity: number; // 거점 인구 수용 한계
  maxCapacity: number;
  capacityRatio: number; // 수용률 (0.0 ~ 1.0)
  isOverCapacity: boolean;
  isOvercrowded: boolean;
  growthItems: PopulationGrowthItem[];
  growthStatusLabel: string; // "급속 번영 (우수)", "안정적 성장" 등
  growthStatusColor: string;
}

/** 텍스트에서 인구 정수값 정밀 추출 (예: "마을 및 장원 145명(보통)" -> 145) */
export function parsePopulationCount(rawText: string | undefined): number {
  if (!rawText) return 0;
  if (rawText.includes('없음')) return 0;
  
  // 쉼표 제거 (예: "3,500명" -> "3500명")
  const clean = rawText.replace(/,/g, '');

  // "145명" 또는 "단원 24명", "동행 1명" 등 숫자 추출
  const match = clean.match(/(\d+)\s*명?/);
  if (match) {
    return parseInt(match[1], 10);
  }
  
  return 0;
}

/** 거점 레벨별 최대 인구 수용 한도 (Holding Population Capacity) */
export function getEstatePopulationCapacity(estateLevelInput?: string | number): number {
  let lv = 1;
  if (typeof estateLevelInput === 'number') {
    lv = estateLevelInput;
  } else if (typeof estateLevelInput === 'string') {
    const m = estateLevelInput.match(/Lv\.?\s*(\d+)/i);
    if (m) lv = parseInt(m[1], 10);
  }

  switch (lv) {
    case 5: return 10000;
    case 4: return 2500;
    case 3: return 800;
    case 2: return 300;
    case 1:
    default:
      return 100;
  }
}

/** 턴당 인구 수 증가 및 성장 내역 정밀 산정 함수 */
export function calculatePopulationGrowth(
  gameState: ParsedState,
  previousPopulation?: number
): PopulationGrowthBreakdown {
  const faction = gameState?.factionState || {};
  const rawPopStr = faction['인구'] || faction['단원'] || faction['단원 수'] || faction['병력'] || '';
  const currentPopulation = parsePopulationCount(rawPopStr);

  // 직전 턴 대비 변동량 (Delta)
  let delta: number | undefined = undefined;
  let formattedDelta: string | undefined = undefined;
  if (typeof previousPopulation === 'number' && previousPopulation > 0) {
    delta = currentPopulation - previousPopulation;
    formattedDelta = delta > 0 ? `▲ +${delta}명` : delta < 0 ? `▼ ${delta}명` : '변동 없음';
  }

  const estate = gameState?.estate;
  const capacity = getEstatePopulationCapacity(estate?.level);
  const capacityRatio = Math.min(1.5, Math.round((currentPopulation / capacity) * 100) / 100);
  const isOverCapacity = currentPopulation > capacity;

  const growthItems: PopulationGrowthItem[] = [];

  // 1. 기본 자연 증가 (Base Natural Growth)
  // 인구 100명당 약 0.8명 ~ 1.2명의 출산-사망 순증가
  const baseRate = Math.max(0.5, Math.round((currentPopulation * 0.007) * 10) / 10);
  growthItems.push({
    id: 'base_natural',
    name: '기본 자연 인구 증가',
    label: '기본 자연 인구 증가',
    amount: baseRate,
    icon: '🌱',
    category: 'base',
    desc: '영지 내 가구 출산 및 평시 자연 순증가'
  });

  // 2. 거점 규모에 따른 정착민 유입 (Estate Holding Scale)
  let estateLv = 1;
  if (estate?.level) {
    const lvMatch = estate.level.match(/Lv\.?\s*(\d+)/i);
    if (lvMatch) estateLv = parseInt(lvMatch[1], 10);
  }
  const estateAdd = estateLv === 5 ? 10.0 : estateLv === 4 ? 5.0 : estateLv === 3 ? 2.5 : estateLv === 2 ? 1.2 : 0.5;
  const estateScaleName = `${estate?.type || '직할 거점'} 인프라 유입 (Lv.${estateLv})`;
  growthItems.push({
    id: 'estate_scale',
    name: estateScaleName,
    label: estateScaleName,
    amount: estateAdd,
    icon: '🏠',
    category: 'estate',
    desc: `거점 규모에 따른 외부 이주민 및 정착민 유치력`
  });

  // 3. 거점 부속 건물 효과 (Building Facilities)
  if (estate?.buildings && estate.buildings.length > 0) {
    estate.buildings.forEach(b => {
      const bTags = (b.tags || []).join(' ');
      const bCombined = `${b.name} ${b.desc || ''} ${bTags}`;
      const bLvl = b.level || 1;
      const bldgLabel = `${b.name} (Lv.${bLvl})`;

      // 1) 민생 / 보급 / 식량 (식료창고, 구빈원, 제분소) -> +1.5 * Lv배율
      if (bCombined.includes('식료') || bCombined.includes('창고') || bCombined.includes('민생') || bCombined.includes('보급') || bCombined.includes('제분') || bCombined.includes('구빈')) {
        const amt = Math.round((1.5 + (bLvl - 1) * 0.8) * 10) / 10;
        growthItems.push({
          id: `bldg_supplies_${b.name}`,
          name: bldgLabel,
          label: bldgLabel,
          amount: amt,
          icon: '🍞',
          category: 'building',
          desc: '식량 안보 확립 및 기아 사망률 저하, 유민 수용'
        });
      }
      // 2) 생산 / 재정 / 상업 (올리브 압착장, 양조장, 공방, 대장간) -> +1.0 * Lv배율
      else if (bCombined.includes('생산') || bCombined.includes('재정') || bCombined.includes('압착') || bCombined.includes('양조') || bCombined.includes('공방') || bCombined.includes('대장간') || bCombined.includes('상업')) {
        const amt = Math.round((1.0 + (bLvl - 1) * 0.6) * 10) / 10;
        growthItems.push({
          id: `bldg_jobs_${b.name}`,
          name: bldgLabel,
          label: bldgLabel,
          amount: amt,
          icon: '🫒',
          category: 'building',
          desc: '일자리 창출 및 소작농/숙련 노동 인력 유입'
        });
      }
      // 3) 행정 / 의술 / 학문 (사제관, 서재, 약초원) -> +0.8 * Lv배율
      else if (bCombined.includes('행정') || bCombined.includes('학문') || bCombined.includes('서재') || bCombined.includes('의술') || bCombined.includes('약초') || bCombined.includes('치료')) {
        const amt = Math.round((0.8 + (bLvl - 1) * 0.5) * 10) / 10;
        growthItems.push({
          id: `bldg_admin_${b.name}`,
          name: bldgLabel,
          label: bldgLabel,
          amount: amt,
          icon: '📜',
          category: 'building',
          desc: '방역 및 호적 정비, 체계적 정착 유도'
        });
      }
      // 4) 신앙 / 문화 (예배당, 종탑, 성물 안치실) -> +0.7 * Lv배율
      else if (bCombined.includes('신앙') || bCombined.includes('예배') || bCombined.includes('종탑') || bCombined.includes('성물') || bCombined.includes('문화')) {
        const amt = Math.round((0.7 + (bLvl - 1) * 0.4) * 10) / 10;
        growthItems.push({
          id: `bldg_faith_${b.name}`,
          name: bldgLabel,
          label: bldgLabel,
          amount: amt,
          icon: '⛪',
          category: 'building',
          desc: '순례자 유치 및 독실한 신도/성직 인구 정착'
        });
      }
    });
  }

  // 4. 통치 게이지 보정 (민심 & 치안)
  const sentiment = faction['민심'] || '보통';
  let sentimentAmt = 0.5;
  if (sentiment.includes('매우') || sentiment.includes('탁월') || sentiment.includes('높음')) sentimentAmt = 1.5;
  else if (sentiment.includes('낮음')) sentimentAmt = -0.5;
  else if (sentiment.includes('위험') || sentiment.includes('폭동') || sentiment.includes('재앙')) sentimentAmt = -2.5;

  const sentimentLabel = `영지 민심 (${sentiment})`;
  growthItems.push({
    id: 'gov_sentiment',
    name: sentimentLabel,
    label: sentimentLabel,
    amount: sentimentAmt,
    icon: '🕊️',
    category: 'governance',
    desc: sentimentAmt >= 0 ? '민심 안정으로 인한 정주 만족도 및 이주민 증가' : '민심 이반으로 인한 주민 유출 및 이탈'
  });

  const publicOrder = faction['치안'] || '보통';
  let orderAmt = 0.5;
  if (publicOrder.includes('엄격') || publicOrder.includes('안전') || publicOrder.includes('우수')) orderAmt = 0.8;
  else if (publicOrder.includes('불안') || publicOrder.includes('낮음')) orderAmt = -1.2;
  else if (publicOrder.includes('치명') || publicOrder.includes('약탈')) orderAmt = -2.5;

  const orderLabel = `치안 안정도 (${publicOrder})`;
  growthItems.push({
    id: 'gov_order',
    name: orderLabel,
    label: orderLabel,
    amount: orderAmt,
    icon: '🛡️',
    category: 'governance',
    desc: orderAmt >= 0 ? '도적 및 약탈 방지로 인한 주민 생명 보호' : '치안 공백 및 약탈로 인한 사상자/피랍 발생'
  });

  // 5. 스탯 시너지 (관리력 및 학습력)
  const attr = calculateCKAttributes(gameState || {});
  const stewScore = attr.stewardship.value; // 1~30
  const lrnScore = attr.learning.value; // 1~30
  const statAmt = Math.round((stewScore * 0.04 + lrnScore * 0.04) * 10) / 10;
  if (statAmt > 0) {
    growthItems.push({
      id: 'stat_synergy',
      name: '통치 역량 (관리력·학습력)',
      label: '통치 역량 (관리력·학습력)',
      amount: statAmt,
      icon: '⚖️',
      category: 'stat',
      desc: '장원 관리 행정력 및 위생/의술 학식 시너지'
    });
  }

  // 6. 과밀 패널티 (Overcapacity Penalty)
  if (isOverCapacity) {
    const penaltyAmt = -Math.round((currentPopulation - capacity) * 0.1 * 10) / 10;
    growthItems.push({
      id: 'penalty_overcapacity',
      name: '거점 인구 과밀 한계 패널티',
      label: '거점 인구 과밀 한계 패널티',
      amount: penaltyAmt,
      icon: '⚠️',
      category: 'estate',
      desc: '거점 수용 한도 초과로 인한 주거난 및 질병 위험'
    });
  }

  // 총 합산 계산
  const totalGrowth = growthItems.reduce((sum, item) => sum + item.amount, 0);
  const growthRate = Math.round(totalGrowth * 10) / 10;
  const formattedGrowth = growthRate > 0 ? `+${growthRate}명` : `${growthRate}명`;

  const growthPercent = currentPopulation > 0 
    ? Math.round((growthRate / currentPopulation) * 1000) / 10
    : 1.0;
  const formattedGrowthPercent = growthPercent > 0 ? `+${growthPercent}%` : `${growthPercent}%`;

  // 상태 레이블 및 색상
  let growthStatusLabel = '안정적 성장';
  let growthStatusColor = '#4ade80';
  if (growthRate >= 5.0) {
    growthStatusLabel = '급속 번영 (우수)';
    growthStatusColor = '#34d399';
  } else if (growthRate > 0) {
    growthStatusLabel = '완만한 증가';
    growthStatusColor = '#a3e635';
  } else if (growthRate === 0) {
    growthStatusLabel = '정체 상태';
    growthStatusColor = '#fbbf24';
  } else {
    growthStatusLabel = '인구 감소 위기';
    growthStatusColor = '#f87171';
  }

  return {
    currentPopulation,
    previousPopulation,
    rawString: rawPopStr || `${currentPopulation}명`,
    delta,
    formattedDelta,
    recentDeltaLabel: formattedDelta,
    growthRate,
    formattedGrowth,
    growthPercent,
    formattedGrowthPercent,
    capacity,
    maxCapacity: capacity,
    capacityRatio,
    isOverCapacity,
    isOvercrowded: isOverCapacity,
    growthItems,
    growthStatusLabel,
    growthStatusColor
  };
}
