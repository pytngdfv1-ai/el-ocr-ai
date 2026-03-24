import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Procesa documentos/imágenes usando Google Generative AI (Gemini)
 * @param file - El archivo de imagen a procesar
 * @param apiKey - La clave API de Gemini del usuario
 * @returns Objeto JSON con los datos extraídos del documento
 */
export async function processDocument(file: File, apiKey: string): Promise<any> {
  try {
    // Validar que tenemos la clave API
    if (!apiKey) {
      throw new Error('Clave API de Gemini no configurada');
    }

    // Convertir el archivo a base64
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64String = btoa(binary);

    // Determinar el tipo MIME del archivo
    const mimeType = file.type || 'image/jpeg';

    // Inicializar cliente de Gemini con la clave API del usuario
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Enviar la imagen a Gemini para análisis OCR/documental
    const response = await model.generateContent([
      {
        inlineData: {
          data: base64String,
          mimeType: mimeType,
        },
      },
      {
        text: `Analiza este documento de forma detallada y extrae toda la información importante. 
        Devuelve los resultados en formato JSON estructurado con campos como:
        - titulo: El título o tipo de documento
        - contenido: El contenido principal
        - datos_extraidos: Datos específicos encontrados
        - fecha: Si la hay
        - otros_datos: Cualquier otra información relevante
        
        Responde SOLO con el JSON, sin explicaciones adicionales.`,
      },
    ]);

    // Procesar la respuesta
    const textResponse = response.response.text();
    
    // Intentar parsear como JSON
    try {
      return JSON.parse(textResponse);
    } catch {
      // Si no es JSON válido, devolver como objeto
      return {
        contenido: textResponse,
        formato: 'texto',
      };
    }
  } catch (error: any) {
    console.error('Error al procesar documento:', error);
    throw new Error(`Error al procesar: ${error.message}`);
  }
}