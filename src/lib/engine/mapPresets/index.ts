import { Province, INITIAL_PROVINCES, WORLD_BASE_GEOGRAPHY } from '../mapData';
import { FANTASY_PROVINCES } from './fantasyWorld';

export type MapPresetId = '1066_europe' | 'azgaar_fantasy';

export interface MapPreset {
  id: MapPresetId;
  name: string;
  tagline: string;
  description: string;
  provinces: Province[];
  oceanBg: string;
  defaultRuler: string;
  defaultRealm: string;
}

export const MAP_PRESETS: Record<MapPresetId, MapPreset> = {
  '1066_europe': {
    id: '1066_europe',
    name: '1066 유라시아 대세계 (유럽·중동·인도·동양)',
    tagline: '서유럽부터 실크로드, 대송 제국, 고려, 일본까지',
    description: '서유럽 노르만 왕조와 로마 교황령, 비잔티움, 셀주크 투르크, 그리고 동양의 대송 제국·고려·거란 요나라·헤이안 일본까지 아우르는 1066년 고증 유라시아 대전략 지도입니다.',
    provinces: INITIAL_PROVINCES,
    oceanBg: '#c9b897',
    defaultRuler: '기욤 공작',
    defaultRealm: '노르망디 공국'
  },
  'azgaar_fantasy': {
    id: 'azgaar_fantasy',
    name: '에테리아 대륙 (Azgaar 판타지)',
    tagline: 'Azgaar Fantasy Map Generator 연동 세계관',
    description: '발렌시아 성왕국, 엘도리아 요정림, 드라켄홀드 드워프 산맥이 각축을 벌이는 판타지 렐름입니다.',
    provinces: FANTASY_PROVINCES,
    oceanBg: '#1e293b',
    defaultRuler: '알렉산더 4세 국왕',
    defaultRealm: '발렌시아 성왕국'
  }
};

export function getMapPreset(id: MapPresetId = '1066_europe'): MapPreset {
  return MAP_PRESETS[id] || MAP_PRESETS['1066_europe'];
}
