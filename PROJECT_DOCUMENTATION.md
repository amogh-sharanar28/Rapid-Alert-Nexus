# Rapid Alert Nexus - Disaster Response Command Platform

## Project Overview

**Rapid Alert Nexus** is a real-time disaster response simulation platform that demonstrates how 5G-style communication principles can revolutionize emergency response coordination. The platform simulates disaster alerts from social media feeds (tweets), processes them through an AI-powered pipeline, and distributes role-based notifications to appropriate responder teams.

### Key Features
- **Ultra-Low Latency Processing**: Edge-filtered alerts processed in <500ms
- **Event-Driven Architecture**: Pub/Sub message queue distribution system
- **Role-Based Access Control**: Filtered views for different responder teams (Fire, Police, Medical, Flood Rescue)
- **Real-Time Simulation**: Live tweet stream generation with disaster scenarios
- **Interactive Dashboard**: Heatmap visualization and alert management
- **Multi-Source Input**: Support for tweets, manual reports, and image uploads
- **40+ Indian Cities Database**: Comprehensive coverage with real geographic coordinates
- **Fuzzy Location Matching**: Intelligent city name matching with typo correction (Levenshtein distance)
- **Multi-Database Architecture**: Separate storage for alerts (db.json), feedback (db2.json), and processing logs (db3.json)
- **Complete Audit Trail**: Every data item tracked through the entire processing pipeline

## Project Structure

```
rapid-alert-nexus-main/
├── backend/                          # Node.js/Express API server
│   ├── package.json                 # Backend dependencies
│   ├── server.js                    # Main server file
│   └── data/
│       ├── db.json                  # Primary database (alerts and feed)
│       ├── db2.json                 # Feedback history database
│       └── db3.json                 # Processing logs database
├── src/                             # React frontend application
│   ├── components/                  # Reusable UI components
│   │   ├── ui/                      # Shadcn/ui components
│   │   ├── AlertHeatMap.tsx         # Interactive map component
│   │   ├── DispatchReportDialog.tsx # Report dispatch modal
│   │   ├── NavLink.tsx              # Navigation link component
│   │   ├── StatsPanel.tsx           # Dashboard statistics
│   │   └── TopNav.tsx               # Top navigation bar
│   ├── context/
│   │   └── SimulationContext.tsx    # Global state management
│   ├── hooks/                       # Custom React hooks
│   ├── lib/
│   │   ├── simulation-data.ts       # Tweet generation and AI classification
│   │   └── utils.ts                 # Utility functions
│   ├── pages/                       # Main application pages
│   │   ├── DashboardPage.tsx        # Main command dashboard
│   │   ├── DataInputPage.tsx        # Simulation control and manual input
│   │   ├── HomePage.tsx             # Landing page
│   │   ├── ProcessingPage.tsx       # Processing pipeline visualization
│   │   └── NotFound.tsx             # 404 page
│   ├── types/
│   │   └── simulation.ts            # TypeScript type definitions
│   ├── App.css                      # Global styles
│   ├── App.tsx                      # Main application component
│   ├── index.css                    # Base styles
│   └── main.tsx                     # Application entry point
├── public/                          # Static assets
├── package.json                     # Frontend dependencies and scripts
├── vite.config.ts                   # Vite configuration
├── tailwind.config.ts               # Tailwind CSS configuration
├── tsconfig.json                    # TypeScript configuration
├── eslint.config.js                 # ESLint configuration
└── README.md                        # Project documentation
```

## Technology Stack

### Frontend
- **React 18.3.1**: Modern React with hooks and concurrent features
- **TypeScript 5.8.3**: Type-safe JavaScript
- **Vite 5.4.19**: Fast build tool and development server
- **Tailwind CSS 3.4.17**: Utility-first CSS framework
- **Shadcn/ui**: High-quality UI component library
- **React Router 6.30.1**: Client-side routing
- **React Query 5.83.0**: Data fetching and caching
- **Framer Motion 12.35.2**: Animation library
- **Leaflet 1.9.4**: Interactive maps
- **React Leaflet 4.2.1**: React wrapper for Leaflet
- **Recharts 2.15.4**: Chart library
- **React Hook Form 7.61.1**: Form handling
- **Zod 3.25.76**: Schema validation

### Backend
- **Node.js**: JavaScript runtime
- **Express 4.18.2**: Web framework
- **CORS 2.8.5**: Cross-origin resource sharing

