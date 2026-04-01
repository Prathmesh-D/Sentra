import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import './App.css'
import LoginPage from './views/Login'
import SignupPage from './views/Signup'
import WelcomePage from './views/Welcome'
import GettingStartedPage from './views/GettingStarted'
import DashboardPage from './views/Dashboard'
import EncryptPage from './views/Encrypt'
import InboxPage from './views/Inbox'
import OutboxPage from './views/Outbox'
import SettingsPage from './views/Settings'
import { useDemoGuard } from './hooks/use-demo-guard'
import { useTabCounts } from './hooks/use-tab-counts'
import { ErrorBoundary } from './components/ErrorBoundary'
import { TbDatabaseSearch } from "react-icons/tb";
import { FaCogs } from "react-icons/fa";
import { TbSettingsAutomation } from "react-icons/tb";
import { BiLogInCircle } from "react-icons/bi";
import { FiLock } from 'react-icons/fi'

type PageType = 'login' | 'signup' | 'GettingStarted' | 'Dashboard' | 'Encrypt' | 'Inbox' | 'Outbox' | 'Settings'
const DEMO_BLOCKED_ROUTE_KEYS = new Set(['settings/password', 'settings/email', 'settings/billing', 'account/delete'])
const debugLog = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.log(...args)
  }
}

