// src/App.tsx
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { queryClient } from '@/config/query-client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { useAuth } from '@/hooks/use-auth';

// Pages
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { QuestionList } from '@/pages/questions/QuestionList';
import { QuestionCreate } from '@/pages/questions/QuestionCreate';
import { QuestionEdit } from '@/pages/questions/QuestionEdit';
import { QuestionCalendar } from '@/pages/questions/QuestionCalendar';
import { EntityList } from '@/pages/entities/EntityList';
import { UserList } from '@/pages/users/UserList';
import { EventList } from '@/pages/events/EventList';
import { StatsPage } from '@/pages/stats/StatsPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';

export default function App() {
  const { checkSession } = useAuth();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />

            {/* Sorular */}
            <Route path="questions" element={<QuestionList />} />
            <Route path="questions/create" element={
              <ProtectedRoute minRole="editor"><QuestionCreate /></ProtectedRoute>
            } />
            <Route path="questions/:id/edit" element={
              <ProtectedRoute minRole="editor"><QuestionEdit /></ProtectedRoute>
            } />
            <Route path="questions/calendar" element={<QuestionCalendar />} />

            {/* Entityler */}
            <Route path="entities" element={
              <ProtectedRoute minRole="editor"><EntityList /></ProtectedRoute>
            } />

            {/* Kullanıcılar */}
            <Route path="users" element={<UserList />} />

            {/* Etkinlikler */}
            <Route path="events" element={
              <ProtectedRoute minRole="editor"><EventList /></ProtectedRoute>
            } />

            {/* İstatistikler */}
            <Route path="stats" element={<StatsPage />} />

            {/* Ayarlar */}
            <Route path="settings" element={
              <ProtectedRoute minRole="super_admin"><SettingsPage /></ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1E293B',
            color: '#F8FAFC',
            border: '1px solid #334155',
          },
        }}
      />

      {/* @ts-ignore */}
      {import.meta.env.DEV && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}
