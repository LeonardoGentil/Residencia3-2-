import type { ChatMessage } from '../lib/types';
import ToolCallCard from './ToolCallCard';

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  if (message.role === 'tool') return null;

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed bg-blue-600 text-white whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] space-y-2">
        {message.content && (
          <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm leading-relaxed bg-gray-100 text-gray-800 whitespace-pre-wrap">
            {message.content}
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
