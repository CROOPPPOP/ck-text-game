// 투트랙(병렬) 영지 건설 메커니즘 & 실시간 건설 엔진.
// - AI가 제안한 건설 후보(BuildOption)를 프론트엔드 큐(QueueItem)로 관리합니다.
// - 턴제 호환(turns, startTurn, completeTurn)과 함께 실시간(durationMonths, elapsedSeconds, progressPercent)을 완벽히 동기화합니다.
// - 실시간 기준: 1달 = 60초(1x), 1일 = 2초.

import { ESTATE_LEVELS } from './estateTheme';
import { getEstateLevel } from './estate';

export interface BuildOption {
  name: string;
  cost: string;
  turns: number;
  months?: number;
  durationSeconds?: number;
  desc: string;
  kind?: 'new' | 'upgrade' | 'promote';
  targetLevel?: number;
  tags?: string[];
}

export interface QueueItem {
  id: string;
  building: string;
  cost: string;
  desc: string;
  startTurn: number;
  completeTurn: number;
  /** 착수 명령(비용 차감 요청)을 AI에게 이미 보냈거나 로컬에서 차감했는지 여부 */
  commandSent: boolean;
  kind?: 'new' | 'upgrade' | 'promote';
  targetLevel?: number;
  tags?: string[];

  // 실시간 건설 메트릭 (하위 호환성을 위해 선택적 필드로 지원)
  durationMonths?: number;
  totalDurationSeconds?: number;
  elapsedSeconds?: number;
  progressPercent?: number;
  completed?: boolean;
}

export const MIN_BUILD_TURNS = 1;
export const MAX_BUILD_TURNS = 12;

/** 날짜/위치 문자열의 [턴 수: N] 에서 턴 번호를 추출합니다. */
export function parseTurnNumber(dateLocation?: string | null): number | null {
  if (!dateLocation) return null;
  const m = dateLocation.match(/\[\s*턴\s*수\s*[:：]\s*(\d+)\s*\]/);
  return m ? parseInt(m[1], 10) : null;
}

/** 거점 규모(Lv.N)에 따른 동시 건설 슬롯 수: 레벨표 기준 (1~2: 2개, 3~4: 3개, 5: 4개) + 관리력 시너지 보너스 */
export function getMaxSlots(estate?: { level?: string } | null, slotBonus: number = 0): number {
  const lv = getEstateLevel(estate?.level);
  const conf = ESTATE_LEVELS[lv as keyof typeof ESTATE_LEVELS];
  return (conf ? conf.slots : 2) + Math.max(0, slotBonus);
}

/** 시설명 비교용 정규화: 괄호(레벨 표기)와 공백, 대괄호 제거 */
const coreName = (s: string) => s.replace(/\(.*?\)|\[|\]/g, '').replace(/\s+/g, '').trim();

export function sameBuildingName(a: string, b: string): boolean {
  const x = coreName(a);
  const y = coreName(b);
  if (!x || !y) return false;
  return x === y;
}

export function clampTurns(n: number): number {
  if (!Number.isFinite(n)) return 3;
  return Math.min(MAX_BUILD_TURNS, Math.max(MIN_BUILD_TURNS, Math.round(n)));
}

let idSeq = 0;
export function createQueueItem(option: BuildOption, currentTurn: number): QueueItem {
  const months = clampTurns(option.months ?? option.turns);
  const totalDurationSeconds = months * 60; // 1달 = 60초
  idSeq += 1;
  return {
    id: `${currentTurn}-${idSeq}-${Date.now().toString(36)}`,
    building: option.name,
    cost: option.cost,
    desc: option.desc,
    startTurn: currentTurn,
    completeTurn: currentTurn + months,
    commandSent: false,
    kind: option.kind || 'new',
    targetLevel: option.targetLevel,
    tags: option.tags,
    durationMonths: months,
    totalDurationSeconds,
    elapsedSeconds: 0,
    progressPercent: 0,
    completed: false
  };
}

export function turnsLeft(item: QueueItem, currentTurn: number): number {
  return Math.max(0, item.completeTurn - currentTurn);
}

