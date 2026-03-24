import { GoogleGenerativeAI } from "@google/generative-ai";

export const processDocument = async (file: File, apiKey: string) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });

  const prompt = `Analiza este documento y extrae los datos en formato JSON estricto: 
  {"sender": "emisor", "recipient": "receptor", "date": "fecha", "docType": "tipo", "summary": "resumen"}`;

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: file.type } }
    ]);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Error en Gemini:", error);
    throw new Error("No se pudo analizar el documento. Verifica tu nueva clave API.");
  }
};
