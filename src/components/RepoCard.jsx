import { motion } from 'framer-motion';
import { GitFork, Eye, GitPullRequest, AlertCircle, Star, TrendingUp } from 'lucide-react';

export const RepoCard = ({ repo, onClick, layoutId }) => {
  return (
    <motion.div
      layoutId={layoutId}
      onClick={onClick}
      className="bg-card border border-border rounded-lg p-6 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-primary/50"
      whileHover={{ y: -4 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start gap-4 mb-4">
        <motion.img
          src={repo.socialImage}
          alt={repo.name}
          className="w-16 h-16 rounded-lg object-cover border border-border"
          loading="lazy"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground truncate mb-1">
            {repo.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {repo.description || 'No description available'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Eye className="w-4 h-4 text-chart-1" />
          <span className="text-muted-foreground">Views:</span>
          <span className="font-semibold text-foreground">{repo.views}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4 text-chart-2" />
          <span className="text-muted-foreground">Clones:</span>
          <span className="font-semibold text-foreground">{repo.clones}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <GitFork className="w-4 h-4 text-chart-3" />
          <span className="text-muted-foreground">Forks:</span>
          <span className="font-semibold text-foreground">{repo.forks}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Star className="w-4 h-4 text-chart-4" />
          <span className="text-muted-foreground">Stars:</span>
          <span className="font-semibold text-foreground">{repo.stars}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5 text-sm">
          <GitPullRequest className="w-4 h-4 text-chart-5" />
          <span className="text-muted-foreground">PRs:</span>
          <span className="font-medium text-foreground">{repo.totalPulls}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <AlertCircle className="w-4 h-4 text-destructive" />
          <span className="text-muted-foreground">Issues:</span>
          <span className="font-medium text-foreground">{repo.totalIssues}</span>
        </div>
        {repo.language && (
          <div className="ml-auto">
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
              {repo.language}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

