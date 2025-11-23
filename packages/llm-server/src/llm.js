// LLM integration using LangChain.js
import { ChatDeepSeek } from "@langchain/deepseek";
import { ChatMistralAI } from "@langchain/mistralai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import apiKey from "./apiKey.js";

// Initialize DeepSeek chat model
export const deepseek = new ChatDeepSeek({
    apiKey: apiKey.sk,
    model: "deepseek-chat", // or "deepseek-reasoner" for complex reasoning tasks
    temperature: 0.7,
    maxTokens: 2000,
});

// Initialize Mistral chat model
export const mistral = new ChatMistralAI({
    apiKey: apiKey.mistral,
    model: "mistral-large-latest", // or "mistral-small-latest", "open-mistral-7b"
    temperature: 0.7,
    maxTokens: 2000,
});

// Available models configuration
export const AVAILABLE_MODELS = {
    deepseek: {
        id: 'deepseek',
        name: 'DeepSeek',
        instance: deepseek,
        description: 'DeepSeek'
    },
    mistral: {
        id: 'mistral',
        name: 'Mistral',
        instance: mistral,
        description: 'Mistral AI'
    }
};

// Get LLM instance by model ID
export function getLLM(modelId = 'mistral') {
    const model = AVAILABLE_MODELS[modelId];
    if (!model) {
        throw new Error(`Unknown model: ${modelId}`);
    }
    return model.instance;
}

// Get list of available models
export function getAvailableModels() {
    return Object.values(AVAILABLE_MODELS).map(model => ({
        id: model.id,
        name: model.name,
        description: model.description
    }));
}

