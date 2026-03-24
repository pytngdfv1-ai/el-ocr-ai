import { GoogleGenerativeAI } from "@google/generative-ai";

export const processDocument = async (file: File, apiKey: string) => {
  if (!apiKey) throw new Error("API Key requerida");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });

  const prompt = `Analiza este documento y extrae la información en un formato JSON estructurado. 
                  Busca datos como: fecha, emisor, montos, y un resumen del contenido.`;

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: base64Data, mimeType: file.type } }
  ]);

  const response = await result.response;
  const text = response.text().replace(/```json|```/g, "").trim();
  return JSON.parse(text);
};
