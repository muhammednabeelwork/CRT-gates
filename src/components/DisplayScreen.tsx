import { useEffect, useState } from "react";
import { loadState, subscribeState } from "../state";
import { DisplayState, ShowcaseImage } from "../types";
import { Activity } from "lucide-react";

const BACK_URL = "https://gates.framer.website/zone-2/zone-2-hz-kiosk-technology-page";

export default function DisplayScreen() {
  const [state, setState] = useState<DisplayState>(() => loadState());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeState(setState);
    return unsubscribe;
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Fullscreen request rejected: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  if (!state) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-white">
        <Activity className="h-8 w-8 text-[#066D55] animate-spin" />
      </div>
    );
  }

  const activeImage: ShowcaseImage | undefined = state.images[state.currentImageIndex];

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-black p-0 flex-col space-y-6">
      <h1 className="text-6xl font-bold uppercase tracking-[0.25em] text-[#96f1c9]">CRT</h1>
      <p className="max-w-2xl text-sm text-white/80 text-center">Self‑Sufficient Sanitation Infrastructure.</p>
      <button onClick={() => (window.location.href = BACK_URL)} className="px-3 py-2 bg-[#066D55]/10 border border-[#066D55] rounded text-[#96f1c9]">
        Back
      </button>
      {activeImage && (
        <div className="relative aspect-[9/16] h-full max-h-[1920px] w-full max-w-[1080px] overflow-hidden bg-black" onDoubleClick={toggleFullscreen}>
          <img src={activeImage.url} alt={activeImage.title} className="absolute inset-0 h-full w-full object-cover" />
        </div>
      )}
    </div>
  );
}
