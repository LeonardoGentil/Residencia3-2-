import { useEffect, useState } from 'react';
import { PROVIDER_LIST, getProvider } from '../lib/providers';
import { listModels, type RemoteModel } from '../lib/llmClient';
import type { ProviderModel } from '../lib/types';
import Select from './Select';

interface ProviderSelectorProps {
  providerId: string;
  modelId: string;
  apiKey: string;
  onProviderChange: (id: string) => void;
  onModelChange: (id: string) => void;
}

export default function ProviderSelector({
  providerId,
  modelId,
  apiKey,
  onProviderChange,
  onModelChange,
}: ProviderSelectorProps) {
  const provider = getProvider(providerId);
  const [remoteModels, setRemoteModels] = useState<RemoteModel[] | null>(null);
  const [loadingModels, setLoadingModels] = useState(false);

  // Toda vez que a chave (ou provider) muda, busca a lista de modelos que
  // a chave tem acesso de fato. Falha silenciosa cai pro fallback hardcoded.
  useEffect(() => {
    let cancelled = false;
    setRemoteModels(null);

    if (!apiKey) return;

    setLoadingModels(true);
    listModels(provider.baseUrl, apiKey)
      .then((models) => {
        if (cancelled) return;
        setRemoteModels(models.length > 0 ? models : null);
      })
      .finally(() => {
        if (!cancelled) setLoadingModels(false);
      });

    return () => {
      cancelled = true;
    };
  }, [provider.baseUrl, apiKey]);

  // Mescla: se o catálogo remoto retornou, usa ele; senão usa o fallback
  // hardcoded em providers.ts.
  const optionsToShow: ProviderModel[] =
    remoteModels !== null
      ? remoteModels.map((m) => ({ id: m.id, label: m.label }))
      : provider.models;

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-gray-700 block mb-1.5">Provider</label>
        <Select
          value={providerId}
          onChange={(e) => onProviderChange(e.target.value)}
          options={PROVIDER_LIST.map((p) => ({ value: p.id, label: p.name }))}
        />
        <p className="text-[11px] text-gray-500 mt-1">{provider.description}</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-gray-700">Modelo</label>
          {loadingModels && <span className="text-[10px] text-gray-400">carregando…</span>}
          {remoteModels && !loadingModels && (
            <span className="text-[10px] text-green-600">{remoteModels.length} disponíveis</span>
          )}
        </div>
        <Select
          value={modelId}
          onChange={(e) => onModelChange(e.target.value)}
          options={optionsToShow.map((m) => ({
            value: m.id,
            label: 'notes' in m && m.notes ? `${m.label} — ${m.notes}` : m.label,
          }))}
        />
        {!apiKey && (
          <p className="text-[10px] text-gray-400 mt-1">
            Cole a chave abaixo para ver modelos reais que sua conta tem acesso.
          </p>
        )}
      </div>
    </div>
  );
}
