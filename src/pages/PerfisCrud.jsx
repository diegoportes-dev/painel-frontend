import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { apiClient } from '../services/apiClient';

export default function PerfisCrud() {
  // Estados de dados e paginação baseados no backend C#
  const [perfis, setPerfis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paginacao, setPaginacao] = useState({
    PageNumber: 1,
    PageSize: 10,
    TotalItems: 0,
    TotalPages: 0
  });

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
    const tamanhoPagina = parseInt(paginacao.PageSize, 10) || 5;

    try {
      const res = await apiClient.get(`/perfis?page=${paginaAlvo}&pageSize=${tamanhoPagina}`);
      setPerfis(res.data);
      
      // Ajustado para ler as chaves em PascalCase (Maiúsculas) vindas do seu backend C#
      if (res.pagination) {
        setPaginacao({
          PageNumber: parseInt(res.pagination.PageNumber || res.pagination.pageNumber, 10) || paginaAlvo,
          PageSize: parseInt(res.pagination.PageSize || res.pagination.pageSize, 10) || tamanhoPagina,
          TotalItems: parseInt(res.pagination.TotalItems || res.pagination.totalItems, 10) || 0,
          TotalPages: parseInt(res.pagination.TotalPages || res.pagination.totalPages, 10) || 0
        });
      }
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarPerfis(1);
  }, []);

  // 2. Controlar abertura do Modal de Cadastro/Edição
  const abrirModal = (perfil = null) => {
    setFieldErrors({});
    setGlobalError('');
    if (perfil) {
      setIdSelecionado(perfil.id);
      setNome(perfil.nome);
      setDescricao(perfil.descricao || '');
      setAtivo(perfil.ativo || 'S');
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
      // if (err.validationErrors) {
      //   setFieldErrors(err.validationErrors);
      if (err.validationErrors) {
        const errosFormatados = {};
        
        Object.keys(err.validationErrors).forEach(key => {
          // 1. Quebra a chave por pontos. Ex: "Input.Nome" vira ["Input", "Nome"]
          const partes = key.split('.');
          
          // 2. Pega estritamente a ÚLTIMA palavra do array ("Nome")
          const nomePropriedade = partes[partes.length - 1]; 
          
          // 3. Garante que a primeira letra seja sempre Maiúscula para bater com o JSX do modal
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

  // 4. Remover Registro
  const handleDeletar = async (id) => {
    if (!confirm('Deseja realmente remover este perfil?')) return;
    setGlobalError('');
    try {
      await apiClient.delete(`/perfis/${id}`);
      carregarPerfis(paginacao.PageNumber);
    } catch (err) {
      setGlobalError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho do painel CRUD */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-950">Perfis de Usuários</h1>
          <p className="text-sm text-gray-600">Gerencie grupos, descrições e regras de permissões de acesso.</p>
        </div>
        <button
          onClick={() => abrirModal()}
          className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700 transition cursor-pointer"
        >
          <Plus size={18} /> Novo Perfil
        </button>
      </div>

      {globalError && (
        <div className="bg-red-50 text-red-600 p-3 rounded text-sm font-medium border border-red-200">
          {globalError}
        </div>
      )}

      {/* Grid de Dados (DataGrid com Coluna Descrição) */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm text-gray-500">
          <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-700 border-b">
            <tr>
              <th className="px-6 py-4">Nome do Perfil</th>
              <th className="px-6 py-4">Descrição</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 border-t">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-10 text-center text-gray-400">Carregando registros...</td>
              </tr>
            ) : perfis.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-10 text-center text-gray-400">Nenhum perfil cadastrado no sistema.</td>
              </tr>
            ) : (
              perfis.map((perfil) => (
                <tr key={perfil.id} className="hover:bg-gray-50/70 transition">
                  <td className="px-6 py-4 font-medium text-gray-900">{perfil.nome}</td>
                  <td className="px-6 py-4 text-gray-600">{perfil.descricao || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                      perfil.ativo === 'S' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {perfil.ativo === 'S' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => abrirModal(perfil)} className="text-gray-500 hover:text-blue-600 transition cursor-pointer" title="Editar">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeletar(perfil.id)} className="text-gray-500 hover:text-red-600 transition cursor-pointer" title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Rodapé e Controle de Páginas ajustado para PascalCase */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4">
          <span className="text-sm text-gray-700">
            Página <span className="font-semibold">{paginacao.PageNumber}</span> de <span className="font-semibold">{paginacao.TotalPages}</span> ({paginacao.TotalItems} itens no total)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => carregarPerfis(paginacao.PageNumber - 1)}
              disabled={paginacao.PageNumber <= 1 || loading}
              className="inline-flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => carregarPerfis(paginacao.PageNumber + 1)}
              disabled={paginacao.PageNumber >= paginacao.TotalPages || loading}
              className="inline-flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Suspenso para Cadastro / Edição */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl border relative space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">
                {idSelecionado ? 'Editar Perfil Existente' : 'Cadastrar Novo Perfil'}
              </h3>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600 transition cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="space-y-4">
              {/* Nome do Perfil */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Nome do Perfil</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Administrador, Gerente..."
                  className={`w-full rounded border p-2.5 text-sm focus:outline-none ${
                    fieldErrors.Nome ? 'border-red-500 bg-red-50/20' : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                {fieldErrors.Nome && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    {fieldErrors.Nome.map((erro, index) => (<p key={index} className="text-xs font-medium text-red-600">• {erro}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Descrição do Perfil */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Descrição</label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva as atribuições deste perfil no sistema..."
                  rows="3"
                  className={`w-full rounded border p-2.5 text-sm focus:outline-none block resize-none ${
                    fieldErrors.Descricao ? 'border-red-500 bg-red-50/20' : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                {fieldErrors.Descricao && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    {fieldErrors.Descricao.map((erro, index) => (
                      <p key={index} className="text-xs font-medium text-red-600">• {erro}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Ativo/Inativo */}
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

              {/* Botões de Ação do Form */}
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

