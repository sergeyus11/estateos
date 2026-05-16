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

export async function sendMagicLink(
  to: string,
  magicLink: string,
  organizationName: string
): Promise<void> {
  // Project rule: НИКАКИХ личных имён admin'ов в шаблонах — только Organization name
  await transporter.sendMail({
    from: process.env.SMTP_FROM!,
    to,
    subject: `${organizationName} приглашает вас в EstateOS`,
    text: `Здравствуйте,

${organizationName} приглашает вас войти в EstateOS — операционную AI-платформу для агентств недвижимости.

Чтобы войти, перейдите по ссылке: ${magicLink}

Ссылка действительна 7 дней. Если вы не ожидали этого письма — просто проигнорируйте.

— Команда EstateOS
`,
    html: `<p>Здравствуйте,</p>
<p><strong>${organizationName}</strong> приглашает вас войти в <strong>EstateOS</strong> — операционную AI-платформу для агентств недвижимости.</p>
<p><a href="${magicLink}" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:8px">Войти в EstateOS</a></p>
<p style="color:#666">Ссылка действительна 7 дней. Если вы не ожидали этого письма — просто проигнорируйте.</p>
<p style="color:#666">— Команда EstateOS</p>
`,
  });
}