/** 저장 데이터(구버전 {building, turnsLeft} 포함)를 현재 형식으로 정규화합니다. */
export function normalizeQueue(raw: any, currentTurn: number): QueueItem[] {
  if (!Array.isArray(raw)) return [];
  const out: QueueItem[] = [];
  raw.forEach((r, i) => {
    if (!r || typeof r.building !== 'string' || !r.building) return;
    const completeTurn = typeof r.completeTurn === 'number'
      ? r.completeTurn
      : currentTurn + clampTurns(Number(r.turnsLeft ?? 1));
    const startTurn = typeof r.startTurn === 'number' ? r.startTurn : currentTurn;
    const durationMonths = typeof r.durationMonths === 'number'
      ? r.durationMonths
      : Math.max(1, completeTurn - startTurn);
    const totalDurationSeconds = typeof r.totalDurationSeconds === 'number'
      ? r.totalDurationSeconds
      : durationMonths * 60;
    const elapsedSeconds = typeof r.elapsedSeconds === 'number' ? r.elapsedSeconds : 0;
    const progressPercent = typeof r.progressPercent === 'number'
      ? r.progressPercent
      : Math.min(100, Math.round((elapsedSeconds / Math.max(1, totalDurationSeconds)) * 100));

    out.push({
      id: typeof r.id === 'string' ? r.id : `legacy-${i}-${r.building}`,
      building: r.building,
      cost: typeof r.cost === 'string' ? r.cost : '',
      desc: typeof r.desc === 'string' ? r.desc : '',
      startTurn,
      completeTurn,
      commandSent: typeof r.commandSent === 'boolean' ? r.commandSent : true,
      kind: r.kind || 'new',
      targetLevel: r.targetLevel,
      tags: r.tags,
      durationMonths,
      totalDurationSeconds,
      elapsedSeconds,
      progressPercent,
      completed: typeof r.completed === 'boolean' ? r.completed : elapsedSeconds >= totalDurationSeconds
    });
  });
  return out;
}

/**
 * 실시간 건설 틱 연산
 * @param queue 현재 건설 큐
 * @param deltaGameSeconds 이번 틱에서 경과한 유효 게임 초 (deltaTime * speed)
 * @returns { updatedQueue, completedItems }
 */
export function tickConstructionQueue(
  queue: QueueItem[],
  deltaGameSeconds: number
): { updatedQueue: QueueItem[]; completedItems: QueueItem[] } {
  if (deltaGameSeconds <= 0 || queue.length === 0) {
    return { updatedQueue: queue, completedItems: [] };
  }

  const updatedQueue: QueueItem[] = [];
  const completedItems: QueueItem[] = [];

  queue.forEach(item => {
    if (item.completed) {
      completedItems.push(item);
      return;
    }

    const totalSec = item.totalDurationSeconds ?? Math.max(1, (item.durationMonths ?? Math.max(1, item.completeTurn - item.startTurn))) * 60;
    const curElapsed = item.elapsedSeconds ?? 0;
    const newElapsed = Math.min(totalSec, curElapsed + deltaGameSeconds);
    const newProgress = Math.min(100, Math.round((newElapsed / Math.max(1, totalSec)) * 100));
    const isCompleted = newElapsed >= totalSec;

    const updatedItem: QueueItem = {
      ...item,
      totalDurationSeconds: totalSec,
      elapsedSeconds: newElapsed,
      progressPercent: newProgress,
      completed: isCompleted
    };

    if (isCompleted) {
      completedItems.push(updatedItem);
    } else {
      updatedQueue.push(updatedItem);
    }
  });

  return { updatedQueue, completedItems };
}

/**
 * 건설 잔여 시간 포맷팅
 * 1달 = 60초, 1일 = 2초
 */
export function formatConstructionTimeLeft(item: QueueItem): string {
  const totalSec = item.totalDurationSeconds ?? Math.max(1, (item.durationMonths ?? Math.max(1, item.completeTurn - item.startTurn))) * 60;
  const curElapsed = item.elapsedSeconds ?? 0;
  const remSec = Math.max(0, totalSec - curElapsed);
  if (remSec <= 0) return '완공 임박';

  const remMonths = Math.floor(remSec / 60);
  const remDays = Math.floor((remSec % 60) / 2);

  const mm = String(Math.floor(remSec / 60)).padStart(2, '0');
  const ss = String(Math.floor(remSec % 60)).padStart(2, '0');

  if (remMonths > 0) {
    return `${remMonths}달 ${remDays}일 남음 (${mm}:${ss})`;
  }
  return `${remDays}일 남음 (${ss}초)`;
}

/**
 * 완공된 시설을 영지(estate) 상태에 실시간 반영
 */
