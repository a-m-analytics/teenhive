# Teen Hive — App Store Submission Guide

## App Metadata

| Field | Value |
|---|---|
| **App Name** | Teen Hive |
| **Subtitle** | Local jobs for teens |
| **Bundle ID** | com.teenhive.app |
| **Version** | 1.0.0 |
| **Category** | Lifestyle |
| **Secondary Category** | Social Networking |
| **Age Rating** | 12+ |
| **Copyright** | 2026 Teen Hive |

## Keywords (100 chars max)
```
teen jobs,babysitting,tutoring,lawn care,pet care,neighborhood,local jobs,youth,errands
```

## App Description (4000 chars max)

```
Teen Hive connects teens aged 13–17 with parents in their neighborhood for local jobs — babysitting, tutoring, yard work, pet care, and more.

FOR TEENS
Browse real jobs posted by verified parents near you. Apply in seconds, chat safely in-app before meeting, and build a reputation with reviews. Get paid for skills you already have.

FOR PARENTS
Find trusted, reviewed teens right in your neighborhood. Post a job in under two minutes, browse teen profiles and ratings, and communicate safely — all in one place.

SAFE BY DESIGN
• All communication stays in the app until both parties are comfortable
• In-app block and report tools
• Verified parent badges
• Reviews after every job keep everyone accountable

LOCAL BY NATURE
Teen Hive is hyperlocal — every job and every teen profile is in your neighborhood. No strangers from across town.

HOW IT WORKS
1. Create a profile (teen or parent)
2. Browse jobs or browse teens
3. Apply or invite
4. Chat in-app, agree on details
5. Complete the job, leave a review

No payment processing — all arrangements are made directly between teens and parents, keeping things simple and familiar.
```

## URLs

| Field | Value |
|---|---|
| **Support URL** | https://teenhive.app/support |
| **Marketing URL** | https://teenhive.app |
| **Privacy Policy URL** | https://teenhive.app/privacy |

> **Action required:** Host your privacy policy at the URL above before submitting. The app's privacy and terms screens have full content you can copy to your website.

---

## Pre-Submission Checklist

### Apple Developer Account
- [ ] Enrolled in Apple Developer Program ($99/year) at developer.apple.com
- [ ] App record created in App Store Connect (appstoreconnect.apple.com)
- [ ] App Store Connect App ID noted — fill in `eas.json` → `submit.production.ios.ascAppId`
- [ ] Apple Team ID noted — fill in `eas.json` → `submit.production.ios.appleTeamId`

### EAS Setup
- [ ] Run `npm install -g eas-cli` (or `npx eas-cli`)
- [ ] Run `eas login` with your Expo account
- [ ] Fill in the three placeholder values in `eas.json` (`YOUR_APPLE_ID_EMAIL`, `YOUR_APP_STORE_CONNECT_APP_ID`, `YOUR_APPLE_TEAM_ID`)
- [ ] Run `eas credentials` to generate/register iOS certificate and provisioning profile

### Build & Submit (TestFlight)
```bash
# 1. Install dependencies (clerk was removed, run this once)
npm install

# 2. Build for App Store
eas build --platform ios --profile production

# 3. Submit to TestFlight
eas submit --platform ios --profile production
```

### App Store Connect Setup (before external TestFlight)
- [ ] Fill in app name, subtitle, description, keywords
- [ ] Set age rating: **12+** (Social Networking → Frequent/Intense, since users can message each other)
- [ ] Add Privacy Policy URL: https://teenhive.app/privacy
- [ ] Add support URL
- [ ] Upload screenshots (see below)
- [ ] Complete App Privacy questionnaire (see Data Collection section)

### Screenshots Required
Capture on a real device or Simulator at these sizes:
| Device | Size | Required |
|---|---|---|
| iPhone 16 Pro Max | 6.9" | Yes |
| iPhone 14 Plus / 15 Plus | 6.5" | Recommended |
| iPad Pro 13" | 12.9" | No (tablet disabled) |

**Suggested screenshot screens to capture:**
1. Teen home / job feed
2. Job detail page
3. Chat / messages
4. Parent: browse teens
5. Profile / reviews

### App Privacy (Data Collection — required in App Store Connect)
You **do collect** and **link to identity**:
- Name ✓ (user profiles)
- Email Address ✓ (account creation)
- User Content ✓ (messages, job posts, reviews)
- Usage Data ✓ (PostHog analytics)
- Identifiers ✓ (user IDs)

You **do NOT collect**:
- Precise location (location is user-entered text only)
- Photos/videos
- Health or financial info
- Contacts or browsing history
- Payment info

### App Review Notes (paste into App Store Connect → Review → Notes)
```
Teen Hive is a two-sided local job marketplace connecting teens (ages 13–17) with parents/guardians for neighborhood micro-jobs (babysitting, tutoring, yard work, etc.).

KEY NOTES FOR REVIEW:
• No payment processing — all payment arrangements are made directly between users outside the app.
• Age minimum: users must be 13+ to register. Teens must select the "Teen" role during signup.
• All messaging is kept in-app with block/report functionality available in every conversation.
• The app does not use precise device location — neighborhood is entered as free text by the user.
• Push notifications require permission — no notifications are sent without explicit user consent.

TEST ACCOUNT (Teen):
  Email: testteen@teenhive.app
  Password: TestTeen123!

TEST ACCOUNT (Parent):
  Email: testparent@teenhive.app
  Password: TestParent123!

(Create these test accounts in Supabase before submitting for review.)
```

---

## After App ID is Known

1. Open [app/about.tsx](app/about.tsx) and replace `YOUR_APP_STORE_ID` with your numeric App Store app ID (e.g. `6743210987`).
2. Update the version in [app/about.tsx](app/about.tsx) if needed — currently hardcoded as `1.0.0`.

---

## OTA Updates (after initial release)

Once live, you can push JS-only updates without a new App Store review:
```bash
eas update --channel production --message "Fix: [describe change]"
```
This works for any change that doesn't modify native code (plugins, permissions, new native modules).
