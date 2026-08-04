'use client';

import { useCallback, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';
const STORAGE_KEY = 'theme';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const syncTheme = () => {
      const current = document.documentElement.dataset.theme as Theme | undefined;
      if (current === 'dark' || current === 'light') setTheme(current);
    };

    syncTheme();
    window.addEventListener('themechange', syncTheme);
    return () => window.removeEventListener('themechange', syncTheme);
  }, []);

  const toggle = useCallback(() => {
    setTheme(prev => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      window.localStorage.setItem(STORAGE_KEY, next);
      window.dispatchEvent(new Event('themechange'));
      return next;
    });
  }, []);

  return { theme, toggle };
}
