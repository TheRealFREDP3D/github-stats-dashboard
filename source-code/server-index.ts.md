# Server Index - Express.js Backend for Local Stats Persistence

```typescript
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Data storage path
const DATA_DIR = path.join(process.cwd(), 'data');
const STATS_FILE = path.join(DATA_DIR, 'repository-stats.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Initialize data directory
ensureDataDir();

// API Routes

/**
 * Save repository statistics
 * POST /api/stats
 */
app.post('/api/stats', async (req, res) => {
  try {
    const statsData = {
      timestamp: new Date().toISOString(),
      ...req.body
    };

    // Read existing stats
    let existingStats = [];
    try {
      const data = await fs.readFile(STATS_FILE, 'utf-8');
      existingStats = JSON.parse(data);
    } catch (error) {
      // File doesn't exist or is empty, start with empty array
      existingStats = [];
    }

    // Add new stats
    existingStats.push(statsData);

    // Keep only last 100 entries to prevent file from growing too large
    if (existingStats.length > 100) {
      existingStats = existingStats.slice(-100);
    }

    // Write back to file
    await fs.writeFile(STATS_FILE, JSON.stringify(existingStats, null, 2));

    res.json({
      success: true,
      message: 'Statistics saved successfully',
      timestamp: statsData.timestamp
    });
  } catch (error) {
    console.error('Error saving stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save statistics'
    });
  }
});

/**
 * Get all historical statistics
 * GET /api/stats
 */
app.get('/api/stats', async (req, res) => {
  try {
    const data = await fs.readFile(STATS_FILE, 'utf-8');
    const stats = JSON.parse(data);
    
    res.json({
      success: true,
      data: stats,
      count: stats.length
    });
  } catch (error) {
    // If file doesn't exist, return empty array
    res.json({
      success: true,
      data: [],
      count: 0
    });
  }
});

/**
 * Get the most recent statistics
 * GET /api/stats/latest
 */
app.get('/api/stats/latest', async (req, res) => {
  try {
    const data = await fs.readFile(STATS_FILE, 'utf-8');
    const stats = JSON.parse(data);
    
    if (stats.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No statistics found'
      });
    }

    // Return the most recent entry
    const latest = stats[stats.length - 1];
    
    res.json({
      success: true,
      data: latest,
      timestamp: latest.timestamp
    });
  } catch (error) {
    res.json({
      success: true,
      data: null,
      message: 'No statistics found'
    });
  }
});

/**
 * Health check endpoint
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 QuickHubPulse server running on port ${PORT}`);
  console.log(`📊 Stats API available at http://localhost:${PORT}/api/stats`);
});

export default app;
```

## Key Features

- **Local Data Persistence**: JSON-based storage for repository statistics
- **RESTful API**: Standard HTTP methods for stats management
- **Automatic Data Management**: Limits historical data to prevent file bloat
- **Error Handling**: Comprehensive error handling and logging
- **Health Check**: Monitoring endpoint for service status
- **File System Safety**: Ensures data directory exists before operations

## API Endpoints

### POST /api/stats
Save new repository statistics with timestamp
```json
{
  "repositories": [...],
  "timestamp": "2026-05-12T19:00:00.000Z"
}
```

### GET /api/stats
Retrieve all historical statistics
```json
{
  "success": true,
  "data": [...],
  "count": 42
}
```

### GET /api/stats/latest
Get the most recent statistics snapshot
```json
{
  "success": true,
  "data": {...},
  "timestamp": "2026-05-12T19:00:00.000Z"
}
```

### GET /api/health
Check server health status
```json
{
  "status": "healthy",
  "timestamp": "2026-05-12T19:00:00.000Z",
  "version": "1.0.0"
}
```

## Data Structure

Statistics are stored in `data/repository-stats.json`:
```json
[
  {
    "timestamp": "2026-05-12T19:00:00.000Z",
    "repositories": [
      {
        "id": 123456,
        "name": "example-repo",
        "stars": 42,
        "forks": 8,
        "views": 150,
        "clones": 25
      }
    ]
  }
]
```
