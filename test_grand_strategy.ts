import { INITIAL_PROVINCES } from './src/lib/engine/mapData';
import { raiseLevies, orderArmyMove, resolveFieldBattle, updateMilitaryTick, Army } from './src/lib/engine/militaryEngine';
import { requestCharacterDialogue, requestDiplomaticLetter, requestBattleDispatch } from './src/lib/engine/aiChronicler';

async function runTests() {
  console.log("=== [1] Map & Province Tests ===");
  if (INITIAL_PROVINCES.length < 25) throw new Error(`Expected at least 25 provinces, got ${INITIAL_PROVINCES.length}`);
  console.log(`✅ PASS: ${INITIAL_PROVINCES.length} medieval world provinces initialized.`);

  const jerusalem = INITIAL_PROVINCES.find(p => p.id === 'prov_jerusalem')!;
  if (!jerusalem || jerusalem.capital !== '예루살렘 (알쿠드스)') throw new Error("Jerusalem province missing");
  console.log(`✅ PASS: Holy Land Jerusalem province verified.`);

  const wessex = INITIAL_PROVINCES.find(p => p.id === 'prov_wessex')!;
  if (!wessex || !wessex.neighbors.includes('prov_normandy')) throw new Error("Wessex missing or invalid neighbors");
  console.log(`✅ PASS: Wessex neighbors verified (${wessex.neighbors.join(', ')}).`);

  console.log("=== [2] Military Engine Tests ===");
  const army = raiseLevies(wessex, '해럴드 왕', true);
  if (!army || army.troops !== 500) throw new Error("Levy raising failed");
  console.log(`✅ PASS: Levies raised successfully (${army.troops} troops).`);

  const normandy = INITIAL_PROVINCES.find(p => p.id === 'prov_normandy')!;
  const movingArmy = orderArmyMove(army, normandy, wessex);
  if (movingArmy.targetProvinceId !== 'prov_normandy') throw new Error("Army move order failed");
  console.log(`✅ PASS: Army move ordered to Normandy (duration: ${movingArmy.movementDurationSeconds}s).`);

  const mockDefender: Army = {
    id: 'army_def',
    name: '노르망디 기사단',
    commander: '기욤 공작',
    ownerRealm: '노르망디 공국',
    isPlayer: false,
    troops: 400,
    maxTroops: 400,
    locationProvinceId: normandy.id,
    movementProgress: 0,
    movementDurationSeconds: 0,
    movementElapsedSeconds: 0,
    isSieging: false,
    siegeProgress: 0,
    color: '#ef4444'
  };

  const battle = resolveFieldBattle(army, mockDefender, normandy);
  console.log(`✅ PASS: Field battle resolved. Winner: ${battle.winner}, Victory: ${battle.victoryType}`);

  console.log("=== [3] AI Chronicler Local Fallback Tests ===");
  const dialogueFallback = await requestCharacterDialogue({
    playerRuler: '기욤 공작',
    playerTitle: '노르망디 공작',
    characterName: '오도 주교',
    characterRole: '바외의 주교',
    playerAction: '잉글랜드 원정에 참전할 것을 요청',
    dateLocation: '루앙 성채'
  });
  if (!dialogueFallback.includes('오도 주교')) throw new Error("Dialogue fallback missing character name");
  console.log(`✅ PASS: Character dialogue fallback generated successfully.`);

  const letterFallback = await requestDiplomaticLetter({
    sender: '기욤 공작',
    senderRealm: '노르망디 공국',
    recipient: '해럴드 왕',
    recipientRealm: '잉글랜드 왕국',
    actionName: '선전포고',
    actionDesc: '정당한 왕위 계승권 주장',
    dateLocation: '헤이스팅스 앞바다'
  });
  if (!letterFallback.includes('선전포고문') && !letterFallback.includes('서한')) throw new Error("Diplomacy letter fallback failed");
  console.log(`✅ PASS: Diplomatic letter fallback generated successfully.`);

  console.log("=== [4] East Asia (Korea, Song, Japan) Province Tests ===");
  const goryeo = INITIAL_PROVINCES.find(p => p.id === 'prov_goryeo')!;
  if (!goryeo || goryeo.rulerName !== '문종 (휘 휘)') throw new Error("Goryeo province missing or invalid ruler");
  if (!goryeo.neighbors.includes('prov_liao_yanzhou') || !goryeo.neighbors.includes('prov_japan_kyoto')) {
    throw new Error("Goryeo neighbors missing Liao or Japan");
  }
  console.log(`✅ PASS: Goryeo Kaegyong province verified (neighbors: ${goryeo.neighbors.join(', ')}).`);

  const kaifeng = INITIAL_PROVINCES.find(p => p.id === 'prov_song_kaifeng')!;
  if (!kaifeng || kaifeng.holdingLevel !== 5) throw new Error("Song Kaifeng missing or not level 5");
  console.log(`✅ PASS: Song Dynasty Kaifeng metropolis verified (Development: ${kaifeng.development}).`);

  // 고려군 징집 및 일본 원정/방어 행군 테스트
  const goryeoArmy = raiseLevies(goryeo, '고려 국왕 문종', true)!;
  if (!goryeoArmy || goryeoArmy.troops !== 700) throw new Error("Goryeo levy raising failed");
  console.log(`✅ PASS: Goryeo royal army raised (${goryeoArmy.troops} troops).`);

  const japan = INITIAL_PROVINCES.find(p => p.id === 'prov_japan_kyoto')!;
  const marchToJapan = orderArmyMove(goryeoArmy, japan, goryeo);
  if (marchToJapan.targetProvinceId !== 'prov_japan_kyoto') throw new Error("March to Japan failed");
  console.log(`✅ PASS: Goryeo fleet movement to Japan ordered successfully.`);

  console.log("=== All Grand Strategy & AI Co-Pilot Tests Passed! ===");
}

runTests().catch(e => {
  console.error("Test failed:", e);
  process.exit(1);
});
