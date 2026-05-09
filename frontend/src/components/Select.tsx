import type { SelectHTMLAttributes } from 'react';

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: Option[];
}

export default function Select({ options, className, ...rest }: SelectProps) {
  return (
    <div className="relative">
      <select
        {...rest}
        className={
          'w-full appearance-none bg-slate-800 border border-slate-700 rounded-xl pl-3 pr-9 py-2.5 text-sm text-slate-200 ' +
          'hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ' +
          'transition-all cursor-pointer ' +
          (className ?? '')
        }
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-slate-800 text-slate-200">
            {o.label}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}
