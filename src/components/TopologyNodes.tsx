import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Box, Typography, Chip, Tooltip, IconButton } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import LockIcon from '@mui/icons-material/Lock';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import DnsIcon from '@mui/icons-material/Dns';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';

// 1. Nó para Variable Groups
export const VariableGroupNode = memo(({ data, selected }: NodeProps<any>) => {
  const handleOpenAzure = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.azureUrl) {
      window.open(data.azureUrl, '_blank');
    }
  };

  return (
    <Box
      sx={{
        width: 260,
        backgroundColor: '#16192b',
        border: selected ? '2px solid #818cf8' : '1px solid #3730a3',
        borderRadius: 2.5,
        p: 1.8,
        boxShadow: selected ? '0 0 18px rgba(129, 140, 248, 0.45)' : '0 4px 14px rgba(0,0,0,0.4)',
        cursor: 'grab',
        transition: 'all 0.2s',
        '&:active': { cursor: 'grabbing' }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1.5,
              backgroundColor: 'rgba(99, 102, 241, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8'
            }}
          >
            {data.isSecret ? <LockIcon sx={{ fontSize: 16 }} /> : <VpnKeyIcon sx={{ fontSize: 16 }} />}
          </Box>
          <Chip
            label="Variable Group"
            size="small"
            sx={{ height: 20, fontSize: '0.65rem', backgroundColor: '#312e81', color: '#c7d2fe', fontWeight: 700 }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {data.azureUrl && (
            <Tooltip title="Abrir no Azure DevOps" arrow>
              <IconButton size="small" onClick={handleOpenAzure} sx={{ color: '#818cf8', p: 0.4 }}>
                <OpenInNewIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          )}
          <Chip
            label={`${data.variablesCount || 0} vars`}
            size="small"
            sx={{ height: 18, fontSize: '0.62rem', backgroundColor: '#1e1b4b', color: '#a5b4fc' }}
          />
        </Box>
      </Box>

      <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#f8fafc', wordBreak: 'break-all' }}>
        {data.label}
      </Typography>

      {data.description && (
        <Typography
          variant="caption"
          sx={{
            color: '#94a3b8',
            fontSize: '0.7rem',
            mt: 0.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {data.description}
        </Typography>
      )}

      {/* Handle de saída para as Pipelines */}
      <Handle
        type="source"
        position={Position.Right}
        id="vg-output"
        style={{
          background: '#818cf8',
          width: 14,
          height: 14,
          border: '2px solid #0d1117',
          right: -7
        }}
      />
    </Box>
  );
});

// 2. Nó para Pipelines (com relógio para agendamento, notas de agente e botão Azure)
export const PipelineTopologyNode = memo(({ data, selected }: NodeProps<any>) => {
  const hasSchedule = Boolean(data.schedule?.hasSchedule);

  const handleOpenAzure = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.azureUrl) {
      window.open(data.azureUrl, '_blank');
    }
  };

  return (
    <Box
      sx={{
        width: 300,
        backgroundColor: '#121e2d',
        border: selected
          ? '2px solid #38bdf8'
          : hasSchedule
          ? '1.5px solid #0284c7'
          : '1px solid #1e3a5f',
        borderRadius: 2.5,
        p: 1.8,
        boxShadow: selected
          ? '0 0 18px rgba(56, 189, 248, 0.45)'
          : hasSchedule
          ? '0 0 14px rgba(2, 132, 199, 0.25)'
          : '0 4px 14px rgba(0,0,0,0.4)',
        cursor: 'grab',
        transition: 'all 0.2s',
        position: 'relative',
        '&:active': { cursor: 'grabbing' }
      }}
    >
      {/* Handle de entrada (vindo dos Variable Groups) */}
      <Handle
        type="target"
        position={Position.Left}
        id="pipe-input"
        style={{
          background: '#818cf8',
          width: 14,
          height: 14,
          border: '2px solid #0d1117',
          left: -7
        }}
      />

      {/* Header do Nó */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1.5,
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}
          >
            <AccountTreeIcon sx={{ fontSize: 16 }} />
          </Box>
          <Chip
            label="Pipeline"
            size="small"
            sx={{ height: 20, fontSize: '0.65rem', backgroundColor: '#0c4a6e', color: '#bae6fd', fontWeight: 700 }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Botão para abrir no Azure DevOps */}
          {data.azureUrl && (
            <Tooltip title="Abrir no Azure DevOps" arrow>
              <IconButton size="small" onClick={handleOpenAzure} sx={{ color: '#38bdf8', p: 0.4 }}>
                <OpenInNewIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          )}

          {/* ÍCONE DE RELÓGIO EM DESTAQUE SE TIVER SCHEDULE */}
          {hasSchedule ? (
            <Tooltip title={`Agendado: ${data.schedule?.humanReadable || data.schedule?.cron}`} arrow>
              <Chip
                icon={<AccessTimeIcon sx={{ fontSize: 14, color: '#facc15 !important' }} />}
                label="Agendada"
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  backgroundColor: 'rgba(234, 179, 8, 0.2)',
                  color: '#fef08a',
                  border: '1px solid #eab308'
                }}
              />
            </Tooltip>
          ) : (
            <Chip
              label="Manual/PR"
              size="small"
              sx={{ height: 18, fontSize: '0.62rem', backgroundColor: '#1e293b', color: '#94a3b8' }}
            />
          )}
        </Box>
      </Box>

      <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#f8fafc', lineHeight: 1.3 }}>
        {data.label}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.8 }}>
        <Chip
          label={data.branch || 'main'}
          size="small"
          sx={{ height: 18, fontSize: '0.62rem', backgroundColor: '#0f172a', color: '#94a3b8' }}
        />
        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem' }}>
          {data.folder || '\\'}
        </Typography>
      </Box>

      {/* Schedule Box */}
      {hasSchedule && (
        <Box
          sx={{
            mt: 1.2,
            p: 0.8,
            backgroundColor: 'rgba(234, 179, 8, 0.08)',
            border: '1px dashed rgba(234, 179, 8, 0.4)',
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 0.8
          }}
        >
          <AccessTimeIcon sx={{ color: '#facc15', fontSize: 15 }} />
          <Typography variant="caption" sx={{ color: '#fef08a', fontSize: '0.68rem', fontWeight: 600 }}>
            {data.schedule?.humanReadable || data.schedule?.cron}
          </Typography>
        </Box>
      )}

      {/* Agent & Variables Preview */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.2, pt: 1, borderTop: '1px solid #1e293b' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
          <SupportAgentIcon sx={{ fontSize: 15, color: '#38bdf8' }} />
          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem' }}>
            {data.agent?.agentName?.split(' ')[0] || 'Agente'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
          <ViewStreamIcon sx={{ fontSize: 15, color: '#a78bfa' }} />
          <Typography variant="caption" sx={{ color: '#cbd5e1', fontSize: '0.68rem' }}>
            {data.variables?.length || 0} vars
          </Typography>
        </Box>
      </Box>

      {/* Handle de saída para os Environments */}
      <Handle
        type="source"
        position={Position.Right}
        id="pipe-output"
        style={{
          background: '#34d399',
          width: 14,
          height: 14,
          border: '2px solid #0d1117',
          right: -7
        }}
      />
    </Box>
  );
});

