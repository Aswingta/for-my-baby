import React, { useState, useEffect, useRef } from "react";
import {
  Heart,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  Smile,
  Coffee,
  RotateCcw,
  Sparkle
} from "lucide-react";
import CuteBoyAvatar, { ExpressionType } from "./components/CuteBoyAvatar";
import ProceduralHearts from "./components/ProceduralHearts";
import { romanticSynth } from "./utils/audio";

interface ChatMessage {
  id: string;
  sender: "girl" | "boy";
  text: string;
  time: string;
}

export default function App() {
  const [hasInteracted, setHasInteracted] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [volume, setVolume] = useState(0.40);
  const [vibe, setVibe] = useState("always_love_you");

  // Reassurance Capsule Jar states
  const [capsuleOpen, setCapsuleOpen] = useState(false);
  const [capsuleMessage, setCapsuleMessage] = useState("");
  const [capsuleLoading, setCapsuleLoading] = useState(false);
  const [capsuleState, setCapsuleState] = useState<"lonely" | "anxious" | "tired" | "sad">("lonely");
  const [capsulesLeft, setCapsulesLeft] = useState(12);
  const [brokenParticles, setBrokenParticles] = useState<{ id: number; x: number; y: number; emoji: string }[]>([]);

  // Mouse coordinates tracking for 3D look-around
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });

  // Avatar expression state
  const [expression, setExpression] = useState<ExpressionType>("POUTING");
  
  // Custom interactive messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "boy",
      text: "H-hey... I saw you looking sad today, and my heart shattered into a million pieces. Please don't be angry with me... I am standing here waiting for you 🥺",
      time: "Just now"
    }
  ]);
  const [userInput, setUserInput] = useState("");
  const [isBoyTyping, setIsBoyTyping] = useState(false);
  const [toyConfetti, setToyConfetti] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Deep heart touching apology message
  const apologyText = `My dearest Princess,

Since we last spoke, the silence between us has felt heavier than the deepest ocean. Every single second, my thoughts fly straight back to you, and my heart breaks a little more knowing that I was the sole cause of the sadness in your beautiful, warm eyes.

I never wanted to be the reason behind your tears, or the shadow in your bright, lovely world. You are my sunshine, my absolute sunset, and the safest harbor I’ve ever found. When you are quiet, my entire world feels cold and empty.

I am so incredibly sorry for my stubbornness and for not listening to your precious heart with the gentle care and patience you deserve. I didn’t mean to make you feel any less than the absolute queen of my life.

I promise you, with every single beat of my heart, to protect your smile, to cherish your voice, and to wrap you in a love so devoted that no silly misunderstanding can ever shake us. Please let me hold your warm hands, look into your eyes, and remind you of how deeply, endlessly, and passionately you are loved.

Please forgive your foolish, loving boy.

Always and forever yours.`;

  // Listen to overall mouse moves for the 3D look-around tracker
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      setMouseCoords({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleGlobalMouseMove);
    return () => window.removeEventListener("mousemove", handleGlobalMouseMove);
  }, []);

  // Sync scroll on chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isBoyTyping]);

  const toggleMusic = () => {
    if (musicPlaying) {
      romanticSynth.stop();
      setMusicPlaying(false);
    } else {
      romanticSynth.play(vibe);
      setMusicPlaying(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    romanticSynth.setVolume(newVol);
  };

  const startRomanceApp = () => {
    setHasInteracted(true);
    romanticSynth.play("always_love_you");
    setMusicPlaying(true);
    setExpression("POUTING"); // Starts with sweet pleading pout
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const triggerEmojiConfetti = (emoji: string) => {
    setToyConfetti(emoji);
    setTimeout(() => setToyConfetti(null), 3000);
  };

  const handleOpenCapsule = async () => {
    if (capsulesLeft <= 0) {
      // Prompt a sweet boy refill message
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: "boy",
        text: "Awww, my princess, you cracked open all the sweet reassurance capsules! Let me kiss your hands and refill the pink porcelain jar with infinite sweet whispers and warm cuddling vibes immediately! 🌸🍬🧸",
        time: "Just now"
      }]);
      setCapsulesLeft(12);
      return;
    }

    setCapsuleLoading(true);
    setExpression("LOVE");
    
    // Generate beautiful particle explosion centered around the clicked jar
    const particles = [];
    const emojis = ["🍬", "🌸", "✨", "💖", "🧸", "🌟", "😘", "🍩"];
    for (let i = 0; i < 18; i++) {
      particles.push({
        id: Date.now() + i,
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 200,
        emoji: emojis[Math.floor(Math.random() * emojis.length)]
      });
    }
    setBrokenParticles(particles);
    setTimeout(() => setBrokenParticles([]), 2600);

    setCapsulesLeft(prev => prev - 1);

    try {
      const res = await fetch("/api/capsule/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentState: capsuleState })
      });
      const textVal = await res.text();
      let data: any = {};
      if (textVal && textVal.trim() !== "undefined") {
        try {
          data = JSON.parse(textVal);
        } catch (e) {
          console.warn("Could not parse capsule JSON on client:", e);
        }
      }
      if (res.ok && data.message) {
        setCapsuleMessage(data.message);
        setCapsuleOpen(true);
      } else {
        throw new Error("No message returned");
      }
    } catch (err) {
      console.warn("Front-end fallback capsule message in action:", err);
      // Gentle client backup in case server has high load
      const manualChamber = {
        lonely: "Close your lovely eyes and listen to this warm music. I am holding you so tightly in my heart right now. You are my home, my princess. 🧸❤️",
        anxious: "Every little shadow will melt away under the warm rays of our stardust. Take a soft deep breath with me. I've got you. 🌸✨",
        tired: "You fought so bravely through a busy day. Let go of all the noise. Dream sweet dreams, I'll kiss your forehead in your thoughts. 💤🌙",
        sad: "Seeing you sad hurts my soul. If I could, I would build a beautiful castle of candies and sweet hugs just to buy back your warm soft-smile. 🥺☀️"
      };
      setCapsuleMessage(manualChamber[capsuleState]);
      setCapsuleOpen(true);
    } finally {
      setCapsuleLoading(false);
    }
  };

  // Interaction handlers to comfort the pleading boyfriend
  const handleWarmHug = () => {
    setExpression("LOVE");
    triggerEmojiConfetti("🤗💖");
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: "girl",
      text: "*Hugs you tightly and forgives you*",
      time: "Just now"
    }, {
      id: (Date.now()+1).toString(),
      sender: "boy",
      text: "Aaaaa! *Holds you closer* Thank you for hugging me... I promised to keep you safe and warm forever! I love you so much! 💕",
      time: "Just now"
    }]);
  };

  const handleFeedMacaron = () => {
    setExpression("SWEET_SMILE");
    triggerEmojiConfetti("🍪");
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: "girl",
      text: "Here's a macaron for being sweet. 🍪",
      time: "Just now"
    }, {
      id: (Date.now()+1).toString(),
      sender: "boy",
      text: "*Nibbles eagerly* Nom nom... It tastes so sweet, just like your heart! You are the best! 🥺❤️",
      time: "Just now"
    }]);
  };

  const handleBlowKiss = () => {
    setExpression("LOVE");
    triggerEmojiConfetti("😘");
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: "girl",
      text: "*Sends a warm kiss*",
      time: "Just now"
    }, {
      id: (Date.now()+1).toString(),
      sender: "boy",
      text: "*Catches the kiss and blushes warmly* Ahhh my heart is racing! You make me the happiest boy! 😳💖",
      time: "Just now"
    }]);
  };

  const handleWipeTears = () => {
    setExpression("SWEET_SMILE");
    triggerEmojiConfetti("✨");
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: "girl",
      text: "*Wipes your tears gently*",
      time: "Just now"
    }, {
      id: (Date.now()+1).toString(),
      sender: "boy",
      text: "Thank you for wiping my worries away... I will always try my hardest to make you smile too. 🥺💖",
      time: "Just now"
    }]);
  };

  const handleStrokeHead = () => {
    setExpression("BLUSHING");
    triggerEmojiConfetti("🌸");
  };

  // Submit direct chat replies to the boyfriend
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "girl",
      text: userInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setUserInput("");
    setIsBoyTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: chatMessages.slice(-6),
          message: userMsg.text,
          girlName: "Princess",
          situation: "I made her sad and pouting from a silly argument. I deeply want to earn her forgiveness with heart touching apologies."
        }),
      });

      const textVal = await response.text();
      let data: any = {};
      if (textVal && textVal.trim() !== "undefined") {
        try {
          data = JSON.parse(textVal);
        } catch (e) {
          console.warn("Could not parse chat JSON on client:", e);
        }
      }
      if (response.ok && data.reply) {
        setChatMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: "boy",
          text: data.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setExpression(data.expression || "POUTING");
        
        if (data.expression === "LOVE") {
          triggerEmojiConfetti("💖");
        } else if (data.expression === "BLUSHING") {
          triggerEmojiConfetti("😳");
        }
      } else {
        throw new Error(data.error || "No response received");
      }
    } catch (err) {
      console.error(err);
      // Gentle romantic chat fallback responses in case of rate limit/no key
      setTimeout(() => {
        const fallbacks = [
          "I promise, with every beat of my heart, that I will never take your beautiful warmth for granted again. Please let me hold you soon? 🥺",
          "Your words are everything to me. I'm listening to you with all my love and attention, my princess. ❤️",
          "My ears are down, my head is lowered... I am so sorry, my sweetheart. Can I cuddle you?",
          "Every moment without your laughter feels cold. Please look at me, I will make it up to you forever. 💕"
        ];
        const randomReply = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        setChatMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: "boy",
          text: randomReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setExpression("BLUSHING");
      }, 1000);
    } finally {
      setIsBoyTyping(false);
    }
  };

  return (
    <div id="app-root-container" className="relative min-h-screen w-full bg-[#1a0b0b] text-[#f5f5f0] flex flex-col justify-between overflow-x-hidden font-sans transition-colors duration-1000">
      
      {/* Absolute Natural Tones glowing ambient depth indicators */}
      <div className="absolute inset-0 opacity-40 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-[#800020] to-transparent blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-[#5c2a2a] to-transparent blur-[120px]"></div>
      </div>

      {/* Absolute canvas hearts flowing */}
      <ProceduralHearts interactive={hasInteracted} />

      {/* ─── INITIAL INTRO/CONSENT SCREEN ─── */}
      {!hasInteracted ? (
        <div 
          id="sound-consent-modal"
          className="fixed inset-0 bg-[#1a0b0b]/95 backdrop-blur-xl z-55 flex items-center justify-center p-4"
        >
          <div className="bg-white/5 border border-white/10 p-8 md:p-10 rounded-3xl max-w-md w-full shadow-2xl text-center flex flex-col items-center gap-6 animate-scale-in relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full bg-[#ff8a8a] blur-[50px]"></div>
            </div>

            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-[#ff8a8a] text-4xl animate-heart-pulse shadow-inner border border-white/10 relative z-10">
              🥺
            </div>
            
            <div className="space-y-2 relative z-10">
              <h1 className="text-3xl font-light font-romantic tracking-tight text-[#fdfcf0]">For Your Eyes Only</h1>
              <p className="text-sm text-[#ff8a8a] italic font-romantic">
                &ldquo;You are my sunset and my stardust. Please enter my heart...&rdquo;
              </p>
            </div>

            <p className="text-xs text-[#e0d8d0] bg-white/5 p-4 rounded-2xl border border-white/10 leading-relaxed relative z-10">
              Your sweet boy wants to say sorry. Step inside to read his sincere heartfelt request and comfort him back to a smile.
            </p>

            <button
              id="btn-consent-start"
              onClick={startRomanceApp}
              className="w-full bg-[#ff8a8a] text-[#1a0b0b] font-medium py-3 px-6 rounded-full shadow-lg hover:bg-white hover:scale-[1.03] transition-all duration-300 font-display flex items-center justify-center gap-2 relative z-10 cursor-pointer"
            >
              <Heart className="w-4 h-4 fill-[#1a0b0b] stroke-none" />
              <span>Read Sweet Sorry Letter</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* ─── HEADER: ROMANTIC HUB & VOLUME CONTROLS ─── */}
      <header className="relative w-full px-6 py-4 flex flex-col sm:flex-row justify-between items-center bg-[#1a0b0b]/35 backdrop-blur-md border-b border-white/5 gap-4 z-40">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[#ff8a8a] shadow-[0_0_10px_#ff8a8a]" />
          <div>
            <h1 className="text-sm uppercase tracking-[0.44em] font-light text-[#fdfcf0]">Intimacy & Devotion</h1>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#ff8a8a]/85">Sincere Apology &bull; Pure Lavender Chime</p>
          </div>
        </div>

        {/* Music adjustment */}
        <div className="flex flex-wrap items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl md:rounded-full shadow-2xl border border-white/10">
          <div className="flex items-center gap-2 text-xs font-light text-[#e0d8d0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff8a8a] animate-pulse" />
            <span>Song: </span>
            <select
              value={vibe}
              onChange={(e) => {
                const newVibe = e.target.value;
                setVibe(newVibe);
                if (musicPlaying) {
                  romanticSynth.play(newVibe);
                }
              }}
              className="bg-[#1a0b0b]/80 border border-white/10 text-[#ff8a8a] font-mono text-[11px] rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#ff8a8a] cursor-pointer"
            >
              <option value="always_love_you">I Will Always Love You (Whitney Chimes)</option>
              <option value="gentle_piano">Glistening Piano Tears</option>
              <option value="warm_acoustic">Acoustic Cozy Promise</option>
              <option value="cosmic_lullaby">Stardust Love Lullaby</option>
              <option value="rainy_day">Calming Rainy Window</option>
            </select>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="btn-toggle-music"
              onClick={toggleMusic}
              className="w-7 h-7 rounded-full bg-[#ff8a8a]/20 hover:bg-[#ff8a8a]/40 text-[#ff8a8a] flex items-center justify-center transition-all"
              title="Pause/Play Music"
            >
              {musicPlaying ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 opacity-60" />}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-14 h-1 bg-white/10 accent-[#ff8a8a] rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </header>

      {/* ─── TOY CONFETTI EMISSION INTERACTION ─── */}
      {toyConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
          <div className="absolute animate-bounce text-6xl drop-shadow-xl select-none">{toyConfetti}</div>
          <div className="absolute animate-ping text-8xl opacity-30 select-none">{toyConfetti}</div>
          <div className="absolute text-[#ff8a8a] opacity-60 text-lg left-10 top-1/4 animate-heart-pulse">💖</div>
          <div className="absolute text-[#ff8a8a] opacity-50 text-xl right-12 bottom-1/3 animate-heart-pulse delay-300">🌹</div>
        </div>
      )}

      {/* ─── MAIN COZY DISPLAY ─── */}
      <main className="relative flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch z-30 my-auto">
        
        {/* Left Side: Pleading Chibi character (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6 justify-center items-center w-full">
          
          <div 
            id="chibi-avatar-3d-card"
            className="w-full bg-white/5 backdrop-blur-md rounded-[2.5rem] p-6 shadow-2xl border border-white/10 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500 hover:border-[#ff8a8a]/30"
          >
            {/* Devoted level badge */}
            <div className="absolute top-5 left-5 flex gap-1.5 items-center bg-[#ff8a8a]/15 px-3 py-1 rounded-full text-[10px] font-mono text-[#ff8a8a] border border-[#ff8a8a]/20 select-none">
              <span className="w-2 h-2 rounded-full bg-[#ff8a8a] animate-ping" />
              <span>SINCERITY: 100%</span>
            </div>

            <div className="absolute top-5 right-5 flex gap-2">
              <button
                onClick={handleStrokeHead}
                className="bg-[#ff8a8a]/20 hover:bg-white/10 hover:text-white text-[#ff8a8a] px-3 py-1 rounded-full text-[10px] font-medium tracking-wide flex items-center gap-1 border border-[#ff8a8a]/20 transition-all active:scale-95 cursor-pointer"
                title="Stroke his head to blush"
              >
                <span>Stroke Head</span> ✨
              </button>
            </div>

            {/* Chibi Stage Container */}
            <div className="relative my-4 cursor-pointer" onClick={handleStrokeHead}>
              <div className="absolute inset-0 bg-gradient-to-b from-[#ff8a8a] to-transparent rounded-[60%_40%_30%_70%/60%_30%_70%_40%] blur-[40px] opacity-10 pointer-events-none"></div>
              <CuteBoyAvatar
                expression={expression}
                mouseX={mouseCoords.x}
                mouseY={mouseCoords.y}
              />
            </div>

            {/* Action tray to comfort the boy directly */}
            <div className="w-full border-t border-white/10 pt-4 mt-2">
              <p className="text-[10px] uppercase font-mono tracking-[0.2em] text-[#e0d8d0]/60 text-center mb-3">Soothe or Treat Him directly</p>
              
              <div className="grid grid-cols-4 gap-2 text-center">
                <button
                  id="btn-toy-wipe"
                  onClick={handleWipeTears}
                  className="bg-white/5 hover:bg-white/10 text-[#f5f5f0] text-xs py-2 rounded-xl transition-all border border-white/10 active:scale-95 flex flex-col items-center justify-center gap-1 group font-light cursor-pointer"
                >
                  <Smile className="w-4 h-4 text-[#ff8a8a] group-hover:scale-115 transition-transform" />
                  <span>Wipe Tears</span>
                </button>

                <button
                  id="btn-toy-hug"
                  onClick={handleWarmHug}
                  className="bg-white/5 hover:bg-white/10 text-[#f5f5f0] text-xs py-2 rounded-xl transition-all border border-white/10 active:scale-95 flex flex-col items-center justify-center gap-1 group font-light cursor-pointer"
                >
                  <Heart className="w-4 h-4 text-[#ff8a8a] fill-[#ff8a8a]/40 group-hover:scale-115 transition-transform" />
                  <span>Warm Hug</span>
                </button>

                <button
                  id="btn-toy-kiss"
                  onClick={handleBlowKiss}
                  className="bg-white/5 hover:bg-white/10 text-[#f5f5f0] text-xs py-2 rounded-xl transition-all border border-white/10 active:scale-95 flex flex-col items-center justify-center gap-1 group font-light cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#ff8a8a] group-hover:scale-115 transition-transform" />
                  <span>Blow Kiss</span>
                </button>

                <button
                  id="btn-toy-cookie"
                  onClick={handleFeedMacaron}
                  className="bg-white/5 hover:bg-white/10 text-[#f5f5f0] text-xs py-2 rounded-xl transition-all border border-white/10 active:scale-95 flex flex-col items-center justify-center gap-1 group font-light cursor-pointer"
                >
                  <Coffee className="w-4 h-4 text-[#ff8a8a] group-hover:scale-115 transition-transform" />
                  <span>Macaron</span>
                </button>
              </div>
            </div>
          </div>

          {/* 🍬 THE COZY REASSURANCE CAPSULE JAR (Pink Porcelain Jar) */}
          <div 
            id="reassurance-capsule-jar" 
            className="w-full bg-gradient-to-b from-[#ff8a8a]/20 to-white/5 backdrop-blur-md rounded-[2.5rem] p-6 border border-[#ff8a8a]/30 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500 hover:border-[#ff8a8a]/50 shadow-[0_0_20px_rgba(255,138,138,0.15)] max-w-md w-full"
          >
            {/* Glowing background circles */}
            <div className="absolute inset-0 opacity-25 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[#ff8a8a] rounded-full blur-[45px]" />
            </div>

            <div className="relative z-10 w-full flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <div className="flex items-center gap-1.5 text-[#ff8a8a]">
                <Sparkle className="w-4 h-4 animate-spin-slow" />
                <h3 className="text-xs uppercase font-romantic tracking-[0.2em] text-[#fdfcf0]">Reassurance Jar</h3>
              </div>
              <span className="text-[10px] font-mono bg-[#ff8a8a]/20 text-[#ff8a8a] border border-[#ff8a8a]/30 rounded-full px-2.5 py-0.5 animate-pulse">
                {capsulesLeft} Capsules
              </span>
            </div>

            {/* Visual Pink Porcelain Dry-Jar */}
            <div className="relative w-44 h-48 flex items-center justify-center my-2 group select-none">
              
              {/* Floating particles from broken capsule */}
              {brokenParticles.map((pt) => {
                const ptX = `${pt.x}px`;
                const ptY = `${pt.y}px`;
                return (
                  <div
                    key={pt.id}
                    className="absolute text-xl animate-float-away select-none pointer-events-none"
                    style={{
                      left: '50%',
                      top: '50%',
                      '--x': ptX,
                      '--y': ptY,
                    } as React.CSSProperties}
                  >
                    {pt.emoji}
                  </div>
                );
              })}

              {/* Jar Lid (Gold/White Ceramic Accent) */}
              <div className="absolute top-0 w-20 h-4 bg-gradient-to-r from-pink-300 via-pink-100 to-pink-300 rounded-full border border-pink-400 z-20 shadow-md group-hover:-translate-y-1 transition-transform duration-300" />
              
              {/* Jar Neck */}
              <div className="absolute top-3 w-16 h-3 bg-pink-100/90 border-x border-pink-300 z-10" />

              {/* Glass Jar Body (highly realistic, pink glowing ceramic look) */}
              <div className="absolute bottom-0 w-36 h-40 rounded-[35px] bg-gradient-to-tr from-pink-400/30 via-pink-200/20 to-white/15 border-2 border-pink-300/60 backdrop-blur-[2px] shadow-[0_8px_32px_0_rgba(255,182,193,0.3)] z-10 overflow-hidden flex flex-wrap content-start justify-center p-3.5 gap-2 pt-6">
                
                {/* Visual Sweet capsules styled on glass shelf */}
                {Array.from({ length: Math.min(capsulesLeft, 12) }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-6 h-3 rounded-full bg-gradient-to-r ${
                      idx % 3 === 0 
                        ? 'from-[#ff8a8a] to-pink-300' 
                        : idx % 3 === 1 
                        ? 'from-pink-300 to-purple-300' 
                        : 'from-amber-200 to-pink-200'
                    } shadow-[0_0_8px_rgba(255,138,138,0.6)] animate-pulse border border-white/30 transform hover:scale-125 transition-all cursor-pointer`}
                    style={{
                      animationDelay: `${idx * 0.15}s`,
                      transform: `rotate(${idx * 28}deg) translateY(${Math.sin(idx) * 4}px)`
                    }}
                    title="A sweet reassurance capsule"
                  />
                ))}

                {capsulesLeft === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-center p-4">
                    <p className="text-[10px] text-pink-200 uppercase font-mono tracking-widest leading-normal animate-pulse">Jar is Empty 🍬</p>
                    <p className="text-[8px] text-white/50 mt-1 leading-relaxed">No worries! Tap refill button below to refresh!</p>
                  </div>
                )}
              </div>

              {/* Soft romantic core aura */}
              <div className="absolute w-28 h-28 rounded-full bg-gradient-to-tr from-pink-500 to-[#ff8a8a] blur-[25px] opacity-15" />
            </div>

            {/* Mind State selector */}
            <div className="w-full mt-2 bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
              <p className="text-[10px] uppercase font-mono tracking-widest text-[#e0d8d0]/60 mb-2">How is your heart feeling today?</p>
              
              <div className="grid grid-cols-4 gap-1">
                {(["lonely", "anxious", "tired", "sad"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setCapsuleState(st)}
                    className={`text-[9px] uppercase py-1.5 px-0.5 rounded-lg border font-mono tracking-wide transition-all cursor-pointer ${
                      capsuleState === st
                        ? "bg-[#ff8a8a] text-[#1a0b0b] font-bold border-[#ff8a8a] shadow-[0_0_8px_rgba(255,138,138,0.4)]"
                        : "bg-white/5 text-[#e0d8d0] border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <span className="block text-xs mb-0.5">
                      {st === "lonely" ? "🖤" : st === "anxious" ? "🌪️" : st === "tired" ? "💤" : "😢"}
                    </span>
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Action button */}
            <button
              id="btn-reassurance-capsule"
              disabled={capsuleLoading}
              onClick={handleOpenCapsule}
              className={`w-full mt-4 bg-gradient-to-r from-pink-300 to-[#ff8a8a] text-[#1a0b0b] font-medium py-3 px-5 rounded-full shadow-lg hover:from-white hover:to-white hover:scale-[1.02] transition-all duration-300 text-xs font-sans flex items-center justify-center gap-2 cursor-pointer ${
                capsuleLoading ? "opacity-75 cursor-not-allowed" : ""
              }`}
            >
              {capsuleLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#1a0b0b] border-t-transparent rounded-full animate-spin" />
                  <span>Unwrapping Secret Capsule...</span>
                </>
              ) : capsulesLeft === 0 ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Refill Reassurance Jar 🌸</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>Break Open A Capsule 🍬</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Double Stacked Layout (Apology Scroll + Interactive Comfort Dialogue) (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6 w-full justify-between">
          
          {/* Top Panel: Beautiful parchment-style deep apology letter */}
          <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] p-6 shadow-2xl border border-white/10 flex flex-col relative overflow-hidden transition-all duration-500 hover:border-white/20 flex-1 min-h-[300px]">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none select-none">
              <Heart className="w-32 h-32 text-[#ff8a8a] fill-[#ff8a8a]" />
            </div>

            <div className="relative z-10 flex items-center gap-2 border-b border-white/10 pb-4 mb-4">
              <Sparkles className="w-4 h-4 text-[#ff8a8a] animate-pulse" />
              <h2 className="text-lg font-light font-romantic text-[#fdfcf0] tracking-wide">A Deep Letter of Total Sincerity</h2>
            </div>

            {/* Scrollable Letter Area */}
            <div className="flex-1 overflow-y-auto max-h-[320px] pr-2 scrollbar-thin scrollbar-thumb-amber-200/20">
              <div className="font-romantic text-sm md:text-base text-[#e0d8d0] leading-relaxed italic whitespace-pre-line text-center bg-[#1a0b0b]/60 border border-white/10 p-6 rounded-2xl shadow-inner relative">
                <div className="absolute -top-4 -left-4 bg-[#ff8a8a] text-[#1a0b0b] w-10 h-10 flex items-center justify-center rounded-full font-serif text-xl shadow-lg font-bold select-none">&ldquo;</div>
                
                {apologyText}
                
                {/* Visual flower accent */}
                <div className="text-center text-xs mt-6 select-none text-[#ff8a8a] opacity-60">
                   🌹 ─── *Promise of Love \& Devotion* ─── 🌹
                </div>
              </div>
            </div>

            {/* Deep touching bottom quote */}
            <div className="mt-4 bg-[#ff8a8a]/5 border border-[#ff8a8a]/15 text-center py-2.5 px-4 rounded-xl text-xs font-romantic italic text-[#ff8a8a] shadow-sm">
              &ldquo;You are my entire world, and I am nothing without your beautiful smile.&rdquo;
            </div>
          </div>

          {/* Bottom Panel: Smooth Comfort Chat Stream so they can dialogue directly */}
          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-5 shadow-2xl border border-white/10 flex flex-col h-[280px]">
            
            {/* Conversations track */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 mb-3 bg-[#1a0b0b]/30 p-3 rounded-2xl border border-white/5 shadow-inner">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "girl" ? "justify-end" : "justify-start"} animate-scale-in`}
                >
                  <div className={`max-w-[85%] flex flex-col ${msg.sender === "girl" ? "items-end" : "items-start"}`}>
                    <div
                      className={`rounded-2xl px-3.5 py-1.5 text-xs inline-block leading-relaxed shadow-md ${
                        msg.sender === "girl"
                          ? "bg-[#ff8a8a] text-[#1a0b0b] font-medium rounded-tr-none shadow-[0_0_8px_rgba(255,138,138,0.2)]"
                          : "bg-white/5 text-[#f5f5f0] border border-white/10 rounded-tl-none"
                      }`}
                    >
                      <p>{msg.text}</p>
                    </div>
                    <span className="text-[8px] text-white/40 mt-0.5 font-mono tracking-wide px-1">
                      {msg.time} &bull; {msg.sender === "boy" ? "🌸 Pleading Boyfriend" : "👑 Sweetheart Girlfriend"}
                    </span>
                  </div>
                </div>
              ))}

              {isBoyTyping && (
                <div className="flex justify-start items-center gap-1 animate-pulse pl-2 py-0.5">
                  <div className="w-1 h-1 bg-[#ff8a8a] rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                  <div className="w-1 h-1 bg-[#ff8a8a] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  <div className="w-1 h-1 bg-[#ff8a8a] rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                  <span className="text-[10px] text-[#ff8a8a]/80 font-mono pl-1">Boy is writing a gentle reply...</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick response pills */}
            <div className="pb-2 border-b border-white/5 flex gap-1 overflow-x-auto pb-1 max-w-full">
              <button
                onClick={() => { setUserInput("Do you promise to always hold my hand? ✨"); }}
                className="bg-white/5 hover:bg-white/10 text-[10px] px-2.5 py-1 rounded-full border border-white/10 text-[#ff8a8a] transition-all cursor-pointer whitespace-nowrap"
              >
                ✨ Promise to hold my hand?
              </button>
              <button
                onClick={() => { setUserInput("I am still upset with you, hmph... 😤"); }}
                className="bg-white/5 hover:bg-white/10 text-[10px] px-2.5 py-1 rounded-full border border-white/10 text-[#ff8a8a] transition-all cursor-pointer whitespace-nowrap"
              >
                😤 Still a bit upset
              </button>
              <button
                onClick={() => { setUserInput("I forgive you! Let's hug forever. ❤️"); }}
                className="bg-white/5 hover:bg-white/10 text-[10px] px-2.5 py-1 rounded-full border border-white/10 text-[#ff8a8a] transition-all cursor-pointer whitespace-nowrap"
              >
                ❤️ I forgive you
              </button>
            </div>

            {/* Chat submit bar */}
            <form onSubmit={handleSendMessage} className="flex gap-2 pt-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Comfort with sweet words or talk back..."
                className="flex-1 bg-[#1a0b0b]/60 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-white/35 focus:outline-none focus:ring-1 focus:ring-[#ff8a8a]"
              />
              <button
                type="submit"
                className="bg-[#ff8a8a] hover:bg-white text-[#1a0b0b] px-4 rounded-xl transition-all shadow-md flex items-center justify-center cursor-pointer active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="relative w-full px-6 py-4 bg-none text-center border-t border-white/5 z-35 mt-auto">
        <p className="text-xs text-[#ff8a8a]/60 font-display font-light tracking-[0.12em]">
          March 2026 &bull; Made with devotion and deep apologies &bull; Pleading boyfriend is waiting under the soft stars 🌸
        </p>
      </footer>

      {/* ─── SECURE REASSURANCE CAPSULE POPUP MODAL ─── */}
      {capsuleOpen && (
        <div 
          id="reassurance-capsule-modal"
          className="fixed inset-0 bg-[#1a0b0b]/92 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div className="bg-gradient-to-br from-[#2d1414] to-[#120505] p-6 md:p-8 rounded-[2.5rem] border border-[#ff8a8a]/40 max-w-md w-full shadow-2xl relative text-center flex flex-col items-center gap-4">
            
            {/* Ambient light source */}
            <div className="absolute top-[-30%] left-[-30%] w-[80%] h-[80%] rounded-full bg-gradient-to-tr from-[#ff8a8a] to-transparent blur-[70px] opacity-25 pointer-events-none" />

            <div className="w-14 h-14 rounded-full bg-pink-100/10 text-pink-300 flex items-center justify-center text-3xl shadow-inner border border-[#ff8a8a]/20 select-none animate-bounce">
              🍬
            </div>

            <span className="text-[9px] font-mono tracking-[0.25em] uppercase text-[#ff8a8a] bg-[#ff8a8a]/10 px-3.5 py-1 rounded-full border border-[#ff8a8a]/30">
              SECRET REASSURANCE CAPSULE
            </span>

            <h4 className="text-xs font-mono font-light text-white/50 tracking-wide">
              Custom-crafted statement for your <span className="text-[#ff8a8a] font-romantic capitalize font-bold">{capsuleState}</span> state of mind:
            </h4>

            {/* Glowing Message Box in parchment mode */}
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl shadow-inner text-[#fdfcf0] font-romantic text-sm md:text-base leading-relaxed italic relative min-h-[105px] flex items-center justify-center text-center w-full">
              <div className="absolute top-2 left-3 text-3xl text-[#ff8a8a]/20 font-serif select-none leading-none">&ldquo;</div>
              <p className="z-10 relative px-4 text-[#ffe4e6]">{capsuleMessage}</p>
              <div className="absolute bottom-2 right-3 text-3xl text-[#ff8a8a]/20 font-serif select-none leading-none">&rdquo;</div>
            </div>

            <button
              onClick={() => setCapsuleOpen(false)}
              className="mt-2 w-full bg-[#ff8a8a] hover:bg-white text-[#1a0b0b] font-medium py-3 rounded-full transition-all duration-300 text-xs tracking-wider shadow-md cursor-pointer transform hover:scale-[1.02] font-semibold"
            >
              Secure Message Inside Heart 💖
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
