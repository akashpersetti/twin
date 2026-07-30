'use client';

import { useState } from 'react';

export interface AdminMessage {
    role: string;
    content: string;
    timestamp: string;
}

interface ConversationThreadProps {
    messages: AdminMessage[];
    onBack: () => void;
    onSend: (content: string) => Promise<void>;
}

export default function ConversationThread({ messages, onBack, onSend }: ConversationThreadProps) {
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);

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

    return (
        <div className="glass p-4">
            <button onClick={onBack} className="text-sm mb-4" style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                ← Back to conversations
            </button>

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
