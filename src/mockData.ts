import type { AzureProject, AzurePipeline, DashboardData, VariableGroup, Environment } from './types';

export const DEFAULT_GET_POWERSHELL_SCRIPT = `# Azure DevOps Discovery Script (Projects & Pipelines)
# Permite inspecionar a organizacao e recuperar as listas de pipelines e repositorios
param (
    [string]$Organization = "{ORGANIZATION}",
    [string]$Project = "{PROJECT}",
    [string]$Pat = "{PAT}"
)

# 1. Preparar Headers com autenticacao HTTP Basic
$base64Auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":$Pat"))
$headers = @{
    Authorization  = "Basic $base64Auth"
    "Content-Type" = "application/json"
}

Write-Host ">>> Iniciando Discovery no Azure DevOps: $Organization" -ForegroundColor Cyan

# 2. Obter Lista de Projetos
$projectsUrl = "https://dev.azure.com/$Organization/_apis/projects?api-version=7.1-preview.4"
Write-Host "GET $projectsUrl" -ForegroundColor Yellow
# $projectsResponse = Invoke-RestMethod -Uri $projectsUrl -Headers $headers -Method Get

# 3. Obter Lista de Pipelines
$pipelinesUrl = "https://dev.azure.com/$Organization/$Project/_apis/pipelines?api-version=7.1-preview.1"
Write-Host "GET $pipelinesUrl" -ForegroundColor Yellow
# $pipelinesResponse = Invoke-RestMethod -Uri $pipelinesUrl -Headers $headers -Method Get

Write-Host ">>> Discovery concluido com sucesso! Projetos e Pipelines sincronizados." -ForegroundColor Green
`;

export const DEFAULT_POST_POWERSHELL_SCRIPT = `# Azure DevOps Pipeline Batch Creator (POST)
# Recebe uma lista em formato JSON ($BodyJson) do template e envia como body para a API
param (
    [string]$Organization = "{ORGANIZATION}",
    [string]$Project = "{PROJECT}",
    [string]$Pat = "{PAT}",
    [string]$BodyJson = "$body"
)

$base64Auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":$Pat"))
$headers = @{
    Authorization  = "Basic $base64Auth"
    "Content-Type" = "application/json"
}

Write-Host ">>> Iniciando criacao de Pipelines via POST..." -ForegroundColor Cyan

# Valida se a chave $BodyJson contem dados validos
if ([string]::IsNullOrWhiteSpace($BodyJson)) {
    throw "O body do template JSON esta vazio ou nao foi fornecido na chave $BodyJson"
}

$pipelineList = $BodyJson | ConvertFrom-Json
Write-Host "Lendo lote de $( $pipelineList.Count ) definicoes do template JSON..." -ForegroundColor Green

foreach ($item in $pipelineList) {
    $pipelineName = $item.name
    $folderPath   = $item.folder
    $yamlPath     = $item.configuration.path
    $repoName     = $item.configuration.repository.id

    Write-Host "Configurando pipeline: '$pipelineName' na pasta '$folderPath'..." -ForegroundColor Yellow

    $bodyPayload = @{
        name   = $pipelineName
        folder = $folderPath
        configuration = @{
            type       = "yaml"
            path       = $yamlPath
            repository = @{
                id   = $repoName
                type = "azureReposGit"
            }
        }
    } | ConvertTo-Json -Depth 5

    $targetUrl = "https://dev.azure.com/$Organization/$Project/_apis/pipelines?api-version=7.1-preview.1"
    Write-Host "POST $targetUrl" -ForegroundColor Gray
    
    # Execucao do REST Method:
    # $response = Invoke-RestMethod -Uri $targetUrl -Headers $headers -Method Post -Body $bodyPayload
    Write-Host "[OK] Pipeline '$pipelineName' registado com sucesso!" -ForegroundColor Green
}

Write-Host ">>> Lote de pipelines criado com exito no Azure DevOps!" -ForegroundColor Cyan
`;

