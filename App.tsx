import React, { useState } from 'react';
import { Key, Upload } from 'lucide-react';
import { processDocument } from './services/gemini';

function App() {
  const [apiKey, setApiKey] = useState('');
  const [result, setResult] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!apiKey) return alert("Por favor, ingresa tu clave API primero.");
    
    try {
      const data = await processDocument(file, apiKey);
      setResult(data);
    } catch (err) {
      alert("Error al procesar. Revisa tu clave API.");
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">EL OCR - Inteligencia Documental</h1>
      
      {/* Campo de Clave API */}
      <div className="mb-8 p-4 bg-slate-800 rounded-lg border border-slate-700">
        <label className="flex items-center gap-2 mb-2 text-sm font-medium">
          <Key size={16} /> Clave API de Gemini
        </label>
        <input 
          type="password" 
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Pega tu nueva clave aquí..."
          className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-white"
        />
      </div>

      <input type="file" onChange={handleFile} className="block w-full text-sm" />
      
      {result && (
        <pre className="mt-8 p-4 bg-black rounded overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default App;
