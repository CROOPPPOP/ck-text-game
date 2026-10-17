'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, X, Award, Skull, Calendar, User, Trash2 } from 'lucide-react';
import { PlayerArchetype } from '@/lib/ckVisuals';

export interface PastLifeRecord {
  id: string;
  name: string;
  house: string;
  archetype: PlayerArchetype;
  startYear: number;
  endYear: number;
  finalAge: number;
  deathCause: string;
  epitaph: string;
  summary: string;
  totalTurns: number;
  timestamp: number;
}

interface CKPastLivesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CKPastLivesModal({ isOpen, onClose }: CKPastLivesModalProps) {
  const [pastLives, setPastLives] = useState<PastLifeRecord[]>([]);

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('ck_past_lives');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setPastLives(parsed);
          }
        }
      } catch (e) {
        console.error('Failed to load past lives', e);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClearHistory = () => {
    if (confirm('영면한 모든 선대 인물들의 연대기 기록을 초기화하시겠습니까? (되돌릴 수 없습니다)')) {
      localStorage.removeItem('ck_past_lives');
      setPastLives([]);
    }
  };

  const getArchetypeBadge = (archetype: PlayerArchetype) => {
    switch (archetype) {
      case 'peasant':
        return { label: '소작농 / 평민', icon: '🌾', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
      case 'wanderer':
        return { label: '방랑자 / 모험가', icon: '🗡️', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' };
      case 'clergy':
        return { label: '성직자 / 수도사', icon: '⛪', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.15)' };
      case 'company':
        return { label: '용병단장', icon: '👥', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' };
      case 'noble':
      default:
        return { label: '봉건 영주', icon: '👑', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' };
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '760px',
        maxHeight: '88vh',
        background: 'linear-gradient(165deg, #1e1610 0%, #120d09 100%)',
        border: '1.5px solid rgba(212, 175, 55, 0.45)',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(212, 175, 55, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
          background: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={22} color="#fbbf24" />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#fef3c7', fontWeight: 800 }}>
                📜 지난 삶들의 서고 (Memorial Codex)
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#a8a29e' }}>
                당신이 살아온 역대 중세 인물들의 일대기와 마지막 묘비명 기록
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#a8a29e',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {pastLives.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#78716c',
              fontSize: '0.95rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <BookOpen size={48} color="#57534e" />
              <div>
                아직 영면한 선대의 기록이 없습니다.<br />
                <span style={{ fontSize: '0.82rem', color: '#a8a29e' }}>
                  새로운 중세 인물의 여정을 마치고 나면, 이곳에 영원한 역사의 한 쪽으로 보존됩니다.
                </span>
              </div>
            </div>
          ) : (
            pastLives.map((life, idx) => {
              const badge = getArchetypeBadge(life.archetype);
              return (
                <div
                  key={life.id || idx}
                  style={{
                    background: 'rgba(28, 20, 14, 0.75)',
                    border: '1px solid rgba(212, 175, 55, 0.25)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(212, 175, 55, 0.2)',
                        color: '#fbbf24',
                        border: '1px solid rgba(212, 175, 55, 0.4)'
                      }}>
                        제 {idx + 1}대 인물
                      </span>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fef3c7' }}>
                        {life.house ? `${life.house} ` : ''}{life.name}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: badge.bg,
                        color: badge.color,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span>{badge.icon}</span>
                        <span>{badge.label}</span>
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#d6d3d1' }}>
                      <Calendar size={13} color="#fbbf24" />
                      <span>서기 {life.startYear}년 ~ {life.endYear}년 (향년 {life.finalAge}세)</span>
                    </div>
                  </div>

                  {/* Death Cause & Epitaph */}
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '10px 14px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#f87171', fontWeight: 700, marginBottom: '4px' }}>
                      <Skull size={13} />
                      <span>사인: {life.deathCause || '세월의 흐름과 영면'}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#e7e5e4', fontStyle: 'italic', lineHeight: 1.6 }}>
                      "{life.epitaph || life.summary || '그의 삶은 이 중세 땅에 깊은 궤적을 남겼습니다.'}"
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid rgba(212, 175, 55, 0.2)',
          background: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {pastLives.length > 0 ? (
            <button
              onClick={handleClearHistory}
              style={{
                background: 'transparent',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Trash2 size={13} />
              <span>기록 초기화</span>
            </button>
          ) : <div />}

          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, #d4af37, #b8860b)',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 20px',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#1a140d',
              cursor: 'pointer'
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
