'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resume } from '@/data/resume';
import SectionReveal from '@/components/ui/SectionReveal';
import SectionHeader from '@/components/ui/SectionHeader';
import { Github } from 'lucide-react';
import IconLinkButton from '@/components/ui/IconLinkButton';

type Project = typeof resume.projects[number];

function ProjectLinks({ project }: { project: Project }) {
  const githubUrl = 'githubUrl' in project ? project.githubUrl : undefined;
  const liveUrl = 'liveUrl' in project ? project.liveUrl : undefined;

  if (!githubUrl && !liveUrl) return null;
  return (
    <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
      {githubUrl && <IconLinkButton href={githubUrl} label={`${project.title} on GitHub`} />}
      {liveUrl && <IconLinkButton href={liveUrl} label={`${project.title} live link`} />}
    </div>
  );
}

function TechPill({ label }: { label: string }) {
  return <span className="tag font-medium">{label}</span>;
}

function FeaturedProject({ project }: { project: Project }) {
  return (
    <div className="row">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl sm:text-3xl font-medium tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {project.title}
          </h3>
          <p className="mt-1 text-sm font-medium" style={{ color: 'var(--accent)' }}>{project.subtitle}</p>
        </div>
        <ProjectLinks project={project} />
      </div>
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-8">
        <ul className="sm:col-span-2 space-y-2">
          {project.bullets.map((bullet, bi) => (
            <li key={bi} className="flex gap-2 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <span className="mt-1.5 flex-shrink-0 w-1 h-1 rounded-full" style={{ background: 'var(--accent)' }} />
              {bullet}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2 content-start sm:justify-end">
          {project.tech.map(t => <TechPill key={t} label={t} />)}
        </div>
      </div>
    </div>
  );
}

function GridProject({ project, index, on, onToggle }: {
  project: Project; index: number; on: boolean; onToggle: () => void;
}) {
  return (
    <div
      onClick={onToggle}
      className="cursor-pointer border-t pt-5 pb-2"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="mono text-[11px] tabular-nums" style={{ color: on ? 'var(--accent)' : 'var(--text-faint)' }}>
            {String(index + 1).padStart(2, '0')}
          </span>
          <h3 className="mt-1 text-base font-medium tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {project.title}
          </h3>
        </div>
        <ProjectLinks project={project} />
      </div>
      <AnimatePresence initial={false}>
        {on && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <ul className="mt-4 space-y-2">
              {project.bullets.map((bullet, bi) => (
                <li key={bi} className="flex gap-2 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  <span className="mt-1.5 flex-shrink-0 w-1 h-1 rounded-full" style={{ background: 'var(--accent)' }} />
                  {bullet}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              {project.tech.map(t => <TechPill key={t} label={t} />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Projects() {
  const [activeGridItem, setActiveGridItem] = useState<number | null>(null);
  const [featured, ...rest] = resume.projects;

  return (
    <section className="py-24 px-6 section-border">
      <div className="max-w-5xl mx-auto">
        <SectionHeader
          eyebrow="Selected work"
          title="Built, shipped, measured"
          note="Agentic systems and LLM products, most serverless on AWS."
        />

        <SectionReveal>
          <FeaturedProject project={featured} />
        </SectionReveal>

        <SectionReveal delay={0.1}>
          <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((project, i) => (
              <GridProject
                key={project.title}
                project={project}
                index={i + 1}
                on={activeGridItem === i}
                onToggle={() => setActiveGridItem(activeGridItem === i ? null : i)}
              />
            ))}
          </div>
        </SectionReveal>

        <div className="mt-10 flex justify-center">
          <a
            href="https://github.com/akashpersetti"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium transition-colors hover:opacity-90"
            style={{ border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-muted-strong)' }}
          >
            <Github size={16} />
            View more on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
