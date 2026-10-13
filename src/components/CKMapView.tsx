"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Province, MapMode, WORLD_BASE_GEOGRAPHY, getProvinceColorByMode } from '@/lib/engine/mapData';
import { Army } from '@/lib/engine/militaryEngine';
import { 
  Compass, ZoomIn, ZoomOut, RotateCcw, Shield, Swords, 
  Crown, Mountain, Cross, Coins, Layers, Eye
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
  onChangeMapMode
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
        minHeight: '480px',
        overflow: 'hidden',
        background: WORLD_BASE_GEOGRAPHY.oceanBg,
        userSelect: 'none',
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 바다 물결 및 고지도 비네팅 효과 오버레이 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          radial-gradient(circle at center, transparent 35%, rgba(4, 9, 15, 0.75) 100%),
          linear-gradient(rgba(200, 159, 60, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(200, 159, 60, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 60px 60px, 60px 60px',
        pointerEvents: 'none',
        zIndex: 1
      }} />

      {/* SVG 표준 세계지도 캔버스 (viewBox 0 0 1200 800) */}
      <svg
        viewBox="0 0 1200 800"
        style={{
          width: '100%',
          height: '100%',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          transition: isDragging ? 'none' : 'transform 0.05s ease-out'
        }}
      >
        <defs>
          <filter id="goldGlow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="coastalGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. 위선 & 경선 그리드 라인 (Longitude & Latitude Grid) */}
        <g opacity="0.12" stroke="#fbbf24" strokeWidth="0.8" strokeDasharray="6 4">
          <line x1="0" y1="150" x2="1200" y2="150" />
          <line x1="0" y1="300" x2="1200" y2="300" />
          <line x1="0" y1="450" x2="1200" y2="450" />
          <line x1="0" y1="600" x2="1200" y2="600" />
          <line x1="200" y1="0" x2="200" y2="800" />
          <line x1="400" y1="0" x2="400" y2="800" />
          <line x1="600" y1="0" x2="600" y2="800" />
          <line x1="800" y1="0" x2="800" y2="800" />
          <line x1="1000" y1="0" x2="1000" y2="800" />
        </g>

        {/* 2. 실제 세계 대륙 및 해안선 베이스 (World Landmasses & Coastlines) */}
        <g id="world_continents_base">
          {WORLD_BASE_GEOGRAPHY.continents.map(c => (
            <path
              key={c.id}
              d={c.path}
              fill="#182330"
              stroke="#2e435a"
              strokeWidth="2"
              filter="url(#coastalGlow)"
              style={{ pointerEvents: 'none' }}
            />
          ))}
        </g>

        {/* 3. 인접 프로빈스 국경 연결선 (Border Graph Lines) */}
        <g opacity="0.4">
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
                  stroke={isSelectedRelation ? '#fbbf24' : 'rgba(180, 150, 100, 0.35)'}
                  strokeWidth={isSelectedRelation ? 2.5 : 1.2}
                  strokeDasharray={isSelectedRelation ? '4 2' : '3 3'}
                />
              );
            })
          )}
        </g>

        {/* 4. 중세 역사 프로빈스 영역 폴리곤 (Provinces) */}
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
              strokeColor = '#f59e0b';
              strokeWidth = 3.8;
            } else if (isHovered) {
              strokeColor = '#ffffff';
              strokeWidth = 2.8;
            } else if (isNeighborOfSelected && selectedArmy) {
              strokeColor = '#22c55e';
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
                  fill={isSelected ? '#fef08a' : '#f8fafc'}
                  fontSize={isSelected ? '12.5' : '10.5'}
                  fontWeight={isSelected || prov.isPlayerControlled ? '800' : '600'}
                  letterSpacing="0.4px"
                  style={{
                    textShadow: '0 2px 5px rgba(0,0,0,0.95), 0 0 3px #000',
                    pointerEvents: 'none'
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
                  fill="rgba(226, 232, 240, 0.85)"
                  fontSize="9"
                  style={{
                    textShadow: '0 1px 4px rgba(0,0,0,0.95)',
                    pointerEvents: 'none'
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

        {/* 5. 군대 토큰 (Armies) */}
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
                  fill={army.isPlayer ? '#1d4ed8' : '#b91c1c'}
                  stroke={isSelected ? '#fbbf24' : '#f8fafc'}
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
                  fill="rgba(0, 0, 0, 0.88)"
                  stroke={army.isPlayer ? '#60a5fa' : '#ef4444'}
                  strokeWidth={1}
                />
                <text
                  x={0}
                  y={27}
                  textAnchor="middle"
                  fill="#ffffff"
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

      {/* 🧭 좌측 상단 조작 가이드 & 나침반 */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        padding: '8px 14px',
        borderRadius: '8px',
        background: 'rgba(15, 11, 8, 0.88)',
        border: '1px solid rgba(200, 159, 60, 0.35)',
        color: '#d6d3d1',
        fontSize: '11px',
        zIndex: 10,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
      }}>
        <Compass size={15} color="#f59e0b" />
        <span>
          {selectedArmy 
            ? `⚔️ 군대 [${selectedArmy.name}] 선택됨 → 인접 영지 클릭으로 행군 명령`
            : '🗺️ 마우스 휠: 커서 중심 확대/축소 | 드래그: 지도 이동 | 영지 클릭: 내정 및 외교'}
        </span>
      </div>

      {/* 🗺️ 우측 하단 지도 모드 스위처 (Map Modes Toolbar) */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        display: 'flex',
        background: 'rgba(20, 15, 10, 0.92)',
        border: '1px solid rgba(200, 159, 60, 0.4)',
        borderRadius: '8px',
        padding: '4px',
        gap: '4px',
        zIndex: 10,
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.7)'
      }}>
        {[
          { id: 'political', label: '정치', icon: <Crown size={13} color="#f59e0b" /> },
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
                padding: '6px 10px',
                borderRadius: '6px',
                background: isActive 
                  ? 'linear-gradient(135deg, rgba(200, 159, 60, 0.35), rgba(180, 83, 9, 0.45))' 
                  : 'transparent',
                border: isActive ? '1px solid #fbbf24' : '1px solid transparent',
                color: isActive ? '#fef3c7' : '#9ca3af',
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
        top: '16px',
        right: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 10
      }}>
        <button
          onClick={() => handleButtonZoom(0.25)}
          title="지도 확대 (마우스 휠 위로 스크롤 가능)"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(26, 20, 15, 0.9)',
            border: '1px solid rgba(200, 159, 60, 0.45)',
            color: '#fef3c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
          }}
        >
          <ZoomIn size={18} />
        </button>

        <button
          onClick={() => handleButtonZoom(-0.25)}
          title="지도 축소 (마우스 휠 아래로 스크롤 가능)"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(26, 20, 15, 0.9)',
            border: '1px solid rgba(200, 159, 60, 0.45)',
            color: '#fef3c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
          }}
        >
          <ZoomOut size={18} />
        </button>

        <button
          onClick={handleReset}
          title="시점 초기화"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(26, 20, 15, 0.9)',
            border: '1px solid rgba(200, 159, 60, 0.45)',
            color: '#fef3c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
          }}
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}
