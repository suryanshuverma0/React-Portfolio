import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "react-toastify";
import {
  QrCode,
  Globe,
  Mail,
  Phone,
  Contact,
  FileText,
  FolderKanban,
  Newspaper,
  Nfc,
  Link2,
  Download,
  Copy,
  Printer,
  BarChart3,
  Search,
  Check,
} from "lucide-react";

import { SITE_URL } from "../../lib/site";
import { downloadSvg, downloadUrl, svgToPng } from "../../lib/qrExport";
import { getProjects } from "../services/project.service";
import { getPosts } from "../services/blog.service";
import { getResumes, getResumeSource } from "../services/resume.service";

/* ========================================
   QR STUDIO — a QR code for anything on the
   portfolio: pages, projects, posts, resumes,
   the NFC card, contact details or any link.
   Site links can carry scan tracking (UTM),
   so scans show up in Analytics as their own
   source. Export PNG (with caption) or SVG.
========================================= */

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);

const LEVELS = [
  { id: "L", label: "Low", hint: "Smallest code" },
  { id: "M", label: "Medium", hint: "Good default" },
  { id: "Q", label: "High", hint: "Survives scuffs" },
  { id: "H", label: "Max", hint: "Needed for a logo" },
];

const COLORS = ["#0a0a0a", "#1e293b", "#2a78d6", "#15803d", "#b45309", "#7c3aed", "#e11d48"];

