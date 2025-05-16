// src/components/GridBackground.tsx
"use client";

import React, { useRef, useEffect, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  radius: number; // Base radius
  vx: number;
  vy: number;
  baseColorH: number; // Hue
  baseColorS: number; // Saturation
  baseColorL: number; // Lightness
  baseColorA: number; // Alpha
  highlightColorL: number; // Lightness for highlight
  highlightColorA: number; // Alpha for highlight
  
  highlightIntensity: number; // 0 to 1 for smooth transition
  
  // For pulsation
  pulseAngle: number;
  pulseSpeed: number;
  pulseAmplitude: number;

  // For connection-based sizing
  connectionCount: number;
}

// Helper to parse HSLA string into components
const parseHsla = (hslaString: string): [number, number, number, number] => {
  const match = hslaString.match(/hsla\((\d+),\s*([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)\)/);
  if (match) {
    return [parseInt(match[1]), parseFloat(match[2]), parseFloat(match[3]), parseFloat(match[4])];
  }
  return [190, 100, 70, 0.5]; 
};

// Linear interpolation function
const lerp = (start: number, end: number, amount: number): number => {
  return (1 - amount) * start + amount * end;
};


const GridBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesArray = useRef<Particle[]>([]);
  const mousePosition = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });
  
  const getCssVar = (name: string, fallback: string) => {
    if (typeof window === 'undefined') return fallback; 
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  };

  // --- Configuration ---
  const PARTICLE_BASE_COLOR_STR = useRef('hsla(190, 100%, 70%, 0.5)');
  const PARTICLE_HIGHLIGHT_COLOR_STR = useRef('hsla(190, 100%, 90%, 1)');
  const LINE_BASE_COLOR_STR = useRef('hsla(210, 80%, 50%, 0.15)');
  const LINE_HIGHLIGHT_COLOR_STR = useRef('hsla(190, 80%, 60%, 0.7)');
  const MOUSE_INTERACTION_RADIUS = useRef(180);

  const MAX_PARTICLES = 500; // User requested 500 particles
  const CONNECT_DISTANCE = 110; // Slightly reduced due to increased particle density
  const PARTICLE_BASE_SPEED = 0.18; // Slightly slower for more particles
  const MIN_RADIUS = 0.6;
  const MAX_RADIUS = 1.8;
  const HIGHLIGHT_FADE_SPEED = 0.08; 
  const CONNECTION_RADIUS_BONUS = 0.08; // How much radius increases per connection
  const MAX_CONNECTION_BONUS_RADIUS = 1.2; // Max additional radius from connections
  // --- End Configuration ---

  const initParticles = useCallback((canvas: HTMLCanvasElement) => {
    particlesArray.current = [];
    const numberOfParticles = MAX_PARTICLES;

    const [baseH, baseS, baseL, baseA] = parseHsla(PARTICLE_BASE_COLOR_STR.current);
    const [, , highlightL, highlightA] = parseHsla(PARTICLE_HIGHLIGHT_COLOR_STR.current);

    for (let i = 0; i < numberOfParticles; i++) {
      const radius = Math.random() * (MAX_RADIUS - MIN_RADIUS) + MIN_RADIUS;
      const x = Math.random() * (canvas.width - radius * 2) + radius;
      const y = Math.random() * (canvas.height - radius * 2) + radius;
      const vx = (Math.random() - 0.5) * PARTICLE_BASE_SPEED * 2;
      const vy = (Math.random() - 0.5) * PARTICLE_BASE_SPEED * 2;
      
      const pulseAngle = Math.random() * Math.PI * 2;
      const pulseSpeed = (Math.random() * 0.02) + 0.01;
      const pulseAmplitude = radius * 0.5;

      particlesArray.current.push({ 
        x, y, radius, vx, vy, 
        baseColorH: baseH,
        baseColorS: baseS,
        baseColorL: baseL,
        baseColorA: baseA,
        highlightColorL: highlightL,
        highlightColorA: highlightA,
        highlightIntensity: 0,
        pulseAngle,
        pulseSpeed,
        pulseAmplitude,
        connectionCount: 0, // Initialize connection count
      });
    }
  }, []);

  const animate = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Reset connection counts for all particles at the start of each frame
    particlesArray.current.forEach(particle => {
      particle.connectionCount = 0;
    });

    // --- Calculate Connections and Update Counts ---
    // This loop is primarily for line drawing but we'll also count connections here
    const [lineBaseH, lineBaseS, lineBaseL, lineBaseA] = parseHsla(LINE_BASE_COLOR_STR.current);
    const [, lineHighlightS, lineHighlightL, lineHighlightA] = parseHsla(LINE_HIGHLIGHT_COLOR_STR.current);

    for (let i = 0; i < particlesArray.current.length; i++) {
      for (let j = i + 1; j < particlesArray.current.length; j++) {
        const p1 = particlesArray.current[i];
        const p2 = particlesArray.current[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < CONNECT_DISTANCE) {
          // Increment connection count for both particles
          p1.connectionCount++;
          p2.connectionCount++;

          // Line drawing logic (as before)
          const lineMaxHighlightIntensity = Math.max(p1.highlightIntensity, p2.highlightIntensity);
          const L = lerp(lineBaseL, lineHighlightL, lineMaxHighlightIntensity);
          let A = lerp(lineBaseA, lineHighlightA, lineMaxHighlightIntensity);
          const distanceOpacityFactor = 1 - (distance / CONNECT_DISTANCE);
          A *= distanceOpacityFactor;
          A = Math.max(0, Math.min(1, A));

          if (A < 0.01) continue;

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `hsla(${lineBaseH}, ${lineBaseS}%, ${L}%, ${A.toFixed(3)})`;
          ctx.lineWidth = lerp(0.6, 1.2, lineMaxHighlightIntensity);
          ctx.stroke();
        }
      }
    }


    // --- Update and Draw Particles ---
    particlesArray.current.forEach(particle => {
      // Update pulse
      particle.pulseAngle += particle.pulseSpeed;
      const currentPulseFactor = (Math.sin(particle.pulseAngle) + 1) / 2;
      let dynamicRadius = particle.radius + currentPulseFactor * particle.pulseAmplitude;

      // Add connection-based radius bonus
      const connectionBonus = Math.min(particle.connectionCount * CONNECTION_RADIUS_BONUS, MAX_CONNECTION_BONUS_RADIUS);
      dynamicRadius += connectionBonus;
      
      // Smooth Mouse Interaction & Highlight Intensity
      let targetHighlightIntensity = 0;
      if (mousePosition.current.x !== null && mousePosition.current.y !== null) {
        const dxMouse = particle.x - mousePosition.current.x;
        const dyMouse = particle.y - mousePosition.current.y;
        const distanceMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        if (distanceMouse < MOUSE_INTERACTION_RADIUS.current) {
          targetHighlightIntensity = 1; 
        }
      }
      particle.highlightIntensity = lerp(particle.highlightIntensity, targetHighlightIntensity, HIGHLIGHT_FADE_SPEED);

      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Wall collision (use dynamicRadius for accuracy)
      if (particle.x + dynamicRadius > canvas.width || particle.x - dynamicRadius < 0) {
        particle.vx *= -1;
      }
      if (particle.y + dynamicRadius > canvas.height || particle.y - dynamicRadius < 0) {
        particle.vy *= -1;
      }

      // Interpolate color based on highlightIntensity
      const L = lerp(particle.baseColorL, particle.highlightColorL, particle.highlightIntensity);
      let A = lerp(particle.baseColorA, particle.highlightColorA, particle.highlightIntensity);
      A = A * (0.6 + currentPulseFactor * 0.4); 
      A = Math.max(0, Math.min(1, A));

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, dynamicRadius, 0, Math.PI * 2, false); // Use dynamicRadius
      ctx.fillStyle = `hsla(${particle.baseColorH}, ${particle.baseColorS}%, ${L}%, ${A.toFixed(3)})`;
      ctx.fill();
    });

    requestAnimationFrame(() => animate(canvas, ctx));
  }, []);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    PARTICLE_BASE_COLOR_STR.current = getCssVar('--particle-color', 'hsla(190, 100%, 70%, 0.5)');
    PARTICLE_HIGHLIGHT_COLOR_STR.current = getCssVar('--particle-highlight-color', 'hsla(190, 100%, 90%, 1)');
    LINE_BASE_COLOR_STR.current = getCssVar('--line-color', 'hsla(210, 80%, 50%, 0.15)');
    LINE_HIGHLIGHT_COLOR_STR.current = getCssVar('--line-highlight-color', 'hsla(190, 80%, 60%, 0.7)');
    MOUSE_INTERACTION_RADIUS.current = parseFloat(getCssVar('--mouse-interaction-radius', '180'));

    let animationFrameId: number;
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles(canvas); 
    };
    const handleMouseMove = (event: MouseEvent) => {
      mousePosition.current = { x: event.clientX, y: event.clientY };
    };
    const handleMouseLeave = () => {
      mousePosition.current = { x: null, y: null };
    };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    
    resizeCanvas(); 
    animationFrameId = requestAnimationFrame(() => animate(canvas, ctx));

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [initParticles, animate]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    ></canvas>
  );
};

export default GridBackground;
