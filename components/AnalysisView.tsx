
import React, { useState, useEffect, useMemo } from 'react';
import { ProductionSession, PerformanceAnalysis } from '../types';
import { analyzeProductionData } from '../services/geminiService';
import { Brain, TrendingUp, AlertTriangle, CheckCircle2, Loader2, Filter, Info, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AnalysisViewProps {
  sessions: ProductionSession[];
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ sessions }) => {
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [analysis, setAnalysis] = useState<PerformanceAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  // Obtener lista única de productos fabricados
  const uniqueProducts = useMemo(() => {
    const products = sessions.map(s => s.productName);
    return Array.from(new Set(products)).sort();
  }, [sessions]);

  // Filtrar sesiones por el producto seleccionado
  const filteredSessions = useMemo(() => {
    if (selectedProduct === 'all') return sessions;
    return sessions.filter(s => s.productName === selectedProduct);
  }, [sessions, selectedProduct]);

  // Confiabilidad basada en N
  const reliability = useMemo(() => {
    const n = filteredSessions.length;
    if (n === 0) return { label: 'Sin datos', color: 'text-stone-600' };
    if (n < 3) return { label: 'Baja Confiabilidad (N<3)', color: 'text-red-500' };
    if (n < 10) return { label: 'Media Confiabilidad (Muestra estable)', color: 'text-orange-500' };
    return { label: 'Alta Confiabilidad (Estándar robusto)', color: 'text-green-500' };
  }, [filteredSessions]);

  useEffect(() => {
    const runAnalysis = async () => {
      if (filteredSessions.length === 0) return;
      setLoading(true);
      const result = await analyzeProductionData(filteredSessions);
      setAnalysis(result);
      setLoading(false);
    };
    runAnalysis();
  }, [filteredSessions]);

  if (sessions.length === 0) return (
    <div className="text-center py-20 opacity-50">
      <p className="italic">Registra al menos una sesión para habilitar el Auditor Lean.</p>
    </div>
  );

  // Preparar datos para el gráfico
  const stepStats: Record<string, { totalMs: number, count: number, name: string }> = {};
  filteredSessions.forEach(session => {
    session.activities.forEach(activity => {
      const stepName = activity.name || 'Proceso sin nombre';
      const stepId = stepName.toLowerCase().trim();
      if (!stepStats[stepId]) stepStats[stepId] = { totalMs: 0, count: 0, name: stepName };
      stepStats[stepId].totalMs += activity.durationMs;
      stepStats[stepId].count += 1;
    });
  });

  const chartData = Object.entries(stepStats).map(([_, stat]) => ({
    name: stat.name,
    avgMin: Number((stat.totalMs / stat.count / 60000).toFixed(2)),
  })).sort((a, b) => b.avgMin - a.avgMin);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      
      {/* Filtros de Análisis */}
      <div className="bg-stone-900 border border-stone-800 p-6 rounded-[2rem] shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Filter size={18} className="text-orange-500" />
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Filtro de Segmentación</h2>
          </div>
          <select 
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full sm:w-64 bg-stone-800 border border-stone-700 rounded-xl px-4 py-2 text-xs font-bold text-stone-200 outline-none focus:ring-1 focus:ring-orange-600 transition-all"
          >
            <option value="all">TODOS LOS PRODUCTOS</option>
            {uniqueProducts.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 px-1">
          <Info size={12} className={reliability.color} />
          <span className={`text-[10px] font-black uppercase tracking-tighter ${reliability.color}`}>
            {reliability.label}
          </span>
        </div>
      </div>

      {/* Auditor Lean Card */}
      <div className="bg-stone-900 border border-stone-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute -top-10 -right-10 bg-orange-600/5 w-40 h-40 rounded-full blur-3xl group-hover:bg-orange-600/10 transition-all duration-1000" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-orange-600/10 rounded-xl flex items-center justify-center text-orange-500">
              <Brain size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white serif">Auditoría por Segmento</h2>
              <p className="text-[10px] text-stone-500 font-black uppercase tracking-widest">
                {selectedProduct === 'all' ? 'Vista Global de Fábrica' : `Análisis: ${selectedProduct}`}
              </p>
            </div>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin text-orange-500 mb-4" size={32} />
              <p className="text-stone-400 text-xs italic">Consultando patrones industriales con la IA...</p>
            </div>
          ) : analysis ? (
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="text-red-500" size={16} />
                    <p className="text-[10px] uppercase text-stone-400 font-black tracking-widest">Cuellos de Botella</p>
                  </div>
                  <div className="space-y-3">
                    {analysis.bottlenecks.map((b, i) => (
                      <div key={i} className="bg-red-500/5 border border-red-500/10 p-3 rounded-xl text-xs text-stone-200">
                        • {b}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="text-green-500" size={16} />
                    <p className="text-[10px] uppercase text-stone-400 font-black tracking-widest">Oportunidades Lean</p>
                  </div>
                  <div className="space-y-3">
                    {analysis.suggestions.map((s, i) => (
                      <div key={i} className="bg-green-500/5 border border-green-500/10 p-3 rounded-xl text-xs text-stone-200">
                        • {s}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 border border-stone-800 border-dashed rounded-3xl">
               <p className="text-stone-600 text-sm italic">Data insuficiente para generar reporte inteligente.</p>
            </div>
          )}
        </div>
      </div>

      {/* Gráfico de Tiempos Promedio */}
      <div className="bg-stone-900 border border-stone-800 p-8 rounded-[2.5rem] shadow-xl">
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 className="text-stone-500" size={20} />
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Tiempos Promedio (Minutos)</h3>
        </div>
        
        <div className="h-80 w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-stone-700 italic text-sm">Sin datos para graficar</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 30, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#1c1917" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={120} 
                  tick={{ fontSize: 9, fill: '#78716c', fontWeight: 'bold' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: '#ea580c0a' }}
                  contentStyle={{ 
                    backgroundColor: '#1c1917', 
                    borderRadius: '16px', 
                    border: '1px solid #292524', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
                    fontSize: '11px'
                  }}
                  itemStyle={{ color: '#ea580c', fontWeight: 'bold' }}
                />
                <Bar dataKey="avgMin" radius={[0, 8, 8, 0]} barSize={32}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#ea580c' : '#44403c'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
