import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { formData } = body;

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const systemInstruction = `
You are the AI configuration engine for a text-based historical simulation game.
Your task is to generate a highly coherent, interesting, and plausible startup configuration for the player.
The player may have provided some partial inputs. Use them as constraints or inspiration. If a field is empty, invent a compelling one.
You MUST output ONLY a valid JSON object with NO markdown wrapping, NO backticks, and NO extra text.

The JSON object must have exactly the following keys:
- "era": string (e.g., "조선 후기", "1453년 콘스탄티노플")
- "worldview": string (e.g., "역사적", "역사 기반 대체역사")
- "character": string (MUST include a proper name, e.g., "이순신 (조선의 수군통제사)", "아서 펜드래건 (몰락한 귀족)"). Do not just put a generic description.
- "finalGoal": string (e.g., "가문의 부흥과 복수", "신대륙 발견")
- "playerStatus": string (MUST be a historically accurate class/status for the given era. e.g., "양반", "무관", "기사", "파트리키")
- "startLocation": string (e.g., "한양 남촌", "제노바 항구")
- "additionalSettings": string (e.g., "플레이어는 과거 암살 길드에 몸담았던 전적이 있음.")
- "stats": object with key-value pairs (0-100) for innate and acquired abilities. It must match the game's stats list exactly. Distribute exactly 650 points among innate stats (근력, 체력, 지구력, 민첩성, 반사 신경, 속도, 신체 조정력, 지각력, 지능, 기억력, 학습 능력, 의지력, 집중력) and exactly 200 points among acquired stats (통솔력, 매력, 외교력, 설득력, 기만술, 위협, 행정력, 전략, 전술, 전투력, 무기 숙련도, 기마술, 생존술, 의술, 학문, 기술 숙련도, 장인 기술, 은밀 행동, 수사력).
- "traits": array of objects, each containing "category" (신체특성, 정신특성, 감각특성, 전문특성, 잠재특성, 일시적특성) and "name" (the trait name). Create 3 to 5 fitting traits.

Current partial inputs:
${JSON.stringify(formData, null, 2)}
    `;

    const result = await model.generateContent(systemInstruction);
    const responseText = result.response.text();
    
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
