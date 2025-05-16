// src/app/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Widget, { WidgetResizeDataType, WidgetMoveDataType } from "@/components/Widget";
import GridBackground from "@/components/GridBackground";
import SettingsModal from '@/components/SettingsModal';
import WeatherWidget, { WeatherSettingsPanel, WeatherWidgetSettings } from "@/components/WeatherWidget";
import ClockWidget, { ClockSettingsPanel, ClockWidgetSettings } from "@/components/ClockWidget";
import CalculatorWidget, { CalculatorSettingsPanel, CalculatorWidgetSettings } from "@/components/CalculatorWidget";

// --- Icons ---
const UndoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
  </svg>
);

const RedoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
  </svg>
);

// --- Constants ---
const CELL_SIZE = 30;
const MAX_HISTORY_LENGTH = 50;
const MINIMIZED_WIDGET_ROW_SPAN = 2;

// --- Interfaces ---
export interface TodoWidgetSettings {
  showCompleted?: boolean;
  defaultSort?: 'date' | 'priority';
}

export interface PageWidgetConfig {
  id: string;
  title: string;
  type: 'weather' | 'todo' | 'clock' | 'calculator' | 'generic';
  colStart: number;
  rowStart: number;
  colSpan: number;
  rowSpan: number;
  content?: string | Record<string, any>;
  settings?: WeatherWidgetSettings | TodoWidgetSettings | ClockWidgetSettings | CalculatorWidgetSettings | Record<string, any>;
  isMinimized?: boolean;
  originalRowSpan?: number;
}

// --- Initial Data (User Adjusted) ---
const initialWidgets: PageWidgetConfig[] = [
  {
    id: 'weather-widget-main',
    title: 'Medford Weather',
    type: 'weather',
    colStart: 3, // Start further left
    rowStart: 3,
    colSpan: 10, // Adjusted width
    rowSpan: 12, // Adjusted height
    settings: { location: '97504 US', units: 'imperial', useCurrentLocation: false },
    isMinimized: false,
  },
  {
    id: 'clock-widget-1',
    title: 'Current Time',
    type: 'clock',
    colStart: 14, // Positioned to the right of weather
    rowStart: 3,
    colSpan: 8,  // Default size for clock
    rowSpan: 8,  // Default size for clock
    settings: { displayType: 'analog', showSeconds: true }, // Example: Analog default
    isMinimized: false,
  },
  { // New Calculator Widget instance
    id: 'calculator-widget-1',
    title: 'Calculator',
    type: 'calculator',
    colStart: 14, // Positioned below the clock
    rowStart: 12, // Starts after the clock
    colSpan: 10,  // Calculators are often somewhat narrow
    rowSpan: 18,  // And a bit taller for buttons
    settings: {}, // No specific settings for now
    isMinimized: false,
  },
   {
    id: 'todo-widget-sample',
    title: 'Project Tasks',
    type: 'todo',
    colStart: 3, // Positioned below weather
    rowStart: 16, // Starts after weather
    colSpan: 10, // Same width as weather
    rowSpan: 7,
    settings: { showCompleted: true },
    isMinimized: false,
  },
];

