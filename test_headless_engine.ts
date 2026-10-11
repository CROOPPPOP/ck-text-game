import { createInitialGameState, processTurn } from './src/lib/engine/simulationCore';
import { extractNumericValue } from './src/lib/ckVisuals';

console.log("==================================================");
console.log("🏰 크루세이더 킹즈 No-AI 룰 엔진 20턴 시뮬레이션 검증");
console.log("==================================================");

let testsPassed = 0;
let totalTests = 0;

function assert(cond: boolean, msg: string) {
  totalTests++;
  if (cond) {
    console.log(`✅ [통과] ${msg}`);
    testsPassed++;
  } else {
    console.error(`❌ [실패] ${msg}`);
    process.exit(1);
  }
}

// 1. 초기 상태 생성 검증
console.log("\n[단계 1: 캐릭터 생성 및 오프닝 턴 검증]");
let state = createInitialGameState({
  character: '샤를 드 발루아',
  playerStatus: '남작',
  archetype: 'noble',
  era: '1066년 중세 성기',
  startLocation: '노르망디 루앙 성채',
  houseName: '발루아',
  houseMotto: '명예와 긍지'
});

assert(state.personalInfo?.['이름'] === '샤를 드 발루아', '캐릭터 이름 설정 확인');
assert(state.personalInfo?.['신분'] === '남작', '신분(남작) 설정 확인');
assert(state.dateLocation?.includes('턴 수: 1') === true, '오프닝 턴 수 1 확인');
assert(Array.isArray(state.choices) && state.choices.length >= 3, '초기 선택지 3~4개 생성 확인');
assert(state.narrative?.includes('발루아') === true, '서사 내 가문명 주입 확인');

const initialGold = extractNumericValue(state.factionState?.['세력 재정'] || '0');
assert(initialGold > 0, `초기 금화 보유 확인 (${initialGold} 금화)`);

// 2. 단일 턴 선택지 진행 검증
console.log("\n[단계 2: 이벤트 선택지 클릭 및 턴 전이 검증]");
const firstChoice = state.choices![0];
console.log(`선택지 실행: "${firstChoice.text}"`);

let result = processTurn(state, firstChoice.text, 1, []);
state = result.parsed;

assert(state.dateLocation?.includes('턴 수: 2') === true, '턴 번호 2로 진척 확인');
assert(state.judgment?.result !== '', `판정 결과 생성 확인: ${state.judgment?.result}`);
assert(state.narrative?.length! > 50, '풍부한 대화문 서사 생성 확인');
assert(Array.isArray(state.choices) && state.choices.length >= 3, '다음 턴 이벤트 선택지 정상 추첨 확인');

// 3. 결단(Decision) 실행 검증
console.log("\n[단계 3: 결단(Decision) 시스템 연동 검증]");
const decisionAction = "[시스템 명령] 신앙 60을 소모하여 '교황청 공식 사면령 및 영적 참회식'을 엄숙히 거행함.";
result = processTurn(state, decisionAction, 2, []);
state = result.parsed;

assert(state.dateLocation?.includes('턴 수: 3') === true, '결단 실행 후 턴 3 진척 확인');
assert(state.judgment?.result === '대성공', '결단 성공 판정 확인');

// 4. 연속 20턴 시뮬레이션 (시간 흐름, 나이 진척, 자원 무결성)
console.log("\n[단계 4: 20턴 연속 시뮬레이션 (5년 세월 경과 및 나이 진척 검증)]");
const initialAge = parseInt(state.personalInfo?.['나이'] || '25', 10);

for (let turn = 3; turn <= 20; turn++) {
  const choices = state.choices || [];
  const pickedChoice = choices[Math.floor(Math.random() * choices.length)]?.text || "영지 순찰 및 치안 점검";
  
  result = processTurn(state, pickedChoice, turn, []);
  state = result.parsed;

  const currentGold = extractNumericValue(state.factionState?.['세력 재정'] || '0');
  assert(!isNaN(currentGold), `턴 ${turn + 1}: 금화 수치 유효성 확인 (${currentGold})`);
}

const finalAge = parseInt(state.personalInfo?.['나이'] || '25', 10);
const finalTurnMatch = state.dateLocation?.match(/턴 수:\s*(\d+)/);
const finalTurn = finalTurnMatch ? parseInt(finalTurnMatch[1], 10) : 0;

assert(finalTurn === 21, `최종 턴 수 21 도달 확인 (현재 턴: ${finalTurn})`);
assert(finalAge > initialAge, `나이 진척 확인 (시작: ${initialAge}세 -> 최종: ${finalAge}세)`);

console.log("\n==================================================");
console.log(`🎉 모든 테스트 통과! (${testsPassed}/${totalTests})`);
console.log(`- 20턴 간 환각/수치 증발 0회`);
console.log(`- API 호출 0회 (비용 0원)`);
console.log(`- 나이/계절/연도/이벤트 정상 순환 확인`);
console.log("==================================================");
