// src/components/AddWidgetContextMenu.tsx
"use client";

import React, { useEffect, useRef, useCallback } from 'react';
import { type WidgetType } from '@/definitions/widgetConfig';

// Import Icons from the dedicated Icons.tsx file
import {
    WeatherIcon, ClockIcon, CalculatorIcon, TodoIcon, NotesIcon, YoutubeIcon,
    MinesweeperIcon, UnitConverterIcon, CountdownStopwatchIcon, PhotoIcon,
    PortfolioIcon, GeminiChatIcon,
    // Import the new GoogleServicesHubIcon
    GoogleServicesHubIcon,
} from '@/components/Icons';


declare module 'react' {
  interface CSSProperties {
    '--mouse-x'?: string | number;
    '--mouse-y'?: string | number;
    '--opacity-glow'?: string | number;
    '--opacity-border'?: string | number;
  }
}

export interface WidgetBlueprintContextMenuItem {
  type: WidgetType;
  displayName: string;
  description?: string;
  icon?: React.FC<{ className?: string }>; // Allow className for icons
}

interface WidgetBlueprintFromConfig {
  type: WidgetType;
  displayName?: string;
  defaultTitle: string;
  description?: string;
  icon?: React.FC<{ className?: string }>; // Ensure icon is part of this interface
}


interface AddWidgetContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  onAddWidget: (widgetType: WidgetType) => void;
  availableWidgets: WidgetBlueprintContextMenuItem[];
  widgetContainerCols?: number;
  widgetContainerRows?: number;
  CELL_SIZE?: number;
  headerHeight?: number;
}

interface HTMLButtonElementWithListeners extends HTMLButtonElement {
  _mouseMoveListener?: (e: MouseEvent) => void;
  _mouseEnterListener?: () => void;
  _mouseLeaveListener?: () => void;
}

