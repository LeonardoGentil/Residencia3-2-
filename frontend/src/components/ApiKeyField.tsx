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
        <label className="text-xs font-medium text-gray-700">Chave da API</label>
        <a href={signupUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
          Obter chave grátis ↗
        </a>
      </div>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Cole sua chave do ${providerName}`}
          className="w-full border border-gray-200 rounded-lg pl-3 pr-16 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:font-sans placeholder:font-normal"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
        >
          {show ? 'esconder' : 'ver'}
        </button>
      </div>
    </div>
  );
}
