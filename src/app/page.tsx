// src/app/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Widget, { WidgetResizeDataType, WidgetMoveDataType } from "@/components/Widget";
import GridBackground from "@/components/GridBackground";
import SettingsModal from '@/components/SettingsModal';
import WeatherWidget, { WeatherSettingsPanel, WeatherWidgetSettings } from "@/components/WeatherWidget";
import ClockWidget, { ClockSettingsPanel, ClockWidgetSettings } from "@/components/ClockWidget";
import CalculatorWidget, { CalculatorSettingsPanel, CalculatorWidgetSettings } from "@/components/CalculatorWidget";

import NotesWidget, { 
    NotesSettingsPanel, 
    NotesWidgetSettings as PageInstanceNotesSettings,
    Note
} from "@/components/NotesWidget";

// Import TodoWidget components
import TodoWidget, { TodoSettingsPanel, TodoWidgetSettings, TodoItem } from "@/components/TodoWidget";


// --- Icons ---
const UndoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>;
const RedoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"> <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" /> </svg>;
const ExportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"> <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75v6.75m0 0l-3-3m3 3l3-3m-8.25 6a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /> </svg>;
const ImportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"> <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /> </svg>;
const AddIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /> </svg>;
const WeatherIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-blue-400"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.158 0a.75.75 0 10-1.5 0 .75.75 0 001.5 0z" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-purple-400"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CalculatorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-green-400"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM9 7.5h6m2.25 0V21H5.25V7.5M3 12h18M3 12a9 9 0 0018 0M3 12a9 9 0 0118 0m0 0V6a3 3 0 00-3-3H6a3 3 0 00-3 3v6c0 1.291.398 2.507 1.074 3.508M17.25 12V6" /></svg>;
const TodoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-yellow-400"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const NotesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-indigo-400"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>;

// --- Constants ---
const CELL_SIZE = 30;
const MAX_HISTORY_LENGTH = 50;
const MINIMIZED_WIDGET_ROW_SPAN = 2;
const DASHBOARD_LAYOUT_STORAGE_KEY = 'dashboardLayoutV3.1'; // Updated version
const GLOBAL_NOTES_STORAGE_KEY = 'dashboardGlobalNotesCollection_v1';
const GLOBAL_TODOS_STORAGE_KEY = 'dashboardGlobalSingleTodoList_v1'; // Key for the single global todo list
const DATA_SAVE_DEBOUNCE_MS = 700;

// --- Interfaces ---
export type AllWidgetSettings = WeatherWidgetSettings | TodoWidgetSettings | ClockWidgetSettings | CalculatorWidgetSettings | PageInstanceNotesSettings | Record<string, any>;
export type WidgetType = 'weather' | 'todo' | 'clock' | 'calculator' | 'notes' | 'generic';

export interface PageWidgetConfig {
  id: string;
  title: string;
  type: WidgetType;
  colStart: number;
  rowStart: number;
  colSpan: number;
  rowSpan: number;
  settings?: AllWidgetSettings;
  isMinimized?: boolean;
  originalRowSpan?: number;
}

interface NotesCollectionStorage {
    notes: Note[];
    activeNoteId: string | null;
}

// TodoItem is imported from TodoWidget.tsx, no need for TodoCollectionsStorage here anymore

interface WidgetBlueprint {
  type: WidgetType;
  defaultTitle: string;
  displayName?: string;
  description?: string;
  icon?: React.FC;
  defaultColSpan: number;
  defaultRowSpan: number;
  minColSpan?: number;
  minRowSpan?: number;
  defaultSettings: AllWidgetSettings | undefined;
}

