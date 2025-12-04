import React, { useState, useEffect } from 'react';
import { Vote, TabView } from './types';
import { CANDIDATES, REGIONS } from './constants';
import { saveVote, getVotes, clearVotes, getSheetUrl, setSheetUrl, fetchRemoteVotes } from './services/voteService';
import { VoteCard } from './components/VoteCard';
import { ResultsView } from './components/ResultsView';
import { AnalysisView } from './components/AnalysisView';
import { Vote as VoteIcon, PieChart, BarChart3, Trash2, CheckCircle, Settings, X, Copy, ExternalLink, Save, Cloud, CloudOff, RefreshCw, Share2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabView>('vote');
  const [votes, setVotes] = useState<Vote[]>([]);
  
  // Form State
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string>(REGIONS[0].id);
  
  // Toasts State
  const [toastMsg, setToastMsg] = useState<{show: boolean, msg: string, type: 'success' | 'info'}>({ show: false, msg: '', type: 'success' });

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sheetUrlInput, setSheetUrlInput] = useState('');
  const [isCloudConfigured, setIsCloudConfigured] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load initial local data
  useEffect(() => {
    setVotes(getVotes());
    const url = getSheetUrl();
    setSheetUrlInput(url);
    setIsCloudConfigured(!!url);
  }, []);

  // Polling Effect: Fetch data every 2 seconds if cloud is configured
  useEffect(() => {
    if (!isCloudConfigured) return;

    const fetchData = async () => {
      // Don't show loading spinner on background polls to avoid UI flickering
      const cloudVotes = await fetchRemoteVotes();
      // Strict check: if cloudVotes is not null (even if it is empty []), we update state
      if (cloudVotes !== null) {
        setVotes(cloudVotes);
      }
    };

    // Initial fetch
    fetchData();

    // Loop (2 seconds for better real-time feel)
    const intervalId = setInterval(fetchData, 2000);

    return () => clearInterval(intervalId);
  }, [isCloudConfigured]);

  // Effect: Force fetch when switching to Results tab to ensure fresh Sheet data
  useEffect(() => {
    if (activeTab === 'results' && isCloudConfigured) {
      setIsSyncing(true);
      fetchRemoteVotes().then(data => {
        if (data !== null) setVotes(data);
        setIsSyncing(false);
      });
    }
  }, [activeTab, isCloudConfigured]);

  const showToast = (msg: string, type: 'success' | 'info' = 'success') => {
    setToastMsg({ show: true, msg, type });
    setTimeout(() => setToastMsg(prev => ({ ...prev, show: false })), 3000);
  };

  const handleVoteSubmit = async () => {
    if (!selectedCandidateId) return;
    setIsSubmitting(true);

    const newVote: Vote = {
      id: crypto.randomUUID(),
      candidateId: selectedCandidateId,
      region: selectedRegionId,
      timestamp: Date.now(),
    };

    try {
      if (isCloudConfigured) {
        // MODO NUBE: Flujo estricto (Enviar -> Sheet -> Esperar -> Descargar -> Actualizar UI)
        showToast('Enviando a la nube...', 'info');
        
        // 1. Enviar al Sheet
        await saveVote(newVote);
        
        // 2. ESPERAR: Google Sheets tarda ~1-2 segundos en indexar la nueva fila.
        await new Promise(resolve => setTimeout(resolve, 1500));

        // 3. Descargar datos frescos del Sheet para actualizar Resultados
        const cloudVotes = await fetchRemoteVotes();
        
        if (cloudVotes !== null) {
          setVotes(cloudVotes);
          showToast('Voto sincronizado con éxito');
        } else {
          // Fallback solo si falla la descarga
          setVotes(prev => [...prev, newVote]);
          showToast('Voto enviado (actualizando visualización...)', 'info');
        }
      } else {
        // MODO LOCAL: Actualización inmediata
        setVotes(prev => [...prev, newVote]);
        await saveVote(newVote);
        showToast('Voto Registrado (Local)');
      }
      
      setSelectedCandidateId(null);
    } catch (error) {
      console.error(error);
      showToast('Error al registrar voto', 'info');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearData = () => {
    if (confirm('¿Estás seguro de borrar los votos LOCALES? Si tienes la nube conectada, los datos volverán a aparecer en la siguiente sincronización.')) {
      clearVotes();
      setVotes([]);
    }
  };

  const handleSaveSettings = () => {
    setSheetUrl(sheetUrlInput);
    setIsCloudConfigured(!!sheetUrlInput);
    setIsSettingsOpen(false);
    
    // Trigger immediate check
    if(sheetUrlInput) {
      setIsSyncing(true);
      fetchRemoteVotes().then(data => {
        if(data !== null) setVotes(data);
        setIsSyncing(false);
      });
    }
    
    showToast('Conexión configurada', 'info');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Enlace copiado al portapapeles', 'info');
  };

  const Navbar = () => (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <VoteIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight hidden sm:block">VotoDirecto</span>
            <span className="text-xl font-bold text-gray-900 tracking-tight sm:hidden">VotoD</span>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-8 items-center">
            <button 
              onClick={() => setActiveTab('vote')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'vote' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Registro
            </button>
            <button 
              onClick={() => setActiveTab('results')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'results' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Resultados
            </button>
            <button 
              onClick={() => setActiveTab('analysis')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'analysis' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-900'}`}
            >
              IA Análisis
            </button>
          </div>

          <div className="flex items-center gap-2">
             {isCloudConfigured && (
               <div className={`transition-opacity duration-500 ${isSyncing ? 'opacity-100' : 'opacity-0'}`}>
                 <RefreshCw size={14} className="text-gray-400 animate-spin" />
               </div>
             )}
             
             <button 
               onClick={() => setIsSettingsOpen(true)}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                 isCloudConfigured 
                   ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                   : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
               }`}
               title={isCloudConfigured ? "Sincronización activa (2s)" : "Configurar Google Sheets"}
             >
               {isCloudConfigured ? <Cloud size={16} /> : <CloudOff size={16} />}
               <span className="hidden sm:inline">{isCloudConfigured ? 'En Línea' : 'Offline'}</span>
             </button>

             <button
                onClick={handleShare}
                className="text-gray-500 hover:text-indigo-600 transition-colors p-2 rounded-full hover:bg-indigo-50"
                title="Compartir enlace de la App"
             >
               <Share2 size={20} />
             </button>

             <button 
               onClick={handleClearData}
               className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
               title="Limpiar caché local"
             >
               <Trash2 size={20} />
             </button>
          </div>
        </div>
      </div>
    </nav>
  );

  const MobileNav = () => (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-40">
      <div className="flex justify-around items-center h-16">
        <button 
          onClick={() => setActiveTab('vote')}
          className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'vote' ? 'text-indigo-600' : 'text-gray-400'}`}
        >
          <VoteIcon size={24} />
          <span className="text-xs mt-1 font-medium">Votar</span>
        </button>
        <button 
          onClick={() => setActiveTab('results')}
          className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'results' ? 'text-indigo-600' : 'text-gray-400'}`}
        >
          <BarChart3 size={24} />
          <span className="text-xs mt-1 font-medium">Resultados</span>
        </button>
        <button 
          onClick={() => setActiveTab('analysis')}
          className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'analysis' ? 'text-indigo-600' : 'text-gray-400'}`}
        >
          <PieChart size={24} />
          <span className="text-xs mt-1 font-medium">Análisis</span>
        </button>
      </div>
    </div>
  );

  const SettingsModal = () => {
    if (!isSettingsOpen) return null;

    // SCRIPT ACTUALIZADO PARA MANEJAR HOJAS VACÍAS
    const scriptCode = `function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([data.id, data.candidateId, data.region, new Date(data.timestamp)]);
  return ContentService.createTextOutput("Success");
}

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // CORRECCIÓN IMPORTANTE: Si la hoja está vacía, devuelve array vacío
  if (sheet.getLastRow() === 0) {
    return ContentService.createTextOutput("[]")
      .setMimeType(ContentService.MimeType.JSON);
  }

  var rows = sheet.getDataRange().getValues();
  var votes = [];
  
  // Asumimos que no hay encabezados, o si los hay, filtraremos datos inválidos
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    if (row[0] && row[1]) { // Validación básica
      votes.push({
        id: row[0],
        candidateId: row[1],
        region: row[2],
        timestamp: new Date(row[3]).getTime()
      });
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify(votes))
    .setMimeType(ContentService.MimeType.JSON);
}`;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="text-indigo-600" />
              Conectar Google Sheets (Tiempo Real)
            </h2>
            <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                URL del Script de Google (Web App URL)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sheetUrlInput}
                  onChange={(e) => setSheetUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/..."
                  className="flex-1 rounded-lg border-gray-300 border p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
                <button 
                  onClick={handleSaveSettings}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-medium"
                >
                  <Save size={18} />
                  Guardar
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Configura esto en cada dispositivo o comparte el enlace después de guardar.
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <h3 className="text-blue-900 font-bold mb-2 flex items-center gap-2">
                <ExternalLink size={16} />
                Guía Rápida (¡ACTUALIZAR CÓDIGO!)
              </h3>
              <p className="text-sm text-blue-800 mb-2">
                Si tenías problemas al borrar datos, <strong>vuelve a copiar este código</strong> en Apps Script:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                <li>En tu Google Sheet: <strong>Extensiones</strong> {'>'} <strong>Apps Script</strong>.</li>
                <li>Copia y pega este código (borrando todo lo anterior):</li>
              </ol>

              <div className="relative mt-3 mb-3">
                <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto font-mono">
                  {scriptCode}
                </pre>
                <button 
                  onClick={() => navigator.clipboard.writeText(scriptCode)}
                  className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
                  title="Copiar código"
                >
                  <Copy size={14} />
                </button>
              </div>

              <ol start={3} className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                <li>Botón azul <strong>Implementar</strong> {'>'} <strong>Nueva implementación</strong>.</li>
                <li><strong>IMPORTANTE:</strong> En "Quién puede acceder", selecciona <strong>"Cualquier usuario" (Anyone)</strong>.</li>
                <li>Dale a "Implementar" (o "Actualizar"), copia la URL y pégala arriba.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'vote':
        return (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Registrar Voto</h1>
              <p className="text-gray-500">
                {isCloudConfigured 
                  ? "Modo Online: Tu voto se guardará directamente en la Hoja." 
                  : "Modo Local: Configura la nube para compartir datos."}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-24">
              {/* Region Selector */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Provincia / Región
                </label>
                <select
                  value={selectedRegionId}
                  onChange={(e) => setSelectedRegionId(e.target.value)}
                  className="w-full rounded-lg border-gray-300 border p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
                >
                  {REGIONS.map(region => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Candidates Grid */}
              <div className="grid grid-cols-1 gap-4 mb-8">
                {CANDIDATES.map(candidate => (
                  <VoteCard
                    key={candidate.id}
                    candidate={candidate}
                    selected={selectedCandidateId === candidate.id}
                    onSelect={setSelectedCandidateId}
                  />
                ))}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleVoteSubmit}
                disabled={!selectedCandidateId || isSubmitting}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 ${
                  selectedCandidateId && !isSubmitting
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-xl'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Enviando y Sincronizando...' : 'Confirmar Voto'}
              </button>
            </div>
          </div>
        );
      case 'results':
        return (
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">Resultados en Vivo</h1>
                {isCloudConfigured && (
                  <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${isSyncing ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'}`}>
                    {isSyncing ? <><RefreshCw size={10} className="animate-spin"/> Sincronizando</> : '● En Directo'}
                  </span>
                )}
              </div>
              <p className="text-gray-500">
                {isCloudConfigured 
                  ? "Visualizando datos directamente de Google Sheets (Dependencia Total)." 
                  : "Viendo datos locales. Conecta la nube para ver datos globales."}
              </p>
            </div>
            <ResultsView votes={votes} />
          </div>
        );
      case 'analysis':
        return (
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Inteligencia Artificial</h1>
              <p className="text-gray-500">Insights profundos generados por Gemini sobre la elección.</p>
            </div>
            <AnalysisView votes={votes} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-safe">
      <Navbar />
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        {renderContent()}
      </main>
      
      {/* Universal Toast */}
      {toastMsg.show && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className={`${toastMsg.type === 'info' ? 'bg-indigo-600' : 'bg-green-600'} text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2`}>
            {toastMsg.type === 'success' ? <CheckCircle size={20} /> : <Share2 size={20} />}
            <span className="font-semibold">{toastMsg.msg}</span>
          </div>
        </div>
      )}

      <SettingsModal />
      <MobileNav />
    </div>
  );
}