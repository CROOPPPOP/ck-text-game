/**
 * 중세 대전략 군사·전쟁 시뮬레이션 엔진 (Military & Warfare Engine)
 * - 100% 로컬 결정론적 연산 (0ms 지연시간, 무환각)
 * - 징집병 소집, 행군 이동, 적 성채 공성전, 필드 회전(Field Battle) 계산
 */

import { Province, TerrainType } from './mapData';
import { BattleDispatchContext } from './aiChronicler';

export interface Army {
  id: string;
  name: string;
  commander: string;
  ownerRealm: string;
  isPlayer: boolean;
  troops: number;
  maxTroops: number;
  locationProvinceId: string;
  targetProvinceId?: string;
  movementProgress: number; // 0 ~ 100%
  movementDurationSeconds: number;
  movementElapsedSeconds: number;
  isSieging: boolean;
  siegeProgress: number; // 0 ~ 100%
  color: string;
}

export interface BattleEventResult {
  provinceId: string;
  provinceName: string;
  attackerArmy: Army;
  defenderArmy: Army;
  winner: 'attacker' | 'defender';
  attackerCasualties: number;
  defenderCasualties: number;
  victoryType: '압도적 승리' | '신승' | '처참한 패배' | '명예로운 후퇴';
  dispatchContext: BattleDispatchContext;
}

// 지형별 이동 소요 시간 배율 (초)
export const TERRAIN_MOVE_TIME: Record<TerrainType, number> = {
  '평야': 4,
  '해안': 5,
  '구릉': 6,
  '산림': 7,
  '습지': 8,
  '산악': 10
};

/**
 * 특정 프로빈스에서 징집병 소집
 */
export function raiseLevies(
  province: Province,
  commanderName: string = '영주 직속 지휘관',
  isPlayer: boolean = true
): Army | null {
  if (province.currentLevies <= 0) return null;

  const troopsToRaise = province.currentLevies;

  return {
    id: `army_${province.id}_${Date.now()}`,
    name: `${province.name} 제${Math.floor(Math.random() * 3) + 1}군단`,
    commander: commanderName,
    ownerRealm: province.realmName,
    isPlayer,
    troops: troopsToRaise,
    maxTroops: troopsToRaise,
    locationProvinceId: province.id,
    movementProgress: 0,
    movementDurationSeconds: 0,
    movementElapsedSeconds: 0,
    isSieging: false,
    siegeProgress: 0,
    color: isPlayer ? '#3b82f6' : province.borderColor || '#ef4444'
  };
}

/**
 * 인접 프로빈스로 군대 이동 명령
 */
export function orderArmyMove(
  army: Army,
  targetProvince: Province,
  currentProvince: Province
): Army {
  // 인접 여부 확인 (neighbor check)
  const isNeighbor = currentProvince.neighbors.includes(targetProvince.id);
  if (!isNeighbor) {
    return army;
  }

  const baseDuration = TERRAIN_MOVE_TIME[targetProvince.terrain] || 5;

  return {
    ...army,
    targetProvinceId: targetProvince.id,
    movementProgress: 0,
    movementDurationSeconds: baseDuration,
    movementElapsedSeconds: 0,
    isSieging: false,
    siegeProgress: 0
  };
}

/**
 * 두 군대 간 필드 회전(Field Battle) 시뮬레이션
 */
export function resolveFieldBattle(
  attacker: Army,
  defender: Army,
  province: Province
): BattleEventResult {
  // 지형 방어 보너스 (구릉 1.2, 산악 1.4 등)
  let terrainDefenseBonus = 1.0;
  if (province.terrain === '산악') terrainDefenseBonus = 1.35;
  if (province.terrain === '구릉') terrainDefenseBonus = 1.2;
  if (province.terrain === '습지') terrainDefenseBonus = 1.15;

  // 주사위 롤 (85% ~ 115%)
  const attackRoll = 0.85 + Math.random() * 0.3;
  const defenseRoll = 0.85 + Math.random() * 0.3;

  const attackerPower = attacker.troops * attackRoll;
  const defenderPower = defender.troops * terrainDefenseBonus * defenseRoll;

  const attackerWins = attackerPower >= defenderPower;

  let attackerCasualties = 0;
  let defenderCasualties = 0;
  let victoryType: '압도적 승리' | '신승' | '처참한 패배' | '명예로운 후퇴' = '신승';

  if (attackerWins) {
    const ratio = attackerPower / Math.max(1, defenderPower);
    attackerCasualties = Math.min(attacker.troops, Math.floor(attacker.troops * 0.15 * (1 / ratio)));
    defenderCasualties = Math.min(defender.troops, Math.floor(defender.troops * (ratio > 1.5 ? 0.6 : 0.35)));
    victoryType = ratio > 1.6 ? '압도적 승리' : '신승';
  } else {
    const ratio = defenderPower / Math.max(1, attackerPower);
    attackerCasualties = Math.min(attacker.troops, Math.floor(attacker.troops * (ratio > 1.5 ? 0.6 : 0.4)));
    defenderCasualties = Math.min(defender.troops, Math.floor(defender.troops * 0.15 * (1 / ratio)));
    victoryType = ratio > 1.6 ? '처참한 패배' : '명예로운 후퇴';
  }

  const winner = attackerWins ? 'attacker' : 'defender';

  const updatedAttacker: Army = {
    ...attacker,
    troops: Math.max(0, attacker.troops - attackerCasualties)
  };
  const updatedDefender: Army = {
    ...defender,
    troops: Math.max(0, defender.troops - defenderCasualties)
  };

  const dispatchContext: BattleDispatchContext = {
    provinceName: province.name,
    terrain: province.terrain,
    attackerName: attacker.ownerRealm,
    attackerCommander: attacker.commander,
    attackerTroops: attacker.troops,
    defenderName: defender.ownerRealm,
    defenderCommander: defender.commander,
    defenderTroops: defender.troops,
    victorName: attackerWins ? attacker.ownerRealm : defender.ownerRealm,
    victoryType,
    casualties: `공격측 -${attackerCasualties}명 / 방어측 -${defenderCasualties}명`
  };

  return {
    provinceId: province.id,
    provinceName: province.name,
    attackerArmy: updatedAttacker,
    defenderArmy: updatedDefender,
    winner,
    attackerCasualties,
    defenderCasualties,
    victoryType,
    dispatchContext
  };
}

