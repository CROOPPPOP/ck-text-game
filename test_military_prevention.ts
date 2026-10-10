import { normalizeParsedState } from './src/lib/parser';
import { isMilitaryOrRetinueItem, calculateDynamicLevies } from './src/lib/ckVisuals';
import type { ParsedState } from './src/lib/parser';

console.log('================================================================');
console.log('🛡️ [검증] 군사 부대 및 소지품 오분류 방지 & 자가 치유 범용 시스템 검증');
console.log('================================================================');

// 유저 스크린샷 상황을 완벽하게 재현한 오염 데이터
const userCorruptedState: ParsedState = {
  personalInfo: {
    '신분': '주교',
    '직위': '몬테펠트로 주교좌 대수도원장'
  },
  estate: {
    type: '몬테펠트로 성 미카엘 자치 수도원 장원 (카스텔로 전 영지 병합 및 주교좌 직할화)',
    level: 'Lv.2',
    buildings: [
      { name: '석조 요새 병영', level: 2, tags: ['군사'] },
      { name: '대사제관 및 공증 서재', level: 2, tags: ['행정'] },
      { name: '장인 길드 공방', level: 2, tags: ['산업'] },
      { name: '성벽 망루 경비대', level: 2, tags: ['군사', '치안'] },
      { name: '군사 훈련소', level: 2, tags: ['군사'] },
      { name: '경비초소', level: 2, tags: ['치안'] },
      { name: '성곽 방벽', level: 1, tags: ['방어', '치안'] }
    ]
  },
  inventory: {
    '재산 및 병력': [
      // 1. 문서이지만 '밀정단' 단어가 포함되어 오분류 위험이 있던 아이템
      '교구 귀족 및 참사회 치부 문서록: 아가타 수녀와 밀정단이 수집한 성직매매 및 사생아 내역 극비 문서철 원본',
      // 2. 장원이지만 '병영' 단어가 포함되어 오분류 위험이 있던 아이템
      '몬테펠트로 성 미카엘 자치 수도원 장원: 석조 요새 병영 Lv.2, 대사제관 및 공증 서재 Lv.2, 식료창고 Lv.2, 조제실 Lv.2, 장인 길드 공방 Lv.2, 상설 대시장 Lv.1, 밀회 별장 Lv.2 완비',
      // 3. 인원수가 [25명]과 총 76명으로 상충되던 기사단
      '성 미카엘 기사수도회 [25명] (총 76명, 무장 및 훈련 완료된 정예 군단)',
      // 4. 인원수가 1명과 총 10명으로 상충되던 첩보대
      '암영 첩보대 1명 (총 10명, 국경 사찰 및 비밀 공작 전담)',
      // 5. 인원수가 4명과 총 5명으로 상충되던 밀정단
      '수녀 밀정단 4명 (총 5명, 귀족 및 교단 내부 동향 감시)',
      // 6. 비전투 가신 수행단
      '성당 복사 [2명] (예배 보조 및 잔심부름 담당)',
      '성당 서기 [3명] (신임 수도원장 율리아누스 신부 지휘 하에 공증 서재 총괄)',
      '수도원 수사 [8명] (신임 원장 율리아누스 보좌, 전례 및 약초원 전담)',
      '수녀회 및 예비 산파단 [1명] (주교에 절대 순종, 산파술 수련 및 태아 보호 전담)',
      '성 미카엘 장인 길드 [18명] (무구 제작 및 영지 토목 공사 전담)',
      // 7. 순수 화폐
      ': 은화 120.5닢'
    ]
  }
};

// 1. isMilitaryOrRetinueItem 필터링 단독 검증
console.log('1) isMilitaryOrRetinueItem 정밀 판별 검증:');
const docCheck = isMilitaryOrRetinueItem(userCorruptedState.inventory!['재산 및 병력'][0]);
const estateCheck = isMilitaryOrRetinueItem(userCorruptedState.inventory!['재산 및 병력'][1]);
const knightCheck = isMilitaryOrRetinueItem(userCorruptedState.inventory!['재산 및 병력'][2]);
const scoutCheck = isMilitaryOrRetinueItem(userCorruptedState.inventory!['재산 및 병력'][3]);

