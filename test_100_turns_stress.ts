import { applyTurnResourceAccumulation, parseCKResources } from './src/lib/ckVisuals';
import { parsePopulationCount, calculatePopulationGrowth } from './src/lib/populationEconomy';
import { ParsedState } from './src/lib/parser';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ [STRESS FAIL]: ${msg}`);
    throw new Error(msg);
  }
}

async function run100TurnsStressTest() {
  console.log("=================================================");
  console.log("   🏰 100턴 연속 고속 시뮬레이션 스트레스 테스트  ");
  console.log("=================================================\n");

  let state: ParsedState = {
    estate: {
      level: 3,
      type: '영지',
      name: '아키텐 백작령',
      buildings: [
        { name: '식료창고', level: 2, tags: ['식료', '창고'], desc: '식량 안보' },
        { name: '대장간', level: 1, tags: ['공방', '생산'], desc: '무구 제작' }
      ]
    },
    stats: {
      innate: { '관리력': 14, '학습력': 12 },
      acquired: { '명성': '150', '위신': '150' }
    },
    personalInfo: {
      '신분': '백작',
      '나이': '28세',
      '건강': '양호'
    },
    factionState: {
      '인구': '영지민 1,200명',
      '세력 재정': '금화 250닢',
      '병력': '징집병 300명',
      '치안': '양호',
      '민심': '우수',
      '행정력': '안정',
      '개발도': '15'
    },
    previousPopulation: 1190,
    playerStatus: [],
    dateLocation: '1066년 봄 (1턴) | 아키텐 성채'
  } as any;

  let minPop = Infinity;
  let maxPop = -Infinity;
  let minGold = Infinity;
  let maxGold = -Infinity;

  for (let turn = 1; turn <= 100; turn++) {
    const prevState = JSON.parse(JSON.stringify(state));
    const nextCandidate = JSON.parse(JSON.stringify(state));

    // 턴 진행 및 자원 누적
    state = applyTurnResourceAccumulation(nextCandidate, prevState);

    const popStr = state.factionState!['인구'];
    const goldStr = state.factionState!['세력 재정'];
    const pop = parsePopulationCount(popStr);

    if (pop < minPop) minPop = pop;
    if (pop > maxPop) maxPop = pop;

    // 1. 인구 무결성 검증
    assert(!isNaN(pop) && pop > 0, `Turn ${turn}: 인구가 유효한 양수여야 함 (실제: ${popStr})`);
    assert(pop <= 50000, `Turn ${turn}: 인구 수치가 현실적 상한(50,000)을 초과함 (실제: ${pop})`);
    assert(!popStr.includes('NaN'), `Turn ${turn}: 인구 문자열에 NaN 포함 (실제: ${popStr})`);
    assert(!popStr.includes('.'), `Turn ${turn}: 인구 문자열에 소수점 포함 (실제: ${popStr})`);

    // 2. 인구 성장률 무결성 검증
    const growth = calculatePopulationGrowth(state, prevState.previousPopulation);
    assert(!isNaN(growth.growthRate), `Turn ${turn}: growthRate가 NaN입니다`);
    assert(!growth.formattedGrowth.includes('.'), `Turn ${turn}: formattedGrowth에 소수점 노출 (${growth.formattedGrowth})`);

    // 3. 재정 무결성 검증
    assert(!goldStr.includes('NaN'), `Turn ${turn}: 재정에 NaN 포함 (실제: ${goldStr})`);

    // 10턴 단위 로깅
    if (turn % 20 === 0 || turn === 1 || turn === 100) {
      console.log(`[Turn ${String(turn).padStart(3, ' ')}] 인구: ${popStr.padEnd(16, ' ')} | 재정: ${goldStr.padEnd(16, ' ')} | 턴당 성장: ${growth.formattedGrowth}`);
    }
  }

  console.log("\n-------------------------------------------------");
  console.log(`✅ 스트레스 테스트 100턴 완료`);
  console.log(`📊 인구 변동 범위: ${minPop.toLocaleString()}명 ~ ${maxPop.toLocaleString()}명`);
  console.log(`🛡️ 모든 턴에서 NaN, 소수점 오염, 기하급수 폭증(자릿수 누적) 0건 감지.`);
  console.log("-------------------------------------------------\n");
}

run100TurnsStressTest().catch(err => {
  console.error("Stress Test Failed:", err);
  process.exit(1);
});
