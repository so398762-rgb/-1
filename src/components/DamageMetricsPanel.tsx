import React from 'react';
import { Activity, Droplets, Building2, Car, ShieldAlert, Waves, Milestone } from 'lucide-react';
import { SimulationMetrics, CityEntity } from '../types';

interface DamageMetricsPanelProps {
  metrics: SimulationMetrics;
  entities: CityEntity[];
}

export const DamageMetricsPanel: React.FC<DamageMetricsPanelProps> = ({
  metrics,
  entities,
}) => {
  // Count intact vs damaged vs collapsed
  const totalBuildings = entities.filter(e => ['house', 'school', 'commercial', 'hospital', 'apartment', 'skyscraper'].includes(e.type)).length;
  const collapsedCount = entities.filter(e => e.status === 'collapsed' || e.status === 'swept_away').length;
  const floodedCount = entities.filter(e => e.currentWaterDepth > 0.5).length;

  const getMetricColor = (val: number) => {
    if (val < 25) return 'text-emerald-400 bg-emerald-500';
    if (val < 50) return 'text-amber-400 bg-amber-500';
    if (val < 75) return 'text-orange-400 bg-orange-500';
    return 'text-rose-400 bg-rose-500';
  };

  return (
    <div className="flex flex-col gap-4 bg-[#0b1426] border border-slate-700/80 rounded-2xl p-5 md:p-6 shadow-xl relative">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <h2 className="text-sm uppercase tracking-widest font-display font-bold text-slate-200">
            CITY DAMAGE (실시간 피해 수치)
          </h2>
        </div>

        <div className="flex items-center gap-1 text-xs font-mono-tech text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded-md border border-cyan-800/60">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span>LIVE TELEMETRY</span>
        </div>
      </div>

      {/* Main Stats 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Intensity */}
        <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Waves className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">쓰나미 강도</div>
              <div className="text-base font-bold font-mono-tech text-blue-300">
                LEVEL {metrics.intensity} / 10
              </div>
            </div>
          </div>
        </div>

        {/* Wave Height */}
        <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Milestone className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">최대 파고 (가상치)</div>
              <div className="text-base font-bold font-mono-tech text-cyan-300">
                {metrics.waveHeight.toFixed(1)} <span className="text-xs text-slate-400 font-normal">m</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progressive Damage Bars */}
      <div className="space-y-3.5 pt-1">
        {/* 1. 침수 면적 */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span>💧 침수 면적 (Inundation Area)</span>
            </span>
            <span className="font-mono-tech font-bold text-cyan-300">
              {metrics.inundationAreaPct.toFixed(1)} %
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 rounded-full"
              style={{ width: `${Math.min(100, metrics.inundationAreaPct)}%` }}
            />
          </div>
        </div>

        {/* 2. 건물 피해 */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Building2 className="w-3.5 h-3.5 text-rose-400" />
              <span>🏢 건물 피해 (Building Damage)</span>
            </span>
            <span className="font-mono-tech font-bold text-rose-400">
              {metrics.buildingDamagePct.toFixed(1)} %
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-300 rounded-full"
              style={{ width: `${Math.min(100, metrics.buildingDamagePct)}%` }}
            />
          </div>
        </div>

        {/* 3. 시설물 피해 */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Car className="w-3.5 h-3.5 text-amber-400" />
              <span>🚗 시설물 피해 (Facilities & Grid)</span>
            </span>
            <span className="font-mono-tech font-bold text-amber-300">
              {metrics.facilityDamagePct.toFixed(1)} %
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-300 rounded-full"
              style={{ width: `${Math.min(100, metrics.facilityDamagePct)}%` }}
            />
          </div>
        </div>

        {/* 4. 도로 피해 */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Milestone className="w-3.5 h-3.5 text-purple-400" />
              <span>🛣️ 도로 피해 (Road Network)</span>
            </span>
            <span className="font-mono-tech font-bold text-purple-300">
              {metrics.roadDamagePct.toFixed(1)} %
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 rounded-full"
              style={{ width: `${Math.min(100, metrics.roadDamagePct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Urban Survival Status Summary */}
      <div className="grid grid-cols-3 gap-2 bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 text-center">
        <div>
          <div className="text-[10px] text-slate-400">총 감시 건축물</div>
          <div className="text-sm font-bold font-mono-tech text-slate-200">
            {totalBuildings} 개동
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400">침수 건물</div>
          <div className="text-sm font-bold font-mono-tech text-amber-400">
            {floodedCount} 개동
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400">완파/붕괴 구조물</div>
          <div className="text-sm font-bold font-mono-tech text-rose-400">
            {collapsedCount} 개동
          </div>
        </div>
      </div>
    </div>
  );
};
