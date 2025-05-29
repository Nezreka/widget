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

interface GoogleServicesHubWidgetProps {
  settings?: GoogleServicesHubWidgetSettings;
  onRequestClose?: () => void;
  onSelectService?: (serviceKey: GoogleServiceActionKey) => void;
}

// --- Placeholder Icons (Unchanged) ---
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


// --- Enhanced Central Orb Component ---
const CentralOrbReimagined = ({ onClick, isMenuOpen, colorSpectrum }: { onClick?: () => void, isMenuOpen: boolean, colorSpectrum: string[] }) => {
  const [orbColor, setOrbColor] = useState(colorSpectrum[0] || '#FFFFFF');
  const orbColorIndexRef = useRef(0);

  useEffect(() => {
    if (!isMenuOpen || colorSpectrum.length === 0) {
      setOrbColor(colorSpectrum[0] || '#FFFFFF');
      return;
    }
    const interval = setInterval(() => {
      orbColorIndexRef.current = (orbColorIndexRef.current + 1) % colorSpectrum.length;
      setOrbColor(colorSpectrum[orbColorIndexRef.current]);
    }, 2500);
    return () => clearInterval(interval);
  }, [isMenuOpen, colorSpectrum]);

  return (
    <button
      onClick={onClick}
      className={`group relative z-20 w-20 h-20 md:w-24 md:h-24 rounded-full shadow-xl
                  transition-all duration-500 ease-out-quint
                  focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-slate-950`}
      style={{ 
        backgroundColor: 'rgba(50, 58, 71, 0.7)',
        boxShadow: isMenuOpen 
          ? `0 0 35px 10px ${orbColor}40, 0 0 15px 5px ${orbColor}20 inset, 0 0 60px -10px #000`
          : `0 0 20px 5px #77779933, 0 0 8px 2px #FFFFFF1A inset`,
        transform: isMenuOpen ? 'scale(1.05)' : 'scale(0.9)',
        '--tw-ring-color': `${orbColor}AA`
      } as React.CSSProperties}
      aria-label={isMenuOpen ? "Close services menu" : "Open services menu"}
    >
      <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${isMenuOpen ? 'opacity-100' : 'opacity-70'}`}>
        <span className="text-4xl md:text-5xl font-bold text-slate-100"
              style={{ textShadow: `0 0 10px ${isMenuOpen ? orbColor : '#FFFFFF'}99, 0 0 20px ${isMenuOpen ? orbColor : '#FFFFFF'}55` }}>
          G
        </span>
      </div>
      <div className="absolute inset-0 animate-orb-pulse opacity-60">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="48" strokeWidth="1" fill="none"
            className="stroke-current transition-colors duration-1000"
            style={{ color: `${orbColor}55`, animationDelay: '0s' }} />
           <circle cx="50" cy="50" r="45" strokeWidth="0.5" fill="none"
            className="stroke-current transition-colors duration-1000"
            style={{ color: `${orbColor}33`, animationDelay: '0.5s' }} />
        </svg>
      </div>
      <div className="absolute inset-0 animate-orb-spin opacity-40">
         <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="42" strokeDasharray="5 10" strokeWidth="0.75" fill="none"
            className="stroke-current transition-colors duration-1000"
             style={{ color: `${orbColor}77` }} />
        </svg>
      </div>
    </button>
  );
};

// --- Main GoogleServicesHubWidget Component ---
const GoogleServicesHubWidget: React.FC<GoogleServicesHubWidgetProps> = ({
  settings,
  onRequestClose,
  onSelectService,
}) => {
  const [isActuallyVisible, setIsActuallyVisible] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(true); 
  const [isClosingWidget, setIsClosingWidget] = useState(false);
  const [isAnimatingMenu, setIsAnimatingMenu] = useState(false);
  const [clickedServiceKey, setClickedServiceKey] = useState<GoogleServiceActionKey | null>(null);

  const animationSpeedSetting = settings?.animationSpeed || 'normal';
  const iconSizeSetting = settings?.iconSize || 'medium';
  const customRadius = settings?.menuRadius;

  const widgetRef = useRef<HTMLDivElement>(null);

  const services: GoogleServiceItem[] = useMemo(() => [
    { id: 'gmail', name: 'Gmail', icon: PlaceholderGmailIcon, color: '#EA4335', actionKey: 'gmail' },
    { id: 'photos', name: 'Photos', icon: PlaceholderPhotosIcon, color: '#FBBC05', actionKey: 'photos' },
    { id: 'keep', name: 'Keep', icon: PlaceholderKeepIcon, color: '#F4B400', actionKey: 'keep' },
    { id: 'calendar', name: 'Calendar', icon: PlaceholderCalendarIcon, color: '#34A853', actionKey: 'calendar' },
    { id: 'maps', name: 'Maps', icon: PlaceholderMapsIcon, color: '#4285F4', actionKey: 'maps' },
  
   
  ], []);

  const colorSpectrum = useMemo(() => services.map(s => s.color), [services]);

  const getAnimationTimings = (speed: string) => {
    switch (speed) {
      case 'fast': return { base: 280, stagger: 35, outroBase: 220, outroStagger: 30, title: 300, widgetEntry: 400, cancelButton: 350 };
      case 'slow': return { base: 750, stagger: 100, outroBase: 650, outroStagger: 80, title: 700, widgetEntry: 800, cancelButton: 700 };
      default:   return { base: 500, stagger: 60, outroBase: 400, outroStagger: 50, title: 500, widgetEntry: 600, cancelButton: 500 };
    }
  };
  const animTimings = getAnimationTimings(animationSpeedSetting);

  const getIconDimensions = (sizeSetting: string) => {
    switch (sizeSetting) {
      case 'small': return { button: 'w-14 h-14 md:w-16 md:h-16', icon: 'w-6 h-6 md:w-7 md:h-7', nameOffset: '-bottom-6 text-xs' };
      case 'large': return { button: 'w-20 h-20 md:w-24 md:h-24', icon: 'w-10 h-10 md:w-12 md:h-12', nameOffset: '-bottom-9 text-sm' };
      default:      return { button: 'w-16 h-16 md:w-20 md:h-20', icon: 'w-8 h-8 md:w-10 md:h-10', nameOffset: '-bottom-8 text-xs md:text-sm' };
    }
  };
  const iconDimensions = getIconDimensions(iconSizeSetting);

  const [dynamicRadius, setDynamicRadius] = useState(130);

  useEffect(() => {
    if (widgetRef.current) {
      const { offsetWidth, offsetHeight } = widgetRef.current;
      const baseVal = Math.min(offsetWidth, offsetHeight);
      const newRadius = customRadius !== undefined && customRadius >= 60 
                        ? customRadius 
                        : Math.max(110, Math.min(baseVal * 0.38, 240));
      setDynamicRadius(newRadius);
    }
  }, [customRadius, isMenuOpen, iconSizeSetting]);

  const commonCloseSequence = () => {
    // This function will handle the visual closing of the widget
    // after icons have animated out (triggered by setting isAnimatingMenu and isMenuOpen to false).
    setIsClosingWidget(true); // Start main widget fade-out
    setTimeout(() => {
      if (onRequestClose) {
        onRequestClose();
      }
      setIsActuallyVisible(false); // Remove from DOM
    }, animTimings.widgetEntry);
  };

  const handleServiceClick = (serviceKey: GoogleServiceActionKey) => {
    if (isAnimatingMenu || isClosingWidget || !isActuallyVisible) return;

    setClickedServiceKey(serviceKey);
    setIsAnimatingMenu(true); 

    const selectedIconAnimationTime = animTimings.outroBase + 150;
    const allIconsOutroTime = animTimings.outroBase + (services.length * animTimings.outroStagger) + 100;

    if (onSelectService) {
      setTimeout(() => onSelectService(serviceKey), selectedIconAnimationTime * 0.5);
    }

    setTimeout(() => {
      // At this point, icons are animating out or have animated out.
      // isMenuOpen will effectively be false due to isAnimatingMenu and clickedServiceKey being set.
      // Now trigger the common close sequence for the widget itself.
      commonCloseSequence();
    }, allIconsOutroTime * 0.7);
  };
  
  const handleCancelSelection = () => {
    if (isAnimatingMenu || isClosingWidget || !isActuallyVisible) return;

    setIsAnimatingMenu(true); // Start icon retraction
    setClickedServiceKey(null); // Ensure no item is treated as "selected" during retraction
    setIsMenuOpen(false); // This, along with isAnimatingMenu, will trigger icons to retract

    const iconRetractTime = animTimings.outroBase + (services.length * animTimings.outroStagger) + 100; // Time for icons to retract

    setTimeout(() => {
      // After icons have retracted
      setIsAnimatingMenu(false); // Reset icon animation flag
      commonCloseSequence(); // Trigger widget fade-out and removal
    }, iconRetractTime);
  };

  const toggleMenu = () => {
    if (isAnimatingMenu || isClosingWidget || !isActuallyVisible) return;

    setIsAnimatingMenu(true);
    if (isMenuOpen) { 
      setClickedServiceKey(null); 
      const iconRetractTime = animTimings.outroBase + (services.length * animTimings.outroStagger);
      
      setTimeout(() => { 
        setIsMenuOpen(false); 
        setIsAnimatingMenu(false); 
        // Note: Clicking the orb only closes the radial menu, not the whole widget.
        // The new cancel button handles full widget dismissal.
      }, iconRetractTime);
    } else { 
      setIsMenuOpen(true);
      setTimeout(() => setIsAnimatingMenu(false), animTimings.base + (services.length * animTimings.stagger));
    }
  };

  const numServices = services.length;
  const angleRange = 320;
  const startAngle = -90 - (angleRange / 2); 
  const angleStep = numServices > 1 ? angleRange / (numServices - 1) : 0;

  const [widgetHasEntered, setWidgetHasEntered] = useState(false);
  useEffect(() => {
    const entryTimer = setTimeout(() => setWidgetHasEntered(true), 50);
    return () => clearTimeout(entryTimer);
  }, []);

  if (!isActuallyVisible) {
    return null;
  }

  return (
    <div
      ref={widgetRef}
      className={`fixed inset-0 w-full h-full flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-xl text-slate-100 overflow-hidden p-4 md:p-6 transition-all ease-out-quint ${widgetHasEntered && !isClosingWidget ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      style={{transitionDuration: `${animTimings.widgetEntry}ms`}}
      aria-modal="true"
      role="dialog"
      aria-labelledby="google-services-hub-title-reimagined"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div
            key={`nebula-bg-reimagined-${i}`}
            className="absolute rounded-full animate-nebula-drift filter blur-3xl"
            style={{
              width: `${30 + i * 25}%`,
              height: `${30 + i * 25}%`,
              left: `${5 + i * 20 - Math.random()*10}%`,
              top: `${10 + i * 15 - Math.random()*10}%`,
              backgroundColor: colorSpectrum[(i * 2 + Math.floor(Math.random()*2)) % colorSpectrum.length] || '#334155',
              animationDuration: `${15 + i * 5 + Math.random()*5}s`,
              animationDelay: `${i * 1.2}s`,
              opacity: 0.05 + (i*0.015)
            }} />
        ))}
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 opacity-[0.03]">
            <defs>
                <pattern id="reimaginedGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(180,200,255,0.4)" strokeWidth="0.3"/>
                     <circle cx="30" cy="30" r="0.5" fill="rgba(180,200,255,0.3)" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#reimaginedGrid)" />
        </svg>
      </div>

      <div 
        className={`absolute top-10 md:top-16 text-center transition-all ease-out-quint`}
        style={{
            opacity: isMenuOpen && !isAnimatingMenu && !isClosingWidget ? 1 : 0,
            transform: isMenuOpen && !isAnimatingMenu && !isClosingWidget ? 'translateY(0)' : 'translateY(-20px)',
            transitionDuration: `${animTimings.title}ms`,
            transitionDelay: `${isMenuOpen ? animTimings.base * 0.2 : 0}ms`
        }}>
        <h2 id="google-services-hub-title-reimagined" className="text-xl md:text-2xl font-medium tracking-wide text-slate-200/90">
          Connect to Service
        </h2>
      </div>
      
      <div className="relative flex flex-col items-center justify-center mt-12 md:mt-8"> {/* Changed to flex-col for cancel button */}
        <CentralOrbReimagined onClick={toggleMenu} isMenuOpen={isMenuOpen} colorSpectrum={colorSpectrum} />

        {services.map((service, index) => {
          const angle = startAngle + (index * angleStep);
          const x = dynamicRadius * Math.cos(angle * Math.PI / 180);
          const y = dynamicRadius * Math.sin(angle * Math.PI / 180);

          // Icon visibility logic:
          // - Show if menu is open AND not animating menu (i.e., stable open state)
          // - OR if menu is closing (isAnimatingMenu=true, isMenuOpen=false) but it's not the clicked item (clickedServiceKey is null or different)
          // - OR if it IS the clicked item that is animating out.
          const itemShouldBeVisibleAndOpen = isMenuOpen && !isAnimatingMenu;
          const isThisClickedAndClosing = clickedServiceKey === service.actionKey && isAnimatingMenu && !isMenuOpen; // Specific to selected item closing


          let transformStyle = 'translate(0px, 0px) scale(0.3) rotate(-45deg)';
          let opacityStyle = 0;
          let transitionDelayMs = 0;
          let currentTransitionDuration = animTimings.base;
          let zIndex = 10;
          let filterStyle = 'blur(5px)';

          if (itemShouldBeVisibleAndOpen) { // Animating IN or stable open
            transformStyle = `translate(${x}px, ${y}px) scale(1) rotate(0deg)`;
            opacityStyle = 1;
            filterStyle = 'blur(0px)';
            transitionDelayMs = index * animTimings.stagger;
            currentTransitionDuration = animTimings.base;
          } else if (isAnimatingMenu && !isMenuOpen) { // Animating OUT (menu is set to closed, animation in progress)
            if (isThisClickedAndClosing) { // Clicked item animates to center and expands/fades
              transformStyle = `translate(0px, 0px) scale(1.8)`;
              opacityStyle = 0;
              filterStyle = 'blur(8px)';
              currentTransitionDuration = animTimings.outroBase + 150;
              transitionDelayMs = 0; 
              zIndex = 30;
            } else { // Non-clicked items or general menu retract (e.g. cancel)
              transformStyle = 'translate(0px, 0px) scale(0.2) rotate(30deg)';
              opacityStyle = 0;
              filterStyle = 'blur(5px)';
              transitionDelayMs = (services.length - 1 - index) * animTimings.outroStagger * 0.6;
              currentTransitionDuration = animTimings.outroBase;
            }
          }
          
          return (
            <button
              key={service.id}
              // Ensure the button is positioned absolutely relative to the orb's container
              // The parent div of CentralOrbReimagined and these buttons is already relative.
              // So, these buttons will be positioned around the center of that div.
              onClick={() => handleServiceClick(service.actionKey)}
              className={`group absolute flex flex-col items-center justify-center rounded-full
                          border-2 border-transparent backdrop-blur-md
                          transition-all ease-out-quint-custom pointer-events-auto
                          focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-slate-950 ${iconDimensions.button}`}
              style={{
                '--service-color': service.color,
                '--service-glow': `${service.color}99`,
                '--service-glow-strong': `${service.color}CC`,
                transform: transformStyle,
                opacity: opacityStyle,
                zIndex: zIndex,
                filter: filterStyle,
                transitionDuration: `${currentTransitionDuration}ms`,
                transitionProperty: 'transform, opacity, box-shadow, border-color, background-color, filter',
                transitionDelay: `${transitionDelayMs}ms`,
                backgroundColor: `rgba(71, 85, 105, 0.5)`,
                boxShadow: `0 0 0px 0px var(--service-glow)`,
                '--tw-ring-color': `var(--service-glow-strong)`,
                // Correct positioning: top-1/2 left-1/2 then translate by -50% of self, then by x,y for radial
                // This is implicitly handled by the parent div being flex centered and items being absolute.
                // The transform: translate(x,y) then moves it from that center.
              } as React.CSSProperties}
              onMouseEnter={(e) => { 
                  if (isAnimatingMenu || !isMenuOpen) return;
                  const currentTarget = e.currentTarget as HTMLButtonElement;
                  currentTarget.style.borderColor = `var(--service-color)`;
                  currentTarget.style.boxShadow = `0 0 25px 5px var(--service-glow), 0 0 8px 2px var(--service-color) inset`;
                  currentTarget.style.transform = `translate(${x}px, ${y}px) scale(1.25) rotate(5deg)`;
                  currentTarget.style.zIndex = '20';
              }}
              onMouseLeave={(e) => { 
                  if (isAnimatingMenu || !isMenuOpen) return;
                  const currentTarget = e.currentTarget as HTMLButtonElement;
                  currentTarget.style.borderColor = `transparent`;
                  currentTarget.style.boxShadow = `0 0 0px 0px var(--service-glow)`;
                  currentTarget.style.transform = `translate(${x}px, ${y}px) scale(1) rotate(0deg)`;
                  currentTarget.style.zIndex = '10';
              }}
              aria-label={`Open ${service.name}`}
              disabled={isAnimatingMenu || !isMenuOpen || isClosingWidget} >
              <div className={`p-2 rounded-full transition-all duration-200 ease-out-quint`} 
                   style={{ backgroundColor: `${service.color}26`}}>
                <service.icon
                  className={`${iconDimensions.icon} transition-transform duration-200 group-hover:scale-115`}
                  color={service.color} />
              </div>
              <span 
                  className={`absolute ${iconDimensions.nameOffset} font-medium text-slate-100/90 p-1.5 px-2.5 
                             bg-slate-800/90 rounded-lg shadow-xl backdrop-blur-sm
                             opacity-0 group-hover:opacity-100 group-focus:opacity-100 
                             transform translate-y-2 group-hover:translate-y-0 group-focus:translate-y-0
                             transition-all duration-250 ease-out-quint delay-150 pointer-events-none`} >
                  {service.name}
              </span>
            </button>
          );
        })}

        {/* Cancel Button */}
        <div 
          className="absolute" // Positioned relative to the flex-col container
          style={{ 
            // Position it below the orb. Orb is ~h-24 (96px). Add some spacing.
            // The parent is flex items-center justify-center.
            // So, this div will also be centered. We want to push it down.
            // Using top and transform to position it relative to the center.
            top: 'calc(50% + 60px)', // 50% (center) + half orb height (48px) + spacing (12px)
            left: '50%',
            transform: 'translateX(-50%)',
            transition: `opacity ${animTimings.cancelButton}ms ease-out-quint, transform ${animTimings.cancelButton}ms ease-out-quint`,
            opacity: isMenuOpen && !isAnimatingMenu && !isClosingWidget ? 1 : 0,
            pointerEvents: isMenuOpen && !isAnimatingMenu && !isClosingWidget ? 'auto' : 'none',
            // Delay appearance slightly after icons
            transitionDelay: isMenuOpen && !isAnimatingMenu && !isClosingWidget ? `${animTimings.stagger * services.length * 0.5}ms` : '0ms', 
        }}>
          <button
            onClick={handleCancelSelection}
            className={`px-5 py-2.5 rounded-lg bg-slate-700/60 hover:bg-slate-600/80 backdrop-blur-sm
                        text-slate-300 hover:text-slate-100 font-medium shadow-lg
                        transition-all duration-200 ease-out-quint
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-slate-950`}
            aria-label="Cancel selection and close"
            disabled={isAnimatingMenu || isClosingWidget || !isMenuOpen}
          >
            Cancel
          </button>
        </div>
      </div>


      <style jsx global>{`
        .ease-out-quint { transition-timing-function: cubic-bezier(0.23, 1, 0.32, 1); }
        .ease-in-out-sine { transition-timing-function: cubic-bezier(0.445, 0.05, 0.55, 0.95); }
        .ease-out-quint-custom { transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1); }

        @keyframes nebula-drift {
          0% { transform: scale(0.95) translate(0px, 0px) rotate(0deg); opacity: var(--start-opacity, 0.05); }
          50% { transform: scale(1.05) translate(15px, -10px) rotate(5deg); opacity: var(--end-opacity, 0.08); }
          100% { transform: scale(0.95) translate(0px, 0px) rotate(0deg); opacity: var(--start-opacity, 0.05); }
        }
        .animate-nebula-drift { animation: nebula-drift infinite ease-in-out alternate; }

        @keyframes orb-pulse {
            0%, 100% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.08); opacity: 0.9; }
        }
        .animate-orb-pulse { animation: orb-pulse 3s infinite ease-in-out-sine; }
        
        @keyframes orb-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-orb-spin { animation: orb-spin 40s linear infinite; }

        *:focus-visible {
          outline: 2px solid var(--tw-ring-color, #38bdf8) !important;
          outline-offset: 2px !important;
        }
      `}</style>
    </div>
  );
};

