export interface ChronicleItem {
  turn: number;
  dateLocation?: string;
  action: string;
  result?: string;
  summary?: string;
}

export interface ParsedState {
  estate?: { 
    type: string; 
    level: string; 
    buildings: { name: string; desc: string; level: number; tags: string[] }[]; 
  };
  buildOptions?: { 
    name: string; 
    cost: string; 
    turns: number; 
    desc: string; 
    kind?: 'new' | 'upgrade' | 'promote'; 
    targetLevel?: number; 
    tags?: string[]; 
  }[];
  constructionRejected?: string[];
  longTermPlan?: string | null;
  judgment?: { result: string; positive: string; negative: string; };
  dateLocation?: string;
  narrative?: string;
  personalInfo?: Record<string, string>;
  playerStatus?: Array<{ name: string; value: string; risk: string; description: string }>;
  stats?: { innate: Record<string, string>; acquired: Record<string, string> };
  traits?: Array<{ category: string; name: string; tier?: string; description: string }>;
  inventory?: Record<string, string[]>;
  factionState?: Record<string, string>;
  relationships?: { personal: string[], faction: string[] };
  objective?: { ultimateGoal: string; currentGoal: string; currentProgress: string; totalProgress: string; status: string; summary: string };
  familyState?: { spouse: string; children: string; heir: string; successionLaw: string };
  historicalTag?: string;
  choices?: Array<{ id: string; type: string; text: string; probability: string; groupType?: string }>;
  ending?: string;
  environment?: Record<string, string>;
  chronicle?: ChronicleItem[];
}

