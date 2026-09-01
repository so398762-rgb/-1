import React, { useState } from 'react';
import { X, Layers, Droplets, Building2, Car, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
import { TSUNAMI_INTENSITY_CONFIGS } from '../data/tsunamiPresets';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIntensityToPlay: (lvl: number) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  onSelectIntensityToPlay,
}) => {
  const [selectedLevels, setSelectedLevels] = useState<number[]>([3, 6, 10]);

  if (!isOpen) return null;

  const compareData = selectedLevels.map(lvl => TSUNAMI_INTENSITY_CONFIGS[lvl]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0b1426] border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-slate-100 flex items-center gap-2">
                <span>쓰나미 강도별 피해 비교 분석</span>
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono-tech border border-indigo-500/30">
                  COMPARE SCENARIOS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                동일한 해안 도시를 대상으로 3단계, 6단계, 10단계 쓰나미의 파괴력을 나란히 비교합니다.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Level Switcher */}
          <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold">비교할 강도 선택:</span>
            <div className="flex items-center gap-2">
              {[3, 6, 10].map((lvl) => (
                <span
                  key={lvl}
                  className="px-3 py-1 rounded-md text-xs font-bold font-mono-tech bg-cyan-950 text-cyan-300 border border-cyan-700/60"
                >
                  LEVEL {lvl} ({TSUNAMI_INTENSITY_CONFIGS[lvl].name.split(' ')[0]})
                </span>
              ))}
            </div>
          </div>

          {/* 3-Column Scenario Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {compareData.map((cfg) => {
              const isLow = cfg.level <= 3;
              const isMid = cfg.level === 6;
              const isHigh = cfg.level === 10;

              const badgeColor = isLow
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : isMid
                ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40';

              const cardBorder = isLow
                ? 'border-amber-500/30'
                : isMid
                ? 'border-orange-500/40'
                : 'border-rose-500/50 shadow-rose-950/30 shadow-lg';

              return (
                <div
                  key={cfg.level}
                  className={`bg-slate-900/90 rounded-xl p-4 border flex flex-col justify-between gap-4 ${cardBorder}`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono-tech border ${badgeColor}`}>
                        LEVEL {cfg.level}
                      </span>
                      <span className="text-xs font-mono-tech text-slate-400">
                        파고 {cfg.waveHeightMeters.toFixed(1)}m
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-100">
                        {cfg.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {cfg.koreanGrade}
                      </p>
                    </div>

                    {/* Mini SVG Visualization of Coastal City Profile */}
                    <div className="h-28 w-full bg-[#050b17] rounded-lg relative overflow-hidden border border-slate-800">
                      {/* Sky */}
                      <div className="absolute inset-0 bg-gradient-to-b from-[#0a192f] to-[#1e293b]" />

                      {/* Terrain */}
                      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                        {/* Land */}
                        <path d="M 25 75 L 60 70 L 90 60 L 100 55 L 100 100 L 0 100 L 0 85 Z" fill="#334155" />
                        {/* Seawall */}
                        <rect x="23" y="65" width="4" height="15" fill="#64748b" />
                        {/* Houses & Buildings */}
                        <rect x="35" y={isLow ? "62" : "68"} width="6" height="8" fill={isLow ? "#f97316" : "#b45309"} transform={!isLow ? "rotate(15 38 72)" : ""} />
                        <rect x="50" y={isHigh ? "65" : "55"} width="8" height="15" fill={isHigh ? "#475569" : "#6366f1"} />
                        <rect x="70" y="45" width="10" height="22" fill="#ef4444" />
                        <rect x="85" y="30" width="8" height="32" fill="#0ea5e9" />

                        {/* Water Surge Line */}
                        {isLow && (
                          <path d="M 0 100 L 0 72 Q 20 68 35 74 L 35 100 Z" fill="rgba(6, 182, 212, 0.7)" />
                        )}
                        {isMid && (
                          <path d="M 0 100 L 0 55 Q 30 52 65 67 L 65 100 Z" fill="rgba(6, 182, 212, 0.75)" />
                        )}
                        {isHigh && (
                          <path d="M 0 100 L 0 35 Q 40 32 95 58 L 95 100 Z" fill="rgba(225, 29, 72, 0.75)" />
                        )}
                      </svg>

                      <div className="absolute bottom-1 right-2 text-[10px] font-mono-tech text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded">
                        침수: {cfg.expectedInundationPct}%
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
                      <div>
                        <span className="text-slate-400 text-[10px]">파도 속도:</span>
                        <div className="font-bold font-mono-tech text-cyan-300">{cfg.waveSpeedKmh} km/h</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">침수 범위:</span>
                        <div className="font-bold font-mono-tech text-amber-300">~{cfg.inundationRangeMeters} m</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">건물 피해율:</span>
                        <div className="font-bold font-mono-tech text-rose-400">{cfg.expectedBuildingDamage} %</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">시설물 파괴:</span>
                        <div className="font-bold font-mono-tech text-orange-400">{cfg.expectedFacilityDamage} %</div>
                      </div>
                    </div>

                    {/* Key Damage Bullet Points */}
                    <div className="space-y-1 text-xs text-slate-300">
                      <div className="font-semibold text-slate-400 text-[11px]">주요 관측 현상:</div>
                      {cfg.keyPhenomena.map((ph, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-[11px] leading-tight text-slate-300">
                          <span className="text-cyan-400 mt-0.5">•</span>
                          <span>{ph}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Apply Simulation Button */}
                  <button
                    onClick={() => {
                      onSelectIntensityToPlay(cfg.level);
                      onClose();
                    }}
                    className="w-full py-2 rounded-lg bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
                  >
                    <span>이 강도로 시뮬레이션</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Scientific Summary Table */}
          <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-200">
              📊 강도별 파괴력 비교 요약 매트릭스
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono-tech">
                    <th className="py-2 px-3">쓰나미 단계</th>
                    <th className="py-2 px-3">파고 (m)</th>
                    <th className="py-2 px-3">유속 (km/h)</th>
                    <th className="py-2 px-3">침수 면적</th>
                    <th className="py-2 px-3">건물 손상</th>
                    <th className="py-2 px-3">방파제 상태</th>
                    <th className="py-2 px-3">주요 방재 교훈</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-amber-400">3단계 (보통)</td>
                    <td className="py-2.5 px-3 font-mono-tech">3.5 m</td>
                    <td className="py-2.5 px-3 font-mono-tech">32 km/h</td>
                    <td className="py-2.5 px-3 text-cyan-300">32 %</td>
                    <td className="py-2.5 px-3 text-rose-300">22 %</td>
                    <td className="py-2.5 px-3 text-emerald-400">월파 발생 (구조 건전)</td>
                    <td className="py-2.5 px-3 text-slate-300">소형 차량 부유 및 저지대 침수 주의</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-orange-400">6단계 (격심)</td>
                    <td className="py-2.5 px-3 font-mono-tech">11.5 m</td>
                    <td className="py-2.5 px-3 font-mono-tech">52 km/h</td>
                    <td className="py-2.5 px-3 text-cyan-300">69 %</td>
                    <td className="py-2.5 px-3 text-rose-300">68 %</td>
                    <td className="py-2.5 px-3 text-amber-400">전면 붕괴 및 파괴</td>
                    <td className="py-2.5 px-3 text-slate-300">2층 이하 건축물 관통, 고지대 즉시 대피 필수</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-rose-400">10단계 (슈퍼)</td>
                    <td className="py-2.5 px-3 font-mono-tech">32.0 m</td>
                    <td className="py-2.5 px-3 font-mono-tech">85 km/h</td>
                    <td className="py-2.5 px-3 text-cyan-300">98 %</td>
                    <td className="py-2.5 px-3 text-rose-300">99 %</td>
                    <td className="py-2.5 px-3 text-rose-400">완전 유실 및 소실</td>
                    <td className="py-2.5 px-3 text-slate-300">마천루 상층/해발 30m 이상 대피소 외 전역 수몰</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
