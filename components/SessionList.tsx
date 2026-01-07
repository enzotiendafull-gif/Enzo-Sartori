
import React from 'react';
import { ProductionSession } from '../types';
import { FileDown, Calendar, User, ShoppingBag, ChevronRight, Clock } from 'lucide-react';
import { CHABIER_PRODUCTS } from '../constants';

interface SessionListProps {
  sessions: ProductionSession[];
  onExport: () => void;
  onSelectSession: (session: ProductionSession) => void;
}

export const SessionList: React.FC<SessionListProps> = ({ sessions, onExport, onSelectSession }) => {
  const formatTime = (ms: number) => {
    const min = Math.floor(ms / 60000);
    return `${min} min`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em]">Historial de Taller</h3>
        <button 
          onClick={onExport}
          className="flex items-center gap-2 text-orange-500 text-[10px] font-black hover:bg-orange-600/10 px-3 py-1.5 rounded-lg transition-all uppercase tracking-widest"
        >
          <FileDown size={14} /> EXPORTAR TODO
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-20 bg-stone-900/30 rounded-[2rem] border border-stone-800 border-dashed">
          <p className="text-stone-600 text-sm italic">Sin producciones registradas aún.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {sessions.map(session => (
            <button 
              key={session.id} 
              onClick={() => onSelectSession(session)}
              className="w-full text-left bg-stone-900 border border-stone-800 p-5 rounded-2xl flex justify-between items-center group hover:border-orange-600 transition-all active:scale-[0.98]"
            >
              <div className="flex gap-4 items-center overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-stone-800 flex items-center justify-center text-stone-500 group-hover:bg-orange-600/20 group-hover:text-orange-500 transition-colors shrink-0">
                  <ShoppingBag size={20} />
                </div>
                <div className="overflow-hidden">
                  <p className="text-stone-200 font-bold text-sm truncate">{session.productName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] text-stone-600 font-black uppercase tracking-tighter">
                      {new Date(session.date).toLocaleDateString()}
                    </span>
                    <span className="text-stone-800">•</span>
                    <span className="text-[9px] text-stone-600 font-black uppercase tracking-tighter">
                      {session.activities.length} procesos
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-orange-500 font-mono text-xs font-black">{formatTime(session.totalDurationMs)}</p>
                  <p className="text-[8px] text-stone-700 uppercase font-black">Total</p>
                </div>
                <ChevronRight size={16} className="text-stone-800 group-hover:text-orange-500 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
