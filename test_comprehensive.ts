// Comprehensive integration & output stability test suite
import { parseLLMResponse } from './src/lib/parser';
import { checkStatusPromotion, STATUS_LADDER } from './src/lib/statusPromotion';
import { getMaxHoldingCapacity, getDomainLimitBreakdown } from './src/lib/ckVisuals';

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
