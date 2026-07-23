import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { sendComplaintMessage } from '../../lib/dashboardApi';

const BRAND = '#087536';

function formatTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Two-way chat on a case, shared by the citizen and the RIB officer.
 * - `caseData` is a complaint summary (needs id, response, messages, chatOpen).
 * - `viewerRole` is 'citizen' or 'rib' — the viewer's own bubbles sit on the right.
 * - `onSent(updatedCase)` receives the refreshed case after a message is sent.
 */
function CaseChat({ caseData, viewerRole, onSent }) {
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  const chatOpen = Boolean(caseData?.chatOpen ?? caseData?.response);

  // Combine the first official response with the follow-up messages into a
  // single ordered thread of bubbles.
  const bubbles = useMemo(() => {
    if (!caseData) return [];
    const items = [];
    if (caseData.response) {
      items.push({
        id: 'response',
        sender: 'rib',
        senderName: caseData.response.respondedByName ?? 'RIB officer',
        body: caseData.response.actionTaken
          ? `${caseData.response.message}\n\nAction taken: ${caseData.response.actionTaken}`
          : caseData.response.message,
        createdAt: caseData.response.respondedAt,
        isResponse: true,
      });
    }
    (caseData.messages ?? []).forEach((message) => items.push(message));
    return items;
  }, [caseData]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [bubbles.length]);

  const onSubmit = async (event) => {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || isSending) return;

    setError('');
    setIsSending(true);
    try {
      const result = await sendComplaintMessage(caseData.id, trimmed);
      setBody('');
      onSent?.(result.item);
    } catch (sendError) {
      setError(sendError.message || 'Message could not be sent.');
    } finally {
      setIsSending(false);
    }
  };

  if (!chatOpen) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
        <MessageCircle className="mx-auto h-6 w-6 text-slate-300" />
        <p className="mt-2 text-[13px] font-semibold text-slate-500">Chat opens after the RIB officer responds</p>
        <p className="mt-1 text-[12px] text-slate-400">
          Once an official response is recorded, you can exchange more details here on this case.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ backgroundColor: BRAND }}>
          <MessageCircle className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-bold text-slate-800">Case conversation</p>
          <p className="text-[11px] text-slate-400">
            {viewerRole === 'citizen' ? 'Ask the RIB officer for more details' : 'Reply to the citizen with more details'}
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="max-h-80 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
        {bubbles.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-slate-400">No messages yet. Start the conversation below.</p>
        ) : null}
        {bubbles.map((bubble) => {
          const mine = bubble.sender === viewerRole;
          return (
            <div key={bubble.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-[13px] leading-6 shadow-sm ${
                    mine
                      ? 'rounded-br-sm text-white'
                      : bubble.isResponse
                        ? 'rounded-bl-sm border border-teal-200 bg-teal-50 text-teal-900'
                        : 'rounded-bl-sm border border-slate-200 bg-white text-slate-700'
                  }`}
                  style={mine ? { backgroundColor: BRAND } : undefined}
                >
                  <p className="whitespace-pre-wrap break-words">{bubble.body}</p>
                </div>
                <p className="mt-1 px-1 text-[10px] font-medium text-slate-400">
                  {bubble.sender === 'rib' ? bubble.senderName || 'RIB officer' : bubble.senderName || 'Citizen'}
                  {' · '}
                  {formatTime(bubble.createdAt)}
                  {bubble.isResponse ? ' · official response' : ''}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={onSubmit} className="border-t border-slate-100 p-3">
        {error ? <p className="mb-2 text-[12px] font-semibold text-rose-600">{error}</p> : null}
        <div className="flex items-end gap-2">
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                onSubmit(event);
              }
            }}
            rows={1}
            placeholder="Write a message…"
            className="min-h-[44px] max-h-32 flex-1 resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] outline-none focus:border-brand-300"
          />
          <button
            type="submit"
            disabled={isSending || !body.trim()}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg px-4 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: BRAND }}
          >
            <Send className="h-4 w-4" />
            {isSending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CaseChat;
