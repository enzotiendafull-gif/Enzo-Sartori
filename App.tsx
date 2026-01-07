
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, ChevronRight, Hammer, Brain, Layers, Clock, Save, Trash2, FileDown, FileUp, RefreshCcw, 
  AlertTriangle, X, History, Coins, BookOpen, Settings, CheckCircle2, LayoutDashboard, Calculator,
  ArrowLeft
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { CHABIER_PRODUCTS, ARTISAN_NAME } from './constants';
import { Activity, ProductionSession, Product, Supply, SupplyCatalogItem, AppSettings } from './types';
import { AnalysisView } from './components/AnalysisView';
import { SessionList } from './components/SessionList';
import { SessionDetail } from './components/SessionDetail';
import { CatalogView } from './components/CatalogView';
import { SupplyPickerModal } from './components/SupplyPickerModal';
import { exportSessionsToExcel } from './utils/exportExcel';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'select_product' | 'workroom' | 'analysis' | 'admin' | 'history' | 'catalog'>('home');
  const [sessions, setSessions] = useState<ProductionSession[]>([]);
  const [catalog, setCatalog] = useState<SupplyCatalogItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    currency: 'ARS',
    hourlyRate: 5000,
    defaultMarkup: 150,
    setupComplete: false
  });

  const [currentSession, setCurrentSession] = useState<ProductionSession | null>(null);
  const [selectedSession, setSelectedSession] = useState<ProductionSession | null>(null);
  const [showSupplyPicker, setShowSupplyPicker] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Persistencia
  useEffect(() => {
    const s = localStorage.getItem('chabier_sessions');
    if (s) setSessions(JSON.parse(s));
    const c = localStorage.getItem('chabier_catalog');
    if (c) setCatalog(JSON.parse(c));
    const st = localStorage.getItem('chabier_settings');
    if (st) setSettings(JSON.parse(st));
  }, []);

  useEffect(() => localStorage.setItem('chabier_sessions', JSON.stringify(sessions)), [sessions]);
  useEffect(() => localStorage.setItem('chabier_catalog', JSON.stringify(catalog)), [catalog]);
  useEffect(() => localStorage.setItem('chabier_settings', JSON.stringify(settings)), [settings]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Onboarding Status
  const setupStatus = useMemo(() => ({
    catalog: catalog.length > 0,
    settings: settings.hourlyRate > 0 && settings.defaultMarkup > 0,
    ready: catalog.length > 0 && settings.hourlyRate > 0
  }), [catalog, settings]);

  const startNewSession = (product: Product) => {
    if (!setupStatus.ready) {
      showToast("Completa la configuración antes de iniciar", "error");
      return;
    }
    const session: ProductionSession = {
      id: `SES-${Date.now()}`,
      artisan: ARTISAN_NAME,
      productId: product.id,
      productName: product.name,
      date: new Date().toISOString(),
      activities: [],
      status: 'in_progress',
      totalDurationMs: 0
    };
    setCurrentSession(session);
    setView('workroom');
  };

  const addNewActivity = (name: string) => {
    if (!currentSession) return;
    const now = Date.now();
    const activities = currentSession.activities.map(a => 
      a.status === 'active' ? { ...a, status: 'completed' as const, endTime: now, durationMs: a.durationMs + (now - a.startTime) } : a
    );
    const newAct: Activity = {
      id: `ACT-${Date.now()}`,
      name: name || `Proceso ${activities.length + 1}`,
      startTime: now,
      status: 'active',
      durationMs: 0,
      supplies: []
    };
    setCurrentSession({ ...currentSession, activities: [...activities, newAct] });
  };

  const addSupplyToActivity = (supply: Supply) => {
    if (!currentSession || !showSupplyPicker) return;
    setCurrentSession({
      ...currentSession,
      activities: currentSession.activities.map(a => 
        a.id === showSupplyPicker ? { ...a, supplies: [...a.supplies, supply] } : a
      )
    });
    setShowSupplyPicker(null);
  };

  const finishSession = () => {
    if (!currentSession) return;
    const now = Date.now();
    const finalActs = currentSession.activities.map(a => {
      const dur = a.status === 'active' ? a.durationMs + (now - a.startTime) : a.durationMs;
      return { ...a, status: 'completed' as const, durationMs: dur, endTime: a.endTime || now };
    });
    const total = finalActs.reduce((acc, a) => acc + a.durationMs, 0);
    setSessions(prev => [{ ...currentSession, status: 'finished', activities: finalActs, totalDurationMs: total }, ...prev]);
    setCurrentSession(null);
    setView('home');
    showToast("Producción finalizada exitosamente");
  };

  // Fixed missing handleResetApp function to clear global state and localStorage
  const handleResetApp = () => {
    if (window.confirm("¿Estás seguro de que deseas borrar todos los datos? Esta acción no se puede deshacer.")) {
      localStorage.removeItem('chabier_sessions');
      localStorage.removeItem('chabier_catalog');
      localStorage.removeItem('chabier_settings');
      setSessions([]);
      setCatalog([]);
      setSettings({
        currency: 'ARS',
        hourlyRate: 5000,
        defaultMarkup: 150,
        setupComplete: false
      });
      setView('home');
      showToast("Datos borrados", "success");
    }
  };

  return (
    <div className="min-h-screen pb-20 flex flex-col bg-[#0c0a09] text-stone-100 font-sans selection:bg-orange-600/30">
      
      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${toast.type === 'error' ? 'bg-red-600' : 'bg-orange-600'}`}>
          <span className="text-sm font-bold uppercase tracking-widest">{toast.message}</span>
        </div>
      )}

      <header className="p-6 border-b border-stone-800 flex justify-between items-center bg-stone-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="cursor-pointer group flex items-center gap-3" onClick={() => setView('home')}>
          <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center shadow-lg group-active:scale-95 transition-all">
             <Hammer size={18} className="text-white" />
          </div>
          <h1 className="text-xl font-black tracking-tighter text-white uppercase serif">CHABIER</h1>
        </div>
        
        <nav className="flex gap-1 bg-stone-800/50 p-1 rounded-2xl border border-stone-700">
          <button onClick={() => setView('history')} className={`p-2.5 rounded-xl transition-all ${view === 'history' ? 'bg-orange-600 text-white shadow-lg' : 'text-stone-400 hover:text-white'}`}>
            <History size={18} />
          </button>
          <button onClick={() => setView('catalog')} className={`p-2.5 rounded-xl transition-all ${view === 'catalog' ? 'bg-orange-600 text-white shadow-lg' : 'text-stone-400 hover:text-white'}`}>
            <BookOpen size={18} />
          </button>
          <button onClick={() => setView('analysis')} className={`p-2.5 rounded-xl transition-all ${view === 'analysis' ? 'bg-orange-600 text-white shadow-lg' : 'text-stone-400 hover:text-white'}`}>
            <Brain size={18} />
          </button>
          <button onClick={() => setView('admin')} className={`p-2.5 rounded-xl transition-all ${view === 'admin' ? 'bg-orange-600 text-white shadow-lg' : 'text-stone-400 hover:text-white'}`}>
            <Settings size={18} />
          </button>
        </nav>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 overflow-x-hidden">
        
        {view === 'home' && (
          <div className="py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
            
            {/* Onboarding Widget */}
            {!setupStatus.ready && (
              <div className="bg-orange-600/5 border border-orange-600/20 p-8 rounded-[2.5rem] space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white serif">Configuración Requerida</h3>
                  <p className="text-stone-500 text-xs mt-1">Sigue estos pasos para habilitar el taller digital.</p>
                </div>
                <div className="grid gap-4">
                  <div onClick={() => setView('catalog')} className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${setupStatus.catalog ? 'bg-green-600/10 border-green-600/30 text-green-500' : 'bg-stone-800/50 border-stone-800 text-stone-400 hover:border-orange-600'}`}>
                    <div className="flex items-center gap-3">
                      <BookOpen size={20} />
                      <span className="text-xs font-black uppercase tracking-widest">Paso 1: Catálogo de Insumos</span>
                    </div>
                    {setupStatus.catalog && <CheckCircle2 size={18} />}
                  </div>
                  <div onClick={() => setView('admin')} className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${setupStatus.settings ? 'bg-green-600/10 border-green-600/30 text-green-500' : 'bg-stone-800/50 border-stone-800 text-stone-400 hover:border-orange-600'}`}>
                    <div className="flex items-center gap-3">
                      <Settings size={20} />
                      <span className="text-xs font-black uppercase tracking-widest">Paso 2: Valor Hora y Markup</span>
                    </div>
                    {setupStatus.settings && <CheckCircle2 size={18} />}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-stone-900 border border-stone-800 p-8 rounded-[2.5rem] text-center shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Hammer size={120} />
              </div>
              <p className="text-stone-500 text-[10px] font-black uppercase tracking-[0.4em] mb-2">Fábrica de Marroquinería</p>
              <h2 className="text-3xl font-bold text-stone-100 mb-2 serif">Matías Cambas</h2>
              <div className="h-1 w-12 bg-orange-600 mx-auto mb-10 rounded-full" />
              
              <button 
                onClick={() => setView('select_product')}
                disabled={!setupStatus.ready}
                className="w-full bg-orange-600 text-white py-5 rounded-[1.5rem] font-black hover:bg-orange-500 transition-all flex items-center justify-center gap-3 shadow-xl shadow-orange-900/20 active:scale-95 text-sm tracking-widest uppercase disabled:opacity-20 disabled:grayscale"
              >
                <Plus size={24} /> NUEVA PRODUCCIÓN
              </button>
            </div>

            {sessions.length > 0 && (
              <div className="space-y-4">
                 <SessionList 
                    sessions={sessions.slice(0, 3)} 
                    onExport={() => exportSessionsToExcel(sessions)}
                    onSelectSession={setSelectedSession}
                 />
                 <button onClick={() => setView('history')} className="w-full py-4 text-[10px] font-black text-stone-600 uppercase tracking-widest hover:text-orange-500 transition-colors">
                   Acceder al historial completo
                 </button>
              </div>
            )}
          </div>
        )}

        {view === 'catalog' && (
          <CatalogView 
            catalog={catalog} 
            onUpdate={setCatalog} 
            onClose={() => setView('home')} 
          />
        )}

        {view === 'workroom' && currentSession && (
          <div className="py-6 space-y-6 animate-in fade-in duration-500">
             <div className="flex justify-between items-center bg-stone-900 p-6 rounded-[2rem] border border-stone-800 shadow-xl">
              <div className="max-w-[65%]">
                <p className="text-[10px] text-orange-500 uppercase font-black tracking-widest mb-1">Mesa de Trabajo</p>
                <h2 className="text-sm font-bold text-white leading-tight serif">{currentSession.productName}</h2>
              </div>
              <button 
                onClick={finishSession}
                className="bg-green-600 text-white px-6 py-3 rounded-xl font-black text-xs shadow-lg active:scale-95 transition-all uppercase tracking-widest"
              >
                FINALIZAR
              </button>
            </div>

            <div className="bg-stone-900 p-5 rounded-[1.5rem] border border-stone-800 flex gap-3 shadow-lg">
              <input 
                placeholder="Nombre del proceso actual..."
                className="flex-1 bg-stone-800 border-none rounded-xl text-white px-5 py-4 focus:ring-1 focus:ring-orange-500 outline-none text-sm placeholder-stone-600"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addNewActivity((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
              <button onClick={() => {
                const input = document.querySelector('input[placeholder="Nombre del proceso actual..."]') as HTMLInputElement;
                addNewActivity(input.value);
                input.value = '';
              }} className="bg-orange-600 text-white p-4 rounded-xl hover:bg-orange-500 transition-colors">
                <Plus size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {[...currentSession.activities].reverse().map(a => (
                <div key={a.id} className={`p-6 rounded-[2rem] border transition-all ${a.status === 'active' ? 'border-orange-500 bg-orange-600/5' : 'border-stone-800 bg-stone-900/40 opacity-70'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-sm text-stone-200">{a.name}</h4>
                      <p className="font-mono text-orange-500 text-xs font-bold mt-1">
                        {Math.floor((a.durationMs + (a.status === 'active' ? (currentTime - a.startTime) : 0))/1000)}s
                      </p>
                    </div>
                    {a.status === 'active' && <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse" />}
                  </div>

                  <div className="border-t border-stone-800/50 pt-4 mt-4">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-[9px] font-black text-stone-600 uppercase tracking-widest">Insumos del Proceso</p>
                      {a.status !== 'completed' && (
                        <button onClick={() => setShowSupplyPicker(a.id)} className="text-[10px] bg-stone-800 px-3 py-1.5 rounded-lg text-stone-400 font-bold hover:text-white transition-colors">+ AGREGAR</button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {a.supplies.map(sup => (
                        <div key={sup.id} className="bg-stone-800/50 px-3 py-2 rounded-xl border border-stone-700 text-[10px] flex items-center gap-2">
                          <span className="text-stone-300 font-bold">{sup.name}</span>
                          <span className="text-orange-500 font-black">{sup.quantity} {sup.unit}</span>
                          <span className="text-stone-600">•</span>
                          <span className="text-stone-400 font-mono">${sup.totalCost.toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'admin' && (
          <div className="py-8 space-y-8 animate-in fade-in">
             <button onClick={() => setView('home')} className="flex items-center gap-2 text-stone-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-4">
              <ArrowLeft size={16} /> <span>Volver</span>
            </button>
            <div className="bg-stone-900 border border-stone-800 p-8 rounded-[2.5rem] shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-2 serif">Configuración Taller</h2>
              <div className="grid gap-6 mt-8">
                 <div className="bg-stone-800/20 p-6 rounded-3xl border border-stone-800">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-4 block">Valor Hora Artesano (ARS)</label>
                    <input 
                      type="number"
                      className="bg-stone-900 w-full border-none rounded-2xl p-4 text-xl font-mono text-orange-500 outline-none"
                      value={settings.hourlyRate}
                      onChange={e => setSettings({...settings, hourlyRate: parseFloat(e.target.value) || 0})}
                    />
                 </div>
                 <div className="bg-stone-800/20 p-6 rounded-3xl border border-stone-800">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-4 block">Markup Comercial (%)</label>
                    <input 
                      type="number"
                      className="bg-stone-900 w-full border-none rounded-2xl p-4 text-xl font-mono text-orange-500 outline-none"
                      value={settings.defaultMarkup}
                      onChange={e => setSettings({...settings, defaultMarkup: parseFloat(e.target.value) || 0})}
                    />
                 </div>
                 <button onClick={handleResetApp} className="w-full bg-red-900/10 border border-red-900/20 p-6 rounded-2xl flex items-center justify-between hover:bg-red-900/20 transition-all group mt-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-red-600/10 text-red-500 rounded-xl"><RefreshCcw size={24} /></div>
                      <div className="text-left">
                        <p className="font-bold text-sm text-red-500">Borrado Total</p>
                        <p className="text-[10px] text-red-700">Elimina el historial y vuelve al inicio.</p>
                      </div>
                    </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'select_product' && (
          <div className="space-y-6 py-8 animate-in fade-in">
            <button onClick={() => setView('home')} className="flex items-center gap-2 text-stone-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
              <ArrowLeft size={16} /> <span>Volver</span>
            </button>
            <h2 className="text-2xl font-bold text-white mb-6 serif">Iniciar Prototipo</h2>
            <div className="grid gap-3">
              {CHABIER_PRODUCTS.map(p => (
                <button 
                  key={p.id}
                  onClick={() => startNewSession(p)}
                  className="bg-stone-900 border border-stone-800 p-6 rounded-[1.5rem] text-left hover:border-orange-600 transition-all group flex justify-between items-center"
                >
                  <span className="text-stone-300 font-bold text-sm uppercase tracking-tight">{p.name}</span>
                  <ChevronRight size={18} className="text-stone-700 group-hover:text-orange-500 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {view === 'history' && (
          <div className="py-8 animate-in fade-in">
            <button onClick={() => setView('home')} className="flex items-center gap-2 text-stone-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-8">
              <ArrowLeft size={16} /> <span>Volver</span>
            </button>
            <SessionList 
                sessions={sessions} 
                onExport={() => exportSessionsToExcel(sessions)}
                onSelectSession={setSelectedSession}
             />
          </div>
        )}

        {view === 'analysis' && <AnalysisView sessions={sessions} />}
      </main>

      {/* Modales */}
      {showSupplyPicker && (
        <SupplyPickerModal 
          catalog={catalog} 
          onSelect={addSupplyToActivity} 
          onClose={() => setShowSupplyPicker(null)} 
        />
      )}

      {selectedSession && (
        <SessionDetail 
          session={selectedSession} 
          costs={catalog.map(c => ({ id: c.id, name: c.name, unit: c.baseUnit, unitCost: c.unitCost, currency: c.currency }))}
          settings={settings}
          onUpdateSettings={setSettings}
          onClose={() => setSelectedSession(null)} 
        />
      )}
    </div>
  );
};

export default App;