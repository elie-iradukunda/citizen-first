import { useEffect, useRef, useState } from 'react';
import { PaperAirplaneIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { fetchAssistantQuestions, askCitizenAssistant } from '../lib/publicApi';

function AssistantPage() {
  const [question, setQuestion] = useState('');
  const [quickQuestions, setQuickQuestions] = useState([]);
  const [isLoadingExamples, setIsLoadingExamples] = useState(true);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Muraho. I am Citizen First AI Assistant. Ask me where to go for a service, who can solve your issue in your sector, or how to escalate a delayed case.',
    },
  ]);
  const [isAsking, setIsAsking] = useState(false);
  const [sector, setSector] = useState('');
  const [district, setDistrict] = useState('');
  const [language, setLanguage] = useState('en');
  const messageEndRef = useRef(null);

  useEffect(() => {
    let isActive = true;

    fetchAssistantQuestions()
      .then((payload) => {
        if (isActive) {
          setQuickQuestions(payload.items);
        }
      })
      .catch(() => {
        if (isActive) {
          setQuickQuestions([]);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingExamples(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isAsking]);

  const submitQuestion = async (submittedQuestion) => {
    const trimmedQuestion = submittedQuestion.trim();
    if (!trimmedQuestion || isAsking) {
      return;
    }

    setMessages((current) => [...current, { role: 'user', text: trimmedQuestion }]);
    setQuestion('');
    setIsAsking(true);

    try {
      const response = await askCitizenAssistant({
        question: trimmedQuestion,
        sector: sector.trim() || undefined,
        district: district.trim() || undefined,
        language,
      });

      const guidanceText = [
        response.answer,
        response.matchedGuidance?.length
          ? `\nRecommended guidance:\n${response.matchedGuidance
              .map((item) => `- ${item.issue}: ${item.recommendedOffice}`)
              .join('\n')}`
          : '',
        response.emergencyContacts?.length
          ? `\nUseful hotlines:\n${response.emergencyContacts
              .slice(0, 3)
              .map((item) => `- ${item.title}: ${item.number}`)
              .join('\n')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n');

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: guidanceText,
          meta: response.provider === 'gemini' ? 'AI response via Gemini' : 'Local guidance fallback',
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: 'I could not process the request right now. Please retry, or call emergency 112 / anti-corruption 997 for urgent support.',
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="bg-mist">
      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.26em] text-tide">AI Assistant</p>
        <h1 className="mt-4 font-display text-5xl font-black leading-tight text-ink">
          Ask anything about local public services
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate">
          Ask in plain language and get practical guidance: who can solve your issue, what documents to carry, and how to escalate.
        </p>

        <div className="mt-10 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[1.8rem] border border-ink/10 bg-white p-6 shadow-soft lg:p-7">
            <div className="h-[480px] overflow-y-auto rounded-2xl bg-mist p-4">
              {messages.map((message, index) => (
                <article
                  key={`${message.role}-${index}`}
                  className={[
                    'mb-3 max-w-[90%] rounded-2xl p-4 text-sm leading-7',
                    message.role === 'assistant'
                      ? 'bg-white text-slate'
                      : 'ml-auto bg-ink text-white',
                  ].join(' ')}
                >
                  {message.role === 'assistant' ? (
                    <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-tide">
                      <SparklesIcon className="h-4 w-4" />
                      Citizen First AI
                    </p>
                  ) : null}
                  <p className="whitespace-pre-line">{message.text}</p>
                  {message.meta ? (
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate">
                      {message.meta}
                    </p>
                  ) : null}
                </article>
              ))}
              {isAsking ? (
                <article className="mb-3 max-w-[90%] rounded-2xl bg-white p-4 text-sm text-slate">
                  Generating guidance...
                </article>
              ) : null}
              <div ref={messageEndRef} />
            </div>

            <form
              className="mt-4 space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                submitQuestion(question);
              }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  className="rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                >
                  <option value="en">English</option>
                  <option value="rw">Kinyarwanda</option>
                </select>
                <input
                  value={sector}
                  onChange={(event) => setSector(event.target.value)}
                  placeholder="Optional: Sector"
                  className="rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                />
                <input
                  value={district}
                  onChange={(event) => setDistrict(event.target.value)}
                  placeholder="Optional: District"
                  className="rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide sm:col-span-2"
                />
              </div>
              <div className="flex gap-3">
                <input
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Ask your question about public service, corruption reporting, or local offices..."
                  className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                />
                <button
                  type="submit"
                  disabled={isAsking}
                  className="inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-bold text-white disabled:opacity-70"
                >
                  Ask
                  <PaperAirplaneIcon className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>

          <aside className="rounded-[1.8rem] border border-ink/10 bg-white p-6 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-tide">Suggested questions</p>
            <h2 className="mt-3 font-display text-3xl font-black text-ink">Start with these</h2>
            <div className="mt-5 space-y-3">
              {!isLoadingExamples && quickQuestions.length > 0
                ? quickQuestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => submitQuestion(item)}
                      className="w-full rounded-xl border border-ink/15 bg-mist px-4 py-3 text-left text-sm leading-6 text-slate transition hover:border-tide"
                    >
                      {item}
                    </button>
                  ))
                : null}
            </div>

            <div className="mt-7 rounded-2xl bg-ink p-5 text-sm leading-7 text-white/85">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">Important</p>
              <p className="mt-2">
                For immediate danger call <span className="font-bold text-gold">112</span>. For bribery and corruption call <span className="font-bold text-gold">997</span>.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

export default AssistantPage;
