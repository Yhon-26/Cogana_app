@echo off
REM Inicia el servidor WebSocket que conecta opencode/Codex con el plugin de Figma.
REM Debe estar corriendo (puerto 3055) para que el MCP "talkToFigma" funcione.

set BUN=C:\Users\Yhon\.bun\bin\bun.exe
set REPO=C:\Cogana_app\tools\cursor-talk-to-figma-mcp

powershell -NoProfile -Command "if (Test-NetConnection -ComputerName localhost -Port 3055 -InformationLevel Quiet -WarningAction SilentlyContinue) { Write-Host 'El puente de Figma ya esta corriendo en localhost:3055.' } else { Start-Process -FilePath '%BUN%' -ArgumentList 'run','%REPO%\src\socket.ts' -WorkingDirectory '%REPO%' -WindowStyle Hidden; Start-Sleep -Seconds 3; Write-Host 'Puente de Figma iniciado en localhost:3055.' }"

pause
