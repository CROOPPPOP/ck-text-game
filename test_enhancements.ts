import { checkStatusPromotion } from './src/lib/statusPromotion';
import { parsePersonalRelation, parseAllPersonalRelations, formatNPCAgendasForPrompt } from './src/lib/characterRelations';
import { calculateFactionHostility, parseFactionRelation, getHighestThreatFaction, formatFactionHostilityForPrompt, mergeAndDeduplicateFactionRelations } from './src/lib/factionRelations';
import { sanitizeEstateState } from './src/lib/estate';
import { parseLLMResponse } from './src/lib/parser';
import { parseCKResources } from './src/lib/ckVisuals';

console.log('=== [1] 신분 승격 기준 명확화 (Status Promotion SSOT) 검증 ===');

const bishopState: any = {
  personalInfo: {
    '신분': '사제',
    '직위': '본당 신부',
    '이름': '율리아누스',
    '종교': '가톨릭'
  },
  stats: {
    innate: { '지능': '85', '의지력': '80' },
    acquired: { '신앙': '180', '교단 발언권': '150', '행정력': '75', '무기 숙련도': '40' }
  },
  estate: {
    name: '몬테펠트로 사제관',
    level: 2,
    type: '수도원 장원'
  },
  relationships: {
    personal: [
      '[오도 주교 (교구장)] | 신뢰도 [85] - [신뢰] | 우정도 [60] - [친우] | 관계: [상급자] 교구의 직속 상관'
    ]
  }
};

const promoReport = checkStatusPromotion(bishopState);
console.log('- 현재 신분:', promoReport.currentRank, '| 아키타입:', promoReport.archetype);
console.log('- 승격 가능 여부:', promoReport.overallCanPromote);
console.log('- 다음 승격 대상 목록 수:', promoReport.possibleTargets.length);

promoReport.possibleTargets.forEach((t, i) => {
  console.log(`  [목표 ${i + 1}] ${t.targetRank} (${t.targetArchetype})`);
  console.log(`    * 승격 경로: [${t.pathway}] ${t.pathwayLabel}`);
  t.requirements.forEach(r => {
    console.log(`    * ${r.label}: ${r.current} / 요구 ${r.target} (충족: ${r.met})`);
  });
  console.log(`    * 해금 권능 및 혜택 수: ${t.benefits.length}개 -> [${t.benefits[0]}]`);
});

if (promoReport.possibleTargets.length === 0 || !promoReport.possibleTargets[0].benefits || !promoReport.possibleTargets[0].pathwayLabel) {
  throw new Error('승격 기준 명확화 검증 실패: 승격 경로 및 영구 혜택 누락');
}
console.log('✅ 신분 승격 기준 명확화 검증 통과!\n');


console.log('=== [2] NPC 지능 보강 (NPC Dynamic Agendas) 검증 ===');

const testPersonalRels = [
  '[베아트리체 (토착 장원 미망인)] | 신뢰도 [75] - [신뢰] | 우정도 [65] - [친우] | 관계: [후원자] 토착 장원을 수호하고자 주교좌의 비호를 청함',
  '[엘레오노라 (카스텔로 영주 부인 겸 섭정)] | 신뢰도 [70] - [친밀] | 우정도 [55] - [친우] | 관계: [후원자] 후계자 보호 및 섭정권 보전을 위해 연대',
  '[마틸다 (마르케 백작 영애)] | 신뢰도 [80] - [신뢰] | 애정도 [85] - [사랑] | 관계: [동료] 은밀한 연인이자 영적·정치적 동반자',
  '[마테오 (우르비노 상단 행수)] | 신뢰도 [65] - [우호] | 우정도 [70] - [붕우] | 관계: [동료] 주교좌 성당 독점 납품 상인',
  '[베르나르도 (성 미카엘 수호대장)] | 신뢰도 [90] - [동반] | 우정도 [80] - [맹우] | 관계: [직속부하] 충성스러운 성당 경비 및 호위 무관',
  '[구이도 주교 (경쟁 교구장)] | 신뢰도 [10] - [경계] | 우정도 [0] - [숙적] | 관계: [적대] 플레이어의 주교 서임을 시기하는 정적'
];

