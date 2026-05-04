const PREFIX = 'filazero_mcp_';

function key(k: string): string {
  return `${PREFIX}${k}`;
}

export const storage = {
  get(k: string): string | null {
    try {
      return localStorage.getItem(key(k));
    } catch {
      return null;
    }
  },
  set(k: string, v: string): void {
    try {
      localStorage.setItem(key(k), v);
    } catch {
      // ignore quota errors
    }
  },
  remove(k: string): void {
    try {
      localStorage.removeItem(key(k));
    } catch {
      // ignore
    }
  },
};

// Helpers tipados pra chaves comuns

export function getApiKey(providerId: string): string {
  return storage.get(`apikey_${providerId}`) ?? '';
}

export function setApiKey(providerId: string, value: string): void {
  if (value) storage.set(`apikey_${providerId}`, value);
  else storage.remove(`apikey_${providerId}`);
}

export function getSelectedProvider(): string {
  return storage.get('provider') ?? 'groq';
}

export function setSelectedProvider(id: string): void {
  storage.set('provider', id);
}

export function getSelectedModel(providerId: string): string | null {
  return storage.get(`model_${providerId}`);
}

export function setSelectedModel(providerId: string, modelId: string): void {
  storage.set(`model_${providerId}`, modelId);
}

export function getMcpUrl(): string {
  return storage.get('mcp_url') ?? 'http://localhost:3000/mcp';
}

export function setMcpUrl(url: string): void {
  storage.set('mcp_url', url);
}
