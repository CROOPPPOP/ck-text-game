// Single Source of Truth (SSOT) for Faction Relations, Normalization & Deduplication
// 세력 간 외교 상태의 명칭 이형태(성당 ↔ 대성당, 공국 ↔ 공작령 등)를 정규화하고 중복 쪼개짐을 완벽 방지

export type HostilityTier = 0 | 1 | 2 | 3 | 4;

export interface FactionHostility {
  score: number;             // 0 ~ 100
  tier: HostilityTier;       // 0: 평화·우호, 1: 경계·경쟁, 2: 긴장·마찰, 3: 위기·적대, 4: 전면 전쟁
  tierLabel: string;         // 'Lv.0 평화·우호', 'Lv.1 경계·경쟁', 'Lv.2 긴장·마찰', 'Lv.3 위기·적대', 'Lv.4 전면 전쟁'
  color: string;             // Hex color code
  bgColor: string;           // RGBA background
  borderColor: string;       // Border color
  activeThreats: string[];   // 발동 중인 위협 및 디버프
  mitigationTips: string[];  // 완화 및 해소 방안
}

export interface ParsedFactionRelation {
  raw: string;
  name: string;           // 표시용 세력명 (예: '[우르비노 주교좌 대성당]')
  cleanName: string;      // 괄호 제거된 세력명 (예: '우르비노 주교좌 대성당')
  canonicalKey: string;   // 정규화된 고유 키 (예: '우르비노주교좌성당')
  status: string;         // 외교 상태 (예: '주종 관계(교구 재정관 겸 참사회 수석위원)')
  threat: string;         // 위협도 (예: '안전')
  threatLevel: string;    // 위협도 별칭
  attitude: string;       // 태도 (예: '우호적')
  hostility: FactionHostility; // 5단계 적대도 및 정량 위기 지표
}

/**
 * 외교 상태, 위협도, 태도 및 원본 텍스트를 종합 분석하여
 * 0~100의 정량 적대도 점수와 5단계 위기 레벨(Lv.0~4)을 산출합니다.
 */
