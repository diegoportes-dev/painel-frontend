import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';

export default function ResetPassword() {
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({}); // <-- Estado para erros por campo
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.emailDoUsuario) {
      setEmail(location.state.emailDoUsuario);
    }
  }, [location]);

  const handleReset = async (e) => {
    e.preventDefault();
    setGlobalError('');
    setFieldErrors({});
    setMensagem('');
    setLoading(true);

    try {
      const data = await authService.resetarSenha(email, token, novaSenha);
      setMensagem(data.message);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      if (err.validationErrors) {
        setFieldErrors(err.validationErrors); // Captura o dicionário de validação
      } else {
        setGlobalError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleReset} className="space-y-5">
      <h2 className="text-xl font-medium text-gray-950">Redefinir Senha</h2>
      
      {globalError && <div className="bg-red-50 text-red-600 p-3 rounded text-sm font-medium">{globalError}</div>}
      {mensagem && <div className="bg-green-50 text-green-600 p-3 rounded text-sm font-medium">{mensagem}</div>}

      {/* Input E-mail */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Confirme seu E-mail</label>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          disabled={!!location.state?.emailDoUsuario} 
          className={`w-full rounded border p-2.5 text-sm focus:outline-none ${
            fieldErrors.Email ? 'border-red-500 focus:border-red-500 bg-red-50/30' : 'border-gray-300 focus:border-blue-500 bg-gray-50'
          }`}
        />
        {/* Mostra todas as quebras de linha para múltiplos erros de E-mail */}
        {fieldErrors.Email && (
          <div className="mt-1 flex flex-col gap-0.5">
            {fieldErrors.Email.map((erro, index) => (
              <p key={index} className="text-xs font-medium text-red-600">
                • {erro}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Input Token de 6 dígitos */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Código Token (6 dígitos)</label>
        <input 
          type="text" 
          value={token} 
          onChange={(e) => setToken(e.target.value)} 
          placeholder="000000" 
          className={`w-full rounded border p-2.5 text-sm focus:outline-none ${
            fieldErrors.Token ? 'border-red-500 focus:border-red-500 bg-red-50/30' : 'border-gray-300 focus:border-blue-500'
          }`}
        />
        {/* Mostra todas as quebras de linha para múltiplos erros de Token */}
        {fieldErrors.Token && (
          <div className="mt-1 flex flex-col gap-0.5">
            {fieldErrors.Token.map((erro, index) => (
              <p key={index} className="text-xs font-medium text-red-600">
                • {erro}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Input Nova Senha */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Nova Senha</label>
        <input 
          type="password" 
          value={novaSenha} 
          onChange={(e) => setNovaSenha(e.target.value)} 
          className={`w-full rounded border p-2.5 text-sm focus:outline-none ${
            fieldErrors.NovaSenha ? 'border-red-500 focus:border-red-500 bg-red-50/30' : 'border-gray-300 focus:border-blue-500'
          }`}
        />
        {/* Mostra todas as quebras de linha para múltiplos erros de Nova Senha */}
        {fieldErrors.NovaSenha && (
          <div className="mt-1 flex flex-col gap-0.5">
            {fieldErrors.NovaSenha.map((erro, index) => (
              <p key={index} className="text-xs font-medium text-red-600">
                • {erro}
              </p>
            ))}
          </div>
        )}
      </div>

      <button type="submit" disabled={loading} className="w-full rounded bg-[#42a1ec] p-3 font-medium text-white hover:bg-blue-500 disabled:bg-gray-400">
        {loading ? 'Processando...' : 'Alterar Senha'}
      </button>

      <div className="text-center">
        <Link to="/login" className="text-xs text-blue-500 hover:underline">Voltar para o Login</Link>
      </div>
    </form>
  );
}
