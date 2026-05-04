import type { Provider } from './types';

export const PROVIDERS: Record<string, Provider> = {
  groq: {
    id: 'groq',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    description: 'Mais rápido. Free tier amplo, ideal pra demo.',
    signupUrl: 'https://console.groq.com/keys',
    models: [
      { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile', notes: 'Recomendado' },
      { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant', notes: 'Mais leve' },
      { id: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B Versatile' },
      { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
      { id: 'gemma2-9b-it', label: 'Gemma 2 9B' },
    ],
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'deepseek/deepseek-chat-v3-0324:free',
    description: 'Maior variedade de modelos free (DeepSeek, Qwen, Llama).',
    signupUrl: 'https://openrouter.ai/keys',
    models: [
      { id: 'deepseek/deepseek-chat-v3-0324:free', label: 'DeepSeek V3 (free)', notes: 'Recomendado' },
      { id: 'deepseek/deepseek-r1:free', label: 'DeepSeek R1 (free)', notes: 'Reasoning' },
      { id: 'qwen/qwen-2.5-72b-instruct:free', label: 'Qwen 2.5 72B (free)' },
      { id: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B (free)' },
      { id: 'google/gemini-2.0-flash-exp:free', label: 'Gemini 2.0 Flash (free)' },
      { id: 'mistralai/mistral-small-3.1-24b-instruct:free', label: 'Mistral Small 3.1 (free)' },
    ],
  },
  cerebras: {
    id: 'cerebras',
    name: 'Cerebras',
    baseUrl: 'https://api.cerebras.ai/v1',
    defaultModel: 'llama-3.3-70b',
    description: 'Velocidade extrema (>1500 tokens/s).',
    signupUrl: 'https://cloud.cerebras.ai/',
    models: [
      { id: 'llama-3.3-70b', label: 'Llama 3.3 70B', notes: 'Recomendado' },
      { id: 'llama3.1-8b', label: 'Llama 3.1 8B' },
      { id: 'qwen-3-32b', label: 'Qwen 3 32B' },
    ],
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.0-flash',
    description: 'Free tier generoso, multimodal.',
    signupUrl: 'https://aistudio.google.com/apikey',
    models: [
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', notes: 'Recomendado' },
      { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
      { id: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash 8B' },
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    ],
  },
};

export const PROVIDER_LIST: Provider[] = Object.values(PROVIDERS);

export function getProvider(id: string): Provider {
  return PROVIDERS[id] ?? PROVIDERS['groq']!;
}
