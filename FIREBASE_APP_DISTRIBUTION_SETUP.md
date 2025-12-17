# Firebase App Distribution Setup Guide

This guide walks you through setting up Firebase App Distribution for StoryStreaks.

## Prerequisites

1. A Firebase project (create one at [Firebase Console](https://console.firebase.google.com/))
2. Node.js installed
3. An Expo account (create at [expo.dev](https://expo.dev/))

---

## Step 1: Install Required CLI Tools

```powershell
# Install EAS CLI globally
npm install -g eas-cli

# Install Firebase CLI globally
npm install -g firebase-tools
```

## Step 2: Login to Expo & Firebase

```powershell
# Login to your Expo account
eas login

# Login to Firebase
firebase login
```

## Step 3: Configure EAS Project

```powershell
# Link your project to EAS (run from project root)
eas init
```

This will create a project on Expo's servers and add an `owner` and `projectId` to your `app.json`.

## Step 4: Set Up Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Go to **Project Settings** > **General**
4. Add an Android app:
   - Package name: `com.storystreaks.app`
   - Download the `google-services.json` file
5. Add an iOS app:
   - Bundle ID: `com.storystreaks.app`
   - Download the `GoogleService-Info.plist` file

## Step 5: Initialize Firebase in Project

```powershell
# From project root
firebase init

# Select:
# - App Distribution (using space to select, then enter)
# - Use existing project (select your Firebase project)
```

This creates a `firebase.json` file in your project.

## Step 6: Build Your App

### For Android (APK for testing):

```powershell
# Build APK for internal testing
eas build --platform android --profile preview
```

### For iOS (requires Apple Developer account):

```powershell
# Build for internal distribution
eas build --platform ios --profile preview
```

## Step 7: Distribute via Firebase

### Option A: Manual Upload (Simple)

1. After the EAS build completes, download the APK/IPA from [expo.dev](https://expo.dev/)
2. Go to Firebase Console > App Distribution
3. Click "Get Started" and upload the APK/IPA
4. Add tester emails and send invites

### Option B: Automated Upload via CLI

```powershell
# Download your build artifact first, then:
firebase appdistribution:distribute path/to/app.apk `
  --app YOUR_FIREBASE_APP_ID `
  --groups "testers" `
  --release-notes "Test build from $(Get-Date -Format 'yyyy-MM-dd')"
```

**Finding your Firebase App ID:**
1. Go to Firebase Console > Project Settings
2. Under "Your apps", find the Android/iOS app
3. Copy the "App ID" (looks like `1:123456789:android:abc123def456`)

---

## Quick Reference Commands

### Build Commands

```powershell
# Development build (with dev client)
eas build --platform android --profile development

# Preview/Testing build (APK)
eas build --platform android --profile preview

# Production build (AAB for Play Store)
eas build --platform android --profile production
```

### Firebase Distribution Commands

```powershell
# List testers
firebase appdistribution:testers:list --app YOUR_APP_ID

# Add testers
firebase appdistribution:testers:add tester@email.com --app YOUR_APP_ID

# Create a tester group
firebase appdistribution:group:create testers --app YOUR_APP_ID

# Distribute a build
firebase appdistribution:distribute ./app.apk --app YOUR_APP_ID --groups testers
```

---

## Setting Up Automated Distribution (CI/CD)

For automated builds and distribution, you can use GitHub Actions. Here's a sample workflow:

### `.github/workflows/distribute.yml`

```yaml
name: Build and Distribute

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          
      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build APK
        run: eas build --platform android --profile preview --non-interactive
        
      # Download and distribute via Firebase
      - name: Download build
        run: eas build:download --latest --platform android --output ./app.apk
        
      - name: Distribute to Firebase
        uses: wzieba/Firebase-Distribution-Github-Action@v1
        with:
          appId: ${{ secrets.FIREBASE_APP_ID }}
          serviceCredentialsFileContent: ${{ secrets.CREDENTIAL_FILE_CONTENT }}
          groups: testers
          file: ./app.apk
```

**Required GitHub Secrets:**
- `EXPO_TOKEN`: Get from https://expo.dev/accounts/[username]/settings/access-tokens
- `FIREBASE_APP_ID`: Your Firebase Android App ID
- `CREDENTIAL_FILE_CONTENT`: Firebase service account JSON (Base64 encoded)

---

## Troubleshooting

### "eas: command not found"
```powershell
npm install -g eas-cli
```

### "firebase: command not found"
```powershell
npm install -g firebase-tools
```

### Build fails on EAS
- Check your `app.json` has valid `android.package` and `ios.bundleIdentifier`
- Ensure you're logged in: `eas whoami`
- Check build logs on expo.dev

### Firebase distribution fails
- Verify your App ID is correct
- Ensure you've set up App Distribution in Firebase Console
- Check that testers have been added to your project

---

## Next Steps

1. Run `eas build --platform android --profile preview` to create your first test build
2. Upload to Firebase App Distribution
3. Invite testers via email
4. Testers install Firebase App Tester app and accept invite

For more info:
- [EAS Build docs](https://docs.expo.dev/build/introduction/)
- [Firebase App Distribution docs](https://firebase.google.com/docs/app-distribution)

