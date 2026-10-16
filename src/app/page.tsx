"use client";

import React, { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import { ParsedState, ChronicleItem, parseLLMResponse } from '@/lib/parser';
import { 
  QueueItem, 
  summarizeQueue, 
  tickConstructionQueue, 
  applyCompletedBuildingToEstate,
  turnsLeft
} from '@/lib/construction';
import { 
  GameDate, 
  GameSpeed, 
  advanceGameTime, 
  formatCleanDate, 
  formatDateLocation, 
  parseDateLocation 
} from '@/lib/engine/timeEngine';
import { rollMonthlyEvent } from '@/lib/engine/events/eventRegistry';
import { processTurn } from '@/lib/engine/simulationCore';
import { 
  pushUndoState, 
  popUndoState, 
  hasUndoState, 
  quickSave, 
  quickLoad, 
  loadUXSettings, 
  autoMigrateAndSanitizeStorage, 
  saveToSlot, 
  UserUXSettings 
} from '@/lib/saveManager';
import { extractNumericValue } from '@/lib/ckVisuals';
import { GenesisCardData, rollRandomBirth } from '@/lib/engine/genesisEngine';

import CKTopHud from '@/components/CKTopHud';
import GenesisModal from '@/components/GenesisModal';
import EpitaphModal from '@/components/EpitaphModal';
import CKCharacterModal from '@/components/CKCharacterModal';
import FamilyTreeModal from '@/components/FamilyTreeModal';
import CKRelationsModal from '@/components/CKRelationsModal';
import ChronicleModal from '@/components/ChronicleModal';
import CKSaveModal from '@/components/CKSaveModal';
import CKSettingsModal from '@/components/CKSettingsModal';
import CKApiKeyModal from '@/components/CKApiKeyModal';
import CKCharacterDialogueModal, { DialogueCharacter } from '@/components/CKCharacterDialogueModal';

import { 
  Hammer, Shield, Swords, Sparkles, Award, Heart, Activity, 
  Compass, Coins, User, Users, Castle, Flame, ArrowUpRight, 
  Clock, CheckCircle, Package, Feather
} from 'lucide-react';

const TypewriterText = ({ text, delay = 15 }: { text: string; delay?: number }) => {
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
        const step = text.length > 500 ? 3 : text.length > 200 ? 2 : 1;
        const nextIdx = Math.min(text.length, currentIndex + step);
        setCurrentText(text.slice(0, nextIdx));
        setCurrentIndex(nextIdx);
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, delay, text]);

  const handleSkip = () => {
    setCurrentText(text);
    setCurrentIndex(text.length);
  };

  return (
    <span 
      onClick={handleSkip} 
      title={currentIndex < text.length ? "클릭하여 전체 텍스트 즉시 표시" : undefined}
      style={{ cursor: currentIndex < text.length ? 'pointer' : 'text' }}
    >
      {currentText}
      {currentIndex < text.length && (
        <span style={{ 
          display: 'inline-block', 
          width: '7px', 
          height: '14px', 
          background: '#fbbf24', 
          marginLeft: '4px',
          verticalAlign: 'baseline',
          opacity: 0.8
        }} />
      )}
    </span>
  );
};

const getChoiceTheme = (groupType?: string, text?: string) => {
  if (text?.includes('[건설]') || text?.includes('[증축]') || text?.includes('축조')) {
    return { 
      bg: 'linear-gradient(135deg, rgba(35, 45, 30, 0.9), rgba(20, 30, 16, 0.95))', 
      border: '#10b981', 
      icon: '🔨',
      tagColor: '#34d399'
    };
  }
  if (groupType?.includes('전투') || groupType?.includes('군사') || text?.includes('소탕') || text?.includes('기습')) {
    return { 
      bg: 'linear-gradient(135deg, rgba(58, 20, 20, 0.9), rgba(35, 12, 12, 0.95))', 
      border: '#ef4444', 
      icon: '⚔️',
      tagColor: '#f87171'
    };
  }
  if (groupType?.includes('종교') || groupType?.includes('신앙') || text?.includes('수도') || text?.includes('성경')) {
    return { 
      bg: 'linear-gradient(135deg, rgba(25, 35, 55, 0.9), rgba(15, 20, 35, 0.95))', 
      border: '#3b82f6', 
      icon: '⛪',
      tagColor: '#60a5fa'
    };
  }
  if (groupType?.includes('외교') || groupType?.includes('정치') || text?.includes('혼인') || text?.includes('사절')) {
    return { 
      bg: 'linear-gradient(135deg, rgba(45, 32, 20, 0.9), rgba(25, 18, 12, 0.95))', 
      border: 'var(--gold-accent, #d4af37)', 
      icon: '📜',
      tagColor: '#fbbf24'
    };
  }
  return { 
    bg: 'linear-gradient(135deg, rgba(38, 28, 20, 0.88), rgba(22, 16, 11, 0.95))', 
    border: 'rgba(212, 175, 55, 0.35)', 
    icon: '💬',
    tagColor: '#d4af37'
  };
};

