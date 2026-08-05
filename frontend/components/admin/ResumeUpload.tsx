'use client';

import { useState } from 'react';

interface ResumeUploadProps {
    adminFetch: (path: string, options?: RequestInit) => Promise<Response>;
    onBack: () => void;
}

export default function ResumeUpload({ adminFetch, onBack }: ResumeUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'submitted' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const upload = async () => {
        if (!file) return;
        setStatus('uploading');
        setErrorMessage('');
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await adminFetch('/admin/resume', { method: 'POST', body: formData });
            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                throw new Error(body.detail || `Upload failed (${response.status})`);
            }
            setStatus('submitted');
        } catch (err) {
            setStatus('error');
            setErrorMessage(err instanceof Error ? err.message : 'Upload failed');
        }
    };

    return (
        <div className="glass p-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-semibold">Update resume</h1>
                <button onClick={onBack} className="text-sm text-[var(--text-secondary)] underline">
                    Back
                </button>
            </div>

            {status === 'submitted' ? (
                <p className="text-sm text-[var(--text-secondary)]">
                    Submitted — check GitHub Actions for the &quot;Resume Update&quot; workflow run.
                    The site will redeploy automatically once it finishes.
                </p>
            ) : (
                <>
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={e => setFile(e.target.files?.[0] ?? null)}
                        className="block mb-4 text-sm"
                    />
                    {status === 'error' && (
                        <p className="text-sm mb-3" style={{ color: '#f87171' }}>{errorMessage}</p>
                    )}
                    <button
                        onClick={upload}
                        disabled={!file || status === 'uploading'}
                        className="hover-accent"
                        style={{
                            background: 'var(--accent)',
                            border: 'none',
                            borderRadius: '0',
                            padding: '8px 20px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: 'var(--icon-on-accent)',
                            cursor: 'pointer',
                            opacity: !file || status === 'uploading' ? 0.5 : 1,
                        }}
                    >
                        {status === 'uploading' ? 'Uploading...' : 'Upload'}
                    </button>
                </>
            )}
        </div>
    );
}
