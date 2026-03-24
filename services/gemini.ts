import { GoogleGenerativeAI } from 'google-generative-ai';

const apiKey = process.env.GOOGLE_API_KEY;
const client = new GoogleGenerativeAI({ apiKey });

/**
 * Processes documents using Google Generative AI API.
 * @param {string} document - The document to be processed.
 * @returns {Promise<string>} - The processed document response.
 */
async function processDocument(document) {
    try {
        const response = await client.process({ input: document });
        return response.output;
    } catch (error) {
        console.error('Error processing document:', error);
        throw new Error('Processing failed');
    }
}

export default processDocument;