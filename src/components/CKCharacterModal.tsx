"use client";

import React, { useState } from 'react';
import { ParsedState } from '@/lib/parser';
import { calculateCKAttributes, parseCKStress, getHeraldryEmblem, getArchetypeDetails, parseCKResources } from '@/lib/ckVisuals';
import { 
  TRAIT_CATEGORIES, 
  ORDERED_TRAIT_CATEGORY_KEYS, 
  groupTraitsBySession, 
  TraitCategoryKey 
} from '@/lib/traitUtils';
import { Crown, Shield, Sword, Scroll, BookOpen, Eye, Award, Flame, Activity, Sparkles, X, Lock, Package, Coins, ChevronDown, ChevronUp, Compass } from 'lucide-react';
import { checkStatusPromotion, PromotionTarget } from '@/lib/statusPromotion';
import { ALL_DECISIONS, PIETY_DECISIONS, PRESTIGE_DECISIONS, CKDecision, getAvailableDecisions } from '@/lib/ckDecisions';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gameState: ParsedState;
  onPetitionPromotion?: (target: PromotionTarget) => void;
  onExecuteDecision?: (command: string) => void;
}

export default function CKCharacterModal({ isOpen, onClose, gameState, onPetitionPromotion, onExecuteDecision }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | TraitCategoryKey>('all');
  const [decisionCategory, setDecisionCategory] = useState<'all' | 'piety' | 'prestige'>('all');
  const [showEmptySessions, setShowEmptySessions] = useState(true);
  const [showDetailedStats, setShowDetailedStats] = useState(false);

  if (!isOpen) return null;

  const promotionReport = checkStatusPromotion(gameState);

  const rulerName = gameState.personalInfo?.['이름'] || '군주';
  const rulerTitle = gameState.personalInfo?.['칭호'] || gameState.personalInfo?.['직위'] || '영주';
  const rulerAge = (gameState.personalInfo?.['나이'] || '-').replace(/세+$/, '').trim();
  const rulerStatus = gameState.personalInfo?.['신분'] || '귀족';
  const rulerOffice = gameState.personalInfo?.['직위'] || gameState.personalInfo?.['직책'] || rulerStatus;
  const culture = gameState.personalInfo?.['문화'] || '미상';
  const religion = gameState.personalInfo?.['종교'] || '미상';
  const attributes = calculateCKAttributes(gameState);
  const stress = parseCKStress(gameState);
  const archetypeDetails = getArchetypeDetails(gameState);
  const resources = parseCKResources(gameState);
  const emblem = getHeraldryEmblem(rulerName, culture, archetypeDetails.archetype);
  const groupedTraits = groupTraitsBySession(gameState.traits || []);
  const totalTraitsCount = (gameState.traits || []).length;
  const decisionStatus = getAvailableDecisions(resources);
  const filteredDecisions = decisionCategory === 'all'
    ? ALL_DECISIONS
    : decisionCategory === 'piety'
    ? PIETY_DECISIONS
    : PRESTIGE_DECISIONS;

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
          background: 'linear-gradient(145deg, rgba(26, 20, 15, 0.98), rgba(15, 11, 8, 0.98))',
          width: '94%',
          maxWidth: '880px',
          maxHeight: '88vh',
          overflowY: 'auto',
          borderRadius: '16px',
          border: '2px solid rgba(200, 159, 60, 0.45)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(200, 159, 60, 0.15)',
          padding: '28px',
          position: 'relative',
          fontFamily: 'var(--font-sans, "Pretendard", sans-serif)',
          WebkitFontSmoothing: 'antialiased'
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
                나이: <strong style={{ color: 'var(--text-main)' }}>{rulerAge !== '-' ? `${rulerAge}세` : '-'}</strong>
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
              <span style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '3px 10px',
                borderRadius: '4px',
                color: 'var(--text-muted)'
              }}>
                직책: <strong style={{ color: '#34d399' }}>{rulerOffice}</strong>
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

        {/* 1.8 Status Promotion & Investiture (신분 승격 및 서임 사다리) */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          borderRadius: '12px',
          padding: '18px 20px',
          marginBottom: '26px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} style={{ color: 'var(--gold-accent)' }} />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--gold-accent)', margin: 0 }}>
                신분 승격 및 서임 사다리 (Status Promotion)
              </h2>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              현재 신분: <strong style={{ color: 'var(--gold-hover)' }}>{promotionReport.currentRank}</strong> (Tier {promotionReport.currentTier})
            </div>
          </div>

          {promotionReport.possibleTargets.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
              {promotionReport.possibleTargets.map((target, tIdx) => (
                <div key={tIdx} style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: target.canPromote ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: target.canPromote ? '0 0 15px rgba(16, 185, 129, 0.2)' : 'none'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', background: 'rgba(56, 189, 248, 0.15)', color: '#7dd3fc', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '1px 6px', borderRadius: '4px', marginRight: '6px' }}>
                        {target.ceremonyName}
                      </span>
                      <strong style={{ fontSize: '1.05rem', color: target.canPromote ? '#6ee7b7' : 'var(--text-main)' }}>
                        목표: {target.targetRank}
                      </strong>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: target.canPromote ? '#10b981' : 'var(--text-muted)' }}>
                      달성도 {target.progressPercent}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${target.progressPercent}%`, height: '100%', background: target.canPromote ? '#10b981' : 'linear-gradient(90deg, #d97706, #fbbf24)' }} />
                  </div>

                  {/* Requirements List */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem' }}>
                    {target.requirements.map(req => (
                      <div key={req.id} style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${req.met ? '#10b98144' : 'rgba(255,255,255,0.05)'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{req.label}</span>
                          <span>{req.met ? '✅' : '❌'}</span>
                        </div>
                        <div style={{ color: req.met ? '#6ee7b7' : 'var(--text-main)', fontWeight: 'bold', marginTop: '2px' }}>
                          {req.current} / {req.target}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: '6px', lineHeight: '1.4' }}>
                    {target.historicalLore}
                  </div>

                  {target.canPromote ? (
                    <button
                      onClick={() => {
                        if (confirm(`'${target.ceremonyName}' 의식을 거행하고 정식 '${target.targetRank}'(으)로 승격을 공식 청원하시겠습니까?`)) {
                          onClose();
                          onPetitionPromotion?.(target);
                        }
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #059669, #10b981)',
                        border: '1px solid #34d399',
                        color: '#fff',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        textAlign: 'center',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
                        transition: 'all 0.2s'
                      }}
                    >
                      ✨ {target.ceremonyName} 공식 청원 및 서임식 거행하기
                    </button>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                      요건을 모두 충족하면 승격 청원 및 서임식이 개방됩니다.
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '14px', fontSize: '0.88rem' }}>
              👑 현재 분야의 최고위 정점에 도달했습니다. 위엄과 패권을 수호하십시오.
            </div>
          )}
        </div>

        {/* 1.9 위신 및 신앙 특수 결단 (Decisions & Special Rites) */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(20, 16, 28, 0.9), rgba(15, 23, 42, 0.9))',
          border: '1.5px solid rgba(192, 132, 252, 0.35)',
          borderRadius: '12px',
          padding: '18px 20px',
          marginBottom: '26px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Crown size={18} style={{ color: '#c084fc' }} />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#e9d5ff', margin: 0 }}>
                위신 및 신앙 특수 결단 (Decisions & Special Rites)
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.78rem',
                background: decisionStatus.available.length > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                color: decisionStatus.available.length > 0 ? '#6ee7b7' : 'var(--text-muted)',
                border: `1px solid ${decisionStatus.available.length > 0 ? '#10b981' : 'rgba(255, 255, 255, 0.1)'}`,
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 'bold'
              }}>
                ⚡ 즉시 발동 가능: {decisionStatus.available.length}개
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                보유 점수: <strong style={{ color: '#c084fc' }}>👑 위신 {resources.prestigeScore}점</strong> / <strong style={{ color: '#34d399' }}>🕊️ 신앙 {resources.pietyScore}점</strong>
              </span>
            </div>
          </div>

          <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '14px', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '6px', lineHeight: '1.4' }}>
            💡 <strong style={{ color: '#fde047' }}>점수 소모형 결단 룰:</strong> 축적된 위신과 신앙 점수를 소모하여 강력한 칙령을 반포하고 외교·종교적 대사건을 일으킵니다. <span style={{ color: '#6ee7b7' }}>결단을 실행하여 점수를 소모하더라도 영구 명망/신앙 단계는 결코 강등되지 않습니다.</span>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setDecisionCategory('all')}
              style={{
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                borderRadius: '6px',
                border: decisionCategory === 'all' ? '1px solid #c084fc' : '1px solid rgba(255,255,255,0.1)',
                background: decisionCategory === 'all' ? 'rgba(192, 132, 252, 0.25)' : 'rgba(0,0,0,0.35)',
                color: decisionCategory === 'all' ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              전체 결단 ({ALL_DECISIONS.length})
            </button>
            <button
              onClick={() => setDecisionCategory('piety')}
              style={{
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                borderRadius: '6px',
                border: decisionCategory === 'piety' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                background: decisionCategory === 'piety' ? 'rgba(52, 211, 153, 0.25)' : 'rgba(0,0,0,0.35)',
                color: decisionCategory === 'piety' ? '#a7f3d0' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              🕊️ 신앙 성무 결단 ({PIETY_DECISIONS.length})
            </button>
            <button
              onClick={() => setDecisionCategory('prestige')}
              style={{
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                borderRadius: '6px',
                border: decisionCategory === 'prestige' ? '1px solid #c084fc' : '1px solid rgba(255,255,255,0.1)',
                background: decisionCategory === 'prestige' ? 'rgba(192, 132, 252, 0.25)' : 'rgba(0,0,0,0.35)',
                color: decisionCategory === 'prestige' ? '#e9d5ff' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              👑 위신 칙령 결단 ({PRESTIGE_DECISIONS.length})
            </button>
          </div>

          {/* Decision Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '14px' }}>
            {filteredDecisions.map(dec => {
              const isPiety = dec.category === 'piety';
              const currentScore = isPiety ? resources.pietyScore : resources.prestigeScore;
              const currentTier = isPiety ? resources.pietyTier : resources.prestigeTier;
              const hasTier = currentTier >= dec.requiredTier;
              const hasCost = currentScore >= dec.cost;
              const canExecute = hasTier && hasCost;

              let lockedReason = '';
              if (!hasTier) lockedReason = `${dec.costType} Lv.${dec.requiredTier}단계 이상 필요 (현재 Lv.${currentTier})`;
              else if (!hasCost) lockedReason = `${dec.costType} ${dec.cost - currentScore}점 부족 (${currentScore}/${dec.cost})`;

              return (
                <div key={dec.id} style={{
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: canExecute ? `1.5px solid ${isPiety ? '#10b981' : '#c084fc'}` : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: canExecute ? `0 0 16px ${isPiety ? 'rgba(16, 185, 129, 0.25)' : 'rgba(192, 132, 252, 0.25)'}` : 'none'
                }}>
                  {/* Card Title & Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.4rem' }}>{dec.icon}</span>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.98rem', color: canExecute ? '#fff' : 'var(--text-main)' }}>
                          {dec.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: isPiety ? '#6ee7b7' : '#c084fc' }}>
                          {dec.subtitle}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 'bold',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: hasCost ? (isPiety ? 'rgba(52, 211, 153, 0.2)' : 'rgba(192, 132, 252, 0.2)') : 'rgba(239, 68, 68, 0.2)',
                        color: hasCost ? (isPiety ? '#6ee7b7' : '#e9d5ff') : '#f87171',
                        border: `1px solid ${hasCost ? (isPiety ? '#34d399' : '#c084fc') : '#ef4444'}`
                      }}>
                        {dec.costType} {dec.cost} 소모
                      </span>
                      <span style={{
                        fontSize: '0.68rem',
                        color: hasTier ? 'var(--text-muted)' : '#f87171'
                      }}>
                        요구: Lv.{dec.requiredTier}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    {dec.description}
                  </div>

                  {/* Historical Lore Quote */}
                  <div style={{
                    fontSize: '0.74rem',
                    color: '#94a3b8',
                    fontStyle: 'italic',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderLeft: `2px solid ${isPiety ? '#34d399' : '#c084fc'}`,
                    padding: '6px 10px',
                    borderRadius: '0 4px 4px 0',
                    lineHeight: '1.35'
                  }}>
                    📖 {dec.historicalLore}
                  </div>

                  {/* Effects List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--gold-accent)' }}>
                      ✨ 발동 효과:
                    </div>
                    {dec.effects.map((eff, eIdx) => (
                      <div key={eIdx} style={{ fontSize: '0.75rem', color: '#e2e8f0', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ color: isPiety ? '#34d399' : '#c084fc' }}>•</span>
                        <span>{eff}</span>
                      </div>
                    ))}
                  </div>

                  {/* Button */}
                  {canExecute ? (
                    <button
                      onClick={() => {
                        if (confirm(`'${dec.title}' 결단을 발동하시겠습니까?\n\n소모: ${dec.costType} ${dec.cost}점 (현재 ${currentScore}점 보유)\n(도달한 영구 단계는 유지됩니다)`)) {
                          onClose();
                          onExecuteDecision?.(dec.actionCommand);
                        }
                      }}
                      style={{
                        background: isPiety 
                          ? 'linear-gradient(135deg, #059669, #10b981)' 
                          : 'linear-gradient(135deg, #7c3aed, #a855f7)',
                        border: `1px solid ${isPiety ? '#34d399' : '#c084fc'}`,
                        color: '#fff',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        textAlign: 'center',
                        boxShadow: `0 4px 15px ${isPiety ? 'rgba(16, 185, 129, 0.35)' : 'rgba(168, 85, 247, 0.35)'}`,
                        transition: 'all 0.2s',
                        marginTop: 'auto'
                      }}
                    >
                      ✨ {dec.title} 결단 발동 및 칙령 반포
                    </button>
                  ) : (
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: 'var(--text-muted)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      textAlign: 'center',
                      marginTop: 'auto'
                    }}>
                      🔒 {lockedReason}
                    </div>
                  )}
                </div>
              );
            })}
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
              <span>5대 핵심 능력치 및 기량</span>
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
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            fontSize: '0.82rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gold-accent)', fontWeight: 'bold' }}>
                <Sparkles size={15} />
                <span>능력치 ⮂ 거점/영지/자원 일관성 연동 현황</span>
              </div>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', color: '#e2e8f0', alignItems: 'center' }}>
                <span>🏰 직할 영지 한계: <strong style={{ color: '#38bdf8' }}>{attributes.synergies.domainLimit}개소</strong></span>
                <span>🪙 재정 수입: <strong style={{ color: '#fbbf24' }}>+{attributes.synergies.goldIncomeModifier}%</strong></span>
                <span>⚔️ 징집 병력: <strong style={{ color: '#ef4444' }}>+{attributes.synergies.levyModifier}%</strong></span>
                <span title={`소모 가능 위신: ${resources.prestigeScore}점\n영구 단계: Lv.${resources.prestigeTier} ${resources.prestigeLevel}\n턴 당 획득: ${resources.prestigeGain?.formattedGain || '+0.0/턴'}`}>
                  👑 위신: <strong style={{ color: '#c084fc' }}>{resources.prestigeScore}점</strong>{' '}
                  <span style={{ fontSize: '0.74rem', color: '#e9d5ff', background: 'rgba(192, 132, 252, 0.18)', padding: '1px 5px', borderRadius: '3px', border: '1px solid rgba(192, 132, 252, 0.3)' }}>
                    Lv.{resources.prestigeTier} {resources.prestigeLevel}
                  </span>{' '}
                  <small style={{ color: '#c084fc', fontWeight: 'bold' }}>({resources.prestigeGain?.formattedGain || '+0.0/턴'})</small>
                </span>
                <span title={`소모 가능 신앙: ${resources.pietyScore}점\n영구 단계: Lv.${resources.pietyTier} ${resources.pietyLevel}\n턴 당 획득: ${resources.pietyGain?.formattedGain || '+0.0/턴'}`}>
                  🕊️ {resources.labels.pietyLabel}: <strong style={{ color: '#34d399' }}>{resources.pietyScore}점</strong>{' '}
                  <span style={{ fontSize: '0.74rem', color: '#a7f3d0', background: 'rgba(52, 211, 153, 0.18)', padding: '1px 5px', borderRadius: '3px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                    Lv.{resources.pietyTier} {resources.pietyLevel}
                  </span>{' '}
                  <small style={{ color: '#34d399', fontWeight: 'bold' }}>({resources.pietyGain?.formattedGain || '+0.0/턴'})</small>
                </span>
              </div>
            </div>

            {/* 위신 & 신앙 진행 게이지 바 (소모성 점수와 영구 단계 분리) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '10px',
              paddingTop: '8px',
              borderTop: '1px dashed rgba(212, 175, 55, 0.2)'
            }}>
              {/* 위신 게이지 */}
              {(() => {
                const nextThreshold = resources.prestigeTier >= 5 ? 300 : resources.prestigeTier === 4 ? 300 : resources.prestigeTier === 3 ? 160 : resources.prestigeTier === 2 ? 90 : 40;
                const progressPct = resources.prestigeTier >= 5 ? 100 : Math.min(100, Math.round((resources.prestigeScore / nextThreshold) * 100));
                return (
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(192, 132, 252, 0.25)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                      <span style={{ color: '#e9d5ff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>👑 위신 (소모 가능: {resources.prestigeScore}점)</span>
                        <span style={{ fontSize: '0.7rem', color: '#c084fc' }}>Lv.{resources.prestigeTier} {resources.prestigeLevel} [영구]</span>
                      </span>
                      <span style={{ fontWeight: 'bold', color: '#c084fc', fontSize: '0.72rem' }}>
                        {resources.prestigeTier >= 5 ? '최고 단계 도달' : `다음 단계: ${resources.prestigeScore} / ${nextThreshold}점`}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${progressPct}%`, height: '100%', background: 'linear-gradient(90deg, #9333ea, #c084fc)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      <span>턴당 {resources.prestigeGain?.formattedGain || '+0.0/턴'}</span>
                      <span style={{ color: '#e9d5ff' }}>단계 증폭 +{resources.prestigeGain?.tierBonusPercent || 0}%</span>
                    </div>
                  </div>
                );
              })()}

              {/* 신앙 게이지 */}
              {(() => {
                const nextThreshold = resources.pietyTier >= 5 ? 300 : resources.pietyTier === 4 ? 300 : resources.pietyTier === 3 ? 160 : resources.pietyTier === 2 ? 90 : 40;
                const progressPct = resources.pietyTier >= 5 ? 100 : Math.min(100, Math.round((resources.pietyScore / nextThreshold) * 100));
                return (
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(52, 211, 153, 0.25)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                      <span style={{ color: '#a7f3d0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>🕊️ {resources.labels.pietyLabel} (소모 가능: {resources.pietyScore}점)</span>
                        <span style={{ fontSize: '0.7rem', color: '#34d399' }}>Lv.{resources.pietyTier} {resources.pietyLevel} [영구]</span>
                      </span>
                      <span style={{ fontWeight: 'bold', color: '#34d399', fontSize: '0.72rem' }}>
                        {resources.pietyTier >= 5 ? '최고 단계 도달' : `다음 단계: ${resources.pietyScore} / ${nextThreshold}점`}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${progressPct}%`, height: '100%', background: 'linear-gradient(90deg, #059669, #34d399)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      <span>턴당 {resources.pietyGain?.formattedGain || '+0.0/턴'}</span>
                      <span style={{ color: '#a7f3d0' }}>단계 증폭 +{resources.pietyGain?.tierBonusPercent || 0}%</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 영구 단계 보장 안내 텍스트 */}
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '4px', lineHeight: '1.35' }}>
              💡 <strong style={{ color: '#fde047' }}>소모성 점수와 영구 단계 분리:</strong> 결단이나 외교 조약에 점수를 소모하더라도 도달한 영구 명망 및 신앙 단계는 강등되지 않습니다.
            </div>
          </div>

          {/* 세부 선천 및 후천 능력치 아코디언 패널 (13선천 / 19후천 능력치 및 성장치 상세) */}
          <div style={{ marginTop: '12px' }}>
            <button
              onClick={() => setShowDetailedStats(prev => !prev)}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: showDetailedStats ? 'rgba(212, 175, 55, 0.16)' : 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: showDetailedStats ? '8px 8px 0 0' : '8px',
                color: 'var(--gold-hover)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={15} />
                <span>세부 개인 능력치 및 스탯 성장 내역 (선천 13개 · 후천 숙련)</span>
                {Object.values(gameState.stats?.innate || {}).concat(Object.values(gameState.stats?.acquired || {})).some(v => String(v).includes('(')) && (
                  <span style={{
                    fontSize: '0.7rem',
                    background: 'rgba(74, 222, 128, 0.25)',
                    color: '#86efac',
                    border: '1px solid #22c55e',
                    padding: '1px 6px',
                    borderRadius: '4px'
                  }}>
                    ✨ 스탯 성장 반영됨
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>{showDetailedStats ? '접기' : '상세 펼치기'}</span>
                {showDetailedStats ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </div>
            </button>

            {showDetailedStats && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.45)',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                {/* 선천 능력치 */}
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#93c5fd', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🧬 선천 능력치 (Innate Attributes - 13개)</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                    {['근력', '체력', '지구력', '민첩성', '반사 신경', '속도', '신체 조정력', '지각력', '지능', '기억력', '학습 능력', '의지력', '집중력'].map(statName => {
                      const rawVal = String(gameState.stats?.innate?.[statName] || '50').trim();
                      const bonusMatch = rawVal.match(/(\d+)\s*\(([+-]?\d+)\)/);
                      const base = bonusMatch ? parseInt(bonusMatch[1], 10) : parseInt(rawVal.match(/\d+/)?.[0] || '50', 10);
                      const bonus = bonusMatch ? parseInt(bonusMatch[2], 10) : 0;
                      const effective = Math.max(1, base + bonus);

                      return (
                        <div key={statName} style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: bonus > 0 ? '1px solid rgba(74, 222, 128, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{statName}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '0.86rem', fontWeight: 'bold', color: bonus > 0 ? '#4ade80' : 'var(--text-main)' }}>
                                {effective}
                              </span>
                              {bonus !== 0 && (
                                <span style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 'bold',
                                  color: bonus > 0 ? '#4ade80' : '#f87171',
                                  background: bonus > 0 ? 'rgba(74, 222, 128, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                  padding: '1px 4px',
                                  borderRadius: '3px'
                                }}>
                                  {bonus > 0 ? `+${bonus}` : `${bonus}`}
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, effective)}%`, height: '100%', background: bonus > 0 ? '#4ade80' : '#38bdf8' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 후천 능력치 */}
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#fde047', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⚔️ 후천 능력치 및 전문 숙련 (Acquired Abilities)</span>
                  </div>
                  {Object.keys(gameState.stats?.acquired || {}).length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                      {Object.entries(gameState.stats?.acquired || {}).map(([statName, rawVal]) => {
                        const rawStr = String(rawVal).trim();
                        const bonusMatch = rawStr.match(/(\d+)\s*\(([+-]?\d+)\)/);
                        const base = bonusMatch ? parseInt(bonusMatch[1], 10) : parseInt(rawStr.match(/\d+/)?.[0] || '50', 10);
                        const bonus = bonusMatch ? parseInt(bonusMatch[2], 10) : 0;
                        const effective = Math.max(1, base + bonus);

                        return (
                          <div key={statName} style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: bonus > 0 ? '1px solid rgba(74, 222, 128, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{statName}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '0.86rem', fontWeight: 'bold', color: bonus > 0 ? '#4ade80' : 'var(--text-main)' }}>
                                  {effective}
                                </span>
                                {bonus !== 0 && (
                                  <span style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 'bold',
                                    color: bonus > 0 ? '#4ade80' : '#f87171',
                                    background: bonus > 0 ? 'rgba(74, 222, 128, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                    padding: '1px 4px',
                                    borderRadius: '3px'
                                  }}>
                                    {bonus > 0 ? `+${bonus}` : `${bonus}`}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(100, effective)}%`, height: '100%', background: bonus > 0 ? '#4ade80' : '#fbbf24' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      아직 활성화된 후천 능력치가 없습니다.
                    </div>
                  )}
                </div>
              </div>
            )}
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

                            {/* Trait Name & Adaptation Status Badges */}
                            <div style={{
                              fontSize: '1.02rem',
                              fontWeight: 'bold',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '6px'
                            }}>
                              <span>{trait.name.replace(/\((?:개선 중|강화 중)\)/g, '').trim()}</span>
                              {(trait.name.includes('개선 중') || trait.originalCategory?.includes('개선')) && (
                                <span style={{
                                  fontSize: '0.68rem',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: 'rgba(34, 197, 94, 0.2)',
                                  border: '1px solid #22c55e',
                                  color: '#86efac',
                                  fontWeight: 'bold'
                                }}>
                                  🌱 개선 중
                                </span>
                              )}
                              {(trait.name.includes('강화 중') || trait.originalCategory?.includes('강화')) && (
                                <span style={{
                                  fontSize: '0.68rem',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: 'rgba(168, 85, 247, 0.2)',
                                  border: '1px solid #a855f7',
                                  color: '#d8b4fe',
                                  fontWeight: 'bold'
                                }}>
                                  ⚡ 강화 중
                                </span>
                              )}
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
          <div style={{ marginBottom: '24px' }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
              {gameState.playerStatus.map((status, idx) => {
                const isLethal = status.risk.includes('치명');
                const isDanger = status.risk.includes('위험') && !status.risk.includes('안전');
                const isMedium = status.risk.includes('중간') || status.risk.includes('주의');
                const isBest = status.risk.includes('최상');

                const statusColor = isLethal ? '#ef4444' : isDanger ? '#f97316' : isMedium ? '#fbbf24' : isBest ? '#38bdf8' : '#4ade80';
                const statusBg = isLethal ? 'rgba(239, 68, 68, 0.15)' : isDanger ? 'rgba(249, 115, 22, 0.15)' : isMedium ? 'rgba(251, 191, 36, 0.12)' : isBest ? 'rgba(56, 189, 248, 0.15)' : 'rgba(74, 222, 128, 0.12)';
                const statusBorder = isLethal ? '#ef4444' : isDanger ? '#f97316' : isMedium ? '#fbbf24' : isBest ? '#0284c7' : '#10b981';

                const iconMap: Record<string, string> = {
                  '건강': '❤️',
                  '체력': '🏃',
                  '통증': '⚡',
                  '허기': '🍖',
                  '갈증': '💧',
                  '피로': '💤',
                  '체온': '🌡️',
                  '스트레스': '💢',
                  '출혈': '🩸',
                  '부상': '🩹'
                };
                const matchedKey = Object.keys(iconMap).find(k => status.name.includes(k));
                const metricIcon = matchedKey ? iconMap[matchedKey] : '📊';

                return (
                  <div
                    key={idx}
                    title={`${status.description}\n위험도: [${status.risk}]`}
                    style={{
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: `1px solid ${statusBorder}44`,
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 'bold', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>{metricIcon}</span>
                        <span>{status.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          background: statusBg,
                          border: `1px solid ${statusColor}55`,
                          color: statusColor,
                          fontWeight: 'bold'
                        }}>
                          {status.risk}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px' }}>
                          {status.description}
                        </span>
                      </div>
                    </div>
                    <div style={{
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      color: statusColor,
                      marginLeft: '8px'
                    }}>
                      {status.value}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. Inventory & Possessions (소지품 및 자원) */}
        {gameState.inventory && Object.keys(gameState.inventory).length > 0 && (
          <div style={{ marginBottom: '24px' }}>
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
              <Package size={18} />
              <span>소지품 및 자원 (Inventory & Possessions)</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {Object.entries(gameState.inventory).map(([category, items]) => {
                if (!items || (items as string[]).length === 0) return null;
                const catName = category === 'equipment' ? '장비 및 거점' : category === 'wealth' ? '재산 및 병력' : category;
                const isWealth = category === 'wealth';

                return (
                  <div key={category} style={{ background: 'rgba(0,0,0,0.25)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ color: isWealth ? '#fcd34d' : '#7dd3fc', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isWealth ? <Coins size={14} /> : <Package size={14} />}
                      <span>{catName}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
                      {(items as string[]).map((item, idx) => {
                        const match = item.match(/\[(.*?)\]\s*(.*)/);
                        const name = match ? match[1].trim() : item;
                        const desc = match ? match[2].trim() : '';

                        return (
                          <div key={idx} style={{ background: 'rgba(0,0,0,0.35)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                              {name}
                            </div>
                            {desc && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.3' }}>
                                {desc}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. Long-Term Plans & Standing Policies (장기 국정 과업 및 상설 정책 - 보강 7-1 표준) */}
        {((gameState.longTermPlans && gameState.longTermPlans.length > 0) || gameState.longTermPlan) && (
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
              <Compass size={18} />
              <span>장기 국정 과업 및 상설 정책 (Long-Term Plans & Standing Policies)</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '10px' }}>
              {(gameState.longTermPlans && gameState.longTermPlans.length > 0
                ? gameState.longTermPlans
                : [gameState.longTermPlan!]
              ).map((planStr, pIdx) => {
                const isPolicy = planStr.includes('[정책]') || planStr.includes('정책:');
                const isPlan = planStr.includes('[장기 계획]') || planStr.includes('장기 계획:') || planStr.includes('목표:');
                
                // 태그 및 본문 분리
                const cleanStr = planStr.replace(/^[▶▷○•\-]\s*/, '').trim();
                const badgeText = isPolicy ? '📜 상설 정책' : isPlan ? '🎯 장기 계획' : '📌 국정 과업';
                const badgeColor = isPolicy ? '#34d399' : isPlan ? 'var(--gold-hover)' : '#38bdf8';
                const badgeBg = isPolicy ? 'rgba(52, 211, 153, 0.15)' : isPlan ? 'rgba(212, 175, 55, 0.15)' : 'rgba(56, 189, 248, 0.15)';
                const badgeBorder = isPolicy ? 'rgba(52, 211, 153, 0.4)' : isPlan ? 'rgba(212, 175, 55, 0.4)' : 'rgba(56, 189, 248, 0.4)';

                return (
                  <div
                    key={pIdx}
                    style={{
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: `1px solid ${badgeBorder}`,
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{
                        fontSize: '0.74rem',
                        fontWeight: 'bold',
                        color: badgeColor,
                        background: badgeBg,
                        border: `1px solid ${badgeBorder}`,
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        {badgeText}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: '1.45', wordBreak: 'break-word' }}>
                      {cleanStr}
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
