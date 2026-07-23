'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { Send } from 'lucide-react';

const MONO = 'var(--font-mono), "JetBrains Mono", "Fira Code", monospace';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface TwinVisitor {
  name: string | null;
  contact: string | null;
  seenAt: string;
}

function readVisitor(): TwinVisitor | null {
  try {
    const raw = localStorage.getItem('twin_visitor');
    return raw ? (JSON.parse(raw) as TwinVisitor) : null;
  } catch { return null; }
}

function writeVisitor(v: TwinVisitor): void {
  localStorage.setItem('twin_visitor', JSON.stringify(v));
}

const mdComponents: Components = {
    p: ({ children }) => <p style={{ marginBottom: '0.4em', lineHeight: 1.65 }}>{children}</p>,
    ul: ({ children }) => <ul style={{ marginBottom: '0.4em', marginLeft: '1.2em', listStyleType: 'disc' }}>{children}</ul>,
    ol: ({ children }) => <ol style={{ marginBottom: '0.4em', marginLeft: '1.2em', listStyleType: 'decimal' }}>{children}</ol>,
    li: ({ children }) => <li style={{ lineHeight: 1.65, marginBottom: '0.1em' }}>{children}</li>,
    strong: ({ children }) => <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{children}</strong>,
    em: ({ children }) => <em style={{ color: 'var(--accent-hover)' }}>{children}</em>,
    h1: ({ children }) => <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.88em', marginBottom: '0.35em', marginTop: '0.75em', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{children}</p>,
    h2: ({ children }) => <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.83em', marginBottom: '0.3em', marginTop: '0.6em', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{children}</p>,
    h3: ({ children }) => <p style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.83em', marginBottom: '0.25em', marginTop: '0.5em' }}>{children}</p>,
    code: ({ children, className }) => {
        const isBlock = className?.includes('language-');
        return isBlock ? (
            <code style={{ display: 'block', fontFamily: MONO, fontSize: '0.78em', lineHeight: 1.6, overflowX: 'auto', padding: '0.55em 0.75em', margin: '0.35em 0', borderRadius: 6, background: 'var(--bg-alt)', color: 'var(--accent-hover)', border: '1px solid var(--border)' }}>
                {children}
            </code>
        ) : (
            <code style={{ fontFamily: MONO, fontSize: '0.82em', padding: '0.1em 0.3em', borderRadius: 4, background: 'var(--accent-wash)', color: 'var(--accent-hover)' }}>
                {children}
            </code>
        );
    },
    pre: ({ children }) => <pre style={{ overflow: 'auto', margin: '0.35em 0' }}>{children}</pre>,
    blockquote: ({ children }) => (
        <blockquote style={{ borderLeft: '2px solid var(--accent)', paddingLeft: '0.7em', margin: '0.35em 0', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{children}</blockquote>
    ),
    a: ({ href, children }) => (
        <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>{children}</a>
    ),
};

export interface TwinHandle {
    clear: () => void;
}

const Twin = forwardRef<TwinHandle>(function Twin(_, ref) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [sessionId, setSessionId] = useState<string>('');
    const [onboardingStep, setOnboardingStep] = useState<'name' | 'contact' | 'done'>('name');
    const [visitorName, setVisitorName] = useState<string | null>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const hiddenInputRef = useRef<HTMLInputElement>(null);

    const [avatarError, setAvatarError] = useState(false);
    const avatarSrc = `/avatar.png${typeof process.env.NEXT_PUBLIC_AVATAR_VERSION === 'string' ? `?v=${process.env.NEXT_PUBLIC_AVATAR_VERSION}` : ''}`;

    useImperativeHandle(ref, () => ({
        clear: () => {
            setMessages([]);
            setSessionId('');
        },
    }));

    useEffect(() => {
        const el = messagesContainerRef.current;
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        hiddenInputRef.current?.focus({ preventScroll: true });
    }, []);

    const triggerGreeting = async (name: string) => {
        const greetId = (Date.now() + 2).toString();
        let placeholderAdded = false;
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: '__greet__', user_name: name }),
            });

            if (!response.ok) throw new Error('Request failed');

            const data = await response.json();
            if (data.session_id) setSessionId(data.session_id);

            setMessages(prev => [...prev, { id: greetId, role: 'assistant', content: '', timestamp: new Date() }]);
            placeholderAdded = true;
            setIsLoading(false);
            setIsStreaming(true);

            const text: string = data.response;
            await new Promise<void>(resolve => {
                let pos = 0;
                const tick = setInterval(() => {
                    pos = Math.min(pos + 5, text.length);
                    setMessages(prev => prev.map(m =>
                        m.id === greetId ? { ...m, content: text.slice(0, pos) } : m
                    ));
                    if (pos >= text.length) { clearInterval(tick); resolve(); }
                }, 16);
            });
        } catch {
            const fallback = `Hey, ${name}! Ask me anything about Akash.`;
            if (placeholderAdded) {
                setMessages(prev => prev.map(m =>
                    m.id === greetId && m.content === '' ? { ...m, content: fallback } : m
                ));
            } else {
                setMessages(prev => [...prev, { id: greetId, role: 'assistant', content: fallback, timestamp: new Date() }]);
            }
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
            setTimeout(() => hiddenInputRef.current?.focus({ preventScroll: true }), 50);
        }
    };

    useEffect(() => {
        const FIFTEEN_MINS = 15 * 60 * 1000;
        const visitor = readVisitor();
        const expired = visitor && (Date.now() - new Date(visitor.seenAt).getTime() > FIFTEEN_MINS);
        if (visitor && !expired) {
            setVisitorName(visitor.name);
            setOnboardingStep('done');
            if (visitor.name) {
                triggerGreeting(visitor.name);
            }
        } else {
            if (expired) localStorage.removeItem('twin_visitor');
            setMessages([{
                id: 'onboard-name',
                role: 'assistant',
                content: "Hey! I'm Akash's digital twin. What's your name?",
                timestamp: new Date(),
            }]);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const sendMessage = async () => {
        if (!input.trim() || isLoading || isStreaming) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const assistantId = (Date.now() + 1).toString();
        let placeholderAdded = false;

        try {
            const response = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage.content, session_id: sessionId || undefined }),
            });

            if (!response.ok) throw new Error('Request failed');

            const data = await response.json();
            if (data.session_id && !sessionId) setSessionId(data.session_id);

            // Add placeholder and begin typewriter animation
            setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', timestamp: new Date() }]);
            placeholderAdded = true;
            setIsLoading(false);
            setIsStreaming(true);

            const text: string = data.response;
            await new Promise<void>(resolve => {
                let pos = 0;
                const tick = setInterval(() => {
                    pos = Math.min(pos + 5, text.length);
                    setMessages(prev => prev.map(m =>
                        m.id === assistantId ? { ...m, content: text.slice(0, pos) } : m
                    ));
                    if (pos >= text.length) { clearInterval(tick); resolve(); }
                }, 16);
            });

        } catch (error) {
            console.error('Chat error:', error);
            const errMsg = 'Sorry, I encountered an error. Please try again.';
            if (placeholderAdded) {
                setMessages(prev => prev.map(m =>
                    m.id === assistantId && m.content === '' ? { ...m, content: errMsg } : m
                ));
            } else {
                setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: errMsg, timestamp: new Date() }]);
            }
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
            setTimeout(() => hiddenInputRef.current?.focus({ preventScroll: true }), 50);
        }
    };

    const handleNameSubmit = () => {
        if (isLoading || isStreaming) return;
        const name = input.trim();
        setInput('');

        if (!name) {
            writeVisitor({ name: null, contact: null, seenAt: new Date().toISOString() });
            setOnboardingStep('done');
            setMessages([]);
            return;
        }

        setVisitorName(name);
        setMessages(prev => [
            ...prev,
            { id: Date.now().toString(), role: 'user', content: name, timestamp: new Date() },
            {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Nice to meet you, ${name}! Got an email or phone number I can reach you at?`,
                timestamp: new Date(),
            },
        ]);
        setOnboardingStep('contact');
    };

    const handleContactSubmit = () => {
        if (isLoading || isStreaming) return;
        const contact = input.trim() || null;
        setInput('');

        writeVisitor({ name: visitorName, contact, seenAt: new Date().toISOString() });
        setOnboardingStep('done');
        setMessages([]);

        if (visitorName) {
            fetch(`${API_URL}/visitor`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: visitorName, contact }),
            }).catch(() => {});

            triggerGreeting(visitorName);
        }
    };

    const handleOnboardingSkip = () => {
        if (onboardingStep === 'name') {
            writeVisitor({ name: null, contact: null, seenAt: new Date().toISOString() });
            setOnboardingStep('done');
            setMessages([]);
        } else if (onboardingStep === 'contact') {
            writeVisitor({ name: visitorName, contact: null, seenAt: new Date().toISOString() });
            setOnboardingStep('done');
            setMessages([]);

            if (visitorName) {
                fetch(`${API_URL}/visitor`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: visitorName, contact: null }),
                }).catch(() => {});

                triggerGreeting(visitorName);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (onboardingStep === 'name') handleNameSubmit();
            else if (onboardingStep === 'contact') handleContactSubmit();
            else sendMessage();
        }
    };

    const busy = isLoading || isStreaming;

    // Helper: determine if this message should show avatar (last in consecutive assistant run)
    const getShowAvatar = (idx: number) => {
        const msg = messages[idx];
        if (msg.role !== 'assistant') return false;
        const nextMsg = messages[idx + 1];
        return !nextMsg || nextMsg.role !== 'assistant';
    };

    // Helper: get tight spacing for consecutive messages of same role
    const getTightSpacing = (idx: number) => {
        if (idx === 0) return {};
        const prevMsg = messages[idx - 1];
        const currMsg = messages[idx];
        if (prevMsg && prevMsg.role === currMsg.role) {
            return { marginTop: '-8px' };
        }
        return {};
    };

    // Helper: check if last user message should show Delivered footer
    const getLastUserIdx = () => {
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === 'user') return i;
        }
        return -1;
    };

    const lastUserIdx = getLastUserIdx();
    const showDelivered = lastUserIdx >= 0 && lastUserIdx < messages.length - 1;

    return (
        <div
            className="flex flex-col h-full"
            style={{ background: 'var(--bg-base)' }}
        >
            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4" style={{ overflowX: 'hidden' }}>

                {/* Empty state */}
                {messages.length === 0 && onboardingStep === 'done' && !isLoading && !isStreaming && (
                    <div className="flex flex-col items-center justify-center h-full gap-4 select-none">
                        {!avatarError ? (
                            <img
                                src={avatarSrc}
                                alt="Akash"
                                onError={() => setAvatarError(true)}
                                style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--accent-soft)' }}
                            />
                        ) : (
                            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#09090b' }}>A</div>
                        )}
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>Hello!</p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85em' }}>Ask me anything</p>
                        </div>
                        <p style={{ color: 'var(--border)', fontSize: '0.75em' }}>────────────────────</p>
                    </div>
                )}

                <div className="flex flex-col gap-4">
                    {messages.map((message, idx) => {
                        const isLastAssistant = message.role === 'assistant' && idx === messages.length - 1 && isStreaming;
                        const showAvatar = getShowAvatar(idx);
                        const tightStyle = getTightSpacing(idx);
                        const showDeliveredAfter = idx === lastUserIdx && showDelivered;

                        return (
                            <div key={message.id} style={tightStyle}>
                                {/* Assistant message bubble */}
                                {message.role === 'assistant' && (
                                    <div className="flex items-end gap-2 max-w-[85%]">
                                        {showAvatar ? (
                                            <>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src="/avatar.png" alt="" className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-white/10" />
                                            </>
                                        ) : (
                                            <div className="w-7 shrink-0" />
                                        )}
                                        <div
                                            className="rounded-2xl rounded-bl-md px-3.5 py-2.5 text-[13px] leading-relaxed"
                                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#d4d4d8' }}
                                        >
                                            {message.role === 'assistant' ? (
                                                <ReactMarkdown components={mdComponents}>{message.content}</ReactMarkdown>
                                            ) : null}
                                            {isLastAssistant && <span className="sr-only">Typing</span>}
                                        </div>
                                    </div>
                                )}

                                {/* User message bubble */}
                                {message.role === 'user' && (
                                    <div className="flex justify-end">
                                        <div
                                            className="max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2.5 text-[13px] leading-relaxed"
                                            style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.18)', color: '#fafafa' }}
                                        >
                                            <span>{message.content}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Delivered footer after last user message */}
                                {showDeliveredAfter && (
                                    <p className="text-right text-[10px] mt-1" style={{ color: '#52525b' }}>Delivered</p>
                                )}
                            </div>
                        );
                    })}

                    {/* Typing marker (while waiting for first token) */}
                    {isLoading && !messages.some((m, i) => i === messages.length - 1 && m.role === 'assistant' && m.content.length > 0) && (
                        <div className="flex items-end gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/avatar.png" alt="" className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-white/10" />
                            <span className="shimmer-text text-[12px] py-1">Akash is typing…</span>
                        </div>
                    )}
                </div>

            </div>

            {/* Skip banner - only shown during onboarding */}
            {onboardingStep !== 'done' && (
                <div style={{
                    borderTop: '1px solid var(--border-glass)',
                    padding: '8px 16px',
                    background: 'var(--bg-base)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        Don&apos;t want to share?
                    </span>
                    <button
                        onClick={handleOnboardingSkip}
                        style={{
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                            padding: '5px 18px',
                            borderRadius: '999px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Skip ↗
                    </button>
                </div>
            )}

            {/* Glass pill input row */}
            <div className="m-3 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                <input
                    ref={hiddenInputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={onboardingStep === 'done' && busy}
                    placeholder={
                        onboardingStep === 'name'
                            ? 'Type your name...'
                            : onboardingStep === 'contact'
                            ? 'Type your email or phone...'
                            : 'Ask something...'
                    }
                    className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-zinc-600"
                    style={{ color: busy ? 'var(--text-secondary)' : 'var(--text-primary)' }}
                    aria-label="Chat input"
                />

                {/* Send button: round amber, 32px */}
                <button
                    onClick={() => {
                        if (onboardingStep === 'name') handleNameSubmit();
                        else if (onboardingStep === 'contact') handleContactSubmit();
                        else sendMessage();
                    }}
                    disabled={busy || (onboardingStep === 'done' && !input.trim())}
                    style={{
                        background: (onboardingStep !== 'done' || (input.trim() && !busy)) ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: (onboardingStep !== 'done' || (input.trim() && !busy)) ? 'pointer' : 'not-allowed',
                        color: (onboardingStep !== 'done' || (input.trim() && !busy)) ? '#09090b' : 'rgba(255,255,255,0.2)',
                        flexShrink: 0,
                        transition: 'background 0.15s, color 0.15s',
                        opacity: busy && onboardingStep === 'done' ? 0.4 : 1,
                    }}
                    aria-label="Send"
                >
                    <Send size={14} />
                </button>
            </div>
        </div>
    );
});

export default Twin;
