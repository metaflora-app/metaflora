#!/usr/bin/env bash
set -euo pipefail

mkdir -p "${BROWSER_PROFILE_DIR:-/data/polza-profile}"
chmod 700 "${BROWSER_PROFILE_DIR:-/data/polza-profile}"
chown -R pwuser:pwuser "${BROWSER_PROFILE_DIR:-/data/polza-profile}"
rm -f "${BROWSER_PROFILE_DIR:-/data/polza-profile}"/SingletonLock \
  "${BROWSER_PROFILE_DIR:-/data/polza-profile}"/SingletonSocket \
  "${BROWSER_PROFILE_DIR:-/data/polza-profile}"/SingletonCookie

if [[ -z "${BROWSER_EXECUTABLE_PATH:-}" ]]; then
  if [[ -x /usr/bin/google-chrome ]]; then
    export BROWSER_EXECUTABLE_PATH=/usr/bin/google-chrome
  else
    playwright_browser="$(find /ms-playwright -path '*/chrome-linux/chrome' -type f -perm -111 -print -quit)"
    if [[ -z "$playwright_browser" ]]; then
      echo "No supported Chromium executable found" >&2
      exit 1
    fi
    export BROWSER_EXECUTABLE_PATH="$playwright_browser"
  fi
fi

rm -f /tmp/.X99-lock /tmp/.X11-unix/X99
Xvfb :99 -screen 0 1440x900x24 -ac +extension GLX +render -noreset & xvfb_pid=$!
fluxbox >/tmp/fluxbox.log 2>&1 & fluxbox_pid=$!
x11vnc -display :99 -localhost -forever -shared -nopw -rfbport 5900 >/tmp/x11vnc.log 2>&1 & vnc_pid=$!
websockify --web=/usr/share/novnc 127.0.0.1:6080 localhost:5900 >/tmp/novnc.log 2>&1 & novnc_pid=$!

cleanup() {
  kill "$novnc_pid" "$vnc_pid" "$fluxbox_pid" "$xvfb_pid" 2>/dev/null || true
}
trap cleanup EXIT TERM INT

runuser -u pwuser -- node src/start.js
