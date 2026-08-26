import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight, X, ArrowUpDown, Search } from 'lucide-react';
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

  // Estados para Controle de Filtro e Ordenação no Front-end
  const [filtroTexto, setFiltroTexto] = useState('');
  const [ordenacao, setOrdenacao] = useState({ coluna: 'tenant', direcao: 'asc' });

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

  // 1. Carregar registros de Usuários da API
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
      if (err.validationErrors) {
        const errosFormatados = {};
        Object.keys(err.validationErrors).forEach(key => {
          const partes = key.split('.');
          const nomePropriedade = partes[partes.length - 1]; 
          const chaveNormalizada = nomePropriedade.charAt(0).toUpperCase() + nomePropriedade.slice(1);
          errosFormatados[chaveNormalizada] = err.validationErrors[key];
        });
        setFieldErrors(errosFormatados);
      } else {
        setGlobalError(err.message || 'Falha ao conectar com o endpoint de usuários.');
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
      console.error('[UsuariosCrud] Erro isolado ao carregar perfis auxiliares:', err);
    }
  };

  useEffect(() => {
    console.log('[UsuariosCrud] useEffect disparado.');
    const inicializarTela = async () => {
      await carregarPerfisAuxiliares();
      await carregarUsuarios(1);
    };
    inicializarTela();
  }, []);

  // Lógica do DataGrid: Alteração da coluna ordenada
  const handleMudarOrdenacao = (coluna) => {
    setOrdenacao(prev => ({
      coluna,
      direcao: prev.coluna === coluna && prev.direcao === 'asc' ? 'desc' : 'asc'
    }));
  };

  // PROCESSAMENTO EM MEMÓRIA: Filtragem por texto e Ordenação incluindo Tenant
  const usuariosProcessados = usuarios
    .filter(usuario => {
      const termo = filtroTexto.toLowerCase();
      const perfilNome = usuario.perfilNome || usuario.PerfilNome || usuario.perfil?.nome || usuario.Perfil?.Nome || '';
      const tenantNome = usuario.tenantNome || usuario.TenantNome || usuario.tenant?.nome || usuario.Tenant?.Nome || 'Global / Master';
      return (
        usuario.email?.toLowerCase().includes(termo) ||
        perfilNome.toLowerCase().includes(termo) ||
        tenantNome.toLowerCase().includes(termo)
      );
    })
    .sort((a, b) => {
      const col = ordenacao.coluna;
      let valA = '';
      let valB = '';

      if (col === 'tenant') {
        valA = (a.tenantNome || a.TenantNome || a.tenant?.nome || a.Tenant?.Nome || 'Global / Master').toString().toLowerCase();
        valB = (b.tenantNome || b.TenantNome || b.tenant?.nome || b.Tenant?.Nome || 'Global / Master').toString().toLowerCase();
      } else if (col === 'perfil') {
        valA = (a.perfilNome || a.PerfilNome || a.perfil?.nome || a.Perfil?.Nome || '').toString().toLowerCase();
        valB = (b.perfilNome || b.PerfilNome || b.perfil?.nome || b.Perfil?.Nome || '').toString().toLowerCase();
      } else {
        valA = (a[col] || '').toString().toLowerCase();
        valB = (b[col] || '').toString().toLowerCase();
      }

      if (valA < valB) return ordenacao.direcao === 'asc' ? -1 : 1;
      if (valA > valB) return ordenacao.direcao === 'asc' ? 1 : -1;
      return 0;
    });

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

  // 4. Salvar Usuário tratando FluentValidation
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
      if (err.validationErrors) {
        const errosFormatados = {};
        Object.keys(err.validationErrors).forEach(key => {
          const partes = key.split('.');
          const nomePropriedade = partes[partes.length - 1]; 
          const chaveNormalizada = nomePropriedade.charAt(0).toUpperCase() + nomePropriedade.slice(1);
          errosFormatados[chaveNormalizada] = err.validationErrors[key];
        });
        setFieldErrors(errosFormatados);
      } else {
        setGlobalError(err.message || 'Erro inesperado ao salvar.');
      }
    }
  };

  // 5. Deletar Usuário
  const handleDeletar = async (id) => {
    if (!confirm('Deseja realmente remover este usuário?')) return;
    setGlobalError('');
    try {
      await apiClient.delete(`/usuarios/${id}`);
      carregarUsuarios(paginacao.PageNumber);
    } catch (err) {
      setGlobalError(err.message || 'Erro ao remover usuário.');
    }
  };

  return (
    <div className="space-y-6 w-full px-2">
      {/* Barra unificada de Ação no Topo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
        <div className="relative w-full max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Filtrar por empresa, e-mail ou perfil..."
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            className="w-full rounded border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>

        <button
          type="button"
          onClick={() => abrirModal()}
          className="flex items-center gap-2 rounded bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 transition cursor-pointer shadow-sm whitespace-nowrap shrink-0 w-full sm:w-auto justify-center"
        >
          <Plus size={18} /> Novo Usuário
        </button>
      </div>

      {globalError && (
        <div className="bg-red-50 text-red-600 p-3 rounded text-sm font-medium border border-red-200 w-full">
          {globalError}
        </div>
      )}

      {/* Grid de Dados */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-md w-full">
        <table className="w-full border-collapse text-left text-sm text-gray-700">
          <thead className="bg-gray-50 text-sm font-bold uppercase text-gray-900 border-b-2 border-gray-300 select-none">
            <tr>
              <th 
                onClick={() => handleMudarOrdenacao('tenant')} 
                className="px-6 py-4 cursor-pointer hover:bg-gray-100 hover:text-blue-600 transition"
              >
                <div className="flex items-center gap-1.5 font-bold tracking-wide">
                  Empresa / Tenant <ArrowUpDown size={14} className="text-gray-500 shrink-0" />
                </div>
              </th>
              <th 
                onClick={() => handleMudarOrdenacao('email')} 
                className="px-6 py-4 cursor-pointer hover:bg-gray-100 hover:text-blue-600 transition"
              >
                <div className="flex items-center gap-1.5 font-bold tracking-wide">
                  E-mail <ArrowUpDown size={14} className="text-gray-500 shrink-0" />
                </div>
              </th>
              <th 
                onClick={() => handleMudarOrdenacao('perfil')} 
                className="px-6 py-4 cursor-pointer hover:bg-gray-100 hover:text-blue-600 transition"
              >
                <div className="flex items-center gap-1.5 font-bold tracking-wide">
                  Perfil Associado <ArrowUpDown size={14} className="text-gray-400 shrink-0" />
                </div>
              </th>
              <th className="px-6 py-4 font-bold tracking-wide">Status</th>
              <th className="px-6 py-4 text-right w-28 font-bold tracking-wide">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 border-t">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-400">Carregando registros...</td>
              </tr>
            ) : usuariosProcessados.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-400">Nenhum usuário localizado com os critérios informados.</td>
              </tr>
            ) : (
              usuariosProcessados.map((usuario) => {
                const tNome = usuario.tenantNome || usuario.TenantNome || usuario.tenant?.nome || usuario.Tenant?.Nome || 'Global / Master';
                const pNome = usuario.perfilNome || usuario.PerfilNome || usuario.perfil?.nome || usuario.Perfil?.Nome || '—';
                const uId = usuario.id || usuario.Id;
                const uAtivo = usuario.ativo || usuario.Ativo || 'S';
                return (
                  <tr key={uId} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-4 text-gray-600 font-medium">{tNome}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{usuario.email || usuario.Email}</td>
                    <td className="px-6 py-4 text-gray-600">{pNome}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold border ${
                        uAtivo === 'S' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {uAtivo === 'S' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => abrirModal(usuario)} className="text-gray-500 hover:text-blue-600 transition cursor-pointer" title="Editar">
                          <Edit2 size={16} />
                        </button>
                        <button type="button" onClick={() => handleDeletar(uId)} className="text-gray-500 hover:text-red-600 transition cursor-pointer" title="Excluir">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Rodapé Paginador */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-3.5 text-xs text-gray-500 select-none">
          <span>Total de <strong>{paginacao.TotalItems}</strong> registros</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={paginacao.PageNumber <= 1 || loading}
              onClick={() => carregarUsuarios(paginacao.PageNumber - 1)}
              className="p-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-medium text-gray-700">Página {paginacao.PageNumber} de {paginacao.TotalPages}</span>
            <button
              type="button"
              disabled={paginacao.PageNumber >= paginacao.TotalPages || loading}
              onClick={() => carregarUsuarios(paginacao.PageNumber + 1)}
              className="p-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 6. MODAL FLUTUANTE EMBUTIDO */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-lg bg-white shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 p-4">
              <h2 className="text-base font-bold text-gray-900">
                {idSelecionado ? 'Editar Credenciais do Usuário' : 'Novo Usuário do Sistema'}
              </h2>
              <button 
                type="button" 
                onClick={() => setModalAberto(false)} 
                className="text-gray-400 hover:text-gray-600 p-1 transition rounded hover:bg-gray-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="p-4 space-y-4">
              {/* E-mail */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700 uppercase">Endereço de E-mail</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full rounded border p-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    fieldErrors.Email ? 'border-red-400 bg-red-50/20' : 'border-gray-300'
                  }`}
                />
                {fieldErrors.Email && <span className="text-xs text-red-500 font-medium mt-0.5">• {fieldErrors.Email}</span>}
              </div>

              {/* Senhas Condicionais */}
              {!idSelecionado ? (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700 uppercase">Senha de Acesso</label>
                  <input
                    required
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className={`w-full rounded border p-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      fieldErrors.Senha ? 'border-red-400 bg-red-50/20' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors.Senha && <span className="text-xs text-red-500 font-medium mt-0.5">• {fieldErrors.Senha}</span>}
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700 uppercase">Nova Senha (Opcional)</label>
                  <input
                    type="password"
                    placeholder="Deixe em branco para não alterar"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className={`w-full rounded border p-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      fieldErrors.NovaSenha ? 'border-red-400 bg-red-50/20' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors.NovaSenha && <span className="text-xs text-red-500 font-medium mt-0.5">• {fieldErrors.NovaSenha}</span>}
                </div>
              )}

              {/* Combo Perfil */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700 uppercase">Perfil Administrativo</label>
                <select
                  required
                  value={perfilId}
                  onChange={(e) => setPerfilId(e.target.value)}
                  className={`w-full rounded border p-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    fieldErrors.PerfilId ? 'border-red-400 bg-red-50/20' : 'border-gray-300'
                  }`}
                >
                  <option value="">Vincule um grupo...</option>
                  {perfisDisponiveis.map(p => (
                    <option key={p.id || p.Id} value={p.id || p.Id}>{p.nome || p.Nome}</option>
                  ))}
                </select>
                {fieldErrors.PerfilId && <span className="text-xs text-red-500 font-medium mt-0.5">• {fieldErrors.PerfilId}</span>}
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700 uppercase">Status Operacional</label>
                <select
                  value={ativo}
                  onChange={(e) => setAtivo(e.target.value)}
                  className="w-full rounded border border-gray-300 p-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="S">Ativo</option>
                  <option value="N">Inativo</option>
                </select>
              </div>

              {/* Botões Ações */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition cursor-pointer shadow-sm"
                >
                  Salvar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
