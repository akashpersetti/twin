'use client';

import { useEffect, useState } from 'react';

interface AdminLoginProps {
    apiUrl: string;
    onLoggedIn: (token: string) => void;
}

export default function AdminLogin({ apiUrl, onLoggedIn }: AdminLoginProps) {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const magic = params.get('magic');
        if (!magic) return;

        window.history.replaceState(null, '', window.location.pathname);
        setVerifying(true);
        fetch(`${apiUrl}/admin/auth/verify?token=${encodeURIComponent(magic)}`)
            .then(response => {
                if (!response.ok) throw new Error('Invalid or expired link');
                return response.json();
            })
            .then(data => onLoggedIn(data.admin_token))
            .catch(() => setError(true))
            .finally(() => setVerifying(false));
    }, [apiUrl, onLoggedIn]);

    const requestLink = async () => {
        if (!email.trim()) return;
        await fetch(`${apiUrl}/admin/auth/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim() }),
        }).catch(() => {});
        setSent(true);
    };

    if (verifying) {
        return <p className="text-sm text-[var(--text-secondary)]">Signing you in...</p>;
    }

    return (
        <div className="glass p-6">
            <p className="eyebrow mb-2">Admin</p>
            <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
            {error && (
                <p className="text-sm mb-3" style={{ color: '#f87171' }}>
                    That link is invalid or expired. Request a new one below.
                </p>
            )}
            {sent ? (
                <p className="text-sm text-[var(--text-secondary)]">
                    If that email is recognized, a sign-in link is on its way. Check your inbox.
                </p>
            ) : (
                <div className="flex gap-2">
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') requestLink(); }}
                        placeholder="you@example.com"
                        className="flex-1 min-w-0 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm outline-none placeholder:text-zinc-600"
                        style={{ color: 'var(--text-primary)' }}
                    />
                    <button
                        onClick={requestLink}
                        style={{
                            background: 'var(--accent)',
                            border: 'none',
                            borderRadius: '999px',
                            padding: '8px 20px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: '#09090b',
                            cursor: 'pointer',
                        }}
                    >
                        Send link
                    </button>
                </div>
            )}
        </div>
    );
}
