import React, { useState, useEffect } from 'react';
import { Camera, FileText, Moon, Sun, Lock, Key, Upload, LogOut } from 'lucide-react';
import { processDocument } from './services/gemini'; // Asegúrate que esta ruta sea correcta en tu proyecto

// Definición de tipos para el estado
interface AnalysisResult {
  sender: string;
  recipient: string;
  date: string;
  docType: string;
  summary: string;
  fullText: string;
}

const App: React.FC = () => {
  // --- ESTADOS DE SEGURIDAD ---
  const [apiKey, setApiKey] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [inputKey, setInputKey] = useState<string>("");
  const [showKey, setShowKey] = useState<boolean>(false);

  // --- ESTADOS DE LA APP ---
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Efecto para el tema oscuro
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // --- LÓGICA DE CARGA DE CLAVE ---
  
  // Opción 1: Pegar clave manualmente
  const handleLogin = () => {
    if (inputKey.trim().startsWith("AIza")) {
      setApiKey(inputKey.trim());
      setIsAuthenticated(true);
    } else {
      alert("La clave no parece válida. Debe empezar con 'AIza'.");
    }
  };

  // Opción 2: Cargar desde archivo .txt
  const handleFileKey = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content.trim().startsWith("AIza")) {
          setApiKey(content.trim());
          setIsAuthenticated(true);
        } else {
          alert("El archivo no contiene una clave de Gemini válida.");
        }
      };
      reader.readAsText(file);
    }
  };

  // --- LÓGICA DE PROCESAMIENTO ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      // Pasamos la apiKey que está en memoria al servicio
      const data = await processDocument(file, apiKey);
      setResult(data);
    } catch (error) {
      console.error("Error:", error);
      alert("Error al analizar el documento. Verifica tu clave.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- VISTA 1: PANTALLA DE BLOQUEO (SEGURIDAD) ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md w-full">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-500/20 p-4 rounded-full">
              <Lock className="text-blue-500 w-10 h-10" />
            </div>
          </div>
          <h1 className="text-white text-2xl font-bold text-center mb-2">EL OCR - Acceso</h1>
          <p className="text-slate-400 text-center text-sm mb-8">La clave API no está guardada en el servidor. Cárgala para continuar.</p>

          <div className="space-y-4">
            <div>
              <label className="text-slate-300 text-xs font-semibold uppercase mb-2 block">Pegar API Key</label>
              <div className="relative">
                <input 
                  type={showKey ? "text" : "password"}
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="AIzaSy..."
                />
                <button 
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-3 text-slate-500"
                >
                  <Key size={18} />
                </button>
              </div>
            </div>

            <button 
              onClick={handleLogin}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition duration-200 shadow-lg shadow-blue-900/20"
            >
              Iniciar Sesión
            </button>

            <div className="relative flex py-3 items-center">
              <div className="flex-grow border-t border-slate-700"></div>
              <span className="flex-shrink mx-4 text-slate-500 text-[10px] uppercase">O carga un archivo</span>
              <div className="flex-grow border-t border-slate-700"></div>
            </div>

            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:bg-slate-700/50 transition">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="text-slate-500 w-6 h-6 mb-2" />
                <p className="text-xs text-slate-400">Selecciona tu archivo <span className="font-bold">.txt</span></p>
              </div>
              <input type="file" className="hidden" accept=".txt" onChange={handleFileKey} />
            </label>
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA 2: APLICACIÓN PRINCIPAL ---
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <nav className="border-b border-slate-700/50 p-4 flex justify-between items-center bg-slate-800/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <FileText className="text-blue-500 w-8 h-8" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">EL OCR</h1>
            <p className="text-[10px] text-slate-400">Sesión Protegida en Memoria</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 hover:bg-slate-700 rounded-full transition">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={() => { setIsAuthenticated(false); setApiKey(""); }} 
            className="flex items-center gap-2 bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition text-sm font-medium"
          >
            <LogOut size={16} /> Salir
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        {!result ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-700 rounded-3xl bg-slate-800/30">
            <div className="bg-blue-500/10 p-6 rounded-full mb-4">
              <Upload className="text-blue-500 w-12 h-12 animate-pulse" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Sube un documento</h2>
            <p className="text-slate-400 mb-8">La IA analizará el contenido usando tu clave segura.</p>
            <input 
              type="file" 
              id="doc-upload" 
              className="hidden" 
              onChange={handleFileUpload}
              accept="image/*,application/pdf"
            />
            <label 
              htmlFor="doc-upload"
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold cursor-pointer transition transform hover:scale-105 shadow-xl shadow-blue-900/40"
            >
              {isAnalyzing ? "Analizando..." : "Seleccionar Archivo"}
            </label>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Aquí va tu lógica de visualización de resultados (el componente que ya tenías) */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
               <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                 <Camera size={18} className="text-blue-400"/> Datos Extraídos
               </h3>
               <div className="space-y-3">
                 <p><span className="text-slate-400 text-sm block">Remitente:</span> {result.sender}</p>
                 <p><span className="text-slate-400 text-sm block">Tipo:</span> {result.docType}</p>
                 <p><span className="text-slate-400 text-sm block">Resumen:</span> {result.summary}</p>
               </div>
               <button 
                onClick={() => setResult(null)}
                className="mt-8 text-blue-400 text-sm font-medium hover:underline"
               >
                 ← Analizar otro documento
               </button>
            </div>
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700 overflow-y-auto max-h-[500px]">
               <h3 className="text-lg font-bold mb-4">Texto Completo (OCR)</h3>
               <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                 {result.fullText}
               </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
