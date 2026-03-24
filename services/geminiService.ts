// Cambia esto si el anterior te daba error en la compilación
import { GoogleGenerativeAI } from "@google/generative-ai"; 

interface AnalysisResult {
  sender: string;
  recipient: string;
  date: string;
  docType: string;
  summary: string;
  fullText: string;
}

export const processDocument = async (file: File, apiKey: string): Promise<AnalysisResult> => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const base64Data = await fileToGenerativePart(file);

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

    const result = await model.generateContent([prompt, base64Data]);
    const response = await result.response;
    const text = response.text();

    // Limpieza robusta del JSON por si la IA agrega texto extra
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const cleanJson = jsonMatch ? jsonMatch[0] : text;
    
    return JSON.parse(cleanJson) as AnalysisResult;

  } catch (error) {
    console.error("Error en Gemini Service:", error);
    throw error;
  }
};

async function fileToGenerativePart(file: File) {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: { data: base64String, mimeType: file.type },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
