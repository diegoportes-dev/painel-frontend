import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight, X, ArrowUpDown, Search, RotateCcw } from 'lucide-react';
import { apiClient } from '../services/apiClient';

export default function PerfisCrud() {
  console.log('[PerfisCrud] Componente inicializado e renderizado.');

  // Estados de dados e paginação baseados no backend C#
  const [perfis, setPerfis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paginacao, setPaginacao] = useState({
    PageNumber: 1,
    PageSize: 10,
    TotalItems: 0,
    TotalPages: 0
  });

  // Estados para Controle de Filtro e Ordenação no Front-end
  const [filtroTexto, setFiltroTexto] = useState('');
  const [ordenacao, setOrdenacao] = useState({ coluna: 'nome', direcao: 'asc' });

  // Estados do Modal (Formulário completo com Descrição)
  const [modalAberto, setModalAberto] = useState(false);
  const [idSelecionado, setIdSelecionado] = useState(null); // null = POST, guid = PUT
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ativo, setAtivo] = useState('S');

  // Estados para exibição de erros da API (FluentValidation)
  const [globalError, setGlobalError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // 1. Carregar dados da API paginada
  const carregarPerfis = async (page = 1) => {
    setLoading(true);
    setGlobalError('');
    
    const paginaAlvo = parseInt(page, 10) || 1;
    const tamanhoPagina = parseInt(paginacao.PageSize, 10) || 10;

    try {
      const res = await apiClient.get(`/perfis?page=${paginaAlvo}&pageSize=${tamanhoPagina}`);
      const lista = res?.Data || res?.data || [];
      setPerfis(Array.isArray(lista) ? lista : []);
      
      const meta = res?.Pagination || res?.pagination;
      if (meta) {
        setPaginacao({
          PageNumber: parseInt(meta.PageNumber || meta.pageNumber, 10) || paginaAlvo,
          PageSize: parseInt(meta.PageSize || meta.pageSize, 10) || tamanhoPagina,
          TotalItems: parseInt(meta.TotalItems || meta.totalItems, 10) || 0,
          TotalPages: parseInt(meta.TotalPages || meta.totalPages, 10) || 0
        });
      }
    } catch (err) {
      setGlobalError(err.message || 'Falha ao conectar com o barramento da API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarPerfis(1);
  }, []);

  // Lógica do DataGrid: Alteração da coluna ordenada
  const handleMudarOrdenacao = (coluna) => {
    setOrdenacao(prev => ({
      coluna,
      direcao: prev.coluna === coluna && prev.direcao === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Processamento do filtro por texto e ordenação na memória antes de renderizar
  const perfisProcessados = perfis
    .filter(perfil => {
      const termo = filtroTexto.toLowerCase();
      return (
        perfil.nome?.toLowerCase().includes(termo) ||
        perfil.descricao?.toLowerCase().includes(termo)
      );
    })
    .sort((a, b) => {
      const col = ordenacao.coluna;
      const valA = (a[col] || '').toString().toLowerCase();
      const valB = (b[col] || '').toString().toLowerCase();

      if (valA < valB) return ordenacao.direcao === 'asc' ? -1 : 1;
      if (valA > valB) return ordenacao.direcao === 'asc' ? 1 : -1;
      return 0;
    });

  // 2. Controlar abertura do Modal de Cadastro/Edição
  const abrirModal = (perfil = null) => {
    setFieldErrors({});
    setGlobalError('');
    if (perfil) {
      setIdSelecionado(perfil.id || perfil.Id);
      setNome(perfil.nome || perfil.Nome);
      setDescricao(perfil.descricao || perfil.Descricao || '');
      setAtivo(perfil.ativo || perfil.Ativo || 'S');
    } else {
      setIdSelecionado(null);
      setNome('');
      setDescricao('');
      setAtivo('S');
    }
    setModalAberto(true);
  };

  // 3. Salvar Registro tratando FluentValidation
  const handleSalvar = async (e) => {
    e.preventDefault();
    setGlobalError('');
    setFieldErrors({});

    const payload = { nome, descricao, ativo }; 

    try {
      if (idSelecionado) {
        await apiClient.put(`/perfis/${idSelecionado}`, payload);
      } else {
        await apiClient.post('/perfis', payload);
      }
      setModalAberto(false);
      carregarPerfis(paginacao.PageNumber);
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

  // 4. Remover Registro
  const handleDeletar = async (id) => {
    if (!confirm('Deseja realmente remover este perfil?')) return;
    setGlobalError('');
    try {
      await apiClient.delete(`/perfis/${id}`);
      carregarPerfis(paginacao.PageNumber);
    } catch (err) {
      setGlobalError(err.message || 'Erro ao excluir o registro.');
    }
  };

  return (
    // <div className="space-y-6 w-full px-2">
    //   {/* Cabeçalho do painel CRUD */}
    //   <div className="flex items-center justify-between w-full">
    //     {/* <div>
    //       <h1 className="text-2xl font-bold text-gray-950">Perfis de Usuários</h1>
    //       <p className="text-sm text-gray-600">Gerencie grupos, descrições e regras de permissões de acesso.</p>
    //     </div> */}
    //     <button
    //       type="button"
    //       onClick={() => abrirModal()}
    //       className="flex items-center gap-2 rounded bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 transition cursor-pointer shadow-sm"
    //     >
    //       <Plus size={18} /> Novo Perfil
    //     </button>
    //   </div>

    //   {/* Barra de Filtro Integrada */}
    //   <div className="relative w-full max-w-md">
    //     <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
    //       <Search size={16} />
    //     </span>
    //     <input
    //       type="text"
    //       placeholder="Filtrar perfis por nome ou descrição..."
    //       value={filtroTexto}
    //       onChange={(e) => setFiltroTexto(e.target.value)}
    //       className="w-full rounded border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
    //     />
    //   </div>

    //   {globalError && (
    //     <div className="bg-red-50 text-red-600 p-3 rounded text-sm font-medium border border-red-200 w-full">
    //       {globalError}
    //     </div>
    //   )}

      <div className="space-y-6 w-full px-2">
      
      {/* CONTEINER DE AÇÕES ALINHADO (Filtro + Atualizar à esquerda, Botão Novo à direita) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
        
        {/* Bloco de Busca + Botão Resetar */}
        <div className="flex items-center gap-2 w-full max-w-xl">
          
          {/* Input de Busca */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Filtrar perfis por nome ou descrição..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              className="w-full rounded border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          {/* 🛠️ NOVO: Botão de Atualizar / Resetar Busca */}
          <button
            type="button"
            onClick={() => {
              setFiltroTexto('');       // Limpa o texto digitado
              carregarPerfis(1);        // Recarrega a API na página 1
            }}
            className="flex items-center justify-center p-2.5 rounded border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:text-blue-600 transition cursor-pointer shadow-2xs shrink-0"
            title="Resetar busca e atualizar lista"
          >
            <RotateCcw size={16} />
          </button>

        </div>

        {/* Botão Novo Perfil Alinhado à Direita */}
        <button
          type="button"
          onClick={() => abrirModal()}
          className="flex items-center gap-2 rounded bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 transition cursor-pointer shadow-sm whitespace-nowrap shrink-0 w-full sm:w-auto justify-center"
        >
          <Plus size={18} /> Novo Perfil
        </button>

      </div>

      {globalError && (
        <div className="bg-red-50 text-red-600 p-3 rounded text-sm font-medium border border-red-200 w-full">
          {globalError}
        </div>
      )}



      {/* Grid de Dados (DataGrid Avançado) */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-md w-full">
        <table className="w-full border-collapse text-left text-sm text-gray-700">         
          <thead className="bg-gray-50 text-sm font-bold uppercase text-gray-900 border-b-2 border-gray-300 select-none">
            <tr>
              {/* Coluna Nome Ordenável */}
              <th 
                onClick={() => handleMudarOrdenacao('nome')} 
                className="px-6 py-4 cursor-pointer hover:bg-gray-100 hover:text-blue-600 transition"
              >
                <div className="flex items-center gap-1.5 font-bold tracking-wide">
                  Nome do Perfil <ArrowUpDown size={14} className="text-gray-500 shrink-0" />
                </div>
              </th>
              
              {/* Coluna Descrição Ordenável */}
              <th 
                onClick={() => handleMudarOrdenacao('descricao')} 
                className="px-6 py-4 cursor-pointer hover:bg-gray-100 hover:text-blue-600 transition"
              >
                <div className="flex items-center gap-1.5 font-bold tracking-wide">
                  Descrição <ArrowUpDown size={14} className="text-gray-400 shrink-0" />
                </div>
              </th>
              
              <th className="px-6 py-4 font-bold tracking-wide">Status</th>
              <th className="px-6 py-4 text-right w-28 font-bold tracking-wide">Ações</th>
            </tr>
          </thead>


          <tbody className="divide-y divide-gray-100 border-t">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-gray-400">Carregando registros...</td>
              </tr>
            ) : perfisProcessados.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-gray-400">Nenhum perfil localizado com os critérios informados.</td>
              </tr>
            ) : (
              perfisProcessados.map((perfil) => (
                <tr key={perfil.id || perfil.Id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{perfil.nome || perfil.Nome}</td>
                  <td className="px-6 py-4 text-gray-600">{perfil.descricao || perfil.Descricao || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 rounded px-2.5 py-0.5 text-xs font-bold border ${
                      (perfil.ativo || perfil.Ativo) === 'S' 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {(perfil.ativo || perfil.Ativo) === 'S' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button type="button" onClick={() => abrirModal(perfil)} className="text-gray-500 hover:text-blue-600 transition cursor-pointer" title="Editar">
                        <Edit2 size={16} />
                      </button>
                      <button type="button" onClick={() => handleDeletar(perfil.id || perfil.Id)} className="text-gray-500 hover:text-red-600 transition cursor-pointer" title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Rodapé e Controle de Páginas */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-3.5 text-xs text-gray-500 select-none">
          <span>Total de <strong>{paginacao.TotalItems}</strong> registros</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={paginacao.PageNumber <= 1 || loading}
              onClick={() => carregarPerfis(paginacao.PageNumber - 1)}
              className="p-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-medium text-gray-700">Página {paginacao.PageNumber} de {paginacao.TotalPages}</span>
            <button
              type="button"
              disabled={paginacao.PageNumber >= paginacao.TotalPages || loading}
              onClick={() => carregarPerfis(paginacao.PageNumber + 1)}
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
            
            {/* Topo Modal */}
            <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 p-4">
              <h2 className="text-base font-bold text-gray-900">
                {idSelecionado ? 'Editar Perfil Organizacional' : 'Novo Perfil Organizacional'}
              </h2>
              <button 
                type="button" 
                onClick={() => setModalAberto(false)} 
                className="text-gray-400 hover:text-gray-600 p-1 transition rounded hover:bg-gray-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSalvar} className="p-4 space-y-4">
              
              {/* Campo Nome */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700 uppercase">Nome do Perfil</label>
                <input
                  required
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className={`w-full rounded border p-2 text-sm bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 ${
                    fieldErrors.Nome ? 'border-red-400 bg-red-50/20' : 'border-gray-300'
                  }`}
                />
                {fieldErrors.Nome && <span className="text-xs text-red-500 font-medium mt-0.5">• {fieldErrors.Nome}</span>}
              </div>

              {/* Campo Descrição */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700 uppercase">Descrição/Finalidade</label>
                <textarea
                  rows="3"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full rounded border border-gray-300 p-2 text-sm bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Campo Status */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700 uppercase">Status Operacional</label>
                <select
                  value={ativo}
                  onChange={(e) => setAtivo(e.target.value)}
                  className="w-full rounded border border-gray-300 p-2 text-sm bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  <option value="S">Ativo</option>
                  <option value="N">Inativo</option>
                </select>
              </div>

              {/* Rodapé Ações Modal */}
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
                  Salvar Cadastro
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
