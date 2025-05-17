// src/app/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Widget, { WidgetResizeDataType, WidgetMoveDataType } from "@/components/Widget";
import GridBackground from "@/components/GridBackground";
import SettingsModal from '@/components/SettingsModal';
import WeatherWidget, { WeatherSettingsPanel, WeatherWidgetSettings } from "@/components/WeatherWidget";
import ClockWidget, { ClockSettingsPanel, ClockWidgetSettings } from "@/components/ClockWidget";
import CalculatorWidget, { CalculatorSettingsPanel, CalculatorWidgetSettings } from "@/components/CalculatorWidget";
import YoutubeWidget, { YoutubeSettingsPanel, YoutubeWidgetSettings } from "@/components/YoutubeWidget";
import NotesWidget, {
    NotesSettingsPanel,
    NotesWidgetSettings as PageInstanceNotesSettings,
    Note
} from "@/components/NotesWidget";
import TodoWidget, { TodoSettingsPanel, TodoWidgetSettings, TodoItem } from "@/components/TodoWidget";
import MinesweeperWidget, { MinesweeperSettingsPanel, MinesweeperWidgetSettings } from "@/components/MinesweeperWidget";
import UnitConverterWidget, { UnitConverterSettingsPanel, UnitConverterWidgetSettings } from "@/components/UnitConverterWidget";
import CountdownStopwatchWidget, { CountdownStopwatchSettingsPanel, CountdownStopwatchWidgetSettings } from "@/components/CountdownStopwatchWidget";
import PhotoWidget, { PhotoSettingsPanel, PhotoWidgetSettings, HistoricImage } from "@/components/PhotoWidget";


// --- Icons (assuming these are defined elsewhere or you'll add them) ---
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
const YoutubeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-red-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113A.375.375 0 019.75 15.113V8.887c0-.286.307-.466.557-.328l5.603 3.113z" />
    </svg>
);
const MinesweeperIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-gray-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047M15.362 5.214A8.252 8.252 0 0012 3a8.25 8.25 0 00-3.362 2.214m6.724 0a3 3 0 01-3.362 0m3.362 0l1.04 1.04m-4.402 0l-1.04 1.04M12 6.75v.008h.008V6.75H12zm0 3.75v.008h.008v-.008H12zm-2.25.75h4.5m-4.5 0a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5z" />
    </svg>
);
const UnitConverterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-teal-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h18M16.5 3L21 7.5m0 0L16.5 12M21 7.5H3" />
    </svg>
);
const CountdownStopwatchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-orange-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-4.073-3.06-7.44-7-7.932V2.25M12 21.75c-1.13 0-2.21-.2-3.2-.57M4.5 12H2.25" />
    </svg>
);
const PhotoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-pink-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.158 0a.75.75 0 10-1.5 0 .75.75 0 001.5 0z" />
    </svg>
);

// --- Constants ---
const CELL_SIZE = 30;
const MAX_HISTORY_LENGTH = 50;
const MINIMIZED_WIDGET_ROW_SPAN = 2;
const DASHBOARD_LAYOUT_STORAGE_KEY = 'dashboardLayoutV3.10'; // Ensure this matches if you have existing stored layouts
const GLOBAL_NOTES_STORAGE_KEY = 'dashboardGlobalNotesCollection_v1';
const GLOBAL_TODOS_STORAGE_KEY = 'dashboardGlobalSingleTodoList_v1';
const GLOBAL_PHOTO_HISTORY_STORAGE_KEY = 'dashboardGlobalPhotoHistory_v1';
const DATA_SAVE_DEBOUNCE_MS = 700;
const WIDGET_DESELECT_TIMEOUT_MS = 3000;

// --- Interfaces ---
export type AllWidgetSettings =
    WeatherWidgetSettings |
    TodoWidgetSettings |
    ClockWidgetSettings |
    CalculatorWidgetSettings |
    PageInstanceNotesSettings |
    YoutubeWidgetSettings |
    MinesweeperWidgetSettings |
    UnitConverterWidgetSettings |
    CountdownStopwatchWidgetSettings |
    PhotoWidgetSettings |
    Record<string, any>;

export type WidgetType =
    'weather' |
    'todo' |
    'clock' |
    'calculator' |
    'notes' |
    'youtube' |
    'minesweeper' |
    'unitConverter' |
    'countdownStopwatch' |
    'photo' |
    'generic';

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

// Default settings for a PhotoWidget instance, now with 'cover'
const PHOTO_WIDGET_DEFAULT_INSTANCE_SETTINGS: PhotoWidgetSettings = {
  imageUrl: null,
  imageName: null,
  objectFit: 'cover', // Changed default to 'cover'
  isSidebarOpen: false
};

const AVAILABLE_WIDGET_DEFINITIONS: WidgetBlueprint[] = [
  { type: 'weather', defaultTitle: 'New Weather', displayName: 'Weather', description: "Live weather updates and forecasts.", icon: WeatherIcon, defaultColSpan: 12, defaultRowSpan: 14, minColSpan: 6, minRowSpan: 8, defaultSettings: { location: '97504 US', units: 'imperial', useCurrentLocation: false } },
  { type: 'clock', defaultTitle: 'New Clock', displayName: 'Clock', description: "Analog or digital world clock.", icon: ClockIcon, defaultColSpan: 8, defaultRowSpan: 8, minColSpan: 4, minRowSpan: 4, defaultSettings: { displayType: 'digital', showSeconds: true, hourFormat: '12' } },
  { type: 'calculator', defaultTitle: 'New Calculator', displayName: 'Calculator', description: "Perform quick calculations.", icon: CalculatorIcon, defaultColSpan: 12, defaultRowSpan: 18, minColSpan: 4, minRowSpan: 6, defaultSettings: {} },
  { type: 'todo', defaultTitle: 'Global To-Do List', displayName: 'To-Do List', description: "Organize your tasks.", icon: TodoIcon, defaultColSpan: 15, defaultRowSpan: 12, minColSpan: 5, minRowSpan: 6, defaultSettings: { showCompleted: true, sortBy: 'createdAt_desc', defaultFilter: 'all' } },
  { type: 'notes', defaultTitle: 'New Note Pad', displayName: 'Notes', description: "Jot down quick notes and ideas.", icon: NotesIcon, defaultColSpan: 15, defaultRowSpan: 15, minColSpan: 6, minRowSpan: 6, defaultSettings: { fontSize: 'base' } },
  { type: 'youtube', defaultTitle: 'YouTube Player', displayName: 'YouTube', description: "Embed YouTube to watch videos.", icon: YoutubeIcon, defaultColSpan: 25, defaultRowSpan: 20, minColSpan: 10, minRowSpan: 10, defaultSettings: {} },
  { type: 'minesweeper', defaultTitle: 'Minesweeper', displayName: 'Minesweeper', description: "Classic Minesweeper game.", icon: MinesweeperIcon, defaultColSpan: 15, defaultRowSpan: 18, minColSpan: 8, minRowSpan: 10, defaultSettings: { difficulty: 'easy' } },
  { type: 'unitConverter', defaultTitle: 'Unit Converter', displayName: 'Unit Converter', description: "Convert various units.", icon: UnitConverterIcon, defaultColSpan: 15, defaultRowSpan: 13, minColSpan: 6, minRowSpan: 8, defaultSettings: { defaultCategory: 'Length', precision: 4 } as UnitConverterWidgetSettings },
  { type: 'countdownStopwatch', defaultTitle: 'Timer / Stopwatch', displayName: 'Timer/Stopwatch', description: "Countdown timer and stopwatch.", icon: CountdownStopwatchIcon, defaultColSpan: 12, defaultRowSpan: 14, minColSpan: 6, minRowSpan: 6, defaultSettings: { defaultCountdownMinutes: 5, playSoundOnFinish: true } as CountdownStopwatchWidgetSettings },
  { 
    type: 'photo', 
    defaultTitle: 'Photo Viewer', 
    displayName: 'Photo Viewer', 
    description: "Display an image from URL or upload.", 
    icon: PhotoIcon, 
    defaultColSpan: 12, 
    defaultRowSpan: 12, 
    minColSpan: 6, 
    minRowSpan: 6,
    defaultSettings: PHOTO_WIDGET_DEFAULT_INSTANCE_SETTINGS // Uses the updated default
  },
];

