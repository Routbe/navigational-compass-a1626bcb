import { describe, expect, it } from "vitest";
import { normalizeQrSettings } from "./qr-settings";
import { normalizeDisplayPrefs } from "./profile-display";

describe("normalizeQrSettings", () => {
  it("returns null for missing or empty", () => {
    expect(normalizeQrSettings(undefined)).toBeNull();
    expect(normalizeQrSettings({})).toBeNull();
  });
  it("falls back to #1A1A1A / #FFFFFF for invalid colors", () => {
    const s = normalizeQrSettings({ fgColor: "red", bgColor: "url(x)", cornerStyle: "dots", emblem: false });
    expect(s).toEqual({ fgColor: "#1A1A1A", bgColor: "#FFFFFF", cornerStyle: "dots", emblem: false });
  });
  it("rejects unknown corner styles", () => {
    expect(normalizeQrSettings({ cornerStyle: "hexagon" })?.cornerStyle).toBe("square");
  });
  it("survives display prefs normalization", () => {
    const p = normalizeDisplayPrefs({ qrSettings: { fgColor: "#112233", bgColor: "#ffffff", cornerStyle: "smooth", emblem: true } });
    expect(p.qrSettings?.fgColor).toBe("#112233");
  });
});
