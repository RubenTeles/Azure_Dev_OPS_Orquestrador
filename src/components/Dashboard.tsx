import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid2,
  Stack,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditNoteIcon from '@mui/icons-material/EditNote';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import StorageIcon from '@mui/icons-material/Storage';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SyncIcon from '@mui/icons-material/Sync';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import TerminalIcon from '@mui/icons-material/Terminal';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { useStudioStore } from '../store';
import { GetScriptModal } from './GetScriptModal';
import type { AzurePipeline, AzureProject } from '../types';

export function Dashboard({ onNavigateToTopology }: { onNavigateToTopology?: () => void }) {
  const {
    projects,
    pipelines,
    dashboard,
    settings,
    setShowPatModal,
    runGetScript,
    isExecutingGet,
    addLog,
    logs,
    exportOfflineMockFile,
    importOfflineMockFile
  } = useStudioStore();

  const [activeTab, setActiveTab] = useState(0);
  const [isGetModalOpen, setIsGetModalOpen] = useState(false);

  const handleUploadMock = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      const ok = importOfflineMockFile(text);
      if (ok) {
        addLog(`[MOCK OFFLINE] Ficheiro "${file.name}" carregado com sucesso.`);
      }
    });
  };

  const handleRunPipeline = (pipe: AzurePipeline) => {
    addLog(`[PIPELINE TRIGGER] Disparando execução manual para: "${pipe.name}" no branch "${pipe.branch}"...`);
    setTimeout(() => {
      addLog(`[PIPELINE TRIGGER] Pipeline "${pipe.name}" enfileirada no Azure DevOps com ID #${Math.floor(Math.random() * 9000 + 1000)}.`);
    }, 800);
  };

  const statCards = [
    {
      label: 'Projetos Azure',
      value: projects.length || dashboard.projects,
      sub: 'Organização Ativa',
      icon: FolderSpecialIcon,
      color: '#6366f1',
      trend: '+2 novos'
    },
    {
      label: 'Pipelines CI/CD',
      value: pipelines.length || dashboard.pipelines,
      sub: `${dashboard.activeRuns} em execução`,
      icon: AccountTreeIcon,
      color: '#06b6d4',
      trend: '92.5% sucesso'
    },
    {
      label: 'Repositórios Git',
      value: dashboard.repositories,
      sub: 'Monitorizados',
      icon: StorageIcon,
      color: '#f97316',
      trend: 'Main branches'
    },
    {
      label: 'Taxa de Sucesso',
      value: `${dashboard.successRate}%`,
      sub: 'Últimas 24 horas',
      icon: CheckCircleOutlineIcon,
      color: '#10b981',
      trend: 'Estável'
    }
  ];

  return (
    <Box sx={{ p: 4, height: 'calc(100vh - 64px)', overflowY: 'auto' }}>
      <Stack spacing={3.5}>
        {/* Header Superior com status do Azure DevOps */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            p: 3,
            backgroundColor: '#131924',
            borderRadius: 3,
            border: '1px solid #222d3d'
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h5" fontWeight={800} sx={{ color: '#fff' }}>
                Painel do Azure DevOps
              </Typography>
              {settings.pat ? (
                <Chip
                  icon={<CloudDoneIcon sx={{ fontSize: 16 }} />}
                  label={`Conectado: ${settings.organization || 'Azure DevOps'}`}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    fontWeight: 600
                  }}
                />
              ) : (
                <Chip
                  icon={<WarningAmberIcon sx={{ fontSize: 16 }} />}
                  label="PAT Requerido"
                  size="small"
                  onClick={() => setShowPatModal(true)}
                  sx={{
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    color: '#fbbf24',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                />
              )}
            </Box>
            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
              Discovery automático de pipelines e repositórios alimentado por scripts PowerShell editáveis
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<EditNoteIcon />}
              onClick={() => setIsGetModalOpen(true)}
              sx={{ borderColor: '#334155', color: '#38bdf8' }}
            >
              Editar Script de GET (PowerShell)
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={isExecutingGet ? <SyncIcon sx={{ animation: 'spin 1s linear infinite' }} /> : <RefreshIcon />}
              onClick={() => runGetScript()}
              disabled={isExecutingGet}
              sx={{
                backgroundColor: '#0078d4',
                '&:hover': { backgroundColor: '#0284c7' },
                fontWeight: 600
              }}
            >
              {isExecutingGet ? 'Sincronizando...' : 'Executar GET'}
            </Button>
            {onNavigateToTopology && (
              <Button
                variant="contained"
                size="small"
                startIcon={<StorageIcon />}
                onClick={onNavigateToTopology}
                sx={{
                  backgroundColor: '#0284c7',
                  '&:hover': { backgroundColor: '#0369a1' },
                  fontWeight: 600
                }}
              >
                Ver Topologia CI/CD
              </Button>
            )}
          </Box>
        </Box>

        {isExecutingGet && <LinearProgress sx={{ borderRadius: 1 }} />}

        {/* Estatísticas em Cartões */}
        <Grid2 container spacing={2.5}>
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Grid2 size={{ xs: 12, sm: 6, lg: 3 }} key={card.label}>
                <Card
                  sx={{
                    backgroundColor: '#141c28',
                    border: '1px solid #233145',
                    borderRadius: 2.5,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-2px)' }
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 2,
                          backgroundColor: `${card.color}18`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: card.color
                        }}
                      >
                        <Icon fontSize="medium" />
                      </Box>
                      <Chip
                        label={card.trend}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          backgroundColor: '#1f293d',
                          color: '#94a3b8'
                        }}
                      />
                    </Box>
                    <Typography variant="h4" fontWeight={800} sx={{ mt: 2, color: '#f8fafc' }}>
                      {card.value}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.3 }}>
                      {card.label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      {card.sub}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid2>
            );
          })}
        </Grid2>

        {/* Card informativo sobre o script de Discovery PowerShell */}
        <Card sx={{ backgroundColor: '#111722', border: '1px solid #1e293b', borderRadius: 2.5 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TerminalIcon sx={{ color: '#38bdf8', fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#f1f5f9' }}>
                  PowerShell Discovery Engine (GET Mock & Live)
                </Typography>
              </Box>
              <Button
                size="small"
                onClick={() => setIsGetModalOpen(true)}
                sx={{ color: '#38bdf8', textTransform: 'none' }}
              >
                Ver / Editar Script Completo →
              </Button>
            </Box>
            <Box
              sx={{
                p: 1.5,
                backgroundColor: '#0a0e14',
                borderRadius: 2,
                fontFamily: 'Consolas, monospace',
                fontSize: '0.78rem',
                color: '#7dd3fc',
                overflowX: 'auto',
                whiteSpace: 'pre'
              }}
            >
{`$projectsUrl = "https://dev.azure.com/${settings.organization || '{org}'}/_apis/projects?api-version=7.1-preview.4"
$pipelinesUrl = "https://dev.azure.com/${settings.organization || '{org}'}/${settings.project || '{proj}'}/_apis/pipelines?api-version=7.1-preview.1"
Invoke-RestMethod -Uri $projectsUrl -Headers $headers -Method Get`}
            </Box>

            {/* Ações de Gestão de Mocks Offline para Testes */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2, pt: 1.5, borderTop: '1px solid #1e293b', flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  📁 <b>Modo Offline / Testes:</b> Mocks guardados localmente em <code>config/mocks/offline-mock.json</code>
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={exportOfflineMockFile}
                  sx={{ borderColor: '#334155', color: '#cbd5e1', fontSize: '0.72rem', textTransform: 'none' }}
                >
                  Exportar Mock (JSON)
                </Button>

                <Button
                  size="small"
                  variant="outlined"
                  component="label"
                  startIcon={<FileUploadIcon />}
                  sx={{ borderColor: '#334155', color: '#cbd5e1', fontSize: '0.72rem', textTransform: 'none' }}
                >
                  Carregar Mock do Disco
                  <input hidden type="file" accept=".json" onChange={handleUploadMock} />
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Abas de Navegação (Pipelines & Projetos) */}
        <Box sx={{ borderBottom: 1, borderColor: '#222d3d' }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            sx={{
              '& .MuiTab-root': {
                color: '#94a3b8',
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.95rem'
              },
              '& .Mui-selected': { color: '#38bdf8' }
            }}
          >
            <Tab label={`Pipelines (${pipelines.length})`} />
            <Tab label={`Projetos (${projects.length})`} />
          </Tabs>
        </Box>

        {/* ABA 0: PIPELINES TABLE */}
        {activeTab === 0 && (
          <TableContainer
            component={Paper}
            sx={{
              backgroundColor: '#131924',
              border: '1px solid #222d3d',
              borderRadius: 2.5
            }}
          >
            <Table>
              <TableHead sx={{ backgroundColor: '#0f141d' }}>
                <TableRow>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.78rem' }}>PIPELINE</TableCell>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.78rem' }}>ESTADO</TableCell>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.78rem' }}>PASTA</TableCell>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.78rem' }}>BRANCH</TableCell>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.78rem' }}>DURAÇÃO</TableCell>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.78rem' }}>ÚLTIMO RUN</TableCell>
                  <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.78rem' }}>AÇÕES</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pipelines.map((pipe) => {
                  const isSuccess = pipe.result === 'succeeded';
                  const isRunning = pipe.status === 'inProgress';
                  const isFailed = pipe.result === 'failed';

                  return (
                    <TableRow
                      key={pipe.id}
                      hover
                      sx={{
                        '&:hover': { backgroundColor: '#18212e' },
                        borderColor: '#1e293b'
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: 1.5,
                              backgroundColor: '#1e293b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#38bdf8'
                            }}
                          >
                            <AccountTreeIcon sx={{ fontSize: 18 }} />
                          </Box>
                          <div>
                            <Typography variant="body2" fontWeight={700} sx={{ color: '#f1f5f9' }}>
                              {pipe.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              {pipe.repository}
                            </Typography>
                          </div>
                        </Box>
                      </TableCell>

                      <TableCell>
                        {isRunning && (
                          <Chip
                            size="small"
                            icon={<SyncIcon sx={{ animation: 'spin 1s linear infinite', fontSize: 14 }} />}
                            label="Executando"
                            sx={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 700 }}
                          />
                        )}
                        {isSuccess && (
                          <Chip
                            size="small"
                            icon={<CheckCircleOutlineIcon sx={{ fontSize: 14 }} />}
                            label="Succeeded"
                            sx={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: 700 }}
                          />
                        )}
                        {isFailed && (
                          <Chip
                            size="small"
                            icon={<ErrorOutlineIcon sx={{ fontSize: 14 }} />}
                            label="Failed"
                            sx={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontWeight: 700 }}
                          />
                        )}
                      </TableCell>

                      <TableCell sx={{ color: '#cbd5e1', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                        {pipe.folder}
                      </TableCell>

                      <TableCell sx={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                        <Chip
                          label={pipe.branch}
                          size="small"
                          sx={{ backgroundColor: '#1e293b', color: '#e2e8f0', fontSize: '0.72rem' }}
                        />
                      </TableCell>

                      <TableCell sx={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                        {pipe.duration}
                      </TableCell>

                      <TableCell sx={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                        {pipe.lastRunDate}
                      </TableCell>

                      <TableCell align="right">
                        <Tooltip title="Disparar execução">
                          <IconButton
                            size="small"
                            onClick={() => handleRunPipeline(pipe)}
                            sx={{ color: '#38bdf8', '&:hover': { backgroundColor: 'rgba(56, 189, 248, 0.1)' } }}
                          >
                            <PlayCircleFilledWhiteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* ABA 1: PROJETOS CARDS */}
        {activeTab === 1 && (
          <Grid2 container spacing={2.5}>
            {projects.map((proj) => (
              <Grid2 size={{ xs: 12, md: 6, lg: 4 }} key={proj.id}>
                <Card
                  sx={{
                    backgroundColor: '#131924',
                    border: '1px solid #222d3d',
                    borderRadius: 2.5,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    p: 1
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FolderSpecialIcon sx={{ color: '#6366f1', fontSize: 24 }} />
                        <Typography variant="h6" fontWeight={700} sx={{ color: '#f8fafc' }}>
                          {proj.name}
                        </Typography>
                      </Box>
                      <Chip
                        icon={proj.visibility === 'private' ? <LockIcon sx={{ fontSize: 12 }} /> : <PublicIcon sx={{ fontSize: 12 }} />}
                        label={proj.visibility}
                        size="small"
                        sx={{ backgroundColor: '#1e293b', color: '#94a3b8', fontSize: '0.68rem', textTransform: 'capitalize' }}
                      />
                    </Box>

                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2, minHeight: 40 }}>
                      {proj.description}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, pt: 1, borderTop: '1px solid #1e293b' }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Repositórios
                        </Typography>
                        <Typography variant="body2" fontWeight={700} sx={{ color: '#f1f5f9' }}>
                          {proj.repositoriesCount} repos
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Pipelines
                        </Typography>
                        <Typography variant="body2" fontWeight={700} sx={{ color: '#f1f5f9' }}>
                          {proj.pipelinesCount} ativas
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Atualizado
                        </Typography>
                        <Typography variant="body2" fontWeight={700} sx={{ color: '#f1f5f9' }}>
                          {proj.lastUpdateTime}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid2>
            ))}
          </Grid2>
        )}

        <Card sx={{ backgroundColor: '#0a0e14', border: '1px solid #233145', borderRadius: 2.5 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <TerminalIcon sx={{ color: '#38bdf8' }} />
              <Typography variant="h6" fontWeight={700} sx={{ color: '#f8fafc' }}>Logs de execução</Typography>
            </Box>
            <Box sx={{ maxHeight: 220, overflowY: 'auto', p: 1.5, backgroundColor: '#05080c', borderRadius: 1 }}>
              {logs.length === 0 ? <Typography sx={{ color: '#64748b', fontFamily: 'monospace' }}>Sem logs.</Typography> : logs.slice(-100).map((log, index) => (
                <Typography key={`${log}-${index}`} component="div" sx={{ color: log.includes('[ERRO]') ? '#f87171' : '#94a3b8', fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>{log}</Typography>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Stack>

      {/* Modal para editar e testar o Script de Discovery GET */}
      <GetScriptModal open={isGetModalOpen} onClose={() => setIsGetModalOpen(false)} />
    </Box>
  );
}
