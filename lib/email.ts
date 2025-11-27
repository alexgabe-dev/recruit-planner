import nodemailer from 'nodemailer'

type MailOptions = {
  to: string
  subject: string
  html: string
}

function getTransport() {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const secure = process.env.SMTP_SECURE === 'true'
  if (host && port && user && pass) {
    return nodemailer.createTransport({ host, port, secure, auth: { user, pass } })
  }
  return null
}

export async function sendMail({ to, subject, html }: MailOptions) {
  const transporter = getTransport()
  const from = process.env.MAIL_FROM || 'noreply@local'
  if (!transporter) {
    console.log('[MAIL:FALLBACK] To:', to)
    console.log('[MAIL:FALLBACK] Subject:', subject)
    console.log('[MAIL:FALLBACK] HTML:', html)
    return { success: true, fallback: true }
  }
  try {
    await transporter.sendMail({ from, to, subject, html })
    return { success: true }
  } catch (err) {
    console.error('[MAIL:ERROR]', (err as any)?.message || err)
    return { success: false, error: 'mail_failed' }
  }
}

export function approvalEmail({ username, email, approveUrl }: { username: string; email: string; approveUrl: string }) {
  return {
    to: process.env.ADMIN_EMAIL || 'gabor.sandor@vitizor.hu',
    subject: 'Új regisztráció jóváhagyása',
    html: `
      <div style="font-family:Inter,system-ui,sans-serif">
        <h2>Új regisztráció</h2>
        <p>Felhasználónév: <b>${username}</b></p>
        <p>Email: <b>${email}</b></p>
        <p>Jóváhagyás: <a href="${approveUrl}">${approveUrl}</a></p>
      </div>
    `,
  }
}

export function resetEmail({ to, resetUrl }: { to: string; resetUrl: string }) {
  return {
    to,
    subject: 'Jelszó visszaállítása',
    html: `
      <div style="font-family:Inter,system-ui,sans-serif">
        <h2>Jelszó visszaállítása</h2>
        <p>Kérjük kattints a következő linkre a jelszó visszaállításához:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>A link 1 óráig érvényes.</p>
      </div>
    `,
  }
}
