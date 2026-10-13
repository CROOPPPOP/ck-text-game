"use client";

import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import { checkPromotion, getUpgradeCandidates, mergeEstateBuildings } from '@/lib/estate';
import { calculateEstatePromotionCost, getPlayerWealthAmount } from '@/lib/estateEconomy';
import { parsePopulationCount } from '@/lib/populationEconomy';
import { calculateCKAttributes, detectPlayerArchetype, applyTurnResourceAccumulation } from '@/lib/ckVisuals';
import { getCouncilVassals, sanitizeNameAndRole } from '@/lib/characterRelations';
import { ParsedState, ChronicleItem, parseLLMResponse, normalizeParsedState } from '@/lib/parser';
import { QueueItem, BuildOption, parseTurnNumber, getMaxSlots, createQueueItem, turnsLeft, normalizeQueue, summarizeQueue, buildSystemCommands, applyTurnResult, sameBuildingName, tickConstructionQueue, formatConstructionTimeLeft, applyCompletedBuildingToEstate } from '@/lib/construction';
import { GameDate, GameSpeed, parseDateLocation, formatDateLocation, formatCleanDate, advanceGameTime } from '@/lib/engine/timeEngine';
import { rollMonthlyEvent } from '@/lib/engine/events/eventRegistry';
import CKTopHud from '@/components/CKTopHud';
import CKCharacterModal from '@/components/CKCharacterModal';
import FamilyTreeModal from '@/components/FamilyTreeModal';
import CKRealmModal from '@/components/CKRealmModal';
import CKRelationsModal from '@/components/CKRelationsModal';
import ChronicleModal from '@/components/ChronicleModal';
import CKSaveModal from '@/components/CKSaveModal';
import CKSettingsModal from '@/components/CKSettingsModal';
import CKEventModal, { EventOutcomeData } from '@/components/CKEventModal';
import { CKDecision } from '@/lib/ckDecisions';
import { PromotionTarget } from '@/lib/statusPromotion';
import {
  pushUndoState,
  popUndoState,
  hasUndoState,
  quickSave,
  quickLoad,
  loadUXSettings,
  autoMigrateAndSanitizeStorage,
  saveToSlot,
  UserUXSettings,
  SaveSlotData
} from '@/lib/saveManager';
import { sanitizeEstateState } from '@/lib/estate';
import { mergeFactionLists } from '@/lib/factionRelations';
import { createInitialGameState, processTurn } from '@/lib/engine/simulationCore';
import { Province, INITIAL_PROVINCES, MapMode, CouncilTask } from '@/lib/engine/mapData';
import { Army, raiseLevies, orderArmyMove, updateMilitaryTick, BattleEventResult } from '@/lib/engine/militaryEngine';
import { requestBattleDispatch } from '@/lib/engine/aiChronicler';
import CKMapView from '@/components/CKMapView';
import CKProvinceInspector from '@/components/CKProvinceInspector';
import CKCharacterDialogueModal, { DialogueCharacter } from '@/components/CKCharacterDialogueModal';
import CKApiKeyModal from '@/components/CKApiKeyModal';

const TypewriterText = ({ text, delay = 20 }: { text: string; delay?: number }) => {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (delay <= 0) {
      setCurrentText(text);
      setCurrentIndex(text.length);
      return;
    }
    setCurrentText('');
    setCurrentIndex(0);
  }, [text, delay]);

  useEffect(() => {
    if (delay <= 0) return;
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setCurrentText(prevText => prevText + text[currentIndex]);
        setCurrentIndex(prevIndex => prevIndex + 1);
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, delay, text]);

  return <span>{currentText}</span>;
};

const getChoiceTheme = (groupType?: string) => {
  if (!groupType) return { bg: 'linear-gradient(135deg, rgba(35, 27, 21, 0.75), rgba(22, 17, 13, 0.85))', border: 'var(--gold-accent)', icon: '💬' };
  
  if (groupType.includes('개인 전투')) {
    return { bg: 'linear-gradient(135deg, rgba(92, 19, 19, 0.8), rgba(58, 14, 14, 0.9))', border: '#a83232', icon: '⚔️' };
  }
  if (groupType.includes('국가') || groupType.includes('세력')) {
    return { bg: 'linear-gradient(135deg, rgba(32, 25, 20, 0.85), rgba(20, 16, 12, 0.95))', border: 'var(--gold-dim)', icon: '🚩' };
  }
  if (groupType.includes('돌발') || groupType.includes('위기')) {
    return { bg: 'linear-gradient(135deg, rgba(120, 53, 15, 0.75), rgba(77, 34, 10, 0.85))', border: '#d97706', icon: '⚠️' };
  }
  
  return { bg: 'linear-gradient(135deg, rgba(35, 27, 21, 0.75), rgba(22, 17, 13, 0.85))', border: 'var(--gold-accent)', icon: '💬' };
};

const mergeObject = (prev: any, next: any) => {
  if (!next) return prev;
  if (!prev) return next;
  return { ...prev, ...next };
};

const extractLivePreview = (raw: string): string => {
  const narrativeMatch = raw.match(/【\s*현재 상황\s*】\s*\n([\s\S]*?)(?=\n\s*【|$)/);
  if (narrativeMatch && narrativeMatch[1].trim()) {
    return narrativeMatch[1].replace(/\[역사적 고증:.*?\]/g, '').trim();
  }
  const judgmentMatch = raw.match(/【\s*판정 결과\s*】\s*\n([\s\S]*?)(?=\n\s*【|$)/);
  if (judgmentMatch && judgmentMatch[1].trim()) {
    return judgmentMatch[1].trim();
  }
  return raw.trim();
};

const readGameStream = async (response: Response, onText: (text: string) => void) => {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/event-stream")) {
    return await response.json();
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("ReadableStream not supported");
  const decoder = new TextDecoder();
  let buffer = "";
  let fullRaw = "";
  let finalResult: { raw: string; parsed: any } | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() || "";

    for (const block of lines) {
      const match = block.match(/^data:\s*(.*)$/m);
      if (match) {
        try {
          const payload = JSON.parse(match[1]);
          if (payload.type === "chunk") {
            fullRaw += payload.text;
            onText(fullRaw);
          } else if (payload.type === "done") {
            finalResult = { raw: payload.raw, parsed: payload.parsed };
          } else if (payload.type === "error") {
            throw new Error(payload.error);
          }
        } catch (e: any) {
          if (e.message && !e.message.includes("JSON")) throw e;
        }
      }
    }
  }

  if (!finalResult && fullRaw) {
    finalResult = { raw: fullRaw, parsed: parseLLMResponse(fullRaw) };
  }
  return finalResult;
};

