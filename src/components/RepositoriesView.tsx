import React, { useMemo, useState, useCallback } from 'react';
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
  FormControlLabel
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloseIcon from '@mui/icons-material/Close';
import ForkRightIcon from '@mui/icons-material/ForkRight';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeMouseHandler
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStudioStore } from '../store';
import { VariableGroupNode, PipelineTopologyNode, EnvironmentNode } from './TopologyNodes';
import type { AzurePipeline, VariableGroup, Environment } from '../types';

function InnerTopologyView() {
  const {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    pipelines,
    variableGroups,
    environments,
    addLog
  } = useStudioStore();

  const [selectedPipeline, setSelectedPipeline] = useState<AzurePipeline | null>(null);
  const [onlyScheduled, setOnlyScheduled] = useState(false);

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const currentVariableGroups = variableGroups[activeProject.id] || [];
  const currentEnvironments = environments[activeProject.id] || [];
  const currentPipelines = useMemo(() => {
    const list = pipelines.filter((p) => p.projectId === activeProject.id);
    if (onlyScheduled) {
      return list.filter((p) => p.schedule?.hasSchedule);
    }
    return list;
  }, [pipelines, activeProject.id, onlyScheduled]);

  // Tipos de nós registrados para o React Flow
  const nodeTypes = useMemo(
    () => ({
      variableGroup: VariableGroupNode as any,
      pipeline: PipelineTopologyNode as any,
      environment: EnvironmentNode as any
    }),
    []
  );

  // Geração dinâmica dos nós e conexões baseada no Projeto Selecionado
  const { nodes, edges } = useMemo(() => {
    const generatedNodes: Node[] = [];
    const generatedEdges: Edge[] = [];

    // 1. Coluna dos Variable Groups (x: 40)
    currentVariableGroups.forEach((vg, index) => {
      generatedNodes.push({
        id: vg.id,
        type: 'variableGroup',
        position: { x: 40, y: 60 + index * 140 },
        data: {
          label: vg.name,
          description: vg.description,
          variablesCount: vg.variablesCount,
          isSecret: vg.isSecret,
          kind: 'variableGroup'
        }
      });
    });

    // 2. Coluna das Pipelines (x: 450)
    currentPipelines.forEach((pipe, index) => {
      const isSelected = selectedPipeline?.id === pipe.id;
      generatedNodes.push({
        id: pipe.id,
        type: 'pipeline',
        position: { x: 450, y: 40 + index * 165 },
        data: {
          label: pipe.name,
          branch: pipe.branch,
          folder: pipe.folder,
          repository: pipe.repository,
          schedule: pipe.schedule,
          status: pipe.status,
          result: pipe.result,
          kind: 'pipeline'
        },
        selected: isSelected
      });

      // Ligações: Variable Group -> Pipeline
      pipe.variableGroupIds?.forEach((vgId) => {
        const vgExists = currentVariableGroups.some((v) => v.id === vgId);
        if (vgExists) {
          const isHighlighted = isSelected;
          generatedEdges.push({
            id: `edge-${vgId}-${pipe.id}`,
            source: vgId,
            target: pipe.id,
            animated: isHighlighted || Boolean(pipe.schedule?.hasSchedule),
            style: {
              stroke: isHighlighted ? '#818cf8' : '#6366f1aa',
              strokeWidth: isHighlighted ? 3 : 1.8
            }
          });
        }
      });

      // Ligações: Pipeline -> Environment
      pipe.environmentIds?.forEach((envId) => {
        const envExists = currentEnvironments.some((e) => e.id === envId);
        if (envExists) {
          const isHighlighted = isSelected;
          generatedEdges.push({
            id: `edge-${pipe.id}-${envId}`,
            source: pipe.id,
            target: envId,
            animated: isHighlighted || Boolean(pipe.schedule?.hasSchedule),
            style: {
              stroke: isHighlighted ? '#34d399' : '#10b981aa',
              strokeWidth: isHighlighted ? 3 : 1.8
            }
          });
        }
      });
    });

    // 3. Coluna dos Environments (x: 880)
    currentEnvironments.forEach((env, index) => {
      generatedNodes.push({
        id: env.id,
        type: 'environment',
        position: { x: 880, y: 60 + index * 140 },
        data: {
          label: env.name,
          description: env.description,
          approvalsRequired: env.approvalsRequired,
          kind: 'environment'
        }
      });
    });

    return { nodes: generatedNodes, edges: generatedEdges };
  }, [currentVariableGroups, currentPipelines, currentEnvironments, selectedPipeline]);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      if (node.type === 'pipeline') {
        const found = currentPipelines.find((p) => p.id === node.id);
        if (found) {
          setSelectedPipeline(found);
          addLog(`[TOPOLOGIA] Visualizando detalhes da pipeline "${found.name}".`);
        }
      }
    },
    [currentPipelines, addLog]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)', backgroundColor: '#0d1117' }}>
      {/* BARRA SUPERIOR DE SELEÇÃO DE PROJETO & FILTROS */}
      <Box
        sx={{
          p: 2.5,
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
        {/* Seletor do Projeto Azure DevOps */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
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

          <FormControl size="small" sx={{ minWidth: 280 }}>
            <InputLabel id="project-select-label" sx={{ color: '#94a3b8' }}>
              Projeto Azure DevOps
            </InputLabel>
            <Select
              labelId="project-select-label"
              value={activeProject.id}
              label="Projeto Azure DevOps"
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setSelectedPipeline(null);
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

          {/* Repositório Git Principal Associado */}
          <Chip
            icon={<ForkRightIcon sx={{ fontSize: 16 }} />}
            label={`Repo: ${activeProject.defaultRepository || 'main.git'}`}
            size="small"
            sx={{ backgroundColor: '#18212e', color: '#38bdf8', border: '1px solid #334155' }}
          />
        </Box>

        {/* Legenda e Filtro de Schedules */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          {/* Legenda das 3 Colunas */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#818cf8' }} />
              <Typography variant="caption" sx={{ color: '#c7d2fe', fontWeight: 600 }}>
                Variable Groups ({currentVariableGroups.length})
              </Typography>
            </Box>

            <Typography sx={{ color: '#475569' }}>→</Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#38bdf8' }} />
              <Typography variant="caption" sx={{ color: '#bae6fd', fontWeight: 600 }}>
                Pipelines ({currentPipelines.length})
              </Typography>
            </Box>

            <Typography sx={{ color: '#475569' }}>→</Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#34d399' }} />
              <Typography variant="caption" sx={{ color: '#a7f3d0', fontWeight: 600 }}>
                Environments ({currentEnvironments.length})
              </Typography>
            </Box>
          </Stack>

          <Divider orientation="vertical" flexItem sx={{ borderColor: '#222d3d' }} />

          {/* Toggle de Pipelines Agendadas */}
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

      {/* ÁREA CENTRAL: O CANVAS DE TOPOLOGIA / WORKFLOW */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background color="#1e293b" gap={24} size={1.5} />
          <Controls style={{ backgroundColor: '#141c28', border: '1px solid #233145', fill: '#fff' }} />
          <MiniMap
            style={{ backgroundColor: '#101621', border: '1px solid #222d3d', borderRadius: 8 }}
            nodeColor={(n: any) => {
              if (n.type === 'variableGroup') return '#818cf8';
              if (n.type === 'pipeline') return '#38bdf8';
              return '#34d399';
            }}
          />
        </ReactFlow>

        {/* Dica no rodapé do canvas */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            p: 1.2,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            borderRadius: 2,
            border: '1px solid #334155'
          }}
        >
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            💡 <b>Dica:</b> Clique em qualquer <b>Pipeline</b> para destacar e inspecionar os Variable Groups e Ambientes conectados.
          </Typography>
        </Box>
      </Box>

      {/* GAVETA LATERAL DE DETALHES DA PIPELINE SELECIONADA */}
      <Drawer
        anchor="right"
        open={Boolean(selectedPipeline)}
        onClose={() => setSelectedPipeline(null)}
        PaperProps={{
          sx: {
            width: 440,
            backgroundColor: '#121924',
            borderLeft: '1px solid #222d3d',
            p: 3
          }
        }}
      >
        {selectedPipeline && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <AccountTreeIcon sx={{ color: '#38bdf8' }} />
                <Typography variant="h6" fontWeight={800} sx={{ color: '#fff' }}>
                  Detalhes da Pipeline
                </Typography>
              </Box>
              <IconButton size="small" onClick={() => setSelectedPipeline(null)} sx={{ color: '#94a3b8' }}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Divider sx={{ borderColor: '#222d3d', mb: 3 }} />

            <Stack spacing={2.5}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  NOME DA PIPELINE
                </Typography>
                <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#f8fafc' }}>
                  {selectedPipeline.name}
                </Typography>
              </Box>

              {/* CARD DE AGENDAMENTO (SCHEDULES) */}
              <Card
                sx={{
                  backgroundColor: selectedPipeline.schedule?.hasSchedule ? 'rgba(234, 179, 8, 0.08)' : '#18212e',
                  border: selectedPipeline.schedule?.hasSchedule ? '1px solid #ca8a04' : '1px solid #233145',
                  borderRadius: 2
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AccessTimeIcon sx={{ color: selectedPipeline.schedule?.hasSchedule ? '#facc15' : '#94a3b8', fontSize: 20 }} />
                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      sx={{ color: selectedPipeline.schedule?.hasSchedule ? '#fef08a' : '#94a3b8' }}
                    >
                      {selectedPipeline.schedule?.hasSchedule ? 'Gatilho Agendado (Schedule)' : 'Sem Agendamento'}
                    </Typography>
                  </Box>

                  {selectedPipeline.schedule?.hasSchedule ? (
                    <Box>
                      <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, mb: 0.5 }}>
                        {selectedPipeline.schedule.humanReadable}
                      </Typography>
                      <Chip
                        label={`Cron: ${selectedPipeline.schedule.cron}`}
                        size="small"
                        sx={{ fontFamily: 'monospace', backgroundColor: '#0f172a', color: '#fde047' }}
                      />
                    </Box>
                  ) : (
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Esta pipeline é acionada manualmente ou via Pull Request triggers.
                    </Typography>
                  )}
                </CardContent>
              </Card>

              {/* VARIABLE GROUPS CONECTADOS */}
              <Box>
                <Typography variant="caption" sx={{ color: '#818cf8', fontWeight: 700, display: 'block', mb: 1 }}>
                  VARIABLE GROUPS VINCULADOS ({selectedPipeline.variableGroupIds.length})
                </Typography>
                <Stack spacing={1}>
                  {selectedPipeline.variableGroupIds.map((vgId) => {
                    const vg = currentVariableGroups.find((v) => v.id === vgId);
                    return (
                      <Box
                        key={vgId}
                        sx={{
                          p: 1.5,
                          backgroundColor: '#171d2b',
                          border: '1px solid #312e81',
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <VpnKeyIcon sx={{ color: '#818cf8', fontSize: 16 }} />
                          <Typography variant="body2" fontWeight={600} sx={{ color: '#e2e8f0' }}>
                            {vg?.name || vgId}
                          </Typography>
                        </Box>
                        <Chip
                          label={`${vg?.variablesCount || 0} vars`}
                          size="small"
                          sx={{ height: 18, fontSize: '0.62rem', backgroundColor: '#312e81', color: '#c7d2fe' }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              </Box>

              {/* ENVIRONMENTS CONECTADOS */}
              <Box>
                <Typography variant="caption" sx={{ color: '#34d399', fontWeight: 700, display: 'block', mb: 1 }}>
                  AMBIENTES DE DEPLOY (ENVIRONMENTS) ({selectedPipeline.environmentIds.length})
                </Typography>
                <Stack spacing={1}>
                  {selectedPipeline.environmentIds.map((envId) => {
                    const env = currentEnvironments.find((e) => e.id === envId);
                    return (
                      <Box
                        key={envId}
                        sx={{
                          p: 1.5,
                          backgroundColor: '#171d2b',
                          border: '1px solid #065f46',
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CloudDoneIcon sx={{ color: '#34d399', fontSize: 16 }} />
                          <Typography variant="body2" fontWeight={600} sx={{ color: '#e2e8f0' }}>
                            {env?.name || envId}
                          </Typography>
                        </Box>
                        {env?.approvalsRequired && (
                          <Chip
                            label="Requer Aprovação"
                            size="small"
                            sx={{ height: 18, fontSize: '0.62rem', backgroundColor: '#064e3b', color: '#6ee7b7' }}
                          />
                        )}
                      </Box>
                    );
                  })}
                </Stack>
              </Box>

              {/* Informações de Repositório & Branch */}
              <Box sx={{ p: 1.5, backgroundColor: '#0f141d', borderRadius: 2, border: '1px solid #1e293b' }}>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                  Branch: <b style={{ color: '#cbd5e1' }}>{selectedPipeline.branch}</b>
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                  Pasta: <b style={{ color: '#cbd5e1' }}>{selectedPipeline.folder}</b>
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                  Última execução: <b style={{ color: '#cbd5e1' }}>{selectedPipeline.lastRunDate} ({selectedPipeline.duration})</b>
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}
      </Drawer>
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

