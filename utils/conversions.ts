
import { Dimension } from '../types';

export const UNITS_BY_DIMENSION: Record<Dimension, string[]> = {
  LENGTH: ['mm', 'cm', 'm'],
  AREA: ['cm2', 'm2'],
  VOLUME: ['ml', 'L'],
  MASS: ['gr', 'kg'],
  COUNT: ['unidad']
};

const CONVERSION_FACTORS: Record<string, number> = {
  // LENGTH (Base: m)
  'm': 1,
  'cm': 0.01,
  'mm': 0.001,
  // AREA (Base: m2)
  'm2': 1,
  'cm2': 0.0001,
  // VOLUME (Base: L)
  'L': 1,
  'ml': 0.001,
  // MASS (Base: kg)
  'kg': 1,
  'gr': 0.001,
  // COUNT (Base: unidad)
  'unidad': 1
};

export function convert(value: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return value;
  
  const factorFrom = CONVERSION_FACTORS[fromUnit];
  const factorTo = CONVERSION_FACTORS[toUnit];
  
  if (!factorFrom || !factorTo) throw new Error(`Unidades incompatibles: ${fromUnit} -> ${toUnit}`);
  
  // Convertir a base y luego a destino
  const valueInBase = value * factorFrom;
  return valueInBase / factorTo;
}
