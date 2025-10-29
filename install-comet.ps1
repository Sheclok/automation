# ============================================
# Test Script: Find and log position of a window
# Example: Detect "Welcome to Comet" installer window
# ============================================

Add-Type @"
using System;
using System.Runtime.InteropServices;

public class Win32 {
    [DllImport("user32.dll", SetLastError=true)]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }
}
"@

# Step 1: Find the installer window by title
$windowTitle = "Welcome to Comet"   # Change if needed, e.g. "Comet Installer"
$hwnd = [Win32]::FindWindow([IntPtr]::Zero, $windowTitle)

if ($hwnd -eq [IntPtr]::Zero) {
    Write-Host "❌ Window not found: '$windowTitle'"
    exit
}

Write-Host "✅ Window found! Handle = $hwnd"

# Step 2: Get window rectangle (position and size)
[Win32+RECT]$rect = New-Object Win32+RECT
$result = [Win32]::GetWindowRect($hwnd, [ref]$rect)

if (-not $result) {
    Write-Host "❌ Failed to get window RECT"
    exit
}

$width = $rect.Right - $rect.Left
$height = $rect.Bottom - $rect.Top

Write-Host "📍 Window position:"
Write-Host "   Left:   $($rect.Left)"
Write-Host "   Top:    $($rect.Top)"
Write-Host "   Right:  $($rect.Right)"
Write-Host "   Bottom: $($rect.Bottom)"
Write-Host "   Width:  $width"
Write-Host "   Height: $height"
