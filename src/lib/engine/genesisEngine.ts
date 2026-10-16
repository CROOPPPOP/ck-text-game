import { ParsedState } from '../parser';
import { INTELLIGENCE_TRAITS, PHYSICAL_TRAITS, BEAUTY_TRAITS, FLAW_TRAITS, CongenitalTraitDef } from '../geneticEngine';

export interface GenesisCardData {
  name: string;
  age: number;
  birthYear: number;
  gender: '남성' | '여성';
  status: string;
  archetype: 'wanderer' | 'company' | 'clergy' | 'noble';
  region: string;
  culture: string;
  religion: string;
  houseName: string;
  houseMotto: string;
  parentsDescription: string;
  congenitalTrait: CongenitalTraitDef;
  birthStory: string;
  startingWeapon: string;
  startingGold: number;
  startingItems: string[];
}

interface BirthTemplate {
  status: string;
  archetype: 'wanderer' | 'company' | 'clergy' | 'noble';
  weight: number; // 확률 가중치
  parentStories: string[];
  weapons: string[];
  goldRange: [number, number];
  items: string[];
  startingEstate: {
    type: string;
    level: string;
    buildings: { name: string; level: number; tags: string[]; desc: string }[];
  };
}

const BIRTH_TEMPLATES: BirthTemplate[] = [
  // 1. 소작농 / 농노 / 평민 (50% 확률)
  {
    status: '소작농',
    archetype: 'wanderer',
    weight: 35,
    parentStories: [
      '흉년으로 빚을 진 소작농 부부의 넷째 아이로 허물어져 가는 짚더미 오두막에서 태어났습니다.',
      '영주의 가혹한 조세를 견디지 못하고 도망친 개척 농민 가정에서 거친 손으로 자라났습니다.',
      '양털을 깎고 방적기를 돌리던 가난한 직조공 어머니의 유복자로 마을 변방에서 자랐습니다.'
    ],
    weapons: ['손질된 무쇠 낫', '무딘 벌목용 도끼', '참나무 몽둥이'],
    goldRange: [5, 15],
    items: ['어머니의 거친 모직 망토', '보리빵 한 덩이', '성모 마리아 나무 묵주'],
    startingEstate: {
      type: '오두막',
      level: 'Lv.1 흙벽 짚오두막',
      buildings: [
        { name: '작은 텃밭 및 화덕', level: 1, tags: ['민생', '생존'], desc: '하루 끼니를 잇기 위한 소박한 화덕과 텃밭' }
      ]
    }
  },
  {
    status: '도제',
    archetype: 'wanderer',
    weight: 15,
    parentStories: [
      '자유 도시의 허름한 대장간 화덕 앞, 쇠망치 소리를 자장가 삼아 태어난 대장장이의 아들입니다.',
      '가죽 무두질 공방을 운영하던 아버지 밑에서 어릴 때부터 가죽 다듬는 법을 배웠습니다.',
      '목수 길드의 말단 장인 가정에서 자라나 나무와 석재 다루는 눈썰미를 익혔습니다.'
    ],
    weapons: ['대장장이 쇠망치', '다목적 무두질 칼', '무거운 쇠지렛대'],
    goldRange: [12, 25],
    items: ['길드 입문 증서 사본', '숫돌과 가죽 주머니', '구리 동전 주머니'],
    startingEstate: {
      type: '공방',
      level: 'Lv.1 수습 장인 셋방',
      buildings: [
        { name: '작업용 모루와 도구함', level: 1, tags: ['생산', '장인'], desc: '간단한 도구를 수리할 수 있는 작업 공간' }
      ]
    }
  },

  // 2. 방랑자 / 용병 / 도적 (25% 확률)
  {
    status: '용병',
    archetype: 'wanderer',
    weight: 15,
    parentStories: [
      '영주 간의 국경 분쟁 속에서 떠돌이 용병단 숙영지의 천막 아래서 태어났습니다.',
      '전사한 용병 기사의 유복자로, 쇠사슬 갑옷 냄새와 말발굽 소리를 들으며 청년이 되었습니다.',
      '도적 떼의 습격으로 마을을 잃고 살아남기 위해 일찍부터 칼을 쥔 거친 방랑자입니다.'
    ],
    weapons: ['손때 묻은 무쇠 아밍 소드', '날렵한 사냥용 활과 화살집', '가죽 손잡이 창'],
    goldRange: [20, 45],
    items: ['닳고 닳은 가죽 흉갑', '붕대와 소독용 독주', '야영용 부싯돌과 모포'],
    startingEstate: {
      type: '야영지',
      level: 'Lv.1 이동식 방랑 야영지',
      buildings: [
        { name: '방수 가죽 텐트와 모닥불', level: 1, tags: ['군사', '생존'], desc: '비바람을 막고 무구를 정비하는 임시 거처' }
      ]
    }
  },
  {
    status: '방랑 검사',
    archetype: 'wanderer',
    weight: 10,
    parentStories: [
      '가문이 몰락하여 영지를 빼앗긴 전직 기사의 서자로, 오직 한 자루 검과 명예만을 물려받았습니다.',
      '주막과 결투장을 전전하며 푼돈과 명성을 좇아 검술을 연마한 외로운 방랑객입니다.'
    ],
    weapons: ['선대의 강철 롱소드', '균형 잡힌 레이피어', '양손 대검'],
    goldRange: [25, 50],
    items: ['색 바랜 가문 문장 펜던트', '가죽 칼집', '기사도 무용담 양피지'],
    startingEstate: {
      type: '야영지',
      level: 'Lv.1 무예 수련 야영지',
      buildings: [
        { name: '검술 훈련용 목제 표적', level: 1, tags: ['군사', '무예'], desc: '날마다 기량을 갈고닦는 훈련 공간' }
      ]
    }
  },

  // 3. 수도자 / 사제 (10% 확률)
  {
    status: '학사',
    archetype: 'clergy',
    weight: 6,
    parentStories: [
      '수도원 정문 계단에 바구니에 담긴 채 버려졌던 고아로, 자비로운 노수사의 손에 자라났습니다.',
      '몰락한 지방 필경사의 자식으로, 종교 라틴어와 고문서 필사를 배우며 지혜를 쌓았습니다.'
    ],
    weapons: ['단단한 물푸레나무 지팡이', '의전용 은장도'],
    goldRange: [15, 35],
    items: ['라틴어 성경 사본', '잉크병과 깃펜', '약초 연고 주머니'],
    startingEstate: {
      type: '수도소',
      level: 'Lv.1 수도원 기도실 셋방',
      buildings: [
        { name: '소형 고문서 서가와 책상', level: 1, tags: ['학문', '종교'], desc: '경전과 약초학 서적을 필사하는 학구 공간' }
      ]
    }
  },
  {
    status: '도제 사제',
    archetype: 'clergy',
    weight: 4,
    parentStories: [
      '경건한 마을 교구 신부 밑에서 복사(Acolyte)로 미사를 도우며 성직의 길을 걷기 시작했습니다.'
    ],
    weapons: ['참나무 십자가 지팡이'],
    goldRange: [20, 40],
    items: ['축성받은 성유 병', '은도금 십자가 목걸이', '교구 성무일도서'],
    startingEstate: {
      type: '사제관',
      level: 'Lv.1 교구 부속 작은 사제관',
      buildings: [
        { name: '촛대와 기도대', level: 1, tags: ['신앙', '안식'], desc: '영민들을 위해 기도하고 고해를 듣는 방' }
      ]
    }
  },

  // 4. 하급 기사 / 가신 (10% 확률)
  {
    status: '용병대장',
    archetype: 'company',
    weight: 6,
    parentStories: [
      '국경 수비대의 노련한 십부장의 맏아들로 태어나, 열대여섯 명의 사내들을 이끄는 법을 배웠습니다.'
    ],
    weapons: ['견고한 노르만 기병창', '사슬 갑옷 덧옷', '참나무 기병 방패'],
    goldRange: [40, 70],
    items: ['부대 깃발과 나팔', '말 한 필과 안장', '군자금 가죽 쌈지'],
    startingEstate: {
      type: '군영',
      level: 'Lv.1 소규모 주둔 막사',
      buildings: [
        { name: '무기고 및 마구간', level: 1, tags: ['군사', '기동'], desc: '단원들의 무기와 말을 관리하는 시설' }
      ]
    }
  },
  {
    status: '장원 관리인',
    archetype: 'company',
    weight: 4,
    parentStories: [
      '백작 장원의 충직한 집사 가문에서 태어나, 토지 장부 계산과 조세 수취의 실무를 익혔습니다.'
    ],
    weapons: ['귀족 호신용 세검', '철퇴(Mace)'],
    goldRange: [50, 85],
    items: ['양피지 장부와 깃펜', '영주 인장 위임장', '청동 주판'],
    startingEstate: {
      type: '장원',
      level: 'Lv.1 장원 관리사무소',
      buildings: [
        { name: '곡물 계량소와 창고', level: 1, tags: ['경제', '행정'], desc: '영지 소작료와 곡물을 검수하는 창고' }
      ]
    }
  },

  // 5. 봉건 영주 / 귀족 금수저 잭팟 (5% 확률)
  {
    status: '남작',
    archetype: 'noble',
    weight: 5,
    parentStories: [
      '선대 남작의 정당한 적장자로 성채 안락한 침상에서 태어나, 가문의 문장과 기사도를 이어받았습니다.',
      '국왕의 친위 기사였던 아버지가 전사하며 남작령과 가문의 영광을 물려받게 되었습니다.'
    ],
    weapons: ['가문 대대로 내려온 명검', '은도금 문장 방패', '사슬 흉갑'],
    goldRange: [70, 120],
    items: ['가문 인장 반지', '영지 토지 대장 사본', '봉토 봉건 서약문'],
    startingEstate: {
      type: '남작 장원',
      level: 'Lv.2 남작 석조 장원',
      buildings: [
        { name: '석조 본관 안채', level: 2, tags: ['행정', '거주'], desc: '영주 일가의 거처이자 행정 집무실' },
        { name: '목조 감시탑 및 위병소', level: 1, tags: ['군사', '치안'], desc: '가도 감시 및 영지 방어 시설' }
      ]
    }
  }
];

