import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import MdiLayout from './layouts/MdiLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PerfisCrud from './pages/PerfisCrud';
import UsuariosCrud from './pages/UsuariosCrud'; // <-- Verifique se o nome do arquivo na pasta bate exatamente com este
import Dashboard from './pages/Dashboard'; 

// const Dashboard = () => (
//   <div className="bg-white p-6 rounded shadow w-full">
//     <h1 className="text-2xl font-bold text-gray-950">Dashboard Geral</h1>
//     <p className="mt-2 text-gray-600">Acesse o menu lateral Administração para gerenciar o sistema.</p>
//   </div>
// );

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Rotas Públicas */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* 2. Rotas Privadas Protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<MdiLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="perfis" element={<PerfisCrud />} />
            <Route path="usuarios" element={<UsuariosCrud />} /> {/* <-- Rota Relativa Limpa */}
          </Route>
        </Route>

        {/* 3. Rota Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