// 3. Nó para Environments (com cor customizada de título e botão Azure)
export const EnvironmentNode = memo(({ data, selected }: NodeProps<any>) => {
  const isProd = data.label.toLowerCase().includes('prod');
  const customColor = data.titleColor || (isProd ? '#ef4444' : '#10b981');

  const handleOpenAzure = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.azureUrl) {
      window.open(data.azureUrl, '_blank');
    }
  };

  return (
    <Box
      sx={{
        width: 260,
        backgroundColor: '#12231e',
        border: selected
          ? `2px solid ${customColor}`
          : `1px solid ${customColor}66`,
        borderRadius: 2.5,
        p: 1.8,
        boxShadow: selected ? `0 0 16px ${customColor}66` : '0 4px 14px rgba(0,0,0,0.4)',
        cursor: 'grab',
        transition: 'all 0.2s',
        '&:active': { cursor: 'grabbing' }
      }}
    >
      {/* Handle de entrada (vindo das Pipelines) */}
      <Handle
        type="target"
        position={Position.Left}
        id="env-input"
        style={{
          background: customColor,
          width: 14,
          height: 14,
          border: '2px solid #0d1117',
          left: -7
        }}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1.5,
              backgroundColor: `${customColor}22`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: customColor
            }}
          >
            {isProd ? <DnsIcon sx={{ fontSize: 16 }} /> : <CloudDoneIcon sx={{ fontSize: 16 }} />}
          </Box>
          <Chip
            label={isProd ? 'Production' : 'Environment'}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.65rem',
              backgroundColor: `${customColor}22`,
              color: customColor,
              fontWeight: 700,
              border: `1px solid ${customColor}44`
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {data.azureUrl && (
            <Tooltip title="Abrir no Azure DevOps" arrow>
              <IconButton size="small" onClick={handleOpenAzure} sx={{ color: customColor, p: 0.4 }}>
                <OpenInNewIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          )}

          {data.approvalsRequired && (
            <Tooltip title="Exige Aprovação Manual (Approval Gate)" arrow>
              <VerifiedUserIcon sx={{ color: '#38bdf8', fontSize: 18 }} />
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Título com a cor customizada */}
      <Typography variant="subtitle2" fontWeight={800} sx={{ color: customColor, mb: 0.5 }}>
        {data.label}
      </Typography>

      {data.description && (
        <Typography
          variant="caption"
          sx={{
            color: '#94a3b8',
            fontSize: '0.7rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {data.description}
        </Typography>
      )}
    </Box>
  );
});

// 4. Nó de Grupo / Container (GroupContainerNode)
export const GroupContainerNode = memo(({ data }: NodeProps<any>) => {
  const group = data.groupData;
  const color = group?.color || '#0284c7';

  return (
    <Box
      sx={{
        width: 1100,
        minHeight: 280,
        backgroundColor: `${color}08`,
        border: `2px dashed ${color}55`,
        borderRadius: 4,
        p: 2,
        pointerEvents: 'none',
        position: 'relative'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pointerEvents: 'auto' }}>
        <Box
          sx={{
            px: 1.5,
            py: 0.4,
            backgroundColor: `${color}22`,
            border: `1px solid ${color}66`,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <FolderSpecialIcon sx={{ color, fontSize: 18 }} />
          <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#fff' }}>
            {group?.name || data.label}
          </Typography>
          {group?.repository && (
            <Chip
              label={`Repo: ${group.repository}`}
              size="small"
              sx={{ height: 18, fontSize: '0.62rem', backgroundColor: `${color}33`, color: '#e2e8f0' }}
            />
          )}
        </Box>
      </Box>

      {group?.description && (
        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.5, ml: 1 }}>
          {group.description}
        </Typography>
      )}
    </Box>
  );
});
