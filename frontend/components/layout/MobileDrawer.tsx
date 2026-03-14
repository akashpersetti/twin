'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
}

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  items: NavItem[];
  activeId: string;
}

export default function MobileDrawer({ open, onClose, items, activeId }: MobileDrawerProps) {
  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-0 right-0 bottom-0 z-40 w-72 flex flex-col p-8"
            style={{ background: 'var(--bg-base)', borderLeft: '1px solid var(--border-glass)' }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <button
              onClick={onClose}
              className="self-end mb-8 p-2 rounded-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              <X size={20} />
            </button>
            <nav className="flex flex-col gap-2">
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className="text-left px-4 py-3 rounded-xl text-lg font-medium transition-colors"
                  style={{
                    color: activeId === item.id ? '#7c3aed' : 'var(--text-primary)',
                    background: activeId === item.id ? 'rgba(124,58,237,0.1)' : 'transparent',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
