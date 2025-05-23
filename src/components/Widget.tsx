// src/components/Widget.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';

// --- SVG Icons (Inline) ---
const MinimizeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
  </svg>
);
const RestoreMinimizedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);
const MaximizeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v4h-4" />
  </svg>
);
const RestoreMaximizedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 4H4v6m16 4h-6v6m-4-2L4 4m16 16L14 10" />
  </svg>
);
const SettingsIcon = () => ( // Icon for widget content settings
 <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const ContainerAppearanceIcon = () => ( // Palette Icon for widget container settings
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
);

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);


// --- Interfaces ---
type ResizeDirection = 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null;
export interface WidgetResizeDataType { colStart: number; rowStart: number; colSpan: number; rowSpan: number; }
export interface WidgetMoveDataType { colStart: number; rowStart: number; }

export interface WidgetContainerSettings {
  containerBackgroundColor?: string;
  alwaysShowTitleBar?: boolean;
  innerPadding?: 'p-0' | 'px-1.5 py-1' | 'px-2.5 py-2' | 'px-3.5 py-3' | 'px-5 py-4';
}

interface WidgetProps {
  id: string;
  colStart: number;
  rowStart: number;
  colSpan: number;
  rowSpan: number;
  title?: string;
  children?: React.ReactNode;
  onResize?: (id: string, newSizeAndPos: WidgetResizeDataType) => void;
  onResizeEnd?: (id: string, finalSizeAndPos: WidgetResizeDataType) => void;
  onMove?: (id: string, newPosition: WidgetMoveDataType) => void;
  onDelete?: (id: string) => void;
  onFocus?: (id: string) => void;
  onOpenSettings?: (id: string) => void;
  isActive?: boolean;
  CELL_SIZE: number;
  minColSpan?: number;
  minRowSpan?: number;
  totalGridCols?: number;
  totalGridRows?: number;
  isMinimized?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
  onMinimizeToggle?: (id: string) => void;
  isMaximized?: boolean;
  onMaximizeToggle?: (id: string) => void;
  containerSettings?: WidgetContainerSettings;
  onOpenContainerSettings?: (id: string) => void;
}

