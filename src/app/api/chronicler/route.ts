import { GoogleGenAI } from "@google/genai";
import { isRecord, isValidOptionalApiKey, readJsonBody } from "@/lib/api/request";

export async function POST(req: Request) {
  try {
    const parsedBody = await readJsonBody<Record<string, unknown>>(req, 64 * 1024);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.body;
    if (!isRecord(body) || !isRecord(body.context) || !['character_dialogue', 'diplomacy_letter', 'battle_dispatch', 'historical_event'].includes(String(body.type))) {
      return Response.json({ error: 'Invalid chronicler request.' }, { status: 400 });
    }
    if (!isValidOptionalApiKey(body.apiKey)) {
      return Response.json({ error: 'Invalid API key.' }, { status: 400 });
    }

    const type = body.type;
    const context = body.context as Record<string, any>;
    const apiKey = body.apiKey;
    const finalApiKey = typeof apiKey === 'string' ? apiKey.trim() : '';
    if (!finalApiKey) {
      return new Response(JSON.stringify({
        error: "NO_API_KEY",
        fallback: true
      }), { status: 400 });
    }

    const ai = new GoogleGenAI({
      apiKey: finalApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const systemInstruction = `
You are the Grand Historical Chronicler and Literary Narrator for a Paradox "Crusader Kings" style grand strategy RPG.
Your task is to craft evocative, historically authentic, and high-literary medieval narratives, royal letters, battle dispatches, and NPC dialogues.

[ABSOLUTE WRITING RULES]
1. Medieval Immersion: Write in high-medieval literary Korean (중세 고풍스러운 문체, 격조 높은 궁정 서한 양식).
2. Direct Spoken Dialogue: Always include 2~4 lines of vivid spoken dialogue in quotation marks ("...") with distinctive voices reflecting character personalities.
3. No Meta Terms: NEVER use game terms like 'Lv.N', 'Stat', 'HP', 'Points', 'Gold numbers', '+5 Relation' in the narrative text.
4. Historical Authenticity Tag: End every narrative with an authenticity appraisal: [역사적 고증: 확인됨 / 개연성 있음 / 시뮬레이션 분기].
5. Keep it focused: 2 to 4 evocative paragraphs.
`;

    let userPrompt = "";

    if (type === "character_dialogue") {
      userPrompt = `
[인물 알현 및 서신 교환]
플레이어 군주: ${context.playerRuler} (칭호: ${context.playerTitle})
상대 인물: ${context.characterName} (신분/직위: ${context.characterRole}, 성격: ${context.personality || '야심찬'}, 호감도: ${context.opinion ?? 50})
플레이어의 행동/발언: "${context.playerAction}"
현재 날짜 및 장소: ${context.dateLocation}
상황 맥락: ${context.context || '영지 알현실에서의 비밀 회동'}

상대 인물이 자신의 성격과 이해관계에 따라 플레이어에게 직접 응답하는 생생한 대화와 심리 묘사를 작성하세요.
`;
    } else if (type === "diplomacy_letter") {
      userPrompt = `
[공식 궁정 외교 서한 및 선전포고]
발신자: ${context.sender} (영지: ${context.senderRealm})
수신자: ${context.recipient} (영지: ${context.recipientRealm})
외교 안건: ${context.actionName} (${context.actionDesc})
외교 명분(Casus Belli) 및 정당성: ${context.casusBelli || '합법적인 선대의 계승권 주장'}
현재 날짜: ${context.dateLocation}

양측 궁정의 위엄과 긴장감이 묻어나는 공식 외교 서한 및 전령의 보고 장면을 작성하세요.
`;
    } else if (type === "battle_dispatch") {
      userPrompt = `
[전투 상보 및 전황 보고]
전장 프로빈스: ${context.provinceName} (지형: ${context.terrain})
공격측: ${context.attackerName} (지휘관: ${context.attackerCommander}, 병력: ${context.attackerTroops})
방어측: ${context.defenderName} (지휘관: ${context.defenderCommander}, 병력: ${context.defenderTroops})
전투 결과: ${context.victorName}의 ${context.victoryType || '결정적 승리'}
전사자/피해: ${context.casualties || '치열한 백병전 끝에 다수의 사상자 발생'}

전장의 흙먼지와 칼바람, 깃발의 휘날림과 승패가 갈린 극적인 순간을 묘사하는 궁정 기사의 생생한 전투 상보를 작성하세요.
`;
    } else {
      userPrompt = `
[역사적 사건 서사]
사건명: ${context.title}
배경: ${context.narrativeContext}
결단: ${context.choiceText || '군주의 즉각적인 조치'}
현재 날짜/위치: ${context.dateLocation}

사건의 시대적 파장과 영지민들의 반응을 생생하게 묘사하세요.
`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.85
      }
    });

    const text = response.text || "";
    return new Response(JSON.stringify({ text, success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    console.error("AI Chronicler Error:", err);
    return new Response(JSON.stringify({
      error: err.message || "AI 생성 실패",
      fallback: true
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
