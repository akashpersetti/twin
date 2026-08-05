'use client';

export interface ConversationSummary {
    conversation_id: string;
    last_activity: string;
    needs_attention: boolean;
    unread_count: number;
    preview: string;
    controlled_by: string;
}

interface ConversationInboxProps {
    conversations: ConversationSummary[];
    onSelect: (conversationId: string) => void;
}

export default function ConversationInbox({ conversations, onSelect }: ConversationInboxProps) {
    return (
        <div className="glass p-2">
            <div className="px-4 py-3">
                <p className="eyebrow mb-1">Admin</p>
                <h1 className="text-xl font-semibold">Conversations</h1>
            </div>
            {conversations.length === 0 ? (
                <p className="px-4 pb-4 text-sm text-[var(--text-secondary)]">No conversations yet.</p>
            ) : (
                <div className="flex flex-col">
                    {conversations.map(c => (
                        <button
                            key={c.conversation_id}
                            onClick={() => onSelect(c.conversation_id)}
                            className="text-left px-4 py-3 flex items-start justify-between gap-3 glass-hover"
                            style={{ borderTop: '1px solid var(--border)' }}
                        >
                            <div className="min-w-0">
                                <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                                    {c.preview || '(no messages)'}
                                </p>
                                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                    {new Date(c.last_activity).toLocaleString()}
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                                {c.controlled_by === 'human' && (
                                    <span
                                        className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 border"
                                        style={{ background: 'var(--accent-wash)', color: 'var(--accent-ink)', borderColor: 'var(--border)' }}
                                    >
                                        Human controlling
                                    </span>
                                )}
                                {c.needs_attention && (
                                    <span
                                        className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 border"
                                        style={{ background: 'var(--accent-wash)', color: 'var(--accent-ink)', borderColor: 'var(--border)' }}
                                    >
                                        Needs attention
                                    </span>
                                )}
                                {c.unread_count > 0 && (
                                    <span
                                        className="text-[10px] font-semibold px-2 py-0.5 border"
                                        style={{ background: 'var(--surface-3)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                                    >
                                        {c.unread_count} unread
                                    </span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
