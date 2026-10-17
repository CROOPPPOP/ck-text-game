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
import { extractNumericValue, detectPlayerArchetype, PlayerArchetype } from '@/lib/ckVisuals';
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
import CKPastLivesModal, { PastLifeRecord } from '@/components/CKPastLivesModal';
import CKCharacterDialogueModal, { DialogueCharacter } from '@/components/CKCharacterDialogueModal';

import { 
  Hammer, Shield, Swords, Sparkles, Award, Heart, Activity, 
  Compass, Coins, User, Users, Castle, Flame, ArrowUpRight, 
  Clock, CheckCircle, Package, Feather, Play, Pause, FastForward, BookOpen
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

function getStatusActionHeader(archetype: PlayerArchetype): string {
  switch (archetype) {
    case 'peasant':
      return '🌾 소작농의 중요 결단과 생존 선택 (Dilemmas):';
    case 'wanderer':
      return '🗡️ 방랑자의 생존 결단과 모험 (Dilemmas):';
    case 'clergy':
      return '⛪ 성직자의 신앙적 결단과 성무 (Dilemmas):';
    case 'company':
      return '👥 용병단의 지휘 결단과 작전 (Dilemmas):';
    case 'noble':
    default:
      return '👑 군주의 통치 결단과 칙령 (Dilemmas):';
  }
}

function getAmbientMonthlyText(archetype: PlayerArchetype, date: GameDate): string {
  const season = date.season;
  if (archetype === 'peasant') {
    switch (season) {
      case '봄':
        return `서기 ${date.year}년 ${date.month}월 (봄): 겨우내 얼었던 대지가 풀리고, 마을 사람들과 함께 흙을 갈아엎어 보리와 귀리 씨앗을 뿌렸습니다. 손마디에 굳은살이 박였으나 향긋한 흙냄새에 마음이 든든합니다.`;
      case '여름':
        return `서기 ${date.year}년 ${date.month}월 (여름): 따가운 뙤약볕 아래서 땀을 비 오듯 쏟으며 김을 매고 짚오두막 지붕을 손보았습니다. 이웃 소작인들과 시원한 우물물을 나누며 고된 하루를 달랬습니다.`;
      case '가을':
        return `서기 ${date.year}년 ${date.month}월 (가을): 황금빛 들판에서 풍성하게 익은 곡식을 낫으로 베어 타작했습니다. 영주의 십일조와 소작료를 바치고 남은 곡식을 오두막 광에 정성껏 갈무리했습니다.`;
      case '겨울':
        return `서기 ${date.year}년 ${date.month}월 (겨울): 매서운 눈보라가 오두막 흙벽을 때리지만, 미리 패둔 장작을 화덕에 피우고 짚신을 삼으며 가족들과 따뜻하게 겨울을 나고 있습니다.`;
    }
  } else if (archetype === 'wanderer') {
    switch (season) {
      case '봄':
        return `서기 ${date.year}년 ${date.month}월 (봄): 눈 녹은 가도를 따라 발길을 옮기며 봄맞이 순례자들과 상단들의 분주한 행렬을 마주쳤습니다.`;
      case '여름':
        return `서기 ${date.year}년 ${date.month}월 (여름): 주막 평상 그늘 아래서 땀을 식히며 칼날을 숫돌에 갈고 각지에서 들려오는 풍문을 탐색했습니다.`;
      case '가을':
        return `서기 ${date.year}년 ${date.month}월 (가을): 가을 장터가 열린 성하 마을에서 가벼운 호위 의뢰를 수행하며 여비와 건포도를 챙겼습니다.`;
      case '겨울':
        return `서기 ${date.year}년 ${date.month}월 (겨울): 차가운 겨울바람을 피해 훈훈한 여관 화덕가에 머물며 옛 동료들의 무용담을 나누었습니다.`;
    }
  } else if (archetype === 'clergy') {
    switch (season) {
      case '봄':
        return `서기 ${date.year}년 ${date.month}월 (봄): 부활절 종소리가 은은히 퍼지는 가운데 교구 성도들과 함께 봄맞이 감사 미사를 올렸습니다.`;
      case '여름':
        return `서기 ${date.year}년 ${date.month}월 (여름): 수도원 서고에서 촛불을 켜고 고대 약초학과 성경 사본을 정성껏 필사했습니다.`;
      case '가을':
        return `서기 ${date.year}년 ${date.month}월 (가을): 영민들이 바친 십일조 곡식을 검수하고, 흉년에 대비해 구빈원에 비상 양식을 갈무리했습니다.`;
      case '겨울':
        return `서기 ${date.year}년 ${date.month}월 (겨울): 엄동설한의 추위 속에서 성당의 종탑에 올라 평화를 위해 밤샘 기도를 올렸습니다.`;
    }
  } else {
    // noble / company
    switch (season) {
      case '봄':
        return `서기 ${date.year}년 ${date.month}월 (봄): 기사단을 이끌고 영지 경계와 봉건 장원을 순시하며 농민들의 봄 파종을 독려했습니다.`;
      case '여름':
        return `서기 ${date.year}년 ${date.month}월 (여름): 성채 연병장에서 수비대 훈련을 사열하고 가신들과 함께 영지 수리 및 성벽 보수를 점검했습니다.`;
      case '가을':
        return `서기 ${date.year}년 ${date.month}월 (가을): 장원 관리관들로부터 가을 조세 수납 장부를 보고받고 국고와 군량 창고를 충실히 채웠습니다.`;
      case '겨울':
        return `서기 ${date.year}년 ${date.month}월 (겨울): 성채 홀의 거대한 벽난로 앞에 모여 가신단과 온기를 나누며 새해의 영지 경영 계획을 논의했습니다.`;
    }
  }
}

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
  const [constructionQueue, setConstructionQueue] = useState<QueueItem[]>([]);
  const [turn, setTurn] = useState(1);
  const [gameSpeed, setGameSpeed] = useState<GameSpeed>(1);
  const [isPaused, setIsPaused] = useState<boolean>(true);
  const [gameDate, setGameDate] = useState<GameDate>({ year: 1066, month: 10, day: 14, season: '가을' });
  const [monthProgressPercent, setMonthProgressPercent] = useState<number>(0);
  
  // Modals
  const [isGenesisModalOpen, setIsGenesisModalOpen] = useState(false);
  const [isEpitaphModalOpen, setIsEpitaphModalOpen] = useState(false);
  const [isPastLivesModalOpen, setIsPastLivesModalOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'character' | 'familyTree' | 'relations' | 'chronicle' | 'save' | 'settings' | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [activeDialogueCharacter, setActiveDialogueCharacter] = useState<DialogueCharacter | null>(null);

  // 2-Tier Real-time System & Stream
  const [minorCountdown, setMinorCountdown] = useState<number>(0);
  const [isMinorEvent, setIsMinorEvent] = useState<boolean>(false);
  const [pastLivesCount, setPastLivesCount] = useState<number>(0);
  const chronicleBottomRef = useRef<HTMLDivElement | null>(null);

  // UX & System
  const [uxSettings, setUxSettings] = useState<UserUXSettings>(loadUXSettings());
  const [canUndo, setCanUndo] = useState(false);
  const [quickNotice, setQuickNotice] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [savedAutoGame, setSavedAutoGame] = useState<{
    data: ParsedState;
    name: string;
    status: string;
    year: string;
    turn: number;
  } | null>(null);

  const lastTickTimeRef = useRef<number>(Date.now());
  const accumulatedSecRef = useRef<number>(0);
  const seenEventIdsRef = useRef<Set<string>>(new Set());

  // 1. 초기 로드 및 세이브 검사 (무조건 타이틀 화면을 먼저 노출)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      autoMigrateAndSanitizeStorage();
      const savedKey = localStorage.getItem('ck_api_key') || '';
      setApiKey(savedKey);

      // 지난 삶들의 서고 기록 개수 확인
      try {
        const rawPast = localStorage.getItem('ck_past_lives');
        if (rawPast) {
          const parsedPast = JSON.parse(rawPast);
          if (Array.isArray(parsedPast)) setPastLivesCount(parsedPast.length);
        }
      } catch (e) {
        console.error("Past lives count load error", e);
      }

      const savedStateRaw = localStorage.getItem('ck_auto_save');
      if (savedStateRaw) {
        try {
          const parsed = JSON.parse(savedStateRaw);
          if (parsed && (parsed.personalInfo || parsed.narrative)) {
            const name = parsed.personalInfo?.['이름'] || '선대 인물';
            const status = parsed.personalInfo?.['신분'] || '방랑자';
            const yearMatch = parsed.dateLocation ? parsed.dateLocation.match(/(\d+)년/) : null;
            const year = yearMatch ? yearMatch[1] : '1066';
            setSavedAutoGame({ data: parsed, name, status, year, turn: parsed._turn || 1 });
          }
        } catch (e) {
          console.error("Auto save load error", e);
        }
      }
      // 세이브 존재 여부와 무관하게 항상 타이틀 화면(gameState = null)으로 시작
    }
  }, []);

  const handleContinueGame = () => {
    if (!savedAutoGame) return;
    setGameState(savedAutoGame.data);
    const autoData = savedAutoGame.data as any;
    if (autoData._turn) setTurn(autoData._turn);
    if (autoData._constructionQueue) setConstructionQueue(autoData._constructionQueue);
    if (savedAutoGame.data.dateLocation) {
      const parsedDate = parseDateLocation(savedAutoGame.data.dateLocation);
      setGameDate(parsedDate.date);
    }
    setCanUndo(hasUndoState());
    setIsPaused(true);
    showQuickNotice(`▶️ [${savedAutoGame.name} (${savedAutoGame.status})] 님의 여정을 이어갑니다.`);
  };

  const showQuickNotice = (msg: string) => {
    setQuickNotice(msg);
    setTimeout(() => setQuickNotice(null), 3200);
  };

  // 2. 무작위 출생 확정 (새 게임 시작)
  const handleGenesisConfirm = (cardData: GenesisCardData, initialState: ParsedState) => {
    const initialChronicle: ChronicleItem = {
      turn: 1,
      dateLocation: '1066년 10월 (가을) / 잉글랜드 헤이스팅스 [턴 수: 1]',
      action: '운명의 연대기 시작',
      result: '출생',
      summary: `${cardData.name} ${cardData.houseName} (${cardData.status})의 여정이 시작되었습니다.`,
      narrative: initialState.narrative || `${cardData.name}의 중세 서사가 시작되었습니다.`,
      kind: 'major',
      historicalTag: '🎲 무작위 중세 출생'
    };
    const stateWithChronicle: ParsedState = {
      ...initialState,
      chronicle: [initialChronicle]
    };

    setGameState(stateWithChronicle);
    setTurn(1);
    setGameDate({ year: 1066, month: 10, day: 14, season: '가을' });
    setConstructionQueue([]);
    setIsGenesisModalOpen(false);
    setIsEpitaphModalOpen(false);
    setIsPaused(true);

    if (typeof window !== 'undefined') {
      localStorage.setItem('ck_auto_save', JSON.stringify({ ...stateWithChronicle, _turn: 1, _constructionQueue: [] }));
    }
    showQuickNotice(`🎲 ${cardData.name} ${cardData.houseName} (${cardData.status})의 역사가 시작되었습니다!`);
  };

  // 3. 엔딩 및 사망 처리 (지난 삶들의 서고 자동 보존)
  useEffect(() => {
    if (gameState?.ending) {
      setIsEpitaphModalOpen(true);
      setIsPaused(true);

      // 지난 삶들의 서고(Past Lives Codex) 자동 기록
      try {
        const raw = localStorage.getItem('ck_past_lives');
        const list: PastLifeRecord[] = raw ? JSON.parse(raw) : [];
        const name = gameState.personalInfo?.['이름'] || '인물';
        const house = gameState.personalInfo?.['칭호'] || '';
        const archetype = detectPlayerArchetype(gameState);
        const age = parseInt(gameState.personalInfo?.['나이'] || '40', 10);
        const deathText = gameState.ending || '세월의 흐름과 영면';
        const record: PastLifeRecord = {
          id: `life_${Date.now()}`,
          name,
          house,
          archetype,
          startYear: 1066,
          endYear: gameDate.year,
          finalAge: age,
          deathCause: deathText.length > 50 ? deathText.slice(0, 50) + '...' : deathText,
          epitaph: deathText,
          summary: deathText,
          totalTurns: turn,
          timestamp: Date.now()
        };

        if (!list.some(l => l.name === name && l.endYear === gameDate.year && l.finalAge === age)) {
          list.unshift(record);
          localStorage.setItem('ck_past_lives', JSON.stringify(list));
          setPastLivesCount(list.length);
        }
      } catch (e) {
        console.error("Past life save error", e);
      }
    }
  }, [gameState?.ending, gameDate.year, turn]);

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

  // 4-1. 소결단(Minor Event) 흘려보내기 핸들러
  const handlePassMinorChoice = () => {
    if (!gameState || loading) return;
    setIsMinorEvent(false);
    setMinorCountdown(0);
    showQuickNotice("🍃 사소한 일화는 관례에 맡기고 평온한 일상을 이어갑니다.");

    const loc = parseDateLocation(gameState.dateLocation).location;
    const passLog = "사소한 소요와 일화는 현지 관례와 사람들의 뜻에 맡겨둔 채, 당신은 자신의 삶과 본업에 집중하며 계절을 보냈습니다.";
    const chronicleEntry: ChronicleItem = {
      turn,
      dateLocation: formatDateLocation(gameDate, loc),
      action: "사소한 일화 지나침",
      result: "흘려보냄",
      summary: passLog,
      narrative: passLog,
      kind: 'minor',
      choiceTaken: '[0] 흘려보내기'
    };

    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        narrative: passLog,
        choices: [],
        chronicle: [...(prev.chronicle || []), chronicleEntry]
      };
    });
  };

  // 5. 실시간 틱 루프 (시간 전진, 건설 틱, 소결단 카운트다운, 월간 이벤트)
  useEffect(() => {
    lastTickTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaMs = now - lastTickTimeRef.current;
      lastTickTimeRef.current = now;
      const deltaSec = deltaMs / 1000;

      // 일시정지, 모달 열림, 로딩, 엔딩 시 틱 중단
      if (isPaused || loading || !gameState || activeModal !== null || isGenesisModalOpen || isEpitaphModalOpen || isPastLivesModalOpen || gameState.ending) {
        return;
      }

      // 소결단(Minor Event) 카운트다운 타이머 처리 (시간이 흘러가며 자동 종료)
      if (isMinorEvent && minorCountdown > 0) {
        const nextCountdown = minorCountdown - (deltaSec * gameSpeed);
        if (nextCountdown <= 0) {
          handlePassMinorChoice();
          return;
        } else {
          setMinorCountdown(nextCountdown);
        }
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
                summary: `${item.building} 건물이 완공되어 영지 인프라로 확충되었습니다.`,
                narrative: `장인들과 일꾼들의 땀방울 끝에 마침내 [${item.building}] 공사가 성공리에 완공되었습니다! 주민들과 이웃들이 환호성을 지르며 완공된 시설을 둘러봅니다.`,
                kind: 'milestone'
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

        // 월간 이벤트 롤링
        const rolledEvent = rollMonthlyEvent(gameState, turn, seenEventIdsRef.current);
        if (rolledEvent) {
          seenEventIdsRef.current.add(rolledEvent.id);

          // 2계층 사건 분기 판별 (대결단 vs 소결단)
          const isMajor = rolledEvent.category === 'historical' || 
                          rolledEvent.category === 'epidemic' || 
                          rolledEvent.category === 'intrigue' || 
                          rolledEvent.weight >= 400 || 
                          rolledEvent.title.includes('징발') || 
                          rolledEvent.title.includes('전쟁') || 
                          rolledEvent.title.includes('위기');

          const dilemmaChoices = rolledEvent.choices.map((c, idx) => ({
            id: c.id,
            type: `${idx + 1}번`,
            text: c.text,
            probability: c.probability,
            groupType: c.groupType
          }));

          const eventNarrative = `【 ${isMajor ? '🚨 대결단' : '💬 일상 조우'}: ${rolledEvent.title} 】\n${rolledEvent.narrativeTemplate}${rolledEvent.dialogueSpeaker ? `\n\n${rolledEvent.dialogueSpeaker}: "${rolledEvent.dialogueText || ''}"` : ''}`;

          if (isMajor) {
            // 대결단: 시간 완전 정지
            setIsPaused(true);
            setIsMinorEvent(false);
            setMinorCountdown(0);
            showQuickNotice(`🚨 중요 대결단 발생: [${rolledEvent.title}] (시간 정지)`);
          } else {
            // 소결단: 시간 흐름 유지 + 6초 카운트다운
            setIsMinorEvent(true);
            setMinorCountdown(6.0);
            showQuickNotice(`💬 일상 조우 발생: [${rolledEvent.title}] (흐르는 시간 속 선택)`);
          }

          setGameState(prev => {
            if (!prev) return prev;
            const loc = parseDateLocation(prev.dateLocation).location;
            const chronicleEntry: ChronicleItem = {
              turn,
              dateLocation: formatDateLocation(timeResult.newDate, loc),
              action: `${isMajor ? '대결단' : '일상'}: ${rolledEvent.title}`,
              result: '결단 대기',
              summary: rolledEvent.narrativeTemplate.slice(0, 90) + '...',
              narrative: eventNarrative,
              kind: isMajor ? 'major' : 'minor',
              historicalTag: rolledEvent.historicalTag
            };
            return {
              ...prev,
              dateLocation: formatDateLocation(timeResult.newDate, loc, turn),
              narrative: eventNarrative,
              choices: dilemmaChoices,
              historicalTag: rolledEvent.historicalTag || prev.historicalTag,
              chronicle: [...(prev.chronicle || []), chronicleEntry]
            };
          });
        } else {
          // 일반 사건 (평온한 계절 서술 로그 누적)
          const archetype = detectPlayerArchetype(gameState);
          const ambientLog = getAmbientMonthlyText(archetype, timeResult.newDate);
          setGameState(prev => {
            if (!prev) return prev;
            const loc = parseDateLocation(prev.dateLocation).location;
            const chronicleEntry: ChronicleItem = {
              turn,
              dateLocation: formatDateLocation(timeResult.newDate, loc),
              action: `일상 연대기 (${timeResult.newDate.month}월 ${timeResult.newDate.season})`,
              result: '평온',
              summary: ambientLog,
              narrative: ambientLog,
              kind: 'ambient'
            };
            return {
              ...prev,
              dateLocation: formatDateLocation(timeResult.newDate, loc, turn),
              narrative: ambientLog,
              choices: [],
              chronicle: [...(prev.chronicle || []), chronicleEntry]
            };
          });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, loading, gameState, activeModal, isGenesisModalOpen, isEpitaphModalOpen, isPastLivesModalOpen, isMinorEvent, minorCountdown, gameDate, gameSpeed, constructionQueue, turn]);

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

      // Space 키: 시간 일시정지 / 계속 토글
      if (e.code === 'Space' && activeModal === null && !isGenesisModalOpen && !isEpitaphModalOpen && !isPastLivesModalOpen) {
        e.preventDefault();
        setIsPaused(prev => {
          const next = !prev;
          showQuickNotice(next ? "⏸️ 시간 일시정지됨 (Space)" : "▶️ 시간 진행 중 (Space)");
          return next;
        });
      }

      // [ 키: 배속 감소 (1x, 2x, 4x)
      if ((e.key === '[' || e.key === '{') && activeModal === null) {
        e.preventDefault();
        setGameSpeed(prev => {
          const next: GameSpeed = prev === 4 ? 2 : prev === 2 ? 1 : 1;
          showQuickNotice(`⏪ 배속 감소: ${next}x ([ 키)`);
          return next;
        });
      }

      // ] 키: 배속 증가 (1x, 2x, 4x)
      if ((e.key === ']' || e.key === '}') && activeModal === null) {
        e.preventDefault();
        setGameSpeed(prev => {
          const next: GameSpeed = prev === 1 ? 2 : prev === 2 ? 4 : 4;
          showQuickNotice(`⏩ 배속 증가: ${next}x (] 키)`);
          return next;
        });
      }

      // 0 키: 소결단 흘려보내기
      if (e.key === '0' && isMinorEvent && activeModal === null && !loading) {
        e.preventDefault();
        handlePassMinorChoice();
        return;
      }

      // 1~4 키: 선택지 결정
      if (e.key >= '1' && e.key <= '4' && gameState?.choices && gameState.choices.length > 0 && !loading) {
        const idx = parseInt(e.key, 10) - 1;
        if (gameState.choices[idx]) {
          handleAction(gameState.choices[idx].text);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, loading, activeModal, isGenesisModalOpen, isEpitaphModalOpen, isPastLivesModalOpen, isMinorEvent]);

  // 연대기 새 서사 추가 시 하단 자동 부드러운 스크롤
  useEffect(() => {
    chronicleBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState?.chronicle?.length, gameState?.narrative, isMinorEvent]);

  const handlePassSeason = () => {
    if (!gameState || loading) return;
    let currDate = { ...gameDate };
    let currTurn = turn;
    let triggeredEvent: any = null;

    for (let m = 0; m < 3; m++) {
      const timeResult = advanceGameTime(currDate, 60, 1, 0);
      currDate = timeResult.newDate;
      currTurn += 1;

      const rolled = rollMonthlyEvent(gameState, currTurn, seenEventIdsRef.current);
      if (rolled) {
        triggeredEvent = rolled;
        seenEventIdsRef.current.add(rolled.id);
        break;
      }
    }

    setGameDate(currDate);
    setTurn(currTurn);

    if (triggeredEvent) {
      const isMajor = triggeredEvent.category === 'historical' || 
                      triggeredEvent.category === 'epidemic' || 
                      triggeredEvent.category === 'intrigue' || 
                      triggeredEvent.weight >= 400 || 
                      triggeredEvent.title.includes('징발') || 
                      triggeredEvent.title.includes('전쟁') || 
                      triggeredEvent.title.includes('위기');

      if (isMajor) {
        setIsPaused(true);
        setIsMinorEvent(false);
        setMinorCountdown(0);
        showQuickNotice(`🚨 중요 대결단 발생: [${triggeredEvent.title}] (시간 정지)`);
      } else {
        setIsMinorEvent(true);
        setMinorCountdown(6.0);
        showQuickNotice(`💬 일상 조우 발생: [${triggeredEvent.title}] (흐르는 시간 속 선택)`);
      }

      const eventNarrative = `【 ${isMajor ? '🚨 대결단' : '💬 일상 조우'}: ${triggeredEvent.title} 】\n${triggeredEvent.narrativeTemplate}${triggeredEvent.dialogueSpeaker ? `\n\n${triggeredEvent.dialogueSpeaker}: "${triggeredEvent.dialogueText || ''}"` : ''}`;
      const dilemmaChoices = triggeredEvent.choices.map((c: any, idx: number) => ({
        id: c.id,
        type: `${idx + 1}번`,
        text: c.text,
        probability: c.probability,
        groupType: c.groupType
      }));

      setGameState(prev => {
        if (!prev) return prev;
        const loc = parseDateLocation(prev.dateLocation).location;
        const chronicleEntry: ChronicleItem = {
          turn: currTurn,
          dateLocation: formatDateLocation(currDate, loc),
          action: `${isMajor ? '대결단' : '일상'}: ${triggeredEvent.title}`,
          result: '결단 대기',
          summary: triggeredEvent.narrativeTemplate.slice(0, 90) + '...',
          narrative: eventNarrative,
          kind: isMajor ? 'major' : 'minor',
          historicalTag: triggeredEvent.historicalTag
        };
        return {
          ...prev,
          dateLocation: formatDateLocation(currDate, loc, currTurn),
          narrative: eventNarrative,
          choices: dilemmaChoices,
          historicalTag: triggeredEvent.historicalTag || prev.historicalTag,
          chronicle: [...(prev.chronicle || []), chronicleEntry]
        };
      });
    } else {
      const archetype = detectPlayerArchetype(gameState);
      const ambientLog = getAmbientMonthlyText(archetype, currDate);
      setGameState(prev => {
        if (!prev) return prev;
        const loc = parseDateLocation(prev.dateLocation).location;
        const chronicleEntry: ChronicleItem = {
          turn: currTurn,
          dateLocation: formatDateLocation(currDate, loc),
          action: `계절 경과 (+3개월)`,
          result: '평온',
          summary: ambientLog,
          narrative: ambientLog,
          kind: 'ambient'
        };
        return {
          ...prev,
          dateLocation: formatDateLocation(currDate, loc, currTurn),
          narrative: ambientLog,
          choices: [],
          chronicle: [...(prev.chronicle || []), chronicleEntry]
        };
      });
      showQuickNotice(`⏩ 3개월의 세월이 평온하게 흘렀습니다.`);
    }
  };

  const handleAmbientRoutineAction = () => {
    if (!gameState || loading) return;
    const archetype = detectPlayerArchetype(gameState);
    let actionDesc = "";
    if (archetype === 'peasant') {
      actionDesc = "온종일 밭을 갈고 오두막 짚단을 손보며 땀방울을 흘렸습니다. (마을 평판 +5, 비상금 +2닢)";
    } else if (archetype === 'wanderer') {
      actionDesc = "가도를 정찰하고 무구를 정비하며 몸과 마음을 가다듬었습니다. (개인 명망 +5, 여비 +3닢)";
    } else if (archetype === 'clergy') {
      actionDesc = "성당에서 조용히 성경을 묵상하고 마을 병자들을 위로했습니다. (신앙심 +8)";
    } else {
      actionDesc = "성채를 순찰하고 가신단과 국정을 논의하며 영지 기강을 점검했습니다. (가문 위신 +8)";
    }

    setGameState(prev => {
      if (!prev) return prev;
      const loc = parseDateLocation(prev.dateLocation).location;
      const chronicleEntry: ChronicleItem = {
        turn,
        dateLocation: formatDateLocation(gameDate, loc),
        action: `일상 정비`,
        result: '성공',
        summary: actionDesc
      };
      return {
        ...prev,
        narrative: actionDesc,
        choices: [],
        chronicle: [...(prev.chronicle || []), chronicleEntry]
      };
    });
    showQuickNotice("🌾 일상적인 노고와 정비를 마쳤습니다.");
  };

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
            중세 봉건 라이프 시뮬레이터 • 운명의 연대기
          </p>
          <p style={{ color: '#a8a29e', fontSize: '12.5px', lineHeight: '1.7', marginBottom: '28px' }}>
            서기 1066년, 당신은 누구의 자식으로 태어났습니까?<br />
            무작위로 부여받은 운명 속에서 생존하고 입신양명하여 역사의 한 페이지를 새기십시오.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {savedAutoGame && (
              <button
                onClick={handleContinueGame}
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: '1px solid #34d399',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>▶️ 이전 여정 이어하기</span>
                <span style={{ fontSize: '12px', opacity: 0.9 }}>
                  ({savedAutoGame.name} • {savedAutoGame.status} • {savedAutoGame.year}년)
                </span>
              </button>
            )}

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
              🎲 새로운 인생 시작하기 (무작위 중세 출생)
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
              💾 저장된 기록 불러오기 (Load Game)
            </button>

            <button
              onClick={() => setIsPastLivesModalOpen(true)}
              style={{
                padding: '14px',
                borderRadius: '8px',
                background: 'rgba(167, 139, 250, 0.12)',
                border: '1px solid rgba(167, 139, 250, 0.35)',
                color: '#e9d5ff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <BookOpen size={15} color="#c084fc" />
              <span>📜 지난 삶들의 서고 ({pastLivesCount}권)</span>
            </button>
          </div>
        </div>

        {/* Genesis Modal on Title */}
        <GenesisModal
          isOpen={isGenesisModalOpen}
          onConfirm={handleGenesisConfirm}
        />

        {/* Past Lives Modal on Title */}
        <CKPastLivesModal
          isOpen={isPastLivesModalOpen}
          onClose={() => setIsPastLivesModalOpen(false)}
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
  const rulerName = gameState.personalInfo?.['이름'] || '인물';
  const rulerAge = gameState.personalInfo?.['나이'] || '16';
  const rulerStatus = gameState.personalInfo?.['신분'] || '방랑자';
  const rulerHouse = gameState.personalInfo?.['칭호'] || '';
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
          onOpenPastLives={() => setIsPastLivesModalOpen(true)}
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

          {/* Paper Scroll Area: Chronicle Stream & Choices */}
          <div className={styles.chronicleScrollArea}>
            {/* 1. Chronicle Log Stream (누적형 인생 일대기 로그 스트림) */}
            <div className={styles.chronicleStream}>
              {gameState.chronicle && gameState.chronicle.length > 0 ? (
                gameState.chronicle.map((item, idx) => {
                  const isMajor = item.kind === 'major' || item.action?.includes('대결단') || item.action?.includes('중요');
                  const isMilestone = item.kind === 'milestone' || item.action?.includes('완공');
                  return (
                    <div
                      key={idx}
                      className={`${styles.chronicleEntry} ${isMajor ? styles.chronicleEntryMajor : isMilestone ? styles.chronicleEntryMilestone : ''}`}
                    >
                      <div className={styles.chronicleEntryHeader}>
                        <span className={styles.chronicleEntryDate}>
                          📜 {item.dateLocation || `서기 ${gameDate.year}년`}
                        </span>
                        <span className={styles.chronicleEntryTag}>
                          {item.historicalTag || item.action}
                        </span>
                      </div>

                      <div className={styles.chronicleEntryText}>
                        {item.narrative || item.summary}
                      </div>

                      {item.choiceTaken && (
                        <div className={styles.chronicleChoiceOutcome}>
                          <span>✓ 나의 결단: {item.choiceTaken}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className={styles.chronicleEntry}>
                  <div className={styles.chronicleEntryHeader}>
                    <span className={styles.chronicleEntryDate}>📜 {gameState.dateLocation || '서기 1066년'}</span>
                    <span className={styles.chronicleEntryTag}>운명의 시작</span>
                  </div>
                  <div className={styles.chronicleEntryText}>
                    <TypewriterText 
                      text={streamPreview || gameState.narrative || "서기 1066년, 격변하는 유럽의 운명이 시작되었습니다."} 
                      delay={uxSettings.typewriterSpeed} 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. Choices or Ambient Time Progress Section */}
            <div className={styles.choicesSection}>
              {gameState.choices && gameState.choices.length > 0 ? (
                <>
                  {isMinorEvent ? (
                    /* 소결단 (Minor Event) 카드: 시간 흐름 유지 + 카운트다운 타이머 */
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(24, 30, 20, 0.95), rgba(15, 20, 14, 0.98))',
                      border: '1.5px solid rgba(56, 189, 248, 0.45)',
                      borderRadius: '10px',
                      padding: '14px 18px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.2rem' }}>💬</span>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>
                              일상 조우 • 작은 선택은 흘러갑니다
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                              선택하지 않거나 [0]번을 누르면 일상으로 자연스럽게 넘어갑니다.
                            </div>
                          </div>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>
                          ⏳ {Math.ceil(minorCountdown)}초 남음
                        </span>
                      </div>

                      {/* Countdown progress bar */}
                      <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px' }}>
                        <div style={{
                          width: `${Math.max(0, Math.min(100, (minorCountdown / 6.0) * 100))}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
                          transition: 'width 0.2s linear'
                        }} />
                      </div>

                      {/* Choices */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {gameState.choices.map((choice, idx) => {
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
                                <span style={{ fontSize: '1.3rem' }}>{theme.icon}</span>
                                <div>
                                  <div style={{ fontSize: '11px', color: theme.tagColor, fontWeight: 700 }}>
                                    [{idx + 1}] {choice.type} &bull; {choice.groupType || '일상 선택'}
                                  </div>
                                  <div style={{ fontSize: '13.5px', color: '#fff', fontWeight: 700, marginTop: '2px', lineHeight: '1.4' }}>
                                    {choice.text}
                                  </div>
                                </div>
                              </div>
                              {choice.probability && (
                                <span style={{
                                  fontSize: '11px',
                                  color: '#34d399',
                                  background: 'rgba(0,0,0,0.5)',
                                  padding: '4px 8px',
                                  borderRadius: '6px'
                                }}>
                                  {choice.probability}
                                </span>
                              )}
                            </button>
                          );
                        })}

                        <button
                          onClick={handlePassMinorChoice}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '8px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: '#cbd5e1',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>🍃 [0] 흘려보내기 (관례에 맡기고 일상 지속)</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* 대결단 (Major Event) 카드: 시간 완전 정지 + 중요 결단 제시 */
                    <>
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
                        <span>{getStatusActionHeader(detectPlayerArchetype(gameState))}</span>
                        <span style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 400 }}>
                          (시간 정지 중 &bull; 키보드 1~4번 또는 클릭)
                        </span>
                      </div>

                      {gameState.choices.map((choice, idx) => {
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
                                  [{idx + 1}] {choice.type} &bull; {choice.groupType || '중요 대결단'}
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
                      })}
                    </>
                  )}
                </>
              ) : (
                /* 평온한 일상 제어 카드: 재생/정지, 배속 조절, 계절 넘기기, 일상 정비 */
                <div style={{
                  background: 'rgba(28, 22, 17, 0.88)',
                  border: '1.5px solid rgba(212, 175, 55, 0.35)',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.5)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.4rem' }}>{isPaused ? '⏸️' : '⏳'}</span>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#fef3c7' }}>
                          {isPaused 
                            ? `시간이 멈추었습니다 (${gameDate.year}년 ${gameDate.month}월 ${gameDate.season})` 
                            : `평온한 일상이 흐르고 있습니다 (${gameDate.year}년 ${gameDate.month}월 ${gameDate.season} • ${gameSpeed}x)`}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#a8a29e', marginTop: '2px' }}>
                          계절이 바뀌며 삶의 서사가 기록됩니다. 중대한 대결단이 발생하면 시간이 멈추고 선택지가 제시됩니다.
                        </div>
                      </div>
                    </div>

                    {/* Speed Controls (1x, 2x, 4x) */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(0,0,0,0.4)',
                      padding: '3px 6px',
                      borderRadius: '6px',
                      border: '1px solid rgba(212, 175, 55, 0.25)'
                    }}>
                      <span style={{ fontSize: '10.5px', color: '#94a3b8', marginRight: '4px' }}>배속([ ]):</span>
                      {([1, 2, 4] as const).map((spd) => {
                        const isActive = gameSpeed === spd;
                        return (
                          <button
                            key={spd}
                            onClick={() => {
                              setGameSpeed(spd);
                              if (isPaused) setIsPaused(false);
                              showQuickNotice(`⏩ 배속 변경: ${spd}x`);
                            }}
                            style={{
                              background: isActive ? 'linear-gradient(135deg, #d4af37, #b8860b)' : 'transparent',
                              border: 'none',
                              color: isActive ? '#1a140d' : '#d4af37',
                              fontWeight: 700,
                              fontSize: '11px',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            {spd}x
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px', borderTop: '1px solid rgba(212, 175, 55, 0.15)', paddingTop: '12px' }}>
                    <button
                      onClick={() => setIsPaused(prev => !prev)}
                      style={{
                        padding: '9px 16px',
                        borderRadius: '6px',
                        background: isPaused ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                        border: 'none',
                        color: '#fff',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                      }}
                    >
                      {isPaused ? <Play size={14} /> : <Pause size={14} />}
                      <span>{isPaused ? '▶️ 시간 흘려보내기 (Space)' : '⏸️ 시간 멈추기 (Space)'}</span>
                    </button>

                    <button
                      onClick={handlePassSeason}
                      disabled={loading}
                      style={{
                        padding: '9px 16px',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                        border: 'none',
                        color: '#fff',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                      }}
                    >
                      <FastForward size={14} />
                      <span>⏩ 계절 넘기기 (+3달)</span>
                    </button>

                    <button
                      onClick={handleAmbientRoutineAction}
                      disabled={loading}
                      style={{
                        padding: '9px 16px',
                        borderRadius: '6px',
                        background: 'rgba(212, 175, 55, 0.15)',
                        border: '1px solid rgba(212, 175, 55, 0.4)',
                        color: '#fbbf24',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>🌾 일상 근로 및 정비</span>
                    </button>
                  </div>

                  {/* Keyboard Guide Footer */}
                  <div style={{
                    marginTop: '10px',
                    paddingTop: '8px',
                    borderTop: '1px dashed rgba(255,255,255,0.08)',
                    fontSize: '11px',
                    color: '#78716c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '6px'
                  }}>
                    <span>⌨️ 단축키: Space 일시정지/재생 · [ ] 배속 조절 · 1~4 선택지 · 0 흘려보내기</span>
                  </div>
                </div>
              )}
            </div>

            {/* Auto-scroll bottom target */}
            <div ref={chronicleBottomRef} />
          </div>
        </section>

        {/* Right Column: Slim Context & Status Sidebar */}
        <aside className={styles.sideWidgetPane}>
          {/* Widget 1: Identity & Station */}
          <div className={styles.widgetCard}>
            <div className={styles.widgetTitle}>
              <User size={15} />
              <span>신분 및 정체성</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>
                  {rulerStatus.includes('소작') || rulerStatus.includes('농민') || rulerStatus.includes('평민') ? (
                    <>
                      <span style={{ color: '#a7f3d0' }}>{rulerHouse}</span> {rulerName}
                    </>
                  ) : (
                    <>
                      {rulerName} <span style={{ color: '#d4af37' }}>{rulerHouse}</span>
                    </>
                  )}
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

      {/* Past Lives Memorial Codex Modal */}
      <CKPastLivesModal
        isOpen={isPastLivesModalOpen}
        onClose={() => setIsPastLivesModalOpen(false)}
      />

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