const parsedNPCs = parseAllPersonalRelations(testPersonalRels, 'clergy');

parsedNPCs.forEach(npc => {
  console.log(`- ${npc.fullName}: [${npc.tierLabel}] [직능: ${npc.vocationLabel}]`);
  console.log(`  * 고유 동기: ${npc.agenda.motives.join(', ')}`);
  console.log(`  * 속마음: "${npc.agenda.innerThought}"`);
  console.log(`  * 이번 턴 행동: "${npc.agenda.proactiveAction}"`);
  if (!npc.agenda.motives || npc.agenda.motives.length === 0 || !npc.agenda.innerThought || !npc.agenda.proactiveAction) {
    throw new Error(`NPC ${npc.name} 지능 보강 데이터 누락`);
  }
});

const formattedPrompt = formatNPCAgendasForPrompt(testPersonalRels, 'clergy');
console.log('\n[LLM 주입 프롬프트 스니펫]:\n' + formattedPrompt.split('\n').slice(0, 10).join('\n') + '\n...');
console.log('✅ NPC 지능 보강 검증 통과!\n');


console.log('=== [3] 세력 적대도 명확화 (Faction Hostility 5-Tier SSOT) 검증 ===');

const testFactionRels = [
  '[우르비노 주교좌 대성당] - 주종 관계(교구 재정관 겸 수석위원) | 위협도: 안전 | 태도: 우호적',
  '[카스텔로 백작령] - 정략적 우호 관계 | 위협도: 보통 | 태도: 신중함',
  '[말라테스타 용병단] - 영지 국경 침범 및 통행세 요구 | 위협도: 위험 | 태도: 적대적 | 적대도: 72',
  '[체세나 공국 기사단] - 영토 분쟁 및 전면 공성 위협 | 위협도: 치명적 | 태도: 증오 | 적대도: 92'
];

testFactionRels.forEach(fStr => {
  const parsed = parseFactionRelation(fStr);
  const h = parsed.hostility;
  console.log(`- ${parsed.cleanName}: [${h.tierLabel}] 점수: ${h.score}/100, 색상: ${h.color}`);
  console.log(`  * 직면 위협: ${h.activeThreats.join(' · ')}`);
  console.log(`  * 완화 방안: ${h.mitigationTips.join(' · ')}`);
});

const highestThreat = getHighestThreatFaction(testFactionRels);
console.log('\n- 최고 위협 세력 탐지:', highestThreat.factionName, '| Tier:', highestThreat.maxHostility.tierLabel, '| Top HUD 경보 발령 여부:', highestThreat.hasThreat);

if (!highestThreat.hasThreat || highestThreat.maxHostility.tier < 3) {
  throw new Error('세력 적대도 최고 위협 감지 오류');
}

const formattedFactionPrompt = formatFactionHostilityForPrompt(testFactionRels);
console.log('\n[LLM 외교 주입 프롬프트]:\n' + formattedFactionPrompt);
console.log('✅ 세력 적대도 명확화 검증 통과!\n');


console.log('=== [4] Vercel 업로드 로컬 저장 파일 자가 치유 (Self-Healing) 검증 ===');

