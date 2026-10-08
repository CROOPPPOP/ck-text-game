// Comprehensive integration & output stability test suite
import { parseLLMResponse } from './src/lib/parser';
import { checkStatusPromotion, STATUS_LADDER } from './src/lib/statusPromotion';
import { getMaxHoldingCapacity, getDomainLimitBreakdown, determineRelationTier, calculateTurnIncome, parseNameAndRole, extractNumericValue } from './src/lib/ckVisuals';
import { 
  parsePersonalRelation, 
  parseAllPersonalRelations, 
  detectVocation, 
  sanitizeNameAndRole, 
  getSuperiorApprovalTrust, 
  getCouncilVassals,
  getTrustStage,
  getFriendshipStage,
  getAffectionStage
} from './src/lib/characterRelations';
import {
  calculateBuildingUpgradeCost,
  calculateEstatePromotionCost,
  getBuildingTypeMultiplier,
  getCurrencyForArchetype,
  getPlayerWealthAmount
} from './src/lib/estateEconomy';
import { getUpgradeCandidates, mergeEstateBuildings, sanitizeEstateState } from './src/lib/estate';
import { autoMigrateAndSanitizeStorage } from './src/lib/saveManager';
import { buildSystemCommands } from './src/lib/construction';
import {
  parsePopulationCount,
  getEstatePopulationCapacity,
  calculatePopulationGrowth
} from './src/lib/populationEconomy';
import { parseCKResources } from './src/lib/ckVisuals';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
  }
}

console.log("==================================================");
console.log("🚀 STARTING COMPREHENSIVE INTEGRATION & STABILITY TESTS");
console.log("==================================================\n");

// ==========================================
// TEST 1: Status Promotion Ladder Completeness (29 Presets)
// ==========================================
console.log("--- 1. Testing Status Promotion Ladder (29 Presets) ---");
const presets = Object.keys(STATUS_LADDER);
assert(presets.length === 29, `STATUS_LADDER defines exactly 29 presets (found: ${presets.length})`);

const expectedPresets = [
  '부랑자', '소작농', '평민', '도제', '용병', '학사', '음유시인', '장인', '방랑 검사', // 9 wanderers
  '도적단 두목', '촌장', '장원 관리인', '용병대장', '상단주', '길드마스터', // 6 company
  '평신도', '수사', '사제', '수도원장', '주교', '대주교', '교황', // 7 clergy
  '기사', '남작', '자작', '백작', '후작', '공작', '황제' // 7 noble
];

let allPresetsPresent = true;
expectedPresets.forEach(p => {
  if (!STATUS_LADDER[p]) {
    console.error(`Missing preset: ${p}`);
    allPresetsPresent = false;
  }
});
assert(allPresetsPresent, "All 29 specified presets are defined in STATUS_LADDER");

// Verify that each preset has valid next ranks or is apex (교황, 황제)
let validLadders = true;
presets.forEach(p => {
  const node = STATUS_LADDER[p];
  if (p === '교황' || p === '황제') {
    if (node.nextRanks.length !== 0) validLadders = false;
  } else {
    if (node.nextRanks.length === 0) validLadders = false;
  }
});
assert(validLadders, "All presets have valid next rank pathways (apex nodes terminate cleanly)");

// ==========================================
// TEST 2: Status Promotion Condition Evaluation
// ==========================================
console.log("\n--- 2. Testing Status Promotion Verification Engine ---");

// Test Clergy: Priest with low resources -> cannot promote
const mockPriestLow: any = {
  personalInfo: { '이름': '토마스', '신분': '사제', '나이': '35' },
  inventory: { '재산및병력': ['은화 20닢'] },
  estate: { level: 'Lv.1 교구 성당', buildings: [] },
  relationships: { personal: ['마르코 주교 | 신뢰도 [40] - 호기심 | 우정도 [30] | 관계: [상급자] 교구장 주교'] }
};
const priestLowReport = checkStatusPromotion(mockPriestLow);
assert(priestLowReport.currentRank === '사제', "Priest low report correctly identifies current rank");
assert(priestLowReport.overallCanPromote === false, "Priest with low resources cannot promote yet");
assert(priestLowReport.possibleTargets.length === 2, "Priest has 2 promotion paths (수도원장, 주교)");

// Test Clergy: Priest with high resources & superior trust -> can promote
const mockPriestHigh: any = {
  personalInfo: { '이름': '토마스', '신분': '사제 / 주임신부', '나이': '42세' }, // test messy status
  inventory: { '재산및병력': ['금화 160닢', '성유물 1점'] },
  stats: {
    innate: { '지능': '75', '의지력': '70' },
    acquired: { '학문': '80', '외교력': '65' }
  },
  playerStatus: [
    { name: '신앙', value: '85%', risk: '안전', description: '독실한 신앙심' }
  ],
  traits: [
    { name: '신앙심', category: '전문특성', stage: '강한 특성', description: '독실한 성품' },
    { name: '명성', category: '전문특성', stage: '강한 특성', description: '교구민의 칭송' }
  ],
  estate: { level: 'Lv.2 교구 성당', buildings: [] },
  relationships: { personal: ['마르코 대주교 | 신뢰도 [75] - 신뢰 | 애정도 [0] | 관계: [상급자] 관구장 대주교'] }
};
const priestHighReport = checkStatusPromotion(mockPriestHigh);
assert(priestHighReport.currentRank === '사제', "Sanitized messy '사제 / 주임신부' to '사제'");
assert(priestHighReport.overallCanPromote === true, "Priest with high resources & trust CAN promote");
const abbotTarget = priestHighReport.possibleTargets.find(t => t.targetRank === '수도원장');
assert(abbotTarget !== undefined && abbotTarget.canPromote === true, "Priest successfully meets all Abbot requirements");

// Test Wanderer: Vagrant to Commoner promotion
const mockVagrant: any = {
  personalInfo: { '이름': '로빈', '신분': '부랑자', '나이': '20' },
  inventory: { '재산및병력': ['동화 150닢 (은화 15닢 상당)'] },
  estate: { level: 'Lv.1 모닥불 야영지', buildings: [] },
  relationships: { personal: ['올더스 촌장 | 신뢰도 [35] - 관심 | 우정도 [40] | 관계: [후원자] 마을 촌장'] }
};
const vagrantReport = checkStatusPromotion(mockVagrant);
assert(vagrantReport.overallCanPromote === true, "Vagrant meets requirements to become Commoner/Tenant");

// ==========================================
// TEST 3: Bloodline Intrigue Output & Parsing Stability
// ==========================================
console.log("\n--- 3. Testing Bloodline Intrigue & Clandestine Lineage Parsing ---");

