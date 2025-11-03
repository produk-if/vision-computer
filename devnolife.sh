#!/bin/bash
# Anti-Plagiasi System - All-in-One Master Script
# One script to rule them all!
# Created by devnolife

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# Project directories
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"
LOG_DIR="$BACKEND_DIR/logs"
PID_DIR="$BACKEND_DIR/pids"

# PID files
API_PID_FILE="$PID_DIR/api.pid"
WORKER_PID_FILE="$PID_DIR/celery_worker.pid"
REDIS_PID_FILE="$PID_DIR/redis.pid"

# Log files
API_LOG="$LOG_DIR/api.log"
WORKER_LOG="$LOG_DIR/celery_worker.log"
REDIS_LOG="$LOG_DIR/redis.log"

# ═══════════════════════════════════════════════════════════════════
# UTILITY FUNCTIONS
# ═══════════════════════════════════════════════════════════════════

show_banner() {
    clear
    echo -e "${CYAN}${BOLD}"
    echo "╔═══════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                       ║"
    echo "║     █████╗ ███╗   ██╗████████╗██╗      ██████╗ ██╗      █████╗       ║"
    echo "║    ██╔══██╗████╗  ██║╚══██╔══╝██║      ██╔══██╗██║     ██╔══██╗      ║"
    echo "║    ███████║██╔██╗ ██║   ██║   ██║█████╗██████╔╝██║     ███████║      ║"
    echo "║    ██╔══██║██║╚██╗██║   ██║   ██║╚════╝██╔═══╝ ██║     ██╔══██║      ║"
    echo "║    ██║  ██║██║ ╚████║   ██║   ██║      ██║     ███████╗██║  ██║      ║"
    echo "║    ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚═╝      ╚═╝     ╚══════╝╚═╝  ╚═╝      ║"
    echo "║                                                                       ║"
    echo "║       ██████╗ ██╗ █████╗ ███████╗██╗    ██████╗ ███████╗██╗          ║"
    echo "║      ██╔════╝ ██║██╔══██╗██╔════╝██║    ██╔══██╗██╔════╝██║          ║"
    echo "║      ██║  ███╗██║███████║███████╗██║    ██████╔╝███████╗██║          ║"
    echo "║      ██║   ██║██║██╔══██║╚════██║██║    ██╔══██╗╚════██║██║          ║"
    echo "║      ╚██████╔╝██║██║  ██║███████║██║    ██║  ██║███████║██║          ║"
    echo "║       ╚═════╝ ╚═╝╚═╝  ╚═╝╚══════╝╚═╝    ╚═╝  ╚═╝╚══════╝╚═╝          ║"
    echo "║                                                                       ║"
    echo "║                 ${WHITE}${BOLD}MASTER CONTROL PANEL v2.1.0${CYAN}${BOLD}                       ║"
    echo "║                                                                       ║"
    echo "╚═══════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${MAGENTA}${BOLD}           ⚡ Crafted with passion by devnolife ⚡${NC}"
    echo ""
}

