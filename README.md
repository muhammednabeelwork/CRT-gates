# Self-Sufficient Sanitation Infrastructure

This is a premium, dual-screen interactive exhibition digital signage system designed with a futuristic luxury aesthetic.

## 🚀 Quick Start (Localhost Running)

Follow these simple steps to run this full-stack application on your local machine:

### 1. Extract and Install Dependencies
Navigate to your project's root folder and run:
```bash
npm install
```

### 2. Launch the Development Server
This boots the full-stack server (React + Vite + Express + Live SSE synchronization link) dynamically:
```bash
npm run dev
```

Your system will then be live at **`http://localhost:3000`**!

---

## 📺 How to Use the Dual Screens

1. **Gate Gateway/Portal:**
   - Open [http://localhost:3000](http://localhost:3000) on any web browser.
   - Simply choose between launching the **TV Display** or opening the **Operator Deck**.

2. **The TV / Screen Signage (`/display`):**
   - Open [http://localhost:3000/display](http://localhost:3000/display) (preferably on a TV, large external monitor, or secondary browser window).
   - Double-click anywhere to trigger true **Fullscreen mode**.
   - Press **`H`** or click the eye icon to toggle visibility of the artwork metadata plaque overlay.

3. **The Controller Dashboard (`/main`):**
   - Open [http://localhost:3000/main](http://localhost:3000/main) on a tablet, smartphone, or secondary monitor acting as the operator's local panel.
   - Use the high-contrast physical haptic trigger buttons to navigate, upload real-time images, adjust sorting order, or delete exhibition slides instantly.

---

## 🛠️ Production Build (Optional)

To compile and package the application for absolute performance and offline deployment:
```bash
# Build the React interface & bundle the server
npm run build

# Start the compiled production build
npm run start
```

---

## ☁️ Deploying to Netlify (Frontend only)

Use Netlify to host the static frontend build while keeping the Express backend separate (recommended).

- Build command: `npm run build`
- Publish directory: `dist`

Steps:

1. Commit and push this repository to GitHub (or Git provider supported by Netlify).
2. In the Netlify dashboard, click "New site from Git" and connect your repository.
3. Set `Build command` to `npm run build` and `Publish directory` to `dist`.
4. Deploy. For single-page app routing, `_redirects` or `netlify.toml` already added in this repo will serve `index.html` for all paths.

Notes:

- This repository now uses browser localStorage and tab-sync state for the controller/display flow, so the frontend is static and can be hosted directly on Netlify.
  - No persistent Express backend is required for the current image selection, upload and delete workflow.
  - State is stored in the browser and shared between tabs using the browser storage event.

