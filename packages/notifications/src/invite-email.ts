import nodemailer from 'nodemailer';

let _transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: true,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASSWORD!,
    },
  });
  return _transporter;
}

export async function sendInviteEmail(
  to: string,
  inviteUrl: string,
  organizationName: string,
  agentFirstName: string | null
): Promise<void> {
  // Project rule: только Organization name, БЕЗ имени admin'а
  const greeting = agentFirstName ? `${agentFirstName}, здравствуйте!` : 'Здравствуйте!';
  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM!,
    to,
    subject: `${organizationName} приглашает вас в EstateOS`,
    text: `${greeting}

${organizationName} приглашает вас работать в EstateOS — голосовая отчётность для агентов недвижимости.

Войти: ${inviteUrl}

Ссылка действительна 7 дней.

— Команда EstateOS
`,
    html: `<p>${greeting}</p>
<p><strong>${organizationName}</strong> приглашает вас работать в <strong>EstateOS</strong> — голосовая отчётность для агентов недвижимости.</p>
<p><a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:8px">Войти в EstateOS</a></p>
<p style="color:#666">Ссылка действительна 7 дней.</p>
`,
  });
}
