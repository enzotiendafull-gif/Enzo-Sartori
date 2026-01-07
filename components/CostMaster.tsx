
import React, { useState } from 'react';
import { SupplyCost } from '../types';
import { Trash2, Plus, FileDown, FileUp, Save, Search, X, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { exportCostsToExcel } from '../utils/exportExcel';

interface CostMasterProps {
  costs: SupplyCost[];
  onUpdate: (costs: SupplyCost[]) => void;
  onClose: () => void;
}

export const CostMaster: React.FC<CostMasterProps> = ({ costs, onUpdate, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [newCost, setNewCost] = useState({ name: '', unit: 'unidad', unitCost: '', currency: 'ARS' });

  const handleAdd = () => {
    if (!newCost.name || !newCost.unitCost) return;
    const item: SupplyCost = {
      id: `COST-${Date.now()}`,
      name: newCost.name,
      unit: newCost.unit,
      unitCost: parseFloat(newCost.unitCost),
      currency: newCost.currency
    };
    onUpdate([...costs, item]);
    setNewCost({ name: '', unit: 'unidad', unitCost: '', currency: 'ARS' });
  };

  const handleDelete = (id: string) => {
    onUpdate(costs.filter(c => c.id !== id));
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const validCosts: SupplyCost[] = data.map((row, idx) => {
          if (!row.NombreInsumo || row.CostoUnitario === undefined) {
             throw new Error(`Fila ${idx + 1} no tiene NombreInsumo o CostoUnitario`);
          }
          return {
            id: `COST-IMP-${idx}-${Date.now()}`,
            name: row.NombreInsumo || 'Insumo sin nombre',
            unit: row.Unidad || 'unidad',
            unitCost: parseFloat(row.CostoUnitario) || 0,
            currency: row.Moneda || 'ARS'
          };
        });

        if (confirm("¿Fusionar con existentes (Aceptar) o Reemplazar todo (Cancelar)?")) {
          onUpdate([...costs, ...validCosts]);
        } else {
          onUpdate(validCosts);
        }
      } catch (err: any) {
        alert("Error al importar: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredCosts = costs.filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[110] bg-black flex flex-col sm:p-4">
      <div className="bg-stone-900 flex-1 flex flex-col rounded-[2.5rem] border border-stone-800 shadow-2xl overflow-hidden">
        
        <div className="p-6 border-b border-stone-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white serif">Maestro de Costos</h2>
            <p className="text-[10px] text-stone-500 font-black uppercase tracking-widest">Base de precios de insumos</p>
          </div>
          <button onClick={onClose} className="p-2 bg-stone-800 rounded-full text-stone-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* New Item Form */}
          <div className="bg-stone-800/30 p-6 rounded-3xl border border-stone-800 space-y-4">
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Nuevo Insumo</p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input 
                placeholder="Nombre (ej: Cuero Negro)" 
                className="bg-stone-900 border-none rounded-xl p-3 text-sm col-span-1 sm:col-span-2"
                value={newCost.name}
                onChange={e => setNewCost({...newCost, name: e.target.value})}
              />
              <select 
                className="bg-stone-900 border-none rounded-xl p-3 text-sm"
                value={newCost.unit}
                onChange={e => setNewCost({...newCost, unit: e.target.value})}
              >
                <option value="unidad">Unidad</option>
                <option value="cm">cm</option>
                <option value="m">m</option>
                <option value="gr">gr</option>
                <option value="ml">ml</option>
              </select>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="Costo" 
                  className="w-full bg-stone-900 border-none rounded-xl p-3 text-sm"
                  value={newCost.unitCost}
                  onChange={e => setNewCost({...newCost, unitCost: e.target.value})}
                />
                <button onClick={handleAdd} className="bg-orange-600 text-white p-3 rounded-xl hover:bg-orange-500 transition-colors">
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Search and List */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600" />
                <input 
                  placeholder="Buscar insumo..." 
                  className="w-full bg-stone-900 border border-stone-800 rounded-2xl pl-11 pr-4 py-3 text-sm outline-none focus:border-orange-600 transition-all"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => exportCostsToExcel(costs)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-stone-800 px-5 py-3 rounded-2xl text-xs font-bold text-stone-300 hover:text-white transition-all"
                >
                  <FileDown size={16} /> EXPORTAR
                </button>
                <label className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-stone-800 px-5 py-3 rounded-2xl text-xs font-bold text-stone-300 hover:text-white transition-all cursor-pointer">
                  <FileUp size={16} /> IMPORTAR
                  <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleImport} />
                </label>
              </div>
            </div>

            <div className="bg-stone-900/50 border border-stone-800 rounded-3xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-800/40 text-stone-500">
                    <th className="p-4 font-black uppercase tracking-widest">Insumo</th>
                    <th className="p-4 font-black uppercase tracking-widest text-center">Unidad</th>
                    <th className="p-4 font-black uppercase tracking-widest text-right">Costo Unit.</th>
                    <th className="p-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/50">
                  {filteredCosts.length === 0 ? (
                    <tr><td colSpan={4} className="p-12 text-center text-stone-700 italic">No hay costos registrados</td></tr>
                  ) : (
                    filteredCosts.map(c => (
                      <tr key={c.id} className="hover:bg-stone-800/10 transition-colors group">
                        <td className="p-4 font-bold text-stone-200">{c.name}</td>
                        <td className="p-4 text-center text-stone-500 uppercase font-black">{c.unit}</td>
                        <td className="p-4 text-right text-orange-500 font-mono font-black">{c.currency} {c.unitCost.toLocaleString()}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => handleDelete(c.id)} className="text-stone-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
