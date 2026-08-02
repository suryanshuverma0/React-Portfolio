import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
} from "recharts";
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
  ArrowRight,
} from "lucide-react";

import { getDashboardSummary, getRecentActivity } from "../services/analytics.service";
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

function KpiCard({ icon: Icon, label, value, accent, trendPercent, trendLabel, live, onClick }) {
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`card glass-hover space-y-4 text-left w-full ${onClick ? "cursor-pointer" : ""}`}
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

      {trendPercent !== undefined && (
        <TrendDelta percent={trendPercent} label={trendLabel} />
      )}
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [summaryData, activityData] = await Promise.all([
          getDashboardSummary(),
          getRecentActivity(10),
        ]);

        setSummary(summaryData);
        setActivity(activityData);
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
  ];

  return (
    <div className="max-w-6xl mx-auto w-full space-y-10">
      {/* Hero */}

      <section>
        <h1 className="text-heading">Dashboard</h1>

        <p className="text-body mt-3">
          Manage your portfolio content, projects, certificates and skills.
        </p>
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
          onClick={() => navigate("/dashboard/analytics")}
        />

        <KpiCard
          icon={Users}
          label="Unique Visitors (30d)"
          value={summary?.uniqueVisitors ?? 0}
          accent={ACCENTS.aqua}
          trendPercent={summary?.trend?.visitorsChangePercent}
          trendLabel="vs prev. 30d"
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

      {/* Views trend */}

      <section className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-title">Views — Last 30 Days</h2>

          <button
            type="button"
            onClick={() => navigate("/dashboard/analytics")}
            className="text-small text-primary hover:opacity-70 transition-opacity inline-flex items-center gap-1"
          >
            Full analytics
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={summary?.viewsByDay || []}>
              <defs>
                <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => value.slice(5)}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />

              <Tooltip />

              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--color-chart-1)"
                strokeWidth={2}
                fill="url(#viewsGradient)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

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

      {/* Recent Activity */}

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

      {/* Quick Actions */}

      <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
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
