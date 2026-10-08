"use client";

import React from 'react';
import { ChronicleItem, ParsedState } from '@/lib/parser';
import { X, Calendar, Compass, Target } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  chronicle?: ChronicleItem[];
  objective?: ParsedState['objective'];
  characterName?: string;
}

export default function ChronicleModal({ isOpen, onClose, chronicle = [], objective, characterName = '군주' }: Props) {
  if (!isOpen) return null;

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
        zIndex: 1200,
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
          maxWidth: '840px',
          maxHeight: '88vh',
          overflowY: 'auto',
          borderRadius: '16px',
          border: '2px solid rgba(212, 175, 55, 0.45)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(212, 175, 55, 0.2)',
          padding: '28px',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
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
            borderRadius: '4px'
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
            background: 'radial-gradient(circle, rgba(212, 175, 55, 0.3) 0%, rgba(15, 23, 42, 0.8) 100%)',
            border: '2px solid var(--gold-accent)',
            fontSize: '1.8rem',
            marginBottom: '8px'
          }}>
            📜
          </div>
          <h2 style={{ color: 'var(--gold-accent)', fontSize: '1.7rem', fontWeight: 'bold', margin: '0 0 4px 0', letterSpacing: '2px' }}>
            {characterName}의 역사 연대기
          </h2>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            지금까지 결단해 온 역사의 궤적과 직면한 시대적 과제
          </div>
        </div>

        {/* Current Objective & Strategic Ambitions */}
        {objective && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.8))',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gold-accent)', fontWeight: 'bold', fontSize: '1.05rem', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
              <Compass size={18} />
              <span>현재 국면 및 단기 야망 (Current Ambitions)</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '12px' }}>
              <div>
                <span style={{ color: 'var(--gold-hover)', fontSize: '0.85rem', fontWeight: 'bold' }}>[현재 주요 국면]</span>
                <div style={{ color: 'var(--text-main)', fontWeight: 'bold', marginTop: '4px', paddingLeft: '8px', borderLeft: '3px solid var(--gold-accent)', lineHeight: '1.4' }}>
                  {objective.ultimateGoal}
                </div>
              </div>

              {objective.currentGoal && (
                <div>
                  <span style={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: 'bold' }}>[단기 야망]</span>
                  <div style={{ color: 'var(--text-main)', fontWeight: 'bold', marginTop: '4px', paddingLeft: '8px', borderLeft: '3px solid #38bdf8', lineHeight: '1.4' }}>
                    {objective.currentGoal}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>진행 상태:</span>
              <span style={{
                padding: '3px 10px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                background: objective.status.includes('달성') || objective.status.includes('충족') ? 'rgba(16,185,129,0.2)' : 
                            objective.status.includes('실패') || objective.status.includes('위기') ? 'rgba(239,68,68,0.2)' : 'rgba(212,175,55,0.2)',
                color: objective.status.includes('달성') || objective.status.includes('충족') ? 'var(--success)' : 
                       objective.status.includes('실패') || objective.status.includes('위기') ? 'var(--danger)' : 'var(--gold-hover)',
                border: `1px solid ${objective.status.includes('달성') || objective.status.includes('충족') ? 'var(--success)' : objective.status.includes('실패') || objective.status.includes('위기') ? 'var(--danger)' : 'var(--gold-accent)'}`
              }}>
                {objective.status}
              </span>
            </div>

            {objective.summary && (
              <div style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5', background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: '6px' }}>
                💡 {objective.summary}
              </div>
            )}
          </div>
        )}

        {/* Chronicle Timeline Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gold-accent)', fontWeight: 'bold', fontSize: '1.05rem', marginBottom: '14px' }}>
          <Target size={18} />
          <span>턴별 역사 기록 ({chronicle.length}건)</span>
        </div>

        {/* Chronicle Timeline */}
        {chronicle.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            아직 기록된 연대기 역사가 없습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {chronicle.slice().reverse().map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start'
                }}
              >
                {/* Turn Badge */}
                <div style={{
                  background: 'rgba(212, 175, 55, 0.15)',
                  border: '1px solid var(--gold-accent)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  textAlign: 'center',
                  minWidth: '70px',
                  flexShrink: 0
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--gold-accent)', fontWeight: 'bold' }}>TURN</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--gold-hover)' }}>{item.turn}</div>
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#94a3b8' }}>
                      <Calendar size={14} style={{ color: 'var(--gold-accent)' }} />
                      <span>{item.dateLocation || '서기 미상'}</span>
                    </div>
                    {item.result && (
                      <span style={{
                        background: item.result.includes('대성공') ? 'rgba(16,185,129,0.2)' : item.result.includes('성공') || item.result.includes('시작') ? 'rgba(56, 189, 248, 0.15)' : 'rgba(239,68,68,0.2)',
                        border: `1px solid ${item.result.includes('대성공') ? 'var(--success)' : item.result.includes('성공') || item.result.includes('시작') ? '#38bdf8' : 'var(--danger)'}`,
                        color: item.result.includes('대성공') ? 'var(--success)' : item.result.includes('성공') || item.result.includes('시작') ? '#7dd3fc' : '#fca5a5',
                        fontSize: '0.75rem',
                        padding: '1px 8px',
                        borderRadius: '4px',
                        fontWeight: 'bold'
                      }}>
                        {item.result}
                      </span>
                    )}
                  </div>

                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '6px' }}>
                    &ldquo;{item.action}&rdquo;
                  </div>

                  {item.summary && (
                    <div style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '1.4', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '6px' }}>
                      {item.summary}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
