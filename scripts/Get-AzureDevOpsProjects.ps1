[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$Organization,

    [ValidateSet('Pat')]
    [string]$AuthMode = 'Pat',

    [string]$Pat
)

$ErrorActionPreference = 'Stop'

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Azure DevOps Discovery - Get Projects" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

Write-Host "[1/7] A validar Organization..." -ForegroundColor Yellow

$Organization = $Organization.TrimEnd('/')

if ($Organization -notmatch '^https?://')
{
    $Organization = "https://dev.azure.com/$Organization"
}

Write-Host "Organization: $Organization" -ForegroundColor Green

Write-Host "[2/7] A validar PAT..." -ForegroundColor Yellow

if ([string]::IsNullOrWhiteSpace($Pat))
{
    throw 'PAT não fornecido.'
}

Write-Host "PAT recebido." -ForegroundColor Green

Write-Host "[3/7] A gerar autenticação Basic..." -ForegroundColor Yellow

$encoded = [Convert]::ToBase64String(
    [Text.Encoding]::ASCII.GetBytes(":$Pat")
)

$headers = @{
    Authorization = "Basic $encoded"
}

Write-Host "Header Authorization criado." -ForegroundColor Green

Write-Host "[4/7] A construir URL..." -ForegroundColor Yellow

$url = "$Organization/_apis/projects?api-version=7.1-preview.4&`$top=1000"

Write-Host "URL:" -ForegroundColor Cyan
Write-Host $url -ForegroundColor White

Write-Host "[5/7] A executar pedido GET..." -ForegroundColor Yellow

$response = Invoke-RestMethod `
    -Uri $url `
    -Headers $headers `
    -Method Get

Write-Host "[6/7] Pedido concluído com sucesso." -ForegroundColor Green

Write-Host "Total de projetos encontrados: $($response.count)" -ForegroundColor Green

foreach ($project in $response.value)
{
    Write-Host " - $($project.name)" -ForegroundColor Gray
}

Write-Host "[7/7] A converter resultado para JSON..." -ForegroundColor Yellow

$response.value |
    Select-Object `
        id,
        name,
        description,
        state,
        url,
        visibility,
        lastUpdateTime |
    ConvertTo-Json -Depth 10 -Compress

Write-Host "Discovery concluído com sucesso." -ForegroundColor Green