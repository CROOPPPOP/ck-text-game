// test_legacy_save_compatibility.ts
// Tests compatibility with legacy save files stored in browser localStorage from earlier Vercel deployments.

import { parseCKResources, detectPlayerArchetype, calculateTurnIncome } from './src/lib/ckVisuals';
import { parseAllPersonalRelations } from './src/lib/characterRelations';
import { checkStatusPromotion } from './src/lib/statusPromotion';
import { getUpgradeCandidates } from './src/lib/estate';
import { calculatePopulationGrowth } from './src/lib/populationEconomy';
import { createSlotMetadata, SaveSlotData } from './src/lib/saveManager';
import { ParsedState } from './src/lib/parser';

let passCount = 0;
let totalCount = 0;

function assert(cond: boolean, desc: string) {
  totalCount++;
  if (cond) {
    console.log(`✅ [PASS] ${desc}`);
    passCount++;
  } else {
    console.error(`❌ [FAIL] ${desc}`);
  }
}

console.log("==================================================");
console.log("🛡️ RUNNING VERCEL LOCAL STORAGE COMPATIBILITY TESTS");
console.log("==================================================\n");

// CASE 1: Extreme Legacy V1 Save (Early deployment: No estate, minimal factionState)
console.log("--- CASE 1: Extreme Legacy V1 Save ---");
const legacyV1Save: any = {
  narrative: "당신은 오랜 방랑 끝에 작은 마을의 영주가 되었습니다.",
  dateLocation: "1066년 10월, 잉글랜드 남부",
  personalInfo: {
    '이름': '기욤',
    '신분': '기사',
    '칭호': '정복자'
  },
  factionState: {
    '인구': '보통',
    '치안': '낮음',
    '민심': '불안'
  },
  inventory: {
    wealth: '금화 50닢',
    weapons: ['강철 롱소드']
  },
  relationships: {
    personal: ['오도 주교 (신뢰 40 / 호감 50): 충성스러운 이복형제'],
    faction: []
  },
  choices: [
    { text: '군대를 소집한다.', command: 'gather_army' }
  ]
};

// Test 1.1: parseCKResources safely falls back without exceptions
try {
  const resV1 = parseCKResources(legacyV1Save);
  assert(resV1 !== null && typeof resV1 === 'object', "V1 save: parseCKResources executes safely without crashing");
  assert(resV1.gold.includes('50') || resV1.gold.includes('금화'), "V1 save: gold parsed correctly");
  assert(resV1.populationGrowth?.currentPopulation === 0, "V1 save: non-numeric population safely defaults to 0 without NaN error");
} catch (e: any) {
  assert(false, `V1 save crashed in parseCKResources: ${e.message}`);
}

// Test 1.2: calculateTurnIncome handles empty building estate safely
try {
  const incomeV1 = calculateTurnIncome(legacyV1Save);
  assert(incomeV1.grossIncome >= 0, "V1 save: income calculation executes safely");
  assert(typeof incomeV1.formattedNet === 'string', "V1 save: formattedNet is valid string");
} catch (e: any) {
  assert(false, `V1 save crashed in calculateTurnIncome: ${e.message}`);
}

// Test 1.3: createSlotMetadata works safely
try {
  const metaV1 = createSlotMetadata('slot_1', legacyV1Save, 3);
  assert(metaV1.characterName === '기욤', "V1 save: metadata retains characterName");
  assert(metaV1.turn === 3, "V1 save: metadata preserves turn");
} catch (e: any) {
  assert(false, `V1 save crashed in createSlotMetadata: ${e.message}`);
}

// CASE 2: V2 Save (User's Parish State before Population & Upgrades update)
console.log("\n--- CASE 2: V2 Save (Clergy Parish Real State) ---");
const legacyV2ClergySave: ParsedState = {
  narrative: "성 미카엘 축일 미사가 끝난 후, 사제관에서 밀린 장부를 점검합니다.",
  dateLocation: "서기 1120년 9월 29일, 롬바르디아 교구 본당 [턴 수: 14]",
  personalInfo: {
    '이름': '토마스',
    '신분': '사제',
    '직위': '본당 주임사제',
    '나이': '34세',
    '문화': '북이탈리아',
    '종교': '가톨릭'
  },
  factionState: {
    '인구': '교구민 120명 (수도사 12명)',
    '세력 재정': '은화 145닢',
    '행정력': '우수 (82%)',
    '병력': '성 미카엘 수호대 10명',
    '치안': '평온함 (80%)',
    '민심': '깊은 신앙 (95%)'
  },
  estate: {
    level: 'Lv.2 교구 본당',
    type: '교구 본당',
    buildings: [
      { name: '본당 예배당', level: 1, desc: '석조 예배당', tags: ['신앙'] },
      { name: '석조 종탑 및 회랑', level: 1, desc: '주변 경계와 기도 시간 알림', tags: ['신앙', '치안'] },
      { name: '성물 안치실', level: 1, desc: '성인의 유해 보관', tags: ['신앙', '문화'] },
      { name: '사제관 및 서재', level: 1, desc: '교구 문서 필사 및 집무실', tags: ['행정', '학문'] },
      { name: '장원 올리브 압착장', level: 1, desc: '기름 생산 및 판매', tags: ['생산', '재정'] },
      { name: '성당 식료창고', level: 1, desc: '곡물 및 포도주 저장고', tags: ['민생', '보급'] }
    ]
  },
  relationships: {
    personal: [
      '[호위 수사] 베르나르도 (신뢰 85 / 호감 80): 성 미카엘 수호대장. 주임사제를 호위함.',
      '[동료] 마테오 (신뢰 90 / 호감 85): 주교좌 상단 소속 무역상.',
      '마르코 대주교 (신뢰 75 / 호감 70): 밀라노 대교구장.'
    ],
    faction: []
  },
  choices: []
};

