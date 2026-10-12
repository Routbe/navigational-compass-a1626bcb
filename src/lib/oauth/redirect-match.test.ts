import { describe, expect, it } from "vitest";
import { findMatchingRedirect, normalizeRedirectUri, redirectUrisMatch } from "./redirect-match";

const KC = "https://kc.example.com/realms/acme/broker/rout/endpoint";

describe("redirect URI matching", () => {
  it("accepts harmless formatting differences", () => {
    expect(redirectUrisMatch(KC, `${KC}/`)).toBe(true);
    expect(redirectUrisMatch(`${KC}/`, KC)).toBe(true);
    expect(redirectUrisMatch(KC, ` ${KC}\u200b`)).toBe(true);
    expect(redirectUrisMatch(KC, "https://KC.Example.com:443/realms/acme/broker/rout/endpoint")).toBe(true);
    expect(redirectUrisMatch(KC, encodeURIComponent(KC))).toBe(true);
    expect(redirectUrisMatch(KC, encodeURIComponent(encodeURIComponent(KC)))).toBe(true);
    expect(redirectUrisMatch("https://a.com/cb/%7Brealm%7D", "https://a.com/cb/{realm}")).toBe(true);
  });
  it("stays strict on what matters", () => {
    expect(redirectUrisMatch(KC, "https://evil.com/realms/acme/broker/rout/endpoint")).toBe(false);
    expect(redirectUrisMatch(KC, "http://kc.example.com/realms/acme/broker/rout/endpoint")).toBe(false);
    expect(redirectUrisMatch(KC, `${KC}/extra`)).toBe(false);
    expect(redirectUrisMatch(KC, `${KC}?x=1`)).toBe(false);
    expect(redirectUrisMatch(KC, "https://kc.example.com:8443/realms/acme/broker/rout/endpoint")).toBe(false);
    expect(redirectUrisMatch("https://a.com/Cb", "https://a.com/cb")).toBe(false);
    expect(normalizeRedirectUri(`${KC}#x`)).toBeNull();
    expect(normalizeRedirectUri("https://user:pw@a.com/cb")).toBeNull();
  });
  it("returns the registered form", () => {
    expect(findMatchingRedirect(["https://a.com/x", KC], `${KC}/`)).toBe(KC);
  });
});
