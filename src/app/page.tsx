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
import AddWidgetContextMenu, { mapBlueprintToContextMenuItem, type WidgetBlueprintContextMenuItem } from '@/components/AddWidgetContextMenu';

import {
  UndoIcon,
  RedoIcon,
  ExportIcon,
  ImportIcon,
  AddIcon,
  AutoSortIcon,
  DensityIcon
} from '@/components/Icons';

import {
  DEFAULT_CELL_SIZE,
  WIDGET_SIZE_PRESETS,
  AVAILABLE_WIDGET_DEFINITIONS,
  PHOTO_WIDGET_DEFAULT_INSTANCE_SETTINGS,
  PORTFOLIO_WIDGET_DEFAULT_INSTANCE_SETTINGS,
  GEMINI_CHAT_WIDGET_DEFAULT_INSTANCE_SETTINGS,
  type WidgetSizePresetKey,
  type AllWidgetSettings,
  type WidgetType,
  type PageWidgetConfig,
  type PageInstanceNotesSettings,
} from '@/definitions/widgetConfig';


// --- Page-Specific Constants ---
const CELL_SIZE_OPTIONS = [
    { label: 'Micro', value: 15 },
    { label: 'Compact', value: 20 },
    { label: 'Default', value: DEFAULT_CELL_SIZE },
    { label: 'Spacious', value: 40 },
    { label: 'Large', value: 50 },
];

const MAX_HISTORY_LENGTH = 50;
const MINIMIZED_WIDGET_ROW_SPAN = 2;
const DASHBOARD_LAYOUT_STORAGE_KEY = 'dashboardLayoutV3.21';
const GLOBAL_NOTES_STORAGE_KEY = 'dashboardGlobalNotesCollection_v1';
const GLOBAL_TODOS_STORAGE_KEY = 'dashboardGlobalSingleTodoList_v1';
const GLOBAL_PHOTO_HISTORY_STORAGE_KEY = 'dashboardGlobalPhotoHistory_v1';
const DATA_SAVE_DEBOUNCE_MS = 700;
const WIDGET_DESELECT_TIMEOUT_MS = 3000;
const MOBILE_BREAKPOINT_PX = 768;

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

    const finalContainerSettings: WidgetContainerSettings = {
        ...DEFAULT_WIDGET_CONTAINER_SETTINGS,
        ...(widgetData.containerSettings || {})
    };
     if (isMobileTarget && widgetData.type === 'portfolio') {
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
}