const sampleLLMOutputWithIntrigue = `
【 판정 결과 】
[최종 결과]: 성공
[긍정적 요인(핵심 및 보조 증거)]: 비밀리에 부인의 침실을 방문하여 애틋한 교감을 나누었습니다.
[부정적 요인(배제 증거)]: 경비병의 순찰 위험이 상존합니다.

【 날짜 / 위치 】
1142년 05월 12일 / 토스카나 백작령 [턴 수: 14]

【 주변 정세 및 환경 】
[현재 장소]: 장원 귀부인의 별채
[거리의 소문]: 백작 가문의 후계 문제가 원로들의 입에 오르내리고 있습니다.

【 개인 정보 】
이름: 안토니오 | 나이: 28세 | 성별: 남성 | 신분: 사제 | 직위: 주임 사제 | 종교: 가톨릭 | 칭호: 비밀의 사제

【 플레이어 상태 】
[건강](95%, 안전 — 양호)
[체력](90%, 안전 — 정력적)
[허기](80%, 안전 — 적정)
[갈증](85%, 안전 — 적정)
[피로](70%, 주의 — 잦은 야간 방문으로 다소 피로)
[스트레스](25%, 안전 — 안정)

【 개인 능력치 】
[선천 능력치]
근력: 55 | 체력: 65 | 지구력: 60 | 민첩성: 70 | 반사 신경: 65 | 속도: 60 | 신체 조정력: 65
지각력: 75 | 지능: 80 | 기억력: 75 | 학습 능력: 80 | 의지력: 70 | 집중력: 75

[후천 능력치]
통솔력: 50 | 매력: 85 | 외교력: 70 | 설득력: 75 | 기만술: 82 | 위협: 30
행정력: 65 | 전략: 40 | 전술: 35 | 전투력: 30 | 무기 숙련도: 25 | 기마술: 40
생존술: 50 | 의술: 60 | 학문: 75 | 기술 숙련도: 40 | 장인 기술: 30 | 은밀 행동: 88 | 수사력: 60

【 특성 및 기술 】
[전문특성] 유혹술 (확립된 특성) : 상대의 마음을 홀리는 은밀한 화술
[전문특성] 성직자 (확립된 특성) : 교단 의전과 강론 집전 능력

【 소지품 / 자원 】
▶ <장비 및 영지>:
○ [성무일도서] 라틴어 기도서
▶ <재산 및 병력>:
○ [은화 85닢] 안전하게 보관된 비자금

【 가문 및 계승 현황 】
[배우자]: 독신 서약 (비밀 연인: 베아트리체 백작부인)
[자녀]: 공식 자녀 없음
[지정 후계자]: 없음
[계승법]: 관할 교구 승계
[은밀한 혈통]:
▶ 루카 | 생모: 베아트리체 백작부인 | 공식 부친: 로렌초 백작 | 명분 영지: 토스카나 백작령 | 상태: 괴뢰 후계자 | 위험도: 35% | 요약: 백작의 적장자로 위장되어 차기 백작령 제1순위 상속자로 공인됨
▶ 줄리아 | 생모: 엘레나 미망인 | 공식 부친: 고 피에트로 남작 | 명분 영지: 루카 남작령 | 상태: 은밀한 핏줄 | 위험도: 15% | 요약: 남작 가문의 사생아로 자라는 중

【 세력 상태 】
통치 중인 영지 없음 (교구 사제)

【 외교 및 인간 관계 】
▶ <인간 관계>: 베아트리체 백작부인 | 신뢰도 [82] - 신뢰 | 애정도 [88] - 사랑 | 관계: [후원자] 밀회 / 은밀한 연인, 가문의 실질적 후원자이자 혈통 공모자
▶ <인간 관계>: 마르코 주교 | 신뢰도 [65] - 친밀 | 우정도 [55] - 친우 | 관계: [상급자] 교구장 주교

【 영지 및 야영지 상태 】
[거점 형태]: 성 베드로 본당
[거점 규모]: Lv.1 교구 성당
▶ [사제관 및 서재{Lv.1}] [행정·학문]: 교구 장부 관리 및 기도실
▶ [목조 종탑] [신앙]: 신자들을 모으는 타종

【 건설 가능 시설 】
▶ [약초원 및 조제실] [생산·의술] | 비용: 은화 40 | 3턴 | 효과: 치료용 약초 재배
▶ [목조 종탑] Lv.1→2 [신앙·문화] | 비용: 은화 50 | 2턴 | 효과: 종탑 증축 및 교구 신망 확대

【 현재 국면 및 야망 】
[현재 주요 국면]: 루카의 백작령 상속권 보장
[단기 야망]: 로렌초 백작의 사후 섭정권 확보

【 신분 승격 / 서임식 선택지 】
1. [정치 공작] 백작에게 접근하여 루카의 가정교사이자 가문 고문으로 임명받기
   └ 예상 성공 가능성: 70% ~ 85%
2. [혈통 공작] 베아트리체 부인과 모의하여 교황청 칙서 서한을 위조 준비하기
   └ 예상 성공 가능성: 45% ~ 60%
3. [교단 서품] 주교의 신임을 활용하여 수도원장 선출 추대 청원하기
   └ 예상 성공 가능성: 60% ~ 75%
`;

const parsed = parseLLMResponse(sampleLLMOutputWithIntrigue);

// Test Bloodline Intrigue Parsing
assert(parsed.familyState !== undefined, "familyState parsed correctly");
assert(Array.isArray(parsed.familyState?.intrigues), "intrigues array extracted");
assert((parsed.familyState?.intrigues || []).length === 2, `Parsed exactly 2 secret children (found: ${(parsed.familyState?.intrigues || []).length})`);

const child1 = parsed.familyState!.intrigues![0];
assert(child1.childName === '루카', `First child name is '루카' (found: ${child1.childName})`);
assert(child1.motherName === '베아트리체 백작부인', `First child mother is '베아트리체 백작부인'`);
assert(child1.officialFather === '로렌초 백작', `First child official father is '로렌초 백작'`);
assert(child1.claimTitle === '토스카나 백작령', `First child claim title is '토스카나 백작령'`);
assert(child1.stage === 'heir_puppet', `First child stage correctly identified as 'heir_puppet'`);
assert(child1.exposureRisk === 35, `First child exposure risk is 35% (found: ${child1.exposureRisk})`);

const child2 = parsed.familyState!.intrigues![1];
assert(child2.childName === '줄리아', `Second child name is '줄리아'`);
assert(child2.stage === 'secret', `Second child stage correctly identified as 'secret'`);

// ==========================================
// TEST 4: Output Stability & Defect Regressions
// ==========================================
console.log("\n--- 4. Testing Output Stability (Defect Regressions) ---");

// Regression 1: Building name tag splitting (Image 1 bug)
const buildings = parsed.estate!.buildings;
assert(buildings.length === 2, `Parsed 2 estate buildings (found: ${buildings.length})`);
const b1 = buildings[0];
assert(b1.name === '사제관 및 서재', `Building 1 name is cleanly '사제관 및 서재' (found: '${b1.name}')`);
assert(b1.tags.includes('행정') && b1.tags.includes('학문'), "Building 1 tags contains '행정' and '학문'");
assert(!b1.tags.includes('사제관') && !b1.tags.includes('및'), "Building 1 tags DOES NOT contain tokens '사제관' or '및'");

// Regression 2: Age duplication (Image 2 bug '23세세')
assert(parsed.personalInfo!['나이'] === '28', `Age parsed as numeric '28' without '세' suffix (found: '${parsed.personalInfo!['나이']}')`);

// Regression 3: Upgrade option facility name and bracket unclosed (Image 3 bug 'Lv.1→2 [치안·신앙')
const buildOpts = parsed.buildOptions || [];
assert(buildOpts.length === 2, `Parsed 2 build options (found: ${buildOpts.length})`);
const bOpt2 = buildOpts[1];
assert(bOpt2.name.includes('목조 종탑'), `Build option 2 preserves base name '목조 종탑' (found: '${bOpt2.name}')`);
assert(bOpt2.name.includes('(Lv.1→2)'), `Build option 2 formats level cleanly as '(Lv.1→2)' (found: '${bOpt2.name}')`);

// Regression 4: Choices block with special category header
assert(parsed.choices !== undefined && parsed.choices.length === 3, `Parsed 3 choices under 【 신분 승격 / 서임식 선택지 】 (found: ${parsed.choices?.length})`);
assert(parsed.choices![0].type === '정치 공작', "Choice 1 type captured as '정치 공작'");
assert(parsed.choices![0].probability.includes('70% ~ 85%'), "Choice 1 probability range captured properly");

// ==========================================
// TEST 5: Hierarchy & Relations Parsing
// ==========================================
console.log("\n--- 5. Testing Relationship Hierarchies & Special States ---");
const rels = parsed.relationships!.personal;
assert(rels.length === 2, `Parsed 2 personal relationships (found: ${rels.length})`);
const beatriceRel = rels.find(r => r.includes('베아트리체'));
assert(beatriceRel !== undefined && beatriceRel.includes('[후원자]'), "Beatrice correctly identified as [후원자] not [가신]");
assert(beatriceRel !== undefined && beatriceRel.includes('밀회'), "Beatrice correctly retains '밀회' special state");

const bishopRel = rels.find(r => r.includes('마르코 주교'));
assert(bishopRel !== undefined && bishopRel.includes('[상급자]'), "Bishop correctly identified as [상급자] not [가신]");

// ==========================================
// TEST 6: Noble & Company Promotion Checks
// ==========================================
console.log("\n--- 6. Testing Noble & Company Promotion Paths ---");

// Noble: Knight -> Baron promotion
const mockKnight: any = {
  personalInfo: { '이름': '고드프리', '신분': '기사', '나이': '29' },
  inventory: { '재산및병력': ['금화 180닢', '군마 2필', '판금 갑옷'] },
  stats: { acquired: { '무기 숙련도': '85', '전투력': '80' } },
  estate: { level: 'Lv.2 기사 장원', buildings: [] },
  relationships: { personal: ['보두앵 백작 | 신뢰도 [70] - 친밀 | 우정도 [65] | 관계: [상급자] 주군 백작'] }
};
const knightReport = checkStatusPromotion(mockKnight);
assert(knightReport.currentRank === '기사', "Knight identified correctly");
const baronTarget = knightReport.possibleTargets.find(t => t.targetRank === '남작');
assert(baronTarget !== undefined && baronTarget.canPromote === true, "Knight meets all conditions to be enfeoffed as Baron");

// Company: Mercenary Captain -> Baron promotion
const mockMercCaptain: any = {
  personalInfo: { '이름': '베르너', '신분': '용병대장', '나이': '38' },
  inventory: { '재산및병력': ['금화 250닢', '정예 보병 40명'] },
  stats: { acquired: { '통솔력': '85', '전술': '80' } },
  estate: { level: 'Lv.3 폐성 점거 숙영지', buildings: [] },
  relationships: { personal: ['루돌프 공작 | 신뢰도 [68] - 친밀 | 우정도 [50] | 관계: [후원자] 고용주 제후'] }
};
const mercReport = checkStatusPromotion(mockMercCaptain);
assert(mercReport.currentRank === '용병대장', "Mercenary Captain identified correctly");
const mercBaronTarget = mercReport.possibleTargets.find(t => t.targetRank === '남작');
assert(mercBaronTarget !== undefined && mercBaronTarget.canPromote === true, "Mercenary Captain can acquire Barony title via enfeoffment");

