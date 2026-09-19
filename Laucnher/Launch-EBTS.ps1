$ErrorActionPreference = 'SilentlyContinue'
$projectPath = 'C:\xampp\htdocs\EBTS'
$xamppPath = 'C:\xampp'
$frontendUrl = 'http://localhost:5173/'
$chromeCandidates = @(
    'C:\Program Files\Google\Chrome\Application\chrome.exe',
    'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)

Start-Process -FilePath "$xamppPath\apache_start.bat" -WorkingDirectory $xamppPath -WindowStyle Hidden
Start-Process -FilePath "$xamppPath\mysql_start.bat" -WorkingDirectory $xamppPath -WindowStyle Hidden
Start-Process -FilePath "$xamppPath\xampp-control.exe" -WorkingDirectory $xamppPath

$viteRunning = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
if (-not $viteRunning) {
    Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'npm run dev -- --host 0.0.0.0' -WorkingDirectory $projectPath -WindowStyle Minimized
}

for ($attempt = 0; $attempt -lt 30; $attempt++) {
    Start-Sleep -Milliseconds 500
    $viteRunning = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
    if ($viteRunning) { break }
}

$chromePath = $chromeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($chromePath) {
    Start-Process -FilePath $chromePath -ArgumentList '--new-window', $frontendUrl
} else {
    Start-Process $frontendUrl
}
