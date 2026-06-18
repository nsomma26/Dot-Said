# Doppio click: tasto destro -> Esegui con PowerShell
# oppure da terminale:  powershell -ExecutionPolicy Bypass -File apri.ps1

Set-Location $PSScriptRoot
$ErrorActionPreference = "Stop"

function Get-PythonCmd {
    if (Get-Command py -ErrorAction SilentlyContinue) { return @("py", "-3") }
    if (Get-Command python -ErrorAction SilentlyContinue) { return @("python") }
    return $null
}

$py = Get-PythonCmd
if (-not $py) {
    Write-Host "ERRORE: Python non trovato. Installa da https://www.python.org/downloads/" -ForegroundColor Red
    Read-Host "Premi Invio per uscire"
    exit 1
}

# Libera porta 8765
Get-NetTCPConnection -LocalPort 8765 -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

$port = 8765
while ($port -lt 8775) {
    try {
        $l = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
        $l.Start()
        $l.Stop()
        break
    } catch { $port++ }
}

if ($port -ge 8775) {
    Write-Host "ERRORE: nessuna porta libera." -ForegroundColor Red
    Read-Host "Premi Invio per uscire"
    exit 1
}

Write-Host "Avvio server sulla porta $port..."
Start-Process -FilePath $py[0] -ArgumentList ($py[1..($py.Length-1)] + @("-m", "http.server", "$port")) `
    -WorkingDirectory $PSScriptRoot -WindowStyle Minimized

Start-Sleep -Seconds 3
$url = "http://127.0.0.1:$port/index.html"
Write-Host "Apertura browser: $url"
Start-Process $url

Write-Host ""
Write-Host "Sesto Senso attivo. Se la pagina e' vuota, premi F5." -ForegroundColor Green
Read-Host "Premi Invio per uscire (il server resta attivo in background)"
