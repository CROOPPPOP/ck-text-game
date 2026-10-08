import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { formData } = body;
    const apiKey = formData?.apiKey;

    const finalApiKey = apiKey || process.env.GEMINI_API_KEY;
    if (!finalApiKey) {
      return new Response(JSON.stringify({ error: "Gemini API 키가 제공되지 않았습니다." }), { status: 400 });
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
You are the AI configuration engine for a text-based historical simulation game.
Your task is to generate a highly coherent, interesting, and plausible startup configuration for the player.
The player may have provided some partial inputs. Use them as constraints or inspiration. If a field is empty, invent a compelling one.
You MUST output ONLY a valid JSON object with NO markdown wrapping, NO backticks, and NO extra text.

The JSON object must have exactly the following keys:
- "era": string (e.g., "11세기 중세 유럽", "1453년 콘스탄티노플 공방전")
- "worldview": string (e.g., "역사적", "역사 기반 대체역사")
- "character": string (MUST include a proper name, e.g., "샤를 드 발루아", "아서 펜드래건", "토마스 베켓"). Do not just put a generic description.
- "finalGoal": string (e.g., "가문의 부흥과 영지 확장", "명예로운 대십자군 참여")
- "archetype": string (MUST be one of: "wanderer", "company", "clergy", "noble")
- "playerStatus": string (MUST be exactly one of the 29 status presets according to the archetype:
  * wanderer: "평민", "소작농", "용병", "방랑 검사", "장인", "도제", "학사", "음유시인", "부랑자"
  * company: "용병대장", "상단주", "길드마스터", "촌장", "장원 관리인", "도적단 두목"
  * clergy: "평신도", "수사", "사제", "수도원장", "주교", "대주교", "교황"
  * noble: "기사", "남작", "자작", "백작", "후작", "공작", "황제"
)
- "startLocation": string (e.g., "샤르트르 주교령 성채", "노르망디 해안 장원")
- "additionalSettings": string (e.g., "플레이어는 충성스러운 가신 2명과 함께 가문의 재건을 맹세함.")
- "stats": object with key-value pairs (0-100) for innate and acquired abilities. Distribute exactly 650 points among innate stats (근력, 체력, 지구력, 민첩성, 반사 신경, 속도, 신체 조정력, 지각력, 지능, 기억력, 학습 능력, 의지력, 집중력) and exactly 200 points among acquired stats (통솔력, 매력, 외교력, 설득력, 기만술, 위협, 행정력, 전략, 전술, 전투력, 무기 숙련도, 기마술, 생존술, 의술, 학문, 기술 숙련도, 장인 기술, 은밀 행동, 수사력).
- "traits": array of objects, each containing "category" (신체특성, 정신특성, 감각특성, 전문특성, 잠재특성, 일시적특성) and "name" (the trait name). Create 3 to 5 fitting traits.

Current partial inputs:
${JSON.stringify(formData, null, 2)}
    `;

    const result = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: "추천 캐릭터와 게임 설정을 JSON으로 생성해주세요.",
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      }
    });
    const responseText = result.text || "";
    
    // Clean up potential markdown JSON wrapping
    const cleanedText = responseText.replace(/```json\n?|```/g, '').trim();
    
    let parsedConfig;
    try {
      parsedConfig = JSON.parse(cleanedText);
    } catch (e) {
      console.error("JSON parse error:", e);
      return Response.json({ error: "AI가 잘못된 형식으로 응답했습니다." }, { status: 500 });
    }

    return Response.json({ config: parsedConfig });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to generate recommendation" }, { status: 500 });
  }
}
