
import React, { useState, useMemo } from 'react';
import { SupplyCatalogItem, Supply, Dimension } from '../types';
import { Search, X, Calculator, AlertCircle, PackageCheck } from 'lucide-react';
import { UNITS_BY_DIMENSION, convert } from '../utils/conversions';

interface SupplyPickerModalProps {
  catalog: SupplyCatalogItem[];
  onSelect: (supply: Supply) => void;
  onClose: () => void;
}

export const SupplyPickerModal: React.FC<SupplyPickerModalProps> = ({ catalog, onSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<SupplyCatalogItem | null>(null);
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');

  const filteredCatalog = useMemo(() => 
    catalog.filter(item => (item.name || '').toLowerCase().includes(search.toLowerCase())),
  [catalog, search]);

  const calculatedCost = useMemo(() => {
    if (!selectedItem || !quantity || !unit) return 0;
    try {
      const q = parseFloat(quantity);
      const qBase = convert(q, unit, selectedItem.baseUnit);
      return qBase * selectedItem.unitCost;
    } catch (e) {
      return 0;
    }
  }, [selectedItem, quantity, unit]);

  const handleConfirm = () => {
    if (!selectedItem || !quantity || !unit) return;
    const q = parseFloat(quantity);
    const qBase = convert(q, unit, selectedItem.baseUnit);
    
    const supply: Supply = {
      id: `SUP-${Date.now()}`,
      catalogId: selectedItem.id,
      name: selectedItem.name,
      dimension: selectedItem.dimension,
      unit: unit,
      quantity: q,
      quantityInBaseUnit: qBase,
      baseUnit: selectedItem.baseUnit,
      unitCostSnapshot: selectedItem.unitCost,
      totalCost: calculatedCost
    };
    
    onSelect(supply);
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-stone-900 w-full max-w-lg rounded-[2.5rem] border border-stone-800 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-stone-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white serif">Agregar Insumo</h2>
          <button onClick={onClose} className="p-2 bg-stone-800 rounded-full text-stone-400 hover:text-white"><X size={20}/></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {!selectedItem ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600" size={16} />
                <input 
                  autoFocus
                  placeholder="Buscar en el catálogo..."
                  className="w-full bg-stone-800 border-none rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:ring-1 focus:ring-orange-600 outline-none"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                {filteredCatalog.map(item => (
                  <button 
                    key={item.id}
                    onClick={() => {
                      setSelectedItem(item);
                      setUnit(item.baseUnit);
                    }}
                    className="flex justify-between items-center p-4 bg-stone-800/30 border border-stone-800 rounded-2xl hover:border-orange-600 group transition-all"
                  >
                    <div className="text-left">
                      <p className="font-bold text-stone-200 group-hover:text-orange-500">{item.name}</p>
                      <p className="text-[10px] text-stone-600 uppercase font-black tracking-widest">{item.dimension} • Base: {item.baseUnit}</p>
                    </div>
                    <p className="text-xs font-mono text-stone-500">${item.unitCost}/{item.baseUnit}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in zoom-in-95">
              <div className="bg-orange-600/10 border border-orange-600/30 p-4 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-orange-500 uppercase">Seleccionado</p>
                  <p className="font-bold text-white">{selectedItem.name}</p>
                </div>
                <button onClick={() => setSelectedItem(null)} className="text-[10px] font-black text-stone-500 hover:text-white underline">CAMBIAR</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-500 uppercase px-1">Cantidad</label>
                  <input 
                    type="number"
                    autoFocus
                    placeholder="0.00"
                    className="w-full bg-stone-800 border-none rounded-xl p-4 text-white font-mono"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-500 uppercase px-1">Unidad</label>
                  <select 
                    className="w-full bg-stone-800 border-none rounded-xl p-4 text-white uppercase font-bold text-xs appearance-none"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                  >
                    {UNITS_BY_DIMENSION[selectedItem.dimension].map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-stone-800/50 p-6 rounded-3xl border border-stone-800 text-center">
                <p className="text-[10px] font-black text-stone-500 uppercase mb-2">Costo Proyectado</p>
                <p className="text-3xl font-mono font-black text-orange-500">
                  {selectedItem.currency} {calculatedCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <div className="mt-2 flex items-center justify-center gap-1 text-[9px] text-stone-600 uppercase font-bold italic">
                   <Calculator size={10} /> {quantity || 0} {unit} @ {selectedItem.unitCost}/{selectedItem.baseUnit}
                </div>
              </div>

              <button 
                onClick={handleConfirm}
                disabled={!quantity || parseFloat(quantity) <= 0}
                className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black text-xs tracking-widest uppercase shadow-xl shadow-orange-900/20 active:scale-95 transition-all disabled:opacity-50"
              >
                CONFIRMAR INSUMO
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
