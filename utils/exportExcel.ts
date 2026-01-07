
import * as XLSX from 'xlsx';
import { ProductionSession, SupplyCost } from '../types';

export const exportSessionsToExcel = (sessions: ProductionSession[]) => {
  // 1. Hoja de Producciones
  const producciones = sessions.map(s => ({
    ProduccionID: s.id,
    Fecha: new Date(s.date).toLocaleDateString(),
    Producto: s.productName,
    Artesano: s.artisan,
    Status: s.status,
    TiempoTotalSeg: Math.round(s.totalDurationMs / 1000),
    TiempoTotalMin: (s.totalDurationMs / 60000).toFixed(2),
    CantProcesos: s.activities.length,
    CantInsumos: s.activities.reduce((acc, a) => acc + a.supplies.length, 0),
    Notas: ""
  }));

  // 2. Hoja de Procesos
  const procesos = sessions.flatMap(s => s.activities.map((a, index) => ({
    ProduccionID: s.id,
    ProcesoID: a.id,
    Orden: index + 1,
    NombreProceso: a.name,
    Inicio: a.startTime ? new Date(a.startTime).toLocaleString() : '',
    Fin: a.endTime ? new Date(a.endTime).toLocaleString() : '',
    TiempoSeg: Math.round(a.durationMs / 1000),
    TiempoMin: (a.durationMs / 60000).toFixed(2),
    Observaciones: a.notes || '',
    CantInsumosProceso: a.supplies.length
  })));

  // 3. Hoja de Insumos
  const insumos = sessions.flatMap(s => s.activities.flatMap(a => a.supplies.map(sup => ({
    ProduccionID: s.id,
    ProcesoID: a.id,
    InsumoID: sup.id,
    NombreInsumo: sup.name,
    Unidad: sup.unit,
    Cantidad: sup.quantity
  }))));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(producciones), "Producciones");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(procesos), "Procesos");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(insumos), "Insumos");

  XLSX.writeFile(wb, `CHABIER_BI_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportCostsToExcel = (costs: SupplyCost[]) => {
  const data = costs.map(c => ({
    NombreInsumo: c.name,
    Unidad: c.unit,
    CostoUnitario: c.unitCost,
    Moneda: c.currency
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "InsumosCostos");
  XLSX.writeFile(wb, `CHABIER_Costos_${new Date().toISOString().split('T')[0]}.xlsx`);
};
