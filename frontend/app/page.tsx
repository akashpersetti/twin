'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';

import Loader from '@/components/sections/Loader';
import ScrollProgress from '@/components/layout/ScrollProgress';
import Navbar from '@/components/layout/Navbar';
import Hero from '@/components/sections/Hero';
import StatsAndStack from '@/components/sections/StatsAndStack';
import ImpactStrip from '@/components/sections/ImpactStrip';
import Objective from '@/components/sections/Objective';
import About from '@/components/sections/About';
import Experience from '@/components/sections/Experience';
import Projects from '@/components/sections/Projects';
import Skills from '@/components/sections/Skills';
import Education from '@/components/sections/Education';
import Certifications from '@/components/sections/Certifications';
import More from '@/components/sections/More';
import Quote from '@/components/sections/Quote';
import Contact from '@/components/sections/Contact';

export default function Home() {
  const [loaderDone, setLoaderDone] = useState(false);

  return (
    <>
      <AnimatePresence>
        {!loaderDone && (
          <Loader onComplete={() => setLoaderDone(true)} />
        )}
      </AnimatePresence>

      {loaderDone && (
        <>
          <ScrollProgress />
          <Navbar />
          <main>
            <section id="hero">
              <Hero />
            </section>
            <section id="hero-extras">
              <StatsAndStack />
            </section>
            <section id="impact">
              <ImpactStrip />
            </section>
            <section id="objective">
              <Objective />
            </section>
            <section id="about">
              <About />
            </section>
            <section id="experience">
              <Experience />
            </section>
            <section id="projects">
              <Projects />
            </section>
            <section id="skills">
              <Skills />
            </section>
            <section id="education">
              <Education />
            </section>
            <section id="certifications">
              <Certifications />
            </section>
            <section id="more">
              <More />
            </section>
            <section id="quote">
              <Quote />
            </section>
            <section id="contact">
              <Contact />
            </section>
          </main>
        </>
      )}
    </>
  );
}
