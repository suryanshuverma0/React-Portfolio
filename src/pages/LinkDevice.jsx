import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { QrCode, CheckCircle2, ShieldAlert, Loader2, Smartphone } from "lucide-react";

import { redeemQrLogin } from "../admin/services/account.service";
import SEO from "../components/common/SEO";

/* ========================================
   LINK DEVICE — opened by scanning the QR
   code shown under admin → Devices. The
   one-time token is in the URL fragment
   (never sent to servers or analytics); it
   is read once, removed from the address
   bar, and redeemed only after a tap.
========================================= */

const readToken = () => {
  const token = window.location.hash.replace(/^#/, "");
  return /^[A-Za-z0-9_-]{20,100}$/.test(token) ? token : null;
};

function LinkDevice() {
  const [token] = useState(readToken);
  const [state, setState] = useState(token ? "ready" : "missing"); // ready | working | done | error | missing
  const [error, setError] = useState("");

  // Take the token out of the address bar / history straight away.
  useEffect(() => {
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
  }, []);

  const signIn = async () => {
    setState("working");
    try {
      await redeemQrLogin(token);
      setState("done");
      // Full load so the app starts signed in (and can be installed from there).
      setTimeout(() => window.location.replace("/dashboard"), 900);
    } catch (e) {
      setError(e.response?.data?.message || "This code didn't work. Show a new one on your signed-in screen.");
      setState("error");
    }
  };

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-background px-5 py-10">
      <SEO title="Sign in this device" description="Sign in to the admin panel with a QR code." noindex />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-3xl border border-border bg-card p-7 text-center shadow-xl"
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface">
          {state === "done" ? (
            <CheckCircle2 size={32} className="text-emerald-500" />
          ) : state === "error" || state === "missing" ? (
            <ShieldAlert size={30} className="text-amber-500" />
          ) : (
            <QrCode size={30} />
          )}
        </div>

        {state === "ready" || state === "working" ? (
          <>
            <h1 className="text-title">Sign in this device?</h1>
            <p className="text-small mt-2">
              This signs this {/(iPhone|Android)/i.test(navigator.userAgent) ? "phone" : "device"} in to your portfolio admin panel. Only continue if you scanned the code yourself.
            </p>
            <button
              type="button"
              onClick={signIn}
              disabled={state === "working"}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-medium text-background disabled:opacity-60"
            >
              {state === "working" ? <Loader2 size={18} className="animate-spin" /> : <Smartphone size={18} />}
              {state === "working" ? "Signing in…" : "Sign in"}
            </button>
            <a href="/" className="mt-3 inline-block text-xs text-muted hover:text-primary">
              Cancel
            </a>
          </>
        ) : state === "done" ? (
          <>
            <h1 className="text-title">You&apos;re signed in</h1>
            <p className="text-small mt-2">Opening your admin panel…</p>
          </>
        ) : (
          <>
            <h1 className="text-title">{state === "missing" ? "No sign-in code" : "Code didn't work"}</h1>
            <p className="text-small mt-2">
              {state === "missing" ? "Open this page by scanning the QR code under Admin → Devices on a signed-in screen." : error}
            </p>
            <a href="/login" className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-2xl border border-border text-small font-medium">
              Sign in with password instead
            </a>
          </>
        )}
      </motion.div>
    </main>
  );
}

export default LinkDevice;
