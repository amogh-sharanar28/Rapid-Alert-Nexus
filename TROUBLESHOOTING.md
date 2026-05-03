# Troubleshooting Guide - Activity Logs & Status Updates

## Issue: Activity Logs Empty or Not Updated in Dispatch History

### Symptoms
- ❌ Update response on Response Console (change status to "On Scene")
- ❌ Go to Dispatch History
- ❌ Activity log section is empty OR shows old data
- ❌ After refresh, updates disappear

---

## Root Cause Diagnosis

### Check 1: Is the Backend Running?

```bash
# In terminal, check if backend is running
curl http://localhost:4000/api/health

# Expected response:
# { "status": "ok", "timestamp": "..." }
```

**If not running:**
```bash
cd backend
npm install  # if first time
npm start
# Should see: 🚀 Backend API running on http://localhost:4000
```

---

### Check 2: Is the Frontend Connected to WebSocket?

**In browser (Response Console page):**
1. Open Developer Tools (F12)
2. Go to **Console** tab
3. Look for messages like:
   ```
   ✅ Socket connected: [long-id]
   📨 RECEIVED TEAM RESPONSE via WebSocket: ...
   📨 RECEIVED DISPATCH LOG via WebSocket: ...
   ```

**If you see connection errors:**
```
❌ Socket connection error: ...
❌ Socket disconnected: ...
```

**Solution:**
- Check backend is running on `http://localhost:4000`
- Check CORS settings in `backend/server.js` - should include `http://localhost:5173`
- Restart browser/app

---

### Check 3: Are Logs Being Saved to Database?

**Look at the backend data files:**

```bash
# Check if dispatch logs are being created
cat backend/data/db.json | grep -A 20 "dispatchLogs"

# Should see entries like:
# "dispatchLogs": [
#   { "id": "log-...", "dispatchId": "...", "action": "status_update", ... }
# ]
```

**If db.json doesn't exist or is empty:**
```bash
# Reset the database
curl -X POST http://localhost:4000/api/reset

# Should respond: { "status": "reset" }
```

---

### Check 4: Test the Full Flow Manually

#### Step A: Create a Dispatch
```bash
curl -X POST http://localhost:4000/api/dispatches \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-dispatch-1",
    "alertId": "alert-123",
    "location": "Main Street",
    "incidentType": "fire",
    "criticality": "HIGH",
    "notes": "Test dispatch",
    "assignedRoles": ["fire_department"],
    "teamAssignments": [{"role": "fire_department", "status": "not_started"}],
    "coordinationNotes": [],
    "peopleAffected": 5,
    "status": "pending",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'
  }'
```

**Response should include:** `"id": "test-dispatch-1"`

#### Step B: Get All Dispatch Logs
```bash
curl http://localhost:4000/api/dispatch-logs

# Should respond with empty array (no logs yet):
# []
```

#### Step C: Create a Response
```bash
curl -X POST http://localhost:4000/api/responses \
  -H "Content-Type: application/json" \
  -d '{
    "id": "response-1",
    "dispatchReportId": "test-dispatch-1",
    "alertId": "alert-123",
    "respondingRole": "fire_department",
    "teamLeader": "John Doe",
    "teamSize": 5,
    "eta": "5 mins",
    "equipmentDeployed": "2 trucks",
    "currentStatus": "en_route",
    "situationUpdate": "Heading to scene",
    "casualties": 0,
    "rescued": 0,
    "hazards": "None identified",
    "accessRoute": "Via Main Street",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'
  }'
```

#### Step D: Create a Dispatch Log Entry
```bash
curl -X POST http://localhost:4000/api/dispatch-logs \
  -H "Content-Type: application/json" \
  -d '{
    "id": "log-1",
    "dispatchId": "test-dispatch-1",
    "action": "status_update",
    "details": "Fire Department → en_route",
    "role": "fire_department",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'
  }'
```

#### Step E: Verify Log Was Saved
```bash
curl http://localhost:4000/api/dispatch-logs

# Should now return:
# [{"id": "log-1", "dispatchId": "test-dispatch-1", ...}]
```

---

## Solution Checklist

### Issue: Updates Not Appearing Immediately

✅ **Check 1:** WebSocket connected?
```
Look for "✅ Socket connected" in browser console
```

✅ **Check 2:** Backend receiving POST requests?
```
Look for "EMITTING DISPATCH LOG" in backend console
```

✅ **Check 3:** Frontend listening for WebSocket events?
```
Look for "📨 RECEIVED DISPATCH LOG via WebSocket" in browser console
```

**If any of these is missing → Fix it before proceeding**

---

### Issue: Updates Not Persisting After Refresh

✅ **Check 1:** Response posted to backend?
```bash
# Check server logs for:
EMITTING TEAM RESPONSE: [id] [role] [status]
```

✅ **Check 2:** Data in backend database?
```bash
cat backend/data/db.json | grep -A 5 '"responses"'
# Should show responses array with your update
```

✅ **Check 3:** Dispatch logs saved?
```bash
cat backend/data/db.json | grep -A 5 '"dispatchLogs"'
# Should show log entries with your updates
```