// --- Main Page Component ---
export default function Home() {
  const [widgetContainerCols, setWidgetContainerCols] = useState(0);
  const [widgetContainerRows, setWidgetContainerRows] = useState(0);
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);

  const [widgets, setWidgets] = useState<PageWidgetConfig[]>(() => JSON.parse(JSON.stringify(initialWidgets)));
  const [history, setHistory] = useState<PageWidgetConfig[][]>([JSON.parse(JSON.stringify(initialWidgets))]);
  const [historyPointer, setHistoryPointer] = useState<number>(0);
  const isPerformingUndoRedo = useRef(false);

  const headerRef = useRef<HTMLElement>(null);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedWidgetForSettings, setSelectedWidgetForSettings] = useState<PageWidgetConfig | null>(null);

  const [maximizedWidgetId, setMaximizedWidgetId] = useState<string | null>(null);
  const [maximizedWidgetOriginalState, setMaximizedWidgetOriginalState] = useState<PageWidgetConfig | null>(null);


  const updateWidgetsAndPushToHistory = useCallback((newWidgetsState: PageWidgetConfig[], actionType?: string) => {
    if (isPerformingUndoRedo.current && actionType !== 'undo_redo') return;

    setHistory(prevHistory => {
      const newHistoryBase = prevHistory.slice(0, historyPointer + 1);
      const newHistoryEntry = JSON.parse(JSON.stringify(newWidgetsState));
      let finalHistory = [...newHistoryBase, newHistoryEntry];
      if (finalHistory.length > MAX_HISTORY_LENGTH) {
        finalHistory = finalHistory.slice(finalHistory.length - MAX_HISTORY_LENGTH);
      }
      setHistoryPointer(finalHistory.length - 1);
      return finalHistory;
    });
    setWidgets(newWidgetsState);
  }, [historyPointer]);

  useEffect(() => {
    const determineWidgetContainerGridSize = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const headerHeight = headerRef.current?.offsetHeight || 60;
      const mainContentHeight = screenHeight - headerHeight;
      setWidgetContainerCols(Math.floor(screenWidth / CELL_SIZE));
      setWidgetContainerRows(Math.floor(mainContentHeight / CELL_SIZE));
    };
    determineWidgetContainerGridSize();
    const timeoutId = setTimeout(determineWidgetContainerGridSize, 100);
    window.addEventListener('resize', determineWidgetContainerGridSize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', determineWidgetContainerGridSize);
    };
  }, []);

  // --- Widget Interaction Handlers (Move, Resize, Delete, Focus, Settings) ---
  const handleWidgetResizeLive = (id: string, newGeometry: WidgetResizeDataType) => {
    if (isPerformingUndoRedo.current || maximizedWidgetId) return;
    setWidgets(currentWidgets =>
      currentWidgets.map(w =>
        w.id === id ? { ...w, ...newGeometry, isMinimized: false } : w
      )
    );
  };

  const handleWidgetResizeEnd = (id: string, finalGeometry: WidgetResizeDataType) => {
    if (maximizedWidgetId) return;
    const newWidgetsState = widgets.map(w =>
        w.id === id ? { ...w, ...finalGeometry, isMinimized: false, originalRowSpan: undefined } : w
    );
    updateWidgetsAndPushToHistory(newWidgetsState, 'resize_end');
    setActiveWidgetId(id);
  };

  const handleWidgetMove = (id: string, newPosition: WidgetMoveDataType) => {
    if (maximizedWidgetId) return;
    const currentWidget = widgets.find(w => w.id === id);
    if (!currentWidget) return;

    if (currentWidget.colStart !== newPosition.colStart || currentWidget.rowStart !== newPosition.rowStart) {
        const newWidgetsState = widgets.map(w =>
            w.id === id ? { ...w, ...newPosition } : w
        );
        updateWidgetsAndPushToHistory(newWidgetsState, 'move');
    }
    setActiveWidgetId(id);
  };

  const handleWidgetDelete = (idToDelete: string) => {
    if (maximizedWidgetId === idToDelete) setMaximizedWidgetId(null);
    const newWidgetsState = widgets.filter(widget => widget.id !== idToDelete);
    updateWidgetsAndPushToHistory(newWidgetsState, 'delete');
    if (activeWidgetId === idToDelete) setActiveWidgetId(null);
  };

  const handleWidgetFocus = (id: string) => {
    if (maximizedWidgetId && maximizedWidgetId !== id) return;
    setActiveWidgetId(id);
  };

  const handleOpenWidgetSettings = (widgetId: string) => {
    if (maximizedWidgetId && maximizedWidgetId !== widgetId) return;
    const widgetToEdit = widgets.find(w => w.id === widgetId);
    if (widgetToEdit) {
      setSelectedWidgetForSettings(widgetToEdit);
      setIsSettingsModalOpen(true);
    }
  };
  const handleCloseSettingsModal = () => {
    setIsSettingsModalOpen(false);
    setSelectedWidgetForSettings(null);
  };
  const handleSaveWidgetSettings = (widgetId: string, newSettings: any) => {
    const newWidgetsState = widgets.map(w =>
        w.id === widgetId ? { ...w, settings: { ...(w.settings || {}), ...newSettings } } : w
    );
    updateWidgetsAndPushToHistory(newWidgetsState, 'save_settings');
    handleCloseSettingsModal();
  };

  // --- Minimize/Maximize Handlers ---
  const handleWidgetMinimizeToggle = (widgetId: string) => {
    if (maximizedWidgetId) return; 

    const newWidgetsState = widgets.map(w => {
      if (w.id === widgetId) {
        if (w.isMinimized) {
          return { ...w, isMinimized: false, rowSpan: w.originalRowSpan || w.rowSpan, originalRowSpan: undefined };
        } else {
          return { ...w, isMinimized: true, originalRowSpan: w.rowSpan, rowSpan: MINIMIZED_WIDGET_ROW_SPAN };
        }
      }
      return w;
    });
    updateWidgetsAndPushToHistory(newWidgetsState, 'minimize_toggle');
    setActiveWidgetId(widgetId); 
  };

  const handleWidgetMaximizeToggle = (widgetId: string) => {
    const widgetToToggle = widgets.find(w => w.id === widgetId);
    if (!widgetToToggle) return;

    if (maximizedWidgetId === widgetId) { 
      setMaximizedWidgetId(null);
      setMaximizedWidgetOriginalState(null);
      setActiveWidgetId(widgetId); 
    } else { 
      let originalStateForMaximize = { ...widgetToToggle };
      if (widgetToToggle.isMinimized) {
        originalStateForMaximize = {
            ...originalStateForMaximize,
            isMinimized: false, 
            rowSpan: widgetToToggle.originalRowSpan || widgetToToggle.rowSpan, 
        };
      }
      setMaximizedWidgetOriginalState(originalStateForMaximize);
      setMaximizedWidgetId(widgetId);
      setActiveWidgetId(widgetId); 
    }
  };


  // --- Undo/Redo Handlers ---
  const handleUndo = () => {
    if (historyPointer > 0) {
      isPerformingUndoRedo.current = true;
      const newPointer = historyPointer - 1;
      setHistoryPointer(newPointer);
      setWidgets(JSON.parse(JSON.stringify(history[newPointer])));
      setActiveWidgetId(null); 
      setMaximizedWidgetId(null); 
      requestAnimationFrame(() => { isPerformingUndoRedo.current = false; });
    }
  };
  const handleRedo = () => {
    if (historyPointer < history.length - 1) {
      isPerformingUndoRedo.current = true;
      const newPointer = historyPointer + 1;
      setHistoryPointer(newPointer);
      setWidgets(JSON.parse(JSON.stringify(history[newPointer])));
      setActiveWidgetId(null); 
      setMaximizedWidgetId(null); 
      requestAnimationFrame(() => { isPerformingUndoRedo.current = false; });
    }
  };

  // --- Render Logic ---
  const renderWidgetContent = (widgetConfig: PageWidgetConfig) => {
    switch (widgetConfig.type) {
      case 'weather':
        return <WeatherWidget id={widgetConfig.id} settings={widgetConfig.settings as WeatherWidgetSettings | undefined} />;
      case 'clock':
        return <ClockWidget id={widgetConfig.id} settings={widgetConfig.settings as ClockWidgetSettings | undefined} />;
      case 'calculator': 
        return <CalculatorWidget id={widgetConfig.id} settings={widgetConfig.settings as CalculatorWidgetSettings | undefined} />;
      case 'todo':
        return (
          <div className="p-3 bg-transparent h-full text-primary overflow-y-auto">
            <ul className="space-y-2">
                <li className="flex items-center"><input type="checkbox" className="mr-2 h-4 w-4 accent-accent-primary bg-widget" defaultChecked/><span>Finalize UI mockups</span></li>
                <li className="flex items-center"><input type="checkbox" className="mr-2 h-4 w-4 accent-accent-primary bg-widget" /><span>Develop core components</span></li>
                <li className="flex items-center opacity-50"><input type="checkbox" className="mr-2 h-4 w-4 accent-accent-primary bg-widget" defaultChecked disabled/><span className="line-through">Initial planning</span></li>
            </ul>
          </div>
        );
      default:
        return typeof widgetConfig.content === 'string' ? <p>{widgetConfig.content}</p> : <p className="text-xs text-secondary italic">Generic widget content.</p>;
    }
  };

  const getSettingsPanelForWidget = (widgetConfig: PageWidgetConfig | null) => {
    if (!widgetConfig) return null;
    const boundSaveSettings = (newSettings: any) => handleSaveWidgetSettings(widgetConfig.id, newSettings);

    switch (widgetConfig.type) {
      case 'weather':
        return <WeatherSettingsPanel widgetId={widgetConfig.id} currentSettings={widgetConfig.settings as WeatherWidgetSettings | undefined} onSave={boundSaveSettings} />;
      case 'clock':
        return <ClockSettingsPanel widgetId={widgetConfig.id} currentSettings={widgetConfig.settings as ClockWidgetSettings | undefined} onSave={boundSaveSettings} />;
      case 'calculator': 
        return <CalculatorSettingsPanel widgetId={widgetConfig.id} currentSettings={widgetConfig.settings as CalculatorWidgetSettings | undefined} onSave={boundSaveSettings} />;
      default:
        return <p className="text-sm text-secondary">No specific settings available for this widget type.</p>;
    }
  };


  // --- Main Render ---
  if (widgetContainerCols === 0 || widgetContainerRows === 0) {
    return <div className="w-full h-screen bg-page-background flex items-center justify-center text-page-foreground">Loading Dashboard...</div>;
  }

  return (
    <main
      className="w-full h-screen bg-page-background text-page-foreground overflow-hidden relative flex flex-col"
      onClick={(e) => {
        if (e.target === e.currentTarget && !maximizedWidgetId) {
          setActiveWidgetId(null);
        }
      }}
    >
      {/* Header Section */}
      <header ref={headerRef} className="p-3 bg-dark-surface text-primary flex items-center justify-between shadow-lg z-40 shrink-0 border-b border-[var(--dark-border-interactive)]">
        <div className="flex items-center space-x-2">
          <button onClick={handleUndo} disabled={historyPointer === 0 || !!maximizedWidgetId} className="control-button" aria-label="Undo"><UndoIcon /></button>
          <button onClick={handleRedo} disabled={historyPointer >= history.length - 1 || !!maximizedWidgetId} className="control-button" aria-label="Redo"><RedoIcon /></button>
        </div>
        <div className="text-xs text-secondary px-3 py-1 bg-slate-700 rounded-md">History: {historyPointer + 1} / {history.length}</div>
      </header>

      {/* Maximized Widget Backdrop */}
      {maximizedWidgetId && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" 
          onClick={() => maximizedWidgetId && handleWidgetMaximizeToggle(maximizedWidgetId)} 
        />
      )}

      {/* Main Content Area with Grid */}
      <div className={`flex-grow relative ${maximizedWidgetId ? 'pointer-events-none' : ''}`}> 
        <GridBackground />
        <div
          className="absolute inset-0 grid gap-0" 
          style={{
            gridTemplateColumns: `repeat(${widgetContainerCols}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${widgetContainerRows}, ${CELL_SIZE}px)`,
            alignContent: 'start', 
          }}
        >
          {widgets.map((widgetConfig) => {
            if (maximizedWidgetId && maximizedWidgetId !== widgetConfig.id) {
              return null; 
            }

            const currentWidgetState = maximizedWidgetId === widgetConfig.id && maximizedWidgetOriginalState
                                      ? maximizedWidgetOriginalState 
                                      : widgetConfig; 

            let minCol = 3; 
            let minRow = 3; 

            if (widgetConfig.type === 'clock') {
                minCol = widgetConfig.settings?.displayType === 'analog' ? 4 : 3;
                minRow = widgetConfig.settings?.displayType === 'analog' ? 4 : 3;
            } else if (widgetConfig.type === 'calculator') {
                minCol = 4; 
                minRow = 6; 
            }
             if (widgetConfig.isMinimized) {
                minCol = widgetConfig.colSpan; 
                minRow = MINIMIZED_WIDGET_ROW_SPAN;
            }


            return (
              <Widget
                key={widgetConfig.id}
                id={widgetConfig.id}
                title={widgetConfig.title}
                colStart={currentWidgetState.colStart}
                rowStart={currentWidgetState.rowStart}
                colSpan={currentWidgetState.colSpan}
                rowSpan={currentWidgetState.rowSpan}

                onResize={handleWidgetResizeLive}
                onResizeEnd={handleWidgetResizeEnd}
                onMove={handleWidgetMove}
                onDelete={handleWidgetDelete}
                onFocus={handleWidgetFocus}
                onOpenSettings={handleOpenWidgetSettings}

                isActive={widgetConfig.id === activeWidgetId && !maximizedWidgetId} 
                CELL_SIZE={CELL_SIZE}
                minColSpan={minCol}
                minRowSpan={minRow}
                totalGridCols={widgetContainerCols}
                totalGridRows={widgetContainerRows}

                isMinimized={widgetConfig.isMinimized} 
                onMinimizeToggle={() => handleWidgetMinimizeToggle(widgetConfig.id)}
                isMaximized={maximizedWidgetId === widgetConfig.id} 
                onMaximizeToggle={() => handleWidgetMaximizeToggle(widgetConfig.id)}
              >
                {renderWidgetContent(widgetConfig)}
              </Widget>
            );
          })}
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsModalOpen && selectedWidgetForSettings && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={handleCloseSettingsModal}
          title={selectedWidgetForSettings.title}
          settingsContent={getSettingsPanelForWidget(selectedWidgetForSettings)}
        />
      )}
    </main>
  );
}

const styles = `
  .control-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    background-color: var(--dark-accent-primary);
    border-radius: 0.375rem;
    color: var(--dark-text-on-accent);
    transition: background-color 0.2s ease-in-out;
  }
  .control-button:hover {
    background-color: var(--dark-accent-primary-hover);
  }
  .control-button:disabled {
    background-color: hsl(222, 47%, 25%);
    color: hsl(215, 20%, 55%);
    cursor: not-allowed;
  }
`;
if (typeof window !== 'undefined') { 
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}
