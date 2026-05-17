import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db, morningNarratives } from '@estateos/db';
import { eq, and } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth-server';
import { NarratorPlayer } from '../NarratorPlayer';

export const dynamic = 'force-dynamic';

function formatDate(d: string) {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' });
}

export default async function NarratorDetail({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const [row] = await db
    .select()
    .from(morningNarratives)
    .where(and(eq(morningNarratives.id, id), eq(morningNarratives.adminId, admin.id)))
    .limit(1);
  if (!row) notFound();

  const generatedAt = row.generatedAt ? new Date(row.generatedAt) : null;
  const generatedLabel = generatedAt
    ? generatedAt.toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'long', timeZone: 'Europe/Moscow' })
    : '—';

  const stats = row.stats ?? {};
  const showsYesterday = (stats as { showsYesterday?: number }).showsYesterday ?? 0;
  const weekTotal = (stats as { weekTotal?: number }).weekTotal ?? 0;
  const activeAgents = (stats as { activeAgents?: number }).activeAgents ?? 0;
  const topAgent = (stats as { topAgent?: { name?: string } | null }).topAgent ?? null;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="app__breadcrumb">
            <Link href={'/admin/narrator' as never}>Утренний разбор</Link>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="9 18 15 12 9 6" /></svg>
            <span>{formatDate(row.periodDate)}</span>
          </div>
          <h1 className="page-title">Утро {row.periodDate}</h1>
          <p className="page-subtitle">Сгенерировано в&nbsp;{generatedLabel} · {row.status === 'ready' ? 'готов' : row.status}</p>
        </div>
        {row.status === 'ready' && row.audioPath && (
          <a
            href={`/api/admin/narratives/${row.id}/audio`}
            download
            className="btn btn--ghost"
            style={{ padding: '8px 14px', fontSize: 13 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Скачать аудио
          </a>
        )}
      </div>

      <div className="narrator">
        <div>
          {row.status === 'ready' && row.audioPath ? (
            <>
              <div className="player">
                <div className="player__head">
                  <div>
                    <div className="player__date">УТРО · {formatDate(row.periodDate).toUpperCase()}</div>
                    <div className="player__title">Голосовое саммари за вчера · {weekTotal > 0 ? `${weekTotal} показов за неделю` : 'команда на старте'}</div>
                  </div>
                </div>
                <NarratorPlayer narrativeId={row.id} audioSrc={`/api/admin/narratives/${row.id}/audio`} />
              </div>

              <div className="transcript" style={{ marginTop: 16 }}>
                <div className="transcript__head">
                  <span className="transcript__label">Расшифровка</span>
                </div>
                <div className="transcript__body">{row.narrativeText}</div>
              </div>
            </>
          ) : row.status === 'error' ? (
            <div className="surface-card" style={{ background: 'var(--color-red-50)', color: 'var(--color-red-700)' }}>
              <div className="page-eyebrow" style={{ color: 'var(--color-red-700)' }}>Ошибка генерации</div>
              <div style={{ marginTop: 8, fontSize: 14 }}>{row.errorMessage}</div>
            </div>
          ) : (
            <div className="surface-card">
              <div className="page-eyebrow">В работе</div>
              <div style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-2)' }}>
                Статус: {row.status}. Загляните через минуту.
              </div>
            </div>
          )}
        </div>

        <div className="narrator__stats">
          <div className="stat-card">
            <div className="stat-card__label">Вчера · показов</div>
            <div className="stat-card__value">{showsYesterday}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">За неделю</div>
            <div className="stat-card__value">{weekTotal}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Команда</div>
            <div className="stat-card__value">{activeAgents} <em>агентов</em></div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Лидер</div>
            <div className="stat-card__value" style={{ fontSize: 18 }}>{topAgent?.name ?? '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