export function applyCompletedBuildingToEstate(estate: any, item: QueueItem): any {
  if (!estate) return estate;
  const cloned = JSON.parse(JSON.stringify(estate));
  const buildings = Array.isArray(cloned.buildings) ? cloned.buildings : [];

  if (item.kind === 'promote') {
    // 거점 승격
    cloned.level = item.building;
  } else if (item.kind === 'upgrade') {
    // 건물 업그레이드
    const targetLv = item.targetLevel || 2;
    const cleanName = item.building.replace(/\s*업그레이드.*$/i, '').replace(/[\(\[\{]?(?:Lv\.?|레벨)\s*\d+.*$/i, '').trim();
    let found = false;
    buildings.forEach((b: any) => {
      if (sameBuildingName(b.name, cleanName)) {
        b.level = targetLv;
        b.name = `${cleanName} Lv.${targetLv}`;
        if (item.tags && item.tags.length > 0) {
          b.tags = Array.from(new Set([...(b.tags || []), ...item.tags]));
        }
        found = true;
      }
    });
    if (!found) {
      buildings.push({
        name: `${cleanName} Lv.${targetLv}`,
        level: targetLv,
        tags: item.tags || ['강화'],
        desc: item.desc || '완공된 상급 영지 시설'
      });
    }
  } else {
    // 신규 건설
    const cleanName = item.building.replace(/[\(\[\{]?(?:Lv\.?|레벨)\s*\d+.*$/i, '').trim();
    const targetLv = item.targetLevel || 1;
    let found = false;
    buildings.forEach((b: any) => {
      if (sameBuildingName(b.name, cleanName)) {
        b.level = targetLv;
        found = true;
      }
    });
    if (!found) {
      buildings.push({
        name: cleanName,
        level: targetLv,
        tags: item.tags || ['인프라'],
        desc: item.desc || '새롭게 축조된 영지 시설'
      });
    }
  }

  cloned.buildings = buildings;
  return cloned;
}

/** AI가 현재 공사 현황을 알 수 있도록 요청에 실어 보내는 요약본 */
export function summarizeQueue(queue: QueueItem[], currentTurn: number) {
  return queue.map((q) => ({
    building: q.building,
    turnsLeft: turnsLeft(q, currentTurn),
    progressPercent: q.progressPercent,
    durationMonths: q.durationMonths
  }));
}

export interface SystemCommandResult {
  /** 플레이어 행동 뒤에 덧붙일 [시스템 명령] 텍스트 (없으면 빈 문자열) */
  text: string;
  /** 이번 행동에서 착수 명령을 보내는 항목 id */
  startedIds: string[];
  /** 이번 행동으로 만들어질 다음 턴에 완공되는 항목 id */
  completedIds: string[];
}

/**
 * 다음 행동(= 다음 턴 생성)에 덧붙일 시스템 명령을 만듭니다.
 */
export function buildSystemCommands(queue: QueueItem[], currentTurn: number): SystemCommandResult {
  const lines: string[] = [];
  const startedIds: string[] = [];
  const completedIds: string[] = [];
  const nextTurn = currentTurn + 1;

  queue.forEach((q) => {
    if (!q.commandSent) {
      const turns = Math.max(1, q.completeTurn - q.startTurn);
      let costText = q.cost ? q.cost : '명시된 비용 없음';
      if (costText.includes('단위') || costText.includes('기준가')) {
        costText = costText.replace(/단위/g, '닢').replace(/\(기준가.*?\)/g, '정규 승격 비용');
      }
      if (q.kind === 'promote') {
        lines.push(
          `[시스템 명령] 거점 승격 착수: ${q.building} (비용: ${costText}, ${turns}달 소요). ` +
          `소지품/자원에서 비용을 정확히 차감하세요. 완공 명령이 오기 전까지는 【 영지 및 야영지 상태 】의 [거점 규모]를 변경하지 마세요.`
        );
      } else if (q.kind === 'upgrade') {
        const cleanName = q.building.replace(/\s*업그레이드.*$/i, '').replace(/[\(\[\{]?(?:Lv\.?|레벨)\s*\d+.*$/i, '').trim() || q.building;
        const targetLv = q.targetLevel || 2;
        lines.push(
          `[시스템 명령] 건물 업그레이드 착수: ${cleanName} (목표: Lv.${targetLv}, 비용: ${costText}, ${turns}달 소요). ` +
          `소지품/자원에서 비용을 정확히 차감하세요. 완공 명령이 오기 전까지는 【 영지 및 야영지 상태 】 건물 레벨을 올리지 마세요.`
        );
      } else {
        lines.push(
          `[시스템 명령] 건설 착수: ${q.building} (비용: ${costText}, ${turns}달 소요). ` +
          `소지품/자원에서 비용을 정확히 차감하세요. 완공 명령이 오기 전까지는 【 영지 및 야영지 상태 】 건물 목록에 추가하지 마세요. ` +
          `자원이 부족해 불가능하면 차감하지 말고 【 건설 가능 시설 】 안에 [건설 거부: ${q.building} - 사유] 를 출력하세요.`
        );
      }
      startedIds.push(q.id);
    }
  });

  queue.forEach((q) => {
    if (q.completeTurn <= nextTurn || q.completed) {
      if (q.kind === 'promote') {
        lines.push(
          `[시스템 명령] 거점 승격 완공: ${q.building}. ` +
          `【 영지 및 야영지 상태 】의 [거점 규모]를 갱신하고, 상황 서술에 거점이 크게 발전하고 승격하는 장면을 서술하세요.`
        );
      } else if (q.kind === 'upgrade') {
        const cleanName = q.building.replace(/\s*업그레이드.*$/i, '').replace(/[\(\[\{]?(?:Lv\.?|레벨)\s*\d+.*$/i, '').trim() || q.building;
        const targetLv = q.targetLevel || 2;
        const tagHint = q.tags && q.tags.length > 0 ? ` [${q.tags.join('·')}]` : '';
        lines.push(
          `[시스템 명령] 건물 업그레이드 완공: ${cleanName} Lv.${targetLv}${tagHint}. ` +
          `【 영지 및 야영지 상태 】 목록에 반드시 "▶ [${cleanName} Lv.${targetLv}]${tagHint}: (강화된 2배 이상의 상세 효과 및 수익 묘사)" 형식으로 헤더에 'Lv.${targetLv}'를 명시하여 갱신하고, ` +
          `★서사 서술 절대 규칙: 【 현재 상황 】 서술 본문에는 'Lv.${targetLv}', 'Lv.2' 같은 시스템 레벨 숫자를 절대로 쓰지 마십시오. 대신 "석조 성벽을 증축하고 마구간을 넓힌 병영", "서고를 2층으로 높여 고문서를 확충한 사제관"처럼 시대상에 맞는 웅장한 건축적 증축 묘사나 수호대장/가신의 생생한 보고 대사로만 서술하고, 해당 효과 태그에 맞춰 【 세력 상태 】 수치에 소폭 긍정적 변화를 반영하십시오.`
        );
      } else {
        const cleanName = q.building.replace(/[\(\[\{]?(?:Lv\.?|레벨)\s*\d+.*$/i, '').trim() || q.building;
        const targetLv = q.targetLevel || 1;
        const tagHint = q.tags && q.tags.length > 0 ? ` [${q.tags.join('·')}]` : '';
        lines.push(
          `[시스템 명령] 건설 완공: ${cleanName} Lv.${targetLv}${tagHint}. ` +
          `【 영지 및 야영지 상태 】 건물 목록에 "▶ [${cleanName} Lv.${targetLv}]${tagHint}: (상세 기능 및 효과)" 형식으로 추가(이미 있으면 레벨 갱신)하고, ` +
          `★서사 서술 절대 규칙: 【 현재 상황 】 서술 본문에는 'Lv.${targetLv}' 등의 메타 레벨 숫자를 절대로 직접 쓰지 말고, 완공된 건물의 위용과 현장 인물(수호대장, 집사 등)의 생생한 보고 대사로 자연스럽게 묘사하며 세력 수치에 반영하십시오.`
        );
      }
      completedIds.push(q.id);
    }
  });

  return { text: lines.join('\n'), startedIds, completedIds };
}

/** 응답을 받은 뒤 큐를 갱신합니다: 완공/거부 항목 제거, 착수 명령을 보낸 항목 표시 */
export function applyTurnResult(
  queue: QueueItem[],
  sent: { startedIds: string[]; completedIds: string[] },
  rejectedNames: string[] = []
): QueueItem[] {
  return queue
    .filter((q) => !sent.completedIds.includes(q.id) && !rejectedNames.some((r) => sameBuildingName(r, q.building)))
    .map((q) => (sent.startedIds.includes(q.id) ? { ...q, commandSent: true } : q));
}
