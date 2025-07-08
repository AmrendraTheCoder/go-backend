import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useStockStore } from './stores/stockStore';

// Pages
import StockEntry from './pages/StockEntry';
import InventoryList from './pages/InventoryList';
import StockAdjustment from './pages/StockAdjustment';
import StockAlerts from './pages/StockAlerts';
import LoginPage from './pages/LoginPage';
import Settings from './pages/Settings';

// Components
import LoadingSpinner from './components/LoadingSpinner';
import Navbar from './components/Navbar';

function App() {
    const {
        isAuthenticated,
        isLoading: authLoading,
        checkAuth,
        user
    } = useAuthStore();

    const {
        initializeSocket,
        fetchCategories,
        fetchLocations
    } = useStockStore();

    useEffect(() => {
        // Check authentication status on app load
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        // Initialize stock-related data when authenticated
        if (isAuthenticated) {
            initializeSocket();
            fetchCategories();
            fetchLocations();
        }
    }, [isAuthenticated, initializeSocket, fetchCategories, fetchLocations]);

    // Show loading screen while checking authentication
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    // Show login page if not authenticated
    if (!isAuthenticated) {
        return <LoginPage />;
    }

    return (
        <Router>
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <main className="pb-20"> {/* Space for bottom navigation */}
                    <Routes>
                        <Route path="/" element={<Navigate to="/stock-entry" replace />} />
                        <Route path="/stock-entry" element={<StockEntry />} />
                        <Route path="/inventory" element={<InventoryList />} />
                        <Route path="/adjustments" element={<StockAdjustment />} />
                        <Route path="/alerts" element={<StockAlerts />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<Navigate to="/stock-entry" replace />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App; 