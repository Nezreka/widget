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
const ExportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75v6.75m0 0l-3-3m3 3l3-3m-8.25 6a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
  </svg>
);
const ImportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
  </svg>
);
const AddIcon = () => ( 
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"> 
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);


// --- Constants ---
const CELL_SIZE = 30;
const MAX_HISTORY_LENGTH = 50;
const MINIMIZED_WIDGET_ROW_SPAN = 2;
const LOCAL_STORAGE_KEY = 'dashboardLayoutV1';
const WIDGET_PLACEMENT_BUFFER = 1; 

// --- Interfaces ---
export interface TodoWidgetSettings {
  showCompleted?: boolean;
  defaultSort?: 'date' | 'priority';
}

export type WidgetType = 'weather' | 'todo' | 'clock' | 'calculator' | 'generic'; 

export interface PageWidgetConfig {
  id: string;
  title: string;
  type: WidgetType; 
  colStart: number;
  rowStart: number;
  colSpan: number;
  rowSpan: number;
  content?: string | Record<string, any>;
  settings?: WeatherWidgetSettings | TodoWidgetSettings | ClockWidgetSettings | CalculatorWidgetSettings | Record<string, any>;
  isMinimized?: boolean;
  originalRowSpan?: number;
}

// --- Widget Definitions/Blueprints ---
interface WidgetBlueprint {
  type: WidgetType;
  defaultTitle: string;
  defaultColSpan: number;
  defaultRowSpan: number;
  minColSpan?: number; 
  minRowSpan?: number; 
  defaultSettings: WeatherWidgetSettings | TodoWidgetSettings | ClockWidgetSettings | CalculatorWidgetSettings | Record<string, any> | undefined;
}

const AVAILABLE_WIDGET_DEFINITIONS: WidgetBlueprint[] = [
  { type: 'weather', defaultTitle: 'New Weather', defaultColSpan: 8, defaultRowSpan: 12, minColSpan: 6, minRowSpan: 8, defaultSettings: { location: 'New York, US', units: 'imperial', useCurrentLocation: false } },
  { type: 'clock', defaultTitle: 'New Clock', defaultColSpan: 8, defaultRowSpan: 8, minColSpan: 4, minRowSpan: 4, defaultSettings: { displayType: 'digital', showSeconds: true, hourFormat: '12' } },
  { type: 'calculator', defaultTitle: 'New Calculator', defaultColSpan: 12, defaultRowSpan: 16, minColSpan: 4, minRowSpan: 6, defaultSettings: {} },
  { type: 'todo', defaultTitle: 'New To-Do List', defaultColSpan: 5, defaultRowSpan: 6, minColSpan: 3, minRowSpan: 4, defaultSettings: { showCompleted: true } },
];

const initialWidgets: PageWidgetConfig[] = [
  { "id": "weather-widget-main", "title": "Medford Weather", "type": "weather", "colStart": 3, "rowStart": 3, "colSpan": 10, "rowSpan": 14, "settings": { "location": "97504 US", "units": "imperial", "useCurrentLocation": false }, "isMinimized": false },
  { "id": "clock-widget-1", "title": "Current Time", "type": "clock", "colStart": 14, "rowStart": 3, "colSpan": 8, "rowSpan": 8, "settings": { "displayType": "analog", "showSeconds": true }, "isMinimized": false },
  { "id": "calculator-widget-1", "title": "Calculator", "type": "calculator", "colStart": 14, "rowStart": 12, "colSpan": 11, "rowSpan": 18, "settings": {}, "isMinimized": false },
  { "id": "todo-widget-sample", "title": "Project Tasks", "type": "todo", "colStart": 3, "rowStart": 18, "colSpan": 10, "rowSpan": 7, "settings": { "showCompleted": true }, "isMinimized": false }
];

