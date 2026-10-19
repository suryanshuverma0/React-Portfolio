import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Eye,
  Users,
  Activity,
  FolderKanban,
  Newspaper,
  Award,
  Brain,
  Mail,
  MessageSquare,
  User,
  PenSquare,
  Timer,
  LogOut,
  Nfc,
  NotebookPen,
} from "lucide-react";

import { getDashboardSummary, getRecentActivity, getDashboardInsights } from "../services/analytics.service";
import {
  Sparkline,
  TrafficChart,
  SourcesCard,
  AudienceCard,
  LiveCard,
  NotesPanel,
  SystemCard,
} from "../components/dashboard/DashboardWidgets";
import { formatDuration } from "../components/dashboard/format";
import SkeletonCard from "../../components/common/SkeletonCard";
import TrendDelta from "../components/ui/TrendDelta";

/* ========================================
   Reuses the same fixed chart palette as
   Analytics — nothing new invented, just
   applied more richly (icon badges, accent
   rings) than the old plain KPI tiles.
========================================= */

const ACCENTS = {
  blue: "var(--color-chart-1)",
  orange: "var(--color-chart-2)",
  aqua: "var(--color-chart-3)",
  yellow: "var(--color-chart-4)",
};

const ACTIVITY_META = {
  project: { icon: FolderKanban, accent: ACCENTS.blue },
  certificate: { icon: Award, accent: ACCENTS.yellow },
  blog: { icon: Newspaper, accent: ACCENTS.aqua },
  comment: { icon: MessageSquare, accent: ACCENTS.orange },
  message: { icon: Mail, accent: ACCENTS.orange },
};

const formatRelativeTime = (dateString) => {
  const diffSec = Math.round((Date.now() - new Date(dateString).getTime()) / 1000);

  if (diffSec < 60) return "just now";

  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;

  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 30) return `${diffDay}d ago`;

  const diffMonth = Math.round(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}mo ago`;

  return `${Math.round(diffMonth / 12)}y ago`;
};

/* ========================================
   KPI CARD
========================================= */

function KpiCard({ icon: Icon, label, value, accent, trendPercent, trendLabel, live, onClick, spark, sparkKey, hint }) {
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`card glass-hover flex flex-col justify-start space-y-4 text-left w-full ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-center justify-between">
        <span
          className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0"
          style={{
            backgroundColor: `color-mix(in srgb, ${accent} 16%, transparent)`,
            color: accent,
          }}
        >
          <Icon size={18} strokeWidth={2} />
        </span>

        {live && (
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
        )}
      </div>

      <div>
        <p className="text-small">{label}</p>
        <h2 className="text-heading mt-1">{value}</h2>
      </div>

      {(trendPercent !== undefined || hint) && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {trendPercent !== undefined && <TrendDelta percent={trendPercent} label={trendLabel} />}
          {hint && <span className="text-xs text-muted">{hint}</span>}
        </div>
      )}

      {spark?.length > 1 && <Sparkline data={spark} dataKey={sparkKey} color={accent} />}
    </Wrapper>
  );
}

/* ========================================
   ATTENTION CARD
   Only visually pops (colored ring + badge)
   once there's actually something to do —
   zero is a quiet "all caught up" state.
========================================= */