show_menu() {
    echo -e "${BOLD}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BOLD}${CYAN}🎯 Main Menu:${NC}"
    echo ""
    echo -e "  ${GREEN}${BOLD}[1]${NC} 🚀 ${WHITE}Initialize Project${NC}           ${DIM}Setup everything from scratch${NC}"
    echo -e "  ${GREEN}${BOLD}[2]${NC} ▶️  ${WHITE}Start Backend Services${NC}       ${DIM}Start API + Celery + Redis${NC}"
    echo -e "  ${GREEN}${BOLD}[3]${NC} 🌐 ${WHITE}Start Frontend${NC}                ${DIM}Start Next.js dev server${NC}"
    echo -e "  ${GREEN}${BOLD}[4]${NC} 🚀 ${WHITE}Start All (Backend + Frontend)${NC} ${DIM}Start everything${NC}"
    echo ""
    echo -e "  ${YELLOW}${BOLD}[5]${NC} ⏸️  ${WHITE}Stop Backend Services${NC}        ${DIM}Stop all backend services${NC}"
    echo -e "  ${YELLOW}${BOLD}[6]${NC} 🔄 ${WHITE}Restart Backend Services${NC}     ${DIM}Restart all backend services${NC}"
    echo -e "  ${YELLOW}${BOLD}[14]${NC} 🔄 ${WHITE}Restart Redis Only${NC}           ${DIM}Restart Redis without other services${NC}"
    echo -e "  ${YELLOW}${BOLD}[15]${NC} 🔄 ${WHITE}Restart Celery Workers Only${NC}  ${DIM}Restart Celery without other services${NC}"
    echo ""
    echo -e "  ${BLUE}${BOLD}[7]${NC} 📊 ${WHITE}Check Status${NC}                  ${DIM}View service status${NC}"
    echo -e "  ${BLUE}${BOLD}[8]${NC} 📋 ${WHITE}View Logs${NC}                     ${DIM}Real-time logs monitoring${NC}"
    echo -e "  ${BLUE}${BOLD}[9]${NC} 📈 ${WHITE}Monitor Services${NC}              ${DIM}Auto-refresh monitoring${NC}"
    echo ""
    echo -e "  ${MAGENTA}${BOLD}[10]${NC} 🔑 ${WHITE}Generate New API Key${NC}       ${DIM}Create new secure API key${NC}"
    echo -e "  ${MAGENTA}${BOLD}[11]${NC} 🗄️  ${WHITE}Database Management${NC}        ${DIM}Prisma Studio${NC}"
    echo -e "  ${MAGENTA}${BOLD}[12]${NC} 📚 ${WHITE}View Documentation${NC}          ${DIM}Open README${NC}"
    echo -e "  ${MAGENTA}${BOLD}[13]${NC} ℹ️  ${WHITE}System Information${NC}         ${DIM}Show system info${NC}"
    echo ""
    echo -e "  ${RED}${BOLD}[0]${NC} 🚪 ${WHITE}Exit${NC}"
    echo ""
    echo -e "${BOLD}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

press_enter() {
    echo ""
    echo -e "${DIM}Press Enter to continue...${NC}"
    read
}

log_step() {
    echo -e "${BOLD}${BLUE}[STEP] ${NC}$1${NC}"
}

log_success() {
    echo -e "${GREEN}${BOLD}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}${BOLD}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}${BOLD}⚠️  $1${NC}"
}

log_info() {
    echo -e "${CYAN}${DIM}ℹ️  $1${NC}"
}

loading_animation() {
    local message=$1
    local duration=${2:-3}
    echo -ne "${DIM}   $message"
    for i in $(seq 1 $duration); do
        sleep 0.5
        echo -ne "."
    done
    echo -e "${NC}"
}

# ═══════════════════════════════════════════════════════════════════
# SERVICE MANAGEMENT FUNCTIONS
# ═══════════════════════════════════════════════════════════════════

check_running() {
    local pid_file=$1
    local service_name=$2

    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "${YELLOW}${BOLD}⚠️  $service_name is already running ${NC}${CYAN}(PID: $pid)${NC}"
            return 0
        else
            echo -e "${DIM}${YELLOW}🧹 Removing stale PID file for $service_name${NC}"
            rm -f "$pid_file"
        fi
    fi
    return 1
}

start_redis() {
    echo -e "${BOLD}${BLUE}[1/3] 🚀 Starting Redis Server...${NC}"
    
    # Check if Redis is already running by checking the actual process
    if pgrep -x "redis-server" > /dev/null 2>&1; then
        local existing_pid=$(pgrep -x "redis-server" | head -1)
        
        # Check if it's responding
        if redis-cli ping > /dev/null 2>&1; then
            echo -e "${GREEN}${BOLD}      ✅ Redis is already running ${NC}${DIM}(PID: $existing_pid)${NC}"
            echo -e "${DIM}      Using existing Redis instance${NC}"
            # Save PID to file for tracking
            echo $existing_pid > "$REDIS_PID_FILE"
            return 0
        else
            # Redis process exists but not responding, kill it
            echo -e "${YELLOW}${BOLD}      ⚠️  Found stale Redis process, cleaning up...${NC}"
            kill -9 $existing_pid 2>/dev/null || true
            sleep 1
        fi
    fi
    
    if check_running "$REDIS_PID_FILE" "Redis"; then
        return 0
    fi

    # Check for incompatible dump.rdb file
    if [ -f "$PROJECT_ROOT/dump.rdb" ]; then
        # Try to detect if dump.rdb is incompatible
        if redis-server --test-memory 1 > /dev/null 2>&1; then
            # Redis is working, test if dump.rdb can be loaded
            redis-server --dir "$PROJECT_ROOT" --dbfilename dump.rdb --port 0 --save "" > /tmp/redis-test.log 2>&1 &
            local test_pid=$!
            sleep 0.5
            
            if grep -q "Can't handle RDB format version" /tmp/redis-test.log 2>/dev/null; then
                kill -9 $test_pid 2>/dev/null || true
                echo -e "${YELLOW}${BOLD}      ⚠️  Incompatible Redis database file detected${NC}"
                echo -e "${DIM}      Backing up old dump.rdb...${NC}"
                mv "$PROJECT_ROOT/dump.rdb" "$PROJECT_ROOT/dump.rdb.backup-incompatible-$(date +%s)"
                echo -e "${GREEN}      ✓ Backup created, starting with fresh database${NC}"
            else
                kill -9 $test_pid 2>/dev/null || true
            fi
        fi
    fi

    nohup redis-server --dir "$PROJECT_ROOT" --logfile "$REDIS_LOG" > "$REDIS_LOG" 2>&1 &
    echo $! > "$REDIS_PID_FILE"

    echo -ne "${DIM}      Loading"
    for i in {1..3}; do
        sleep 0.5
        echo -ne "."
    done
    echo -e "${NC}"
    sleep 0.5

    if ps -p $(cat "$REDIS_PID_FILE") > /dev/null 2>&1; then
        # Verify Redis is actually responding
        if redis-cli ping > /dev/null 2>&1; then
            echo -e "${GREEN}${BOLD}      ✅ Redis started successfully ${NC}${DIM}(PID: $(cat $REDIS_PID_FILE))${NC}"
        else
            echo -e "${YELLOW}${BOLD}      ⚠️  Redis started but not responding, checking logs...${NC}"
            
            # Check if RDB format error
            if grep -q "Can't handle RDB format version" "$REDIS_LOG" 2>/dev/null; then
                echo -e "${YELLOW}      Incompatible database file, cleaning up...${NC}"
                kill -9 $(cat "$REDIS_PID_FILE") 2>/dev/null || true
                rm -f "$REDIS_PID_FILE"
                
                # Backup and retry
                if [ -f "$PROJECT_ROOT/dump.rdb" ]; then
                    mv "$PROJECT_ROOT/dump.rdb" "$PROJECT_ROOT/dump.rdb.backup-$(date +%s)"
                fi
                
                # Retry start
                nohup redis-server --dir "$PROJECT_ROOT" --logfile "$REDIS_LOG" > "$REDIS_LOG" 2>&1 &
                echo $! > "$REDIS_PID_FILE"
                sleep 1
                
                if redis-cli ping > /dev/null 2>&1; then
                    echo -e "${GREEN}${BOLD}      ✅ Redis started successfully with fresh database ${NC}${DIM}(PID: $(cat $REDIS_PID_FILE))${NC}"
                else
                    echo -e "${RED}${BOLD}      ❌ Failed to start Redis${NC}"
                    return 1
                fi
            else
                echo -e "${RED}${BOLD}      ❌ Failed to start Redis${NC}"
                echo -e "${DIM}      Check log: $REDIS_LOG${NC}"
                return 1
            fi
        fi
    else
        echo -e "${RED}${BOLD}      ❌ Failed to start Redis${NC}"
        return 1
    fi
}

start_api() {
    echo -e "${BOLD}${MAGENTA}[2/3] 🌐 Starting FastAPI with Gunicorn...${NC}"
    if check_running "$API_PID_FILE" "FastAPI"; then
        return 0
    fi

    cd "$BACKEND_DIR"
    nohup gunicorn app.main:app \
        --workers 4 \
        --worker-class uvicorn.workers.UvicornWorker \
        --bind 0.0.0.0:8000 \
        --timeout 300 \
        --keep-alive 5 \
        --log-level info \
        --access-logfile "$LOG_DIR/access.log" \
        --error-logfile "$LOG_DIR/error.log" \
        --pid "$API_PID_FILE" \
        > "$API_LOG" 2>&1 &

    echo -ne "${DIM}      Loading"
    for i in {1..5}; do
        sleep 0.5
        echo -ne "."
    done
    echo -e "${NC}"
    sleep 0.5

    if [ -f "$API_PID_FILE" ] && ps -p $(cat "$API_PID_FILE") > /dev/null 2>&1; then
        echo -e "${GREEN}${BOLD}      ✅ FastAPI started successfully ${NC}${DIM}(PID: $(cat $API_PID_FILE))${NC}"
        echo -e "${DIM}${CYAN}      └─ Running on http://0.0.0.0:8000 with 4 workers${NC}"
    else
        echo -e "${RED}${BOLD}      ❌ Failed to start FastAPI${NC}"
        return 1
    fi
}

start_celery() {
    echo -e "${BOLD}${YELLOW}[3/3] 🔥 Starting Celery Workers...${NC}"
    if check_running "$WORKER_PID_FILE" "Celery Workers"; then
        return 0
    fi

    cd "$BACKEND_DIR"
    nohup celery -A app.celery_app worker \
        --loglevel=info \
        --concurrency=4 \
        --pool=prefork \
        --queues=unified,analysis,matching,bypass \
        --max-tasks-per-child=10 \
        --time-limit=600 \
        --soft-time-limit=540 \
        --pidfile="$WORKER_PID_FILE" \
        --logfile="$WORKER_LOG" \
        > "$WORKER_LOG" 2>&1 &

    echo -ne "${DIM}      Loading"
    for i in {1..5}; do
        sleep 0.5
        echo -ne "."
    done
    echo -e "${NC}"
    sleep 1

    # Wait for PID file to be created by Celery
    local wait_count=0
    while [ ! -f "$WORKER_PID_FILE" ] && [ $wait_count -lt 10 ]; do
        sleep 0.5
        wait_count=$((wait_count + 1))
    done

    if [ -f "$WORKER_PID_FILE" ] && ps -p $(cat "$WORKER_PID_FILE") > /dev/null 2>&1; then
        echo -e "${GREEN}${BOLD}      ✅ Celery Workers started successfully ${NC}${DIM}(PID: $(cat $WORKER_PID_FILE))${NC}"
        echo -e "${DIM}${CYAN}      └─ Concurrency: 4 | Queues: unified, analysis, matching, bypass${NC}"
    else
        echo -e "${RED}${BOLD}      ❌ Failed to start Celery Workers${NC}"
        return 1
    fi
}

stop_service() {
    local pid_file=$1
    local service_name=$2
    local signal=${3:-TERM}
    local color=$4

    if [ ! -f "$pid_file" ]; then
        echo -e "${DIM}${YELLOW}      ⚠️  $service_name is not running ${NC}${DIM}(no PID file)${NC}"
        return 0
    fi

    local pid=$(cat "$pid_file")

    if ! ps -p $pid > /dev/null 2>&1; then
        echo -e "${DIM}${YELLOW}      ⚠️  $service_name is not running ${NC}${DIM}(stale PID file)${NC}"
        rm -f "$pid_file"
        return 0
    fi

    echo -e "${BOLD}${color}      🛑 Stopping $service_name ${NC}${DIM}(PID: $pid)${NC}"
    kill -$signal $pid

    local count=0
    echo -ne "${DIM}         Waiting"
    while ps -p $pid > /dev/null 2>&1 && [ $count -lt 10 ]; do
        sleep 0.5
        echo -ne "."
        count=$((count + 1))
    done
    echo -e "${NC}"

    if ps -p $pid > /dev/null 2>&1; then
        echo -e "${YELLOW}${BOLD}         ⚡ Force killing $service_name...${NC}"
        kill -9 $pid 2>/dev/null || true
        sleep 0.5
    fi

    rm -f "$pid_file"
    echo -e "${GREEN}${BOLD}      ✅ $service_name stopped successfully${NC}"
}

check_service() {
    local pid_file=$1
    local service_name=$2
    local icon=$3
    local color=$4

    if [ ! -f "$pid_file" ]; then
        echo -e "${DIM}├─${NC} $icon ${color}${service_name}${NC}$(printf '%*s' $((30-${#service_name})) '')${RED}${BOLD}⭘ NOT RUNNING${NC} ${DIM}(no PID file)${NC}"
        return 1
    fi

    local pid=$(cat "$pid_file")

    if ps -p $pid > /dev/null 2>&1; then
        local cpu_mem=$(ps -p $pid -o %cpu,%mem --no-headers 2>/dev/null | awk '{print $1"% CPU, "$2"% MEM"}')
        echo -e "${DIM}├─${NC} $icon ${color}${service_name}${NC}$(printf '%*s' $((30-${#service_name})) '')${GREEN}${BOLD}● RUNNING${NC} ${DIM}(PID: $pid | $cpu_mem)${NC}"
        return 0
    else
        echo -e "${DIM}├─${NC} $icon ${color}${service_name}${NC}$(printf '%*s' $((30-${#service_name})) '')${RED}${BOLD}⭘ NOT RUNNING${NC} ${DIM}(stale PID: $pid)${NC}"
        return 1
    fi
}

# ═══════════════════════════════════════════════════════════════════
# INITIALIZATION FUNCTIONS
# ═══════════════════════════════════════════════════════════════════

check_prerequisites() {
    log_step "Checking prerequisites..."
    echo ""

    local all_ok=true

    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version | awk '{print $2}')
        log_success "Python: $PYTHON_VERSION"
    else
        log_error "Python 3 is not installed"
        all_ok=false
    fi

    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_success "Node.js: $NODE_VERSION"
    else
        log_error "Node.js is not installed"
        all_ok=false
    fi

    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        log_success "npm: v$NPM_VERSION"
    else
        log_error "npm is not installed"
        all_ok=false
    fi

    if command -v redis-server &> /dev/null; then
        log_success "Redis: Available"
    else
        log_warning "Redis not found (optional, but needed for Celery)"
    fi

    if command -v psql &> /dev/null; then
        log_success "PostgreSQL: Available"
    else
        log_warning "PostgreSQL not found (optional, needed for frontend DB)"
    fi

    echo ""

    if [ "$all_ok" = false ]; then
        log_error "Missing required dependencies. Please install them first."
        return 1
    fi
    return 0
}