const AVAILABLE_WIDGET_DEFINITIONS: WidgetBlueprint[] = [
  { type: 'weather', defaultTitle: 'New Weather', displayName: 'Weather', description: "Live weather updates and forecasts.", icon: WeatherIcon, defaultColSpan: 12, defaultRowSpan: 14, minColSpan: 6, minRowSpan: 8, defaultSettings: { location: '97504 US', units: 'imperial', useCurrentLocation: false } },
  { type: 'clock', defaultTitle: 'New Clock', displayName: 'Clock', description: "Analog or digital world clock.", icon: ClockIcon, defaultColSpan: 8, defaultRowSpan: 8, minColSpan: 4, minRowSpan: 4, defaultSettings: { displayType: 'digital', showSeconds: true, hourFormat: '12' } },
  { type: 'calculator', defaultTitle: 'New Calculator', displayName: 'Calculator', description: "Perform quick calculations.", icon: CalculatorIcon, defaultColSpan: 12, defaultRowSpan: 18, minColSpan: 4, minRowSpan: 6, defaultSettings: {} },
  { type: 'todo', defaultTitle: 'Global To-Do List', displayName: 'To-Do List', description: "Organize your tasks.", icon: TodoIcon, defaultColSpan: 15, defaultRowSpan: 12, minColSpan: 5, minRowSpan: 6, defaultSettings: { showCompleted: true, sortBy: 'createdAt_desc', defaultFilter: 'all' } },
  { type: 'notes', defaultTitle: 'New Note Pad', displayName: 'Notes', description: "Jot down quick notes and ideas.", icon: NotesIcon, defaultColSpan: 15, defaultRowSpan: 15, minColSpan: 6, minRowSpan: 6, defaultSettings: { fontSize: 'base' } },
];

const initialWidgetsLayout: PageWidgetConfig[] = [
  { "id": "weather-widget-main", "title": "Medford Weather", "type": "weather", "colStart": 3, "rowStart": 3, "colSpan": 10, "rowSpan": 14, "settings": { "location": "97504 US", "units": "imperial", "useCurrentLocation": false }, "isMinimized": false },
  { "id": "notes-widget-default", "title": "My Notes", "type": "notes", "colStart": 14, "rowStart": 3, "colSpan": 15, "rowSpan": 15, "settings": { "fontSize": "base" }, "isMinimized": false },
  { "id": "todo-widget-global", "title": "Shared Tasks", "type": "todo", "colStart": 30, "rowStart": 3, "colSpan": 8, "rowSpan": 10, "settings": { "showCompleted": true, "sortBy": "createdAt_desc", "defaultFilter": "all" }, "isMinimized": false },
];

