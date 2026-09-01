import React from 'react';
import { X, Building, Droplets, Shield, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { CityEntity } from '../types';

interface EntityInspectorModalProps {
  entity: CityEntity | null;
  onClose: () => void;
}

export const EntityInspectorModal: React.FC<EntityInspectorModalProps> = ({
  entity,
  onClose,
}) => {
  if (!entity) return null;

  const getStatusBadge = (status: CityEntity['status']) => {
    switch (status) {
      case 'intact':
        return { label: '구조 건전 (Intact)', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'splashed':
      case 'partially_flooded':
        return { label: '부분 침수 (Flooded)', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'deeply_flooded':
        return { label: '심층 수몰 (Submerged)', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40' };
      case 'cracked':
      case 'tilted':
      case 'roof_torn':
        return { label: '구조 균열/손상 (Damaged)', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
      case 'collapsed':
      case 'swept_away':
        return { label: '구조물 완파/유실 (Destroyed)', color: 'bg-red-950 text-red-400 border-red-700' };
      default:
        return { label: status, color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const statusInfo = getStatusBadge(entity.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0b1426] border border-slate-700/80 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                {entity.koreanName}
              </h3>
              <p className="text-[11px] font-mono-tech text-slate-400">
                {entity.name} ({entity.id})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors border border-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400">현재 상태:</span>
          <span className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono-tech border ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 text-[10px]">해발 고도 (Elevation)</span>
            <div className="text-base font-bold font-mono-tech text-cyan-300">
              +{entity.elevation.toFixed(1)} m
            </div>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 text-[10px]">현재 침수 수심 (Depth)</span>
            <div className="text-base font-bold font-mono-tech text-amber-300">
              {entity.currentWaterDepth.toFixed(1)} m
            </div>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 text-[10px]">내진/내파 저항력 (Factor)</span>
            <div className="text-base font-bold font-mono-tech text-emerald-300">
              {entity.materialStrength} / 100
            </div>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 text-[10px]">구조 건전도 (Integrity)</span>
            <div className="text-base font-bold font-mono-tech text-rose-400">
              {entity.structuralIntegrity.toFixed(0)} %
            </div>
          </div>
        </div>

        {/* Structural Integrity Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-300">
            <span>잔여 구조 안전도</span>
            <span className="font-mono-tech font-bold text-slate-200">
              {entity.structuralIntegrity.toFixed(0)}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 transition-all"
              style={{ width: `${entity.structuralIntegrity}%` }}
            />
          </div>
        </div>

        {/* Structural details notes */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-300 space-y-1">
          <div className="font-semibold text-slate-400 text-[11px]">방재 공학 분석:</div>
          <p className="text-[11px] leading-relaxed text-slate-300">
            {entity.elevation < 5 ? (
              <span>⚠️ 저지대(해발 5m 미만) 위치로 인해 1차 침수선에 취약하며 방파제 월파 시 직접적인 유체 충격을 받습니다.</span>
            ) : entity.elevation < 12 ? (
              <span>ℹ️ 완만한 구릉지(해발 5~12m)에 위치하여 저강도 쓰나미는 방어 가능하나 6단계 이상에서는 침수 피해가 발생합니다.</span>
            ) : (
              <span>✅ 고지대(해발 20m 이상) 피난 구역으로 슈퍼 쓰나미(10단계) 상황에서도 안전한 수직/수평 대피 거점입니다.</span>
            )}
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
        >
          확인 (닫기)
        </button>
      </div>
    </div>
  );
};
