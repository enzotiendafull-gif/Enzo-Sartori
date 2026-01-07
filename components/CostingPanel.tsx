
import React, { useState } from 'react';
import { ProductionSession, SupplyCost, AppSettings, Supply } from '../types';
import { Calculator, DollarSign, UserCheck, Percent, Info, AlertCircle } from 'lucide-react';

interface CostingPanelProps {
  session: ProductionSession;
  costs: SupplyCost[];
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
}

export const CostingPanel: React.FC<CostingPanelProps> = ({ session, costs, settings, onUpdateSettings }) => {
  const [markup, setMarkup] = useState(settings.defaultMarkup);
  const [hourlyRate, setHourlyRate] = useState(settings.hourlyRate);

  const formatCurrency = (val: number) => {
    return `${settings.currency} ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 1. Consolidar insumos
  // Added explicit typing for the flattened array and the reduce function to resolve 'unknown' property errors.
  const consolidated = (session.activities.flatMap(a => a.supplies) as Supply[]).reduce((acc: Record<string, Supply>, curr: Supply) => {
    const key = `${(curr.name || '').toLowerCase().trim()}-${(curr.unit || '').toLowerCase().trim()}`;
    if (!acc[key]) {
      acc[key] = { ...curr };
    } else {
      acc[key].quantity += curr.quantity;
    }
    return acc;
  }, {} as Record<string, Supply>);

  // 2. Calcular costos de insumos
  let totalSuppliesCost = 0;
  const supplyBreakdown = Object.values(consolidated).map(sup => {
    const costMatch = costs.find(c => 
      (c.name || '').toLowerCase().trim() === (sup.name || '').toLowerCase().trim() && 
      (c.unit || '').toLowerCase().trim() === (sup.unit || '').toLowerCase().trim()
    );
    const cost = costMatch ? sup.quantity * costMatch.unitCost : 0;
    totalSuppliesCost += cost;
    return { ...sup, itemCost: cost, found: !!costMatch };
  });

  // 3. Mano de obra
  const totalHours = session.totalDurationMs / 3600000;
  const laborCost = totalHours * hourlyRate;

  // 4. Totales
  const totalProductionCost = totalSuppliesCost + laborCost;
  const suggestedPrice = totalProductionCost * (1 + markup / 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Calculator className="text-orange-500" size={16} />
        <h3 className="text-xs font-black text-stone-500 uppercase tracking-widest">Panel de Costeo & Pricing</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Parametros Editables */}
        <div className="bg-stone-800/30 border border-stone-800 p-6 rounded-[2rem] space-y-4">
           <div>
             <label className="text-[10px] font-black text-stone-600 uppercase tracking-widest mb-2 block">Costo Mano de Obra (Valor/Hora)</label>
             <div className="flex items-center gap-3 bg-stone-900 rounded-xl px-4 py-1">
                <span className="text-stone-500 text-xs font-bold">{settings.currency}</span>
                <input 
                  type="number" 
                  value={hourlyRate}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setHourlyRate(val);
                    onUpdateSettings({...settings, hourlyRate: val});
                  }}
                  className="bg-transparent border-none text-white font-mono text-sm w-full outline-none py-3"
                />
             </div>
           </div>
           <div>
             <label className="text-[10px] font-black text-stone-600 uppercase tracking-widest mb-2 block">Markup Comercial (%)</label>
             <div className="flex items-center gap-3 bg-stone-900 rounded-xl px-4 py-1">
                <Percent size={14} className="text-stone-500" />
                <input 
                  type="number" 
                  value={markup}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setMarkup(val);
                  }}
                  className="bg-transparent border-none text-white font-mono text-sm w-full outline-none py-3"
                />
             </div>
           </div>
        </div>

        {/* Resumen de Costos */}
        <div className="bg-stone-800/30 border border-stone-800 p-6 rounded-[2rem] space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-stone-500">Insumos Consolidados:</span>
            <span className="text-stone-200 font-bold">{formatCurrency(totalSuppliesCost)}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-stone-500">Mano de Obra ({totalHours.toFixed(2)}h):</span>
            <span className="text-stone-200 font-bold">{formatCurrency(laborCost)}</span>
          </div>
          <div className="h-px bg-stone-800 my-2" />
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-stone-500 uppercase">Costo Total Fábrica:</span>
            <span className="text-lg font-mono font-black text-white">{formatCurrency(totalProductionCost)}</span>
          </div>
        </div>
      </div>

      {/* Precio Sugerido CHABIER */}
      <div className="bg-orange-600 rounded-[2.5rem] p-8 shadow-xl shadow-orange-900/20 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
          <DollarSign size={100} />
        </div>
        <div className="relative z-10 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-2">Precio de Venta Sugerido</p>
          <h4 className="text-4xl font-mono font-black mb-1">{formatCurrency(suggestedPrice)}</h4>
          <p className="text-[10px] font-bold opacity-60">Rentabilidad Bruta: {formatCurrency(suggestedPrice - totalProductionCost)}</p>
        </div>
      </div>

      {/* Desglose de Insumos */}
      <div className="bg-stone-900/50 border border-stone-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-[10px]">
          <thead>
            <tr className="bg-stone-800/40 text-stone-500 border-b border-stone-800">
              <th className="p-3 uppercase">Item</th>
              <th className="p-3 uppercase text-right">Cantidad</th>
              <th className="p-3 uppercase text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {supplyBreakdown.map((item, i) => (
              <tr key={i} className="text-stone-400">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {item.name}
                    {!item.found && (
                      <span className="text-[8px] bg-red-900/30 text-red-500 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold">
                        <AlertCircle size={8} /> SIN PRECIO
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3 text-right font-mono">{item.quantity} {item.unit}</td>
                <td className="p-3 text-right font-mono text-stone-200">
                  {item.found ? formatCurrency(item.itemCost) : '---'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
