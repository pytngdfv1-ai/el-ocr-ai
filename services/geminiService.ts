import { GoogleGenerativeAI } from "@google-cloud/generative-ai";

// Definimos la estructura de lo que la IA debe devolver
interface AnalysisResult {
  sender: string;
  recipient: string;
  date: string;
  docType: string;
  summary: string;
  fullText: string;
}

/**
 * Procesa un documento (Imagen o PDF) usando la API de Gemini.
 * @param file El archivo subido por el usuario.
 * @param apiKey La clave que el usuario cargó manualmente en la App.
 */
export const processDocument = async (file: File, apiKey: string): Promise<AnalysisResult> => {
  try {
    // 1. Inicializamos la IA con la clave recibida desde el componente App
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Usamos gemini-1.5-flash por ser rápido y eficiente para OCR
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 2. Convertimos el archivo a un formato que Gemini entienda (Base64)
    const base64Data = await fileToGenerativePart(file);

    // 3. El "Prompt": Instrucciones precisas para la IA
    const prompt = `
      Actúa como un experto en análisis de documentos y OCR. 
      Analiza la imagen adjunta y extrae la información en el siguiente formato JSON estricto:
      {
        "sender": "Nombre de quien envía o empresa emisora",
        "recipient": "Nombre de quien recibe el documento",
        "date": "Fecha del documento (DD/MM/AAAA)",
        "docType": "Tipo (Factura, Recibo, Mensaje de Error, Nota, etc.)",
        "summary": "Un resumen breve de 2 líneas sobre el contenido principal",
        "fullText": "Todo el texto extraído literalmente del documento"
      }
      Si no encuentras algún dato, pon "N/A". Responde solo el JSON.
    `;

    // 4. Ejecutamos la petición
    const result = await model.generateContent([prompt, base64Data]);
    const response = await result.response;
    const text = response.text();

    // 5. Limpiamos y parseamos la respuesta JSON
    // A veces la IA devuelve el JSON rodeado de ```json ... ```, así que lo limpiamos.
    const cleanJson = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson) as AnalysisResult;

  } catch (error) {
    console.error("Error detallado en Gemini Service:", error);
    throw new Error("No se pudo procesar el documento. Revisa la consola para más detalles.");
  }
};

/**
 * Función auxiliar para convertir archivos a Base64
 */
async function fileToGenerativePart(file: File) {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
