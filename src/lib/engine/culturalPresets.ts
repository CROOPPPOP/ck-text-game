export type CultureRegion = 'europe' | 'middle_east' | 'east_asia';

export interface StatusPreset {
  id: string;
  icon: string;
  name: string;
  shortDesc: string;
  playerStatus: string;
  goal?: string;
  additional?: string;
}

export interface ArchetypeConfig {
  id: string;
  num: string;
  icon: string;
  title: string;
  subtitle: string;
  badge: string;
  desc: string;
  status: string;
  location: string;
  goal: string;
  additional: string;
  trait: string;
  statusPresets: StatusPreset[];
  innateStats?: Record<string, number>;
  acquiredStats?: Record<string, number>;
  startingTraitsMap?: Record<string, string[]>;
}

export interface CultureRegionMeta {
  id: CultureRegion;
  label: string;
  name: string;
  icon: string;
  subtitle: string;
  desc: string;
  defaultRuler: string;
}

export const CULTURE_REGIONS: CultureRegionMeta[] = [
  {
    id: 'europe',
    label: '유럽 봉건권',
    name: '유럽 봉건권',
    icon: '🏰',
    subtitle: '기사도 · 가톨릭 교단 · 장원 봉건제',
    desc: '서유럽과 중앙유럽, 브리튼, 지중해를 무대로 봉토 수봉과 기사도, 교황청의 권위를 둘러싼 역사적 각축전을 펼칩니다.',
    defaultRuler: '영주'
  },
  {
    id: 'middle_east',
    label: '중동·이슬람 & 유목권',
    name: '중동·이슬람 & 유목권',
    icon: '🌙',
    subtitle: '샤리아 율법 · 맘루크 · 실크로드 카라반 · 술탄국',
    desc: '레반트와 카이로, 바그다드, 페르시아, 스텝 초원을 무대로 이슬람 신앙과 이크타 봉토, 대상 무역로를 장악합니다.',
    defaultRuler: '아미르'
  },
  {
    id: 'east_asia',
    label: '동양·동아시아 & 인도권',
    name: '동양·동아시아 & 인도권',
    icon: '🐉',
    subtitle: '사대부 관료제 · 강호 협객 · 번진 절도사 · 천명',
    desc: '동아시아와 인도 아대륙을 무대로 과거 급제와 사대부의 도, 번진 군벌의 패권, 천명을 받드는 천자의 길을 걷습니다.',
    defaultRuler: '수령'
  }
];