export function parseLLMResponse(text: string): ParsedState {
  const result: ParsedState = {};

  // 헬퍼 함수: 특정 헤더(예: '현재 상황') 안의 내용을 추출합니다.
  const extractSection = (headerPattern: string) => {
    // 【 헤더 】 부터 다음 【 헤더 】가 나오기 전까지 추출 (공백 유연하게 허용)
    const regex = new RegExp(`【\\s*${headerPattern}\\s*】\\s*\\n([\\s\\S]*?)(?=\\n\\s*【|$)`);
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  };

  // 1. 현재 상황 (메인 서사)
  const narrativeMatch = extractSection('현재 상황');
  if (narrativeMatch) {
    result.narrative = narrativeMatch.trim();
    const tagMatch = result.narrative.match(/\[역사적 고증:\s*(.*?)\]/);
    if (tagMatch) {
      result.historicalTag = tagMatch[1].trim();
      result.narrative = result.narrative.replace(tagMatch[0], '').trim();
    }
  }

  // 2. 주변 정세 및 환경
  const envMatch = extractSection('주변 정세 및 환경');
  if (envMatch) {
    const env: Record<string, string> = {};
    envMatch.split('\n').forEach(line => {
      // AI가 **[국경 동향]:** 이나 - [국경 동향]: 등으로 출력할 수 있으므로 느슨하게 매칭
      const match = line.match(/\[(.*?)\]\s*[:：]?\s*(.*)/);
      if (match) {
        const key = match[1].replace(/[*_]/g, '').trim();
        const val = match[2].replace(/[*_]/g, '').trim();
        if (key && val) env[key] = val;
      }
    });
    // 키가 하나도 없더라도 원문 자체가 있으면 임의의 키로 통째로 넣기 (오류 방지)
    if (Object.keys(env).length === 0 && envMatch.trim().length > 0) {
      env['환경 정보'] = envMatch.trim();
    }
    
    if (Object.keys(env).length > 0) result.environment = env;
  }

  // 2.5 날짜 / 위치
  result.dateLocation = extractSection('날짜 / 위치') || undefined;

  // 3. 판정 결과 (있을 경우)
  const judgmentMatch = extractSection('판정 결과');
  if (judgmentMatch) {
    result.judgment = { result: '', positive: '', negative: '' };
    judgmentMatch.split('\n').forEach(line => {
      if (line.startsWith('[최종 결과]:')) result.judgment!.result = line.replace('[최종 결과]:', '').trim();
      else if (line.startsWith('[긍정적 요인') || line.startsWith('[긍정적 요인(핵심')) result.judgment!.positive = line.replace(/\[긍정적 요인.*?\]:/, '').trim();
      else if (line.startsWith('[부정적 요인') || line.startsWith('[부정적 요인(배제')) result.judgment!.negative = line.replace(/\[부정적 요인.*?\]:/, '').trim();
    });
  }

  // 3.5 엔딩 (게임 오버 또는 클리어)
  result.ending = extractSection('엔딩') || undefined;

  // 4. 개인 정보 파싱 (이름: 유비 | 나이: 32세 ...)
  const personalInfoMatch = extractSection('개인 정보');
  if (personalInfoMatch) {
    const info: Record<string, string> = {};
    personalInfoMatch.split('|').forEach(part => {
      const [key, value] = part.split(':').map(s => s.trim());
      if (key && value) info[key] = value;
    });
    result.personalInfo = info;
  }

  // 5. 플레이어 상태 파싱 (예: [건강](86, 최상 — 전반적으로 양호))
  const playerStatusMatch = extractSection('플레이어 상태');
  if (playerStatusMatch) {
    result.playerStatus = [];
    const lines = playerStatusMatch.split('\n');
    lines.forEach(line => {
      const match = line.match(/\[(.*?)\]\((.*?),\s*(.*?)\s*—\s*(.*?)\)/);
      if (match) {
        result.playerStatus!.push({
          name: match[1].trim(),
          value: match[2].trim(),
          risk: match[3].trim(),
          description: match[4].trim()
        });
      }
    });
  }

  // 6. 개인 능력치 파싱 (선천/후천 카테고리 분리)
  const statsMatch = extractSection('개인 능력치');
  if (statsMatch) {
    result.stats = { innate: {}, acquired: {} };
    let currentCategory: 'innate' | 'acquired' = 'innate';
    const statsLines = statsMatch.split('\n');
    statsLines.forEach(line => {
      if (line.includes('[선천 능력치]')) {
        currentCategory = 'innate';
      } else if (line.includes('[후천 능력치]')) {
        currentCategory = 'acquired';
      } else {
        line.split('|').forEach(part => {
          const [key, value] = part.split(':').map(s => s.trim());
          if (key && value) result.stats![currentCategory][key] = value;
        });
      }
    });
  }

  // 6.5 특성 및 기술 파싱
  const traitsMatch = extractSection('특성 및 기술');
  if (traitsMatch) {
    result.traits = [];
    const lines = traitsMatch.split('\n');
    lines.forEach(line => {
      const match = line.match(/\[(.*?)\]\s*(.*?):\s*(.*)/);
      if (match) {
        let nameRaw = match[2].trim();
        let tier = '';
        const tierMatch = nameRaw.match(/^(.*?)\((.*?)\)$/);
        if (tierMatch) {
          nameRaw = tierMatch[1].trim();
          tier = tierMatch[2].trim();
        }
        result.traits!.push({
          category: match[1].trim(),
          name: nameRaw,
          tier: tier || undefined,
          description: match[3].trim()
        });
      } else {
         const fallbackMatch = line.match(/\[(.*?)\]\s*(.*)/);
         if (fallbackMatch && !fallbackMatch[1].includes('특성')) {
           result.traits!.push({
             category: '일반특성',
             name: fallbackMatch[1].trim(),
             description: fallbackMatch[2].replace(/^- /, '').trim()
           });
         } else if (fallbackMatch) {
            const nameMatch = fallbackMatch[2].match(/^(\S+)\s+(.*)/);
            if(nameMatch) {
               let nameRaw = nameMatch[1].trim();
               let tier = '';
               const tierMatch = nameRaw.match(/^(.*?)\((.*?)\)$/);
               if (tierMatch) {
                 nameRaw = tierMatch[1].trim();
                 tier = tierMatch[2].trim();
               }
               result.traits!.push({
                 category: fallbackMatch[1].trim(),
                 name: nameRaw,
                 tier: tier || undefined,
                 description: nameMatch[2].trim()
               });
            }
         }
      }
    });
    if (result.traits!.length === 0) delete result.traits;
  }

  // 7. 소지품 / 자원 파싱
  const inventoryMatch = extractSection('소지품 / 자원');
  if (inventoryMatch) {
    result.inventory = {};
    let currentCategory = '';
    const lines = inventoryMatch.split('\n');
    lines.forEach(line => {
      if (line.startsWith('▶')) {
        currentCategory = line.replace('▶', '').replace('<', '').replace('>', '').replace(':', '').trim();
        result.inventory![currentCategory] = [];
      } else if (line.startsWith('○') && currentCategory) {
        result.inventory![currentCategory].push(line.replace('○', '').trim());
      }
    });
    if (Object.keys(result.inventory!).length === 0) delete result.inventory;
  }

  // 7.5 세력 상태 파싱
  const factionStateMatch = extractSection('세력 상태');
  if (factionStateMatch) {
    if (factionStateMatch.includes('통치 중인 영지 없음')) {
      result.factionState = { none: "true" };
    } else {
      result.factionState = {};
      const parts = factionStateMatch.split('|');
      parts.forEach(part => {
        const match = part.match(/\[(.*?)\]:\s*(.*)/);
        if (match) {
          result.factionState![match[1].trim()] = match[2].trim();
        }
      });
      if (Object.keys(result.factionState).length === 0) delete result.factionState;
    }
  }

  // 7.6 외교 및 인간 관계 파싱
  const relationshipsMatch = extractSection('외교 및 인간 관계');
  if (relationshipsMatch) {
    result.relationships = { personal: [], faction: [] };
    let currentCat = '';
    const lines = relationshipsMatch.split('\n');
    lines.forEach(line => {
      if (line.includes('<인간 관계>')) currentCat = 'personal';
      else if (line.includes('<세력 관계>')) currentCat = 'faction';
      else if (line.trim() !== '') {
        const rel = line.replace('▶', '').trim();
        if (currentCat === 'personal') result.relationships!.personal.push(rel);
        if (currentCat === 'faction') result.relationships!.faction.push(rel);
      }
    });
    if (result.relationships.personal.length === 0 && result.relationships.faction.length === 0) {
      delete result.relationships;
    }
  }

  // 8. 선택지 파싱 (여러 종류의 선택지 블록을 모두 탐색)
  const choices: any[] = [];
  const choiceBlocks = text.match(/【 (.*?) 선택지 】\n([\s\S]*?)(?=\n【 |$)/g);
  
  if (choiceBlocks) {
    choiceBlocks.forEach(block => {
      const typeMatch = block.match(/【 (.*?) 선택지 】/);
      const groupType = typeMatch ? typeMatch[1].trim() : '일반 행동';
      
      const blockLines = block.split('\n');
      let currentChoice: any = null;
      
      blockLines.forEach(line => {
        // 정규식: "1. [일반 행동] 서신을 숨긴다." 추출
        const choiceMatch = line.match(/^(\d+)\.\s*\[(.*?)\]\s*(.*)/);
        if (choiceMatch) {
          if (currentChoice) choices.push(currentChoice);
          currentChoice = {
            id: choiceMatch[1],
            type: choiceMatch[2],
            text: choiceMatch[3].trim(),
            probability: '',
            groupType: groupType
          };
        } else if (line.includes('예상 성공 가능성:') || line.includes('예상 승리 가능성:') || line.includes('판정:')) {
           if(currentChoice) currentChoice.probability = line.replace('└', '').trim();
        }
      });
      if (currentChoice) choices.push(currentChoice);
    });
    result.choices = choices;
  }

  // 9. 현재 국면 및 야망 파싱 (기존 목표 현황 대체)
  const phaseMatch = extractSection('현재 국면 및 야망') || extractSection('목표 현황');
  if (phaseMatch) {
    result.objective = { ultimateGoal: '', currentGoal: '', currentProgress: '', totalProgress: '', status: '', summary: '' };
    phaseMatch.split('\n').forEach(line => {
      const cleanLine = line.trim();
      if (cleanLine.startsWith('[현재 주요 국면]:')) result.objective!.ultimateGoal = cleanLine.replace('[현재 주요 국면]:', '').trim();
      else if (cleanLine.startsWith('[단기 야망]:')) result.objective!.currentGoal = cleanLine.replace('[단기 야망]:', '').trim();
      else if (cleanLine.startsWith('[진행 상태]:')) result.objective!.status = cleanLine.replace('[진행 상태]:', '').trim();
      else if (cleanLine.startsWith('[상황 요약]:')) result.objective!.summary = cleanLine.replace('[상황 요약]:', '').trim();
      // 호환성
      else if (cleanLine.startsWith('[궁극적 목표]:')) result.objective!.ultimateGoal = cleanLine.replace('[궁극적 목표]:', '').trim();
      else if (cleanLine.startsWith('[현재 단기 목표]:')) result.objective!.currentGoal = cleanLine.replace('[현재 단기 목표]:', '').trim();
      else if (cleanLine.startsWith('[요약]:')) result.objective!.summary = cleanLine.replace('[요약]:', '').trim();
    });
  }

    // 9.5 영지 및 야영지 상태 파싱
  const estateMatch = extractSection('영지 및 야영지 상태') || extractSection('거점 및 야영지 상태');
  if (estateMatch) {
    result.estate = { type: '거점 없음', level: '', buildings: [] };
    estateMatch.split('\n').forEach(line => {
      const cleanLine = line.trim();
      if (cleanLine.startsWith('[거점 형태]:')) result.estate!.type = cleanLine.replace('[거점 형태]:', '').trim();
      else if (cleanLine.startsWith('[거점 규모]:')) result.estate!.level = cleanLine.replace('[거점 규모]:', '').trim();
      else if (/^[▶▷○•\-]/.test(cleanLine)) {
         const buildingMatch = cleanLine.match(/^[▶▷○•\-]\s*(.*?)(?:\[(.*?)\])?:\s*(.*)/);
         if (buildingMatch) {
             const nameWithLv = buildingMatch[1].trim();
             const rawTags = buildingMatch[2] ? buildingMatch[2].trim() : '';
             const desc = buildingMatch[3].trim();

             const lvMatch = nameWithLv.match(/Lv\.?\s*(\d+)/i);
             const level = lvMatch ? parseInt(lvMatch[1], 10) : 1;

             const tags = rawTags ? rawTags.split(/[·,\s]+/).filter(Boolean) : ['기타'];

             result.estate!.buildings.push({ 
               name: nameWithLv, 
               desc: desc,
               level: level,
               tags: tags
             });
         } else {
             const fallbackName = cleanLine.replace(/^[▶▷○•\-]/, '').trim();
             result.estate!.buildings.push({ name: fallbackName, desc: '', level: 1, tags: ['기타'] });
         }
      }
    });
    if (result.estate.type === '거점 없음' && result.estate.buildings.length === 0) {
      delete result.estate;
    }
  }

  // 9.6 건설 가능 시설 및 건설 거부 파싱 (투트랙 영지 건설)
  const buildSection = extractSection('건설 가능 시설');
  if (buildSection) {
    const options: { 
      name: string; 
      cost: string; 
      turns: number; 
      desc: string; 
      kind?: 'new' | 'upgrade' | 'promote'; 
      targetLevel?: number; 
      tags?: string[]; 
    }[] = [];
    const rejected: string[] = [];
    buildSection.split('\n').forEach(raw => {
      const line = raw.replace(/[*_]/g, '').trim();
      if (!line) return;
      const rej = line.match(/\[건설 거부\s*[:：]\s*(.*?)\]/);
      if (rej) {
        const nm = rej[1].split(/\s[-–—]\s/)[0].trim();
        if (nm) rejected.push(nm);
        return;
      }
      if (!/^[▶▷○•\-]/.test(line)) return;
      const parts = line.replace(/^[▶▷○•\-]\s*/, '').split('|').map(s => s.trim()).filter(Boolean);
      if (parts.length < 2) return;
      
      const rawNameAndTags = parts[0];
      const tagsMatch = rawNameAndTags.match(/\[(.*?)\]/);
      const rawTags = tagsMatch ? tagsMatch[1] : '';
      const nameMatchRaw = rawNameAndTags.replace(/\[.*?\]/, '').trim();
      const name = nameMatchRaw.replace(/^\[|\]$/g, '').trim();

      if (!name || /^(없음|건설 불가)/.test(name)) return;
      let cost = '';
      let desc = '';
      let turns = 3;
      let kind: 'new' | 'upgrade' | 'promote' = 'new';
      let targetLevel = 1;

      const upgradeMatch = name.match(/Lv\.?(\d+)\s*→\s*(\d+)/i) || name.match(/→\s*Lv\.?(\d+)/i);
      if (upgradeMatch) {
        kind = 'upgrade';
        if (upgradeMatch.length === 3) {
          targetLevel = parseInt(upgradeMatch[2], 10);
        } else {
          targetLevel = parseInt(upgradeMatch[1], 10);
        }
      } else if (name.includes('승격')) {
        kind = 'promote';
      }

      const tags = rawTags ? rawTags.split(/[·,\s]+/).filter(Boolean) : [];

      parts.slice(1).forEach(p => {
        const costM = p.match(/^비용\s*[:：]?\s*(.*)$/);
        const descM = p.match(/^효과\s*[:：]?\s*(.*)$/);
        const turnM = p.match(/^(\d+)\s*턴/);
        if (costM) cost = costM[1].trim();
        else if (descM) desc = descM[1].trim();
        else if (turnM) turns = Math.min(12, Math.max(1, parseInt(turnM[1], 10)));
        else if (p.includes('턴')) {
          const t = p.match(/(\d+)/);
          if (t) turns = Math.min(12, Math.max(1, parseInt(t[1], 10)));
        } else if (!cost) {
          cost = p;
        } else {
          desc = p;
        }
      });
      options.push({ name, cost, turns, desc, kind, targetLevel, tags: tags.length > 0 ? tags : undefined });
    });
    result.buildOptions = options;
    if (rejected.length > 0) result.constructionRejected = rejected;
  }

  // 10. 가문 및 계승 현황 파싱
  const familyMatch = extractSection('가문 및 계승 현황');
  if (familyMatch) {
    result.familyState = { spouse: '없음', children: '없음', heir: '없음', successionLaw: '미정' };
    familyMatch.split('\n').forEach(line => {
      if (line.startsWith('[배우자]:')) result.familyState!.spouse = line.replace('[배우자]:', '').trim();
      else if (line.startsWith('[자녀]:')) result.familyState!.children = line.replace('[자녀]:', '').trim();
      else if (line.startsWith('[지정 후계자]:')) result.familyState!.heir = line.replace('[지정 후계자]:', '').trim();
      else if (line.startsWith('[계승법]:')) result.familyState!.successionLaw = line.replace('[계승법]:', '').trim();
    });
  }

  // 11. 파서 정규화 로직 적용 (CK식 범용 규격 및 이상치 정규화)
  return normalizeParsedState(result);
}

