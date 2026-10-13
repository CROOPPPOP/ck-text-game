"use client";

import React, { useState } from 'react';
import { Province, CouncilTask, CouncilRole } from '@/lib/engine/mapData';
import { Army } from '@/lib/engine/militaryEngine';
import { 
  Castle, Shield, Swords, Coins, Crown, Users, MapPin, 
  Sparkles, MessageSquare, Scroll, AlertTriangle, Hammer, X, Check, ArrowRight,
  Flame, Cross, Feather, UserCheck, HeartHandshake, Eye, Skull
} from 'lucide-react';
import { requestDiplomaticLetter } from '@/lib/engine/aiChronicler';

interface Props {
  province: Province | null;
  onClose: () => void;
  playerRulerName: string;
  playerRealmName: string;
  onRaiseLevies: (province: Province) => void;
  onOpenConstruction: () => void;
  onOpenCharacterDialogue: (character: {
    id: string;
    name: string;
    title: string;
    realm: string;
    role: string;
    culture?: string;
    religion?: string;
    opinion: number;
    traits?: string[];
  }) => void;
  onDeclareWar?: (targetProvince: Province, letterText: string) => void;
  onAssignCouncilTask?: (provinceId: string, task: CouncilTask) => void;
  onSignPeaceTreaty?: (targetProvince: Province, terms: 'conquest' | 'reparations' | 'white_peace' | 'surrender') => void;
  isAtWar?: boolean;
  warScore?: number;
  apiKey?: string;
}

