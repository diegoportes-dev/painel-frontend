import { useState, useEffect } from 'react';
import { ShieldAlert, Save, CheckSquare, Square, Loader2 } from 'lucide-react';
import { apiClient } from '../services/apiClient';

export default function NiveisAcessoCrud() {
  console.log('[NiveisAcessoCrud] Componente de Matriz inicializado.');

  // Estados de carga dos combos e dados fixos
  const [perfisDisponiveis, setPerfisDisponiveis] = useState([]);
  const [rotasDisponiveis, setRotasDisponiveis] = useState([]);
  
  // Estado principal: Perfil selecionado no topo
  const [perfilSelecionadoId, setPerfilSelecionadoId] = useState('');
  
  // Array contendo apenas os IDs das rotas que estão CHECADAS para o perfil selecionado
  const [rotasChecadasIds, setRotasChecadasIds] = useState([]);

  // Estados de controle visual de feedback
  const [loadingCombo, setLoadingCombo] = useState(false);
  const [loadingSalvar, setLoadingSalvar] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [globalSuccess, setGlobalSuccess] = useState('');

  // 1. Carrega a infraestrutura de Perfis e Rotas ao iniciar a tela
  const carregarInfraestruturaAuxiliar = async () => {
    setLoadingCombo(true);
    try {
      const [resPerfis, resRotas] = await Promise.all([
        apiClient.get('/perfis?page=1&pageSize=100'),
        apiClient.get('/niveis-acesso/rotas')
      ]);

      const listaPerfis = resPerfis?.Data || resPerfis?.data?.data || resPerfis?.data || [];
      const listaRotas = resRotas?.Data || resRotas?.data?.data || resRotas?.data || [];

      setPerfisDisponiveis(Array.isArray(listaPerfis) ? listaPerfis : []);
      setRotasDisponiveis(Array.isArray(listaRotas) ? listaRotas : []);
    } catch (err) {
      console.error('[NiveisAcessoCrud] Erro ao carregar metadados:', err);
      setGlobalError('Falha ao conectar com o barramento de infraestrutura da API.');
    } finally {
      setLoadingCombo(false);
    }
  };

  useEffect(() => {
    carregarInfraestruturaAuxiliar();
  }, []);

  // 2. Sempre que mudar o Perfil selecionado, busca no banco quais rotas ele já possui ativas
  useEffect(() => {
    const carregarPermissoesDoPerfil = async () => {
      if (!perfilSelecionadoId) {
        setRotasChecadasIds([]);
        return;
      }

      setLoadingCombo(true);
      setGlobalError('');
      setGlobalSuccess('');
      
      try {
        // Busca na sua rota GetAll filtrando pelo tamanho max de registros ou trate paginação se necessário
        const res = await apiClient.get(`/niveis-acesso?page=1&pageSize=1000`);
        const listaGeralNiveis = res?.Data || res?.data || [];
        
        // Filtra apenas o que pertence ao perfil selecionado e extrai os IDs das rotas vinculadas
        const rotasAtivasIds = listaGeralNiveis
          .filter(nivel => (nivel.perfilId || nivel.PerfilId) === perfilSelecionadoId)
          .map(nivel => nivel.rotaId || nivel.RotaId);

        setRotasChecadasIds(rotasAtivasIds);
      } catch (err) {
        setGlobalError('Erro ao mapear permissões atuais do perfil selecionado.');
      } finally {
        setLoadingCombo(false);
      }
    };

    carregarPermissoesDoPerfil();
  }, [perfilSelecionadoId]);

  // 3. Gerencia o clique de marcar/desmarcar o checkbox individual
  const handleToggleCheckbox = (rotaId) => {
    setRotasChecadasIds(prev => 
      prev.includes(rotaId) 
        ? prev.filter(id => id !== rotaId) // Desmarca (remove do array)
        : [...prev, rotaId]                // Marca (adiciona no array)
    );
  };

  // 4. Marca ou desmarca todas as rotas de um grupo específico de uma só vez
  const handleToggleGrupoCompleto = (grupoMenu, e) => {
    e.preventDefault();
    const rotasDoGrupo = rotasDisponiveis.filter(r => (r.menu || r.Menu) === grupoMenu);
    const idsDoGrupo = rotasDoGrupo.map(r => r.id || r.Id);
    
    // Se TODAS as rotas do grupo já estão checadas, desmarca todas. Caso contrário, marca todas.
    const todosChecados = idsDoGrupo.every(id => rotasChecadasIds.includes(id));
    
    if (todosChecados) {
      setRotasChecadasIds(prev => prev.filter(id => !idsDoGrupo.includes(id)));
    } else {
      setRotasChecadasIds(prev => [...new Set([...prev, ...idsDoGrupo])]);
    }
  };

  // 5. Envia a matriz completa processada de uma única vez para o Backend
  const handleSalvarMatriz = async (e) => {
    e.preventDefault();
    if (!perfilSelecionadoId) return;

    setLoadingSalvar(true);
    setGlobalError('');
    setGlobalSuccess('');

    try {
      await apiClient.post('/niveis-acesso/matriz', {
        perfilId: perfilSelecionadoId,
        rotaIds: rotasChecadasIds
      });
      setGlobalSuccess('Matriz de controle de níveis de acesso persistida com sucesso no MySQL!');
    } catch (err) {
      setGlobalError(err.message || 'Falha ao processar salvamento do lote de permissões.');
    } finally {
      setLoadingSalvar(false);
    }
  };

  // Agrupa as rotas disponíveis pela propriedade "Menu" para desenhar as seções na tela
  const gruposDeMenu = [...new Set(rotasDisponiveis.map(r => r.menu || r.Menu || 'Outros'))];

  return (
    <div className="space-y-6 w-full px-2">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-gray-950 flex items-center gap-2">
          <ShieldAlert size={24} className="text-blue-600" /> Matriz de Níveis de Acesso
        </h1>
        <p className="text-sm text-gray-600">Selecione um perfil e defina todas as permissões de endpoints em lote.</p>
      </div>

      {/* Alertas */}
      {globalError && (
        <div className="bg-red-50 text-red-600 p-3 rounded text-sm font-medium border border-red-200 w-full">
          {globalError}
        </div>
      )}
      {globalSuccess && (
        <div className="bg-green-50 text-green-700 p-3 rounded text-sm font-medium border border-green-200 w-full">
          {globalSuccess}
        </div>
      )}

      {/* Barra de Filtro Superior */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-xs flex items-center gap-4 w-full">
        <div className="flex flex-col gap-1 flex-1 max-w-sm">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Selecione o Perfil Alvo</label>
          <select
            disabled={loadingCombo}
            value={perfilSelecionadoId}
            onChange={(e) => setPerfilSelecionadoId(e.target.value)}
            className="w-full rounded border border-gray-300 p-2.5 text-sm bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition disabled:opacity-50"
          >
            <option value="">Escolha um perfil para gerenciar...</option>
            {perfisDisponiveis.map(p => (
              <option key={p.id || p.Id} value={p.id || p.Id}>{p.nome || p.Nome}</option>
            ))}
          </select>
        </div>

        {perfilSelecionadoId && (
          <button
            type="button"
            disabled={loadingSalvar || loadingCombo}
            onClick={handleSalvarMatriz}
            className="mt-5 flex items-center gap-2 rounded bg-blue-600 px-6 py-2.5 font-semibold text-sm text-white hover:bg-blue-700 transition cursor-pointer shadow-sm disabled:opacity-50"
          >
            {loadingSalvar ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar Alterações da Matriz
          </button>
        )}
      </div>

      {/* Grid de Checkboxes estruturado por Grupos de Menu */}
      {perfilSelecionadoId && rotasDisponiveis.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {gruposDeMenu.map(grupo => {
            const rotasDoGrupo = rotasDisponiveis.filter(r => (r.menu || r.Menu || 'Outros') === grupo);
            const idsDoGrupo = rotasDoGrupo.map(r => r.id || r.Id);
            const todosDesteGrupoChecados = idsDoGrupo.every(id => rotasChecadasIds.includes(id));

            return (
              <div key={grupo} className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
                {/* Título do Grupo de Menu / Botão Marcar Todos */}
                <div className="bg-gray-50 border-b border-gray-200 p-3.5 flex items-center justify-between select-none">
                  <span className="font-bold text-gray-800 text-sm tracking-wide uppercase">{grupo}</span>
                  <button
                    type="button"
                    onClick={(e) => handleToggleGrupoCompleto(grupo, e)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    {todosDesteGrupoChecados ? 'Desmarcar Todos' : 'Marcar Todos'}
                  </button>
                </div>

                {/* Lista de Checkboxes do Grupo */}
                <div className="p-4 divide-y divide-gray-100 flex-1 max-h-96 overflow-y-auto space-y-1.5">
                  {rotasDoGrupo.map(rota => {
                    const rId = rota.id || rota.Id;
                    const rMethod = rota.metodo || rota.Metodo || 'GET';
                    const isChecked = rotasChecadasIds.includes(rId);

                    return (
                      <div
                        key={rId}
                        onClick={() => handleToggleCheckbox(rId)}
                        className="flex items-start gap-3 py-2 px-1 hover:bg-gray-50/80 rounded transition cursor-pointer select-none"
                      >
                        {/* Checkbox Visual com Lucide */}
                        <div className="mt-0.5 shrink-0 text-blue-600">
                          {isChecked ? <CheckSquare size={18} /> : <Square size={18} className="text-gray-400" />}
                        </div>

                        {/* Informações da Rota */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                              rMethod === 'GET' ? 'bg-green-50 text-green-700 border border-green-200' :
                              rMethod === 'POST' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                              rMethod === 'PUT' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 
                              'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {rMethod}
                            </span>                            
                            <span className="text-xs font-sans font-semibold text-gray-700 truncate">
                              {rota.endPoint || rota.EndPoint}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {rota.descricao || rota.Descricao}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {rota.EndPoint || rota.endpoint}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mensagem caso o operador não tenha escolhido um perfil ainda */}
      {!perfilSelecionadoId && (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-lg text-gray-400 text-sm shadow-xs">
          Selecione um Perfil Organizacional na barra superior para carregar a matriz de permissões.
        </div>
      )}
    </div>
  );
}
