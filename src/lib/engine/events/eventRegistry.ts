import { EngineGameEvent } from '../types';
import { ParsedState } from '../../parser';
import { CHURCH_EVENTS } from './churchEvents';
import { EPIDEMIC_EVENTS } from './epidemicEvents';
import { COURT_EVENTS } from './courtEvents';
import { REALM_EVENTS } from './realmEvents';

export const ALL_GAME_EVENTS: EngineGameEvent[] = [
  ...CHURCH_EVENTS,
  ...EPIDEMIC_EVENTS,
  ...COURT_EVENTS,
  ...REALM_EVENTS
];

export function rollEvent(state: ParsedState, turn: number): EngineGameEvent {
  // 1. 트리거 조건을 만족하는 이벤트 후보군 선별
  const availableEvents = ALL_GAME_EVENTS.filter(e => {
    try {
      return e.trigger(state, turn);
    } catch {
      return false;
    }
  });

  if (availableEvents.length === 0) {
    // 폴백 이벤트: 영지 평온 및 세무 점검
    return REALM_EVENTS[1]; // 풍작 이벤트
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

export function findEventChoiceById(choiceId: string) {
  for (const event of ALL_GAME_EVENTS) {
    const choice = event.choices.find(c => c.id === choiceId);
    if (choice) return { event, choice };
  }
  return null;
}
