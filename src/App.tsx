import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage, RegisterPage, ForgotPasswordPage } from './pages/AuthPages';
import { DashboardPage } from './pages/DashboardPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { StockSearchPage, StockDetailsPage } from './pages/StockPages';
import { RiskAnalysisPage } from './pages/RiskAnalysisPage';
import { MarketAnalysisPage } from './pages/MarketAnalysisPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { ReportsPage } from './pages/ReportsPage';
import { ProfilePage, AdminDashboardPage } from './pages/ProfileAndAdminPages';

import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const MainLayout: React.FC = () => {
  const { user, profile, isAdmin, logout } = useAuth();
  const isAuthenticated = !!user;
  const userRole = isAdmin ? 'admin' : (profile?.role || (isAuthenticated ? 'investor' : null));
  const userName = profile?.full_name || user?.email?.split('@')[0] || 'Investor';

  return (
    <AppLayout
      isAuthenticated={isAuthenticated}
      userRole={userRole}
      userName={userName}
      onLogout={logout}
    />
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            
            {/* Core Application Pages */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/stocks" element={<StockSearchPage />} />
            <Route path="/stocks/:symbol" element={<StockDetailsPage />} />
            <Route path="/risk" element={<RiskAnalysisPage />} />
            <Route path="/risk/:portfolioId" element={<RiskAnalysisPage />} />
            <Route path="/portfolio/:portfolioId/risk" element={<RiskAnalysisPage />} />
            <Route path="/market" element={<MarketAnalysisPage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
