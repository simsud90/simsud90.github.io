Add-Type -AssemblyName System.Drawing
$iconDirectory = Join-Path $PSScriptRoot '../icons'
[System.IO.Directory]::CreateDirectory($iconDirectory) | Out-Null
foreach ($iconSize in @(192, 512)) {
    $bitmap = New-Object System.Drawing.Bitmap($iconSize, $iconSize)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#fcf7ed'))
    $graphics.ScaleTransform($iconSize / 512.0, $iconSize / 512.0)
    $leafBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#7d9d72'))
    foreach ($angle in @(0, 60, 120)) {
        $state = $graphics.Save()
        $graphics.TranslateTransform(256, 256)
        $graphics.RotateTransform($angle)
        $graphics.FillEllipse($leafBrush, -65, -162, 130, 324)
        $graphics.Restore($state)
    }
    $yellowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#f4cc73'))
    $faceBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#426c55'))
    $facePen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#426c55'), 7)
    $facePen.StartCap = $facePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $graphics.FillEllipse($yellowBrush, 191, 191, 130, 130)
    $graphics.FillEllipse($faceBrush, 228, 239, 14, 14)
    $graphics.FillEllipse($faceBrush, 270, 239, 14, 14)
    $graphics.DrawArc($facePen, 234, 254, 44, 38, 15, 150)
    $bitmap.Save((Join-Path $iconDirectory "icon-$iconSize.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $facePen.Dispose()
    $faceBrush.Dispose()
    $yellowBrush.Dispose()
    $leafBrush.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()
}
Write-Output 'Generated 192px and 512px PWA icons.'
