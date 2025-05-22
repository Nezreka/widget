// src/app/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Widget, { WidgetResizeDataType, WidgetMoveDataType, WidgetContainerSettings } from "@/components/Widget";
import GridBackground from "@/components/GridBackground";
import SettingsModal from '@/components/SettingsModal'; // For widget content settings
import WidgetContainerSettingsModal from '@/components/WidgetContainerSettingsModal'; // For widget container (appearance) settings
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
import PortfolioWidget, { PortfolioSettingsPanel, PortfolioWidgetSettings } from "@/components/PortfolioWidget";


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
const PortfolioIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-cyan-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21V16.5m16.5 4.5V16.5m-16.5 0a2.25 2.25 0 012.25-2.25h12a2.25 2.25 0 012.25 2.25m-16.5 0h16.5" />
    </svg>
);


// --- Constants ---
const CELL_SIZE = 30;
const MAX_HISTORY_LENGTH = 50;
const MINIMIZED_WIDGET_ROW_SPAN = 2;
const DASHBOARD_LAYOUT_STORAGE_KEY = 'dashboardLayoutV3.15';
const GLOBAL_NOTES_STORAGE_KEY = 'dashboardGlobalNotesCollection_v1';
const GLOBAL_TODOS_STORAGE_KEY = 'dashboardGlobalSingleTodoList_v1';
const GLOBAL_PHOTO_HISTORY_STORAGE_KEY = 'dashboardGlobalPhotoHistory_v1';
const DATA_SAVE_DEBOUNCE_MS = 700;
const WIDGET_DESELECT_TIMEOUT_MS = 3000;

// Default Widget Container Settings (Appearance)
const DEFAULT_WIDGET_CONTAINER_SETTINGS: WidgetContainerSettings = {
    alwaysShowTitleBar: false,
    innerPadding: 'px-3.5 py-3',
};

// --- Interfaces ---
// Using Record<string, unknown> instead of Record<string, any> for better type safety.
// This means that if a widget has settings not explicitly defined in the union,
// their values will be of type `unknown` and require type checking or casting.
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
    PortfolioWidgetSettings |
    Record<string, unknown>; // Changed from any to unknown

export type WidgetType =
    'weather' | 'todo' | 'clock' | 'calculator' | 'notes' | 'youtube' |
    'minesweeper' | 'unitConverter' | 'countdownStopwatch' | 'photo' | 'portfolio' | 'generic';

export interface PageWidgetConfig {
  id: string;
  title: string;
  type: WidgetType;
  colStart: number;
  rowStart: number;
  colSpan: number;
  rowSpan: number;
  settings?: AllWidgetSettings;
  containerSettings?: WidgetContainerSettings;
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

const PHOTO_WIDGET_DEFAULT_INSTANCE_SETTINGS: PhotoWidgetSettings = {
  imageUrl: null, imageName: null, objectFit: 'cover', isSidebarOpen: false
};

const PORTFOLIO_WIDGET_DEFAULT_INSTANCE_SETTINGS: PortfolioWidgetSettings = {
    accentColor: '#0ea5e9',
    showAnimatedBackground: true,
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
  { type: 'countdownStopwatch', defaultTitle: 'Timer / Stopwatch', displayName: 'Timer/Stopwatch', description: "Countdown timer and stopwatch.", icon: CountdownStopwatchIcon, defaultColSpan: 14, defaultRowSpan: 14, minColSpan: 6, minRowSpan: 6, defaultSettings: { defaultCountdownMinutes: 5, playSoundOnFinish: true } as CountdownStopwatchWidgetSettings },
  { type: 'photo', defaultTitle: 'Photo Viewer', displayName: 'Photo Viewer', description: "Display an image from URL or upload.", icon: PhotoIcon, defaultColSpan: 12, defaultRowSpan: 12, minColSpan: 6, minRowSpan: 6, defaultSettings: PHOTO_WIDGET_DEFAULT_INSTANCE_SETTINGS },
  { type: 'portfolio', defaultTitle: "Broque's Portfolio", displayName: 'My Portfolio', description: "A showcase of my work and experience.", icon: PortfolioIcon, defaultColSpan: 40, defaultRowSpan: 40, minColSpan: 20, minRowSpan: 18, defaultSettings: PORTFOLIO_WIDGET_DEFAULT_INSTANCE_SETTINGS },
];

// Initial layout: colStart values are placeholders, will be dynamically centered.
const initialWidgetsLayout: PageWidgetConfig[] = [
  {
    "id": "clock-widget-main",
    "title": "Digital Clock",
    "type": "clock",
    "colStart": 1, // Placeholder, will be dynamically centered
    "rowStart": 3,
    "colSpan": 8,
    "rowSpan": 8,
    "settings": { displayType: 'digital', showSeconds: true, hourFormat: '12' },
    "isMinimized": false,
    containerSettings: { ...DEFAULT_WIDGET_CONTAINER_SETTINGS }
  },
  {
    "id": "portfolio-main",
    "title": "Broque Thomas - Portfolio",
    "type": "portfolio",
    "colStart": 1, // Placeholder, will be dynamically centered
    "rowStart": 3,
    "colSpan": 40,
    "rowSpan": 40,
    "settings": PORTFOLIO_WIDGET_DEFAULT_INSTANCE_SETTINGS,
    "isMinimized": false,
    containerSettings: { ...DEFAULT_WIDGET_CONTAINER_SETTINGS, innerPadding: 'p-0' }
  },
  {
    "id": "weather-widget-main",
    "title": "Medford Weather",
    "type": "weather",
    "colStart": 1, // Placeholder, will be dynamically centered
    "rowStart": 3,
    "colSpan": 12,
    "rowSpan": 14,
    "settings": { "location": "97504 US", "units": "imperial", "useCurrentLocation": false },
    "isMinimized": false,
    containerSettings: { ...DEFAULT_WIDGET_CONTAINER_SETTINGS }
  },
];

// Helper to ensure PhotoWidget instance settings are correctly formed
const ensurePhotoWidgetInstanceSettings = (settings: AllWidgetSettings | undefined): PhotoWidgetSettings => {
    const photoInstanceDefaults = PHOTO_WIDGET_DEFAULT_INSTANCE_SETTINGS;
    const currentPhotoSettings = settings as PhotoWidgetSettings | undefined;
    return {
        imageUrl: currentPhotoSettings?.imageUrl || photoInstanceDefaults.imageUrl,
        imageName: currentPhotoSettings?.imageName || photoInstanceDefaults.imageName,
        objectFit: currentPhotoSettings?.objectFit || photoInstanceDefaults.objectFit,
        isSidebarOpen: typeof currentPhotoSettings?.isSidebarOpen === 'boolean'
            ? currentPhotoSettings.isSidebarOpen
            : photoInstanceDefaults.isSidebarOpen,
    };
};

// Helper to ensure PortfolioWidget instance settings are correctly formed
const ensurePortfolioWidgetInstanceSettings = (settings: AllWidgetSettings | undefined): PortfolioWidgetSettings => {
    const portfolioInstanceDefaults = PORTFOLIO_WIDGET_DEFAULT_INSTANCE_SETTINGS;
    const currentPortfolioSettings = settings as PortfolioWidgetSettings | undefined;
    return {
        accentColor: currentPortfolioSettings?.accentColor || portfolioInstanceDefaults.accentColor,
        showAnimatedBackground: typeof currentPortfolioSettings?.showAnimatedBackground === 'boolean'
            ? currentPortfolioSettings.showAnimatedBackground
            : portfolioInstanceDefaults.showAnimatedBackground,
    };
};


// Helper to process and ensure defaults for any widget config (content and container settings)
// Changed widgetData type from 'any' to 'Partial<PageWidgetConfig>' for better type safety.
// This assumes widgetData will generally conform to the PageWidgetConfig structure,
// even if some fields are missing (which the function then defaults).
const processWidgetConfig = (widgetData: Partial<PageWidgetConfig>): PageWidgetConfig => {
    const blueprint = AVAILABLE_WIDGET_DEFINITIONS.find(def => def.type === widgetData.type);

    let finalContentSettings = { ...(blueprint?.defaultSettings || {}), ...(widgetData.settings || {}) };
    if (widgetData.type === 'photo') {
        finalContentSettings = ensurePhotoWidgetInstanceSettings(finalContentSettings as PhotoWidgetSettings);
    } else if (widgetData.type === 'portfolio') {
        finalContentSettings = ensurePortfolioWidgetInstanceSettings(finalContentSettings as PortfolioWidgetSettings);
    }

    const finalContainerSettings: WidgetContainerSettings = {
        ...DEFAULT_WIDGET_CONTAINER_SETTINGS,
        ...(widgetData.containerSettings || {})
    };
    if (widgetData.type === 'portfolio' && widgetData.containerSettings?.innerPadding === undefined) {
        finalContainerSettings.innerPadding = 'p-0';
    }
    if (widgetData.type === 'notes' && widgetData.containerSettings?.innerPadding === undefined) {
        finalContainerSettings.innerPadding = 'p-0';
    }

    return {
        id: widgetData.id || `generic-${Date.now()}`,
        title: widgetData.title || blueprint?.defaultTitle || "Untitled Widget",
        type: widgetData.type || 'generic', // Fallback type
        colStart: widgetData.colStart || 1,
        rowStart: widgetData.rowStart || 1,
        colSpan: widgetData.colSpan || blueprint?.defaultColSpan || 6,
        rowSpan: widgetData.rowSpan || blueprint?.defaultRowSpan || 6,
        isMinimized: widgetData.isMinimized || false,
        settings: finalContentSettings,
        containerSettings: finalContainerSettings,
        // Ensure all PageWidgetConfig fields are present in the return
        originalRowSpan: widgetData.originalRowSpan,
    };
};


export default function Home() {
  const [widgetContainerCols, setWidgetContainerCols] = useState(0);
  const [widgetContainerRows, setWidgetContainerRows] = useState(0);
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);

