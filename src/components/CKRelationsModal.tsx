"use client";

import React, { useState } from 'react';
import { ParsedState } from '@/lib/parser';
import { getArchetypeDetails } from '@/lib/ckVisuals';
import { parseAllPersonalRelations, ParsedCharacterRelation } from '@/lib/characterRelations';
import { Users, Heart, Shield, Swords, Handshake, X, Crown, Scroll, UserCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gameState: ParsedState;
}

export default function CKRelationsModal({ isOpen, onClose, gameState }: Props) {
  const [activeTierFilter, setActiveTierFilter] = useState<'all' | 'superior' | 'patron' | 'peer' | 'subordinate' | 'rival'>('all');

  if (!isOpen) return null;

  const personalRels = gameState.relationships?.personal || [];
  const factionRels = gameState.relationships?.faction || [];

  const archetypeDetails = getArchetypeDetails(gameState);
  const archetype = archetypeDetails.archetype;

  // 아키타입별 맥락 맞춤형 명칭
  const config = {
    clergy: {
      title: '⛪ 교구 인물 & 신앙 관계망',
      desc: '교단 상급자, 동료 사제, 본당 후원자 및 교구 신도들과의 유대와 신뢰',
      icon: '⛪',
      section: '교단 성직자 및 교구 신도',
      subordinateName: '🛡️ 직속 보좌 / 복사 / 수사'
    },
    wanderer: {
      title: '🗡️ 방랑 인맥 & 대인 관계망',
      desc: '여정을 함께하는 동행자, 의뢰인, 은인 및 현지 인맥과의 신뢰',
      icon: '🗡️',
      section: '여정 동행자 및 현지 인맥',
      subordinateName: '🛡️ 동행 제자 / 조력자'
    },
    company: {
      title: '👥 소속 단원 & 대외 계약망',
      desc: '부대 간부, 소속 단원, 고용주 영주 및 상인들과의 계약과 신뢰',
      icon: '👥',
      section: '부대 단원 및 대외 협력자',
      subordinateName: '🛡️ 직속 부관 / 단원'
    },
    noble: {
      title: '🏰 궁정 인물 & 외교 관계망',
      desc: '군주와 궁정 신하, 봉신 및 주변 제후들과의 호감도와 외교 상태',
      icon: '🏰',
      section: '궁정 신하 및 가신단',
      subordinateName: '🛡️ 직속 가신 (Vassal)'
    }
  }[archetype] || {
    title: '대인 관계 & 외교 관계망',
    desc: '인물들과의 호감도, 신뢰도 및 세력 간 외교 상태',
    icon: '🤝',
    section: '대인 관계망',
    subordinateName: '직속 가신 / 보좌'
  };

  // SSOT 단일 진실 공급원 파서(characterRelations.ts)를 통한 인물 목록 일원화
  const parsedCharacters = parseAllPersonalRelations(personalRels, archetype).map(p => {
    const isObsessive = p.raw.includes('집착') || p.raw.includes('광애');
    const isSwornFriend = p.raw.includes('맹우');
    return {
      raw: p.raw,
      name: p.name,
      role: p.role,
      trustStr: `신뢰도 ${p.trust}`,
      affStr: `호감도 ${p.affection}`,
      descStr: p.descStr,
      trustVal: p.trust,
      affVal: p.affection,
      tier: {
        id: p.tierId,
        label: p.tierLabel,
        color: p.tierColor,
        bg: p.tierBg,
        border: p.tierBorder
      },
      vocation: p.vocation,
      vocationLabel: p.vocationLabel,
      vocationIcon: p.vocationIcon,
      isRomance: p.isRomance,
      isRival: p.isRival,
      isObsessive,
      isSwornFriend
    };
  });

  // 위계별 인원수 계산
  const tierCounts = {
    all: parsedCharacters.length,
    superior: parsedCharacters.filter(c => c?.tier.id === 'superior').length,
    patron: parsedCharacters.filter(c => c?.tier.id === 'patron').length,
    peer: parsedCharacters.filter(c => c?.tier.id === 'peer').length,
    subordinate: parsedCharacters.filter(c => c?.tier.id === 'subordinate').length,
    rival: parsedCharacters.filter(c => c?.tier.id === 'rival').length
  };

  const filteredCharacters = activeTierFilter === 'all' 
    ? parsedCharacters 
    : parsedCharacters.filter(c => c?.tier.id === activeTierFilter);

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
          maxWidth: '860px',
          maxHeight: '88vh',
          overflowY: 'auto',
          borderRadius: '16px',
          border: '2px solid rgba(212, 175, 55, 0.45)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(212, 175, 55, 0.2)',
          padding: '28px',
          position: 'relative',
          fontFamily: 'var(--font-sans, "Pretendard", sans-serif)',
          WebkitFontSmoothing: 'antialiased'
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
            background: 'radial-gradient(circle, rgba(212, 175, 55, 0.3) 0%, rgba(15, 23, 42, 0.8) 100%)',
            border: '2px solid var(--gold-accent)',
            fontSize: '1.8rem',
            marginBottom: '10px'
          }}>
            {config.icon}
          </div>
          <h2 style={{ color: 'var(--gold-accent)', fontSize: '1.7rem', fontWeight: 'bold', margin: '0 0 4px 0', letterSpacing: '1px' }}>
            {config.title}
          </h2>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {config.desc}
          </div>
        </div>

        {/* 1. Personal Relationships & Hierarchy Filtering */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '14px',
            borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
            paddingBottom: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gold-accent)', fontSize: '1.1rem', fontWeight: 'bold' }}>
              <Users size={18} />
              <span>{config.section} ({personalRels.length}명)</span>
            </div>

            {/* 5-Tier Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: `전체 (${tierCounts.all})` },
                { id: 'superior', label: `👑 상급자 (${tierCounts.superior})` },
                { id: 'patron', label: `📜 후원자·신도 (${tierCounts.patron})` },
                { id: 'peer', label: `🤝 동료 (${tierCounts.peer})` },
                { id: 'subordinate', label: `🛡️ 직속 (${tierCounts.subordinate})` },
                { id: 'rival', label: `⚔️ 적대 (${tierCounts.rival})` },
              ].map(tab => {
                const isActive = activeTierFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTierFilter(tab.id as any)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: isActive ? 'bold' : 'normal',
                      border: isActive ? '1px solid var(--gold-accent)' : '1px solid rgba(255,255,255,0.1)',
                      background: isActive ? 'rgba(212, 175, 55, 0.2)' : 'rgba(0,0,0,0.3)',
                      color: isActive ? 'var(--gold-hover)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {filteredCharacters.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '14px' }}>
              {filteredCharacters.map((c, idx) => {
                if (!c) return null;
                const borderColor = c.isRival ? '#ef4444' : c.isObsessive ? '#c084fc' : c.isSwornFriend ? '#fbbf24' : 'rgba(255, 255, 255, 0.1)';

                return (
                  <div 
                    key={idx} 
                    style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: `1px solid ${borderColor}`,
                      borderRadius: '10px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      boxShadow: c.isRival ? '0 0 12px rgba(239, 68, 68, 0.25)' : c.isObsessive ? '0 0 15px rgba(192, 132, 252, 0.2)' : 'none'
                    }}
                  >
                    {/* Character Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: c.isRival ? 'rgba(239, 68, 68, 0.2)' : c.isRomance ? 'rgba(244, 63, 94, 0.2)' : c.tier.bg,
                          border: `1px solid ${c.isRival ? '#ef4444' : c.isRomance ? '#f43f5e' : c.tier.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem',
                          flexShrink: 0
                        }}>
                          {c.isRival ? '⚔️' : c.isRomance ? '❤️' : c.tier.id === 'superior' ? '👑' : c.tier.id === 'patron' ? (c.vocation === 'merchant' ? '🪙' : '📜') : c.tier.id === 'subordinate' ? (c.vocation === 'military' ? '🛡️' : '🕊️') : c.isSwornFriend ? '🛡️' : '👤'}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 'bold', color: c.isRival ? '#fca5a5' : 'var(--gold-accent)', fontSize: '1.05rem' }}>
                              {c.name}
                            </span>
                            {c.role && (
                              <span style={{ fontSize: '0.72rem', background: 'rgba(56, 189, 248, 0.15)', color: '#7dd3fc', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '1px 6px', borderRadius: '4px' }}>
                                {c.role}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: c.isRival ? '#fca5a5' : 'var(--text-muted)', marginTop: '2px' }}>
                            {c.descStr}
                          </div>
                        </div>
                      </div>

                      {/* Badges: Relation Tier & Status */}
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          color: c.tier.color,
                          background: c.tier.bg,
                          border: `1px solid ${c.tier.border}`,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap'
                        }}>
                          {c.tier.label}
                        </span>

                        {c.isRomance && (
                          <span style={{ fontSize: '0.72rem', color: '#fda4af', background: 'rgba(244, 63, 94, 0.2)', padding: '2px 6px', borderRadius: '4px', border: '1px solid #f43f5e', whiteSpace: 'nowrap' }}>
                            {c.descStr.includes('연인') || c.affVal >= 80 ? '💖 연인 / 정인' : '💗 로맨스 / 연정'}
                          </span>
                        )}
                        {(c.descStr.includes('밀회') || c.descStr.includes('은밀한 연인') || c.descStr.includes('내통') || c.descStr.includes('사생아') || c.descStr.includes('혈통')) && (
                          <span style={{ fontSize: '0.72rem', color: '#f43f5e', background: 'rgba(244, 63, 94, 0.25)', padding: '2px 6px', borderRadius: '4px', border: '1px solid #f43f5e', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                            🤫 밀회 / 혈통 공모
                          </span>
                        )}
                        {c.isObsessive && (
                          <span style={{ fontSize: '0.72rem', color: '#c084fc', background: 'rgba(192, 132, 252, 0.2)', padding: '2px 6px', borderRadius: '4px', border: '1px solid #c084fc', whiteSpace: 'nowrap' }}>
                            광애 / 집착
                          </span>
                        )}
                        {c.isSwornFriend && (
                          <span style={{ fontSize: '0.72rem', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.2)', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fbbf24', whiteSpace: 'nowrap' }}>
                            맹우
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Opinion Gauges */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: '6px' }}>
                      {/* Trust Gauge */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#7dd3fc', marginBottom: '2px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Handshake size={12} />
                            <span>{c.trustStr.replace(/\d+/, '').replace('-', '').trim() || '신뢰도'}</span>
                          </span>
                          <span style={{ fontWeight: 'bold' }}>{c.trustVal}%</span>
                        </div>
                        <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${c.trustVal}%`, height: '100%', background: 'linear-gradient(90deg, #0284c7, #38bdf8)' }} />
                        </div>
                      </div>

                      {/* Affection Gauge */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: c.isRival ? '#fca5a5' : c.isRomance ? '#fda4af' : '#fef08a', marginBottom: '2px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Heart size={12} />
                            <span>{c.affStr.replace(/\d+/, '').replace('-', '').trim() || (c.isRival ? '적대도' : c.isRomance ? '애정도' : '우정도')}</span>
                          </span>
                          <span style={{ fontWeight: 'bold' }}>{c.affVal}%</span>
                        </div>
                        <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${c.affVal}%`, height: '100%', background: c.isRival ? 'linear-gradient(90deg, #7f1d1d, #dc2626)' : c.isRomance ? 'linear-gradient(90deg, #e11d48, #f43f5e)' : 'linear-gradient(90deg, #d97706, #fbbf24)' }} />
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              해당 분류에 속한 인물이 없습니다.
            </div>
          )}
        </div>

        {/* 2. Faction Diplomacy */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--gold-accent)',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            marginBottom: '14px',
            borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
            paddingBottom: '8px'
          }}>
            <Shield size={18} />
            <span>세력 간 외교 상태 (Faction Diplomacy)</span>
          </div>

          {factionRels.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              {factionRels.map((rel, idx) => {
                const match = rel.match(/^(.*?)\s+-\s+(.*)$/);
                const name = match ? match[1].replace(/^[○•\s]+/, '').trim() : rel;
                const rest = match ? match[2].trim() : '미상';
                const pipeParts = rest.split('|').map(p => p.trim());
                const status = pipeParts[0];
                let threat = '';
                let attitude = '';
                pipeParts.slice(1).forEach(p => {
                  if (p.startsWith('위협도:')) threat = p.replace('위협도:', '').trim();
                  if (p.startsWith('태도:')) attitude = p.replace('태도:', '').trim();
                });

                const isAllied = status.includes('동맹') || status.includes('우호');
                const isHostile = status.includes('적대') || status.includes('교전') || status.includes('전쟁') || status.includes('파문');
                const isVassal = status.includes('주종') || status.includes('봉신') || status.includes('주군');

                const statusColor = isAllied ? '#38bdf8' : isHostile ? '#ef4444' : isVassal ? '#c084fc' : '#fbbf24';
                const statusBg = isAllied ? 'rgba(56, 189, 248, 0.15)' : isHostile ? 'rgba(239, 68, 68, 0.15)' : isVassal ? 'rgba(192, 132, 252, 0.15)' : 'rgba(251, 191, 36, 0.15)';

                return (
                  <div 
                    key={idx}
                    style={{
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: `1px solid ${statusColor}44`,
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isHostile ? <Swords size={16} color="#ef4444" /> : <Shield size={16} color={statusColor} />}
                        <span style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.95rem' }}>{name}</span>
                      </div>
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        color: statusColor,
                        background: statusBg,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: `1px solid ${statusColor}`
                      }}>
                        {status}
                      </span>
                    </div>

                    {(threat || attitude) && (
                      <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem' }}>
                        {threat && (
                          <span style={{ color: threat.includes('위험') || threat.includes('치명') ? '#f87171' : threat.includes('안전') ? '#4ade80' : '#fbbf24', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '3px' }}>
                            ⚠️ 위협: {threat}
                          </span>
                        )}
                        {attitude && (
                          <span style={{ color: attitude.includes('우호') ? '#38bdf8' : attitude.includes('적대') ? '#f87171' : '#e2e8f0', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '3px' }}>
                            👁️ 태도: {attitude}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              기록된 세력 외교 관계가 없습니다.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
