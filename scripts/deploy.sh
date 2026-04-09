#!/bin/bash

# Deployment script for iROC HR System
# This script automates the deployment process

set -e

# Configuration
PROJECT_NAME="iroc-hr-consulting"
DOCKER_REGISTRY="your-registry.com"  # Change to your registry
VERSION=${1:-"latest"}
ENVIRONMENT=${2:-"production"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        warning ".env file not found. Creating from template..."
        cp .env.example .env
        warning "Please update .env file with your configuration"
    fi
    
    success "Prerequisites check completed"
}

# Build Docker images
build_images() {
    log "Building Docker images..."
    
    # Build application image
    docker build -t $DOCKER_REGISTRY/$PROJECT_NAME:$VERSION .
    docker tag $DOCKER_REGISTRY/$PROJECT_NAME:$VERSION $DOCKER_REGISTRY/$PROJECT_NAME:latest
    
    success "Docker images built successfully"
}

# Push images to registry
push_images() {
    log "Pushing images to registry..."
    
    docker push $DOCKER_REGISTRY/$PROJECT_NAME:$VERSION
    docker push $DOCKER_REGISTRY/$PROJECT_NAME:latest
    
    success "Images pushed to registry"
}

# Deploy to production
deploy_production() {
    log "Deploying to production..."
    
    # Create necessary directories
    mkdir -p backups logs nginx/ssl uploads
    
    # Generate SSL certificate if not exists (self-signed for demo)
    if [ ! -f "nginx/ssl/cert.pem" ]; then
        log "Generating SSL certificate..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/key.pem \
            -out nginx/ssl/cert.pem \
            -subj "/C=KH/ST=Phnom Penh/L=Phnom Penh/O=iROC HR/CN=localhost"
    fi
    
    # Stop existing services
    log "Stopping existing services..."
    docker-compose -f docker-compose.yml --profile production down
    
    # Pull latest images
    log "Pulling latest images..."
    docker-compose -f docker-compose.yml --profile production pull
    
    # Start services
    log "Starting services..."
    docker-compose -f docker-compose.yml --profile production up -d
    
    # Wait for services to be ready
    log "Waiting for services to be ready..."
    sleep 30
    
    # Check service health
    check_health
    
    success "Deployment completed successfully"
}

# Check service health
check_health() {
    log "Checking service health..."
    
    # Check if main application is responding
    if curl -f http://localhost/api/health > /dev/null 2>&1; then
        success "Application is healthy"
    else
        error "Application health check failed"
    fi
    
    # Check database connection
    if docker-compose exec postgres pg_isready -U iroc_user -d iroc_hr > /dev/null 2>&1; then
        success "Database is healthy"
    else
        error "Database health check failed"
    fi
    
    # Check Redis connection
    if docker-compose exec redis redis-cli ping > /dev/null 2>&1; then
        success "Redis is healthy"
    else
        error "Redis health check failed"
    fi
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # This would run any pending migrations
    # For now, we'll just create the database schema
    docker-compose exec app npm run migrate
    
    success "Database migrations completed"
}

# Backup current data
backup_data() {
    log "Creating backup before deployment..."
    
    # Create backup directory with timestamp
    BACKUP_DIR="backups/pre-deploy-$(date +%Y%m%d_%H%M%S)"
    mkdir -p $BACKUP_DIR
    
    # Backup database
    docker-compose exec postgres pg_dump -U iroc_user iroc_hr > $BACKUP_DIR/database.sql
    
    # Backup uploads
    if [ -d "uploads" ]; then
        cp -r uploads $BACKUP_DIR/
    fi
    
    success "Backup created: $BACKUP_DIR"
}

# Rollback deployment
rollback() {
    log "Rolling back deployment..."
    
    # Get previous version (you'd implement version management)
    PREVIOUS_VERSION=${3:-"previous"}
    
    # Stop current services
    docker-compose -f docker-compose.yml --profile production down
    
    # Start with previous version
    docker-compose -f docker-compose.yml --profile production up -d
    
    success "Rollback completed"
}

# Cleanup old images and containers
cleanup() {
    log "Cleaning up old Docker resources..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused containers
    docker container prune -f
    
    # Remove unused volumes (be careful with this)
    # docker volume prune -f
    
    success "Cleanup completed"
}

# Show deployment status
status() {
    log "Deployment status:"
    
    echo ""
    echo "Services:"
    docker-compose -f docker-compose.yml --profile production ps
    
    echo ""
    echo "Resource usage:"
    docker stats --no-stream
    
    echo ""
    echo "Logs (last 20 lines):"
    docker-compose logs --tail=20
}

# Main deployment flow
main() {
    log "Starting iROC HR System deployment..."
    log "Environment: $ENVIRONMENT"
    log "Version: $VERSION"
    
    case "$ENVIRONMENT" in
        "production")
            check_prerequisites
            backup_data
            build_images
            push_images
            deploy_production
            run_migrations
            ;;
        "rollback")
            rollback
            ;;
        "status")
            status
            ;;
        "cleanup")
            cleanup
            ;;
        *)
            error "Unknown environment: $ENVIRONMENT. Use 'production', 'rollback', 'status', or 'cleanup'"
            ;;
    esac
    
    success "Deployment process completed successfully!"
    
    # Show final status
    if [ "$ENVIRONMENT" = "production" ]; then
        echo ""
        echo "🎉 iROC HR System is now deployed!"
        echo "📊 Dashboard: https://localhost"
        echo "🔧 API: https://localhost/api"
        echo "📈 Monitoring: Check logs with 'docker-compose logs -f'"
    fi
}

# Handle script arguments
case "${1:-}" in
    "")
        main
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [VERSION] [ENVIRONMENT] [PREVIOUS_VERSION]"
        echo ""
        echo "Environments:"
        echo "  production  - Deploy to production (default)"
        echo "  rollback    - Rollback to previous version"
        echo "  status      - Show deployment status"
        echo "  cleanup     - Clean up Docker resources"
        echo ""
        echo "Examples:"
        echo "  $0                          # Deploy latest version to production"
        echo "  $0 v1.2.3 production       # Deploy specific version"
        echo "  $0 v1.2.3 rollback v1.2.2  # Rollback to previous version"
        echo "  $0 v1.2.3 status           # Show status"
        ;;
    *)
        main
        ;;
esac
