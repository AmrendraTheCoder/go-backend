import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, ConfigProvider } from 'antd';
import { useAuthStore } from './stores/authStore';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/Layout/DashboardLayout';
import JobManagement from './pages/JobManagement';
import CustomerManagement from './pages/CustomerManagement';
import InventoryManagement from './pages/InventoryManagement';
import UserManagement from './pages/UserManagement';
import './App.css';

const { Content } = Layout;

function App() {
  const { isAuthenticated } = useAuthStore();

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
