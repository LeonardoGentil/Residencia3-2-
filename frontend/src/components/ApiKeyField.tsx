import { useState } from 'react';

interface ApiKeyFieldProps {
  value: string;
  onChange: (value: string) => void;
  signupUrl: string;
  providerName: string;
}

export default function ApiKeyField({ value, onChange, signupUrl, providerName }: ApiKeyFieldProps) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Chave da API</label>
        <a
          href={signupUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 font-medium transition-colors"
        >
          Obter chave grátis ↗
        </a>
      </div>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Cole sua chave do ${providerName}`}
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-3 pr-14 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 placeholder:font-sans placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium px-1.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          {show ? 'ocultar' : 'ver'}
        </button>
      </div>
      {value && (
        <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-1 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          Chave configurada
        </p>
      )}
    </div>
  );
}
