'use client';

import { useEffect, useState } from 'react';
import AdminLogin from '@/components/admin/AdminLogin';
import ConversationInbox, { ConversationSummary } from '@/components/admin/ConversationInbox';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type View = 'login' | 'inbox' | 'thread';

export default function AdminPage() {
    const [adminToken, setAdminToken] = useState<string | null>(null);
    const [view, setView] = useState<View>('login');
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);

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
                    <ConversationInbox conversations={conversations} onSelect={() => {}} />
                )}
            </div>
        </main>
    );
}
