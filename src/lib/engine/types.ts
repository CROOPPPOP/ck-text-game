import { ParsedState } from '../parser';

export type EventCategory = 'church' | 'epidemic' | 'court' | 'realm' | 'intrigue' | 'tournament' | 'historical';

export interface EventChoiceRequirement {
  stat?: { name: string; minValue: number };
  gold?: number;
  prestige?: number;
  piety?: number;
  trait?: string;
}

export interface EventOptionEffect {
  narrativeOutcome: string;
  judgmentResult: '성공' | '대성공' | '실패' | '치명적 실패';
  positiveFactor?: string;
  negativeFactor?: string;
  resourceChanges?: {
    gold?: number;
    manpower?: number;
    prestige?: number;
    piety?: number;
    papalFavor?: number;
    excommunicationRisk?: number;
    legitimacy?: number;
  };
  traitsToAdd?: string[];
  traitsToRemove?: string[];
  relationDelta?: { name: string; delta: number };
  statBonuses?: Record<string, number>;
  itemGains?: string[];
}

export interface EngineEventChoice {
  id: string;
  text: string;
  probability: string;
  groupType: string;
  requirement?: EventChoiceRequirement;
  resolve: (state: ParsedState) => EventOptionEffect;
}

export interface EngineGameEvent {
  id: string;
  category: EventCategory;
  title: string;
  historicalTag: string;
  narrativeTemplate: string;
  dialogueSpeaker?: string;
  dialogueText?: string;
  trigger: (state: ParsedState, turn: number) => boolean;
  weight: number;
  choices: EngineEventChoice[];
}

export interface DLCResourceStatus {
  papalFavor: number;          // -100 ~ 100
  excommunicationRisk: number; // 0 ~ 100
  investitureType: 'free' | 'papal';
  legitimacy: number;          // 0 ~ 100
  legendLevel: number;         // 0 ~ 3
  epidemicSeverity: number;    // 0 ~ 100
  isQuarantined: boolean;
  courtGrandeur: number;       // 0 ~ 100
}
