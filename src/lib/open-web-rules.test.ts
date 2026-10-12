import { describe, expect, it } from "vitest";
import { bioContainsCode, isPublicHost, normalizeFeed, normalizeMastodon, parseFeed } from "./open-web-rules";

describe("open-web rules", () => {
  it("finds the code in an HTML bio", () => {
    expect(bioContainsCode("<p>hoi ROUT-ab12cd</p>", "rout-ab12cd")).toBe(true);
    expect(bioContainsCode("hoi", "rout-ab12cd")).toBe(false);
  });
  it("normalizes mastodon handles", () => {
    expect(normalizeMastodon("@Jan@mastodon.social")).toBe("jan@mastodon.social");
    expect(normalizeMastodon("jan@localhost")).toBeNull();
  });
  it("blocks internal hosts for feeds", () => {
    expect(isPublicHost("127.0.0.1")).toBe(false);
    expect(normalizeFeed("http://192.168.0.1/feed")).toBeNull();
    expect(normalizeFeed("jan.substack.com")).toBe("https://jan.substack.com/feed");
    expect(normalizeFeed("medium.com/@jan")).toBe("https://medium.com/feed/@jan");
  });
  it("parses the 3 newest feed entries", () => {
    const xml = `<rss><channel><title>Blog</title>${[1, 2, 3, 4].map((i) => `<item><title>P${i}</title><link>https://x.be/${i}</link></item>`).join("")}</channel></rss>`;
    const f = parseFeed(xml);
    expect(f.title).toBe("Blog");
    expect(f.items.map((i) => i.title)).toEqual(["P1", "P2", "P3"]);
  });
});