export default function Home() {
  const [widgetContainerCols, setWidgetContainerCols] = useState(0);
  const [widgetContainerRows, setWidgetContainerRows] = useState(0);
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);
  const [widgets, setWidgets] = useState<PageWidgetConfig[]>(() => JSON.parse(JSON.stringify(initialWidgets)));
  const [history, setHistory] = useState<PageWidgetConfig[][]>([JSON.parse(JSON.stringify(widgets))]);
  const [historyPointer, setHistoryPointer] = useState<number>(0);
  const isPerformingUndoRedo = useRef(false);
  const headerRef = useRef<HTMLElement>(null);
  const initialLoadAttempted = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedWidgetForSettings, setSelectedWidgetForSettings] = useState<PageWidgetConfig | null>(null);
  const [maximizedWidgetId, setMaximizedWidgetId] = useState<string | null>(null);
  const [maximizedWidgetOriginalState, setMaximizedWidgetOriginalState] = useState<PageWidgetConfig | null>(null);

  // Effect to load widgets from localStorage on initial client-side mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let layoutToUse = JSON.parse(JSON.stringify(initialWidgets)); // Start with default
      try {
        const savedLayoutJSON = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedLayoutJSON) {
          const loadedWidgets = JSON.parse(savedLayoutJSON) as PageWidgetConfig[];
          // Basic validation: check if it's an array and if the first element looks like a widget
          if (Array.isArray(loadedWidgets) && 
              (loadedWidgets.length === 0 || (loadedWidgets[0] && typeof loadedWidgets[0].id === 'string'))) {
            layoutToUse = loadedWidgets;
            console.log("Dashboard layout loaded from localStorage.");
          } else {
            console.warn("Invalid or empty layout data found in localStorage. Using default.");
            // layoutToUse remains initialWidgets
          }
        }
      } catch (error) {
        console.error("Error loading/parsing layout from localStorage:", error);
        // layoutToUse remains initialWidgets
      }
      setWidgets(layoutToUse);
      setHistory([JSON.parse(JSON.stringify(layoutToUse))]);
      setHistoryPointer(0);
      initialLoadAttempted.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Effect to save widgets to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && initialLoadAttempted.current) {
      try {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(widgets));
      } catch (error) {
        console.error("Error saving layout to localStorage:", error);
      }
    }
  }, [widgets]);


  const updateWidgetsAndPushToHistory = useCallback((newWidgetsState: PageWidgetConfig[], actionType?: string) => {
    if (isPerformingUndoRedo.current && actionType !== 'undo_redo') return;
    const newHistoryEntry = JSON.parse(JSON.stringify(newWidgetsState));
    setHistory(prevHistory => {
      const newHistoryBase = prevHistory.slice(0, historyPointer + 1);
      let finalHistory = [...newHistoryBase, newHistoryEntry];
      if (finalHistory.length > MAX_HISTORY_LENGTH) {
        finalHistory = finalHistory.slice(finalHistory.length - MAX_HISTORY_LENGTH);
      }
      setHistoryPointer(finalHistory.length -1);
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

  const handleExportLayout = () => {
    if (typeof window === 'undefined') return;
    try {
      const jsonString = JSON.stringify(widgets, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = 'dashboard-layout.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
      console.log("Dashboard layout exported.");
    } catch (error) {
      console.error("Error exporting layout:", error);
      alert("Error exporting layout. See console for details.");
    }
  };

  const handleImportLayout = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (typeof window === 'undefined') return;
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("Failed to read file content.");
        }
        const importedWidgets = JSON.parse(text) as PageWidgetConfig[];
        if (Array.isArray(importedWidgets)) {
          if (importedWidgets.length > 0) {
            const firstWidget = importedWidgets[0];
            if (typeof firstWidget.id !== 'string' || typeof firstWidget.type !== 'string' ||
                typeof firstWidget.colStart !== 'number' || typeof firstWidget.rowStart !== 'number' ||
                typeof firstWidget.colSpan !== 'number' || typeof firstWidget.rowSpan !== 'number') {
                  throw new Error("Imported file has an invalid widget structure.");
                }
          }
          setWidgets(importedWidgets);
          setHistory([JSON.parse(JSON.stringify(importedWidgets))]);
          setHistoryPointer(0);
          setActiveWidgetId(null);
          setMaximizedWidgetId(null);
          console.log("Dashboard layout imported successfully.");
          alert("Dashboard layout imported successfully!");
        } else {
          throw new Error("Invalid file format: Expected an array of widgets.");
        }
      } catch (err: any) {
        console.error("Error importing layout:", err);
        alert(`Error importing layout: ${err.message || 'Invalid file content.'}`);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.onerror = () => {
        alert("Error reading file.");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
    };
    reader.readAsText(file);
  };

  const triggerImportFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // --- Helper function to check for rectangle overlap (NEW - More Robust) ---
  const doRectanglesOverlap = (
    r1Col: number, r1Row: number, r1ColSpan: number, r1RowSpan: number, // Rectangle 1 (e.g., new widget)
    r2Col: number, r2Row: number, r2ColSpan: number, r2RowSpan: number, // Rectangle 2 (e.g., existing widget)
    buffer: number = 0 // Buffer around r2
  ): boolean => {
    // Calculate the actual end columns and rows for r1
    const r1ActualColEnd = r1Col + r1ColSpan - 1;
    const r1ActualRowEnd = r1Row + r1RowSpan - 1;

    // Calculate buffered start and end for r2
    // The buffer effectively expands r2 for collision checking.
    const r2BufferedColStart = Math.max(1, r2Col - buffer);
    const r2BufferedRowStart = Math.max(1, r2Row - buffer);
    const r2BufferedColEnd = Math.min(widgetContainerCols > 0 ? widgetContainerCols : Infinity, r2Col + r2ColSpan - 1 + buffer);
    const r2BufferedRowEnd = Math.min(widgetContainerRows > 0 ? widgetContainerRows : Infinity, r2Row + r2RowSpan - 1 + buffer);

    // Check for overlap
    const horizontalOverlap = r1Col <= r2BufferedColEnd && r1ActualColEnd >= r2BufferedColStart;
    const verticalOverlap = r1Row <= r2BufferedRowEnd && r1ActualRowEnd >= r2BufferedRowStart;
    
    return horizontalOverlap && verticalOverlap;
  };


  // --- Function to find the next available position (Improved - NEW) ---
  const findNextAvailablePosition = (placingColSpan: number, placingRowSpan: number): { colStart: number, rowStart: number } | null => {
    if (widgetContainerCols === 0 || widgetContainerRows === 0) {
        console.warn("Grid dimensions not yet available for placement.");
        return null; // Grid not ready
    }

    // Iterate through each possible starting cell (top-to-bottom, left-to-right)
    for (let r = 1; r <= widgetContainerRows; r++) {
      for (let c = 1; c <= widgetContainerCols; c++) {
        // Check 1: Does the new widget fit within grid boundaries if placed at (r, c)?
        if (r + placingRowSpan - 1 > widgetContainerRows || c + placingColSpan - 1 > widgetContainerCols) {
          // If it overflows columns from this starting point 'c', no need to check further in this row.
          if (c + placingColSpan - 1 > widgetContainerCols) break; 
          continue; // Try next row if it overflows rows from this 'c'
        }

        // Check 2: Does it collide with any existing widgets (considering buffer)?
        let collision = false;
        for (const existingWidget of widgets) {
          if (doRectanglesOverlap(
            c, r, placingColSpan, placingRowSpan, // New widget's potential area
            existingWidget.colStart, existingWidget.rowStart, existingWidget.colSpan, existingWidget.rowSpan, // Existing widget's area
            WIDGET_PLACEMENT_BUFFER // Buffer around existing widgets
          )) {
            collision = true;
            break; // Collision found with an existing widget
          }
        }

        if (!collision) {
          return { colStart: c, rowStart: r }; // Found a valid spot
        }
      }
    }
    return null; // No suitable spot found on the entire grid
  };


  // --- Add New Widget Handler (Updated to use new placement logic) ---
  const handleAddNewWidget = (widgetType: WidgetType) => {
    if (maximizedWidgetId) return; 

    const blueprint = AVAILABLE_WIDGET_DEFINITIONS.find(def => def.type === widgetType);
    if (!blueprint) {
      console.error(`No blueprint found for widget type: ${widgetType}`);
      alert(`Widget type "${widgetType}" is not available.`);
      return;
    }

    const { defaultColSpan, defaultRowSpan } = blueprint;
    if (widgetContainerCols === 0 || widgetContainerRows === 0) {
        alert("Grid not fully initialized. Please wait a moment and try again.");
        return;
    }

    const position = findNextAvailablePosition(defaultColSpan, defaultRowSpan);

    if (!position) { // Check if a valid position was found
      alert("No available space on the dashboard to add this widget with its default size. Try making some space or reducing widget sizes.");
      return; // Do not add the widget
    }

    const newWidget: PageWidgetConfig = {
      id: `${blueprint.type}-${Date.now()}`, 
      title: blueprint.defaultTitle,
      type: blueprint.type,
      colStart: position.colStart, // Use found position
      rowStart: position.rowStart, // Use found position
      colSpan: defaultColSpan,
      rowSpan: defaultRowSpan,
      settings: JSON.parse(JSON.stringify(blueprint.defaultSettings)), 
      isMinimized: false,
    };

    updateWidgetsAndPushToHistory([...widgets, newWidget], 'add_widget');
    console.log(`Added new widget: ${newWidget.title} at ${position.colStart},${position.rowStart}`);
  };

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

  const handleUndo = () => {
    if (historyPointer > 0) {
      isPerformingUndoRedo.current = true;
      const newPointer = historyPointer - 1;
      setHistoryPointer(newPointer);
      const historicWidgets = JSON.parse(JSON.stringify(history[newPointer]));
      setWidgets(historicWidgets);
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
      const historicWidgets = JSON.parse(JSON.stringify(history[newPointer]));
      setWidgets(historicWidgets);
      setActiveWidgetId(null);
      setMaximizedWidgetId(null);
      requestAnimationFrame(() => { isPerformingUndoRedo.current = false; });
    }
  };

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

  if (widgetContainerCols === 0 || widgetContainerRows === 0) {
    return <div className="w-full h-screen bg-page-background flex items-center justify-center text-page-foreground">Loading Dashboard...</div>;
  }

  return (
    <main
      className="w-full h-screen bg-page-background text-page-foreground overflow-hidden relative flex flex-col"
      onClick={(e) => { if (e.target === e.currentTarget && !maximizedWidgetId) setActiveWidgetId(null);}}
    >
      <header ref={headerRef} className="p-3 bg-dark-surface text-primary flex items-center justify-between shadow-lg z-40 shrink-0 border-b border-[var(--dark-border-interactive)]">
        <div className="flex items-center space-x-2">
          <button onClick={handleUndo} disabled={historyPointer === 0 || !!maximizedWidgetId} className="control-button" aria-label="Undo"><UndoIcon /></button>
          <button onClick={handleRedo} disabled={historyPointer >= history.length - 1 || !!maximizedWidgetId} className="control-button" aria-label="Redo"><RedoIcon /></button>
          <button onClick={handleExportLayout} disabled={!!maximizedWidgetId} className="control-button" aria-label="Export Layout"><ExportIcon /></button>
          <button onClick={triggerImportFileSelect} disabled={!!maximizedWidgetId} className="control-button" aria-label="Import Layout"><ImportIcon /></button>
          <button onClick={() => handleAddNewWidget('clock')} disabled={!!maximizedWidgetId} className="control-button text-xs px-2" aria-label="Add Clock Widget">Add Clock</button>
          <button onClick={() => handleAddNewWidget('weather')} disabled={!!maximizedWidgetId} className="control-button text-xs px-2" aria-label="Add Weather Widget">Add Weather</button>
          <button onClick={() => handleAddNewWidget('calculator')} disabled={!!maximizedWidgetId} className="control-button text-xs px-2" aria-label="Add Calc Widget">Add Calc</button>
          <input type="file" ref={fileInputRef} onChange={handleImportLayout} accept=".json" style={{ display: 'none' }} />
        </div>
        <div className="text-xs text-secondary px-3 py-1 bg-slate-700 rounded-md">History: {historyPointer + 1} / {history.length}</div>
      </header>

      {maximizedWidgetId && ( <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={() => maximizedWidgetId && handleWidgetMaximizeToggle(maximizedWidgetId)} /> )}

      <div className={`flex-grow relative ${maximizedWidgetId ? 'pointer-events-none' : ''}`}>
        <GridBackground />
        <div className="absolute inset-0 grid gap-0" style={{ gridTemplateColumns: `repeat(${widgetContainerCols}, ${CELL_SIZE}px)`, gridTemplateRows: `repeat(${widgetContainerRows}, ${CELL_SIZE}px)`, alignContent: 'start' }}>
          {widgets.map((widgetConfig) => {
            if (maximizedWidgetId && maximizedWidgetId !== widgetConfig.id) return null;
            const currentWidgetState = maximizedWidgetId === widgetConfig.id && maximizedWidgetOriginalState ? maximizedWidgetOriginalState : widgetConfig;
            const blueprint = AVAILABLE_WIDGET_DEFINITIONS.find(def => def.type === widgetConfig.type);
            let minCol = blueprint?.minColSpan || 3;
            let minRow = blueprint?.minRowSpan || 3;
            if (widgetConfig.isMinimized) { minCol = widgetConfig.colSpan; minRow = MINIMIZED_WIDGET_ROW_SPAN; }
            return (
              <Widget
                key={widgetConfig.id} id={widgetConfig.id} title={widgetConfig.title}
                colStart={currentWidgetState.colStart} rowStart={currentWidgetState.rowStart}
                colSpan={currentWidgetState.colSpan} rowSpan={currentWidgetState.rowSpan}
                onResize={handleWidgetResizeLive} onResizeEnd={handleWidgetResizeEnd} onMove={handleWidgetMove}
                onDelete={handleWidgetDelete} onFocus={handleWidgetFocus} onOpenSettings={handleOpenWidgetSettings}
                isActive={widgetConfig.id === activeWidgetId && !maximizedWidgetId} CELL_SIZE={CELL_SIZE}
                minColSpan={minCol} minRowSpan={minRow}
                totalGridCols={widgetContainerCols} totalGridRows={widgetContainerRows}
                isMinimized={widgetConfig.isMinimized} onMinimizeToggle={() => handleWidgetMinimizeToggle(widgetConfig.id)}
                isMaximized={maximizedWidgetId === widgetConfig.id} onMaximizeToggle={() => handleWidgetMaximizeToggle(widgetConfig.id)}
              >
                {renderWidgetContent(widgetConfig)}
              </Widget>
            );
          })}
        </div>
      </div>
      {isSettingsModalOpen && selectedWidgetForSettings && ( <SettingsModal isOpen={isSettingsModalOpen} onClose={handleCloseSettingsModal} title={selectedWidgetForSettings.title} settingsContent={getSettingsPanelForWidget(selectedWidgetForSettings)} /> )}
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
