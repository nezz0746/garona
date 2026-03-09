import { Hono } from "hono";
import { db, linkPreviews } from "@garona/db";
import { eq } from "drizzle-orm";
import { scrapeMetadata } from "../lib/scrape";

const app = new Hono();

app.post("/metadata", async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const { url } = await c.req.json();
  if (!url || typeof url !== "string") return c.json({ error: "URL required" }, 400);

  // Check cache
  const [existing] = await db
    .select()
    .from(linkPreviews)
    .where(eq(linkPreviews.url, url));

  if (existing) {
    return c.json({
      url: existing.url,
      title: existing.title,
      description: existing.description,
      imageUrl: existing.imageUrl,
      domain: existing.domain,
    });
  }

  // Scrape
  const meta = await scrapeMetadata(url);
  if (!meta) return c.json({ error: "Could not fetch metadata" }, 422);

  // Cache
  const [preview] = await db
    .insert(linkPreviews)
    .values({ url, ...meta })
    .onConflictDoNothing()
    .returning();

  const result = preview || (await db.select().from(linkPreviews).where(eq(linkPreviews.url, url)))[0];

  return c.json({
    url: result.url,
    title: result.title,
    description: result.description,
    imageUrl: result.imageUrl,
    domain: result.domain,
  });
});

export default app;
