# Auto click "Next" or "Accept" in Windows OOBE (privacy settings)

Add-Type -AssemblyName System.Windows.Forms
$wshell = New-Object -ComObject wscript.shell

Write-Host "Đang chờ cửa sổ 'privacy settings' xuất hiện..."

for ($i=0; $i -lt 30; $i++) {
    # Tìm và focus cửa sổ có tiêu đề chứa chữ "privacy settings"
    $activated = $wshell.AppActivate("privacy settings")
    if ($activated) {
        Write-Host "Đã tìm thấy cửa sổ 'privacy settings'"
        Start-Sleep -Seconds 2

        # Gửi phím TAB nhiều lần để focus vào nút "Next" hoặc "Accept"
        [System.Windows.Forms.SendKeys]::SendWait("{TAB}{TAB}{TAB}{ENTER}")
        Write-Host "Đã bấm ENTER (Next/Accept)"
        break
    }
    Start-Sleep -Seconds 2
}