### Development Tools
- **ESLint 9.32.0**: Code linting
- **Vitest 3.2.4**: Unit testing
- **Playwright 1.57.0**: End-to-end testing
- **Concurrently 8.2.0**: Run multiple scripts simultaneously

## Architecture Overview

### System Architecture
The platform follows a **microservices-inspired architecture** with separate frontend and backend components:

1. **Frontend (React SPA)**: User interface and client-side logic
2. **Backend (Express API)**: RESTful API server with JSON file storage
3. **Simulation Engine**: Client-side tweet generation and processing

### Data Flow
```
Tweet Generation → Edge Filtering → AI Analysis → Alert Creation → Queue Distribution → Role-Based Display
```

### Processing Pipeline
1. **Edge Filtering**: Keyword-based filtering of incoming data
2. **AI Analysis**: NLP classification of disaster types and priority assignment
3. **Alert Generation**: Structured alert creation with location geocoding
4. **Queue Distribution**: Pub/Sub-style distribution to responder channels

## Core Components

### SimulationContext (`src/context/SimulationContext.tsx`)
**Purpose**: Global state management for the entire application
**Key Features**:
- Manages alerts, processing logs, feed items, and dispatch reports
- Handles simulation start/stop functionality
- Provides API integration with backend
- Implements role-based filtering

**Main Functions**:
- `startSimulation()`: Begins automated tweet generation
- `stopSimulation()`: Stops the simulation
- `addManualReport()`: Adds user-submitted reports
- `addImageReport()`: Processes image-based reports
- `addDispatchReport()`: Records dispatch actions

### Simulation Data Engine (`src/lib/simulation-data.ts`)
**Purpose**: Generates realistic disaster scenarios and processes incoming data
**Key Features**:
- **40+ Indian Cities Database**: Comprehensive location coverage across India with real coordinates
- **Fuzzy Location Matching**: Levenshtein distance algorithm for intelligent city name matching (e.g., "Banglore" → "Bangalore")
- **Disaster Type Classification**: Fire, flood, earthquake, rescue, medical, infrastructure, and storm scenarios
- **Realistic Tweet Generation**: 70% emergency tweets from templates + 30% random non-emergency content
- **Processing Log Creation**: Complete pipeline tracking for visualization

**Data Structures**:
- **LOCATIONS**: Array of 40+ major Indian cities with coordinates and disaster vulnerabilities
- **DISASTER_TEMPLATES**: Tweet templates for different disaster types
- **RANDOM_TWEETS**: Non-emergency content for realistic simulation
- **Levenshtein Distance Algorithm**: For fuzzy string matching and typo correction

### Backend API (`backend/server.js`)
**Purpose**: RESTful API server for multi-database data persistence
**Architecture**: 
- **Multi-Database Storage**: Separates data into three JSON files for better organization
  - **db.json**: Primary alerts and feed items
  - **db2.json**: Feedback history and edge-filtered items
  - **db3.json**: Processing logs for audit and monitoring
  
**Endpoints**:

**Primary Database (Alerts & Feed)**:
- `GET /api/health`: Health check
- `GET/POST /api/alerts`: Alert management (stored in db.json)
- `GET/POST /api/feed`: Feed item management (stored in db.json)
- `GET/POST /api/dispatches`: Dispatch report management (stored in db.json)

**Feedback Database (db2.json)**:
- `GET/POST /api/feedback-history`: Feedback and edge-filtered item management
- `GET /api/feedback-summary`: Aggregate statistics for feedback data

**Processing Logs Database (db3.json)**:
- `GET/POST /api/logs`: Processing pipeline logs
- `GET /api/logs-summary`: Aggregate statistics for processing logs
- `GET /api/status`: Real-time status showing counts from all three databases

**System**:
- `POST /api/reset`: Reset all three databases

**Storage**: JSON file-based database with three separate files for scalability

## Key Pages and Components

### HomePage (`src/pages/HomePage.tsx`)
**Purpose**: Landing page with system overview
**Features**:
- Hero section with project description
- Module navigation cards
- Feature highlights (latency, event-driven, role-based access)
- Call-to-action buttons

### DashboardPage (`src/pages/DashboardPage.tsx`)
**Purpose**: Main command center for emergency response
**Features**:
- Role-based filtering (All Teams, Fire Dept, Flood Rescue, Medical, Police)
- Real-time alert feed
- Interactive heatmap visualization
- Statistics panel
- Dispatch report functionality

