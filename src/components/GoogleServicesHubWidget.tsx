// src/components/GoogleServicesHubWidget.tsx
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';

// --- Interfaces & Types ---
export interface GoogleServicesHubWidgetSettings {
  animationSpeed?: 'slow' | 'normal' | 'fast';
  iconSize?: 'small' | 'medium' | 'large';
  menuRadius?: number; // Custom radius in pixels
}

interface GoogleServiceItem {
  id: string;
  name: string;
  icon: React.FC<{ className?: string; color?: string }>;
  color: string; // Base color for the service
  actionKey: GoogleServiceActionKey;
}

export type GoogleServiceActionKey =
  | 'gmail'
  | 'photos'
  | 'keep'
  | 'calendar'
  | 'maps'
  | 'drive'
  | 'meet';

interface GoogleServicesHubWidgetProps {
  settings?: GoogleServicesHubWidgetSettings;
  onRequestClose?: () => void; // To be called when the widget should close itself (e.g., after selection)
  onSelectService?: (serviceKey: GoogleServiceActionKey) => void;
  // isActive prop to determine if the widget is the current "focused" widget on the dashboard
  // This would typically be managed by the parent page/component.
  // For this rebuild, we'll assume if the component is rendered, it's meant to be 'active'
  // and the menu should be open. A more robust implementation would use a prop.
  // For now, we'll use an internal state that defaults to open.
}

