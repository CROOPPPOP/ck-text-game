"use client";

import React, { useState } from 'react';
import { ParsedState } from '@/lib/parser';
import { parseCKResources, parseCKStress, getHeraldryEmblem } from '@/lib/ckVisuals';
import { checkStatusPromotion } from '@/lib/statusPromotion';
import { Crown, Coins, Shield, Castle, Flame, Heart, Scroll, Users, Calendar, Sparkles, Settings, Save, RotateCcw, Zap, TrendingUp, TrendingDown, X } from 'lucide-react';

interface Props {
  gameState: ParsedState;
  turn: number;
  onOpenFamilyTree: () => void;
  onOpenRealm: () => void;
  onOpenCharacter: () => void;
  onOpenRelations: () => void;
  onOpenEstate: () => void;
  onOpenChronicle: () => void;
  onOpenSave: () => void;
  onOpenSettings: () => void;
  onQuickSave?: () => void;
  onUndoTurn?: () => void;
  canUndo?: boolean;
  onReturnTitle: () => void;
}

export default function CKTopHud({
  gameState,
  turn,
  onOpenFamilyTree,
  onOpenRealm,
  onOpenCharacter,
  onOpenRelations,
  onOpenEstate,
  onOpenChronicle,
  onOpenSave,
  onOpenSettings,
  onQuickSave,
  onUndoTurn,
  canUndo = false,
  onReturnTitle
}: Props) {
  const rulerName = gameState.personalInfo?.['이름'] || '군주';
  const rulerTitle = gameState.personalInfo?.['칭호'] || gameState.personalInfo?.['직위'] || '영주';
  const culture = gameState.personalInfo?.['문화'] || '';
  const resources = parseCKResources(gameState);
  const stress = parseCKStress(gameState);
  const emblem = getHeraldryEmblem(rulerName, culture, resources.archetype);
  const promoReport = checkStatusPromotion(gameState);
  const [showLedger, setShowLedger] = useState(false);
  const [showPrestigeTooltip, setShowPrestigeTooltip] = useState(false);
  const [showPietyTooltip, setShowPietyTooltip] = useState(false);

  const rawDate = gameState.dateLocation || '';
  const cleanDate = rawDate.replace(/\[턴 수:.*\]/, '').trim() || '서기 1066년';

  return (
    <header style={{
      background: 'linear-gradient(180deg, rgba(28, 22, 17, 0.98) 0%, rgba(16, 12, 9, 0.96) 100%)',
      borderBottom: '2px solid rgba(200, 159, 60, 0.45)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7), inset 0 -1px 0 rgba(200, 159, 60, 0.2)',
      padding: '8px 16px',
      position: 'relative',
      zIndex: 50,
      fontFamily: 'var(--font-sans, "Pretendard", sans-serif)'
    }}>
      {/* Top Main Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        
        {/* Left: Ruler Heraldry & Identity */}
        <div 
          onClick={onOpenCharacter}
          title="클릭하여 상세 인물 정보(Character Sheet) 열기"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            padding: '4px 10px',
            borderRadius: '8px',
            background: 'rgba(38, 29, 21, 0.75)',
            border: '1px solid rgba(200, 159, 60, 0.35)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--gold-accent)';
            e.currentTarget.style.boxShadow = '0 0 12px rgba(200, 159, 60, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(200, 159, 60, 0.35)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)';
          }}
        >
          {/* Heraldry Shield */}
          <div style={{
            width: '42px',
            height: '46px',
            background: emblem.bg,
            border: `2px solid ${emblem.border}`,
            borderRadius: '4px 4px 18px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
            flexShrink: 0
          }}>
            {emblem.icon}
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              color: 'var(--gold-accent)',
              fontWeight: 'bold',
              letterSpacing: '0.5px'
            }}>
              <Crown size={14} style={{ color: 'var(--gold-accent)' }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {rulerTitle}
              </span>
              <span style={{
                fontSize: '0.7rem',
                padding: '1px 6px',
                borderRadius: '3px',
                background: 'rgba(212, 175, 55, 0.2)',
                color: 'var(--gold-hover)',
                fontWeight: 'normal'
              }}>
                {resources.archetypeTitle}
              </span>
              {promoReport.overallCanPromote && (
                <span style={{
                  fontSize: '0.68rem',
                  padding: '1px 6px',
                  borderRadius: '3px',
                  background: 'rgba(16, 185, 129, 0.25)',
                  border: '1px solid #10b981',
                  color: '#6ee7b7',
                  fontWeight: 'bold'
                }}>
                  ✨ 승격 가능
                </span>
              )}
            </div>
            <div style={{
              fontSize: '1.05rem',
              fontWeight: 'bold',
              color: 'var(--text-main)',
              letterSpacing: '0.5px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '180px'
            }}>
              {rulerName}
            </div>
          </div>
        </div>

        {/* Center: CK3 Resource Ribbon */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          background: 'rgba(25, 19, 14, 0.85)',
          padding: '6px 14px',
          borderRadius: '8px',
          border: '1px solid rgba(200, 159, 60, 0.25)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)'
        }}>
          {/* 🪙 Gold / Funds & Turn Income */}
          <div 
            onClick={() => setShowLedger(prev => !prev)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '2px 8px',
              borderRadius: '6px',
              cursor: 'pointer',
              background: showLedger ? 'rgba(200, 159, 60, 0.18)' : 'rgba(255, 255, 255, 0.03)',
              border: showLedger ? '1px solid rgba(200, 159, 60, 0.5)' : '1px solid rgba(200, 159, 60, 0.15)',
              transition: 'all 0.2s ease',
              position: 'relative'
            }} 
            title={`${resources.labels.goldLabel} 클릭하여 턴 당 재정 수지 명세서(Financial Ledger) 열기`}
          >
            <Coins size={16} style={{ color: 'var(--gold-accent)' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{resources.labels.goldLabel}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--gold-hover)' }}>
                  {resources.gold}
                </span>
                {/* 턴 당 순수입 배지 */}
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  color: resources.income.netIncome >= 0 ? '#4ade80' : '#f87171',
                  background: resources.income.netIncome >= 0 ? 'rgba(74, 222, 128, 0.15)' : 'rgba(248, 113, 113, 0.15)',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  border: `1px solid ${resources.income.netIncome >= 0 ? 'rgba(74, 222, 128, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`,
                  lineHeight: '1.2'
                }}>
                  {resources.income.formattedNet}/턴
                </span>
              </div>
            </div>

            {/* Financial Ledger Popover */}
            {showLedger && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: '0',
                  zIndex: 120,
                  width: '340px',
                  background: 'linear-gradient(145deg, rgba(32, 25, 19, 0.98), rgba(20, 15, 11, 0.98))',
                  border: '1.5px solid rgba(200, 159, 60, 0.45)',
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.9), 0 0 20px rgba(200, 159, 60, 0.2)',
                  borderRadius: '10px',
                  padding: '14px',
                  backdropFilter: 'blur(12px)',
                  cursor: 'default',
                  textAlign: 'left'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(200, 159, 60, 0.25)', paddingBottom: '8px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Coins size={16} style={{ color: '#fbbf24' }} />
                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--gold-accent)' }}>
                      턴 당 재정 수지 명세서
                    </span>
                  </div>
                  <button
                    onClick={() => setShowLedger(false)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Net Income Banner */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: `1px solid ${resources.income.netIncome >= 0 ? 'rgba(74, 222, 128, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`,
                  borderRadius: '8px',
                  padding: '10px',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>턴 당 순수입 (Net Balance)</span>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: resources.income.statusColor
                    }}>
                      {resources.income.statusLabel}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: resources.income.netIncome >= 0 ? '#4ade80' : '#f87171'
                    }}>
                      {resources.income.formattedNet} {resources.income.currencyName} / 턴
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      세입 +{resources.income.grossIncome} | 세출 -{resources.income.grossExpense}
                    </span>
                  </div>
                </div>

                {/* Scrollable Items Container */}
                <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
                  {/* Gross Income List */}
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#4ade80', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <TrendingUp size={13} />
                      <span>총 세입 (+{resources.income.grossIncome} {resources.income.currencyName})</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {resources.income.incomeItems.map(item => (
                        <div key={item.id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: 'rgba(255, 255, 255, 0.03)',
                          padding: '4px 8px',
                          borderRadius: '5px',
                          fontSize: '0.75rem'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: '#e2e8f0', fontWeight: '500' }}>{item.name}</span>
                            <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{item.desc}</span>
                          </div>
                          <span style={{ color: '#4ade80', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                            +{item.amount.toFixed(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Gross Expense List */}
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#f87171', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <TrendingDown size={13} />
                      <span>총 세출 (-{resources.income.grossExpense} {resources.income.currencyName})</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {resources.income.expenseItems.map(item => (
                        <div key={item.id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: 'rgba(255, 255, 255, 0.03)',
                          padding: '4px 8px',
                          borderRadius: '5px',
                          fontSize: '0.75rem'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: '#e2e8f0', fontWeight: '500' }}>{item.name}</span>
                            <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{item.desc}</span>
                          </div>
                          <span style={{ color: '#f87171', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                            -{item.amount.toFixed(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Tip */}
                <div style={{
                  marginTop: '10px',
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '0.68rem',
                  color: '#94a3b8',
                  lineHeight: '1.4'
                }}>
                  💡 관리력(Stewardship) 향상 또는 생산·무역 시설 확충 시 턴당 세입이 증가합니다.
                </div>
              </div>
            )}
          </div>

          <div style={{ width: '1px', height: '16px', background: 'rgba(200, 159, 60, 0.25)' }} />

          {/* 👑 Prestige / Standing */}
          <div 
            onClick={onOpenCharacter}
            onMouseEnter={() => setShowPrestigeTooltip(true)}
            onMouseLeave={() => setShowPrestigeTooltip(false)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 6px', cursor: 'pointer', position: 'relative' }} 
            title="클릭하여 인물 상세 시트 및 결단 확인"
          >
            <Crown size={16} style={{ color: 'var(--gold-accent)' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{resources.labels.prestigeLabel}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--gold-hover)', fontWeight: 'bold' }}>
                  {resources.prestigeScore}점
                </span>
                <span style={{
                  fontSize: '0.65rem',
                  padding: '0 4px',
                  borderRadius: '3px',
                  background: 'rgba(192, 132, 252, 0.2)',
                  border: '1px solid rgba(192, 132, 252, 0.4)',
                  color: '#e9d5ff',
                  fontWeight: '600'
                }}>
                  Lv.{resources.prestigeTier} {resources.prestigeLevel}
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  color: '#c084fc',
                  fontWeight: 'bold',
                  background: 'rgba(192, 132, 252, 0.15)',
                  padding: '0 4px',
                  borderRadius: '3px'
                }}>
                  {resources.prestigeGain?.formattedGain || '+0.0/턴'}
                </span>
              </div>
            </div>

            {/* Prestige Breakdown Popover */}
            {showPrestigeTooltip && resources.prestigeGain && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginTop: '8px',
                width: '280px',
                background: 'linear-gradient(145deg, #1f1812, #140f0b)',
                border: '1px solid rgba(192, 132, 252, 0.4)',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.85)',
                padding: '12px',
                zIndex: 1000,
                color: '#f5ecd8',
                fontSize: '0.75rem',
                pointerEvents: 'none'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(192, 132, 252, 0.2)', paddingBottom: '6px', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', color: '#e9d5ff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Crown size={13} style={{ color: '#c084fc' }} />
                    <span>👑 위신 턴당 수지 분석</span>
                  </span>
                  <span style={{ fontWeight: 'bold', color: '#c084fc' }}>
                    {resources.prestigeGain.formattedGain}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {resources.prestigeGain.breakdownItems.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{item.name}</span>
                      <span style={{ color: '#a78bfa', fontWeight: 'bold' }}>+{item.amount.toFixed(1)}</span>
                    </div>
                  ))}
                  {resources.prestigeGain.statModifierPercent > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#38bdf8' }}>
                      <span>외교/군사 시너지 증폭</span>
                      <span>+{resources.prestigeGain.statModifierPercent}%</span>
                    </div>
                  )}
                  {resources.prestigeGain.tierBonusPercent > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#c084fc' }}>
                      <span>명망 단계({resources.prestigeTier}단계) 증폭</span>
                      <span>+{resources.prestigeGain.tierBonusPercent}%</span>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed rgba(255,255,255,0.1)', color: 'var(--text-muted)', fontSize: '0.68rem' }}>
                  💡 위신은 결단이나 외교 조약에 소모할 수 있으며, 점수가 줄어도 도달한 단계는 떨어지지 않습니다.
                </div>
              </div>
            )}
          </div>

          <div style={{ width: '1px', height: '16px', background: 'rgba(200, 159, 60, 0.25)' }} />

          {/* 🕊️ Piety / Morale */}
          <div 
            onClick={onOpenCharacter}
            onMouseEnter={() => setShowPietyTooltip(true)}
            onMouseLeave={() => setShowPietyTooltip(false)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 6px', cursor: 'pointer', position: 'relative' }} 
            title="클릭하여 인물 상세 시트 및 신성 결단 확인"
          >
            <Sparkles size={16} style={{ color: '#34d399' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{resources.labels.pietyLabel}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '0.85rem', color: '#a7f3d0', fontWeight: 'bold' }}>
                  {resources.pietyScore}점
                </span>
                <span style={{
                  fontSize: '0.65rem',
                  padding: '0 4px',
                  borderRadius: '3px',
                  background: 'rgba(52, 211, 153, 0.2)',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  color: '#6ee7b7',
                  fontWeight: '600'
                }}>
                  Lv.{resources.pietyTier} {resources.pietyLevel}
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  color: '#34d399',
                  fontWeight: 'bold',
                  background: 'rgba(52, 211, 153, 0.15)',
                  padding: '0 4px',
                  borderRadius: '3px'
                }}>
                  {resources.pietyGain?.formattedGain || '+0.0/턴'}
                </span>
              </div>
            </div>

            {/* Piety Breakdown Popover */}
            {showPietyTooltip && resources.pietyGain && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginTop: '8px',
                width: '280px',
                background: 'linear-gradient(145deg, #1f1812, #140f0b)',
                border: '1px solid rgba(52, 211, 153, 0.4)',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.85)',
                padding: '12px',
                zIndex: 1000,
                color: '#f5ecd8',
                fontSize: '0.75rem',
                pointerEvents: 'none'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(52, 211, 153, 0.2)', paddingBottom: '6px', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Sparkles size={13} style={{ color: '#34d399' }} />
                    <span>🕊️ 신앙 턴당 수지 분석</span>
                  </span>
                  <span style={{ fontWeight: 'bold', color: '#34d399' }}>
                    {resources.pietyGain.formattedGain}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {resources.pietyGain.breakdownItems.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{item.name}</span>
                      <span style={{ color: '#6ee7b7', fontWeight: 'bold' }}>+{item.amount.toFixed(1)}</span>
                    </div>
                  ))}
                  {resources.pietyGain.statModifierPercent > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#38bdf8' }}>
                      <span>학습/영성 시너지 증폭</span>
                      <span>+{resources.pietyGain.statModifierPercent}%</span>
                    </div>
                  )}
                  {resources.pietyGain.tierBonusPercent > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#34d399' }}>
                      <span>신앙 단계({resources.pietyTier}단계) 증폭</span>
                      <span>+{resources.pietyGain.tierBonusPercent}%</span>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed rgba(255,255,255,0.1)', color: 'var(--text-muted)', fontSize: '0.68rem' }}>
                  💡 신앙은 사면령이나 교황청 청원에 소모할 수 있으며, 점수가 줄어도 영적 경지는 영구 보존됩니다.
                </div>
              </div>
            )}
          </div>

          <div style={{ width: '1px', height: '16px', background: 'rgba(200, 159, 60, 0.25)' }} />

          {/* ⚔️ Army / Levies / Companions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 6px' }} title={resources.labels.leviesLabel}>
            <Shield size={16} style={{ color: '#f87171' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{resources.labels.leviesLabel}</span>
              <span style={{ fontSize: '0.85rem', color: '#fee2e2', fontWeight: 'bold' }}>
                {resources.levies}
              </span>
            </div>
          </div>

          <div style={{ width: '1px', height: '16px', background: 'rgba(200, 159, 60, 0.25)' }} />

          {/* 🏰 Domain / Holdings / Camp */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 6px' }} title={resources.labels.domainLabel}>
            <Castle size={16} style={{ color: '#86efac' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{resources.labels.domainLabel}</span>
              <span style={{ fontSize: '0.85rem', color: '#dcfce7', fontWeight: 'bold' }}>
                {resources.domain}
              </span>
            </div>
          </div>

          <div style={{ width: '1px', height: '16px', background: 'rgba(200, 159, 60, 0.25)' }} />

          {/* 💢 Stress 3-Tier Bar */}
          <div 
            title={`스트레스: ${stress.value}/100 (${stress.tierLabel})\n${stress.breakdownRisk}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 6px',
              cursor: 'help'
            }}
          >
            <Flame size={16} style={{ color: stress.color, flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: '85px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: stress.color, fontWeight: 'bold' }}>
                <span>스트레스 {stress.tier > 0 ? `Lv.${stress.tier}` : '안정'}</span>
                <span>({stress.value}/100)</span>
              </div>
              <div style={{
                width: '100%',
                height: '6px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min(100, stress.value)}%`,
                  height: '100%',
                  background: stress.color,
                  boxShadow: `0 0 6px ${stress.color}`
                }} />
              </div>
            </div>
          </div>

        </div>

        {/* Right: Medieval Date & Turn Ribbon */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, rgba(42, 32, 23, 0.9), rgba(24, 18, 13, 0.95))',
            border: '1px solid var(--gold-accent)',
            borderRadius: '6px',
            padding: '5px 12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4), 0 0 10px rgba(200, 159, 60, 0.2)'
          }}>
            <Calendar size={14} style={{ color: 'var(--gold-accent)' }} />
            <span style={{
              color: 'var(--gold-hover)',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              whiteSpace: 'nowrap'
            }}>
              {cleanDate}
            </span>
            <span style={{
              background: 'linear-gradient(180deg, #c89f3c, #967425)',
              color: '#1a130c',
              fontWeight: 'bold',
              fontSize: '0.75rem',
              padding: '2px 7px',
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.5)'
            }}>
              TURN {turn}
            </span>
          </div>

          {/* Quick Action Menus */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Quick Save */}
            {onQuickSave && (
              <button
                onClick={onQuickSave}
                title="단축키 [Q] - 즉시 퀵세이브"
                style={{
                  background: 'rgba(251, 191, 36, 0.15)',
                  border: '1px solid rgba(251, 191, 36, 0.4)',
                  color: '#fbbf24',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 'bold'
                }}
              >
                <Zap size={13} />
                <span>퀵세이브</span>
              </button>
            )}

            {/* Undo Turn */}
            {canUndo && onUndoTurn && (
              <button
                onClick={() => {
                  if (confirm('직전 턴 상태로 게임을 되돌리시겠습니까?')) {
                    onUndoTurn();
                  }
                }}
                title="단축키 [Z] - 직전 턴 되돌리기"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#fca5a5',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RotateCcw size={13} />
                <span>되돌리기</span>
              </button>
            )}

            {/* Save Manager Button */}
            <button
              onClick={onOpenSave}
              title="다중 슬롯 세이브 & 로드 매니저 열기"
              style={{
                background: 'linear-gradient(45deg, rgba(212, 175, 55, 0.2), rgba(15, 23, 42, 0.8))',
                border: '1px solid var(--gold-accent)',
                color: 'var(--gold-hover)',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Save size={13} />
              <span>저장/로드</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              title="글자 크기, 텍스트 속도, 단축키 설정"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'var(--text-main)',
                padding: '5px 8px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Settings size={13} />
              <span>설정</span>
            </button>

            {/* Return to Title */}
            <button
              onClick={onReturnTitle}
              title="메인 타이틀로 이동"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                padding: '5px 8px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              타이틀
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Navigation Tabs: Clean & Distinct Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        marginTop: '8px',
        paddingTop: '6px',
        borderTop: '1px solid rgba(212, 175, 55, 0.15)',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={onOpenFamilyTree}
          className="ck-nav-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'linear-gradient(180deg, #382a1c 0%, #221810 100%)',
            border: '1px solid rgba(200, 159, 60, 0.4)',
            color: 'var(--gold-hover)',
            padding: '7px 16px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 2px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)'
          }}
        >
          <Users size={15} style={{ color: '#a7f3d0' }} />
          <span>{resources.archetype === 'clergy' ? '⛪ 교단 계보도 (Religious Tree)' : resources.archetype === 'company' ? '👥 단원 지휘부 (Company Tree)' : resources.archetype === 'wanderer' ? '🗡️ 동료 계보 (Companions)' : '👑 가문 계보도 (Family Tree)'}</span>
        </button>

        <button
          onClick={onOpenRealm}
          className="ck-nav-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'linear-gradient(180deg, #382a1c 0%, #221810 100%)',
            border: '1px solid rgba(200, 159, 60, 0.4)',
            color: 'var(--gold-hover)',
            padding: '7px 16px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 2px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)'
          }}
        >
          <Castle size={15} style={{ color: 'var(--gold-accent)' }} />
          <span>{resources.archetype === 'clergy' ? '⛪ 교구 현황 (Parish Order)' : resources.archetype === 'company' ? '⛺ 부대 본진 (Camp Order)' : resources.archetype === 'wanderer' ? '🏕️ 방랑 거점 (Camp Order)' : '🏰 영지 통치 (Realm Order)'}</span>
        </button>

        <button
          onClick={onOpenEstate}
          className="ck-nav-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'linear-gradient(180deg, #382a1c 0%, #221810 100%)',
            border: '1px solid rgba(200, 159, 60, 0.4)',
            color: 'var(--gold-hover)',
            padding: '7px 16px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 2px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)'
          }}
        >
          <Castle size={15} style={{ color: '#fbbf24' }} />
          <span>⛺ 거점 시설 및 건설 (Holdings)</span>
        </button>

        <button
          onClick={onOpenRelations}
          className="ck-nav-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'linear-gradient(180deg, #382a1c 0%, #221810 100%)',
            border: '1px solid rgba(200, 159, 60, 0.4)',
            color: 'var(--gold-hover)',
            padding: '7px 16px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 2px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)'
          }}
        >
          <Heart size={15} style={{ color: '#fca5a5' }} />
          <span>{
            resources.archetype === 'clergy' ? '⛪ 교구 인맥 (Relations)' :
            resources.archetype === 'wanderer' ? '🗡️ 방랑 인맥 (Relations)' :
            resources.archetype === 'company' ? '👥 대외 인맥 (Relations)' :
            '🤝 궁정 외교 (Court & Relations)'
          }</span>
        </button>

        <button
          onClick={onOpenChronicle}
          className="ck-nav-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'linear-gradient(180deg, #382a1c 0%, #221810 100%)',
            border: '1px solid rgba(200, 159, 60, 0.4)',
            color: 'var(--gold-hover)',
            padding: '7px 16px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 2px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)'
          }}
        >
          <Scroll size={15} style={{ color: '#d8b4fe' }} />
          <span>📜 연대기 & 국면 (Chronicle)</span>
        </button>
      </div>
    </header>
  );
}
