import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, agendaEvents, objects } from '@estateos/db';
import { and, asc, eq } from 'drizzle-orm';
import { requireAgentOrAdmin } from '@/lib/auth-server';
import { PhotoCarousel } from './PhotoCarousel';

export const dynamic = 'force-dynamic';

const PROPERTY_TYPE_LABELS = {
  flat: 'Квартира',
  commercial: 'Коммерция',
  house: 'Дом',
  land: 'Участок',
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

function formatMetric(value: string | null, unit: string) {
  if (!value) return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(number)} ${unit}`;
}

function formatEventDate(value: Date) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}

export default async function AgentObjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAgentOrAdmin();
  const { id } = await params;

  const [object] = await db
    .select()
    .from(objects)
    .where(and(eq(objects.id, id), eq(objects.organizationId, user.organizationId)))
    .limit(1);

  if (!object) notFound();

  const relatedEvents = await db
    .select()
    .from(agendaEvents)
    .where(
      and(
        eq(agendaEvents.organizationId, user.organizationId),
        eq(agendaEvents.objectId, id)
      )
    )
    .orderBy(asc(agendaEvents.scheduledAt));

  const photos = Array.isArray(object.photos) ? (object.photos as string[]) : [];
  const price = formatPrice(object.price);
  const area = formatMetric(object.area, 'м2');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Link href={'/agent/objects' as never} className="narrator-head__back">
        ← Объекты
      </Link>

      <PhotoCarousel photos={photos} />

      <section className="surface-card">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
          <div style={{ minWidth: 0 }}>
            <h1 className="page-title" style={{ marginTop: 0, overflowWrap: 'anywhere' }}>
              {object.title}
            </h1>
            <div style={{ marginTop: 6, fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5 }}>
              {object.address}
            </div>
          </div>
          <span
            style={{
              flexShrink: 0,
              fontSize: 11,
              fontFamily: 'var(--mono)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '5px 9px',
              borderRadius: 999,
              background: 'var(--brand-50)',
              color: 'var(--brand-700)',
            }}
          >
            {PROPERTY_TYPE_LABELS[object.propertyType]}
          </span>
        </div>

        {price && (
          <div
            style={{
              marginTop: 16,
              color: 'var(--brand-700)',
              fontSize: 28,
              fontWeight: 600,
              lineHeight: 1,
              fontFeatureSettings: '"tnum"',
            }}
          >
            {price}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 10,
            marginTop: 18,
          }}
        >
          {object.rooms && (
            <div style={{ padding: 12, borderRadius: 12, background: 'var(--bg-soft)' }}>
              <div className="page-eyebrow">Комнаты</div>
              <div style={{ marginTop: 4, fontSize: 18, fontWeight: 600 }}>{object.rooms}</div>
            </div>
          )}
          {area && (
            <div style={{ padding: 12, borderRadius: 12, background: 'var(--bg-soft)' }}>
              <div className="page-eyebrow">Площадь</div>
              <div style={{ marginTop: 4, fontSize: 18, fontWeight: 600 }}>{area}</div>
            </div>
          )}
        </div>
      </section>

      {(object.ownerName || object.ownerPhone) && (
        <section className="surface-card">
          <div className="page-eyebrow">Собственник</div>
          {object.ownerName && (
            <div style={{ marginTop: 8, fontSize: 16, fontWeight: 500, color: 'var(--ink)' }}>
              {object.ownerName}
            </div>
          )}
          {object.ownerPhone && (
            <a
              href={`tel:${object.ownerPhone}`}
              style={{
                display: 'inline-flex',
                marginTop: 6,
                fontSize: 14,
                color: 'var(--brand-700)',
                fontWeight: 500,
              }}
            >
              {object.ownerPhone}
            </a>
          )}
        </section>
      )}

      <section className="surface-card">
        <div className="page-eyebrow">Показы</div>
        {relatedEvents.length === 0 ? (
          <div style={{ marginTop: 10, fontSize: 13, color: 'var(--ink-3)' }}>
            Запланированных показов по этому объекту нет.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {relatedEvents.map((event) => (
              <div
                key={event.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 14,
                  padding: 12,
                  borderRadius: 12,
                  background: 'var(--bg-soft)',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: 'var(--ink)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {event.title}
                  </div>
                  <div style={{ marginTop: 2, fontSize: 12, color: 'var(--ink-3)' }}>
                    {event.status}
                  </div>
                </div>
                <div
                  style={{
                    flexShrink: 0,
                    fontSize: 12,
                    color: 'var(--ink-2)',
                    fontFamily: 'var(--mono)',
                    textAlign: 'right',
                  }}
                >
                  {formatEventDate(event.scheduledAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
