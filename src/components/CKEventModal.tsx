"use client";

import React, { useState } from 'react';
import { ParsedState, ChronicleItem } from '@/lib/parser';
import { CKDecision, executeDecisionLocalEffects, DecisionOutcomeLog } from '@/lib/ckDecisions';
import { PromotionTarget } from '@/lib/statusPromotion';
import { formatDecimal, parseCKResources } from '@/lib/ckVisuals';
import { getCongenitalBadgeStyle } from '@/lib/geneticEngine';

export interface PromotionOutcomeLog {
  previousRank: string;
  newRank: string;
  ceremonyName: string;
  gainedTraits: string[];
  benefitsApplied: string[];
  chronicleSummary: string;
  preservedTurn: number;
}

export type EventOutcomeData = 
  | { type: 'decision'; data: DecisionOutcomeLog }
  | { type: 'promotion'; data: PromotionOutcomeLog };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gameState: ParsedState;
  turn: number;
  eventPayload: {
    type: 'decision' | 'promotion';
    decision?: CKDecision;
    promotionTarget?: PromotionTarget;
  } | null;
  onConfirmOutcome: (updatedState: ParsedState, outcome: EventOutcomeData) => void;
}

export default function CKEventModal({
  isOpen,
  onClose,
  gameState,
  turn,
  eventPayload,
  onConfirmOutcome
}: Props) {
  const [phase, setPhase] = useState<'event' | 'outcome'>('event');
  const [outcomeData, setOutcomeData] = useState<EventOutcomeData | null>(null);
  const [pendingState, setPendingState] = useState<ParsedState | null>(null);

  if (!isOpen || !eventPayload) return null;

  const { type, decision, promotionTarget } = eventPayload;
  const isDecision = type === 'decision' && !!decision;
  const isPromotion = type === 'promotion' && !!promotionTarget;

  if (!isDecision && !isPromotion) return null;

  const resources = parseCKResources(gameState);

  // 선택지 1: 정규 실행 (기본 칙령/서임)
  const handleSelectRegular = () => {
    if (isDecision && decision) {
      const { updatedState, outcome } = executeDecisionLocalEffects(gameState, decision, turn, false);
      setPendingState(updatedState);
      setOutcomeData({ type: 'decision', data: outcome });
      setPhase('outcome');
    } else if (isPromotion && promotionTarget) {
      // 로컬 신분 승격 상태 생성
      const updatedState: ParsedState = JSON.parse(JSON.stringify(gameState));
      const previousRank = updatedState.personalInfo?.['신분'] || '귀족';
      
      if (!updatedState.personalInfo) updatedState.personalInfo = {};
      updatedState.personalInfo['신분'] = promotionTarget.targetRank;
      if (updatedState.personalInfo['직위']) {
        updatedState.personalInfo['직위'] = `${promotionTarget.targetRank}`;
      }

      // 승격 특성 추가
      if (!Array.isArray(updatedState.traits)) updatedState.traits = [];
      const newTraitName = `${promotionTarget.targetRank} 서임자`;
      if (!updatedState.traits.some(t => t.name.includes(newTraitName))) {
        updatedState.traits.push({
          category: '잠재/혈통',
          name: newTraitName,
          tier: '확립된 특성 (Lv.4)',
          description: `'${promotionTarget.ceremonyName}' 의식을 완수하고 정식 수봉된 적법한 ${promotionTarget.targetRank}`,
          isNew: true
        });
      }

      // 연대기 추가
      if (!Array.isArray(updatedState.chronicle)) updatedState.chronicle = [];
      const chronItem: ChronicleItem = {
        turn,
        dateLocation: updatedState.dateLocation || '서기 1066년',
        action: `[신분 승격] ${promotionTarget.ceremonyName}`,
        summary: `'${promotionTarget.ceremonyName}' 서임식을 거행하여 정식 '${promotionTarget.targetRank}'(으)로 신분이 승격되었습니다. (턴 동결 처리)`,
        result: promotionTarget.benefits.slice(0, 2).join(' / ')
      };
      updatedState.chronicle.push(chronItem);

      const promoOutcome: PromotionOutcomeLog = {
        previousRank,
        newRank: promotionTarget.targetRank,
        ceremonyName: promotionTarget.ceremonyName,
        gainedTraits: [newTraitName],
        benefitsApplied: promotionTarget.benefits,
        chronicleSummary: chronItem.summary || '',
        preservedTurn: turn
      };

      setPendingState(updatedState);
      setOutcomeData({ type: 'promotion', data: promoOutcome });
      setPhase('outcome');
    }
  };

  // 선택지 2: 성스러운 헌신 / 가문의 영광 각성
  const handleSelectDevoted = () => {
    if (isDecision && decision) {
      const { updatedState, outcome } = executeDecisionLocalEffects(gameState, decision, turn, true);
      setPendingState(updatedState);
      setOutcomeData({ type: 'decision', data: outcome });
      setPhase('outcome');
    } else if (isPromotion && promotionTarget) {
      const updatedState: ParsedState = JSON.parse(JSON.stringify(gameState));
      const previousRank = updatedState.personalInfo?.['신분'] || '귀족';
      
      if (!updatedState.personalInfo) updatedState.personalInfo = {};
      updatedState.personalInfo['신분'] = promotionTarget.targetRank;
      if (updatedState.personalInfo['직위']) {
        updatedState.personalInfo['직위'] = `${promotionTarget.targetRank}`;
      }

      if (!Array.isArray(updatedState.traits)) updatedState.traits = [];
      const newTraitName = `${promotionTarget.targetRank} 서임자`;
      const devotionTrait = '신성한 군주의 위엄';
      
      if (!updatedState.traits.some(t => t.name.includes(newTraitName))) {
        updatedState.traits.push({
          category: '잠재/혈통',
          name: newTraitName,
          tier: '확립된 특성 (Lv.4)',
          description: `'${promotionTarget.ceremonyName}' 의식을 완수하고 정식 수봉된 적법한 ${promotionTarget.targetRank}`,
          isNew: true
        });
      }
      if (!updatedState.traits.some(t => t.name.includes(devotionTrait))) {
        updatedState.traits.push({
          category: '정신/성격',
          name: devotionTrait,
          tier: '잠재 특성 (Lv.3)',
          description: '장엄한 서임식과 교단·제후들의 합동 축복으로 발현된 군주의 드높은 위엄',
          isNew: true
        });
      }

      if (!Array.isArray(updatedState.chronicle)) updatedState.chronicle = [];
      const chronItem: ChronicleItem = {
        turn,
        dateLocation: updatedState.dateLocation || '서기 1066년',
        action: `[신분 승격] ${promotionTarget.ceremonyName} (영광의 서약)`,
        summary: `주교단과 모든 제후의 환호 속에 '${promotionTarget.ceremonyName}' 서임식을 완수하고 정식 '${promotionTarget.targetRank}'(으)로 승격되었습니다. (턴 동결 처리)`,
        result: promotionTarget.benefits.slice(0, 2).join(' / ')
      };
      updatedState.chronicle.push(chronItem);

      const promoOutcome: PromotionOutcomeLog = {
        previousRank,
        newRank: promotionTarget.targetRank,
        ceremonyName: promotionTarget.ceremonyName,
        gainedTraits: [newTraitName, devotionTrait],
        benefitsApplied: promotionTarget.benefits,
        chronicleSummary: chronItem.summary || '',
        preservedTurn: turn
      };

      setPendingState(updatedState);
      setOutcomeData({ type: 'promotion', data: promoOutcome });
      setPhase('outcome');
    }
  };

  // 결과창 최종 확인 및 반영
  const handleFinalConfirm = () => {
    if (pendingState && outcomeData) {
      onConfirmOutcome(pendingState, outcomeData);
    }
    setPhase('event');
    setOutcomeData(null);
    setPendingState(null);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 5, 8, 0.88)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '720px',
        maxHeight: '90vh',
        background: 'linear-gradient(165deg, #1e1914 0%, #15100c 60%, #0d0a07 100%)',
        border: '1.5px solid #d4af37',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(212, 175, 55, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Modal Top Header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid rgba(212, 175, 55, 0.3)',
          background: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>
              {isDecision ? decision?.icon : '👑'}
            </span>
            <div>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 'bold',
                letterSpacing: '1px',
                color: isDecision ? (decision?.category === 'piety' ? '#6ee7b7' : '#c084fc') : '#fde047',
                textTransform: 'uppercase'
              }}>
                {phase === 'event' 
                  ? (isDecision ? `CRUSADER KINGS DECISION • ${decision?.costType} 칙령` : 'STATUS ADVANCEMENT • 신분 승격 서임식')
                  : 'HISTORICAL RESOLUTION • 결과 및 연대기 공식 등재'}
              </span>
              <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#f5ecd8' }}>
                {phase === 'event'
                  ? (isDecision ? decision?.title : `${promotionTarget?.ceremonyName} 거행`)
                  : (isDecision ? `${decision?.title} 완수` : `${promotionTarget?.targetRank} 공식 서임 완료`)}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.3rem',
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Phase 1: Event Lore & Choice Selection */}
          {phase === 'event' && (
            <>
              {/* Event Context Banner */}
              <div style={{
                display: 'flex',
                gap: '14px',
                background: 'rgba(0, 0, 0, 0.35)',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{
                  fontSize: '2.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '56px',
                  background: 'rgba(212, 175, 55, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(212, 175, 55, 0.3)'
                }}>
                  {isDecision ? decision?.icon : '⚔️'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '0.82rem', color: '#d4af37', fontWeight: 'bold' }}>
                    {isDecision ? decision?.subtitle : `${promotionTarget?.targetRank} (신규 신분) 서임`}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: '1.5' }}>
                    {isDecision ? decision?.description : `${promotionTarget?.ceremonyName} 의식을 정식으로 거행하여 가문의 위상과 신분을 공식 격상시킵니다.`}
                  </div>
                </div>
              </div>

              {/* Historical Lore Quote */}
              <div style={{
                background: 'rgba(212, 175, 55, 0.06)',
                borderLeft: '3px solid #d4af37',
                padding: '10px 14px',
                borderRadius: '0 6px 6px 0',
                fontSize: '0.78rem',
                color: '#fef08a',
                lineHeight: '1.45',
                fontStyle: 'italic'
              }}>
                📜 역사적 고증: {isDecision ? decision?.historicalLore : promotionTarget?.historicalLore}
              </div>

              {/* Resource Cost / Requirements Preview */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(0, 0, 0, 0.45)',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  ⏳ <strong>진행 상태:</strong> 본 사건은 즉각 결산되며 <span style={{ color: '#38bdf8' }}>게임 턴(Turn {turn})을 소모하지 않습니다.</span>
                </div>
                {isDecision && decision && (
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    padding: '3px 10px',
                    borderRadius: '4px',
                    background: decision.category === 'piety' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(192, 132, 252, 0.2)',
                    color: decision.category === 'piety' ? '#6ee7b7' : '#e9d5ff',
                    border: `1px solid ${decision.category === 'piety' ? '#34d399' : '#c084fc'}`
                  }}>
                    {decision.costType} {formatDecimal(decision.cost)}점 소모
                  </span>
                )}
              </div>

              {/* Effects & Benefits Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#d4af37' }}>
                  🎁 발동 시 영구 적용 효과:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {(isDecision ? decision?.effects : promotionTarget?.benefits)?.map((eff, idx) => (
                    <div key={idx} style={{
                      fontSize: '0.78rem',
                      color: '#e2e8f0',
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span style={{ color: '#34d399' }}>✓</span>
                      <span>{eff}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Event Choices Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#f5ecd8' }}>
                  ⚖️ 군주의 선택 (Choices):
                </div>

                {/* Choice 1: Regular Execution */}
                <button
                  onClick={handleSelectRegular}
                  style={{
                    background: 'linear-gradient(135deg, rgba(35, 27, 21, 0.95), rgba(22, 17, 13, 0.95))',
                    border: '1.5px solid #d4af37',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#facc15')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#d4af37')}
                >
                  <div style={{ fontSize: '0.88rem', fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📜</span>
                    <span>[정식 반포] 엄숙히 선포하고 모든 효과를 즉각 적용한다.</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    필요한 대가를 치르고 칙령의 모든 권능과 보상을 지체 없이 영지에 적용합니다. (턴 소모 없음)
                  </div>
                </button>

                {/* Choice 2: Pious Devotion / Dynastic Glory */}
                <button
                  onClick={handleSelectDevoted}
                  style={{
                    background: 'linear-gradient(135deg, rgba(40, 20, 60, 0.85), rgba(25, 12, 38, 0.95))',
                    border: '1.5px solid #c084fc',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(192, 132, 252, 0.2)'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#e9d5ff')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#c084fc')}
                >
                  <div style={{ fontSize: '0.88rem', fontWeight: 'bold', color: '#e9d5ff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🌟</span>
                    <span>[성스러운 헌신 / 가문의 영광] 더욱 성대한 의식으로 혈통과 후대에 불멸의 귀감을 남긴다.</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#c4b5fd' }}>
                    정규 효과와 더불어 군주의 영적·정신적 각성을 이끌어내며 추가 보너스 특성을 각성합니다. (턴 소모 없음)
                  </div>
                </button>

                {/* Choice 3: Reconsider */}
                <button
                  onClick={onClose}
                  style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>💭</span>
                  <span>[보류] 아직 시기가 무르익지 않았으니 서임을 연기하고 재고한다.</span>
                </button>
              </div>
            </>
          )}

          {/* Phase 2: Outcome Briefing Modal (결과 통보창) */}
          {phase === 'outcome' && outcomeData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Turn Freeze Notice Badge */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.5), rgba(4, 47, 46, 0.7))',
                border: '1.5px solid #10b981',
                padding: '12px 16px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.25)'
              }}>
                <span style={{ fontSize: '1.8rem' }}>⏳</span>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 'bold', color: '#6ee7b7' }}>
                    턴 동결(Turn Freeze) 완료 — 현재 {turn}턴 유지
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#a7f3d0' }}>
                    본 결단 및 승격 사건은 즉각 결산되어 메인 턴을 소모하지 않고 로컬 데이터에 영구 보존되었습니다.
                  </div>
                </div>
              </div>

              {/* Changes Summary Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                {/* 1. Resource or Rank Change */}
                {outcomeData.type === 'decision' ? (
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.45)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '12px'
                  }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      💎 자원 변동 내역
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#f87171' }}>
                      {outcomeData.data.costType} -{formatDecimal(outcomeData.data.deductedCost)}점 차감
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                      잔여 {outcomeData.data.costType}: {formatDecimal(outcomeData.data.remainingScore)}점
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.45)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '12px'
                  }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      👑 신분 승격 변동
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 'bold', color: '#fde047' }}>
                      {outcomeData.data.previousRank} ➔ {outcomeData.data.newRank}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6ee7b7', marginTop: '2px' }}>
                      서임식: {outcomeData.data.ceremonyName} 완수
                    </div>
                  </div>
                )}

                {/* 2. Trait & Genetic Awakening */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '12px'
                }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    🧬 각성된 혈통 및 신규 특성
                  </div>
                  {outcomeData.data.gainedTraits.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {outcomeData.data.gainedTraits.map((trName, tIdx) => {
                        const badge = getCongenitalBadgeStyle(trName);
                        return (
                          <span key={tIdx} style={{
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: badge.bgColor,
                            border: `1px solid ${badge.borderColor}`,
                            color: badge.color,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span>{badge.icon}</span>
                            <span>{trName}</span>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      기존 보유 특성 유지
                    </div>
                  )}
                </div>
              </div>

              {/* Chronicle Entry Card */}
              <div style={{
                background: 'rgba(212, 175, 55, 0.06)',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                borderRadius: '8px',
                padding: '12px 14px'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#d4af37', marginBottom: '4px' }}>
                  📜 연대기 공식 등재 기록:
                </div>
                <div style={{ fontSize: '0.8rem', color: '#f5ecd8', lineHeight: '1.4' }}>
                  {outcomeData.data.chronicleSummary}
                </div>
              </div>

              {/* Return to Realm Button */}
              <button
                onClick={handleFinalConfirm}
                style={{
                  background: 'linear-gradient(135deg, #059669, #10b981)',
                  border: '1px solid #34d399',
                  color: '#fff',
                  padding: '14px',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  textAlign: 'center',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
                  transition: 'all 0.2s',
                  marginTop: '10px'
                }}
              >
                🏰 기록을 승인하고 영지로 복귀하기 (현재 턴 {turn} 유지)
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
