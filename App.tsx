import React, { useState } from 'react';
import { Key, Upload, Lock, FileText, Trash2 } from 'lucide-react';
import { processDocument } from './services/gemini';

function App() {
  const [pin, setPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const MASTER_PIN = "1234"; // Tu PIN de 4 dígitos

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
    alert("Clave guardada en este navegador.");
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!apiKey) return alert("Por favor, ingresa tu clave API primero.");
    
    setLoading(true);
    try {
      const data = await processDocument(file, apiKey);
      setResult(data);
    } catch (err) {
      alert("Error al procesar. Revisa tu clave API.");
    } finally {
      setLoading(false);
    }
  };

  if (!isUnlocked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 px-4">
        <form onSubmit={handlePinSubmit} className="bg-slate-800 p-8 rounded-2xl border border-slate-700 w-full max-w-sm text-center shadow-2xl">
          <Lock className="mx-auto mb-4 text-blue-500" size={48} />
          <h2 className="text-xl font-bold mb-6">Acceso Restringido</h2>
          <input 
            type="password" 
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN de 4 dígitos"
            className="w-full p-4 bg-slate-900 border border-slate-600 rounded-lg text-center text-2xl tracking-[1em] focus:border-blue-500 outline-none"
          />
          <button type="submit" className="w-full mt-6 bg-blue-600 hover:bg-blue-500 p-3 rounded-lg font-bold transition-all">Desbloquear</button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-blue-400">EL OCR AI</h1>
        <button onClick={() => setIsUnlocked(false)} className="text-slate-500 hover:text-white text-sm uppercase tracking-widest">Bloquear</button>
      </div>
      
      <div className="mb-8 p-6 bg-slate-800 rounded-xl border border-slate-700">
        <label className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-300">
          <Key size={16} /> Configuración de API Key (Gemini)
        </label>
        <div className="flex gap-2">
          <input 
            type="password" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Pega tu clave aquí..."
            className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded text-white focus:border-blue-500 outline-none"
          />
          <button onClick={saveApiKey} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded font-bold text-sm">Guardar</button>
        </div>
      </div>

      <div className="relative border-2 border-dashed border-slate-700 rounded-2xl p-12 text-center hover:border-blue-500 transition-colors group">
        <input type="file" onChange={handleFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        <Upload className="mx-auto mb-4 text-slate-500 group-hover:text-blue-500 transition-colors" size={48} />
        <p className="text-slate-400">Selecciona o arrastra una imagen para analizar</p>
      </div>

      {loading && <div className="mt-8 text-center animate-pulse text-blue-400 font-bold">Analizando documento...</div>}

      {result && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2"><FileText className="text-blue-400" /> Resultado JSON</h3>
            <button onClick={() => setResult(null)} className="text-slate-500 hover:text-red-400"><Trash2 size={18}/></button>
          </div>
          <pre className="p-6 bg-slate-950 rounded-xl border border-slate-800 overflow-auto text-blue-300 text-sm shadow-inner max-h-[400px]">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default App;
