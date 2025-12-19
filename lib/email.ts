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

const styles = {
  container: 'font-family: Inter, system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;',
  header: 'background-color: #0f172a; padding: 24px; text-align: center;',
  headerText: 'color: #ffffff; font-size: 20px; font-weight: 600; margin: 0; text-decoration: none;',
  content: 'padding: 32px 24px; color: #334155; line-height: 1.6;',
  h1: 'margin-top: 0; margin-bottom: 16px; font-size: 24px; font-weight: 700; color: #0f172a;',
  text: 'margin: 0 0 16px; font-size: 16px; color: #334155;',
  buttonContainer: 'text-align: center; margin: 32px 0;',
  button: 'display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px;',
  footer: 'background-color: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;',
  link: 'color: #2563eb; text-decoration: underline;',
  detailBox: 'background-color: #f1f5f9; padding: 16px; border-radius: 6px; margin-bottom: 24px;',
  detailRow: 'margin: 8px 0; font-size: 14px; color: #475569;'
}

function generateEmailHtml({ title, content, buttonText, buttonUrl }: { title: string, content: string, buttonText?: string, buttonUrl?: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f1f5f9;">
  <div style="${styles.container}">
    <!-- Header -->
    <div style="${styles.header}">
      <a href="${appUrl}" style="${styles.headerText}">Hírdetés Rendszerző</a>
    </div>

    <!-- Content -->
    <div style="${styles.content}">
      <h1 style="${styles.h1}">${title}</h1>
      ${content}
      
      ${buttonText && buttonUrl ? `
        <div style="${styles.buttonContainer}">
          <a href="${buttonUrl}" style="${styles.button}">${buttonText}</a>
        </div>
      ` : ''}
      
      ${buttonText && buttonUrl ? `
        <p style="${styles.text}; font-size: 14px; color: #94a3b8; margin-top: 24px;">
          Ha a gomb nem működik, másold be ezt a linket a böngésződbe:<br>
          <a href="${buttonUrl}" style="${styles.link}">${buttonUrl}</a>
        </p>
      ` : ''}
    </div>

    <!-- Footer -->
    <div style="${styles.footer}">
      <p style="margin: 0;">© ${new Date().getFullYear()} Készítette Gábor Sándor - 2025</p>
      <p style="margin: 8px 0 0;">Ez egy automatikus üzenet, kérjük ne válaszolj rá.</p>
    </div>
  </div>
</body>
</html>
  `
}

export async function sendMail({ to, subject, html }: MailOptions) {
  const transporter = getTransport()
  const from = process.env.MAIL_FROM || 'Recruit Planner <noreply@local>'
  
  if (!transporter) {
    console.log('[MAIL:FALLBACK] To:', to)
    console.log('[MAIL:FALLBACK] Subject:', subject)
    console.log('[MAIL:FALLBACK] HTML Preview (first 100 chars):', html.substring(0, 100))
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
  const content = `
    <p style="${styles.text}">Új felhasználói regisztráció érkezett, amely jóváhagyásra vár.</p>
    <div style="${styles.detailBox}">
      <p style="${styles.detailRow}"><strong>Felhasználónév:</strong> ${username}</p>
      <p style="${styles.detailRow}"><strong>Email cím:</strong> ${email}</p>
    </div>
    <p style="${styles.text}">A fiók aktiválásához kattints az alábbi gombra:</p>
  `
  
  return {
    to: process.env.ADMIN_EMAIL || 'gabor.sandor@vizizor.hu',
    subject: 'Új regisztráció jóváhagyása',
    html: generateEmailHtml({
      title: 'Új regisztráció',
      content,
      buttonText: 'Regisztráció jóváhagyása',
      buttonUrl: approveUrl
    })
  }
}

export function resetEmail({ to, resetUrl }: { to: string; resetUrl: string }) {
  const content = `
    <p style="${styles.text}">Jelszó visszaállítási kérelem érkezett a fiókodhoz.</p>
    <p style="${styles.text}">Ha nem te kezdeményezted ezt a kérést, hagyd figyelmen kívül ezt az emailt.</p>
    <p style="${styles.text}">A jelszó visszaállításához kattints az alábbi gombra (a link 1 óráig érvényes):</p>
  `

  return {
    to,
    subject: 'Jelszó visszaállítása',
    html: generateEmailHtml({
      title: 'Jelszó visszaállítása',
      content,
      buttonText: 'Jelszó visszaállítása',
      buttonUrl: resetUrl
    })
  }
}

export function warningEmail({ to, message, senderName, sentAt }: { to: string; message: string; senderName: string; sentAt: string }) {
  const content = `
    <p style="${styles.text}">Figyelmeztetés érkezett a következő felhasználótól: <strong>${senderName}</strong></p>
    <p style="${styles.text}">Időpont: ${sentAt}</p>
    <div style="${styles.detailBox}">
      <p style="${styles.detailRow}"><strong>Üzenet:</strong></p>
      <p style="${styles.text}" style="white-space: pre-wrap;">${message.replace(/\n/g, '<br>')}</p>
    </div>
    <p style="${styles.text}">Ez egy automatikus értesítés, kérjük ne válaszolj rá közvetlenül.</p>
  `

  return {
    to,
    subject: 'Figyelmeztetés - Hirdetés Rendszerző',
    html: generateEmailHtml({
      title: 'Figyelmeztetés',
      content
    })
  }
}

export function weeklyDigestEmail({ to, ads, start, end }: { to: string; ads: any[]; start: string; end: string }) {
  const adRows = ads.map(ad => `
    <div style="background-color: #ffffff; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 8px;">
      <div style="font-weight: 600; color: #0f172a; margin-bottom: 4px;">${ad.positionName}</div>
      <div style="font-size: 14px; color: #64748b; margin-bottom: 4px;">
        <span style="background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 12px;">${ad.type}</span>
        • ${ad.partner.name} (${ad.partner.office})
      </div>
      <div style="font-size: 14px; color: #ef4444;">
        Lejárat: ${new Date(ad.endDate).toLocaleDateString('hu-HU')}
      </div>
    </div>
  `).join('')

  const content = `
    <p style="${styles.text}">Az alábbi hirdetések járnak le ezen a héten (${start} - ${end}):</p>
    <div style="${styles.detailBox}">
      ${adRows}
    </div>
    <p style="${styles.text}">Kérjük, ellenőrizd a hirdetéseket és hosszabbítsd meg őket, ha szükséges.</p>
  `

  return {
    to,
    subject: 'Heti hirdetés emlékeztető',
    html: generateEmailHtml({
      title: 'Lejáró hirdetések',
      content,
      buttonText: 'Hirdetések megtekintése',
      buttonUrl: (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/advertisements'
    })
  }
}
