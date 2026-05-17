import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: true,
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASSWORD!,
  },
});

// Brand: same wave-bars logo as apps/web/public/logo.svg, inlined for email clients.
const LOGO_SVG = `<svg width="40" height="40" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="em-lg-fill" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#D89A82"/>
      <stop offset="55%" stop-color="#C4836A"/>
      <stop offset="100%" stop-color="#9A6048"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="32" height="32" rx="9" fill="url(#em-lg-fill)"/>
  <g fill="#FFFDF9">
    <rect x="6" y="13" width="2.6" height="6" rx="1.3"/>
    <rect x="10.5" y="10" width="2.6" height="12" rx="1.3"/>
    <rect x="15" y="7" width="2.6" height="18" rx="1.3"/>
    <rect x="19.5" y="11" width="2.6" height="10" rx="1.3"/>
    <rect x="24" y="14" width="2.6" height="4" rx="1.3"/>
  </g>
</svg>`;

/**
 * Sends a passwordless sign-in link.
 *
 * Project rule (см. memory feedback_no_partner_word_in_ai_output):
 * НИКОГДА не подставляй organizationName / личное имя в текст письма —
 * получатель может быть тем же admin'ом, чьё имя/название агентства у нас
 * записано в orgs. Текст письма всегда от безличного "EstateOS".
 */
export async function sendMagicLink(
  to: string,
  magicLink: string,
  _organizationName?: string
): Promise<void> {
  // Subject включает HH:MM МСК — Gmail/Mail.ru иначе сворачивают все magic-link'и
  // в один thread по теме, и новое письмо легко не заметить.
  const mskTime = new Date().toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM!,
    to,
    subject: `Вход в EstateOS · ${mskTime}`,
    text: `Здравствуйте,

это ссылка для входа в EstateOS — операционную AI-платформу для агентств недвижимости.

Войти: ${magicLink}

Ссылка действительна 24 часа. Если вы её не запрашивали — просто проигнорируйте письмо.

— Команда EstateOS
`,
    html: `<!doctype html>
<html lang="ru">
<body style="margin:0;padding:32px 16px;background:#FAF8F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2C2520;-webkit-font-smoothing:antialiased">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="max-width:520px;width:100%;margin:0 auto;background:#FFFFFF;border:1px solid #E8E0D8;border-radius:18px;overflow:hidden">
    <tr><td style="padding:32px 32px 8px">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="vertical-align:middle;padding-right:12px">${LOGO_SVG}</td>
          <td style="vertical-align:middle;font-size:18px;font-weight:600;letter-spacing:-0.01em;color:#2C2520">EstateOS</td>
        </tr>
      </table>
    </td></tr>
    <tr><td style="padding:8px 32px 0">
      <h1 style="margin:16px 0 8px;font-size:24px;font-weight:500;letter-spacing:-0.02em;line-height:1.2;color:#2C2520">Вход в EstateOS</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.55;color:#7A6E63">
        Это запрошенная ссылка для входа. Нажмите кнопку ниже — мы вас узнаем без пароля.
      </p>
      <p style="margin:0 0 28px">
        <a href="${magicLink}" style="display:inline-block;padding:14px 28px;background:linear-gradient(180deg,#CC8E76 0%,#C4836A 55%,#B0735C 100%);color:#FFF8F3;font-size:15px;font-weight:500;letter-spacing:-0.005em;text-decoration:none;border-radius:999px;box-shadow:0 10px 24px -10px rgba(154,96,72,0.55)">
          Войти в EstateOS
        </a>
      </p>
      <p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:#A89E94">
        Если кнопка не открывается, скопируйте ссылку в браузер:<br>
        <a href="${magicLink}" style="color:#9A6048;word-break:break-all">${magicLink}</a>
      </p>
    </td></tr>
    <tr><td style="padding:24px 32px 28px;border-top:1px solid #EFE8DF;background:#FBF8F4">
      <p style="margin:0;font-size:12px;line-height:1.5;color:#A89E94">
        Ссылка действительна 24 часа. Если вы не запрашивали вход — просто проигнорируйте это письмо.
      </p>
      <p style="margin:8px 0 0;font-size:12px;color:#A89E94">— Команда EstateOS</p>
    </td></tr>
  </table>
</body>
</html>`,
  });
}
