import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, Trash2, Copy, MapPin, Bot } from "lucide-react";

import { getVisitorSession, deleteVisitorSession } from "../services/analytics.service";
import SkeletonCard from "../../components/common/SkeletonCard";
import ConfirmModal from "../components/ui/ConfirmModal";
import {
  countryFlag,
  countryName,
  formatLocation,
  formatDuration,
  formatDateTime,
  formatTime,
  timeAgo,
  sectionLabel,
  pageLabel,
  describeReferrer,
  describeEvent,
  eventMeta,
  DEVICE_ICONS,
  SECTION_ORDER,
} from "../components/visitors/visitorFormat";

const TONE_CLASSES = {
  accent: "bg-primary text-background border-primary",
  highlight: "bg-surface border-primary text-primary",
  default: "bg-surface border-border text-primary",
  muted: "bg-surface border-border text-muted",
};

/* ========================================
   DETAIL CARDS
========================================= */

function DetailCard({ title, rows }) {
  const visible = rows.filter((row) => row.value !== undefined && row.value !== null && row.value !== "");

  if (!visible.length) return null;

  return (
    <div className="card">
      <h2 className="text-title mb-4">{title}</h2>

      <dl className="space-y-2.5 text-small">
        {visible.map((row) => (
          <div key={row.label} className="flex justify-between gap-4">
            <dt className="text-muted shrink-0">{row.label}</dt>
            <dd className={`text-right min-w-0 break-words ${row.mono ? "font-mono text-xs" : ""}`}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function StatTile({ label, value }) {
  return (
    <div className="card space-y-1.5">
      <p className="text-small">{label}</p>
      <p className="text-title tabular-nums">{value}</p>
    </div>
  );
}

/* ========================================
   SECTIONS SEEN — total time per section in
   this session, in portfolio order.
========================================= */

function SectionsSeen({ events }) {
  const rows = useMemo(() => {
    const totals = new Map();

    events
      .filter((e) => e.type === "section_view" && e.section)
      .forEach((e) => totals.set(e.section, (totals.get(e.section) || 0) + (e.value || 0)));

    const ordered = [
      ...SECTION_ORDER.filter((id) => totals.has(id)),
      ...[...totals.keys()].filter((id) => !SECTION_ORDER.includes(id)),
    ];

    return ordered.map((id) => ({ id, ms: totals.get(id) }));
  }, [events]);

  const unseen = SECTION_ORDER.filter((id) => !rows.some((row) => row.id === id));
  const max = Math.max(1, ...rows.map((row) => row.ms));

  return (
    <div className="card">
      <h2 className="text-title mb-1">What they looked at</h2>
      <p className="text-muted text-xs mb-5">Time each portfolio section was on screen</p>

      {!rows.length ? (
        <p className="text-body">No sections were viewed long enough to count.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="space-y-1.5">
              <div className="flex justify-between gap-3 text-small">
                <span>{sectionLabel(row.id)}</span>
                <span className="text-muted tabular-nums">{formatDuration(row.ms)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max((row.ms / max) * 100, 3)}%`,
                    backgroundColor: "var(--color-chart-1)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {rows.length > 0 && unseen.length > 0 && (
        <p className="text-muted text-xs mt-5">
          Not reached: {unseen.map(sectionLabel).join(", ")}
        </p>
      )}
    </div>
  );
}

/* ========================================
   JOURNEY TIMELINE
========================================= */

function Timeline({ events, startedAt }) {
  const [showScroll, setShowScroll] = useState(false);

  const visible = showScroll ? events : events.filter((e) => e.type !== "scroll_depth");
  const hiddenCount = events.length - visible.length;

  const offset = (at) => `+${formatDuration(new Date(at) - new Date(startedAt))}`;

  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-title">
          Journey <span className="text-muted text-small tabular-nums">({events.length} events)</span>
        </h2>

        {(hiddenCount > 0 || showScroll) && (
          <label className="inline-flex items-center gap-2 text-small cursor-pointer select-none">
            <input type="checkbox" checked={showScroll} onChange={(e) => setShowScroll(e.target.checked)} />
            Show scroll milestones
          </label>
        )}
      </div>

      {!visible.length ? (
        <p className="text-body">No events recorded for this session.</p>
      ) : (
        <ol className="relative">
          {visible.map((event, index) => {
            const meta = eventMeta(event.type);
            const Icon = meta.icon;
            const isLast = index === visible.length - 1;
            const isPage = event.type === "page_view";

            return (
              <li key={event._id || index} className="relative flex gap-4 pb-5">
                {!isLast && (
                  <span className="absolute left-[15px] top-8 bottom-0 w-px bg-border" aria-hidden />
                )}

                <span
                  className={`relative z-10 h-8 w-8 shrink-0 rounded-full border inline-flex items-center justify-center ${TONE_CLASSES[meta.tone]}`}
                >
                  <Icon size={14} />
                </span>

                <div className="min-w-0 flex-1 pt-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <p className={`text-small ${isPage ? "font-semibold" : ""}`}>
                      <span className="text-muted">{meta.name}</span>{" "}
                      <span className="break-words">{describeEvent(event)}</span>
                    </p>

                    <span
                      className="text-xs text-muted tabular-nums whitespace-nowrap"
                      title={new Date(event.at).toLocaleString()}
                    >
                      {formatTime(event.at)} · {offset(event.at)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-1.5 text-xs">
                    {event.section && event.type !== "section_view" && (
                      <span className="px-2 py-0.5 rounded-full border border-border text-muted">
                        in {sectionLabel(event.section)}
                      </span>
                    )}

                    {event.target && !event.target.startsWith("#") && (
                      <a
                        href={event.target}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-muted underline underline-offset-2 truncate max-w-full"
                      >
                        {event.target}
                      </a>
                    )}

                    {event.meta &&
                      Object.entries(event.meta).map(([key, value]) => (
                        <span key={key} className="px-2 py-0.5 rounded-full bg-surface border border-border">
                          {key}: {String(value)}
                        </span>
                      ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

/* ========================================
   PAGE
========================================= */

function VisitorSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  // Results are keyed by the session they belong to, so navigating between
  // sessions (visit history links) shows the skeleton instead of stale data.
  const [loaded, setLoaded] = useState({ sessionId: null, data: null, notFound: false });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getVisitorSession(sessionId)
      .then((result) => !cancelled && setLoaded({ sessionId, data: result, notFound: false }))
      .catch((error) => {
        if (cancelled) return;
        if (error.response?.status === 404) setLoaded({ sessionId, data: null, notFound: true });
        else toast.error("Failed to load session");
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const isCurrent = loaded.sessionId === sessionId;
  const data = isCurrent ? loaded.data : null;
  const notFound = isCurrent && loaded.notFound;

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteVisitorSession(sessionId);
      toast.success("Session deleted");
      navigate("/dashboard/visitors");
    } catch {
      toast.error("Failed to delete session");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  const copyIp = async (ip) => {
    try {
      await navigator.clipboard.writeText(ip);
      toast.success("IP copied");
    } catch {
      toast.error("Couldn't copy");
    }
  };

  const backLink = (
    <Link to="/dashboard/visitors" className="inline-flex items-center gap-2 text-small text-muted hover:text-primary">
      <ArrowLeft size={16} /> All visitors
    </Link>
  );

  if (notFound) {
    return (
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {backLink}
        <div className="card">
          <p className="text-body">This session doesn&apos;t exist or was deleted.</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return <SkeletonCard />;
  }

  const { session, events, visitor } = data;
  const DeviceIcon = DEVICE_ICONS[session.device] || DEVICE_ICONS.desktop;
  const interactions = events.filter((e) =>
    ["click", "outbound_click", "download", "contact_link", "form_submit"].includes(e.type),
  ).length;
  const [lat, lng] = session.location?.ll || [];

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6">
      {backLink}

      <section className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <span className="text-5xl leading-none" aria-hidden>
            {countryFlag(session.location?.country)}
          </span>

          <div className="min-w-0">
            <h1 className="text-heading break-words">{formatLocation(session.location)}</h1>

            <p className="text-body mt-2 inline-flex flex-wrap items-center gap-x-2 gap-y-1">
              {session.isLive && (
                <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Live
                </span>
              )}
              <span>{formatDateTime(session.startedAt)}</span>
              <span className="text-muted">·</span>
              <DeviceIcon size={15} />
              <span className="capitalize">{session.device}</span>
              {session.isBot && (
                <span className="inline-flex items-center gap-1 text-muted">
                  <Bot size={15} /> bot
                </span>
              )}
              <span className="text-muted">·</span>
              <span>
                {visitor.visitCount > 1 ? `Returning visitor (visit ${visitor.visitCount})` : "First visit"}
              </span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="h-control px-4 rounded-control border border-border bg-surface text-small inline-flex items-center gap-2"
        >
          <Trash2 size={15} /> Delete session
        </button>
      </section>

      <section className="grid gap-4 grid-cols-2 md:grid-cols-5">
        <StatTile label="Time on site" value={formatDuration(session.durationMs)} />
        <StatTile label="Actively viewing" value={formatDuration(session.activeTimeMs)} />
        <StatTile label="Pages" value={session.pageViews} />
        <StatTile label="Interactions" value={interactions} />
        <StatTile label="Max scroll" value={`${session.maxScrollDepth || 0}%`} />
      </section>

      <section className="grid gap-6 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Timeline events={events} startedAt={session.startedAt} />
        </div>

        <div className="space-y-6">
          <SectionsSeen events={events} />

          <DetailCard
            title="Location"
            rows={[
              { label: "City", value: session.location?.city },
              { label: "Region", value: session.location?.region },
              {
                label: "Country",
                value: session.location?.country
                  ? `${countryFlag(session.location.country)} ${countryName(session.location.country)}`
                  : "Unknown",
              },
              { label: "Timezone", value: session.location?.timezone },
              {
                label: "Coordinates",
                value:
                  lat !== undefined ? (
                    <a
                      href={`https://www.google.com/maps?q=${lat},${lng}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 underline underline-offset-2"
                    >
                      <MapPin size={13} /> {lat}, {lng}
                    </a>
                  ) : undefined,
              },
            ]}
          />

          <DetailCard
            title="Network"
            rows={[
              {
                label: "IP address",
                value: session.ip ? (
                  <button
                    type="button"
                    onClick={() => copyIp(session.ip)}
                    className="inline-flex items-center gap-1.5 font-mono text-xs hover:underline"
                    title="Copy IP"
                  >
                    {session.ip} <Copy size={12} />
                  </button>
                ) : undefined,
              },
              { label: "Connection", value: session.connection },
              { label: "Visitor ID", value: session.visitorId, mono: true },
              { label: "Session ID", value: session.sessionId, mono: true },
            ]}
          />

          <DetailCard
            title="Device"
            rows={[
              { label: "Type", value: <span className="capitalize">{session.device}</span> },
              {
                label: "Model",
                value: [session.deviceVendor, session.deviceModel].filter(Boolean).join(" ") || undefined,
              },
              {
                label: "Browser",
                value: [session.browser, session.browserVersion].filter(Boolean).join(" "),
              },
              { label: "OS", value: [session.os, session.osVersion].filter(Boolean).join(" ") },
              { label: "Screen", value: session.screen },
              { label: "Viewport", value: session.viewport },
              { label: "Pixel ratio", value: session.pixelRatio },
              { label: "Touch", value: session.touch === undefined ? undefined : session.touch ? "Yes" : "No" },
              { label: "Theme", value: session.colorScheme },
              { label: "User agent", value: session.userAgent, mono: true },
            ]}
          />

          <DetailCard
            title="Source & context"
            rows={[
              { label: "Came from", value: describeReferrer(session) },
              { label: "Referrer", value: session.referrer, mono: true },
              { label: "Landing URL", value: session.landingUrl, mono: true },
              { label: "UTM source", value: session.utm?.source },
              { label: "UTM medium", value: session.utm?.medium },
              { label: "UTM campaign", value: session.utm?.campaign },
              { label: "UTM term", value: session.utm?.term },
              { label: "UTM content", value: session.utm?.content },
              { label: "Language", value: session.language },
              { label: "Browser timezone", value: session.timezone },
            ]}
          />

          <div className="card">
            <h2 className="text-title mb-1">Visit history</h2>
            <p className="text-muted text-xs mb-4">
              {visitor.visitCount} session{visitor.visitCount === 1 ? "" : "s"} · first seen{" "}
              {formatDateTime(visitor.firstSeenAt)}
            </p>

            <div className="space-y-1">
              {visitor.sessions.map((s) => {
                const current = s.sessionId === session.sessionId;

                return (
                  <Link
                    key={s.sessionId}
                    to={`/dashboard/visitors/${s.sessionId}`}
                    aria-current={current ? "page" : undefined}
                    className={`flex items-center justify-between gap-3 rounded-control px-3 py-2 text-small transition ${
                      current ? "bg-surface border border-border font-medium" : "hover:bg-surface"
                    }`}
                  >
                    <span className="min-w-0 truncate">
                      {timeAgo(s.startedAt)} · {pageLabel(s.entryPage)}
                    </span>
                    <span className="text-muted text-xs tabular-nums shrink-0">
                      {formatDuration(s.durationMs)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete this session?"
        message="The session and all of its journey events will be permanently removed."
        confirmText="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

export default VisitorSession;