generate_api_key_func() {
    log_step "Generating secure API key..."
    echo ""

    API_KEY="apk_$(LC_ALL=C tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c 48)"

    log_success "API Key generated successfully"
    echo -e "${DIM}   Key: ${CYAN}${API_KEY}${NC}"
    echo ""
}

setup_backend_env() {
    log_step "Setting up Backend environment..."
    echo ""

    if [ -f "$PROJECT_ROOT/.env" ]; then
        log_warning ".env already exists. Creating backup..."
        cp "$PROJECT_ROOT/.env" "$PROJECT_ROOT/.env.backup.$(date +%s)"
    fi

    cat > "$PROJECT_ROOT/.env" << ENVFILE
# Anti-Plagiasi Backend Configuration
# Auto-generated on $(date '+%Y-%m-%d %H:%M:%S')
# Created by devnolife

API_KEY=${API_KEY}

# Next.js Integration
NEXTJS_API_URL=http://localhost:3000

# Redis Configuration
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Upload Configuration
UPLOAD_DIR=./backend/uploads
OUTPUT_DIR=./backend/outputs
TEMP_DIR=./backend/temp

# Processing Configuration
MAX_UPLOAD_SIZE=10485760
ALLOWED_EXTENSIONS=docx,doc,pdf

# Environment
ENVIRONMENT=development
DEBUG=true
ENVFILE

    log_success "Backend .env created with API key"
    log_info "Location: $PROJECT_ROOT/.env"
    echo ""
}

