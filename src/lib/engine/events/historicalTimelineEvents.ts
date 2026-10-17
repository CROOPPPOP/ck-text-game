import { EngineGameEvent } from '../types';
import { ParsedState } from '../../parser';
import { detectPlayerArchetype } from '../../ckVisuals';

/**
 * 날짜 문자열에서 연도 파싱
 */
function getYearFromDate(dateStr?: string): number {
  if (!dateStr) return 1066;
  const m = dateStr.match(/(\d+)년/);
  return m ? parseInt(m[1], 10) : 1066;
}

export const HISTORICAL_TIMELINE_EVENTS: EngineGameEvent[] = [
  // 1-1. [1066년 헤이스팅스 전투 - 소작농 시점: 군량미 및 장정 징발]
  {
    id: 'hist_hastings_1066_peasant',
    category: 'historical',
    title: '노르만 원정 군량 징발령',
    historicalTag: '📜 역사적 대사건: 1066년 노르만 정복의 여파 (소작농 시점)',
    narrativeTemplate: `도버 해협 너머에서 전쟁이 터졌다는 소식이 마을에 전해집니다.
바다 건너 잉글랜드를 정복하겠다며 영주의 집사관들이 무장 병력을 이끌고 흙먼지를 일으키며 들이닥쳤습니다.
집집마다 돌아다니며 가을 추수한 밀과 보리, 군마로 징발할 가축을 샅샅이 뒤지고 있으며, 거역하는 소작인들에게는 가차 없이 채찍질이 가해집니다.`,
    dialogueSpeaker: '영주 장원 집사관 기욤',
    dialogueText: '"공작 전하의 잉글랜드 원정 군량이 모자란다! 가솔마다 곡식 두 포대와 장정 한 명씩을 공출해라! 거역하는 자는 교수대에 매달릴 것이다!"',
    trigger: (state: ParsedState) => {
      const year = getYearFromDate(state.dateLocation);
      return year >= 1066 && year <= 1068 && detectPlayerArchetype(state) === 'peasant';
    },
    weight: 950,
    choices: [
      {
        id: 'hastings_peasant_hide_grain',
        text: '숨겨둔 곡식을 내어놓지 않고 숲속 비밀 저장 구덩이에 감춘다.',
        probability: '75% (생존 계책)',
        groupType: '생존적 선택',
        resolve: () => ({
          narrativeOutcome: '집사관의 눈을 피해 곡식 두 포대를 숲속 구덩이에 안전하게 숨겼습니다. 굶주림을 면할 식량을 지켜냈습니다.',
          judgmentResult: '성공',
          positiveFactor: '겨울나기 식량 및 비상금 보존',
          resourceChanges: { gold: 10, prestige: 5 }
        })
      },
      {
        id: 'hastings_peasant_petition',
        text: '마을 어르신들과 함께 무릎 꿇고 처지를 호소하며 조세 감면을 청원한다.',
        probability: '60% (외교 청원)',
        groupType: '외교적 선택',
        resolve: () => ({
          narrativeOutcome: '간절한 호소 끝에 집사관이 마지못해 공출량을 절반으로 깎아주었습니다. 마을 주민들이 당신의 용기를 칭송합니다.',
          judgmentResult: '성공',
          positiveFactor: '마을 사람들의 두터운 신망 획득',
          resourceChanges: { prestige: 25, piety: 10 },
          relationDelta: { name: '마을 주민 자치회', delta: 30 }
        })
      },
      {
        id: 'hastings_peasant_volunteer_wagon',
        text: '보급 마차 수송대로 차출을 자원하여 군마 관리와 전장 수송을 돕는다.',
        probability: '80% (신분 상승의 기회)',
        groupType: '기량적 선택',
        resolve: () => ({
          narrativeOutcome: '보급 마차를 성실히 몰아 노르만 보급선 유지에 공을 세웠습니다. 기사단 호위병으로 눈도장을 찍었습니다.',
          judgmentResult: '대성공',
          positiveFactor: '영주 기사단의 신임 및 수송 삯 획득',
          resourceChanges: { gold: 15, prestige: 20 },
          traitsToAdd: ['기마 보급원']
        })
      }
    ]
  },

  // 1-2. [1066년 헤이스팅스 전투 - 방랑자 시점: 원정 용병 계약]
  {
    id: 'hist_hastings_1066_wanderer',
    category: 'historical',
    title: '헤이스팅스 원정대 용병 모집',
    historicalTag: '📜 역사적 대사건: 1066년 노르만 정복 (방랑자 시점)',
    narrativeTemplate: `루앙과 플랑드르 전역의 주막마다 노르망디 공작 윌리엄의 원정 용병 모집 깃발이 나붙었습니다.
잉글랜드의 비옥한 토지와 은화 주머니가 약속되자, 각지의 낭인과 모험가들이 도버 해협 항구로 구름처럼 몰려들고 있습니다.`,
    dialogueSpeaker: '용병 모집관 보두앵',
    dialogueText: '"칼자루를 쥘 힘만 있다면 누구든 환영한다! 잉글랜드의 왕관과 전리품이 우리를 부른다!"',
    trigger: (state: ParsedState) => {
      const year = getYearFromDate(state.dateLocation);
      return year >= 1066 && year <= 1068 && detectPlayerArchetype(state) === 'wanderer';
    },
    weight: 950,
    choices: [
      {
        id: 'hastings_wanderer_enlist',
        text: '선수금을 받고 노르만 원정 용병대에 계약병으로 참전한다.',
        probability: '75% (무예 시험)',
        groupType: '군사적 선택',
        resolve: () => ({
          narrativeOutcome: '도버 해협을 건너 치열한 전투 끝에 살아남았으며, 쏠쏠한 전리품과 참전 명성을 챙겼습니다.',
          judgmentResult: '성공',
          positiveFactor: '실전 무예 단련 및 전리품 획득',
          resourceChanges: { gold: 30, prestige: 25 },
          traitsToAdd: ['노르만 참전 용사']
        })
      },
      {
        id: 'hastings_wanderer_convoy',
        text: '전란을 피해 내륙으로 피난하는 상인 대상단의 호위 용병을 맡는다.',
        probability: '90% (실리적 계약)',
        groupType: '경호적 선택',
        resolve: () => ({
          narrativeOutcome: '가도에서 만난 도적 떼를 격퇴하고 상단을 무사히 호위하여 후한 보수를 받았습니다.',
          judgmentResult: '성공',
          positiveFactor: '대상단의 신뢰 및 호위 보수',
          resourceChanges: { gold: 20, prestige: 15 }
        })
      }
    ]
  },

  // 1-3. [1066년 헤이스팅스 전투 - 성직자 시점: 성전 깃발과 구호]
  {
    id: 'hist_hastings_1066_clergy',
    category: 'historical',
    title: '노르만 원정의 축성과 교단 회합',
    historicalTag: '📜 역사적 대사건: 1066년 노르만 정복 (성직자 시점)',
    narrativeTemplate: `교황 성좌께서 윌리엄 공작에게 보낸 축성 깃발 아래 잉글랜드 교구의 대대적인 개편이 시작되었습니다.
로마의 특사들이 교구 회의를 소집하여 전몰자 위령 미사와 성금 헌납을 독려하고 있습니다.`,
    dialogueSpeaker: '대주교 특사 신부',
    dialogueText: '"성좌의 축복 아래 잉글랜드 교회가 새롭게 거듭나고 있습니다. 우리 교구도 신앙의 등불을 밝혀야 합니다."',
    trigger: (state: ParsedState) => {
      const year = getYearFromDate(state.dateLocation);
      return year >= 1066 && year <= 1068 && detectPlayerArchetype(state) === 'clergy';
    },
    weight: 950,
    choices: [
      {
        id: 'hastings_clergy_mass',
        text: '교구 신도들과 함께 승전 감사 미사를 집전하고 성금을 봉헌한다.',
        probability: '90% (신앙의 길)',
        groupType: '종교적 선택',
        resolve: () => ({
          narrativeOutcome: '성도들의 기도를 모아 엄숙한 미사를 올렸으며, 교단 고위 성직자들의 각별한 칭송을 받았습니다.',
          judgmentResult: '대성공',
          positiveFactor: '교단 내 발언권 신장',
          resourceChanges: { piety: 40, prestige: 25 }
        })
      },
      {
        id: 'hastings_clergy_shelter',
        text: '전쟁으로 가족을 잃은 피난민들을 위해 수도원 구호소를 개방한다.',
        probability: '95% (자비의 길)',
        groupType: '민생적 선택',
        resolve: () => ({
          narrativeOutcome: '굶주린 피난민들에게 보리죽과 약초를 베풀어 영민들의 깊은 존경을 한 몸에 받았습니다.',
          judgmentResult: '대성공',
          positiveFactor: '지역 민중의 성자 칭송',
          resourceChanges: { piety: 50, prestige: 20 },
          relationDelta: { name: '지역 빈민 자치회', delta: 40 }
        })
      }
    ]
  },

  // 1-4. [1066년 헤이스팅스 전투 - 봉건 영주 시점]
  {
    id: 'hist_hastings_1066_noble',
    category: 'historical',
    title: '노르만 정복과 헤이스팅스 전투의 파고',
    historicalTag: '📜 역사적 대사건: 1066년 노르만 정복 (봉건 영주 시점)',
    narrativeTemplate: `도버 해협을 건너온 전령이 거친 숨을 몰아쉬며 루앙과 파리를 뒤흔든 소식을 전합니다.
노르망디 공작 윌리엄이 헤이스팅스 벌판에서 해럴드 고드윈슨의 잉글랜드 군대를 격파하고 런던으로 진군하고 있습니다.
프랑스 북부와 플랑드르 전역의 제후들이 이 거대한 정복의 물결 앞에서 새로운 정략혼과 용병 계약을 저울질하고 있습니다.`,
    dialogueSpeaker: '노르만 기마 전령',
    dialogueText: '"공작 전하께서 바요의 성유물 위에 맹세하신 대로 잉글랜드의 왕관을 차지하셨습니다! 국경 제후들의 입장 표명이 시급합니다!"',
    trigger: (state: ParsedState) => {
      const year = getYearFromDate(state.dateLocation);
      return year >= 1066 && year <= 1068 && (detectPlayerArchetype(state) === 'noble' || detectPlayerArchetype(state) === 'company');
    },
    weight: 950,
    choices: [
      {
        id: 'hastings_support_norman',
        text: '정복왕 윌리엄의 노르만 원정대에 보급 마차와 기사를 급파하여 후원한다.',
        probability: '85% (외교적 기회)',
        groupType: '외교적 선택',
        resolve: () => ({
          narrativeOutcome: '귀하의 기사들이 도버 항구의 방비에 기여하여, 새 잉글랜드 왕국과의 국경 무역 특허를 획득했습니다.',
          judgmentResult: '대성공',
          positiveFactor: '정복왕 윌리엄의 각별한 신임 획득',
          resourceChanges: { gold: 45, prestige: 40 },
          relationDelta: { name: '노르망디 공국 (잉글랜드 왕가)', delta: 35 }
        })
      },
      {
        id: 'hastings_exploit_vacuum',
        text: '윌리엄의 주력이 바다를 건넌 틈을 타 인근 국경 지대의 영지 명분을 날조한다.',
        probability: '70% (모험적 계책)',
        groupType: '계책적 선택',
        resolve: () => ({
          narrativeOutcome: '영주들이 바다 건너 전투에 정신이 팔린 틈을 타, 합법적인 교구 토지 양도 문서를 위조해 국경 요충지를 확보했습니다.',
          judgmentResult: '성공',
          positiveFactor: '기습적인 영토 명분 확보',
          resourceChanges: { gold: 25, prestige: 15 },
          relationDelta: { name: '이웃 남작령 (국경 제후)', delta: -25 }
        })
      },
      {
        id: 'hastings_stay_vigilant',
        text: '성채의 방벽을 점검하고 피난민과 무역상들에게 안전 통행세를 징수한다.',
        probability: '95% (실리적 내정)',
        groupType: '내정적 선택',
        resolve: () => ({
          narrativeOutcome: '해협의 전란을 피해 몰려든 대상단들로부터 안전 통행세를 거두어 영지 재정을 충실히 불렸습니다.',
          judgmentResult: '성공',
          positiveFactor: '전쟁 특수 무역 통행세 수입',
          resourceChanges: { gold: 60, prestige: 10 }
        })
      }
    ]
  },

  // 2. [1077년 카노사의 굴욕 - 서임권 대충돌]
  {
    id: 'hist_canossa_1077',
    category: 'historical',
    title: '카노사의 굴욕과 서임권 투쟁',
    historicalTag: '📜 역사적 대사건: 1077년 카노사의 굴욕 (Humiliation of Canossa)',
    narrativeTemplate: `눈 덮인 아펜니노 산맥 카노사 성채 앞, 신성로마제국 황제 하인리히 4세가 삼베옷을 입고 맨발로 사흘째 참회의 눈물을 흘리고 있습니다.
교황 그레고리오 7세의 파문 앞에 굴복한 황제의 모습은 전 유럽을 경악에 빠뜨렸습니다.
세속 군주와 로마 성좌 중 어느 깃발 아래 서야 할지, 영지 내 주교와 기사들이 숨을 죽이고 각하의 결단을 기다립니다.`,
    dialogueSpeaker: '교황청 특사 안셀모',
    dialogueText: '"황제조차 성좌의 지팡이 앞에 굴복하셨습니다. 각하의 영지 역시 사도 베드로의 권위 아래 무릎 꿇으실 것입니까?"',
    trigger: (state: ParsedState) => {
      const year = getYearFromDate(state.dateLocation);
      return year >= 1076 && year <= 1078;
    },
    weight: 960,
    choices: [
      {
        id: 'canossa_obey_pope',
        text: '교황 성좌에 충성을 맹세하고 영지 내 사제 서임권을 교회에 온전히 일임한다.',
        probability: '90% (신앙의 길)',
        groupType: '종교적 선택',
        resolve: () => ({
          narrativeOutcome: '로마 성좌로부터 전폭적인 축복장을 하사받아 가문의 정통성이 드높아졌으며, 파문 위험이 완전히 불식되었습니다.',
          judgmentResult: '대성공',
          positiveFactor: '교황청 공인 독실한 가문 서임',
          resourceChanges: { piety: 75, papalFavor: 45, excommunicationRisk: -60, prestige: 25 },
          relationDelta: { name: '로마 교황청 (성좌)', delta: 40 }
        })
      },
      {
        id: 'canossa_support_emperor',
        text: '하인리히 4세 황제의 편에 서서 영지 내 주교 서임권과 성당 십일조 세수를 지킨다.',
        probability: '65% (세속적 실리)',
        groupType: '정치적 선택',
        resolve: () => ({
          narrativeOutcome: '영지 내 성당 십일조 전액을 가문 국고로 회수하여 막대한 금화를 확보했으나, 로마 성좌의 요주의 명부에 등재되었습니다.',
          judgmentResult: '성공',
          positiveFactor: '영지 종교 조세권 독점 확보',
          negativeFactor: '교황청 호감도 급랭 및 파문 경고',
          resourceChanges: { gold: 90, papalFavor: -35, excommunicationRisk: 40, prestige: 20 },
          relationDelta: { name: '신성 로마 제국 황제파', delta: 30 }
        })
      },
      {
        id: 'canossa_reform_estate',
        text: '중립을 지키며 수도원 필사실과 도서관을 증축해 학문적 중재안을 모색한다.',
        probability: '80% (학문적 중립)',
        groupType: '학습적 선택',
        resolve: () => ({
          narrativeOutcome: '영지 수도원을 중립 학문의 거점으로 육성하여 고위 성직자들과 제후들의 신망을 동시에 얻었습니다.',
          judgmentResult: '성공',
          positiveFactor: '학문적 명성과 외교적 중재력',
          resourceChanges: { piety: 35, prestige: 35, gold: -20 }
        })
      }
    ]
  },

  // 3. [1095년 클레르몽 공의회 - 제1차 십자군 성전]
  {
    id: 'hist_crusade_1095',
    category: 'historical',
    title: '클레르몽 공의회와 대십자군 선포',
    historicalTag: '📜 역사적 대사건: 1095년 제1차 십자군 (First Crusade)',
    narrativeTemplate: `교황 우르바노 2세의 외침이 클레르몽 벌판을 가득 메운 수만 명의 군중 위로 천둥처럼 내리꽂힙니다.
"신께서 그것을 바라신다(Deus vult)!"
동방의 비잔티움 제국을 구원하고 예루살렘 성묘를 해방하기 위해, 유럽 전역의 기사와 농민들이 옷 위에 붉은 천 십자가를 꿰매고 있습니다.
영지의 가신들과 백성들 역시 성전의 열풍에 휩싸여 있습니다.`,
    dialogueSpeaker: '십자군 순례 수도사',
    dialogueText: '"예루살렘의 성묘가 이교도의 손에 신음하고 있습니다! 십자가를 쥐고 성전에 나서십시오, 각하!"',
    trigger: (state: ParsedState) => {
      const year = getYearFromDate(state.dateLocation);
      return year >= 1095 && year <= 1098;
    },
    weight: 980,
    choices: [
      {
        id: 'crusade_take_cross',
        text: '가문의 기사들과 징집병을 이끌고 성전(Crusade)에 직접 참전한다.',
        probability: '75% (영광과 위험)',
        groupType: '군사적 선택',
        resolve: () => ({
          narrativeOutcome: '가문의 깃발 아래 정예 기사들이 레반트로 출정했습니다. 전 기독교 세계에 가문의 무명과 신앙이 드높아졌습니다.',
          judgmentResult: '대성공',
          positiveFactor: '십자군 원정군 결성 및 무훈',
          resourceChanges: { manpower: -40, gold: -50, prestige: 130, piety: 110, papalFavor: 50 },
          traitsToAdd: ['십자군 전사 (Crusader)']
        })
      },
      {
        id: 'crusade_fund_holy_see',
        text: '직접 출정 대신 막대한 군자금과 식량을 성좌에 헌납하고 대사면을 받는다.',
        probability: '90% (안전한 신앙)',
        groupType: '재정적 선택',
        resolve: () => ({
          narrativeOutcome: '원정군을 위한 군자금을 교황청에 기탁하여 대사면령(Indulgence)을 획득하고 영지 내 민심을 크게 결속시켰습니다.',
          judgmentResult: '성공',
          positiveFactor: '교황청 공식 대사면 획득',
          resourceChanges: { gold: -50, piety: 85, papalFavor: 35 }
        })
      },
      {
        id: 'crusade_profit_trade',
        text: '성전군에게 판매할 무기와 군마, 건포도 보급 계약을 맺어 막대한 이문을 남긴다.',
        probability: '85% (상업적 기회)',
        groupType: '경제적 선택',
        resolve: () => ({
          narrativeOutcome: '출정 기사들에게 무구와 말굽을 판매하는 보급 계약을 독점하여 영지 국고를 황금으로 가득 채웠습니다.',
          judgmentResult: '대성공',
          positiveFactor: '성전 보급 물자 독점 상업 이익',
          resourceChanges: { gold: 120, piety: -15, prestige: 15 }
        })
      }
    ]
  },

  // 4. [1122년 보름스 협약 - 성속 타협]
  {
    id: 'hist_worms_1122',
    category: 'historical',
    title: '보름스 협약과 서임권 타협의 시대',
    historicalTag: '📜 역사적 대사건: 1122년 보름스 협약 (Concordat of Worms)',
    narrativeTemplate: `반세기에 걸친 교황과 황제의 처절한 대립 끝에 라인강변 보름스에서 마침내 역사적인 평화 협약이 조인되었습니다.
주교에게 영적 권능(반지와 지팡이)은 교회가, 세속 영지(홀)는 군주가 수여한다는 이중 서임의 타협안이 전 유럽의 영주들에게 하달되었습니다.
세속 법정과 교회 법정의 관할권을 둘러싼 새로운 권력 재편이 영지에서 시작됩니다.`,
    dialogueSpeaker: '법학자 기욤 드 보름스',
    dialogueText: '"이제 성과 속의 경계가 분명해졌습니다. 각하의 영지 내 법률 조례를 정비할 절호의 기회입니다."',
    trigger: (state: ParsedState) => {
      const year = getYearFromDate(state.dateLocation);
      return year >= 1121 && year <= 1124;
    },
    weight: 920,
    choices: [
      {
        id: 'worms_codify_laws',
        text: '영지 내 세속 재판권을 확립하고 성직자 과세 규정을 법전화한다.',
        probability: '80% (행정 개혁)',
        groupType: '행정적 선택',
        resolve: () => ({
          narrativeOutcome: '합리적인 영지 법률 체계를 정비하여 행정력과 세수를 영구적으로 향상시켰습니다.',
          judgmentResult: '대성공',
          positiveFactor: '보름스 체제에 입각한 합법적 영지 법전 완성',
          resourceChanges: { gold: 50, prestige: 30, legitimacy: 25 }
        })
      },
      {
        id: 'worms_court_bishop',
        text: '교구 주교에게 영지 의회 의석을 부여하고 협력 관계를 공고히 한다.',
        probability: '90% (정치적 화합)',
        groupType: '외교적 선택',
        resolve: () => ({
          narrativeOutcome: '주교와 영주가 손을 잡아 영지 치안과 민심이 안정되고 교회의 지지를 확보했습니다.',
          judgmentResult: '성공',
          positiveFactor: '교구 주교와의 견고한 상호 불가침 동맹',
          resourceChanges: { piety: 40, prestige: 20 }
        })
      },
      {
        id: 'worms_expand_chancery',
        text: '양피지 문서고와 공증인 길드를 설립하여 영지 계약 행정을 독점한다.',
        probability: '85% (제도적 구축)',
        groupType: '학습적 선택',
        resolve: () => ({
          narrativeOutcome: '정교한 계약 문서 관리를 통해 상인들과 자유민들의 신뢰를 얻고 공증 수수료를 징수했습니다.',
          judgmentResult: '성공',
          positiveFactor: '영지 공증 문서고 설립',
          resourceChanges: { gold: 35, prestige: 25 }
        })
      }
    ]
  },

  // 5. [1152년 아키텐의 엘레오노르와 앙주 제국의 태동]
  {
    id: 'hist_eleanor_1152',
    category: 'historical',
    title: '아키텐의 엘레오노르와 정략혼의 대지각변동',
    historicalTag: '📜 역사적 대사건: 1152년 엘레오노르 정략혼과 플랜태저넷 제국의 태동',
    narrativeTemplate: `프랑스 국왕 루이 7세와의 이혼 직후, 유럽 최고의 상속녀 아키텐의 엘레오노르가 노르망디 공작 헨리 플랜태저넷(훗날의 헨리 2세)과 전격 재혼했습니다!
피레네산맥에서 스코틀랜드 국경에 이르는 거대한 '앙주 제국'이 태동하며, 프랑스 전역의 제후들이 카페 왕가와 앙주 가문 사이에서 줄서기를 강요받고 있습니다.`,
    dialogueSpeaker: '남프랑스 트루바두르 시인',
    dialogueText: '"아키텐의 태양이 노르망디의 표범과 만났습니다! 대륙의 균형이 무너지고 있습니다, 각하!"',
    trigger: (state: ParsedState) => {
      const year = getYearFromDate(state.dateLocation);
      return year >= 1151 && year <= 1154;
    },
    weight: 930,
    choices: [
      {
        id: 'eleanor_ally_angevin',
        text: '급부상하는 앙주 가문(헨리 2세)과 비밀 친선 맹약을 맺고 서부 무역로를 튼다.',
        probability: '75% (신흥 패권 편승)',
        groupType: '외교적 선택',
        resolve: () => ({
          narrativeOutcome: '플랜태저넷 제국의 보르도 포도주 무역 특권을 얻어 영지 재정이 급팽창했습니다.',
          judgmentResult: '대성공',
          positiveFactor: '앙주 제국과의 독점 포도주 교역권 확보',
          resourceChanges: { gold: 80, prestige: 40 },
          relationDelta: { name: '플랜태저넷 가문 (잉글랜드 왕가)', delta: 35 }
        })
      },
      {
        id: 'eleanor_loyalty_capet',
        text: '카페 왕가의 파리 궁정에 충성을 재확인하고 프랑스 국왕의 직속 은혜를 청원한다.',
        probability: '85% (전통적 충성)',
        groupType: '정치적 선택',
        resolve: () => ({
          narrativeOutcome: '루이 7세로부터 왕실 칙허장과 귀족 서열 승격을 약조받아 정통성을 다졌습니다.',
          judgmentResult: '성공',
          positiveFactor: '프랑스 왕실 직속 후원자 지위 확보',
          resourceChanges: { prestige: 55, legitimacy: 30 },
          relationDelta: { name: '프랑스 카페 왕가', delta: 40 }
        })
      },
      {
        id: 'eleanor_invite_troubadours',
        text: '남프랑스의 궁정 풍류와 트루바두르 음유시인들을 영지에 대거 초빙한다.',
        probability: '90% (궁정 문화 융성)',
        groupType: '문화적 선택',
        resolve: () => ({
          narrativeOutcome: '기사도 문학과 궁정 연애 시가 영지에 만발하여 유럽 귀족들의 찬사를 한 몸에 받았습니다.',
          judgmentResult: '대성공',
          positiveFactor: '궁정 품격(Grandeur) 및 문화적 위상 폭증',
          resourceChanges: { prestige: 60, gold: -25 }
        })
      }
    ]
  },

  // 6. [1189년 제3차 십자군 - 사자심왕 리처드와 살라딘]
  {
    id: 'hist_crusade3_1189',
    category: 'historical',
    title: '제3차 십자군과 사자심왕의 출정',
    historicalTag: '📜 역사적 대사건: 1189년 제3차 십자군 (Third Crusade)',
    narrativeTemplate: `하틴 전투에서 예루살렘 왕국이 괴멸하고 살라딘이 성도를 탈환했다는 비보가 유럽을 뒤흔듭니다!
신성로마황제 프리드리히 바르바로사, 프랑스왕 필리프 2세, 그리고 잉글랜드의 사자심왕 리처드가 역사상 유례없는 제왕 십자군을 결성했습니다.
영지마다 '살라딘 십일조'가 징수되고, 대제후들이 전장으로 향하고 있습니다.`,
    dialogueSpeaker: '성전 기사단 순찰관',
    dialogueText: '"살라딘의 군단이 예루살렘을 포위했습니다! 각하, 사자심왕의 깃발 아래 집결하십시오!"',
    trigger: (state: ParsedState) => {
      const year = getYearFromDate(state.dateLocation);
      return year >= 1189 && year <= 1192;
    },
    weight: 970,
    choices: [
      {
        id: 'crusade3_join_richard',
        text: '사자심왕 리처드의 직속 기병대로 참전하여 야파와 아크레 공성전에 뛰어든다.',
        probability: '70% (맹장의 길)',
        groupType: '군사적 선택',
        resolve: () => ({
          narrativeOutcome: '아크레 성벽 위에서 적기를 꺾고 살라딘 군단과의 교전에서 불멸의 무공을 세웠습니다.',
          judgmentResult: '대성공',
          positiveFactor: '사자심왕 리처드와 함께한 전설적 무훈',
          resourceChanges: { prestige: 150, piety: 90, gold: -40, manpower: -30 },
          traitsToAdd: ['용맹한 기사 (Valiant Knight)']
        })
      },
      {
        id: 'crusade3_buy_pledged_lands',
        text: '원정 자금이 궁한 출정 귀족들의 저당 잡힌 장원과 영지를 헐값에 매입한다.',
        probability: '85% (냉혹한 실리)',
        groupType: '경제적 선택',
        resolve: () => ({
          narrativeOutcome: '원정을 떠난 이웃 영주들의 토지를 헐값에 흡수하여 영지 직할령 규모를 획기적으로 넓혔습니다.',
          judgmentResult: '대성공',
          positiveFactor: '십자군 매물 토지 합법적 병합',
          resourceChanges: { gold: -60, prestige: 20 }
        })
      },
      {
        id: 'crusade3_peace_negotiation',
        text: '동방의 살라딘 사절단과 비밀리에 접촉하여 향신료 및 비단 직수입로를 개척한다.',
        probability: '65% (동방 무역 도박)',
        groupType: '계책적 선택',
        resolve: () => ({
          narrativeOutcome: '레반트 무역상들과 비밀 회송 계약을 체결하여 진귀한 다마스쿠스 강철과 비단을 독점 수입했습니다.',
          judgmentResult: '성공',
          positiveFactor: '레반트 특산품 독점 수입권 획득',
          resourceChanges: { gold: 110, piety: -20 }
        })
      }
    ]
  },

  // 7. [1204년 제4차 십자군과 콘스탄티노플 약탈]
  {
    id: 'hist_crusade4_1204',
    category: 'historical',
    title: '제4차 십자군과 콘스탄티노플의 비극',
    historicalTag: '📜 역사적 대사건: 1204년 콘스탄티노플 함락과 라틴 제국',
    narrativeTemplate: `이슬람을 치러 떠난 제4차 십자군이 베네치아의 농간에 넘어가 기독교 제국의 수도 콘스탄티노플을 함락하고 약탈했습니다!
천년 로마 제국의 보물과 성유물, 고대 그리스 필사본들이 서유럽으로 쏟아져 들어오고 있습니다.
동방의 비잔티움 난민 귀족들과 진귀한 전리품들이 영지 국경에도 당도했습니다.`,
    dialogueSpeaker: '베네치아 상인 알비세',
    dialogueText: '"황금 뿔 만의 보물들이 경매에 나왔습니다. 황제의 옥새부터 하기아 소피아의 금잔까지, 각하의 것입니다."',
    trigger: (state: ParsedState) => {
      const year = getYearFromDate(state.dateLocation);
      return year >= 1203 && year <= 1206;
    },
    weight: 940,
    choices: [
      {
        id: 'crusade4_buy_relics',
        text: '약탈당해 흘러들어온 진귀한 성유물과 보석들을 매입해 가문 안치실을 장식한다.',
        probability: '80% (성유물 수집)',
        groupType: '종교적 선택',
        resolve: () => ({
          narrativeOutcome: '콘스탄티노플의 성십자가 파편을 영지에 봉헌하여 수많은 순례객과 신망을 끌어모았습니다.',
          judgmentResult: '대성공',
          positiveFactor: '제국 공인 성유물 안치 및 가문 위상 격상',
          resourceChanges: { piety: 80, prestige: 50, gold: -45 }
        })
      },
      {
        id: 'crusade4_shelter_scholars',
        text: '몰락한 비잔티움의 학자들과 기술자들을 영지에 영구 귀화시켜 중용한다.',
        probability: '90% (지식의 영입)',
        groupType: '학습적 선택',
        resolve: () => ({
          narrativeOutcome: '동로마의 선진 건축술과 행정 비전을 흡수하여 영지 발전도와 기술을 크게 도약시켰습니다.',
          judgmentResult: '대성공',
          positiveFactor: '동로마 최고 학자단 영입 및 영지 행정 혁신',
          resourceChanges: { prestige: 40, gold: -30 }
        })
      },
      {
        id: 'crusade4_condemn_sack',
        text: '동방 기독교 형제들에 대한 야만적 약탈을 준엄하게 규탄하여 도덕적 명망을 높인다.',
        probability: '85% (도덕적 명분)',
        groupType: '외교적 선택',
        resolve: () => ({
          narrativeOutcome: '성좌의 양심적인 추기경들로부터 진정한 기독교 군자라는 찬사를 받았습니다.',
          judgmentResult: '성공',
          positiveFactor: '기독교 평화주의자로서의 도덕적 명망',
          resourceChanges: { piety: 50, prestige: 35 }
        })
      }
    ]
  },

  // 8. [1215년 마그나 카르타 - 대헌장 서명]
  {
    id: 'hist_magna_carta_1215',
    category: 'historical',
    title: '러니미드 초원과 마그나 카르타(대헌장)',
    historicalTag: '📜 역사적 대사건: 1215년 마그나 카르타 (Magna Carta)',
    narrativeTemplate: `템스강변 러니미드 벌판에서 분노한 제후들이 실지왕 존에게 칼끝을 겨누며 '자유의 대헌장'에 서명할 것을 강요했습니다!
"국왕이라 할지라도 법 아래에 있으며, 귀족의 동의 없는 세금은 무효이다!"
왕권의 전횡에 맞선 이 봉건 귀족의 승리는 대륙의 제후들에게도 엄청난 파장을 불러일으키고 있습니다.`,
    dialogueSpeaker: '반란 귀족 대표 로버트',
    dialogueText: '"군주의 폭정에 마침표를 찍었습니다! 각하의 영지에서도 귀족의 권리와 자치를 선언하십시오!"',
    trigger: (state: ParsedState) => {
      const year = getYearFromDate(state.dateLocation);
      return year >= 1215 && year <= 1217;
    },
    weight: 950,
    choices: [
      {
        id: 'magna_support_barons',
        text: '봉건 귀족 헌장에 적극 찬동하여 영지 봉신들의 자치권을 보장하고 결속을 다진다.',
        probability: '85% (봉건 자치)',
        groupType: '정치적 선택',
        resolve: () => ({
          narrativeOutcome: '봉신들과 기사들의 충성도가 결집되어 내정이 안정되고 군사 동원력이 급상승했습니다.',
          judgmentResult: '대성공',
          positiveFactor: '봉신들의 진심 어린 지지와 충성 획득',
          resourceChanges: { prestige: 45, manpower: 30, legitimacy: 20 }
        })
      },
      {
        id: 'magna_support_crown',
        text: '왕권의 신성함을 옹호하며 분열을 책동하는 귀족들의 명단을 왕실에 밀고한다.',
        probability: '70% (왕권 결탁)',
        groupType: '계책적 선택',
        resolve: () => ({
          narrativeOutcome: '국왕으로부터 왕실 근위대 지원과 직할 영지 세금 감면 특혜를 하사받았습니다.',
          judgmentResult: '성공',
          positiveFactor: '왕실 직속 친위 세력 승격',
          resourceChanges: { gold: 70, prestige: 20 }
        })
      },
      {
        id: 'magna_charter_burghers',
        text: '귀족뿐만 아니라 영지 상인과 장인들에게도 독자적인 자치 칙허장(Charter)을 발급한다.',
        probability: '80% (도시 부흥)',
        groupType: '경제적 선택',
        resolve: () => ({
          narrativeOutcome: '자유 도시로 성장한 영지에 상인들이 몰려들어 시장 조세가 폭발적으로 증가했습니다.',
          judgmentResult: '대성공',
          positiveFactor: '상인 길드 자치 칙허를 통한 세수 증대',
          resourceChanges: { gold: 85, prestige: 25 }
        })
      }
    ]
  },

  // 9. [1241년 몽골 제국의 침공 - 레그니차 전투]
  {
    id: 'hist_mongol_1241',
    category: 'historical',
    title: '동방의 폭풍: 몽골 침공과 레그니차의 충격',
    historicalTag: '📜 역사적 대사건: 1241년 몽골의 유럽 침공 (Mongol Invasion of Europe)',
    narrativeTemplate: `바투와 수부타이가 이끄는 몽골 기마 군단이 러시아를 초토화하고 폴란드와 헝가리를 유린했습니다!
레그니차에서 슐레지엔 공작 하인리히와 튜턴 기사단이 전멸했다는 공포가 전 유럽을 엄습했습니다.
동유럽의 피난민들이 쏟아져 들어오며, 영지의 성채 방비를 총동원해야 할 비상시국입니다.`,
    dialogueSpeaker: '탈출한 폴란드 기사',
    dialogueText: '"그들은 인간이 아니라 지옥의 타르타로스에서 기어 나온 악마들입니다! 돌 성벽조차 불화살과 화포에 무너졌습니다!"',
    trigger: (state: ParsedState) => {
      const year = getYearFromDate(state.dateLocation);
      return year >= 1240 && year <= 1243;
    },
    weight: 980,
    choices: [
      {
        id: 'mongol_fortify_castle',
        text: '영지의 성채를 총동원해 석조 방벽을 높이고 해자를 깊게 파 농성 체제를 갖춘다.',
        probability: '90% (철통 요새화)',
        groupType: '군사적 선택',
        resolve: () => ({
          narrativeOutcome: '선제적인 요새화로 기마 군단의 침공 경로에서 완전히 안전지대로 거듭났습니다.',
          judgmentResult: '대성공',
          positiveFactor: '철통 성채 요새화 완비',
          resourceChanges: { gold: -50, prestige: 40, manpower: 20 }
        })
      },
      {
        id: 'mongol_hire_steppe_mercs',
        text: '피난해 온 쿠만족 및 동유럽 기마 궁수들을 가문의 직속 용병대로 고용한다.',
        probability: '75% (이민족 전력 흡수)',
        groupType: '군사적 선택',
        resolve: () => ({
          narrativeOutcome: '서유럽에서는 볼 수 없는 강력한 기마 궁술 편대를 직속 병력으로 확보했습니다.',
          judgmentResult: '대성공',
          positiveFactor: '정예 기마궁수단 영구 편제',
          resourceChanges: { manpower: 50, gold: -40 },
          traitsToAdd: ['기마 궁술 지휘관']
        })
      },
      {
        id: 'mongol_absorb_refugees',
        text: '폴란드·헝가리 피난 장인과 농민들을 영지에 정착시켜 개간 사업을 벌인다.',
        probability: '85% (인구 유입)',
        groupType: '내정적 선택',
        resolve: () => ({
          narrativeOutcome: '숙련된 동유럽 광부와 농민들이 유입되어 영지 인구와 개간지가 대폭 확충되었습니다.',
          judgmentResult: '성공',
          positiveFactor: '동유럽 피난민 대규모 영지 흡수 및 번영',
          resourceChanges: { gold: 30, prestige: 20 }
        })
      }
    ]
  },

  // 10. [1302년 아나니 사건과 1309년 아비뇽 유수]
  {
    id: 'hist_anagni_1302',
    category: 'historical',
    title: '아나니의 뺨따귀와 아비뇽 유수',
    historicalTag: '📜 역사적 대사건: 1302년 아나니 사건 & 1309년 아비뇽 유수 (Avignon Papacy)',
    narrativeTemplate: `프랑스 국왕 필리프 4세의 심복 기욤 드 노가레가 아나니 별장에서 교황 보니파시오 8세의 뺨을 치고 감금했습니다!
"교황의 권위는 국왕 위에 군림할 수 없다!"
성좌는 로마를 떠나 프랑스 아비뇽으로 옮겨졌으며, 교황청은 프랑스 왕가의 통제 아래 들어갔습니다.
기독교 세계의 정신적 축이 송두리째 흔들리고 있습니다.`,
    dialogueSpeaker: '아비뇽 교황청 서기관',
    dialogueText: '"베드로의 성좌가 론강가 아비뇽에 둥지를 틀었습니다. 각하께서는 어느 편의 사도직을 인정하시겠습니까?"',
    trigger: (state: ParsedState) => {
      const year = getYearFromDate(state.dateLocation);
      return year >= 1302 && year <= 1309;
    },
    weight: 960,
    choices: [
      {
        id: 'anagni_support_avignon',
        text: '아비뇽 교황청과 손잡고 프랑스 왕실의 환심을 사며 교회 십일조 면제를 얻는다.',
        probability: '80% (세속 권력 결탁)',
        groupType: '정치적 선택',
        resolve: () => ({
          narrativeOutcome: '아비뇽 교황으로부터 특별 면세 칙령을 획득하여 영지 재정을 대폭 불렸습니다.',
          judgmentResult: '대성공',
          positiveFactor: '아비뇽 교황청 특권 칙령 획득',
          resourceChanges: { gold: 95, prestige: 35, papalFavor: 40 }
        })
      },
      {
        id: 'anagni_defend_rome',
        text: '로마 전통 교황을 지지하며 교회의 세속 권력 예속화를 통렬히 비판한다.',
        probability: '70% (정통 신앙 수호)',
        groupType: '종교적 선택',
        resolve: () => ({
          narrativeOutcome: '독실한 정통 가톨릭 신도 제후들의 존경을 한 몸에 받으며 위신과 신앙을 드높였습니다.',
          judgmentResult: '성공',
          positiveFactor: '로마 정통 성좌 옹호자 명망',
          resourceChanges: { piety: 90, prestige: 45 }
        })
      },
      {
        id: 'anagni_tax_clergy',
        text: '혼란을 틈타 영지 내 모든 수도원과 성당에 세속 방위세를 부과한다.',
        probability: '75% (현실적 과세)',
        groupType: '행정적 선택',
        resolve: () => ({
          narrativeOutcome: '교회 재산에 대한 합법적 과세를 관철하여 영지 국고를 든든하게 채웠습니다.',
          judgmentResult: '성공',
          positiveFactor: '교회 자산 과세권 실력 행사',
          resourceChanges: { gold: 110, piety: -25 }
        })
      }
    ]
  },

  // 11. [1337년 백년전쟁 발발]
  {
    id: 'hist_hundred_years_1337',
    category: 'historical',
    title: '백년전쟁 발발: 프랑스 왕관을 둘러싼 대격돌',
    historicalTag: '📜 역사적 대사건: 1337년 백년전쟁 발발 (Hundred Years\' War)',
    narrativeTemplate: `잉글랜드 국왕 에드워드 3세가 카페 왕조의 단절을 이유로 프랑스 왕위 계승권을 공식 선포했습니다!
플랑드르 모직물 이권과 기엔 공국 영유권을 둘러싼 불꽃이 서유럽 전역을 불태우기 시작했습니다.
장궁병의 화살비와 돌격하는 기사단, 가도를 유린하는 루티에(도적 용병대)의 전란이 시작됩니다.`,
    dialogueSpeaker: '프랑스 왕실 기사단장',
    dialogueText: '"바다 건너 약탈자들이 우리 땅을 짓밟으려 합니다! 각하, 전열을 가다듬고 기사들을 소집하십시오!"',
    trigger: (state: ParsedState) => {
      const year = getYearFromDate(state.dateLocation);
      return year >= 1337 && year <= 1341;
    },
    weight: 970,
    choices: [
      {
        id: 'hundred_join_france',
        text: '프랑스 왕실 기사단에 합류하여 가문의 명예를 걸고 전선으로 출진한다.',
        probability: '75% (기사도의 길)',
        groupType: '군사적 선택',
        resolve: () => ({
          narrativeOutcome: '전선의 최선봉에서 적의 별동대를 격파하고 국왕으로부터 칭호와 하사금을 받았습니다.',
          judgmentResult: '대성공',
          positiveFactor: '백년전쟁 초기 전공 및 왕실 신임',
          resourceChanges: { prestige: 100, gold: 50, manpower: -25 },
          relationDelta: { name: '프랑스 발루아 왕가', delta: 40 }
        })
      },
      {
        id: 'hundred_adopt_longbow',
        text: '영지 평민들에게 장궁(Longbow)과 석궁 훈련을 의무화하여 방위군을 현대화한다.',
        probability: '85% (군제 개혁)',
        groupType: '군사적 선택',
        resolve: () => ({
          narrativeOutcome: '기사 중심의 구태의연한 전술에서 벗어나 막강한 평민 원거리 화력 편대를 완성했습니다.',
          judgmentResult: '대성공',
          positiveFactor: '영지 궁병 편제 현대화 완성',
          resourceChanges: { manpower: 40, gold: -30 }
        })
      },
      {
        id: 'hundred_arms_contractor',
        text: '양측 군대에 철제 무구와 군마, 곡물을 납품하는 군수 사업을 개시한다.',
        probability: '80% (군수 특수)',
        groupType: '경제적 선택',
        resolve: () => ({
          narrativeOutcome: '치솟는 무기 가격 속에 대장간과 제분소를 풀가동하여 막대한 전쟁 특수 이문을 챙겼습니다.',
          judgmentResult: '대성공',
          positiveFactor: '백년전쟁 군수 물자 독점 공급 이익',
          resourceChanges: { gold: 130, prestige: 10 }
        })
      }
    ]
  },

  // 12. [1347년 흑사병 대유행 - 검은 죽음]
  {
    id: 'hist_black_death_1347',
    category: 'historical',
    title: '검은 죽음(Black Death)의 상륙',
    historicalTag: '📜 역사적 대사건: 1347년 흑사병 대유행 (The Black Death)',
    narrativeTemplate: `크림반도의 카파와 제노바 무역선을 거쳐 지중해를 건너온 '검은 죽음'이 마침내 영지 국경에 도달했습니다.
림프절이 검게 부풀어 오르고 피를 토하며 사흘 만에 사망하는 괴질의 공포 앞에 가도와 교회가 마비되었습니다.
농민들은 밭을 버리고 도망치며, 사제들은 종부성사를 거부한 채 숨어버렸습니다. 영지 생존을 위한 특단의 조치가 필요합니다.`,
    dialogueSpeaker: '전속 의사 가브리엘',
    dialogueText: '"이 역병은 신의 천벌이거나 독기(Miasma)의 저주입니다! 성문을 걸어 잠그고 외부인과의 접촉을 전면 차단해야 합니다!"',
    trigger: (state: ParsedState) => {
      const year = getYearFromDate(state.dateLocation);
      return year >= 1347 && year <= 1351;
    },
    weight: 999,
    choices: [
      {
        id: 'black_death_quarantine',
        text: '성문을 굳게 걸어 잠그고 가도와 장원을 전면 봉쇄(격리)한다.',
        probability: '80% (냉혹한 봉쇄)',
        groupType: '생존적 선택',
        resolve: () => ({
          narrativeOutcome: '혹독한 영지 봉쇄와 외부 상인 추방을 통해 성내 가신들과 주민들의 감염을 기적적으로 막아냈습니다.',
          judgmentResult: '성공',
          positiveFactor: '철저한 검역 격리로 영주 일가 무사',
          negativeFactor: '무역 중단으로 인한 세수 격감',
          resourceChanges: { gold: -45, prestige: 30 }
        })
      },
      {
        id: 'black_death_pest_doctor',
        text: '사각 부리 가면을 쓴 전문 역병 의사를 초빙하고 정화 향료를 피운다.',
        probability: '70% (의학적 방역)',
        groupType: '의학적 선택',
        resolve: () => ({
          narrativeOutcome: '비니거 식초 세척과 약초 향료 방역으로 사망률을 절반으로 낮추고 백성들의 동요를 진정시켰습니다.',
          judgmentResult: '성공',
          positiveFactor: '조직적 역병 방역 체계 가동',
          resourceChanges: { gold: -35, piety: 35 }
        })
      },
      {
        id: 'black_death_raise_wages',
        text: '줄어든 농노들의 지대를 낮추고 품삯을 올려 살아남은 일손을 영지에 묶어둔다.',
        probability: '85% (선구적 노동 개혁)',
        groupType: '경제적 선택',
        resolve: () => ({
          narrativeOutcome: '노동력 부족 사태 속에서도 영지 농경지가 황폐화되지 않고 다른 영지의 유랑 농민들까지 흡수했습니다.',
          judgmentResult: '대성공',
          positiveFactor: '흑사병 이후 노동력 확보 선점',
          resourceChanges: { gold: 40, prestige: 35 }
        })
      }
    ]
  },

  // 13. [1453년 콘스탄티노플 함락과 르네상스의 여명]
  {
    id: 'hist_constantinople_1453',
    category: 'historical',
    title: '천년 로마의 황혼: 콘스탄티노플 함락과 르네상스',
    historicalTag: '📜 역사적 대사건: 1453년 콘스탄티노플 함락 & 백년전쟁 종결 (Fall of Constantinople)',
    narrativeTemplate: `오스만 제국의 술탄 메흐메트 2세가 거대한 거포(바실리크)로 콘스탄티노플의 테오도시우스 성벽을 무너뜨렸습니다!
마지막 황제 콘스탄티노스 11세가 성벽에서 장렬히 전사하며 동로마 천년 제국이 종막을 고했습니다.
같은 해 프랑스에서는 백년전쟁이 종결되었으며, 화포의 굉음과 고대 그리스 지식이 서유럽으로 유입되며 '르네상스'의 여명이 밝아옵니다.`,
    dialogueSpeaker: '인문주의 학자 니콜로',
    dialogueText: '"중세의 기사도는 저 거포의 포연 속으로 사라졌습니다. 이제 새로운 학문과 화약의 시대가 열렸습니다, 각하."',
    trigger: (state: ParsedState) => {
      const year = getYearFromDate(state.dateLocation);
      return year >= 1453;
    },
    weight: 999,
    choices: [
      {
        id: 'constantinople_patron_arts',
        text: '피난해 온 플라톤 아카데미 학자들을 후원하여 영지에 대학과 인쇄소를 설립한다.',
        probability: '85% (르네상스 선도)',
        groupType: '학습적 선택',
        resolve: () => ({
          narrativeOutcome: '고대 철학과 인쇄술의 메카로 거듭나 영지가 신시대 르네상스의 중심지로 떠올랐습니다.',
          judgmentResult: '대성공',
          positiveFactor: '르네상스 학문 및 인쇄술 혁명 선점',
          resourceChanges: { prestige: 150, gold: -40, legitimacy: 50 },
          traitsToAdd: ['르네상스 군주 (Renaissance Prince)']
        })
      },
      {
        id: 'constantinople_found_cannon',
        text: '포병 주조소를 건설하여 최신 청동 화포 부대를 창설한다.',
        probability: '80% (군사 혁신)',
        groupType: '군사적 선택',
        resolve: () => ({
          narrativeOutcome: '중세의 석조 성벽을 단숨에 부술 수 있는 강력한 화포 군단을 보유하여 대륙의 패자로 군림했습니다.',
          judgmentResult: '대성공',
          positiveFactor: '신식 공성 화포대 창설',
          resourceChanges: { manpower: 40, prestige: 80, gold: -60 }
        })
      },
      {
        id: 'constantinople_ocean_trade',
        text: '동방 육상 무역로 차단에 대비하여 대서양 신항로 개척 선단을 지원한다.',
        probability: '75% (대항해시대 개척)',
        groupType: '경제적 선택',
        resolve: () => ({
          narrativeOutcome: '카라벨 선단을 대서양으로 출항시켜 새로운 대양 무역의 선구자로 자리 잡았습니다.',
          judgmentResult: '대성공',
          positiveFactor: '대항해시대 신항로 개척 투자 성공',
          resourceChanges: { gold: 160, prestige: 70 }
        })
      }
    ]
  }
];
