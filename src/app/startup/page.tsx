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
