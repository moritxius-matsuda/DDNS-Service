#!/bin/bash
# Deployment Script für dm1lx.de DDNS Service

set -e

echo "🚀 Deploying dm1lx.de DDNS Service..."

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funktionen
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Prüfe ob .env existiert
if [ ! -f .env ]; then
    log_error ".env file not found!"
    log_info "Please copy .env.example to .env and configure it:"
    log_info "cp .env.example .env"
    log_info "nano .env"
    exit 1
fi

# Prüfe ob ddns-server/.env existiert
if [ ! -f ddns-server/.env ]; then
    log_warn "ddns-server/.env not found, copying from root .env"
    cp .env ddns-server/.env
fi

# Lade Umgebungsvariablen
source .env

# Prüfe erforderliche Variablen
if [ -z "$REDIS_URL" ] || [ -z "$JWT_SECRET" ]; then
    log_error "Required environment variables missing!"
    log_info "Please configure REDIS_URL and JWT_SECRET in .env"
    exit 1
fi

# Server Deployment
log_info "Building and starting DDNS server..."

# Stoppe existierende Container
docker-compose down 2>/dev/null || true

# Baue und starte Server
docker-compose up -d --build

# Warte auf Server
log_info "Waiting for server to start..."
sleep 10

# Health Check
if curl -f http://localhost:3000/health >/dev/null 2>&1; then
    log_info "✅ DDNS Server is running!"
else
    log_error "❌ DDNS Server failed to start!"
    docker-compose logs ddns-server
    exit 1
fi

# Frontend Deployment (optional)
if [ -d "frontend" ] && [ "$1" = "--with-frontend" ]; then
    log_info "Preparing frontend for deployment..."
    
    cd frontend
    
    # Prüfe Clerk Konfiguration
    if [ -z "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" ] || [ -z "$CLERK_SECRET_KEY" ]; then
        log_warn "Clerk configuration missing - skipping frontend deployment"
        log_info "Configure NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY for frontend"
    else
        # Installiere Dependencies
        npm install
        
        # Baue Frontend
        npm run build
        
        log_info "✅ Frontend built successfully!"
        log_info "Deploy to Vercel with: vercel --prod"
    fi
    
    cd ..
fi

# Client Script Setup
log_info "Setting up client scripts..."

cd client-scripts

# Erstelle Beispiel-Konfiguration
if [ ! -f config.json ]; then
    cp config.example.json config.json
    log_warn "Created config.json from example - please configure it!"
fi

# Installiere Python Dependencies
if command -v python3 &> /dev/null; then
    python3 -m pip install -r requirements.txt --user
    log_info "✅ Python dependencies installed!"
else
    log_warn "Python3 not found - client script dependencies not installed"
fi

cd ..

# Zusammenfassung
echo ""
log_info "🎉 Deployment completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Configure DNS: *.dm1lx.de → 3.72.176.165 (A Record)"
echo "2. Setup Upstash Redis and update REDIS_URL in .env"
echo "3. Configure Clerk for authentication"
echo "4. Deploy frontend to Vercel"
echo "5. Test the service:"
echo "   curl http://3.72.176.165:3000/health"
echo ""
echo "📖 Documentation:"
echo "   - API: docs/API.md"
echo "   - README: README.md"
echo ""
echo "🔧 Management:"
echo "   - View logs: docker-compose logs -f ddns-server"
echo "   - Restart: docker-compose restart ddns-server"
echo "   - Stop: docker-compose down"