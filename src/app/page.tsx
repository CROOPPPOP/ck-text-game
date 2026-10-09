"use client";

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import { checkPromotion, getUpgradeCandidates, mergeEstateBuildings } from '@/lib/estate';
import { calculateEstatePromotionCost, getPlayerWealthAmount } from '@/lib/estateEconomy';
import { parsePopulationCount } from '@/lib/populationEconomy';
import { calculateCKAttributes, detectPlayerArchetype, applyTurnResourceAccumulation } from '@/lib/ckVisuals';
import { getCouncilVassals, sanitizeNameAndRole } from '@/lib/characterRelations';
import { ParsedState, ChronicleItem, parseLLMResponse } from '@/lib/parser';
import { QueueItem, BuildOption, parseTurnNumber, getMaxSlots, createQueueItem, turnsLeft, normalizeQueue, summarizeQueue, buildSystemCommands, applyTurnResult, sameBuildingName } from '@/lib/construction';
import CKTopHud from '@/components/CKTopHud';
import CKCharacterModal from '@/components/CKCharacterModal';
import FamilyTreeModal from '@/components/FamilyTreeModal';
import CKRealmModal from '@/components/CKRealmModal';
import CKRelationsModal from '@/components/CKRelationsModal';
import ChronicleModal from '@/components/ChronicleModal';
import CKSaveModal from '@/components/CKSaveModal';
import CKSettingsModal from '@/components/CKSettingsModal';
import {
  pushUndoState,
  popUndoState,
  hasUndoState,
  quickSave,
  quickLoad,
  loadUXSettings,
  autoMigrateAndSanitizeStorage,
  UserUXSettings,
  SaveSlotData
} from '@/lib/saveManager';
import { sanitizeEstateState } from '@/lib/estate';
import { mergeFactionLists } from '@/lib/factionRelations';

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
  const [constructionNotice, setConstructionNotice] = useState('');
  const [uxSettings, setUxSettings] = useState<UserUXSettings>(loadUXSettings());
  const [canUndo, setCanUndo] = useState(false);
  const [quickNotice, setQuickNotice] = useState<string | null>(null);

  const showQuickNotice = (msg: string) => {
    setQuickNotice(msg);
    setTimeout(() => setQuickNotice(null), 3000);
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
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: config, 
          isInitialSetup: true,
          currentState: null,
          apiKey: localStorage.getItem('ck_api_key') || '',
          stream: true
        })
      });
      const data = await readGameStream(response, (raw) => {
        setStreamPreview(extractLivePreview(raw));
      });
      if (data?.parsed) {
        // 유저가 선택한 신분 프리셋 확실히 보장
        if (config.playerStatus) {
          if (!data.parsed.personalInfo) {
            data.parsed.personalInfo = {};
          }
          data.parsed.personalInfo['신분'] = config.playerStatus;
          if (!data.parsed.personalInfo['직위'] || data.parsed.personalInfo['직위'] === '귀족' || data.parsed.personalInfo['직위'] === '영주') {
            data.parsed.personalInfo['직위'] = config.playerStatus;
          }
        }
        const initialChronicle: ChronicleItem = {
          turn: 1,
          dateLocation: data.parsed.dateLocation,
          action: "역사의 서막이 열리다",
          result: "시작",
          summary: (data.parsed.narrative || "").slice(0, 100).replace(/\n/g, ' ')
        };
        data.parsed.chronicle = [initialChronicle];
        setGameState(data.parsed);
        setTurn(parseTurnNumber(data.parsed.dateLocation) ?? 1);
        setConstructionQueue([]);
        setConstructionNotice('');
      } else if (data?.error) {
        alert("API 에러: " + data.error);
        if (data.error.includes("키가 제공되지 않았습니다")) window.location.href = '/startup';
      } else {
        alert("시작 설정 파싱에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("서버 통신 오류가 발생했습니다.");
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
    const sanitized = sanitizeEstateState(loaded);
    const { _constructionQueue, _turn, ...rest } = sanitized;
    const t = parseTurnNumber(rest.dateLocation) ?? (typeof _turn === 'number' ? _turn : 0);
    setGameState(rest);
    setTurn(t);
    setConstructionQueue(normalizeQueue(_constructionQueue, t));
    setConstructionNotice('');
    setCanUndo(hasUndoState());
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

  // Keyboard Shortcuts (1~4 선택지, Q 퀵세이브, Z 되돌리기, Esc 모달닫기)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!uxSettings.shortcutsEnabled) return;

      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
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
  }, [uxSettings.shortcutsEnabled, activeModal, gameState, loading, canUndo, turn, constructionQueue]);

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
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: finalAction, 
          currentState: { ...gameState, constructionQueue: summarizeQueue(constructionQueue, turn) }, // JSON Save System
          apiKey: localStorage.getItem('ck_api_key') || '',
          stream: true
        })
      });
      const data = await readGameStream(response, (raw) => {
        setStreamPreview(extractLivePreview(raw));
      });
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
      />

      {/* Center Panel */}
      <section className={`glass-panel ${styles.centerPanel}`}>

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
            <div className={styles.contentSplit}>
              <div className={styles.leftPane}>
                <div className={styles.narrativeArea}>
              {loading ? (
                <div style={{
                  padding: '24px',
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid var(--gold-accent)',
                  borderRadius: '10px',
                  boxShadow: '0 0 25px rgba(212,175,55,0.15)',
                  minHeight: '220px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid rgba(212,175,55,0.25)', paddingBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gold-accent)', fontWeight: 'bold', fontSize: '1.05rem' }}>
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--gold-accent)', boxShadow: '0 0 10px var(--gold-accent)', animation: 'pulse 1.2s infinite' }}></span>
                      ⚡ 실시간 역사 시뮬레이션 기록 중...
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>Gemini 3.8 Flash 엔진 실시간 스트리밍</span>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: 'var(--text-main)', fontSize: '1.05rem', fontFamily: 'serif' }}>
                    {streamPreview || "인과율을 분석하고 세계의 반응을 시뮬레이션하고 있습니다..."}
                    <span style={{ display: 'inline-block', width: '8px', height: '18px', background: 'var(--gold-accent)', marginLeft: '6px', verticalAlign: 'middle', animation: 'pulse 0.8s infinite' }}></span>
                  </div>
                </div>
              ) : (
                <>
                  {gameState.judgment && (
                    <div style={{ marginBottom: '30px', padding: '20px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--panel-border)', borderRadius: '8px' }}>
                      <div style={{ textAlign: 'center', marginBottom: '16px', fontSize: '1.4rem', fontWeight: 'bold', 
                        color: gameState.judgment.result.includes('성공') ? 'var(--gold-accent)' : 'var(--danger)',
                        textShadow: gameState.judgment.result.includes('성공') ? '0 0 10px rgba(212,175,55,0.5)' : '0 0 10px rgba(239,68,68,0.5)'
                      }}>
                        {gameState.judgment.result}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {gameState.judgment.positive && (
                          <div style={{ display: 'flex', gap: '12px', background: 'rgba(16,185,129,0.1)', padding: '12px', borderRadius: '6px', borderLeft: '4px solid var(--success)' }}>
                            <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>▲</span>
                            <span style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.5' }}>{gameState.judgment.positive}</span>
                          </div>
                        )}
                        {gameState.judgment.negative && (
                          <div style={{ display: 'flex', gap: '12px', background: 'rgba(239,68,68,0.1)', padding: '12px', borderRadius: '6px', borderLeft: '4px solid var(--danger)' }}>
                            <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>▼</span>
                            <span style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.5' }}>{gameState.judgment.negative}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {gameState.environment && (
                    <div style={{ marginBottom: '30px', padding: '15px 20px', background: gameState.factionState && !gameState.factionState.none ? 'rgba(212,175,55,0.05)' : 'rgba(0,0,0,0.4)', border: gameState.factionState && !gameState.factionState.none ? '1px solid rgba(212,175,55,0.2)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', backgroundImage: gameState.factionState && !gameState.factionState.none ? 'linear-gradient(to bottom right, rgba(212,175,55,0.05), transparent)' : 'linear-gradient(to bottom right, rgba(255,255,255,0.02), transparent)' }}>
                      <div style={{ color: 'var(--gold-accent)', fontSize: '0.95rem', marginBottom: '12px', fontWeight: 'bold', borderBottom: '1px solid rgba(255,215,0,0.2)', paddingBottom: '6px' }}>
                        {gameState.factionState && !gameState.factionState.none ? '🗺️ 주변 정세 (지도자 시야)' : '👀 현장 상황 (개인 시야)'}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {Object.entries(gameState.environment).map(([key, val], idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '10px', fontSize: '0.95rem' }}>
                            <strong style={{ color: 'var(--text-muted)', flexShrink: 0, minWidth: '80px' }}>[{key}]</strong>
                            <span style={{ color: 'var(--text-main)', lineHeight: '1.4' }}>{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className={`ck-event-frame ${styles.narrativeText}`} style={{ position: 'relative', fontSize: getFontSizeStyle(uxSettings.fontSize) }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid rgba(212,175,55,0.25)', paddingBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ color: 'var(--gold-accent)', fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: '1px' }}>
                        📜 【 역사적 국면 및 사건 전개 】
                      </span>
                      {gameState.historicalTag && (
                        <span style={{
                          padding: '3px 10px', border: '1px solid', borderRadius: '4px',
                          fontWeight: 'bold', fontSize: '0.8rem',
                          color: gameState.historicalTag.includes('확인됨') ? '#60a5fa' : 
                                 gameState.historicalTag.includes('분기') ? '#ef4444' : 
                                 gameState.historicalTag.includes('개연성') ? '#34d399' : '#f59e0b',
                          borderColor: gameState.historicalTag.includes('확인됨') ? '#60a5fa' : 
                                       gameState.historicalTag.includes('분기') ? '#ef4444' : 
                                       gameState.historicalTag.includes('개연성') ? '#34d399' : '#f59e0b',
                          boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                          background: 'rgba(0,0,0,0.3)',
                          fontFamily: 'serif',
                          letterSpacing: '1px'
                        }}>
                          {gameState.historicalTag}
                        </span>
                      )}
                    </div>
                    <TypewriterText text={gameState.narrative || ""} delay={uxSettings.typewriterSpeed} />
                  </div>
                </>
              )}
            </div>

            {gameState.ending && (
              <div style={{ marginTop: '30px', padding: '30px', background: 'rgba(239,68,68,0.2)', border: '2px solid var(--danger)', borderRadius: '8px', textAlign: 'center' }}>
                <h2 style={{ color: 'var(--danger)', fontSize: '2rem', marginBottom: '20px' }}>【 시뮬레이션 종료 】</h2>
                <div style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '30px', lineHeight: '1.6' }}>
                  <TypewriterText text={gameState.ending} delay={uxSettings.typewriterSpeed} />
                </div>
                
                {gameState.familyState && gameState.familyState.heir && !gameState.familyState.heir.includes('없음') && !gameState.familyState.heir.includes('미정') ? (
                  <button className={styles.actionBtn} style={{ background: 'linear-gradient(45deg, #7f1d1d, #ef4444)', color: '#fff', fontSize: '1.2rem', padding: '15px 30px', border: '1px solid #fca5a5' }} onClick={handleSuccession}>
                    가문의 유지를 잇다 : 후계자 [{gameState.familyState.heir}] (으)로 플레이 계속하기 ⚔️
                  </button>
                ) : (
                  <button className={styles.actionBtn} style={{ background: 'rgba(0,0,0,0.5)', fontSize: '1.2rem', padding: '15px 30px', border: '1px solid var(--panel-border)' }} onClick={() => { localStorage.removeItem("ck_auto_save"); window.location.reload(); }}>
                    가문이 단절되었습니다. 처음부터 다시 시작 ☠️
                  </button>
                )}
              </div>
            )}

            </div>
            {!loading && gameState.choices && !gameState.ending && (
              <div className={styles.choicesArea}>
                {gameState.choices.map((choice, idx) => {
                  const theme = getChoiceTheme(choice.groupType);
                  return (
                    <button 
                      key={idx} 
                      className={styles.choiceBtn} 
                      style={{
                        background: theme.bg,
                        border: `1px solid ${theme.border}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '14px 16px'
                      }}
                      onClick={() => handleAction(choice.text)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', flex: 1 }}>
                        <span style={{ fontSize: '1.3rem' }}>{theme.icon}</span>
                        <div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--gold-accent)', fontWeight: 'bold' }}>
                            {uxSettings.shortcutsEnabled ? `[${idx + 1}] ` : ''}결단 {choice.id} &bull; [{choice.type}]
                          </div>
                          <div style={{ fontSize: '0.98rem', color: '#fff', fontWeight: 'bold', marginTop: '2px', lineHeight: '1.4' }}>
                            {choice.text}
                          </div>
                        </div>
                      </div>
                      {choice.probability && (
                        <span style={{
                          fontSize: '0.8rem',
                          color: choice.probability.includes('높음') || choice.probability.includes('확실') ? 'var(--success)' : choice.probability.includes('낮음') || choice.probability.includes('위험') ? 'var(--danger)' : 'var(--gold-hover)',
                          background: 'rgba(0,0,0,0.4)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          whiteSpace: 'nowrap'
                        }}>
                          {choice.probability}
                        </span>
                      )}
                    </button>
                  );
                })}
                
                <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
                   <input 
                     type="text" 
                     value={freeAction} 
                     onChange={e => setFreeAction(e.target.value)} 
                     className={styles.inputField} 
                     style={{ flex: 1, padding: '12px 15px', fontSize: '1.05rem', minWidth: '300px' }}
                     placeholder="직접 행동 입력 (자유 행동)..." 
                     onKeyDown={(e) => { if (e.key === 'Enter') { handleAction(freeAction); setFreeAction(""); } }}
                   />
                   <button className={styles.choiceBtn} style={{padding: '12px 25px', width: 'auto', background: 'var(--gold-accent)', color: '#121212', fontWeight: 'bold'}} onClick={() => { handleAction(freeAction); setFreeAction(""); }}>
                      실행
                   </button>
                </div>
              </div>
            )}
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
          onPetitionPromotion={(target) => {
            handleAction(`[신분 승격 청원] 모든 승격 요건을 완비하였으므로, '${target.ceremonyName}' 의식을 공식 거행하고 정식 '${target.targetRank}'(으)로 승격을 청원하는 공식 서임 절차를 진행합니다.`);
          }}
          onExecuteDecision={(command) => {
            handleAction(command);
          }}
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

