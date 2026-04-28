const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Database file paths
const DB_PATH = path.join(__dirname, 'data', 'db.json');           // Main alerts & feed
const DB2_PATH = path.join(__dirname, 'data', 'db2.json');         // Feedback history
const DB3_PATH = path.join(__dirname, 'data', 'db3.json');         // Processing logs

function loadData(dbPath) {
  try {
    const content = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return {};
  }
}

function saveData(dbPath, data) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
}

// Load all databases
let db = loadData(DB_PATH) || { alerts: [], feed: [], logs: [], dispatches: [] };
let db2 = loadData(DB2_PATH) || { feedbackHistory: [], filteredSummary: { totalFiltered: 0, successfulFilter: 0 } };
let db3 = loadData(DB3_PATH) || { processingLogs: [], logSummary: { totalProcessed: 0, successfulAlerts: 0, filteredOut: 0 } };

const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server and attach Socket.IO
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:8080', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

function replaceDataItem(collection, item, dbReference) {
  const index = dbReference[collection].findIndex(doc => doc.id === item.id);
  if (index >= 0) dbReference[collection][index] = item;
  else dbReference[collection].unshift(item);
}

// =================== DB1: MAIN ALERTS & FEED ===================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/alerts', (req, res) => {
  res.json(db.alerts);
});

app.post('/api/alerts', (req, res) => {
  const alert = { ...req.body, timestamp: new Date(req.body.timestamp).toISOString() };
  replaceDataItem('alerts', alert, db);
  saveData(DB_PATH, db);
  
  // Emit new_alert event to all connected clients
  console.log('EMITTING ALERT:', alert.id, alert.incidentType);
  io.emit('new_alert', alert);
  
  res.status(201).json(alert);
});

app.get('/api/feed', (req, res) => {
  res.json(db.feed);
});

app.post('/api/feed', (req, res) => {
  const feedItem = { ...req.body, timestamp: new Date(req.body.timestamp).toISOString() };
  replaceDataItem('feed', feedItem, db);
  saveData(DB_PATH, db);
  
  // Emit new_feed event to all connected clients
  console.log('EMITTING FEED:', feedItem.id);
  io.emit('new_feed', feedItem);
  
  res.status(201).json(feedItem);
});

// =================== DB2: FEEDBACK HISTORY (Random tweets) ===================

app.get('/api/feedback-history', (req, res) => {
  res.json(db2.feedbackHistory || []);
});

app.post('/api/feedback-history', (req, res) => {
  const feedback = { 
    ...req.body, 
    timestamp: new Date(req.body.timestamp).toISOString(),
    type: 'random_tweet',
    reason: 'Not disaster-related'
  };
  if (!db2.feedbackHistory) db2.feedbackHistory = [];
  db2.feedbackHistory.unshift(feedback);
  
  // Update summary
  if (!db2.filteredSummary) db2.filteredSummary = { totalFiltered: 0, successfulFilter: 0, filterRate: '0%' };
  db2.filteredSummary.totalFiltered = db2.feedbackHistory.length;
  db2.filteredSummary.successfulFilter = db2.feedbackHistory.filter(f => f.edgeFilterResult).length;
  db2.filteredSummary.filterRate = ((db2.filteredSummary.successfulFilter / db2.filteredSummary.totalFiltered) * 100).toFixed(1) + '%';
  
  saveData(DB2_PATH, db2);
  res.status(201).json(feedback);
});

app.get('/api/feedback-summary', (req, res) => {
  res.json(db2.filteredSummary || { totalFiltered: 0, successfulFilter: 0, filterRate: '0%' });
});

// =================== DB3: PROCESSING LOGS ===================

app.get('/api/logs', (req, res) => {
  res.json(db3.processingLogs || []);
});

app.post('/api/logs', (req, res) => {
  const log = { ...req.body, timestamp: new Date(req.body.timestamp).toISOString() };
  if (!db3.processingLogs) db3.processingLogs = [];
  db3.processingLogs.unshift(log);
  
  // Update summary
  if (!db3.logSummary) db3.logSummary = { totalProcessed: 0, successfulAlerts: 0, filteredOut: 0 };
  if (log.stage === 'edge_filter' && log.result.includes('Filtered out')) {
    db3.logSummary.filteredOut++;
  } else if (log.stage === 'queue_distribution') {
    db3.logSummary.successfulAlerts++;
  }
  db3.logSummary.totalProcessed = Math.ceil(db3.processingLogs.length / 4); // Assuming 4 stages per alert
  
  saveData(DB3_PATH, db3);
  
  // Emit processing_update event to all connected clients
  console.log('EMITTING PROCESSING UPDATE:', log.id, log.stage);
  io.emit('processing_update', { log, summary: db3.logSummary });
  
  res.status(201).json(log);
});

app.get('/api/logs-summary', (req, res) => {
  res.json(db3.logSummary || { totalProcessed: 0, successfulAlerts: 0, filteredOut: 0 });
});

// =================== DB1: LEGACY ENDPOINTS ===================

app.get('/api/dispatches', (req, res) => {
  res.json(db.dispatches || []);
});

app.post('/api/dispatches', (req, res) => {
  const dispatch = { ...req.body, timestamp: new Date(req.body.timestamp).toISOString() };
  replaceDataItem('dispatches', dispatch, db);
  saveData(DB_PATH, db);
  res.status(201).json(dispatch);
});

// =================== RESET ENDPOINTS ===================

app.post('/api/reset', (req, res) => {
  db = { alerts: [], feed: [], logs: [], dispatches: [] };
  db2 = { feedbackHistory: [], filteredSummary: { totalFiltered: 0, successfulFilter: 0, filterRate: '0%' } };
  db3 = { processingLogs: [], logSummary: { totalProcessed: 0, successfulAlerts: 0, filteredOut: 0 } };
  saveData(DB_PATH, db);
  saveData(DB2_PATH, db2);
  saveData(DB3_PATH, db3);
  res.json({ status: 'reset', databases: ['db.json', 'db2.json', 'db3.json'] });
});

// =================== STATUS ENDPOINT ===================

app.get('/api/status', (req, res) => {
  res.json({
    db1: { alerts: db.alerts?.length || 0, feed: db.feed?.length || 0 },
    db2: { feedbackHistory: db2.feedbackHistory?.length || 0 },
    db3: { logs: db3.processingLogs?.length || 0 }
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
  console.log(`Socket.IO enabled on ws://localhost:${PORT}`);
  console.log(`DB1 (Alerts/Feed): ${DB_PATH}`);
  console.log(`DB2 (Feedback History): ${DB2_PATH}`);
  console.log(`DB3 (Processing Logs): ${DB3_PATH}`);
});