export const DEFAULT_TEMPLATE_JSON = JSON.stringify(
  [
    {
      name: "Pipeline-Core-Banking-CI",
      folder: "\\Deployments\\Core",
      configuration: {
        type: "yaml",
        path: "/azure-pipelines-core.yml",
        repository: {
          id: "repo-core-banking",
          type: "azureReposGit"
        }
      }
    },
    {
      name: "Pipeline-Payments-Gateway",
      folder: "\\Deployments\\Payments",
      configuration: {
        type: "yaml",
        path: "/azure-pipelines-payments.yml",
        repository: {
          id: "repo-payments-gateway",
          type: "azureReposGit"
        }
      }
    },
    {
      name: "Pipeline-Portal-Web-Production",
      folder: "\\Deployments\\Web",
      configuration: {
        type: "yaml",
        path: "/azure-pipelines-web.yml",
        repository: {
          id: "repo-customer-portal",
          type: "azureReposGit"
        }
      }
    }
  ],
  null,
  2
);

export const MOCK_PROJECTS: AzureProject[] = [
  {
    id: "proj-001",
    name: "Enterprise-Core-Banking",
    description: "Serviços centrais de contabilidade, transações e liquidações bancárias em tempo real.",
    visibility: "private",
    state: "wellFormed",
    url: "https://dev.azure.com/contoso/Enterprise-Core-Banking",
    lastUpdateTime: "Há 12 minutos",
    repositoriesCount: 6,
    pipelinesCount: 4,
    defaultRepository: "core-banking-services.git"
  },
  {
    id: "proj-002",
    name: "Digital-Payments-Gateway",
    description: "Gateway de pagamentos integrando redes Multibanco, MB WAY, SEPA e Cartões de Crédito.",
    visibility: "private",
    state: "wellFormed",
    url: "https://dev.azure.com/contoso/Digital-Payments-Gateway",
    lastUpdateTime: "Há 1 hora",
    repositoriesCount: 4,
    pipelinesCount: 3,
    defaultRepository: "payments-gateway-engine.git"
  },
  {
    id: "proj-003",
    name: "Customer-Portal-Omnichannel",
    description: "Aplicações Web e Mobile de homebanking para clientes particulares e corporativos.",
    visibility: "private",
    state: "wellFormed",
    url: "https://dev.azure.com/contoso/Customer-Portal-Omnichannel",
    lastUpdateTime: "Há 3 horas",
    repositoriesCount: 5,
    pipelinesCount: 3,
    defaultRepository: "customer-portal-frontend.git"
  },
  {
    id: "proj-004",
    name: "Cloud-Infrastructure-IaC",
    description: "Módulos de Terraform e Bicep para provisionamento automático de infraestrutura no Azure.",
    visibility: "private",
    state: "wellFormed",
    url: "https://dev.azure.com/contoso/Cloud-Infrastructure-IaC",
    lastUpdateTime: "Ontem",
    repositoriesCount: 3,
    pipelinesCount: 2,
    defaultRepository: "azure-iac-terraform.git"
  }
];

export const MOCK_VARIABLE_GROUPS: Record<string, VariableGroup[]> = {
  "proj-001": [
    {
      id: "vg-core-secrets",
      name: "vg-core-banking-secrets",
      description: "Chaves de encriptação AES-256 e tokens de autorização bancária",
      variablesCount: 14,
      isSecret: true
    },
    {
      id: "vg-core-db-config",
      name: "vg-core-sql-connection",
      description: "Strings de conexão SQL Server e pool limits",
      variablesCount: 8,
      isSecret: false
    },
    {
      id: "vg-core-messaging",
      name: "vg-kafka-eventhub-config",
      description: "Tópicos de mensageria e endpoints de auditoria",
      variablesCount: 6,
      isSecret: false
    }
  ],
  "proj-002": [
    {
      id: "vg-payment-keys",
      name: "vg-payment-gateway-certs",
      description: "Certificados mTLS para SIBS, VISA e Mastercard",
      variablesCount: 10,
      isSecret: true
    },
    {
      id: "vg-mbway-endpoints",
      name: "vg-mbway-api-endpoints",
      description: "Endpoints de webhook e credenciais de merchant",
      variablesCount: 5,
      isSecret: true
    }
  ],
  "proj-003": [
    {
      id: "vg-portal-env",
      name: "vg-portal-web-env-vars",
      description: "Variáveis de ambiente do Frontend React e API Gateway",
      variablesCount: 12,
      isSecret: false
    },
    {
      id: "vg-auth-oauth2",
      name: "vg-entra-id-client-credentials",
      description: "Client ID e Secrets do Microsoft Entra ID",
      variablesCount: 4,
      isSecret: true
    }
  ],
  "proj-004": [
    {
      id: "vg-azure-subscription",
      name: "vg-azure-subscription-spn",
      description: "Service Principal SPN do Azure Resource Manager",
      variablesCount: 6,
      isSecret: true
    }
  ]
};

