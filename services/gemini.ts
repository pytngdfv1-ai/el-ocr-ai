import { GoogleGenerativeAI } from '@google/generative-ai';

export async function processDocument(file: File, apiKey: string): Promise<any> {
  try {
    if (!apiKey) throw new Error('Clave API no configurada');

    const base64String = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Cambiamos a este nombre específico que suele resolver el error 404 en Web SDK
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash' 
    });

    const prompt = `Analiza este documento y extrae la información en formato JSON estructurado. 
                    Campos requeridos: titulo, contenido, fecha, datos_extraidos. 
                    Responde ÚNICAMENTE el objeto JSON puro, sin bloques de código Markdown.`;

    const result = await model.generateContent([
      { inlineData: { data: base64String, mimeType: file.type } },
      { text: prompt },
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Buscamos el JSON real por si la IA añade texto extra
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No se detectó un formato JSON válido");

    return JSON.parse(match[0]);

  } catch (error: any) {
    console.error('Error detallado:', error);
    // Si sigue dando 404, el problema suele ser que la API Key no tiene habilitado 
    // el "Generative Language API" en el Google Cloud Console.
    throw new Error(error.message || 'Error en el servicio de IA');
  }
}
