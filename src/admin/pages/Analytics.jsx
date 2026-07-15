import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { getAnalyticsOverview } from "../services/analytics.service";
import SkeletonCard from "../../components/common/SkeletonCard";

const rangeOptions = [
  { label: "7 Days", value: 7 },
  { label: "30 Days", value: 30 },
  { label: "90 Days", value: 90 },
];

function Analytics() {
  const [range, setRange] = useState(30);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setLoading(true);

        const data = await getAnalyticsOverview(range);

        setOverview(data);
      } catch {
        toast.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, [range]);

  if (loading && !overview) {
    return <SkeletonCard />;
  }

  const avgPerDay = overview
    ? Math.round((overview.totalViews / range) * 10) / 10
    : 0;

  const kpis = [
    { label: "Total Views", value: overview?.totalViews ?? 0 },
    { label: "Unique Visitors", value: overview?.uniqueVisitors ?? 0 },
    { label: "Avg Views / Day", value: avgPerDay },
  ];

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-heading">Analytics</h1>

          <p className="text-body mt-3">
            Real traffic on your public portfolio.
          </p>
        </div>

        <div className="flex gap-2">
          {rangeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRange(option.value)}
              className={`h-control px-4 rounded-control border border-border text-small transition ${
                range === option.value
                  ? "bg-primary text-background"
                  : "bg-surface"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {kpis.map((item) => (
          <div key={item.label} className="card glass-hover">
            <p className="text-small">{item.label}</p>

            <h2 className="text-heading mt-4">{item.value}</h2>
          </div>
        ))}
      </section>

      <section className="card">
        <h2 className="text-title mb-6">Views Over Time</h2>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={overview?.viewsByDay || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />

              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value.slice(5)}
              />

              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--color-primary, #3b82f6)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card">
        <h2 className="text-title mb-5">Top Pages</h2>

        {overview?.topPages?.length ? (
          <div className="space-y-3">
            {overview.topPages.map((page) => (
              <div
                key={page.path}
                className="flex items-center justify-between gap-4 px-4 py-2 rounded-xl bg-surface border border-border"
              >
                <span className="text-small truncate">{page.path}</span>

                <span className="text-label shrink-0">{page.count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-body">No page views recorded yet.</p>
        )}
      </section>
    </div>
  );
}

export default Analytics;
