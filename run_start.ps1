Write-Host "=== [Auto Start Edge Script] ==="
$logPath = "C:\automation\start_log.txt"

try {
    $node = "C:\Program Files\nodejs\node.exe"
    $script = "C:\automation\start.js"

    # Starrt Edqe
    Add-Content $logPath "$(Get-Date): Prepareparing to launch start.js"
    if (($null -ne $node) -and ($null -ne $script) -and (Test-Path $node) -and (Test-Path $script)) {
        Start-Process -FilePath $node -ArgumentList $script -WindowStyle Hidden
        Add-Content $logPath "$(Get-Date): start.js launched successfully"
    } else {
        Add-Content $logPath "$(Get-Date): Node or script not found!"
        Add-Content $logPath "$(Get-Date): Node exists? $((Test-Path $node)) - Script exists? $((Test-Path $script))"
    }
} catch {
    Add-Content $logPath "$(Get-Date): Error - $_"
}


Write-Host "=== [Auto Start Edge Script Completed] ==="