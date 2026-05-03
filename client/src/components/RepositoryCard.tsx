import { Repository } from "@/hooks/useGitHubAPI";
import {
  AlertCircle,
  Eye,
  GitFork,
  GitPullRequest,
  Star,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";

interface RepositoryCardProps {
  repo: Repository;
  onClick: () => void;
  layoutId: string;
  isFocused?: boolean;
  onFocus?: () => void;
}

export function RepositoryCard({
  repo,
  onClick,
  layoutId,
  isFocused = false,
  onFocus,
}: RepositoryCardProps) {
  return (
    <motion.div
      layoutId={layoutId}
      onClick={onClick}
      onFocus={onFocus}
      tabIndex={0}
      role="button"
      aria-pressed={isFocused}
      className={`bg-card border rounded-lg p-5 cursor-pointer transition-all duration-300 ${
        isFocused
          ? "border-primary shadow-lg ring-2 ring-primary/50 ring-offset-2"
          : "border-border hover:shadow-md hover:border-primary"
      }`}
      whileHover={{ y: -4 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header with Image */}
      <div className="flex items-start gap-4 mb-4">
        <motion.img
          src={repo.socialImage}
          alt={repo.name}
          className="w-14 h-14 rounded-lg object-cover border border-border"
          loading="lazy"
          onError={e => {
            (e.target as HTMLImageElement).src =
              "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png";
          }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-foreground truncate mb-1">
            {repo.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {repo.description || "No description available"}
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          <div>
            <div className="text-xs text-muted-foreground">Views</div>
            <div className="text-sm font-semibold text-foreground">
              {repo.views ?? 0}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-chart-1" />
          <div>
            <div className="text-xs text-muted-foreground">Clones</div>
            <div className="text-sm font-semibold text-foreground">
              {repo.clones ?? 0}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-chart-2" />
          <div>
            <div className="text-xs text-muted-foreground">Stars</div>
            <div className="text-sm font-semibold text-foreground">
              {repo.stars}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <GitFork className="w-4 h-4 text-chart-3" />
          <div>
            <div className="text-xs text-muted-foreground">Forks</div>
            <div className="text-sm font-semibold text-foreground">
              {repo.forks}
            </div>
          </div>
        </div>
      </div>

      {/* Traffic Data Unavailable Warning */}
      {repo.trafficDataUnavailable && (
        <div className="mb-4 p-2 bg-muted border border-border rounded-lg">
          <p className="text-xs text-muted-foreground">
            Traffic data unavailable - requires push access
          </p>
        </div>
      )}

      {/* Footer with PRs, Issues, and Language */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <GitPullRequest className="w-3.5 h-3.5 text-chart-4" />
            <span className="text-muted-foreground">{repo.totalPulls ?? 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-destructive" />
            <span className="text-muted-foreground">{repo.totalIssues ?? 0}</span>
          </div>
        </div>
        {repo.language && (
          <div className="ml-auto">
            <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
              {repo.language}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
