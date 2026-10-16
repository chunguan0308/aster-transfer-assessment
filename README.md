# Aster Transfer

A React Native + TypeScript implementation of the Ryt Bank payment transfer assessment. Expo provides the React Native framework and native build tooling; Android and iOS native applications are the target deliverables.

**Current milestone:** development foundation. Transfer features and final assessment review are not implemented yet. The temporary Expo launcher artwork will be replaced during visual implementation.

## Requirements and development history

The confidential assessment PDF is excluded from Git. Both stretch goals are part of the delivery scope.

The original assessment PDF is confidential and is not included in this repository. Both stretch goals (system contacts and recent transfers) are part of the agreed delivery scope.

## Prerequisites

- Node.js matching `.nvmrc` (use `nvm install` and `nvm use`).
- Android: JDK 17, Android Studio, Android SDK and an ARM64 emulator on Apple Silicon, or an Android device with USB debugging enabled.
- iOS: macOS, Xcode with an installed iOS Simulator runtime, and CocoaPods.

On macOS with Homebrew JDK 17, run `source scripts/mobile-env.sh` to use the project toolchain without changing other projects' global shell settings. Override `JAVA_HOME` and `ANDROID_HOME` before sourcing it if your installation uses different paths.

## Install and verify

```sh
nvm install
nvm use
npm ci
npm run check
```

`check` runs TypeScript strict checks, ESLint with zero warnings, Prettier checks, and Jest tests. CI runs the same command on a clean dependency installation. The local pre-commit hook runs the same checks; a post-commit hook syncs an existing CodeGraph index. Automated checks do not prove native builds or device authentication passed.

## Native development

```sh
source scripts/mobile-env.sh
npm run android
# Or, on macOS:
npm run ios
```

These commands generate and compile native projects locally. Generated `android/` and `ios/` folders are excluded from Git; native configuration belongs in Expo configuration and config plugins. After the first build, use `npm start` for JavaScript changes. No Expo cloud account is required for local builds.

## Code navigation

CodeGraph is installed as a pinned development dependency by `npm ci`. A local ignored `.codegraph/` index enables code and call-path retrieval. Run the following on a new checkout:

```sh
npm run graph:init
npm run graph:status
npm run graph:sync
npx codegraph explore "RootLayout HomeScreen"
```


## Verification status

The foundation quality checks and CodeGraph retrieval have passed; native installation/build validation is in progress. Expo Doctor passes with an explicit Jest 30 compatibility exception in package configuration. The dependency audit reports four unresolved upstream advisories; the security audit is not clean. There is no claim of completed banking functionality or production security.
