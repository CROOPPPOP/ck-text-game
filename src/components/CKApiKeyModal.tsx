"use client";

import React, { useState, useEffect } from 'react';
import { clearGeminiApiKey, getGeminiApiKey, setGeminiApiKey } from '@/lib/apiKeyStorage';
import { X, Key, Check, ShieldCheck, Sparkles, ExternalLink, Trash2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved?: (hasKey: boolean, key?: string) => void;
}

export default function CKApiKeyModal({ isOpen, onClose, onKeySaved }: Props) {
  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const stored = getGeminiApiKey();
      setSavedKey(stored);
      setApiKey(stored);
      setStatus('idle');
      setMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      if (typeof window !== 'undefined') {
        clearGeminiApiKey();
      }
      setSavedKey('');
      setStatus('idle');
      setMessage('API 키가 제거되었습니다. 로컬 결정론적 룰 엔진으로 작동합니다.');
      if (onKeySaved) onKeySaved(false, '');
      return;
    }

    if (typeof window !== 'undefined') {
      if (!setGeminiApiKey(trimmed)) {
        setStatus('error');
        setMessage('브라우저 세션 저장소를 사용할 수 없습니다. 설정을 확인한 뒤 다시 시도해주세요.');
        return;
      }
    }
    setSavedKey(trimmed);
    setStatus('success');
    setMessage('Gemini API 키를 이 탭의 세션에 저장했습니다. AI 요청 시 앱 서버를 거쳐 Google Gemini로 전달됩니다. 탭을 닫으면 세션 키가 삭제됩니다.');
    if (onKeySaved) onKeySaved(true, trimmed);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleRemove = () => {
    if (typeof window !== 'undefined') {
      clearGeminiApiKey();
    }
    setSavedKey('');
    setApiKey('');
    setStatus('idle');
    setMessage('API 키가 삭제되었습니다.');
    if (onKeySaved) onKeySaved(false);
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
        zIndex: 1300,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, rgba(28, 22, 17, 0.98), rgba(16, 12, 9, 0.98))',
          width: '94%',
          maxWidth: '560px',
          borderRadius: '16px',
          border: '2px solid rgba(212, 175, 55, 0.45)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(212, 175, 55, 0.25)',
          padding: '28px',
          position: 'relative',
          color: '#f5ecd8'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={22} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            background: 'rgba(212, 175, 55, 0.2)',
            padding: '8px',
            borderRadius: '10px',
            border: '1px solid var(--gold-accent)'
          }}>
            <Key size={22} style={{ color: 'var(--gold-accent)' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--gold-accent)', fontWeight: 'bold' }}>
              🔑 Gemini API 키 설정 (AI 역사·인물 서관)
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              AI 역사 서신, 인물 알현 대화, 전투 상보를 실시간으로 보조받습니다.
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: savedKey ? 'rgba(34, 197, 94, 0.12)' : 'rgba(255, 255, 255, 0.05)',
          border: savedKey ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '10px 14px',
          marginBottom: '16px',
          fontSize: '0.82rem'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} style={{ color: savedKey ? '#4ade80' : 'var(--text-muted)' }} />
            <span>상태: <strong>{savedKey ? '✨ AI 역사 서관 활성화됨' : '⚪ 로컬 규칙 엔진 작동 (API 키 없음)'}</strong></span>
          </span>
          {savedKey && (
            <button
              onClick={handleRemove}
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#fca5a5',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Trash2 size={12} />
              <span>키 삭제</span>
            </button>
          )}
        </div>

        {/* Input */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--gold-dim)', marginBottom: '6px', fontWeight: 'bold' }}>
            Google Gemini API Key
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              style={{
                flex: 1,
                background: 'rgba(0, 0, 0, 0.45)',
                border: '1px solid rgba(200, 159, 60, 0.35)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#fff',
                fontSize: '0.9rem',
                fontFamily: 'monospace'
              }}
            />
            <button
              onClick={() => setShowKey(!showKey)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'var(--text-main)',
                padding: '0 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              {showKey ? '숨기기' : '보기'}
            </button>
          </div>
        </div>

        {message && (
          <div style={{
            fontSize: '0.8rem',
            padding: '8px 12px',
            borderRadius: '6px',
            marginBottom: '14px',
            background: status === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(251, 191, 36, 0.15)',
            color: status === 'success' ? '#86efac' : '#fde047',
            border: status === 'success' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(251, 191, 36, 0.3)'
          }}>
            {message}
          </div>
        )}

        {/* Info Box */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px dashed rgba(200, 159, 60, 0.25)',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '0.75rem',
          lineHeight: '1.5',
          color: 'var(--text-muted)',
          marginBottom: '20px'
        }}>
          💡 <strong>안내사항</strong>:
          <br />• API 키는 이 브라우저 탭의 세션 저장소에 보관되며 탭을 닫으면 삭제됩니다. API 요청 시 앱 서버를 거쳐 Google Gemini로 전달됩니다.
          <br />• 동일 출처에서 실행되는 스크립트는 세션 키에 접근할 수 있습니다. 개인 API 키를 사용하고 Google 쪽에서 사용량과 제한을 설정해주세요.
          <br />• 키가 없어도 맵 조작, 군사 이동, 전투 계산, 영지 경영 등 모든 핵심 게임플레이는 100% 정상 작동합니다.
          <div style={{ marginTop: '6px' }}>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--gold-accent)', display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'underline' }}
            >
              <span>Google AI Studio에서 무료 API Key 발급받기</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            닫기
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: '1px solid var(--gold-accent)',
              background: 'linear-gradient(180deg, #c89f3c, #967425)',
              color: '#1a130c',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Check size={16} />
            <span>저장 및 적용</span>
          </button>
        </div>
      </div>
    </div>
  );
}
