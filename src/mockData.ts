import type { AzureProject, AzurePipeline, DashboardData, VariableGroup, Environment, TopologyGroup } from './types';

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
    pipelinesCount: 2,
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
    pipelinesCount: 1,
    defaultRepository: "azure-iac-terraform.git"
  }
];

export const MOCK_TOPOLOGY_GROUPS: Record<string, TopologyGroup[]> = {
  "proj-001": [
    {
      id: "group-core-repo",
      projectId: "proj-001",
      name: "Repositório Core Banking",
      description: "Pipelines e configurações vinculadas ao repo principal core-banking-services.git",
      color: "#0284c7",
      repository: "core-banking-services.git"
    },
    {
      id: "group-shared-infra",
      projectId: "proj-001",
      name: "Infraestrutura Partilhada & DBA",
      description: "Recursos transversais, bases de dados e contingência DR",
      color: "#8b5cf6",
      repository: "shared-infra"
    }
  ],
  "proj-002": [
    {
      id: "group-payments-repo",
      projectId: "proj-002",
      name: "Repositório Payments Gateway",
      description: "Serviços PCI-DSS e gateways de pagamento externos",
      color: "#10b981",
      repository: "payments-gateway-engine.git"
    }
  ],
  "proj-003": [
    {
      id: "group-frontend-repo",
      projectId: "proj-003",
      name: "Repositório Frontend Portal",
      description: "Aplicações Web, Single Page Apps e CDN de assets",
      color: "#f59e0b",
      repository: "customer-portal-frontend.git"
    }
  ],
  "proj-004": [
    {
      id: "group-iac-repo",
      projectId: "proj-004",
      name: "Repositório Terraform IaC",
      description: "Automação Bicep e Terraform Enterprise",
      color: "#ec4899",
      repository: "azure-iac-terraform.git"
    }
  ]
};