// ==========================================
// TEST 7: Clean Handling of Empty Bloodline
// ==========================================
console.log("\n--- 7. Testing Empty Bloodline Handling ---");
const emptyBloodlineText = `
【 개인 정보 】
이름: 윌리엄 | 나이: 25세 | 신분: 기사

【 가문 및 계승 현황 】
[배우자]: 없음
[자녀]: 없음
[지정 후계자]: 없음
[계승법]: 분할 상속
[은밀한 혈통]: 없음
`;
const parsedEmpty = parseLLMResponse(emptyBloodlineText);
assert(parsedEmpty.familyState !== undefined, "Empty familyState parsed");
assert(parsedEmpty.familyState?.secretChildren === '없음', "secretChildren is cleanly '없음'");
assert(parsedEmpty.familyState?.intrigues?.length === 0, "intrigues array is empty (length 0)");

// ==========================================
// TEST 8: Domain Limit & Holding Capacity Standards
// ==========================================
console.log("\n--- 8. Testing Domain Limit & Holding Capacity Standards ---");

// 8.1 Holding capacities across levels
assert(getMaxHoldingCapacity(1) === 3, "Lv.1 Holding capacity is exactly 3 buildings");
assert(getMaxHoldingCapacity(2) === 5, "Lv.2 Holding capacity is exactly 5 buildings");
assert(getMaxHoldingCapacity(3) === 7, "Lv.3 Holding capacity is exactly 7 buildings");
assert(getMaxHoldingCapacity(4) === 9, "Lv.4 Holding capacity is exactly 9 buildings");
assert(getMaxHoldingCapacity(5) === 12, "Lv.5 Holding capacity is exactly 12 buildings");

// 8.2 Domain limit breakdown by tier
const priestMock: any = {
  personalInfo: { '이름': '토마스', '신분': '사제' },
  estate: { level: 'Lv.2 교구 본당', type: '교구 본당', buildings: [{ name: '1' }, { name: '2' }, { name: '3' }, { name: '4' }, { name: '5' }] }
};
const priestBreakdown = getDomainLimitBreakdown(priestMock);
assert(priestBreakdown.tierBonus === 1, "Priest gets +1 Domain Limit tier bonus");
assert(priestBreakdown.base === 1, "Priest base domain limit is 1");
assert(priestBreakdown.total >= 2, `Priest total domain limit is at least 2 (found: ${priestBreakdown.total})`);
assert(priestBreakdown.maxBuildingCapacity === 5, "Lv.2 Parish Church max capacity is 5 buildings");
assert(priestBreakdown.currentBuildingsCount === 5, "Priest currently has 5 buildings");
assert(priestBreakdown.isOverCapacity === false, "5 buildings in Lv.2 parish is NOT over capacity (5 / 5)");

// 8.3 Over-capacity detection (5 buildings on Lv.1 holding)
const overMock: any = {
  personalInfo: { '이름': '가난한 수사', '신분': '수사' },
  estate: { level: 'Lv.1 작은 예배당', type: '작은 예배당', buildings: [{ name: '1' }, { name: '2' }, { name: '3' }, { name: '4' }, { name: '5' }] }
};
const overBreakdown = getDomainLimitBreakdown(overMock);
assert(overBreakdown.maxBuildingCapacity === 3, "Lv.1 Chapel max capacity is 3");
assert(overBreakdown.isOverCapacity === true, "5 buildings in Lv.1 chapel correctly flagged as over-capacity");

// ==========================================
// TEST 9: Relationship Tier Classification & Merchant Regression Test
// ==========================================
console.log("\n--- 9. Testing Relationship Tier Classification & Mateo Regression ---");

// 9.1 The Mateo case: Merchant in Cathedral Guild with [동료] tag
const mateoTagged = determineRelationTier(
  '[마테오 (우르비노 주교좌 상단 행수)]',
  '[동료] 고품질 올리브유 독점 공급 계약을 체결하고 사제의 수완과 성당의 위세에 깊은 인상을 받음.',
  '우정도 22 - 지인',
  '우르비노 주교좌 상단 행수'
);
assert(mateoTagged.id === 'peer', "Mateo with [동료] tag is classified as 'peer' (🤝 대등한 동료)");
assert(mateoTagged.id !== 'superior', "Mateo is NOT classified as 'superior' (👑 상급자 / 주군)");

// 9.2 The Mateo case without tag: Keyword fallback must not mistake '주교좌' for '주교'
const mateoUntagged = determineRelationTier(
  '마테오 (우르비노 주교좌 상단 행수)',
  '고품질 올리브유 독점 공급 계약을 체결하고 깊은 인상을 받음.',
  '우정도 22 - 지인',
  '우르비노 주교좌 상단 행수'
);
assert(mateoUntagged.id === 'peer', "Mateo even without tag is classified as 'peer' (NOT superior)");
assert(mateoUntagged.id !== 'superior', "Mateo without tag is NOT classified as 'superior'");

// 9.3 True Superior: Bishop with [상급자] tag
const trueBishop = determineRelationTier(
  '[루카 (우르비노 교구장 주교)]',
  '[상급자] 교단의 영적 지도자이자 본당 관할 주교',
  '신뢰도 70 - 친밀',
  '우르비노 교구장 주교'
);
assert(trueBishop.id === 'superior', "True Bishop is classified as 'superior' (👑 상급자 / 주군)");

// 9.4 Cathedral Altar Boy: Altar boy at Cathedral See with [직속부하] tag must not be superior
const altarBoy = determineRelationTier(
  '[줄리아노 (우르비노 주교좌 성당 복사)]',
  '[직속부하] 성당 전례와 미사를 보좌하는 충실한 복사 소년',
  '신뢰도 65 - 친밀',
  '우르비노 주교좌 성당 복사'
);
assert(altarBoy.id === 'subordinate', "Cathedral altar boy is 'subordinate' despite '주교좌' in title");
assert(altarBoy.id !== 'superior', "Cathedral altar boy is NOT superior");

// 9.5 Wealthy Merchant Patron: Merchant patron with [후원자] tag
const merchantPatron = determineRelationTier(
  '[코시모 (피렌체 메디치 상회 거상)]',
  '[후원자] 성당 건축 기금을 아낌없이 헌납하는 유력 대상인',
  '신뢰도 60 - 우호',
  '피렌체 메디치 상회 거상'
);
assert(merchantPatron.id === 'patron', "Merchant patron is classified as 'patron' (📜 후원자 / 신도)");

// 9.6 Rival/Hostile: Rival priest with [적대] tag
const rivalPriest = determineRelationTier(
  '[안토니오 (이웃 본당 주임사제)]',
  '[적대] 교구 내 영향력을 두고 끊임없이 암투를 벌이는 숙적',
  '신뢰도 10 - 경계',
  '이웃 본당 주임사제'
);
assert(rivalPriest.id === 'rival', "Rival priest is classified as 'rival' (⚔️ 숙적 / 적대)");

// 9.7 Status Promotion: Mateo does not count towards superior trust
const promotionStateWithMateo: any = {
  personalInfo: { '이름': '토마스', '신분': '수사', '위신': '80', '신앙': '80' },
  inventory: { '재화': ['금화 350닢'] },
  estate: { level: 'Lv.1 작은 예배당' },
  relationships: {
    personal: [
      '[마테오 (우르비노 주교좌 상단 행수)] | 신뢰도 90 - 동반 | 우정도 80 - 맹우 | 관계: [동료] 주교좌 상단 행수',
      '[루카 (교구장 주교)] | 신뢰도 30 - 관심 | 우정도 20 - 지인 | 관계: [상급자] 영적 지도자'
    ]
  }
};
const promoCheck = checkStatusPromotion(promotionStateWithMateo);
const reqSuperior = promoCheck.possibleTargets[0]?.requirements.find(r => r.id === 'superior');
assert(reqSuperior !== undefined, "Promotion requirement has superior approval requirement");
assert(reqSuperior?.current === 30, `Superior trust checked against Bishop (30), NOT Mateo (90) (found: ${reqSuperior?.current})`);

// ==========================================
// TEST 10: Turn Income Calculation & Financial Ledger (CK3 Economy)
// ==========================================
console.log("\n--- 10. Testing Turn Income Calculation & Financial Ledger ---");

// 10.1 Clergy archetype with Parish church, Mateo trade deal, Altar boy, Bishop
const clergyGameState: any = {
  personalInfo: { '이름': '토마스', '신분': '사제', '직위': '주임신부' },
  estate: {
    type: '교구 본당',
    level: 'Lv.2 교구 본당',
    buildings: [
      { name: '올리브 착유장', desc: '고품질 성유 및 올리브유 생산', tags: ['생산', '재정'] },
      { name: '사제관 및 서재', desc: '교구 행정 및 학문 연구', tags: ['행정', '학문'] }
    ]
  },
  factionState: {
    '병력': '성당 경비단 12명',
    '세력 재정': '은화 145닢'
  },
  relationships: {
    personal: [
      '[마테오 (우르비노 주교좌 상단 행수)] | 신뢰도 50 - 우호 | 우정도 40 - 친우 | 관계: [동료] 고품질 올리브유 독점 공급 계약 체결',
      '[줄리아노 (성당 복사)] | 신뢰도 65 - 친밀 | 우정도 45 - 친우 | 관계: [직속부하] 제단 및 미사 보좌',
      '[루카 (교구장 주교)] | 신뢰도 70 - 친밀 | 우정도 35 - 호감 | 관계: [상급자] 영적 지도자이자 교구 관할 주교'
    ]
  },
  stats: {
    acquired: { '행정력': '65' }
  }
};

