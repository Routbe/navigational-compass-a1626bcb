/**
 * ROUT mail kit — one clean design for every e-mail the site sends.
 *
 * Pure string builders (sync, no React) so both server functions and the
 * notification renderer can use them. Every dynamic value passes through
 * `esc()`; callers never hand raw user input to `raw`.
 *
 * Design: white page, centred 520px card, ROUT wordmark, one heading, short
 * copy, optional detail table, one primary button (or approve/reject pair),
 * quiet footer. Mail clients ignore CSS variables, so colours are inline.
 */

export const KIT = {
  page: "#f5f4f2",
  card: "#ffffff",
  border: "#e7e4df",
  text: "#151413",
  muted: "#6b665f",
  ink: "#0b0b0c",
  mint: "#1f9e6a",
  mintBg: "#e8f7ef",
  pink: "#db2777",
  pinkBg: "#fdeef6",
  amber: "#b45309",
  amberBg: "#fdf3e3",
  red: "#c0362c",
  redBg: "#fcebea",
  blue: "#1d6fd8",
  blueBg: "#e8f1fc",
} as const;

export type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "creator" | "business";

const TONES: Record<Tone, { fg: string; bg: string }> = {
  neutral: { fg: KIT.muted, bg: "#f1efec" },
  success: { fg: KIT.mint, bg: KIT.mintBg },
  warning: { fg: KIT.amber, bg: KIT.amberBg },
  danger: { fg: KIT.red, bg: KIT.redBg },
  info: { fg: KIT.blue, bg: KIT.blueBg },
  creator: { fg: KIT.pink, bg: KIT.pinkBg },
  business: { fg: KIT.ink, bg: "#ecebe8" },
};

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

export function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Only http(s) links ever reach an href. */
export function safeUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? esc(url) : "#";
}

export const pill = (label: string, tone: Tone = "neutral") => {
  const t = TONES[tone];
  return `<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${t.bg};color:${t.fg};font:600 11px/1.4 ${FONT};letter-spacing:.06em;text-transform:uppercase">${esc(label)}</span>`;
};

export const heading = (text: string) =>
  `<h1 style="margin:14px 0 10px;font:650 22px/1.3 ${FONT};color:${KIT.text};letter-spacing:-.01em">${esc(text)}</h1>`;

export const paragraph = (text: string) =>
  `<p style="margin:0 0 14px;font:400 15px/1.6 ${FONT};color:${KIT.text}">${esc(text)}</p>`;

export const note = (text: string) =>
  `<p style="margin:14px 0 0;font:400 13px/1.55 ${FONT};color:${KIT.muted}">${esc(text)}</p>`;

export const quote = (text: string) =>
  `<div style="margin:6px 0 16px;padding:12px 14px;border-left:3px solid ${KIT.border};background:#faf9f7;border-radius:6px;font:400 14px/1.55 ${FONT};color:${KIT.text};white-space:pre-wrap">${esc(text)}</div>`;

export const code = (value: string) =>
  `<div style="margin:6px 0 18px;padding:16px;border-radius:12px;background:#f5f4f2;text-align:center;font:600 28px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.3em;color:${KIT.ink}">${esc(value)}</div>`;

export function details(rows: Array<[string, unknown]>): string {
  const body = rows
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
    .map(
      ([k, v]) =>
        `<tr><td style="padding:9px 0;border-top:1px solid ${KIT.border};font:500 13px/1.4 ${FONT};color:${KIT.muted};width:38%;vertical-align:top">${esc(k)}</td>` +
        `<td style="padding:9px 0;border-top:1px solid ${KIT.border};font:500 14px/1.4 ${FONT};color:${KIT.text};word-break:break-word">${esc(v)}</td></tr>`,
    )
    .join("");
  return body
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 18px;border-bottom:1px solid ${KIT.border}">${body}</table>`
    : "";
}

type BtnStyle = "primary" | "approve" | "reject" | "ghost";
const BTN: Record<BtnStyle, string> = {
  primary: `background:${KIT.ink};color:#ffffff;border:1px solid ${KIT.ink}`,
  approve: `background:${KIT.mint};color:#ffffff;border:1px solid ${KIT.mint}`,
  reject: `background:#ffffff;color:${KIT.red};border:1px solid ${KIT.red}`,
  ghost: `background:#ffffff;color:${KIT.text};border:1px solid ${KIT.border}`,
};

export const button = (label: string, url: string, style: BtnStyle = "primary") =>
  `<a href="${safeUrl(url)}" style="display:inline-block;${BTN[style]};text-decoration:none;padding:12px 22px;border-radius:12px;font:600 14px/1 ${FONT}">${esc(label)}</a>`;

/** One or more buttons side by side (wrap on narrow screens). */
export const actions = (...buttons: string[]) =>
  `<div style="margin:22px 0 4px">${buttons.map((b) => `<span style="display:inline-block;margin:0 8px 8px 0">${b}</span>`).join("")}</div>`;

export const linkFallback = (label: string, url: string) =>
  `<p style="margin:10px 0 0;font:400 12px/1.5 ${FONT};color:${KIT.muted}">${esc(label)}<br/><a href="${safeUrl(url)}" style="color:${KIT.muted};word-break:break-all">${esc(url)}</a></p>`;

/** Full document. `blocks` are already-escaped kit fragments. */
export function layout(opts: { lang?: string; preview: string; blocks: string[]; footer?: string }): string {
  const lang = esc(opts.lang ?? "nl");
  const footer = opts.footer ?? "ROUT · rout.be — je identiteit, je links, jouw regels.";
  return `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="color-scheme" content="light only"/><title>ROUT</title></head>
<body style="margin:0;padding:0;background:${KIT.page}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(opts.preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${KIT.page}"><tr><td align="center" style="padding:32px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
<tr><td style="padding:0 4px 18px;font:700 15px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.22em;color:${KIT.ink}">ROUT</td></tr>
<tr><td style="background:${KIT.card};border:1px solid ${KIT.border};border-radius:18px;padding:30px 28px">${opts.blocks.join("")}</td></tr>
<tr><td style="padding:18px 4px 0;font:400 12px/1.5 ${FONT};color:${KIT.muted}">${esc(footer)}</td></tr>
</table></td></tr></table></body></html>`;
}
