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
      { id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B' },
      { id: 'openai/gpt-oss-20b', label: 'GPT-OSS 20B' },
    ],
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'nvidia/nemotron-3-super-120b-a12b:free',
    description: 'Maior variedade de modelos free. Llama é o mais saturado — Nemotron e MiniMax tendem a responder mais rápido.',
    signupUrl: 'https://openrouter.ai/keys',
    models: [
      { id: 'nvidia/nemotron-3-super-120b-a12b:free', label: 'Nemotron 3 Super 120B (free)', notes: 'Recomendado' },
      { id: 'minimax/minimax-m2.5:free', label: 'MiniMax M2.5 (free)' },
      { id: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B (free)', notes: 'Saturado' },
      { id: 'qwen/qwen3-next-80b-a3b-instruct:free', label: 'Qwen3 Next 80B (free)' },
      { id: 'openai/gpt-oss-120b:free', label: 'GPT-OSS 120B (free)' },
      { id: 'openai/gpt-oss-20b:free', label: 'GPT-OSS 20B (free)' },
      { id: 'z-ai/glm-4.5-air:free', label: 'GLM 4.5 Air (free)' },
      { id: 'qwen/qwen3-coder:free', label: 'Qwen3 Coder 480B (free)', notes: 'Code-focused' },
    ],
  },
  cerebras: {
    id: 'cerebras',
    name: 'Cerebras',
    baseUrl: 'https://api.cerebras.ai/v1',
    defaultModel: 'gpt-oss-120b',
    description: 'Velocidade extrema (>1500 tokens/s). Catálogo enxuto.',
    signupUrl: 'https://cloud.cerebras.ai/',
    models: [
      { id: 'gpt-oss-120b', label: 'GPT-OSS 120B', notes: 'Recomendado' },
      { id: 'qwen-3-235b-a22b-instruct-2507', label: 'Qwen 3 235B' },
      { id: 'zai-glm-4.7', label: 'GLM 4.7' },
      { id: 'llama3.1-8b', label: 'Llama 3.1 8B', notes: 'Deprecated 27/05' },
    ],
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.5-flash',
    description: 'Free tier generoso, multimodal.',
    signupUrl: 'https://aistudio.google.com/apikey',
    models: [
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', notes: 'Recomendado' },
      { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
      { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    ],
  },
  openai: {
    id: 'openai',
    name: 'OpenAI (pago)',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-5.4-mini',
    description: 'Pago. Catálogo real vem da sua chave (fetch dinâmico).',
    signupUrl: 'https://platform.openai.com/api-keys',
    models: [
      { id: 'gpt-5.4-mini', label: 'GPT-5.4 mini', notes: 'Recomendado · barato' },
      { id: 'gpt-5.5', label: 'GPT-5.5', notes: 'Top tier' },
      { id: 'gpt-5.4', label: 'GPT-5.4' },
      { id: 'gpt-5.4-nano', label: 'GPT-5.4 nano' },
      { id: 'gpt-4.1', label: 'GPT-4.1' },
      { id: 'gpt-4.1-mini', label: 'GPT-4.1 mini' },
      { id: 'gpt-4.1-nano', label: 'GPT-4.1 nano' },
    ],
  },
  xai: {
    id: 'xai',
    name: 'xAI / Grok (pago)',
    baseUrl: 'https://api.x.ai/v1',
    defaultModel: 'grok-4.3',
    description: 'Pago. OpenAI-compat. Catálogo real vem da sua chave.',
    signupUrl: 'https://console.x.ai/',
    models: [
      { id: 'grok-4.3', label: 'Grok 4.3', notes: 'Recomendado · mais novo' },
      { id: 'grok-4.20-reasoning', label: 'Grok 4.20 Reasoning' },
      { id: 'grok-4.20-non-reasoning', label: 'Grok 4.20' },
      { id: 'grok-4.1-fast-reasoning', label: 'Grok 4.1 Fast Reasoning' },
      { id: 'grok-4.1-fast-non-reasoning', label: 'Grok 4.1 Fast' },
      { id: 'grok-4-fast-reasoning', label: 'Grok 4 Fast Reasoning' },
      { id: 'grok-4-fast-non-reasoning', label: 'Grok 4 Fast' },
      { id: 'grok-code-fast-1', label: 'Grok Code Fast 1', notes: 'Coding-focused' },
    ],
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic / Claude (pago)',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-haiku-4-5',
    description: 'Pago. Endpoint OpenAI-compat oficial. Catálogo real vem da sua chave.',
    signupUrl: 'https://console.anthropic.com/settings/keys',
    models: [
      { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', notes: 'Recomendado · barato' },
      { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
      { id: 'claude-opus-4-7', label: 'Claude Opus 4.7', notes: 'Top tier' },
    ],
  },
};

export const PROVIDER_LIST: Provider[] = Object.values(PROVIDERS);

export function getProvider(id: string): Provider {
  return PROVIDERS[id] ?? PROVIDERS['groq']!;
}
