# Development Guide

This document provides instructions for setting up and running the Manufacturing Operations Management System.

## System Architecture

The system consists of multiple components:

1. **Backend Server** (Node.js/Express) - API and business logic
2. **Main Frontend** (React) - Web dashboard for managers
3. **Machine Tablet Interface** (React) - Touch-optimized for machine operators
4. **Stock Management Tablet** (React) - Touch-optimized for warehouse staff
5. **AI Service** (Optional) - AI-powered analytics

## Prerequisites

- Node.js (v18+)
- npm or yarn
- Git

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd go-backend
npm install  # Install root dependencies if any
```

### 2. Environment Setup

Copy the environment example:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

- Database connection details
- API keys for external services
- JWT secrets
- Port configurations

### 3. Start the Backend Server

```bash
cd server
npm install
npm run dev
```

The server will run on `http://localhost:3001`

### 4. Start the Main Frontend (Web Dashboard)

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:3000`

### 5. Start the Machine Tablet Interface

```bash
cd machine-tablet
npm install
npm run dev
```

The machine tablet will run on `http://localhost:3001` (note: same port as server but different path)

### 6. Start the Stock Management Tablet

```bash
cd stock-tablet
npm install
npm run dev
```

The stock tablet will run on `http://localhost:3002`

### 7. Optional: Start AI Service

```bash
cd ai-service
npm install
npm run dev
```

## Development Workflow

### Port Configuration

- **Backend API**: `http://localhost:3001`
- **Main Frontend**: `http://localhost:3000`
- **Machine Tablet**: `http://localhost:3001/machine` (served by backend)
- **Stock Tablet**: `http://localhost:3002`
- **AI Service**: `http://localhost:3003`

### Running Multiple Components

You can run all components simultaneously. Open multiple terminal windows/tabs:

```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Main Frontend
cd frontend && npm run dev

# Terminal 3 - Machine Tablet
cd machine-tablet && npm run dev

# Terminal 4 - Stock Tablet
cd stock-tablet && npm run dev
```

### Development URLs

- **Manager Dashboard**: http://localhost:3000
- **Machine Operator Interface**: http://localhost:3001/machine
- **Stock Management Interface**: http://localhost:3002

## Component Details

### Backend Server (`/server`)

- Express.js API server
- Socket.io for real-time updates
- Database integration
- Authentication middleware
- Job management endpoints
- Stock management endpoints

### Main Frontend (`/frontend`)

- React dashboard for managers
- Job monitoring and assignment
- Analytics and reporting
- User management

### Machine Tablet Interface (`/machine-tablet`)

- Touch-optimized React app
- Large buttons and simplified UI
- Job queue management
- Photo capture for job documentation
- Real-time job status updates

### Stock Management Tablet (`/stock-tablet`)

- Touch-optimized React app for warehouse staff
- Stock entry forms with barcode scanning
- Inventory management
- Stock level alerts
- Photo documentation for stock items

## Database Setup

1. Install your database (PostgreSQL, MySQL, or MongoDB)
2. Create the database
3. Update connection details in `.env`
4. Run migrations:
   ```bash
   cd server
   npm run migrate
   ```

## API Documentation

The API documentation is available at:

- `http://localhost:3001/api-docs` (when server is running)

## Testing

### Unit Tests

```bash
# Backend tests
cd server && npm test

# Frontend tests
cd frontend && npm test

# Machine tablet tests
cd machine-tablet && npm test

# Stock tablet tests
cd stock-tablet && npm test
```

### Integration Tests

```bash
cd test && npm test
```

## Building for Production

### Backend

```bash
cd server
npm run build
npm start
```

### Frontend Applications

```bash
# Main frontend
cd frontend
npm run build

# Machine tablet
cd machine-tablet
npm run build

# Stock tablet
cd stock-tablet
npm run build
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure no other services are running on ports 3000-3003
2. **Database Connection**: Verify database is running and connection details are correct
3. **Environment Variables**: Check all required environment variables are set
4. **Node Version**: Ensure you're using Node.js v18+

### Logs

- Backend logs: Check server console output
- Frontend logs: Check browser developer console
- Application logs: Check `logs/` directory if configured

### Reset Development Environment

```bash
# Clear all node_modules and reinstall
find . -name "node_modules" -type d -prune -exec rm -rf {} +
find . -name "package-lock.json" -delete

# Reinstall dependencies
cd server && npm install
cd ../frontend && npm install
cd ../machine-tablet && npm install
cd ../stock-tablet && npm install
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Update documentation
5. Submit a pull request

## Architecture Notes

### Real-time Updates

- Socket.io connections for live job status updates
- Automatic synchronization between tablets and dashboard
- Connection status monitoring and auto-reconnection

### Authentication

- JWT-based authentication
- Role-based access control
- Separate login flows for different user types

### Data Flow

- Backend API serves all data
- Tablets maintain local state with real-time sync
- Optimistic updates for better UX
- Offline capability with sync when reconnected
