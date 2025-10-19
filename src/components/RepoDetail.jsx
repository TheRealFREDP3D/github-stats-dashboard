import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { AlertCircle, Brain, Calendar, Code, ExternalLink, Eye, GitFork, GitPullRequest, Loader2, Settings, Star, TrendingUp, X } from 'lucide-react';
import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useLLM } from '../contexts/LLMContext';
import { useRepoAnalysis } from '../hooks/useRepoAnalysis';
import { LLMSettingsDialog } from './LLMSettingsDialog';
import { RepoAnalysis } from './RepoAnalysis';
import { Button } from './ui/button';

export const RepoDetail = ({ repo, onClose, layoutId, token }) => {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { isConfigured } = useLLM();
  const { analysis, loading, error, analyzeRepository, isAnalyzed } = useRepoAnalysis(repo.owner, repo.name, repo.defaultBranch || 'main', token);
  
  // Prepare chart data for views and clones
  const trafficData = repo.viewsData.map((view, index) => {
    const clone = repo.clonesData[index] || { timestamp: view.timestamp, count: 0, uniques: 0 };
    return {
      date: format(new Date(view.timestamp), 'MMM dd'),
      views: view.count,
      uniqueViews: view.uniques,
      clones: clone.count,
      uniqueClones: clone.uniques,
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="container mx-auto px-4 py-8">
        <motion.div
          layoutId={layoutId}
          className="bg-card border border-border rounded-lg shadow-2xl max-w-5xl mx-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative p-6 border-b border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSettingsOpen(true)}
              className="absolute top-4 right-12 p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-start gap-4 pr-12">
              <img
                src={repo.socialImage}
                alt={repo.name}
                className="w-20 h-20 rounded-lg object-cover border border-border"
              />
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  {repo.name}
                </h2>
                <p className="text-muted-foreground mb-3">
                  {repo.description || 'No description available'}
                </p>
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  View on GitHub
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="p-6 border-b border-border">
            <h3 className="text-xl font-semibold text-foreground mb-4">Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-5 h-5 text-chart-1" />
                  <span className="text-sm text-muted-foreground">Total Views</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{repo.views}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {repo.uniqueViews} unique
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-chart-2" />
                  <span className="text-sm text-muted-foreground">Total Clones</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{repo.clones}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {repo.uniqueClones} unique
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-chart-4" />
                  <span className="text-sm text-muted-foreground">Stars</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{repo.stars}</div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <GitFork className="w-5 h-5 text-chart-3" />
                  <span className="text-sm text-muted-foreground">Forks</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{repo.forks}</div>
              </div>
            </div>
          </div>

          {/* Activity Stats */}
          <div className="p-6 border-b border-border">
            <h3 className="text-xl font-semibold text-foreground mb-4">Activity</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <GitPullRequest className="w-5 h-5 text-chart-5" />
                  <span className="text-sm text-muted-foreground">Pull Requests</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{repo.totalPulls}</div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <span className="text-sm text-muted-foreground">Total Issues</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{repo.totalIssues}</div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Open Issues</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{repo.openIssues}</div>
              </div>
            </div>
          </div>

          {/* Traffic Chart */}
          {trafficData.length > 0 && (
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-semibold text-foreground mb-4">Traffic (Last 14 Days)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trafficData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs text-muted-foreground"
                      tick={{ fill: 'currentColor' }}
                    />
                    <YAxis 
                      className="text-xs text-muted-foreground"
                      tick={{ fill: 'currentColor' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="views" 
                      stroke="hsl(var(--chart-1))" 
                      fill="hsl(var(--chart-1))" 
                      fillOpacity={0.6}
                      name="Views"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="clones" 
                      stroke="hsl(var(--chart-2))" 
                      fill="hsl(var(--chart-2))" 
                      fillOpacity={0.6}
                      name="Clones"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Repository Info */}
          <div className="p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">Repository Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Code className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Language</div>
                  <div className="font-medium text-foreground">{repo.language || 'Not specified'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Created</div>
                  <div className="font-medium text-foreground">
                    {format(new Date(repo.createdAt), 'MMM dd, yyyy')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Last Updated</div>
                  <div className="font-medium text-foreground">
                    {format(new Date(repo.updatedAt), 'MMM dd, yyyy')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ExternalLink className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Owner</div>
                  <div className="font-medium text-foreground">{repo.owner}</div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Code Analysis */}
          <div className="p-6 border-b border-border">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Code Analysis
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowAnalysis(!showAnalysis)}>
                {showAnalysis ? 'Hide Analysis' : 'Show Analysis'}
              </Button>
            </h3>
            {showAnalysis && (
              <div>
                {!isConfigured ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">LLM not configured. Please set up your API key in settings.</p>
                    <Button onClick={() => setSettingsOpen(true)}>Configure Settings</Button>
                  </div>
                ) : !isAnalyzed ? (
                  <div className="text-center py-8">
                    <Button onClick={analyzeRepository} disabled={loading}>
                      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Analyze Repository
                    </Button>
                    {error && <p className="text-destructive mt-2">{error}</p>}
                  </div>
                ) : (
                  <RepoAnalysis analysis={analysis} />
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
      <LLMSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </motion.div>
  );
};