// ==============================================================
// 1. 유럽 봉건권 (Europe) - 슬래시 없는 1:1 개별 신분 프리셋
// ==============================================================
const EUROPE_ARCHETYPES: ArchetypeConfig[] = [
  {
    id: 'wanderer',
    num: '1번',
    icon: '🗡️',
    title: '1. 개인 및 방랑자',
    subtitle: '평민 · 소작농 · 용병 · 방랑 검사 · 장인 · 도제 · 학사 · 음유시인 · 부랑자',
    badge: '1인칭 무예 & 생존',
    desc: '영지 없이 단신으로 여관과 산길을 떠돌며 무예와 지혜로 의뢰를 해결하고 명성을 쌓습니다.',
    status: '방랑자',
    location: '국경 지대 선술집 또는 숲속 야영지',
    goal: '개인의 무예 입신양명 및 영주 후원자 획득 (가신 기사 발탁 또는 독자 거점 하사)',
    additional: '영지 없이 단신으로 여관이나 산길을 떠돌며 의뢰와 현상금을 쫓는 방랑 모험가 신분. [시작 소지품]: 여행용 가죽 외투, 손때 묻은 강철 단검, 부싯돌과 밧줄, 가죽 수통, 비상 육포, 동화 35개.',
    trait: '[전문특성] 방랑의 달인, [신체특성] 강철 체력, [감각특성] 매의 눈',
    statusPresets: [
      { id: 'peasant', icon: '🌾', name: '평민', shortDesc: '직할지나 촌락에서 토지를 경작하거나 날품을 파는 자유민', playerStatus: '평민', goal: '자유민 토지 매입 및 장원 부농 성장', additional: '자유민 신분의 농민. [소지품]: 거친 삼베옷, 괭이와 낫, 보리빵, 가죽 수통, 동화 25닢.' },
      { id: 'serf', icon: '🌱', name: '소작농', shortDesc: '장원에 예속되어 부역과 지대를 바치며 살아가는 예속 농민', playerStatus: '소작농', goal: '지대 청산 및 자유 신분 획득', additional: '장원 예속 소작농. [소지품]: 낡은 누더기 옷, 나무 삽, 호밀 덩이, 동화 12닢.' },
      { id: 'mercenary', icon: '🗡️', name: '용병', shortDesc: '무구와 검술로 생계를 유지하며 전선을 찾는 무장 전투원', playerStatus: '용병', goal: '군공을 세워 영주의 가신 기사로 발탁', additional: '보수를 위해 칼을 쥐는 용병. [소지품]: 강철 장검, 가죽 조끼, 숫돌, 비상 육포, 동화 40닢.' },
      { id: 'swordsman', icon: '⚔️', name: '방랑 검사', shortDesc: '특정 주군에 얽매이지 않고 검술 연마와 명성을 좇는 검객', playerStatus: '방랑 검사', goal: '비전 검술 완성 및 비무대회 우승', additional: '유랑 무인. [소지품]: 잘 벼린 강철검, 여행용 망토, 짚신, 붕대, 동화 35닢.' },
      { id: 'craftsman', icon: '⚒️', name: '장인', shortDesc: '대장일·석공 기술을 갖추고 제작 일거리를 찾아 유람하는 기술인', playerStatus: '장인', goal: '명품 걸작을 제작하여 독자 공방 개업', additional: '직인. [소지품]: 손망치 도구함, 가죽 앞치마, 작업 설계도, 은화 5닢.' },
      { id: 'apprentice', icon: '🪵', name: '도제', shortDesc: '공방 스승 밑에서 기초 기술을 배우며 수련 중인 공방 견습생', playerStatus: '도제', goal: '기초 기술 연마를 마치고 정식 직인 자격 취득', additional: '수습생. [소지품]: 작업용 앞치마, 기본 수공구, 도면 수첩, 은화 1닢.' },
      { id: 'scholar', icon: '📜', name: '학사', shortDesc: '라틴어와 고전 학식, 법률 지식을 갖추고 유람하는 학자', playerStatus: '학사', goal: '대륙 견문록 완성 및 궁정 서기관 등용', additional: '지식인. [소지품]: 양피지 수첩, 깃펜 잉크, 라틴어 사전, 은화 8닢.' },
      { id: 'troubadour', icon: '🪕', name: '음유시인', shortDesc: '영웅 서사시와 연가를 읊으며 여관을 순회하는 유랑 예인', playerStatus: '음유시인', goal: '전설적 영웅시 완성 및 궁정 계관 시인 발탁', additional: '방랑 예인. [소지품]: 휴대용 류트, 시집 양피지, 깃털 모자, 은화 6닢.' },
      { id: 'vagrant', icon: '🌲', name: '부랑자', shortDesc: '어디에도 적을 두지 않고 숲속을 떠돌며 생존하는 방랑자', playerStatus: '부랑자', goal: '방랑 청산 및 정착 거점 마련', additional: '생존 전문가. [소지품]: 짐승 가죽 외투, 사냥 덫 2개, 손도끼, 부싯돌, 동화 15닢.' }
    ]
  },
  {
    id: 'company',
    num: '2번',
    icon: '👥',
    title: '2. 소규모 집단',
    subtitle: '용병대장 · 상단주 · 길드마스터 · 촌장 · 장원 관리인 · 도적단 두목',
    badge: '집단 통솔 & 군자금',
    desc: '단원들과 숙영지를 이끌며 영주들의 고용 계약을 수주하고 부를 축적합니다.',
    status: '용병대장',
    location: '전선 인근 상설 숙영지 또는 무역 거점',
    goal: '명성을 떨치는 대용병단 구축 및 독립 거점(남작령 분봉) 획득',
    additional: '단원 20여 명을 이끄는 자유 용병대. [시작 소지품]: 지휘관 장검, 부대 군기, 단원 20명, 마차 2대, 군자금 금화 120닢.',
    trait: '[전문특성] 용병 계약 협상가, [정신특성] 강인한 의지, [전문특성] 전술적 안목',
    statusPresets: [
      { id: 'mercenary_captain', icon: '🛡️', name: '용병대장', shortDesc: '정예 전투원들을 통솔하며 제후들의 전선에 고용되는 사병대 수장', playerStatus: '용병대장', goal: '대용병단 육성 및 영주로부터 남작령 수여 획득', additional: '자유 용병대. [소지품]: 사슬 갑옷, 지휘관 장검, 단원 20명, 마차 2대, 금화 120닢.' },
      { id: 'caravan_master', icon: '🐫', name: '상단주', shortDesc: '짐마차와 호위대를 이끌고 대륙의 도시를 잇는 무역 상단 수장', playerStatus: '상단주', goal: '대륙 횡단 무역로 독점 및 참사회 의장 선출', additional: '무역 상단. [소지품]: 장부와 저울, 짐마차 4대, 호위병 12명, 금화 250닢.' },
      { id: 'guild_master', icon: '⚒️', name: '길드마스터', shortDesc: '도시 장인과 공방을 총괄하는 상공업 조합 대표', playerStatus: '길드마스터', goal: '도시 공방 독점권 획득 및 길드 자치권 공인', additional: '장인 조합. [소지품]: 조합 인장, 정밀 도구함, 숙련 장인 15명, 금화 150닢.' },
      { id: 'village_elder', icon: '🏡', name: '촌장', shortDesc: '장원 촌락 주민들을 대변하며 마을 자치와 방범을 이끄는 수장', playerStatus: '촌장', goal: '촌락 번영 및 영주 면세 특권 획득', additional: '마을 원로. [소지품]: 촌락 인장, 자경단 15명, 곡물 창고, 은화 80닢.' },
      { id: 'estate_steward', icon: '📜', name: '장원 관리인', shortDesc: '영주를 대리하여 장원 경작과 징세를 총괄하는 관리인', playerStatus: '장원 관리인', goal: '장원 생산성 극대화 및 독자 토지 분봉', additional: '장원 관리인. [소지품]: 장원 호구 장부, 집행봉, 일꾼 20명, 은화 60닢.' },
      { id: 'bandit_chieftain', icon: '🏹', name: '도적단 두목', shortDesc: '험준한 산채를 본거지로 삼아 무리를 거느린 무장 도당 우두머리', playerStatus: '도적단 두목', goal: '일대 장악 후 정식 사면 및 수비대장 임명', additional: '무장 도당. [소지품]: 합성궁, 비밀 산채 아지트, 단원 18명, 은화 90닢.' }
    ]
  },
  {
    id: 'clergy',
    num: '3번',
    icon: '⛪',
    title: '3. 성직자 및 수도자',
    subtitle: '평신도 · 수사 · 사제 · 수도원장 · 주교 · 대주교 · 교황',
    badge: '신앙 & 교단 발언권',
    desc: '독신 서약과 신앙심, 고문서 학식을 바탕으로 교구 민심을 이끌고 종교적 권위를 세웁니다.',
    status: '사제',
    location: '한적한 시골 수도원 또는 작은 교구 예배당',
    goal: '교구 성당 부흥 및 주교좌 성당 참사회원 임명',
    additional: '교구민들을 이끌고 예배와 성사를 집전하는 사제. [시작 소지품]: 사제복, 은 십자가, 라틴어 성경 사본, 은화 50닢.',
    trait: '[정신특성] 경건한 신앙, [전문특성] 고문서 필사 및 신학, [전문특성] 영적 치유',
    statusPresets: [
      { id: 'layman', icon: '📿', name: '평신도', shortDesc: '세속에 머물며 교회를 돕고 신앙을 실천하는 독실한 봉헌자', playerStatus: '평신도', goal: '모범적 신앙으로 성직 서품 추천 획득', additional: '봉헌자. [소지품]: 평민복, 목각 십자가, 묵주, 은화 25닢.' },
      { id: 'monk', icon: '📜', name: '수사', shortDesc: '수도원 서약에 따라 기도와 노동, 필사에 헌신하는 수도승', playerStatus: '수사', goal: '수도원 장상 신임 획득 및 사제 서품', additional: '수도사. [소지품]: 수도복, 성무일도서, 양피지, 은화 30닢.' },
      { id: 'priest', icon: '⛪', name: '사제', shortDesc: '교구 성당에서 미사를 집전하고 신자들의 고백을 듣는 주임 사제', playerStatus: '사제', goal: '교구 부흥 및 주교좌 성당 참사관 발탁', additional: '주임 사제. [소지품]: 사제 제의, 성작과 성합, 은화 50닢.' },
      { id: 'abbot', icon: '🏰', name: '수도원장', shortDesc: '광대한 장원과 수도자들을 관할하는 자치 수도원의 수장', playerStatus: '수도원장', goal: '수도원 면책 특권 획득 및 주교 서임', additional: '대수도원장. [소지품]: 목자 지팡이, 수도원 인장, 금화 100닢.' },
      { id: 'bishop', icon: '👑', name: '주교', shortDesc: '교구 전체의 성직자와 성당을 사목하는 고위 성직자', playerStatus: '주교', goal: '대주교 승품 및 교황청 추기경 임명', additional: '교구장 주교. [소지품]: 주교관, 주교 반지, 금화 150닢.' },
      { id: 'archbishop', icon: '✨', name: '대주교', shortDesc: '관구 전체를 총괄하며 국왕 대관식을 주재하는 최고위 성직자', playerStatus: '대주교', goal: '바티칸 콘클라베를 통한 교황 즉위', additional: '관구 대주교. [소지품]: 팔리움, 황금 목자 지팡이, 금화 250닢.' },
      { id: 'pope', icon: '🕊️', name: '교황', shortDesc: '그리스도의 대리자이자 전 기독교 세계의 최고 영도자', playerStatus: '교황', goal: '전 유럽 군주 통제 및 성지 십자군 주도', additional: '교황 성좌. [소지품]: 삼중관, 베드로의 어부 반지, 금화 500닢.' }
    ]
  },
  {
    id: 'noble',
    num: '4번',
    icon: '👑',
    title: '4. 봉건 영주 및 귀족',
    subtitle: '기사 · 남작 · 자작 · 백작 · 후작 · 공작 · 국왕 · 황제',
    badge: '영지 경영 & 대전쟁',
    desc: '직할 성채와 징집병을 거느리고 외교, 전쟁, 정략혼을 통해 가문의 번영을 도모합니다.',
    status: '남작',
    location: '가문의 본성 (영지 성채)',
    goal: '인근 분쟁 승리 및 남작령 요새 확장, 백작위 수봉',
    additional: '단일 성채를 영유하는 봉건 남작. [시작 소지품]: 가문 문장 방패, 판금 갑옷, 상비군 50명, 금화 150닢.',
    trait: '[전문특성] 기사도와 봉건 예법, [전문특성] 영지 행정, [정신특성] 가문의 긍지',
    statusPresets: [
      { id: 'knight', icon: '⚔️', name: '기사', shortDesc: '군마와 종자를 거느리고 주군에게 충성을 맹세한 서임 무사', playerStatus: '기사', goal: '전공을 세워 독자 봉토(남작령) 분봉 획득', additional: '기사. [소지품]: 군마, 판금 갑옷, 종자 2명, 금화 60닢.' },
      { id: 'baron', icon: '🏰', name: '남작', shortDesc: '단일 성채와 장원 백성들을 영유하는 기층 봉건 영주', playerStatus: '남작', goal: '인근 성채 합병 및 백작령 분봉 획득', additional: '남작령 영주. [소지품]: 남작 관, 성채 열쇠, 징집병 150명, 금화 150닢.' },
      { id: 'viscount', icon: '🛡️', name: '자작', shortDesc: '백작의 직속 대리인이자 주요 성채군을 영유하는 부영주', playerStatus: '자작', goal: '독자 주(County) 백작 승격', additional: '자작. [소지품]: 자작 관, 성채 2개소, 징집병 250명, 금화 200닢.' },
      { id: 'count', icon: '📜', name: '백작', shortDesc: '하나의 주 전체를 관할하며 여러 남작을 거느린 실력파 영주', playerStatus: '백작', goal: '대제후 공작령 수봉 획득', additional: '백작. [소지품]: 백작 관, 주 정부 문서함, 징집병 450명, 금화 300닢.' },
      { id: 'marquis', icon: '🚩', name: '후작', shortDesc: '국경 변경 지대의 막강한 군사권을 위임받은 군사령관', playerStatus: '후작', goal: '국경 확장 및 대공작위 추대', additional: '변경백. [소지품]: 변경 군기, 정예 상비군 600명, 금화 380닢.' },
      { id: 'duke', icon: '⚜️', name: '공작', shortDesc: '여러 백작 가문을 신종시킨 최고위 대제후', playerStatus: '공작', goal: '독자 왕국 건국 및 국왕 대관', additional: '공작. [소지품]: 공작 관, 대공국 옥새, 징집병 800명, 금화 480닢.' },
      { id: 'king', icon: '👑', name: '국왕', shortDesc: '주권을 쥐고 만백성을 호령하는 왕국의 최고 군주', playerStatus: '국왕', goal: '제국 선언 및 황제 대관', additional: '국왕. [소지품]: 황금 왕관, 왕실 보검, 왕국 옥새, 금화 650닢.' },
      { id: 'emperor', icon: '🦅', name: '황제', shortDesc: '신성 제국의 최고 주권자이자 모든 제후의 상위 군주', playerStatus: '황제', goal: '전 유럽 제국 판도 통일', additional: '황제. [소지품]: 제국 황제관, 보주와 홀, 금화 1000닢.' }
    ]
  }
];

