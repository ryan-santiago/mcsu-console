import "server-only";
import type { EmailMessage } from "./index";

/** Escape user-provided text for the HTML body. */
function esc(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}

/** Simple branded layout. Emails carry no sensitive data, only a short text and a link. */
function layout(title: string, paragraphs: string[], action?: { label: string; url: string }) {
  const body = paragraphs.map((p) => `<p style="margin:0 0 16px">${esc(p)}</p>`).join("");
  const button = action
    ? `<p style="margin:24px 0"><a href="${esc(action.url)}" style="background:#000FBE;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">${esc(action.label)}</a></p>`
    : "";
  const html = `<!doctype html><html><body style="margin:0;background:#F6F7FB;font-family:Segoe UI,Arial,sans-serif;color:#1b1d3a">
<div style="max-width:560px;margin:0 auto;padding:32px 24px">
<p style="font-weight:700;color:#000FBE;margin:0 0 24px">MCSU Console</p>
<div style="background:#fff;border-radius:16px;padding:28px;border:1px solid #e6e8f2">
<h1 style="font-size:20px;margin:0 0 16px">${esc(title)}</h1>${body}${button}</div>
<p style="font-size:12px;color:#6b6f86;margin:16px 0 0">QSERV – MCSU · This is an automated message.</p>
</div></body></html>`;
  const text = [
    title,
    "",
    ...paragraphs,
    ...(action ? ["", `${action.label}: ${action.url}`] : []),
  ].join("\n");
  return { html, text };
}

export function passwordResetEmail(to: string, name: string, url: string): EmailMessage {
  return {
    to,
    subject: "Reset your MCSU Console password",
    ...layout(
      "Reset your password",
      [
        `Hi ${name},`,
        "We received a request to reset your password. The link below is valid for 1 hour.",
        "If you didn't ask for this, you can ignore this email. Your password won't change.",
      ],
      { label: "Reset password", url },
    ),
  };
}

export function notificationEmail(
  to: string | string[],
  title: string,
  body: string | null,
  url: string | null,
): EmailMessage {
  return {
    to,
    subject: title,
    ...layout(title, body ? [body] : [], url ? { label: "Open in MCSU Console", url } : undefined),
  };
}