const initialWidgetsLayout: PageWidgetConfig[] = [
  { "id": "weather-widget-main", "title": "Medford Weather", "type": "weather", "colStart": 3, "rowStart": 3, "colSpan": 10, "rowSpan": 14, "settings": { "location": "97504 US", "units": "imperial", "useCurrentLocation": false }, "isMinimized": false },
  { "id": "youtube-widget-main", "title": "Watch Videos", "type": "youtube", "colStart": 3, "rowStart": 18, "colSpan": 18, "rowSpan": 20, "settings": {}, "isMinimized": false },
  { 
    "id": "photo-widget-initial", 
    "title": "My Photo", 
    "type": "photo", 
    "colStart": 22, 
    "rowStart": 3, 
    "colSpan": 12, 
    "rowSpan": 12,
    "settings": PHOTO_WIDGET_DEFAULT_INSTANCE_SETTINGS, // Will now default to 'cover'
    "isMinimized": false 
  },
];

// This function ensures that loaded or newly created photo widgets adhere to the PhotoWidgetSettings structure,
// especially applying the new default 'objectFit' if not specified.
const ensurePhotoWidgetInstanceSettings = (settings: AllWidgetSettings | undefined): PhotoWidgetSettings => {
    const photoInstanceDefaults = PHOTO_WIDGET_DEFAULT_INSTANCE_SETTINGS; // This now has objectFit: 'cover'
    const currentPhotoSettings = settings as PhotoWidgetSettings | undefined;

    return {
        imageUrl: currentPhotoSettings?.imageUrl || photoInstanceDefaults.imageUrl,
        imageName: currentPhotoSettings?.imageName || photoInstanceDefaults.imageName,
        objectFit: currentPhotoSettings?.objectFit || photoInstanceDefaults.objectFit, // Uses 'cover' if not specified
        isSidebarOpen: typeof currentPhotoSettings?.isSidebarOpen === 'boolean'
            ? currentPhotoSettings.isSidebarOpen
            : photoInstanceDefaults.isSidebarOpen,
    };
};


