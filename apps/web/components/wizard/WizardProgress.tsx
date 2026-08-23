'use client';
import { useConfiguratorStore } from '../../lib/stores/configurator';
import Link from 'next/link';

const PHASES = [
  { id: 'base', label: 'Ukuran', href: '/customize/base' },
  { id: 'cover', label: 'Desain Kover', href: '/customize/cover' },
  { id: 'finish', label: 'Material', href: '/customize/finish' },
  { id: 'review', label: 'Review', href: '/customize/review' },
] as const;

export function WizardProgress() {
  const phase = useConfiguratorStore((s) => s.phase);
  const currentIndex = PHASES.findIndex((p) => p.id === phase);

  return (
    <nav className="flex items-center gap-1">
      {PHASES.map((p, i) => {
        const done = i < currentIndex;
        const active = p.id === phase;
        return (
          <Link
            key={p.id}
            href={p.href}
            className={[
              'px-3 py-1 rounded-full text-sm font-medium transition-colors',
              active ? 'bg-brand-700 text-white' :
              done ? 'bg-brand-100 text-brand-700 hover:bg-brand-200' :
              'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none',
            ].join(' ')}
          >
            {done ? '✓' : i + 1}. {p.label}
          </Link>
        );
      })}
    </nav>
  );
}
