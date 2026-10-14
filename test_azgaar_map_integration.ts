import { FANTASY_PROVINCES } from './src/lib/engine/mapPresets/fantasyWorld';
import { parseAzgaarGeoJSON, convertAzgaarProvinceToCK } from './src/lib/engine/azgaarConverter';
import { raiseLevies, orderArmyMove, resolveFieldBattle } from './src/lib/engine/militaryEngine';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ [MAP TEST FAIL]: ${msg}`);
    throw new Error(msg);
  }
}

async function runAzgaarMapTests() {
  console.log("=================================================");
  console.log("   🗺️ Azgaar's Fantasy Map Generator 연동 테스트  ");
  console.log("=================================================\n");

  console.log("=== [1] 에테리아 판타지 맵 프로빈스 위상수학(Topology) 검증 ===");
  assert(FANTASY_PROVINCES.length >= 8, `최소 8개 이상의 판타지 프로빈스가 등록되어야 함 (실제: ${FANTASY_PROVINCES.length})`);
  console.log(`✅ PASS: 총 ${FANTASY_PROVINCES.length}개 판타지 프로빈스 로드 완료.`);

  const provMap = new Map(FANTASY_PROVINCES.map(p => [p.id, p]));

  // 1-1. 고립 프로빈스 및 유효 이웃 검증
  FANTASY_PROVINCES.forEach(p => {
    assert(Boolean(p.svgPath && p.svgPath.length > 10), `Province ${p.name}(${p.id})에 유효한 svgPath가 있어야 함`);
    assert(Boolean(p.neighbors && p.neighbors.length > 0), `Province ${p.name}(${p.id})은 최소 1개 이상의 이웃이 있어야 함 (고립 금지)`);
    
    // 이웃 ID가 실제로 존재하는지 검증
    p.neighbors.forEach(nId => {
      assert(provMap.has(nId), `Province ${p.name}의 이웃 ID ${nId}가 맵에 존재하지 않음`);
      
      // 국경 대칭성(Symmetry) 검증: A의 이웃이 B라면 B의 이웃에도 A가 있어야 함
      const neighborProv = provMap.get(nId)!;
      assert(
        neighborProv.neighbors.includes(p.id),
        `국경 비대칭 감지: ${p.name}(${p.id}) -> ${neighborProv.name}(${nId})는 있으나 역방향 없음`
      );
    });
  });
  console.log("✅ PASS: 모든 프로빈스의 SVG 패스, 좌표 및 국경 대칭성 검증 완료.");

  console.log("\n=== [2] Azgaar GeoJSON 변환기(Parser) 검증 ===");
  const mockGeoJson = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          id: "prov_custom_1",
          name: "비룡 계곡",
          realm: "비룡 공국",
          biome: "Mountain",
          population: 3500,
          neighbors: ["prov_custom_2"]
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [[100, 100], [200, 100], [200, 200], [100, 200], [100, 100]]
          ]
        }
      },
      {
        type: "Feature",
        properties: {
          id: "prov_custom_2",
          name: "비룡 항구",
          realm: "비룡 공국",
          biome: "Marine",
          population: 2400,
          neighbors: ["prov_custom_1"]
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [[200, 100], [300, 100], [300, 200], [200, 200], [200, 100]]
          ]
        }
      }
    ]
  };

  const parsed = parseAzgaarGeoJSON(mockGeoJson);
  assert(parsed.length === 2, `GeoJSON 변환 결과 2개 프로빈스여야 함 (실제: ${parsed.length})`);
  assert(parsed[0].terrain === '산악', `Mountain 생태군이 '산악'으로 자동 매핑되어야 함: ${parsed[0].terrain}`);
  assert(parsed[1].terrain === '해안', `Marine 생태군이 '해안'으로 자동 매핑되어야 함: ${parsed[1].terrain}`);
  assert(parsed[0].svgPath.startsWith('M 100 100'), `SVG 패스 생성 확인: ${parsed[0].svgPath}`);
  console.log("✅ PASS: Azgaar GeoJSON 파서 및 생태군 매핑 검증 완료.");

  console.log("\n=== [3] Azgaar 판타지 맵과 군사 엔진 연동 검증 ===");
  const valencia = provMap.get('prov_valencia')!;
  const eldoria = provMap.get('prov_eldoria')!;

  // 발렌시아에서 군대 징집
  const valenciaArmy = raiseLevies(valencia, '알렉산더 4세', true);
  assert(Boolean(valenciaArmy && valenciaArmy.troops > 0), `발렌시아 징집병 생성 실패: ${valenciaArmy?.troops}`);

  if (!valenciaArmy) throw new Error("valenciaArmy is null");

  // 엘도리아로 진격 명령
  const march = orderArmyMove(valenciaArmy, eldoria, valencia);
  assert(march.targetProvinceId === eldoria.id, '진격 목표가 엘도리아여야 함');
  assert(march.movementDurationSeconds > 0, '이동 소요 시간이 정상 계산되어야 함');

  // 야전 결전 시뮬레이션
  const elfDefender = raiseLevies(eldoria, '엘레니아 대여공', false);
  if (!elfDefender) throw new Error("elfDefender is null");
  const battle = resolveFieldBattle(valenciaArmy, elfDefender, eldoria);
  assert(battle.winner === 'attacker' || battle.winner === 'defender', '전투 승패 정상 결정');
  console.log(`✅ PASS: 판타지 프로빈스 간 징집, 진격, 야전 결전(${battle.victoryType}) 완벽 연동.`);

  console.log("\n🎉 ALL AZGAAR MAP INTEGRATION TESTS PASSED! 🎉");
}

runAzgaarMapTests().catch(err => {
  console.error("Map Test Failed:", err);
  process.exit(1);
});