const clergyIncome = calculateTurnIncome(clergyGameState);
assert(clergyIncome.currencyName === '은화', "Clergy currency is silver (은화)");
assert(clergyIncome.grossIncome > 10, `Clergy gross income is substantial (found: ${clergyIncome.grossIncome})`);
assert(clergyIncome.grossExpense > 0, `Clergy gross expense is non-zero (found: ${clergyIncome.grossExpense})`);
assert(clergyIncome.netIncome > 0, `Clergy net income is profitable (+${clergyIncome.netIncome})`);
assert(clergyIncome.formattedNet.startsWith('+'), `Formatted net income has '+' prefix (found: ${clergyIncome.formattedNet})`);

// Verify specific income & expense items
const tradeItem = clergyIncome.incomeItems.find(i => i.id.startsWith('trade_'));
assert(tradeItem !== undefined, "Mateo trade deal generates commercial revenue");
assert(tradeItem?.amount === 2.5, "Trade deal amount is exactly +2.5");

const titheItem = clergyIncome.expenseItems.find(i => i.id === 'superior_tithe');
assert(titheItem !== undefined, "Church tithe expense exists when superior bishop is present");

const altarBoyUpkeep = clergyIncome.expenseItems.find(i => i.id === 'subordinate_upkeep');
assert(altarBoyUpkeep !== undefined, "Altar boy courtier upkeep is accounted for");

// 10.2 Wanderer archetype (Vagrant with 동화)
const wandererGameState: any = {
  personalInfo: { '이름': '떠돌이', '신분': '부랑자' },
  estate: { type: '임시 거처', level: 'Lv.1', buildings: [] }
};
const wandererIncome = calculateTurnIncome(wandererGameState);
assert(wandererIncome.currencyName === '동화', "Wanderer currency is copper (동화)");
assert(wandererIncome.grossIncome >= 1.0, `Wanderer has basic survival income (found: ${wandererIncome.grossIncome})`);

// 10.3 Noble archetype with vassals
const nobleGameState: any = {
  personalInfo: { '이름': '로렌초', '신분': '남작' },
  estate: {
    type: '성채 장원',
    level: 'Lv.2 장원',
    buildings: [
      { name: '장원 제분소', desc: '곡물 제분 및 조세 수취', tags: ['생산', '재정'] }
    ]
  },
  factionState: {
    '병력': '징집병 30명',
    '세력 재정': '금화 250닢'
  },
  relationships: {
    personal: [
      '[귀도 (가신 기사)] | 신뢰도 60 - 우호 | 우정도 50 - 친우 | 관계: [직속부하] 직속 식읍 기사'
    ]
  }
};
const nobleIncome = calculateTurnIncome(nobleGameState);
assert(nobleIncome.currencyName === '금화', "Noble currency is gold (금화)");
const vassalTax = nobleIncome.incomeItems.find(i => i.id.startsWith('vassal_'));
assert(vassalTax !== undefined, "Noble receives feudal vassal tax (+1.2)");

// 10.4 Overcapacity penalty on holding upkeep
const overEstateGameState: any = {
  personalInfo: { '이름': '작은 수도사', '신분': '수사' },
  estate: {
    type: '작은 예배당',
    level: 'Lv.1 작은 예배당',
    buildings: [{ name: '1' }, { name: '2' }, { name: '3' }, { name: '4' }, { name: '5' }] // capacity is 3
  }
};
const overIncome = calculateTurnIncome(overEstateGameState);
const overPenalty = overIncome.expenseItems.find(i => i.id === 'overcapacity_penalty');
assert(overPenalty !== undefined, "Overcapacity holding triggers overcrowding expense penalty");
assert(overPenalty !== undefined && overPenalty.amount > 0, `Overcrowding penalty amount is positive (found: ${overPenalty?.amount})`);

// ==========================================
// TEST 11: Bernardo Classification & Military Subordinate Regression
// ==========================================
console.log("\n--- 11. Testing Bernardo Classification & Subordinate Military Distinction ---");
const bernardoRaw = "[베르나르도 (성 미카엘 수호대장)]";
const bernardoDesc = "[직속부하] 하사된 은화와 부대 20명 확충에 자부심을 품고 성당과 장원의 방위를 철통같이 수행함.";
const parsedBernardo = parseNameAndRole(bernardoRaw);
assert(parsedBernardo.name === '베르나르도', `Bernardo name is cleanly '베르나르도' without brackets (found: '${parsedBernardo.name}')`);
assert(parsedBernardo.role === '성 미카엘 수호대장', `Bernardo role is '성 미카엘 수호대장' (found: '${parsedBernardo.role}')`);

const bernardoTier = determineRelationTier(bernardoRaw, bernardoDesc, '우정도 38', parsedBernardo.role, '🛡️ 직속 보좌 / 복사 / 수사');
assert(bernardoTier.id === 'subordinate', "Bernardo is classified as 'subordinate'");
assert(bernardoTier.label === '🛡️ 직속 호위대 / 무관', `Bernardo military role gives '🛡️ 직속 호위대 / 무관' label (found: '${bernardoTier.label}')`);
assert(!bernardoTier.label.includes('수사'), "Bernardo label DOES NOT include '수사' (monk)");

// ==========================================
// TEST 12: Stat Growth and Trait 5-Tier Verification
// ==========================================
console.log("\n--- 12. Testing Stat Growth and Trait 5-Tier System ---");
assert(extractNumericValue("81(+1)") === 82, "extractNumericValue correctly adds bonus: 81(+1) -> 82");
assert(extractNumericValue("60(+3)") === 63, "extractNumericValue correctly adds bonus: 60(+3) -> 63");
assert(extractNumericValue("50(-2)") === 48, "extractNumericValue handles penalty: 50(-2) -> 48");

const sampleLLMOutputWithGrowth = `
【 개인 능력치 】
[선천 능력치]
근력: 81(+1) | 체력: 75 | 지능: 80
[후천 능력치]
통솔력: 65(+2) | 학문: 70

【 특성 및 기술 】
[전문특성] 검술 (반복 성향) : 검술 훈련을 거듭하고 있습니다.
[신체특성] 강철 체력 (강한 특성) : 웬만한 부상에는 굴복하지 않습니다.
`;
const parsedGrowth = parseLLMResponse(sampleLLMOutputWithGrowth);
assert(parsedGrowth.stats?.innate?.['근력'] === '81(+1)', "Innate stat preserves '81(+1)'");
assert(parsedGrowth.stats?.acquired?.['통솔력'] === '65(+2)', "Acquired stat preserves '65(+2)'");
assert(parsedGrowth.traits?.length === 2, "Parsed 2 traits with tiers");
assert(parsedGrowth.traits?.[0].tier === '반복 성향', "Trait 1 tier parsed as '반복 성향'");
assert(parsedGrowth.traits?.[1].tier === '강한 특성', "Trait 2 tier parsed as '강한 특성'");

// ==========================================
// TEST 13: SSOT 2D-Matrix & Character Relations Pipeline (Bernardo & Mateo Permanent Fix)
// ==========================================
console.log("\n--- 13. Testing SSOT Character Relations Pipeline & Guardrails ---");

// 13.1 Bernardo Guard Captain under Clergy Archetype
const bernardoFullRel = "[베르나르도 (성 미카엘 수호대장)] | 신뢰도 [68] - 친밀 | 우정도 [38] | [직속부하] 하사된 은화와 부대 20명 확충에 자부심을 품고 성당과 장원의 방위를 철통같이 수행함.";
const pBernardo = parsePersonalRelation(bernardoFullRel, 'clergy');
assert(pBernardo.name === '베르나르도', `SSOT extracts clean name '베르나르도' (found: '${pBernardo.name}')`);
assert(pBernardo.role === '성 미카엘 수호대장', `SSOT extracts clean role '성 미카엘 수호대장' (found: '${pBernardo.role}')`);
assert(pBernardo.vocation === 'military', "Bernardo vocation is 'military' (무관·경비)");
assert(pBernardo.tierId === 'subordinate', "Bernardo tier is 'subordinate'");
assert(pBernardo.tierLabel === '🛡️ 직속 호위대 / 무관', `Bernardo tierLabel is '🛡️ 직속 호위대 / 무관' (found: '${pBernardo.tierLabel}')`);
assert(pBernardo.vocationIcon === '⚔️', "Bernardo vocation icon is '⚔️'");
assert(pBernardo.isSubordinate === true, "Bernardo is marked as subordinate");
assert(pBernardo.isSuperior === false, "Bernardo is NOT superior");

// 13.2 Mateo Merchant Peer with Cathedral Affiliation
const mateoFullRel = "[마테오 (주교좌 성당 납품 상단 행수)] | 신뢰도 [90] - 동반 | 우정도 [75] | [동료] 주교좌 성당에 성물과 포도주를 독점 납품하는 베로나 상단의 대행수.";
const pMateo = parsePersonalRelation(mateoFullRel, 'clergy');
assert(pMateo.name === '마테오', `SSOT extracts clean name '마테오' (found: '${pMateo.name}')`);
assert(pMateo.vocation === 'merchant', "Mateo vocation is 'merchant' (상인·경제)");
assert(pMateo.isSuperior === false, "Mateo is strictly NOT superior despite '주교좌' in role");
assert(pMateo.tierId === 'peer', "Mateo tier is 'peer'");