### DataInputPage (`src/pages/DataInputPage.tsx`)
**Purpose**: Simulation control and manual data input
**Features**:
- Start/stop simulation controls
- Manual report submission
- Image upload simulation
- Live feed display

### ProcessingPage (`src/pages/ProcessingPage.tsx`)
**Purpose**: Visualization of the AI processing pipeline
**Features**:
- Real-time processing log display
- Pipeline stage visualization (Edge Filter → AI Analysis → Alert Generation → Queue Distribution)
- Color-coded priority indicators

### AlertHeatMap (`src/components/AlertHeatMap.tsx`)
**Purpose**: Geographic visualization of active alerts
**Features**:
- Leaflet-based interactive map
- Alert markers with priority-based styling
- Popup details for each alert
- Responsive design

### StatsPanel (`src/components/StatsPanel.tsx`)
**Purpose**: Dashboard statistics and metrics
**Features**:
- Total alerts count
- Priority breakdown (Critical, High, Medium, Low)
- Incident type distribution
- Active simulation status

## Data Models

### Alert (db.json)
```typescript
interface Alert {
  id: string;
  priority: Priority; // CRITICAL | HIGH | MEDIUM | LOW
  incidentType: IncidentType; // fire | flood | earthquake | rescue | medical | infrastructure | storm
  location: string;
  description: string;
  timestamp: Date;
  coordinates: { lat: number; lng: number };
  sourceType: DataSourceType; // tweet | image | manual_report
  sourceId: string;
  responderRoles: ResponderRole[]; // Role-based distribution
}
```

### ProcessingLog (db3.json)
```typescript
interface ProcessingLog {
  id: string;
  timestamp: Date;
  source: DataSourceType;
  sourceId: string;
  stage: 'edge_filter' | 'ai_analysis' | 'alert_generation' | 'queue_distribution';
  message: string;
  result?: string;
  priority?: Priority;
  incidentType?: IncidentType;
}
```

### FeedbackHistory (db2.json)
```typescript
interface FeedbackHistory {
  id: string;
  type: string; // Type of feedback (filtered tweet, edge-case)
  content: string;
  author?: string;
  timestamp: Date;
  location?: string;
  edgeFilterResult: string; // Reason for filtering
  reason: string;
}
```

### FeedItem (db.json)
```typescript
interface FeedItem {
  id: string;
  type: DataSourceType;
  content: string;
  timestamp: Date;
  location?: string;
}
```

### DispatchReport (db.json)
```typescript
interface DispatchReport {
  id: string;
  alertId: string;
  criticality: Priority;
  peopleAffected: number;
  location: string;
  coordinates: { lat: number; lng: number };
  incidentType: IncidentType;
  assignedRole: ResponderRole;
  notes: string;
  contactInfo?: string;
  resourcesNeeded?: string;
  timestamp: Date;
  status: 'pending' | 'dispatched' | 'acknowledged';
}
``````


## Simulation Logic

### Tweet Generation
- **70% Emergency Tweets**: Generated from disaster templates with real Indian cities
- **30% Random Tweets**: Non-emergency content for realistic simulation (filtered to db2.json)
- **40+ Indian Cities**: Comprehensive coverage of major cities across India with real coordinates
- **Disaster-Specific**: Each location has associated disaster vulnerabilities and templates

### AI Classification & Routing
- **Keyword Matching**: Identifies disaster-related content
- **Fuzzy Location Matching**: Levenshtein distance algorithm for intelligent city name matching
  - Handles misspellings (e.g., "Banglore" → "Bangalore", "Dlehi" → "Delhi")
  - Default tolerance distance for matching variations
- **Priority Assignment**: Based on incident type severity
- **Role Mapping**: Assigns appropriate responder teams
- **Data Routing**: 
  - Emergency alerts → db.json (/api/alerts)
  - Filtered/random tweets → db2.json (/api/feedback-history)
  - All processing stages → db3.json (/api/logs)

### Processing Pipeline
1. **Edge Filter**: Initial keyword screening (< 500ms)
   - Detects disaster keywords and relevance
   - Routes non-emergency items to db2.json
2. **AI Analysis**: NLP classification and priority assessment
   - Analyzes content severity and incident type
   - Logs all analysis to db3.json
3. **Alert Generation**: Structured alert creation with location geocoding
   - Applies fuzzy matching to find best city match
   - Creates formatted alert with coordinates
4. **Queue Distribution**: Pub/Sub-style message routing
   - Routes to appropriate responder channels
   - Stores dispatch logs for audit trail

## Installation and Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or bun

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd rapid-alert-nexus-main

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### Development
```bash
# Start both frontend and backend
npm run dev:all

