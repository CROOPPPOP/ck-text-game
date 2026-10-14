import { parsePopulationCount, calculatePopulationGrowth } from './src/lib/populationEconomy';
import { applyTurnResourceAccumulation } from './src/lib/ckVisuals';
import { sanitizePopulationState } from './src/lib/saveManager';
import { ParsedState } from './src/lib/parser';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${msg}`);
    throw new Error(msg);
  }
}

async function runNumberFormattingTests() {
  console.log("=== [1] 인구 파싱 및 비정상 수치 캡(Sanity Cap) 테스트 ===");
  
  // 1-1. 일반 콤마 문자열
  assert(parsePopulationCount('1,250명') === 1250, '1,250명은 1250으로 파싱되어야 함');
  assert(parsePopulationCount('단원 24명') === 24, '단원 24명은 24로 파싱되어야 함');
  assert(parsePopulationCount('영지민 15,400명 (보통)') === 15400, '15,400명은 15400으로 파싱되어야 함');

  // 1-2. 11억 등 비정상 오염 수치 감지 및 캡
  const capped = parsePopulationCount('1,100417322명');
  assert(capped === 1200, `비정상 수치는 안전치(1200)로 캡되어야 함, 실제: ${capped}`);
  console.log("✅ PASS: 인구 파싱 및 비정상 수치 캡 정상 작동");

  console.log("\n=== [2] 과밀 패널티 및 증감률 정수화 테스트 ===");
  const mockState: ParsedState = {
    estate: { level: 1, type: '장원', name: '테스트 장원', buildings: [] },
    factionState: { '인구': '영지민 1,200명' }
  } as any;

  // 수용 한도 250명인데 인구 1200명이면 과밀 발생
  const growth = calculatePopulationGrowth(mockState, 1195);
  assert(!growth.formattedGrowth.includes('.'), `인구 증감률에 소수점이 노출되지 않아야 함: ${growth.formattedGrowth}`);
  assert(Boolean(growth.recentDeltaLabel?.includes('▲ +5명') || growth.recentDeltaLabel?.includes('+5명')), `델타 라벨 정상 표기 확인: ${growth.recentDeltaLabel}`);
  assert(growth.growthRate > -100, `과밀 패널티가 -1억명처럼 폭주하지 않고 정상 범위여야 함: ${growth.growthRate}`);
  console.log(`✅ PASS: 인구 성장률(${growth.formattedGrowth}) 및 델타(${growth.recentDeltaLabel}) 정수/콤마 표기 정상`);

  console.log("\n=== [3] 턴 경과 자원 누적 시 콤마 유지 및 자릿수 누적 버그 방지 테스트 ===");
  // '1,100명' 상태에서 턴을 넘겼을 때 '1,1101명'처럼 자릿수가 이어붙지 않고 정상 콤마 표기되는지
  let curState: ParsedState = {
    estate: { level: 3, type: '장원', name: '테스트 영지', buildings: [] },
    factionState: {
      '인구': '영지민 1,100명',
      '세력 재정': '금화 1,500닢'
    },
    previousPopulation: 1095
  } as any;

  // 5턴 연속 턴 진행
  for (let t = 1; t <= 5; t++) {
    const prevState = JSON.parse(JSON.stringify(curState));
    // AI가 인구를 그대로 복사했다고 가정
    const nextCandidate = JSON.parse(JSON.stringify(curState));
    curState = applyTurnResourceAccumulation(nextCandidate, prevState);

    const popStr = curState.factionState!['인구'];
    const goldStr = curState.factionState!['세력 재정'];

    // 자릿수 검증: 인구 문자열에 1,100xxx 같은 비정상 결합이 없어야 함
    assert(!popStr.includes('1,100') || popStr.length < 15, `인구 문자열 자릿수 누적 감지됨: ${popStr}`);
    const popNum = parsePopulationCount(popStr);
    assert(popNum >= 1100 && popNum <= 1200, `5턴 경과 인구가 정상 범위(1100~1200) 내여야 함: ${popNum}`);

    // 재정 콤마 검증
    assert(goldStr.includes('금화'), `재정 화폐 단위 유지: ${goldStr}`);
    assert(!goldStr.includes('NaN'), `재정에 NaN 없어야 함: ${goldStr}`);
  }
  console.log(`✅ PASS: 5턴 후 최종 인구: ${curState.factionState!['인구']}, 재정: ${curState.factionState!['세력 재정']}`);

  console.log("\n=== [4] 세이브 데이터 자동 치유 (Self-Healing Migration) 테스트 ===");
  const corruptedSave = {
    estate: { level: 2 },
    factionState: {
      '인구': '1,100417322명'
    },
    previousPopulation: 1100417322
  };

  const healed = sanitizePopulationState(corruptedSave);
  const healedCount = parsePopulationCount(healed.factionState['인구']);
  assert(healedCount === 600, `Lv.2 거점의 오염된 인구가 600명으로 정상 치유되어야 함: ${healedCount}`);
  assert(healed.factionState['인구'] === '영지민 600명(안정)', `치유된 문자열 포맷 일치: ${healed.factionState['인구']}`);
  console.log("✅ PASS: 11억 오염 세이브 자동 복구 성공");

  console.log("\n🎉 ALL NUMBER FORMATTING TESTS PASSED! 🎉");
}

runNumberFormattingTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
