import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface AppLayoutProps {
  userRole?: 'investor' | 'admin' | null;
  isAuthenticated?: boolean;
  userName?: string;
  onLogout?: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  userRole,
  isAuthenticated,
  userName,
  onLogout,
}) => {
  return (
    <div
      id="scroll-container"
      className="scroll-container min-h-screen flex flex-col bg-warm-cream"
      data-string-id="layout-container"
    >
      <Navbar
        userRole={userRole}
        isAuthenticated={isAuthenticated}
        userName={userName}
        onLogout={onLogout}
      />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
