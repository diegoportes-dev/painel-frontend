import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row bg-[#f8f9fc]">
      
      {/* Lado Esquerdo - Logotipo sobre a imagem de fundo */}
      <div className="relative flex w-full md:w-1/2 items-center justify-center p-8 bg-[url('/auth-background.jpg')] bg-cover bg-center min-h-[300px] md:min-h-screen">
        <div className="absolute inset-0 bg-[#2d353c]/45"></div>

        {/* Conteúdo do logo da marca */}
        <div className="relative z-10 flex flex-col items-center justify-center rounded-xl border border-white/50 bg-white/45 p-6 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
          <img
            src="/pharan-wordmark.png"
            alt="Pharan"
            className="h-auto w-72 max-w-full object-contain"
          />
          <span className="mt-2 text-[15px] font-bold uppercase tracking-widest text-[#06472b]">
            Customer Service
          </span>
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
