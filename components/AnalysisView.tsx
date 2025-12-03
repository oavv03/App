import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Vote, Candidate } from '../types';
import { CANDIDATES } from '../constants';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';

interface AnalysisViewProps {
  votes: Vote[];
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ votes }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (votes.length === 0) {
      setError("No hay votos registrados para analizar.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Prepare data summary for the prompt
      const totalVotes = votes.length;
      const candidateCounts = CANDIDATES.map(c => {
        const count = votes.filter(v => v.candidateId === c.id).length;
        return `${c.name} (${c.party}): ${count} votos (${((count/totalVotes)*100).toFixed(1)}%)`;
      }).join(', ');
      
      const regionCounts = votes.reduce((acc, vote) => {
        acc[vote.region] = (acc[vote.region] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const regionSummary = Object.entries(regionCounts)
        .map(([region, count]) => `${region}: ${count} votos`)
        .join(', ');

      const prompt = `
        Actúa como un experto analista político. Analiza los siguientes datos de una elección presidencial simulada:
        
        Total de Votos: ${totalVotes}
        Resultados por Candidato: ${candidateCounts}
        Participación por Región: ${regionSummary}

        Proporciona un análisis breve (máximo 2 párrafos) en formato Markdown.
        1. Identifica al ganador actual y el margen de victoria.
        2. Menciona cualquier tendencia regional interesante si la hay.
        3. Mantén un tono neutral y profesional.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setAnalysis(response.text || "No se pudo generar el análisis.");
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al conectar con Gemini. Verifica tu API Key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-yellow-300" />
          Análisis Electoral con IA
        </h2>
        <p className="opacity-90 mb-6">
          Utiliza la inteligencia de Gemini para interpretar las tendencias de votación en tiempo real.
        </p>
        
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="bg-white text-indigo-700 font-bold py-3 px-6 rounded-lg shadow-md hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analizando datos...
            </>
          ) : (
            <>Generar Reporte</>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 rounded-r-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {analysis && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Resultados del Análisis</h3>
          <div className="prose text-gray-700 leading-relaxed">
            {/* Simple rendering of markdown-like text since we don't have a markdown parser lib installed */}
            {analysis.split('\n').map((line, i) => (
              <p key={i} className="mb-2">{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
