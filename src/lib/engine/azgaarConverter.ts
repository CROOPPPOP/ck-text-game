/**
 * Azgaar's Fantasy Map Generator (AFMG) to Crusader Kings 3 Web Game Map Converter
 * - AFMG GeoJSON / SVG / .map JSON 데이터 구조를 게임 내 Province[] 및 지리 레이어로 변환
 * - 지형(Biomes), 문화(Cultures), 종교(Religions), 거점 레벨, 인접 국경(Neighbors) 자동 계산
 */

import { Province, TerrainType, MapMode } from './mapData';

// Azgaar의 생태군 ID/명칭 -> 게임 지형 타입 매핑 테이블
export const AZGAAR_BIOME_MAP: Record<string, TerrainType> = {
  // 영문 표준 명칭 매핑
  'Marine': '해안',
  'Hot Desert': '사막',
  'Cold Desert': '사막',
  'Savanna': '평야',
  'Grassland': '평야',
  'Tropical Rainforest': '산림',
  'Temperate Seasonal Forest': '산림',
  'Temperate Deciduous Forest': '산림',
  'Tropical Seasonal Forest': '산림',
  'Taiga': '산림',
  'Tundra': '구릉',
  'Glacier': '산악',
  'Wetland': '습지',
  'Marsh': '습지',
  'Swamp': '습지',
  'Mountain': '산악',
  'Highland': '구릉',
  'Hills': '구릉',

  // 한국어 번역명 매핑
  '해양': '해안',
  '사막': '사막',
  '열대 사막': '사막',
  '초원': '평야',
  '사바나': '평야',
  '온대림': '산림',
  '열대우림': '산림',
  '타이가': '산림',
  '침엽수림': '산림',
  '툰드라': '구릉',
  '빙하': '산악',
  '습지': '습지',
  '산악': '산악',
  '구릉': '구릉'
};

export interface AzgaarRawProvinceInput {
  id: string | number;
  name: string;
  stateName?: string;
  rulerName?: string;
  rulerTitle?: string;
  capitalName?: string;
  biome?: string;
  culture?: string;
  religion?: string;
  population?: number;
  military?: number;
  svgPath: string;
  center?: { x: number; y: number };
  neighbors?: (string | number)[];
  color?: string;
}

export interface AzgaarMapPackage {
  mapName: string;
  description: string;
  viewBox: string;
  provinces: AzgaarRawProvinceInput[];
}

/**
 * Azgaar의 원시 영지 입력을 게임 표준 Province 규격으로 정규화 변환
 */
