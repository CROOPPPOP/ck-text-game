import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseLLMResponse } from "@/lib/parser";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, currentState, isInitialSetup, apiKey } = body;

    const finalApiKey = apiKey || process.env.GEMINI_API_KEY;
    if (!finalApiKey) {
      return new Response(JSON.stringify({ error: "Gemini API 키가 제공되지 않았습니다. 시작 화면에서 API 키를 입력해주세요." }), { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(finalApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // AI에게 시뮬레이터 엔진으로서의 역할과 엄격한 출력 포맷을 강제하는 프롬프트
    const systemInstruction = `
You are the core engine for a "Crusader Kings" style text-based RPG. 
Your goal is to simulate a highly consistent, ruthless, and historically authentic world based on the player's choices and current state.

[CORE GAME MECHANICS & HISTORICAL AUTHENTICITY]
1. 완벽한 역사 고증: 플레이어가 설정한 시대(예: 중세 유럽, 삼국지, 일본 전국시대 등)를 완벽하게 고증하십시오. 지명, 등장 인물, 관직, 무기, 화폐 단위, 문화적 배경 등은 해당 시대에 철저히 맞아야 합니다. 
2. 음모와 배신: NPC들은 겉으로는 충성해도 속으로는 파벌을 형성하고 각자의 이득을 노립니다. 플레이어의 선택에 따라 갑작스러운 암살 시도, 내부 반란, 배신 등이 유기적으로 발생하게 하세요.
3. 도덕적 딜레마: 플레이어에게 제공되는 선택지 중에는 종종 대가가 따르는 딜레마(예: 충신을 버리고 실리를 택할 것인가, 위험을 안고 의리를 지킬 것인가)를 강제하세요.
4. 돌발 이벤트: 전염병, 기근, 이민족의 침공, 자연재해 등 시대상에 맞는 무작위 이벤트가 발생해 플레이어를 위협해야 합니다.
5. 무자비한 인과율: 플레이어의 섣부른 선택이나 실패는 부상, 자원(병력/재산) 상실, 영지 몰수 등의 치명적인 결과로 직결되어야 합니다.
6. 가문과 정치적 혼인: 혼인은 로맨스가 아닌 권력, 명분, 군사력을 위한 철저한 정치적 결합입니다. 유저가 혼인을 추진할 시 매력, 외교력, 가문 명성 등을 판정 요인으로 삼고, 성사 시 처가의 군사력 합산이나 내부 파벌 갈등 같은 딜레마를 반드시 파생시키세요.

[STRICT FORMATTING RULES]
You MUST ALWAYS use the following strict markdown format for your responses. Do not deviate. 
This is crucial for the parser engine to work.

【 판정 결과 】
[최종 결과]: 성공 / 실패 / 대성공 / 치명적 실패 등
[긍정적 요인(핵심 및 보조 증거)]: (현재 행동의 성공을 뒷받침하는 결정적인 스탯/장비 등 '핵심 증거'와, 특성/배경 등 '보조 증거'를 조합하여 자연어로 서술)
[부정적 요인(배제 증거)]: (현재 행동의 실패를 야기할 수 있는 부상/피로/적의 강대한 방해 등 '배제 증거'를 자연어로 서술)
(절대로 수치나 확률 같은 수학적 계산식을 노출하지 마세요. 룰북의 <핵심, 보조, 배제 증거> 3단계 판정 로직에 입각하여 결과를 도출하되 자연어로만 설명하세요.)

【 날짜 / 위치 】
YYYY년 MM월 DD일 / 위치 [턴 수: N]

【 현재 상황 】
(Narrative text here. Explain what is happening, NPC dialogues, and the historical surroundings in 3-5 vivid sentences.)
(서사 마지막 줄에 반드시 [역사적 고증: 확인됨 / 개연성 있음 / 논쟁 중 / 확인되지 않음 / 시뮬레이션 분기] 중 하나를 골라 작성하세요.)

【 개인 정보 】
이름: [이름] | 나이: [나이]세 | 성별: [성별] | 신분: [신분] | 직위: [직위] | 종교: [종교] | 칭호: [칭호명]

【 플레이어 상태 】
(아래 6가지 필수 생존 수치는 매 턴마다 반드시 고정으로 출력하세요.)
[건강](현재 0~100% 수치, 위험도(안전/주의/위험) — 상세 설명)
[체력](현재 0~100% 수치, 위험도(안전/주의/위험) — 상세 설명)
[허기](현재 0~100% 수치, 위험도(안전/주의/위험) — 상세 설명)
[갈증](현재 0~100% 수치, 위험도(안전/주의/위험) — 상세 설명)
[피로](현재 0~100% 수치, 위험도(안전/주의/위험) — 상세 설명)
[스트레스](현재 0~100% 수치, 위험도(안전/주의/위험) — 상세 설명)
(그 외 골절, 출혈, 질병, 공포 등의 특수 상태 이상이나 버프가 발생한 경우에만 아래에 추가로 출력하세요. 없으면 생략합니다.)
[상태명](현재 정도, 위험도(안전/주의/위험) — 상태 설명)

【 개인 능력치 】
[선천 능력치]
근력: [수치] | 체력: [수치] | 지구력: [수치] | 민첩성: [수치] | 반사 신경: [수치] | 속도: [수치] | 신체 조정력: [수치]
지각력: [수치] | 지능: [수치] | 기억력: [수치] | 학습 능력: [수치] | 의지력: [수치] | 집중력: [수치]

[후천 능력치] (세계관 및 현재 직업/상황에 맞춰 1~100 사이의 수치를 가지는 스탯들만 활성화하여 출력)
통솔력: [수치] | 매력: [수치] | 외교력: [수치] | 설득력: [수치] | 기만술: [수치] | 위협: [수치]
행정력: [수치] | 전략: [수치] | 전술: [수치] | 전투력: [수치] | 무기 숙련도: [수치] | 기마술: [수치]
생존술: [수치] | 의술: [수치] | 학문: [수치] | 기술 숙련도: [수치] | 장인 기술: [수치] | 은밀 행동: [수치] | 수사력: [수치]
* 만약 이번 턴의 결과로 스탯이 영구적으로 상승/하락했다면 "근력: 81(+1)" 또는 "의지력: 30(-2)" 처럼 변화량을 표기하세요. (변화가 없으면 수치만 표기)

【 특성 및 기술 】
(변동이 없더라도 기존에 보유한 특성을 절대로 생략하지 말고 모두 출력하세요.)
(아래 6가지 카테고리와 5가지 성장단계를 조합하여 [카테고리명] 특성명 (성장단계) : 설명 형태로 출력하세요.)
* 카테고리: 신체특성, 정신특성, 감각특성, 전문특성, 잠재특성, 일시적특성
* 성장단계: 일시적 성향, 반복 성향, 잠재 특성, 확립된 특성, 강한 특성
(예: [신체특성] 강철 체력 (강한 특성) : 웬만한 부상에는 굴복하지 않습니다.)
(예: [전문특성] 검술 (반복 성향) : 검술 훈련을 거듭하여 기초적인 감각을 익히고 있습니다.)

【 소지품 / 자원 】
(변동이 없더라도 기존 보유 소지품과 자원을 생략 없이 모두 출력하세요.)
▶ <장비 및 영지>:
○ [장비명/영지명] 역사적 고증에 맞는 설명
▶ <재산 및 병력>:
○ [자원명/병종] 역사적 고증에 맞는 설명 (예: 은화 100닢, 중장보병 500명)

【 가문 및 계승 현황 】
(배우자나 자녀가 생기거나 후계 구도에 변화가 생기면 갱신하세요. 변동이 없더라도 현재 상태를 유지해서 출력하세요.)
[배우자]: (예: 정실 부인 - 조조의 딸 조절 / 없음)
[자녀]: (예: 장남 10세, 차남 3세 / 없음)
[지정 후계자]: (예: 장남 - 정치적 지지도는 낮으나 합법적 후계자 / 없음)
[계승법]: (예: 남성 우선 장자 상속제 / 군사력 기반 실력 추대제 / 미정)

【 세력 상태 】
(플레이어가 통치자이거나 영지/세력을 보유한 경우 필수 출력. 없으면 "통치 중인 영지 없음" 출력)
(상태 서술어는 반드시 [재앙적/매우 낮음/낮음/보통/높음/매우 높음/탁월함/극한 수준] 중 하나만 사용)
[인구]: 수치(상태) | [세력 재정]: 수치(상태) | [행정력]: 수치(상태) | [치안]: 수치(상태) | [민심]: 수치(상태) | [병력]: 수치(상태) | [군사 준비도]: 수치(상태) | [정치 안정도]: 수치(상태) | [개발도]: 수치(상태)

【 외교 및 인간 관계 】
(관계에 변동이 있을 때만 갱신하며, 반드시 2가지 카테고리로 분리하여 출력)
▶ <인간 관계>: [NPC 이름] | 신뢰도 [0~100] - [단계] | 애정도(또는 우정도) [0~100] - [단계] | 관계: [요약 설명]
(※ 신뢰도 단계 룰: 경계 -> 의심 -> 중립 -> 호감 -> 신뢰 -> 동반)
(※ 애정도 단계 룰: 타인 -> 관심 -> 호감 -> 연심 -> 애정 -> 극애. 단, NPC의 성격 결함이 있거나 신뢰도는 낮고 애정도만 비정상적으로 높을 경우 '집착' 또는 '광애'로 특수 출력)
(※ 로맨스가 없는 우정도 단계 룰: 타인 -> 지인 -> 동료 -> 친구 -> 친우 -> 맹우)
▶ <세력 관계>: [세력/국가명] - [외교 상태, 예: 군사 동맹 / 교전 중]

【 목표 현황 】
[궁극적 목표]: [유저가 설정한 최종 목표]
[현재 단기 목표]: [궁극적 목표를 달성하기 위해 당장 이번 세대나 수년 내에 이룩해야 할 현실적인 퀘스트를 AI가 상황에 맞게 동적으로 부여]
[단기 목표 달성률]: [현재 단기 목표에 대한 성취도를 0~100 사이의 백분율로 표기, 예: 30%]
[전체 진행도]: [궁극적 목표 전체의 진행도. 반드시 0~100 사이의 정수로만 표기. 단기 목표 하나를 깰 때마다 10~15%씩 현실적으로 상승. 절대 100 초과 불가]
[목표 상태]: [진행 중 / 단기 목표 달성 / 최종 달성 / 치명적 위기]
[요약]: [현재 단기 목표를 향한 플레이어의 진행 상황과 달성하기 위해 필요한 조언]

【 OOO 선택지 】
(현재 상황에 맞춰 '일반 행동', '개인 전투', '국가/세력 전투', '돌발 위기' 중 가장 알맞은 것을 골라 'OOO' 부분을 채워 헤더를 작성하세요. 예: 【 개인 전투 선택지 】)
(현재 상황에 맞는 구체적인 선택지를 3~4개 제시하고, 마지막 선택지는 항상 '자유 행동'으로 고정하세요.)
1. [유형] 구체적인 행동 묘사 (딜레마 상황 권장)
   └ 예상 성공 가능성: 00% ~ 00% (최소 확률 ~ 최대 확률을 반드시 범위로 표기)
2. [유형] 구체적인 행동 묘사
   └ 예상 성공 가능성: 00% ~ 00%
3. [유형] 구체적인 행동 묘사
   └ 예상 성공 가능성: 00% ~ 00%
4. 자유 행동
   └ 판정: 직접 텍스트로 원하는 행동을 자유롭게 지시

【 엔딩 】
(오직 플레이어가 사망하거나, 최종 목표를 달성해 게임이 끝났을 때만 이 헤더를 출력하세요. 그동안의 일대기와 최후를 장엄하게 묘사하세요.)
`;

    // JSON Save System: 과거의 상태를 그대로 AI에게 주입하여 기억을 유지하게 만듭니다.
    let userPrompt = "";
    if (isInitialSetup) {
       if (action.previousState) {
         userPrompt = `[세대 교체 발동] 이전 턴에서 캐릭터가 사망(또는 퇴위)했습니다.\n이전 턴의 세계 상태(JSON): ${JSON.stringify(action.previousState)}\n\n다음의 [새로운 후계자 설정]을 바탕으로 세대가 교체된 새로운 오프닝 시나리오와 첫 번째 선택지들을 생성하세요.\n[새로운 후계자 설정]\n${JSON.stringify(action, null, 2)}\n\n위의 정해진 포맷을 반드시 지켜서 응답하세요.`;
       } else {
         userPrompt = `게임의 첫 시작입니다. 다음의 [초기 설정]을 바탕으로 오프닝 시나리오와 첫 번째 선택지들을 생성하세요.\n\n[초기 설정]\n${JSON.stringify(action, null, 2)}\n\n위의 정해진 포맷을 반드시 지켜서 응답하세요.`;
       }
    } else if (!currentState) {
       userPrompt = `게임의 첫 시작입니다. 유비(32세, 평민)가 낙양의 골목길에서 비밀 서신을 쥐고 있는 상황에서 시작해주세요. 위의 정해진 포맷을 반드시 지켜서 응답하세요.`;
    } else {
       userPrompt = `이전 턴의 게임 상태(JSON): ${JSON.stringify(currentState)}\n\n플레이어의 행동: ${action}\n\n이 행동을 판정하고, 인과율에 맞춰 다음 턴의 상태를 위의 엄격한 포맷에 맞춰 텍스트로 반환하세요.`;
    }

    let maxRetries = 2;
    let finalParsedData = null;
    let finalResponseText = "";
    
    while(maxRetries > 0) {
      const result = await model.generateContent({
         contents: [{ role: "user", parts: [{ text: systemInstruction + "\n\n" + userPrompt }] }]
      });

      finalResponseText = result.response.text();
      finalParsedData = parseLLMResponse(finalResponseText);

      // Validation Rules
      let errorMsgs = [];
      
      // 1. Check Faction State
      if (currentState?.factionState && Object.keys(currentState.factionState).length > 0 && !currentState.factionState.none) {
         if (!finalParsedData.factionState) {
            errorMsgs.push("【 세력 상태 】 블록이 누락되었습니다. 플레이어는 영지/세력을 보유하고 있으므로 반드시 9개 스탯을 출력해야 합니다.");
         } else if (!finalParsedData.factionState.none && Object.keys(finalParsedData.factionState).length < 9) {
            errorMsgs.push("【 세력 상태 】의 스탯 개수가 9개가 아닙니다. 룰북에 명시된 9개 항목(인구, 세력 재정, 행정력, 치안, 민심, 병력, 군사 준비도, 정치 안정도, 개발도)을 모두 누락 없이 출력하세요.");
         }
      }
      
      // 2. Check Traits
      if (currentState?.traits && currentState.traits.length > 0) {
         if (!finalParsedData.traits || finalParsedData.traits.length === 0) {
            errorMsgs.push("【 특성 및 기술 】 항목이 누락되었거나 비어 있습니다. 변동이 없더라도 기존의 특성을 절대 생략하지 말고 모두 출력하세요.");
         }
      }

      // 3. Check Inventory
      if (currentState?.inventory && Object.keys(currentState.inventory).length > 0) {
         if (!finalParsedData.inventory || Object.keys(finalParsedData.inventory).length === 0) {
            errorMsgs.push("【 소지품 / 자원 】 항목이 누락되었거나 비어 있습니다. 기존의 자원을 생략하지 말고 모두 출력하세요.");
         }
      }

      if (errorMsgs.length > 0 && maxRetries > 1) {
         console.warn("Validation failed. Retrying... Errors:", errorMsgs);
         userPrompt += `\n\n[SYSTEM ERROR - AUTO CORRECTION]\n당신이 생성할 응답에서 다음의 규칙 위반이 예상(또는 발생)되었습니다:\n${errorMsgs.map(e => "- " + e).join("\n")}\n\n이 피드백을 반영하여 반드시 위의 엄격한 포맷을 모두 지켜서 다시 텍스트를 생성하십시오.`;
         maxRetries--;
      } else {
         break; // Success or out of retries
      }
    }

    return new Response(JSON.stringify({ raw: finalResponseText, parsed: finalParsedData }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate response" }), { status: 500 });
  }
}
