# Ballistic Dope

Mobile-first ballistic calculator for shooters.

## Features

- **Quick-Dirty Mode**: Fast holdover estimation with minimal inputs
- **Advanced Mode**: Includes sight height, scope adjustment settings
- **Long Range Mode**: Environmental factors (temp, altitude, humidity, wind)
- **Extreme Range Mode**: Coriolis, spin drift, and spread estimation

## Platforms

| Platform | Build Status |
|----------|-------------|
| iOS | via EAS Build |
| Android | via EAS Build |
| Windows | GitHub Actions |
| macOS | GitHub Actions |

## Tech Stack

- Expo SDK 52
- React Native 0.76
- TypeScript
- js-ballistics library

## Getting Started

```bash
# Install dependencies
npm install

# Run development
npm run dev
```

## CI/CD

- Push to `main` triggers EAS builds for iOS/Android
- Tag with `v*.*.*` to create releases
- Version auto-increments on merge to main