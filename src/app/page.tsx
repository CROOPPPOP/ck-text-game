"use client";

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import { checkPromotion, getUpgradeCandidates } from '@/lib/estate';
import { ParsedState, ChronicleItem, parseLLMResponse } from '@/lib/parser';
import { QueueItem, BuildOption, parseTurnNumber, getMaxSlots, createQueueItem, turnsLeft, normalizeQueue, summarizeQueue, buildSystemCommands, applyTurnResult, sameBuildingName } from '@/lib/construction';

const TypewriterText = ({ text, delay = 20 }: { text: string; delay?: number }) => {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentText('');
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
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
  const [activeModal, setActiveModal] = useState<'character' | 'rightPanel' | null>(null);
  const [constructionQueue, setConstructionQueue] = useState<QueueItem[]>([]);
  const [turn, setTurn] = useState(0);
  const [constructionNotice, setConstructionNotice] = useState('');

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

  const handleAction = async (actionText: string) => {
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
               (r: string) => r.split('|')[0].trim()
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

  // 투트랙 건설: 슬롯 한도 및 건설 지시
  const maxSlots = getMaxSlots(gameState?.estate);

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
            <div style={{width: '100%', borderTop: '1px solid var(--panel-border)', paddingTop: '30px', marginTop: '10px'}}>
              <p style={{color: 'var(--text-muted)', marginBottom: '15px'}}>진행 중이던 세계가 있다면</p>
              <label className={styles.actionBtn} style={{display: 'block', width: '100%', padding: '20px', fontSize: '1.3rem', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)'}}>
                세이브 파일 (.json) 불러오기
                <input type="file" accept=".json" onChange={handleLoad} style={{display: 'none'}} />
              </label>
            </div>
            
            <div style={{width: '100%', marginTop: '20px'}}>
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
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <header className={`glass-panel ${styles.header}`}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo.jpg" alt="CHRONICLES" style={{ height: '40px', borderRadius: '4px', border: '1px solid var(--gold-accent)' }} />
        </div>
        <div className={styles.statusInfo} style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '5px 12px', borderRadius: '20px', border: '1px solid var(--panel-border)' }}>
            <span style={{ color: 'var(--gold-accent)' }}>📅</span>
            <span style={{ color: 'var(--text-main)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }} title={(gameState.dateLocation || "").replace(/\[턴 수:.*\]/, "").trim()}>
              {(gameState.dateLocation || "").replace(/\[턴 수:.*\]/, "").trim() || "날짜/위치 알 수 없음"}
            </span>
          </div>
          {((gameState.dateLocation || "").match(/\[턴 수:\s*(\d+)\]/) || [])[1] && (
             <div style={{ background: 'var(--gold-accent)', color: '#121212', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem' }}>
               TURN {((gameState.dateLocation || "").match(/\[턴 수:\s*(\d+)\]/) || [])[1]}
             </div>
          )}
          <button className={styles.actionBtn} style={{padding: '6px 12px', fontSize: '0.9rem', background: 'var(--panel-bg)', color: 'var(--text-main)'}} onClick={handleReturnToTitle}>🏠 메인 타이틀로</button>
          <button className={styles.actionBtn} style={{padding: '6px 12px', fontSize: '0.9rem'}} onClick={handleSave}>저장하기</button>
          <label className={styles.actionBtn} style={{padding: '6px 12px', fontSize: '0.9rem', cursor: 'pointer'}}>
            불러오기
            <input type="file" accept=".json" onChange={handleLoad} style={{display: 'none'}} />
          </label>
        </div>
      </header>
      {/* Left Panel */}
      

      {/* Center Panel */}
      <section className={`glass-panel ${styles.centerPanel}`}>
      <div className={styles.navBar}>
        <button className={styles.navBtn} onClick={() => setActiveModal('character')}>👤 캐릭터 정보</button>
        <button className={styles.navBtn} onClick={() => { setActiveTab('inventory'); setActiveModal('rightPanel'); }}>🎒 자원/세력</button>
        <button className={styles.navBtn} onClick={() => { setActiveTab('relations'); setActiveModal('rightPanel'); }}>🤝 인간관계</button>
        <button className={styles.navBtn} onClick={() => { setActiveTab('estate'); setActiveModal('rightPanel'); }}>🏕️ 거점/영지</button>
        <button className={styles.navBtn} onClick={() => { setActiveTab('objective'); setActiveModal('rightPanel'); }}>📜 로그/상황</button>
      </div>

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
                  <div className={styles.narrativeText} style={{ position: 'relative' }}>
                    <strong style={{color: 'var(--gold-accent)'}}>【 현재 상황 】</strong>
                    {gameState.historicalTag && (
                      <span style={{
                        position: 'absolute', top: 0, right: 0,
                        padding: '4px 12px', border: '2px solid', borderRadius: '4px',
                        fontWeight: 'bold', fontSize: '0.85rem', transform: 'rotate(2deg)',
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
                    <br/><br/>
                    <TypewriterText text={gameState.narrative || ""} delay={15} />
                  </div>
                </>
              )}
            </div>

            {gameState.ending && (
              <div style={{ marginTop: '30px', padding: '30px', background: 'rgba(239,68,68,0.2)', border: '2px solid var(--danger)', borderRadius: '8px', textAlign: 'center' }}>
                <h2 style={{ color: 'var(--danger)', fontSize: '2rem', marginBottom: '20px' }}>【 시뮬레이션 종료 】</h2>
                <div style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '30px', lineHeight: '1.6' }}>
                  <TypewriterText text={gameState.ending} delay={15} />
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
                      style={{ background: theme.bg, border: `1px solid ${theme.border}` }}
                      onClick={() => handleAction(choice.text)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.2rem' }}>{theme.icon}</span>
                        <span>{choice.id}. [{choice.type}] {choice.text}</span>
                      </div>
                      {choice.probability && <span className={styles.choiceProbability}>{choice.probability}</span>}
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
      
    
      {activeModal && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
              <button onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '2rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>
            {activeModal === 'character' && (
              <div>
                <h2 style={{color: 'var(--gold-accent)', marginBottom: '20px', textAlign: 'center'}}>👤 캐릭터 정보</h2>
                
        {gameState.personalInfo && (
          <Accordion title="【 개인 정보 】">
            {Object.entries(gameState.personalInfo).map(([key, value]) => (
              <div className={styles.statRow} key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...(key === '칭호' ? { background: 'rgba(212,175,55,0.1)', padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(212,175,55,0.4)', margin: '4px 0' } : {}) }}>
                <span style={{ flexShrink: 0, marginRight: '10px', ...(key === '칭호' ? { color: 'var(--gold-accent)', fontWeight: 'bold' } : {}) }}>{key === '칭호' ? '👑 칭호' : key}</span>
                <span className={styles.statValue} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right', ...(key === '칭호' ? { color: 'var(--gold-accent)', fontWeight: 'bold', textShadow: '0 0 8px rgba(212,175,55,0.6)' } : {}) }} title={value as string}>{value as string}</span>
              </div>
            ))}
          </Accordion>
        )}

        {gameState.playerStatus && (
          <Accordion title="【 플레이어 상태 】">
            {gameState.playerStatus.map((status, idx) => {
              const isDanger = status.risk.includes('위험') && !status.risk.includes('안전') && !status.risk.includes('주의');
              const isWarning = status.risk.includes('주의');
              return (
              <div className={styles.statRow} key={idx} title={`${status.description}\n(위험도: ${status.risk})`} style={{marginBottom: '8px', cursor: 'help', display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{ fontSize: '1.1rem' }}>{getStatusIcon(status.name)}</span>
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{status.name}</span>
                <span className={styles.statValue} style={{
                  color: isDanger ? 'var(--danger)' : isWarning ? '#ffa64d' : 'var(--gold-accent)',
                  fontWeight: isDanger ? 'bold' : 'normal',
                  animation: isDanger ? 'pulse 1.5s infinite' : 'none',
                  whiteSpace: 'nowrap'
                }}>
                  {status.value}
                </span>
              </div>
              );
            })}
          </Accordion>
        )}

        
        {gameState.stats && (Object.keys(gameState.stats.innate || {}).length > 0 || Object.keys(gameState.stats.acquired || {}).length > 0) && (
          <Accordion title="【 개인 능력치 】">
            {gameState.stats.innate && Object.keys(gameState.stats.innate).length > 0 && (
              <div style={{ marginBottom: '15px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px', paddingBottom: '3px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>[선천 능력치]</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {Object.entries(gameState.stats.innate).map(([key, value]) => (
                    <div className={styles.statRow} key={key} style={{ marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ flexShrink: 0 }}>{key}</span>
                      <span className={styles.statValue} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><StatValue value={value as string} /></span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {gameState.stats.acquired && Object.keys(gameState.stats.acquired).length > 0 && (
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px', paddingBottom: '3px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>[후천 능력치]</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {Object.entries(gameState.stats.acquired).map(([key, value]) => (
                    <div className={styles.statRow} key={key} style={{ marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ flexShrink: 0 }}>{key}</span>
                      <span className={styles.statValue} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><StatValue value={value as string} /></span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Accordion>
        )}
        
        {gameState.traits && gameState.traits.length > 0 && (
          <Accordion title="【 특성 및 기술 】">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {gameState.traits.map((trait, idx) => {
                const style = getTraitColor(trait.category);
                return (
                  <div key={idx} title={trait.description} style={{
                    padding: '6px 12px',
                    background: style.bg,
                    border: `1px solid ${style.border}`,
                    borderRadius: '6px',
                    color: style.color,
                    cursor: 'help',
                    animation: style.animation || 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    minWidth: '80px'
                  }}>
                    <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{getTraitIcon(trait.category)} {trait.category}</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 'bold', textAlign: 'center' }}>{trait.name}</span>
                    {trait.tier && (
                      <span style={{ 
                        fontSize: '0.75rem', 
                        marginTop: '2px', 
                        color: trait.tier.includes('강한') ? '#c084fc' : 
                               trait.tier.includes('확립된') ? '#fbbf24' : 
                               trait.tier.includes('잠재') ? '#94a3b8' : 
                               trait.tier.includes('반복') ? '#d97706' : '#64748b',
                        fontWeight: 'bold',
                        textShadow: trait.tier.includes('강한') || trait.tier.includes('확립된') ? '0 0 5px currentColor' : 'none'
                      }}>
                        {trait.tier.includes('강한') ? '★★★✨' : trait.tier.includes('확립된') ? '★★★' : trait.tier.includes('잠재') ? '★★' : trait.tier.includes('반복') ? '★' : '☆'} {trait.tier}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </Accordion>
        )}
      
              </div>
            )}
            {activeModal === 'rightPanel' && (
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
                   <div style={{ color: 'var(--gold-accent)', fontSize: '0.9rem', marginBottom: '8px', borderBottom: '1px solid rgba(255,215,0,0.2)', paddingBottom: '4px' }}>👥 인간 관계</div>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     {gameState.relationships.personal.map((rel, idx) => {
                       const parts = rel.split('|').map(p => p.trim());
                       if (parts.length >= 4) {
                         const name = parts[0];
                         const trustStr = parts[1];
                         const affStr = parts[2];
                         const descStr = parts.slice(3).join(' | ').replace('관계:', '').trim();

                         const trustMatch = trustStr.match(/(\d+)/);
                         const affMatch = affStr.match(/(\d+)/);
                         
                         const trustVal = trustMatch ? Math.min(100, Math.max(0, parseInt(trustMatch[1]))) : 0;
                         const affVal = affMatch ? Math.min(100, Math.max(0, parseInt(affMatch[1]))) : 0;
                         
                         const isRomance = affStr.includes('애정도');
                         
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

                         if (isObsessive) {
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
                         
                         return (
                           <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', border: isObsessive ? '1px solid #86198f' : '1px solid transparent', animation: isObsessive ? 'pulse 2s infinite' : 'none' }}>
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '4px' }}>
                               <span style={{ color: 'var(--gold-accent)', fontWeight: 'bold', fontSize: '0.95rem', textShadow: isCompanion || isSwornFriend || isExtremeLove || isObsessive ? '0 0 8px rgba(212,175,55,0.6)' : 'none' }}>{name}</span>
                               <span style={{ fontSize: '0.85rem', color: isObsessive ? '#fbcfe8' : 'var(--text-muted)', lineHeight: '1.4' }}>{descStr}</span>
                             </div>
                             
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: textColorTrust, fontWeight: isCompanion ? 'bold' : 'normal', textShadow: currentTrustGlow }}>
                                 <span>{trustStr.replace(/\d+/, '').replace('-', '').trim()}</span>
                                 <span>{trustVal}%</span>
                               </div>
                               <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', boxShadow: currentTrustGlow }}>
                                 <div style={{ width: `${trustVal}%`, height: '100%', background: currentTrustColor }} />
                               </div>
                             </div>

                             <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: textColorAff, fontWeight: isExtremeLove || isObsessive || isSwornFriend ? 'bold' : 'normal', textShadow: currentAffGlow }}>
                                 <span>{affStr.replace(/\d+/, '').replace('-', '').trim()}</span>
                                 <span>{affVal}%</span>
                               </div>
                               <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', boxShadow: currentAffGlow }}>
                                 <div style={{ width: `${affVal}%`, height: '100%', background: currentAffColor }} />
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
                   <div style={{ color: 'var(--gold-accent)', fontSize: '0.9rem', marginBottom: '8px', borderBottom: '1px solid rgba(255,215,0,0.2)', paddingBottom: '4px' }}>🛡️ 세력 관계</div>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     {gameState.relationships.faction.map((rel, idx) => {
                       const match = rel.match(/^(.*?)\s+-\s+(.*)$/);
                       if (match) {
                         const name = match[1].replace(/^[○•\s]+/, '').trim();
                         const status = match[2].trim();
                         let badgeColor = 'rgba(255,255,255,0.1)';
                         let textColor = 'var(--text-muted)';
                         if (status.includes('동맹') || status.includes('우호')) { badgeColor = 'rgba(56,189,248,0.2)'; textColor = '#38bdf8'; }
                         else if (status.includes('적대') || status.includes('교전')) { badgeColor = 'rgba(239,68,68,0.2)'; textColor = '#ef4444'; }
                         else if (status.includes('정전') || status.includes('중립') || status.includes('의심')) { badgeColor = 'rgba(251,191,36,0.2)'; textColor = '#fbbf24'; }
                         
                         return (
                           <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                             <span style={{ fontWeight: 'bold', color: 'var(--gold-accent)', fontSize: '0.95rem', lineHeight: '1.4' }}>🛡️ {name}</span>
                             <div>
                               <span style={{ fontSize: '0.85rem', color: textColor, background: badgeColor, padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>{status}</span>
                             </div>
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
            <Accordion title="【 거점 및 영지 현황 】">
              {gameState.estate ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '10px 12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'var(--gold-accent)', fontSize: '0.85rem', fontWeight: 'bold' }}>거점 형태</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{gameState.estate.type}</span>
                  </div>
                  {gameState.estate.level && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '10px 12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: 'var(--gold-accent)', fontSize: '0.85rem', fontWeight: 'bold' }}>거점 규모</span>
                      <span style={{ color: 'var(--text-main)' }}>{gameState.estate.level}</span>
                    </div>
                  )}
                  {gameState.estate.buildings.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ color: 'var(--gold-accent)', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,215,0,0.2)', paddingBottom: '4px' }}>주요 시설 및 건물</div>
                      {gameState.estate.buildings.map((b, idx) => (
                        <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.95rem' }}>{b.name} <span style={{fontSize: '0.8rem', color: '#60a5fa'}}>Lv.{b.level}</span></span>
                            {b.tags && b.tags.length > 0 && (
                              <span style={{ fontSize: '0.75rem', background: 'rgba(96,165,250,0.2)', color: '#93c5fd', padding: '2px 6px', borderRadius: '4px' }}>{b.tags.join('·')}</span>
                            )}
                          </div>
                          {b.desc && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{b.desc}</span>}
                        </div>
                      ))}
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
            )}
          </div>
        </div>
      )}

    </main>
  );
}

