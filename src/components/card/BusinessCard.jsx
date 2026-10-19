import { useState } from "react";
import { Link } from "react-router-dom";
import QRCode from "react-qr-code";
import {
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Share2,
  QrCode,
  ArrowUpRight,
  ChevronRight,
  Globe,
  FileText,
  CalendarDays,
  Link2,
  Check,
} from "lucide-react";
import {
  FaLinkedin,
  FaGithub,
  FaXTwitter,
  FaInstagram,
  FaFacebook,
  FaWhatsapp,
} from "react-icons/fa6";
import { SiLeetcode } from "react-icons/si";

/* ========================================
   BUSINESS CARD
   Presentational only — rendered by the
   public /card page and by the admin
   editor's live preview. Every tappable
   element carries data-track so the journey
   tracker records a clean action label.
========================================= */

const LINK_ICONS = {
  linkedin: FaLinkedin,
  github: FaGithub,
  leetcode: SiLeetcode,
  twitter: FaXTwitter,
  instagram: FaInstagram,
  facebook: FaFacebook,
  website: Globe,
  resume: FileText,
  calendar: CalendarDays,
  custom: Link2,
};

// Readable text on top of an arbitrary accent colour.
const textOn = (hex) => {
  const value = /^#[0-9a-f]{6}$/i.test(hex || "") ? hex : "#2a78d6";
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return luminance > 0.45 ? "#0a0a0a" : "#ffffff";
};

const digitsOnly = (phone = "") => phone.replace(/[^\d]/g, "");

const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

function QuickAction({ href, icon: Icon, label, external }) {
  return (
    <a
      href={href}
      data-track={label}
      {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
      className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface py-3.5 text-xs font-medium transition hover:border-[var(--card-accent)] active:scale-[0.98]"
    >
      <Icon size={20} style={{ color: "var(--card-accent)" }} />
      {label}
    </a>
  );
}

function SectionHeading({ children }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted mb-3">
      {children}
    </h2>
  );
}

