import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import MainApp from './pages/MainApp';

function AppContent() {
  const { user, loading } = useAuth();
  const isDevBypass = localStorage.getItem('shuni_dev_bypass') === 'true';

  if (loading && !isDevBypass) {
    return <div className="h-screen w-screen bg-background flex items-center justify-center">🌱 讀取中...</div>;
  }

  const isAuthenticated = !!user || isDevBypass;

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          isAuthenticated ? <Navigate to="/app" /> : <AuthPage />
        } 
      />
      <Route 
        path="/app/*" 
        element={
          isAuthenticated ? <MainApp /> : <Navigate to="/" />
        } 
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}


export default App;
