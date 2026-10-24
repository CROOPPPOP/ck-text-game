"use client";

import React from 'react';
import { ParsedState } from '@/lib/parser';
import { Crown, Dices, Skull, Award, Coins, Heart, Compass, Shield } from 'lucide-react';

interface Props {
  isOpen: boolean;
  gameState: ParsedState;
  turn: number;
  onSuccession?: () => void;
  onReincarnation: () => void;
}

export default function EpitaphModal({
  isOpen,
  gameState,
  turn,
  onSuccession,
  onReincarnation
}: Props) {
  if (!isOpen) return null;

  const rulerName = gameState.personalInfo?.['이름'] || '군주';
  const rulerAge = gameState.personalInfo?.['나이'] || '45';
  const rulerStatus = gameState.personalInfo?.['신분'] || '방랑자';
  const rulerHouse = gameState.personalInfo?.['칭호'] || '무명 가문';
  const causeOfDeath = gameState.ending || "치열했던 한평생의 풍파 끝에, 신의 부르심을 받아 영원한 안식에 들었습니다.";
  
  const heir = gameState.familyState?.heir || '없음';
  const hasValidHeir = heir && heir !== '없음' && !heir.includes('단절') && !heir.includes('방계 친척');

  // 재산 및 유산 집계
  const goldText = gameState.inventory?.['소지 화폐']?.[0] || '금화 0';
  const buildingsCount = gameState.estate?.buildings?.length || 0;
  const chronicleCount = gameState.chronicle?.length || turn;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 5, 8, 0.94)',
      backdropFilter: 'blur(12px)',
      zIndex: 2500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      fontFamily: 'var(--font-sans, "Pretendard", sans-serif)'
    }}>
      <div style={{
        background: 'linear-gradient(160deg, rgba(24, 18, 14, 0.98), rgba(12, 9, 8, 0.99))',
        border: '2px solid rgba(168, 50, 50, 0.65)',
        boxShadow: '0 30px 80px rgba(0, 0, 0, 0.95), 0 0 50px rgba(168, 50, 50, 0.25)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '32px',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Stone Cross & Header */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            padding: '4px 14px',
            borderRadius: '20px',
            color: '#f87171',
            fontSize: '12px',
            fontWeight: 'bold',
            letterSpacing: '1px'
          }}>
            <Skull size={15} />
            <span>생애 연대기 • 묘비명 (Epitaph)</span>
          </div>
          <h1 style={{
            fontSize: '2rem',
            color: '#fef3c7',
            fontWeight: 800,
            marginTop: '10px',
            marginBottom: '4px',
            letterSpacing: '1px'
          }}>
            ☩ {rulerName} ☩
          </h1>
          <p style={{ color: '#d4af37', fontSize: '13px', margin: 0, fontWeight: 600 }}>
            {rulerHouse} • 향년 {rulerAge}세 (총 {turn}턴 생존)
          </p>
        </div>

        {/* Stone Tombstone Panel */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(212, 175, 55, 0.25)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          textAlign: 'left'
        }}>
          {/* Cause of Death */}
          <div style={{
            padding: '12px 14px',
            background: 'rgba(168, 50, 50, 0.12)',
            borderLeft: '3px solid #ef4444',
            borderRadius: '0 8px 8px 0',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '11px', color: '#f87171', fontWeight: 700, marginBottom: '2px' }}>
              【 마지막 사인 (Cause of Death) 】
            </div>
            <div style={{ fontSize: '12.5px', color: '#f3f4f6', lineHeight: '1.6' }}>
              {causeOfDeath}
            </div>
          </div>

          {/* Legacy Summary Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '10px',
            fontSize: '12px',
            marginBottom: '16px'
          }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ color: '#fbbf24', fontSize: '11px', fontWeight: 600 }}>최종 신분</div>
              <div style={{ color: '#fff', fontSize: '14px', fontWeight: 800, marginTop: '2px' }}>
                {rulerStatus}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ color: '#34d399', fontSize: '11px', fontWeight: 600 }}>남겨진 재정</div>
              <div style={{ color: '#fff', fontSize: '14px', fontWeight: 800, marginTop: '2px' }}>
                {goldText}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ color: '#60a5fa', fontSize: '11px', fontWeight: 600 }}>세운 시설 및 인프라</div>
              <div style={{ color: '#fff', fontSize: '14px', fontWeight: 800, marginTop: '2px' }}>
                {buildingsCount}개 거점/시설
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ color: '#c084fc', fontSize: '11px', fontWeight: 600 }}>혈통 및 후계자</div>
              <div style={{ color: '#fff', fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>
                {heir}
              </div>
            </div>
          </div>

          {/* Historical Eulogy */}
          <div style={{ fontSize: '11.5px', color: '#94a3b8', fontStyle: 'italic', lineHeight: '1.6', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
            &quot;흙에서 태어나 흙으로 돌아갔으나, 그가 남긴 발자취와 결단은 연대기 속에 영원히 새겨질 것입니다.&quot;
          </div>
        </div>

        {/* Action Buttons: Succession or Reincarnation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {hasValidHeir && onSuccession && (
            <button
              onClick={onSuccession}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #d4af37, #996515)',
                border: 'none',
                color: '#1a140d',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(212, 175, 55, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.1)'}
              onMouseOut={e => e.currentTarget.style.filter = 'brightness(1)'}
            >
              {rulerStatus.includes('소작') || rulerStatus.includes('농민') || rulerStatus.includes('평민') ? (
                <>
                  <Shield size={18} />
                  <span>🌱 자식 ({heir})에게 오두막과 삶 물려주기 (2회차 계속)</span>
                </>
              ) : (
                <>
                  <Crown size={18} />
                  <span>👑 후계자 ({heir})로 가문 계승하기 (2회차 계속)</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onReincarnation}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1.5px solid rgba(212, 175, 55, 0.4)',
              color: '#fef3c7',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(212, 175, 55, 0.15)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
          >
            <Dices size={17} />
            <span>🎲 새로운 영혼으로 무작위 환생하기 (새 게임)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
