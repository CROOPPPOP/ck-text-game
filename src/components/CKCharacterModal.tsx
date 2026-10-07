"use client";

import React, { useState } from 'react';
import { ParsedState } from '@/lib/parser';
import { calculateCKAttributes, parseCKStress, getHeraldryEmblem, getArchetypeDetails } from '@/lib/ckVisuals';
import { 
  TRAIT_CATEGORIES, 
  ORDERED_TRAIT_CATEGORY_KEYS, 
  groupTraitsBySession, 
  TraitCategoryKey 
} from '@/lib/traitUtils';
import { Crown, Shield, Sword, Scroll, BookOpen, Eye, Award, Flame, Activity, Sparkles, X, Lock } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gameState: ParsedState;
}

export default function CKCharacterModal({ isOpen, onClose, gameState }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | TraitCategoryKey>('all');
  const [showEmptySessions, setShowEmptySessions] = useState(true);

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
  const groupedTraits = groupTraitsBySession(gameState.traits || []);
  const totalTraitsCount = (gameState.traits || []).length;

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
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '12px',
            marginBottom: '16px'
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
              <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed rgba(56, 189, 248, 0.2)', fontSize: '0.74rem', color: '#bae6fd', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {attributes.diplomacy.effects?.map((eff, i) => (
                  <div key={i}>• {eff}</div>
                ))}
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
              <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed rgba(239, 68, 68, 0.2)', fontSize: '0.74rem', color: '#fecaca', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {attributes.martial.effects?.map((eff, i) => (
                  <div key={i}>• {eff}</div>
                ))}
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
              <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed rgba(234, 179, 8, 0.2)', fontSize: '0.74rem', color: '#fef08a', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {attributes.stewardship.effects?.map((eff, i) => (
                  <div key={i}>• {eff}</div>
                ))}
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
              <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed rgba(168, 85, 247, 0.2)', fontSize: '0.74rem', color: '#e9d5ff', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {attributes.intrigue.effects?.map((eff, i) => (
                  <div key={i}>• {eff}</div>
                ))}
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
              <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed rgba(52, 211, 153, 0.2)', fontSize: '0.74rem', color: '#a7f3d0', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {attributes.learning.effects?.map((eff, i) => (
                  <div key={i}>• {eff}</div>
                ))}
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
              <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed rgba(244, 63, 94, 0.2)', fontSize: '0.74rem', color: '#fecdd3', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {attributes.prowess.effects?.map((eff, i) => (
                  <div key={i}>• {eff}</div>
                ))}
              </div>
            </div>
          </div>

          {/* 거점/영지 & 범용 자원 연동 일관성 요약 바 */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(15, 23, 42, 0.6))',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            fontSize: '0.82rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gold-accent)', fontWeight: 'bold' }}>
              <Sparkles size={15} />
              <span>능력치 ⮂ 거점/영지/자원 일관성 연동 현황</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', color: '#e2e8f0' }}>
              <span>🏰 직할령 한계: <strong style={{ color: '#38bdf8' }}>{attributes.synergies.domainLimit}개</strong></span>
              <span>🪙 재정 수입: <strong style={{ color: '#fbbf24' }}>+{attributes.synergies.goldIncomeModifier}%</strong></span>
              <span>⚔️ 징집 병력: <strong style={{ color: '#ef4444' }}>+{attributes.synergies.levyModifier}%</strong></span>
              <span>👑 위신 획득: <strong style={{ color: '#c084fc' }}>+{attributes.synergies.prestigeModifier}%</strong></span>
              <span>🕊️ 신앙 획득: <strong style={{ color: '#34d399' }}>+{attributes.synergies.pietyModifier}%</strong></span>
            </div>
          </div>
        </div>

        {/* 3. Traits Gallery - Categorized Session Layout (특성 세션 분리 체계) */}
        <div style={{ marginBottom: '28px' }}>
          {/* Main Traits Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '14px',
            borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
            paddingBottom: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} style={{ color: 'var(--gold-accent)' }} />
              <h2 style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: 'var(--gold-accent)',
                margin: 0,
                letterSpacing: '0.5px'
              }}>
                군주 특성 및 혈통 트레잇 체계 (Traits & Sessions)
              </h2>
              <span style={{
                background: 'rgba(212, 175, 55, 0.2)',
                color: 'var(--gold-hover)',
                fontSize: '0.8rem',
                padding: '2px 8px',
                borderRadius: '12px',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                fontWeight: 'bold'
              }}>
                총 {totalTraitsCount}개 보유
              </span>
            </div>

            {/* Toggle Empty Sessions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={showEmptySessions}
                  onChange={(e) => setShowEmptySessions(e.target.checked)}
                  style={{ cursor: 'pointer', accentColor: 'var(--gold-accent)' }}
                />
                <span>미발현 세션 및 개화 힌트 표시</span>
              </label>
            </div>
          </div>

          {/* Quick Session Filter Tabs */}
          <div style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginBottom: '16px',
            scrollbarWidth: 'thin'
          }}>
            <button
              onClick={() => setSelectedCategory('all')}
              style={{
                padding: '6px 12px',
                fontSize: '0.82rem',
                fontWeight: 'bold',
                borderRadius: '6px',
                border: selectedCategory === 'all' ? '1px solid var(--gold-accent)' : '1px solid rgba(255,255,255,0.1)',
                background: selectedCategory === 'all' ? 'rgba(212, 175, 55, 0.25)' : 'rgba(0,0,0,0.3)',
                color: selectedCategory === 'all' ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              <span>🌐 전체 세션</span>
              <span style={{
                background: selectedCategory === 'all' ? 'var(--gold-accent)' : 'rgba(255,255,255,0.15)',
                color: selectedCategory === 'all' ? '#0f172a' : '#fff',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '0.72rem'
              }}>
                {totalTraitsCount}
              </span>
            </button>

            {ORDERED_TRAIT_CATEGORY_KEYS.map((catKey) => {
              if (catKey === 'general' && groupedTraits.general.length === 0) return null;
              const meta = TRAIT_CATEGORIES[catKey];
              const count = groupedTraits[catKey].length;
              const isSelected = selectedCategory === catKey;

              return (
                <button
                  key={catKey}
                  onClick={() => setSelectedCategory(catKey)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.82rem',
                    fontWeight: 'bold',
                    borderRadius: '6px',
                    border: isSelected ? `1px solid ${meta.borderColor}` : '1px solid rgba(255,255,255,0.08)',
                    background: isSelected ? meta.bgColor : 'rgba(0,0,0,0.3)',
                    color: isSelected ? meta.color : count > 0 ? '#e2e8f0' : 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    boxShadow: isSelected ? `0 0 10px ${meta.borderColor}33` : 'none'
                  }}
                >
                  <span>{meta.icon}</span>
                  <span>{meta.shortLabel}</span>
                  <span style={{
                    background: count > 0 ? (isSelected ? meta.borderColor : 'rgba(255,255,255,0.15)') : 'rgba(255,255,255,0.06)',
                    color: count > 0 ? (isSelected ? '#fff' : '#e2e8f0') : 'rgba(255,255,255,0.35)',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: '0.72rem'
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Session Cards Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {ORDERED_TRAIT_CATEGORY_KEYS.map((catKey) => {
              // 카테고리 필터링 적용
              if (selectedCategory !== 'all' && selectedCategory !== catKey) return null;
              if (catKey === 'general' && groupedTraits.general.length === 0) return null;

              const meta = TRAIT_CATEGORIES[catKey];
              const traits = groupedTraits[catKey];
              const hasTraits = traits.length > 0;

              // traits가 없고 showEmptySessions도 false인데 단독 카테고리 선택도 아닌 경우 숨김
              if (!hasTraits && !showEmptySessions && selectedCategory === 'all') return null;

              return (
                <div
                  key={catKey}
                  style={{
                    background: hasTraits ? meta.gradientBg : 'rgba(15, 23, 42, 0.4)',
                    border: `1px solid ${hasTraits ? meta.borderColor + '66' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '12px',
                    padding: '16px 18px',
                    boxShadow: hasTraits ? '0 4px 16px rgba(0,0,0,0.35)' : 'none',
                    transition: 'all 0.3s'
                  }}
                >
                  {/* Session Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px',
                    marginBottom: '12px',
                    borderBottom: `1px solid ${hasTraits ? meta.borderColor + '33' : 'rgba(255,255,255,0.06)'}`,
                    paddingBottom: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.25rem' }}>{meta.icon}</span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontSize: '0.98rem',
                            fontWeight: 'bold',
                            color: meta.color,
                            letterSpacing: '0.5px'
                          }}>
                            {meta.label}
                          </span>
                          <span style={{
                            fontSize: '0.72rem',
                            padding: '1px 8px',
                            borderRadius: '10px',
                            background: hasTraits ? `${meta.borderColor}33` : 'rgba(255,255,255,0.06)',
                            color: hasTraits ? meta.color : 'var(--text-muted)',
                            border: `1px solid ${hasTraits ? meta.borderColor + '55' : 'rgba(255,255,255,0.1)'}`,
                            fontWeight: 'bold'
                          }}>
                            {hasTraits ? `${traits.length}개 발현` : '미발현'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {meta.description}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Session Content */}
                  {hasTraits ? (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                      gap: '12px'
                    }}>
                      {traits.map((trait, idx) => {
                        return (
                          <div
                            key={idx}
                            style={{
                              background: 'rgba(10, 15, 28, 0.75)',
                              border: `1px solid ${trait.isNew ? '#fbbf24' : meta.borderColor + '66'}`,
                              borderRadius: '8px',
                              padding: '12px 14px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              boxShadow: trait.isNew 
                                ? '0 0 15px rgba(251, 191, 36, 0.35)' 
                                : '0 2px 10px rgba(0,0,0,0.4)',
                              transition: 'transform 0.2s, box-shadow 0.2s',
                              position: 'relative',
                              overflow: 'hidden'
                            }}
                          >
                            {/* Top Badge Row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                              <span style={{
                                fontSize: '0.72rem',
                                color: meta.color,
                                background: meta.bgColor,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 'bold'
                              }}>
                                {meta.icon} {trait.originalCategory}
                              </span>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {trait.isNew && (
                                  <span style={{
                                    fontSize: '0.7rem',
                                    background: 'linear-gradient(45deg, #d97706, #fbbf24)',
                                    color: '#0f172a',
                                    fontWeight: 'bold',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    boxShadow: '0 0 8px rgba(251, 191, 36, 0.5)'
                                  }}>
                                    ✨ NEW
                                  </span>
                                )}
                                {trait.tier && (
                                  <span style={{
                                    fontSize: '0.72rem',
                                    color: trait.tierInfo.color,
                                    fontWeight: 'bold',
                                    background: 'rgba(0,0,0,0.4)',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    border: `1px solid ${trait.tierInfo.color}44`
                                  }}>
                                    {trait.tier}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Trait Name */}
                            <div style={{
                              fontSize: '1.02rem',
                              fontWeight: 'bold',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}>
                              <span>{trait.name}</span>
                            </div>

                            {/* 5-Pip Growth Tier Gauge */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'rgba(0,0,0,0.3)',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginRight: '2px' }}>
                                성장단계:
                              </span>
                              <div style={{ display: 'flex', gap: '3px' }}>
                                {trait.tierInfo.pips.map((filled, pIdx) => (
                                  <span
                                    key={pIdx}
                                    style={{
                                      width: '7px',
                                      height: '7px',
                                      borderRadius: '50%',
                                      background: filled ? trait.tierInfo.color : 'rgba(255,255,255,0.15)',
                                      boxShadow: filled ? `0 0 5px ${trait.tierInfo.color}` : 'none'
                                    }}
                                  />
                                ))}
                              </div>
                              <span style={{
                                fontSize: '0.7rem',
                                color: trait.tierInfo.color,
                                marginLeft: 'auto',
                                fontWeight: 'bold'
                              }}>
                                {trait.tierInfo.label}
                              </span>
                            </div>

                            {/* Description */}
                            {trait.description && (
                              <div style={{
                                fontSize: '0.8rem',
                                color: '#cbd5e1',
                                lineHeight: '1.4',
                                marginTop: '2px',
                                background: 'rgba(0,0,0,0.2)',
                                padding: '6px 8px',
                                borderRadius: '4px',
                                borderLeft: `2px solid ${meta.borderColor}`
                              }}>
                                {trait.description}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Empty Session Guide */
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px dashed rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                        <Lock size={15} style={{ opacity: 0.6 }} />
                        <span>{meta.emptyHint}</span>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        flexWrap: 'wrap',
                        fontSize: '0.75rem',
                        color: 'rgba(255,255,255,0.4)',
                        marginTop: '2px'
                      }}>
                        <span>💡 주요 발현 가능 특성:</span>
                        {meta.examples.map((ex, eIdx) => (
                          <span
                            key={eIdx}
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              padding: '1px 6px',
                              borderRadius: '3px',
                              color: meta.color,
                              opacity: 0.8
                            }}
                          >
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

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
