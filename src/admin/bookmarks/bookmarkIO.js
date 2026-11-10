/* Import / export for bookmarks: the Netscape bookmark file every browser
   exports and imports (Chrome, Edge, Safari, Firefox), JSON and CSV. */

const isHttp = (u) => /^https?:\/\//i.test(u || "");

// Chrome/Edge/Firefox "Export bookmarks" HTML → items; the nearest folder
// becomes the category, outer folders become tags.
export const parseBookmarkHtml = (html) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const items = [];
  const walk = (dl, folders) => {
    for (const dt of dl.querySelectorAll(":scope > dt")) {
      const h3 = dt.querySelector(":scope > h3");
      const a = dt.querySelector(":scope > a");
      if (h3) {
        const sub = dt.querySelector(":scope > dl");
        if (sub) walk(sub, [...folders, h3.textContent.trim()]);
      } else if (a && isHttp(a.getAttribute("href"))) {
        const meaningful = folders.filter((f) => !/^(bookmarks( bar| menu| toolbar)?|other bookmarks|favorites( bar)?|mobile bookmarks)$/i.test(f));
        items.push({
          kind: "link",
          url: a.getAttribute("href").slice(0, 2000),
          title: (a.textContent.trim() || a.getAttribute("href")).slice(0, 300),
          category: (meaningful[meaningful.length - 1] || "").slice(0, 60),
          tags: meaningful
            .slice(0, -1)
            .map((f) => f.toLowerCase().slice(0, 40))
            .slice(0, 5),
          status: "saved",
        });
      }
    }
  };
  const root = doc.querySelector("dl");
  if (root) walk(root, []);
  return items;
};

export const parseBookmarkJson = (text) => {
  const data = JSON.parse(text);
  const list = Array.isArray(data) ? data : data.bookmarks || [];
  return list
    .filter((b) => b && b.title)
    .map((b) => ({
      kind: b.kind === "text" ? "text" : "link",
      url: isHttp(b.url) ? b.url : "",
      title: String(b.title).slice(0, 300),
      description: String(b.description || "").slice(0, 2000),
      content: String(b.content || "").slice(0, 20000),
      category: String(b.category || "").slice(0, 60),
      tags: (b.tags || []).map((t) => String(t).toLowerCase().slice(0, 40)).slice(0, 30),
      notes: String(b.notes || "").slice(0, 5000),
      pinned: Boolean(b.pinned),
      status: ["saved", "unread", "read"].includes(b.status) ? b.status : "saved",
    }));
};

const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const toBookmarkHtml = (bookmarks) => {
  const byCat = new Map();
  bookmarks.filter((b) => b.kind === "link" && b.url).forEach((b) => byCat.set(b.category || "", [...(byCat.get(b.category || "") || []), b]));
  const stamp = (d) => Math.floor(new Date(d || Date.now()).getTime() / 1000);
  const links = (list) => list.map((b) => `        <DT><A HREF="${esc(b.url)}" ADD_DATE="${stamp(b.createdAt)}"${b.tags?.length ? ` TAGS="${esc(b.tags.join(","))}"` : ""}>${esc(b.title)}</A>`).join("\n");
  const sections = [...byCat.entries()]
    .map(([cat, list]) => (cat ? `    <DT><H3>${esc(cat)}</H3>\n    <DL><p>\n${links(list)}\n    </DL><p>` : links(list)))
    .join("\n");
  return `<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n<TITLE>Bookmarks</TITLE>\n<H1>Bookmarks</H1>\n<DL><p>\n${sections}\n</DL><p>\n`;
};

const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
export const toBookmarkCsv = (bookmarks) =>
  [
    ["Title", "URL", "Kind", "Category", "Tags", "Status", "Pinned", "Description", "Notes", "Opened", "Added"],
    ...bookmarks.map((b) => [b.title, b.url, b.kind, b.category, (b.tags || []).join(" "), b.status, b.pinned ? "yes" : "", b.description, b.notes, b.openCount, b.createdAt]),
  ]
    .map((r) => r.map(csvCell).join(","))
    .join("\n");

export const downloadText = (name, text, type) => {
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([text], { type })), download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

export const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

export const looksLikeUrl = (text) => /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i.test(String(text || "").trim());
