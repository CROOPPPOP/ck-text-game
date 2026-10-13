"use client";

import React, { useState } from 'react';
import { Province } from '@/lib/engine/mapData';
import { Army } from '@/lib/engine/militaryEngine';
import { 
  Castle, Shield, Swords, Coins, Crown, Users, MapPin, 
  Sparkles, MessageSquare, Scroll, AlertTriangle, Hammer, X, Check, ArrowRight
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
  apiKey
}: Props) {
  const [isSendingLetter, setIsSendingLetter] = useState(false);
  const [diplomaticLetter, setDiplomaticLetter] = useState<string | null>(null);

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

  return (
    <div style={{
      width: '320px',
      maxHeight: 'calc(100vh - 120px)',
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
      {/* 헤더 */}
      <div style={{
        padding: '12px 16px',
        background: 'rgba(0, 0, 0, 0.5)',
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
          {isPlayer && (
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
          )}
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

      <div style={{ padding: '14px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* 기본 영지 개요 */}
        <div style={{
          padding: '10px 12px',
          borderRadius: '10px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(200, 159, 60, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          fontSize: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d6d3d1' }}>
            <span style={{ color: '#a8a29e' }}>수도 요새</span>
            <strong style={{ color: '#f5f5f4' }}>{province.capital}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d6d3d1' }}>
            <span style={{ color: '#a8a29e' }}>소속 세력</span>
            <strong style={{ color: '#f5f5f4' }}>{province.realmName}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d6d3d1' }}>
            <span style={{ color: '#a8a29e' }}>지형 및 환경</span>
            <strong style={{ color: '#38bdf8' }}>{province.terrain}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d6d3d1' }}>
            <span style={{ color: '#a8a29e' }}>문화 / 종교</span>
            <span>{province.culture} · {province.religion}</span>
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
            <div style={{ fontSize: '10.5px', color: '#a8a29e', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Coins size={12} color="#f59e0b" /> 월간 조세
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#fef08a', marginTop: '2px' }}>
              +{province.monthlyIncome.toFixed(1)} <span style={{ fontSize: '10px', fontWeight: 400 }}>금화</span>
            </div>
          </div>

          <div style={{
            padding: '8px 10px',
            borderRadius: '8px',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ fontSize: '10.5px', color: '#a8a29e', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Swords size={12} color="#3b82f6" /> 가용 징집병
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#93c5fd', marginTop: '2px' }}>
              {province.currentLevies} <span style={{ fontSize: '10px', fontWeight: 400 }}>/ {province.maxLevies}명</span>
            </div>
          </div>

          <div style={{
            padding: '8px 10px',
            borderRadius: '8px',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ fontSize: '10.5px', color: '#a8a29e', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Shield size={12} color="#10b981" /> 성채 방어도
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#6ee7b7', marginTop: '2px' }}>
              {province.garrison}
            </div>
          </div>

          <div style={{
            padding: '8px 10px',
            borderRadius: '8px',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ fontSize: '10.5px', color: '#a8a29e', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Crown size={12} color="#a855f7" /> 개발도
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#d8b4fe', marginTop: '2px' }}>
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
            <div style={{ fontSize: '10px', color: '#a8a29e' }}>통치 영주</div>
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
                gap: '4px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
              }}
            >
              <MessageSquare size={13} />
              AI 알현
            </button>
          )}
        </div>

        {/* 외교 서한 출력 영역 (생성되었을 때) */}
        {diplomaticLetter && (
          <div style={{
            padding: '10px 12px',
            borderRadius: '8px',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(96, 165, 250, 0.4)',
            fontSize: '11.5px',
            color: '#e2e8f0',
            lineHeight: '1.5',
            maxHeight: '130px',
            overflowY: 'auto'
          }}>
            <div style={{ fontSize: '10px', color: '#93c5fd', fontWeight: 700, marginBottom: '4px' }}>
              📜 발송된 궁정 공식 외교 서신
            </div>
            {diplomaticLetter}
          </div>
        )}

        {/* 하단 액션 버튼부 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          {isPlayer ? (
            <>
              {/* 자국 영지 액션 */}
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
                <Swords size={14} /> 징집병 소집 ({province.currentLevies}명 출진)
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
          ) : (
            <>
              {/* 타국 영지 액션 */}
              <button
                onClick={() => handleGenerateDiplomacy('friendship')}
                disabled={isSendingLetter}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(200, 159, 60, 0.4)',
                  color: '#fef3c7',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: isSendingLetter ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Scroll size={14} /> 우호 친선 서신 파견
              </button>

              <button
                onClick={() => handleGenerateDiplomacy('war')}
                disabled={isSendingLetter}
                style={{
                  padding: '8px 12px',
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
