import Link from 'next/link';
import { db, objects } from '@estateos/db';
import { desc, eq } from 'drizzle-orm';
import { requireAgentOrAdmin } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

const STATUS_META = {
  active: { label: 'Активен', bg: 'rgba(122,158,107,0.15)', color: 'var(--success)' },
  reserved: { label: 'Бронь', bg: 'rgba(212,168,76,0.15)', color: 'var(--warning)' },
  sold: { label: 'Продан', bg: 'var(--bg-soft)', color: 'var(--ink-3)' },
  withdrawn: { label: 'Снят', bg: 'rgba(192,122,122,0.12)', color: 'var(--error)' },
} as const;

function formatPrice(price: string | null) {
  if (!price) return null;
  const value = Number(price);
  if (!Number.isFinite(value)) return null;
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}

function HouseIcon({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

export default async function AgentObjectsPage() {
  const user = await requireAgentOrAdmin();
  const rows = await db
    .select()
    .from(objects)
    .where(eq(objects.organizationId, user.organizationId))
    .orderBy(desc(objects.updatedAt));

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Каталог</div>
          <h1 className="page-title">Объекты</h1>
          <p className="page-subtitle">Карточки объектов вашей организации.</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="surface-card" style={{ padding: 36, textAlign: 'center' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: 'var(--brand-50)',
              color: 'var(--brand-700)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <HouseIcon size={28} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--ink)' }}>Нет объектов</div>
          <div style={{ marginTop: 6, fontSize: 13, color: 'var(--ink-3)' }}>
            Новые объекты появятся здесь после добавления через API.
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 14,
          }}
        >
          {rows.map((object) => {
            const photos = Array.isArray(object.photos) ? (object.photos as string[]) : [];
            const firstPhoto = photos[0] ?? null;
            const price = formatPrice(object.price);
            const status = STATUS_META[object.status];

            return (
              <Link
                key={object.id}
                href={`/agent/objects/${object.id}` as never}
                className="surface-card"
                style={{
                  display: 'block',
                  padding: 12,
                  transition: 'border-color 0.16s var(--ease), transform 0.16s var(--ease)',
                }}
              >
                <div
                  style={{
                    height: 150,
                    borderRadius: 14,
                    overflow: 'hidden',
                    background: 'var(--bg-soft)',
                    color: 'var(--brand-700)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                  }}
                >
                  {firstPhoto ? (
                    <img
                      src={firstPhoto}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <HouseIcon />
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: 'var(--ink)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {object.title}
                    </div>
                    <div
                      style={{
                        marginTop: 3,
                        fontSize: 12,
                        color: 'var(--ink-3)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {object.address}
                    </div>
                  </div>
                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: 10,
                      fontFamily: 'var(--mono)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '3px 7px',
                      borderRadius: 999,
                      background: status.bg,
                      color: status.color,
                    }}
                  >
                    {status.label}
                  </span>
                </div>

                {price && (
                  <div
                    style={{
                      marginTop: 12,
                      color: 'var(--brand-700)',
                      fontSize: 20,
                      lineHeight: 1.1,
                      fontWeight: 600,
                      fontFeatureSettings: '"tnum"',
                    }}
                  >
                    {price}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
