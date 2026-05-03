import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Alert, ProcessingLog, FeedItem, ResponderRole, DispatchReport, TeamResponse, DispatchLogEntry, CoordinationNote, CoordinationStatus, TeamAssignment } from '@/types/simulation';
import { generateTweet, classifyTweet, generateProcessingLogs, createAlert } from '@/lib/simulation-data';
import { useSocket } from '@/hooks/useSocket';

interface SimulationState {
  alerts: Alert[];
  processingLogs: ProcessingLog[];
  feedItems: FeedItem[];
  isSimulationRunning: boolean;
  selectedRole: ResponderRole;
  setSelectedRole: (role: ResponderRole) => void;
  startSimulation: () => void;
  stopSimulation: () => void;
  addManualReport: (location: string, description: string, imageUrl?: string) => void;
  addImageReport: (location: string, description: string) => void;
  filteredAlerts: Alert[];
  dispatchedReports: DispatchReport[];
  addDispatchReport: (report: DispatchReport) => void;
  teamResponses: TeamResponse[];
  addTeamResponse: (response: TeamResponse) => void;
  dispatchLogs: DispatchLogEntry[];
  updateTeamStatus: (dispatchId: string, role: ResponderRole, status: CoordinationStatus) => void;
  addCoordinationNote: (dispatchId: string, role: ResponderRole, author: string, text: string) => void;
}

