"use client";

import React from "react";
import { ParsedState } from "@/lib/parser";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gameState: ParsedState;
  onSuccession: () => void;
}

export default function FamilyTreeModal({ isOpen, onClose, gameState, onSuccession }: Props) {
  if (!isOpen) return null;

  const rulerName = gameState.personalInfo?.['이름'] || '군주';
  const rulerTitle = gameState.personalInfo?.['칭호'] || gameState.personalInfo?.['직위'] || '영주';
  const rulerAge = gameState.personalInfo?.['나이'] || '-';
  const rulerStatus = gameState.personalInfo?.['신분'] || '귀족';
  const familyState = gameState.familyState;
  const spouse = familyState?.spouse || '없음';
  const heir = familyState?.heir || '미정';
  const children = familyState?.children || '없음';
  const successionLaw = familyState?.successionLaw || '분할 상속제';

  const hasHeir = heir && !heir.includes('없음') && !heir.includes('미정');

  // 선대 군주 추출 (과거 연대기 또는 상속 기록에서 탐색)
  const ancestors = gameState.chronicle
    ?.filter(c => c.action?.includes('후계자') || c.action?.includes('세대 교체') || c.summary?.includes('사망'))
    .map(c => ({
      name: c.summary?.split(' ')[0] || '선대 군주',
      turn: c.turn,
      note: c.summary || '가문의 영광을 일군 군주'
    })) || [];

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
            🛡️
          </div>
          <h2 style={{ color: 'var(--gold-accent)', fontSize: '1.8rem', fontWeight: 'bold', margin: '0 0 6px 0', letterSpacing: '2px' }}>
            👑 【 가문 및 계보 계승도 】
          </h2>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {rulerName} 가문 &bull; {rulerStatus} &bull; <span style={{ color: '#60a5fa' }}>📜 {successionLaw}</span>
          </div>
        </div>

        {/* Tree Layout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* 1. Ancestors / Past Generations */}
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--gold-accent)', fontWeight: 'bold', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🏛️ 선대 군주 및 시조 계보</span>
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
                현재 초대 창업 군주로서 가문의 역사를 새로 써 내려가고 있습니다.
              </div>
            )}
          </div>

          {/* Vertical Connecting Line */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '2px', height: '24px', background: 'var(--gold-accent)', opacity: 0.6 }}></div>
          </div>

          {/* 2. Current Generation (Ruler & Spouse) */}
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--gold-accent)', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>👑 현재 당주 및 부부 (Current Generation)</span>
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
                position: 'relative'
              }}>
                <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--gold-accent)', color: '#111', fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px' }}>
                  현재 군주
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '2.4rem' }}>👑</div>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--gold-accent)' }}>{rulerName}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{rulerTitle} &bull; {rulerAge}세</div>
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', background: 'rgba(0, 0, 0, 0.3)', padding: '10px 12px', borderRadius: '6px' }}>
                  <div><strong>신분/직위:</strong> {rulerStatus}</div>
                  <div style={{ marginTop: '4px' }}><strong>종교:</strong> {gameState.personalInfo?.['종교'] || '미상'}</div>
                </div>
              </div>

              {/* Spouse Card */}
              <div style={{
                padding: '20px',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: '12px',
                position: 'relative'
              }}>
                <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(244, 63, 94, 0.2)', color: '#f43f5e', border: '1px solid #f43f5e', fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px' }}>
                  배우자
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '2.4rem' }}>💍</div>
                  <div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#f43f5e' }}>{spouse}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {spouse === '없음' ? '미혼 (혼담 추진 필요)' : '정실 부인 / 부군'}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(0, 0, 0, 0.2)', padding: '10px 12px', borderRadius: '6px', lineHeight: '1.5' }}>
                  {spouse === '없음' 
                    ? '혼인은 강력한 가문 간 군사 동맹과 혈통 강화의 기회입니다. 외교적 정략결혼을 추진하십시오.' 
                    : `가문의 결합을 통해 혈통의 명분을 지키고 있습니다.`}
                </div>
              </div>

            </div>
          </div>

          {/* Vertical Connecting Line */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '2px', height: '24px', background: 'var(--gold-accent)', opacity: 0.6 }}></div>
          </div>

          {/* 3. Next Generation (Heir & Children) */}
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--gold-accent)', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚔️ 후계자 및 차세대 혈통 (Next Generation & Succession)</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(212, 175, 55, 0.2)' }}></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              
              {/* Designated Heir Card */}
              <div style={{
                padding: '20px',
                background: hasHeir ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(15, 23, 42, 0.6))' : 'rgba(0,0,0,0.3)',
                border: hasHeir ? '2px solid var(--success)' : '1px dashed rgba(239, 68, 68, 0.5)',
                borderRadius: '12px',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: hasHeir ? 'var(--success)' : 'var(--danger)',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {hasHeir ? '1순위 지정 후계자' : '후계자 부재 위기'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '2.2rem' }}>{hasHeir ? '🛡️' : '⚠️'}</div>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: hasHeir ? 'var(--success)' : 'var(--danger)' }}>
                      {heir}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      계승법: {successionLaw}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(0, 0, 0, 0.25)', padding: '10px 12px', borderRadius: '6px', lineHeight: '1.4' }}>
                  {hasHeir 
                    ? `군주 유고(사망 또는 퇴위) 시 후계자 '${heir}'에게 가문의 작위와 소지품, 영지 통치권이 그대로 승계됩니다.` 
                    : '후계자가 지정되지 않은 상태에서 군주가 사망하면 가문이 멸망(게임 오버)할 수 있습니다.'}
                </div>
              </div>

              {/* Children Card */}
              <div style={{
                padding: '20px',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '1.8rem' }}>👶</span>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '1.1rem' }}>자녀 목록</div>
                </div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '6px', minHeight: '60px' }}>
                  {children === '없음' ? (
                    <span style={{ color: 'var(--text-muted)' }}>등록된 자녀가 없습니다.</span>
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
                원할 경우 현재 군주를 은퇴시키고 지정 후계자로 새로운 세대 통치를 개시할 수 있습니다.
              </div>
              <button 
                onClick={() => {
                  if (confirm(`현재 군주에서 후계자 [${heir}] (으)로 세대를 교체하여 새 오프닝을 시작하시겠습니까?`)) {
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
                ⚔️ 후계자 [{heir}] 즉위 (세대 교체 발동)
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