export const MOCK_VARIABLE_GROUPS: Record<string, VariableGroup[]> = {
  "proj-001": [
    {
      id: "vg-core-secrets",
      name: "vg-core-banking-secrets",
      description: "Chaves de encriptação AES-256 e tokens de autorização bancária",
      variablesCount: 4,
      isSecret: true,
      azureUrl: "https://dev.azure.com/contoso/Enterprise-Core-Banking/_library?itemType=VariableGroups&view=VariableGroupView&variableGroupId=101",
      variables: [
        { name: "BANK_ENCRYPTION_KEY_AES256", value: "vault-core-key-sec-88219", isSecret: true },
        { name: "SIBS_API_SECRET_TOKEN", value: "sibs_live_token_77a8b9", isSecret: true },
        { name: "SWIFT_GATEWAY_CERT_PASSWORD", value: "swift_pass_enc_3311", isSecret: true },
        { name: "AUDIT_LOGGER_HASH_SALT", value: "salt_9921_core_bank", isSecret: true }
      ]
    },
    {
      id: "vg-core-db-config",
      name: "vg-core-sql-connection",
      description: "Strings de conexão SQL Server e pool limits",
      variablesCount: 4,
      isSecret: false,
      azureUrl: "https://dev.azure.com/contoso/Enterprise-Core-Banking/_library?itemType=VariableGroups&view=VariableGroupView&variableGroupId=102",
      variables: [
        { name: "SQL_SERVER_HOST", value: "sql-core-banking-prod.database.windows.net", isSecret: false },
        { name: "SQL_DATABASE_NAME", value: "db_core_transactions", isSecret: false },
        { name: "SQL_CONNECTION_TIMEOUT", value: "30", isSecret: false },
        { name: "SQL_MAX_POOL_SIZE", value: "150", isSecret: false }
      ]
    },
    {
      id: "vg-core-messaging",
      name: "vg-kafka-eventhub-config",
      description: "Tópicos de mensageria e endpoints de auditoria",
      variablesCount: 3,
      isSecret: false,
      azureUrl: "https://dev.azure.com/contoso/Enterprise-Core-Banking/_library?itemType=VariableGroups&view=VariableGroupView&variableGroupId=103",
      variables: [
        { name: "EVENTHUB_NAMESPACE", value: "eh-core-banking.servicebus.windows.net", isSecret: false },
        { name: "TOPIC_TRANSACTIONS_COMPLETED", value: "transactions.v1.completed", isSecret: false },
        { name: "TOPIC_FRAUD_ALERT", value: "fraud.alerts.critical", isSecret: false }
      ]
    }
  ],
  "proj-002": [
    {
      id: "vg-payment-keys",
      name: "vg-payment-gateway-certs",
      description: "Certificados mTLS para SIBS, VISA e Mastercard",
      variablesCount: 3,
      isSecret: true,
      azureUrl: "https://dev.azure.com/contoso/Digital-Payments-Gateway/_library?itemType=VariableGroups&view=VariableGroupView&variableGroupId=201",
      variables: [
        { name: "VISA_DIRECT_CLIENT_CERT_PEM", value: "cert_visa_base64_data", isSecret: true },
        { name: "MASTERCARD_SIGNING_KEY", value: "mc_sign_private_key", isSecret: true },
        { name: "PCI_COMPLIANCE_ENCRYPTION_KEY", value: "aes_pci_compliant_909", isSecret: true }
      ]
    },
    {
      id: "vg-mbway-endpoints",
      name: "vg-mbway-api-endpoints",
      description: "Endpoints de webhook e credenciais de merchant",
      variablesCount: 3,
      isSecret: false,
      azureUrl: "https://dev.azure.com/contoso/Digital-Payments-Gateway/_library?itemType=VariableGroups&view=VariableGroupView&variableGroupId=202",
      variables: [
        { name: "MBWAY_ENDPOINT_URL", value: "https://api.sibs.pt/mbway/v2/payments", isSecret: false },
        { name: "MBWAY_MERCHANT_ID", value: "PT_MERCHANT_881920", isSecret: false },
        { name: "MBWAY_CALLBACK_TIMEOUT_MS", value: "5000", isSecret: false }
      ]
    }
  ],
  "proj-003": [
    {
      id: "vg-portal-env",
      name: "vg-portal-web-env-vars",
      description: "Variáveis de ambiente do Frontend React e API Gateway",
      variablesCount: 3,
      isSecret: false,
      azureUrl: "https://dev.azure.com/contoso/Customer-Portal-Omnichannel/_library?itemType=VariableGroups&view=VariableGroupView&variableGroupId=301",
      variables: [
        { name: "VITE_API_GATEWAY_URL", value: "https://api-gateway.homebank.contoso.pt", isSecret: false },
        { name: "VITE_APP_INSIGHTS_KEY", value: "app-insights-portal-web-key", isSecret: false },
        { name: "VITE_FEATURE_INSTANT_TRANSFER", value: "true", isSecret: false }
      ]
    },
    {
      id: "vg-auth-oauth2",
      name: "vg-entra-id-client-credentials",
      description: "Client ID e Secrets do Microsoft Entra ID",
      variablesCount: 2,
      isSecret: true,
      azureUrl: "https://dev.azure.com/contoso/Customer-Portal-Omnichannel/_library?itemType=VariableGroups&view=VariableGroupView&variableGroupId=302",
      variables: [
        { name: "ENTRA_ID_CLIENT_SECRET", value: "entra_secret_99812_xya", isSecret: true },
        { name: "ENTRA_ID_TENANT_ID", value: "tenant-contoso-bank-8812", isSecret: false }
      ]
    }
  ],
  "proj-004": [
    {
      id: "vg-azure-subscription",
      name: "vg-azure-subscription-spn",
      description: "Service Principal SPN do Azure Resource Manager",
      variablesCount: 3,
      isSecret: true,
      azureUrl: "https://dev.azure.com/contoso/Cloud-Infrastructure-IaC/_library?itemType=VariableGroups&view=VariableGroupView&variableGroupId=401",
      variables: [
        { name: "ARM_CLIENT_SECRET", value: "spn_arm_secret_value_112", isSecret: true },
        { name: "ARM_CLIENT_ID", value: "spn-devops-infra-iac", isSecret: false },
        { name: "ARM_SUBSCRIPTION_ID", value: "sub-azure-enterprise-prod-001", isSecret: false }
      ]
    }
  ]
};

