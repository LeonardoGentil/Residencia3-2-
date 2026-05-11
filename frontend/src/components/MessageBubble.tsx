import type { ReactNode } from 'react';
import type { ChatMessage } from '../lib/types';
import ToolCallCard from './ToolCallCard';

/* ── Inline markdown renderer ─────────────────────────────────────── */
function renderInline(text: string, dark: boolean): ReactNode {
  const parts: ReactNode[] = [];
  const re = /(\*\*([^*\n]+)\*\*|`([^`\n]+)`|\*([^*\n]+)\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={k++}>{text.slice(last, m.index)}</span>);

    if (m[0].startsWith('**'))
      parts.push(<strong key={k++} className="font-semibold">{m[2]}</strong>);
    else if (m[0].startsWith('`'))
      parts.push(
        <code key={k++} className={`px-1 py-0.5 rounded text-[0.8em] font-mono ${
          dark
            ? 'bg-white/15 text-blue-100'
            : 'bg-slate-200 text-slate-700 dark:bg-white/8 dark:text-slate-200'
        }`}>
          {m[3]}
        </code>
      );
    else
      parts.push(<em key={k++} className="italic">{m[4]}</em>);

    last = m.index + m[0].length;
  }

  if (last < text.length) parts.push(<span key={k++}>{text.slice(last)}</span>);
  return parts;
}

function Markdown({ text, dark = false }: { text: string; dark?: boolean }) {
  const segs = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {segs.map((seg, si) => {
        if (seg.startsWith('```')) {
          const nl = seg.indexOf('\n');
          const code = nl >= 0 ? seg.slice(nl + 1).slice(0, -3) : seg.slice(3, -3);
          return (
            <pre key={si} className="p-3 rounded-xl text-xs font-mono overflow-x-auto bg-slate-100 text-slate-700 border border-slate-200 dark:bg-[#0d1117] dark:text-slate-300 dark:border-white/6">
              {code.trimEnd()}
            </pre>
          );
        }

        const lines = seg.split('\n');
        const nodes: ReactNode[] = [];
        let i = 0;

        while (i < lines.length) {
          const trimmed = lines[i].trim();

          if (!trimmed) {
            if (nodes.length > 0) nodes.push(<div key={`sp-${si}-${i}`} className="h-1" />);
            i++;
            continue;
          }

          const hm = trimmed.match(/^(#{1,3}) (.+)/);
          if (hm) {
            const sizes = ['text-base font-bold', 'text-sm font-bold', 'text-sm font-semibold'];
            nodes.push(
              <div key={`h-${si}-${i}`} className={sizes[hm[1].length - 1]}>
                {renderInline(hm[2], dark)}
              </div>
            );
            i++;
            continue;
          }

          if (/^[-*] /.test(trimmed)) {
            const items: string[] = [];
            while (i < lines.length && /^[-*] /.test(lines[i].trim())) {
              items.push(lines[i].trim().slice(2));
              i++;
            }
            nodes.push(
              <ul key={`ul-${si}-${i}`} className="list-disc pl-4 space-y-0.5">
                {items.map((it, j) => <li key={j}>{renderInline(it, dark)}</li>)}
              </ul>
            );
            continue;
          }

          if (/^\d+\. /.test(trimmed)) {
            const items: string[] = [];
            while (i < lines.length && /^\d+\. /.test(lines[i].trim())) {
              items.push(lines[i].trim().replace(/^\d+\. /, ''));
              i++;
            }
            nodes.push(
              <ol key={`ol-${si}-${i}`} className="list-decimal pl-4 space-y-0.5">
                {items.map((it, j) => <li key={j}>{renderInline(it, dark)}</li>)}
              </ol>
            );
            continue;
          }

          nodes.push(<p key={`p-${si}-${i}`}>{renderInline(trimmed, dark)}</p>);
          i++;
        }

        return <div key={si}>{nodes}</div>;
      })}
    </div>
  );
}

/* ── Avatares ─────────────────────────────────────────────────────── */
function AssistantAvatar() {
  return (
    <div className="relative flex-shrink-0">
      <div className="absolute inset-0 bg-blue-600 rounded-full opacity-40 blur-[5px] animate-avatar-glow" />
      <div className="relative w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
        <span className="text-white text-[10px] font-black">F</span>
      </div>
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex-shrink-0 flex items-center justify-center">
      <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      </svg>
    </div>
  );
}

/* ── Componente principal ─────────────────────────────────────────── */
export default function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'tool') return null;

  if (message.role === 'user') {
    return (
      <div className="flex justify-end items-end gap-2 animate-fade-in-up">
        <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-br-sm bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-900/30">
          <Markdown text={message.content} dark />
        </div>
        <UserAvatar />
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 animate-fade-in-up">
      <AssistantAvatar />
      <div className="max-w-[80%] space-y-2">
        {message.content && (
          <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/6 text-slate-800 dark:text-slate-200 shadow-sm backdrop-blur-sm">
            <Markdown text={message.content} />
          </div>
        )}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="space-y-2">
            {message.toolCalls.map((tc) => (
              <ToolCallCard key={tc.id} call={tc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
