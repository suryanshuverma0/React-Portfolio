/*
  Writes public/sitemap.xml before every build (npm "prebuild").

  Sources: the static routes, project slugs from the bundled content file
  plus the API, and published blog posts from the API. The API runs on a
  free host that may be asleep, so every request has a timeout and any
  failure falls back to what's available — this script never fails the
  build.
*/
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SITE = "https://www.suryanshuverma.com.np";
const API = "https://portfolio-backend-uy0a.onrender.com/api/v1";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const fetchJson = async (path) => {
  try {
    const response = await fetch(`${API}${path}`, { signal: AbortSignal.timeout(25000) });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
};

const day = (value) => (value ? new Date(value).toISOString().slice(0, 10) : null);

const escapeXml = (value) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const main = async () => {
  const today = day(new Date());

  const urls = new Map();
  const add = (path, { lastmod = today, changefreq = "monthly", priority = "0.6" } = {}) => {
    urls.set(path, { lastmod, changefreq, priority });
  };

  add("/", { changefreq: "weekly", priority: "1.0" });
  add("/blog", { changefreq: "weekly", priority: "0.8" });

  // Bundled projects — read slugs straight from the source file.
  try {
    const source = await readFile(join(root, "src/components/content/projectsContent.js"), "utf8");
    for (const [, slug] of source.matchAll(/slug:\s*"([^"]+)"/g)) {
      add(`/projects/${slug}`, { priority: slug.includes("pharmaceutical") ? "0.9" : "0.7" });
    }
  } catch {
    // Content file moved — API projects below still apply.
  }

  const [projects, posts] = await Promise.all([
    fetchJson("/projects/public"),
    fetchJson("/blog/public?limit=100"),
  ]);

  for (const project of projects?.data || []) {
    if (project.slug) add(`/projects/${project.slug}`, { lastmod: day(project.updatedAt) || today, priority: "0.7" });
  }

  for (const post of posts?.data || []) {
    if (post.slug) {
      add(`/blog/${post.slug}`, {
        lastmod: day(post.updatedAt || post.publishedAt) || today,
        changefreq: "yearly",
        priority: "0.7",
      });
    }
  }

  const body = [...urls]
    .map(
      ([path, meta]) => `  <url>
    <loc>${escapeXml(SITE + path)}</loc>
    <lastmod>${meta.lastmod}</lastmod>
    <changefreq>${meta.changefreq}</changefreq>
    <priority>${meta.priority}</priority>
  </url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;

  await writeFile(join(root, "public/sitemap.xml"), xml);

  console.log(
    `sitemap.xml: ${urls.size} URLs (${posts?.data?.length ?? "no"} posts from API${posts ? "" : " — API unreachable"})`,
  );
};

main().catch((error) => {
  console.warn("sitemap generation skipped:", error.message);
});
