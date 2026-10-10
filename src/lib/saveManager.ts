"use client";

import { ParsedState, normalizeParsedState } from './parser';
import { parseCKResources, detectPlayerArchetype } from './ckVisuals';
import { sanitizeEstateState } from './estate';

export interface SaveSlotData {
  id: string; // 'slot_1', 'slot_2', 'slot_3', 'slot_4', 'slot_5', 'autosave', 'quicksave'
  title: string;
  timestamp: number;
  turn: number;
  dateLocation: string;
  characterName: string;
  characterTitle: string;
  characterStatus: string;
  archetype: string;
  archetypeTitle: string;
  gold: string;
  levies: string;
  gameState: any;
}

export interface UserUXSettings {
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  typewriterSpeed: number; // 0 for instant, 8 fast, 20 normal, 35 slow
  shortcutsEnabled: boolean;
}

const DEFAULT_SETTINGS: UserUXSettings = {
  fontSize: 'md',
  typewriterSpeed: 20,
  shortcutsEnabled: true
};

const SLOTS_LIST = [
  { id: 'autosave', defaultTitle: '🔄 자동 저장 (Auto Save)' },
  { id: 'quicksave', defaultTitle: '⚡ 퀵 세이브 (Quick Save)' },
  { id: 'slot_1', defaultTitle: '💾 세이브 슬롯 1' },
  { id: 'slot_2', defaultTitle: '💾 세이브 슬롯 2' },
  { id: 'slot_3', defaultTitle: '💾 세이브 슬롯 3' },
  { id: 'slot_4', defaultTitle: '💾 세이브 슬롯 4' },
  { id: 'slot_5', defaultTitle: '💾 세이브 슬롯 5' }
];

// 슬롯 메타데이터 생성 헬퍼
export function createSlotMetadata(
  slotId: string,
  gameState: ParsedState,
  turn: number,
  customTitle?: string
): SaveSlotData {
  const resources = parseCKResources(gameState);
  const archetype = detectPlayerArchetype(gameState);
  const characterName = gameState.personalInfo?.['이름'] || '군주';
  const characterTitle = gameState.personalInfo?.['칭호'] || gameState.personalInfo?.['직위'] || '영주';
  const characterStatus = gameState.personalInfo?.['신분'] || '귀족';
  const rawDate = gameState.dateLocation || '';
  const cleanDate = rawDate.replace(/\[턴 수:.*\]/, '').trim() || '서기 1066년';

  const defaultItem = SLOTS_LIST.find(s => s.id === slotId);
  const finalTitle = customTitle || defaultItem?.defaultTitle || `슬롯 ${slotId}`;

  return {
    id: slotId,
    title: finalTitle,
    timestamp: Date.now(),
    turn,
    dateLocation: cleanDate,
    characterName,
    characterTitle,
    characterStatus,
    archetype,
    archetypeTitle: resources.archetypeTitle,
    gold: resources.gold,
    levies: resources.levies,
    gameState
  };
}

// 모든 슬롯 목록 조회
export function listSaveSlots(): Array<{ id: string; defaultTitle: string; data: SaveSlotData | null }> {
  if (typeof window === 'undefined') return [];

  return SLOTS_LIST.map(slot => {
    try {
      const raw = localStorage.getItem(`ck_slot_${slot.id}`);
      if (!raw) return { id: slot.id, defaultTitle: slot.defaultTitle, data: null };
      const parsed = JSON.parse(raw);
      if (parsed && parsed.gameState) {
        parsed.gameState = normalizeParsedState(sanitizeEstateState(parsed.gameState));
      }
      return { id: slot.id, defaultTitle: slot.defaultTitle, data: parsed as SaveSlotData };
    } catch {
      return { id: slot.id, defaultTitle: slot.defaultTitle, data: null };
    }
  });
}

