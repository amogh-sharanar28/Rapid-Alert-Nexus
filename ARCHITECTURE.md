# Data Flow & Architecture - Quick Reference

## System Overview

**Rapid Alert Nexus** is a real-time emergency response coordination system with:
- Frontend (React + TypeScript)
- Backend (Node.js + Express + Socket.IO)
- 4 Databases (JSON files)
- WebSocket for live updates

---

## Database Structure (4 separate JSON files)

### **DB1: db.json** (Main Data)
```javascript
{
  alerts: [],           // Emergency alerts
  feed: [],             // Social media feed items
  logs: [],             // Processing logs
  dispatches: [],       // Dispatch reports
  responses: [],        // Team responses
  dispatchLogs: []      // Activity logs (NEW)
}
```

### **DB2: db2.json** (Filtered Content)
```javascript
{
  feedbackHistory: [],  // Filtered tweets/noise
  filteredSummary: {    // Statistics
    totalFiltered, successfulFilter, filterRate
  }
}
```

### **DB3: db3.json** (Processing Details)
```javascript
{
  processingLogs: [],   // Processing pipeline logs
  logSummary: {         // Statistics
    totalProcessed, successfulAlerts, filteredOut
  }
}
```

### **DB4: db4.json** (Auth Logs)
```javascript
{
  respondLogins: []     // Login history for /respond page
}
```

---

## Core Data Types

### Alert
```typescript
{
  id: string;
  location: string;
  incidentType: 'fire' | 'flood' | 'earthquake' | 'rescue' | 'medical' | 'infrastructure' | 'storm';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  responderRoles: ResponderRole[];
  timestamp: Date;
  sourceId: string;
  sourceType: 'tweet' | 'image' | 'manual_report';
}
```

### DispatchReport
```typescript
{
  id: string;
  alertId: string;
  location: string;
  incidentType: string;
  criticality: Priority;
  notes: string;
  resourcesNeeded?: string;
  assignedRoles: ResponderRole[];
  teamAssignments: TeamAssignment[];  // Status for each role
  coordinationNotes: CoordinationNote[];
  peopleAffected: number;
  status: 'pending' | 'acknowledged' | 'resolved';
  timestamp: Date;
}
```

### TeamResponse
```typescript
{
  id: string;
  dispatchReportId: string;
  alertId: string;
  respondingRole: ResponderRole;
  teamLeader: string;
  teamSize: number;
  eta: string;
  equipmentDeployed: string;
  currentStatus: 'en_route' | 'on_scene' | 'resolved' | 'need_backup';
  situationUpdate: string;
  casualties: number;
  rescued: number;
  hazards: string;
  accessRoute: string;
  timestamp: Date;
}
```

### DispatchLogEntry (NEW)
```typescript
{
  id: string;
  dispatchId: string;
  action: 'created' | 'team_assigned' | 'status_update' | 'note_added' | 'resolved';
  details: string;
  role?: ResponderRole;
  timestamp: Date;
}
```

---

## Data Flow Routes

### 1️⃣ Creating a Dispatch

```
Dashboard (Operator)
  ├─ Creates alert
  ├─ Clicks "Dispatch"
  └─ DispatchReportDialog → Sets teams, resources, etc.
      ↓
  Frontend (SimulationContext.addDispatchReport)
      ├─ Add to dispatchedReports state
      ├─ Create log entries for "created", "team_assigned"
      └─ POST /api/dispatches
          ↓
  Backend (server.js)
      ├─ Save to db.dispatches
      ├─ WebSocket: io.emit('new_dispatch', dispatch)
      └─ All clients receive update in real-time
```

### 2️⃣ Submitting a Team Response

```
Response Console (Team Lead)
  ├─ Selects team role
  ├─ Clicks "Respond"
  └─ ResponseFormDialog → Fills team details
      ↓
  Frontend (ResponseConsolePage.handleFirstResponse)
      ├─ Call addTeamResponse()
      ├─ Update dispatch status to "acknowledged"
      ├─ Create log entry "status_update"
      └─ saveResponseToBackend() → POST /api/responses
          ↓
  Backend (server.js)
      ├─ Save to db.responses
      ├─ WebSocket: io.emit('team_response_update', response)
      ├─ SimulationContext receives update
      ├─ Response console shows "Response Submitted"
      └─ History page receives update in real-time
```

### 3️⃣ Updating Response Status (e.g., "En Route" → "On Scene" → "Rescued")

```
Response Console (Team Lead)
  ├─ Views existing response
  ├─ Clicks status button (e.g., "On Scene")
  └─ EditStatusDialog → Updates all fields (casualties, rescued, hazards, etc.)
      ├─ Calls handleUpdateResponse()
      ├─ Updates local response
      ├─ Calls updateTeamStatus() to update dispatch status
      ├─ addLogEntry creates a new log: "status_update → on_scene"
      └─ saveResponseToBackend() → POST /api/responses (upsert)
          ↓
  Backend (server.js)
      ├─ Find existing response, update it
      ├─ Save to db.responses
      ├─ addLogEntry from frontend POSTs to /api/dispatch-logs
      ├─ WebSocket: io.emit('team_response_update', response)
      ├─ WebSocket: io.emit('dispatch_log_update', log)
      └─ Both Response Console & History Page update in real-time
```

