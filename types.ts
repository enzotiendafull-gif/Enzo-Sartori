
export type Dimension = 'LENGTH' | 'AREA' | 'VOLUME' | 'MASS' | 'COUNT';

// Added missing Product interface
export interface Product {
  id: string;
  name: string;
  price: number;
}

// Added missing SupplyCost interface
export interface SupplyCost {
  id: string;
  name: string;
  unit: string;
  unitCost: number;
  currency: string;
}

export interface SupplyCatalogItem {
  id: string;
  name: string;
  dimension: Dimension;
  baseUnit: string;
  unitCost: number;
  currency: string;
}

export interface Supply {
  id: string;
  catalogId: string;
  name: string;
  dimension: Dimension;
  unit: string;
  quantity: number;
  quantityInBaseUnit: number;
  baseUnit: string;
  unitCostSnapshot: number;
  totalCost: number;
}

export interface Activity {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  durationMs: number;
  status: 'active' | 'paused' | 'completed';
  notes?: string;
  supplies: Supply[];
}

export interface ProductionSession {
  id: string;
  artisan: string;
  productId: string;
  productName: string;
  date: string;
  activities: Activity[];
  status: 'in_progress' | 'finished';
  totalDurationMs: number;
}

export interface AppSettings {
  currency: string;
  hourlyRate: number;
  defaultMarkup: number;
  setupComplete: boolean;
}

export interface PerformanceAnalysis {
  bottlenecks: string[];
  suggestions: string[];
  standardTimes: Record<string, number>;
}

export enum StepStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed'
}