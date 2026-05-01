$videoPath = 'C:\Users\jbmoh\OneDrive\Pictures\Recording 2026-04-30 214729.mp4'
$outDir = 'C:\MyGuys_App\tmp_video_frames_issue'

Add-Type -AssemblyName PresentationCore
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$player = New-Object System.Windows.Media.MediaPlayer
$player.Open([Uri]$videoPath)
Start-Sleep -Seconds 2

Write-Output "duration=$($player.NaturalDuration.TimeSpan) width=$($player.NaturalVideoWidth) height=$($player.NaturalVideoHeight)"

$times = @(
  [TimeSpan]::FromMilliseconds(100),
  [TimeSpan]::FromMilliseconds(400),
  [TimeSpan]::FromMilliseconds(800)
)

$index = 0
foreach ($time in $times) {
  $player.Position = $time
  Start-Sleep -Milliseconds 300

  $drawingVisual = New-Object System.Windows.Media.DrawingVisual
  $drawingContext = $drawingVisual.RenderOpen()
  $drawingContext.DrawVideo(
    $player,
    (New-Object System.Windows.Rect 0, 0, $player.NaturalVideoWidth, $player.NaturalVideoHeight)
  )
  $drawingContext.Close()

  $bitmap = New-Object System.Windows.Media.Imaging.RenderTargetBitmap(
    $player.NaturalVideoWidth,
    $player.NaturalVideoHeight,
    96,
    96,
    [System.Windows.Media.PixelFormats]::Pbgra32
  )
  $bitmap.Render($drawingVisual)

  $encoder = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
  $encoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($bitmap))

  $path = Join-Path $outDir ("frame_{0}.png" -f $index)
  $stream = [System.IO.File]::Open($path, [System.IO.FileMode]::Create)
  $encoder.Save($stream)
  $stream.Close()
  Write-Output $path
  $index++
}

$player.Close()