setup_frontend_env() {
    log_step "Setting up Frontend environment..."
    echo ""

    if [ -f "$FRONTEND_DIR/.env" ]; then
        log_warning ".env already exists. Creating backup..."
        cp "$FRONTEND_DIR/.env" "$FRONTEND_DIR/.env.backup.$(date +%s)"
    fi

    echo -e "${YELLOW}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}${BOLD}              Database Configuration${NC}"
    echo -e "${YELLOW}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${CYAN}${BOLD}🗄️  PostgreSQL Database Setup${NC}"
    echo -e "${DIM}Configure your PostgreSQL connection details${NC}"
    echo -e "${DIM}Press Enter to use default values shown in [brackets]${NC}"
    echo ""

    read -p "$(echo -e ${CYAN}Database Host${NC}) [localhost]: " DB_HOST
    DB_HOST=${DB_HOST:-"localhost"}

    read -p "$(echo -e ${CYAN}Database Port${NC}) [5432]: " DB_PORT
    DB_PORT=${DB_PORT:-"5432"}

    read -p "$(echo -e ${CYAN}Database Username${NC}) [postgres]: " DB_USER
    DB_USER=${DB_USER:-"postgres"}

    read -sp "$(echo -e ${CYAN}Database Password${NC}) [postgres]: " DB_PASSWORD
    DB_PASSWORD=${DB_PASSWORD:-"postgres"}
    echo ""

    read -p "$(echo -e ${CYAN}Database Name${NC}) [antiplagiasi]: " DB_NAME
    DB_NAME=${DB_NAME:-"antiplagiasi"}

    read -p "$(echo -e ${CYAN}Database Schema${NC}) [public]: " DB_SCHEMA
    DB_SCHEMA=${DB_SCHEMA:-"public"}

    DB_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=${DB_SCHEMA}"

    echo ""
    echo -e "${GREEN}${BOLD}✅ Database Configuration:${NC}"
    echo -e "${DIM}├─${NC} Host:     ${CYAN}${DB_HOST}:${DB_PORT}${NC}"
    echo -e "${DIM}├─${NC} Database: ${CYAN}${DB_NAME}${NC}"
    echo -e "${DIM}├─${NC} Schema:   ${CYAN}${DB_SCHEMA}${NC}"
    echo -e "${DIM}└─${NC} User:     ${CYAN}${DB_USER}${NC}"
    echo ""

    NEXTAUTH_SECRET=$(LC_ALL=C tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c 64)

    cat > "$FRONTEND_DIR/.env" << ENVFILE
# Anti-Plagiasi Frontend Configuration
# Auto-generated on $(date '+%Y-%m-%d %H:%M:%S')
# Created by devnolife

# Database
DATABASE_URL="${DB_URL}"

# Next.js Application
NEXT_PUBLIC_API_URL="http://localhost:3000"

# NextAuth
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"
NEXTAUTH_URL="http://localhost:3000"

# Python API
PYTHON_API_URL="http://localhost:8000"
PYTHON_API_KEY=${API_KEY}
PYTHON_API_TIMEOUT="300000"

# Upload Configuration
MAX_FILE_SIZE="10485760"
UPLOAD_DIR="./uploads"
OUTPUT_DIR="./uploads"

# Feature Flags
ENABLE_OCR="true"
ENABLE_ANALYTICS="true"
ENABLE_EMAIL_NOTIFICATIONS="false"
ENVFILE

    log_success "Frontend .env created with same API key"
    log_info "Location: $FRONTEND_DIR/.env"
    echo ""
}

install_backend_deps() {
    log_step "Installing Backend Python dependencies..."
    echo ""

    if [ ! -f "$BACKEND_DIR/requirements.txt" ]; then
        log_warning "requirements.txt not found, skipping..."
        return
    fi

    loading_animation "Installing packages" 5
    pip install -q -r "$BACKEND_DIR/requirements.txt"

    log_success "Backend dependencies installed"
    echo ""
}

install_frontend_deps() {
    log_step "Installing Frontend Node.js dependencies..."
    echo ""

    if [ ! -d "$FRONTEND_DIR" ]; then
        log_warning "Frontend directory not found, skipping..."
        return
    fi

    cd "$FRONTEND_DIR"

    if [ ! -f "package.json" ]; then
        log_warning "package.json not found, skipping..."
        return
    fi

    loading_animation "Installing packages (this may take a while)" 8
    npm install --silent

    log_success "Frontend dependencies installed"
    echo ""
}

setup_database() {
    log_step "Setting up Frontend database with Prisma..."
    echo ""

    if [ ! -d "$FRONTEND_DIR" ]; then
        log_warning "Frontend directory not found, skipping database setup..."
        return
    fi

    cd "$FRONTEND_DIR"

    if [ ! -f "prisma/schema.prisma" ]; then
        log_warning "Prisma schema not found, skipping database setup..."
        return
    fi

    echo -e "${CYAN}${BOLD}Testing database connection...${NC}"

    if command -v psql &> /dev/null; then
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c '\q' &> /dev/null

        if [ $? -eq 0 ]; then
            log_success "Database connection successful"

            DB_EXISTS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")

            if [ "$DB_EXISTS" = "1" ]; then
                log_info "Database '$DB_NAME' already exists"
            else
                log_warning "Database '$DB_NAME' does not exist"
                echo -e "${YELLOW}${BOLD}Would you like to create it? (y/n) [y]: ${NC}"
                read -r create_db
                create_db=${create_db:-"y"}

                if [ "$create_db" = "y" ] || [ "$create_db" = "Y" ]; then
                    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;" &> /dev/null

                    if [ $? -eq 0 ]; then
                        log_success "Database '$DB_NAME' created successfully"
                    else
                        log_error "Failed to create database"
                    fi
                fi
            fi
        else
            log_warning "Could not connect to PostgreSQL server"
        fi
    else
        log_warning "psql command not found, skipping database connection test"
    fi

    echo ""
    log_info "Generating Prisma Client..."
    npx prisma generate --silent || true

    log_info "Pushing database schema..."
    npx prisma db push --skip-generate --accept-data-loss 2>&1 | grep -v "warn" || true

    log_success "Database setup completed"
    echo ""
}

create_directories() {
    log_step "Creating necessary directories..."
    echo ""

    mkdir -p "$BACKEND_DIR/uploads" "$BACKEND_DIR/outputs" "$BACKEND_DIR/temp" "$BACKEND_DIR/logs" "$BACKEND_DIR/pids"

    log_success "Backend directories created"
    log_info "Created: backend/uploads, backend/outputs, backend/temp, backend/logs, backend/pids"
    echo ""
}

# ═══════════════════════════════════════════════════════════════════
# MENU OPTIONS
# ═══════════════════════════════════════════════════════════════════

option_init() {
    show_banner
    echo -e "${BOLD}${GREEN}[1] 🚀 Initialize Project${NC}"
    echo -e "${BOLD}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    if ! check_prerequisites; then
        press_enter
        return
    fi

    generate_api_key_func
    setup_backend_env
    setup_frontend_env
    install_backend_deps
    install_frontend_deps
    create_directories
    setup_database

    echo ""
    echo -e "${BOLD}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${GREEN}${BOLD}   🎉 INITIALIZATION COMPLETED SUCCESSFULLY! 🎉${NC}"
    echo ""
    echo -e "${BOLD}${CYAN}🔐 API Key:${NC} ${CYAN}${API_KEY}${NC}"
    echo -e "${BOLD}${CYAN}🗄️  Database:${NC} ${CYAN}${DB_NAME}${NC} on ${CYAN}${DB_HOST}:${DB_PORT}${NC}"
    echo ""
    echo -e "${BOLD}${CYAN}🚀 Next Steps:${NC}"
    echo -e "   ${DIM}1. Start Backend: Choose option [2]${NC}"
    echo -e "   ${DIM}2. Start Frontend: Choose option [3]${NC}"
    echo ""

    press_enter
}

