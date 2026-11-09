import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ScatterChart,
  Scatter,
  ZAxis,
  LabelList,
} from "recharts";
import {
  Newspaper,
  Eye,
  Users,
  Timer,
  ScrollText,
  MessageSquare,
  Clock3,
  CheckCircle2,
  Percent,
  FileText,
  Download,
  ArrowUpDown,
  ExternalLink,
} from "lucide-react";

import SkeletonCard from "../../components/common/SkeletonCard";
import TrendDelta from "../components/ui/TrendDelta";
import { Panel, Legend, ChartTooltip, Donut, RankBars, WeekHourHeatmap, Empty } from "../components/charts/ChartKit";
import { AXIS_TICK, GRID, SERIES, MUTED, formatDay } from "../components/charts/chartTokens";
import { getBlogAnalytics } from "../services/automation.service";
import { KpiCard, RangeTabs } from "../components/charts/Visuals";
import { countryFlag, countryName, formatDuration, compactNumber } from "../components/dashboard/format";

/* ========================================
   BLOG & COMMENTS ANALYTICS
   Reach, reading quality, sources and
   audience, content cadence and every
   comment metric — plus a sortable,
   exportable per-post table.
========================================= */

const RANGES = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
  { label: "1 year", value: 365 },
];

const SOURCE_COLORS = { Direct: SERIES[0], Search: SERIES[1], Social: SERIES[2], Referral: SERIES[3], Card: MUTED };
const STATUS_COLORS = { Approved: "#059669", Pending: "#d97706" };

const COLUMNS = [
  ["title", "Post"],
  ["views", "Views"],
  ["viewsChange", "Δ"],
  ["readers", "Readers"],
  ["avgTimeMs", "Avg time"],
  ["readRatio", "Read %"],
  ["avgScroll", "Scroll"],
  ["completionRate", "Finish"],
  ["comments", "Comments"],
  ["engagementRate", "Comments / 100 views"],
];

const toCsv = (rows) => {
  const header = ["Title", "Slug", "Status", "Published", "Words", "Views", "Views change %", "Readers", "Avg time (s)", "Read ratio %", "Avg scroll %", "Completion %", "Clicks", "Comments", "Pending", "Comments per 100 views", "Tags"];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [
    header.map(esc).join(","),
    ...rows.map((p) =>
      [p.title, p.slug, p.status, p.publishedAt ? new Date(p.publishedAt).toISOString().slice(0, 10) : "", p.words, p.views, p.viewsChange, p.readers, Math.round(p.avgTimeMs / 1000), p.readRatio, p.avgScroll, p.completionRate, p.clicks, p.comments, p.pendingComments, p.engagementRate, p.tags.join(" ")]
        .map(esc)
        .join(","),
    ),
  ].join("\n");
};

