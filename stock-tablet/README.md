# Stock Management Tablet Interface

A touch-optimized React application designed for warehouse staff to manage inventory operations on tablet devices.

## Features

- **Stock Entry**: Add new inventory items with comprehensive details
- **Inventory Management**: View and manage existing stock items
- **Stock Adjustments**: Adjust quantities and update stock levels
- **Low Stock Alerts**: Monitor items below minimum stock levels
- **Barcode Scanning**: Quick item identification and entry
- **Photo Documentation**: Capture photos for stock items
- **Real-time Sync**: Live updates across all connected devices
- **Offline Support**: Continue working when connectivity is lost

## Quick Start

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation & Running

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3002`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
stock-tablet/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── LoadingSpinner.jsx
│   │   └── Navbar.jsx
│   ├── pages/              # Main application pages
│   │   ├── StockEntry.jsx  # Add new stock items
│   │   ├── InventoryList.jsx # View all inventory
│   │   ├── StockAdjustment.jsx # Adjust stock levels
│   │   ├── StockAlerts.jsx # Low stock notifications
│   │   ├── LoginPage.jsx   # Authentication
│   │   └── Settings.jsx    # App configuration
│   ├── stores/             # State management (Zustand)
│   │   ├── authStore.js    # Authentication state
│   │   └── stockStore.js   # Inventory state
│   ├── services/           # API and external services
│   │   ├── apiClient.js    # HTTP API client
│   │   └── socketService.js # WebSocket connection
│   └── utils/              # Utility functions
├── public/                 # Static assets
└── package.json
```

## Key Components

### Stock Entry Form (`StockEntry.jsx`)

- Comprehensive form for adding new inventory items
- Fields include: name, category, quantity, location, supplier, etc.
- Barcode scanning capability
- Photo upload functionality
- Validation and error handling

### Inventory List (`InventoryList.jsx`)

- Display all stock items with filtering and search
- Sort by various criteria (name, quantity, date, etc.)
- Pagination for large inventories
- Quick action buttons for common operations

### Stock Adjustments (`StockAdjustment.jsx`)

- Adjust quantities for existing items
- Reason tracking for adjustments
- Batch operations for multiple items
- Audit trail for all changes

### Stock Alerts (`StockAlerts.jsx`)

- Low stock warnings
- Out of stock notifications
- Configurable alert thresholds
- Priority-based alert system

## State Management

The app uses Zustand for state management with two main stores:

### AuthStore (`authStore.js`)

- User authentication and session management
- Warehouse/location selection
- Connection status monitoring
- Demo credentials for testing

### StockStore (`stockStore.js`)

- Inventory item management
- Categories, locations, and suppliers
- Search and filtering
- Statistics and analytics
- Real-time synchronization

## Configuration

### Environment Variables

Create a `.env` file in the stock-tablet directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001

# Feature Flags
VITE_ENABLE_BARCODE_SCANNER=true
VITE_ENABLE_PHOTO_UPLOAD=true
VITE_ENABLE_OFFLINE_MODE=true

# Demo Mode
VITE_DEMO_MODE=true
```

### Tablet Optimization

The interface is optimized for tablet devices with:

- Large touch targets (minimum 44px)
- Simplified navigation
- High contrast colors
- Touch-friendly controls
- Landscape and portrait orientations

## Demo Credentials

For testing purposes, use these demo credentials:

| Role          | Email                    | Password      | Warehouse       |
| ------------- | ------------------------ | ------------- | --------------- |
| Stock Manager | demo@stockmanager.com    | demo123       | Warehouse A     |
| Supervisor    | supervisor@warehouse.com | supervisor123 | Warehouse A     |
| QC Manager    | qc@qualitycontrol.com    | qc123         | Quality Control |

## API Integration

The app integrates with the backend API for:

### Stock Management Endpoints

- `POST /api/inventory` - Add new stock item
- `GET /api/inventory` - Get inventory list
- `PUT /api/inventory/:id` - Update stock item
- `POST /api/inventory/:id/adjust` - Adjust stock quantity
- `POST /api/inventory/:id/photos` - Upload photos

### Authentication Endpoints

- `POST /api/auth/stock-manager-login` - Login for stock managers
- `GET /api/auth/verify-token` - Verify authentication token
- `POST /api/auth/logout` - Logout

### Real-time Events (Socket.io)

- `stockAdded` - New item added
- `stockUpdated` - Item modified
- `stockAdjusted` - Quantity adjusted
- `lowStockAlert` - Low stock notification

## Development

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Run tests
npm test
```

### Code Style

The project uses:

- ESLint for code linting
- Prettier for code formatting
- Tailwind CSS for styling
- Modern React patterns (hooks, functional components)

### Adding New Features

1. Create components in `src/components/`
2. Add pages in `src/pages/`
3. Update routing in `src/App.jsx`
4. Add state management in appropriate store
5. Update navigation in `src/components/Navbar.jsx`

## Deployment

### Development Deployment

The app runs on port 3002 by default and connects to the backend API on port 3001.

### Production Deployment

1. Build the app: `npm run build`
2. Serve the `dist/` folder using a web server
3. Ensure the backend API is accessible
4. Configure environment variables for production

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3002
CMD ["npm", "run", "preview"]
```

## Troubleshooting

### Common Issues

1. **Connection Issues**: Check that the backend server is running on port 3001
2. **Authentication Problems**: Verify demo credentials or backend auth service
3. **Photo Upload Failures**: Ensure proper file size limits and formats
4. **Performance Issues**: Check browser developer tools for console errors

### Debug Mode

Enable debug mode by adding to localStorage:

```javascript
localStorage.setItem("stockTablet_debug", "true");
```

This will show additional logging and debug information.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on tablet devices
5. Submit a pull request

## License

This project is part of the Manufacturing Operations Management System.
