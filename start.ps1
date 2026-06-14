$NODE_DIR = "$env:LOCALAPPDATA\nodejs\node-v20.18.0-win-x64"
$env:PATH = "$NODE_DIR;" + $env:PATH

Write-Host "Starting backend..." -ForegroundColor Green
$job1 = Start-Job -ScriptBlock {
  param($dir, $path)
  $env:PATH = $path + ";" + $env:PATH
  Set-Location $dir
  node server.js
} -ArgumentList "C:\Users\r00t\AppData\Local\Temp\opencode\restaurant-app\backend", $NODE_DIR

Start-Sleep -Seconds 3

Write-Host "Starting frontend..." -ForegroundColor Green
$job2 = Start-Job -ScriptBlock {
  param($dir, $path)
  $env:PATH = $path + ";" + $env:PATH
  Set-Location $dir
  npm run dev
} -ArgumentList "C:\Users\r00t\AppData\Local\Temp\opencode\restaurant-app\frontend", $NODE_DIR

Write-Host "`n====================================" -ForegroundColor Cyan
Write-Host "  Restaurant Ordering System" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  Backend API:  http://localhost:3001" -ForegroundColor Yellow
Write-Host "  Frontend App: http://localhost:5173" -ForegroundColor Yellow
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C to stop both servers.`n" -ForegroundColor Gray

while ($true) {
  Start-Sleep -Seconds 1
  $running = ($job1.State -eq 'Running'), ($job2.State -eq 'Running')
  if (-not ($running[0] -and $running[1])) {
    Write-Host "A server stopped. Shutting down..." -ForegroundColor Red
    Stop-Job $job1 -ErrorAction SilentlyContinue
    Stop-Job $job2 -ErrorAction SilentlyContinue
    break
  }
}
