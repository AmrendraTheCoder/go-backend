import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, ConfigProvider } from 'antd';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useJobsStore } from './stores/jobsStore';
import { useCustomersStore } from './stores/customersStore';
import { useInventoryStore } from './stores/inventoryStore';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/Layout/DashboardLayout';
import JobManagement from './pages/JobManagement';
import CustomerManagement from './pages/CustomerManagement';
import InventoryManagement from './pages/InventoryManagement';
import UserManagement from './pages/UserManagement';
import NotificationHandler from './components/NotificationHandler';
import './App.css';

const { Content } = Layout;

function App() {
  const { isAuthenticated, initialize } = useAuthStore();
  const jobsStore = useJobsStore();
  const customersStore = useCustomersStore();
  const inventoryStore = useInventoryStore();

  useEffect(() => {
    // Initialize auth store (will connect socket if user is already authenticated)
    initialize();

    // Initialize socket listeners for all stores
    if (isAuthenticated) {
      jobsStore.initializeSocketListeners();
      customersStore.initializeSocketListeners();
      inventoryStore.initializeSocketListeners();
    }
  }, [isAuthenticated, initialize, jobsStore, customersStore, inventoryStore]);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <Router>
        <Layout style={{ minHeight: '100vh' }}>
          <Routes>
            <Route
              path="/login"
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
              }
            />
            <Route
              path="/*"
              element={
                isAuthenticated ? (
                  <>
                    <NotificationHandler />
                    <DashboardLayout>
                      <Routes>
                        <Route path="/dashboard" element={<Navigate to="/dashboard/jobs" replace />} />
                        <Route path="/dashboard/jobs" element={<JobManagement />} />
                        <Route path="/dashboard/customers" element={<CustomerManagement />} />
                        <Route path="/dashboard/inventory" element={<InventoryManagement />} />
                        <Route path="/dashboard/users" element={<UserManagement />} />
                        <Route path="*" element={<Navigate to="/dashboard/jobs" replace />} />
                      </Routes>
                    </DashboardLayout>
                  </>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </Layout>
      </Router>
    </ConfigProvider>
  );
}

export default App;
