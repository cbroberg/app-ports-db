#!/bin/bash
# ============================================================
# CL Agent — macOS LaunchAgent Installer
#
# Usage:
#   CL_WEB_URL=wss://cl-web.fly.dev/api/agent/ws \
#   CL_AGENT_TOKEN=$(openssl rand -hex 32) \
#   ./install.sh
#
# Optional:
#   SCAN_ROOT=/Users/cb/Apps  (default)
#   AGENT_NAME=MacBook        (default: hostname)
# ============================================================

set -e

AGENT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLIST_LABEL="com.cbroberg.cl-agent"
PLIST_PATH="$HOME/Library/LaunchAgents/$PLIST_LABEL.plist"
LOG_DIR="$HOME/Library/Logs/cl-agent"

# ---- Validate required env vars -------------------------------------------

if [ -z "$CL_WEB_URL" ]; then
  echo "❌ ERROR: CL_WEB_URL is required"
  echo "   Example: wss://cl-web.fly.dev/api/agent/ws"
  exit 1
fi

if [ -z "$CL_AGENT_TOKEN" ]; then
  echo "❌ ERROR: CL_AGENT_TOKEN is required"
  echo "   Generate with: openssl rand -hex 32"
  exit 1
fi

SCAN_ROOT="${SCAN_ROOT:-/Users/cb/Apps}"
AGENT_NAME="${AGENT_NAME:-$(hostname -s)}"

# ---- Find Node binary -------------------------------------------------------

# Try fnm default alias first (used in this project)
NODE_BIN="/Users/cb/.local/share/fnm/aliases/default/bin/node"
if [ ! -f "$NODE_BIN" ]; then
  NODE_BIN="$(which node 2>/dev/null || echo '')"
fi
if [ -z "$NODE_BIN" ] || [ ! -f "$NODE_BIN" ]; then
  echo "❌ ERROR: Cannot find node binary. Set NODE_BIN env var."
  exit 1
fi
echo "✓ Node: $NODE_BIN ($(${NODE_BIN} --version))"

# ---- Build the agent --------------------------------------------------------

echo "⚙️  Building cl-agent…"
cd "$AGENT_DIR"
if [ ! -f "node_modules/.bin/tsc" ]; then
  npm install
fi
npm run build
echo "✓ Build complete"

# ---- Create log directory ---------------------------------------------------

mkdir -p "$LOG_DIR"

# ---- Write plist ------------------------------------------------------------

cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${PLIST_LABEL}</string>

  <key>ProgramArguments</key>
  <array>
    <string>${NODE_BIN}</string>
    <string>${AGENT_DIR}/dist/index.js</string>
  </array>

  <key>EnvironmentVariables</key>
  <dict>
    <key>CL_WEB_URL</key>
    <string>${CL_WEB_URL}</string>
    <key>CL_AGENT_TOKEN</key>
    <string>${CL_AGENT_TOKEN}</string>
    <key>SCAN_ROOT</key>
    <string>${SCAN_ROOT}</string>
    <key>AGENT_NAME</key>
    <string>${AGENT_NAME}</string>
  </dict>

  <key>RunAtLoad</key>
  <true/>

  <key>KeepAlive</key>
  <true/>

  <key>ThrottleInterval</key>
  <integer>10</integer>

  <key>StandardOutPath</key>
  <string>${LOG_DIR}/stdout.log</string>

  <key>StandardErrorPath</key>
  <string>${LOG_DIR}/stderr.log</string>

  <key>WorkingDirectory</key>
  <string>${AGENT_DIR}</string>
</dict>
</plist>
EOF

echo "✓ Plist written to $PLIST_PATH"

# ---- Load LaunchAgent -------------------------------------------------------

# Unload existing instance if running
launchctl unload "$PLIST_PATH" 2>/dev/null || true

# Load the new instance
launchctl load "$PLIST_PATH"
echo "✓ LaunchAgent loaded"

echo ""
echo "✅ CL Agent installed and started!"
echo ""
echo "   Logs:   tail -f $LOG_DIR/stdout.log"
echo "   Status: launchctl list $PLIST_LABEL"
echo "   Stop:   launchctl unload $PLIST_PATH"
echo "   Start:  launchctl load $PLIST_PATH"