// 13.3 Superior Blocker: Even if AI mistakenly outputs [상급자] for a merchant
const corruptedMateo = "[마테오 (주교좌 성당 납품 상단 행수)] | 신뢰도 [90] - 동반 | 우정도 [75] | [상급자] 주교좌 성당에 성물을 납품함.";
const pCorruptedMateo = parsePersonalRelation(corruptedMateo, 'clergy');
assert(pCorruptedMateo.isSuperior === false, "Superior Blocker kicks in: merchant CANNOT be superior");
assert(pCorruptedMateo.tierId !== 'superior', "Merchant tier is blocked from 'superior'");

// 13.4 True Bishop Superior
const bishopRelText = "[마르코 대주교 (피렌체 관구장)] | 신뢰도 [75] - 신뢰 | 호감도 [40] | [상급자] 피렌체 관구장 대주교이자 영적 지도자.";
const pBishop = parsePersonalRelation(bishopRelText, 'clergy');
assert(pBishop.name === '마르코 대주교', "Bishop name extracted");
assert(pBishop.vocation === 'clergy', "Bishop vocation is 'clergy'");
assert(pBishop.isSuperior === true, "Bishop is true superior");
assert(pBishop.tierId === 'superior', "Bishop tier is 'superior'");
assert(pBishop.tierLabel === '👑 상급자 / 주군', "Bishop label is '👑 상급자 / 주군'");

// 13.5 Promotion Superior Trust check: Bishop vs Mateo
const mixedRelationships = [mateoFullRel, bishopRelText, bernardoFullRel];
const supApproval = getSuperiorApprovalTrust(mixedRelationships, 'clergy');
assert(supApproval.hasSuperior === true, "Superior approval detects superior");
assert(supApproval.superiorName === '마르코 대주교', `Superior is Bishop Marco, NOT Merchant Mateo (found: '${supApproval.superiorName}')`);
assert(supApproval.maxTrust === 75, `Superior trust is Bishop's 75, NOT Mateo's 90 (found: ${supApproval.maxTrust})`);

// 13.6 Council Vassals extraction
const council = getCouncilVassals(mixedRelationships, 'clergy');
assert(council.length === 1, `Exactly 1 council subordinate found (found: ${council.length})`);
assert(council[0].name === '베르나르도', `Council subordinate is Bernardo (found: '${council[0].name}')`);
assert(council.every(c => c.name !== '마르코 대주교' && c.name !== '마테오'), "Council DOES NOT contain Bishop Marco or Merchant Mateo");

// ==========================================
// TEST 14: Estate & Building Upgrade Economy Standards
// ==========================================
console.log("\n--- 14. Testing Estate & Building Upgrade Economy Standards ---");

// 14.1 Archetype currency standards
assert(getCurrencyForArchetype('clergy') === '은화', "Clergy currency is 은화 (Silver)");
assert(getCurrencyForArchetype('noble') === '금화', "Noble currency is 금화 (Gold)");
assert(getCurrencyForArchetype('company') === '금화', "Company currency is 금화 (Gold)");
assert(getCurrencyForArchetype('wanderer') === '동화', "Wanderer currency is 동화 (Copper)");

// 14.2 Building type multipliers
const pressMult = getBuildingTypeMultiplier({ name: '장원 올리브 압착장', tags: ['생산', '재정'] });
assert(pressMult.category === 'production', "Olive press classified as 'production'");
assert(pressMult.multiplier === 1.2, "Production building has 1.2x cost multiplier");

const churchMult = getBuildingTypeMultiplier({ name: '본당 예배당', tags: ['신앙'] });
assert(churchMult.category === 'faith_military', "Chapel classified as 'faith_military'");
assert(churchMult.multiplier === 1.0, "Faith building has 1.0x cost multiplier");

const granaryMult = getBuildingTypeMultiplier({ name: '성당 식료창고', tags: ['민생', '보급'] });
assert(granaryMult.category === 'public_supplies', "Granary classified as 'public_supplies'");
assert(granaryMult.multiplier === 0.8, "Supplies building has 0.8x cost multiplier");

const scriptMult = getBuildingTypeMultiplier({ name: '사제관 및 서재', tags: ['행정', '학문'] });
assert(scriptMult.category === 'admin', "Study classified as 'admin'");
assert(scriptMult.multiplier === 0.9, "Admin building has 0.9x cost multiplier");

// 14.3 Building upgrade cost calculation & turns (Clergy test case from user image)
const testOlivePress = { name: '장원 올리브 압착장', desc: '고품질 성유 생산', level: 1, tags: ['생산', '재정'] };
const oliveEstimate = calculateBuildingUpgradeCost(testOlivePress, 2, 'clergy', 0); // stewScore 0
assert(oliveEstimate.currency === '은화', "Olive press cost currency is 은화");
assert(oliveEstimate.amount === 30, `Olive press Lv.1->2 base amount is 30 은화 (found: ${oliveEstimate.amount})`);
assert(oliveEstimate.turns === 2, `Olive press Lv.1->2 requires 2 turns (found: ${oliveEstimate.turns})`);
assert(oliveEstimate.formattedCost === '은화 30닢', `Formatted cost is '은화 30닢' (found: '${oliveEstimate.formattedCost}')`);

// 14.4 Stewardship discount
const discountedOlive = calculateBuildingUpgradeCost(testOlivePress, 2, 'clergy', 15); // stewScore 15 -> 18% discount
assert(discountedOlive.discountPercent === 18, `Stewardship 15 gives 18% discount (found: ${discountedOlive.discountPercent})`);
assert(discountedOlive.amount === 25, `Discounted amount is 25 은화 (found: ${discountedOlive.amount})`);

// 14.5 Full candidates generation for holding (Image regression defense)
const mockEstateBuildings = [
  { name: '본당 예배당', desc: '미사 집전', level: 1, tags: ['신앙'] },
  { name: '석조 종탑 및 회랑', desc: '종탑', level: 1, tags: ['신앙', '치안'] },
  { name: '성물 안치실', desc: '성물 보관', level: 1, tags: ['신앙', '문화'] },
  { name: '사제관 및 서재', desc: '행정 처리', level: 1, tags: ['행정', '학문'] },
  { name: '장원 올리브 압착장', desc: '성유 생산', level: 1, tags: ['생산', '재정'] },
  { name: '성당 식료창고', desc: '식량 보급', level: 1, tags: ['민생', '보급'] }
];
const upgCandidates = getUpgradeCandidates(2, mockEstateBuildings, 'clergy', 10);
assert(upgCandidates.length === 6, "All 6 Lv.1 buildings generated as candidates for Lv.2 holding");
assert(upgCandidates.every(c => !c.formattedCost.includes('단위')), "NO candidates contain placeholder '단위'");
assert(upgCandidates.every(c => c.currency === '은화'), "All candidates use 은화 currency");
assert(upgCandidates.every(c => c.turns === 2), "All Lv.1->2 candidates take exactly 2 turns");
assert(upgCandidates.some(c => c.cost < 30), "Supplies/Admin buildings cost less than 30 은화");

// 14.6 Estate Promotion Cost standards
const clergyPromoLv1to2 = calculateEstatePromotionCost(1, 'clergy', 0);
assert(clergyPromoLv1to2.amount === 60, `Lv.1->2 Clergy promotion costs 60 은화 (found: ${clergyPromoLv1to2.amount})`);
assert(clergyPromoLv1to2.turns === 3, `Lv.1->2 promotion takes 3 turns (found: ${clergyPromoLv1to2.turns})`);
assert(clergyPromoLv1to2.formattedCost === '은화 60닢', "Formatted cost has '은화 60닢'");

const clergyPromoLv2to3 = calculateEstatePromotionCost(2, 'clergy', 0);
assert(clergyPromoLv2to3.amount === 120, `Lv.2->3 Clergy promotion costs 120 은화 (found: ${clergyPromoLv2to3.amount})`);
assert(clergyPromoLv2to3.turns === 4, `Lv.2->3 promotion takes 4 turns (found: ${clergyPromoLv2to3.turns})`);

const noblePromoLv2to3 = calculateEstatePromotionCost(2, 'noble', 0);
assert(noblePromoLv2to3.amount === 80, `Lv.2->3 Noble promotion costs 80 금화 (found: ${noblePromoLv2to3.amount})`);
assert(noblePromoLv2to3.currency === '금화', "Noble promotion uses 금화");

// 14.7 Wealth parsing and affordability
const testGameStateWealth: any = {
  factionState: { '세력 재정': '은화 145닢' },
  inventory: { wealth: ['은화 145닢'] }
};
const parsedWealth = getPlayerWealthAmount(testGameStateWealth, '은화');
assert(parsedWealth === 145, `Player wealth parsed as 145 은화 (found: ${parsedWealth})`);

