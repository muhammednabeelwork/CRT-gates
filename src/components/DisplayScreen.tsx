import { useEffect, useState } from "react";
import { loadState, subscribeState } from "../state";
import { DisplayState, ShowcaseImage } from "../types";
import { Activity } from "lucide-react";

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
    <div className="flex h-screen w-screen items-center justify-center bg-black p-0">
      <div
        className="relative aspect-[9/16] h-full max-h-[1920px] w-full max-w-[1080px] overflow-hidden bg-black"
        onDoubleClick={toggleFullscreen}
      >
        {activeImage && (
          <img src={activeImage.url} alt={activeImage.title} className="absolute inset-0 h-full w-full object-cover" />
        )}
      </div>
    </div>
  );
}
