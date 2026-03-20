import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import MainApp from './pages/MainApp';
import { motion } from 'framer-motion';

const ShuniAvatar = () => (
  <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg filter">
    <rect x="25" y="20" width="65" height="45" rx="16" fill="hsl(340, 65%, 65%)" />
    <path d="M 25 30 Q 5 10 10 50 Q 15 65 25 50" fill="#E5E7EB" />
    <rect x="70" y="35" width="4" height="6" rx="2" fill="#1F2937" />
    <rect x="78" y="35" width="4" height="6" rx="2" fill="#1F2937" />
    <ellipse cx="65" cy="40" rx="4" ry="2" fill="hsl(42, 90%, 62%)" />
    <ellipse cx="88" cy="40" rx="4" ry="2" fill="hsl(42, 90%, 62%)" />
    <path d="M 40 65 L 40 85 Q 40 90 45 90 L 50 90 Q 55 90 55 85 L 50 65" fill="#E5E7EB" />
    <path d="M 60 65 L 60 85 Q 60 90 65 90 L 70 90 Q 75 90 75 85 L 70 65" fill="#E5E7EB" />
  </svg>
);

function AppContent() {
  const { user, loading } = useAuth();
  const isDevBypass = localStorage.getItem('shuni_dev_bypass') === 'true';

  if (loading && !isDevBypass) {
    return (
      <div className="h-screen w-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-10 text-4xl overflow-hidden flex items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }} className="w-96 h-96 border-[40px] border-pikmin-leaf rounded-full absolute" />
        </div>
        <motion.div 
          animate={{ y: [0, -10, 0] }} 
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <ShuniAvatar />
        </motion.div>
        <motion.div 
          animate={{ opacity: [0.4, 1, 0.4] }} 
          transition={{ repeat: Infinity, duration: 1.5 }} 
          className="mt-6 font-bold text-primary font-display tracking-widest text-sm"
        >
          與咻妮連線中... 🌱
        </motion.div>
      </div>
    );
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
