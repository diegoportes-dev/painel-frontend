import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({}); // <-- Estado para erros por campo
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setGlobalError('');
    setFieldErrors({});
    setMensagem('');
    setLoading(true);

    try {
      const data = await authService.esqueciSenha(email);
      setMensagem(data.message + " Redirecionando para a tela de ativação...");

      setTimeout(() => {
        navigate('/reset-password', { state: { emailDoUsuario: email } });
      }, 3000);
    } catch (err) {
      if (err.validationErrors) {
        setFieldErrors(err.validationErrors); // Pega o erro do FluentValidation (ex: fieldErrors.Email)
      } else {
        setGlobalError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleForgotPassword} className="space-y-5">
      <h2 className="text-xl font-medium text-gray-950">Esqueci Senha</h2>
      
      {globalError && <div className="bg-red-50 text-red-600 p-3 rounded text-sm font-medium">{globalError}</div>}
      {mensagem && <div className="bg-green-50 text-green-600 p-3 rounded text-sm font-medium">{mensagem}</div>}

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Email</label>
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Entre com seu e-mail" 
          className={`w-full rounded border p-2.5 text-sm focus:outline-none ${
            fieldErrors.Email ? 'border-red-500 focus:border-red-500 bg-red-50/30' : 'border-gray-300 focus:border-blue-500'
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

      <button 
        type="submit" 
        disabled={loading}
        className="w-full rounded bg-[#42a1ec] p-3 font-medium text-white hover:bg-blue-500 disabled:bg-gray-400"
      >
        {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
      </button>

      <div className="text-center">
        <Link to="/login" className="text-xs text-blue-500 hover:underline">Voltar para Login</Link>
      </div>
    </form>
  );
}
