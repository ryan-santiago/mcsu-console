import "server-only";
import { env } from "@/lib/env";

/**
 * EmailService (docs/02 § Email, ADR 0009). One shared sender mailbox via Microsoft Graph in
 * staging/prod; the console driver logs mail when the Azure vars aren't set (local dev, CI).
 */
export type EmailMessage = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
};

interface EmailDriver {
  send(message: EmailMessage): Promise<void>;
}

const consoleDriver: EmailDriver = {
  async send(message) {
    console.info(
      `[email] to=${[message.to].flat().join(",")} subject="${message.subject}"\n${message.text}`,
    );
  },
};

let cachedToken: { value: string; expiresAt: number } | null = null;

async function graphToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const response = await fetch(
    `https://login.microsoftonline.com/${env.AZURE_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      body: new URLSearchParams({
        client_id: env.AZURE_CLIENT_ID ?? "",
        client_secret: env.AZURE_CLIENT_SECRET ?? "",
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    },
  );
  if (!response.ok) throw new Error(`Graph token request failed: ${response.status}`);
  const body = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return body.access_token;
}

const graphDriver: EmailDriver = {
  async send(message) {
    const recipients = [message.to].flat();
    const to = env.MAIL_OVERRIDE_TO ? [env.MAIL_OVERRIDE_TO] : recipients;
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(env.MAIL_SENDER ?? "")}/sendMail`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await graphToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            subject: env.MAIL_OVERRIDE_TO
              ? `[to: ${recipients.join(", ")}] ${message.subject}`
              : message.subject,
            body: { contentType: "HTML", content: message.html },
            toRecipients: to.map((address) => ({ emailAddress: { address } })),
            replyTo: env.MAIL_REPLY_TO ? [{ emailAddress: { address: env.MAIL_REPLY_TO } }] : [],
          },
          saveToSentItems: false,
        }),
      },
    );
    if (!response.ok) throw new Error(`Graph sendMail failed: ${response.status}`);
  },
};

function driver(): EmailDriver {
  const configured =
    env.AZURE_TENANT_ID && env.AZURE_CLIENT_ID && env.AZURE_CLIENT_SECRET && env.MAIL_SENDER;
  return configured ? graphDriver : consoleDriver;
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  await driver().send(message);
}
