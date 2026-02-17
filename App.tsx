
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserLogin } from './pages/UserLogin';
import { AdminLogin } from './pages/AdminLogin';
import { MemberArea } from './pages/MemberArea';
import { AdminPanel } from './pages/AdminPanel';
import { ModuleView } from './pages/ModuleView';

const App: React.FC = () => {
  return (
    <Router>
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
    </Router>
  );
};

export default App;