**If data not in db.json → Backend not persisting properly**

---

### Issue: "Activity Logs" Section Empty in History Page

✅ **Step 1:** Verify dispatch exists
```
Go to Dispatch History → Look for your dispatch
If not visible, no dispatches were created yet
```

✅ **Step 2:** Expand dispatch
```
Click expand button (▼) on dispatch card
Should see "Coordination Notes" and "Activity Log" sections
```

✅ **Step 3:** Check if logs exist
```bash
# Terminal:
curl http://localhost:4000/api/dispatch-logs | jq length
# Should show number > 0
```

✅ **Step 4:** Verify log matches dispatch
```bash
# Terminal - check dispatchId of logs match your dispatch
curl http://localhost:4000/api/dispatch-logs | jq '.[0].dispatchId'
```

---

## Quick Fixes

### Fix 1: Restart Everything

```bash
# Terminal 1 (Backend)
cd backend
npm start

# Terminal 2 (Frontend)  
npm run dev

# Terminal 3 (Browser)
Navigate to http://localhost:5173
```

### Fix 2: Reset All Data

```bash
# This clears all databases and starts fresh
curl -X POST http://localhost:4000/api/reset
```

**Then:**
1. Refresh browser
2. Create new dispatch
3. Submit response
4. Check history

### Fix 3: Clear Browser Cache

```
DevTools (F12) → Application → Storage → Clear Site Data
Or: Ctrl+Shift+Delete → Clear browsing data
```

---

## Testing After Fix

### Test 1: Create Response ✅
1. Go to **Response Console**
2. Select team role
3. Click "Respond" on dispatch
4. Fill all fields
5. **Verify in browser console:**
   ```
   ✅ "Response updated — History page updated live"
   ```

### Test 2: Check Backend Received Data ✅
1. **In server console, look for:**
   ```
   EMITTING TEAM RESPONSE: [id] fire_department en_route
   EMITTING DISPATCH LOG: [id] status_update
   ```

### Test 3: Check WebSocket Broadcast ✅
1. **In browser console, look for:**
   ```
   📨 RECEIVED TEAM RESPONSE via WebSocket: ... fire_department en_route
   📨 RECEIVED DISPATCH LOG via WebSocket: ... status_update
   ```

### Test 4: View in History Page ✅
1. Go to **Dispatch History**
2. Find your dispatch
3. **Expand it**
4. **Activity Log should show:**
   - Time
   - Action (e.g., "status_update")
   - Details (e.g., "fire_department → en_route")

### Test 5: Page Refresh Persistence ✅
1. On Dispatch History, view a dispatch
2. **Refresh page (F5)**
3. Go back to Dispatch History
4. **Activity logs still visible?**
   - ✅ Yes → Data is persisting
   - ❌ No → Check `backend/data/db.json` is being saved

---

## Advanced Debugging

### Enable Verbose Logging

**Frontend (browser console):**
```javascript
// Check what's in React state
// Open DevTools Console and paste:
JSON.stringify(dispatchedReports[0], null, 2)
JSON.stringify(dispatchLogs[0], null, 2)
```

**Backend (server console):**
```javascript
// Already logs all events to console
// Look for timestamps to match UI actions
```

### Check Network Requests

1. **DevTools → Network tab**
2. **Filter by XHR/Fetch**
3. **Perform an action (update response)**
4. **Should see:**
   - `POST /api/responses` → Status 201
   - `POST /api/dispatch-logs` → Status 201

### Monitor WebSocket Messages

1. **DevTools → Network tab**
2. **Look for "ws" protocol** (might be collapsed)
3. **Expand WebSocket connection**
4. **Look for Messages:**
   ```
   ← team_response_update: {...}
   ← dispatch_log_update: {...}
   ```

---

## Common Error Messages & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `ECONNREFUSED :4000` | Backend not running | `npm start` in backend dir |
| `POST /api/responses 404` | Endpoint doesn't exist | Update to latest code |
| `WebSocket connection failed` | CORS or backend down | Restart backend, check CORS |
| `Activity log empty` | No logs created | Need to update response status |
| `Data gone after refresh` | Backend not persisting | Check `db.json` file exists and is writable |

---

## Still Not Working?

### Provide This Info

If issue persists, collect and share:

1. **Browser console output** (F12 → Console tab)
   - Look for any red error messages
   
2. **Backend console output**
   ```bash
   # Show last 20 lines
   # Look for EMITTING messages and errors
   ```

3. **Database state**
   ```bash
   cat backend/data/db.json | head -100
   ```

4. **Steps to reproduce**
   - Exactly what you clicked
   - What you expected
   - What you got instead

---

## Summary: Working System Indicators

✅ **You know it's working when you see:**
- Response Console shows "Response updated — History page updated live"
- Backend logs show `EMITTING TEAM RESPONSE` and `EMITTING DISPATCH LOG`
- Browser console shows `📨 RECEIVED ... via WebSocket`
- Dispatch History Activity Log shows entries
- After refresh, Activity Log entries still visible
- Both tabs/users see updates in real-time

**If any of these is missing, follow the diagnosis section above.**
