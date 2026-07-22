'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resume } from '@/data/resume';
import SectionReveal from '@/components/ui/SectionReveal';
import SectionHeader from '@/components/ui/SectionHeader';
import { Github, ExternalLink } from 'lucide-react';

function ProjectLinks({ project, active }: { project: typeof resume.projects[number]; active: boolean }) {
  const githubUrl = 'githubUrl' in project ? project.githubUrl : undefined;
  const liveUrl = 'liveUrl' in project ? project.liveUrl : undefined;

  if (!githubUrl && !liveUrl) return null;
  return (
    <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
      {githubUrl && (
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${project.title} on GitHub`}
          className="inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors hover:bg-white/10"
          style={{
            border: '1px solid var(--border)',
            color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
          }}
        >
          <Github size={13} />
        </a>
      )}
      {liveUrl && (
        <a
          href={liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${project.title} live link`}
          className="inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors hover:bg-white/10"
          style={{
            border: '1px solid var(--border)',
            color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
          }}
        >
          <ExternalLink size={13} />
        </a>
      )}
    </div>
  );
}

function TechPill({ label }: { label: string }) {
  return (
    <span
      className="mono text-[11px] px-2.5 py-1 rounded-md font-medium"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border)',
        color: '#d4d4d8',
      }}
    >
      {label}
    </span>
  );
}

export default function Projects() {
  const [active, setActive] = useState(0);

  return (
    <section className="py-24 px-6 section-border">
      <div className="max-w-4xl mx-auto">
        <SectionHeader
          eyebrow="Selected work"
          title="Built, shipped, measured"
          note="Agentic systems and LLM products — most serverless on AWS."
        />

        <SectionReveal>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {resume.projects.map((project, i) => {
              const on = i === active;
              return (
                <div
                  key={project.title}
                  onClick={() => setActive(on ? -1 : i)}
                  className={`group relative cursor-pointer transition-all ${on ? 'py-7' : 'py-5'}`}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {/* Active accent bar */}
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-px transition-opacity"
                    style={{ background: 'var(--accent)', opacity: on ? 1 : 0 }}
                  />

                  {/* Row header */}
                  <div className="flex items-center gap-4 sm:gap-6 pl-4">
                    <span
                      className="mono w-8 text-[11px] tabular-nums shrink-0 transition-colors"
                      style={{ color: on ? 'var(--accent)' : '#3f3f46' }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-medium tracking-tight transition-all ${
                          on ? 'text-2xl sm:text-3xl' : 'text-base sm:text-lg'
                        }`}
                        style={{ color: on ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                      >
                        {project.title}
                      </h3>
                      {on && (
                        <p className="mt-1 text-sm font-medium" style={{ color: 'var(--accent)' }}>
                          {project.subtitle}
                        </p>
                      )}
                    </div>
                    <ProjectLinks project={project} active={on} />
                  </div>

                  {/* Expanded body */}
                  <AnimatePresence initial={false}>
                    {on && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className="mt-5 grid grid-cols-1 gap-5 pl-4 sm:grid-cols-3 sm:gap-8 sm:pl-[56px]">
                          <ul className="sm:col-span-2 space-y-2">
                            {project.bullets.map((bullet, bi) => (
                              <li
                                key={bi}
                                className="flex gap-2 text-[13px] leading-relaxed"
                                style={{ color: 'var(--text-secondary)' }}
                              >
                                <span
                                  className="mt-1.5 flex-shrink-0 w-1 h-1 rounded-full"
                                  style={{ background: 'var(--accent)' }}
                                />
                                {bullet}
                              </li>
                            ))}
                          </ul>
                          <div className="flex flex-wrap gap-2 content-start sm:justify-end">
                            {project.tech.map(t => (
                              <TechPill key={t} label={t} />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </SectionReveal>

        <div className="mt-10 flex justify-center">
          <a
            href="https://github.com/akashpersetti"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition-colors hover:bg-white/10"
            style={{
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.05)',
              color: '#d4d4d8',
            }}
          >
            <Github size={16} />
            View more on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