const AddWidgetContextMenu: React.FC<AddWidgetContextMenuProps> = ({
  isOpen,
  onClose,
  position,
  onAddWidget,
  availableWidgets,
  headerHeight
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElementWithListeners | null)[]>([]);

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, availableWidgets.length);
  }, [availableWidgets]);

  const handleMouseMove = useCallback((e: MouseEvent, index: number) => {
    const item = itemRefs.current[index];
    if (!item) return;

    const rect = item.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    item.style.setProperty('--mouse-x', `${x}px`);
    item.style.setProperty('--mouse-y', `${y}px`);
    item.style.setProperty('--opacity-glow', '1');
    item.style.setProperty('--opacity-border', '1');
  }, []);

  const handleMouseEnter = useCallback((index: number) => {
    const item = itemRefs.current[index];
    if (!item) return;
    item.style.setProperty('--opacity-glow', '1');
    item.style.setProperty('--opacity-border', '1');
  }, []);

  const handleMouseLeave = useCallback((index: number) => {
    const item = itemRefs.current[index];
    if (!item) return;
    item.style.setProperty('--opacity-glow', '0');
    item.style.setProperty('--opacity-border', '0');
  }, []);

  useEffect(() => {
    if (isOpen) {
      itemRefs.current.forEach((item, index) => {
        if (item) {
          const boundMouseMove = (e: MouseEvent) => handleMouseMove(e, index);
          const boundMouseEnter = () => handleMouseEnter(index);
          const boundMouseLeave = () => handleMouseLeave(index);

          item.addEventListener('mousemove', boundMouseMove);
          item.addEventListener('mouseenter', boundMouseEnter);
          item.addEventListener('mouseleave', boundMouseLeave);

          // Store listeners to remove them later
          item._mouseMoveListener = boundMouseMove;
          item._mouseEnterListener = boundMouseEnter;
          item._mouseLeaveListener = boundMouseLeave;
        }
      });
    }

    return () => {
      itemRefs.current.forEach((item) => {
        if (item) {
          if (item._mouseMoveListener) item.removeEventListener('mousemove', item._mouseMoveListener);
          if (item._mouseEnterListener) item.removeEventListener('mouseenter', item._mouseEnterListener);
          if (item._mouseLeaveListener) item.removeEventListener('mouseleave', item._mouseLeaveListener);
        }
      });
    };
  }, [isOpen, availableWidgets.length, handleMouseMove, handleMouseEnter, handleMouseLeave]);


  // Close menu if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectWidget = (widgetType: WidgetType) => {
    onAddWidget(widgetType);
    onClose();
  };

  const menuWidth = 300;
  const menuItemHeight = 60; // Approximate height including padding/margin for each item
  const menuPaddingAndHeader = 40; // Approximate height for menu header and overall padding
  const maxMenuHeight = 420; // Max height before scrolling
  const calculatedMenuHeight = Math.min(maxMenuHeight, availableWidgets.length * menuItemHeight + menuPaddingAndHeader);

  let top = position.y;
  let left = position.x;

  if (typeof window !== 'undefined') {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const currentHeaderHeight = headerHeight || 60; // Default header height if not provided
    const buffer = 15; // Buffer from screen edges

    if (left + menuWidth > screenWidth - buffer) left = screenWidth - menuWidth - buffer;
    if (top + calculatedMenuHeight > screenHeight - buffer) top = screenHeight - calculatedMenuHeight - buffer;
    if (left < buffer) left = buffer;
    if (top < currentHeaderHeight + buffer) top = currentHeaderHeight + buffer; // Ensure it's below the header
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-[60] w-[300px] rounded-xl bg-slate-850/70 dark:bg-slate-900/70 backdrop-blur-2xl shadow-2xl border border-slate-700/50 dark:border-slate-600/50 overflow-hidden animate-contextMenuAppear"
      style={{ top: `${top}px`, left: `${left}px` }}
      role="menu"
      aria-orientation="vertical"
    >
      <div className="p-2.5 border-b border-slate-700/40 dark:border-slate-600/30">
        <p className="px-2 py-0.5 text-xs font-semibold text-sky-300 dark:text-sky-400 uppercase tracking-wider">
          ✨ Add New Widget ✨
        </p>
      </div>
      <div className="max-h-[380px] overflow-y-auto custom-scrollbar p-1.5 space-y-1">
        {availableWidgets.map((widgetDef, index) => {
          const IconComponent = widgetDef.icon;
          return (
            <button
              key={widgetDef.type}
              ref={el => { itemRefs.current[index] = el; }}
              onClick={() => handleSelectWidget(widgetDef.type)}
              className="group relative flex items-center w-full text-left px-3 py-2.5 text-sm text-slate-100 dark:text-slate-50 focus:outline-none rounded-lg transition-all duration-200 ease-in-out animate-menuItemAppear fancy-hover-item"
              style={{
                animationDelay: `${index * 40}ms`,
                '--mouse-x': '50%',
                '--mouse-y': '50%',
                '--opacity-glow': '0',
                '--opacity-border': '0',
              } as React.CSSProperties}
              role="menuitem"
            >
              <div className="absolute inset-0 rounded-lg overflow-hidden z-0">
                <div className="absolute inset-[-100%] bg-glow opacity-glow transition-opacity duration-300 ease-out" />
                <div className="absolute inset-0 border-dynamic opacity-border transition-opacity duration-300 ease-out" />
              </div>

              <div className="relative z-10 flex items-center w-full">
                {IconComponent && (
                  <div className="mr-3 p-1.5 bg-slate-700/50 dark:bg-slate-800/60 rounded-md shadow-sm group-hover:bg-sky-500/20 dark:group-hover:bg-sky-400/25 transition-all duration-200 group-hover:scale-105">
                    {/* Pass a default className if the icon component expects it */}
                    <IconComponent className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-grow">
                  <span className="font-semibold text-[0.9rem]">{widgetDef.displayName}</span>
                  {widgetDef.description && (
                    <p className="text-[0.7rem] text-slate-300 dark:text-slate-400 group-hover:text-sky-100 dark:group-hover:text-sky-200 transition-colors duration-150 mt-0.5">
                      {widgetDef.description}
                    </p>
                  )}
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sky-400/60 dark:text-sky-300/60 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out transform group-hover:translate-x-0.5 group-hover:scale-105" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </button>
          );
        })}
      </div>
       <style jsx global>{`
        @keyframes contextMenuAppear {
          from { opacity: 0; transform: scale(0.9) translateY(-15px) rotateX(-10deg); }
          to { opacity: 1; transform: scale(1) translateY(0) rotateX(0deg); }
        }
        .animate-contextMenuAppear {
          animation: contextMenuAppear 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
        }

        @keyframes menuItemAppear {
          from { opacity: 0; transform: translateX(-15px) scale(0.95); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        .animate-menuItemAppear {
          opacity: 0; /* Start hidden */
          animation-fill-mode: forwards;
          animation-name: menuItemAppear;
          animation-duration: 0.25s;
          animation-timing-function: cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.5);
          border-radius: 10px;
          border: 1px solid rgba(0,0,0,0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(30, 136, 229, 0.6); }

        .fancy-hover-item .bg-glow {
          background: radial-gradient(
            circle at var(--mouse-x) var(--mouse-y),
            rgba(2, 132, 199, 0.25),
            transparent 40%
          );
          filter: blur(10px);
          transform: scale(1.5);
        }

        .fancy-hover-item .border-dynamic {
          border-radius: inherit;
          border: 1.5px solid transparent;
          background-clip: padding-box, border-box;
          background-origin: padding-box, border-box;
          background-image: linear-gradient(hsl(215 28% 17% / 0.8), hsl(215 28% 17% / 0.8)),
                            conic-gradient(from calc(atan2(var(--mouse-y) - (50%), var(--mouse-x) - (50%)) * 1rad - 90deg) at var(--mouse-x) var(--mouse-y),
                            #0ea5e9,
                            #38bdf8,
                            #7dd3fc,
                            #0ea5e9);
        }

        .fancy-hover-item {
          background-color: hsl(217 33% 25% / 0.15);
          backdrop-filter: blur(6px);
        }
        .fancy-hover-item:hover {
           background-color: hsl(217 33% 25% / 0.25);
        }

      `}</style>
    </div>
  );
};

export const mapBlueprintToContextMenuItem = (blueprint: WidgetBlueprintFromConfig): WidgetBlueprintContextMenuItem => {
  let iconComponent;
  // The blueprint itself should ideally already have the icon component assigned from widgetConfig.ts
  if (blueprint.icon) {
    iconComponent = blueprint.icon;
  } else {
    // Fallback logic if blueprint.icon is not directly provided (less ideal)
    switch (blueprint.type) {
      case 'weather': iconComponent = WeatherIcon; break;
      case 'clock': iconComponent = ClockIcon; break;
      case 'calculator': iconComponent = CalculatorIcon; break;
      case 'todo': iconComponent = TodoIcon; break;
      case 'notes': iconComponent = NotesIcon; break;
      case 'youtube': iconComponent = YoutubeIcon; break;
      case 'minesweeper': iconComponent = MinesweeperIcon; break;
      case 'unitConverter': iconComponent = UnitConverterIcon; break;
      case 'countdownStopwatch': iconComponent = CountdownStopwatchIcon; break;
      case 'photo': iconComponent = PhotoIcon; break;
      case 'portfolio': iconComponent = PortfolioIcon; break;
      case 'geminiChat': iconComponent = GeminiChatIcon; break;
      case 'googleServicesHub': iconComponent = GoogleServicesHubIcon; break; // Added new hub
      default: iconComponent = undefined;
    }
  }
  return {
    type: blueprint.type,
    displayName: blueprint.displayName || blueprint.defaultTitle.replace("New ", ""),
    description: blueprint.description,
    icon: iconComponent,
  };
};


export default AddWidgetContextMenu;
