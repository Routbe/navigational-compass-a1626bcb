/** Weather-only Neon gateway boundary. Never expose credentials or database errors to visitors. */
export async function weatherQuery<T extends Record<string, unknown>>(query: string, params: unknown[] = []): Promise<T[]> {
  const appKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["NEON_API_KEY"];
  if (!appKey || !connectionKey) throw new Error("Weather database connection unavailable");
  const response = await fetch("https://connector-gateway.lovable.dev/neon/sql", {
    method: "POST",
    headers: { Authorization: `Bearer ${appKey}`, "X-Connection-Api-Key": connectionKey, "Content-Type": "application/json" },
    body: JSON.stringify({ query, params }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    console.error("[ambient-weather] database request failed", response.status);
    throw new Error("Weather database unavailable");
  }
  const body = await response.json() as { rows?: T[] };
  if (!Array.isArray(body.rows)) throw new Error("Invalid weather database response");
  return body.rows;
}