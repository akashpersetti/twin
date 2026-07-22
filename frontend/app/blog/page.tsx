'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

interface Post {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  date: string;
  updated: string;
  status: 'draft' | 'published';
  last_modified: string;
}

interface PostDetail extends Post {
  body: string;
}

interface PostForm {
  title: string;
  slug: string;
  summary: string;
  tags: string;
  date: string;
  body: string;
}

type View = 'list' | 'edit' | 'create';

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function BlogManager() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('ahadagal@alumni.iu.edu');
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [linkSent, setLinkSent] = useState(false);
  const [sendingLink, setSendingLink] = useState(false);
  const [view, setView] = useState<View>('list');
  const [posts, setPosts] = useState<Post[]>([]);
  const [form, setForm] = useState<PostForm>({
    title: '', slug: '', summary: '', tags: '', date: new Date().toISOString().split('T')[0], body: '',
  });
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const authInitialized = useRef(false);

  const loadPosts = useCallback(async (tok: string) => {
    setLoading(true);
    const res = await fetch(`${API_BASE}/api/posts`, { headers: authHeader(tok) });
    setLoading(false);
    if (res.ok) setPosts((await res.json()).posts ?? []);
  }, []);

  useEffect(() => {
    if (authInitialized.current) return;
    authInitialized.current = true;

    async function initializeAuth() {
      const url = new URL(window.location.href);
      const magicToken = url.searchParams.get('magic');

      if (magicToken) {
        try {
          const response = await fetch(
            `${API_BASE}/api/auth/verify?token=${encodeURIComponent(magicToken)}`,
          );
          if (!response.ok) throw new Error('Magic-link verification failed');

          const data: { admin_token?: unknown } = await response.json();
          if (typeof data.admin_token !== 'string' || !data.admin_token) {
            throw new Error('Magic-link response did not include an admin token');
          }

          localStorage.setItem('blog_token', data.admin_token);
          setToken(data.admin_token);
          await loadPosts(data.admin_token);
        } catch {
          setAuthError('This magic link is invalid or has expired.');
        } finally {
          url.searchParams.delete('magic');
          history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
          setAuthLoading(false);
        }
        return;
      }

      const saved = localStorage.getItem('blog_token');
      if (saved) {
        setToken(saved);
        await loadPosts(saved);
      }
      setAuthLoading(false);
    }

    void initializeAuth();
  }, [loadPosts]);

  async function handleMagicLinkRequest(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setSendingLink(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error('Magic-link request failed');
      setLinkSent(true);
    } catch {
      setAuthError('Unable to send a magic link. Please try again.');
    } finally {
      setSendingLink(false);
    }
  }

  function handleSignOut() {
    localStorage.removeItem('blog_token');
    setToken('');
    setPosts([]);
    setMsg('');
    setView('list');
    setEditingSlug(null);
    setDeleteTarget(null);
    setLinkSent(false);
    setAuthError('');
  }

  function startCreate() {
    setForm({ title: '', slug: '', summary: '', tags: '', date: new Date().toISOString().split('T')[0], body: '' });
    setEditingSlug(null);
    setView('create');
  }

  async function startEdit(post: Post) {
    const res = await fetch(`${API_BASE}/api/posts/${post.slug}`, { headers: authHeader(token) });
    const data: PostDetail = await res.json();
    setForm({
      title: data.title,
      slug: data.slug,
      summary: data.summary,
      tags: (data.tags ?? []).join(', '),
      date: data.date,
      body: data.body,
    });
    setEditingSlug(post.slug);
    setView('edit');
  }

  async function handleSave(publish = false) {
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    setLoading(true);
    if (editingSlug) {
      await fetch(`${API_BASE}/api/posts/${editingSlug}`, {
        method: 'PUT',
        headers: authHeader(token),
        body: JSON.stringify({ title: form.title, summary: form.summary, tags, body: form.body }),
      });
      if (publish) await fetch(`${API_BASE}/api/posts/${editingSlug}/publish`, { method: 'POST', headers: authHeader(token) });
    } else {
      const res = await fetch(`${API_BASE}/api/posts`, {
        method: 'POST',
        headers: authHeader(token),
        body: JSON.stringify({ title: form.title, slug: form.slug, summary: form.summary, tags, date: form.date, body: form.body }),
      });
      const created = await res.json();
      if (publish) await fetch(`${API_BASE}/api/posts/${created.slug}/publish`, { method: 'POST', headers: authHeader(token) });
    }
    setLoading(false);
    setMsg(publish ? 'Saved and published. Rebuild triggered (~2 min).' : 'Draft saved.');
    await loadPosts(token);
    setView('list');
  }

  async function handleTogglePublish(post: Post) {
    const endpoint = post.status === 'published' ? 'unpublish' : 'publish';
    await fetch(`${API_BASE}/api/posts/${post.slug}/${endpoint}`, { method: 'POST', headers: authHeader(token) });
    setMsg(`${endpoint === 'publish' ? 'Published' : 'Unpublished'}. Rebuild triggered (~2 min).`);
    await loadPosts(token);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await fetch(`${API_BASE}/api/posts/${deleteTarget.slug}`, {
      method: 'DELETE',
      headers: authHeader(token),
      body: JSON.stringify({ confirm: true }),
    });
    setDeleteTarget(null);
    setMsg('Deleted.');
    await loadPosts(token);
  }

  // ── Auth gate ─────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Verifying sign-in…</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass" style={{ padding: '2rem', width: '100%', maxWidth: '360px' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Blog Manager</h1>
          {linkSent ? (
            <div>
              <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>Check your email</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Use the link in the email to sign in. It expires in 15 minutes.</p>
            </div>
          ) : (
            <form onSubmit={handleMagicLinkRequest} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ padding: '0.625rem 0.75rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', outline: 'none' }}
              />
              <button type="submit" disabled={sendingLink} style={{ background: 'var(--accent)', color: '#09090b', border: 'none', borderRadius: '8px', padding: '0.625rem', fontWeight: 600, cursor: sendingLink ? 'default' : 'pointer', opacity: sendingLink ? 0.7 : 1 }}>
                {sendingLink ? 'Sending…' : 'Send magic link'}
              </button>
            </form>
          )}
          {authError && <p style={{ color: '#f87171', fontSize: '0.8125rem', margin: '0.75rem 0 0' }}>{authError}</p>}
        </div>
      </div>
    );
  }

  // ── Post list ─────────────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '2rem 1rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Blog Manager</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button onClick={handleSignOut} style={{ background: 'transparent', color: 'var(--text-secondary)', border: 'none', padding: '0.25rem', fontSize: '0.8125rem', cursor: 'pointer', textDecoration: 'underline' }}>
                Sign out
              </button>
              <button onClick={startCreate} style={{ background: 'var(--accent)', color: '#09090b', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer' }}>
                + New Post
              </button>
            </div>
          </div>
          {msg && <p style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}>{msg}</p>}
          {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {posts.map(post => (
              <div key={post.slug} className="glass" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, margin: 0 }}>{post.title}</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0', fontFamily: 'var(--font-mono)' }}>{post.slug}</p>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.625rem', borderRadius: '999px', background: post.status === 'published' ? 'rgba(52,211,153,0.15)' : 'var(--surface-tint)', color: post.status === 'published' ? '#34d399' : 'var(--accent)' }}>
                  {post.status}
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{post.date}</span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button onClick={() => startEdit(post)} style={btnStyle()}>Edit</button>
                  <button onClick={() => handleTogglePublish(post)} style={btnStyle()}>{post.status === 'published' ? 'Unpublish' : 'Publish'}</button>
                  <button onClick={() => setDeleteTarget(post)} style={btnStyle('rgba(239,68,68,0.15)', '#ef4444')}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        {deleteTarget && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div className="glass" style={{ padding: '1.5rem', maxWidth: '400px', width: '100%' }}>
              <p style={{ fontWeight: 600, marginBottom: '1rem' }}>Delete &ldquo;{deleteTarget.title}&rdquo;? This cannot be undone.</p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => setDeleteTarget(null)} style={btnStyle()}>Cancel</button>
                <button onClick={handleDelete} style={btnStyle('rgba(239,68,68,0.15)', '#ef4444')}>Confirm Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Create / Edit form ────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <button onClick={() => setView('list')} style={{ ...btnStyle(), fontSize: '0.875rem' }}>← Back</button>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{editingSlug ? 'Edit Post' : 'New Post'}</h1>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Left: form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: editingSlug ? f.slug : slugify(e.target.value) }))} style={inputStyle()} />
            <input placeholder="slug" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} style={{ ...inputStyle(), fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }} />
            <input placeholder="One-line summary" value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} style={inputStyle()} />
            <input placeholder="Tags (comma-separated)" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} style={inputStyle()} />
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle()} />
            <textarea
              placeholder="Post body (Markdown)"
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              style={{ ...inputStyle(), minHeight: '420px', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => handleSave(false)} disabled={loading} style={{ ...btnStyle(), padding: '0.625rem 1rem' }}>Save Draft</button>
              <button onClick={() => handleSave(true)} disabled={loading} style={{ background: 'var(--accent)', color: '#09090b', border: 'none', borderRadius: '8px', padding: '0.625rem 1rem', fontWeight: 600, cursor: 'pointer' }}>
                Save & Publish
              </button>
            </div>
          </div>
          {/* Right: live preview */}
          <div style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem', overflowY: 'auto', maxHeight: '80vh' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginBottom: '1rem' }}>PREVIEW</p>
            <div style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: 'var(--text-primary)' }}>
              <ReactMarkdown>{form.body || '_Start typing to preview…_'}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function btnStyle(bg = 'rgba(255,255,255,0.08)', color = 'var(--text-primary)'): React.CSSProperties {
  return { background: bg, color, border: '1px solid var(--border)', borderRadius: '8px', padding: '0.375rem 0.75rem', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer' };
}

function inputStyle(): React.CSSProperties {
  return { padding: '0.625rem 0.75rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', outline: 'none', width: '100%', boxSizing: 'border-box' };
}
