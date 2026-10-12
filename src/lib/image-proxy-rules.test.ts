import { describe, expect, it } from "vitest";
import { isAllowedProxyUrl, proxied } from "./image-proxy-rules";

describe("image proxy allowlist", () => {
  it("allows a known image host over https", () => expect(isAllowedProxyUrl("https://i.ytimg.com/vi/x/mqdefault.jpg")).not.toBeNull());
  it("refuses plain http", () => expect(isAllowedProxyUrl("http://i.ytimg.com/a.jpg")).toBeNull());
  it("refuses unknown hosts", () => expect(isAllowedProxyUrl("https://evil.example/a.jpg")).toBeNull());
  it("refuses internal IPs", () => expect(isAllowedProxyUrl("https://169.254.169.254/latest")).toBeNull());
  it("refuses credentials in the URL", () => expect(isAllowedProxyUrl("https://a:b@i.ytimg.com/x.jpg")).toBeNull());
  it("drops unknown images instead of loading them directly", () => expect(proxied("https://tracker.example/p.gif")).toBeNull());
});
