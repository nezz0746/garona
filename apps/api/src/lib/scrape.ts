export async function scrapeMetadata(url: string) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Garona/1.0 (link-preview)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;

    const html = await res.text();
    const get = (property: string): string | null => {
      const ogMatch = html.match(
        new RegExp(`<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']*)["']`, "i")
      ) || html.match(
        new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:${property}["']`, "i")
      );
      if (ogMatch) return ogMatch[1];

      const nameMatch = html.match(
        new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`, "i")
      ) || html.match(
        new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${property}["']`, "i")
      );
      return nameMatch ? nameMatch[1] : null;
    };

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = get("title") || (titleMatch ? titleMatch[1].trim() : null);
    const description = get("description");
    const imageUrl = get("image");
    const domain = new URL(url).hostname.replace(/^www\./, "");

    return { title, description, imageUrl, domain };
  } catch {
    return null;
  }
}
