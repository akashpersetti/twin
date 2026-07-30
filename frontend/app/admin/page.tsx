'use client';

import { useEffect, useState } from 'react';
import AdminLogin from '@/components/admin/AdminLogin';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type View = 'login' | 'inbox' | 'thread';

export default function AdminPage() {
    const [adminToken, setAdminToken] = useState<string | null>(null);
    const [view, setView] = useState<View>('login');

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
                    <p className="text-sm text-[var(--text-secondary)]">Inbox coming in Task 2.</p>
                )}
            </div>
        </main>
    );
}