const HISTORICAL_REGIONS = [
  { region: '노르망디 루앙 성채', culture: '노르만', religion: '가톨릭', maleNames: ['샤를', '기욤', '로베르', '앙리', '보두앵'], femaleNames: ['아델', '마틸다', '엠마', '엘레오노르'], houses: ['드 발루아', '드 노르망디', '드 블루아', '드 클레어'] },
  { region: '잉글랜드 웨식스 윈체스터', culture: '앵글로색슨', religion: '가톨릭', maleNames: ['에드워드', '해롤드', '알프레드', '에드가'], femaleNames: ['에디스', '엘프기푸', '고드기푸'], houses: ['고드윈', '웨식스', '머시아'] },
  { region: '프랑스 일드프랑스 파리', culture: '프랑스', religion: '가톨릭', maleNames: ['필리프', '루이', '위그', '피에르'], femaleNames: ['잔', '블랑슈', '마리'], houses: ['카페', '드 베르망두아', '드 몽모랑시'] },
  { region: '신성로마제국 바이에른', culture: '독일', religion: '가톨릭', maleNames: ['하인리히', '오토', '콘라트', '프리드리히'], femaleNames: ['기젤라', '베아트릭스', '아그네스'], houses: ['비텔스바흐', '살리에르', '슈타우펜'] },
  { region: '이베리아 톨레도', culture: '카스티야', religion: '가톨릭', maleNames: ['로드리고', '알폰소', '산초', '페르난도'], femaleNames: ['히메나', '우라카', '엘비라'], houses: ['비바르', '히메네스', '라라'] },
  { region: '비잔티움 콘스탄티노폴리스', culture: '그리스', religion: '정교회', maleNames: ['알렉시오스', '미카엘', '콘스탄티노스', '요안니스'], femaleNames: ['안나', '조이', '에이레네'], houses: ['콤니노스', '두카스', '팔레올로고스'] },
  { region: '동방 고려 개경', culture: '고려', religion: '불교', maleNames: ['왕무', '김부식', '최충', '윤관'], femaleNames: ['연화', '설희', '수련'], houses: ['개성 왕씨', '경원 이씨', '해주 최씨'] }
];