/**
 * AI 환각 방지 및 UI 안정성을 위한 파서 정규화 엔진
 * 1. 6대 플레이어 생존 수치(건강, 체력, 허기, 갈증, 피로, 스트레스) 보장 및 클램핑
 * 2. 소지품 / 자원 서식 정규화
 * 3. 세력 상태 수치 규격화
 * 4. 선택지 식별자 및 번호 일관성 보정
 */
export function normalizeParsedState(state: ParsedState): ParsedState {
  // 1. 플레이어 6대 필수 생존 수치 정규화
  const CORE_METRICS = [
    { name: '건강', defaultVal: '85%', defaultRisk: '안전', defaultDesc: '기력 양호', isNegative: false },
    { name: '체력', defaultVal: '80%', defaultRisk: '안전', defaultDesc: '활동 가능', isNegative: false },
    { name: '허기', defaultVal: '25%', defaultRisk: '안전', defaultDesc: '충분히 식사함', isNegative: true },
    { name: '갈증', defaultVal: '20%', defaultRisk: '안전', defaultDesc: '수분 충분', isNegative: true },
    { name: '피로', defaultVal: '30%', defaultRisk: '안전', defaultDesc: '경미한 피로', isNegative: true },
    { name: '스트레스', defaultVal: '15%', defaultRisk: '안전', defaultDesc: '심신 평온', isNegative: true }
  ];

  const currentStatus = state.playerStatus || [];
  const normalizedStatus: Array<{ name: string; value: string; risk: string; description: string }> = [];

  CORE_METRICS.forEach(metric => {
    const existing = currentStatus.find(s => s.name.includes(metric.name));
    if (existing) {
      let numVal = 50;
      const match = existing.value.match(/(\d+)/);
      if (match) numVal = Math.max(0, Math.min(100, parseInt(match[1], 10)));

      // 위험도 보정
      let risk = existing.risk || metric.defaultRisk;
      if (!['안전', '주의', '위험', '치명'].some(r => risk.includes(r))) {
        if (metric.isNegative) {
          risk = numVal >= 80 ? '위험' : numVal >= 50 ? '주의' : '안전';
        } else {
          risk = numVal <= 30 ? '위험' : numVal <= 60 ? '주의' : '안전';
        }
      }

      normalizedStatus.push({
        name: metric.name,
        value: existing.value.includes('%') ? `${numVal}%` : `${numVal}`,
        risk,
        description: existing.description || metric.defaultDesc
      });
    } else {
      normalizedStatus.push({
        name: metric.name,
        value: metric.defaultVal,
        risk: metric.defaultRisk,
        description: metric.defaultDesc
      });
    }
  });

  // 특수 상태 이상(부상, 중독, 골절 등) 추가 유지
  currentStatus.forEach(s => {
    if (!CORE_METRICS.some(m => s.name.includes(m.name))) {
      normalizedStatus.push(s);
    }
  });
  state.playerStatus = normalizedStatus;

  // 2. 소지품 / 자원 서식 정규화
  if (state.inventory) {
    const cleanedInventory: Record<string, string[]> = {};
    Object.entries(state.inventory).forEach(([rawCat, items]) => {
      const cleanCat = rawCat.replace(/[▶▷<>:•\-\[\]]/g, '').trim();
      const cleanItems = items
        .map(i => i.replace(/^[○•\-\*▶▷]\s*/, '').trim())
        .filter(Boolean);
      if (cleanItems.length > 0) {
        cleanedInventory[cleanCat] = cleanItems;
      }
    });
    state.inventory = Object.keys(cleanedInventory).length > 0 ? cleanedInventory : undefined;
  }

  // 3. 선택지 번호 및 서식 일관화
  if (state.choices && state.choices.length > 0) {
    state.choices = state.choices.map((c, idx) => ({
      ...c,
      id: String(idx + 1),
      text: c.text.replace(/^\[.*?\]\s*/, '').trim() || c.text,
      probability: c.probability ? c.probability.replace(/^└\s*/, '').trim() : '예상 성공 가능성: 50% ~ 70%'
    }));
  }

  // 4. 날짜/위치 서식 정규화
  if (state.dateLocation) {
    state.dateLocation = state.dateLocation.replace(/[*_]/g, '').trim();
  }

  return state;
}
