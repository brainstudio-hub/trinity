import "server-only";

type Email = { to: string; subject: string; html: string; text: string };

/**
 * Envía correos con Resend si RESEND_API_KEY está configurada.
 * Sin clave (desarrollo), registra el contenido en la consola del servidor.
 */
export async function sendEmail(email: Email): Promise<{ delivered: boolean }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Campus Trinity <no-reply@tas.edu>";

  if (!key) {
    console.info(`[email:dev] Para: ${email.to}\nAsunto: ${email.subject}\n\n${email.text}`);
    return { delivered: false };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: email.to, subject: email.subject, html: email.html, text: email.text }),
    });
    if (!res.ok) {
      console.error("[email] Resend respondió", res.status, await res.text());
      return { delivered: false };
    }
    return { delivered: true };
  } catch (error) {
    console.error("[email] error de envío", error);
    return { delivered: false };
  }
}

export function appUrl(path = ""): string {
  const base =
    process.env.APP_URL ??
    (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "http://localhost:3000");
  return `${base.replace(/\/$/, "")}${path}`;
}

export function layoutEmail(title: string, bodyHtml: string): string {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#FBF8F3;font-family:Montserrat,Arial,sans-serif;color:#1F1B13">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
  <table width="100%" style="max-width:520px;background:#fff;border:1px solid #EAE1D4;border-radius:12px;padding:32px">
  <tr><td>
    <p style="margin:0 0 24px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#6B6356">Seminario Anglicano Trinity</p>
    <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-weight:500;font-size:26px;color:#00243A">${title}</h1>
    ${bodyHtml}
  </td></tr></table>
  <p style="font-size:11px;color:#6B6356;margin-top:16px">Campus virtual · Seminario Anglicano Trinity</p>
  </td></tr></table></body></html>`;
}
