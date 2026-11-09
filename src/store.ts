import { create } from 'zustand';
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type Node
} from '@xyflow/react';
import type {
  AppNode,
  ActionDefinition,
  DashboardData,
  SettingsData,
  AzureProject,
  AzurePipeline,
  VariableGroup,
  Environment,
  TopologyGroup,
  SavedProjectTopology
} from './types';
import {
  DEFAULT_GET_POWERSHELL_SCRIPT,
  DEFAULT_POST_POWERSHELL_SCRIPT,
  DEFAULT_TEMPLATE_JSON,
  MOCK_PROJECTS,
  MOCK_PIPELINES,
  MOCK_DASHBOARD_METRICS,
  MOCK_VARIABLE_GROUPS,
  MOCK_ENVIRONMENTS,
  MOCK_TOPOLOGY_GROUPS
} from './mockData';

const SETTINGS_STORAGE_KEY = 'devops_studio_settings';
const SAVED_TOPOLOGY_STORAGE_KEY = 'devops_studio_saved_topologies';
const OFFLINE_MOCK_STORAGE_KEY = 'devops_studio_offline_mock';

const initialOfflineData = (() => {
  try {
    const saved = localStorage.getItem(OFFLINE_MOCK_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // fallback
  }
  return null;
})();

const initialSettings: SettingsData = (() => {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // fallback
  }
  return {
    organization: 'contoso-cloud',
    project: 'Enterprise-Core-Banking',
    pat: '',
    defaultBranch: 'main',
    isConnected: false,
    customGetScript: DEFAULT_GET_POWERSHELL_SCRIPT
  };
})();

