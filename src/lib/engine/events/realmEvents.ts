import { EngineGameEvent } from '../types';
import { extractNumericValue } from '../../ckVisuals';

export const REALM_EVENTS: EngineGameEvent[] = [
  {
    id: 'realm_bandit_outlaws_raid',
    category: 'realm',
    title: '숲속 무법자 도적단의 습격과 국경 방어',
    historicalTag: '역사적 고증: 확인됨 (중세 영지 치안 및 산적 토벌)',
    narrativeTemplate: `국경 순찰대장이 상처를 감싸 쥔 채 다급히 보고했습니다.
"영주 각하, 산악 지대에 웅거하던 무법자 패거리가 가을 수확물을 실은 곡물 마차 대열을 습격했습니다! 촌락 주민들이 공포에 떨고 있으며, 인근 가도 교역로가 마비되었습니다."
이들을 방치하면 치안과 민심이 붕괴되고 세수가 급감할 것입니다. 기사단을 소집해 섬멸할 것인가, 매복 작전으로 두목을 암살할 것인가?`,
    dialogueSpeaker: '순찰대장 베르트랑',
    dialogueText: '"이 늑대 같은 놈들에게 영주님의 칼날이 얼마나 매서운지 본때를 보여주어야 합니다!"',
    trigger: (_state, turn) => turn >= 1,
    weight: 15,
    choices: [
      {
        id: 'bandit_crush_chivalric_charge',
        text: '기사단과 정예 징집병을 직접 이끌고 도적 본거지를 총공격한다! (무력 판정)',
        probability: '80%',
        groupType: '군사 / 토벌',
        resolve: () => ({
          judgmentResult: '대성공',
          narrativeOutcome: '기병대의 맹렬한 돌격 앞에 산적들은 순식간에 와해되었습니다. 도적 두목을 포획하고 빼앗긴 곡물과 약탈품 은화 45닢을 회수했습니다. 영지의 치안이 단숨에 바로잡혔습니다.',
          positiveFactor: '압도적인 군사 통솔력과 과감한 기병 섬멸전',
          resourceChanges: {
            gold: 45,
            prestige: 30,
            manpower: 10
          },
          traitsToAdd: ['용맹한 지휘관']
        })
      },
      {
        id: 'bandit_assassinate_leader',
        text: '첩보원을 침투시켜 도적 두목을 은밀히 독살하고 무리를 분열시킨다. (계책 판정)',
        probability: '75%',
        groupType: '음모 / 흑막',
        resolve: () => ({
          judgmentResult: '성공',
          narrativeOutcome: '두목이 의문의 급사를 당하자 산적단은 내분에 휩싸여 스스로 흩어졌습니다. 피 한 방울 흘리지 않고 가도를 안전하게 확보했습니다.',
          positiveFactor: '치밀한 암살 공작을 통한 무혈 평정',
          resourceChanges: {
            prestige: 15,
            gold: 20
          }
        })
      },
      {
        id: 'bandit_bribe_pardon_mercenary',
        text: '사면령을 내리고 그들을 국경 수비 용병대로 포섭한다.',
        probability: '70%',
        groupType: '외교 / 타협',
        resolve: () => ({
          judgmentResult: '성공',
          narrativeOutcome: '갈 곳 없는 무법자들이 영주님의 자비에 감복하여 충성을 맹세했습니다. 병력 정원이 즉시 충원되었습니다.',
          positiveFactor: '실리적인 용병 인력 흡수',
          negativeFactor: '상인과 주민들의 일시적 원성',
          resourceChanges: {
            gold: -15,
            manpower: 35,
            prestige: -10
          }
        })
      },
      {
        id: 'bandit_fortify_defend_only',
        text: '마을 주변에 목책을 두르고 방어에만 집중한다.',
        probability: '90%',
        groupType: '영지 / 수비',
        resolve: () => ({
          judgmentResult: '성공',
          narrativeOutcome: '방어선은 지켜냈으나 도적들이 주변 산길을 여전히 배회하고 있어 교역이 다소 위축되었습니다.',
          resourceChanges: {
            gold: -10,
            prestige: 5
          }
        })
      }
    ]
  },
  {
    id: 'realm_bountiful_harvest_festival',
    category: 'realm',
    title: '풍작의 계절과 가을 대추수 연회(Harvest Festival)',
    historicalTag: '역사적 고증: 확인됨 (중세 영지 추수감사 및 영주 주최 연회)',
    narrativeTemplate: `올가을 영지의 들판은 황금빛 이삭으로 넘쳐나고 있습니다.
장원 관리인이 환한 얼굴로 곡물 창고 장부를 펼쳐 보였습니다.
"각하, 올해는 가뭄도 서리도 없어 예년의 두 배에 달하는 곡식이 창고마다 가득 찼습니다! 영지민들과 가신들이 영주님의 덕이라며 축제를 열어주실 것을 고대하고 있습니다."
거대한 연회를 열어 가문의 위신을 드높이고 민심을 결속시킬 것인가, 아니면 곡물을 비축하여 미래의 위기에 대비할 것인가?`,
    dialogueSpeaker: '장원 관리인 기욤',
    dialogueText: '"풍요의 신이 영주님의 손길 위에 내리신 축복입니다!"',
    trigger: (_state, turn) => turn >= 1,
    weight: 14,
    choices: [
      {
        id: 'festival_host_grand_banquet',
        text: '성대한 가을 축제와 무료 주막을 열어 모든 영지민을 배불리 먹인다.',
        probability: '95%',
        groupType: '가문 / 축제',
        resolve: () => ({
          judgmentResult: '대성공',
          narrativeOutcome: '나팔과 북소리가 밤새 울려 퍼졌고, 영지민들은 영주님의 만수무강을 외치며 춤을 추었습니다. 영지의 결속력과 가문의 위신이 최고조에 달했습니다.',
          positiveFactor: '축제를 통한 영지 민심 안정 및 봉신 충성도 극대화',
          negativeFactor: '연회 개최 비용 지출',
          resourceChanges: {
            gold: 30, // 잉여곡물 매각 + 축제 지출 상쇄
            prestige: 40,
            legitimacy: 20
          },
          traitsToAdd: ['관대한 영주']
        })
      },
      {
        id: 'festival_store_granary_crisis',
        text: '축제는 검소하게 치르고 잉여 곡물을 모두 비상 저장고에 비축한다.',
        probability: '90%',
        groupType: '영지 / 행정',
        resolve: () => ({
          judgmentResult: '성공',
          narrativeOutcome: '곡물 창고가 튼튼한 빗장 아래 채워졌습니다. 미래의 흉년이나 장기 공성전에도 끄떡없는 든든한 보급선을 확보했습니다.',
          positiveFactor: '철저한 재난 대비 및 보급 기반 확충',
          resourceChanges: {
            gold: 40,
            prestige: 10
          }
        })
      },
      {
        id: 'festival_sell_to_foreign_merchants',
        text: '이탈리아 상인단에게 곡물을 최고가에 전량 매각하여 황금을 축적한다.',
        probability: '85%',
        groupType: '경제 / 상업',
        resolve: () => ({
          judgmentResult: '성공',
          narrativeOutcome: '베네치아 상인들이 금화 궤짝을 안겨주었습니다. 국고가 묵직해져 대규모 성채 증축이나 군대 모집에 청신호가 켜졌습니다.',
          positiveFactor: '대규모 즉각적 금화 재정 축적',
          resourceChanges: {
            gold: 65,
            prestige: 10
          }
        })
      }
    ]
  },
  {
    id: 'realm_wandering_master_builder',
    category: 'realm',
    title: '석공 길드의 거장 마스터 빌더(Master Builder) 방문',
    historicalTag: '역사적 고증: 개연성 있음 (중세 이동식 석공 길드 및 축성술 혁신)',
    narrativeTemplate: `프랑스 북부의 대성당을 축조하고 돌아오는 명망 높은 석공 마이스터가 영지에 들렀습니다.
"영주 각하의 성채와 장원은 훌륭하나, 최신 볼트 공법과 강화 옹벽을 적용한다면 공사 비용을 반으로 줄이고 난공불락의 요새로 탈바꿈시킬 수 있습니다."
그의 설계도를 도입하면 영지의 건설 효율이 영구히 개선될 것입니다.`,
    dialogueSpeaker: '석공 마이스터 발터',
    dialogueText: '"돌은 거짓말을 하지 않으며, 견고한 석벽은 백 년의 평화를 보장합니다."',
    trigger: (_state, turn) => turn >= 2,
    weight: 10,
    choices: [
      {
        id: 'hire_master_builder_full',
        text: '그를 궁정 수석 건축가로 고용하고 새 성채 설계도를 완성하게 한다.',
        probability: '85%',
        groupType: '영지 / 건설',
        resolve: () => ({
          judgmentResult: '대성공',
          narrativeOutcome: '마이스터의 탁월한 감수 아래 영지 내 시설 증축 기술이 비약적으로 발전했습니다. 석재와 목재 절감으로 건설 비용이 크게 절감되었습니다.',
          positiveFactor: '첨단 공법 도입을 통한 영지 개발도 및 건설 효율 극대화',
          resourceChanges: {
            gold: -25,
            prestige: 25
          },
          traitsToAdd: ['탁월한 건축가']
        })
      },
      {
        id: 'buy_blueprint_only',
        text: '설계도만 저렴하게 사들여 영지 석공들에게 연구하게 한다.',
        probability: '75%',
        groupType: '경제 / 기술',
        resolve: () => ({
          judgmentResult: '성공',
          narrativeOutcome: '실속 있게 도면을 확보하여 차후 증축에 유용하게 쓸 수 있게 되었습니다.',
          resourceChanges: {
            gold: -10,
            prestige: 10
          }
        })
      },
      {
        id: 'pass_master_builder',
        text: '현재의 성채로도 충분하다며 정중히 전송한다.',
        probability: '100%',
        groupType: '개인 행동',
        resolve: () => ({
          judgmentResult: '성공',
          narrativeOutcome: '마이스터는 다른 영지를 향해 떠났습니다.',
          resourceChanges: {
            gold: 0
          }
        })
      }
    ]
  }
];
