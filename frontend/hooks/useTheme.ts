'use client';

import { useCallback, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';
const STORAGE_KEY = 'theme';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const current = document.documentElement.dataset.theme as Theme | undefined;
    if (current === 'dark' || current === 'light') setTheme(current);
    setHydrated(true);
  }, []);

  useEffect(() => {
    const syncTheme = () => {
      const current = document.documentElement.dataset.theme as Theme | undefined;
      if (current === 'dark' || current === 'light') setTheme(current);
    };
    window.addEventListener('themechange', syncTheme);
    return () => window.removeEventListener('themechange', syncTheme);
  }, []);

  // Side effects (DOM attribute, localStorage, cross-instance event) run here,
  // never inside the setTheme updater — React may invoke that updater more
  // than once as a purity check, which was firing these twice and racing
  // with the other mounted ThemeToggle instance (desktop + mobile).
  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
    window.dispatchEvent(new Event('themechange'));
  }, [theme, hydrated]);

  const toggle = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggle };
}
