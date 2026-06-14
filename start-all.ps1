param(
  [string]$Component = "all"
)

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$env:PATH = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")

function Start-App {
  param($Name, $Dir, $Command, $Port)
  Write-Host "Starting $Name..." -ForegroundColor Green
  $log = Join-Path $Dir "startup.log"
  $job = Start-Job -ScriptBlock {
    param($d, $c, $p)
    $env:PATH = $p
    Set-Location $d
    Invoke-Expression $c
  } -ArgumentList $Dir, $Command, $env:PATH
  Start-Sleep -Seconds 4
  $running = (Get-Job -Id $job.Id).State -eq 'Running'
  if ($running) {
    Write-Host "  ✓ $Name running" -ForegroundColor Cyan
  } else {
    Write-Host "  ✗ $Name failed to start" -ForegroundColor Red
  }
  return $job
}

$Jobs = @()

if ($Component -eq "all" -or $Component -eq "web") {
  $Jobs += Start-App -Name "Web App (Vite)" -Dir $RootDir -Command "npx vite --host --port 5173" -Port 5173
}

if ($Component -eq "all" -or $Component -eq "backend") {
  $Jobs += Start-App -Name "Backend API" -Dir (Join-Path $RootDir "backend") -Command "node server.js" -Port 3001
}

if ($Component -eq "all" -or $Component -eq "mobile") {
  $Jobs += Start-App -Name "Mobile App (Expo)" -Dir (Join-Path $RootDir "mobile") -Command "npx expo start --web" -Port 8081
}

Write-Host "`n====================================" -ForegroundColor Cyan
Write-Host " Restaurant Ordering System" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host " Web App:     http://localhost:5173" -ForegroundColor Yellow
Write-Host " Backend API: http://localhost:3001" -ForegroundColor Yellow
Write-Host " Mobile App:  http://localhost:8081" -ForegroundColor Yellow
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Demo Accounts:" -ForegroundColor Gray
Write-Host "  User:  user@test.com / password" -ForegroundColor Gray
Write-Host "  Cook:  cook@test.com / cookpass" -ForegroundColor Gray
Write-Host "  Admin: admin@test.com / admin123" -ForegroundColor Gray
Write-Host "====================================`n" -ForegroundColor Cyan

while ($true) {
  Start-Sleep -Seconds 5
  $allRunning = $true
  foreach ($job in $Jobs) {
    if ((Get-Job -Id $job.Id -ErrorAction SilentlyContinue).State -ne 'Running') {
      $allRunning = $false
    }
  }
  if (-not $allRunning) {
    Write-Host "A server stopped. Shutting down..." -ForegroundColor Red
    $Jobs | ForEach-Object { Stop-Job -Id $_.Id -ErrorAction SilentlyContinue }
    break
  }
}