const dirtyVercelSave: any = {
  personalInfo: {
    '신분': '주교',
    '직위': '우르비노 보좌주교',
    '칭호': '막후의 지배자',
    '이름': '율리아누스',
    '교단 발언권': '10' // 과거 10점 버그 데이터
  },
  stats: {
    acquired: {
      '위신': '10', // 과거 10점 버그 데이터
      '신앙': '150'
    }
  },
  estate: {
    type: '수도원 장원',
    level: 2,
    buildings: [
      { name: '올리브 압착장', level: 1, desc: '신형 나선식 압착기 가동 중' } // 과거 1레벨 롤백 데이터
    ]
  },
  buildOptions: [
    '장원 올리브 압착장 Lv.1→2 [생산] | 비용: 은화 30 | 3턴 | 효과: 올리브유 생산' // 중복 옵션
  ],
  _constructionQueue: [
    { building: '올리브 압착장 업그레이드', targetLevel: 2, turnsLeft: 1 } // 중복 큐
  ],
  relationships: {
    personal: [
      '[베아트리체 (토착 장원 미망인)] | 신뢰도 [75] - [신뢰] | 우정도 [60] - [친우] | 관계: [상급자] 과거 오분류',
      '[엘레오노라 (카스텔로 영주 부인)] | 신뢰도 [70] - [친밀] | 우정도 [55] - [친우] | 관계: [상급자] 과거 오분류',
      '[마테오 (우르비노 상단 행수)] | 신뢰도 [65] - [우호] | 우정도 [60] - [친우] | 관계: [후원자] 과거 오분류',
      '[마틸다] | 신뢰도 [80] - [신뢰] | 애정도 [85] - [사랑] | 관계: [동료] 정인'
    ],
    faction: [
      '[우르비노 주교좌 대성당] - 주종 관계 | 위협도: 안전 | 태도: 우호적',
      '[우르비노 주교좌 성당] - 주종 관계(교구 재정관) | 위협도: 안전 | 태도: 우호적' // 중복 분할 세력
    ]
  }
};

const healedSave = sanitizeEstateState(dirtyVercelSave);

// 검증 1: 베아트리체 & 엘레오노라 -> 후원자 정정
const beatrice = healedSave.relationships.personal.find((r: string) => r.includes('베아트리체'));
const eleonora = healedSave.relationships.personal.find((r: string) => r.includes('엘레오노라'));
const matteo = healedSave.relationships.personal.find((r: string) => r.includes('마테오'));

console.log('- 치유된 베아트리체:', beatrice);
console.log('- 치유된 엘레오노라:', eleonora);
console.log('- 치유된 마테오:', matteo);

if (beatrice.includes('[상급자]') || !beatrice.includes('[후원자]')) throw new Error('베아트리체 상급자 정정 실패');
if (eleonora.includes('[상급자]') || !eleonora.includes('[후원자]')) throw new Error('엘레오노라 상급자 정정 실패');
if (matteo.includes('[상급자]') || matteo.includes('[후원자]') || !matteo.includes('[동료]')) throw new Error('마테오 동료 정정 실패');

// 검증 2: 마틸다 로맨스 및 맹우 타이틀 오염 없음 확인
const parsedMatilda = parsePersonalRelation(healedSave.relationships.personal[3], 'clergy');
console.log('- 마틸다 파싱 결과:', parsedMatilda.name, '| 애정라벨:', parsedMatilda.affLabel, '| 단계:', parsedMatilda.affStage, '| isRomance:', parsedMatilda.isRomance);
if (!parsedMatilda.isRomance || parsedMatilda.affLabel !== '애정도' || parsedMatilda.affStage.includes('맹우')) {
  throw new Error('마틸다 애정도 / 맹우 타이틀 분리 실패');
}

// 검증 3: 올리브 압착장 Lv.2 복구 및 중복 제거
const oliveBuilding = healedSave.estate.buildings.find((b: any) => b.name.includes('올리브'));
console.log('- 복구된 올리브 압착장 레벨:', oliveBuilding.level);
console.log('- buildOptions 수:', healedSave.buildOptions.length);
console.log('- constructionQueue 수:', healedSave._constructionQueue.length);

if (oliveBuilding.level !== 2) throw new Error('올리브 압착장 Lv.2 복원 실패');
if (healedSave.buildOptions.length !== 0) throw new Error('올리브 중복 옵션 제거 실패');
if (healedSave._constructionQueue.length !== 0) throw new Error('올리브 중복 큐 제거 실패');

// 검증 4: 세력 관계 중복 병합
console.log('- 치유된 세력 목록 수:', healedSave.relationships.faction.length);
if (healedSave.relationships.faction.length !== 1) throw new Error('세력 관계 중복 병합 실패');

// 검증 5: 위신 10점 버그 원천 치유 후 dynamic resources 산정 검증
const resources = parseCKResources(healedSave);
console.log('- 치유 후 교단 발언권/위신:', resources.prestige, '| 신앙:', resources.piety);
console.log('- 턴 당 위신 증가치:', resources.prestigeGain.formattedGain, '| 턴 당 신앙 증가치:', resources.pietyGain.formattedGain);