export default function Home() {
  const [gameState, setGameState] = useState<ParsedState | null>(null);
  const [loading, setLoading] = useState(false);
  const [streamPreview, setStreamPreview] = useState("");
  const [freeAction, setFreeAction] = useState("");
  const [hasAutoSave, setHasAutoSave] = useState(false);
  const [activeModal, setActiveModal] = useState<'character' | 'familyTree' | 'realm' | 'relations' | 'chronicle' | 'save' | 'settings' | null>(null);
  const [realmInitialTab, setRealmInitialTab] = useState<'realm' | 'estate'>('realm');
  const [constructionQueue, setConstructionQueue] = useState<QueueItem[]>([]);
  const [turn, setTurn] = useState(0);
  const [gameSpeed, setGameSpeed] = useState<GameSpeed>(1);
  const [isPaused, setIsPaused] = useState<boolean>(true);
  const [gameDate, setGameDate] = useState<GameDate>({ year: 1066, month: 10, day: 14, season: '가을' });
  const [monthProgressPercent, setMonthProgressPercent] = useState<number>(0);
  const [seenEventIds, setSeenEventIds] = useState<Set<string>>(new Set());
  const lastTickTimeRef = useRef<number>(Date.now());
  const accumulatedSecRef = useRef<number>(0);
  const prevModalRef = useRef<'character' | 'familyTree' | 'realm' | 'relations' | 'chronicle' | 'save' | 'settings' | null>(null);
  const wasPausedBeforeModalRef = useRef<boolean>(true);
  const [constructionNotice, setConstructionNotice] = useState('');
  const [uxSettings, setUxSettings] = useState<UserUXSettings>(loadUXSettings());
  const [canUndo, setCanUndo] = useState(false);
  const [quickNotice, setQuickNotice] = useState<string | null>(null);
  const [activeEvent, setActiveEvent] = useState<{
    type: 'decision' | 'promotion';
    decision?: CKDecision;
    promotionTarget?: PromotionTarget;
  } | null>(null);

  // 🗺️ 대전략 지도, 군사 및 AI 서관 상태
  const [provinces, setProvinces] = useState<Province[]>(INITIAL_PROVINCES);
  const [armies, setArmies] = useState<Army[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>('prov_wessex');
  const [selectedArmyId, setSelectedArmyId] = useState<string | null>(null);
  const [activeDialogueCharacter, setActiveDialogueCharacter] = useState<DialogueCharacter | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [dispatchLogs, setDispatchLogs] = useState<{ id: string; time: string; text: string; type: 'battle' | 'diplomacy' | 'event' }[]>([]);
  const [mapMode, setMapMode] = useState<MapMode>('political');
  const [isAtWar, setIsAtWar] = useState<boolean>(false);
  const [warScore, setWarScore] = useState<number>(0);

  // API Key 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('ck_api_key') || '';
      setApiKey(savedKey);
    }
  }, []);

  const showQuickNotice = (msg: string) => {
    setQuickNotice(msg);
    setTimeout(() => setQuickNotice(null), 3000);
  };

  const handleConfirmEventOutcome = (updatedState: ParsedState, outcome: EventOutcomeData) => {
    setGameState(updatedState);
    saveToSlot('autosave', updatedState, turn, constructionQueue);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ck_auto_save', JSON.stringify({ ...updatedState, _constructionQueue: constructionQueue, _turn: turn }));
    }
    setActiveEvent(null);
    showQuickNotice(outcome.type === 'decision' 
      ? `✨ '${outcome.data.title}' 칙령이 성공적으로 영지에 반포되었습니다! (턴 ${turn} 유지)`
      : `👑 '${outcome.data.newRank}'(으)로 승격되었습니다! (턴 ${turn} 유지)`
    );
  };

  const getFontSizeStyle = (size: string) => {
    switch (size) {
      case 'sm': return '0.92rem';
      case 'lg': return '1.2rem';
      case 'xl': return '1.35rem';
      default: return '1.05rem';
    }
  };

  const handleInitialStart = async (config: any) => {
    setLoading(true);
    setStreamPreview("");
    try {
      const apiKey = localStorage.getItem('ck_api_key') || '';
      const useGemini = uxSettings.simulationMode === 'gemini' && apiKey;

      let parsedResult: any = null;

      if (!useGemini) {
        // ⚡ 로컬 결정론적 룰 기반 엔진으로 즉시 시작 (0.01초, 비용 0원, 무환각)
        parsedResult = createInitialGameState(config);
      } else {
        const response = await fetch('/api/game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: config, 
            isInitialSetup: true,
            currentState: null,
            apiKey,
            stream: true
          })
        });
        const data = await readGameStream(response, (raw) => {
          setStreamPreview(extractLivePreview(raw));
        });
        if (data?.parsed) {
          parsedResult = data.parsed;
        } else if (data?.error) {
          alert("API 에러: " + data.error);
          if (data.error.includes("키가 제공되지 않았습니다")) window.location.href = '/startup';
          setLoading(false);
          return;
        }
      }

      if (parsedResult) {
        // 유저가 선택한 신분 프리셋 확실히 보장
        if (config.playerStatus) {
          if (!parsedResult.personalInfo) {
            parsedResult.personalInfo = {};
          }
          parsedResult.personalInfo['신분'] = config.playerStatus;
          if (!parsedResult.personalInfo['직위'] || parsedResult.personalInfo['직위'] === '귀족' || parsedResult.personalInfo['직위'] === '영주') {
            parsedResult.personalInfo['직위'] = config.playerStatus;
          }
        }
        const initialChronicle: ChronicleItem = {
          turn: 1,
          dateLocation: parsedResult.dateLocation,
          action: "역사의 서막이 열리다",
          result: "시작",
          summary: (parsedResult.narrative || "").slice(0, 100).replace(/\n/g, ' ')
        };
        parsedResult.chronicle = [initialChronicle];
        setGameState(parsedResult);
        const t = parseTurnNumber(parsedResult.dateLocation) ?? 1;
        setTurn(t);
        const parsedDate = parseDateLocation(parsedResult.dateLocation);
        setGameDate(parsedDate.date);
        setConstructionQueue([]);
        setConstructionNotice('');
        setIsPaused(false); // 시작 시 실시간 진행 활성화
      } else {
        alert("시작 설정 구성에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("게임 시작 중 오류가 발생했습니다.");
    }
    setStreamPreview("");
    setLoading(false);
  };

  useEffect(() => {
    // Vercel 로컬 스토리지 기존 세이브 자동 복구 (장원 올리브 압착장 Lv.2 복구 및 중복 제거)
    autoMigrateAndSanitizeStorage();

    const configStr = localStorage.getItem("ck_startup_config");
    if (configStr) {
      localStorage.removeItem("ck_startup_config"); // 일회성 사용 후 삭제
      const config = JSON.parse(configStr);
      handleInitialStart(config);
    } else if (localStorage.getItem("ck_auto_save")) {
      setHasAutoSave(true);
    }
    setCanUndo(hasUndoState());
    setUxSettings(loadUXSettings());
  }, []);

  // Auto Save
  useEffect(() => {
    if (gameState && !loading) {
      localStorage.setItem("ck_auto_save", JSON.stringify({ ...gameState, _constructionQueue: constructionQueue, _turn: turn }));
    }
  }, [gameState, loading, constructionQueue, turn]);

  // 저장 데이터 복원 (건설 큐/턴 포함, 구버전 {building, turnsLeft} 호환)
  const restoreSave = (loaded: any) => {
    const sanitized: any = normalizeParsedState(sanitizeEstateState(loaded));
    const { _constructionQueue, _turn, ...rest } = sanitized;
    const t = parseTurnNumber(rest.dateLocation) ?? (typeof _turn === 'number' ? _turn : 0);
    const parsedDate = parseDateLocation(rest.dateLocation);
    setGameState(rest);
    setTurn(t);
    setGameDate(parsedDate.date);
    setConstructionQueue(normalizeQueue(_constructionQueue, t));
    setConstructionNotice('');
    setCanUndo(hasUndoState());
    setIsPaused(true); // 불러온 후 안전하게 일시정지 상태 유지
  };

  const handleAutoLoad = () => {
    const saveStr = localStorage.getItem("ck_auto_save");
    if (saveStr) {
      try {
        const loaded = JSON.parse(saveStr);
        restoreSave(loaded);
      } catch (err) {
        alert("자동 저장 데이터를 불러오지 못했습니다.");
      }
    }
  };

  const handleUndoTurn = () => {
    const prev = popUndoState();
    if (prev) {
      restoreSave(prev.gameState);
      setCanUndo(hasUndoState());
      showQuickNotice(`↩️ 턴 ${prev.turn} 직전 상태로 게임을 되돌렸습니다.`);
    } else {
      alert("되돌릴 이전 턴 기록이 없습니다.");
    }
  };

  const handleQuickSave = () => {
    if (!gameState) return;
    const ok = quickSave(gameState, turn, constructionQueue);
    if (ok) {
      showQuickNotice("⚡ 퀵 세이브가 완료되었습니다! (Quick Save)");
    } else {
      alert("퀵 세이브에 실패했습니다.");
    }
  };

  const handleQuickLoad = () => {
    const loaded = quickLoad();
    if (loaded) {
      restoreSave(loaded.gameState);
      showQuickNotice(`⚡ 퀵로드 완료 (${loaded.characterName}, 턴 ${loaded.turn})`);
    } else {
      alert("저장된 퀵 세이브 데이터가 없습니다.");
    }
  };

  // 모달 오픈 시 자동 일시정지 및 닫힐 때 복원
  useEffect(() => {
    const isModalOpen = activeModal !== null || activeEvent !== null;
    if (isModalOpen) {
      if (prevModalRef.current === null) {
        wasPausedBeforeModalRef.current = isPaused;
        setIsPaused(true);
      }
      prevModalRef.current = activeModal;
    } else {
      if (prevModalRef.current !== null) {
        if (!wasPausedBeforeModalRef.current) {
          setIsPaused(false);
        }
        prevModalRef.current = null;
      }
    }
  }, [activeModal, activeEvent, isPaused]);

  // 실시간 게임 루프: 1분 = 1달, 2초 = 1일 (배속 스케일링)
  useEffect(() => {
    lastTickTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaMs = now - lastTickTimeRef.current;
      lastTickTimeRef.current = now;
      const deltaSec = deltaMs / 1000;

      // 일시정지 중이거나 로딩, 모달, 게임 오버 시 틱 스킵
      if (isPaused || loading || !gameState || activeModal !== null || activeEvent !== null || gameState.ending) {
        return;
      }

      // 1. 시간 전진
      const timeResult = advanceGameTime(gameDate, deltaSec, gameSpeed, accumulatedSecRef.current);
      accumulatedSecRef.current = timeResult.leftoverSeconds;
      setMonthProgressPercent(timeResult.monthProgressPercent);

      // 2. 실시간 건설 틱
      const effectiveSec = deltaSec * gameSpeed;
      if (constructionQueue.length > 0) {
        const { updatedQueue, completedItems } = tickConstructionQueue(constructionQueue, effectiveSec);
        setConstructionQueue(updatedQueue);

        // 완공된 시설 처리
        if (completedItems.length > 0) {
          completedItems.forEach(item => {
            showQuickNotice(`🎉 [${item.building}] 공사가 완공되었습니다!`);
            setGameState(prev => {
              if (!prev) return prev;
              const nextEstate = applyCompletedBuildingToEstate(prev.estate, item);
              const loc = parseDateLocation(prev.dateLocation).location;
              const chronicleEntry: ChronicleItem = {
                turn,
                dateLocation: formatDateLocation(timeResult.newDate, loc),
                action: `시설 완공: ${item.building}`,
                result: '대성공',
                summary: `${item.building} 건물이 성공적으로 완공되어 영지 인프라로 확충되었습니다.`
              };
              return {
                ...prev,
                estate: nextEstate,
                chronicle: [...(prev.chronicle || []), chronicleEntry]
              };
            });
          });
        }
      }

      // 2.5. 실시간 대전략 군사 & 전쟁 시뮬레이션 틱
      setArmies(prevArmies => {
        if (prevArmies.length === 0) return prevArmies;
        setProvinces(prevProvinces => {
          const militaryRes = updateMilitaryTick(prevArmies, prevProvinces, effectiveSec);

          if (militaryRes.siegesCompleted.length > 0) {
            militaryRes.siegesCompleted.forEach(s => {
              const fallenProv = prevProvinces.find(p => p.id === s.provinceId);
              const provName = fallenProv?.name || '성채';
              showQuickNotice(`🏰 [${provName}] 성채가 함락되어 ${s.conquerorRealm}의 통제하에 들어갔습니다!`);
              setWarScore(w => Math.min(100, w + 35));
              setDispatchLogs(logs => [
                {
                  id: `siege_${Date.now()}_${Math.random()}`,
                  time: formatCleanDate(timeResult.newDate),
                  text: `[영지 점령] ${s.conquerorRealm}의 군대가 ${provName} 성채를 함락시키고 영지를 장악하였습니다. (승점 +35%)`,
                  type: 'battle'
                },
                ...logs.slice(0, 40)
              ]);
            });
          }

          if (militaryRes.battleResults.length > 0) {
            militaryRes.battleResults.forEach(async b => {
              const isPlayerWinner = (b.winner === 'attacker' && b.attackerArmy.isPlayer) || (b.winner === 'defender' && b.defenderArmy.isPlayer);
              setWarScore(w => isPlayerWinner ? Math.min(100, w + 20) : Math.max(-100, w - 20));
              showQuickNotice(`⚔️ [${b.provinceName}] 대규모 회전 발생! (${b.victoryType})`);
              try {
                const report = await requestBattleDispatch(b.dispatchContext, apiKey);
                setDispatchLogs(logs => [
                  {
                    id: `battle_${Date.now()}_${Math.random()}`,
                    time: formatCleanDate(timeResult.newDate),
                    text: `${report}\n(전쟁 승점 변동: ${isPlayerWinner ? '+20%' : '-20%'})`,
                    type: 'battle'
                  },
                  ...logs.slice(0, 40)
                ]);
              } catch (err) {
                console.error(err);
              }
            });
          }

          return militaryRes.updatedProvinces;
        });

        const res2 = updateMilitaryTick(prevArmies, provinces, effectiveSec);
        return res2.updatedArmies;
      });

      // 3. 일자 변경 시 gameDate 갱신
      if (timeResult.daysAdvanced > 0) {
        setGameDate(timeResult.newDate);
      }

      // 4. 월간 틱 (Monthly Tick: 60초 주기)
      if (timeResult.monthTicked) {
        const nextTurn = turn + 1;
        setTurn(nextTurn);

        // 월간 자원 자동 축적 및 세입/세출 정산
        setGameState(prev => {
          if (!prev) return prev;
          const updated = applyTurnResourceAccumulation(prev, prev);
          const loc = parseDateLocation(prev.dateLocation).location;
          return {
            ...updated,
            dateLocation: formatDateLocation(timeResult.newDate, loc, nextTurn)
          };
        });

        // 월간 이벤트 롤링 (역사적 대사건 우선)
        const rolled = rollMonthlyEvent(gameState, nextTurn, seenEventIds);
        if (rolled) {
          setIsPaused(true); // 이벤트 발생 시 자동 일시정지 (Auto-Pause)
          setSeenEventIds(prev => new Set([...prev, rolled.id]));
          showQuickNotice(`📜 역사적 국면: [${rolled.title}] (시간 일시정지됨)`);

          const speaker = rolled.dialogueSpeaker || '집사 아르노';
          const speech = rolled.dialogueText || '"각하, 다음 조치를 결정해 주십시오."';
          const fullNarrative = `${rolled.narrativeTemplate}\n\n${speaker}가 다가와 고했습니다.\n${speech}`;

          setGameState(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              historicalTag: rolled.historicalTag || prev.historicalTag,
              narrative: fullNarrative,
              choices: rolled.choices.map((c, idx) => ({
                id: c.id,
                type: `${idx + 1}번`,
                text: c.text,
                probability: c.probability,
                groupType: c.groupType
              }))
            };
          });
        }
      }

      // 5. 연간 틱 (Yearly Tick: 12달 = 12분 주기)
      if (timeResult.yearTicked) {
        showQuickNotice(`🎂 서기 ${timeResult.newDate.year}년 새해가 밝았습니다! (나이 +1세)`);
        setGameState(prev => {
          if (!prev) return prev;
          const curAge = parseInt(prev.personalInfo?.['나이'] || '25', 10);
          return {
            ...prev,
            personalInfo: {
              ...(prev.personalInfo || {}),
              '나이': `${curAge + timeResult.yearsAdvanced}`
            }
          };
        });
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isPaused, loading, gameState, activeModal, activeEvent, gameSpeed, gameDate, constructionQueue, turn, seenEventIds, apiKey, provinces]);

  // ⚔️ 징집병 소집 핸들러
  const handleRaiseLevies = (prov: Province) => {
    const army = raiseLevies(prov, gameState?.personalInfo?.['이름'] || '영주', true);
    if (!army) {
      showQuickNotice('현재 소집 가능한 징집병이 없습니다.');
      return;
    }
    setArmies(prev => [...prev, army]);
    setProvinces(prev => prev.map(p => p.id === prov.id ? { ...p, currentLevies: 0 } : p));
    showQuickNotice(`⚔️ [${prov.name}]에서 ${army.troops}명의 징집병이 군단으로 소집되었습니다!`);
    setSelectedArmyId(army.id);
  };

  // 🚩 군대 이동 명령 핸들러
  const handleOrderArmyMove = (armyId: string, targetProvinceId: string) => {
    const targetProv = provinces.find(p => p.id === targetProvinceId);
    if (!targetProv) return;

    setArmies(prev => prev.map(army => {
      if (army.id !== armyId) return army;
      const curProv = provinces.find(p => p.id === army.locationProvinceId);
      if (!curProv) return army;
      const updated = orderArmyMove(army, targetProv, curProv);
      showQuickNotice(`🚩 [${army.name}] 부대가 [${targetProv.name}] 영지로 행군을 개시했습니다.`);
      return updated;
    }));
  };

  // 📜 선전포고 및 적 방어군 스폰
  const handleDeclareWar = (targetProvince: Province, letterText: string) => {
    setIsAtWar(true);
    setWarScore(0);
    showQuickNotice(`⚔️ [${targetProvince.name}] 영주에게 공식 선전포고가 전달되었습니다! (전쟁 발발)`);
    setDispatchLogs(prev => [
      {
        id: `war_${Date.now()}`,
        time: formatCleanDate(gameDate),
        text: `[선전포고] ${targetProvince.rulerName} 귀하에게 전쟁 서신이 발송되었습니다:\n${letterText.slice(0, 150)}...`,
        type: 'diplomacy'
      },
      ...prev
    ]);

    // 적국 방어군 스폰 (타국 영지에 수비군이 없을 경우 생성)
    const existingEnemy = armies.find(a => a.locationProvinceId === targetProvince.id && !a.isPlayer);
    if (!existingEnemy && targetProvince.maxLevies > 0) {
      const enemyArmy = raiseLevies(targetProvince, targetProvince.rulerName, false);
      if (enemyArmy) {
        setArmies(prev => [...prev, enemyArmy]);
      }
    }
  };

  // 📜 자문회 직무 파견 핸들러
  const handleAssignCouncilTask = (provinceId: string, task: CouncilTask) => {
    setProvinces(prev => prev.map(p => p.id === provinceId ? { ...p, assignedTask: task } : p));
    showQuickNotice(`📜 [${task.title}] 직무를 위해 자문위원을 파견했습니다.`);
    setDispatchLogs(logs => [
      {
        id: `council_${Date.now()}`,
        time: formatCleanDate(gameDate),
        text: `[궁정 직무] 영지에 [${task.title}] 수행 명령이 하달되었습니다.`,
        type: 'diplomacy'
      },
      ...logs
    ]);
  };

  // 🕊️ 평화 조약 체결 핸들러
  const handleSignPeaceTreaty = (targetProvince: Province, terms: 'conquest' | 'reparations' | 'white_peace' | 'surrender') => {
    if (terms === 'conquest') {
      setProvinces(prev => prev.map(p => p.id === targetProvince.id ? { 
        ...p, 
        isPlayerControlled: true,
        realmName: gameState?.factionState?.name || '왕국 직할령',
        color: 'rgba(59, 130, 246, 0.45)',
        borderColor: '#60a5fa'
      } : p));
      showQuickNotice(`👑 [승전] ${targetProvince.name} 영지가 우리 가문의 직할령으로 영구 귀속되었습니다!`);
    } else if (terms === 'reparations') {
      setGameState(prev => {
        if (!prev) return prev;
        const updatedStatus = (prev.playerStatus || []).map(s => {
          if (s.name.includes('금화') || s.name.includes('재물')) {
            const curVal = parseInt(s.value.replace(/[^0-9]/g, '') || '100', 10);
            return { ...s, value: `${curVal + 100} 금화` };
          }
          return s;
        });
        return {
          ...prev,
          playerStatus: updatedStatus
        };
      });
      showQuickNotice(`🪙 [승전] 적국으로부터 100 금화의 전쟁 배상금을 몰수하였습니다!`);
    } else if (terms === 'white_peace') {
      showQuickNotice(`🤝 [휴전] 상호 현상을 유지하며 백지 화친을 맺었습니다.`);
    } else {
      showQuickNotice(`🏳️ [항복] 전쟁이 종결되었습니다.`);
    }

    setIsAtWar(false);
    setWarScore(0);
    setDispatchLogs(logs => [
      {
        id: `peace_${Date.now()}`,
        time: formatCleanDate(gameDate),
        text: `[평화 조약] ${targetProvince.realmName}과의 전쟁이 공식 종결되었습니다. (조약 조건: ${terms === 'conquest' ? '영토 양도' : terms === 'reparations' ? '전쟁 배상금' : '백지 화친'})`,
        type: 'diplomacy'
      },
      ...logs
    ]);
  };

  // Keyboard Shortcuts (Space 일시정지, [/] 속도조절, 1~4 선택지, Q 퀵세이브, Z 되돌리기, Esc 모달닫기)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!uxSettings.shortcutsEnabled) return;

      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Space: 실시간 시간 일시정지 / 재생 토글
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        setIsPaused(prev => {
          const next = !prev;
          showQuickNotice(next ? "⏸️ 시간 일시정지됨 (Space)" : "▶️ 시간 진행 중 (Space)");
          return next;
        });
        return;
      }

      // [ / ]: 속도 조절
      if (e.key === '[') {
        e.preventDefault();
        setGameSpeed(prev => (prev === 4 ? 2 : prev === 2 ? 1 : 1));
        return;
      }
      if (e.key === ']') {
        e.preventDefault();
        setGameSpeed(prev => (prev === 1 ? 2 : prev === 2 ? 4 : 4));
        return;
      }

      if (e.key === 'Escape') {
        if (activeModal) {
          setActiveModal(null);
        }
        return;
      }

      if ((e.key === 'q' || e.key === 'Q') && !e.ctrlKey && !e.metaKey) {
        if (gameState && !loading) {
          e.preventDefault();
          handleQuickSave();
        }
        return;
      }

      if ((e.key === 'z' || e.key === 'Z') && !e.ctrlKey && !e.metaKey) {
        if (canUndo && !loading) {
          e.preventDefault();
          if (confirm('직전 턴 상태로 되돌리시겠습니까?')) {
            handleUndoTurn();
          }
        }
        return;
      }

      if (e.key >= '1' && e.key <= '4' && gameState?.choices && !loading) {
        const idx = parseInt(e.key, 10) - 1;
        if (gameState.choices[idx]) {
          e.preventDefault();
          handleAction(gameState.choices[idx].text);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [uxSettings.shortcutsEnabled, activeModal, gameState, loading, canUndo, turn, constructionQueue, isPaused]);

  const handleAction = async (actionText: string) => {
    // 턴 진행 직전 스냅샷을 Undo 스택에 저장
    if (gameState) {
      pushUndoState(gameState, turn, constructionQueue);
      setCanUndo(true);
    }

    // 투트랙 건설: 착수/완공 시스템 명령을 플레이어 행동 뒤에 덧붙입니다.
    const sys = buildSystemCommands(constructionQueue, turn);
    const finalAction = sys.text ? `${actionText}\n\n${sys.text}` : actionText;
    setLoading(true);
    setStreamPreview("");
    try {
      const apiKey = localStorage.getItem('ck_api_key') || '';
      const useGemini = uxSettings.simulationMode === 'gemini' && apiKey;

      let data: any = null;

      if (!useGemini) {
        // ⚡ 로컬 결정론적 룰 기반 엔진으로 0.01초 즉시 턴 연산 (비용 0원, 환각 0%)
        if (gameState) {
          data = processTurn(gameState, finalAction, turn, constructionQueue);
        }
      } else {
        const response = await fetch('/api/game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: finalAction, 
            currentState: { ...gameState, constructionQueue: summarizeQueue(constructionQueue, turn) }, // JSON Save System
            apiKey,
            stream: true
          })
        });
        data = await readGameStream(response, (raw) => {
          setStreamPreview(extractLivePreview(raw));
        });
      }
      if (data?.parsed) {
        setGameState(prevState => {
          if (!prevState) return data.parsed;
          
            // 스마트 병합 함수 정의 (배열 누락 방지 및 AI 명칭 변경 대응 퍼지 병합)
            const mergeArrayByKey = <T,>(prevArr: T[] = [], newArr: T[] = [], extractKey: (item: T) => string): T[] => {
               const getCoreName = (s: string) => {
                   let c = s.replace(/\[|\]|\(|\)/g, '');
                   c = c.replace(/\s+(전\s)?(여)?(남작|자작|백작|후작|공작|대공|영주|국왕|황제|교황|추기경|대주교|주교|사제|신부|수녀|촌장|기사|용병대장)/g, '');
                   c = c.replace(/\s+(왕국|제국|백국|공국|후국|왕조|공화국)/g, '');
                   c = c.replace(/\s+및\s+.*?(\s|$)/g, ' ');
                   return c.trim();
               };

               const allItems = [...prevArr, ...newArr];
               const uniqueItems: T[] = [];
               
               allItems.forEach(item => {
                  const key = extractKey(item);
                  const cKey = getCoreName(key);
                  
                  const matchIndex = uniqueItems.findIndex(existingItem => {
                      const cExisting = getCoreName(extractKey(existingItem));
                      return cKey === cExisting || (cKey.length > 2 && cExisting.startsWith(cKey)) || (cExisting.length > 2 && cKey.startsWith(cExisting));
                  });
                  
                  if (matchIndex !== -1) {
                      uniqueItems[matchIndex] = item;
                  } else {
                      uniqueItems.push(item);
                  }
               });
               
               return uniqueItems.filter(item => {
                   const desc = String(item);
                   return !desc.includes('(사망)') && !desc.includes('(멸망)') && !desc.includes('사망함') && !desc.includes('멸망함') && !desc.includes('단절됨');
               });
            };

            const prevTraits = prevState.traits || [];
            const newParsedTraits = data.parsed.traits || [];
            const prevTraitMap = new Map(prevTraits.map(t => [t.name, t]));
            const newlyAcquiredTraits: string[] = [];
            const upgradedTraits: string[] = [];

            const processedNewTraits = newParsedTraits.map((newT: any) => {
              const prevT = prevTraitMap.get(newT.name);
              if (!prevT) {
                newlyAcquiredTraits.push(newT.name);
                return { ...newT, isNew: true };
              } else if (newT.tier && prevT.tier && newT.tier !== prevT.tier) {
                upgradedTraits.push(`${newT.name} (${newT.tier})`);
                return { ...newT, isUpgraded: true };
              }
              return newT;
            });

            const mergedTraits = mergeArrayByKey(
               prevTraits, 
               processedNewTraits, 
               (t: any) => t.name
            );

            // 스탯(선천/후천) 성장 및 보너스 감지 (+1, +2 등)
            const statIncreases: string[] = [];
            const checkStatGrowth = (cat: 'innate' | 'acquired') => {
              const oldCat = prevState.stats?.[cat] || {};
              const newCat = data.parsed.stats?.[cat] || {};
              for (const [sKey, sVal] of Object.entries(newCat)) {
                const sValStr = String(sVal);
                const bonusMatch = sValStr.match(/([+-]?\d+)\s*\(([+-]?\d+)\)/);
                if (bonusMatch) {
                  const bonus = parseInt(bonusMatch[2], 10);
                  if (bonus > 0) {
                    statIncreases.push(`${sKey} +${bonus}`);
                  }
                } else {
                  const oldNum = parseInt(String(oldCat[sKey] || '0').match(/\d+/)?.[0] || '0', 10);
                  const newNum = parseInt(sValStr.match(/\d+/)?.[0] || '0', 10);
                  if (oldNum > 0 && newNum > oldNum) {
                    statIncreases.push(`${sKey} +${newNum - oldNum}`);
                  }
                }
              }
            };
            checkStatGrowth('innate');
            checkStatGrowth('acquired');

            if (newlyAcquiredTraits.length > 0) {
              showQuickNotice(`✨ 새로운 특성 획득: [${newlyAcquiredTraits.join(', ')}]`);
            } else if (upgradedTraits.length > 0) {
              showQuickNotice(`🌟 특성 성장: [${upgradedTraits.join(', ')}]`);
            } else if (statIncreases.length > 0) {
              showQuickNotice(`💪 능력치 성장: [${statIncreases.join(', ')}]`);
            }

            const mergedPersonalRels = mergeArrayByKey(
               prevState.relationships?.personal || [],
               data.parsed.relationships?.personal || [],
               (r: string) => sanitizeNameAndRole(r.split('|')[0] || '').name
            );

            const mergedFactionRels = mergeFactionLists(
               prevState.relationships?.faction || [],
               data.parsed.relationships?.faction || []
            );

            const mergedRelationships = {
               personal: mergedPersonalRels,
               faction: mergedFactionRels
            };

            const currentTurnNumber = parseTurnNumber(data.parsed.dateLocation) ?? turn + 1;
            const newHistoryItem: ChronicleItem = {
              turn: currentTurnNumber,
              dateLocation: data.parsed.dateLocation || prevState.dateLocation,
              action: actionText,
              result: data.parsed.judgment?.result || "성공",
              summary: (data.parsed.narrative || "").slice(0, 100).replace(/\n/g, ' ')
            };
            const updatedChronicle = [...(prevState.chronicle || []), newHistoryItem].slice(-25);
            
            // 거점 건물 안전 병합:
            // 1) 이전 턴(prevState)에 이미 달성된 건물 레벨은 AI가 이번 턴에 Lv 표기를 누락했더라도 절대 다운그레이드(1로 초기화)되지 않도록 보존
            // 2) 이번 턴에 완공된 건설/업그레이드 큐 항목의 targetLevel 승격을 확정 반영
            const completedQueueItems = constructionQueue.filter(q => sys.completedIds.includes(q.id));
            const prevEstateBuildings = prevState.estate?.buildings || [];
            const newEstateBuildings = data.parsed.estate?.buildings || [];
            const mergedEstateBuildings = mergeEstateBuildings(prevEstateBuildings, newEstateBuildings, completedQueueItems);

            const mergedEstate = (data.parsed.estate || prevState.estate)
              ? {
                  type: data.parsed.estate?.type || prevState.estate?.type || '거점 없음',
                  level: data.parsed.estate?.level || prevState.estate?.level || '',
                  buildings: mergedEstateBuildings
                }
              : undefined;

            const nextCandidateState = {
              ...prevState,
              ...data.parsed,
              objective: data.parsed.objective || prevState.objective,
              longTermPlan: data.parsed.longTermPlan !== undefined ? data.parsed.longTermPlan : prevState.longTermPlan,
              inventory: data.parsed.inventory || prevState.inventory,
              estate: mergedEstate,
              buildOptions: data.parsed.buildOptions ?? prevState.buildOptions,
              constructionRejected: undefined,
              traits: mergedTraits,
              stats: {
                innate: mergeObject(prevState.stats?.innate, data.parsed.stats?.innate),
                acquired: mergeObject(prevState.stats?.acquired, data.parsed.stats?.acquired)
              },
              personalInfo: mergeObject(prevState.personalInfo, data.parsed.personalInfo),
              factionState: data.parsed.factionState?.none ? { none: "true" } : mergeObject(prevState.factionState, data.parsed.factionState),
              previousPopulation: (() => {
                const prev = parsePopulationCount(prevState.factionState?.['인구']);
                return prev > 0 ? prev : prevState.previousPopulation;
              })(),
              relationships: mergedRelationships,

              playerStatus: data.parsed.playerStatus || prevState.playerStatus,
              familyState: data.parsed.familyState || prevState.familyState,
              chronicle: updatedChronicle
            };

            // 턴 경과에 따른 경제(세력 재정/골드), 명망(위신), 영성(신앙) 자동 축적 엔진 적용
            return applyTurnResourceAccumulation(nextCandidateState, prevState);
          });
        // 투트랙 건설: 턴 갱신 및 큐 정리 (완공/거부 항목 제거, 착수 명령 전송 표시)
        const newTurn = parseTurnNumber(data.parsed.dateLocation) ?? turn + 1;
        const rejected: string[] = data.parsed.constructionRejected || [];
        setTurn(newTurn);
        if (data.parsed.dateLocation) {
          setGameDate(parseDateLocation(data.parsed.dateLocation).date);
        }
        setConstructionQueue(prev => applyTurnResult(prev, sys, rejected));
        setConstructionNotice(
          rejected.length > 0
            ? `건설 거부: ${rejected.join(', ')} (비용은 차감되지 않았습니다)`
            : sys.completedIds.length > 0
              ? '시설이 완공되었습니다. 거점/영지 탭에서 확인하세요.'
              : ''
        );
      } else if (data?.error) {
        alert("API 에러: " + data.error);
        if (data.error.includes("키가 제공되지 않았습니다")) window.location.href = '/startup';
      } else {
        alert("파싱에 실패했습니다. AI가 포맷을 어겼을 수 있습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("서버 통신 오류가 발생했습니다.");
    }
    setStreamPreview("");
    setLoading(false);
  };

  const handleSave = () => {
    if (!gameState) return;
    const jsonStr = JSON.stringify({ ...gameState, _constructionQueue: constructionQueue, _turn: turn }, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ck_save_${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSuccession = () => {
    if (!gameState) return;
    const inheritanceData = {
      inventory: gameState.inventory,
      factionState: gameState.factionState,
      familyState: gameState.familyState,
      heir: gameState.familyState?.heir,
      previousState: gameState // 시대적 배경 및 서사 유지를 위해 전체 상태 전달
    };
    localStorage.setItem("ck_inheritance", JSON.stringify(inheritanceData));
    localStorage.removeItem("ck_auto_save");
    window.location.href = "/startup";
  };

  const handleReturnToTitle = () => {
    if (gameState && !loading) {
      localStorage.setItem("ck_auto_save", JSON.stringify({ ...gameState, _constructionQueue: constructionQueue, _turn: turn }));
    }
    setGameState(null);
  };

  const handleLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const loadedState = JSON.parse(event.target?.result as string);
        restoreSave(loadedState);
        alert("성공적으로 세이브를 불러왔습니다!");
      } catch (err) {
        alert("올바르지 않은 세이브 파일입니다.");
      }
    };
    reader.readAsText(file);
  };

  // 투트랙 건설: 슬롯 한도 및 건설 지시 (관리력 시너지 및 가신 연동)
  const ckAttr = calculateCKAttributes(gameState || {});
  const domainLimit = ckAttr.synergies.domainLimit;
  const maxSlots = getMaxSlots(gameState?.estate, ckAttr.synergies.constructionSlotsBonus);

  const playerArchetype = gameState ? detectPlayerArchetype(gameState) : 'noble';
  const stewScore = ckAttr.stewardship.value;

  // 거점 상주 자문관 및 가신 추출 (SSOT getCouncilVassals 적용)
  const councilVassals = getCouncilVassals(gameState?.relationships?.personal, playerArchetype);

  let promotionOption: any = null;
  let derivedUpgradeOptions: any[] = [];

  if (gameState?.estate && gameState.estate.level !== undefined && gameState.estate.level !== null) {
    const estateLevel = typeof gameState.estate.level === 'number'
      ? gameState.estate.level
      : (parseInt(String(gameState.estate.level).match(/(?:Lv\.?|레벨)?\s*(\d+)/i)?.[1] || '1', 10));

    const isFactionActive = !!(gameState.factionState && !gameState.factionState.none);
    const promoCheck = checkPromotion(estateLevel, gameState.estate.buildings || [], gameState.factionState, isFactionActive);
    if (promoCheck.canPromote) {
      const promoEst = calculateEstatePromotionCost(estateLevel, playerArchetype, stewScore);
      promotionOption = {
        name: promoEst.name,
        cost: promoEst.formattedCost,
        costAmount: promoEst.amount,
        currency: promoEst.currency,
        turns: promoEst.turns,
        desc: promoEst.discountPercent > 0
          ? `거점의 규모를 다음 단계로 승격시킵니다. 건설 슬롯과 건물 레벨 상한이 늘어납니다. (관리력 ${promoEst.discountPercent}% 할인)`
          : '거점의 규모를 다음 단계로 승격시킵니다. 건설 슬롯과 건물 레벨 상한이 늘어납니다.',
        kind: 'promote',
        targetLevel: estateLevel + 1
      };
    }

    const upgradeCandidates = getUpgradeCandidates(estateLevel, gameState.estate.buildings, playerArchetype, stewScore);
    derivedUpgradeOptions = upgradeCandidates.map(c => ({
      name: `${c.buildingName} 업그레이드 (Lv.${c.currentLevel}→${c.targetLevel})`,
      cost: c.formattedCost,
      costAmount: c.cost,
      currency: c.currency,
      turns: c.turns,
      desc: c.discountPercent > 0
        ? `해당 건물의 기능을 강화합니다. (관리력 ${c.discountPercent}% 할인 적용)`
        : '해당 건물의 기능을 강화합니다.',
      kind: 'upgrade',
      targetLevel: c.targetLevel
    }));
  }
  const handleOrderBuild = (opt: BuildOption) => {
    if (loading) return;
    if (constructionQueue.length >= maxSlots) return;
    if (constructionQueue.some(q => sameBuildingName(q.building, opt.name))) return;
    setConstructionQueue(prev => [...prev, createQueueItem(opt, turn)]);
    setConstructionNotice('');
  };

  // 아직 AI에 착수 명령(비용 차감)을 보내지 않은 항목만 취소할 수 있습니다.
  const handleCancelBuild = (id: string) => {
    setConstructionQueue(prev => prev.filter(q => q.id !== id || q.commandSent));
  };

  // 게임 시작 전 화면
  if (!gameState) {
    return (
      <main className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
         <div className="glass-panel" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
            gap: '20px', padding: '60px', width: '600px', maxWidth: '90%', textAlign: 'center'
         }}>
            <img src="/logo.jpg" alt="CHRONICLES: TEXT SIMULATOR" style={{ width: '100%', maxWidth: '400px', marginBottom: '20px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} />
            {loading ? (
              <p style={{color: 'var(--gold-accent)', fontSize: '1.2rem'}}>세계를 창조하는 중입니다... (10~20초 소요)</p>
            ) : (
              <>
                <button className={styles.actionBtn} style={{width: '100%', padding: '20px', fontSize: '1.3rem'}} onClick={() => window.location.href = '/startup'}>
                  새 게임 시작하기
                </button>
                {hasAutoSave && (
                  <button className={styles.actionBtn} style={{width: '100%', padding: '15px', fontSize: '1.2rem', marginTop: '10px', background: 'var(--panel-bg)'}} onClick={handleAutoLoad}>
                    마지막 저장 지점에서 이어하기
                  </button>
                )}
              </>
            )}
            <div style={{width: '100%', borderTop: '1px solid var(--panel-border)', paddingTop: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
              <p style={{color: 'var(--text-muted)', marginBottom: '5px'}}>진행 중이던 세계가 있다면</p>
              
              <button
                className={styles.actionBtn}
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '1.15rem',
                  cursor: 'pointer',
                  background: 'linear-gradient(45deg, rgba(212, 175, 55, 0.2), rgba(15, 23, 42, 0.8))',
                  border: '1px solid var(--gold-accent)',
                  color: 'var(--gold-hover)',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onClick={() => setActiveModal('save')}
              >
                💾 다중 슬롯 세이브 매니저 열기 (Save / Load)
              </button>

              <label className={styles.actionBtn} style={{display: 'block', width: '100%', padding: '14px', fontSize: '1.05rem', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)'}}>
                JSON 세이브 파일 불러오기 (.json)
                <input type="file" accept=".json" onChange={handleLoad} style={{display: 'none'}} />
              </label>
            </div>
            
            <div style={{width: '100%', marginTop: '10px'}}>
              <button 
                style={{ width: '100%', padding: '10px', fontSize: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => {
                  if (confirm("기기에 저장된 모든 세이브와 설정 데이터가 영구적으로 삭제됩니다.\n정말 초기화하시겠습니까?")) {
                    localStorage.removeItem("ck_auto_save");
                    localStorage.removeItem("ck_startup_config");
                    localStorage.removeItem("ck_inheritance");
                    alert("모든 로컬 데이터가 초기화되었습니다.");
                    window.location.reload();
                  }
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.borderColor = '#ef4444'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; }}
              >
                ⚠️ 로컬 데이터 전체 초기화 (Hard Reset)
              </button>
            </div>
         </div>

         {/* Title screen Save modal */}
         {activeModal === 'save' && (
           <CKSaveModal
             isOpen={true}
             onClose={() => setActiveModal(null)}
             gameState={gameState}
             turn={turn}
             constructionQueue={constructionQueue}
             onLoadSuccess={(loadedData) => {
               restoreSave(loadedData.gameState);
               setActiveModal(null);
               showQuickNotice(`💾 [${loadedData.title}] 세이브 데이터를 불러왔습니다.`);
             }}
           />
         )}
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <CKTopHud
        gameState={gameState}
        turn={turn}
        gameSpeed={gameSpeed}
        isPaused={isPaused}
        onTogglePause={() => {
          setIsPaused(prev => {
            const next = !prev;
            showQuickNotice(next ? "⏸️ 시간 일시정지됨 (Space)" : "▶️ 시간 진행 중 (Space)");
            return next;
          });
        }}
        onChangeSpeed={(spd) => {
          setGameSpeed(spd);
          if (isPaused) setIsPaused(false);
          showQuickNotice(`⏩ 속도 변경: ${spd}x (${spd === 1 ? '1분=1달' : spd === 2 ? '30초=1달' : '15초=1달'})`);
        }}
        monthProgressPercent={monthProgressPercent}
        realtimeDateStr={formatCleanDate(gameDate)}
        onOpenFamilyTree={() => setActiveModal('familyTree')}
        onOpenRealm={() => { setRealmInitialTab('realm'); setActiveModal('realm'); }}
        onOpenCharacter={() => setActiveModal('character')}
        onOpenRelations={() => setActiveModal('relations')}
        onOpenEstate={() => { setRealmInitialTab('estate'); setActiveModal('realm'); }}
        onOpenChronicle={() => setActiveModal('chronicle')}
        onOpenSave={() => setActiveModal('save')}
        onOpenSettings={() => setActiveModal('settings')}
        onQuickSave={handleQuickSave}
        onUndoTurn={handleUndoTurn}
        canUndo={canUndo}
        onReturnTitle={handleReturnToTitle}
        onOpenApiKey={() => setIsApiKeyModalOpen(true)}
      />

      {/* Center Grand Strategy Panel */}
      <section className={`glass-panel ${styles.centerPanel}`} style={{ display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px' }}>

        {gameState.ending ? (
          <div className={styles.narrativeArea} style={{textAlign: 'center', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
             <h1 style={{color: 'var(--danger)', fontSize: '4rem', marginBottom: '30px', textShadow: '0 0 15px rgba(239,68,68,0.5)', letterSpacing: '5px'}}>GAME OVER</h1>
             <p className={styles.narrativeText} style={{fontSize: '1.2rem', lineHeight: '2', color: 'var(--text-main)', maxWidth: '80%'}}>
                <TypewriterText text={gameState.ending} delay={30} />
             </p>
             <button className={styles.actionBtn} style={{marginTop: '50px', padding: '15px 40px', fontSize: '1.2rem'}} onClick={() => { localStorage.removeItem("ck_auto_save"); window.location.href = '/'; }}>
               새로운 역사 시작하기
             </button>
          </div>
        ) : (
          <>
            {/* 1. 상단: 인터랙티브 중세 영지 지도 & 우측 프로빈스 인스펙터 */}
            <div style={{
              display: 'flex',
              gap: '14px',
              height: 'calc(100vh - 350px)',
              minHeight: '440px',
              position: 'relative'
            }}>
              {/* 중세 영지 벡터 지도 */}
              <div style={{
                flex: 1,
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid rgba(200, 159, 60, 0.35)',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
                position: 'relative'
              }}>
                <CKMapView
                  provinces={provinces}
                  armies={armies}
                  selectedProvinceId={selectedProvinceId}
                  onSelectProvince={(prov) => setSelectedProvinceId(prov.id)}
                  selectedArmyId={selectedArmyId}
                  onSelectArmy={(army) => setSelectedArmyId(army ? army.id : null)}
                  onOrderArmyMove={handleOrderArmyMove}
                  currentMapMode={mapMode}
                  onChangeMapMode={setMapMode}
                />
              </div>

              {/* 우측 프로빈스 인스펙터 패널 */}
              {selectedProvinceId && (
                <CKProvinceInspector
                  province={provinces.find(p => p.id === selectedProvinceId) || null}
                  onClose={() => setSelectedProvinceId(null)}
                  playerRulerName={gameState.personalInfo?.['이름'] || '군주'}
                  playerRealmName={gameState.factionState?.name || '영지 왕국'}
                  onRaiseLevies={handleRaiseLevies}
                  onOpenConstruction={() => { setRealmInitialTab('estate'); setActiveModal('realm'); }}
                  onOpenCharacterDialogue={(char) => setActiveDialogueCharacter(char)}
                  onDeclareWar={handleDeclareWar}
                  onAssignCouncilTask={handleAssignCouncilTask}
                  onSignPeaceTreaty={handleSignPeaceTreaty}
                  isAtWar={isAtWar}
                  warScore={warScore}
                  apiKey={apiKey}
                />
              )}
            </div>

            {/* 2. 하단: 궁정 서신 및 전황 연대기 (Grand Chronicle & Dispatch Feed) */}
            <div style={{
              padding: '12px 16px',
              background: 'linear-gradient(180deg, rgba(22, 17, 13, 0.95), rgba(14, 10, 8, 0.98))',
              border: '1px solid rgba(200, 159, 60, 0.3)',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              gap: '16px',
              height: '155px'
            }}>
              {/* 좌측: 최근 역사 국면 전개 */}
              <div style={{
                flex: 1.1,
                overflowY: 'auto',
                paddingRight: '12px',
                borderRight: '1px solid rgba(200, 159, 60, 0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#fef3c7' }}>
                    📜 【 역사적 국면 및 사건 전개 】
                  </span>
                  {gameState.historicalTag && (
                    <span style={{
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      border: '1px solid #fbbf24',
                      color: '#fbbf24'
                    }}>
                      {gameState.historicalTag}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11.5px', lineHeight: '1.55', color: '#d6d3d1' }}>
                  <TypewriterText text={gameState.narrative || "서기 1066년, 격변하는 유럽의 운명이 영주의 지휘 아래 놓여 있습니다."} delay={uxSettings.typewriterSpeed} />
                </div>
              </div>

              {/* 우측: 실시간 전황 상보 및 외교 기록 피드 (AI Co-Pilot 로그) */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚔️ 【 궁정 전황 및 외교 상보 (AI 서관) 】</span>
                  <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>실시간 업데이트</span>
                </div>
                {dispatchLogs.length === 0 ? (
                  <div style={{ fontSize: '11px', color: '#78716c', fontStyle: 'italic', marginTop: '4px' }}>
                    영지 징집병을 소집하여 진군시키거나, 인접국에 외교 사절을 파견하십시오. 실시간 전황과 외교 서신이 기록됩니다.
                  </div>
                ) : (
                  dispatchLogs.map(log => (
                    <div key={log.id} style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: log.type === 'battle' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                      border: log.type === 'battle' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
                      fontSize: '11px',
                      lineHeight: '1.45',
                      color: '#f3f4f6',
                      whiteSpace: 'pre-line'
                    }}>
                      <div style={{ fontSize: '9.5px', color: '#a8a29e', marginBottom: '2px' }}>{log.time}</div>
                      {log.text}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </section>

      {/* Right Panel */}
      
    
      {activeModal === 'familyTree' && (
        <FamilyTreeModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          gameState={gameState}
          onSuccession={handleSuccession}
        />
      )}

      {activeModal === 'character' && (
        <CKCharacterModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          gameState={gameState}
          onSelectPromotion={(target) => {
            setActiveModal(null);
            setActiveEvent({ type: 'promotion', promotionTarget: target });
          }}
          onSelectDecision={(dec) => {
            setActiveModal(null);
            setActiveEvent({ type: 'decision', decision: dec });
          }}
          onPetitionPromotion={(target) => {
            setActiveModal(null);
            setActiveEvent({ type: 'promotion', promotionTarget: target });
          }}
          onExecuteDecision={(command) => {
            handleAction(command);
          }}
        />
      )}

      {activeEvent && gameState && (
        <CKEventModal
          isOpen={true}
          onClose={() => setActiveEvent(null)}
          gameState={gameState}
          turn={turn}
          eventPayload={activeEvent}
          onConfirmOutcome={handleConfirmEventOutcome}
        />
      )}

      {activeModal === 'realm' && (
        <CKRealmModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          gameState={gameState}
          factionState={gameState.factionState}
          initialTab={realmInitialTab}
          constructionQueue={constructionQueue}
          turn={turn}
          loading={loading}
          onOrderBuild={handleOrderBuild}
          onCancelBuild={handleCancelBuild}
          constructionNotice={constructionNotice}
          promotionOption={promotionOption}
          derivedUpgradeOptions={derivedUpgradeOptions}
          maxSlots={maxSlots}
          domainLimit={domainLimit}
        />
      )}

      {activeModal === 'relations' && (
        <CKRelationsModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          gameState={gameState}
          onOpenDialogue={(char) => {
            setActiveModal(null);
            setActiveDialogueCharacter(char);
          }}
        />
      )}

      {activeModal === 'save' && (
        <CKSaveModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          gameState={gameState}
          turn={turn}
          constructionQueue={constructionQueue}
          onLoadSuccess={(loadedData) => {
            restoreSave(loadedData.gameState);
            setCanUndo(hasUndoState());
            showQuickNotice(`💾 [${loadedData.title}] 세이브 데이터를 불러왔습니다.`);
          }}
        />
      )}

      {activeModal === 'settings' && (
        <CKSettingsModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          narrativeText={gameState?.narrative}
          onUndoTurn={handleUndoTurn}
          onSettingsChange={(newSettings) => setUxSettings(newSettings)}
        />
      )}

      {activeModal === 'chronicle' && (
        <ChronicleModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          chronicle={gameState.chronicle}
          objective={gameState.objective}
          characterName={gameState.personalInfo?.['이름'] || '군주'}
        />
      )}

      {/* 🔑 Gemini AI 서관 API Key 관리 모달 */}
      <CKApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeySaved={(hasKey: boolean, savedKey?: string) => {
          setApiKey(savedKey || '');
          showQuickNotice(hasKey 
            ? '🔑 Gemini API Key가 저장되었습니다. (역사·인물·전황 AI 보조 활성화)' 
            : 'API Key가 삭제되어 로컬 룰 엔진으로 동작합니다.'
          );
        }}
      />

      {/* 💬 인물(NPC) 1:1 AI 대화 / 알현 모달 */}
      {activeDialogueCharacter && (
        <CKCharacterDialogueModal
          isOpen={true}
          onClose={() => setActiveDialogueCharacter(null)}
          character={activeDialogueCharacter}
          playerRulerName={gameState?.personalInfo?.['이름'] || '군주'}
          playerRulerTitle={gameState?.personalInfo?.['칭호'] || gameState?.personalInfo?.['직위'] || '영주'}
          currentDateStr={formatCleanDate(gameDate)}
          apiKey={apiKey}
          onOpinionChange={(charId, delta) => {
            showQuickNotice(`👥 인물 호감도 변동: ${delta > 0 ? `+${delta}` : delta}`);
          }}
        />
      )}

      {/* ⚡ Quick Save / Undo Notification Toast */}
      {quickNotice && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, rgba(26, 32, 48, 0.98), rgba(15, 20, 32, 0.98))',
          border: '2px solid var(--gold-accent)',
          borderRadius: '10px',
          padding: '12px 24px',
          color: 'var(--gold-hover)',
          fontWeight: 'bold',
          fontSize: '0.95rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.9), 0 0 20px rgba(212,175,55,0.4)',
          zIndex: 9999,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>{quickNotice}</span>
        </div>
      )}

    </main>
  );
}

