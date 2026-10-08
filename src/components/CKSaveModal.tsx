"use client";

import React, { useState, useEffect } from 'react';
import { ParsedState } from '@/lib/parser';
import {
  SaveSlotData,
  listSaveSlots,
  saveToSlot,
  loadFromSlot,
  deleteSlot,
  exportSaveToFile,
  importSaveFromFile
} from '@/lib/saveManager';
import { X, Save, FolderOpen, Trash2, Download, Upload, Clock, Crown, Shield, Coins, Sparkles, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gameState: ParsedState | null;
  turn: number;
  constructionQueue?: any[];
  onLoadSuccess: (loadedData: SaveSlotData) => void;
}

export default function CKSaveModal({
  isOpen,
  onClose,
  gameState,
  turn,
  constructionQueue = [],
  onLoadSuccess
}: Props) {
  const [tab, setTab] = useState<'save' | 'load'>('load');
  const [slots, setSlots] = useState<Array<{ id: string; defaultTitle: string; data: SaveSlotData | null }>>([]);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [customTitleInput, setCustomTitleInput] = useState('');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const refreshSlots = () => {
    setSlots(listSaveSlots());
  };

  useEffect(() => {
    if (isOpen) {
      refreshSlots();
      // gameState가 있으면 기본 탭을 save로, 없으면 load로
      if (!gameState) {
        setTab('load');
      }
    }
  }, [isOpen, gameState]);

  if (!isOpen) return null;

  const showNotice = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3000);
  };

  const handleSaveToSlot = (slotId: string, customTitle?: string) => {
    if (!gameState) return;
    const ok = saveToSlot(slotId, gameState, turn, constructionQueue, customTitle);
    if (ok) {
      refreshSlots();
      setEditingTitleId(null);
      setCustomTitleInput('');
      showNotice(`[${slotId}] 슬롯에 성공적으로 저장되었습니다!`);
    } else {
      alert('저장에 실패했습니다.');
    }
  };

  const handleLoadSlot = (slotId: string) => {
    const loaded = loadFromSlot(slotId);
    if (!loaded) {
      alert('슬롯 데이터를 불러올 수 없습니다.');
      return;
    }
    if (confirm(`'${loaded.title}' (${loaded.characterName}, 턴 ${loaded.turn}) 데이터를 불러오시겠습니까?`)) {
      onLoadSuccess(loaded);
      onClose();
    }
  };

  const handleDeleteSlot = (slotId: string, title: string) => {
    if (confirm(`정말 '${title}' 슬롯을 삭제하시겠습니까? (되돌릴 수 없습니다)`)) {
      deleteSlot(slotId);
      refreshSlots();
      showNotice('슬롯이 삭제되었습니다.');
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importSaveFromFile(file);
      onLoadSuccess(data);
      onClose();
    } catch (err: any) {
      alert(err.message || '세이브 파일 파싱에 실패했습니다.');
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
          maxWidth: '850px',
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

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(212, 175, 55, 0.25)', paddingBottom: '16px' }}>
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
            📂
          </div>
          <h2 style={{ color: 'var(--gold-accent)', fontSize: '1.6rem', fontWeight: 'bold', margin: '0 0 4px 0', letterSpacing: '1px' }}>
            역사 연대기 저장 & 불러오기 관리자
          </h2>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            다중 슬롯 저장, 자동 저장 복원, 퀵 세이브 및 파일 백업
          </div>

          {/* Tab Selector */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '16px' }}>
            {gameState && (
              <button
                onClick={() => setTab('save')}
                style={{
                  padding: '8px 24px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  border: tab === 'save' ? '2px solid var(--gold-accent)' : '1px solid rgba(255,255,255,0.1)',
                  background: tab === 'save' ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.25), rgba(15, 23, 42, 0.8))' : 'rgba(0,0,0,0.3)',
                  color: tab === 'save' ? 'var(--gold-hover)' : 'var(--text-muted)'
                }}
              >
                <Save size={16} />
                <span>저장하기 (Save)</span>
              </button>
            )}

            <button
              onClick={() => setTab('load')}
              style={{
                padding: '8px 24px',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                border: tab === 'load' ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                background: tab === 'load' ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(15, 23, 42, 0.8))' : 'rgba(0,0,0,0.3)',
                color: tab === 'load' ? '#7dd3fc' : 'var(--text-muted)'
              }}
            >
              <FolderOpen size={16} />
              <span>불러오기 (Load)</span>
            </button>
          </div>
        </div>

        {/* Notice Banner */}
        {statusNotice && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid #10b981',
            borderRadius: '6px',
            padding: '8px 16px',
            color: '#6ee7b7',
            fontSize: '0.9rem',
            textAlign: 'center',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <Check size={16} />
            <span>{statusNotice}</span>
          </div>
        )}

        {/* Slots List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {slots.map((slot) => {
            const hasData = !!slot.data;
            const isEditingTitle = editingTitleId === slot.id;
            const isAutoOrQuick = slot.id === 'autosave' || slot.id === 'quicksave';

            return (
              <div
                key={slot.id}
                style={{
                  background: hasData
                    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.75), rgba(15, 23, 42, 0.85))'
                    : 'rgba(0, 0, 0, 0.25)',
                  border: hasData
                    ? '1px solid rgba(212, 175, 55, 0.3)'
                    : '1px dashed rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Left Metadata Preview */}
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: slot.id === 'autosave' ? 'rgba(56, 189, 248, 0.2)' : slot.id === 'quicksave' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(212, 175, 55, 0.15)',
                      color: slot.id === 'autosave' ? '#38bdf8' : slot.id === 'quicksave' ? '#fbbf24' : 'var(--gold-accent)',
                      fontWeight: 'bold'
                    }}>
                      {slot.id.toUpperCase()}
                    </span>

                    {/* Title */}
                    {isEditingTitle ? (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={customTitleInput}
                          onChange={(e) => setCustomTitleInput(e.target.value)}
                          placeholder="슬롯 제목 입력..."
                          style={{
                            background: '#0f172a',
                            border: '1px solid var(--gold-accent)',
                            color: '#fff',
                            borderRadius: '4px',
                            padding: '3px 8px',
                            fontSize: '0.85rem'
                          }}
                        />
                        <button
                          onClick={() => handleSaveToSlot(slot.id, customTitleInput || slot.defaultTitle)}
                          style={{
                            background: 'var(--gold-accent)',
                            color: '#000',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '3px 8px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          저장
                        </button>
                        <button
                          onClick={() => setEditingTitleId(null)}
                          style={{
                            background: 'rgba(255,255,255,0.1)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '3px 8px',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontWeight: 'bold', color: hasData ? 'var(--text-main)' : 'var(--text-muted)', fontSize: '1rem' }}>
                        {slot.data?.title || slot.defaultTitle}
                      </span>
                    )}
                  </div>

                  {/* Character & Realm Summary */}
                  {hasData && slot.data ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0' }}>
                        <Crown size={14} style={{ color: 'var(--gold-accent)' }} />
                        <strong style={{ color: '#fff' }}>{slot.data.characterName}</strong>
                        <span>({slot.data.characterTitle} &bull; {slot.data.characterStatus})</span>
                        <span style={{
                          background: 'rgba(255,255,255,0.08)',
                          color: '#bae6fd',
                          fontSize: '0.7rem',
                          padding: '1px 6px',
                          borderRadius: '3px'
                        }}>
                          {slot.data.archetypeTitle}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '14px', fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span>📍 {slot.data.dateLocation}</span>
                        <span style={{ color: 'var(--gold-hover)' }}>턴 {slot.data.turn}</span>
                        <span>🪙 {slot.data.gold}</span>
                        <span>⚔️ {slot.data.levies}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b' }}>
                          <Clock size={12} />
                          {new Date(slot.data.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      비어있는 슬롯입니다.
                    </div>
                  )}
                </div>

                {/* Right Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {tab === 'save' && gameState && (
                    <button
                      onClick={() => {
                        if (hasData) {
                          if (confirm(`'${slot.data?.title}' 슬롯에 현재 게임을 덮어쓰시겠습니까?`)) {
                            handleSaveToSlot(slot.id, slot.data?.title);
                          }
                        } else {
                          setEditingTitleId(slot.id);
                          setCustomTitleInput(slot.defaultTitle);
                        }
                      }}
                      style={{
                        background: 'linear-gradient(45deg, #b45309, #d97706)',
                        border: '1px solid var(--gold-accent)',
                        color: '#fff',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Save size={14} />
                      <span>{hasData ? '덮어쓰기' : '저장'}</span>
                    </button>
                  )}

                  {tab === 'load' && hasData && (
                    <button
                      onClick={() => handleLoadSlot(slot.id)}
                      style={{
                        background: 'linear-gradient(45deg, #0284c7, #0369a1)',
                        border: '1px solid #38bdf8',
                        color: '#fff',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <FolderOpen size={14} />
                      <span>불러오기</span>
                    </button>
                  )}

                  {hasData && (
                    <button
                      onClick={() => handleDeleteSlot(slot.id, slot.data?.title || slot.defaultTitle)}
                      title="슬롯 비우기"
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Utility Bar */}
        <div style={{
          borderTop: '1px solid rgba(212, 175, 55, 0.2)',
          paddingTop: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* File Import */}
          <label style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: 'var(--text-main)',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Upload size={14} />
            <span>외부 세이브 파일 (.json) 불러오기</span>
            <input type="file" accept=".json" onChange={handleFileImport} style={{ display: 'none' }} />
          </label>

          {/* Current Game File Export */}
          {gameState && (
            <button
              onClick={() => exportSaveToFile(gameState, turn, constructionQueue)}
              style={{
                background: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid var(--gold-accent)',
                color: 'var(--gold-hover)',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 'bold'
              }}
            >
              <Download size={14} />
              <span>현재 기록을 파일로 내보내기 (.json)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
