Write-Host "=== [Automation Setup Started] ==="

# 1. Create automation folder
$folder = "C:\automation"
if (!(Test-Path $folder)) {
    New-Item -ItemType Directory -Path $folder | Out-Null
    Write-Host "Created folder $folder"
} else {
    Write-Host "Folder already exists: $folder"
}

# 2. Install Node.js if not available
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Node.js..."
    $nodeInstaller = "$env:TEMP\node-setup.msi"
    Invoke-WebRequest -Uri "https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi" -OutFile $nodeInstaller -UseBasicParsing
    Start-Process msiexec.exe -Wait -ArgumentList "/i $nodeInstaller /qn"

    # Add Node.js to PATH for current session
    $nodePath = "C:\Program Files\nodejs"
    if (Test-Path $nodePath) {
        Write-Host "Adding Node.js to PATH..."
        $env:Path += ";$nodePath"
    } else {
        Write-Host "Node.js path not found. Verify installation."
    }
} else {
    Write-Host "Node.js already installed"
}

# 3. Download start.js
$scriptUrl = "https://raw.githubusercontent.com/Sheclok/automation/main/start.js"
$scriptPath = "$folder\start.js"
Write-Host "Downloading start.js..."
Invoke-WebRequest -Uri $scriptUrl -OutFile $scriptPath -UseBasicParsing

# 4. Download run_start.ps1
$runStartUrl = "https://raw.githubusercontent.com/Sheclok/automation/main/run_start.ps1"
$runStartPath = "$folder\run_start.ps1"
Write-Host "Downloading run_start.ps1..."
Invoke-WebRequest -Uri $runStartUrl -OutFile $runStartPath -UseBasicParsing

# 5. Install npm packages
Write-Host "Installing npm packages..."
Set-Location $folder

# Reload PATH to ensure npm is available
$env:Path += ";C:\Program Files\nodejs"
$npm = Get-Command npm -ErrorAction SilentlyContinue
if ($null -eq $npm) {
    Write-Host "npm not found even after PATH update. Please check Node.js installation."
} else {
    & npm install puppeteer-core puppeteer-extra puppeteer-extra-plugin-stealth node-fetch@2    
}

# 6. Run Puppeteer once for verification
$nodePath = (Get-Command node).Source
Write-Host "Running Puppeteer for initial verification..."
try {
    Start-Process $nodePath "$folder\start.js"
    Write-Host "Initial Puppeteer run triggered"
} catch {
    Write-Host "Error running start.js: $_"
}

# 7. Create Scheduled Task to auto-run when user logs in
$User = "MyComuters"  # <-- replace with your actual RDP username
$TaskName = "StartEdgeAutomation"
$Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File C:\automation\run_start.ps1"
$Trigger = New-ScheduledTaskTrigger -AtLogOn

# Remove old task if it exists
if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

Register-ScheduledTask -Action $Action -Trigger $Trigger -TaskName $TaskName -User $User -RunLevel Highest -Force
Write-Host "Scheduled task created: $TaskName for user $User"

Write-Host "Skipping OOBE setup screens..."

reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\OOBE" /v "SkipMachineOOBE" /t REG_DWORD /d 1 /f
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\OOBE" /v "SkipUserOOBE" /t REG_DWORD /d 1 /f
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\OOBE" /v "HideEULAPage" /t REG_DWORD /d 1 /f
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" /v "EnableLUA" /t REG_DWORD /d 0 /f

Write-Host "OOBE auto-skip configured."


Write-Host "=== [Setup Completed Successfully] ==="
