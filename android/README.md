# Omnintellx — Android 9 (API 28) APK Package

This directory contains the standalone Android Studio / Gradle project configured specifically for **Android 9 Pie (API Level 28)** and newer Android devices.

## Files
- `AndroidManifest.xml`: Configured with `android:minSdkVersion="28"`, `android:targetSdkVersion="28"`, fullscreen theme, and hardware-accelerated WebView.
- `MainActivity.java`: Fullscreen WebView activity loading `file:///android_asset/omni/index.html`.
- `build.gradle`: Android application build configuration.
- `build-apk.sh`: Automated compilation helper.

## How to Build the APK
1. Open this `android/` folder in Android Studio, or from terminal run:
   ```bash
   ./gradlew assembleDebug
   ```
2. The generated debug APK will be created at:
   ```
   app/build/outputs/apk/debug/app-debug.apk
   ```
3. Install onto your Android phone via ADB:
   ```bash
   adb install app-debug.apk
   ```
4. Or install directly in Android Chrome via PWA WebAPK:
   Open the application in Chrome on Android and tap **"Add to Home Screen"**.
