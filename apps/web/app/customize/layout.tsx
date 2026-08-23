import Link from 'next/link';
import { WizardProgress } from '../../components/wizard/WizardProgress';

export default function CustomizeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-xl font-serif font-bold text-brand-900">Booxury</Link>
          <WizardProgress />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
