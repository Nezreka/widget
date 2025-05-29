// src/app/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Widget, { type WidgetResizeDataType, type WidgetMoveDataType, type WidgetContainerSettings } from "@/components/Widget";
import GridBackground from "@/components/GridBackground";
import SettingsModal from '@/components/SettingsModal';
import WidgetContainerSettingsModal from '@/components/WidgetContainerSettingsModal';

// Import Widget-specific components and types
import WeatherWidget, { WeatherSettingsPanel, type WeatherWidgetSettings } from "@/components/WeatherWidget";
import ClockWidget, { ClockSettingsPanel, type ClockWidgetSettings } from "@/components/ClockWidget";
import CalculatorWidget, { CalculatorSettingsPanel, type CalculatorWidgetSettings } from "@/components/CalculatorWidget";
import YoutubeWidget, { YoutubeSettingsPanel, type YoutubeWidgetSettings } from "@/components/YoutubeWidget";
import NotesWidget, {
    NotesSettingsPanel,
    type Note
} from "@/components/NotesWidget";
import TodoWidget, { TodoSettingsPanel, type TodoWidgetSettings, type TodoItem } from "@/components/TodoWidget";
import MinesweeperWidget, { MinesweeperSettingsPanel, type MinesweeperWidgetSettings } from "@/components/MinesweeperWidget";
import UnitConverterWidget, { UnitConverterSettingsPanel, type UnitConverterWidgetSettings } from "@/components/UnitConverterWidget";
import CountdownStopwatchWidget, { CountdownStopwatchSettingsPanel, type CountdownStopwatchWidgetSettings } from "@/components/CountdownStopwatchWidget";
import PhotoWidget, { PhotoSettingsPanel, type PhotoWidgetSettings, type HistoricImage } from "@/components/PhotoWidget";
import PortfolioWidget, { PortfolioSettingsPanel, type PortfolioWidgetSettings } from "@/components/PortfolioWidget";
import GeminiChatWidget, { GeminiChatSettingsPanel, type GeminiChatWidgetSettings } from "@/components/GeminiChatWidget";
// Import the new GoogleServicesHubWidget and its settings panel
import GoogleServicesHubWidget, { GoogleServicesHubSettingsPanel, type GoogleServicesHubWidgetSettings, type GoogleServiceActionKey } from "@/components/GoogleServicesHubWidget";


import AddWidgetContextMenu, { mapBlueprintToContextMenuItem, type WidgetBlueprintContextMenuItem } from '@/components/AddWidgetContextMenu';

import {
  UndoIcon,
  RedoIcon,
  ExportIcon,
  ImportIcon,
  AddIcon,
  AutoSortIcon,
  DensityIcon,
  // AI Command Bar Icons
  AiIcon,
  MicIcon,
  MicOffIcon,
  SendArrowIcon,
  CloseIcon as AiCloseIcon,
  ProcessingIcon,
} from '@/components/Icons';

import {
  DEFAULT_CELL_SIZE,
  WIDGET_SIZE_PRESETS,
  AVAILABLE_WIDGET_DEFINITIONS,
  PHOTO_WIDGET_DEFAULT_INSTANCE_SETTINGS,
  PORTFOLIO_WIDGET_DEFAULT_INSTANCE_SETTINGS,
  GEMINI_CHAT_WIDGET_DEFAULT_INSTANCE_SETTINGS,
  // Import the new default settings for the hub
  GOOGLE_SERVICES_HUB_DEFAULT_INSTANCE_SETTINGS,
  type WidgetSizePresetKey,
  type AllWidgetSettings,
  type WidgetType,
  type PageWidgetConfig,
  type PageInstanceNotesSettings,
} from '@/definitions/widgetConfig';

// AI Command Integration
import {
    type ParsedAiCommand,
    AI_COMMAND_SCHEMA,
    getGeminiSystemPrompt as getBaseGeminiSystemPrompt, // Renamed original to avoid conflict
    type AddWidgetAiCommand,
    type DeleteWidgetAiCommand,
    type MoveWidgetAiCommand,
    type ResizeWidgetAiCommand,
    type ChangeWidgetSettingAiCommand,
    type MinimizeWidgetAiCommand,
    type MaximizeWidgetAiCommand,
    type RestoreWidgetAiCommand,
    type ChangeCellSizeAiCommand,
    type SendChatMessageAiCommand,
    type GetWidgetInfoAiCommand,
    type ClarifyCommandAiCommand,
    type OpenOrFocusWidgetAiCommand,
    type TargetWidgetAiCommand,
    type BaseAiCommand,
    type UnknownAiCommand,
} from '@/definitions/aiCommands';


// --- Web Speech API Type Definitions ---
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
  readonly interpretation?: unknown;
  readonly emma?: Document;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechGrammar {
  src: string;
  weight?: number;
}
interface SpeechGrammarList {
  readonly length: number;
  item(index: number): SpeechGrammar;
  [index: number]: SpeechGrammar;
  addFromString(string: string, weight?: number): void;
  addFromURI(src: string, weight?: number): void;
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

interface SpeechRecognition extends EventTarget {
  grammars: SpeechGrammarList;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  serviceURI?: string;

  // Methods
  abort(): void;
  start(): void;
  stop(): void; // Add this line

  // Event handlers
  onaudiostart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;

  // Event listener methods
  addEventListener<K extends keyof SpeechRecognitionEventMap>(type: K, listener: (this: SpeechRecognition, ev: SpeechRecognitionEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener<K extends keyof SpeechRecognitionEventMap>(type: K, listener: (this: SpeechRecognition, ev: SpeechRecognitionEventMap[K]) => void, options?: boolean | EventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

interface SpeechRecognitionEventMap {
  "audiostart": Event;
  "audioend": Event;
  "end": Event;
  "error": SpeechRecognitionErrorEvent;
  "nomatch": SpeechRecognitionEvent;
  "result": SpeechRecognitionEvent;
  "soundstart": Event;
  "soundend": Event;
  "speechstart": Event;
  "speechend": Event;
  "start": Event;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
    SpeechSynthesisUtterance: typeof SpeechSynthesisUtterance;
    readonly speechSynthesis: SpeechSynthesis;
  }
}


// --- Page-Specific Constants ---
const CELL_SIZE_OPTIONS = [
    { label: 'Micro', value: 10 },
    { label: 'Compact', value: 20 },
    { label: 'Default', value: DEFAULT_CELL_SIZE },
    { label: 'Spacious', value: 40 },
    { label: 'Large', value: 50 },
];

const MAX_HISTORY_LENGTH = 50;
const MINIMIZED_WIDGET_ROW_SPAN = 2;
const DASHBOARD_LAYOUT_STORAGE_KEY = 'dashboardLayoutV3.23_AI_GoogleHub_Scroll'; // Updated version
const GLOBAL_NOTES_STORAGE_KEY = 'dashboardGlobalNotesCollection_v1';
const GLOBAL_TODOS_STORAGE_KEY = 'dashboardGlobalSingleTodoList_v1';
const GLOBAL_PHOTO_HISTORY_STORAGE_KEY = 'dashboardGlobalPhotoHistory_v1';
const DATA_SAVE_DEBOUNCE_MS = 700;
const WIDGET_DESELECT_TIMEOUT_MS = 5000;
const MOBILE_BREAKPOINT_PX = 768; // Mobile breakpoint
const SMOOTH_SCROLL_DURATION_MS = 1000; // For widget centering

const DEFAULT_WIDGET_CONTAINER_SETTINGS: WidgetContainerSettings = {
    alwaysShowTitleBar: false,
    innerPadding: 'px-3.5 py-3',
};

interface NotesCollectionStorage {
    notes: Note[];
    activeNoteId: string | null;
}

const initialDesktopWidgetsLayout: Omit<PageWidgetConfig, 'colSpan' | 'rowSpan' | 'minColSpan' | 'minRowSpan'>[] = [
  {
    id: "portfolio-main", title: "Broque Thomas - Portfolio", type: "portfolio",
    colStart: 1, rowStart: 1,
    settings: PORTFOLIO_WIDGET_DEFAULT_INSTANCE_SETTINGS, isMinimized: false,
    containerSettings: { ...DEFAULT_WIDGET_CONTAINER_SETTINGS, innerPadding: 'px-3.5 py-3' }
  },
];

const initialMobileWidgetLayout: Omit<PageWidgetConfig, 'colSpan' | 'rowSpan' | 'minColSpan' | 'minRowSpan'>[] = [
  {
    id: "portfolio-main", title: "Broque Thomas - Portfolio", type: "portfolio",
    colStart: 1, rowStart: 1,
    settings: PORTFOLIO_WIDGET_DEFAULT_INSTANCE_SETTINGS, isMinimized: false,
    containerSettings: { ...DEFAULT_WIDGET_CONTAINER_SETTINGS, innerPadding: 'px-3.5 py-3' }
  },
];


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
        isSlideshowActive: currentPhotoSettings?.isSlideshowActive || photoInstanceDefaults.isSlideshowActive,
        slideshowMode: currentPhotoSettings?.slideshowMode || photoInstanceDefaults.slideshowMode,
        slideshowInterval: currentPhotoSettings?.slideshowInterval || photoInstanceDefaults.slideshowInterval,
        slideshowKeyword: currentPhotoSettings?.slideshowKeyword || photoInstanceDefaults.slideshowKeyword,
        slideshowProvider: currentPhotoSettings?.slideshowProvider || photoInstanceDefaults.slideshowProvider,
        slideshowTransitionEffect: currentPhotoSettings?.slideshowTransitionEffect || photoInstanceDefaults.slideshowTransitionEffect,
    };
};
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
const ensureGeminiChatWidgetInstanceSettings = (settings: AllWidgetSettings | undefined): GeminiChatWidgetSettings => {
    const geminiChatInstanceDefaults = GEMINI_CHAT_WIDGET_DEFAULT_INSTANCE_SETTINGS;
    const currentGeminiChatSettings = settings as GeminiChatWidgetSettings | undefined;
    return {
        customSystemPrompt: currentGeminiChatSettings?.customSystemPrompt || geminiChatInstanceDefaults.customSystemPrompt,
    };
};
const ensureGoogleServicesHubInstanceSettings = (settings: AllWidgetSettings | undefined): GoogleServicesHubWidgetSettings => {
    const hubInstanceDefaults = GOOGLE_SERVICES_HUB_DEFAULT_INSTANCE_SETTINGS;
    const currentHubSettings = settings as GoogleServicesHubWidgetSettings | undefined;
    return {
        animationSpeed: currentHubSettings?.animationSpeed || hubInstanceDefaults.animationSpeed,
    };
};

const processWidgetConfig = (
    widgetData: Partial<PageWidgetConfig>,
    currentCellSize: number,
    isMobileTarget?: boolean,
    containerColsForMobile?: number,
    containerRowsForMobile?: number
): PageWidgetConfig => {
    const blueprint = AVAILABLE_WIDGET_DEFINITIONS.find(def => def.type === widgetData.type);

    if (!blueprint) {
        const defaultPresetFallback = WIDGET_SIZE_PRESETS.small_square;
        return {
            id: widgetData.id || `generic-${Date.now()}`,
            title: widgetData.title || "Untitled Widget",
            type: widgetData.type || 'generic',
            colStart: widgetData.colStart || 1,
            rowStart: widgetData.rowStart || 1,
            colSpan: widgetData.colSpan || Math.max(1, Math.round(defaultPresetFallback.targetWidthPx / currentCellSize)),
            rowSpan: widgetData.rowSpan || Math.max(1, Math.round(defaultPresetFallback.targetHeightPx / currentCellSize)),
            minColSpan: widgetData.minColSpan || 3,
            minRowSpan: widgetData.minRowSpan || 3,
            isMinimized: widgetData.isMinimized || false,
            settings: widgetData.settings || {},
            containerSettings: { ...DEFAULT_WIDGET_CONTAINER_SETTINGS, ...(widgetData.containerSettings || {}) },
            originalRowSpan: widgetData.originalRowSpan,
        };
    }

    let colSpan, rowSpan;

    if (isMobileTarget && widgetData.type === 'portfolio' && containerColsForMobile && containerRowsForMobile) {
        colSpan = Math.max(blueprint.minColSpan, containerColsForMobile);
        rowSpan = Math.max(blueprint.minRowSpan, containerRowsForMobile > 1 ? containerRowsForMobile -1 : 1);
    } else if (widgetData.colSpan !== undefined && widgetData.rowSpan !== undefined) {
        colSpan = widgetData.colSpan;
        rowSpan = widgetData.rowSpan;
    } else {
        const presetSizeTargets = WIDGET_SIZE_PRESETS[blueprint.defaultSizePreset];
        colSpan = Math.max(blueprint.minColSpan, Math.max(1, Math.round(presetSizeTargets.targetWidthPx / currentCellSize)));
        rowSpan = Math.max(blueprint.minRowSpan, Math.max(1, Math.round(presetSizeTargets.targetHeightPx / currentCellSize)));
    }

    let finalContentSettings = { ...(blueprint.defaultSettings || {}), ...(widgetData.settings || {}) };
    if (widgetData.type === 'photo') finalContentSettings = ensurePhotoWidgetInstanceSettings(finalContentSettings as PhotoWidgetSettings);
    else if (widgetData.type === 'portfolio') finalContentSettings = ensurePortfolioWidgetInstanceSettings(finalContentSettings as PortfolioWidgetSettings);
    else if (widgetData.type === 'geminiChat') finalContentSettings = ensureGeminiChatWidgetInstanceSettings(finalContentSettings as GeminiChatWidgetSettings);
    else if (widgetData.type === 'googleServicesHub') finalContentSettings = ensureGoogleServicesHubInstanceSettings(finalContentSettings as GoogleServicesHubWidgetSettings);


    const finalContainerSettings: WidgetContainerSettings = {
        ...DEFAULT_WIDGET_CONTAINER_SETTINGS,
        ...(widgetData.containerSettings || {})
    };
     if (isMobileTarget && widgetData.type === 'portfolio') {
        finalContainerSettings.innerPadding = 'p-0';
    }
    if (widgetData.type === 'googleServicesHub') {
        finalContainerSettings.innerPadding = 'p-0';
    }


    return {
        id: widgetData.id || `${blueprint.type}-${Date.now()}`,
        title: widgetData.title || blueprint.defaultTitle,
        type: blueprint.type,
        colStart: widgetData.colStart || 1,
        rowStart: widgetData.rowStart || 1,
        colSpan: colSpan,
        rowSpan: rowSpan,
        minColSpan: blueprint.minColSpan,
        minRowSpan: blueprint.minRowSpan,
        isMinimized: widgetData.isMinimized || false,
        settings: finalContentSettings,
        containerSettings: finalContainerSettings,
        originalRowSpan: widgetData.originalRowSpan,
    };
};

interface StoredDashboardLayout {
    dashboardVersion: string;
    widgets: PageWidgetConfig[];
    cellSize?: number;
    notesCollection?: NotesCollectionStorage;
    sharedGlobalTodos?: TodoItem[];
    sharedGlobalPhotoHistory?: HistoricImage[];
    isMobileLayout?: boolean;
    actualGridPixelWidth?: number; // Added for scrollable grid
}

const getGeminiSystemPrompt = (widgets: PageWidgetConfig[]): string => {
  const basePrompt = getBaseGeminiSystemPrompt(widgets);
  const promptLines = [basePrompt];

  promptLines.push("\n--- YouTube Widget Specific Instructions (CRITICAL - READ CAREFULLY) ---");
  promptLines.push("When the user's command is about YouTube:");
  promptLines.push("1. The action is ALWAYS 'openOrFocusWidget' with 'widgetType': 'youtube'.");
  promptLines.push("2. **If the user's command includes ANY phrases like 'search for', 'find videos of', 'show me videos of', 'look for', 'YouTube [something]' or ANY other indication they want to find specific content on YouTube:**");
  promptLines.push("   - You **MUST** extract the search term (e.g., if they say 'YouTube search for epic cat fails', the search term is 'epic cat fails').");
  promptLines.push("   - You **MUST** include the 'initialSettings' field in your JSON command.");
  promptLines.push("   - Inside 'initialSettings', you **MUST** include a key named 'defaultSearchQuery'.");
  promptLines.push("   - The value for 'defaultSearchQuery' **MUST BE** the exact search term you extracted.");
  promptLines.push("   - **THIS IS NOT OPTIONAL. IF A SEARCH IS INTENDED, `initialSettings.defaultSearchQuery` IS REQUIRED.** Failure to include it means the search will NOT happen, and the command is INCORRECT.");
  promptLines.push("   - **CORRECT Example** for user prompt 'Show me music videos by Virtual Mage on YouTube':");
  promptLines.push("     `{ \"action\": \"openOrFocusWidget\", \"widgetType\": \"youtube\", \"initialSettings\": { \"defaultSearchQuery\": \"music videos by Virtual Mage\" }, \"feedbackToUser\": \"Searching YouTube for music videos by Virtual Mage...\" }`");
  promptLines.push("   - **INCORRECT Example** for user prompt 'Show me music videos by Virtual Mage on YouTube':");
  promptLines.push("     `{ \"action\": \"openOrFocusWidget\", \"widgetType\": \"youtube\", \"feedbackToUser\": \"Opening YouTube...\" }` <-- WRONG! Missing `initialSettings.defaultSearchQuery`.");
  promptLines.push("3. If, and ONLY IF, the user's command is simply to 'open YouTube' or 'focus on YouTube' WITHOUT ANY search term or search intent mentioned:");
  promptLines.push("   - Then 'initialSettings' can be omitted, or 'defaultSearchQuery' can be an empty string if 'initialSettings' is present for other reasons.");
  promptLines.push("   - Example for 'open YouTube':");
  promptLines.push("     `{ \"action\": \"openOrFocusWidget\", \"widgetType\": \"youtube\", \"feedbackToUser\": \"Opening YouTube...\" }`");

  const youtubeWidgets = widgets.filter(w => w.type === 'youtube');
  if (youtubeWidgets.length > 0) {
    promptLines.push("\nExisting YouTube Widgets:");
    youtubeWidgets.forEach(ytWidget => {
      const currentSearch = (ytWidget.settings as YoutubeWidgetSettings)?.defaultSearchQuery;
      promptLines.push(`- Title: '${ytWidget.title}', ID: '${ytWidget.id}'. Current search: ${currentSearch ? `'${currentSearch}'` : 'none'}. If user wants to search in THIS specific widget, use its ID/title and include the new 'initialSettings.defaultSearchQuery'.`);
    });
  } else {
    promptLines.push("\nNo YouTube widgets exist. If user wants to search, you MUST add a new one AND include 'initialSettings.defaultSearchQuery'.");
  }
  promptLines.push("--- End YouTube Widget Specific Instructions ---");

  return promptLines.join('\n');
};

// Helper function for smooth scrolling with duration
const smoothScrollTo = (element: HTMLElement, to: number, duration: number, axis: 'left' | 'top') => {
  const start = axis === 'left' ? element.scrollLeft : element.scrollTop;
  const change = to - start;
  const startTime = performance.now();

  const animateScroll = (currentTime: number) => {
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / duration, 1);
    // Cubic ease-out: starts fast, decelerates
    const easedProgress = 1 - Math.pow(1 - progress, 3);

    if (axis === 'left') {
      element.scrollLeft = start + change * easedProgress;
    } else {
      element.scrollTop = start + change * easedProgress;
    }

    if (elapsedTime < duration) {
      requestAnimationFrame(animateScroll);
    }
  };
  requestAnimationFrame(animateScroll);
};


export default function Home() {
  const [isMobileView, setIsMobileView] = useState(false);
  const [cellSize, setCellSize] = useState<number>(DEFAULT_CELL_SIZE);
  const [widgetContainerCols, setWidgetContainerCols] = useState(0);
  const [widgetContainerRows, setWidgetContainerRows] = useState(0);
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);
  const [actualGridPixelWidth, setActualGridPixelWidth] = useState(0); // For dynamic grid width

