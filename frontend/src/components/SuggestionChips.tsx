interface SuggestionChipsProps {
  onSelect: (text: string) => void;
}

const SUGGESTIONS = [
  'Liste todas as empresas disponíveis',
  'Quero agendar uma consulta',
  'Consultar status de um ticket',
  'Quais serviços a abacaxi-ltda oferece?',
];

export default function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {SUGGESTIONS.map((text) => (
        <button
          key={text}
          onClick={() => onSelect(text)}
          className="text-xs bg-slate-100 dark:bg-white/4 border border-slate-200 dark:border-white/8 text-slate-600 dark:text-slate-400 px-4 py-2 rounded-xl hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-600 dark:hover:text-blue-300 transition-all font-medium shadow-sm backdrop-blur-sm"
        >
          {text}
        </button>
      ))}
    </div>
  );
}
