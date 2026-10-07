"use client";

import React from 'react';
import { ParsedState } from '@/lib/parser';
import { parseCKResources, parseCKStress, getHeraldryEmblem } from '@/lib/ckVisuals';
import { Crown, Coins, Shield, Castle, Flame, Heart, Scroll, Users, Calendar, Sparkles } from 'lucide-react';

interface Props {
  gameState: ParsedState;
  turn: number;
  onOpenFamilyTree: () => void;
  onOpenRealm: () => void;
  onOpenCharacter: () => void;
  onOpenRelations: () => void;
  onOpenEstate: () => void;
  onOpenChronicle: () => void;
  onSave: () => void;
  onLoad: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
  onSave,
  onLoad,
  onReturnTitle
}: Props) {
  const rulerName = gameState.personalInfo?.['이름'] || '군주';
  const rulerTitle = gameState.personalInfo?.['칭호'] || gameState.personalInfo?.['직위'] || '영주';
  const culture = gameState.personalInfo?.['문화'] || '';
  const emblem = getHeraldryEmblem(rulerName, culture);
  const resources = parseCKResources(gameState);
  const stress = parseCKStress(gameState);

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
          title="클릭하여 군주 상세 인물 정보(Character Sheet) 열기"
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
          {/* 🪙 Gold */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 6px' }} title="국고 / 금화">
            <Coins size={16} style={{ color: '#fbbf24' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#fef08a' }}>
              {resources.gold}
            </span>
          </div>

          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }} />

          {/* 👑 Prestige */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 6px' }} title="위신 / 명성">
            <Crown size={16} style={{ color: '#38bdf8' }} />
            <span style={{ fontSize: '0.85rem', color: '#bae6fd' }}>
              {resources.prestige}
            </span>
          </div>

          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }} />

          {/* 🕊️ Piety / Morale */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 6px' }} title="신앙 / 경건 / 사기">
            <Sparkles size={16} style={{ color: '#a78bfa' }} />
            <span style={{ fontSize: '0.85rem', color: '#e9d5ff' }}>
              {resources.piety}
            </span>
          </div>

          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }} />

          {/* ⚔️ Army / Levies */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 6px' }} title="병력 / 징집병">
            <Shield size={16} style={{ color: '#f87171' }} />
            <span style={{ fontSize: '0.85rem', color: '#fca5a5', fontWeight: 'bold' }}>
              {resources.levies}
            </span>
          </div>

          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }} />

          {/* 🏰 Domain */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 6px' }} title="직할령 / 거점">
            <Castle size={16} style={{ color: '#34d399' }} />
            <span style={{ fontSize: '0.85rem', color: '#a7f3d0' }}>
              {resources.domain}
            </span>
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
            <button
              onClick={onSave}
              title="현재 역사 세이브 (.json)"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'var(--text-main)',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              저장
            </button>
            <label
              title="세이브 파일 불러오기"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'var(--text-main)',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              로드
              <input type="file" accept=".json" onChange={onLoad} style={{ display: 'none' }} />
            </label>
            <button
              onClick={onReturnTitle}
              title="메인 타이틀로 이동"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                padding: '5px 10px',
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

      {/* Bottom Navigation Tabs: Iconic Crusader Kings Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        marginTop: '8px',
        paddingTop: '6px',
        borderTop: '1px solid rgba(212, 175, 55, 0.15)',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={onOpenCharacter}
          className="ck-nav-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(212, 175, 55, 0.1)',
            border: '1px solid rgba(212, 175, 55, 0.4)',
            color: 'var(--gold-hover)',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Crown size={15} />
          <span>👤 군주 인물상 (Character)</span>
        </button>

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
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 0 10px rgba(16, 185, 129, 0.15)'
          }}
        >
          <Users size={15} />
          <span>👑 가문 계보도 (Family Tree)</span>
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
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Castle size={15} />
          <span>🏰 영지 통치 (Realm Order)</span>
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
            padding: '6px 14px',
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
          onClick={onOpenEstate}
          className="ck-nav-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#fcd34d',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Castle size={15} />
          <span>⛺ 거점 건설 (Holdings)</span>
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
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Scroll size={15} />
          <span>📜 연대기 (Chronicle)</span>
        </button>
      </div>
    </header>
  );
}