const initialSavedTopologies: Record<string, SavedProjectTopology> = (() => {
  try {
    const saved = localStorage.getItem(SAVED_TOPOLOGY_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // fallback
  }
  return {};
})();

export const INITIAL_BATCH_WORKFLOW_NODES: AppNode[] = [
  {
    id: 'node-template',
    type: 'custom',
    position: { x: 80, y: 160 },
    data: {
      label: 'Template: Pipelines Batch (JSON)',
      kind: 'template',
      description: 'Carrega lista JSON com a estrutura dos pipelines para enviar ao Azure DevOps',
      templateJson: DEFAULT_TEMPLATE_JSON,
      status: 'idle'
    }
  },
  {
    id: 'node-powershell-post',
    type: 'custom',
    position: { x: 500, y: 160 },
    data: {
      label: 'PowerShell: Azure DevOps Batch POST',
      kind: 'powershell',
      description: 'Executa POST REST no Azure DevOps com a lista recebida na chave $body',
      bodyKey: '$body',
      script: DEFAULT_POST_POWERSHELL_SCRIPT,
      status: 'idle'
    }
  },
  {
    id: 'node-validation',
    type: 'custom',
    position: { x: 920, y: 160 },
    data: {
      label: 'Azure DevOps: Validation & Logs',
      kind: 'azure',
      description: 'Verifica status das respostas e confirma registro das pipelines',
      status: 'idle'
    }
  }
];

export const INITIAL_BATCH_WORKFLOW_EDGES: Edge[] = [
  {
    id: 'edge-template-to-ps',
    source: 'node-template',
    target: 'node-powershell-post',
    animated: true,
    style: { stroke: '#6c63ff', strokeWidth: 2 }
  },
  {
    id: 'edge-ps-to-azure',
    source: 'node-powershell-post',
    target: 'node-validation',
    animated: true,
    style: { stroke: '#00bcd4', strokeWidth: 2 }
  }
];

interface StudioState {
  settings: SettingsData;
  showPatModal: boolean;
  selectedProjectId: string;
  projects: AzureProject[];
  pipelines: AzurePipeline[];
  variableGroups: Record<string, VariableGroup[]>;
  environments: Record<string, Environment[]>;
  topologyGroups: Record<string, TopologyGroup[]>;
  savedTopologies: Record<string, SavedProjectTopology>;
  dashboard: DashboardData;
  nodes: AppNode[];
  edges: Edge[];
  selectedNodeId: string | null;
  actions: ActionDefinition[];
  logs: string[];
  isExecutingWorkflow: boolean;
  isExecutingGet: boolean;

  setSettings: (settings: Partial<SettingsData>) => void;
  setShowPatModal: (show: boolean) => void;
  setSelectedProjectId: (id: string) => void;
  setNodes: (nodes: AppNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  setSelectedNodeId: (id: string | null) => void;
  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: (c: Connection) => void;
  updateNodeData: (id: string, data: Partial<AppNode['data']>) => void;
  addLog: (message: string) => void;
  clearLogs: () => void;
  loadActions: () => Promise<void>;
  loadSimpleBatchWorkflow: () => void;
  executeWorkflow: () => Promise<void>;
  runGetScript: (customScript?: string) => Promise<void>;

  // Ações para Topologia, Grupos e Conexões
  addTopologyGroup: (projectId: string, group: { name: string; description?: string; color: string; repository?: string }) => TopologyGroup;
  updateTopologyGroup: (groupId: string, data: Partial<TopologyGroup>) => void;
  deleteTopologyGroup: (groupId: string) => void;
  
  connectVariableGroupToPipeline: (vgId: string, pipelineId: string) => void;
  disconnectVariableGroupFromPipeline: (vgId: string, pipelineId: string) => void;
  connectPipelineToEnvironment: (pipelineId: string, envId: string) => void;
  disconnectPipelineFromEnvironment: (pipelineId: string, envId: string) => void;

  updatePipelineAgentNotes: (pipelineId: string, notes: string) => void;
  updateEnvironmentTitleColor: (projectId: string, envId: string, color: string) => void;

  saveProjectTopology: (projectId: string, nodes: Node[], edges: Edge[]) => void;
  resetProjectTopologyToDefault: (projectId: string) => void;

  exportOfflineMockFile: () => void;
  importOfflineMockFile: (jsonContent: string) => boolean;
  resetOfflineMockToDefault: () => void;
}

export const useStudioStore = create<StudioState>((set, get) => ({
  settings: initialSettings,
  showPatModal: !initialSettings.pat,
  selectedProjectId: 'proj-001',
  projects: initialOfflineData?.projects || MOCK_PROJECTS,
  pipelines: initialOfflineData?.pipelines || MOCK_PIPELINES,
  variableGroups: initialOfflineData?.variableGroups || MOCK_VARIABLE_GROUPS,
  environments: initialOfflineData?.environments || MOCK_ENVIRONMENTS,
  topologyGroups: initialOfflineData?.topologyGroups || MOCK_TOPOLOGY_GROUPS,
  savedTopologies: initialSavedTopologies,
  dashboard: MOCK_DASHBOARD_METRICS,
  nodes: INITIAL_BATCH_WORKFLOW_NODES,
  edges: INITIAL_BATCH_WORKFLOW_EDGES,
  selectedNodeId: null,
  actions: [],
  logs: [
    `[${new Date().toLocaleTimeString()}] Sistema inicializado. Aguardando comandos ou execucao de workflows.`
  ],
  isExecutingWorkflow: false,
  isExecutingGet: false,

  setSettings: (newSettings) => {
    set((state) => {
      const merged = { ...state.settings, ...newSettings };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
      } catch (e) {
        console.error('Failed to save settings:', e);
      }
      return { settings: merged };
    });
  },

  setShowPatModal: (show) => set({ showPatModal: show }),

  setSelectedProjectId: (id) => {
    set({ selectedProjectId: id });
    const proj = get().projects.find((p) => p.id === id);
    if (proj) {
      get().addLog(`[TOPOLOGY] Projeto selecionado: "${proj.name}". Topologia carregada.`);
    }
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  onNodesChange: (changes) =>
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes)
    })),

  onEdgesChange: (changes) =>
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges)
    })),

  onConnect: (connection) =>
    set((state) => ({
      edges: addEdge({ ...connection, animated: true, style: { stroke: '#6c63ff', strokeWidth: 2 } }, state.edges)
    })),

  updateNodeData: (id, partialData) => {
    set((state) => ({
      nodes: state.nodes.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            data: {
              ...n.data,
              ...partialData
            }
          };
        }
        return n;
      })
    }));
  },

  addLog: (message) => {
    const timestamp = new Date().toLocaleTimeString();
    set((state) => ({
      logs: [...state.logs, `[${timestamp}] ${message}`]
    }));
  },

  clearLogs: () => set({ logs: [] }),

  // Topologia: Grupos
  addTopologyGroup: (projectId, groupData) => {
    const newGroup: TopologyGroup = {
      id: `group-${Date.now()}`,
      projectId,
      ...groupData
    };
    set((state) => {
      const currentList = state.topologyGroups[projectId] || [];
      const updated = {
        ...state.topologyGroups,
        [projectId]: [...currentList, newGroup]
      };
      return { topologyGroups: updated };
    });
    get().addLog(`[GRUPO CRIADO] Novo grupo "${newGroup.name}" adicionado ao projeto.`);
    return newGroup;
  },

  updateTopologyGroup: (groupId, data) => {
    set((state) => {
      const updated = { ...state.topologyGroups };
      Object.keys(updated).forEach((pId) => {
        updated[pId] = updated[pId].map((g) => (g.id === groupId ? { ...g, ...data } : g));
      });
      return { topologyGroups: updated };
    });
  },

  deleteTopologyGroup: (groupId) => {
    set((state) => {
      const updated = { ...state.topologyGroups };
      Object.keys(updated).forEach((pId) => {
        updated[pId] = updated[pId].filter((g) => g.id !== groupId);
      });
      return { topologyGroups: updated };
    });
    get().addLog(`[GRUPO REMOVIDO] Grupo removido da topologia.`);
  },

  // Conexões: Variable Group <-> Pipeline
  connectVariableGroupToPipeline: (vgId, pipelineId) => {
    set((state) => ({
      pipelines: state.pipelines.map((p) => {
        if (p.id === pipelineId && !p.variableGroupIds.includes(vgId)) {
          return {
            ...p,
            variableGroupIds: [...p.variableGroupIds, vgId]
          };
        }
        return p;
      })
    }));
    const pipe = get().pipelines.find((p) => p.id === pipelineId);
    get().addLog(`[CONEXÃO CRIADA] Variable Group vinculado à Pipeline "${pipe?.name}".`);
  },

  disconnectVariableGroupFromPipeline: (vgId, pipelineId) => {
    set((state) => ({
      pipelines: state.pipelines.map((p) => {
        if (p.id === pipelineId) {
          return {
            ...p,
            variableGroupIds: p.variableGroupIds.filter((id) => id !== vgId)
          };
        }
        return p;
      })
    }));
    const pipe = get().pipelines.find((p) => p.id === pipelineId);
    get().addLog(`[CONEXÃO REMOVIDA] Desvinculado Variable Group da Pipeline "${pipe?.name}".`);
  },

  // Conexões: Pipeline <-> Environment
  connectPipelineToEnvironment: (pipelineId, envId) => {
    set((state) => ({
      pipelines: state.pipelines.map((p) => {
        if (p.id === pipelineId && !p.environmentIds.includes(envId)) {
          return {
            ...p,
            environmentIds: [...p.environmentIds, envId]
          };
        }
        return p;
      })
    }));
    const pipe = get().pipelines.find((p) => p.id === pipelineId);
    get().addLog(`[CONEXÃO CRIADA] Environment vinculado à Pipeline "${pipe?.name}".`);
  },

  disconnectPipelineFromEnvironment: (pipelineId, envId) => {
    set((state) => ({
      pipelines: state.pipelines.map((p) => {
        if (p.id === pipelineId) {
          return {
            ...p,
            environmentIds: p.environmentIds.filter((id) => id !== envId)
          };
        }
        return p;
      })
    }));
    const pipe = get().pipelines.find((p) => p.id === pipelineId);
    get().addLog(`[CONEXÃO REMOVIDA] Desvinculado Environment da Pipeline "${pipe?.name}".`);
  },

  // Agentes & Notas
  updatePipelineAgentNotes: (pipelineId, notes) => {
    set((state) => ({
      pipelines: state.pipelines.map((p) => {
        if (p.id === pipelineId) {
          return {
            ...p,
            agent: {
              ...p.agent,
              notes
            }
          };
        }
        return p;
      })
    }));
    get().addLog(`[AGENTE] Notas do agente atualizadas com sucesso.`);
  },

  // Environments: Cor do Título
  updateEnvironmentTitleColor: (projectId, envId, color) => {
    set((state) => {
      const currentList = state.environments[projectId] || [];
      const updated = {
        ...state.environments,
        [projectId]: currentList.map((env) => (env.id === envId ? { ...env, titleColor: color } : env))
      };
      return { environments: updated };
    });
    get().addLog(`[ENVIRONMENT] Cor do título personalizada.`);
  },

  // Persistência da Topologia do Projeto
  saveProjectTopology: (projectId, nodes, edges) => {
    const groups = get().topologyGroups[projectId] || [];
    const savedTopology: SavedProjectTopology = {
      nodes,
      edges,
      groups,
      savedAt: new Date().toISOString()
    };
    set((state) => {
      const updated = {
        ...state.savedTopologies,
        [projectId]: savedTopology
      };
      try {
        localStorage.setItem(SAVED_TOPOLOGY_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Falha ao gravar topologia:', e);
      }
      return { savedTopologies: updated };
    });
    get().addLog(`[CONFIGURAÇÃO SALVA] Layout, nós, conexões e grupos salvos para o projeto atual.`);
  },

  resetProjectTopologyToDefault: (projectId) => {
    set((state) => {
      const updated = { ...state.savedTopologies };
      delete updated[projectId];
      try {
        localStorage.setItem(SAVED_TOPOLOGY_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Falha ao resetar:', e);
      }
      return { savedTopologies: updated };
    });
    get().addLog(`[RESET] Layout restaurado para a disposição padrão.`);
  },

  exportOfflineMockFile: () => {
    const state = get();
    const dataToExport = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      projects: state.projects,
      pipelines: state.pipelines,
      variableGroups: state.variableGroups,
      environments: state.environments,
      topologyGroups: state.topologyGroups
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'offline-mock.json';
    link.click();
    URL.revokeObjectURL(link.href);
    get().addLog('[OFFLINE MOCK] Ficheiro offline-mock.json exportado com sucesso (pode ser guardado em config/mocks/).');
  },

  importOfflineMockFile: (jsonContent: string) => {
    try {
      const parsed = JSON.parse(jsonContent);
      if (!parsed.projects || !Array.isArray(parsed.projects)) {
        throw new Error('Formato inválido: array de projetos não encontrado');
      }

      set({
        projects: parsed.projects,
        pipelines: parsed.pipelines || [],
        variableGroups: parsed.variableGroups || {},
        environments: parsed.environments || {},
        topologyGroups: parsed.topologyGroups || {},
        dashboard: {
          ...get().dashboard,
          projects: parsed.projects.length,
          pipelines: (parsed.pipelines || []).length
        }
      });

      // Persiste no localStorage para sobreviver a recarregamentos mesmo offline
      try {
        localStorage.setItem(OFFLINE_MOCK_STORAGE_KEY, JSON.stringify(parsed));
      } catch (err) {
        console.error('Falha ao persistir mock offline:', err);
      }

      get().addLog(`[OFFLINE MOCK] Carregados ${parsed.projects.length} projetos e ${(parsed.pipelines || []).length} pipelines para modo offline.`);
      return true;
    } catch (e: any) {
      get().addLog(`[ERRO OFFLINE MOCK] Falha ao importar ficheiro de mock: ${e.message}`);
      return false;
    }
  },

  resetOfflineMockToDefault: () => {
    try {
      localStorage.removeItem(OFFLINE_MOCK_STORAGE_KEY);
    } catch {}
    set({
      projects: MOCK_PROJECTS,
      pipelines: MOCK_PIPELINES,
      variableGroups: MOCK_VARIABLE_GROUPS,
      environments: MOCK_ENVIRONMENTS,
      topologyGroups: MOCK_TOPOLOGY_GROUPS
    });
    get().addLog('[OFFLINE MOCK] Dados restaurados para os mocks iniciais de fábrica.');
  },

  loadActions: async () => {
    try {
      const response = await fetch('/actions/index.json');
      const loaded = await response.json();
      set({ actions: loaded });
    } catch {
      set({
        actions: []
      });
    }
  },

  loadSimpleBatchWorkflow: () => {
    set({
      nodes: INITIAL_BATCH_WORKFLOW_NODES,
      edges: INITIAL_BATCH_WORKFLOW_EDGES
    });
  },

  runGetScript: async (customScript) => {
    const { settings, addLog } = get();
    set({ isExecutingGet: true });
    addLog(`>>> Executando Script PowerShell de Discovery (GET)...`);
    addLog(`Conectando em https://dev.azure.com/${settings.organization}...`);

    await new Promise((r) => setTimeout(r, 600));
    addLog(`GET https://dev.azure.com/${settings.organization}/_apis/projects?api-version=7.1-preview.4`);
    await new Promise((r) => setTimeout(r, 700));
    addLog(`GET https://dev.azure.com/${settings.organization}/${settings.project}/_apis/pipelines?api-version=7.1-preview.1`);
    await new Promise((r) => setTimeout(r, 500));

    set({
      projects: MOCK_PROJECTS,
      pipelines: MOCK_PIPELINES,
      dashboard: {
        ...MOCK_DASHBOARD_METRICS,
        projects: MOCK_PROJECTS.length,
        pipelines: MOCK_PIPELINES.length
      },
      isExecutingGet: false
    });

    addLog(`[OK] Discovery finalizado com sucesso!`);
  },

  executeWorkflow: async () => {
    // Designer workflow
  }
}));
