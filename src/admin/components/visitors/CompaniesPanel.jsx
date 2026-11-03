import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import SkeletonCard from "../../../components/common/SkeletonCard";
import { getCompanies } from "../../services/analytics.service";
import { countryFlag, countryName, formatDuration, timeAgo, ORG_TYPES } from "./visitorFormat";

/* ========================================
   COMPANIES — organisations whose network
   visitors came from (from the IP lookup).
   Home ISPs and cloud hosts are hidden
   unless "Show all networks" is on.
========================================= */

const sourceLabel = (source) => {
  try {
    return new URL(source).hostname.replace(/^www\./, "");
  } catch {
    return source;
  }
};

function CompaniesPanel({ range }) {
  const [showAll, setShowAll] = useState(false);
  const [loaded, setLoaded] = useState({ key: null, data: null });
  const requestKey = `${range}:${showAll}`;

  useEffect(() => {
    let cancelled = false;

    getCompanies(range, showAll)
      .then((result) => !cancelled && setLoaded({ key: `${range}:${showAll}`, data: result }))
      .catch(() => !cancelled && toast.error("Failed to load companies"));

    return () => {
      cancelled = true;
    };
  }, [range, showAll]);

  const data = loaded.data;
  const loading = loaded.key !== requestKey;

  if (!data) return <SkeletonCard />;

  const notable = data.companies.filter((c) => ["company", "education", "government"].includes(c.type));

  return (
    <div className="space-y-6">
      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          ["Organisations", notable.length, "Company, campus or government networks"],
          ["Companies", data.companies.filter((c) => c.type === "company").length],
          ["Universities", data.companies.filter((c) => c.type === "education").length],
          ["Visits from organisations", notable.reduce((sum, c) => sum + c.sessions, 0)],
        ].map(([label, value, hint]) => (
          <div key={label} className="card space-y-2">
            <p className="text-small">{label}</p>
            <p className="text-heading tabular-nums">{value}</p>
            {hint && <p className="text-muted text-xs">{hint}</p>}
          </div>
        ))}
      </section>

      <section className={`card p-0 overflow-hidden ${loading ? "opacity-60" : ""}`}>
        <div className="p-5 flex flex-wrap items-center gap-3 border-b border-border">
          <div className="mr-auto">
            <h2 className="text-title">Who&apos;s visiting</h2>
            <p className="text-muted text-xs mt-1">
              Based on the visitor&apos;s network owner — someone on a company Wi-Fi or VPN shows up here.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 text-small cursor-pointer select-none">
            <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
            Show all networks
          </label>
        </div>

        {!data.companies.length ? (
          <p className="text-body p-5">
            No organisations yet. Network details are recorded for sessions after the location fix — they&apos;ll
            appear here as people visit.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {data.companies.map((company) => {
              const meta = ORG_TYPES[company.type] || ORG_TYPES.company;
              const Icon = meta.icon;

              return (
                <Link
                  key={company.org}
                  to={`/dashboard/visitors/${company.latestSessionId}`}
                  className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto] items-center hover:bg-surface transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="h-9 w-9 shrink-0 rounded-control border border-border bg-surface inline-flex items-center justify-center">
                      <Icon size={16} aria-label={meta.label} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-small font-medium truncate">{company.org}</p>
                      <p className="text-muted text-xs truncate">
                        {meta.label}
                        {company.asn ? ` · ${company.asn}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0 text-xs">
                    <p className="text-small truncate">
                      {company.places.length
                        ? company.places
                            .map((p) => `${countryFlag(p.country)} ${p.city || countryName(p.country)}`)
                            .join(", ")
                        : "Unknown location"}
                    </p>
                    <p className="text-muted truncate">
                      from {company.sources.length ? company.sources.map(sourceLabel).join(", ") : "Direct"}
                    </p>
                  </div>

                  <div className="text-xs">
                    <p className="text-small tabular-nums">
                      {company.sessions} visit{company.sessions === 1 ? "" : "s"} · {company.visitors} visitor
                      {company.visitors === 1 ? "" : "s"}
                    </p>
                    <p className="text-muted tabular-nums">
                      {company.pageViews} pages · engaged {formatDuration(company.activeTimeMs)} · scrolled{" "}
                      {company.maxScrollDepth || 0}%
                    </p>
                  </div>

                  <p
                    className="text-muted text-xs md:text-right whitespace-nowrap"
                    title={new Date(company.lastSeenAt).toLocaleString()}
                  >
                    {timeAgo(company.lastSeenAt)}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default CompaniesPanel;
