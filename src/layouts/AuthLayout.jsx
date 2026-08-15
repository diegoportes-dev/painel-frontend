import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row bg-[#f8f9fc]">
      
      {/* Lado Esquerdo - Logotipo com Imagem de Fundo Profissional */}
      <div 
        className="relative flex w-full md:w-1/2 items-center justify-center p-8 bg-cover bg-center min-h-[300px] md:min-h-screen"
        style={{ 
          backgroundImage: 'url("https://unsplash.com")' 
        }}
      >
        {/* Camada de Filtro Escuro Overlay para dar contraste ao texto branco */}
        <div className="absolute inset-0 bg-[#2d353c]/75 backdrop-blur-[2px]"></div>

        {/* Conteúdo do Logo (Agora em Branco para destacar sobre a foto escura) */}
        <div className="relative flex items-center gap-3 z-10 animate-in fade-in zoom-in-95 duration-300">
          <div className="relative flex h-12 w-12 items-center justify-center border-2 border-white rounded-full shadow-md">
            <div className="h-6 w-6 border-2 border-white rotate-45"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-4xl font-black tracking-tight text-white drop-shadow-sm">
              EdgeIQ
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#85ce36] ml-0.5">
              Modular Platform
            </span>
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulários Dinâmicos (Login, Esqueci Senha, Reset) */}
      <div className="flex w-full md:w-1/2 items-center justify-center bg-white p-8 shadow-2xl md:shadow-none border-t md:border-t-0 md:border-l border-gray-100">
        <div className="w-full max-w-md space-y-6 animate-in fade-in duration-300">
          <Outlet />
        </div>
      </div>

    </div>
  );
}
