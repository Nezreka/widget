// src/app/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Widget, {
  type WidgetResizeDataType,
  type WidgetMoveDataType,
  type WidgetContainerSettings,
} from "@/components/Widget";
import GridBackground from "@/components/GridBackground";
import SettingsModal from "@/components/SettingsModal";
import WidgetContainerSettingsModal from "@/components/WidgetContainerSettingsModal";
import AiCommandBar from "@/components/AiCommandBar"; // Import the new AiCommandBar component

// Import Widget-specific components and types
import WeatherWidget, {
  WeatherSettingsPanel,
  type WeatherWidgetSettings,
} from "@/components/WeatherWidget";
import ClockWidget, {
  ClockSettingsPanel,
  type ClockWidgetSettings,
} from "@/components/ClockWidget";
import CalculatorWidget, {
  CalculatorSettingsPanel,
  type CalculatorWidgetSettings,
} from "@/components/CalculatorWidget";
import YoutubeWidget, {
  YoutubeSettingsPanel,
  type YoutubeWidgetSettings,
} from "@/components/YoutubeWidget";
import NotesWidget, {
  NotesSettingsPanel,
  type Note,
} from "@/components/NotesWidget";
import TodoWidget, {
  TodoSettingsPanel,
  type TodoWidgetSettings,
  type TodoItem,
} from "@/components/TodoWidget";
import MinesweeperWidget, {
  MinesweeperSettingsPanel,
  type MinesweeperWidgetSettings,
} from "@/components/MinesweeperWidget";
import UnitConverterWidget, {
  UnitConverterSettingsPanel,
  type UnitConverterWidgetSettings,
} from "@/components/UnitConverterWidget";
import CountdownStopwatchWidget, {
  CountdownStopwatchSettingsPanel,
  type CountdownStopwatchWidgetSettings,
} from "@/components/CountdownStopwatchWidget";
import PhotoWidget, {
  PhotoSettingsPanel,
  type PhotoWidgetSettings,
  type HistoricImage,
} from "@/components/PhotoWidget";
import PortfolioWidget, {
  PortfolioSettingsPanel,
  type PortfolioWidgetSettings,
} from "@/components/PortfolioWidget";
import GeminiChatWidget, {
  GeminiChatSettingsPanel,
  type GeminiChatWidgetSettings,
} from "@/components/GeminiChatWidget";
import GoogleServicesHubWidget, {
  GoogleServicesHubSettingsPanel,
  type GoogleServicesHubWidgetSettings,
  type GoogleServiceActionKey,
} from "@/components/GoogleServicesHubWidget";
import GoogleCalendarWidget, {
  GoogleCalendarSettingsPanel,
  type GoogleCalendarWidgetSettings,
} from "@/components/GoogleCalendarWidget";
import GoogleMapsWidget, {
  GoogleMapsSettingsPanel,
} from "@/components/GoogleMapsWidget";
import NewsWidget, {
  NewsSettingsPanel,
  type NewsWidgetSettings,
} from "@/components/NewsWidget";

import AddWidgetContextMenu, {
  mapBlueprintToContextMenuItem,
  type WidgetBlueprintContextMenuItem,
} from "@/components/AddWidgetContextMenu";

import {
  UndoIcon,
  RedoIcon,
  ExportIcon,
  ImportIcon,
  AddIcon,
  AutoSortIcon,
  DensityIcon,
  AiIcon,
} from "@/components/Icons";

import {
  DEFAULT_CELL_SIZE,
  WIDGET_SIZE_PRESETS,
  AVAILABLE_WIDGET_DEFINITIONS,
  PHOTO_WIDGET_DEFAULT_INSTANCE_SETTINGS,
  PORTFOLIO_WIDGET_DEFAULT_INSTANCE_SETTINGS,
  GEMINI_CHAT_WIDGET_DEFAULT_INSTANCE_SETTINGS,
  GOOGLE_SERVICES_HUB_DEFAULT_INSTANCE_SETTINGS,
  GOOGLE_CALENDAR_DEFAULT_INSTANCE_SETTINGS,
  GOOGLE_MAPS_DEFAULT_INSTANCE_SETTINGS,
  NEWS_WIDGET_DEFAULT_INSTANCE_SETTINGS,
  type WidgetSizePresetKey,
  type AllWidgetSettings,
  type WidgetType,
  type PageWidgetConfig,
  type PageInstanceNotesSettings,
  type GoogleMapsWidgetSettings,
} from "@/definitions/widgetConfig";

import {
  type ParsedAiCommand,
  // AI_COMMAND_SCHEMA is used by AiCommandBar
  // getBaseGeminiSystemPrompt is used by AiCommandBar
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

  type OpenOrFocusWidgetAiCommand,
  type TargetWidgetAiCommand,
  type BaseAiCommand,

} from "@/definitions/aiCommands";

// SpeechRecognition types are now used by AiCommandBar

// --- Page-Specific Constants ---
const CELL_SIZE_OPTIONS = [
  { label: "Micro", value: 10 },
  { label: "Compact", value: 20 },
  { label: "Default", value: DEFAULT_CELL_SIZE },
  { label: "Spacious", value: 40 },
  { label: "Large", value: 50 },
];

const MAX_HISTORY_LENGTH = 50;
const MINIMIZED_WIDGET_ROW_SPAN = 2;
const DASHBOARD_LAYOUT_STORAGE_KEY = "dashboardLayoutV3.23_AI_GoogleHub_Scroll";
const GLOBAL_NOTES_STORAGE_KEY = "dashboardGlobalNotesCollection_v1";
const GLOBAL_TODOS_STORAGE_KEY = "dashboardGlobalSingleTodoList_v1";
const GLOBAL_PHOTO_HISTORY_STORAGE_KEY = "dashboardGlobalPhotoHistory_v1";
const DATA_SAVE_DEBOUNCE_MS = 700;
const WIDGET_DESELECT_TIMEOUT_MS = 3000;
const MOBILE_BREAKPOINT_PX = 768;
const SMOOTH_SCROLL_DURATION_MS = 1000;

const DEFAULT_WIDGET_CONTAINER_SETTINGS: WidgetContainerSettings = {
  alwaysShowTitleBar: false,
  innerPadding: "px-3.5 py-3",
};

interface NotesCollectionStorage {
  notes: Note[];
  activeNoteId: string | null;
}

const initialDesktopWidgetsLayout: Omit<
  PageWidgetConfig,
  "colSpan" | "rowSpan" | "minColSpan" | "minRowSpan"
>[] = [
  {
    id: "portfolio-main",
    title: "Broque Thomas - Portfolio",
    type: "portfolio",
    colStart: 1,
    rowStart: 1,
    settings: PORTFOLIO_WIDGET_DEFAULT_INSTANCE_SETTINGS,
    isMinimized: false,
    containerSettings: {
      ...DEFAULT_WIDGET_CONTAINER_SETTINGS,
      innerPadding: "px-3.5 py-3",
    },
  },
];

const initialMobileWidgetLayout: Omit<
  PageWidgetConfig,
  "colSpan" | "rowSpan" | "minColSpan" | "minRowSpan"
>[] = [
  {
    id: "portfolio-main",
    title: "Broque Thomas - Portfolio",
    type: "portfolio",
    colStart: 1,
    rowStart: 1,
    settings: PORTFOLIO_WIDGET_DEFAULT_INSTANCE_SETTINGS,
    isMinimized: false,
    containerSettings: {
      ...DEFAULT_WIDGET_CONTAINER_SETTINGS,
      innerPadding: "p-0",
    },
  },
];

const ensurePhotoWidgetInstanceSettings = (
  settings: AllWidgetSettings | undefined
): PhotoWidgetSettings => {
  const photoInstanceDefaults = PHOTO_WIDGET_DEFAULT_INSTANCE_SETTINGS;
  const currentPhotoSettings = settings as PhotoWidgetSettings | undefined;
  return {
    imageUrl: currentPhotoSettings?.imageUrl || photoInstanceDefaults.imageUrl,
    imageName:
      currentPhotoSettings?.imageName || photoInstanceDefaults.imageName,
    objectFit:
      currentPhotoSettings?.objectFit || photoInstanceDefaults.objectFit,
    isSidebarOpen:
      typeof currentPhotoSettings?.isSidebarOpen === "boolean"
        ? currentPhotoSettings.isSidebarOpen
        : photoInstanceDefaults.isSidebarOpen,
    isSlideshowActive:
      currentPhotoSettings?.isSlideshowActive ||
      photoInstanceDefaults.isSlideshowActive,
    slideshowMode:
      currentPhotoSettings?.slideshowMode ||
      photoInstanceDefaults.slideshowMode,
    slideshowInterval:
      currentPhotoSettings?.slideshowInterval ||
      photoInstanceDefaults.slideshowInterval,
    slideshowKeyword:
      currentPhotoSettings?.slideshowKeyword ||
      photoInstanceDefaults.slideshowKeyword,
    slideshowProvider:
      currentPhotoSettings?.slideshowProvider ||
      photoInstanceDefaults.slideshowProvider,
    slideshowTransitionEffect:
      currentPhotoSettings?.slideshowTransitionEffect ||
      photoInstanceDefaults.slideshowTransitionEffect,
  };
};
const ensurePortfolioWidgetInstanceSettings = (
  settings: AllWidgetSettings | undefined
): PortfolioWidgetSettings => {
  const portfolioInstanceDefaults = PORTFOLIO_WIDGET_DEFAULT_INSTANCE_SETTINGS;
  const currentPortfolioSettings = settings as
    | PortfolioWidgetSettings
    | undefined;
  return {
    accentColor:
      currentPortfolioSettings?.accentColor ||
      portfolioInstanceDefaults.accentColor,
    showAnimatedBackground:
      typeof currentPortfolioSettings?.showAnimatedBackground === "boolean"
        ? currentPortfolioSettings.showAnimatedBackground
        : portfolioInstanceDefaults.showAnimatedBackground,
  };
};
const ensureGeminiChatWidgetInstanceSettings = (
  settings: AllWidgetSettings | undefined
): GeminiChatWidgetSettings => {
  const geminiChatInstanceDefaults =
    GEMINI_CHAT_WIDGET_DEFAULT_INSTANCE_SETTINGS;
  const currentGeminiChatSettings = settings as
    | GeminiChatWidgetSettings
    | undefined;
  return {
    customSystemPrompt:
      currentGeminiChatSettings?.customSystemPrompt ||
      geminiChatInstanceDefaults.customSystemPrompt,
  };
};
const ensureGoogleServicesHubInstanceSettings = (
  settings: AllWidgetSettings | undefined
): GoogleServicesHubWidgetSettings => {
  const hubInstanceDefaults = GOOGLE_SERVICES_HUB_DEFAULT_INSTANCE_SETTINGS;
  const currentHubSettings = settings as
    | GoogleServicesHubWidgetSettings
    | undefined;
  return {
    animationSpeed:
      currentHubSettings?.animationSpeed || hubInstanceDefaults.animationSpeed,
    iconSize: currentHubSettings?.iconSize || hubInstanceDefaults.iconSize,
    menuRadius: currentHubSettings?.menuRadius,
  };
};

const ensureGoogleCalendarInstanceSettings = (
  settings: AllWidgetSettings | undefined
): GoogleCalendarWidgetSettings => {
  const calendarInstanceDefaults = GOOGLE_CALENDAR_DEFAULT_INSTANCE_SETTINGS;
  const currentCalendarSettings = settings as
    | GoogleCalendarWidgetSettings
    | undefined;
  return {
    viewMode:
      currentCalendarSettings?.viewMode || calendarInstanceDefaults.viewMode,
    showWeekends:
      typeof currentCalendarSettings?.showWeekends === "boolean"
        ? currentCalendarSettings.showWeekends
        : calendarInstanceDefaults.showWeekends,
    calendarId:
      currentCalendarSettings?.calendarId ||
      calendarInstanceDefaults.calendarId,
  };
};

const ensureGoogleMapsInstanceSettings = (
  settings: AllWidgetSettings | undefined
): GoogleMapsWidgetSettings => {
  const mapsInstanceDefaults = GOOGLE_MAPS_DEFAULT_INSTANCE_SETTINGS;
  const currentMapsSettings = settings as GoogleMapsWidgetSettings | undefined;
  return {
    defaultLocation:
      currentMapsSettings?.defaultLocation ||
      mapsInstanceDefaults.defaultLocation,
    zoomLevel: currentMapsSettings?.zoomLevel || mapsInstanceDefaults.zoomLevel,
    mapType: currentMapsSettings?.mapType || mapsInstanceDefaults.mapType,
    showTraffic:
      typeof currentMapsSettings?.showTraffic === "boolean"
        ? currentMapsSettings.showTraffic
        : mapsInstanceDefaults.showTraffic,
  };
};

const ensureNewsWidgetInstanceSettings = (
  settings: AllWidgetSettings | undefined
): NewsWidgetSettings => {
  const newsInstanceDefaults = NEWS_WIDGET_DEFAULT_INSTANCE_SETTINGS;
  const currentNewsSettings = settings as NewsWidgetSettings | undefined;
  return {
    ...newsInstanceDefaults,
    ...currentNewsSettings,
  };
};

