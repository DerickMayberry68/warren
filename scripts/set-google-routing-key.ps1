# Writes a downloaded Google service-account key into the admin env file
# as a single-line GOOGLE_ROUTING_SERVICE_ACCOUNT_JSON value.
# Replaces any existing value, including a multi-line { ... } block.
# The key is never printed.
#
# Usage (from the repo root):
#   powershell -ExecutionPolicy Bypass -File scripts\set-google-routing-key.ps1 -KeyFile "$HOME\Downloads\warren-routing-xxxx.json"

param(
  [Parameter(Mandatory = $true)] [string]$KeyFile,
  [string]$EnvFile = "apps\admin\.env.local"
)

$ErrorActionPreference = "Stop"
$name = "GOOGLE_ROUTING_SERVICE_ACCOUNT_JSON"

$key = Get-Content -LiteralPath $KeyFile -Raw | ConvertFrom-Json
if ($key.type -ne "service_account" -or -not $key.private_key -or -not $key.client_email) {
  throw "$KeyFile is not a Google service-account key file."
}
$json = $key | ConvertTo-Json -Compress -Depth 5
if ($json.Contains("'")) { throw "Unexpected single quote in key JSON." }

$envPath = (Resolve-Path -LiteralPath $EnvFile).Path
$out = New-Object System.Collections.Generic.List[string]
$skipping = $false
foreach ($line in [IO.File]::ReadAllLines($envPath)) {
  if ($skipping) {
    if ($line.Trim() -eq "}") { $skipping = $false }
    continue
  }
  if ($line -match "^\s*$name\s*=") {
    if ($line.TrimEnd().EndsWith("{")) { $skipping = $true }
    continue
  }
  $out.Add($line)
}
if ($skipping) { throw "Could not find the closing } of the existing $name block. Nothing was written." }

while ($out.Count -gt 0 -and $out[$out.Count - 1].Trim() -eq "") { $out.RemoveAt($out.Count - 1) }
$out.Add("$name='$json'")
[IO.File]::WriteAllLines($envPath, $out, (New-Object System.Text.UTF8Encoding $false))
Write-Host "Updated $name in $EnvFile for $($key.client_email). Delete $KeyFile when done."
