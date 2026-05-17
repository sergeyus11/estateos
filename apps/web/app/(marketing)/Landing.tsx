'use client';

import { Fragment, useEffect, useRef } from 'react';
import { SwipeToEnter } from './SwipeToEnter';

/* ------------------------------------------------------------
 *  Reusable SVG primitives
 * ------------------------------------------------------------ */

function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="lp-lg-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D89A82" />
          <stop offset="55%" stopColor="#C4836A" />
          <stop offset="100%" stopColor="#9A6048" />
        </linearGradient>
        <linearGradient id="lp-lg-hi" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
          <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="32" height="32" rx="9" fill="url(#lp-lg-fill)" />
      <rect x="0" y="0" width="32" height="32" rx="9" fill="url(#lp-lg-hi)" />
      <g fill="#FFFDF9">
        <rect x="6" y="13" width="2.6" height="6" rx="1.3" />
        <rect x="10.5" y="10" width="2.6" height="12" rx="1.3" />
        <rect x="15" y="7" width="2.6" height="18" rx="1.3" />
        <rect x="19.5" y="11" width="2.6" height="10" rx="1.3" />
        <rect x="24" y="14" width="2.6" height="4" rx="1.3" />
      </g>
    </svg>
  );
}

function Arrow() {
  return (
    <svg className="arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

const ORB_BAR_X = [100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320, 340, 360, 380, 400, 420, 440, 460, 480];
const ORB_BAR_HEIGHTS = [30, 60, 110, 150, 200, 170, 220, 260, 210, 280, 250, 200, 240, 180, 140, 160, 120, 90, 50, 20];

function HeroOrb() {
  return (
    <div className="hero__orb" aria-hidden="true">
      <div className="orb__glow"></div>
      <div className="orb__halo"></div>
      <div className="orb">
        <svg viewBox="-100 -100 800 800" className="orb__inner" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="orb-base" cx="0.5" cy="0.5" r="0.7">
              <stop offset="0%" stopColor="#F5C9B0" />
              <stop offset="35%" stopColor="#DC957A" />
              <stop offset="68%" stopColor="#B0704F" />
              <stop offset="92%" stopColor="#7E4A2E" />
              <stop offset="100%" stopColor="#5A3220" />
            </radialGradient>
            <radialGradient id="orb-shine" cx="0.3" cy="0.25" r="0.55">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="22%" stopColor="#FFE8D5" stopOpacity="0.5" />
              <stop offset="55%" stopColor="#FFE8D5" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#FFE8D5" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="orb-bottom" cx="0.68" cy="0.78" r="0.5">
              <stop offset="0%" stopColor="#FBDCC2" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#F8C9A4" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#F8C9A4" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="orb-haze" cx="0.5" cy="0.5" r="0.5">
              <stop offset="55%" stopColor="#C4836A" stopOpacity="0" />
              <stop offset="78%" stopColor="#D88B6F" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#D88B6F" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="300" cy="300" r="380" fill="url(#orb-haze)" />
          <circle cx="300" cy="300" r="240" fill="url(#orb-base)" />
          <circle cx="300" cy="300" r="240" fill="url(#orb-bottom)" />
          <circle cx="300" cy="300" r="240" fill="url(#orb-shine)" />
          <g opacity="0.85" fill="#FFFDF9">
            {ORB_BAR_X.map((x, i) => {
              const h = ORB_BAR_HEIGHTS[i];
              const y = 300 - h / 2;
              return <rect key={x} x={x} y={y} width="6" height={h} rx="3" />;
            })}
          </g>
          <ellipse cx="240" cy="168" rx="140" ry="34" fill="#FFFFFF" opacity="0.13" />
        </svg>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
 *  Floating chips (animated cycle)
 * ------------------------------------------------------------ */

type ChipState = { color: 'success' | 'warn' | 'brand'; label: string; time: string };

const CHIP_CYCLES: Record<1 | 2 | 3, ChipState[]> = {
  1: [
    { color: 'success', label: 'Запись агента · 04:12', time: 'сейчас' },
    { color: 'success', label: 'Показ в Митино · 14:30', time: '+15 мин' },
    { color: 'brand', label: 'AI-секретарь · входящий', time: 'сейчас' },
  ],
  2: [
    { color: 'brand', label: 'Утренний разбор готов', time: '9:30' },
    { color: 'brand', label: 'Расшифровка · 5 полей', time: '+6 сек' },
    { color: 'success', label: 'Follow-up закрыт · Аня', time: 'сегодня' },
  ],
  3: [
    { color: 'warn', label: '5 показов · 2 follow-up', time: 'сегодня' },
    { color: 'warn', label: 'SPIN · «ипотечник»', time: 'в эфире' },
    { color: 'success', label: 'Горячая сделка · 92%', time: 'Лефортово' },
  ],
};

function HeroChip({ which }: { which: 1 | 2 | 3 }) {
  const ref = useRef<HTMLDivElement>(null);
  const initial = CHIP_CYCLES[which][0];

  useEffect(() => {
    const chip = ref.current;
    if (!chip) return;
    const dot = chip.querySelector<HTMLElement>('.hero__chip-dot')!;
    const text = chip.querySelector<HTMLElement>('.hero__chip-text')!;
    const time = chip.querySelector<HTMLElement>('.hero__chip-time')!;
    const list = CHIP_CYCLES[which];
    let i = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const stagger = setTimeout(() => {
      intervalId = setInterval(() => {
        chip.classList.add('is-fading');
        timeoutId = setTimeout(() => {
          i = (i + 1) % list.length;
          const s = list[i];
          dot.className = 'hero__chip-dot hero__chip-dot--' + s.color;
          text.textContent = s.label;
          time.textContent = s.time;
          chip.classList.remove('is-fading');
        }, 380);
      }, 4200);
    }, (which - 1) * 1100);
    return () => {
      clearTimeout(stagger);
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [which]);

  return (
    <div ref={ref} className={`hero__chip hero__chip--${which}`}>
      <span className={`hero__chip-dot hero__chip-dot--${initial.color}`}></span>
      <span className="hero__chip-text">{initial.label}</span>
      <span className="hero__chip-time">{initial.time}</span>
    </div>
  );
}

/* ------------------------------------------------------------
 *  Navigation
 * ------------------------------------------------------------ */

function Nav() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const inner = ref.current;
    if (!inner) return;
    const onScroll = () => {
      const scrolled = window.scrollY > 24;
      inner.classList.toggle('is-scrolled', scrolled);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <nav className="nav" aria-label="Главная навигация">
      <div ref={ref} className="nav__inner">
        <a href="#" className="nav__logo" aria-label="EstateOS — на главную">
          <LogoMark size={26} />
          <span className="nav__logo-text">EstateOS</span>
        </a>
        <div className="nav__links">
          <a href="#product" className="nav__link">Продукт</a>
          <a href="#narrator" className="nav__link">Утренний разбор</a>
          <a href="#spin" className="nav__link">Тренажёр</a>
          <a href="#ai-team" className="nav__link">AI-команда</a>
          <a href="#owners" className="nav__link">Для владельцев</a>
        </div>
        <SwipeToEnter />
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------
 *  Marked-segment renderer (safe alternative to dangerouslySetInnerHTML)
 *  Inputs are tuples [text, mark, text, mark, ...] — odd-indexed items
 *  are wrapped in <mark>.
 * ------------------------------------------------------------ */

function Segments({ parts }: { parts: string[] }) {
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>{i % 2 === 0 ? p : <mark>{p}</mark>}</Fragment>
      ))}
    </>
  );
}

/* ------------------------------------------------------------
 *  Sections
 * ------------------------------------------------------------ */

function Hero() {
  return (
    <header className="hero">
      <div className="container">
        <div className="hero__grid">
          <div className="hero__copy">
            <span className="eyebrow">AI-операционная система · агентства недвижимости</span>
            <h1 className="hero__title">
              Операционная<br />
              система для<br />
              <em>агентств <span className="hero__title-wrap">недвижимости.</span></em>
            </h1>
            <p className="hero__sub">
              Голос агента превращается в&nbsp;структурированный отчёт. Утренний разбор появляется
              на&nbsp;вашем iPhone в&nbsp;9:30. Без планёрок, без сводок в&nbsp;ночи, без потерянного контроля.
            </p>
            <div className="hero__cta">
              <a href="/login" className="btn btn--primary">
                Войти в&nbsp;EstateOS <Arrow />
              </a>
              <a href="#product" className="btn btn--ghost">Посмотреть продукт</a>
            </div>
            <div className="hero__meta">
              <span className="hero__meta-dot"></span>
              Работает в&nbsp;продакшене в&nbsp;московском агентстве недвижимости · estateos.ru
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <HeroOrb />
            <HeroChip which={1} />
            <HeroChip which={2} />
            <HeroChip which={3} />
          </div>
        </div>

        <div className="trust">
          <div>
            <div className="trust__item-num"><em>09:30</em></div>
            <div className="trust__item-label">Утренний разбор каждый день, без напоминаний</div>
          </div>
          <div>
            <div className="trust__item-num">5 <span className="trust__item-num-suffix">полей</span></div>
            <div className="trust__item-label">Структурированный отчёт из голоса агента</div>
          </div>
          <div>
            <div className="trust__item-num">30 <span className="trust__item-num-suffix">дней</span></div>
            <div className="trust__item-label">Аналитика и&nbsp;trend-графики из&nbsp;коробки</div>
          </div>
          <div>
            <div className="trust__item-num">8 <span className="trust__item-num-suffix">типажей</span></div>
            <div className="trust__item-label">SPIN-тренажёр продаж для&nbsp;команды</div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Features() {
  return (
    <section className="section" id="product">
      <div className="container">
        <div className="features-head">
          <div><span className="section-label">— Возможности</span></div>
          <div>
            <h2>Три ритуала, на&nbsp;которых держится&nbsp;агентство.</h2>
            <p className="lead" style={{ marginTop: 24 }}>
              EstateOS не&nbsp;добавляет работу. Он&nbsp;собирает то, что и&nbsp;так уже происходит
              в&nbsp;агентстве — голос, цифры, разговор&nbsp;— и&nbsp;возвращает в&nbsp;виде ясной картины.
            </p>
          </div>
        </div>

        <div className="features">
          <article className="feature-card">
            <div className="feature-card__num">01 · Голос агента</div>
            <h3 className="feature-card__title">Агент диктует.<br />Отчёт пишется сам.</h3>
            <p className="feature-card__desc">
              После показа квартиры агент наговаривает 1–2 минуты. EstateOS превращает речь в&nbsp;5&nbsp;структурированных
              полей и&nbsp;follow-up вопрос — автоматически.
            </p>
            <div className="feature-card__visual">
              <svg width="100%" height="80" viewBox="0 0 280 80" preserveAspectRatio="none">
                <g fill="#C4836A">
                  {[
                    [0, 30, 20], [12, 22, 36], [24, 14, 52], [36, 8, 64], [48, 16, 48],
                    [60, 4, 72], [72, 12, 56], [84, 20, 40], [96, 10, 60], [108, 22, 36],
                    [120, 6, 68], [132, 18, 44], [144, 14, 52],
                  ].map(([x, y, h]) => (<rect key={x} x={x} y={y} width="6" height={h} rx="3" />))}
                </g>
                <g fill="#E0D6CC">
                  {[
                    [156, 26, 28], [168, 32, 16], [180, 30, 20], [192, 34, 12],
                    [204, 32, 16], [216, 36, 8], [228, 34, 12], [240, 36, 8],
                    [252, 37, 6], [264, 38, 4],
                  ].map(([x, y, h]) => (<rect key={x} x={x} y={y} width="6" height={h} rx="3" />))}
                </g>
              </svg>
            </div>
          </article>

          <article className="feature-card">
            <div className="feature-card__num">02 · Утренний разбор</div>
            <h3 className="feature-card__title">9:30. Каждое утро.<br />На&nbsp;вашем iPhone.</h3>
            <p className="feature-card__desc">
              Голосовое саммари за&nbsp;вчера: показы, follow-up, узкие места. 5&nbsp;минут — и&nbsp;агентство
              в&nbsp;голове, до&nbsp;первой чашки кофе.
            </p>
            <div className="feature-card__visual">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 220 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
                  <span>17.05.2026 · вторник</span><span>04:38</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 42 }}>
                  {[60, 90, 70, 100, 80, 55, 70, 40, 60, 30, 50, 35].map((h, i) => (
                    <span key={i} style={{ flex: 1, background: i < 6 ? 'var(--brand-500)' : i < 7 ? 'var(--brand-300)' : 'var(--ink-4)', borderRadius: 2, height: `${h}%` }} />
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(180deg,#CC8E76,#9A6048)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="#FFF8F3"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-2)' }}>02:14 / 04:38</span>
                </div>
              </div>
            </div>
          </article>

          <article className="feature-card">
            <div className="feature-card__num">03 · SPIN-тренажёр</div>
            <h3 className="feature-card__title">8 типажей клиентов.<br />Тренировка без потерь.</h3>
            <p className="feature-card__desc">
              Агент тренирует разговор с&nbsp;«ипотечником», «инвестором», «семьёй с&nbsp;двумя детьми».
              Без&nbsp;живых клиентов и&nbsp;без&nbsp;цены ошибки.
            </p>
            <div className="feature-card__visual">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, width: '100%' }}>
                {[
                  { l: 'И', bg: 'linear-gradient(135deg,#E2A98E,#9A6048)' },
                  { l: 'С', bg: 'linear-gradient(135deg,#D4A84C,#9A7833)' },
                  { l: 'М', bg: 'linear-gradient(135deg,#7A9E6B,#52784A)' },
                  { l: 'К', bg: 'linear-gradient(135deg,#6B8EC4,#3E5A8C)' },
                ].map(({ l, bg }) => (
                  <div key={l} style={{ aspectRatio: '1', borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: 13, letterSpacing: '-0.02em' }}>{l}</div>
                ))}
                {['Б', 'П', 'Н', '+4'].map((l) => (
                  <div key={l} style={{ aspectRatio: '1', borderRadius: 10, background: 'var(--bg-soft)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)', fontWeight: 600, fontSize: 13, fontFamily: l === '+4' ? 'var(--mono)' : undefined }}>{l}</div>
                ))}
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function NarratorShowcase() {
  const transcript: { time: string; parts: string[] }[] = [
    { time: '00:18', parts: ['Доброе утро. Вчера команда провела ', '5 показов', ', из них один — на Лефортовском, — оценил клиент как «то самое».'] },
    { time: '00:42', parts: ['Виктор задавал хорошие SPIN-вопросы, но ', 'не закрыл follow-up', ' — клиент уехал думать, без даты следующего контакта.'] },
    { time: '01:24', parts: ['Аня провела два показа в Митино. Оба отчёта пришли через 15 минут после показа — это лучшая скорость на неделе.'] },
    { time: '02:08', parts: ['Внимание: ', '«ипотечник»', ' в Кузьминках. Бюджет не подтверждён. Рекомендую сегодня закрыть вопрос финансирования до показа.'] },
  ];
  return (
    <section className="section section--tight showcase" id="narrator">
      <div className="container">
        <div className="showcase__head">
          <span className="eyebrow">Утренний разбор · 9:30 МСК</span>
          <h2>Голос продолжает играть<br />когда вы выходите из&nbsp;спальни.</h2>
          <p className="lead">
            В&nbsp;9:30 на&nbsp;iPhone владельца появляется аудиофайл за&nbsp;вчерашний день.
            Под ним — расшифровка, ключевые цифры, и&nbsp;вопросы, которые сегодня стоит задать команде.
          </p>
        </div>

        <div className="window">
          <div className="window__bar">
            <span className="window__dot window__dot--r"></span>
            <span className="window__dot window__dot--y"></span>
            <span className="window__dot window__dot--g"></span>
            <span className="window__url">estateos.ru&nbsp;/&nbsp;admin&nbsp;/&nbsp;narrator&nbsp;/&nbsp;17-05-2026</span>
          </div>

          <div className="app">
            <aside className="app__side">
              <div className="app__brand">
                <LogoMark size={26} />
                <span className="app__brand-text">EstateOS</span>
              </div>
              <div className="app__nav-label">Управление</div>
              <div className="app__nav-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                Дашборд
              </div>
              <div className="app__nav-item app__nav-item--active">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                  <path d="M21 19a2 2 0 0 1-2 2h-1v-7h3v5zM3 19a2 2 0 0 0 2 2h1v-7H3v5z" />
                </svg>
                Утренний разбор
                <span className="app__nav-badge">NEW</span>
              </div>
              <div className="app__nav-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                Аналитика
              </div>
              <div className="app__nav-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Агенты
              </div>
            </aside>

            <div className="app__main">
              <div className="app__head">
                <div>
                  <div className="app__breadcrumb">
                    <a href="#">Утренний разбор</a>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="9 18 15 12 9 6" /></svg>
                    <span>17 мая · вторник</span>
                  </div>
                  <div className="app__title">Утро 17.05.2026</div>
                  <div className="app__subtitle">Сгенерировано в&nbsp;9:28 МСК · длительность 4&nbsp;мин 38&nbsp;сек</div>
                </div>
              </div>

              <div className="narrator">
                <div>
                  <div className="player">
                    <div className="player__head">
                      <div>
                        <div className="player__date">УТРО · ВТОРНИК</div>
                        <div className="player__title">«Вчера было 5 показов. Один — горячий.»</div>
                      </div>
                    </div>
                    <div className="player__wave">
                      {Array.from({ length: 69 }).map((_, i) => (
                        <span key={i} className={i < 42 ? 'past' : ''} />
                      ))}
                    </div>
                    <div className="player__controls">
                      <button className="player__btn" aria-label="Назад 15 сек">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" />
                        </svg>
                      </button>
                      <button className="player__btn player__btn--play" aria-label="Пауза">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFF8F3">
                          <rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" />
                        </svg>
                      </button>
                      <button className="player__btn" aria-label="Вперёд 15 сек">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" />
                        </svg>
                      </button>
                      <div className="player__time"><em>02:14</em> / 04:38</div>
                    </div>
                  </div>

                  <div className="transcript" style={{ marginTop: 16 }}>
                    <div className="transcript__head">
                      <span className="transcript__label">Расшифровка</span>
                      <span className="transcript__label" style={{ color: 'var(--brand-500)' }}>5 ключевых моментов</span>
                    </div>
                    {transcript.map((line) => (
                      <div key={line.time} className="transcript__line">
                        <span className="transcript__time">{line.time}</span>
                        <span className="transcript__text"><Segments parts={line.parts} /></span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="narrator__stats">
                  <div className="stat-card">
                    <div className="stat-card__label">Вчера · показов</div>
                    <div className="stat-card__value">5 <em>+1 к&nbsp;ср.</em></div>
                    <div className="stat-card__bars">
                      {[30, 55, 40, 70, 50, 65, 60, 45, 75, 55, 80, 60, 70, 90].map((h, i) => (
                        <span key={i} style={{ height: `${h}%` }} className={[5, 10, 13].includes(i) ? 'hi' : ''} />
                      ))}
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card__label">Закрытие follow-up</div>
                    <div className="stat-card__value">3 / 5</div>
                    <div className="stat-card__list">
                      <div className="stat-card__row"><span>Виктор</span><em style={{ color: 'var(--error)' }}>не&nbsp;закрыт</em></div>
                      <div className="stat-card__row"><span>Аня</span><em>+2</em></div>
                      <div className="stat-card__row"><span>Дмитрий</span><em>+1</em></div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card__label">Горячие сделки</div>
                    <div className="stat-card__value" style={{ color: 'var(--brand-500)' }}>1</div>
                    <div className="stat-card__list">
                      <div className="stat-card__row"><span>Лефортово · 2-к</span><em>92%</em></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardShowcase() {
  return (
    <section className="section section--tight">
      <div className="container">
        <div className="showcase__head">
          <span className="eyebrow">Дашборд · 30 дней</span>
          <h2>Контроль агентства<br />в&nbsp;одном экране.</h2>
          <p className="lead">
            Никаких таблиц на&nbsp;100 строк. Только то, что вам нужно знать в&nbsp;первые 30&nbsp;секунд&nbsp;дня.
          </p>
        </div>

        <div className="window">
          <div className="window__bar">
            <span className="window__dot window__dot--r"></span>
            <span className="window__dot window__dot--y"></span>
            <span className="window__dot window__dot--g"></span>
            <span className="window__url">estateos.ru&nbsp;/&nbsp;admin&nbsp;/&nbsp;analytics</span>
          </div>

          <div style={{ padding: '28px 32px 36px', background: 'var(--bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>17.05.2026 · 09:32 МСК</div>
                <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 4 }}>Доброе утро. Вот ваше агентство.</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn--ghost" style={{ padding: '8px 14px', fontSize: 13 }}>7 дней</button>
                <button className="btn" style={{ padding: '8px 14px', fontSize: 13, background: 'var(--ink)', color: 'var(--surface)' }}>30 дней</button>
                <button className="btn btn--ghost" style={{ padding: '8px 14px', fontSize: 13 }}>Квартал</button>
              </div>
            </div>

            <div className="dash">
              <KpiBlock label="Показов · 30д" value="142" delta="+18% к апр" />
              <KpiBlock label="Follow-up · закрыто" value="87" suffix="%" delta="+6 пп" lineColor="#C4836A" />
              <KpiBlock label="Скорость отчёта" value="14" suffix="м" delta="−4 м (быстрее)" deltaDown />
              <KpiBlock label="SPIN-тренировок" value="38" delta="+12" lineColor="#C4836A" />
            </div>

            <div className="dash-grid">
              <div className="chart">
                <div className="chart__head">
                  <div className="chart__title">Показы и&nbsp;follow-up · 30 дней</div>
                  <div className="chart__legend">
                    <span className="chart__legend-item">Показы</span>
                    <span className="chart__legend-item chart__legend-item--alt">Follow-up</span>
                  </div>
                </div>
                <svg className="chart__svg" viewBox="0 0 600 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="dash-chart-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C4836A" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#C4836A" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <g stroke="#EFE8DF" strokeWidth="1">
                    <line x1="0" y1="40" x2="600" y2="40" />
                    <line x1="0" y1="90" x2="600" y2="90" />
                    <line x1="0" y1="140" x2="600" y2="140" />
                    <line x1="0" y1="190" x2="600" y2="190" />
                  </g>
                  <path d="M0,160 L20,150 L40,140 L60,135 L80,125 L100,128 L120,115 L140,118 L160,105 L180,98 L200,108 L220,90 L240,82 L260,88 L280,74 L300,68 L320,72 L340,58 L360,62 L380,48 L400,52 L420,40 L440,44 L460,34 L480,38 L500,28 L520,32 L540,22 L560,18 L580,24 L600,12 L600,200 L0,200 Z" fill="url(#dash-chart-fill)" />
                  <polyline points="0,160 20,150 40,140 60,135 80,125 100,128 120,115 140,118 160,105 180,98 200,108 220,90 240,82 260,88 280,74 300,68 320,72 340,58 360,62 380,48 400,52 420,40 440,44 460,34 480,38 500,28 520,32 540,22 560,18 580,24 600,12" stroke="#C4836A" strokeWidth="2" fill="none" />
                  <polyline points="0,178 20,172 40,168 60,162 80,160 100,155 120,150 140,148 160,140 180,138 200,132 220,128 240,120 260,118 280,112 300,108 320,100 340,98 360,92 380,88 400,82 420,80 440,72 460,70 480,64 500,62 520,58 540,52 560,48 580,46 600,40" stroke="#A89E94" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
                  <circle cx="600" cy="12" r="4" fill="#C4836A" stroke="#FAF8F5" strokeWidth="2" />
                </svg>
              </div>

              <div className="agents-list">
                <div className="agents-list__head">
                  <div className="agents-list__title">Топ агентов · 30 дней</div>
                  <a href="#" className="agents-list__more">все →</a>
                </div>
                {[
                  { i: 'АП', n: 'Аня Петрова', r: 'Senior · Митино', s: 94, t: '↑ 8', up: true, bg: 'linear-gradient(135deg, var(--brand-300), var(--brand-700))' },
                  { i: 'ДК', n: 'Дмитрий Кравцов', r: 'Middle · Центр', s: 88, t: '↑ 3', up: true, bg: 'linear-gradient(135deg,#D4A84C,#9A7833)' },
                  { i: 'ВЛ', n: 'Виктор Лебедев', r: 'Middle · Лефортово', s: 82, t: '↓ 4', up: false, bg: 'linear-gradient(135deg,#7A9E6B,#52784A)' },
                  { i: 'МР', n: 'Мария Романова', r: 'Junior · ЮВАО', s: 76, t: '↑ 12', up: true, bg: 'linear-gradient(135deg,#6B8EC4,#3E5A8C)' },
                ].map((a) => (
                  <div className="agent-row" key={a.n}>
                    <div className="agent-avatar" style={{ background: a.bg }}>{a.i}</div>
                    <div>
                      <div className="agent-row__name">{a.n}</div>
                      <div className="agent-row__role">{a.r}</div>
                    </div>
                    <div className="agent-row__score">{a.s}</div>
                    <div className="agent-row__trend" style={a.up ? undefined : { color: 'var(--error)' }}>{a.t}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function KpiBlock({ label, value, suffix, delta, deltaDown, lineColor = '#7A9E6B' }: { label: string; value: string; suffix?: string; delta: string; deltaDown?: boolean; lineColor?: string }) {
  return (
    <div className="kpi">
      <div className="kpi__label">{label}</div>
      <div className="kpi__value">{value}{suffix && <span className="kpi__value-suffix">{suffix}</span>}</div>
      <div className={'kpi__delta' + (deltaDown ? ' kpi__delta--down' : '')}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <polyline points={deltaDown ? '6 9 12 15 18 9' : '6 15 12 9 18 15'} />
        </svg>
        {delta}
      </div>
      <svg className="kpi__spark" viewBox="0 0 100 40" preserveAspectRatio="none">
        <polyline points="0,30 12,28 24,22 36,24 48,18 60,12 72,16 84,8 100,12" stroke={lineColor} strokeWidth="1.5" fill="none" />
      </svg>
    </div>
  );
}

function SpinSection() {
  const archetypes = [
    { l: 'И', n: 'Ипотечник', q: '«А если ставка вырастет ещё на два пункта — я не потяну.»', tag: 'тревога · бюджет', bg: 'linear-gradient(135deg,#E2A98E,#9A6048)' },
    { l: 'С', n: 'Семья 2 детей', q: '«Школа должна быть в пешей доступности, и окна — не на трассу.»', tag: 'эмоции · инфраструктура', bg: 'linear-gradient(135deg,#D4A84C,#9A7833)' },
    { l: 'И', n: 'Инвестор', q: '«Покажите цифры по аренде за последние три квартала.»', tag: 'данные · ROI', bg: 'linear-gradient(135deg,#7A9E6B,#52784A)' },
    { l: 'К', n: 'Коллекционер', q: '«Меня интересует только Сталинка, и желательно с историей.»', tag: 'статус · вкус', bg: 'linear-gradient(135deg,#6B8EC4,#3E5A8C)' },
    { l: 'Б', n: 'Беженец из аренды', q: '«Надоело платить чужой ипотечник. Давайте быстро.»', tag: 'срочность', bg: 'linear-gradient(135deg,#B891C4,#6A4A8C)' },
    { l: 'П', n: 'Пенсионер', q: '«Я уже один раз обжёгся. Хочу всё чётко по документам.»', tag: 'доверие · бумаги', bg: 'linear-gradient(135deg,#C49A6B,#7A4A2E)' },
    { l: 'Н', n: 'Новосёл', q: '«Первая квартира. Не понимаю, что вообще спрашивать.»', tag: 'обучение', bg: 'linear-gradient(135deg,#6BC4B8,#2E7A6E)' },
    { l: 'Р', n: 'Разменщик', q: '«Сначала продать свою, потом думать о вашей.»', tag: 'альтернатива', bg: 'linear-gradient(135deg,#C46B82,#7A2E48)' },
  ];
  return (
    <section className="section" id="spin">
      <div className="container">
        <div className="spin">
          <div className="spin__head">
            <div>
              <span className="eyebrow">SPIN · Тренажёр продаж</span>
              <h2 style={{ marginTop: 24 }}>Каждый клиент<br />уже жил у&nbsp;нас в&nbsp;голове.</h2>
            </div>
            <div>
              <p className="lead" style={{ maxWidth: 'none' }}>
                Восемь типажей покупателя — от&nbsp;тревожного ипотечника до&nbsp;циничного инвестора.
                Агент тренируется с&nbsp;ними по&nbsp;методике SPIN, без&nbsp;цены ошибки,
                до&nbsp;того как встретит&nbsp;их вживую.
              </p>
            </div>
          </div>
          <div className="archetypes">
            {archetypes.map((a, i) => (
              <article className="archetype" key={`${a.n}-${i}`}>
                <div className="archetype__avatar" style={{ background: a.bg }}>{a.l}</div>
                <h3 className="archetype__name">{a.n}</h3>
                <p className="archetype__quote">{a.q}</p>
                <span className="archetype__tag">{a.tag}</span>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function AITeamSection() {
  const cards = [
    {
      icon: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />,
      title: <>AI-секретарь<br />на входящие звонки</>,
      desc: 'Покупатель звонит по объявлению с Авито или Циан. AI квалифицирует лид (бюджет, район, срочность, цель) и ставит встречу в календарь агента — без потерянных звонков и занятых линий.',
      signals: [
        { dot: 'brand' as const, text: 'Авито · 2-к, Митино, до 18 млн', time: 'входящий' },
        { dot: 'success' as const, text: 'Встреча · Аня П. · завтра 14:30', time: 'в календаре' },
      ],
    },
    {
      icon: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />,
      title: <>AI-стажёр<br />в чате 24/7</>,
      desc: 'Новый агент задаёт вопросы — AI отвечает, опираясь на регламенты агентства и записи показов лучших коллег. Адаптация без ожидания руководителя и без пустых вопросов в общий чат.',
      signals: [
        { dot: 'brand' as const, text: '«Как закрыть возражение по аренде?»', time: '23:14' },
        { dot: 'success' as const, text: 'Ответ + скрипт + кейс из показа', time: '+8 сек' },
      ],
    },
    {
      icon: <>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        <circle cx="19" cy="5" r="2.4" fill="currentColor" stroke="none" opacity="0.9" />
      </>,
      title: <>Mystery shopper<br />исходящие звонки</>,
      desc: 'AI звонит вашим агентам как клиент: оценивает по SPIN, фиксирует слабые места, готовит разбор. Параллельно — сканирует конкурентов: цены, аргументация, скрипты.',
      signals: [
        { dot: 'brand' as const, text: 'Тест-звонок · Виктор Л. · 04:12', time: 'исходящий' },
        { dot: 'warn' as const, text: 'SPIN score 72 · слабая импликация', time: '+отчёт' },
      ],
    },
  ];
  return (
    <section className="section team" id="ai-team">
      <div className="container">
        <div className="team__head">
          <div>
            <span className="section-label">— AI-команда · roadmap</span>
            <h2 className="team__intro">
              <em>Тихий помощник</em>,<br />
              который знает<br />
              вашу команду.
            </h2>
          </div>
          <div>
            <p className="team__quote">
              После steady-state в EstateOS входят голосовые AI-агенты. Не агрессивный продавец
              и не «робот вместо тебя» — а доверенный коллега, который снимает рутину и появляется
              в нужный момент. Звонки, обучение, аудит&nbsp;качества — голосом.
            </p>
          </div>
        </div>

        <div className="agents">
          {cards.map((c, i) => (
            <article className="agent-card" key={i}>
              <div className="agent-card__head">
                <div className="agent-card__icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    {c.icon}
                  </svg>
                </div>
                <span className="soon-badge">Скоро · roadmap</span>
              </div>
              <h3 className="agent-card__title">{c.title}</h3>
              <p className="agent-card__desc">{c.desc}</p>
              <div className="agent-card__signals">
                {c.signals.map((s, j) => {
                  const dotStyle =
                    s.dot === 'success'
                      ? { background: 'var(--success)', boxShadow: '0 0 0 3px rgba(122,158,107,0.18)' }
                      : s.dot === 'warn'
                      ? { background: 'var(--warning)', boxShadow: '0 0 0 3px rgba(212,168,76,0.18)' }
                      : undefined;
                  return (
                    <div className="agent-card__signal" key={j}>
                      <span className="agent-card__signal-dot" style={dotStyle}></span>
                      {s.text}
                      <span className="agent-card__signal-time">{s.time}</span>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function OwnersSection() {
  const benefits = [
    { icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>, title: '5 минут на агентство в день', desc: 'Утренний разбор — в пробке, за кофе, перед первым звонком. Не нужно открывать ноутбук, чтобы узнать, что вчера произошло.' },
    { icon: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />, title: 'Слепые зоны исчезают', desc: 'Не закрытый follow-up, упавшая скорость отчётов, агент-чемпион, идущий на спад — всё всплывает само, без планёрки.' },
    { icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>, title: 'Команда растёт без вашего участия', desc: 'SPIN-тренажёр прокачивает агентов между показами. Вы видите прогресс на дашборде, не ведя коучинг вручную.' },
    { icon: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>, title: 'Контроль остаётся у вас', desc: 'EstateOS не звонит клиентам и не принимает решений. Он собирает картину — решает агентство.' },
  ];
  return (
    <section className="section" id="owners">
      <div className="container">
        <div className="owners">
          <div>
            <span className="section-label">— Для владельцев</span>
            <h2 className="owners__quote" style={{ marginTop: 24 }}>
              Для тех, кто <em>строит</em> агентство.<br />
              И для команды, которая в&nbsp;нём работает.
            </h2>
            <p className="lead" style={{ marginTop: 24 }}>
              Владельцу — картина агентства каждое утро, без&nbsp;планёрок и&nbsp;сводок.
              Менеджеру — отчёт голосом за&nbsp;минуту вместо Excel-табличек и&nbsp;CRM-полей.
              EstateOS работает на&nbsp;обе стороны: одни видят результат, другие&nbsp;— избавлены от&nbsp;рутины.
            </p>
            <div className="owners__cite">
              <div className="owners__cite-avatar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFF8F3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <div className="owners__cite-name">Владелец агентства недвижимости</div>
                <div className="owners__cite-role">Москва</div>
              </div>
            </div>
          </div>
          <div className="benefits">
            {benefits.map((b) => (
              <div className="benefit" key={b.title}>
                <div className="benefit__icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{b.icon}</svg>
                </div>
                <div>
                  <div className="benefit__title">{b.title}</div>
                  <div className="benefit__desc">{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BigStats() {
  const stats = [
    { num: <em>9:30</em>, label: 'МСК. Каждый день. Голосовой разбор на вашем iPhone.' },
    { num: <em>4:38</em>, label: 'Средняя длина утреннего разбора. Меньше, чем поездка до офиса.' },
    { num: <em>87%</em>, label: 'Follow-up закрываются вовремя — впервые с запуска агентства.' },
    { num: <>×<em>3.2</em></>, label: 'Скорость отчёта после показа: голос вместо CRM-формы.' },
  ];
  return (
    <section className="section section--tight">
      <div className="container">
        <div className="bigstats">
          {stats.map((s, i) => (
            <div className="bigstat" key={i}>
              <div className="bigstat__num">{s.num}</div>
              <div className="bigstat__label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="section section--tight">
      <div className="container">
        <div className="final-cta">
          <span className="eyebrow" style={{ marginBottom: 24 }}>Доступно по&nbsp;приглашению</span>
          <h2>Войдите в&nbsp;EstateOS<br />и&nbsp;услышьте своё агентство.</h2>
          <p>Первый разбор приходит на&nbsp;следующее утро после&nbsp;первого показа. Без&nbsp;карт, без&nbsp;онбординга на&nbsp;30&nbsp;минут.</p>
          <div className="final-cta__row">
            <a href="/login" className="btn btn--primary">
              Войти в&nbsp;EstateOS <Arrow />
            </a>
            <a href="#product" className="btn btn--ghost">Посмотреть продукт</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <div className="footer__brand">
              <LogoMark size={32} />
              <span className="footer__brand-text">EstateOS</span>
            </div>
            <p className="footer__tagline">
              Операционная система для&nbsp;агентств недвижимости. Голос агента, утренний разбор, аналитика, тренажёр продаж.
            </p>
          </div>
          <div>
            <div className="footer__col-title">Продукт</div>
            <a href="#narrator" className="footer__link">Утренний разбор</a>
            <a href="#product" className="footer__link">Голос агента</a>
            <a href="#product" className="footer__link">Аналитика</a>
            <a href="#spin" className="footer__link">SPIN-тренажёр</a>
          </div>
          <div>
            <div className="footer__col-title">Агентство</div>
            <a href="#owners" className="footer__link">Для владельцев</a>
            <a href="/agent" className="footer__link">Для агентов</a>
            <a href="#ai-team" className="footer__link">Roadmap</a>
          </div>
          <div>
            <div className="footer__col-title">Контакты</div>
            <a href="mailto:hi@estateos.ru" className="footer__link">hi@estateos.ru</a>
            <a href="https://estateos.ru" className="footer__link">estateos.ru</a>
          </div>
        </div>
        <div className="footer__bottom">
          <div>© 2026 EstateOS · estateos.ru</div>
          <div className="footer__legal">
            <a href="#">Условия</a>
            <a href="#">Конфиденциальность</a>
            <a href="#">Безопасность данных</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------
 *  Page composition
 * ------------------------------------------------------------ */

export function Landing() {
  return (
    <div className="lp">
      <Nav />
      <Hero />
      <Features />
      <NarratorShowcase />
      <DashboardShowcase />
      <SpinSection />
      <AITeamSection />
      <OwnersSection />
      <BigStats />
      <FinalCTA />
      <Footer />
    </div>
  );
}
