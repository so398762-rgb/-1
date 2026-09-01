export type SimulationState = 'idle' | 'running' | 'paused' | 'completed';

export type SimulationStep = 1 | 2 | 3 | 4 | 5;

export interface IntensityConfig {
  level: number;
  name: string;
  koreanGrade: string;
  waveHeightMeters: number;
  waveSpeedKmh: number;
  inundationRangeMeters: number;
  expectedDamageSummary: string;
  expectedBuildingDamage: number; // 0-100%
  expectedFacilityDamage: number; // 0-100%
  expectedRoadDamage: number;     // 0-100%
  expectedInundationPct: number;  // 0-100%
  energyRatingJoules: string;
  keyPhenomena: string[];
  stepDetails: {
    step1: string; // 바다 변화
    step2: string; // 파도 이동
    step3: string; // 해안 침수
    step4: string; // 도시 피해
    step5: string; // 최종 피해 요약
  };
  historicalAnalogy: string;
}

export type EntityType = 
  | 'breakwater' 
  | 'port_dock' 
  | 'boat' 
  | 'road' 
  | 'car' 
  | 'tree' 
  | 'power_pole' 
  | 'house' 
  | 'school' 
  | 'commercial' 
  | 'hospital' 
  | 'apartment' 
  | 'skyscraper' 
  | 'evacuation_hill';

export interface CityEntity {
  id: string;
  type: EntityType;
  name: string;
  koreanName: string;
  zone: 'sea' | 'coast' | 'residential' | 'commercial' | 'inland' | 'highland';
  x: number;          // relative position percentage 0..100
  y: number;          // ground baseline y coordinate
  width: number;
  height: number;
  elevation: number;  // meters above sea level
  materialStrength: number; // structural resistance factor 1..100
  
  // Dynamic Simulation State
  structuralIntegrity: number; // 100 = perfect, 0 = destroyed
  currentWaterDepth: number;   // meters of water currently at this entity
  status: 'intact' | 'splashed' | 'partially_flooded' | 'deeply_flooded' | 'tilted' | 'cracked' | 'roof_torn' | 'collapsed' | 'swept_away';
  tiltAngle: number;           // degrees
  displacementX: number;       // floating/swept x offset
  displacementY: number;       // floating y offset
  shakingIntensity: number;    // active vibration
  brokenWindows: boolean;
  powerLineSnapped: boolean;
  debrisGenerated: boolean;
  customDetails?: {
    floors?: number;
    color?: string;
    subType?: string;
  };
}

export interface SimulationMetrics {
  intensity: number;
  waveHeight: number;
  waveSpeed: number;
  inundationAreaPct: number;
  buildingDamagePct: number;
  facilityDamagePct: number;
  roadDamagePct: number;
  currentWaveFrontX: number; // 0 to 100%
  elapsedSeconds: number;
  waterVolumeEstimate: number; // in tons
  activeStep: SimulationStep;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'foam' | 'spray' | 'debris' | 'spark' | 'smoke' | 'bubble';
}
