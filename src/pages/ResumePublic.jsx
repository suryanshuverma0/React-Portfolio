import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import QRCode from "react-qr-code";
import { Download, Share2, QrCode, X, ArrowLeft, Check } from "lucide-react";

import ResumeDocument from "../components/resume/ResumeDocument";
import { ResumePrintPortal } from "../components/resume/ResumePrint";
import { printResume } from "../components/resume/printResume";
import { getPublicResume } from "../admin/services/resume.service";
import SEO from "../components/common/SEO";
import { SITE_URL } from "../lib/site";

/* ========================================
   PUBLIC RESUME — /resume (the default one)
   and /resume/:slug. Full-size on desktop,
   scaled to fit on phones, with Download PDF,
   Share and a QR code for in-person sharing.
========================================= */

function FitSheet({ resume }) {
  const boxRef = useRef(null);
  const sheetRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const measure = () => {
      const w = sheetRef.current?.firstChild?.offsetWidth || 794;
      setScale(Math.min(1, (boxRef.current?.clientWidth || w) / w));
      setHeight(sheetRef.current?.firstChild?.offsetHeight || 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (boxRef.current) ro.observe(boxRef.current);
    if (sheetRef.current) ro.observe(sheetRef.current);
    return () => ro.disconnect();
  }, [resume]);

  return (
    <div ref={boxRef} className="mx-auto w-full max-w-[816px]" style={{ height: height ? height * scale : undefined }}>
      <div ref={sheetRef} style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: "max-content" }} className="shadow-2xl">
        <ResumeDocument config={resume.config} data={resume.data} siteUrl={SITE_URL} paged={false} />
      </div>
    </div>
  );
}

function ResumePublic() {
  const { slug } = useParams();
  const [resume, setResume] = useState(null);
  const [error, setError] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    getPublicResume(slug)
      .then((data) => alive && setResume(data))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [slug]);

  const name = resume?.config?.header?.name || resume?.data?.identity?.name || "Resume";
  const url = `${SITE_URL}/resume${slug ? `/${slug}` : ""}`;

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: `${name} — Resume`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }
    } catch {
      /* cancelled */
    }
  };

  if (error) {
    return (
      <main className="flex min-h-[100svh] flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <SEO title="Resume not found" description="This resume link isn't available." noindex />
        <h1 className="text-heading">Resume not available</h1>
        <p className="text-body max-w-sm">This link may have changed or the resume was made private.</p>
        <Link to="/" className="btn btn-primary">Visit the portfolio</Link>
      </main>
    );
  }

  return (
    <main className="min-h-[100svh] bg-[#e9e9eb] pb-28 pt-6 dark:bg-[#141414] sm:pt-10">
      <SEO title={`${name} — Resume`} description={`Resume of ${name}.`} noindex />

      <div className="mx-auto mb-5 flex max-w-[816px] items-center justify-between px-4">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
          <ArrowLeft size={15} /> Portfolio
        </Link>
        <span className="text-xs text-neutral-500">{resume?.updatedAt ? `Updated ${new Date(resume.updatedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}` : ""}</span>
      </div>

      <div className="px-3 sm:px-4">
        {resume ? (
          <FitSheet resume={resume} />
        ) : (
          <div className="mx-auto aspect-[210/297] w-full max-w-[816px] animate-pulse rounded bg-white/70 dark:bg-white/10" />
        )}
      </div>

      {resume && (
        <>
          <ResumePrintPortal config={resume.config} data={resume.data} siteUrl={SITE_URL} />

          {/* Floating actions */}
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="fixed inset-x-0 bottom-5 z-30 flex justify-center px-4">
            <div className="flex items-center gap-1 rounded-full border border-black/10 bg-white/90 p-1.5 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-neutral-900/90">
              <button type="button" onClick={() => printResume({ config: resume.config, name })} className="inline-flex h-11 items-center gap-2 rounded-full bg-neutral-900 px-5 text-sm font-medium text-white dark:bg-white dark:text-neutral-900">
                <Download size={16} /> Download PDF
              </button>
              <button type="button" onClick={share} className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm text-neutral-700 hover:bg-black/5 dark:text-neutral-200 dark:hover:bg-white/10">
                {copied ? <Check size={16} /> : <Share2 size={16} />} <span className="hidden sm:inline">{copied ? "Copied" : "Share"}</span>
              </button>
              <button type="button" onClick={() => setQrOpen(true)} className="inline-flex h-11 w-11 items-center justify-center rounded-full text-neutral-700 hover:bg-black/5 dark:text-neutral-200 dark:hover:bg-white/10" aria-label="Show QR code">
                <QrCode size={17} />
              </button>
            </div>
          </motion.div>

          <AnimatePresence>
            {qrOpen && (
              <motion.div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setQrOpen(false)}>
                <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-xs rounded-3xl bg-white p-6 text-center text-neutral-900 shadow-2xl">
                  <button type="button" onClick={() => setQrOpen(false)} className="absolute right-3 top-3 rounded-full p-1.5 hover:bg-neutral-100" aria-label="Close">
                    <X size={16} />
                  </button>
                  <p className="mb-4 text-sm font-semibold">Scan to open this resume</p>
                  <QRCode value={`${url}?utm_source=qr&utm_medium=qr&utm_campaign=resume`} size={220} level="M" className="mx-auto h-auto w-full" />
                  <p className="mt-4 break-all text-xs text-neutral-500">{url.replace(/^https?:\/\//, "")}</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </main>
  );
}

export default ResumePublic;
