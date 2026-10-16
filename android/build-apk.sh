#!/usr/bin/env bash
# Omnintellx Android 9 APK Build & Compilation Script
set -e

echo "=== Omnintellx Android 9 (API 28) APK Generator ==="

# 1. Prepare asset directories
mkdir -p app/src/main/assets/omni
mkdir -p app/src/main/java/com/omnintellx/app

# 2. Copy standalone application from omni/
if [ -f "../omni/index.html" ]; then
  cp ../omni/index.html app/src/main/assets/omni/index.html
  echo "✓ Copied omni/index.html to assets"
elif [ -f "omni/index.html" ]; then
  cp omni/index.html app/src/main/assets/omni/index.html
  echo "✓ Copied omni/index.html to assets"
fi

cp MainActivity.java app/src/main/java/com/omnintellx/app/MainActivity.java
cp AndroidManifest.xml app/src/main/AndroidManifest.xml

echo "Android 9 (API 28) project assembled."
echo "Compile command: ./gradlew assembleDebug"
echo "Output path: app/build/outputs/apk/debug/app-debug.apk"
