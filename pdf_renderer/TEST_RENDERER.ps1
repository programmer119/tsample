param(
  [string]$RendererUrl = "http://127.0.0.1:8080",
  [string]$RenderKey = "temperament-test-renderer"
)
$ErrorActionPreference = "Stop"
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$Payload = Join-Path $Here "sample-payload.json"
$Output = Join-Path $Here "sample-output.pdf"
Invoke-WebRequest -Uri "$($RendererUrl.TrimEnd('/'))/render" `
  -Method Post `
  -Headers @{"X-Render-Key"=$RenderKey} `
  -ContentType "application/json" `
  -InFile $Payload `
  -OutFile $Output
Write-Host "PDF 생성 완료: $Output" -ForegroundColor Green
