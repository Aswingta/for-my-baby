import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  color: string;
  type: "heart" | "star";
  swayFreq: number;
  swayPhase: number;
  life: number;
}

interface ProceduralHeartsProps {
  interactive?: boolean;
}

export default function ProceduralHearts({ interactive = true }: ProceduralHeartsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initial random particles
    const initialCount = 45;
    for (let i = 0; i < initialCount; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 12 + 4,
        speedY: -(Math.random() * 0.7 + 0.3),
        speedX: Math.random() * 0.4 - 0.2,
        opacity: Math.random() * 0.6 + 0.2,
        color: `hsla(${Math.random() * 20 + 340}, 95%, ${Math.random() * 15 + 75}%, 1)`, // Soft pink/pastel rose
        type: Math.random() > 0.4 ? "heart" : "star",
        swayFreq: Math.random() * 0.02 + 0.005,
        swayPhase: Math.random() * Math.PI * 2,
        life: 1,
      });
    }

    // Capture mouse moves
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      // Occasionally launch particles on hover
      if (Math.random() > 0.85) {
        particlesRef.current.push({
          x: mouseRef.current.x,
          y: mouseRef.current.y,
          size: Math.random() * 9 + 3,
          speedY: -(Math.random() * 1.5 + 0.5),
          speedX: Math.random() * 1.2 - 0.6,
          opacity: 1,
          color: `hsla(${Math.random() * 20 + 340}, 100%, 80%, 1)`,
          type: "heart",
          swayFreq: Math.random() * 0.05 + 0.01,
          swayPhase: Math.random() * Math.PI * 2,
          life: 1,
        });
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -100, y: -100 };
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    const drawHeart = (c: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      c.beginPath();
      c.moveTo(x, y + size / 4);
      c.quadraticCurveTo(x, y, x - size / 2, y);
      c.quadraticCurveTo(x - size, y, x - size, y + size / 3);
      c.quadraticCurveTo(x - size, y + (size * 2) / 3, x, y + size);
      c.quadraticCurveTo(x + size, y + (size * 2) / 3, x + size, y + size / 3);
      c.quadraticCurveTo(x + size, y, x + size / 2, y);
      c.quadraticCurveTo(x, y, x, y + size / 4);
      c.closePath();
      c.fill();
    };

    const drawStar = (c: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      c.beginPath();
      for (let i = 0; i < 5; i++) {
        c.lineTo(
          Math.cos(((18 + i * 72) * Math.PI) / 180) * size + x,
          -Math.sin(((18 + i * 72) * Math.PI) / 180) * size + y
        );
        c.lineTo(
          Math.cos(((54 + i * 72) * Math.PI) / 180) * (size / 2) + x,
          -Math.sin(((54 + i * 72) * Math.PI) / 180) * (size / 2) + y
        );
      }
      c.closePath();
      c.fill();
    };

    let animationId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render & update particles
      particlesRef.current.forEach((p, index) => {
        p.y += p.speedY;
        p.swayPhase += p.swayFreq;
        p.x += p.speedX + Math.sin(p.swayPhase) * 0.3;

        // Fade slowly as of age or hitting top boundary
        if (p.y < -p.size) {
          // Recycle to the bottom
          p.y = canvas.height + p.size;
          p.x = Math.random() * canvas.width;
          p.opacity = Math.random() * 0.5 + 0.1;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;

        if (p.type === "heart") {
          drawHeart(ctx, p.x, p.y, p.size);
        } else {
          drawStar(ctx, p.x, p.y, p.size / 2);
        }
      });

      ctx.globalAlpha = 1.0;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationId);
    };
  }, [interactive]);

  return (
    <canvas
      id="romantic-flow-canvas"
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden"
    />
  );
}
