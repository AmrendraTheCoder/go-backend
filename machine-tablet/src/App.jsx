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

// Responsive theme that works for both tablets and laptops
const getResponsiveTheme = () => {
  const isTablet = window.innerWidth <= 1024;
  const isMobile = window.innerWidth <= 767;

  return {
    token: {
      // Responsive sizing based on screen size
      controlHeight: isMobile ? 44 : isTablet ? 48 : 40,
      fontSize: isMobile ? 14 : isTablet ? 16 : 14,
      borderRadius: isMobile ? 6 : isTablet ? 8 : 6,
      colorPrimary: '#1890ff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif',
    },
    components: {
      Button: {
        // Responsive button sizing
        controlHeight: isMobile ? 44 : isTablet ? 56 : 36,
        borderRadius: isMobile ? 8 : isTablet ? 12 : 8,
        fontSize: isMobile ? 16 : isTablet ? 18 : 14,
        fontWeight: isTablet ? 600 : 500,
      },
      Card: {
        borderRadius: isMobile ? 12 : isTablet ? 16 : 12,
        paddingLG: isMobile ? 16 : isTablet ? 32 : 24,
      },
      Input: {
        controlHeight: isMobile ? 44 : isTablet ? 56 : 36,
        borderRadius: isMobile ? 8 : isTablet ? 12 : 8,
        fontSize: isMobile ? 16 : isTablet ? 18 : 14,
      },
      Select: {
        controlHeight: isMobile ? 44 : isTablet ? 56 : 36,
        borderRadius: isMobile ? 8 : isTablet ? 12 : 8,
        fontSize: isMobile ? 16 : isTablet ? 18 : 14,
      },
      Table: {
        borderRadius: isMobile ? 12 : isTablet ? 16 : 12,
        cellPaddingBlock: isMobile ? 12 : isTablet ? 20 : 16,
        cellPaddingInline: isMobile ? 16 : isTablet ? 24 : 16,
      },
      Statistic: {
        titleFontSize: isMobile ? 14 : isTablet ? 16 : 14,
        contentFontSize: isMobile ? 20 : isTablet ? 28 : 24,
      },
      Space: {
        size: isMobile ? 8 : isTablet ? 16 : 12,
      }
    }
  };
};

function App() {
  const { isAuthenticated, initialize, user } = useAuthStore();
  const jobStore = useJobStore();
  const [isInstallPromptDeferred, setIsInstallPromptDeferred] = useState(false);
  const [theme, setTheme] = useState(getResponsiveTheme());

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

    // Handle window resize for responsive theme
    const handleResize = () => {
      setTheme(getResponsiveTheme());
    };

    window.addEventListener('resize', handleResize);

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

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isAuthenticated, user, initialize, jobStore]);

  return (
    <ConfigProvider theme={theme}>
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