function QrStudio() {
  const [source, setSource] = useState({ projects: [], posts: [], resumes: [], identity: {} });
  const [targetId, setTargetId] = useState("home");
  const [custom, setCustom] = useState("https://");
  const [track, setTrack] = useState(true);
  const [fg, setFg] = useState("#0a0a0a");
  const [bg, setBg] = useState("#ffffff");
  const [level, setLevel] = useState("M");
  const [logo, setLogo] = useState(false);
  const [caption, setCaption] = useState("");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const svgRef = useRef(null);

  useEffect(() => {
    let alive = true;
    Promise.allSettled([getProjects(), getPosts(), getResumes(), getResumeSource()]).then(([p, b, r, s]) => {
      if (!alive) return;
      setSource({
        projects: p.status === "fulfilled" ? p.value : [],
        posts: b.status === "fulfilled" ? b.value : [],
        resumes: r.status === "fulfilled" ? r.value : [],
        identity: s.status === "fulfilled" ? s.value.identity || {} : {},
      });
    });
    return () => {
      alive = false;
    };
  }, []);

  const targets = useMemo(() => {
    const id = source.identity;
    const site = (path, name) => ({ kind: "site", path, campaign: slugify(name) });
    const list = [
      { group: "Portfolio", id: "home", label: "Portfolio home", icon: Globe, ...site("/", "home") },
      { group: "Portfolio", id: "contact", label: "Contact section", icon: Mail, ...site("/#contact", "contact") },
      { group: "Portfolio", id: "blog", label: "Blog", icon: Newspaper, ...site("/blog", "blog") },
      { group: "Portfolio", id: "card", label: "NFC card page", icon: Nfc, kind: "raw", value: `${SITE_URL}/card?src=qr` },
      { group: "Resume", id: "resume", label: "Default resume", icon: FileText, ...site("/resume", "resume") },
      ...source.resumes
        .filter((r) => r.isPublic)
        .map((r) => ({ group: "Resume", id: `resume-${r.id}`, label: `Resume · ${r.name}`, icon: FileText, ...site(`/resume/${r.slug}`, `resume-${r.slug}`) })),
      ...source.projects.map((p) => ({ group: "Projects", id: `project-${p._id}`, label: p.title, icon: FolderKanban, ...site(`/projects/${p.slug}`, `project-${p.slug}`) })),
      ...source.posts
        .filter((p) => p.isVisible)
        .map((p) => ({ group: "Blog posts", id: `post-${p._id}`, label: p.title, icon: Newspaper, ...site(`/blog/${p.slug}`, `post-${p.slug}`) })),
      ...(id.email ? [{ group: "Contact", id: "email", label: `Email · ${id.email}`, icon: Mail, kind: "raw", value: `mailto:${id.email}` }] : []),
      ...(id.phone ? [{ group: "Contact", id: "phone", label: `Call · ${id.phone}`, icon: Phone, kind: "raw", value: `tel:${id.phone.replace(/\s+/g, "")}` }] : []),
      {
        group: "Contact",
        id: "vcard",
        label: "Save my contact (vCard)",
        icon: Contact,
        kind: "raw",
        value: [
          "BEGIN:VCARD",
          "VERSION:3.0",
          `FN:${id.name || "Suryanshu Verma"}`,
          id.headline ? `TITLE:${id.headline}` : null,
          id.email ? `EMAIL;TYPE=INTERNET:${id.email}` : null,
          id.phone ? `TEL;TYPE=CELL:${id.phone}` : null,
          `URL:${SITE_URL}`,
          "END:VCARD",
        ]
          .filter(Boolean)
          .join("\n"),
      },
      { group: "Other", id: "custom", label: "Any link or text", icon: Link2, kind: "custom" },
    ];
    return list;
  }, [source]);

  const target = targets.find((t) => t.id === targetId) || targets[0];

  const value = useMemo(() => {
    if (target.kind === "custom") return custom.trim();
    if (target.kind === "raw") return target.value;
    const url = new URL(target.path, SITE_URL);
    if (track) {
      url.searchParams.set("utm_source", "qr");
      url.searchParams.set("utm_medium", "qr");
      url.searchParams.set("utm_campaign", target.campaign);
    }
    return url.toString();
  }, [target, track, custom]);

  const effectiveLevel = logo ? "H" : level;
  const fileBase = `qr-${target.kind === "custom" ? "link" : target.campaign || target.id}`;

  const filtered = targets.filter((t) => !query || t.label.toLowerCase().includes(query.toLowerCase()));
  const groups = [...new Set(filtered.map((t) => t.group))];

  const exportPng = async (size) => {
    try {
      const png = await svgToPng(svgRef.current, { size, caption, background: bg, color: fg });
      downloadUrl(png, `${fileBase}.png`);
    } catch {
      toast.error("Couldn't create the image");
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  };

  const print = async () => {
    const png = await svgToPng(svgRef.current, { size: 1200, caption, background: bg, color: fg });
    const w = window.open("", "_blank", "width=600,height=700");
    if (!w) return toast.error("Allow pop-ups to print");
    w.document.write(`<title>${fileBase}</title><body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh"><img src="${png}" style="width:80vmin" onload="setTimeout(()=>{print();close()},200)"></body>`);
    w.document.close();
  };

  const tooLong = value.length > 1200;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section>
        <h1 className="text-heading inline-flex items-center gap-3">
          <QrCode size={28} /> QR Studio
        </h1>
        <p className="text-body mt-2">A QR code for any page, resume, project or contact — for slides, posters, business cards and conference badges.</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* What */}
        <section className="card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-title">What should it open?</h2>
            <label className="flex items-center gap-2 rounded-control border border-border bg-surface px-3">
              <Search size={15} className="text-muted" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a page…" className="h-9 w-40 bg-transparent text-small outline-none" />
            </label>
          </div>

          <div className="max-h-[460px] space-y-4 overflow-y-auto pr-1 admin-scroll">
            {groups.map((group) => (
              <div key={group}>
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted">{group}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {filtered
                    .filter((t) => t.group === group)
                    .map((t) => {
                      const Icon = t.icon;
                      const active = t.id === target.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTargetId(t.id)}
                          className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-small transition ${active ? "border-primary bg-surface" : "border-border hover:border-border-strong"}`}
                        >
                          <Icon size={16} className="shrink-0 text-muted" />
                          <span className="truncate">{t.label}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>

          {target.kind === "custom" && (
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              className="h-control w-full rounded-control border border-border bg-surface px-4 text-small outline-none focus:border-primary"
              placeholder="https://… or any text"
              aria-label="Custom link or text"
            />
          )}

          {target.kind === "site" && (
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3">
              <input type="checkbox" checked={track} onChange={(e) => setTrack(e.target.checked)} className="mt-0.5 h-4 w-4 accent-current" />
              <span className="text-small">
                <span className="flex items-center gap-1.5 font-medium text-primary">
                  <BarChart3 size={14} /> Track scans
                </span>
                <span className="text-xs text-muted">Scans show in Analytics as source “qr”, campaign “{target.campaign}”.</span>
              </span>
            </label>
          )}

          <p className="break-all rounded-xl bg-surface px-3 py-2 font-mono text-xs text-secondary">{value || "—"}</p>
        </section>

        {/* Preview + style */}
        <section className="card space-y-5 lg:sticky lg:top-0 lg:self-start">
          <div className="mx-auto w-full max-w-[300px] rounded-3xl border border-border p-4" style={{ background: bg }}>
            {value && !tooLong ? (
              <svg ref={svgRef} viewBox="0 0 256 256" className="block h-auto w-full" role="img" aria-label="QR code preview">
                <rect width="256" height="256" fill={bg} />
                <QRCode value={value} size={256} level={effectiveLevel} fgColor={fg} bgColor={bg} />
                {logo && (
                  <g>
                    <rect x="98" y="98" width="60" height="60" rx="14" fill={bg} />
                    <rect x="104" y="104" width="48" height="48" rx="11" fill={fg} />
                    <text x="128" y="129" textAnchor="middle" dominantBaseline="middle" fill={bg} style={{ font: "600 22px Geist, Inter, sans-serif", letterSpacing: "-0.04em" }}>
                      SV
                    </text>
                  </g>
                )}
              </svg>
            ) : (
              <p className="py-20 text-center text-small" style={{ color: fg }}>
                {tooLong ? "Too much text for a scannable code — shorten it." : "Enter something to encode"}
              </p>
            )}
            {caption && (
              <p className="mt-2 text-center text-sm font-semibold" style={{ color: fg }}>
                {caption}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-secondary">Colour</p>
            <div className="flex flex-wrap items-center gap-2">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setFg(c)} className={`h-7 w-7 rounded-full border-2 ${fg === c ? "border-primary" : "border-transparent"}`} style={{ background: c }} aria-label={`Colour ${c}`} />
              ))}
              <label className="relative h-7 w-7 cursor-pointer overflow-hidden rounded-full border border-border" title="Custom colour" style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }}>
                <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="absolute inset-0 opacity-0" aria-label="Custom colour" />
              </label>
              <span className="mx-1 h-5 w-px bg-border" />
              <button type="button" onClick={() => setBg(bg === "#ffffff" ? "#f8fafc" : "#ffffff")} className="rounded-lg border border-border px-2 py-1 text-xs text-muted">
                {bg === "#ffffff" ? "White" : "Off-white"} background
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-secondary">Error correction</p>
            <div className="grid grid-cols-4 gap-1 rounded-xl border border-border bg-surface p-1">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  disabled={logo}
                  title={l.hint}
                  onClick={() => setLevel(l.id)}
                  className={`rounded-lg py-1.5 text-xs transition disabled:opacity-50 ${effectiveLevel === l.id ? "bg-background font-medium shadow-sm" : "text-muted"}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-3 text-small">
            <span>
              <span className="block font-medium">SV logo in the middle</span>
              <span className="text-xs text-muted">Uses maximum error correction so it still scans</span>
            </span>
            <input type="checkbox" checked={logo} onChange={(e) => setLogo(e.target.checked)} className="h-4 w-4 accent-current" />
          </label>

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, 40))}
            placeholder="Caption, e.g. Scan to see my work"
            className="h-10 w-full rounded-control border border-border bg-surface px-3 text-small outline-none focus:border-primary"
            aria-label="Caption"
          />

          <div className="grid grid-cols-2 gap-2">
            <button type="button" disabled={!value || tooLong} onClick={() => exportPng(1024)} className="inline-flex h-10 items-center justify-center gap-2 rounded-control bg-primary text-small font-medium text-background disabled:opacity-40">
              <Download size={15} /> PNG
            </button>
            <button type="button" disabled={!value || tooLong} onClick={() => downloadSvg(svgRef.current, `${fileBase}.svg`)} className="inline-flex h-10 items-center justify-center gap-2 rounded-control border border-border text-small font-medium disabled:opacity-40">
              <Download size={15} /> SVG
            </button>
            <button type="button" disabled={!value} onClick={copy} className="inline-flex h-10 items-center justify-center gap-2 rounded-control border border-border text-small disabled:opacity-40">
              {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied" : "Copy link"}
            </button>
            <button type="button" disabled={!value || tooLong} onClick={print} className="inline-flex h-10 items-center justify-center gap-2 rounded-control border border-border text-small disabled:opacity-40">
              <Printer size={15} /> Print
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default QrStudio;
