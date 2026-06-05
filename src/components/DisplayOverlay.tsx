import React from "react";
import { BACK_URL } from "../constants"; // assuming BACK_URL export, otherwise reuse same constant

export default function DisplayOverlay() {
  return (
    <div className="relative h-screen w-screen bg-black text-white flex items-center justify-center">
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <h1 className="text-6xl font-bold uppercase tracking-[0.25em] text-[#96f1c9]">CRT</h1>
        <p className="max-w-2xl text-sm text-white/80">Self‑Sufficient Sanitation Infrastructure.</p>
        <button
          onClick={() => (window.location.href = BACK_URL)}
          className="px-3 py-2 bg-[#066D55]/10 border border-[#066D55] rounded text-[#96f1c9]"
        >
          Back
        </button>
      </div>
    </div>
  );
}
