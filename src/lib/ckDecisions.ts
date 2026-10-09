import { ParsedState } from './parser';
import { CKResources } from './ckVisuals';

export interface CKDecision {
  id: string;
  category: 'piety' | 'prestige';
  title: string;
  subtitle: string;
  cost: number;
  costType: '신앙' | '위신';
  icon: string;
  description: string;
  historicalLore: string;
  effects: string[];
  requiredTier: number;         // 요구 최소 단계 (1 ~ 5)
  requiredStatus?: string[];     // 특정 신분 전용 (옵션)
  actionCommand: string;         // 유저가 결단 실행 시 LLM에 전송할 시스템 행동 지시문
}

// 1. 신앙 소모형 결단 5종 (Piety Decisions)
export const PIETY_DECISIONS: CKDecision[] = [
  {
    id: 'piety_absolution',
    category: 'piety',
    title: '교황청 공식 사면령 및 영적 참회식',
    subtitle: '스트레스 정화 및 세간의 악명·추문 세탁',
    cost: 60,
    costType: '신앙',
    icon: '🕊️',
    requiredTier: 2,
    description: '교황청과 고위 교구의 권위로 과거의 과오를 공식 사면받고 영적 정화를 선포합니다.',
    historicalLore: '중세 가톨릭 교회는 특별 대사(Indulgentia)와 고해성사를 통해 죄를 사하고 파문이나 사회적 비난을 공식적으로 거두어들였습니다.',
    effects: [
      '심리적 압박감 및 스트레스 -35 대폭 경감',
      '플레이어에게 부여된 악명, 불명예 및 부정적 소문 태그 즉시 정화',
      '신도 및 교구민의 종교적 신뢰도 +15 상승'
    ],
    actionCommand: `[시스템 명령] 신앙 60을 소모하여 '교황청 공식 사면령 및 영적 참회식'을 엄숙히 거행함. 나의 과거 죄악과 세간의 추문이 교황청의 거룩한 인장 아래 공식 사면되었으며, 내면의 스트레스가 정화되고 영적 평온을 되찾았음을 서사에 반영하십시오.`
  },
  {
    id: 'piety_relic_blessing',
    category: 'piety',
    title: '성유물 일반 공개 및 대성당 강복식',
    subtitle: '영지 전역 민심 1단계 상승 및 십일조 수입 증대',
    cost: 100,
    costType: '신앙',
    icon: '✨',
    requiredTier: 3,
    description: '수도원과 성당에 봉안된 성인들의 거룩한 유골과 유물을 대중에게 공개하고 대규모 축복식을 집전합니다.',
    historicalLore: '성인들의 유물 순례는 수만 명의 순례자를 끌어모았으며, 영지의 경제를 살리고 민심을 결집하는 가장 강력한 종교적 수단이었습니다.',
    effects: [
      '영지 민심 등급 즉시 1단계 격상 (예: 보통 → 양호)',
      '향후 3턴간 순례자 헌금 유입으로 교회 헌금 세입 +30% 증폭',
      '영지 내 역병 및 흉년 피해 위험도 대폭 완화'
    ],
    actionCommand: `[시스템 명령] 신앙 100을 소모하여 '성유물 일반 공개 및 대성당 강복식'을 거행함. 수많은 신도와 순례자가 몰려들어 성유물 앞에서 눈물을 흘리며 신앙을 고백했고, 영지의 민심이 크게 고양되고 성당 헌금이 급증하는 모습을 서사에 반영하십시오.`
  },
  {
    id: 'piety_inquisition_tribunal',
    category: 'piety',
    title: '이단 심문 및 불온 파벌 종교 재판 회부',
    subtitle: '내부 정적 숙청, 불온 세력 체포 및 재산 몰수',
    cost: 150,
    costType: '신앙',
    icon: '⚖️',
    requiredTier: 3,
    description: '교리와 교단의 순수성을 수호한다는 명분 아래 내부의 정적과 불온한 봉신들을 종교 재판에 회부합니다.',
    historicalLore: '이단 심문(Inquisitio)은 단순한 종교적 단죄를 넘어, 정적의 권력을 합법적으로 무너뜨리고 그들의 영지와 은화를 몰수하는 최고의 정치적 칼날이었습니다.',
    effects: [
      '플레이어를 위협하던 암살 및 내부 파벌 음모 강제 분쇄',
      '피고인들의 사재를 압류하여 거액의 군자금/헌금 일시금 국고 귀속',
      '영지 치안 안정도 대폭 강화 (불순분자 일망타진)'
    ],
    actionCommand: `[시스템 명령] 신앙 150을 소모하여 '이단 심문 및 불온 파벌 종교 재판'을 개정함. 교리를 거스르고 음모를 꾸미던 정적들과 불온한 무리를 합법적인 종교 재판으로 단죄하여 체포하고, 그들의 불법 재산을 성당 국고로 몰수했음을 서사에 반영하십시오.`
  },
  {
    id: 'piety_papal_claim_petition',
    category: 'piety',
    title: '인접 세속 영지에 대한 정당한 영유 명분(Claim) 교황청 청원',
    subtitle: '피 한 방울 흘리지 않고 이웃 영지 지배 명분 날인 획득',
    cost: 220,
    costType: '신앙',
    icon: '📜',
    requiredTier: 4,
    description: '독실한 공헌과 교단 내 위상을 바탕으로 교황청에 인접 백작령/남작령의 합법적 지배 명분을 요청합니다.',
    historicalLore: '로마 교황청은 세속 영주의 죄악이나 부적격성을 이유로 다른 독실한 가문에게 해당 영지에 대한 합법적 침공 및 수봉 명분을 수여할 권한을 지녔습니다.',
    effects: [
      '인접한 유력 영지에 대한 합법적인 침공/합병 명분(Claim) 영구 획득',
      '명분 없는 불법 전쟁 페널티 완전 면제',
      '주변 세속 군주들과의 외교적 발언권 및 위협도 급상승'
    ],
    actionCommand: `[시스템 명령] 신앙 220을 소모하여 '인접 세속 영지에 대한 정당한 영유 명분 교황청 청원'을 성공시킴. 교황청에서 붉은 밀랍 인장이 찍힌 성령 칙서를 발송하여, 부도덕한 이웃 영지의 영유권을 정당하게 승계받을 수 있는 공식 명분을 획득했음을 서사에 반영하십시오.`
  },
  {
    id: 'piety_synod_sovereignty',
    category: 'piety',
    title: '교구 총회(시노드) 소집 및 신성 자치 불가침권 선포',
    subtitle: '세속 영주 과세 요구 영구 거부 및 절대 주교령 확립',
    cost: 300,
    costType: '신앙',
    icon: '👑',
    requiredTier: 5,
    description: '교구 내 모든 고위 성직자들을 소집하여 세속 제후의 부당한 간섭을 영구 배격하는 거룩한 자치권을 선포합니다.',
    historicalLore: '교구 총회(Synod)는 주교와 수도원장들이 모여 세속 법정을 초월하는 교회법을 제정하고 황제나 대공의 간섭으로부터 교회의 자유(Libertas Ecclesiae)를 쟁취하던 장이었습니다.',
    effects: [
      '세속 군주에게 지출되던 모든 공납세 및 과세 의무 영구 면제',
      '영지 내 종교 재판권 및 독자 조세권의 완전한 독립 확립',
      '교황청 및 타국 주교들과의 신성 동맹 결성'
    ],
    actionCommand: `[시스템 명령] 신앙 300을 소모하여 '교구 총회(시노드) 소집 및 신성 자치 불가침권 선포'를 완수함. 장엄한 성가 속에서 교회의 자유(Libertas Ecclesiae)를 선언하여 세속 영주들의 부당한 간섭과 세금 징수를 영구 무효화하고, 독자적인 주교령의 절대 권위를 천명했음을 서사에 반영하십시오.`
  }
];

