import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Fingerprint, ShieldCheck, Smartphone, LockKeyhole, Check } from "lucide-react";

import Wordmark from "../ui/Wordmark";
import ThemeToggle from "../ui/ThemeToggle";

/* ========================================
   AUTH LAYOUT — split screen. A living brand
   panel (aurora gradient + a 3D stack of
   security cards that tilts under the
   pointer) beside a calm form column. On
   phones the panel collapses to a soft
   glow behind the form.
========================================= */

const COPY = {
  login: { kicker: "Welcome back", headline: "Pick up right where you left off.", lines: ["One tap with your fingerprint", "Two-step codes when you want them", "Every device you trust, in one place"] },
  register: { kicker: "Get started", headline: "An account in seconds — no password needed.", lines: ["Sign up with a passkey or Google", "Nothing to remember, nothing to leak", "Switch devices whenever you like"] },
  recover: { kicker: "Account recovery", headline: "Locked out? We'll get you back in.", lines: ["A secure one-time link by email", "Links expire quickly and work once", "Your sessions stay protected"] },
};

const CARDS = [
  { icon: Fingerprint, title: "Passkey", meta: "Touch ID · verified", tone: "var(--color-chart-1)" },
  { icon: Smartphone, title: "Two-step code", meta: "6 digits · 30 s", tone: "var(--color-chart-3)" },
  { icon: LockKeyhole, title: "Session secured", meta: "This device · trusted", tone: "var(--color-chart-2)" },
];

function CardStack() {
  const reduce = useReducedMotion();
  const [tilt, setTilt] = useState({ x: 8, y: -14 });
  return (
    <div
      className="relative mx-auto h-[300px] w-full max-w-[380px]"
      style={{ perspective: 1100 }}
      onPointerMove={(e) => {
        if (reduce) return;
        const r = e.currentTarget.getBoundingClientRect();
        setTilt({ x: 8 - ((e.clientY - r.top) / r.height - 0.5) * 14, y: -14 + ((e.clientX - r.left) / r.width - 0.5) * 22 });
      }}
      onPointerLeave={() => setTilt({ x: 8, y: -14 })}
    >
      <motion.div className="absolute inset-0" animate={{ rotateX: tilt.x, rotateY: tilt.y }} transition={{ type: "spring", stiffness: 120, damping: 18 }} style={{ transformStyle: "preserve-3d" }}>
        {CARDS.map(({ icon: Icon, title, meta, tone }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 40, z: 0 }}
            animate={{ opacity: 1, y: 0, z: 40 + i * 55 }}
            transition={{ delay: 0.15 + i * 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 right-0 mx-auto flex w-[86%] items-center gap-3.5 rounded-2xl border border-white/15 bg-white/[0.07] p-4 text-white shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)] backdrop-blur-xl"
            style={{ top: 30 + i * 78, transformStyle: "preserve-3d" }}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${tone} 35%, transparent)` }}>
              <Icon size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold">{title}</span>
              <span className="text-[12px] text-white/60">{meta}</span>
            </span>
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7 + i * 0.15, type: "spring" }} className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/90 text-black">
              <Check size={13} strokeWidth={3} />
            </motion.span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function Showcase({ mode }) {
  const copy = COPY[mode] || COPY.login;
  return (
    <aside className="relative hidden overflow-hidden bg-[#07080c] text-white lg:sticky lg:top-0 lg:flex lg:h-[100dvh] lg:flex-col">
      {/* aurora */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="auth-aurora absolute -left-1/4 -top-1/4 h-[70%] w-[80%] rounded-full opacity-60 blur-[90px]" style={{ background: "radial-gradient(circle, var(--color-chart-1), transparent 65%)" }} />
        <div className="auth-aurora absolute -bottom-1/4 -right-1/4 h-[70%] w-[75%] rounded-full opacity-45 blur-[100px] [animation-delay:-6s]" style={{ background: "radial-gradient(circle, var(--color-chart-2), transparent 65%)" }} />
        <div className="auth-aurora absolute left-1/3 top-1/2 h-[45%] w-[45%] rounded-full opacity-30 blur-[90px] [animation-delay:-11s]" style={{ background: "radial-gradient(circle, var(--color-chart-3), transparent 65%)" }} />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col p-10 xl:p-14">
        <Link to="/" className="inline-flex w-fit items-center gap-2.5 text-white">
          <span className="h-2 w-2 rounded-full bg-white" />
          <span className="text-[15px] font-semibold tracking-[-0.03em]">Suryanshu Verma</span>
        </Link>

        <div className="my-auto py-10">
          <CardStack />
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className="mx-auto mt-12 max-w-[420px]">
            <p className="text-[12px] font-medium uppercase tracking-[0.2em] text-white/50">{copy.kicker}</p>
            <h2 className="mt-3 text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] text-balance">{copy.headline}</h2>
            <ul className="mt-6 space-y-2.5">
              {copy.lines.map((line) => (
                <li key={line} className="flex items-center gap-2.5 text-[14px] text-white/70">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
                    <Check size={11} strokeWidth={3} />
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <p className="text-[12px] text-white/40">© {new Date().getFullYear()} Suryanshu Verma · Private and secure sign-in</p>
      </div>
    </aside>
  );
}

function AuthLayout({ title, subtitle, children, mode = "login" }) {
  return (
    <main className="grid min-h-[100dvh] bg-background lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <Showcase mode={mode} />

      <section className="relative flex min-h-[100dvh] flex-col overflow-hidden">
        {/* soft glow on small screens, where the showcase is hidden */}
        <div className="pointer-events-none absolute inset-0 lg:hidden" aria-hidden>
          <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full opacity-25 blur-3xl" style={{ background: "radial-gradient(circle, var(--color-chart-1), transparent 70%)" }} />
          <div className="absolute -bottom-40 -right-24 h-72 w-72 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, var(--color-chart-2), transparent 70%)" }} />
        </div>

        <header className="relative z-10 flex items-center justify-between px-5 pt-5 sm:px-8 sm:pt-7">
          <Link to="/" className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[13px] text-muted transition-colors hover:text-primary">
            <ArrowLeft size={15} /> Back to site
          </Link>
          <ThemeToggle />
        </header>

        <div className="relative z-10 flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-[400px]">
            <div className="mb-8 lg:hidden">
              <Wordmark subtitle="Secure sign-in" />
            </div>
            <h1 className="text-[32px] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[36px]">{title}</h1>
            {subtitle && <p className="mt-3 max-w-[340px] text-[15px] leading-relaxed text-secondary">{subtitle}</p>}
            <div className="mt-8">{children}</div>
          </motion.div>
        </div>

        <footer className="relative z-10 flex items-center justify-center gap-1.5 px-5 pb-6 text-[12px] text-muted">
          <ShieldCheck size={13} /> Protected by passkeys, two-step codes and rate limiting
        </footer>
      </section>
    </main>
  );
}

export default AuthLayout;
