"use client";

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import {
  calculate5AttributesFromStats,
  PERSONALITY_PAIRS,
  CONGENITAL_POINT_TRAITS,
  DYNASTY_LEGACIES,
  PersonalityTraitDef,
  CongenitalPointTrait,
  DynastyLegacyDef
} from '@/lib/engine/customizationTypes';
import {
  CULTURE_REGIONS,
  CultureRegion,
  REGIONAL_ARCHETYPES,
  StatusPreset,
  ArchetypeConfig
} from '@/lib/engine/culturalPresets';

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

  // 4축 커스터마이징 상태 (Dynasty Legacy, Personality, Congenital Point-Buy)
  const [dynastyLegacy, setDynastyLegacy] = useState<'martial' | 'holy' | 'merchant'>('martial');
  const [personalityTraits, setPersonalityTraits] = useState<string[]>(['brave', 'generous']);
  const [congenitalTraits, setCongenitalTraits] = useState<string[]>(['quick']);
  const [traitSubTab, setTraitSubTab] = useState<'personality' | 'congenital' | 'custom'>('personality');

  const congenitalBudget = 70;
  const usedCongenitalPoints = congenitalTraits.reduce((sum, id) => {
    const t = CONGENITAL_POINT_TRAITS.find(trait => trait.id === id);
    return sum + (t ? t.cost : 0);
  }, 0);
  const remainingCongenitalPoints = congenitalBudget - usedCongenitalPoints;

  const togglePersonality = (traitId: string) => {
    setPersonalityTraits(prev => {
      if (prev.includes(traitId)) {
        return prev.filter(id => id !== traitId);
      }
      let oppositeId: string | undefined;
      for (const pair of PERSONALITY_PAIRS) {
        if (pair.positive.id === traitId) oppositeId = pair.opposite.id;
        if (pair.opposite.id === traitId) oppositeId = pair.positive.id;
      }
      const filtered = oppositeId ? prev.filter(id => id !== oppositeId) : prev;
      if (filtered.length >= 3) {
        alert("CK3 정통 성격 특성은 최대 3개까지 선택할 수 있습니다. 기존 특성을 해제 후 선택해주세요.");
        return prev;
      }
      return [...filtered, traitId];
    });
  };

  const toggleCongenital = (traitId: string) => {
    const trait = CONGENITAL_POINT_TRAITS.find(t => t.id === traitId);
    if (!trait) return;
    setCongenitalTraits(prev => {
      if (prev.includes(traitId)) {
        return prev.filter(id => id !== traitId);
      }
      const nextTotalCost = usedCongenitalPoints + trait.cost;
      if (trait.cost > 0 && nextTotalCost > congenitalBudget) {
        alert(`선천 특성 포인트가 부족합니다!\n(필요: ${trait.cost}P, 남은 예산: ${remainingCongenitalPoints}P)\n부정적 결함(둔재, 허약함, 추남 등)을 선택해 포인트를 확보하십시오.`);
        return prev;
      }
      return [...prev, traitId];
    });
  };

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

  const [cultureRegion, setCultureRegion] = useState<CultureRegion>('europe');

  const ARCHETYPES: ArchetypeConfig[] = REGIONAL_ARCHETYPES[cultureRegion] || REGIONAL_ARCHETYPES['europe'];

  const handleSelectCultureRegion = (region: CultureRegion) => {
    setCultureRegion(region);
    const regionalArchetypes = REGIONAL_ARCHETYPES[region];
    const targetArch = regionalArchetypes.find(a => a.id === selectedArchetype) || regionalArchetypes[0];
    if (targetArch) {
      setSelectedArchetype(targetArch.id);
      const defaultPreset = targetArch.statusPresets.find(p => p.playerStatus === targetArch.status) || targetArch.statusPresets[0];
      if (defaultPreset) {
        setSelectedStatusPresetId(defaultPreset.id);
      }
      if (targetArch.innateStats && targetArch.acquiredStats) {
        const mergedStats = { ...targetArch.innateStats, ...targetArch.acquiredStats };
        setStatsData(mergedStats);
        setFormData(prev => ({
          ...prev,
          archetype: targetArch.id,
          playerStatus: defaultPreset?.playerStatus || targetArch.status,
          startLocation: targetArch.location,
          finalGoal: defaultPreset?.goal || targetArch.goal,
          additionalSettings: defaultPreset?.additional || targetArch.additional,
          traits: targetArch.trait,
          stats: Object.entries(mergedStats).map(([k, v]) => `${k}: ${v}`).join(', ')
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          archetype: targetArch.id,
          playerStatus: defaultPreset?.playerStatus || targetArch.status,
          startLocation: targetArch.location,
          finalGoal: defaultPreset?.goal || targetArch.goal,
          additionalSettings: defaultPreset?.additional || targetArch.additional,
          traits: targetArch.trait
        }));
      }
      if (targetArch.startingTraitsMap) {
        setSelectedTraits(targetArch.startingTraitsMap);
        syncTraitsToFormData(targetArch.startingTraitsMap);
      }
    }
  };

    const [selectedStatusPresetId, setSelectedStatusPresetId] = useState<string>('baron');

  const handleSelectStatusPreset = (preset: StatusPreset) => {
    setSelectedStatusPresetId(preset.id);
    setFormData(prev => ({
      ...prev,
      playerStatus: preset.playerStatus,
      finalGoal: preset.goal || prev.finalGoal,
      additionalSettings: preset.additional || prev.additionalSettings
    }));
  };

  const handleSelectArchetype = (archId: string) => {
    const arch = ARCHETYPES.find(a => a.id === archId);
    if (!arch) return;
    setSelectedArchetype(archId);

    const defaultPreset = arch.statusPresets.find(p => p.playerStatus === arch.status) || arch.statusPresets?.[0];
    if (defaultPreset) {
      setSelectedStatusPresetId(defaultPreset.id);
    }

    // 스탯 동기화
    if (arch.innateStats && arch.acquiredStats) {
      const mergedStats = { ...arch.innateStats, ...arch.acquiredStats };
      setStatsData(mergedStats);
      setFormData(prev => ({
        ...prev,
        archetype: archId,
        playerStatus: defaultPreset?.playerStatus || arch.status,
        startLocation: arch.location,
        finalGoal: defaultPreset?.goal || arch.goal,
        additionalSettings: defaultPreset?.additional || arch.additional,
        traits: arch.trait,
        stats: Object.entries(mergedStats).map(([k, v]) => `${k}: ${v}`).join(', ')
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        archetype: archId,
        playerStatus: defaultPreset?.playerStatus || arch.status,
        startLocation: arch.location,
        finalGoal: defaultPreset?.goal || arch.goal,
        additionalSettings: defaultPreset?.additional || arch.additional,
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
    finalGoal: '인근 분쟁 승리 및 남작령 요새 확장, 자작위/백작위 수임',
    playerStatus: '남작',
    startLocation: '가문의 본성 (영지 성채)',
    additionalSettings: '',
    archetype: 'noble',
    houseName: '',
    houseMotto: '',
    houseCrest: '🦁 황금 사자',
    houseFocus: '외교와 정략혼 (Diplomatic Marriage)',
    stats: '무력: 50, 지력: 50, 매력: 50, 재력: 50, 운: 50',
    traits: '[전문특성] 명문 혈통',
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
        finalGoal: '인근 분쟁 승리 및 남작령 요새 확장, 자작위/백작위 수임',
        playerStatus: '남작',
        startLocation: '가문의 본성 (영지 성채)',
        additionalSettings: '',
        archetype: 'noble',
        houseName: '',
        houseMotto: '',
        houseCrest: '🦁 황금 사자',
        houseFocus: '외교와 정략혼 (Diplomatic Marriage)',
        stats: '무력: 50, 지력: 50, 매력: 50, 재력: 50, 운: 50',
        traits: '[전문특성] 명문 혈통',
        inheritedState: null as any
      });
      const initialStats: Record<string, number | string> = {};
      innateStatsList.forEach(stat => initialStats[stat] = 50);
      acquiredStatsList.forEach(stat => initialStats[stat] = 0);
      setStatsData(initialStats);
      setSelectedTraits({});
      setCustomTraitInputs({});
      setWorldviewType('역사적');
      setSelectedArchetype('noble');
      setSelectedStatusPresetId('baron');
      setDynastyLegacy('martial');
      setPersonalityTraits(['brave', 'generous']);
      setCongenitalTraits(['quick']);
      setTraitSubTab('personality');
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

  const handleStart = async () => {
    // 인물 이름 필수 검증
    if (!formData.character || formData.character.trim() === '') {
      alert("인물(캐릭터 이름)을 입력해주세요. (예: 샤를 드 발루아)");
      setCurrentStep(1);
      return;
    }

    console.log("게임 시작 요청", formData);

    let finalAdditional = formData.additionalSettings || '';
    if (formData.archetype === 'noble' && (formData.houseName || formData.houseMotto)) {
      const houseDesc = `[가문 및 혈통 설정] 가문명: ${formData.houseName || '유력 귀족 가문'} | 가언(모토): "${formData.houseMotto || '명예와 긍지'}" | 문장(상징): ${formData.houseCrest || '🦁 황금 사자'} | 가풍: ${formData.houseFocus || '통치와 번영'}`;
      if (!finalAdditional.includes('[가문 및 혈통 설정]')) {
        finalAdditional = finalAdditional ? `${finalAdditional}\n${houseDesc}` : houseDesc;
      }
    }

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
        dynastyLegacy: selectedArchetype === 'noble' ? dynastyLegacy : 'martial',
        personalityTraits,
        congenitalTraits,
        stats: statsData,
        selectedTraits,
        additionalSettings: inheritanceContext + (finalAdditional ? `\n${finalAdditional}` : ''),
        previousState: formData.inheritedState.previousState
      };
      localStorage.setItem("ck_startup_config", JSON.stringify(finalFormData));
      localStorage.removeItem("ck_inheritance");
    } else {
      const finalFormData = {
        ...formData,
        dynastyLegacy: selectedArchetype === 'noble' ? dynastyLegacy : 'martial',
        personalityTraits,
        congenitalTraits,
        stats: statsData,
        selectedTraits,
        additionalSettings: finalAdditional
      };
      localStorage.setItem("ck_startup_config", JSON.stringify(finalFormData));
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
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '25px', fontSize: '1rem', flexWrap: 'wrap' }}>
          <div style={{ color: currentStep === 1 ? 'var(--gold-accent)' : 'var(--text-muted)', fontWeight: currentStep === 1 ? 'bold' : 'normal', transition: 'color 0.3s' }}>1. 기본 설정</div>
          <div style={{ color: 'var(--text-muted)' }}>&gt;</div>
          <div style={{ color: currentStep === 2 ? 'var(--gold-accent)' : 'var(--text-muted)', fontWeight: currentStep === 2 ? 'bold' : 'normal', transition: 'color 0.3s' }}>2. 신분 및 배경</div>
          <div style={{ color: 'var(--text-muted)' }}>&gt;</div>
          <div style={{ color: currentStep === 3 ? 'var(--gold-accent)' : 'var(--text-muted)', fontWeight: currentStep === 3 ? 'bold' : 'normal', transition: 'color 0.3s' }}>3. 능력치</div>
          <div style={{ color: 'var(--text-muted)' }}>&gt;</div>
          <div style={{ color: currentStep === 4 ? 'var(--gold-accent)' : 'var(--text-muted)', fontWeight: currentStep === 4 ? 'bold' : 'normal', transition: 'color 0.3s' }}>4. 시작 특성</div>
        </div>

        {/* 1단계: 기본 설정 (시대, 세계관, 인물, 난이도, 언어 모드) */}
        {currentStep === 1 && (
          <div className={styles.fieldsGrid} style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
            <div className={styles.fieldRow}>
              <label className={styles.fieldLabel}>시대:</label>
              <input type="text" name="era" className={styles.inputField} placeholder="입력 (예: 1066년 중세 성기)" value={formData.era} onChange={handleChange} />
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
          </div>
        )}

        {/* 2단계: 신분 및 배경 설정 (아키타입, 신분 프리셋, 가문 설정, 시작 위치, 추가 설정) */}
        {currentStep === 2 && (
          <div className={styles.fieldsGrid} style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
            {/* 🌍 문명 및 문화권 선택 (Culture Region Tabs) */}
            <div className={styles.fieldRow} style={{ gridColumn: '1 / -1', flexDirection: 'column', alignItems: 'stretch', gap: '8px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <label className={styles.fieldLabel} style={{ fontSize: '1.05rem', color: 'var(--gold-accent)', fontWeight: 'bold' }}>
                  🌍 문명 및 문화권 선택 (Civilization & Region):
                </label>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  선택한 문화권에 맞춰 고유 신분 체계와 승격 사다리가 적용됩니다.
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                {CULTURE_REGIONS.map(reg => {
                  const isSel = cultureRegion === reg.id;
                  return (
                    <button
                      key={reg.id}
                      type="button"
                      onClick={() => handleSelectCultureRegion(reg.id)}
                      style={{
                        padding: '12px 14px',
                        background: isSel ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.25), rgba(15, 23, 42, 0.9))' : 'rgba(0, 0, 0, 0.4)',
                        border: isSel ? '2px solid var(--gold-accent)' : '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        color: isSel ? 'var(--gold-hover)' : 'var(--text-main)',
                        fontWeight: isSel ? 'bold' : 'normal',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        boxShadow: isSel ? '0 0 12px rgba(212, 175, 55, 0.2)' : 'none'
                      }}
                    >
                      <div style={{ fontSize: '1.05rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{reg.icon}</span>
                        <span>{reg.name}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: isSel ? '#bae6fd' : 'var(--text-muted)' }}>
                        {reg.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 👑 시작 신분 아키타입 선택 (Origin Archetype) */}
            <div className={styles.fieldRow} style={{ gridColumn: '1 / -1', flexDirection: 'column', alignItems: 'stretch', gap: '10px', marginTop: '4px', marginBottom: '10px' }}>
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

            {/* 🎖️ 플레이어 신분 프리셋 선택 (직접 입력란 삭제됨, 프리셋 전용) */}
            <div className={styles.fieldRow} style={{ gridColumn: '1 / -1', flexDirection: 'column', alignItems: 'stretch', gap: '10px', marginTop: '6px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <label className={styles.fieldLabel} style={{ fontSize: '1.05rem', color: 'var(--gold-accent)', fontWeight: 'bold' }}>
                  🎖️ 신분 프리셋 (Origin Status Presets):
                </label>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  현재 선택된 신분: <strong style={{ color: 'var(--gold-hover)' }}>{formData.playerStatus || '선택 안 됨'}</strong>
                </span>
              </div>

              {/* Archetype Linked Presets Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '8px' }}>
                {(ARCHETYPES.find(a => a.id === selectedArchetype)?.statusPresets || []).map((preset: StatusPreset) => {
                  const isPresetSelected = formData.playerStatus === preset.playerStatus;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectStatusPreset(preset)}
                      style={{
                        padding: '10px 12px',
                        background: isPresetSelected
                          ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.25), rgba(15, 23, 42, 0.9))'
                          : 'rgba(0, 0, 0, 0.35)',
                        border: isPresetSelected ? '2px solid var(--gold-accent)' : '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isPresetSelected ? '0 0 12px rgba(212, 175, 55, 0.25)' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (!isPresetSelected) {
                          e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.5)';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isPresetSelected) {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.35)';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '1.2rem' }}>{preset.icon}</span>
                        <strong style={{ fontSize: '0.9rem', color: isPresetSelected ? 'var(--gold-hover)' : 'var(--text-main)' }}>
                          {preset.name}
                        </strong>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                        {preset.shortDesc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 🏰 봉건 영주 / 귀족 선택 시 가문 설정 항목 (House / Dynasty Settings) */}
            {selectedArchetype === 'noble' && (
              <div style={{
                gridColumn: '1 / -1',
                background: 'linear-gradient(145deg, rgba(212, 175, 55, 0.12), rgba(15, 23, 42, 0.7))',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                borderRadius: '10px',
                padding: '16px',
                marginTop: '6px',
                marginBottom: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(212, 175, 55, 0.3)', paddingBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.3rem' }}>🛡️</span>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--gold-accent)' }}>가문 및 혈통 설정 (House & Dynasty)</strong>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>영주 캐릭터의 가문 명칭, 가언, 문장 상징을 지정합니다.</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 'bold' }}>가문 이름 (House Name):</label>
                    <input
                      type="text"
                      name="houseName"
                      className={styles.inputField}
                      placeholder="예: 폰 합스부르크, 카펠, 랭커스터, 플랜태저넷"
                      value={formData.houseName}
                      onChange={handleChange}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 'bold' }}>가문 가언 / 모토 (House Motto):</label>
                    <input
                      type="text"
                      name="houseMotto"
                      className={styles.inputField}
                      placeholder="예: 빛은 어둠 속에서 빛난다 / 피와 명예"
                      value={formData.houseMotto}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 'bold' }}>가문 문장 상징 (Coat of Arms):</label>
                    <span style={{ fontSize: '0.8rem', color: 'var(--gold-hover)' }}>선택된 상징: {formData.houseCrest}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {['🦁 황금 사자', '🦅 흑독수리', '⚜️ 백합', '🐺 회색 늑대', '🐉 붉은 용', '⚔️ 교차된 장검', '🏰 석조 성채', '☀️ 타오르는 태양'].map(crest => {
                      const isSel = formData.houseCrest === crest;
                      return (
                        <button
                          key={crest}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, houseCrest: crest }))}
                          style={{
                            padding: '6px 12px',
                            background: isSel ? 'rgba(212, 175, 55, 0.25)' : 'rgba(0,0,0,0.4)',
                            border: isSel ? '1px solid var(--gold-accent)' : '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '6px',
                            color: isSel ? 'var(--gold-hover)' : 'var(--text-main)',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {crest}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4축: 가문 유산 대업 (Dynasty Legacy Bloodline) 선택 카드 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <label style={{ fontSize: '0.9rem', color: 'var(--gold-accent)', fontWeight: 'bold' }}>
                      【 제4축 】 가문 유산 대업 (Dynasty Legacy Bloodline):
                    </label>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      선택된 유산: <strong style={{ color: 'var(--gold-hover)' }}>{DYNASTY_LEGACIES.find(l => l.id === dynastyLegacy)?.name}</strong>
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                    {DYNASTY_LEGACIES.map(legacy => {
                      const isSel = dynastyLegacy === legacy.id;
                      return (
                        <div
                          key={legacy.id}
                          onClick={() => {
                            setDynastyLegacy(legacy.id as any);
                            if (legacy.id === 'martial') setFormData(prev => ({ ...prev, houseFocus: '군사와 정복 (Martial Conquest)' }));
                            if (legacy.id === 'holy') setFormData(prev => ({ ...prev, houseFocus: '신앙과 경건 (Piety & Divine Right)' }));
                            if (legacy.id === 'merchant') setFormData(prev => ({ ...prev, houseFocus: '행정과 번영 (Stewardship & Prosperity)' }));
                          }}
                          style={{
                            padding: '12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            background: isSel ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.22), rgba(15, 23, 42, 0.85))' : 'rgba(0,0,0,0.4)',
                            border: isSel ? '2px solid var(--gold-accent)' : '1px solid rgba(255,255,255,0.12)',
                            boxShadow: isSel ? '0 0 10px rgba(212, 175, 55, 0.2)' : 'none'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '1.3rem' }}>{legacy.icon}</span>
                            <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: isSel ? 'var(--gold-accent)' : 'rgba(255,255,255,0.1)', color: isSel ? '#111' : 'var(--text-muted)', fontWeight: 'bold' }}>
                              {legacy.badge}
                            </span>
                          </div>
                          <div style={{ fontWeight: 'bold', fontSize: '0.92rem', color: isSel ? 'var(--gold-hover)' : 'var(--text-main)', marginBottom: '4px' }}>
                            {legacy.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: '1.3' }}>
                            {legacy.description}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px' }}>
                            {legacy.bonusSummary.map((b, idx) => (
                              <div key={idx} style={{ fontSize: '0.72rem', color: isSel ? '#bae6fd' : 'rgba(255,255,255,0.7)' }}>
                                ✓ {b}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 'bold' }}>가문 가풍 / 성향 (Dynasty Focus):</label>
                  <select
                    name="houseFocus"
                    className={styles.selectField}
                    value={formData.houseFocus}
                    onChange={handleChange}
                  >
                    <option value="외교와 정략혼 (Diplomatic Marriage)">외교와 정략혼 (Diplomatic Marriage) - 인근 제후들과의 혼맥 및 동맹</option>
                    <option value="군사와 정복 (Martial Conquest)">군사와 정복 (Martial Conquest) - 무력과 기사도, 영토 확장</option>
                    <option value="행정과 번영 (Stewardship & Prosperity)">행정과 번영 (Stewardship & Prosperity) - 장원 개발, 상업 진흥, 부국강병</option>
                    <option value="신앙과 경건 (Piety & Divine Right)">신앙과 경건 (Piety & Divine Right) - 교황청 후원, 십자군 및 성유물</option>
                    <option value="음모와 암계 (Intrigue & Shadows)">음모와 암계 (Intrigue & Shadows) - 비밀 파벌, 독살과 권모술수</option>
                  </select>
                </div>
              </div>
            )}

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

        {/* 3단계: 초기 능력치 설정 */}
        {currentStep === 3 && (
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

            {/* 【 제1축 】 5대 핵심 능력치 & 기량 실시간 판정 (Core Attributes Preview) */}
            {(() => {
              const coreAttrs = calculate5AttributesFromStats(statsData);
              return (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.12), rgba(15, 23, 42, 0.75))',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }}>📊</span>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--gold-accent)' }}>
                        【 제1축 】 5대 핵심 능력치 & 기량 실시간 판정 (Core Attributes & Prowess)
                      </strong>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      선천/후천 스탯 분배에 따라 1~30 정밀 점수 및 시스템 보너스 실시간 연동
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                    {Object.entries(coreAttrs).map(([key, attr]) => (
                      <div
                        key={key}
                        style={{
                          background: 'rgba(0,0,0,0.45)',
                          border: `1px solid ${attr.color}40`,
                          borderRadius: '8px',
                          padding: '10px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          boxShadow: `0 2px 8px ${attr.color}15`
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '1.1rem' }}>{attr.icon} <strong style={{ color: attr.color, fontSize: '0.92rem' }}>{attr.label}</strong></span>
                          <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: `${attr.color}25`, color: attr.color, fontWeight: 'bold' }}>
                            {attr.grade}
                          </span>
                        </div>
                        <div style={{ fontSize: '1.45rem', fontWeight: 'bold', color: 'var(--text-main)', textAlign: 'right', margin: '2px 0' }}>
                          {attr.score} <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>/ 30</span>
                        </div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                          {attr.effectDesc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

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

        {/* 4단계: 시작 특성 설정 */}
        {currentStep === 4 && (
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 4단계 세부 탭 네비게이션 */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setTraitSubTab('personality')}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '6px',
                      border: traitSubTab === 'personality' ? '1px solid var(--gold-accent)' : '1px solid rgba(255,255,255,0.15)',
                      background: traitSubTab === 'personality' ? 'rgba(212, 175, 55, 0.22)' : 'rgba(0,0,0,0.35)',
                      color: traitSubTab === 'personality' ? 'var(--gold-hover)' : 'var(--text-muted)',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span>🎭</span> 【제2축】 CK3 정통 성격 특성 ({personalityTraits.length}/3)
                  </button>

                  <button
                    type="button"
                    onClick={() => setTraitSubTab('congenital')}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '6px',
                      border: traitSubTab === 'congenital' ? '1px solid var(--gold-accent)' : '1px solid rgba(255,255,255,0.15)',
                      background: traitSubTab === 'congenital' ? 'rgba(212, 175, 55, 0.22)' : 'rgba(0,0,0,0.35)',
                      color: traitSubTab === 'congenital' ? 'var(--gold-hover)' : 'var(--text-muted)',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span>🧬</span> 【제3축】 선천 유전 특성 ({remainingCongenitalPoints}P)
                  </button>

                  <button
                    type="button"
                    onClick={() => setTraitSubTab('custom')}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '6px',
                      border: traitSubTab === 'custom' ? '1px solid var(--gold-accent)' : '1px solid rgba(255,255,255,0.15)',
                      background: traitSubTab === 'custom' ? 'rgba(212, 175, 55, 0.22)' : 'rgba(0,0,0,0.35)',
                      color: traitSubTab === 'custom' ? 'var(--gold-hover)' : 'var(--text-muted)',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span>📜</span> 일반 배경 및 커스텀 특성
                  </button>
                </div>

                {/* 2축: CK3 정통 성격 특성 (대립쌍 선택 시스템) */}
                {traitSubTab === 'personality' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.12), rgba(15, 23, 42, 0.75))', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        CK3 정통 규칙: <strong>상반되는 성격 특성은 양립할 수 없으며</strong>, 최대 <strong>3개</strong>까지 획득 가능합니다.
                      </span>
                      <span style={{ fontSize: '0.88rem', color: 'var(--gold-accent)', fontWeight: 'bold' }}>
                        선택된 성격 특성: {personalityTraits.length} / 3
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {PERSONALITY_PAIRS.map((pair, idx) => {
                        const isPosSel = personalityTraits.includes(pair.positive.id);
                        const isOppSel = personalityTraits.includes(pair.opposite.id);
                        return (
                          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                            {/* Positive trait card */}
                            <div
                              onClick={() => togglePersonality(pair.positive.id)}
                              style={{
                                padding: '12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: isPosSel ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.25), rgba(15, 23, 42, 0.9))' : 'rgba(0,0,0,0.35)',
                                border: isPosSel ? '2px solid var(--gold-accent)' : '1px solid rgba(255,255,255,0.1)',
                                boxShadow: isPosSel ? '0 0 10px rgba(212, 175, 55, 0.2)' : 'none'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span style={{ fontSize: '1.2rem' }}>{pair.positive.icon} <strong style={{ color: isPosSel ? 'var(--gold-hover)' : 'var(--text-main)', fontSize: '0.92rem' }}>{pair.positive.name}</strong></span>
                                {isPosSel && <span style={{ fontSize: '0.72rem', background: 'var(--gold-accent)', color: '#111', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>선택됨</span>}
                              </div>
                              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '6px', lineHeight: '1.3' }}>{pair.positive.desc}</div>
                              <div style={{ fontSize: '0.73rem', color: '#bae6fd' }}>⚡ {pair.positive.statBonus}</div>
                            </div>

                            {/* VS badge */}
                            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', padding: '4px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: '12px', textAlign: 'center' }}>
                              VS
                            </div>

                            {/* Opposite trait card */}
                            <div
                              onClick={() => togglePersonality(pair.opposite.id)}
                              style={{
                                padding: '12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: isOppSel ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.25), rgba(15, 23, 42, 0.9))' : 'rgba(0,0,0,0.35)',
                                border: isOppSel ? '2px solid var(--gold-accent)' : '1px solid rgba(255,255,255,0.1)',
                                boxShadow: isOppSel ? '0 0 10px rgba(212, 175, 55, 0.2)' : 'none'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span style={{ fontSize: '1.2rem' }}>{pair.opposite.icon} <strong style={{ color: isOppSel ? 'var(--gold-hover)' : 'var(--text-main)', fontSize: '0.92rem' }}>{pair.opposite.name}</strong></span>
                                {isOppSel && <span style={{ fontSize: '0.72rem', background: 'var(--gold-accent)', color: '#111', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>선택됨</span>}
                              </div>
                              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '6px', lineHeight: '1.3' }}>{pair.opposite.desc}</div>
                              <div style={{ fontSize: '0.73rem', color: '#bae6fd' }}>⚡ {pair.opposite.statBonus}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3축: 선천적 유전 특성 포인트-바이 */}
                {traitSubTab === 'congenital' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(15, 23, 42, 0.8))', border: '1px solid rgba(212, 175, 55, 0.4)', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--gold-accent)' }}>🧬 선천 유전 특성 포인트-바이 시스템</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          강력한 축복 특성은 포인트를 소모하며, 결함을 선택하면 포인트가 환급됩니다.
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>남은 예산:</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: remainingCongenitalPoints >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                          {remainingCongenitalPoints} P
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ {congenitalBudget} P</span>
                      </div>
                    </div>

                    {/* 축복 유전 특성 */}
                    <div>
                      <h4 style={{ color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '8px' }}>✨ 축복받은 유전 형질 (포인트 소모)</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                        {CONGENITAL_POINT_TRAITS.filter(t => !t.isFlaw).map(t => {
                          const isSel = congenitalTraits.includes(t.id);
                          return (
                            <div
                              key={t.id}
                              onClick={() => toggleCongenital(t.id)}
                              style={{
                                padding: '12px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: isSel ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.25), rgba(15, 23, 42, 0.9))' : 'rgba(0,0,0,0.35)',
                                border: isSel ? '2px solid var(--gold-accent)' : '1px solid rgba(255,255,255,0.1)',
                                boxShadow: isSel ? '0 0 10px rgba(212, 175, 55, 0.2)' : 'none'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span style={{ fontSize: '1.1rem' }}>{t.icon} <strong style={{ color: isSel ? 'var(--gold-hover)' : 'var(--text-main)', fontSize: '0.9rem' }}>{t.name}</strong></span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
                                  -{t.cost}P
                                </span>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{t.desc}</div>
                              <div style={{ fontSize: '0.73rem', color: '#bae6fd' }}>⚡ {t.effects}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 유전적 결함 */}
                    <div>
                      <h4 style={{ color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '8px' }}>⚠️ 유전적 결함 및 핸디캡 (포인트 환급)</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                        {CONGENITAL_POINT_TRAITS.filter(t => t.isFlaw).map(t => {
                          const isSel = congenitalTraits.includes(t.id);
                          return (
                            <div
                              key={t.id}
                              onClick={() => toggleCongenital(t.id)}
                              style={{
                                padding: '12px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: isSel ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(15, 23, 42, 0.9))' : 'rgba(0,0,0,0.35)',
                                border: isSel ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                                boxShadow: isSel ? '0 0 10px rgba(239, 68, 68, 0.2)' : 'none'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span style={{ fontSize: '1.1rem' }}>{t.icon} <strong style={{ color: isSel ? '#fca5a5' : 'var(--text-main)', fontSize: '0.9rem' }}>{t.name}</strong></span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' }}>
                                  +{Math.abs(t.cost)}P 환급
                                </span>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{t.desc}</div>
                              <div style={{ fontSize: '0.73rem', color: '#fca5a5' }}>⚠️ {t.effects}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 일반 배경 및 커스텀 특성 */}
                {traitSubTab === 'custom' && (
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
              </div>
            )}
            
            <div className={styles.instruction} style={{ marginTop: '20px' }}>
              선택하신 특성과 능력치는 영지의 정치, 군사, 종교 및 생존 판정에 직접적인 영향을 미칩니다.
            </div>
          </div>
        )}

        <div className={styles.buttonContainer}>
          {currentStep > 1 && (
            <button className={styles.actionBtn} style={{flex: 1}} onClick={() => setCurrentStep(prev => prev - 1)}>이전</button>
          )}
          
          {currentStep < 4 ? (
            <button className={`${styles.actionBtn} ${styles.primaryBtn}`} style={{flex: 1}} onClick={() => setCurrentStep(prev => prev + 1)}>다음 단계</button>
          ) : (
            <button className={`${styles.actionBtn} ${styles.primaryBtn}`} style={{flex: 2}} onClick={handleStart}>
              새로운 역사 시작하기 👑
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
