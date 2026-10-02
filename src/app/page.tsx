"use client";

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import { ParsedState } from '@/lib/parser';

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

export default function Home() {
  const [gameState, setGameState] = useState<ParsedState | null>(null);
  const [loading, setLoading] = useState(false);
  const [freeAction, setFreeAction] = useState("");
  const [hasAutoSave, setHasAutoSave] = useState(false);

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
      localStorage.setItem("ck_auto_save", JSON.stringify(gameState));
    }
  }, [gameState, loading]);

  const handleAutoLoad = () => {
    const saveStr = localStorage.getItem("ck_auto_save");
    if (saveStr) {
      try {
        setGameState(JSON.parse(saveStr));
      } catch (err) {
        alert("자동 저장 데이터를 불러오지 못했습니다.");
      }
    }
  };

  const handleInitialStart = async (config: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: config, 
          isInitialSetup: true,
          currentState: null,
          apiKey: localStorage.getItem('ck_api_key') || ''
        })
      });
      const data = await response.json();
      if (data.parsed) {
        setGameState(data.parsed);
      } else if (data.error) {
        alert("API 에러: " + data.error);
        if (data.error.includes("키가 제공되지 않았습니다")) window.location.href = '/startup';
      } else {
        alert("시작 설정 파싱에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("서버 통신 오류가 발생했습니다.");
    }
    setLoading(false);
  };

  const handleAction = async (actionText: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: actionText, 
          currentState: gameState, // JSON Save System
          apiKey: localStorage.getItem('ck_api_key') || ''
        })
      });
      const data = await response.json();
      if (data.parsed) {
        setGameState(prevState => {
          if (!prevState) return data.parsed;
          return {
            ...prevState,
            ...data.parsed,
            // AI가 블록 통째로 누락(환각) 시 이전 상태 유지하는 안전장치
            objective: data.parsed.objective || prevState.objective,
            inventory: data.parsed.inventory || prevState.inventory,
            traits: data.parsed.traits || prevState.traits,
            stats: {
              innate: mergeObject(prevState.stats?.innate, data.parsed.stats?.innate),
              acquired: mergeObject(prevState.stats?.acquired, data.parsed.stats?.acquired)
            },
            personalInfo: mergeObject(prevState.personalInfo, data.parsed.personalInfo),
            factionState: data.parsed.factionState?.none ? { none: "true" } : mergeObject(prevState.factionState, data.parsed.factionState),
            relationships: data.parsed.relationships || prevState.relationships,
            playerStatus: data.parsed.playerStatus || prevState.playerStatus,
            familyState: data.parsed.familyState || prevState.familyState
          };
        });
      } else if (data.error) {
        alert("API 에러: " + data.error);
        if (data.error.includes("키가 제공되지 않았습니다")) window.location.href = '/startup';
      } else {
        alert("파싱에 실패했습니다. AI가 포맷을 어겼을 수 있습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("서버 통신 오류가 발생했습니다.");
    }
    setLoading(false);
  };

  const handleSave = () => {
    if (!gameState) return;
    const jsonStr = JSON.stringify(gameState, null, 2);
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
      localStorage.setItem("ck_auto_save", JSON.stringify(gameState));
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
        setGameState(loadedState);
        alert("성공적으로 세계를 불러왔습니다!");
      } catch (err) {
        alert("잘못된 세이브 파일입니다.");
      }
    };
    reader.readAsText(file);
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
        <div className={styles.statusInfo} style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
          <span>{gameState.dateLocation || "날짜/위치 알 수 없음"}</span>
          <button className={styles.actionBtn} style={{padding: '6px 12px', fontSize: '0.9rem', background: 'var(--panel-bg)', color: 'var(--text-main)'}} onClick={handleReturnToTitle}>🏠 메인 타이틀로</button>
          <button className={styles.actionBtn} style={{padding: '6px 12px', fontSize: '0.9rem'}} onClick={handleSave}>저장하기</button>
          <label className={styles.actionBtn} style={{padding: '6px 12px', fontSize: '0.9rem', cursor: 'pointer'}}>
            불러오기
            <input type="file" accept=".json" onChange={handleLoad} style={{display: 'none'}} />
          </label>
        </div>
      </header>
      {/* Left Panel */}
      <aside className={`glass-panel ${styles.leftPanel}`}>
        {gameState.personalInfo && (
          <Accordion title="【 개인 정보 】">
            {Object.entries(gameState.personalInfo).map(([key, value]) => (
              <div className={styles.statRow} key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ flexShrink: 0, marginRight: '10px' }}>{key}</span>
                <span className={styles.statValue} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }} title={value as string}>{value as string}</span>
              </div>
            ))}
          </Accordion>
        )}

        {gameState.playerStatus && (
          <Accordion title="【 플레이어 상태 】">
            {gameState.playerStatus.map((status, idx) => (
              <div className={styles.statRow} key={idx} title={`${status.description}\n(위험도: ${status.risk})`} style={{marginBottom: '8px', cursor: 'help', display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{ fontSize: '1.1rem' }}>{getStatusIcon(status.name)}</span>
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{status.name}</span>
                <span className={styles.statValue} style={{
                  color: status.risk.includes('위험') ? 'var(--danger)' : 
                         status.risk.includes('주의') ? '#ffa64d' : 'var(--gold-accent)',
                  fontWeight: status.risk.includes('위험') ? 'bold' : 'normal',
                  animation: status.risk.includes('위험') ? 'pulse 1.5s infinite' : 'none',
                  whiteSpace: 'nowrap'
                }}>
                  {status.value}
                </span>
              </div>
            ))}
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
      </aside>

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
            <div className={styles.narrativeArea}>
              {loading ? (
                 <p className={styles.narrativeText} style={{textAlign: 'center', marginTop: '50px', color: 'var(--gold-accent)'}}>
                   AI가 행동의 인과율을 판정하고 있습니다.<br/>잠시만 기다려주세요...
                 </p>
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
          </>
        )}
      </section>

      {/* Right Panel */}
      <aside className={`glass-panel ${styles.rightPanel}`}>
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
                       const parts = rel.split('-');
                       if (parts.length >= 2) {
                         const name = parts[0].replace(/^[○•\s]+/, '').trim();
                         const status = parts.slice(1).join('-').trim();
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

        {gameState.objective && (
          <Accordion title="【 목표 현황 】">
            <div style={{ marginBottom: '16px' }}>
              <span style={{ color: 'var(--gold-accent)', fontSize: '0.85rem', fontWeight: 'bold' }}>[궁극적 목표]</span> 
              <div style={{ color: 'var(--text-main)', fontWeight: 'bold', marginTop: '4px', paddingLeft: '8px', borderLeft: '3px solid var(--gold-accent)', lineHeight: '1.4' }}>
                {gameState.objective.ultimateGoal}
              </div>
            </div>
            {gameState.objective.currentGoal && (
              <div style={{ marginBottom: '16px' }}>
                <span style={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: 'bold' }}>[현재 단기 목표]</span> 
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
            
            <div style={{ marginBottom: '16px' }}>
              {(() => {
                const totalStr = gameState.objective.totalProgress || '';
                const totalProgress = Math.min(100, Math.max(0, parseInt(totalStr.replace(/[^0-9]/g, '') || '0', 10)));
                const currentStr = gameState.objective.currentProgress || '';
                const currentProgress = Math.min(100, Math.max(0, parseInt(currentStr.replace(/[^0-9]/g, '') || '0', 10)));
                
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {gameState.objective.currentGoal && (
                      <div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                           <span>단기 목표 달성률</span>
                           <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{currentProgress}%</span>
                         </div>
                         <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.4)', borderRadius: '4px', overflow: 'hidden' }}>
                           <div style={{ width: `${currentProgress}%`, height: '100%', background: 'linear-gradient(90deg, rgba(56,189,248,0.5) 0%, #38bdf8 100%)', transition: 'width 1s ease-in-out' }} />
                         </div>
                      </div>
                    )}
                    <div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                         <span>전체 진행도 (궁극적 목표)</span>
                         <span style={{ color: 'var(--gold-hover)', fontWeight: 'bold' }}>{totalProgress}%</span>
                       </div>
                       <div style={{ width: '100%', height: '10px', background: 'rgba(0,0,0,0.4)', borderRadius: '5px', overflow: 'hidden', border: '1px solid var(--panel-border)' }}>
                         <div style={{ width: `${totalProgress}%`, height: '100%', background: 'linear-gradient(90deg, rgba(212,175,55,0.5) 0%, var(--gold-accent) 100%)', transition: 'width 1s ease-in-out' }} />
                       </div>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: '1.5', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
              {gameState.objective.summary}
            </div>
          </Accordion>
        )}

        {gameState.inventory && (Object.keys(gameState.inventory).length > 0) && (
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
        )}
      </aside>
    </main>
  );
}
