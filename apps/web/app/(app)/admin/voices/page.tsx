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
    origin: 'Русский голос · по умолчанию',
    notes: 'Естественная речь, правильные ударения. Сейчас звучит в утренних разборах.',
    current: true,
  },
  {
    slug: 'charlotte',
    name: 'Шарлотта',
    origin: 'Английский голос с русским',
    notes: 'Тёплая, подкаст-стиль. Иногда мажет ударения.',
  },
  {
    slug: 'lily',
    name: 'Лили',
    origin: 'Английский голос с русским',
    notes: 'Бархатный, актёрский тембр. Лёгкая хрипотца.',
  },
  {
    slug: 'alice',
    name: 'Элис',
    origin: 'Английский голос с русским',
    notes: 'Чёткая, формальная. Тон диктора новостей.',
  },
  {
    slug: 'sarah',
    name: 'Сара',
    origin: 'Английский голос с русским',
    notes: 'Зрелый, спокойный, обнадёживающий американский акцент.',
  },
  {
    slug: 'matilda',
    name: 'Матильда',
    origin: 'Английский голос с русским',
    notes: 'Профессиональный, знающий. Хорош для аналитики.',
  },
  {
    slug: 'eric',
    name: 'Эрик',
    origin: 'Английский голос с русским',
    notes: 'Мягкий, вызывающий доверие мужской.',
  },
  {
    slug: 'daniel',
    name: 'Дэниел',
    origin: 'Английский голос с русским',
    notes: 'Уверенный ведущий, BBC-стиль.',
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
          <h1 className="page-title">Голос утреннего разбора</h1>
          <p className="page-subtitle">
            Послушай как звучит каждый голос на&nbsp;одинаковом тексте. Понравившийся — попроси поставить, и&nbsp;следующий утренний разбор придёт уже&nbsp;им.
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
          <div key={v.slug} className="surface-card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 500, color: 'var(--ink)' }}>
                  {v.name}
                  {v.current && (
                    <span style={{ marginLeft: 10, fontSize: 10, fontFamily: 'var(--mono)', padding: '2px 8px', borderRadius: 999, background: 'var(--brand-500)', color: '#FFF8F3', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      сейчас звучит
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
        <div className="page-eyebrow" style={{ color: 'var(--brand-700)' }}>Хочешь свой голос?</div>
        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55 }}>
          Утренний разбор может приходить твоим собственным голосом — достаточно одной минуты записи. Скажи команде EstateOS, и&nbsp;настроим. Это включается в&nbsp;старший тариф.
        </p>
      </div>
    </div>
  );
}