export default function CKProvinceInspector({
  province,
  onClose,
  playerRulerName,
  playerRealmName,
  onRaiseLevies,
  onOpenConstruction,
  onOpenCharacterDialogue,
  onDeclareWar,
  onAssignCouncilTask,
  onSignPeaceTreaty,
  isAtWar = false,
  warScore = 0,
  apiKey
}: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'council' | 'intrigue'>('overview');
  const [isSendingLetter, setIsSendingLetter] = useState(false);
  const [diplomaticLetter, setDiplomaticLetter] = useState<string | null>(null);
  const [showPeaceModal, setShowPeaceModal] = useState(false);

  if (!province) return null;

  const isPlayer = province.isPlayerControlled;

  // 외교 서한(선전포고문 또는 친선 서한) 생성
  const handleGenerateDiplomacy = async (actionType: 'war' | 'friendship') => {
    setIsSendingLetter(true);
    try {
      const letter = await requestDiplomaticLetter({
        sender: playerRulerName,
        senderRealm: playerRealmName,
        recipient: province.rulerName,
        recipientRealm: province.realmName,
        actionName: actionType === 'war' ? '선전포고 및 영지 반환 요구' : '우호 친선 조약 체결 제안',
        actionDesc: actionType === 'war' 
          ? `${province.name} 영지에 대한 역사적 명분을 주장하며 진군을 통보함` 
          : `상호 불가침과 국경 무역 증진을 제안함`,
        casusBelli: actionType === 'war' ? '선대 영주의 상속권 및 고문서 상의 정당한 영유권' : undefined,
        dateLocation: `${province.name} 궁정 귀하`
      }, apiKey);

      setDiplomaticLetter(letter);

      if (actionType === 'war' && onDeclareWar) {
        onDeclareWar(province, letter);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingLetter(false);
    }
  };

  // 자문회 직무 파견 핸들러
  const handleTaskAssign = (role: CouncilRole, title: string, months: number) => {
    if (onAssignCouncilTask) {
      onAssignCouncilTask(province.id, {
        role,
        title,
        targetProvinceId: province.id,
        progressMonths: 0,
        totalMonths: months
      });
    }
  };

  return (
    <div style={{
      width: '340px',
      maxHeight: '100%',
      height: '100%',
      background: 'linear-gradient(175deg, rgba(24, 18, 14, 0.98), rgba(14, 10, 8, 0.98))',
      border: '1.5px solid rgba(200, 159, 60, 0.45)',
      borderRadius: '14px',
      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.85), 0 0 20px rgba(200, 159, 60, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: 'var(--font-sans, "Pretendard", sans-serif)',
      zIndex: 40
    }}>
      {/* 1. 패널 헤더 */}
      <div style={{
        padding: '12px 16px',
        background: 'rgba(0, 0, 0, 0.55)',
        borderBottom: '1px solid rgba(200, 159, 60, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Castle size={18} color="#f59e0b" />
          <span style={{ fontSize: '15px', fontWeight: 800, color: '#fef3c7' }}>
            {province.name}
          </span>
          {isPlayer ? (
            <span style={{
              fontSize: '10px',
              padding: '1px 6px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.25)',
              border: '1px solid #3b82f6',
              color: '#93c5fd',
              fontWeight: 700
            }}>
              직할령
            </span>
          ) : isAtWar ? (
            <span style={{
              fontSize: '10px',
              padding: '1px 6px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.3)',
              border: '1px solid #ef4444',
              color: '#fca5a5',
              fontWeight: 700
            }}>
              교전 중 (승점: {warScore > 0 ? `+${warScore}` : warScore}%)
            </span>
          ) : null}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#a8a29e',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* 2. 서브 탭 (개요 / 자문회 파견 / 첩보 및 음모) */}
      <div style={{
        display: 'flex',
        background: 'rgba(0, 0, 0, 0.3)',
        borderBottom: '1px solid rgba(200, 159, 60, 0.2)',
        padding: '4px 8px',
        gap: '4px'
      }}>
        {[
          { id: 'overview', label: '영지 개요' },
          { id: 'council', label: '자문회 직무' },
          { id: 'intrigue', label: '첩보·외교' }
        ].map(t => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                flex: 1,
                padding: '6px 4px',
                borderRadius: '6px',
                background: isActive ? 'rgba(200, 159, 60, 0.2)' : 'transparent',
                border: isActive ? '1px solid rgba(200, 159, 60, 0.4)' : '1px solid transparent',
                color: isActive ? '#fef3c7' : '#9ca3af',
                fontSize: '11px',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 3. 탭별 메인 컨텐츠 영역 */}
      <div style={{ flex: 1, padding: '14px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* ================= TAB 1: 개요 (Overview) ================= */}
        {activeTab === 'overview' && (
          <>
            {/* 기본 영지 개요 */}
            <div style={{
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(200, 159, 60, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '11.5px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#a8a29e' }}>수도 요새</span>
                <strong style={{ color: '#f5f5f4' }}>{province.capital}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#a8a29e' }}>소속 세력</span>
                <strong style={{ color: '#f5f5f4' }}>{province.realmName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#a8a29e' }}>지형 / 문화</span>
                <span style={{ color: '#38bdf8' }}>{province.terrain} · {province.culture}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#a8a29e' }}>신앙 (종교)</span>
                <span style={{ color: '#c084fc' }}>{province.religion}</span>
              </div>
            </div>

            {/* 영지 수치 현황 그리드 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px'
            }}>
              <div style={{
                padding: '8px 10px',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ fontSize: '10px', color: '#a8a29e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Coins size={12} color="#f59e0b" /> 월간 조세
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#fef08a', marginTop: '2px' }}>
                  +{province.monthlyIncome.toFixed(1)} <span style={{ fontSize: '9.5px', fontWeight: 400 }}>금화</span>
                </div>
              </div>

              <div style={{
                padding: '8px 10px',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ fontSize: '10px', color: '#a8a29e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Swords size={12} color="#3b82f6" /> 가용 징집병
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#93c5fd', marginTop: '2px' }}>
                  {province.currentLevies} <span style={{ fontSize: '9.5px', fontWeight: 400 }}>/ {province.maxLevies}명</span>
                </div>
              </div>

              <div style={{
                padding: '8px 10px',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ fontSize: '10px', color: '#a8a29e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Shield size={12} color="#10b981" /> 성채 방어도
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#6ee7b7', marginTop: '2px' }}>
                  {province.garrison}
                </div>
              </div>

              <div style={{
                padding: '8px 10px',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ fontSize: '10px', color: '#a8a29e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Crown size={12} color="#a855f7" /> 개발도
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#d8b4fe', marginTop: '2px' }}>
                  Lv.{province.development}
                </div>
              </div>
            </div>

            {/* 영주 정보 카드 */}
            <div style={{
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'rgba(200, 159, 60, 0.08)',
              border: '1px solid rgba(200, 159, 60, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '9.5px', color: '#a8a29e' }}>통치 영주</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#fef3c7' }}>
                  {province.rulerName}
                </div>
                <div style={{ fontSize: '10.5px', color: '#d6d3d1' }}>{province.rulerTitle}</div>
              </div>

              {!isPlayer && (
                <button
                  onClick={() => onOpenCharacterDialogue({
                    id: `char_${province.id}`,
                    name: province.rulerName,
                    title: province.rulerTitle,
                    realm: province.realmName,
                    role: `${province.name}의 영주`,
                    culture: province.culture,
                    religion: province.religion,
                    opinion: 50,
                    traits: ['야심가', '군사적 역량', '가문 우선주의']
                  })}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, rgba(200, 159, 60, 0.3), rgba(180, 83, 9, 0.4))',
                    border: '1px solid rgba(200, 159, 60, 0.5)',
                    color: '#fef3c7',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <MessageSquare size={13} />
                  AI 알현
                </button>
              )}
            </div>

            {/* 메인 군사 및 건설 액션 버튼 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              {isPlayer ? (
                <>
                  <button
                    onClick={() => onRaiseLevies(province)}
                    disabled={province.currentLevies <= 0}
                    style={{
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: province.currentLevies > 0 
                        ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' 
                        : 'rgba(75, 85, 99, 0.3)',
                      border: '1px solid rgba(96, 165, 250, 0.4)',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: province.currentLevies > 0 ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Swords size={14} /> 징집병 소집 ({province.currentLevies}명)
                  </button>

                  <button
                    onClick={onOpenConstruction}
                    style={{
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(200, 159, 60, 0.4)',
                      color: '#fef3c7',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Hammer size={14} /> 실시간 건물 건설 창 열기
                  </button>
                </>
              ) : isAtWar ? (
                <button
                  onClick={() => setShowPeaceModal(true)}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                    border: '1px solid #38bdf8',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <HeartHandshake size={14} /> 평화 조약 협상 (승점 {warScore}%)
                </button>
              ) : (
                <button
                  onClick={() => handleGenerateDiplomacy('war')}
                  disabled={isSendingLetter}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                    border: '1px solid rgba(248, 113, 113, 0.5)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: isSendingLetter ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <AlertTriangle size={14} /> 정식 선전포고 및 진군
                </button>
              )}
            </div>
          </>
        )}

        {/* ================= TAB 2: 자문회 직무 (Council Tasks) ================= */}
        {activeTab === 'council' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', color: '#a8a29e', marginBottom: '2px' }}>
              이 영지에 5대 궁정 자문위원을 파견하여 고유 임무를 수행하게 합니다:
            </div>

            {isPlayer ? (
              <>
                <button
                  onClick={() => handleTaskAssign('marshal', '성채 요새 강화', 6)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(200, 159, 60, 0.3)',
                    color: '#fef3c7',
                    fontSize: '11.5px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Shield size={14} color="#60a5fa" />
                  <div>
                    <div style={{ fontWeight: 700 }}>원수: 요새 방어 강화 (+100 방어도)</div>
                    <div style={{ fontSize: '9.5px', color: '#9ca3af' }}>소요 기간: 6개월</div>
                  </div>
                </button>

                <button
                  onClick={() => handleTaskAssign('steward', '조세 개발 촉진', 12)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(200, 159, 60, 0.3)',
                    color: '#fef3c7',
                    fontSize: '11.5px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Coins size={14} color="#fbbf24" />
                  <div>
                    <div style={{ fontWeight: 700 }}>재무관: 영지 개발도 증진 (+5 개발도)</div>
                    <div style={{ fontSize: '9.5px', color: '#9ca3af' }}>소요 기간: 12개월</div>
                  </div>
                </button>

                <button
                  onClick={() => handleTaskAssign('chaplain', '신앙심 고양', 4)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(200, 159, 60, 0.3)',
                    color: '#fef3c7',
                    fontSize: '11.5px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Cross size={14} color="#c084fc" />
                  <div>
                    <div style={{ fontWeight: 700 }}>궁정 사제: 신앙 전파 (+50 신앙도)</div>
                    <div style={{ fontSize: '9.5px', color: '#9ca3af' }}>소요 기간: 4개월</div>
                  </div>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleTaskAssign('chancellor', '정당한 명분 날조', 10)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(200, 159, 60, 0.3)',
                    color: '#fef3c7',
                    fontSize: '11.5px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Scroll size={14} color="#f59e0b" />
                  <div>
                    <div style={{ fontWeight: 700 }}>재상: 정당한 영유권 명분 날조</div>
                    <div style={{ fontSize: '9.5px', color: '#9ca3af' }}>소요 기간: 10개월 (영토 클레임 획득)</div>
                  </div>
                </button>

                <button
                  onClick={() => handleTaskAssign('spymaster', '비밀 첩보망 구축', 6)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(200, 159, 60, 0.3)',
                    color: '#fef3c7',
                    fontSize: '11.5px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Eye size={14} color="#e11d48" />
                  <div>
                    <div style={{ fontWeight: 700 }}>첩보관: 비밀 첩보망 구축 (Intrigue)</div>
                    <div style={{ fontSize: '9.5px', color: '#9ca3af' }}>소요 기간: 6개월 (음모 성공률 +35%)</div>
                  </div>
                </button>
              </>
            )}

            {province.assignedTask && (
              <div style={{
                marginTop: '6px',
                padding: '8px 10px',
                borderRadius: '6px',
                background: 'rgba(217, 119, 6, 0.15)',
                border: '1px solid #d97706',
                fontSize: '11px',
                color: '#fef3c7'
              }}>
                ⏳ <strong>현재 진행 중인 직무:</strong> {province.assignedTask.title}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: 첩보 & 음모 (Intrigue & Diplomacy) ================= */}
        {activeTab === 'intrigue' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', color: '#a8a29e' }}>
              타국에 대한 은밀한 음모 공작 및 특수 외교 조치:
            </div>

            <button
              onClick={() => handleGenerateDiplomacy('friendship')}
              disabled={isSendingLetter}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(200, 159, 60, 0.3)',
                color: '#fef3c7',
                fontSize: '11.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Feather size={14} color="#38bdf8" />
              <span>우호 친선 서신 파견 (호감도 증진)</span>
            </button>

            <button
              onClick={() => alert(`[정략혼 제안] ${province.rulerName} 가문과 혼인 동맹 협상이 시작되었습니다.`)}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(200, 159, 60, 0.3)',
                color: '#fef3c7',
                fontSize: '11.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <HeartHandshake size={14} color="#f43f5e" />
              <span>가문 간 정략혼 제안 (불가침 동맹)</span>
            </button>

            <button
              onClick={() => alert(`[암살 공작] ${province.rulerName}에 대한 비밀 암살 음모가 궁정 지하에서 개시되었습니다!`)}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                background: 'rgba(159, 18, 57, 0.25)',
                border: '1px solid #e11d48',
                color: '#fecdd3',
                fontSize: '11.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Skull size={14} color="#fb7185" />
              <span>은밀한 암살 공작 개시 (Intrigue)</span>
            </button>
          </div>
        )}

      </div>

      {/* 4. 평화 조약 협상 팝업 모달 */}
      {showPeaceModal && onSignPeaceTreaty && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: 'linear-gradient(165deg, #1c1510, #100b08)',
            border: '2px solid #fbbf24',
            borderRadius: '12px',
            padding: '20px',
            width: '320px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            color: '#fef3c7'
          }}>
            <div style={{ fontSize: '15px', fontWeight: 800, textAlign: 'center' }}>
              🕊️ 평화 조약 협상 (승점: {warScore}%)
            </div>
            <div style={{ fontSize: '11px', color: '#d6d3d1', textAlign: 'center' }}>
              현재까지 축적된 전쟁 승점에 따라 조약 조건을 강제하거나 화친할 수 있습니다.
            </div>

            <button
              disabled={warScore < 70}
              onClick={() => {
                onSignPeaceTreaty(province, 'conquest');
                setShowPeaceModal(false);
              }}
              style={{
                padding: '8px',
                borderRadius: '6px',
                background: warScore >= 70 ? 'linear-gradient(135deg, #15803d, #166534)' : '#374151',
                border: '1px solid #4ade80',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700,
                cursor: warScore >= 70 ? 'pointer' : 'not-allowed'
              }}
            >
              👑 요구 관철: 영토 양도 강제 (승점 70% 필요)
            </button>

            <button
              disabled={warScore < 30}
              onClick={() => {
                onSignPeaceTreaty(province, 'reparations');
                setShowPeaceModal(false);
              }}
              style={{
                padding: '8px',
                borderRadius: '6px',
                background: warScore >= 30 ? 'linear-gradient(135deg, #b45309, #92400e)' : '#374151',
                border: '1px solid #f59e0b',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700,
                cursor: warScore >= 30 ? 'pointer' : 'not-allowed'
              }}
            >
              🪙 전쟁 배상금 징수 (+100 금화) (승점 30% 필요)
            </button>

            <button
              onClick={() => {
                onSignPeaceTreaty(province, 'white_peace');
                setShowPeaceModal(false);
              }}
              style={{
                padding: '8px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#d6d3d1',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              🤝 백지 화친 (현상 유지 및 휴전)
            </button>

            <button
              onClick={() => setShowPeaceModal(false)}
              style={{
                padding: '6px',
                background: 'transparent',
                border: 'none',
                color: '#9ca3af',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              창 닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
