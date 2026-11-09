import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  IconButton,
  InputAdornment,
  Divider,
  Stack
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import KeyIcon from '@mui/icons-material/VpnKey';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useStudioStore } from '../store';

export function PatModal() {
  const { settings, setSettings, showPatModal, setShowPatModal, runGetScript } = useStudioStore();

  const [org, setOrg] = useState(settings.organization || 'contoso-devops');
  const [project, setProject] = useState(settings.project || 'Enterprise-Core-Banking');
  const [pat, setPat] = useState(settings.pat || '');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleFillDemo = () => {
    setOrg('contoso-cloud');
    setProject('Enterprise-Core-Banking');
    setPat('mock_pat_9a8b7c6d5e4f3a2b1c0d_demo_azure_devops');
    setError('');
  };

  const handleSaveAndRunGet = async () => {
    if (!pat.trim()) {
      setError('Por favor insira um Personal Access Token (PAT) ou utilize a demonstração.');
      return;
    }

    setSettings({
      organization: org.trim(),
      project: project.trim(),
      pat: pat.trim(),
      isConnected: true
    });

    setShowPatModal(false);

    // Executa o primeiro GET imediatamente para popular o Dashboard
    await runGetScript();
  };

  return (
    <Dialog
      open={showPatModal}
      onClose={() => {
        // Se já tiver PAT, permite fechar; se não, incentiva a adicionar ou usar mock
        if (settings.pat) setShowPatModal(false);
      }}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#151c27',
          border: '1px solid #2e3c50',
          borderRadius: 3,
          boxShadow: '0 20px 40px rgba(0,0,0,0.7)'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1, pt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              backgroundColor: 'rgba(0, 120, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0078d4'
            }}
          >
            <KeyIcon />
          </Box>
          <div>
            <Typography variant="h6" fontWeight={800} sx={{ color: '#fff' }}>
              Configuração Azure DevOps
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Adicione o seu Personal Access Token (PAT) para efetuar o primeiro GET
            </Typography>
          </div>
        </Box>
      </DialogTitle>

      <Divider sx={{ borderColor: '#243042' }} />

      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={2.5}>
          <Alert severity="info" sx={{ backgroundColor: 'rgba(2, 132, 199, 0.12)', color: '#bae6fd', border: '1px solid rgba(2, 132, 199, 0.3)' }}>
            Nenhum PAT foi detectado. Para consultar os projetos e pipelines no Dashboard, configure as credenciais abaixo ou use o botão de Demonstração.
          </Alert>

          {error && (
            <Alert severity="error" sx={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#fca5a5' }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Organização Azure DevOps"
            placeholder="ex: contoso ou https://dev.azure.com/contoso"
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            fullWidth
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CloudQueueIcon sx={{ color: '#64748b', fontSize: 20 }} />
                </InputAdornment>
              )
            }}
          />

          <TextField
            label="Projeto Padrão"
            placeholder="ex: Enterprise-Core-Banking"
            value={project}
            onChange={(e) => setProject(e.target.value)}
            fullWidth
            size="small"
          />

          <TextField
            label="Personal Access Token (PAT)"
            placeholder="Cole o seu PAT aqui (ex: vts-xxx...)"
            value={pat}
            onChange={(e) => {
              setPat(e.target.value);
              if (error) setError('');
            }}
            type={showPassword ? 'text' : 'password'}
            fullWidth
            size="small"
            helperText="Requer permissões de Leitura de Projetos e Pipelines (ou Full Access)."
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                    {showPassword ? <VisibilityOff sx={{ color: '#94a3b8' }} /> : <Visibility sx={{ color: '#94a3b8' }} />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <Box sx={{ p: 1.5, backgroundColor: '#0d131b', borderRadius: 2, border: '1px dashed #334155' }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1 }}>
              💡 Dica rápida para testes:
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AutoFixHighIcon />}
              onClick={handleFillDemo}
              sx={{ color: '#38bdf8', borderColor: '#0284c7' }}
            >
              Preencher com Token de Demonstração (Mock)
            </Button>
          </Box>
        </Stack>
      </DialogContent>

      <Divider sx={{ borderColor: '#243042' }} />

      <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
        {settings.pat ? (
          <Button onClick={() => setShowPatModal(false)} sx={{ color: '#94a3b8' }}>
            Cancelar
          </Button>
        ) : (
          <Box />
        )}
        <Button
          variant="contained"
          startIcon={<PlayArrowIcon />}
          onClick={handleSaveAndRunGet}
          sx={{
            backgroundColor: '#0078d4',
            '&:hover': { backgroundColor: '#0284c7' },
            fontWeight: 700,
            px: 3
          }}
        >
          Salvar e Executar Primeiro GET
        </Button>
      </DialogActions>
    </Dialog>
  );
}

