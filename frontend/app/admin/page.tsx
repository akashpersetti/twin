'use client';

import { useEffect, useRef, useState } from 'react';
import AdminLogin from '@/components/admin/AdminLogin';
import ConversationInbox, { ConversationSummary } from '@/components/admin/ConversationInbox';
import ConversationThread, { AdminMessage } from '@/components/admin/ConversationThread';
import ResumeUpload from '@/components/admin/ResumeUpload';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type View = 'login' | 'inbox' | 'thread' | 'resume';

export default function AdminPage() {
    const [adminToken, setAdminToken] = useState<string | null>(null);
    const [view, setView] = useState<View>('login');
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [threadMessages, setThreadMessages] = useState<AdminMessage[]>([]);
    const [controlledBy, setControlledBy] = useState<string>('bot');
    const lastAdminPolledCountRef = useRef(0);
    const adminReplyInFlightRef = useRef(false);

    const adminFetch = async (path: string, options: RequestInit = {}) => {
        const response = await fetch(`${API_URL}${path}`, {
            ...options,
            headers: {
                ...options.headers,
                Authorization: `Bearer ${adminToken}`,
            },
        });
        if (response.status === 401) {
            localStorage.removeItem('admin_token');
            setAdminToken(null);
            setView('login');
        }
        return response;
    };

    const loadConversations = async () => {
        const response = await adminFetch('/admin/conversations');
        if (response.ok) {
            const data = await response.json();
            setConversations(data.conversations ?? []);
        }
    };

    useEffect(() => {
        if (adminToken && view === 'inbox') {
            loadConversations();
        }
    }, [adminToken, view]); // eslint-disable-line react-hooks/exhaustive-deps

    const openConversation = async (conversationId: string) => {
        const response = await adminFetch(`/admin/conversations/${conversationId}`);
        if (response.ok) {
            const data = await response.json();
            const messages = data.messages ?? [];
            setThreadMessages(messages);
            lastAdminPolledCountRef.current = messages.length;
            setControlledBy(data.controlled_by ?? 'bot');
            setSelectedId(conversationId);
            setView('thread');
        }
    };

    const closeThread = () => {
        setSelectedId(null);
        setThreadMessages([]);
        lastAdminPolledCountRef.current = 0;
        setControlledBy('bot');
        setView('inbox');
    };

    const sendReply = async (content: string) => {
        if (!selectedId) return;
        adminReplyInFlightRef.current = true;
        try {
            const response = await adminFetch(`/admin/conversations/${selectedId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });
            if (response.ok) {
                const data = await response.json();
                const messages = data.messages ?? [];
                setThreadMessages(messages);
                lastAdminPolledCountRef.current = messages.length;
                setControlledBy(data.controlled_by ?? 'human');
            }
        } finally {
            adminReplyInFlightRef.current = false;
        }
    };

    const returnControl = async () => {
        if (!selectedId) return;
        const response = await adminFetch(`/admin/conversations/${selectedId}/return-control`, {
            method: 'POST',
        });
        if (response.ok) {
            const data = await response.json();
            const messages = data.messages ?? [];
            setThreadMessages(messages);
            lastAdminPolledCountRef.current = messages.length;
            setControlledBy(data.controlled_by ?? 'bot');
        }
    };

    useEffect(() => {
        if (view !== 'thread' || !selectedId) return;

        let cancelled = false;
        let pollInFlight = false;

        const poll = async () => {
            if (pollInFlight || adminReplyInFlightRef.current) return;
            pollInFlight = true;
            try {
                const response = await adminFetch(`/admin/conversations/${selectedId}`);
                if (cancelled) return;
                if (response.ok) {
                    const data = await response.json();
                    if (cancelled) return;
                    const allMessages: AdminMessage[] = data.messages ?? [];
                    setControlledBy(data.controlled_by ?? 'bot');
                    const newOnes = allMessages.slice(lastAdminPolledCountRef.current);
                    if (newOnes.length > 0) {
                        setThreadMessages(prev => [...prev, ...newOnes]);
                    }
                    lastAdminPolledCountRef.current = allMessages.length;
                }
            } finally {
                pollInFlight = false;
            }
        };

        const intervalId = setInterval(poll, 5_000);

        return () => {
            cancelled = true;
            clearInterval(intervalId);
        };
    }, [view, selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const stored = localStorage.getItem('admin_token');
        if (stored) {
            setAdminToken(stored);
            setView('inbox');
        }
    }, []);

    const handleLoggedIn = (token: string) => {
        localStorage.setItem('admin_token', token);
        setAdminToken(token);
        setView('inbox');
    };

    return (
        <main className="py-24 px-6">
            <div className="max-w-2xl mx-auto">
                {view === 'login' && <AdminLogin apiUrl={API_URL} onLoggedIn={handleLoggedIn} />}
                {view === 'inbox' && (
                    <>
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={() => setView('resume')}
                                className="text-sm text-[var(--text-secondary)] underline"
                            >
                                Update resume
                            </button>
                        </div>
                        <ConversationInbox conversations={conversations} onSelect={openConversation} />
                    </>
                )}
                {view === 'thread' && selectedId && (
                    <ConversationThread
                        messages={threadMessages}
                        controlledBy={controlledBy}
                        onBack={closeThread}
                        onSend={sendReply}
                        onReturnControl={returnControl}
                    />
                )}
                {view === 'resume' && (
                    <ResumeUpload adminFetch={adminFetch} onBack={() => setView('inbox')} />
                )}
            </div>
        </main>
    );
}
