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

    const prompt = `Analiza la imagen y extrae la información en JSON estricto:
      {
        "sender": "Emisor",
        "recipient": "Receptor",
        "date": "DD/MM/AAAA",
        "docType": "Tipo de documento",
        "summary": "Resumen breve",
        "fullText": "Texto completo"
      }`;

    const result = await model.generateContent([prompt, base64Data]);
    const response = await result.response;
    const text = response.text();

    // Limpieza de posibles etiquetas markdown
    const cleanJson = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson) as AnalysisResult;

  } catch (error) {
    console.error("Error en Gemini Service:", error);
    throw new Error("Error al procesar el documento.");
  }
};

async function fileToGenerativePart(file: File) {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({ inlineData: { data: base64String, mimeType: file.type } });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