export default function Home() {
  const [isMobileView, setIsMobileView] = useState(false);
  const [cellSize, setCellSize] = useState<number>(DEFAULT_CELL_SIZE);
  const [widgetContainerCols, setWidgetContainerCols] = useState(0);
  const [widgetContainerRows, setWidgetContainerRows] = useState(0);
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);

  const initialLayoutIsDefaultRef = useRef(false);
  const initialCenteringDoneRef = useRef(false);
  const [widgets, setWidgets] = useState<PageWidgetConfig[]>([]);
  const [isLayoutEngineReady, setIsLayoutEngineReady] = useState(false); // MODIFIED: Replaced initialLoadAttempted ref

  // Effect for determining mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < MOBILE_BREAKPOINT_PX);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Effect for initializing widgets based on mobile view or localStorage
 useEffect(() => {
    let loadedCellSize = DEFAULT_CELL_SIZE;
    let loadedWidgets: PageWidgetConfig[] | null = null;
    let wasMobileLayoutSaved = false;

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

                        if (isMobileView === wasMobileLayoutSaved && Array.isArray(savedData.widgets)) {
                            loadedWidgets = savedData.widgets.map(w => processWidgetConfig(
                                w as Partial<PageWidgetConfig>,
                                loadedCellSize,
                                isMobileView,
                                isMobileView ? Math.floor(window.innerWidth / loadedCellSize) : undefined,
                                isMobileView ? Math.floor((window.innerHeight - (headerRef.current?.offsetHeight || 60)) / loadedCellSize) : undefined
                            ));
                            initialLayoutIsDefaultRef.current = false;
                        } else {
                             console.log(`[page.tsx] View mode mismatch (current: ${isMobileView ? 'mobile' : 'desktop'}, saved: ${wasMobileLayoutSaved ? 'mobile' : 'desktop'}). Using default layout for current view.`);
                        }
                    } else {
                        console.log(`[page.tsx] Storage key version mismatch. Using new initial layout.`);
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

    if (loadedWidgets) {
        setWidgets(loadedWidgets);
    } else {
        const baseLayout = isMobileView ? initialMobileWidgetLayout : initialDesktopWidgetsLayout;
        const tempCols = Math.floor(window.innerWidth / loadedCellSize);
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
    setIsLayoutEngineReady(true); // MODIFIED: Set layout engine ready state
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
  const dashboardAreaRef = useRef<HTMLDivElement>(null);
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
    // MODIFIED: Initialize history based on isLayoutEngineReady and widgets
    if (isLayoutEngineReady && widgets && widgets.length >= 0 && history.current.length === 0) {
        history.current = [JSON.parse(JSON.stringify(widgets))];
        historyPointer.current = 0;
        setHistoryDisplay({ pointer: historyPointer.current + 1, length: history.current.length });
    }
  }, [widgets, isLayoutEngineReady]); // MODIFIED: Dependency

  // REMOVED: Separate useEffect for initialLoadAttempted.current
  // useEffect(() => {
  //     if (widgets.length > 0 && !initialLoadAttempted.current) {
  //         initialLoadAttempted.current = true;
  //     }
  // }, [widgets]);


  useEffect(() => {
    // MODIFIED: Save only if layout engine is ready
    if (typeof window !== 'undefined' && isLayoutEngineReady) {
      try {
        const dataToSave: StoredDashboardLayout = {
            dashboardVersion: DASHBOARD_LAYOUT_STORAGE_KEY.replace('dashboardLayoutV','v'),
            widgets: widgets,
            cellSize: cellSize,
            isMobileLayout: isMobileView
        };
        window.localStorage.setItem(DASHBOARD_LAYOUT_STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (error) { console.error("Error saving dashboard layout to localStorage:", error); }
    }
  }, [widgets, cellSize, isMobileView, isLayoutEngineReady]); // MODIFIED: Dependency

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
  }, [widgetContainerCols, updateWidgetsAndPushToHistory, widgets, cellSize, isMobileView]);


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
  useEffect(() => { const handleClickOutside = (e: MouseEvent) => { if (addWidgetMenuRef.current && !addWidgetMenuRef.current.contains(e.target as Node)) { setIsAddWidgetMenuOpen(false); } if (densityMenuRef.current && !densityMenuRef.current.contains(e.target as Node)) { setIsDensityMenuOpen(false); }}; if (isAddWidgetMenuOpen || isDensityMenuOpen) { document.addEventListener('mousedown', handleClickOutside); } else { document.removeEventListener('mousedown', handleClickOutside); } return () => { document.removeEventListener('mousedown', handleClickOutside); }; }, [isAddWidgetMenuOpen, isDensityMenuOpen]);


  useEffect(() => {
    const determineWidgetContainerGridSize = () => {
      const screenWidth = window.innerWidth; const screenHeight = window.innerHeight;
      const currentHeaderHeight = headerRef.current?.offsetHeight || 60;
      const mainContentHeight = screenHeight - currentHeaderHeight;
      const newCols = Math.max(1, Math.floor(screenWidth / cellSize));
      const newRows = Math.max(1, Math.floor(mainContentHeight / cellSize));
      setWidgetContainerCols(newCols);
      setWidgetContainerRows(newRows);

      if (isMobileView && widgets.length === 1 && widgets[0].type === 'portfolio') {
        setWidgets(currentWidgets => currentWidgets.map(w => {
          if (w.type === 'portfolio') {
            return {
              ...w,
              colStart: 1,
              rowStart: 1,
              colSpan: newCols,
              rowSpan: newRows > 1 ? newRows -1 : 1,
            };
          }
          return w;
        }));
      }
    };
    determineWidgetContainerGridSize(); const timeoutId = setTimeout(determineWidgetContainerGridSize, 100);
    window.addEventListener('resize', determineWidgetContainerGridSize);
    return () => { clearTimeout(timeoutId); window.removeEventListener('resize', determineWidgetContainerGridSize); };
  }, [cellSize, isMobileView, widgets]);

  useEffect(() => {
    setContextMenuAvailableWidgets(
      AVAILABLE_WIDGET_DEFINITIONS.map(blueprint => mapBlueprintToContextMenuItem(blueprint))
    );
  }, []);

  const handleExportLayout = () => {
    if (typeof window === 'undefined') return;
    try {
      const layoutToExport: StoredDashboardLayout = { dashboardVersion: DASHBOARD_LAYOUT_STORAGE_KEY.replace('dashboardLayoutV','v'), widgets: widgets, cellSize: cellSize, notesCollection: { notes: sharedNotes, activeNoteId: activeSharedNoteId }, sharedGlobalTodos: sharedTodos, sharedGlobalPhotoHistory: sharedPhotoHistory, isMobileLayout: isMobileView };
      const jsonString = JSON.stringify(layoutToExport, null, 2); const blob = new Blob([jsonString],{type:'application/json'}); const href = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = href; link.download = `dashboard-layout-${layoutToExport.dashboardVersion}.json`; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(href);
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
            const parsedJson = JSON.parse(text);

            let finalWidgetsToSet: PageWidgetConfig[];
            let finalCellSize = cellSize;
            let notesToSet = sharedNotes;
            let activeNoteIdToSet = activeSharedNoteId;
            let todosToSet = sharedTodos;
            let photoHistoryToSet = sharedPhotoHistory;
            let alertMessage = "";
            let importedIsMobileLayout = false;


            if (typeof parsedJson === 'object' && !Array.isArray(parsedJson) && parsedJson.dashboardVersion && parsedJson.widgets) {
                const modernData = parsedJson as StoredDashboardLayout;
                importedIsMobileLayout = modernData.isMobileLayout || false;

                if (typeof modernData.cellSize === 'number') {
                    const validOption = CELL_SIZE_OPTIONS.find(opt => opt.value === modernData.cellSize);
                    if (validOption) finalCellSize = validOption.value;
                }

                const tempCols = Math.floor(window.innerWidth / finalCellSize);
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
                const tempCols = Math.floor(window.innerWidth / cellSize);
                const tempRows = Math.floor((window.innerHeight - (headerRef.current?.offsetHeight || 60)) / cellSize);

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
            setWidgets(finalWidgetsToSet);
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

  const doRectanglesOverlap = useCallback((
    r1C: number, r1R: number, r1CS: number, r1RS: number,
    r2C: number, r2R: number, r2CS: number, r2RS: number,
    buffer: number = 0
  ): boolean => {
    const r2BufferedColStart = Math.max(1, r2C - buffer);
    const r2BufferedRowStart = Math.max(1, r2R - buffer);
    const r2BufferedColEnd = Math.min(widgetContainerCols > 0 ? widgetContainerCols : Infinity, r2C + r2CS - 1 + buffer);
    const r2BufferedRowEnd = Math.min(widgetContainerRows > 0 ? widgetContainerRows : Infinity, r2R + r2RS - 1 + buffer);

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
    currentLayout: PageWidgetConfig[]
  ): boolean => {
    if (widgetContainerCols === 0 || widgetContainerRows === 0) return false;
    if (targetCol < 1 || targetRow < 1 ||
        targetCol + widgetToPlace.colSpan - 1 > widgetContainerCols ||
        targetRow + widgetToPlace.rowSpan - 1 > widgetContainerRows) {
      return false;
    }
    for (const existingWidget of currentLayout) {
      if (existingWidget.id === widgetToPlace.id) continue;
      if (doRectanglesOverlap(
        targetCol, targetRow, widgetToPlace.colSpan, widgetToPlace.rowSpan,
        existingWidget.colStart, existingWidget.rowStart, existingWidget.colSpan, existingWidget.rowSpan
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
                if (canPlaceWidget(checkWidget, c, r, newLayout)) {
                    newLayout.push({ ...widget, colStart: c, rowStart: r });
                    placed = true;
                    break;
                }
            }
            if (placed) break;
        }
        if (!placed) {
             console.warn(`[performAutoSort] Could not place widget: ${widget.id} (${widget.title}) with size ${widget.colSpan}x${widget.rowSpan}. Min size ${widget.minColSpan}x${widget.minRowSpan}. Grid might be too full.`);
            return null;
        }
    }
    return newLayout;
  }, [widgetContainerCols, widgetContainerRows, canPlaceWidget]);

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
      alert("Could not fully sort the grid. Some widgets might be unplaceable or the grid is too full.");
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
            minColSpan: targetColSpan, minRowSpan: targetRowSpan,
        };
        if (canPlaceWidget(dummyWidgetToCheck, c, r, currentLayout)) {
          return { colStart: c, rowStart: r };
        }
      }
    }
    return null;
  }, [widgetContainerCols, widgetContainerRows, canPlaceWidget]);

  const handleAddNewWidget = useCallback((widgetType: WidgetType) => {
    if (maximizedWidgetId || isMobileView) {
        if(isMobileView) alert("Adding new widgets is disabled in mobile full-portfolio view.");
        return;
    }
    const blueprint = AVAILABLE_WIDGET_DEFINITIONS.find(def => def.type === widgetType);
    if (!blueprint) { alert(`Widget type "${widgetType}" is not available.`); setIsAddWidgetMenuOpen(false); setIsAddWidgetContextMenuOpen(false); return; }

    if (widgetContainerCols === 0 || widgetContainerRows === 0) {
      alert("Grid not fully initialized. Please wait a moment and try again.");
      setIsAddWidgetMenuOpen(false); setIsAddWidgetContextMenuOpen(false);
      return;
    }
    const newWidgetConfig = processWidgetConfig({
        id: `${blueprint.type}-${Date.now()}`,
        type: blueprint.type,
    }, cellSize);


    let finalLayout: PageWidgetConfig[] | null = null;
    const currentWidgetsCopy = widgets.map(w => ({...w}));

    const initialPosition = findNextAvailablePosition(newWidgetConfig.colSpan, newWidgetConfig.rowSpan, currentWidgetsCopy);

    if (initialPosition) {
        const widgetWithPosition = {
            ...newWidgetConfig,
            colStart: initialPosition.colStart,
            rowStart: initialPosition.rowStart
        };
        finalLayout = [...currentWidgetsCopy, widgetWithPosition];
    } else {
        finalLayout = performAutoSort([...currentWidgetsCopy, { ...newWidgetConfig }]);
        if (!finalLayout) {
            finalLayout = attemptPlaceWidgetWithShrinking(currentWidgetsCopy, { ...newWidgetConfig });
        }
    }

    if (finalLayout) {
      setWidgets(finalLayout);
      updateWidgetsAndPushToHistory(finalLayout, `add_widget_${widgetType}`);
      const addedWidgetInLayout = finalLayout.find(w => w.id === newWidgetConfig.id);
      if (addedWidgetInLayout) setActiveWidgetId(addedWidgetInLayout.id);
      else setActiveWidgetId(null);
    } else {
      alert("No available space to add this widget, even after attempting to sort and shrink. Please make more room manually or try a smaller widget.");
    }
    setIsAddWidgetMenuOpen(false);
    setIsAddWidgetContextMenuOpen(false);
  }, [maximizedWidgetId, widgetContainerCols, widgetContainerRows, widgets, cellSize, findNextAvailablePosition, performAutoSort, attemptPlaceWidgetWithShrinking, updateWidgetsAndPushToHistory, isMobileView]);

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
        setWidgets(finalLayout);
        updateWidgetsAndPushToHistory(finalLayout, `apply_preset_${presetKey}_to_${widgetId}`);
        setActiveWidgetId(widgetId);
        setIsContainerSettingsModalOpen(false);
    } else {
        alert(`Could not apply size preset "${presetKey}". There isn't enough space, even after trying to rearrange. Please try a different preset or make more room manually.`);
    }
  }, [widgets, maximizedWidgetId, cellSize, findNextAvailablePosition, performAutoSort, updateWidgetsAndPushToHistory, canPlaceWidget, isMobileView]);

  const performAutoSortWithGivenGrid = useCallback((widgetsToSort: PageWidgetConfig[], newCols: number, newRows: number): PageWidgetConfig[] | null => {
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
                const canPlaceCustom = (
                    wtp: PageWidgetConfig, tC: number, tR: number, cL: PageWidgetConfig[], cols: number, rows: number
                ): boolean => {
                    if (cols === 0 || rows === 0) return false;
                    if (tC < 1 || tR < 1 || tC + wtp.colSpan - 1 > cols || tR + wtp.rowSpan - 1 > rows) return false;
                    for (const ew of cL) { if (ew.id === wtp.id) continue; if (doRectanglesOverlap(tC, tR, wtp.colSpan, wtp.rowSpan, ew.colStart, ew.rowStart, ew.colSpan, ew.rowSpan)) return false; }
                    return true;
                };

                if (canPlaceCustom(checkWidget, c, r, newLayout, newCols, newRows)) {
                    newLayout.push({ ...widget, colStart: c, rowStart: r });
                    placed = true;
                    break;
                }
            }
            if (placed) break;
        }
        if (!placed) {
             console.warn(`[performAutoSortWithGivenGrid] Could not place widget: ${widget.id}`);
            return null;
        }
    }
    return newLayout;
  }, [doRectanglesOverlap]);


  const handleChangeCellSize = useCallback((newCellSize: number) => {
    if (newCellSize === cellSize || maximizedWidgetId) return;

    const oldCellSize = cellSize;
    console.log(`[Grid Density] Changing from ${oldCellSize}px to ${newCellSize}px`);

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
            const tempNewCols = Math.floor(window.innerWidth / newCellSize);
            const tempNewRows = Math.floor((window.innerHeight - (headerRef.current?.offsetHeight || 60)) / newCellSize);
            newColSpan = tempNewCols;
            newRowSpan = tempNewRows > 1 ? tempNewRows -1 : 1;
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

    setCellSize(newCellSize);

    const tempNewCols = Math.floor(window.innerWidth / newCellSize);
    const tempNewRows = Math.floor((window.innerHeight - (headerRef.current?.offsetHeight || 60)) / newCellSize);

    const sortedLayout = performAutoSortWithGivenGrid(scaledWidgets, tempNewCols, tempNewRows);

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
    setIsDensityMenuOpen(false);

  }, [cellSize, widgets, maximizedWidgetId, updateWidgetsAndPushToHistory, performAutoSortWithGivenGrid, isMobileView]);


  const handleWidgetResizeLive = (id: string, newGeometry: WidgetResizeDataType) => { if (isPerformingUndoRedo.current || maximizedWidgetId || isMobileView) return; setWidgets(currentWidgets => currentWidgets.map(w => w.id === id ? { ...w, ...newGeometry, isMinimized: false } : w)); };
  const handleWidgetResizeEnd = (id: string, finalGeometry: WidgetResizeDataType) => { if (maximizedWidgetId || isMobileView) return; setWidgets(currentWidgets => { const updatedWidgets = currentWidgets.map(w => w.id === id ? { ...w, ...finalGeometry, isMinimized: false, originalRowSpan: undefined } : w); updateWidgetsAndPushToHistory(updatedWidgets, `resize_end_${id}`); return updatedWidgets; }); setActiveWidgetId(id); };
  const handleWidgetMove = (id: string, newPosition: WidgetMoveDataType) => { if (maximizedWidgetId || isMobileView) return; const currentWidget = widgets.find(w => w.id === id); if (!currentWidget) return; if (currentWidget.colStart !== newPosition.colStart || currentWidget.rowStart !== newPosition.rowStart) { setWidgets(currentWidgets => { const updatedWidgets = currentWidgets.map(w => w.id === id ? { ...w, ...newPosition } : w); updateWidgetsAndPushToHistory(updatedWidgets, `move_${id}`); return updatedWidgets; }); } setActiveWidgetId(id); };
  const handleWidgetDelete = (idToDelete: string) => { if (isMobileView) return; if (maximizedWidgetId === idToDelete) { setMaximizedWidgetId(null); setMaximizedWidgetOriginalState(null); } setWidgets(currentWidgets => { const updatedWidgets = currentWidgets.filter(widget => widget.id !== idToDelete); updateWidgetsAndPushToHistory(updatedWidgets, `delete_${idToDelete}`); return updatedWidgets; }); if (activeWidgetId === idToDelete) setActiveWidgetId(null); };
  const handleWidgetFocus = (id: string) => { if (maximizedWidgetId && maximizedWidgetId !== id) return; setActiveWidgetId(id); };
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
    for (const widget of widgets) {
        if (target.closest(`#${CSS.escape(widget.id)}`)) {
            clickedOnWidgetOrInteractiveContent = true;
            break;
        }
    }
    if (target.closest('button, a, input, select, textarea, [role="button"], [role="link"], [contenteditable="true"]')) {
        if (target !== dashboardAreaRef.current && target.id !== 'widget-grid-container' && !target.closest('.grid-background-svg')) {
            clickedOnWidgetOrInteractiveContent = true;
        }
    }

    if (clickedOnWidgetOrInteractiveContent) { return; }

    if ( target === dashboardAreaRef.current || target.id === 'widget-grid-container' || target.closest('.grid-background-svg') ) {
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
      default: return <p className="text-xs text-secondary italic">Generic widget content.</p>;
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
      default: return <p className="text-sm text-secondary">No specific content settings available for this widget type.</p>;
    }
  };

  // MODIFIED: Loading condition uses isLayoutEngineReady
  if (!isLayoutEngineReady || widgetContainerCols === 0 || widgetContainerRows === 0) {
    return <div className="w-full h-screen bg-page-background flex items-center justify-center text-page-foreground">Loading Dashboard...</div>;
  }

  return (
    <main className="w-full h-screen bg-page-background text-page-foreground overflow-hidden relative flex flex-col"
      onClick={(e) => {
        if (e.target === e.currentTarget && !maximizedWidgetId && !isAddWidgetContextMenuOpen) {
            setActiveWidgetId(null);
        }
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
                {isAddWidgetMenuOpen && ( <div className="absolute backdrop-blur-md left-0 mt-2 w-56 origin-top-left rounded-md bg-dark-surface border border-dark-border-interactive shadow-xl py-1 z-50 focus:outline-none animate-modalFadeInScale" role="menu" aria-orientation="vertical" aria-labelledby="add-widget-button" > {AVAILABLE_WIDGET_DEFINITIONS.map(widgetDef => ( <button key={widgetDef.type} onClick={() => handleAddNewWidget(widgetDef.type)} className="group flex items-center w-full text-left px-3 py-2.5 text-sm text-dark-text-primary hover:bg-dark-accent-primary hover:text-dark-text-on-accent focus:bg-dark-accent-primary focus:text-dark-text-on-accent focus:outline-none transition-all duration-150 ease-in-out hover:pl-4" role="menuitem" disabled={!!maximizedWidgetId} > {widgetDef.icon && <widgetDef.icon />} <span className="flex-grow">{widgetDef.displayName || widgetDef.defaultTitle.replace("New ", "")}</span> </button> ))} </div> )}
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
        <div className="text-xs text-secondary px-2 sm:px-3 py-1 bg-slate-700 rounded-md">
            {isMobileView ? "Mobile View" : `History: ${historyDisplay.pointer}/${historyDisplay.length}`}
        </div>
      </header>

      {maximizedWidgetId && !isMobileView && ( <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[45]" onClick={() => maximizedWidgetId && handleWidgetMaximizeToggle(maximizedWidgetId)} /> )}

      <div ref={dashboardAreaRef} className={`flex-grow relative ${maximizedWidgetId && !isMobileView ? 'pointer-events-none' : ''}`}>
        <GridBackground cellSize={cellSize} />
        <div
            id="widget-grid-container"
            className="absolute inset-0 grid gap-0"
            style={{
                gridTemplateColumns: `repeat(${widgetContainerCols}, ${cellSize}px)`,
                gridTemplateRows: `repeat(${widgetContainerRows}, ${cellSize}px)`,
                alignContent: 'start'
            }}
        >
          {widgets.map((widgetConfig) => {
            if (maximizedWidgetId && maximizedWidgetId !== widgetConfig.id && !isMobileView) return null;

            const currentWidgetState = maximizedWidgetId === widgetConfig.id && maximizedWidgetOriginalState && !isMobileView
                ? { 
                    ...maximizedWidgetOriginalState,
                    colStart: 1,
                    rowStart: 1,
                    colSpan: widgetContainerCols > 2 ? widgetContainerCols - 1 : widgetContainerCols,
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
                onDelete={handleWidgetDelete} onFocus={handleWidgetFocus}
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
        headerHeight={headerRef.current?.offsetHeight}
      />}
    </main>
  );
}

const styles = ` .control-button { display:flex; align-items:center; justify-content:center; padding:0.5rem; background-color:var(--dark-accent-primary); border-radius:0.375rem; color:var(--dark-text-on-accent); transition:background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out; box-shadow:0 1px 2px 0 rgba(0,0,0,0.05); } .control-button:hover { background-color:var(--dark-accent-primary-hover); box-shadow:0 2px 4px 0 rgba(0,0,0,0.1); } .control-button:disabled { background-color:hsl(222,47%,25%); color:hsl(215,20%,55%); cursor:not-allowed; box-shadow:none; } .control-button:focus-visible { outline:2px solid var(--dark-accent-primary-hover); outline-offset:2px; } `;
if (typeof window !== 'undefined') { if (!document.getElementById('custom-dashboard-styles')) { const styleSheet = document.createElement("style"); styleSheet.id = 'custom-dashboard-styles'; styleSheet.type = "text/css"; styleSheet.innerText = styles; document.head.appendChild(styleSheet); }}
