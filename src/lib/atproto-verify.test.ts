import { describe, expect, it } from "vitest";
import { AT_NETWORKS, normalizeAtHandle } from "./atproto-verify.server";

describe("AT Protocol handles", () => {
  it("bare Wsocial name gets the wsocial.eu domain", () =>
    expect(normalizeAtHandle("jona", AT_NETWORKS.wsocial)).toBe("jona.wsocial.eu"));
  it("bare Bluesky name gets bsky.social", () =>
    expect(normalizeAtHandle("@Jona", AT_NETWORKS.bluesky)).toBe("jona.bsky.social"));
  it("rejects garbage", () => expect(normalizeAtHandle("a b", AT_NETWORKS.bluesky)).toBeNull());
});
