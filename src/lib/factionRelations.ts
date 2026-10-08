// Single Source of Truth (SSOT) for Faction Relations, Normalization & Deduplication
// 세력 간 외교 상태의 명칭 이형태(성당 ↔ 대성당, 공국 ↔ 공작령 등)를 정규화하고 중복 쪼개짐을 완벽 방지

export interface ParsedFactionRelation {
  raw: string;
  name: string;           // 표시용 세력명 (예: '[우르비노 주교좌 대성당]')
  cleanName: string;      // 괄호 제거된 세력명 (예: '우르비노 주교좌 대성당')
  canonicalKey: string;   // 정규화된 고유 키 (예: '우르비노주교좌성당')
  status: string;         // 외교 상태 (예: '주종 관계(교구 재정관 겸 참사회 수석위원)')
  threat: string;         // 위협도 (예: '안전')
  attitude: string;       // 태도 (예: '우호적')
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
  const status = pipeParts[0] || '미상';

  let threat = '';
  let attitude = '';
  pipeParts.slice(1).forEach(p => {
    if (p.startsWith('위협도:')) threat = p.replace('위협도:', '').trim();
    if (p.startsWith('태도:')) attitude = p.replace('태도:', '').trim();
  });

  const cleanName = rawName.replace(/[\[\]]/g, '').trim();
  const canonicalKey = getCanonicalFactionKey(rawName);

  return {
    raw: rel,
    name: rawName.startsWith('[') ? rawName : `[${rawName}]`,
    cleanName,
    canonicalKey,
    status,
    threat,
    attitude
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
