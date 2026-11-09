import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Button,
  Stack,
  Divider,
  Drawer,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Snackbar
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloseIcon from '@mui/icons-material/Close';
import ForkRightIcon from '@mui/icons-material/ForkRight';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import PaletteIcon from '@mui/icons-material/Palette';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  applyNodeChanges,
  applyEdgeChanges,
  type Edge,
  type Node,
  type OnNodesChange,
  type OnEdgesChange,
  type Connection,
  type NodeMouseHandler,
  type EdgeMouseHandler
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStudioStore } from '../store';
import {
  VariableGroupNode,
  PipelineTopologyNode,
  EnvironmentNode,
  GroupContainerNode
} from './TopologyNodes';
import type { AzurePipeline, VariableGroup, Environment, TopologyGroup } from '../types';

const COLOR_PALETTE = [
  '#0284c7', // Azul
  '#10b981', // Esmeralda
  '#eab308', // Âmbar
  '#ef4444', // Vermelho
  '#8b5cf6', // Roxo
  '#06b6d4', // Ciano
  '#ec4899', // Rosa
  '#f97316'  // Laranja
];

function InnerTopologyView() {
  const {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    pipelines,
    variableGroups,
    environments,
    topologyGroups,
    savedTopologies,
    saveProjectTopology,
    resetProjectTopologyToDefault,
    addTopologyGroup,
    updateTopologyGroup,
    deleteTopologyGroup,
    connectVariableGroupToPipeline,
    disconnectVariableGroupFromPipeline,
    connectPipelineToEnvironment,
    disconnectPipelineFromEnvironment,
    updatePipelineAgentNotes,
    updateEnvironmentTitleColor,
    addLog
  } = useStudioStore();

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const currentVariableGroups = variableGroups[activeProject.id] || [];
  const currentEnvironments = environments[activeProject.id] || [];
  const currentPipelines = useMemo(
    () => pipelines.filter((p) => p.projectId === activeProject.id),
    [pipelines, activeProject.id]
  );
  const currentGroups = topologyGroups[activeProject.id] || [];

  // Estados locais do Canvas
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [onlyScheduled, setOnlyScheduled] = useState(false);

  // Referência para controlar o último projeto carregado
  const loadedProjectIdRef = useRef<string | null>(null);

  // Estados para Gavetas de Inspeção
  const [inspectPipeline, setInspectPipeline] = useState<AzurePipeline | null>(null);
  const [inspectVariableGroup, setInspectVariableGroup] = useState<VariableGroup | null>(null);
  const [inspectEnvironment, setInspectEnvironment] = useState<Environment | null>(null);

  // Notas do Agente na Gaveta
  const [agentNotesInput, setAgentNotesInput] = useState('');

  // Modais de Confirmação de Conexão
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
  const [pendingEdgeRemoval, setPendingEdgeRemoval] = useState<Edge | null>(null);

  // Modal para Criar / Editar Grupo
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupColor, setNewGroupColor] = useState(COLOR_PALETTE[0]);
  const [newGroupRepo, setNewGroupRepo] = useState(activeProject.defaultRepository || '');

  // Confirmação para Eliminar Grupo
  const [groupToDeleteId, setGroupToDeleteId] = useState<string | null>(null);

  // Toast de feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mostrar segredos
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});

  // Callbacks para os nós de Grupo
  const handleOpenEditGroup = useCallback((group: TopologyGroup) => {
    setEditingGroupId(group.id);
    setNewGroupName(group.name);
    setNewGroupDesc(group.description || '');
    setNewGroupColor(group.color || COLOR_PALETTE[0]);
    setNewGroupRepo(group.repository || '');
    setIsGroupModalOpen(true);
  }, []);

  const handleRequestDeleteGroup = useCallback((groupId: string) => {
    setGroupToDeleteId(groupId);
  }, []);

  // Tipos de nós no ReactFlow
  const nodeTypes = useMemo(
    () => ({
      variableGroup: VariableGroupNode as any,
      pipeline: PipelineTopologyNode as any,
      environment: EnvironmentNode as any,
      group: GroupContainerNode as any
    }),
    []
  );

  // Geração do layout padrão inicial
  const buildDefaultTopology = useCallback(() => {
    const generatedNodes: Node[] = [];
    const generatedEdges: Edge[] = [];

    // 0. Grupos do Projeto (Fundo, zIndex: 0)
    currentGroups.forEach((grp, idx) => {
      generatedNodes.push({
        id: grp.id,
        type: 'group',
        position: { x: 30, y: 30 + idx * 340 },
        style: { width: 1120, height: 300 },
        data: {
          label: grp.name,
          groupData: grp,
          kind: 'group',
          onEditGroup: handleOpenEditGroup,
          onDeleteGroup: handleRequestDeleteGroup
        },
        draggable: true,
        zIndex: 0
      });
    });

    // 1. Variable Groups (Coluna Esquerda, x: 60, zIndex: 10)
    currentVariableGroups.forEach((vg, index) => {
      generatedNodes.push({
        id: vg.id,
        type: 'variableGroup',
        position: { x: 60, y: 70 + index * 140 },
        data: {
          label: vg.name,
          description: vg.description,
          variablesCount: vg.variables.length,
          isSecret: vg.isSecret,
          azureUrl: vg.azureUrl,
          variables: vg.variables,
          kind: 'variableGroup'
        },
        draggable: true,
        zIndex: 10
      });
    });

    // 2. Pipelines (Coluna Central, x: 440, zIndex: 10)
    currentPipelines.forEach((pipe, index) => {
      generatedNodes.push({
        id: pipe.id,
        type: 'pipeline',
        position: { x: 440, y: 50 + index * 175 },
        data: {
          label: pipe.name,
          branch: pipe.branch,
          folder: pipe.folder,
          repository: pipe.repository,
          schedule: pipe.schedule,
          status: pipe.status,
          result: pipe.result,
          azureUrl: pipe.azureUrl,
          agent: pipe.agent,
          variables: pipe.variables,
          kind: 'pipeline'
        },
        draggable: true,
        zIndex: 10
      });

      // Arestas: Variable Group -> Pipeline
      pipe.variableGroupIds?.forEach((vgId) => {
        const vgExists = currentVariableGroups.some((v) => v.id === vgId);
        if (vgExists) {
          generatedEdges.push({
            id: `edge-${vgId}-${pipe.id}`,
            source: vgId,
            target: pipe.id,
            animated: Boolean(pipe.schedule?.hasSchedule),
            style: {
              stroke: '#818cf8',
              strokeWidth: 2
            }
          });
        }
      });

      // Arestas: Pipeline -> Environment
      pipe.environmentIds?.forEach((envId) => {
        const envExists = currentEnvironments.some((e) => e.id === envId);
        if (envExists) {
          generatedEdges.push({
            id: `edge-${pipe.id}-${envId}`,
            source: pipe.id,
            target: envId,
            animated: Boolean(pipe.schedule?.hasSchedule),
            style: {
              stroke: '#34d399',
              strokeWidth: 2
            }
          });
        }
      });
    });

    // 3. Environments (Coluna Direita, x: 860, zIndex: 10)
    currentEnvironments.forEach((env, index) => {
      generatedNodes.push({
        id: env.id,
        type: 'environment',
        position: { x: 860, y: 70 + index * 140 },
        data: {
          label: env.name,
          description: env.description,
          approvalsRequired: env.approvalsRequired,
          titleColor: env.titleColor,
          azureUrl: env.azureUrl,
          kind: 'environment'
        },
        draggable: true,
        zIndex: 10
      });
    });

    return { nodes: generatedNodes, edges: generatedEdges };
  }, [currentGroups, currentVariableGroups, currentPipelines, currentEnvironments, handleOpenEditGroup, handleRequestDeleteGroup]);

  // Carregar Nós: roda APENAS quando o ID do projeto muda!
  useEffect(() => {
    if (loadedProjectIdRef.current === activeProject.id) {
      return;
    }
    loadedProjectIdRef.current = activeProject.id;

    const saved = savedTopologies[activeProject.id];
    if (saved && saved.nodes && saved.nodes.length > 0) {
      // Re-injeta callbacks e dados dinâmicos preservando as posições exatas salvas pelo usuário
      const hydratedNodes = saved.nodes.map((n) => {
        if (n.type === 'group') {
          const liveGrp = currentGroups.find((g) => g.id === n.id) || (n.data?.groupData as TopologyGroup);
          return {
            ...n,
            zIndex: 0,
            draggable: true,
            data: {
              ...n.data,
              groupData: liveGrp,
              onEditGroup: handleOpenEditGroup,
              onDeleteGroup: handleRequestDeleteGroup
            }
          };
        }
        if (n.type === 'pipeline') {
          const livePipe = currentPipelines.find((p) => p.id === n.id);
          return {
            ...n,
            zIndex: 10,
            draggable: true,
            data: {
              ...n.data,
              schedule: livePipe?.schedule,
              agent: livePipe?.agent,
              variables: livePipe?.variables,
              azureUrl: livePipe?.azureUrl
            }
          };
        }
        if (n.type === 'variableGroup') {
          const liveVg = currentVariableGroups.find((v) => v.id === n.id);
          return {
            ...n,
            zIndex: 10,
            draggable: true,
            data: {
              ...n.data,
              variables: liveVg?.variables,
              azureUrl: liveVg?.azureUrl
            }
          };
        }
        if (n.type === 'environment') {
          const liveEnv = currentEnvironments.find((e) => e.id === n.id);
          return {
            ...n,
            zIndex: 10,
            draggable: true,
            data: {
              ...n.data,
              titleColor: liveEnv?.titleColor,
              azureUrl: liveEnv?.azureUrl
            }
          };
        }
        return { ...n, draggable: true };
      });
      setNodes(hydratedNodes);
      setEdges(saved.edges || []);
      addLog(`[TOPOLOGIA] Configuração carregada para "${activeProject.name}".`);
    } else {
      const initial = buildDefaultTopology();
      setNodes(initial.nodes);
      setEdges(initial.edges);
    }
  }, [activeProject.id, savedTopologies, buildDefaultTopology, currentPipelines, currentVariableGroups, currentEnvironments, currentGroups, handleOpenEditGroup, handleRequestDeleteGroup, addLog]);

  // Movimento livre e redimensionamento dos nós
  const onNodesChange: OnNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange: OnEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  // Ao arrastar uma conexão: abre POP-UP de confirmação
  const onConnect = useCallback((connection: Connection) => {
    setPendingConnection(connection);
  }, []);

  // Confirmar Nova Conexão
  const handleConfirmConnection = () => {
    if (!pendingConnection) return;
    const { source, target } = pendingConnection;
    if (!source || !target) return;

    const isVgToPipe =
      currentVariableGroups.some((v) => v.id === source) &&
      currentPipelines.some((p) => p.id === target);

    const isPipeToEnv =
      currentPipelines.some((p) => p.id === source) &&
      currentEnvironments.some((e) => e.id === target);

    if (isVgToPipe) {
      connectVariableGroupToPipeline(source, target);
      setEdges((eds) => [
        ...eds,
        {
          id: `edge-${source}-${target}`,
          source,
          target,
          animated: true,
          style: { stroke: '#818cf8', strokeWidth: 2 }
        }
      ]);
      setToastMessage('Variable Group vinculado à Pipeline!');
    } else if (isPipeToEnv) {
      connectPipelineToEnvironment(source, target);
      setEdges((eds) => [
        ...eds,
        {
          id: `edge-${source}-${target}`,
          source,
          target,
          animated: true,
          style: { stroke: '#34d399', strokeWidth: 2 }
        }
      ]);
      setToastMessage('Environment vinculado à Pipeline!');
    } else {
      setToastMessage('Conexão direta não suportada entre estes componentes.');
    }

    setPendingConnection(null);
  };

  // Ao clicar em uma aresta: abre POP-UP para confirmação de remoção
  const onEdgeClick: EdgeMouseHandler = useCallback((_, edge) => {
    setPendingEdgeRemoval(edge);
  }, []);

  // Confirmar Remoção de Conexão
  const handleConfirmEdgeRemoval = () => {
    if (!pendingEdgeRemoval) return;
    const { source, target, id } = pendingEdgeRemoval;

    if (currentVariableGroups.some((v) => v.id === source)) {
      disconnectVariableGroupFromPipeline(source, target);
    }
    if (currentEnvironments.some((e) => e.id === target)) {
      disconnectPipelineFromEnvironment(source, target);
    }

    setEdges((eds) => eds.filter((e) => e.id !== id));
    setToastMessage('Conexão removida com sucesso!');
    setPendingEdgeRemoval(null);
  };

  // Clique em nós
  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      if (node.type === 'pipeline') {
        const pipe = currentPipelines.find((p) => p.id === node.id);
        if (pipe) {
          setInspectPipeline(pipe);
          setAgentNotesInput(pipe.agent?.notes || '');
        }
      } else if (node.type === 'variableGroup') {
        const vg = currentVariableGroups.find((v) => v.id === node.id);
        if (vg) {
          setInspectVariableGroup(vg);
        }
      } else if (node.type === 'environment') {
        const env = currentEnvironments.find((e) => e.id === node.id);
        if (env) {
          setInspectEnvironment(env);
        }
      } else if (node.type === 'group') {
        // Clicar no grupo seleciona o grupo para permitir redimensionar com as alças
      }
    },
    [currentPipelines, currentVariableGroups, currentEnvironments]
  );

  // Salvar Topologia e Posições sem resetar nada
  const handleSaveTopology = () => {
    saveProjectTopology(activeProject.id, nodes, edges);
    setToastMessage('Configuração do projeto salva com sucesso!');
  };

  // Resetar Layout para o Padrão
  const handleResetLayout = () => {
    resetProjectTopologyToDefault(activeProject.id);
    const initial = buildDefaultTopology();
    setNodes(initial.nodes);
    setEdges(initial.edges);
    setToastMessage('Layout restaurado para o padrão.');
  };

  // Abrir Modal para Criar Grupo
  const handleOpenCreateGroup = () => {
    setEditingGroupId(null);
    setNewGroupName('');
    setNewGroupDesc('');
    setNewGroupColor(COLOR_PALETTE[0]);
    setNewGroupRepo(activeProject.defaultRepository || '');
    setIsGroupModalOpen(true);
  };

  // Salvar Criação ou Edição do Grupo (PRESERVANDO 100% DAS POSIÇÕES DOS OUTROS NÓS!)
  const handleSaveGroupModal = () => {
    if (!newGroupName.trim()) return;

    if (editingGroupId) {
      // Editando Grupo Existente
      updateTopologyGroup(editingGroupId, {
        name: newGroupName.trim(),
        description: newGroupDesc.trim(),
        color: newGroupColor,
        repository: newGroupRepo.trim()
      });

      const updatedGroup: TopologyGroup = {
        id: editingGroupId,
        projectId: activeProject.id,
        name: newGroupName.trim(),
        description: newGroupDesc.trim(),
        color: newGroupColor,
        repository: newGroupRepo.trim()
      };

      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === editingGroupId) {
            return {
              ...n,
              data: {
                ...n.data,
                label: updatedGroup.name,
                groupData: updatedGroup
              }
            };
          }
          return n;
        })
      );
      setToastMessage(`Grupo "${updatedGroup.name}" atualizado!`);
    } else {
      // Criando Novo Grupo
      const created = addTopologyGroup(activeProject.id, {
        name: newGroupName.trim(),
        description: newGroupDesc.trim(),
        color: newGroupColor,
        repository: newGroupRepo.trim()
      });

      const newGroupNode: Node = {
        id: created.id,
        type: 'group',
        position: { x: 40, y: 40 },
        style: { width: 1120, height: 320 },
        data: {
          label: created.name,
          groupData: created,
          kind: 'group',
          onEditGroup: handleOpenEditGroup,
          onDeleteGroup: handleRequestDeleteGroup
        },
        draggable: true,
        zIndex: 0
      };

      // Adiciona o nó no topo SEM mexer nas posições dos nós existentes!
      const updatedNodes = [newGroupNode, ...nodes];
      setNodes(updatedNodes);

      // Salva imediatamente para que as posições sejam persistidas
      saveProjectTopology(activeProject.id, updatedNodes, edges);
      setToastMessage(`Grupo "${created.name}" adicionado à topologia!`);
    }

    setIsGroupModalOpen(false);
  };

  // Confirmar Eliminação do Grupo
  const handleConfirmDeleteGroup = () => {
    if (!groupToDeleteId) return;

    deleteTopologyGroup(groupToDeleteId);
    const updatedNodes = nodes.filter((n) => n.id !== groupToDeleteId);
    setNodes(updatedNodes);

    saveProjectTopology(activeProject.id, updatedNodes, edges);
    setToastMessage('Grupo eliminado com sucesso!');
    setGroupToDeleteId(null);
  };

  // Salvar Notas do Agente
  const handleSaveAgentNotes = () => {
    if (!inspectPipeline) return;
    updatePipelineAgentNotes(inspectPipeline.id, agentNotesInput);
    setInspectPipeline({
      ...inspectPipeline,
      agent: {
        ...inspectPipeline.agent,
        notes: agentNotesInput
      }
    });

    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === inspectPipeline.id) {
          return {
            ...n,
            data: {
              ...n.data,
              agent: {
                ...(n.data.agent as any),
                notes: agentNotesInput
              }
            }
          };
        }
        return n;
      })
    );
    setToastMessage('Notas do agente atualizadas!');
  };

  // Alterar Cor do Título do Environment
  const handleSelectEnvironmentColor = (color: string) => {
    if (!inspectEnvironment) return;
    updateEnvironmentTitleColor(activeProject.id, inspectEnvironment.id, color);
    setInspectEnvironment({
      ...inspectEnvironment,
      titleColor: color
    });

    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === inspectEnvironment.id) {
          return {
            ...n,
            data: {
              ...n.data,
              titleColor: color
            }
          };
        }
        return n;
      })
    );
    setToastMessage('Cor do título do Environment atualizada!');
  };

  // Filtro de Agendamentos
  const displayNodes = useMemo(() => {
    if (!onlyScheduled) return nodes;
    return nodes.filter((n) => {
      if (n.type === 'pipeline') {
        const pipe = currentPipelines.find((p) => p.id === n.id);
        return Boolean(pipe?.schedule?.hasSchedule);
      }
      return true;
    });
  }, [nodes, onlyScheduled, currentPipelines]);

  // Nomes amigáveis para diálogos de confirmação
  const getPendingConnectionNames = () => {
    if (!pendingConnection) return { sourceName: '', targetName: '', type: '' };
    const srcVg = currentVariableGroups.find((v) => v.id === pendingConnection.source);
    const srcPipe = currentPipelines.find((p) => p.id === pendingConnection.source);
    const tgtPipe = currentPipelines.find((p) => p.id === pendingConnection.target);
    const tgtEnv = currentEnvironments.find((e) => e.id === pendingConnection.target);

    if (srcVg && tgtPipe) {
      return {
        sourceName: `Variable Group "${srcVg.name}"`,
        targetName: `Pipeline "${tgtPipe.name}"`,
        type: 'vg-to-pipe'
      };
    }
    if (srcPipe && tgtEnv) {
      return {
        sourceName: `Pipeline "${srcPipe.name}"`,
        targetName: `Environment "${tgtEnv.name}"`,
        type: 'pipe-to-env'
      };
    }
    return {
      sourceName: pendingConnection.source || '',
      targetName: pendingConnection.target || '',
      type: 'generic'
    };
  };

  const getPendingRemovalNames = () => {
    if (!pendingEdgeRemoval) return { sourceName: '', targetName: '' };
    const srcVg = currentVariableGroups.find((v) => v.id === pendingEdgeRemoval.source);
    const srcPipe = currentPipelines.find((p) => p.id === pendingEdgeRemoval.source);
    const tgtPipe = currentPipelines.find((p) => p.id === pendingEdgeRemoval.target);
    const tgtEnv = currentEnvironments.find((e) => e.id === pendingEdgeRemoval.target);

    return {
      sourceName: srcVg?.name || srcPipe?.name || pendingEdgeRemoval.source,
      targetName: tgtPipe?.name || tgtEnv?.name || pendingEdgeRemoval.target
    };
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)', backgroundColor: '#0d1117' }}>
      {/* BARRA SUPERIOR */}
      <Box
        sx={{
          p: 2,
          backgroundColor: '#121722',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          zIndex: 5
        }}
      >
        {/* Dropdown de Projetos & Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}
          >
            <StorageIcon />
          </Box>

          <FormControl size="small" sx={{ minWidth: 260 }}>
            <InputLabel id="project-select-label" sx={{ color: '#94a3b8' }}>
              Projeto Azure DevOps
            </InputLabel>
            <Select
              labelId="project-select-label"
              value={activeProject.id}
              label="Projeto Azure DevOps"
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setInspectPipeline(null);
                setInspectVariableGroup(null);
                setInspectEnvironment(null);
              }}
              sx={{
                backgroundColor: '#18212e',
                color: '#fff',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#38bdf8' }
              }}
            >
              {projects.map((proj) => (
                <MenuItem key={proj.id} value={proj.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography fontWeight={700} fontSize="0.88rem">
                      {proj.name}
                    </Typography>
                    <Chip
                      label={`${proj.pipelinesCount} pipes`}
                      size="small"
                      sx={{ height: 18, fontSize: '0.62rem', backgroundColor: '#1e293b', color: '#94a3b8' }}
                    />
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Chip
            icon={<ForkRightIcon sx={{ fontSize: 16 }} />}
            label={`Repo: ${activeProject.defaultRepository || 'main.git'}`}
            size="small"
            sx={{ backgroundColor: '#18212e', color: '#38bdf8', border: '1px solid #334155' }}
          />
        </Box>

        {/* Ações de Grupos, Salvar, Filtros */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddCircleOutlineIcon />}
            onClick={handleOpenCreateGroup}
            sx={{ borderColor: '#334155', color: '#e2e8f0', textTransform: 'none' }}
          >
            Criar Grupo / Repositório
          </Button>

          <Button
            size="small"
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveTopology}
            sx={{
              backgroundColor: '#0284c7',
              '&:hover': { backgroundColor: '#0369a1' },
              fontWeight: 700,
              textTransform: 'none'
            }}
          >
            Guardar Configuração
          </Button>

          <Tooltip title="Restaurar posições originais dos nós">
            <IconButton size="small" onClick={handleResetLayout} sx={{ color: '#94a3b8' }}>
              <RestartAltIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ borderColor: '#222d3d' }} />

          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={onlyScheduled}
                onChange={(e) => setOnlyScheduled(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#facc15' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#eab308' }
                }}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccessTimeIcon sx={{ fontSize: 16, color: '#facc15' }} />
                <Typography variant="caption" sx={{ color: '#fef08a', fontWeight: 700 }}>
                  Apenas Agendadas
                </Typography>
              </Box>
            }
          />
        </Box>
      </Box>

      {/* ÁREA DO CANVAS INTERATIVO */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={displayNodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onEdgeClick={onEdgeClick}
          fitView
          fitViewOptions={{ padding: 0.15 }}
        >
          <Background color="#1e293b" gap={24} size={1.5} />
          <Controls style={{ backgroundColor: '#141c28', border: '1px solid #233145', fill: '#fff' }} />
          <MiniMap
            style={{ backgroundColor: '#101621', border: '1px solid #222d3d', borderRadius: 8 }}
            nodeColor={(n: any) => {
              if (n.type === 'variableGroup') return '#818cf8';
              if (n.type === 'pipeline') return '#38bdf8';
              if (n.type === 'environment') return '#34d399';
              return '#475569';
            }}
          />
        </ReactFlow>

        {/* Barra Informativa Flutuante */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            p: 1.2,
            backgroundColor: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(8px)',
            borderRadius: 2,
            border: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Typography variant="caption" sx={{ color: '#cbd5e1' }}>
            🖱️ <b>Redimensione</b> puxando as alças dos nós • <b>Mova livremente</b> • Clique no Grupo para <b>Editar/Eliminar</b>
          </Typography>
        </Box>
      </Box>

      {/* 1. GAVETA DE DETALHES DA PIPELINE */}
      <Drawer
        anchor="right"
        open={Boolean(inspectPipeline)}
        onClose={() => setInspectPipeline(null)}
        PaperProps={{
          sx: {
            width: 480,
            backgroundColor: '#121924',
            borderLeft: '1px solid #222d3d',
            p: 3
          }
        }}
      >
        {inspectPipeline && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <AccountTreeIcon sx={{ color: '#38bdf8' }} />
                <div>
                  <Typography variant="h6" fontWeight={800} sx={{ color: '#fff', lineHeight: 1.2 }}>
                    {inspectPipeline.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Pipeline CI/CD Azure DevOps
                  </Typography>
                </div>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {inspectPipeline.azureUrl && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<OpenInNewIcon />}
                    onClick={() => window.open(inspectPipeline.azureUrl, '_blank')}
                    sx={{ borderColor: '#38bdf8', color: '#38bdf8', textTransform: 'none', py: 0.3 }}
                  >
                    Abrir no Azure
                  </Button>
                )}
                <IconButton size="small" onClick={() => setInspectPipeline(null)} sx={{ color: '#94a3b8' }}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>

            <Divider sx={{ borderColor: '#222d3d', mb: 2.5 }} />

            <Stack spacing={2.5}>
              {inspectPipeline.schedule?.hasSchedule ? (
                <Box
                  sx={{
                    p: 1.8,
                    backgroundColor: 'rgba(234, 179, 8, 0.1)',
                    border: '1px solid #ca8a04',
                    borderRadius: 2
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <AccessTimeIcon sx={{ color: '#facc15', fontSize: 18 }} />
                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#fef08a' }}>
                      Agendamento Ativo (Schedule)
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#fff' }}>
                    {inspectPipeline.schedule.humanReadable}
                  </Typography>
                  <Chip
                    label={`Cron: ${inspectPipeline.schedule.cron}`}
                    size="small"
                    sx={{ mt: 0.8, fontFamily: 'monospace', backgroundColor: '#0f172a', color: '#fde047' }}
                  />
                </Box>
              ) : (
                <Box sx={{ p: 1.5, backgroundColor: '#18212e', borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Gatilho: Acionamento Manual ou via Pull Request triggers.
                  </Typography>
                </Box>
              )}

              {/* Agente e Notas */}
              <Box sx={{ p: 2, backgroundColor: '#161e2b', borderRadius: 2, border: '1px solid #253347' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <SupportAgentIcon sx={{ color: '#38bdf8' }} />
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#f1f5f9' }}>
                    Agente de Execução (Build Agent)
                  </Typography>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>Pool de Agentes</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ color: '#e2e8f0' }}>
                      {inspectPipeline.agent.pool}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>Status</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }} />
                      <Typography variant="body2" fontWeight={600} sx={{ color: '#34d399' }}>
                        {inspectPipeline.agent.status}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ gridColumn: 'span 2' }}>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>Nome da Máquina / Runner</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ color: '#38bdf8', fontFamily: 'monospace' }}>
                      {inspectPipeline.agent.agentName}
                    </Typography>
                  </Box>
                </Box>

                {inspectPipeline.agent.demands && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5 }}>
                      Requisitos de Sistema (Demands)
                    </Typography>
                    <Stack direction="row" spacing={0.8} flexWrap="wrap">
                      {inspectPipeline.agent.demands.map((d) => (
                        <Chip key={d} label={d} size="small" sx={{ fontSize: '0.68rem', backgroundColor: '#0f172a', color: '#94a3b8' }} />
                      ))}
                    </Stack>
                  </Box>
                )}

                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, display: 'block', mb: 0.8 }}>
                  Notas do Agente (Editável):
                </Typography>
                <TextField
                  multiline
                  rows={2}
                  fullWidth
                  value={agentNotesInput}
                  onChange={(e) => setAgentNotesInput(e.target.value)}
                  placeholder="Insira notas operacionais sobre este agente..."
                  sx={{
                    backgroundColor: '#0f172a',
                    borderRadius: 1.5,
                    mb: 1.5,
                    '& .MuiInputBase-input': { fontSize: '0.82rem', color: '#e2e8f0' }
                  }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleSaveAgentNotes}
                  sx={{ borderColor: '#38bdf8', color: '#38bdf8', textTransform: 'none' }}
                >
                  Salvar Notas do Agente
                </Button>
              </Box>

              {/* Variáveis Individuais */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ViewStreamIcon sx={{ color: '#a78bfa' }} />
                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#f1f5f9' }}>
                      Variáveis Individuais da Pipeline ({inspectPipeline.variables.length})
                    </Typography>
                  </Box>
                </Box>

                <TableContainer component={Paper} sx={{ backgroundColor: '#131924', border: '1px solid #222d3d', borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: '#0f141d' }}>
                      <TableRow>
                        <TableCell sx={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700 }}>VARIÁVEL</TableCell>
                        <TableCell sx={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700 }}>VALOR</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {inspectPipeline.variables.map((v) => {
                        const isRevealed = revealedSecrets[`pipe-${v.name}`];
                        return (
                          <TableRow key={v.name} hover sx={{ borderColor: '#1e293b' }}>
                            <TableCell sx={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                              {v.name}
                              {v.allowOverride && (
                                <Chip label="Queue Time" size="small" sx={{ ml: 1, height: 16, fontSize: '0.6rem', backgroundColor: '#1e293b', color: '#94a3b8' }} />
                              )}
                            </TableCell>
                            <TableCell sx={{ color: v.isSecret ? '#f59e0b' : '#38bdf8', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                              {v.isSecret ? (isRevealed ? v.value : '••••••••••••') : v.value}
                              {v.isSecret && (
                                <IconButton
                                  size="small"
                                  onClick={() => setRevealedSecrets((prev) => ({ ...prev, [`pipe-${v.name}`]: !isRevealed }))}
                                  sx={{ color: '#94a3b8', ml: 0.5, p: 0.2 }}
                                >
                                  {isRevealed ? <VisibilityOff sx={{ fontSize: 13 }} /> : <Visibility sx={{ fontSize: 13 }} />}
                                </IconButton>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              <Box sx={{ p: 1.5, backgroundColor: '#0f141d', borderRadius: 2, border: '1px solid #1e293b' }}>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                  Branch: <b style={{ color: '#cbd5e1' }}>{inspectPipeline.branch}</b>
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                  Pasta: <b style={{ color: '#cbd5e1' }}>{inspectPipeline.folder}</b>
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                  Repositório: <b style={{ color: '#cbd5e1' }}>{inspectPipeline.repository}</b>
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}
      </Drawer>

      {/* 2. GAVETA DE DETALHES DO VARIABLE GROUP */}
      <Drawer
        anchor="right"
        open={Boolean(inspectVariableGroup)}
        onClose={() => setInspectVariableGroup(null)}
        PaperProps={{
          sx: {
            width: 480,
            backgroundColor: '#121924',
            borderLeft: '1px solid #222d3d',
            p: 3
          }
        }}
      >
        {inspectVariableGroup && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <VpnKeyIcon sx={{ color: '#818cf8' }} />
                <div>
                  <Typography variant="h6" fontWeight={800} sx={{ color: '#fff', lineHeight: 1.2 }}>
                    {inspectVariableGroup.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Variable Group Azure DevOps
                  </Typography>
                </div>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {inspectVariableGroup.azureUrl && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<OpenInNewIcon />}
                    onClick={() => window.open(inspectVariableGroup.azureUrl, '_blank')}
                    sx={{ borderColor: '#818cf8', color: '#818cf8', textTransform: 'none', py: 0.3 }}
                  >
                    Abrir no Azure
                  </Button>
                )}
                <IconButton size="small" onClick={() => setInspectVariableGroup(null)} sx={{ color: '#94a3b8' }}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>

            <Divider sx={{ borderColor: '#222d3d', mb: 2.5 }} />

            <Stack spacing={2.5}>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                {inspectVariableGroup.description}
              </Typography>

              <Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#c7d2fe', mb: 1.5 }}>
                  Variáveis Configuradas ({inspectVariableGroup.variables.length})
                </Typography>

                <TableContainer component={Paper} sx={{ backgroundColor: '#131924', border: '1px solid #222d3d', borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: '#0f141d' }}>
                      <TableRow>
                        <TableCell sx={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700 }}>NOME</TableCell>
                        <TableCell sx={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700 }}>VALOR</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {inspectVariableGroup.variables.map((v) => {
                        const isRevealed = revealedSecrets[`vg-${v.name}`];
                        return (
                          <TableRow key={v.name} hover sx={{ borderColor: '#1e293b' }}>
                            <TableCell sx={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                              {v.name}
                            </TableCell>
                            <TableCell sx={{ color: v.isSecret ? '#f59e0b' : '#818cf8', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                              {v.isSecret ? (isRevealed ? v.value : '••••••••••••') : v.value}
                              {v.isSecret && (
                                <IconButton
                                  size="small"
                                  onClick={() => setRevealedSecrets((prev) => ({ ...prev, [`vg-${v.name}`]: !isRevealed }))}
                                  sx={{ color: '#94a3b8', ml: 0.5, p: 0.2 }}
                                >
                                  {isRevealed ? <VisibilityOff sx={{ fontSize: 13 }} /> : <Visibility sx={{ fontSize: 13 }} />}
                                </IconButton>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Stack>
          </Box>
        )}
      </Drawer>

      {/* 3. GAVETA DE DETALHES DO ENVIRONMENT */}
      <Drawer
        anchor="right"
        open={Boolean(inspectEnvironment)}
        onClose={() => setInspectEnvironment(null)}
        PaperProps={{
          sx: {
            width: 440,
            backgroundColor: '#121924',
            borderLeft: '1px solid #222d3d',
            p: 3
          }
        }}
      >
        {inspectEnvironment && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <CloudDoneIcon sx={{ color: inspectEnvironment.titleColor || '#34d399' }} />
                <div>
                  <Typography variant="h6" fontWeight={800} sx={{ color: '#fff', lineHeight: 1.2 }}>
                    {inspectEnvironment.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Environment Azure DevOps
                  </Typography>
                </div>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {inspectEnvironment.azureUrl && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<OpenInNewIcon />}
                    onClick={() => window.open(inspectEnvironment.azureUrl, '_blank')}
                    sx={{
                      borderColor: inspectEnvironment.titleColor || '#34d399',
                      color: inspectEnvironment.titleColor || '#34d399',
                      textTransform: 'none',
                      py: 0.3
                    }}
                  >
                    Abrir no Azure
                  </Button>
                )}
                <IconButton size="small" onClick={() => setInspectEnvironment(null)} sx={{ color: '#94a3b8' }}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>

            <Divider sx={{ borderColor: '#222d3d', mb: 2.5 }} />

            <Stack spacing={2.5}>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                {inspectEnvironment.description}
              </Typography>

              <Box sx={{ p: 2, backgroundColor: '#18212e', borderRadius: 2, border: '1px solid #253347' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <PaletteIcon sx={{ color: inspectEnvironment.titleColor || '#34d399' }} />
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#f1f5f9' }}>
                    Personalizar Cor do Título
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1.5 }}>
                  Escolha uma cor para identificar visualmente este ambiente no canvas:
                </Typography>

                <Stack direction="row" spacing={1.2}>
                  {COLOR_PALETTE.map((color) => {
                    const isSelected = (inspectEnvironment.titleColor || '#34d399') === color;
                    return (
                      <Box
                        key={color}
                        onClick={() => handleSelectEnvironmentColor(color)}
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: color,
                          cursor: 'pointer',
                          border: isSelected ? '3px solid #fff' : '2px solid transparent',
                          boxShadow: isSelected ? `0 0 10px ${color}` : 'none',
                          transition: 'all 0.15s',
                          '&:hover': { transform: 'scale(1.15)' }
                        }}
                      />
                    );
                  })}
                </Stack>
              </Box>

              <Box sx={{ p: 1.5, backgroundColor: '#0f141d', borderRadius: 2, border: '1px solid #1e293b' }}>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5 }}>
                  Approval Gates
                </Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: inspectEnvironment.approvalsRequired ? '#38bdf8' : '#94a3b8' }}>
                  {inspectEnvironment.approvalsRequired
                    ? '🔒 Exige Aprovação Manual antes de implantar'
                    : '🟢 Sem barreiras de aprovação'}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}
      </Drawer>

      {/* 4. MODAL DE CONFIRMAÇÃO: ADICIONAR NOVA CONEXÃO */}
      <Dialog
        open={Boolean(pendingConnection)}
        onClose={() => setPendingConnection(null)}
        PaperProps={{
          sx: { backgroundColor: '#131924', border: '1px solid #283548', borderRadius: 3, maxWidth: 450 }
        }}
      >
        <DialogTitle sx={{ pb: 1, pt: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <LinkIcon sx={{ color: '#38bdf8' }} />
            <Typography variant="h6" fontWeight={800} sx={{ color: '#fff' }}>
              Confirmar Nova Ligação
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2, backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#bae6fd' }}>
            Deseja conectar os componentes selecionados?
          </Alert>
          <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
            Origem: <b>{getPendingConnectionNames().sourceName}</b>
          </Typography>
          <Typography variant="body2" sx={{ color: '#cbd5e1', mt: 0.5 }}>
            Destino: <b>{getPendingConnectionNames().targetName}</b>
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPendingConnection(null)} sx={{ color: '#94a3b8' }}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleConfirmConnection} sx={{ backgroundColor: '#0284c7', fontWeight: 700 }}>
            Confirmar Conexão
          </Button>
        </DialogActions>
      </Dialog>

      {/* 5. MODAL DE CONFIRMAÇÃO: REMOVER CONEXÃO */}
      <Dialog
        open={Boolean(pendingEdgeRemoval)}
        onClose={() => setPendingEdgeRemoval(null)}
        PaperProps={{
          sx: { backgroundColor: '#131924', border: '1px solid #283548', borderRadius: 3, maxWidth: 450 }
        }}
      >
        <DialogTitle sx={{ pb: 1, pt: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <LinkOffIcon sx={{ color: '#ef4444' }} />
            <Typography variant="h6" fontWeight={800} sx={{ color: '#fff' }}>
              Confirmar Remoção de Ligação
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5' }}>
            Tem a certeza de que deseja desconectar estes componentes?
          </Alert>
          <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
            Origem: <b>{getPendingRemovalNames().sourceName}</b>
          </Typography>
          <Typography variant="body2" sx={{ color: '#cbd5e1', mt: 0.5 }}>
            Destino: <b>{getPendingRemovalNames().targetName}</b>
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPendingEdgeRemoval(null)} sx={{ color: '#94a3b8' }}>
            Cancelar
          </Button>
          <Button variant="contained" color="error" onClick={handleConfirmEdgeRemoval} sx={{ fontWeight: 700 }}>
            Remover Conexão
          </Button>
        </DialogActions>
      </Dialog>

      {/* 6. MODAL PARA CRIAR / EDITAR GRUPO */}
      <Dialog
        open={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        PaperProps={{
          sx: { backgroundColor: '#131924', border: '1px solid #283548', borderRadius: 3, width: 480 }
        }}
      >
        <DialogTitle sx={{ pb: 1, pt: 2.5 }}>
          <Typography variant="h6" fontWeight={800} sx={{ color: '#fff' }}>
            {editingGroupId ? 'Editar Grupo / Repositório' : 'Criar Novo Grupo / Repositório'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nome do Grupo"
              placeholder="ex: Repositório Payments Gateway"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label="Repositório Associado"
              placeholder="ex: payments-gateway.git (ou Geral)"
              value={newGroupRepo}
              onChange={(e) => setNewGroupRepo(e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label="Descrição"
              placeholder="ex: Contém pipelines CI/CD do gateway de pagamentos"
              value={newGroupDesc}
              onChange={(e) => setNewGroupDesc(e.target.value)}
              fullWidth
              multiline
              rows={2}
              size="small"
            />
            <Box>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1 }}>
                Cor do Grupo:
              </Typography>
              <Stack direction="row" spacing={1}>
                {COLOR_PALETTE.map((c) => (
                  <Box
                    key={c}
                    onClick={() => setNewGroupColor(c)}
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: c,
                      cursor: 'pointer',
                      border: newGroupColor === c ? '2px solid #fff' : '2px solid transparent'
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsGroupModalOpen(false)} sx={{ color: '#94a3b8' }}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSaveGroupModal} sx={{ backgroundColor: '#0284c7', fontWeight: 700 }}>
            {editingGroupId ? 'Salvar Alterações' : 'Criar Grupo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 7. MODAL DE CONFIRMAÇÃO: ELIMINAR GRUPO */}
      <Dialog
        open={Boolean(groupToDeleteId)}
        onClose={() => setGroupToDeleteId(null)}
        PaperProps={{
          sx: { backgroundColor: '#131924', border: '1px solid #283548', borderRadius: 3, maxWidth: 420 }
        }}
      >
        <DialogTitle sx={{ pb: 1, pt: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <DeleteOutlineIcon sx={{ color: '#ef4444' }} />
            <Typography variant="h6" fontWeight={800} sx={{ color: '#fff' }}>
              Eliminar Grupo
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5' }}>
            Tem a certeza de que deseja eliminar esta área de grupo?
          </Alert>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            Nota: Os componentes existentes (pipelines, variable groups e environments) continuarão no canvas.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setGroupToDeleteId(null)} sx={{ color: '#94a3b8' }}>
            Cancelar
          </Button>
          <Button variant="contained" color="error" onClick={handleConfirmDeleteGroup} sx={{ fontWeight: 700 }}>
            Eliminar Grupo
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR DE NOTIFICAÇÃO TOAST */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={3000}
        onClose={() => setToastMessage(null)}
        message={toastMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}

export function RepositoriesView() {
  return (
    <ReactFlowProvider>
      <InnerTopologyView />
    </ReactFlowProvider>
  );
}
