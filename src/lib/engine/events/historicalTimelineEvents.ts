import { EngineGameEvent } from '../types';
import { ParsedState } from '../../parser';
import { extractNumericValue } from '../../ckVisuals';

/**
 * 날짜 문자열에서 연도 파싱
 */
function getYearFromDate(dateStr?: string): number {
  if (!dateStr) return 1066;
  const m = dateStr.match(/(\d+)년/);
  return m ? parseInt(m[1], 10) : 1066;
}

export const HISTORICAL_TIMELINE_EVENTS: EngineGameEvent[] = [
  // 1. [1066년 헤이스팅스 전투 여파]
  {
    id: 'hist_hastings_1066',
    category: 'historical',
    title: '노르만 정복과 헤이스팅스 전투의 파고',
    historicalTag: '📜 역사적 대사건: 1066년 노르만 정복 (Norman Conquest)',
    narrativeTemplate: `도버 해협을 건너온 전령이 거친 숨을 몰아쉬며 루앙과 파리를 뒤흔든 소식을 전합니다.
노르망디 공작 윌리엄이 헤이스팅스 벌판에서 해럴드 고드윈슨의 잉글랜드 군대를 격파하고 런던으로 진군하고 있습니다.
프랑스 북부와 플랑드르 전역의 제후들이 이 거대한 정복의 물결 앞에서 새로운 정략혼과 용병 계약을 저울질하고 있습니다.`,
    dialogueSpeaker: '노르만 기마 전령',
    dialogueText: '"공작 전하께서 바요의 성유물 위에 맹세하신 대로 잉글랜드의 왕관을 차지하셨습니다! 국경 제후들의 입장 표명이 시급합니다!"',
    trigger: (state: ParsedState, turn: number) => {
      const year = getYearFromDate(state.dateLocation);
      return year === 1066 && turn <= 3;
    },
    weight: 900,
    choices: [
      {
        id: 'hastings_support_norman',
        text: '정복왕 윌리엄의 노르만 원정대에 보급 마차와 기사를 급파하여 후원한다.',
        probability: '85% (안정적 외교)',
        groupType: '외교적 선택',
        resolve: (state: ParsedState) => ({
          narrativeOutcome: '귀하의 기사들이 도버 항구의 방비에 기여하여, 새 잉글랜드 왕국과의 국경 무역 특허를 획득했습니다.',
          judgmentResult: '대성공',
          positiveFactor: '정복왕 윌리엄의 각별한 신임 획득',
          resourceChanges: {
            gold: 35,
            prestige: 40,
            legitimacy: 20
          },
          relationDelta: { name: '노르망디 공국 (잉글랜드 왕가)', delta: 35 }
        })
      },
      {
        id: 'hastings_exploit_vacuum',
        text: '윌리엄의 주력이 바다를 건넌 틈을 타 인근 국경 지대의 영지 명분을 날조한다.',
        probability: '70% (모험적 계책)',
        groupType: '계책적 선택',
        resolve: (state: ParsedState) => ({
          narrativeOutcome: '영주들이 바다 건너 전투에 정신이 팔린 틈을 타, 합법적인 교구 토지 양도 문서를 위조해 국경 요충지를 확보했습니다.',
          judgmentResult: '성공',
          positiveFactor: '기습적인 영토 명분 확보',
          resourceChanges: {
            gold: 20,
            prestige: 15
          },
          relationDelta: { name: '이웃 남작령 (국경 제후)', delta: -25 }
        })
      },
      {
        id: 'hastings_stay_vigilant',
        text: '성채의 방벽을 점검하고 피난민과 무역상들에게 통행세를 징수한다.',
        probability: '95% (실리적 내정)',
        groupType: '내정적 선택',
        resolve: (state: ParsedState) => ({
          narrativeOutcome: '해협의 전란을 피해 몰려든 대상단들로부터 안전 통행세를 거두어 영지 재정을 충실히 불렸습니다.',
          judgmentResult: '성공',
          positiveFactor: '전쟁 특수 무역 통행세 수입',
          resourceChanges: {
            gold: 50,
            prestige: 10
          }
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
    trigger: (state: ParsedState, turn: number) => {
      const year = getYearFromDate(state.dateLocation);
      return year >= 1076 && year <= 1078;
    },
    weight: 950,
    choices: [
      {
        id: 'canossa_obey_pope',
        text: '교황 성좌에 충성을 맹세하고 영지 내 사제 서임권을 교회에 온전히 일임한다.',
        probability: '90% (신앙의 길)',
        groupType: '종교적 선택',
        resolve: (state: ParsedState) => ({
          narrativeOutcome: '로마 성좌로부터 전폭적인 축복장을 하사받아 가문의 정통성이 드높아졌으며, 파문 위험이 완전히 불식되었습니다.',
          judgmentResult: '대성공',
          positiveFactor: '교황청 공인 독실한 가문 서임',
          resourceChanges: {
            piety: 70,
            papalFavor: 45,
            excommunicationRisk: -60,
            prestige: 25
          },
          relationDelta: { name: '로마 교황청 (성좌)', delta: 40 }
        })
      },
      {
        id: 'canossa_support_emperor',
        text: '하인리히 4세 황제의 편에 서서 영지 내 주교 서임권과 성당 십일조 세수를 지킨다.',
        probability: '65% (세속적 실리)',
        groupType: '정치적 선택',
        resolve: (state: ParsedState) => ({
          narrativeOutcome: '영지 내 성당 십일조 전액을 가문 국고로 회수하여 막대한 금화를 확보했으나, 로마 성좌의 요주의 명부에 등재되었습니다.',
          judgmentResult: '성공',
          positiveFactor: '영지 종교 조세권 독점 확보',
          negativeFactor: '교황청 호감도 급랭 및 파문 경고',
          resourceChanges: {
            gold: 80,
            papalFavor: -35,
            excommunicationRisk: 40,
            prestige: 20
          },
          relationDelta: { name: '로마 교황청 (성좌)', delta: -30 }
        })
      },
      {
        id: 'canossa_reform_estate',
        text: '중립을 지키며 수도원 필사실과 도서관을 증축해 학문적 중재안을 모색한다.',
        probability: '80% (학문적 중립)',
        groupType: '학습적 선택',
        resolve: (state: ParsedState) => ({
          narrativeOutcome: '영지 수도원을 중립 학문의 거점으로 육성하여 고위 성직자들과 제후들의 신망을 동시에 얻었습니다.',
          judgmentResult: '성공',
          positiveFactor: '학문적 명성과 외교적 중재력',
          resourceChanges: {
            piety: 30,
            prestige: 30,
            gold: -20
          }
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
    trigger: (state: ParsedState, turn: number) => {
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
        resolve: (state: ParsedState) => ({
          narrativeOutcome: '가문의 깃발 아래 정예 기사들이 레반트로 출정했습니다. 전 기독교 세계에 가문의 무명과 신앙이 드높아졌습니다.',
          judgmentResult: '대성공',
          positiveFactor: '십자군 원정군 결성 및 무훈',
          resourceChanges: {
            manpower: -40,
            gold: -60,
            prestige: 120,
            piety: 100,
            papalFavor: 50
          },
          traitsToAdd: ['십자군 전사 (Crusader)']
        })
      },
      {
        id: 'crusade_fund_holy_see',
        text: '직접 출정 대신 막대한 군자금과 식량을 성좌에 헌납하고 대사면을 받는다.',
        probability: '90% (안전한 신앙)',
        groupType: '재정적 선택',
        resolve: (state: ParsedState) => ({
          narrativeOutcome: '원정군을 위한 군자금을 교황청에 기탁하여 대사면령(Indulgence)을 획득하고 영지 내 민심을 크게 결속시켰습니다.',
          judgmentResult: '성공',
          positiveFactor: '교황청 공식 대사면 획득',
          resourceChanges: {
            gold: -50,
            piety: 80,
            papalFavor: 30
          }
        })
      },
      {
        id: 'crusade_profit_trade',
        text: '성전군에게 판매할 무기와 군마, 건포도 보급 계약을 맺어 막대한 이문을 남긴다.',
        probability: '85% (상업적 기회)',
        groupType: '경제적 선택',
        resolve: (state: ParsedState) => ({
          narrativeOutcome: '출정 기사들에게 무구와 말굽을 판매하는 보급 계약을 독점하여 영지 국고를 황금으로 가득 채웠습니다.',
          judgmentResult: '대성공',
          positiveFactor: '성전 보급 물자 독점 상업 이익',
          resourceChanges: {
            gold: 110,
            piety: -15,
            prestige: 10
          }
        })
      }
    ]
  },

  // 4. [1347년 흑사병 대유행 - 검은 죽음]
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
    trigger: (state: ParsedState, turn: number) => {
      const year = getYearFromDate(state.dateLocation);
      return year >= 1346 && year <= 1350;
    },
    weight: 999,
    choices: [
      {
        id: 'black_death_quarantine',
        text: '성문을 굳게 걸어 잠그고 가도와 장원을 전면 봉쇄(격리)한다.',
        probability: '80% (냉혹한 봉쇄)',
        groupType: '생존적 선택',
        resolve: (state: ParsedState) => ({
          narrativeOutcome: '혹독한 영지 봉쇄와 외부 상인 추방을 통해 성내 가신들과 주민들의 감염을 기적적으로 막아냈습니다.',
          judgmentResult: '성공',
          positiveFactor: '철저한 검역 격리로 영주 일가 무사',
          negativeFactor: '무역 중단으로 인한 세수 격감',
          resourceChanges: {
            gold: -45,
            prestige: 20
          }
        })
      },
      {
        id: 'black_death_pest_doctor',
        text: '사각 부리 가면을 쓴 전문 역병 의사를 초빙하고 정화 향료를 피운다.',
        probability: '70% (의학적 방역)',
        groupType: '의학적 선택',
        resolve: (state: ParsedState) => ({
          narrativeOutcome: '비니거 식초 세척과 약초 향료 방역으로 사망률을 절반으로 낮추고 백성들의 동요를 진정시켰습니다.',
          judgmentResult: '성공',
          positiveFactor: '조직적 역병 방역 체계 가동',
          resourceChanges: {
            gold: -35,
            piety: 30
          }
        })
      },
      {
        id: 'black_death_flagellants',
        text: '채찍질 고행단(Flagellants)을 영내에 들여 참회의 대기도회를 거행한다.',
        probability: '50% (광기의 도박)',
        groupType: '종교적 선택',
        resolve: (state: ParsedState) => ({
          narrativeOutcome: '신앙적 광신은 충천했으나, 군중 밀집으로 인해 역병이 걷잡을 수 없이 번져 막대한 인명 피해를 입었습니다.',
          judgmentResult: '실패',
          negativeFactor: '군중 집회로 인한 역병 확산 참사',
          resourceChanges: {
            piety: 50,
            manpower: -30,
            gold: -20
          }
        })
      }
    ]
  }
];