# Or start separately
npm run dev:backend  # Terminal 1
npm run dev:frontend # Terminal 2
```

### Build for Production
```bash
npm run build
```

## Usage Guide

### Starting the Application
1. Run `npm run dev:all` to start both servers
2. Open http://localhost:5173 in your browser
3. Navigate to the Dashboard to see the command center

### Running the Simulation
1. Go to the "Data Input" page
2. Click "Start Simulation" to begin automated tweet generation
3. Watch alerts appear in real-time on the Dashboard
4. Use role filters to view team-specific alerts

### Manual Data Input
1. On the Data Input page, use the form to submit manual reports
2. Upload simulated images for processing
3. View processing logs on the Processing page

### Dispatching Reports
1. On the Dashboard, click "Send Report" on any alert
2. Fill out dispatch details in the modal
3. Reports are tracked and marked as dispatched

## API Reference

### Backend Endpoints

#### System Management
```
GET /api/health
Response: { status: "ok", timestamp: "ISO_DATE" }

GET /api/status
Response: { alerts: number, feedback: number, logs: number }

POST /api/reset
Response: { status: "reset" }
```

#### Primary Database (db.json) - Alerts & Feed
```
GET /api/alerts
POST /api/alerts
Body: Alert object

GET /api/feed
POST /api/feed
Body: FeedItem object

GET /api/dispatches
POST /api/dispatches
Body: DispatchReport object
```

#### Feedback Database (db2.json) - Filtered Content & History
```
GET /api/feedback-history
POST /api/feedback-history
Body: FeedbackHistory object

GET /api/feedback-summary
Response: { totalFeedback: number, byType: {...}, timestamps: [...] }
```

#### Processing Logs Database (db3.json) - Audit Trail
```
GET /api/logs
POST /api/logs
Body: ProcessingLog object

GET /api/logs-summary
Response: { totalLogs: number, byStage: {...}, byIncidentType: {...} }
```

## Configuration

### Multi-Database Architecture
The system uses three separate JSON files for different data types:

**db.json (Primary Database)**:
- Emergency alerts from processed content
- Real feed items submitted to system
- Dispatch reports from responders
- Purpose: Core operational data

**db2.json (Feedback Database)**:
- Filtered out non-emergency tweets
- Random content that failed edge filtering
- User feedback and history
- Purpose: Non-critical but informative content for analysis

**db3.json (Processing Logs)**:
- Complete audit trail of all processing stages
- Timestamps and stage information for each item
- Classification results and priority assessments
- Purpose: Traceability and monitoring of pipeline

### Environment Variables
- `VITE_API_BASE_URL`: Backend API URL (default: http://localhost:4000/api)
- `PORT`: Backend server port (default: 4000)
- `NODE_ENV`: Environment (development/production)

### Simulation Parameters
- **Tweet Generation Interval**: 3-6 seconds
- **Processing Delay**: 150ms between pipeline stages
- **Emergency/Random Split**: 70% emergency, 30% random
- **Max Stored Items**: 50 alerts, 50 feed items, 100 logs per database
- **Fuzzy Match Threshold**: Levenshtein distance ≤ 2 for city name matching

## Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npx playwright test
```

## Deployment

### Build Process
```bash
# Build frontend
npm run build

# Backend is ready to deploy as-is (server.js)
```

### Environment Setup
- Set `NODE_ENV=production`
- Configure backend port via `PORT` environment variable
- Ensure CORS is properly configured for production domains

## Contributing

### Code Style
- TypeScript strict mode enabled
- ESLint configuration for code quality
- Prettier for consistent formatting

### Development Workflow
1. Create feature branch
2. Make changes with proper TypeScript types
3. Run tests and linting
4. Submit pull request

## Performance Considerations

### Frontend Optimization
- Vite for fast development and optimized builds
- React Query for efficient data fetching
- Lazy loading of components
- Optimized bundle splitting

### Backend Optimization
- In-memory data storage for simulation
- Efficient JSON file operations
- CORS middleware for cross-origin requests

## Future Enhancements

