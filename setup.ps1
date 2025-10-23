Write-Host "=== [Automation Setup Started] ==="

# -------------------------
# 1. Tạo thư mục automation
# -------------------------
$folder = "C:\automation"
if (!(Test-Path $folder)) {
    New-Item -ItemType Directory -Path $folder | Out-Null
    Write-Host "Created folder $folder"
}

# -------------------------
# 2. Cài Node.js nếu chưa có
# -------------------------
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Node.js..."
    $nodeInstaller = "$env:TEMP\node-setup.msi"
    Invoke-WebRequest -Uri "https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi" -OutFile $nodeInstaller
    Start-Process msiexec.exe -Wait -ArgumentList "/i $nodeInstaller /qn"
}

# -------------------------
# 3. Tải script Puppeteer
# -------------------------
$scriptUrl = "https://raw.githubusercontent.com/yourname/automation/main/start.js"
Invoke-WebRequest -Uri $scriptUrl -OutFile "$folder\start.js"

# -------------------------
# 4. Cài npm package cần thiết
# -------------------------
Write-Host "Installing npm packages..."
cd $folder
npm install puppeteer-core node-fetch@2

# -------------------------
# 5. Chạy script chính
# -------------------------
$nodePath = (Get-Command node).Source
Write-Host "Running Puppeteer automation..."
Start-Process $nodePath "$folder\start.js"

Write-Host "=== [Setup Completed Successfully] ==="
