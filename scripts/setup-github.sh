#!/bin/bash
# ============================================================
# Setup GitHub Auto-Sync untuk BGN Dapur SPPG
# Gunakan: bash scripts/setup-github.sh <username> <token>
# Contoh:  bash scripts/setup-github.sh namapengguna ghp_xxxxx
# ============================================================

PROJECT_DIR="/home/z/my-project"
CONFIG_FILE="$PROJECT_DIR/.github-config"

if [ -z "$1" ] || [ -z "$2" ]; then
  echo ""
  echo "=== Setup GitHub Auto-Sync BGN ==="
  echo ""
  echo "Penggunaan:"
  echo "  bash scripts/setup-github.sh <github_username> <personal_access_token>"
  echo ""
  echo "Contoh:"
  echo "  bash scripts/setup-github.sh namapengguna ghp_abc123xyz"
  echo ""
  echo "Cara membuat token:"
  echo "  1. Buka github.com → Settings → Developer settings"
  echo "  2. Personal access tokens → Tokens (classic)"
  echo "  3. Generate new token, centang 'repo', salin token"
  echo ""
  exit 1
fi

GITHUB_USER="$1"
GITHUB_TOKEN="$2"
GITHUB_REPO="${GITHUB_USER}/dapur-sppg-bgn"

cd "$PROJECT_DIR" || exit 1

# Simpan config (file ini sudah di .gitignore)
cat > "$CONFIG_FILE" << EOF
GITHUB_USER="$GITHUB_USER"
GITHUB_TOKEN="$GITHUB_TOKEN"
GITHUB_REPO="$GITHUB_REPO"
EOF

chmod 600 "$CONFIG_FILE"

echo "Config tersimpan di $CONFIG_FILE"

# Set remote git
git remote remove origin 2>/dev/null
git remote add origin "https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git"

echo ""
echo "=== Mencoba membuat repository di GitHub... ==="

# Coba buat repo via GitHub API
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "https://api.github.com/user/repos" \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"dapur-sppg-bgn\",\"description\":\"Sistem Operasional Dapur SPPG BGN - Template Website\",\"private\":false,\"auto_init\":false}")

if [ "$HTTP_STATUS" = "201" ]; then
  echo "Repository BERHASIL dibuat: https://github.com/$GITHUB_REPO"
else
  echo "Repo mungkin sudah ada atau gagal dibuat (status: $HTTP_STATUS)"
  echo "Coba akses manual: https://github.com/new"
fi

echo ""
echo "=== Melakukan initial commit & push... ==="

git add -A
git commit -m "init: Dapur SPPG BGN - Sistem Operasional" \
  --author="BGN Setup <bgn-setup@users.noreply.github.com>" 2>/dev/null

git branch -M main 2>/dev/null
git push -u origin main 2>&1

if [ $? -eq 0 ]; then
  echo ""
  echo "=== BERHASIL! ==="
  echo "Repo: https://github.com/$GITHUB_REPO"
  echo ""
  echo "Auto-sync sudah aktif. Setiap ada perubahan code,"
  echo "otomatis akan di-commit dan push ke GitHub."
else
  echo ""
  echo "GAGAL push. Periksa token dan username Anda."
fi
