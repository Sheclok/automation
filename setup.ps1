Write-Host "=== [Automation Setup Started] ==="

# -------------------------
# 1. Tạo thư mục automation
# -------------------------
$folder = "C:\automation"
if (!(Test-Path $folder)) {
    New-Item -ItemType Directory -Path $folder | Out-Null
    Write-Host "📁 Created folder $folder"
} else {
    Write-Host "📁 Folder already exists: $folder"
}

# -------------------------
# 2. Cài Node.js nếu chưa có
# -------------------------
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Installing Node.js..."
    $nodeInstaller = "$env:TEMP\node-setup.msi"
    Invoke-WebRequest -Uri "https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi" -OutFile $nodeInstaller
    Start-Process msiexec.exe -Wait -ArgumentList "/i $nodeInstaller /qn"
} else {
    Write-Host "✅ Node.js already installed"
}

# -------------------------
# 3. Tải script Puppeteer
# -------------------------
$scriptUrl = "https://raw.githubusercontent.com/Sheclok/automation/main/start.js"
$scriptPath = "$folder\start.js"

Write-Host "📥 Downloading start.js..."
Invoke-WebRequest -Uri $scriptUrl -OutFile $scriptPath -UseBasicParsing
Write-Host "✅ start.js downloaded"

# -------------------------
# 4. Tải helper run_start.ps1
# -------------------------
$runStartUrl = "https://raw.githubusercontent.com/Sheclok/automation/main/run_start.ps1"
$runStartPath = "$folder\run_start.ps1"

Write-Host "📥 Downloading run_start.ps1..."
Invoke-WebRequest -Uri $runStartUrl -OutFile $runStartPath -UseBasicParsing
Write-Host "✅ run_start.ps1 downloaded"

# -------------------------
# 5. Cài npm package cần thiết
# -------------------------
Write-Host "📦 Installing npm packages..."
Set-Location $folder
npm install puppeteer-core node-fetch@2

# -------------------------
# 6. (Tùy chọn) Chạy thử script chính 1 lần để kiểm tra
# -------------------------
$nodePath = (Get-Command node).Source
Write-Host "▶️ Running Puppeteer automation once for verification..."
try {
    Start-Process $nodePath "$folder\start.js"
    Write-Host "✅ Initial run triggered"
} catch {
    Write-Host "⚠️ Error running start.js: $_"
}

# -------------------------
# 7. Tạo Scheduled Task cho user login
# -------------------------
$User = "MyComuters"  # 👈 Thay bằng đúng user bạn dùng để remote qua Bastion/RDP
$TaskName = "StartEdgeAutomation"
$Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File C:\automation\run_start.ps1"
$Trigger = New-ScheduledTaskTrigger -AtLogOn

# Xóa task cũ nếu đã tồn tại
if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

Register-ScheduledTask -Action $Action -Trigger $Trigger -TaskName $TaskName -User $User -RunLevel Highest -Force
Write-Host "✅ Scheduled task created: $TaskName for user $User"

Write-Host "=== [Setup Completed Successfully] ==="
