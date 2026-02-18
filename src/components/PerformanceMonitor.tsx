import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, Database } from 'lucide-react';

interface PerformanceMetrics {
  loadTime: number;
  queryCount: number;
  cacheHits: number;
  lastUpdate: Date;
}

export const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    queryCount: 0,
    cacheHits: 0,
    lastUpdate: new Date()
  });

  useEffect(() => {
    // Monitor performance metrics
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          setMetrics(prev => ({
            ...prev,
            loadTime: entry.duration,
            lastUpdate: new Date()
          }));
        }
      });
    });

    observer.observe({ entryTypes: ['navigation'] });

    return () => observer.disconnect();
  }, []);

  const getLoadTimeStatus = (time: number) => {
    if (time < 1000) return { status: 'Good', color: 'bg-green-500' };
    if (time < 3000) return { status: 'Fair', color: 'bg-yellow-500' };
    return { status: 'Slow', color: 'bg-red-500' };
  };

  const loadTimeStatus = getLoadTimeStatus(metrics.loadTime);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Performance Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Load Time</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs ${loadTimeStatus.color} text-white`}>
              {loadTimeStatus.status}
            </Badge>
            <span className="text-xs font-mono">
              {metrics.loadTime.toFixed(0)}ms
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Cache Efficiency</span>
          </div>
          <span className="text-xs font-mono">
            {metrics.cacheHits > 0 ? `${Math.round((metrics.cacheHits / (metrics.queryCount + metrics.cacheHits)) * 100)}%` : '0%'}
          </span>
        </div>

        <div className="text-xs text-muted-foreground pt-1 border-t">
          Last updated: {metrics.lastUpdate.toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
};