console.log('   - 치부 문서록(밀정단 언급) 군사 판별 결과 (기대값: false):', docCheck);
console.log('   - 수도원 장원(병영 언급) 군사 판별 결과 (기대값: false):', estateCheck);
console.log('   - 성 미카엘 기사수도회 군사 판별 결과 (기대값: true):', knightCheck);
console.log('   - 암영 첩보대 군사 판별 결과 (기대값: true):', scoutCheck);

if (docCheck !== false) throw new Error('❌ 치부 문서록이 군사/수행단으로 잘못 판별됨');
if (estateCheck !== false) throw new Error('❌ 수도원 장원이 군사/수행단으로 잘못 판별됨');
if (knightCheck !== true) throw new Error('❌ 기사수도회 판별 실패');
if (scoutCheck !== true) throw new Error('❌ 첩보대 판별 실패');
console.log('   ✅ 1) isMilitaryOrRetinueItem 정밀 판별 검증 통과!');

// 2. normalizeParsedState 범용 자가 치유(Self-Healing) 검증
console.log('\n2) normalizeParsedState 자가 치유 검증:');
const healedState = normalizeParsedState(userCorruptedState);
console.log('   - 치유된 인벤토리 카테고리:', Object.keys(healedState.inventory!));
console.log('   - [기밀 및 서적] 항목들:', healedState.inventory!['기밀 및 서적']);
console.log('   - [장비 및 영지] 항목들:', healedState.inventory!['장비 및 영지']);
console.log('   - [재산 및 병력] 항목들:', healedState.inventory!['재산 및 병력']);

if (!healedState.inventory!['기밀 및 서적'] || healedState.inventory!['기밀 및 서적'].length === 0) {
  throw new Error('❌ 치부 문서록이 [기밀 및 서적] 카테고리로 자동 격리되지 않음');
}
if (!healedState.inventory!['장비 및 영지'] || healedState.inventory!['장비 및 영지'].length === 0) {
  throw new Error('❌ 수도원 장원이 [장비 및 영지] 카테고리로 자동 격리되지 않음');
}
console.log('   ✅ 2) normalizeParsedState 자가 치유 검증 통과!');

// 3. calculateDynamicLevies 인원수 일치 및 타이틀 정제 검증
console.log('\n3) calculateDynamicLevies 동적 병력 산정 검증:');
const military = calculateDynamicLevies(healedState);
console.log('   - 총 병력 합계:', military.totalLevies + '명');
console.log('   - 신분 기본 상비군:', military.baseLevies + '명');
console.log('   - 거점 인프라 수비대:', military.holdingBonus + '명');
console.log('   - 직속 제대 총합:', military.unitsBonus + '명');
console.log('   - 세부 부대 목록:');
military.units.forEach(u => {
  console.log(`     • [${u.category}] ${u.icon} ${u.name}: ${u.count}명 (${u.type}, 사기: ${u.morale})`);
});

const knightUnit = military.units.find(u => u.name.includes('기사수도회'))!;
const scoutUnit = military.units.find(u => u.name.includes('암영 첩보대'))!;
const nunUnit = military.units.find(u => u.name.includes('수녀 밀정단'))!;
const garrisonUnit = military.units.find(u => u.category === 'garrison')!;

console.log('   - 기사수도회 인원수 (기대값: 76):', knightUnit.count);
console.log('   - 암영 첩보대 인원수 (기대값: 10):', scoutUnit.count);
console.log('   - 수녀 밀정단 인원수 (기대값: 5):', nunUnit.count);
console.log('   - 거점 수비대 명칭 정제 결과:', garrisonUnit.name);

