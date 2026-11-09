import type { Node, Edge } from '@xyflow/react';

export type NodeKind = 'input' | 'template' | 'powershell' | 'azure' | 'git' | 'condition' | 'variableGroup' | 'environment' | 'group';

export type NodeExecutionStatus = 'idle' | 'running' | 'success' | 'error';

export interface ActionDefinition {
  id: string;
  name: string;
  description: string;
  category: 'templates' | 'powershell' | 'azure' | 'git' | 'logic';
  executor: 'powershell' | 'nodejs' | 'executable' | 'rest';
  inputs: string[];
  outputs: string[];
  defaultScript?: string;
  defaultPayload?: string;
}

export interface ScheduleConfig {
  hasSchedule: boolean;
  cron?: string;
  humanReadable?: string;
}

export interface VariableGroupVariable {
  name: string;
  value: string;
  isSecret?: boolean;
}

export interface VariableGroup {
  id: string;
  name: string;
  description: string;
  variablesCount: number;
  isSecret?: boolean;
  variables: VariableGroupVariable[];
  azureUrl?: string;
  groupId?: string;
}

export interface Environment {
  id: string;
  name: string;
  description: string;
  approvalsRequired?: boolean;
  titleColor?: string;
  azureUrl?: string;
  groupId?: string;
}

export interface PipelineVariable {
  name: string;
  value: string;
  isSecret?: boolean;
  allowOverride?: boolean;
}

export interface PipelineAgent {
  pool: string;
  agentName: string;
  os: string;
  status: 'online' | 'offline';
  notes: string;
  demands?: string[];
}

export interface TopologyGroup {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  color: string;
  repository?: string;
}

export interface WorkflowNodeData {
  label: string;
  kind: NodeKind;
  description?: string;
  actionId?: string;
  status?: NodeExecutionStatus;
  script?: string;
  templateJson?: string;
  bodyKey?: string;
  schedule?: ScheduleConfig;
  titleColor?: string;
  groupData?: TopologyGroup;
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

export type AppNode = Node<WorkflowNodeData>;

export interface WorkflowDocument {
  id: string;
  name: string;
  description?: string;
  nodes: AppNode[];
  edges: Edge[];
}

export interface AzureProject {
  id: string;
  name: string;
  description: string;
  visibility: 'private' | 'public';
  state: 'wellFormed' | 'deleting' | 'new';
  url: string;
  lastUpdateTime: string;
  repositoriesCount: number;
  pipelinesCount: number;
  defaultRepository?: string;
}

export interface AzurePipeline {
  id: string;
  projectId: string;
  name: string;
  folder: string;
  status: 'completed' | 'inProgress' | 'notStarted' | 'cancelling';
  result: 'succeeded' | 'failed' | 'canceled' | 'none';
  repository: string;
  branch: string;
  lastRunDate: string;
  duration: string;
  author: string;
  variableGroupIds: string[];
  environmentIds: string[];
  schedule?: ScheduleConfig;
  variables: PipelineVariable[];
  agent: PipelineAgent;
  azureUrl?: string;
  groupId?: string;
}

export interface DashboardData {
  projects: number;
  pipelines: number;
  variableGroups: number;
  environments: number;
  repositories: number;
  successRate: number;
  activeRuns: number;
}

export interface SettingsData {
  organization: string;
  project: string;
  pat: string;
  defaultBranch: string;
  isConnected: boolean;
  customGetScript: string;
}

export interface SavedProjectTopology {
  nodes: Node[];
  edges: Edge[];
  groups: TopologyGroup[];
  savedAt: string;
}
