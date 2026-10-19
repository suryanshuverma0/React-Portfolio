import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import QRCode from "react-qr-code";
import {
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Share2,
  ArrowUpRight,
  Globe,
  FileText,
  CalendarDays,
  Link2,
  Check,
  RefreshCw,
  Nfc,
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
   A bank-card style digital business card:
   a flippable, tilting card (front: identity,
   back: QR + contact) followed by the few
   actions that matter. Deliberately no card
   number, issuer or payment-network marks —
   it reads as a personal card, never a bank
   card. Presentational only: used by /card
   and the admin live preview.
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

const validHex = (hex) => (/^#[0-9a-f]{6}$/i.test(hex || "") ? hex : "#2a78d6");

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(validHex(hex).slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

const textOn = (hex) => (luminance(hex) > 0.45 ? "#0a0a0a" : "#ffffff");

// Card surface per finish. Text on the card is light for every finish
// except a very light accent.
const FINISHES = {
  midnight: (accent) => ({
    background: `radial-gradient(120% 140% at 100% 0%, ${accent}55 0%, transparent 55%), linear-gradient(135deg, #0b1324 0%, #0f172a 45%, #111827 100%)`,
    ink: "#f1f5f9",
  }),
  black: () => ({
    background:
      "linear-gradient(135deg, #2a2a2a 0%, #0d0d0d 38%, #1c1c1c 62%, #050505 100%)",
    ink: "#f5f5f5",
  }),
  accent: (accent) => ({
    background: `linear-gradient(135deg, ${accent} 0%, color-mix(in srgb, ${accent} 55%, #000) 100%)`,
    ink: textOn(accent) === "#0a0a0a" ? "#111111" : "#ffffff",
  }),
};

const digitsOnly = (phone = "") => phone.replace(/[^\d]/g, "");

const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

/* ---------- card artwork ---------- */

function Chip() {
  return (
    <svg viewBox="0 0 48 36" className="h-9 w-12 drop-shadow" aria-hidden>
      <defs>
        <linearGradient id="chipGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f3dc9c" />
          <stop offset="45%" stopColor="#c9a24d" />
          <stop offset="100%" stopColor="#8e6d2c" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="47" height="35" rx="6" fill="url(#chipGold)" stroke="#7a5c22" strokeOpacity="0.5" />
      <g stroke="#6b4f1c" strokeOpacity="0.55" strokeWidth="1" fill="none">
        <path d="M0 12h14M0 24h14M34 12h14M34 24h14" />
        <path d="M14 0v36M34 0v36" />
        <rect x="14" y="9" width="20" height="18" rx="4" />
      </g>
    </svg>
  );
}

// Fine guilloché lines, like the security print on real cards.
function Guilloche({ color }) {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 252" preserveAspectRatio="none" aria-hidden>
      <g fill="none" stroke={color} strokeOpacity="0.07" strokeWidth="0.8">
        {Array.from({ length: 14 }, (_, i) => (
          <path
            key={i}
            d={`M-10 ${150 + i * 6} C 80 ${90 + i * 9}, 160 ${230 - i * 4}, 250 ${140 + i * 5} S 380 ${80 + i * 8}, 420 ${120 + i * 6}`}
          />
        ))}
      </g>
    </svg>
  );
}

const embossed = (ink) => ({
  color: ink,
  textShadow:
    ink === "#111111"
      ? "0 1px 0 rgba(255,255,255,0.35)"
      : "0 1px 0 rgba(0,0,0,0.55), 0 -1px 0 rgba(255,255,255,0.12)",
});

function CardFace({ children, surface, back = false }) {
  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-[18px] ring-1 ring-white/10"
      style={{
        background: surface.background,
        color: surface.ink,
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: back ? "rotateY(180deg)" : undefined,
        boxShadow: "0 30px 60px -25px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.12)",
      }}
    >
      <Guilloche color={surface.ink} />
      {children}
    </div>
  );
}

function PhysicalCard({ card, shareUrl, preview }) {
  const [flipped, setFlipped] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0, gx: 50, gy: 0 });
  const ref = useRef(null);

  const accent = validHex(card.accentColor);
  const surface = (FINISHES[card.finish] || FINISHES.midnight)(accent);
  const ink = surface.ink;
  const muted = ink === "#111111" ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.6)";
  const show = { qr: true, ...card.sections };

  const reduceMotion =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const handleMove = (event) => {
    if (reduceMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    setTilt({ x: (0.5 - py) * 10, y: (px - 0.5) * 14, gx: px * 100, gy: py * 100 });
  };

  const reset = () => setTilt({ x: 0, y: 0, gx: 50, gy: 0 });

  const contactLines = [
    card.email && { icon: Mail, text: card.email },
    (card.phone || card.whatsapp) && { icon: Phone, text: card.phone || card.whatsapp },
    card.website && { icon: Globe, text: hostOf(card.website) },
  ].filter(Boolean);

  return (
    <div className="space-y-3">
      <div style={{ perspective: "1200px" }}>
        <button
          ref={ref}
          type="button"
          onClick={() => setFlipped((v) => !v)}
          onPointerMove={handleMove}
          onPointerLeave={reset}
          data-track={flipped ? "Flip card to front" : "Flip card to back"}
          aria-label={flipped ? "Show front of card" : "Show back of card"}
          className="relative block w-full cursor-pointer select-none text-left outline-none"
          style={{
            aspectRatio: "1.586 / 1",
            transformStyle: "preserve-3d",
            transition: "transform 600ms cubic-bezier(.2,.7,.2,1)",
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y + (flipped ? 180 : 0)}deg)`,
          }}
        >
          {/* ---------- FRONT ---------- */}
          <CardFace surface={surface}>
            {/* moving sheen */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,0.18), transparent 45%)`,
              }}
            />

            <div className="relative flex h-full flex-col justify-between p-[6.5%]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold tracking-wider"
                    style={{ border: `1px solid ${muted}`, ...embossed(ink) }}
                  >
                    {initials(card.displayName)}
                  </span>
                  {card.company && (
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: muted }}>
                      {card.company}
                    </span>
                  )}
                </div>
                <Nfc size={26} strokeWidth={1.6} style={{ color: muted }} aria-hidden />
              </div>

              <div className="flex items-center gap-4">
                <Chip />
                {card.photoUrl && (
                  <img
                    src={card.photoUrl}
                    alt=""
                    className="ml-auto h-12 w-12 rounded-full object-cover"
                    style={{ boxShadow: `0 0 0 2px ${muted}` }}
                  />
                )}
              </div>

              <div className="space-y-2.5">
                {card.title && (
                  <p
                    className="font-mono text-[clamp(11px,3.4vw,15px)] uppercase tracking-[0.22em] truncate"
                    style={embossed(ink)}
                  >
                    {card.title}
                  </p>
                )}

                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[8px] uppercase tracking-[0.2em]" style={{ color: muted }}>
                      Card holder
                    </p>
                    <p
                      className="truncate font-mono text-[clamp(13px,4.2vw,18px)] font-semibold uppercase tracking-[0.12em]"
                      style={embossed(ink)}
                    >
                      {card.displayName}
                    </p>
                  </div>

                  {(card.location || card.availability) && (
                    <div className="shrink-0 text-right">
                      <p className="text-[8px] uppercase tracking-[0.2em]" style={{ color: muted }}>
                        {card.availability ? "Status" : "Based in"}
                      </p>
                      <p className="text-[11px] font-semibold uppercase tracking-wider" style={embossed(ink)}>
                        {card.availability ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            {card.availability.length > 18 ? "Available" : card.availability}
                          </span>
                        ) : (
                          card.location
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardFace>

          {/* ---------- BACK ---------- */}
          <CardFace surface={surface} back>
            <div className="absolute inset-x-0 top-[11%] h-[17%] bg-black/85" aria-hidden />

            <div className="relative flex h-full flex-col justify-end gap-[6%] p-[6.5%] pt-[34%]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 flex-1 items-center rounded bg-white/90 px-3">
                  <span className="truncate font-serif text-lg italic text-neutral-800">
                    {card.displayName}
                  </span>
                </div>
                {show.qr && shareUrl && (
                  <div className="shrink-0 rounded-md bg-white p-1.5">
                    <QRCode value={shareUrl} size={64} />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                {contactLines.map(({ icon: Icon, text }) => (
                  <p key={text} className="flex items-center gap-2 truncate font-mono text-[11px] tracking-wide" style={{ color: ink }}>
                    <Icon size={12} style={{ color: muted }} />
                    {text}
                  </p>
                ))}
                {card.location && (
                  <p className="flex items-center gap-2 truncate font-mono text-[11px] tracking-wide" style={{ color: ink }}>
                    <MapPin size={12} style={{ color: muted }} />
                    {card.location}
                  </p>
                )}
              </div>
            </div>
          </CardFace>
        </button>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
        <RefreshCw size={11} /> Tap the card to {flipped ? "see the front" : "flip it"}
        {preview && " (preview)"}
      </p>
    </div>
  );
}

/* ---------- page ---------- */

function ActionTile({ href, icon: Icon, label, external }) {
  return (
    <a
      href={href}
      data-track={label}
      {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
      className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface py-3.5 text-xs font-medium transition hover:border-[var(--card-accent)] active:scale-[0.98]"
    >
      <Icon size={19} style={{ color: "var(--card-accent)" }} />
      {label}
    </a>
  );
}

function BusinessCard({ card, vcardUrl, shareUrl, preview = false }) {
  const [copied, setCopied] = useState(false);

  const show = { saveContact: true, portfolioButton: true, share: true, ...card.sections };
  const accent = validHex(card.accentColor);
  const onAccent = textOn(accent);
  const whatsappDigits = digitsOnly(card.whatsapp);

  const actions = [
    card.phone && { href: `tel:${card.phone.replace(/[^\d+]/g, "")}`, icon: Phone, label: "Call" },
    whatsappDigits && { href: `https://wa.me/${whatsappDigits}`, icon: FaWhatsapp, label: "WhatsApp", external: true },
    card.email && { href: `mailto:${card.email}`, icon: Mail, label: "Email" },
  ].filter(Boolean);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: card.displayName, text: card.tagline || "", url: shareUrl });
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
    <div className="relative min-h-full overflow-hidden" style={{ "--card-accent": accent }}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-32 h-80 opacity-25 blur-3xl"
        style={{ background: `radial-gradient(closest-side, ${accent}, transparent)` }}
      />

      <div className="relative mx-auto w-full max-w-[420px] space-y-7 px-4 pb-12 pt-10">
        <PhysicalCard card={card} shareUrl={shareUrl} preview={preview} />

        {card.tagline && (
          <p className="text-center text-sm leading-relaxed text-secondary">{card.tagline}</p>
        )}

        <section className="space-y-3">
          {show.saveContact && (
            <a
              href={preview ? undefined : vcardUrl}
              data-track="Save contact"
              className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl text-[15px] font-semibold transition active:scale-[0.99]"
              style={{ backgroundColor: accent, color: onAccent, boxShadow: `0 12px 30px -14px ${accent}` }}
            >
              <UserPlus size={20} />
              Save contact
            </a>
          )}

          {actions.length > 0 && (
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))` }}>
              {actions.map((action) => (
                <ActionTile key={action.label} {...action} />
              ))}
            </div>
          )}
        </section>

        {card.links?.length > 0 && (
          <section className="flex flex-wrap items-center justify-center gap-3">
            {card.links.map((link) => {
              const Icon = LINK_ICONS[link.kind] || Link2;
              return (
                <a
                  key={`${link.kind}-${link.url}`}
                  href={preview ? undefined : link.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  data-track={link.label}
                  aria-label={link.label}
                  title={link.label}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface transition hover:border-[var(--card-accent)]"
                >
                  <Icon size={20} />
                </a>
              );
            })}
          </section>
        )}

        {(show.portfolioButton || show.share) && (
          <section className={`grid gap-3 ${show.portfolioButton && show.share ? "grid-cols-2" : "grid-cols-1"}`}>
            {show.portfolioButton && (
              <Link
                to={preview ? "#" : "/"}
                data-track="View full portfolio"
                className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface text-sm font-medium"
              >
                Portfolio <ArrowUpRight size={15} />
              </Link>
            )}
            {show.share && (
              <button
                type="button"
                onClick={handleShare}
                data-track="Share card"
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-medium"
              >
                {copied ? <Check size={15} /> : <Share2 size={15} />}
                {copied ? "Link copied" : "Share"}
              </button>
            )}
          </section>
        )}

        <footer className="text-center text-[11px] text-muted">{hostOf(card.website) || card.displayName}</footer>
      </div>
    </div>
  );
}

export default BusinessCard;