// Loading component
function LoadingScreen({ progress, phase, message }: { progress: number; phase: string; message: string }) {
  const getProgressColor = () => {
    if (phase === 'error') return 'bg-red-500';
    if (progress >= 100) return 'bg-green-500';
    return 'bg-[#005abd]';
  };

  const getPhaseIcon = () => {
    switch (phase) {
      case 'initializing':
        return <FaCogs className="w-20 h-20 animate-bounce" style={{ color: '#b2f7ef' }} />;
      case 'server':
        return <TbSettingsAutomation className="w-20 h-20 animate-bounce" style={{ color: '#F7D6E0' }} />;
      case 'database':
        return <TbDatabaseSearch className="w-20 h-20 animate-pulse" style={{ color: '#f2b5d4' }} />;
      case 'ready':
        return <BiLogInCircle className="w-20 h-20 animate-bounce" style={{ color: '#BFFCC6' }} />;
      case 'error':
        return <FaCogs className="w-20 h-20 animate-shake" style={{ color: '#ef4444' }} />;
      default:
        return <FaCogs className="w-20 h-20 animate-bounce" style={{ color: '#b2f7ef' }} />;
    }
  };

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <div key={phase} className="animate-in slide-in-from-bottom-4 duration-700 ease-out">
              {getPhaseIcon()}
            </div>
            <h1 className="text-2xl font-bold animate-in slide-in-from-bottom-2 duration-500 delay-200">Starting Sentra</h1>
            <p className="text-muted-foreground animate-in slide-in-from-bottom-1 duration-500 delay-300">
              {message}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-md animate-in slide-in-from-bottom-2 duration-500 delay-400">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-700 ease-out ${getProgressColor()} animate-pulse`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Phase Indicators */}
          <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground animate-in slide-in-from-bottom-1 duration-500 delay-500">
            <div className={`flex items-center gap-2 transition-all duration-300 ${phase === 'initializing' ? 'text-[#005abd] font-medium scale-105' : ''}`}>
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${phase === 'initializing' ? 'bg-[#005abd] animate-ping' : 'bg-gray-300'}`}></div>
              <span>Initializing system</span>
            </div>
            <div className={`flex items-center gap-2 transition-all duration-300 ${phase === 'server' ? 'text-[#005abd] font-medium scale-105' : ''}`}>
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${phase === 'server' ? 'bg-[#005abd] animate-ping' : 'bg-gray-300'}`}></div>
              <span>Starting backend services</span>
            </div>
            <div className={`flex items-center gap-2 transition-all duration-300 ${phase === 'database' ? 'text-[#005abd] font-medium scale-105' : ''}`}>
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${phase === 'database' ? 'bg-[#005abd] animate-ping' : 'bg-gray-300'}`}></div>
              <span>Setting up database</span>
            </div>
            <div className={`flex items-center gap-2 transition-all duration-300 ${phase === 'ready' ? 'text-green-600 font-medium scale-105' : ''}`}>
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${phase === 'ready' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
              <span>Ready to login</span>
            </div>
          </div>

          {phase === 'error' && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Backend startup failed.</strong> Please check the console for details and restart the application.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AppContent() {
  const { user, isAuthenticated, isLoading: authLoading, authStatus, isDemo, triggerDemoLogin } = useAuth()
  const { triggerDemoBlock } = useDemoGuard()
  const [currentPage, setCurrentPage] = useState<PageType>('login')
  const [pageAnimationKey, setPageAnimationKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [backendError, setBackendError] = useState(false)
  const tabCountContext = isDemo ? 'demo' : (user?.username ? `user:${user.username}` : null)
  const { counts, recount, markInboxViewed, markOutboxViewed } = useTabCounts(tabCountContext, authStatus === 'authenticated')
  const [backendProgress, setBackendProgress] = useState({
    phase: 'initializing',
    progress: 0,
    message: 'Starting backend services...'
  })
  const [isGloballyLocked, setIsGloballyLocked] = useState(false)

  const autoLockMs = (() => {
    const timeout = user?.security?.autoLockTimeout
    if (timeout === '5m') return 5 * 60 * 1000
    if (timeout === '15m') return 15 * 60 * 1000
    if (timeout === '30m') return 30 * 60 * 1000
    return null
  })()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (authStatus === 'unauthenticated' && currentPage !== 'login' && currentPage !== 'signup') {
      debugLog('User not authenticated, redirecting to login')
      setCurrentPage('login')
    }
  }, [authStatus, isAuthenticated, currentPage])

  useEffect(() => {
    if (authStatus === 'unauthenticated' && (currentPage === 'login' || currentPage === 'signup')) {
      window.electronAPI?.focusWindow?.()
    }
  }, [authStatus, currentPage])

  // Set default page for authenticated users
  useEffect(() => {
    if (authStatus === 'authenticated' && (currentPage === 'login' || currentPage === 'signup')) {
      debugLog('User authenticated, setting default page to GettingStarted')
      setCurrentPage('GettingStarted')
    }
  }, [authStatus, currentPage])

  useEffect(() => {
    const handler = () => {
      setCurrentPage('signup')
    }
    window.addEventListener('sentra-open-signup', handler)
    return () => window.removeEventListener('sentra-open-signup', handler)
  }, [])

  useEffect(() => {
    if (isDemo && DEMO_BLOCKED_ROUTE_KEYS.has(currentPage.toLowerCase())) {
      setCurrentPage('Dashboard')
      triggerDemoBlock()
    }
  }, [isDemo, currentPage, triggerDemoBlock])

  useEffect(() => {
    if (authStatus === 'authenticated') {
      recount()
    }
  }, [authStatus, isDemo, user?.username, recount])

  useEffect(() => {
    if (authStatus !== 'authenticated') return
    if (currentPage === 'Inbox') {
      markInboxViewed()
    }
    if (currentPage === 'Outbox') {
      markOutboxViewed()
    }
  }, [authStatus, currentPage, markInboxViewed, markOutboxViewed])

  // Listen for backend progress updates from Electron
  useEffect(() => {
    debugLog('Setting up backend progress listener...');
    debugLog('window.electronAPI available:', !!window.electronAPI);
    debugLog('onBackendProgress method available:', !!(window.electronAPI?.onBackendProgress));

    if (window.electronAPI?.onBackendProgress) {
      debugLog('Electron API available, setting up IPC listener...');

      const handleProgress = (event: any, data: any) => {
        debugLog('IPC backend progress update:', data, event);
        setBackendProgress(data);

        if (data.phase === 'ready') {
          debugLog('Backend ready, waiting briefly before transitioning...');
          // Short delay to show the "ready" state before transitioning
          setTimeout(() => {
            debugLog('Setting isLoading=false');
            setIsLoading(false);
          }, 500);
        } else if (data.phase === 'error') {
          debugLog('Backend error detected, stopping loading...');
          setBackendError(true);
          setIsLoading(false);
        }
      };

      debugLog('Calling window.electronAPI.onBackendProgress...');
      window.electronAPI.onBackendProgress(handleProgress);
      debugLog('IPC listener registered successfully');

      // Cleanup function
      return () => {
        debugLog('Cleaning up backend progress listener...');
        if (window.electronAPI?.removeAllListeners) {
          window.electronAPI.removeAllListeners('backend-progress');
        }
      };
    } else {
      debugLog('Electron API not available, using development fallback...');
      // Fallback for development mode - simulate progress
      const simulateProgress = () => {
        const phases = [
          { phase: 'initializing', progress: 25, message: 'Initializing system...' },
          { phase: 'server', progress: 50, message: 'Starting backend services...' },
          { phase: 'database', progress: 75, message: 'Setting up database...' },
          { phase: 'ready', progress: 100, message: 'Backend ready!' }
        ];

        phases.forEach((phase, index) => {
          setTimeout(() => {
            debugLog('DEV: Simulating progress:', phase);
            setBackendProgress(phase);
            if (phase.phase === 'ready') {
              setTimeout(() => {
                debugLog('DEV: Setting states for ready phase');
                setIsLoading(false);
              }, 500);
            }
          }, index * 2000); // 2 second intervals for faster dev testing
        });
      };

      simulateProgress();
    }
  }, []);

  // Check backend health on app start
  useEffect(() => {
    // Backend progress is now handled by Electron IPC
    // This effect is kept for any additional initialization if needed
  }, [])

  useEffect(() => {
    if (!isAuthenticated || isLoading || backendError || !autoLockMs || isGloballyLocked) {
      return
    }

    let timer = window.setTimeout(() => {
      setIsGloballyLocked(true)
    }, autoLockMs)

    const resetTimer = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        setIsGloballyLocked(true)
      }, autoLockMs)
    }

    window.addEventListener('mousemove', resetTimer)
    window.addEventListener('keydown', resetTimer)
    window.addEventListener('mousedown', resetTimer)
    window.addEventListener('touchstart', resetTimer)
    window.addEventListener('scroll', resetTimer, true)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('mousemove', resetTimer)
      window.removeEventListener('keydown', resetTimer)
      window.removeEventListener('mousedown', resetTimer)
      window.removeEventListener('touchstart', resetTimer)
      window.removeEventListener('scroll', resetTimer, true)
    }
  }, [isAuthenticated, isLoading, backendError, autoLockMs, isGloballyLocked])

  useEffect(() => {
    if (!isAuthenticated) {
      setIsGloballyLocked(false)
    }
  }, [isAuthenticated])

  const renderPage = () => {
    switch (currentPage) {
      case 'GettingStarted':
        return <GettingStartedPage />
      case 'Dashboard':
        return <DashboardPage onNavigate={handleNavigate} />
      case 'Encrypt':
        return <EncryptPage />
      case 'Inbox':
        return <InboxPage />
      case 'Outbox':
        return <OutboxPage key={`outbox-${pageAnimationKey}`} />
      case 'Settings':
        return <SettingsPage />
      default:
        return <GettingStartedPage />
    }
  }

  const handleNavigate = (page: string) => {
    if (isDemo && DEMO_BLOCKED_ROUTE_KEYS.has(page.toLowerCase())) {
      triggerDemoBlock()
      return
    }

    if (page !== currentPage) {
      setCurrentPage(page as PageType)
      setPageAnimationKey(prev => prev + 1)
    }
  }

  // Show loading screen while auth is initializing
  if (authLoading) {
    return (
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm md:max-w-4xl">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 animate-spin rounded-full border-4 border-gray-300 border-t-[#005abd]"></div>
              <h1 className="text-2xl font-bold">Loading...</h1>
              <p className="text-muted-foreground">Checking authentication...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#084d45',
            border: '2px solid #b2f7ef',
            padding: '16px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 8px 24px rgba(151, 238, 255, 0.3)',
          },
          success: {
            iconTheme: {
              primary: '#b2f7ef',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#f7d6e0',
              secondary: '#fff',
            },
          },
        }}
      />
      {isLoading ? (
        <LoadingScreen
          progress={backendProgress.progress}
          phase={backendProgress.phase}
          message={backendProgress.message}
        />
      ) : !isAuthenticated ? (
        currentPage === 'login' ? (
          <LoginPage
            onNavigateToSignup={() => setCurrentPage('signup')}
            onDemoLogin={async () => {
              await triggerDemoLogin()
              setCurrentPage('GettingStarted')
            }}
            onLogin={(_username) => {
              setCurrentPage('GettingStarted');
            }}
          />
        ) : (
          <SignupPage onNavigateToLogin={() => setCurrentPage('login')} />
        )
      ) : backendError ? (
        <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-sm md:max-w-4xl">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold">Backend Connection Failed</h1>
                <p className="text-muted-foreground">
                  Unable to connect to the encryption services. Please start the backend server.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border">
                <h3 className="font-semibold mb-2">To start the backend server:</h3>
                <ol className="text-sm text-left space-y-1">
                  <li>1. Open a new terminal/command prompt</li>
                  <li>2. Navigate to the Java backend folder:</li>
                  <li className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                    cd backend
                  </li>
                  <li>3. Start the server:</li>
                  <li className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                    .\run-backend-dev.ps1
                  </li>
                </ol>
                <p className="text-xs text-muted-foreground mt-2">
                  Wait for "Server is ready!" message, then click retry.
                </p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      ) : (
        <WelcomePage
          onNavigate={handleNavigate}
          currentPage={currentPage}
          inboxCount={counts.inbox}
          outboxCount={counts.outbox}
        >
          <div key={`page-content-${pageAnimationKey}`} className={`tab-transition ${isDemo ? 'demo-app-fade-in' : ''}`}>
            {renderPage()}
          </div>
        </WelcomePage>
      )}

      {isAuthenticated && isGloballyLocked ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <FiLock className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Session Locked</h2>
            <p className="mt-2 text-sm text-gray-600">
              App locked due to inactivity. Click unlock to continue.
            </p>
            <button
              type="button"
              onClick={() => setIsGloballyLocked(false)}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#005abd] px-4 py-2 text-sm font-semibold text-white hover:bg-[#004b9f]"
            >
              Unlock
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </AuthProvider>
  )
}

export default App