const processWidgetConfig = (
  widgetData: Partial<PageWidgetConfig>,
  currentCellSize: number,
  isMobileTarget?: boolean,
  containerColsForMobile?: number,
  containerRowsForMobile?: number
): PageWidgetConfig => {
  const blueprint = AVAILABLE_WIDGET_DEFINITIONS.find(
    (def) => def.type === widgetData.type
  );

  if (!blueprint) {
    const defaultPresetFallback = WIDGET_SIZE_PRESETS.small_square;
    return {
      id: widgetData.id || `generic-${Date.now()}`,
      title: widgetData.title || "Untitled Widget",
      type: widgetData.type || "generic",
      colStart: widgetData.colStart || 1,
      rowStart: widgetData.rowStart || 1,
      colSpan:
        widgetData.colSpan ||
        Math.max(
          1,
          Math.round(defaultPresetFallback.targetWidthPx / currentCellSize)
        ),
      rowSpan:
        widgetData.rowSpan ||
        Math.max(
          1,
          Math.round(defaultPresetFallback.targetHeightPx / currentCellSize)
        ),
      minColSpan: widgetData.minColSpan || 3,
      minRowSpan: widgetData.minRowSpan || 3,
      isMinimized: widgetData.isMinimized || false,
      settings: widgetData.settings || {},
      containerSettings: {
        ...DEFAULT_WIDGET_CONTAINER_SETTINGS,
        ...(widgetData.containerSettings || {}),
      },
      originalRowSpan: widgetData.originalRowSpan,
    };
  }

  let colSpan, rowSpan;
  const finalContainerSettings: WidgetContainerSettings = {
    ...DEFAULT_WIDGET_CONTAINER_SETTINGS,
    ...(widgetData.containerSettings || {}),
  };

  if (
    isMobileTarget &&
    widgetData.type === "portfolio" &&
    containerColsForMobile &&
    containerRowsForMobile
  ) {
    colSpan = Math.max(blueprint.minColSpan, containerColsForMobile);
    rowSpan = Math.max(blueprint.minRowSpan, containerRowsForMobile);
    finalContainerSettings.innerPadding = "p-0";
  } else if (
    widgetData.colSpan !== undefined &&
    widgetData.rowSpan !== undefined
  ) {
    colSpan = widgetData.colSpan;
    rowSpan = widgetData.rowSpan;
  } else {
    const presetSizeTargets = WIDGET_SIZE_PRESETS[blueprint.defaultSizePreset];
    colSpan = Math.max(
      blueprint.minColSpan,
      Math.max(1, Math.round(presetSizeTargets.targetWidthPx / currentCellSize))
    );
    rowSpan = Math.max(
      blueprint.minRowSpan,
      Math.max(
        1,
        Math.round(presetSizeTargets.targetHeightPx / currentCellSize)
      )
    );
  }

  let finalContentSettings = {
    ...(blueprint.defaultSettings || {}),
    ...(widgetData.settings || {}),
  };

  if (widgetData.type === "photo")
    finalContentSettings = ensurePhotoWidgetInstanceSettings(
      finalContentSettings as PhotoWidgetSettings
    );
  else if (widgetData.type === "portfolio")
    finalContentSettings = ensurePortfolioWidgetInstanceSettings(
      finalContentSettings as PortfolioWidgetSettings
    );
  else if (widgetData.type === "geminiChat")
    finalContentSettings = ensureGeminiChatWidgetInstanceSettings(
      finalContentSettings as GeminiChatWidgetSettings
    );
  else if (widgetData.type === "googleServicesHub") {
    finalContentSettings = ensureGoogleServicesHubInstanceSettings(
      finalContentSettings as GoogleServicesHubWidgetSettings
    );
    finalContainerSettings.innerPadding = "p-0";
  } else if (widgetData.type === "googleCalendar") {
    finalContentSettings = ensureGoogleCalendarInstanceSettings(
      finalContentSettings as GoogleCalendarWidgetSettings
    );
  } else if (widgetData.type === "googleMaps") {
    finalContentSettings = ensureGoogleMapsInstanceSettings(
      finalContentSettings as GoogleMapsWidgetSettings
    );
  } else if (widgetData.type === "news") {
    finalContentSettings = ensureNewsWidgetInstanceSettings(
      finalContentSettings as NewsWidgetSettings
    );
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
  actualGridPixelWidth?: number;
}

// getGeminiSystemPrompt is now in AiCommandBar.tsx

const smoothScrollTo = (
  element: HTMLElement,
  to: number,
  duration: number,
  axis: "left" | "top"
) => {
  const start = axis === "left" ? element.scrollLeft : element.scrollTop;
  const change = to - start;
  const startTime = performance.now();

  const animateScroll = (currentTime: number) => {
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / duration, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic

    if (axis === "left") {
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
  const [actualGridPixelWidth, setActualGridPixelWidth] = useState(0);

  const initialLayoutIsDefaultRef = useRef(false);
  const initialCenteringDoneRef = useRef(false);
  const [widgets, setWidgets] = useState<PageWidgetConfig[]>([]);
  const [isLayoutEngineReady, setIsLayoutEngineReady] = useState(false);

  // AI Command Bar states are now managed by AiCommandBar.tsx
  const [showAiCommandBar, setShowAiCommandBar] = useState(false);
  // aiInputValue, aiIsListening, aiIsProcessing, aiLastFeedback, aiError, speechRecognitionRef are removed.

  useEffect(() => {
    const checkMobile = () => {
      const newIsMobileView = window.innerWidth < MOBILE_BREAKPOINT_PX;
      setIsMobileView((prevIsMobileView) => {
        if (newIsMobileView !== prevIsMobileView) {
          return newIsMobileView;
        }
        return prevIsMobileView;
      });
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [setIsMobileView]);

  useEffect(() => {
    let loadedCellSize = DEFAULT_CELL_SIZE;
    let loadedWidgetsConfig: Partial<PageWidgetConfig>[] | null = null;
    let wasMobileLayoutSaved = false;
    let loadedGridPixelWidth: number | undefined = undefined;

    if (typeof window !== "undefined") {
      const savedLayoutJSON = window.localStorage.getItem(
        DASHBOARD_LAYOUT_STORAGE_KEY
      );
      if (savedLayoutJSON) {
        try {
          const savedData = JSON.parse(
            savedLayoutJSON
          ) as StoredDashboardLayout;
          if (
            savedData &&
            typeof savedData === "object" &&
            !Array.isArray(savedData) &&
            savedData.dashboardVersion
          ) {
            const loadedVersion = String(savedData.dashboardVersion).replace(
              "v",
              "V"
            );
            const currentVersion = DASHBOARD_LAYOUT_STORAGE_KEY.replace(
              "dashboardLayoutV",
              "V"
            );

            if (loadedVersion === currentVersion) {
              if (typeof savedData.cellSize === "number") {
                const validOption = CELL_SIZE_OPTIONS.find(
                  (opt) => opt.value === savedData.cellSize
                );
                if (validOption) loadedCellSize = validOption.value;
              }
              wasMobileLayoutSaved = savedData.isMobileLayout || false;
              loadedGridPixelWidth = savedData.actualGridPixelWidth;

              if (Array.isArray(savedData.widgets)) {
                loadedWidgetsConfig = savedData.widgets;
              }
            } else {
              console.log(
                `[page.tsx] Storage key version mismatch. Using new initial layout. Saved: ${loadedVersion}, Current: ${currentVersion}`
              );
            }
          } else {
            console.log(`[page.tsx] Invalid or legacy layout structure.`);
          }
        } catch (error) {
          console.error(
            "[page.tsx] Error loading/parsing dashboard layout from localStorage:",
            error
          );
        }
      }
    }

    setCellSize(loadedCellSize);

    if (isMobileView) {
      setActualGridPixelWidth(window.innerWidth);
      const mobileCols = Math.max(
        1,
        Math.floor(window.innerWidth / loadedCellSize)
      );
      const mobileRowsAvailable = Math.max(
        1,
        Math.floor(
          (window.innerHeight - (headerRef.current?.offsetHeight || 60)) /
            loadedCellSize
        )
      );
      const mobileTargetRows =
        mobileRowsAvailable > 1 ? mobileRowsAvailable - 1 : 1;

      const portfolioBlueprint = initialMobileWidgetLayout[0];
      let portfolioConfigToSet: Partial<PageWidgetConfig> = portfolioBlueprint;

      if (loadedWidgetsConfig && wasMobileLayoutSaved) {
        const savedPortfolio = loadedWidgetsConfig.find(
          (w) => w.type === "portfolio"
        );
        if (savedPortfolio) {
          portfolioConfigToSet = savedPortfolio;
        }
      }
      portfolioConfigToSet = {
        ...portfolioConfigToSet,
        colStart: 1,
        rowStart: 1,
      };

      setWidgets([
        processWidgetConfig(
          portfolioConfigToSet,
          loadedCellSize,
          true,
          mobileCols,
          mobileTargetRows
        ),
      ]);
      initialLayoutIsDefaultRef.current =
        !loadedWidgetsConfig || !wasMobileLayoutSaved;
    } else {
      setActualGridPixelWidth(loadedGridPixelWidth || window.innerWidth);
      if (loadedWidgetsConfig && !wasMobileLayoutSaved) {
        setWidgets(
          loadedWidgetsConfig.map((w) =>
            processWidgetConfig(w, loadedCellSize, false)
          )
        );
        initialLayoutIsDefaultRef.current = false;
      } else {
        setWidgets(
          initialDesktopWidgetsLayout.map((w) =>
            processWidgetConfig(w, loadedCellSize, false)
          )
        );
        initialLayoutIsDefaultRef.current = true;
      }
    }
    initialCenteringDoneRef.current = isMobileView;
    setIsLayoutEngineReady(true);
  }, [isMobileView]);

  const [sharedNotes, setSharedNotes] = useState<Note[]>([]);
  const [activeSharedNoteId, setActiveSharedNoteId] = useState<string | null>(
    null
  );
  const [sharedTodos, setSharedTodos] = useState<TodoItem[]>([]);
  const [sharedPhotoHistory, setSharedPhotoHistory] = useState<HistoricImage[]>(
    []
  );

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
  const gridWrapperRef = useRef<HTMLDivElement>(null);
  const densityMenuRef = useRef<HTMLDivElement>(null);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedWidgetForSettings, setSelectedWidgetForSettings] =
    useState<PageWidgetConfig | null>(null);

  const [isContainerSettingsModalOpen, setIsContainerSettingsModalOpen] =
    useState(false);
  const [
    selectedWidgetForContainerSettings,
    setSelectedWidgetForContainerSettings,
  ] = useState<PageWidgetConfig | null>(null);

  const [maximizedWidgetId, setMaximizedWidgetId] = useState<string | null>(
    null
  );
  const [maximizedWidgetOriginalState, setMaximizedWidgetOriginalState] =
    useState<PageWidgetConfig | null>(null);
  const [isAddWidgetMenuOpen, setIsAddWidgetMenuOpen] = useState(false);
  const addWidgetMenuRef = useRef<HTMLDivElement>(null);
  const [historyDisplay, setHistoryDisplay] = useState({
    pointer: 0,
    length: 0,
  });

  const [isAddWidgetContextMenuOpen, setIsAddWidgetContextMenuOpen] =
    useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [contextMenuAvailableWidgets, setContextMenuAvailableWidgets] =
    useState<WidgetBlueprintContextMenuItem[]>([]);
  const [isDensityMenuOpen, setIsDensityMenuOpen] = useState(false);

  const updateWidgetsAndPushToHistory = useCallback(
    (newWidgetsState: PageWidgetConfig[], actionType?: string) => {
      if (isPerformingUndoRedo.current && actionType !== "undo_redo_internal")
        return;
      const currentHistoryTop =
        historyPointer.current >= 0 &&
        historyPointer.current < history.current.length
          ? history.current[historyPointer.current]
          : null;
      if (
        currentHistoryTop &&
        JSON.stringify(currentHistoryTop) === JSON.stringify(newWidgetsState)
      )
        return;
      const newHistoryEntry = JSON.parse(JSON.stringify(newWidgetsState));
      const newHistoryBase = history.current.slice(
        0,
        historyPointer.current + 1
      );
      let finalHistory = [...newHistoryBase, newHistoryEntry];
      if (finalHistory.length > MAX_HISTORY_LENGTH) {
        finalHistory = finalHistory.slice(
          finalHistory.length - MAX_HISTORY_LENGTH
        );
      }
      history.current = finalHistory;
      historyPointer.current = finalHistory.length - 1;
      setHistoryDisplay({
        pointer: historyPointer.current + 1,
        length: history.current.length,
      });
    },
    []
  );

  useEffect(() => {
    if (
      isLayoutEngineReady &&
      widgets &&
      widgets.length >= 0 &&
      history.current.length === 0
    ) {
      history.current = [JSON.parse(JSON.stringify(widgets))];
      historyPointer.current = 0;
      setHistoryDisplay({
        pointer: historyPointer.current + 1,
        length: history.current.length,
      });
    }
  }, [widgets, isLayoutEngineReady]);

  useEffect(() => {
    if (typeof window !== "undefined" && isLayoutEngineReady) {
      try {
        const dataToSave: StoredDashboardLayout = {
          dashboardVersion: DASHBOARD_LAYOUT_STORAGE_KEY.replace(
            "dashboardLayoutV",
            "v"
          ),
          widgets: widgets,
          cellSize: cellSize,
          isMobileLayout: isMobileView,
          actualGridPixelWidth: actualGridPixelWidth,
        };
        window.localStorage.setItem(
          DASHBOARD_LAYOUT_STORAGE_KEY,
          JSON.stringify(dataToSave)
        );
      } catch (error) {
        console.error("Error saving dashboard layout to localStorage:", error);
      }
    }
  }, [
    widgets,
    cellSize,
    isMobileView,
    isLayoutEngineReady,
    actualGridPixelWidth,
  ]);

  useEffect(() => {
    if (
      widgetContainerCols > 0 &&
      initialLayoutIsDefaultRef.current &&
      !initialCenteringDoneRef.current &&
      widgets.length > 0 &&
      !isMobileView &&
      isLayoutEngineReady
    ) {
      const portfolioBlueprint = AVAILABLE_WIDGET_DEFINITIONS.find(
        (b) => b.type === "portfolio"
      );
      const geminiChatBlueprint = AVAILABLE_WIDGET_DEFINITIONS.find(
        (b) => b.type === "geminiChat"
      );
      const clockBlueprint = AVAILABLE_WIDGET_DEFINITIONS.find(
        (b) => b.type === "clock"
      );

      if (portfolioBlueprint && geminiChatBlueprint && clockBlueprint) {
        const portfolioPreset =
          WIDGET_SIZE_PRESETS[portfolioBlueprint.defaultSizePreset];
        const geminiPreset =
          WIDGET_SIZE_PRESETS[geminiChatBlueprint.defaultSizePreset];
        const clockPreset =
          WIDGET_SIZE_PRESETS[clockBlueprint.defaultSizePreset];

        const portfolioSpan = Math.max(
          portfolioBlueprint.minColSpan,
          Math.max(1, Math.round(portfolioPreset.targetWidthPx / cellSize))
        );
        const geminiChatSpan = Math.max(
          geminiChatBlueprint.minColSpan,
          Math.max(1, Math.round(geminiPreset.targetWidthPx / cellSize))
        );
        const clockSpan = Math.max(
          clockBlueprint.minColSpan,
          Math.max(1, Math.round(clockPreset.targetHeightPx / cellSize)) // Note: This was targetHeightPx, likely a typo, should be targetWidthPx for col span. Keeping as is from original.
        );

        const gap = 2;
        const totalBlockSpan =
          portfolioSpan + gap + geminiChatSpan + gap + clockSpan;
        let leftOffset = Math.floor((widgetContainerCols - totalBlockSpan) / 2);
        if (leftOffset < 1) leftOffset = 0;

        const newPortfolioColStart = Math.max(1, leftOffset + 1);
        const newGeminiChatColStart =
          newPortfolioColStart + portfolioSpan + gap;
        const newClockColStart = newGeminiChatColStart + geminiChatSpan + gap;

        if (newClockColStart + clockSpan - 1 <= widgetContainerCols) {
          setWidgets((currentWidgets) => {
            const updated = currentWidgets.map((w) => {
              if (w.id === "portfolio-main")
                return {
                  ...w,
                  colStart: newPortfolioColStart,
                  colSpan: portfolioSpan,
                };
              if (w.id === "gemini-chat-main") // Assuming an ID for gemini chat if it's part of initial layout
                return {
                  ...w,
                  colStart: newGeminiChatColStart,
                  colSpan: geminiChatSpan,
                };
              if (w.id === "clock-widget-main") // Assuming an ID for clock if it's part of initial layout
                return { ...w, colStart: newClockColStart, colSpan: clockSpan };
              return w;
            });
            updateWidgetsAndPushToHistory(
              updated,
              "initial_dynamic_center_layout"
            );
            return updated;
          });
          initialCenteringDoneRef.current = true;
          initialLayoutIsDefaultRef.current = false;
        } else {
          console.warn(
            "[page.tsx] Calculated dynamic centered layout would overflow. Widgets will start at column 1."
          );
          initialCenteringDoneRef.current = true;
          initialLayoutIsDefaultRef.current = false;
        }
      } else {
        console.warn(
          "[page.tsx] Could not find all blueprints for initial centering logic."
        );
        initialCenteringDoneRef.current = true;
        initialLayoutIsDefaultRef.current = false;
      }
    }
  }, [
    widgetContainerCols,
    updateWidgetsAndPushToHistory,
    widgets,
    cellSize,
    isMobileView,
    isLayoutEngineReady,
  ]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedNotesJSON = localStorage.getItem(GLOBAL_NOTES_STORAGE_KEY);
      let notesToSet: Note[] = [];
      let activeIdToSet: string | null = null;
      if (savedNotesJSON) {
        try {
          const nc: NotesCollectionStorage = JSON.parse(savedNotesJSON);
          notesToSet = nc.notes || [];
          activeIdToSet = nc.activeNoteId || null;
          if (activeIdToSet && !notesToSet.some((n) => n.id === activeIdToSet))
            activeIdToSet = null;
        } catch (e) {
          console.error("Err parse notes:", e);
        }
      }
      if (notesToSet.length === 0) {
        const dId = `note-${Date.now()}-default`;
        notesToSet = [
          {
            id: dId,
            title: "My First Note",
            content: "<p>Welcome!</p>",
            lastModified: Date.now(),
          },
        ];
        activeIdToSet = dId;
      } else if (!activeIdToSet && notesToSet.length > 0) {
        activeIdToSet = notesToSet.sort(
          (a, b) => b.lastModified - a.lastModified
        )[0].id;
      }
      setSharedNotes(notesToSet);
      setActiveSharedNoteId(activeIdToSet);
    }
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (notesSaveTimeoutRef.current)
        clearTimeout(notesSaveTimeoutRef.current);
      if (sharedNotes.length > 0 || activeSharedNoteId !== null) {
        notesSaveTimeoutRef.current = setTimeout(() => {
          try {
            const nc: NotesCollectionStorage = {
              notes: sharedNotes,
              activeNoteId: activeSharedNoteId,
            };
            localStorage.setItem(GLOBAL_NOTES_STORAGE_KEY, JSON.stringify(nc));
          } catch (e) {
            console.error("Err save notes:", e);
          }
        }, DATA_SAVE_DEBOUNCE_MS);
      } else if (localStorage.getItem(GLOBAL_NOTES_STORAGE_KEY)) {
        localStorage.setItem(
          GLOBAL_NOTES_STORAGE_KEY,
          JSON.stringify({ notes: [], activeNoteId: null })
        );
      }
      return () => {
        if (notesSaveTimeoutRef.current)
          clearTimeout(notesSaveTimeoutRef.current);
      };
    }
  }, [sharedNotes, activeSharedNoteId]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sT = localStorage.getItem(GLOBAL_TODOS_STORAGE_KEY);
      if (sT) {
        try {
          const lT = JSON.parse(sT) as TodoItem[];
          setSharedTodos(Array.isArray(lT) ? lT : []);
        } catch (e) {
          console.error("Err parse todos:", e);
          setSharedTodos([]);
        }
      } else {
        setSharedTodos([]);
      }
    }
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (todosSaveTimeoutRef.current)
        clearTimeout(todosSaveTimeoutRef.current);
      todosSaveTimeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem(
            GLOBAL_TODOS_STORAGE_KEY,
            JSON.stringify(sharedTodos)
          );
        } catch (e) {
          console.error("Err save todos:", e);
        }
      }, DATA_SAVE_DEBOUNCE_MS);
      return () => {
        if (todosSaveTimeoutRef.current)
          clearTimeout(todosSaveTimeoutRef.current);
      };
    }
  }, [sharedTodos]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sPH = localStorage.getItem(GLOBAL_PHOTO_HISTORY_STORAGE_KEY);
      if (sPH) {
        try {
          const lPH = JSON.parse(sPH) as HistoricImage[];
          setSharedPhotoHistory(Array.isArray(lPH) ? lPH : []);
        } catch (e) {
          console.error("Err parse photo hist:", e);
          setSharedPhotoHistory([]);
        }
      } else {
        setSharedPhotoHistory([]);
      }
    }
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (photoHistorySaveTimeoutRef.current)
        clearTimeout(photoHistorySaveTimeoutRef.current);
      photoHistorySaveTimeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem(
            GLOBAL_PHOTO_HISTORY_STORAGE_KEY,
            JSON.stringify(sharedPhotoHistory)
          );
        } catch (e) {
          console.error("Err save photo hist:", e);
        }
      }, DATA_SAVE_DEBOUNCE_MS);
      return () => {
        if (photoHistorySaveTimeoutRef.current)
          clearTimeout(photoHistorySaveTimeoutRef.current);
      };
    }
  }, [sharedPhotoHistory]);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        addWidgetMenuRef.current &&
        !addWidgetMenuRef.current.contains(e.target as Node)
      ) {
        setIsAddWidgetMenuOpen(false);
      }
      if (
        densityMenuRef.current &&
        !densityMenuRef.current.contains(e.target as Node)
      ) {
        setIsDensityMenuOpen(false);
      }
    };
    if (isAddWidgetMenuOpen || isDensityMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isAddWidgetMenuOpen, isDensityMenuOpen]);

  useEffect(() => {
    if (!isLayoutEngineReady) return;

    const determineSizesAndLayout = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const headerH = headerRef.current?.offsetHeight || 60;
      const aiBarH = showAiCommandBar
        ? document.getElementById("ai-command-bar")?.offsetHeight || 70 // Estimate if not rendered yet
        : 0;
      const contentH = screenHeight - headerH - aiBarH;

      let desiredGridPxWidth: number;
      let desiredCols: number;
      const desiredRows = Math.max(1, Math.floor(contentH / cellSize));

      if (isMobileView) {
        desiredGridPxWidth = screenWidth;
        desiredCols = Math.max(1, Math.floor(desiredGridPxWidth / cellSize));
        const targetMobileRows = desiredRows > 1 ? desiredRows - 1 : 1;

        const portfolioBlueprint = initialMobileWidgetLayout[0];
        const currentPortfolio = widgets.find((w) => w.type === "portfolio");

        const isCorrectMobileState =
          widgets.length === 1 &&
          currentPortfolio &&
          currentPortfolio.type === "portfolio" &&
          currentPortfolio.colSpan === desiredCols &&
          currentPortfolio.rowSpan === targetMobileRows &&
          currentPortfolio.colStart === 1 &&
          currentPortfolio.rowStart === 1;

        if (!isCorrectMobileState) {
          const mobilePortfolioConfig = processWidgetConfig(
            {
              id:
                currentPortfolio?.id ||
                portfolioBlueprint.id ||
                `${portfolioBlueprint.type}-${Date.now()}`,
              title: currentPortfolio?.title || portfolioBlueprint.title,
              type: portfolioBlueprint.type,
              settings:
                currentPortfolio?.settings || portfolioBlueprint.settings,
              colStart: 1,
              rowStart: 1,
            },
            cellSize,
            true,
            desiredCols,
            targetMobileRows
          );
          setWidgets([mobilePortfolioConfig]);
        }
      } else {
        let maxColOccupied = 0;
        widgets.forEach((w) => {
          maxColOccupied = Math.max(maxColOccupied, w.colStart + w.colSpan - 1);
        });
        const minRequiredPxWidthByWidgets = maxColOccupied * cellSize;
        desiredGridPxWidth = Math.max(screenWidth, minRequiredPxWidthByWidgets);
        desiredCols = Math.max(1, Math.floor(desiredGridPxWidth / cellSize));
      }

      if (actualGridPixelWidth !== desiredGridPxWidth) {
        setActualGridPixelWidth(desiredGridPxWidth);
      }
      if (widgetContainerCols !== desiredCols) {
        setWidgetContainerCols(desiredCols);
      }
      if (widgetContainerRows !== desiredRows) {
        setWidgetContainerRows(desiredRows);
      }
    };

    determineSizesAndLayout();
    window.addEventListener("resize", determineSizesAndLayout);
    return () => window.removeEventListener("resize", determineSizesAndLayout);
  }, [
    isMobileView,
    cellSize,
    showAiCommandBar, // Added dependency
    widgets,
    isLayoutEngineReady,
    actualGridPixelWidth,
    widgetContainerCols,
    widgetContainerRows,
  ]);

  useEffect(() => {
    setContextMenuAvailableWidgets(
      AVAILABLE_WIDGET_DEFINITIONS.map((blueprint) =>
        mapBlueprintToContextMenuItem(blueprint)
      )
    );
  }, []);

  const handleExportLayout = () => {
    if (typeof window === "undefined") return;
    try {
      const layoutToExport: StoredDashboardLayout = {
        dashboardVersion: DASHBOARD_LAYOUT_STORAGE_KEY.replace(
          "dashboardLayoutV",
          "v"
        ),
        widgets: widgets,
        cellSize: cellSize,
        notesCollection: {
          notes: sharedNotes,
          activeNoteId: activeSharedNoteId,
        },
        sharedGlobalTodos: sharedTodos,
        sharedGlobalPhotoHistory: sharedPhotoHistory,
        isMobileLayout: isMobileView,
        actualGridPixelWidth: actualGridPixelWidth,
      };
      const jsonString = JSON.stringify(layoutToExport, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = `dashboard-layout-${layoutToExport.dashboardVersion}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
    } catch (error) {
      console.error("Error exporting layout:", error);
      alert("Error exporting layout.");
    }
  };

  const doRectanglesOverlap = useCallback(
    (
      r1C: number,
      r1R: number,
      r1CS: number,
      r1RS: number,
      r2C: number,
      r2R: number,
      r2CS: number,
      r2RS: number,
      buffer: number = 0
    ): boolean => {
      const r1ColEnd = r1C + r1CS - 1;
      const r1RowEnd = r1R + r1RS - 1;

      const r2BufferedColStart = r2C - buffer;
      const r2BufferedRowStart = r2R - buffer;
      const r2BufferedColEnd = r2C + r2CS - 1 + buffer;
      const r2BufferedRowEnd = r2R + r2RS - 1 + buffer;

      const overlapX =
        r1C <= r2BufferedColEnd && r1ColEnd >= r2BufferedColStart;
      const overlapY =
        r1R <= r2BufferedRowEnd && r1RowEnd >= r2BufferedRowStart;

      return overlapX && overlapY;
    },
    []
  );

  const canPlaceWidget = useCallback(
    (
      widgetToPlace: PageWidgetConfig,
      targetCol: number,
      targetRow: number,
      currentLayout: PageWidgetConfig[],
      overrideTotalCols: number,
      overrideTotalRows: number
    ): boolean => {
      if (overrideTotalCols <= 0 || overrideTotalRows <= 0) return false;

      if (
        targetCol < 1 ||
        targetRow < 1 ||
        targetCol + widgetToPlace.colSpan - 1 > overrideTotalCols ||
        targetRow + widgetToPlace.rowSpan - 1 > overrideTotalRows
      ) {
        return false;
      }

      for (const existingWidget of currentLayout) {
        if (existingWidget.id === widgetToPlace.id) continue;
        if (
          doRectanglesOverlap(
            targetCol,
            targetRow,
            widgetToPlace.colSpan,
            widgetToPlace.rowSpan,
            existingWidget.colStart,
            existingWidget.rowStart,
            existingWidget.colSpan,
            existingWidget.rowSpan
          )
        ) {
          return false;
        }
      }
      return true;
    },
    [doRectanglesOverlap]
  );

  const performAutoSortAndExpandIfNeeded = useCallback(
    (
      widgetsToSort: PageWidgetConfig[],
      initialGridCols: number,
      initialGridRows: number
    ): {
      layout: PageWidgetConfig[];
      finalCols: number;
      finalRows: number;
    } | null => {
      if (widgetsToSort.length === 0) {
        return {
          layout: [],
          finalCols: initialGridCols,
          finalRows: initialGridRows,
        };
      }

      const sortedWidgets = [...widgetsToSort].sort((a, b) => {
        if (a.rowStart !== b.rowStart) return a.rowStart - b.rowStart;
        if (a.colStart !== b.colStart) return a.colStart - b.colStart;
        return a.id.localeCompare(b.id);
      });

      const newLayout: PageWidgetConfig[] = [];
      let effectiveGridCols = initialGridCols > 0 ? initialGridCols : 1;
      let effectiveGridRows = initialGridRows > 0 ? initialGridRows : 1;

      for (const widget of sortedWidgets) {
        let placed = false;
        const widgetToPlace = {
          ...widget,
          colSpan: Math.max(widget.colSpan, widget.minColSpan),
          rowSpan: Math.max(widget.rowSpan, widget.minRowSpan),
        };

        for (let r = 1; r <= effectiveGridRows + widgetToPlace.rowSpan; r++) {
          for (let c = 1; c <= effectiveGridCols + widgetToPlace.colSpan; c++) {
            const requiredColsForThisPlacement = c + widgetToPlace.colSpan - 1;
            const requiredRowsForThisPlacement = r + widgetToPlace.rowSpan - 1;

            const tempEffectiveCols = Math.max(
              effectiveGridCols,
              requiredColsForThisPlacement
            );
            const tempEffectiveRows = Math.max(
              effectiveGridRows,
              requiredRowsForThisPlacement
            );

            if (
              canPlaceWidget(
                widgetToPlace,
                c,
                r,
                newLayout,
                tempEffectiveCols,
                tempEffectiveRows
              )
            ) {
              newLayout.push({
                ...widget,
                colStart: c,
                rowStart: r,
                colSpan: widgetToPlace.colSpan,
                rowSpan: widgetToPlace.rowSpan,
              });
              effectiveGridCols = tempEffectiveCols;
              effectiveGridRows = tempEffectiveRows;
              placed = true;
              break;
            }
          }
          if (placed) break;
        }

        if (!placed) {
          console.warn(
            `[performAutoSortAndExpandIfNeeded] Could not place widget: ${widget.id} (span ${widgetToPlace.colSpan}x${widgetToPlace.rowSpan}). Final attempted grid: ${effectiveGridCols}x${effectiveGridRows}`
          );
          return null;
        }
      }
      return {
        layout: newLayout,
        finalCols: effectiveGridCols,
        finalRows: effectiveGridRows,
      };
    },
    [canPlaceWidget]
  );

  const handleImportLayout = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (typeof window === "undefined") return;
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== "string")
          throw new Error("Failed to read file content.");
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

        if (
          typeof parsedJson === "object" &&
          parsedJson !== null &&
          !Array.isArray(parsedJson) &&
          "dashboardVersion" in parsedJson &&
          "widgets" in parsedJson
        ) {
          const modernData = parsedJson as StoredDashboardLayout;
          importedIsMobileLayout = modernData.isMobileLayout || false;
          importedGridPixelWidth =
            modernData.actualGridPixelWidth || window.innerWidth;

          if (typeof modernData.cellSize === "number") {
            const validOption = CELL_SIZE_OPTIONS.find(
              (opt) => opt.value === modernData.cellSize
            );
            if (validOption) finalCellSize = validOption.value;
          }

          const targetScreenWidth = isMobileView
            ? window.innerWidth
            : importedGridPixelWidth;
          const tempCols = Math.max(
            1,
            Math.floor(targetScreenWidth / finalCellSize)
          );
          const tempRowsAvailable = Math.max(
            1,
            Math.floor(
              (window.innerHeight - (headerRef.current?.offsetHeight || 60)) /
                finalCellSize
            )
          );
          const tempMobileTargetRows =
            tempRowsAvailable > 1 ? tempRowsAvailable - 1 : 1;

          if (isMobileView) {
            alertMessage = `Imported layout. Adapting to mobile view. Global data imported.`;
            const portfolioBlueprint = initialMobileWidgetLayout[0];
            let portfolioDataToUse: Partial<PageWidgetConfig> =
              portfolioBlueprint;
            if (modernData.widgets && Array.isArray(modernData.widgets)) {
              const foundPortfolio = modernData.widgets.find(
                (w) => w.type === "portfolio"
              );
              if (foundPortfolio) portfolioDataToUse = foundPortfolio;
            }
            finalWidgetsToSet = [
              processWidgetConfig(
                portfolioDataToUse,
                finalCellSize,
                true,
                tempCols,
                tempMobileTargetRows
              ),
            ];
            importedGridPixelWidth = window.innerWidth;
          } else {
            if (importedIsMobileLayout) {
              alertMessage = `Imported mobile layout. Adapting to desktop view with default widgets. Global data imported.`;
              finalWidgetsToSet = initialDesktopWidgetsLayout.map((w) =>
                processWidgetConfig(w, finalCellSize, false)
              );
              importedGridPixelWidth = window.innerWidth;
            } else {
              const processedImportedWidgets = (modernData.widgets || []).map(
                (w) =>
                  processWidgetConfig(
                    w as Partial<PageWidgetConfig>,
                    finalCellSize,
                    false
                  )
              );
              const sortResult = performAutoSortAndExpandIfNeeded(
                processedImportedWidgets,
                tempCols,
                tempRowsAvailable
              );
              if (sortResult) {
                finalWidgetsToSet = sortResult.layout;
                importedGridPixelWidth = Math.max(
                  window.innerWidth,
                  sortResult.finalCols * finalCellSize
                );
                alertMessage = `Dashboard layout (version ${modernData.dashboardVersion}), settings, and global data imported successfully for desktop view! Grid adapted.`;
              } else {
                finalWidgetsToSet = processedImportedWidgets;
                alertMessage = `Dashboard layout (version ${modernData.dashboardVersion}) imported, but auto-sort failed. Manual adjustments may be needed.`;
              }
            }
          }

          if (modernData.notesCollection) {
            notesToSet = modernData.notesCollection.notes || [];
            activeNoteIdToSet = modernData.notesCollection.activeNoteId || null;
          }
          if (modernData.sharedGlobalTodos)
            todosToSet = modernData.sharedGlobalTodos;
          if (modernData.sharedGlobalPhotoHistory)
            photoHistoryToSet = modernData.sharedGlobalPhotoHistory;
        } else if (Array.isArray(parsedJson)) {
          alertMessage =
            "Dashboard layout (legacy format) imported. Adapting to current view. Global data and settings will use defaults or existing data.";
          const tempCurrentCellSize = cellSize;
          importedGridPixelWidth = window.innerWidth;

          const processedLegacy = (
            parsedJson as Partial<PageWidgetConfig>[]
          ).map((w) => processWidgetConfig(w, tempCurrentCellSize, false));

          if (isMobileView) {
            const mobileColsForSort = Math.max(
              1,
              Math.floor(importedGridPixelWidth / tempCurrentCellSize)
            );
            const mobileRowsAvailable = Math.max(
              1,
              Math.floor(
                (window.innerHeight - (headerRef.current?.offsetHeight || 60)) /
                  tempCurrentCellSize
              )
            );
            const mobileTargetRows =
              mobileRowsAvailable > 1 ? mobileRowsAvailable - 1 : 1;
            const portfolioFromLegacy =
              processedLegacy.find((w) => w.type === "portfolio") ||
              initialMobileWidgetLayout[0];

            finalWidgetsToSet = [
              processWidgetConfig(
                portfolioFromLegacy,
                tempCurrentCellSize,
                true,
                mobileColsForSort,
                mobileTargetRows
              ),
            ];
          } else {
            const desktopColsForSort = Math.max(
              1,
              Math.floor(importedGridPixelWidth / tempCurrentCellSize)
            );
            const desktopRowsForSort = Math.max(
              1,
              Math.floor(
                (window.innerHeight - (headerRef.current?.offsetHeight || 60)) /
                  tempCurrentCellSize
              )
            );
            const sortResult = performAutoSortAndExpandIfNeeded(
              processedLegacy,
              desktopColsForSort,
              desktopRowsForSort
            );
            if (sortResult) {
              finalWidgetsToSet = sortResult.layout;
              importedGridPixelWidth = Math.max(
                window.innerWidth,
                sortResult.finalCols * tempCurrentCellSize
              );
            } else {
              finalWidgetsToSet = processedLegacy;
              alertMessage +=
                " Auto-sort failed, manual adjustment may be needed.";
            }
          }
          finalCellSize = tempCurrentCellSize;
        } else {
          throw new Error(
            "Invalid file format. Could not recognize dashboard structure."
          );
        }

        alert(alertMessage);

        setCellSize(finalCellSize);
        setActualGridPixelWidth(importedGridPixelWidth);
        setWidgets(finalWidgetsToSet);
        setSharedNotes(notesToSet);
        setActiveSharedNoteId(activeNoteIdToSet);
        setSharedTodos(todosToSet);
        setSharedPhotoHistory(photoHistoryToSet);
        setActiveWidgetId(null);
        setMaximizedWidgetId(null);

        history.current = [JSON.parse(JSON.stringify(finalWidgetsToSet))];
        historyPointer.current = 0;
        setHistoryDisplay({
          pointer: historyPointer.current + 1,
          length: history.current.length,
        });

        initialLayoutIsDefaultRef.current = false;
        initialCenteringDoneRef.current = true;
      } catch (err: unknown) {
        let message = "Invalid file content.";
        if (err instanceof Error) {
          message = err.message;
        }
        console.error("Error importing layout:", err);
        alert(`Error importing layout: ${message}`);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.onerror = () => {
      alert("Error reading file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const triggerImportFileSelect = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleAutoSortButtonClick = useCallback(() => {
    if (
      maximizedWidgetId ||
      isMobileView ||
      widgetContainerCols === 0 ||
      widgetContainerRows === 0
    )
      return;

    const currentLayout = widgets.map((w) => ({ ...w }));
    const sortResult = performAutoSortAndExpandIfNeeded(
      currentLayout,
      widgetContainerCols,
      widgetContainerRows
    );

    if (sortResult) {
      const { layout: sortedLayout, finalCols } = sortResult;
      setWidgets(sortedLayout);
      updateWidgetsAndPushToHistory(sortedLayout, "auto_sort_button_dynamic");
      setActiveWidgetId(null);

      const newRequiredPixelWidth = finalCols * cellSize;
      const newActualGridWidthToSet = Math.max(
        window.innerWidth,
        newRequiredPixelWidth
      );

      if (newActualGridWidthToSet !== actualGridPixelWidth) {
        setActualGridPixelWidth(newActualGridWidthToSet);
      }
    } else {
      console.error(
        "[handleAutoSortButtonClick] Failed to sort existing widgets even with dynamic grid expansion."
      );
      alert(
        "Could not fully sort the grid. Some widgets might be unplaceable or the grid is too full/narrow, even after attempting to expand it."
      );
    }
  }, [
    widgets,
    updateWidgetsAndPushToHistory,
    maximizedWidgetId,
    isMobileView,
    performAutoSortAndExpandIfNeeded,
    widgetContainerCols,
    widgetContainerRows,
    cellSize,
    actualGridPixelWidth,
  ]);

  const attemptPlaceWidgetWithShrinking = useCallback(
    (
      currentWidgetsImmutable: PageWidgetConfig[],
      newWidgetConfig: PageWidgetConfig
    ): {
      layout: PageWidgetConfig[];
      finalCols: number;
      finalRows: number;
    } | null => {
      if (widgetContainerCols === 0 || widgetContainerRows === 0) return null;

      const tempWidgetsLayout = currentWidgetsImmutable.map((w) => ({ ...w }));

      const sortedWithNew = performAutoSortAndExpandIfNeeded(
        [...tempWidgetsLayout, { ...newWidgetConfig }],
        widgetContainerCols,
        widgetContainerRows
      );
      if (sortedWithNew) {
        return sortedWithNew;
      }

      const shrinkableWidgets = tempWidgetsLayout
        .filter((w) => w.colSpan > w.minColSpan || w.rowSpan > w.minRowSpan)
        .sort((a, b) => b.colSpan * b.rowSpan - a.colSpan * a.rowSpan);

      for (const existingWidget of shrinkableWidgets) {
        const originalColSpan = existingWidget.colSpan;

        if (existingWidget.colSpan > existingWidget.minColSpan) {
          const widgetsWithShrunkCol = tempWidgetsLayout.map((w) =>
            w.id === existingWidget.id
              ? { ...w, colSpan: Math.max(w.minColSpan, w.colSpan - 1) }
              : { ...w }
          );
          const layoutWithShrunkCol = performAutoSortAndExpandIfNeeded(
            [...widgetsWithShrunkCol, { ...newWidgetConfig }],
            widgetContainerCols,
            widgetContainerRows
          );
          if (layoutWithShrunkCol) return layoutWithShrunkCol;
        }

        if (existingWidget.rowSpan > existingWidget.minRowSpan) {
          const widgetsWithShrunkRow = tempWidgetsLayout.map((w) =>
            w.id === existingWidget.id
              ? {
                  ...w,
                  colSpan: originalColSpan,
                  rowSpan: Math.max(w.minRowSpan, w.rowSpan - 1),
                }
              : { ...w }
          );
          const layoutWithShrunkRow = performAutoSortAndExpandIfNeeded(
            [...widgetsWithShrunkRow, { ...newWidgetConfig }],
            widgetContainerCols,
            widgetContainerRows
          );
          if (layoutWithShrunkRow) return layoutWithShrunkRow;
        }
      }
      return null;
    },
    [widgetContainerCols, widgetContainerRows, performAutoSortAndExpandIfNeeded]
  );

  const findNextAvailablePosition = useCallback(
    (
      targetColSpan: number,
      targetRowSpan: number,
      currentLayout: PageWidgetConfig[]
    ): { colStart: number; rowStart: number } | null => {
      if (widgetContainerCols === 0 || widgetContainerRows === 0) return null;

      for (let r = 1; r <= widgetContainerRows - targetRowSpan + 1; r++) {
        for (let c = 1; c <= widgetContainerCols - targetColSpan + 1; c++) {
          const dummyWidgetToCheck: PageWidgetConfig = {
            id: "temp-placement-check",
            type: "generic",
            title: "",
            colStart: c,
            rowStart: r,
            colSpan: targetColSpan,
            rowSpan: targetRowSpan,
            minColSpan: targetColSpan,
            minRowSpan: targetRowSpan,
            settings: {},
          };
          if (
            canPlaceWidget(
              dummyWidgetToCheck,
              c,
              r,
              currentLayout,
              widgetContainerCols,
              widgetContainerRows
            )
          ) {
            return { colStart: c, rowStart: r };
          }
        }
      }
      return null;
    },
    [widgetContainerCols, widgetContainerRows, canPlaceWidget]
  );

  const handleAddNewWidget = useCallback(
    (
      widgetType: WidgetType,
      newTitle?: string,
      newColStart?: number,
      newRowStart?: number,
      newColSpan?: number,
      newRowSpan?: number,
      newSizePreset?: WidgetSizePresetKey,
      initialSettingsFromAI?: Partial<AllWidgetSettings>
    ) => {
      if (maximizedWidgetId || (isMobileView && widgetType !== "portfolio")) {
        if (isMobileView && widgetType !== "portfolio") {
          alert(
            "Adding new widgets is disabled in mobile view. Only the portfolio widget is shown."
          );
        }
        return;
      }
      const blueprint = AVAILABLE_WIDGET_DEFINITIONS.find(
        (def) => def.type === widgetType
      );
      if (!blueprint) {
        alert(`Widget type "${widgetType}" is not available.`);
        setIsAddWidgetMenuOpen(false);
        setIsAddWidgetContextMenuOpen(false);
        return;
      }

      if (widgetContainerCols === 0 || widgetContainerRows === 0) {
        alert(
          "Grid not fully initialized. Please wait a moment and try again."
        );
        setIsAddWidgetMenuOpen(false);
        setIsAddWidgetContextMenuOpen(false);
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
          baseConfig.colSpan = Math.max(
            blueprint.minColSpan,
            Math.round(preset.targetWidthPx / cellSize)
          );
          baseConfig.rowSpan = Math.max(
            blueprint.minRowSpan,
            Math.round(preset.targetHeightPx / cellSize)
          );
        }
      }
      if (newColSpan) baseConfig.colSpan = newColSpan;
      if (newRowSpan) baseConfig.rowSpan = newRowSpan;

      let newWidgetConfigProcessed = processWidgetConfig(
        baseConfig,
        cellSize,
        isMobileView
      );
      const finalColSpan = newWidgetConfigProcessed.colSpan;
      let finalRowSpan = newWidgetConfigProcessed.rowSpan;

      if (
        widgetContainerRows > 0 &&
        finalRowSpan > widgetContainerRows &&
        !newWidgetConfigProcessed.isMinimized
      ) {
        newWidgetConfigProcessed = {
          ...newWidgetConfigProcessed,
          isMinimized: true,
          originalRowSpan: finalRowSpan,
          rowSpan: MINIMIZED_WIDGET_ROW_SPAN,
        };
        finalRowSpan = MINIMIZED_WIDGET_ROW_SPAN;
      }

      let finalLayoutResult: {
        layout: PageWidgetConfig[];
        finalCols: number;
        finalRows: number;
      } | null = null;
      const currentWidgetsCopy = widgets.map((w) => ({ ...w }));
      let placedWithoutFullSort = false;

      if (newColStart && newRowStart) {
        if (
          canPlaceWidget(
            {
              ...newWidgetConfigProcessed,
              colSpan: finalColSpan,
              rowSpan: finalRowSpan,
            },
            newColStart,
            newRowStart,
            currentWidgetsCopy,
            Math.max(widgetContainerCols, newColStart + finalColSpan - 1),
            Math.max(widgetContainerRows, newRowStart + finalRowSpan - 1)
          )
        ) {
          const layout = [
            ...currentWidgetsCopy,
            {
              ...newWidgetConfigProcessed,
              colStart: newColStart,
              rowStart: newRowStart,
              colSpan: finalColSpan,
              rowSpan: finalRowSpan,
            },
          ];
          let maxCols = 0;
          let maxRows = 0;
          layout.forEach((w) => {
            maxCols = Math.max(maxCols, w.colStart + w.colSpan - 1);
            maxRows = Math.max(maxRows, w.rowStart + w.rowSpan - 1);
          });
          finalLayoutResult = {
            layout,
            finalCols: maxCols,
            finalRows: maxRows,
          };
          placedWithoutFullSort = true;
        }
      }

      if (!placedWithoutFullSort) {
        const initialPosition = findNextAvailablePosition(
          finalColSpan,
          finalRowSpan,
          currentWidgetsCopy
        );
        if (initialPosition) {
          const layout = [
            ...currentWidgetsCopy,
            {
              ...newWidgetConfigProcessed,
              colStart: initialPosition.colStart,
              rowStart: initialPosition.rowStart,
              colSpan: finalColSpan,
              rowSpan: finalRowSpan,
            },
          ];
          let maxCols = 0;
          let maxRows = 0;
          layout.forEach((w) => {
            maxCols = Math.max(maxCols, w.colStart + w.colSpan - 1);
            maxRows = Math.max(maxRows, w.rowStart + w.rowSpan - 1);
          });
          finalLayoutResult = {
            layout,
            finalCols: maxCols,
            finalRows: maxRows,
          };
          placedWithoutFullSort = true;
        }
      }

      if (!placedWithoutFullSort) {
        const attemptLayoutWithNewWidget = [
          ...currentWidgetsCopy,
          {
            ...newWidgetConfigProcessed,
            colSpan: finalColSpan,
            rowSpan: finalRowSpan,
          },
        ];
        finalLayoutResult = performAutoSortAndExpandIfNeeded(
          attemptLayoutWithNewWidget,
          widgetContainerCols,
          widgetContainerRows
        );
      }

      if (!finalLayoutResult) {
        finalLayoutResult = attemptPlaceWidgetWithShrinking(
          currentWidgetsCopy,
          {
            ...newWidgetConfigProcessed,
            colSpan: finalColSpan,
            rowSpan: finalRowSpan,
          }
        );
      }

      if (finalLayoutResult) {
        setWidgets(finalLayoutResult.layout);
        updateWidgetsAndPushToHistory(
          finalLayoutResult.layout,
          `add_widget_${widgetType}`
        );

        const addedWidgetInLayout = finalLayoutResult.layout.find(
          (w) => w.id === newWidgetConfigProcessed.id
        );
        if (addedWidgetInLayout) setActiveWidgetId(addedWidgetInLayout.id);
        else setActiveWidgetId(null);

        const newRequiredPixelWidth = finalLayoutResult.finalCols * cellSize;
        const newActualGridWidthToSet = Math.max(
          window.innerWidth,
          newRequiredPixelWidth
        );
        if (actualGridPixelWidth !== newActualGridWidthToSet) {
          setActualGridPixelWidth(newActualGridWidthToSet);
        }
      } else {
        alert(
          "No available space to add this widget, even after attempting to sort, expand grid, and shrink existing widgets. Please make more room manually or try a smaller widget."
        );
      }
      setIsAddWidgetMenuOpen(false);
      setIsAddWidgetContextMenuOpen(false);
    },
    [
      maximizedWidgetId,
      widgetContainerCols,
      widgetContainerRows,
      widgets,
      cellSize,
      findNextAvailablePosition,
      performAutoSortAndExpandIfNeeded,
      attemptPlaceWidgetWithShrinking,
      updateWidgetsAndPushToHistory,
      isMobileView,
      canPlaceWidget,
      actualGridPixelWidth,
    ]
  );

  const handleApplyWidgetSizePreset = useCallback(
    (widgetId: string, presetKey: WidgetSizePresetKey) => {
      if (maximizedWidgetId || isMobileView) return;

      const targetWidget = widgets.find((w) => w.id === widgetId);
      const blueprint = AVAILABLE_WIDGET_DEFINITIONS.find(
        (b) => b.type === targetWidget?.type
      );
      if (!targetWidget || !blueprint) {
        alert("Error: Could not find widget data to apply preset.");
        return;
      }

      const presetSizeTargets = WIDGET_SIZE_PRESETS[presetKey];
      if (!presetSizeTargets) {
        alert("Error: Invalid size preset selected.");
        return;
      }

      const newColSpan = Math.max(
        blueprint.minColSpan,
        Math.max(1, Math.round(presetSizeTargets.targetWidthPx / cellSize))
      );
      let newRowSpan = Math.max(
        blueprint.minRowSpan,
        Math.max(1, Math.round(presetSizeTargets.targetHeightPx / cellSize))
      );
      let isMinimizedDueToPreset = false;
      let originalRowSpanForPreset: number | undefined = undefined;

      if (
        widgetContainerRows > 0 &&
        newRowSpan > widgetContainerRows &&
        !targetWidget.isMinimized
      ) {
        isMinimizedDueToPreset = true;
        originalRowSpanForPreset = newRowSpan;
        newRowSpan = MINIMIZED_WIDGET_ROW_SPAN;
      }

      const updatedWidgetConfig = {
        ...targetWidget,
        colSpan: newColSpan,
        rowSpan: newRowSpan,
        isMinimized: isMinimizedDueToPreset || targetWidget.isMinimized,
        originalRowSpan: isMinimizedDueToPreset
          ? originalRowSpanForPreset
          : targetWidget.isMinimized
          ? targetWidget.originalRowSpan
          : undefined,
      };

      let finalLayoutResult: {
        layout: PageWidgetConfig[];
        finalCols: number;
        finalRows: number;
      } | null = null;
      const otherWidgets = widgets
        .filter((w) => w.id !== widgetId)
        .map((w) => ({ ...w }));

      if (
        canPlaceWidget(
          updatedWidgetConfig,
          targetWidget.colStart,
          targetWidget.rowStart,
          otherWidgets,
          Math.max(
            widgetContainerCols,
            targetWidget.colStart + updatedWidgetConfig.colSpan - 1
          ),
          Math.max(
            widgetContainerRows,
            targetWidget.rowStart + updatedWidgetConfig.rowSpan - 1
          )
        )
      ) {
        const layout = widgets.map((w) =>
          w.id === widgetId
            ? {
                ...updatedWidgetConfig,
                colStart: targetWidget.colStart,
                rowStart: targetWidget.rowStart,
              }
            : w
        );
        let maxCols = 0;
        layout.forEach(
          (w) => (maxCols = Math.max(maxCols, w.colStart + w.colSpan - 1))
        );
        let maxRows = 0;
        layout.forEach(
          (w) => (maxRows = Math.max(maxRows, w.rowStart + w.rowSpan - 1))
        );
        finalLayoutResult = { layout, finalCols: maxCols, finalRows: maxRows };
      } else {
        const newPosition = findNextAvailablePosition(
          updatedWidgetConfig.colSpan,
          updatedWidgetConfig.rowSpan,
          otherWidgets
        );
        if (newPosition) {
          const layout = [
            ...otherWidgets,
            {
              ...updatedWidgetConfig,
              colStart: newPosition.colStart,
              rowStart: newPosition.rowStart,
            },
          ];
          let maxCols = 0;
          layout.forEach(
            (w) => (maxCols = Math.max(maxCols, w.colStart + w.colSpan - 1))
          );
          let maxRows = 0;
          layout.forEach(
            (w) => (maxRows = Math.max(maxRows, w.rowStart + w.rowSpan - 1))
          );
          finalLayoutResult = {
            layout,
            finalCols: maxCols,
            finalRows: maxRows,
          };
        } else {
          const widgetsToTrySort = widgets.map((w) =>
            w.id === widgetId ? updatedWidgetConfig : { ...w }
          );
          finalLayoutResult = performAutoSortAndExpandIfNeeded(
            widgetsToTrySort,
            widgetContainerCols,
            widgetContainerRows
          );
        }
      }

      if (finalLayoutResult) {
        setWidgets(finalLayoutResult.layout);
        updateWidgetsAndPushToHistory(
          finalLayoutResult.layout,
          `apply_preset_${presetKey}_to_${widgetId}`
        );
        setActiveWidgetId(widgetId);
        setIsContainerSettingsModalOpen(false);

        const newRequiredPixelWidth = finalLayoutResult.finalCols * cellSize;
        const newActualGridWidthToSet = Math.max(
          window.innerWidth,
          newRequiredPixelWidth
        );
        if (newActualGridWidthToSet !== actualGridPixelWidth) {
          setActualGridPixelWidth(newActualGridWidthToSet);
        }
      } else {
        alert(
          `Could not apply size preset "${presetKey}". There isn't enough space, even after trying to rearrange. Please try a different preset or make more room manually.`
        );
      }
    },
    [
      widgets,
      maximizedWidgetId,
      cellSize,
      findNextAvailablePosition,
      performAutoSortAndExpandIfNeeded,
      updateWidgetsAndPushToHistory,
      canPlaceWidget,
      isMobileView,
      actualGridPixelWidth,
      widgetContainerCols,
      widgetContainerRows,
    ]
  );

  const handleChangeCellSize = useCallback(
    (newCellSize: number) => {
      if (newCellSize === cellSize || maximizedWidgetId) return;

      const oldCellSize = cellSize;

      let newTargetGridPixelWidth: number;
      if (isMobileView) {
        newTargetGridPixelWidth = window.innerWidth;
      } else {
        let maxColOccupiedOld = 0;
        widgets.forEach((w) => {
          maxColOccupiedOld = Math.max(
            maxColOccupiedOld,
            w.colStart + w.colSpan - 1
          );
        });
        const currentContentPixelWidth = maxColOccupiedOld * oldCellSize;
        newTargetGridPixelWidth = Math.max(
          window.innerWidth,
          currentContentPixelWidth
        );
      }

      const scaledWidgets = widgets.map((w) => {
        const blueprint = AVAILABLE_WIDGET_DEFINITIONS.find(
          (b) => b.type === w.type
        );
        if (!blueprint) return w;

        let newColSpan, newRowSpan, newColStart, newRowStart;
        let newIsMinimized = w.isMinimized;
        let newOriginalRowSpan = w.originalRowSpan;

        if (isMobileView && w.type === "portfolio" && widgets.length === 1) {
          const tempNewColsForMobile = Math.max(
            1,
            Math.floor(window.innerWidth / newCellSize)
          );
          const currentHeaderHeight = headerRef.current?.offsetHeight || 60;
          const aiCommandBarHeight = showAiCommandBar
            ? document.getElementById("ai-command-bar")?.offsetHeight || 70
            : 0;
          const mainContentHeight =
            window.innerHeight - currentHeaderHeight - aiCommandBarHeight;
          const tempNewRowsForMobileAvailable = Math.max(
            1,
            Math.floor(mainContentHeight / newCellSize)
          );
          const tempNewRowsForMobile =
            tempNewRowsForMobileAvailable > 1
              ? tempNewRowsForMobileAvailable - 1
              : 1;

          newColSpan = tempNewColsForMobile;
          newRowSpan = tempNewRowsForMobile;
          newColStart = 1;
          newRowStart = 1;
          newIsMinimized = false;
          newOriginalRowSpan = undefined;
        } else {
          const currentPixelWidth = w.colSpan * oldCellSize;
          const effectiveOldRowSpan =
            w.isMinimized && w.originalRowSpan ? w.originalRowSpan : w.rowSpan;
          const currentPixelHeight = effectiveOldRowSpan * oldCellSize;

          const currentPixelX = (w.colStart - 1) * oldCellSize;
          const currentPixelY = (w.rowStart - 1) * oldCellSize;

          newColSpan = Math.max(
            blueprint.minColSpan,
            Math.max(1, Math.round(currentPixelWidth / newCellSize))
          );
          const intendedNewRowSpan = Math.max(
            blueprint.minRowSpan,
            Math.max(1, Math.round(currentPixelHeight / newCellSize))
          );

          newColStart = Math.max(
            1,
            Math.round(currentPixelX / newCellSize) + 1
          );
          newRowStart = Math.max(
            1,
            Math.round(currentPixelY / newCellSize) + 1
          );

          const tempNewGridRowsAvailable = Math.max(
            1,
            Math.floor(
              (window.innerHeight -
                (headerRef.current?.offsetHeight || 60) -
                (showAiCommandBar ? 70 : 0)) /
                newCellSize
            )
          );

          if (w.isMinimized) {
            newIsMinimized = true;
            newOriginalRowSpan = intendedNewRowSpan;
            newRowSpan = MINIMIZED_WIDGET_ROW_SPAN;
          } else if (
            tempNewGridRowsAvailable > 0 &&
            intendedNewRowSpan > tempNewGridRowsAvailable
          ) {
            newIsMinimized = true;
            newOriginalRowSpan = intendedNewRowSpan;
            newRowSpan = MINIMIZED_WIDGET_ROW_SPAN;
          } else {
            newIsMinimized = false;
            newRowSpan = intendedNewRowSpan;
            newOriginalRowSpan = undefined;
          }
        }

        return {
          ...w,
          colSpan: newColSpan,
          rowSpan: newRowSpan,
          colStart: newColStart,
          rowStart: newRowStart,
          isMinimized: newIsMinimized,
          originalRowSpan: newOriginalRowSpan,
        };
      });

      setCellSize(newCellSize);

      if (!isMobileView) {
        requestAnimationFrame(() => {
          const newColsAfterUpdate = Math.max(
            1,
            Math.floor(newTargetGridPixelWidth / newCellSize)
          );
          const currentHeaderHeight = headerRef.current?.offsetHeight || 60;
          const aiCommandBarHeight = showAiCommandBar
            ? document.getElementById("ai-command-bar")?.offsetHeight || 70
            : 0;
          const mainContentHeight =
            window.innerHeight - currentHeaderHeight - aiCommandBarHeight;
          const newRowsAfterUpdate = Math.max(
            1,
            Math.floor(mainContentHeight / newCellSize)
          );

          const sortResult = performAutoSortAndExpandIfNeeded(
            scaledWidgets,
            newColsAfterUpdate,
            newRowsAfterUpdate
          );

          if (sortResult) {
            setWidgets(sortResult.layout);
            updateWidgetsAndPushToHistory(
              sortResult.layout,
              `grid_density_change_desktop_sort_${newCellSize}`
            );

            const finalRequiredPixelWidth = sortResult.finalCols * newCellSize;
            const finalActualGridWidthToSet = Math.max(
              window.innerWidth,
              finalRequiredPixelWidth
            );
            if (actualGridPixelWidth !== finalActualGridWidthToSet) {
              setActualGridPixelWidth(finalActualGridWidthToSet);
            }
          } else {
            setWidgets(scaledWidgets);
            updateWidgetsAndPushToHistory(
              scaledWidgets,
              `grid_density_change_desktop_scaled_FAIL_SORT_${newCellSize}`
            );
            alert(
              "Grid density changed. Auto-sort failed; some widgets may need manual readjustment or use the 'Sort Grid' button."
            );
          }
        });
      } else {
        setWidgets(scaledWidgets);
        updateWidgetsAndPushToHistory(
          scaledWidgets,
          `grid_density_change_mobile_${newCellSize}`
        );
        setActualGridPixelWidth(newTargetGridPixelWidth);
      }

      setIsDensityMenuOpen(false);
    },
    [
      cellSize,
      widgets,
      maximizedWidgetId,
      updateWidgetsAndPushToHistory,
      performAutoSortAndExpandIfNeeded,
      isMobileView,
      actualGridPixelWidth,
      showAiCommandBar,
    ]
  );

  const handleWidgetResizeLive = (
    id: string,
    newGeometry: WidgetResizeDataType
  ) => {
    if (isPerformingUndoRedo.current || maximizedWidgetId || isMobileView)
      return;
    setWidgets((currentWidgets) =>
      currentWidgets.map((w) =>
        w.id === id ? { ...w, ...newGeometry, isMinimized: false } : w
      )
    );
  };

  const handleWidgetResizeEnd = (
    id: string,
    finalGeometry: WidgetResizeDataType
  ) => {
    if (maximizedWidgetId || isMobileView) return;
    setWidgets((currentWidgets) => {
      const updatedWidgets = currentWidgets.map((w) =>
        w.id === id
          ? {
              ...w,
              ...finalGeometry,
              isMinimized: false,
              originalRowSpan: undefined,
            }
          : w
      );

      let maxColRequired = 0;
      updatedWidgets.forEach((w) => {
        maxColRequired = Math.max(maxColRequired, w.colStart + w.colSpan - 1);
      });
      const newRequiredPixelWidth = maxColRequired * cellSize;
      const newActualGridWidthToSet = Math.max(
        window.innerWidth,
        newRequiredPixelWidth
      );

      if (newActualGridWidthToSet !== actualGridPixelWidth) {
        setActualGridPixelWidth(newActualGridWidthToSet);
      }

      updateWidgetsAndPushToHistory(updatedWidgets, `resize_end_${id}`);
      return updatedWidgets;
    });
    setActiveWidgetId(id);
  };

  const handleWidgetMove = (id: string, newPosition: WidgetMoveDataType) => {
    if (maximizedWidgetId || isMobileView) return;
    const currentWidget = widgets.find((w) => w.id === id);
    if (!currentWidget) return;
    if (
      currentWidget.colStart !== newPosition.colStart ||
      currentWidget.rowStart !== newPosition.rowStart
    ) {
      setWidgets((currentWidgets) => {
        const updatedWidgets = currentWidgets.map((w) =>
          w.id === id ? { ...w, ...newPosition } : w
        );

        let maxColRequired = 0;
        updatedWidgets.forEach((w) => {
          maxColRequired = Math.max(maxColRequired, w.colStart + w.colSpan - 1);
        });
        const newRequiredPixelWidth = maxColRequired * cellSize;
        const newActualGridWidthToSet = Math.max(
          window.innerWidth,
          newRequiredPixelWidth
        );

        if (newActualGridWidthToSet !== actualGridPixelWidth) {
          setActualGridPixelWidth(newActualGridWidthToSet);
        }

        updateWidgetsAndPushToHistory(updatedWidgets, `move_${id}`);
        return updatedWidgets;
      });
    }
    setActiveWidgetId(id);
  };

  const handleWidgetDelete = (idToDelete: string) => {
    if (
      isMobileView &&
      widgets.find((w) => w.id === idToDelete)?.type === "portfolio"
    ) {
      alert("The main portfolio widget cannot be deleted in mobile view.");
      return;
    }
    if (maximizedWidgetId === idToDelete) {
      setMaximizedWidgetId(null);
      setMaximizedWidgetOriginalState(null);
    }
    setWidgets((currentWidgets) => {
      const updatedWidgets = currentWidgets.filter(
        (widget) => widget.id !== idToDelete
      );

      if (!isMobileView) {
        let maxColRequired = 0;
        updatedWidgets.forEach((w) => {
          maxColRequired = Math.max(maxColRequired, w.colStart + w.colSpan - 1);
        });
        const newRequiredPixelWidth = maxColRequired * cellSize;
        const newActualGridWidthToSet = Math.max(
          window.innerWidth,
          newRequiredPixelWidth
        );

        if (newActualGridWidthToSet !== actualGridPixelWidth) {
          setActualGridPixelWidth(newActualGridWidthToSet);
        }
      }

      updateWidgetsAndPushToHistory(updatedWidgets, `delete_${idToDelete}`);
      return updatedWidgets;
    });
    if (activeWidgetId === idToDelete) setActiveWidgetId(null);
  };

  const handleWidgetFocus = (id: string) => {
    if (maximizedWidgetId && maximizedWidgetId !== id) return;
    setActiveWidgetId(id);

    const widgetConfig = widgets.find((w) => w.id === id);
    if (widgetConfig && dashboardAreaRef.current && !isMobileView) {
      const widgetLeft = (widgetConfig.colStart - 1) * cellSize;
      const widgetWidth = widgetConfig.colSpan * cellSize;
      const widgetCenterX = widgetLeft + widgetWidth / 2;

      const viewportWidth = dashboardAreaRef.current.clientWidth;
      let targetScrollLeft = widgetCenterX - viewportWidth / 2;

      targetScrollLeft = Math.max(
        0,
        Math.min(
          targetScrollLeft,
          dashboardAreaRef.current.scrollWidth - viewportWidth
        )
      );

      smoothScrollTo(
        dashboardAreaRef.current,
        targetScrollLeft,
        SMOOTH_SCROLL_DURATION_MS,
        "left"
      );
    }
  };
  const handleOpenWidgetSettings = (widgetId: string) => {
    if (maximizedWidgetId && maximizedWidgetId !== widgetId) return;
    const widgetToEdit = widgets.find((w) => w.id === widgetId);
    if (widgetToEdit) {
      setActiveWidgetId(widgetId);
      setSelectedWidgetForSettings(widgetToEdit);
      setIsSettingsModalOpen(true);
    }
  };
  const handleCloseSettingsModal = () => {
    setIsSettingsModalOpen(false);
    setSelectedWidgetForSettings(null);
  };
  const handleSaveWidgetInstanceSettings = useCallback(
    (widgetId: string, newInstanceSettings: AllWidgetSettings) => {
      setWidgets((currentWidgets) => {
        const updatedWidgets = currentWidgets.map((w) =>
          w.id === widgetId
            ? {
                ...w,
                settings: { ...(w.settings || {}), ...newInstanceSettings },
              }
            : w
        );
        updateWidgetsAndPushToHistory(
          updatedWidgets,
          `save_settings_${widgetId}`
        );
        return updatedWidgets;
      });
      setActiveWidgetId(widgetId);
    },
    [updateWidgetsAndPushToHistory]
  );
  const handleOpenContainerSettingsModal = (widgetId: string) => {
    if ((maximizedWidgetId && maximizedWidgetId !== widgetId) || isMobileView)
      return;
    const widgetToEdit = widgets.find((w) => w.id === widgetId);
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
  const handleSaveWidgetContainerSettings = useCallback(
    (widgetId: string, newContainerSettings: WidgetContainerSettings) => {
      setWidgets((currentWidgets) => {
        const updatedWidgets = currentWidgets.map((w) => {
          if (w.id === widgetId) {
            const existingContainerSettings =
              w.containerSettings || DEFAULT_WIDGET_CONTAINER_SETTINGS;
            return {
              ...w,
              containerSettings: {
                ...existingContainerSettings,
                ...newContainerSettings,
              },
            };
          }
          return w;
        });
        updateWidgetsAndPushToHistory(
          updatedWidgets,
          `save_container_settings_${widgetId}`
        );
        return updatedWidgets;
      });
      setActiveWidgetId(widgetId);
    },
    [updateWidgetsAndPushToHistory]
  );
  const handleWidgetMinimizeToggle = (widgetId: string) => {
    if (maximizedWidgetId || isMobileView) return;
    setWidgets((currentWidgets) => {
      const updatedWidgets = currentWidgets.map((w) => {
        if (w.id === widgetId) {
          if (w.isMinimized) {
            const restoredRowSpan = w.originalRowSpan || w.rowSpan;
            return {
              ...w,
              isMinimized: false,
              rowSpan: restoredRowSpan,
              originalRowSpan: undefined,
            };
          } else {
            return {
              ...w,
              isMinimized: true,
              originalRowSpan: w.rowSpan,
              rowSpan: MINIMIZED_WIDGET_ROW_SPAN,
            };
          }
        }
        return w;
      });
      updateWidgetsAndPushToHistory(
        updatedWidgets,
        `minimize_toggle_${widgetId}`
      );
      return updatedWidgets;
    });
    setActiveWidgetId(widgetId);
  };
  const handleWidgetMaximizeToggle = (widgetId: string) => {
    if (isMobileView) return;
    const widgetToToggle = widgets.find((w) => w.id === widgetId);
    if (!widgetToToggle) return;
    if (maximizedWidgetId === widgetId) {
      setMaximizedWidgetId(null);
      setMaximizedWidgetOriginalState(null);
      setActiveWidgetId(widgetId);
    } else {
      let originalStateForMaximize = JSON.parse(JSON.stringify(widgetToToggle));
      if (widgetToToggle.isMinimized) {
        originalStateForMaximize = {
          ...originalStateForMaximize,
          isMinimized: false,
          rowSpan: widgetToToggle.originalRowSpan || widgetToToggle.rowSpan,
          originalRowSpan: undefined,
        };
      }
      setMaximizedWidgetOriginalState(originalStateForMaximize);
      setMaximizedWidgetId(widgetId);
      setActiveWidgetId(widgetId);
    }
  };
  const handleUndo = () => {
    if (historyPointer.current > 0) {
      isPerformingUndoRedo.current = true;
      const newPointer = historyPointer.current - 1;
      historyPointer.current = newPointer;
      const historicState = JSON.parse(
        JSON.stringify(history.current[newPointer])
      );

      let historicWidgets: PageWidgetConfig[];
      let historicActualGridPixelWidth = actualGridPixelWidth;
      let historicCellSize = cellSize;

      if (Array.isArray(historicState)) {
        historicWidgets = historicState;
        let maxCol = 0;
        historicWidgets.forEach(
          (w) => (maxCol = Math.max(maxCol, w.colStart + w.colSpan - 1))
        );
        historicActualGridPixelWidth = Math.max(
          window.innerWidth,
          maxCol * historicCellSize
        );
      } else if (
        typeof historicState === "object" &&
        historicState !== null &&
        "widgets" in historicState
      ) {
        const fullHistoricState = historicState as StoredDashboardLayout;
        historicWidgets = fullHistoricState.widgets;
        historicActualGridPixelWidth =
          fullHistoricState.actualGridPixelWidth || window.innerWidth;
        historicCellSize = fullHistoricState.cellSize || DEFAULT_CELL_SIZE;
      } else {
        console.error("Unknown history state format for undo.");
        isPerformingUndoRedo.current = false;
        return;
      }

      setCellSize(historicCellSize);
      setActualGridPixelWidth(historicActualGridPixelWidth);
      setWidgets(historicWidgets);

      setActiveWidgetId(null);
      setMaximizedWidgetId(null);
      setHistoryDisplay({
        pointer: historyPointer.current + 1,
        length: history.current.length,
      });
      requestAnimationFrame(() => {
        isPerformingUndoRedo.current = false;
      });
    }
  };
  const handleRedo = () => {
    if (historyPointer.current < history.current.length - 1) {
      isPerformingUndoRedo.current = true;
      const newPointer = historyPointer.current + 1;
      historyPointer.current = newPointer;
      const historicState = JSON.parse(
        JSON.stringify(history.current[newPointer])
      );

      let historicWidgets: PageWidgetConfig[];
      let historicActualGridPixelWidth = actualGridPixelWidth;
      let historicCellSize = cellSize;

      if (Array.isArray(historicState)) {
        historicWidgets = historicState;
        let maxCol = 0;
        historicWidgets.forEach(
          (w) => (maxCol = Math.max(maxCol, w.colStart + w.colSpan - 1))
        );
        historicActualGridPixelWidth = Math.max(
          window.innerWidth,
          maxCol * historicCellSize
        );
      } else if (
        typeof historicState === "object" &&
        historicState !== null &&
        "widgets" in historicState
      ) {
        const fullHistoricState = historicState as StoredDashboardLayout;
        historicWidgets = fullHistoricState.widgets;
        historicActualGridPixelWidth =
          fullHistoricState.actualGridPixelWidth || window.innerWidth;
        historicCellSize = fullHistoricState.cellSize || DEFAULT_CELL_SIZE;
      } else {
        console.error("Unknown history state format for redo.");
        isPerformingUndoRedo.current = false;
        return;
      }

      setCellSize(historicCellSize);
      setActualGridPixelWidth(historicActualGridPixelWidth);
      setWidgets(historicWidgets);

      setActiveWidgetId(null);
      setMaximizedWidgetId(null);
      setHistoryDisplay({
        pointer: historyPointer.current + 1,
        length: history.current.length,
      });
      requestAnimationFrame(() => {
        isPerformingUndoRedo.current = false;
      });
    }
  };
  const handleSharedTodosChange = (newGlobalTodos: TodoItem[]) => {
    setSharedTodos(newGlobalTodos);
  };
  const handleSharedPhotoHistoryChange = (
    newGlobalPhotoHistory: HistoricImage[]
  ) => {
    setSharedPhotoHistory(newGlobalPhotoHistory);
  };

  const handleDashboardContextMenu = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (isMobileView) return;
    const target = event.target as HTMLElement;
    let clickedOnWidgetOrInteractiveContent = false;
    if (
      dashboardAreaRef.current &&
      (event.clientX >= dashboardAreaRef.current.clientWidth ||
        event.clientY >= dashboardAreaRef.current.clientHeight)
    ) {
      return;
    }

    for (const widget of widgets) {
      if (target.closest(`#${CSS.escape(widget.id)}`)) {
        clickedOnWidgetOrInteractiveContent = true;
        break;
      }
    }
    if (
      target.closest(
        'button, a, input, select, textarea, [role="button"], [role="link"], [contenteditable="true"]'
      )
    ) {
      if (
        target !== dashboardAreaRef.current &&
        target.id !== "widget-grid-container" &&
        !target.closest(".grid-background-svg") &&
        target.id !== "grid-content-wrapper"
      ) {
        clickedOnWidgetOrInteractiveContent = true;
      }
    }

    if (clickedOnWidgetOrInteractiveContent) {
      return;
    }

    if (
      target === dashboardAreaRef.current ||
      target.id === "widget-grid-container" ||
      target.closest(".grid-background-svg") ||
      target.id === "grid-content-wrapper"
    ) {
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

  // startListening and handleSendAiCommand are now in AiCommandBar.tsx

  const findTargetWidget = (
    command: TargetWidgetAiCommand
  ): PageWidgetConfig | null | undefined => {
    if (command.targetWidgetId) {
      return widgets.find((w) => w.id === command.targetWidgetId);
    }
    if (command.targetWidgetType) {
      const matchingTypeWidgets = widgets.filter(
        (w) => w.type === command.targetWidgetType
      );
      if (matchingTypeWidgets.length === 1) {
        return matchingTypeWidgets[0];
      }
      if (matchingTypeWidgets.length > 1 && command.targetWidgetTitle) {
        const exactTitleMatch = matchingTypeWidgets.find(
          (w) =>
            w.title.toLowerCase() === command.targetWidgetTitle!.toLowerCase()
        );
        if (exactTitleMatch) return exactTitleMatch;
        const partialTitleMatch = matchingTypeWidgets.find((w) =>
          w.title
            .toLowerCase()
            .includes(command.targetWidgetTitle!.toLowerCase())
        );
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
      const exactTitleMatchAll = widgets.find(
        (w) =>
          w.title.toLowerCase() === command.targetWidgetTitle!.toLowerCase()
      );
      if (exactTitleMatchAll) return exactTitleMatchAll;
      const matchingTitleWidgets = widgets.filter((w) =>
        w.title.toLowerCase().includes(command.targetWidgetTitle!.toLowerCase())
      );
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
    console.log("Dispatching AI Command from Page:", command);
    setActiveWidgetId(null); // Deselect any active widget

    // Feedback is now handled by AiCommandBar, but we can log it or use it for alerts if needed.
    // let feedbackMessage = command.feedbackToUser || "";

    switch (command.action) {
      case "addWidget": {
        const addCmd = command as AddWidgetAiCommand;
        if (isMobileView && addCmd.widgetType !== "portfolio") {
          alert("Adding new widgets is disabled in mobile view."); // Or use a more integrated notification
          break;
        }
        let parsedInitialSettings: Partial<AllWidgetSettings> | undefined =
          undefined;
        if (typeof addCmd.initialSettings === "string") {
          try {
            parsedInitialSettings = JSON.parse(addCmd.initialSettings);
          } catch (e) {
            console.error(
              "Error parsing initialSettings JSON for addWidget:",
              e
            );
            alert("Error applying initial settings due to invalid format.");
            break;
          }
        } else if (typeof addCmd.initialSettings === "object") {
          parsedInitialSettings = addCmd.initialSettings;
        }
        handleAddNewWidget(
          addCmd.widgetType,
          addCmd.title,
          addCmd.colStart,
          addCmd.rowStart,
          addCmd.colSpan,
          addCmd.rowSpan,
          addCmd.sizePreset,
          parsedInitialSettings
        );
        break;
      }
      case "deleteWidget": {
        const delCmd = command as DeleteWidgetAiCommand;
        const widgetToDelete = findTargetWidget(delCmd);
        if (isMobileView && widgetToDelete?.type === "portfolio") {
          alert("The main portfolio widget cannot be deleted in mobile view.");
          break;
        }
        if (widgetToDelete) {
          handleWidgetDelete(widgetToDelete.id);
        } else if (widgetToDelete === null) {
          alert(
            `Multiple widgets match "${
              delCmd.targetWidgetTitle || delCmd.targetWidgetType
            }". Please be more specific.`
          );
        } else {
          alert(`Could not find the widget to delete.`);
        }
        break;
      }
      case "moveWidget": {
        const moveCmd = command as MoveWidgetAiCommand;
        if (isMobileView) {
          alert("Moving widgets is disabled in mobile view.");
          break;
        }
        const widgetToMove = findTargetWidget(moveCmd);
        if (
          widgetToMove &&
          typeof moveCmd.newColStart === "number" &&
          typeof moveCmd.newRowStart === "number"
        ) {
          const newCol = Math.max(
            1,
            Math.min(
              moveCmd.newColStart,
              widgetContainerCols - widgetToMove.colSpan + 1
            )
          );
          const newRow = Math.max(
            1,
            Math.min(
              moveCmd.newRowStart,
              widgetContainerRows - widgetToMove.rowSpan + 1
            )
          );
          handleWidgetMove(widgetToMove.id, {
            colStart: newCol,
            rowStart: newRow,
          });
        } else if (widgetToMove === null) {
          alert(
            `Multiple widgets match for moving. Please be more specific.`
          );
        } else {
          alert(
            `Could not move widget. Target or position unclear.`
          );
        }
        break;
      }
      case "resizeWidget": {
        const resizeCmd = command as ResizeWidgetAiCommand;
        if (isMobileView) {
          alert("Resizing widgets is disabled in mobile view.");
          break;
        }
        const widgetToResize = findTargetWidget(resizeCmd);
        if (!widgetToResize) {
           alert(
            widgetToResize === null
              ? `Multiple widgets match for resizing. Please be more specific.`
              : `Could not find widget to resize.`
          );
          break;
        }
        if (resizeCmd.sizePreset) {
          handleApplyWidgetSizePreset(widgetToResize.id, resizeCmd.sizePreset);
          break;
        }

        let { newColSpan, newRowSpan } = resizeCmd;
        const currentBlueprint = AVAILABLE_WIDGET_DEFINITIONS.find(
          (b) => b.type === widgetToResize.type
        );
        const minCS = currentBlueprint?.minColSpan || 1;
        const minRS = currentBlueprint?.minRowSpan || 1;

        if (resizeCmd.resizeDirection) {
          let cSpan = widgetToResize.colSpan;
          let rSpan = widgetToResize.rowSpan;
          switch (resizeCmd.resizeDirection) {
            case "larger": cSpan += 2; rSpan += 2; break;
            case "smaller": cSpan = Math.max(minCS, cSpan - 2); rSpan = Math.max(minRS, rSpan - 2); break;
            case "wider": cSpan += 2; break;
            case "narrower": cSpan = Math.max(minCS, cSpan - 2); break;
            case "taller": rSpan += 2; break;
            case "shorter": rSpan = Math.max(minRS, rSpan - 2); break;
            case "resetSize":
              if (currentBlueprint) {
                const preset = WIDGET_SIZE_PRESETS[currentBlueprint.defaultSizePreset];
                cSpan = Math.max(minCS, Math.round(preset.targetWidthPx / cellSize));
                rSpan = Math.max(minRS, Math.round(preset.targetHeightPx / cellSize));
              }
              break;
          }
          newColSpan = Math.min(widgetContainerCols - widgetToResize.colStart + 1, cSpan);
          newRowSpan = Math.min(widgetContainerRows - widgetToResize.rowStart + 1, rSpan);
        }

        if (typeof newColSpan === "number" || typeof newRowSpan === "number") {
          const finalCS = typeof newColSpan === "number" ? Math.max(minCS, Math.min(newColSpan, widgetContainerCols - widgetToResize.colStart + 1)) : widgetToResize.colSpan;
          const finalRS = typeof newRowSpan === "number" ? Math.max(minRS, Math.min(newRowSpan, widgetContainerRows - widgetToResize.rowStart + 1)) : widgetToResize.rowSpan;

          const otherWidgets = widgets.filter((w) => w.id !== widgetToResize.id);
          if (canPlaceWidget({ ...widgetToResize, colSpan: finalCS, rowSpan: finalRS }, widgetToResize.colStart, widgetToResize.rowStart, otherWidgets, widgetContainerCols, widgetContainerRows)) {
            handleWidgetResizeEnd(widgetToResize.id, { colStart: widgetToResize.colStart, rowStart: widgetToResize.rowStart, colSpan: finalCS, rowSpan: finalRS });
          } else {
            const tempLayout = widgets.map((w) => w.id === widgetToResize.id ? { ...w, colSpan: finalCS, rowSpan: finalRS } : w);
            const sortResult = performAutoSortAndExpandIfNeeded(tempLayout, widgetContainerCols, widgetContainerRows);
            if (sortResult) {
              setWidgets(sortResult.layout);
              updateWidgetsAndPushToHistory(sortResult.layout, `ai_resize_sort_${widgetToResize.id}`);
              const newRequiredPixelWidth = sortResult.finalCols * cellSize;
              const newActualGridWidthToSet = Math.max(window.innerWidth, newRequiredPixelWidth);
              if (actualGridPixelWidth !== newActualGridWidthToSet) {
                setActualGridPixelWidth(newActualGridWidthToSet);
              }
            } else {
              alert(`Could not resize ${widgetToResize.title} as requested due to space constraints.`);
            }
          }
        } else {
          alert(`No specific resize dimensions provided for ${widgetToResize.title}.`);
        }
        break;
      }
      case "changeWidgetSetting": {
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
                else {
                  alert(`Invalid number "${valueToSet}" for ${settingCmd.settingName}.`);
                  break;
                }
              }
            }
          }
          handleSaveWidgetInstanceSettings(widgetToChange.id, { [settingCmd.settingName]: valueToSet });
        } else if (widgetToChange === null) {
          alert(`Multiple widgets match for setting change. Please be more specific.`);
        } else {
          alert(`Could not change setting. Widget or setting name unclear.`);
        }
        break;
      }
      case "minimizeWidget": {
        const minCmd = command as MinimizeWidgetAiCommand;
        if (isMobileView) {
          alert("Minimizing widgets is disabled in mobile view.");
          break;
        }
        const widgetToMinimize = findTargetWidget(minCmd);
        if (widgetToMinimize) {
          if (!widgetToMinimize.isMinimized) {
            handleWidgetMinimizeToggle(widgetToMinimize.id);
          }
        } else if (widgetToMinimize === null) {
          alert(`Multiple widgets match for minimizing. Please be more specific.`);
        } else {
          alert(`Could not find widget to minimize.`);
        }
        break;
      }
      case "maximizeWidget": {
        const maxCmd = command as MaximizeWidgetAiCommand;
        if (isMobileView) {
          alert("Maximizing widgets is not applicable in mobile view.");
          break;
        }
        const widgetToMaximize = findTargetWidget(maxCmd);
        if (widgetToMaximize) {
          if (maximizedWidgetId !== widgetToMaximize.id) {
            handleWidgetMaximizeToggle(widgetToMaximize.id);
          }
        } else if (widgetToMaximize === null) {
          alert(`Multiple widgets match for maximizing. Please be more specific.`);
        } else {
          alert(`Could not find widget to maximize.`);
        }
        break;
      }
      case "restoreWidget": {
        const restoreCmd = command as RestoreWidgetAiCommand;
        if (isMobileView) {
          alert("Restoring widgets is not applicable in mobile view.");
          break;
        }
        const widgetToRestore = findTargetWidget(restoreCmd);
        if (widgetToRestore) {
          if (widgetToRestore.isMinimized) {
            handleWidgetMinimizeToggle(widgetToRestore.id);
          } else if (maximizedWidgetId === widgetToRestore.id) {
            handleWidgetMaximizeToggle(widgetToRestore.id);
          }
        } else if (widgetToRestore === null) {
          alert(`Multiple widgets match for restoring. Please be more specific.`);
        } else {
          alert(`Could not find widget to restore.`);
        }
        break;
      }
      case "openOrFocusWidget": {
        const openCmd = command as OpenOrFocusWidgetAiCommand;
        if (isMobileView && openCmd.widgetType !== "portfolio") {
          alert(`Only the portfolio widget can be focused in mobile view.`);
          break;
        }
        let settingsToApply: Partial<AllWidgetSettings> | null = null;

        if (typeof openCmd.initialSettings === "string") {
          try {
            settingsToApply = JSON.parse(openCmd.initialSettings);
          } catch (e) {
            console.error("Error parsing initialSettings JSON for openOrFocusWidget:", e);
            alert("Error applying initial settings due to invalid format.");
            break;
          }
        } else if (typeof openCmd.initialSettings === "object") {
          settingsToApply = openCmd.initialSettings;
        }

        const matchingTypeWidgets = widgets.filter((w) => w.type === openCmd.widgetType);
        let targetWidget: PageWidgetConfig | null | undefined = undefined;

        if (matchingTypeWidgets.length === 0) {
          const blueprint = AVAILABLE_WIDGET_DEFINITIONS.find((b) => b.type === openCmd.widgetType);
          const newWidgetTitle = openCmd.targetWidgetTitle || blueprint?.defaultTitle || `New ${openCmd.widgetType}`;
          handleAddNewWidget(openCmd.widgetType, newWidgetTitle, undefined, undefined, undefined, undefined, undefined, settingsToApply || undefined);
        } else if (matchingTypeWidgets.length === 1) {
          targetWidget = matchingTypeWidgets[0];
        } else {
          if (openCmd.targetWidgetTitle) {
            targetWidget = matchingTypeWidgets.find((w) => w.title.toLowerCase() === openCmd.targetWidgetTitle!.toLowerCase());
            if (!targetWidget) {
              targetWidget = matchingTypeWidgets.find((w) => w.title.toLowerCase().includes(openCmd.targetWidgetTitle!.toLowerCase()));
            }
          }
          if (!targetWidget) {
            alert(`Multiple ${openCmd.widgetType} widgets exist. Please specify which one.`);
            break;
          }
        }

        if (targetWidget) {
          setActiveWidgetId(targetWidget.id);
          if (maximizedWidgetId && maximizedWidgetId !== targetWidget.id) {
            const maximizedOriginal = widgets.find((w) => w.id === maximizedWidgetId);
            if (maximizedOriginal) handleWidgetMaximizeToggle(maximizedOriginal.id);
          }
          if (targetWidget.isMinimized) {
            handleWidgetMinimizeToggle(targetWidget.id);
          }
          if (settingsToApply) {
            handleSaveWidgetInstanceSettings(targetWidget.id, settingsToApply);
          }
        }
        break;
      }
      case "changeCellSize": {
        const cellCmd = command as ChangeCellSizeAiCommand;
        let targetCellSize = cellCmd.newCellSize;
        if (cellCmd.densityLabel) {
          const option = CELL_SIZE_OPTIONS.find((opt) => opt.label.toLowerCase() === cellCmd.densityLabel!.toLowerCase());
          if (option) targetCellSize = option.value;
        }
        if (typeof targetCellSize === "number" && CELL_SIZE_OPTIONS.some((opt) => opt.value === targetCellSize)) {
          handleChangeCellSize(targetCellSize);
        } else {
          alert(`Invalid cell size or density label.`);
        }
        break;
      }
      case "undoAction": handleUndo(); break;
      case "redoAction": handleRedo(); break;
      case "exportLayout": handleExportLayout(); break;
      case "autoSortGrid":
        if (isMobileView) {
          alert("Auto-sort is disabled in mobile view.");
          break;
        }
        handleAutoSortButtonClick();
        break;
      case "sendChatMessage": {
        const chatCmd = command as SendChatMessageAiCommand;
        const chatWidget = findTargetWidget(chatCmd);
        if (chatWidget && chatWidget.type === "geminiChat" && chatCmd.message) {
          // This part would require a more direct way to send a message to a specific widget instance.
          // For now, we'll log it. The GeminiChatWidget itself would need a prop/method to receive messages.
          console.log(`AI wants to send to ${chatWidget.id} (${chatWidget.title}): "${chatCmd.message}"`);
          alert(`Sending message to ${chatWidget.title}: "${chatCmd.message.substring(0,30)}..." (Display in widget not fully implemented in this example).`);
        } else if (chatWidget === null) {
          alert(`Multiple chat widgets match. Please be more specific.`);
        } else {
          alert(`Could not send chat message. Target chat widget or message unclear.`);
        }
        break;
      }
      case "getWidgetInfo": {
        const infoCmd = command as GetWidgetInfoAiCommand;
        const widgetToQuery = findTargetWidget(infoCmd);
        if (widgetToQuery && infoCmd.requestedInfo) {
          let info = "Information not found.";
          const settingKey = infoCmd.requestedInfo.toLowerCase().replace(/\s/g, "");
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
          alert(info); // AI response should be handled by AiCommandBar, this is for direct feedback
        } else if (widgetToQuery === null) {
          alert(`Multiple widgets match. Please be more specific.`);
        } else {
          alert(`Could not get widget info. Target or requested info unclear.`);
        }
        break;
      }
      case "clarifyCommand": {
        // Feedback is handled by AiCommandBar
        // alert(clarifyCmd.feedbackToUser || clarifyCmd.clarificationNeeded || "I need more information to proceed.");
        break;
      }
      case "unknown": {
        // Feedback is handled by AiCommandBar
        // const unknownCmd = command as UnknownAiCommand;
        // alert(unknownCmd.feedbackToUser || `Sorry, I didn't understand the command: "${unknownCmd.originalCommand}".`);
        break;
      }
      default:
        const unhandledAction = (command as BaseAiCommand).action;
        alert(`Sorry, I can't handle the action: ${unhandledAction}. This might be an unhandled command type.`);
    }
  };


  const handleGoogleServiceSelect = (
    hubWidgetId: string,
    serviceKey: GoogleServiceActionKey
  ) => {
    const hubWidget = widgets.find((w) => w.id === hubWidgetId);

    if (serviceKey === "calendar" || serviceKey === "maps") {
      if (hubWidget) {
        const hubColStart = hubWidget.colStart;
        const hubRowStart = hubWidget.rowStart;
        const widgetTypeToOpen =
          serviceKey === "calendar" ? "googleCalendar" : "googleMaps";
        const widgetTitleToOpen =
          serviceKey === "calendar" ? "Google Calendar" : "Google Maps";

        setWidgets((prevWidgets) => {
          const widgetsAfterDelete = prevWidgets.filter(
            (w) => w.id !== hubWidgetId
          );
          updateWidgetsAndPushToHistory(
            widgetsAfterDelete,
            `internal_delete_hub_for_${serviceKey}`
          );

          Promise.resolve().then(() => {
            handleAddNewWidget(
              widgetTypeToOpen,
              widgetTitleToOpen,
              hubColStart,
              hubRowStart
            );
          });

          return widgetsAfterDelete;
        });
      } else {
        const widgetTypeToOpen =
          serviceKey === "calendar" ? "googleCalendar" : "googleMaps";
        const widgetTitleToOpen =
          serviceKey === "calendar" ? "Google Calendar" : "Google Maps";
        handleAddNewWidget(widgetTypeToOpen, widgetTitleToOpen);
      }
    } else {
      alert(
        `Selected ${serviceKey}. This would open the ${serviceKey} widget. (Functionality for other services not yet implemented)`
      );
      if (hubWidget) {
        handleWidgetMinimizeToggle(hubWidgetId);
      }
    }
  };

  const handleWheelScroll = (event: React.WheelEvent<HTMLDivElement>) => {
    if (activeWidgetId || !dashboardAreaRef.current || isMobileView) {
      return;
    }

    const { deltaX, deltaY } = event;
    const scrollAmount = deltaX !== 0 ? deltaX : deltaY;

    if (
      dashboardAreaRef.current.scrollWidth >
      dashboardAreaRef.current.clientWidth
    ) {
      if (scrollAmount !== 0) {
        event.preventDefault();
        dashboardAreaRef.current.scrollLeft += scrollAmount;
      }
    }
  };

  const renderWidgetContent = (widgetConfig: PageWidgetConfig) => {
    const currentWidgetSettings = widgetConfig.settings || {};
    const notesSettings = currentWidgetSettings as
      | PageInstanceNotesSettings
      | undefined;

    switch (widgetConfig.type) {
      case "weather":
        return (
          <WeatherWidget
            id={widgetConfig.id}
            settings={
              currentWidgetSettings as WeatherWidgetSettings | undefined
            }
          />
        );
      case "clock":
        return (
          <ClockWidget
            id={widgetConfig.id}
            settings={currentWidgetSettings as ClockWidgetSettings | undefined}
          />
        );
      case "calculator":
        return (
          <CalculatorWidget
            id={widgetConfig.id}
            settings={
              currentWidgetSettings as CalculatorWidgetSettings | undefined
            }
          />
        );
      case "youtube":
        return (
          <YoutubeWidget
            id={widgetConfig.id}
            settings={
              currentWidgetSettings as YoutubeWidgetSettings | undefined
            }
          />
        );
      case "minesweeper":
        return (
          <MinesweeperWidget
            id={widgetConfig.id}
            settings={
              currentWidgetSettings as MinesweeperWidgetSettings | undefined
            }
          />
        );
      case "unitConverter":
        return (
          <UnitConverterWidget
            id={widgetConfig.id}
            settings={
              currentWidgetSettings as UnitConverterWidgetSettings | undefined
            }
          />
        );
      case "countdownStopwatch":
        return (
          <CountdownStopwatchWidget
            id={widgetConfig.id}
            settings={
              currentWidgetSettings as
                | CountdownStopwatchWidgetSettings
                | undefined
            }
          />
        );
      case "photo":
        return (
          <PhotoWidget
            id={widgetConfig.id}
            settings={currentWidgetSettings as PhotoWidgetSettings | undefined}
            onSettingsChange={handleSaveWidgetInstanceSettings}
            sharedHistory={sharedPhotoHistory}
            onSharedHistoryChange={handleSharedPhotoHistoryChange}
          />
        );
      case "todo":
        return (
          <TodoWidget
            instanceId={widgetConfig.id}
            settings={currentWidgetSettings as TodoWidgetSettings | undefined}
            todos={sharedTodos}
            onTodosChange={handleSharedTodosChange}
          />
        );
      case "notes":
        return (
          <NotesWidget
            instanceId={widgetConfig.id}
            settings={notesSettings}
            notes={sharedNotes}
            activeNoteId={activeSharedNoteId}
            onNotesChange={setSharedNotes}
            onActiveNoteIdChange={setActiveSharedNoteId}
          />
        );
      case "portfolio":
        return (
          <PortfolioWidget
            settings={
              currentWidgetSettings as PortfolioWidgetSettings | undefined
            }
            isMobileFullScreen={
              isMobileView &&
              widgets.length === 1 &&
              widgets[0].type === "portfolio"
            }
          />
        );
      case "geminiChat":
        return (
          <GeminiChatWidget
            instanceId={widgetConfig.id}
            settings={
              currentWidgetSettings as GeminiChatWidgetSettings | undefined
            }
          />
        );
      case "googleServicesHub":
        return (
          <GoogleServicesHubWidget
            settings={
              currentWidgetSettings as
                | GoogleServicesHubWidgetSettings
                | undefined
            }
            onRequestClose={() => handleWidgetDelete(widgetConfig.id)}
            onSelectService={(serviceKey) =>
              handleGoogleServiceSelect(widgetConfig.id, serviceKey)
            }
          />
        );
      case "googleCalendar":
        return (
          <GoogleCalendarWidget
            settings={
              currentWidgetSettings as GoogleCalendarWidgetSettings | undefined
            }
          />
        );
      case "googleMaps":
        return (
          <GoogleMapsWidget
            settings={
              currentWidgetSettings as GoogleMapsWidgetSettings | undefined
            }
            instanceId={widgetConfig.id}
          />
        );
      case "news":
        return (
          <NewsWidget
            id={widgetConfig.id}
            settings={currentWidgetSettings as NewsWidgetSettings | undefined}
          />
        );
      default:
        return (
          <p className="text-xs text-secondary italic">
            Generic widget content for type: {widgetConfig.type}.
          </p>
        );
    }
  };

  const getSettingsPanelForWidget = (widgetConfig: PageWidgetConfig | null) => {
    if (!widgetConfig) return null;
    const currentContentSettings = widgetConfig.settings || {};
    const boundSaveInstanceContentSettings = (
      newInstanceContentSettings: AllWidgetSettings
    ) => {
      handleSaveWidgetInstanceSettings(
        widgetConfig.id,
        newInstanceContentSettings
      );
      handleCloseSettingsModal();
    };
    const boundSavePhotoInstanceContentSettings = (
      newInstancePhotoSettings: PhotoWidgetSettings
    ) => {
      handleSaveWidgetInstanceSettings(
        widgetConfig.id,
        newInstancePhotoSettings
      );
      handleCloseSettingsModal();
    };
    const notesSettingsPanel = currentContentSettings as
      | PageInstanceNotesSettings
      | undefined;

    switch (widgetConfig.type) {
      case "weather":
        return (
          <WeatherSettingsPanel
            widgetId={widgetConfig.id}
            currentSettings={
              currentContentSettings as WeatherWidgetSettings | undefined
            }
            onSave={boundSaveInstanceContentSettings}
          />
        );
      case "clock":
        return (
          <ClockSettingsPanel
            widgetId={widgetConfig.id}
            currentSettings={
              currentContentSettings as ClockWidgetSettings | undefined
            }
            onSave={boundSaveInstanceContentSettings}
          />
        );
      case "calculator":
        return (
          <CalculatorSettingsPanel
            widgetId={widgetConfig.id}
            currentSettings={
              currentContentSettings as CalculatorWidgetSettings | undefined
            }
            onSave={boundSaveInstanceContentSettings}
          />
        );
      case "youtube":
        return (
          <YoutubeSettingsPanel
            widgetId={widgetConfig.id}
            currentSettings={
              currentContentSettings as YoutubeWidgetSettings | undefined
            }
            onSave={boundSaveInstanceContentSettings}
          />
        );
      case "minesweeper":
        return (
          <MinesweeperSettingsPanel
            widgetId={widgetConfig.id}
            currentSettings={
              currentContentSettings as MinesweeperWidgetSettings | undefined
            }
            onSave={boundSaveInstanceContentSettings}
          />
        );
      case "unitConverter":
        return (
          <UnitConverterSettingsPanel
            widgetId={widgetConfig.id}
            currentSettings={
              currentContentSettings as UnitConverterWidgetSettings | undefined
            }
            onSave={boundSaveInstanceContentSettings}
          />
        );
      case "countdownStopwatch":
        return (
          <CountdownStopwatchSettingsPanel
            widgetId={widgetConfig.id}
            currentSettings={
              currentContentSettings as
                | CountdownStopwatchWidgetSettings
                | undefined
            }
            onSave={boundSaveInstanceContentSettings}
          />
        );
      case "photo":
        return (
          <PhotoSettingsPanel
            widgetId={widgetConfig.id}
            currentSettings={
              currentContentSettings as PhotoWidgetSettings | undefined
            }
            onSaveInstanceSettings={boundSavePhotoInstanceContentSettings}
            onClearGlobalHistory={() => {
              handleSharedPhotoHistoryChange([]);
              alert("Global photo history has been cleared.");
            }}
            globalHistoryLength={sharedPhotoHistory.length}
          />
        );
      case "notes":
        return (
          <NotesSettingsPanel
            widgetInstanceId={widgetConfig.id}
            currentSettings={notesSettingsPanel}
            onSaveLocalSettings={boundSaveInstanceContentSettings}
            onClearAllNotesGlobal={() => {
              setSharedNotes([]);
              setActiveSharedNoteId(null);
              alert("All notes have been cleared from the dashboard.");
            }}
          />
        );
      case "todo":
        return (
          <TodoSettingsPanel
            widgetId={widgetConfig.id}
            currentSettings={
              currentContentSettings as TodoWidgetSettings | undefined
            }
            onSave={boundSaveInstanceContentSettings}
            onClearAllTasks={() => {
              handleSharedTodosChange([]);
              alert(`The global to-do list has been cleared.`);
            }}
          />
        );
      case "portfolio":
        return (
          <PortfolioSettingsPanel
            widgetId={widgetConfig.id}
            currentSettings={
              currentContentSettings as PortfolioWidgetSettings | undefined
            }
            onSave={boundSaveInstanceContentSettings}
          />
        );
      case "geminiChat":
        return (
          <GeminiChatSettingsPanel
            widgetInstanceId={widgetConfig.id}
            currentSettings={
              currentContentSettings as GeminiChatWidgetSettings | undefined
            }
            onSave={boundSaveInstanceContentSettings}
          />
        );
      case "googleServicesHub":
        return (
          <GoogleServicesHubSettingsPanel
            widgetId={widgetConfig.id}
            currentSettings={
              currentContentSettings as
                | GoogleServicesHubWidgetSettings
                | undefined
            }
            onSave={boundSaveInstanceContentSettings}
          />
        );
      case "googleCalendar":
        return (
          <GoogleCalendarSettingsPanel
            widgetId={widgetConfig.id}
            currentSettings={
              currentContentSettings as GoogleCalendarWidgetSettings | undefined
            }
            onSave={boundSaveInstanceContentSettings}
          />
        );
      case "googleMaps":
        return (
          <GoogleMapsSettingsPanel
            widgetId={widgetConfig.id}
            currentSettings={
              currentContentSettings as GoogleMapsWidgetSettings | undefined
            }
            onSave={boundSaveInstanceContentSettings}
          />
        );
      case "news":
        return (
          <NewsSettingsPanel
            widgetId={widgetConfig.id}
            currentSettings={
              currentContentSettings as NewsWidgetSettings | undefined
            }
            onSave={boundSaveInstanceContentSettings}
          />
        );
      default:
        return (
          <p className="text-sm text-secondary">
            No specific content settings available for this widget type.
          </p>
        );
    }
  };

  if (
    !isLayoutEngineReady ||
    widgetContainerCols === 0 ||
    (isMobileView && widgets.length === 0)
  ) {
    return (
      <div className="w-full h-screen bg-page-background flex items-center justify-center text-page-foreground">
        Loading Dashboard...
      </div>
    );
  }

  return (
    <main
      className="w-full h-screen bg-page-background text-page-foreground overflow-hidden relative flex flex-col"
      onClick={(e) => {
        if (
          e.target === e.currentTarget &&
          !maximizedWidgetId &&
          !isAddWidgetContextMenuOpen
        ) {
          setActiveWidgetId(null);
        }
        if (isAddWidgetContextMenuOpen && e.target === e.currentTarget) {
          handleCloseContextMenu();
        }
      }}
      onContextMenu={handleDashboardContextMenu}
    >
      <header
        ref={headerRef}
        className="p-3 bg-dark-surface text-primary flex items-center justify-between shadow-lg z-40 shrink-0 border-b border-[var(--dark-border-interactive)]"
      >
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={handleUndo}
            disabled={
              historyPointer.current <= 0 || !!maximizedWidgetId || isMobileView
            }
            className="control-button"
            aria-label="Undo"
          >
            <UndoIcon />
          </button>
          <button
            onClick={handleRedo}
            disabled={
              historyPointer.current >= history.current.length - 1 ||
              !!maximizedWidgetId ||
              isMobileView
            }
            className="control-button"
            aria-label="Redo"
          >
            <RedoIcon />
          </button>

          {!isMobileView && (
            <>
              <div className="relative" ref={addWidgetMenuRef}>
                <button
                  id="add-widget-button"
                  onClick={() => {
                    setIsAddWidgetMenuOpen((prev) => !prev);
                    setIsAddWidgetContextMenuOpen(false);
                    setIsDensityMenuOpen(false);
                  }}
                  disabled={!!maximizedWidgetId}
                  className="control-button flex items-center"
                  aria-expanded={isAddWidgetMenuOpen}
                  aria-haspopup="true"
                  aria-label="Add New Widget"
                >
                  <AddIcon />
                  <span className="ml-1.5 text-xs hidden sm:inline">
                    Add Widget
                  </span>
                </button>
                {isAddWidgetMenuOpen && (
                  <div
                    className="absolute backdrop-blur-md left-0 mt-2 w-56 origin-top-left rounded-md bg-dark-surface border border-dark-border-interactive shadow-xl py-1 z-50 focus:outline-none animate-modalFadeInScale"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="add-widget-button"
                  >
                    {AVAILABLE_WIDGET_DEFINITIONS.map((widgetDef) => (
                      <button
                        key={widgetDef.type}
                        onClick={() => handleAddNewWidget(widgetDef.type)}
                        className="group flex items-center w-full text-left px-3 py-2.5 text-sm text-dark-text-primary hover:bg-dark-accent-primary hover:text-dark-text-on-accent focus:bg-dark-accent-primary focus:text-dark-text-on-accent focus:outline-none transition-all duration-150 ease-in-out hover:pl-4"
                        role="menuitem"
                        disabled={!!maximizedWidgetId}
                      >
                        {widgetDef.icon && (
                          <widgetDef.icon className="mr-2 w-4 h-4" />
                        )}
                        <span className="flex-grow">
                          {widgetDef.displayName ||
                            widgetDef.defaultTitle.replace("New ", "")}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleAutoSortButtonClick}
                disabled={!!maximizedWidgetId || widgets.length === 0}
                className="control-button flex items-center"
                aria-label="Auto Sort Grid"
              >
                <AutoSortIcon />
                <span className="ml-1.5 text-xs hidden sm:inline">
                  Sort Grid
                </span>
              </button>
              <button
                onClick={handleExportLayout}
                disabled={!!maximizedWidgetId}
                className="control-button"
                aria-label="Export Layout"
              >
                <ExportIcon />
              </button>
              <button
                onClick={triggerImportFileSelect}
                disabled={!!maximizedWidgetId}
                className="control-button"
                aria-label="Import Layout"
              >
                <ImportIcon />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportLayout}
                accept=".json"
                style={{ display: "none" }}
              />
            </>
          )}
          <div className="relative" ref={densityMenuRef}>
            <button
              onClick={() => {
                setIsDensityMenuOpen((prev) => !prev);
                setIsAddWidgetMenuOpen(false);
              }}
              disabled={!!maximizedWidgetId}
              className="control-button flex items-center"
              aria-expanded={isDensityMenuOpen}
              aria-haspopup="true"
              aria-label="Change Grid Density"
              title="Change Grid Density"
            >
              <DensityIcon />
              <span className="ml-1.5 text-xs hidden sm:inline">
                {CELL_SIZE_OPTIONS.find((opt) => opt.value === cellSize)
                  ?.label || `${cellSize}px`}
              </span>
            </button>
            {isDensityMenuOpen && (
              <div
                className="absolute backdrop-blur-md left-0 mt-2 w-40 origin-top-left rounded-md bg-dark-surface border border-dark-border-interactive shadow-xl py-1 z-50 focus:outline-none animate-modalFadeInScale"
                role="menu"
              >
                {CELL_SIZE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleChangeCellSize(option.value)}
                    className={`group flex items-center w-full text-left px-3 py-2.5 text-sm transition-all duration-150 ease-in-out
                                ${
                                  cellSize === option.value
                                    ? "bg-dark-accent-primary-hover text-dark-text-on-accent font-semibold"
                                    : "text-dark-text-primary hover:bg-dark-accent-primary hover:text-dark-text-on-accent focus:bg-dark-accent-primary focus:text-dark-text-on-accent"
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
          onClick={() => setShowAiCommandBar((prev) => !prev)}
          className="control-button"
          aria-label={
            showAiCommandBar ? "Hide AI Command Bar" : "Show AI Command Bar"
          }
          title={
            showAiCommandBar ? "Hide AI Command Bar" : "Show AI Command Bar"
          }
        >
          <AiIcon />
        </button>
        <div className="text-xs text-secondary px-2 sm:px-3 py-1 bg-slate-700 rounded-md">
          {isMobileView
            ? "Mobile View"
            : `Grid: ${widgetContainerCols}x${widgetContainerRows} (${actualGridPixelWidth}px)`}
          {!isMobileView &&
            ` | History: ${historyDisplay.pointer}/${historyDisplay.length}`}
        </div>
      </header>

      {maximizedWidgetId && !isMobileView && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[45]"
          onClick={() =>
            maximizedWidgetId && handleWidgetMaximizeToggle(maximizedWidgetId)
          }
        />
      )}

      <div
        ref={dashboardAreaRef}
        className={`flex-grow relative ${
          isMobileView ? "overflow-hidden" : "overflow-x-auto overflow-y-hidden"
        } ${maximizedWidgetId && !isMobileView ? "pointer-events-none" : ""}`}
        onWheel={handleWheelScroll}
        onClick={(e) => {
          const targetIsWidget = widgets.some((widget) =>
            (e.target as HTMLElement).closest(`#${CSS.escape(widget.id)}`)
          );
          const isDashboardAreaClick =
            e.target === dashboardAreaRef.current ||
            e.target === gridWrapperRef.current;

          if (
            isDashboardAreaClick &&
            !targetIsWidget &&
            !maximizedWidgetId &&
            !isAddWidgetContextMenuOpen
          ) {
            setActiveWidgetId(null);
          }
        }}
      >
        <div
          id="grid-content-wrapper"
          ref={gridWrapperRef}
          className="relative h-full"
          style={{ width: `${actualGridPixelWidth}px` }}
        >
          <GridBackground
            cellSize={cellSize}
            gridWidth={actualGridPixelWidth}
          />
          <div
            id="widget-grid-container"
            className="absolute inset-0 grid gap-0"
            style={{
              gridTemplateColumns: `repeat(${widgetContainerCols}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${widgetContainerRows}, ${cellSize}px)`,
              alignContent: "start",
              width: `${actualGridPixelWidth}px`,
              height: "100%",
            }}
          >
            {widgets.map((widgetConfig) => {
              if (
                maximizedWidgetId &&
                maximizedWidgetId !== widgetConfig.id &&
                !isMobileView
              )
                return null;

              const currentWidgetState =
                maximizedWidgetId === widgetConfig.id &&
                maximizedWidgetOriginalState &&
                !isMobileView
                  ? {
                      ...maximizedWidgetOriginalState,
                      colStart: 1,
                      rowStart: 1,
                      colSpan:
                        Math.floor(window.innerWidth / cellSize) > 2
                          ? Math.floor(window.innerWidth / cellSize) - 1
                          : Math.floor(window.innerWidth / cellSize),
                      rowSpan:
                        widgetContainerRows > 2
                          ? widgetContainerRows - 1
                          : widgetContainerRows,
                      isMinimized: false,
                    }
                  : widgetConfig;

              let minCol = widgetConfig.minColSpan;
              let minRow = widgetConfig.minRowSpan;

              if (
                widgetConfig.isMinimized &&
                maximizedWidgetId !== widgetConfig.id &&
                !isMobileView
              ) {
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
                  onOpenContainerSettings={handleOpenContainerSettingsModal}
                  containerSettings={widgetConfig.containerSettings}
                  isActive={
                    widgetConfig.id === activeWidgetId &&
                    !maximizedWidgetId &&
                    !isMobileView
                  }
                  CELL_SIZE={cellSize}
                  minColSpan={minCol}
                  minRowSpan={minRow}
                  totalGridCols={widgetContainerCols}
                  totalGridRows={widgetContainerRows}
                  isMinimized={
                    widgetConfig.isMinimized &&
                    maximizedWidgetId !== widgetConfig.id &&
                    !isMobileView
                  }
                  onMinimizeToggle={() =>
                    handleWidgetMinimizeToggle(widgetConfig.id)
                  }
                  isMaximized={
                    maximizedWidgetId === widgetConfig.id && !isMobileView
                  }
                  onMaximizeToggle={() =>
                    handleWidgetMaximizeToggle(widgetConfig.id)
                  }
                  isDraggable={!isMobileView}
                  isResizable={!isMobileView}
                  isLocked={widgetConfig.type === "googleServicesHub"}
                  disableHeader={widgetConfig.type === "googleServicesHub"}
                >
                  {renderWidgetContent(widgetConfig)}
                </Widget>
              );
            })}
          </div>
        </div>
      </div>

      {/* Render the AiCommandBar component */}
      <AiCommandBar
        isVisible={showAiCommandBar}
        onToggleVisibility={() => setShowAiCommandBar((prev) => !prev)}
        widgets={widgets}
        onDispatchCommand={dispatchAiCommand}
        geminiApiKey={process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""}
      />

      {isSettingsModalOpen && selectedWidgetForSettings && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={handleCloseSettingsModal}
          title={selectedWidgetForSettings.title}
          settingsContent={getSettingsPanelForWidget(selectedWidgetForSettings)}
        />
      )}
      {isContainerSettingsModalOpen &&
        selectedWidgetForContainerSettings &&
        !isMobileView && (
          <WidgetContainerSettingsModal
            isOpen={isContainerSettingsModalOpen}
            onClose={handleCloseContainerSettingsModal}
            widgetId={selectedWidgetForContainerSettings.id}
            widgetTitle={selectedWidgetForContainerSettings.title}
            currentSettings={
              selectedWidgetForContainerSettings.containerSettings
            }
            onSave={handleSaveWidgetContainerSettings}
            availableSizePresets={WIDGET_SIZE_PRESETS}
            onApplySizePreset={handleApplyWidgetSizePreset}
            currentWidgetSize={{
              colSpan: selectedWidgetForContainerSettings.colSpan,
              rowSpan: selectedWidgetForContainerSettings.rowSpan,
            }}
          />
        )}

      {!isMobileView && (
        <AddWidgetContextMenu
          isOpen={isAddWidgetContextMenuOpen}
          onClose={handleCloseContextMenu}
          position={contextMenuPosition}
          onAddWidget={handleAddNewWidget}
          availableWidgets={contextMenuAvailableWidgets}
          widgetContainerCols={widgetContainerCols}
          widgetContainerRows={widgetContainerRows}
          CELL_SIZE={cellSize}
          headerHeight={headerRef.current?.offsetHeight || 0}
        />
      )}
    </main>
  );
}

// Styles remain the same
const styles = `
  .control-button { display:flex; align-items:center; justify-content:center; padding:0.5rem; background-color:var(--dark-accent-primary); border-radius:0.375rem; color:var(--dark-text-on-accent); transition:background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out; box-shadow:0 1px 2px 0 rgba(0,0,0,0.05); }
  .control-button:hover { background-color:var(--dark-accent-primary-hover); box-shadow:0 2px 4px 0 rgba(0,0,0,0.1); }
  .control-button:disabled { background-color:hsl(222,47%,25%); color:hsl(215,20%,55%); cursor:not-allowed; box-shadow:none; }
  .control-button:focus-visible { outline:2px solid var(--dark-accent-primary-hover); outline-offset:2px; }
  @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .animate-slideUp { animation: slideUp 0.3s ease-out forwards; }
  .shadow-2xl_top { box-shadow: 0 -20px 25px -5px rgba(0,0,0,0.1), 0 -10px 10px -5px rgba(0,0,0,0.04); }
`;
if (
  typeof window !== "undefined" &&
  !document.getElementById("custom-dashboard-styles")
) {
  const styleSheet = document.createElement("style");
  styleSheet.id = "custom-dashboard-styles";
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}
