export type NodeKind = 'input' | 'powershell' | 'condition' | 'azure' | 'git';
export interface ActionDefinition { id:string; name:string; description:string; executor:'powershell'|'nodejs'|'executable'|'rest'; inputs:string[]; outputs:string[]; }
export interface WorkflowNodeData { label:string; kind:NodeKind; actionId?:string; config?:Record<string, unknown>; [key:string]:unknown; }
export interface WorkflowDocument { id:string; name:string; nodes: import('@xyflow/react').Node<WorkflowNodeData>[]; edges: import('@xyflow/react').Edge[]; }
export interface DashboardData { projects:number; pipelines:number; variableGroups:number; environments:number; repositories:number; }
