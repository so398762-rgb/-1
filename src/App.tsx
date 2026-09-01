import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Waves, Shield, Activity, RotateCcw, AlertTriangle, Layers, BookOpen, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { TSUNAMI_INTENSITY_CONFIGS, INITIAL_CITY_ENTITIES } from './data/tsunamiPresets';
import { CityEntity, SimulationMetrics, SimulationState, SimulationStep } from './types';
import { CityCanvas } from './components/CityCanvas';
import { ControlPanel } from './components/ControlPanel';
import { DamageMetricsPanel } from './components/DamageMetricsPanel';
import { CompareModal } from './components/CompareModal';
import { ScienceExplanation } from './components/ScienceExplanation';
import { EntityInspectorModal } from './components/EntityInspectorModal';
import { soundManager } from './utils/audioSynthesizer';

export default function App() {
  const [intensity, setIntensity] = useState<number>(7);
  const [simState, setSimState] = useState<SimulationState>('idle');
  const [activeStep, setActiveStep] = useState<SimulationStep>(1);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [selectedEntity, setSelectedEntity] = useState<CityEntity | null>(null);

  // Entities & Dynamic Simulation Metrics
  const [entities, setEntities] = useState<CityEntity[]>(() => JSON.parse(JSON.stringify(INITIAL_CITY_ENTITIES)));

  const currentConfig = TSUNAMI_INTENSITY_CONFIGS[intensity] || TSUNAMI_INTENSITY_CONFIGS[5];

  const [metrics, setMetrics] = useState<SimulationMetrics>({
    intensity: 7,
    waveHeight: currentConfig.waveHeightMeters,
    waveSpeed: currentConfig.waveSpeedKmh,
    inundationAreaPct: 0,
    buildingDamagePct: 0,
    facilityDamagePct: 0,
    roadDamagePct: 0,
    currentWaveFrontX: 0,
    elapsedSeconds: 0,
    waterVolumeEstimate: 0,
    activeStep: 1,
  });

  const animFrameRef = useRef<number | null>(null);
  const waveProgressRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  // Sound triggers ref to avoid multiple plays
  const soundPlayedRef = useRef<{ alarm: boolean; surge: boolean; impact: boolean; shatter: boolean }>({
    alarm: false,
    surge: false,
    impact: false,
    shatter: false,
  });

  // Handle Intensity slider change
  const handleIntensityChange = (newIntensity: number) => {
    if (simState === 'running') return;
    setIntensity(newIntensity);
    const cfg = TSUNAMI_INTENSITY_CONFIGS[newIntensity];
    setMetrics((prev) => ({
      ...prev,
      intensity: newIntensity,
      waveHeight: cfg.waveHeightMeters,
      waveSpeed: cfg.waveSpeedKmh,
      inundationAreaPct: 0,
      buildingDamagePct: 0,
      facilityDamagePct: 0,
      roadDamagePct: 0,
      currentWaveFrontX: 0,
    }));
  };

  // Reset Simulation
  const handleReset = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    soundManager.stopAll();
    setSimState('idle');
    setActiveStep(1);
    waveProgressRef.current = 0;
    soundPlayedRef.current = { alarm: false, surge: false, impact: false, shatter: false };

    // Reset entities to fresh clone
    const freshEntities: CityEntity[] = JSON.parse(JSON.stringify(INITIAL_CITY_ENTITIES));
    setEntities(freshEntities);

    const cfg = TSUNAMI_INTENSITY_CONFIGS[intensity];
    setMetrics({
      intensity,
      waveHeight: cfg.waveHeightMeters,
      waveSpeed: cfg.waveSpeedKmh,
      inundationAreaPct: 0,
      buildingDamagePct: 0,
      facilityDamagePct: 0,
      roadDamagePct: 0,
      currentWaveFrontX: 0,
      elapsedSeconds: 0,
      waterVolumeEstimate: 0,
      activeStep: 1,
    });
  }, [intensity]);

  // Start Simulation
  const handleStartSimulation = () => {
    if (simState === 'running') return;
    handleReset();
    setSimState('running');
    lastTimeRef.current = performance.now();
    soundManager.playAlarm();
    soundPlayedRef.current.alarm = true;
  };

  // Toggle Pause
  const handleTogglePause = () => {
    if (simState === 'running') {
      setSimState('paused');
    } else if (simState === 'paused') {
      setSimState('running');
      lastTimeRef.current = performance.now();
    }
  };

  // Sound Mute Toggle
  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  // Main Simulation Step & Physics Loop
  useEffect(() => {
    if (simState !== 'running') return;

    const tick = (now: number) => {
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      // Base advance rate scaled by simulation speed (takes ~8-10 seconds total)
      const advanceSpeed = (12 * simSpeed);
      waveProgressRef.current += advanceSpeed * delta;
      const progress = Math.min(100, waveProgressRef.current);

      // 1. Determine Current Step (1..5)
      let step: SimulationStep = 1;
      if (progress < 22) {
        step = 1; // 바다 변화 (수평선 파도 생성)
        if (!soundPlayedRef.current.surge && progress > 8) {
          soundManager.playWaveSurge(intensity);
          soundPlayedRef.current.surge = true;
        }
      } else if (progress < 45) {
        step = 2; // 파도 이동 (천수효과 & 파고 급증)
      } else if (progress < 68) {
        step = 3; // 해안 침수 (방파제 충돌 & 도로 유입)
        if (!soundPlayedRef.current.impact && progress > 48) {
          soundManager.playImpact(intensity);
          soundPlayedRef.current.impact = true;
        }
      } else if (progress < 92) {
        step = 4; // 도시 피해 (구조물 붕괴 & 차량 부유)
        if (!soundPlayedRef.current.shatter && progress > 72 && intensity >= 4) {
          soundManager.playShatter();
          soundPlayedRef.current.shatter = true;
        }
      } else {
        step = 5; // 최종 평가 (잔해 수렴 & 집계)
      }

      setActiveStep(step);

      // 2. Physics & Damage Engine for Entities
      const coastThresholdX = 22; // Land starts at ~22%
      const currentWaveFront = progress;

      const updatedEntities = INITIAL_CITY_ENTITIES.map((initEntity) => {
        const entity = { ...initEntity };
        // Check if wave has reached this entity's x position
        const hasReached = currentWaveFront >= entity.x - 3;
        const distPast = Math.max(0, currentWaveFront - entity.x);

        if (!hasReached) {
          return entity;
        }

        // Entity-specific progressive damage
        const waterHeightM = currentConfig.waveHeightMeters;
        const waterDepthAtEntity = Math.max(0, waterHeightM - entity.elevation);
        entity.currentWaterDepth = waterDepthAtEntity;

        // Base hydrodynamic stress
        const surgeForce = (intensity / 10) * Math.min(1, distPast / 25);

        // Shake
        entity.shakingIntensity = surgeForce > 0.3 ? surgeForce * 3 : 0;

        // Specific entity type behaviors based on intensity specifications:
        if (entity.type === 'breakwater') {
          if (intensity <= 4) {
            entity.status = 'splashed';
            entity.structuralIntegrity = Math.max(80, 100 - surgeForce * 20);
          } else if (intensity <= 6) {
            entity.status = 'cracked';
            entity.structuralIntegrity = Math.max(45, 100 - surgeForce * 55);
          } else {
            entity.status = 'collapsed';
            entity.structuralIntegrity = Math.max(5, 100 - surgeForce * 95);
          }
        } else if (entity.type === 'port_dock') {
          if (intensity <= 2) {
            entity.status = 'splashed';
            entity.structuralIntegrity = 90;
          } else if (intensity <= 5) {
            entity.status = 'partially_flooded';
            entity.structuralIntegrity = Math.max(40, 100 - surgeForce * 60);
          } else {
            entity.status = 'collapsed';
            entity.structuralIntegrity = 10;
          }
        } else if (entity.type === 'boat') {
          if (intensity <= 2) {
            entity.displacementY = -Math.sin(distPast * 0.2) * 5;
            entity.tiltAngle = Math.sin(distPast * 0.3) * 15;
          } else if (intensity <= 5) {
            entity.displacementX = Math.min(60, distPast * 1.8);
            entity.displacementY = -Math.min(25, distPast * 0.8);
            entity.tiltAngle = 35;
            entity.status = 'tilted';
          } else {
            entity.displacementX = Math.min(120, distPast * 3.5);
            entity.displacementY = -Math.min(45, distPast * 1.2);
            entity.tiltAngle = 180;
            entity.status = 'collapsed';
          }
        } else if (entity.type === 'car') {
          if (intensity <= 2) {
            entity.status = 'partially_flooded';
            entity.structuralIntegrity = 85;
          } else if (intensity <= 4) {
            entity.status = 'tilted';
            entity.displacementX = Math.min(35, distPast * 1.2);
            entity.displacementY = -Math.min(10, distPast * 0.4);
            entity.tiltAngle = 12;
            entity.structuralIntegrity = 50;
          } else {
            entity.status = 'swept_away';
            entity.displacementX = Math.min(90, distPast * 2.5);
            entity.displacementY = -Math.min(30, distPast * 0.8);
            entity.tiltAngle = distPast * 5;
            entity.structuralIntegrity = 15;
          }
        } else if (entity.type === 'tree') {
          if (intensity <= 2) {
            entity.tiltAngle = Math.sin(distPast * 0.4) * 8;
          } else if (intensity <= 6) {
            entity.tiltAngle = Math.min(45, distPast * 1.5);
            entity.status = 'tilted';
          } else {
            entity.tiltAngle = 85;
            entity.status = 'collapsed';
            entity.structuralIntegrity = 10;
          }
        } else if (entity.type === 'power_pole') {
          if (intensity <= 2) {
            entity.tiltAngle = 2;
          } else if (intensity <= 4) {
            entity.tiltAngle = Math.min(35, distPast * 1.2);
            entity.powerLineSnapped = true;
            entity.status = 'tilted';
          } else {
            entity.tiltAngle = 78;
            entity.powerLineSnapped = true;
            entity.status = 'collapsed';
            entity.structuralIntegrity = 5;
          }
        } else if (entity.type === 'house') {
          if (intensity <= 2) {
            entity.status = 'intact';
          } else if (intensity <= 4) {
            entity.status = 'partially_flooded';
            entity.brokenWindows = true;
            entity.structuralIntegrity = 60;
          } else if (intensity <= 6) {
            entity.status = 'roof_torn';
            entity.tiltAngle = 8;
            entity.brokenWindows = true;
            entity.structuralIntegrity = 35;
          } else {
            entity.status = 'collapsed';
            entity.structuralIntegrity = 0;
          }
        } else if (entity.type === 'commercial' || entity.type === 'school') {
          if (intensity <= 3) {
            entity.status = 'intact';
          } else if (intensity <= 6) {
            entity.status = 'partially_flooded';
            entity.brokenWindows = true;
            entity.tiltAngle = 4;
            entity.structuralIntegrity = 55;
          } else if (intensity <= 8) {
            entity.status = 'cracked';
            entity.tiltAngle = 14;
            entity.brokenWindows = true;
            entity.structuralIntegrity = 25;
          } else {
            entity.status = 'collapsed';
            entity.structuralIntegrity = 5;
          }
        } else if (entity.type === 'hospital' || entity.type === 'apartment') {
          if (intensity <= 4) {
            entity.status = 'intact';
          } else if (intensity <= 6) {
            entity.status = 'partially_flooded';
            entity.brokenWindows = true;
            entity.structuralIntegrity = 75;
          } else if (intensity <= 8) {
            entity.status = 'cracked';
            entity.brokenWindows = true;
            entity.tiltAngle = 6;
            entity.structuralIntegrity = 40;
          } else {
            entity.status = entity.type === 'apartment' ? 'collapsed' : 'cracked';
            entity.brokenWindows = true;
            entity.tiltAngle = 18;
            entity.structuralIntegrity = 15;
          }
        } else if (entity.type === 'skyscraper') {
          if (intensity <= 6) {
            entity.status = 'intact';
          } else if (intensity <= 8) {
            entity.status = 'partially_flooded';
            entity.brokenWindows = true;
            entity.structuralIntegrity = 80;
          } else {
            entity.status = 'cracked';
            entity.brokenWindows = true;
            entity.tiltAngle = 3;
            entity.structuralIntegrity = 60;
          }
        } else if (entity.type === 'evacuation_hill') {
          entity.status = 'intact';
          entity.structuralIntegrity = 100;
        }

        return entity;
      });

      setEntities(updatedEntities);

      // 3. Compute Real-time Telemetry Metrics
      const targetInundation = currentConfig.expectedInundationPct;
      const targetBldDamage = currentConfig.expectedBuildingDamage;
      const targetFacDamage = currentConfig.expectedFacilityDamage;
      const targetRoadDamage = currentConfig.expectedRoadDamage;

      // Scale metrics linearly as wave progress reaches inland
      const damageProgressRatio = Math.max(0, Math.min(1, (progress - coastThresholdX) / (100 - coastThresholdX)));

      setMetrics((prev) => ({
        ...prev,
        currentWaveFrontX: progress,
        inundationAreaPct: targetInundation * damageProgressRatio,
        buildingDamagePct: targetBldDamage * damageProgressRatio,
        facilityDamagePct: targetFacDamage * damageProgressRatio,
        roadDamagePct: targetRoadDamage * damageProgressRatio,
        activeStep: step,
      }));

      // Check Completion
      if (progress >= 100) {
        setSimState('completed');
      } else {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [simState, simSpeed, intensity, currentConfig]);

  return (
    <div className="min-h-screen bg-[#070d1e] bg-grid-tech text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-900">
      {/* ========================================================
          TOP NAVIGATION & SCIENTIFIC HUD HEADER
         ======================================================== */}
      <header className="border-b border-slate-800/80 bg-[#091124]/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-md shadow-cyan-900/40 border border-cyan-400/30">
              <Waves className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-display font-extrabold tracking-wider bg-gradient-to-r from-cyan-300 via-sky-200 to-white bg-clip-text text-transparent">
                  TSUNAMI CITY SIMULATOR
                </h1>
                <span className="hidden sm:inline-block text-[10px] uppercase font-mono-tech px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold">
                  v2.5 Physics Lab
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                해안 도시 쓰나미 유체 파괴력 및 구조물 붕괴 과학 교육 시뮬레이션
              </p>
            </div>
          </div>

          {/* Quick HUD Telemetry Status */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono-tech">
              <span className={`w-2 h-2 rounded-full ${
                simState === 'running' ? 'bg-rose-500 animate-ping' : simState === 'completed' ? 'bg-emerald-400' : 'bg-cyan-400'
              }`} />
              <span className="text-slate-400">STATE:</span>
              <span className="font-bold text-slate-200 uppercase">{simState}</span>
            </div>

            <button
              onClick={() => setIsCompareOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-semibold transition-all hover:scale-105"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>강도별 비교 (COMPARE)</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================
          MAIN DASHBOARD BODY
         ======================================================== */}
      <main className="max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 flex-1 flex flex-col gap-6">
        {/* TOP SECTION: 2D Simulation Viewport (Canvas) */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 font-display">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>2D Coastal Simulation View (해안 도시 시뮬레이션 화면)</span>
            </div>

            <span className="text-xs font-mono-tech text-cyan-400">
              Wave Front: {metrics.currentWaveFrontX.toFixed(1)}%
            </span>
          </div>

          {/* Canvas Component */}
          <CityCanvas
            entities={entities}
            metrics={metrics}
            simState={simState}
            intensity={intensity}
            onSelectEntity={(ent) => setSelectedEntity(ent)}
            selectedEntityId={selectedEntity?.id || null}
          />
        </section>

        {/* MIDDLE SECTION: Split Layout (Left: Control Panel, Right: Damage Metrics) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Control Panel (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col">
            <ControlPanel
              intensity={intensity}
              config={currentConfig}
              simState={simState}
              activeStep={activeStep}
              simSpeed={simSpeed}
              isMuted={isMuted}
              onIntensityChange={handleIntensityChange}
              onStartSimulation={handleStartSimulation}
              onResetSimulation={handleReset}
              onTogglePause={handleTogglePause}
              onChangeSpeed={(spd) => setSimSpeed(spd)}
              onToggleMute={handleToggleMute}
              onOpenCompare={() => setIsCompareOpen(true)}
            />
          </div>

          {/* Right Column: Real-time Damage Metrics Panel (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col">
            <DamageMetricsPanel
              metrics={metrics}
              entities={entities}
            />
          </div>
        </section>

        {/* BOTTOM SECTION: Scientific Principles & Educational Explanation */}
        <section>
          <ScienceExplanation />
        </section>
      </main>

      {/* ========================================================
          MODALS & INSPECTORS
         ======================================================== */}
      {/* Compare Modal */}
      <CompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        onSelectIntensityToPlay={(lvl) => {
          handleIntensityChange(lvl);
        }}
      />

      {/* Selected Entity Inspector Modal */}
      <EntityInspectorModal
        entity={selectedEntity}
        onClose={() => setSelectedEntity(null)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#060b18] py-4 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>TSUNAMI CITY SIMULATOR • 과학 교육용 개념 시뮬레이션 모델</span>
          <span className="font-mono-tech text-slate-400">Physics Modeling: Shallow Water Equations v = √(g·h)</span>
        </div>
      </footer>
    </div>
  );
}