export default function Home() {
  const [gameState, setGameState] = useState<ParsedState | null>(null);
  const [loading, setLoading] = useState(false);
  const [streamPreview, setStreamPreview] = useState("");
  const [freeAction, setFreeAction] = useState("");
  const [constructionQueue, setConstructionQueue] = useState<QueueItem[]>([]);
  const [turn, setTurn] = useState(1);
  const [gameSpeed, setGameSpeed] = useState<GameSpeed>(1);
  const [isPaused, setIsPaused] = useState<boolean>(true);
  const [gameDate, setGameDate] = useState<GameDate>({ year: 1066, month: 10, day: 14, season: '가을' });
  const [monthProgressPercent, setMonthProgressPercent] = useState<number>(0);
  
  // Modals
  const [isGenesisModalOpen, setIsGenesisModalOpen] = useState(false);
  const [isEpitaphModalOpen, setIsEpitaphModalOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'character' | 'familyTree' | 'relations' | 'chronicle' | 'save' | 'settings' | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [activeDialogueCharacter, setActiveDialogueCharacter] = useState<DialogueCharacter | null>(null);

  // UX & System
  const [uxSettings, setUxSettings] = useState<UserUXSettings>(loadUXSettings());
  const [canUndo, setCanUndo] = useState(false);
  const [quickNotice, setQuickNotice] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');

  const lastTickTimeRef = useRef<number>(Date.now());
  const accumulatedSecRef = useRef<number>(0);

  // 1. 초기 로드 및 세이브 검사
  useEffect(() => {
    if (typeof window !== 'undefined') {
      autoMigrateAndSanitizeStorage();
      const savedKey = localStorage.getItem('ck_api_key') || '';
      setApiKey(savedKey);

      const savedStateRaw = localStorage.getItem('ck_auto_save');
      if (savedStateRaw) {
        try {
          const parsed = JSON.parse(savedStateRaw);
          if (parsed && (parsed.personalInfo || parsed.narrative)) {
            setGameState(parsed);
            if (parsed._turn) setTurn(parsed._turn);
            if (parsed._constructionQueue) setConstructionQueue(parsed._constructionQueue);
            if (parsed.dateLocation) {
              const parsedDate = parseDateLocation(parsed.dateLocation);
              setGameDate(parsedDate.date);
            }
            setCanUndo(hasUndoState());
            return;
          }
        } catch (e) {
          console.error("Auto save load error", e);
        }
      }
      // 세이브가 없으면 무작위 출생 모달 바로 개방
      setIsGenesisModalOpen(true);
    }
  }, []);

  const showQuickNotice = (msg: string) => {
    setQuickNotice(msg);
    setTimeout(() => setQuickNotice(null), 3200);
  };

  // 2. 무작위 출생 확정 (새 게임 시작)
  const handleGenesisConfirm = (cardData: GenesisCardData, initialState: ParsedState) => {
    setGameState(initialState);
    setTurn(1);
    setGameDate({ year: 1066, month: 10, day: 14, season: '가을' });
    setConstructionQueue([]);
    setIsGenesisModalOpen(false);
    setIsEpitaphModalOpen(false);
    setIsPaused(true);

    if (typeof window !== 'undefined') {
      localStorage.setItem('ck_auto_save', JSON.stringify({ ...initialState, _turn: 1, _constructionQueue: [] }));
    }
    showQuickNotice(`🎲 ${cardData.name} ${cardData.houseName} (${cardData.status})의 역사가 시작되었습니다!`);
  };

  // 3. 엔딩 및 사망 처리
  useEffect(() => {
    if (gameState?.ending) {
      setIsEpitaphModalOpen(true);
      setIsPaused(true);
    }
  }, [gameState?.ending]);

  // 4. 가문 계승 및 환생 핸들러
  const handleSuccession = () => {
    if (!gameState) return;
    const heirName = gameState.familyState?.heir || '가문의 후계자';
    const currentAge = parseInt(gameState.personalInfo?.['나이'] || '40', 10);
    const heirAge = Math.max(8, currentAge - 22);

    const inheritedState: ParsedState = {
      ...gameState,
      ending: undefined,
      personalInfo: {
        ...gameState.personalInfo,
        '이름': heirName,
        '나이': `${heirAge}`,
        '칭호': `${gameState.personalInfo?.['칭호'] || '영주'}`
      },
      playerStatus: [
        { name: '건강', value: '95', risk: '최상', description: '어린 후계자의 혈기' },
        { name: '체력', value: '90', risk: '최상', description: '생기 넘침' },
        { name: '통증', value: '0', risk: '안전', description: '외상 없음' },
        { name: '허기', value: '10', risk: '안전', description: '영양 충분' },
        { name: '갈증', value: '10', risk: '안전', description: '수분 충분' },
        { name: '피로', value: '10', risk: '안전', description: '활력 충분' },
        { name: '체온', value: '36.5', risk: '안전', description: '정상 체온' },
        { name: '스트레스', value: '25', risk: '보통', description: '선대의 급작스러운 서거로 인한 불안감' }
      ],
      familyState: {
        spouse: '미혼',
        children: '없음',
        heir: '방계 친척',
        successionLaw: gameState.familyState?.successionLaw || '남계 분할 상속제'
      },
      narrative: `선대 영주 ${gameState.personalInfo?.['이름']}의 영결식이 엄숙히 거행되었습니다.
향년 ${currentAge}세를 일기로 서거한 선대의 유해는 가문의 지하 묘소에 안치되었습니다.
이제 열 살 남짓한 어린 후계자 ${heirName}(${heirAge}세)이(가) 눈물을 훔치며 가문의 인장 반지를 이어받았습니다.
가신들과 성채의 기사들이 무릎을 꿇고 충성을 맹세하지만, 국경 너머 적대 세력들은 어린 군주의 등극을 틈타 침략의 기회를 엿보고 있습니다.
가문의 운명이 당신의 어깨 위에 내려앉았습니다.`,
      choices: [
        {
          id: '1',
          type: '가신 결속',
          groupType: '내정·가신',
          text: '선대의 충신들에게 작위와 영지를 재확인하며 내부 결속을 다진다.',
          probability: '가신 충성도 상승, 반란 억제'
        },
        {
          id: '2',
          type: '건설·방비',
          groupType: '영지 경영',
          text: '[건설] 어린 주군의 안전을 위해 성채 내실에 은밀한 비상 탈출로와 보루를 축조한다.',
          probability: '소요 2달 (암살 방어도 대폭 상승)'
        },
        {
          id: '3',
          type: '섭정 의지',
          groupType: '외교·정치',
          text: '가장 신뢰받는 원로 가신에게 섭정을 맡기고 국정 실무를 익힌다.',
          probability: '안정적인 계승기 통과'
        },
        {
          id: '4',
          type: '군사 훈련',
          groupType: '군사·기량',
          text: '나약한 모습을 보이지 않기 위해 연병장에서 기사들과 함께 맹훈련에 돌입한다.',
          probability: '기량 및 위신 상승'
        }
      ]
    };

    setGameState(inheritedState);
    setIsEpitaphModalOpen(false);
    setIsPaused(true);
    showQuickNotice(`👑 제2대 군주 ${heirName}(${heirAge}세)으로 가문이 계승되었습니다!`);
  };

  const handleReincarnation = () => {
    setIsEpitaphModalOpen(false);
    setIsGenesisModalOpen(true);
  };

  // 5. 실시간 틱 루프 (시간 전진, 건설 틱, 월간 이벤트)
  useEffect(() => {
    lastTickTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaMs = now - lastTickTimeRef.current;
      lastTickTimeRef.current = now;
      const deltaSec = deltaMs / 1000;

      // 일시정지, 모달 열림, 로딩, 엔딩 시 틱 중단
      if (isPaused || loading || !gameState || activeModal !== null || isGenesisModalOpen || isEpitaphModalOpen || gameState.ending) {
        return;
      }

      // 시간 전진
      const timeResult = advanceGameTime(gameDate, deltaSec, gameSpeed, accumulatedSecRef.current);
      accumulatedSecRef.current = timeResult.leftoverSeconds;
      setMonthProgressPercent(timeResult.monthProgressPercent);

      // 실시간 건설 틱
      const effectiveSec = deltaSec * gameSpeed;
      if (constructionQueue.length > 0) {
        const { updatedQueue, completedItems } = tickConstructionQueue(constructionQueue, effectiveSec);
        setConstructionQueue(updatedQueue);

        // 완공 처리
        if (completedItems.length > 0) {
          completedItems.forEach(item => {
            showQuickNotice(`🎉 [${item.building}] 공사가 성공적으로 완공되었습니다!`);
            setGameState(prev => {
              if (!prev) return prev;
              const nextEstate = applyCompletedBuildingToEstate(prev.estate, item);
              const loc = parseDateLocation(prev.dateLocation).location;
              const chronicleEntry: ChronicleItem = {
                turn,
                dateLocation: formatDateLocation(timeResult.newDate, loc),
                action: `시설 완공: ${item.building}`,
                result: '대성공',
                summary: `${item.building} 건물이 영지 인프라로 완공되어 주민들의 찬사를 받았습니다.`
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

      // 월이 넘어갔을 때
      if (timeResult.monthsAdvanced > 0) {
        setGameDate(timeResult.newDate);

        // 월간 역사 이벤트 확률 롤
        const rolledEvent = rollMonthlyEvent(gameState, turn, new Set());
        if (rolledEvent) {
          showQuickNotice(`📜 역사적 국면: [${rolledEvent.title}]`);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, loading, gameState, activeModal, isGenesisModalOpen, isEpitaphModalOpen, gameDate, gameSpeed, constructionQueue, turn]);

  // 6. 플레이어 행동 및 선택지 처리 핸들러
  const handleAction = async (actionText: string) => {
    if (!gameState || loading) return;

    // 건설 선택지 자동 감지 및 공사 큐 등록
    if (actionText.includes('[건설]') || actionText.includes('[증축]') || actionText.includes('축조')) {
      const bldMatch = actionText.match(/\[건설\]\s*([^,\.\(\n]+)/) || actionText.match(/\[증축\]\s*([^,\.\(\n]+)/);
      const buildingName = bldMatch ? bldMatch[1].trim() : "영지 목조 시설";
      
      const durMatch = actionText.match(/(\d+)\s*(?:달|개월|턴)/);
      const durMonths = durMatch ? parseInt(durMatch[1], 10) : 2;

      // 비용 차감 시도
      const costMatch = actionText.match(/금화\s*(\d+)/);
      const costAmount = costMatch ? parseInt(costMatch[1], 10) : 10;
      
      const currentGold = extractNumericValue(gameState.inventory?.['소지 화폐']?.[0] || '금화 20');
      if (currentGold >= costAmount) {
        const remainingGold = Math.max(0, currentGold - costAmount);
        if (gameState.inventory && gameState.inventory['소지 화폐']) {
          gameState.inventory['소지 화폐'][0] = `금화 ${remainingGold}`;
        }
      }

      const newQueueItem: QueueItem = {
        id: `q_bld_${Date.now()}`,
        building: buildingName,
        cost: `금화 ${costAmount}`,
        desc: `${buildingName} 건설 공사`,
        startTurn: turn,
        completeTurn: turn + durMonths,
        commandSent: true,
        durationMonths: durMonths,
        totalDurationSeconds: durMonths * 60,
        elapsedSeconds: 0,
        progressPercent: 0,
        completed: false,
        tags: ['건설', '영지']
      };

      setConstructionQueue(prev => [...prev, newQueueItem]);
      showQuickNotice(`🔨 [${buildingName}] 공사가 시작되었습니다! (우측 위젯에 진행률 등록)`);
    }

    pushUndoState(gameState, turn, constructionQueue);
    setCanUndo(true);
    setLoading(true);
    setStreamPreview("");

    try {
      const savedKey = localStorage.getItem('ck_api_key') || '';
      const useGemini = uxSettings.simulationMode === 'gemini' && savedKey;

      let resultData: any = null;

      if (!useGemini) {
        // ⚡ 로컬 룰 엔진 즉시 연산 (비용 0원, 지연 0.01초, 무환각)
        resultData = processTurn(gameState, actionText, turn, constructionQueue);
      } else {
        const response = await fetch('/api/game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: actionText, 
            currentState: { ...gameState, constructionQueue: summarizeQueue(constructionQueue, turn) },
            apiKey: savedKey,
            stream: false
          })
        });
        resultData = await response.json();
      }

      if (resultData?.parsed) {
        const nextState = resultData.parsed;
        const nextTurn = turn + 1;
        setGameState(nextState);
        setTurn(nextTurn);

        // 연도 및 나이 연동
        if (nextState.dateLocation) {
          const locParsed = parseDateLocation(nextState.dateLocation);
          setGameDate(locParsed.date);
        }

        saveToSlot('autosave', nextState, nextTurn, constructionQueue);
        if (typeof window !== 'undefined') {
          localStorage.setItem('ck_auto_save', JSON.stringify({ ...nextState, _turn: nextTurn, _constructionQueue: constructionQueue }));
        }
      } else if (resultData?.error) {
        alert("시뮬레이션 에러: " + resultData.error);
      }
    } catch (err: any) {
      console.error("Action error", err);
      // 로컬 룰 엔진으로 폴백
      const fallback = processTurn(gameState, actionText, turn, constructionQueue);
      setGameState(fallback.parsed);
      setTurn(turn + 1);
    } finally {
      setLoading(false);
      setStreamPreview("");
    }
  };

  // 7. 키보드 단축키 리스너 ([1]~[4] 선택지, Space 일시정지)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 텍스트 인풋 포커스 시 단축키 무시
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPaused(prev => {
          const next = !prev;
          showQuickNotice(next ? "⏸️ 시간 일시정지됨 (Space)" : "▶️ 시간 진행 중 (Space)");
          return next;
        });
      }

      if (e.key >= '1' && e.key <= '4' && gameState?.choices && !loading) {
        const idx = parseInt(e.key, 10) - 1;
        if (gameState.choices[idx]) {
          handleAction(gameState.choices[idx].text);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, loading]);

  const handleUndoTurn = () => {
    const popped = popUndoState();
    if (popped) {
      setGameState(popped.gameState);
      setTurn(popped.turn);
      if (popped.gameState?._constructionQueue) {
        setConstructionQueue(popped.gameState._constructionQueue);
      }
      setCanUndo(hasUndoState());
      showQuickNotice("↩️ 이전 턴으로 되돌아갔습니다.");
    }
  };

  const handleQuickSave = () => {
    if (!gameState) return;
    quickSave(gameState, turn, constructionQueue);
    showQuickNotice("💾 퀵 세이브가 완료되었습니다.");
  };

  // 타이틀 화면 (게임 상태가 없을 때)
  if (!gameState) {
    return (
      <main className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '540px',
          padding: '40px',
          background: 'rgba(24, 18, 14, 0.95)',
          border: '2px solid rgba(212, 175, 55, 0.5)',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.9)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>👑</div>
          <h1 style={{ color: '#fef3c7', fontSize: '2rem', fontWeight: 800, marginBottom: '6px' }}>
            크루세이더 킹즈: 연대기
          </h1>
          <p style={{ color: '#fbbf24', fontSize: '13px', fontWeight: 600, letterSpacing: '1px', marginBottom: '24px' }}>
            80억 분의 1 • 중세 봉건 라이프 시뮬레이터
          </p>
          <p style={{ color: '#a8a29e', fontSize: '12.5px', lineHeight: '1.7', marginBottom: '28px' }}>
            서기 1066년, 당신은 누구의 자식으로 태어났습니까?<br />
            무작위로 부여받은 운명 속에서 생존하고 입신양명하여 불멸의 가문을 세우십시오.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => setIsGenesisModalOpen(true)}
              style={{
                padding: '16px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #d4af37, #b8860b)',
                border: 'none',
                color: '#1a140d',
                fontSize: '15px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(212, 175, 55, 0.4)'
              }}
            >
              🎲 새로운 역사 시작하기 (무작위 80억 분의 1 출생)
            </button>

            <button
              onClick={() => setActiveModal('save')}
              style={{
                padding: '14px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                color: '#fef3c7',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              💾 세이브 데이터 불러오기 (Load Game)
            </button>
          </div>
        </div>

        {/* Genesis Modal on Title */}
        <GenesisModal
          isOpen={isGenesisModalOpen}
          onConfirm={handleGenesisConfirm}
        />

        {/* Save Modal on Title */}
        {activeModal === 'save' && (
          <CKSaveModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
            gameState={gameState}
            turn={turn}
            constructionQueue={constructionQueue}
            onLoadSuccess={(loadedData) => {
              setGameState(loadedData.gameState);
              setTurn(loadedData.turn || 1);
              if (loadedData.gameState?._constructionQueue) {
                setConstructionQueue(loadedData.gameState._constructionQueue);
              }
              setActiveModal(null);
              showQuickNotice(`💾 [${loadedData.title}] 세이브 데이터를 불러왔습니다.`);
            }}
          />
        )}
      </main>
    );
  }

  // 기본 인물 정보 추출
  const rulerName = gameState.personalInfo?.['이름'] || '군주';
  const rulerAge = gameState.personalInfo?.['나이'] || '16';
  const rulerStatus = gameState.personalInfo?.['신분'] || '방랑자';
  const rulerHouse = gameState.personalInfo?.['칭호'] || '가문';
  const currentLocation = parseDateLocation(gameState.dateLocation).location;

  return (
    <main className={styles.container}>
      {/* 1. Top HUD Sticky Bar */}
      <div className={styles.topBarWrapper}>
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
            showQuickNotice(`⏩ 배속 변경: ${spd}x`);
          }}
          monthProgressPercent={monthProgressPercent}
          realtimeDateStr={formatCleanDate(gameDate)}
          onOpenFamilyTree={() => setActiveModal('familyTree')}
          onOpenRealm={() => setActiveModal('character')}
          onOpenCharacter={() => setActiveModal('character')}
          onOpenRelations={() => setActiveModal('relations')}
          onOpenEstate={() => setActiveModal('character')}
          onOpenChronicle={() => setActiveModal('chronicle')}
          onOpenSave={() => setActiveModal('save')}
          onOpenSettings={() => setActiveModal('settings')}
          onQuickSave={handleQuickSave}
          onUndoTurn={handleUndoTurn}
          canUndo={canUndo}
          onReturnTitle={() => {
            if (confirm("메인 타이틀로 돌아가시겠습니까? 현재 상태는 자동 저장됩니다.")) {
              setGameState(null);
            }
          }}
          onOpenApiKey={() => setIsApiKeyModalOpen(true)}
        />
      </div>

      {/* 2. Main Stage: Split 2-Column (Left: Chronicle Paper / Right: Slim Status Widget) */}
      <div className={styles.mainStage}>
        {/* Left Column: Chronicle Paper (Story, Choices, Decrees) */}
        <section className={styles.chroniclePane}>
          {/* Paper Header */}
          <div className={styles.chronicleHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fef3c7' }}>
                📜 【 {rulerAge}세 ({gameDate.year}년 {gameDate.season}) — {currentLocation} 】
              </span>
              {gameState.historicalTag && (
                <span style={{
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid #fbbf24',
                  color: '#fbbf24',
                  background: 'rgba(251, 191, 36, 0.1)'
                }}>
                  {gameState.historicalTag}
                </span>
              )}
            </div>

            {gameState.judgment?.result && (
              <div className={styles.judgmentBadge}>
                <Sparkles size={13} color="#fbbf24" />
                <span style={{ color: '#fbbf24' }}>판정: {gameState.judgment.result}</span>
              </div>
            )}
          </div>

          {/* Paper Scroll Area: Narrative & Choices */}
          <div className={styles.chronicleScrollArea}>
            {/* Main Narrative Text */}
            <div className={styles.narrativeBox}>
              <TypewriterText 
                text={streamPreview || gameState.narrative || "서기 1066년, 격변하는 유럽의 운명이 시작되었습니다."} 
                delay={uxSettings.typewriterSpeed} 
              />
            </div>

            {/* 4 Choices Section */}
            <div className={styles.choicesSection}>
              <div style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '4px'
              }}>
                <Compass size={14} />
                <span>⚖️ 군주의 결단과 선택 (Choices):</span>
                <span style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 400 }}>
                  (키보드 1~4번 또는 클릭)
                </span>
              </div>

              {(!gameState.choices || gameState.choices.length === 0) ? (
                <div style={{ fontSize: '12px', color: '#78716c', fontStyle: 'italic', padding: '12px' }}>
                  현재 제시된 고유 선택지가 없습니다. 아래 직접 칙령을 입력하여 행동하십시오.
                </div>
              ) : (
                gameState.choices.map((choice, idx) => {
                  const theme = getChoiceTheme(choice.groupType, choice.text);
                  return (
                    <button
                      key={idx}
                      className={styles.choiceItemBtn}
                      style={{
                        background: theme.bg,
                        borderColor: theme.border
                      }}
                      onClick={() => handleAction(choice.text)}
                      disabled={loading}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <span style={{ fontSize: '1.4rem' }}>{theme.icon}</span>
                        <div>
                          <div style={{ fontSize: '11px', color: theme.tagColor, fontWeight: 700 }}>
                            [{idx + 1}] {choice.type} &bull; {choice.groupType || '일반 결단'}
                          </div>
                          <div style={{ fontSize: '13.5px', color: '#fff', fontWeight: 700, marginTop: '2px', lineHeight: '1.4' }}>
                            {choice.text}
                          </div>
                        </div>
                      </div>

                      {choice.probability && (
                        <span style={{
                          fontSize: '11px',
                          color: choice.probability.includes('성공') || choice.probability.includes('상승') ? '#34d399' : '#f87171',
                          background: 'rgba(0,0,0,0.5)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          whiteSpace: 'nowrap'
                        }}>
                          {choice.probability}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Bottom Direct Action / Decree Bar */}
          <div className={styles.freeActionBox}>
            <input
              type="text"
              value={freeAction}
              onChange={e => setFreeAction(e.target.value)}
              className={styles.inputField}
              placeholder="✍️ 직접 행동 또는 영주 칙령 하달 (예: [건설] 감시탑 증축, 영주에게 농토 청원, 기습 타격)..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && freeAction.trim()) {
                  handleAction(freeAction);
                  setFreeAction("");
                }
              }}
              disabled={loading}
            />
            <button
              className={styles.submitBtn}
              onClick={() => {
                if (freeAction.trim()) {
                  handleAction(freeAction);
                  setFreeAction("");
                }
              }}
              disabled={loading}
            >
              칙령 반포
            </button>
          </div>
        </section>

        {/* Right Column: Slim Context & Status Sidebar */}
        <aside className={styles.sideWidgetPane}>
          {/* Widget 1: Identity & House */}
          <div className={styles.widgetCard}>
            <div className={styles.widgetTitle}>
              <User size={15} />
              <span>신분 및 가문 정체성</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>
                  {rulerName} <span style={{ color: '#d4af37' }}>{rulerHouse}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {rulerStatus} • {rulerAge}세 • {gameState.personalInfo?.['문화'] || '중세인'}
                </div>
              </div>
              <div style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #d4af37',
                background: 'rgba(212, 175, 55, 0.1)',
                color: '#fbbf24',
                fontSize: '11px',
                fontWeight: 700
              }}>
                {gameState.personalInfo?.['종교'] || '가톨릭'}
              </div>
            </div>

            {/* Health & Stress Mini Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', marginTop: '10px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a8a29e', marginBottom: '2px' }}>
                  <span>건강 (Vitality)</span>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>95% (혈기왕성)</span>
                </div>
                <div style={{ width: '100%', height: '5px', background: 'rgba(0,0,0,0.5)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '95%', height: '100%', background: '#10b981' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a8a29e', marginBottom: '2px' }}>
                  <span>스트레스 (Stress)</span>
                  <span style={{ color: '#60a5fa', fontWeight: 700 }}>15% (안정)</span>
                </div>
                <div style={{ width: '100%', height: '5px', background: 'rgba(0,0,0,0.5)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '15%', height: '100%', background: '#3b82f6' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Widget 2: 🔨 진행 중인 프로젝트 (건설/작업 진행률) */}
          <div className={styles.widgetCard}>
            <div className={styles.widgetTitle}>
              <Hammer size={15} />
              <span>진행 중인 프로젝트 및 건설 ({constructionQueue.length})</span>
            </div>

            {constructionQueue.length === 0 ? (
              <div style={{
                fontSize: '11px',
                color: '#78716c',
                fontStyle: 'italic',
                padding: '10px 0',
                textAlign: 'center'
              }}>
                현재 진행 중인 공사나 장기 프로젝트가 없습니다.<br />
                (선택지에서 '[건설]' 항목을 선택하면 등록됩니다)
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {constructionQueue.map((item, idx) => {
                  const totalSec = item.totalDurationSeconds || (item.durationMonths ? item.durationMonths * 60 : 60);
                  const elapsedSec = item.elapsedSeconds || 0;
                  const percent = item.progressPercent !== undefined ? item.progressPercent : Math.min(100, Math.round((elapsedSec / totalSec) * 100));
                  const remaining = turnsLeft(item, turn);
                  const remainingLabel = isNaN(remaining) || remaining <= 0 
                    ? (percent >= 100 ? '완공 임박' : '1달 미만 남음') 
                    : `${remaining}달 남음`;

                  return (
                    <div key={item.id || idx} style={{
                      padding: '10px',
                      borderRadius: '8px',
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: '1px solid rgba(212, 175, 55, 0.2)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#fef3c7' }}>
                          🔨 {item.building}
                        </span>
                        <span style={{ fontSize: '10.5px', color: '#fbbf24', fontWeight: 600 }}>
                          {percent}% ({remainingLabel} ⏳)
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div style={{
                        width: '100%',
                        height: '6px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${percent}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #10b981, #34d399)',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Widget 3: 🏰 완공된 거점 및 영지 시설 */}
          <div className={styles.widgetCard}>
            <div className={styles.widgetTitle}>
              <Castle size={15} />
              <span>완공된 영지 시설 ({gameState.estate?.buildings?.length || 0})</span>
            </div>

            <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 700, marginBottom: '6px' }}>
              거점 형태: {gameState.estate?.level || '기본 거처'}
            </div>

            {(!gameState.estate?.buildings || gameState.estate.buildings.length === 0) ? (
              <div style={{ fontSize: '11px', color: '#78716c', fontStyle: 'italic' }}>
                축조된 영지 시설이 없습니다.
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {gameState.estate.buildings.map((b, idx) => (
                  <div key={idx} style={{
                    fontSize: '11px',
                    padding: '4px 8px',
                    borderRadius: '5px',
                    background: 'rgba(212, 175, 55, 0.1)',
                    border: '1px solid rgba(212, 175, 55, 0.25)',
                    color: '#fef3c7'
                  }} title={b.desc}>
                    ▶ {b.name} <span style={{ color: '#fbbf24' }}>Lv.{b.level}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Widget 4: 👥 주요 인물 및 가신 호감도 */}
          <div className={styles.widgetCard}>
            <div className={styles.widgetTitle}>
              <Users size={15} />
              <span>주요 인물 및 가계</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a8a29e' }}>
                <span>배우자</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{gameState.familyState?.spouse || '미혼'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a8a29e' }}>
                <span>적법한 후계자</span>
                <span style={{ color: '#fbbf24', fontWeight: 700 }}>{gameState.familyState?.heir || '없음'}</span>
              </div>

              {gameState.relationships?.personal && gameState.relationships.personal.length > 0 && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px', marginTop: '2px' }}>
                  {gameState.relationships.personal.slice(0, 3).map((p: any, idx) => {
                    const str = typeof p === 'string' ? p : (p?.name || '');
                    const parts = str.split('|');
                    return (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ color: '#e5e7eb' }}>{parts[0]}</span>
                        <span style={{ color: '#34d399', fontWeight: 600 }}>{parts[1] || ''}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Widget 5: 🏷️ 보유 특성 (트레잇) */}
          <div className={styles.widgetCard}>
            <div className={styles.widgetTitle}>
              <Award size={15} />
              <span>보유 특성 및 트레잇 ({gameState.traits?.length || 0})</span>
            </div>

            {(!gameState.traits || gameState.traits.length === 0) ? (
              <div style={{ fontSize: '11px', color: '#78716c', fontStyle: 'italic' }}>보유 특성 없음</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {gameState.traits.map((t, idx) => (
                  <span key={idx} style={{
                    fontSize: '10.5px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: t.category === '선천특성' ? 'rgba(59, 130, 246, 0.18)' : 'rgba(212, 175, 55, 0.15)',
                    border: t.category === '선천특성' ? '1px solid #3b82f6' : '1px solid rgba(212, 175, 55, 0.3)',
                    color: t.category === '선천특성' ? '#93c5fd' : '#fef3c7'
                  }} title={t.description}>
                    {t.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Widget 6: 🎒 착용 무구 및 소지품 */}
          <div className={styles.widgetCard}>
            <div className={styles.widgetTitle}>
              <Package size={15} />
              <span>소지 화폐 및 물품</span>
            </div>

            {(() => {
              const safeJoin = (val: any, fallback: string): string => {
                if (!val) return fallback;
                if (Array.isArray(val)) return val.filter(Boolean).map(String).join(', ') || fallback;
                if (typeof val === 'string') return val.trim() || fallback;
                return fallback;
              };

              const inv = gameState.inventory || {};
              const moneyText = safeJoin(inv['소지 화폐'] || inv.wealth || (inv as any)['재산및병력'] || (inv as any)['재산 및 병력'], '금화 10');
              const weaponText = safeJoin(inv['착용 무구'] || (inv as any)['장비및영지'] || (inv as any)['장비'], '기본 무기');
              const itemsText = safeJoin(inv['소지품'], '기본 소지품');

              return (
                <div style={{ fontSize: '11.5px', color: '#d6d3d1' }}>
                  <div style={{ color: '#fbbf24', fontWeight: 700, marginBottom: '4px' }}>
                    💰 {moneyText}
                  </div>
                  <div style={{ color: '#93c5fd', marginBottom: '2px' }}>
                    ⚔️ 착용 무구: {weaponText}
                  </div>
                  <div style={{ color: '#a8a29e', fontSize: '10.5px' }}>
                    📦 소지품: {itemsText}
                  </div>
                </div>
              );
            })()}
          </div>
        </aside>
      </div>

      {/* 3. Modals */}
      {/* 🎲 Genesis Modal (무작위 출생 증서) */}
      <GenesisModal
        isOpen={isGenesisModalOpen}
        onConfirm={handleGenesisConfirm}
      />

      {/* ☩ Epitaph Modal (사망 및 묘비명 카드 / 계승 및 환생) */}
      <EpitaphModal
        isOpen={isEpitaphModalOpen}
        gameState={gameState}
        turn={turn}
        onSuccession={handleSuccession}
        onReincarnation={handleReincarnation}
      />

      {/* Family Tree Modal */}
      {activeModal === 'familyTree' && (
        <FamilyTreeModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          gameState={gameState}
          onSuccession={handleSuccession}
        />
      )}

      {/* Character Profile Modal */}
      {activeModal === 'character' && (
        <CKCharacterModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          gameState={gameState}
          onPetitionPromotion={(target) => {
            setActiveModal(null);
            handleAction(`[신분 승격 청원] ${target.targetRank} 승격 의식을 거행한다.`);
          }}
          onExecuteDecision={(command) => {
            setActiveModal(null);
            handleAction(command);
          }}
        />
      )}

      {/* Relations Modal */}
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

      {/* Chronicle Modal */}
      {activeModal === 'chronicle' && (
        <ChronicleModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          chronicle={gameState.chronicle}
          objective={gameState.objective}
          characterName={rulerName}
        />
      )}

      {/* Save / Load Modal */}
      {activeModal === 'save' && (
        <CKSaveModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          gameState={gameState}
          turn={turn}
          constructionQueue={constructionQueue}
          onLoadSuccess={(loadedData) => {
            setGameState(loadedData.gameState);
            setTurn(loadedData.turn || 1);
            if (loadedData.gameState?._constructionQueue) {
              setConstructionQueue(loadedData.gameState._constructionQueue);
            }
            setActiveModal(null);
            setCanUndo(hasUndoState());
            showQuickNotice(`💾 [${loadedData.title}] 세이브 데이터를 불러왔습니다.`);
          }}
        />
      )}

      {/* Settings Modal */}
      {activeModal === 'settings' && (
        <CKSettingsModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          narrativeText={gameState?.narrative}
          onUndoTurn={handleUndoTurn}
          onSettingsChange={(newSettings) => setUxSettings(newSettings)}
        />
      )}

      {/* Gemini API Key Modal */}
      <CKApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeySaved={(hasKey, savedKey) => {
          setApiKey(savedKey || '');
          showQuickNotice(hasKey 
            ? '🔑 Gemini API Key가 저장되었습니다. (AI 보조 서관 활성화)' 
            : 'API Key가 삭제되어 로컬 룰 엔진으로 동작합니다.'
          );
        }}
      />

      {/* NPC 1:1 Dialogue Modal */}
      {activeDialogueCharacter && (
        <CKCharacterDialogueModal
          isOpen={true}
          onClose={() => setActiveDialogueCharacter(null)}
          character={activeDialogueCharacter}
          playerRulerName={rulerName}
          playerRulerTitle={rulerHouse}
          currentDateStr={formatCleanDate(gameDate)}
          apiKey={apiKey}
          onOpinionChange={(charId, delta) => {
            showQuickNotice(`👥 인물 호감도 변동: ${delta > 0 ? `+${delta}` : delta}`);
          }}
        />
      )}

      {/* ⚡ Quick Notification Toast */}
      {quickNotice && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, rgba(28, 20, 14, 0.98), rgba(15, 11, 8, 0.98))',
          border: '1.5px solid #d4af37',
          borderRadius: '10px',
          padding: '12px 24px',
          color: '#fbbf24',
          fontWeight: 'bold',
          fontSize: '0.95rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.9), 0 0 20px rgba(212,175,55,0.3)',
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
