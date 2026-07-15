param(
  [string]$ProjectId = "",
  [string]$Region = "asia-northeast3",
  [string]$ServiceName = "temperament-pdf-renderer",
  [string]$RenderKey = "temperament-test-renderer"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$RendererDir = Join-Path $Root "pdf_renderer"
$CodeGsPath = Join-Path $Root "apps_script\Code.gs"
$ResultPath = Join-Path $Root "DEPLOY_RESULT.txt"

function Require-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "$Name 명령을 찾을 수 없습니다. Google Cloud CLI 설치 후 다시 실행하세요."
  }
}

Require-Command "gcloud"

$ActiveAccount = (& gcloud auth list --filter="status:ACTIVE" --format="value(account)" 2>$null).Trim()
if ([string]::IsNullOrWhiteSpace($ActiveAccount)) {
  Write-Host "Google Cloud 로그인이 필요합니다." -ForegroundColor Yellow
  & gcloud auth login | Out-Host
}

if ([string]::IsNullOrWhiteSpace($ProjectId)) {
  $ProjectId = (& gcloud config get-value project 2>$null).Trim()
}
if ([string]::IsNullOrWhiteSpace($ProjectId) -or $ProjectId -eq "(unset)") {
  $ProjectId = Read-Host "결제가 연결된 Google Cloud 프로젝트 ID를 입력하세요"
}
if ([string]::IsNullOrWhiteSpace($ProjectId)) {
  throw "Google Cloud 프로젝트 ID가 필요합니다."
}

Write-Host "[1/5] Google Cloud 프로젝트 설정: $ProjectId" -ForegroundColor Cyan
& gcloud config set project $ProjectId | Out-Host

Write-Host "[2/5] Cloud Run 관련 API 활성화" -ForegroundColor Cyan
& gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com | Out-Host

Write-Host "[3/5] Puppeteer PDF 렌더러 배포" -ForegroundColor Cyan
Push-Location $RendererDir
try {
  & gcloud run deploy $ServiceName `
    --source . `
    --region $Region `
    --allow-unauthenticated `
    --set-env-vars "RENDER_KEY=$RenderKey" `
    --memory 1Gi `
    --cpu 1 `
    --concurrency 4 `
    --timeout 120 `
    --min-instances 0 `
    --max-instances 3 `
    --quiet | Out-Host
} finally {
  Pop-Location
}

$ServiceUrl = (& gcloud run services describe $ServiceName --region $Region --format="value(status.url)").Trim()
if ([string]::IsNullOrWhiteSpace($ServiceUrl)) {
  throw "Cloud Run URL을 확인하지 못했습니다."
}

Write-Host "[4/5] 상태 확인: $ServiceUrl/health" -ForegroundColor Cyan
$Health = Invoke-RestMethod -Uri "$ServiceUrl/health" -Method Get -TimeoutSec 30
if (-not $Health.ok) {
  throw "Cloud Run 상태 확인에 실패했습니다."
}

Write-Host "[5/5] Apps Script Code.gs에 렌더러 URL 자동 반영" -ForegroundColor Cyan
$Code = Get-Content -Raw -Encoding UTF8 $CodeGsPath
$Code = [regex]::Replace($Code, "URL:\s*'[^']*'", "URL: '$ServiceUrl'", 1)
$Code = [regex]::Replace($Code, "KEY:\s*'[^']*'", "KEY: '$RenderKey'", 1)
[System.IO.File]::WriteAllText($CodeGsPath, $Code, [System.Text.UTF8Encoding]::new($false))

$Result = @"
Cloud Run 배포 완료

Project: $ProjectId
Region: $Region
Service: $ServiceName
URL: $ServiceUrl
Render Key: $RenderKey
Health: $ServiceUrl/health

다음 작업
1. apps_script\Code.gs 전체를 Apps Script 편집기의 Code.gs에 덮어쓰기
2. 저장
3. 함수 목록에서 configurePdfRenderer 실행
4. testPdfRenderer 또는 regenerateLatestPdf 실행
5. 새 Google Form 제출로 자동 PDF 생성 확인

웹 앱 /exec 재배포는 필요하지 않습니다.
"@
[System.IO.File]::WriteAllText($ResultPath, $Result, [System.Text.UTF8Encoding]::new($false))

Write-Host "" 
Write-Host "배포 완료: $ServiceUrl" -ForegroundColor Green
Write-Host "Code.gs에 URL을 반영했습니다." -ForegroundColor Green
Write-Host "결과 파일: $ResultPath" -ForegroundColor Green
