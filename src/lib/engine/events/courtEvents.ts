import { EngineGameEvent } from '../types';
import { extractNumericValue } from '../../ckVisuals';

export const COURT_EVENTS: EngineGameEvent[] = [
  {
    id: 'tnt_grand_tournament_invitation',
    category: 'tournament',
    title: '이웃 공국의 대규모 마상시합(Tournament) 초대장',
    historicalTag: '역사적 고증: 확인됨 (중세 기사도 마상창시합 토너먼트 문화)',
    narrativeTemplate: `화려한 전령의 나팔 소리와 함께 이웃 공국의 초대 사절단이 성채에 당도했습니다.
"용맹한 영주 각하께 결투의 초대장을 바칩니다! 이번 성 미카엘 축일 마상시합에는 온 대륙의 쟁쟁한 챔피언들과 기사들이 명예와 전리품을 걸고 모여들 것입니다!"
대회 우승자에게는 막대한 명예와 전설적인 명검, 그리고 귀부인들의 환호가 주어집니다. 직접 갑옷을 입고 출전할 것인가, 충직한 챔피언 기사를 대신 내보낼 것인가?`,
    dialogueSpeaker: '토너먼트 전령관',
    dialogueText: '"창끝에 맹세를 걸고, 그대의 용맹을 온 제국에 증명하십시오!"',
    trigger: (_state, turn) => turn >= 2,
    weight: 12,
    choices: [
      {
        id: 'tournament_enter_personally',
        text: '직접 군마에 올라 랜스를 쥐고 1:1 결투에 뛰어든다! (기량/무력 판정)',
        probability: '70%',
        groupType: '개인 전투',
        resolve: () => ({
          judgmentResult: '대성공',
          narrativeOutcome: '3라운드에 걸친 치열한 마상창시합 끝에 적의 투구를 날려버리고 당당히 우승을 거머쥐었습니다! 관중들의 우레와 같은 함성 속에 [토너먼트 챔피언]의 월계관과 가보 검을 하사받았습니다.',
          positiveFactor: '압도적인 무예와 결투 담력으로 챔피언 등극',
          resourceChanges: {
            prestige: 60,
            gold: 40,
            legitimacy: 20
          },
          traitsToAdd: ['토너먼트 챔피언', '검술의 달인'],
          itemGains: ['🏆 승리의 은빛 장검']
        })
      },
      {
        id: 'tournament_send_champion',
        text: '영지 최고의 맹장 기사를 대리 챔피언으로 출전시킨다.',
        probability: '85%',
        groupType: '군사 / 가문',
        resolve: () => ({
          judgmentResult: '성공',
          narrativeOutcome: '나의 챔피언 기사가 결승까지 진출하여 영주의 명예를 드높였습니다. 기사단의 사기가 하늘을 찌르고 가문의 위신이 크게 상승했습니다.',
          positiveFactor: '안전한 대리 출전을 통한 가문 위신 및 군사 사기 고양',
          resourceChanges: {
            prestige: 35,
            manpower: 20
          }
        })
      },
      {
        id: 'tournament_host_gambling_merchants',
        text: '마상시합장 주변에 상인 막사를 열고 승패 내기에 돈을 건다.',
        probability: '75%',
        groupType: '경제 / 상업',
        resolve: () => ({
          judgmentResult: '성공',
          narrativeOutcome: '노련한 통찰력으로 우승 후보를 정확히 맞추어 쏠쏠한 배당금 금화를 챙겼습니다.',
          positiveFactor: '치밀한 계산을 통한 부가 자금 획득',
          resourceChanges: {
            gold: 35,
            prestige: 10
          }
        })
      },
      {
        id: 'tournament_decline_train',
        text: '사치스러운 마상시합을 사양하고 영지의 성벽 방어 훈련에 매진한다.',
        probability: '95%',
        groupType: '영지 / 군사',
        resolve: () => ({
          judgmentResult: '성공',
          narrativeOutcome: '실속 있는 내실 다지기에 집중했습니다. 영지 징집병들의 방어 태세와 규율이 탄탄해졌습니다.',
          positiveFactor: '실질적인 군사 훈련 및 방어 태세 완비',
          resourceChanges: {
            manpower: 30
          }
        })
      }
    ]
  },
  {
    id: 'court_position_physician_hire',
    category: 'court',
    title: '궁정 의무관(Court Physician)과 학자의 등용',
    historicalTag: '역사적 고증: 개연성 있음 (살레르노 및 몽펠리에 의학교 출신 의관)',
    narrativeTemplate: `동방의 의학 서적과 진귀한 약초함을 짊어진 학식 높은 학자가 궁정 문을 두드렸습니다.
"영주 각하, 저는 살레르노 의학당에서 인체의 체액설과 외과 수술을 수학한 의원입니다. 적절한 연구실과 녹봉을 보장해 주신다면, 각하와 일가족의 건강을 전염병과 독약으로부터 완벽히 수호하겠습니다."
궁정 의무관을 임명하면 매달 약간의 유지비가 들지만, 치명적인 질병이나 암살 독약 시도를 사전에 막아낼 수 있습니다.`,
    dialogueSpeaker: '방랑 의학사 마테오',
    dialogueText: '"예방은 치료보다 우월하며, 훌륭한 군주는 건강한 혈통에서 비롯됩니다."',
    trigger: (state) => {
      const gold = extractNumericValue(state.factionState?.['세력 재정'] || state.inventory?.['소지 화폐']?.[0] || '0');
      return gold >= 20;
    },
    weight: 9,
    choices: [
      {
        id: 'hire_court_physician_master',
        text: '정식 궁정 의무관으로 임명하고 사제관 옆에 약초 조제실을 하사한다.',
        probability: '90%',
        groupType: '궁정 / 인사',
        resolve: () => ({
          judgmentResult: '대성공',
          narrativeOutcome: '의무관은 감사의 눈물을 흘리며 정성껏 보약과 해독제를 제조했습니다. 영주 일가의 스트레스가 완화되고 활력이 넘쳐납니다.',
          positiveFactor: '궁정 의료 체계 확립을 통한 일가족 질병 저항력 극대화',
          negativeFactor: '정기 녹봉 지출',
          resourceChanges: {
            gold: -20,
            prestige: 15
          },
          traitsToAdd: ['강철 체력']
        })
      },
      {
        id: 'hire_physician_cheap_apothecary',
        text: '상비 녹봉 없이 긴급 치료 시에만 부르기로 계약한다.',
        probability: '80%',
        groupType: '경제 / 절약',
        resolve: () => ({
          judgmentResult: '성공',
          narrativeOutcome: '적은 비용으로 위급 상황에 대비할 수 있는 실리적인 계약을 맺었습니다.',
          resourceChanges: {
            gold: -10,
            prestige: 5
          }
        })
      },
      {
        id: 'dismiss_physician_faith',
        text: '의술보다는 신의 은총과 사제의 기도로 건강을 지키겠다며 돌려보낸다.',
        probability: '100%',
        groupType: '신앙 / 종교',
        resolve: () => ({
          judgmentResult: '성공',
          narrativeOutcome: '지역 수도원 사제들이 영주의 독실함에 찬사를 보냈습니다. 신앙심이 깊어졌습니다.',
          resourceChanges: {
            piety: 20
          }
        })
      }
    ]
  }
];
