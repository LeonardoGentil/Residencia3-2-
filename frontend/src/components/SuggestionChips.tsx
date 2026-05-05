interface SuggestionChipsProps {
  onSelect: (text: string) => void;
}

const SUGGESTIONS = [
  'liste todas as empresas disponíveis',
  'quero agendar uma consulta',
  'consultar status de um ticket',
  'quais serviços a abacaxi-ltda oferece?',
];

export default function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {SUGGESTIONS.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors border border-blue-100"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
