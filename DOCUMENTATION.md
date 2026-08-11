# ViaSetu App - Complete Documentation (A-Z)

**Last Updated:** August 11, 2026  
**Version:** 1.0.0  
**Owner:** ViaSetu Team  
**Repository:** The Salebridge APK

---

## 📑 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Setup & Installation](#setup--installation)
4. [Development Guide](#development-guide)
5. [Building for App Stores](#building-for-app-stores)
6. [Deployment & Submission](#deployment--submission)
7. [Integrations](#integrations)
8. [API Documentation](#api-documentation)
9. [Database & Data](#database--data)
10. [Maintenance & Updates](#maintenance--updates)
11. [Environment Variables](#environment-variables)
12. [Troubleshooting](#troubleshooting)
13. [CI/CD Pipeline](#cicd-pipeline)
14. [Monitoring & Analytics](#monitoring--analytics)

---

## Project Overview

### What is ViaSetu?
ViaSetu is a React Native mobile application built with Expo that provides delivery tracking, logistics, and file management services. It's a cross-platform app (iOS & Android) with real-time location tracking, camera integration, and push notifications.

### Key Features
- 📍 Real-time location tracking and delivery updates
- 📸 Image capture and file upload
- 🔔 Push notifications via OneSignal
- 🗺️ Geolocation services
- 📱 Cross-platform (iOS & Android)
- 🔐 Firebase integration for authentication and real-time data
- 📊 Analytics and crash reporting

### Tech Stack
- **Framework:** React Native (Expo 54)
- **Language:** TypeScript
- **Frontend:** React 19, Expo Router (file-based routing)
- **Backend:** Node.js + Express + Drizzle ORM
- **Database:** Database managed by Drizzle ORM
- **Push Notifications:** OneSignal
- **Analytics:** Firebase Analytics
- **State Management:** React hooks + Context API

### Project Structure
```
ViaSetu-Explorer/
├── artifacts/
│   ├── mobile/              # Main React Native app (iOS & Android)
│   │   ├── app/            # Expo Router screens
│   │   ├── assets/         # Images, icons, fonts
│   │   ├── plugins/        # Custom Expo plugins
│   │   ├── app.json        # Expo configuration
│   │   ├── eas.json        # EAS Build configuration
│   │   └── package.json
│   ├── api-server/         # Backend API server
│   └── mockup-sandbox/     # Design mockups/prototypes
├── lib/
│   ├── api-client-react/   # React API client library
│   ├── api-spec/           # API type definitions (Zod)
│   ├── api-zod/            # Zod schemas
│   └── db/                 # Database schemas & migrations
└── scripts/                # Deployment & build scripts
```

---

## Architecture

### Mobile App Architecture
```
┌─────────────────────────────────────┐
│   ViaSetu React Native App (Expo)   │
│  ┌─────────────────────────────────┐│
│  │  Expo Router (Navigation)       ││
│  │  - File-based routing           ││
│  │  - Deep linking                 ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │  React Components & Screens     ││
│  │  - Location tracking            ││
│  │  - Image upload                 ││
│  │  - Notifications                ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │  Native Modules (Plugins)       ││
│  │  - expo-location                ││
│  │  - expo-image-picker            ││
│  │  - expo-camera                  ││
│  │  - react-native-onesignal       ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
         │
         ↓ (HTTPS)
┌─────────────────────────────────────┐
│   Backend API Server                │
│   (Node.js + Express)               │
│   - REST endpoints                  │
│   - Authentication                  │
│   - Data validation                 │
└─────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│   Database (Drizzle ORM)            │
│   - PostgreSQL / SQLite             │
└─────────────────────────────────────┘
         │
┌─────────────────────────────────────┐
│   External Services                 │
│   - Firebase (Auth, Analytics)      │
│   - OneSignal (Push notifications)  │
│   - Google Maps API                 │
│   - Google Cloud Storage            │
└─────────────────────────────────────┘
```

---

## Setup & Installation

### Prerequisites
- **Node.js:** v18+ (check with `node --version`)
- **pnpm:** v8+ (package manager - `npm install -g pnpm`)
- **Expo CLI:** Installed globally (`pnpm add -g expo-cli`)
- **Git:** For version control
- **Firebase Account:** For backend services
- **OneSignal Account:** For push notifications
- **Xcode:** For iOS development (macOS only)
- **Android Studio:** For Android development

### 1. Clone Repository
```bash
git clone https://github.com/your-org/The-Salebridge-APK.git
cd ViaSetu-Explorer
```

### 2. Install Dependencies
```bash
# Install root dependencies
pnpm install

# Install workspace dependencies
pnpm install -r
```

### 3. Setup Environment Variables
```bash
# Create .env file in root
cp .env.example .env

# Create .env file in mobile app
cp artifacts/mobile/.env.example artifacts/mobile/.env
```

**Required Variables:**
```env
# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_PROJECT_ID=viasetu-41446
EXPO_PUBLIC_FIREBASE_DATABASE_URL=your_db_url

# API Server
EXPO_PUBLIC_API_URL=https://your-api-server.com
EXPO_PUBLIC_DOMAIN=your-domain.com

# OneSignal
EXPO_PUBLIC_ONESIGNAL_APP_ID=your_onesignal_id

# Development
NODE_ENV=development
```

### 4. Verify Setup
```bash
# Check TypeScript compilation
pnpm run typecheck

# Verify all dependencies installed
pnpm list
```

---

## Development Guide

### Running the App Locally

#### On Expo Go (Easiest for Development)
```bash
cd artifacts/mobile
pnpm run dev
```
Scan the QR code with:
- **iPhone:** Camera app or Expo Go app
- **Android:** Expo Go app

#### On Physical Device
1. Install Expo Go app from App Store or Play Store
2. Ensure phone is on same WiFi as development machine
3. Run `pnpm run dev` and scan QR code

#### On Emulator
```bash
# Android Emulator
pnpm run dev
# Press 'a' to open in Android Emulator

# iOS Simulator (macOS only)
pnpm run dev
# Press 'i' to open in iOS Simulator
```

### Project Structure (Mobile App)
```
artifacts/mobile/
├── app/                      # Expo Router screens (file-based routing)
│   ├── index.tsx            # Home screen
│   ├── _layout.tsx          # Root layout
│   └── +not-found.tsx       # 404 screen
├── assets/
│   ├── images/              # Icons, splash, adaptive icons
│   └── fonts/               # Custom fonts
├── plugins/
│   └── with-arm64-only.js   # Android ARM64 optimization
├── app.json                 # Expo configuration
├── eas.json                 # EAS Build config
├── babel.config.js          # Babel configuration
├── metro.config.js          # Metro bundler config
├── tsconfig.json            # TypeScript config
└── package.json
```

### Common Development Tasks

#### Run Type Checking
```bash
cd artifacts/mobile
pnpm run typecheck
```

#### Build Development APK
```bash
cd artifacts/mobile
eas build --platform android --profile preview
```

#### Build Development IPA
```bash
cd artifacts/mobile
eas build --platform ios --profile preview
```

#### Clear Expo Cache
```bash
pnpm run dev -- --clear
```

#### Reset Native Code
```bash
cd artifacts/mobile
rm -rf node_modules .expo dist build
pnpm install
```

---

## Building for App Stores

### Pre-Build Checklist
- [ ] Version code incremented (Android)
- [ ] Build number incremented (iOS)
- [ ] All secrets/tokens not committed to git
- [ ] App has been tested on device
- [ ] No console errors or warnings
- [ ] All permissions properly requested
- [ ] Privacy policy updated
- [ ] Screenshots prepared for store listings

### Android (Play Store)

#### Step 1: Increment Version
Edit `artifacts/mobile/app.json`:
```json
{
  "expo": {
    "android": {
      "versionCode": 5  // Increment this (previous: 4)
    }
  }
}
```

#### Step 2: Build Release
```bash
cd artifacts/mobile
eas build --platform android --auto-submit
```

#### Step 3: Manual Build (if needed)
```bash
eas build --platform android --profile production
```

#### Step 4: Verify Build
- Download from EAS dashboard
- Test on Android device
- Check all features work

### iOS (App Store)

#### Step 1: Increment Version
Edit `artifacts/mobile/app.json`:
```json
{
  "expo": {
    "ios": {
      "buildNumber": "2"  // Increment this
    }
  }
}
```

#### Step 2: Update Credentials
Edit `artifacts/mobile/eas.json`:
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-email@example.com",
        "ascAppId": "YOUR_ASC_APP_ID",
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

#### Step 3: Build Release
```bash
cd artifacts/mobile
eas build --platform ios --auto-submit
```

---

## Deployment & Submission

### Google Play Store Submission

#### Prerequisites
1. **Google Play Developer Account** ($25 one-time fee)
2. **App Signing Certificate** (managed by Google)
3. **Store Listing** created in Google Play Console
4. **EAS Credentials** configured

#### Step-by-Step Submission

1. **Create App in Play Console**
   - Go to [Google Play Console](https://play.google.com/console)
   - Create new app: "ViaSetu"
   - Package name: `com.viasetu.app`
   - Select category, content rating

2. **Setup Signing**
   ```bash
   eas credentials
   # Select Android
   # Select com.viasetu.app
   # Create new signing certificate (or use existing)
   ```

3. **Build for Production**
   ```bash
   cd artifacts/mobile
   eas build --platform android --profile production
   ```

4. **Review Build**
   - Download APK/AAB from EAS dashboard
   - Test on physical Android device
   - Check all permissions requested properly

5. **Submit to Play Store**
   ```bash
   eas submit --platform android --latest
   # Or auto-submit during build:
   eas build --platform android --profile production --auto-submit
   ```

6. **Complete Store Listing**
   - Add app title, description
   - Upload screenshots (min. 2, max. 8)
   - Upload feature graphic (1024 x 500)
   - Set app category, content rating
   - Add privacy policy URL

7. **Review & Publish**
   - Submit for review
   - Wait for Google's review (usually 24-48 hours)
   - Once approved, publish to production

#### Track Submission Status
```bash
eas submit --status
```

### Apple App Store Submission

#### Prerequisites
1. **Apple Developer Account** ($99/year)
2. **App ID & Bundle Identifier** created in App Store Connect
3. **Code Signing Certificate** from Apple Developer Program
4. **Provisioning Profile**
5. **EAS Credentials** configured

#### Step-by-Step Submission

1. **Create App in App Store Connect**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Create new app
   - Bundle ID: `com.viasetu.app`
   - Select category, subcategory

2. **Setup Signing**
   ```bash
   eas credentials
   # Select iOS
   # Select com.viasetu.app
   # Create/upload signing certificate
   # Create/manage provisioning profiles
   ```

3. **Build for Production**
   ```bash
   cd artifacts/mobile
   eas build --platform ios --profile production
   ```

4. **Review Build**
   - Check TestFlight build
   - Test on iPhone (iOS device)
   - Verify all features work

5. **Submit to App Store**
   ```bash
   eas submit --platform ios --latest
   # Or auto-submit:
   eas build --platform ios --profile production --auto-submit
   ```

6. **Complete App Store Listing**
   - App name, subtitle, description
   - Screenshots (iPhone, iPad)
   - Preview video (optional)
   - Keywords, support URL
   - Privacy policy

7. **Add App Rating**
   - Fill out app rating questionnaire
   - Set content rating

8. **Review & Release**
   - Submit for review
   - Wait for Apple's review (24 hours - 3 days)
   - Once approved, release to App Store

#### Track Submission Status
```bash
eas submit --status
```

---

## Integrations

### 1. Firebase Integration

#### Setup
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project: "ViaSetu"
3. Add Android app: package `com.viasetu.app`
4. Download `google-services.json`
5. Place in `artifacts/mobile/google-services.json`

#### Used Services
- **Authentication:** User sign-up, login
- **Realtime Database:** Live delivery tracking
- **Cloud Storage:** File uploads
- **Analytics:** Event tracking

#### Example Usage
```typescript
// firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
```

### 2. OneSignal Push Notifications

#### Setup
1. Create OneSignal account at [OneSignal.com](https://onesignal.com)
2. Create new app
3. Select "React Native"
4. Get App ID
5. Add to environment: `EXPO_PUBLIC_ONESIGNAL_APP_ID`

#### Configuration
In `app.json`:
```json
{
  "plugins": [
    [
      "onesignal-expo-plugin",
      {
        "mode": "production"
      }
    ]
  ]
}
```

#### Send Notifications
```typescript
// In API server
const OneSignal = require('onesignal-node');

const client = new OneSignal.Client({
  userAuthKey: process.env.ONESIGNAL_AUTH_KEY,
  app: { appAuthKey: process.env.ONESIGNAL_API_KEY, appId: process.env.ONESIGNAL_APP_ID }
});

await client.createNotification({
  contents: { en: "Delivery Update" },
  included_segments: ["All"],
  data: { delivery_id: "123" }
});
```

### 3. Location Services

#### Permissions
App requests these location permissions:
- Access Fine Location (GPS)
- Access Coarse Location (network)

#### Usage
```typescript
import * as Location from 'expo-location';

export async function getLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;
  
  return await Location.getCurrentPositionAsync({});
}
```

#### Background Location Tracking
For delivery tracking background updates:
```typescript
await Location.startLocationUpdatesAsync('location-task', {
  accuracy: Location.Accuracy.High,
  timeInterval: 10000, // 10 seconds
  distanceInterval: 0,
});
```

### 4. Camera & Image Upload

#### Permissions
- Camera
- Photo Library Read

#### Implementation
```typescript
import * as ImagePicker from 'expo-image-picker';

export async function pickImage() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });

  if (!result.cancelled) {
    return result.assets[0];
  }
}
```

### 5. API Client Integration

#### Setup
```bash
cd lib/api-client-react
pnpm install
```

#### Usage
```typescript
import { useApiClient } from '@workspace/api-client-react';

export function MyComponent() {
  const api = useApiClient();
  
  const { data, loading } = api.deliveries.list();
  
  return (
    <View>
      {loading ? <Text>Loading...</Text> : <DeliveryList data={data} />}
    </View>
  );
}
```

---

## API Documentation

### Base URL
- Development: `https://localhost:3000`
- Production: `https://api.viasetu.com`

### Authentication
All requests require bearer token:
```bash
Authorization: Bearer <firebase_auth_token>
```

### Main Endpoints

#### Deliveries
```
GET    /api/deliveries              # List all
GET    /api/deliveries/:id          # Get one
POST   /api/deliveries              # Create
PATCH  /api/deliveries/:id          # Update
DELETE /api/deliveries/:id          # Delete
```

#### Tracking
```
GET    /api/tracking/:delivery_id   # Get location history
POST   /api/tracking/update         # Update location
```

#### Files
```
POST   /api/files/upload            # Upload file
GET    /api/files/:id               # Download file
DELETE /api/files/:id               # Delete file
```

### Database Schema
Defined in `lib/db/src/schema.ts`:
- `deliveries` - Delivery orders
- `tracking` - Location history
- `users` - User profiles
- `files` - Uploaded files

---

## Database & Data

### Drizzle ORM Setup
```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const db = drizzle(pool, { schema });

// Example query
const delivery = await db.query.deliveries.findFirst({
  where: eq(deliveries.id, id),
  with: { tracking: true }
});
```

### Migration
Create new migration:
```bash
cd lib/db
drizzle-kit generate:pg
```

Apply migration:
```bash
pnpm run migrate
```

### Backup
```bash
# PostgreSQL backup
pg_dump -h localhost -U user database > backup.sql

# Restore
psql -h localhost -U user database < backup.sql
```

---

## Maintenance & Updates

### Regular Tasks

#### Weekly
- [ ] Monitor crash reports in Firebase Console
- [ ] Check OneSignal delivery rates
- [ ] Review user feedback

#### Monthly
- [ ] Update dependencies: `pnpm update`
- [ ] Review analytics data
- [ ] Check API performance
- [ ] Review database usage

#### Quarterly
- [ ] Major version updates
- [ ] Security audit
- [ ] Performance optimization
- [ ] User testing

### Updating Dependencies
```bash
# Check outdated packages
pnpm outdated

# Update all packages
pnpm update -r

# Update specific package
pnpm add package-name@latest -r
```

### Publishing Updates

#### Increment Version
1. Update `versionCode` (Android) in `app.json`
2. Update `buildNumber` (iOS) in `app.json`
3. Update version in `package.json`

#### Build and Submit
```bash
# Commit changes
git add .
git commit -m "chore: release v1.1.0"
git tag v1.1.0

# Build and auto-submit
cd artifacts/mobile
eas build --platform android --auto-submit
eas build --platform ios --auto-submit

# Push changes
git push origin main --tags
```

---

## Environment Variables

### Development (.env.development)
```env
NODE_ENV=development
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_DOMAIN=localhost:3000

EXPO_PUBLIC_FIREBASE_API_KEY=dev_key
EXPO_PUBLIC_FIREBASE_PROJECT_ID=viasetu-dev
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://viasetu-dev.firebaseio.com

EXPO_PUBLIC_ONESIGNAL_APP_ID=dev_id

DEBUG=*
```

### Production (.env.production)
```env
NODE_ENV=production
EXPO_PUBLIC_API_URL=https://api.viasetu.com
EXPO_PUBLIC_DOMAIN=viasetu.com

EXPO_PUBLIC_FIREBASE_API_KEY=prod_key
EXPO_PUBLIC_FIREBASE_PROJECT_ID=viasetu-41446
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://viasetu-41446.firebaseio.com

EXPO_PUBLIC_ONESIGNAL_APP_ID=prod_id
```

### Server Environment
```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Firebase
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Signing
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret

# OneSignal
ONESIGNAL_API_KEY=your_api_key
ONESIGNAL_AUTH_KEY=your_auth_key
ONESIGNAL_APP_ID=your_app_id
```

---

## Troubleshooting

### Common Issues

#### 1. App Won't Start
**Symptoms:** Blank screen, crash on launch

**Solutions:**
```bash
# Clear cache
pnpm run dev -- --clear

# Reset native code
rm -rf node_modules .expo dist
pnpm install

# Check logs
pnpm run dev 2>&1 | tee app.log
```

#### 2. Location Permission Denied
**Symptoms:** Location tracking not working

**Solutions:**
- iOS: Settings → App → Location → Always (or While Using)
- Android: Settings → Apps → ViaSetu → Permissions → Location

#### 3. Push Notifications Not Received
**Symptoms:** OneSignal configured but notifications don't arrive

**Solutions:**
```bash
# Verify OneSignal App ID
echo $EXPO_PUBLIC_ONESIGNAL_APP_ID

# Check OneSignal console for delivery status
# Rebuild app:
eas build --platform android --profile preview --clear-cache

# Check device is registered in OneSignal
```

#### 4. Firebase Connection Error
**Symptoms:** "Permission denied" errors, can't authenticate

**Solutions:**
- Verify Firebase project ID in `.env`
- Check Google services file: `artifacts/mobile/google-services.json`
- Verify database rules in Firebase Console
- Check network connectivity

#### 5. Build Fails with "Signing Error"
**Symptoms:** EAS build fails during signing

**Solutions:**
```bash
# Update credentials
eas credentials

# Regenerate certificate
eas credentials --platform android --clear

# Retry build
eas build --platform android --profile production --clear-cache
```

#### 6. APK Won't Install on Device
**Symptoms:** "Parse error" or "Installation failed"

**Solutions:**
- Uninstall previous version: `adb uninstall com.viasetu.app`
- Enable "Unknown Sources" in Android settings
- Check Android version compatibility (minSdkVersion: 21)
- Rebuild for correct architecture

#### 7. iOS Build Rejected
**Symptoms:** "Missing required icon" or "Invalid bundle"

**Solutions:**
- Verify icon sizes (1024×1024 minimum)
- Check bundle ID matches provisioning profile
- Update build number in `app.json`
- Review App Store Connect messages

### Debug Mode

#### Enable Verbose Logging
```bash
export DEBUG=*
pnpm run dev
```

#### Check Device Logs

**Android:**
```bash
adb logcat | grep ViaSetu
```

**iOS:**
```bash
xcrun simctl spawn booted log stream --predicate 'eventMessage contains "ViaSetu"'
```

### Performance Issues

#### App Slow to Start
```bash
# Profile startup
pnpm run dev -- --maxWorkers=1

# Check large bundles
expo bundle-visualizer --platform android
```

#### High Memory Usage
```bash
# Check for memory leaks
# Use React DevTools Profiler
# Monitor in device settings
```

---

## CI/CD Pipeline

### GitHub Actions Setup

Create `.github/workflows/deploy.yml`:

```yaml
name: Build & Deploy to Stores

on:
  push:
    branches:
      - main
    paths:
      - 'artifacts/mobile/**'
      - '.github/workflows/deploy.yml'

jobs:
  build-and-submit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - run: pnpm install

      - name: Build & Submit Android
        env:
          EAS_TOKEN: ${{ secrets.EAS_TOKEN }}
        run: |
          cd artifacts/mobile
          eas build --platform android --auto-submit

      - name: Build & Submit iOS
        env:
          EAS_TOKEN: ${{ secrets.EAS_TOKEN }}
        run: |
          cd artifacts/mobile
          eas build --platform ios --auto-submit

      - name: Notify Slack
        if: failure()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -d '{"text":"ViaSetu build failed"}'
```

### Setup GitHub Secrets
1. Go to Repository Settings → Secrets
2. Add:
   - `EAS_TOKEN` - From EAS dashboard
   - `SLACK_WEBHOOK` - For notifications

### Manual Deployment

#### Build & Test
```bash
cd artifacts/mobile
eas build --platform android --profile preview
```

#### Submit to Stores
```bash
# Auto-submit during build
eas build --platform android --profile production --auto-submit

# Or submit existing build
eas submit --platform android --latest
```

---

## Monitoring & Analytics

### Firebase Analytics

#### Setup
Already configured in app. Automatic events tracked:
- App opens
- Screen views
- Crashes
- Performance metrics

#### Custom Events
```typescript
import { analytics } from '@/firebase';
import { logEvent } from 'firebase/analytics';

logEvent(analytics, 'delivery_completed', {
  delivery_id: id,
  distance: distance,
  time_taken: duration
});
```

#### View in Console
[Firebase Console](https://console.firebase.google.com) → Analytics → Dashboard

### Crash Reporting

#### Automatic Crash Reports
Firebase automatically reports crashes. View in:
Firebase Console → Crashlytics → Issues

#### Send Custom Error Report
```typescript
import { crashlytics } from '@/firebase';

try {
  // code
} catch (error) {
  crashlytics().recordError(error);
}
```

### Performance Monitoring

#### Setup
```bash
pnpm add firebase-performance
```

#### Track Custom Metrics
```typescript
import { performance } from 'firebase/performance';

const trace = performance.trace('deliveries_load');
trace.start();

// load data

trace.stop();
```

### Monitoring Checklist

**Daily:**
- [ ] Zero critical crashes
- [ ] API response time < 2s
- [ ] Notification delivery > 95%

**Weekly:**
- [ ] App ratings staying above 4.5
- [ ] Crash-free users > 99%
- [ ] Performance metrics stable

**Monthly:**
- [ ] User retention analysis
- [ ] Feature usage tracking
- [ ] Performance optimization review

---

## Useful Commands Reference

```bash
# Development
pnpm run dev                          # Start dev server
pnpm run typecheck                    # Type checking
pnpm run build                        # Build project

# EAS Build
eas build --platform android          # Build for Android
eas build --platform ios              # Build for iOS
eas build --platform android --profile preview
eas build --platform android --auto-submit

# EAS Submit
eas submit --platform android --latest
eas submit --status

# Credentials
eas credentials                       # Manage signing credentials
eas credentials --platform android --clear

# Database
cd lib/db
drizzle-kit generate:pg              # Generate migration
pnpm run migrate                      # Apply migration

# Dependencies
pnpm update -r                        # Update all packages
pnpm outdated                         # Check outdated packages

# Debugging
export DEBUG=*                        # Enable verbose logging
adb logcat | grep ViaSetu             # Android logs
```

---

## Support & Resources

### Documentation
- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [Firebase Docs](https://firebase.google.com/docs)
- [OneSignal Docs](https://documentation.onesignal.com)

### Communication
- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions
- **Email:** team@viasetu.com

### Getting Help
1. Check troubleshooting section above
2. Search GitHub issues
3. Search Stack Overflow
4. Contact team

---

## Checklist for Release

Before every production release, ensure:

- [ ] Version number incremented
- [ ] All tests passing
- [ ] No console warnings/errors
- [ ] App tested on real device
- [ ] Environment variables correct
- [ ] Firebase credentials valid
- [ ] OneSignal configuration correct
- [ ] API endpoints accessible
- [ ] All permissions requested
- [ ] Privacy policy updated
- [ ] App screenshots updated
- [ ] Store listings reviewed
- [ ] Changelog updated
- [ ] Git tags created
- [ ] Backup of data taken

---

**Last Updated:** August 11, 2026  
**Next Review Date:** August 11, 2026 + 3 months
