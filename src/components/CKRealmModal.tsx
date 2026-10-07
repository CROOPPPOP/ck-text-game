"use client";

import React from 'react';
import RealmDashboard from './RealmDashboard';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  factionState?: Record<string, string>;
}

export default function CKRealmModal({ isOpen, onClose, factionState }: Props) {
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
        zIndex: 1100,
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
          maxWidth: '820px',
          maxHeight: '88vh',
          overflowY: 'auto',
          borderRadius: '16px',
          border: '2px solid rgba(212, 175, 55, 0.45)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(212, 175, 55, 0.2)',
          padding: '28px',
          position: 'relative'
        }} 
        onClick={e => e.stopPropagation()}
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
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.3) 0%, rgba(15, 23, 42, 0.8) 100%)',
            border: '2px solid #38bdf8',
            fontSize: '1.8rem',
            marginBottom: '10px'
          }}>
            🏰
          </div>
          <h2 style={{ color: 'var(--gold-accent)', fontSize: '1.7rem', fontWeight: 'bold', margin: '0 0 4px 0', letterSpacing: '1px' }}>
            크루세이더 킹즈 영지 통치 대시보드
          </h2>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            국가 안정도, 치안, 민심, 군사 준비도 및 주요 통치 지표
          </div>
        </div>

        {/* Realm Dashboard Content */}
        <RealmDashboard factionState={factionState} />

      </div>
    </div>
  );
}