option_start_backend() {
    show_banner
    echo -e "${BOLD}${GREEN}[2] ▶️  Start Backend Services${NC}"
    echo -e "${BOLD}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # Create necessary directories
    mkdir -p "$LOG_DIR" "$PID_DIR" "$BACKEND_DIR/uploads" "$BACKEND_DIR/outputs" "$BACKEND_DIR/temp"

    # Check if gunicorn is installed
    if ! command -v gunicorn &> /dev/null; then
        echo -e "${YELLOW}${BOLD}📦 Gunicorn not found. Installing...${NC}"
        pip install gunicorn
        echo ""
    fi

    # Check if redis-server is installed
    if ! command -v redis-server &> /dev/null; then
        echo -e "${YELLOW}${BOLD}📦 Redis not found. Installing automatically...${NC}"
        echo ""
        
        # Auto-install Redis based on OS
        if command -v apt-get &> /dev/null; then
            echo -e "${CYAN}${BOLD}🔧 Detected Ubuntu/Debian system${NC}"
            echo -e "${DIM}Installing redis-server via apt...${NC}"
            echo ""
            sudo apt-get update -qq
            sudo apt-get install -y redis-server
            
            if [ $? -eq 0 ]; then
                log_success "Redis installed successfully"
                echo ""
                
                # Clean up old incompatible dump.rdb if exists
                if [ -f "$PROJECT_ROOT/dump.rdb" ]; then
                    echo -e "${YELLOW}${BOLD}🧹 Backing up old Redis database file...${NC}"
                    mv "$PROJECT_ROOT/dump.rdb" "$PROJECT_ROOT/dump.rdb.backup-$(date +%s)" 2>/dev/null
                    echo -e "${DIM}Old dump.rdb backed up${NC}"
                    echo ""
                fi
            else
                log_error "Failed to install Redis"
                press_enter
                return
            fi
        elif command -v brew &> /dev/null; then
            echo -e "${CYAN}${BOLD}🔧 Detected macOS system${NC}"
            echo -e "${DIM}Installing redis via Homebrew...${NC}"
            echo ""
            brew install redis
            
            if [ $? -eq 0 ]; then
                log_success "Redis installed successfully"
                echo ""
            else
                log_error "Failed to install Redis"
                press_enter
                return
            fi
        else
            log_error "Unsupported OS. Please install Redis manually:"
            echo -e "${DIM}Ubuntu/Debian: sudo apt-get install redis-server${NC}"
            echo -e "${DIM}macOS: brew install redis${NC}"
            press_enter
            return
        fi
    fi

    # Check if OCRmyPDF is installed
    if ! command -v ocrmypdf &> /dev/null; then
        echo -e "${YELLOW}${BOLD}📦 OCRmyPDF not found. Installing automatically...${NC}"
        echo ""
        
        # Auto-install OCRmyPDF based on OS
        if command -v apt-get &> /dev/null; then
            echo -e "${CYAN}${BOLD}🔧 Installing OCRmyPDF and Tesseract OCR...${NC}"
            echo -e "${DIM}This is required for PDF text extraction${NC}"
            echo ""
            sudo apt-get install -y ocrmypdf tesseract-ocr tesseract-ocr-eng ghostscript
            
            if [ $? -eq 0 ]; then
                log_success "OCRmyPDF and Tesseract installed successfully"
                echo ""
            else
                log_error "Failed to install OCRmyPDF"
                press_enter
                return
            fi
        elif command -v brew &> /dev/null; then
            echo -e "${CYAN}${BOLD}🔧 Installing OCRmyPDF and Tesseract OCR...${NC}"
            echo -e "${DIM}This is required for PDF text extraction${NC}"
            echo ""
            brew install ocrmypdf tesseract
            
            if [ $? -eq 0 ]; then
                log_success "OCRmyPDF and Tesseract installed successfully"
                echo ""
            else
                log_error "Failed to install OCRmyPDF"
                press_enter
                return
            fi
        else
            log_warning "Cannot install OCRmyPDF automatically on this OS"
            echo -e "${DIM}Ubuntu/Debian: sudo apt-get install ocrmypdf tesseract-ocr${NC}"
            echo -e "${DIM}macOS: brew install ocrmypdf tesseract${NC}"
            echo ""
        fi
    fi

    start_redis
    echo ""
    start_api
    echo ""
    start_celery

    echo ""
    echo -e "${BOLD}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${GREEN}${BOLD}   🎉 ALL SERVICES STARTED SUCCESSFULLY! 🎉${NC}"
    echo ""
    echo -e "${BOLD}${CYAN}📊 Service Status:${NC}"
    echo -e "${DIM}├─${NC} ${BLUE}Redis Server${NC}          ${GREEN}✓${NC} ${DIM}PID $(cat $REDIS_PID_FILE 2>/dev/null || echo 'N/A')${NC}"
    echo -e "${DIM}├─${NC} ${MAGENTA}FastAPI${NC}               ${GREEN}✓${NC} ${DIM}PID $(cat $API_PID_FILE 2>/dev/null || echo 'N/A')${NC}"
    echo -e "${DIM}└─${NC} ${YELLOW}Celery Workers${NC}        ${GREEN}✓${NC} ${DIM}PID $(cat $WORKER_PID_FILE 2>/dev/null || echo 'N/A')${NC}"
    echo ""
    echo -e "${BOLD}${CYAN}🌐 API Endpoint:${NC} ${GREEN}http://localhost:8000${NC}"
    echo -e "${BOLD}${CYAN}📚 API Docs:${NC}     ${GREEN}http://localhost:8000/docs${NC}"
    echo ""

    press_enter
}

option_start_frontend() {
    show_banner
    echo -e "${BOLD}${GREEN}[3] 🌐 Start Frontend${NC}"
    echo -e "${BOLD}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    if [ ! -d "$FRONTEND_DIR" ]; then
        echo -e "${RED}${BOLD}❌ Frontend directory not found!${NC}"
        press_enter
        return
    fi

    cd "$FRONTEND_DIR"

    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}${BOLD}⚠️  Node modules not found. Installing...${NC}"
        npm install
    fi

    echo -e "${GREEN}${BOLD}🚀 Starting Next.js dev server...${NC}"
    echo -e "${DIM}Access at: ${CYAN}http://localhost:3000${NC}"
    echo ""
    echo -e "${YELLOW}${BOLD}Press Ctrl+C to stop${NC}"
    echo ""

    npm run dev
}

option_start_all() {
    show_banner
    echo -e "${BOLD}${GREEN}[4] 🚀 Start All Services${NC}"
    echo -e "${BOLD}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    echo -e "${CYAN}${BOLD}Step 1/2: Starting Backend...${NC}"
    echo ""

    mkdir -p "$LOG_DIR" "$PID_DIR" "$BACKEND_DIR/uploads" "$BACKEND_DIR/outputs" "$BACKEND_DIR/temp"

    # Auto-install Redis if not found
    if ! command -v redis-server &> /dev/null; then
        echo -e "${YELLOW}${BOLD}📦 Redis not found. Installing automatically...${NC}"
        echo ""
        
        if command -v apt-get &> /dev/null; then
            echo -e "${CYAN}${BOLD}🔧 Installing Redis via apt...${NC}"
            sudo apt-get update -qq && sudo apt-get install -y redis-server
            
            if [ $? -eq 0 ]; then
                log_success "Redis installed successfully"
                
                # Clean up old incompatible dump.rdb if exists
                if [ -f "$PROJECT_ROOT/dump.rdb" ]; then
                    mv "$PROJECT_ROOT/dump.rdb" "$PROJECT_ROOT/dump.rdb.backup-$(date +%s)" 2>/dev/null
                fi
            else
                log_error "Failed to install Redis"
                press_enter
                return
            fi
        elif command -v brew &> /dev/null; then
            echo -e "${CYAN}${BOLD}🔧 Installing Redis via Homebrew...${NC}"
            brew install redis
            
            if [ $? -ne 0 ]; then
                log_error "Failed to install Redis"
                press_enter
                return
            fi
        else
            log_error "Cannot install Redis automatically on this OS"
            press_enter
            return
        fi
        echo ""
    fi

    # Auto-install OCRmyPDF if not found
    if ! command -v ocrmypdf &> /dev/null; then
        echo -e "${YELLOW}${BOLD}📦 OCRmyPDF not found. Installing automatically...${NC}"
        echo ""
        
        if command -v apt-get &> /dev/null; then
            echo -e "${CYAN}${BOLD}🔧 Installing OCRmyPDF and Tesseract OCR...${NC}"
            sudo apt-get install -y ocrmypdf tesseract-ocr tesseract-ocr-eng ghostscript
            
            if [ $? -eq 0 ]; then
                log_success "OCRmyPDF and Tesseract installed successfully"
            else
                log_error "Failed to install OCRmyPDF"
                press_enter
                return
            fi
        elif command -v brew &> /dev/null; then
            echo -e "${CYAN}${BOLD}🔧 Installing OCRmyPDF and Tesseract OCR...${NC}"
            brew install ocrmypdf tesseract
            
            if [ $? -ne 0 ]; then
                log_error "Failed to install OCRmyPDF"
                press_enter
                return
            fi
        else
            log_warning "Cannot install OCRmyPDF automatically on this OS"
            echo -e "${DIM}Manual install: sudo apt-get install ocrmypdf tesseract-ocr${NC}"
        fi
        echo ""
    fi

    start_redis
    echo ""
    start_api
    echo ""
    start_celery

    echo ""
    echo ""
    echo -e "${CYAN}${BOLD}Step 2/2: Starting Frontend...${NC}"
    echo -e "${YELLOW}${BOLD}⚠️  Frontend will start now. Press Ctrl+C to stop.${NC}"
    echo ""
    sleep 2

    if [ -d "$FRONTEND_DIR" ]; then
        cd "$FRONTEND_DIR"
        if [ ! -d "node_modules" ]; then
            npm install
        fi
        npm run dev
    else
        echo -e "${RED}${BOLD}❌ Frontend directory not found!${NC}"
        press_enter
    fi
}

