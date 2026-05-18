// Server-safe (no hooks) — reused in page.tsx and [id]/ClientCardBody.tsx
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function avatarGradient(name: string): string {
  const gradients = [
    'linear-gradient(135deg, #E2A98E, #9A6048)',
    'linear-gradient(135deg, #D4A84C, #9A7833)',
    'linear-gradient(135deg, #7A9E6B, #52784A)',
    'linear-gradient(135deg, #6B8EC4, #3E5A8C)',
    'linear-gradient(135deg, #B891C4, #6A4A8C)',
    'linear-gradient(135deg, #C46B82, #7A2E48)',
  ];
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff;
  return gradients[hash % gradients.length];
}

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  new: { label: 'Новый', bg: 'var(--bg-soft)', color: 'var(--ink-3)' },
  active: { label: 'Активный', bg: '#E8F1E5', color: '#4E7A3C' },
  thinking: { label: 'Думает', bg: '#FAF1DD', color: '#8A6B1F' },
  negotiating: { label: 'Торгуется', bg: 'var(--brand-50)', color: 'var(--brand-700)' },
  closed_won: { label: 'Сделка', bg: '#E8F1E5', color: '#4E7A3C' },
  closed_lost: { label: 'Отказ', bg: '#FBE8E8', color: '#8a4949' },
};

export function StatusChip({ status }: { status: string }) {
  const c = STATUS_CFG[status] ?? STATUS_CFG.new;

  return (
    <span
      style={{
        fontSize: 10,
        fontFamily: 'var(--mono)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '3px 8px',
        borderRadius: 999,
        background: c.bg,
        color: c.color,
      }}
    >
      {c.label}
    </span>
  );
}