function BusinessCard({ card, vcardUrl, shareUrl, preview = false }) {
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);

  const show = { saveContact: true, portfolioButton: true, share: true, qr: true, ...card.sections };
  const accent = card.accentColor || "#2a78d6";
  const onAccent = textOn(accent);
  const whatsappDigits = digitsOnly(card.whatsapp);

  const quickActions = [
    card.phone && { href: `tel:${card.phone.replace(/[^\d+]/g, "")}`, icon: Phone, label: "Call" },
    whatsappDigits && {
      href: `https://wa.me/${whatsappDigits}`,
      icon: FaWhatsapp,
      label: "WhatsApp",
      external: true,
    },
    card.email && { href: `mailto:${card.email}`, icon: Mail, label: "Email" },
  ].filter(Boolean);

  const handleShare = async () => {
    const data = {
      title: `${card.displayName}${card.title ? ` — ${card.title}` : ""}`,
      text: card.tagline || "",
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* share sheet dismissed */
    }
  };

  return (
    <div
      className="relative min-h-full overflow-hidden"
      style={{ "--card-accent": accent }}
    >
      {/* accent glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-80 opacity-30 blur-3xl"
        style={{ background: `radial-gradient(closest-side, ${accent}, transparent)` }}
      />

      <div className="relative mx-auto w-full max-w-[440px] px-4 pt-10 pb-12 space-y-8">
        {/* ---------- identity ---------- */}
        <header className="text-center space-y-4">
          <div className="mx-auto h-28 w-28 rounded-full p-[3px]" style={{ background: accent }}>
            {card.photoUrl ? (
              <img
                src={card.photoUrl}
                alt={card.displayName}
                className="h-full w-full rounded-full object-cover border-4 border-[var(--color-background)]"
              />
            ) : (
              <div className="h-full w-full rounded-full border-4 border-[var(--color-background)] bg-surface flex items-center justify-center text-3xl font-semibold">
                {initials(card.displayName)}
              </div>
            )}
          </div>

          {card.availability && (
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              {card.availability}
            </span>
          )}

          <div className="space-y-1.5">
            <h1 className="text-[28px] leading-tight font-semibold tracking-tight">
              {card.displayName}
            </h1>
            {(card.title || card.company) && (
              <p className="text-[15px] text-secondary">
                {card.title}
                {card.title && card.company && <span className="text-muted"> · </span>}
                {card.company}
              </p>
            )}
            {card.location && (
              <p className="inline-flex items-center gap-1 text-xs text-muted">
                <MapPin size={13} /> {card.location}
              </p>
            )}
          </div>

          {card.tagline && (
            <p className="text-sm leading-relaxed text-secondary max-w-sm mx-auto">
              {card.tagline}
            </p>
          )}
        </header>

        {/* ---------- primary actions ---------- */}
        <section className="space-y-3">
          {show.saveContact && (
          <a
            href={preview ? undefined : vcardUrl}
            data-track="Save contact"
            className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl text-[15px] font-semibold shadow-lg transition active:scale-[0.99]"
            style={{ backgroundColor: accent, color: onAccent, boxShadow: `0 10px 30px -12px ${accent}` }}
          >
            <UserPlus size={20} />
            Save contact
          </a>
          )}

          {quickActions.length > 0 && (
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${quickActions.length}, minmax(0, 1fr))` }}>
              {quickActions.map((action) => (
                <QuickAction key={action.label} {...action} />
              ))}
            </div>
          )}
        </section>

        {/* ---------- highlights ---------- */}
        {card.stats?.length > 0 && (
          <section
            className="grid rounded-2xl border border-border bg-surface divide-x divide-border"
            style={{ gridTemplateColumns: `repeat(${card.stats.length}, minmax(0, 1fr))` }}
          >
            {card.stats.map((stat) => (
              <div key={`${stat.value}-${stat.label}`} className="px-2 py-4 text-center">
                <p className="text-xl font-semibold tabular-nums" style={{ color: "var(--card-accent)" }}>
                  {stat.value}
                </p>
                <p className="mt-0.5 text-[11px] leading-tight text-muted">{stat.label}</p>
              </div>
            ))}
          </section>
        )}

        {card.skills?.length > 0 && (
          <section>
            <SectionHeading>Core stack</SectionHeading>
            <div className="flex flex-wrap gap-2">
              {card.skills.map((skill) => (
                <span key={skill} className="rounded-full border border-border bg-surface px-3 py-1 text-xs">
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {card.featuredProjects?.length > 0 && (
          <section>
            <SectionHeading>Featured work</SectionHeading>
            <div className="space-y-3">
              {card.featuredProjects.map((project) => (
                <Link
                  key={project.slug}
                  to={preview ? "#" : `/projects/${project.slug}`}
                  data-track={`Project: ${project.title}`}
                  className="flex gap-3 rounded-2xl border border-border bg-surface p-3 transition hover:border-[var(--card-accent)]"
                >
                  {project.thumbnailUrl && (
                    <img
                      src={project.thumbnailUrl}
                      alt=""
                      loading="lazy"
                      className="h-16 w-16 shrink-0 rounded-xl object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center justify-between gap-2 text-sm font-semibold">
                      <span className="truncate">{project.title}</span>
                      <ArrowUpRight size={15} className="shrink-0 text-muted" />
                    </p>
                    {project.summary && (
                      <p className="mt-0.5 text-xs text-muted line-clamp-2">{project.summary}</p>
                    )}
                    {project.technologies?.length > 0 && (
                      <p className="mt-1.5 text-[11px] text-secondary truncate">
                        {project.technologies.join(" · ")}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ---------- links ---------- */}
        {card.links?.length > 0 && (
          <section>
            <SectionHeading>Find me online</SectionHeading>
            <div className="overflow-hidden rounded-2xl border border-border bg-surface divide-y divide-border">
              {card.links.map((link) => {
                const Icon = LINK_ICONS[link.kind] || Link2;
                return (
                  <a
                    key={`${link.kind}-${link.url}`}
                    href={preview ? undefined : link.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    data-track={link.label}
                    className="flex items-center gap-3 px-4 py-3.5 text-sm transition hover:bg-[var(--color-card)]"
                  >
                    <Icon size={18} className="shrink-0" />
                    <span className="flex-1 font-medium">{link.label}</span>
                    <ChevronRight size={16} className="text-muted" />
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {show.portfolioButton && (
        <Link
          to={preview ? "#" : "/"}
          data-track="View full portfolio"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border text-sm font-semibold transition hover:bg-surface"
          style={{ borderColor: accent, color: "var(--color-primary)" }}
        >
          View full portfolio
          <ArrowUpRight size={16} />
        </Link>
        )}

        {/* ---------- share ---------- */}
        {(show.share || show.qr) && (
        <section className="space-y-3">
          <div className={`grid gap-3 ${show.share && show.qr ? "grid-cols-2" : "grid-cols-1"}`}>
            {show.share && (
            <button
              type="button"
              onClick={handleShare}
              data-track="Share card"
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm"
            >
              {copied ? <Check size={16} /> : <Share2 size={16} />}
              {copied ? "Link copied" : "Share card"}
            </button>
            )}
            {show.qr && (
              <button
                type="button"
                onClick={() => setShowQr((v) => !v)}
                data-track="Show QR"
                aria-expanded={showQr}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm"
              >
                <QrCode size={16} />
                {showQr ? "Hide QR" : "Show QR"}
              </button>
            )}
          </div>

          {showQr && (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-5">
              <div className="rounded-xl bg-white p-3">
                <QRCode value={shareUrl} size={168} />
              </div>
              <p className="text-xs text-muted">Scan to open this card</p>
            </div>
          )}
        </section>
        )}

        <footer className="pt-2 text-center text-[11px] text-muted">
          {(() => {
            try {
              return new URL(card.website).hostname.replace(/^www\./, "");
            } catch {
              return card.displayName;
            }
          })()}
        </footer>
      </div>
    </div>
  );
}

export default BusinessCard;