// ==============================================================
// 2. 중동·이슬람 & 유목권 (Middle East) - 슬래시 없는 26종
// ==============================================================
const MIDDLE_EAST_ARCHETYPES: ArchetypeConfig[] = [
  {
    id: 'wanderer',
    num: '1번',
    icon: '🌙',
    title: '1. 개인 및 방랑 전사',
    subtitle: '베두인 · 초원 유목민 · 가지 · 피다이 · 데르비시 · 사막 안내인 · 맘루크 훈련병',
    badge: '사막 생존 & 성전',
    desc: '모래바람과 스텝 초원을 누비며 칼 한 자루와 신앙으로 명성을 쌓고 세력을 일으킵니다.',
    status: '베두인',
    location: '시나이 사막 오아시스 또는 호라산 스텝 야영지',
    goal: '무예와 용맹으로 이름을 떨쳐 맘루크 장교 또는 부족 베이로 발탁',
    additional: '사막의 모래바람을 뚫고 오아시스를 누비는 유목 전사. [소지품]: 샴시르 단도, 낙타 고삐, 가죽 물주머니, 양털 외투, 동화 디르함 40닢.',
    trait: '[전문특성] 사막 생존술, [신체특성] 지치지 않는 지구력, [감각특성] 별자리 감각',
    statusPresets: [
      { id: 'bedouin', icon: '🐫', name: '베두인', shortDesc: '사막 오아시스를 이동하며 낙타를 치는 자유 유목민', playerStatus: '베두인', goal: '사막 부락 결속 및 부족 셰이크 승격', additional: '사막 유목민. [소지품]: 샴시르 단도, 낙타 고삐, 물주머니, 디르함 30닢.' },
      { id: 'steppe_nomad', icon: '🐎', name: '초원 유목민', shortDesc: '유라시아 스텝에서 말과 활을 다루며 가축을 이끄는 기마민', playerStatus: '초원 유목민', goal: '기마 전사 규합 및 투르크 베이 등극', additional: '초원 기마민. [소지품]: 단궁, 화살 30발, 말안장, 디르함 25닢.' },
      { id: 'ghazi', icon: '⚔️', name: '가지', shortDesc: '국경 지대에서 이슬람 신앙과 명예를 위해 싸우는 성전 전사', playerStatus: '가지', goal: '전공을 세워 술탄 친위 맘루크 기병 발탁', additional: '성전 무사. [소지품]: 잘 벼린 시미터, 원형 가죽 방패, 코란 부적, 디르함 45닢.' },
      { id: 'fidai', icon: '🗡️', name: '피다이', shortDesc: '알람우트 암살단의 규율을 받들고 잠입 암살을 수행하는 결사대', playerStatus: '피다이', goal: '표적 제거 완수 및 산상노인 신임 획득', additional: '암살단 요원. [소지품]: 독 바른 비수 2자루, 위장용 흑포, 연막 주머니, 디르함 50닢.' },
      { id: 'dervish', icon: '📿', name: '데르비시', shortDesc: '세속을 버리고 회전 춤과 명상으로 신을 찾는 수피 탁발승', playerStatus: '데르비시', goal: '공동체 신망 획득 및 모스크 이맘 추대', additional: '수피 수도승. [소지품]: 나무 지팡이, 삼베옷, 염주, 수피 시집, 디르함 10닢.' },
      { id: 'desert_guide', icon: '🧭', name: '사막 안내인', shortDesc: '별자리와 모래바람을 읽으며 대상단을 인도하는 길잡이', playerStatus: '사막 안내인', goal: '실크로드 공인 길잡이 및 상단 합류', additional: '사막 길잡이. [소지품]: 청동 나침반, 별자리 관측판, 물통 2개, 디르함 35닢.' },
      { id: 'mamluk_recruit', icon: '🛡️', name: '맘루크 훈련병', shortDesc: '혹독한 기마술과 궁술을 배우며 임관을 기다리는 견습 무사', playerStatus: '맘루크 훈련병', goal: '술탄 친위 맘루크 정규 기병 임관', additional: '맘루크 훈련병. [소지품]: 훈련용 목검, 가죽 마구, 연습용 궁, 디르함 20닢.' }
    ]
  },
  {
    id: 'company',
    num: '2번',
    icon: '🐫',
    title: '2. 상단 및 카라반',
    subtitle: '수크 행상 · 바자르 점포주 · 카라반 대상인 · 궁정 의원 · 디완 서기관',
    badge: '실크로드 무역 & 재정',
    desc: '바그다드와 카이로의 거대한 바자르를 무대로 향신료와 비단을 유통하며 막대한 부를 쌓습니다.',
    status: '카라반 대상인',
    location: '알렉산드리아 항구 또는 바그다드 수크 시장',
    goal: '실크로드 무역로 독점 및 제국 재상(와지르) 입각',
    additional: '수십 마리 낙타와 무장 호위대를 거느린 대상단주. [소지품]: 대상단 깃발, 낙타 20마리, 무장 호위병 10명, 비단과 향신료 마차, 금화 디나르 150닢.',
    trait: '[전문특성] 대상 협상술, [전문특성] 회계와 아라비아 숫자, [감각특성] 시장 흐름 포착',
    statusPresets: [
      { id: 'suq_peddler', icon: '🧺', name: '수크 행상', shortDesc: '바자르 골목에서 대추야자와 향료를 파는 소상인', playerStatus: '수크 행상', goal: '바자르 정식 점포 개업', additional: '시장 행상. [소지품]: 등짐 바구니, 대추야자 2포대, 저울, 디르함 50닢.' },
      { id: 'bazaar_merchant', icon: '🏪', name: '바자르 점포주', shortDesc: '카이로 중심가에 정식 점포를 차리고 비단을 파는 상인', playerStatus: '바자르 점포주', goal: '대상단 조직 및 카라반 출범', additional: '점포주. [소지품]: 상점 계약서, 비단 10필, 금화 디나르 80닢.' },
      { id: 'caravan_master', icon: '🐫', name: '카라반 대상인', shortDesc: '낙타 행렬과 호위대를 이끌고 대륙을 넘나드는 거상', playerStatus: '카라반 대상인', goal: '실크로드 무역망 장악 및 재정 고문 등용', additional: '카라반 수장. [소지품]: 낙타 20마리, 호위병 10명, 향신료 화물, 디나르 180닢.' },
      { id: 'tabib', icon: '🌿', name: '궁정 의원', shortDesc: '이븐 시나의 의학 정전을 수학하고 약초를 다루는 전문 의관', playerStatus: '궁정 의원', goal: '술탄 전속 시의(侍醫) 및 어전 자문관 임명', additional: '의관. [소지품]: 약초 상자, 청동 수술도구, 아랍어 의학서, 디나르 60닢.' },
      { id: 'diwan_katib', icon: '📜', name: '디완 서기관', shortDesc: '제국의 토지 대장(이크타)과 국고 조세를 기록하는 궁정 관료', playerStatus: '디완 서기관', goal: '제국 최고 재상 와지르 영전', additional: '재무 관료. [소지품]: 갈대 잉크펜, 조세 양피지 장부, 공인 인장, 디나르 90닢.' }
    ]
  },
  {
    id: 'clergy',
    num: '3번',
    icon: '🕌',
    title: '3. 이슬람 성직 & 울라마',
    subtitle: '무아진 · 탈리브 · 이맘 · 카디 · 무프티',
    badge: '샤리아 율법 & 권위',
    desc: '쿠란과 하디스에 기반한 샤리아 율법으로 공동체를 인도하고 종교적 정의를 실현합니다.',
    status: '이맘',
    location: '알아즈하르 모스크 또는 다마스쿠스 대모스크',
    goal: '율법 재판관 카디 서임 및 최고 법학자 무프티 착좌',
    additional: '모스크에서 예배를 이끄는 성직자. [소지품]: 코란 주석서, 순백 터번, 설교용 지팡이, 기도 융단, 디나르 40닢.',
    trait: '[정신특성] 엄격한 경건함, [전문특성] 샤리아 법학, [전문특성] 아랍어 웅변',
    statusPresets: [
      { id: 'muezzin', icon: '📢', name: '무아진', shortDesc: '미나렛 첨탑에서 매일 다섯 번 기도를 알리는 신앙인', playerStatus: '무아진', goal: '마드라사 신학교 입학 및 수학', additional: '기도 선포자. [소지품]: 메카 나침반, 기도 융단, 성스러운 종, 디르함 40닢.' },
      { id: 'talib', icon: '📖', name: '탈리브', shortDesc: '마드라사에서 경전 주석과 율법을 수학하는 신학생', playerStatus: '탈리브', goal: '신학 수료 및 모스크 주임 이맘 부임', additional: '신학생. [소지품]: 쿠란 필사본, 벼루와 깃펜, 학생 인장, 디르함 50닢.' },
      { id: 'imam', icon: '🕌', name: '이맘', shortDesc: '모스크에서 신자들의 예배를 인도하고 분쟁을 중재하는 성직자', playerStatus: '이맘', goal: '샤리아 법관 카디 발탁', additional: '주임 이맘. [소지품]: 코란 주석서, 순백 터번, 목각 지팡이, 디나르 40닢.' },
      { id: 'qadi', icon: '⚖️', name: '카디', shortDesc: '샤리아 율법에 근거해 세속과 종교 분쟁을 재판하는 법관', playerStatus: '카디', goal: '제국 최고 율법학자 무프티 승품', additional: '종교 법관. [소지품]: 샤리아 법전, 재판 봉인 인장, 판결문 양피지, 디나르 120닢.' },
      { id: 'mufti', icon: '📜', name: '무프티', shortDesc: '국가적 중대사에 종교적 칙령(파트와)을 내리는 최고 법학자', playerStatus: '무프티', goal: '칼리파 옹립 및 제국 종교 정책 총괄', additional: '최고 법학자. [소지품]: 최고 인가장, 금실 법복, 법학 총서, 디나르 250닢.' }
    ]
  },
  {
    id: 'noble',
    num: '4번',
    icon: '👑',
    title: '4. 통치자 & 군사 귀족',
    subtitle: '맘루크 기병 · 셰이크 · 베이 · 아미르 · 아타베그 · 와지르 · 술탄 · 대칸 · 칼리파',
    badge: '술탄국 영토 & 대정복',
    desc: '이크타 봉토와 정예 기병대를 거느리고 술탄국을 건설하며 칼리파의 권위를 호위합니다.',
    status: '아미르',
    location: '알레포 성채 또는 이스파한 궁전',
    goal: '인접 영지 정복 및 독립 술탄국 선포',
    additional: '한 도시와 군대를 다스리는 군사 총독 아미르. [소지품]: 술탄 하사 군도, 총독 옥새, 친위 기병 200명, 금화 디나르 200닢.',
    trait: '[전문특성] 기마 전술과 궁술, [전문특성] 이크타 영지 징세, [정신특성] 군주의 카리스마',
    statusPresets: [
      { id: 'mamluk_knight', icon: '🐎', name: '맘루크 기병', shortDesc: '술탄의 직속 상비군 친위대로 복무하는 정예 기마무사', playerStatus: '맘루크 기병', goal: '군공을 세워 부족 사령관 베이 승격', additional: '맘루크 기병. [소지품]: 복합궁, 강철 사슬 갑옷, 군마, 디나르 60닢.' },
      { id: 'sheikh', icon: '🏜️', name: '셰이크', shortDesc: '혈통과 덕망으로 오아시스 취락과 부족을 통솔하는 부족장', playerStatus: '셰이크', goal: '부족 통합 및 도시 아미르 영전', additional: '부족장. [소지품]: 부족 상징 지팡이, 은장 단검, 부족 기병 80명, 디나르 100닢.' },
      { id: 'bey', icon: '🚩', name: '베이', shortDesc: '국경 변경 지대에서 부족 군대를 이끄는 투르크 군사 영주', playerStatus: '베이', goal: '주 총독 아미르 승격', additional: '베이 영주. [소지품]: 변경 군기, 투르크 군도, 기병 150명, 디나르 140닢.' },
      { id: 'amir', icon: '🏰', name: '아미르', shortDesc: '한 도시와 주의 군권과 징세를 장악한 군사 총독이자 영주', playerStatus: '아미르', goal: '독립 술탄국 건국 및 술탄 즉위', additional: '아미르 총독. [소지품]: 총독 옥새, 술탄 하사 검, 병력 300명, 디나르 200닢.' },
      { id: 'atabeg', icon: '🛡️', name: '아타베그', shortDesc: '왕자의 섭정이자 대아미르로서 국정을 좌우하는 원로 군벌', playerStatus: '아타베그', goal: '실권 장악 및 새로운 왕조 수립', additional: '섭정 대공. [소지품]: 섭정 인장, 황금 검대, 병력 500명, 디나르 320닢.' },
      { id: 'vizier', icon: '🖋️', name: '와지르', shortDesc: '제국 전역의 행정 백관을 지휘하고 국정을 보좌하는 수석 재상', playerStatus: '와지르', goal: '술탄 보좌 및 제국 내정 평정', additional: '최고 재상. [소지품]: 제국 대인장, 황금 필기구 함, 칙령집, 디나르 350닢.' },
      { id: 'sultan', icon: '👑', name: '술탄', shortDesc: '세속 제국과 이크타 봉토를 호령하는 최고 군사 통치자', playerStatus: '술탄', goal: '전 중동 제국 판도 통일 및 칼리파 옹립', additional: '술탄 주권자. [소지품]: 제국의 보검, 보석 터번, 병력 1000명, 디나르 600닢.' },
      { id: 'khagan', icon: '🐺', name: '대칸', shortDesc: '스텝의 모든 유목 부족을 굴복시키고 초원을 지배하는 유목 황제', playerStatus: '대칸', goal: '유라시아 전역 대정복', additional: '초원의 대칸. [소지품]: 황금 활, 늑대 깃발, 기마 군단 1200명, 디나르 700닢.' },
      { id: 'caliph', icon: '✨', name: '칼리파', shortDesc: '예언자의 정통 후계자이자 이슬람 움마의 최고 영도자', playerStatus: '칼리파', goal: '성전 완수 및 세계 제국 완성', additional: '칼리파 성좌. [소지품]: 예언자의 망토, 성스러운 깃발, 디나르 1000닢.' }
    ]
  }
];

