// src/components/layout/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';

interface Props {
  children: React.ReactNode;
  minRole?: 'super_admin' | 'editor' | 'moderator';
}

const ROLE_LEVEL = { super_admin: 3, editor: 2, moderator: 1 };

export function ProtectedRoute({ children, minRole = 'moderator' }: Props) {
  const { admin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!admin) return <Navigate to="/login" replace />;

  if (ROLE_LEVEL[admin.role] < ROLE_LEVEL[minRole]) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
