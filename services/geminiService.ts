
import { GoogleGenAI, Type } from "@google/genai";
import { ProductionSession, PerformanceAnalysis } from "../types";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeProductionData(sessions: ProductionSession[]): Promise<PerformanceAnalysis> {
  if (sessions.length === 0) {
    return { bottlenecks: [], suggestions: [], standardTimes: {} };
  }

  const dataSnapshot = sessions.map(s => ({
    product: s.productName,
    logs: s.activities.map(a => ({
      step: a.name,
      duration: a.durationMs / 1000 / 60, // minutes
      notes: a.notes || ''
    }))
  }));

  const prompt = `Actúa como Consultor Senior en Lean Manufacturing y Procesos de Marroquinería Artesanal. 
  Analiza el siguiente historial de tiempos de producción real (en minutos) de CHABIER:
  
  DATOS:
  ${JSON.stringify(dataSnapshot)}
  
  TAREAS DE AUDITORÍA:
  1. Identifica variabilidad excesiva entre procesos del mismo producto (identificando desperdicios 'Muda').
  2. Detecta el proceso limitante (cuello de botella) que retrasa la entrega final.
  3. Propón mejoras prácticas de 5S o herramientas específicas de marroquinería para reducir tiempos.
  4. Calcula tiempos estándar (Goal Times) basados en el promedio de mejor desempeño.
  
  IMPORTANTE: Las sugerencias deben ser breves, industriales y enfocadas en la acción.
  
  Devuelve UNICAMENTE un objeto JSON con esta estructura:
  {
    "bottlenecks": ["string", "string"],
    "suggestions": ["string", "string"],
    "standardTimes": [
      { "processName": "Nombre del proceso", "seconds": 120 }
    ]
  }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bottlenecks: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Procesos que causan retrasos significativos."
            },
            suggestions: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Acciones concretas para mejorar la eficiencia."
            },
            standardTimes: { 
              type: Type.ARRAY, 
              items: {
                type: Type.OBJECT,
                properties: {
                  processName: { type: Type.STRING },
                  seconds: { type: Type.NUMBER }
                },
                required: ["processName", "seconds"]
              },
              description: "Tiempos objetivo calculados para cada etapa."
            }
          },
          required: ["bottlenecks", "suggestions", "standardTimes"]
        }
      }
    });

    const text = response.text || '{}';
    const rawResult = JSON.parse(text);

    // Convert the array of standardTimes back to the Record<string, number> format expected by the app
    const standardTimesRecord: Record<string, number> = {};
    if (Array.isArray(rawResult.standardTimes)) {
      rawResult.standardTimes.forEach((item: { processName: string, seconds: number }) => {
        standardTimesRecord[item.processName] = item.seconds;
      });
    }

    return {
      bottlenecks: rawResult.bottlenecks || [],
      suggestions: rawResult.suggestions || [],
      standardTimes: standardTimesRecord
    };
  } catch (error) {
    console.error("Error analyzing data:", error);
    return { 
      bottlenecks: ["Error en la conexión con el motor de IA."], 
      suggestions: ["Por favor, intenta analizar de nuevo en unos momentos."], 
      standardTimes: {} 
    };
  }
}
