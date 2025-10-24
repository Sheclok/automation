Write-Host "=== [Auto Start Edge Script] ==="
$logPath = "C:\automation\start_log.txt"

try {
    $node = "C:\Program Files\nodejs\node.exe"
    $script = "C:\automation\start.js"

    if (Test-Path $node -and (Test-Path $script)) {
        Start-Process $node $script
        Add-Content $logPath "$(Get-Date): start.js launched successfully"
    } else {
        Add-Content $logPath "$(Get-Date): Node or script not found!"
    }
} catch {
    Add-Content $logPath "$(Get-Date): Error - $_"
}
