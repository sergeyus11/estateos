import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db, morningNarratives } from '@estateos/db';
import { eq, and } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth-server';
import { NarratorPlayer } from '../NarratorPlayer';

export const dynamic = 'force-dynamic';

export default async function NarratorDetail({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const [row] = await db
    .select()
    .from(morningNarratives)
    .where(and(eq(morningNarratives.id, id), eq(morningNarratives.adminId, admin.id)))
    .limit(1);
  if (!row) notFound();

  return (
    <div className="space-y-6">
      <Link href={'/admin/narrator' as never} className="text-sm text-brand-500 underline">
        ← все разборы
      </Link>
      <header>
        <h1 className="text-2xl font-semibold">Разбор за {row.periodDate}</h1>
        <p className="text-xs text-neutral-500">
          {row.generatedAt
            ? `сгенерирован ${new Date(row.generatedAt).toLocaleString('ru-RU')}`
            : 'не сгенерирован'}
        </p>
      </header>

      {row.status === 'ready' && row.audioPath && (
        <section className="space-y-3 rounded-lg bg-white p-5">
          <NarratorPlayer narrativeId={row.id} audioSrc={`/api/admin/narratives/${row.id}/audio`} />
          <details className="text-sm">
            <summary className="cursor-pointer text-neutral-500">показать текст</summary>
            <p className="mt-2 whitespace-pre-wrap text-neutral-700">{row.narrativeText}</p>
          </details>
        </section>
      )}

      {row.status === 'error' && (
        <section className="rounded-lg bg-red-50 p-5 text-sm text-red-700">
          Ошибка генерации: {row.errorMessage}
        </section>
      )}

      {row.stats?.showsYesterday !== undefined && (
        <section className="rounded-lg bg-neutral-50 p-5">
          <h2 className="text-sm font-semibold uppercase text-neutral-500">Цифры дня</h2>
          <dl className="mt-2 grid grid-cols-2 gap-y-1 text-sm">
            <dt className="text-neutral-500">Показов</dt>
            <dd className="text-right font-medium">{row.stats.showsYesterday ?? 0}</dd>
            <dt className="text-neutral-500">За неделю</dt>
            <dd className="text-right font-medium">{row.stats.weekTotal ?? 0}</dd>
            <dt className="text-neutral-500">Активных агентов</dt>
            <dd className="text-right font-medium">{row.stats.activeAgents ?? 0}</dd>
            <dt className="text-neutral-500">Лидер</dt>
            <dd className="text-right font-medium">{row.stats.topAgent?.name ?? '—'}</dd>
          </dl>
        </section>
      )}
    </div>
  );
}
