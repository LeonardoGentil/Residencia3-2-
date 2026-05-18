import { useState } from 'react';
import type { CustomEndpoint, CustomEndpointParam } from '../lib/types';

interface Props {
  onSave: (endpoint: CustomEndpoint) => void;
  onClose: () => void;
}

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

function makeId() {
  return `ep-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/8 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all';

const smallInputCls =
  'text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/8 rounded-lg px-2 py-1.5 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-500/60 transition-all';

export default function AddEndpointModal({ onSave, onClose }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState<CustomEndpoint['method']>('GET');
  const [params, setParams] = useState<CustomEndpointParam[]>([]);

  function addParam() {
    setParams((p) => [...p, { name: '', type: 'string', description: '', required: false }]);
  }

  function removeParam(i: number) {
    setParams((p) => p.filter((_, idx) => idx !== i));
  }

  function updateParam(i: number, field: keyof CustomEndpointParam, value: string | boolean) {
    setParams((p) => p.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));
  }

  function handleSave() {
    if (!name.trim() || !url.trim()) return;
    onSave({
      id: makeId(),
      name: name.trim().replace(/\s+/g, '_').toLowerCase(),
      description: description.trim(),
      url: url.trim(),
      method,
      params,
    });
    onClose();
  }

  const isValid = name.trim().length > 0 && url.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/6 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Cadastrar Endpoint</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/8 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto chat-scroll p-6 space-y-4 flex-1">
          <Field label="Nome da tool" required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.replace(/\s/g, '_'))}
              placeholder="ex: buscar_cliente"
              className={inputCls}
            />
            <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-1">
              Use snake_case. Esse será o nome que o assistente usa para chamar o endpoint.
            </p>
          </Field>

          <Field label="Descrição">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="O que esse endpoint faz?"
              className={inputCls}
            />
          </Field>

          <div className="flex gap-2">
            <Field label="Método">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as CustomEndpoint['method'])}
                className="w-28 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/8 rounded-xl px-2 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500/60 transition-all"
              >
                {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <div className="flex-1">
              <Field label="URL" required>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://api.exemplo.com/recurso"
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          {/* Parâmetros */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Parâmetros</span>
              <button
                onClick={addParam}
                className="text-[10px] text-blue-500 hover:text-blue-400 font-medium flex items-center gap-1 transition-colors"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Adicionar
              </button>
            </div>

            {params.length === 0 && (
              <p className="text-[11px] text-slate-400 dark:text-slate-600 italic">
                Nenhum parâmetro. Clique em "Adicionar" para incluir campos.
              </p>
            )}

            <div className="space-y-2">
              {params.map((p, i) => (
                <div
                  key={i}
                  className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/6 rounded-xl p-3 space-y-2"
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => updateParam(i, 'name', e.target.value)}
                      placeholder="nome"
                      className={`flex-1 ${smallInputCls}`}
                    />
                    <select
                      value={p.type}
                      onChange={(e) => updateParam(i, 'type', e.target.value)}
                      className={`w-24 ${smallInputCls}`}
                    >
                      <option value="string">string</option>
                      <option value="number">number</option>
                      <option value="boolean">boolean</option>
                    </select>
                    <button
                      onClick={() => removeParam(i)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/8 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={p.description}
                      onChange={(e) => updateParam(i, 'description', e.target.value)}
                      placeholder="descrição do parâmetro"
                      className={`flex-1 ${smallInputCls}`}
                    />
                    <label className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-500 cursor-pointer select-none whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={p.required}
                        onChange={(e) => updateParam(i, 'required', e.target.checked)}
                        className="rounded"
                      />
                      obrigatório
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-white/6 flex justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-white/8 hover:border-slate-300 dark:hover:border-white/14 rounded-xl px-4 py-2 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="text-xs text-white bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl px-4 py-2 transition-all font-medium shadow-md shadow-blue-900/30"
          >
            Cadastrar
          </button>
        </div>
      </div>
    </div>
  );
}
