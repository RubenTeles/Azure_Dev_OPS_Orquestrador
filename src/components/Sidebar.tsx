import {
  Box,
  Button,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import StorageIcon from '@mui/icons-material/Storage';
import SettingsIcon from '@mui/icons-material/Settings';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import HubIcon from '@mui/icons-material/Hub';
import { useStudioStore } from '../store';

const menu = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
  { id: 'repositories', label: 'Repositórios & Topologia', icon: StorageIcon },
  { id: 'settings', label: 'Configurações / PAT', icon: SettingsIcon }
];

export function Sidebar({ page, onPage }: { page: string; onPage: (p: string) => void }) {
  const { settings, setShowPatModal, pipelines } = useStudioStore();

  const handleMenuClick = (id: string) => {
    if (id === 'settings') {
      setShowPatModal(true);
    } else {
      onPage(id);
    }
  };

  return (
    <Box
      className="sidebar"
      sx={{
        width: 260,
        backgroundColor: '#101621',
        borderRight: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100vh',
        zIndex: 10
      }}
    >
      <Box>
        {/* Logo / Header */}
        <Box sx={{ p: 2.8, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              backgroundColor: '#0078d4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(0, 120, 212, 0.4)'
            }}
          >
            <HubIcon />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#fff', lineHeight: 1.2 }}>
              DevOps Studio
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
              Azure Orchestrator v2.0
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ borderColor: '#1e293b' }} />

        {/* Menu Items */}
        <List sx={{ p: 1.5 }}>
          {menu.map(({ id, label, icon: Icon }) => {
            const isSelected = page === id;
            return (
              <ListItemButton
                key={id}
                selected={isSelected}
                onClick={() => handleMenuClick(id)}
                sx={{
                  borderRadius: 2,
                  mb: 0.8,
                  py: 1.2,
                  color: isSelected ? '#38bdf8' : '#94a3b8',
                  backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.12) !important' : 'transparent',
                  border: isSelected ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid transparent',
                  '&:hover': {
                    backgroundColor: '#17202d',
                    color: '#f8fafc'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: isSelected ? '#38bdf8' : '#64748b' }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{
                    fontSize: '0.85rem',
                    fontWeight: isSelected ? 700 : 500
                  }}
                />
                {id === 'repositories' && (
                  <Chip
                    label="Graph"
                    size="small"
                    sx={{ height: 18, fontSize: '0.62rem', backgroundColor: '#0284c733', color: '#38bdf8', fontWeight: 700 }}
                  />
                )}
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      {/* Footer com Status da Ligação Azure DevOps */}
      <Box sx={{ p: 2, borderTop: '1px solid #1e293b' }}>
        <Box sx={{ p: 1.8, backgroundColor: '#141c28', borderRadius: 2, border: '1px solid #233145' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            {settings.pat ? (
              <CloudDoneIcon sx={{ color: '#10b981', fontSize: 18 }} />
            ) : (
              <WarningAmberIcon sx={{ color: '#f59e0b', fontSize: 18 }} />
            )}
            <Typography variant="caption" fontWeight={700} sx={{ color: settings.pat ? '#34d399' : '#fbbf24' }}>
              {settings.pat ? 'Azure DevOps Ligado' : 'PAT Não Configurado'}
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5, fontSize: '0.68rem' }}>
            {settings.organization ? `Org: ${settings.organization}` : 'Nenhuma organização'}
          </Typography>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            onClick={() => setShowPatModal(true)}
            sx={{
              borderColor: '#334155',
              color: '#94a3b8',
              fontSize: '0.72rem',
              py: 0.5,
              '&:hover': { borderColor: '#38bdf8', color: '#38bdf8' }
            }}
          >
            {settings.pat ? 'Alterar PAT / Config' : 'Configurar PAT'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