// 2. 위신 소모형 결단 5종 (Prestige Decisions)
export const PRESTIGE_DECISIONS: CKDecision[] = [
  {
    id: 'prestige_grand_feast',
    category: 'prestige',
    title: '성대한 궁정 연회 및 기사 마상 시합 개최',
    subtitle: '주변 제후·봉신 호감도 급증 및 유력 인재 등용',
    cost: 80,
    costType: '위신',
    icon: '🍷',
    requiredTier: 2,
    description: '인근의 제후들과 명망 높은 기사, 음유시인들을 거점으로 초대하여 사흘 밤낮으로 호화로운 연회를 엽니다.',
    historicalLore: '중세의 연회와 토너먼트는 영주의 재력과 명망을 과시하고 봉신들의 충성 서약을 다지는 핵심적인 정치 무대였습니다.',
    effects: [
      '관계망에 등록된 모든 인물들의 신뢰도 +20, 우정도/애정도 +15 상승',
      '전투력과 기량이 뛰어난 방랑 기사나 유능한 행정 인재 1명 즉시 가신으로 영입',
      '영지 치안 및 군율 안정'
    ],
    actionCommand: `[시스템 명령] 위신 80을 소모하여 '성대한 궁정 연회 및 기사 마상 시합'을 성황리에 개최함. 각지의 제후들과 기사들이 찾아와 건배를 외치고 충성을 다짐했으며, 뛰어난 인재가 내 가신으로 들어오고 모든 이들과의 관계가 돈독해졌음을 서사에 반영하십시오.`
  },
  {
    id: 'prestige_dynastic_alliance',
    category: 'prestige',
    title: '유력 대가문과의 정략 동맹 강제 청원',
    subtitle: '지참금 없이도 강력한 군사 대가문과 방위 동맹 체결',
    cost: 140,
    costType: '위신',
    icon: '🤝',
    requiredTier: 3,
    description: '자신의 드높은 명성과 가문 위세를 내세워 부유하고 강력한 이웃 대제후 가문과 결속을 맺습니다.',
    historicalLore: '드높은 가문 위신(Fame)을 지닌 가문은 거액의 지참금이나 토지 분봉 없이도 상위 귀족 가문과의 결합을 성사시킬 수 있었습니다.',
    effects: [
      '외부 침공 시 즉시 원군을 파병해 줄 유력 군사 동맹국 확보',
      '세력 관계망의 [동맹] 탭 개방 및 외교적 위상 급상승',
      '상대 가문 후계 구도에 대한 합법적 정치 개입 권한 획득'
    ],
    actionCommand: `[시스템 명령] 위신 140을 소모하여 '유력 대가문과의 정략 동맹 강제 청원'을 성사시킴. 나의 압도적인 명성과 위세에 감복한 유력 대제후 가문이 흔쾌히 혈맹의 서약을 맺고 방위 동맹을 체결했음을 서사에 반영하십시오.`
  },
  {
    id: 'prestige_rally_knights',
    category: 'prestige',
    title: '의용 기사단 및 정예 결사대 긴급 징집',
    subtitle: '재정 지출 없이 명성만으로 정예 상비군 50~100명 즉각 합류',
    cost: 180,
    costType: '위신',
    icon: '⚔️',
    requiredTier: 3,
    description: '영주의 명예로운 이름 아래 전장의 영광을 좇는 명예 기사들과 자유 용병들을 급히 집결시킵니다.',
    historicalLore: '전설적인 명장이나 존경받는 군주가 군기를 들면 봉급을 받지 않고도 전공과 명예만을 위해 달려오는 의용 기사들이 있었습니다.',
    effects: [
      '골드 비용 지출 없이 즉시 정예 병력(+60~100명)이 거점에 영구 합류',
      '부대 사기 및 군사 준비도 등급이 [번영/전성] 상태로 즉시 도약',
      '적대 세력의 기습 공성 위험 대폭 억제'
    ],
    actionCommand: `[시스템 명령] 위신 180을 소모하여 '의용 기사단 및 정예 결사대 긴급 징집'을 단행함. 나의 명성을 흠모하던 백전노장 기사들과 정예 장창병들이 깃발 아래로 결집하여 정규 병력으로 합류했으며, 군대의 기세가 하늘을 찌르게 되었음을 서사에 반영하십시오.`
  },
  {
    id: 'prestige_puppet_regency',
    category: 'prestige',
    title: '막후의 권력 행사: 타 가문 후계자 괴뢰 책봉 및 섭정권 장악',
    subtitle: '은밀한 혈통이나 약점을 쥔 영지의 후계자를 꼭두각시로 등극',
    cost: 250,
    costType: '위신',
    icon: '♟️',
    requiredTier: 4,
    description: '\'막후의 지배자\' 고유 결단. 타 가문의 후계 구도에 깊숙이 개입하여 자신의 뜻대로 움직이는 괴뢰를 세우고 섭정으로 군림합니다.',
    historicalLore: '중세의 막후 실력자들은 어린 영주를 옹립하고 섭정 의회(Regency Council)를 장악하여 영지의 실권을 완전히 틀어쥐었습니다.',
    effects: [
      '해당 영지의 국고 세입 50%가 매 턴 플레이어에게 비밀 배당금으로 상납',
      '은밀한 혈통의 아이를 적법 후계자로 공식 공인',
      '상대 가문의 병력 지휘권을 플레이어가 합법적으로 징발 가능'
    ],
    actionCommand: `[시스템 명령] 위신 250을 소모하여 '막후의 권력 행사: 타 가문 후계자 괴뢰 책봉 및 섭정권 장악' 결단을 발동함. '막후의 지배자'인 나의 압도적인 명성과 치밀한 배후 공작으로 경쟁 가문의 적법 후계자를 꼭두각시로 옹립하고 내가 전권을 휘두르는 영지 섭정으로 공식 등극했음을 서사에 반영하십시오.`
  },
  {
    id: 'prestige_dynastic_legacy',
    category: 'prestige',
    title: '새로운 가문 전통 선포 및 영구 조례 제정',
    subtitle: '직할 영지 한계 +1 영구 증가 및 턴 당 세입 +20% 영구 강화',
    cost: 350,
    costType: '위신',
    icon: '🏛️',
    requiredTier: 5,
    description: '가문의 명성이 정점에 달했을 때, 수백 년간 이어질 불멸의 가문 법령과 영지 조례를 반포합니다.',
    historicalLore: '카를 대제의 카피툴라리아(Capitularia)처럼 전설적인 군주가 반포한 영구 조례는 법률을 초월하는 제국의 기틀이 되었습니다.',
    effects: [
      '직할 영지/거점 보유 한계치(Domain Limit) 영구 +1개소 추가',
      '거점 생산 수익 및 세력 재정 수입 영구 +20% 가산',
      '후계자에게 상속되는 초기 위신 및 명망 영구 보존'
    ],
    actionCommand: `[시스템 명령] 위신 350을 소모하여 '새로운 가문 전통 선포 및 영구 조례 제정'을 반포함. 나의 위대한 업적이 세대를 초월할 불멸의 법률로 제정되어, 직할 영지 한계가 영구히 +1 확장되고 모든 영지의 생산과 세입이 크게 번영하게 되었음을 서사에 반영하십시오.`
  }
];

export const ALL_DECISIONS = [...PIETY_DECISIONS, ...PRESTIGE_DECISIONS];

export function getAvailableDecisions(resources: CKResources): {
  available: CKDecision[];
  locked: { decision: CKDecision; reason: string }[];
} {
  const available: CKDecision[] = [];
  const locked: { decision: CKDecision; reason: string }[] = [];

  ALL_DECISIONS.forEach(dec => {
    const isPiety = dec.category === 'piety';
    const currentScore = isPiety ? resources.pietyScore : resources.prestigeScore;
    const currentTier = isPiety ? resources.pietyTier : resources.prestigeTier;

    if (currentTier < dec.requiredTier) {
      locked.push({
        decision: dec,
        reason: `${dec.costType} ${dec.requiredTier}단계 이상 필요 (현재 Lv.${currentTier})`
      });
    } else if (currentScore < dec.cost) {
      locked.push({
        decision: dec,
        reason: `${dec.costType} 점수 부족 (${currentScore} / ${dec.cost})`
      });
    } else {
      available.push(dec);
    }
  });

  return { available, locked };
}
