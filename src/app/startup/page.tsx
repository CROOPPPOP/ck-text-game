"use client";

import { useState, useEffect } from 'react';
import styles from './page.module.css';

export default function Startup() {
  const [currentStep, setCurrentStep] = useState(1);
  const innateStatsList = ['근력', '체력', '지구력', '민첩성', '반사 신경', '속도', '신체 조정력', '지각력', '지능', '기억력', '학습 능력', '의지력', '집중력'];
  const acquiredStatsList = ['통솔력', '매력', '외교력', '설득력', '기만술', '위협', '행정력', '전략', '전술', '전투력', '무기 숙련도', '기마술', '생존술', '의술', '학문', '기술 숙련도', '장인 기술', '은밀 행동', '수사력'];
  const [customStatsMode, setCustomStatsMode] = useState(false);
  const [statsData, setStatsData] = useState<Record<string, number | string>>(() => {
    const initial: Record<string, number | string> = {};
    innateStatsList.forEach(stat => initial[stat] = 50);
    acquiredStatsList.forEach(stat => initial[stat] = 0);
    return initial;
  });

  const totalInnatePoints = 650;
  const totalAcquiredPoints = 200;
  const usedInnatePoints = innateStatsList.reduce((acc, stat) => acc + (typeof statsData[stat] === 'number' ? statsData[stat] as number : 0), 0);
  const usedAcquiredPoints = acquiredStatsList.reduce((acc, stat) => acc + (typeof statsData[stat] === 'number' ? statsData[stat] as number : 0), 0);
  const remainingInnatePoints = totalInnatePoints - usedInnatePoints;
  const remainingAcquiredPoints = totalAcquiredPoints - usedAcquiredPoints;

  const traitCategories = {
    '신체특성': ['강철 체력', '흉터 투성이', '질병 취약', '매력적인 외모', '거구'],
    '정신특성': ['강인한 의지', '광기', '트라우마', '냉혹함', '광신도'],
    '감각특성': ['매의 눈', '예민한 청각', '둔감함', '밤눈 밝음'],
    '전문특성': ['검술의 달인', '뛰어난 항해술', '웅변가', '암살자', '명사수'],
    '잠재특성': ['각성 대기', '숨겨진 혈통', '저주받은 운명'],
    '일시적특성': ['전투 고양', '심한 부상', '독에 중독됨']
  };
  const [customTraitsMode, setCustomTraitsMode] = useState(false);
  const [selectedTraits, setSelectedTraits] = useState<Record<string, string[]>>({});
  const [customTraitInputs, setCustomTraitInputs] = useState<Record<string, string>>({});

  const [worldviewType, setWorldviewType] = useState('역사적');
  const [selectedArchetype, setSelectedArchetype] = useState('noble');

  interface ArchetypeConfig {
    id: string;
    num: string;
    icon: string;
    title: string;
    subtitle: string;
    badge: string;
    desc: string;
    status: string;
    location: string;
    goal: string;
    additional: string;
    trait: string;
    innateStats?: Record<string, number>;
    acquiredStats?: Record<string, number>;
    startingTraitsMap?: Record<string, string[]>;
  }

  const ARCHETYPES: ArchetypeConfig[] = [
    {
      id: 'wanderer',
      num: '1번',
      icon: '🗡️',
      title: '1. 개인 / 방랑자',
      subtitle: '낭인 · 검객 · 모험가 · 유랑 학자',
      badge: '1번: 1인칭 생존 & 무예',
      desc: '영지 없이 단신으로 여관과 산길을 떠돌며 무예와 지혜로 의뢰를 해결하고 명성을 쌓습니다.',
      status: '방랑자 (낭인 / 용병 검객)',
      location: '국경 지대 선술집 또는 숲속 야영지',
      goal: '개인의 무예 입신양명 및 영주 후원자 획득 (가신 기사 발탁 또는 독자 거점 하사)',
      additional: '영지 없이 단신으로 여관이나 산길을 떠돌며 의뢰와 현상금을 쫓는 방랑 모험가 신분. [시작 소지품]: 여행용 가죽 외투, 손때 묻은 강철 단검, 부싯돌과 밧줄, 가죽 수통, 비상 육포, 동화 35개, 휴대용 낚시 바늘.',
      trait: '[전문특성] 방랑의 달인 (확립된 특성) : 거친 야외와 여관 생활에 익숙하여 위험을 빠르게 감지합니다., [신체특성] 강철 체력 (강한 특성) : 노숙과 풍찬노숙에도 잔병치레 없이 버텨냅니다., [감각특성] 매의 눈 (잠재 특성) : 주변의 살기와 수상한 낌새를 예리하게 포착합니다.',
      innateStats: {
        '민첩성': 65, '반사 신경': 65, '속도': 60, '신체 조정력': 55, '지각력': 65,
        '의지력': 60, '지구력': 60, '체력': 55, '근력': 55, '지능': 45,
        '기억력': 45, '학습 능력': 40, '집중력': 40
      },
      acquiredStats: {
        '생존술': 40, '무기 숙련도': 35, '전투력': 30, '은밀 행동': 30, '수사력': 20,
        '의술': 15, '기마술': 15, '설득력': 15, '통솔력': 0, '매력': 0, '외교력': 0,
        '기만술': 0, '위협': 0, '행정력': 0, '전략': 0, '전술': 0, '학문': 0, '기술 숙련도': 0, '장인 기술': 0
      },
      startingTraitsMap: {
        '신체특성': ['강철 체력'],
        '감각특성': ['매의 눈'],
        '전문특성': ['검술의 달인']
      }
    },
    {
      id: 'company',
      num: '2번',
      icon: '👥',
      title: '2. 소규모 집단',
      subtitle: '용병단장 · 상단 행수 · 의적 두목',
      badge: '2번: 집단 통솔 & 군자금',
      desc: '10~30여 명의 정예 단원과 숙영지를 이끌며 영주들의 고용 계약을 수주하고 부를 축적합니다.',
      status: '용병단장 (또는 대상단 행수)',
      location: '전선 인근 상설 숙영지 또는 무역 거점',
      goal: '명성을 떨치는 대용병단 구축 및 독립 거점(폐성 점령 또는 남작령 분봉) 획득',
      additional: '단원 20여 명을 이끄는 소규모 용병단. 매 턴 단원 주급 및 식량 보급 유지비 지출. [시작 소지품]: 단장의 장검 및 사슬 갑옷, 용병단 군기, 단원 20명(보병 15, 궁수 5), 마차 2대, 텐트 숙영지, 군자금 금화 120닢.',
      trait: '[전문특성] 용병 계약 협상가 (확립된 특성) : 고용주와의 보수 협상 및 부대 사기 관리에 능합니다., [정신특성] 강인한 의지 (강한 특성) : 전장의 공포 앞에서도 부하들을 질타하며 전열을 유지시킵니다., [전문특성] 전술적 안목 (잠재 특성) : 지형과 진형의 유불리를 빠르게 파악합니다.',
      innateStats: {
        '근력': 65, '체력': 65, '의지력': 65, '지구력': 60, '지각력': 55,
        '신체 조정력': 50, '지능': 50, '집중력': 50, '민첩성': 50, '반사 신경': 50,
        '속도': 45, '기억력': 45, '학습 능력': 50
      },
      acquiredStats: {
        '통솔력': 45, '전술': 35, '전투력': 30, '위협': 25, '무기 숙련도': 25,
        '기마술': 20, '행정력': 10, '생존술': 10, '매력': 0, '외교력': 0, '설득력': 0,
        '기만술': 0, '전략': 0, '의술': 0, '학문': 0, '기술 숙련도': 0, '장인 기술': 0, '은밀 행동': 0, '수사력': 0
      },
      startingTraitsMap: {
        '정신특성': ['강인한 의지'],
        '전문특성': ['검술의 달인']
      }
    },
    {
      id: 'clergy',
      num: '3번',
      icon: '⛪',
      title: '3. 성직자 / 수도자',
      subtitle: '사제 · 수도승 · 순례자 · 이단 심문관',
      badge: '3번: 신앙 & 교단 발언권',
      desc: '독신 서약과 신앙심, 고문서 학식을 바탕으로 교구 민심을 이끌고 종교적 권위를 세웁니다.',
      status: '사제 (수도사 / 수도원 주임)',
      location: '한적한 시골 수도원 또는 작은 교구 예배당',
      goal: '교단 내 발언권 신장 및 대주교/교단 지도자 승격, 성유물 발굴 및 교구 부흥',
      additional: '독신 서약을 지키며 교구 신도들을 지도하고 성유물을 탐구하는 경건한 성직자. [시작 소지품]: 양모 사제복, 은 십자가 묵주, 라틴어 성경 사본, 필사용 깃펜과 잉크, 성유물 함(비어있음), 작은 예배당, 수도사 8명, 십일조 은화 50닢.',
      trait: '[정신특성] 경건한 신앙 (강한 특성) : 세속의 유혹에 굴하지 않고 교단의 규율을 엄격히 수호합니다., [전문특성] 고문서 필사 및 신학 (확립된 특성) : 라틴어와 고대 경전을 해독하고 필사하는 데 능통합니다., [전문특성] 영적 치유와 약초학 (잠재 특성) : 아픈 신도들을 돌보고 약초를 조제하는 지혜가 있습니다.',
      innateStats: {
        '지능': 70, '학습 능력': 70, '기억력': 65, '의지력': 65, '집중력': 65,
        '지각력': 60, '지구력': 50, '체력': 45, '신체 조정력': 40, '근력': 40,
        '민첩성': 40, '반사 신경': 40, '속도': 45
      },
      acquiredStats: {
        '학문': 50, '설득력': 35, '의술': 30, '외교력': 25, '매력': 25,
        '행정력': 20, '수사력': 15, '통솔력': 0, '기만술': 0, '위협': 0, '전략': 0,
        '전술': 0, '전투력': 0, '무기 숙련도': 0, '기마술': 0, '생존술': 0, '기술 숙련도': 0, '장인 기술': 0, '은밀 행동': 0
      },
      startingTraitsMap: {
        '정신특성': ['강인한 의지'],
        '전문특성': ['웅변가']
      }
    },
    {
      id: 'noble',
      num: '4번',
      icon: '👑',
      title: '4. 봉건 영주 / 귀족',
      subtitle: '성주 · 남작 · 백작 · 지방관',
      badge: '4번: 영지 통치 & 가문 혈통',
      desc: '장원과 백성을 거느리고 가문의 대를 이어가며 외교와 전쟁을 총지휘하는 통치자입니다.',
      status: '봉건 영주 (남작 / 백작)',
      location: '가문의 본성 (영지 성채)',
      goal: '영지 확장 및 공작/국왕 등극, 명문 왕조 창건',
      additional: '영지와 가문의 번영을 위해 외교와 군사를 지휘하는 전통적 봉건 영주. [시작 소지품]: 본성 성채(Lv.1), 징집병 50명, 가문 인장 반지, 장원 백성 250가구, 국고 금화 350닢.',
      trait: '[전문특성] 명문 혈통 (확립된 특성) : 주변 제후들에게 정당한 통치 명분과 혈통의 인정을 받습니다.',
      innateStats: {
        '근력': 50, '체력': 50, '지구력': 50, '민첩성': 50, '반사 신경': 50,
        '속도': 50, '신체 조정력': 50, '지각력': 50, '지능': 50, '기억력': 50,
        '학습 능력': 50, '의지력': 50, '집중력': 50
      },
      acquiredStats: {
        '통솔력': 30, '외교력': 30, '행정력': 30, '매력': 25, '전술': 25,
        '무기 숙련도': 20, '기마술': 20, '학문': 20, '설득력': 0, '기만술': 0,
        '위협': 0, '전략': 0, '전투력': 0, '생존술': 0, '의술': 0, '기술 숙련도': 0, '장인 기술': 0, '은밀 행동': 0, '수사력': 0
      },
      startingTraitsMap: {
        '전문특성': ['웅변가']
      }
    }
  ];

  const handleSelectArchetype = (archId: string) => {
    const arch = ARCHETYPES.find(a => a.id === archId);
    if (!arch) return;
    setSelectedArchetype(archId);

    // 스탯 동기화
    if (arch.innateStats && arch.acquiredStats) {
      const mergedStats = { ...arch.innateStats, ...arch.acquiredStats };
      setStatsData(mergedStats);
      setFormData(prev => ({
        ...prev,
        archetype: archId,
        playerStatus: arch.status,
        startLocation: arch.location,
        finalGoal: arch.goal,
        additionalSettings: arch.additional,
        traits: arch.trait,
        stats: Object.entries(mergedStats).map(([k, v]) => `${k}: ${v}`).join(', ')
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        archetype: archId,
        playerStatus: arch.status,
        startLocation: arch.location,
        finalGoal: arch.goal,
        additionalSettings: arch.additional,
        traits: arch.trait
      }));
    }

    // 특성 동기화
    if (arch.startingTraitsMap) {
      setSelectedTraits(arch.startingTraitsMap);
      syncTraitsToFormData(arch.startingTraitsMap);
    }
  };

  const [formData, setFormData] = useState({
    apiKey: '',
    era: '',
    worldview: '역사적',
    character: '',
    difficulty: '보통',
    languageMode: '한국어',
    finalGoal: '',
    playerStatus: '',
    startLocation: '',
    additionalSettings: '',
    archetype: 'noble',
    stats: '무력: 50, 지력: 50, 매력: 50, 재력: 50, 운: 50',
    traits: '[초보자] 이제 막 모험을 시작했습니다.',
    inheritedState: null as any
  });

  useEffect(() => {
    const savedKey = localStorage.getItem("ck_api_key");
    if (savedKey) {
      setFormData(fd => ({ ...fd, apiKey: savedKey }));
    }
  }, []);

  useEffect(() => {
    const inheritedData = localStorage.getItem("ck_inheritance");
    if (inheritedData) {
      try {
        const parsed = JSON.parse(inheritedData);
        setFormData(fd => ({ 
          ...fd, 
          character: parsed.heir || '후계자',
          inheritedState: parsed 
        }));
        setCurrentStep(2); // Skip Step 1
      } catch (err) {}
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleReset = () => {
    if (confirm("모든 설정 내역을 초기화하시겠습니까?")) {
      setFormData({
        apiKey: formData.apiKey, // Keep the API key during reset
        era: '',
        worldview: '역사적',
        character: '',
        difficulty: '보통',
        languageMode: '한국어',
        finalGoal: '',
        playerStatus: '',
        startLocation: '',
        additionalSettings: '',
        archetype: 'noble',
        stats: '무력: 50, 지력: 50, 매력: 50, 재력: 50, 운: 50',
        traits: '[초보자] 이제 막 모험을 시작했습니다.',
        inheritedState: null as any
      });
      const initialStats: Record<string, number | string> = {};
      innateStatsList.forEach(stat => initialStats[stat] = 50);
      acquiredStatsList.forEach(stat => initialStats[stat] = 0);
      setStatsData(initialStats);
      setSelectedTraits({});
      setCustomTraitInputs({});
      setWorldviewType('역사적');
      setCurrentStep(1);
    }
  };

  const handleStatChange = (stat: string, delta: number) => {
    setStatsData(prev => {
      const currentVal = typeof prev[stat] === 'number' ? prev[stat] as number : 0;
      const newVal = Math.max(0, Math.min(100, currentVal + delta));
      const nextData = { ...prev, [stat]: newVal };
      if (!customStatsMode) {
         setFormData(fd => ({ ...fd, stats: Object.entries(nextData).map(([k,v]) => `${k}: ${v === '' ? 0 : v}`).join(', ') }));
      }
      return nextData;
    });
  };

  const handleStatInput = (stat: string, value: string) => {
    setStatsData(prev => {
      const nextData = { ...prev };
      if (value === "") {
        nextData[stat] = "";
      } else {
        let newVal = parseInt(value, 10);
        if (isNaN(newVal)) return prev;
        newVal = Math.max(0, Math.min(100, newVal));
        nextData[stat] = newVal;
      }
      if (!customStatsMode) {
         setFormData(fd => ({ ...fd, stats: Object.entries(nextData).map(([k,v]) => `${k}: ${v === '' ? 0 : v}`).join(', ') }));
      }
      return nextData;
    });
  };

  const syncTraitsToFormData = (traitsDict: Record<string, string[]>) => {
    const traitStrings: string[] = [];
    Object.entries(traitsDict).forEach(([cat, traits]) => {
      traits.forEach(t => traitStrings.push(`[${cat}] ${t}`));
    });
    setFormData(fd => ({ ...fd, traits: traitStrings.join(', ') }));
  };

  const toggleTrait = (category: string, traitName: string) => {
    setSelectedTraits(prev => {
      const catTraits = prev[category] || [];
      const isSelected = catTraits.includes(traitName);
      const newCatTraits = isSelected ? catTraits.filter(t => t !== traitName) : [...catTraits, traitName];
      const nextTraits = { ...prev, [category]: newCatTraits };
      if (!customTraitsMode) syncTraitsToFormData(nextTraits);
      return nextTraits;
    });
  };

  const handleCustomTraitAdd = (category: string) => {
    const val = customTraitInputs[category];
    if (!val || val.trim() === '') return;
    
    setSelectedTraits(prev => {
      const catTraits = prev[category] || [];
      if (catTraits.includes(val)) return prev;
      const nextTraits = { ...prev, [category]: [...catTraits, val] };
      if (!customTraitsMode) syncTraitsToFormData(nextTraits);
      return nextTraits;
    });
    setCustomTraitInputs(prev => ({ ...prev, [category]: '' }));
  };

  const [isRecommending, setIsRecommending] = useState(false);

  const handleRecommend = async () => {
    setIsRecommending(true);
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData })
      });
      const data = await res.json();
      if (data.config) {
        setFormData(fd => ({
          ...fd,
          era: data.config.era || fd.era,
          worldview: data.config.worldview || fd.worldview,
          character: data.config.character || fd.character,
          finalGoal: data.config.finalGoal || fd.finalGoal,
          playerStatus: data.config.playerStatus || fd.playerStatus,
          startLocation: data.config.startLocation || fd.startLocation,
          additionalSettings: data.config.additionalSettings || fd.additionalSettings
        }));
        
        if (data.config.stats) {
          setStatsData(prev => ({ ...prev, ...data.config.stats }));
        }

        if (data.config.traits && Array.isArray(data.config.traits)) {
          const newTraits: Record<string, string[]> = {};
          data.config.traits.forEach((t: any) => {
            if (!newTraits[t.category]) newTraits[t.category] = [];
            newTraits[t.category].push(t.name);
          });
          setSelectedTraits(newTraits);
          syncTraitsToFormData(newTraits);
        }
        alert("AI가 추천 설정을 구성했습니다! 스탯과 특성을 확인하고 게임을 시작해보세요.");
      } else {
        alert("추천 설정을 가져오는데 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("서버 통신 오류가 발생했습니다.");
    }
    setIsRecommending(false);
  };

  const [isValidating, setIsValidating] = useState(false);

  const handleStart = async () => {
    setIsValidating(true);
    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData })
      });
      const data = await res.json();
      if (!data.valid) {
        alert(data.reason || "세계관 고증에 맞지 않는 설정이 있습니다. 수정 후 다시 시도해주세요.");
        setIsValidating(false);
        return; // 중단
      }
    } catch (err) {
      console.error(err);
      // 검증 실패(네트워크 오류 등) 시 일단 넘어가도록
    }

    console.log("게임 시작 요청", formData);
    if (formData.inheritedState) {
      // 상속인 경우, 이전 상태를 병합하여 새로운 추가 설정을 만듭니다.
      const inheritanceContext = `
[세대 교체 발동] 이전 세대 캐릭터가 사망(또는 퇴위)하여 그의 후계자 '${formData.character}'(으)로 세대가 교체되었습니다.
이전 캐릭터가 남긴 다음의 [가문 정보], [세력 상태], [소지품]을 그대로 승계받은 상태에서 오프닝 턴을 작성하세요.

가문 정보: ${JSON.stringify(formData.inheritedState.familyState)}
세력 상태: ${JSON.stringify(formData.inheritedState.factionState)}
소지품: ${JSON.stringify(formData.inheritedState.inventory)}
`;
      const finalFormData = {
        ...formData,
        additionalSettings: inheritanceContext,
        previousState: formData.inheritedState.previousState
      };
      localStorage.setItem("ck_startup_config", JSON.stringify(finalFormData));
      localStorage.removeItem("ck_inheritance");
    } else {
      localStorage.setItem("ck_startup_config", JSON.stringify(formData));
    }
    window.location.href = "/";
  };

  return (
    <main className={styles.container}>
      <div className={`glass-panel ${styles.formPanel}`}>
        <div style={{ position: 'relative' }}>
          <button 
            style={{ position: 'absolute', top: 0, left: 0, padding: '8px 12px', background: 'var(--panel-bg)', color: 'var(--text-main)', border: '1px solid var(--panel-border)', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s', zIndex: 10 }}
            onClick={() => window.location.href = '/'}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--gold-accent)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--panel-border)'}
          >
            🏠 메인 타이틀로
          </button>
          <button 
            style={{ position: 'absolute', top: 0, right: 0, padding: '8px 12px', background: 'var(--panel-bg)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.5)', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s', zIndex: 10 }}
            onClick={handleReset}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'; e.currentTarget.style.background = 'var(--panel-bg)'; }}
          >
            🔄 일괄 초기화
          </button>
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <img src="/logo.jpg" alt="CHRONICLES" style={{ height: '60px', borderRadius: '4px', border: '1px solid var(--gold-accent)' }} />
          </div>
          <h1 className={styles.title} style={{ textAlign: 'center' }}>【 게임 시작 설정 】</h1>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px', fontSize: '1.1rem' }}>
          <div style={{ color: currentStep === 1 ? 'var(--gold-accent)' : 'var(--text-muted)', fontWeight: currentStep === 1 ? 'bold' : 'normal', transition: 'color 0.3s' }}>1. 기본 설정</div>
          <div style={{ color: 'var(--text-muted)' }}>&gt;</div>
          <div style={{ color: currentStep === 2 ? 'var(--gold-accent)' : 'var(--text-muted)', fontWeight: currentStep === 2 ? 'bold' : 'normal', transition: 'color 0.3s' }}>2. 능력치</div>
          <div style={{ color: 'var(--text-muted)' }}>&gt;</div>
          <div style={{ color: currentStep === 3 ? 'var(--gold-accent)' : 'var(--text-muted)', fontWeight: currentStep === 3 ? 'bold' : 'normal', transition: 'color 0.3s' }}>3. 시작 특성</div>
        </div>

        {currentStep === 1 && (
          <div className={styles.fieldsGrid} style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
            <div className={styles.fieldRow}>
               <label className={styles.fieldLabel}>API KEY:</label>
               <input 
                 type="password"
                 name="apiKey"
                 className={styles.inputField}
                 placeholder="입력..."
                 value={formData.apiKey}
                 onChange={(e) => {
                   handleChange(e);
                   localStorage.setItem("ck_api_key", e.target.value);
                 }}
               />
             </div>
            <div className={styles.fieldRow}>
              <label className={styles.fieldLabel}>시대:</label>
              <input type="text" name="era" className={styles.inputField} placeholder="입력" value={formData.era} onChange={handleChange} />
            </div>
            <div className={styles.fieldRow}>
              <label className={styles.fieldLabel}>세계관:</label>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '10px' }}>
                <select 
                  className={styles.selectField} 
                  style={{ width: '180px' }}
                  value={worldviewType}
                  onChange={(e) => {
                    setWorldviewType(e.target.value);
                    if (e.target.value !== '자유 입력') {
                       setFormData({ ...formData, worldview: e.target.value });
                    } else {
                       setFormData({ ...formData, worldview: '' });
                    }
                  }}
                >
                  <option value="역사적">역사적 (Historical)</option>
                  <option value="역사 기반 대체역사">역사 기반 대체역사</option>
                  <option value="자유 입력">자유 입력 (Custom)</option>
                </select>
                {worldviewType === '자유 입력' && (
                  <input type="text" name="worldview" className={styles.inputField} placeholder="원하는 세계관 직접 입력" value={formData.worldview} onChange={handleChange} />
                )}
              </div>
            </div>
            <div className={styles.fieldRow}>
              <label className={styles.fieldLabel}>인물:</label>
              <input type="text" name="character" className={styles.inputField} placeholder="예: 이순신 (실존) 또는 아서 (가상)" value={formData.character} onChange={handleChange} />
            </div>
            <div className={styles.fieldRow}>
              <label className={styles.fieldLabel}>난이도:</label>
              <select name="difficulty" className={styles.selectField} value={formData.difficulty} onChange={handleChange}>
                <option value="쉬움">쉬움</option>
                <option value="보통">보통</option>
                <option value="현실적">현실적</option>
                <option value="어려움">어려움</option>
                <option value="매우 어려움">매우 어려움</option>
              </select>
            </div>
            <div className={styles.fieldRow}>
              <label className={styles.fieldLabel}>언어 모드:</label>
              <select name="languageMode" className={styles.selectField} value={formData.languageMode} onChange={handleChange}>
                <option value="한국어">한국어</option>
                <option value="고증 언어">고증 언어</option>
                <option value="혼합">혼합</option>
              </select>
            </div>

            {/* 👑 시작 신분 아키타입 선택 (Origin Archetype) */}
            <div className={styles.fieldRow} style={{ gridColumn: '1 / -1', flexDirection: 'column', alignItems: 'stretch', gap: '10px', marginTop: '10px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <label className={styles.fieldLabel} style={{ fontSize: '1.05rem', color: 'var(--gold-accent)', fontWeight: 'bold' }}>
                  👑 시작 신분 아키타입 (Origin Archetype):
                </label>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  원하는 신분을 클릭하면 추천 설정이 자동 입력됩니다.
                </span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '12px' }}>
                {ARCHETYPES.map((arch) => {
                  const isSelected = selectedArchetype === arch.id;
                  return (
                    <div
                      key={arch.id}
                      onClick={() => handleSelectArchetype(arch.id)}
                      style={{
                        padding: '14px',
                        background: isSelected 
                          ? 'linear-gradient(145deg, rgba(212, 175, 55, 0.2), rgba(15, 23, 42, 0.8))'
                          : 'rgba(0, 0, 0, 0.35)',
                        border: isSelected ? '2px solid var(--gold-accent)' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 0 15px rgba(212, 175, 55, 0.25)' : 'none',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.5)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                          e.currentTarget.style.transform = 'none';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '1.8rem' }}>{arch.icon}</span>
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: isSelected ? 'var(--gold-accent)' : 'rgba(255, 255, 255, 0.1)',
                          color: isSelected ? '#111' : 'var(--text-muted)',
                          fontWeight: 'bold'
                        }}>
                          {arch.badge}
                        </span>
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: isSelected ? 'var(--gold-hover)' : 'var(--text-main)', marginBottom: '4px' }}>
                        {arch.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: isSelected ? '#bae6fd' : 'var(--text-muted)', marginBottom: '8px' }}>
                        {arch.subtitle}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        {arch.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.fieldRow}>
              <label className={styles.fieldLabel}>플레이어 신분:</label>
              <input type="text" name="playerStatus" className={styles.inputField} placeholder="예: 입력하신 시대에 맞는 신분 (양반, 영주 등)" value={formData.playerStatus} onChange={handleChange} />
            </div>
            <div className={styles.fieldRow}>
              <label className={styles.fieldLabel}>시작 위치:</label>
              <input type="text" name="startLocation" className={styles.inputField} placeholder="입력" value={formData.startLocation} onChange={handleChange} />
            </div>
            <div className={styles.fieldRow} style={{ gridColumn: '1 / -1' }}>
              <label className={styles.fieldLabel}>추가 설정:</label>
              <input type="text" name="additionalSettings" className={styles.inputField} placeholder="입력" value={formData.additionalSettings} onChange={handleChange} />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className={styles.fieldsGrid} style={{ display: 'flex', flexDirection: 'column', maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ color: 'var(--gold-accent)', fontSize: '1.4rem', marginBottom: '5px' }}>초기 능력치 설정</h2>
                {!customStatsMode && <div style={{ color: 'var(--text-muted)' }}>스탯을 룰북에 맞게 분배해주세요.</div>}
              </div>
              <button className={styles.actionBtn} style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={() => setCustomStatsMode(!customStatsMode)}>
                {customStatsMode ? '정형화 모드로 전환 🔄' : '자유 입력 모드로 전환 🔄'}
              </button>
            </div>

            {customStatsMode ? (
              <textarea name="stats" className={styles.inputField} placeholder="무력: 50, 지력: 50..." value={formData.stats} onChange={handleChange} style={{ height: '300px', resize: 'vertical' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                    <h3 style={{ color: 'var(--text-main)', margin: 0 }}>[선천 능력치]</h3>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>남은 포인트: <span style={{ color: remainingInnatePoints >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold' }}>{remainingInnatePoints}</span> / {totalInnatePoints}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    {innateStatsList.map(stat => (
                      <div key={stat} style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                        <div style={{ width: '80px', fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.9rem' }}>{stat}</div>
                        <div style={{ flex: 1, margin: '0 15px', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', position: 'relative' }}>
                          <div style={{ width: `${statsData[stat]}%`, height: '100%', background: 'var(--gold-accent)', borderRadius: '4px', transition: 'width 0.2s' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <button onClick={() => handleStatChange(stat, -1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer' }}>-</button>
                          <input 
                            type="number" 
                            min="0" max="100" 
                            value={statsData[stat] === 0 ? 0 : (statsData[stat] || '')} 
                            onChange={(e) => handleStatInput(stat, e.target.value)} 
                            style={{ width: '40px', textAlign: 'center', fontWeight: 'bold', color: 'var(--gold-hover)', fontSize: '0.9rem', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.2)', outline: 'none', WebkitAppearance: 'none' }} 
                          />
                          <button onClick={() => handleStatChange(stat, 1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                    <h3 style={{ color: 'var(--text-main)', margin: 0 }}>[후천 능력치]</h3>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>남은 포인트: <span style={{ color: remainingAcquiredPoints >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold' }}>{remainingAcquiredPoints}</span> / {totalAcquiredPoints}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    {acquiredStatsList.map(stat => (
                      <div key={stat} style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                        <div style={{ width: '80px', fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.9rem' }}>{stat}</div>
                        <div style={{ flex: 1, margin: '0 15px', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', position: 'relative' }}>
                          <div style={{ width: `${statsData[stat]}%`, height: '100%', background: 'var(--gold-accent)', borderRadius: '4px', transition: 'width 0.2s' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <button onClick={() => handleStatChange(stat, -1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer' }}>-</button>
                          <input 
                            type="number" 
                            min="0" max="100" 
                            value={statsData[stat] === 0 ? 0 : (statsData[stat] || '')} 
                            onChange={(e) => handleStatInput(stat, e.target.value)} 
                            style={{ width: '40px', textAlign: 'center', fontWeight: 'bold', color: 'var(--gold-hover)', fontSize: '0.9rem', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.2)', outline: 'none', WebkitAppearance: 'none' }} 
                          />
                          <button onClick={() => handleStatChange(stat, 1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div className={styles.fieldsGrid} style={{ display: 'flex', flexDirection: 'column', maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: 'var(--gold-accent)', fontSize: '1.4rem', marginBottom: '5px' }}>시작 특성 설정</h2>
              <button className={styles.actionBtn} style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={() => setCustomTraitsMode(!customTraitsMode)}>
                {customTraitsMode ? '정형화 모드로 전환 🔄' : '자유 입력 모드로 전환 🔄'}
              </button>
            </div>

            {customTraitsMode ? (
              <textarea name="traits" className={styles.inputField} placeholder="예: [신체특성] 다혈질, [전문특성] 뛰어난 검술" value={formData.traits} onChange={handleChange} style={{ height: '300px', resize: 'vertical' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {Object.entries(traitCategories).map(([category, predefinedTraits]) => (
                  <div key={category} style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                    <h3 style={{ color: 'var(--text-main)', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>[{category}]</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                      {Array.from(new Set([...predefinedTraits, ...(selectedTraits[category] || [])])).map(trait => {
                        const isSelected = (selectedTraits[category] || []).includes(trait);
                        return (
                          <div 
                            key={trait} 
                            onClick={() => toggleTrait(category, trait)}
                            style={{ 
                              padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s',
                              border: isSelected ? '1px solid var(--gold-accent)' : '1px solid rgba(255,255,255,0.2)',
                              background: isSelected ? 'rgba(212,175,55,0.2)' : 'rgba(0,0,0,0.5)',
                              color: isSelected ? 'var(--gold-hover)' : 'var(--text-muted)'
                            }}
                          >
                            {trait}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input 
                        type="text" 
                        placeholder={`${category} 직접 추가...`} 
                        className={styles.inputField} 
                        style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                        value={customTraitInputs[category] || ''}
                        onChange={(e) => setCustomTraitInputs(prev => ({...prev, [category]: e.target.value}))}
                        onKeyDown={(e) => e.key === 'Enter' && handleCustomTraitAdd(category)}
                      />
                      <button className={styles.actionBtn} style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => handleCustomTraitAdd(category)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className={styles.instruction} style={{ marginTop: '20px' }}>
              추천 설정을 클릭하시면 AI가 설정된 기본 정보를 바탕으로 적절한 능력치와 특성을 자동 배분해드립니다.
            </div>
          </div>
        )}

        <div className={styles.buttonContainer}>
          {currentStep > 1 && (
            <button className={styles.actionBtn} style={{flex: 1}} onClick={() => setCurrentStep(prev => prev - 1)}>이전</button>
          )}
          
          {currentStep < 3 ? (
            <button className={`${styles.actionBtn} ${styles.primaryBtn}`} style={{flex: 1}} onClick={() => setCurrentStep(prev => prev + 1)}>다음 단계</button>
          ) : (
            <>
              <button className={styles.actionBtn} style={{flex: 1, background: isRecommending ? 'rgba(255,255,255,0.1)' : 'var(--panel-bg)'}} onClick={handleRecommend} disabled={isRecommending}>
                {isRecommending ? "세계 구성 중... ⏳" : "AI 추천 설정 🎲"}
              </button>
              <button className={`${styles.actionBtn} ${styles.primaryBtn}`} style={{flex: 2}} onClick={handleStart} disabled={isValidating}>
                {isValidating ? "역사적 고증 검증 중... ⏳" : "새로운 역사 시작하기"}
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
