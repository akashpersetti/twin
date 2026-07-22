'use client';

import { useScroll, useTransform, motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

/**
 * Scroll-driven timeline (adapted from Aceternity Timeline for this site's
 * dark theme): sticky period label + node on the left, entry content on the
 * right, and a beam that fills the spine as you scroll.
 */
export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 10%', 'end 50%'],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div className="w-full" ref={containerRef}>
      <div ref={ref} className="relative">
        {data.map((item, index) => (
          <div key={index} className="flex justify-start pt-10 md:pt-20 md:gap-10">
            {/* Sticky node + period label */}
            <div className="sticky flex flex-col md:flex-row z-40 items-center top-32 self-start max-w-[8rem] lg:max-w-[11rem] md:w-full">
              <div
                className="h-10 w-10 absolute left-3 rounded-full flex items-center justify-center"
                style={{ background: '#09090b' }}
              >
                <div
                  className="h-4 w-4 rounded-full border p-2"
                  style={{ background: '#18181b', borderColor: '#3f3f46' }}
                />
              </div>
              <h3
                className="hidden md:block font-display text-3xl lg:text-5xl md:pl-16"
                style={{ color: '#52525b' }}
              >
                {item.title}
              </h3>
            </div>

            {/* Entry content */}
            <div className="relative pl-16 pr-0 md:pl-4 w-full">
              <h3 className="md:hidden block mb-4 text-left font-display text-3xl" style={{ color: '#52525b' }}>
                {item.title}
              </h3>
              {item.content}
            </div>
          </div>
        ))}

        {/* Spine + scroll beam */}
        <div
          style={{ height: height + 'px' }}
          className="absolute left-8 top-0 overflow-hidden w-[2px] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
        >
          <div className="absolute inset-0 w-[2px]" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <motion.div
            style={{ height: heightTransform, opacity: opacityTransform }}
            className="absolute inset-x-0 top-0 w-[2px] rounded-full"
          >
            <div
              className="h-full w-full rounded-full"
              style={{ background: 'linear-gradient(to bottom, #fbbf24, rgba(56,189,248,0.6), transparent)' }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};