function PostsTable({ posts }) {
  const [sort, setSort] = useState({ key: "views", dir: -1 });
  const sorted = useMemo(
    () =>
      [...posts].sort((a, b) => {
        const av = a[sort.key];
        const bv = b[sort.key];
        return (typeof av === "string" ? av.localeCompare(bv) : (av || 0) - (bv || 0)) * sort.dir;
      }),
    [posts, sort],
  );

  const exportCsv = () => {
    const blob = new Blob([toCsv(sorted)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `blog-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Panel
      title="Every post"
      subtitle="Click a column to sort · Read % = time spent vs expected reading time · Finish = scrolled to 90%+"
      right={
        <button type="button" onClick={exportCsv} className="h-control px-4 rounded-control border border-border bg-surface text-small inline-flex items-center gap-2">
          <Download size={15} /> Export CSV
        </button>
      }
    >
      {!posts.length ? (
        <Empty>No posts yet.</Empty>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full min-w-[920px] text-small">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                {COLUMNS.map(([key, label]) => (
                  <th key={key} className={`px-2 py-2 font-normal ${key === "title" ? "" : "text-right"}`}>
                    <button
                      type="button"
                      onClick={() => setSort((s) => ({ key, dir: s.key === key ? -s.dir : key === "title" ? 1 : -1 }))}
                      className={`inline-flex items-center gap-1 ${sort.key === key ? "text-primary font-medium" : ""}`}
                    >
                      {label} <ArrowUpDown size={11} />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p._id} className="border-b border-border last:border-b-0">
                  <td className="max-w-[280px] px-2 py-2.5">
                    <p className="truncate font-medium">{p.title}</p>
                    <p className="text-xs text-muted">
                      <span className={p.status === "published" ? "text-emerald-600 dark:text-emerald-400" : ""}>{p.status}</span>
                      {p.publishedAt ? ` · ${new Date(p.publishedAt).toLocaleDateString()}` : ""} · {p.words} words
                      {p.status === "published" && (
                        <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer noopener" className="ml-1 inline-flex items-center" aria-label="Open post">
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </p>
                  </td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{p.views}</td>
                  <td className="px-2 py-2.5 text-right">
                    <TrendDelta percent={p.viewsChange} label="" />
                  </td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{p.readers}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{p.avgTimeMs ? formatDuration(p.avgTimeMs) : "—"}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{p.readRatio ? `${p.readRatio}%` : "—"}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{p.avgScroll ? `${p.avgScroll}%` : "—"}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{p.completionRate ? `${p.completionRate}%` : "—"}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">
                    {p.comments}
                    {p.pendingComments > 0 && <span className="ml-1 text-xs text-amber-600">({p.pendingComments} pending)</span>}
                  </td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{p.engagementRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

/* ---------- post performance (bubble) ---------- */

function BubbleTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="max-w-64 space-y-1 rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-xl">
      <p className="font-medium leading-snug">{p.title}</p>
      <p className="flex justify-between gap-4"><span className="text-muted">Views</span><span className="tabular-nums">{p.views}</span></p>
      <p className="flex justify-between gap-4"><span className="text-muted">Read to the end</span><span className="tabular-nums">{p.completionRate}%</span></p>
      <p className="flex justify-between gap-4"><span className="text-muted">Avg scroll</span><span className="tabular-nums">{p.avgScroll}%</span></p>
      <p className="flex justify-between gap-4"><span className="text-muted">Length</span><span className="tabular-nums">{p.words.toLocaleString()} words</span></p>
    </div>
  );
}

// Reach (x) against depth (y): top-right posts are both found and finished;
// top-left ones deserve more promotion, bottom-right ones a rewrite.
function PostPerformance({ posts }) {
  const points = posts
    .filter((p) => p.views > 0)
    .map((p) => ({ ...p, words: p.words || 0, short: p.title.length > 26 ? `${p.title.slice(0, 25)}…` : p.title }));
  return (
    <Panel
      title="Post performance map"
      subtitle="Reach vs. how far people read · bubble size = post length · hover for details"
    >
      {!points.length ? (
        <Empty>Posts appear here once they get views in this period.</Empty>
      ) : (
        <>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 12, right: 16, left: -12, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis type="number" dataKey="views" name="Views" tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} label={{ value: "Views →", position: "insideBottomRight", offset: -2, fill: "var(--color-muted)", fontSize: 11 }} />
                <YAxis type="number" dataKey="completionRate" name="Read to the end" domain={[0, 100]} tick={AXIS_TICK} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                <ZAxis type="number" dataKey="words" range={[120, 900]} name="Words" />
                <Tooltip content={<BubbleTooltip />} cursor={{ strokeDasharray: "3 3", stroke: "var(--color-border-strong)" }} />
                <Scatter data={points} fill={SERIES[0]} fillOpacity={0.55} stroke={SERIES[0]} strokeWidth={2}>
                  {/* Direct labels while there are few enough posts to read them */}
                  {points.length <= 8 && <LabelList dataKey="short" position="right" offset={12} style={{ fill: "var(--color-secondary)", fontSize: 11 }} />}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid gap-2 text-xs text-muted sm:grid-cols-3">
            <p><span className="font-medium text-primary">Top right</span> — found and finished. Your best work.</p>
            <p><span className="font-medium text-primary">Top left</span> — finished by few. Worth promoting.</p>
            <p><span className="font-medium text-primary">Bottom right</span> — clicked, then left. Tighten the intro.</p>
          </div>
        </>
      )}
    </Panel>
  );
}

function BlogAnalytics() {
  const navigate = useNavigate();
  const [range, setRange] = useState(30);
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getBlogAnalytics(range)
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && toast.error("Couldn't load blog analytics"));
    return () => {
      cancelled = true;
    };
  }, [range]);

  if (!data) return <SkeletonCard />;
  const t = data.totals;
  const vsLabel = `vs prev. ${range === 365 ? "year" : `${range}d`}`;
  const topPosts = data.posts.filter((p) => p.views).slice(0, 8);
  const quality = data.posts.filter((p) => p.readers).slice(0, 8);

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-heading inline-flex items-center gap-3">
            <Newspaper size={28} /> Blog analytics
          </h1>
          <p className="text-body mt-3">How your writing is read, shared and discussed.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <RangeTabs value={range} onChange={setRange} options={RANGES} />
        </div>
      </section>

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard index={0} icon={Eye} label="Post views" value={t.views} delta={t.viewsChange} deltaLabel={vsLabel} accent={SERIES[0]} hint={`Plus ${t.indexViews} views of the /blog index`} />
        <KpiCard index={1} icon={Users} label="Readers" value={t.readers} accent={SERIES[2]} hint={`${t.newReaderShare}% are new readers`} />
        <KpiCard index={2} icon={Timer} label="Avg. read time" value={t.avgTimeMs} format={formatDuration} accent={SERIES[1]} hint={`Posts average ${t.avgReadingTime} min to read`} />
        <KpiCard index={3} icon={ScrollText} label="Read to the end" value={t.completionRate} format={(v) => `${Math.round(v)}%`} gauge={t.completionRate} accent={SERIES[3]} hint={`Average scroll ${t.avgScroll}%`} />
        <KpiCard index={4} icon={MessageSquare} label="Comments" value={t.commentsInRange} delta={t.commentsChange} deltaLabel={vsLabel} spark={data.daily} sparkKey="comments" accent={SERIES[0]} hint={`${t.comments} all time`} />
        <KpiCard
          index={5}
          icon={Clock3}
          label="Awaiting approval"
          value={t.pending}
          accent={t.pending ? "#d97706" : SERIES[2]}
          hint={t.pending ? "Needs moderation" : "All caught up"}
          onClick={t.pending ? () => navigate("/dashboard/blog/comments") : undefined}
        />
        <KpiCard index={6} icon={CheckCircle2} label="Approval rate" value={t.approvalRate} format={(v) => `${Math.round(v)}%`} gauge={t.approvalRate} accent={SERIES[2]} hint={`${t.commenters} commenters`} />
        <KpiCard index={7} icon={Percent} label="Comments / 100 views" value={Number(t.commentsPer100Views) || 0} format={(v) => (Math.round(v * 10) / 10).toFixed(1)} accent={SERIES[1]} hint={`About ${t.avgCommentWords} words each`} />
      </section>

      {/* Content inventory */}
      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          ["Published", t.published],
          ["Drafts", t.drafts],
          ["Words written", compactNumber(t.totalWords)],
          ["Avg. post length", `${t.avgWords} words`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-border bg-surface/50 p-4">
            <p className="text-small">{label}</p>
            <p className="text-title mt-1 tabular-nums">{value}</p>
          </div>
        ))}
      </section>

      {/* Trends */}
      <Panel
        title="Readership over time"
        subtitle="Daily blog views and unique readers"
        right={
          <Legend
            items={[
              { label: "Views", color: SERIES[0], value: data.daily.reduce((s, d) => s + d.views, 0) },
              { label: "Readers", color: SERIES[1] },
            ]}
          />
        }
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.daily} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="date" tick={AXIS_TICK} tickFormatter={formatDay} axisLine={false} tickLine={false} minTickGap={28} />
              <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip labelFormatter={formatDay} />} cursor={{ stroke: MUTED, strokeDasharray: "3 3" }} />
              <Line type="monotone" dataKey="views" name="Views" stroke={SERIES[0]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="readers" name="Readers" stroke={SERIES[1]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Top posts" subtitle="By views in this period">
          {!topPosts.length ? (
            <Empty />
          ) : (
            <div style={{ height: Math.max(160, topPosts.length * 38) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topPosts} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="title" width={150} tick={{ ...AXIS_TICK, fill: "var(--color-primary)" }} tickFormatter={(v) => (v.length > 22 ? `${v.slice(0, 21)}…` : v)} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-surface)" }} />
                  <Bar dataKey="views" name="Views" fill={SERIES[0]} radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Comments per day" subtitle="New comments received">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.daily} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis dataKey="date" tick={AXIS_TICK} tickFormatter={formatDay} axisLine={false} tickLine={false} minTickGap={28} />
                <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip labelFormatter={formatDay} />} cursor={{ fill: "var(--color-surface)" }} />
                <Bar dataKey="comments" name="Comments" fill={SERIES[2]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </section>

      {/* Reading quality */}
      <Panel
        title="Reading quality"
        subtitle="How much of each post people actually read (both in %)"
        right={
          <Legend
            items={[
              { label: "Read to the end", color: SERIES[0] },
              { label: "Avg scroll depth", color: SERIES[1] },
            ]}
          />
        }
      >
        {!quality.length ? (
          <Empty>Reading data appears once people read your posts.</Empty>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quality} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis dataKey="title" tick={AXIS_TICK} tickFormatter={(v) => (v.length > 14 ? `${v.slice(0, 13)}…` : v)} axisLine={false} tickLine={false} interval={0} />
                <YAxis domain={[0, 100]} tick={AXIS_TICK} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip valueFormatter={(v) => `${v}%`} />} cursor={{ fill: "var(--color-surface)" }} />
                <Bar dataKey="completionRate" name="Read to the end" fill={SERIES[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgScroll" name="Avg scroll depth" fill={SERIES[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      <PostPerformance posts={data.posts} />

      {/* Audience */}
      <section className="grid gap-6 lg:grid-cols-3">
        <Panel title="Where readers come from">
          <Donut data={data.sources} colorFor={(d) => SOURCE_COLORS[d.label] || MUTED} totalLabel="sessions" />
        </Panel>
        <Panel title="Devices">
          <Donut data={data.devices.map((d) => ({ label: d.device, count: d.count }))} colorFor={(d, i) => SERIES[i] || MUTED} totalLabel="sessions" />
        </Panel>
        <Panel title="New vs returning">
          <Donut
            data={[
              { label: "New", count: data.newVsReturning.new },
              { label: "Returning", count: data.newVsReturning.returning },
            ].filter((d) => d.count)}
            colorFor={(d) => (d.label === "New" ? SERIES[0] : SERIES[1])}
            totalLabel="readers"
          />
        </Panel>
      </section>

      <Panel title="When people read" subtitle="Post views by weekday and hour">
        <WeekHourHeatmap cells={data.heatmap} timezone={data.timezone} />
      </Panel>

      <section className="grid gap-6 lg:grid-cols-3">
        <Panel title="Countries">
          <RankBars items={data.countries.map((c) => ({ key: c.country, label: `${countryFlag(c.country)} ${countryName(c.country)}`, value: c.count }))} />
        </Panel>
        <Panel title="Referring sites">
          <RankBars items={data.referrers.map((r) => ({ key: r.host, label: r.host, value: r.count }))} />
        </Panel>
        <Panel title="Clicked from posts">
          <RankBars items={data.clicks.map((c) => ({ key: c.label, label: c.label, value: c.count }))} />
        </Panel>
      </section>

      {/* Content */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Publishing cadence"
          subtitle="Posts published and comments received, last 12 months"
          right={
            <Legend
              items={[
                { label: "Posts", color: SERIES[0] },
                { label: "Comments", color: SERIES[2] },
              ]}
            />
          }
        >
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.cadence} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis dataKey="month" tick={AXIS_TICK} tickFormatter={formatDay} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip labelFormatter={formatDay} />} cursor={{ fill: "var(--color-surface)" }} />
                <Bar dataKey="published" name="Posts" fill={SERIES[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="comments" name="Comments" fill={SERIES[2]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Tags" subtitle="Views per tag (a post counts for each of its tags)">
          <RankBars items={data.tags.map((t) => ({ key: t.tag, label: `#${t.tag}`, value: t.views, posts: t.posts }))} format={(v, item) => `${v} · ${item.posts} posts`} />
        </Panel>
      </section>

      {/* Comments */}
      <section className="grid gap-6 lg:grid-cols-3">
        <Panel title="Comment status">
          <Donut data={data.comments.status.filter((s) => s.count)} colorFor={(d) => STATUS_COLORS[d.label]} totalLabel="comments" />
        </Panel>
        <Panel title="Comment length">
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.comments.lengthBuckets} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-surface)" }} />
                <Bar dataKey="count" name="Comments" fill={SERIES[3]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Most discussed">
          <RankBars items={data.comments.byPost.map((p) => ({ key: p.title, label: p.title, value: p.comments, pending: p.pending }))} format={(v, item) => (item.pending ? `${v} · ${item.pending} pending` : v)} color={SERIES[2]} />
        </Panel>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Top commenters" subtitle="All time">
          {!data.comments.topCommenters.length ? (
            <Empty>No comments yet.</Empty>
          ) : (
            <table className="w-full text-small">
              <tbody>
                {data.comments.topCommenters.map((c) => (
                  <tr key={c.email || c.name} className="border-b border-border last:border-b-0">
                    <td className="py-2.5 pr-3">
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted">{c.email}</p>
                    </td>
                    <td className="py-2.5 text-right tabular-nums">
                      {c.count} <span className="text-xs text-muted">({c.approved} approved)</span>
                    </td>
                    <td className="py-2.5 pl-3 text-right text-xs text-muted whitespace-nowrap">{new Date(c.last).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel
          title="Recent comments"
          right={
            <Link to="/dashboard/blog/comments" className="text-small inline-flex items-center gap-1 hover:opacity-70">
              Moderate <ExternalLink size={13} />
            </Link>
          }
        >
          {!data.comments.recent.length ? (
            <Empty>No comments yet.</Empty>
          ) : (
            <ul className="space-y-3">
              {data.comments.recent.map((c) => (
                <li key={c._id} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-medium">{c.name}</span>
                    <span className={c.isApproved ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600"}>{c.isApproved ? "Approved" : "Pending"}</span>
                  </div>
                  <p className="mt-1 text-small line-clamp-2">{c.content}</p>
                  <p className="mt-1 text-xs text-muted inline-flex items-center gap-1">
                    <FileText size={11} /> {c.post} · {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>

      <PostsTable posts={data.posts} />
    </div>
  );
}

export default BlogAnalytics;
