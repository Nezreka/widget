// src/components/GridBackground.tsx
"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';

// Interface for main interactive particles
interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  originalVx: number;
  originalVy: number;
  hueOffset: number;
  baseColorS: number;
  baseColorL: number;
  baseColorA: number;
  highlightColorL: number;
  highlightColorA: number;
  highlightIntensity: number;
  pulseAngle: number;
  pulseSpeed: number;
  pulseAmplitude: number;
  connectionCount: number;
  targetRadius: number;
  currentRadius: number;
}

// Interface for click ripple effects
interface ClickEffect {
  x: number;
  y: number;
  strength: number;
  maxRadius: number;
  life: number;
  type: 'repel' | 'attract'; // Added type for click effect
}

// Interface for cosmic dust particles
interface CosmicDustParticle {
  id: number;
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  baseAlpha: number;
  hueOffset: number;
}

// Interface for Nebula Clouds
interface NebulaCloud {
  id: number;
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  angle: number;
  baseHueOffset: number;
  saturation: number;
  luminosityInner: number;
  luminosityOuter: number;
  baseOpacity: number;
  driftXFactor: number;
  driftYFactor: number;
  sizePulseSpeed: number;
  opacityPulseSpeed: number;
  timeOffsetX: number;
  timeOffsetY: number;
  timeOffsetOpacity: number;
  timeOffsetSize: number;
  initialOffsetX: number;
  initialOffsetY: number;
  hueOscillationSpeed: number;
  hueOscillationAmplitude: number;
  timeOffsetHue: number;
  luminosityPulseSpeed: number;
  luminosityPulseAmplitude: number;
  timeOffsetLuminosity: number;
}

// Interface for Stardust Trail particles (New)
interface StardustParticle {
  id: number;
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  life: number;
  initialLife: number;
  hueOffset: number;
  baseAlpha: number;
  saturation: number;
  lightness: number;
}


interface GridBackgroundProps {
  cellSize: number;
  gridWidth: number; // This is the full CSS width of the grid content
}

interface GridPointData {
  x: number;
  y: number;
  alpha: number;
  pulseFactor: number;
  distNormalized: number;
}

// --- Constants ---
const TWO_PI = Math.PI * 2;

// --- START: Responsive Particle Configuration ---
const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

const DESKTOP_PARTICLES = 500;
const TABLET_PARTICLES = 200;
const MOBILE_PARTICLES = 100;

const getInitialMaxParticles = (): number => {
  if (typeof window === 'undefined') {
    return DESKTOP_PARTICLES; // Default for SSR or before window is available
  }
  const width = window.innerWidth;
  if (width < MOBILE_BREAKPOINT) {
    return MOBILE_PARTICLES;
  } else if (width < TABLET_BREAKPOINT) {
    return TABLET_PARTICLES;
  }
  return DESKTOP_PARTICLES;
};
// --- END: Responsive Particle Configuration ---

