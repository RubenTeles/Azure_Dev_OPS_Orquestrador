import { create } from 'zustand';
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange
} from '@xyflow/react';
import type {
  AppNode,
  ActionDefinition,
  DashboardData,
  SettingsData,
  AzureProject,
  AzurePipeline,
  VariableGroup,
  Environment
} from './types';
import {
  DEFAULT_GET_POWERSHELL_SCRIPT,
  DEFAULT_POST_POWERSHELL_SCRIPT,
  DEFAULT_TEMPLATE_JSON,
  MOCK_PROJECTS,
  MOCK_PIPELINES,
  MOCK_DASHBOARD_METRICS,
  MOCK_VARIABLE_GROUPS,
  MOCK_ENVIRONMENTS
} from './mockData';

const SETTINGS_STORAGE_KEY = 'devops_studio_settings';

const initialSettings: SettingsData = (() => {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
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
}

export const useStudioStore = create<StudioState>((set, get) => ({
  settings: initialSettings,
  showPatModal: !initialSettings.pat,
  selectedProjectId: 'proj-001',
  projects: MOCK_PROJECTS,
  pipelines: MOCK_PIPELINES,
  variableGroups: MOCK_VARIABLE_GROUPS,
  environments: MOCK_ENVIRONMENTS,
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

  loadActions: async () => {
    try {
      const response = await fetch('/actions/index.json');
      const loaded = await response.json();
      set({ actions: loaded });
    } catch {
      set({
        actions: [
          {
            id: 'template-json-list',
            name: 'Template: JSON Pipeline List',
            description: 'Lista de pipelines estruturada em JSON para body de requisição',
            category: 'templates',
            executor: 'nodejs',
            inputs: [],
            outputs: ['jsonList'],
            defaultPayload: DEFAULT_TEMPLATE_JSON
          },
          {
            id: 'powershell-azure-post',
            name: 'PowerShell: Azure POST Batch',
            description: 'Envia lista de itens via REST Method para o Azure DevOps',
            category: 'powershell',
            executor: 'powershell',
            inputs: ['bodyJson'],
            outputs: ['response'],
            defaultScript: DEFAULT_POST_POWERSHELL_SCRIPT
          },
          {
            id: 'azure-pipeline-create',
            name: 'Azure DevOps: Create Pipeline',
            description: 'Criação individual de pipeline YAML no projeto',
            category: 'azure',
            executor: 'rest',
            inputs: ['repository', 'pipelineName'],
            outputs: ['pipelineId']
          },
          {
            id: 'git-clone-branch',
            name: 'Git: Clone & Branch',
            description: 'Clona repositório e cria nova branch de trabalho',
            category: 'git',
            executor: 'executable',
            inputs: ['repoUrl', 'branchName'],
            outputs: ['workingDir']
          }
        ]
      });
    }
  },

  loadSimpleBatchWorkflow: () => {
    set({
      nodes: INITIAL_BATCH_WORKFLOW_NODES,
      edges: INITIAL_BATCH_WORKFLOW_EDGES
    });
    get().addLog('Workflow carregado: [Template JSON -> PowerShell POST Batch -> Azure DevOps]');
  },

  runGetScript: async (customScript) => {
    const { settings, addLog } = get();
    const scriptToRun = customScript || settings.customGetScript;

    set({ isExecutingGet: true });
    addLog(`>>> Executando Script PowerShell de Discovery (GET)...`);
    addLog(`Conectando em https://dev.azure.com/${settings.organization}...`);

    await new Promise((r) => setTimeout(r, 600));
    addLog(`GET https://dev.azure.com/${settings.organization}/_apis/projects?api-version=7.1-preview.4`);
    await new Promise((r) => setTimeout(r, 700));
    addLog(`GET https://dev.azure.com/${settings.organization}/${settings.project}/_apis/pipelines?api-version=7.1-preview.1`);
    await new Promise((r) => setTimeout(r, 500));

    // Atualiza com os mocks atualizados
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

    addLog(`[OK] Discovery finalizado com sucesso! ${MOCK_PROJECTS.length} projetos e ${MOCK_PIPELINES.length} pipelines sincronizados.`);
  },

  executeWorkflow: async () => {
    const { nodes, addLog, updateNodeData } = get();
    if (nodes.length === 0) {
      addLog('[AVISO] Nenhum nó no workflow para executar.');
      return;
    }

    set({ isExecutingWorkflow: true });
    addLog(`=== INICIANDO EXECUÇÃO DE WORKFLOW (${nodes.length} nós) ===`);

    // Reseta todos os nós para 'idle'
    nodes.forEach((n) => updateNodeData(n.id, { status: 'idle' }));

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      addLog(`[PASSO ${i + 1}/${nodes.length}] Executando: "${node.data.label}" (${node.data.kind})`);
      updateNodeData(node.id, { status: 'running' });

      if (node.data.kind === 'template') {
        await new Promise((r) => setTimeout(r, 700));
        let count = 0;
        try {
          const parsed = JSON.parse(node.data.templateJson || '[]');
          count = Array.isArray(parsed) ? parsed.length : 1;
        } catch {
          count = 1;
        }
        addLog(` -> Template JSON carregado com sucesso (${count} itens prontos para o body).`);
      } else if (node.data.kind === 'powershell') {
        await new Promise((r) => setTimeout(r, 1200));
        addLog(` -> Injetando lista na chave $BodyJson do script PowerShell...`);
        addLog(` -> Invoke-RestMethod -Method Post enviado para o endpoint Azure DevOps.`);
        addLog(` -> Resposta HTTP 201 Created recebida.`);
      } else {
        await new Promise((r) => setTimeout(r, 600));
        addLog(` -> Nó "${node.data.label}" concluído com sucesso.`);
      }

      updateNodeData(node.id, { status: 'success' });
    }

    addLog('=== WORKFLOW CONCLUÍDO COM SUCESSO! ===');
    set({ isExecutingWorkflow: false });
  }
}));
