Write-Host "=== [Auto Start Edge Script] ==="
$logPath = "C:\automation\start_log.txt"

try {
    $node = "C:\Program Files\nodejs\node.exe"
    $script = "C:\automation\start.js"

    # Starrt Edqe
    Add-Content $logPath "$(Get-Date): Prepareparing to launch start.js"
    if (($null -ne $node) -and ($null -ne $script) -and (Test-Path $node) -and (Test-Path $script)) {
        Start-Process -FilePath $node -ArgumentList $script
        Add-Content $logPath "$(Get-Date): start.js launched successfully"
    } else {
        Add-Content $logPath "$(Get-Date): Node or script not found!"
        Add-Content $logPath "$(Get-Date): Node exists? $((Test-Path $node)) - Script exists? $((Test-Path $script))"
    }
} catch {
    Add-Content $logPath "$(Get-Date): Error - $_"
}

try {
    # Start OOBE ---
    Add-Content $logPath "$(Get-Date): Running AutoClickOOBE.ps1..."
    Write-Host "Running AutoClickOOBE.ps1..."
    Start-Process -FilePath "powershell.exe" -ArgumentList "-ExecutionPolicy Bypass -File 'C:\automation\AutoClickOOBE.ps1'" -WindowStyle Hidden
    Start-Sleep -Seconds 5
    Write-Host "AutoClickOOBE.ps1 executed."
    Add-Content $logPath "$(Get-Date): AutoClickOOBE.ps1 executed."
}
catch {
    Add-Content $logPath "$(Get-Date): Error running AutoClickOOBE.ps1 - $_"
    Write-Error "Error running AutoClickOOBE.ps1: $_"
}    

Write-Host "=== [Auto Start Edge Script Completed] ==="