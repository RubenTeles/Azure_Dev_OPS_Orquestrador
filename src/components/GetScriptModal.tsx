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
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import TerminalIcon from '@mui/icons-material/Terminal';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useStudioStore } from '../store';
import { DEFAULT_GET_POWERSHELL_SCRIPT } from '../mockData';

export function GetScriptModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, setSettings, runGetScript, isExecutingGet } = useStudioStore();
  const [script, setScript] = useState(settings.customGetScript || DEFAULT_GET_POWERSHELL_SCRIPT);

  const handleReset = () => {
    setScript(DEFAULT_GET_POWERSHELL_SCRIPT);
  };

  const handleSaveAndExecute = async () => {
    setSettings({ customGetScript: script });
    await runGetScript(script);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#131922',
          border: '1px solid #283548',
          borderRadius: 3
        }
      }}
    >
      <DialogTitle sx={{ pb: 1, pt: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
              <TerminalIcon />
            </Box>
            <div>
              <Typography variant="h6" fontWeight={800} sx={{ color: '#fff' }}>
                Editar Script de Discovery (GET PowerShell)
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Script executado pelo Dashboard para carregar projetos e pipelines da Azure DevOps API
              </Typography>
            </div>
          </Box>
          <Button
            size="small"
            startIcon={<RestartAltIcon />}
            onClick={handleReset}
            sx={{ color: '#94a3b8' }}
          >
            Restaurar Padrão
          </Button>
        </Box>
      </DialogTitle>

      <Divider sx={{ borderColor: '#222d3d' }} />

      <DialogContent sx={{ pt: 2.5 }}>
        <Alert severity="info" sx={{ mb: 2, backgroundColor: '#0f172a', color: '#93c5fd' }}>
          As variáveis <code>{'{ORGANIZATION}'}</code>, <code>{'{PROJECT}'}</code> e <code>{'{PAT}'}</code> serão preenchidas automaticamente a partir das Configurações salvas.
        </Alert>

        <TextField
          multiline
          minRows={14}
          maxRows={20}
          fullWidth
          value={script}
          onChange={(e) => setScript(e.target.value)}
          sx={{
            backgroundColor: '#0a0e14',
            borderRadius: 2,
            '& .MuiInputBase-input': {
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: '0.85rem',
              color: '#38bdf8',
              lineHeight: 1.5
            }
          }}
        />
      </DialogContent>

      <Divider sx={{ borderColor: '#222d3d' }} />

      <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
        <Button onClick={onClose} sx={{ color: '#94a3b8' }}>
          Cancelar
        </Button>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setSettings({ customGetScript: script });
              onClose();
            }}
            sx={{ borderColor: '#334155', color: '#e2e8f0' }}
          >
            Apenas Salvar
          </Button>
          <Button
            variant="contained"
            startIcon={isExecutingGet ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
            onClick={handleSaveAndExecute}
            disabled={isExecutingGet}
            sx={{
              backgroundColor: '#0078d4',
              '&:hover': { backgroundColor: '#0284c7' },
              fontWeight: 700
            }}
          >
            {isExecutingGet ? 'Executando...' : 'Salvar & Executar GET'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

