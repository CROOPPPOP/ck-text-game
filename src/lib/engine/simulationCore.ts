import { ParsedState, ChronicleItem } from '../parser';
import { QueueItem, parseTurnNumber, summarizeQueue } from '../construction';
import { extractNumericValue, formatDecimal, applyTurnResourceAccumulation } from '../ckVisuals';
import { rollEvent, findEventChoiceById } from './events/eventRegistry';
import { EngineGameEvent, EngineEventChoice } from './types';
import { PIETY_DECISIONS, PRESTIGE_DECISIONS } from '../ckDecisions';
import { PERSONALITY_PAIRS, CONGENITAL_POINT_TRAITS } from './customizationTypes';

const SEASONS = ['봄', '여름', '가을', '겨울'];

function advanceDateString(currentDateLocation?: string, currentTurn: number = 1): { newDateLocation: string; newTurn: number; yearIncremented: boolean } {
  const nextTurn = currentTurn + 1;
  let year = 1066;
  let location = '샤르트르 영지';

  if (currentDateLocation) {
    const yearMatch = currentDateLocation.match(/(\d+)년/);
    if (yearMatch) year = parseInt(yearMatch[1], 10);
    const locMatch = currentDateLocation.match(/\/\s*(.*?)(?:\s*\[턴 수|$)/);
    if (locMatch && locMatch[1].trim()) location = locMatch[1].trim();
  }

  // 4턴당 1년 경과 (계절 순환)
  const seasonIndex = (nextTurn - 1) % 4;
  const season = SEASONS[seasonIndex];
  const yearDelta = Math.floor((nextTurn - 1) / 4);
  const currentYear = year + (nextTurn % 4 === 1 && nextTurn > 1 ? 1 : 0);
  const yearIncremented = nextTurn % 4 === 1 && nextTurn > 1;

  const monthMap = [4, 7, 10, 1]; // 봄(4월), 여름(7월), 가을(10월), 겨울(1월)
  const month = monthMap[seasonIndex];

  return {
    newDateLocation: `${currentYear}년 ${month}월 (${season}) / ${location} [턴 수: ${nextTurn}]`,
    newTurn: nextTurn,
    yearIncremented
  };
}

export function createInitialGameState(config: any): ParsedState {
  const name = config?.character || '샤를 드 발루아';
  const era = config?.era || '1066년 중세 성기';
  const startLoc = config?.startLocation || '노르망디 루앙 성채';
  const status = config?.playerStatus || '남작';
  const archetype = config?.archetype || 'noble';
  const goal = config?.finalGoal || '가문의 영광과 영지 번영';
  const house = config?.houseName || '발루아';
  const houseMotto = config?.houseMotto || '명예와 긍지';

  // 1. 기본 선천/후천 스탯 세팅
  const innateStats: Record<string, string> = {
    '근력': '55 (우수)', '체력': '60 (강건)', '지구력': '50 (보통)', '민첩성': '52 (보통)',
    '반사 신경': '50 (보통)', '속도': '48 (보통)', '신체 조정력': '50 (보통)', '지각력': '55 (우수)',
    '지능': '58 (총명)', '기억력': '50 (보통)', '학습 능력': '55 (우수)', '의지력': '60 (강철)', '집중력': '55 (우수)'
  };
  if (config?.stats && typeof config.stats === 'object') {
    for (const [k, v] of Object.entries(config.stats)) {
      if (k in innateStats) innateStats[k] = `${v} (조정됨)`;
    }
  }

  const acquiredStats: Record<string, string> = {
    '통솔력': '14 (+2)', '매력': '12 (+1)', '외교력': '13 (+2)', '설득력': '11', '기만술': '9', '위협': '10',
    '행정력': '15 (+3)', '전략': '12 (+1)', '전술': '11', '전투력': '13 (+2)', '무기 숙련도': '12 (+1)',
    '기마술': '11', '생존술': '10', '의술': '8', '학문': '12 (+1)', '기술 숙련도': '10', '장인 기술': '9',
    '은밀 행동': '8', '수사력': '10'
  };
  if (config?.stats && typeof config.stats === 'object') {
    for (const [k, v] of Object.entries(config.stats)) {
      if (k in acquiredStats) acquiredStats[k] = `${v}`;
    }
  }

  // 2. 가문 유산 (Dynasty Legacy) 및 신분별 초기 세력/거점 설정
  const legacyType = config?.dynastyLegacy || (
    config?.houseFocus?.includes('군사') ? 'martial' :
    config?.houseFocus?.includes('신앙') ? 'holy' :
    config?.houseFocus?.includes('행정') || config?.houseFocus?.includes('번영') ? 'merchant' : 'martial'
  );

  let initialGold = 65;
  let initialLevies = 110;
  let initialKnights = 4;
  let startingWeapon = '가문의 보검';
  const startingItems = [`${house} 가문 인장 반지`, '영지 토지 대장', '성경 사본'];
  const startingTraits: any[] = [
    { category: '전문특성', name: '영지 통치자', tier: '확립된 특성', description: '영지 조세와 법률을 관할하는 지혜' },
    { category: '정신특성', name: '명예 존중', tier: '확립된 특성', description: '기사도와 신의를 중시함' },
    { category: '신체특성', name: '강건한 체격', tier: '잠재 특성', description: '풍찬노숙을 버텨내는 체력' }
  ];

  let initialEstate: any = {
    type: '영지 장원',
    level: 'Lv.2 남작 장원',
    buildings: [
      { name: '석조 본관 안채', level: 2, tags: ['행정', '거주'], desc: '영주 일가의 거처이자 행정 집무실' },
      { name: '목조 감시탑 및 위병소', level: 1, tags: ['군사', '치안'], desc: '가도 감시 및 영지 방어 시설' }
    ]
  };

  const initialFactionRelations = [
    '이웃 남작령 (국경 제후)|관계: 중립 (+15)',
    '로마 교황청 (성좌)|관계: 우호 (+20)'
  ];

  // 4축: 가문 유산(Dynasty Legacy) 특전 적용
  if (archetype === 'noble') {
    if (legacyType === 'martial') {
      initialLevies += 30;
      initialKnights += 2;
      startingWeapon = '⚔️ 선대의 강철 장검 (가보)';
      startingTraits.push({
        category: '가문유산',
        name: '무인의 혈통',
        tier: '가문 대업',
        description: '선대로부터 전장을 누벼온 맹장 가문의 혈통 (징집병 +30, 정예 기사 보강)'
      });
    } else if (legacyType === 'holy') {
      initialFactionRelations[1] = '로마 교황청 (성좌)|관계: 열렬한 지지 (+50)';
      startingItems.unshift('⛪ 성십자가의 파편 (성유물)');
      startingTraits.push({
        category: '가문유산',
        name: '성자의 혈통',
        tier: '가문 대업',
        description: '성좌의 축복을 받은 성스러운 가문의 혈통 (초기 신앙 +50, 교황청 호감도 특화)'
      });
    } else if (legacyType === 'merchant') {
      initialGold += 80;
      initialEstate.buildings.push({
        name: '올리브 압착장',
        level: 1,
        tags: ['경제', '특산품'],
        desc: '가문의 상업 번영을 이끄는 특산 가공장'
      });
      startingTraits.push({
        category: '가문유산',
        name: '상인의 혈통',
        tier: '가문 대업',
        description: '황금과 장원의 번영을 이끄는 부호 가문의 혈통 (시작 금화 +80닢, 올리브 압착장 완공)'
      });
    }
  }

  // 2축: 성격 트레잇 (Personality Traits) 적용
  if (config?.personalityTraits && Array.isArray(config.personalityTraits)) {
    const allPersonalities = PERSONALITY_PAIRS.flatMap(p => [p.positive, p.opposite]);
    config.personalityTraits.forEach((pId: string) => {
      const found = allPersonalities.find(p => p.id === pId || p.name.includes(pId));
      if (found && !startingTraits.some(t => t.name === found.name)) {
        startingTraits.push({
          category: '성격특성',
          name: found.name,
          tier: '성격 트레잇',
          description: `${found.desc} (${found.statBonus})`
        });
      }
    });
  }

  // 3축: 선천적 유전 트레잇 (Congenital Point Traits) 적용
  if (config?.congenitalTraits && Array.isArray(config.congenitalTraits)) {
    config.congenitalTraits.forEach((cId: string) => {
      const found = CONGENITAL_POINT_TRAITS.find(c => c.id === cId || c.name.includes(cId));
      if (found && !startingTraits.some(t => t.name === found.name)) {
        startingTraits.push({
          category: '선천특성',
          name: found.name,
          tier: '유전 특성',
          description: `${found.desc} (${found.effects})`
        });
      }
    });
  }

  // 커스텀 일반 특성 병합
  if (config?.selectedTraits && typeof config.selectedTraits === 'object') {
    Object.entries(config.selectedTraits).forEach(([cat, traitsArr]: [string, any]) => {
      if (Array.isArray(traitsArr)) {
        traitsArr.forEach(tName => {
          if (!startingTraits.some(t => t.name === tName)) {
            startingTraits.push({
              category: cat,
              name: tName,
              tier: '확립된 특성',
              description: '캐릭터 생성 시 선택한 특성'
            });
          }
        });
      }
    });
  }

  let initialFactionState: Record<string, string> = {
    '인구': '1,250명',
    '세력 재정': `금화 ${initialGold} (은화 40)`,
    '치안': '안전 (75%)',
    '민심': '안정 (80%)',
    '병력': `징집병 ${initialLevies}명, 정예 기사 ${initialKnights}명`,
    '행정력': '우수 (70%)'
  };

  if (archetype === 'wanderer') {
    initialEstate = {
      type: '야영지',
      level: 'Lv.1 이동식 야영지',
      buildings: [
        { name: '방수 텐트 및 모닥불', level: 1, tags: ['생존'], desc: '야외 비바람을 막아주는 임시 거처' }
      ]
    };
    initialFactionState = {
      none: 'true',
      '통치 상태': '통치 중인 영지 없음 (방랑 모험가)'
    };
  }

  // 3. 초기 선택지 (첫 번째 이벤트: 서임권 또는 영지 경영)
  const initialEvent = rollEvent({}, 1);

  return {
    dateLocation: `1066년 10월 (가을) / ${startLoc} [턴 수: 1]`,
    historicalTag: '역사적 고증: 확인됨 (서기 1066년 노르만 정복 시대)',
    judgment: {
      result: '역사의 서막',
      positive: '정당한 가문 계승권과 가신단의 충성',
      negative: '불확실한 국경 정세와 잠재적 외세 위협'
    },
    personalInfo: {
      '이름': name,
      '나이': '25',
      '성별': '남성',
      '신분': status,
      '직위': status,
      '종교': '가톨릭',
      '칭호': `${house} 가문의 영주`
    },
    playerStatus: [
      { name: '건강', value: '95', risk: '최상', description: '질병 없이 매우 혈기왕성함' },
      { name: '체력', value: '90', risk: '최상', description: '충분한 휴식으로 활력이 넘침' },
      { name: '통증', value: '0', risk: '안전', description: '외상이나 통증 없음' },
      { name: '허기', value: '15', risk: '안전', description: '적절한 영양 상태' },
      { name: '갈증', value: '10', risk: '안전', description: '수분 충분' },
      { name: '피로', value: '15', risk: '안전', description: '상쾌한 기상 상태' },
      { name: '체온', value: '36.5', risk: '안전', description: '정상 체온' },
      { name: '스트레스', value: '10', risk: '안전', description: '자신감에 차 있음' }
    ],
    stats: {
      innate: innateStats,
      acquired: acquiredStats
    },
    traits: startingTraits,
    inventory: {
      '소지 화폐': [`금화 ${initialGold}`, '은화 40'],
      '착용 무구': [startingWeapon, '사슬 갑옷', '문장 방패'],
      '소지품': startingItems
    },
    factionState: initialFactionState,
    estate: initialEstate,
    buildOptions: [
      { name: '올리브 압착장 증축', cost: '금화 35', turns: 2, desc: '특산품 가공을 통해 영지 수익 증대', tags: ['경제'] },
      { name: '목조 방벽 강화', cost: '금화 40', turns: 2, desc: '도적과 외세 기습 방어력 상승', tags: ['군사'] },
      { name: '사제관 서재 확충', cost: '금화 25', turns: 1, desc: '신앙 및 학습력 증진', tags: ['종교'] }
    ],
    familyState: {
      spouse: '미혼',
      children: '없음',
      heir: '가문의 방계 친척',
      successionLaw: '남계 분할 상속제'
    },
    relationships: {
      personal: [
        '수석 집사 아르노 (충성 가신)|호감도: +70',
        '교구 신부 베르나르도 (지역 사제)|호감도: +55'
      ],
      faction: initialFactionRelations
    },
    objective: {
      ultimateGoal: goal,
      currentGoal: '영지 기반 안정화 및 재정 확충',
      currentProgress: '15%',
      totalProgress: '100%',
      status: '진행 중',
      summary: `${house} 가문의 깃발 아래 영지를 번영시키고 정통성을 확립하십시오.`
    },
    narrative: `찬란한 가을 햇살이 ${startLoc}의 성벽과 탑루 위로 부서져 내립니다.
집사 아르노가 양피지 장부를 가슴에 품은 채 굳은 표정으로 다가와 허리를 굽혔습니다.
"각하, 새로운 통치의 계절이 시작되었습니다. ${house} 가문의 이름 아래 깃발을 올리신 이후, 영지민들과 기사들이 각하의 첫 번째 칙령을 간절히 기다리고 있습니다."
창밖을 내다보니, 황금빛 곡식으로 물든 들판 너머로 순찰 기병대의 창끝이 은빛으로 번뜩이고 있었습니다.
선대의 유산과 가문의 가언("${houseMotto}")이 내 어깨 위에 무겁게 내려앉습니다. 이제 영지의 운명을 결정할 시간입니다.
[역사적 고증: 확인됨]`,
    choices: initialEvent.choices.map((c, idx) => ({
      id: c.id,
      type: `${idx + 1}번`,
      text: c.text,
      probability: c.probability,
      groupType: c.groupType
    }))
  };
}

export function processTurn(
  currentState: ParsedState,
  actionText: string,
  currentTurn: number,
  constructionQueue: QueueItem[]
): { parsed: ParsedState; raw: string } {
  // 1. 날짜 및 턴 진척
  const { newDateLocation, newTurn, yearIncremented } = advanceDateString(currentState.dateLocation, currentTurn);

  // 2. 나이 계산 (해 넘어갔을 때 1세 증가)
  const currentAge = parseInt(currentState.personalInfo?.['나이'] || '25', 10);
  const updatedAge = yearIncremented ? currentAge + 1 : currentAge;

  // 3. 결단(Decisions) 또는 선택지(Choices) 매칭
  let matchedOutcome: any = null;

  // 3-1. 결단 확인
  const allDecisions = [...PIETY_DECISIONS, ...PRESTIGE_DECISIONS];
  const matchedDecision = allDecisions.find(d => actionText.includes(d.title) || actionText.includes(d.id));

  // 3-2. 이벤트 선택지 확인
  let matchedChoiceObj = null;
  const choiceMatch = currentState.choices?.find(c => actionText.includes(c.text) || actionText.includes(c.id));
  if (choiceMatch) {
    matchedChoiceObj = findEventChoiceById(choiceMatch.id);
  }

  // 4. 수치 변동 적용
  let deltaGold = 0;
  let deltaManpower = 0;
  let deltaPrestige = 0;
  let deltaPiety = 0;
  let judgmentResult = '성공';
  let narrativeText = '';
  let positiveFactor = '치밀한 전략과 영주로서의 결단력';
  let negativeFactor = '자원 소모 및 주변 정세의 긴장';
  const newTraitsToAdd: string[] = [];

  if (matchedChoiceObj) {
    const effect = matchedChoiceObj.choice.resolve(currentState);
    judgmentResult = effect.judgmentResult;
    narrativeText = effect.narrativeOutcome;
    positiveFactor = effect.positiveFactor || positiveFactor;
    negativeFactor = effect.negativeFactor || negativeFactor;
    if (effect.resourceChanges) {
      deltaGold += effect.resourceChanges.gold || 0;
      deltaManpower += effect.resourceChanges.manpower || 0;
      deltaPrestige += effect.resourceChanges.prestige || 0;
      deltaPiety += effect.resourceChanges.piety || 0;
    }
    if (effect.traitsToAdd) newTraitsToAdd.push(...effect.traitsToAdd);
  } else if (matchedDecision) {
    judgmentResult = '대성공';
    narrativeText = `엄숙한 의식 속에 결단 '${matchedDecision.title}'이(가) 공표되었습니다. ${matchedDecision.description}`;
    positiveFactor = matchedDecision.subtitle;
    negativeFactor = `${matchedDecision.costType} ${matchedDecision.cost} 소모`;
    if (matchedDecision.costType === '신앙') deltaPiety -= matchedDecision.cost;
    else deltaPrestige -= matchedDecision.cost;
  } else {
    // 자유 텍스트 행동: 상황에 맞는 자연스러운 판정 생성
    judgmentResult = '성공';
    narrativeText = `플레이어의 지시('${actionText.split('\n')[0]}')가 영지 가신단에 하달되었습니다. 가신들과 기사들이 신속히 움직여 맡은 임무를 충실히 수행했습니다.`;
    deltaPrestige += 10;
  }

  // 5. 건설 시스템 명령 처리 ([시스템 명령] 감지)
  if (actionText.includes('[시스템 명령]')) {
    const sysMatches = actionText.match(/\[시스템 명령\]\s*(.*?)(?=\n|$)/g);
    if (sysMatches) {
      narrativeText += `\n\n[영지 보고] ${sysMatches.map(m => m.replace('[시스템 명령]', '').trim()).join(' ')}`;
    }
  }

  // 6. 재정 및 자원 가감 계산
  const currentGold = extractNumericValue(currentState.factionState?.['세력 재정'] || currentState.inventory?.['소지 화폐']?.[0] || '65');
  const finalGold = Math.max(0, currentGold + deltaGold);

  // 7. 다음 턴의 새 이벤트 추첨
  const nextEvent = rollEvent(currentState, newTurn);

  // 8. 서사 조합 (대화문 포함)
  const speaker = nextEvent.dialogueSpeaker || '집사 아르노';
  const speech = nextEvent.dialogueText || '"각하, 다음 조치를 결정해 주십시오."';
  const fullNarrative = `${narrativeText}

시간이 흘러 ${newDateLocation.split('/')[0].trim()}이 되었습니다.
${nextEvent.narrativeTemplate}

${speaker}가 다가와 고했습니다.
${speech}
[역사적 고증: 확인됨]`;

  // 9. 새 특성 병합
  const existingTraits = [...(currentState.traits || [])];
  newTraitsToAdd.forEach(traitName => {
    if (!existingTraits.some(t => t.name === traitName)) {
      existingTraits.push({
        category: '전문특성',
        name: traitName,
        tier: '확립된 특성',
        description: '최근의 영웅적 결단을 통해 획득한 특성',
        isNew: true
      });
    }
  });

  // 10. 세력 상태 갱신
  const updatedFactionState = {
    ...(currentState.factionState || {}),
    '세력 재정': `금화 ${finalGold}`
  };

  // 11. ParsedState 규격으로 조립
  const nextParsedState: ParsedState = {
    ...currentState,
    dateLocation: newDateLocation,
    judgment: {
      result: judgmentResult,
      positive: positiveFactor,
      negative: negativeFactor
    },
    narrative: fullNarrative,
    personalInfo: {
      ...(currentState.personalInfo || {}),
      '나이': `${updatedAge}`
    },
    traits: existingTraits,
    factionState: updatedFactionState,
    inventory: {
      ...(currentState.inventory || {}),
      '소지 화폐': [`금화 ${finalGold}`, '은화 30']
    },
    choices: nextEvent.choices.map((c, idx) => ({
      id: c.id,
      type: `${idx + 1}번`,
      text: c.text,
      probability: c.probability,
      groupType: c.groupType
    }))
  };

  // 기존 자동 축적 엔진(위신/신앙/경제) 연동
  const finalizedState = applyTurnResourceAccumulation(nextParsedState, currentState);

  return {
    parsed: finalizedState,
    raw: fullNarrative
  };
}
