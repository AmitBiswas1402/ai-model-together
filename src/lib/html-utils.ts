export function extractHtmlContent(raw: string | null | undefined): string {
  if (!raw) return "";

  let content = raw.trim();

  const htmlBlockMatch = content.match(/```html\s*([\s\S]*?)(?:```|$)/i);
  if (htmlBlockMatch) {
    content = htmlBlockMatch[1].trim();
  } else {
    const codeBlockMatch = content.match(/```\s*([\s\S]*?)(?:```|$)/);
    if (codeBlockMatch) {
      content = codeBlockMatch[1].trim();
    } else {
      content = content
        .replace(/```html/gi, "")
        .replace(/```/g, "")
        .replace(/^html\s*/i, "")
        .trim();
    }
  }

  content = content.replace(/```\s*$/, "").trim();

  const tagStart = content.search(/<[a-zA-Z!/]/);
  if (tagStart > 0) {
    content = content.slice(tagStart);
  } else if (!content.startsWith("<") && content.includes(">")) {
    // Recover from truncated tags (e.g. "lass=\"...\">" missing "<div c")
    content = content.slice(content.indexOf(">") + 1).trim();
  }

  return content;
}