export const MOCK_ENVIRONMENTS: Record<string, Environment[]> = {
  "proj-001": [
    { id: "env-dev", name: "Development", description: "Cluster AKS de desenvolvimento interno", approvalsRequired: false },
    { id: "env-staging", name: "Staging / UAT", description: "Ambiente de homologação bancária com dados anonimizados", approvalsRequired: true },
    { id: "env-prod", name: "Production - Core Bank", description: "Ambiente de produção de alta disponibilidade (Tier 0)", approvalsRequired: true },
    { id: "env-dr", name: "Disaster Recovery", description: "Região secundária (Azure North Europe)", approvalsRequired: true }
  ],
  "proj-002": [
    { id: "env-dev", name: "Development", description: "Ambiente de testes Sandbox com simuladores", approvalsRequired: false },
    { id: "env-staging", name: "Staging-SIBS-Test", description: "Ambiente de certificação SIBS e Redunicre", approvalsRequired: true },
    { id: "env-prod", name: "Production Gateway", description: "Cluster PCI-DSS Compliant em Produção", approvalsRequired: true }
  ],
  "proj-003": [
    { id: "env-dev", name: "Development", description: "Preview builds & feature branches", approvalsRequired: false },
    { id: "env-staging", name: "UAT Customer Portal", description: "Validação com equipe de produto e UX", approvalsRequired: false },
    { id: "env-prod", name: "Production Web & CDN", description: "Azure Front Door e App Service multirregião", approvalsRequired: true }
  ],
  "proj-004": [
    { id: "env-staging", name: "Subscription Sandbox", description: "Validação de terraform plan", approvalsRequired: false },
    { id: "env-prod", name: "Subscription Production", description: "Contas de subscrição enterprise principais", approvalsRequired: true }
  ]
};

