#!/bin/bash

# Database backup script for iROC HR System
# This script creates automated backups of the PostgreSQL database

set -e

# Configuration
DB_HOST="postgres"
DB_NAME="iroc_hr"
DB_USER="iroc_user"
DB_PASSWORD="iroc_secure_password"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/iroc_hr_backup_$DATE.sql"
COMPRESSED_FILE="$BACKUP_FILE.gz"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Log function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Start backup
log "Starting database backup..."

# Create database backup
log "Creating backup: $BACKUP_FILE"
PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --verbose \
    --clean \
    --no-acl \
    --no-owner \
    --format=custom \
    --file="$BACKUP_FILE"

# Compress backup
log "Compressing backup file..."
gzip "$BACKUP_FILE"

# Verify backup
if [ -f "$COMPRESSED_FILE" ]; then
    BACKUP_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
    log "Backup completed successfully: $COMPRESSED_FILE ($BACKUP_SIZE)"
else
    log "ERROR: Backup file not found!"
    exit 1
fi

# Clean up old backups (keep last 7 days)
log "Cleaning up old backups..."
find "$BACKUP_DIR" -name "iroc_hr_backup_*.sql.gz" -mtime +7 -delete

# List remaining backups
log "Current backups:"
ls -lh "$BACKUP_DIR"/iroc_hr_backup_*.sql.gz || log "No backups found"

# Upload to cloud storage (optional - uncomment and configure)
# log "Uploading backup to cloud storage..."
# aws s3 cp "$COMPRESSED_FILE" s3://your-backup-bucket/database/

log "Backup process completed successfully!"

# Optional: Send notification
# curl -X POST -H 'Content-type: application/json' \
#   --data '{"text":"iROC HR Database backup completed: '$COMPRESSED_FILE'"}' \
#   YOUR_SLACK_WEBHOOK_URL