// 특정 슬롯에 저장
export function saveToSlot(
  slotId: string,
  gameState: ParsedState,
  turn: number,
  constructionQueue: any[] = [],
  customTitle?: string
): boolean {
  if (typeof window === 'undefined' || !gameState) return false;
  try {
    const sanitizedState = normalizeParsedState(sanitizeEstateState(gameState));
    const stateToSave = {
      ...sanitizedState,
      _constructionQueue: constructionQueue,
      _turn: turn
    };
    const metadata = createSlotMetadata(slotId, stateToSave, turn, customTitle);
    localStorage.setItem(`ck_slot_${slotId}`, JSON.stringify(metadata));
    return true;
  } catch (err) {
    console.error('Failed to save slot:', err);
    return false;
  }
}

// 특정 슬롯에서 불러오기
export function loadFromSlot(slotId: string): SaveSlotData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`ck_slot_${slotId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SaveSlotData;
    if (parsed && parsed.gameState) {
      parsed.gameState = normalizeParsedState(sanitizeEstateState(parsed.gameState));
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load slot:', err);
    return null;
  }
}

// 슬롯 삭제
export function deleteSlot(slotId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.removeItem(`ck_slot_${slotId}`);
    return true;
  } catch {
    return false;
  }
}

// 퀵세이브 실행
export function quickSave(
  gameState: ParsedState,
  turn: number,
  constructionQueue: any[] = []
): boolean {
  return saveToSlot('quicksave', gameState, turn, constructionQueue, '⚡ 퀵 세이브 (Quick Save)');
}

// 퀵로드 실행
export function quickLoad(): SaveSlotData | null {
  return loadFromSlot('quicksave');
}

// JSON 파일로 다운로드 내보내기
export function exportSaveToFile(
  gameState: ParsedState,
  turn: number,
  constructionQueue: any[] = []
): void {
  if (typeof window === 'undefined' || !gameState) return;
  const sanitizedState = sanitizeEstateState(gameState);
  const stateToSave = {
    ...sanitizedState,
    _constructionQueue: constructionQueue,
    _turn: turn
  };
  const metadata = createSlotMetadata('export', stateToSave, turn, '내보낸 기록');
  const jsonStr = JSON.stringify(metadata, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  const rulerName = sanitizedState.personalInfo?.['이름'] || '군주';
  a.href = url;
  a.download = `CHRONICLES_${rulerName}_Turn${turn}_${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// JSON 파일에서 읽기
export function importSaveFromFile(file: File): Promise<SaveSlotData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = e.target?.result as string;
        const parsed = JSON.parse(raw);
        // 만약 예전 단순 gameState 형식 파일인 경우 호환성 래핑
        if (!parsed.gameState && (parsed.personalInfo || parsed.dateLocation)) {
          const t = parsed._turn || 1;
          const sanitizedState = sanitizeEstateState(parsed);
          const wrapped = createSlotMetadata('imported', sanitizedState, t, '가져온 세이브');
          resolve(wrapped);
        } else if (parsed.gameState) {
          parsed.gameState = sanitizeEstateState(parsed.gameState);
          resolve(parsed as SaveSlotData);
        } else {
          reject(new Error('유효한 세이브 데이터 구조가 아닙니다.'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsText(file);
  });
}

// 이전 턴 Undo(되돌리기) 스택 관리 (최대 5턴)
const UNDO_STACK_KEY = 'ck_turn_undo_stack';

export function pushUndoState(gameState: ParsedState, turn: number, constructionQueue: any[] = []): void {
  if (typeof window === 'undefined' || !gameState) return;
  try {
    const raw = localStorage.getItem(UNDO_STACK_KEY);
    const stack: any[] = raw ? JSON.parse(raw) : [];
    const sanitizedState = sanitizeEstateState(gameState);
    const snapshot = {
      gameState: { ...sanitizedState, _constructionQueue: constructionQueue, _turn: turn },
      turn,
      timestamp: Date.now()
    };
    stack.push(snapshot);
    // 최대 5턴까지만 유지
    while (stack.length > 5) stack.shift();
    localStorage.setItem(UNDO_STACK_KEY, JSON.stringify(stack));
  } catch {}
}

export function popUndoState(): { gameState: any; turn: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(UNDO_STACK_KEY);
    if (!raw) return null;
    const stack: any[] = JSON.parse(raw);
    if (stack.length === 0) return null;
    const item = stack.pop();
    localStorage.setItem(UNDO_STACK_KEY, JSON.stringify(stack));
    if (item && item.gameState) {
      item.gameState = sanitizeEstateState(item.gameState);
    }
    return item || null;
  } catch {
    return null;
  }
}

