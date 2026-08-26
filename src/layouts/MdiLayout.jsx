import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShieldCheck, 
  Users, 
  UserRoundCheck,
  ChevronDown, 
  Menu, 
  ChevronLeft,
  LogOut,
  ShieldAlert
} from 'lucide-react';
import { jwtDecode } from 'jwt-decode'; // <-- Importação adicionada

export default function MdiLayout() {
  const [sidebarAberta, setSidebarAberta] = useState(true);
  const [adminMenuAberto, setAdminMenuAberto] = useState(false);
  const [nomeUsuario, setNomeUsuario] = useState('Usuário'); // <-- Estado para o nome dinâmico
  
  const navigate = useNavigate();
  const location = useLocation();

  // Efeito executado ao carregar o painel para ler e decodificar o Hash-Token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        
        // O .NET mapeia ClaimTypes.Name como 'unique_name' ou 'name' no JSON do JWT
        const emailOuNome = decoded.unique_name || decoded.name || decoded.email || 'Usuário Conectado';
        
        setNomeUsuario(emailOuNome);
      } catch (error) {
        console.error('Erro ao decodificar o token JWT:', error);
        setNomeUsuario('Usuário');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const verificarAtivo = (caminho) => {
    return location.pathname === caminho 
      ? 'bg-[#85ce36] text-white font-medium shadow-sm' 
      : 'text-gray-400 hover:bg-slate-800 hover:text-white transition-all';
  };

  // Altera dinamicamente o título da aba no cabeçalho
  const obterNomeAba = () => {
    if (location.pathname.includes('perfis')) return 'Perfis de Usuários';
    if (location.pathname.includes('usuarios')) return 'Usuários';
    if (location.pathname.includes('niveis-acesso')) return 'Níveis de Acesso';
    if (location.pathname.includes('dashboard')) return 'Dashboard';
    return 'Visão Geral';
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f0f3f4] font-sans antialiased">
      
      {/* 1. SIDEBAR LATERAL */}
      <aside 
        className={`bg-[#2d353c] text-white flex flex-col justify-between transition-all duration-300 ease-in-out z-30 shadow-xl ${
          sidebarAberta ? 'w-64' : 'w-16'
        }`}
      >
        <div>
          {/* Topo da Sidebar */}
          <div className="h-16 flex items-center bg-[#242a30] border-b border-slate-700/40 transition-all duration-300">
            {sidebarAberta ? (
              <div className="flex items-center justify-between w-full px-4 min-w-[240px] overflow-hidden">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#85ce36] animate-pulse"></div>
                  <span className="text-sm font-bold tracking-wider uppercase text-gray-200 whitespace-nowrap">
                    Meu Projeto Painel
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSidebarAberta(false);
                    setAdminMenuAberto(false);
                  }}
                  className="text-gray-400 hover:text-white p-1 rounded hover:bg-slate-800 transition cursor-pointer"
                  title="Recolher Menu"
                >
                  <ChevronLeft size={18} />
                </button>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => setSidebarAberta(true)}
                className="w-full h-full flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer"
                title="Expandir Menu"
              >
                <Menu size={20} />
              </button>
            )}
          </div>

          {/* Links de Navegação */}
          <nav className="mt-4 px-2 space-y-1">
            <Link 
              to="/app/dashboard" 
              className={`flex items-center gap-3 p-3 rounded text-sm transition-all ${verificarAtivo('/app/dashboard')}`}
            >
              <LayoutDashboard size={18} className="shrink-0" />
              <span className={`transition-opacity duration-200 whitespace-nowrap ${sidebarAberta ? 'opacity-100' : 'hidden'}`}>
                Dashboard
              </span>
            </Link>

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  if (!sidebarAberta) setSidebarAberta(true);
                  setAdminMenuAberto(!adminMenuAberto);
                }}
                className={`w-full flex items-center justify-between p-3 rounded text-sm transition-all cursor-pointer ${
                  adminMenuAberto ? 'bg-slate-800 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} className="shrink-0" />
                  <span className={`transition-opacity duration-200 whitespace-nowrap ${sidebarAberta ? 'opacity-100' : 'hidden'}`}>
                    Administração
                  </span>
                </div>
                <ChevronDown 
                  size={14} 
                  className={`transition-transform duration-200 ${sidebarAberta ? 'block' : 'hidden'} ${adminMenuAberto ? 'rotate-180' : ''}`} 
                />
              </button>

              {/* Sub-menu expansível para Perfis e Usuários */}
              <div 
                className={`pl-4 space-y-1 overflow-hidden transition-all duration-200 ${
                  adminMenuAberto && sidebarAberta ? 'max-h-32 opacity-100 mt-1' : 'max-h-0 opacity-0'
                }`}
              >
                <Link 
                  to="/app/perfis" 
                  className={`flex items-center gap-3 p-2.5 rounded text-sm transition-all ${verificarAtivo('/app/perfis')}`}
                >
                  <Users size={16} className="shrink-0" />
                  <span className="whitespace-nowrap">Perfis de Usuários</span>
                </Link>

                <Link 
                  to="/app/usuarios" 
                  className={`flex items-center gap-3 p-2.5 rounded text-sm transition-all ${verificarAtivo('/app/usuarios')}`}
                >
                  <UserRoundCheck size={16} className="shrink-0" />
                  <span className="whitespace-nowrap">Usuários</span>
                </Link>

                 <Link 
                  to="/app/niveis-acesso" 
                  className={`flex items-center gap-3 p-2.5 rounded text-sm transition-all ${verificarAtivo('/app/niveis-acesso')}`}
                >
                  <ShieldAlert size={16} className="shrink-0" />
                  <span className="whitespace-nowrap">Níveis de Acesso</span>
                </Link>

              </div>
            </div>
          </nav>
        </div>

        <div className="h-4 bg-[#242a30] border-t border-slate-700/40"></div>
      </aside>

      {/* 2. ÁREA DE CONTEÚDO PRINCIPAL (HEADER ATUALIZADO + CONTEÚDO FULL-WIDTH) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER SUPERIOR */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-20">
          <div className="flex gap-2 select-none">
            {/* 🛠️ ALTERAÇÃO: Mantida a cor original (text-blue-600), com letras maiores (text-sm) e negrito (font-bold) */}
            <span className="bg-blue-50 text-blue-600 px-6 py-1.5 text-sm font-bold tracking-wide rounded border border-blue-200">
              Aba: {obterNomeAba()}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* TEXTO EXIBINDO O EMAIL EXTRAÍDO DO TOKEN JWT */}
            <span className="text-sm font-semibold text-gray-700 hidden sm:inline bg-gray-50 border px-3 py-1.5 rounded-md">
              {nomeUsuario}
            </span>
            <button 
              type="button"
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-600 p-1.5 transition rounded hover:bg-gray-100 cursor-pointer flex items-center gap-1 text-sm font-medium"
              title="Sair do Sistema"
            >
              <LogOut size={16} />
              <span className="hidden md:inline">Sair</span>
            </button>
          </div>
        </header>

        {/* ÁREA CENTRAL DINÂMICA FLUIDA (OCUPA 100% DA TELA) */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#e2e8f0]">
          <div className="w-full"> 
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
}
