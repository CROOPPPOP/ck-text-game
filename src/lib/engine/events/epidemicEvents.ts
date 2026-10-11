import { EngineGameEvent } from '../types';
import { extractNumericValue } from '../../ckVisuals';

export const EPIDEMIC_EVENTS: EngineGameEvent[] = [
  {
    id: 'lotd_black_death_approach',
    category: 'epidemic',
    title: '동방에서 불어온 붉은 죽음: 역병(Epidemic)의 내습',
    historicalTag: '역사적 고증: 확인됨 (14세기 흑사병 및 중세 대역병 방역)',
    narrativeTemplate: `국경 지대에서 말을 몰고 온 전령이 피를 토하며 쓰러졌습니다.
"각하... 이웃 영지에 검은 반점과 고열을 동반하는 끔찍한 죽음의 역병이 번지고 있습니다! 촌락이 통째로 버려지고 피난민들이 우리 성채를 향해 몰려오고 있습니다!"
성벽 아래에는 구원을 바라는 수백 명의 피난민과 상인들이 울부짖고 있습니다. 성문을 걸어 잠그고 철저히 격리할 것인가, 아니면 이들을 구휼하며 위험을 감수할 것인가?`,
    dialogueSpeaker: '궁정 의무관 에티엔',
    dialogueText: '"성문을 닫으셔야 합니다, 각하! 성벽 안으로 저 붉은 숨결이 들어오면 가문의 혈통마저 끊어집니다!"',
    trigger: (_state, turn) => turn >= 2,
    weight: 10,
    choices: [
      {
        id: 'quarantine_shut_gates',
        text: '즉시 도개교를 올리고 성문을 굳게 폐쇄하여 완전 격리(Quarantine)에 들어간다.',
        probability: '90%',
        groupType: '국가 / 세력',
        resolve: () => ({
          judgmentResult: '성공',
          narrativeOutcome: '철통같은 봉쇄령 덕분에 성내의 영주 일가와 직속 가신단은 단 한 명의 감염자 없이 무사히 역병의 고비를 넘겼습니다. 비록 교역이 멈춰 재정은 타격을 입었으나, 가문의 생존이라는 가장 중대한 과업을 완수했습니다.',
          positiveFactor: '신속하고 단호한 성문 폐쇄를 통한 일가족 생존율 100% 확보',
          negativeFactor: '교역 중단으로 인한 영지 상업 수입 급감',
          resourceChanges: {
            gold: -30,
            prestige: 10,
            legitimacy: 15
          }
        })
      },
      {
        id: 'open_gates_relief',
        text: '성문을 열어 피난민을 구휼하고 사원과 수도원에 격리 수용소를 마련한다.',
        probability: '65%',
        groupType: '신앙 / 자비',
        resolve: () => ({
          judgmentResult: '대성공',
          narrativeOutcome: '성직자들과 의원들이 밤낮으로 헌신하며 기적적으로 역병의 기세를 꺾었습니다. 비록 일부 병력 손실이 있었으나, 영주님의 성스러운 자비심에 감복한 백성들의 충성심과 가문의 정통성이 하늘을 찔렀습니다.',
          positiveFactor: '성스러운 구휼을 통한 민심 안정 및 가문 정통성 극대화',
          negativeFactor: '구휼 자금 소모 및 경미한 감염 피해',
          resourceChanges: {
            gold: -45,
            piety: 50,
            prestige: 35,
            legitimacy: 25
          },
          traitsToAdd: ['자비로운 성군']
        })
      },
      {
        id: 'expel_refugees_fire',
        text: '성벽 밖의 피난민 야영지에 불을 질러 국경 너머로 강제 축출한다.',
        probability: '70%',
        groupType: '돌발 / 위기',
        resolve: () => ({
          judgmentResult: '실패',
          narrativeOutcome: '비정한 진압으로 역병의 유입은 막았으나, 세간에는 피도 눈물도 없는 폭군이라는 악명이 자자해졌습니다. 주변 봉신들의 눈초리가 싸늘하게 식었습니다.',
          positiveFactor: '감염원의 물리적 원천 차단',
          negativeFactor: '가문 명예 추락 및 폭군 오명 획득',
          resourceChanges: {
            prestige: -30,
            legitimacy: -20,
            piety: -25
          },
          traitsToAdd: ['냉혹한 통치자']
        })
      },
      {
        id: 'flee_hunting_lodge',
        text: '영지를 신하들에게 맡기고 깊은 산속의 외딴 사냥 별궁으로 피신한다.',
        probability: '85%',
        groupType: '개인 행동',
        resolve: () => ({
          judgmentResult: '성공',
          narrativeOutcome: '산속 맑은 공기 속에서 은신하며 화를 면했습니다. 신체는 건강을 유지했으나, 주인을 잃고 고통받은 영지민들 사이에서 지도력에 대한 의문이 제기되었습니다.',
          positiveFactor: '영주의 신체적 안전 확보',
          negativeFactor: '영지 통솔력 약화',
          resourceChanges: {
            gold: -20,
            prestige: -15
          }
        })
      }
    ]
  },
  {
    id: 'lotd_ancestral_chronicle_legend',
    category: 'epidemic',
    title: '가문의 영웅 서사시 편찬과 전설(Legend)의 씨앗',
    historicalTag: '역사적 고증: 확인됨 (중세 가문 무훈시 Chanson de geste 전통)',
    narrativeTemplate: `궁정에 초대된 늙은 음유시인이 류트를 조율하며 깊은 경의를 표했습니다.
"각하, 가문의 시조께서 맹수를 맨손으로 찢고 이 땅을 개척하신 위대한 무용담을 온 세상이 잊어가고 있습니다. 금화를 조금만 후원해 주신다면, 대성당과 저잣거리마다 불려질 영원불멸의 가문 서사시를 편찬하겠습니다."
훌륭한 전설은 피 한 방울 흘리지 않고도 왕족에 필적하는 정통성(Legitimacy)을 부여하며, 모든 봉신을 무릎 꿇리게 만듭니다.`,
    dialogueSpeaker: '음유시인 블롱델',
    dialogueText: '"칼은 녹슬지만, 시인의 노래로 빚어진 가문의 영광은 천 년을 갑니다."',
    trigger: (state) => {
      const gold = extractNumericValue(state.factionState?.['세력 재정'] || state.inventory?.['소지 화폐']?.[0] || '0');
      return gold >= 15;
    },
    weight: 11,
    choices: [
      {
        id: 'sponsor_grand_epic',
        text: '아낌없이 황금을 투자하여 황금빛 양피지에 가문의 신화적 서사시를 새긴다.',
        probability: '90%',
        groupType: '가문 / 전설',
        resolve: () => ({
          judgmentResult: '대성공',
          narrativeOutcome: '시인의 웅장한 서사시가 음유시인들의 입을 타고 전 유럽의 궁정으로 퍼져나갔습니다. 우리 가문은 이제 단순한 영주가 아닌, 신화적 영웅의 핏줄로 칭송받으며 정통성이 확고해졌습니다.',
          positiveFactor: '가문 전설 완성 및 독보적인 정치적 정통성 확립',
          negativeFactor: '막대한 후원금 지출',
          resourceChanges: {
            gold: -40,
            prestige: 50,
            legitimacy: 30
          },
          traitsToAdd: ['전설적인 혈통']
        })
      },
      {
        id: 'modest_ballad_sponsor',
        text: '소박한 은화를 건네며 영지 내 주막과 마을에 낭만적인 가요를 퍼뜨리게 한다.',
        probability: '85%',
        groupType: '영지 / 문화',
        resolve: () => ({
          judgmentResult: '성공',
          narrativeOutcome: '영지민들이 모닥불 주위에 모여 가문의 업적을 노래하기 시작했습니다. 소박하지만 따뜻한 명성이 영지 구석구석에 뿌리내렸습니다.',
          positiveFactor: '적은 비용으로 효과적인 영지 민심 및 친밀도 제고',
          resourceChanges: {
            gold: -15,
            prestige: 20,
            legitimacy: 15
          }
        })
      },
      {
        id: 'commission_holy_relic_tale',
        text: '가문이 성유물을 수호하고 있다는 종교적 서사를 가미하여 사제들의 찬양을 유도한다.',
        probability: '75%',
        groupType: '신앙 / 전설',
        resolve: () => ({
          judgmentResult: '성공',
          narrativeOutcome: '교회 강론대에서 우리 가문의 이름이 하느님의 수호자로 거론되었습니다. 종교적 경건함과 가문 위신이 한꺼번에 빛을 발했습니다.',
          positiveFactor: '종교적 권위와 결합된 신성한 가문 정통성 확보',
          resourceChanges: {
            gold: -25,
            piety: 30,
            prestige: 25,
            legitimacy: 20
          }
        })
      },
      {
        id: 'dismiss_bard_folly',
        text: '허황된 노래 따위에 낭비할 돈은 없다며 음유시인을 돌려보낸다.',
        probability: '100%',
        groupType: '개인 행동',
        resolve: () => ({
          judgmentResult: '성공',
          narrativeOutcome: '금화는 굳었으나, 가문의 오랜 무용담은 사람들의 기억 속에서 점차 희미해져 갔습니다.',
          resourceChanges: {
            gold: 0
          }
        })
      }
    ]
  }
];
