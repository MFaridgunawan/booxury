import Link from 'next/link';

type CheckoutStep = 'cart' | 'checkout';

const STEPS: Array<{ id: CheckoutStep; label: string }> = [
  { id: 'cart', label: 'Keranjang' },
  { id: 'checkout', label: 'Konfirmasi' },
];

export function CheckoutHeader({ current }: { current: CheckoutStep }) {
  const currentIndex = STEPS.findIndex((step) => step.id === current);

  return (
    <header className="border-b border-brand-300 bg-brand-50 px-4 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-5 py-5 sm:py-6">
        <Link href="/" className="font-serif text-2xl font-bold tracking-[-0.04em] text-brand-900">
          Booxury
        </Link>
        <nav aria-label="Progres checkout" className="flex items-center gap-2 sm:gap-4">
          {STEPS.map((step, index) => {
            const isCurrent = index === currentIndex;
            const isComplete = index < currentIndex;

            return (
              <div key={step.id} className="flex items-center gap-2">
                {index > 0 && <span aria-hidden="true" className="h-px w-5 bg-brand-300 sm:w-10" />}
                <span className={`flex h-6 w-6 items-center justify-center border text-[10px] font-bold ${isCurrent || isComplete ? 'border-brand-900 bg-brand-900 text-brand-50' : 'border-brand-300 text-brand-500'}`}>
                  {isComplete ? (
                    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3.5 8.25 2.7 2.7 6.3-6.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  ) : (
                    `0${index + 1}`
                  )}
                </span>
                <span className={`hidden text-[10px] font-semibold uppercase tracking-[0.12em] sm:inline ${isCurrent ? 'text-brand-900' : 'text-brand-500'}`}>{step.label}</span>
              </div>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
