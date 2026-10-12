import type { ProfileQrStyle, QrCornerStyle } from "@/lib/profile-qr";

/** Standaard ROUT-stijl (gelijk aan DEFAULT_PROFILE_QR_STYLE, zonder de QR-engine te importeren). */
export const ROUT_QR_DEFAULT: ProfileQrStyle = {
  fgColor: "#1A1A1A",
  bgColor: "#FFFFFF",
  cornerStyle: "square",
  emblem: true,
};

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const CORNERS: QrCornerStyle[] = ["square", "dots", "smooth"];

/** Valideert opgeslagen QR-stijl uit `display_prefs.qrSettings`; leeg/ongeldig object = null. */
export function normalizeQrSettings(raw: unknown): ProfileQrStyle | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (Object.keys(r).length === 0) return null;
  const fg = typeof r["fgColor"] === "string" && HEX.test(r["fgColor"]) ? r["fgColor"] : ROUT_QR_DEFAULT.fgColor;
  const bg = typeof r["bgColor"] === "string" && HEX.test(r["bgColor"]) ? r["bgColor"] : ROUT_QR_DEFAULT.bgColor;
  const corner = CORNERS.includes(r["cornerStyle"] as QrCornerStyle)
    ? (r["cornerStyle"] as QrCornerStyle)
    : ROUT_QR_DEFAULT.cornerStyle;
  const emblem = typeof r["emblem"] === "boolean" ? r["emblem"] : ROUT_QR_DEFAULT.emblem;
  return { fgColor: fg, bgColor: bg, cornerStyle: corner, emblem };
}