### Potential Features
- Database export and analytics dashboard
- Real social media API integration (Twitter/X, Instagram, Reddit)
- Machine learning models for enhanced incident classification
- Multi-language support for Indian languages
- Mobile application with push notifications
- Real-time WebSocket notifications
- Advanced historical data analytics and reporting
- Integration with actual emergency services APIs
- Incident clustering and correlation
- Prediction models for disaster hotspots

### Architecture Improvements
- Database migration to PostgreSQL/MongoDB with proper indexing
- Message queue system (Apache Kafka/RabbitMQ) for scalability
- Microservices decomposition for independent scaling
- Container orchestration (Docker/Kubernetes)
- API rate limiting and OAuth 2.0 authentication
- GraphQL API alongside REST API
- Real-time data streaming with WebSockets
- Load balancing for high availability
- Database replication and backup systems

## Troubleshooting

### Common Issues

#### Backend Not Starting
- Check if port 4000 is available
- Ensure Node.js version compatibility
- Verify package installation in backend directory
- Check that all three database files exist in `backend/data/`

#### Frontend Build Errors
- Clear node_modules and reinstall
- Check TypeScript compilation errors
- Verify Vite configuration
- Run `npm run build` to check for build issues

#### Simulation Not Working
- Check browser console for API errors
- Verify backend is running on correct port (4000)
- Check network connectivity
- Ensure all three databases are being accessed via API `/api/status`

#### Map Not Loading
- Verify internet connection for tile servers
- Check Leaflet dependencies
- Ensure proper CSS imports
- Verify coordinates in LOCATIONS database

#### Data Not Storing in Correct Database
- Check `/api/status` endpoint to see database counts
- Verify that `shouldIgnore` flag is set correctly for random tweets
- Check backend logs for database write errors
- Ensure db files have write permissions

## Key Features & Implementation Details

### Comprehensive Indian Cities Database
The system includes 40+ major Indian cities with:
- Real geographic coordinates (latitude, longitude)
- City-specific disaster vulnerabilities
- Population and area information
- Multiple variants for fuzzy matching

**Covered Cities**: Delhi, Mumbai, Bangalore, Hyderabad, Chennai, Kolkata, Pune, Jaipur, Lucknow, Kanpur, Nagpur, Indore, Thane, Bhopal, Visakhapatnam, Patna, Vadodara, Ghaziabad, Ludhiana, Agra, Nashik, Aurangabad, Dhanbad, Amritsar, Navi Mumbai, Allahabad, Ranchi, Howrah, Coimbatore, Vijayawada, Jodhpur, Madurai, Raipur, Kota, Guwahati, Chandigarh, Solapur, Hubli, Mysore, and more.

### Fuzzy Location Matching (Levenshtein Distance)
- Handles misspelled city names automatically
- Corrects common typing errors in real-time
- Maintains high accuracy while being forgiving of input variations
- Distance threshold: Maximum 2 character differences for match

**Examples**:
- "Banglore" → "Bangalore"
- "Dlehi" → "Delhi"
- "Bombay" → "Mumbai"
- "Hydrabad" → "Hyderabad"

### Three-Database Separation Strategy
This architecture ensures:
- **Separation of Concerns**: Different data types in different files
- **Better Analytics**: Separate views for operational vs historical data
- **Scalability**: Easier to implement per-database partitioning in future
- **Audit Trail**: Complete processing logs for compliance
- **Performance**: Smaller, focused database files

### Real-Time Data Classification
The system classifies incoming data in real-time:
- **Incident Types**: Fire, Flood, Earthquake, Rescue, Medical, Infrastructure, Storm
- **Priority Levels**: CRITICAL, HIGH, MEDIUM, LOW
- **Responder Roles**: Fire Dept, Police, Medical, Flood Rescue, All Teams
- **Confidence Scoring**: Based on keyword density and context

### Processing Pipeline Transparency
Every item goes through a complete audit trail:
1. **Edge Filter Stage**: Initial content screening
2. **AI Analysis Stage**: Classification and priority assignment
3. **Alert Generation Stage**: Alert creation with coordinates
4. **Queue Distribution Stage**: Role-based routing
5. **Persistence**: Logged to db3.json for complete traceability

## License

This project is developed for educational and demonstration purposes, showcasing modern web development practices and disaster response system design.

## Contact

For questions or contributions, please refer to the project repository and issue tracker.

---

*This documentation provides a comprehensive overview of the Rapid Alert Nexus disaster response simulation platform. The system demonstrates cutting-edge concepts in real-time data processing, event-driven architecture, and role-based emergency coordination.*