  const initialLayoutIsDefaultRef = useRef(false);
  const initialCenteringDoneRef = useRef(false);
  const [widgets, setWidgets] = useState<PageWidgetConfig[]>([]);
  const [isLayoutEngineReady, setIsLayoutEngineReady] = useState(false);

  const [showAiCommandBar, setShowAiCommandBar] = useState(false);
  const [aiInputValue, setAiInputValue] = useState('');
  const [aiIsListening, setAiIsListening] = useState(false);
  const [aiIsProcessing, setAiIsProcessing] = useState(false);
  const [aiLastFeedback, setAiLastFeedback] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);


  useEffect(() => {
    const checkMobile = () => {
      const newIsMobileView = window.innerWidth < MOBILE_BREAKPOINT_PX;
      if (newIsMobileView !== isMobileView) { // Only update if it changes
          setIsMobileView(newIsMobileView);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isMobileView]); // Re-run if isMobileView itself changes (e.g. due to import)

 useEffect(() => {
    let loadedCellSize = DEFAULT_CELL_SIZE;
    let loadedWidgets: PageWidgetConfig[] | null = null;
    let wasMobileLayoutSaved = false;
    let loadedGridPixelWidth: number | undefined = undefined;

    if (typeof window !== 'undefined') {
        const savedLayoutJSON = window.localStorage.getItem(DASHBOARD_LAYOUT_STORAGE_KEY);
        if (savedLayoutJSON) {
            try {
                const savedData = JSON.parse(savedLayoutJSON) as StoredDashboardLayout;
                if (savedData && typeof savedData === 'object' && !Array.isArray(savedData) && savedData.dashboardVersion) {
                    const loadedVersion = String(savedData.dashboardVersion).replace('v','V');
                    const currentVersion = DASHBOARD_LAYOUT_STORAGE_KEY.replace('dashboardLayoutV','V');

                    if (loadedVersion === currentVersion) {
                        if (typeof savedData.cellSize === 'number') {
                            const validOption = CELL_SIZE_OPTIONS.find(opt => opt.value === savedData.cellSize);
                            if (validOption) loadedCellSize = validOption.value;
                        }
                        wasMobileLayoutSaved = savedData.isMobileLayout || false;
                        loadedGridPixelWidth = savedData.actualGridPixelWidth;


                        if (isMobileView === wasMobileLayoutSaved && Array.isArray(savedData.widgets)) {
                            const tempContainerWidth = loadedGridPixelWidth || window.innerWidth;
                            loadedWidgets = savedData.widgets.map(w => processWidgetConfig(
                                w as Partial<PageWidgetConfig>,
                                loadedCellSize,
                                isMobileView,
                                isMobileView ? Math.floor(tempContainerWidth / loadedCellSize) : undefined,
                                isMobileView ? Math.floor((window.innerHeight - (headerRef.current?.offsetHeight || 60)) / loadedCellSize) : undefined
                            ));
                            initialLayoutIsDefaultRef.current = false;
                        } else {
                             console.log(`[page.tsx] View mode mismatch or missing widgets. Using default layout for current view.`);
                        }
                    } else {
                        console.log(`[page.tsx] Storage key version mismatch. Using new initial layout. Saved: ${loadedVersion}, Current: ${currentVersion}`);
                    }
                } else {
                    console.log(`[page.tsx] Invalid or legacy layout structure.`);
                }
            } catch (error) {
                console.error("[page.tsx] Error loading/parsing dashboard layout from localStorage:", error);
            }
        }
    }
    setCellSize(loadedCellSize);
    setActualGridPixelWidth(loadedGridPixelWidth || window.innerWidth);


    if (loadedWidgets) {
        setWidgets(loadedWidgets);
    } else {
        const baseLayout = isMobileView ? initialMobileWidgetLayout : initialDesktopWidgetsLayout;
        const tempCols = Math.floor((loadedGridPixelWidth || window.innerWidth) / loadedCellSize);
        const tempRows = Math.floor((window.innerHeight - (headerRef.current?.offsetHeight || 60)) / loadedCellSize);

        setWidgets(baseLayout.map(w => processWidgetConfig(
            w as Partial<PageWidgetConfig>,
            loadedCellSize,
            isMobileView,
            isMobileView ? tempCols : undefined,
            isMobileView ? tempRows : undefined
        )));
        initialLayoutIsDefaultRef.current = true;
        initialCenteringDoneRef.current = isMobileView;
    }
    setIsLayoutEngineReady(true);
  }, [isMobileView]);


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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dashboardAreaRef = useRef<HTMLDivElement>(null); // Will be the scroll container
  const gridWrapperRef = useRef<HTMLDivElement>(null); // Wraps the actual grid for width control
  const densityMenuRef = useRef<HTMLDivElement>(null);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedWidgetForSettings, setSelectedWidgetForSettings] = useState<PageWidgetConfig | null>(null);

  const [isContainerSettingsModalOpen, setIsContainerSettingsModalOpen] = useState(false);
  const [selectedWidgetForContainerSettings, setSelectedWidgetForContainerSettings] = useState<PageWidgetConfig | null>(null);

  const [maximizedWidgetId, setMaximizedWidgetId] = useState<string | null>(null);
  const [maximizedWidgetOriginalState, setMaximizedWidgetOriginalState] = useState<PageWidgetConfig | null>(null);
  const [isAddWidgetMenuOpen, setIsAddWidgetMenuOpen] = useState(false);
  const addWidgetMenuRef = useRef<HTMLDivElement>(null);
  const [historyDisplay, setHistoryDisplay] = useState({ pointer: 0, length: 0 });

  const [isAddWidgetContextMenuOpen, setIsAddWidgetContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [contextMenuAvailableWidgets, setContextMenuAvailableWidgets] = useState<WidgetBlueprintContextMenuItem[]>([]);
  const [isDensityMenuOpen, setIsDensityMenuOpen] = useState(false);


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
    if (isLayoutEngineReady && widgets && widgets.length >= 0 && history.current.length === 0) {
        history.current = [JSON.parse(JSON.stringify(widgets))];
        historyPointer.current = 0;
        setHistoryDisplay({ pointer: historyPointer.current + 1, length: history.current.length });
    }
  }, [widgets, isLayoutEngineReady]);


  useEffect(() => {
    if (typeof window !== 'undefined' && isLayoutEngineReady) {
      try {
        const dataToSave: StoredDashboardLayout = {
            dashboardVersion: DASHBOARD_LAYOUT_STORAGE_KEY.replace('dashboardLayoutV','v'),
            widgets: widgets,
            cellSize: cellSize,
            isMobileLayout: isMobileView,
            actualGridPixelWidth: actualGridPixelWidth, // Save the grid width
        };
        window.localStorage.setItem(DASHBOARD_LAYOUT_STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (error) { console.error("Error saving dashboard layout to localStorage:", error); }
    }
  }, [widgets, cellSize, isMobileView, isLayoutEngineReady, actualGridPixelWidth]);

  useEffect(() => {
    if (widgetContainerCols > 0 && initialLayoutIsDefaultRef.current && !initialCenteringDoneRef.current && widgets.length > 0 && !isMobileView) {
        const portfolioBlueprint = AVAILABLE_WIDGET_DEFINITIONS.find(b => b.type === "portfolio");
        const geminiChatBlueprint = AVAILABLE_WIDGET_DEFINITIONS.find(b => b.type === "geminiChat");
        const clockBlueprint = AVAILABLE_WIDGET_DEFINITIONS.find(b => b.type === "clock");

        if (portfolioBlueprint && geminiChatBlueprint && clockBlueprint) {
            const portfolioPreset = WIDGET_SIZE_PRESETS[portfolioBlueprint.defaultSizePreset];
            const geminiPreset = WIDGET_SIZE_PRESETS[geminiChatBlueprint.defaultSizePreset];
            const clockPreset = WIDGET_SIZE_PRESETS[clockBlueprint.defaultSizePreset];

            const portfolioSpan = Math.max(portfolioBlueprint.minColSpan, Math.max(1, Math.round(portfolioPreset.targetWidthPx / cellSize)));
            const geminiChatSpan = Math.max(geminiChatBlueprint.minColSpan, Math.max(1, Math.round(geminiPreset.targetWidthPx / cellSize)));
            const clockSpan = Math.max(clockBlueprint.minColSpan, Math.max(1, Math.round(clockPreset.targetWidthPx / cellSize)));

            const gap = 2;
            const totalBlockSpan = portfolioSpan + gap + geminiChatSpan + gap + clockSpan;
            let leftOffset = Math.floor((widgetContainerCols - totalBlockSpan) / 2);
            if (leftOffset < 1) leftOffset = 0;

            const newPortfolioColStart = Math.max(1, leftOffset + 1);
            const newGeminiChatColStart = newPortfolioColStart + portfolioSpan + gap;
            const newClockColStart = newGeminiChatColStart + geminiChatSpan + gap;

            if (newClockColStart + clockSpan -1 <= widgetContainerCols) {
                setWidgets(currentWidgets => {
                    const updated = currentWidgets.map(w => {
                        if (w.id === "portfolio-main") return { ...w, colStart: newPortfolioColStart, colSpan: portfolioSpan };
                        if (w.id === "gemini-chat-main") return { ...w, colStart: newGeminiChatColStart, colSpan: geminiChatSpan };
                        if (w.id === "clock-widget-main") return { ...w, colStart: newClockColStart, colSpan: clockSpan };
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
        } else {
             console.warn("[page.tsx] Could not find all blueprints for initial centering logic.");
             initialCenteringDoneRef.current = true;
             initialLayoutIsDefaultRef.current = false;
        }
    }
  }, [widgetContainerCols, updateWidgetsAndPushToHistory, widgets, cellSize, isMobileView, isLayoutEngineReady]);


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

  useEffect(() => { 
    if (deselectTimerRef.current) { 
        clearTimeout(deselectTimerRef.current); 
        deselectTimerRef.current = null; 
    } 
    if (activeWidgetId && !maximizedWidgetId) { 
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

  useEffect(() => { const handleClickOutside = (e: MouseEvent) => { if (addWidgetMenuRef.current && !addWidgetMenuRef.current.contains(e.target as Node)) { setIsAddWidgetMenuOpen(false); } if (densityMenuRef.current && !densityMenuRef.current.contains(e.target as Node)) { setIsDensityMenuOpen(false); }}; if (isAddWidgetMenuOpen || isDensityMenuOpen) { document.addEventListener('mousedown', handleClickOutside); } else { document.removeEventListener('mousedown', handleClickOutside); } return () => { document.removeEventListener('mousedown', handleClickOutside); }; }, [isAddWidgetMenuOpen, isDensityMenuOpen]);


  useEffect(() => {
    const determineWidgetContainerGridSize = () => {
      const screenWidth = window.innerWidth; 
      const screenHeight = window.innerHeight;
      const currentHeaderHeight = headerRef.current?.offsetHeight || 60;
      const aiCommandBarHeight = showAiCommandBar ? (document.getElementById('ai-command-bar')?.offsetHeight || 70) : 0;
      const mainContentHeight = screenHeight - currentHeaderHeight - aiCommandBarHeight;

      let maxColOccupied = 0;
      if (widgets && widgets.length > 0) {
          widgets.forEach(w => {
              maxColOccupied = Math.max(maxColOccupied, w.colStart + w.colSpan -1);
          });
      }
      
      // Calculate the minimum width required by widgets in pixels
      const minRequiredWidgetPixelWidth = maxColOccupied * cellSize;
      // The actual grid width should be at least the viewport width, or wider if widgets demand it
      const calculatedGridPixelWidth = Math.max(screenWidth, minRequiredWidgetPixelWidth);
      setActualGridPixelWidth(calculatedGridPixelWidth);


      const newCols = Math.max(1, Math.floor(calculatedGridPixelWidth / cellSize));
      const newRows = Math.max(1, Math.floor(mainContentHeight / cellSize));
      
      setWidgetContainerCols(newCols);
      setWidgetContainerRows(newRows);

      // Special handling for mobile full-screen portfolio
      if (isMobileView && widgets.length === 1 && widgets[0].type === 'portfolio') {
        setWidgets(currentWidgets => currentWidgets.map(w => {
          if (w.type === 'portfolio') {
            return {
              ...w,
              colStart: 1,
              rowStart: 1,
              colSpan: newCols, // Use newCols based on actualGridPixelWidth (which is screenWidth for mobile)
              rowSpan: newRows > 1 ? newRows -1 : 1,
            };
          }
          return w;
        }));
      }
    };
    determineWidgetContainerGridSize(); 
    const timeoutId = setTimeout(determineWidgetContainerGridSize, 100); // Recalculate shortly after initial load
    window.addEventListener('resize', determineWidgetContainerGridSize);
    return () => { clearTimeout(timeoutId); window.removeEventListener('resize', determineWidgetContainerGridSize); };
  }, [cellSize, widgets, showAiCommandBar, isMobileView]); // isMobileView added as widgets might change based on it.

  useEffect(() => {
    setContextMenuAvailableWidgets(
      AVAILABLE_WIDGET_DEFINITIONS.map(blueprint => mapBlueprintToContextMenuItem(blueprint))
    );
  }, []);

  const handleExportLayout = () => {
    if (typeof window === 'undefined') return;
    try {
      const layoutToExport: StoredDashboardLayout = { 
          dashboardVersion: DASHBOARD_LAYOUT_STORAGE_KEY.replace('dashboardLayoutV','v'), 
          widgets: widgets, 
          cellSize: cellSize, 
          notesCollection: { notes: sharedNotes, activeNoteId: activeSharedNoteId }, 
          sharedGlobalTodos: sharedTodos, 
          sharedGlobalPhotoHistory: sharedPhotoHistory, 
          isMobileLayout: isMobileView,
          actualGridPixelWidth: actualGridPixelWidth // Export current grid width
      };
      const jsonString = JSON.stringify(layoutToExport, null, 2); const blob = new Blob([jsonString],{type:'application/json'}); const href = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = href; link.download = `dashboard-layout-${layoutToExport.dashboardVersion}.json`; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(href);
    } catch (error) { console.error("Error exporting layout:", error); alert("Error exporting layout."); }
  };

  const doRectanglesOverlap = useCallback((
    r1C: number, r1R: number, r1CS: number, r1RS: number,
    r2C: number, r2R: number, r2CS: number, r2RS: number,
    buffer: number = 0,
    overrideTotalCols?: number, 
    overrideTotalRows?: number 
  ): boolean => {
    const totalCols = overrideTotalCols !== undefined ? overrideTotalCols : widgetContainerCols;
    const totalRows = overrideTotalRows !== undefined ? overrideTotalRows : widgetContainerRows;

    const r2BufferedColStart = Math.max(1, r2C - buffer);
    const r2BufferedRowStart = Math.max(1, r2R - buffer);
    const r2BufferedColEnd = Math.min(totalCols > 0 ? totalCols : Infinity, r2C + r2CS - 1 + buffer);
    const r2BufferedRowEnd = Math.min(totalRows > 0 ? totalRows : Infinity, r2R + r2RS - 1 + buffer);

    const r1ColEnd = r1C + r1CS - 1;
    const r1RowEnd = r1R + r1RS - 1;
    const overlapX = r1C <= r2BufferedColEnd && r1ColEnd >= r2BufferedColStart;
    const overlapY = r1R <= r2BufferedRowEnd && r1RowEnd >= r2BufferedRowStart;

    return overlapX && overlapY;
  }, [widgetContainerCols, widgetContainerRows]);

  const canPlaceWidget = useCallback((
    widgetToPlace: PageWidgetConfig,
    targetCol: number,
    targetRow: number,
    currentLayout: PageWidgetConfig[],
    overrideTotalCols?: number,
    overrideTotalRows?: number
  ): boolean => {
    const totalCols = overrideTotalCols !== undefined ? overrideTotalCols : widgetContainerCols;
    const totalRows = overrideTotalRows !== undefined ? overrideTotalRows : widgetContainerRows;

    if (totalCols === 0 || totalRows === 0) return false; 
    if (targetCol < 1 || targetRow < 1 ||
        targetCol + widgetToPlace.colSpan - 1 > totalCols ||
        targetRow + widgetToPlace.rowSpan - 1 > totalRows) {
      return false; 
    }
    for (const existingWidget of currentLayout) {
      if (existingWidget.id === widgetToPlace.id) continue;
      if (doRectanglesOverlap(
        targetCol, targetRow, widgetToPlace.colSpan, widgetToPlace.rowSpan,
        existingWidget.colStart, existingWidget.rowStart, existingWidget.colSpan, existingWidget.rowSpan,
        0, 
        totalCols, 
        totalRows  
      )) {
        return false; 
      }
    }
    return true;
  }, [widgetContainerCols, widgetContainerRows, doRectanglesOverlap]);


  const performAutoSort = useCallback((widgetsToSort: PageWidgetConfig[]): PageWidgetConfig[] | null => {
    if (widgetContainerCols === 0 || widgetContainerRows === 0) return null;

    const sortedWidgets = [...widgetsToSort].sort((a, b) => {
        if (a.rowStart !== b.rowStart) return a.rowStart - b.rowStart;
        if (a.colStart !== b.colStart) return a.colStart - b.colStart;
        return a.id.localeCompare(b.id);
    });

    const newLayout: PageWidgetConfig[] = [];
    for (const widget of sortedWidgets) {
        let placed = false;
        for (let r = 1; r <= widgetContainerRows; r++) {
            for (let c = 1; c <= widgetContainerCols; c++) {
                const checkWidget = {
                    ...widget,
                    colSpan: Math.max(widget.colSpan, widget.minColSpan),
                    rowSpan: Math.max(widget.rowSpan, widget.minRowSpan),
                };
                // Here, canPlaceWidget uses the state widgetContainerCols/Rows by default
                if (canPlaceWidget(checkWidget, c, r, newLayout)) { 
                    newLayout.push({ ...widget, colStart: c, rowStart: r });
                    placed = true;
                    break;
                }
            }
            if (placed) break;
        }
        if (!placed) {
             console.warn(`[performAutoSort] Could not place widget: ${widget.id} (${widget.title}). Grid might be too full or too narrow with current dimensions: ${widgetContainerCols}x${widgetContainerRows}.`);
            return null;
        }
    }
    return newLayout;
  }, [widgetContainerCols, widgetContainerRows, canPlaceWidget]);

  const performAutoSortWithGivenGrid = useCallback((
    widgetsToSort: PageWidgetConfig[], 
    newCols: number, 
    newRows: number
  ): PageWidgetConfig[] | null => {
    if (newCols === 0 || newRows === 0) return null;

    const sortedWidgets = [...widgetsToSort].sort((a, b) => {
        if (a.rowStart !== b.rowStart) return a.rowStart - b.rowStart;
        if (a.colStart !== b.colStart) return a.colStart - b.colStart;
        return a.id.localeCompare(b.id);
    });

    const newLayout: PageWidgetConfig[] = [];
    for (const widget of sortedWidgets) {
        let placed = false;
        for (let r = 1; r <= newRows; r++) { 
            for (let c = 1; c <= newCols; c++) { 
                const checkWidget = {
                    ...widget,
                    colSpan: Math.max(widget.colSpan, widget.minColSpan),
                    rowSpan: Math.max(widget.rowSpan, widget.minRowSpan),
                };
                if (canPlaceWidget(checkWidget, c, r, newLayout, newCols, newRows)) {
                    newLayout.push({ ...widget, colStart: c, rowStart: r });
                    placed = true;
                    break;
                }
            }
            if (placed) break;
        }
        if (!placed) {
             console.warn(`[performAutoSortWithGivenGrid] Could not place widget: ${widget.id} within ${newCols}x${newRows} grid.`);
            return null;
        }
    }
    return newLayout;
  }, [canPlaceWidget]); // Removed doRectanglesOverlap as it's used via canPlaceWidget

  const handleImportLayout = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (typeof window === 'undefined') return;
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result;
            if (typeof text !== 'string') throw new Error("Failed to read file content.");
            const parsedJson = JSON.parse(text); 

            let finalWidgetsToSet: PageWidgetConfig[];
            let finalCellSize = cellSize;
            let notesToSet = sharedNotes;
            let activeNoteIdToSet = activeSharedNoteId;
            let todosToSet = sharedTodos;
            let photoHistoryToSet = sharedPhotoHistory;
            let alertMessage = "";
            let importedIsMobileLayout = false;
            let importedGridPixelWidth = window.innerWidth;


            if (typeof parsedJson === 'object' && parsedJson !== null && !Array.isArray(parsedJson) && 'dashboardVersion' in parsedJson && 'widgets' in parsedJson) {
                const modernData = parsedJson as StoredDashboardLayout; 
                importedIsMobileLayout = modernData.isMobileLayout || false;
                importedGridPixelWidth = modernData.actualGridPixelWidth || window.innerWidth;


                if (typeof modernData.cellSize === 'number') {
                    const validOption = CELL_SIZE_OPTIONS.find(opt => opt.value === modernData.cellSize);
                    if (validOption) finalCellSize = validOption.value;
                }

                const tempCols = Math.floor(importedGridPixelWidth / finalCellSize);
                const tempRows = Math.floor((window.innerHeight - (headerRef.current?.offsetHeight || 60)) / finalCellSize);

                if (isMobileView !== importedIsMobileLayout) {
                    alertMessage = `Imported layout was for ${importedIsMobileLayout ? 'mobile' : 'desktop'} view. Adapting to current ${isMobileView ? 'mobile' : 'desktop'} view with default widgets. Global data imported.`;
                    const baseLayout = isMobileView ? initialMobileWidgetLayout : initialDesktopWidgetsLayout;
                    finalWidgetsToSet = baseLayout.map(w => processWidgetConfig(
                        w as Partial<PageWidgetConfig>,
                        finalCellSize,
                        isMobileView,
                        isMobileView ? tempCols : undefined,
                        isMobileView ? tempRows : undefined
                    ));
                    // For view mismatch, reset grid width to current viewport width
                    importedGridPixelWidth = window.innerWidth; 
                } else {
                     finalWidgetsToSet = (modernData.widgets || []).map(w => processWidgetConfig(
                        w as Partial<PageWidgetConfig>,
                        finalCellSize,
                        isMobileView,
                        isMobileView ? tempCols : undefined,
                        isMobileView ? tempRows : undefined
                    ));
                    alertMessage = `Dashboard layout (version ${modernData.dashboardVersion}), settings, and global data imported successfully for ${isMobileView ? 'mobile' : 'desktop'} view!`;
                }


                if (modernData.notesCollection) { notesToSet = modernData.notesCollection.notes || []; activeNoteIdToSet = modernData.notesCollection.activeNoteId || null; }
                if (modernData.sharedGlobalTodos) todosToSet = modernData.sharedGlobalTodos;
                if (modernData.sharedGlobalPhotoHistory) photoHistoryToSet = modernData.sharedGlobalPhotoHistory;


            } else if (Array.isArray(parsedJson)) { 
                alertMessage = "Dashboard layout (legacy format) imported. Adapting to current view. Global data and settings will use defaults or existing data.";
                const tempCols = Math.floor(window.innerWidth / cellSize); // Use current viewport for legacy
                const tempRows = Math.floor((window.innerHeight - (headerRef.current?.offsetHeight || 60)) / cellSize);
                importedGridPixelWidth = window.innerWidth; // Reset for legacy

                if (isMobileView) {
                    const baseLayout = initialMobileWidgetLayout;
                     finalWidgetsToSet = baseLayout.map(w => processWidgetConfig(
                        w as Partial<PageWidgetConfig>,
                        cellSize,
                        true, tempCols, tempRows
                    ));
                } else {
                    const processedLegacy = (parsedJson as Partial<PageWidgetConfig>[]).map(w => processWidgetConfig(w, cellSize));
                    finalWidgetsToSet = performAutoSort(processedLegacy) || processedLegacy;
                }

            } else {
                throw new Error("Invalid file format. Could not recognize dashboard structure.");
            }

            alert(alertMessage);

            setCellSize(finalCellSize);
            setActualGridPixelWidth(importedGridPixelWidth); // Set the imported or reset width
            setWidgets(finalWidgetsToSet); // Set widgets first
            // Then trigger a re-calculation of cols/rows based on new width and cell size
            // This will be handled by the useEffect for [cellSize, widgets, ...]

            setSharedNotes(notesToSet);
            setActiveSharedNoteId(activeNoteIdToSet);
            setSharedTodos(todosToSet);
            setSharedPhotoHistory(photoHistoryToSet);
            setActiveWidgetId(null);
            setMaximizedWidgetId(null);

            history.current = [JSON.parse(JSON.stringify(finalWidgetsToSet))];
            historyPointer.current = 0;
            setHistoryDisplay({ pointer: historyPointer.current + 1, length: history.current.length });

            initialLayoutIsDefaultRef.current = false;
            initialCenteringDoneRef.current = true;

        } catch (err: unknown) {
            let message = 'Invalid file content.';
            if (err instanceof Error) { message = err.message; }
            console.error("Error importing layout:", err);
            alert(`Error importing layout: ${message}`);
        }
        finally { if (fileInputRef.current) fileInputRef.current.value = ""; }
    };
    reader.onerror = () => { alert("Error reading file."); if (fileInputRef.current) fileInputRef.current.value = ""; };
    reader.readAsText(file);
  };

  const triggerImportFileSelect = () => { if (fileInputRef.current) fileInputRef.current.click(); };
  const handleAutoSortButtonClick = () => {
    if (maximizedWidgetId || isMobileView) return;
    const currentLayout = widgets.map(w => ({...w}));
    const sortedLayout = performAutoSort(currentLayout);
    if (sortedLayout) {
      setWidgets(sortedLayout);
      updateWidgetsAndPushToHistory(sortedLayout, 'auto_sort_button');
      setActiveWidgetId(null);
    } else {
      console.error("[handleAutoSortButtonClick] Failed to sort existing widgets.");
      alert("Could not fully sort the grid. Some widgets might be unplaceable or the grid is too full/narrow.");
    }
  };


  const attemptPlaceWidgetWithShrinking = useCallback((
    currentWidgetsImmutable: PageWidgetConfig[],
    newWidgetConfig: PageWidgetConfig
  ): PageWidgetConfig[] | null => {
    if (widgetContainerCols === 0 || widgetContainerRows === 0) return null;

    const tempWidgetsLayout = currentWidgetsImmutable.map(w => ({ ...w }));

    const sortedWithNew = performAutoSort([...tempWidgetsLayout, { ...newWidgetConfig }]);
    if (sortedWithNew) {
        return sortedWithNew;
    }

    const shrinkableWidgets = tempWidgetsLayout.filter(
        w => w.colSpan > w.minColSpan || w.rowSpan > w.minRowSpan
    ).sort((a,b) => (b.colSpan*b.rowSpan) - (a.colSpan*a.rowSpan));

    for (const existingWidget of shrinkableWidgets) {
        const originalColSpan = existingWidget.colSpan;

        if (existingWidget.colSpan > existingWidget.minColSpan) {
            const widgetsWithShrunkCol = tempWidgetsLayout.map(w =>
                w.id === existingWidget.id ? { ...w, colSpan: Math.max(w.minColSpan, w.colSpan - 1) } : { ...w }
            );
            const layoutWithShrunkCol = performAutoSort([...widgetsWithShrunkCol, { ...newWidgetConfig }]);
            if (layoutWithShrunkCol) {
                return layoutWithShrunkCol;
            }
        }

        if (existingWidget.rowSpan > existingWidget.minRowSpan) {
            const widgetsWithShrunkRow = tempWidgetsLayout.map(w =>
                w.id === existingWidget.id ? { ...w, colSpan: originalColSpan, rowSpan: Math.max(w.minRowSpan, w.rowSpan - 1) } : { ...w }
            );
            const layoutWithShrunkRow = performAutoSort([...widgetsWithShrunkRow, { ...newWidgetConfig }]);
            if (layoutWithShrunkRow) {
                return layoutWithShrunkRow;
            }
        }
    }
    return null;
  }, [widgetContainerCols, widgetContainerRows, performAutoSort]);


  const findNextAvailablePosition = useCallback((
    targetColSpan: number,
    targetRowSpan: number,
    currentLayout: PageWidgetConfig[]
  ): { colStart: number, rowStart: number } | null => {
    if (widgetContainerCols === 0 || widgetContainerRows === 0) return null;

    for (let r = 1; r <= widgetContainerRows - targetRowSpan + 1; r++) {
      for (let c = 1; c <= widgetContainerCols - targetColSpan + 1; c++) {
        const dummyWidgetToCheck: PageWidgetConfig = {
            id: 'temp-placement-check', type: 'generic', title: '',
            colStart: c, rowStart: r, colSpan: targetColSpan, rowSpan: targetRowSpan,
            minColSpan: targetColSpan, minRowSpan: targetRowSpan, settings: {},
        };
        if (canPlaceWidget(dummyWidgetToCheck, c, r, currentLayout)) {
          return { colStart: c, rowStart: r };
        }
      }
    }
    return null;
  }, [widgetContainerCols, widgetContainerRows, canPlaceWidget]);

  const handleAddNewWidget = useCallback((
    widgetType: WidgetType,
    newTitle?: string,
    newColStart?: number,
    newRowStart?: number,
    newColSpan?: number,
    newRowSpan?: number,
    newSizePreset?: WidgetSizePresetKey,
    initialSettingsFromAI?: Partial<AllWidgetSettings> 
) => {
    if (maximizedWidgetId || (isMobileView && widgetType !== 'portfolio')) {
        if(isMobileView && widgetType !== 'portfolio') {
            alert("Adding new widgets is disabled in mobile full-portfolio view, except for the initial portfolio widget.");
        }
        return;
    }
    const blueprint = AVAILABLE_WIDGET_DEFINITIONS.find(def => def.type === widgetType);
    if (!blueprint) {
        alert(`Widget type "${widgetType}" is not available.`);
        setIsAddWidgetMenuOpen(false); setIsAddWidgetContextMenuOpen(false); return;
    }

    if (widgetContainerCols === 0 || widgetContainerRows === 0) {
      alert("Grid not fully initialized. Please wait a moment and try again.");
      setIsAddWidgetMenuOpen(false); setIsAddWidgetContextMenuOpen(false);
      return;
    }

    const baseConfig: Partial<PageWidgetConfig> = {
        id: `${blueprint.type}-${Date.now()}`,
        type: blueprint.type,
        title: newTitle || blueprint.defaultTitle,
        settings: initialSettingsFromAI || {}, 
    };

    if (newSizePreset) {
        const preset = WIDGET_SIZE_PRESETS[newSizePreset];
        if (preset) {
            baseConfig.colSpan = Math.max(blueprint.minColSpan, Math.round(preset.targetWidthPx / cellSize));
            baseConfig.rowSpan = Math.max(blueprint.minRowSpan, Math.round(preset.targetHeightPx / cellSize));
        }
    }
    if (newColSpan) baseConfig.colSpan = newColSpan;
    if (newRowSpan) baseConfig.rowSpan = newRowSpan;


    const newWidgetConfigProcessed = processWidgetConfig(baseConfig, cellSize);
    const finalColSpan = newWidgetConfigProcessed.colSpan;
    const finalRowSpan = newWidgetConfigProcessed.rowSpan;


    let finalLayout: PageWidgetConfig[] | null = null;
    const currentWidgetsCopy = widgets.map(w => ({...w}));

    let positionFound = false;
    if (newColStart && newRowStart) {
        if (canPlaceWidget({...newWidgetConfigProcessed, colSpan: finalColSpan, rowSpan: finalRowSpan }, newColStart, newRowStart, currentWidgetsCopy)) {
            finalLayout = [...currentWidgetsCopy, {...newWidgetConfigProcessed, colStart: newColStart, rowStart: newRowStart, colSpan: finalColSpan, rowSpan: finalRowSpan }];
            positionFound = true;
        }
    }

    if (!positionFound) {
        const initialPosition = findNextAvailablePosition(finalColSpan, finalRowSpan, currentWidgetsCopy);
        if (initialPosition) {
            finalLayout = [...currentWidgetsCopy, { ...newWidgetConfigProcessed, colStart: initialPosition.colStart, rowStart: initialPosition.rowStart, colSpan: finalColSpan, rowSpan: finalRowSpan }];
        } else {
            const attemptLayout = [...currentWidgetsCopy, { ...newWidgetConfigProcessed, colSpan: finalColSpan, rowSpan: finalRowSpan }];
            
            const sumOfColSpansInAttempt = attemptLayout.reduce((sum, w) => sum + w.colSpan, 0);
            const gaps = attemptLayout.length > 1 ? attemptLayout.length - 1 : 0; 
            const requiredColsIfSingleRow = sumOfColSpansInAttempt + gaps;
    
            const currentColsBasedOnActualWidth = Math.floor(actualGridPixelWidth / cellSize);
            const targetSortColsPotential = Math.max(widgetContainerCols, requiredColsIfSingleRow, currentColsBasedOnActualWidth);
            
            const newPotentialActualGridPixelWidth = Math.max(actualGridPixelWidth, targetSortColsPotential * cellSize, window.innerWidth);
            const finalTargetSortCols = Math.floor(newPotentialActualGridPixelWidth / cellSize);
        
            console.log(`[handleAddNewWidget] Initial placement failed. Attempting sort with expanded cols: ${finalTargetSortCols} (current: ${widgetContainerCols}, requiredIfSingleRow: ${requiredColsIfSingleRow}, currentActualWidthImplies: ${currentColsBasedOnActualWidth})`);
    
            const tempSortedLayout = performAutoSortWithGivenGrid(attemptLayout, finalTargetSortCols, widgetContainerRows);
    
            if (tempSortedLayout) {
                finalLayout = tempSortedLayout;
                let actualMaxColUsedInLayout = 0;
                finalLayout.forEach(w => {
                    actualMaxColUsedInLayout = Math.max(actualMaxColUsedInLayout, w.colStart + w.colSpan - 1);
                });
                const finalRequiredPixelWidthByLayout = actualMaxColUsedInLayout * cellSize;
                const newActualGridWidthToSet = Math.max(window.innerWidth, finalRequiredPixelWidthByLayout);
                
                console.log(`[handleAddNewWidget] Sort with expansion successful. Layout needs ${actualMaxColUsedInLayout} cols. Setting actualGridPixelWidth to ${newActualGridWidthToSet}`);
                setActualGridPixelWidth(newActualGridWidthToSet);
        
            } else {
                console.log(`[handleAddNewWidget] Sort with expansion to ${finalTargetSortCols} cols failed. Attempting shrinking.`);
                finalLayout = attemptPlaceWidgetWithShrinking(currentWidgetsCopy, { ...newWidgetConfigProcessed, colSpan: finalColSpan, rowSpan: finalRowSpan });
                 if (finalLayout) {
                    console.log("[handleAddNewWidget] Placement successful after shrinking existing widgets.");
                    let maxColAfterShrink = 0;
                    finalLayout.forEach(w => { maxColAfterShrink = Math.max(maxColAfterShrink, w.colStart + w.colSpan - 1);});
                    const requiredWidthAfterShrink = maxColAfterShrink * cellSize;
                    setActualGridPixelWidth(Math.max(window.innerWidth, requiredWidthAfterShrink));
                } else {
                    console.log("[handleAddNewWidget] Shrinking also failed.");
                }
            }
        }
    }


    if (finalLayout) {
      setWidgets(finalLayout); 
      updateWidgetsAndPushToHistory(finalLayout, `add_widget_${widgetType}`);
      const addedWidgetInLayout = finalLayout.find(w => w.id === newWidgetConfigProcessed.id);
      if (addedWidgetInLayout) setActiveWidgetId(addedWidgetInLayout.id); // This will also trigger centering
      else setActiveWidgetId(null);
    } else {
      alert("No available space to add this widget, even after attempting to sort, expand grid, and shrink existing widgets. Please make more room manually or try a smaller widget.");
    }
    setIsAddWidgetMenuOpen(false);
    setIsAddWidgetContextMenuOpen(false);
  }, [
    maximizedWidgetId, widgetContainerCols, widgetContainerRows, widgets, cellSize, 
    findNextAvailablePosition, performAutoSort, attemptPlaceWidgetWithShrinking, 
    updateWidgetsAndPushToHistory, isMobileView, canPlaceWidget, actualGridPixelWidth, 
    performAutoSortWithGivenGrid 
  ]);


  const handleApplyWidgetSizePreset = useCallback((widgetId: string, presetKey: WidgetSizePresetKey) => {
    if (maximizedWidgetId || isMobileView) return;

    const targetWidget = widgets.find(w => w.id === widgetId);
    const blueprint = AVAILABLE_WIDGET_DEFINITIONS.find(b => b.type === targetWidget?.type);

    if (!targetWidget || !blueprint) {
        alert("Error: Could not find widget data to apply preset.");
        return;
    }

    const presetSizeTargets = WIDGET_SIZE_PRESETS[presetKey];
    if (!presetSizeTargets) {
        alert("Error: Invalid size preset selected.");
        return;
    }

    const newColSpan = Math.max(blueprint.minColSpan, Math.max(1, Math.round(presetSizeTargets.targetWidthPx / cellSize)));
    const newRowSpan = Math.max(blueprint.minRowSpan, Math.max(1, Math.round(presetSizeTargets.targetHeightPx / cellSize)));

    const updatedWidgetConfig = {
        ...targetWidget,
        colSpan: newColSpan,
        rowSpan: newRowSpan,
    };

    let finalLayout: PageWidgetConfig[] | null = null;
    const otherWidgets = widgets.filter(w => w.id !== widgetId).map(w => ({...w}));

    if (canPlaceWidget(updatedWidgetConfig, targetWidget.colStart, targetWidget.rowStart, otherWidgets)) {
        finalLayout = widgets.map(w => w.id === widgetId ? { ...updatedWidgetConfig, colStart: targetWidget.colStart, rowStart: targetWidget.rowStart } : w);
    } else {
        const newPosition = findNextAvailablePosition(updatedWidgetConfig.colSpan, updatedWidgetConfig.rowSpan, otherWidgets);
        if (newPosition) {
            finalLayout = [...otherWidgets, { ...updatedWidgetConfig, colStart: newPosition.colStart, rowStart: newPosition.rowStart }];
        } else {
            const widgetsToTrySort = widgets.map(w => w.id === widgetId ? updatedWidgetConfig : {...w});
            finalLayout = performAutoSort(widgetsToTrySort); 
        }
    }

    if (finalLayout) {
        let maxColRequired = 0;
        finalLayout.forEach(w => {maxColRequired = Math.max(maxColRequired, w.colStart + w.colSpan - 1);});
        const newRequiredPixelWidth = maxColRequired * cellSize;
        const newActualGridWidthToSet = Math.max(window.innerWidth, newRequiredPixelWidth);
        
        if (newActualGridWidthToSet !== actualGridPixelWidth) {
            setActualGridPixelWidth(newActualGridWidthToSet);
        }

        setWidgets(finalLayout);
        updateWidgetsAndPushToHistory(finalLayout, `apply_preset_${presetKey}_to_${widgetId}`);
        setActiveWidgetId(widgetId); // This will also trigger centering
        setIsContainerSettingsModalOpen(false);
    } else {
        alert(`Could not apply size preset "${presetKey}". There isn't enough space, even after trying to rearrange. Please try a different preset or make more room manually.`);
    }
  }, [widgets, maximizedWidgetId, cellSize, findNextAvailablePosition, performAutoSort, updateWidgetsAndPushToHistory, canPlaceWidget, isMobileView, actualGridPixelWidth]);

  const handleChangeCellSize = useCallback((newCellSize: number) => {
    if (newCellSize === cellSize || maximizedWidgetId) return;

    const oldCellSize = cellSize;
    console.log(`[Grid Density] Changing from ${oldCellSize}px to ${newCellSize}px`);

    let maxColOccupiedOld = 0;
    widgets.forEach(w => { maxColOccupiedOld = Math.max(maxColOccupiedOld, w.colStart + w.colSpan - 1); });
    const currentContentPixelWidth = maxColOccupiedOld * oldCellSize;
    const newTargetGridPixelWidth = Math.max(window.innerWidth, currentContentPixelWidth); 

    const scaledWidgets = widgets.map(w => {
        const blueprint = AVAILABLE_WIDGET_DEFINITIONS.find(b => b.type === w.type);
        if (!blueprint) return w;

        const currentPixelWidth = w.colSpan * oldCellSize;
        const currentPixelHeight = w.rowSpan * oldCellSize;
        const currentPixelX = (w.colStart - 1) * oldCellSize;
        const currentPixelY = (w.rowStart - 1) * oldCellSize;

        let newColSpan = Math.max(blueprint.minColSpan, Math.max(1, Math.round(currentPixelWidth / newCellSize)));
        let newRowSpan = Math.max(blueprint.minRowSpan, Math.max(1, Math.round(currentPixelHeight / newCellSize)));
        let newColStart = Math.max(1, Math.round(currentPixelX / newCellSize) + 1);
        let newRowStart = Math.max(1, Math.round(currentPixelY / newCellSize) + 1);

        if (isMobileView && w.type === 'portfolio' && widgets.length === 1) {
            const tempNewColsForMobile = Math.floor(window.innerWidth / newCellSize); 
            const tempNewRowsForMobile = Math.floor((window.innerHeight - (headerRef.current?.offsetHeight || 60)) / newCellSize);
            newColSpan = tempNewColsForMobile;
            newRowSpan = tempNewRowsForMobile > 1 ? tempNewRowsForMobile -1 : 1;
            newColStart = 1;
            newRowStart = 1;
        }

        return {
            ...w,
            colSpan: newColSpan,
            rowSpan: newRowSpan,
            colStart: newColStart,
            rowStart: newRowStart,
        };
    });
    
    setActualGridPixelWidth(newTargetGridPixelWidth); 
    setCellSize(newCellSize); 

    requestAnimationFrame(() => {
        const newColsAfterUpdate = Math.floor(newTargetGridPixelWidth / newCellSize);
        const currentHeaderHeight = headerRef.current?.offsetHeight || 60;
        const aiCommandBarHeight = showAiCommandBar ? (document.getElementById('ai-command-bar')?.offsetHeight || 70) : 0;
        const mainContentHeight = window.innerHeight - currentHeaderHeight - aiCommandBarHeight;
        const newRowsAfterUpdate = Math.max(1, Math.floor(mainContentHeight / newCellSize));
        
        const sortedLayout = performAutoSortWithGivenGrid(scaledWidgets, newColsAfterUpdate, newRowsAfterUpdate);

        if (sortedLayout) {
            setWidgets(sortedLayout);
            updateWidgetsAndPushToHistory(sortedLayout, `grid_density_change_${newCellSize}`);
        } else {
            console.warn("[Grid Density] Auto-sort after scaling failed. Layout might need manual adjustment.");
            setWidgets(scaledWidgets); 
            updateWidgetsAndPushToHistory(scaledWidgets, `grid_density_change_scaled_only_${newCellSize}`);
            if (!isMobileView) {
                 alert("Grid density changed. Some widgets may need manual readjustment or use the 'Sort Grid' button.");
            }
        }
    });

    setIsDensityMenuOpen(false);

  }, [cellSize, widgets, maximizedWidgetId, updateWidgetsAndPushToHistory, performAutoSortWithGivenGrid, isMobileView, actualGridPixelWidth, showAiCommandBar]);


  const handleWidgetResizeLive = (id: string, newGeometry: WidgetResizeDataType) => { if (isPerformingUndoRedo.current || maximizedWidgetId || isMobileView) return; setWidgets(currentWidgets => currentWidgets.map(w => w.id === id ? { ...w, ...newGeometry, isMinimized: false } : w)); };
  
  const handleWidgetResizeEnd = (id: string, finalGeometry: WidgetResizeDataType) => { 
    if (maximizedWidgetId || isMobileView) return; 
    setWidgets(currentWidgets => { 
        const updatedWidgets = currentWidgets.map(w => w.id === id ? { ...w, ...finalGeometry, isMinimized: false, originalRowSpan: undefined } : w); 
        
        let maxColRequired = 0;
        updatedWidgets.forEach(w => {maxColRequired = Math.max(maxColRequired, w.colStart + w.colSpan - 1);});
        const newRequiredPixelWidth = maxColRequired * cellSize;
        const newActualGridWidthToSet = Math.max(window.innerWidth, newRequiredPixelWidth);
        
        if (newActualGridWidthToSet !== actualGridPixelWidth) {
            setActualGridPixelWidth(newActualGridWidthToSet);
        }
        
        updateWidgetsAndPushToHistory(updatedWidgets, `resize_end_${id}`); 
        return updatedWidgets; 
    }); 
    setActiveWidgetId(id); // This will also trigger centering
  };

  const handleWidgetMove = (id: string, newPosition: WidgetMoveDataType) => { 
    if (maximizedWidgetId || isMobileView) return; 
    const currentWidget = widgets.find(w => w.id === id); 
    if (!currentWidget) return; 
    if (currentWidget.colStart !== newPosition.colStart || currentWidget.rowStart !== newPosition.rowStart) { 
        setWidgets(currentWidgets => { 
            const updatedWidgets = currentWidgets.map(w => w.id === id ? { ...w, ...newPosition } : w); 
            
            let maxColRequired = 0;
            updatedWidgets.forEach(w => {maxColRequired = Math.max(maxColRequired, w.colStart + w.colSpan - 1);});
            const newRequiredPixelWidth = maxColRequired * cellSize;
            const newActualGridWidthToSet = Math.max(window.innerWidth, newRequiredPixelWidth);

            if (newActualGridWidthToSet !== actualGridPixelWidth) {
                setActualGridPixelWidth(newActualGridWidthToSet);
            }

            updateWidgetsAndPushToHistory(updatedWidgets, `move_${id}`); 
            return updatedWidgets; 
        }); 
    } 
    setActiveWidgetId(id); // This will also trigger centering
  };
  
  const handleWidgetDelete = (idToDelete: string) => { 
    if (isMobileView && widgets.find(w=>w.id === idToDelete)?.type === 'portfolio') return; 
    if (maximizedWidgetId === idToDelete) { setMaximizedWidgetId(null); setMaximizedWidgetOriginalState(null); } 
    setWidgets(currentWidgets => { 
        const updatedWidgets = currentWidgets.filter(widget => widget.id !== idToDelete); 
        
        let maxColRequired = 0;
        updatedWidgets.forEach(w => {maxColRequired = Math.max(maxColRequired, w.colStart + w.colSpan - 1);});
        const newRequiredPixelWidth = maxColRequired * cellSize;
        const newActualGridWidthToSet = Math.max(window.innerWidth, newRequiredPixelWidth); 

        if (newActualGridWidthToSet !== actualGridPixelWidth) {
            setActualGridPixelWidth(newActualGridWidthToSet);
        }

        updateWidgetsAndPushToHistory(updatedWidgets, `delete_${idToDelete}`); 
        return updatedWidgets; 
    }); 
    if (activeWidgetId === idToDelete) setActiveWidgetId(null); 
  };

  const handleWidgetFocus = (id: string) => { 
    if (maximizedWidgetId && maximizedWidgetId !== id) return; 
    setActiveWidgetId(id); 
    
    // Center the widget smoothly
    const widgetConfig = widgets.find(w => w.id === id);
    if (widgetConfig && dashboardAreaRef.current && !isMobileView) { // Assuming centering is not for mobile view or when maximized
      const widgetLeft = (widgetConfig.colStart - 1) * cellSize;
      const widgetWidth = widgetConfig.colSpan * cellSize;
      const widgetCenterX = widgetLeft + widgetWidth / 2;

      const viewportWidth = dashboardAreaRef.current.clientWidth;
      let targetScrollLeft = widgetCenterX - viewportWidth / 2;

      // Clamp scrollLeft to be within valid bounds
      targetScrollLeft = Math.max(0, Math.min(targetScrollLeft, dashboardAreaRef.current.scrollWidth - viewportWidth));
      
      smoothScrollTo(dashboardAreaRef.current, targetScrollLeft, SMOOTH_SCROLL_DURATION_MS, 'left');
    }
  };
  const handleOpenWidgetSettings = (widgetId: string) => { if (maximizedWidgetId && maximizedWidgetId !== widgetId) return; const widgetToEdit = widgets.find(w => w.id === widgetId); if (widgetToEdit) { setActiveWidgetId(widgetId); setSelectedWidgetForSettings(widgetToEdit); setIsSettingsModalOpen(true); } };
  const handleCloseSettingsModal = () => { setIsSettingsModalOpen(false); setSelectedWidgetForSettings(null); };
  const handleSaveWidgetInstanceSettings = useCallback((widgetId: string, newInstanceSettings: AllWidgetSettings) => { setWidgets(currentWidgets => { const updatedWidgets = currentWidgets.map(w => w.id === widgetId ? { ...w, settings: { ...(w.settings || {}), ...newInstanceSettings } } : w); updateWidgetsAndPushToHistory(updatedWidgets, `save_settings_${widgetId}`); return updatedWidgets; }); setActiveWidgetId(widgetId); }, [updateWidgetsAndPushToHistory]);
  const handleOpenContainerSettingsModal = (widgetId: string) => { if (maximizedWidgetId && maximizedWidgetId !== widgetId || isMobileView) return; const widgetToEdit = widgets.find(w => w.id === widgetId); if (widgetToEdit) { setActiveWidgetId(widgetId); setSelectedWidgetForContainerSettings(widgetToEdit); setIsContainerSettingsModalOpen(true); } };
  const handleCloseContainerSettingsModal = () => { setIsContainerSettingsModalOpen(false); setSelectedWidgetForContainerSettings(null); };
  const handleSaveWidgetContainerSettings = useCallback((widgetId: string, newContainerSettings: WidgetContainerSettings) => { setWidgets(currentWidgets => { const updatedWidgets = currentWidgets.map(w => { if (w.id === widgetId) { const existingContainerSettings = w.containerSettings || DEFAULT_WIDGET_CONTAINER_SETTINGS; return { ...w, containerSettings: { ...existingContainerSettings, ...newContainerSettings } }; } return w; }); updateWidgetsAndPushToHistory(updatedWidgets, `save_container_settings_${widgetId}`); return updatedWidgets; }); setActiveWidgetId(widgetId); }, [updateWidgetsAndPushToHistory]);
  const handleWidgetMinimizeToggle = (widgetId: string) => { if (maximizedWidgetId || isMobileView) return; setWidgets(currentWidgets => { const updatedWidgets = currentWidgets.map(w => { if (w.id === widgetId) { if (w.isMinimized) { return { ...w, isMinimized: false, rowSpan: w.originalRowSpan || w.rowSpan, originalRowSpan: undefined }; } else { return { ...w, isMinimized: true, originalRowSpan: w.rowSpan, rowSpan: MINIMIZED_WIDGET_ROW_SPAN }; } } return w; }); updateWidgetsAndPushToHistory(updatedWidgets, `minimize_toggle_${widgetId}`); return updatedWidgets; }); setActiveWidgetId(widgetId); };
  const handleWidgetMaximizeToggle = (widgetId: string) => { if(isMobileView) return; const widgetToToggle = widgets.find(w => w.id === widgetId); if (!widgetToToggle) return; if (maximizedWidgetId === widgetId) { setMaximizedWidgetId(null); setMaximizedWidgetOriginalState(null); setActiveWidgetId(widgetId); } else { let originalStateForMaximize = JSON.parse(JSON.stringify(widgetToToggle)); if (widgetToToggle.isMinimized) { originalStateForMaximize = { ...originalStateForMaximize, isMinimized: false, rowSpan: widgetToToggle.originalRowSpan || widgetToToggle.rowSpan, originalRowSpan: undefined }; } setMaximizedWidgetOriginalState(originalStateForMaximize); setMaximizedWidgetId(widgetId); setActiveWidgetId(widgetId); } };
  const handleUndo = () => { if (historyPointer.current > 0) { isPerformingUndoRedo.current = true; const newPointer = historyPointer.current - 1; historyPointer.current = newPointer; const historicWidgets = JSON.parse(JSON.stringify(history.current[newPointer])); setWidgets(historicWidgets); setActiveWidgetId(null); setMaximizedWidgetId(null); setHistoryDisplay({ pointer: historyPointer.current + 1, length: history.current.length }); requestAnimationFrame(() => { isPerformingUndoRedo.current = false; }); } };
  const handleRedo = () => { if (historyPointer.current < history.current.length - 1) { isPerformingUndoRedo.current = true; const newPointer = historyPointer.current + 1; historyPointer.current = newPointer; const historicWidgets = JSON.parse(JSON.stringify(history.current[newPointer])); setWidgets(historicWidgets); setActiveWidgetId(null); setMaximizedWidgetId(null); setHistoryDisplay({ pointer: historyPointer.current + 1, length: history.current.length }); requestAnimationFrame(() => { isPerformingUndoRedo.current = false; }); } };
  const handleSharedTodosChange = (newGlobalTodos: TodoItem[]) => { setSharedTodos(newGlobalTodos); };
  const handleSharedPhotoHistoryChange = (newGlobalPhotoHistory: HistoricImage[]) => { setSharedPhotoHistory(newGlobalPhotoHistory); };


  const handleDashboardContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isMobileView) return;
    const target = event.target as HTMLElement;
    let clickedOnWidgetOrInteractiveContent = false;
    // Check if click is on the scrollbar of dashboardAreaRef
    if (dashboardAreaRef.current && 
        (event.clientX >= dashboardAreaRef.current.clientWidth || event.clientY >= dashboardAreaRef.current.clientHeight)) {
        // Click is likely on a scrollbar, don't open context menu
        return;
    }

    for (const widget of widgets) {
        if (target.closest(`#${CSS.escape(widget.id)}`)) {
            clickedOnWidgetOrInteractiveContent = true;
            break;
        }
    }
    if (target.closest('button, a, input, select, textarea, [role="button"], [role="link"], [contenteditable="true"]')) {
        if (target !== dashboardAreaRef.current && target.id !== 'widget-grid-container' && !target.closest('.grid-background-svg') && target.id !== 'grid-content-wrapper') {
            clickedOnWidgetOrInteractiveContent = true;
        }
    }

    if (clickedOnWidgetOrInteractiveContent) { return; }

    if ( target === dashboardAreaRef.current || target.id === 'widget-grid-container' || target.closest('.grid-background-svg') || target.id === 'grid-content-wrapper' ) {
        event.preventDefault();
        setIsAddWidgetMenuOpen(false);
        setContextMenuPosition({ x: event.clientX, y: event.clientY });
        setIsAddWidgetContextMenuOpen(true);
        setActiveWidgetId(null);
    }
  };

  const handleCloseContextMenu = () => {
    setIsAddWidgetContextMenuOpen(false);
  };

  // --- AI Integration Functions ---

  const startListening = () => {
    if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionImpl) {
        setAiError("Speech recognition is not supported by your browser.");
        return;
      }
      if (speechRecognitionRef.current && aiIsListening) {
        speechRecognitionRef.current.stop();
        return; 
      }

      speechRecognitionRef.current = new SpeechRecognitionImpl();
      speechRecognitionRef.current.continuous = false;
      speechRecognitionRef.current.interimResults = true;
      speechRecognitionRef.current.lang = 'en-US';

      speechRecognitionRef.current.onstart = () => {
        setAiIsListening(true);
        setAiLastFeedback('Listening...');
        setAiError(null);
      };

      speechRecognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setAiLastFeedback(finalTranscript || interimTranscript || "Listening...");
        if (finalTranscript) {
          setAiInputValue(finalTranscript);
          handleSendAiCommand(finalTranscript);
        }
      };

      speechRecognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        let errorMsg = `Speech recognition error: ${event.error}.`;
        if (event.error === 'no-speech') errorMsg = "No speech detected. Please try again.";
        else if (event.error === 'audio-capture') errorMsg = "Microphone error. Please check permissions.";
        else if (event.error === 'not-allowed') errorMsg = "Microphone access denied. Please enable it in browser settings.";
        setAiError(errorMsg);
        setAiLastFeedback(errorMsg);
        setAiIsListening(false); 
      };

      speechRecognitionRef.current.onend = () => {
        setAiIsListening(false);
      };

      speechRecognitionRef.current.start();
    } else {
      const errorMsg = "Speech recognition not available in this browser.";
      setAiError(errorMsg);
      setAiLastFeedback(errorMsg);
    }
  };

  const handleSendAiCommand = async (commandText: string) => {
    if (!commandText.trim()) return;

    setAiIsProcessing(true);
    setAiLastFeedback(`Processing: "${commandText}"`);
    setAiError(null);

    const systemPrompt = getGeminiSystemPrompt(widgets);
    const fullPrompt = systemPrompt + "\nUser Command: " + commandText; 

    try {
      const chatHistory = [{ role: "user", parts: [{ text: fullPrompt }] }];
      const payload = {
        contents: chatHistory,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: AI_COMMAND_SCHEMA,
        }
      };
      const userProvidedApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      const apiKey = userProvidedApiKey || "";

      if (!apiKey && !userProvidedApiKey) {
          console.warn("Gemini API Key is missing. Please set NEXT_PUBLIC_GEMINI_API_KEY or ensure Canvas provides it.");
      }

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API Error Response:', errorData);
        const message = errorData?.error?.message || `API request failed with status ${response.status}`;
        throw new Error(message);
      }

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0 &&
          result.candidates[0].content.parts[0].text
      ) {
        const rawJsonText = result.candidates[0].content.parts[0].text;
        const parsedCommand = JSON.parse(rawJsonText) as ParsedAiCommand;

        setAiLastFeedback(parsedCommand.feedbackToUser || "Command received.");
        
        dispatchAiCommand(parsedCommand);

      } else {
        console.warn("Unexpected Gemini API response structure:", result);
        throw new Error("Received an unexpected response structure from AI.");
      }

    } catch (err: unknown) {
      console.error('Error processing AI command:', err);
      const errorMsg = err instanceof Error ? err.message : "An unknown error occurred with AI.";
      setAiError(`AI Error: ${errorMsg}`);
      setAiLastFeedback(`Error: ${errorMsg}`);
     
    } finally {
      setAiIsProcessing(false);
      setAiInputValue('');
    }
  };

  const findTargetWidget = (command: TargetWidgetAiCommand): PageWidgetConfig | null | undefined => {
    if (command.targetWidgetId) {
        return widgets.find(w => w.id === command.targetWidgetId);
    }
    if (command.targetWidgetType) {
        const matchingTypeWidgets = widgets.filter(w => w.type === command.targetWidgetType);
        if (matchingTypeWidgets.length === 1) {
            return matchingTypeWidgets[0];
        }
        if (matchingTypeWidgets.length > 1 && command.targetWidgetTitle) {
            const exactTitleMatch = matchingTypeWidgets.find(w => w.title.toLowerCase() === command.targetWidgetTitle!.toLowerCase());
            if (exactTitleMatch) return exactTitleMatch;
            const partialTitleMatch = matchingTypeWidgets.find(w => w.title.toLowerCase().includes(command.targetWidgetTitle!.toLowerCase()));
            if (partialTitleMatch) return partialTitleMatch;
            return null; 
        }
         if (matchingTypeWidgets.length > 1 && !command.targetWidgetTitle) {
            return null; 
        }
        if (matchingTypeWidgets.length === 0) {
            return undefined; 
        }
        return matchingTypeWidgets[0]; 
    }
    if (command.targetWidgetTitle) {
        const exactTitleMatchAll = widgets.find(w => w.title.toLowerCase() === command.targetWidgetTitle!.toLowerCase());
        if (exactTitleMatchAll) return exactTitleMatchAll;
        const matchingTitleWidgets = widgets.filter(w => w.title.toLowerCase().includes(command.targetWidgetTitle!.toLowerCase()));
        if (matchingTitleWidgets.length === 1) {
            return matchingTitleWidgets[0];
        }
        if (matchingTitleWidgets.length > 1) {
             return null; 
        }
        return undefined; 
    }
    return undefined; 
  };


  const dispatchAiCommand = (command: ParsedAiCommand) => {
    console.log("Dispatching AI Command:", command); 
    setActiveWidgetId(null); 

    let feedbackMessage = command.feedbackToUser || ""; 

    switch (command.action) {
      case 'addWidget': {
        const addCmd = command as AddWidgetAiCommand;
        let parsedInitialSettings: Partial<AllWidgetSettings> | undefined = undefined;
        if (typeof addCmd.initialSettings === 'string') {
            try {
                parsedInitialSettings = JSON.parse(addCmd.initialSettings);
            } catch (e) {
                console.error("Error parsing initialSettings JSON for addWidget:", e);
                feedbackMessage = "Error applying initial settings due to invalid format.";
                setAiLastFeedback(feedbackMessage);
                break;
            }
        } else if (typeof addCmd.initialSettings === 'object') {
            parsedInitialSettings = addCmd.initialSettings;
        }
        handleAddNewWidget(addCmd.widgetType, addCmd.title, addCmd.colStart, addCmd.rowStart, addCmd.colSpan, addCmd.rowSpan, addCmd.sizePreset, parsedInitialSettings);
        if (!feedbackMessage) feedbackMessage = `${addCmd.widgetType} widget added.`;
        break;
      }
      case 'deleteWidget': {
        const delCmd = command as DeleteWidgetAiCommand;
        const widgetToDelete = findTargetWidget(delCmd);
        if (widgetToDelete) {
          handleWidgetDelete(widgetToDelete.id);
          feedbackMessage = feedbackMessage || `Deleted ${widgetToDelete.title}.`;
        } else if (widgetToDelete === null) { 
            feedbackMessage = delCmd.feedbackToUser || `Multiple widgets match "${delCmd.targetWidgetTitle || delCmd.targetWidgetType}". Please be more specific.`;
        } else { 
            feedbackMessage = delCmd.feedbackToUser || `Could not find the widget to delete.`;
        }
        break;
      }
      case 'moveWidget': {
        const moveCmd = command as MoveWidgetAiCommand;
        const widgetToMove = findTargetWidget(moveCmd);
        if (widgetToMove && typeof moveCmd.newColStart === 'number' && typeof moveCmd.newRowStart === 'number') {
            const newCol = Math.max(1, Math.min(moveCmd.newColStart, widgetContainerCols - widgetToMove.colSpan + 1));
            const newRow = Math.max(1, Math.min(moveCmd.newRowStart, widgetContainerRows - widgetToMove.rowSpan + 1));
            handleWidgetMove(widgetToMove.id, { colStart: newCol, rowStart: newRow });
            feedbackMessage = feedbackMessage || `Moved ${widgetToMove.title}.`;
        } else if (widgetToMove === null) {
            feedbackMessage = moveCmd.feedbackToUser || `Multiple widgets match for moving. Please be more specific.`;
        } else {
            feedbackMessage = moveCmd.feedbackToUser || `Could not move widget. Target or position unclear.`;
        }
        break;
      }
      case 'resizeWidget': {
        const resizeCmd = command as ResizeWidgetAiCommand;
        const widgetToResize = findTargetWidget(resizeCmd);
        if (!widgetToResize) {
            feedbackMessage = resizeCmd.feedbackToUser || (widgetToResize === null ? `Multiple widgets match for resizing. Please be more specific.` : `Could not find widget to resize.`);
            break;
        }
        if (resizeCmd.sizePreset) {
            handleApplyWidgetSizePreset(widgetToResize.id, resizeCmd.sizePreset);
            if (!command.feedbackToUser) return; 
            else feedbackMessage = command.feedbackToUser;
            break;
        }

        let { newColSpan, newRowSpan } = resizeCmd;
        const currentBlueprint = AVAILABLE_WIDGET_DEFINITIONS.find(b => b.type === widgetToResize.type);
        const minCS = currentBlueprint?.minColSpan || 1;
        const minRS = currentBlueprint?.minRowSpan || 1;

        if (resizeCmd.resizeDirection) {
            let cSpan = widgetToResize.colSpan;
            let rSpan = widgetToResize.rowSpan;
            switch (resizeCmd.resizeDirection) {
                case 'larger': cSpan += 2; rSpan += 2; break;
                case 'smaller': cSpan = Math.max(minCS, cSpan - 2); rSpan = Math.max(minRS, rSpan - 2); break;
                case 'wider': cSpan += 2; break;
                case 'narrower': cSpan = Math.max(minCS, cSpan - 2); break;
                case 'taller': rSpan += 2; break;
                case 'shorter': rSpan = Math.max(minRS, rSpan - 2); break;
                case 'resetSize':
                    if(currentBlueprint) {
                        const preset = WIDGET_SIZE_PRESETS[currentBlueprint.defaultSizePreset];
                        cSpan = Math.max(minCS, Math.round(preset.targetWidthPx / cellSize));
                        rSpan = Math.max(minRS, Math.round(preset.targetHeightPx / cellSize));
                    }
                    break;
            }
            newColSpan = Math.min(widgetContainerCols - widgetToResize.colStart + 1, cSpan);
            newRowSpan = Math.min(widgetContainerRows - widgetToResize.rowStart + 1, rSpan);
        }

        if (typeof newColSpan === 'number' || typeof newRowSpan === 'number') {
            const finalCS = typeof newColSpan === 'number' ? Math.max(minCS, Math.min(newColSpan, widgetContainerCols - widgetToResize.colStart + 1)) : widgetToResize.colSpan;
            const finalRS = typeof newRowSpan === 'number' ? Math.max(minRS, Math.min(newRowSpan, widgetContainerRows - widgetToResize.rowStart + 1)) : widgetToResize.rowSpan;

            const otherWidgets = widgets.filter(w => w.id !== widgetToResize.id);
            if (canPlaceWidget({...widgetToResize, colSpan: finalCS, rowSpan: finalRS}, widgetToResize.colStart, widgetToResize.rowStart, otherWidgets)) {
                 handleWidgetResizeEnd(widgetToResize.id, { colStart: widgetToResize.colStart, rowStart: widgetToResize.rowStart, colSpan: finalCS, rowSpan: finalRS });
                 feedbackMessage = feedbackMessage || `Resized ${widgetToResize.title}.`;
            } else {
                const tempLayout = widgets.map(w => w.id === widgetToResize.id ? {...w, colSpan: finalCS, rowSpan: finalRS} : w);
                const sorted = performAutoSort(tempLayout);
                if (sorted) {
                    setWidgets(sorted);
                    updateWidgetsAndPushToHistory(sorted, `ai_resize_sort_${widgetToResize.id}`);
                    feedbackMessage = feedbackMessage || `Resized ${widgetToResize.title} and rearranged grid.`;
                } else {
                    feedbackMessage = feedbackMessage || `Could not resize ${widgetToResize.title} as requested due to space constraints.`;
                }
            }
        } else {
             feedbackMessage = feedbackMessage || `No specific resize dimensions provided for ${widgetToResize.title}.`;
        }
        break;
      }
      case 'changeWidgetSetting': {
        const settingCmd = command as ChangeWidgetSettingAiCommand<AllWidgetSettings>;
        const widgetToChange = findTargetWidget(settingCmd);
        if (widgetToChange && settingCmd.settingName) {
            const blueprint = AVAILABLE_WIDGET_DEFINITIONS.find(b => b.type === widgetToChange.type);
            let valueToSet: string | number | boolean | undefined | null = settingCmd.settingValue;

            if (blueprint?.defaultSettings) {
                const settingDef = blueprint.defaultSettings[settingCmd.settingName as keyof typeof blueprint.defaultSettings];
                if (settingDef !== undefined) {
                    const expectedType = typeof settingDef;
                    if (expectedType === 'boolean' && typeof valueToSet === 'string') {
                        valueToSet = ['true', 'on', 'yes', 'enable', 'show', 'enabled'].includes(valueToSet.toLowerCase());
                    } else if (expectedType === 'number' && typeof valueToSet === 'string') {
                        const numVal = parseFloat(valueToSet);
                        if (!isNaN(numVal)) valueToSet = numVal;
                        else { feedbackMessage = `Invalid number "${valueToSet}" for ${settingCmd.settingName}.`; break; }
                    }
                }
            }
            handleSaveWidgetInstanceSettings(widgetToChange.id, { [settingCmd.settingName]: valueToSet });
            feedbackMessage = feedbackMessage || `Setting ${settingCmd.settingName} for ${widgetToChange.title} updated.`;
        } else if (widgetToChange === null) {
            feedbackMessage = settingCmd.feedbackToUser || `Multiple widgets match for setting change. Please be more specific.`;
        } else {
            feedbackMessage = settingCmd.feedbackToUser || `Could not change setting. Widget or setting name unclear.`;
        }
        break;
      }
      case 'minimizeWidget': {
        const minCmd = command as MinimizeWidgetAiCommand;
        const widgetToMinimize = findTargetWidget(minCmd);
        if (widgetToMinimize) {
          if (!widgetToMinimize.isMinimized) {
            handleWidgetMinimizeToggle(widgetToMinimize.id);
            feedbackMessage = feedbackMessage || `Minimized ${widgetToMinimize.title}.`;
          } else {
            feedbackMessage = feedbackMessage || `${widgetToMinimize.title} is already minimized.`;
          }
        } else if (widgetToMinimize === null) {
            feedbackMessage = minCmd.feedbackToUser || `Multiple widgets match for minimizing. Please be more specific.`;
        } else {
            feedbackMessage = minCmd.feedbackToUser || `Could not find widget to minimize.`;
        }
        break;
      }
      case 'maximizeWidget': {
        const maxCmd = command as MaximizeWidgetAiCommand;
        const widgetToMaximize = findTargetWidget(maxCmd);
        if (widgetToMaximize) {
          if (maximizedWidgetId !== widgetToMaximize.id) {
            handleWidgetMaximizeToggle(widgetToMaximize.id);
            feedbackMessage = feedbackMessage || `Maximized ${widgetToMaximize.title}.`;
          } else {
            feedbackMessage = feedbackMessage || `${widgetToMaximize.title} is already maximized.`;
          }
        } else if (widgetToMaximize === null) {
            feedbackMessage = maxCmd.feedbackToUser || `Multiple widgets match for maximizing. Please be more specific.`;
        } else {
            feedbackMessage = maxCmd.feedbackToUser || `Could not find widget to maximize.`;
        }
        break;
      }
      case 'restoreWidget': {
        const restoreCmd = command as RestoreWidgetAiCommand;
        const widgetToRestore = findTargetWidget(restoreCmd);
        if (widgetToRestore) {
          if (widgetToRestore.isMinimized) {
            handleWidgetMinimizeToggle(widgetToRestore.id); 
            feedbackMessage = feedbackMessage || `Restored ${widgetToRestore.title} from minimized state.`;
          } else if (maximizedWidgetId === widgetToRestore.id) {
            handleWidgetMaximizeToggle(widgetToRestore.id); 
            feedbackMessage = feedbackMessage || `Restored ${widgetToRestore.title} from maximized state.`;
          } else {
            feedbackMessage = feedbackMessage || `${widgetToRestore.title} is not currently minimized or maximized.`;
          }
        } else if (widgetToRestore === null) {
            feedbackMessage = restoreCmd.feedbackToUser || `Multiple widgets match for restoring. Please be more specific.`;
        } else {
            feedbackMessage = restoreCmd.feedbackToUser || `Could not find widget to restore.`;
        }
        break;
      }
      case 'openOrFocusWidget': {
        const openCmd = command as OpenOrFocusWidgetAiCommand;
        let settingsToApply: Partial<AllWidgetSettings> | null = null;

        if (typeof openCmd.initialSettings === 'string') {
            try {
                settingsToApply = JSON.parse(openCmd.initialSettings);
            } catch (e) {
                console.error("Error parsing initialSettings JSON for openOrFocusWidget:", e);
                feedbackMessage = "Error applying initial settings due to invalid format.";
                break; 
            }
        } else if (typeof openCmd.initialSettings === 'object') {
            settingsToApply = openCmd.initialSettings;
        }

        const matchingTypeWidgets = widgets.filter(w => w.type === openCmd.widgetType);
        let targetWidget: PageWidgetConfig | null | undefined = undefined;

        if (matchingTypeWidgets.length === 0) {
            const blueprint = AVAILABLE_WIDGET_DEFINITIONS.find(b => b.type === openCmd.widgetType);
            const newWidgetTitle = openCmd.targetWidgetTitle || blueprint?.defaultTitle || `New ${openCmd.widgetType}`;
            handleAddNewWidget(
                openCmd.widgetType,
                newWidgetTitle,
                undefined, undefined, undefined, undefined, undefined, 
                settingsToApply || undefined 
            );
            feedbackMessage = feedbackMessage || `Opened new ${newWidgetTitle} widget. ${settingsToApply ? 'Initial settings applied.' : ''}`;
        } else if (matchingTypeWidgets.length === 1) {
            targetWidget = matchingTypeWidgets[0];
        } else { 
            if (openCmd.targetWidgetTitle) {
                targetWidget = matchingTypeWidgets.find(w => w.title.toLowerCase() === openCmd.targetWidgetTitle!.toLowerCase());
                if (!targetWidget) {
                    targetWidget = matchingTypeWidgets.find(w => w.title.toLowerCase().includes(openCmd.targetWidgetTitle!.toLowerCase()));
                }
            }
            if (!targetWidget) { 
                feedbackMessage = `Multiple ${openCmd.widgetType} widgets exist. Please specify which one (e.g., by title) or use "the [title] ${openCmd.widgetType}".`;
                break; 
            }
        }

        if (targetWidget) { 
            setActiveWidgetId(targetWidget.id); // This will also trigger centering via handleWidgetFocus

            if (maximizedWidgetId && maximizedWidgetId !== targetWidget.id) {
                const maximizedOriginal = widgets.find(w => w.id === maximizedWidgetId);
                if (maximizedOriginal) handleWidgetMaximizeToggle(maximizedOriginal.id); 
            }
            if (targetWidget.isMinimized) {
                handleWidgetMinimizeToggle(targetWidget.id); 
            }
            if (settingsToApply) {
                handleSaveWidgetInstanceSettings(targetWidget.id, settingsToApply);
            }
            feedbackMessage = feedbackMessage || `Focused ${targetWidget.title}. ${settingsToApply ? 'Settings applied.' : ''}`;
        }
        break;
      }
      case 'changeCellSize': {
        const cellCmd = command as ChangeCellSizeAiCommand;
        let targetCellSize = cellCmd.newCellSize;
        if (cellCmd.densityLabel) {
            const option = CELL_SIZE_OPTIONS.find(opt => opt.label.toLowerCase() === cellCmd.densityLabel!.toLowerCase());
            if (option) targetCellSize = option.value;
        }
        if (typeof targetCellSize === 'number' && CELL_SIZE_OPTIONS.some(opt => opt.value === targetCellSize)) {
          handleChangeCellSize(targetCellSize);
          feedbackMessage = feedbackMessage || `Cell size changed to ${targetCellSize}px.`;
        } else {
            feedbackMessage = cellCmd.feedbackToUser || `Invalid cell size or density label.`;
        }
        break;
      }
      case 'undoAction': handleUndo(); feedbackMessage = feedbackMessage || "Undo action performed."; break;
      case 'redoAction': handleRedo(); feedbackMessage = feedbackMessage || "Redo action performed."; break;
      case 'exportLayout': handleExportLayout(); feedbackMessage = feedbackMessage || "Layout exported."; break;
      case 'autoSortGrid': handleAutoSortButtonClick(); feedbackMessage = feedbackMessage || "Grid auto-sorted."; break;
      case 'sendChatMessage': {
        const chatCmd = command as SendChatMessageAiCommand;
        const chatWidget = findTargetWidget(chatCmd); 
        if (chatWidget && chatWidget.type === 'geminiChat' && chatCmd.message) {
          console.log(`AI wants to send to ${chatWidget.id} (${chatWidget.title}): "${chatCmd.message}"`);
          feedbackMessage = feedbackMessage || `Sending message to ${chatWidget.title}: "${chatCmd.message.substring(0,30)}..." (Display in widget not implemented in this example).`;
        } else if (chatWidget === null) {
            feedbackMessage = chatCmd.feedbackToUser || `Multiple chat widgets match. Please be more specific.`;
        } else {
          feedbackMessage = chatCmd.feedbackToUser || `Could not send chat message. Target chat widget or message unclear.`;
        }
        break;
      }
      case 'getWidgetInfo': {
        const infoCmd = command as GetWidgetInfoAiCommand;
        const widgetToQuery = findTargetWidget(infoCmd);
        if (widgetToQuery && infoCmd.requestedInfo) {
          let info = "Information not found.";
          const settingKey = infoCmd.requestedInfo.toLowerCase().replace(/\s/g, '');
          const widgetSettings = widgetToQuery.settings as Record<string, string | number | boolean | undefined | null>;

          if (widgetSettings && Object.prototype.hasOwnProperty.call(widgetSettings, settingKey)) {
            info = `The ${infoCmd.requestedInfo} for ${widgetToQuery.title} is ${JSON.stringify(widgetSettings[settingKey])}.`;
          } else if (settingKey === 'title') {
            info = `The title is ${widgetToQuery.title}.`;
          } else if (settingKey === 'type') {
            info = `${widgetToQuery.title} is a ${widgetToQuery.type} widget.`;
          } else if (settingKey === 'size' || settingKey === 'dimensions') {
            info = `${widgetToQuery.title} is ${widgetToQuery.colSpan} columns wide and ${widgetToQuery.rowSpan} rows tall.`;
          } else {
            info = `I couldn't find the specific detail "${infoCmd.requestedInfo}" for ${widgetToQuery.title}. Its current settings are: ${JSON.stringify(widgetToQuery.settings)}.`;
          }
          feedbackMessage = info;
        } else if (widgetToQuery === null) {
            feedbackMessage = infoCmd.feedbackToUser || `Multiple widgets match. Please be more specific.`;
        } else {
          feedbackMessage = infoCmd.feedbackToUser || `Could not get widget info. Target or requested info unclear.`;
        }
        break;
      }
      case 'clarifyCommand': {
        const clarifyCmd = command as ClarifyCommandAiCommand;
        feedbackMessage = clarifyCmd.feedbackToUser || clarifyCmd.clarificationNeeded || "I need more information to proceed.";
        break;
      }
      case 'unknown': {
        const unknownCmd = command as UnknownAiCommand;
        feedbackMessage = unknownCmd.feedbackToUser || `Sorry, I didn't understand the command: "${unknownCmd.originalCommand}".`;
        break;
      }
      default:
        const unhandledAction = (command as BaseAiCommand).action;
        feedbackMessage = `Sorry, I can't handle the action: ${unhandledAction}. This might be an unhandled command type.`;
    }

    if (feedbackMessage) { 
        setAiLastFeedback(feedbackMessage);
    }
  };


  // --- End AI Integration Functions ---

  const handleGoogleServiceSelect = (widgetId: string, serviceKey: GoogleServiceActionKey) => {
    console.log(`Google service selected from hub ${widgetId}: ${serviceKey}`);
    handleWidgetMinimizeToggle(widgetId);
    alert(`Selected ${serviceKey}. This would open the ${serviceKey} widget and close the hub. (Functionality to open specific widget not yet implemented)`);
  };

  const handleWheelScroll = (event: React.WheelEvent<HTMLDivElement>) => {
    // If a widget is active, or the dashboardAreaRef is not available,
    // do nothing here. This allows the browser's default scroll behavior
    // to take over (e.g., scrolling content within the active widget).
    if (activeWidgetId || !dashboardAreaRef.current) {
      return;
    }
  
    // Grid scroll logic (only if no widget is active)
    const { deltaX, deltaY } = event;
    // Prioritize deltaX for horizontal scroll, otherwise use deltaY if deltaX is 0.
    // This supports mice with tilt-wheels or touchpad horizontal scroll gestures.
    const scrollAmount = deltaX !== 0 ? deltaX : deltaY;
  
    // Check if there's actually horizontal overflow to scroll
    if (dashboardAreaRef.current.scrollWidth > dashboardAreaRef.current.clientWidth) {
      if (scrollAmount !== 0) {
        // Prevent default page scroll only if we are actively scrolling the grid horizontally.
        // This is important to allow vertical scrolling on the page if the grid isn't meant to scroll.
        event.preventDefault();
        dashboardAreaRef.current.scrollLeft += scrollAmount;
      }
    }
    // If there's no horizontal overflow, or scrollAmount is 0, the event proceeds normally.
    // Since overflow-y is hidden on dashboardAreaRef, default vertical scroll on this element is not an issue.
  };


  const renderWidgetContent = (widgetConfig: PageWidgetConfig) => {
    const currentWidgetSettings = widgetConfig.settings || {};
    const notesSettings = currentWidgetSettings as PageInstanceNotesSettings | undefined;

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
      case 'notes': return <NotesWidget instanceId={widgetConfig.id} settings={notesSettings} notes={sharedNotes} activeNoteId={activeSharedNoteId} onNotesChange={setSharedNotes} onActiveNoteIdChange={setActiveSharedNoteId} />;
      case 'portfolio': return <PortfolioWidget settings={currentWidgetSettings as PortfolioWidgetSettings | undefined} isMobileFullScreen={isMobileView && widgets.length === 1 && widgets[0].type === 'portfolio'} />;
      case 'geminiChat': return <GeminiChatWidget instanceId={widgetConfig.id} settings={currentWidgetSettings as GeminiChatWidgetSettings | undefined} />;
      case 'googleServicesHub':
        return (
          <GoogleServicesHubWidget
            settings={currentWidgetSettings as GoogleServicesHubWidgetSettings | undefined}
            onRequestClose={() => handleWidgetMinimizeToggle(widgetConfig.id)}
            onSelectService={(serviceKey) => handleGoogleServiceSelect(widgetConfig.id, serviceKey)}
          />
        );
      default: return <p className="text-xs text-secondary italic">Generic widget content for type: {widgetConfig.type}.</p>;
    }
  };

  const getSettingsPanelForWidget = (widgetConfig: PageWidgetConfig | null) => {
    if (!widgetConfig) return null; const currentContentSettings = widgetConfig.settings || {};
    const boundSaveInstanceContentSettings = (newInstanceContentSettings: AllWidgetSettings) => { handleSaveWidgetInstanceSettings(widgetConfig.id, newInstanceContentSettings); handleCloseSettingsModal(); };
    const boundSavePhotoInstanceContentSettings = (newInstancePhotoSettings: PhotoWidgetSettings) => { handleSaveWidgetInstanceSettings(widgetConfig.id, newInstancePhotoSettings); handleCloseSettingsModal(); };
    const notesSettingsPanel = currentContentSettings as PageInstanceNotesSettings | undefined;

    switch (widgetConfig.type) {
      case 'weather': return <WeatherSettingsPanel widgetId={widgetConfig.id} currentSettings={currentContentSettings as WeatherWidgetSettings | undefined} onSave={boundSaveInstanceContentSettings} />;
      case 'clock': return <ClockSettingsPanel widgetId={widgetConfig.id} currentSettings={currentContentSettings as ClockWidgetSettings | undefined} onSave={boundSaveInstanceContentSettings} />;
      case 'calculator': return <CalculatorSettingsPanel widgetId={widgetConfig.id} currentSettings={currentContentSettings as CalculatorWidgetSettings | undefined} onSave={boundSaveInstanceContentSettings} />;
      case 'youtube': return <YoutubeSettingsPanel widgetId={widgetConfig.id} currentSettings={currentContentSettings as YoutubeWidgetSettings | undefined} onSave={boundSaveInstanceContentSettings} />;
      case 'minesweeper': return <MinesweeperSettingsPanel widgetId={widgetConfig.id} currentSettings={currentContentSettings as MinesweeperWidgetSettings | undefined} onSave={boundSaveInstanceContentSettings} />;
      case 'unitConverter': return <UnitConverterSettingsPanel widgetId={widgetConfig.id} currentSettings={currentContentSettings as UnitConverterWidgetSettings | undefined} onSave={boundSaveInstanceContentSettings} />;
      case 'countdownStopwatch': return <CountdownStopwatchSettingsPanel widgetId={widgetConfig.id} currentSettings={currentContentSettings as CountdownStopwatchWidgetSettings | undefined} onSave={boundSaveInstanceContentSettings} />;
      case 'photo': return <PhotoSettingsPanel widgetId={widgetConfig.id} currentSettings={currentContentSettings as PhotoWidgetSettings | undefined} onSaveInstanceSettings={boundSavePhotoInstanceContentSettings} onClearGlobalHistory={() => { handleSharedPhotoHistoryChange([]); alert('Global photo history has been cleared.'); }} globalHistoryLength={sharedPhotoHistory.length} />;
      case 'notes': return <NotesSettingsPanel widgetInstanceId={widgetConfig.id} currentSettings={notesSettingsPanel} onSaveLocalSettings={boundSaveInstanceContentSettings} onClearAllNotesGlobal={() => { setSharedNotes([]); setActiveSharedNoteId(null); alert("All notes have been cleared from the dashboard."); }} />;
      case 'todo': return <TodoSettingsPanel widgetId={widgetConfig.id} currentSettings={currentContentSettings as TodoWidgetSettings | undefined} onSave={boundSaveInstanceContentSettings} onClearAllTasks={() => { handleSharedTodosChange([]); alert(`The global to-do list has been cleared.`); }} />;
      case 'portfolio': return <PortfolioSettingsPanel widgetId={widgetConfig.id} currentSettings={currentContentSettings as PortfolioWidgetSettings | undefined} onSave={boundSaveInstanceContentSettings} />;
      case 'geminiChat': return <GeminiChatSettingsPanel widgetInstanceId={widgetConfig.id} currentSettings={currentContentSettings as GeminiChatWidgetSettings | undefined} onSave={boundSaveInstanceContentSettings} />;
      case 'googleServicesHub':
        return (
          <GoogleServicesHubSettingsPanel
            widgetId={widgetConfig.id}
            currentSettings={currentContentSettings as GoogleServicesHubWidgetSettings | undefined}
            onSave={boundSaveInstanceContentSettings}
          />
        );
      default: return <p className="text-sm text-secondary">No specific content settings available for this widget type.</p>;
    }
  };

  if (!isLayoutEngineReady || widgetContainerCols === 0 || widgetContainerRows === 0) {
    return <div className="w-full h-screen bg-page-background flex items-center justify-center text-page-foreground">Loading Dashboard...</div>;
  }

  return (
    <main className="w-full h-screen bg-page-background text-page-foreground overflow-hidden relative flex flex-col"
      onClick={(e) => {
        // If the click is directly on the <main> element (the ultimate background)
        // and not on the context menu or while a widget is maximized, deselect the active widget.
        if (e.target === e.currentTarget && !maximizedWidgetId && !isAddWidgetContextMenuOpen) {
            setActiveWidgetId(null);
        }
        // If the context menu is open and the click is on the <main> element, close the context menu.
        if (isAddWidgetContextMenuOpen && e.target === e.currentTarget) {
            handleCloseContextMenu();
        }
      }}
      onContextMenu={handleDashboardContextMenu}
    >
      <header ref={headerRef} className="p-3 bg-dark-surface text-primary flex items-center justify-between shadow-lg z-40 shrink-0 border-b border-[var(--dark-border-interactive)]">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button onClick={handleUndo} disabled={historyPointer.current <= 0 || !!maximizedWidgetId} className="control-button" aria-label="Undo"><UndoIcon /></button>
          <button onClick={handleRedo} disabled={historyPointer.current >= history.current.length - 1 || !!maximizedWidgetId} className="control-button" aria-label="Redo"><RedoIcon /></button>

          {!isMobileView && (
            <>
              <div className="relative" ref={addWidgetMenuRef}>
                <button id="add-widget-button" onClick={() => {setIsAddWidgetMenuOpen(prev => !prev); setIsAddWidgetContextMenuOpen(false); setIsDensityMenuOpen(false);}} disabled={!!maximizedWidgetId} className="control-button flex items-center" aria-expanded={isAddWidgetMenuOpen} aria-haspopup="true" aria-label="Add New Widget" > <AddIcon /> <span className="ml-1.5 text-xs hidden sm:inline">Add Widget</span> </button>
                {isAddWidgetMenuOpen && ( <div className="absolute backdrop-blur-md left-0 mt-2 w-56 origin-top-left rounded-md bg-dark-surface border border-dark-border-interactive shadow-xl py-1 z-50 focus:outline-none animate-modalFadeInScale" role="menu" aria-orientation="vertical" aria-labelledby="add-widget-button" > {AVAILABLE_WIDGET_DEFINITIONS.map(widgetDef => ( <button key={widgetDef.type} onClick={() => handleAddNewWidget(widgetDef.type)} className="group flex items-center w-full text-left px-3 py-2.5 text-sm text-dark-text-primary hover:bg-dark-accent-primary hover:text-dark-text-on-accent focus:bg-dark-accent-primary focus:text-dark-text-on-accent focus:outline-none transition-all duration-150 ease-in-out hover:pl-4" role="menuitem" disabled={!!maximizedWidgetId} > {widgetDef.icon && <widgetDef.icon />} <span className="flex-grow">{widgetDef.displayName || widgetDef.defaultTitle.replace("New ", "")}</span> </button>))} </div> )}
              </div>
              <button onClick={handleAutoSortButtonClick} disabled={!!maximizedWidgetId || widgets.length === 0} className="control-button flex items-center" aria-label="Auto Sort Grid"> <AutoSortIcon /> <span className="ml-1.5 text-xs hidden sm:inline">Sort Grid</span> </button>
              <button onClick={handleExportLayout} disabled={!!maximizedWidgetId} className="control-button" aria-label="Export Layout"><ExportIcon /></button>
              <button onClick={triggerImportFileSelect} disabled={!!maximizedWidgetId} className="control-button" aria-label="Import Layout"><ImportIcon /></button>
              <input type="file" ref={fileInputRef} onChange={handleImportLayout} accept=".json" style={{ display: 'none' }} />
            </>
          )}
           <div className="relative" ref={densityMenuRef}>
            <button
              onClick={() => {setIsDensityMenuOpen(prev => !prev); setIsAddWidgetMenuOpen(false);}}
              disabled={!!maximizedWidgetId}
              className="control-button flex items-center"
              aria-expanded={isDensityMenuOpen}
              aria-haspopup="true"
              aria-label="Change Grid Density"
              title="Change Grid Density"
            >
              <DensityIcon />
              <span className="ml-1.5 text-xs hidden sm:inline">
                {CELL_SIZE_OPTIONS.find(opt => opt.value === cellSize)?.label || `${cellSize}px`}
              </span>
            </button>
            {isDensityMenuOpen && (
              <div className="absolute backdrop-blur-md left-0 mt-2 w-40 origin-top-left rounded-md bg-dark-surface border border-dark-border-interactive shadow-xl py-1 z-50 focus:outline-none animate-modalFadeInScale" role="menu">
                {CELL_SIZE_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleChangeCellSize(option.value)}
                    className={`group flex items-center w-full text-left px-3 py-2.5 text-sm transition-all duration-150 ease-in-out
                                ${cellSize === option.value
                                    ? 'bg-dark-accent-primary-hover text-dark-text-on-accent font-semibold'
                                    : 'text-dark-text-primary hover:bg-dark-accent-primary hover:text-dark-text-on-accent focus:bg-dark-accent-primary focus:text-dark-text-on-accent'
                                }`}
                    role="menuitem"
                    disabled={!!maximizedWidgetId}
                  >
                    {option.label} ({option.value}px)
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <button
            onClick={() => setShowAiCommandBar(prev => !prev)}
            className="control-button"
            aria-label={showAiCommandBar ? "Hide AI Command Bar" : "Show AI Command Bar"}
            title={showAiCommandBar ? "Hide AI Command Bar" : "Show AI Command Bar"}
        >
            <AiIcon />
        </button>
        <div className="text-xs text-secondary px-2 sm:px-3 py-1 bg-slate-700 rounded-md">
            {isMobileView ? "Mobile View" : `History: ${historyDisplay.pointer}/${historyDisplay.length}`}
        </div>
      </header>

      {maximizedWidgetId && !isMobileView && ( <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[45]" onClick={() => maximizedWidgetId && handleWidgetMaximizeToggle(maximizedWidgetId)} /> )}

      {/* dashboardAreaRef is now the scroll container */}
      <div 
        ref={dashboardAreaRef} 
        className={`flex-grow relative overflow-x-auto overflow-y-hidden ${maximizedWidgetId && !isMobileView ? 'pointer-events-none' : ''}`}
        onWheel={handleWheelScroll} // Added wheel scroll handler
        onClick={(e) => {
          // If the click is on the dashboardArea itself (or its direct children like gridWrapperRef if not a widget)
          // and not on a widget or interactive element within a widget, deselect.
          const targetIsWidget = widgets.some(widget => (e.target as HTMLElement).closest(`#${CSS.escape(widget.id)}`));
          const isDashboardAreaClick = e.target === dashboardAreaRef.current || e.target === gridWrapperRef.current;

          if (isDashboardAreaClick && !targetIsWidget && !maximizedWidgetId && !isAddWidgetContextMenuOpen) {
            setActiveWidgetId(null);
          }
        }}
      >
        {/* gridWrapperRef controls the actual width of the content, allowing it to exceed viewport */}
        <div 
            id="grid-content-wrapper"
            ref={gridWrapperRef}
            className="relative h-full" // Height is 100% of dashboardAreaRef
            style={{ width: `${actualGridPixelWidth}px` }} 
        >
            <GridBackground cellSize={cellSize} gridWidth={actualGridPixelWidth} /> 
            <div
                id="widget-grid-container"
                className="absolute inset-0 grid gap-0" // Positioned within the grid-content-wrapper
                style={{
                    gridTemplateColumns: `repeat(${widgetContainerCols}, ${cellSize}px)`,
                    gridTemplateRows: `repeat(${widgetContainerRows}, ${cellSize}px)`,
                    alignContent: 'start',
                    width: `${actualGridPixelWidth}px`, // Ensure this also has the full width
                    height: '100%', // And full height of its parent
                }}
            >
            {widgets.map((widgetConfig) => {
                if (maximizedWidgetId && maximizedWidgetId !== widgetConfig.id && !isMobileView) return null;

                const currentWidgetState = maximizedWidgetId === widgetConfig.id && maximizedWidgetOriginalState && !isMobileView
                    ? {
                        ...maximizedWidgetOriginalState,
                        colStart: 1,
                        rowStart: 1,
                        // Maximize within the scrollable viewport, not the entire actualGridPixelWidth
                        colSpan: Math.floor(window.innerWidth / cellSize) > 2 ? Math.floor(window.innerWidth / cellSize) -1 : Math.floor(window.innerWidth / cellSize),
                        rowSpan: widgetContainerRows > 2 ? widgetContainerRows - 1 : widgetContainerRows,
                        isMinimized: false,
                    }
                    : widgetConfig;

                let minCol = widgetConfig.minColSpan;
                let minRow = widgetConfig.minRowSpan;

                if (widgetConfig.isMinimized && maximizedWidgetId !== widgetConfig.id && !isMobileView) {
                    minCol = widgetConfig.colSpan;
                    minRow = MINIMIZED_WIDGET_ROW_SPAN;
                }

                return (
                <Widget
                    key={widgetConfig.id} id={widgetConfig.id} title={widgetConfig.title}
                    colStart={currentWidgetState.colStart} rowStart={currentWidgetState.rowStart} colSpan={currentWidgetState.colSpan} rowSpan={currentWidgetState.rowSpan}
                    onResize={handleWidgetResizeLive} onResizeEnd={handleWidgetResizeEnd} onMove={handleWidgetMove}
                    onDelete={handleWidgetDelete} onFocus={handleWidgetFocus} // handleWidgetFocus now also triggers centering
                    onOpenSettings={handleOpenWidgetSettings}
                    onOpenContainerSettings={handleOpenContainerSettingsModal}
                    containerSettings={widgetConfig.containerSettings}
                    isActive={widgetConfig.id === activeWidgetId && !maximizedWidgetId} CELL_SIZE={cellSize}
                    minColSpan={minCol} minRowSpan={minRow}
                    totalGridCols={widgetContainerCols} totalGridRows={widgetContainerRows}
                    isMinimized={widgetConfig.isMinimized && maximizedWidgetId !== widgetConfig.id && !isMobileView} onMinimizeToggle={() => handleWidgetMinimizeToggle(widgetConfig.id)}
                    isMaximized={maximizedWidgetId === widgetConfig.id && !isMobileView} onMaximizeToggle={() => handleWidgetMaximizeToggle(widgetConfig.id)}
                    isDraggable={!isMobileView || widgets.length > 1}
                    isResizable={!isMobileView || widgets.length > 1}
                >
                    {renderWidgetContent(widgetConfig)}
                </Widget>
                );
            })}
            </div>
        </div>
      </div>

      {showAiCommandBar && (
        <div id="ai-command-bar" className="fixed bottom-0 left-0 right-0 bg-slate-800/90 dark:bg-dark-surface/90 backdrop-blur-md p-3 md:p-4 shadow-2xl_top z-[60] border-t border-slate-700 dark:border-dark-border-interactive transition-transform duration-300 ease-out animate-slideUp">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center space-x-2 md:space-x-3">
                    <button
                        onClick={startListening}
                        disabled={aiIsProcessing}
                        className={`p-2.5 md:p-3 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${aiIsListening ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : 'bg-sky-500 hover:bg-sky-600 text-white'}`}
                        aria-label={aiIsListening ? "Stop listening" : "Start voice command"}
                        title={aiIsListening ? "Stop listening" : "Start voice command"}
                    >
                        {aiIsListening ? <MicOffIcon /> : <MicIcon />}
                    </button>
                    <input
                        type="text"
                        value={aiInputValue}
                        onChange={(e) => setAiInputValue(e.target.value)}
                        onKeyPress={(e) => { if (e.key === 'Enter' && !aiIsProcessing) handleSendAiCommand(aiInputValue); }}
                        placeholder={aiIsListening ? "Listening..." : "Type your command or use microphone..."}
                        className="flex-grow p-3 bg-slate-700 dark:bg-slate-900 border border-slate-600 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm placeholder-slate-400 text-slate-100 transition-all duration-200 shadow-sm"
                        disabled={aiIsProcessing}
                        aria-label="AI command input"
                    />
                    <button
                        onClick={() => handleSendAiCommand(aiInputValue)}
                        disabled={aiIsProcessing || !aiInputValue.trim()}
                        className="p-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center aspect-square focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-800 shadow-md"
                        aria-label="Send command"
                    >
                        {aiIsProcessing ? <ProcessingIcon /> : <SendArrowIcon />}
                    </button>
                     <button
                        onClick={() => setShowAiCommandBar(false)}
                        className="p-2.5 md:p-3 rounded-full bg-slate-600 hover:bg-slate-500 text-slate-300 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                        aria-label="Close AI Command Bar"
                        title="Close AI Command Bar"
                    >
                        <AiCloseIcon />
                    </button>
                </div>
                {(aiLastFeedback || aiError) && (
                    <div className={`mt-2.5 p-2.5 rounded-md text-xs ${aiError ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-sky-500/10 text-sky-300 border border-sky-500/20'}`}>
                        <strong>{aiError ? 'Error: ' : (aiIsProcessing ? 'Processing: ' : (aiIsListening && !aiInputValue.trim() ? '' : 'AI: '))}</strong>
                        {aiError || aiLastFeedback}
                    </div>
                )}
            </div>
        </div>
      )}


      {isSettingsModalOpen && selectedWidgetForSettings && (
        <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={handleCloseSettingsModal}
            title={selectedWidgetForSettings.title}
            settingsContent={getSettingsPanelForWidget(selectedWidgetForSettings)}
        />
      )}
      {isContainerSettingsModalOpen && selectedWidgetForContainerSettings && !isMobileView && (
        <WidgetContainerSettingsModal
            isOpen={isContainerSettingsModalOpen}
            onClose={handleCloseContainerSettingsModal}
            widgetId={selectedWidgetForContainerSettings.id}
            widgetTitle={selectedWidgetForContainerSettings.title}
            currentSettings={selectedWidgetForContainerSettings.containerSettings}
            onSave={handleSaveWidgetContainerSettings}
            availableSizePresets={WIDGET_SIZE_PRESETS}
            onApplySizePreset={handleApplyWidgetSizePreset}
            currentWidgetSize={{ colSpan: selectedWidgetForContainerSettings.colSpan, rowSpan: selectedWidgetForContainerSettings.rowSpan }}
        />
      )}

      {!isMobileView && <AddWidgetContextMenu
        isOpen={isAddWidgetContextMenuOpen}
        onClose={handleCloseContextMenu}
        position={contextMenuPosition}
        onAddWidget={handleAddNewWidget}
        availableWidgets={contextMenuAvailableWidgets}
        widgetContainerCols={widgetContainerCols}
        widgetContainerRows={widgetContainerRows}
        CELL_SIZE={cellSize}
        headerHeight={headerRef.current?.offsetHeight || 0} 
      />}
    </main>
  );
}

// Styles
const styles = `
  .control-button { display:flex; align-items:center; justify-content:center; padding:0.5rem; background-color:var(--dark-accent-primary); border-radius:0.375rem; color:var(--dark-text-on-accent); transition:background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out; box-shadow:0 1px 2px 0 rgba(0,0,0,0.05); }
  .control-button:hover { background-color:var(--dark-accent-primary-hover); box-shadow:0 2px 4px 0 rgba(0,0,0,0.1); }
  .control-button:disabled { background-color:hsl(222,47%,25%); color:hsl(215,20%,55%); cursor:not-allowed; box-shadow:none; }
  .control-button:focus-visible { outline:2px solid var(--dark-accent-primary-hover); outline-offset:2px; }
  @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .animate-slideUp { animation: slideUp 0.3s ease-out forwards; }
  .shadow-2xl_top { box-shadow: 0 -20px 25px -5px rgba(0,0,0,0.1), 0 -10px 10px -5px rgba(0,0,0,0.04); }
`;
if (typeof window !== 'undefined' && !document.getElementById('custom-dashboard-styles')) {
  const styleSheet = document.createElement("style");
  styleSheet.id = 'custom-dashboard-styles';
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}
