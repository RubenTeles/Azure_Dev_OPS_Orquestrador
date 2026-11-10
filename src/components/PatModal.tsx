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
  Stack,
  FormControlLabel, Checkbox, CircularProgress
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import KeyIcon from '@mui/icons-material/VpnKey';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useStudioStore } from '../store';

export function PatModal() {
  const { settings, setSettings, showPatModal, setShowPatModal, runGetScript, mapProjectResources, projects, isExecutingGet } = useStudioStore();

  const [org, setOrg] = useState(settings.organization || 'contoso-devops');
  const [pat, setPat] = useState(settings.pat || '');
  const [step, setStep] = useState(settings.pat || settings.isConnected ? 2 : 1);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSaveAndRunGet = async () => {
    if (!pat.trim()) {
      setError('Por favor insira um Personal Access Token (PAT).');
      return;
    }

    setSettings({
      organization: org.trim(),
      pat: pat.trim(),
      authMode: 'Pat',
      isConnected: true
    });

    try {
      await runGetScript();
      setStep(2);
      setError('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Falha ao executar o script PowerShell.');
    }
  };

  const handleMap = async () => {
    if (!selectedProjects.length) { setError('Selecione pelo menos um projeto.'); return; }
    try {
      await mapProjectResources(selectedProjects);
      setShowPatModal(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Falha ao mapear os recursos.');
    }
  };

  return (
    <Dialog
      open={showPatModal}
      onClose={() => {
        // Se já tiver PAT, permite fechar; se não, incentiva a adicionar ou usar mock
        if (settings.isConnected) setShowPatModal(false);
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
              Recolha os dados em passos, sempre através de scripts PowerShell do projeto
            </Typography>
          </div>
        </Box>
      </DialogTitle>

      <Divider sx={{ borderColor: '#243042' }} />

      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={2.5}>
          <Alert severity="info" sx={{ backgroundColor: 'rgba(2, 132, 199, 0.12)', color: '#bae6fd', border: '1px solid rgba(2, 132, 199, 0.3)' }}>
            Passo {step} de 3 — {step === 1 ? 'Autenticação e organização' : step === 2 ? 'Projetos encontrados' : 'Mapear recursos'}
          </Alert>

          {error && (
            <Alert severity="error" sx={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#fca5a5' }}>
              {error}
            </Alert>
          )}

          {step === 1 && <>
          <Alert severity="info">A autenticação desta aplicação é feita exclusivamente através de um Personal Access Token (PAT).</Alert>
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

          </>}
          {step === 2 && <Stack spacing={1}>
            <Typography sx={{ color: '#cbd5e1' }}>Passo 2: o script devolveu estes projetos:</Typography>
            {projects.map((project) => <FormControlLabel key={project.id} control={<Checkbox checked={selectedProjects.includes(project.id)} onChange={(event) => setSelectedProjects((current) => event.target.checked ? [...current, project.id] : current.filter((id) => id !== project.id))} />} label={`${project.name} (${project.id})`} />)}
          </Stack>}
          {step === 3 && <Alert severity="success">Selecione os projetos no passo anterior e execute o script de mapeamento para obter pipelines, environments e variable groups.</Alert>}
        </Stack>
      </DialogContent>

      <Divider sx={{ borderColor: '#243042' }} />

      <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
        {step > 1 ? (
          <Button onClick={() => setShowPatModal(false)} sx={{ color: '#94a3b8' }}>
            Cancelar
          </Button>
        ) : (
          <Box />
        )}
        <Button
          variant="contained"
          startIcon={<PlayArrowIcon />}
          onClick={step === 1 ? handleSaveAndRunGet : handleMap}
          disabled={isExecutingGet}
          sx={{
            backgroundColor: '#0078d4',
            '&:hover': { backgroundColor: '#0284c7' },
            fontWeight: 700,
            px: 3
          }}
          >
          {isExecutingGet ? <CircularProgress size={18} color="inherit" /> : null}
          {step === 1 ? 'Executar Passo 2 — Obter Projetos' : 'Executar Passo 3 — Mapear Recursos'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

