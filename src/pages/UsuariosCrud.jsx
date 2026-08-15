import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight, X, Key } from 'lucide-react';
import { apiClient } from '../services/apiClient';

export default function UsuariosCrud() {
  console.log('[UsuariosCrud] Componente inicializado e renderizado.');

  // Estados de dados e paginação baseados no backend C#
  const [usuarios, setUsuarios] = useState([]);
  const [perfisDisponiveis, setPerfisDisponiveis] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [paginacao, setPaginacao] = useState({
    PageNumber: 1,
    PageSize: 10,
    TotalItems: 0,
    TotalPages: 0
  });

  // Estados do Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [idSelecionado, setIdSelecionado] = useState(null); 
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState(''); 
  const [novaSenha, setNovaSenha] = useState(''); 
  const [perfilId, setPerfilId] = useState('');
  const [ativo, setAtivo] = useState('S');

  // Estados para exibição de erros da API
  const [globalError, setGlobalError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // 1. Carregar registros de Usuários da API: route.MapGet("", ...)
  const carregarUsuarios = async (page = 1) => {
    console.log(`[UsuariosCrud] Chamando carregarUsuarios() para a página: ${page}`);
    setLoading(true);
    setGlobalError('');
    const paginaAlvo = parseInt(page, 10) || 1;
    const tamanhoPagina = parseInt(paginacao.PageSize, 10) || 10;

    try {
      console.log('[UsuariosCrud] apiClient.get para /usuarios prestes a ser disparado...');
      const res = await apiClient.get(`/usuarios?page=${paginaAlvo}&pageSize=${tamanhoPagina}`);
      console.log('[UsuariosCrud] Resposta bruta recebida de /usuarios:', res);
      
      const listaUsuarios = res?.Data || res?.data || [];
      const metaPaginacao = res?.Pagination || res?.pagination;

      setUsuarios(Array.isArray(listaUsuarios) ? listaUsuarios : []);

      if (metaPaginacao) {
        setPaginacao({
          PageNumber: parseInt(metaPaginacao.PageNumber || metaPaginacao.pageNumber, 10) || paginaAlvo,
          PageSize: parseInt(metaPaginacao.PageSize || metaPaginacao.pageSize, 10) || tamanhoPagina,
          TotalItems: parseInt(metaPaginacao.TotalItems || metaPaginacao.totalItems, 10) || 0,
          TotalPages: parseInt(metaPaginacao.TotalPages || metaPaginacao.totalPages, 10) || 0
        });
      }
    } catch (err) {
      // console.error('[UsuariosCrud] Erro crítico pego no catch de carregarUsuarios:', err);
      // setGlobalError(err.message || 'Falha ao conectar com o endpoint de usuários.');
      if (err.validationErrors) {
          const errosFormatados = {};
          
          Object.keys(err.validationErrors).forEach(key => {
            // Remove o prefixo "Input." ou "input." caso o C# devolva devido à Tupla do PUT
            const partes = key.split('.');
            const nomePropriedade = partes[partes.length - 1]; 
            
            // Força a primeira letra a ficar Maiúscula ("Email") para o JSX
            const chaveNormalizada = nomePropriedade.charAt(0).toUpperCase() + nomePropriedade.slice(1);
            
            errosFormatados[chaveNormalizada] = err.validationErrors[key];
          });

          setFieldErrors(errosFormatados);
      } else {
          setGlobalError(err.message);
      }
      } finally {
          setLoading(false);
      }
  };

  // 2. Carregar Perfis de forma isolada para não travar a tela
  const carregarPerfisAuxiliares = async () => {
    console.log('[UsuariosCrud] Chamando carregarPerfisAuxiliares()...');
    try {
      const res = await apiClient.get('/perfis?page=1&pageSize=100');
      console.log('[UsuariosCrud] Resposta bruta recebida de /perfis:', res);
      const listaPerfis = res?.Data || res?.data || [];
      setPerfisDisponiveis(Array.isArray(listaPerfis) ? listaPerfis : []);
    } catch (err) {
      console.error('[UsuariosCrud] Erro isolado ao carregar perfis auxiliares (a listagem de usuários continuará tentando rodar):', err);
    }
  };

  // Ciclo de vida inicial controlado
  useEffect(() => {
    console.log('[UsuariosCrud] useEffect disparado.');
    
    // Função assíncrona interna para garantir ordem sequencial de execução sem concorrência destrutiva
    const inicializarTela = async () => {
      await carregarPerfisAuxiliares();
      await carregarUsuarios(1);
    };

    inicializarTela();
  }, []);

  // 3. Controlar abertura do Modal
  const abrirModal = (usuario = null) => {
    setFieldErrors({});
    setGlobalError('');
    if (usuario) {
      setIdSelecionado(usuario.id || usuario.Id || null);
      setEmail(usuario.email || usuario.Email || '');
      setSenha('');
      setNovaSenha('');
      setPerfilId(usuario.perfilId || usuario.PerfilId || usuario.perfil?.id || usuario.Perfil?.Id || '');
      setAtivo(usuario.ativo || usuario.Ativo || 'S');
    } else {
      setIdSelecionado(null);
      setEmail('');
      setSenha('');
      setNovaSenha('');
      setPerfilId('');
      setAtivo('S');
    }
    setModalAberto(true);
  };

  // 4. Salvar Usuário tratando FluentValidation: MapPost / MapPut
  const handleSalvar = async (e) => {
    e.preventDefault();
    setGlobalError('');
    setFieldErrors({});

    const payload = idSelecionado 
      ? { email, novaSenha, perfilId, ativo } 
      : { email, senha, perfilId, ativo };   

    try {
      if (idSelecionado) {
        await apiClient.put(`/usuarios/${idSelecionado}`, payload);
      } else {
        await apiClient.post('/usuarios', payload);
      }
      setModalAberto(false);
      carregarUsuarios(paginacao.PageNumber);
    } catch (err) {
      // if (err.validationErrors) {
      //   setFieldErrors(err.validationErrors);
      if (err.validationErrors) {
        const errosFormatados = {};
        
        Object.keys(err.validationErrors).forEach(key => {
          // 1. Quebra a chave por pontos. Ex: "Input.Email" vira ["Input", "Email"]
          const partes = key.split('.');
          
          // 2. Pega estritamente a ÚLTIMA palavra do array ("Email")
          const nomePropriedade = partes[partes.length - 1]; 
          
          // 3. Garante que a primeira letra seja sempre Maiúscula para bater com o JSX
          const chaveNormalizada = nomePropriedade.charAt(0).toUpperCase() + nomePropriedade.slice(1);
          
          // 4. Copia a lista de erros para a nova chave limpa
          errosFormatados[chaveNormalizada] = err.validationErrors[key];
        });

        setFieldErrors(errosFormatados);
      } else {
        setGlobalError(err.message);
      }
    }
  };

  // 5. Deletar Usuário: route.MapDelete("/{id:guid}")
  const handleDeletar = async (id) => {
    if (!confirm('Deseja realmente remover este usuário?')) return;
    setGlobalError('');
    try {
      await apiClient.delete(`/usuarios/${id}`);
      carregarUsuarios(paginacao.PageNumber);
    } catch (err) {
      setGlobalError(err.message);
    }
  };

  return (
    <div className="space-y-6 w-full px-2">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between w-full">
        <div>
          <h1 className="text-2xl font-bold text-gray-950">Usuários</h1>
          <p className="text-sm text-gray-600">Controle de acessos, credenciais e vinculação de perfis.</p>
        </div>
        <button
          onClick={() => abrirModal()}
          className="flex items-center gap-2 rounded bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 transition cursor-pointer shadow-sm"
        >
          <Plus size={18} /> Novo Usuário
        </button>
      </div>

      {globalError && (
        <div className="bg-red-50 text-red-600 p-3 rounded text-sm font-medium border border-red-200 w-full">
          {globalError}
        </div>
      )}

      {/* DataGrid Largo Full-Width */}
      <div className="w-full overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-md">
        <table className="w-full border-collapse text-left text-sm text-gray-500 table-fixed">
          <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-700 border-b">
            <tr>
              <th className="px-6 py-4 w-[40%]">E-mail / Usuário</th>
              <th className="px-6 py-4 w-[25%]">Perfil Vinculado</th>
              <th className="px-6 py-4 w-[15%]">Status</th>
              <th className="px-6 py-4 w-[20%] text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 border-t">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-gray-400">Carregando registros da API...</td>
              </tr>
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-gray-400">Nenhum usuário retornado do sistema.</td>
              </tr>
            ) : (
              usuarios.map((usr) => (
                <tr key={usr.id || usr.Id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-900 truncate" title={usr.email || usr.Email}>
                    {usr.email || usr.Email}
                  </td>
                  <td className="px-6 py-4 text-gray-700 font-medium">
                    {usr.perfil?.nome || usr.Perfil?.Nome || usr.perfilNome || usr.PerfilNome || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      (usr.ativo === 'S' || usr.Ativo === 'S') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {(usr.ativo === 'S' || usr.Ativo === 'S') ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-4">
                      <button onClick={() => abrirModal(usr)} className="text-gray-400 hover:text-blue-600 transition cursor-pointer" title="Editar">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeletar(usr.id || usr.Id)} className="text-gray-400 hover:text-red-600 transition cursor-pointer" title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Paginação */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4 w-full">
          <span className="text-sm text-gray-700">
            Página <span className="font-semibold">{paginacao.PageNumber}</span> de <span className="font-semibold">{paginacao.TotalPages}</span> (<span className="font-semibold">{paginacao.TotalItems}</span> itens no total)
          </span>
          <div className="flex gap-2">
            {/* <button
              onClick={() => carregarUsuarios(paginacao.PageNumber - 1)}
              disabled={paginacao.PageNumber <= 1 || loading}
            />
            <button
              onClick={() => carregarUsuarios(paginacao.PageNumber + 1)}
              disabled={paginacao.PageNumber >= paginacao.TotalPages || loading}
              className="inline-flex h-9 w-9 items-center justify-center rounded border border-gray-300 text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            > */}
                {/* BOTÃO VOLTAR (PREV) */}
                <button
                  type="button"
                  onClick={() => carregarUsuarios(paginacao.PageNumber - 1)}
                  disabled={paginacao.PageNumber <= 1 || loading}
                  className="inline-flex h-9 w-9 items-center justify-center rounded border border-gray-300 text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  title="Página Anterior"
                >
                  <ChevronLeft size={18} />
                </button>

                {/* BOTÃO AVANÇAR (NEXT) */}
                <button
                  type="button"
                  onClick={() => carregarUsuarios(paginacao.PageNumber + 1)}
                  disabled={paginacao.PageNumber >= paginacao.TotalPages || loading}
                  className="inline-flex h-9 w-9 items-center justify-center rounded border border-gray-300 text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  title="Próxima Página"
                >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Suspenso de Cadastro / Edição */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl border relative space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">
                {idSelecionado ? 'Editar Usuário Existente' : 'Cadastrar Novo Usuário'}
              </h3>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600 transition cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="space-y-4">
              {/* E-mail */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">E-mail / Login</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  className={`w-full rounded border p-2.5 text-sm focus:outline-none ${
                    fieldErrors.Email ? 'border-red-500 bg-red-50/20' : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                {fieldErrors.Email && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    {fieldErrors.Email.map((erro, index) => (
                      <p key={index} className="text-xs font-medium text-red-600">• {erro}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Senha Condicional */}
              {!idSelecionado ? (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Senha</label>
                  <input
                    type="password"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Defina a senha de acesso"
                    className={`w-full rounded border p-2.5 text-sm focus:outline-none ${
                      fieldErrors.Senha ? 'border-red-500 bg-red-50/20' : 'border-gray-300 focus:border-blue-500'
                    }`}
                  />
                  {fieldErrors.Senha && (
                    <div className="mt-1 flex flex-col gap-0.5">
                      {fieldErrors.Senha.map((erro, index) => (
                        <p key={index} className="text-xs font-medium text-red-600">• {erro}</p>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Key size={14} className="text-gray-400" /> Nova Senha (Opcional)
                  </label>
                  <input
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Deixe em branco para manter a atual"
                    className={`w-full rounded border p-2.5 text-sm focus:outline-none ${
                      fieldErrors.NovaSenha ? 'border-red-500 bg-red-50/20' : 'border-gray-300 focus:border-blue-500'
                    }`}
                  />
                  {fieldErrors.NovaSenha && (
                    <div className="mt-1 flex flex-col gap-0.5">
                      {fieldErrors.NovaSenha.map((erro, index) => (
                        <p key={index} className="text-xs font-medium text-red-600">• {erro}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ComboBox PerfilId */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Perfil do Usuário</label>
                <div className="relative">
                  <select
                    required
                    value={perfilId}
                    onChange={(e) => setPerfilId(e.target.value)}
                    className={`w-full rounded border bg-white p-2.5 pr-10 text-sm focus:outline-none appearance-none cursor-pointer ${
                      fieldErrors.PerfilId ? 'border-red-500 bg-red-50/20' : 'border-gray-300 focus:border-blue-500'
                    }`}
                  >
                    <option value="">Selecione um perfil...</option>
                    {perfisDisponiveis.map((p) => (
                      <option key={p.id || p.Id} value={p.id || p.Id}>
                        {p.nome || p.Nome}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://w3.org" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  </div>
                </div>
                {fieldErrors.PerfilId && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    {fieldErrors.PerfilId.map((erro, index) => (
                      <p key={index} className="text-xs font-medium text-red-600">• {erro}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Status Cadastral</label>
                <div className="relative">
                  <select
                    value={ativo}
                    onChange={(e) => setAtivo(e.target.value)}
                    className="w-full rounded border border-gray-300 bg-white p-2.5 text-sm focus:border-blue-500 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="S">Ativo</option>
                    <option value="N">Inativo</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://w3.org" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-3 pt-2 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition cursor-pointer"
                >
                  Confirmar e Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
