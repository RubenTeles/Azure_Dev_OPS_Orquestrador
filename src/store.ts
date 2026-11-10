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
import { runPowerShellScript } from './api';

const SETTINGS_STORAGE_KEY = 'devops_studio_settings';
const SAVED_TOPOLOGY_STORAGE_KEY = 'devops_studio_saved_topologies';
const OFFLINE_MOCK_STORAGE_KEY = 'devops_studio_offline_mock';

function normalizeOfflineData(parsed: any) {
  const unwrap = (source: any) => Array.isArray(source)
    ? source.flatMap((item: any) => Array.isArray(item?.value) ? item.value : [item])
    : [];
  const normalizeVariables = (variables: any) => Array.isArray(variables)
    ? variables
    : Object.entries(variables || {}).map(([name, variable]: [string, any]) => ({
        name,
        value: variable?.value == null ? '' : String(variable.value),
        isSecret: Boolean(variable?.isSecret),
        allowOverride: variable?.allowOverride
      }));
  const rawProjects = unwrap(parsed.projects);
  const rawRepositories = unwrap(parsed.repositories);
  const rawPipelines = unwrap(parsed.pipelines);
  const projects: AzureProject[] = rawProjects.map((project: any) => ({
    id: String(project.id),
    name: project.name || `Projeto ${project.id}`,
    description: project.description || '',
    visibility: project.visibility === 'public' ? 'public' : 'private',
    state: project.state || 'wellFormed',
    url: project.url || '',
    lastUpdateTime: project.lastUpdateTime || '',
    repositoriesCount: rawRepositories.filter((repo: any) => String(repo.project?.id) === String(project.id)).length,
    pipelinesCount: rawPipelines.filter((pipeline: any) => String(pipeline.projectId || pipeline.project?.id) === String(project.id)).length
  }));
  const rawVariableGroups = unwrap(parsed.variableGroups);
  const rawEnvironments = unwrap(parsed.environments);
  const usedPipelineIds = new Set<string>();
  const pipelines: AzurePipeline[] = rawPipelines.map((pipeline: any, index: number) => {
    const sourceId = String(pipeline.id);
    let id = sourceId;
    while (usedPipelineIds.has(id)) id = `${sourceId}-${index}`;
    usedPipelineIds.add(id);
    const isDuplicateSourceId = id !== sourceId;
    return {
    id, projectId: String(pipeline.projectId || pipeline.project?.id), name: pipeline.name || `Pipeline ${pipeline.id}`,
    folder: pipeline.folder || '\\', status: pipeline.status || 'notStarted', result: pipeline.result || 'none',
    repository: pipeline.repository?.name || pipeline.repository || '', branch: pipeline.branch || '', lastRunDate: pipeline.lastRunDate || '',
    duration: pipeline.duration || '', author: pipeline.author || '',
    variableGroupIds: (pipeline.variableGroups || []).map((group: any) => {
      const matched = rawVariableGroups.find((candidate: any) => String(candidate.id) === String(group.id) || candidate.name === group.name);
      return String(matched?.id || group.id);
    }),
    environmentIds: isDuplicateSourceId ? [] : rawEnvironments.filter((environment: any) => (environment.pipelines || []).some((item: any) => String(item.id) === sourceId)).map((environment: any) => String(environment.id)),
    variables: normalizeVariables(pipeline.variables), agent: pipeline.agent || { pool: '', agentName: '', os: '', status: 'offline', notes: '' }, azureUrl: pipeline.url
    };
  });
  const variableGroups: Record<string, VariableGroup[]> = {};
  projects.forEach((project) => {
    const ids = new Set(pipelines.filter((pipeline) => pipeline.projectId === project.id).flatMap((pipeline) => pipeline.variableGroupIds));
    variableGroups[project.id] = rawVariableGroups.filter((group: any) => String(group.projectId || group.project?.id || '') === project.id || projects.length === 1 || ids.has(String(group.id))).map((group: any) => ({
      id: String(group.id), projectId: String(group.projectId || group.project?.id || project.id), name: group.name || `Variable Group ${group.id}`, description: group.description || '',
      variablesCount: Array.isArray(group.variables) ? group.variables.length : Object.keys(group.variables || {}).length,
      isSecret: group.isSecret || false,
      variables: normalizeVariables(group.variables),
      azureUrl: group.url
    }));
  });
  const environments: Record<string, Environment[]> = {};
  rawEnvironments.forEach((environment: any) => {
    const projectId = String(environment.project?.id || projects[0]?.id || '');
    (environments[projectId] ||= []).push({ id: String(environment.id), name: environment.name || `Environment ${environment.id}`, description: environment.description || '', approvalsRequired: environment.approvalsRequired || false, titleColor: environment.titleColor, azureUrl: environment.url });
  });
  return { projects, pipelines, variableGroups, environments, topologyGroups: parsed.topologyGroups || {}, repositories: rawRepositories };
}

