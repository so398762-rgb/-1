import React from 'react';
import { Play, RotateCcw, Pause, Volume2, VolumeX, Layers, FastForward, Info } from 'lucide-react';
import { IntensityConfig, SimulationState, SimulationStep } from '../types';

interface ControlPanelProps {
  intensity: number;
  config: IntensityConfig;
  simState: SimulationState;
  activeStep: SimulationStep;
  simSpeed: number;
  isMuted: boolean;
  onIntensityChange: (newIntensity: number) => void;
  onStartSimulation: () => void;
  onResetSimulation: () => void;
  onTogglePause: () => void;
  onChangeSpeed: (speed: number) => void;
  onToggleMute: () => void;
  onOpenCompare: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  intensity,
  config,
  simState,
  activeStep,
  simSpeed,
  isMuted,
  onIntensityChange,
  onStartSimulation,
  onResetSimulation,
  onTogglePause,
  onChangeSpeed,
  onToggleMute,
  onOpenCompare,
}) => {
  // Danger color mapping based on intensity
  const getIntensityColor = (lvl: number) => {
    if (lvl <= 2) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (lvl <= 4) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    if (lvl <= 6) return 'text-orange-400 border-orange-500/40 bg-orange-500/10';
    if (lvl <= 8) return 'text-red-400 border-red-500/40 bg-red-500/10';
    return 'text-purple-400 border-purple-500/40 bg-purple-500/10';
  };

  const getSliderTrackGradient = (lvl: number) => {
    return `linear-gradient(to right, #10b981 0%, #f59e0b 35%, #ef4444 70%, #a855f7 100%)`;
  };

  const stepsList = [
    { num: 1, title: '바다 변화', sub: '해수면 인입/파동 형성' },
    { num: 2, title: '파도 이동', sub: '천수효과 & 파고 급상승' },
    { num: 3, title: '해안 침수', sub: '방파제 월파 & 도로 유입' },
    { num: 4, title: '도시 피해', sub: '건물 붕괴 & 차량 부유' },
    { num: 5, title: '최종 평가', sub: '종합 피해 수치 집계' }
  ];

  return (
    <div className="flex flex-col gap-5 bg-[#0b1426] border border-slate-700/80 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
      {/* Top Header Badge */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h2 className="text-sm uppercase tracking-widest font-display font-semibold text-slate-300">
            Disaster Simulation Control
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            id="btn_sound_toggle"
            onClick={onToggleMute}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Compare Modal Button */}
          <button
            id="btn_open_compare"
            onClick={onOpenCompare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-semibold transition-all hover:scale-105"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>COMPARE</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          1. TSUNAMI INTENSITY SLIDER & PRESETS
         ======================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="intensity_slider" className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <span>TSUNAMI INTENSITY (쓰나미 강도)</span>
            <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${getIntensityColor(intensity)}`}>
              LEVEL {intensity} / 10
            </span>
          </label>

          <span className="text-xs text-slate-400 font-medium">
            {config.name}
          </span>
        </div>

        {/* Big Slider */}
        <div className="relative py-2">
          <input
            type="range"
            id="intensity_slider"
            min={1}
            max={10}
            step={1}
            value={intensity}
            disabled={simState === 'running'}
            onChange={(e) => onIntensityChange(Number(e.target.value))}
            className="w-full h-3.5 rounded-lg appearance-none cursor-pointer bg-slate-800 disabled:opacity-50 accent-cyan-400 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400"
            style={{
              background: getSliderTrackGradient(intensity),
            }}
          />

          {/* Tick marks 1-10 */}
          <div className="flex justify-between px-1 mt-1.5 text-[10px] font-mono-tech text-slate-400">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => (
              <button
                key={lvl}
                disabled={simState === 'running'}
                onClick={() => onIntensityChange(lvl)}
                className={`transition-colors hover:text-cyan-300 ${
                  lvl === intensity ? 'font-bold text-cyan-400 scale-125' : ''
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 pt-1 overflow-x-auto pb-1">
          <span className="text-[11px] text-slate-400 shrink-0 mr-1">빠른 선택:</span>
          {[
            { lvl: 1, label: '1단 (미소)' },
            { lvl: 3, label: '3단 (보통)' },
            { lvl: 6, label: '6단 (격심)' },
            { lvl: 8, label: '8단 (극심)' },
            { lvl: 10, label: '10단 (슈퍼)' },
          ].map((item) => (
            <button
              key={item.lvl}
              disabled={simState === 'running'}
              onClick={() => onIntensityChange(item.lvl)}
              className={`text-[11px] px-2.5 py-1 rounded-md border transition-all whitespace-nowrap ${
                intensity === item.lvl
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 font-semibold'
                  : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================
          2. REAL-TIME ANTICIPATED SPECIFICATIONS GRID
         ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-900/90 rounded-xl p-3.5 border border-slate-800">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">예상 파고 (Wave Height)</span>
          <span className="text-base font-bold font-mono-tech text-cyan-300">
            {config.waveHeightMeters.toFixed(1)} <span className="text-xs font-normal text-slate-400">m</span>
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">파도 속도 (Velocity)</span>
          <span className="text-base font-bold font-mono-tech text-cyan-300">
            {config.waveSpeedKmh} <span className="text-xs font-normal text-slate-400">km/h</span>
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">침수 범위 (Inundation)</span>
          <span className="text-base font-bold font-mono-tech text-amber-300">
            ~{config.inundationRangeMeters} <span className="text-xs font-normal text-slate-400">m</span>
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">방출 에너지 (Energy)</span>
          <span className="text-sm font-bold font-mono-tech text-rose-300">
            {config.energyRatingJoules}
          </span>
        </div>
      </div>

      {/* Expected Damage Description Card */}
      <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>예상 피해 양상 (Expected Damage Profile)</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {config.expectedDamageSummary}
        </p>
      </div>

      {/* ========================================================
          3. SIMULATION STEP PROGRESS TRACKER
         ======================================================== */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold">진행 순서 (Simulation Steps)</span>
          <span className="font-mono-tech text-cyan-400">
            STEP {activeStep} / 5
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {stepsList.map((st) => {
            const isCompleted = activeStep > st.num;
            const isCurrent = activeStep === st.num && simState === 'running';

            return (
              <div
                key={st.num}
                className={`p-2 rounded-lg border text-center transition-all ${
                  isCurrent
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md ring-1 ring-cyan-400/50'
                    : isCompleted
                    ? 'bg-slate-800/80 border-slate-600 text-slate-300'
                    : 'bg-slate-900/40 border-slate-800/60 text-slate-400'
                }`}
              >
                <div className="text-[10px] font-mono-tech font-bold">
                  STEP {st.num}
                </div>
                <div className="text-[11px] font-semibold truncate">
                  {st.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          4. ACTION BUTTONS (SIMULATE & RESET & SPEED)
         ======================================================== */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
        {/* Main SIMULATE Button */}
        {simState !== 'running' ? (
          <button
            id="btn_simulate_tsunami"
            onClick={onStartSimulation}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-display font-bold text-sm tracking-wide shadow-lg shadow-cyan-900/40 hover:shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] border border-cyan-400/40"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>🌊 SIMULATE TSUNAMI (시뮬레이션 시작)</span>
          </button>
        ) : (
          <button
            id="btn_pause_simulation"
            onClick={onTogglePause}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-display font-bold text-sm tracking-wide shadow-lg shadow-amber-900/40 transition-all border border-amber-400/40"
          >
            <Pause className="w-5 h-5" />
            <span>PAUSE SIMULATION (일시 정지)</span>
          </button>
        )}

        {/* Reset Button */}
        <button
          id="btn_reset_simulation"
          onClick={onResetSimulation}
          className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-600/80 transition-all hover:text-white"
        >
          <RotateCcw className="w-4 h-4" />
          <span>RESET (초기화)</span>
        </button>

        {/* Speed Controls */}
        <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800 self-center sm:self-auto">
          {[0.5, 1, 2].map((spd) => (
            <button
              key={spd}
              onClick={() => onChangeSpeed(spd)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono-tech transition-colors ${
                simSpeed === spd
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Educational Disclaimer */}
      <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-3 text-center">
        * 본 시뮬레이션은 쓰나미의 물리적 파괴 메커니즘을 시각화하는 <strong className="text-slate-300 font-medium">과학 교육용 개념 모델</strong>이며, 특정 실제 도시의 정확한 재난 예측 수치가 아닙니다.
      </div>
    </div>
  );
};
