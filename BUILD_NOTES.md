# Ballistic Dope Android Build Notes

## Build Configuration

### Environment Setup
- **Node.js**: v20.20.2 (required for Expo SDK 52)
- **Java**: JDK 17 (Temurin 17.0.12)
- **Android SDK**: API 35 with build-tools 35.0.0

### Key Fixes Applied

1. **expo-asset version**: Downgraded from `55.0.16` to `11.0.0`
   - SDK 52 has a known bug with newer expo-asset using incompatible gradle plugin
   - Run: `npm install expo-asset@11.0.0 --save`

2. **Import path fixes**: The `app/` directory files had incorrect relative imports
   - Changed from `../../../packages/theme/src` to `../packages/theme/src`
   - Files fixed: `app/index.tsx`, `app/quick.tsx`, `app/advanced.tsx`, `app/long-range.tsx`, `app/extreme.tsx`, `app/graph.tsx`

3. **Android local.properties**: Created with SDK path:
   ```
   sdk.dir=/path/to/android-sdk
   ```

### Build Commands
```bash
# Install dependencies
npm install

# Generate Android project
npx expo prebuild --platform android --clean

# Build release APK
cd android && ./gradlew assembleRelease
```

### APK Location
`android/app/build/outputs/apk/release/app-release.apk`

## Known Issues (SDK 52)
- The `expo-module-gradle-plugin` is not properly exposed in SDK 52 autolinking
- Workaround: Downgrade `expo-asset` to v11 or upgrade to SDK 53+

## GitHub Actions Note
The release workflow uses Node 24. The local build used Node 20 due to SDK requirements.