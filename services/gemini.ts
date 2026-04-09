import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Procesa documentos usando Gemini 1.5 Flash.
 * Esta versión no depende de archivos .env y recibe la API Key directamente del usuario.
 */
export async function processDocument(file: File, apiKey: string): Promise<any> {
  try {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('Por favor, ingresa una API Key válida en el campo superior.');
    }

    // 1. Convertir el archivo a Base64 de forma asíncrona
    const base64String = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Extraemos solo la parte de datos, quitando el prefijo "data:image/...;base64,"
        resolve(result.split(',')[1]);
      };
      reader.onerror = (error) => reject(new Error('Error al leer el archivo local.'));
      reader.readAsDataURL(file);
    });

    // 2. Inicializar el cliente con la clave proporcionada por el usuario
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 3. Obtener el modelo
    // Usamos 'gemini-1.5-flash' que es el identificador estándar y estable.
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Analiza este documento y extrae la información en formato JSON estructurado. 
                    Campos requeridos: titulo, contenido, fecha, datos_extraidos. 
                    Responde ÚNICAMENTE el objeto JSON puro, sin bloques de código Markdown ni explicaciones.`;

    // 4. Ejecutar la generación de contenido
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
    const text = response.text();
    
    // 5. Limpieza de seguridad por si la IA incluye Markdown o texto extra
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error("Respuesta inesperada de la IA:", text);
      throw new Error("La IA no devolvió un formato JSON válido.");
    }

    return JSON.parse(jsonMatch[0]);

  } catch (error: any) {
    console.error('Error detallado en Gemini Service:', error);

    // Traducción de errores comunes de Google para el usuario
    if (error.message?.includes('404')) {
      throw new Error('Error 404: El modelo no fue encontrado. Verifica que tu API Key tenga permisos para "Gemini API" en Google Cloud.');
    }
    if (error.message?.includes('API key not valid')) {
      throw new Error('La API Key ingresada no es válida. Revísala e intenta de nuevo.');
    }
    
    throw new Error(error.message || 'Ocurrió un error inesperado al procesar el documento.');
  }
}
