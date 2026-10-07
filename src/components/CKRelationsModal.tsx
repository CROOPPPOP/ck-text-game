"use client";

import React from 'react';
import { ParsedState } from '@/lib/parser';
import { Users, Heart, Shield, Swords, Handshake, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gameState: ParsedState;
}

export default function CKRelationsModal({ isOpen, onClose, gameState }: Props) {
  if (!isOpen) return null;

  const personalRels = gameState.relationships?.personal || [];
  const factionRels = gameState.relationships?.faction || [];

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
          maxHeight: '88vh',
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
            cursor: 'pointer'
          }}
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(212, 175, 55, 0.25)', paddingBottom: '16px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(244, 63, 94, 0.3) 0%, rgba(15, 23, 42, 0.8) 100%)',
            border: '2px solid #f43f5e',
            fontSize: '1.8rem',
            marginBottom: '10px'
          }}>
            🤝
          </div>
          <h2 style={{ color: 'var(--gold-accent)', fontSize: '1.7rem', fontWeight: 'bold', margin: '0 0 4px 0', letterSpacing: '1px' }}>
            크루세이더 킹즈 궁정 인물 & 외교 관계망
          </h2>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            군주와의 호감도, 신뢰도, 비밀 음모 및 주변 세력 간 외교 상태
          </div>
        </div>

        {/* 1. Personal Court & Characters */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--gold-accent)',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            marginBottom: '14px',
            borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
            paddingBottom: '8px'
          }}>
            <Users size={18} />
            <span>궁정 인물 및 인간관계 ({personalRels.length}명)</span>
          </div>

          {personalRels.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '14px' }}>
              {personalRels.map((rel, idx) => {
                const parts = rel.split('|').map(p => p.trim());
                if (parts.length >= 4) {
                  const rawName = parts[0];
                  const roleMatch = rawName.match(/^(.*?)\s*\((.*?)\)$/);
                  const name = roleMatch ? roleMatch[1].trim() : rawName;
                  const role = roleMatch ? roleMatch[2].trim() : '';

                  const trustStr = parts[1];
                  const affStr = parts[2];
                  const descStr = parts.slice(3).join(' | ').replace('관계:', '').trim();

                  const trustMatch = trustStr.match(/(\d+)/);
                  const affMatch = affStr.match(/(\d+)/);

                  const trustVal = trustMatch ? Math.min(100, Math.max(0, parseInt(trustMatch[1], 10))) : 50;
                  const affVal = affMatch ? Math.min(100, Math.max(0, parseInt(affMatch[1], 10))) : 50;

                  const isRomance = affStr.includes('애정도') || descStr.includes('연인') || descStr.includes('배우자');
                  const isRival = affStr.includes('숙적') || affStr.includes('라이벌') || descStr.includes('숙적') || descStr.includes('라이벌') || (trustStr.includes('경계') && trustVal <= 15);
                  const isObsessive = affStr.includes('집착') || affStr.includes('광애');
                  const isSwornFriend = affStr.includes('맹우') || trustStr.includes('맹우');

                  const borderColor = isRival ? '#ef4444' : isObsessive ? '#c084fc' : isSwornFriend ? '#fbbf24' : 'rgba(255, 255, 255, 0.1)';

                  return (
                    <div 
                      key={idx} 
                      style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: `1px solid ${borderColor}`,
                        borderRadius: '10px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        boxShadow: isRival ? '0 0 12px rgba(239, 68, 68, 0.25)' : isObsessive ? '0 0 15px rgba(192, 132, 252, 0.2)' : 'none'
                      }}
                    >
                      {/* Character Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: isRival ? 'rgba(239, 68, 68, 0.2)' : isRomance ? 'rgba(244, 63, 94, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                            border: `1px solid ${isRival ? '#ef4444' : isRomance ? '#f43f5e' : '#38bdf8'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem'
                          }}>
                            {isRival ? '⚔️' : isRomance ? '❤️' : isSwornFriend ? '🛡️' : '👤'}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 'bold', color: isRival ? '#fca5a5' : 'var(--gold-accent)', fontSize: '1.05rem' }}>
                                {name}
                              </span>
                              {role && (
                                <span style={{ fontSize: '0.72rem', background: 'rgba(56, 189, 248, 0.15)', color: '#7dd3fc', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '1px 6px', borderRadius: '4px' }}>
                                  {role}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: isRival ? '#fca5a5' : 'var(--text-muted)' }}>
                              {descStr}
                            </div>
                          </div>
                        </div>

                        {/* Special Badges */}
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {isRival && (
                            <span style={{ fontSize: '0.75rem', color: '#fca5a5', background: 'rgba(239, 68, 68, 0.2)', padding: '2px 8px', borderRadius: '4px', border: '1px solid #ef4444', fontWeight: 'bold' }}>
                              숙적 / 라이벌
                            </span>
                          )}
                          {isObsessive && (
                            <span style={{ fontSize: '0.75rem', color: '#c084fc', background: 'rgba(192, 132, 252, 0.2)', padding: '2px 8px', borderRadius: '4px', border: '1px solid #c084fc' }}>
                              광애 / 집착
                            </span>
                          )}
                          {isSwornFriend && (
                            <span style={{ fontSize: '0.75rem', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.2)', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fbbf24' }}>
                              맹우
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Opinion Gauges */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: '6px' }}>
                        {/* Trust Gauge */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#7dd3fc', marginBottom: '2px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Handshake size={12} />
                              <span>{trustStr.replace(/\d+/, '').replace('-', '').trim() || '신뢰도'}</span>
                            </span>
                            <span style={{ fontWeight: 'bold' }}>{trustVal}%</span>
                          </div>
                          <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${trustVal}%`, height: '100%', background: 'linear-gradient(90deg, #0284c7, #38bdf8)' }} />
                          </div>
                        </div>

                        {/* Affection Gauge */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: isRival ? '#fca5a5' : isRomance ? '#fda4af' : '#fef08a', marginBottom: '2px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Heart size={12} />
                              <span>{affStr.replace(/\d+/, '').replace('-', '').trim() || (isRival ? '적대도' : isRomance ? '애정도' : '우정도')}</span>
                            </span>
                            <span style={{ fontWeight: 'bold' }}>{affVal}%</span>
                          </div>
                          <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${affVal}%`, height: '100%', background: isRival ? 'linear-gradient(90deg, #7f1d1d, #dc2626)' : isRomance ? 'linear-gradient(90deg, #e11d48, #f43f5e)' : 'linear-gradient(90deg, #d97706, #fbbf24)' }} />
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                }
                return (
                  <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '8px', color: 'var(--text-main)' }}>
                    {rel}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              현재 기록된 주요 궁정 인물이 없습니다.
            </div>
          )}
        </div>

        {/* 2. Faction Diplomacy */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--gold-accent)',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            marginBottom: '14px',
            borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
            paddingBottom: '8px'
          }}>
            <Shield size={18} />
            <span>세력 간 외교 상태 (Faction Diplomacy)</span>
          </div>

          {factionRels.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              {factionRels.map((rel, idx) => {
                const match = rel.match(/^(.*?)\s+-\s+(.*)$/);
                const name = match ? match[1].replace(/^[○•\s]+/, '').trim() : rel;
                const rest = match ? match[2].trim() : '미상';
                const pipeParts = rest.split('|').map(p => p.trim());
                const status = pipeParts[0];
                let threat = '';
                let attitude = '';
                pipeParts.slice(1).forEach(p => {
                  if (p.startsWith('위협도:')) threat = p.replace('위협도:', '').trim();
                  if (p.startsWith('태도:')) attitude = p.replace('태도:', '').trim();
                });

                const isAllied = status.includes('동맹') || status.includes('우호');
                const isHostile = status.includes('적대') || status.includes('교전') || status.includes('전쟁') || status.includes('파문');
                const isVassal = status.includes('주종') || status.includes('봉신') || status.includes('주군');

                const statusColor = isAllied ? '#38bdf8' : isHostile ? '#ef4444' : isVassal ? '#c084fc' : '#fbbf24';
                const statusBg = isAllied ? 'rgba(56, 189, 248, 0.15)' : isHostile ? 'rgba(239, 68, 68, 0.15)' : isVassal ? 'rgba(192, 132, 252, 0.15)' : 'rgba(251, 191, 36, 0.15)';

                return (
                  <div 
                    key={idx}
                    style={{
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: `1px solid ${statusColor}44`,
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isHostile ? <Swords size={16} color="#ef4444" /> : <Shield size={16} color={statusColor} />}
                        <span style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.95rem' }}>{name}</span>
                      </div>
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        color: statusColor,
                        background: statusBg,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: `1px solid ${statusColor}`
                      }}>
                        {status}
                      </span>
                    </div>

                    {(threat || attitude) && (
                      <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem' }}>
                        {threat && (
                          <span style={{ color: threat.includes('위험') || threat.includes('치명') ? '#f87171' : threat.includes('안전') ? '#4ade80' : '#fbbf24', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '3px' }}>
                            ⚠️ 위협: {threat}
                          </span>
                        )}
                        {attitude && (
                          <span style={{ color: attitude.includes('우호') ? '#38bdf8' : attitude.includes('적대') ? '#f87171' : '#e2e8f0', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '3px' }}>
                            👁️ 태도: {attitude}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              기록된 세력 외교 관계가 없습니다.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
