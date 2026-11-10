[CmdletBinding()]
param(
    [Parameter(Mandatory)] [string]$Organization,
    [Parameter(Mandatory)] [string]$ProjectId,
    [ValidateSet('Pat')] [string]$AuthMode = 'Pat',
    [string]$Pat
)
$ErrorActionPreference = 'Stop'
$Organization = $Organization.TrimEnd('/')
if ($Organization -notmatch '^https?://') { $Organization = "https://dev.azure.com/$Organization" }
if ([string]::IsNullOrWhiteSpace($Pat)) { throw 'PAT não fornecido.' }
$encoded = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":$Pat"))
$headers = @{ Authorization = "Basic $encoded" }
function Get-Api([string]$path) { try { (Invoke-RestMethod -Uri "$Organization/$ProjectId/_apis/$path" -Headers $headers -Method Get).value } catch { @() } }
[pscustomobject]@{
    projectId = $ProjectId
    pipelines = @(Get-Api 'pipelines?api-version=7.1-preview.1')
    variableGroups = @(Get-Api 'distributedtask/variablegroups?api-version=7.1-preview.2')
    environments = @(Get-Api 'distributedtask/environments?api-version=7.1-preview.1')
} | ConvertTo-Json -Depth 20 -Compress
