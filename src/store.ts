import { create } from 'zustand';
import { addEdge, applyEdgeChanges, applyNodeChanges, type Connection, type Edge, type Node, type OnNodesChange, type OnEdgesChange } from '@xyflow/react';
import type { ActionDefinition, DashboardData, WorkflowNodeData } from './types';

interface StudioState { nodes:Node<WorkflowNodeData>[]; edges:Edge[]; actions:ActionDefinition[]; logs:string[]; dashboard:DashboardData; setNodes:(nodes:Node<WorkflowNodeData>[])=>void; onNodesChange:OnNodesChange<Node<WorkflowNodeData>>; onEdgesChange:OnEdgesChange; onConnect:(c:Connection)=>void; addLog:(message:string)=>void; clearLogs:()=>void; loadActions:()=>Promise<void>; }
export const useStudioStore=create<StudioState>((set)=>({
 nodes:[{id:'trigger',type:'default',position:{x:120,y:150},data:{label:'Manual Trigger',kind:'input'}}], edges:[], actions:[], logs:[], dashboard:{projects:12,pipelines:28,variableGroups:16,environments:8,repositories:34},
 setNodes:nodes=>set({nodes}), onNodesChange:changes=>set(s=>({nodes:applyNodeChanges(changes,s.nodes)})), onEdgesChange:changes=>set(s=>({edges:applyEdgeChanges(changes,s.edges)})), onConnect:connection=>set(s=>({edges:addEdge({...connection,animated:true},s.edges)})), addLog:message=>set(s=>({logs:[...s.logs,`${new Date().toLocaleTimeString()}  ${message}`]})), clearLogs:()=>set({logs:[]}),
 loadActions:async()=>{try{const response=await fetch('/actions/index.json');set({actions:await response.json()});}catch{set({actions:[{id:'create-pipeline',name:'Create Pipeline',description:'Create an Azure DevOps pipeline',executor:'powershell',inputs:['repository'],outputs:['pipelineId']}]});}}
}));