### 4️⃣ Viewing Dispatch History (Activity Logs)

```
Dispatch History Page
  ├─ Component mounts
  ├─ useSimulation gets dispatchedReports & dispatchLogs
  └─ For each dispatch:
      ├─ Shows incident summary (location, criticality, status)
      ├─ Click "expand" to see details
      └─ Activity Log section shows ALL events:
          ├─ "created" - when dispatch was first made
          ├─ "team_assigned" - which teams got the call
          ├─ "status_update" - all status changes (en_route, on_scene, resolved, need_backup)
          ├─ "note_added" - coordination notes
          └─ Each entry shows: timestamp, action, details, role

  Real-time updates:
  ├─ When response updates on Response Console
  ├─ Backend broadcasts via WebSocket: dispatch_log_update
  ├─ Frontend receives and adds to dispatchLogs state
  └─ History page re-renders with new entry immediately
```

---

## Key Features

### ✅ Persistence
- All data saved to backend DB (survives page refresh)
- Dispatch logs saved on every status update
- Backend validates and broadcasts all changes

### ✅ Real-time Sync
- WebSocket broadcasts updates to all connected clients
- Multiple users see changes instantly
- No polling required

### ✅ Audit Trail
- Activity logs track every change with timestamp
- Shows who (role) changed what (action) and when (timestamp)
- 100% traceable incident history

### ✅ Data Integrity
- Responses are upserted (update if exists, insert if new)
- Dispatch status updates based on team assignment status
- All timestamps consistently formatted

---

## Frontend Architecture

```
App (main.tsx)
├─ SimulationProvider
│  ├─ State: alerts, feedItems, dispatchedReports, teamResponses, dispatchLogs, etc.
│  ├─ useSocket() hook - connects to WebSocket
│  └─ useEffect - loads initial data from backend
│
├─ Router with pages:
│  ├─ Dashboard (create dispatches, monitor alerts)
│  ├─ Response Console (team leads update status)
│  ├─ Dispatch History (view audit trail)
│  ├─ DataInput, Processing, etc.
│  └─ RespondLogin (auth for /respond)
│
└─ Components:
   ├─ StatsPanel, AlertHeatMap, TopNav, etc.
   └─ UI components (Button, Dialog, Input, etc.)
```

---

## Backend Architecture

```
server.js
├─ Express app + Socket.IO
├─ CORS enabled for localhost:5173
├─ Auth endpoint: /api/login
├─ Data endpoints:
│  ├─ /api/alerts, /api/feed, /api/logs (DB1)
│  ├─ /api/dispatches, /api/responses
│  ├─ /api/dispatch-logs (NEW)
│  ├─ /api/feedback-history (DB2)
│  └─ /api/logs-summary (DB3)
├─ WebSocket events:
│  ├─ new_alert, new_feed, processing_update
│  ├─ team_response_update (receives from frontend)
│  └─ dispatch_log_update (broadcasts to all)
└─ Reset & health check endpoints
```

---

## Testing the System

### Test 1: Create & Dispatch
1. Go to **Dashboard**
2. Start simulation
3. Wait for alert
4. Click "Dispatch"
5. Check **Dispatch History** → Activity log shows "created"

### Test 2: Respond & Update
1. Go to **Response Console**
2. Select a team role
3. Click "Respond" on dispatch
4. Fill all fields and click "Submit Response"
5. Check **Dashboard** → dispatch status is "acknowledged"
6. Check **Dispatch History** → new log entry shows role responded

### Test 3: Status Updates with Full Details
1. On **Response Console**, click status button
2. Change to "On Scene"
3. Update casualties & rescued counts
4. Click "Save & Update"
5. Check **Dispatch History** → Activity log shows status change
6. Refresh page → all details persist

### Test 4: Real-time Multi-client
1. Open **Dispatch History** in one tab
2. Open **Response Console** in another tab
3. Update response on Response Console
4. Watch Dispatch History update in real-time (no refresh needed)

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| History shows old status | Backend endpoint running? Check `http://localhost:4000/api/health` |
| Activity logs empty | Logs may not be in DB yet. Update response to trigger log creation. |
| WebSocket not connecting | Check browser console for errors. Ensure backend running on :4000 |
| Page refresh loses data | Check if backend is persisting. Inspect `backend/data/db.json` |
| Response not updating | Did you click "Save & Update"? Data needs to be POSTed to backend. |

---

## Monitoring & Debugging

### Backend Console Logs
```
✅ Socket connected: [socketId]
EMITTING DISPATCH: [id]
EMITTING TEAM RESPONSE: [id] [role] [status]
EMITTING DISPATCH LOG: [id] [action]
```

### Frontend Browser Console
```
🔔 Processing new alert from WebSocket: [id]
🔔 Team response received via WebSocket: [role] [status]
🔔 Dispatch log received via WebSocket: [id] [action]
```

### Database Files
```
backend/data/db.json        → alerts, feed, dispatches, responses, dispatchLogs
backend/data/db2.json       → feedbackHistory
backend/data/db3.json       → processingLogs
backend/data/db4.json       → respondLogins
```

Use any JSON viewer to inspect data in real-time.

---

**Last Updated:** 2025-05-03  
**Version:** 1.1 (with dispatch logs persistence fix)