function AttentionCard({ icon: Icon, label, count, actionLabel, onClick }) {
  const needsAttention = count > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`card glass-hover text-left w-full flex items-center gap-4 ${
        needsAttention ? "ring-1 ring-red-500/40" : ""
      }`}
    >
      <span
        className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${
          needsAttention ? "bg-red-500/12 text-red-500" : "bg-surface text-muted"
        }`}
      >
        <Icon size={18} strokeWidth={2} />
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-label">{label}</p>
        <p className="text-small mt-0.5">
          {needsAttention ? `${count} ${actionLabel}` : "All caught up"}
        </p>
      </div>

      {needsAttention && (
        <span className="h-6 min-w-6 px-1.5 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center shrink-0">
          {count}
        </span>
      )}
    </button>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [activity, setActivity] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [summaryData, activityData, insightsData] = await Promise.all([
          getDashboardSummary(),
          getRecentActivity(10),
          // Additive: the dashboard still renders if this fails.
          getDashboardInsights().catch(() => null),
        ]);

        setSummary(summaryData);
        setActivity(activityData);
        setInsights(insightsData);
      } catch {
        toast.error("Failed to load dashboard summary");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <SkeletonCard />;
  }

  const quickActions = [
    {
      title: "Update Profile",
      description: "Manage personal information.",
      path: "/dashboard/profile",
      icon: User,
    },
    {
      title: "Add Project",
      description: "Publish a new project.",
      path: "/dashboard/projects",
      icon: FolderKanban,
    },
    {
      title: "Add Certificate",
      description: "Showcase achievements.",
      path: "/dashboard/certificates",
      icon: Award,
    },
    {
      title: "Write Blog Post",
      description: "Share something new.",
      path: "/dashboard/blog/new",
      icon: PenSquare,
    },
    {
      title: "Open Notes",
      description: "Type or write with your pen.",
      path: "/dashboard/notes",
      icon: NotebookPen,
    },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const v = insights?.visitors;
  const sessions7d = v?.sources?.reduce((t, src) => t + src.count, 0) ?? 0;

  return (
    <div className="max-w-6xl mx-auto w-full space-y-10">
      {/* Hero */}

      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-small">{today}</p>
          <h1 className="text-heading mt-1">{greeting}</h1>
          <p className="text-body mt-3">
            Here&apos;s how your portfolio, card and notes are doing.
          </p>
        </div>

        {insights && (
          <button
            type="button"
            onClick={() => navigate("/dashboard/visitors")}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-small"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            {insights.live.length} live now
          </button>
        )}
      </section>

      {/* Traffic KPIs */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Eye}
          label="Views (30d)"
          value={summary?.totalViews ?? 0}
          accent={ACCENTS.blue}
          trendPercent={summary?.trend?.viewsChangePercent}
          trendLabel="vs prev. 30d"
          spark={summary?.viewsByDay}
          sparkKey="count"
          onClick={() => navigate("/dashboard/analytics")}
        />

        <KpiCard
          icon={Users}
          label="Unique Visitors (30d)"
          value={summary?.uniqueVisitors ?? 0}
          accent={ACCENTS.aqua}
          trendPercent={summary?.trend?.visitorsChangePercent}
          trendLabel="vs prev. 30d"
          spark={v?.daily}
          sparkKey="visitors"
          onClick={() => navigate("/dashboard/analytics")}
        />

        <KpiCard
          icon={Activity}
          label="Active Now"
          value={summary?.activeNow ?? 0}
          accent={ACCENTS.orange}
          live
          onClick={() => navigate("/dashboard/analytics")}
        />

        <KpiCard
          icon={Eye}
          label="Views Today"
          value={summary?.viewsToday ?? 0}
          accent={ACCENTS.yellow}
          onClick={() => navigate("/dashboard/analytics")}
        />
      </section>

      {/* Engagement KPIs */}

      {v && (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            icon={Activity}
            label="Sessions Today"
            value={v.sessionsToday}
            accent={ACCENTS.blue}
            trendPercent={v.sessionsTodayChange}
            trendLabel="vs yesterday"
            spark={v.daily.slice(-14)}
            sparkKey="sessions"
            onClick={() => navigate("/dashboard/visitors")}
          />

          <KpiCard
            icon={Timer}
            label="Avg. Time on Site (7d)"
            value={formatDuration(v.avgDurationMs)}
            accent={ACCENTS.aqua}
            trendPercent={v.avgDurationChange}
            trendLabel="vs prev. 7d"
            spark={v.daily.slice(-14)}
            sparkKey="avgDurationMs"
            onClick={() => navigate("/dashboard/analytics")}
          />

          <KpiCard
            icon={LogOut}
            label="Bounce Rate (7d)"
            value={`${v.bounceRate}%`}
            accent={ACCENTS.orange}
            trendPercent={v.bounceRateDelta}
            trendLabel="pts better vs prev. 7d"
            spark={v.daily.slice(-14).map((d) => ({ ...d, bounceRate: d.bounceRate ?? 0 }))}
            sparkKey="bounceRate"
            onClick={() => navigate("/dashboard/analytics")}
          />

          <KpiCard
            icon={Nfc}
            label="Card Opens (7d)"
            value={insights.card.opens7d}
            accent={ACCENTS.yellow}
            trendPercent={insights.card.opensChange}
            trendLabel="vs prev. 7d"
            hint={`${insights.card.saves7d} saved contact`}
            spark={insights.card.daily}
            sparkKey="opens"
            onClick={() => navigate("/dashboard/card")}
          />
        </section>
      )}

      {/* Traffic trend */}

      <TrafficChart viewsByDay={summary?.viewsByDay} daily={v?.daily} />

      {v && (
        <section className="grid gap-6 lg:grid-cols-3">
          <SourcesCard sources={v.sources} total={sessions7d} />
          <AudienceCard devices={v.devices} countries={v.countries} />
          <LiveCard live={insights.live} />
        </section>
      )}

      {/* Notes */}

      {insights?.notes && <NotesPanel notes={insights.notes} />}

      {/* Content counts */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={FolderKanban}
          label="Projects"
          value={summary?.projects ?? 0}
          accent={ACCENTS.blue}
          onClick={() => navigate("/dashboard/projects")}
        />

        <KpiCard
          icon={Newspaper}
          label="Blog Posts"
          value={summary?.posts ?? 0}
          accent={ACCENTS.aqua}
          onClick={() => navigate("/dashboard/blog")}
        />

        <KpiCard
          icon={Award}
          label="Certificates"
          value={summary?.certificates ?? 0}
          accent={ACCENTS.yellow}
          onClick={() => navigate("/dashboard/certificates")}
        />

        <KpiCard
          icon={Brain}
          label="Skills"
          value={summary?.skills ?? 0}
          accent={ACCENTS.orange}
          onClick={() => navigate("/dashboard/skill")}
        />
      </section>

      {/* Needs attention */}

      <section className="grid gap-4 sm:grid-cols-2">
        <AttentionCard
          icon={Mail}
          label="Messages"
          count={summary?.unreadMessages ?? 0}
          actionLabel="unread"
          onClick={() => navigate("/dashboard/messages")}
        />

        <AttentionCard
          icon={MessageSquare}
          label="Blog Comments"
          count={summary?.pendingComments ?? 0}
          actionLabel="awaiting approval"
          onClick={() => navigate("/dashboard/blog/comments")}
        />
      </section>

      {/* Recent Activity + System */}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start">
      <section className="card space-y-1">
        <div className="mb-3">
          <h2 className="text-title">Recent Activity</h2>

          <p className="text-small mt-2">
            Latest changes across your portfolio.
          </p>
        </div>

        {activity.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-body">No recent activity yet.</p>
          </div>
        ) : (
          <div>
            {activity.map((item) => {
              const meta = ACTIVITY_META[item.type] || ACTIVITY_META.project;
              const Icon = meta.icon;

              return (
                <button
                  key={`${item.type}-${item.id}`}
                  type="button"
                  onClick={() => navigate(item.link)}
                  className="w-full flex items-center gap-4 py-3 border-b border-border/50 last:border-0 text-left hover:opacity-80 transition-opacity"
                >
                  <span
                    className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${meta.accent} 16%, transparent)`,
                      color: meta.accent,
                    }}
                  >
                    <Icon size={15} strokeWidth={2} />
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-label truncate">{item.title}</p>
                    <p className="text-small truncate">{item.detail}</p>
                  </div>

                  <span className="text-muted text-xs shrink-0 tabular-nums">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {insights && <SystemCard storage={insights.storage} card={insights.card} />}
      </div>

      {/* Quick Actions */}

      <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {quickActions.map((action) => (
          <button
            key={action.title}
            type="button"
            onClick={() => navigate(action.path)}
            className="card text-left glass-hover space-y-3"
          >
            <span className="h-10 w-10 rounded-2xl bg-surface flex items-center justify-center">
              <action.icon size={18} strokeWidth={2} />
            </span>

            <div>
              <h3 className="text-label">{action.title}</h3>
              <p className="text-small mt-1">{action.description}</p>
            </div>
          </button>
        ))}
      </section>
    </div>
  );
}

export default Dashboard;
