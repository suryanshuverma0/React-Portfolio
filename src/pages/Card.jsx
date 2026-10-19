import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import BusinessCard from "../components/card/BusinessCard";
import { getPublicCard, getVCardUrl } from "../services/public.card.service";

/* ========================================
   /card — the page an NFC tap (or QR scan)
   opens. Standalone: no navbar/footer, fast,
   one screen of what matters most.
========================================= */

function CardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[440px] px-4 pt-10 space-y-6 animate-pulse">
      <div className="mx-auto h-28 w-28 rounded-full bg-surface" />
      <div className="mx-auto h-7 w-48 rounded bg-surface" />
      <div className="mx-auto h-4 w-36 rounded bg-surface" />
      <div className="h-14 rounded-2xl bg-surface" />
      <div className="grid grid-cols-3 gap-3">
        <div className="h-16 rounded-2xl bg-surface" />
        <div className="h-16 rounded-2xl bg-surface" />
        <div className="h-16 rounded-2xl bg-surface" />
      </div>
    </div>
  );
}

function CardPage() {
  const [card, setCard] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    getPublicCard()
      .then((data) => {
        if (cancelled) return;
        setCard(data);
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-background text-primary">
        <CardSkeleton />
      </main>
    );
  }

  if (status === "error" || !card) {
    return (
      <main className="min-h-screen bg-background text-primary flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-body">This card isn&apos;t available right now.</p>
          <Link to="/" className="underline underline-offset-4">
            Visit the portfolio
          </Link>
        </div>
      </main>
    );
  }

  const shareUrl = `${window.location.origin}/card?src=qr`;
  const title = `${card.displayName}${card.title ? ` — ${card.title}` : ""}`;

  return (
    <main className="min-h-screen bg-background text-primary">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={card.tagline || title} />
        <meta name="theme-color" content={card.accentColor} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={card.tagline || ""} />
        {card.photoUrl && <meta property="og:image" content={card.photoUrl} />}
        <meta property="og:type" content="profile" />
      </Helmet>

      <BusinessCard card={card} vcardUrl={getVCardUrl()} shareUrl={shareUrl} />
    </main>
  );
}

export default CardPage;
