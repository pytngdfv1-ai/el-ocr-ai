import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Procesa documentos usando Gemini 1.5 Flash.
 * Versión optimizada para evitar errores 404 y v1beta en despliegues web (GitHub Pages).
 */
export async function processDocument(file: File, apiKey: string): Promise<any> {
  try {
    if (!apiKey) throw new Error('Clave API no configurada');

    // 1. Conversión de archivo a Base64
    const base64String = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });

    // 2. Inicialización del cliente
    // Nota: El SDK maneja internamente la versión, pero aseguramos compatibilidad
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 3. Selección del modelo
    // Usamos 'gemini-1.5-flash' sin sufijos para máxima estabilidad en el Tier Gratuito
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
    });

    const prompt = `Analiza este documento y extrae la información en formato JSON estructurado. 
                    Campos requeridos: titulo, contenido, fecha, datos_extraidos. 
                    Responde ÚNICAMENTE el objeto JSON puro, sin bloques de código Markdown ni texto adicional.`;

    // 4. Llamada a la API
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
    
    // 5. Limpieza y validación del JSON
    // Buscamos el primer '{' y el último '}' para ignorar cualquier texto que la IA añada por error
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error("Respuesta cruda de la IA:", text);
      throw new Error("La IA no devolvió un formato JSON válido.");
    }

    try {
      return JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Error al parsear JSON:", text);
      return { 
        titulo: "Error de formato", 
        contenido: text, 
        formato: 'texto_plano' 
      };
    }

  } catch (error: any) {
    console.error('Error en Gemini Service:', error);
    
    // Manejo específico del error 404 (Modelo no encontrado / v1beta mismatch)
    if (error.message?.includes('404')) {
      throw new Error('Error 404: El modelo Gemini 1.5 Flash no está disponible para esta API Key o región. Verifica que la API esté habilitada en Google Cloud.');
    }
    
    throw new Error(error.message || 'Error desconocido al procesar el documento');
  }
}
