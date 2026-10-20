import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileBarChart, ArrowRight, CircleAlert } from "lucide-react";

import { getExecutiveReport } from "../../services/automation.service";

/* ========================================
   Dashboard teaser for the executive report:
   this week's health score, the top
   highlights and how many items need you.
========================================= */

const GRADE_COLORS = { Excellent: "#059669", Good: "#2a78d6", Fair: "#d97706", "Needs attention": "#dc2626" };

function ReportSummaryCard() {
  const [report, setReport] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getExecutiveReport("week")
      .then((r) => !cancelled && setReport(r))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!report) return null;

  const { score, grade } = report.health;
  const color = GRADE_COLORS[grade] || "var(--color-chart-1)";
  const r = 30;
  const c = 2 * Math.PI * r;
  const urgent = report.actions.filter((a) => a.level === "high").length;

  return (
    <section className="card">
      <div className="flex flex-wrap items-center gap-6">
        <div className="relative h-20 w-20 shrink-0" role="img" aria-label={`Health score ${score} of 100`}>
          <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
            <circle cx="36" cy="36" r={r} fill="none" stroke="var(--color-surface)" strokeWidth="7" />
            <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(score / 100) * c} ${c}`} />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-title tabular-nums">{score}</span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-small inline-flex items-center gap-2">
            <FileBarChart size={15} /> This week&apos;s report ·{" "}
            <span className="font-medium" style={{ color }}>
              {grade}
            </span>
          </p>
          <ul className="mt-2 space-y-1">
            {report.highlights.slice(0, 3).map((h) => (
              <li key={h} className="truncate text-small text-primary">
                {h}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-end gap-2">
          {report.actions.length > 0 && (
            <span className={`inline-flex items-center gap-1.5 text-xs ${urgent ? "text-red-500" : "text-amber-600"}`}>
              <CircleAlert size={13} /> {report.actions.length} item{report.actions.length === 1 ? "" : "s"} need attention
            </span>
          )}
          <Link to="/dashboard/report" className="h-control px-4 rounded-control bg-primary text-background text-small font-medium inline-flex items-center gap-2">
            Full report <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default ReportSummaryCard;
