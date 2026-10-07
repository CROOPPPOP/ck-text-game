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
                  const name = parts[0];
                  const trustStr = parts[1];
                  const affStr = parts[2];
                  const descStr = parts.slice(3).join(' | ').replace('관계:', '').trim();

                  const trustMatch = trustStr.match(/(\d+)/);
                  const affMatch = affStr.match(/(\d+)/);

                  const trustVal = trustMatch ? Math.min(100, Math.max(0, parseInt(trustMatch[1], 10))) : 50;
                  const affVal = affMatch ? Math.min(100, Math.max(0, parseInt(affMatch[1], 10))) : 50;

                  const isRomance = affStr.includes('애정도') || descStr.includes('연인') || descStr.includes('배우자');
                  const isObsessive = affStr.includes('집착') || affStr.includes('광애');
                  const isSwornFriend = affStr.includes('맹우') || trustStr.includes('맹우');

                  return (
                    <div 
                      key={idx} 
                      style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: isObsessive ? '1px solid #c084fc' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        boxShadow: isObsessive ? '0 0 15px rgba(192, 132, 252, 0.2)' : 'none'
                      }}
                    >
                      {/* Character Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: isRomance ? 'rgba(244, 63, 94, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                            border: `1px solid ${isRomance ? '#f43f5e' : '#38bdf8'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem'
                          }}>
                            {isRomance ? '❤️' : isSwornFriend ? '🛡️' : '👤'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 'bold', color: 'var(--gold-accent)', fontSize: '1.05rem' }}>
                              {name}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {descStr}
                            </div>
                          </div>
                        </div>

                        {/* Special Badges */}
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

                      {/* Opinion Gauges */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: '6px' }}>
                        {/* Trust Gauge */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#7dd3fc', marginBottom: '2px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Handshake size={12} />
                              <span>신뢰도 (Trust)</span>
                            </span>
                            <span style={{ fontWeight: 'bold' }}>{trustVal}%</span>
                          </div>
                          <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${trustVal}%`, height: '100%', background: 'linear-gradient(90deg, #0284c7, #38bdf8)' }} />
                          </div>
                        </div>

                        {/* Affection Gauge */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: isRomance ? '#fda4af' : '#fef08a', marginBottom: '2px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Heart size={12} />
                              <span>호감/애정도 (Affection)</span>
                            </span>
                            <span style={{ fontWeight: 'bold' }}>{affVal}%</span>
                          </div>
                          <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${affVal}%`, height: '100%', background: isRomance ? 'linear-gradient(90deg, #e11d48, #f43f5e)' : 'linear-gradient(90deg, #d97706, #fbbf24)' }} />
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
                const status = match ? match[2].trim() : '미상';

                const isAllied = status.includes('동맹') || status.includes('우호');
                const isHostile = status.includes('적대') || status.includes('교전') || status.includes('전쟁');

                const statusColor = isAllied ? '#38bdf8' : isHostile ? '#ef4444' : '#fbbf24';
                const statusBg = isAllied ? 'rgba(56, 189, 248, 0.15)' : isHostile ? 'rgba(239, 68, 68, 0.15)' : 'rgba(251, 191, 36, 0.15)';

                return (
                  <div 
                    key={idx}
                    style={{
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: `1px solid ${statusColor}44`,
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
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