// --- Widget Component ---
const Widget: React.FC<WidgetProps> = ({
  id, colStart, rowStart, colSpan, rowSpan, title = "My Widget", children,
  onResize, onResizeEnd, onMove, onDelete, onFocus, onOpenSettings,
  isActive, CELL_SIZE, minColSpan = 1, minRowSpan = 1, totalGridCols = Infinity, totalGridRows = Infinity,
  isMinimized, onMinimizeToggle, isMaximized, onMaximizeToggle,
  containerSettings, onOpenContainerSettings
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [currentResizeDirection, setCurrentResizeDirection] = useState<ResizeDirection>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [visualDragOffset, setVisualDragOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const dragStartMousePos = useRef({ x: 0, y: 0 });
  const resizeStartGeometry = useRef({ initialColStart: 0, initialRowStart: 0, initialColSpan: 0, initialRowSpan: 0 });
  const latestResizeGeometry = useRef<WidgetResizeDataType | null>(null);
  const titleBarRef = useRef<HTMLDivElement>(null);

  const baseShadowStyle = '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)';
  const liftedShadowStyle = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)';
  const maximizedShadowStyle = '0 25px 50px -12px rgba(0,0,0,0.25)';

  const currentContainerSettings: WidgetContainerSettings = {
    containerBackgroundColor: containerSettings?.containerBackgroundColor,
    alwaysShowTitleBar: containerSettings?.alwaysShowTitleBar ?? false,
    innerPadding: containerSettings?.innerPadding ?? 'px-3.5 py-3',
  };

  const getWidgetStyle = (): React.CSSProperties => {
    let style: React.CSSProperties = {};
    if (isMaximized) {
      style = {
        position: 'fixed', top: '5vh', left: '5vw', width: '90vw', height: '90vh',
        zIndex: 50, boxShadow: maximizedShadowStyle,
      };
    } else {
      style = {
        gridColumnStart: colStart, gridRowStart: rowStart,
        gridColumnEnd: `span ${colSpan}`, gridRowEnd: `span ${rowSpan}`,
        zIndex: isActive ? 30 : (isResizing || isDragging ? 20 : 10),
        position: 'relative',
        transform: isDragging ? `translate(${visualDragOffset.x}px, ${visualDragOffset.y}px)` : 'none',
      };
    }
    if (currentContainerSettings.containerBackgroundColor) {
      style.backgroundColor = currentContainerSettings.containerBackgroundColor;
    }
    return style;
  };
  const widgetStyle = getWidgetStyle();

  const handleMouseDownOnResize = (e: React.MouseEvent<HTMLDivElement>, direction: ResizeDirection) => {
    if (isMinimized || isMaximized) return;
    e.preventDefault(); e.stopPropagation(); if (e.button !== 0) return;
    if (onFocus) onFocus(id);
    setIsResizing(true); setCurrentResizeDirection(direction);
    dragStartMousePos.current = { x: e.clientX, y: e.clientY };
    resizeStartGeometry.current = { initialColStart: colStart, initialRowStart: rowStart, initialColSpan: colSpan, initialRowSpan: rowSpan };
    latestResizeGeometry.current = { colStart, rowStart, colSpan, rowSpan };
  };

  useEffect(() => {
    const handleMouseMoveForResize = (e: MouseEvent) => {
      if (!isResizing || !currentResizeDirection || isMinimized || isMaximized) return;
      const deltaX = e.clientX - dragStartMousePos.current.x;
      const deltaY = e.clientY - dragStartMousePos.current.y;
      const deltaCols = Math.round(deltaX / CELL_SIZE);
      const deltaRows = Math.round(deltaY / CELL_SIZE);
      let newColStart = resizeStartGeometry.current.initialColStart;
      let newRowStart = resizeStartGeometry.current.initialRowStart;
      let newColSpan = resizeStartGeometry.current.initialColSpan;
      let newRowSpan = resizeStartGeometry.current.initialRowSpan;

      if (currentResizeDirection.includes('left')) { newColStart = resizeStartGeometry.current.initialColStart + deltaCols; newColSpan = resizeStartGeometry.current.initialColSpan - deltaCols; }
      else if (currentResizeDirection.includes('right')) { newColSpan = resizeStartGeometry.current.initialColSpan + deltaCols; }
      if (currentResizeDirection.includes('top')) { newRowStart = resizeStartGeometry.current.initialRowStart + deltaRows; newRowSpan = resizeStartGeometry.current.initialRowSpan - deltaRows; }
      else if (currentResizeDirection.includes('bottom')) { newRowSpan = resizeStartGeometry.current.initialRowSpan + deltaRows; }

      if (newColSpan < minColSpan) { if (currentResizeDirection.includes('left')) newColStart = resizeStartGeometry.current.initialColStart + (resizeStartGeometry.current.initialColSpan - minColSpan); newColSpan = minColSpan; }
      if (newRowSpan < minRowSpan) { if (currentResizeDirection.includes('top')) newRowStart = resizeStartGeometry.current.initialRowStart + (resizeStartGeometry.current.initialRowSpan - minRowSpan); newRowSpan = minRowSpan; }
      newColStart = Math.max(1, Math.min(newColStart, totalGridCols - newColSpan + 1));
      newRowStart = Math.max(1, Math.min(newRowStart, totalGridRows - newRowSpan + 1));
      newColSpan = Math.min(newColSpan, totalGridCols - newColStart + 1);
      newRowSpan = Math.min(newRowSpan, totalGridRows - newRowStart + 1);
      const currentGeometry = { colStart: newColStart, rowStart: newRowStart, colSpan: newColSpan, rowSpan: newRowSpan };
      latestResizeGeometry.current = currentGeometry;
      if (onResize) onResize(id, currentGeometry);
    };
    const handleMouseUpForResize = () => {
      if (isResizing) {
        setIsResizing(false); setCurrentResizeDirection(null);
        const start = resizeStartGeometry.current; const end = latestResizeGeometry.current;
        if (end && (start.initialColStart !== end.colStart || start.initialRowStart !== end.rowStart || start.initialColSpan !== end.colSpan || start.initialRowSpan !== end.rowSpan)) {
          if (onResizeEnd) onResizeEnd(id, end);
        }
        latestResizeGeometry.current = null;
      }
    };
    if (isResizing) { document.addEventListener('mousemove', handleMouseMoveForResize); document.addEventListener('mouseup', handleMouseUpForResize); }
    return () => { document.removeEventListener('mousemove', handleMouseMoveForResize); document.removeEventListener('mouseup', handleMouseUpForResize); };
  }, [isResizing, currentResizeDirection, id, onResize, onResizeEnd, CELL_SIZE, minColSpan, minRowSpan, totalGridCols, totalGridRows, isMinimized, isMaximized]);

  const handleMouseDownOnDrag = (e: React.MouseEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest('.widget-control-button, .widget-resize-handle, .widget-appearance-button') || isMaximized) return;
    if (e.button !== 0) return;
    if (onFocus) onFocus(id);
    e.preventDefault(); e.stopPropagation();
    setIsDragging(true); dragStartMousePos.current = { x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    const handleMouseMoveForDrag = (e: MouseEvent) => {
      if (!isDragging || isMaximized) return;
      const deltaX = e.clientX - dragStartMousePos.current.x;
      const deltaY = e.clientY - dragStartMousePos.current.y;
      setVisualDragOffset({ x: deltaX, y: deltaY });
    };
    const handleMouseUpForDrag = () => {
      if (isDragging && !isMaximized) {
        const currentWidgetLeftPx = (colStart - 1) * CELL_SIZE + visualDragOffset.x;
        const currentWidgetTopPx = (rowStart - 1) * CELL_SIZE + visualDragOffset.y;
        let newColStart = Math.round(currentWidgetLeftPx / CELL_SIZE) + 1;
        let newRowStart = Math.round(currentWidgetTopPx / CELL_SIZE) + 1;
        newColStart = Math.max(1, Math.min(newColStart, totalGridCols - colSpan + 1));
        newRowStart = Math.max(1, Math.min(newRowStart, totalGridRows - rowSpan + 1));
        if (newColStart !== colStart || newRowStart !== rowStart) {
            if (onMove) onMove(id, { colStart: newColStart, rowStart: newRowStart });
        }
        setIsDragging(false); setVisualDragOffset({ x: 0, y: 0 });
      } else if (isDragging && isMaximized) {
        setIsDragging(false); setVisualDragOffset({ x: 0, y: 0 });
      }
    };
    if (isDragging) { document.addEventListener('mousemove', handleMouseMoveForDrag); document.addEventListener('mouseup', handleMouseUpForDrag); }
    return () => { document.removeEventListener('mousemove', handleMouseMoveForDrag); document.removeEventListener('mouseup', handleMouseUpForDrag); };
  }, [isDragging, id, onMove, CELL_SIZE, colStart, rowStart, colSpan, rowSpan, totalGridCols, totalGridRows, visualDragOffset, isMaximized]);

  const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); if (onDelete) onDelete(id); };
  const handleSettingsClick = (e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); if (onOpenSettings) onOpenSettings(id); };
  const handleMinimizeToggleClick = (e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); if (onMinimizeToggle) onMinimizeToggle(id); };
  const handleMaximizeToggleClick = (e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); if (onMaximizeToggle) onMaximizeToggle(id); };

  const handleContainerSettingsClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (onOpenContainerSettings) onOpenContainerSettings(id);
  };

  const handleWidgetClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, .widget-resize-handle')) return;
    if (onFocus && !isMaximized) onFocus(id);
  };

  const controlButtonClass = "widget-control-button p-0.5 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-100 dark:text-slate-500 dark:hover:text-blue-400 dark:hover:bg-slate-700 focus:outline-none transition-colors";

  const resizeHandleMarkerClass = "widget-resize-handle";

  const titleBarActuallyVisible = currentContainerSettings.alwaysShowTitleBar || isMinimized || isActive || isHovered;
  const showSolidBackground = currentContainerSettings.containerBackgroundColor || isMinimized || isActive || isHovered || isResizing || isDragging;
  const innerPaddingClass = currentContainerSettings.innerPadding || 'px-3.5 py-3';

  return (
    <div
      id={id}
      style={widgetStyle}
      className={`
        border
        ${(isActive && !isMaximized) ? 'border-blue-500 dark:border-blue-400' : 'border-slate-300 dark:border-slate-700'}
        ${isMaximized ? 'rounded-xl' : 'rounded-lg'}
        flex flex-col overflow-hidden box-border group relative
        pointer-events-auto /* MODIFIED: Ensures widget is always interactive */
        ${!currentContainerSettings.containerBackgroundColor && (showSolidBackground ? 'bg-widget dark:bg-dark-surface' : 'bg-transparent')}
        ${isDragging ? 'opacity-80' : 'opacity-100'}
        ${isMaximized ?
            'transition-all duration-300 ease-in-out' :
            'transition-[opacity,box-shadow,grid-column-start,grid-row-start,grid-column-end,grid-row-end,background-color] duration-300 ease-in-out'
        }
        shadow-[${isActive || isDragging || isResizing ? liftedShadowStyle : baseShadowStyle}]
        ${isMaximized && `shadow-[${maximizedShadowStyle}]`}
      `}
      onClick={handleWidgetClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={titleBarRef}
        onMouseDown={!isMaximized ? handleMouseDownOnDrag : undefined}
        className={`
          flex justify-between items-center px-3
          ${!isMaximized && onMove ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''}
          transition-all duration-300 ease-in-out overflow-hidden
          ${titleBarActuallyVisible
            ? `py-2 opacity-100 max-h-20 ${title ? 'border-b border-slate-200 dark:border-slate-700' : ''}`
            : `py-0 opacity-0 max-h-0 ${title ? 'border-b border-transparent' : ''}`
          }
        `}
      >
        {title && (
          <h2 className="text-sm font-semibold text-primary truncate select-none flex-grow">
            {title}
          </h2>
        )}
        <div className="flex items-center space-x-1.5 ml-2 flex-shrink-0">

          {onOpenSettings && (
            <button onClick={handleSettingsClick} className={controlButtonClass} aria-label="Open widget content settings">
              <SettingsIcon/>
            </button>
          )}
          {onMinimizeToggle && !isMaximized && (
            <button onClick={handleMinimizeToggleClick} className={controlButtonClass} aria-label={isMinimized ? "Restore widget" : "Minimize widget"}>
              {isMinimized ? <RestoreMinimizedIcon /> : <MinimizeIcon />}
            </button>
          )}
          {onMaximizeToggle && (
             <button onClick={handleMaximizeToggleClick} className={controlButtonClass} aria-label={isMaximized ? "Restore widget from maximized" : "Maximize widget"}>
              {isMaximized ? <RestoreMaximizedIcon /> : <MaximizeIcon />}
            </button>
          )}
          {onDelete && (
            <button onClick={handleDeleteClick} className={controlButtonClass} aria-label="Delete widget">
              <DeleteIcon/>
            </button>
          )}
        </div>
      </div>

      {/* MODIFIED: Container for Appearance Button - Centered Horizontally */}
      {onOpenContainerSettings && !isMinimized && !isMaximized && (
        <button
          onClick={handleContainerSettingsClick}
          className={`widget-appearance-button absolute top-2 left-1/2 -translate-x-1/2 z-10 p-1.5 rounded-full
                      bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-sm
                      text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/70
                      opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-200 ease-in-out
                      hover:scale-110 focus:scale-110 active:scale-95`}
          aria-label="Open widget appearance settings"
          title="Appearance Settings"
        >
          <ContainerAppearanceIcon />
        </button>
      )}

      <div className={`
        text-primary flex-grow overflow-auto min-h-0 select-none
        ${isMinimized ? 'hidden' : 'block'}
        ${innerPaddingClass}
        text-sm
        transition-opacity duration-300 ease-in-out
        opacity-100
      `}>
        {children ? children : <p className="text-xs text-secondary italic">Widget content goes here.</p>}
      </div>

      {!isMinimized && !isMaximized && onResize && (
        <>
          <div onMouseDown={(e) => handleMouseDownOnResize(e, 'top-left')} className={`${resizeHandleMarkerClass} absolute -top-1 -left-1 w-4 h-4 cursor-nwse-resize z-30 rounded-full hover:bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-150`} style={{ touchAction: 'none' }} />
          <div onMouseDown={(e) => handleMouseDownOnResize(e, 'top-right')} className={`${resizeHandleMarkerClass} absolute -top-1 -right-1 w-4 h-4 cursor-nesw-resize z-30 rounded-full hover:bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-150`} style={{ touchAction: 'none' }} />
          <div onMouseDown={(e) => handleMouseDownOnResize(e, 'bottom-left')} className={`${resizeHandleMarkerClass} absolute -bottom-1 -left-1 w-4 h-4 cursor-nesw-resize z-30 rounded-full hover:bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-150`} style={{ touchAction: 'none' }} />
          <div onMouseDown={(e) => handleMouseDownOnResize(e, 'bottom-right')} className={`${resizeHandleMarkerClass} absolute -bottom-1 -right-1 w-4 h-4 cursor-nwse-resize z-30 rounded-full hover:bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-150`} style={{ touchAction: 'none' }} />

          <div onMouseDown={(e) => handleMouseDownOnResize(e, 'top')}
               className={`${resizeHandleMarkerClass} absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-3 cursor-ns-resize z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150`}
               style={{ touchAction: 'none' }} >
            <div style={{ width: '2rem', height: '0.25rem' }} className="bg-blue-500/50 rounded-full"></div>
          </div>
          <div onMouseDown={(e) => handleMouseDownOnResize(e, 'bottom')}
               className={`${resizeHandleMarkerClass} absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1/3 h-3 cursor-ns-resize z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150`}
               style={{ touchAction: 'none' }} >
            <div style={{ width: '2rem', height: '0.25rem' }} className="bg-blue-500/50 rounded-full"></div>
          </div>
          <div onMouseDown={(e) => handleMouseDownOnResize(e, 'left')}
               className={`${resizeHandleMarkerClass} absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-1/3 cursor-ew-resize z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150`}
               style={{ touchAction: 'none' }} >
            <div style={{ height: '2rem', width: '0.25rem' }} className="bg-blue-500/50 rounded-full"></div>
          </div>
          <div onMouseDown={(e) => handleMouseDownOnResize(e, 'right')}
               className={`${resizeHandleMarkerClass} absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-1/3 cursor-ew-resize z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150`}
               style={{ touchAction: 'none' }} >
            <div style={{ height: '2rem', width: '0.25rem' }} className="bg-blue-500/50 rounded-full"></div>
          </div>
        </>
      )}
    </div>
  );
};

export default Widget;
