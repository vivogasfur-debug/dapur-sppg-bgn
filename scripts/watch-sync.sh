#!/bin/bash
# ============================================================
# File Watcher - memantau perubahan dan jalankan auto-sync
# Jalankan di background: bash scripts/watch-sync.sh &
# ============================================================

PROJECT_DIR="/home/z/my-project"
SYNC_SCRIPT="$PROJECT_DIR/scripts/auto-sync.sh"
CHECK_INTERVAL=30  # cek setiap 30 detik

echo "Memantau perubahan setiap ${CHECK_INTERVAL} detik..."
echo "Tekan Ctrl+C untuk berhenti."
echo "Log: $PROJECT_DIR/auto-sync.log"
echo ""

LAST_SUMMARY=""

while true; do
  CURRENT_SUMMARY=$(git -C "$PROJECT_DIR" status --porcelain 2>/dev/null | md5sum)
  
  if [ "$CURRENT_SUMMARY" != "$LAST_SUMMARY" ]; then
    # Ada perubahan
    CHANGES=$(git -C "$PROJECT_DIR" status --porcelain 2>/dev/null | wc -l)
    if [ "$CHANGES" -gt 0 ]; then
      echo "[$(date '+%H:%M:%S')] $CHANGES file berubah, sync ke GitHub..."
      bash "$SYNC_SCRIPT"
    fi
    LAST_SUMMARY="$CURRENT_SUMMARY"
  fi
  
  sleep $CHECK_INTERVAL
done
