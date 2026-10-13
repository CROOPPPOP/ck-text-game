import { EngineGameEvent } from '../types';
import { ParsedState } from '../../parser';
import { CHURCH_EVENTS } from './churchEvents';
import { EPIDEMIC_EVENTS } from './epidemicEvents';
import { COURT_EVENTS } from './courtEvents';
import { REALM_EVENTS } from './realmEvents';
import { HISTORICAL_TIMELINE_EVENTS } from './historicalTimelineEvents';

export const ALL_GAME_EVENTS: EngineGameEvent[] = [
  ...HISTORICAL_TIMELINE_EVENTS,
  ...CHURCH_EVENTS,
  ...EPIDEMIC_EVENTS,
  ...COURT_EVENTS,
  ...REALM_EVENTS
];

export function rollEvent(state: ParsedState, turn: number = 1): EngineGameEvent {
  // 1. 트리거 조건을 만족하는 이벤트 후보군 선별
  const availableEvents = ALL_GAME_EVENTS.filter(e => {
    try {
      return e.trigger(state, turn);
    } catch {
      return false;
    }
  });

  // 1-1. 역사적 크로노-트리거 대사건이 존재할 경우 절대 우선 발동
  const historicalMilestone = availableEvents.find(e => e.category === 'historical');
  if (historicalMilestone) {
    return historicalMilestone;
  }

  if (availableEvents.length === 0) {
    // 폴백 이벤트: 영지 평온 및 세무 점검
    return REALM_EVENTS[1] || ALL_GAME_EVENTS[0];
  }

  // 2. 가중치(Weight) 합산 및 주사위 롤
  const totalWeight = availableEvents.reduce((acc, e) => acc + e.weight, 0);
  let random = Math.random() * totalWeight;

  for (const event of availableEvents) {
    if (random < event.weight) {
      return event;
    }
    random -= event.weight;
  }

  return availableEvents[0];
}

/**
 * 실시간 월간(Monthly) 틱에서 발동할 이벤트 롤링
 * - 역사적 대사건은 조건 만족 시 즉시 발동
 * - 일반 다이내믹 이벤트는 월간 35% 기본 확률로 발생
 * - 이미 발생한 1회성 이벤트는 제외
 */
export function rollMonthlyEvent(
  state: ParsedState,
  turn: number,
  seenEventIds: Set<string>
): EngineGameEvent | null {
  const availableEvents = ALL_GAME_EVENTS.filter(e => {
    if (seenEventIds.has(e.id)) return false;
    try {
      return e.trigger(state, turn);
    } catch {
      return false;
    }
  });

  if (availableEvents.length === 0) return null;

  // 1. 역사적 사건이 발동 가능한 상태면 100% 우선 발생
  const historical = availableEvents.find(e => e.category === 'historical');
  if (historical) {
    return historical;
  }

  // 2. 일반 다이내믹 이벤트는 월간 약 35% 확률로 발생 (너무 잦은 팝업 방지)
  const shouldTrigger = Math.random() < 0.35;
  if (!shouldTrigger) return null;

  const totalWeight = availableEvents.reduce((acc, e) => acc + e.weight, 0);
  let random = Math.random() * totalWeight;

  for (const event of availableEvents) {
    if (random < event.weight) {
      return event;
    }
    random -= event.weight;
  }

  return availableEvents[0];
}

export function findEventChoiceById(choiceId: string) {
  for (const event of ALL_GAME_EVENTS) {
    const choice = event.choices.find(c => c.id === choiceId);
    if (choice) return { event, choice };
  }
  return null;
}
