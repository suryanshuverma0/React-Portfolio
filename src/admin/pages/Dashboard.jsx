import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { getDashboardSummary } from "../services/analytics.service";
import SkeletonCard from "../../components/common/SkeletonCard";

function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const data = await getDashboardSummary();

        setSummary(data);
      } catch {
        toast.error("Failed to load dashboard summary");
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  if (loading) {
    return <SkeletonCard />;
  }

  const stats = [
    { label: "Projects", value: summary?.projects ?? 0 },
    { label: "Skills", value: summary?.skills ?? 0 },
    { label: "Certificates", value: summary?.certificates ?? 0 },
    { label: "Views (30d)", value: summary?.totalViews ?? 0 },
  ];

  const quickActions = [
    {
      title: "Update Profile",
      description: "Manage personal information.",
      path: "/dashboard/profile",
    },
    {
      title: "Add Project",
      description: "Publish a new project.",
      path: "/dashboard/projects",
    },
    {
      title: "Add Certificate",
      description: "Showcase achievements.",
      path: "/dashboard/certificates",
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

      {/* Stats */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="card glass-hover">
            <p className="text-small">{item.label}</p>

            <h2 className="text-heading mt-4">{item.value}</h2>
          </div>
        ))}
      </section>

      {/* Recent Activity */}

      <section className="card space-y-4">
        <div>
          <h2 className="text-title">Recent Activity</h2>

          <p className="text-small mt-2">
            Latest changes across your portfolio.
          </p>
        </div>

        <div className="py-8 text-center">
          <p className="text-body">No recent activity yet.</p>
        </div>
      </section>

      {/* Quick Actions */}

      <section className="grid gap-4 md:grid-cols-3">
        {quickActions.map((action) => (
          <button
            key={action.title}
            type="button"
            onClick={() => navigate(action.path)}
            className="card text-left glass-hover"
          >
            <h3 className="text-label">{action.title}</h3>

            <p className="text-small mt-2">{action.description}</p>
          </button>
        ))}
      </section>
    </div>
  );
}

export default Dashboard;
