import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Box, Typography, Chip, Tooltip } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import LockIcon from '@mui/icons-material/Lock';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import DnsIcon from '@mui/icons-material/Dns';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

// Nó para Variable Groups
export const VariableGroupNode = memo(({ data, selected }: NodeProps<any>) => {
  return (
    <Box
      sx={{
        width: 250,
        backgroundColor: '#16192b',
        border: selected ? '2px solid #818cf8' : '1px solid #3730a3',
        borderRadius: 2.5,
        p: 1.8,
        boxShadow: selected ? '0 0 16px rgba(129, 140, 248, 0.4)' : '0 4px 14px rgba(0,0,0,0.4)',
        cursor: 'pointer',
        transition: 'all 0.2s'
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
        <Chip
          label={`${data.variablesCount} vars`}
          size="small"
          sx={{ height: 18, fontSize: '0.62rem', backgroundColor: '#1e1b4b', color: '#a5b4fc' }}
        />
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
        style={{
          background: '#818cf8',
          width: 12,
          height: 12,
          border: '2px solid #0d1117',
          right: -6
        }}
      />
    </Box>
  );
});

// Nó para Pipelines (com relógio para agendamento)
export const PipelineTopologyNode = memo(({ data, selected }: NodeProps<any>) => {
  const hasSchedule = Boolean(data.schedule?.hasSchedule);

  return (
    <Box
      sx={{
        width: 290,
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
        cursor: 'pointer',
        transition: 'all 0.2s',
        position: 'relative'
      }}
    >
      {/* Handle de entrada (vindo dos Variable Groups) */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#818cf8',
          width: 12,
          height: 12,
          border: '2px solid #0d1117',
          left: -6
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

        {/* ÍCONE DE RELÓGIO EM DESTAQUE SE TIVER SCHEDULE */}
        {hasSchedule ? (
          <Tooltip title={`Agendado: ${data.schedule?.humanReadable || data.schedule?.cron || 'Cron Schedule'}`} arrow>
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
            label="Manual / PR"
            size="small"
            sx={{ height: 18, fontSize: '0.62rem', backgroundColor: '#1e293b', color: '#94a3b8' }}
          />
        )}
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

      {/* Detalhe do Schedule Cron se ativo */}
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

      {/* Handle de saída para os Environments */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#34d399',
          width: 12,
          height: 12,
          border: '2px solid #0d1117',
          right: -6
        }}
      />
    </Box>
  );
});

// Nó para Environments
export const EnvironmentNode = memo(({ data, selected }: NodeProps<any>) => {
  const isProd = data.label.toLowerCase().includes('prod');

  return (
    <Box
      sx={{
        width: 250,
        backgroundColor: '#12231e',
        border: selected
          ? '2px solid #34d399'
          : isProd
          ? '1.5px solid #059669'
          : '1px solid #14532d',
        borderRadius: 2.5,
        p: 1.8,
        boxShadow: selected ? '0 0 16px rgba(52, 211, 153, 0.4)' : '0 4px 14px rgba(0,0,0,0.4)',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
    >
      {/* Handle de entrada (vindo das Pipelines) */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#34d399',
          width: 12,
          height: 12,
          border: '2px solid #0d1117',
          left: -6
        }}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1.5,
              backgroundColor: 'rgba(52, 211, 153, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399'
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
              backgroundColor: isProd ? 'rgba(239, 68, 68, 0.2)' : 'rgba(52, 211, 153, 0.2)',
              color: isProd ? '#fca5a5' : '#a7f3d0',
              fontWeight: 700
            }}
          />
        </Box>

        {data.approvalsRequired && (
          <Tooltip title="Exige Aprovação Manual (Approval Gate)" arrow>
            <VerifiedUserIcon sx={{ color: '#38bdf8', fontSize: 18 }} />
          </Tooltip>
        )}
      </Box>

      <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#f8fafc' }}>
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
    </Box>
  );
});