// ==============================================================
// 3. 동양·동아시아 & 인도권 (East Asia) - 슬래시 없는 28종
// ==============================================================
const EAST_ASIA_ARCHETYPES: ArchetypeConfig[] = [
  {
    id: 'wanderer',
    num: '1번',
    icon: '🐉',
    title: '1. 개인 및 강호 유랑자',
    subtitle: '화랑 · 낭인 · 협객 · 도사 · 방사 · 유생 · 서당 훈장',
    badge: '강호 무예 & 풍류',
    desc: '검 한 자루와 도포 자락을 걸치고 천하를 주유하며 의기를 떨치고 과거 급제를 노립니다.',
    status: '화랑',
    location: '금강산 암자 또는 개경 저잣거리 객잔',
    goal: '무과 급제 및 관직 진출, 또는 강호의 맹주 등극',
    additional: '도의를 닦으며 명산대천을 유람하는 청년 무인. [소지품]: 환도, 삿갓과 도포, 짚신, 주역 필사본, 엽전 꾸러미 40냥.',
    trait: '[전문특성] 기예와 풍류, [전문특성] 검술의 극의, [정신특성] 꺾이지 않는 의기',
    statusPresets: [
      { id: 'hwarang', icon: '🌸', name: '화랑', shortDesc: '도의와 풍류를 닦으며 명산대천을 유람하는 청년 무인', playerStatus: '화랑', goal: '무예 입신 및 조정 군관 제수', additional: '화랑. [소지품]: 환도, 낭도 깃발, 풍류 시집, 엽전 35냥.' },
      { id: 'ronin', icon: '⚔️', name: '낭인', shortDesc: '가문을 잃고 검 한 자루에 의지해 천하를 떠도는 방랑 검객', playerStatus: '낭인', goal: '강호의 의협 인정 및 번정 무사 임관', additional: '방랑 무사. [소지품]: 카타나, 삿갓과 도포, 숫돌, 엽전 30냥.' },
      { id: 'youxia', icon: '🗡️', name: '협객', shortDesc: '법보다 의리를 중시하며 불의를 응징하는 강호의 무인', playerStatus: '협객', goal: '강호 맹주 등극 및 산성 성주 자립', additional: '강호 의객. [소지품]: 보검, 비도 3자루, 무협 통행패, 엽전 45냥.' },
      { id: 'taoist', icon: '☯️', name: '도사', shortDesc: '주역과 연단술을 수련하며 음양오행의 도를 닦는 도가 수도자', playerStatus: '도사', goal: '득도 및 조정 천문 복서관 제수', additional: '도가 수도자. [소지품]: 목검, 황색 부적 5장, 주역 팔괘경, 엽전 25냥.' },
      { id: 'fangshi', icon: '🔮', name: '방사', shortDesc: '제후들에게 불로장생의 비방과 점술을 올리는 방술 전문가', playerStatus: '방사', goal: '왕실 어전 최고 법사 책봉', additional: '방술사. [소지품]: 청동 거울, 점괘 죽간, 약초 병, 엽전 35냥.' },
      { id: 'scholar_confucian', icon: '📜', name: '유생', shortDesc: '사서삼경을 연마하며 과거 급제를 준비하는 선비', playerStatus: '유생', goal: '과거 대과 급제 및 고을 현령 부임', additional: '과거 유생. [소지품]: 논어 책자, 벼루와 먹, 갓과 도포, 엽전 30냥.' },
      { id: 'village_tutor', icon: '📖', name: '서당 훈장', shortDesc: '향촌 서당에서 학동들에게 글과 예법을 가르치는 촌부 훈장', playerStatus: '서당 훈장', goal: '유림 천거 및 은일 관직 등용', additional: '서당 훈장. [소지품]: 회초리, 천자문 목판본, 돋보기, 엽전 25냥.' }
    ]
  },
  {
    id: 'company',
    num: '2번',
    icon: '🛶',
    title: '2. 상단 및 객주',
    subtitle: '보부상 · 선상 · 객주 · 대방 · 도편수',
    badge: '조운 무역 & 대상단',
    desc: '포구와 장시를 잇는 물류망을 개척하고 어음 금융을 운영하여 거상의 반열에 오릅니다.',
    status: '객주',
    location: '벽란도 포구 또는 한양 육의전 상점',
    goal: '전국 상권 장악 및 관수 물자 독점 대방 등극',
    additional: '포구에서 물류 보관, 숙박, 어음 금융을 관장하는 유통 거점주. [소지품]: 어음 장부, 놋쇠 저울, 창고 열쇠패, 은괴 2냥, 엽전 150냥.',
    trait: '[전문특성] 어음 환거래, [전문특성] 포구 물류 파악, [정신특성] 치밀한 수완',
    statusPresets: [
      { id: 'peddler', icon: '🧺', name: '보부상', shortDesc: '봇짐을 지고 전국 5일장을 순회하며 물품을 파는 장돌뱅이', playerStatus: '보부상', goal: '조운선 마련 및 선상 도약', additional: '장돌뱅이. [소지품]: 지게와 봇짐, 물품 목록 목판, 완문, 엽전 40냥.' },
      { id: 'ship_merchant', icon: '⛵', name: '선상', shortDesc: '조운선과 상선을 이끌고 포구와 바다를 오가는 곡물 선주', playerStatus: '선상', goal: '포구 객주 개업 특허 획득', additional: '선주. [소지품]: 선적 장부, 닻줄, 나침반, 은괴 1냥, 엽전 80냥.' },
      { id: 'gaekju', icon: '🏪', name: '객주', shortDesc: '포구에서 화물 보관, 숙박, 어음 금융을 관장하는 거점주', playerStatus: '객주', goal: '전국 상단 대방 추대', additional: '객주 거점주. [소지품]: 어음 장부, 놋쇠 저울, 창고 열쇠패, 은괴 2냥.' },
      { id: 'grand_merchant', icon: '💰', name: '대방', shortDesc: '국경 무역과 관수 물자를 독점 공급하는 거대 상단의 총수', playerStatus: '대방', goal: '사재 헌납 및 산성 성주 등극', additional: '거상 대방. [소지품]: 상단 깃발, 관청 허가 공문, 황금패, 은괴 10냥.' },
      { id: 'master_carpenter', icon: '⚒️', name: '도편수', shortDesc: '사찰과 성곽 건축을 총괄하는 당대 최고의 대목장', playerStatus: '도편수', goal: '관급 공사 총괄 상단 설립', additional: '대목장. [소지품]: 먹줄통, 정밀 자, 설계 도면, 손도끼, 은괴 1냥.' }
    ]
  },
  {
    id: 'clergy',
    num: '3번',
    icon: '📿',
    title: '3. 사찰 & 승단',
    subtitle: '행자 · 선승 · 주지 · 바라문 · 국사',
    badge: '불법 수호 & 왕실 자문',
    desc: '선문 구산의 가르침을 이어받아 불법을 닦고, 왕실과 백성의 안녕을 비는 법회를 주재합니다.',
    status: '주지',
    location: '지리산 화엄사 또는 팔공산 동화사',
    goal: '선문 총림 부흥 및 왕실 국사 책봉',
    additional: '대본산 사찰의 살림과 수행을 총괄하는 주지 스님. [소지품]: 주장자 지팡이, 사찰 인장, 불경 목판본, 염주, 사찰 곡식 장부.',
    trait: '[정신특성] 맑은 선심, [전문특성] 불경 강론, [전문특성] 대중 포교',
    statusPresets: [
      { id: 'novice_monk', icon: '🪵', name: '행자', shortDesc: '사찰에 입문하여 땔나무와 공양을 지으며 계율을 배우는 견습 승려', playerStatus: '행자', goal: '구족계 수계 및 정식 선승 득도', additional: '견습 승려. [소지품]: 나무 발우, 염주, 무명 승복, 엽전 10냥.' },
      { id: 'zen_monk', icon: '🧘', name: '선승', shortDesc: '화두를 들고 용맹정진하여 깨달음을 추구하는 좌선 수도승', playerStatus: '선승', goal: '대본산 사찰 주지 추대', additional: '좌선 수도승. [소지품]: 좌복, 죽비, 가사와 장삼, 엽전 20냥.' },
      { id: 'abbot_monk', icon: '📿', name: '주지', shortDesc: '사찰의 재산과 사원전을 관리하고 대중을 통솔하는 주지 스님', playerStatus: '주지', goal: '왕실 국사 책봉 법회 주재', additional: '주지 스님. [소지품]: 주장자 지팡이, 사찰 인장, 불경 목판, 은괴 1냥.' },
      { id: 'brahmin', icon: '✨', name: '바라문', shortDesc: '인도 아대륙에서 베다 제례를 주관하고 신성한 법을 수호하는 사제', playerStatus: '바라문', goal: '성스러운 라자 수봉 및 국정 자문', additional: '베다 제관. [소지품]: 베다 경전, 제례 향로, 성스러운 끈, 금화 30닢.' },
      { id: 'state_preceptor', icon: '👑', name: '국사', shortDesc: '군주의 스승이자 국가 불교 의례를 주재하는 최고 법사', playerStatus: '국사', goal: '국태민안 및 제국 불교 총괄', additional: '왕실 국사. [소지품]: 금란가사, 옥 불자, 어전 출입패, 은괴 10냥.' }
    ]
  },
  {
    id: 'noble',
    num: '4번',
    icon: '👑',
    title: '4. 관료 & 군주',
    subtitle: '향리 · 군관 · 현령 · 군수 · 성주 · 다이묘 · 절도사 · 관찰사 · 영의정 · 라자 · 국왕 · 천자',
    badge: '목민관 & 천명 수임',
    desc: '과거 급제와 군권 장악, 제후국 통치를 거쳐 천하 만국을 호령하는 천자의 자리에 오릅니다.',
    status: '현령',
    location: '지방 관아 동헌 또는 번진 감영',
    goal: '고을 치적 달성, 관찰사/절도사 영전 및 국왕 등극',
    additional: '과거에 급제하여 고을을 다스리는 수령. [소지품]: 수령 관복, 목관 직인, 관할 지도, 포졸 30명, 관아 공금 은괴 5냥.',
    trait: '[전문특성] 목민과 징세, [전문특성] 과거 문장력, [정신특성] 선비의 지조',
    statusPresets: [
      { id: 'local_clerk', icon: '📜', name: '향리', shortDesc: '수령 밑에서 실무 행정과 조세 징수를 도맡는 토착 아전', playerStatus: '향리', goal: '수령 천거 및 정식 현령 등용', additional: '관아 아전. [소지품]: 호적 대장, 붓통, 엽전 꾸러미 50냥.' },
      { id: 'military_officer', icon: '⚔️', name: '군관', shortDesc: '성곽 수비와 군졸들을 직접 지휘하는 무과 출신 무관', playerStatus: '군관', goal: '요충지 군수 또는 산성 성주 등극', additional: '무관. [소지품]: 환도, 각궁과 화살, 군령패, 엽전 60냥.' },
      { id: 'magistrate', icon: '🏛️', name: '현령', shortDesc: '과거 문과에 급제하여 조정의 명을 받고 고을을 다스리는 수령', playerStatus: '현령', goal: '군수 영전 및 관찰사 발탁', additional: '수령. [소지품]: 수령 관복, 목관 직인, 관할 지도, 은괴 5냥.' },
      { id: 'prefect', icon: '🏢', name: '군수', shortDesc: '요충지 군(郡)을 관할하며 행정과 사법을 총괄하는 중견 지방관', playerStatus: '군수', goal: '도 관찰사 및 병마절도사 영전', additional: '지방관. [소지품]: 사모관대, 관인, 군정 장부, 은괴 8냥.' },
      { id: 'castellan_east', icon: '🏯', name: '성주', shortDesc: '견고한 산성과 사병을 거느리고 독자적 영역을 방어하는 무장', playerStatus: '성주', goal: '일국 다이묘 선언 및 패권 장악', additional: '산성 성주. [소지품]: 옻칠 갑주, 가문 깃발, 사병 150명, 은괴 10냥.' },
      { id: 'daimyo', icon: '⚔️', name: '다이묘', shortDesc: '가신단과 수백 기의 무사를 거느리고 일국을 다스리는 봉건 영주', playerStatus: '다이묘', goal: '천하 번진 장악 및 국왕 즉위', additional: '봉건 영주. [소지품]: 문장 군기, 대도, 무사단 300명, 은괴 20냥.' },
      { id: 'jiedushi', icon: '🚩', name: '절도사', shortDesc: '번진의 군권과 민정을 독점 장악하여 조정과 대립하는 막강한 군벌', playerStatus: '절도사', goal: '조정 입각 및 영의정 / 국왕 등극', additional: '군벌 절도사. [소지품]: 절도사 병부, 제식 보검, 군사 600명, 은괴 30냥.' },
      { id: 'governor', icon: '📜', name: '관찰사', shortDesc: '한 도 전체의 수령들을 감찰하고 행정을 총괄하는 최고 감사관', playerStatus: '관찰사', goal: '조정 수석 정승 영의정 제수', additional: '최고 감사관. [소지품]: 어사패, 순력 장부, 관인, 은괴 25냥.' },
      { id: 'chief_minister', icon: '👑', name: '영의정', shortDesc: '백관의 영수로서 조정을 총괄하고 국정을 이끄는 수석 정승', playerStatus: '영의정', goal: '새로운 왕조 국왕 옹립 및 선양', additional: '수석 정승. [소지품]: 일품관 관복, 옥대, 어전 결재함, 은괴 50냥.' },
      { id: 'raja', icon: '🐘', name: '라자', shortDesc: '인도 아대륙의 왕국을 다스리며 전사들을 통솔하는 국왕', playerStatus: '라자', goal: '전 인도 통일 및 천자 즉위', additional: '인도 국왕. [소지품]: 왕실 보검, 터번 보석관, 코끼리 부대, 금화 400닢.' },
      { id: 'king_east', icon: '👑', name: '국왕', shortDesc: '종묘사직을 받들고 만백성을 통치하는 제후국의 군주', playerStatus: '국왕', goal: '천명 수임 제천의례 및 천자 대관', additional: '제후국 국왕. [소지품]: 곤룡포, 익선관, 사인참사검, 국왕 어보, 금괴 10개.' },
      { id: 'son_of_heaven', icon: '🐉', name: '천자', shortDesc: '하늘의 천명을 받아 천하 만국을 통어하는 동양의 최고 황제', playerStatus: '천자', goal: '태평성대 및 천하 통일 완성', additional: '황제 천자. [소지품]: 황금 용포, 면류관, 전국옥새, 천명 칙서, 금괴 50개.' }
    ]
  }
];

export const REGIONAL_ARCHETYPES: Record<CultureRegion, ArchetypeConfig[]> = {
  europe: EUROPE_ARCHETYPES,
  middle_east: MIDDLE_EAST_ARCHETYPES,
  east_asia: EAST_ASIA_ARCHETYPES
};
