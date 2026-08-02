import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FolderGit2, Star, Users, Trophy, ExternalLink } from "lucide-react";

import Container from "../../ui/Container";
import SectionTitle from "../../ui/SectionTitle";

import { getIntegrationsStatus } from "../../../services/public.integrations.service";

/* ========================================
   Difficulty bar colors reuse the same
   chart palette used in the admin analytics
   dashboard — nothing new invented.
========================================= */

const DIFFICULTY_COLORS = {
  Easy: "var(--color-chart-3)",
  Medium: "var(--color-chart-4)",
  Hard: "var(--color-chart-2)",
};

function StatPill({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2.5">
      <Icon size={15} className="text-muted shrink-0" />
      <span className="text-label">{value}</span>
      <span className="text-muted text-sm">{label}</span>
    </div>
  );
}

function GitHubCard({ data }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="card h-full flex flex-col"
    >
      <div className="flex items-center gap-2 mb-6">
        <div className="h-2 w-2 rounded-full bg-blue-500" />
        <h3 className="text-title">GitHub</h3>
      </div>

      <div className="flex items-center gap-4 mb-6">
        {data.avatarUrl && (
          <img
            src={data.avatarUrl}
            alt={data.username}
            loading="lazy"
            className="h-14 w-14 rounded-2xl border border-border object-cover"
          />
        )}

        <div className="min-w-0">
          <p className="text-label truncate">{data.name || data.username}</p>
          {data.bio && <p className="text-small truncate mt-0.5">{data.bio}</p>}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <StatPill icon={FolderGit2} label="repos" value={data.publicRepos} />
        <StatPill icon={Users} label="followers" value={data.followers} />
        <StatPill icon={Star} label="stars" value={data.totalStars} />
      </div>

      {data.topRepos?.length > 0 && (
        <div className="space-y-3 mb-6 flex-1">
          {data.topRepos.slice(0, 4).map((repo) => (
            <a
              key={repo.name}
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3 transition hover:border-primary/40"
            >
              <div className="min-w-0">
                <p className="text-label truncate">{repo.name}</p>
                {repo.language && (
                  <p className="text-muted text-xs mt-0.5">{repo.language}</p>
                )}
              </div>

              <span className="text-muted text-xs inline-flex items-center gap-1 shrink-0">
                <Star size={12} />
                {repo.stars}
              </span>
            </a>
          ))}
        </div>
      )}

      <a
        href={data.profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto h-control px-control rounded-control bg-primary text-background text-label inline-flex items-center justify-center gap-2 transition hover:opacity-90"
      >
        View GitHub
        <ExternalLink size={15} />
      </a>
    </motion.div>
  );
}

function LeetCodeCard({ data }) {
  const breakdown = [
    { label: "Easy", count: data.easySolved },
    { label: "Medium", count: data.mediumSolved },
    { label: "Hard", count: data.hardSolved },
  ];

  const max = Math.max(...breakdown.map((d) => d.count), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: 0.08 }}
      className="card h-full flex flex-col"
    >
      <div className="flex items-center gap-2 mb-6">
        <div className="h-2 w-2 rounded-full bg-yellow-500" />
        <h3 className="text-title">LeetCode</h3>
      </div>

      <div className="flex items-center gap-4 mb-6">
        {data.avatarUrl && (
          <img
            src={data.avatarUrl}
            alt={data.username}
            loading="lazy"
            className="h-14 w-14 rounded-2xl border border-border object-cover"
          />
        )}

        <div className="min-w-0">
          <p className="text-label">{data.totalSolved} problems solved</p>
          {data.ranking && (
            <p className="text-small mt-0.5 inline-flex items-center gap-1.5">
              <Trophy size={13} className="text-muted" />
              Rank {data.ranking.toLocaleString()}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3 mb-6 flex-1">
        {breakdown.map((item) => (
          <div key={item.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-small">
              <span>{item.label}</span>
              <span className="text-muted tabular-nums">{item.count}</span>
            </div>

            <div className="h-1.5 rounded-full bg-surface overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max((item.count / max) * 100, 3)}%`,
                  backgroundColor: DIFFICULTY_COLORS[item.label],
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <a
        href={data.profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto h-control px-control rounded-control bg-primary text-background text-label inline-flex items-center justify-center gap-2 transition hover:opacity-90"
      >
        View LeetCode
        <ExternalLink size={15} />
      </a>
    </motion.div>
  );
}

function CodingActivity() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const data = await getIntegrationsStatus();

        setStatus(data);
      } catch (error) {
        console.error("Failed to load coding activity", error);
      }
    };

    loadStatus();
  }, []);

  // Nothing fetched yet, or both sources failed — nothing real to show,
  // so show nothing rather than placeholder/fake numbers.
  if (!status || (!status.github && !status.leetcode)) {
    return null;
  }

  return (
    <section id="coding-activity" className="section">
      <Container>
        <SectionTitle
          eyebrow="Coding Activity"
          title="Live from GitHub and LeetCode."
          description="Real-time snapshots of what I'm building and the problems I'm solving — pulled directly from my public profiles."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {status.github && <GitHubCard data={status.github} />}
          {status.leetcode && <LeetCodeCard data={status.leetcode} />}
        </div>
      </Container>
    </section>
  );
}

export default CodingActivity;
