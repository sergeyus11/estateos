import Link from 'next/link';
import { db, showReports, users } from '@estateos/db';
import { eq, and } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth-server';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ReportDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;
  const [row] = await db
    .select({
      r: showReports,
      a: { id: users.id, firstName: users.firstName, email: users.email },
    })
    .from(showReports)
    .innerJoin(users, eq(showReports.agentId, users.id))
    .where(
      and(eq(showReports.id, id), eq(showReports.organizationId, admin.organizationId))
    )
    .limit(1);

  if (!row) notFound();

  return (
    <div className="space-y-4">
      <Link href={'/admin/reports' as never} className="text-sm text-neutral-500 hover:underline">
        ← к ленте
      </Link>
      <h1 className="text-2xl font-semibold">{row.r.fields?.object || '— объект —'}</h1>
      <p className="text-sm text-neutral-500">
        Агент: {row.a.firstName || row.a.email} · {row.r.createdAt.toLocaleString('ru-RU')}
      </p>

      <dl className="grid grid-cols-2 gap-4 rounded-lg border bg-white p-5">
        <div>
          <dt className="text-xs uppercase text-neutral-500">Клиент</dt>
          <dd>{row.r.fields?.client || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-neutral-500">Бюджет</dt>
          <dd>{row.r.fields?.budget || '—'}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs uppercase text-neutral-500">Реакция</dt>
          <dd>{row.r.fields?.reaction || '—'}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs uppercase text-neutral-500">След. шаг</dt>
          <dd>{row.r.fields?.nextStep || '—'}</dd>
        </div>
      </dl>

      {row.r.transcript && (
        <details className="rounded-lg bg-neutral-50 p-4">
          <summary className="cursor-pointer text-sm font-medium">Расшифровка</summary>
          <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">{row.r.transcript}</p>
        </details>
      )}

      {row.r.voiceUrl && (
        <div>
          <p className="text-xs uppercase text-neutral-500">Запись</p>
          <audio src={row.r.voiceUrl} controls className="mt-1 w-full" />
        </div>
      )}

      {row.r.rounds && row.r.rounds.length > 0 && (
        <details className="rounded-lg bg-amber-50 p-4">
          <summary className="cursor-pointer text-sm font-medium">
            Раунды уточнения ({row.r.rounds.length})
          </summary>
          <ul className="mt-2 space-y-2 text-sm">
            {row.r.rounds.map((rd, i) => (
              <li key={i}>
                <strong>Q:</strong> {rd.question || '—'}
                <br />
                <strong>A:</strong> {rd.answer || '—'}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