// ==========================================
// TEST 15: Universal Population Growth Engine & Save Compatibility
// ==========================================
console.log("\n--- 15. Testing Universal Population Growth Engine & Compatibility ---");

// 15.1 Safe Parsing of various population text strings
assert(parsePopulationCount('교구민 120명 (수도사 12명)') === 120, "Parses 120 from '교구민 120명 (수도사 12명)'");
assert(parsePopulationCount('145명') === 145, "Parses 145 from '145명'");
assert(parsePopulationCount('인구 3,500명') === 3500, "Parses 3500 from '인구 3,500명' with comma");
assert(parsePopulationCount('정예 단원 24명') === 24, "Parses 24 from '정예 단원 24명'");
assert(parsePopulationCount('단신 (동행 1명)') === 1, "Parses 1 from wanderer companion text");
assert(parsePopulationCount('통치 중인 영지 없음') === 0, "Returns 0 for non-ruler status");
assert(parsePopulationCount(undefined) === 0, "Returns 0 for undefined string");

// 15.2 Estate Population Capacities (Lv.1 to Lv.5)
assert(getEstatePopulationCapacity(1) === 100, "Lv.1 capacity is 100");
assert(getEstatePopulationCapacity(2) === 300, "Lv.2 capacity is 300");
assert(getEstatePopulationCapacity(3) === 800, "Lv.3 capacity is 800");
assert(getEstatePopulationCapacity(4) === 2500, "Lv.4 capacity is 2500");
assert(getEstatePopulationCapacity(5) === 10000, "Lv.5 capacity is 10000");

// 15.3 Clergy Real Case Regression Test (User's parish with 6 buildings: 120 -> 145)
const clergyRealMock: any = {
  personalInfo: { '이름': '토마스', '신분': '사제' },
  estate: {
    level: 'Lv.2 교구 본당',
    type: '교구 본당',
    buildings: [
      { name: '본당 예배당', tags: ['신앙'] },
      { name: '석조 종탑 및 회랑', tags: ['신앙', '치안'] },
      { name: '성물 안치실', tags: ['신앙', '문화'] },
      { name: '사제관 및 서재', tags: ['행정', '학문'] },
      { name: '장원 올리브 압착장', tags: ['생산', '재정'] },
      { name: '성당 식료창고', tags: ['민생', '보급'] }
    ]
  },
  factionState: {
    '인구': '145명',
    '치안': '평온함 (80%)',
    '민심': '깊은 신앙 (95%)'
  },
  stats: {
    admin: [{ name: '행정력', value: 75 }],
    learning: [{ name: '학문', value: 80 }]
  }
};

const clergyGrowth = calculatePopulationGrowth(clergyRealMock, 120);
assert(clergyGrowth.currentPopulation === 145, "Current population is 145");
assert(clergyGrowth.delta === 25, "Delta is exactly +25 (145 - 120)");
assert(clergyGrowth.recentDeltaLabel === '▲ +25명', "Recent delta label is '▲ +25명'");
assert(clergyGrowth.maxCapacity === 300, "Lv.2 parish max capacity is 300");
assert(clergyGrowth.isOvercrowded === false, "145 is within 300 capacity");
assert(clergyGrowth.growthRate > 5.0, `Clergy growth rate is healthy positive (>5.0, found: ${clergyGrowth.growthRate})`);
assert(clergyGrowth.formattedGrowth.startsWith('+'), "Formatted growth starts with '+'");
assert(clergyGrowth.growthItems.some(i => i.label.includes('식료창고')), "Granary bonus is present in breakdown");
assert(clergyGrowth.growthItems.some(i => i.label.includes('압착장')), "Olive press bonus is present in breakdown");

// 15.4 Overcrowding Penalty Test (Population 350 on Lv.2 holding capacity 300)
const crowdedMock: any = {
  ...clergyRealMock,
  factionState: {
    ...clergyRealMock.factionState,
    '인구': '350명'
  }
};
const crowdedGrowth = calculatePopulationGrowth(crowdedMock);
assert(crowdedGrowth.isOvercrowded === true, "350 people in Lv.2 flagged as overcrowded");
assert(crowdedGrowth.growthItems.some(i => i.label.includes('과밀')), "Overcrowding penalty item exists in breakdown");
assert(crowdedGrowth.growthRate < clergyGrowth.growthRate, "Overcrowded growth rate is substantially penalized");

// 15.5 Vercel / Legacy Local Storage Save File Compatibility Test
// Legacy save has NO previousPopulation field and partial factionState
const legacySaveMock: any = {
  personalInfo: { '이름': '옛날 사제', '신분': '사제' },
  factionState: { '인구': '120명' }
};
const legacyGrowth = calculatePopulationGrowth(legacySaveMock, undefined);
assert(legacyGrowth.currentPopulation === 120, "Legacy save population parsed as 120");
assert(legacyGrowth.delta === undefined, "Legacy save has undefined delta without previousPopulation");
assert(legacyGrowth.recentDeltaLabel === undefined, "Legacy save has undefined delta label");
assert(legacyGrowth.growthRate > 0, "Legacy save still calculates valid per-turn growth rate");

// Integration test with parseCKResources
const legacyResources = parseCKResources(legacySaveMock, undefined);
assert(legacyResources.populationGrowth !== undefined, "parseCKResources handles legacy state without errors");
assert(legacyResources.populationGrowth?.currentPopulation === 120, "Legacy parsed via parseCKResources has currentPopulation 120");

// 15.6 4 Archetype Universal Coverage Test
const wandererMock: any = {
  personalInfo: { '이름': '방랑 무사', '신분': '방랑 기사' },
  inventory: { companions: ['마르코 (종자)'] }
};
const wandererRes = parseCKResources(wandererMock, undefined);
assert(wandererRes.levies === '동행 1명' || wandererRes.levies.includes('1'), "Wanderer safely handled as companion count");

const mercenaryMock: any = {
  personalInfo: { '이름': '용병대장', '신분': '용병대장' },
  factionState: { '단원': '정예 단원 30명', '민심': '높음 (80%)', '치안': '엄격함 (85%)' }
};
const mercGrowth = calculatePopulationGrowth(mercenaryMock, 25);
assert(mercGrowth.currentPopulation === 30, "Mercenary count parsed as 30");
assert(mercGrowth.delta === 5, "Mercenary delta is +5 (30 - 25)");
assert(mercGrowth.recentDeltaLabel === '▲ +5명', "Mercenary recent delta label is '▲ +5명'");

// ==========================================
// TEST 16: Trust & Friendship / Affection Stages and SSOT Rule Regression
// ==========================================
console.log("\n--- 16. Testing Trust & Friendship / Affection Stages & Screen Regression ---");

// 16.1 Test Trust Stage Thresholds
assert(getTrustStage(10) === '경계', "Trust 10 is '경계'");
assert(getTrustStage(20) === '어색함', "Trust 20 is '어색함'");
assert(getTrustStage(30) === '관심', "Trust 30 is '관심'");
assert(getTrustStage(40) === '호기심', "Trust 40 is '호기심'");
assert(getTrustStage(55) === '우호', "Trust 55 is '우호'");
assert(getTrustStage(68) === '친밀', "Trust 68 is '친밀'");
assert(getTrustStage(80) === '신뢰', "Trust 80 is '신뢰'");
assert(getTrustStage(95) === '동반', "Trust 95 is '동반'");

// 16.2 Test Friendship Stage Thresholds (Same-gender / Non-romance)
assert(getFriendshipStage(10) === '타인', "Friendship 10 is '타인'");
assert(getFriendshipStage(30) === '지인', "Friendship 30 is '지인'");
assert(getFriendshipStage(42) === '친우', "Friendship 42 is '친우'");
assert(getFriendshipStage(70) === '붕우', "Friendship 70 is '붕우'");
assert(getFriendshipStage(90) === '맹우', "Friendship 90 is '맹우'");

// 16.3 Test Affection Stage Thresholds (Opposite-gender / Romance)
assert(getAffectionStage(10) === '타인', "Affection 10 is '타인'");
assert(getAffectionStage(25) === '관심', "Affection 25 is '관심'");
assert(getAffectionStage(40) === '호감', "Affection 40 is '호감'");
assert(getAffectionStage(60) === '동경', "Affection 60 is '동경'");
assert(getAffectionStage(75) === '애정', "Affection 75 is '애정'");
assert(getAffectionStage(90) === '사랑', "Affection 90 is '사랑'");
assert(getAffectionStage(98) === '극애', "Affection 98 is '극애'");

// 16.4 User Screenshot 5-Character Exact Regression Test
// Character 1: 오도 주교 (우르비노 교구장) | 신뢰도 68% | 호감도 42%
const odoRelScreen = "[우르비노 교구장] 오도 주교 | 신뢰도 68% | 호감도 42% | 바쳐진 강론과 사본의 높은 학식에 완전히 매료되어 성탄 대축일 참사회원 세임을 공식 확약하고 주교관 회랑을 개방함.";
const parsedOdoScreen = parsePersonalRelation(odoRelScreen, 'clergy');
assert(parsedOdoScreen.name === '오도 주교', "Odo name parsed correctly");
assert(parsedOdoScreen.trust === 68, "Odo trust is 68");
assert(parsedOdoScreen.trustStage === '친밀', "Odo trust stage is '친밀'");
assert(parsedOdoScreen.affLabel === '우정도', "Odo relation label is strictly '우정도' (NOT '호감도')");
assert(parsedOdoScreen.affection === 42, "Odo affection/friendship is 42");
assert(parsedOdoScreen.affStage === '친우', "Odo friendship stage is '친우'");

