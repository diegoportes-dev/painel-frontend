import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Building2, Ticket, Mail, ShieldKeyhole } from 'lucide-react';
import { authService } from '../services/authService';
import { apiClient } from '../services/apiClient';

export default function RegisterUser() {
  console.log('[RegisterUser] Componente inicializado e renderizado.');

  // Estados dos campos do payload (SetupTenantWithTokenDto)
  const [tokenCadastro, setTokenCadastro] = useState('');
  const [emailCadastro, setEmailCadastro] = useState('');
  const [nome, setNome] = useState('');
  const [nomeSecundario, setNomeSecundario] = useState('');
  const [documento, setDocumento] = useState('');
  const [tipo, setTipo] = useState(2); // PJ ou PF
  const [senhaDefinitiva, setSenhaDefinitiva] = useState('');

  // Estados de controle de feedback e UX
  const [showPassword, setShowPassword] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({}); // Dicionário do FluentValidation
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setGlobalError('');
    setFieldErrors({});
    setMensagem('');
    setLoading(true);

    // Monta o payload exatamente como o C# espera receber
    const payload = {
      tokenCadastro,
      emailCadastro,
      nome,
      nomeSecundario,
      documento,
      tipo,
      senhaDefinitiva
    };

    try {
      const data = await authService.setupCadastro(payload);
      setMensagem(data?.message || "Ambiente e Tenant configurados com sucesso! Redirecionando para o login...");

      // Aguarda 3 segundos exibindo o card verde de sucesso e envia para a tela de autenticação
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      if (err.validationErrors) {
        // Normaliza as chaves do FluentValidation para bater com as propriedades do JSX
        const errosFormatados = {};
        Object.keys(err.validationErrors).forEach(key => {
          const partes = key.split('.');
          const nomePropriedade = partes[partes.length - 1]; 
          const chaveNormalizada = nomePropriedade.charAt(0).toUpperCase() + nomePropriedade.slice(1);
          errosFormatados[chaveNormalizada] = err.validationErrors[key];
        });
        setFieldErrors(errosFormatados);
      } else {
        setGlobalError(err.message || "Falha ao processar a ativação do ambiente.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para renderizar marcadores "•" para erros de campo
  const renderError = (field) => {
    if (!fieldErrors[field]) return null;
    return (
      <div className="mt-1 flex flex-col gap-0.5">
        {fieldErrors[field].map((erro, index) => (
          <p key={index} className="text-xs font-medium text-red-600">
            • {erro}
          </p>
        ))}
      </div>
    );
  };

  return (
    <form onSubmit={handleRegister} className="space-y-5 max-w-xl mx-auto bg-white p-6 rounded-lg shadow-xs w-full">
      <div className="border-b border-gray-100 pb-3">
        <h2 className="text-xl font-bold text-gray-950 flex items-center gap-2">
          <Building2 className="text-blue-600 w-5 h-5" /> Configurar Ambiente & Conta
        </h2>
        <p className="text-xs text-gray-500 mt-1">Consuma seu token de ativação para provisionar o seu banco MySQL isolado.</p>
      </div>
      
      {globalError && <div className="bg-red-50 text-red-600 p-3 rounded text-sm font-medium border border-red-200 w-full">{globalError}</div>}
      {mensagem && <div className="bg-green-50 text-green-600 p-3 rounded text-sm font-medium border border-green-200 w-full">{mensagem}</div>}

      {/* BLOCO 1: CHAVES DE ATIVAÇÃO - Corrigido para ocupar 100% da largura real da tela */}
       <div className="space-y-4 w-full">
        
        {/* Linha 1: Token de Cadastro */}
        <div className="space-y-1.5 flex flex-col w-full">
          <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1 min-h-[16px]">
            <Ticket size={12} className="text-gray-400" /> Token de Cadastro
          </label>
          <input 
            required
            type="text" 
            value={tokenCadastro}
            onChange={(e) => setTokenCadastro(e.target.value)}
            placeholder="Ex: HASH32CARACTERES" 
            className={`w-full rounded border p-2.5 text-sm bg-white h-10 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              fieldErrors.TokenCadastro ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {renderError('TokenCadastro')}
        </div>

        {/* Linha 2: E-mail Pré-Cadastrado */}
        <div className="space-y-1.5 flex flex-col w-full">
          <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1 min-h-[16px]">
            <Mail size={12} className="text-gray-400" /> E-mail Pré-Cadastrado
          </label>
          <input 
            required
            type="email" 
            value={emailCadastro}
            onChange={(e) => setEmailCadastro(e.target.value)}
            placeholder="seu-email@provedor.com" 
            className={`w-full rounded border p-2.5 text-sm bg-white h-10 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              fieldErrors.EmailCadastro ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {renderError('EmailCadastro')}
        </div>

      </div>

      {/* BLOCO 2: DADOS CORPORATIVOS / EMPRESA */}
      <div className="space-y-4 w-full">
        
        {/* Linha 3: Nome Fantasia */}
        <div className="space-y-1.5 flex flex-col w-full">
          <label className="text-xs font-bold text-gray-700 uppercase min-h-[16px]">
            Nome Fantasia / Empresa
          </label>
          <input 
            required
            type="text" 
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome Comercial" 
            className={`w-full rounded border p-2.5 text-sm h-10 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              fieldErrors.Nome ? 'border-red-400 bg-red-50/20' : 'border-gray-300'
            }`}
          />
          {renderError('Nome')}
        </div>

        {/* Linha 4: Razão Social */}
        <div className="space-y-1.5 flex flex-col w-full">
          <label className="text-xs font-bold text-gray-700 uppercase min-h-[16px]">
            Razão Social / Nome Completo
          </label>
          <input 
            required
            type="text" 
            value={nomeSecundario}
            onChange={(e) => setNomeSecundario(e.target.value)}
            placeholder="Razão Social Completa" 
            className={`w-full rounded border p-2.5 text-sm h-10 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              fieldErrors.NomeSecundario ? 'border-red-400 bg-red-50/20' : 'border-gray-300'
            }`}
          />
          {renderError('NomeSecundario')}
        </div>

                {/* Linha 5: Tipo Fiscal e Documento Juntos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start w-full">
          
          {/* Tipo Fiscal (1/3 da largura) */}
          <div className="space-y-1.5 flex flex-col w-full">
            <label className="text-xs font-bold text-gray-700 uppercase min-h-[16px]">
              Tipo Fiscal
            </label>
            <select
              value={tipo}
              // 🛠️ Converte o valor selecionado para inteiro puro antes de salvar no estado
              onChange={(e) => setTipo(parseInt(e.target.value, 10))}
              className="w-full rounded border border-gray-300 p-2 text-sm bg-white h-10 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {/* 🛠️ Valores alterados para inteiros conforme regra do banco */}
              <option value={2}>Pessoa Jurídica (CNPJ)</option>
              <option value={1}>Pessoa Física (CPF)</option>
            </select>
          </div>

          {/* Documento (2/3 da largura) */}
          <div className="space-y-1.5 flex flex-col sm:col-span-2 w-full">
            {/* 🛠️ Checagem adaptada para o inteiro 2 */}
            <label className="text-xs font-bold text-gray-700 uppercase min-h-[16px]">
              Documento ({tipo === 2 ? 'CNPJ' : 'CPF'})
            </label>
            <input 
              required
              type="text" 
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              // 🛠️ Placeholder adaptado para o inteiro 2
              placeholder={tipo === 2 ? '00.000.000/0001-00' : '000.000.000-00'} 
              className={`w-full rounded border p-2.5 text-sm h-10 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                fieldErrors.Documento ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {renderError('Documento')}
          </div>

        </div>

      </div>

      {/* BLOCO 3: CREDENCIAIS DEFINITIVAS */}
      <div className="space-y-1.5 border-t border-gray-100 pt-3 flex flex-col w-full">
        <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1 min-h-[16px]">
          <ShieldKeyhole size={14} className="text-gray-400" /> Senha Definitiva de Acesso
        </label>
        <div className="relative w-full">
          <input 
            required
            type={showPassword ? "text" : "password"} 
            value={senhaDefinitiva} 
            onChange={(e) => setSenhaDefinitiva(e.target.value)}
            placeholder="Crie sua nova senha forte" 
            className={`w-full rounded border p-2.5 pr-10 text-sm h-10 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              fieldErrors.SenhaDefinitiva ? 'border-red-400 bg-red-50/20' : 'border-gray-300'
            }`}
          />
          <button 
            type="button" 
            onClick={() => setShowPassword(!showPassword)} 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {renderError('SenhaDefinitiva')}
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full rounded bg-blue-600 p-3 font-semibold text-sm text-white transition hover:bg-blue-700 disabled:bg-gray-400 cursor-pointer shadow-xs"
      >
        {loading ? 'Provisionando ambiente no MySQL...' : 'Finalizar Cadastro e Ativar Sistema'}
      </button>

      <div className="text-center pt-2 select-none w-full">
        <Link to="/login" className="text-xs text-blue-500 hover:underline font-medium">
          Voltar para o Login
        </Link>
      </div>
    </form>
  );
}

