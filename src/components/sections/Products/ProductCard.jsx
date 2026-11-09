import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Star, Globe, Smartphone } from "lucide-react";
import { FaGithub } from "react-icons/fa";

import { screenshotUrl, useReadyImage } from "./productMedia";

/* ========================================
   PRODUCT CARD — a live product in a device
   frame: websites in a browser window with a
   real screenshot of their homepage (taken
   on the fly — nothing uploaded), apps in a
   phone. Tilts gently in 3D under the
   pointer.
========================================= */


const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

function BrowserFrame({ product }) {
  const site = product.url || product.links?.website;
  const live = useReadyImage(product.useScreenshot !== false && site ? screenshotUrl(site) : "");
  const [imageFailed, setImageFailed] = useState(false);
  const src = live || (!imageFailed && product.image) || "";
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-[0_30px_60px_-30px_rgba(0,0,0,0.45)]">
      <div className="flex items-center gap-2 border-b border-border bg-surface/80 px-3 py-2">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="mx-auto max-w-[70%] truncate rounded-md bg-background px-3 py-0.5 text-[11px] text-muted">{hostOf(site) || product.name}</span>
      </div>
      <div className="relative aspect-[16/10] overflow-hidden bg-surface">
        {src ? (
          <img
            key={src}
            src={src}
            alt={`${product.name} homepage`}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full animate-[fade-in-soft_.5s_ease] object-cover object-top transition-transform duration-[1.6s] ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center" style={{ background: product.accent || undefined }}>
            {product.icon && <img src={product.icon} alt="" className="h-16 w-16 rounded-2xl" />}
          </div>
        )}
      </div>
    </div>
  );
}

function PhoneFrame({ product }) {
  const shot = product.screenshots?.[0];
  return (
    <div className="relative mx-auto aspect-[9/18.5] w-[52%] min-w-[150px] max-w-[220px] rounded-[2.2rem] border-[7px] border-[#111] bg-[#111] shadow-[0_30px_60px_-25px_rgba(0,0,0,0.6)]">
      <span className="absolute left-1/2 top-1.5 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-[#111]" aria-hidden />
      <div className="h-full w-full overflow-hidden rounded-[1.6rem] bg-surface">
        {shot ? (
          <img src={shot} alt={`${product.name} screenshot`} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div
            className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center"
            style={{ background: `linear-gradient(160deg, ${product.accent || "var(--color-surface)"}, var(--color-background))` }}
          >
            {product.icon && <img src={product.icon} alt="" className="h-16 w-16 rounded-[1.1rem] shadow-lg" />}
            <span className="text-sm font-semibold">{product.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product, index = 0 }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const mobile = product.kind === "mobile";
  const site = product.url || product.links?.website;
  const primaryHref = site || product.links?.playStore || product.links?.appStore || product.links?.github;

  const onMove = (e) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setTilt({ x: ((e.clientY - r.top) / r.height - 0.5) * -6, y: ((e.clientX - r.left) / r.width - 0.5) * 8 });
  };

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={onMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      style={{ perspective: 1200 }}
      className="group"
    >
      <div
        className="panel panel-hover flex h-full flex-col gap-6 p-5 transition-transform duration-300 ease-out sm:p-6"
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, transformStyle: "preserve-3d" }}
      >
        <div className="relative" style={{ transform: "translateZ(30px)" }}>
          {mobile ? <PhoneFrame product={product} /> : <BrowserFrame product={product} />}
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-start gap-3">
            {product.icon && <img src={product.icon} alt="" className="h-11 w-11 shrink-0 rounded-xl border border-border bg-background object-cover" loading="lazy" />}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[22px] font-semibold leading-tight tracking-tight">{product.name}</h3>
                {product.status && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[11px] text-secondary">
                    <span className={`h-1.5 w-1.5 rounded-full ${/live|launched/i.test(product.status) ? "bg-emerald-500" : "bg-amber-500"}`} />
                    {product.status}
                  </span>
                )}
              </div>
              {product.tagline && <p className="mt-1 text-small text-pretty">{product.tagline}</p>}
            </div>
          </div>

          {product.description && <p className="text-body line-clamp-3">{product.description}</p>}

          {(product.stats?.length > 0 || product.rating) && (
            <div className="flex flex-wrap gap-2">
              {product.rating ? (
                <span className="chip">
                  <Star size={12} className="fill-current" /> {product.rating}
                </span>
              ) : null}
              {product.stats?.map((s) => (
                <span key={s.label} className="chip">
                  <b className="text-primary">{s.value}</b> {s.label}
                </span>
              ))}
            </div>
          )}

          <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
            {primaryHref && (
              <a href={primaryHref} target="_blank" rel="noreferrer" className="btn btn-primary" aria-label={`Open ${product.name} (new tab)`}>
                {site ? "Visit" : "Get the app"} <ArrowUpRight size={15} aria-hidden />
              </a>
            )}
            {site && product.links?.playStore && (
              <a href={product.links.playStore} target="_blank" rel="noreferrer" className="btn btn-outline" aria-label="Google Play (new tab)">
                <Smartphone size={15} aria-hidden /> Android
              </a>
            )}
            {(site || product.links?.playStore) && product.links?.appStore && (
              <a href={product.links.appStore} target="_blank" rel="noreferrer" className="btn btn-outline" aria-label="App Store (new tab)">
                <Smartphone size={15} aria-hidden /> iOS
              </a>
            )}
            {product.links?.github && (
              <a href={product.links.github} target="_blank" rel="noreferrer" className="btn btn-outline" aria-label="Source code (new tab)">
                <FaGithub size={15} aria-hidden />
              </a>
            )}
            {site && (
              <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted">
                <Globe size={12} /> {hostOf(site)}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export default ProductCard;