// Character 2: 토마소 장로 (마을 자치 촌장) | 신뢰도 60% | 호감도 44%
const tomasoRelScreen = "[마을 자치 촌장] 토마소 장로 | 신뢰도 60% | 호감도 44% | 사제가 주교좌의 거물이 되어 영지를 지켜줄 것이라 굳게 믿고 후방 행정에 헌신.";
const parsedTomasoScreen = parsePersonalRelation(tomasoRelScreen, 'clergy');
assert(parsedTomasoScreen.name === '토마소 장로', "Tomaso name parsed correctly");
assert(parsedTomasoScreen.trust === 60, "Tomaso trust is 60");
assert(parsedTomasoScreen.trustStage === '우호', "Tomaso trust stage is '우호'");
assert(parsedTomasoScreen.affLabel === '우정도', "Tomaso relation label is strictly '우정도'");
assert(parsedTomasoScreen.affStage === '친우', "Tomaso friendship stage is '친우'");

// Character 3: 베아트리체 (토착 장원 미망인) | 신뢰도 88% | 호감도 90% (로맨스/은밀한 연인)
const beatriceRelScreen = "[토착 장원 미망인] 베아트리체 | 신뢰도 88% | 호감도 90% | {특수: 은밀한 연인} 사제를 영지 섭정으로 세우고 뱃속의 아이를 온전히 맡기며 영혼과 육신을 헌신함.";
const parsedBeatriceScreen = parsePersonalRelation(beatriceRelScreen, 'clergy');
assert(parsedBeatriceScreen.name === '베아트리체', "Beatrice name parsed correctly");
assert(parsedBeatriceScreen.trust === 88, "Beatrice trust is 88");
assert(parsedBeatriceScreen.trustStage === '신뢰', "Beatrice trust stage is '신뢰'");
assert(parsedBeatriceScreen.affLabel === '애정도', "Beatrice relation label is strictly '애정도' (Romance)");
assert(parsedBeatriceScreen.affection === 90, "Beatrice affection is 90");
assert(parsedBeatriceScreen.affStage === '사랑', "Beatrice affection stage is '사랑'");
assert(parsedBeatriceScreen.isRomance === true, "Beatrice isRomance is true");

// Character 4: 베르나르도 (성 미카엘 수호대장) | 신뢰도 74% | 호감도 42%
const bernardoRelScreen = "[성 미카엘 수호대장] 베르나르도 | 신뢰도 74% | 호감도 42% | 장원 방어와 호위대 인솔, 첩자 후보들을 단련할 음지의 교관 물색 명령을 철저히 수행 중.";
const parsedBernardoScreen = parsePersonalRelation(bernardoRelScreen, 'clergy');
assert(parsedBernardoScreen.name === '베르나르도', "Bernardo name parsed correctly");
assert(parsedBernardoScreen.trust === 74, "Bernardo trust is 74");
assert(parsedBernardoScreen.trustStage === '친밀', "Bernardo trust stage is '친밀'");
assert(parsedBernardoScreen.affLabel === '우정도', "Bernardo relation label is strictly '우정도'");
assert(parsedBernardoScreen.affStage === '친우', "Bernardo friendship stage is '친우'");

// Character 5: 마테오 (우르비노 주교좌 상단 행수) | 신뢰도 52% | 호감도 35%
const mateoRelScreen = "[우르비노 주교좌 상단 행수] 마테오 | 신뢰도 52% | 호감도 35% | 상경길을 동행하며 도시 내 유력자들의 치부와 정세를 넘겨주고 사제와의 유착을 더욱 강화함.";
const parsedMateoScreen = parsePersonalRelation(mateoRelScreen, 'clergy');
assert(parsedMateoScreen.name === '마테오', "Mateo name parsed correctly");
assert(parsedMateoScreen.trust === 52, "Mateo trust is 52");
assert(parsedMateoScreen.trustStage === '우호', "Mateo trust stage is '우호'");
assert(parsedMateoScreen.affLabel === '우정도', "Mateo relation label is strictly '우정도'");
assert(parsedMateoScreen.affStage === '지인', "Mateo friendship stage is '지인'");

// 16.5 Explicit dash stage format test (e.g., '신뢰도 88 — [신뢰] | 애정도 90 — [사랑]')
const explicitStageRel = "엘레나 | 신뢰도 88 — [신뢰] | 애정도 90 — [사랑] | 관계: 비밀 연인";
const parsedExplicit = parsePersonalRelation(explicitStageRel, 'clergy');
assert(parsedExplicit.trustStage === '신뢰', "Explicit stage parses '신뢰'");
assert(parsedExplicit.affLabel === '애정도', "Explicit stage has '애정도'");
assert(parsedExplicit.affStage === '사랑', "Explicit stage parses '사랑'");

// ==========================================
// TEST 17: Building Level Upgrade Persistence & Rollback Prevention
// ==========================================
console.log("\n--- 17. Testing Building Level Upgrade Persistence & Rollback Prevention ---");

// 17.1 parser.ts extracts level 2 when Lv.2 is in header
const sampleLlmTextLv2 = `【 영지 및 야영지 상태 】
[거점 형태]: 교구 본당
[거점 규모]: Lv.2 교구 본당
▶ [장원 올리브 압착장 Lv.2] [생산·민생]: 신형 나선식 압착기 가동, 올리브유 생산량 2배 증대 및 상단 납품 수익 급증
▶ [본당 예배당 Lv.1] [신앙]: 미사 집전`;
const parsedSampleLv2 = parseLLMResponse(sampleLlmTextLv2);
const oliveLv2 = parsedSampleLv2.estate?.buildings.find(b => b.name === '장원 올리브 압착장');
assert(oliveLv2 !== undefined, "Olive press found in parsed buildings");
assert(oliveLv2?.level === 2, "Olive press parsed as Lv.2 when Lv.2 is in header (found: " + oliveLv2?.level + ")");
assert(oliveLv2?.name === '장원 올리브 압착장', "Clean name does not have Lv.2 in it");

// 17.2 parser.ts extracts level 2 even when Lv.2 is at start of desc: "(Lv.2) 신형 나선식..."
const sampleLlmTextDescLv2 = `【 영지 및 야영지 상태 】
[거점 형태]: 교구 본당
[거점 규모]: Lv.2 교구 본당
▶ [장원 올리브 압착장] [생산·민생]: (Lv.2) 신형 나선식 압착기 가동, 올리브유 생산량 2배 증대
▶ [본당 예배당] [신앙]: 미사 집전`;
const parsedSampleDescLv2 = parseLLMResponse(sampleLlmTextDescLv2);
const oliveDescLv2 = parsedSampleDescLv2.estate?.buildings.find(b => b.name === '장원 올리브 압착장');
assert(oliveDescLv2?.level === 2, "Olive press parsed as Lv.2 when (Lv.2) is at start of desc (found: " + oliveDescLv2?.level + ")");

// 17.3 CRITICAL: mergeEstateBuildings prevents rollback when AI omits Lv.2 entirely
const sampleLlmNoLv = `【 영지 및 야영지 상태 】
[거점 형태]: 교구 본당
[거점 규모]: Lv.2 교구 본당
▶ [장원 올리브 압착장] [생산·민생]: 신형 나선식 압착기 가동, 올리브유 생산량 2배 증대 및 상단 납품 수익 급증
▶ [본당 예배당] [신앙]: 미사 집전`;
const parsedNoLv = parseLLMResponse(sampleLlmNoLv);
const parsedBuildingNoLv = parsedNoLv.estate?.buildings.find(b => b.name === '장원 올리브 압착장');
assert(parsedBuildingNoLv?.level === 1, "Raw parser defaults to 1 when AI omits Lv");

const prevBuildingsLv2 = [
  { name: '장원 올리브 압착장', desc: '이전 설명', level: 2, tags: ['생산', '민생'] },
  { name: '본당 예배당', desc: '예배당', level: 1, tags: ['신앙'] }
];
const protectedMerged = mergeEstateBuildings(prevBuildingsLv2, parsedNoLv.estate?.buildings || [], []);
const protectedOlive = protectedMerged.find(b => b.name === '장원 올리브 압착장');
assert(protectedOlive?.level === 2, "mergeEstateBuildings protects already achieved Lv.2 from resetting to 1 (found: " + protectedOlive?.level + ")");
assert(Boolean(protectedOlive?.desc?.includes('신형 나선식 압착기')), "Updated description is preserved in merged building");

