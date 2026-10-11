import { EngineGameEvent } from '../types';
import { extractNumericValue } from '../../ckVisuals';

export const CHURCH_EVENTS: EngineGameEvent[] = [
  {
    id: 'bga_investiture_dispute',
    category: 'church',
    title: '주교 서임권을 둘러싼 교황청과의 대립',
    historicalTag: '역사적 고증: 확인됨 (카노사의 굴욕 전후 서임권 투쟁)',
    narrativeTemplate: `로마 교황청에서 파견된 특사가 붉은 인장이 찍힌 교황 칙서를 들고 알현실에 들어섰습니다.
"영주 각하, 성 베드로의 후계자이신 성하께서는 이 교구의 새 주교를 로마에서 직접 지명하기를 명하셨습니다. 세속 군주가 성직자를 임명하는 것은 심각한 성직 매매(Simony)이자 불경입니다!"
가신들과 사제들이 숨을 죽인 채 나의 결단을 주시하고 있습니다. 주교령의 막대한 십일조 수입을 포기할 것인가, 아니면 교황청과의 정면 충돌을 불사할 것인가?`,
    dialogueSpeaker: '교황청 특사 안셀모',
    dialogueText: '"교회의 것은 교회에게, 신의 것은 신에게 바치셔야 마땅합니다."',
    trigger: (state) => {
      const gold = extractNumericValue(state.factionState?.['세력 재정'] || state.inventory?.['소지 화폐']?.[0] || '0');
      return gold >= 20;
    },
    weight: 12,
    choices: [
      {
        id: 'investiture_assert_free',
        text: '세속 군주의 고유 권한임을 천명하고, 충성스러운 가신을 주교로 서임한다.',
        probability: '75%',
        groupType: '국가 / 세력',
        resolve: () => ({
          judgmentResult: '성공',
          narrativeOutcome: '나의 확고한 선언에 특사는 사색이 되어 물러났습니다. 충직한 가신이 주교관에 입성하며 사원의 금고와 장부가 온전히 나의 통제하에 들어왔습니다. 비록 교황청의 분노를 샀지만, 영지의 재정은 크게 윤택해졌습니다.',
          positiveFactor: '영지 내 세속 권력의 확고한 장악과 사원 조세 수입 독점',
          negativeFactor: '로마 교황청의 분노 및 잠재적 파문 위험도 상승',
          resourceChanges: {
            gold: 60,
            prestige: 25,
            papalFavor: -20,
            excommunicationRisk: 15
          }
        })
      },
      {
        id: 'investiture_submit_papal',
        text: '교황의 권위를 존중하여 로마에서 보낸 주교를 공손히 맞이한다.',
        probability: '95%',
        groupType: '신앙 / 종교',
        resolve: () => ({
          judgmentResult: '대성공',
          narrativeOutcome: '특사는 흡족한 미소를 지으며 교황 성하의 축복을 내렸습니다. 십일조 수입 일부가 로마로 흘러가게 되었으나, 교회의 전폭적인 지지를 얻어 신앙심 깊은 영주로서의 명망이 온 유럽에 퍼졌습니다.',
          positiveFactor: '교황청과의 두터운 유대 및 종교적 정통성 확보',
          negativeFactor: '영지 내 사원 세수 일부의 로마 유출',
          resourceChanges: {
            piety: 40,
            prestige: 15,
            papalFavor: 25,
            excommunicationRisk: -15
          }
        })
      },
      {
        id: 'investiture_bribe_compromise',
        text: '특사에게 거액의 헌금을 쥐여주며 양측이 타협할 만한 온건파 인사를 물색한다.',
        probability: '80%',
        groupType: '외교 / 협상',
        resolve: () => ({
          judgmentResult: '성공',
          narrativeOutcome: '은밀히 오간 금화 주머니 덕분에 특사의 표정이 누그러졌습니다. 로마 교황청의 체면도 세우고 내게도 우호적인 지역 원로 사제가 새 주교로 타협 서임되었습니다.',
          positiveFactor: '외교적 유연성과 막후 금권 협상의 성과',
          resourceChanges: {
            gold: -35,
            piety: 15,
            papalFavor: 10,
            prestige: 10
          }
        })
      },
      {
        id: 'investiture_refuse_expel',
        text: '특사를 오만방자한 죄로 영지 국경 밖으로 즉시 추방한다.',
        probability: '50%',
        groupType: '돌발 / 위기',
        resolve: () => ({
          judgmentResult: '실패',
          narrativeOutcome: '특사는 저주를 퍼부으며 쫓겨났습니다. 기세는 올랐으나 인근 수도원들이 성무 집행을 거부하며 종소리를 멈추었고, 영지민들의 불안감이 커졌습니다.',
          positiveFactor: '군주로서의 단호한 위엄 과시',
          negativeFactor: '교회의 반발과 영지 민심 동요',
          resourceChanges: {
            prestige: 30,
            piety: -30,
            papalFavor: -35,
            excommunicationRisk: 25
          }
        })
      }
    ]
  },
  {
    id: 'bga_bishop_scandal_puppet',
    category: 'church',
    title: '교구 주교의 비밀 추문과 꼭두각시 포섭 기회',
    historicalTag: '역사적 고증: 개연성 있음 (중세 성직자 규율 위반 및 궁정 흑막)',
    narrativeTemplate: `첩보원이 은밀히 다가와 양피지 묶음과 함께 속삭였습니다.
"각하, 교구의 베르나르도 주교가 은밀히 숨겨둔 여인과의 사이에서 아들을 낳았으며, 교회 십일조 금괴를 사적으로 은닉해 왔다는 결정적 증거를 확보했습니다."
이 문서를 세상에 공개하면 주교는 파문과 종교재판을 면치 못할 것입니다. 하지만 현명한 군주라면 이를 약점(Hook)으로 쥐고 주교를 완벽한 꼭두각시로 조종할 수도 있습니다.`,
    dialogueSpeaker: '첩보장 귀욤',
    dialogueText: '"이 서신 한 장이면 주교는 각하의 손바닥 안에서 춤출 수밖에 없습니다."',
    trigger: (state) => {
      const intrigue = extractNumericValue(state.stats?.acquired?.['은밀 행동'] || state.stats?.acquired?.['기만술'] || '40');
      return intrigue >= 30;
    },
    weight: 10,
    choices: [
      {
        id: 'puppet_bishop_hook',
        text: '비밀을 묻어주는 대가로 주교를 내 충실한 정치적 꼭두각시로 복종시킨다.',
        probability: '85%',
        groupType: '음모 / 흑막',
        resolve: () => ({
          judgmentResult: '대성공',
          narrativeOutcome: '사색이 된 주교는 내 발아래 엎드려 무조건적인 복종을 맹세했습니다. 이제 교회의 모든 파문 청원과 사원 금고가 내 뜻대로 움직입니다.',
          positiveFactor: '치명적 약점 장악을 통한 교단 내 강력한 괴뢰 권력 확보',
          resourceChanges: {
            gold: 50,
            prestige: 20,
            piety: 10
          },
          traitsToAdd: ['노련한 흑막']
        })
      },
      {
        id: 'expose_bishop_righteous',
        text: '타락한 성직자를 교황청에 고발하여 엄중한 종교재판에 회부한다.',
        probability: '90%',
        groupType: '신앙 / 정의',
        resolve: () => ({
          judgmentResult: '성공',
          narrativeOutcome: '추악한 진실이 밝혀지자 교단은 발칵 뒤집혔고 타락한 주교는 면직되었습니다. 교황청은 정의로운 조치를 취한 나를 극찬하며 성스러운 영주로 칭송했습니다.',
          positiveFactor: '교회의 정화 및 신앙적 대의 획득',
          resourceChanges: {
            piety: 45,
            prestige: 25,
            papalFavor: 20
          }
        })
      },
      {
        id: 'blackmail_instant_gold',
        text: '입막음의 대가로 사원 금고의 황금을 즉시 상납받는다.',
        probability: '80%',
        groupType: '개인 행동',
        resolve: () => ({
          judgmentResult: '성공',
          narrativeOutcome: '주교는 식은땀을 흘리며 황금 80닢이 든 궤짝을 바쳤습니다. 영지의 국고는 풍족해졌으나, 주교의 눈빛 깊은 곳에는 원한이 서려 있습니다.',
          positiveFactor: '막대한 즉각적 자금 확보',
          negativeFactor: '주교와의 잠재적 적대감 형성',
          resourceChanges: {
            gold: 80,
            prestige: -10
          }
        })
      },
      {
        id: 'ignore_bishop_secret',
        text: '성직자의 사생활에 관여하지 않고 서류를 조용히 불태운다.',
        probability: '100%',
        groupType: '개인 행동',
        resolve: () => ({
          judgmentResult: '성공',
          narrativeOutcome: '양피지는 벽난로의 불길 속으로 사라졌습니다. 세상은 평온을 유지했고 아무런 풍파도 일지 않았습니다.',
          resourceChanges: {
            prestige: 5
          }
        })
      }
    ]
  },
  {
    id: 'bga_excommunication_warning',
    category: 'church',
    title: '교황의 엄중 경고와 파문(Excommunication)의 그림자',
    historicalTag: '역사적 고증: 확인됨 (중세 군주들의 최대 파멸 위기 파문령)',
    narrativeTemplate: `로마에서 보낸 교황청의 최후통첩이 도착했습니다.
"영주여, 귀하의 세속적 방종과 교회의 권위를 침해한 죄가 천상에 닿았노라. 참회하지 않는다면 즉시 파문장을 반포할 것이며, 귀하의 모든 신하는 충성의 맹세에서 풀려날 것이다!"
파문당한다면 이웃 제후들은 합법적으로 내 영지를 침공할 명분을 얻게 되며, 봉신들의 반란이 빗발칠 것입니다. 당장 조치를 취해야 합니다!`,
    dialogueSpeaker: '대주교 사절',
    dialogueText: '"회개하십시오, 각하. 하느님의 자비에도 끝이 있는 법입니다."',
    trigger: (_state, turn) => turn >= 3,
    weight: 9,
    choices: [
      {
        id: 'canossa_penance_decision',
        text: '맨발로 참회하며 막대한 참회 헌금을 바쳐 파문 위협을 즉시 벗어난다.',
        probability: '95%',
        groupType: '신앙 / 결단',
        resolve: () => ({
          judgmentResult: '대성공',
          narrativeOutcome: '카노사의 굴욕에 버금가는 극적인 참회 의식을 거행하고 교황청에 거액의 헌금을 납부했습니다. 로마는 파문 위협을 공식 철회하고 자비로운 사면령을 내렸습니다.',
          positiveFactor: '파문 위협의 완전한 제거 및 가문의 안전 보장',
          negativeFactor: '막대한 재정 소모 및 일시적 굴욕',
          resourceChanges: {
            gold: -50,
            piety: 35,
            papalFavor: 30,
            excommunicationRisk: -40
          }
        })
      },
      {
        id: 'defiant_theologian_counter',
        text: '영지 내 학자들을 소집하여 교황의 부당한 정치 간섭을 반박하는 신학 선언문을 발표한다.',
        probability: '60%',
        groupType: '외교 / 학문',
        resolve: () => ({
          judgmentResult: '성공',
          narrativeOutcome: '우리의 날카로운 신학적 반박에 독자적 자주권을 지지하는 제후들이 동조했습니다. 교황청도 섣불리 파문을 내리지 못하고 한발 물러섰습니다.',
          positiveFactor: '학문적 논리와 군주의 자주적 위엄 수호',
          negativeFactor: '교황청과의 장기적 긴장 국면 지속',
          resourceChanges: {
            prestige: 40,
            piety: -15,
            excommunicationRisk: -10
          }
        })
      },
      {
        id: 'bribe_cardinal_allies',
        text: '로마의 유력 추기경들에게 은밀히 줄을 대어 파문 결의안을 무마시킨다.',
        probability: '75%',
        groupType: '음모 / 외교',
        resolve: () => ({
          judgmentResult: '성공',
          narrativeOutcome: '추기경단의 오랜 친구들이 교황을 설득하여 파문 안건을 보류시켰습니다. 막대한 돈이 들었지만 체면을 깎이지 않고 위기를 넘겼습니다.',
          positiveFactor: '추기경단을 통한 로마 내부 외교적 방어선 구축',
          resourceChanges: {
            gold: -40,
            prestige: 10,
            papalFavor: 15,
            excommunicationRisk: -25
          }
        })
      },
      {
        id: 'ignore_papal_bluff',
        text: '교황의 으름장을 단순한 허세로 치부하고 군사력을 증강한다.',
        probability: '45%',
        groupType: '돌발 / 위기',
        resolve: () => ({
          judgmentResult: '실패',
          narrativeOutcome: '교황청은 분노하여 공식 경고 서한의 수위를 높였습니다. 주변국들이 내 국경을 탐욕스러운 눈빛으로 주시하기 시작했습니다.',
          positiveFactor: '군사적 결기 과시',
          negativeFactor: '파문 위험도 급상승 및 외교적 고립',
          resourceChanges: {
            manpower: 30,
            papalFavor: -25,
            excommunicationRisk: 25
          }
        })
      }
    ]
  }
];
