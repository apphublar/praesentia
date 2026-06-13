Add-Type -AssemblyName System.Drawing

function New-PraesentiaIcon {
  param(
    [int]$Size,
    [string]$Path
  )

  $bmp = New-Object System.Drawing.Bitmap $Size, $Size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::FromArgb(244, 237, 223))

  $penWidth = [float]($Size * 0.047)
  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(34, 27, 20)), $penWidth
  $margin = [float]($Size * 0.15)
  $g.DrawEllipse($pen, $margin, $margin, $Size - 2 * $margin, $Size - 2 * $margin)

  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(242, 107, 90))
  $r = [float]($Size * 0.14)
  $g.FillEllipse($brush, ($Size / 2 - $r), ($Size / 2 - $r), 2 * $r, 2 * $r)

  $dir = Split-Path $Path -Parent
  if (!(Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir | Out-Null
  }

  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
  $pen.Dispose()
  $brush.Dispose()
}

$root = Split-Path $PSScriptRoot -Parent
$iconDir = Join-Path $root "public\icons"
New-PraesentiaIcon -Size 512 -Path (Join-Path $iconDir "icon-512.png")
New-PraesentiaIcon -Size 512 -Path (Join-Path $iconDir "icon-512-maskable.png")
New-PraesentiaIcon -Size 192 -Path (Join-Path $iconDir "icon-192.png")

Write-Host "PWA icons generated in $iconDir"
