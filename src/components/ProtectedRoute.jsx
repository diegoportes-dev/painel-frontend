import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  const token = localStorage.getItem('token');

  console.log('[ProtectedRoute] Token encontrado no localStorage:', token);

  if (!token) {
    console.warn('[ProtectedRoute] Acesso negado! Nenhum token encontrado. Redirecionando para /login...');
    return <Navigate to="/login" replace />;
  }

  console.log('[ProtectedRoute] Token válido na memória. Liberando acesso às rotas internas...');
  return <Outlet />;

  // return token ? <Outlet /> : <Navigate to="/login" replace />;
}
