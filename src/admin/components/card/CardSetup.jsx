import { useRef } from "react";
import { toast } from "react-toastify";
import QRCode from "react-qr-code";
import { Copy, Download, ExternalLink, Nfc, QrCode } from "lucide-react";

/* ========================================
   What to write to the NFC chip and what to
   print as a QR fallback. The ?src= tag is
   how analytics tells taps from scans.
========================================= */

function UrlRow({ label, url }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Copied");
    } catch {
      toast.error("Couldn't copy");
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-label">{label}</p>
      <div className="flex gap-2">
        <code className="flex-1 min-w-0 truncate rounded-xl border border-border bg-surface px-3 py-2.5 text-xs">
          {url}
        </code>
        <button
          type="button"
          onClick={copy}
          className="h-10 px-3 rounded-xl border border-border bg-surface text-small inline-flex items-center gap-2"
        >
          <Copy size={15} /> Copy
        </button>
      </div>
    </div>
  );
}

function CardSetup() {
  const qrRef = useRef(null);
  const origin = window.location.origin;
  const nfcUrl = `${origin}/card?src=nfc`;
  const qrUrl = `${origin}/card?src=qr`;

  const downloadSvg = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const blob = new Blob([clone.outerHTML], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "card-qr.svg";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2 items-start">
      <section className="card space-y-5">
        <h2 className="text-title inline-flex items-center gap-2">
          <Nfc size={20} /> Program the NFC chip
        </h2>

        <UrlRow label="Write this URL to the chip" url={nfcUrl} />

        <ol className="list-decimal pl-5 space-y-2 text-small text-secondary">
          <li>
            Install a free NFC writer app, e.g. <strong>NFC Tools</strong> (Android / iPhone).
          </li>
          <li>
            Choose <em>Write → Add a record → URL / URI</em> and paste the URL above.
          </li>
          <li>Hold the card to the back of your phone until it confirms the write.</li>
          <li>Test it: tap the card with a different phone. It should open your card.</li>
          <li>
            Optional: once it works, <em>lock</em> the tag in the app so nobody can overwrite
            it. Locking is permanent, but you can still change everything on the card
            from this page because the chip only stores the link.
          </li>
        </ol>

        <p className="text-muted text-xs">
          Most phones read NFC automatically (iPhone XS and newer, and most Android phones
          with NFC turned on). For everyone else, print the QR code.
        </p>

        <a
          href={`${origin}/card`}
          target="_blank"
          rel="noreferrer noopener"
          className="h-control px-4 rounded-control border border-border bg-surface text-small inline-flex items-center gap-2"
        >
          <ExternalLink size={15} /> Open the live card
        </a>
      </section>

      <section className="card space-y-5">
        <h2 className="text-title inline-flex items-center gap-2">
          <QrCode size={20} /> QR code for printing
        </h2>

        <UrlRow label="QR points to" url={qrUrl} />

        <div className="flex flex-col items-center gap-4">
          <div ref={qrRef} className="rounded-2xl bg-white p-5">
            <QRCode value={qrUrl} size={200} level="M" />
          </div>
          <button
            type="button"
            onClick={downloadSvg}
            className="h-control px-4 rounded-control bg-primary text-background text-small inline-flex items-center gap-2"
          >
            <Download size={15} /> Download SVG (print-ready)
          </button>
        </div>

        <p className="text-muted text-xs">
          Put this on the back of the card. SVG stays sharp at any size; keep it at least
          2 cm wide with a white border around it.
        </p>
      </section>
    </div>
  );
}

export default CardSetup;