export const MOCK_PIPELINES: AzurePipeline[] = [
  {
    id: "pipe-101",
    projectId: "proj-001",
    name: "core-banking-ci-build",
    folder: "\\CI\\Builds",
    status: "completed",
    result: "succeeded",
    repository: "core-banking-services.git",
    branch: "main",
    lastRunDate: "Há 8 minutos",
    duration: "2m 45s",
    author: "Ricardo Silva",
    variableGroupIds: ["vg-core-secrets", "vg-core-db-config"],
    environmentIds: ["env-dev"],
    schedule: {
      hasSchedule: false
    }
  },
  {
    id: "pipe-102",
    projectId: "proj-001",
    name: "core-banking-nightly-reconciliation",
    folder: "\\Batch\\Nightly",
    status: "completed",
    result: "succeeded",
    repository: "core-banking-services.git",
    branch: "main",
    lastRunDate: "Hoje às 02:00",
    duration: "18m 10s",
    author: "Automated Scheduler",
    variableGroupIds: ["vg-core-secrets", "vg-core-db-config", "vg-core-messaging"],
    environmentIds: ["env-staging", "env-prod"],
    schedule: {
      hasSchedule: true,
      cron: "0 2 * * *",
      humanReadable: "Diariamente às 02:00 UTC (Nightly Batch)"
    }
  },
  {
    id: "pipe-103",
    projectId: "proj-001",
    name: "database-migration-liquibase",
    folder: "\\Database\\Migrations",
    status: "completed",
    result: "succeeded",
    repository: "core-banking-services.git",
    branch: "main",
    lastRunDate: "Ontem às 23:10",
    duration: "3m 30s",
    author: "DBA Team",
    variableGroupIds: ["vg-core-db-config"],
    environmentIds: ["env-dev", "env-staging", "env-prod"],
    schedule: {
      hasSchedule: false
    }
  },
  {
    id: "pipe-104",
    projectId: "proj-001",
    name: "core-banking-dr-failover-drill",
    folder: "\\DR\\Tests",
    status: "completed",
    result: "succeeded",
    repository: "core-banking-services.git",
    branch: "main",
    lastRunDate: "No último Domingo",
    duration: "12m 40s",
    author: "SRE Automation",
    variableGroupIds: ["vg-core-secrets", "vg-core-messaging"],
    environmentIds: ["env-dr"],
    schedule: {
      hasSchedule: true,
      cron: "0 4 1 * *",
      humanReadable: "Dia 1 de cada mês às 04:00 UTC (DR Drill)"
    }
  },
  {
    id: "pipe-201",
    projectId: "proj-002",
    name: "payments-gateway-deploy-staging",
    folder: "\\CD\\Staging",
    status: "inProgress",
    result: "none",
    repository: "payments-gateway-engine.git",
    branch: "release/v2.4",
    lastRunDate: "A executar agora",
    duration: "1m 12s",
    author: "Ana Martins",
    variableGroupIds: ["vg-payment-keys", "vg-mbway-endpoints"],
    environmentIds: ["env-dev", "env-staging"],
    schedule: {
      hasSchedule: true,
      cron: "0 18 * * 1-5",
      humanReadable: "Segunda a Sexta às 18:00 UTC (Daily Staging Deploy)"
    }
  },
  {
    id: "pipe-202",
    projectId: "proj-002",
    name: "payments-cert-renewal-check",
    folder: "\\Security\\Certs",
    status: "completed",
    result: "succeeded",
    repository: "payments-gateway-engine.git",
    branch: "main",
    lastRunDate: "Hoje às 06:00",
    duration: "45s",
    author: "Security Bot",
    variableGroupIds: ["vg-payment-keys"],
    environmentIds: ["env-staging", "env-prod"],
    schedule: {
      hasSchedule: true,
      cron: "0 6 * * *",
      humanReadable: "Todos os dias às 06:00 UTC (Check Certs)"
    }
  },
  {
    id: "pipe-203",
    projectId: "proj-002",
    name: "notifications-dispatcher-deploy",
    folder: "\\CD\\Production",
    status: "completed",
    result: "failed",
    repository: "payments-gateway-engine.git",
    branch: "hotfix/push-certs",
    lastRunDate: "Há 5 horas",
    duration: "52s",
    author: "Gonçalo Ferreira",
    variableGroupIds: ["vg-mbway-endpoints"],
    environmentIds: ["env-prod"],
    schedule: {
      hasSchedule: false
    }
  },
  {
    id: "pipe-301",
    projectId: "proj-003",
    name: "portal-web-e2e-playwright",
    folder: "\\QA\\AutomatedTests",
    status: "completed",
    result: "succeeded",
    repository: "customer-portal-frontend.git",
    branch: "main",
    lastRunDate: "Há 42 minutos",
    duration: "4m 10s",
    author: "Tiago Santos",
    variableGroupIds: ["vg-portal-env", "vg-auth-oauth2"],
    environmentIds: ["env-staging"],
    schedule: {
      hasSchedule: true,
      cron: "0 1 * * *",
      humanReadable: "Diariamente às 01:00 UTC (E2E Regression)"
    }
  },
  {
    id: "pipe-302",
    projectId: "proj-003",
    name: "portal-web-production-cd",
    folder: "\\CD\\Production",
    status: "completed",
    result: "succeeded",
    repository: "customer-portal-frontend.git",
    branch: "release/v3.0",
    lastRunDate: "Ontem às 18:00",
    duration: "5m 20s",
    author: "Release Manager",
    variableGroupIds: ["vg-portal-env", "vg-auth-oauth2"],
    environmentIds: ["env-staging", "env-prod"],
    schedule: {
      hasSchedule: false
    }
  },
  {
    id: "pipe-401",
    projectId: "proj-004",
    name: "terraform-drift-detection",
    folder: "\\Infra\\Drift",
    status: "completed",
    result: "succeeded",
    repository: "azure-iac-terraform.git",
    branch: "main",
    lastRunDate: "Hoje às 05:00",
    duration: "7m 15s",
    author: "Infra Scheduler",
    variableGroupIds: ["vg-azure-subscription"],
    environmentIds: ["env-staging", "env-prod"],
    schedule: {
      hasSchedule: true,
      cron: "0 5 * * *",
      humanReadable: "Diariamente às 05:00 UTC (Terraform Plan Drift)"
    }
  }
];

export const MOCK_DASHBOARD_METRICS: DashboardData = {
  projects: 4,
  pipelines: 10,
  variableGroups: 8,
  environments: 12,
  repositories: 18,
  successRate: 94.2,
  activeRuns: 1
};
