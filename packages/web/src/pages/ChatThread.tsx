import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { posthog } from '@/lib/posthog';
import { ChatBubble } from '@/components/ChatBubble';

export function ChatThread() {
  const { matchId } = useParams<{ matchId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: match } = useQuery({
    queryKey: ['match', matchId],
    queryFn: () => api.matches.get(matchId!),
    enabled: !!matchId,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', matchId],
    queryFn: () => api.messages.list(matchId!),
    enabled: !!matchId,
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: (text: string) => api.messages.send(matchId!, text),
    onSuccess: () => {
      posthog.capture('message_sent', { match_id: matchId });
      queryClient.invalidateQueries({ queryKey: ['messages', matchId] });
      setContent('');
      inputRef.current?.focus();
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  };

  const petA = match?.petA as Record<string, unknown> | undefined;
  const petB = match?.petB as Record<string, unknown> | undefined;
  const petAName = (petA?.name as string) || 'Pet A';
  const petBName = (petB?.name as string) || 'Pet B';

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
        <Link
          to="/messages"
          className="p-1 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="font-semibold text-gray-900">
            {petAName} & {petBName}
          </h2>
          <p className="text-xs text-gray-500">Match conversation</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {(messages as Record<string, unknown>[]).length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400">
              No messages yet. Say hello!
            </p>
          </div>
        ) : (
          (messages as Record<string, unknown>[]).map((msg) => (
            <ChatBubble
              key={msg.id as string}
              message={{
                id: msg.id as string,
                senderId: msg.senderId as string,
                content: msg.content as string,
                createdAt: msg.createdAt as string,
              }}
              isOwn={(msg.senderId as string) === user?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 px-4 py-3 bg-white border-t border-gray-100"
      >
        <input
          ref={inputRef}
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
        />
        <button
          type="submit"
          disabled={!content.trim() || sendMutation.isPending}
          className="p-2 bg-amber-500 text-white rounded-full hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
