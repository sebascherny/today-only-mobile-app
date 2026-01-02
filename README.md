# Today Only — From Zero to Google Play (Step-by-step)

This README walks you through **everything from scratch**:

1. Cloning the repo
2. Running the app locally (Android)
3. Building a **production Android App Bundle (.aab)**
4. Publishing it to the **Google Play Store**

This project uses:

- **Expo (React Native) + TypeScript**
- **expo-sqlite** (local persistence)
- **expo-notifications** (daily reminders)
- **@react-native-community/datetimepicker** (time picker)
- **EAS Build** for Play Store builds

---

## 0. Prerequisites

### Accounts

- **Expo account** (for EAS Build): https://expo.dev
- **Google Play Developer account** (for publishing): https://play.google.com/console

### Tools

Install:

- **Node.js** (LTS recommended)
- **Git**
- (Recommended) **Android Studio** (for emulator)

Verify Node:

```bash
node -v
npm -v
```

---

## 1. Clone the repo

```bash
git clone <YOUR_REPO_URL_HERE>
cd today-only

# Install dependencies
npm install
```

---

## 2. Run the app locally (Android)

### Option A — Android Emulator (recommended)

1. Install Android Studio.
2. Open **Android Studio → Device Manager**.
3. Create/start an emulator (Pixel is fine).
4. Start the app:

   ```bash
   npm run start
   ```

5. In the Expo terminal, press `a` to launch on Android.

If you ever hit `Error: spawn adb ENOENT`, your Android SDK/adb isn’t configured:

- Ensure Android Studio installed the SDK.
- Ensure `adb` exists under `~/Library/Android/sdk/platform-tools/adb`.
- Export `ANDROID_HOME` and add `platform-tools` to `PATH`.

### Option B — Physical Android phone

1. Install **Expo Go** from the Play Store.
2. Run:

   ```bash
   npm run start
   ```

3. Scan the QR code with Expo Go (being on the same Wi‑Fi helps).

---

## 3. Project configuration (`app.json`)

Your `app.json` drives app identity and store metadata.

Key fields:

- `expo.name`: user-facing app name
- `android.package`: permanent package id (do not change after release)
- `android.versionCode`: must increase every Play upload

Example:

```json
{
  "expo": {
    "name": "Today Only",
    "slug": "today-only",
    "version": "1.0.0",
    "android": {
      "package": "com.sebascherny.todayonly",
      "versionCode": 1
    },
    "plugins": [
      "expo-sqlite",
      "expo-notifications",
      "@react-native-community/datetimepicker"
    ]
  }
}
```

---

## 4. Assets required by Google Play

Google Play listing requires:

- **App icon** (512×512)
- **Feature Graphic** (1024×500)
- **Screenshots** (at least 2 phone screenshots)

**Feature graphic**:

- Must be 1024 × 500
- PNG or JPG, no transparency
- Create it as `assets/feature-graphic.png` and upload it in Play Console.

---

## 5. Production readiness checklist (recommended)

Before publishing, verify:

- App runs without warnings/errors in console
- Persistence works after app restart
- Notifications enable/disable works on a real device (recommended)
- Daily reset logic behaves correctly
- “Complete today” increments streak only once per day
- App icon, splash, adaptive icon look good
- Privacy Policy URL is ready (required)

---

## 6. Create a Privacy Policy (required)

Even for an ad-free v1, Google Play typically requires a Privacy Policy URL.

Minimal privacy policy example:

> Today Only does not collect, store, or share personal data.
> All app data is stored locally on the device.
> No data is transmitted to external servers.
> This policy will be updated if app functionality changes.

Host it anywhere public, for example:

- GitHub Pages
- Notion public page
- Your personal site

Keep the URL handy — you’ll paste it into Play Console.

---

## 7. EAS setup (build system for Play Store)

### 7.1 Install EAS CLI and log in

```bash
npm install -g eas-cli
eas login
eas whoami
```

### 7.2 Configure EAS in this project

From the project root:

```bash
eas build:configure
```

This generates (or updates) `eas.json`.

Recommended `eas.json`:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    },
    "preview": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

- `production` builds an AAB for Google Play
- `preview` builds an APK (useful for sharing outside Play)

---

## 8. Build the Play Store file (Android App Bundle .aab)

Important: Before each Play upload:

- Bump `android.versionCode` in `app.json` (must increase every time)
- Optionally bump `version` (e.g. `1.0.0` → `1.0.1`)

Build:

```bash
eas build -p android --profile production
```

**Credentials / signing**

On the first build, EAS will ask about Android credentials.

- Recommended: allow EAS to generate and manage the keystore (simplest for solo dev).

When the build finishes, EAS provides a link to download the `.aab`.

---

## 9. Publish to Google Play Store

### 9.1 Create the app entry

1. Go to **Google Play Console → Create app**.
2. Example settings:
   - App name: **Today Only**
   - Default language
   - App type: **App**
   - Pricing: **Free** (recommended)
   - Ads: **No** (ad-free v1)

### 9.2 Complete the required setup items

Play Console will show required steps such as:

- Store listing
  - Title, short description, full description
  - Upload icon, feature graphic, screenshots
- Privacy policy URL
- Content rating questionnaire
- Target audience
- Data safety form
- App access (usually: “all functionality available without special access”)

### 9.3 Upload the build to Internal testing (recommended first)

1. In Play Console: **Testing → Internal testing**.
2. Create a new release.
3. Upload the `.aab` from EAS.
4. Add testers (your email, friends/family).
5. Publish internal test.
6. Install the app from the Play Store internal testing link and verify:
   - Install/update works
   - Notifications work
   - Persistence works

### 9.4 Promote to Production

Once internal testing is good:

1. Play Console → **Production → Create release**.
2. Promote the same artifact, or upload a new one.
3. Submit for review.
4. (Optional) configure a staged rollout percentage.

Once approved, anyone in your selected countries can install it.

---

## 10. Updating the app (v1.0.1, v1.1.0, etc.)

Every update requires:

- Bump `android.versionCode` (1 → 2 → 3 → …)
- Optionally bump `version` (`1.0.0` → `1.0.1`)

Then build again:

```bash
eas build -p android --profile production
```

Upload the new `.aab` to Play Console → desired release track.

---

## 11. Common pitfalls

- **“versionCode already used”**
  - You forgot to increment `android.versionCode`. Increase it and rebuild.

- **Notifications not firing on emulator**
  - Test on a real device at least once; emulators can behave differently depending on power/background settings.

- **Changed `android.package` after publishing**
  - Don’t. Package name is the app’s identity on Play. Changing it means a new app listing.

- **Added ads later**
  - If you add AdMob in a future version:
    - Update Privacy Policy
    - Update Data Safety declarations
    - Declare “contains ads” in Play Console

---

## 12. Suggested release flow (best practice)

1. Internal testing (you + 1–2 people)
2. Production staged rollout (e.g. 20% → 100%)
3. Iterate based on real usage

---

## 13. Useful commands

**Run dev server:**

```bash
npm run start
```

**Clear Metro cache:**

```bash
npm run start -- --clear
```

**Build Android AAB (production):**

```bash
eas build -p android --profile production
```

---

If you follow this guide, you will go from clone → run → build `.aab` → upload → publish successfully.

If you get stuck at any step, paste the exact terminal output or Play Console error and adjust accordingly.