// --- Settings Panel (Largely Unchanged) ---
export const GoogleServicesHubSettingsPanel: React.FC<{
  widgetId: string;
  currentSettings: GoogleServicesHubWidgetSettings | undefined;
  onSave: (newSettings: GoogleServicesHubWidgetSettings) => void;
}> = ({ currentSettings, onSave }) => {
  const [animationSpeed, setAnimationSpeed] = useState(currentSettings?.animationSpeed || 'normal');
  const [iconSize, setIconSize] = useState(currentSettings?.iconSize || 'medium');
  const [menuRadius, setMenuRadius] = useState(currentSettings?.menuRadius || 130);

  const handleSave = () => {
    onSave({ 
        animationSpeed: animationSpeed as 'slow' | 'normal' | 'fast',
        iconSize: iconSize as 'small' | 'medium' | 'large',
        menuRadius: Number(menuRadius) >= 60 ? Number(menuRadius) : undefined
    });
  };
  
  return (
    <div className="space-y-6 p-4 bg-slate-800 text-slate-200 rounded-lg shadow-2xl">
      <div>
        <h3 className="text-xl font-semibold text-slate-100 mb-1">Hub Customization</h3>
        <p className="text-sm text-slate-400 mb-4">
          Fine-tune the reimagined services menu.
        </p>
      </div>
      <div>
        <label htmlFor="hub-animation-speed-reimagined" className="block text-sm font-medium text-slate-300 mb-1">
          Animation Speed:
        </label>
        <select
          id="hub-animation-speed-reimagined"
          value={animationSpeed}
          onChange={(e) => setAnimationSpeed(e.target.value as 'slow' | 'normal' | 'fast')}
          className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-slate-100"
        >
          <option value="slow">Cinematic (Slow)</option>
          <option value="normal">Dynamic (Normal)</option>
          <option value="fast">Hyper (Fast)</option>
        </select>
      </div>
      <div>
        <label htmlFor="hub-icon-size-reimagined" className="block text-sm font-medium text-slate-300 mb-1">
          Icon Size:
        </label>
        <select
          id="hub-icon-size-reimagined"
          value={iconSize}
          onChange={(e) => setIconSize(e.target.value as 'small' | 'medium' | 'large')}
          className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-slate-100"
        >
          <option value="small">Compact</option>
          <option value="medium">Standard</option>
          <option value="large">Prominent</option>
        </select>
      </div>
      <div>
        <label htmlFor="hub-menu-radius-reimagined" className="block text-sm font-medium text-slate-300 mb-1">
          Menu Radius (px, min 60):
        </label>
        <input
          type="number"
          id="hub-menu-radius-reimagined"
          min="60" max="300" step="10"
          value={menuRadius}
          onChange={(e) => setMenuRadius(parseInt(e.target.value, 10))}
          className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-slate-100"
        />
         <p className="text-xs text-slate-400 mt-1">Adjusts icon spread. Recommended: 110-240px.</p>
      </div>
       <button
        onClick={handleSave}
        className="mt-8 w-full px-4 py-2.5 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-slate-800 transition-colors duration-150 ease-in-out"
      >
        Apply Settings
      </button>
    </div>
  );
};

export default GoogleServicesHubWidget;
