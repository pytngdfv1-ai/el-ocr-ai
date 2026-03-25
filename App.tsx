import React, { useState } from 'react';
import { Key, Upload, Lock, FileText, Trash2, LogOut } from 'lucide-react';
import { processDocument } from './services/gemini';

function App() {
  const [pin, setPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const MASTER_PIN = "1234"; 

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === MASTER_PIN) {
      setIsUnlocked(true);
    } else {
      alert("PIN incorrecto");
      setPin('');
    }
  };

  const saveApiKey = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    alert("Configuración guardada correctamente.");
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!apiKey) return alert("Ingresa tu API Key de Google AI Studio.");
    
    setLoading(true);
    setResult(null); // Limpiar resultado previo
    try {
      const data = await processDocument(file, apiKey);
      setResult(data);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isUnlocked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 px-4">
        <form onSubmit={handlePinSubmit} className="bg-slate-900 p-8 rounded-3xl border border-slate-800 w-full max-w-sm text-center shadow-2xl">
          <div className="bg-blue-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="text-blue-500" size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-6 text-white">Acceso EL OCR</h2>
          <input 
            type="password" 
            maxLength={4}
            value={pin}
            autoFocus
            onChange={(e) => setPin(e.target.value)}
            placeholder="****"
            className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-center text-3xl tracking-[0.5em] focus:border-blue-500 outline-none text-white transition-all"
          />
          <button type="submit" className="w-full mt-8 bg-blue-600 hover:bg-blue-500 p-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-blue-900/20">Desbloquear</button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 max-w-4xl mx-auto min-h-screen">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-black text-blue-500 tracking-tight">EL OCR AI</h1>
          <p className="text-slate-500 text-sm">Inteligencia Documental v1.2</p>
        </div>
        <button onClick={() => setIsUnlocked(false)} className="p-2 text-slate-400 hover:text-red-400 transition-colors">
          <LogOut size={24} />
        </button>
      </header>
      
      <div className="grid md:grid-cols-1 gap-8">
        <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl">
          <label className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-400 uppercase tracking-wider">
            <Key size={16} /> Gemini API Key
          </label>
          <div className="flex gap-3">
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="flex-1 p-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-blue-500 outline-none"
            />
            <button onClick={saveApiKey} className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold transition-all">Guardar</button>
          </div>
        </div>

        <div className="relative border-2 border-dashed border-slate-800 rounded-3xl p-16 text-center hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group">
          <input type="file" onChange={handleFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          <Upload className="mx-auto mb-4 text-slate-600 group-hover:text-blue-500 transition-colors" size={64} />
          <p className="text-slate-400 font-medium">Arrastra tu documento o haz clic aquí</p>
          <p className="text-slate-600 text-xs mt-2 italic">Formatos soportados: JPG, PNG, WEBP</p>
        </div>

        {loading && (
          <div className="py-10 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-blue-400 font-medium animate-pulse">Procesando con Inteligencia Artificial...</p>
          </div>
        )}

        {result && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                <FileText className="text-blue-500" /> Resultado del Análisis
              </h3>
              <button onClick={() => setResult(null)} className="text-slate-500 hover:text-red-400 transition-colors">
                <Trash2 size={20}/>
              </button>
            </div>
            <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl">
              <pre className="overflow-auto text-blue-400 text-sm font-mono leading-relaxed max-h-[500px] custom-scrollbar">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
