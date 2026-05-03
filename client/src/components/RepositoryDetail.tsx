import { Repository } from "@/hooks/useGitHubAPI";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Calendar,
  Code,
  ExternalLink,
  GitFork,
  GitPullRequest,
  Star,
  TrendingUp,
  X,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface RepositoryDetailProps {
  repo: Repository;
  onClose: () => void;
  layoutId: string;
  fetchDetailedStats: (repo: Repository) => Promise<Repository>;
}

export function RepositoryDetail({
  repo,
  onClose,
  layoutId,
  fetchDetailedStats,
}: RepositoryDetailProps) {
  const [detailedRepo, setDetailedRepo] = useState<Repository | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch detailed stats when component mounts
  useEffect(() => {
    const loadStats = async () => {
      // Skip if stats are already loaded
      if (repo.views !== undefined || !repo.owner) {
        setDetailedRepo(repo);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const detailed = await fetchDetailedStats(repo);
        setDetailedRepo(detailed);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load detailed stats"
        );
        setDetailedRepo(repo); // Fallback to basic repo data
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [repo, fetchDetailedStats]);

  const currentRepo = detailedRepo || repo;

  // Combine views and clones data for chart
  const chartData = (currentRepo.viewsData || []).map((view, idx) => ({
    date: view.date,
    views: view.count,
    clones: (currentRepo.clonesData || [])[idx]?.count || 0,
  }));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-40"
      />
      <motion.div
        layoutId={layoutId}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="bg-card rounded-lg shadow-2xl h-[90vh] w-full max-w-6xl overflow-hidden pointer-events-auto flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 bg-card border-b border-border p-4 flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <img
                src={repo.socialImage}
                alt={repo.name}
                className="w-12 h-12 rounded-lg object-cover border border-border flex-shrink-0"
                onError={e => {
                  (e.target as HTMLImageElement).src =
                    "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png";
                }}
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-foreground mb-1 truncate">
                  {repo.name}
                </h2>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{repo.description}</p>
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-xs font-medium"
                >
                  View on GitHub
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Column */}
              <div className="space-y-4 overflow-y-auto p-1">
                {/* Key Metrics */}
                <div>
                  <h3 className="text-base font-bold text-foreground mb-3">
                    Overview
                  </h3>
                  {loading && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-primary mr-2" />
                      <span className="text-sm text-muted-foreground">
                        Loading detailed stats...
                      </span>
                    </div>
                  )}
                  {error && (
                    <div className="mb-3 p-2 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-xs text-destructive">{error}</p>
                    </div>
                  )}
                  {currentRepo.trafficDataUnavailable && !loading && (
                    <div className="mb-3 p-2 bg-muted border border-border rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        Traffic data (views/clones) is unavailable. This is only available for repositories where you have push access.
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-primary/10 rounded-lg p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="text-xs text-muted-foreground">Views</span>
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : (
                          currentRepo.views || 0
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {currentRepo.uniqueViews || 0} unique
                      </div>
                    </div>

                    <div className="bg-chart-1/10 rounded-lg p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <TrendingUp className="w-4 h-4 text-chart-1" />
                        <span className="text-xs text-muted-foreground">Clones</span>
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : (
                          currentRepo.clones || 0
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {currentRepo.uniqueClones || 0} unique
                      </div>
                    </div>

                    <div className="bg-chart-2/10 rounded-lg p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="w-4 h-4 text-chart-2" />
                        <span className="text-xs text-muted-foreground">Stars</span>
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        {currentRepo.stars}
                      </div>
                    </div>

                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <GitFork className="w-4 h-4 text-chart-3" />
                        <span className="text-xs text-muted-foreground">Forks</span>
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        {currentRepo.forks}
                      </div>
                    </div>

                    <div className="bg-chart-4/10 rounded-lg p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <GitPullRequest className="w-4 h-4 text-chart-4" />
                        <span className="text-xs text-muted-foreground">
                          Pull Requests
                        </span>
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : (
                          currentRepo.totalPulls || 0
                        )}
                      </div>
                    </div>

                    <div className="bg-destructive/10 rounded-lg p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <AlertCircle className="w-4 h-4 text-destructive" />
                        <span className="text-xs text-muted-foreground">Issues</span>
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : (
                          currentRepo.totalIssues || 0
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Repository Info */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-3">
                    Repository Info
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                      <Code className="w-4 h-4 text-slate-600" />
                      <div className="flex-1">
                        <div className="text-xs text-slate-500">Language</div>
                        <div className="text-sm font-medium text-slate-900">
                          {repo.language || "Not specified"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                      <Calendar className="w-4 h-4 text-slate-600" />
                      <div className="flex-1">
                        <div className="text-xs text-slate-500">Created</div>
                        <div className="text-sm font-medium text-slate-900">
                          {format(new Date(repo.createdAt), "MMM dd, yyyy")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                      <Calendar className="w-4 h-4 text-slate-600" />
                      <div className="flex-1">
                        <div className="text-xs text-slate-500">Last Updated</div>
                        <div className="text-sm font-medium text-slate-900">
                          {format(new Date(repo.updatedAt), "MMM dd, yyyy")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                      <ExternalLink className="w-4 h-4 text-slate-600" />
                      <div className="flex-1">
                        <div className="text-xs text-slate-500">Owner</div>
                        <div className="text-sm font-medium text-slate-900">
                          {repo.owner}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Traffic Chart */}
              <div className="overflow-hidden">
                {chartData.length > 0 && (
                  <div className="h-full flex flex-col">
                    <h3 className="text-base font-bold text-slate-900 mb-3 flex-shrink-0">
                      Traffic (Last 14 Days)
                    </h3>
                    <div className="flex-1 bg-slate-50 rounded-lg p-3 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient
                              id="colorViews"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#0969da"
                                stopOpacity={0.8}
                              />
                              <stop
                                offset="95%"
                                stopColor="#0969da"
                                stopOpacity={0}
                              />
                            </linearGradient>
                            <linearGradient
                              id="colorClones"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#1a7f37"
                                stopOpacity={0.8}
                              />
                              <stop
                                offset="95%"
                                stopColor="#1a7f37"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis
                            dataKey="date"
                            className="text-xs text-slate-600"
                            tick={{ fill: "currentColor", fontSize: 10 }}
                          />
                          <YAxis
                            className="text-xs text-slate-600"
                            tick={{ fill: "currentColor", fontSize: 10 }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e2e8f0",
                              borderRadius: "6px",
                              fontSize: "12px",
                            }}
                          />
                          <Legend 
                            wrapperStyle={{ fontSize: "12px" }}
                          />
                          <Area
                            type="monotone"
                            dataKey="views"
                            stroke="#0969da"
                            fillOpacity={1}
                            fill="url(#colorViews)"
                            name="Views"
                          />
                          <Area
                            type="monotone"
                            dataKey="clones"
                            stroke="#1a7f37"
                            fillOpacity={1}
                            fill="url(#colorClones)"
                            name="Clones"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                {chartData.length === 0 && (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-slate-500">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No traffic data available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
