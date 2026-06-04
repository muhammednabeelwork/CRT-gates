import { DisplayState, ShowcaseImage } from "./types";
import { initFirebase, getFirestoreIfAvailable } from "./firebase";
import { collection, query, orderBy, onSnapshot, DocumentData } from "firebase/firestore";

const STORAGE_KEY = "mtu-gate-state";

const DEFAULT_IMAGES: ShowcaseImage[] = [
  {
    id: "ex_1",
    url: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1600&q=80",
    title: "SPECTRE GT COUPE",
    subtitle: "Aerodynamic Concept 04",
    description: "An advanced luxury electric hypercar engineered with zero-resistance silhouette and intelligent active biometrics.",
    category: "LUXURY AUTOMOBILE",
    colorTheme: "#066D55"
  },
  {
    id: "ex_2",
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80",
    title: "AUREUM PAVILION",
    subtitle: "Monolithic Glass Matrix",
    description: "An awards-winning luxury pavilion celebrating architectural physics, dynamic gold structural accents, and linear light reflections.",
    category: "MODERN ARCHITECTURE",
    colorTheme: "#AB844C"
  },
  {
    id: "ex_3",
    url: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1600&q=80",
    title: "NEBULA CORE",
    subtitle: "Generative Hologram 09",
    description: "Curated dark particle stream simulation projecting cosmic matter expansion onto immersive ultra-bright museum projection domes.",
    category: "DIGITAL ART",
    colorTheme: "#838C4A"
  },
  {
    id: "ex_4",
    url: "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&w=1600&q=80",
    title: "VERDANT INTERIOR",
    subtitle: "Organic Biophilic Sanctuary",
    description: "Indoor organic display synthesizing ambient acoustic forestry signals with a glowing physical canopy layout.",
    category: "BIOPHILIC INSTALLATION",
    colorTheme: "#4F9244"
  },
  {
    id: "ex_5",
    url: "https://images.unsplash.com/photo-1545987796-200677ee1011?auto=format&fit=crop&w=1600&q=80",
    title: "CHRONOS REEF",
    subtitle: "Complex Synaptic Network",
    description: "An abstract algorithmic matrix mimicking neural connections, casting a radiant soft olive and golden glow on obsidian stones.",
    category: "TECH SHOWCASE",
    colorTheme: "#838C4A"
  }
];

const DEFAULT_STATE: DisplayState = {
  currentImageIndex: 0,
  images: DEFAULT_IMAGES,
  connectedClients: 1,
  lastUpdated: Date.now()
};

export function loadState(): DisplayState {
  if (typeof window === "undefined") {
    return DEFAULT_STATE;
  }

  const payload = localStorage.getItem(STORAGE_KEY);
  if (!payload) {
    saveState(DEFAULT_STATE);
    return DEFAULT_STATE;
  }

  try {
    const parsed = JSON.parse(payload) as DisplayState;
    if (!Array.isArray(parsed.images) || parsed.images.length === 0) {
      saveState(DEFAULT_STATE);
      return DEFAULT_STATE;
    }

    const currentImageIndex = Math.max(0, Math.min(parsed.currentImageIndex, parsed.images.length - 1));
    return {
      ...DEFAULT_STATE,
      ...parsed,
      currentImageIndex,
      images: parsed.images,
      connectedClients: 1,
      lastUpdated: parsed.lastUpdated || Date.now()
    };
  } catch (err) {
    saveState(DEFAULT_STATE);
    return DEFAULT_STATE;
  }
}

export function saveState(state: DisplayState) {
  if (typeof window === "undefined") return;
  const nextState = { ...state, lastUpdated: Date.now(), connectedClients: 1 };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  localStorage.setItem(`${STORAGE_KEY}_updated`, `${Date.now()}`);
  window.dispatchEvent(new CustomEvent("mtu-state-change", { detail: nextState }));
}

export function subscribeState(callback: (state: DisplayState) => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      callback(loadState());
    }
  };

  const handleCustom = () => callback(loadState());

  window.addEventListener("storage", handleStorage);
  window.addEventListener("mtu-state-change", handleCustom);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("mtu-state-change", handleCustom);
  };
}

// Firestore realtime syncing: if Firebase is configured, listen for changes to the `images` collection
let _unsubscribeFirestore: (() => void) | null = null;

function startFirestoreListener() {
  if (typeof window === "undefined") return;
  try {
    const app = initFirebase();
    const db = getFirestoreIfAvailable();
    if (!db) return;
    const q = query(collection(db as any, "images"), orderBy("createdAt", "asc"));
    _unsubscribeFirestore = onSnapshot(q, (snapshot) => {
      const serverImages: ShowcaseImage[] = snapshot.docs.map((doc) => {
        const data = doc.data() as DocumentData;
        return {
          id: doc.id,
          url: data.url,
          title: data.fileName || data.title || "Uploaded Image",
          subtitle: data.subtitle || "",
          description: data.description || "",
          category: data.category || "GALLERY",
          colorTheme: data.colorTheme || "#066D55",
        } as ShowcaseImage;
      });

      // Merge server images into local state without duplicating by URL
      const local = loadState();
      const existingUrls = new Set(local.images.map((i) => i.url));
      const newImages = serverImages.filter((si) => si.url && !existingUrls.has(si.url));
      if (newImages.length === 0) return;
      const next = { ...local, images: [...local.images, ...newImages], lastUpdated: Date.now() };
      saveState(next);
    });
  } catch (err) {
    // ignore if firebase not configured or permissions block access
    console.warn("Firestore listener not started:", err);
  }
}

// start automatically when module loads in the browser
if (typeof window !== "undefined") {
  startFirestoreListener();
}
