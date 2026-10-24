import { getGeminiApiKey } from '../apiKeyStorage';

/**
 * AI 역사·인물 서관(Grand Chronicler) 모듈
 * - 사용자의 Gemini API Key를 통해 역사적 사건, 전투 상보, 외교 서한, 인물 알현 대화를 고풍스러운 중세 서사로 생성합니다.
 * - API Key가 없거나 통신 실패 시 로컬 결정론적 서사 엔진으로 무중단 자동 폴백(Fallback)합니다.
 */

export interface CharacterDialogueContext {
  playerRuler: string;
  playerTitle: string;
  characterName: string;
  characterRole: string;
  personality?: string;
  opinion?: number;
  playerAction: string;
  dateLocation: string;
  context?: string;
}

export interface DiplomacyLetterContext {
  sender: string;
  senderRealm: string;
  recipient: string;
  recipientRealm: string;
  actionName: string;
  actionDesc: string;
  casusBelli?: string;
  dateLocation: string;
}

export interface BattleDispatchContext {
  provinceName: string;
  terrain: string;
  attackerName: string;
  attackerCommander: string;
  attackerTroops: number | string;
  defenderName: string;
  defenderCommander: string;
  defenderTroops: number | string;
  victorName: string;
  victoryType: string;
  casualties?: string;
}

/**
 * 인물(NPC)과의 대화 / 서신 교환 서사 요청
 */
export async function requestCharacterDialogue(
  context: CharacterDialogueContext,
  apiKey?: string
): Promise<string> {
  const finalKey = apiKey || getGeminiApiKey();
  
  if (finalKey) {
    try {
      const res = await fetch('/api/chronicler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'character_dialogue',
          context,
          apiKey: finalKey
        })
      });
      const data = await res.json();
      if (data?.text) {
        return data.text;
      }
    } catch (e) {
      console.warn("AI Chronicler API unavailable, falling back to local template:", e);
    }
  }

  // 로컬 결정론적 폴백 (Zero latency, No Hallucination)
  const attitude = (context.opinion ?? 50) > 60 ? '깊은 경의를 표하며' : (context.opinion ?? 50) < 30 ? '경계 어린 눈빛으로' : '예의를 차리며';
  return `알현실의 촛불이 조용히 흔들리는 가운데, ${context.characterName}(${context.characterRole})이(가) ${attitude} 허리를 숙였습니다.

"각하께서 뜻하신 바('${context.playerAction}')를 가슴 깊이 새기겠습니다."
${context.characterName}의 눈동자가 잠시 깊은 생각에 잠겼다가 이내 고개를 들었습니다.
"가문과 영지의 안녕을 위해서라면, 소신 또한 성심을 다해 군주의 명을 따를 준비가 되어 있습니다."

두 사람 사이에 오간 밀담은 궁정 서기들의 비밀 일지에 기록되었습니다.
[역사적 고증: 개연성 있음]`;
}

/**
 * 공식 외교 서한 및 선전포고문 요청
 */
export async function requestDiplomaticLetter(
  context: DiplomacyLetterContext,
  apiKey?: string
): Promise<string> {
  const finalKey = apiKey || getGeminiApiKey();

  if (finalKey) {
    try {
      const res = await fetch('/api/chronicler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'diplomacy_letter',
          context,
          apiKey: finalKey
        })
      });
      const data = await res.json();
      if (data?.text) {
        return data.text;
      }
    } catch (e) {
      console.warn("AI Chronicler API unavailable, falling back to local template:", e);
    }
  }

  // 로컬 결정론적 폴백
  return `붉은 밀랍 인장으로 봉인된 공식 서한이 ${context.recipientRealm}의 궁정에 당도했습니다.
발신인: ${context.sender} (${context.senderRealm})

"사도 베드로의 가호 아래, 본인은 귀하에게 '${context.actionName}'의 뜻을 정식으로 전하는 바입니다. ${context.actionDesc}
${context.casusBelli ? `이는 ${context.casusBelli}에 기반한 정당한 군주의 권리임을 천명합니다.` : ''}
신의 정의가 양측 가문 위에 임하기를 기원합니다."

전령이 서한을 낭독하자 궁정 귀족들의 웅성거림이 전당을 가득 메웠습니다.
[역사적 고증: 확인됨]`;
}

/**
 * 실시간 전투 상보 및 전황 보고서 요청
 */
export async function requestBattleDispatch(
  context: BattleDispatchContext,
  apiKey?: string
): Promise<string> {
  const finalKey = apiKey || getGeminiApiKey();

  if (finalKey) {
    try {
      const res = await fetch('/api/chronicler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'battle_dispatch',
          context,
          apiKey: finalKey
        })
      });
      const data = await res.json();
      if (data?.text) {
        return data.text;
      }
    } catch (e) {
      console.warn("AI Chronicler API unavailable, falling back to local template:", e);
    }
  }

  // 로컬 결정론적 폴백
  return `${context.provinceName}의 ${context.terrain} 벌판 위로 포연과 흙먼지가 자욱하게 피어올랐습니다.
${context.attackerName}의 군단(${context.attackerTroops}명)과 ${context.defenderName}의 수비대(${context.defenderTroops}명)가 정면으로 충돌했습니다.

백병전의 치열한 함성과 군마의 비명이 대지를 뒤흔든 끝에, 마침내 ${context.victorName}의 군단이 ${context.victoryType}을 거두었습니다!
수호대장이 흙투성이가 된 투구를 벗으며 고했습니다.
"전선의 승기가 우리 손에 들어왔습니다, 각하! 적들이 전열을 잃고 패주하고 있습니다!"
[역사적 고증: 확인됨]`;
}
