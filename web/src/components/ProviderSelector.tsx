import { PROVIDER_LIST, getProvider } from '../lib/providers';

interface ProviderSelectorProps {
  providerId: string;
  modelId: string;
  onProviderChange: (id: string) => void;
  onModelChange: (id: string) => void;
}

export default function ProviderSelector({
  providerId,
  modelId,
  onProviderChange,
  onModelChange,
}: ProviderSelectorProps) {
  const provider = getProvider(providerId);

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-gray-700 block mb-1.5">Provider</label>
        <select
          value={providerId}
          onChange={(e) => onProviderChange(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {PROVIDER_LIST.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-gray-500 mt-1">{provider.description}</p>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-700 block mb-1.5">Modelo</label>
        <select
          value={modelId}
          onChange={(e) => onModelChange(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {provider.models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
              {m.notes ? ` — ${m.notes}` : ''}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
