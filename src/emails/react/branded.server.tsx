/**
 * Wraps a server-built HTML fragment (already escaped by its caller) in the
 * obsidian ROUT frame. Light-theme colours inside the fragment are stripped so
 * the text stays readable on the dark card. Returns null on any render error,
 * so the caller falls back to the Brevo template cascade.
 */
import { createElement } from "react";
import { emailT } from "@/locales/emails";
import { MAIL, TemplateWrapper } from "./TemplateWrapper";

const LOCALES = ["nl", "en", "fr", "de"];

export function stripLightColors(fragment: string): string {
  return fragment.replace(/style="([^"]*)"/gi, (_, css: string) => {
    const kept = css
      .split(";")
      .map((d) => d.trim())
      .filter((d) => d && !/^(color|background(-color)?)\s*:/i.test(d))
      .join(";");
    return kept ? `style="${kept}"` : "";
  });
}

export async function brandHtml(fragment: string, opts: { language?: unknown; preview?: string }): Promise<string | null> {
  try {
    const raw = typeof opts.language === "string" ? opts.language.slice(0, 2).toLowerCase() : "nl";
    const locale = LOCALES.includes(raw) ? raw : "en";
    const { render } = await import("@react-email/render");
    const body = createElement("div", {
      style: { color: MAIL.text, fontSize: 15, lineHeight: "22px" },
      dangerouslySetInnerHTML: { __html: stripLightColors(fragment) },
    });
    return await render(
      createElement(TemplateWrapper, {
        lang: locale,
        preview: opts.preview ?? "ROUT",
        footer: emailT(locale, "footer"),
        children: body,
      }),
    );
  } catch (err) {
    console.error("[email] brand render failed, using Brevo template", err instanceof Error ? err.message : err);
    return null;
  }
}