/**
 * 틱 단위 군사 업데이트 (이동, 공성, 조우 전투)
 */
export function updateMilitaryTick(
  armies: Army[],
  provinces: Province[],
  deltaSeconds: number
): {
  updatedArmies: Army[];
  updatedProvinces: Province[];
  battleResults: BattleEventResult[];
  siegesCompleted: { provinceId: string; conquerorRealm: string }[];
} {
  let currentArmies = [...armies];
  const provinceMap = new Map<string, Province>(provinces.map(p => [p.id, { ...p }]));
  const battleResults: BattleEventResult[] = [];
  const siegesCompleted: { provinceId: string; conquerorRealm: string }[] = [];

  // 1. 군대 이동 처리
  currentArmies = currentArmies.map(army => {
    if (!army.targetProvinceId) return army;

    const newElapsed = army.movementElapsedSeconds + deltaSeconds;
    const progress = Math.min(100, Math.floor((newElapsed / Math.max(0.1, army.movementDurationSeconds)) * 100));

    if (progress >= 100) {
      // 목적지 도달 완료
      const arrivedProvince = provinceMap.get(army.targetProvinceId);
      const isHostile = arrivedProvince && arrivedProvince.realmName !== army.ownerRealm;

      return {
        ...army,
        locationProvinceId: army.targetProvinceId,
        targetProvinceId: undefined,
        movementProgress: 0,
        movementElapsedSeconds: 0,
        isSieging: Boolean(isHostile),
        siegeProgress: 0
      };
    } else {
      return {
        ...army,
        movementProgress: progress,
        movementElapsedSeconds: newElapsed
      };
    }
  });

  // 2. 동일 프로빈스 내 적대 군대 조우 체크 (회전 발생)
  const provinceArmiesMap = new Map<string, Army[]>();
  for (const army of currentArmies) {
    if (army.targetProvinceId) continue; // 이동 중인 군대는 제외
    const list = provinceArmiesMap.get(army.locationProvinceId) || [];
    list.push(army);
    provinceArmiesMap.set(army.locationProvinceId, list);
  }

  const armiesToRemove = new Set<string>();

  for (const [provId, pArmies] of provinceArmiesMap.entries()) {
    if (pArmies.length >= 2) {
      const playerArmy = pArmies.find(a => a.isPlayer);
      const enemyArmy = pArmies.find(a => !a.isPlayer);

      if (playerArmy && enemyArmy && playerArmy.troops > 0 && enemyArmy.troops > 0) {
        const prov = provinceMap.get(provId);
        if (prov) {
          const battle = resolveFieldBattle(playerArmy, enemyArmy, prov);
          battleResults.push(battle);

          // 사상자 반영
          const updatedAIndex = currentArmies.findIndex(a => a.id === playerArmy.id);
          const updatedDIndex = currentArmies.findIndex(a => a.id === enemyArmy.id);

          if (updatedAIndex !== -1) currentArmies[updatedAIndex] = battle.attackerArmy;
          if (updatedDIndex !== -1) currentArmies[updatedDIndex] = battle.defenderArmy;

          // 패배하거나 전멸한 군대 제거
          if (battle.attackerArmy.troops <= 0) armiesToRemove.add(battle.attackerArmy.id);
          if (battle.defenderArmy.troops <= 0) armiesToRemove.add(battle.defenderArmy.id);
        }
      }
    }
  }

  currentArmies = currentArmies.filter(a => !armiesToRemove.has(a.id) && a.troops > 0);

  // 3. 공성전 처리 (Siege)
  currentArmies = currentArmies.map(army => {
    if (!army.isSieging || army.targetProvinceId) return army;

    const prov = provinceMap.get(army.locationProvinceId);
    if (!prov || prov.realmName === army.ownerRealm) {
      return { ...army, isSieging: false, siegeProgress: 0 };
    }

    // 초당 공성 진행률 (군대 규모 / 성채 방어력 비례)
    const siegeRatePerSec = Math.max(1, Math.min(10, Math.floor((army.troops / Math.max(1, prov.garrison)) * 2.5)));
    const nextProgress = Math.min(100, army.siegeProgress + siegeRatePerSec * deltaSeconds);

    if (nextProgress >= 100) {
      // 성채 함락! 영지 점령 처리
      siegesCompleted.push({
        provinceId: prov.id,
        conquerorRealm: army.ownerRealm
      });

      // 프로빈스 소유주 변경
      prov.realmName = army.ownerRealm;
      prov.color = army.isPlayer ? 'rgba(59, 130, 246, 0.45)' : prov.color;
      prov.borderColor = army.isPlayer ? '#60a5fa' : prov.borderColor;
      prov.isPlayerControlled = army.isPlayer;

      return {
        ...army,
        isSieging: false,
        siegeProgress: 0
      };
    }

    return {
      ...army,
      siegeProgress: nextProgress
    };
  });

  return {
    updatedArmies: currentArmies,
    updatedProvinces: Array.from(provinceMap.values()),
    battleResults,
    siegesCompleted
  };
}
