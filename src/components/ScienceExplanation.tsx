import React, { useState } from 'react';
import { BookOpen, Waves, Zap, Shield, Mountain, HelpCircle, ChevronRight } from 'lucide-react';

export const ScienceExplanation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'shoaling' | 'energy' | 'factors' | 'preparedness'>('shoaling');

  return (
    <div className="bg-[#0b1426] border border-slate-700/80 rounded-2xl p-5 md:p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm uppercase tracking-widest font-display font-bold text-slate-200">
            WHY DOES THE DAMAGE INCREASE? (왜 쓰나미 피해가 급증하는가?)
          </h2>
        </div>

        <span className="text-xs font-mono-tech text-slate-400 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
          SCIENTIFIC PRINCIPLES
        </span>
      </div>

      {/* Main Core Explanation Banner */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900/60 p-4 rounded-xl border border-cyan-800/40 text-xs text-slate-300 leading-relaxed space-y-2">
        <p className="font-medium text-slate-200">
          🌊 <strong className="text-cyan-300">쓰나미의 발생과 파고 증폭 원리:</strong> 쓰나미는 해저 단층 지진이나 해저 화산 폭발, 대규모 해저 산사태 등으로 해수면이 수직으로 급격히 변위되면서 발생합니다.
        </p>
        <p>
          심해에서는 파고가 수십 cm~1m에 불과하지만 시속 700~800km(제트기 속도)로 전파됩니다. 그러나 <strong>해안으로 접근하며 수심이 얕아지면(천수 효과), 파도의 속도가 급감하고 뒤따라오던 막대한 해수 에너지가 수직으로 압축되어 파고가 수 미터에서 수십 미터로 치솟게 됩니다.</strong>
        </p>
        <p className="text-[11px] text-slate-400 border-t border-cyan-900/40 pt-1.5">
          * 실제 쓰나미의 피해는 단순한 파고(Wave Height) 하나만으로 결정되지 않으며, <strong>해안 지형(V자형 만 등), 수심 변화율, 해안 방파제 설계, 건축물의 구조 강도, 파도의 입사각 및 부유물 충돌</strong> 등 복합적인 요인의 상호작용을 받습니다.
        </p>
      </div>

      {/* Interactive Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'shoaling', label: '1. 천수 효과 (Shoaling Effect)', icon: Waves },
          { id: 'energy', label: '2. 동수압 & 유체 파괴력', icon: Zap },
          { id: 'factors', label: '3. 해안 지형 & 복합 요인', icon: Mountain },
          { id: 'preparedness', label: '4. 방재 대책 & 골든타임', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeTab === 'shoaling' && (
          <>
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2.5">
              <h3 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Waves className="w-4 h-4" />
                <span>장파 전파 공식과 수심의 관계</span>
              </h3>
              <div className="bg-slate-950 p-2.5 rounded-lg font-mono-tech text-cyan-400 text-center text-sm border border-slate-800">
                v = √(g × h)
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                여기서 <strong>v</strong>는 파속(m/s), <strong>g</strong>는 중력가속도(9.8m/s²), <strong>h</strong>는 수심(m)입니다.
                수심이 4,000m인 심해에서는 속도가 약 <strong>시속 713km</strong>에 달하지만, 수심 10m인 해안가에서는 <strong>시속 36km</strong>로 줄어듭니다.
              </p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2.5">
              <h3 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <ChevronRight className="w-4 h-4" />
                <span>에너지 보존과 파고의 급상승</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                파도의 앞부분이 수심이 얕아지며 급격히 느려지는 반면, 뒤따라오는 파도는 여전히 깊은 바다에서 빠른 속도로 밀고 들어옵니다. 파동의 에너지는 보존되어야 하므로 수평 파장이 수직 파고(Wave Height)로 변환되어 거대한 물벽으로 솟구치게 됩니다.
              </p>
            </div>
          </>
        )}

        {activeTab === 'energy' && (
          <>
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2.5">
              <h3 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                <span>동수압(Hydrodynamic Force)의 위력</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                쓰나미는 단순한 수면 상승(정수압)이 아니라, 초당 수십 톤의 해수가 시속 30~60km로 밀려드는 <strong>동수압</strong>을 가합니다. 
                파고 1m의 쓰나미 유류만으로도 성인이 휩쓸리며, 2m면 목조 주택이 전파되고, 5m 이상이면 철근콘크리트 건물 외벽도 파손됩니다.
              </p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2.5">
              <h3 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                <span>부유물 미사일(Debris Impact)의 2차 타격</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                해수 속에 포함된 수백 대의 차량, 대형 어선, 부서진 목재와 컨테이너가 급류를 타고 이동하면서 <strong>거대한 파쇄 해머</strong>처럼 2차로 건축물 기둥과 벽을 강타하여 붕괴를 가속합니다.
              </p>
            </div>
          </>
        )}

        {activeTab === 'factors' && (
          <>
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2.5">
              <h3 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Mountain className="w-4 h-4" />
                <span>해안 지형의 수렴 효과 (V자형 만)</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                삼포(Ria) 해안이나 V자 모양으로 좁아지는 만(Bay) 지형에서는 양쪽 해안선에 의해 쓰나미 에너지가 한 지점으로 깔때기처럼 모이면서(수렴), 개방형 해안보다 파고가 2~4배 이상 폭발적으로 치솟을 수 있습니다.
              </p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2.5">
              <h3 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                <span>방파제 월파(Overtopping)와 한계</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                콘크리트 방파제는 설계 파고 이하의 쓰나미에는 강력한 방어벽이 되지만, 파고가 방파제 높이를 초과하여 월파가 발생하면 방파제 뒷면 지반이 깎여나가며(세굴 현상) 전복되거나 붕괴될 위험이 있습니다.
              </p>
            </div>
          </>
        )}

        {activeTab === 'preparedness' && (
          <>
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2.5">
              <h3 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                <span>수평 대피 vs 수직 대피 원칙</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                강한 지진동을 느끼거나 해일 경보가 발령되면 즉시 <strong>해발 20~30m 이상의 높은 고지대(수평 대피)</strong>로 이동해야 합니다. 
                시간이 부족할 경우 <strong>3층 이상(10m 이상)의 튼튼한 철근콘크리트 내진 건물(수직 대피)</strong>의 상층부로 긴급 대피합니다.
              </p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2.5">
              <h3 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                <span>다중 파동(Wave Train) 주의</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                쓰나미는 단 한 번의 파도로 끝나지 않고 수십 분~수 시간 간격으로 제2파, 제3파가 밀려오며, 흔히 <strong>제2파나 제3파가 제1파보다 훨씬 크고 치명적</strong>입니다. 경보가 완전히 해제될 때까지 해안가로 복귀해선 안 됩니다.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
