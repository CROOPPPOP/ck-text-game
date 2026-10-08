"use client";

import React, { useState, useEffect } from 'react';
import RealmDashboard from './RealmDashboard';
import { ParsedState } from '@/lib/parser';
import { getArchetypeDetails, getDomainLimitBreakdown, calculateTurnIncome, parseNameAndRole } from '@/lib/ckVisuals';
import { QueueItem, BuildOption, turnsLeft, sameBuildingName } from '@/lib/construction';
import { X, Castle, Hammer, Shield, Users, Clock, AlertCircle, Coins, TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gameState?: ParsedState;
  factionState?: Record<string, string>;
  initialTab?: 'realm' | 'estate';
  constructionQueue?: QueueItem[];
  turn?: number;
  loading?: boolean;
  onOrderBuild?: (opt: BuildOption) => void;
  onCancelBuild?: (id: string) => void;
  constructionNotice?: string;
  promotionOption?: BuildOption | null;
  derivedUpgradeOptions?: BuildOption[];
  maxSlots?: number;
  domainLimit?: number;
}

export default function CKRealmModal({
  isOpen,
  onClose,
  gameState,
  factionState,
  initialTab = 'realm',
  constructionQueue = [],
  turn = 0,
  loading = false,
  onOrderBuild,
  onCancelBuild,
  constructionNotice = '',
  promotionOption = null,
  derivedUpgradeOptions = [],
  maxSlots = 2,
  domainLimit = 3
}: Props) {
  const [activeTab, setActiveTab] = useState<'realm' | 'estate'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const currentFaction = factionState || gameState?.factionState;
  const domainBreakdown = getDomainLimitBreakdown(gameState || {});
  const archetypeDetails = gameState ? getArchetypeDetails(gameState) : null;
  const archetype = archetypeDetails?.archetype || 'noble';
  const income = gameState ? calculateTurnIncome(gameState) : null;
  const modalIcon = archetypeDetails ? archetypeDetails.icon : '🏰';
  const modalTitle = archetypeDetails
    ? `${archetypeDetails.num} ${archetypeDetails.title} 대시보드`
    : '영지 및 세력 통치 대시보드';

  // 거점 상주 자문관 및 직속 부하/가신 추출 (상급자 및 외부 후원자 엄격 제외)
  const councilVassals = (gameState?.relationships?.personal || []).filter(rel => {
    const rawName = rel.split('|')[0] || '';
    const descStr = rel.split('|').slice(3).join(' ') || '';
    const combined = `${rawName} ${descStr}`;

    // 1. 명시적 태그 최우선 판별
    if (descStr.includes('[직속부하]') || descStr.includes('[가신]')) return true;
    if (descStr.includes('[상급자]') || descStr.includes('[후원자]') || descStr.includes('[동료]') || descStr.includes('[적대]')) return false;

    // 2. 키워드 제외 대상: 상급자, 후원자, 외부 유력자, 적대자 (주교좌 등 기관명 오인식 방지)
    const excludeKeywords = ['상급자', '교구장', '대주교', '교황', '주군', '영주', '국왕', '황제', '스승', '종정', '후원자', '미망인', '영부인', '고용주', '의뢰인', '적대', '숙적', '라이벌'];
    if (excludeKeywords.some(k => combined.includes(k))) return false;
    if (combined.includes('주교') && !combined.includes('주교좌')) return false;

    // 포함 대상: 직속 부하/가신/보좌/단원
    const subordinateKeywords = ['직속부하', '가신', '기사', '집사장', '원수', '첩보장', '부대장', '부원장', '관리인', '서기관', '참모', '시종', '복사', '수련수사', '도제', '조력자', '부관'];
    return subordinateKeywords.some(k => combined.includes(k));
  }).map(rel => {
    const parts = rel.split('|').map(p => p.trim());
    const rawName = parts[0] || '';
    const { name, role: parsedRole } = parseNameAndRole(rawName);
    const descStr = parts.slice(3).join(' ') || '';
    const fallbackRole = (descStr.includes('수호') || descStr.includes('경비') || descStr.includes('호위') || descStr.includes('무관') || descStr.includes('기사'))
      ? '직속 호위대장'
      : (archetype === 'clergy' ? '보좌 수사' : archetype === 'company' ? '부대 간부' : archetype === 'wanderer' ? '동행 조력자' : '직속 가신');
    const role = parsedRole || fallbackRole;
    return { name, role };
  });

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
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(5, 7, 15, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 1100,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }} 
      onClick={onClose}
    >
      <div 
        style={{
          background: 'linear-gradient(145deg, rgba(26, 32, 48, 0.98), rgba(15, 20, 32, 0.98))',
          width: '94%',
          maxWidth: '860px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '16px',
          border: '2px solid rgba(212, 175, 55, 0.45)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(212, 175, 55, 0.2)',
          padding: '28px',
          position: 'relative'
        }} 
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose} 
          style={{
            position: 'absolute',
            top: '20px',
            right: '24px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px'
          }}
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(212, 175, 55, 0.25)', paddingBottom: '16px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.3) 0%, rgba(15, 23, 42, 0.8) 100%)',
            border: '2px solid #38bdf8',
            fontSize: '1.8rem',
            marginBottom: '10px'
          }}>
            {modalIcon}
          </div>
          <h2 style={{ color: 'var(--gold-accent)', fontSize: '1.7rem', fontWeight: 'bold', margin: '0 0 4px 0', letterSpacing: '1px' }}>
            {modalTitle}
          </h2>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {archetypeDetails?.subtitle || '국가 안정도, 치안, 민심, 군사 준비도 및 주요 통치 지표'}
          </div>

          {/* Integrated Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '16px' }}>
            <button
              onClick={() => setActiveTab('realm')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: '8px',
                border: activeTab === 'realm' ? '1px solid var(--gold-accent)' : '1px solid rgba(255,255,255,0.1)',
                background: activeTab === 'realm' ? 'linear-gradient(45deg, rgba(212, 175, 55, 0.25), rgba(15, 23, 42, 0.8))' : 'rgba(0,0,0,0.3)',
                color: activeTab === 'realm' ? 'var(--gold-hover)' : 'var(--text-muted)',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              }}
            >
              <Castle size={16} />
              <span>🏛️ 통치 지표 (Realm Dashboard)</span>
            </button>

            <button
              onClick={() => setActiveTab('estate')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: '8px',
                border: activeTab === 'estate' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                background: activeTab === 'estate' ? 'linear-gradient(45deg, rgba(56, 189, 248, 0.25), rgba(15, 23, 42, 0.8))' : 'rgba(0,0,0,0.3)',
                color: activeTab === 'estate' ? '#7dd3fc' : 'var(--text-muted)',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              }}
            >
              <Hammer size={16} />
              <span>🔨 거점 시설 및 건설 (Holdings & Build)</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Realm Dashboard */}
        {activeTab === 'realm' && (
          <RealmDashboard factionState={currentFaction} gameState={gameState} />
        )}

        {/* Tab 2: Estate & Construction */}
        {activeTab === 'estate' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 거점 / 영지 현황 헤더 카드 */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.95))',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              borderRadius: '10px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.6rem' }}>{gameState?.estate ? '🏰' : '🏕️'}</span>
                  <div>
                    <div style={{ fontWeight: 'bold', color: 'var(--gold-accent)', fontSize: '1.1rem' }}>
                      {gameState?.estate?.type || '임시 야영지'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      거점 규모: <strong style={{ color: '#60a5fa' }}>{gameState?.estate?.level || 'Lv.1 초기 거점'}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
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
                  }} title="현재 거점에서 동시에 진행 가능한 신규/증축 건설 작업 슬롯입니다.">
                    🔨 공사 슬롯: {constructionQueue.length} / {maxSlots}
                  </span>

                  <span style={{
                    fontSize: '0.82rem',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: domainBreakdown.isOverCapacity ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.15)',
                    color: domainBreakdown.isOverCapacity ? '#f87171' : '#6ee7b7',
                    border: `1px solid ${domainBreakdown.isOverCapacity ? '#ef4444' : '#10b981'}`,
                    fontWeight: 'bold',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }} title={`현재 거점 규모(${gameState?.estate?.level || 'Lv.1'})의 최대 시설 수용 상한입니다. (한도 초과 시 거점 승격 공사가 필요합니다)`}>
                    🏛️ 거점 시설: {domainBreakdown.currentBuildingsCount} / {domainBreakdown.maxBuildingCapacity}동
                    {domainBreakdown.isOverCapacity && <span style={{ fontSize: '0.72rem', color: '#fca5a5', marginLeft: '2px' }}>(과밀)</span>}
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
                  }} title={`군주가 직접 통치 가능한 직할 봉토/거점의 한계치입니다. (산출: 기본 ${domainBreakdown.base} + 품계 보너스 ${domainBreakdown.tierBonus} + 관리력 ${domainBreakdown.stewBonus}${domainBreakdown.vassalBonus > 0 ? ` + 가신 보좌 ${domainBreakdown.vassalBonus}` : ''} = 총 ${domainBreakdown.total}개소)`}>
                    📜 직할 영지 한계: {domainBreakdown.heldCount} / {domainBreakdown.total}개소
                  </span>
                </div>
              </div>

              {/* 거점 상주 직속 부하 / 가신 / 보좌 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--gold-accent)', fontWeight: 'bold' }}>
                    {archetype === 'clergy' ? '⛪ 직속 교구 보좌 및 수도사' :
                     archetype === 'wanderer' ? '🗡️ 동행 동료 및 조력자' :
                     archetype === 'company' ? '👥 부대 간부 및 직속 단원' :
                     '👑 거점 상주 가신 & 자문관'} ({councilVassals.length}명)
                  </span>
                  {councilVassals.length === 0 && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {archetype === 'clergy' ? '인간관계에서 수도사/복사 등용 시 연동' :
                       archetype === 'wanderer' ? '인간관계에서 동료 등용 시 연동' :
                       archetype === 'company' ? '인간관계에서 부관/간부 등용 시 연동' :
                       '인간관계에서 가신/기사 등용 시 연동'}
                    </span>
                  )}
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
                        <span style={{ color: 'var(--gold-accent)' }}>
                          {(v.role.includes('수호') || v.role.includes('경비') || v.role.includes('기사') || v.role.includes('호위') || v.role.includes('무관') || v.role.includes('군사')) ? '🛡️' : (archetype === 'clergy' ? '🕊️' : archetype === 'company' ? '🛡️' : archetype === 'wanderer' ? '🗡️' : '👑')}
                        </span>
                        <strong>{v.name}</strong>
                        <span style={{ color: '#7dd3fc', fontSize: '0.72rem' }}>({v.role})</span>
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      {archetype === 'clergy' ? '아직 임명된 직속 보좌 수사나 복사가 없습니다.' :
                       archetype === 'wanderer' ? '아직 함께하는 동행 조력자가 없습니다.' :
                       archetype === 'company' ? '아직 임명된 부대 간부가 없습니다.' :
                       '아직 임명된 직속 가신이 없습니다.'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 🪙 거점 재정 및 턴 당 수지 명세 카드 */}
            {income && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(20, 29, 47, 0.7), rgba(15, 23, 42, 0.95))',
                border: '1px solid rgba(212, 175, 55, 0.35)',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Coins size={18} style={{ color: '#fbbf24' }} />
                    <span style={{ fontWeight: 'bold', color: 'var(--gold-accent)', fontSize: '1rem' }}>
                      거점 재정 및 턴 당 수지 (Financial Balance)
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      color: income.statusColor,
                      background: 'rgba(0,0,0,0.3)',
                      padding: '3px 8px',
                      borderRadius: '5px',
                      border: `1px solid ${income.statusColor}40`
                    }}>
                      {income.statusLabel}
                    </span>
                    <span style={{
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      color: income.netIncome >= 0 ? '#4ade80' : '#f87171',
                      background: income.netIncome >= 0 ? 'rgba(74, 222, 128, 0.15)' : 'rgba(248, 113, 113, 0.15)',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      border: `1px solid ${income.netIncome >= 0 ? '#10b981' : '#ef4444'}`
                    }}>
                      {income.formattedNet} {income.currencyName} / 턴
                    </span>
                  </div>
                </div>

                {/* 2-Column Summary: 세입원 vs 세출원 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  {/* 세입 */}
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(74, 222, 128, 0.2)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#4ade80', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <TrendingUp size={14} />
                      <span>총 세입 (+{income.grossIncome} {income.currencyName})</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {income.incomeItems.map(item => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', padding: '3px 6px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                          <span style={{ color: '#cbd5e1' }}>{item.name}</span>
                          <span style={{ color: '#4ade80', fontWeight: 'bold' }}>+{item.amount.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 세출 */}
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(248, 113, 113, 0.2)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#f87171', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <TrendingDown size={14} />
                      <span>총 세출 (-{income.grossExpense} {income.currencyName})</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {income.expenseItems.map(item => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', padding: '3px 6px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                          <span style={{ color: '#cbd5e1' }}>{item.name}</span>
                          <span style={{ color: '#f87171', fontWeight: 'bold' }}>-{item.amount.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 알림 메시지 */}
            {constructionNotice && (
              <div style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid var(--gold-accent)', color: 'var(--gold-hover)', padding: '10px 12px', borderRadius: '6px', fontSize: '0.9rem', lineHeight: '1.4' }}>
                🔔 {constructionNotice}
              </div>
            )}

            {/* 현재 완공된 시설 목록 */}
            <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px' }}>
              <h3 style={{ color: 'var(--gold-accent)', fontSize: '1rem', fontWeight: 'bold', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
                🏛️ 완공 시설 및 거점 기능 현황
              </h3>
              {gameState?.estate?.buildings && gameState.estate.buildings.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
                  {gameState.estate.buildings.map((b, idx) => {
                    let cleanName = (b.name || '')
                      .replace(/^[\[\{]+|[\]\}]+$/g, '')
                      .replace(/[\(\[\{]?(?:Lv\.?|레벨)\s*\d+[\)\]\}]?/gi, '')
                      .trim() || '거점 시설';

                    // 이전 파서 결함으로 시설명이 태그로 쪼개져 저장된 경우 복원
                    const VALID_TAG_KEYWORD = /군사|생산|치안|행정|신앙|문화|민생|경제|특수|외교|방어|학문|종교/;
                    if ((cleanName === '거점 시설' || !cleanName) && b.tags && b.tags.some(t => !VALID_TAG_KEYWORD.test(t))) {
                      const reconstructed = b.tags
                        .filter(t => !VALID_TAG_KEYWORD.test(t))
                        .join(' ')
                        .replace(/[\[\]\{\}]/g, '')
                        .replace(/[\(\[\{]?(?:Lv\.?|레벨)\s*\d+[\)\]\}]?/gi, '')
                        .trim();
                      if (reconstructed) cleanName = reconstructed;
                    }

                    // 오직 유효한 기능 태그만 필터링하여 출력 (단어 쪼개짐 오염 완벽 차단)
                    const validTags = (b.tags || [])
                      .map(t => (t || '').replace(/[\[\]\{\}]/g, '').trim())
                      .filter(t => VALID_TAG_KEYWORD.test(t));

                    return (
                      <div key={idx} style={{ background: 'rgba(0,0,0,0.35)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                          <span style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                            🏛️ {cleanName} <span style={{fontSize: '0.8rem', color: '#60a5fa', fontWeight: 'bold'}}>Lv.{b.level}</span>
                          </span>
                          {validTags.length > 0 && (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {validTags.map((cleanTag, ti) => {
                                const st = getTagStyle(cleanTag);
                                return (
                                  <span key={ti} style={{ fontSize: '0.72rem', background: st.bg, color: st.color, border: `1px solid ${st.color}33`, padding: '1px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                    <span>{st.icon}</span> {cleanTag}
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
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '14px' }}>
                  아직 건설된 시설이 없습니다. 아래 건설 목록에서 첫 시설을 건설해보세요.
                </div>
              )}
            </div>

            {/* 건설 진행 현황 (Construction Queue) */}
            {constructionQueue.length > 0 && (
              <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '16px' }}>
                <h3 style={{ color: '#7dd3fc', fontSize: '1rem', fontWeight: 'bold', marginBottom: '12px', borderBottom: '1px solid rgba(56, 189, 248, 0.2)', paddingBottom: '6px' }}>
                  🔨 공사 진행 중인 시설 ({constructionQueue.length}/{maxSlots})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {constructionQueue.map((q) => (
                    <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.35)', padding: '10px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                        <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>🔨 {q.building}</span>
                        <span style={{ color: '#38bdf8', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          {q.commandSent ? `${turnsLeft(q, turn)}턴 남음` : `${q.completeTurn - q.startTurn}턴 소요 · 다음 행동 때 비용 차감`}
                        </span>
                      </div>
                      {!q.commandSent && onCancelBuild && (
                        <button onClick={() => onCancelBuild(q.id)} disabled={loading} style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid rgba(239,68,68,0.5)', background: 'rgba(239,68,68,0.15)', color: '#fca5a5', cursor: 'pointer', whiteSpace: 'nowrap' }}>공사 취소</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 건설 가능 시설 및 업그레이드 */}
            <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px' }}>
              <h3 style={{ color: 'var(--gold-accent)', fontSize: '1rem', fontWeight: 'bold', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
                🏗️ 건설 가능 시설 및 승격 공사
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {promotionOption && (
                  <div style={{ background: 'rgba(212,175,55,0.1)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.4)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: 'var(--gold-accent)', fontSize: '0.98rem' }}>⭐ {promotionOption.name}</strong>
                      <button 
                        style={{ padding: '5px 12px', fontSize: '0.85rem', fontWeight: 'bold', borderRadius: '4px', border: '1px solid var(--gold-accent)', background: 'var(--gold-accent)', color: '#000', cursor: loading || constructionQueue.length >= maxSlots ? 'not-allowed' : 'pointer', opacity: loading || constructionQueue.length >= maxSlots ? 0.5 : 1 }} 
                        disabled={loading || constructionQueue.length >= maxSlots} 
                        onClick={() => onOrderBuild && onOrderBuild(promotionOption)}
                      >
                        승격 착수
                      </button>
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
                    <div key={'upg-'+idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ color: '#38bdf8', fontSize: '0.95rem' }}>⬆ {opt.name}</strong>
                        <button 
                          style={{ padding: '5px 12px', fontSize: '0.82rem', fontWeight: 'bold', borderRadius: '4px', border: '1px solid rgba(56,189,248,0.4)', background: 'rgba(56,189,248,0.2)', color: '#7dd3fc', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }} 
                          disabled={disabled} 
                          onClick={() => onOrderBuild && onOrderBuild(opt)}
                        >
                          {already ? '대기 중' : '강화 착수'}
                        </button>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>소요: {opt.turns}턴 | 비용: {opt.cost}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{opt.desc}</div>
                    </div>
                  );
                })}

                {gameState?.buildOptions && gameState.buildOptions.map((opt, idx) => {
                  const already = constructionQueue.some(q => sameBuildingName(q.building, opt.name));
                  const full = constructionQueue.length >= maxSlots;
                  const disabled = loading || already || full;

                  // 불완전 문자열 방어: 닫히지 않은 [태그] 닫기 및 정제
                  let displayOptName = opt.name || '신규 시설';
                  if (displayOptName.includes('[') && !displayOptName.includes(']')) {
                    displayOptName = `${displayOptName}]`;
                  }
                  if (/^Lv\.?\d+\s*→\s*\d+/i.test(displayOptName)) {
                    displayOptName = `거점 시설 강화 (${displayOptName})`;
                  }

                  return (
                    <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.95rem' }}>{displayOptName}</span>
                        <span style={{ color: '#38bdf8', fontSize: '0.82rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>⏱ {opt.turns}턴</span>
                      </div>
                      {opt.cost && <span style={{ fontSize: '0.85rem', color: 'var(--gold-hover)' }}>💰 {opt.cost}</span>}
                      {opt.desc && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{opt.desc}</span>}
                      <button
                        disabled={disabled}
                        onClick={() => onOrderBuild && onOrderBuild(opt)}
                        style={{ marginTop: '4px', padding: '8px', fontSize: '0.85rem', fontWeight: 'bold', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, background: disabled ? 'rgba(0,0,0,0.3)' : 'var(--gold-accent)', color: disabled ? 'var(--text-muted)' : '#000', transition: 'all 0.2s' }}
                      >
                        {already ? '🔨 공사 중' : full ? '슬롯 가득 참' : '🏗️ 건설 지시'}
                      </button>
                    </div>
                  );
                })}

                {(!gameState?.buildOptions || gameState.buildOptions.length === 0) && !promotionOption && derivedUpgradeOptions.length === 0 && (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '16px', fontSize: '0.9rem' }}>
                    현재 제안된 건설 후보가 없습니다. 턴을 진행하면 상황에 맞는 시설이 제안됩니다.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
