"use client";

import React, { useState } from 'react';
import { GenesisCardData, rollRandomBirth } from '@/lib/engine/genesisEngine';
import { ParsedState } from '@/lib/parser';
import { Dices, Sparkles, Shield, Award, Coins, Heart, Compass, Feather } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onConfirm: (cardData: GenesisCardData, initialState: ParsedState) => void;
  onClose?: () => void;
}

export default function GenesisModal({ isOpen, onConfirm }: Props) {
  const [birthData, setBirthData] = useState(() => rollRandomBirth());
  const [isRolling, setIsRolling] = useState(false);

  if (!isOpen) return null;

  const { cardData, gameState } = birthData;

  const handleReroll = () => {
    setIsRolling(true);
    setTimeout(() => {
      setBirthData(rollRandomBirth());
      setIsRolling(false);
    }, 280);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '남작':
      case '영주':
        return '#f59e0b'; // Gold
      case '용병':
      case '용병대장':
      case '방랑 검사':
        return '#ef4444'; // Red
      case '학사':
      case '도제 사제':
        return '#3b82f6'; // Blue
      default:
        return '#10b981'; // Green (Peasant/Artisan)
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 7, 12, 0.88)',
      backdropFilter: 'blur(10px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      fontFamily: 'var(--font-sans, "Pretendard", sans-serif)'
    }}>
      <div style={{
        background: 'linear-gradient(145deg, rgba(28, 20, 14, 0.98), rgba(15, 11, 8, 0.99))',
        border: '2px solid rgba(212, 175, 55, 0.55)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(212, 175, 55, 0.15)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '28px',
        position: 'relative',
        transform: isRolling ? 'scale(0.97) rotate(-0.5deg)' : 'scale(1)',
        opacity: isRolling ? 0.6 : 1,
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Header Ribbon */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(212, 175, 55, 0.12)',
            border: '1px solid rgba(212, 175, 55, 0.35)',
            padding: '4px 14px',
            borderRadius: '20px',
            color: '#fbbf24',
            fontSize: '12px',
            fontWeight: 'bold',
            letterSpacing: '1px'
          }}>
            <Dices size={15} />
            <span>80억 분의 1 • 중세 운명의 주사위</span>
          </div>
          <h2 style={{
            color: '#fef3c7',
            fontSize: '1.65rem',
            fontWeight: 800,
            marginTop: '8px',
            marginBottom: '4px',
            textShadow: '0 2px 8px rgba(0,0,0,0.8)'
          }}>
            📜 출생 기록 증서 (Genesis Card)
          </h2>
          <p style={{ color: '#a8a29e', fontSize: '12.5px', margin: 0 }}>
            어디서, 어떤 부모 밑에서, 어떤 신분으로 태어날지는 선택할 수 없습니다.
          </p>
        </div>

        {/* Parchment Certificate Frame */}
        <div style={{
          background: 'rgba(254, 243, 199, 0.03)',
          border: '1px solid rgba(212, 175, 55, 0.25)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          {/* Main Identity Banner */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
            paddingBottom: '14px',
            marginBottom: '16px'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 600, letterSpacing: '0.5px' }}>
                서기 {cardData.birthYear}년 출생 • {cardData.age}세 청년기 진입
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
                {cardData.name} <span style={{ fontSize: '1.1rem', color: '#d4af37', fontWeight: 600 }}>{cardData.houseName}</span>
              </div>
              <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                {cardData.gender} • {cardData.culture} 문화권 • {cardData.religion}
              </div>
            </div>

            <div style={{
              background: `rgba(${cardData.status === '남작' ? '245, 158, 11' : '16, 185, 129'}, 0.15)`,
              border: `1.5px solid ${getStatusColor(cardData.status)}`,
              padding: '6px 16px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>출생 신분</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: getStatusColor(cardData.status) }}>
                {cardData.status}
              </div>
            </div>
          </div>

          {/* Grid Information */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '12px',
            fontSize: '12px',
            marginBottom: '16px'
          }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ color: '#fbbf24', fontWeight: 700, marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Compass size={13} /> 태어난 고향
              </div>
              <div style={{ color: '#f3f4f6' }}>{cardData.region}</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ color: '#fbbf24', fontWeight: 700, marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Heart size={13} /> 가문 가언(Motto)
              </div>
              <div style={{ color: '#f3f4f6', fontStyle: 'italic' }}>"{cardData.houseMotto}"</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ color: '#60a5fa', fontWeight: 700, marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Award size={13} /> 선천적 유전 특성
              </div>
              <div style={{ color: '#93c5fd', fontWeight: 600 }}>
                {cardData.congenitalTrait.icon} {cardData.congenitalTrait.name}
              </div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                {cardData.congenitalTrait.description}
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ color: '#34d399', fontWeight: 700, marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Coins size={13} /> 초기 자산 및 무구
              </div>
              <div style={{ color: '#f3f4f6' }}>
                금화 {cardData.startingGold}닢 • {cardData.startingWeapon}
              </div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                {cardData.startingItems.join(', ')}
              </div>
            </div>
          </div>

          {/* Narrative Background Story */}
          <div style={{
            background: 'rgba(20, 15, 10, 0.75)',
            borderLeft: '3px solid #d4af37',
            padding: '12px 14px',
            borderRadius: '0 8px 8px 0',
            fontSize: '12px',
            lineHeight: '1.6',
            color: '#d6d3d1'
          }}>
            <div style={{ fontSize: '10.5px', color: '#fbbf24', fontWeight: 700, marginBottom: '3px' }}>
              【 운명의 배경 】
            </div>
            {cardData.parentsDescription}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleReroll}
            disabled={isRolling}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#d6d3d1',
              fontSize: '13px',
              fontWeight: 700,
              cursor: isRolling ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >
            <Dices size={16} />
            <span>🎲 다른 운명 다시 굴리기</span>
          </button>

          <button
            onClick={() => onConfirm(cardData, gameState)}
            disabled={isRolling}
            style={{
              flex: 1.6,
              padding: '14px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #d4af37, #b8860b)',
              border: 'none',
              color: '#1a140d',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(212, 175, 55, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.1)'}
            onMouseOut={e => e.currentTarget.style.filter = 'brightness(1)'}
          >
            <Sparkles size={17} />
            <span>이 운명을 받아들이기 (인생 시작)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
