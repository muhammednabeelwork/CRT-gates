# Netlify Deployment Guide

This document walks you through deploying the MTU Gate app to Netlify.

## Prerequisites

1. **Netlify Account**: Sign up at [netlify.com](https://netlify.com) if you don't have one.
2. **GitHub Repository**: Push your code to GitHub (Netlify connects to GitHub for automatic deployments).
3. **Firebase Project**: Ensure you have a Firebase project set up with:
   - Firestore database
   - Firebase Storage bucket
   - Firebase Authentication enabled

## Step 1: Get Firebase Credentials

### Client-side credentials (for the browser)
1. Go to Firebase Console > Project Settings (gear icon)
2. Under "Your apps", find the web app config
3. Copy these values:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

### Server-side credentials (for Netlify functions)
1. Go to Firebase Console > Project Settings > Service Accounts tab
2. Click "Generate New Private Key"
3. This downloads a JSON file — keep it safe and secret
4. Copy the entire JSON content (you'll paste it into Netlify as an env var)

## Step 2: Push Code to GitHub

```bash
git add .
git commit -m "Add Firebase auth and server-side upload"
git push origin main
```

## Step 3: Connect GitHub to Netlify

1. Go to [netlify.com](https://app.netlify.com)
2. Click **"Add new site"** > **"Import an existing project"**
3. Select **GitHub** as your Git provider and authorize Netlify
4. Choose your repository (`mtu-gate`)
5. Leave build settings as default (Netlify auto-detects `netlify.toml`)
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click **"Deploy site"** (this will fail until you add env vars — that's expected)

## Step 4: Set Environment Variables in Netlify

After the initial deploy fails, configure env vars:

1. Go to your Netlify site dashboard
2. Click **"Site settings"** > **"Build & deploy"** > **"Environment"**
3. Click **"Edit variables"** and add the following:

### Client Variables (VITE_*)
These are build-time variables used by the React app:

| Key | Value |
|-----|-------|
| `VITE_FIREBASE_API_KEY` | `your_api_key_here` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `your_project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `your_project_id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `your_project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `your_sender_id` |
| `VITE_FIREBASE_APP_ID` | `your_app_id` |

### Server Variable (for Netlify functions)
| Key | Value |
|-----|-------|
| `FIREBASE_SERVICE_ACCOUNT` | Paste the entire Firebase service account JSON here (as a single line or with `\n` for newlines) |

## Step 5: Configure Firebase Security Rules

### Firestore Rules
Update your Firestore security rules to allow uploads (server-side):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /images/{document=**} {
      allow read: if true; // Anyone can read images
      allow create: if request.auth != null; // Only authenticated users can create
      allow delete, update: if request.auth.uid == resource.data.uploader; // Users can only modify their own
    }
  }
}
```

### Firebase Storage Rules
Update your Storage security rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /uploads/{allPaths=**} {
      allow read: if true; // Public read access
      allow write: if request.auth != null; // Authenticated users only
    }
  }
}
```

## Step 6: Trigger a Redeploy

Once env vars are set:

1. Go to **Deploys** tab on your Netlify site
2. Click **"Trigger deploy"** > **"Deploy site"**
3. Wait for the build to complete

Your site should now be live!

## Step 7: Verify Deployment

1. Visit your Netlify site URL (e.g., `https://your-site-name.netlify.app`)
2. Navigate to `/main` — you should see the controller dashboard
3. Try uploading an image — it should upload to Firebase and appear on the display screen

## Troubleshooting

### Build fails with "Firebase not configured"
- Ensure all `VITE_FIREBASE_*` variables are set in Netlify
- Redeploy after setting vars: **Deploys** > **Trigger deploy**

### Upload function returns 500
- Check **Netlify Functions** logs: **Site settings** > **Functions**
- Ensure `FIREBASE_SERVICE_ACCOUNT` is correctly formatted (single line or with proper newlines)
- Verify the Firebase service account has the correct permissions

### Images not appearing on display screen
- Check that Firestore rules allow reads (see Security Rules above)
- Verify images collection exists in your Firestore database

### Realtime sync not working across devices
- Firestore listeners only sync within the same browser/tab
- For cross-device sync, ensure both devices have the same Firestore rules

## Local Testing Before Netlify

To test locally with Netlify functions:

```bash
npm install -g netlify-cli
netlify dev
```

This runs your site on `http://localhost:3000` with local functions emulation.

## Next Steps

- **Custom domain**: In Netlify **Site settings** > **Domain management**, add a custom domain
- **Auto-deploys**: Netlify automatically redeploys when you push to GitHub
- **SSL/TLS**: Netlify provides free SSL certificates automatically

---

For questions, check the [Netlify docs](https://docs.netlify.com) or [Firebase docs](https://firebase.google.com/docs).