export const MOCK_ENVIRONMENTS: Record<string, Environment[]> = {
  "proj-001": [
    {
      id: "env-dev",
      name: "Development",
      description: "Cluster AKS de desenvolvimento interno",
      approvalsRequired: false,
      titleColor: "#0284c7",
      azureUrl: "https://dev.azure.com/contoso/Enterprise-Core-Banking/_environments/1"
    },
    {
      id: "env-staging",
      name: "Staging / UAT",
      description: "Ambiente de homologação bancária com dados anonimizados",
      approvalsRequired: true,
      titleColor: "#eab308",
      azureUrl: "https://dev.azure.com/contoso/Enterprise-Core-Banking/_environments/2"
    },
    {
      id: "env-prod",
      name: "Production - Core Bank",
      description: "Ambiente de produção de alta disponibilidade (Tier 0)",
      approvalsRequired: true,
      titleColor: "#ef4444",
      azureUrl: "https://dev.azure.com/contoso/Enterprise-Core-Banking/_environments/3"
    },
    {
      id: "env-dr",
      name: "Disaster Recovery",
      description: "Região secundária (Azure North Europe)",
      approvalsRequired: true,
      titleColor: "#8b5cf6",
      azureUrl: "https://dev.azure.com/contoso/Enterprise-Core-Banking/_environments/4"
    }
  ],
  "proj-002": [
    {
      id: "env-dev",
      name: "Development",
      description: "Ambiente de testes Sandbox com simuladores",
      approvalsRequired: false,
      titleColor: "#0284c7",
      azureUrl: "https://dev.azure.com/contoso/Digital-Payments-Gateway/_environments/11"
    },
    {
      id: "env-staging",
      name: "Staging-SIBS-Test",
      description: "Ambiente de certificação SIBS e Redunicre",
      approvalsRequired: true,
      titleColor: "#eab308",
      azureUrl: "https://dev.azure.com/contoso/Digital-Payments-Gateway/_environments/12"
    },
    {
      id: "env-prod",
      name: "Production Gateway",
      description: "Cluster PCI-DSS Compliant em Produção",
      approvalsRequired: true,
      titleColor: "#ef4444",
      azureUrl: "https://dev.azure.com/contoso/Digital-Payments-Gateway/_environments/13"
    }
  ],
  "proj-003": [
    {
      id: "env-dev",
      name: "Development",
      description: "Preview builds & feature branches",
      approvalsRequired: false,
      titleColor: "#0284c7",
      azureUrl: "https://dev.azure.com/contoso/Customer-Portal-Omnichannel/_environments/21"
    },
    {
      id: "env-staging",
      name: "UAT Customer Portal",
      description: "Validação com equipe de produto e UX",
      approvalsRequired: false,
      titleColor: "#10b981",
      azureUrl: "https://dev.azure.com/contoso/Customer-Portal-Omnichannel/_environments/22"
    },
    {
      id: "env-prod",
      name: "Production Web & CDN",
      description: "Azure Front Door e App Service multirregião",
      approvalsRequired: true,
      titleColor: "#ef4444",
      azureUrl: "https://dev.azure.com/contoso/Customer-Portal-Omnichannel/_environments/23"
    }
  ],
  "proj-004": [
    {
      id: "env-staging",
      name: "Subscription Sandbox",
      description: "Validação de terraform plan",
      approvalsRequired: false,
      titleColor: "#f59e0b",
      azureUrl: "https://dev.azure.com/contoso/Cloud-Infrastructure-IaC/_environments/31"
    },
    {
      id: "env-prod",
      name: "Subscription Production",
      description: "Contas de subscrição enterprise principais",
      approvalsRequired: true,
      titleColor: "#ef4444",
      azureUrl: "https://dev.azure.com/contoso/Cloud-Infrastructure-IaC/_environments/32"
    }
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
    azureUrl: "https://dev.azure.com/contoso/Enterprise-Core-Banking/_build?definitionId=101",
    schedule: {
      hasSchedule: false
    },
    agent: {
      pool: "Azure Pipelines (Hosted)",
      agentName: "Hosted Agent Linux - Ubuntu 22.04 LTS",
      os: "Linux x64",
      status: "online",
      notes: "Agente cloud standard com .NET 8 SDK e Docker instalado para build de microserviços.",
      demands: ["DotNetFramework", "docker"]
    },
    variables: [
      { name: "BUILD_CONFIGURATION", value: "Release", isSecret: false, allowOverride: true },
      { name: "SONAR_PROJECT_KEY", value: "core-banking-backend", isSecret: false },
      { name: "ENABLE_CODE_COVERAGE", value: "true", isSecret: false },
      { name: "SYSTEM_DEBUG", value: "false", isSecret: false, allowOverride: true }
    ]
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
    azureUrl: "https://dev.azure.com/contoso/Enterprise-Core-Banking/_build?definitionId=102",
    schedule: {
      hasSchedule: true,
      cron: "0 2 * * *",
      humanReadable: "Diariamente às 02:00 UTC (Nightly Batch)"
    },
    agent: {
      pool: "Self-Hosted-Banking-Cluster",
      agentName: "worker-batch-node-03.internal.bank",
      os: "RedHat Enterprise Linux 9",
      status: "online",
      notes: "Agente dedicado On-Premises com acesso direto à rede fechada da câmara de compensação.",
      demands: ["HighMemory", "DirectDBAccess"]
    },
    variables: [
      { name: "BATCH_CHUNK_SIZE", value: "50000", isSecret: false },
      { name: "NOTIFY_ON_FAILURE_EMAIL", value: "reconciliation-ops@contoso.bank", isSecret: false },
      { name: "EXPORT_AUDIT_LOGS_S3", value: "true", isSecret: false }
    ]
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
    azureUrl: "https://dev.azure.com/contoso/Enterprise-Core-Banking/_build?definitionId=103",
    schedule: {
      hasSchedule: false
    },
    agent: {
      pool: "DBA-Migration-Pool",
      agentName: "dba-worker-sql-runner",
      os: "Windows Server 2022 Datacenter",
      status: "online",
      notes: "Agente com permissões restritas e firewall aberta para o cluster SQL AlwaysOn.",
      demands: ["sqlcmd", "java17", "liquibase"]
    },
    variables: [
      { name: "LIQUIBASE_CHANGELOG_FILE", value: "src/db/changelog-master.xml", isSecret: false },
      { name: "AUTO_ROLLBACK_ON_ERROR", value: "true", isSecret: false },
      { name: "DRY_RUN_VALIDATION", value: "false", isSecret: false, allowOverride: true }
    ]
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
    azureUrl: "https://dev.azure.com/contoso/Enterprise-Core-Banking/_build?definitionId=104",
    schedule: {
      hasSchedule: true,
      cron: "0 4 1 * *",
      humanReadable: "Dia 1 de cada mês às 04:00 UTC (DR Drill)"
    },
    agent: {
      pool: "SRE-Automation-Pool",
      agentName: "sre-runner-dr-north-europe",
      os: "Ubuntu 22.04 LTS (North Europe)",
      status: "online",
      notes: "Agente instalado na região secundária do Azure para validar contingência e RTO < 15min.",
      demands: ["AzureCLI", "PowerShellCore"]
    },
    variables: [
      { name: "SIMULATE_PRIMARY_OUTAGE", value: "true", isSecret: false },
      { name: "TARGET_FAILOVER_REGION", value: "northeurope", isSecret: false }
    ]
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
    azureUrl: "https://dev.azure.com/contoso/Digital-Payments-Gateway/_build?definitionId=201",
    schedule: {
      hasSchedule: true,
      cron: "0 18 * * 1-5",
      humanReadable: "Segunda a Sexta às 18:00 UTC (Daily Staging Deploy)"
    },
    agent: {
      pool: "PCI-Compliant-Hosted-Pool",
      agentName: "pci-worker-node-01",
      os: "Linux Hardened Kernel",
      status: "online",
      notes: "Agente auditado para conformidade PCI-DSS 4.0 com logs centralizados em SIEM.",
      demands: ["pci-certified", "docker"]
    },
    variables: [
      { name: "DEPLOY_TARGET_CLUSTER", value: "aks-payments-staging", isSecret: false },
      { name: "REPLICA_COUNT", value: "3", isSecret: false }
    ]
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
    azureUrl: "https://dev.azure.com/contoso/Digital-Payments-Gateway/_build?definitionId=202",
    schedule: {
      hasSchedule: true,
      cron: "0 6 * * *",
      humanReadable: "Todos os dias às 06:00 UTC (Check Certs)"
    },
    agent: {
      pool: "Security-Ops-Pool",
      agentName: "sec-certbot-runner",
      os: "Alpine Linux Container",
      status: "online",
      notes: "Valida validade de certificados SSL/mTLS e emite alertas antes de expirar.",
      demands: ["openssl", "keyvault-cli"]
    },
    variables: [
      { name: "EXPIRATION_THRESHOLD_DAYS", value: "30", isSecret: false }
    ]
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
    azureUrl: "https://dev.azure.com/contoso/Digital-Payments-Gateway/_build?definitionId=203",
    schedule: {
      hasSchedule: false
    },
    agent: {
      pool: "Azure Pipelines",
      agentName: "Hosted Agent Linux 09",
      os: "Linux x64",
      status: "online",
      notes: "Execução automatizada em pool hosted compartilhado.",
      demands: ["docker"]
    },
    variables: [
      { name: "PUSH_NOTIFICATION_GATEWAY", value: "fcm-apns-proxy", isSecret: false }
    ]
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
    azureUrl: "https://dev.azure.com/contoso/Customer-Portal-Omnichannel/_build?definitionId=301",
    schedule: {
      hasSchedule: true,
      cron: "0 1 * * *",
      humanReadable: "Diariamente às 01:00 UTC (E2E Regression)"
    },
    agent: {
      pool: "QA-Playwright-Pool",
      agentName: "e2e-headless-browser-runner-04",
      os: "Ubuntu 22.04 LTS (GPU Accelerated)",
      status: "online",
      notes: "Agente otimizado com Chromium, Firefox e WebKit pré-instalados para testes paralelos.",
      demands: ["playwright", "node20"]
    },
    variables: [
      { name: "PLAYWRIGHT_WORKERS", value: "4", isSecret: false },
      { name: "RECORD_VIDEO", value: "on-first-retry", isSecret: false }
    ]
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
    azureUrl: "https://dev.azure.com/contoso/Customer-Portal-Omnichannel/_build?definitionId=302",
    schedule: {
      hasSchedule: false
    },
    agent: {
      pool: "Azure Pipelines",
      agentName: "Hosted Agent Linux 02",
      os: "Linux x64",
      status: "online",
      notes: "Pipeline de release multi-estágio com CDN purge.",
      demands: ["node20"]
    },
    variables: [
      { name: "CDN_PURGE_ON_DEPLOY", value: "true", isSecret: false }
    ]
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
    azureUrl: "https://dev.azure.com/contoso/Cloud-Infrastructure-IaC/_build?definitionId=401",
    schedule: {
      hasSchedule: true,
      cron: "0 5 * * *",
      humanReadable: "Diariamente às 05:00 UTC (Terraform Plan Drift)"
    },
    agent: {
      pool: "Terraform-Enterprise-Pool",
      agentName: "iac-runner-secure-vault",
      os: "Debian 12 Bookworm",
      status: "online",
      notes: "Agente certificado para execução de Terraform com backend remoto no Azure Blob Storage.",
      demands: ["terraform", "azure-cli"]
    },
    variables: [
      { name: "TF_VAR_environment", value: "production", isSecret: false }
    ]
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
