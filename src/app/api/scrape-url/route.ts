import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "A valid URL is required" },
        { status: 400 }
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { error: "Only HTTP and HTTPS URLs are supported" },
        { status: 400 }
      );
    }

    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status}` },
        { status: 502 }
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("xhtml")) {
      return NextResponse.json(
        { error: "URL does not return HTML content" },
        { status: 422 }
      );
    }

    const html = await response.text();
    const scraped = extractPageContent(html, parsedUrl.toString());

    return NextResponse.json(scraped);
  } catch (error: any) {
    console.error("Scrape error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to scrape URL" },
      { status: 500 }
    );
  }
}

function extractPageContent(html: string, url: string) {
  const $ = cheerio.load(html);

  // Remove script, style, noscript, and hidden elements
  $("script, style, noscript, iframe, svg").remove();
  $('[style*="display: none"], [style*="display:none"], [hidden]').remove();

  const title = $("title").first().text().trim();

  // Try multiple attribute orderings for meta description
  let metaDescription = "";
  $("meta[name='description'], meta[name='Description']").each((_, el) => {
    const content = $(el).attr("content");
    if (content && !metaDescription) metaDescription = content.trim();
  });
  // Fallback: property="og:description"
  if (!metaDescription) {
    $("meta[property='og:description']").each((_, el) => {
      const content = $(el).attr("content");
      if (content && !metaDescription) metaDescription = content.trim();
    });
  }

  let keywords = "";
  $("meta[name='keywords'], meta[name='Keywords']").each((_, el) => {
    const content = $(el).attr("content");
    if (content && !keywords) keywords = content.trim();
  });

  // Extract headings
  const headings: string[] = [];
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, " ");
    if (text && text.length < 200 && headings.length < 15) {
      headings.push(text);
    }
  });

  // Extract navigation links
  const navLinksSet = new Set<string>();
  $("nav a, [role='navigation'] a, header a").each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, " ");
    if (text && text.length < 50 && navLinksSet.size < 15) {
      navLinksSet.add(text);
    }
  });
  const navLinks = [...navLinksSet];

  // Extract button texts
  const buttonsSet = new Set<string>();
  $("button, [role='button'], a.btn, a.button, .cta").each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, " ");
    if (text && text.length < 80 && text.length > 1 && buttonsSet.size < 10) {
      buttonsSet.add(text);
    }
  });
  const buttons = [...buttonsSet];

  // Extract paragraphs
  const paragraphs: string[] = [];
  $("p").each((_, el) => {
    if (paragraphs.length >= 10) return false;
    const text = $(el).text().trim().replace(/\s+/g, " ");
    if (text.length > 20 && text.length < 500) {
      paragraphs.push(text);
    }
  });

  // Extract image alt texts (deduplicated)
  const imagesSet = new Set<string>();
  $("img").each((_, el) => {
    const alt = $(el).attr("alt")?.trim();
    if (alt && alt.length > 2 && imagesSet.size < 10) {
      imagesSet.add(alt);
    }
  });
  const images = [...imagesSet];

  // Detect sections/landmarks
  const sectionsSet = new Set<string>();
  $("section, footer, header, main, aside, [role='main'], [role='contentinfo'], [role='banner'], [role='complementary']").each(
    (_, el) => {
      if (sectionsSet.size >= 15) return false;
      const id = $(el).attr("id");
      const ariaLabel = $(el).attr("aria-label");
      const className = $(el).attr("class");
      const label = id || ariaLabel || className?.split(/\s+/).filter(Boolean)[0];
      if (label) sectionsSet.add(label);
    }
  );
  const sections = [...sectionsSet];

  return {
    url,
    title,
    metaDescription,
    keywords,
    headings,
    navLinks,
    buttons,
    paragraphs,
    images,
    sections,
  };
}