option_stop_backend() {
    show_banner
    echo -e "${BOLD}${YELLOW}[5] ⏸️  Stop Backend Services${NC}"
    echo -e "${BOLD}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    echo -e "${BOLD}${YELLOW}[1/3] 🔥 Stopping Celery Workers...${NC}"
    stop_service "$WORKER_PID_FILE" "Celery Workers" "TERM" "$YELLOW"

    echo ""
    echo -e "${BOLD}${MAGENTA}[2/3] 🌐 Stopping FastAPI...${NC}"
    stop_service "$API_PID_FILE" "FastAPI" "TERM" "$MAGENTA"

    echo ""
    echo -e "${BOLD}${BLUE}[3/3] 💾 Stopping Redis Server...${NC}"
    stop_service "$REDIS_PID_FILE" "Redis" "TERM" "$BLUE"

    echo ""
    echo -e "${BOLD}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${GREEN}${BOLD}   🎉 ALL SERVICES STOPPED SUCCESSFULLY! 🎉${NC}"
    echo ""

    press_enter
}

option_restart_backend() {
    show_banner
    echo -e "${BOLD}${YELLOW}[6] 🔄 Restart Backend Services${NC}"
    echo -e "${BOLD}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    echo -e "${BOLD}${RED}[1/2] 🛑 Stopping all services...${NC}"
    echo ""

    stop_service "$WORKER_PID_FILE" "Celery Workers" "TERM" "$YELLOW"
    echo ""
    stop_service "$API_PID_FILE" "FastAPI" "TERM" "$MAGENTA"
    echo ""
    stop_service "$REDIS_PID_FILE" "Redis" "TERM" "$BLUE"

    echo ""
    echo -e "${BOLD}${BLUE}⏳ Waiting for services to shutdown completely...${NC}"
    echo -ne "${DIM}   "
    for i in {3..1}; do
        echo -ne "$i... "
        sleep 1
    done
    echo -e "Ready!${NC}"
    echo ""

    echo -e "${BOLD}${GREEN}[2/2] 🚀 Starting all services...${NC}"
    echo ""

    start_redis
    echo ""
    start_api
    echo ""
    start_celery

    echo ""
    echo -e "${BOLD}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${GREEN}${BOLD}   🎊 RESTART COMPLETED SUCCESSFULLY! 🎊${NC}"
    echo ""

    press_enter
}

option_status() {
    show_banner
    echo -e "${BOLD}${BLUE}[7] 📊 Check Status${NC}"
    echo -e "${BOLD}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    echo -e "${BOLD}${CYAN}🖥️  Service Status:${NC}"
    check_service "$REDIS_PID_FILE" "Redis Server" "💾" "$BLUE"
    check_service "$API_PID_FILE" "FastAPI (Gunicorn)" "🌐" "$MAGENTA"
    check_service "$WORKER_PID_FILE" "Celery Workers" "🔥" "$YELLOW"

    echo ""
    echo -e "${BOLD}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BOLD}${CYAN}🔌 System Health:${NC}"

    echo -n -e "${DIM}├─${NC} 🌐 ${MAGENTA}API Health Check${NC}$(printf '%*s' 18 '')"
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}${BOLD}✓ OK${NC}"
    else
        echo -e "${RED}${BOLD}✗ FAILED${NC}"
    fi

    echo -n -e "${DIM}├─${NC} 💾 ${BLUE}Redis Connection${NC}$(printf '%*s' 17 '')"
    if redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}${BOLD}✓ OK${NC}"
    else
        echo -e "${RED}${BOLD}✗ FAILED${NC}"
    fi

    echo -n -e "${DIM}└─${NC} 💿 ${YELLOW}Disk Space${NC}$(printf '%*s' 23 '')"
    disk_usage=$(df -h "$BACKEND_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -lt 80 ]; then
        echo -e "${GREEN}${BOLD}✓ OK${NC} ${DIM}($disk_usage% used)${NC}"
    elif [ "$disk_usage" -lt 90 ]; then
        echo -e "${YELLOW}${BOLD}⚠ WARNING${NC} ${DIM}($disk_usage% used)${NC}"
    else
        echo -e "${RED}${BOLD}✗ CRITICAL${NC} ${DIM}($disk_usage% used)${NC}"
    fi

    echo ""
    press_enter
}

