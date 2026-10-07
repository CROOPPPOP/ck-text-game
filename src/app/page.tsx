"use client";

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import { checkPromotion, getUpgradeCandidates } from '@/lib/estate';
import { calculateCKAttributes } from '@/lib/ckVisuals';
import { ParsedState, ChronicleItem, parseLLMResponse } from '@/lib/parser';
import { QueueItem, BuildOption, parseTurnNumber, getMaxSlots, createQueueItem, turnsLeft, normalizeQueue, summarizeQueue, buildSystemCommands, applyTurnResult, sameBuildingName } from '@/lib/construction';
import CKTopHud from '@/components/CKTopHud';
import CKCharacterModal from '@/components/CKCharacterModal';
import FamilyTreeModal from '@/components/FamilyTreeModal';
import CKRealmModal from '@/components/CKRealmModal';
import CKRelationsModal from '@/components/CKRelationsModal';
import CKSaveModal from '@/components/CKSaveModal';
import CKSettingsModal from '@/components/CKSettingsModal';
import {
  pushUndoState,
  popUndoState,
  hasUndoState,
  quickSave,
  quickLoad,
  loadUXSettings,
  UserUXSettings,
  SaveSlotData
} from '@/lib/saveManager';

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

const Accordion = ({ title, children, defaultOpen = true }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <section style={{ marginBottom: '16px' }}>
      <h2 className={styles.accordionHeader} onClick={() => setIsOpen(!isOpen)}>
        {title}
        <span style={{ fontSize: '0.8rem', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
      </h2>
      {isOpen && <div>{children}</div>}
    </section>
  );
};

const StatValue = ({ value }: { value: string }) => {
  const match = value.match(/^(.*?)(\([+-]\d+\))$/);
  if (match) {
    const isPositive = match[2].includes('+');
    return (
      <span>
        {match[1]}
        <span style={{ color: isPositive ? 'var(--success)' : 'var(--danger)', marginLeft: '4px', fontSize: '0.9em', fontWeight: 'bold' }}>
          {match[2]}
        </span>
      </span>
    );
  }
  return <span>{value}</span>;
};

const getTraitColor = (category: string) => {
  switch (category) {
    case '신체특성': return { border: 'var(--danger)', color: '#ff9999', bg: 'rgba(239,68,68,0.15)' };
    case '정신특성': return { border: '#3b82f6', color: '#93c5fd', bg: 'rgba(59,130,246,0.15)' };
    case '감각특성': return { border: 'var(--success)', color: '#6ee7b7', bg: 'rgba(16,185,129,0.15)' };
    case '전문특성': return { border: 'var(--gold-accent)', color: 'var(--gold-hover)', bg: 'rgba(212,175,55,0.15)' };
    case '잠재특성': return { border: '#a855f7', color: '#d8b4fe', bg: 'rgba(168,85,247,0.15)' };
    case '일시적특성': return { border: '#fff', color: '#fff', bg: 'rgba(255,255,255,0.1)', animation: 'pulse 2s infinite' };
    default: return { border: 'var(--gold-accent)', color: 'var(--gold-hover)', bg: 'rgba(212,175,55,0.15)' };
  }
};

const getTraitIcon = (category: string) => {
  if (category.includes('신체')) return '💪';
  if (category.includes('정신')) return '🧠';
  if (category.includes('감각')) return '👁️';
  if (category.includes('전문')) return '🎖️';
  if (category.includes('잠재')) return '✨';
  if (category.includes('일시적')) return '⏳';
  return '🏷️';
};

const getStatusIcon = (name: string) => {
  if (name.includes('건강')) return '❤️';
  if (name.includes('체력')) return '⚡';
  if (name.includes('허기') || name.includes('갈증')) return '🍽️';
  if (name.includes('피로') || name.includes('수면')) return '🥱';
  if (name.includes('체온')) return '🌡️';
  if (name.includes('통증') || name.includes('부상') || name.includes('골절')) return '🤕';
  if (name.includes('출혈')) return '🩸';
  if (name.includes('화상')) return '🔥';
  if (name.includes('질병') || name.includes('감염')) return '🦠';
  if (name.includes('중독')) return '🤢';
  if (name.includes('스트레스') || name.includes('정신') || name.includes('분노')) return '💢';
  if (name.includes('공포') || name.includes('불안')) return '😨';
  if (name.includes('사기') || name.includes('자신감')) return '🔥';
  if (name.includes('시각') || name.includes('청각') || name.includes('감각')) return '👁️';
  return '💠';
};

const getStatusColor = (statusText: string) => {
  if (statusText.includes('재앙적') || statusText.includes('매우 낮음')) return '#ef4444';
  if (statusText.includes('낮음')) return '#f87171';
  if (statusText.includes('보통')) return '#9ca3af';
  if (statusText.includes('높음')) return '#34d399';
  if (statusText.includes('매우 높음') || statusText.includes('탁월함') || statusText.includes('극한 수준')) return '#fbbf24';
  return 'var(--text-main)';
};

const getChoiceTheme = (groupType?: string) => {
  if (!groupType) return { bg: 'rgba(255, 215, 0, 0.05)', border: 'var(--gold-accent)', icon: '💬' };
  
  if (groupType.includes('개인 전투')) {
    return { bg: 'linear-gradient(45deg, rgba(127, 29, 29, 0.6), rgba(185, 28, 28, 0.6))', border: '#ef4444', icon: '⚔️' };
  }
  if (groupType.includes('국가') || groupType.includes('세력')) {
    return { bg: 'linear-gradient(45deg, rgba(31, 41, 55, 0.8), rgba(55, 65, 81, 0.8))', border: '#9ca3af', icon: '🚩' };
  }
  if (groupType.includes('돌발') || groupType.includes('위기')) {
    return { bg: 'linear-gradient(45deg, rgba(180, 83, 9, 0.6), rgba(217, 119, 6, 0.6))', border: '#f59e0b', icon: '⚠️' };
  }
  
  return { bg: 'rgba(255, 215, 0, 0.05)', border: 'var(--gold-accent)', icon: '💬' };
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
  const [activeTab, setActiveTab] = useState<'inventory' | 'relations' | 'objective' | 'estate'>('inventory');
  const [activeModal, setActiveModal] = useState<'character' | 'familyTree' | 'realm' | 'relations' | 'rightPanel' | 'save' | 'settings' | null>(null);
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
    const { _constructionQueue, _turn, ...rest } = loaded;
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

            const mergedTraits = mergeArrayByKey(
               prevState.traits || [], 
               data.parsed.traits || [], 
               (t: any) => t.name
            );

            const mergedPersonalRels = mergeArrayByKey(
               prevState.relationships?.personal || [],
               data.parsed.relationships?.personal || [],
               (r: string) => r.split('|')[0].replace(/\(.*?\)/g, '').trim()
            );

            const mergedFactionRels = mergeArrayByKey(
               prevState.relationships?.faction || [],
               data.parsed.relationships?.faction || [],
               (r: string) => r.split('-')[0].trim()
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
            
            return {
            ...prevState,
            ...data.parsed,
            objective: data.parsed.objective || prevState.objective,
            longTermPlan: data.parsed.longTermPlan !== undefined ? data.parsed.longTermPlan : prevState.longTermPlan,
            inventory: data.parsed.inventory || prevState.inventory,
            estate: data.parsed.estate || prevState.estate,
            buildOptions: data.parsed.buildOptions ?? prevState.buildOptions,
            constructionRejected: undefined,
            traits: mergedTraits,
            stats: {
              innate: mergeObject(prevState.stats?.innate, data.parsed.stats?.innate),
              acquired: mergeObject(prevState.stats?.acquired, data.parsed.stats?.acquired)
            },
            personalInfo: mergeObject(prevState.personalInfo, data.parsed.personalInfo),
            factionState: data.parsed.factionState?.none ? { none: "true" } : mergeObject(prevState.factionState, data.parsed.factionState),
            relationships: mergedRelationships,

            playerStatus: data.parsed.playerStatus || prevState.playerStatus,
            familyState: data.parsed.familyState || prevState.familyState,
            chronicle: updatedChronicle
          };
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

  // 거점 상주 자문관 및 가신 추출
  const councilVassals = (gameState?.relationships?.personal || []).filter(rel => {
    const rawName = rel.split('|')[0] || '';
    const descStr = rel.split('|').slice(3).join(' ') || '';
    const keywords = ['가신', '기사', '집사장', '원수', '첩보', '사제', '부대장', '부원장', '관리인', '서기관', '참모', '조언', '시종'];
    return keywords.some(k => rawName.includes(k) || descStr.includes(k));
  }).map(rel => {
    const parts = rel.split('|').map(p => p.trim());
    const rawName = parts[0] || '';
    const roleMatch = rawName.match(/^(.*?)\s*\((.*?)\)$/);
    const name = roleMatch ? roleMatch[1].trim() : rawName;
    const role = roleMatch ? roleMatch[2].trim() : (parts.slice(3).join(' ').includes('가신') ? '가신' : '자문관');
    return { name, role, raw: rel };
  });

  let promotionOption: any = null;
  let derivedUpgradeOptions: any[] = [];

  if (gameState?.estate && gameState.estate.level) {
    const estateLevelMatch = gameState.estate.level.match(/Lv\.?\s*(\d+)/i);
    const estateLevel = estateLevelMatch ? parseInt(estateLevelMatch[1], 10) : 1;

    const promoCheck = checkPromotion(estateLevel, gameState.estate.buildings, gameState.factionState, !!gameState.factionState);
    if (promoCheck.canPromote) {
      promotionOption = {
        name: `거점 승격 공사 (Lv.${estateLevel} → Lv.${estateLevel + 1})`,
        cost: `(기준가 × ${estateLevel})`,
        turns: estateLevel + 2,
        desc: '거점의 규모를 다음 단계로 승격시킵니다. 건설 슬롯과 건물 레벨 상한이 늘어납니다.',
        kind: 'promote',
        targetLevel: estateLevel + 1
      };
    }

    const upgradeCandidates = getUpgradeCandidates(estateLevel, gameState.estate.buildings);
    derivedUpgradeOptions = upgradeCandidates.map(c => ({
      name: `${c.buildingName} 업그레이드 (Lv.${c.currentLevel}→${c.targetLevel})`,
      cost: `약 ${c.cost} 단위`,
      turns: c.turns,
      desc: '해당 건물의 기능을 강화합니다.',
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
        onOpenRealm={() => setActiveModal('realm')}
        onOpenCharacter={() => setActiveModal('character')}
        onOpenRelations={() => setActiveModal('relations')}
        onOpenEstate={() => { setActiveTab('estate'); setActiveModal('rightPanel'); }}
        onOpenChronicle={() => { setActiveTab('objective'); setActiveModal('rightPanel'); }}
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
        />
      )}

      {activeModal === 'realm' && (
        <CKRealmModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          gameState={gameState}
          factionState={gameState.factionState}
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

      {activeModal === 'rightPanel' && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
              <button onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '2rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>
            <div>
                
        <div style={{ display: 'flex', gap: '5px', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', flexShrink: 0 }}>
          <button style={{ flex: 1, padding: '10px 5px', fontSize: '0.9rem', background: activeTab === 'inventory' ? 'var(--gold-accent)' : 'rgba(0,0,0,0.3)', color: activeTab === 'inventory' ? '#000' : 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('inventory')}>자원/세력</button>
          <button style={{ flex: 1, padding: '10px 5px', fontSize: '0.9rem', background: activeTab === 'relations' ? 'var(--gold-accent)' : 'rgba(0,0,0,0.3)', color: activeTab === 'relations' ? '#000' : 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('relations')}>인간관계</button>
          <button style={{ flex: 1, padding: '10px 5px', fontSize: '0.9rem', background: activeTab === 'estate' ? 'var(--gold-accent)' : 'rgba(0,0,0,0.3)', color: activeTab === 'estate' ? '#000' : 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('estate')}>🏕️ 거점/영지</button>
          <button style={{ flex: 1, padding: '10px 5px', fontSize: '0.9rem', background: activeTab === 'objective' ? 'var(--gold-accent)' : 'rgba(0,0,0,0.3)', color: activeTab === 'objective' ? '#000' : 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('objective')}>📜 로그/상황</button>
        </div>
        
        {activeTab === 'inventory' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <Accordion title="【 국가 및 세력 현황 】">
          {gameState.factionState && !gameState.factionState.none ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
              {Object.entries(gameState.factionState).map(([key, val], idx) => {
                 let valueText = val;
                 let statusText = '';
                 let color = 'var(--text-main)';
                 const match = val.match(/^(.*)\(([^)]*)\)$/);
                 if (match) {
                   valueText = match[1].trim() || '-';
                   statusText = match[2].trim();
                   color = getStatusColor(statusText);
                 } else {
                   const descriptors = ['매우 낮음', '매우 높음', '극한 수준', '재앙적', '탁월함', '낮음', '보통', '높음'];
                   const found = descriptors.find(d => val.includes(d));
                   if (found) {
                     statusText = found;
                     valueText = val.replace(found, '').replace(/\(\)/g, '').trim() || '-';
                     color = getStatusColor(statusText);
                   }
                 }
                 return (
                   <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '10px 12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                     <span style={{ color: 'var(--gold-accent)', fontSize: '0.85rem', fontWeight: 'bold', flexShrink: 0, marginRight: '10px' }}>{key}</span>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                       <span style={{ color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={valueText}>{valueText}</span>
                       {statusText && <span style={{ color, fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap', flexShrink: 0 }}>{statusText}</span>}
                     </div>
                   </div>
                 );
              })}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '10px' }}>통치 중인 영지 없음</div>
          )}
        </Accordion>
          </div>
        )}

        {activeTab === 'relations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <Accordion title="【 외교 및 인간 관계 】">
          {gameState.relationships ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {gameState.relationships.personal && gameState.relationships.personal.length > 0 && (
                <div>
                   <div style={{ color: 'var(--gold-accent)', fontSize: '0.9rem', marginBottom: '8px', borderBottom: '1px solid rgba(255,215,0,0.2)', paddingBottom: '4px' }}>👥 인간 관계 ({gameState.relationships.personal.length}명)</div>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     {gameState.relationships.personal.map((rel, idx) => {
                       const parts = rel.split('|').map(p => p.trim());
                       if (parts.length >= 4) {
                         const rawName = parts[0];
                         const roleMatch = rawName.match(/^(.*?)\s*\((.*?)\)$/);
                         const name = roleMatch ? roleMatch[1].trim() : rawName;
                         const role = roleMatch ? roleMatch[2].trim() : '';

                         const trustStr = parts[1];
                         const affStr = parts[2];
                         const descStr = parts.slice(3).join(' | ').replace('관계:', '').trim();

                         const trustMatch = trustStr.match(/(\d+)/);
                         const affMatch = affStr.match(/(\d+)/);
                         
                         const trustVal = trustMatch ? Math.min(100, Math.max(0, parseInt(trustMatch[1], 10))) : 0;
                         const affVal = affMatch ? Math.min(100, Math.max(0, parseInt(affMatch[1], 10))) : 0;
                         
                         const isRomance = affStr.includes('애정도');
                         const isRival = affStr.includes('숙적') || affStr.includes('라이벌') || descStr.includes('숙적') || descStr.includes('라이벌') || (trustStr.includes('경계') && trustVal <= 15);
                         const isObsessive = affStr.includes('집착') || affStr.includes('광애');
                         const isExtremeLove = affStr.includes('극애');
                         const isSwornFriend = affStr.includes('맹우');
                         const isCompanion = trustStr.includes('동반');
                         
                         let currentAffColor = isRomance ? 'linear-gradient(90deg, #be123c, #f43f5e)' : 'linear-gradient(90deg, #b45309, #fbbf24)';
                         let currentAffGlow = 'none';
                         let currentTrustColor = 'linear-gradient(90deg, #0369a1, #38bdf8)';
                         let currentTrustGlow = 'none';
                         let textColorAff = isRomance ? '#f43f5e' : '#fbbf24';
                         let textColorTrust = '#38bdf8';

                         if (isRival) {
                           currentAffColor = 'linear-gradient(90deg, #7f1d1d, #dc2626)';
                           currentAffGlow = '0 0 10px rgba(220, 38, 38, 0.4)';
                           textColorAff = '#ef4444';
                         } else if (isObsessive) {
                           currentAffColor = 'linear-gradient(90deg, #4a044e, #86198f, #9f1239)';
                           currentAffGlow = '0 0 12px #86198f';
                           textColorAff = '#d946ef';
                         } else if (isExtremeLove) {
                           currentAffColor = 'linear-gradient(90deg, #db2777, #f472b6, #fce7f3)';
                           currentAffGlow = '0 0 10px #f472b6';
                           textColorAff = '#f9a8d4';
                         } else if (isSwornFriend) {
                           currentAffColor = 'linear-gradient(90deg, #b45309, #f59e0b, #fef3c7)';
                           currentAffGlow = '0 0 10px #f59e0b';
                           textColorAff = '#fcd34d';
                         }
                         
                         if (isCompanion) {
                           currentTrustColor = 'linear-gradient(90deg, #0284c7, #38bdf8, #e0f2fe)';
                           currentTrustGlow = '0 0 10px #38bdf8';
                           textColorTrust = '#bae6fd';
                         }
                         
                         const borderColor = isRival ? '#ef4444' : isObsessive ? '#86198f' : isSwornFriend ? '#f59e0b' : 'rgba(255,255,255,0.08)';

                         return (
                           <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', border: `1px solid ${borderColor}`, boxShadow: isRival ? '0 0 10px rgba(239,68,68,0.2)' : isObsessive ? '0 0 12px rgba(134,25,143,0.3)' : 'none' }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                 <span style={{ color: isRival ? '#fca5a5' : 'var(--gold-accent)', fontWeight: 'bold', fontSize: '0.98rem' }}>
                                   {isRival ? '⚔️' : isRomance ? '❤️' : '👤'} {name}
                                 </span>
                                 {role && (
                                   <span style={{ fontSize: '0.72rem', background: 'rgba(56,189,248,0.15)', color: '#7dd3fc', border: '1px solid rgba(56,189,248,0.3)', padding: '1px 6px', borderRadius: '4px' }}>
                                     {role}
                                   </span>
                                 )}
                               </div>
                               
                               <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                 {isRival && (
                                   <span style={{ fontSize: '0.72rem', background: 'rgba(239,68,68,0.25)', color: '#fca5a5', border: '1px solid #ef4444', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                     ⚔️ 숙적 / 라이벌
                                   </span>
                                 )}
                                 {isObsessive && (
                                   <span style={{ fontSize: '0.72rem', background: 'rgba(192,132,252,0.2)', color: '#d8b4fe', border: '1px solid #c084fc', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                     🔥 집착 / 광애
                                   </span>
                                 )}
                                 {isExtremeLove && (
                                   <span style={{ fontSize: '0.72rem', background: 'rgba(244,114,182,0.2)', color: '#f472b6', border: '1px solid #f472b6', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                     💖 극애
                                   </span>
                                 )}
                                 {isSwornFriend && (
                                   <span style={{ fontSize: '0.72rem', background: 'rgba(251,191,36,0.2)', color: '#fcd34d', border: '1px solid #fbbf24', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                     🛡️ 맹우
                                   </span>
                                 )}
                                 {isCompanion && (
                                   <span style={{ fontSize: '0.72rem', background: 'rgba(56,189,248,0.2)', color: '#bae6fd', border: '1px solid #38bdf8', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                     👑 동반자
                                   </span>
                                 )}
                               </div>
                             </div>

                             <span style={{ fontSize: '0.82rem', color: isObsessive ? '#fbcfe8' : 'var(--text-muted)', lineHeight: '1.4' }}>
                               {descStr}
                             </span>
                             
                             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '2px' }}>
                               <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', background: 'rgba(0,0,0,0.2)', padding: '6px 8px', borderRadius: '4px' }}>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: textColorTrust }}>
                                   <span>🤝 {trustStr.replace(/\d+/, '').replace('-', '').trim() || '신뢰도'}</span>
                                   <strong>{trustVal}%</strong>
                                 </div>
                                 <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden', boxShadow: currentTrustGlow }}>
                                   <div style={{ width: `${trustVal}%`, height: '100%', background: currentTrustColor }} />
                                 </div>
                               </div>

                               <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', background: 'rgba(0,0,0,0.2)', padding: '6px 8px', borderRadius: '4px' }}>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: textColorAff, textShadow: currentAffGlow }}>
                                   <span>{isRival ? '⚔️' : isRomance ? '❤️' : '🌿'} {affStr.replace(/\d+/, '').replace('-', '').trim() || (isRomance ? '애정도' : '우정도')}</span>
                                   <strong>{affVal}%</strong>
                                 </div>
                                 <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden', boxShadow: currentAffGlow }}>
                                   <div style={{ width: `${affVal}%`, height: '100%', background: currentAffColor }} />
                                 </div>
                               </div>
                             </div>
                           </div>
                         );
                       }
                       return <div key={idx} style={{ fontSize: '0.9rem', color: 'var(--text-main)', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '4px' }}>• {rel}</div>;
                     })}
                   </div>
                </div>
              )}
              {gameState.relationships.faction && gameState.relationships.faction.length > 0 && (
                <div>
                   <div style={{ color: 'var(--gold-accent)', fontSize: '0.9rem', marginBottom: '8px', borderBottom: '1px solid rgba(255,215,0,0.2)', paddingBottom: '4px' }}>🛡️ 세력 및 외교 관계 ({gameState.relationships.faction.length}개)</div>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     {gameState.relationships.faction.map((rel, idx) => {
                       const match = rel.match(/^(.*?)\s+-\s+(.*)$/);
                       if (match) {
                         const name = match[1].replace(/^[○•\s]+/, '').trim();
                         const rest = match[2].trim();
                         const pipeParts = rest.split('|').map(p => p.trim());
                         const status = pipeParts[0];
                         let threat = '';
                         let attitude = '';
                         pipeParts.slice(1).forEach(p => {
                           if (p.startsWith('위협도:')) threat = p.replace('위협도:', '').trim();
                           if (p.startsWith('태도:')) attitude = p.replace('태도:', '').trim();
                         });

                         let badgeColor = 'rgba(255,255,255,0.1)';
                         let textColor = 'var(--text-muted)';
                         if (status.includes('동맹') || status.includes('우호')) { badgeColor = 'rgba(56,189,248,0.2)'; textColor = '#38bdf8'; }
                         else if (status.includes('적대') || status.includes('교전') || status.includes('파문')) { badgeColor = 'rgba(239,68,68,0.2)'; textColor = '#ef4444'; }
                         else if (status.includes('정전') || status.includes('중립') || status.includes('의심') || status.includes('휴전') || status.includes('계약')) { badgeColor = 'rgba(251,191,36,0.2)'; textColor = '#fbbf24'; }
                         else if (status.includes('주종') || status.includes('봉신') || status.includes('주군')) { badgeColor = 'rgba(168,85,247,0.2)'; textColor = '#c084fc'; }

                         return (
                           <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                               <span style={{ fontWeight: 'bold', color: 'var(--gold-accent)', fontSize: '0.95rem' }}>🛡️ {name}</span>
                               <span style={{ fontSize: '0.8rem', color: textColor, background: badgeColor, border: `1px solid ${textColor}44`, padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                                 {status}
                               </span>
                             </div>

                             {(threat || attitude) && (
                               <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', marginTop: '2px' }}>
                                 {threat && (
                                   <span style={{ color: threat.includes('위험') || threat.includes('치명') ? '#f87171' : threat.includes('안전') ? '#4ade80' : '#fbbf24', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '3px' }}>
                                     ⚠️ 위협도: {threat}
                                   </span>
                                 )}
                                 {attitude && (
                                   <span style={{ color: attitude.includes('우호') ? '#38bdf8' : attitude.includes('적대') ? '#f87171' : '#e2e8f0', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '3px' }}>
                                     👁️ 태도: {attitude}
                                   </span>
                                 )}
                               </div>
                             )}
                           </div>
                         );
                       }
                       return <div key={idx} style={{ fontSize: '0.9rem', color: 'var(--text-main)', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '4px' }}>• {rel}</div>;
                     })}
                   </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '10px' }}>주요 관계 정보 없음</div>
          )}
        </Accordion>

        <Accordion title="【 가문 및 계승 현황 】">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--text-main)', fontSize: '0.95rem' }}>
            {gameState.familyState ? (
              <>
                <div style={{ display: 'flex' }}><strong style={{ width: '90px', color: 'var(--gold-accent)' }}>[배우자]</strong> <span style={{ flex: 1, color: 'var(--text-muted)' }}>{gameState.familyState.spouse || '없음'}</span></div>
                <div style={{ display: 'flex' }}><strong style={{ width: '90px', color: 'var(--gold-accent)' }}>[자녀]</strong> <span style={{ flex: 1, color: 'var(--text-muted)' }}>{gameState.familyState.children || '없음'}</span></div>
                <div style={{ display: 'flex' }}><strong style={{ width: '90px', color: 'var(--gold-accent)' }}>[계승법]</strong> <span style={{ flex: 1, color: 'var(--text-muted)' }}>{gameState.familyState.successionLaw || '미정'}</span></div>
                <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px', marginTop: '5px' }}>
                  <strong style={{ width: '90px', color: 'var(--success)' }}>[후계자]</strong> <span style={{ flex: 1, fontWeight: 'bold' }}>{gameState.familyState.heir || '미정'}</span>
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>가문 및 계승 정보가 아직 초기화되지 않았습니다.</div>
            )}
          </div>
        </Accordion>
          </div>
        )}

        {activeTab === 'objective' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {gameState.objective && (
          <Accordion title="【 현재 국면 및 상황 】">
            <div style={{ marginBottom: '16px' }}>
              <span style={{ color: 'var(--gold-accent)', fontSize: '0.85rem', fontWeight: 'bold' }}>[현재 주요 국면]</span> 
              <div style={{ color: 'var(--text-main)', fontWeight: 'bold', marginTop: '4px', paddingLeft: '8px', borderLeft: '3px solid var(--gold-accent)', lineHeight: '1.4' }}>
                {gameState.objective.ultimateGoal}
              </div>
            </div>
            {gameState.objective.currentGoal && (
              <div style={{ marginBottom: '16px' }}>
                <span style={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: 'bold' }}>[단기 야망]</span> 
                <div style={{ color: 'var(--text-main)', fontWeight: 'bold', marginTop: '4px', paddingLeft: '8px', borderLeft: '3px solid #38bdf8', lineHeight: '1.4' }}>
                  {gameState.objective.currentGoal}
                </div>
              </div>
            )}
            
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: 'var(--text-muted)' }}>상태: </span> 
              <span style={{ 
                padding: '4px 10px', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 'bold',
                background: gameState.objective.status.includes('달성') || gameState.objective.status.includes('충족') ? 'rgba(16,185,129,0.2)' : 
                            gameState.objective.status.includes('실패') || gameState.objective.status.includes('위기') ? 'rgba(239,68,68,0.2)' : 'rgba(212,175,55,0.2)',
                color: gameState.objective.status.includes('달성') || gameState.objective.status.includes('충족') ? 'var(--success)' : 
                       gameState.objective.status.includes('실패') || gameState.objective.status.includes('위기') ? 'var(--danger)' : 'var(--gold-hover)',
                border: `1px solid ${gameState.objective.status.includes('달성') || gameState.objective.status.includes('충족') ? 'var(--success)' : gameState.objective.status.includes('실패') || gameState.objective.status.includes('위기') ? 'var(--danger)' : 'var(--gold-accent)'}`
              }}>
                {gameState.objective.status}
              </span>
            </div>
            
            <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: '1.5', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
              {gameState.objective.summary}
            </div>
          </Accordion>
        )}

        <Accordion title={`📜 【 가문 역사 연대기 】 (${gameState.chronicle?.length || 0}건)`}>
          {gameState.chronicle && gameState.chronicle.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
              {gameState.chronicle.slice().reverse().map((item, idx) => (
                <div key={idx} style={{
                  padding: '10px 12px',
                  background: 'rgba(0, 0, 0, 0.35)',
                  borderLeft: `4px solid ${item.result?.includes('대성공') ? 'var(--success)' : item.result?.includes('성공') || item.result?.includes('시작') ? 'var(--gold-accent)' : 'var(--danger)'}`,
                  borderRadius: '4px',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  borderRight: '1px solid rgba(255,255,255,0.05)',
                  borderBottom: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--gold-accent)', fontWeight: 'bold' }}>턴 {item.turn} {item.dateLocation ? `| ${item.dateLocation.split('/')[0].trim()}` : ''}</span>
                    <span style={{ 
                      color: item.result?.includes('대성공') ? 'var(--success)' : item.result?.includes('성공') || item.result?.includes('시작') ? 'var(--gold-accent)' : 'var(--danger)',
                      fontWeight: 'bold',
                      fontSize: '0.85rem'
                    }}>
                      {item.result}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px' }}>
                    &ldquo;{item.action}&rdquo;
                  </div>
                  {item.summary && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                      {item.summary}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '10px' }}>
              아직 기록된 과거 연대기가 없습니다. 턴이 진행되면 결정적인 사건들이 이곳에 누적됩니다.
            </div>
          )}
        </Accordion>
          </div>
        )}

        {activeTab === 'estate' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* 🏰 영지 / 거점 통합 현황 대시보드 */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.95))',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              borderRadius: '10px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.6rem' }}>{gameState.estate ? '🏰' : '🏕️'}</span>
                  <div>
                    <div style={{ fontWeight: 'bold', color: 'var(--gold-accent)', fontSize: '1.1rem' }}>
                      {gameState.estate?.type || '임시 야영지'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      거점 규모: <strong style={{ color: '#60a5fa' }}>{gameState.estate?.level || 'Lv.1 초기 거점'}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '0.82rem',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: constructionQueue.length >= maxSlots ? 'rgba(239,68,68,0.2)' : 'rgba(56,189,248,0.15)',
                    color: constructionQueue.length >= maxSlots ? '#f87171' : '#38bdf8',
                    border: `1px solid ${constructionQueue.length >= maxSlots ? '#ef4444' : '#0284c7'}`,
                    fontWeight: 'bold',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    🔨 건설 슬롯: {constructionQueue.length} / {maxSlots}
                  </span>
                  <span style={{
                    fontSize: '0.82rem',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: 'rgba(212,175,55,0.15)',
                    color: 'var(--gold-hover)',
                    border: '1px solid rgba(212,175,55,0.4)',
                    fontWeight: 'bold',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    📜 직할령 한계: {gameState.estate?.buildings?.length || 0} / {domainLimit || 3}동
                  </span>
                </div>
              </div>

              {/* 거점 상주 가신 및 자문관 현황 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--gold-accent)', fontWeight: 'bold' }}>👥 거점 상주 가신 & 자문관 ({councilVassals.length}명)</span>
                  {councilVassals.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>인간관계의 주요 인물이 거점 직책을 맡습니다</span>}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {councilVassals.length > 0 ? (
                    councilVassals.map((v, i) => (
                      <span key={i} style={{
                        fontSize: '0.78rem',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: 'rgba(0,0,0,0.45)',
                        border: '1px solid rgba(212,175,55,0.3)',
                        color: 'var(--text-main)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <span style={{ color: 'var(--gold-accent)' }}>👑</span>
                        <strong>{v.name}</strong>
                        <span style={{ color: '#7dd3fc', fontSize: '0.72rem' }}>({v.role})</span>
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      아직 임명된 직속 가신이 없습니다. (인간관계에서 기사/집사장/사제 등 등용 시 연동)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Accordion title="【 거점 및 영지 시설 현황 】">
              {gameState.estate ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {gameState.estate.buildings.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {gameState.estate.buildings.map((b, idx) => {
                        const getTagStyle = (t: string) => {
                          if (t.includes('군사')) return { bg: 'rgba(239,68,68,0.2)', color: '#fca5a5', icon: '⚔️' };
                          if (t.includes('생산')) return { bg: 'rgba(16,185,129,0.2)', color: '#6ee7b7', icon: '🌾' };
                          if (t.includes('치안')) return { bg: 'rgba(2,132,199,0.2)', color: '#7dd3fc', icon: '🛡️' };
                          if (t.includes('행정')) return { bg: 'rgba(245,158,11,0.2)', color: '#fde047', icon: '📜' };
                          if (t.includes('신앙') || t.includes('문화')) return { bg: 'rgba(168,85,247,0.2)', color: '#d8b4fe', icon: '⛪' };
                          if (t.includes('민생')) return { bg: 'rgba(20,184,166,0.2)', color: '#5eead4', icon: '🏡' };
                          return { bg: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)', icon: '🏛️' };
                        };

                        return (
                          <div key={idx} style={{ background: 'rgba(0,0,0,0.35)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                              <span style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                                🏛️ {b.name} <span style={{fontSize: '0.8rem', color: '#60a5fa', fontWeight: 'bold'}}>Lv.{b.level}</span>
                              </span>
                              {b.tags && b.tags.length > 0 && (
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                  {b.tags.map((t, ti) => {
                                    const st = getTagStyle(t);
                                    return (
                                      <span key={ti} style={{ fontSize: '0.72rem', background: st.bg, color: st.color, border: `1px solid ${st.color}33`, padding: '1px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                        <span>{st.icon}</span> {t}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            {b.desc && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{b.desc}</span>}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>아직 지어진 시설이 없습니다.</div>
                  )}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  현재 보유한 거점이나 영지가 없습니다. 야영지 등의 거점을 먼저 건설하면 이곳에 표시됩니다.
                </div>
              )}
            </Accordion>
            {constructionNotice && (
              <div style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid var(--gold-accent)', color: 'var(--gold-hover)', padding: '10px 12px', borderRadius: '6px', fontSize: '0.9rem', lineHeight: '1.4' }}>
                🔔 {constructionNotice}
              </div>
            )}
            <Accordion title={`〖 건설 가능 시설 · 병렬 슬롯 ${constructionQueue.length}/${maxSlots} 〗`}>
              {(gameState.buildOptions && gameState.buildOptions.length > 0) || promotionOption || derivedUpgradeOptions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {promotionOption && (
                    <div style={{ background: 'rgba(212,175,55,0.1)', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(212,175,55,0.4)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ color: 'var(--gold-accent)', fontSize: '0.95rem' }}>⭐ {promotionOption.name}</strong>
                        <button className={styles.actionBtn} style={{ padding: '4px 10px', fontSize: '0.8rem', opacity: loading || constructionQueue.length >= maxSlots ? 0.5 : 1 }} disabled={loading || constructionQueue.length >= maxSlots} onClick={() => handleOrderBuild(promotionOption)}>착수</button>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>소요: {promotionOption.turns}턴 | 비용: {promotionOption.cost}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{promotionOption.desc}</div>
                    </div>
                  )}
                  {derivedUpgradeOptions.map((opt, idx) => {
                    const already = constructionQueue.some(q => sameBuildingName(q.building, opt.name));
                    const full = constructionQueue.length >= maxSlots;
                    const disabled = loading || already || full;
                    return (
                      <div key={'upg-'+idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ color: '#38bdf8', fontSize: '0.95rem' }}>⬆ {opt.name}</strong>
                          <button className={styles.actionBtn} style={{ padding: '4px 10px', fontSize: '0.8rem', opacity: disabled ? 0.5 : 1 }} disabled={disabled} onClick={() => handleOrderBuild(opt)}>{already ? '대기 중' : '착수'}</button>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>소요: {opt.turns}턴 | 비용: {opt.cost}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{opt.desc}</div>
                      </div>
                    );
                  })}
                  {gameState.buildOptions && gameState.buildOptions.map((opt, idx) => {
                    const already = constructionQueue.some(q => sameBuildingName(q.building, opt.name));
                    const full = constructionQueue.length >= maxSlots;
                    const disabled = loading || already || full;
                    return (
                      <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.95rem' }}>{opt.name}</span>
                          <span style={{ color: '#38bdf8', fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>⏱ {opt.turns}턴</span>
                        </div>
                        {opt.cost && <span style={{ fontSize: '0.85rem', color: 'var(--gold-hover)' }}>💰 {opt.cost}</span>}
                        {opt.desc && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{opt.desc}</span>}
                        <button
                          disabled={disabled}
                          onClick={() => handleOrderBuild(opt)}
                          style={{ marginTop: '4px', padding: '8px', fontSize: '0.85rem', fontWeight: 'bold', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, background: disabled ? 'rgba(0,0,0,0.3)' : 'var(--gold-accent)', color: disabled ? 'var(--text-muted)' : '#000', transition: 'all 0.2s' }}
                        >
                          {already ? '🔨 공사 중' : full ? '슬롯 가득 참' : '🏗️ 건설 지시'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', lineHeight: '1.5', fontSize: '0.9rem' }}>
                  현재 제안된 건설 후보가 없습니다. 이야기를 진행하면 상황에 맞는 시설이 제안됩니다.
                </div>
              )}
            </Accordion>
            {constructionQueue.length > 0 && (
              <Accordion title="【 건설 진행 현황 】">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {constructionQueue.map((q) => (
                    <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                        <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>🔨 {q.building}</span>
                        <span style={{ color: '#38bdf8', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          {q.commandSent ? `${turnsLeft(q, turn)}턴 남음` : `${q.completeTurn - q.startTurn}턴 소요 · 다음 행동 때 비용 차감`}
                        </span>
                      </div>
                      {!q.commandSent && (
                        <button onClick={() => handleCancelBuild(q.id)} disabled={loading} style={{ padding: '6px 10px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid rgba(239,68,68,0.5)', background: 'rgba(239,68,68,0.15)', color: '#fca5a5', cursor: 'pointer', whiteSpace: 'nowrap' }}>취소</button>
                      )}
                    </div>
                  ))}
                </div>
              </Accordion>
            )}

          </div>
        )}

        {activeTab === 'inventory' && gameState.inventory && (Object.keys(gameState.inventory).length > 0) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <Accordion title="【 소지품 및 자원 】">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {Object.entries(gameState.inventory).map(([category, items]) => {
                if (!items || (items as string[]).length === 0) return null;
                const catName = category === 'equipment' ? '장비 및 영지' : category === 'wealth' ? '재산 및 병력' : category;
                const catIcon = category === 'equipment' ? '📦' : '💰';

                return (
                  <div key={category}>
                    <div style={{ color: 'var(--gold-accent)', fontSize: '0.9rem', marginBottom: '8px', borderBottom: '1px solid rgba(255,215,0,0.2)', paddingBottom: '4px' }}>{catIcon} {catName}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(items as string[]).map((item, idx) => {
                        const match = item.match(/\[(.*?)\]\s*(.*)/);
                        if (match) {
                          const name = match[1].trim();
                          const desc = match[2].trim();
                          return (
                             <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                               <span style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.95rem' }}>{name}</span>
                               <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{desc}</span>
                             </div>
                          );
                        }
                        return <div key={idx} style={{ fontSize: '0.9rem', color: 'var(--text-main)', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '4px' }}>• {item}</div>;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Accordion>
          </div>
        )}

            </div>
          </div>
        </div>
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