const parseHsla = (hslaString: string): [number, number, number, number] => {
  const match = hslaString.match(/hsla\((\d+),\s*([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)\)/);
  if (match) {
    return [parseInt(match[1]), parseFloat(match[2]), parseFloat(match[3]), parseFloat(match[4])];
  }
  console.warn(`Failed to parse HSLA string: ${hslaString}. Using default (deep space theme).`);
  return [260, 70, 10, 0.1]; // Default fallback for deep space theme
};

const lerp = (start: number, end: number, amount: number): number => {
  return (1 - amount) * start + amount * end;
};

const getHarmonizedHsla = (
  currentMasterHue: number,
  hueOffset: number,
  saturation: number,
  lightness: number,
  alpha: number,
  allowNegativeHueOffset: boolean = false
): string => {
  let hue = currentMasterHue + hueOffset;
  if (!allowNegativeHueOffset && hue < currentMasterHue) {
      hue = currentMasterHue + (hueOffset % 360);
  }
  hue = hue % 360;
  if (hue < 0) hue += 360;

  const satClamped = Math.max(0, Math.min(100, saturation));
  const ligClamped = Math.max(0, Math.min(100, lightness));
  const alpClamped = Math.max(0, Math.min(1, alpha));

  return `hsla(${hue.toFixed(0)}, ${satClamped.toFixed(1)}%, ${ligClamped.toFixed(1)}%, ${alpClamped.toFixed(3)})`;
};

const GridBackground: React.FC<GridBackgroundProps> = ({ cellSize, gridWidth }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasCssHeightRef = useRef<number>(0);
  const particlesArray = useRef<Particle[]>([]);
  const cosmicDustParticles = useRef<CosmicDustParticle[]>([]);
  const nebulaClouds = useRef<NebulaCloud[]>([]);
  const mousePosition = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });
  const clickEffects = useRef<ClickEffect[]>([]);
  const stardustParticles = useRef<StardustParticle[]>([]); // New: For stardust trails
  const stardustIdCounter = useRef(0); // New: For unique stardust IDs
  const animationFrameId = useRef<number | null>(null);
  
  const masterHue = useRef(260);
  const gridGlobalPulseAngle = useRef(0);
  const animationTime = useRef(0);

  const [config, setConfig] = useState(() => {
    const initialMouseInteractionRadius = 190;
    const initialConnectDistance = 150;
    const initialGridRevealRadius = 150;
    const isFirefox = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('firefox');

    return {
      PARTICLE_BASE_COLOR_STR: 'hsla(260, 80%, 60%, 0.7)',
      PARTICLE_HIGHLIGHT_COLOR_STR: 'hsla(280, 90%, 75%, 1)',
      LINE_BASE_COLOR_STR: 'hsla(250, 60%, 35%, 0.15)',
      LINE_HIGHLIGHT_COLOR_STR: 'hsla(270, 75%, 55%, 0.6)',
      
      MOUSE_INTERACTION_RADIUS: initialMouseInteractionRadius,
      MAX_PARTICLES: getInitialMaxParticles(),
      CONNECT_DISTANCE: initialConnectDistance,
      CONNECT_DISTANCE_SQUARED: initialConnectDistance * initialConnectDistance,
      PARTICLE_BASE_SPEED_MIN: 0.07,
      PARTICLE_BASE_SPEED_MAX: 0.22,
      PARTICLE_RETURN_LERP_AMOUNT: 0.05,
      MIN_RADIUS: 0.5,
      MAX_RADIUS: 1.7,
      HIGHLIGHT_FADE_SPEED: 0.07,
      CONNECTION_RADIUS_BONUS: 0.07,
      MAX_CONNECTION_BONUS_RADIUS: 1.2,
      MASTER_HUE_CYCLE_SPEED: 0.010,
      CLICK_REPEL_STRENGTH: 45,
      CLICK_ATTRACT_STRENGTH: 35, // New: Strength for attraction
      CLICK_EFFECT_RADIUS: 210,
      CLICK_EFFECT_DURATION: 32,
      MIN_CLICK_INTERACTION_DISTANCE: 5, // New: Minimum distance for click force calculation
      MOUSE_RADIUS_MULTIPLIER: 1.65,
      RADIUS_LERP_SPEED: 0.11,
      
      GRID_REVEAL_RADIUS: initialGridRevealRadius,
      GRID_REVEAL_RADIUS_SQUARED: initialGridRevealRadius * initialGridRevealRadius,
      GRID_LINE_BASE_COLOR_STR: 'hsla(270, 40%, 25%, 0.08)',
      GRID_LINE_HIGHLIGHT_COLOR_STR: 'hsla(285, 65%, 55%, 0.75)',
      GRID_LINE_WIDTH_BASE: 0.15,
      GRID_LINE_WIDTH_PULSE_MAX: 1.0,
      GRID_PULSE_SPEED: 0.028,
      GRID_PULSE_WAVELENGTH_FACTOR: Math.PI * 2.1,
      GRID_OPACITY_FALLOFF_POWER: 1.8,
      GRID_MIN_PULSE_ALPHA_MODULATION: 0.2,

      COSMIC_DUST_COUNT: 80,
      COSMIC_DUST_MAX_SIZE: 0.7,
      COSMIC_DUST_MIN_SIZE: 0.1,
      COSMIC_DUST_SPEED_FACTOR: 0.025,
      COSMIC_DUST_BASE_SATURATION: 50,
      COSMIC_DUST_BASE_LIGHTNESS: 30,
      COSMIC_DUST_BASE_ALPHA: 0.20,
      COSMIC_DUST_HUE_SPREAD: 70,

      NEBULA_CLOUD_COUNT: isFirefox ? 0 : 5,
      NEBULA_COMPOSITE_OPERATION: 'lighter',
      NEBULA_MAX_SIZE_FACTOR_W: 0.9, NEBULA_MIN_SIZE_FACTOR_W: 0.5,
      NEBULA_MAX_SIZE_FACTOR_H: 0.7, NEBULA_MIN_SIZE_FACTOR_H: 0.3,
      NEBULA_BASE_SATURATION_MIN: 60, NEBULA_BASE_SATURATION_MAX: 85,
      NEBULA_LUMINOSITY_INNER_MIN: 5, NEBULA_LUMINOSITY_INNER_MAX: 12,
      NEBULA_LUMINOSITY_OUTER_MIN: 1, NEBULA_LUMINOSITY_OUTER_MAX: 5,
      NEBULA_BASE_OPACITY_MIN: 0.10, NEBULA_BASE_OPACITY_MAX: 0.30,
      NEBULA_HUE_OFFSET_RANGE: 60, NEBULA_WARM_HUE_CHANCE: 0.25,
      NEBULA_WARM_HUE_PRIMARY: 15, NEBULA_WARM_HUE_SECONDARY: 340,
      NEBULA_DRIFT_SPEED_MAX: 0.00025,
      NEBULA_PULSE_SPEED_SIZE: 0.0007, NEBULA_PULSE_AMPLITUDE_SIZE: 0.12,
      NEBULA_PULSE_SPEED_OPACITY: 0.0009, NEBULA_PULSE_AMPLITUDE_OPACITY: 0.35,
      NEBULA_ELLIPSE_ROTATION_MAX: Math.PI / 4,
      NEBULA_HUE_OSCILLATION_SPEED_MIN: 0.0005, NEBULA_HUE_OSCILLATION_SPEED_MAX: 0.002,
      NEBULA_HUE_OSCILLATION_AMPLITUDE_MIN: 5, NEBULA_HUE_OSCILLATION_AMPLITUDE_MAX: 25,
      NEBULA_LUMINOSITY_PULSE_SPEED_MIN: 0.0006, NEBULA_LUMINOSITY_PULSE_SPEED_MAX: 0.0025,
      NEBULA_LUMINOSITY_PULSE_AMPLITUDE_MIN: 0.1, NEBULA_LUMINOSITY_PULSE_AMPLITUDE_MAX: 0.4,

      GRID_NEBULA_X_FREQ: 0.013, GRID_NEBULA_Y_FREQ: 0.013,
      GRID_NEBULA_TIME_FREQ: 0.18, GRID_NEBULA_INTENSITY: 0.6,
      
      BASE_BACKGROUND_COLOR: 'hsla(0, 0%, 2%, 1)',

      // New: Stardust Configuration
      STARDUST_PARTICLE_COUNT_ON_MOVE: 2,
      STARDUST_LIFESPAN: 60, // In frames
      STARDUST_MAX_RADIUS: 0.8,
      STARDUST_MIN_RADIUS: 0.2,
      STARDUST_BASE_ALPHA: 0.9,
      STARDUST_HUE_SPREAD: 40,
      STARDUST_SATURATION: 70,
      STARDUST_LIGHTNESS: 75,
      STARDUST_SPEED_FACTOR_MIN: 0.1,
      STARDUST_SPEED_FACTOR_MAX: 0.5,
    };
  });

  useEffect(() => {
    const handleResizeConfig = () => {
      const width = window.innerWidth;
      let newMaxParticles = DESKTOP_PARTICLES;
      if (width < MOBILE_BREAKPOINT) {
        newMaxParticles = MOBILE_PARTICLES;
      } else if (width < TABLET_BREAKPOINT) {
        newMaxParticles = TABLET_PARTICLES;
      }

      setConfig(prevConfig => {
        if (prevConfig.MAX_PARTICLES !== newMaxParticles) {
          return { ...prevConfig, MAX_PARTICLES: newMaxParticles };
        }
        return prevConfig;
      });
    };

    window.addEventListener('resize', handleResizeConfig);
    return () => window.removeEventListener('resize', handleResizeConfig);
  }, []);

  const getCssVar = useCallback((name: string, fallback: string) => {
    if (typeof window === 'undefined') return fallback;
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }, []);

  useEffect(() => {
    const [initialH] = parseHsla(config.PARTICLE_BASE_COLOR_STR);
    masterHue.current = initialH;

    setConfig(prevConfig => {
        const newMouseInteractionRadius = parseFloat(getCssVar('--mouse-interaction-radius', String(prevConfig.MOUSE_INTERACTION_RADIUS)));
        const newGridRevealRadius = parseFloat(getCssVar('--grid-reveal-radius', String(prevConfig.GRID_REVEAL_RADIUS)));
        
        return {
            ...prevConfig,
            MOUSE_INTERACTION_RADIUS: newMouseInteractionRadius,
            GRID_REVEAL_RADIUS: newGridRevealRadius,
            GRID_REVEAL_RADIUS_SQUARED: newGridRevealRadius * newGridRevealRadius,
        };
    });
  }, [getCssVar, config.PARTICLE_BASE_COLOR_STR]);


  const initParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasCssHeightRef.current === 0) return;

    particlesArray.current = [];
    const [, baseS, baseL, baseA] = parseHsla(config.PARTICLE_BASE_COLOR_STR);
    const [, , highlightL, highlightA] = parseHsla(config.PARTICLE_HIGHLIGHT_COLOR_STR);
    const currentCssHeight = canvasCssHeightRef.current;

    for (let i = 0; i < config.MAX_PARTICLES; i++) {
      const radius = Math.random() * (config.MAX_RADIUS - config.MIN_RADIUS) + config.MIN_RADIUS;
      const initialVx = (Math.random() - 0.5) * config.PARTICLE_BASE_SPEED_MAX * 2;
      const initialVy = (Math.random() - 0.5) * config.PARTICLE_BASE_SPEED_MAX * 2;
      particlesArray.current.push({
        x: Math.random() * gridWidth, 
        y: Math.random() * currentCssHeight,
        radius, 
        vx: initialVx, vy: initialVy,
        originalVx: initialVx, originalVy: initialVy,
        hueOffset: (Math.random() * 60) - 30,
        baseColorS: baseS, baseColorL: baseL, baseColorA: baseA,
        highlightColorL: highlightL, highlightColorA: highlightA, highlightIntensity: 0,
        pulseAngle: Math.random() * TWO_PI,
        pulseSpeed: (Math.random() * 0.02) + 0.01,
        pulseAmplitude: radius * (Math.random() * 0.3 + 0.2),
        connectionCount: 0, targetRadius: radius, currentRadius: radius,
      });
    }
    stardustParticles.current = []; // Clear stardust on re-init
  }, [config, gridWidth]); 

  const initCosmicDust = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasCssHeightRef.current === 0) return;
    const currentCssHeight = canvasCssHeightRef.current;

    cosmicDustParticles.current = [];
    for (let i = 0; i < config.COSMIC_DUST_COUNT; i++) {
      cosmicDustParticles.current.push({
        id: i,
        x: Math.random() * gridWidth, 
        y: Math.random() * currentCssHeight,
        radius: Math.random() * (config.COSMIC_DUST_MAX_SIZE - config.COSMIC_DUST_MIN_SIZE) + config.COSMIC_DUST_MIN_SIZE,
        vx: (Math.random() - 0.5) * config.COSMIC_DUST_SPEED_FACTOR,
        vy: (Math.random() - 0.5) * config.COSMIC_DUST_SPEED_FACTOR,
        baseAlpha: Math.random() * (config.COSMIC_DUST_BASE_ALPHA * 0.8) + (config.COSMIC_DUST_BASE_ALPHA * 0.2),
        hueOffset: (Math.random() * config.COSMIC_DUST_HUE_SPREAD) - (config.COSMIC_DUST_HUE_SPREAD / 2),
      });
    }
  }, [config, gridWidth]);

  const initNebulaClouds = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasCssHeightRef.current === 0) return;
    const currentCssHeight = canvasCssHeightRef.current;

    nebulaClouds.current = [];
    for (let i = 0; i < config.NEBULA_CLOUD_COUNT; i++) {
      const isWarm = Math.random() < config.NEBULA_WARM_HUE_CHANCE;
      let baseHueOffsetVal = (Math.random() * config.NEBULA_HUE_OFFSET_RANGE * 2) - config.NEBULA_HUE_OFFSET_RANGE;
      if (isWarm) {
        const targetWarmHue = Math.random() < 0.5 ? config.NEBULA_WARM_HUE_PRIMARY : config.NEBULA_WARM_HUE_SECONDARY;
        baseHueOffsetVal = targetWarmHue - masterHue.current; 
      }

      nebulaClouds.current.push({
        id: i,
        x: gridWidth * (0.25 + Math.random() * 0.5),
        y: currentCssHeight * (0.25 + Math.random() * 0.5),
        radiusX: gridWidth * (Math.random() * (config.NEBULA_MAX_SIZE_FACTOR_W - config.NEBULA_MIN_SIZE_FACTOR_W) + config.NEBULA_MIN_SIZE_FACTOR_W),
        radiusY: currentCssHeight * (Math.random() * (config.NEBULA_MAX_SIZE_FACTOR_H - config.NEBULA_MIN_SIZE_FACTOR_H) + config.NEBULA_MIN_SIZE_FACTOR_H),
        angle: Math.random() * config.NEBULA_ELLIPSE_ROTATION_MAX * (Math.random() < 0.5 ? 1 : -1),
        baseHueOffset: baseHueOffsetVal,
        saturation: Math.random() * (config.NEBULA_BASE_SATURATION_MAX - config.NEBULA_BASE_SATURATION_MIN) + config.NEBULA_BASE_SATURATION_MIN,
        luminosityInner: Math.random() * (config.NEBULA_LUMINOSITY_INNER_MAX - config.NEBULA_LUMINOSITY_INNER_MIN) + config.NEBULA_LUMINOSITY_INNER_MIN,
        luminosityOuter: Math.random() * (config.NEBULA_LUMINOSITY_OUTER_MAX - config.NEBULA_LUMINOSITY_OUTER_MIN) + config.NEBULA_LUMINOSITY_OUTER_MIN,
        baseOpacity: Math.random() * (config.NEBULA_BASE_OPACITY_MAX - config.NEBULA_BASE_OPACITY_MIN) + config.NEBULA_BASE_OPACITY_MIN,
        driftXFactor: (Math.random() - 0.5) * 2 * config.NEBULA_DRIFT_SPEED_MAX,
        driftYFactor: (Math.random() - 0.5) * 2 * config.NEBULA_DRIFT_SPEED_MAX,
        sizePulseSpeed: config.NEBULA_PULSE_SPEED_SIZE * (0.75 + Math.random() * 0.5),
        opacityPulseSpeed: config.NEBULA_PULSE_SPEED_OPACITY * (0.75 + Math.random() * 0.5),
        timeOffsetX: Math.random() * 1000, timeOffsetY: Math.random() * 1000,
        timeOffsetOpacity: Math.random() * 1000, timeOffsetSize: Math.random() * 1000,
        initialOffsetX: (Math.random() - 0.5) * gridWidth * 0.4, 
        initialOffsetY: (Math.random() - 0.5) * currentCssHeight * 0.4,
        hueOscillationSpeed: (Math.random() * (config.NEBULA_HUE_OSCILLATION_SPEED_MAX - config.NEBULA_HUE_OSCILLATION_SPEED_MIN) + config.NEBULA_HUE_OSCILLATION_SPEED_MIN),
        hueOscillationAmplitude: (Math.random() * (config.NEBULA_HUE_OSCILLATION_AMPLITUDE_MAX - config.NEBULA_HUE_OSCILLATION_AMPLITUDE_MIN) + config.NEBULA_HUE_OSCILLATION_AMPLITUDE_MIN),
        timeOffsetHue: Math.random() * 1000,
        luminosityPulseSpeed: (Math.random() * (config.NEBULA_LUMINOSITY_PULSE_SPEED_MAX - config.NEBULA_LUMINOSITY_PULSE_SPEED_MIN) + config.NEBULA_LUMINOSITY_PULSE_SPEED_MIN),
        luminosityPulseAmplitude: (Math.random() * (config.NEBULA_LUMINOSITY_PULSE_AMPLITUDE_MAX - config.NEBULA_LUMINOSITY_PULSE_AMPLITUDE_MIN) + config.NEBULA_LUMINOSITY_PULSE_AMPLITUDE_MIN),
        timeOffsetLuminosity: Math.random() * 1000,
      });
    }
  }, [config, gridWidth, masterHue]);

  const drawRevealedGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    if (mousePosition.current.x === null || mousePosition.current.y === null || cellSize <= 0) return;
    const mouseX = mousePosition.current.x; 
    const mouseY = mousePosition.current.y; 
    
    const [, gridBaseS, gridBaseL, gridBaseInitialAlpha] = parseHsla(config.GRID_LINE_BASE_COLOR_STR);
    const [, , gridHighlightL, gridHighlightActualA] = parseHsla(config.GRID_LINE_HIGHLIGHT_COLOR_STR);
    const currentGridHue = (masterHue.current + 20) % 360;
    gridGlobalPulseAngle.current = (gridGlobalPulseAngle.current + config.GRID_PULSE_SPEED) % TWO_PI;

    const visiblePoints = new Map<string, GridPointData>();
    const startGridX = Math.floor((mouseX - config.GRID_REVEAL_RADIUS) / cellSize) * cellSize;
    const endGridX = Math.ceil((mouseX + config.GRID_REVEAL_RADIUS) / cellSize) * cellSize;
    const startGridY = Math.floor((mouseY - config.GRID_REVEAL_RADIUS) / cellSize) * cellSize;
    const endGridY = Math.ceil((mouseY + config.GRID_REVEAL_RADIUS) / cellSize) * cellSize;
    const timeForNebula = animationTime.current * config.GRID_NEBULA_TIME_FREQ;

    for (let gx = startGridX; gx <= endGridX; gx += cellSize) {
      for (let gy = startGridY; gy <= endGridY; gy += cellSize) {
        const dx = gx - mouseX; const dy = gy - mouseY;
        const distSq = dx * dx + dy * dy;

        if (distSq < config.GRID_REVEAL_RADIUS_SQUARED) {
          const dist = Math.sqrt(distSq);
          const distNormalized = dist / config.GRID_REVEAL_RADIUS;
          const baseDistanceAlpha = Math.pow(1 - distNormalized, config.GRID_OPACITY_FALLOFF_POWER) * gridBaseInitialAlpha;
          const basePulse = (Math.sin(gridGlobalPulseAngle.current - distNormalized * config.GRID_PULSE_WAVELENGTH_FACTOR) + 1) / 2;
          const nebulaXTerm = gx * config.GRID_NEBULA_X_FREQ;
          const nebulaYTerm = gy * config.GRID_NEBULA_Y_FREQ;
          const nebulaModulation = (Math.sin(nebulaXTerm + timeForNebula) + Math.sin(nebulaYTerm - timeForNebula * 0.7)) / 2;
          const effectivePulseFactor = basePulse * (1 - config.GRID_NEBULA_INTENSITY) + basePulse * config.GRID_NEBULA_INTENSITY * ((nebulaModulation + 1) / 2);
          const finalAlpha = baseDistanceAlpha * lerp(config.GRID_MIN_PULSE_ALPHA_MODULATION, 1, effectivePulseFactor) * (gridHighlightActualA / gridBaseInitialAlpha);
          if (finalAlpha > 0.005) {
            visiblePoints.set(`${gx},${gy}`, { x: gx, y: gy, alpha: Math.min(finalAlpha, gridHighlightActualA), pulseFactor: effectivePulseFactor, distNormalized });
          }
        }
      }
    }
    visiblePoints.forEach((pointP) => {
      const { x: px, y: py, alpha: pAlpha, pulseFactor: pPulse, distNormalized: pDistNorm } = pointP;
      [[cellSize, 0], [0, cellSize]].forEach(([offsetX, offsetY]) => {
        const keyNeighbor = `${px + offsetX},${py + offsetY}`;
        if (visiblePoints.has(keyNeighbor)) {
          const pointNeighbor = visiblePoints.get(keyNeighbor)!;
          const avgAlpha = (pAlpha + pointNeighbor.alpha) / 2;
          const avgPulse = (pPulse + pointNeighbor.pulseFactor) / 2;
          const avgDistNorm = (pDistNorm + pointNeighbor.distNormalized) / 2;
          if (avgAlpha > 0.005) {
            const L = lerp(gridBaseL, gridHighlightL, (1 - avgDistNorm) * avgPulse);
            ctx.beginPath(); ctx.moveTo(px, py);
            ctx.lineTo(pointNeighbor.x, pointNeighbor.y);
            ctx.lineWidth = lerp(config.GRID_LINE_WIDTH_BASE, config.GRID_LINE_WIDTH_PULSE_MAX, avgPulse) * Math.pow(1 - avgDistNorm, 0.7);
            ctx.strokeStyle = getHarmonizedHsla(currentGridHue, 0, gridBaseS, L, avgAlpha);
            ctx.stroke();
          }
        }
      });
    });
  }, [config, cellSize, masterHue, animationTime]);

  const animate = useCallback((ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas || canvasCssHeightRef.current === 0) {
        animationFrameId.current = requestAnimationFrame(() => animate(ctx));
        return;
    }
    const currentCssWidth = gridWidth; 
    const currentCssHeight = canvasCssHeightRef.current;

    animationTime.current += 0.016; 

    ctx.fillStyle = config.BASE_BACKGROUND_COLOR;
    ctx.fillRect(0, 0, currentCssWidth, currentCssHeight);

    masterHue.current = (masterHue.current + config.MASTER_HUE_CYCLE_SPEED);
    if (masterHue.current >= 360) masterHue.current -= 360;
    if (masterHue.current < 0) masterHue.current += 360;

    // Draw Nebulas
    ctx.globalCompositeOperation = config.NEBULA_COMPOSITE_OPERATION as GlobalCompositeOperation; 
    nebulaClouds.current.forEach(cloud => {
      cloud.x += cloud.driftXFactor * currentCssWidth * 0.01; 
      cloud.y += cloud.driftYFactor * currentCssHeight * 0.01;
      const visualRadiusX = cloud.radiusX * 1.5; 
      const visualRadiusY = cloud.radiusY * 1.5;
      if (cloud.x - visualRadiusX > currentCssWidth) cloud.x = -visualRadiusX;
      if (cloud.x + visualRadiusX < 0) cloud.x = currentCssWidth + visualRadiusX;
      if (cloud.y - visualRadiusY > currentCssHeight) cloud.y = -visualRadiusY;
      if (cloud.y + visualRadiusY < 0) cloud.y = currentCssHeight + visualRadiusY;
      const time = animationTime.current;
      const sizePulse = (Math.sin(time * cloud.sizePulseSpeed + cloud.timeOffsetSize) + 1) / 2; 
      const currentSizeFactor = 1 + (sizePulse * config.NEBULA_PULSE_AMPLITUDE_SIZE - config.NEBULA_PULSE_AMPLITUDE_SIZE / 2);
      const opacityPulse = (Math.sin(time * cloud.opacityPulseSpeed + cloud.timeOffsetOpacity) + 1) / 2; 
      const currentOpacityFactor = 1 + (opacityPulse * config.NEBULA_PULSE_AMPLITUDE_OPACITY - config.NEBULA_PULSE_AMPLITUDE_OPACITY / 2);
      const finalOpacity = cloud.baseOpacity * currentOpacityFactor;
      if (finalOpacity < 0.005) return;
      const hueWave = Math.sin(time * cloud.hueOscillationSpeed + cloud.timeOffsetHue);
      const dynamicHueOffset = cloud.baseHueOffset + hueWave * cloud.hueOscillationAmplitude;
      const luminosityWave = (Math.sin(time * cloud.luminosityPulseSpeed + cloud.timeOffsetLuminosity) + 1) / 2;
      const luminosityMultiplier = 1 + (luminosityWave * cloud.luminosityPulseAmplitude - cloud.luminosityPulseAmplitude / 2);
      const currentLuminosityInner = cloud.luminosityInner * luminosityMultiplier;
      const currentLuminosityOuter = cloud.luminosityOuter * luminosityMultiplier;
      const cloudGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(cloud.radiusX, cloud.radiusY) * currentSizeFactor);
      const colorCore = getHarmonizedHsla(masterHue.current, dynamicHueOffset, cloud.saturation, currentLuminosityInner, finalOpacity, true);
      const colorMid = getHarmonizedHsla(masterHue.current, dynamicHueOffset + 10, cloud.saturation * 0.85, (currentLuminosityInner + currentLuminosityOuter) / 2.5, finalOpacity * 0.60, true);
      const colorOuter = getHarmonizedHsla(masterHue.current, dynamicHueOffset - 5, cloud.saturation * 0.9, currentLuminosityOuter * 0.8, finalOpacity * 0.25, true);
      const colorEdge = getHarmonizedHsla(masterHue.current, dynamicHueOffset, cloud.saturation * 0.9, currentLuminosityOuter, 0, true);
      cloudGrad.addColorStop(0, colorCore); cloudGrad.addColorStop(0.35, colorMid); 
      cloudGrad.addColorStop(0.75, colorOuter); cloudGrad.addColorStop(1, colorEdge);
      ctx.save();
      ctx.translate(cloud.x + cloud.initialOffsetX, cloud.y + cloud.initialOffsetY);
      ctx.rotate(cloud.angle + Math.sin(time * 0.0005 + cloud.id) * 0.05 * (cloud.id % 2 === 0 ? 1 : -1) );
      ctx.scale(currentSizeFactor, currentSizeFactor * (cloud.radiusY / cloud.radiusX)); 
      ctx.beginPath(); ctx.arc(0,0, cloud.radiusX, 0, TWO_PI);
      ctx.fillStyle = cloudGrad; ctx.fill();
      ctx.restore();
    });
    ctx.globalCompositeOperation = 'source-over'; 

    // Draw Cosmic Dust
    cosmicDustParticles.current.forEach(dust => {
      dust.x += dust.vx; dust.y += dust.vy;
      if (dust.x > currentCssWidth + dust.radius) dust.x = -dust.radius; else if (dust.x < -dust.radius) dust.x = currentCssWidth + dust.radius;
      if (dust.y > currentCssHeight + dust.radius) dust.y = -dust.radius; else if (dust.y < -dust.radius) dust.y = currentCssHeight + dust.radius;
      const twinkle = (Math.sin(animationTime.current * 0.3 + dust.id) + 1) / 2 * 0.5 + 0.5;
      ctx.fillStyle = getHarmonizedHsla(masterHue.current, dust.hueOffset, config.COSMIC_DUST_BASE_SATURATION, config.COSMIC_DUST_BASE_LIGHTNESS, dust.baseAlpha * twinkle, true);
      ctx.beginPath(); ctx.arc(dust.x, dust.y, dust.radius, 0, TWO_PI); ctx.fill();
    });

    // New: Update and Draw Stardust Trails
    stardustParticles.current = stardustParticles.current.filter(sd => {
        sd.life--;
        if (sd.life <= 0) return false;
        sd.x += sd.vx;
        sd.y += sd.vy;
        const lifeRatio = sd.life / sd.initialLife;
        const currentAlpha = sd.baseAlpha * lifeRatio; // Fade out
        if (currentAlpha < 0.01) return false;

        // Optional: slightly reduce radius over time
        // sd.radius *= (0.98 + lifeRatio * 0.02); 

        ctx.fillStyle = getHarmonizedHsla(
            masterHue.current, 
            sd.hueOffset, 
            sd.saturation, 
            sd.lightness, 
            currentAlpha,
            true
        );
        ctx.beginPath();
        ctx.arc(sd.x, sd.y, sd.radius * lifeRatio, 0, TWO_PI); // Radius can also shrink
        ctx.fill();
        return true;
    });


    drawRevealedGrid(ctx);

    clickEffects.current = clickEffects.current.filter(effect => { effect.life--; return effect.life > 0; });

    particlesArray.current.forEach(p => p.connectionCount = 0);
    const [, lineBaseS, lineBaseL, lineBaseA] = parseHsla(config.LINE_BASE_COLOR_STR);
    const [, , lineHighlightL, lineHighlightA] = parseHsla(config.LINE_HIGHLIGHT_COLOR_STR);
    const currentLineHue = (masterHue.current + 10) % 360;

    for (let i = 0; i < particlesArray.current.length; i++) {
      for (let j = i + 1; j < particlesArray.current.length; j++) {
        const p1 = particlesArray.current[i]; const p2 = particlesArray.current[j];
        const dx = p1.x - p2.x; const dy = p1.y - p2.y; 
        const distSq = dx * dx + dy * dy;
        if (distSq < config.CONNECT_DISTANCE_SQUARED) {
          const dist = Math.sqrt(distSq);
          p1.connectionCount++; p2.connectionCount++;
          const intensity = Math.max(p1.highlightIntensity, p2.highlightIntensity);
          const L = lerp(lineBaseL, lineHighlightL, intensity);
          const A = lerp(lineBaseA, lineHighlightA, intensity) * Math.pow(1 - (dist / config.CONNECT_DISTANCE), 2);
          if (A < 0.01) continue;
          ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = getHarmonizedHsla(currentLineHue, 0, lineBaseS, L, A);
          ctx.lineWidth = lerp(0.2, 0.8, intensity) * (0.6 + (1 - dist / config.CONNECT_DISTANCE) * 0.4);
          ctx.stroke();
        }
      }
    }
    
    particlesArray.current.forEach(p => {
      clickEffects.current.forEach(effect => {
        const dx = p.x - effect.x; const dy = p.y - effect.y; 
        const distSq = dx * dx + dy * dy;
        if (distSq < effect.maxRadius * effect.maxRadius && distSq > 0.001) { // Ensure distSq is not zero
            const dist = Math.sqrt(distSq);
            const clampedDist = Math.max(dist, config.MIN_CLICK_INTERACTION_DISTANCE); // Min distance for force calc

            const forceMagnitude = (1 - dist / effect.maxRadius) * (effect.strength / clampedDist) * (effect.life / config.CLICK_EFFECT_DURATION);
            
            const forceX = (dx / dist) * forceMagnitude;
            const forceY = (dy / dist) * forceMagnitude;

            if (effect.type === 'attract') {
                // Attract: pull towards the effect center (reverse direction)
                // Adjust strength if needed, attraction can be more sensitive
                p.vx -= forceX * 0.03; 
                p.vy -= forceY * 0.03;
            } else { // Repel
                p.vx += forceX * 0.03; 
                p.vy += forceY * 0.03;
            }
        }
      });

      let targetHI = 0; p.targetRadius = p.radius;
      if (mousePosition.current.x !== null && mousePosition.current.y !== null) {
        const dxM = p.x - mousePosition.current.x; 
        const dyM = p.y - mousePosition.current.y; 
        const distMSq = dxM * dxM + dyM * dyM;
        if (distMSq < config.MOUSE_INTERACTION_RADIUS * config.MOUSE_INTERACTION_RADIUS) {
            const distM = Math.sqrt(distMSq);
            targetHI = 1 - (distM / config.MOUSE_INTERACTION_RADIUS);
            p.targetRadius = p.radius * (1 + (config.MOUSE_RADIUS_MULTIPLIER - 1) * targetHI);
            if (distM < p.currentRadius * 1.5 && distM > 0.1) {
                const push = (1 - distM / (config.MOUSE_INTERACTION_RADIUS * 0.7)) * 0.02;
                p.vx += (dxM / distM) * push; p.vy += (dyM / distM) * push;
            }
        }
      }
      p.highlightIntensity = lerp(p.highlightIntensity, targetHI, config.HIGHLIGHT_FADE_SPEED);
      p.currentRadius = lerp(p.currentRadius, p.targetRadius, config.RADIUS_LERP_SPEED);
      
      p.vx = lerp(p.vx, p.originalVx, config.PARTICLE_RETURN_LERP_AMOUNT);
      p.vy = lerp(p.vy, p.originalVy, config.PARTICLE_RETURN_LERP_AMOUNT);

      p.x += p.vx; p.y += p.vy;
      
      if (p.x + p.currentRadius > currentCssWidth) { p.vx *= -1; p.originalVx *= -1; p.x = currentCssWidth - p.currentRadius; } 
      else if (p.x - p.currentRadius < 0) { p.vx *= -1; p.originalVx *= -1; p.x = p.currentRadius; }
      if (p.y + p.currentRadius > currentCssHeight) { p.vy *= -1; p.originalVy *= -1; p.y = currentCssHeight - p.currentRadius; } 
      else if (p.y - p.currentRadius < 0) { p.vy *= -1; p.originalVy *= -1; p.y = p.currentRadius; }
      
      p.pulseAngle = (p.pulseAngle + p.pulseSpeed) % TWO_PI;
      const pulseF = (Math.sin(p.pulseAngle) + 1) / 2;
      let dRadius = p.currentRadius + pulseF * p.pulseAmplitude * (p.currentRadius / p.radius) + Math.min(p.connectionCount * config.CONNECTION_RADIUS_BONUS, config.MAX_CONNECTION_BONUS_RADIUS);
      dRadius = Math.max(config.MIN_RADIUS * 0.3, dRadius);
      const L = lerp(p.baseColorL, p.highlightColorL, p.highlightIntensity);
      const A = lerp(p.baseColorA, p.highlightColorA, p.highlightIntensity) * (0.55 + pulseF * 0.45);
      ctx.beginPath(); ctx.arc(p.x, p.y, dRadius, 0, TWO_PI);
      ctx.fillStyle = getHarmonizedHsla(masterHue.current, p.hueOffset, p.baseColorS, L, A, true);
      ctx.fill();
    });

    animationFrameId.current = requestAnimationFrame(() => animate(ctx));
  }, [config, drawRevealedGrid, gridWidth]); 

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true }); 
    if (!ctx) return;

    const resizeCanvas = () => {
      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect(); 
        const cssWidth = gridWidth; 
        const cssHeight = rect.height; 
        canvasCssHeightRef.current = cssHeight;
        canvas.width = cssWidth * dpr; 
        canvas.height = cssHeight * dpr;
        ctx.resetTransform(); 
        ctx.scale(dpr, dpr); 
        initParticles(); initCosmicDust(); initNebulaClouds(); 
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      const scrollContainer = canvasRef.current?.parentElement?.parentElement;
      if (!scrollContainer || !canvasRef.current) return;
      const scrollContainerRect = scrollContainer.getBoundingClientRect();
      
      const currentMouseX = (event.clientX - scrollContainerRect.left) + scrollContainer.scrollLeft;
      const currentMouseY = (event.clientY - scrollContainerRect.top) + scrollContainer.scrollTop;
      mousePosition.current = { x: currentMouseX, y: currentMouseY };

      // New: Create stardust particles
      for (let i = 0; i < config.STARDUST_PARTICLE_COUNT_ON_MOVE; i++) {
          const angle = Math.random() * TWO_PI;
          const speed = Math.random() * (config.STARDUST_SPEED_FACTOR_MAX - config.STARDUST_SPEED_FACTOR_MIN) + config.STARDUST_SPEED_FACTOR_MIN;
          stardustParticles.current.push({
              id: stardustIdCounter.current++,
              x: currentMouseX,
              y: currentMouseY,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              radius: Math.random() * (config.STARDUST_MAX_RADIUS - config.STARDUST_MIN_RADIUS) + config.STARDUST_MIN_RADIUS,
              life: config.STARDUST_LIFESPAN,
              initialLife: config.STARDUST_LIFESPAN,
              hueOffset: (Math.random() * config.STARDUST_HUE_SPREAD) - (config.STARDUST_HUE_SPREAD / 2),
              baseAlpha: config.STARDUST_BASE_ALPHA * (0.7 + Math.random() * 0.3),
              saturation: config.STARDUST_SATURATION,
              lightness: config.STARDUST_LIGHTNESS,
          });
      }
      if (stardustParticles.current.length > 200) { // Cap stardust particles
         stardustParticles.current.splice(0, stardustParticles.current.length - 200);
      }
    };

    const handleMouseLeave = () => { mousePosition.current = { x: null, y: null }; };

    const handleMouseDown = (event: MouseEvent) => {
      const scrollContainer = canvasRef.current?.parentElement?.parentElement;
      if (!scrollContainer) return;
      const scrollContainerRect = scrollContainer.getBoundingClientRect();
      
      const clickX = (event.clientX - scrollContainerRect.left) + scrollContainer.scrollLeft;
      const clickY = (event.clientY - scrollContainerRect.top) + scrollContainer.scrollTop;

      if (clickX >= 0 && clickX <= gridWidth && clickY >= 0 && clickY <= canvasCssHeightRef.current) {
        let effectType: 'repel' | 'attract' = 'repel';
        let strength = config.CLICK_REPEL_STRENGTH;

        if (event.button === 2) { // Right click for attraction
          effectType = 'attract';
          strength = config.CLICK_ATTRACT_STRENGTH;
          event.preventDefault(); // Prevent context menu
        }
        
        clickEffects.current.push({ 
            x: clickX, y: clickY, 
            strength: strength, 
            maxRadius: config.CLICK_EFFECT_RADIUS, 
            life: config.CLICK_EFFECT_DURATION,
            type: effectType 
        });
      }
    };

    resizeCanvas(); 
    window.addEventListener('resize', resizeCanvas); 
    
    const scrollContainerForEvents = canvas.parentElement?.parentElement; 
    if (scrollContainerForEvents) {
        scrollContainerForEvents.addEventListener('mousemove', handleMouseMove as EventListener);
        scrollContainerForEvents.addEventListener('mousedown', handleMouseDown as EventListener); // This will now handle left and right clicks
        scrollContainerForEvents.addEventListener('mouseleave', handleMouseLeave);
        scrollContainerForEvents.addEventListener('contextmenu', e => e.preventDefault()); // Ensure context menu is always prevented on canvas parent
    }

    if (!animationFrameId.current) {
      animationFrameId.current = requestAnimationFrame(() => animate(ctx));
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (scrollContainerForEvents) {
        scrollContainerForEvents.removeEventListener('mousemove', handleMouseMove as EventListener);
        scrollContainerForEvents.removeEventListener('mousedown', handleMouseDown as EventListener);
        scrollContainerForEvents.removeEventListener('mouseleave', handleMouseLeave);
        scrollContainerForEvents.removeEventListener('contextmenu', e => e.preventDefault());
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [initParticles, initCosmicDust, initNebulaClouds, animate, config, cellSize, gridWidth]); 

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full" 
      style={{ zIndex: -1 }} 
    ></canvas>
  );
};

export default GridBackground;