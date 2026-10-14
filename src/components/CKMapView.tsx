"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Province, 
  MapMode, 
  WORLD_BASE_GEOGRAPHY, 
  IMPERIAL_CALLIGRAPHIES,
  getProvinceColorByMode 
} from '@/lib/engine/mapData';
import { MAP_PRESETS, MapPresetId } from '@/lib/engine/mapPresets';
import { Army } from '@/lib/engine/militaryEngine';
import { 
  Compass, ZoomIn, ZoomOut, RotateCcw, Shield, Swords, 
  Crown, Mountain, Cross, Coins, Layers, Eye, Globe
} from 'lucide-react';

interface Props {
  provinces: Province[];
  armies: Army[];
  selectedProvinceId: string | null;
  onSelectProvince: (province: Province) => void;
  selectedArmyId: string | null;
  onSelectArmy: (army: Army | null) => void;
  onOrderArmyMove?: (armyId: string, targetProvinceId: string) => void;
  currentMapMode?: MapMode;
  onChangeMapMode?: (mode: MapMode) => void;
  currentPresetId?: MapPresetId;
  onSelectPreset?: (presetId: MapPresetId) => void;
}

export default function CKMapView({
  provinces,
  armies,
  selectedProvinceId,
  onSelectProvince,
  selectedArmyId,
  onSelectArmy,
  onOrderArmyMove,
  currentMapMode = 'political',
  onChangeMapMode,
  currentPresetId = '1066_europe',
  onSelectPreset
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredProvinceId, setHoveredProvinceId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<MapMode>(currentMapMode);

  // 외부 mapMode prop 변경 동기화
  useEffect(() => {
    if (currentMapMode) setActiveMode(currentMapMode);
  }, [currentMapMode]);

  const selectedProvince = provinces.find(p => p.id === selectedProvinceId);
  const selectedArmy = armies.find(a => a.id === selectedArmyId);

  // 🖱️ 1. 마우스 휠 커서 중심 줌인 / 줌아웃 (Cursor-Centric Wheel Zoom)
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newScale = Math.min(5.0, Math.max(0.4, scale * zoomFactor));

    if (newScale === scale) return;

    // 마우스 포인터의 컨테이너 내 상대 좌표 계산
    const rect = containerRef.current.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    // 커서 중심 패닝 보정 공식
    const newPanX = cursorX - (cursorX - pan.x) * (newScale / scale);
    const newPanY = cursorY - (cursorY - pan.y) * (newScale / scale);

    setScale(newScale);
    setPan({ x: newPanX, y: newPanY });
  };

  // 🖐️ 2. 마우스 드래그 패닝 처리
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // 좌클릭만 드래그
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 3. 버튼 줌
  const handleButtonZoom = (delta: number) => {
    setScale(prev => Math.min(5.0, Math.max(0.4, prev + delta)));
  };

  const handleReset = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  // 4. 프로빈스 클릭 처리
  const handleProvinceClick = (prov: Province) => {
    if (selectedArmy && onOrderArmyMove) {
      const currentArmyProv = provinces.find(p => p.id === selectedArmy.locationProvinceId);
      if (currentArmyProv && currentArmyProv.neighbors.includes(prov.id)) {
        onOrderArmyMove(selectedArmy.id, prov.id);
        onSelectArmy(null);
        return;
      }
    }
    onSelectProvince(prov);
  };

  const handleModeChange = (mode: MapMode) => {
    setActiveMode(mode);
    if (onChangeMapMode) onChangeMapMode(mode);
  };

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        userSelect: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
        // 🪵 앤틱 다크 오크 원목 테이블(Dark Oak Wood Desk Planks) 질감 및 조명 비네팅
        backgroundColor: '#120b07',
        backgroundImage: `
          radial-gradient(ellipse at 50% 50%, rgba(35, 23, 14, 0.4) 0%, rgba(6, 4, 3, 0.95) 100%),
          repeating-linear-gradient(
            0deg,
            #170f0a 0px,
            #1c130d 14px,
            #120b07 28px,
            #0e0805 44px,
            #1a110a 60px,
            #140d08 72px
          ),
          linear-gradient(90deg, rgba(0,0,0,0.6) 0%, transparent 15%, transparent 85%, rgba(0,0,0,0.6) 100%)
        `,
        boxShadow: 'inset 0 0 100px rgba(0, 0, 0, 0.95)'
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* SVG 캔버스: 원목 책상 위에 놓인 거대 양피지 지도 (viewBox 0 0 1200 800) */}
      <svg
        viewBox="0 0 1480 800"
        style={{
          width: '100%',
          height: '100%',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          transition: isDragging ? 'none' : 'transform 0.05s ease-out'
        }}
      >
        <defs>
          {/* 📜 양피지 그림자 필터 (책상 위에 얹혀진 깊은 입체감) */}
          <filter id="parchmentDeepShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="14" />
            <feOffset dx="0" dy="16" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.85" />
            </feComponentTransfer>
            <feMerge> 
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* 금빛 발광 필터 */}
          <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* 양피지 질감 패턴 그라디언트 */}
          <radialGradient id="parchmentBase" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#dfcca6" />
            <stop offset="45%" stopColor="#d5be9b" />
            <stop offset="85%" stopColor="#c5a982" />
            <stop offset="100%" stopColor="#ab8962" />
          </radialGradient>

          {/* 고지도 해양 수채화 틴트 */}
          <linearGradient id="oceanParchmentTint" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c7b695" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#beac8a" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#b09c77" stopOpacity="0.7" />
          </linearGradient>

          {/* 양피지 테두리 종이 결 필터 */}
          <linearGradient id="woodTableBorder" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3d2616" />
            <stop offset="100%" stopColor="#1a0f08" />
          </linearGradient>
        </defs>

        {/* ============================================================== */}
        {/* 1. 거대한 중세 찢긴 양피지 시트 (The Grand Worn Parchment Map)    */}
        {/* ============================================================== */}
        <g id="parchment_map_sheet" filter="url(#parchmentDeepShadow)">
          {/* 헤진 테두리의 거대한 양피지 종이 베이스 */}
          <path
            d="
              M 35 32
              Q 120 26 260 30 Q 420 24 580 32 Q 740 22 920 30 Q 1160 25 1445 34
              Q 1452 120 1446 280 Q 1455 420 1447 580 Q 1454 680 1445 765
              Q 1240 772 980 766 Q 710 775 540 768 Q 360 774 210 766 Q 100 772 32 764
              Q 26 650 34 500 Q 24 350 32 200 Q 25 100 35 32 Z
            "
            fill="url(#parchmentBase)"
            stroke="#8b6842"
            strokeWidth="3.5"
          />

          {/* 양피지 안쪽 테두리 그을음 및 잉크 경계선 (Worn Paper Inner Border) */}
          <path
            d="
              M 48 44
              L 1432 44 L 1432 754 L 48 754 Z
            "
            fill="url(#oceanParchmentTint)"
            stroke="#9d764d"
            strokeWidth="1.2"
            strokeDasharray="16 4 4 4"
            opacity="0.65"
          />
        </g>

        {/* ============================================================== */}
        {/* 2. 고지도 장식 풍향선 & 경위선 그리드 (Rhumb Lines & Grid)        */}
        {/* ============================================================== */}
        <g opacity="0.18" stroke="#785332" strokeWidth="0.8">
          {/* 중심 방사형 풍향선 (Rhumb lines radiating across oceans) */}
          <line x1="130" y1="150" x2="1150" y2="150" strokeDasharray="6 3" />
          <line x1="130" y1="150" x2="600" y2="750" strokeDasharray="6 3" />
          <line x1="130" y1="150" x2="1150" y2="550" strokeDasharray="8 4" />
          <line x1="130" y1="150" x2="350" y2="750" strokeDasharray="5 3" />
          <line x1="680" y1="680" x2="1150" y2="250" strokeDasharray="6 3" />
          <line x1="680" y1="680" x2="50" y2="400" strokeDasharray="6 3" />
          <line x1="680" y1="680" x2="1000" y2="50" strokeDasharray="8 4" />

          {/* 위경도 눈금선 */}
          <line x1="50" y1="200" x2="1150" y2="200" strokeDasharray="4 4" />
          <line x1="50" y1="400" x2="1150" y2="400" strokeDasharray="4 4" />
          <line x1="50" y1="600" x2="1150" y2="600" strokeDasharray="4 4" />
          <line x1="300" y1="45" x2="300" y2="750" strokeDasharray="4 4" />
          <line x1="600" y1="45" x2="600" y2="750" strokeDasharray="4 4" />
          <line x1="900" y1="45" x2="900" y2="750" strokeDasharray="4 4" />
        </g>

        {/* ============================================================== */}
        {/* 3. 대륙 해안선 베이스 랜드매스 (Old World Landmass Silhouettes)   */}
        {/* ============================================================== */}
        <g id="world_continents_base" opacity="0.88">
          {WORLD_BASE_GEOGRAPHY.continents.map(c => (
            <path
              key={c.id}
              d={c.path}
              fill="#cfbc98"
              stroke="#8c6c49"
              strokeWidth="2.2"
              style={{ pointerEvents: 'none' }}
            />
          ))}
        </g>

        {/* ============================================================== */}
        {/* 4. 카토그래피 고지도 삽화 (범선, 바다괴물, 황금 나침반 장미)     */}
        {/* ============================================================== */}
        <g id="cartography_illustrations" opacity="0.82" style={{ pointerEvents: 'none' }}>
          {/* 🧭 [A] 황금 나침반 장미 (Golden Compass Rose in Northwest Ocean) */}
          <g transform="translate(130, 150)">
            <circle r="46" fill="none" stroke="#845e34" strokeWidth="1.2" strokeDasharray="4 2" />
            <circle r="40" fill="#dfcca6" fillOpacity="0.4" stroke="#684725" strokeWidth="1.8" />
            <circle r="32" fill="none" stroke="#a37644" strokeWidth="0.9" />

            {/* 8방위 메인 뽀족침 */}
            <path d="M 0 -38 L 5 -8 L 0 0 L -5 -8 Z" fill="#78350f" stroke="#451a03" strokeWidth="0.8" />
            <path d="M 0 38 L 5 8 L 0 0 L -5 8 Z" fill="#92400e" stroke="#451a03" strokeWidth="0.8" />
            <path d="M -38 0 L -8 5 L 0 0 L -8 -5 Z" fill="#92400e" stroke="#451a03" strokeWidth="0.8" />
            <path d="M 38 0 L 8 5 L 0 0 L 8 -5 Z" fill="#78350f" stroke="#451a03" strokeWidth="0.8" />
            
            {/* 4방위 서브 침 */}
            <path d="M -26 -26 L -6 -6 L 0 0 L -6 -6 Z" fill="#b45309" />
            <path d="M 26 -26 L 6 -6 L 0 0 L 6 -6 Z" fill="#b45309" />
            <path d="M -26 26 L -6 6 L 0 0 L -6 6 Z" fill="#b45309" />
            <path d="M 26 26 L 6 6 L 0 0 L 6 6 Z" fill="#b45309" />

            <circle r="4.5" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
            {/* 북쪽 N 마크 */}
            <text x="0" y="-42" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#78350f" fontFamily="Cinzel, Georgia, serif">N</text>
          </g>

          {/* ⛵ [B] 대서양 중세 탐험 범선 (Caravel in Atlantic Ocean) */}
          <g transform="translate(135, 330) scale(0.85)">
            {/* 선체 Hull */}
            <path d="M -24 8 C -14 18 18 18 30 8 C 34 2 26 -2 18 -2 L -18 -2 C -24 -2 -28 2 -24 8 Z" fill="#603813" stroke="#3d2107" strokeWidth="1.2" />
            {/* 돛대 Masts */}
            <line x1="-6" y1="-2" x2="-6" y2="-32" stroke="#402409" strokeWidth="1.8" />
            <line x1="14" y1="-2" x2="14" y2="-24" stroke="#402409" strokeWidth="1.5" />
            {/* 부풀어 오른 메인 돛 Main Sail */}
            <path d="M -7 -30 C 6 -32 6 -12 -5 -10 C -12 -12 -12 -28 -7 -30 Z" fill="#f4ebd9" stroke="#5a3d1d" strokeWidth="1.2" />
            {/* 후방 삼각돛 Mizzen Lateen Sail */}
            <path d="M 14 -22 L 25 -8 L 13 -8 Z" fill="#efe4cc" stroke="#5a3d1d" strokeWidth="1" />
            {/* 십자가 문양 Flag */}
            <line x1="-6" y1="-32" x2="-14" y2="-34" stroke="#b91c1c" strokeWidth="2" />
            {/* 바다 물결 Wave */}
            <path d="M -30 14 Q -20 18 -10 14 Q 0 10 10 14 Q 20 18 35 14" fill="none" stroke="#7c5e3d" strokeWidth="1.2" strokeDasharray="3 2" />
          </g>

          {/* ⛵ [C] 인도양 상단 범선 (Caravel in Indian Ocean) */}
          <g transform="translate(740, 700) scale(0.75)">
            <path d="M -22 6 C -12 16 16 16 28 6 C 32 0 24 -4 16 -4 L -16 -4 C -22 -4 -26 0 -22 6 Z" fill="#603813" stroke="#3d2107" strokeWidth="1.2" />
            <line x1="-4" y1="-4" x2="-4" y2="-30" stroke="#402409" strokeWidth="1.6" />
            <line x1="12" y1="-4" x2="12" y2="-22" stroke="#402409" strokeWidth="1.4" />
            <path d="M -5 -28 C 6 -30 6 -10 -4 -8 C -10 -10 -10 -26 -5 -28 Z" fill="#f4ebd9" stroke="#5a3d1d" strokeWidth="1" />
            <path d="M 12 -20 L 22 -6 L 11 -6 Z" fill="#efe4cc" stroke="#5a3d1d" strokeWidth="0.8" />
          </g>

          {/* 🐉 [D] 신화 속 바다괴물/해룡 (Sea Serpent in Mediterranean Sea) */}
          <g transform="translate(420, 640) scale(0.8)">
            {/* 똬리를 튼 바다뱀 몸통 Coiling Serpent Body */}
            <path 
              d="M -35 8 C -25 -16 -10 -16 0 4 C 10 22 25 22 35 6 C 45 -12 60 -10 68 8" 
              fill="none" 
              stroke="#52391e" 
              strokeWidth="5" 
              strokeLinecap="round"
            />
            {/* 용 머리 Dragon Head */}
            <path d="M -35 8 C -42 4 -48 -4 -42 -10 C -36 -12 -32 -6 -35 8 Z" fill="#52391e" />
            {/* 불꽃 혀 Tongue */}
            <path d="M -44 -6 L -52 -8 M -44 -6 L -50 -3" stroke="#991b1b" strokeWidth="1.2" />
            {/* 비늘 지느러미 Fin */}
            <path d="M -2 -2 L 4 -12 L 2 2 Z" fill="#854d0e" />
            <path d="M 33 0 L 39 -10 L 37 4 Z" fill="#854d0e" />
            {/* 물결 포말 Spume */}
            <path d="M -45 14 Q -20 8 0 14 Q 25 20 50 14 Q 65 10 75 16" fill="none" stroke="#94714d" strokeWidth="1" strokeDasharray="3 3" />
          </g>
        </g>

        {/* ============================================================== */}
        {/* 5. 웅장한 대제국 캘리그라피 (Grand Imperial Calligraphy)         */}
        {/* ============================================================== */}
        <g id="imperial_calligraphy_layer" opacity="0.65" style={{ pointerEvents: 'none' }}>
          {IMPERIAL_CALLIGRAPHIES.map(cal => (
            <g key={cal.id} transform={`translate(${cal.x}, ${cal.y}) rotate(${cal.rotate || 0})`}>
              {/* 은은한 양피지 음각 섀도우 */}
              <text
                x="1.5"
                y="1.5"
                textAnchor="middle"
                fill="rgba(255, 245, 230, 0.45)"
                fontSize={cal.fontSize}
                fontWeight="900"
                letterSpacing={`${cal.letterSpacing}px`}
                fontFamily="Cinzel, Georgia, serif"
              >
                {cal.text}
              </text>
              {/* 메인 캘리그라피 본체 */}
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fill={cal.color}
                fontSize={cal.fontSize}
                fontWeight="900"
                letterSpacing={`${cal.letterSpacing}px`}
                fontFamily="Cinzel, Georgia, serif"
                style={{
                  textTransform: 'uppercase',
                  filter: 'drop-shadow(0 1px 2px rgba(60, 40, 20, 0.35))'
                }}
              >
                {cal.text}
              </text>
            </g>
          ))}
        </g>

        {/* ============================================================== */}
        {/* 6. 인접 프로빈스 연결 국경선 (Border Connection Network)         */}
        {/* ============================================================== */}
        <g opacity="0.45">
          {provinces.map(p1 => 
            p1.neighbors.map(neighborId => {
              const p2 = provinces.find(p => p.id === neighborId);
              if (!p2 || p1.id > p2.id) return null;
              const isSelectedRelation = selectedProvince && (p1.id === selectedProvince.id || p2.id === selectedProvince.id);
              return (
                <line
                  key={`${p1.id}-${p2.id}`}
                  x1={p1.center.x}
                  y1={p1.center.y}
                  x2={p2.center.x}
                  y2={p2.center.y}
                  stroke={isSelectedRelation ? '#b45309' : 'rgba(120, 80, 45, 0.4)'}
                  strokeWidth={isSelectedRelation ? 2.8 : 1.2}
                  strokeDasharray={isSelectedRelation ? '4 2' : '3 3'}
                />
              );
            })
          )}
        </g>

        {/* ============================================================== */}
        {/* 7. 중세 역사 프로빈스 폴리곤 (Interactive Parchment Provinces)    */}
        {/* ============================================================== */}
        <g id="provinces_polygons">
          {provinces.map(prov => {
            const isSelected = selectedProvinceId === prov.id;
            const isHovered = hoveredProvinceId === prov.id;
            const isNeighborOfSelected = selectedProvince?.neighbors.includes(prov.id);

            // 맵 모드별 색상 획득
            const { fill: modeFill, stroke: modeStroke } = getProvinceColorByMode(prov, activeMode);

            let strokeColor = modeStroke;
            let strokeWidth = 1.6;

            if (isSelected) {
              strokeColor = '#d97706';
              strokeWidth = 3.6;
            } else if (isHovered) {
              strokeColor = '#ffffff';
              strokeWidth = 2.6;
            } else if (isNeighborOfSelected && selectedArmy) {
              strokeColor = '#15803d';
              strokeWidth = 2.8;
            }

            return (
              <g
                key={prov.id}
                onClick={e => {
                  e.stopPropagation();
                  handleProvinceClick(prov);
                }}
                onMouseEnter={() => setHoveredProvinceId(prov.id)}
                onMouseLeave={() => setHoveredProvinceId(null)}
                style={{ cursor: 'pointer' }}
              >
                <path
                  d={prov.svgPath}
                  fill={modeFill}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  filter={isSelected ? 'url(#goldGlow)' : undefined}
                  style={{
                    transition: 'fill 0.2s ease, stroke 0.2s ease, stroke-width 0.2s ease',
                    opacity: isHovered ? 0.95 : 0.85
                  }}
                />

                {/* 프로빈스 명칭 라벨 */}
                <text
                  x={prov.center.x}
                  y={prov.center.y - 4}
                  textAnchor="middle"
                  fill={isSelected ? '#fffbeb' : '#1c1917'}
                  fontSize={isSelected ? '12' : '10'}
                  fontWeight={isSelected || prov.isPlayerControlled ? '800' : '600'}
                  letterSpacing="0.4px"
                  style={{
                    textShadow: isSelected 
                      ? '0 1px 4px rgba(0,0,0,0.8), 0 0 8px #d97706' 
                      : '0 1px 2px rgba(255,255,255,0.8), 0 0 1px #fff',
                    pointerEvents: 'none',
                    fontFamily: 'Cinzel, Georgia, serif'
                  }}
                >
                  {prov.isPlayerControlled && '👑 '}
                  {prov.name}
                </text>

                {/* 수도 및 소속 세력 라벨 */}
                <text
                  x={prov.center.x}
                  y={prov.center.y + 11}
                  textAnchor="middle"
                  fill="rgba(41, 37, 36, 0.85)"
                  fontSize="8.5"
                  fontWeight="500"
                  style={{
                    textShadow: '0 1px 2px rgba(255,255,255,0.7)',
                    pointerEvents: 'none',
                    fontFamily: 'Georgia, serif'
                  }}
                >
                  {prov.capital}
                </text>

                {/* 자문회 직무 파견 뱃지 (있을 때) */}
                {prov.assignedTask && (
                  <g transform={`translate(${prov.center.x + 18}, ${prov.center.y - 18})`}>
                    <circle r="8" fill="#d97706" stroke="#fef3c7" strokeWidth="1" />
                    <text x="0" y="3" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="bold">
                      📜
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* ============================================================== */}
        {/* 8. 군대 토큰 (Armies Military Tokens)                           */}
        {/* ============================================================== */}
        <g id="armies_layer">
          {armies.map(army => {
            const prov = provinces.find(p => p.id === army.locationProvinceId);
            if (!prov) return null;

            let posX = prov.center.x;
            let posY = prov.center.y;

            if (army.targetProvinceId) {
              const targetProv = provinces.find(p => p.id === army.targetProvinceId);
              if (targetProv) {
                const ratio = army.movementProgress / 100;
                posX = prov.center.x + (targetProv.center.x - prov.center.x) * ratio;
                posY = prov.center.y + (targetProv.center.y - prov.center.y) * ratio;
              }
            }

            const isSelected = selectedArmyId === army.id;

            return (
              <g
                key={army.id}
                transform={`translate(${posX}, ${posY + 16})`}
                onClick={e => {
                  e.stopPropagation();
                  onSelectArmy(isSelected ? null : army);
                }}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  r={isSelected ? 16 : 14}
                  fill={army.isPlayer ? '#1d4ed8' : '#991b1b'}
                  stroke={isSelected ? '#fbbf24' : '#fef3c7'}
                  strokeWidth={isSelected ? 3 : 1.5}
                  filter="drop-shadow(0 4px 8px rgba(0,0,0,0.85))"
                />

                <text
                  x={0}
                  y={4}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#ffffff"
                  style={{ pointerEvents: 'none' }}
                >
                  {army.isSieging ? '🏰' : '⚔️'}
                </text>

                <rect
                  x={-24}
                  y={17}
                  width={48}
                  height={14}
                  rx={4}
                  fill="rgba(24, 15, 10, 0.92)"
                  stroke={army.isPlayer ? '#60a5fa' : '#ef4444'}
                  strokeWidth={1}
                />
                <text
                  x={0}
                  y={27}
                  textAnchor="middle"
                  fill="#fef3c7"
                  fontSize="9.5"
                  fontWeight="bold"
                  style={{ pointerEvents: 'none' }}
                >
                  {army.troops}명
                </text>

                {army.isSieging && (
                  <g transform="translate(-20, -22)">
                    <rect width="40" height="5" rx="2" fill="rgba(0,0,0,0.8)" />
                    <rect width={Math.floor(army.siegeProgress * 0.4)} height="5" rx="2" fill="#eab308" />
                  </g>
                )}

                {army.targetProvinceId && (
                  <g transform="translate(-20, -22)">
                    <rect width="40" height="5" rx="2" fill="rgba(0,0,0,0.8)" />
                    <rect width={Math.floor(army.movementProgress * 0.4)} height="5" rx="2" fill="#3b82f6" />
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* 🗺️ 좌측 상단 지도 프리셋 전환기 (Map Preset Switcher) */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        display: 'flex',
        background: 'rgba(24, 15, 10, 0.94)',
        border: '1.5px solid rgba(200, 159, 60, 0.5)',
        borderRadius: '8px',
        padding: '3px',
        gap: '4px',
        zIndex: 10,
        boxShadow: '0 4px 16px rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 6px', color: '#fbbf24', fontSize: '11px', fontWeight: 'bold', gap: '4px' }}>
          <Globe size={13} />
          <span>세계관:</span>
        </div>
        {(Object.keys(MAP_PRESETS) as MapPresetId[]).map(presetKey => {
          const preset = MAP_PRESETS[presetKey];
          const isCurrent = currentPresetId === presetKey;
          return (
            <button
              key={presetKey}
              onClick={() => onSelectPreset && onSelectPreset(presetKey)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 9px',
                borderRadius: '5px',
                background: isCurrent 
                  ? 'linear-gradient(135deg, rgba(200, 159, 60, 0.45), rgba(180, 83, 9, 0.6))' 
                  : 'transparent',
                border: isCurrent ? '1px solid #fbbf24' : '1px solid transparent',
                color: isCurrent ? '#fef3c7' : '#d6d3d1',
                fontSize: '11px',
                fontWeight: isCurrent ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title={preset.description}
            >
              <span>{preset.name}</span>
            </button>
          );
        })}
      </div>

      {/* 🧭 좌측 상단 조작 가이드 & 상태 바 */}
      <div style={{
        position: 'absolute',
        top: '64px',
        left: '16px',
        padding: '7px 12px',
        borderRadius: '8px',
        background: 'rgba(26, 17, 11, 0.88)',
        border: '1px solid rgba(200, 159, 60, 0.4)',
        color: '#f5ebe0',
        fontSize: '11px',
        zIndex: 10,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)'
      }}>
        <Compass size={15} color="#d97706" />
        <span>
          {selectedArmy 
            ? `⚔️ 군대 [${selectedArmy.name}] 선택됨 → 인접 영지 클릭으로 행군 명령`
            : '🗺️ 마우스 휠: 커서 중심 줌인/아웃 | 드래그: 지도 이동 | 영지 클릭: 내정/외교'}
        </span>
      </div>

      {/* 🗺️ 우측 하단 지도 모드 스위처 (Map Modes Toolbar) */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        display: 'flex',
        background: 'rgba(24, 15, 10, 0.94)',
        border: '1.5px solid rgba(200, 159, 60, 0.45)',
        borderRadius: '8px',
        padding: '4px',
        gap: '4px',
        zIndex: 10,
        boxShadow: '0 6px 22px rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)'
      }}>
        {[
          { id: 'political', label: '정치 판도', icon: <Crown size={13} color="#f59e0b" /> },
          { id: 'terrain', label: '지형', icon: <Mountain size={13} color="#22c55e" /> },
          { id: 'religious', label: '종교', icon: <Cross size={13} color="#a855f7" /> },
          { id: 'development', label: '개발도', icon: <Coins size={13} color="#eab308" /> }
        ].map(m => {
          const isActive = activeMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => handleModeChange(m.id as MapMode)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 11px',
                borderRadius: '6px',
                background: isActive 
                  ? 'linear-gradient(135deg, rgba(200, 159, 60, 0.4), rgba(180, 83, 9, 0.5))' 
                  : 'transparent',
                border: isActive ? '1px solid #fbbf24' : '1px solid transparent',
                color: isActive ? '#fef3c7' : '#d6d3d1',
                fontSize: '11px',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {m.icon}
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* 🔍 우측 상단 줌/시점 컨트롤러 */}
      <div style={{
        position: 'absolute',
        top: '64px',
        right: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        zIndex: 10
      }}>
        <button
          onClick={() => handleButtonZoom(0.25)}
          title="지도 확대 (마우스 휠 위로 스크롤 가능)"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '7px',
            background: 'rgba(26, 17, 11, 0.92)',
            border: '1px solid rgba(200, 159, 60, 0.45)',
            color: '#fef3c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.6)'
          }}
        >
          <ZoomIn size={16} />
        </button>

        <button
          onClick={() => handleButtonZoom(-0.25)}
          title="지도 축소 (마우스 휠 아래로 스크롤 가능)"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '7px',
            background: 'rgba(26, 17, 11, 0.92)',
            border: '1px solid rgba(200, 159, 60, 0.45)',
            color: '#fef3c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.6)'
          }}
        >
          <ZoomOut size={16} />
        </button>

        <button
          onClick={handleReset}
          title="시점 초기화"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '7px',
            background: 'rgba(26, 17, 11, 0.92)',
            border: '1px solid rgba(200, 159, 60, 0.45)',
            color: '#fef3c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.6)'
          }}
        >
          <RotateCcw size={15} />
        </button>
      </div>
    </div>
  );
}
