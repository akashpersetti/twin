'use client';

import { useEffect, useState } from 'react';
import { Github, Linkedin, Mail, PenLine, BookOpen, Send, CheckCircle2, AlertCircle, MoveUpRight } from 'lucide-react';
import { resume } from '@/data/resume';
import SectionReveal from '@/components/ui/SectionReveal';
import SectionHeader from '@/components/ui/SectionHeader';

const SOCIALS = [
  { href: resume.basics.githubUrl,   label: 'GitHub',   sub: resume.basics.github,   Icon: Github },
  { href: resume.basics.linkedinUrl, label: 'LinkedIn', sub: resume.basics.linkedin, Icon: Linkedin },
  { href: resume.basics.devToUrl,    label: 'dev.to',   sub: resume.basics.devTo,    Icon: PenLine },
  { href: resume.basics.hashnodeUrl, label: 'Hashnode', sub: resume.basics.hashnode, Icon: BookOpen },
  { href: 'mailto:akash.hp@icloud.com', label: 'Email', sub: 'akash.hp@icloud.com',  Icon: Mail },
];

export default function Contact() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  useEffect(() => {
    if (status !== 'sent' && status !== 'error') return;
    const t = setTimeout(() => setStatus('idle'), 8000);
    return () => clearTimeout(t);
  }, [status]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const res = await fetch('https://formsubmit.co/ajax/akash.hp@icloud.com', {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        setStatus('sent');
        form.reset();
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <section className="py-24 px-6 section-border">
      <div className="max-w-5xl mx-auto">
        <SectionHeader
          eyebrow="Contact"
          title="Let's ship something real"
          note="Open to AI Engineer & SWE roles, collabs, and hard problems."
        />

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-5">
          {/* Form: left 3 cols */}
          <SectionReveal className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="space-y-3">
              {status === 'sent' && (
                <div role="status" className="flex items-start gap-3 rounded-xl border border-green-500/25 bg-green-500/10 px-4 py-3.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-green-100">Message sent!</p>
                    <p className="mt-0.5 text-xs text-green-200/70">Thanks for reaching out. I&apos;ll get back to you within 1 hour.</p>
                  </div>
                </div>
              )}
              {status === 'error' && (
                <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3.5">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <div>
                    <p className="text-sm font-medium text-red-100">Couldn&apos;t send your message</p>
                    <p className="mt-0.5 text-xs text-red-200/70">Try again in a moment, or email me directly via the links on the right.</p>
                  </div>
                </div>
              )}

              <input type="hidden" name="_subject" value="Portfolio contact" />
              <input type="text" name="_honey" className="hidden" tabIndex={-1} autoComplete="off" />

              <div className="border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.08]">
                <div className="flex items-center gap-4 px-5 py-4 focus-within:bg-white/[0.02] transition-colors">
                  <label htmlFor="contact-email" className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] w-16" style={{ color: '#52525b' }}>
                    From
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    name="email"
                    required
                    placeholder="your@email.com"
                    className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-700"
                  />
                </div>
                <div className="flex items-start gap-4 px-5 py-4 focus-within:bg-white/[0.02] transition-colors">
                  <label htmlFor="contact-message" className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] w-16 pt-0.5" style={{ color: '#52525b' }}>
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={6}
                    placeholder="Tell me what you're building or just say hi…"
                    className="flex-1 resize-none bg-transparent text-sm text-white outline-none leading-relaxed placeholder:text-zinc-700"
                  />
                </div>
                <div className="flex items-center justify-between px-5 py-3.5 bg-white/[0.015]">
                  <span
                    className="text-[11px] tabular-nums"
                    style={{
                      color: status === 'sent' ? 'rgba(74,222,128,0.9)' : status === 'error' ? 'rgba(248,113,113,0.9)' : '#71717a',
                    }}
                  >
                    {status === 'sent' ? 'Message delivered' : status === 'error' ? 'Send failed, try again' : status === 'sending' ? 'Sending…' : 'Reply within 1 hour'}
                  </span>
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-xs font-semibold text-white transition-all hover:bg-white/10 hover:border-white/25 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {status === 'sending' ? 'Sending…' : status === 'sent' ? 'Send another' : 'Send message'}
                    <Send className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>
                </div>
              </div>
            </form>
          </SectionReveal>

          {/* Socials: right 2 cols */}
          <SectionReveal delay={0.1} className="lg:col-span-2">
            <div className="flex flex-col justify-between gap-10 h-full">
              <div className="space-y-4">
                {SOCIALS.map(({ href, label, sub, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between border-b border-white/[0.06] pb-4 transition-colors hover:border-white/20"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 transition-colors group-hover:text-white" style={{ color: '#52525b' }} />
                      <div>
                        <div className="text-sm font-medium transition-colors group-hover:text-white" style={{ color: '#d4d4d8' }}>{label}</div>
                        <div className="text-[10px]" style={{ color: '#52525b' }}>{sub}</div>
                      </div>
                    </div>
                    <MoveUpRight className="w-3.5 h-3.5 transition-all group-hover:text-white group-hover:-translate-y-0.5 group-hover:translate-x-0.5" style={{ color: '#3f3f46' }} />
                  </a>
                ))}
              </div>
              <p className="text-xs" style={{ color: '#3f3f46' }}>
                © {new Date().getFullYear()} {resume.basics.name}
              </p>
            </div>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}
