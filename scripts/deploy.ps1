# GDL_Tutorial 一键部署到公司站点资源目录
# 用法：在项目根执行  powershell -File scripts\deploy.ps1
# 前提：本机已配置可免密登录服务器的 SSH key（root@47.93.210.248）

$ErrorActionPreference = 'Stop'
$root   = Split-Path -Parent $PSScriptRoot
$server = 'root@47.93.210.248'
$target = '/www/wwwroot/kbitai.com.cn/resources/GDL_Tutorial'
$tarball = '.deploy\gdl_dist.tar.gz'

Push-Location $root
try {
  # 1. 按子路径构建（改路径只改这两行变量）
  $env:GDL_BASE = '/resources/GDL_Tutorial/'
  $env:GDL_SITE_URL = 'https://www.kbitai.com.cn'
  npm run build
  if ($LASTEXITCODE -ne 0) { throw 'build 失败' }

  # 2. 打包与上传
  New-Item -ItemType Directory -Force '.deploy' | Out-Null
  tar -czf $tarball -C 'docs/.vitepress/dist' .
  scp -o BatchMode=yes $tarball 'scripts/remote-extract.sh' "${server}:/tmp/"
  if ($LASTEXITCODE -ne 0) { throw 'scp 失败' }

  # 3. 远端解包并归位权限
  ssh -o BatchMode=yes $server "T=$target sh /tmp/remote-extract.sh; rm -f /tmp/remote-extract.sh"
  if ($LASTEXITCODE -ne 0) { throw '远端解包失败' }

  # 4. 抽查首页
  $r = Invoke-WebRequest -Uri 'https://www.kbitai.com.cn/resources/GDL_Tutorial/' -UseBasicParsing -TimeoutSec 20
  Write-Host "部署完成：HTTP $($r.StatusCode)  $([math]::Round($r.RawContentLength / 1KB, 1))KB"
}
finally {
  Pop-Location
}