// Test 2.1: Population growth with legacy save (no previousPopulation)
const popV2 = calculatePopulationGrowth(legacyV2ClergySave, undefined);
assert(popV2.currentPopulation === 120, "V2 save: pop parsed as exactly 120");
assert(popV2.delta === undefined, "V2 save: delta safely undefined without crash");
assert(popV2.recentDeltaLabel === undefined, "V2 save: recentDeltaLabel safely undefined");
assert(popV2.growthRate > 0, "V2 save: calculates healthy positive growth rate");
assert(popV2.maxCapacity === 300, "V2 save: capacity calculated as 300");

// Test 2.2: Building upgrade candidates derivation
const upgCandidates = getUpgradeCandidates(2, legacyV2ClergySave.estate?.buildings || [], 'clergy', 15);
assert(upgCandidates.length === 6, "V2 save: exactly 6 upgrade candidates generated");
assert(upgCandidates.every(c => c.formattedCost.includes('은화')), "V2 save: all candidates use 은화 currency");
assert(upgCandidates.every(c => !c.formattedCost.includes('단위')), "V2 save: no candidates contain invalid '단위'");

// Test 2.2-b: Safeguard test with missing/undefined buildings
const safeEmptyCandidates = getUpgradeCandidates(1, undefined as any, 'noble');
assert(safeEmptyCandidates.length === 0, "Missing buildings safely returns empty array without throwing");

// Test 2.3: Bernardo and Mateo classification in legacy save
const relsV2 = parseAllPersonalRelations(legacyV2ClergySave.relationships?.personal || [], 'clergy');
console.log("Parsed relsV2:", JSON.stringify(relsV2, null, 2));
const bernardo = relsV2.find(r => r.name === '베르나르도');
const mateo = relsV2.find(r => r.name === '마테오');
const bishop = relsV2.find(r => r.name.includes('마르코'));

assert(bernardo?.tierId === 'subordinate', `V2 save: Bernardo is subordinate (found: ${bernardo?.tierId})`);
assert(!bernardo?.tierLabel.includes('수사'), "V2 save: Bernardo is military, not monk");
assert(mateo?.tierId === 'peer', `V2 save: Mateo is peer, not superior (found: ${mateo?.tierId})`);
assert(bishop?.tierId === 'superior', "V2 save: Bishop Marco is superior");

// CASE 3: Corrupted / Partial String Save Data
console.log("\n--- CASE 3: Corrupted / Incomplete String Data ---");
const malformedSave: any = {
  narrative: "위기 상황입니다.",
  buildOptions: [
    { name: '[곡물 저장고', cost: '30 금화', turns: 2, desc: '닫히지 않은 대괄호' },
    { name: 'Lv.1 -> 2 강화 시설', cost: '', turns: 1, desc: '비용 누락' }
  ],
  personalInfo: {
    '이름': '알렉시오스',
    '신분': '수도원장'
  },
  factionState: {
    '인구': '피난민 대거 유입 (약 850여 명)'
  }
};

const malformedPop = calculatePopulationGrowth(malformedSave, undefined);
assert(malformedPop.currentPopulation === 850, "Malformed save: parses 850 from complex text");
const malformedRes = parseCKResources(malformedSave);
assert(malformedRes !== null, "Malformed save: parseCKResources succeeds without throwing");

// CASE 4: SaveSlot Serializer round-trip test (Simulating window.localStorage JSON.stringify/parse)
console.log("\n--- CASE 4: LocalStorage JSON Serialization Round-Trip ---");
const slotMeta = createSlotMetadata('slot_2', legacyV2ClergySave, 14, '사용자 저장 슬롯');
const serialized = JSON.stringify(slotMeta);
const deserialized: SaveSlotData = JSON.parse(serialized);

assert(deserialized.id === 'slot_2', "Serialized metadata ID matches");
assert(deserialized.characterName === '토마스', "Serialized metadata name matches");
assert(deserialized.gold === '은화 145닢', "Serialized metadata gold matches");
assert(deserialized.gameState.estate.buildings.length === 6, "Serialized gameState preserves all 6 buildings");

// Re-evaluating deserialized state through visual pipeline
const reloadedResources = parseCKResources(deserialized.gameState, 110);
assert(reloadedResources.populationGrowth?.delta === 10, "Reloaded state computes +10 delta from previousPopulation 110");
assert(reloadedResources.populationGrowth?.recentDeltaLabel === '▲ +10명', "Reloaded state shows '▲ +10명'");

console.log("\n==================================================");
console.log(`🏁 LOCAL STORAGE COMPATIBILITY: ${passCount} / ${totalCount} PASSED`);
if (passCount === totalCount) {
  console.log("🎉 ALL VERCEL LOCAL STORAGE COMPATIBILITY TESTS PASSED!");
  process.exit(0);
} else {
  console.error("❌ COMPATIBILITY FAILURES DETECTED");
  process.exit(1);
}
