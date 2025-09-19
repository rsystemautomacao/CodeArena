@echo off
title CodeArena Admin Panel
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    🚀 CodeArena Admin Panel                 ║
echo ║              Sistema de Administração e Testes              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado! Instale o Node.js primeiro.
    echo 🌐 Download: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar se estamos no diretório correto
if not exist "package.json" (
    echo ❌ Execute este script no diretório raiz do projeto CodeArena!
    pause
    exit /b 1
)

REM Verificar se as dependências estão instaladas
if not exist "node_modules" (
    echo 📦 Instalando dependências...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Erro ao instalar dependências!
        pause
        exit /b 1
    )
)

REM Iniciar o Admin Panel
echo 🚀 Iniciando CodeArena Admin Panel...
echo.
node admin.js

pause