/**
 * 브라우저 로컬 스토리지에 저장된 모든 세이브 슬롯 데이터(Vercel 로컬 저장 파일 포함)를 검사하여
 * 장원 올리브 압착장의 레벨을 Lv.2로 복구하고 중복 업그레이드 항목을 영구 제거 및 저장(Self-Healing)합니다.
 */
export function autoMigrateAndSanitizeStorage(): { migratedCount: number } {
  if (typeof window === 'undefined') return { migratedCount: 0 };
  let count = 0;
  try {
    const slotKeys = [
      'autosave', 'quicksave', 'slot_1', 'slot_2', 'slot_3', 'slot_4', 'slot_5'
    ];

    slotKeys.forEach(key => {
      const storageKey = `ck_slot_${key}`;
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      try {
        const slotData = JSON.parse(raw);
        if (slotData && slotData.gameState) {
          const originalStr = JSON.stringify(slotData.gameState);
          slotData.gameState = normalizeParsedState(sanitizeEstateState(slotData.gameState));
          const updatedResources = parseCKResources(slotData.gameState);
          slotData.levies = updatedResources.levies;
          slotData.gold = updatedResources.gold;
          if (JSON.stringify(slotData.gameState) !== originalStr) {
            localStorage.setItem(storageKey, JSON.stringify(slotData));
            count++;
          }
        }
      } catch {}
    });

    // 레거시 ck_auto_save도 마이그레이션
    const legacyAuto = localStorage.getItem('ck_auto_save');
    if (legacyAuto) {
      try {
        const parsed = JSON.parse(legacyAuto);
        const originalStr = JSON.stringify(parsed);
        const sanitized = normalizeParsedState(sanitizeEstateState(parsed));
        if (JSON.stringify(sanitized) !== originalStr) {
          localStorage.setItem('ck_auto_save', JSON.stringify(sanitized));
          count++;
        }
      } catch {}
    }

    // ck_turn_undo_stack도 마이그레이션
    const undoRaw = localStorage.getItem(UNDO_STACK_KEY);
    if (undoRaw) {
      try {
        const stack = JSON.parse(undoRaw);
        if (Array.isArray(stack)) {
          let stackChanged = false;
          stack.forEach((item: any) => {
            if (item && item.gameState) {
              const orig = JSON.stringify(item.gameState);
              item.gameState = normalizeParsedState(sanitizeEstateState(item.gameState));
              if (JSON.stringify(item.gameState) !== orig) {
                stackChanged = true;
              }
            }
          });
          if (stackChanged) {
            localStorage.setItem(UNDO_STACK_KEY, JSON.stringify(stack));
            count++;
          }
        }
      } catch {}
    }
  } catch (err) {
    console.error('autoMigrateAndSanitizeStorage error:', err);
  }
  return { migratedCount: count };
}

export function hasUndoState(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(UNDO_STACK_KEY);
    if (!raw) return false;
    const stack: any[] = JSON.parse(raw);
    return stack.length > 0;
  } catch {
    return false;
  }
}

export function clearUndoStack(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(UNDO_STACK_KEY);
}

// 사용자 편의(UX) 설정
const SETTINGS_KEY = 'ck_user_ux_settings';

export function loadUXSettings(): UserUXSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveUXSettings(settings: Partial<UserUXSettings>): UserUXSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const current = loadUXSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return DEFAULT_SETTINGS;
  }
}
