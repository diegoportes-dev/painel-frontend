import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/authService';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({}); // <-- Guarda os erros por campo
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setGlobalError('');
    setFieldErrors({}); // Limpa os erros anteriores
    setLoading(true);

    try {
      const data = await authService.login(email, password);
      localStorage.setItem('token', data.token);
      navigate('/app/dashboard');
    } catch (err) {
      if (err.validationErrors) {
        // Mapeia o dicionário do FluentValidation (ex: { Email: ["O e-mail é obrigatório"] })
        setFieldErrors(err.validationErrors);
      } else {
        setGlobalError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      <h2 className="text-xl font-medium text-gray-950">Login</h2>
      
      {globalError && (
        <div className="bg-red-50 text-red-600 p-3 rounded text-sm font-medium">
          {globalError}
        </div>
      )}

      {/* Campo Email */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Email</label>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email" 
          className={`w-full rounded border p-2.5 text-sm focus:outline-none ${
            fieldErrors.Email ? 'border-red-500 focus:border-red-500 bg-red-50/30' : 'border-gray-300 focus:border-blue-500'
          }`}
        />
        {/* Mostra todas as mensagens de erro retornadas para o Email com quebra de linha */}
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

      {/* Campo Password */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Password</label>
        <div className="relative">
          <input 
            type={showPassword ? "text" : "password"} 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password" 
            className={`w-full rounded border p-2.5 pr-10 text-sm focus:outline-none ${
              fieldErrors.Senha ? 'border-red-500 focus:border-red-500 bg-red-50/30' : 'border-gray-300 focus:border-blue-500'
            }`}
          />
          <button 
            type="button" 
            onClick={() => setShowPassword(!showPassword)} 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {/* Mostra todas as mensagens de erro retornadas para a Senha com quebra de linha */}
        {fieldErrors.Senha && (
          <div className="mt-1 flex flex-col gap-0.5">
            {fieldErrors.Senha.map((erro, index) => (
              <p key={index} className="text-xs font-medium text-red-600">
                • {erro}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="text-right">
        <Link to="/forgot-password" className="text-xs text-blue-500 hover:underline">Forgot password?</Link>
      </div>

      <button 
        type="submit" 
        disabled={loading} 
        className="w-full rounded bg-[#42a1ec] p-3 font-medium text-white transition hover:bg-blue-500 disabled:bg-gray-400"
      >
        {loading ? 'Carregando...' : 'Log In'}
      </button>
    </form>
  );
}
