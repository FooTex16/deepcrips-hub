/**
 * Renderer Markdown minimal & aman (tanpa dependensi).
 * Semua input di-escape HTML terlebih dahulu ⇒ kebal XSS by construction.
 * Dukungan: paragraf, ## h3, - list, 1. list, > kutipan, `code`, **bold",
 * *italic*, [tautan](url http/https), code block ```
 */

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInline(input: string): string {
  return input
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, text: string, href: string) => {
      // Hanya http(s) atau path internal yang diizinkan.
      if (/^https?:\/\//i.test(href) || href.startsWith("/")) {
        const external = /^https?:\/\//i.test(href);
        return `<a href="${href}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${text}</a>`;
      }
      return match;
    });
}

export function renderMarkdown(source: string | null | undefined): string {
  if (!source) return "";
  const escaped = escapeHtml(source);

  // Simpan code block sebagai placeholder agar tidak diproses inline.
  const blocks: string[] = [];
  const withPlaceholders = escaped.replace(/```([\s\S]*?)```/g, (_m, code: string) => {
    blocks.push(`<pre><code>${code.replace(/^\n+|\n+$/g, "")}</code></pre>`);
    return `\u0000BLOCK${blocks.length - 1}\u0000`;
  });

  const lines = withPlaceholders.split(/\n/);
  const out: string[] = [];
  let list: "ul" | "ol" | null = null;
  let paragraph: string[] = [];

  const closeList = () => {
    if (list) {
      out.push(`</${list}>`);
      list = null;
    }
  };
  const flushParagraph = () => {
    if (paragraph.length > 0) {
      out.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const blockMatch = line.match(/^\u0000BLOCK(\d+)\u0000$/);

    if (blockMatch) {
      flushParagraph();
      closeList();
      out.push(blocks[Number(blockMatch[1])]);
      continue;
    }
    if (line.trim() === "") {
      flushParagraph();
      closeList();
      continue;
    }
    if (/^###\s+/.test(line)) {
      flushParagraph();
      closeList();
      out.push(`<h3>${renderInline(line.replace(/^###\s+/, ""))}</h3>`);
      continue;
    }
    if (/^##\s+/.test(line)) {
      flushParagraph();
      closeList();
      out.push(`<h2>${renderInline(line.replace(/^##\s+/, ""))}</h2>`);
      continue;
    }
    if (/^#\s+/.test(line)) {
      flushParagraph();
      closeList();
      out.push(`<h2>${renderInline(line.replace(/^#\s+/, ""))}</h2>`);
      continue;
    }
    if (/^&gt;\s?/.test(line)) {
      flushParagraph();
      closeList();
      out.push(`<blockquote><p>${renderInline(line.replace(/^&gt;\s?/, ""))}</p></blockquote>`);
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      if (list !== "ul") {
        closeList();
        out.push("<ul>");
        list = "ul";
      }
      out.push(`<li>${renderInline(line.replace(/^[-*]\s+/, ""))}</li>`);
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      flushParagraph();
      if (list !== "ol") {
        closeList();
        out.push("<ol>");
        list = "ol";
      }
      out.push(`<li>${renderInline(line.replace(/^\d+\.\s+/, ""))}</li>`);
      continue;
    }
    closeList();
    paragraph.push(line.trim());
  }
  flushParagraph();
  closeList();

  return out.join("\n");
}