// 17.4 CRITICAL: mergeEstateBuildings applies targetLevel when queue item completes
const prevBuildingsLv1 = [
  { name: '장원 올리브 압착장', desc: '기존 Lv.1 설명', level: 1, tags: ['생산', '민생'] }
];
const completedQueue = [
  { building: '장원 올리브 압착장 업그레이드 (Lv.1→2)', targetLevel: 2, tags: ['생산', '민생'] }
];
const queueMerged = mergeEstateBuildings(prevBuildingsLv1, parsedNoLv.estate?.buildings || [], completedQueue);
const queueOlive = queueMerged.find(b => b.name === '장원 올리브 압착장');
assert(queueOlive?.level === 2, "mergeEstateBuildings immediately upgrades building to targetLevel 2 upon completion");

// 17.5 getUpgradeCandidates does NOT offer Lv.1->2 for Lv.2 building in Lv.2 holding
const candidatesAfterUpgrade = getUpgradeCandidates(2, queueMerged, 'clergy', 10);
const oliveCandidate = candidatesAfterUpgrade.find(c => c.buildingName.includes('올리브 압착장'));
assert(oliveCandidate === undefined, "Olive press Lv.2 has NO Lv.1->2 upgrade candidate (maxBuildingLevel is 2 in Lv.2 estate)");

// 17.6 buildSystemCommands specifies Lv.2 in completion command
const queueItemToComplete = [
  {
    id: 'test-q-1',
    building: '장원 올리브 압착장 업그레이드 (Lv.1→2)',
    cost: '은화 25닢',
    desc: '기능 강화',
    startTurn: 1,
    completeTurn: 2,
    commandSent: true,
    kind: 'upgrade' as const,
    targetLevel: 2,
    tags: ['생산', '민생']
  }
];
const sysCmds = buildSystemCommands(queueItemToComplete, 1);
assert(sysCmds.completedIds.includes('test-q-1'), "test-q-1 is in completedIds");
assert(sysCmds.text.includes('장원 올리브 압착장 Lv.2'), "System command explicitly instructs AI to output Lv.2 (found: " + sysCmds.text + ")");

// ==========================================
// TEST 18: Character Profile Modal Ruler Office Extraction
// ==========================================
console.log("\n--- 18. Testing Character Profile Modal Ruler Office Extraction ---");
const stateWithJikwi = {
  personalInfo: {
    이름: '루카',
    신분: '사제',
    직위: '주임 사제',
    종교: '가톨릭',
    문화: '북이탈리아'
  }
};
const office1 = stateWithJikwi.personalInfo['직위'] || stateWithJikwi.personalInfo['신분'];
assert(office1 === '주임 사제', "rulerOffice correctly resolves '직위' as '주임 사제'");

const stateWithJikchaek = {
  personalInfo: {
    이름: '베르나르도',
    신분: '사제',
    직책: '우르비노 교구 사제',
    종교: '가톨릭',
    문화: '북이탈리아'
  }
};
const office2 = (stateWithJikchaek.personalInfo as any)['직위'] || (stateWithJikchaek.personalInfo as any)['직책'] || stateWithJikchaek.personalInfo['신분'];
assert(office2 === '우르비노 교구 사제', "rulerOffice correctly resolves '직책' as '우르비노 교구 사제'");

const stateFallback = {
  personalInfo: {
    이름: '안토니오',
    신분: '수도원장',
    종교: '가톨릭',
    문화: '북이탈리아'
  }
};
const office3 = (stateFallback.personalInfo as any)['직위'] || (stateFallback.personalInfo as any)['직책'] || stateFallback.personalInfo['신분'];
assert(office3 === '수도원장', "rulerOffice safely falls back to '신분' when specific office is omitted");

// ==========================================
// TEST 19: Vercel Local Save File Olive Press Lv.2 Self-Healing & Duplicate Removal
// ==========================================
console.log("\n--- 19. Testing Vercel Local Save File Olive Press Lv.2 Recovery & Duplicate Removal ---");

// 19.1 Simulate corrupted legacy save file from Vercel local storage
const legacyCorruptedSave = {
  dateLocation: "1066년 10월 | 우르비노 교구 [턴 수: 12]",
  personalInfo: {
    이름: "루카",
    직위: "주임 사제",
    신분: "사제",
    종교: "가톨릭"
  },
  estate: {
    name: "성 마르코 수도원 장원",
    level: 2,
    buildings: [
      {
        name: "장원 올리브 압착장",
        level: 1, // Corrupted / reset by AI text omission
        desc: "신형 나선식 압착기 가동, 올리브유 생산량 2배 증대 및 상단 납품 수익 급증",
        tags: ["수익", "산업", "생산"]
      },
      {
        name: "지하 성당 기도실",
        level: 2,
        desc: "정결한 석조 기도 공간",
        tags: ["신앙", "치안"]
      }
    ]
  },
  buildOptions: [
    "장원 올리브 압착장 업그레이드 (Lv.1→2)", // Duplicate upgrade candidate that shouldn't exist!
    "교구 양초 공방 증축 (Lv.1→2)"
  ],
  _constructionQueue: [
    {
      id: "dup-queue-1",
      building: "장원 올리브 압착장 업그레이드 (Lv.1→2)",
      targetLevel: 2
    }
  ]
};

// 19.2 Run Self-Healing Sanitize Engine
const healedState = sanitizeEstateState(legacyCorruptedSave);
const healedOlive = healedState.estate?.buildings?.find(b => b.name === '장원 올리브 압착장');

assert(healedOlive !== undefined, "Olive press exists in healed state");
assert(healedOlive?.level === 2, "Olive press is restored to Lv.2 from Lv.1 (found: " + healedOlive?.level + ")");
assert(healedOlive?.name === '장원 올리브 압착장', "Olive press preserves canonical name");
assert(Boolean(healedOlive?.desc?.includes('신형 나선식 압착기')), "Olive press preserves upgraded narrative description");

// 19.3 Verify duplicate upgrade candidate removal from buildOptions
assert(healedState.buildOptions.length === 1, "buildOptions count reduced by removing duplicate olive press upgrade (found: " + healedState.buildOptions.length + ")");
assert(healedState.buildOptions[0] === "교구 양초 공방 증축 (Lv.1→2)", "Non-olive upgrade options are safely preserved");
const hasDuplicateOliveOption = healedState.buildOptions.some(opt => opt.includes('올리브') && opt.includes('1→2'));
assert(!hasDuplicateOliveOption, "Duplicate olive upgrade option (Lv.1→2) is completely purged from buildOptions");

// 19.4 Verify duplicate queue item purged
assert(healedState._constructionQueue.length === 0, "Duplicate olive queue item (targetLevel 2) is completely purged from _constructionQueue");

// 19.5 Verify getUpgradeCandidates does NOT produce olive press candidate
const candidatesForHealed = getUpgradeCandidates(2, healedState.estate.buildings, 'clergy', 10);
const oliveCandidateInHealed = candidatesForHealed.find(c => c.buildingName.includes('올리브'));
assert(oliveCandidateInHealed === undefined, "getUpgradeCandidates produces NO olive press candidate because it is already Lv.2");

// 19.6 Mock browser localStorage & autoMigrateAndSanitizeStorage
const mockStorage: Record<string, string> = {
  "ck_slot_autosave": JSON.stringify({
    id: "autosave",
    title: "🔄 자동 저장",
    turn: 12,
    characterName: "루카",
    gameState: legacyCorruptedSave
  }),
  "ck_slot_slot_1": JSON.stringify({
    id: "slot_1",
    title: "💾 세이브 슬롯 1",
    turn: 12,
    characterName: "루카",
    gameState: legacyCorruptedSave
  }),
  "ck_auto_save": JSON.stringify(legacyCorruptedSave)
};

// Setup global mock for localStorage
(global as any).window = {};
(global as any).localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => { mockStorage[key] = value; },
  removeItem: (key: string) => { delete mockStorage[key]; }
};

const migrationResult = autoMigrateAndSanitizeStorage();
assert(migrationResult.migratedCount >= 3, "autoMigrateAndSanitizeStorage successfully migrated all corrupted save slots (count: " + migrationResult.migratedCount + ")");

const updatedSlot1 = JSON.parse(mockStorage["ck_slot_slot_1"]);
const updatedSlot1Olive = updatedSlot1.gameState.estate.buildings.find((b: any) => b.name === '장원 올리브 압착장');
assert(updatedSlot1Olive.level === 2, "LocalStorage slot_1 olive press permanently healed to Lv.2 in storage");
assert(!updatedSlot1.gameState.buildOptions.some((o: string) => o.includes('올리브') && o.includes('1→2')), "LocalStorage slot_1 has duplicate buildOptions permanently removed");

const updatedLegacyAuto = JSON.parse(mockStorage["ck_auto_save"]);
const updatedLegacyOlive = updatedLegacyAuto.estate.buildings.find((b: any) => b.name === '장원 올리브 압착장');
assert(updatedLegacyOlive.level === 2, "LocalStorage ck_auto_save olive press permanently healed to Lv.2 in storage");

// Cleanup mock
delete (global as any).window;
delete (global as any).localStorage;


// ==========================================
// Summary
// ==========================================
console.log("\n==================================================");
console.log(`🏁 TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
if (passedTests === totalTests) {
  console.log("🎉 ALL TESTS PASSED WITH 100% SUCCESS!");
  process.exit(0);
} else {
  console.error("⚠️ SOME TESTS FAILED. PLEASE REVIEW.");
  process.exit(1);
}
