Write-Host "=== [Auto Start Edge Script Started] ==="
$logPath = "C:\automation\start_log.txt"
Add-Content $logPath "$(Get-Date): Script started."

# "Get Started" (Welcome to Windows)
Get-AppxPackage *Microsoft.Getstarted* | Remove-AppxPackage -AllUsers -ErrorAction SilentlyContinue

# Start Menu Experience Host
New-Item -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\CloudContent" -Force | Out-Null
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\CloudContent" -Name "DisableSoftLanding" -Type DWord -Value 1

# Tạo nhánh registry nếu chưa có
New-Item -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\PushNotifications" -Force | Out-Null

# Tắt toàn bộ thông báo toast
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\PushNotifications" -Name "ToastEnabled" -Type DWord -Value 0

# Tắt banner, âm thanh, center notification
New-Item -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Notifications\Settings" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Notifications\Settings" -Name "NOC_GLOBAL_SETTING_TOASTS_ENABLED" -Type DWord -Value 0
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Notifications\Settings" -Name "NOC_GLOBAL_SETTING_SOUND_ENABLED" -Type DWord -Value 0
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Notifications\Settings" -Name "NOC_GLOBAL_SETTING_BANNER_ENABLED" -Type DWord -Value 0

# Send Enter Key 3 times every 3 seconds for oobe
try {
    $wshell = New-Object -ComObject wscript.shell
    for ($i = 0; $i -lt 3; $i++) {
        Start-Sleep -Seconds 3
        $wshell.SendKeys("{ENTER}")
    }
}
catch {
    Add-Content $logPath "$(Get-Date): Error in sending ENTER key - $_"
}

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