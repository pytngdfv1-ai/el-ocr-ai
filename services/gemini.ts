import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Procesa documentos usando Gemini 1.5 Flash
 */
export async function processDocument(file: File, apiKey: string): Promise<any> {
  try {
    if (!apiKey) throw new Error('Clave API no configurada');

    const base64String = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // CAMBIO CLAVE: Usamos 'gemini-1.5-flash-latest' para asegurar que encuentre el endpoint
    // Si persiste el 404, prueba con 'gemini-pro-vision' (aunque flash es mejor para OCR)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    // Mejoramos el prompt para forzar el formato JSON sin basura
    const prompt = `Analiza este documento y extrae la información en formato JSON estructurado. 
                    Campos requeridos: titulo, contenido, fecha, datos_extraidos. 
                    Responde exclusivamente con el objeto JSON, sin explicaciones ni markdown.`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      },
      { text: prompt },
    ]);

    const response = await result.response;
    let text = response.text();
    
    // Limpieza robusta: busca el primer '{' y el último '}' para ignorar cualquier texto extra
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error("No se pudo encontrar un formato JSON válido en la respuesta");

  } catch (error: any) {
    // Si el error es 404, imprimimos un consejo extra en la consola
    if (error.message?.includes('404')) {
      console.error('ERROR 404: El modelo no fue encontrado. Revisa si el nombre es correcto o si tu API Key tiene permisos para este modelo.');
    }
    throw error;
  }
}