export default function Home() {
  const [widgetContainerCols, setWidgetContainerCols] = useState(0);
  const [widgetContainerRows, setWidgetContainerRows] = useState(0);
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);
  const [widgets, setWidgets] = useState<PageWidgetConfig[]>(() => JSON.parse(JSON.stringify(initialWidgetsLayout)));
  
  const [sharedNotes, setSharedNotes] = useState<Note[]>([]);
  const [activeSharedNoteId, setActiveSharedNoteId] = useState<string | null>(null);
  const notesSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Centralized State for a SINGLE Global To-Do List ---
  const [sharedTodos, setSharedTodos] = useState<TodoItem[]>([]); // Now a single array
  const todosSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);


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
  const [isAddWidgetMenuOpen, setIsAddWidgetMenuOpen] = useState(false);
  const addWidgetMenuRef = useRef<HTMLDivElement>(null);

  // Load Dashboard Layout
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let layoutToUse = JSON.parse(JSON.stringify(initialWidgetsLayout));
      try {
        const savedLayoutJSON = window.localStorage.getItem(DASHBOARD_LAYOUT_STORAGE_KEY);
        if (savedLayoutJSON) {
          const loadedWidgets = JSON.parse(savedLayoutJSON) as PageWidgetConfig[];
          if (Array.isArray(loadedWidgets) && (loadedWidgets.length === 0 || (loadedWidgets[0] && typeof loadedWidgets[0].id === 'string'))) {
            layoutToUse = loadedWidgets;
          }
        }
      } catch (error) { console.error("Error loading dashboard layout from localStorage:", error); }
      setWidgets(layoutToUse);
      setHistory([JSON.parse(JSON.stringify(layoutToUse))]);
      setHistoryPointer(0);
      initialLoadAttempted.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save Dashboard Layout
  useEffect(() => {
    if (typeof window !== 'undefined' && initialLoadAttempted.current) {
      try {
        window.localStorage.setItem(DASHBOARD_LAYOUT_STORAGE_KEY, JSON.stringify(widgets));
      } catch (error) { console.error("Error saving dashboard layout to localStorage:", error); }
    }
  }, [widgets]);

  // Load Global Notes Data
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const savedNotesJSON = localStorage.getItem(GLOBAL_NOTES_STORAGE_KEY);
        let notesToSet: Note[] = [];
        let activeIdToSet: string | null = null;
        if (savedNotesJSON) {
            try {
                const notesCollection: NotesCollectionStorage = JSON.parse(savedNotesJSON);
                notesToSet = notesCollection.notes || [];
                activeIdToSet = notesCollection.activeNoteId || null;
                if (activeIdToSet && !notesToSet.some(n => n.id === activeIdToSet)) activeIdToSet = null;
            } catch (e) { console.error("Error parsing global notes from localStorage:", e); }
        }
        if (notesToSet.length === 0) {
            const defaultNoteId = `note-${Date.now()}-default`;
            notesToSet = [{ id: defaultNoteId, title: "My First Note", content: "<p>Welcome to your notes!</p>", lastModified: Date.now() }];
            activeIdToSet = defaultNoteId;
        } else if (!activeIdToSet && notesToSet.length > 0) {
            activeIdToSet = notesToSet.sort((a, b) => b.lastModified - a.lastModified)[0].id;
        }
        setSharedNotes(notesToSet);
        setActiveSharedNoteId(activeIdToSet);
    }
  }, []);

  // Debounced Save for Global Notes Data
  useEffect(() => {
    if (typeof window !== 'undefined') {
        if (notesSaveTimeoutRef.current) clearTimeout(notesSaveTimeoutRef.current);
        if (sharedNotes.length > 0 || activeSharedNoteId !== null) { 
            notesSaveTimeoutRef.current = setTimeout(() => {
                try {
                    const notesCollection: NotesCollectionStorage = { notes: sharedNotes, activeNoteId: activeSharedNoteId };
                    localStorage.setItem(GLOBAL_NOTES_STORAGE_KEY, JSON.stringify(notesCollection));
                } catch (e) { console.error("Error saving global notes to localStorage:", e); }
            }, DATA_SAVE_DEBOUNCE_MS);
        }
        return () => { if (notesSaveTimeoutRef.current) clearTimeout(notesSaveTimeoutRef.current); };
    }
  }, [sharedNotes, activeSharedNoteId]);

  // Load Global SINGLE To-Do List
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const savedTodosJSON = localStorage.getItem(GLOBAL_TODOS_STORAGE_KEY);
        if (savedTodosJSON) {
            try {
                const loadedTodos = JSON.parse(savedTodosJSON) as TodoItem[];
                setSharedTodos(Array.isArray(loadedTodos) ? loadedTodos : []);
            } catch (e) {
                console.error("Error parsing global to-do list from localStorage:", e);
                setSharedTodos([]);
            }
        } else {
             // Initialize with a default task if the list is empty/not found
            setSharedTodos([
                { id: `todo-${Date.now()}-welcome`, text: "Welcome to your global to-do list!", completed: false, createdAt: Date.now() }
            ]);
        }
    }
  }, []);

  // Debounced Save for Global SINGLE To-Do List
  useEffect(() => {
    if (typeof window !== 'undefined') {
        if (todosSaveTimeoutRef.current) clearTimeout(todosSaveTimeoutRef.current);
        // Always save the current state of sharedTodos, even if it's an empty array.
        todosSaveTimeoutRef.current = setTimeout(() => {
            try {
                localStorage.setItem(GLOBAL_TODOS_STORAGE_KEY, JSON.stringify(sharedTodos));
            } catch (e) { console.error("Error saving global to-do list to localStorage:", e); }
        }, DATA_SAVE_DEBOUNCE_MS);
        
        return () => { if (todosSaveTimeoutRef.current) clearTimeout(todosSaveTimeoutRef.current); };
    }
  }, [sharedTodos]);


  useEffect(() => { 
    const handleClickOutside = (event: MouseEvent) => {
      if (addWidgetMenuRef.current && !addWidgetMenuRef.current.contains(event.target as Node)) setIsAddWidgetMenuOpen(false);
    };
    if (isAddWidgetMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    else document.removeEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAddWidgetMenuOpen]);

  const updateWidgetsAndPushToHistory = useCallback((newWidgetsState: PageWidgetConfig[], actionType?: string) => {
    if (isPerformingUndoRedo.current && actionType !== 'undo_redo') return;
    const newHistoryEntry = JSON.parse(JSON.stringify(newWidgetsState));
    setHistory(prevHistory => {
      const newHistoryBase = prevHistory.slice(0, historyPointer + 1);
      let finalHistory = [...newHistoryBase, newHistoryEntry];
      if (finalHistory.length > MAX_HISTORY_LENGTH) finalHistory = finalHistory.slice(finalHistory.length - MAX_HISTORY_LENGTH);
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
    return () => { clearTimeout(timeoutId); window.removeEventListener('resize', determineWidgetContainerGridSize); };
  }, []);

  const handleExportLayout = () => {
    if (typeof window === 'undefined') return;
    try {
      const layoutToExport = {
        dashboardVersion: "3.1-global-single-todo-list", // Updated version
        widgets: widgets,
        notesCollection: { notes: sharedNotes, activeNoteId: activeSharedNoteId },
        sharedGlobalTodos: sharedTodos // Export the single global list
      };
      const jsonString = JSON.stringify(layoutToExport, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = 'dashboard-layout-with-global-todos.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
    } catch (error) { console.error("Error exporting layout:", error); alert("Error exporting layout."); }
  };

  const handleImportLayout = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (typeof window === 'undefined') return;
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("Failed to read file content.");
        
        const importedData = JSON.parse(text);
        let widgetsToImport: PageWidgetConfig[] = [];
        let notesToImport: Note[] = [];
        let activeNoteIdToImport: string | null = null;
        let globalTodosToImport: TodoItem[] = [];

        if (importedData.dashboardVersion === "3.1-global-single-todo-list" && importedData.widgets) {
            widgetsToImport = importedData.widgets;
            if (importedData.notesCollection) {
                notesToImport = importedData.notesCollection.notes || [];
                activeNoteIdToImport = importedData.notesCollection.activeNoteId || null;
            }
            if (importedData.sharedGlobalTodos && Array.isArray(importedData.sharedGlobalTodos)) {
                globalTodosToImport = importedData.sharedGlobalTodos;
            }
            alert("Dashboard layout, notes, and global to-do list (v3.1) imported successfully!");
        } else if (importedData.dashboardVersion === "3.0-global-todos" && importedData.widgets && importedData.todoCollections) {
            // Handle previous version with instance-specific todos, convert first list or keep separate?
            // For simplicity, we'll inform the user and not automatically merge.
            // Or, we could attempt to merge all lists into one, or pick the first one.
            // For now, let's just load the widgets and notes. User can manually re-create todos if needed from old export.
            widgetsToImport = importedData.widgets;
             if (importedData.notesCollection) {
                notesToImport = importedData.notesCollection.notes || [];
                activeNoteIdToImport = importedData.notesCollection.activeNoteId || null;
            }
            alert("Imported layout (v3.0) with instance-specific todos. This version uses a single global to-do list. Please manage tasks in the new global list.");
        } else if (importedData.dashboardVersion === "2.0-central-notes" && importedData.widgets && importedData.notesCollection) {
            widgetsToImport = importedData.widgets;
            notesToImport = importedData.notesCollection.notes || [];
            activeNoteIdToImport = importedData.notesCollection.activeNoteId || null;
            alert("Dashboard layout and notes (v2.0) imported. To-do lists were not part of this version's global export.");
        } else if (Array.isArray(importedData)) { 
            widgetsToImport = importedData;
            alert("Dashboard layout (legacy format) imported. Notes and To-dos were not part of this import.");
        } else {
            throw new Error("Invalid file format. Could not recognize dashboard structure.");
        }

        if (widgetsToImport.length > 0 && typeof widgetsToImport[0].id !== 'string') {
            throw new Error("Imported widget data seems invalid.");
        }
        
        setWidgets(widgetsToImport);
        updateWidgetsAndPushToHistory(widgetsToImport, 'import');

        if (notesToImport.length > 0 || activeNoteIdToImport !== null || importedData.dashboardVersion?.includes("notes")) {
          setSharedNotes(notesToImport);
          setActiveSharedNoteId(activeNoteIdToImport);
        }
        if (globalTodosToImport.length > 0 || importedData.dashboardVersion === "3.1-global-single-todo-list") {
            setSharedTodos(globalTodosToImport);
        }

        setActiveWidgetId(null); setMaximizedWidgetId(null);
      } catch (err: any) { console.error("Error importing layout:", err); alert(`Error importing layout: ${err.message || 'Invalid file content.'}`); }
      finally { if (fileInputRef.current) fileInputRef.current.value = ""; }
    };
    reader.onerror = () => { alert("Error reading file."); if (fileInputRef.current) fileInputRef.current.value = ""; };
    reader.readAsText(file);
  };

  const triggerImportFileSelect = () => { if (fileInputRef.current) fileInputRef.current.click(); };
  
  const doRectanglesOverlap = (r1Col: number,r1Row: number,r1ColSpan: number,r1RowSpan: number,r2Col: number,r2Row: number,r2ColSpan: number,r2RowSpan: number,buffer: number = 0): boolean => {
    const r1ActualColEnd = r1Col + r1ColSpan - 1; const r1ActualRowEnd = r1Row + r1RowSpan - 1;
    const r2BufferedColStart = Math.max(1, r2Col - buffer); const r2BufferedRowStart = Math.max(1, r2Row - buffer);
    const r2BufferedColEnd = Math.min(widgetContainerCols > 0 ? widgetContainerCols : Infinity, r2Col + r2ColSpan - 1 + buffer);
    const r2BufferedRowEnd = Math.min(widgetContainerRows > 0 ? widgetContainerRows : Infinity, r2Row + r2RowSpan - 1 + buffer);
    return r1Col <= r2BufferedColEnd && r1ActualColEnd >= r2BufferedColStart && r1Row <= r2BufferedRowEnd && r1ActualRowEnd >= r2BufferedRowStart;
  };

  const findNextAvailablePosition = (placingColSpan: number, placingRowSpan: number): { colStart: number, rowStart: number } | null => {
    if (widgetContainerCols === 0 || widgetContainerRows === 0) return null;
    for (let r = 1; r <= widgetContainerRows; r++) {
      for (let c = 1; c <= widgetContainerCols; c++) {
        if (r + placingRowSpan - 1 > widgetContainerRows || c + placingColSpan - 1 > widgetContainerCols) {
          if (c + placingColSpan - 1 > widgetContainerCols) break; continue;
        }
        let collision = false;
        for (const existingWidget of widgets) {
          if (doRectanglesOverlap(c, r, placingColSpan, placingRowSpan, existingWidget.colStart, existingWidget.rowStart, existingWidget.colSpan, existingWidget.rowSpan, 1)) {
            collision = true; break;
          }
        }
        if (!collision) return { colStart: c, rowStart: r };
      }
    }
    return null;
  };

  const handleAddNewWidget = (widgetType: WidgetType) => {
    if (maximizedWidgetId) return; 
    const blueprint = AVAILABLE_WIDGET_DEFINITIONS.find(def => def.type === widgetType);
    if (!blueprint) { alert(`Widget type "${widgetType}" is not available.`); setIsAddWidgetMenuOpen(false); return; }
    const { defaultColSpan, defaultRowSpan } = blueprint;
    if (widgetContainerCols === 0 || widgetContainerRows === 0) { alert("Grid not fully initialized."); setIsAddWidgetMenuOpen(false); return; }
    const position = findNextAvailablePosition(defaultColSpan, defaultRowSpan);
    if (!position) { alert("No available space to add this widget."); setIsAddWidgetMenuOpen(false); return; }
    const newWidgetId = `${blueprint.type}-${Date.now()}`;
    const newWidget: PageWidgetConfig = {
      id: newWidgetId, title: blueprint.defaultTitle, type: blueprint.type,
      colStart: position.colStart, rowStart: position.rowStart, colSpan: defaultColSpan, rowSpan: defaultRowSpan,
      settings: JSON.parse(JSON.stringify(blueprint.defaultSettings || {})), isMinimized: false,
    };
    updateWidgetsAndPushToHistory([...widgets, newWidget], 'add_widget');
    // No need to initialize sharedTodos for new 'todo' widgets as they all use the global list.
    setIsAddWidgetMenuOpen(false);
  };

  const handleWidgetResizeLive = (id: string, newGeometry: WidgetResizeDataType) => {
    if (isPerformingUndoRedo.current || maximizedWidgetId) return;
    setWidgets(currentWidgets => currentWidgets.map(w => w.id === id ? { ...w, ...newGeometry, isMinimized: false } : w));
  };
  const handleWidgetResizeEnd = (id: string, finalGeometry: WidgetResizeDataType) => {
    if (maximizedWidgetId) return;
    const newWidgetsState = widgets.map(w => w.id === id ? { ...w, ...finalGeometry, isMinimized: false, originalRowSpan: undefined } : w);
    updateWidgetsAndPushToHistory(newWidgetsState, 'resize_end'); setActiveWidgetId(id);
  };
  const handleWidgetMove = (id: string, newPosition: WidgetMoveDataType) => {
    if (maximizedWidgetId) return;
    const currentWidget = widgets.find(w => w.id === id);
    if (!currentWidget) return;
    if (currentWidget.colStart !== newPosition.colStart || currentWidget.rowStart !== newPosition.rowStart) {
        const newWidgetsState = widgets.map(w => w.id === id ? { ...w, ...newPosition } : w);
        updateWidgetsAndPushToHistory(newWidgetsState, 'move');
    }
    setActiveWidgetId(id);
  };
  const handleWidgetDelete = (idToDelete: string) => {
    if (maximizedWidgetId === idToDelete) setMaximizedWidgetId(null);
    const newWidgetsState = widgets.filter(widget => widget.id !== idToDelete);
    updateWidgetsAndPushToHistory(newWidgetsState, 'delete');
    // No need to delete from sharedTodos as it's a global list, not instance-specific.
    if (activeWidgetId === idToDelete) setActiveWidgetId(null);
  };
  const handleWidgetFocus = (id: string) => {
    if (maximizedWidgetId && maximizedWidgetId !== id) return;
    setActiveWidgetId(id);
  };
  const handleOpenWidgetSettings = (widgetId: string) => {
    if (maximizedWidgetId && maximizedWidgetId !== widgetId) return;
    const widgetToEdit = widgets.find(w => w.id === widgetId);
    if (widgetToEdit) { setSelectedWidgetForSettings(widgetToEdit); setIsSettingsModalOpen(true); }
  };
  const handleCloseSettingsModal = () => { setIsSettingsModalOpen(false); setSelectedWidgetForSettings(null); };
  const handleSaveWidgetInstanceSettings = (widgetId: string, newInstanceSettings: AllWidgetSettings) => {
    const newWidgetsState = widgets.map(w =>
        w.id === widgetId ? { ...w, settings: { ...(w.settings || {}), ...newInstanceSettings } } : w
    );
    updateWidgetsAndPushToHistory(newWidgetsState, 'save_widget_settings');
    handleCloseSettingsModal();
  };
  const handleWidgetMinimizeToggle = (widgetId: string) => {
    if (maximizedWidgetId) return;
    const newWidgetsState = widgets.map(w => {
      if (w.id === widgetId) {
        if (w.isMinimized) return { ...w, isMinimized: false, rowSpan: w.originalRowSpan || w.rowSpan, originalRowSpan: undefined };
        else return { ...w, isMinimized: true, originalRowSpan: w.rowSpan, rowSpan: MINIMIZED_WIDGET_ROW_SPAN };
      } return w;
    });
    updateWidgetsAndPushToHistory(newWidgetsState, 'minimize_toggle'); setActiveWidgetId(widgetId);
  };
  const handleWidgetMaximizeToggle = (widgetId: string) => {
    const widgetToToggle = widgets.find(w => w.id === widgetId);
    if (!widgetToToggle) return;
    if (maximizedWidgetId === widgetId) { 
        setMaximizedWidgetId(null); setMaximizedWidgetOriginalState(null); setActiveWidgetId(widgetId); 
    } else {
      let originalStateForMaximize = { ...widgetToToggle };
      if (widgetToToggle.isMinimized) originalStateForMaximize = { ...originalStateForMaximize, isMinimized: false, rowSpan: widgetToToggle.originalRowSpan || widgetToToggle.rowSpan };
      setMaximizedWidgetOriginalState(originalStateForMaximize); setMaximizedWidgetId(widgetId); setActiveWidgetId(widgetId);
    }
  };
  const handleUndo = () => {
    if (historyPointer > 0) {
      isPerformingUndoRedo.current = true; const newPointer = historyPointer - 1; setHistoryPointer(newPointer);
      const historicWidgets = JSON.parse(JSON.stringify(history[newPointer])); setWidgets(historicWidgets);
      setActiveWidgetId(null); setMaximizedWidgetId(null); requestAnimationFrame(() => { isPerformingUndoRedo.current = false; });
    }
  };
  const handleRedo = () => {
    if (historyPointer < history.length - 1) {
      isPerformingUndoRedo.current = true; const newPointer = historyPointer + 1; setHistoryPointer(newPointer);
      const historicWidgets = JSON.parse(JSON.stringify(history[newPointer])); setWidgets(historicWidgets);
      setActiveWidgetId(null); setMaximizedWidgetId(null); requestAnimationFrame(() => { isPerformingUndoRedo.current = false; });
    }
  };

  // Callback for TodoWidget to update the single global to-do list
  const handleSharedTodosChange = (newGlobalTodos: TodoItem[]) => {
    setSharedTodos(newGlobalTodos);
  };

  const renderWidgetContent = (widgetConfig: PageWidgetConfig) => {
    switch (widgetConfig.type) {
      case 'weather': return <WeatherWidget id={widgetConfig.id} settings={widgetConfig.settings as WeatherWidgetSettings | undefined} />;
      case 'clock': return <ClockWidget id={widgetConfig.id} settings={widgetConfig.settings as ClockWidgetSettings | undefined} />;
      case 'calculator': return <CalculatorWidget id={widgetConfig.id} settings={widgetConfig.settings as CalculatorWidgetSettings | undefined} />;
      case 'todo': 
        return <TodoWidget 
                    instanceId={widgetConfig.id} // For keys, ARIA, etc.
                    settings={widgetConfig.settings as TodoWidgetSettings | undefined} 
                    todos={sharedTodos} // Pass the single global list
                    onTodosChange={handleSharedTodosChange} // Pass the updater for the global list
                />;
      case 'notes':
        return <NotesWidget
                  instanceId={widgetConfig.id} settings={widgetConfig.settings as PageInstanceNotesSettings | undefined}
                  notes={sharedNotes} activeNoteId={activeSharedNoteId}
                  onNotesChange={setSharedNotes} onActiveNoteIdChange={setActiveSharedNoteId}
               />;
      default: return <p className="text-xs text-secondary italic">Generic widget content.</p>;
    }
  };

  const getSettingsPanelForWidget = (widgetConfig: PageWidgetConfig | null) => {
    if (!widgetConfig) return null;
    const boundSaveInstanceSettings = (newInstanceSettings: AllWidgetSettings) => handleSaveWidgetInstanceSettings(widgetConfig.id, newInstanceSettings);

    switch (widgetConfig.type) {
      case 'weather': return <WeatherSettingsPanel widgetId={widgetConfig.id} currentSettings={widgetConfig.settings as WeatherWidgetSettings | undefined} onSave={boundSaveInstanceSettings} />;
      case 'clock': return <ClockSettingsPanel widgetId={widgetConfig.id} currentSettings={widgetConfig.settings as ClockWidgetSettings | undefined} onSave={boundSaveInstanceSettings} />;
      case 'calculator': return <CalculatorSettingsPanel widgetId={widgetConfig.id} currentSettings={widgetConfig.settings as CalculatorWidgetSettings | undefined} onSave={boundSaveInstanceSettings} />;
      case 'notes':
        return <NotesSettingsPanel
                  widgetInstanceId={widgetConfig.id} currentSettings={widgetConfig.settings as PageInstanceNotesSettings | undefined}
                  onSaveLocalSettings={boundSaveInstanceSettings}
                  onClearAllNotesGlobal={() => {
                      setSharedNotes([]); setActiveSharedNoteId(null);
                      alert("All notes have been cleared from the dashboard.");
                  }}
               />;
      case 'todo':
        return <TodoSettingsPanel
                  widgetId={widgetConfig.id} 
                  currentSettings={widgetConfig.settings as TodoWidgetSettings | undefined}
                  onSave={boundSaveInstanceSettings} // Saves UI/view settings for this instance
                  onClearAllTasks={() => { // Clears the *global* to-do list
                    handleSharedTodosChange([]); 
                    alert(`The global to-do list has been cleared.`);
                  }}
                />;
      default: return <p className="text-sm text-secondary">No specific settings available for this widget type.</p>;
    }
  };

  if (widgetContainerCols === 0 || widgetContainerRows === 0) {
    return <div className="w-full h-screen bg-page-background flex items-center justify-center text-page-foreground">Loading Dashboard...</div>;
  }

  return (
    <main className="w-full h-screen bg-page-background text-page-foreground overflow-hidden relative flex flex-col"
      onClick={(e) => { if (e.target === e.currentTarget && !maximizedWidgetId) setActiveWidgetId(null); }} >
      <header ref={headerRef} className="p-3 bg-dark-surface text-primary flex items-center justify-between shadow-lg z-40 shrink-0 border-b border-[var(--dark-border-interactive)]">
        <div className="flex items-center space-x-2">
          <button onClick={handleUndo} disabled={historyPointer === 0 || !!maximizedWidgetId} className="control-button" aria-label="Undo"><UndoIcon /></button>
          <button onClick={handleRedo} disabled={historyPointer >= history.length - 1 || !!maximizedWidgetId} className="control-button" aria-label="Redo"><RedoIcon /></button>
          <div className="relative" ref={addWidgetMenuRef}>
            <button id="add-widget-button" onClick={() => setIsAddWidgetMenuOpen(prev => !prev)} disabled={!!maximizedWidgetId} className="control-button flex items-center" aria-expanded={isAddWidgetMenuOpen} aria-haspopup="true" aria-label="Add New Widget" > <AddIcon /> <span className="ml-1.5 text-xs hidden sm:inline">Add Widget</span> </button>
            {isAddWidgetMenuOpen && (
              <div className="absolute backdrop-blur-md left-0 mt-2 w-56 origin-top-left rounded-md bg-dark-surface border border-dark-border-interactive shadow-xl py-1 z-50 focus:outline-none animate-modalFadeInScale" role="menu" aria-orientation="vertical" aria-labelledby="add-widget-button" >
                {AVAILABLE_WIDGET_DEFINITIONS.map(widgetDef => (
                  <button key={widgetDef.type} onClick={() => handleAddNewWidget(widgetDef.type)} className="group flex items-center w-full text-left px-3 py-2.5 text-sm text-dark-text-primary hover:bg-dark-accent-primary hover:text-dark-text-on-accent focus:bg-dark-accent-primary focus:text-dark-text-on-accent focus:outline-none transition-all duration-150 ease-in-out hover:pl-4" role="menuitem" disabled={!!maximizedWidgetId} >
                    {widgetDef.icon && <widgetDef.icon />} <span className="flex-grow">{widgetDef.displayName || widgetDef.defaultTitle.replace("New ", "")}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleExportLayout} disabled={!!maximizedWidgetId} className="control-button" aria-label="Export Layout"><ExportIcon /></button>
          <button onClick={triggerImportFileSelect} disabled={!!maximizedWidgetId} className="control-button" aria-label="Import Layout"><ImportIcon /></button>
          <input type="file" ref={fileInputRef} onChange={handleImportLayout} accept=".json" style={{ display: 'none' }} />
        </div>
        <div className="text-xs text-secondary px-3 py-1 bg-slate-700 rounded-md">History: {historyPointer + 1} / {history.length}</div>
      </header>

      {maximizedWidgetId && ( <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30" onClick={() => maximizedWidgetId && handleWidgetMaximizeToggle(maximizedWidgetId)} /> )}

      <div className={`flex-grow relative ${maximizedWidgetId ? 'pointer-events-none' : ''}`}>
        <GridBackground />
        <div className="absolute inset-0 grid gap-0" style={{ gridTemplateColumns: `repeat(${widgetContainerCols}, ${CELL_SIZE}px)`, gridTemplateRows: `repeat(${widgetContainerRows}, ${CELL_SIZE}px)`, alignContent: 'start' }}>
          {widgets.map((widgetConfig) => {
            if (maximizedWidgetId && maximizedWidgetId !== widgetConfig.id) return null;
            const currentWidgetState = maximizedWidgetId === widgetConfig.id && maximizedWidgetOriginalState ? { ...maximizedWidgetOriginalState, colStart: 1, rowStart: 1, colSpan: widgetContainerCols > 2 ? widgetContainerCols - 2 : widgetContainerCols, rowSpan: widgetContainerRows > 2 ? widgetContainerRows - 2 : widgetContainerRows, } : widgetConfig;
            const blueprint = AVAILABLE_WIDGET_DEFINITIONS.find(def => def.type === widgetConfig.type);
            let minCol = blueprint?.minColSpan || 3; let minRow = blueprint?.minRowSpan || 3;
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

// Styles for control buttons
const styles = `
  .control-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem; 
    background-color: var(--dark-accent-primary);
    border-radius: 0.375rem; 
    color: var(--dark-text-on-accent);
    transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); 
  }
  .control-button:hover {
    background-color: var(--dark-accent-primary-hover);
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1); 
  }
  .control-button:disabled {
    background-color: hsl(222, 47%, 25%); 
    color: hsl(215, 20%, 55%); 
    cursor: not-allowed;
    box-shadow: none;
  }
  .control-button:focus-visible { 
    outline: 2px solid var(--dark-accent-primary-hover);
    outline-offset: 2px;
  }
`;
if (typeof window !== 'undefined') {
  if (!document.getElementById('custom-dashboard-styles')) {
    const styleSheet = document.createElement("style");
    styleSheet.id = 'custom-dashboard-styles'; styleSheet.type = "text/css";
    styleSheet.innerText = styles; document.head.appendChild(styleSheet);
  }
}
