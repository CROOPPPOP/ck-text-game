"use client";

import React from "react";

interface Props {
  factionState?: Record<string, string>;
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
  if (val.includes('재앙') || val.includes('매우 낮음') || val.includes('폭동') || val.includes('붕괴')) {
    return { percent: 15, label: val, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' };
  }
  if (val.includes('낮음') || val.includes('불안') || val.includes('위험')) {
    return { percent: 35, label: val, color: '#f87171', bg: 'rgba(248, 113, 113, 0.2)' };
  }
  if (val.includes('보통') || val.includes('유지') || val.includes('평이')) {
    return { percent: 55, label: val, color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.2)' };
  }
  if (val.includes('높음') || val.includes('안정') || val.includes('우호')) {
    return { percent: 75, label: val, color: '#34d399', bg: 'rgba(52, 211, 153, 0.2)' };
  }
  if (val.includes('매우 높음') || val.includes('탁월') || val.includes('극한') || val.includes('철통')) {
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

export default function RealmDashboard({ factionState }: Props) {
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
        <div style={{ fontSize: '0.85rem' }}>영지를 획득하거나 직위를 제수받으면 크루세이더 킹즈 영지 통치 패널이 활성화됩니다.</div>
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
          return (
            <div key={key} style={{
              background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              borderRadius: '8px',
              padding: '12px 10px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{ fontSize: '1.4rem', marginBottom: '2px' }}>{getResourceIcon(key)}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gold-accent)', fontWeight: 'bold' }}>{key}</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-main)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>
                {val}
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

    </div>
  );
}
