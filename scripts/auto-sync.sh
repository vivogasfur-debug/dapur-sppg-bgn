#!/bin/bash
# ============================================================
# Auto-Sync ke GitHub - BGN Dapur SPPG
# Script ini memantau perubahan file dan auto commit/push
# ============================================================

PROJECT_DIR="/home/z/my-project"
LOG_FILE="$PROJECT_DIR/auto-sync.log"
COMMIT_MSG="auto: update $(date '+%Y-%m-%d %H:%M:%S')"

# Load config dari file terpisah (supaya token tidak di-hardcode di sini)
CONFIG_FILE="$PROJECT_DIR/.github-config"
if [ ! -f "$CONFIG_FILE" ]; then
  echo "[$(date)] ERROR: File .github-config belum ada. Jalankan: setup-github.sh" >> "$LOG_FILE"
  exit 1
fi

source "$CONFIG_FILE"

if [ -z "$GITHUB_TOKEN" ] || [ -z "$GITHUB_REPO" ]; then
  echo "[$(date)] ERROR: GITHUB_TOKEN atau GITHUB_REPO belum di-set di .github-config" >> "$LOG_FILE"
  exit 1
fi

cd "$PROJECT_DIR" || exit 1

# Cek apakah ada perubahan
if git diff --quiet && git diff --cached --quiet; then
  exit 0
fi

echo "[$(date)] Perubahan terdeteksi, commit & push..." >> "$LOG_FILE"

git add -A
git commit -m "$COMMIT_MSG" --author="BGN Auto-Sync <bgn-sync@users.noreply.github.com>" 2>>"$LOG_FILE"

git push "https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git" main 2>>"$LOG_FILE"

if [ $? -eq 0 ]; then
  echo "[$(date)] Berhasil push ke GitHub" >> "$LOG_FILE"
else
  echo "[$(date)] GAGAL push ke GitHub" >> "$LOG_FILE"
fi