export function convertAzgaarProvinceToCK(
  raw: AzgaarRawProvinceInput,
  index: number
): Province {
  const provId = typeof raw.id === 'string' && raw.id.startsWith('prov_') 
    ? raw.id 
    : `prov_az_${raw.id ?? index}`;

  const terrain: TerrainType = (raw.biome && AZGAAR_BIOME_MAP[raw.biome]) 
    ? AZGAAR_BIOME_MAP[raw.biome] 
    : '평야';

  // 종교 매핑 (가톨릭, 정교회, 이슬람, 힌두교 등 기본 허용치로 폴백)
  let religion: Province['religion'] = '가톨릭';
  if (raw.religion) {
    if (raw.religion.includes('정교') || raw.religion.includes('동방')) religion = '정교회';
    else if (raw.religion.includes('수니') || raw.religion.includes('이슬람')) religion = '이슬람(수니)';
    else if (raw.religion.includes('시아')) religion = '이슬람(시아)';
    else if (raw.religion.includes('불교')) religion = '불교';
    else if (raw.religion.includes('힌두')) religion = '힌두교';
    else if (raw.religion.includes('텡그리') || raw.religion.includes('샤머니즘') || raw.religion.includes('정령')) religion = '텡그리';
  }

  // 인구에 따른 개발도 및 거점 등급 산정
  const rawPop = raw.population || 1200;
  const development = Math.min(100, Math.max(10, Math.round(rawPop / 100)));
  const holdingLevel = rawPop >= 8000 ? 5 : rawPop >= 4000 ? 4 : rawPop >= 2000 ? 3 : rawPop >= 800 ? 2 : 1;

  // 병력 산정
  const maxLevies = raw.military || Math.round(rawPop * 0.25);
  const currentLevies = Math.round(maxLevies * 0.85);

  // 이웃 ID 정규화
  const neighbors: string[] = (raw.neighbors || []).map(n => 
    typeof n === 'string' && n.startsWith('prov_') ? n : `prov_az_${n}`
  );

  // 기본 색상 생성 (미지정 시 파스텔톤 자동 추출)
  const defaultHue = (index * 47) % 360;
  const color = raw.color || `hsl(${defaultHue}, 55%, 45%)`;

  return {
    id: provId,
    name: raw.name || `영지 ${index + 1}`,
    capital: raw.capitalName || `${raw.name || '성채'} 주도`,
    rulerName: raw.rulerName || `아즈가르 영주 ${index + 1}세`,
    rulerTitle: raw.rulerTitle || (holdingLevel >= 4 ? '공작' : holdingLevel >= 3 ? '백작' : '남작'),
    realmName: raw.stateName || '판타지 연맹 왕국',
    culture: raw.culture || '판타지 정주민',
    religion,
    terrain,
    development,
    garrison: Math.round(maxLevies * 0.6),
    maxLevies,
    currentLevies,
    monthlyIncome: Math.max(1, Math.round(development * 0.3)),
    holdingLevel,
    isPlayerControlled: index === 0,
    color,
    borderColor: 'rgba(0, 0, 0, 0.4)',
    neighbors,
    center: raw.center || { x: 400, y: 300 },
    svgPath: raw.svgPath
  };
}

/**
 * Azgaar GeoJSON (Provinces FeatureCollection) 파서
 */
export function parseAzgaarGeoJSON(geoJson: any): Province[] {
  if (!geoJson || !Array.isArray(geoJson.features)) {
    throw new Error('유효한 GeoJSON FeatureCollection 형식이 아닙니다.');
  }

  return geoJson.features.map((feat: any, idx: number) => {
    const props = feat.properties || {};
    const geom = feat.geometry;

    // GeoJSON 폴리곤 좌표 -> SVG Path d="..." 변환
    let svgPath = '';
    let center = { x: 500, y: 400 };

    if (geom && (geom.type === 'Polygon' || geom.type === 'MultiPolygon')) {
      const rings = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
      let pathCommands: string[] = [];
      let totalX = 0;
      let totalY = 0;
      let pointCount = 0;

      rings.forEach((ringGroup: any[]) => {
        ringGroup.forEach((ring: any[]) => {
          if (!Array.isArray(ring) || ring.length === 0) return;
          const cmds = ring.map((pt, pIdx) => {
            const x = Math.round(pt[0]);
            const y = Math.round(pt[1]);
            totalX += x;
            totalY += y;
            pointCount++;
            return `${pIdx === 0 ? 'M' : 'L'} ${x} ${y}`;
          });
          cmds.push('Z');
          pathCommands.push(cmds.join(' '));
        });
      });

      svgPath = pathCommands.join(' ');
      if (pointCount > 0) {
        center = {
          x: Math.round(totalX / pointCount),
          y: Math.round(totalY / pointCount)
        };
      }
    }

    return convertAzgaarProvinceToCK({
      id: props.id || props.province || idx,
      name: props.name || props.province || `영지 ${idx + 1}`,
      stateName: props.state || props.realm,
      rulerName: props.ruler || props.burg,
      capitalName: props.burg || props.capital,
      biome: props.biome,
      culture: props.culture,
      religion: props.religion,
      population: props.population,
      military: props.military,
      svgPath,
      center,
      neighbors: props.neighbors || []
    }, idx);
  });
}
