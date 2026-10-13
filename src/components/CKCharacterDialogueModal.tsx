"use client";

import React, { useState } from 'react';
import { Crown, Shield, Send, Sparkles, X, User, Heart, MessageSquare, AlertCircle, RefreshCw, Feather } from 'lucide-react';
import { requestCharacterDialogue } from '@/lib/engine/aiChronicler';

export interface DialogueCharacter {
  id: string;
  name: string;
  title: string;
  realm: string;
  role: string;
  culture?: string;
  religion?: string;
  traits?: string[];
  opinion: number; // 0 ~ 100
  portraitUrl?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  character: DialogueCharacter | null;
  playerRulerName: string;
  playerRulerTitle: string;
  currentDateStr: string;
  onOpinionChange?: (characterId: string, delta: number) => void;
  apiKey?: string;
}

interface MessageItem {
  id: string;
  sender: 'player' | 'npc';
  senderName: string;
  text: string;
  timestamp: string;
  opinionDelta?: number;
}

export default function CKCharacterDialogueModal({
  isOpen,
  onClose,
  character,
  playerRulerName,
  playerRulerTitle,
  currentDateStr,
  onOpinionChange,
  apiKey
}: Props) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentOpinion, setCurrentOpinion] = useState<number>(character?.opinion ?? 50);

  // 캐릭터 변경 시 초기화
  React.useEffect(() => {
    if (character) {
      setCurrentOpinion(character.opinion);
      setMessages([
        {
          id: 'welcome',
          sender: 'npc',
          senderName: character.name,
          text: `알현실의 촛불이 타오르는 가운데, ${character.name}(${character.title})이(가) 조용히 시선을 듭니다.\n"주군이시여, 소신에게 어떤 전언이나 밀담을 나누고자 하십니까?"`,
          timestamp: currentDateStr
        }
      ]);
    }
  }, [character, currentDateStr]);

  if (!isOpen || !character) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputText).trim();
    if (!content || isLoading) return;

    const userMsg: MessageItem = {
      id: `msg_player_${Date.now()}`,
      sender: 'player',
      senderName: playerRulerName,
      text: content,
      timestamp: currentDateStr
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Gemini AI 보조 또는 로컬 고증 템플릿 호출
      const aiReply = await requestCharacterDialogue({
        playerRuler: playerRulerName,
        playerTitle: playerRulerTitle,
        characterName: character.name,
        characterRole: character.role || character.title,
        personality: character.traits?.join(', ') || '신중하고 자존심 강함',
        opinion: currentOpinion,
        playerAction: content,
        dateLocation: currentDateStr,
        context: `${character.realm}의 ${character.title}와 대좌 중.`
      }, apiKey);

      // 대화 감정 분석에 따른 호감도 변동 (간단한 키워드 판정)
      let delta = 0;
      if (/존중|기쁨|감사|충성|환영|동의|기꺼이/.test(aiReply)) {
        delta = Math.floor(Math.random() * 5) + 3; // +3 ~ +7
      } else if (/불쾌|의구심|경계|거절|모욕|위협/.test(aiReply)) {
        delta = -(Math.floor(Math.random() * 6) + 4); // -4 ~ -9
      } else {
        delta = Math.random() > 0.5 ? 2 : -2;
      }

      const newOp = Math.max(0, Math.min(100, currentOpinion + delta));
      setCurrentOpinion(newOp);
      if (onOpinionChange) {
        onOpinionChange(character.id, delta);
      }

      const npcMsg: MessageItem = {
        id: `msg_npc_${Date.now()}`,
        sender: 'npc',
        senderName: character.name,
        text: aiReply,
        timestamp: currentDateStr,
        opinionDelta: delta
      };

      setMessages(prev => [...prev, npcMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const PRESETS = [
    { label: '📜 가신의 충성 맹세 확인', text: '경의 충성심과 영지에 대한 헌신을 다시금 확인하고 싶소.' },
    { label: '🤝 공동의 번영과 동맹 타진', text: '우리 두 가문이 손을 잡는다면 주변의 그 어떤 위협도 두렵지 않을 것이오.' },
    { label: '🪙 하사품과 은총 약속', text: '경의 노고를 높이 평가하여 국고의 재물과 영지를 포상으로 내릴 용의가 있소.' },
    { label: '⚔️ 엄중한 경고와 압박', text: '궁정의 규율과 군주의 권위를 가볍게 여기지 않는 것이 신상에 이로울 것이오.' }
  ];

  const getOpinionColor = (op: number) => {
    if (op >= 75) return '#22c55e'; // 친밀
    if (op >= 50) return '#38bdf8'; // 보통
    if (op >= 25) return '#f59e0b'; // 경계
    return '#ef4444'; // 적대
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 7, 15, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          width: '95%',
          maxWidth: '820px',
          height: '85vh',
          maxHeight: '750px',
          background: 'linear-gradient(165deg, rgba(26, 20, 15, 0.98), rgba(15, 11, 8, 0.98))',
          borderRadius: '16px',
          border: '2px solid rgba(200, 159, 60, 0.45)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.95), 0 0 30px rgba(200, 159, 60, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'var(--font-sans, "Pretendard", sans-serif)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header: 인물 기본 프로필 */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(200, 159, 60, 0.3)',
          background: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(200, 159, 60, 0.3), rgba(60, 40, 20, 0.6))',
              border: '2px solid rgba(200, 159, 60, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
            }}>
              <Crown size={24} color="#f59e0b" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#fef3c7' }}>
                  {character.name}
                </span>
                <span style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(200, 159, 60, 0.15)',
                  border: '1px solid rgba(200, 159, 60, 0.3)',
                  color: '#fbbf24'
                }}>
                  {character.title}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#a8a29e', marginTop: '2px' }}>
                소속: <strong style={{ color: '#e7e5e4' }}>{character.realm}</strong> · 문화: {character.culture || '중세 라틴'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* 호감도 배지 */}
            <div style={{
              padding: '6px 14px',
              borderRadius: '10px',
              background: 'rgba(0, 0, 0, 0.6)',
              border: `1px solid ${getOpinionColor(currentOpinion)}40`,
              textAlign: 'right'
            }}>
              <div style={{ fontSize: '10px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Heart size={10} color={getOpinionColor(currentOpinion)} /> 호감도 (Opinion)
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: getOpinionColor(currentOpinion) }}>
                {currentOpinion} / 100
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#d6d3d1',
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 인물 특성 트레잇 뱃지 */}
        {character.traits && character.traits.length > 0 && (
          <div style={{
            padding: '8px 20px',
            background: 'rgba(20, 15, 10, 0.6)',
            borderBottom: '1px solid rgba(200, 159, 60, 0.15)',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '11px', color: '#a8a29e', marginRight: '4px' }}>성격 특성:</span>
            {character.traits.map((t, idx) => (
              <span key={idx} style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(180, 83, 9, 0.2)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#fef3c7'
              }}>
                ✨ {t}
              </span>
            ))}
          </div>
        )}

        {/* 대화 메시지 영역 */}
        <div style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          background: 'radial-gradient(ellipse at center, rgba(30, 24, 18, 0.4) 0%, rgba(12, 9, 7, 0.8) 100%)'
        }}>
          {messages.map(msg => (
            <div
              key={msg.id}
              style={{
                alignSelf: msg.sender === 'player' ? 'flex-end' : 'flex-start',
                maxWidth: '82%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.sender === 'player' ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                fontSize: '11px',
                color: msg.sender === 'player' ? '#60a5fa' : '#f59e0b',
                fontWeight: 700,
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                {msg.sender === 'player' ? `👑 ${msg.senderName}` : `🛡️ ${msg.senderName}`}
                <span style={{ fontSize: '10px', color: '#78716c', fontWeight: 400 }}>{msg.timestamp}</span>
              </div>

              <div style={{
                padding: '12px 16px',
                borderRadius: msg.sender === 'player' ? '14px 2px 14px 14px' : '2px 14px 14px 14px',
                background: msg.sender === 'player' 
                  ? 'linear-gradient(135deg, rgba(30, 58, 138, 0.85), rgba(15, 23, 42, 0.9))' 
                  : 'linear-gradient(135deg, rgba(45, 30, 20, 0.9), rgba(20, 15, 10, 0.95))',
                border: msg.sender === 'player' 
                  ? '1px solid rgba(96, 165, 250, 0.4)' 
                  : '1px solid rgba(200, 159, 60, 0.4)',
                color: '#f3f4f6',
                fontSize: '13.5px',
                lineHeight: '1.65',
                whiteSpace: 'pre-line',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)'
              }}>
                {msg.text}
              </div>

              {msg.opinionDelta !== undefined && msg.opinionDelta !== 0 && (
                <div style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  marginTop: '4px',
                  color: msg.opinionDelta > 0 ? '#4ade80' : '#f87171'
                }}>
                  {msg.opinionDelta > 0 ? `▲ 호감도 +${msg.opinionDelta}` : `▼ 호감도 ${msg.opinionDelta}`}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div style={{
              alignSelf: 'flex-start',
              padding: '12px 16px',
              borderRadius: '2px 14px 14px 14px',
              background: 'rgba(30, 22, 15, 0.8)',
              border: '1px dashed rgba(200, 159, 60, 0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#d6d3d1',
              fontSize: '13px'
            }}>
              <Feather size={16} className="animate-spin text-amber-400" />
              <span>궁정 서관이 인물의 안색을 살피며 답신을 기록하고 있습니다...</span>
            </div>
          )}
        </div>

        {/* 하단 프리셋 빠른 질문 바 */}
        <div style={{
          padding: '8px 16px',
          background: 'rgba(18, 14, 10, 0.95)',
          borderTop: '1px solid rgba(200, 159, 60, 0.2)',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto'
        }}>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              disabled={isLoading}
              onClick={() => handleSendMessage(p.text)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(200, 159, 60, 0.25)',
                color: '#e7e5e4',
                fontSize: '11.5px',
                whiteSpace: 'nowrap',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200, 159, 60, 0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* 하단 사용자 직접 텍스트 입력 바 */}
        <div style={{
          padding: '14px 16px',
          background: 'rgba(12, 9, 7, 0.98)',
          borderTop: '1px solid rgba(200, 159, 60, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <input
            type="text"
            value={inputText}
            disabled={isLoading}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={`${character.name}에게 전할 말이나 제안을 직접 입력하세요... (Enter로 전송)`}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(25, 20, 15, 0.8)',
              border: '1px solid rgba(200, 159, 60, 0.4)',
              color: '#f5f5f4',
              fontSize: '13px',
              outline: 'none'
            }}
          />

          <button
            disabled={isLoading || !inputText.trim()}
            onClick={() => handleSendMessage()}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              background: isLoading || !inputText.trim() 
                ? 'rgba(100, 90, 80, 0.4)' 
                : 'linear-gradient(135deg, #d97706, #b45309)',
              border: '1px solid rgba(245, 158, 11, 0.5)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '13px',
              cursor: isLoading || !inputText.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)'
            }}
          >
            <Send size={15} /> 전송
          </button>
        </div>
      </div>
    </div>
  );
}
