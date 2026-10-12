import { brandHtml, stripLightColors } from "./branded.server";
import { test, expect } from "vitest";
test("brand", async () => {
  expect(stripLightColors('<p style="color:#000;font-size:12px">x</p>')).toBe('<p style="font-size:12px">x</p>');
  const h = await brandHtml("<p>Hallo &amp; bedankt</p>", { language: "pt" });
  expect(h).toContain("Hallo &amp; bedankt"); expect(h).toContain('lang="en"'); expect(h).toContain("#0b0b0c");
});
