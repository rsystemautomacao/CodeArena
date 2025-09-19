#!/bin/bash

# Cores para o terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Função para imprimir com cores
print_color() {
    printf "${1}${2}${NC}\n"
}

# Limpar tela
clear

print_color $CYAN "╔══════════════════════════════════════════════════════════════╗"
print_color $CYAN "║                    🚀 CodeArena Admin Panel                 ║"
print_color $CYAN "║              Sistema de Administração e Testes              ║"
print_color $CYAN "╚══════════════════════════════════════════════════════════════╝"
echo

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    print_color $RED "❌ Node.js não encontrado! Instale o Node.js primeiro."
    print_color $BLUE "🌐 Download: https://nodejs.org/"
    exit 1
fi

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    print_color $RED "❌ Execute este script no diretório raiz do projeto CodeArena!"
    exit 1
fi

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    print_color $BLUE "📦 Instalando dependências..."
    npm install
    if [ $? -ne 0 ]; then
        print_color $RED "❌ Erro ao instalar dependências!"
        exit 1
    fi
fi

# Tornar o script admin.js executável
chmod +x admin.js

# Iniciar o Admin Panel
print_color $GREEN "🚀 Iniciando CodeArena Admin Panel..."
echo
node admin.js
