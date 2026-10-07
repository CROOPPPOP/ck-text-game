"use client";

import React, { useState, useEffect } from 'react';
import { UserUXSettings, loadUXSettings, saveUXSettings, hasUndoState } from '@/lib/saveManager';
import { X, Settings, Type, Zap, Keyboard, RotateCcw, Copy, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  narrativeText?: string;
  onUndoTurn?: () => void;
  onSettingsChange?: (newSettings: UserUXSettings) => void;
}

export default function CKSettingsModal({
  isOpen,
  onClose,
  narrativeText,
  onUndoTurn,
  onSettingsChange
}: Props) {
  const [settings, setSettings] = useState<UserUXSettings>(loadUXSettings());
  const [copySuccess, setCopySuccess] = useState(false);
  const [canUndo, setCanUndo] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(loadUXSettings());
      setCanUndo(hasUndoState());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdate = (patch: Partial<UserUXSettings>) => {
    const updated = saveUXSettings(patch);
    setSettings(updated);
    if (onSettingsChange) onSettingsChange(updated);
  };

  const handleCopyNarrative = async () => {
    if (!narrativeText) return;
    try {
      await navigator.clipboard.writeText(narrativeText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      alert('클립보드 복사에 실패했습니다.');
    }
  };

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
          maxWidth: '620px',
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
            cursor: 'pointer'
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
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212, 175, 55, 0.3) 0%, rgba(15, 23, 42, 0.8) 100%)',
            border: '2px solid var(--gold-accent)',
            fontSize: '1.6rem',
            marginBottom: '8px'
          }}>
            ⚙️
          </div>
          <h2 style={{ color: 'var(--gold-accent)', fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 4px 0', letterSpacing: '1px' }}>
            게임 환경 및 편의 기능 (UX) 설정
          </h2>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            가독성, 텍스트 출력 속도, 단축키 및 편의 제어
          </div>
        </div>

        {/* Settings List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* 1. Font Size Control */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gold-accent)', fontWeight: 'bold', marginBottom: '10px', fontSize: '0.95rem' }}>
              <Type size={18} />
              <span>서사 텍스트 글자 크기 (Font Size)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {(['sm', 'md', 'lg', 'xl'] as const).map((size) => {
                const isSelected = settings.fontSize === size;
                const labels: Record<string, string> = { sm: '작게 (14px)', md: '보통 (16px)', lg: '크게 (18px)', xl: '특대 (20px)' };
                return (
                  <button
                    key={size}
                    onClick={() => handleUpdate({ fontSize: size })}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '6px',
                      border: isSelected ? '2px solid var(--gold-accent)' : '1px solid rgba(255,255,255,0.1)',
                      background: isSelected ? 'rgba(212, 175, 55, 0.2)' : 'rgba(0,0,0,0.2)',
                      color: isSelected ? 'var(--gold-hover)' : 'var(--text-muted)',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    {labels[size]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Typewriter Speed Control */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 'bold', marginBottom: '10px', fontSize: '0.95rem' }}>
              <Zap size={18} />
              <span>텍스트 타이핑 출력 속도 (Typing Speed)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {[
                { speed: 0, label: '⚡ 즉시 출력' },
                { speed: 8, label: '🚀 빠름' },
                { speed: 20, label: '📝 보통' },
                { speed: 35, label: '⏳ 천천히' }
              ].map((item) => {
                const isSelected = settings.typewriterSpeed === item.speed;
                return (
                  <button
                    key={item.speed}
                    onClick={() => handleUpdate({ typewriterSpeed: item.speed })}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '6px',
                      border: isSelected ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                      background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(0,0,0,0.2)',
                      color: isSelected ? '#7dd3fc' : 'var(--text-muted)',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Keyboard Shortcuts */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 'bold', fontSize: '0.95rem' }}>
                <Keyboard size={18} />
                <span>키보드 단축키 지원 (Keyboard Controls)</span>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem', color: '#fff' }}>
                <input
                  type="checkbox"
                  checked={settings.shortcutsEnabled}
                  onChange={(e) => handleUpdate({ shortcutsEnabled: e.target.checked })}
                />
                <span>활성화</span>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px 10px', borderRadius: '4px' }}>
                <strong style={{ color: '#fff' }}>[1] ~ [4] 키 :</strong> 선택지 번호 즉시 선택
              </div>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px 10px', borderRadius: '4px' }}>
                <strong style={{ color: '#fff' }}>[Q] 키 :</strong> 즉시 퀵세이브 실행
              </div>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px 10px', borderRadius: '4px' }}>
                <strong style={{ color: '#fff' }}>[Z] 키 :</strong> 직전 턴 되돌리기 (Undo)
              </div>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px 10px', borderRadius: '4px' }}>
                <strong style={{ color: '#fff' }}>[ESC] 키 :</strong> 열려있는 모달창 닫기
              </div>
            </div>
          </div>

          {/* 4. Action Shortcuts */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ color: 'var(--text-main)', fontWeight: 'bold', fontSize: '0.9rem' }}>
              ⚡ 턴 편의 액션
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {/* Copy Narrative */}
              {narrativeText && (
                <button
                  onClick={handleCopyNarrative}
                  style={{
                    flex: 1,
                    minWidth: '180px',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    background: copySuccess ? 'rgba(16, 185, 129, 0.25)' : 'rgba(212, 175, 55, 0.1)',
                    color: copySuccess ? '#6ee7b7' : 'var(--gold-hover)',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copySuccess ? '서사 텍스트 복사됨!' : '현재 서사 클립보드 복사'}</span>
                </button>
              )}

              {/* Undo Turn */}
              {onUndoTurn && (
                <button
                  onClick={() => {
                    if (confirm('직전 턴 상태로 게임을 되돌리시겠습니까?')) {
                      onUndoTurn();
                      onClose();
                    }
                  }}
                  disabled={!canUndo}
                  style={{
                    flex: 1,
                    minWidth: '180px',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: canUndo ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255,255,255,0.1)',
                    background: canUndo ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0,0,0,0.2)',
                    color: canUndo ? '#fca5a5' : 'var(--text-muted)',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    cursor: canUndo ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <RotateCcw size={16} />
                  <span>이전 턴 되돌리기 (Undo)</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