// --- Placeholder Icons ---
// Using the provided icons, ensuring they are flexible with className and color
const PlaceholderGmailIcon = ({ className = "w-8 h-8", color }: { className?: string; color?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill={color || "currentColor"} xmlns="http://www.w3.org/2000/svg">
    <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z"/>
  </svg>
);
const PlaceholderPhotosIcon = ({ className = "w-8 h-8", color }: { className?: string; color?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill={color || "currentColor"} xmlns="http://www.w3.org/2000/svg">
    <path d="M21.99 4C21.99 2.9 21.1 2 20 2H4C2.9 2 2 2.9 2 4V20C2 21.1 2.9 22 4 22H20C21.1 22 21.99 21.1 21.99 20L22 4ZM11.25 16.5L9 13.73L6 17.5H18L14.25 12.75L11.25 16.5Z"/>
  </svg>
);
const PlaceholderKeepIcon = ({ className = "w-8 h-8", color }: { className?: string; color?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill={color || "currentColor"} xmlns="http://www.w3.org/2000/svg">
    <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM10 17H7V15H10V17ZM10 13H7V11H10V13ZM10 9H7V7H10V9ZM14.5 17H11.5V15H14.5V17ZM14.5 13H11.5V11H14.5V13ZM14.5 9H11.5V7H14.5V9ZM17 17H15V7H17V17Z"/>
  </svg>
);
const PlaceholderCalendarIcon = ({ className = "w-8 h-8", color }: { className?: string; color?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill={color || "currentColor"} xmlns="http://www.w3.org/2000/svg">
    <path d="M19 4H18V2H16V4H8V2H6V4H5C3.89 4 3.01 4.89 3.01 6L3 20C3 21.11 3.89 22 5 22H19C20.11 22 21 21.11 21 20V6C21 4.89 20.11 4 19 4ZM19 20H5V10H19V20ZM19 8H5V6H19V8ZM12 13H7V18H12V13Z"/>
  </svg>
);
const PlaceholderMapsIcon = ({ className = "w-8 h-8", color }: { className?: string; color?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill={color || "currentColor"} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C8.13 2 5 5.13 5 9C0 16.25 12 22 12 22C12 22 19 16.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z"/>
  </svg>
);
const PlaceholderDriveIcon = ({ className = "w-8 h-8", color }: { className?: string; color?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill={color || "currentColor"} xmlns="http://www.w3.org/2000/svg">
    <path d="M7.71 3.5L1.5 15L7.44 15L12.03 6.51L7.71 3.5ZM8.56 15.5H15.43L19.5 8.5L12.37 8.5L8.56 15.5ZM16.29 3.5L11.97 6.51L16.56 15L22.5 15L16.29 3.5Z"/>
  </svg>
);
const PlaceholderMeetIcon = ({ className = "w-8 h-8", color }: { className?: string; color?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill={color || "currentColor"} xmlns="http://www.w3.org/2000/svg">
    <path d="M17 10.5V7C17 6.45 16.55 6 16 6H4C3.45 6 3 6.45 3 7V17C3 17.55 3.45 18 4 18H16C16.55 18 17 17.55 17 17V13.5L21 17.5V6.5L17 10.5ZM14 13H11V10H9V13H6V15H9V18H11V15H14V13Z"/>
  </svg>
);

// --- Central Orb Component ---
const CentralOrb = ({ onClick, isMenuOpen, colorSpectrum }: { onClick?: () => void, isMenuOpen: boolean, colorSpectrum: string[] }) => {
  const [orbColorIndex, setOrbColorIndex] = useState(0);

  useEffect(() => {
    if (!isMenuOpen || colorSpectrum.length === 0) return;
    const interval = setInterval(() => {
      setOrbColorIndex(prev => (prev + 1) % colorSpectrum.length);
    }, 2000); // Change color every 2 seconds
    return () => clearInterval(interval);
  }, [isMenuOpen, colorSpectrum]);
  
  const currentColor = colorSpectrum[orbColorIndex] || '#FFFFFF'; // Fallback color

  return (
    <button
      onClick={onClick}
      className={`relative z-20 w-20 h-20 md:w-24 md:h-24 rounded-full shadow-2xl
                  transition-all duration-500 ease-bounce
                  focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-slate-950`}
      style={{ 
        backgroundColor: currentColor,
        boxShadow: `0 0 25px 8px ${currentColor}50, 0 0 10px 2px ${currentColor}30 inset`,
        transform: isMenuOpen ? 'scale(1)' : 'scale(0.8)',
        // Ring color should also transition or be tied to currentColor
        // For simplicity, using a generic focus ring color here, but could be dynamic
        '--tw-ring-color': `${currentColor}99` 
      } as React.CSSProperties}
      aria-label={isMenuOpen ? "Close services menu" : "Open services menu"}
    >
      <div className="absolute inset-0 animate-pulse-slow opacity-50">
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <circle cx="40" cy="40" r="38" strokeWidth="1.5" fill="none"
            className="stroke-current text-white/30 transition-colors duration-1000"
          />
        </svg>
      </div>
      <div className="absolute inset-1 animate-slow-spin">
         <svg viewBox="0 0 80 80" className="w-full h-full">
          <circle cx="40" cy="40" r="30" strokeDasharray="10 15" strokeWidth="1" fill="none"
            className="stroke-current text-white/20 transition-colors duration-1000"
          />
        </svg>
      </div>
       <span className="text-slate-900 font-bold text-3xl mix-blend-multiply">G</span>
    </button>
  );
};


// --- Main GoogleServicesHubWidget Component ---
const GoogleServicesHubWidget: React.FC<GoogleServicesHubWidgetProps> = ({
  settings,
  onRequestClose,
  onSelectService,
}) => {
  // Assume menu is open by default when widget is active/rendered
  const [isMenuOpen, setIsMenuOpen] = useState(true); 
  const [isClosingWidget, setIsClosingWidget] = useState(false);
  const [clickedServiceKey, setClickedServiceKey] = useState<GoogleServiceActionKey | null>(null);

  const animationSpeedSetting = settings?.animationSpeed || 'normal';
  const iconSizeSetting = settings?.iconSize || 'medium';
  const customRadius = settings?.menuRadius; // User-defined radius

  const widgetRef = useRef<HTMLDivElement>(null);

  const services: GoogleServiceItem[] = useMemo(() => [
    { id: 'gmail', name: 'Gmail', icon: PlaceholderGmailIcon, color: '#EA4335', actionKey: 'gmail' },
    { id: 'photos', name: 'Photos', icon: PlaceholderPhotosIcon, color: '#FBBC05', actionKey: 'photos' },
    { id: 'keep', name: 'Keep', icon: PlaceholderKeepIcon, color: '#F4B400', actionKey: 'keep' },
    { id: 'calendar', name: 'Calendar', icon: PlaceholderCalendarIcon, color: '#34A853', actionKey: 'calendar' },
    { id: 'maps', name: 'Maps', icon: PlaceholderMapsIcon, color: '#4285F4', actionKey: 'maps' },
    { id: 'drive', name: 'Drive', icon: PlaceholderDriveIcon, color: '#1AA260', actionKey: 'drive' },
    { id: 'meet', name: 'Meet', icon: PlaceholderMeetIcon, color: '#00897B', actionKey: 'meet' },
  ], []);

  const colorSpectrum = useMemo(() => services.map(s => s.color), [services]);


  const getAnimationTimings = (speed: string) => {
    switch (speed) {
      case 'fast': return { base: 250, stagger: 30, outroBase: 200, outroStagger: 25, title: 300 };
      case 'slow': return { base: 700, stagger: 120, outroBase: 600, outroStagger: 100, title: 600 };
      default:   return { base: 450, stagger: 65, outroBase: 350, outroStagger: 50, title: 450 };
    }
  };
  const animTimings = getAnimationTimings(animationSpeedSetting);

  const getIconDimensions = (sizeSetting: string) => {
    switch (sizeSetting) {
      case 'small': return { button: 'w-14 h-14 md:w-16 md:h-16', icon: 'w-6 h-6 md:w-7 md:h-7' };
      case 'large': return { button: 'w-20 h-20 md:w-24 md:h-24', icon: 'w-10 h-10 md:w-12 md:h-12' };
      default:      return { button: 'w-16 h-16 md:w-20 md:h-20', icon: 'w-8 h-8 md:w-10 md:h-10' }; // medium
    }
  };
  const iconDimensions = getIconDimensions(iconSizeSetting);

  const [dynamicRadius, setDynamicRadius] = useState(120); // Default radius

  useEffect(() => {
    if (widgetRef.current) {
      const { offsetWidth, offsetHeight } = widgetRef.current;
      const baseVal = Math.min(offsetWidth, offsetHeight);
      // Adjust radius: make it larger, ensure it's responsive but with a sensible min/max
      // Target roughly 38-42% of the smaller dimension for icon orbit.
      const newRadius = customRadius !== undefined && customRadius > 50 ? customRadius : Math.max(100, Math.min(baseVal * 0.40, 220));
      setDynamicRadius(newRadius);
    }
  }, [customRadius, isMenuOpen]); // Recalculate if menu opens or customRadius changes


  const handleServiceClick = (serviceKey: GoogleServiceActionKey) => {
    if (isClosingWidget) return;

    setClickedServiceKey(serviceKey);
    setIsClosingWidget(true); // Start closing animation for all items

    if (onSelectService) {
      setTimeout(() => onSelectService(serviceKey), animTimings.outroBase * 0.5); // Select slightly before full close
    }

    if (onRequestClose) {
      const totalOutroTime = animTimings.outroBase + (services.length * animTimings.outroStagger) + 200; // Buffer
      setTimeout(onRequestClose, totalOutroTime);
    }
  };
  
  const toggleMenu = () => {
    if (isClosingWidget) return;
    // If menu is currently open and we toggle, it means we start the closing sequence for icons
    if (isMenuOpen) {
      setIsClosingWidget(true); // This will trigger icons to animate out
      // After icons are out, actually set menu to closed (or trigger widget close)
      const totalOutroTime = animTimings.outroBase + (services.length * animTimings.outroStagger);
      setTimeout(() => {
        setIsMenuOpen(false);
        setIsClosingWidget(false); // Reset closing state
         if (onRequestClose) onRequestClose(); // If toggling closed means closing widget
      }, totalOutroTime);
    } else {
      setIsMenuOpen(true); // This will trigger icons to animate in
    }
  };


  const numServices = services.length;
  const angleRange = 300; // Wider arc for more spacing
  const startAngle = -90 - (angleRange / 2); 
  const angleStep = numServices > 1 ? angleRange / (numServices - 1) : 0;

  // Entry animation for the widget itself
  const [widgetHasEntered, setWidgetHasEntered] = useState(false);
  useEffect(() => {
    const entryTimer = setTimeout(() => setWidgetHasEntered(true), 50);
    return () => clearTimeout(entryTimer);
  }, []);


  return (
    <div
      ref={widgetRef}
      className={`w-full h-full flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-lg text-slate-100 overflow-hidden p-4 md:p-6 relative transition-all duration-700 ease-out ${widgetHasEntered && !isClosingWidget ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
      aria-modal="true"
      role="dialog"
      aria-labelledby="google-services-hub-title-reborn"
    >
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div
            key={`nebula-bg-${i}`}
            className="absolute rounded-full animate-pulse-slow-reborn filter blur-3xl"
            style={{
              width: `${40 + i * 20}%`,
              height: `${40 + i * 20}%`,
              left: `${10 + i * 15}%`,
              top: `${15 + i * 10}%`,
              backgroundColor: colorSpectrum[(i * 2) % colorSpectrum.length] || '#334155', // Use service colors
              animationDuration: `${12 + i * 4}s`,
              animationDelay: `${i * 1.5}s`,
              opacity: 0.08 + (i*0.02) // Subtle opacity
            }}
          />
        ))}
        {/* Faint Grid Overlay */}
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 opacity-[0.04]">
            <defs>
                <pattern id="rebornGrid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(200,220,255,0.5)" strokeWidth="0.5"/>
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#rebornGrid)" />
        </svg>
      </div>

      {/* Title (Optional, as menu is primary) - Kept subtle if orb is main focus */}
      <div className={`absolute top-8 md:top-12 text-center transition-all duration-500 ease-out ${isMenuOpen && !isClosingWidget ? 'opacity-70 translate-y-0' : 'opacity-0 -translate-y-5'}`} style={{transitionDelay: `${animTimings.title * 0.5}ms`}}>
        <h2 id="google-services-hub-title-reborn" className="text-xl md:text-2xl font-semibold tracking-tight text-slate-200/80">
          Select Service
        </h2>
      </div>
      
      {/* Central Orb & Radial Menu Items Container */}
      <div className="relative flex items-center justify-center mt-10 md:mt-0"> {/* Added margin-top for title space */}
        <CentralOrb onClick={toggleMenu} isMenuOpen={isMenuOpen} colorSpectrum={colorSpectrum} />

        {/* Service Icons */}
        {services.map((service, index) => {
          const angle = startAngle + (index * angleStep);
          const x = dynamicRadius * Math.cos(angle * Math.PI / 180);
          const y = dynamicRadius * Math.sin(angle * Math.PI / 180);

          const itemVisible = isMenuOpen && !isClosingWidget;
          const isThisClicked = clickedServiceKey === service.actionKey && isClosingWidget;

          let transformStyle = 'translate(0px, 0px) scale(0.5)'; // Start from center, scaled down
          let opacityStyle = 0;
          let transitionDelayMs = 0;
          let currentTransitionDuration = animTimings.base;
          let zIndex = 10;

          if (itemVisible) {
            transformStyle = `translate(${x}px, ${y}px) scale(1) rotate(0deg)`;
            opacityStyle = 1;
            transitionDelayMs = index * animTimings.stagger;
          } else if (isClosingWidget) { // If closing menu OR widget
            if (isThisClicked) { // Clicked item animates differently
              transformStyle = `translate(0px, 0px) scale(1.5)`; // Expand towards center
              opacityStyle = 0;
              currentTransitionDuration = animTimings.outroBase + 100;
              zIndex = 30; // Ensure clicked is on top
            } else { // Non-clicked items fly back to center
              transformStyle = 'translate(0px, 0px) scale(0) rotate(-30deg)';
              opacityStyle = 0;
            }
            transitionDelayMs = (services.length - 1 - index) * animTimings.outroStagger * 0.7;
            currentTransitionDuration = isThisClicked ? animTimings.outroBase + 100 : animTimings.outroBase * 0.8;
          }
          
          return (
            <button
              key={service.id}
              onClick={() => handleServiceClick(service.actionKey)}
              className={`group absolute flex flex-col items-center justify-center rounded-full shadow-2xl
                          border-2 border-transparent backdrop-blur-md
                          transition-all ease-bounce pointer-events-auto
                          focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-slate-950 ${iconDimensions.button}`}
              style={{
                '--service-color': service.color,
                transform: transformStyle,
                opacity: opacityStyle,
                zIndex: zIndex,
                transitionDuration: `${currentTransitionDuration}ms`,
                transitionProperty: 'transform, opacity, box-shadow, border-color, background-color',
                transitionDelay: `${transitionDelayMs}ms`,
                backgroundColor: `rgba(51, 65, 85, 0.6)`, // slate-700 with alpha
                '--tw-ring-color': `${service.color}99`, // For focus ring
              } as React.CSSProperties}
              onMouseEnter={(e) => { 
                  if (isClosingWidget || !isMenuOpen) return;
                  e.currentTarget.style.borderColor = service.color;
                  e.currentTarget.style.boxShadow = `0 0 30px 7px ${service.color}60, 0 0 10px 1px ${service.color}40 inset`;
                  e.currentTarget.style.transform = `translate(${x}px, ${y}px) scale(1.22)`; // More pronounced hover
              }}
              onMouseLeave={(e) => { 
                  if (isClosingWidget || !isMenuOpen) return;
                  e.currentTarget.style.borderColor = `transparent`;
                  e.currentTarget.style.boxShadow = `none`;
                  e.currentTarget.style.transform = `translate(${x}px, ${y}px) scale(1)`;
              }}
              aria-label={`Open ${service.name}`}
              disabled={isClosingWidget || !isMenuOpen}
            >
              <div className={`p-2 rounded-full transition-all duration-200 ease-out`} style={{ backgroundColor: `${service.color}33`}}>
                <service.icon
                  className={`${iconDimensions.icon} transition-transform duration-200 group-hover:scale-110`}
                  color={service.color}
                />
              </div>
              <span 
                  className={`absolute -bottom-7 text-xs font-semibold text-slate-100 p-1 px-2 bg-slate-800/80 rounded-md shadow-lg
                             opacity-0 group-hover:opacity-100 group-focus:opacity-100 
                             transform translate-y-1 group-hover:translate-y-0 group-focus:translate-y-0
                             transition-all duration-200 ease-out delay-100 pointer-events-none`}
              >
                  {service.name}
              </span>
            </button>
          );
        })}
      </div>

      <style jsx global>{`
        @keyframes pulse-slow-reborn {
          0%, 100% { transform: scale(0.95) rotate(0deg); opacity: var(--start-opacity, 0.08); }
          50% { transform: scale(1.05) rotate(7deg); opacity: var(--end-opacity, 0.12); }
        }
        .animate-pulse-slow-reborn {
          animation: pulse-slow-reborn infinite ease-in-out alternate;
        }
        .ease-bounce { transition-timing-function: cubic-bezier(0.68, -0.6, 0.32, 1.6); } /* Bouncy effect */

        @keyframes slow-spin { /* For CentralOrb inner rings */
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-slow-spin { animation: slow-spin 30s linear infinite; }
      `}</style>
    </div>
  );
};

// --- Settings Panel ---
export const GoogleServicesHubSettingsPanel: React.FC<{
  widgetId: string;
  currentSettings: GoogleServicesHubWidgetSettings | undefined;
  onSave: (newSettings: GoogleServicesHubWidgetSettings) => void;
}> = ({ currentSettings, onSave }) => {
  const [animationSpeed, setAnimationSpeed] = useState(currentSettings?.animationSpeed || 'normal');
  const [iconSize, setIconSize] = useState(currentSettings?.iconSize || 'medium');
  const [menuRadius, setMenuRadius] = useState(currentSettings?.menuRadius || 120); // Default example

  const handleSave = () => {
    onSave({ 
        animationSpeed: animationSpeed as 'slow' | 'normal' | 'fast',
        iconSize: iconSize as 'small' | 'medium' | 'large',
        menuRadius: Number(menuRadius) >= 50 ? Number(menuRadius) : undefined // Only save if valid
    });
  };
  
  return (
    <div className="space-y-6 text-primary p-1">
      <div>
        <h3 className="text-lg font-medium text-primary mb-2">Radial Hub Customization</h3>
        <p className="text-sm text-secondary mb-4">
          Refine the appearance and behavior of the services menu.
        </p>
      </div>
      <div>
        <label htmlFor="hub-animation-speed" className="block text-sm font-medium text-secondary mb-1">
          Animation Speed:
        </label>
        <select
          id="hub-animation-speed"
          value={animationSpeed}
          onChange={(e) => setAnimationSpeed(e.target.value as 'slow' | 'normal' | 'fast')}
          className="mt-1 block w-full px-3 py-2 bg-widget border border-border-interactive rounded-md shadow-sm focus:outline-none focus:ring-accent-primary focus:border-accent-primary sm:text-sm text-primary"
        >
          <option value="slow">Graceful (Slow)</option>
          <option value="normal">Balanced (Normal)</option>
          <option value="fast">Swift (Fast)</option>
        </select>
      </div>
      <div>
        <label htmlFor="hub-icon-size" className="block text-sm font-medium text-secondary mb-1">
          Icon Size:
        </label>
        <select
          id="hub-icon-size"
          value={iconSize}
          onChange={(e) => setIconSize(e.target.value as 'small' | 'medium' | 'large')}
          className="mt-1 block w-full px-3 py-2 bg-widget border border-border-interactive rounded-md shadow-sm focus:outline-none focus:ring-accent-primary focus:border-accent-primary sm:text-sm text-primary"
        >
          <option value="small">Compact</option>
          <option value="medium">Standard (Default)</option>
          <option value="large">Prominent</option>
        </select>
      </div>
      <div>
        <label htmlFor="hub-menu-radius" className="block text-sm font-medium text-secondary mb-1">
          Menu Radius (px, min 50):
        </label>
        <input
          type="number"
          id="hub-menu-radius"
          min="50" max="300" step="10"
          value={menuRadius}
          onChange={(e) => setMenuRadius(parseInt(e.target.value, 10))}
          className="mt-1 block w-full px-3 py-2 bg-widget border border-border-interactive rounded-md shadow-sm focus:outline-none focus:ring-accent-primary focus:border-accent-primary sm:text-sm text-primary"
        />
         <p className="text-xs text-secondary mt-1">Adjusts the spread of the service icons. Effective range ~100-220px.</p>
      </div>
       <button
        onClick={handleSave}
        className="mt-8 w-full px-4 py-2.5 bg-accent-primary text-on-accent font-semibold rounded-lg hover:bg-accent-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary focus:ring-offset-dark-surface transition-colors duration-150 ease-in-out"
      >
        Apply Hub Settings
      </button>
    </div>
  );
};

export default GoogleServicesHubWidget;
