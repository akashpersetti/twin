'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

const MONO = 'var(--font-geist-mono), "JetBrains Mono", "Fira Code", monospace';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const mdComponents: Components = {
    p: ({ children }) => <p style={{ marginBottom: '0.4em', lineHeight: 1.65 }}>{children}</p>,
    ul: ({ children }) => <ul style={{ marginBottom: '0.4em', marginLeft: '1.2em', listStyleType: 'disc' }}>{children}</ul>,
    ol: ({ children }) => <ol style={{ marginBottom: '0.4em', marginLeft: '1.2em', listStyleType: 'decimal' }}>{children}</ol>,
    li: ({ children }) => <li style={{ lineHeight: 1.65, marginBottom: '0.1em' }}>{children}</li>,
    strong: ({ children }) => <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{children}</strong>,
    em: ({ children }) => <em style={{ color: '#a78bfa' }}>{children}</em>,
    h1: ({ children }) => <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.88em', marginBottom: '0.35em', marginTop: '0.75em', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{children}</p>,
    h2: ({ children }) => <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.83em', marginBottom: '0.3em', marginTop: '0.6em', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{children}</p>,
    h3: ({ children }) => <p style={{ color: '#c4b5fd', fontWeight: 600, fontSize: '0.83em', marginBottom: '0.25em', marginTop: '0.5em' }}>{children}</p>,
    code: ({ children, className }) => {
        const isBlock = className?.includes('language-');
        return isBlock ? (
            <code style={{ display: 'block', fontFamily: MONO, fontSize: '0.78em', lineHeight: 1.6, overflowX: 'auto', padding: '0.55em 0.75em', margin: '0.35em 0', borderRadius: 4, background: 'rgba(0,0,0,0.12)', color: '#86efac', border: '1px solid rgba(124,58,237,0.2)' }}>
                {children}
            </code>
        ) : (
            <code style={{ fontFamily: MONO, fontSize: '0.82em', padding: '0.1em 0.3em', borderRadius: 3, background: 'rgba(124,58,237,0.15)', color: '#c4b5fd' }}>
                {children}
            </code>
        );
    },
    pre: ({ children }) => <pre style={{ overflow: 'auto', margin: '0.35em 0' }}>{children}</pre>,
    blockquote: ({ children }) => (
        <blockquote style={{ borderLeft: '2px solid #7c3aed', paddingLeft: '0.7em', margin: '0.35em 0', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{children}</blockquote>
    ),
    a: ({ href, children }) => (
        <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#06b6d4', textDecoration: 'underline', textUnderlineOffset: '2px' }}>{children}</a>
    ),
};

export default function Twin() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [sessionId, setSessionId] = useState<string>('');
    const [inputFocused, setInputFocused] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const hiddenInputRef = useRef<HTMLInputElement>(null);

    const [avatarError, setAvatarError] = useState(false);
    const avatarSrc = `/avatar.png${typeof process.env.NEXT_PUBLIC_AVATAR_VERSION === 'string' ? `?v=${process.env.NEXT_PUBLIC_AVATAR_VERSION}` : ''}`;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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
            setTimeout(() => hiddenInputRef.current?.focus(), 50);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const busy = isLoading || isStreaming;

    return (
        <div
            className="flex flex-col h-full"
            style={{ background: 'var(--bg-base)', fontFamily: MONO, fontSize: '13px' }}
        >
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5" style={{ overflowX: 'hidden' }}>

                {/* Empty state */}
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-4 select-none">
                        {!avatarError ? (
                            <img
                                src={avatarSrc}
                                alt="Akash"
                                onError={() => setAvatarError(true)}
                                style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(124,58,237,0.4)', filter: 'grayscale(15%)' }}
                            />
                        ) : (
                            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#fff' }}>A</div>
                        )}
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>Hello!</p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85em' }}>Ask me anything</p>
                        </div>
                        <p style={{ color: 'var(--border-glass)', fontSize: '0.75em' }}>────────────────────</p>
                    </div>
                )}

                {messages.map((message, idx) => {
                    const isLastAssistant = message.role === 'assistant' && idx === messages.length - 1 && isStreaming;
                    return (
                        <div key={message.id} style={{ display: 'flex', flexDirection: 'column', alignItems: message.role === 'user' ? 'flex-end' : 'flex-start', minWidth: 0, width: '100%' }}>
                            {/* Label + timestamp */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em', marginBottom: '0.25em' }}>
                                <span style={{
                                    fontWeight: 700,
                                    fontSize: '0.72em',
                                    letterSpacing: '0.1em',
                                    color: message.role === 'user' ? '#06b6d4' : '#7c3aed',
                                }}>
                                    {message.role === 'user' ? 'YOU' : '◆ AKASH'}
                                </span>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.68em', opacity: 0.5 }}>
                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            {/* Bubble */}
                            <div style={{
                                maxWidth: '88%',
                                paddingLeft: '0.75em',
                                borderLeft: `2px solid ${message.role === 'user' ? '#06b6d4' : '#7c3aed'}`,
                                color: message.role === 'user' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                lineHeight: 1.65,
                                textAlign: 'left',
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                minWidth: 0,
                            }}>
                                {message.role === 'assistant' ? (
                                    <>
                                        <ReactMarkdown components={mdComponents}>{message.content}</ReactMarkdown>
                                        {isLastAssistant && (
                                            <span style={{ color: '#7c3aed', display: 'inline-block', marginLeft: '1px' }}>▋</span>
                                        )}
                                    </>
                                ) : (
                                    <span>{message.content}</span>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Loading state (before first chunk) */}
                {isLoading && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.72em', letterSpacing: '0.1em', color: '#7c3aed', marginBottom: '0.25em' }}>◆ AKASH</span>
                        <div style={{ paddingLeft: '0.75em', borderLeft: '2px solid #7c3aed' }}>
                            <span style={{ color: '#7c3aed' }}>▋</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Terminal input */}
            <div
                style={{ borderTop: '1px solid var(--border-glass)', padding: '10px 16px', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'text' }}
                onClick={() => hiddenInputRef.current?.focus()}
            >
                <span style={{ color: '#06b6d4', fontWeight: 700, flexShrink: 0, userSelect: 'none' }}>❯</span>

                {/* Visual display of typed text + block cursor */}
                <div style={{ flex: 1, position: 'relative', minHeight: '1.4em', display: 'flex', alignItems: 'center' }}>
                    <span style={{ color: busy ? 'var(--text-secondary)' : 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {input}
                    </span>
                    {inputFocused && !busy && (
                        <span style={{ color: '#06b6d4', display: 'inline-block', lineHeight: 1 }}>▋</span>
                    )}
                    {!input && !inputFocused && (
                        <span style={{ color: 'var(--text-secondary)', opacity: 0.35, position: 'absolute', left: 0, pointerEvents: 'none', userSelect: 'none' }}>
                            ask something...
                        </span>
                    )}
                    {/* Hidden real input to capture keystrokes */}
                    <input
                        ref={hiddenInputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setInputFocused(true)}
                        onBlur={() => setInputFocused(false)}
                        disabled={busy}
                        autoFocus
                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'text', width: '100%' }}
                        aria-label="Chat input"
                    />
                </div>

                <button
                    onClick={sendMessage}
                    disabled={!input.trim() || busy}
                    style={{ background: 'none', border: 'none', cursor: !input.trim() || busy ? 'not-allowed' : 'pointer', color: !input.trim() || busy ? 'var(--border-glass)' : '#7c3aed', fontFamily: MONO, fontSize: '14px', padding: '0 4px', flexShrink: 0, transition: 'color 0.15s' }}
                    aria-label="Send"
                >
                    ⏎
                </button>
            </div>
        </div>
    );
}
