import Link from 'next/link';
import { requireAdmin } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

type VoiceSample = {
  slug: string;
  name: string;
  origin: string;
  notes: string;
  current?: boolean;
};

const SAMPLES: VoiceSample[] = [
  {
    slug: 'alisa',
    name: 'Алиса',
    origin: 'Voice Library · native russian',
    notes: 'Российский native голос из community-библиотеки. Естественная речь, правильные ударения. Кандидат №1 для production.',
  },
  {
    slug: 'charlotte',
    name: 'Charlotte',
    origin: 'ElevenLabs default · British female',
    notes: 'Тёплая, подкаст-стиль. Текущая в проде. Ударения в русском местами мажут.',
    current: true,
  },
  {
    slug: 'lily',
    name: 'Lily',
    origin: 'ElevenLabs default · British female mature',
    notes: 'Velvety actress, лёгкая хрипотца. Дикторский тон.',
  },
  {
    slug: 'alice',
    name: 'Alice',
    origin: 'ElevenLabs default · British female educator',
    notes: 'Чёткая, формальная. News-anchor стиль.',
  },
  {
    slug: 'sarah',
    name: 'Sarah',
    origin: 'ElevenLabs default · American female',
    notes: 'Mature, reassuring, тёплый американский.',
  },
  {
    slug: 'matilda',
    name: 'Matilda',
    origin: 'ElevenLabs default · American female',
    notes: 'Professional, knowledgable. Хороша для аналитики.',
  },
  {
    slug: 'eric',
    name: 'Eric',
    origin: 'ElevenLabs default · American male',
    notes: 'Smooth, trustworthy. Спокойный мужской.',
  },
  {
    slug: 'daniel',
    name: 'Daniel',
    origin: 'ElevenLabs default · British male',
    notes: 'Steady broadcaster. BBC-style.',
  },
];

const SAMPLE_TEXT =
  '«Доброе утро. Вчера четыре показа — два горячих. Главное: гарант-арендный бизнес на Красной с Магнитом, пятьдесят два миллиона. Виктория на подъёме, Москвич спрашивал доходность. До полудня нужен звонок.»';

export default async function VoicesPage() {
  await requireAdmin();

  return (
    <div>
      <div className="page-head narrator-head">
        <div style={{ minWidth: 0, flex: 1 }}>
          <Link href={'/admin' as never} className="narrator-head__back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Дашборд
          </Link>
          <h1 className="page-title">Выбор голоса для утреннего разбора</h1>
          <p className="page-subtitle">
            Все примеры — одинаковый текст ~200 знаков, модель eleven_multilingual_v2. Послушай и сравни. Текущий голос в&nbsp;проде отмечен. Когда выберешь — напиши мне «<strong>пробуй {`<имя>`}</strong>» и я переключу production-разбор.
          </p>
        </div>
      </div>

      <div className="surface-card" style={{ marginBottom: 16, background: 'var(--bg-soft)' }}>
        <div className="page-eyebrow">Тестовый текст</div>
        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink)', fontStyle: 'italic', lineHeight: 1.55 }}>
          {SAMPLE_TEXT}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {SAMPLES.map((v) => (
          <div key={v.slug} className="surface-card" style={{ padding: 18, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 500, color: 'var(--ink)' }}>
                  {v.name}
                  {v.current && (
                    <span style={{ marginLeft: 10, fontSize: 10, fontFamily: 'var(--mono)', padding: '2px 8px', borderRadius: 999, background: 'var(--brand-500)', color: '#FFF8F3', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      сейчас в проде
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{v.origin}</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, margin: '6px 0 10px' }}>{v.notes}</p>
            <audio controls preload="none" style={{ width: '100%' }} src={`/voice-samples/${v.slug}.mp3`} />
          </div>
        ))}
      </div>

      <div className="surface-card" style={{ marginTop: 20, padding: 18, background: 'var(--brand-50)', borderColor: 'var(--brand-200)' }}>
        <div className="page-eyebrow" style={{ color: 'var(--brand-700)' }}>Как добавить ещё голос</div>
        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55 }}>
          Зайди в&nbsp;<a href="https://elevenlabs.io/app/voice-library" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-700)' }}>ElevenLabs Voice Library</a>, найди голос (фильтр Russian → послушай в&nbsp;UI), скопируй его&nbsp;voice ID&nbsp;из URL — пришли мне. Сгенерирую тестовый сэмпл за&nbsp;минуту, потом если зайдёт — поставим production.
        </p>
      </div>
    </div>
  );
}
