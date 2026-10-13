"use client";

import React, { useState, useRef } from 'react';
import { Province } from '@/lib/engine/mapData';
import { Army } from '@/lib/engine/militaryEngine';
import { Compass, ZoomIn, ZoomOut, RotateCcw, Shield, Swords, Castle, Flag } from 'lucide-react';

interface Props {
  provinces: Province[];
  armies: Army[];
  selectedProvinceId: string | null;
  onSelectProvince: (province: Province) => void;
  selectedArmyId: string | null;
  onSelectArmy: (army: Army | null) => void;
  onOrderArmyMove?: (armyId: string, targetProvinceId: string) => void;
}

export default function CKMapView({
  provinces,
  armies,
  selectedProvinceId,
  onSelectProvince,
  selectedArmyId,
  onSelectArmy,
  onOrderArmyMove
}: Props) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredProvinceId, setHoveredProvinceId] = useState<string | null>(null);

  const selectedProvince = provinces.find(p => p.id === selectedProvinceId);
  const selectedArmy = armies.find(a => a.id === selectedArmyId);

  // 마우스 드래그 패닝 처리
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // 좌클릭만
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

  const handleZoom = (delta: number) => {
    setScale(prev => Math.min(2.5, Math.max(0.6, prev + delta)));
  };

  const handleReset = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  // 프로빈스 클릭 처리
  const handleProvinceClick = (prov: Province) => {
    // 만약 현재 군대를 선택한 상태이고, 클릭한 프로빈스가 인접 프로빈스라면 이동 명령 실행!
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

  return (
    <div 
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '480px',
        overflow: 'hidden',
        background: 'radial-gradient(circle at 50% 50%, #151b23 0%, #090d13 100%)',
        userSelect: 'none',
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 고지도 격자 및 양피지 분위기 오버레이 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, 0.6) 100%),
          linear-gradient(rgba(200, 159, 60, 0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(200, 159, 60, 0.04) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 40px 40px, 40px 40px',
        pointerEvents: 'none',
        zIndex: 1
      }} />

      {/* SVG 맵 캔버스 */}
      <svg
        viewBox="0 0 1000 700"
        style={{
          width: '100%',
          height: '100%',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: '50% 50%',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
      >
        <defs>
          {/* 하이라이트 글로우 필터 */}
          <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="blueGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. 인접 프로빈스 연결선 (Neighbors Border Connections) */}
        <g opacity="0.35">
          {provinces.map(p1 => 
            p1.neighbors.map(neighborId => {
              const p2 = provinces.find(p => p.id === neighborId);
              if (!p2 || p1.id > p2.id) return null; // 중복 선 방지
              const isSelectedRelation = selectedProvince && (p1.id === selectedProvince.id || p2.id === selectedProvince.id);
              return (
                <line
                  key={`${p1.id}-${p2.id}`}
                  x1={p1.center.x}
                  y1={p1.center.y}
                  x2={p2.center.x}
                  y2={p2.center.y}
                  stroke={isSelectedRelation ? '#fbbf24' : 'rgba(160, 140, 100, 0.4)'}
                  strokeWidth={isSelectedRelation ? 2.5 : 1.2}
                  strokeDasharray={isSelectedRelation ? '4 2' : '2 3'}
                />
              );
            })
          )}
        </g>

        {/* 2. 프로빈스 영역 폴리곤 (Polygons) */}
        <g>
          {provinces.map(prov => {
            const isSelected = selectedProvinceId === prov.id;
            const isHovered = hoveredProvinceId === prov.id;
            const isNeighborOfSelected = selectedProvince?.neighbors.includes(prov.id);

            let strokeColor = prov.borderColor;
            let strokeWidth = 1.5;

            if (isSelected) {
              strokeColor = '#f59e0b';
              strokeWidth = 3.5;
            } else if (isHovered) {
              strokeColor = '#ffffff';
              strokeWidth = 2.5;
            } else if (isNeighborOfSelected && selectedArmy) {
              // 이동 가능한 목표 프로빈스 하이라이트
              strokeColor = '#22c55e';
              strokeWidth = 2.5;
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
                  fill={prov.color}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  filter={isSelected ? 'url(#goldGlow)' : undefined}
                  style={{
                    transition: 'fill 0.2s ease, stroke 0.2s ease, stroke-width 0.2s ease',
                    opacity: isHovered ? 0.95 : 0.8
                  }}
                />

                {/* 프로빈스 이름 & 수도 라벨 */}
                <text
                  x={prov.center.x}
                  y={prov.center.y - 4}
                  textAnchor="middle"
                  fill={isSelected ? '#fef08a' : '#f3f4f6'}
                  fontSize={isSelected ? '13' : '11'}
                  fontWeight={isSelected || prov.isPlayerControlled ? '800' : '600'}
                  letterSpacing="0.5px"
                  style={{
                    textShadow: '0 2px 5px rgba(0,0,0,0.9), 0 0 2px #000',
                    pointerEvents: 'none'
                  }}
                >
                  {prov.isPlayerControlled && '👑 '}
                  {prov.name}
                </text>

                {/* 세력 소유권 / 영주 라벨 */}
                <text
                  x={prov.center.x}
                  y={prov.center.y + 11}
                  textAnchor="middle"
                  fill="rgba(209, 213, 219, 0.75)"
                  fontSize="9.5"
                  style={{
                    textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                    pointerEvents: 'none'
                  }}
                >
                  {prov.capital} ({prov.realmName})
                </text>
              </g>
            );
          })}
        </g>

        {/* 3. 군대 토큰 렌더링 (Armies) */}
        <g>
          {armies.map(army => {
            const prov = provinces.find(p => p.id === army.locationProvinceId);
            if (!prov) return null;

            // 이동 중일 경우 목적지와의 보간 좌표 계산
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
                {/* 군대 베이스 원형 */}
                <circle
                  r={isSelected ? 16 : 14}
                  fill={army.isPlayer ? '#1e40af' : '#991b1b'}
                  stroke={isSelected ? '#fbbf24' : '#f3f4f6'}
                  strokeWidth={isSelected ? 3 : 1.5}
                  filter="drop-shadow(0 4px 6px rgba(0,0,0,0.8))"
                />

                {/* 군대 아이콘 */}
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

                {/* 병력 수 배지 */}
                <rect
                  x={-24}
                  y={17}
                  width={48}
                  height={14}
                  rx={4}
                  fill="rgba(0, 0, 0, 0.85)"
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

                {/* 공성 진행 바 */}
                {army.isSieging && (
                  <g transform="translate(-20, -22)">
                    <rect width="40" height="5" rx="2" fill="rgba(0,0,0,0.7)" />
                    <rect width={Math.floor(army.siegeProgress * 0.4)} height="5" rx="2" fill="#eab308" />
                  </g>
                )}

                {/* 이동 중 진행 표시 */}
                {army.targetProvinceId && (
                  <g transform="translate(-20, -22)">
                    <rect width="40" height="5" rx="2" fill="rgba(0,0,0,0.7)" />
                    <rect width={Math.floor(army.movementProgress * 0.4)} height="5" rx="2" fill="#3b82f6" />
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* 우측 상단 맵 컨트롤러 (Zoom, Reset) */}
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
          onClick={() => handleZoom(0.2)}
          title="지도 확대"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(26, 20, 15, 0.85)',
            border: '1px solid rgba(200, 159, 60, 0.4)',
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
          onClick={() => handleZoom(-0.2)}
          title="지도 축소"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(26, 20, 15, 0.85)',
            border: '1px solid rgba(200, 159, 60, 0.4)',
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
            background: 'rgba(26, 20, 15, 0.85)',
            border: '1px solid rgba(200, 159, 60, 0.4)',
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

      {/* 좌측 상단 조작 안내 가이드 */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        padding: '8px 14px',
        borderRadius: '8px',
        background: 'rgba(15, 11, 8, 0.85)',
        border: '1px solid rgba(200, 159, 60, 0.3)',
        color: '#d6d3d1',
        fontSize: '11px',
        zIndex: 10,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Compass size={14} color="#f59e0b" />
        <span>
          {selectedArmy 
            ? `⚔️ 군대 선택됨 (${selectedArmy.name}) → 인접한 초록색 테두리 영지를 클릭하여 진군`
            : '🗺️ 영지 클릭: 상세 정보 및 외교 / 군대 클릭: 행군 명령 / 마우스 드래그: 지도 이동'}
        </span>
      </div>
    </div>
  );
}
