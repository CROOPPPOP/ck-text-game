"use client";

import React, { useState } from "react";
import { ParsedState } from "@/lib/parser";
import { detectPlayerArchetype, parseCKResources } from "@/lib/ckVisuals";

interface Props {
  factionState?: Record<string, string>;
  gameState?: ParsedState;
}

// 수치 및 등급 파싱 헬퍼
function parseGaugeValue(val: string): { percent: number; label: string; color: string; bg: string } {
  // 숫자% 추출 시도
  const numMatch = val.match(/(\d+)\s*%/);
  if (numMatch) {
    const num = Math.min(100, Math.max(0, parseInt(numMatch[1], 10)));
    return getColorAndGrade(num, val);
  }

  // 숫자/100 추출 시도
  const fracMatch = val.match(/(\d+)\s*\/\s*100/);
  if (fracMatch) {
    const num = Math.min(100, Math.max(0, parseInt(fracMatch[1], 10)));
    return getColorAndGrade(num, val);
  }

  // 단순 정수 추출 시도
  const pureNumMatch = val.match(/^(\d+)$/);
  if (pureNumMatch) {
    const num = Math.min(100, Math.max(0, parseInt(pureNumMatch[1], 10)));
    return getColorAndGrade(num, val);
  }

  // 서술형 등급 매핑
  if (val.includes('재앙') || val.includes('매우 낮음') || val.includes('폭동') || val.includes('붕괴') || val.includes('위태')) {
    return { percent: 15, label: val, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' };
  }
  if (val.includes('낮음') || val.includes('불안') || val.includes('위험') || val.includes('미흡')) {
    return { percent: 35, label: val, color: '#f87171', bg: 'rgba(248, 113, 113, 0.2)' };
  }
  if (val.includes('보통') || val.includes('유지') || val.includes('평이') || val.includes('적정')) {
    return { percent: 55, label: val, color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.2)' };
  }
  if (val.includes('높음') || val.includes('안정') || val.includes('우호') || val.includes('충만')) {
    return { percent: 75, label: val, color: '#34d399', bg: 'rgba(52, 211, 153, 0.2)' };
  }
  if (val.includes('매우 높음') || val.includes('탁월') || val.includes('극한') || val.includes('철통') || val.includes('완벽')) {
    return { percent: 95, label: val, color: '#10b981', bg: 'rgba(16, 185, 129, 0.2)' };
  }

  return { percent: 50, label: val, color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.2)' };
}

function getColorAndGrade(num: number, raw: string) {
  if (num >= 80) return { percent: num, label: raw, color: '#10b981', bg: 'rgba(16, 185, 129, 0.2)' };
  if (num >= 60) return { percent: num, label: raw, color: '#34d399', bg: 'rgba(52, 211, 153, 0.2)' };
  if (num >= 40) return { percent: num, label: raw, color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.2)' };
  if (num >= 20) return { percent: num, label: raw, color: '#f87171', bg: 'rgba(248, 113, 113, 0.2)' };
  return { percent: num, label: raw, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' };
}

export default function RealmDashboard({ factionState, gameState }: Props) {
  const [showPopModal, setShowPopModal] = useState(false);
  const archetype = gameState ? detectPlayerArchetype(gameState) : 'noble';
  const resources = gameState ? parseCKResources(gameState, gameState.previousPopulation) : null;
  const isNoneFaction = !factionState || factionState.none;

  const renderPopulationModal = () => {
    if (!showPopModal || !resources?.populationGrowth) return null;
    const pop = resources.populationGrowth;
    const capacityPercent = Math.min(100, Math.round((pop.currentPopulation / pop.maxCapacity) * 100));
    const isOvercrowded = pop.currentPopulation >= pop.maxCapacity;

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}
        onClick={() => setShowPopModal(false)}
      >
        <div
          style={{
            background: 'linear-gradient(145deg, #1e293b, #0f172a)',
            border: '1px solid rgba(212, 175, 55, 0.4)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '520px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            color: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--gold-accent)', fontWeight: 'bold' }}>
                【 영지 인구 통계 & 정착민 장부 】
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                <span>👥 {resources.domain || '영지'} 인구 동태</span>
                {pop.delta !== undefined && (
                  <span style={{
                    fontSize: '0.78rem',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    background: pop.delta >= 0 ? 'rgba(52, 211, 153, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: pop.delta >= 0 ? '#34d399' : '#f87171',
                    border: `1px solid ${pop.delta >= 0 ? 'rgba(52, 211, 153, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
                  }}>
                    {pop.recentDeltaLabel}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowPopModal(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '1.4rem',
                cursor: 'pointer',
                padding: '0 4px',
                lineHeight: 1
              }}
            >
              ✕
            </button>
          </div>

          {/* Capacity Progress Bar Card */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            padding: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' }}>
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                🏰 거점 규모 수용 한도 (Capacity)
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: isOvercrowded ? '#f87171' : '#38bdf8' }}>
                {pop.currentPopulation.toLocaleString()}명 / {pop.maxCapacity.toLocaleString()}명 ({capacityPercent}%)
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                width: `${capacityPercent}%`,
                height: '100%',
                background: isOvercrowded ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #38bdf8, #34d399)',
                borderRadius: '4px',
                transition: 'width 0.4s ease'
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px' }}>
              <span>현재: {pop.rawString}</span>
              <span>{isOvercrowded ? '⚠️ 수용 한도 도달 (과밀 패널티 적용)' : `여유 수용량: +${(pop.maxCapacity - pop.currentPopulation).toLocaleString()}명`}</span>
            </div>
          </div>

          {/* Growth Breakdown Ledger */}
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--gold-accent)', fontWeight: 'bold', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>📈 턴당 예상 인구 증감 산출 내역</span>
              <span style={{ color: pop.growthRate >= 0 ? '#34d399' : '#f87171' }}>
                합계: {pop.formattedGrowth}/턴
              </span>
            </div>
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '180px',
              overflowY: 'auto'
            }}>
              {pop.growthItems.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                  <span style={{ color: '#cbd5e1' }}>• {item.label}</span>
                  <span style={{
                    fontWeight: 'bold',
                    color: item.amount > 0 ? '#34d399' : item.amount < 0 ? '#f87171' : '#94a3b8'
                  }}>
                    {item.amount > 0 ? `+${item.amount.toFixed(1)}` : item.amount.toFixed(1)}명
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Historical Delta Note (if available) */}
          {pop.delta !== undefined && (
            <div style={{
              background: pop.delta >= 0 ? 'rgba(52, 211, 153, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              border: `1px dashed ${pop.delta >= 0 ? 'rgba(52, 211, 153, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '0.8rem',
              color: pop.delta >= 0 ? '#a7f3d0' : '#fca5a5',
              lineHeight: '1.4'
            }}>
              <strong>🔄 직전 턴 대비 실질 변동 ({pop.recentDeltaLabel}): </strong>
              {pop.delta > 0
                ? '건물 완공, 거점 등급 승격, 피난민 유입 또는 안정된 섭정으로 인해 인구가 비약적으로 성장했습니다.'
                : pop.delta < 0
                ? '기근, 전쟁 징집, 전염병 또는 약탈 피해로 인해 거점 인구가 유출되었습니다.'
                : '직전 턴과 인구수 변동 없이 안정적으로 유지되고 있습니다.'}
            </div>
          )}

          {/* Guide tip footer */}
          <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: '1.3' }}>
            💡 거점 등급 승격이나 식료창고·주거 시설 증축 시 인구 수용 한도와 유입 속도가 증가합니다. 민심과 치안이 낮으면 인구가 이탈할 수 있습니다.
          </div>

          {/* Close Button */}
          <button
            onClick={() => setShowPopModal(false)}
            style={{
              marginTop: '4px',
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.05))',
              border: '1px solid var(--gold-accent)',
              borderRadius: '6px',
              color: 'var(--gold-accent)',
              padding: '8px',
              fontSize: '0.88rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    );
  };

  // 1. 방랑자 전용 대시보드 (Wanderer Camp & Travel Dashboard)
  if (archetype === 'wanderer' && isNoneFaction) {
    const survivalGauges = [
      { key: '야외 생존력 & 캠핑', val: '보통 (65%)', icon: '🏕️' },
      { key: '주막 및 거리 평판', val: '우호적 (75%)', icon: '🍺' },
      { key: '위험 감지 & 은밀성', val: '높음 (80%)', icon: '👁️' },
      { key: '유력 영주 후원 관심도', val: '관심 단계 (50%)', icon: '👑' },
      { key: '개인 무예 명성', val: '초야의 강호 (60%)', icon: '🗡️' }
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Title */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(15, 23, 42, 0.8))',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '10px',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div>
            <div style={{ color: '#38bdf8', fontSize: '0.8rem', fontWeight: 'bold' }}>
              【 1번 아키타입 】
            </div>
            <div style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 'bold' }}>
              🗡️ 방랑 모험가 생존 & 이동식 거점 대시보드
            </div>
          </div>
          <span style={{
            background: 'rgba(56, 189, 248, 0.2)',
            color: '#7dd3fc',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: 'bold'
          }}>
            1인칭 생존 & 무예
          </span>
        </div>

        {/* 4 Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
          <div style={{
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '8px',
            padding: '12px 10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '2px' }}>💰</div>
            <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 'bold' }}>소지 여비</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
              {resources?.gold || '동화 30개'}
              {resources?.income && (
                <span style={{ fontSize: '0.72rem', color: resources.income.netIncome >= 0 ? '#4ade80' : '#f87171', marginLeft: '4px', fontWeight: 'bold' }}>
                  ({resources.income.formattedNet}/턴)
                </span>
              )}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '8px',
            padding: '12px 10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '2px' }}>🗡️</div>
            <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 'bold' }}>개인 명망</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
              {resources?.prestige || '방랑자의 명성'}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            borderRadius: '8px',
            padding: '12px 10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '2px' }}>🏕️</div>
            <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 'bold' }}>임시 거처</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
              {resources?.domain || '모닥불 야영지'}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
            border: '1px solid rgba(248, 113, 113, 0.3)',
            borderRadius: '8px',
            padding: '12px 10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '2px' }}>👥</div>
            <div style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 'bold' }}>동행 동료</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
              {resources?.levies || '단신 (동행 1명)'}
            </div>
          </div>
        </div>

        {/* Survival Gauges */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '16px'
        }}>
          <div style={{ color: 'var(--gold-accent)', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🏕️ 방랑 생존 및 평판 지표 (Survival & Reputation)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {survivalGauges.map((g, idx) => {
              const gauge = parseGaugeValue(g.val);
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-main)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{g.icon}</span>
                      <span>{g.key}</span>
                    </span>
                    <span style={{ color: gauge.color, fontWeight: 'bold', fontSize: '0.8rem' }}>
                      {g.val}
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${gauge.percent}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${gauge.color}aa, ${gauge.color})`,
                      borderRadius: '4px'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Guidance Tip Box */}
        <div style={{
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px dashed rgba(56, 189, 248, 0.3)',
          borderRadius: '8px',
          padding: '12px 14px',
          fontSize: '0.85rem',
          color: '#bae6fd',
          lineHeight: '1.4'
        }}>
          <strong>💡 방랑자 활동 지침: </strong>
          현재 통치하는 고정 영지가 없는 1인칭 방랑 신분입니다. 여관이나 산길에서 마을 촌장 및 상인들의 의뢰를 수주하여 보수와 명성을 획득하십시오. 유력 영주의 눈에 띄어 가신이나 호위 기사로 등용되거나 독자적인 성채를 하사받아 영주로 승격할 수 있습니다.
        </div>
      </div>
    );
  }

  // 2. 소규모 집단 전용 대시보드 (Company / Mercenary Order Dashboard)
  if (archetype === 'company') {
    const troopCount = factionState?.['병력'] || factionState?.['단원'] || '정예 단원 24명';
    const companyFund = factionState?.['세력 재정'] || factionState?.['군자금'] || '금화 150닢';
    const campMorale = factionState?.['사기'] || factionState?.['군율'] || '높음 (85%)';
    const campLevel = gameState?.estate?.level || 'Lv.2 숙영지';

    const companyGauges = [
      { key: '부대 사기 (Morale)', val: factionState?.['민심'] || '높음 (85%)', icon: '🔥' },
      { key: '군율 및 기강 (Discipline)', val: factionState?.['치안'] || '엄격함 (80%)', icon: '🛡️' },
      { key: '전투 준비 태세 (Readiness)', val: factionState?.['군사 준비도'] || '완비 (75%)', icon: '🎯' },
      { key: '고용주 신뢰도 (Employer Trust)', val: factionState?.['정치 안정도'] || '보통 (65%)', icon: '🤝' },
      { key: '보급 및 전리품 만족도 (Supplies & Loot)', val: factionState?.['개발도'] || '보통 (60%)', icon: '📦' }
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Title */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(15, 23, 42, 0.8))',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '10px',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div>
            <div style={{ color: '#f87171', fontSize: '0.8rem', fontWeight: 'bold' }}>
              【 2번 아키타입 】
            </div>
            <div style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 'bold' }}>
              👥 용병단 지휘소 & 마차 숙영지 대시보드
            </div>
          </div>
          <span style={{
            background: 'rgba(239, 68, 68, 0.2)',
            color: '#fca5a5',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: 'bold'
          }}>
            집단 통솔 & 군자금
          </span>
        </div>

        {/* 4 Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
          <div
            onClick={() => setShowPopModal(true)}
            style={{
              background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '12px 10px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'transform 0.15s, border-color 0.15s'
            }}
            title="클릭하여 단원/인구 동태 장부 확인"
          >
            <div style={{ fontSize: '1.4rem', marginBottom: '2px' }}>⚔️</div>
            <div style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 'bold' }}>정예 단원</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
              {troopCount}
              {resources?.populationGrowth && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', color: resources.populationGrowth.growthRate >= 0 ? '#34d399' : '#f87171', fontWeight: 'bold' }}>
                    ({resources.populationGrowth.formattedGrowth}/턴)
                  </span>
                  {resources.populationGrowth.delta !== undefined && (
                    <span style={{
                      fontSize: '0.7rem',
                      color: resources.populationGrowth.delta >= 0 ? '#34d399' : '#f87171',
                      background: resources.populationGrowth.delta >= 0 ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      fontWeight: 'bold'
                    }}>
                      {resources.populationGrowth.recentDeltaLabel}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '8px',
            padding: '12px 10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '2px' }}>🪙</div>
            <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 'bold' }}>단원 군자금</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
              {companyFund}
              {resources?.income && (
                <span style={{ fontSize: '0.72rem', color: resources.income.netIncome >= 0 ? '#4ade80' : '#f87171', marginLeft: '4px', fontWeight: 'bold' }}>
                  ({resources.income.formattedNet}/턴)
                </span>
              )}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            borderRadius: '8px',
            padding: '12px 10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '2px' }}>🔥</div>
            <div style={{ fontSize: '0.75rem', color: '#f97316', fontWeight: 'bold' }}>부대 사기</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
              {campMorale}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            borderRadius: '8px',
            padding: '12px 10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '2px' }}>⛺</div>
            <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 'bold' }}>이동식 군영</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
              {campLevel}
            </div>
          </div>
        </div>

        {/* Company Gauges */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '16px'
        }}>
          <div style={{ color: 'var(--gold-accent)', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>⛺ 부대 기강 및 전력 지표 (Company Discipline & Power)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {companyGauges.map((g, idx) => {
              const gauge = parseGaugeValue(g.val);
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-main)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{g.icon}</span>
                      <span>{g.key}</span>
                    </span>
                    <span style={{ color: gauge.color, fontWeight: 'bold', fontSize: '0.8rem' }}>
                      {g.val}
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${gauge.percent}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${gauge.color}aa, ${gauge.color})`,
                      borderRadius: '4px'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Guidance Tip Box */}
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px dashed rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          padding: '12px 14px',
          fontSize: '0.85rem',
          color: '#fca5a5',
          lineHeight: '1.4'
        }}>
          <strong>⚠️ 용병단 지휘 지침: </strong>
          매 턴마다 단원 주급(급료)과 식량 보급 유지비가 지출됩니다. 군자금이 고갈되면 사기 폭락 및 반란/탈영이 일어날 수 있으므로 제후들의 참전 계약을 수주하고 전리품을 분배하십시오.
        </div>

        {/* Population Modal */}
        {renderPopulationModal()}
      </div>
    );
  }

  // 3. 성직자 전용 대시보드 (Clergy / Monastic Order Dashboard)
  if (archetype === 'clergy') {
    const flockCount = factionState?.['인구'] || '교구민 120명 (수도사 12명)';
    const titheFund = factionState?.['세력 재정'] || '교회 헌금 65은화';
    const holyOrder = factionState?.['병력'] || '호위 수사 8명';
    const churchEstate = gameState?.estate?.type || '교구 예배당 및 수도원';

    const clergyGauges = [
      { key: '신앙심 및 경건도 (Piety)', val: factionState?.['민심'] || '깊은 신앙 (95%)', icon: '🕊️' },
      { key: '교단 내 발언권 (Holy Influence)', val: factionState?.['행정력'] || '존경받음 (85%)', icon: '📜' },
      { key: '교구민 충성 및 복종 (Flock Loyalty)', val: factionState?.['치안'] || '평온함 (80%)', icon: '❤️' },
      { key: '세속 영주 관계 (Secular Relations)', val: factionState?.['정치 안정도'] || '마찰 주의 (55%)', icon: '⚖️' },
      { key: '이단 경계 및 교리 정통성 (Orthodoxy)', val: factionState?.['군사 준비도'] || '엄격함 (90%)', icon: '🕯️' }
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Title */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(15, 23, 42, 0.8))',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          borderRadius: '10px',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div>
            <div style={{ color: '#c084fc', fontSize: '0.8rem', fontWeight: 'bold' }}>
              【 3번 아키타입 】
            </div>
            <div style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 'bold' }}>
              ⛪ 수도원 & 교구 성당 대시보드
            </div>
          </div>
          <span style={{
            background: 'rgba(168, 85, 247, 0.2)',
            color: '#e9d5ff',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: 'bold'
          }}>
            신앙 & 교단 발언권
          </span>
        </div>

        {/* 4 Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
          <div
            onClick={() => setShowPopModal(true)}
            style={{
              background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '8px',
              padding: '12px 10px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'transform 0.15s, border-color 0.15s'
            }}
            title="클릭하여 교구민/인구 동태 장부 확인"
          >
            <div style={{ fontSize: '1.4rem', marginBottom: '2px' }}>👥</div>
            <div style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 'bold' }}>교구민 & 수도사</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
              {flockCount}
              {resources?.populationGrowth && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', color: resources.populationGrowth.growthRate >= 0 ? '#34d399' : '#f87171', fontWeight: 'bold' }}>
                    ({resources.populationGrowth.formattedGrowth}/턴)
                  </span>
                  {resources.populationGrowth.delta !== undefined && (
                    <span style={{
                      fontSize: '0.7rem',
                      color: resources.populationGrowth.delta >= 0 ? '#34d399' : '#f87171',
                      background: resources.populationGrowth.delta >= 0 ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      fontWeight: 'bold'
                    }}>
                      {resources.populationGrowth.recentDeltaLabel}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '8px',
            padding: '12px 10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '2px' }}>🪙</div>
            <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 'bold' }}>교회 헌금 & 십일조</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
              {titheFund}
              {resources?.income && (
                <span style={{ fontSize: '0.72rem', color: resources.income.netIncome >= 0 ? '#4ade80' : '#f87171', marginLeft: '4px', fontWeight: 'bold' }}>
                  ({resources.income.formattedNet}/턴)
                </span>
              )}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            borderRadius: '8px',
            padding: '12px 10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '2px' }}>⛪</div>
            <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 'bold' }}>교구 성당</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
              {churchEstate}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '8px',
            padding: '12px 10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '2px' }}>🛡️</div>
            <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 'bold' }}>호위 수사</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
              {holyOrder}
            </div>
          </div>
        </div>

        {/* Clergy Gauges */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '16px'
        }}>
          <div style={{ color: 'var(--gold-accent)', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>⛪ 신앙 및 교구 안정도 (Faith & Parish Order)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {clergyGauges.map((g, idx) => {
              const gauge = parseGaugeValue(g.val);
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-main)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{g.icon}</span>
                      <span>{g.key}</span>
                    </span>
                    <span style={{ color: gauge.color, fontWeight: 'bold', fontSize: '0.8rem' }}>
                      {g.val}
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${gauge.percent}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${gauge.color}aa, ${gauge.color})`,
                      borderRadius: '4px'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Guidance Tip Box */}
        <div style={{
          background: 'rgba(168, 85, 247, 0.08)',
          border: '1px dashed rgba(168, 85, 247, 0.3)',
          borderRadius: '8px',
          padding: '12px 14px',
          fontSize: '0.85rem',
          color: '#e9d5ff',
          lineHeight: '1.4'
        }}>
          <strong>🕊️ 성직자 영성 지침: </strong>
          독신 서약과 금욕 규율을 준수하며 교구민의 고해성사를 듣고 성경을 필사합니다. 십일조를 모아 구빈원/약초원을 확장하고 세속 영주와의 과세 갈등을 신성 권위로 방어하십시오.
        </div>

        {/* Population Modal */}
        {renderPopulationModal()}
      </div>
    );
  }

  // 4. 봉건 영주 및 기본 대시보드 (Feudal Realm Dashboard)
  if (!factionState || factionState.none) {
    return (
      <div style={{
        padding: '24px',
        textAlign: 'center',
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px dashed rgba(255, 255, 255, 0.15)',
        borderRadius: '8px',
        color: 'var(--text-muted)'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🏕️</div>
        <div style={{ fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px' }}>통치 중인 영지 없음 (방랑자/개인 신분)</div>
        <div style={{ fontSize: '0.85rem' }}>영지를 획득하거나 직위를 제수받으면 영지 통치 패널이 활성화됩니다.</div>
      </div>
    );
  }

  // 4대 자원 분류
  const resourceKeys = ['인구', '세력 재정', '행정력', '병력'];
  const gaugeKeys = ['치안', '민심', '군사 준비도', '정치 안정도', '개발도'];

  const getResourceIcon = (key: string) => {
    if (key.includes('인구')) return '👥';
    if (key.includes('재정') || key.includes('금화') || key.includes('자금')) return '🪙';
    if (key.includes('행정')) return '📜';
    if (key.includes('병력') || key.includes('군사')) return '⚔️';
    return '📦';
  };

  const getGaugeIcon = (key: string) => {
    if (key.includes('치안')) return '🛡️';
    if (key.includes('민심')) return '🕊️';
    if (key.includes('군사')) return '🎯';
    if (key.includes('정치') || key.includes('안정')) return '⚖️';
    if (key.includes('개발')) return '🏛️';
    return '📊';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      
      {/* 1. Crusader Kings Top HUD Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
        {resourceKeys.map((key) => {
          const val = factionState[key] || '-';
          const isPopKey = key.includes('인구');
          return (
            <div
              key={key}
              onClick={isPopKey ? () => setShowPopModal(true) : undefined}
              style={{
                background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
                border: isPopKey ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(212, 175, 55, 0.25)',
                borderRadius: '8px',
                padding: '12px 10px',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                cursor: isPopKey ? 'pointer' : 'default',
                transition: 'transform 0.15s, border-color 0.15s'
              }}
              title={isPopKey ? "클릭하여 영지 인구 동태 장부 확인" : val}
            >
              <div style={{ fontSize: '1.4rem', marginBottom: '2px' }}>{getResourceIcon(key)}</div>
              <div style={{ fontSize: '0.75rem', color: isPopKey ? '#38bdf8' : 'var(--gold-accent)', fontWeight: 'bold' }}>{key}</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-main)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>
                {val}
                {(key.includes('재정') || key.includes('금화') || key.includes('자금')) && resources?.income && (
                  <span style={{ fontSize: '0.72rem', color: resources.income.netIncome >= 0 ? '#4ade80' : '#f87171', marginLeft: '4px', fontWeight: 'bold' }}>
                    ({resources.income.formattedNet}/턴)
                  </span>
                )}
                {isPopKey && resources?.populationGrowth && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', color: resources.populationGrowth.growthRate >= 0 ? '#34d399' : '#f87171', fontWeight: 'bold' }}>
                      ({resources.populationGrowth.formattedGrowth}/턴)
                    </span>
                    {resources.populationGrowth.delta !== undefined && (
                      <span style={{
                        fontSize: '0.7rem',
                        color: resources.populationGrowth.delta >= 0 ? '#34d399' : '#f87171',
                        background: resources.populationGrowth.delta >= 0 ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        fontWeight: 'bold'
                      }}>
                        {resources.populationGrowth.recentDeltaLabel}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Visual Stability & Order Gauges */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '10px',
        padding: '16px'
      }}>
        <div style={{ color: 'var(--gold-accent)', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🏰 왕국 통치 지표 (Realm Order & Stability)</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {gaugeKeys.map((key) => {
            const rawVal = factionState[key];
            if (!rawVal) return null;
            const gauge = parseGaugeValue(rawVal);

            return (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-main)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{getGaugeIcon(key)}</span>
                    <span>{key}</span>
                  </span>
                  <span style={{ color: gauge.color, fontWeight: 'bold', fontSize: '0.8rem' }}>
                    {rawVal}
                  </span>
                </div>
                
                {/* Gauge Progress Bar */}
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    width: `${gauge.percent}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${gauge.color}aa, ${gauge.color})`,
                    borderRadius: '4px',
                    boxShadow: `0 0 8px ${gauge.color}66`,
                    transition: 'width 0.5s ease-out'
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. 기타 세력 수치 (존재 시) */}
      {Object.entries(factionState).filter(([k]) => !resourceKeys.includes(k) && !gaugeKeys.includes(k) && k !== 'none').length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
          {Object.entries(factionState)
            .filter(([k]) => !resourceKeys.includes(k) && !gaugeKeys.includes(k) && k !== 'none')
            .map(([k, v], idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                <span style={{ color: 'var(--gold-accent)' }}>{k}</span>
                <span style={{ color: 'var(--text-main)' }}>{v}</span>
              </div>
            ))}
        </div>
      )}

      {/* Population Modal */}
      {renderPopulationModal()}

    </div>
  );
}