export default function Home() {
  const [widgetContainerCols, setWidgetContainerCols] = useState(0);
  const [widgetContainerRows, setWidgetContainerRows] = useState(0);
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);

  // Initialize widgets state, ensuring photo widgets get correct default settings
  const [widgets, setWidgets] = useState<PageWidgetConfig[]>(() => {
    if (typeof window !== 'undefined') {
        try {
            const savedLayoutJSON = window.localStorage.getItem(DASHBOARD_LAYOUT_STORAGE_KEY);
            if (savedLayoutJSON) {
                const loadedWidgets = JSON.parse(savedLayoutJSON) as PageWidgetConfig[];
                // Check if loadedWidgets is a valid array and its elements are structured as expected
                if (Array.isArray(loadedWidgets) && (loadedWidgets.length > 0 ? typeof loadedWidgets[0].id === 'string' : true)) {
                    return loadedWidgets.map(w => {
                        const blueprint = AVAILABLE_WIDGET_DEFINITIONS.find(def => def.type === w.type);
                        // Start with blueprint defaults, then overlay widget's saved settings
                        let finalSettings = { ...(blueprint?.defaultSettings || {}), ...(w.settings || {}) };
                        
                        // Specifically ensure photo widget settings are correctly formed
                        if (w.type === 'photo') {
                            finalSettings = ensurePhotoWidgetInstanceSettings(finalSettings as PhotoWidgetSettings);
                        }
                        return { ...w, settings: finalSettings };
                    });
                }
            }
        } catch (error) {
            console.error("[page.tsx] Error loading dashboard layout from localStorage, using initial layout:", error);
        }
    }
    // Fallback to initialWidgetsLayout if no valid saved layout or if not in browser
    return JSON.parse(JSON.stringify(initialWidgetsLayout)).map((w: PageWidgetConfig) => {
        const blueprint = AVAILABLE_WIDGET_DEFINITIONS.find(def => def.type === w.type);
        let finalSettings = { ...(blueprint?.defaultSettings || {}), ...(w.settings || {}) };
        if (w.type === 'photo') {
            finalSettings = ensurePhotoWidgetInstanceSettings(finalSettings as PhotoWidgetSettings);
        }
        return { ...w, settings: finalSettings };
    });
  });

  // Global states for shared data
  const [sharedNotes, setSharedNotes] = useState<Note[]>([]);
  const [activeSharedNoteId, setActiveSharedNoteId] = useState<string | null>(null);
  const [sharedTodos, setSharedTodos] = useState<TodoItem[]>([]);
  const [sharedPhotoHistory, setSharedPhotoHistory] = useState<HistoricImage[]>([]);

  // Refs for debounced saving
  const notesSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const todosSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const photoHistorySaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const deselectTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [history, setHistory] = useState<PageWidgetConfig[][]>([]);
  const [historyPointer, setHistoryPointer] = useState<number>(-1);
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

   useEffect(() => {
    // Initialize history and mark initial load as attempted
    // This effect runs after the `widgets` state has been initialized from localStorage or defaults.
    if (!initialLoadAttempted.current) {
        setHistory([JSON.parse(JSON.stringify(widgets))]); // History can be initialized with an empty array if widgets is empty
        setHistoryPointer(0);
        initialLoadAttempted.current = true;
    }
  }, [widgets]); // This dependency ensures it runs after widgets is set.


  // Effect for saving widget layout to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && initialLoadAttempted.current) { // Only save after initial load attempt
      try {
        window.localStorage.setItem(DASHBOARD_LAYOUT_STORAGE_KEY, JSON.stringify(widgets));
      } catch (error) { console.error("Error saving dashboard layout to localStorage:", error); }
    }
  }, [widgets]);

  // --- Load and Save Global Notes ---
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
        if (notesToSet.length === 0) { // Initialize with a default note if empty
            const defaultNoteId = `note-${Date.now()}-default`;
            notesToSet = [{ id: defaultNoteId, title: "My First Note", content: "<p>Welcome to your notes!</p>", lastModified: Date.now() }];
            activeIdToSet = defaultNoteId;
        } else if (!activeIdToSet && notesToSet.length > 0) { // Ensure an active note if one exists
            activeIdToSet = notesToSet.sort((a, b) => b.lastModified - a.lastModified)[0].id;
        }
        setSharedNotes(notesToSet);
        setActiveSharedNoteId(activeIdToSet);
    }
  }, []); // Runs once on mount

  useEffect(() => {
    if (typeof window !== 'undefined') {
        if (notesSaveTimeoutRef.current) clearTimeout(notesSaveTimeoutRef.current);
        // Only save if there's something to save or if it's different from an empty default
        if (sharedNotes.length > 0 || activeSharedNoteId !== null) {
            notesSaveTimeoutRef.current = setTimeout(() => {
                try {
                    const notesCollection: NotesCollectionStorage = { notes: sharedNotes, activeNoteId: activeSharedNoteId };
                    localStorage.setItem(GLOBAL_NOTES_STORAGE_KEY, JSON.stringify(notesCollection));
                } catch (e) { console.error("Error saving global notes to localStorage:", e); }
            }, DATA_SAVE_DEBOUNCE_MS);
        } else if (localStorage.getItem(GLOBAL_NOTES_STORAGE_KEY)) { // Clear if it was previously set but now empty
            localStorage.setItem(GLOBAL_NOTES_STORAGE_KEY, JSON.stringify({ notes: [], activeNoteId: null }));
        }
        return () => { if (notesSaveTimeoutRef.current) clearTimeout(notesSaveTimeoutRef.current); };
    }
  }, [sharedNotes, activeSharedNoteId]);

  // --- Load and Save Global To-Dos ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const savedTodosJSON = localStorage.getItem(GLOBAL_TODOS_STORAGE_KEY);
        if (savedTodosJSON) {
            try {
                const loadedTodos = JSON.parse(savedTodosJSON) as TodoItem[];
                setSharedTodos(Array.isArray(loadedTodos) ? loadedTodos : []);
            } catch (e) {
                console.error("Error parsing global to-do list from localStorage:", e);
                setSharedTodos([]); // Default to empty array on error
            }
        } else {
             setSharedTodos([]); // Default to empty if not found
        }
    }
  }, []); // Runs once on mount

  useEffect(() => {
    if (typeof window !== 'undefined') {
        if (todosSaveTimeoutRef.current) clearTimeout(todosSaveTimeoutRef.current);
        todosSaveTimeoutRef.current = setTimeout(() => {
            try {
                localStorage.setItem(GLOBAL_TODOS_STORAGE_KEY, JSON.stringify(sharedTodos));
            } catch (e) { console.error("Error saving global to-do list to localStorage:", e); }
        }, DATA_SAVE_DEBOUNCE_MS);

        return () => { if (todosSaveTimeoutRef.current) clearTimeout(todosSaveTimeoutRef.current); };
    }
  }, [sharedTodos]);

  // --- Load and Save Global Photo History ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const savedHistoryJSON = localStorage.getItem(GLOBAL_PHOTO_HISTORY_STORAGE_KEY);
        if (savedHistoryJSON) {
            try {
                const loadedHistory = JSON.parse(savedHistoryJSON) as HistoricImage[];
                setSharedPhotoHistory(Array.isArray(loadedHistory) ? loadedHistory : []);
            } catch (e) {
                console.error("Error parsing global photo history from localStorage:", e);
                setSharedPhotoHistory([]);
            }
        } else {
            setSharedPhotoHistory([]);
        }
    }
  }, []); // Runs once on mount

  useEffect(() => {
    if (typeof window !== 'undefined') {
        if (photoHistorySaveTimeoutRef.current) clearTimeout(photoHistorySaveTimeoutRef.current);
        photoHistorySaveTimeoutRef.current = setTimeout(() => {
            try {
                localStorage.setItem(GLOBAL_PHOTO_HISTORY_STORAGE_KEY, JSON.stringify(sharedPhotoHistory));
            } catch (e) { console.error("Error saving global photo history to localStorage:", e); }
        }, DATA_SAVE_DEBOUNCE_MS);
        return () => { if (photoHistorySaveTimeoutRef.current) clearTimeout(photoHistorySaveTimeoutRef.current); };
    }
  }, [sharedPhotoHistory]);


  // --- Auto-deselect Timer Logic ---
  useEffect(() => {
    if (deselectTimerRef.current) {
      clearTimeout(deselectTimerRef.current);
      deselectTimerRef.current = null;
    }
    if (activeWidgetId && !maximizedWidgetId) { // Only run timer if a widget is active AND not maximized
      deselectTimerRef.current = setTimeout(() => {
        setActiveWidgetId(null);
      }, WIDGET_DESELECT_TIMEOUT_MS);
    }
    return () => {
      if (deselectTimerRef.current) {
        clearTimeout(deselectTimerRef.current);
        deselectTimerRef.current = null;
      }
    };
  }, [activeWidgetId, maximizedWidgetId]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addWidgetMenuRef.current && !addWidgetMenuRef.current.contains(event.target as Node)) {
        setIsAddWidgetMenuOpen(false);
      }
    };
    if (isAddWidgetMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAddWidgetMenuOpen]);

  const updateWidgetsAndPushToHistory = useCallback((newWidgetsState: PageWidgetConfig[], actionType?: string) => {
    // Prevent history push during undo/redo operations unless explicitly internal
    if (isPerformingUndoRedo.current && actionType !== 'undo_redo_internal') {
        // console.log("Skipping history push during undo/redo for action:", actionType);
        return;
    }

    // Avoid pushing identical states to history
    const currentHistoryTop = historyPointer >= 0 && historyPointer < history.length ? history[historyPointer] : null;
    if (currentHistoryTop && JSON.stringify(currentHistoryTop) === JSON.stringify(newWidgetsState)) {
        // console.log("Skipping history push, state is identical for action:", actionType);
        return;
    }

    // console.log("Pushing to history for action:", actionType, "New pointer will be:", historyPointer + 1);
    const newHistoryEntry = JSON.parse(JSON.stringify(newWidgetsState)); // Deep copy

    setHistory(prevHistory => {
      // Slice history up to the current pointer, effectively discarding "redo" states if a new action is taken
      const newHistoryBase = prevHistory.slice(0, historyPointer + 1);
      let finalHistory = [...newHistoryBase, newHistoryEntry];

      // Limit history length
      if (finalHistory.length > MAX_HISTORY_LENGTH) {
        finalHistory = finalHistory.slice(finalHistory.length - MAX_HISTORY_LENGTH);
      }
      // Update pointer to the new latest state
      setHistoryPointer(finalHistory.length - 1);
      return finalHistory;
    });
  }, [history, historyPointer]); // Removed 'widgets' from dependencies to avoid loops with its own update effect

  useEffect(() => {
    const determineWidgetContainerGridSize = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const headerHeight = headerRef.current?.offsetHeight || 60; // Default header height
      const mainContentHeight = screenHeight - headerHeight;

      setWidgetContainerCols(Math.floor(screenWidth / CELL_SIZE));
      setWidgetContainerRows(Math.floor(mainContentHeight / CELL_SIZE));
    };

    determineWidgetContainerGridSize(); // Initial call
    const timeoutId = setTimeout(determineWidgetContainerGridSize, 100); // Call again after a short delay for potential layout shifts

    window.addEventListener('resize', determineWidgetContainerGridSize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', determineWidgetContainerGridSize);
    };
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  const handleExportLayout = () => {
    if (typeof window === 'undefined') return;
    try {
      const layoutToExport = {
        dashboardVersion: DASHBOARD_LAYOUT_STORAGE_KEY.replace('dashboardLayoutV','v'), // e.g., v3.10
        widgets: widgets,
        notesCollection: { notes: sharedNotes, activeNoteId: activeSharedNoteId },
        sharedGlobalTodos: sharedTodos,
        sharedGlobalPhotoHistory: sharedPhotoHistory
      };
      const jsonString = JSON.stringify(layoutToExport, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = `dashboard-layout-${layoutToExport.dashboardVersion}.json`; // Dynamic filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
    } catch (error) {
      console.error("Error exporting layout:", error);
      alert("Error exporting layout.");
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

        const importedData = JSON.parse(text);
        let widgetsToImport: PageWidgetConfig[] = [];
        let notesToImport: Note[] = sharedNotes; // Default to current if not in file
        let activeNoteIdToImport: string | null = activeSharedNoteId;
        let globalTodosToImport: TodoItem[] = sharedTodos;
        let globalPhotoHistoryToImport: HistoricImage[] = sharedPhotoHistory;


        // Check for new format (with version and specific keys)
        if (importedData.dashboardVersion && importedData.widgets) {
            widgetsToImport = importedData.widgets;
            if (importedData.notesCollection) {
                notesToImport = importedData.notesCollection.notes || [];
                activeNoteIdToImport = importedData.notesCollection.activeNoteId || null;
            }
            if (importedData.sharedGlobalTodos && Array.isArray(importedData.sharedGlobalTodos)) {
                globalTodosToImport = importedData.sharedGlobalTodos;
            }
            if (importedData.sharedGlobalPhotoHistory && Array.isArray(importedData.sharedGlobalPhotoHistory)) {
                globalPhotoHistoryToImport = importedData.sharedGlobalPhotoHistory;
            }
            alert(`Dashboard layout and global data (version ${importedData.dashboardVersion}) imported successfully!`);
        } else if (Array.isArray(importedData)) { // Legacy format (just an array of widgets)
            widgetsToImport = importedData;
            alert("Dashboard layout (legacy format) imported. Global data (notes, todos, photo history) will use defaults or existing data.");
        } else {
            throw new Error("Invalid file format. Could not recognize dashboard structure.");
        }

        // Validate basic structure of imported widgets
        if (widgetsToImport.length > 0 && typeof widgetsToImport[0].id !== 'string') {
            throw new Error("Imported widget data seems invalid.");
        }
        
        // Process widgets to ensure they have correct settings structure
        const processedWidgetsToImport = widgetsToImport.map(w => {
            const blueprint = AVAILABLE_WIDGET_DEFINITIONS.find(def => def.type === w.type);
            let finalSettings = { ...(blueprint?.defaultSettings || {}), ...(w.settings || {}) };
            if (w.type === 'photo') {
                finalSettings = ensurePhotoWidgetInstanceSettings(finalSettings as PhotoWidgetSettings);
            }
            return { ...w, settings: finalSettings };
        });

        // Update all states
        setWidgets(processedWidgetsToImport);
        setSharedNotes(notesToImport);
        setActiveSharedNoteId(activeNoteIdToImport);
        setSharedTodos(globalTodosToImport);
        setSharedPhotoHistory(globalPhotoHistoryToImport);

        // Reset UI states
        setActiveWidgetId(null);
        setMaximizedWidgetId(null);
        // Crucially, reset history after import
        setHistory([JSON.parse(JSON.stringify(processedWidgetsToImport))]);
        setHistoryPointer(0);

      } catch (err: any) {
        console.error("Error importing layout:", err);
        alert(`Error importing layout: ${err.message || 'Invalid file content.'}`);
      }
      finally {
        // Reset file input to allow importing the same file again if needed
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

  // Helper to check for overlaps with a buffer
  const doRectanglesOverlap = (
    r1Col: number, r1Row: number, r1ColSpan: number, r1RowSpan: number,
    r2Col: number, r2Row: number, r2ColSpan: number, r2RowSpan: number,
    buffer: number = 0 // Cells to buffer around r2
  ): boolean => {
    // Adjust r2 with buffer, ensuring it stays within grid boundaries if known
    const r2BufferedColStart = Math.max(1, r2Col - buffer);
    const r2BufferedRowStart = Math.max(1, r2Row - buffer);
    const r2BufferedColEnd = Math.min(widgetContainerCols > 0 ? widgetContainerCols : Infinity, r2Col + r2ColSpan - 1 + buffer);
    const r2BufferedRowEnd = Math.min(widgetContainerRows > 0 ? widgetContainerRows : Infinity, r2Row + r2RowSpan - 1 + buffer);

    // Standard overlap check with r1 and buffered r2
    const r1ActualColEnd = r1Col + r1ColSpan - 1;
    const r1ActualRowEnd = r1Row + r1RowSpan - 1;

    return r1Col <= r2BufferedColEnd &&
           r1ActualColEnd >= r2BufferedColStart &&
           r1Row <= r2BufferedRowEnd &&
           r1ActualRowEnd >= r2BufferedRowStart;
  };

  const findNextAvailablePosition = (
    placingColSpan: number,
    placingRowSpan: number
  ): { colStart: number, rowStart: number } | null => {
    if (widgetContainerCols === 0 || widgetContainerRows === 0) return null; // Grid not ready

    for (let r = 1; r <= widgetContainerRows; r++) {
      for (let c = 1; c <= widgetContainerCols; c++) {
        // Check if the widget fits within the grid boundaries from this starting point
        if (r + placingRowSpan - 1 > widgetContainerRows || c + placingColSpan - 1 > widgetContainerCols) {
          if (c + placingColSpan - 1 > widgetContainerCols) break; // Move to next row if it won't fit in this col
          continue; // Try next column in the current row
        }

        let collision = false;
        for (const existingWidget of widgets) {
          // Use a buffer of 1 cell to ensure some spacing
          if (doRectanglesOverlap(c, r, placingColSpan, placingRowSpan,
                                  existingWidget.colStart, existingWidget.rowStart,
                                  existingWidget.colSpan, existingWidget.rowSpan, 1)) {
            collision = true;
            break;
          }
        }
        if (!collision) {
          return { colStart: c, rowStart: r };
        }
      }
    }
    return null; // No suitable position found
  };

  const handleAddNewWidget = (widgetType: WidgetType) => {
    if (maximizedWidgetId) return; // Don't add widgets when one is maximized

    const blueprint = AVAILABLE_WIDGET_DEFINITIONS.find(def => def.type === widgetType);
    if (!blueprint) {
      alert(`Widget type "${widgetType}" is not available.`);
      setIsAddWidgetMenuOpen(false);
      return;
    }

    const { defaultColSpan, defaultRowSpan } = blueprint;
    if (widgetContainerCols === 0 || widgetContainerRows === 0) {
        alert("Grid not fully initialized. Please wait a moment and try again.");
        setIsAddWidgetMenuOpen(false);
        return;
    }

    const position = findNextAvailablePosition(defaultColSpan, defaultRowSpan);
    if (!position) {
      alert("No available space to add this widget. Try making some room or resizing existing widgets.");
      setIsAddWidgetMenuOpen(false);
      return;
    }

    const newWidgetId = `${blueprint.type}-${Date.now()}`;
    
    // Ensure correct settings structure, especially for photo widgets
    let newWidgetInstanceSettings = JSON.parse(JSON.stringify(blueprint.defaultSettings || {}));
    if (blueprint.type === 'photo') {
        newWidgetInstanceSettings = ensurePhotoWidgetInstanceSettings(newWidgetInstanceSettings as PhotoWidgetSettings);
    }

    const newWidget: PageWidgetConfig = {
      id: newWidgetId,
      title: blueprint.defaultTitle,
      type: blueprint.type,
      colStart: position.colStart,
      rowStart: position.rowStart,
      colSpan: defaultColSpan,
      rowSpan: defaultRowSpan,
      settings: newWidgetInstanceSettings,
      isMinimized: false,
      // originalRowSpan is not set initially
    };
    
    setWidgets(prev => {
        const updatedWidgets = [...prev, newWidget];
        updateWidgetsAndPushToHistory(updatedWidgets, `add_widget_${widgetType}`);
        return updatedWidgets;
    });
    setActiveWidgetId(newWidgetId); // This will trigger the auto-deselect timer
    setIsAddWidgetMenuOpen(false);
  };


  // Live resize, no history update yet
  const handleWidgetResizeLive = (id: string, newGeometry: WidgetResizeDataType) => {
    if (isPerformingUndoRedo.current || maximizedWidgetId) return; // Prevent changes during undo/redo or when maximized
    setWidgets(currentWidgets =>
      currentWidgets.map(w =>
        w.id === id ? { ...w, ...newGeometry, isMinimized: false } : w
      )
    );
  };

  // Resize end, update history
  const handleWidgetResizeEnd = (id: string, finalGeometry: WidgetResizeDataType) => {
    if (maximizedWidgetId) return; // Should not happen if interaction is disabled on maximized
    setWidgets(currentWidgets => {
        const updatedWidgets = currentWidgets.map(w =>
          w.id === id ? { ...w, ...finalGeometry, isMinimized: false, originalRowSpan: undefined } : w
        );
        updateWidgetsAndPushToHistory(updatedWidgets, `resize_end_${id}`);
        return updatedWidgets;
    });
    setActiveWidgetId(id); // Re-activate to reset its deselect timer
  };

  const handleWidgetMove = (id: string, newPosition: WidgetMoveDataType) => {
    if (maximizedWidgetId) return; // Should not happen

    const currentWidget = widgets.find(w => w.id === id);
    if (!currentWidget) return;

    // Only update and push to history if position actually changed
    if (currentWidget.colStart !== newPosition.colStart || currentWidget.rowStart !== newPosition.rowStart) {
        setWidgets(currentWidgets => {
            const updatedWidgets = currentWidgets.map(w =>
              w.id === id ? { ...w, ...newPosition } : w
            );
            updateWidgetsAndPushToHistory(updatedWidgets, `move_${id}`);
            return updatedWidgets;
        });
    }
    setActiveWidgetId(id); // Re-activate to reset its deselect timer
  };

  const handleWidgetDelete = (idToDelete: string) => {
    if (maximizedWidgetId === idToDelete) { // If deleting the maximized widget
        setMaximizedWidgetId(null);
        // No need to restore original state as it's being deleted
    }
    setWidgets(currentWidgets => {
        const updatedWidgets = currentWidgets.filter(widget => widget.id !== idToDelete);
        updateWidgetsAndPushToHistory(updatedWidgets, `delete_${idToDelete}`);
        return updatedWidgets;
    });
    if (activeWidgetId === idToDelete) {
      setActiveWidgetId(null); // This will clear the timer via useEffect
    }
  };


  const handleWidgetFocus = (id: string) => {
    if (maximizedWidgetId && maximizedWidgetId !== id) return; // Don't change focus if a different widget is maximized
    // Setting the activeWidgetId (even if it's the same) will trigger the
    // useEffect for the deselect timer, effectively resetting it.
    setActiveWidgetId(id);
  };

  const handleOpenWidgetSettings = (widgetId: string) => {
    if (maximizedWidgetId && maximizedWidgetId !== widgetId) return; // Don't open settings if a different widget is maximized
    const widgetToEdit = widgets.find(w => w.id === widgetId);
    if (widgetToEdit) { 
        setActiveWidgetId(widgetId); // Keep widget active (or make it active) when opening settings
        setSelectedWidgetForSettings(widgetToEdit); 
        setIsSettingsModalOpen(true); 
    }
  };

  const handleCloseSettingsModal = () => { 
    setIsSettingsModalOpen(false); 
    setSelectedWidgetForSettings(null); 
    // The activeWidgetId's deselect timer will continue or restart via its useEffect dependency.
  };
  
  // Centralized settings save function for all widget types
  const handleSaveWidgetInstanceSettings = useCallback((widgetId: string, newInstanceSettings: AllWidgetSettings) => {
    setWidgets(currentWidgets => {
        const updatedWidgets = currentWidgets.map(w => {
            if (w.id === widgetId) {
                // The newInstanceSettings should be the complete settings object for that widget type
                const mergedSettings = { ...(w.settings || {}), ...newInstanceSettings };
                return { ...w, settings: mergedSettings };
            }
            return w;
        });
        updateWidgetsAndPushToHistory(updatedWidgets, `save_settings_${widgetId}`);
        return updatedWidgets;
    });
    // After saving settings, ensure the widget remains active and its timer is reset.
    setActiveWidgetId(widgetId); 
  }, [updateWidgetsAndPushToHistory]);


  const handleWidgetMinimizeToggle = (widgetId: string) => {
    if (maximizedWidgetId) return; // Don't minimize/restore if any widget is maximized

    setWidgets(currentWidgets => {
        const updatedWidgets = currentWidgets.map(w => {
          if (w.id === widgetId) {
            if (w.isMinimized) {
              // Restore: use originalRowSpan if available, otherwise keep current rowSpan (should be MINIMIZED_WIDGET_ROW_SPAN)
              return { ...w, isMinimized: false, rowSpan: w.originalRowSpan || w.rowSpan, originalRowSpan: undefined };
            } else {
              // Minimize: save current rowSpan as originalRowSpan, set rowSpan to minimized height
              return { ...w, isMinimized: true, originalRowSpan: w.rowSpan, rowSpan: MINIMIZED_WIDGET_ROW_SPAN };
            }
          }
          return w;
        });
        updateWidgetsAndPushToHistory(updatedWidgets, `minimize_toggle_${widgetId}`);
        return updatedWidgets;
    });
    setActiveWidgetId(widgetId); // Keep active and reset timer
  };

  const handleWidgetMaximizeToggle = (widgetId: string) => {
    const widgetToToggle = widgets.find(w => w.id === widgetId);
    if (!widgetToToggle) return;

    if (maximizedWidgetId === widgetId) { // Currently maximized, so un-maximize
        setMaximizedWidgetId(null);
        setMaximizedWidgetOriginalState(null); // Clear stored original state
        setActiveWidgetId(widgetId); // Make it active, timer will start via useEffect
    } else { // Not maximized (or a different one is), so maximize this one
      // Store a deep copy of its current state before altering for maximization
      let originalStateForMaximize = JSON.parse(JSON.stringify(widgetToToggle));
      
      // If it was minimized, ensure its originalRowSpan is used for the stored state
      if (widgetToToggle.isMinimized) {
        originalStateForMaximize = {
            ...originalStateForMaximize,
            isMinimized: false, // It won't be minimized when maximized
            rowSpan: widgetToToggle.originalRowSpan || widgetToToggle.rowSpan, // Use original if available
            originalRowSpan: undefined // Clear this as it's no longer relevant for the "maximized" state itself
        };
      }

      setMaximizedWidgetOriginalState(originalStateForMaximize);
      setMaximizedWidgetId(widgetId);
      setActiveWidgetId(widgetId); // Ensure it's active; timer will be paused by maximizedWidgetId condition in useEffect
    }
  };

  const handleUndo = () => {
    if (historyPointer > 0) {
      isPerformingUndoRedo.current = true;
      const newPointer = historyPointer - 1;
      setHistoryPointer(newPointer);
      // Get a deep copy of the historic state to prevent direct mutation issues
      const historicWidgets = JSON.parse(JSON.stringify(history[newPointer]));
      setWidgets(historicWidgets);
      setActiveWidgetId(null); // Deselect any active widget
      setMaximizedWidgetId(null); // Ensure no widget is maximized
      // Defer resetting the flag until after React has processed state updates
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

  // This effect synchronizes the history if widgets state is changed externally (e.g., by import)
  // or if an undo/redo operation itself needs to be "committed" if it were the last action.
  // However, its primary role is to ensure direct manipulations of `widgets` (outside undo/redo) update history.
  useEffect(() => {
    // Only run if not currently performing an undo/redo and initial load is done
    if (initialLoadAttempted.current && !isPerformingUndoRedo.current) {
        const currentHistoryTop = historyPointer >= 0 && historyPointer < history.length ? history[historyPointer] : null;
        // If the current widgets state is different from what's at the top of history, update history
        if (!currentHistoryTop || JSON.stringify(currentHistoryTop) !== JSON.stringify(widgets)) {
            // console.log("Syncing widgets to history due to external change or divergence.");
            updateWidgetsAndPushToHistory(widgets, 'direct_widgets_change_sync');
        }
    }
  }, [widgets, history, historyPointer, updateWidgetsAndPushToHistory]);


  // Callback for TodoWidget to update the global list
  const handleSharedTodosChange = (newGlobalTodos: TodoItem[]) => {
    setSharedTodos(newGlobalTodos);
    // Note: History for todos themselves is not part of the main widget layout history here.
    // If you need undo/redo for todo items, that would be a separate mechanism.
  };

  // Callback for PhotoWidget to update global history
  const handleSharedPhotoHistoryChange = (newGlobalPhotoHistory: HistoricImage[]) => {
    setSharedPhotoHistory(newGlobalPhotoHistory);
  };


  const renderWidgetContent = (widgetConfig: PageWidgetConfig) => {
    const currentWidgetSettings = widgetConfig.settings || {};

    switch (widgetConfig.type) {
      case 'weather': return <WeatherWidget id={widgetConfig.id} settings={currentWidgetSettings as WeatherWidgetSettings | undefined} />;
      case 'clock': return <ClockWidget id={widgetConfig.id} settings={currentWidgetSettings as ClockWidgetSettings | undefined} />;
      case 'calculator': return <CalculatorWidget id={widgetConfig.id} settings={currentWidgetSettings as CalculatorWidgetSettings | undefined} />;
      case 'youtube': return <YoutubeWidget id={widgetConfig.id} settings={currentWidgetSettings as YoutubeWidgetSettings | undefined} />;
      case 'minesweeper': return <MinesweeperWidget id={widgetConfig.id} settings={currentWidgetSettings as MinesweeperWidgetSettings | undefined} />;
      case 'unitConverter': return <UnitConverterWidget id={widgetConfig.id} settings={currentWidgetSettings as UnitConverterWidgetSettings | undefined} />;
      case 'countdownStopwatch': return <CountdownStopwatchWidget id={widgetConfig.id} settings={currentWidgetSettings as CountdownStopwatchWidgetSettings | undefined} />;
      case 'photo':
        return (
          <PhotoWidget
            id={widgetConfig.id}
            settings={currentWidgetSettings as PhotoWidgetSettings | undefined} // Will use 'cover' by default now
            onSettingsChange={handleSaveWidgetInstanceSettings} // Centralized save
            sharedHistory={sharedPhotoHistory}
            onSharedHistoryChange={handleSharedPhotoHistoryChange}
          />
        );
      case 'todo':
        return <TodoWidget
                    instanceId={widgetConfig.id}
                    settings={currentWidgetSettings as TodoWidgetSettings | undefined}
                    todos={sharedTodos} // Pass the global list
                    onTodosChange={handleSharedTodosChange} // Pass the updater for the global list
                />;
      case 'notes':
        return <NotesWidget
                  instanceId={widgetConfig.id} settings={currentWidgetSettings as PageInstanceNotesSettings | undefined}
                  notes={sharedNotes} activeNoteId={activeSharedNoteId}
                  onNotesChange={setSharedNotes} onActiveNoteIdChange={setActiveSharedNoteId}
               />;
      default: return <p className="text-xs text-secondary italic">Generic widget content.</p>;
    }
  };

  const getSettingsPanelForWidget = (widgetConfig: PageWidgetConfig | null) => {
    if (!widgetConfig) return null;
    const currentWidgetSettings = widgetConfig.settings || {};

    // This function will be called by the specific settings panel when its "Save" button is clicked.
    // It uses the centralized handleSaveWidgetInstanceSettings.
    const boundSaveInstanceSettingsAndCloseModal = (newInstanceSettings: AllWidgetSettings) => {
        handleSaveWidgetInstanceSettings(widgetConfig.id, newInstanceSettings);
        handleCloseSettingsModal();
    };
    
    // Specific handler for PhotoWidget as its settings panel might have a slightly different save signature if it were more complex.
    // However, with the current PhotoSettingsPanel, it also just passes PhotoWidgetSettings.
    const boundSavePhotoInstanceSettingsAndCloseModal = (newInstanceSettings: PhotoWidgetSettings) => {
        handleSaveWidgetInstanceSettings(widgetConfig.id, newInstanceSettings);
        handleCloseSettingsModal();
    };

    switch (widgetConfig.type) {
      case 'weather': return <WeatherSettingsPanel widgetId={widgetConfig.id} currentSettings={currentWidgetSettings as WeatherWidgetSettings | undefined} onSave={boundSaveInstanceSettingsAndCloseModal} />;
      case 'clock': return <ClockSettingsPanel widgetId={widgetConfig.id} currentSettings={currentWidgetSettings as ClockWidgetSettings | undefined} onSave={boundSaveInstanceSettingsAndCloseModal} />;
      case 'calculator': return <CalculatorSettingsPanel widgetId={widgetConfig.id} currentSettings={currentWidgetSettings as CalculatorWidgetSettings | undefined} onSave={boundSaveInstanceSettingsAndCloseModal} />;
      case 'youtube': return <YoutubeSettingsPanel widgetId={widgetConfig.id} currentSettings={currentWidgetSettings as YoutubeWidgetSettings | undefined} onSave={boundSaveInstanceSettingsAndCloseModal} />;
      case 'minesweeper': return <MinesweeperSettingsPanel widgetId={widgetConfig.id} currentSettings={currentWidgetSettings as MinesweeperWidgetSettings | undefined} onSave={boundSaveInstanceSettingsAndCloseModal} />;
      case 'unitConverter': return <UnitConverterSettingsPanel widgetId={widgetConfig.id} currentSettings={currentWidgetSettings as UnitConverterWidgetSettings | undefined} onSave={boundSaveInstanceSettingsAndCloseModal} />;
      case 'countdownStopwatch': return <CountdownStopwatchSettingsPanel widgetId={widgetConfig.id} currentSettings={currentWidgetSettings as CountdownStopwatchWidgetSettings | undefined} onSave={boundSaveInstanceSettingsAndCloseModal} />;
      case 'photo':
        return <PhotoSettingsPanel
                  widgetId={widgetConfig.id}
                  currentSettings={currentWidgetSettings as PhotoWidgetSettings | undefined} // Will reflect 'cover' as default
                  onSaveInstanceSettings={boundSavePhotoInstanceSettingsAndCloseModal} // Centralized save
                  onClearGlobalHistory={() => {
                      handleSharedPhotoHistoryChange([]); // Clears the global state
                      alert('Global photo history has been cleared.');
                  }}
                  globalHistoryLength={sharedPhotoHistory.length}
               />;
      case 'notes':
        return <NotesSettingsPanel
                  widgetInstanceId={widgetConfig.id} currentSettings={currentWidgetSettings as PageInstanceNotesSettings | undefined}
                  onSaveLocalSettings={boundSaveInstanceSettingsAndCloseModal} // Centralized save
                  onClearAllNotesGlobal={() => {
                      setSharedNotes([]); setActiveSharedNoteId(null); // Clear global notes state
                      alert("All notes have been cleared from the dashboard.");
                  }}
               />;
      case 'todo':
        return <TodoSettingsPanel
                  widgetId={widgetConfig.id}
                  currentSettings={currentWidgetSettings as TodoWidgetSettings | undefined}
                  onSave={boundSaveInstanceSettingsAndCloseModal} // Centralized save
                  onClearAllTasks={() => {
                    handleSharedTodosChange([]); // Clears the global list
                    alert(`The global to-do list has been cleared.`);
                  }}
                />;
      default: return <p className="text-sm text-secondary">No specific settings available for this widget type.</p>;
    }
  };
  
  // Loading screen until initial setup (especially grid dimensions) is complete
  if (!initialLoadAttempted.current || widgetContainerCols === 0 || widgetContainerRows === 0) {
    return <div className="w-full h-screen bg-page-background flex items-center justify-center text-page-foreground">Loading Dashboard...</div>;
  }

  return (
    <main className="w-full h-screen bg-page-background text-page-foreground overflow-hidden relative flex flex-col"
      onClick={(e) => { 
        // Deselect active widget if clicking on the main background itself, and no widget is maximized
        if (e.target === e.currentTarget && !maximizedWidgetId) {
          setActiveWidgetId(null); // This will clear the timer via useEffect
        }
      }}
    >
      <header ref={headerRef} className="p-3 bg-dark-surface text-primary flex items-center justify-between shadow-lg z-40 shrink-0 border-b border-[var(--dark-border-interactive)]">
        {/* Header Controls: Undo, Redo, Add Widget, Export, Import */}
        <div className="flex items-center space-x-2">
          <button onClick={handleUndo} disabled={historyPointer <= 0 || !!maximizedWidgetId} className="control-button" aria-label="Undo"><UndoIcon /></button>
          <button onClick={handleRedo} disabled={historyPointer >= history.length - 1 || !!maximizedWidgetId} className="control-button" aria-label="Redo"><RedoIcon /></button>
          
          <div className="relative" ref={addWidgetMenuRef}>
            <button id="add-widget-button" onClick={() => setIsAddWidgetMenuOpen(prev => !prev)} disabled={!!maximizedWidgetId} className="control-button flex items-center" aria-expanded={isAddWidgetMenuOpen} aria-haspopup="true" aria-label="Add New Widget" >
              <AddIcon /> <span className="ml-1.5 text-xs hidden sm:inline">Add Widget</span>
            </button>
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

      {/* Backdrop for maximized widget */}
      {maximizedWidgetId && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30" 
          onClick={() => maximizedWidgetId && handleWidgetMaximizeToggle(maximizedWidgetId)} // Click backdrop to unmaximize
        />
      )}

      {/* Main content area with grid background and widgets */}
      <div className={`flex-grow relative ${maximizedWidgetId ? 'pointer-events-none' : ''}`}>
        <GridBackground />
        <div 
          className="absolute inset-0 grid gap-0" 
          style={{ 
            gridTemplateColumns: `repeat(${widgetContainerCols}, ${CELL_SIZE}px)`, 
            gridTemplateRows: `repeat(${widgetContainerRows}, ${CELL_SIZE}px)`, 
            alignContent: 'start' // Important for grid layout
          }}
        >
          {widgets.map((widgetConfig) => {
            // If a widget is maximized, only render that one. Otherwise, render all.
            if (maximizedWidgetId && maximizedWidgetId !== widgetConfig.id) return null;

            // Determine the state to render: normal, minimized, or maximized
            const currentWidgetState = maximizedWidgetId === widgetConfig.id && maximizedWidgetOriginalState 
              ? { // Maximized state overrides geometry
                  ...maximizedWidgetOriginalState, // Use original data but override geometry
                  colStart: 1, 
                  rowStart: 1, 
                  colSpan: widgetContainerCols > 2 ? widgetContainerCols - 2 : widgetContainerCols, // Adjust for some padding if desired
                  rowSpan: widgetContainerRows > 2 ? widgetContainerRows - 2 : widgetContainerRows,
                  isMinimized: false // Cannot be minimized when maximized
                } 
              : widgetConfig; // Normal or minimized state from the array

            const blueprint = AVAILABLE_WIDGET_DEFINITIONS.find(def => def.type === widgetConfig.type);
            let minCol = blueprint?.minColSpan || 3;
            let minRow = blueprint?.minRowSpan || 3;
            
            // If minimized (and not currently being rendered as maximized), adjust min dimensions
            if (widgetConfig.isMinimized && maximizedWidgetId !== widgetConfig.id) {
              minCol = widgetConfig.colSpan; // Minimized width is its current width
              minRow = MINIMIZED_WIDGET_ROW_SPAN; // Minimized height
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
                isActive={widgetConfig.id === activeWidgetId && !maximizedWidgetId} // Active only if not maximized
                CELL_SIZE={CELL_SIZE}
                minColSpan={minCol}
                minRowSpan={minRow}
                totalGridCols={widgetContainerCols}
                totalGridRows={widgetContainerRows}
                isMinimized={widgetConfig.isMinimized && maximizedWidgetId !== widgetConfig.id} // True if minimized and not the one being maximized
                onMinimizeToggle={() => handleWidgetMinimizeToggle(widgetConfig.id)}
                isMaximized={maximizedWidgetId === widgetConfig.id} // True if this is the maximized widget
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

// Inline styles for control buttons (can be moved to globals.css or a Tailwind plugin if preferred)
const styles = `
  .control-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem; /* 8px */
    background-color: var(--dark-accent-primary); /* Using CSS variable */
    border-radius: 0.375rem; /* 6px */
    color: var(--dark-text-on-accent); /* Using CSS variable */
    transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* Subtle shadow */
  }
  .control-button:hover {
    background-color: var(--dark-accent-primary-hover); /* Using CSS variable */
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1); /* Slightly larger shadow on hover */
  }
  .control-button:disabled {
    background-color: hsl(222, 47%, 25%); /* A muted color for disabled state */
    color: hsl(215, 20%, 55%);
    cursor: not-allowed;
    box-shadow: none;
  }
  .control-button:focus-visible { /* For keyboard navigation */
    outline: 2px solid var(--dark-accent-primary-hover);
    outline-offset: 2px;
  }
`;

// Inject styles into the document head (client-side only)
if (typeof window !== 'undefined') {
  if (!document.getElementById('custom-dashboard-styles')) {
    const styleSheet = document.createElement("style");
    styleSheet.id = 'custom-dashboard-styles';
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
  }
}
