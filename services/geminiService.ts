import { GoogleGenAI, Type } from "@google/genai";
import { DocumentMetadata, QnaItem } from '../types';

// @ts-ignore
if (!window.GEMINI_API_KEY || window.GEMINI_API_KEY === "TU_API_KEY_AQUI") {
  throw new Error("API_KEY de Google Gemini no está configurada. Por favor, edita el archivo 'config.js' y añade tu clave de API.");
}

// @ts-ignore
const ai = new GoogleGenAI({ apiKey: window.GEMINI_API_KEY });

const metadataSchema = {
  type: Type.OBJECT,
  properties: {
    fecha: {
      type: Type.STRING,
      description: "La fecha del documento en formato AAAA-MM-DD. Si no se encuentra, el valor debe ser null.",
    },
    remitente: {
      type: Type.STRING,
      description: "La persona o entidad que envía o crea el documento. Si no se encuentra, poner 'Desconocido'.",
    },
    destinatario: {
        type: Type.STRING,
        description: "La persona o entidad a la que se dirige el documento (destinatario). Si no se encuentra, poner 'N/A'."
    },
    tipoDocumento: {
        type: Type.STRING,
        description: "El tipo de documento (e.g., 'Factura', 'Contrato', 'Informe Médico', 'Carta'). Si no se puede determinar, poner 'Desconocido'."
    },
    resumen: {
      type: Type.STRING,
      description: "Un resumen detallado y extendido del contenido del documento, capturando los puntos clave en al menos 3 o 4 frases completas.",
    },
    etiquetas: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Una lista de 3 a 5 palabras clave o etiquetas relevantes que describan el documento (e.g., 'factura', 'contrato', 'médico').",
    },
  },
  required: ["fecha", "remitente", "destinatario", "tipoDocumento", "resumen", "etiquetas"],
};

const fileToGenerativePart = (base64Data: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };
};

export const extractInfoFromDocument = async (
  base64Data: string,
  mimeType: string
): Promise<{ textoOCR: string; metadata: DocumentMetadata }> => {
  try {
    const imagePart = fileToGenerativePart(base64Data, mimeType);

    // Paso 1: OCR para extraer texto con formato
    const ocrPrompt = `Extrae todo el texto visible en esta imagen de un documento. Preserva la estructura original del documento, incluyendo saltos de línea, alineación y formato como negritas o cursivas. Usa Markdown para el formato (por ejemplo, **texto** para texto en negrita, *cursiva* para texto en cursiva). Responde únicamente con el texto formateado en Markdown.`;
    const ocrResult = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: ocrPrompt }] },
    });
    
    const textoOCR = ocrResult.text.trim();

    if (!textoOCR) {
        // Si no hay texto, devolvemos metadata por defecto.
        return {
            textoOCR: "No se pudo extraer texto del documento.",
            metadata: {
                fecha: new Date().toISOString().split('T')[0],
                remitente: 'Desconocido',
                destinatario: 'N/A',
                tipoDocumento: 'Desconocido',
                etiquetas: ['sin-texto'],
                resumen: 'El documento no contenía texto legible.'
            }
        };
    }
    
    // Paso 2: Extracción de metadata usando el texto extraído
    const promptMetadata = `Analiza el siguiente texto de un documento y extrae la información solicitada según el esquema JSON. Texto:\n\n---\n${textoOCR}\n---`;
    
    const metadataResult = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptMetadata,
        config: {
            responseMimeType: "application/json",
            responseSchema: metadataSchema,
        }
    });

    const metadataText = metadataResult.text;
    const metadata: DocumentMetadata = JSON.parse(metadataText);

    return { textoOCR, metadata };
  } catch (error) {
    console.error("Error al procesar el documento con Gemini:", error);
    throw new Error("No se pudo analizar el documento. Por favor, inténtalo de nuevo.");
  }
};


export const answerQuestionAboutDocument = async (
  ocrText: string,
  question: string
): Promise<string> => {
  try {
    const prompt = `Basándote EXCLUSIVAMENTE en el siguiente texto de un documento, responde a la pregunta del usuario de forma concisa. Si la respuesta no se encuentra en el texto, indica amablemente que no puedes encontrar la información en el documento.
---
TEXTO DEL DOCUMENTO:
${ocrText}
---
PREGUNTA DEL USUARIO:
${question}
---
RESPUESTA:`;

    const result = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
    });

    const answer = result.text.trim();
    return answer;
  } catch (error) {
    console.error("Error al responder pregunta con Gemini:", error);
    throw new Error("La IA no pudo procesar tu pregunta. Por favor, inténtalo de nuevo.");
  }
};

export const searchWebForInformation = async (
  ocrText: string,
  question: string
): Promise<{ answer: string; sources: QnaItem['sources'] }> => {
  try {
    const prompt = `Basado en el siguiente texto de un documento y una pregunta, busca en la web para proporcionar una respuesta completa y útil. Cita tus fuentes.
---
TEXTO DEL DOCUMENTO (para contexto):
${ocrText}
---
PREGUNTA DEL USUARIO:
${question}
---
RESPUESTA BASADA EN BÚSQUEDA WEB:`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
      },
    });

    const answer = result.text.trim();
    const sources = result.candidates?.[0]?.groundingMetadata?.groundingChunks as QnaItem['sources'] || [];

    return { answer, sources };
  } catch (error) {
    console.error("Error al buscar en la web con Gemini:", error);
    throw new Error("La IA no pudo procesar tu búsqueda web. Por favor, inténtalo de nuevo.");
  }
};