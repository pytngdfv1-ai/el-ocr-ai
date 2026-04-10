// Updated error handling in gemini.ts

import { SomeAPI } from 'some-api-library';

// Function to validate API key format
const isValidApiKey = (key: string): boolean => {
    const apiKeyPattern = /^[A-Za-z0-9]{32}$/; // Example pattern, adjust as needed
    return apiKeyPattern.test(key);
};

// Main function to use some API
export const useApi = async (apiKey: string, modelName: string) => {
    if (!isValidApiKey(apiKey)) {
        throw new Error('Invalid API key format.');
    }

    try {
        const response = await SomeAPI.fetchModel(modelName, apiKey);
        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching model:', error);
        throw new Error('Failed to fetch model. Please check the API key and model name.');
    }
};