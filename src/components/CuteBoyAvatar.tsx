import React, { useEffect, useState, useRef } from "react";

export type ExpressionType = "SAD" | "CRYING" | "POUTING" | "LOVE" | "BLUSHING" | "SWEET_SMILE";

interface CuteBoyAvatarProps {
  expression: ExpressionType;
  mouseX: number;
  mouseY: number;
}

export default function CuteBoyAvatar({ expression, mouseX, mouseY }: CuteBoyAvatarProps) {
  const [blink, setBlink] = useState(false);
  
  useEffect(() => {
    // Generate blinking cycle
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Calculate head rotation based on screen center (fully stateless & re-render safe)
  const screenCenterX = typeof window !== "undefined" ? window.innerWidth / 2 : 500;
  const screenCenterY = typeof window !== "undefined" ? window.innerHeight / 2 : 400;

  const deltaX = (mouseX - screenCenterX) / (screenCenterX || 1);
  const deltaY = (mouseY - screenCenterY) / (screenCenterY || 1);

  const rotX = -Math.max(-1, Math.min(1, deltaY)) * 14;
  const rotY = Math.max(-1, Math.min(1, deltaX)) * 14;

  // Translate eye position to track cursor
  const eyeTrackX = Math.max(-4, Math.min(4, (rotY / 14) * 5));
  const eyeTrackY = Math.max(-3, Math.min(3, (rotX / -14) * 3));

  // Determine colors and sub-elements based on expression
  let eyeColor = "#1e293b"; // Dark slate
  let cheekColor = "rgba(244, 63, 94, 0.4)"; // Blush pink
  let isTeary = false;
  let customEmojiOverlay = "";

  if (expression === "LOVE") {
    cheekColor = "rgba(244, 63, 94, 0.7)";
    customEmojiOverlay = "💖";
  } else if (expression === "BLUSHING") {
    cheekColor = "rgba(244, 63, 94, 0.6)";
  } else if (expression === "CRYING") {
    isTeary = true;
    cheekColor = "rgba(244, 63, 94, 0.3)";
  } else if (expression === "POUTING") {
    cheekColor = "rgba(244, 63, 94, 0.5)";
  }

  return (
    <div 
      id="avatar-3d-wrapper"
      className="relative flex items-center justify-center select-none w-72 h-72 cursor-pointer transition-all duration-300 ease-out"
      style={{
        perspective: "1000px",
      }}
    >
      <div
        id="avatar-card-inner"
        className="relative w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
        style={{
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Soft Shadow underneath */}
        <div 
          id="avatar-soft-shadow"
          className="absolute bottom-1 w-44 h-5 bg-pink-900/10 rounded-full blur-md transition-all duration-500" 
          style={{ transform: "translateZ(-20px) scale(0.95)" }}
        />

        {/* Ambient Halo behind chibi head */}
        <div 
          id="avatar-halo"
          className={`absolute -top-3 w-52 h-52 rounded-full blur-2xl opacity-40 transition-colors duration-500 ${
            expression === "LOVE" ? "bg-red-400" :
            expression === "CRYING" ? "bg-blue-300" :
            expression === "SAD" ? "bg-amber-300" : "bg-pink-300"
          }`}
          style={{ transform: "translateZ(-30px)" }}
        />

        {/* Heart Sparkles for deep love */}
        {expression === "LOVE" && (
          <>
            <div className="absolute top-4 left-6 text-xl animate-heart-pulse select-none z-10">🌸</div>
            <div className="absolute top-2 right-8 text-2xl animate-heart-pulse select-none delay-500 z-10">💖</div>
            <div className="absolute bottom-16 left-2 text-lg animate-heart-pulse select-none delay-1000 z-10">✨</div>
          </>
        )}

        {/* Crying Tears Overlay */}
        {expression === "CRYING" && (
          <div className="absolute inset-0 pointer-events-none select-none z-20">
            {/* Left Tear Falling */}
            <div 
              className="absolute w-2 h-4 bg-sky-200/90 rounded-b-full shadow-sm animate-bounce"
              style={{
                top: "54%",
                left: "35%",
                opacity: 0.85,
                animationDuration: "1.4s"
              }}
            />
            {/* Right Tear Falling */}
            <div 
              className="absolute w-2 h-5 bg-sky-200/90 rounded-b-full shadow-sm animate-bounce"
              style={{
                top: "55%",
                right: "37%",
                opacity: 0.85,
                animationDuration: "1.8s",
                animationDelay: "0.2s"
              }}
            />
          </div>
        )}

        {/* Main Chibi Boy Body SVG */}
        <svg
          id="cute-boy-svg"
          viewBox="0 0 200 200"
          className="w-64 h-64 drop-shadow-lg"
          style={{ transform: "translateZ(10px)" }}
        >
          <defs>
            {/* Skin Shading Gradient */}
            <radialGradient id="skinGrad" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="#fff1f2" />
              <stop offset="100%" stopColor="#ffe4e6" />
            </radialGradient>
            
            {/* Deep Pink cheeks gradient */}
            <radialGradient id="blushGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={cheekColor} />
              <stop offset="100%" stopColor="rgba(244, 244, 244, 0)" />
            </radialGradient>

            {/* Glossy Hair Gradient */}
            <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#475569" /> {/* Elegant ash-brown brown gray */}
              <stop offset="50%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            {/* Cozy Hoodie Gradient */}
            <linearGradient id="hoodieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fda4af" /> {/* Soft cream-rose pastel */}
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
            
            {/* Eye Highlight */}
            <radialGradient id="eyeHighlight" cx="35%" cy="35%" r="30%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          {/* Ears (Chibi) */}
          <circle cx="42" cy="110" r="10" fill="#ffe4e6" />
          <circle cx="158" cy="110" r="10" fill="#ffe4e6" />

          {/* Hair back layer */}
          <path d="M 40 100 Q 40 60 100 60 Q 160 60 160 100 A 60 60 0 0 1 40 100 Z" fill="url(#hairGrad)" />

          {/* Chibi Head */}
          <rect x="45" y="70" width="110" height="80" rx="36" ry="36" fill="url(#skinGrad)" />

          {/* Cute rosy blushing cheeks */}
          <ellipse cx="64" cy="122" rx="14" ry="10" fill="url(#blushGrad)" />
          <ellipse cx="136" cy="122" rx="14" ry="10" fill="url(#blushGrad)" />

          {/* EYES LAYER */}
          <g transform={`translate(${eyeTrackX}, ${eyeTrackY})`}>
            {blink ? (
              // Blinking state - nice thin sleeping eyes
              <>
                <path d="M 52 114 Q 64 118 72 114" stroke={eyeColor} strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M 128 114 Q 136 118 148 114" stroke={eyeColor} strokeWidth="3" fill="none" strokeLinecap="round" />
              </>
            ) : expression === "LOVE" ? (
              // Love Heart Eyes
              <>
                <path d="M 52 112 Q 62 100 68 112 Q 74 100 84 112 L 68 126 Z" fill="#f43f5e" />
                <path d="M 116 112 Q 126 100 132 112 Q 138 100 148 112 L 132 126 Z" fill="#f43f5e" />
              </>
            ) : expression === "CRYING" ? (
              // Teary, soft glistened puppy eyes
              <>
                {/* Left Eye */}
                <circle cx="64" cy="114" r="9" fill={eyeColor} />
                <ellipse cx="61" cy="111" rx="4" ry="4" fill="#ffffff" />
                <circle cx="67" cy="117" r="2.5" fill="#93c5fd" /> {/* glistening drop */}
                
                {/* Right Eye */}
                <circle cx="136" cy="114" r="9" fill={eyeColor} />
                <ellipse cx="133" cy="111" rx="4" ry="4" fill="#ffffff" />
                <circle cx="139" cy="117" r="2.5" fill="#93c5fd" />
              </>
            ) : expression === "POUTING" ? (
              // Sad downward looking or narrow eyes
              <>
                {/* Left Eye */}
                <circle cx="64" cy="114" r="8" fill={eyeColor} />
                <ellipse cx="61" cy="112" rx="3" ry="3" fill="#ffffff" />
                {/* Right Eye */}
                <circle cx="136" cy="114" r="8" fill={eyeColor} />
                <ellipse cx="133" cy="112" rx="3" ry="3" fill="#ffffff" />
              </>
            ) : (
              // Beautiful normal big puppy cartoon eyes
              <>
                {/* Left Eye */}
                <circle cx="64" cy="114" r="9.5" fill={eyeColor} />
                <ellipse cx="61" cy="110" rx="4" ry="4" fill="#ffffff" />
                <circle cx="67" cy="117" r="2" fill="#ffffff" />
                
                {/* Right Eye */}
                <circle cx="136" cy="114" r="9.5" fill={eyeColor} />
                <ellipse cx="133" cy="110" rx="4" ry="4" fill="#ffffff" />
                <circle cx="139" cy="117" r="2" fill="#ffffff" />
              </>
            )}
          </g>

          {/* EYEBROWS LAYER */}
          {expression === "SAD" || expression === "CRYING" || expression === "POUTING" ? (
            // Curved sad worried eyebrows
            <>
              <path d="M 50 102 Q 62 93 72 103" stroke={eyeColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M 128 103 Q 138 93 150 102" stroke={eyeColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </>
          ) : (
            // Normal gentle horizontal eyebrows
            <>
              <path d="M 52 101 Q 62 98 72 101" stroke={eyeColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M 128 101 Q 138 98 148 101" stroke={eyeColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </>
          )}

          {/* MOUTH LAYER */}
          {expression === "POUTING" ? (
            // Pouting cute sad squiggly mouth
            <path d="M 94 133 C 97 129, 103 129, 106 133" stroke={eyeColor} strokeWidth="3" fill="none" strokeLinecap="round" />
          ) : expression === "CRYING" || expression === "SAD" ? (
            // Trembling sad open crying mouth
            <path d="M 95 131 Q 100 140 105 131 Z" fill="#fda4af" stroke={eyeColor} strokeWidth="2" strokeLinecap="round" />
          ) : expression === "SWEET_SMILE" || expression === "LOVE" ? (
            // Beautiful open sweet happy smile
            <path d="M 92 129 Q 100 141 108 129 Z" fill="#f43f5e" stroke={eyeColor} strokeWidth="2" strokeLinecap="round" />
          ) : (
            // Small cute neutral straight line smile
            <path d="M 95 131 Q 100 134 105 131" stroke={eyeColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          )}

          {/* Modern Floppy Boy Anime Haircut layers (over face) */}
          <path d="M 40 100 L 48 90 L 58 101 L 64 88 L 80 104 L 100 80 L 120 104 L 136 88 L 142 101 L 152 90 L 160 100 Q 164 70 100 64 Q 36 70 40 100 Z" fill="url(#hairGrad)" />
          {/* Hair strands coming down in front */}
          <path d="M 70 82 Q 78 98 84 94" stroke="#475569" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 116 82 Q 110 98 104 94" stroke="#475569" strokeWidth="2.5" fill="none" strokeLinecap="round" />

          {/* Cozy Pastel Hoodie Collar/Drawstrings */}
          <g transform="translate(0, 5)">
            <path d="M 60 150 Q 100 162 140 150 L 145 180 L 55 180 Z" fill="url(#hoodieGrad)" />
            {/* Drawstrings */}
            <circle cx="88" cy="168" r="3" fill="#ffffff" />
            <path d="M 88 168 L 88 178" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            <circle cx="112" cy="168" r="3" fill="#ffffff" />
            <path d="M 112 168 L 112 178" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          </g>
        </svg>
      </div>

      {/* Sweet Boy speech prompt bubble triggers */}
      <div 
        id="avatar-mini-status"
        className="absolute bottom-2 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-sm select-none border border-pink-100 text-xs text-pink-600 font-medium font-display animate-heart-pulse text-center tracking-wide flex items-center gap-1.5 z-10"
        style={{ transform: "translateZ(30px)" }}
      >
        <span>
          {expression === "SAD" && "🥺 I feel so, so empty..."}
          {expression === "CRYING" && "😭 I am truly sorry..."}
          {expression === "POUTING" && "😔 I didn't mean to make you sad..."}
          {expression === "LOVE" && "💖 My heart is fully yours..."}
          {expression === "BLUSHING" && "😳 Please look at me..."}
          {expression === "SWEET_SMILE" && "☀️ Your smile cures me..."}
        </span>
      </div>
    </div>
  );
}