if (knightUnit.count !== 76) throw new Error(`❌ 기사수도회 인원 불일치: 실제 ${knightUnit.count} !== 기대값 76`);
if (scoutUnit.count !== 10) throw new Error(`❌ 암영 첩보대 인원 불일치: 실제 ${scoutUnit.count} !== 기대값 10`);
if (nunUnit.count !== 5) throw new Error(`❌ 수녀 밀정단 인원 불일치: 실제 ${nunUnit.count} !== 기대값 5`);
if (garrisonUnit.name.includes('카스텔로 전 영지 병합')) {
  throw new Error(`❌ 거점 수비대 명칭에서 서사적 괄호 문구가 제거되지 않음: ${garrisonUnit.name}`);
}

// 4. 문서와 영지가 units 목록에 없는지 검증
const hasDocInUnits = military.units.some(u => u.name.includes('문서록'));
const hasEstateInUnits = military.units.some(u => u.name.includes('자치 수도원 장원') && u.category !== 'garrison');
if (hasDocInUnits) throw new Error('❌ 치부 문서록이 여전히 military units에 포함되어 있음!');
if (hasEstateInUnits) throw new Error('❌ 수도원 장원이 여전히 military units에 포함되어 있음!');

console.log('   ✅ 3) 동적 병력 인원수 일치 및 타이틀 정제 검증 통과!');

// 4. Vercel 브라우저 LocalStorage 세이브 슬롯 자가 치유(autoMigrateAndSanitizeStorage) 검증
console.log('\n4) Vercel 브라우저 LocalStorage 세이브 슬롯 자가 치유 검증:');
const storageMap: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (k: string) => storageMap[k] || null,
  setItem: (k: string, v: string) => { storageMap[k] = v; },
  removeItem: (k: string) => { delete storageMap[k]; }
};
(global as any).window = {};
(global as any).localStorage = mockLocalStorage;

import { autoMigrateAndSanitizeStorage, loadFromSlot } from './src/lib/saveManager';

// Vercel 브라우저에 저장되어 있던 오염된 slot_1 데이터 모의
const corruptedSlot1Data = {
  id: 'slot_1',
  title: '몬테펠트로 대수도원장 세이브',
  timestamp: Date.now() - 10000,
  turn: 15,
  dateLocation: '서기 1069년 가을',
  characterName: '귀도',
  characterTitle: '주교',
  characterStatus: '주교',
  gold: '은화 120.5닢',
  levies: '총 289명', // 과거 왜곡된 병력 수치
  gameState: JSON.parse(JSON.stringify(userCorruptedState))
};
mockLocalStorage.setItem('ck_slot_slot_1', JSON.stringify(corruptedSlot1Data));
mockLocalStorage.setItem('ck_auto_save', JSON.stringify(userCorruptedState));

const migrationResult = autoMigrateAndSanitizeStorage();
console.log('   - 마이그레이션된 슬롯 수:', migrationResult.migratedCount);

if (migrationResult.migratedCount < 1) {
  throw new Error('❌ Vercel 로컬 스토리지 오염 슬롯이 마이그레이션되지 않음');
}

// loadFromSlot으로 로드 검증
const loadedSlot = loadFromSlot('slot_1');
if (!loadedSlot) throw new Error('❌ slot_1 로드 실패');

console.log('   - 치유 후 slot_1 갱신된 표기 병력:', loadedSlot.levies);
console.log('   - 치유 후 slot_1 inventory 카테고리:', Object.keys(loadedSlot.gameState.inventory));

if (!loadedSlot.gameState.inventory['기밀 및 서적']) {
  throw new Error('❌ slot_1의 치부 문서록이 [기밀 및 서적]으로 치유되지 않음');
}
if (!loadedSlot.levies.includes('총 318명')) {
  throw new Error(`❌ slot_1 메타데이터의 병력 수치가 정상치(총 318명)로 갱신되지 않음: ${loadedSlot.levies}`);
}

console.log('   ✅ 4) Vercel 브라우저 LocalStorage 세이브 슬롯 자가 치유 검증 통과!');

console.log('\n================================================================');
console.log('🎉 모든 사전 방지 및 Vercel 로컬 세이브 파일 자가 치유 검증이 완벽히 성공했습니다!');
console.log('================================================================');

