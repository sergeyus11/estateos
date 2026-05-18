'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from '@/lib/auth-client';

function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="login-lg-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D89A82" />
          <stop offset="55%" stopColor="#C4836A" />
          <stop offset="100%" stopColor="#9A6048" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="32" height="32" rx="9" fill="url(#login-lg-fill)" />
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

function LoginContent() {
  const params = useSearchParams();
  const emailFromUrl = params?.get('email') || '';
  const autosend = params?.get('autosend') === '1';
  const roleFromUrl = params?.get('role') || '';
  const callbackURL = roleFromUrl === 'agent' ? '/agent' : '/admin';

  const [email, setEmail] = useState(emailFromUrl);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function send() {
    setStatus('sending');
    setErrorMsg('');
    try {
      await signIn.magicLink({ email, callbackURL });
      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await send();
  }

  useEffect(() => {
    if (autosend && emailFromUrl && status === 'idle') {
      void send();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="lp" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* pill nav identical to landing */}
      <nav className="nav" aria-label="Главная навигация">
        <div className="nav__inner">
          <a href="/" className="nav__logo" aria-label="EstateOS — на главную">
            <LogoMark size={26} />
            <span className="nav__logo-text">EstateOS</span>
          </a>
          <a href="/" className="btn btn--ghost btn--nav">На главную</a>
        </div>
      </nav>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 20px 60px' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <LogoMark size={48} />
            <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', textAlign: 'center' }}>
              Войти в&nbsp;EstateOS
            </h1>
            <p style={{ fontSize: 14, color: 'var(--ink-3)', textAlign: 'center', maxWidth: 340 }}>
              Введите свой email — пришлём ссылку для входа без пароля.
            </p>
          </div>

          {status === 'sent' ? (
            <div className="surface-card" style={{ background: 'linear-gradient(180deg,#FBF8F4,#F2EDE8)', textAlign: 'center', padding: 28 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(122,158,107,0.15)', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>Ссылка отправлена</div>
              <div style={{ marginTop: 6, fontSize: 13, color: 'var(--ink-2)' }}>
                Проверьте почту на&nbsp;<strong style={{ color: 'var(--ink)' }}>{email}</strong>. Письмо может прийти в&nbsp;течение минуты.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="surface-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ display: 'block' }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>
                  Email
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@agency.ru"
                  className="surface-card"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 15, fontFamily: 'inherit', color: 'var(--ink)', background: 'var(--surface)', border: '1px solid var(--line)' }}
                  data-testid="email-input"
                />
              </label>
              <button
                type="submit"
                disabled={status === 'sending'}
                className="btn btn--primary"
                style={{ justifyContent: 'center', width: '100%', padding: '12px 22px', opacity: status === 'sending' ? 0.6 : 1 }}
                data-testid="submit"
              >
                {status === 'sending' ? 'Отправляем…' : 'Получить ссылку'}
                {status !== 'sending' && (
                  <svg className="arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                )}
              </button>
              {errorMsg && (
                <p style={{ fontSize: 13, color: 'var(--color-red-700)' }} data-testid="error">
                  {errorMsg}
                </p>
              )}
              <p style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'center', marginTop: 4, lineHeight: 1.5 }}>
                Запомним вас на&nbsp;этом устройстве на&nbsp;90 дней&nbsp;— пароль не&nbsp;нужен.<br/>
                Ссылка из&nbsp;письма действует 24&nbsp;часа. Доступ по&nbsp;приглашению.
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
