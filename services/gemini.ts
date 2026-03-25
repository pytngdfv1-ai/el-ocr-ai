import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Procesa documentos usando Gemini 1.5 Flash
 */
export async function processDocument(file: File, apiKey: string): Promise<any> {
  try {
    if (!apiKey) throw new Error('Clave API no configurada');

    // Conversión a Base64 más eficiente
    const base64String = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });

    const genAI = new GoogleGenerativeAI(apiKey);
    // Usamos el modelo flash para mayor velocidad
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Analiza este documento y extrae la información en formato JSON estructurado. 
                    Campos requeridos: titulo, contenido, fecha, datos_extraidos. 
                    Responde ÚNICAMENTE con el objeto JSON puro.`;

    const result = await model.generateContent([
      { inlineData: { data: base64String, mimeType: file.type } },
      { text: prompt },
    ]);

    const response = await result.response;
    let text = response.text();
    
    // Limpieza profunda de etiquetas Markdown para evitar errores de parseo
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.warn("La IA no devolvió un JSON puro, devolviendo texto plano.");
      return { contenido: text, formato: 'texto' };
    }
  } catch (error: any) {
    console.error('Error en Gemini Service:', error);
    throw new Error(error.message || 'Error desconocido');
  }
}
