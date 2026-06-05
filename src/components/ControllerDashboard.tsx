import React, { useEffect, useState, useRef } from "react";
import { DisplayState, ShowcaseImage } from "../types";
import { loadState, saveState, subscribeState } from "../state";
import { ChevronLeft, ChevronRight, Upload, Activity } from "lucide-react";
import { uploadToFirebase, signInAnonymouslyAndGetToken } from "../firebase";

const BACK_URL = "https://gates.framer.website/zone-2/zone-2-hz-kiosk-technology-page";

export default function ControllerDashboard({ navigate }: { navigate: (path: string) => void }) {
  const [state, setState] = useState<DisplayState>(() => loadState());
  const [isUploading, setIsUploading] = useState(false);
  const [idToken, setIdToken] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeState(setState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    // attempt anonymous sign-in to obtain an ID token for server-side uploads
    (async () => {
      try {
        const t = await signInAnonymouslyAndGetToken();
        if (t) setIdToken(t);
      } catch (err) {
        console.warn('Failed to get id token', err);
      }
    })();
  }, []);

  const broadcast = (nextState: DisplayState) => {
    saveState(nextState);
    setState(nextState);
  };

  const selectImageIndex = (index: number) => {
    if (index < 0 || index >= state.images.length) return;
    broadcast({ ...state, currentImageIndex: index });
  };

  const triggerNext = () => {
    if (state.images.length === 0) return;
    selectImageIndex((state.currentImageIndex + 1) % state.images.length);
  };

  const triggerPrev = () => {
    if (state.images.length === 0) return;
    selectImageIndex((state.currentImageIndex - 1 + state.images.length) % state.images.length);
  };

  const uploadImage = (file: File, dataUrl: string) => {
    setIsUploading(true);
    try {
      const cleanName = file.name.replace(/[-_]/g, " ").replace(/\.[^/.]+$/, "");
      // Try server-side upload first (Netlify function). If no idToken or server fails, fall back to client upload.
      (async () => {
        try {
          if (idToken) {
            const resp = await fetch('/.netlify/functions/firebaseUpload', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${idToken}`,
              },
              body: JSON.stringify({ fileName: file.name, dataUrl }),
            });
            if (resp.ok) {
              const out = await resp.json();
              const newImage: ShowcaseImage = {
                id: out.id || `upload_${Date.now()}`,
                url: out.url || dataUrl,
                title: cleanName || file.name,
                subtitle: 'Uploaded via controller',
                description: 'User image inserted from the admin panel.',
                category: 'GALLERY',
                colorTheme: '#066D55',
              };
              const nextImages = [...state.images, newImage];
              broadcast({ ...state, images: nextImages, currentImageIndex: nextImages.length - 1 });
              return;
            }
          }

          // fallback to direct client upload
          const res = await uploadToFirebase(dataUrl, file.name).catch(() => null);
          if (res && res.url) {
            const newImage: ShowcaseImage = {
              id: res.id || `upload_${Date.now()}`,
              url: res.url || dataUrl,
              title: cleanName || file.name,
              subtitle: 'Uploaded via controller',
              description: 'User image inserted from the admin panel.',
              category: 'GALLERY',
              colorTheme: '#066D55',
            };
            const nextImages = [...state.images, newImage];
            broadcast({ ...state, images: nextImages, currentImageIndex: nextImages.length - 1 });
          } else {
            // final fallback: local data URL
            const newImage: ShowcaseImage = {
              id: `upload_${Date.now()}`,
              url: dataUrl,
              title: cleanName || file.name,
              subtitle: 'Uploaded via controller',
              description: 'User image inserted from the admin panel.',
              category: 'GALLERY',
              colorTheme: '#066D55',
            };
            const nextImages = [...state.images, newImage];
            broadcast({ ...state, images: nextImages, currentImageIndex: nextImages.length - 1 });
          }
        } catch (err) {
          console.warn('Upload attempt failed:', err);
          const newImage: ShowcaseImage = {
            id: `upload_${Date.now()}`,
            url: dataUrl,
            title: cleanName || file.name,
            subtitle: 'Uploaded via controller',
            description: 'User image inserted from the admin panel.',
            category: 'GALLERY',
            colorTheme: '#066D55',
          };
          const nextImages = [...state.images, newImage];
          broadcast({ ...state, images: nextImages, currentImageIndex: nextImages.length - 1 });
        } finally {
          setIsUploading(false);
        }
      })();
    } catch (err) {
      console.error(err);
      alert("Upload failed. Try a smaller image or refresh the page.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => uploadImage(file, reader.result as string);
    reader.readAsDataURL(file);
  };

  const deleteCurrentImage = () => {
    if (state.images.length === 0) return;
    if (!confirm("Delete the currently selected image?")) return;
    const remaining = state.images.filter((_, idx) => idx !== state.currentImageIndex);
    if (remaining.length === 0) {
      broadcast(loadState());
      return;
    }
    const nextIndex = Math.max(0, Math.min(state.currentImageIndex, remaining.length - 1));
    broadcast({ ...state, images: remaining, currentImageIndex: nextIndex });
  };

  if (!state) {
    return (
import React, { useEffect, useState, useRef } from "react";
import { DisplayState, ShowcaseImage } from "../types";
import { loadState, saveState, subscribeState } from "../state";
import { ChevronLeft, ChevronRight, Upload, Activity } from "lucide-react";
import { uploadToFirebase, signInAnonymouslyAndGetToken } from "../firebase";

const BACK_URL = "https://gates.framer.website/zone-2/zone-2-hz-kiosk-technology-page";

export default function ControllerDashboard({ navigate }: { navigate: (path: string) => void }) {
  const [state, setState] = useState<DisplayState>(() => loadState());
  const [isUploading, setIsUploading] = useState(false);
  const [idToken, setIdToken] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeState(setState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    // attempt anonymous sign-in to obtain an ID token for server-side uploads
    (async () => {
      try {
        const t = await signInAnonymouslyAndGetToken();
        if (t) setIdToken(t);
      } catch (err) {
        console.warn('Failed to get id token', err);
      }
    })();
  }, []);

  const broadcast = (nextState: DisplayState) => {
    saveState(nextState);
    setState(nextState);
  };

  const selectImageIndex = (index: number) => {
    if (index < 0 || index >= state.images.length) return;
    broadcast({ ...state, currentImageIndex: index });
  };

  const triggerNext = () => {
    if (state.images.length === 0) return;
    selectImageIndex((state.currentImageIndex + 1) % state.images.length);
  };

  const triggerPrev = () => {
    if (state.images.length === 0) return;
    selectImageIndex((state.currentImageIndex - 1 + state.images.length) % state.images.length);
  };

  const uploadImage = (file: File, dataUrl: string) => {
    setIsUploading(true);
    try {
      const cleanName = file.name.replace(/[-_]/g, " ").replace(/\.[^/.]+$/, "");
      // Try server-side upload first (Netlify function). If no idToken or server fails, fall back to client upload.
      (async () => {
        try {
          if (idToken) {
            const resp = await fetch('/.netlify/functions/firebaseUpload', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${idToken}`,
              },
              body: JSON.stringify({ fileName: file.name, dataUrl }),
            });
            if (resp.ok) {
              const out = await resp.json();
              const newImage: ShowcaseImage = {
                id: out.id || `upload_${Date.now()}`,
                url: out.url || dataUrl,
                title: cleanName || file.name,
                subtitle: 'Uploaded via controller',
                description: 'User image inserted from the admin panel.',
                category: 'GALLERY',
                colorTheme: '#066D55',
              };
              const nextImages = [...state.images, newImage];
              broadcast({ ...state, images: nextImages, currentImageIndex: nextImages.length - 1 });
              return;
            }
          }

          // fallback to direct client upload
          const res = await uploadToFirebase(dataUrl, file.name).catch(() => null);
          if (res && res.url) {
            const newImage: ShowcaseImage = {
              id: res.id || `upload_${Date.now()}`,
              url: res.url || dataUrl,
              title: cleanName || file.name,
              subtitle: 'Uploaded via controller',
              description: 'User image inserted from the admin panel.',
              category: 'GALLERY',
              colorTheme: '#066D55',
            };
            const nextImages = [...state.images, newImage];
            broadcast({ ...state, images: nextImages, currentImageIndex: nextImages.length - 1 });
          } else {
            // final fallback: local data URL
            const newImage: ShowcaseImage = {
              id: `upload_${Date.now()}`,
              url: dataUrl,
              title: cleanName || file.name,
              subtitle: 'Uploaded via controller',
              description: 'User image inserted from the admin panel.',
              category: 'GALLERY',
              colorTheme: '#066D55',
            };
            const nextImages = [...state.images, newImage];
            broadcast({ ...state, images: nextImages, currentImageIndex: nextImages.length - 1 });
          }
        } catch (err) {
          console.warn('Upload attempt failed:', err);
          const newImage: ShowcaseImage = {
            id: `upload_${Date.now()}`,
            url: dataUrl,
            title: cleanName || file.name,
            subtitle: 'Uploaded via controller',
            description: 'User image inserted from the admin panel.',
            category: 'GALLERY',
            colorTheme: '#066D55',
          };
          const nextImages = [...state.images, newImage];
          broadcast({ ...state, images: nextImages, currentImageIndex: nextImages.length - 1 });
        } finally {
          setIsUploading(false);
        }
      })();
    } catch (err) {
      console.error(err);
      alert("Upload failed. Try a smaller image or refresh the page.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => uploadImage(file, reader.result as string);
    reader.readAsDataURL(file);
  };

  const deleteCurrentImage = () => {
    if (state.images.length === 0) return;
    if (!confirm("Delete the currently selected image?")) return;
    const remaining = state.images.filter((_, idx) => idx !== state.currentImageIndex);
    if (remaining.length === 0) {
      broadcast(loadState());
      return;
    }
    const nextIndex = Math.max(0, Math.min(state.currentImageIndex, remaining.length - 1));
    broadcast({ ...state, images: remaining, currentImageIndex: nextIndex });
  };

  if (!state) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-white">
        <Activity className="h-8 w-8 text-[#066D55] animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="relative h-screen w-screen bg-black text-white select-none"
      style={{
        backgroundImage: "radial-gradient(circle at 20% 20%, rgba(5,117,86,0.75), transparent 20%), radial-gradient(circle at 70% 30%, rgba(6,109,85,0.38), transparent 24%), radial-gradient(circle at 40% 75%, rgba(0,0,0,0.85), transparent 35%), linear-gradient(145deg, #040f0a 0%, #032017 28%, #083c2e 53%, #020d09 82%, #000000 100%)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/42" />
      {/* Top-left back button */}
      <button onClick={() => (window.location.href = BACK_URL)}
        className="px-3 py-2 bg-[#066D55]/10 border border-[#066D55] rounded text-[#96f1c9] absolute top-4 left-4 z-30"
      >
        Back
      </button>
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
        <button onClick={() => fileInputRef.current?.click()}
          className="px-3 py-2 bg-[#066D55]/10 border border-[#066D55] rounded text-[#96f1c9] flex items-center gap-2"
        >
          <Upload className="h-4 w-4" /> Upload
        </button>
        <button onClick={deleteCurrentImage}
          className="px-3 py-2 bg-black/60 border border-red-600 rounded text-red-400"
        >
          Delete
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-4">
        <h1 className="text-6xl font-bold uppercase tracking-[0.25em] text-[#96f1c9]">CRT</h1>
        <p className="max-w-2xl text-sm text-white/80">Self‑Sufficient Sanitation Infrastructure.</p>
        <button onClick={() => (window.location.href = BACK_URL)}
          className="px-3 py-2 bg-[#066D55]/10 border border-[#066D55] rounded text-[#96f1c9]"
        >
          Back
        </button>
        <div className="flex items-center gap-6">
          <button onClick={triggerPrev} aria-label="Previous"
            className="p-6 rounded-full bg-black/60 border-2 border-[#066D55] text-[#96f1c9]"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button onClick={triggerNext} aria-label="Next"
            className="p-6 rounded-full bg-black/60 border-2 border-[#066D55] text-[#96f1c9]"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </div>
      </div>

      {isUploading && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/80 px-4 py-2 rounded text-sm">
          Uploading…
        </div>
      )}
    </div>
  );
}
