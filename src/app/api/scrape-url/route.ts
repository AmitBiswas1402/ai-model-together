import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "A valid URL is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Fetch the webpage HTML server-side (avoids CORS)
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status}` },
        { status: 502 }
      );
    }

    const html = await response.text();

    // Extract useful content from the HTML
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

/**
 * Extracts meaningful content from raw HTML for AI prompt building.
 */
function extractPageContent(html: string, url: string) {
  // Extract <title>
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";

  // Extract meta description
  const metaDescMatch = html.match(
    /<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i
  );
  const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : "";

  // Extract meta keywords
  const metaKeywordsMatch = html.match(
    /<meta[^>]*name=["']keywords["'][^>]*content=["']([\s\S]*?)["']/i
  );
  const keywords = metaKeywordsMatch ? metaKeywordsMatch[1].trim() : "";

  // Extract all headings (h1-h6)
  const headings: string[] = [];
  const headingRegex = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi;
  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    const text = stripTags(match[1]).trim();
    if (text && text.length < 200) {
      headings.push(text);
    }
  }

  // Extract navigation links
  const navLinks: string[] = [];
  const navMatch = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/gi);
  if (navMatch) {
    for (const nav of navMatch) {
      const linkRegex = /<a[^>]*>([\s\S]*?)<\/a>/gi;
      let linkMatch;
      while ((linkMatch = linkRegex.exec(nav)) !== null) {
        const text = stripTags(linkMatch[1]).trim();
        if (text && text.length < 50) {
          navLinks.push(text);
        }
      }
    }
  }

  // Extract button texts
  const buttons: string[] = [];
  const buttonRegex = /<button[^>]*>([\s\S]*?)<\/button>/gi;
  while ((match = buttonRegex.exec(html)) !== null) {
    const text = stripTags(match[1]).trim();
    if (text && text.length < 80) {
      buttons.push(text);
    }
  }

  // Extract paragraph content (first ~10 meaningful paragraphs)
  const paragraphs: string[] = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  while ((match = pRegex.exec(html)) !== null && paragraphs.length < 10) {
    const text = stripTags(match[1]).trim();
    if (text && text.length > 20 && text.length < 500) {
      paragraphs.push(text);
    }
  }

  // Extract image alt texts
  const images: string[] = [];
  const imgRegex = /<img[^>]*alt=["']([\s\S]*?)["'][^>]*>/gi;
  while ((match = imgRegex.exec(html)) !== null && images.length < 10) {
    const alt = match[1].trim();
    if (alt && alt.length > 2) {
      images.push(alt);
    }
  }

  // Detect sections/landmarks
  const sections: string[] = [];
  const sectionRegex =
    /<(?:section|footer|header|main|aside)[^>]*(?:id|class|aria-label)=["']([^"']+)["'][^>]*>/gi;
  while ((match = sectionRegex.exec(html)) !== null && sections.length < 15) {
    sections.push(match[1].trim());
  }

  return {
    url,
    title,
    metaDescription,
    keywords,
    headings: headings.slice(0, 15),
    navLinks: [...new Set(navLinks)].slice(0, 15),
    buttons: [...new Set(buttons)].slice(0, 10),
    paragraphs,
    images,
    sections,
  };
}

/** Strip HTML tags from a string */
function stripTags(str: string): string {
  return str
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ");
}