  const initialLayoutIsDefaultRef = useRef(false); // Tracks if the initial layout is from defaults
  const initialCenteringDoneRef = useRef(false); // Tracks if dynamic centering has been applied

  const [widgets, setWidgets] = useState<PageWidgetConfig[]>(() => {
    if (typeof window !== 'undefined') {
        try {
            const savedLayoutJSON = window.localStorage.getItem(DASHBOARD_LAYOUT_STORAGE_KEY);
            if (savedLayoutJSON) {
                const savedData = JSON.parse(savedLayoutJSON);
                // Check if savedData is an object and has the expected structure
                if (savedData && typeof savedData === 'object' && !Array.isArray(savedData) && savedData.dashboardVersion && Array.isArray(savedData.widgets)) {
                    const loadedVersion = String(savedData.dashboardVersion).replace('v','V');
                    const currentVersion = DASHBOARD_LAYOUT_STORAGE_KEY.replace('dashboardLayoutV','V');

                    if (loadedVersion === currentVersion) {
                        initialLayoutIsDefaultRef.current = false; // Loaded from storage
                        // Assuming savedData.widgets are Partial<PageWidgetConfig> or conformant
                        return (savedData.widgets as Partial<PageWidgetConfig>[]).map(processWidgetConfig);
                    } else {
                        console.log(`[page.tsx] Storage key version mismatch (Saved: ${loadedVersion}, Current: ${currentVersion}). Using new initial layout.`);
                    }
                } else if (Array.isArray(savedData)) { // Handle legacy array-only format
                     console.log(`[page.tsx] Legacy layout format detected. Using new initial layout for ${DASHBOARD_LAYOUT_STORAGE_KEY}.`);
                     // Potentially attempt to process legacy data if a structure is known, or discard.
                     // For now, discarding and using new initial layout.
                } else {
                    console.log(`[page.tsx] Invalid saved layout structure. Using new initial layout.`);
                }
            }
        } catch (error) {
            console.error("[page.tsx] Error loading/parsing dashboard layout from localStorage, using initial layout:", error);
        }
    }
    initialLayoutIsDefaultRef.current = true; // Default layout is being used
    return initialWidgetsLayout.map(processWidgetConfig);
  });

  const [sharedNotes, setSharedNotes] = useState<Note[]>([]);
  const [activeSharedNoteId, setActiveSharedNoteId] = useState<string | null>(null);
  const [sharedTodos, setSharedTodos] = useState<TodoItem[]>([]);
  const [sharedPhotoHistory, setSharedPhotoHistory] = useState<HistoricImage[]>([]);