const SimulationContext = createContext<SimulationState | null>(null);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [processingLogs, setProcessingLogs] = useState<ProcessingLog[]>([]);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [selectedRole, setSelectedRole] = useState<ResponderRole>('all');
  const [dispatchedReports, setDispatchedReports] = useState<DispatchReport[]>([]);
  const [teamResponses, setTeamResponses] = useState<TeamResponse[]>([]);
  const [dispatchLogs, setDispatchLogs] = useState<DispatchLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load initial data from backend on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // const [feedRes, alertsRes, logsRes] = await Promise.all([
        //   fetch('http://localhost:4000/api/feed'),
        //   fetch('http://localhost:4000/api/alerts'),
        //   fetch('http://localhost:4000/api/logs'),
        // ]);
        
        // const feedJson = await feedRes.json();
        // const alertsJson = await alertsRes.json();
        // const logsJson = await logsRes.json();

        // // ✅ Handle both array and object response
        // const feedData = Array.isArray(feedJson) ? feedJson : feedJson.data || [];
        // const alertsData = Array.isArray(alertsJson) ? alertsJson : alertsJson.data || [];
        // const logsData = Array.isArray(logsJson) ? logsJson : logsJson.data || [];

        // // ✅ DEBUG (important)
        // console.log("📦 Feed API Response:", feedJson);
        // console.log("📦 Alerts API Response:", alertsJson);
        // console.log("📦 Logs API Response:", logsJson);

        // console.log("✅ Parsed Feed:", feedData);
        // console.log("✅ Parsed Alerts:", alertsData);
        // console.log("✅ Parsed Logs:", logsData);

        // setFeedItems(feedData.slice(0, 50));
        // setAlerts(alertsData.slice(0, 50));
        // setProcessingLogs(logsData.slice(0, 100));

        const [feedRes, alertsRes, logsRes, dispatchRes, responsesRes] = await Promise.all([
          fetch('http://localhost:4000/api/feed'),
          fetch('http://localhost:4000/api/alerts'),
          fetch('http://localhost:4000/api/logs'),
          fetch('http://localhost:4000/api/dispatches'),
          fetch('http://localhost:4000/api/responses'),
        ]);

        const feedJson      = await feedRes.json();
        const alertsJson    = await alertsRes.json();
        const logsJson      = await logsRes.json();
        const dispatchJson  = await dispatchRes.json();
        const responsesJson = await responsesRes.json();

        const feedData      = Array.isArray(feedJson)      ? feedJson      : feedJson.data      || [];
        const alertsData    = Array.isArray(alertsJson)    ? alertsJson    : alertsJson.data    || [];
        const logsData      = Array.isArray(logsJson)      ? logsJson      : logsJson.data      || [];
        const dispatchData  = Array.isArray(dispatchJson)  ? dispatchJson  : dispatchJson.data  || [];
        const responsesData = Array.isArray(responsesJson) ? responsesJson : responsesJson.data || [];

        setFeedItems(feedData.slice(0, 50));
        setAlerts(alertsData.slice(0, 50));
        setProcessingLogs(logsData.slice(0, 100));
        setDispatchedReports(dispatchData);
        setTeamResponses(responsesData);
      } catch (err) {
        console.error("❌ Error loading initial data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
  }, []);

  // Set up WebSocket connection for real-time updates
  useSocket({
    onNewAlert: useCallback((alert: Alert) => {
      console.log('🔔 Processing new alert from WebSocket:', alert.id);
      setAlerts(prev => {
        if (prev.some(a => a.id === alert.id)) {
          return prev;
        }
        return [alert, ...prev].slice(0, 50);
      });
    }, []),
    onNewFeed: useCallback((feed: FeedItem) => {
      console.log('🔔 Processing new feed from WebSocket:', feed.id);
      setFeedItems(prev => {
        if (prev.some(f => f.id === feed.id)) {
          return prev;
        }
        return [feed, ...prev].slice(0, 50);
      });
    }, []),
    onProcessingUpdate: useCallback((data: { log: ProcessingLog; summary: any }) => {
      console.log('🔔 Processing new log from WebSocket:', data.log?.id);
      setProcessingLogs(prev => {
        if (prev.some(l => l.id === data.log.id)) {
          return prev;
        }
        return [data.log, ...prev].slice(0, 100);
      });
    }, []),
  });

  const addLogEntry = useCallback((dispatchId: string, action: DispatchLogEntry['action'], details: string, role?: ResponderRole) => {
    const entry: DispatchLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      dispatchId,
      action,
      details,
      role,
      timestamp: new Date(),
    };
    setDispatchLogs(prev => [entry, ...prev]);
  }, []);

  const processData = useCallback((sourceId: string, sourceType: 'tweet' | 'image' | 'manual_report', content: string, location: string) => {
    // Use improved classification function
    const classification = classifyTweet({ id: sourceId, text: content, author: '', timestamp: new Date(), location });

    // For non-tweet sources (manual reports, images), use keyword-based classification
    let finalClassification = classification;
    if (sourceType !== 'tweet') {
      const lower = content.toLowerCase();
      if (lower.includes('fire') || lower.includes('flame') || lower.includes('burn') || lower.includes('explosion')) {
        finalClassification = { type: 'fire', priority: 'HIGH', shouldIgnore: false };
      } else if (lower.includes('flood') || lower.includes('water') || lower.includes('submerge')) {
        finalClassification = { type: 'flood', priority: 'HIGH', shouldIgnore: false };
      } else if (lower.includes('earthquake') || lower.includes('tremor') || lower.includes('collapse')) {
        finalClassification = { type: 'earthquake', priority: 'CRITICAL', shouldIgnore: false };
      } else if (lower.includes('injur') || lower.includes('medical') || lower.includes('casualt')) {
        finalClassification = { type: 'medical', priority: 'HIGH', shouldIgnore: false };
      } else if (lower.includes('rescue') || lower.includes('trapped') || lower.includes('help')) {
        finalClassification = { type: 'rescue', priority: 'MEDIUM', shouldIgnore: false };
      } else {
        // Default to rescue but check if it should be ignored
        finalClassification = { type: 'rescue', priority: 'MEDIUM', shouldIgnore: false };
      }
    }

    const logs = generateProcessingLogs(sourceId, sourceType, content, finalClassification, location);
    const alert = createAlert(sourceId, sourceType, location, content, finalClassification);

    // Store logs to DB3 (processing logs database)
    logs.forEach((log, i) => {
      setTimeout(async () => {
        setProcessingLogs(prev => [log, ...prev].slice(0, 100));
        // Save to backend DB3
        try {
          await fetch('http://localhost:4000/api/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(log),
          });
        } catch (error) {
          console.warn('Failed to save log to DB3:', error);
        }
      }, i * 200);
    });

    // If random tweet (filtered), store in DB2 (feedback history)
    if ((classification as any).shouldIgnore) {
      setTimeout(async () => {
        const feedbackItem = {
          id: sourceId,
          content,
          author: '@User',
          timestamp: new Date(),
          location,
          edgeFilterResult: logs[0]?.result || 'Non-emergency content detected. Filtered out.',
        };
        try {
          await fetch('http://localhost:4000/api/feedback-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(feedbackItem),
          });
        } catch (error) {
          console.warn('Failed to save feedback to DB2:', error);
        }
      }, logs.length * 200);
    } else if (alert) {
      // Store emergency alert to DB1 (main alerts database)
      setTimeout(async () => {
        setAlerts(prev => [alert, ...prev].slice(0, 50));
        try {
          await fetch('http://localhost:4000/api/alerts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(alert),
          });
        } catch (error) {
          console.warn('Failed to save alert to DB1:', error);
        }
      }, logs.length * 200);
    }
  }, []);

  const startSimulation = useCallback(() => {
    if (intervalRef.current) return;
    setIsSimulationRunning(true);

    const tick = async () => {
      const tweet = generateTweet();
      const feedItem: FeedItem = {
        id: tweet.id,
        type: 'tweet',
        content: tweet.text,
        timestamp: tweet.timestamp,
        location: tweet.location,
      };
      setFeedItems(prev => [feedItem, ...prev].slice(0, 50));
      try {
        await fetch('http://localhost:4000/api/feed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(feedItem),
        });
      } catch (error) {
        console.warn('Failed to save tweet to DB3:', error);
      }

      processData(tweet.id, 'tweet', tweet.text, tweet.location || 'Unknown Location');
    };

    tick();
    intervalRef.current = setInterval(tick, 3000 + Math.random() * 3000);
  }, [processData]);

  const stopSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsSimulationRunning(false);
  }, []);

  const addManualReport = useCallback((location: string, description: string) => {
    const id = `report-${Date.now()}`;
    const feedItem: FeedItem = { id, type: 'manual_report', content: description, timestamp: new Date(), location };
    setFeedItems(prev => [feedItem, ...prev].slice(0, 50));
    processData(id, 'manual_report', description, location);
  }, [processData]);

  const addImageReport = useCallback((location: string, description: string) => {
    const id = `image-${Date.now()}`;
    const feedItem: FeedItem = { id, type: 'image', content: description, timestamp: new Date(), location };
    setFeedItems(prev => [feedItem, ...prev].slice(0, 50));
    processData(id, 'image', description, location);
  }, [processData]);

  const addDispatchReport = useCallback((report: DispatchReport) => {
    setDispatchedReports(prev => [report, ...prev]);
    addLogEntry(report.id, 'created', `Dispatch created: ${report.criticality} ${report.incidentType} at ${report.location}`);
    report.assignedRoles.forEach(role => {
      addLogEntry(report.id, 'team_assigned', `${role.replace('_', ' ')} assigned`, role);
    });
  }, [addLogEntry]);

  const addTeamResponse = useCallback((response: TeamResponse) => {
    setTeamResponses(prev => [response, ...prev]);
    setDispatchedReports(prev => prev.map(r =>
      r.id === response.dispatchReportId ? { ...r, status: 'acknowledged' as const } : r
    ));
    addLogEntry(response.dispatchReportId, 'status_update', `${response.respondingRole.replace('_', ' ')} responded — ${response.currentStatus.replace('_', ' ')}`, response.respondingRole);
  }, [addLogEntry]);

  const updateTeamStatus = useCallback((dispatchId: string, role: ResponderRole, status: CoordinationStatus) => {
    setDispatchedReports(prev => prev.map(r => {
      if (r.id !== dispatchId) return r;
      const updatedAssignments = r.teamAssignments.map(ta =>
        ta.role === role ? { ...ta, status, updatedAt: new Date() } : ta
      );
      const allCompleted = updatedAssignments.every(ta => ta.status === 'completed');
      return { ...r, teamAssignments: updatedAssignments, status: allCompleted ? 'resolved' as const : r.status };
    }));
    addLogEntry(dispatchId, 'status_update', `${role.replace('_', ' ')} → ${status.replace('_', ' ')}`, role);
  }, [addLogEntry]);

  const addCoordinationNote = useCallback((dispatchId: string, role: ResponderRole, author: string, text: string) => {
    const note: CoordinationNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      dispatchId,
      author,
      role,
      text,
      timestamp: new Date(),
    };
    setDispatchedReports(prev => prev.map(r =>
      r.id === dispatchId ? { ...r, coordinationNotes: [...r.coordinationNotes, note] } : r
    ));
    addLogEntry(dispatchId, 'note_added', `${author} (${role.replace('_', ' ')}): ${text}`, role);
  }, [addLogEntry]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const filteredAlerts = selectedRole === 'all'
    ? alerts
    : alerts.filter(a => a.responderRoles.includes(selectedRole));


  const contextValue = React.useMemo(() => ({
    alerts,
    processingLogs,
    feedItems,
    isSimulationRunning,
    selectedRole,
    setSelectedRole,
    startSimulation,
    stopSimulation,
    addManualReport,
    addImageReport,
    filteredAlerts,
    dispatchedReports,
    addDispatchReport,
    teamResponses,
    addTeamResponse,
    dispatchLogs,
    updateTeamStatus,
    addCoordinationNote,
  }), [
    alerts,
    processingLogs,
    feedItems,
    isSimulationRunning,
    selectedRole,
    dispatchedReports,
    teamResponses,
    dispatchLogs
  ]);

  return (
    <SimulationContext.Provider value={contextValue}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error('useSimulation must be used within SimulationProvider');
  return ctx;
}
