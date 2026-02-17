
import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserLogin } from './pages/UserLogin';

// Lazy loading dos componentes pesados
const AdminLogin = lazy(() => import('./pages/AdminLogin').then(module => ({ default: module.AdminLogin })));
const MemberArea = lazy(() => import('./pages/MemberArea').then(module => ({ default: module.MemberArea })));
const AdminPanel = lazy(() => import('./pages/AdminPanel').then(module => ({ default: module.AdminPanel })));
const ModuleView = lazy(() => import('./pages/ModuleView').then(module => ({ default: module.ModuleView })));

// Loading Component minimalista
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-black">
    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* User Routes */}
          <Route path="/" element={<UserLogin />} />
          <Route path="/dashboard" element={<MemberArea />} />
          <Route path="/module/:id" element={<ModuleView />} />

          {/* Admin Routes */}
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminPanel />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