const initialOfflineData = (() => {
  try {
    const saved = localStorage.getItem(OFFLINE_MOCK_STORAGE_KEY);
    if (saved) return normalizeOfflineData(JSON.parse(saved));
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
    authMode: 'Pat',
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
  mapProjectResources: (projectIds: string[]) => Promise<void>;

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
  selectedProjectId: initialOfflineData?.projects[0]?.id || '',
  projects: initialOfflineData?.projects || [],
  pipelines: initialOfflineData?.pipelines || [],
  variableGroups: initialOfflineData?.variableGroups || {},
  environments: initialOfflineData?.environments || {},
  topologyGroups: initialOfflineData?.topologyGroups || {},
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

  mapProjectResources: async (projectIds) => {
    const { settings, addLog } = get();
    set({ isExecutingGet: true });
    try {
      const results = await Promise.all(projectIds.map(async (projectId) => {
        const output = await runPowerShellScript('scripts/Get-AzureDevOpsProjectResources.ps1', {
          Organization: settings.organization, ProjectId: projectId, AuthMode: settings.authMode, Pat: settings.pat
        });
        return JSON.parse(output || '{}');
      }));
      const pipelines = results.flatMap((item) => (item.pipelines || []).map((pipeline: any) => ({ ...pipeline, projectId: item.projectId }))).map((pipeline: any) => ({
        ...pipeline, projectId: pipeline.projectId || '', folder: pipeline.folder || '\\', status: 'notStarted', result: 'none',
        repository: '', branch: '', lastRunDate: '', duration: '', author: '', variableGroupIds: [], environmentIds: [], variables: [],
        agent: { pool: '', agentName: '', os: '', status: 'offline', notes: '' }
      }));
      const variableGroups = Object.fromEntries(results.map((item) => [item.projectId, item.variableGroups || []]));
      const environments = Object.fromEntries(results.map((item) => [item.projectId, item.environments || []]));
      set({ pipelines, variableGroups, environments, dashboard: { ...get().dashboard, pipelines: pipelines.length, variableGroups: Object.values(variableGroups).flat().length, environments: Object.values(environments).flat().length }, isExecutingGet: false });
      addLog(`[OK] Recursos mapeados para ${projectIds.length} projeto(s).`);
    } catch (error) {
      set({ isExecutingGet: false });
      addLog(`[ERRO] Falha no mapeamento: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
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

      const { projects, pipelines, variableGroups, environments, topologyGroups, repositories } = normalizeOfflineData(parsed);
      const savedTopologies = { ...get().savedTopologies };
      projects.forEach((project) => delete savedTopologies[project.id]);
      localStorage.setItem(SAVED_TOPOLOGY_STORAGE_KEY, JSON.stringify(savedTopologies));

      set({
        projects,
        selectedProjectId: projects[0]?.id || '',
        pipelines,
        variableGroups,
        environments,
        topologyGroups,
        savedTopologies,
        dashboard: {
          ...get().dashboard,
          projects: projects.length,
          pipelines: pipelines.length,
          variableGroups: Object.values(variableGroups).flat().length,
          environments: Object.values(environments).flat().length,
          repositories: repositories.length
        }
      });

      // Persiste no localStorage para sobreviver a recarregamentos mesmo offline
      try {
        localStorage.setItem(OFFLINE_MOCK_STORAGE_KEY, JSON.stringify(parsed));
      } catch (err) {
        console.error('Falha ao persistir mock offline:', err);
      }

      get().addLog(`[OFFLINE MOCK] Carregados ${projects.length} projetos e ${pipelines.length} pipelines para modo offline.`);
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
    addLog(`[GET][INÍCIO] Script: scripts/Get-AzureDevOpsProjects.ps1`);
    addLog(`[GET][CONFIG] Organização: ${settings.organization}`);
    addLog(`[GET][CONFIG] Autenticação: PAT`);
    try {
      addLog('[GET][EXECUÇÃO] A iniciar PowerShell...');
      const output = await runPowerShellScript('scripts/Get-AzureDevOpsProjects.ps1', {
        Organization: settings.organization, AuthMode: settings.authMode, Pat: settings.pat
      });
      addLog(`[GET][RESPOSTA] ${output.length} caracteres recebidos.`);
      const projects: AzureProject[] = JSON.parse(output || '[]');
      set({ projects, selectedProjectId: projects[0]?.id || '', dashboard: { ...get().dashboard, projects: projects.length }, isExecutingGet: false });
      addLog(`[GET][SUCESSO] ${projects.length} projetos obtidos pelo script PowerShell.`);
    } catch (error) {
      set({ isExecutingGet: false });
      addLog(`[GET][ERRO] ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  },

  executeWorkflow: async () => {
    // Designer workflow
  }
}));
