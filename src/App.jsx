import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';

import Login from '@/pages/Login';

import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Pipeline from '@/pages/Pipeline';
import Businesses from '@/pages/Businesses';
import BusinessDetail from '@/pages/BusinessDetail';
import Tasks from '@/pages/Tasks';
import Ideas from '@/pages/Ideas';
import Events from '@/pages/Events';
import SyncHub from '@/pages/SyncHub';
import Profile from '@/pages/Profile';
import Finance from '@/pages/Finance';
import TaskAIChat from '@/pages/TaskAIChat';
import BusinessStrategy from '@/pages/BusinessStrategy';
import ContactProfile from '@/pages/ContactProfile';
import Contacts from '@/pages/Contacts';
import Reports from '@/pages/Reports';
import Team from '@/pages/Team';
import Templates from '@/pages/Templates';
import Settings from '@/pages/Settings';
import Subscribe from '@/pages/Subscribe';
import SubscriptionGate from '@/components/SubscriptionGate';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading URME...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/subscribe" element={<Subscribe />} />
        <Route element={<SubscriptionGate><AppLayout /></SubscriptionGate>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/businesses" element={<Businesses />} />
          <Route path="/businesses/:id" element={<BusinessDetail />} />
          <Route path="/businesses/:id/strategy" element={<BusinessStrategy />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/contacts/:id" element={<ContactProfile />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/team" element={<Team />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/ideas" element={<Ideas />} />
          <Route path="/events" element={<Events />} />
          <Route path="/sync" element={<SyncHub />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/task-ai-chat" element={<TaskAIChat />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App