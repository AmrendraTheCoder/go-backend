# Manufacturing Operations Management System

A comprehensive system for managing manufacturing operations, including job tracking, inventory management, and real-time monitoring across multiple interfaces.

## 🏗️ System Overview

This system consists of multiple integrated components designed for different user roles:

- **📊 Manager Dashboard** - Web interface for supervisors and managers
- **🏭 Machine Tablet Interface** - Touch-optimized interface for machine operators
- **📦 Stock Management Tablet** - Touch-optimized interface for warehouse staff
- **🔧 Backend API** - Central server handling all business logic and data
- **🤖 AI Service** - Optional AI-powered analytics and insights

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git

### 1. Clone the Repository

```bash
git clone <repository-url>
cd go-backend
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start All Components

Open 4 separate terminal windows and run:

```bash
# Terminal 1 - Backend API Server
cd server
npm install
npm run dev
# Runs on http://localhost:3001

# Terminal 2 - Manager Dashboard
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000

# Terminal 3 - Machine Tablet Interface
cd machine-tablet
npm install
npm run dev
# Runs on http://localhost:3001/machine

# Terminal 4 - Stock Management Tablet
cd stock-tablet
npm install
npm run dev
# Runs on http://localhost:3002
```

## 🎯 Access Points

| Interface             | URL                            | Users                 | Purpose                                        |
| --------------------- | ------------------------------ | --------------------- | ---------------------------------------------- |
| **Manager Dashboard** | http://localhost:3000          | Supervisors, Managers | Job monitoring, analytics, user management     |
| **Machine Interface** | http://localhost:3001/machine  | Machine Operators     | Job queue, status updates, photo documentation |
| **Stock Interface**   | http://localhost:3002          | Warehouse Staff       | Inventory management, stock entry, alerts      |
| **API Documentation** | http://localhost:3001/api-docs | Developers            | API endpoints and documentation                |

## 📱 User Interfaces

### Manager Dashboard (`/frontend`)

- **Technology**: React, Tailwind CSS, Socket.io
- **Features**: Job assignment, real-time monitoring, analytics, reporting
- **Users**: Supervisors, Plant Managers, Quality Control

### Machine Tablet Interface (`/machine-tablet`)

- **Technology**: React, Touch-optimized UI, PWA
- **Features**: Job queue, photo capture, status updates, offline support
- **Users**: Machine Operators, Production Workers
- **Optimization**: Large touch targets, simplified workflow, landscape mode

### Stock Management Tablet (`/stock-tablet`)

- **Technology**: React, Touch-optimized UI, Barcode scanning
- **Features**: Stock entry, inventory management, alerts, photo documentation
- **Users**: Warehouse Staff, Inventory Managers, QC Personnel
- **Optimization**: Tablet-friendly forms, quick entry, real-time sync

## 🏗️ Architecture

### Backend (`/server`)

- **Framework**: Node.js + Express
- **Real-time**: Socket.io for live updates
- **Database**: PostgreSQL/MySQL/MongoDB
- **Authentication**: JWT-based with role management
- **APIs**: RESTful endpoints for all operations

### Data Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Manager Web    │    │  Machine Tablet │    │  Stock Tablet   │
│  Dashboard      │    │  Interface      │    │  Interface      │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │     Backend API Server    │
                    │   (Express + Socket.io)   │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │        Database           │
                    │  (Jobs, Users, Inventory) │
                    └───────────────────────────┘
```

## 📋 Features by Interface

### Manager Dashboard

- ✅ Job creation and assignment
- ✅ Real-time job monitoring
- ✅ Machine status tracking
- ✅ Analytics and reporting
- ✅ User management
- ✅ Production metrics

### Machine Tablet

- ✅ Touch-optimized job queue
- ✅ Job status controls (start/pause/complete)
- ✅ Photo capture for documentation
- ✅ Real-time updates
- ✅ Offline capability
- ✅ Large button UI for industrial use

### Stock Management Tablet

- ✅ Stock item entry forms
- ✅ Inventory browsing and search
- ✅ Stock level adjustments
- ✅ Low stock alerts
- ✅ Barcode scanning support
- ✅ Photo documentation
- ✅ Real-time synchronization

## 🔧 Development

### Project Structure

```
go-backend/
├── server/              # Backend API server
├── frontend/            # Manager web dashboard
├── machine-tablet/      # Machine operator interface
├── stock-tablet/        # Stock management interface
├── ai-service/          # AI analytics service
├── docs/               # Documentation
├── test/               # Integration tests
└── .taskmaster/        # Project management
```

### Technology Stack

- **Frontend**: React 18, Tailwind CSS, Zustand, React Router
- **Backend**: Node.js, Express, Socket.io, JWT
- **Database**: PostgreSQL (configurable)
- **Real-time**: WebSocket connections
- **Build**: Vite, ESLint, Modern JS

### Development Workflow

1. Start backend server first (`cd server && npm run dev`)
2. Start frontend applications as needed
3. All apps support hot reload and live updates
4. Check `/docs/DEVELOPMENT.md` for detailed setup

## 🧪 Demo Credentials

### Machine Operators

- **Email**: `operator@machine1.com`
- **Password**: `operator123`
- **Machine**: Machine #1

### Stock Managers

- **Email**: `demo@stockmanager.com`
- **Password**: `demo123`
- **Warehouse**: Warehouse A

### Supervisors

- **Email**: `supervisor@plant.com`
- **Password**: `supervisor123`

## 📊 Real-time Features

- **Live Job Updates**: Status changes sync across all interfaces
- **Connection Monitoring**: Automatic reconnection and offline support
- **Push Notifications**: Alerts for critical events
- **Multi-user Sync**: Changes by one user instantly visible to others

## 🔒 Security

- JWT-based authentication
- Role-based access control
- Secure API endpoints
- Environment variable configuration
- Input validation and sanitization

## 📖 Documentation

- **[Development Guide](docs/DEVELOPMENT.md)** - Setup and development instructions
- **[API Documentation](http://localhost:3001/api-docs)** - When server is running
- **[Stock Tablet README](stock-tablet/README.md)** - Stock management interface docs
- **[Machine Tablet README](machine-tablet/README.md)** - Machine interface docs

## 🚀 Deployment

### Development

Each component runs on its own port during development for easy testing and debugging.

### Production

```bash
# Build all components
cd frontend && npm run build
cd ../machine-tablet && npm run build
cd ../stock-tablet && npm run build
cd ../server && npm run build

# Deploy to your hosting platform
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software for manufacturing operations management.

## 🆘 Support

For support and questions:

- Check the documentation in `/docs`
- Review component-specific README files
- Create an issue for bug reports or feature requests

---

**Ready to get started?** Follow the Quick Start guide above to run the system locally!
