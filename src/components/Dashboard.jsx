import { Button } from '@/components/ui/button.jsx';
import { AnimatePresence } from 'framer-motion';
import { Loader2, Settings } from 'lucide-react';
import { useState } from 'react';
import { LLMSettingsDialog } from './LLMSettingsDialog';
import { RepoCard } from './RepoCard';
import { RepoDetail } from './RepoDetail';

export const Dashboard = ({ repositories, loading, error, token }) => {
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading repositories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-destructive text-lg font-semibold mb-2">Error</div>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground mt-4">
            Please check your GitHub token and try again.
          </p>
        </div>
      </div>
    );
  }

  if (repositories.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">No repositories found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {selectedRepo ? (
          <RepoDetail
            key="detail"
            repo={selectedRepo}
            onClose={() => setSelectedRepo(null)}
            layoutId={`repo-${selectedRepo.id}`}
            token={token}
          />
        ) : (
          <div key="grid" className="container mx-auto px-4 py-8">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">
                  GitHub Repository Stats
                </h1>
                <p className="text-muted-foreground">
                  Click on any repository card to view detailed statistics
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
                <Settings className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {repositories.map((repo) => (
                <RepoCard
                  key={repo.id}
                  repo={repo}
                  onClick={() => setSelectedRepo(repo)}
                  layoutId={`repo-${repo.id}`}
                />
              ))}
            </div>
          </div>
        )}
      </AnimatePresence>
      <LLMSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};