  const notesSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const todosSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const photoHistorySaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const deselectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const history = useRef<PageWidgetConfig[][]>([]);
  const historyPointer = useRef<number>(-1);
  const isPerformingUndoRedo = useRef(false);
  const headerRef = useRef<HTMLElement>(null);
  const initialLoadAttempted = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedWidgetForSettings, setSelectedWidgetForSettings] = useState<PageWidgetConfig | null>(null);

  const [isContainerSettingsModalOpen, setIsContainerSettingsModalOpen] = useState(false);
  const [selectedWidgetForContainerSettings, setSelectedWidgetForContainerSettings] = useState<PageWidgetConfig | null>(null);

  const [maximizedWidgetId, setMaximizedWidgetId] = useState<string | null>(null);
  const [maximizedWidgetOriginalState, setMaximizedWidgetOriginalState] = useState<PageWidgetConfig | null>(null);
  const [isAddWidgetMenuOpen, setIsAddWidgetMenuOpen] = useState(false);
  const addWidgetMenuRef = useRef<HTMLDivElement>(null);
  const [historyDisplay, setHistoryDisplay] = useState({ pointer: 0, length: 0 });

  // Moved updateWidgetsAndPushToHistory definition before its use in useEffect
  const updateWidgetsAndPushToHistory = useCallback((newWidgetsState: PageWidgetConfig[], actionType?: string) => {
    if (isPerformingUndoRedo.current && actionType !== 'undo_redo_internal') return;

    const currentHistoryTop = historyPointer.current >= 0 && historyPointer.current < history.current.length ? history.current[historyPointer.current] : null;
    if (currentHistoryTop && JSON.stringify(currentHistoryTop) === JSON.stringify(newWidgetsState)) return;

    const newHistoryEntry = JSON.parse(JSON.stringify(newWidgetsState));
    const newHistoryBase = history.current.slice(0, historyPointer.current + 1);
    let finalHistory = [...newHistoryBase, newHistoryEntry];
    if (finalHistory.length > MAX_HISTORY_LENGTH) {
      finalHistory = finalHistory.slice(finalHistory.length - MAX_HISTORY_LENGTH);
    }
    history.current = finalHistory;
    historyPointer.current = finalHistory.length - 1;
    setHistoryDisplay({ pointer: historyPointer.current + 1, length: history.current.length });
  }, []);


   useEffect(() => {
    if (!initialLoadAttempted.current) {
        history.current = [JSON.parse(JSON.stringify(widgets))];
        historyPointer.current = 0;
        setHistoryDisplay({ pointer: historyPointer.current + 1, length: history.current.length });
        initialLoadAttempted.current = true;
    }
  }, [widgets]);


  useEffect(() => {
    if (typeof window !== 'undefined' && initialLoadAttempted.current) {
      try {
        const dataToSave = {
            dashboardVersion: DASHBOARD_LAYOUT_STORAGE_KEY.replace('dashboardLayoutV','v'),
            widgets: widgets
        };
        window.localStorage.setItem(DASHBOARD_LAYOUT_STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (error) { console.error("Error saving dashboard layout to localStorage:", error); }
    }
  }, [widgets]);

  // Dynamic initial centering logic
  useEffect(() => {
    if (widgetContainerCols > 0 && initialLayoutIsDefaultRef.current && !initialCenteringDoneRef.current) {
        const clockWidgetConfig = initialWidgetsLayout.find(w => w.id === "clock-widget-main");
        const portfolioWidgetConfig = initialWidgetsLayout.find(w => w.id === "portfolio-main");
        const weatherWidgetConfig = initialWidgetsLayout.find(w => w.id === "weather-widget-main");

        if (clockWidgetConfig && portfolioWidgetConfig && weatherWidgetConfig) {
            const clockSpan = clockWidgetConfig.colSpan;
            const portfolioSpan = portfolioWidgetConfig.colSpan;
            const weatherSpan = weatherWidgetConfig.colSpan;
            const gap = 2; // Define the gap between widgets

            const totalBlockSpan = clockSpan + gap + portfolioSpan + gap + weatherSpan;

            let leftOffset = Math.floor((widgetContainerCols - totalBlockSpan) / 2);
            if (leftOffset < 1) leftOffset = 0; // Ensure it's not negative, start at 0 for colStart 1

            const newClockColStart = Math.max(1, leftOffset + 1);
            const newPortfolioColStart = newClockColStart + clockSpan + gap;
            const newWeatherColStart = newPortfolioColStart + portfolioSpan + gap;

            // Check if new positions are valid (don't overflow)
            if (newWeatherColStart + weatherSpan -1 <= widgetContainerCols) {
                setWidgets(currentWidgets => {
                    const updated = currentWidgets.map(w => {
                        if (w.id === "clock-widget-main") return { ...w, colStart: newClockColStart };
                        if (w.id === "portfolio-main") return { ...w, colStart: newPortfolioColStart };
                        if (w.id === "weather-widget-main") return { ...w, colStart: newWeatherColStart };
                        return w;
                    });
                    updateWidgetsAndPushToHistory(updated, 'initial_dynamic_center_layout');
                    return updated;
                });
                initialCenteringDoneRef.current = true;
                initialLayoutIsDefaultRef.current = false;
            } else {
                console.warn("[page.tsx] Calculated dynamic centered layout would overflow. Widgets will start at column 1.");
                initialCenteringDoneRef.current = true;
                initialLayoutIsDefaultRef.current = false;
            }
        }
    }
  }, [widgetContainerCols, updateWidgetsAndPushToHistory]); // Removed 'widgets' from dependency array to prevent potential loops. Relies on refs for control.


  useEffect(() => {
    if (typeof window !== 'undefined') {
        const savedNotesJSON = localStorage.getItem(GLOBAL_NOTES_STORAGE_KEY);
        let notesToSet: Note[] = []; let activeIdToSet: string | null = null;
        if (savedNotesJSON) { try { const nc: NotesCollectionStorage = JSON.parse(savedNotesJSON); notesToSet = nc.notes || []; activeIdToSet = nc.activeNoteId || null; if (activeIdToSet && !notesToSet.some(n => n.id === activeIdToSet)) activeIdToSet = null; } catch (e) { console.error("Err parse notes:", e); } }
        if (notesToSet.length === 0) { const dId = `note-${Date.now()}-default`; notesToSet = [{ id: dId, title: "My First Note", content: "<p>Welcome!</p>", lastModified: Date.now() }]; activeIdToSet = dId; } else if (!activeIdToSet && notesToSet.length > 0) { activeIdToSet = notesToSet.sort((a,b)=>b.lastModified-a.lastModified)[0].id; }
        setSharedNotes(notesToSet); setActiveSharedNoteId(activeIdToSet);
    }
  }, []);
  useEffect(() => {
    if (typeof window !== 'undefined') { if (notesSaveTimeoutRef.current) clearTimeout(notesSaveTimeoutRef.current); if (sharedNotes.length > 0 || activeSharedNoteId !== null) { notesSaveTimeoutRef.current = setTimeout(() => { try { const nc: NotesCollectionStorage = { notes: sharedNotes, activeNoteId: activeSharedNoteId }; localStorage.setItem(GLOBAL_NOTES_STORAGE_KEY, JSON.stringify(nc)); } catch (e) { console.error("Err save notes:", e); } }, DATA_SAVE_DEBOUNCE_MS); } else if (localStorage.getItem(GLOBAL_NOTES_STORAGE_KEY)) { localStorage.setItem(GLOBAL_NOTES_STORAGE_KEY, JSON.stringify({ notes: [], activeNoteId: null })); } return () => { if (notesSaveTimeoutRef.current) clearTimeout(notesSaveTimeoutRef.current); }; }
  }, [sharedNotes, activeSharedNoteId]);
  useEffect(() => { if (typeof window !== 'undefined') { const sT = localStorage.getItem(GLOBAL_TODOS_STORAGE_KEY); if (sT) { try { const lT = JSON.parse(sT) as TodoItem[]; setSharedTodos(Array.isArray(lT) ? lT : []); } catch (e) { console.error("Err parse todos:", e); setSharedTodos([]); } } else { setSharedTodos([]); } } }, []);
  useEffect(() => { if (typeof window !== 'undefined') { if (todosSaveTimeoutRef.current) clearTimeout(todosSaveTimeoutRef.current); todosSaveTimeoutRef.current = setTimeout(() => { try { localStorage.setItem(GLOBAL_TODOS_STORAGE_KEY, JSON.stringify(sharedTodos)); } catch (e) { console.error("Err save todos:", e); } }, DATA_SAVE_DEBOUNCE_MS); return () => { if (todosSaveTimeoutRef.current) clearTimeout(todosSaveTimeoutRef.current); }; } }, [sharedTodos]);
  useEffect(() => { if (typeof window !== 'undefined') { const sPH = localStorage.getItem(GLOBAL_PHOTO_HISTORY_STORAGE_KEY); if (sPH) { try { const lPH = JSON.parse(sPH) as HistoricImage[]; setSharedPhotoHistory(Array.isArray(lPH) ? lPH : []); } catch (e) { console.error("Err parse photo hist:", e); setSharedPhotoHistory([]); } } else { setSharedPhotoHistory([]); } } }, []);
  useEffect(() => { if (typeof window !== 'undefined') { if (photoHistorySaveTimeoutRef.current) clearTimeout(photoHistorySaveTimeoutRef.current); photoHistorySaveTimeoutRef.current = setTimeout(() => { try { localStorage.setItem(GLOBAL_PHOTO_HISTORY_STORAGE_KEY, JSON.stringify(sharedPhotoHistory)); } catch (e) { console.error("Err save photo hist:", e); } }, DATA_SAVE_DEBOUNCE_MS); return () => { if (photoHistorySaveTimeoutRef.current) clearTimeout(photoHistorySaveTimeoutRef.current); }; } }, [sharedPhotoHistory]);

  useEffect(() => { if (deselectTimerRef.current) { clearTimeout(deselectTimerRef.current); deselectTimerRef.current = null; } if (activeWidgetId && !maximizedWidgetId) { deselectTimerRef.current = setTimeout(() => { setActiveWidgetId(null); }, WIDGET_DESELECT_TIMEOUT_MS); } return () => { if (deselectTimerRef.current) { clearTimeout(deselectTimerRef.current); deselectTimerRef.current = null; } }; }, [activeWidgetId, maximizedWidgetId]);
  useEffect(() => { const ho = (e: MouseEvent) => { if (addWidgetMenuRef.current && !addWidgetMenuRef.current.contains(e.target as Node)) { setIsAddWidgetMenuOpen(false); } }; if (isAddWidgetMenuOpen) { document.addEventListener('mousedown', ho); } else { document.removeEventListener('mousedown', ho); } return () => { document.removeEventListener('mousedown', ho); }; }, [isAddWidgetMenuOpen]);


  useEffect(() => {
    const determineWidgetContainerGridSize = () => {
      const screenWidth = window.innerWidth; const screenHeight = window.innerHeight;
      const headerHeight = headerRef.current?.offsetHeight || 60;
      const mainContentHeight = screenHeight - headerHeight;
      setWidgetContainerCols(Math.floor(screenWidth / CELL_SIZE));
      setWidgetContainerRows(Math.floor(mainContentHeight / CELL_SIZE));
    };
    determineWidgetContainerGridSize(); const timeoutId = setTimeout(determineWidgetContainerGridSize, 100);
    window.addEventListener('resize', determineWidgetContainerGridSize);
    return () => { clearTimeout(timeoutId); window.removeEventListener('resize', determineWidgetContainerGridSize); };
  }, []);

  const handleExportLayout = () => {
    if (typeof window === 'undefined') return;
    try {
      const layoutToExport = { dashboardVersion: DASHBOARD_LAYOUT_STORAGE_KEY.replace('dashboardLayoutV','v'), widgets: widgets, notesCollection: { notes: sharedNotes, activeNoteId: activeSharedNoteId }, sharedGlobalTodos: sharedTodos, sharedGlobalPhotoHistory: sharedPhotoHistory };
      const jsonString = JSON.stringify(layoutToExport, null, 2); const blob = new Blob([jsonString],{type:'application/json'}); const href = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = href; link.download = `dashboard-layout-${layoutToExport.dashboardVersion}.json`; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(href);
    } catch (error) { console.error("Error exporting layout:", error); alert("Error exporting layout."); }
  };

  // Define a more specific type for the imported data structure
  interface ImportedLayoutData {
    dashboardVersion?: string;
    widgets?: Partial<PageWidgetConfig>[]; // Assuming widgets might be partially formed
    notesCollection?: NotesCollectionStorage;
    sharedGlobalTodos?: TodoItem[];
    sharedGlobalPhotoHistory?: HistoricImage[];
  }


  const handleImportLayout = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (typeof window === 'undefined') return; const file = event.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result; if (typeof text !== 'string') throw new Error("Failed to read file content.");
        // Parse the JSON, assuming it could be an object or an array (for legacy)
        const parsedJson = JSON.parse(text);
        let importedData: ImportedLayoutData | Partial<PageWidgetConfig>[];

        // Type guard or check to determine structure
        if (typeof parsedJson === 'object' && !Array.isArray(parsedJson) && (parsedJson.dashboardVersion || parsedJson.widgets)) {
            importedData = parsedJson as ImportedLayoutData;
        } else if (Array.isArray(parsedJson)) {
            importedData = parsedJson as Partial<PageWidgetConfig>[];
        } else {
            throw new Error("Invalid file format. Could not recognize dashboard structure.");
        }


        let widgetsToImportRaw: Partial<PageWidgetConfig>[] = [];
        let notesToImport: Note[] = sharedNotes; let activeNoteIdToImport: string | null = activeSharedNoteId;
        let globalTodosToImport: TodoItem[] = sharedTodos; let globalPhotoHistoryToImport: HistoricImage[] = sharedPhotoHistory;

        if ('dashboardVersion' in importedData && 'widgets' in importedData && Array.isArray(importedData.widgets)) { // Modern format
            widgetsToImportRaw = importedData.widgets || [];
            if (importedData.notesCollection) { notesToImport = importedData.notesCollection.notes || []; activeNoteIdToImport = importedData.notesCollection.activeNoteId || null; }
            if (importedData.sharedGlobalTodos && Array.isArray(importedData.sharedGlobalTodos)) { globalTodosToImport = importedData.sharedGlobalTodos; }
            if (importedData.sharedGlobalPhotoHistory && Array.isArray(importedData.sharedGlobalPhotoHistory)) { globalPhotoHistoryToImport = importedData.sharedGlobalPhotoHistory; }
            alert(`Dashboard layout and global data (version ${importedData.dashboardVersion}) imported successfully!`);
        } else if (Array.isArray(importedData)) { // Legacy format (array of widgets)
            widgetsToImportRaw = importedData;
            alert("Dashboard layout (legacy format) imported. Global data (notes, todos, photo history) will use defaults or existing data.");
        } else {
             throw new Error("Invalid file format. Could not recognize dashboard structure.");
        }


        if (widgetsToImportRaw.length > 0 && typeof widgetsToImportRaw[0]?.id !== 'string') {
             // Add a more robust check if needed, e.g., check for other essential properties
             console.warn("Imported widget data might be invalid or incomplete.", widgetsToImportRaw[0]);
             // Depending on strictness, you might throw an error or attempt to process anyway
        }


        const processedWidgetsToImport = widgetsToImportRaw.map(processWidgetConfig);

        setWidgets(processedWidgetsToImport); setSharedNotes(notesToImport); setActiveSharedNoteId(activeNoteIdToImport);
        setSharedTodos(globalTodosToImport); setSharedPhotoHistory(globalPhotoHistoryToImport);
        setActiveWidgetId(null); setMaximizedWidgetId(null);
        history.current = [JSON.parse(JSON.stringify(processedWidgetsToImport))]; historyPointer.current = 0;
        setHistoryDisplay({ pointer: historyPointer.current + 1, length: history.current.length });
        initialLayoutIsDefaultRef.current = false; // Data loaded from import, not default
        initialCenteringDoneRef.current = true; // Assume imported layout is as intended

      } catch (err: unknown) { // Changed from any to unknown
          let message = 'Invalid file content.';
          if (err instanceof Error) {
            message = err.message;
          }
          console.error("Error importing layout:", err);
          alert(`Error importing layout: ${message}`);
      }
      finally { if (fileInputRef.current) fileInputRef.current.value = ""; }
    };
    reader.onerror = () => { alert("Error reading file."); if (fileInputRef.current) fileInputRef.current.value = ""; };
    reader.readAsText(file);
  };

  const triggerImportFileSelect = () => { if (fileInputRef.current) fileInputRef.current.click(); };

  const doRectanglesOverlap = (r1C:number,r1R:number,r1CS:number,r1RS:number,r2C:number,r2R:number,r2CS:number,r2RS:number,b:number=0):boolean => { const r2BSC=Math.max(1,r2C-b); const r2BSR=Math.max(1,r2R-b); const r2BCE=Math.min(widgetContainerCols>0?widgetContainerCols:Infinity,r2C+r2CS-1+b); const r2BRE=Math.min(widgetContainerRows>0?widgetContainerRows:Infinity,r2R+r2RS-1+b); const r1ACE=r1C+r1CS-1; const r1ARE=r1R+r1RS-1; return r1C<=r2BCE&&r1ACE>=r2BSC&&r1R<=r2BRE&&r1ARE>=r2BSR; };
  const findNextAvailablePosition = (pCS:number,pRS:number):{colStart:number,rowStart:number}|null => { if(widgetContainerCols===0||widgetContainerRows===0)return null; for(let r=1;r<=widgetContainerRows;r++){for(let c=1;c<=widgetContainerCols;c++){ if(r+pRS-1>widgetContainerRows||c+pCS-1>widgetContainerCols){if(c+pCS-1>widgetContainerCols)break;continue;} let coll=false; for(const ew of widgets){if(doRectanglesOverlap(c,r,pCS,pRS,ew.colStart,ew.rowStart,ew.colSpan,ew.rowSpan,1)){coll=true;break;}} if(!coll)return{colStart:c,rowStart:r};}} return null; };

  const handleAddNewWidget = (widgetType: WidgetType) => {
    if (maximizedWidgetId) return;
    const blueprint = AVAILABLE_WIDGET_DEFINITIONS.find(def => def.type === widgetType);
    if (!blueprint) { alert(`Widget type "${widgetType}" is not available.`); setIsAddWidgetMenuOpen(false); return; }
    const { defaultColSpan, defaultRowSpan } = blueprint;
    if (widgetContainerCols === 0 || widgetContainerRows === 0) { alert("Grid not fully initialized. Please wait a moment and try again."); setIsAddWidgetMenuOpen(false); return; }
    const position = findNextAvailablePosition(defaultColSpan, defaultRowSpan);
    if (!position) { alert("No available space to add this widget. Try making some room or resizing existing widgets."); setIsAddWidgetMenuOpen(false); return; }

    let newWidgetInstanceSettings = JSON.parse(JSON.stringify(blueprint.defaultSettings || {}));
    if (blueprint.type === 'photo') {
        newWidgetInstanceSettings = ensurePhotoWidgetInstanceSettings(newWidgetInstanceSettings as PhotoWidgetSettings);
    } else if (blueprint.type === 'portfolio') {
        newWidgetInstanceSettings = ensurePortfolioWidgetInstanceSettings(newWidgetInstanceSettings as PortfolioWidgetSettings);
    }

    // Initialize containerSettings with potential overrides
    const newWidgetContainerSettings = { ...DEFAULT_WIDGET_CONTAINER_SETTINGS };
    if (blueprint.type === 'portfolio' || blueprint.type === 'notes') {
        newWidgetContainerSettings.innerPadding = 'p-0';
    }

    const newWidget: PageWidgetConfig = {
      id: `${blueprint.type}-${Date.now()}`,
      title: blueprint.defaultTitle,
      type: blueprint.type,
      colStart: position.colStart,
      rowStart: position.rowStart,
      colSpan: defaultColSpan,
      rowSpan: defaultRowSpan,
      settings: newWidgetInstanceSettings,
      containerSettings: newWidgetContainerSettings,
      isMinimized: false,
    };


    setWidgets(prev => { const updatedWidgets = [...prev, newWidget]; updateWidgetsAndPushToHistory(updatedWidgets, `add_widget_${widgetType}`); return updatedWidgets; });
    setActiveWidgetId(newWidget.id); setIsAddWidgetMenuOpen(false);
  };

  const handleWidgetResizeLive = (id: string, newGeometry: WidgetResizeDataType) => { if (isPerformingUndoRedo.current || maximizedWidgetId) return; setWidgets(currentWidgets => currentWidgets.map(w => w.id === id ? { ...w, ...newGeometry, isMinimized: false } : w)); };
  const handleWidgetResizeEnd = (id: string, finalGeometry: WidgetResizeDataType) => { if (maximizedWidgetId) return; setWidgets(currentWidgets => { const updatedWidgets = currentWidgets.map(w => w.id === id ? { ...w, ...finalGeometry, isMinimized: false, originalRowSpan: undefined } : w); updateWidgetsAndPushToHistory(updatedWidgets, `resize_end_${id}`); return updatedWidgets; }); setActiveWidgetId(id); };
  const handleWidgetMove = (id: string, newPosition: WidgetMoveDataType) => { if (maximizedWidgetId) return; const currentWidget = widgets.find(w => w.id === id); if (!currentWidget) return; if (currentWidget.colStart !== newPosition.colStart || currentWidget.rowStart !== newPosition.rowStart) { setWidgets(currentWidgets => { const updatedWidgets = currentWidgets.map(w => w.id === id ? { ...w, ...newPosition } : w); updateWidgetsAndPushToHistory(updatedWidgets, `move_${id}`); return updatedWidgets; }); } setActiveWidgetId(id); };
  const handleWidgetDelete = (idToDelete: string) => { if (maximizedWidgetId === idToDelete) { setMaximizedWidgetId(null); setMaximizedWidgetOriginalState(null); } setWidgets(currentWidgets => { const updatedWidgets = currentWidgets.filter(widget => widget.id !== idToDelete); updateWidgetsAndPushToHistory(updatedWidgets, `delete_${idToDelete}`); return updatedWidgets; }); if (activeWidgetId === idToDelete) setActiveWidgetId(null); };
  const handleWidgetFocus = (id: string) => { if (maximizedWidgetId && maximizedWidgetId !== id) return; setActiveWidgetId(id); };

  const handleOpenWidgetSettings = (widgetId: string) => { if (maximizedWidgetId && maximizedWidgetId !== widgetId) return; const widgetToEdit = widgets.find(w => w.id === widgetId); if (widgetToEdit) { setActiveWidgetId(widgetId); setSelectedWidgetForSettings(widgetToEdit); setIsSettingsModalOpen(true); } };
  const handleCloseSettingsModal = () => { setIsSettingsModalOpen(false); setSelectedWidgetForSettings(null); };
  const handleSaveWidgetInstanceSettings = useCallback((widgetId: string, newInstanceSettings: AllWidgetSettings) => { setWidgets(currentWidgets => { const updatedWidgets = currentWidgets.map(w => w.id === widgetId ? { ...w, settings: { ...(w.settings || {}), ...newInstanceSettings } } : w); updateWidgetsAndPushToHistory(updatedWidgets, `save_settings_${widgetId}`); return updatedWidgets; }); setActiveWidgetId(widgetId); }, [updateWidgetsAndPushToHistory]);

  const handleOpenContainerSettingsModal = (widgetId: string) => {
    if (maximizedWidgetId && maximizedWidgetId !== widgetId) return;
    const widgetToEdit = widgets.find(w => w.id === widgetId);
    if (widgetToEdit) {
      setActiveWidgetId(widgetId);
      setSelectedWidgetForContainerSettings(widgetToEdit);
      setIsContainerSettingsModalOpen(true);
    }
  };
  const handleCloseContainerSettingsModal = () => {
    setIsContainerSettingsModalOpen(false);
    setSelectedWidgetForContainerSettings(null);
  };
  const handleSaveWidgetContainerSettings = useCallback((widgetId: string, newContainerSettings: WidgetContainerSettings) => {
    setWidgets(currentWidgets => {
        const updatedWidgets = currentWidgets.map(w => {
            if (w.id === widgetId) {
                const existingContainerSettings = w.containerSettings || DEFAULT_WIDGET_CONTAINER_SETTINGS;
                return { ...w, containerSettings: { ...existingContainerSettings, ...newContainerSettings } };
            }
            return w;
        });
        updateWidgetsAndPushToHistory(updatedWidgets, `save_container_settings_${widgetId}`);
        return updatedWidgets;
    });
    setActiveWidgetId(widgetId);
  }, [updateWidgetsAndPushToHistory]);


  const handleWidgetMinimizeToggle = (widgetId: string) => { if (maximizedWidgetId) return; setWidgets(currentWidgets => { const updatedWidgets = currentWidgets.map(w => { if (w.id === widgetId) { if (w.isMinimized) { return { ...w, isMinimized: false, rowSpan: w.originalRowSpan || w.rowSpan, originalRowSpan: undefined }; } else { return { ...w, isMinimized: true, originalRowSpan: w.rowSpan, rowSpan: MINIMIZED_WIDGET_ROW_SPAN }; } } return w; }); updateWidgetsAndPushToHistory(updatedWidgets, `minimize_toggle_${widgetId}`); return updatedWidgets; }); setActiveWidgetId(widgetId); };
  const handleWidgetMaximizeToggle = (widgetId: string) => { const widgetToToggle = widgets.find(w => w.id === widgetId); if (!widgetToToggle) return; if (maximizedWidgetId === widgetId) { setMaximizedWidgetId(null); setMaximizedWidgetOriginalState(null); setActiveWidgetId(widgetId); } else { let originalStateForMaximize = JSON.parse(JSON.stringify(widgetToToggle)); if (widgetToToggle.isMinimized) { originalStateForMaximize = { ...originalStateForMaximize, isMinimized: false, rowSpan: widgetToToggle.originalRowSpan || widgetToToggle.rowSpan, originalRowSpan: undefined }; } setMaximizedWidgetOriginalState(originalStateForMaximize); setMaximizedWidgetId(widgetId); setActiveWidgetId(widgetId); } };

  const handleUndo = () => { if (historyPointer.current > 0) { isPerformingUndoRedo.current = true; const newPointer = historyPointer.current - 1; historyPointer.current = newPointer; const historicWidgets = JSON.parse(JSON.stringify(history.current[newPointer])); setWidgets(historicWidgets); setActiveWidgetId(null); setMaximizedWidgetId(null); setHistoryDisplay({ pointer: historyPointer.current + 1, length: history.current.length }); requestAnimationFrame(() => { isPerformingUndoRedo.current = false; }); } };
  const handleRedo = () => { if (historyPointer.current < history.current.length - 1) { isPerformingUndoRedo.current = true; const newPointer = historyPointer.current + 1; historyPointer.current = newPointer; const historicWidgets = JSON.parse(JSON.stringify(history.current[newPointer])); setWidgets(historicWidgets); setActiveWidgetId(null); setMaximizedWidgetId(null); setHistoryDisplay({ pointer: historyPointer.current + 1, length: history.current.length }); requestAnimationFrame(() => { isPerformingUndoRedo.current = false; }); } };

  // Removed the general useEffect that was causing issues with resize undo.
  // History is now managed more explicitly by individual action handlers.

  const handleSharedTodosChange = (newGlobalTodos: TodoItem[]) => { setSharedTodos(newGlobalTodos); };
  const handleSharedPhotoHistoryChange = (newGlobalPhotoHistory: HistoricImage[]) => { setSharedPhotoHistory(newGlobalPhotoHistory); };

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
      case 'photo': return <PhotoWidget id={widgetConfig.id} settings={currentWidgetSettings as PhotoWidgetSettings | undefined} onSettingsChange={handleSaveWidgetInstanceSettings} sharedHistory={sharedPhotoHistory} onSharedHistoryChange={handleSharedPhotoHistoryChange} />;
      case 'todo': return <TodoWidget instanceId={widgetConfig.id} settings={currentWidgetSettings as TodoWidgetSettings | undefined} todos={sharedTodos} onTodosChange={handleSharedTodosChange} />;
      case 'notes': return <NotesWidget instanceId={widgetConfig.id} settings={currentWidgetSettings as PageInstanceNotesSettings | undefined} notes={sharedNotes} activeNoteId={activeSharedNoteId} onNotesChange={setSharedNotes} onActiveNoteIdChange={setActiveSharedNoteId} />;
      case 'portfolio': return <PortfolioWidget /*id={widgetConfig.id}*/ settings={currentWidgetSettings as PortfolioWidgetSettings | undefined} />; // ID was removed from PortfolioWidget props
      default: return <p className="text-xs text-secondary italic">Generic widget content.</p>;
    }
  };

  const getSettingsPanelForWidget = (widgetConfig: PageWidgetConfig | null) => {
    if (!widgetConfig) return null; const currentContentSettings = widgetConfig.settings || {};
    const boundSaveInstanceContentSettings = (newInstanceContentSettings: AllWidgetSettings) => { handleSaveWidgetInstanceSettings(widgetConfig.id, newInstanceContentSettings); handleCloseSettingsModal(); };
    const boundSavePhotoInstanceContentSettings = (newInstancePhotoSettings: PhotoWidgetSettings) => { handleSaveWidgetInstanceSettings(widgetConfig.id, newInstancePhotoSettings); handleCloseSettingsModal(); };
    switch (widgetConfig.type) {
      case 'weather': return <WeatherSettingsPanel widgetId={widgetConfig.id} currentSettings={currentContentSettings as WeatherWidgetSettings | undefined} onSave={boundSaveInstanceContentSettings} />;
      case 'clock': return <ClockSettingsPanel widgetId={widgetConfig.id} currentSettings={currentContentSettings as ClockWidgetSettings | undefined} onSave={boundSaveInstanceContentSettings} />;
      case 'calculator': return <CalculatorSettingsPanel widgetId={widgetConfig.id} currentSettings={currentContentSettings as CalculatorWidgetSettings | undefined} onSave={boundSaveInstanceContentSettings} />;
      case 'youtube': return <YoutubeSettingsPanel widgetId={widgetConfig.id} currentSettings={currentContentSettings as YoutubeWidgetSettings | undefined} onSave={boundSaveInstanceContentSettings} />;
      case 'minesweeper': return <MinesweeperSettingsPanel widgetId={widgetConfig.id} currentSettings={currentContentSettings as MinesweeperWidgetSettings | undefined} onSave={boundSaveInstanceContentSettings} />;
      case 'unitConverter': return <UnitConverterSettingsPanel widgetId={widgetConfig.id} currentSettings={currentContentSettings as UnitConverterWidgetSettings | undefined} onSave={boundSaveInstanceContentSettings} />;
      case 'countdownStopwatch': return <CountdownStopwatchSettingsPanel widgetId={widgetConfig.id} currentSettings={currentContentSettings as CountdownStopwatchWidgetSettings | undefined} onSave={boundSaveInstanceContentSettings} />;
      case 'photo': return <PhotoSettingsPanel widgetId={widgetConfig.id} currentSettings={currentContentSettings as PhotoWidgetSettings | undefined} onSaveInstanceSettings={boundSavePhotoInstanceContentSettings} onClearGlobalHistory={() => { handleSharedPhotoHistoryChange([]); alert('Global photo history has been cleared.'); }} globalHistoryLength={sharedPhotoHistory.length} />;
      case 'notes': return <NotesSettingsPanel widgetInstanceId={widgetConfig.id} currentSettings={currentContentSettings as PageInstanceNotesSettings | undefined} onSaveLocalSettings={boundSaveInstanceContentSettings} onClearAllNotesGlobal={() => { setSharedNotes([]); setActiveSharedNoteId(null); alert("All notes have been cleared from the dashboard."); }} />;
      case 'todo': return <TodoSettingsPanel widgetId={widgetConfig.id} currentSettings={currentContentSettings as TodoWidgetSettings | undefined} onSave={boundSaveInstanceContentSettings} onClearAllTasks={() => { handleSharedTodosChange([]); alert(`The global to-do list has been cleared.`); }} />;
      case 'portfolio': return <PortfolioSettingsPanel widgetId={widgetConfig.id} currentSettings={currentContentSettings as PortfolioWidgetSettings | undefined} onSave={boundSaveInstanceContentSettings} />;
      default: return <p className="text-sm text-secondary">No specific content settings available for this widget type.</p>;
    }
  };

  if (!initialLoadAttempted.current || widgetContainerCols === 0 || widgetContainerRows === 0) {
    return <div className="w-full h-screen bg-page-background flex items-center justify-center text-page-foreground">Loading Dashboard...</div>;
  }

  return (
    <main className="w-full h-screen bg-page-background text-page-foreground overflow-hidden relative flex flex-col"
      onClick={(e) => { if (e.target === e.currentTarget && !maximizedWidgetId) setActiveWidgetId(null); }}
    >
      <header ref={headerRef} className="p-3 bg-dark-surface text-primary flex items-center justify-between shadow-lg z-40 shrink-0 border-b border-[var(--dark-border-interactive)]">
        <div className="flex items-center space-x-2">
          <button onClick={handleUndo} disabled={historyPointer.current <= 0 || !!maximizedWidgetId} className="control-button" aria-label="Undo"><UndoIcon /></button>
          <button onClick={handleRedo} disabled={historyPointer.current >= history.current.length - 1 || !!maximizedWidgetId} className="control-button" aria-label="Redo"><RedoIcon /></button>
          <div className="relative" ref={addWidgetMenuRef}>
            <button id="add-widget-button" onClick={() => setIsAddWidgetMenuOpen(prev => !prev)} disabled={!!maximizedWidgetId} className="control-button flex items-center" aria-expanded={isAddWidgetMenuOpen} aria-haspopup="true" aria-label="Add New Widget" > <AddIcon /> <span className="ml-1.5 text-xs hidden sm:inline">Add Widget</span> </button>
            {isAddWidgetMenuOpen && ( <div className="absolute backdrop-blur-md left-0 mt-2 w-56 origin-top-left rounded-md bg-dark-surface border border-dark-border-interactive shadow-xl py-1 z-50 focus:outline-none animate-modalFadeInScale" role="menu" aria-orientation="vertical" aria-labelledby="add-widget-button" > {AVAILABLE_WIDGET_DEFINITIONS.map(widgetDef => ( <button key={widgetDef.type} onClick={() => handleAddNewWidget(widgetDef.type)} className="group flex items-center w-full text-left px-3 py-2.5 text-sm text-dark-text-primary hover:bg-dark-accent-primary hover:text-dark-text-on-accent focus:bg-dark-accent-primary focus:text-dark-text-on-accent focus:outline-none transition-all duration-150 ease-in-out hover:pl-4" role="menuitem" disabled={!!maximizedWidgetId} > {widgetDef.icon && <widgetDef.icon />} <span className="flex-grow">{widgetDef.displayName || widgetDef.defaultTitle.replace("New ", "")}</span> </button> ))} </div> )}
          </div>
          <button onClick={handleExportLayout} disabled={!!maximizedWidgetId} className="control-button" aria-label="Export Layout"><ExportIcon /></button>
          <button onClick={triggerImportFileSelect} disabled={!!maximizedWidgetId} className="control-button" aria-label="Import Layout"><ImportIcon /></button>
          <input type="file" ref={fileInputRef} onChange={handleImportLayout} accept=".json" style={{ display: 'none' }} />
        </div>
        <div className="text-xs text-secondary px-3 py-1 bg-slate-700 rounded-md">History: {historyDisplay.pointer} / {historyDisplay.length}</div>
      </header>

      {maximizedWidgetId && ( <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30" onClick={() => maximizedWidgetId && handleWidgetMaximizeToggle(maximizedWidgetId)} /> )}

      <div className={`flex-grow relative ${maximizedWidgetId ? 'pointer-events-none' : ''}`}>
        <GridBackground />
        <div className="absolute inset-0 grid gap-0" style={{ gridTemplateColumns: `repeat(${widgetContainerCols}, ${CELL_SIZE}px)`, gridTemplateRows: `repeat(${widgetContainerRows}, ${CELL_SIZE}px)`, alignContent: 'start' }}>
          {widgets.map((widgetConfig) => {
            if (maximizedWidgetId && maximizedWidgetId !== widgetConfig.id) return null;
            const currentWidgetState = maximizedWidgetId === widgetConfig.id && maximizedWidgetOriginalState ? { ...maximizedWidgetOriginalState, colStart: 1, rowStart: 1, colSpan: widgetContainerCols > 2 ? widgetContainerCols - 2 : widgetContainerCols, rowSpan: widgetContainerRows > 2 ? widgetContainerRows - 2 : widgetContainerRows, isMinimized: false } : widgetConfig;
            const blueprint = AVAILABLE_WIDGET_DEFINITIONS.find(def => def.type === widgetConfig.type); let minCol = blueprint?.minColSpan || 3; let minRow = blueprint?.minRowSpan || 3;
            if (widgetConfig.isMinimized && maximizedWidgetId !== widgetConfig.id) { minCol = widgetConfig.colSpan; minRow = MINIMIZED_WIDGET_ROW_SPAN; }

            return (
              <Widget
                key={widgetConfig.id} id={widgetConfig.id} title={widgetConfig.title}
                colStart={currentWidgetState.colStart} rowStart={currentWidgetState.rowStart} colSpan={currentWidgetState.colSpan} rowSpan={currentWidgetState.rowSpan}
                onResize={handleWidgetResizeLive} onResizeEnd={handleWidgetResizeEnd} onMove={handleWidgetMove}
                onDelete={handleWidgetDelete} onFocus={handleWidgetFocus}
                onOpenSettings={handleOpenWidgetSettings}
                onOpenContainerSettings={handleOpenContainerSettingsModal}
                containerSettings={widgetConfig.containerSettings}
                isActive={widgetConfig.id === activeWidgetId && !maximizedWidgetId} CELL_SIZE={CELL_SIZE}
                minColSpan={minCol} minRowSpan={minRow} totalGridCols={widgetContainerCols} totalGridRows={widgetContainerRows}
                isMinimized={widgetConfig.isMinimized && maximizedWidgetId !== widgetConfig.id} onMinimizeToggle={() => handleWidgetMinimizeToggle(widgetConfig.id)}
                isMaximized={maximizedWidgetId === widgetConfig.id} onMaximizeToggle={() => handleWidgetMaximizeToggle(widgetConfig.id)}
              >
                {renderWidgetContent(widgetConfig)}
              </Widget>
            );
          })}
        </div>
      </div>

      {isSettingsModalOpen && selectedWidgetForSettings && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={handleCloseSettingsModal}
          title={selectedWidgetForSettings.title}
          settingsContent={getSettingsPanelForWidget(selectedWidgetForSettings)}
        />
      )}

      {isContainerSettingsModalOpen && selectedWidgetForContainerSettings && (
        <WidgetContainerSettingsModal
          isOpen={isContainerSettingsModalOpen}
          onClose={handleCloseContainerSettingsModal}
          widgetId={selectedWidgetForContainerSettings.id}
          widgetTitle={selectedWidgetForContainerSettings.title}
          currentSettings={selectedWidgetForContainerSettings.containerSettings}
          onSave={handleSaveWidgetContainerSettings}
        />
      )}
    </main>
  );
}

const styles = ` .control-button { display:flex; align-items:center; justify-content:center; padding:0.5rem; background-color:var(--dark-accent-primary); border-radius:0.375rem; color:var(--dark-text-on-accent); transition:background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out; box-shadow:0 1px 2px 0 rgba(0,0,0,0.05); } .control-button:hover { background-color:var(--dark-accent-primary-hover); box-shadow:0 2px 4px 0 rgba(0,0,0,0.1); } .control-button:disabled { background-color:hsl(222,47%,25%); color:hsl(215,20%,55%); cursor:not-allowed; box-shadow:none; } .control-button:focus-visible { outline:2px solid var(--dark-accent-primary-hover); outline-offset:2px; } `;
if (typeof window !== 'undefined') { if (!document.getElementById('custom-dashboard-styles')) { const styleSheet = document.createElement("style"); styleSheet.id = 'custom-dashboard-styles'; styleSheet.type = "text/css"; styleSheet.innerText = styles; document.head.appendChild(styleSheet); }}
