
import React, { useState } from 'react';
import { SupplyCatalogItem, Dimension } from '../types';
import { Search, Plus, Trash2, FileDown, FileUp, X, Ruler, Square, Droplet, Weight, Hash } from 'lucide-react';
import * as XLSX from 'xlsx';
import { UNITS_BY_DIMENSION } from '../utils/conversions';

interface CatalogViewProps {
  catalog: SupplyCatalogItem[];
  onUpdate: (catalog: SupplyCatalogItem[]) => void;
  onClose: () => void;
}

const DIMENSION_ICONS: Record<Dimension, any> = {
  LENGTH: Ruler,
  AREA: Square,
  VOLUME: Droplet,
  MASS: Weight,
  COUNT: Hash
};

export const CatalogView: React.FC<CatalogViewProps> = ({ catalog, onUpdate, onClose }) => {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState<Partial<SupplyCatalogItem>>({
    name: '',
    dimension: 'COUNT',
    baseUnit: 'unidad',
    unitCost: 0,
    currency: 'ARS'
  });

  const handleExport = () => {
    const data = catalog.map(c => ({
      Nombre: c.name,
      Dimension: c.dimension,
      UnidadBase: c.baseUnit,
      CostoUnitario: c.unitCost,
      Moneda: c.currency
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Catalogo");
    XLSX.writeFile(wb, "CHABIER_Catalogo.xlsx");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as any[];
        const valid = data.map((r, i) => ({
          id: `CAT-${Date.now()}-${i}`,
          name: r.Nombre || 'Insumo sin nombre',
          dimension: (r.Dimension || 'COUNT') as Dimension,
          baseUnit: r.UnidadBase || 'unidad',
          unitCost: parseFloat(r.CostoUnitario) || 0,
          currency: r.Moneda || 'ARS'
        }));
        if (confirm("¿Reemplazar catálogo actual?")) onUpdate(valid);
        else onUpdate([...catalog, ...valid]);
      } catch (err) { alert("Error de formato"); }
    };
    reader.readAsBinaryString(file);
  };

  const addItem = () => {
    if (!newItem.name || !newItem.unitCost) return;
    const item = { ...newItem, id: `CAT-${Date.now()}` } as SupplyCatalogItem;
    onUpdate([...catalog, item]);
    setShowAdd(false);
  };

  const filtered = catalog.filter(c => (c.name || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[120] bg-black flex flex-col sm:p-4">
      <div className="bg-stone-900 flex-1 flex flex-col rounded-[2.5rem] border border-stone-800 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-stone-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white serif">Catálogo Maestro</h2>
            <p className="text-[10px] text-stone-500 font-black uppercase tracking-widest">Definición de Insumos y Unidades</p>
          </div>
          <button onClick={onClose} className="p-2 bg-stone-800 rounded-full text-stone-400 hover:text-white"><X size={20}/></button>
        </div>

        <div className="p-6 flex flex-col gap-6 overflow-hidden">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600" size={16} />
              <input 
                placeholder="Buscar insumo..."
                className="w-full bg-stone-800 border-none rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:ring-1 focus:ring-orange-600 outline-none"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button onClick={handleExport} className="bg-stone-800 p-3 rounded-xl text-stone-400 hover:text-white"><FileDown size={20}/></button>
            <label className="bg-stone-800 p-3 rounded-xl text-stone-400 hover:text-white cursor-pointer">
              <FileUp size={20}/>
              <input type="file" className="hidden" onChange={handleImport} />
            </label>
            <button onClick={() => setShowAdd(true)} className="bg-orange-600 p-3 rounded-xl text-white hover:bg-orange-500"><Plus size={20}/></button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid gap-3">
              {filtered.map(item => {
                const Icon = DIMENSION_ICONS[item.dimension];
                return (
                  <div key={item.id} className="bg-stone-800/20 border border-stone-800 p-4 rounded-2xl flex justify-between items-center group">
                    <div className="flex gap-4 items-center">
                      <div className="p-2.5 bg-stone-800 rounded-xl text-stone-500">
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-stone-200">{item.name}</p>
                        <p className="text-[9px] text-stone-600 uppercase font-black tracking-widest">{item.dimension} • {item.baseUnit}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-mono font-black text-orange-500">{item.currency} {item.unitCost}</p>
                        <p className="text-[8px] text-stone-700 uppercase font-black">por {item.baseUnit}</p>
                      </div>
                      <button onClick={() => onUpdate(catalog.filter(c => c.id !== item.id))} className="text-stone-800 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {showAdd && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[130]">
            <div className="bg-stone-900 w-full max-md p-8 rounded-[2rem] border border-stone-800 shadow-2xl space-y-6">
              <h3 className="text-lg font-bold text-white serif">Nuevo Insumo</h3>
              <div className="space-y-4">
                <input 
                  placeholder="Nombre..." 
                  className="w-full bg-stone-800 border-none rounded-xl p-4 text-sm text-white"
                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-4">
                  <select 
                    className="bg-stone-800 border-none rounded-xl p-4 text-xs font-bold text-white uppercase"
                    onChange={e => {
                      const dim = e.target.value as Dimension;
                      setNewItem({...newItem, dimension: dim, baseUnit: UNITS_BY_DIMENSION[dim][0]});
                    }}
                  >
                    <option value="COUNT">Conteo</option>
                    <option value="LENGTH">Longitud</option>
                    <option value="AREA">Área</option>
                    <option value="VOLUME">Volumen</option>
                    <option value="MASS">Masa</option>
                  </select>
                  <select 
                    className="bg-stone-800 border-none rounded-xl p-4 text-xs font-bold text-white uppercase"
                    value={newItem.baseUnit}
                    onChange={e => setNewItem({...newItem, baseUnit: e.target.value})}
                  >
                    {UNITS_BY_DIMENSION[newItem.dimension as Dimension]?.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="number" 
                    placeholder="Costo Base..." 
                    className="bg-stone-800 border-none rounded-xl p-4 text-sm text-white"
                    onChange={e => setNewItem({...newItem, unitCost: parseFloat(e.target.value)})}
                  />
                  <input 
                    placeholder="Moneda..." 
                    className="bg-stone-800 border-none rounded-xl p-4 text-sm text-white"
                    defaultValue="ARS"
                    onChange={e => setNewItem({...newItem, currency: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowAdd(false)} className="flex-1 py-4 text-xs font-black text-stone-500 uppercase">Cancelar</button>
                <button onClick={addItem} className="flex-1 bg-orange-600 py-4 rounded-xl text-white font-black text-xs uppercase">Guardar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