if (resources.prestigeScore <= 25) {
  throw new Error('위신 10점 버그 치유 실패: 여전히 25점 이하');
}
console.log('✅ Vercel 업로드 로컬 저장 파일 자가 치유 검증 통과!\n');


console.log('=== [5] 출력의 불안정성 및 오류 복원 테스트 (Parser Stress Test) ===');

// AI가 서식을 깨뜨리거나 비표준 문자열을 반환했을 때의 내구성 테스트
const malformedLLMOutput = `
【 판정 결과 】
[최종 결과]: 대성공
[긍정적 요인(핵심 및 보조 증거)]: 교구 재정관으로서의 탁월한 행정력과 베아트리체의 전폭적 올리브유 헌납
[부정적 요인(배제 증거)]: 없음

【 날짜 / 위치 】
1067년 04월 15일 / 우르비노 주교좌 대성당 [턴 수: 14]

【 주변 정세 및 환경 】
[국경 동향]: 말라테스타 용병대의 무력 시위 발생
[내부 상황]: 십일조 수입 증대로 신도들의 환호
[전략적 동향]: 로마 교황청의 특사 파견 임박

【 현재 상황 】
"주교님, 토스카나로부터 은밀한 전령이 당도했습니다."
숨을 헐떡이며 서재로 들어선 베르나르도가 양피지를 올렸다.

【 개인 정보 】
이름: 율리아누스 | 나이: 34세 | 성별: 남성 | 신분: 주교/보좌주교(임시) | 직위: 우르비노 보좌주교 | 종교: 가톨릭 | 칭호: 막후의 지배자

【 플레이어 상태 】
[건강](92, 최상 — 양호함)
[체력](85, 최상 — 활력 넘침)
[통증](0, 최상 — 없음)
[허기](15, 최상 — 포만감)
[갈증](10, 최상 — 적절함)
[피로](20, 안전 — 양호)
[체온](36.8°C, 최상 — 정상)

【 외교 및 인간 관계 】
▶ <인간 관계>: [베아트리체 (토착 장원 미망인)] | 신뢰도 [80] - [신뢰] | 우정도 [70] - [붕우] | 관계: [후원자] 장원 올리브유 헌납
▶ <세력 관계>: [체세나 공국] - 영토 분쟁 중 | 위협도: 치명적 | 태도: 증오

【 영지 및 야영지 상태 】
[거점 형태]: 우르비노 주교좌 성당 및 장원
[거점 규모]: Lv.2 장원
▶ [장원 올리브 압착장 Lv.2] [생산]: 나선식 압착기 완공 가동

【 OOO 선택지 】
1. [외교] 체세나 공국에 교황청 중재 친서를 보내 긴장을 완화한다.
   └ 예상 성공 가능성: 60% ~ 75%
2. [군사] 베르나르도에게 수호대를 이끌고 국경 순찰을 강화하도록 명한다.
   └ 예상 성공 가능성: 70% ~ 85%
`;

const parsedLLM = parseLLMResponse(malformedLLMOutput);
console.log('- 파싱된 신분 (단일 정규화):', parsedLLM.personalInfo?.['신분']);
console.log('- 파싱된 인물 관계 수:', parsedLLM.relationships?.personal.length);
console.log('- 파싱된 세력 관계 수:', parsedLLM.relationships?.faction.length);
console.log('- 파싱된 선택지 수:', parsedLLM.choices?.length);

if (parsedLLM.personalInfo?.['신분'] !== '주교') {
  throw new Error('슬래시 복수 신분 정규화 실패: ' + parsedLLM.personalInfo?.['신분']);
}

if (!parsedLLM.choices || parsedLLM.choices.length !== 2) {
  throw new Error('선택지 파싱 실패');
}

console.log('✅ 출력 불안정성 및 오류 복원 테스트 통과!\n');
console.log('🎉 모든 핵심 시스템 기능(승격 기준 명확화, NPC 지능 보강, 적대도 명확화, Vercel 세이브 파일 호환 치유, 출력 안정성)이 완벽히 검증되었습니다!');
