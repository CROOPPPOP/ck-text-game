"use client";

import { useState, useEffect } from 'react';
import styles from './page.module.css';

export default function Startup() {
  const [currentStep, setCurrentStep] = useState(1);
  const innateStatsList = ['근력', '체력', '지구력', '민첩성', '반사 신경', '속도', '신체 조정력', '지각력', '지능', '기억력', '학습 능력', '의지력', '집중력'];
  const acquiredStatsList = ['통솔력', '매력', '외교력', '설득력', '기만술', '위협', '행정력', '전략', '전술', '전투력', '무기 숙련도', '기마술', '생존술', '의술', '학문', '기술 숙련도', '장인 기술', '은밀 행동', '수사력'];
  const [customStatsMode, setCustomStatsMode] = useState(false);
  const [statsData, setStatsData] = useState<Record<string, number | string>>(() => {
    const initial: Record<string, number | string> = {};
    innateStatsList.forEach(stat => initial[stat] = 50);
    acquiredStatsList.forEach(stat => initial[stat] = 0);
    return initial;
  });

  const totalInnatePoints = 650;
  const totalAcquiredPoints = 200;
  const usedInnatePoints = innateStatsList.reduce((acc, stat) => acc + (typeof statsData[stat] === 'number' ? statsData[stat] as number : 0), 0);
  const usedAcquiredPoints = acquiredStatsList.reduce((acc, stat) => acc + (typeof statsData[stat] === 'number' ? statsData[stat] as number : 0), 0);
  const remainingInnatePoints = totalInnatePoints - usedInnatePoints;
  const remainingAcquiredPoints = totalAcquiredPoints - usedAcquiredPoints;

  const traitCategories = {
    '신체특성': ['강철 체력', '흉터 투성이', '질병 취약', '매력적인 외모', '거구'],
    '정신특성': ['강인한 의지', '광기', '트라우마', '냉혹함', '광신도'],
    '감각특성': ['매의 눈', '예민한 청각', '둔감함', '밤눈 밝음'],
    '전문특성': ['검술의 달인', '뛰어난 항해술', '웅변가', '암살자', '명사수'],
    '잠재특성': ['각성 대기', '숨겨진 혈통', '저주받은 운명'],
    '일시적특성': ['전투 고양', '심한 부상', '독에 중독됨']
  };
  const [customTraitsMode, setCustomTraitsMode] = useState(false);
  const [selectedTraits, setSelectedTraits] = useState<Record<string, string[]>>({});
  const [customTraitInputs, setCustomTraitInputs] = useState<Record<string, string>>({});

  const [worldviewType, setWorldviewType] = useState('역사적');
  const [selectedArchetype, setSelectedArchetype] = useState('noble');

  interface StatusPreset {
    id: string;
    icon: string;
    name: string;
    shortDesc: string;
    playerStatus: string;
    goal?: string;
    additional?: string;
  }

  interface ArchetypeConfig {
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

  const ARCHETYPES: ArchetypeConfig[] = [
    {
      id: 'wanderer',
      num: '1번',
      icon: '🗡️',
      title: '1. 개인 / 방랑자',
      subtitle: '낭인 · 검객 · 모험가 · 유랑 학자',
      badge: '1번: 1인칭 생존 & 무예',
      desc: '영지 없이 단신으로 여관과 산길을 떠돌며 무예와 지혜로 의뢰를 해결하고 명성을 쌓습니다.',
      status: '방랑자 (낭인 / 용병 검객)',
      location: '국경 지대 선술집 또는 숲속 야영지',
      goal: '개인의 무예 입신양명 및 영주 후원자 획득 (가신 기사 발탁 또는 독자 거점 하사)',
      additional: '영지 없이 단신으로 여관이나 산길을 떠돌며 의뢰와 현상금을 쫓는 방랑 모험가 신분. [시작 소지품]: 여행용 가죽 외투, 손때 묻은 강철 단검, 부싯돌과 밧줄, 가죽 수통, 비상 육포, 동화 35개, 휴대용 낚시 바늘.',
      trait: '[전문특성] 방랑의 달인 (확립된 특성) : 거친 야외와 여관 생활에 익숙하여 위험을 빠르게 감지합니다., [신체특성] 강철 체력 (강한 특성) : 노숙과 풍찬노숙에도 잔병치레 없이 버텨냅니다., [감각특성] 매의 눈 (잠재 특성) : 주변의 살기와 수상한 낌새를 예리하게 포착합니다.',
      statusPresets: [
        {
          id: 'peasant',
          icon: '🌾',
          name: '평민 / 소작농',
          shortDesc: '장원 토지를 부치거나 날품을 팔며 생계를 잇는 보편적 평민 계층',
          playerStatus: '평민 (자유농 / 소작농)',
          goal: '자유민 토지 매입 및 장원 부농 성장, 자치 촌락 장로/원로 피선',
          additional: '영주의 장원에서 농사를 짓고 세금을 바치는 평민. [소지품]: 낡은 삼베옷, 괭이와 낫, 거친 보리빵, 가죽 수통, 동화 25닢.'
        },
        {
          id: 'mercenary_soldier',
          icon: '🗡️',
          name: '방랑 무인 / 용병',
          shortDesc: '무구와 전투 기술로 생계를 유지하며 여관과 전장을 떠도는 무장 자유민',
          playerStatus: '방랑 무인 (용병 검사 / 보병)',
          goal: '무공을 세워 유력 영주의 가신 기사 또는 상비군 부대장으로 발탁',
          additional: '주군 없이 무예 의뢰와 경호로 살아가는 무인. [소지품]: 손때 묻은 강철 장검, 무명 가죽 조끼, 숫돌, 비상 육포, 동화 40닢.'
        },
        {
          id: 'craftsman',
          icon: '⚒️',
          name: '도제 / 장인',
          shortDesc: '공방에서 대장일이나 목공 기술을 익히며 일거리를 찾아 유람하는 기술인',
          playerStatus: '장인 (공방 직인 / 도제)',
          goal: '명품 걸작을 제작하여 마스터 시험 통과 및 독자 공방 개업',
          additional: '숙련된 손재주를 지닌 직인. [소지품]: 손망치와 정밀 조각칼 도구함, 가죽 앞치마, 작업 설계도, 은화 5닢.'
        },
        {
          id: 'scholar_troubadour',
          icon: '📜',
          name: '학사 / 음유시인',
          shortDesc: '라틴어 학식이나 시가를 지니고 여관과 영주의 성관을 유람하는 지식인',
          playerStatus: '학사 (유랑 학식가 / 음유시인)',
          goal: '대륙 견문록 완성 및 궁정 서기관, 영주 참모 조언가 등용',
          additional: '역사와 문학을 읊으며 여행하는 지식인. [소지품]: 양피지 수첩과 깃펜 잉크, 휴대용 악기(류트), 고문서 단편, 은화 8닢.'
        },
        {
          id: 'vagrant',
          icon: '🌲',
          name: '부랑자 / 무숙자',
          shortDesc: '어디에도 적을 두지 않고 국경과 숲속을 떠돌며 야외 생존에 정통한 방랑자',
          playerStatus: '방랑자 (무숙 유랑민)',
          goal: '거친 방랑 생활 청산 및 정착 거점(농장 또는 사냥터) 마련',
          additional: '야생과 길 위에서 단련된 생존 전문가. [소지품]: 짐승 가죽 외투, 사냥 덫 2개, 손도끼, 부싯돌, 동화 15닢.'
        }
      ],
      innateStats: {
        '민첩성': 65, '반사 신경': 65, '속도': 60, '신체 조정력': 55, '지각력': 65,
        '의지력': 60, '지구력': 60, '체력': 55, '근력': 55, '지능': 45,
        '기억력': 45, '학습 능력': 40, '집중력': 40
      },
      acquiredStats: {
        '생존술': 40, '무기 숙련도': 35, '전투력': 30, '은밀 행동': 30, '수사력': 20,
        '의술': 15, '기마술': 15, '설득력': 15, '통솔력': 0, '매력': 0, '외교력': 0,
        '기만술': 0, '위협': 0, '행정력': 0, '전략': 0, '전술': 0, '학문': 0, '기술 숙련도': 0, '장인 기술': 0
      },
      startingTraitsMap: {
        '신체특성': ['강철 체력'],
        '감각특성': ['매의 눈'],
        '전문특성': ['검술의 달인']
      }
    },
    {
      id: 'company',
      num: '2번',
      icon: '👥',
      title: '2. 소규모 집단',
      subtitle: '용병대장 · 상단주 · 길드 마스터 · 장원 관리인',
      badge: '2번: 집단 통솔 & 군자금',
      desc: '10~30여 명의 정예 단원과 숙영지를 이끌며 영주들의 고용 계약을 수주하고 부를 축적합니다.',
      status: '용병대장 (사병대 지휘관)',
      location: '전선 인근 상설 숙영지 또는 무역 거점',
      goal: '명성을 떨치는 대용병단 구축 및 독립 거점(폐성 점령 또는 남작령 분봉) 획득',
      additional: '단원 20여 명을 이끄는 소규모 용병단. 매 턴 단원 주급 및 식량 보급 유지비 지출. [시작 소지품]: 단장의 장검 및 사슬 갑옷, 용병단 군기, 단원 20명(보병 15, 궁수 5), 마차 2대, 텐트 숙영지, 군자금 금화 120닢.',
      trait: '[전문특성] 용병 계약 협상가 (확립된 특성) : 고용주와의 보수 협상 및 부대 사기 관리에 능합니다., [정신특성] 강인한 의지 (강한 특성) : 전장의 공포 앞에서도 부하들을 질타하며 전열을 유지시킵니다., [전문특성] 전술적 안목 (잠재 특성) : 지형과 진형의 유불리를 빠르게 파악합니다.',
      statusPresets: [
        {
          id: 'mercenary_captain',
          icon: '🛡️',
          name: '용병대장 / 지휘관',
          shortDesc: '정예 전투원들을 통솔하며 제후들의 전선에 고용되는 사병대 수장',
          playerStatus: '용병대장 (사병대 지휘관)',
          goal: '명성을 떨치는 대용병단 육성 및 영주로부터 남작령(영지) 수여 획득',
          additional: '단원 20여 명을 이끄는 자유 용병대. [소지품]: 사슬 갑옷과 지휘관 장검, 부대 군기, 단원 20명(보병 15, 궁수 5), 보급 마차 2대, 텐트 숙영지, 군자금 금화 120닢.'
        },
        {
          id: 'caravan_master',
          icon: '🐫',
          name: '상단주 / 대상인',
          shortDesc: '짐마차와 호위대를 이끌고 대륙의 도시와 국경을 잇는 무역 상단 수장',
          playerStatus: '상단주 (대상인 / 교역 행수)',
          goal: '대륙 횡단 무역로 독점 및 대도시 상인 참사회 의장 선출',
          additional: '무역 대상단을 이끄는 상인. [소지품]: 장부와 정밀 저울, 짐마차 4대, 호위 용병 12명, 교역 물품 마차, 운용 자금 금화 250닢.'
        },
        {
          id: 'guild_master',
          icon: '⚒️',
          name: '동업조합장 / 길드 마스터',
          shortDesc: '도시의 숙련 장인과 도제들을 거느리고 생산과 공방을 총괄하는 조합 대표',
          playerStatus: '길드 마스터 (동업조합장)',
          goal: '도시 공방 독점 생산권 획득 및 영주 특허장을 통한 길드 자치권 공인',
          additional: '도시 장인 조합. [소지품]: 조합 인장, 정밀 도구 세트, 숙련 장인 15명, 자재 운반 마차, 조합 금고 금화 150닢.'
        },
        {
          id: 'village_reeve',
          icon: '🏡',
          name: '장원 관리인 / 촌장',
          shortDesc: '장원 촌락 주민들을 통솔하며 영주의 부역과 자치를 조율하는 공동체 대표',
          playerStatus: '장원 관리인 (촌락 자치 대표)',
          goal: '촌락 생산성 극대화 및 영주 면세 특권 획득, 자치 읍(Borough) 승격',
          additional: '장원 촌락의 대소사를 총괄하는 관리인. [소지품]: 장원 호구 장부, 영지 관할권 지팡이, 촌락 자경단 15명, 곡물 창고 열쇠, 촌락 기금 은화 80닢.'
        },
        {
          id: 'bandit_chieftain',
          icon: '🏹',
          name: '도적단 두목 / 녹림 수령',
          shortDesc: '험준한 산채나 요충지를 본거지로 삼아 무리를 거느린 무장 도당의 우두머리',
          playerStatus: '도적단 두목 (무장 도당 수령)',
          goal: '일대 요충지 장악, 영주의 토벌군 격퇴 후 정식 사면 및 변경 수비대장 임명',
          additional: '산채에 웅거한 무장 도당. [소지품]: 합성궁과 화살, 비밀 산채 아지트, 단원 18명, 경계망, 노략품 은화 90닢.'
        }
      ],
      innateStats: {
        '근력': 65, '체력': 65, '의지력': 65, '지구력': 60, '지각력': 55,
        '신체 조정력': 50, '지능': 50, '집중력': 50, '민첩성': 50, '반사 신경': 50,
        '속도': 45, '기억력': 45, '학습 능력': 50
      },
      acquiredStats: {
        '통솔력': 45, '전술': 35, '전투력': 30, '위협': 25, '무기 숙련도': 25,
        '기마술': 20, '행정력': 10, '생존술': 10, '매력': 0, '외교력': 0, '설득력': 0,
        '기만술': 0, '전략': 0, '의술': 0, '학문': 0, '기술 숙련도': 0, '장인 기술': 0, '은밀 행동': 0, '수사력': 0
      },
      startingTraitsMap: {
        '정신특성': ['강인한 의지'],
        '전문특성': ['검술의 달인']
      }
    },
    {
      id: 'clergy',
      num: '3번',
      icon: '⛪',
      title: '3. 성직자 / 수도자',
      subtitle: '평신도 · 사제 · 수도원장 · 주교 · 교황',
      badge: '3번: 신앙 & 교단 발언권',
      desc: '독신 서약과 신앙심, 고문서 학식을 바탕으로 교구 민심을 이끌고 종교적 권위를 세웁니다.',
      status: '사제 (교구 본당 신부)',
      location: '한적한 시골 수도원 또는 작은 교구 예배당',
      goal: '교구 성당 부흥 및 주교좌 성당 참사회원/총대리 사제 임명',
      additional: '교구민들을 이끌고 예배와 성사를 집전하는 본당 사제. [시작 소지품]: 사제복과 제의, 은 십자가 성물, 라틴어 성경 사본, 성유함, 본당 성당, 십일조 은화 50닢.',
      trait: '[정신특성] 경건한 신앙 (강한 특성) : 세속의 유혹에 굴하지 않고 교단의 규율을 엄격히 수호합니다., [전문특성] 고문서 필사 및 신학 (확립된 특성) : 라틴어와 고대 경전을 해독하고 필사하는 데 능통합니다., [전문특성] 영적 치유와 약초학 (잠재 특성) : 아픈 신도들을 돌보고 약초를 조제하는 지혜가 있습니다.',
      statusPresets: [
        {
          id: 'layman',
          icon: '📿',
          name: '평신도 / 수도원 봉사자',
          shortDesc: '세속에 머물거나 수도원에 헌신하며 교회를 돕는 신앙인',
          playerStatus: '평신도 (수도회 봉헌자)',
          goal: '모범적인 신앙으로 교구민의 신망을 얻고 교회 참사회/성직 서품 추천 획득',
          additional: '세속에서 교회를 후원하고 수도원 노동을 돕는 평신도 봉헌자. [소지품]: 수수한 평민복, 목각 십자가, 묵주, 성경 구절 필사본, 은화 25닢.'
        },
        {
          id: 'monk',
          icon: '📜',
          name: '수사 / 수도승',
          shortDesc: '수도원 엄률 서약에 따라 기도와 노동, 학문 필사에 헌신하는 수도사',
          playerStatus: '수사 (수도회 수도승)',
          goal: '고결한 영성과 학식으로 수도원 필사실 책임자 및 부원장(Prior) 승격',
          additional: '수도회 규칙을 엄수하며 기도와 필사에 매진하는 수사. [소지품]: 수도복(갈색 양모 로브), 가죽 허리띠, 라틴어 기도서, 양피지 필사 도구, 수도원 독방.'
        },
        {
          id: 'priest',
          icon: '⛪',
          name: '사제 / 본당 신부',
          shortDesc: '교구 성당에서 성찬을 집전하고 교구민의 영혼을 사목하는 서품 성직자',
          playerStatus: '사제 (교구 본당 신부)',
          goal: '교구 성당 부흥 및 주교좌 성당 참사회원/총대리 사제 임명',
          additional: '교구민들을 이끌고 예배와 고해성사를 집전하는 본당 사제. [소지품]: 사제복과 제의, 은 십자가 성물, 성경 전권 사본, 성유함, 본당 성당, 십일조 은화 50닢.'
        },
        {
          id: 'abbot',
          icon: '🏰',
          name: '수도원장',
          shortDesc: '독립 수도원과 소속 장원 영지, 수도사 공동체를 총괄하는 대수도원장',
          playerStatus: '수도원장 (대수도원 통치자)',
          goal: '수도원 대성당 완공 및 교황청 직속 면벌/자치 특허 획득, 교단 총회 주도',
          additional: '수도원 영지와 수십 명의 수사를 통솔하는 영적 영주. [소지품]: 원장 지팡이, 원장 인장 반지, 대수도원 장원, 수도사 25명, 도서관 장서 200권, 금화 120닢.'
        },
        {
          id: 'bishop',
          icon: '👑',
          name: '주교 / 대주교',
          shortDesc: '광대한 관구 교구와 교회령 영지를 다스리며 세속 제후와 견주는 고위 성직자',
          playerStatus: '주교 (관구 교구장)',
          goal: '대주교 승품 및 추기경 서임, 세속 군주를 견제하는 신성 정치의 정점 등극',
          additional: '광대한 교회령 영지와 관구 교구를 통솔하는 제후급 성직자. [소지품]: 주교관(Mitre)과 황금 지팡이, 주교좌 대성당, 교회령 기사 15명, 교구 서기관단, 금화 300닢.'
        },
        {
          id: 'pope',
          icon: '🇻🇦',
          name: '교황 (Pope / 성좌의 주인)',
          shortDesc: '베드로의 후계자이자 전 기독교 세계의 최고 영적 목자이며 교황령 군주',
          playerStatus: '교황 (로마 성좌 성하 / 교황령 군주)',
          goal: '전 기독교 세계의 신앙 수호, 십자군 제창 및 세속 군주들을 굴복시키는 교황권(Papacy)의 절대화',
          additional: '바티칸 성좌와 교황령을 직접 통치하는 최고 목자. [소지품]: 3중관(Tiara)과 어부의 반지, 사도 궁전 대성채, 스위스/교황 근위대 500명, 추기경 참사회단, 바티칸 비밀 문서고, 성좌 국고 금화 3000닢.'
        }
      ],
      innateStats: {
        '지능': 70, '학습 능력': 70, '기억력': 65, '의지력': 65, '집중력': 65,
        '지각력': 60, '지구력': 50, '체력': 45, '신체 조정력': 40, '근력': 40,
        '민첩성': 40, '반사 신경': 40, '속도': 45
      },
      acquiredStats: {
        '학문': 50, '설득력': 35, '의술': 30, '외교력': 25, '매력': 25,
        '행정력': 20, '수사력': 15, '통솔력': 0, '기만술': 0, '위협': 0, '전략': 0,
        '전술': 0, '전투력': 0, '무기 숙련도': 0, '기마술': 0, '생존술': 0, '기술 숙련도': 0, '장인 기술': 0, '은밀 행동': 0
      },
      startingTraitsMap: {
        '정신특성': ['강인한 의지'],
        '전문특성': ['웅변가']
      }
    },
    {
      id: 'noble',
      num: '4번',
      icon: '👑',
      title: '4. 봉건 영주 / 귀족',
      subtitle: '기사 · 남작 · 백작 · 공작 · 황제',
      badge: '4번: 영지 통치 & 가문 혈통',
      desc: '장원과 백성을 거느리고 가문의 대를 이어가며 외교와 전쟁을 총지휘하는 통치자입니다.',
      status: '봉건 영주 (남작)',
      location: '가문의 본성 (영지 성채)',
      goal: '인근 분쟁 승리 및 남작령 요새 확장, 자작위/백작위 수임',
      additional: '영지와 가문의 번영을 위해 외교와 군사를 지휘하는 전통적 봉건 영주. [시작 소지품]: 본성 성채(Lv.1), 징집병 40명, 가문 인장 반지, 장원 백성 150가구, 국고 금화 250닢.',
      trait: '[전문특성] 명문 혈통 (확립된 특성) : 주변 제후들에게 정당한 통치 명분과 혈통의 인정을 받습니다.',
      statusPresets: [
        {
          id: 'knight',
          icon: '🛡️',
          name: '기사 (Knight)',
          shortDesc: '군마와 갑주를 갖추고 군역을 수행하며 작은 장원을 소유한 무인 귀족',
          playerStatus: '봉건 귀족 (기사)',
          goal: '전공을 세워 주군으로부터 정식 남작령 분봉 및 가문 문장/성씨 수여 획득',
          additional: '군마와 무구를 갖춘 기사 영주. [소지품]: 판금 사슬 갑옷, 군마 2필, 시종 2명, 장원 30가구, 금화 100닢.'
        },
        {
          id: 'baron',
          icon: '🏰',
          name: '남작 (Baron)',
          shortDesc: '단일 성채와 장원 영지를 관할하며 가문의 첫 발을 뗀 기본 봉건 영주',
          playerStatus: '봉건 영주 (남작)',
          goal: '인근 분쟁 승리 및 남작령 요새 확장, 자작위/백작위 수임',
          additional: '본성 성채와 장원을 다스리는 봉건 남작. [소지품]: 본성 성채(Lv.1), 징집병 40명, 가문 인장 반지, 장원 150가구, 국고 금화 250닢.'
        },
        {
          id: 'viscount',
          icon: '⚔️',
          name: '자작 (Viscount)',
          shortDesc: '백작령의 부관이자 군사 요충지 성채군을 영유하는 자치 봉건 영주',
          playerStatus: '봉건 영주 (자작)',
          goal: '독자적인 백작령 승격 및 군사 요충지 관문 성채 난공불락화',
          additional: '전략 요충지를 관할하는 봉건 자작. [소지품]: 요충지 성채 2개소, 상비군 60명, 장원 300가구, 국고 금화 400닢.'
        },
        {
          id: 'count',
          icon: '👑',
          name: '백작 (Count)',
          shortDesc: '주(County) 전체와 다수의 성채, 장원 백성들을 거느린 유력 봉건 제후',
          playerStatus: '봉건 영주 (백작)',
          goal: '주변 백작령 병합 및 공작위 수임, 왕국 평의회 주도권 장악',
          additional: '유서 깊은 백작령을 통치하는 유력 제후. [소지품]: 백작령 대성채, 상비군 100명, 장원 600가구, 국고 금화 600닢, 가문 족보.'
        },
        {
          id: 'marquis',
          icon: '🦅',
          name: '후작 / 변경백 (Margrave)',
          shortDesc: '국경 지대 방위를 총괄하며 막강한 군사 지휘권과 변경 요새를 보유한 국경 제후',
          playerStatus: '봉건 영주 (후작 / 변경백)',
          goal: '국경 외세 격퇴 및 영토 대확장, 왕국 최고 총사령관 등극',
          additional: '국경 방어권을 쥔 막강한 변경 제후. [소지품]: 변경 요새군, 정예 국경 수비대 150명, 군마 50필, 군자금 금화 800닢.'
        },
        {
          id: 'duke',
          icon: '⚜️',
          name: '공작 (Duke)',
          shortDesc: '광대한 공국과 여러 백작 가문을 신하로 거느린 최고위 봉건 대제후',
          playerStatus: '봉건 대제후 (공작)',
          goal: '왕관 획득(국왕 즉위) 또는 황제 선제후로서 제국 패권 장악, 왕조 창건',
          additional: '광대한 공국을 통솔하는 최고위 제후. [소지품]: 수도 대성채, 정예 친위대 250명, 가신 백작 3명, 국고 금화 1200닢.'
        },
        {
          id: 'emperor',
          icon: '🦅',
          name: '황제 (Emperor / 제국 군주)',
          shortDesc: '제국(Empire) 전체와 다수의 왕국, 공작령들을 봉신으로 거느린 천하의 최고 주권자',
          playerStatus: '제국 황제 (카이저 / 바실레우스 / 황제)',
          goal: '제국 판도 대확장, 주변 이민족 정벌, 제위 세습화 및 영원한 제국 팍스 로마나/천하통일 달성',
          additional: '광대한 제국과 수많은 제후들을 거느린 최고 군주. [소지품]: 제국 황금 관과 옥좌, 제국 황궁 대성채, 황실 정예 친위대 1000명, 제국 대법관 및 선제후단, 제국 국고 금화 5000닢, 계승 칙서.'
        }
      ],
      acquiredStats: {
        '통솔력': 30, '외교력': 30, '행정력': 30, '매력': 25, '전술': 25,
        '무기 숙련도': 20, '기마술': 20, '학문': 20, '설득력': 0, '기만술': 0,
        '위협': 0, '전략': 0, '전투력': 0, '생존술': 0, '의술': 0, '기술 숙련도': 0, '장인 기술': 0, '은밀 행동': 0, '수사력': 0
      },
      startingTraitsMap: {
        '전문특성': ['웅변가']
      }
    }
  ];

  const [selectedStatusPresetId, setSelectedStatusPresetId] = useState<string>('baron');

  const handleSelectStatusPreset = (preset: StatusPreset) => {
    setSelectedStatusPresetId(preset.id);
    setFormData(prev => ({
      ...prev,
      playerStatus: preset.playerStatus,
      finalGoal: preset.goal || prev.finalGoal,
      additionalSettings: preset.additional || prev.additionalSettings
    }));
  };

  const handleSelectArchetype = (archId: string) => {
    const arch = ARCHETYPES.find(a => a.id === archId);
    if (!arch) return;
    setSelectedArchetype(archId);

    const defaultPreset = arch.statusPresets?.[0];
    if (defaultPreset) {
      setSelectedStatusPresetId(defaultPreset.id);
    }

    // 스탯 동기화
    if (arch.innateStats && arch.acquiredStats) {
      const mergedStats = { ...arch.innateStats, ...arch.acquiredStats };
      setStatsData(mergedStats);
      setFormData(prev => ({
        ...prev,
        archetype: archId,
        playerStatus: defaultPreset?.playerStatus || arch.status,
        startLocation: arch.location,
        finalGoal: defaultPreset?.goal || arch.goal,
        additionalSettings: defaultPreset?.additional || arch.additional,
        traits: arch.trait,
        stats: Object.entries(mergedStats).map(([k, v]) => `${k}: ${v}`).join(', ')
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        archetype: archId,
        playerStatus: defaultPreset?.playerStatus || arch.status,
        startLocation: arch.location,
        finalGoal: defaultPreset?.goal || arch.goal,
        additionalSettings: defaultPreset?.additional || arch.additional,
        traits: arch.trait
      }));
    }

    // 특성 동기화
    if (arch.startingTraitsMap) {
      setSelectedTraits(arch.startingTraitsMap);
      syncTraitsToFormData(arch.startingTraitsMap);
    }
  };

  const [formData, setFormData] = useState({
    apiKey: '',
    era: '',
    worldview: '역사적',
    character: '',
    difficulty: '보통',
    languageMode: '한국어',
    finalGoal: '인근 분쟁 승리 및 남작령 요새 확장, 자작위/백작위 수임',
    playerStatus: '봉건 영주 (남작)',
    startLocation: '가문의 본성 (영지 성채)',
    additionalSettings: '',
    archetype: 'noble',
    houseName: '',
    houseMotto: '',
    houseCrest: '🦁 황금 사자',
    houseFocus: '외교와 정략혼 (Diplomatic Marriage)',
    stats: '무력: 50, 지력: 50, 매력: 50, 재력: 50, 운: 50',
    traits: '[전문특성] 명문 혈통',
    inheritedState: null as any
  });

  useEffect(() => {
    const savedKey = localStorage.getItem("ck_api_key");
    if (savedKey) {
      setFormData(fd => ({ ...fd, apiKey: savedKey }));
    }
  }, []);

  useEffect(() => {
    const inheritedData = localStorage.getItem("ck_inheritance");
    if (inheritedData) {
      try {
        const parsed = JSON.parse(inheritedData);
        setFormData(fd => ({ 
          ...fd, 
          character: parsed.heir || '후계자',
          inheritedState: parsed 
        }));
        setCurrentStep(2); // Skip Step 1
      } catch (err) {}
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleReset = () => {
    if (confirm("모든 설정 내역을 초기화하시겠습니까?")) {
      setFormData({
        apiKey: formData.apiKey, // Keep the API key during reset
        era: '',
        worldview: '역사적',
        character: '',
        difficulty: '보통',
        languageMode: '한국어',
        finalGoal: '인근 분쟁 승리 및 남작령 요새 확장, 자작위/백작위 수임',
        playerStatus: '봉건 영주 (남작)',
        startLocation: '가문의 본성 (영지 성채)',
        additionalSettings: '',
        archetype: 'noble',
        houseName: '',
        houseMotto: '',
        houseCrest: '🦁 황금 사자',
        houseFocus: '외교와 정략혼 (Diplomatic Marriage)',
        stats: '무력: 50, 지력: 50, 매력: 50, 재력: 50, 운: 50',
        traits: '[전문특성] 명문 혈통',
        inheritedState: null as any
      });
      const initialStats: Record<string, number | string> = {};
      innateStatsList.forEach(stat => initialStats[stat] = 50);
      acquiredStatsList.forEach(stat => initialStats[stat] = 0);
      setStatsData(initialStats);
      setSelectedTraits({});
      setCustomTraitInputs({});
      setWorldviewType('역사적');
      setSelectedArchetype('noble');
      setSelectedStatusPresetId('baron');
      setCurrentStep(1);
    }
  };

  const handleStatChange = (stat: string, delta: number) => {
    setStatsData(prev => {
      const currentVal = typeof prev[stat] === 'number' ? prev[stat] as number : 0;
      const newVal = Math.max(0, Math.min(100, currentVal + delta));
      const nextData = { ...prev, [stat]: newVal };
      if (!customStatsMode) {
         setFormData(fd => ({ ...fd, stats: Object.entries(nextData).map(([k,v]) => `${k}: ${v === '' ? 0 : v}`).join(', ') }));
      }
      return nextData;
    });
  };

  const handleStatInput = (stat: string, value: string) => {
    setStatsData(prev => {
      const nextData = { ...prev };
      if (value === "") {
        nextData[stat] = "";
      } else {
        let newVal = parseInt(value, 10);
        if (isNaN(newVal)) return prev;
        newVal = Math.max(0, Math.min(100, newVal));
        nextData[stat] = newVal;
      }
      if (!customStatsMode) {
         setFormData(fd => ({ ...fd, stats: Object.entries(nextData).map(([k,v]) => `${k}: ${v === '' ? 0 : v}`).join(', ') }));
      }
      return nextData;
    });
  };

  const syncTraitsToFormData = (traitsDict: Record<string, string[]>) => {
    const traitStrings: string[] = [];
    Object.entries(traitsDict).forEach(([cat, traits]) => {
      traits.forEach(t => traitStrings.push(`[${cat}] ${t}`));
    });
    setFormData(fd => ({ ...fd, traits: traitStrings.join(', ') }));
  };

  const toggleTrait = (category: string, traitName: string) => {
    setSelectedTraits(prev => {
      const catTraits = prev[category] || [];
      const isSelected = catTraits.includes(traitName);
      const newCatTraits = isSelected ? catTraits.filter(t => t !== traitName) : [...catTraits, traitName];
      const nextTraits = { ...prev, [category]: newCatTraits };
      if (!customTraitsMode) syncTraitsToFormData(nextTraits);
      return nextTraits;
    });
  };

  const handleCustomTraitAdd = (category: string) => {
    const val = customTraitInputs[category];
    if (!val || val.trim() === '') return;
    
    setSelectedTraits(prev => {
      const catTraits = prev[category] || [];
      if (catTraits.includes(val)) return prev;
      const nextTraits = { ...prev, [category]: [...catTraits, val] };
      if (!customTraitsMode) syncTraitsToFormData(nextTraits);
      return nextTraits;
    });
    setCustomTraitInputs(prev => ({ ...prev, [category]: '' }));
  };

  const [isRecommending, setIsRecommending] = useState(false);

  const handleRecommend = async () => {
    setIsRecommending(true);
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData })
      });
      const data = await res.json();
      if (data.config) {
        setFormData(fd => ({
          ...fd,
          era: data.config.era || fd.era,
          worldview: data.config.worldview || fd.worldview,
          character: data.config.character || fd.character,
          finalGoal: data.config.finalGoal || fd.finalGoal,
          playerStatus: data.config.playerStatus || fd.playerStatus,
          startLocation: data.config.startLocation || fd.startLocation,
          additionalSettings: data.config.additionalSettings || fd.additionalSettings
        }));
        
        if (data.config.stats) {
          setStatsData(prev => ({ ...prev, ...data.config.stats }));
        }

        if (data.config.traits && Array.isArray(data.config.traits)) {
          const newTraits: Record<string, string[]> = {};
          data.config.traits.forEach((t: any) => {
            if (!newTraits[t.category]) newTraits[t.category] = [];
            newTraits[t.category].push(t.name);
          });
          setSelectedTraits(newTraits);
          syncTraitsToFormData(newTraits);
        }
        alert("AI가 추천 설정을 구성했습니다! 스탯과 특성을 확인하고 게임을 시작해보세요.");
      } else {
        alert("추천 설정을 가져오는데 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("서버 통신 오류가 발생했습니다.");
    }
    setIsRecommending(false);
  };

  const [isValidating, setIsValidating] = useState(false);

  const handleStart = async () => {
    setIsValidating(true);
    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData })
      });
      const data = await res.json();
      if (!data.valid) {
        alert(data.reason || "세계관 고증에 맞지 않는 설정이 있습니다. 수정 후 다시 시도해주세요.");
        setIsValidating(false);
        return; // 중단
      }
    } catch (err) {
      console.error(err);
      // 검증 실패(네트워크 오류 등) 시 일단 넘어가도록
    }

    console.log("게임 시작 요청", formData);

    let finalAdditional = formData.additionalSettings || '';
    if (formData.archetype === 'noble' && (formData.houseName || formData.houseMotto)) {
      const houseDesc = `[가문 및 혈통 설정] 가문명: ${formData.houseName || '유력 귀족 가문'} | 가언(모토): "${formData.houseMotto || '명예와 긍지'}" | 문장(상징): ${formData.houseCrest || '🦁 황금 사자'} | 가풍: ${formData.houseFocus || '통치와 번영'}`;
      if (!finalAdditional.includes('[가문 및 혈통 설정]')) {
        finalAdditional = finalAdditional ? `${finalAdditional}\n${houseDesc}` : houseDesc;
      }
    }

    if (formData.inheritedState) {
      // 상속인 경우, 이전 상태를 병합하여 새로운 추가 설정을 만듭니다.
      const inheritanceContext = `
[세대 교체 발동] 이전 세대 캐릭터가 사망(또는 퇴위)하여 그의 후계자 '${formData.character}'(으)로 세대가 교체되었습니다.
이전 캐릭터가 남긴 다음의 [가문 정보], [세력 상태], [소지품]을 그대로 승계받은 상태에서 오프닝 턴을 작성하세요.

가문 정보: ${JSON.stringify(formData.inheritedState.familyState)}
세력 상태: ${JSON.stringify(formData.inheritedState.factionState)}
소지품: ${JSON.stringify(formData.inheritedState.inventory)}
`;
      const finalFormData = {
        ...formData,
        additionalSettings: inheritanceContext + (finalAdditional ? `\n${finalAdditional}` : ''),
        previousState: formData.inheritedState.previousState
      };
      localStorage.setItem("ck_startup_config", JSON.stringify(finalFormData));
      localStorage.removeItem("ck_inheritance");
    } else {
      const finalFormData = {
        ...formData,
        additionalSettings: finalAdditional
      };
      localStorage.setItem("ck_startup_config", JSON.stringify(finalFormData));
    }
    window.location.href = "/";
  };

  return (
    <main className={styles.container}>
      <div className={`glass-panel ${styles.formPanel}`}>
        <div style={{ position: 'relative' }}>
          <button 
            style={{ position: 'absolute', top: 0, left: 0, padding: '8px 12px', background: 'var(--panel-bg)', color: 'var(--text-main)', border: '1px solid var(--panel-border)', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s', zIndex: 10 }}
            onClick={() => window.location.href = '/'}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--gold-accent)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--panel-border)'}
          >
            🏠 메인 타이틀로
          </button>
          <button 
            style={{ position: 'absolute', top: 0, right: 0, padding: '8px 12px', background: 'var(--panel-bg)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.5)', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s', zIndex: 10 }}
            onClick={handleReset}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'; e.currentTarget.style.background = 'var(--panel-bg)'; }}
          >
            🔄 일괄 초기화
          </button>
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <img src="/logo.jpg" alt="CHRONICLES" style={{ height: '60px', borderRadius: '4px', border: '1px solid var(--gold-accent)' }} />
          </div>
          <h1 className={styles.title} style={{ textAlign: 'center' }}>【 게임 시작 설정 】</h1>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '25px', fontSize: '1rem', flexWrap: 'wrap' }}>
          <div style={{ color: currentStep === 1 ? 'var(--gold-accent)' : 'var(--text-muted)', fontWeight: currentStep === 1 ? 'bold' : 'normal', transition: 'color 0.3s' }}>1. 기본 설정</div>
          <div style={{ color: 'var(--text-muted)' }}>&gt;</div>
          <div style={{ color: currentStep === 2 ? 'var(--gold-accent)' : 'var(--text-muted)', fontWeight: currentStep === 2 ? 'bold' : 'normal', transition: 'color 0.3s' }}>2. 신분 및 배경</div>
          <div style={{ color: 'var(--text-muted)' }}>&gt;</div>
          <div style={{ color: currentStep === 3 ? 'var(--gold-accent)' : 'var(--text-muted)', fontWeight: currentStep === 3 ? 'bold' : 'normal', transition: 'color 0.3s' }}>3. 능력치</div>
          <div style={{ color: 'var(--text-muted)' }}>&gt;</div>
          <div style={{ color: currentStep === 4 ? 'var(--gold-accent)' : 'var(--text-muted)', fontWeight: currentStep === 4 ? 'bold' : 'normal', transition: 'color 0.3s' }}>4. 시작 특성</div>
        </div>

        {/* 1단계: 기본 설정 (시대, 세계관, 인물, 난이도, 언어 모드) */}
        {currentStep === 1 && (
          <div className={styles.fieldsGrid} style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
            <div className={styles.fieldRow}>
               <label className={styles.fieldLabel}>API KEY:</label>
               <input 
                 type="password"
                 name="apiKey"
                 className={styles.inputField}
                 placeholder="입력..."
                 value={formData.apiKey}
                 onChange={(e) => {
                   handleChange(e);
                   localStorage.setItem("ck_api_key", e.target.value);
                 }}
               />
             </div>
            <div className={styles.fieldRow}>
              <label className={styles.fieldLabel}>시대:</label>
              <input type="text" name="era" className={styles.inputField} placeholder="입력" value={formData.era} onChange={handleChange} />
            </div>
            <div className={styles.fieldRow}>
              <label className={styles.fieldLabel}>세계관:</label>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '10px' }}>
                <select 
                  className={styles.selectField} 
                  style={{ width: '180px' }}
                  value={worldviewType}
                  onChange={(e) => {
                    setWorldviewType(e.target.value);
                    if (e.target.value !== '자유 입력') {
                       setFormData({ ...formData, worldview: e.target.value });
                    } else {
                       setFormData({ ...formData, worldview: '' });
                    }
                  }}
                >
                  <option value="역사적">역사적 (Historical)</option>
                  <option value="역사 기반 대체역사">역사 기반 대체역사</option>
                  <option value="자유 입력">자유 입력 (Custom)</option>
                </select>
                {worldviewType === '자유 입력' && (
                  <input type="text" name="worldview" className={styles.inputField} placeholder="원하는 세계관 직접 입력" value={formData.worldview} onChange={handleChange} />
                )}
              </div>
            </div>
            <div className={styles.fieldRow}>
              <label className={styles.fieldLabel}>인물:</label>
              <input type="text" name="character" className={styles.inputField} placeholder="예: 이순신 (실존) 또는 아서 (가상)" value={formData.character} onChange={handleChange} />
            </div>
            <div className={styles.fieldRow}>
              <label className={styles.fieldLabel}>난이도:</label>
              <select name="difficulty" className={styles.selectField} value={formData.difficulty} onChange={handleChange}>
                <option value="쉬움">쉬움</option>
                <option value="보통">보통</option>
                <option value="현실적">현실적</option>
                <option value="어려움">어려움</option>
                <option value="매우 어려움">매우 어려움</option>
              </select>
            </div>
            <div className={styles.fieldRow}>
              <label className={styles.fieldLabel}>언어 모드:</label>
              <select name="languageMode" className={styles.selectField} value={formData.languageMode} onChange={handleChange}>
                <option value="한국어">한국어</option>
                <option value="고증 언어">고증 언어</option>
                <option value="혼합">혼합</option>
              </select>
            </div>
          </div>
        )}

        {/* 2단계: 신분 및 배경 설정 (아키타입, 신분 프리셋, 가문 설정, 시작 위치, 추가 설정) */}
        {currentStep === 2 && (
          <div className={styles.fieldsGrid} style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
            {/* 👑 시작 신분 아키타입 선택 (Origin Archetype) */}
            <div className={styles.fieldRow} style={{ gridColumn: '1 / -1', flexDirection: 'column', alignItems: 'stretch', gap: '10px', marginTop: '4px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <label className={styles.fieldLabel} style={{ fontSize: '1.05rem', color: 'var(--gold-accent)', fontWeight: 'bold' }}>
                  👑 시작 신분 아키타입 (Origin Archetype):
                </label>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  원하는 신분을 클릭하면 추천 설정이 자동 입력됩니다.
                </span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '12px' }}>
                {ARCHETYPES.map((arch) => {
                  const isSelected = selectedArchetype === arch.id;
                  return (
                    <div
                      key={arch.id}
                      onClick={() => handleSelectArchetype(arch.id)}
                      style={{
                        padding: '14px',
                        background: isSelected 
                          ? 'linear-gradient(145deg, rgba(212, 175, 55, 0.2), rgba(15, 23, 42, 0.8))'
                          : 'rgba(0, 0, 0, 0.35)',
                        border: isSelected ? '2px solid var(--gold-accent)' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 0 15px rgba(212, 175, 55, 0.25)' : 'none',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.5)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                          e.currentTarget.style.transform = 'none';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '1.8rem' }}>{arch.icon}</span>
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: isSelected ? 'var(--gold-accent)' : 'rgba(255, 255, 255, 0.1)',
                          color: isSelected ? '#111' : 'var(--text-muted)',
                          fontWeight: 'bold'
                        }}>
                          {arch.badge}
                        </span>
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: isSelected ? 'var(--gold-hover)' : 'var(--text-main)', marginBottom: '4px' }}>
                        {arch.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: isSelected ? '#bae6fd' : 'var(--text-muted)', marginBottom: '8px' }}>
                        {arch.subtitle}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        {arch.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 🎖️ 플레이어 신분 프리셋 선택 (직접 입력란 삭제됨, 프리셋 전용) */}
            <div className={styles.fieldRow} style={{ gridColumn: '1 / -1', flexDirection: 'column', alignItems: 'stretch', gap: '10px', marginTop: '6px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <label className={styles.fieldLabel} style={{ fontSize: '1.05rem', color: 'var(--gold-accent)', fontWeight: 'bold' }}>
                  🎖️ 신분 프리셋 (Origin Status Presets):
                </label>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  현재 선택된 신분: <strong style={{ color: 'var(--gold-hover)' }}>{formData.playerStatus || '선택 안 됨'}</strong>
                </span>
              </div>

              {/* Archetype Linked Presets Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '8px' }}>
                {(ARCHETYPES.find(a => a.id === selectedArchetype)?.statusPresets || []).map((preset) => {
                  const isPresetSelected = formData.playerStatus === preset.playerStatus || selectedStatusPresetId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectStatusPreset(preset)}
                      style={{
                        padding: '10px 12px',
                        background: isPresetSelected
                          ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.25), rgba(15, 23, 42, 0.9))'
                          : 'rgba(0, 0, 0, 0.35)',
                        border: isPresetSelected ? '2px solid var(--gold-accent)' : '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isPresetSelected ? '0 0 12px rgba(212, 175, 55, 0.25)' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (!isPresetSelected) {
                          e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.5)';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isPresetSelected) {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.35)';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '1.2rem' }}>{preset.icon}</span>
                        <strong style={{ fontSize: '0.9rem', color: isPresetSelected ? 'var(--gold-hover)' : 'var(--text-main)' }}>
                          {preset.name}
                        </strong>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                        {preset.shortDesc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 🏰 봉건 영주 / 귀족 선택 시 가문 설정 항목 (House / Dynasty Settings) */}
            {selectedArchetype === 'noble' && (
              <div style={{
                gridColumn: '1 / -1',
                background: 'linear-gradient(145deg, rgba(212, 175, 55, 0.12), rgba(15, 23, 42, 0.7))',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                borderRadius: '10px',
                padding: '16px',
                marginTop: '6px',
                marginBottom: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(212, 175, 55, 0.3)', paddingBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.3rem' }}>🛡️</span>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--gold-accent)' }}>가문 및 혈통 설정 (House & Dynasty)</strong>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>영주 캐릭터의 가문 명칭, 가언, 문장 상징을 지정합니다.</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 'bold' }}>가문 이름 (House Name):</label>
                    <input
                      type="text"
                      name="houseName"
                      className={styles.inputField}
                      placeholder="예: 폰 합스부르크, 카펠, 랭커스터, 플랜태저넷"
                      value={formData.houseName}
                      onChange={handleChange}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 'bold' }}>가문 가언 / 모토 (House Motto):</label>
                    <input
                      type="text"
                      name="houseMotto"
                      className={styles.inputField}
                      placeholder="예: 빛은 어둠 속에서 빛난다 / 피와 명예"
                      value={formData.houseMotto}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 'bold' }}>가문 문장 상징 (Coat of Arms):</label>
                    <span style={{ fontSize: '0.8rem', color: 'var(--gold-hover)' }}>선택된 상징: {formData.houseCrest}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {['🦁 황금 사자', '🦅 흑독수리', '⚜️ 백합', '🐺 회색 늑대', '🐉 붉은 용', '⚔️ 교차된 장검', '🏰 석조 성채', '☀️ 타오르는 태양'].map(crest => {
                      const isSel = formData.houseCrest === crest;
                      return (
                        <button
                          key={crest}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, houseCrest: crest }))}
                          style={{
                            padding: '6px 12px',
                            background: isSel ? 'rgba(212, 175, 55, 0.25)' : 'rgba(0,0,0,0.4)',
                            border: isSel ? '1px solid var(--gold-accent)' : '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '6px',
                            color: isSel ? 'var(--gold-hover)' : 'var(--text-main)',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {crest}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 'bold' }}>가문 가풍 / 성향 (Dynasty Focus):</label>
                  <select
                    name="houseFocus"
                    className={styles.selectField}
                    value={formData.houseFocus}
                    onChange={handleChange}
                  >
                    <option value="외교와 정략혼 (Diplomatic Marriage)">외교와 정략혼 (Diplomatic Marriage) - 인근 제후들과의 혼맥 및 동맹</option>
                    <option value="군사와 정복 (Martial Conquest)">군사와 정복 (Martial Conquest) - 무력과 기사도, 영토 확장</option>
                    <option value="행정과 번영 (Stewardship & Prosperity)">행정과 번영 (Stewardship & Prosperity) - 장원 개발, 상업 진흥, 부국강병</option>
                    <option value="신앙과 경건 (Piety & Divine Right)">신앙과 경건 (Piety & Divine Right) - 교황청 후원, 십자군 및 성유물</option>
                    <option value="음모와 암계 (Intrigue & Shadows)">음모와 암계 (Intrigue & Shadows) - 비밀 파벌, 독살과 권모술수</option>
                  </select>
                </div>
              </div>
            )}

            <div className={styles.fieldRow}>
              <label className={styles.fieldLabel}>시작 위치:</label>
              <input type="text" name="startLocation" className={styles.inputField} placeholder="입력" value={formData.startLocation} onChange={handleChange} />
            </div>
            <div className={styles.fieldRow} style={{ gridColumn: '1 / -1' }}>
              <label className={styles.fieldLabel}>추가 설정:</label>
              <input type="text" name="additionalSettings" className={styles.inputField} placeholder="입력" value={formData.additionalSettings} onChange={handleChange} />
            </div>
          </div>
        )}

        {/* 3단계: 초기 능력치 설정 */}
        {currentStep === 3 && (
          <div className={styles.fieldsGrid} style={{ display: 'flex', flexDirection: 'column', maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ color: 'var(--gold-accent)', fontSize: '1.4rem', marginBottom: '5px' }}>초기 능력치 설정</h2>
                {!customStatsMode && <div style={{ color: 'var(--text-muted)' }}>스탯을 룰북에 맞게 분배해주세요.</div>}
              </div>
              <button className={styles.actionBtn} style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={() => setCustomStatsMode(!customStatsMode)}>
                {customStatsMode ? '정형화 모드로 전환 🔄' : '자유 입력 모드로 전환 🔄'}
              </button>
            </div>

            {customStatsMode ? (
              <textarea name="stats" className={styles.inputField} placeholder="무력: 50, 지력: 50..." value={formData.stats} onChange={handleChange} style={{ height: '300px', resize: 'vertical' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                    <h3 style={{ color: 'var(--text-main)', margin: 0 }}>[선천 능력치]</h3>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>남은 포인트: <span style={{ color: remainingInnatePoints >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold' }}>{remainingInnatePoints}</span> / {totalInnatePoints}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    {innateStatsList.map(stat => (
                      <div key={stat} style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                        <div style={{ width: '80px', fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.9rem' }}>{stat}</div>
                        <div style={{ flex: 1, margin: '0 15px', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', position: 'relative' }}>
                          <div style={{ width: `${statsData[stat]}%`, height: '100%', background: 'var(--gold-accent)', borderRadius: '4px', transition: 'width 0.2s' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <button onClick={() => handleStatChange(stat, -1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer' }}>-</button>
                          <input 
                            type="number" 
                            min="0" max="100" 
                            value={statsData[stat] === 0 ? 0 : (statsData[stat] || '')} 
                            onChange={(e) => handleStatInput(stat, e.target.value)} 
                            style={{ width: '40px', textAlign: 'center', fontWeight: 'bold', color: 'var(--gold-hover)', fontSize: '0.9rem', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.2)', outline: 'none', WebkitAppearance: 'none' }} 
                          />
                          <button onClick={() => handleStatChange(stat, 1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                    <h3 style={{ color: 'var(--text-main)', margin: 0 }}>[후천 능력치]</h3>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>남은 포인트: <span style={{ color: remainingAcquiredPoints >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold' }}>{remainingAcquiredPoints}</span> / {totalAcquiredPoints}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    {acquiredStatsList.map(stat => (
                      <div key={stat} style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                        <div style={{ width: '80px', fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.9rem' }}>{stat}</div>
                        <div style={{ flex: 1, margin: '0 15px', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', position: 'relative' }}>
                          <div style={{ width: `${statsData[stat]}%`, height: '100%', background: 'var(--gold-accent)', borderRadius: '4px', transition: 'width 0.2s' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <button onClick={() => handleStatChange(stat, -1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer' }}>-</button>
                          <input 
                            type="number" 
                            min="0" max="100" 
                            value={statsData[stat] === 0 ? 0 : (statsData[stat] || '')} 
                            onChange={(e) => handleStatInput(stat, e.target.value)} 
                            style={{ width: '40px', textAlign: 'center', fontWeight: 'bold', color: 'var(--gold-hover)', fontSize: '0.9rem', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.2)', outline: 'none', WebkitAppearance: 'none' }} 
                          />
                          <button onClick={() => handleStatChange(stat, 1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4단계: 시작 특성 설정 */}
        {currentStep === 4 && (
          <div className={styles.fieldsGrid} style={{ display: 'flex', flexDirection: 'column', maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: 'var(--gold-accent)', fontSize: '1.4rem', marginBottom: '5px' }}>시작 특성 설정</h2>
              <button className={styles.actionBtn} style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={() => setCustomTraitsMode(!customTraitsMode)}>
                {customTraitsMode ? '정형화 모드로 전환 🔄' : '자유 입력 모드로 전환 🔄'}
              </button>
            </div>

            {customTraitsMode ? (
              <textarea name="traits" className={styles.inputField} placeholder="예: [신체특성] 다혈질, [전문특성] 뛰어난 검술" value={formData.traits} onChange={handleChange} style={{ height: '300px', resize: 'vertical' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {Object.entries(traitCategories).map(([category, predefinedTraits]) => (
                  <div key={category} style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                    <h3 style={{ color: 'var(--text-main)', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>[{category}]</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                      {Array.from(new Set([...predefinedTraits, ...(selectedTraits[category] || [])])).map(trait => {
                        const isSelected = (selectedTraits[category] || []).includes(trait);
                        return (
                          <div 
                            key={trait} 
                            onClick={() => toggleTrait(category, trait)}
                            style={{ 
                              padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s',
                              border: isSelected ? '1px solid var(--gold-accent)' : '1px solid rgba(255,255,255,0.2)',
                              background: isSelected ? 'rgba(212,175,55,0.2)' : 'rgba(0,0,0,0.5)',
                              color: isSelected ? 'var(--gold-hover)' : 'var(--text-muted)'
                            }}
                          >
                            {trait}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input 
                        type="text" 
                        placeholder={`${category} 직접 추가...`} 
                        className={styles.inputField} 
                        style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                        value={customTraitInputs[category] || ''}
                        onChange={(e) => setCustomTraitInputs(prev => ({...prev, [category]: e.target.value}))}
                        onKeyDown={(e) => e.key === 'Enter' && handleCustomTraitAdd(category)}
                      />
                      <button className={styles.actionBtn} style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => handleCustomTraitAdd(category)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className={styles.instruction} style={{ marginTop: '20px' }}>
              추천 설정을 클릭하시면 AI가 설정된 기본 정보를 바탕으로 적절한 능력치와 특성을 자동 배분해드립니다.
            </div>
          </div>
        )}

        <div className={styles.buttonContainer}>
          {currentStep > 1 && (
            <button className={styles.actionBtn} style={{flex: 1}} onClick={() => setCurrentStep(prev => prev - 1)}>이전</button>
          )}
          
          {currentStep < 4 ? (
            <button className={`${styles.actionBtn} ${styles.primaryBtn}`} style={{flex: 1}} onClick={() => setCurrentStep(prev => prev + 1)}>다음 단계</button>
          ) : (
            <>
              <button className={styles.actionBtn} style={{flex: 1, background: isRecommending ? 'rgba(255,255,255,0.1)' : 'var(--panel-bg)'}} onClick={handleRecommend} disabled={isRecommending}>
                {isRecommending ? "세계 구성 중... ⏳" : "AI 추천 설정 🎲"}
              </button>
              <button className={`${styles.actionBtn} ${styles.primaryBtn}`} style={{flex: 2}} onClick={handleStart} disabled={isValidating}>
                {isValidating ? "역사적 고증 검증 중... ⏳" : "새로운 역사 시작하기"}
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
