import { useState } from "react";
import { Nfc } from "lucide-react";

import CardEditor from "../components/card/CardEditor";
import CardAnalyticsPanel from "../components/card/CardAnalyticsPanel";
import CardSetup from "../components/card/CardSetup";

const TABS = [
  { id: "editor", label: "Editor" },
  { id: "analytics", label: "Analytics" },
  { id: "setup", label: "NFC & QR setup" },
];

function CardAdmin() {
  const [tab, setTab] = useState("editor");

  return (
    <div className="max-w-7xl mx-auto w-full space-y-8">
      <section>
        <h1 className="text-heading inline-flex items-center gap-3">
          <Nfc size={28} />
          NFC Card
        </h1>
        <p className="text-body mt-3">
          Your digital business card at <code>/card</code>. Tapping your NFC card or scanning its QR code opens it.
        </p>
      </section>

      <div className="flex gap-2 border-b border-border" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-small -mb-px border-b-2 transition ${
              tab === t.id ? "border-primary font-medium" : "border-transparent text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "editor" && <CardEditor />}
      {tab === "analytics" && <CardAnalyticsPanel />}
      {tab === "setup" && <CardSetup />}
    </div>
  );
}

export default CardAdmin;
