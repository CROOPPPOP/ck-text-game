"use client";

import React from 'react';
import { ParsedState } from '@/lib/parser';
import { parseCKResources, parseCKStress, getHeraldryEmblem } from '@/lib/ckVisuals';
import { Crown, Coins, Shield, Castle, Flame, Heart, Scroll, Users, Calendar, Sparkles, Settings, Save, RotateCcw, Zap } from 'lucide-react';

interface Props {
  gameState: ParsedState;
  turn: number;
  onOpenFamilyTree: () => void;
  onOpenRealm: () => void;
  onOpenCharacter: () => void;
  onOpenRelations: () => void;
  onOpenEstate: () => void;
  onOpenChronicle: () => void;
  onOpenSave: () => void;
  onOpenSettings: () => void;
  onQuickSave?: () => void;
  onUndoTurn?: () => void;
  canUndo?: boolean;
  onReturnTitle: () => void;
}

export default function CKTopHud({
  gameState,
  turn,
  onOpenFamilyTree,
  onOpenRealm,
  onOpenCharacter,
  onOpenRelations,
  onOpenEstate,
  onOpenChronicle,
  onOpenSave,
  onOpenSettings,
  onQuickSave,
  onUndoTurn,
  canUndo = false,
  onReturnTitle
}: Props) {
  const rulerName = gameState.personalInfo?.['이름'] || '군주';
  const rulerTitle = gameState.personalInfo?.['칭호'] || gameState.personalInfo?.['직위'] || '영주';
  const culture = gameState.personalInfo?.['문화'] || '';
  const resources = parseCKResources(gameState);
  const stress = parseCKStress(gameState);
  const emblem = getHeraldryEmblem(rulerName, culture, resources.archetype);

  const rawDate = gameState.dateLocation || '';
  const cleanDate = rawDate.replace(/\[턴 수:.*\]/, '').trim() || '서기 1066년';

  return (
    <header style={{
      background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 15, 29, 0.95) 100%)',
      borderBottom: '2px solid rgba(212, 175, 55, 0.4)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6), inset 0 -1px 0 rgba(212, 175, 55, 0.2)',
      padding: '8px 16px',
      position: 'relative',
      zIndex: 50,
      fontFamily: 'var(--font-serif, "Noto Serif KR", serif)'
    }}>
      {/* Top Main Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        
        {/* Left: Ruler Heraldry & Identity */}
        <div 
          onClick={onOpenCharacter}
          title="클릭하여 상세 인물 정보(Character Sheet) 열기"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            padding: '4px 10px',
            borderRadius: '8px',
            background: 'rgba(212, 175, 55, 0.08)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--gold-accent)';
            e.currentTarget.style.boxShadow = '0 0 12px rgba(212, 175, 55, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {/* Heraldry Shield */}
          <div style={{
            width: '42px',
            height: '46px',
            background: emblem.bg,
            border: `2px solid ${emblem.border}`,
            borderRadius: '4px 4px 18px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
            flexShrink: 0
          }}>
            {emblem.icon}
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              color: 'var(--gold-accent)',
              fontWeight: 'bold',
              letterSpacing: '0.5px'
            }}>
              <Crown size={14} style={{ color: 'var(--gold-accent)' }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {rulerTitle}
              </span>
              <span style={{
                fontSize: '0.7rem',
                padding: '1px 6px',
                borderRadius: '3px',
                background: 'rgba(212, 175, 55, 0.2)',
                color: 'var(--gold-hover)',
                fontWeight: 'normal'
              }}>
                {resources.archetypeTitle}
              </span>
            </div>
            <div style={{
              fontSize: '1.05rem',
              fontWeight: 'bold',
              color: 'var(--text-main)',
              letterSpacing: '0.5px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '180px'
            }}>
              {rulerName}
            </div>
          </div>
        </div>

        {/* Center: CK3 Resource Ribbon */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          background: 'rgba(0, 0, 0, 0.4)',
          padding: '6px 14px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {/* 🪙 Gold / Funds */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 6px' }} title={resources.labels.goldLabel}>
            <Coins size={16} style={{ color: '#fbbf24' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{resources.labels.goldLabel}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fef08a' }}>
                {resources.gold}
              </span>
            </div>
          </div>

          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }} />

          {/* 👑 Prestige / Standing */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 6px' }} title={resources.labels.prestigeLabel}>
            <Crown size={16} style={{ color: '#38bdf8' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{resources.labels.prestigeLabel}</span>
              <span style={{ fontSize: '0.85rem', color: '#bae6fd' }}>
                {resources.prestige}
              </span>
            </div>
          </div>

          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }} />

          {/* 🕊️ Piety / Morale */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 6px' }} title={resources.labels.pietyLabel}>
            <Sparkles size={16} style={{ color: '#a78bfa' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{resources.labels.pietyLabel}</span>
              <span style={{ fontSize: '0.85rem', color: '#e9d5ff' }}>
                {resources.piety}
              </span>
            </div>
          </div>

          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }} />

          {/* ⚔️ Army / Levies / Companions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 6px' }} title={resources.labels.leviesLabel}>
            <Shield size={16} style={{ color: '#f87171' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{resources.labels.leviesLabel}</span>
              <span style={{ fontSize: '0.85rem', color: '#fca5a5', fontWeight: 'bold' }}>
                {resources.levies}
              </span>
            </div>
          </div>

          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }} />

          {/* 🏰 Domain / Holdings / Camp */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 6px' }} title={resources.labels.domainLabel}>
            <Castle size={16} style={{ color: '#34d399' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{resources.labels.domainLabel}</span>
              <span style={{ fontSize: '0.85rem', color: '#a7f3d0' }}>
                {resources.domain}
              </span>
            </div>
          </div>

          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }} />

          {/* 💢 Stress 3-Tier Bar */}
          <div 
            title={`스트레스: ${stress.value}/100 (${stress.tierLabel})\n${stress.breakdownRisk}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 6px',
              cursor: 'help'
            }}
          >
            <Flame size={16} style={{ color: stress.color }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: stress.color, fontWeight: 'bold' }}>
                <span>스트레스 {stress.tier > 0 ? `Lv.${stress.tier}` : '안정'}</span>
                <span>{stress.value}/100</span>
              </div>
              <div style={{
                width: '64px',
                height: '6px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${stress.value}%`,
                  height: '100%',
                  background: stress.color,
                  boxShadow: `0 0 6px ${stress.color}`
                }} />
              </div>
            </div>
          </div>

        </div>

        {/* Right: Medieval Date & Turn Ribbon */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(15, 23, 42, 0.6))',
            border: '1px solid var(--gold-accent)',
            borderRadius: '6px',
            padding: '5px 12px',
            boxShadow: '0 0 10px rgba(212, 175, 55, 0.15)'
          }}>
            <Calendar size={14} style={{ color: 'var(--gold-accent)' }} />
            <span style={{
              color: 'var(--gold-hover)',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              whiteSpace: 'nowrap'
            }}>
              {cleanDate}
            </span>
            <span style={{
              background: 'var(--gold-accent)',
              color: '#0f172a',
              fontWeight: 'bold',
              fontSize: '0.75rem',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>
              TURN {turn}
            </span>
          </div>

          {/* Quick Action Menus */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Quick Save */}
            {onQuickSave && (
              <button
                onClick={onQuickSave}
                title="단축키 [Q] - 즉시 퀵세이브"
                style={{
                  background: 'rgba(251, 191, 36, 0.15)',
                  border: '1px solid rgba(251, 191, 36, 0.4)',
                  color: '#fbbf24',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 'bold'
                }}
              >
                <Zap size={13} />
                <span>퀵세이브</span>
              </button>
            )}

            {/* Undo Turn */}
            {canUndo && onUndoTurn && (
              <button
                onClick={() => {
                  if (confirm('직전 턴 상태로 게임을 되돌리시겠습니까?')) {
                    onUndoTurn();
                  }
                }}
                title="단축키 [Z] - 직전 턴 되돌리기"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#fca5a5',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RotateCcw size={13} />
                <span>되돌리기</span>
              </button>
            )}

            {/* Save Manager Button */}
            <button
              onClick={onOpenSave}
              title="다중 슬롯 세이브 & 로드 매니저 열기"
              style={{
                background: 'linear-gradient(45deg, rgba(212, 175, 55, 0.2), rgba(15, 23, 42, 0.8))',
                border: '1px solid var(--gold-accent)',
                color: 'var(--gold-hover)',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Save size={13} />
              <span>저장/로드</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              title="글자 크기, 텍스트 속도, 단축키 설정"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'var(--text-main)',
                padding: '5px 8px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Settings size={13} />
              <span>설정</span>
            </button>

            {/* Return to Title */}
            <button
              onClick={onReturnTitle}
              title="메인 타이틀로 이동"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                padding: '5px 8px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              타이틀
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Navigation Tabs: Clean & Distinct Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        marginTop: '8px',
        paddingTop: '6px',
        borderTop: '1px solid rgba(212, 175, 55, 0.15)',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={onOpenFamilyTree}
          className="ck-nav-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(15, 23, 42, 0.6))',
            border: '1px solid rgba(16, 185, 129, 0.5)',
            color: '#6ee7b7',
            padding: '7px 16px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 0 10px rgba(16, 185, 129, 0.15)'
          }}
        >
          <Users size={15} />
          <span>{resources.archetype === 'clergy' ? '⛪ 교단 계보도 (Religious Tree)' : resources.archetype === 'company' ? '👥 단원 지휘부 (Company Tree)' : resources.archetype === 'wanderer' ? '🗡️ 동료 계보 (Companions)' : '👑 가문 계보도 (Family Tree)'}</span>
        </button>

        <button
          onClick={onOpenRealm}
          className="ck-nav-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            color: '#7dd3fc',
            padding: '7px 16px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Castle size={15} />
          <span>{resources.archetype === 'clergy' ? '⛪ 교구 현황 (Parish Order)' : resources.archetype === 'company' ? '⛺ 부대 본진 (Camp Order)' : resources.archetype === 'wanderer' ? '🏕️ 방랑 거점 (Camp Order)' : '🏰 영지 통치 (Realm Order)'}</span>
        </button>

        <button
          onClick={onOpenEstate}
          className="ck-nav-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#fcd34d',
            padding: '7px 16px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Castle size={15} />
          <span>⛺ 거점 시설 및 건설 (Holdings)</span>
        </button>

        <button
          onClick={onOpenRelations}
          className="ck-nav-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            color: '#fda4af',
            padding: '7px 16px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Heart size={15} />
          <span>🤝 궁정 외교 (Court & Relations)</span>
        </button>

        <button
          onClick={onOpenChronicle}
          className="ck-nav-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(168, 85, 247, 0.12)',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            color: '#d8b4fe',
            padding: '7px 16px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Scroll size={15} />
          <span>📜 연대기 & 국면 (Chronicle)</span>
        </button>
      </div>
    </header>
  );
}
