import Link from 'next/link';
import { requireAdmin } from '@/lib/auth-server';
import { DEMO_NARRATIVE } from '@/lib/demo-narrative';

export const dynamic = 'force-dynamic';

export default async function DemoNarrativePage() {
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
          <div className="page-eyebrow" style={{ color: 'var(--brand-700)' }}>
            Демо · {DEMO_NARRATIVE.scenario}
          </div>
          <h1 className="page-title">Как звучит утренний разбор</h1>
          <p className="page-subtitle">
            Голос — Charlotte (ElevenLabs multilingual_v2). Сценарий — типичная сильная неделя у&nbsp;агентства коммерческой недвижимости в&nbsp;Краснодаре. Это пример того, что будет приходить тебе на iPhone каждое утро в&nbsp;9:30 МСК.
          </p>
        </div>
        <a
          href={DEMO_NARRATIVE.audioUrl}
          download="estateos-demo-narrative.mp3"
          className="narrator-head__download"
          aria-label="Скачать аудио"
          title="Скачать аудио"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </a>
      </div>

      <div className="narrator">
        <div>
          <div className="player">
            <div className="player__head">
              <div>
                <div className="player__date">УТРО · СУББОТА · ДЕМО</div>
                <div className="player__title">«Хороший темп для коммерции, гарант-арендный бизнес на Красной с Магнитом»</div>
              </div>
            </div>
            <audio
              controls
              preload="metadata"
              src={DEMO_NARRATIVE.audioUrl}
              style={{ width: '100%', marginTop: 8 }}
              data-testid="narrator-audio"
            />
          </div>

          <div className="transcript" style={{ marginTop: 16 }}>
            <div className="transcript__head">
              <span className="transcript__label">Расшифровка</span>
              <span className="transcript__label" style={{ color: 'var(--brand-500)' }}>5 секций</span>
            </div>
            <div className="transcript__body">{DEMO_NARRATIVE.text}</div>
          </div>

          <div className="surface-card" style={{ marginTop: 16, background: 'var(--brand-50)', borderColor: 'var(--brand-200)' }}>
            <div className="page-eyebrow" style={{ color: 'var(--brand-700)' }}>Что внутри формата</div>
            <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55 }}>
              Утренний разбор всегда из&nbsp;5&nbsp;частей: <strong style={{ color: 'var(--ink)' }}>цифры дня</strong> · <strong style={{ color: 'var(--ink)' }}>команда персонально</strong> · <strong style={{ color: 'var(--ink)' }}>pipeline на&nbsp;7&nbsp;дней</strong> · <strong style={{ color: 'var(--ink)' }}>один риск или возможность</strong> · <strong style={{ color: 'var(--ink)' }}>три действия на&nbsp;сегодня</strong>. Как только команда начнёт активно использовать систему, сюда подставятся реальные имена агентов, объекты и&nbsp;цифры.
            </p>
          </div>
        </div>

        <div className="narrator__stats">
          <div className="stat-card">
            <div className="stat-card__label">Длительность</div>
            <div className="stat-card__value">{Math.floor(DEMO_NARRATIVE.audioDurationSec / 60)}:{String(DEMO_NARRATIVE.audioDurationSec % 60).padStart(2, '0')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Голос</div>
            <div className="stat-card__value" style={{ fontSize: 18 }}>Charlotte</div>
            <div className="stat-card__list">
              <div className="stat-card__row"><span>модель</span><em>multilingual v2</em></div>
              <div className="stat-card__row"><span>стиль</span><em>тёплый, подкаст</em></div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Регион</div>
            <div className="stat-card__value" style={{ fontSize: 18 }}>{DEMO_NARRATIVE.region}</div>
            <div className="stat-card__list">
              <div className="stat-card__row"><span>сегмент</span><em>{DEMO_NARRATIVE.category}</em></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
