"use client";

import React from 'react';
import { ParsedState } from '@/lib/parser';
import { calculateCKAttributes, parseCKStress, getHeraldryEmblem, getArchetypeDetails } from '@/lib/ckVisuals';
import { Crown, Shield, Sword, Scroll, BookOpen, Eye, Award, Flame, Activity, Sparkles, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gameState: ParsedState;
}

export default function CKCharacterModal({ isOpen, onClose, gameState }: Props) {
  if (!isOpen) return null;

  const rulerName = gameState.personalInfo?.['이름'] || '군주';
  const rulerTitle = gameState.personalInfo?.['칭호'] || gameState.personalInfo?.['직위'] || '영주';
  const rulerAge = gameState.personalInfo?.['나이'] || '-';
  const rulerStatus = gameState.personalInfo?.['신분'] || '귀족';
  const culture = gameState.personalInfo?.['문화'] || '미상';
  const religion = gameState.personalInfo?.['종교'] || '미상';
  const attributes = calculateCKAttributes(gameState);
  const stress = parseCKStress(gameState);
  const archetypeDetails = getArchetypeDetails(gameState);
  const emblem = getHeraldryEmblem(rulerName, culture, archetypeDetails.archetype);

  const getTraitCategoryStyle = (category: string) => {
    switch (category) {
      case '신체특성':
        return { border: '#ef4444', color: '#fca5a5', bg: 'rgba(239, 68, 68, 0.15)', icon: '💪' };
      case '정신특성':
        return { border: '#3b82f6', color: '#93c5fd', bg: 'rgba(59, 130, 246, 0.15)', icon: '🧠' };
      case '감각특성':
        return { border: '#10b981', color: '#6ee7b7', bg: 'rgba(16, 185, 129, 0.15)', icon: '👁️' };
      case '전문특성':
        return { border: '#d4af37', color: '#fcd34d', bg: 'rgba(212, 175, 55, 0.15)', icon: '🎖️' };
      case '잠재특성':
        return { border: '#a855f7', color: '#d8b4fe', bg: 'rgba(168, 85, 247, 0.15)', icon: '✨' };
      case '일시적특성':
        return { border: '#ec4899', color: '#fbcfe8', bg: 'rgba(236, 72, 153, 0.15)', icon: '⏳' };
      default:
        return { border: '#d4af37', color: '#fcd34d', bg: 'rgba(212, 175, 55, 0.15)', icon: '🏷️' };
    }
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
          maxWidth: '880px',
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
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            transition: 'color 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <X size={24} />
        </button>

        {/* 1. Heraldry & Character Identity Header */}
        <div style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'center',
          borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
          paddingBottom: '20px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          {/* Ornate Dynasty Crest */}
          <div style={{
            width: '84px',
            height: '96px',
            background: emblem.bg,
            border: `3px solid ${emblem.border}`,
            borderRadius: '6px 6px 36px 36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6), inset 0 0 15px rgba(212, 175, 55, 0.4)',
            flexShrink: 0
          }}>
            {emblem.icon}
          </div>

          <div style={{ flex: 1, minWidth: '240px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.95rem',
              color: 'var(--gold-accent)',
              fontWeight: 'bold',
              letterSpacing: '1px'
            }}>
              <Crown size={18} style={{ color: 'var(--gold-accent)' }} />
              <span>{rulerTitle}</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>&bull;</span>
              <span style={{ color: 'var(--text-muted)' }}>{rulerStatus}</span>
            </div>

            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: 'var(--text-main)',
              margin: '4px 0 8px 0',
              letterSpacing: '1px',
              textShadow: '0 2px 10px rgba(0,0,0,0.5)'
            }}>
              {rulerName}
            </h1>

            {/* Cultural & Dynastic Badges */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '0.85rem' }}>
              <span style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '3px 10px',
                borderRadius: '4px',
                color: 'var(--text-muted)'
              }}>
                나이: <strong style={{ color: 'var(--text-main)' }}>{rulerAge}세</strong>
              </span>
              <span style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '3px 10px',
                borderRadius: '4px',
                color: 'var(--text-muted)'
              }}>
                문화: <strong style={{ color: '#60a5fa' }}>{culture}</strong>
              </span>
              <span style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '3px 10px',
                borderRadius: '4px',
                color: 'var(--text-muted)'
              }}>
                종교: <strong style={{ color: '#c084fc' }}>{religion}</strong>
              </span>
            </div>
          </div>

          {/* Stress Meter Block */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.35)',
            border: `1px solid ${stress.color}55`,
            borderRadius: '10px',
            padding: '12px 16px',
            minWidth: '200px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 'bold', color: stress.color }}>
                <Flame size={16} />
                <span>스트레스 {stress.tier > 0 ? `Lv.${stress.tier}` : '안정'}</span>
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#fff' }}>
                {stress.value} / 100
              </span>
            </div>
            {/* 3-Tier Step Gauge */}
            <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                width: `${stress.value}%`,
                height: '100%',
                background: `linear-gradient(90deg, #10b981 0%, #fbbf24 45%, #ef4444 85%)`,
                borderRadius: '4px'
              }} />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              {stress.breakdownRisk}
            </div>
          </div>
        </div>

        {/* 1.5 Archetype Origin & Special Mechanics Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.12), rgba(15, 23, 42, 0.75))',
          border: '1px solid rgba(212, 175, 55, 0.4)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '26px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.5rem' }}>{archetypeDetails.icon}</span>
              <div>
                <span style={{
                  background: 'var(--gold-accent)',
                  color: '#0f172a',
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  marginRight: '8px'
                }}>
                  {archetypeDetails.num} 아키타입
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--gold-hover)' }}>
                  {archetypeDetails.title}
                </span>
              </div>
            </div>
            <span style={{ fontSize: '0.85rem', color: '#93c5fd' }}>
              {archetypeDetails.subtitle}
            </span>
          </div>

          <div style={{
            fontSize: '0.82rem',
            color: '#e2e8f0',
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '8px 12px',
            borderRadius: '6px',
            marginBottom: '12px',
            lineHeight: '1.4'
          }}>
            <strong style={{ color: 'var(--gold-accent)' }}>📌 아키타입 핵심 룰: </strong>
            {archetypeDetails.coreRule}
          </div>

          {/* 4 Archetype Vital Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
            {archetypeDetails.badgeList.map((badge, bIdx) => (
              <div key={bIdx} style={{
                background: 'rgba(0, 0, 0, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '1.2rem' }}>{badge.icon}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{badge.label}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: badge.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={badge.value}>
                    {badge.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Crusader Kings 3 Core Attributes (5대 핵심 능력치 + 기량) */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px',
            borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
            paddingBottom: '8px'
          }}>
            <h2 style={{
              fontSize: '1.15rem',
              fontWeight: 'bold',
              color: 'var(--gold-accent)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: 0
            }}>
              <Award size={18} />
              <span>크루세이더 킹즈 5대 핵심 능력치 및 기량</span>
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              선천 및 후천 능력치 기반 산출
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '12px'
          }}>
            {/* Diplomacy */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '8px',
              padding: '12px 14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7dd3fc', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  <Award size={16} />
                  <span>외교력 (Diplomacy)</span>
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#38bdf8' }}>
                  {attributes.diplomacy.value} <span style={{ fontSize: '0.75rem', color: '#bae6fd' }}>({attributes.diplomacy.grade})</span>
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, attributes.diplomacy.value * 4)}%`, height: '100%', background: '#38bdf8' }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                기반: {attributes.diplomacy.keyStats.join(', ')}
              </div>
            </div>

            {/* Martial */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '8px',
              padding: '12px 14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fca5a5', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  <Sword size={16} />
                  <span>무력 (Martial)</span>
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ef4444' }}>
                  {attributes.martial.value} <span style={{ fontSize: '0.75rem', color: '#fecaca' }}>({attributes.martial.grade})</span>
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, attributes.martial.value * 4)}%`, height: '100%', background: '#ef4444' }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                기반: {attributes.martial.keyStats.join(', ')}
              </div>
            </div>

            {/* Stewardship */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(234, 179, 8, 0.25)',
              borderRadius: '8px',
              padding: '12px 14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fde047', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  <Scroll size={16} />
                  <span>관리력 (Stewardship)</span>
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#eab308' }}>
                  {attributes.stewardship.value} <span style={{ fontSize: '0.75rem', color: '#fef08a' }}>({attributes.stewardship.grade})</span>
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, attributes.stewardship.value * 4)}%`, height: '100%', background: '#eab308' }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                기반: {attributes.stewardship.keyStats.join(', ')}
              </div>
            </div>

            {/* Intrigue */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              borderRadius: '8px',
              padding: '12px 14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#d8b4fe', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  <Eye size={16} />
                  <span>계책력 (Intrigue)</span>
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#a855f7' }}>
                  {attributes.intrigue.value} <span style={{ fontSize: '0.75rem', color: '#e9d5ff' }}>({attributes.intrigue.grade})</span>
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, attributes.intrigue.value * 4)}%`, height: '100%', background: '#a855f7' }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                기반: {attributes.intrigue.keyStats.join(', ')}
              </div>
            </div>

            {/* Learning */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(52, 211, 153, 0.25)',
              borderRadius: '8px',
              padding: '12px 14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6ee7b7', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  <BookOpen size={16} />
                  <span>학습력 (Learning)</span>
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#10b981' }}>
                  {attributes.learning.value} <span style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>({attributes.learning.grade})</span>
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, attributes.learning.value * 4)}%`, height: '100%', background: '#10b981' }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                기반: {attributes.learning.keyStats.join(', ')}
              </div>
            </div>

            {/* Prowess */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              borderRadius: '8px',
              padding: '12px 14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fda4af', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  <Shield size={16} />
                  <span>기량 (Prowess)</span>
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#f43f5e' }}>
                  {attributes.prowess.value} <span style={{ fontSize: '0.75rem', color: '#fecdd3' }}>({attributes.prowess.grade})</span>
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, attributes.prowess.value * 4)}%`, height: '100%', background: '#f43f5e' }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                기반: {attributes.prowess.keyStats.join(', ')}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Traits Gallery (특성 및 성격 트레잇) */}
        {gameState.traits && gameState.traits.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: 'var(--gold-accent)',
              marginBottom: '12px',
              borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
              paddingBottom: '8px'
            }}>
              <Sparkles size={18} />
              <span>군주 특성 및 혈통 트레잇 (Traits)</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {gameState.traits.map((trait, idx) => {
                const style = getTraitCategoryStyle(trait.category);
                return (
                  <div
                    key={idx}
                    title={trait.description}
                    style={{
                      background: style.bg,
                      border: `1px solid ${style.border}`,
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      transition: 'transform 0.2s',
                      cursor: 'help'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', opacity: 0.85, color: style.color }}>
                        {style.icon} {trait.category}
                      </span>
                      {trait.tier && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--gold-hover)', fontWeight: 'bold' }}>
                          {trait.tier}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fff' }}>
                      {trait.name}
                    </div>
                    {trait.description && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                        {trait.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Vital Health & Physical Condition (건강 및 신체 상태) */}
        {gameState.playerStatus && gameState.playerStatus.length > 0 && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: 'var(--gold-accent)',
              marginBottom: '12px',
              borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
              paddingBottom: '8px'
            }}>
              <Activity size={18} />
              <span>신체 및 생체 건강 상태 (Physical Condition)</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px' }}>
              {gameState.playerStatus.map((status, idx) => {
                const isDanger = status.risk.includes('위험') && !status.risk.includes('안전');
                const isWarning = status.risk.includes('주의');
                return (
                  <div
                    key={idx}
                    title={`${status.description} (위험도: ${status.risk})`}
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: isDanger ? '1px solid #ef4444' : isWarning ? '1px solid #f97316' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                        {status.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        위험도: {status.risk}
                      </div>
                    </div>
                    <div style={{
                      fontWeight: 'bold',
                      fontSize: '0.95rem',
                      color: isDanger ? '#ef4444' : isWarning ? '#f97316' : 'var(--gold-accent)'
                    }}>
                      {status.value}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
