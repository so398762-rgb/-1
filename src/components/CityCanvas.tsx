import React, { useRef, useEffect, useCallback } from 'react';
import { CityEntity, Particle, SimulationMetrics, SimulationState, SimulationStep } from '../types';
import { TSUNAMI_INTENSITY_CONFIGS } from '../data/tsunamiPresets';

interface CityCanvasProps {
  entities: CityEntity[];
  metrics: SimulationMetrics;
  simState: SimulationState;
  intensity: number;
  onSelectEntity: (entity: CityEntity) => void;
  selectedEntityId: string | null;
}

export const CityCanvas: React.FC<CityCanvasProps> = ({
  entities,
  metrics,
  simState,
  intensity,
  onSelectEntity,
  selectedEntityId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const hoveredEntityIdRef = useRef<string | null>(null);
  const dprRef = useRef<number>(1);

  const config = TSUNAMI_INTENSITY_CONFIGS[intensity] || TSUNAMI_INTENSITY_CONFIGS[5];

  // Particle generator helper
  const addParticle = (p: Omit<Particle, 'id'>) => {
    if (particlesRef.current.length > 350) return; // Particle cap
    particlesRef.current.push({
      ...p,
      id: Math.random(),
    });
  };

  // Main Render Loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = dprRef.current || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    if (width <= 0 || height <= 0) return;

    // Reset transform to support DPR
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    timeRef.current += 0.03;
    const t = timeRef.current;

    ctx.clearRect(0, 0, width, height);

    // ==========================================
    // 1. SKY & ATMOSPHERE
    // ==========================================
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.75);
    if (simState === 'running' && metrics.intensity >= 6) {
      skyGrad.addColorStop(0, '#0a0f1d'); // Stormy overcast
      skyGrad.addColorStop(0.5, '#162032');
      skyGrad.addColorStop(1, '#253549');
    } else {
      skyGrad.addColorStop(0, '#071126');
      skyGrad.addColorStop(0.5, '#0f224a');
      skyGrad.addColorStop(1, '#1b3b6f');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Distant soft clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.arc(width * 0.2 + Math.sin(t * 0.15) * 15, height * 0.18, 100, 0, Math.PI * 2);
    ctx.arc(width * 0.35 + Math.sin(t * 0.15) * 15, height * 0.14, 80, 0, Math.PI * 2);
    ctx.arc(width * 0.75 + Math.cos(t * 0.12) * 20, height * 0.22, 130, 0, Math.PI * 2);
    ctx.fill();

    // Distant mountain silhouette behind high ground
    ctx.fillStyle = '#0a162c';
    ctx.beginPath();
    ctx.moveTo(width * 0.55, height * 0.75);
    ctx.lineTo(width * 0.72, height * 0.46);
    ctx.lineTo(width * 0.84, height * 0.54);
    ctx.lineTo(width, height * 0.36);
    ctx.lineTo(width, height * 0.75);
    ctx.lineTo(width * 0.55, height * 0.75);
    ctx.closePath();
    ctx.fill();

    // ==========================================
    // 2. TERRAIN PROFILE (Coastline, urban slope, high ground)
    // ==========================================
    const coastX = width * 0.20; // 20% is where the land begins
    const seaFloorY = height * 0.86;
    const coastLandY = height * 0.74;
    const inlandHighY = height * 0.58;

    // Helper to calculate terrain Y for any x percentage (0..100)
    const getTerrainY = (xPct: number) => {
      const x = (xPct / 100) * width;
      if (x <= coastX) {
        const factor = Math.max(0, x / coastX);
        return seaFloorY - factor * (seaFloorY - coastLandY);
      }
      // Gentle slope rising from coast to high evacuation hill
      const urbanFactor = (x - coastX) / (width - coastX);
      return coastLandY - Math.pow(urbanFactor, 1.2) * (coastLandY - inlandHighY);
    };

    // Deep seabed & ground slope
    const groundGrad = ctx.createLinearGradient(0, height * 0.55, width, height);
    groundGrad.addColorStop(0, '#030814'); // Deep seabed
    groundGrad.addColorStop(0.2, '#0f172a'); // Coast base
    groundGrad.addColorStop(0.5, '#1e293b'); // City soil
    groundGrad.addColorStop(0.85, '#334155'); // Hill rock
    groundGrad.addColorStop(1, '#1e293b');

    ctx.fillStyle = groundGrad;
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, seaFloorY);
    ctx.bezierCurveTo(coastX * 0.35, seaFloorY, coastX * 0.7, coastLandY + 18, coastX, coastLandY);
    
    // Urban slope
    const stepCount = 20;
    for (let i = 1; i <= stepCount; i++) {
      const currentPct = 20 + (i / stepCount) * 80;
      const xVal = (currentPct / 100) * width;
      const yVal = getTerrainY(currentPct);
      ctx.lineTo(xVal, yVal);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    // Road & Pavement Top Line
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(coastX, coastLandY);
    for (let i = 1; i <= stepCount; i++) {
      const currentPct = 20 + (i / stepCount) * 80;
      ctx.lineTo((currentPct / 100) * width, getTerrainY(currentPct));
    }
    ctx.stroke();

    // Beach Sand / Concrete foundation band
    ctx.fillStyle = '#64748b';
    ctx.fillRect(coastX - 16, coastLandY - 2, 32, 14);

    // ==========================================
    // 3. TSUNAMI WAVE & WATER CALCULATION
    // ==========================================
    const normalSeaY = coastLandY + 4; // normal calm water level
    const waveProgress = metrics.currentWaveFrontX / 100; // 0 to 1
    const maxWaveHeightPx = Math.min(height * 0.45, (config.waveHeightMeters / 32) * (height * 0.42));
    const waveFrontX = width * waveProgress;

    // Calculate water height function at position x
    const getWaterLevelAtX = (x: number) => {
      if (simState === 'idle') {
        if (x > coastX + 8) return height + 100; // Dry land
        return normalSeaY + Math.sin(x * 0.05 + t * 2) * 2.5;
      }

      // During Simulation
      if (x > waveFrontX + 20) {
        if (x <= coastX + 8 && waveFrontX < coastX) {
          return normalSeaY + Math.sin(x * 0.05 + t * 2) * 2.5;
        }
        return height + 100; // Wave hasn't reached yet
      }

      const distFromFront = waveFrontX - x;
      if (distFromFront >= 0 && distFromFront < 160) {
        // Wave peak curve (Shoaling wave crest)
        const crestFactor = Math.sin((distFromFront / 160) * Math.PI);
        const surgeHeight = maxWaveHeightPx * crestFactor;
        const baseWaterY = normalSeaY - (maxWaveHeightPx * 0.35 * Math.min(1, waveProgress * 1.5));
        return baseWaterY - surgeHeight + Math.sin(x * 0.08 + t * 3) * 4;
      } else if (distFromFront >= 160) {
        // Trailing flooded water body
        const floodDecay = Math.max(0.35, 1 - (distFromFront - 160) / (width * 0.85));
        const floodedHeight = maxWaveHeightPx * 0.45 * floodDecay;
        return normalSeaY - floodedHeight + Math.sin(x * 0.04 + t * 2) * 3;
      }

      return normalSeaY + Math.sin(x * 0.05 + t * 2) * 2.5;
    };

    // Spawn spray/foam particles at wave front
    if (simState === 'running' && waveFrontX > 10 && waveFrontX < width + 30) {
      const crestY = getWaterLevelAtX(waveFrontX - 25);
      for (let i = 0; i < Math.ceil(intensity * 0.7); i++) {
        addParticle({
          x: waveFrontX - 15 + (Math.random() * 30 - 15),
          y: crestY + Math.random() * 12,
          vx: (Math.random() * 3 + 1.5) * (intensity / 5),
          vy: -(Math.random() * 4 + 2) * (intensity / 5),
          size: Math.random() * 3.5 + 1.5,
          color: Math.random() > 0.3 ? '#ffffff' : '#67e8f9',
          alpha: 0.9,
          life: 0,
          maxLife: 25 + Math.random() * 15,
          type: 'spray',
        });
      }
    }

    // ==========================================
    // 4. DRAW CITY ENTITIES (BUILDINGS, POLES, CARS, ETC.)
    // ==========================================
    entities.forEach((entity) => {
      const entityX = (entity.x / 100) * width + entity.displacementX;
      const baseGroundY = getTerrainY(entity.x);
      const entityY = baseGroundY + entity.displacementY;
      
      const isSelected = selectedEntityId === entity.id;
      const isHovered = hoveredEntityIdRef.current === entity.id;

      ctx.save();
      ctx.translate(entityX, entityY);
      ctx.rotate((entity.tiltAngle * Math.PI) / 180);

      // Shaking effect during intense wave surge
      if (entity.shakingIntensity > 0) {
        const shakeX = (Math.random() - 0.5) * entity.shakingIntensity * 2;
        const shakeY = (Math.random() - 0.5) * entity.shakingIntensity * 2;
        ctx.translate(shakeX, shakeY);
      }

      // Selection / Hover Halo
      if (isSelected || isHovered) {
        ctx.strokeStyle = isSelected ? '#00f0ff' : '#38bdf8';
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(-entity.width / 2 - 4, -entity.height - 4, entity.width + 8, entity.height + 8);
        ctx.setLineDash([]);
      }

      // Draw each entity type with rich vector geometry
      switch (entity.type) {
        case 'breakwater': {
          const breakwaterW = entity.width * 1.5;
          const breakwaterH = entity.height;
          
          if (entity.status === 'collapsed') {
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.moveTo(-breakwaterW / 2, 0);
            ctx.lineTo(-breakwaterW * 0.2, -breakwaterH * 0.35);
            ctx.lineTo(breakwaterW * 0.3, -breakwaterH * 0.2);
            ctx.lineTo(breakwaterW / 2, 0);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else {
            // Seawall body
            ctx.fillStyle = '#64748b';
            ctx.fillRect(-breakwaterW / 2, -breakwaterH, breakwaterW, breakwaterH);
            
            // Wall cap
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(-breakwaterW / 2 - 2, -breakwaterH - 4, breakwaterW + 4, 6);

            // Tetrapod blocks in front
            ctx.fillStyle = '#475569';
            for (let i = -2; i <= 2; i++) {
              ctx.beginPath();
              ctx.arc(-breakwaterW / 2 + (i + 2.5) * (breakwaterW / 5) - 4, -8, 6, 0, Math.PI * 2);
              ctx.fill();
            }

            if (entity.brokenWindows || entity.status === 'cracked' || entity.status === 'tilted') {
              ctx.strokeStyle = '#0f172a';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(-8, -breakwaterH + 4);
              ctx.lineTo(4, -breakwaterH / 2);
              ctx.lineTo(-4, 0);
              ctx.stroke();
            }
          }
          break;
        }

        case 'port_dock': {
          // Harbor pier & crane
          ctx.fillStyle = '#334155';
          ctx.fillRect(-entity.width / 2, -8, entity.width, 8);
          // Pilings
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-entity.width / 2 + 4, 0, 4, 20);
          ctx.fillRect(entity.width / 2 - 8, 0, 4, 20);

          // Crane
          if (entity.status !== 'collapsed') {
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-4, -8);
            ctx.lineTo(-4, -entity.height);
            ctx.lineTo(14, -entity.height + 8);
            ctx.stroke();
            // Boom
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-10, -entity.height + 4);
            ctx.lineTo(22, -entity.height - 6);
            ctx.stroke();
          } else {
            ctx.strokeStyle = '#b45309';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-8, -8);
            ctx.lineTo(12, -4);
            ctx.lineTo(20, -2);
            ctx.stroke();
          }
          break;
        }

        case 'boat': {
          const boatW = entity.width * 1.3;
          const boatH = entity.height;
          
          ctx.fillStyle = entity.status === 'collapsed' ? '#475569' : (entity.customDetails?.color || '#e11d48');
          ctx.beginPath();
          ctx.moveTo(-boatW / 2, -boatH * 0.6);
          ctx.lineTo(-boatW * 0.3, 0);
          ctx.lineTo(boatW * 0.4, 0);
          ctx.lineTo(boatW / 2, -boatH * 0.8);
          ctx.lineTo(-boatW / 2, -boatH * 0.6);
          ctx.closePath();
          ctx.fill();

          // Cabin
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(-boatW * 0.2, -boatH, boatW * 0.4, boatH * 0.5);
          // Mast
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, -boatH);
          ctx.lineTo(0, -boatH - 10);
          ctx.stroke();
          break;
        }

        case 'road': {
          // Road segment marker
          ctx.fillStyle = '#334155';
          ctx.fillRect(-entity.width / 2, -4, entity.width, 4);
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.moveTo(-entity.width / 2, -2);
          ctx.lineTo(entity.width / 2, -2);
          ctx.stroke();
          ctx.setLineDash([]);
          break;
        }

        case 'car': {
          const carW = entity.width * 1.3;
          const carH = entity.height;
          const isTruck = entity.customDetails?.subType === 'truck';

          ctx.fillStyle = entity.customDetails?.color || '#0284c7';
          if (isTruck) {
            ctx.fillRect(-carW / 2, -carH, carW * 0.65, carH - 2);
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(carW * 0.15, -carH * 1.2, carW * 0.35, carH * 1.2 - 2);
          } else {
            ctx.fillRect(-carW / 2, -carH * 0.55, carW, carH * 0.55 - 2);
            ctx.fillRect(-carW * 0.3, -carH, carW * 0.6, carH * 0.55);
            // Window
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(-carW * 0.25, -carH + 2, carW * 0.5, carH * 0.4);
          }

          // Wheels
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(-carW * 0.3, -2, 2.5, 0, Math.PI * 2);
          ctx.arc(carW * 0.3, -2, 2.5, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'tree': {
          ctx.fillStyle = '#78350f';
          ctx.fillRect(-2, -entity.height * 0.4, 4, entity.height * 0.4);

          ctx.fillStyle = entity.status === 'collapsed' ? '#14532d' : '#15803d';
          ctx.beginPath();
          ctx.moveTo(-entity.width / 2, -entity.height * 0.35);
          ctx.lineTo(0, -entity.height);
          ctx.lineTo(entity.width / 2, -entity.height * 0.35);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(-entity.width * 0.35, -entity.height * 0.55);
          ctx.lineTo(0, -entity.height * 1.1);
          ctx.lineTo(entity.width * 0.35, -entity.height * 0.55);
          ctx.closePath();
          ctx.fill();
          break;
        }

        case 'power_pole': {
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(-2, -entity.height, 4, entity.height);

          ctx.fillStyle = '#475569';
          ctx.fillRect(-entity.width, -entity.height + 4, entity.width * 2, 3);

          ctx.fillStyle = '#64748b';
          ctx.fillRect(3, -entity.height + 8, 5, 7);

          if (entity.powerLineSnapped) {
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(0, -entity.height + 4, 3 + Math.sin(t * 15) * 2, 0, Math.PI * 2);
            ctx.fill();
            if (Math.random() > 0.65) {
              addParticle({
                x: entityX,
                y: entityY - entity.height + 4,
                vx: (Math.random() - 0.5) * 3,
                vy: -Math.random() * 3,
                size: 2,
                color: '#facc15',
                alpha: 1,
                life: 0,
                maxLife: 15,
                type: 'spark',
              });
            }
          }
          break;
        }

        case 'house': {
          const houseW = entity.width * 1.3;
          const houseH = entity.height;
          
          if (entity.status === 'collapsed') {
            ctx.fillStyle = '#b45309';
            ctx.beginPath();
            ctx.moveTo(-houseW / 2, 0);
            ctx.lineTo(-houseW * 0.2, -houseH * 0.3);
            ctx.lineTo(houseW * 0.3, -houseH * 0.15);
            ctx.lineTo(houseW / 2, 0);
            ctx.closePath();
            ctx.fill();
          } else {
            // Walls
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(-houseW / 2, -houseH * 0.65, houseW, houseH * 0.65);

            // Roof
            if (entity.status !== 'roof_torn') {
              ctx.fillStyle = entity.customDetails?.color || '#f97316';
              ctx.beginPath();
              ctx.moveTo(-houseW / 2 - 3, -houseH * 0.65);
              ctx.lineTo(0, -houseH);
              ctx.lineTo(houseW / 2 + 3, -houseH * 0.65);
              ctx.closePath();
              ctx.fill();
            }

            // Windows
            ctx.fillStyle = entity.brokenWindows ? '#1e293b' : '#38bdf8';
            ctx.fillRect(-houseW * 0.35, -houseH * 0.5, 7, 7);
            ctx.fillRect(houseW * 0.35 - 7, -houseH * 0.5, 7, 7);
            
            // Door
            ctx.fillStyle = '#78350f';
            ctx.fillRect(-3, -12, 6, 12);
          }
          break;
        }

        case 'commercial': {
          const bW = entity.width * 1.25;
          const bH = entity.height;

          if (entity.status === 'collapsed') {
            ctx.fillStyle = '#334155';
            ctx.fillRect(-bW / 2, -bH * 0.3, bW, bH * 0.3);
          } else {
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(-bW / 2, -bH, bW, bH);

            // Floor stripes
            ctx.fillStyle = '#64748b';
            ctx.fillRect(-bW / 2, -bH + 16, bW, 2.5);
            ctx.fillRect(-bW / 2, -bH + 34, bW, 2.5);

            // Signboard
            ctx.fillStyle = '#6366f1';
            ctx.fillRect(-bW * 0.4, -bH + 3, bW * 0.8, 7);

            // Windows grid
            const winCols = 3;
            const winRows = 3;
            for (let r = 0; r < winRows; r++) {
              for (let c = 0; c < winCols; c++) {
                const winX = -bW / 2 + 5 + c * (bW / winCols);
                const winY = -bH + 12 + r * 16;
                ctx.fillStyle = entity.brokenWindows && r >= 1 ? '#0f172a' : '#0284c7';
                ctx.fillRect(winX, winY, bW / winCols - 6, 8);
              }
            }
          }
          break;
        }

        case 'school': {
          const sW = entity.width * 1.2;
          const sH = entity.height;

          if (entity.status === 'collapsed') {
            ctx.fillStyle = '#475569';
            ctx.fillRect(-sW / 2, -sH * 0.35, sW, sH * 0.35);
          } else {
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(-sW / 2, -sH * 0.75, sW, sH * 0.75);

            // Clock Tower
            ctx.fillStyle = '#eab308';
            ctx.fillRect(-8, -sH, 16, sH * 0.3);
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, -sH + 8, 5, 0, Math.PI * 2);
            ctx.fill();

            // Windows
            for (let i = 0; i < 4; i++) {
              ctx.fillStyle = entity.brokenWindows ? '#0f172a' : '#38bdf8';
              ctx.fillRect(-sW / 2 + 5 + i * (sW / 4), -sH * 0.6, sW / 4 - 5, 10);
              ctx.fillRect(-sW / 2 + 5 + i * (sW / 4), -sH * 0.35, sW / 4 - 5, 10);
            }
          }
          break;
        }

        case 'hospital': {
          const hW = entity.width * 1.15;
          const hH = entity.height;

          ctx.fillStyle = '#f1f5f9';
          ctx.fillRect(-hW / 2, -hH, hW, hH);

          // Helipad rooftop
          ctx.fillStyle = '#475569';
          ctx.fillRect(-hW * 0.4, -hH - 4, hW * 0.8, 4);

          // Red Cross Sign
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-3, -hH + 8, 6, 16);
          ctx.fillRect(-8, -hH + 13, 16, 6);

          // Windows
          for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
              ctx.fillStyle = entity.brokenWindows && r >= 2 ? '#0f172a' : '#0ea5e9';
              ctx.fillRect(-hW / 2 + 4 + c * (hW / 4), -hH + 28 + r * 10, hW / 4 - 5, 6);
            }
          }
          break;
        }

        case 'apartment': {
          const aW = entity.width * 1.1;
          const aH = entity.height;

          if (entity.status === 'collapsed') {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(-aW / 2, -aH * 0.4, aW, aH * 0.4);
          } else {
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(-aW / 2, -aH, aW, aH);

            const floors = 7;
            for (let f = 0; f < floors; f++) {
              const floorY = -aH + f * (aH / floors);
              ctx.fillStyle = '#64748b';
              ctx.fillRect(-aW / 2 + 3, floorY + (aH / floors) - 2.5, aW - 6, 2.5);

              ctx.fillStyle = entity.brokenWindows && f >= 4 ? '#0f172a' : '#38bdf8';
              ctx.fillRect(-aW * 0.38, floorY + 2, aW * 0.32, (aH / floors) - 5);
              ctx.fillRect(aW * 0.06, floorY + 2, aW * 0.32, (aH / floors) - 5);
            }
          }
          break;
        }

        case 'skyscraper': {
          const skyW = entity.width * 1.05;
          const skyH = entity.height;

          // Glass facade gradient
          const bGrad = ctx.createLinearGradient(-skyW / 2, -skyH, skyW / 2, 0);
          bGrad.addColorStop(0, '#0284c7');
          bGrad.addColorStop(0.5, '#0ea5e9');
          bGrad.addColorStop(1, '#0369a1');
          ctx.fillStyle = bGrad;
          ctx.fillRect(-skyW / 2, -skyH, skyW, skyH);

          // Steel frame
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-skyW / 2, -skyH, skyW, skyH);

          // Window lines
          for (let f = 0; f < 12; f++) {
            const yPos = -skyH + f * (skyH / 12);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(-skyW / 2, yPos);
            ctx.lineTo(skyW / 2, yPos);
            ctx.stroke();
          }

          // Antenna Spire with warning beacon
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, -skyH);
          ctx.lineTo(0, -skyH - 16);
          ctx.stroke();

          ctx.fillStyle = Math.sin(t * 6) > 0 ? '#ef4444' : 'rgba(239, 68, 68, 0.2)';
          ctx.beginPath();
          ctx.arc(0, -skyH - 16, 2.5, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'evacuation_hill': {
          const hW = entity.width * 1.3;
          const hH = entity.height;

          // Safety shelter tower
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(-hW * 0.3, -hH, hW * 0.6, hH * 0.6);

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-hW * 0.2, -hH + 5, hW * 0.4, 5);
          ctx.font = 'bold 8px sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.fillText('EVAC', -10, -hH + 20);

          // Green beacon
          ctx.fillStyle = '#4ade80';
          ctx.beginPath();
          ctx.arc(0, -hH - 5, 4 + Math.sin(t * 4) * 2, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
      }

      // Building Label Tag (Hover or Selection)
      if (isSelected || isHovered) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1;
        const tagText = `${entity.koreanName} (${entity.elevation}m)`;
        ctx.font = 'bold 10px sans-serif';
        const textMetrics = ctx.measureText(tagText);
        ctx.fillRect(-textMetrics.width / 2 - 5, -entity.height - 22, textMetrics.width + 10, 16);
        ctx.strokeRect(-textMetrics.width / 2 - 5, -entity.height - 22, textMetrics.width + 10, 16);
        ctx.fillStyle = '#00f0ff';
        ctx.fillText(tagText, -textMetrics.width / 2, -entity.height - 10);
      }

      ctx.restore();
    });

    // ==========================================
    // 5. DRAW DYNAMIC WATER BODIES & SURGE LAYERS
    // ==========================================
    const waterGrad = ctx.createLinearGradient(0, height * 0.35, 0, height);
    if (simState === 'running' && metrics.intensity >= 6) {
      waterGrad.addColorStop(0, 'rgba(15, 76, 129, 0.82)'); // Turbulent dark sea
      waterGrad.addColorStop(0.5, 'rgba(12, 47, 86, 0.88)');
      waterGrad.addColorStop(1, 'rgba(4, 20, 48, 0.95)');
    } else {
      waterGrad.addColorStop(0, 'rgba(6, 182, 212, 0.76)');
      waterGrad.addColorStop(0.4, 'rgba(2, 132, 199, 0.84)');
      waterGrad.addColorStop(1, 'rgba(3, 105, 161, 0.92)');
    }

    ctx.fillStyle = waterGrad;
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, getWaterLevelAtX(0));

    const stepSize = 8;
    const maxX = simState === 'idle' ? coastX + 6 : Math.min(width, waveFrontX + 25);
    for (let x = 0; x <= maxX; x += stepSize) {
      const y = getWaterLevelAtX(x);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(maxX, getTerrainY((maxX / width) * 100));
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Water Surface Whitecap line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, getWaterLevelAtX(0));
    for (let x = 0; x <= maxX; x += stepSize) {
      const y = getWaterLevelAtX(x);
      ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Flow Streamlines during running simulation
    if (simState === 'running') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) {
        const streamX = ((t * 70 + i * 85) % (maxX + 10));
        const streamY = getWaterLevelAtX(streamX) + 12 + i * 10;
        if (streamY < height) {
          ctx.beginPath();
          ctx.moveTo(streamX - 20, streamY);
          ctx.lineTo(streamX + 12, streamY + Math.sin(t * 4 + i) * 2.5);
          ctx.stroke();
        }
      }
    }

    // ==========================================
    // 6. UPDATE & DRAW PARTICLES
    // ==========================================
    const aliveParticles: Particle[] = [];
    particlesRef.current.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12; // Gravity
      p.life++;
      const lifeRatio = p.life / p.maxLife;
      const alpha = Math.max(0, p.alpha * (1 - lifeRatio));

      if (lifeRatio < 1 && p.y < height) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        aliveParticles.push(p);
      }
    });
    particlesRef.current = aliveParticles;

    // ==========================================
    // 7. HUD OVERLAYS ON CANVAS
    // ==========================================
    // Coastline Marker
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(coastX, height * 0.38);
    ctx.lineTo(coastX, height * 0.92);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(14, 165, 233, 0.9)';
    ctx.font = '10px "Share Tech Mono", monospace';
    ctx.fillText('▼ COASTLINE (해안선 0m)', coastX - 45, height * 0.36);

    // Live wave crest tag
    if (simState === 'running' && waveFrontX > 25 && waveFrontX < width) {
      const crestY = getWaterLevelAtX(waveFrontX - 25);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.fillRect(waveFrontX - 60, crestY - 28, 120, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(`🌊 ${config.waveHeightMeters.toFixed(1)}m (${config.waveSpeedKmh}km/h)`, waveFrontX - 55, crestY - 14);
    }

    // Step Status Badge in top-left
    const stepTitles: Record<SimulationStep, string> = {
      1: 'STEP 1: 해저 지진 및 수평선 파도 생성',
      2: 'STEP 2: 천수효과 및 고속 파도 접근',
      3: 'STEP 3: 방파제 충돌 및 해안선 침수',
      4: 'STEP 4: 도시 침수 및 구조물 붕괴',
      5: 'STEP 5: 최대 침수 도달 및 피해 집계',
    };

    ctx.fillStyle = 'rgba(11, 19, 43, 0.88)';
    ctx.strokeStyle = simState === 'running' ? '#ef4444' : '#0ea5e9';
    ctx.lineWidth = 1.2;
    ctx.fillRect(14, 14, 280, 32);
    ctx.strokeRect(14, 14, 280, 32);

    ctx.fillStyle = simState === 'running' ? '#f87171' : '#38bdf8';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(stepTitles[metrics.activeStep], 22, 34);

    // Request next frame
    animationFrameRef.current = requestAnimationFrame(render);
  }, [entities, metrics, simState, intensity, selectedEntityId, config]);

  // Robust Canvas Resize Observer
  useEffect(() => {
    const updateCanvasSize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      dprRef.current = dpr;

      if (rect.width > 0 && rect.height > 0) {
        canvasRef.current.width = Math.floor(rect.width * dpr);
        canvasRef.current.height = Math.floor(rect.height * dpr);
      }
    };

    updateCanvasSize();

    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updateCanvasSize();
      });
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateCanvasSize);
    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  // Run Animation Loop
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  // Click & Hover handler on Canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickXPercent = (clickX / rect.width) * 100;

    let closestEntity: CityEntity | null = null;
    let minDist = 8; // threshold in %

    entities.forEach((entity) => {
      const dist = Math.abs(entity.x - clickXPercent);
      if (dist < minDist) {
        minDist = dist;
        closestEntity = entity;
      }
    });

    if (closestEntity) {
      onSelectEntity(closestEntity);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const hoverXPercent = (hoverX / rect.width) * 100;

    let foundId: string | null = null;
    entities.forEach((entity) => {
      if (Math.abs(entity.x - hoverXPercent) < 4) {
        foundId = entity.id;
      }
    });
    hoveredEntityIdRef.current = foundId;
  };

  return (
    <div
      ref={containerRef}
      id="simulation_canvas_container"
      className="relative w-full h-[380px] md:h-[480px] lg:h-[540px] bg-[#070d1e] rounded-xl overflow-hidden border border-slate-700/80 shadow-2xl hud-glow"
    >
      <canvas
        ref={canvasRef}
        id="tsunami_2d_canvas"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        className="w-full h-full cursor-crosshair block"
      />

      {/* Floating Instructions & Watermark */}
      <div className="absolute bottom-3 left-4 flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-700">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        <span>💡 건물을 클릭하면 상세 내진/침수 데이터를 확인할 수 있습니다.</span>
      </div>

      {/* Educational Notice Badge */}
      <div className="absolute top-3 right-4 bg-slate-900/80 backdrop-blur-sm px-3 py-1 rounded-md border border-slate-700/80 text-[11px] font-mono-tech text-amber-300 flex items-center gap-1.5">
        <span className="text-amber-400">⚠️</span>
        <span>가상 해안 도시 물리 교육 모델</span>
      </div>
    </div>
  );
};