const HOUSE_MOTTOS = [
  '명예와 긍지',
  '바위처럼 굳건하게',
  '어둠 속의 칼날',
  '피와 흙의 서약',
  '신이 원하신다',
  '오직 전진할 뿐',
  '백성의 방패'
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 선천적 유전 특성 무작위 추첨 (70% 긍정, 30% 중립/결함)
 */
function pickRandomCongenitalTrait(): CongenitalTraitDef {
  const pool = [
    ...INTELLIGENCE_TRAITS,
    ...PHYSICAL_TRAITS,
    ...BEAUTY_TRAITS,
    ...FLAW_TRAITS
  ];
  return getRandomElement(pool);
}

/**
 * 가중치 기반 무작위 신분 템플릿 선택
 */
function pickRandomBirthTemplate(): BirthTemplate {
  const totalWeight = BIRTH_TEMPLATES.reduce((sum, t) => sum + t.weight, 0);
  let randomVal = Math.random() * totalWeight;

  for (const t of BIRTH_TEMPLATES) {
    if (randomVal < t.weight) return t;
    randomVal -= t.weight;
  }
  return BIRTH_TEMPLATES[0];
}

/**
 * 🎲 핵심 함수: 무작위 중세 출생 데이터 생성
 */
export function rollRandomBirth(): {
  cardData: GenesisCardData;
  gameState: ParsedState;
} {
  const template = pickRandomBirthTemplate();
  const regionInfo = getRandomElement(HISTORICAL_REGIONS);
  const gender: '남성' | '여성' = Math.random() < 0.65 ? '남성' : '여성';
  const nameList = gender === '남성' ? regionInfo.maleNames : regionInfo.femaleNames;
  const name = getRandomElement(nameList);
  const house = getRandomElement(regionInfo.houses);
  const motto = getRandomElement(HOUSE_MOTTOS);
  const parentStory = getRandomElement(template.parentStories);
  const congenital = pickRandomCongenitalTrait();
  const weapon = getRandomElement(template.weapons);
  const gold = getRandomInt(template.goldRange[0], template.goldRange[1]);
  const birthYear = 1050; // 16세에 1066년이 되도록 설정

  const cardData: GenesisCardData = {
    name,
    age: 16, // 본격적인 역사적 결단이 시작되는 성인식 나이
    birthYear,
    gender,
    status: template.status,
    archetype: template.archetype,
    region: regionInfo.region,
    culture: regionInfo.culture,
    religion: regionInfo.religion,
    houseName: house,
    houseMotto: motto,
    parentsDescription: parentStory,
    congenitalTrait: congenital,
    birthStory: `서기 ${birthYear}년, ${regionInfo.region}의 거친 바람 속에서 당신의 첫 울음소리가 터져 나왔습니다. ${parentStory} 모진 풍파를 견디며 마침내 16세 청년으로 장성하여, 역사와 운명의 거대한 소용돌이 속으로 첫 발을 내딛습니다.`,
    startingWeapon: weapon,
    startingGold: gold,
    startingItems: template.items
  };

  // 선천/후천 스탯 초기화
  const innateStats: Record<string, string> = {
    '근력': `${getRandomInt(45, 62)} (보통)`,
    '체력': `${getRandomInt(48, 65)} (강건)`,
    '지구력': `${getRandomInt(45, 60)} (보통)`,
    '민첩성': `${getRandomInt(45, 60)} (보통)`,
    '지능': `${getRandomInt(48, 65)} (보통)`,
    '의지력': `${getRandomInt(50, 68)} (강철)`,
    '지각력': `${getRandomInt(48, 62)} (우수)`
  };

  const acquiredStats: Record<string, string> = {
    '통솔력': `${getRandomInt(8, 14)}`,
    '매력': `${getRandomInt(8, 13)}`,
    '외교력': `${getRandomInt(8, 13)}`,
    '행정력': `${getRandomInt(8, 15)}`,
    '전투력': `${getRandomInt(9, 15)}`,
    '무기 숙련도': `${getRandomInt(9, 14)}`,
    '생존술': `${getRandomInt(10, 16)}`,
    '학문': `${getRandomInt(6, 12)}`
  };

  // 유전 특성 적용
  const startingTraits: any[] = [
    {
      category: '선천특성',
      name: congenital.name,
      tier: '유전 특성',
      description: `${congenital.description} (${congenital.effects.join(', ')})`
    },
    {
      category: '전문특성',
      name: `${template.status}의 길`,
      tier: '확립된 특성',
      description: `자라온 환경에서 체득한 ${template.status}로서의 생존 지혜`
    }
  ];

  // 신분별 4대 초기 선택지 구성
  let initialChoices: any[] = [];
  if (template.archetype === 'wanderer') {
    initialChoices = [
      {
        id: '1',
        type: '생존·무예',
        groupType: '개인 전투',
        text: '마을 주변을 어지럽히는 늑대 무리와 도적단을 소탕하여 현상금을 노린다.',
        probability: '성공률 65% (기량 판정)'
      },
      {
        id: '2',
        type: '건설·정착',
        groupType: '영지 경영',
        text: '[건설] 마을 공터에 튼튼한 목조 오두막을 짓고 텃밭을 일궈 기반을 닦는다.',
        probability: '비용: 금화 10, 소요 2달 (치안·민생 상승)'
      },
      {
        id: '3',
        type: '입신양명',
        groupType: '외교·정치',
        text: '지방 남작의 성채로 찾아가 호위 무관이나 문지기로 등용을 청원한다.',
        probability: '성공률 55% (신분 상승의 기회)'
      },
      {
        id: '4',
        type: '방랑·탐색',
        groupType: '돌발·모험',
        text: '익숙한 고향을 뒤로하고 소문이 무성한 대도시로 방랑의 길을 떠난다.',
        probability: '새로운 기회와 위험 공존'
      }
    ];
  } else if (template.archetype === 'clergy') {
    initialChoices = [
      {
        id: '1',
        type: '학문·필사',
        groupType: '종교·학술',
        text: '수도원 서고에서 밤을 지새우며 고대 의술과 성경을 필사하여 지식을 쌓는다.',
        probability: '학습력 대폭 상승, 신앙 +15'
      },
      {
        id: '2',
        type: '건설·자선',
        groupType: '영지 경영',
        text: '[건설] 사제관 옆에 빈민 구호용 작은 약초 시약소를 증축한다.',
        probability: '비용: 금화 15, 소요 1달 (민심 대폭 상승)'
      },
      {
        id: '3',
        type: '설교·민심',
        groupType: '외교·민생',
        text: '가뭄과 흉년으로 고통받는 마을 영민들을 찾아가 위로하고 구호 빵을 나눈다.',
        probability: '성공률 80% (지역 신망 획득)'
      },
      {
        id: '4',
        type: '교단 정치',
        groupType: '외교·정치',
        text: '주교관에 파견되어 교구 총대리의 서무를 보조하며 입지를 다진다.',
        probability: '성직 승격 사다리 진입'
      }
    ];
  } else {
    // noble / company
    initialChoices = [
      {
        id: '1',
        type: '영지 순찰',
        groupType: '군사·치안',
        text: '기사단을 이끌고 국경 지대를 순찰하며 침략자들에게 가문의 깃발을 과시한다.',
        probability: '치안 +10, 부대 사기 진작'
      },
      {
        id: '2',
        type: '건설·경제',
        groupType: '영지 경영',
        text: '[건설] 가도 변에 통행세 징수소 및 장원 창고를 증축하여 재정을 확충한다.',
        probability: '비용: 금화 35, 소요 2달 (월 수입 증가)'
      },
      {
        id: '3',
        type: '정치·혼인',
        groupType: '외교·정치',
        text: '인근 백작 가문에 친선 사절을 보내 정치적 혼인 동맹의 가능성을 타진한다.',
        probability: '동맹 및 가문 명성 상승'
      },
      {
        id: '4',
        type: '가신 포상',
        groupType: '내정·가신',
        text: '성채에서 연회를 베풀어 충성스러운 가신단과 기사들에게 하사품을 내린다.',
        probability: '비용: 금화 20 (가신 충성도 급상승)'
      }
    ];
  }

  const gameState: ParsedState = {
    dateLocation: `1066년 10월 (가을) / ${regionInfo.region} [턴 수: 1]`,
    historicalTag: `역사적 고증: 확인됨 (${regionInfo.culture} 문화권, 서기 1066년)`,
    judgment: {
      result: '운명의 서막',
      positive: `${cardData.status}의 신분으로 세상에 첫 발을 내딛음`,
      negative: '가혹한 중세의 풍파와 계급의 벽'
    },
    personalInfo: {
      '이름': name,
      '나이': '16',
      '성별': gender,
      '신분': template.status,
      '직위': template.status,
      '문화': regionInfo.culture,
      '종교': regionInfo.religion,
      '칭호': `${house}의 ${name}`
    },
    playerStatus: [
      { name: '건강', value: '95', risk: '최상', description: '젊고 혈기왕성함' },
      { name: '체력', value: '90', risk: '최상', description: '피로 없음' },
      { name: '통증', value: '0', risk: '안전', description: '외상 없음' },
      { name: '허기', value: '15', risk: '안전', description: '적절한 영양' },
      { name: '갈증', value: '10', risk: '안전', description: '수분 충분' },
      { name: '피로', value: '10', risk: '안전', description: '원기 왕성' },
      { name: '체온', value: '36.5', risk: '안전', description: '정상' },
      { name: '스트레스', value: '10', risk: '안전', description: '자신감 충만' }
    ],
    stats: {
      innate: innateStats,
      acquired: acquiredStats
    },
    traits: startingTraits,
    inventory: {
      '소지 화폐': [`금화 ${gold}`],
      '착용 무구': [weapon],
      '소지품': cardData.startingItems
    },
    factionState: template.archetype === 'noble' 
      ? { '인구': '1,200명', '세력 재정': `금화 ${gold}`, '치안': '안전 (75%)', '민심': '안정 (80%)', '병력': '징집병 100명' }
      : { '통치 상태': `통치 중인 영지 없음 (${template.status})` },
    estate: template.startingEstate,
    buildOptions: [
      { name: '목조 방벽 강화', cost: '금화 25', turns: 2, desc: '거점 방어력 증대', tags: ['군사'] },
      { name: '약초 텃밭 확충', cost: '금화 15', turns: 1, desc: '부상 치료 및 민생 안정', tags: ['민생'] }
    ],
    familyState: {
      spouse: '미혼',
      children: '없음',
      heir: '후계자 없음 (가문 단절 위기)',
      successionLaw: '남계 분할 상속제'
    },
    relationships: {
      personal: [
        `의리의 동료 아르노 (동년배 지인)|호감도: +60`,
        `마을 원로 베르나르도 (지역 조언자)|호감도: +50`
      ],
      faction: [
        `${regionInfo.region} 자치회|관계: 중립`,
        `지역 교구 교회|관계: 우호`
      ]
    },
    objective: {
      ultimateGoal: '중세의 가혹한 풍파 속에서 가문을 일으키고 이름을 남기라',
      currentGoal: `${template.status}의 신분에서 벗어나 한 단계 더 높은 지위로 입신양명하기`,
      currentProgress: '5%',
      totalProgress: '100%',
      status: '진행 중',
      summary: cardData.birthStory
    },
    narrative: `가을비가 차갑게 대지를 적시는 가운데, ${regionInfo.region}의 흙내음이 코끝을 스칩니다.
열여섯 살 성인의 날을 맞이한 당신의 손에는 아버지에게서 물려받은 ${weapon}이(가) 쥐어져 있습니다.
${parentStory}
마을 어귀를 나서자, 저 멀리 웅장한 영주의 성채와 가도를 오가는 상단들의 분주한 행렬이 시야에 들어옵니다.
누군가는 흙을 파다 일생을 마감하고, 누군가는 전장에서 칼을 쥐고 영주가 됩니다.
80억의 생명 중 오직 단 하나뿐인 당신의 인생이 지금 시작됩니다.`,
    choices: initialChoices
  };

  return { cardData, gameState };
}
