import { useState, useEffect } from 'react';
import { AppBar, Box, Toolbar, Typography, Chip, Breadcrumbs, Link } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HubIcon from '@mui/icons-material/Hub';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { RepositoriesView } from './components/RepositoriesView';
import { PatModal } from './components/PatModal';
import { useStudioStore } from './store';

export default function App() {
  const [page, setPage] = useState<'dashboard' | 'repositories'>('dashboard');
  const { settings, loadActions } = useStudioStore();

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#0d1117', overflow: 'hidden' }}>
      {/* Barra Lateral */}
      <Sidebar page={page} onPage={(p) => setPage(p as any)} />

      {/* Conteúdo Principal */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* AppBar Superior */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            backgroundColor: '#101621',
            borderBottom: '1px solid #1e293b',
            zIndex: 1
          }}
        >
          <Toolbar variant="dense" sx={{ minHeight: 48, px: 3, justifyContent: 'space-between' }}>
            <Breadcrumbs
              separator={<NavigateNextIcon fontSize="small" sx={{ color: '#64748b' }} />}
              aria-label="breadcrumb"
            >
              <Link
                underline="hover"
                color="inherit"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#94a3b8', fontSize: '0.85rem' }}
              >
                <HubIcon sx={{ fontSize: 16, color: '#0078d4' }} />
                Workspace
              </Link>
              <Typography sx={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.85rem' }}>
                {page === 'repositories'
                  ? 'Repositórios Git & Topologia (Variable Groups → Pipelines → Environments)'
                  : 'Dashboard Operacional'}
              </Typography>
            </Breadcrumbs>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Chip
                label={`Org: ${settings.organization || 'Azure DevOps'}`}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: '#233145',
                  color: '#94a3b8',
                  fontSize: '0.72rem',
                  height: 24
                }}
              />
              <Chip
                label="v2.0 Orchestrator"
                size="small"
                sx={{
                  backgroundColor: '#1e293b',
                  color: '#38bdf8',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  height: 24
                }}
              />
            </Box>
          </Toolbar>
        </AppBar>

        {/* Corpo da Página: Foco em Dashboard e Repositórios & Topologia */}
        <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {page === 'dashboard' && <Dashboard onNavigateToTopology={() => setPage('repositories')} />}
          {page === 'repositories' && <RepositoriesView />}
        </Box>
      </Box>

      {/* Pop-up Obrigatório de PAT caso não exista nas Configurações */}
      <PatModal />
    </Box>
  );
}
