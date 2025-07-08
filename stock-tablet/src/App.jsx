import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { useEffect, useState } from 'react';
import { useAuthStore } from './stores/authStore';
import { useJobStore } from './stores/jobStore';
import LoginPage from './pages/LoginPage';
import JobQueue from './pages/JobQueue';
import JobDetail from './pages/JobDetail';
import Settings from './pages/Settings';
import PWAPrompt from './components/PWAPrompt';
import './App.css';

// Tablet-optimized theme
const tabletTheme = {
  token: {
    // Larger touch targets for tablets
    controlHeight: 48,
    fontSize: 16,
    borderRadius: 8,
    colorPrimary: '#1890ff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif',
  },
  components: {
    Button: {
      controlHeight: 56, // Extra large touch targets
      borderRadius: 12,
      fontSize: 18,
      fontWeight: 600,
    },
    Card: {
      borderRadius: 16,
      paddingLG: 32,
    },
    Input: {
      controlHeight: 56,
      borderRadius: 12,
      fontSize: 18,
    },
    Table: {
      borderRadius: 16,
      cellPaddingBlock: 20,
      cellPaddingInline: 24,
    }
  }
};

function App() {
  const { isAuthenticated, initialize, user } = useAuthStore();
  const jobStore = useJobStore();
  const [isInstallPromptDeferred, setIsInstallPromptDeferred] = useState(false);

  useEffect(() => {
    // Initialize auth store
    initialize();

    // Initialize job store for machine operators
    if (isAuthenticated && user?.role === 'machine_operator') {
      jobStore.initializeSocketListeners();
    }

    // Handle PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setIsInstallPromptDeferred(e);
    });

    // Service worker registration handling
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, [isAuthenticated, user, initialize, jobStore]);

  return (
    <ConfigProvider theme={tabletTheme}>
      <AntApp>
        <div className="tablet-app">
          <Router>
            <Routes>
              <Route
                path="/login"
                element={
                  !isAuthenticated ? (
                    <LoginPage />
                  ) : (
                    <Navigate to="/jobs" replace />
                  )
                }
              />
              <Route
                path="/jobs"
                element={
                  isAuthenticated ? (
                    <JobQueue />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/jobs/:jobId"
                element={
                  isAuthenticated ? (
                    <JobDetail />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/settings"
                element={
                  isAuthenticated ? (
                    <Settings />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/"
                element={<Navigate to={isAuthenticated ? "/jobs" : "/login"} replace />}
              />
              <Route
                path="*"
                element={<Navigate to={isAuthenticated ? "/jobs" : "/login"} replace />}
              />
            </Routes>
          </Router>

          {/* PWA Install Prompt */}
          {isInstallPromptDeferred && (
            <PWAPrompt
              installPrompt={isInstallPromptDeferred}
              onInstall={() => setIsInstallPromptDeferred(false)}
              onDismiss={() => setIsInstallPromptDeferred(false)}
            />
          )}
        </div>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
