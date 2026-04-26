# Ballistic Dope - Project Status

## Current Version
- **Version**: 1.0.0
- **Package**: `com.ballisticdope.app`
- **Expo SDK**: 52
- **React Native**: 0.76.9

## Working ✅

### Build System
- **Android APK Build**: Working (release build successful)
- **JavaScript Bundling**: Bundled into APK (standalone, no Metro required)
- **APK Location**: `android/app/build/outputs/apk/release/app-release.apk`

### Features
- **Quick Dirty Mode**: Basic trajectory calculate
- **Advanced Mode**: Scope adjustment settings
- **Long Range Mode**: Environmental factors
- **Extreme Mode**: Coriolis + spread estimation
- **Graph View**: Visual trajectory display

### Dependencies (Verified Working)
- expo@52.0.49
- expo-router@4.0.0
- expo-asset@11.0.0 (downgraded for SDK 52 compatibility)
- react-native@0.76.9
- react-native-safe-area-context@4.12.0
- react-native-screens@4.4.0
- react-native-svg@15.8.0

### Local Build Environment
- Node.js: 20.x required (not 24)
- JDK: 17 (Temurin)
- Android SDK: API 35

## Needs Work 🔧

### GitHub Actions Release
The workflow runs but may still fail due to SDK 52 gradle plugin issue. Current fix applied:
- Node 20 (changed from 24)
- expo-asset@11.0.0 install step added
- Import path fix via sed

**Risk**: The SDK 52 build is known unstable - may fail intermittently

### iOS Build
- **Status**: Not tested in this session
- **Note**: Would likely need similar fixes

### Project Structure Issues
The import paths are incorrectly set up:
```
app/index.tsx    → imports ../packages/theme/src  ← FIXED in this session
app/quick.tsx    → imports ../packages/core/src  ← FIXED in this session
app/graph.tsx    → imports ../packages/*      ← FIXED in this session
```
Should work now but indicates non-standard Expo project layout.

### Upgrade Path (Recommended)
SDK 52 has known build bugs. Consider upgrading:
- **To**: Expo SDK 53 or 54
- **Requires**: Node 20+ (24 recommended)
- **Breaking**: May need app directory restructuring

## Build Commands

### Local Development
```bash
# Start dev server
npm run dev

# Build JS bundle only
npm run build

# Generate Android project
npx expo prebuild --platform android

# Build APK
cd android && ./gradlew assembleRelease
```

### GitHub Release
Push a version tag:
```bash
git tag v1.0.0
git push origin v1.0.0
```

## Known Limitations

1. **No EAS Build** - Not configured (would require expo-dev-client)
2. **No Updates** - No OTA update capability
3. **No Code Signing** - Using debug keystore
4. **Single APK Size** - 63MB (large due to all architectures)

## Next Steps Recommended

1. **Test the APK** on a device
2. **Fix GitHub Actions** - Monitor the v0.0.6 release run
3. **Consider SDK upgrade** - For long-term stability (SDK 53+)
4. **Add iOS build** - If needed
5. **Configure EAS** - For over-the-air updates