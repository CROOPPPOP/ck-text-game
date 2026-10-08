// 투트랙(병렬) 영지 건설 메커니즘의 순수 로직.
// - AI가 제안한 건설 후보(BuildOption)를 프론트엔드 큐(QueueItem)로 관리합니다.
// - 완공 시점은 '턴 번호'로 저장하므로 새로고침/불러오기 이후에도 안전합니다.
// - 자원 차감과 완공 묘사는 [시스템 명령] 텍스트로 AI에게 위임합니다.

import { ESTATE_LEVELS } from './estateTheme';
import { getEstateLevel } from './estate';

export interface BuildOption {
  name: string;
  cost: string;
  turns: number;
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
  /** 착수 명령(비용 차감 요청)을 AI에게 이미 보냈는지 여부 */
  commandSent: boolean;
  kind?: 'new' | 'upgrade' | 'promote';
  targetLevel?: number;
  tags?: string[];
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
  const turns = clampTurns(option.turns);
  idSeq += 1;
  return {
    id: `${currentTurn}-${idSeq}-${Date.now().toString(36)}`,
    building: option.name,
    cost: option.cost,
    desc: option.desc,
    startTurn: currentTurn,
    completeTurn: currentTurn + turns,
    commandSent: false,
    kind: option.kind || 'new',
    targetLevel: option.targetLevel,
    tags: option.tags,
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
        out.push({
      id: typeof r.id === 'string' ? r.id : `legacy-${i}-${r.building}`,
      building: r.building,
      cost: typeof r.cost === 'string' ? r.cost : '',
      desc: typeof r.desc === 'string' ? r.desc : '',
      startTurn: typeof r.startTurn === 'number' ? r.startTurn : currentTurn,
      completeTurn,
      commandSent: typeof r.commandSent === 'boolean' ? r.commandSent : true,
      kind: r.kind || 'new',
      targetLevel: r.targetLevel,
      tags: r.tags,
    });
  });
  return out;
}

/** AI가 현재 공사 현황을 알 수 있도록 요청에 실어 보내는 요약본 */
export function summarizeQueue(queue: QueueItem[], currentTurn: number) {
  return queue.map((q) => ({ building: q.building, turnsLeft: turnsLeft(q, currentTurn) }));
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
 * - 아직 착수 명령을 보내지 않은 항목: 비용 차감 요청
 * - 완공 턴이 다음 턴(currentTurn + 1) 이하인 항목: 완공 처리 요청
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
          `[시스템 명령] 거점 승격 착수: ${q.building} (비용: ${costText}, ${turns}턴 소요). ` +
          `소지품/자원에서 비용을 정확히 차감하세요. 완공 명령이 오기 전까지는 【 영지 및 야영지 상태 】의 [거점 규모]를 변경하지 마세요.`
        );
      } else if (q.kind === 'upgrade') {
        lines.push(
          `[시스템 명령] 건물 업그레이드 착수: ${q.building} (비용: ${costText}, ${turns}턴 소요). ` +
          `소지품/자원에서 비용을 정확히 차감하세요. 완공 명령이 오기 전까지는 【 영지 및 야영지 상태 】 건물 레벨을 올리지 마세요.`
        );
      } else {
        lines.push(
          `[시스템 명령] 건설 착수: ${q.building} (비용: ${costText}, ${turns}턴 소요). ` +
          `소지품/자원에서 비용을 정확히 차감하세요. 완공 명령이 오기 전까지는 【 영지 및 야영지 상태 】 건물 목록에 추가하지 마세요. ` +
          `자원이 부족해 불가능하면 차감하지 말고 【 건설 가능 시설 】 안에 [건설 거부: ${q.building} - 사유] 를 출력하세요.`
        );
      }
      startedIds.push(q.id);
    }
  });

  queue.forEach((q) => {
    if (q.completeTurn <= nextTurn) {
      if (q.kind === 'promote') {
        lines.push(
          `[시스템 명령] 거점 승격 완공: ${q.building}. ` +
          `【 영지 및 야영지 상태 】의 [거점 규모]를 갱신하고, 상황 서술에 거점이 크게 발전하고 승격하는 장면을 서술하세요.`
        );
      } else if (q.kind === 'upgrade') {
        const tagHint = q.tags && q.tags.length > 0 ? ` (효과 태그: ${q.tags.join('·')})` : '';
        lines.push(
          `[시스템 명령] 건물 업그레이드 완공: ${q.building}${tagHint}. ` +
          `【 영지 및 야영지 상태 】 건물 레벨을 갱신하고, 해당 효과 태그에 맞춰 【 세력 상태 】 수치에 소폭 긍정적 변화를 반영하며 완공 장면을 서술하세요.`
        );
      } else {
        const tagHint = q.tags && q.tags.length > 0 ? ` (효과 태그: ${q.tags.join('·')})` : '';
        lines.push(
          `[시스템 명령] 건설 완공: ${q.building}${tagHint}. ` +
          `【 영지 및 야영지 상태 】 건물 목록에 추가(이미 있으면 레벨 갱신)하고, 해당 효과 태그를 세력 수치에 반영하며 이번 상황 서술에 완공 장면을 자연스럽게 섞으세요.`
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
