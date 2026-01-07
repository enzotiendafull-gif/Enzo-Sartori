
import React from 'react';
import { ProductionSession, Supply, SupplyCost, AppSettings } from '../types';
import { X, Clock, Layers, Package, Calendar, ArrowRight, Info } from 'lucide-react';
import { CostingPanel } from './CostingPanel';

interface SessionDetailProps {
  session: ProductionSession;
  costs: SupplyCost[];
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
  onClose: () => void;
}

export const SessionDetail: React.FC<SessionDetailProps> = ({ session, costs, settings, onUpdateSettings, onClose }) => {
  const formatTime = (ms: number) => {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min}m ${sec}s`;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-stone-900 w-full max-w-2xl h-[90vh] sm:h-auto sm:max-h-[85vh] overflow-y-auto rounded-t-[2.5rem] sm:rounded-[2.5rem] border-t sm:border border-stone-800 shadow-2xl flex flex-col">
        
        {/* Header Detalle */}
        <div className="sticky top-0 bg-stone-900 p-6 border-b border-stone-800 flex justify-between items-center z-10">
          <div>
            <div className="flex items-center gap-2 text-orange-500 mb-1">
              <Calendar size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {new Date(session.date).toLocaleDateString()}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white serif">{session.productName}</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-stone-800 rounded-full text-stone-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8 pb-12">
          {/* Métricas Rápidas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-stone-800/50 p-4 rounded-2xl border border-stone-800">
              <Clock className="text-orange-500 mb-2" size={18} />
              <p className="text-[10px] text-stone-500 uppercase font-bold">Tiempo Total</p>
              <p className="text-lg font-mono font-black text-white">{formatTime(session.totalDurationMs)}</p>
            </div>
            <div className="bg-stone-800/50 p-4 rounded-2xl border border-stone-800">
              <Layers className="text-orange-500 mb-2" size={18} />
              <p className="text-[10px] text-stone-500 uppercase font-bold">Etapas</p>
              <p className="text-lg font-mono font-black text-white">{session.activities.length}</p>
            </div>
          </div>

          {/* PANEL DE COSTEO */}
          <CostingPanel 
            session={session} 
            costs={costs} 
            settings={settings} 
            onUpdateSettings={onUpdateSettings} 
          />

          {/* Timeline de Procesos */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-stone-500 uppercase tracking-widest flex items-center gap-2">
              <Clock size={14} /> Secuencia de Trabajo
            </h3>
            <div className="space-y-3">
              {session.activities.map((a, i) => {
                const percent = ((a.durationMs / session.totalDurationMs) * 100).toFixed(0);
                return (
                  <div key={a.id} className="relative bg-stone-800/30 border border-stone-800 p-4 rounded-2xl overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 bg-orange-600/5 transition-all" style={{ width: `${percent}%` }} />
                    <div className="relative flex justify-between items-start">
                      <div className="flex gap-4">
                        <span className="text-stone-700 font-black text-xs mt-1">{String(i + 1).padStart(2, '0')}</span>
                        <div>
                          <h4 className="font-bold text-sm text-stone-200">{a.name}</h4>
                          {a.notes && <p className="text-xs text-stone-500 mt-1 italic">"{a.notes}"</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono font-bold text-orange-500">{formatTime(a.durationMs)}</p>
                        <p className="text-[9px] text-stone-600 font-bold uppercase">{percent}%</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="p-4 bg-orange-600/5 border border-orange-600/20 rounded-2xl flex gap-3 items-start">
             <Info className="text-orange-500 shrink-0" size={16} />
             <p className="text-[10px] text-orange-200/70 leading-relaxed italic">
                El precio sugerido se basa en el markup configurado y el maestro de costos actual. Cambios en los costos de insumos afectarán el cálculo retroactivamente.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
