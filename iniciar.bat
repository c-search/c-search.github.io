@echo off
cd /d "%~dp0"
title C-Search
echo Preparando o C-Search...
py -m pip install -r requirements.txt --quiet

if not exist "web\dist\index.html" (
  echo Montando a interface pela primeira vez...
  pushd web
  call npm install --no-audit --no-fund
  call npm run build
  popd
)

rem Abre o navegador so quando o servidor estiver respondendo
start "" /b powershell -NoProfile -WindowStyle Hidden -Command "for($i=0;$i -lt 60;$i++){try{Invoke-WebRequest http://127.0.0.1:8000/api/config -UseBasicParsing -TimeoutSec 2 | Out-Null; Start-Process 'http://127.0.0.1:8000'; break}catch{Start-Sleep 1}}"

echo.
echo ================================================================
echo   C-Search rodando em http://127.0.0.1:8000
echo   O navegador vai abrir sozinho. Deixe esta janela aberta;
echo   feche ela para desligar o programa.
echo ================================================================
echo.
py -m uvicorn api:app --port 8000
echo.
echo O servidor parou. Se apareceu erro acima, mande um print.
pause
