import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Procesa documentos usando Gemini 1.5 Flash.
 * Recibe la API Key directamente desde la interfaz del usuario.
 */
export async function processDocument(file: File, apiKey: string): Promise<any> {
  try {
    if (!apiKey) throw new Error('Por favor, ingresa tu Gemini API Key.');

    // Conversión del archivo a Base64
    const base64String = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = () => reject(new Error('Error al leer el archivo.'));
      reader.readAsDataURL(file);
    });

    // Inicialización del cliente con la clave del usuario
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // IMPORTANTE: Usamos el nombre exacto del modelo. 
    // Si sigue fallando, prueba cambiarlo a 'gemini-1.5-flash-latest'
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Analiza este documento y extrae la información en formato JSON estructurado. 
                    Campos requeridos: titulo, contenido, fecha, datos_extraidos. 
                    Responde ÚNICAMENTE el objeto JSON puro.`;

    const result = await model.generateContent([
      { inlineData: { data: base64String, mimeType: file.type } },
      { text: prompt },
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Limpieza de posibles etiquetas Markdown en la respuesta
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(cleanJson);

  } catch (error: any) {
    console.error('Error detallado:', error);
    
    // Traducción de errores comunes para el usuario final
    if (error.message?.includes('404')) {
      throw new Error('Error 404: Modelo no encontrado. Revisa si la "Gemini API" está habilitada en tu Google Cloud Console.');
    }
    
    throw new Error(error.message || 'Error desconocido al procesar el documento.');
  }
}
