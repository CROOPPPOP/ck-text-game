import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { formData } = body;

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

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
  era: formData.era, 
  character: formData.character, 
  playerStatus: formData.playerStatus 
}, null, 2)}
`;

    const result = await model.generateContent(systemInstruction);
    const responseText = result.response.text();
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