option_logs() {
    show_banner
    echo -e "${BOLD}${BLUE}[8] 📋 View Logs${NC}"
    echo -e "${BOLD}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    if [ ! -d "$LOG_DIR" ]; then
        echo -e "${YELLOW}${BOLD}⚠️  Logs directory not found!${NC}"
        press_enter
        return
    fi

    echo -e "${CYAN}${BOLD}📋 Real-time Logs Monitoring${NC}"
    echo -e "${DIM}Press Ctrl+C to exit${NC}"
    echo ""

    tail -f "$LOG_DIR"/*.log 2>/dev/null || echo -e "${YELLOW}No log files found${NC}"
}

option_monitor() {
    show_banner
    echo -e "${BOLD}${BLUE}[9] 📈 Monitor Services${NC}"
    echo -e "${BOLD}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    echo -e "${CYAN}${BOLD}📊 Service Monitoring (Auto-refresh every 2s)${NC}"
    echo -e "${DIM}Press Ctrl+C to exit${NC}"
    echo ""
    sleep 2

    while true; do
        clear
        show_banner
        echo -e "${BOLD}${BLUE}📈 Live Service Monitor${NC}"
        echo -e "${BOLD}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""

        echo -e "${BOLD}${CYAN}🖥️  Service Status:${NC}"
        check_service "$REDIS_PID_FILE" "Redis Server" "💾" "$BLUE"
        check_service "$API_PID_FILE" "FastAPI (Gunicorn)" "🌐" "$MAGENTA"
        check_service "$WORKER_PID_FILE" "Celery Workers" "🔥" "$YELLOW"

        echo ""
        echo -e "${DIM}Last update: $(date '+%Y-%m-%d %H:%M:%S')${NC}"

        sleep 2
    done
}

option_generate_key() {
    show_banner
    echo -e "${BOLD}${MAGENTA}[10] 🔑 Generate New API Key${NC}"
    echo -e "${BOLD}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    if [ -f "$BACKEND_DIR/generate_api_key.py" ]; then
        python3 "$BACKEND_DIR/generate_api_key.py"
    else
        echo -e "${YELLOW}${BOLD}⚠️  generate_api_key.py not found${NC}"
        echo ""
        echo -e "${CYAN}${BOLD}Generating API key...${NC}"
        NEW_KEY="apk_$(LC_ALL=C tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c 48)"
        echo ""
        echo -e "${GREEN}${BOLD}✅ New API Key:${NC}"
        echo -e "${CYAN}${NEW_KEY}${NC}"
        echo ""
        echo -e "${YELLOW}${BOLD}⚠️  Remember to update your .env files manually!${NC}"
    fi

    press_enter
}

option_database() {
    show_banner
    echo -e "${BOLD}${MAGENTA}[11] 🗄️  Database Management${NC}"
    echo -e "${BOLD}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    if [ ! -d "$FRONTEND_DIR" ]; then
        echo -e "${RED}${BOLD}❌ Frontend directory not found!${NC}"
        press_enter
        return
    fi

    cd "$FRONTEND_DIR"

    echo -e "${CYAN}${BOLD}🗄️  Opening Prisma Studio...${NC}"
    echo -e "${DIM}Access at: ${CYAN}http://localhost:5555${NC}"
    echo ""
    echo -e "${YELLOW}${BOLD}Press Ctrl+C to close${NC}"
    echo ""

    npx prisma studio
}

option_docs() {
    show_banner
    echo -e "${BOLD}${MAGENTA}[12] 📚 View Documentation${NC}"
    echo -e "${BOLD}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    if [ -f "$PROJECT_ROOT/README.md" ]; then
        if command -v bat &> /dev/null; then
            bat "$PROJECT_ROOT/README.md"
        elif command -v less &> /dev/null; then
            less "$PROJECT_ROOT/README.md"
        else
            cat "$PROJECT_ROOT/README.md"
        fi
    else
        echo -e "${RED}${BOLD}❌ README.md not found!${NC}"
    fi

    press_enter
}

option_sysinfo() {
    show_banner
    echo -e "${BOLD}${MAGENTA}[13] ℹ️  System Information${NC}"
    echo -e "${BOLD}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    echo -e "${BOLD}${CYAN}🖥️  System:${NC}"
    echo -e "${DIM}├─${NC} OS: $(uname -s)"
    echo -e "${DIM}├─${NC} Kernel: $(uname -r)"
    echo -e "${DIM}└─${NC} Architecture: $(uname -m)"
    echo ""

    echo -e "${BOLD}${CYAN}🔧 Software:${NC}"
    if command -v python3 &> /dev/null; then
        echo -e "${DIM}├─${NC} ${GREEN}✓${NC} Python: $(python3 --version | awk '{print $2}')"
    else
        echo -e "${DIM}├─${NC} ${RED}✗${NC} Python: Not installed"
    fi

    if command -v node &> /dev/null; then
        echo -e "${DIM}├─${NC} ${GREEN}✓${NC} Node.js: $(node --version)"
    else
        echo -e "${DIM}├─${NC} ${RED}✗${NC} Node.js: Not installed"
    fi

    if command -v npm &> /dev/null; then
        echo -e "${DIM}├─${NC} ${GREEN}✓${NC} npm: v$(npm --version)"
    else
        echo -e "${DIM}├─${NC} ${RED}✗${NC} npm: Not installed"
    fi

    if command -v redis-server &> /dev/null; then
        echo -e "${DIM}├─${NC} ${GREEN}✓${NC} Redis: $(redis-server --version | awk '{print $3}')"
    else
        echo -e "${DIM}├─${NC} ${YELLOW}⚠${NC} Redis: Not installed"
    fi

    if command -v psql &> /dev/null; then
        echo -e "${DIM}└─${NC} ${GREEN}✓${NC} PostgreSQL: $(psql --version | awk '{print $3}')"
    else
        echo -e "${DIM}└─${NC} ${YELLOW}⚠${NC} PostgreSQL: Not installed"
    fi

    echo ""
    echo -e "${BOLD}${CYAN}📊 Project Status:${NC}"

    if [ -f "$PROJECT_ROOT/.env" ]; then
        echo -e "${DIM}├─${NC} ${GREEN}✓${NC} Backend .env configured"
    else
        echo -e "${DIM}├─${NC} ${RED}✗${NC} Backend .env not found"
    fi

    if [ -f "$FRONTEND_DIR/.env" ]; then
        echo -e "${DIM}├─${NC} ${GREEN}✓${NC} Frontend .env configured"
    else
        echo -e "${DIM}├─${NC} ${RED}✗${NC} Frontend .env not found"
    fi

    if [ -d "$FRONTEND_DIR/node_modules" ]; then
        echo -e "${DIM}├─${NC} ${GREEN}✓${NC} Frontend dependencies installed"
    else
        echo -e "${DIM}├─${NC} ${YELLOW}⚠${NC} Frontend dependencies not installed"
    fi

    if [ -d "$BACKEND_DIR/uploads" ]; then
        echo -e "${DIM}└─${NC} ${GREEN}✓${NC} Backend directories created"
    else
        echo -e "${DIM}└─${NC} ${YELLOW}⚠${NC} Backend directories not created"
    fi

    echo ""
    echo -e "${BOLD}${CYAN}🌐 Service URLs:${NC}"
    echo -e "${DIM}├─${NC} Backend API:   ${CYAN}http://localhost:8000${NC}"
    echo -e "${DIM}├─${NC} API Docs:      ${CYAN}http://localhost:8000/docs${NC}"
    echo -e "${DIM}├─${NC} Frontend:      ${CYAN}http://localhost:3000${NC}"
    echo -e "${DIM}└─${NC} Prisma Studio: ${CYAN}http://localhost:5555${NC}"

    echo ""
    press_enter
}

option_restart_redis() {
    show_banner
    echo -e "${BOLD}${YELLOW}[14] 🔄 Restart Redis Only${NC}"
    echo -e "${BOLD}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    echo -e "${BOLD}${RED}[1/2] 🛑 Stopping Redis...${NC}"
    echo ""

    # Stop all Redis instances
    if pgrep -x "redis-server" > /dev/null 2>&1; then
        local redis_pids=$(pgrep -x "redis-server")
        for pid in $redis_pids; do
            echo -e "${BOLD}${BLUE}      🛑 Stopping Redis ${NC}${DIM}(PID: $pid)${NC}"
            
            # Try graceful shutdown first
            redis-cli shutdown 2>/dev/null || true
            sleep 1
            
            # Force kill if still running
            if ps -p $pid > /dev/null 2>&1; then
                kill -9 $pid 2>/dev/null || true
                echo -e "${YELLOW}${BOLD}         ⚡ Force killed Redis${NC}"
            fi
        done
        
        # Clean up PID file
        rm -f "$REDIS_PID_FILE"
        
        echo -e "${GREEN}${BOLD}      ✅ Redis stopped successfully${NC}"
    else
        echo -e "${YELLOW}${BOLD}      ⚠️  Redis is not running${NC}"
    fi

    echo ""
    echo -e "${BOLD}${BLUE}⏳ Waiting for cleanup...${NC}"
    echo -ne "${DIM}   "
    for i in {2..1}; do
        echo -ne "$i... "
        sleep 1
    done
    echo -e "Ready!${NC}"
    echo ""

    echo -e "${BOLD}${GREEN}[2/2] 🚀 Starting Redis...${NC}"
    echo ""

    mkdir -p "$LOG_DIR" "$PID_DIR"
    start_redis

    echo ""
    echo -e "${BOLD}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${GREEN}${BOLD}   🎊 REDIS RESTART COMPLETED! 🎊${NC}"
    echo ""
    
    # Show Redis status
    if redis-cli ping > /dev/null 2>&1; then
        echo -e "${BOLD}${CYAN}📊 Redis Status:${NC}"
        echo -e "${DIM}├─${NC} ${BLUE}Status${NC}         ${GREEN}✓ RUNNING${NC}"
        echo -e "${DIM}├─${NC} ${BLUE}Connection${NC}     ${GREEN}✓ RESPONDING${NC}"
        echo -e "${DIM}├─${NC} ${BLUE}Port${NC}           ${CYAN}6379${NC}"
        echo -e "${DIM}└─${NC} ${BLUE}PID${NC}            ${CYAN}$(cat $REDIS_PID_FILE 2>/dev/null || echo 'N/A')${NC}"
    else
        echo -e "${RED}${BOLD}❌ Redis is not responding!${NC}"
    fi
    
    echo ""
    press_enter
}

option_restart_celery() {
    show_banner
    echo -e "${BOLD}${YELLOW}[15] 🔄 Restart Celery Workers Only${NC}"
    echo -e "${BOLD}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    echo -e "${BOLD}${RED}[1/2] 🛑 Stopping Celery Workers...${NC}"
    echo ""

    # Stop Celery via PID file
    if [ -f "$WORKER_PID_FILE" ]; then
        local celery_pid=$(cat "$WORKER_PID_FILE")
        
        if ps -p $celery_pid > /dev/null 2>&1; then
            echo -e "${BOLD}${YELLOW}      🛑 Stopping Celery Workers ${NC}${DIM}(PID: $celery_pid)${NC}"
            
            # Try graceful shutdown first
            kill -TERM $celery_pid 2>/dev/null || true
            
            local count=0
            echo -ne "${DIM}         Waiting"
            while ps -p $celery_pid > /dev/null 2>&1 && [ $count -lt 10 ]; do
                sleep 0.5
                echo -ne "."
                count=$((count + 1))
            done
            echo -e "${NC}"
            
            # Force kill if still running
            if ps -p $celery_pid > /dev/null 2>&1; then
                kill -9 $celery_pid 2>/dev/null || true
                echo -e "${YELLOW}${BOLD}         ⚡ Force killed Celery${NC}"
            fi
        fi
        
        rm -f "$WORKER_PID_FILE"
        echo -e "${GREEN}${BOLD}      ✅ Celery Workers stopped successfully${NC}"
    else
        echo -e "${YELLOW}${BOLD}      ⚠️  Celery Workers not running ${NC}${DIM}(no PID file)${NC}"
    fi
    
    # Also cleanup any orphaned celery processes
    if pgrep -f "celery.*worker" > /dev/null 2>&1; then
        echo -e "${YELLOW}${BOLD}      🧹 Cleaning up orphaned Celery processes...${NC}"
        pkill -9 -f "celery.*worker" 2>/dev/null || true
        sleep 1
    fi

    echo ""
    echo -e "${BOLD}${BLUE}⏳ Waiting for cleanup...${NC}"
    echo -ne "${DIM}   "
    for i in {3..1}; do
        echo -ne "$i... "
        sleep 1
    done
    echo -e "Ready!${NC}"
    echo ""

    echo -e "${BOLD}${GREEN}[2/2] 🚀 Starting Celery Workers...${NC}"
    echo ""

    mkdir -p "$LOG_DIR" "$PID_DIR"
    
    # Check Redis first
    if ! redis-cli ping > /dev/null 2>&1; then
        echo -e "${RED}${BOLD}      ❌ Redis is not running!${NC}"
        echo -e "${YELLOW}      Celery requires Redis to be running.${NC}"
        echo -e "${DIM}      Please start Redis first (option 14 or 2)${NC}"
        echo ""
        press_enter
        return
    fi
    
    start_celery

    echo ""
    echo -e "${BOLD}${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${GREEN}${BOLD}   🎊 CELERY RESTART COMPLETED! 🎊${NC}"
    echo ""
    
    # Show Celery status
    if [ -f "$WORKER_PID_FILE" ] && ps -p $(cat "$WORKER_PID_FILE") > /dev/null 2>&1; then
        echo -e "${BOLD}${CYAN}📊 Celery Workers Status:${NC}"
        echo -e "${DIM}├─${NC} ${YELLOW}Status${NC}         ${GREEN}✓ RUNNING${NC}"
        echo -e "${DIM}├─${NC} ${YELLOW}PID${NC}            ${CYAN}$(cat $WORKER_PID_FILE)${NC}"
        echo -e "${DIM}├─${NC} ${YELLOW}Concurrency${NC}    ${CYAN}4 workers${NC}"
        echo -e "${DIM}├─${NC} ${YELLOW}Pool${NC}           ${CYAN}prefork${NC}"
        echo -e "${DIM}└─${NC} ${YELLOW}Queues${NC}         ${CYAN}unified, analysis, matching, bypass${NC}"
    else
        echo -e "${RED}${BOLD}❌ Celery Workers failed to start!${NC}"
        echo -e "${DIM}Check log: $WORKER_LOG${NC}"
    fi
    
    echo ""
    press_enter
}

# ═══════════════════════════════════════════════════════════════════
# MAIN LOOP
# ═══════════════════════════════════════════════════════════════════

main() {
    while true; do
        show_banner
        show_menu

        echo -ne "${BOLD}${WHITE}Select option [0-13]: ${NC}"
        read -r choice

        case $choice in
            1) option_init ;;
            2) option_start_backend ;;
            3) option_start_frontend ;;
            4) option_start_all ;;
            5) option_stop_backend ;;
            6) option_restart_backend ;;
            7) option_status ;;
            8) option_logs ;;
            9) option_monitor ;;
            10) option_generate_key ;;
            11) option_database ;;
            12) option_docs ;;
            13) option_sysinfo ;;
            14) option_restart_redis ;;
            15) option_restart_celery ;;
            0)
                show_banner
                echo -e "${GREEN}${BOLD}👋 Thank you for using Anti-Plagiasi System!${NC}"
                echo ""
                echo -e "${MAGENTA}${BOLD}⚡ Made with ❤️  by devnolife${NC}"
                echo ""
                exit 0
                ;;
            *)
                echo ""
                echo -e "${RED}${BOLD}❌ Invalid option. Please choose 0-15.${NC}"
                sleep 2
                ;;
        esac
    done
}

# Run main function
main