export function calculateFactionHostility(
  status: string = '',
  threat: string = '',
  attitude: string = '',
  rawText: string = ''
): FactionHostility {
  const combined = `${status} ${threat} ${attitude} ${rawText}`;
  
  // 0. 범용 구조적·이념적 적대 세력 (Structural & Ideological Rivals) 판별
  // 신성 로마 제국 황제파(기벨린), 이단, 대립 교황, 반란군, 약탈 도적단 등 역사적/이념적으로 양립 불가능한 대립 세력
  const structuralRivalKeywords = [
    '신성 로마 제국', '신성로마제국', '황제파', '기벨린', '이단', '이단심문', '대립 교황', '대립교황',
    '반란군', '반역도당', '도적단', '해적단', '숙적', '철천지원수', '침략군', '토벌 대상'
  ];
  const isStructuralRival = structuralRivalKeywords.some(kw => combined.includes(kw));

  // 1. 명시적 숫자 추출 (예: '적대도 70', '적대: 80', '적대도: [65]')
  const explicitScoreMatch = combined.match(/적대(?:도)?\s*[:\s\[\(]?\s*(\d+)/);
  let score: number = 0;

  if (explicitScoreMatch) {
    score = Math.min(100, Math.max(0, parseInt(explicitScoreMatch[1], 10)));
  } else {
    // 2. 키워드 기반 기본 점수 산출
    let base = 20; // 기본 평화/중립치

    // 위협도
    if (threat.includes('치명') || threat.includes('파멸') || threat.includes('극도')) base += 50;
    else if (threat.includes('위험') || threat.includes('높음')) base += 35;
    else if (threat.includes('경계') || threat.includes('보통')) base += 15;
    else if (threat.includes('안전') || threat.includes('낮음')) base -= 10;

    // 태도
    if (attitude.includes('전쟁') || attitude.includes('교전') || attitude.includes('증오') || attitude.includes('극적대')) base += 40;
    else if (attitude.includes('적대') || attitude.includes('원한') || attitude.includes('불신') || attitude.includes('적의')) base += 25;
    else if (attitude.includes('경계') || attitude.includes('냉담') || attitude.includes('냉정')) base += 10;
    else if (attitude.includes('우호') || attitude.includes('친선') || attitude.includes('동맹')) base -= 20;

    // 상태/지위
    if (status.includes('전쟁') || status.includes('침공') || status.includes('토벌') || status.includes('봉쇄')) base += 35;
    else if (status.includes('경쟁') || status.includes('분쟁') || status.includes('갈등') || status.includes('압박')) base += 15;
    else if (status.includes('동맹') || status.includes('주종') || status.includes('신종') || status.includes('조약')) base -= 20;

    score = Math.min(100, Math.max(0, base));
  }

  // 구조적 적대 세력 가드레일: 일시적으로 무력화되거나 도발을 포기했더라도 결코 평화·우호(Lv.0)가 될 수 없음 (최소 Lv.3 위기·적대 유지)
  if (isStructuralRival) {
    score = Math.max(score, 68);
  }

  // 3. 5단계 Tier 및 세부 메타 결정
  let tier: HostilityTier = 0;
  let tierLabel = 'Lv.0 평화·우호';
  let color = '#10b981';
  let bgColor = 'rgba(16, 185, 129, 0.15)';
  let borderColor = '#059669';
  let activeThreats: string[] = ['안정적인 국경 및 상호 우호 조약 유지'];
  let mitigationTips: string[] = ['정기 외교 서신 교환', '공동 축제 및 종교 축일 축하'];

  if (score >= 85 || combined.includes('전쟁') || combined.includes('교전')) {
    tier = 4;
    tierLabel = 'Lv.4 전면 전쟁';
    color = '#ef4444';
    bgColor = 'rgba(239, 68, 68, 0.25)';
    borderColor = '#b91c1c';
    activeThreats = ['전면 침공 및 공성전 개시', '직할령 약탈 및 수확물 소각', '모든 무역로 즉각 차단'];
    mitigationTips = ['무조건 항복 또는 막대한 전시 배상금 지급', '교황청/상위 군주의 즉각 정전 중재 요청', '동맹군 긴급 구원 요청'];
  } else if (score >= 65 || combined.includes('위기') || combined.includes('적대') || isStructuralRival) {
    tier = 3;
    tierLabel = 'Lv.3 위기·적대';
    color = '#f97316';
    bgColor = 'rgba(249, 115, 22, 0.2)';
    borderColor = '#ea580c';
    if (isStructuralRival) {
      activeThreats = [
        '잠복 중인 적대 세력의 재집결 및 기습 도발 위협',
        '배후 제국/본진과의 내통 및 정적 규합 공작',
        '교역로 및 국경 지대 잠재적 마찰'
      ];
      mitigationTips = [
        '주요 국경 요충지 상시 경계 배치',
        '교황청 및 마틸다 여백작과의 결속 공고화',
        '적대 진영 내 온건파 및 반대파 분열 공작'
      ];
    } else {
      activeThreats = ['국경 지역 약탈 및 사병 도발', '상단 대상 통행세 폭리 부과', '암살 및 흑색선전 공작'];
      mitigationTips = ['특사 파견 및 외교 선물 공여', '상호 불가침 밀약 체결', '교단 중재 및 영토 경계 협상'];
    }
  } else if (score >= 45 || combined.includes('긴장') || combined.includes('마찰')) {
    tier = 2;
    tierLabel = 'Lv.2 긴장·마찰';
    color = '#eab308';
    bgColor = 'rgba(234, 179, 8, 0.2)';
    borderColor = '#ca8a04';
    activeThreats = ['외교적 비난 및 관계 냉각', '교역 물품 검문 강화', '정치적 견제 투서'];
    mitigationTips = ['친선 연회 초대', '상업 이권 분할 협약', '상급자/주군을 통한 외교적 화해'];
  } else if (score >= 25 || combined.includes('경계') || combined.includes('경쟁')) {
    tier = 1;
    tierLabel = 'Lv.1 경계·경쟁';
    color = '#38bdf8';
    bgColor = 'rgba(56, 189, 248, 0.15)';
    borderColor = '#0284c7';
    activeThreats = ['세력권 확장 경쟁', '상업 길드 내 알력 다툼'];
    mitigationTips = ['호의적 서신 및 특산품 교환', '합동 순찰 또는 사절 영접'];
  }

  return {
    score,
    tier,
    tierLabel,
    color,
    bgColor,
    borderColor,
    activeThreats,
    mitigationTips
  };
}

/**
 * 세력명의 형태적 이형태(대성당/성당, 공국/공작령, 대괄호/불릿 등)를 정규화하여
 * 동일 세력을 식별할 수 있는 표준 고유 키를 추출합니다.
 */
export function getCanonicalFactionKey(raw: string): string {
  if (!raw) return '';

  // 1. 접두 불릿 및 대괄호 제거
  let clean = raw
    .replace(/^[▶▷○•\-\s]+/, '')
    .trim();

  // 외교 상태 구분자('-' 또는 '|')가 포함되어 있다면 세력명 부분만 분리
  if (clean.includes('-')) {
    clean = clean.split('-')[0].trim();
  } else if (clean.includes('|')) {
    clean = clean.split('|')[0].trim();
  }

  // 괄호 및 기호 제거
  clean = clean.replace(/[\[\]\(\)\{\}]/g, '').trim();

  // 2. 공백 제거 정규화
  let normalized = clean.replace(/\s+/g, '');

  // 3. 종교, 관직, 행정 기관 경칭/접두어 정규화
  // '대성당' ↔ '성당'
  // '대교구' ↔ '교구'
  // '대수도원' ↔ '수도원'
  // '대공국' ↔ '공국' ↔ '공작령'
  normalized = normalized
    .replace(/대성당/g, '성당')
    .replace(/대교구/g, '교구')
    .replace(/대수도원/g, '수도원')
    .replace(/대공국/g, '공국')
    .replace(/공작령/g, '공국')
    .replace(/백작령/g, '백국')
    .replace(/후작령/g, '후국')
    .replace(/남작령/g, '남작령')
    .replace(/시뇨리아/g, '공화국');

  return normalized;
}

/**
 * 두 세력명이 실질적으로 동일한 세력(동일 주교좌, 동일 가문, 동일 국가 등)을 가리키는지 정밀 판별합니다.
 */
export function isSameFaction(nameA: string, nameB: string): boolean {
  if (!nameA || !nameB) return false;

  const keyA = getCanonicalFactionKey(nameA);
  const keyB = getCanonicalFactionKey(nameB);

  // 1. 완전 정규화 키 일치 (예: '우르비노주교좌성당' vs '우르비노주교좌대성당' -> 둘 다 '우르비노주교좌성당')
  if (keyA === keyB) return true;

  // 2. 기관 및 국가 접미사를 뗀 핵심 고유명사 루트 비교
  const stripSuffixes = (s: string) => 
    s.replace(/(성당|교구|수도원|공화국|공국|백국|왕국|제국|가문|상단|용병단|길드)$/g, '');

  const rootA = stripSuffixes(keyA);
  const rootB = stripSuffixes(keyB);

  if (rootA.length >= 3 && rootB.length >= 3 && rootA === rootB) {
    // 둘 다 종교 도메인이거나, 한쪽이 기관 접미사가 생략된 경우 (예: '우르비노주교좌' vs '우르비노주교좌성당')
    const isClergyA = /성당|교구|수도원|주교좌/.test(keyA);
    const isClergyB = /성당|교구|수도원|주교좌/.test(keyB);
    if ((isClergyA && isClergyB) || (!isClergyA && isClergyB) || (isClergyA && !isClergyB)) {
      return true;
    }

    // 둘 다 귀족/국가 도메인인 경우
    const isNobleA = /공국|백국|왕국|제국|공화국/.test(keyA);
    const isNobleB = /공국|백국|왕국|제국|공화국/.test(keyB);
    if ((isNobleA && isNobleB) || (!isNobleA && isNobleB) || (isNobleA && !isNobleB)) {
      return true;
    }
  }

  // 3. 상호 포함 관계 (길이 4글자 이상이고 도메인이 일치할 때)
  if (keyA.length >= 4 && keyB.length >= 4) {
    if (keyA.includes(keyB) || keyB.includes(keyA)) {
      const isClergyA = /성당|교구|수도원|주교좌/.test(keyA);
      const isClergyB = /성당|교구|수도원|주교좌/.test(keyB);
      if (isClergyA === isClergyB) return true;
    }
  }

  return false;
}

/**
 * 단일 세력 관계 문자열을 구조화된 객체로 파싱합니다.
 */
export function parseFactionRelation(rel: string): ParsedFactionRelation {
  const match = rel.match(/^(.*?)\s+-\s+(.*)$/);
  const rawName = match ? match[1].replace(/^[▶▷○•\s]+/, '').trim() : rel;
  const rest = match ? match[2].trim() : '';
  const pipeParts = rest.split('|').map(p => p.trim());
  let status = pipeParts[0] || '미상';

  let threat = '';
  let attitude = '';
  pipeParts.slice(1).forEach(p => {
    if (p.startsWith('위협도:')) threat = p.replace('위협도:', '').trim();
    if (p.startsWith('태도:')) attitude = p.replace('태도:', '').trim();
  });

  const cleanName = rawName.replace(/[\[\]]/g, '').trim();
  const canonicalKey = getCanonicalFactionKey(rawName);

  // 구조적 대적 세력 가드레일 (신성 로마 제국 황제파, 이단, 반란군 등)
  const combinedCheck = `${cleanName} ${status} ${threat} ${attitude} ${rel}`;
  const structuralRivalKeywords = [
    '신성 로마 제국', '신성로마제국', '황제파', '기벨린', '이단', '이단심문', '대립 교황', '대립교황',
    '반란군', '반역도당', '도적단', '해적단', '숙적', '철천지원수'
  ];
  const isStructuralRival = structuralRivalKeywords.some(kw => combinedCheck.includes(kw));

  if (isStructuralRival) {
    if (attitude.includes('복종') || attitude.includes('우호') || !attitude) {
      attitude = '적의 품음 (도발 억제)';
    }
    if (threat.includes('안전') || !threat) {
      threat = '경계 (잠복)';
    }
    if (status.includes('완전 무력화') || status.includes('도발 포기')) {
      status = '굴욕적 휴전 (토스카나 군세 전개에 따른 도발 억제)';
    }
  }

  const hostility = calculateFactionHostility(status, threat, attitude, rel);

  return {
    raw: rel,
    name: rawName.startsWith('[') ? rawName : `[${rawName}]`,
    cleanName,
    canonicalKey,
    status,
    threat,
    threatLevel: threat,
    attitude,
    hostility
  };
}

/**
 * 두 동일 세력 관계 중 더 최신이거나 더 상세한 정보를 기준으로 최적 병합합니다.
 */
export function mergeFactionRelationItem(olderStr: string, newerStr: string): string {
  const older = parseFactionRelation(olderStr);
  const newer = parseFactionRelation(newerStr);

  // 이름은 더 상세한 쪽(예: '대성당' 표기나 글자 수가 긴 쪽) 우선 채택
  const bestName = (newer.cleanName.length >= older.cleanName.length)
    ? (newer.raw.split('-')[0].trim())
    : (older.raw.split('-')[0].trim());

  // 외교 상태는 최신(newer) 우선, 단 newer가 비어있다면 older 사용
  const bestStatus = (newer.status && newer.status !== '미상') ? newer.status : older.status;

  // 위협도와 태도는 최신 우선 보존
  const bestThreat = newer.threat || older.threat || '안전';
  const bestAttitude = newer.attitude || older.attitude || '우호적';

  return `${bestName} - ${bestStatus} | 위협도: ${bestThreat} | 태도: ${bestAttitude}`;
}

/**
 * 세력 관계 배열에서 동일 세력(예: '우르비노 주교좌 성당'과 '우르비노 주교좌 대성당')의 중복을 찾아
 * 단일 항목으로 압축/통합(Deduplication)합니다.
 */
export function mergeAndDeduplicateFactionRelations(factions: string[] = []): string[] {
  if (!Array.isArray(factions) || factions.length === 0) return [];

  const result: string[] = [];

  factions.forEach(item => {
    if (!item || typeof item !== 'string' || !item.trim()) return;

    // 사망/멸망 필터링
    if (item.includes('(멸망)') || item.includes('멸망함') || item.includes('단절됨')) return;

    const existingIndex = result.findIndex(existing => isSameFaction(existing, item));

    if (existingIndex !== -1) {
      // 이미 같은 세력이 존재하므로, 더 최신/상세한 정보로 병합하여 대체
      result[existingIndex] = mergeFactionRelationItem(result[existingIndex], item);
    } else {
      result.push(item.trim());
    }
  });

  return result;
}

/**
 * 이전 턴(prev)과 새 턴(new)의 세력 관계 배열을 안전하고 스마트하게 병합합니다.
 */
export function mergeFactionLists(prevFactions: string[] = [], newFactions: string[] = []): string[] {
  const combined = [...prevFactions, ...newFactions];
  return mergeAndDeduplicateFactionRelations(combined);
}

/**
 * 전체 세력 중 가장 높은 위협/적대도를 가진 세력 및 위기 상태를 추출합니다 (HUD 경보용).
 */
export function getHighestThreatFaction(factions: string[] = []): {
  maxHostility: FactionHostility;
  factionName: string;
  hasThreat: boolean;
} {
  if (!factions || factions.length === 0) {
    return {
      maxHostility: calculateFactionHostility('', '', ''),
      factionName: '',
      hasThreat: false
    };
  }

  const parsed = factions.map(f => parseFactionRelation(f));
  let highest = parsed[0];
  for (let i = 1; i < parsed.length; i++) {
    if (parsed[i].hostility.score > highest.hostility.score) {
      highest = parsed[i];
    }
  }

  return {
    maxHostility: highest.hostility,
    factionName: highest.cleanName,
    hasThreat: highest.hostility.tier >= 2 // Lv.2 긴장·마찰 이상일 때 상단 HUD 경보 발령
  };
}

/**
 * LLM 프롬프트 주입용 세력 적대도 및 위기 단계 요약 포맷터
 */
export function formatFactionHostilityForPrompt(factions: string[] = []): string {
  if (!factions || factions.length === 0) return '';
  const parsed = factions.map(f => parseFactionRelation(f));
  const lines = parsed.slice(0, 5).map(p => {
    return `- [${p.cleanName}] (${p.hostility.tierLabel} | 적대도 ${p.hostility.score}/100 | 태도: ${p.attitude || '중립'} | 위협도: ${p.threat || '보통'})
  * 직면 위협: ${p.hostility.activeThreats.join(', ')}
  * 해소 수단: ${p.hostility.mitigationTips.join(', ')}`;
  });

  return `[세력 간 적대도 및 위기 단계 (Faction Hostility SSOT)]
다음 세력들과의 적대도(0~100)와 5단계 위기 레벨에 맞춰 국경 충돌, 교역 제한, 전면 전쟁 등의 외교적 위기 및 결단 선택지를 생성하세요:
${lines.join('\n')}`;
}

