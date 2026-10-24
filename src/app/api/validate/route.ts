import { GoogleGenAI } from "@google/genai";
import { isRecord, isValidOptionalApiKey, readJsonBody } from "@/lib/api/request";

export async function POST(req: Request) {
  try {
    const parsedBody = await readJsonBody<Record<string, unknown>>(req, 64 * 1024);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.body;
    if (!isRecord(body) || !isRecord(body.formData)) {
      return Response.json({ error: 'Invalid validation request.' }, { status: 400 });
    }
    const formData = body.formData;
    const apiKey = formData.apiKey;
    if (!isValidOptionalApiKey(apiKey)) {
      return Response.json({ error: 'Invalid API key.' }, { status: 400 });
    }
    const finalApiKey = typeof apiKey === 'string' ? apiKey.trim() : '';
    if (!finalApiKey) {
      // 로컬/오프라인 모드 기본 검증: 인물 이름이 비어있지 않으면 통과
      const charName = typeof formData.character === 'string' ? formData.character.trim() : '';
      if (!charName) {
        return new Response(JSON.stringify({ valid: false, reason: "인물 항목에 이름을 입력해주세요. (예: 샤를 드 발루아)" }));
      }
      return new Response(JSON.stringify({ valid: true }));
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
You are a strict historical and narrative validator for a text-based simulation game.
Your job is to validate the player's initial startup configuration.
Focus on these two rules ONLY:
1. The "character" (인물) field MUST contain a proper noun representing a name (either a real historical figure or a realistic fictional name). It cannot be just a generic description like "몰락한 귀족".
2. The "playerStatus" (신분) field MUST be historically accurate and appropriate for the specified "era" (시대). For example, if era is "조선" (Joseon), status cannot be "기사" (Knight).

Analyze the provided JSON configuration.
If it passes both rules, output a JSON object: {"valid": true}
If it fails either rule, output a JSON object: {"valid": false, "reason": "A polite but specific error message in Korean explaining what is wrong and suggesting a fix. e.g., '조선 시대에는 기사라는 신분이 없습니다. 무관이나 양반으로 수정해주세요.' or '인물 항목에 반드시 이름을 입력해주세요. 예: 이순신 (몰락한 귀족)'"}

DO NOT wrap the output in markdown code blocks. Output ONLY valid JSON.

Data to validate:
${JSON.stringify({ 
  era: formData?.era, 
  character: formData?.character, 
  playerStatus: formData?.playerStatus 
}, null, 2)}
`;

    const result = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: "위의 규칙에 따라 설정을 검증하고 JSON으로 반환하세요.",
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      }
    });
    const responseText = result.text || "";
    const cleanedText = responseText.replace(/```json\n?|```/g, '').trim();
    
    let parsedData;
    try {
      parsedData = JSON.parse(cleanedText);
    } catch (e) {
      console.error("JSON parse error:", e);
      return Response.json({ valid: true }); // Fallback to true if AI breaks format
    }

    return Response.json(parsedData);
  } catch (error) {
    console.error(error);
    return Response.json({ valid: true }); // Fallback to true if network error
  }
}
