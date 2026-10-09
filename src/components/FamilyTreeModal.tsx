"use client";

import React from "react";
import { ParsedState } from "@/lib/parser";
import { detectPlayerArchetype, getArchetypeDetails } from "@/lib/ckVisuals";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gameState: ParsedState;
  onSuccession: () => void;
}

export default function FamilyTreeModal({ isOpen, onClose, gameState, onSuccession }: Props) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = React.useState<'lineage' | 'intrigue'>('lineage');

  const rulerName = gameState.personalInfo?.['이름'] || '군주';
  const rulerTitle = gameState.personalInfo?.['칭호'] || gameState.personalInfo?.['직위'] || '영주';
  const rulerAge = (gameState.personalInfo?.['나이'] || '-').replace(/세+$/, '').trim();
  const rulerStatus = gameState.personalInfo?.['신분'] || '귀족';
  const familyState = gameState.familyState;
  const spouse = familyState?.spouse || '없음';
  const heir = familyState?.heir || '미정';
  const children = familyState?.children || '없음';
  const successionLaw = familyState?.successionLaw || '분할 상속제';
  const intrigues = familyState?.intrigues || [];

  const archetype = detectPlayerArchetype(gameState);
  const archetypeDetails = getArchetypeDetails(gameState);

  const hasHeir = heir && !heir.includes('없음') && !heir.includes('미정');

  // 선대 군주 추출 (과거 연대기 또는 상속 기록에서 탐색)
  const ancestors = gameState.chronicle
    ?.filter(c => c.action?.includes('후계자') || c.action?.includes('세대 교체') || c.summary?.includes('사망'))
    .map(c => ({
      name: c.summary?.split(' ')[0] || '선대 인물',
      turn: c.turn,
      note: c.summary || '역사의 궤적을 남긴 선대'
    })) || [];

  // 아키타입별 명칭 커스터마이징
  const labels = {
    modalTitle: archetype === 'wanderer' ? '🗡️ 【 방랑자의 인연 & 비기 전수 계보 】' :
                archetype === 'company' ? '👥 【 용병단 지휘부 & 차기 단장 계보 】' :
                archetype === 'clergy' ? '⛪ 【 수도원 영적 계보 & 후계 수사 】' :
                '👑 【 가문 및 계보 계승도 】',
    rulerCardLabel: archetype === 'wanderer' ? '방랑 모험가 본인' :
                    archetype === 'company' ? '용병대장 (Commander)' :
                    archetype === 'clergy' ? '수도원장 / 주임 사제' :
                    '현재 군주',
    spouseLabel: archetype === 'wanderer' ? '동행 맹우 / 반려' :
                 archetype === 'company' ? '부단장 / 참모장' :
                 archetype === 'clergy' ? '독신 서약 준수 (거룩한 금욕)' :
                 '배우자 (정실)',
    heirLabel: archetype === 'wanderer' ? '1순위 수제자 / 계승자' :
               archetype === 'company' ? '차기 지휘관 / 부단장' :
               archetype === 'clergy' ? '차기 주임 사제 후보' :
               '1순위 지정 후계자',
    childrenLabel: archetype === 'wanderer' ? '동료 및 제자단' :
                   archetype === 'company' ? '단원 및 간부 목록' :
                   archetype === 'clergy' ? '수도사 및 수련 수사' :
                   '자녀 목록',
    ancestorHeader: archetype === 'wanderer' ? '🗡️ 선대 스승 및 모험가 계보' :
                    archetype === 'company' ? '🚩 역대 용병대장 계보' :
                    archetype === 'clergy' ? '🕊️ 역대 영적 스승 및 원로 수도사' :
                    '🏛️ 선대 군주 및 시조 계보'
  };

  return (
    <div style={{
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
    }} onClick={onClose}>
      <div style={{
        background: 'linear-gradient(145deg, rgba(26, 32, 48, 0.95), rgba(15, 20, 32, 0.98))',
        width: '94%',
        maxWidth: '820px',
        maxHeight: '88vh',
        overflowY: 'auto',
        borderRadius: '16px',
        border: '2px solid rgba(212, 175, 55, 0.4)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(212, 175, 55, 0.15)',
        padding: '28px',
        position: 'relative'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Close Button */}
        <button onClick={onClose} style={{
          position: 'absolute',
          top: '20px',
          right: '24px',
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          fontSize: '2rem',
          cursor: 'pointer',
          lineHeight: 1
        }}>&times;</button>

        {/* Heraldry Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px', borderBottom: '1px solid rgba(212, 175, 55, 0.25)', paddingBottom: '20px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212, 175, 55, 0.3) 0%, rgba(15, 23, 42, 0.8) 100%)',
            border: '2px solid var(--gold-accent)',
            fontSize: '2rem',
            marginBottom: '12px',
            boxShadow: '0 0 15px rgba(212, 175, 55, 0.3)'
          }}>
            {archetypeDetails.icon}
          </div>
          <h2 style={{ color: 'var(--gold-accent)', fontSize: '1.8rem', fontWeight: 'bold', margin: '0 0 6px 0', letterSpacing: '2px' }}>
            {labels.modalTitle}
          </h2>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {rulerName} &bull; {rulerStatus} &bull; <span style={{ color: '#60a5fa' }}>📜 {successionLaw}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
          <button
            onClick={() => setActiveTab('lineage')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: activeTab === 'lineage' ? '1px solid var(--gold-accent)' : '1px solid rgba(255,255,255,0.1)',
              background: activeTab === 'lineage' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(0,0,0,0.3)',
              color: activeTab === 'lineage' ? 'var(--gold-accent)' : 'var(--text-muted)',
              fontWeight: 'bold',
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <span>📜</span>
            <span>공식 가계 & 후계 계보</span>
          </button>
          <button
            onClick={() => setActiveTab('intrigue')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: activeTab === 'intrigue' ? '1px solid #f43f5e' : '1px solid rgba(255,255,255,0.1)',
              background: activeTab === 'intrigue' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(0,0,0,0.3)',
              color: activeTab === 'intrigue' ? '#fda4af' : 'var(--text-muted)',
              fontWeight: 'bold',
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <span>🤫</span>
            <span>막후 혈통 & 은밀한 자손</span>
            {intrigues.length > 0 && (
              <span style={{ background: '#e11d48', color: '#fff', fontSize: '0.72rem', padding: '1px 6px', borderRadius: '10px' }}>
                {intrigues.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Official Dynasty & Lineage */}
        {activeTab === 'lineage' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* 1. Ancestors / Past Generations */}
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--gold-accent)', fontWeight: 'bold', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{labels.ancestorHeader}</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(212, 175, 55, 0.2)' }}></div>
            </div>
            
            {ancestors.length > 0 ? (
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '6px' }}>
                {ancestors.map((anc, idx) => (
                  <div key={idx} style={{
                    padding: '12px 16px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    minWidth: '180px'
                  }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>[선대 {idx + 1}세] 턴 {anc.turn}</div>
                    <div style={{ fontWeight: 'bold', color: 'var(--text-main)', marginTop: '4px' }}>⚰️ {anc.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{anc.note}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: '14px 18px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                fontSize: '0.9rem',
                color: 'var(--text-muted)',
                textAlign: 'center'
              }}>
                현재 초대 개척자로서 역사를 새로 써 내려가고 있습니다.
              </div>
            )}
          </div>

          {/* Vertical Connecting Line */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '2px', height: '24px', background: 'var(--gold-accent)', opacity: 0.6 }}></div>
          </div>

          {/* 2. Current Generation (Ruler & Spouse/Partner) */}
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--gold-accent)', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{archetypeDetails.icon} 현재 계승 주체 (Current Figure)</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(212, 175, 55, 0.2)' }}></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', alignItems: 'stretch' }}>
              
              {/* Ruler Card */}
              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(15, 23, 42, 0.6))',
                border: '2px solid var(--gold-accent)',
                borderRadius: '12px',
                boxShadow: '0 0 20px rgba(212, 175, 55, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '2.4rem', flexShrink: 0 }}>{archetypeDetails.icon}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--gold-accent)', wordBreak: 'break-word' }}>{rulerName}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{rulerTitle} &bull; {rulerAge !== '-' ? `${rulerAge}세` : '-'}</div>
                    </div>
                  </div>
                  <div style={{ background: 'var(--gold-accent)', color: '#111', fontSize: '0.75rem', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                    {labels.rulerCardLabel}
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', background: 'rgba(0, 0, 0, 0.3)', padding: '10px 12px', borderRadius: '6px' }}>
                  <div><strong>신분/직위:</strong> {rulerStatus}</div>
                  <div style={{ marginTop: '4px' }}><strong>종교:</strong> {gameState.personalInfo?.['종교'] || '미상'}</div>
                </div>
              </div>

              {/* Spouse/Partner Card */}
              <div style={{
                padding: '20px',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '2.4rem', flexShrink: 0 }}>{archetype === 'clergy' ? '🕊️' : '💍'}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#f43f5e', wordBreak: 'break-word' }}>{spouse}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {archetype === 'clergy'
                          ? '독신 및 금욕 규율 준수'
                          : spouse === '없음' ? '미혼 (인연 형성 필요)' : '정실 / 동반자'}
                      </div>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#f43f5e', border: '1px solid #f43f5e', fontSize: '0.75rem', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                    {labels.spouseLabel}
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(0, 0, 0, 0.2)', padding: '10px 12px', borderRadius: '6px', lineHeight: '1.5' }}>
                  {archetype === 'clergy'
                    ? '성직자 규율에 따라 세속의 혼인을 멀리하고 경건한 신앙과 교단에 헌신하고 있습니다.'
                    : spouse === '없음' 
                    ? '동반자 및 혼인은 세력 확장과 심리적 안정, 대를 잇는 든든한 기반입니다.' 
                    : `신뢰할 수 있는 동반자와 함께 여정을 지속하고 있습니다.`}
                </div>
              </div>

            </div>
          </div>

          {/* Vertical Connecting Line */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '2px', height: '24px', background: 'var(--gold-accent)', opacity: 0.6 }}></div>
          </div>

          {/* 3. Next Generation (Heir & Children/Disciples) */}
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--gold-accent)', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚔️ {labels.heirLabel} 및 계승 (Next Generation & Succession)</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(212, 175, 55, 0.2)' }}></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              
              {/* Designated Heir Card */}
              <div style={{
                padding: '20px',
                background: hasHeir ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(15, 23, 42, 0.6))' : 'rgba(0,0,0,0.3)',
                border: hasHeir ? '2px solid var(--success)' : '1px dashed rgba(239, 68, 68, 0.5)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {/* Header: Icon, Name, Law & Badge with safe spacing */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '2.2rem', lineHeight: 1, flexShrink: 0, marginTop: '2px' }}>{hasHeir ? '🛡️' : '⚠️'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontSize: '1.15rem', 
                        fontWeight: 'bold', 
                        color: hasHeir ? 'var(--success)' : 'var(--danger)',
                        wordBreak: 'keep-all',
                        overflowWrap: 'break-word',
                        lineHeight: '1.35',
                        marginBottom: '4px'
                      }}>
                        {heir}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        계승법: {successionLaw}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    background: hasHeir ? 'var(--success)' : 'var(--danger)',
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}>
                    {hasHeir ? labels.heirLabel : '계승자 부재'}
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(0, 0, 0, 0.25)', padding: '10px 12px', borderRadius: '6px', lineHeight: '1.4' }}>
                  {hasHeir 
                    ? `유고(사망 또는 은퇴) 시 계승자 '${heir}'에게 모든 소지품과 직위, 유산이 그대로 계승됩니다.` 
                    : '후계자나 수제자가 지정되지 않은 상태에서 사망하면 계보가 단절될 수 있습니다.'}
                </div>
              </div>

              {/* Children / Companions Card */}
              <div style={{
                padding: '20px',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '1.8rem' }}>{archetype === 'wanderer' ? '👥' : archetype === 'company' ? '⚔️' : archetype === 'clergy' ? '📖' : '👶'}</span>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '1.1rem' }}>{labels.childrenLabel}</div>
                </div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '6px', minHeight: '60px' }}>
                  {children === '없음' ? (
                    <span style={{ color: 'var(--text-muted)' }}>등록된 인원이 없습니다.</span>
                  ) : (
                    <span>{children}</span>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Succession Manual Trigger Action */}
          {hasHeir && (
            <div style={{ marginTop: '10px', textAlign: 'center', background: 'rgba(212, 175, 55, 0.05)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                원할 경우 현재 인물을 은퇴시키고 후계자 [{heir}]에게 모든 유산을 승계하여 새로운 세대를 시작할 수 있습니다.
              </div>
              <button 
                onClick={() => {
                  if (confirm(`후계자 [${heir}] (으)로 세대를 교체하여 새 오프닝을 시작하시겠습니까?`)) {
                    onClose();
                    onSuccession();
                  }
                }}
                style={{
                  background: 'linear-gradient(45deg, #b45309, #d97706)',
                  color: '#fff',
                  border: '1px solid var(--gold-accent)',
                  padding: '10px 24px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(217, 119, 6, 0.4)'
                }}
              >
                ⚔️ 후계자 [{heir}] 즉위 / 승계 (세대 교체 발동)
              </button>
            </div>
          )}

        </div>
        )}

        {/* Tab 2: Bloodline Intrigue & Clandestine Lineage */}
        {activeTab === 'intrigue' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.25)', padding: '14px 18px', borderRadius: '10px' }}>
              <div style={{ color: '#fda4af', fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span>🤫 막후 혈통 공작 및 은밀한 자손 (Bloodline Intrigue)</span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.45' }}>
                타 가문의 여인들과의 은밀한 관계나 탁란(Cuckoo)을 통해 낳은 핏줄로 상위 영지의 계승권을 쥐고 배후에서 섭정으로 군림합니다.
              </div>
              {familyState?.secretChildren && familyState.secretChildren !== '없음' && (
                <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', fontSize: '0.85rem', color: '#fecdd3' }}>
                  <strong>현재 혈통 상황:</strong> {familyState.secretChildren}
                </div>
              )}
            </div>

            {intrigues.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {intrigues.map((item, idx) => {
                  const stageBadge = 
                    item.stage === 'ruler_puppet' ? { text: '👑 괴뢰 영주 (막후 섭정 지배)', bg: 'rgba(212, 175, 55, 0.2)', border: 'var(--gold-accent)', color: 'var(--gold-accent)' } :
                    item.stage === 'heir_puppet' ? { text: '🎭 괴뢰 후계자 (탁란 상속권자)', bg: 'rgba(56, 189, 248, 0.2)', border: '#38bdf8', color: '#7dd3fc' } :
                    item.stage === 'legitimized' ? { text: '📜 교황청/군주 공인 적자', bg: 'rgba(16, 185, 129, 0.2)', border: '#10b981', color: '#6ee7b7' } :
                    { text: '🤫 은밀한 핏줄 (비밀 보존 중)', bg: 'rgba(244, 63, 94, 0.2)', border: '#f43f5e', color: '#fda4af' };

                  const riskColor = item.exposureRisk >= 70 ? '#ef4444' : item.exposureRisk >= 40 ? '#f59e0b' : '#10b981';

                  return (
                    <div key={idx} style={{ background: 'rgba(0, 0, 0, 0.4)', border: `1px solid ${stageBadge.border}55`, borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.8rem' }}>👶</span>
                          <div>
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{item.childName}</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '8px' }}>목표: <strong style={{ color: '#38bdf8' }}>{item.claimTitle}</strong></span>
                          </div>
                        </div>
                        <span style={{ padding: '3px 10px', borderRadius: '4px', background: stageBadge.bg, border: `1px solid ${stageBadge.border}`, color: stageBadge.color, fontSize: '0.78rem', fontWeight: 'bold' }}>
                          {stageBadge.text}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.83rem' }}>
                        <div><span style={{ color: 'var(--text-muted)' }}>실질 친부:</span> <strong style={{ color: 'var(--gold-accent)' }}>{item.realFather || rulerName} (본인)</strong></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>명목상 부친:</span> <strong style={{ color: 'var(--text-main)' }}>{item.officialFather}</strong></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>생모:</span> <strong style={{ color: '#fda4af' }}>{item.motherName}</strong></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>상속 명분:</span> <strong style={{ color: '#60a5fa' }}>{item.claimTitle}</strong></div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>⚠️ 발각 및 추문 위험도</span>
                          <span style={{ color: riskColor, fontWeight: 'bold' }}>{item.exposureRisk}%</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, item.exposureRisk)}%`, height: '100%', background: riskColor }} />
                        </div>
                      </div>

                      {item.desc && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '6px', lineHeight: '1.4' }}>
                          {item.desc}
                        </div>
                      )}

                      {(item.stage === 'ruler_puppet' || item.stage === 'heir_puppet') && (
                        <button
                          onClick={() => {
                            if (confirm(`막후에서 조종 중인 자손 [${item.childName}]을(를) 정식 군주로 옹립하고 막후 섭정 세대로 승계하시겠습니까?`)) {
                              onClose();
                              onSuccession();
                            }
                          }}
                          style={{
                            marginTop: '4px',
                            background: 'linear-gradient(45deg, #e11d48, #be123c)',
                            color: '#fff',
                            border: '1px solid #f43f5e',
                            padding: '10px',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(225, 29, 72, 0.3)'
                          }}
                        >
                          👑 막후 섭정으로서 세대 교체 (Claim Realm via Secret Bloodline)
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  현재 기록된 은밀한 자손이나 혈통 공작이 없습니다.
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--gold-accent)' }}>
                    💡 현재 신분({rulerStatus}) 맞춤 혈통 장악 가이드:
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-main)', lineHeight: '1.6', background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '8px' }}>
                    {archetype === 'clergy' ? (
                      <>
                        <strong>⛪ 성직자의 고해성사 밀회 & 뻐꾸기 탁란 전략:</strong><br />
                        1. 영지 내 귀족 미망인이나 영주 부인과 신뢰/애정도를 쌓아 은밀한 밀회 관계를 맺으십시오.<br />
                        2. 아이가 태어나면 남편 영주의 적장자로 속여 입적(탁란)시키거나, 교황청 인맥으로 적자 공인을 획득하십시오.<br />
                        3. 기존 영주 유고 시 아이를 영주로 옹립하고, 플레이어는 '영지 섭정(Regent) 및 대교구 총대리'로 취임하여 교권과 세속 권력을 한 손에 쥡니다.
                      </>
                    ) : archetype === 'wanderer' ? (
                      <>
                        <strong>🗡️ 방랑자의 로맨스 유혹 & 데릴사위(가주 찬탈) 전략:</strong><br />
                        1. 유력 귀족 가문의 상속녀나 과부의 영지에 무용과 매력으로 접근하십시오.<br />
                        2. 비밀리에 아이를 잉태시키거나 데릴사위로 혼인하여, 후계가 끊긴 가문의 영주권을 흡수하고 정규 봉건 영주로 신분을 수직 상승시킬 수 있습니다.
                      </>
                    ) : archetype === 'company' ? (
                      <>
                        <strong>👥 상단/용병단의 부채 담보 혈통 매수 전략:</strong><br />
                        1. 재정난에 처한 귀족 가문에 거액의 대출을 제공하거나 군사적 보호를 대가로 혈통 계약을 맺으십시오.<br />
                        2. 자신의 아이를 막대한 지참금과 함께 귀족 가문의 차기 가주로 입양시켜 영지 전체를 상단의 사유 재산으로 흡수할 수 있습니다.
                      </>
                    ) : (
                      <>
                        <strong>🏰 봉건 귀족의 정략혼 & 계승권 독점 공작 전략:</strong><br />
                        1. 이웃 대영주의 상속녀를 유혹하거나 정략혼을 맺어 태어난 자식에게 양 가문의 상속 명분을 몰아주십시오.<br />
                        2. 본가의 경쟁 계승자들을 암살/추방하여 내 자식을 단독 제1계승자로 만들고 두 영지를 평화적으로 합병하십시오.
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
