type StatusTone = 'positive' | 'warning';

const TONE_CLASSES: Record<StatusTone, string> = {
  positive: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-800 ring-amber-600/20',
};

const DOT_CLASSES: Record<StatusTone, string> = {
  positive: 'bg-emerald-500',
  warning: 'bg-amber-500',
};

type StatusBadgeProps = {
  tone: StatusTone;
  label: string;
};

/** Selo de status com indicador visual e textual (não depende só de cor). */
export function StatusBadge({ tone, label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset ${TONE_CLASSES[tone]}`}
    >
      <span aria-hidden="true" className={`size-2 rounded-full ${DOT_CLASSES[tone]}`} />
      {label}
    </span>
  );
}

export type { StatusTone };
