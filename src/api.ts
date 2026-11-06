import type { ActionDefinition } from './types';
export async function invoke<T>(command:string,args?:Record<string,unknown>):Promise<T>{const w=window as unknown as {__TAURI__?:{core:{invoke:(c:string,a?:unknown)=>Promise<T>}}}; if(w.__TAURI__) return w.__TAURI__.core.invoke(command,args); throw new Error('Tauri runtime is not available');}
export const loadActions=()=>invoke<ActionDefinition[]>('list_actions');
export const saveWorkflow=(workflow:unknown)=>invoke<void>('save_workflow',{workflow});
export const executeWorkflow=(workflow:unknown)=>invoke<string[]>('execute_workflow',{workflow});
