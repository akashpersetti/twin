'use client';

import { useState } from 'react';

export interface AdminMessage {
    role: string;
    content: string;
    timestamp: string;
}

interface ConversationThreadProps {
    messages: AdminMessage[];
    controlledBy: string;
    onBack: () => void;
    onSend: (content: string) => Promise<void>;
    onReturnControl: () => Promise<void>;
}

export default function ConversationThread({ messages, controlledBy, onBack, onSend, onReturnControl }: ConversationThreadProps) {
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);
    const [returning, setReturning] = useState(false);

    const handleSend = async () => {
        const content = reply.trim();
        if (!content || sending) return;
        setSending(true);
        try {
            await onSend(content);
            setReply('');
        } finally {
            setSending(false);
        }
    };

    const handleReturnControl = async () => {
        if (returning) return;
        setReturning(true);
        try {
            await onReturnControl();
        } finally {
            setReturning(false);
        }
    };

    return (
        <div className="glass p-4">
            <div className="flex items-center justify-between mb-4">
                <button onClick={onBack} className="text-sm" style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    ← Back to conversations
                </button>
                {controlledBy === 'human' && (
                    <button
                        onClick={handleReturnControl}
                        disabled={returning}
                        className="text-sm"
                        style={{
                            color: 'var(--accent)',
                            background: 'none',
                            border: '1px solid var(--border)',
                            borderRadius: '999px',
                            cursor: returning ? 'not-allowed' : 'pointer',
                            padding: '4px 12px',
                            opacity: returning ? 0.5 : 1,
                        }}
                    >
                        Return to bot
                    </button>
                )}
            </div>

            <div className="flex flex-col gap-3 mb-4">
                {messages.map((m, idx) => {
                    if (m.role === 'user') {
                        return (
                            <div key={idx} className="flex justify-end">
                                <div
                                    className="max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2.5 text-[13px] leading-relaxed"
                                    style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.18)', color: '#fafafa' }}
                                >
                                    {m.content}
                                </div>
                            </div>
                        );
                    }
                    if (m.role === 'human') {
                        return (
                            <div key={idx} className="flex justify-start">
                                <div
                                    className="max-w-[85%] rounded-2xl rounded-bl-md px-3.5 py-2.5 text-[13px] leading-relaxed"
                                    style={{
                                        background: 'rgba(255,255,255,0.04)',
                                        borderTop: '1px solid rgba(251,191,36,0.18)',
                                        borderRight: '1px solid rgba(251,191,36,0.18)',
                                        borderBottom: '1px solid rgba(251,191,36,0.18)',
                                        borderLeft: '2px solid var(--accent)',
                                        color: '#d4d4d8',
                                    }}
                                >
                                    <p style={{ color: 'var(--accent)', fontSize: '0.7em', fontWeight: 600, marginBottom: '0.25em', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Akash
                                    </p>
                                    {m.content}
                                </div>
                            </div>
                        );
                    }
                    if (m.role === 'system') {
                        return (
                            <div key={idx} className="flex justify-center">
                                <span
                                    className="text-[11px] px-3 py-1 rounded-full"
                                    style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                                >
                                    {m.content}
                                </span>
                            </div>
                        );
                    }
                    return (
                        <div key={idx} className="flex justify-start">
                            <div
                                className="max-w-[85%] rounded-2xl rounded-bl-md px-3.5 py-2.5 text-[13px] leading-relaxed"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#d4d4d8' }}
                            >
                                {m.content}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                <input
                    type="text"
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                    placeholder="Reply as Akash..."
                    disabled={sending}
                    className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-zinc-600"
                    style={{ color: 'var(--text-primary)' }}
                />
                <button
                    onClick={handleSend}
                    disabled={sending || !reply.trim()}
                    style={{
                        background: reply.trim() && !sending ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '999px',
                        padding: '6px 16px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: reply.trim() && !sending ? '#09090b' : 'rgba(255,255,255,0.3)',
                        cursor: reply.trim() && !sending ? 'pointer' : 'not-allowed',
                    }}
                >
                    Send
                </button>
            </div>
        </div>
    );
}
