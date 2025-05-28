// src/definitions/widgetConfig.ts
import React from 'react';

// Import Icon Components
import {
  WeatherIcon,
  ClockIcon,
  CalculatorIcon,
  TodoIcon,
  NotesIcon,
  YoutubeIcon,
  MinesweeperIcon,
  UnitConverterIcon,
  CountdownStopwatchIcon,
  PhotoIcon,
  PortfolioIcon,
  GeminiChatIcon,
  // Import the new GoogleServicesHubIcon (assuming it will be created in Icons.tsx)
  GoogleServicesHubIcon,
} from '@/components/Icons'; // Assuming Icons.tsx is in @/components/

// Import specific widget settings types from their respective component files
// Note: Adjust paths if your widget components are structured differently
import { type WeatherWidgetSettings } from "@/components/WeatherWidget";
import { type ClockWidgetSettings } from "@/components/ClockWidget";
import { type CalculatorWidgetSettings } from "@/components/CalculatorWidget";
import { type YoutubeWidgetSettings } from "@/components/YoutubeWidget";
import { type NotesWidgetSettings } from "@/components/NotesWidget";
import { type TodoWidgetSettings } from "@/components/TodoWidget";
import { type MinesweeperWidgetSettings } from "@/components/MinesweeperWidget";
import { type UnitConverterWidgetSettings } from "@/components/UnitConverterWidget";
import { type CountdownStopwatchWidgetSettings } from "@/components/CountdownStopwatchWidget";
import { type PhotoWidgetSettings } from "@/components/PhotoWidget";
import { type PortfolioWidgetSettings } from "@/components/PortfolioWidget";
import { type GeminiChatWidgetSettings } from "@/components/GeminiChatWidget";
import { type GoogleServicesHubWidgetSettings } from "@/components/GoogleServicesHubWidget";


// Import WidgetContainerSettings from Widget.tsx as it's used by PageWidgetConfig
import { type WidgetContainerSettings } from '@/components/Widget';

// --- Constants ---
export const DEFAULT_CELL_SIZE = 30; // Base cell size for defining target pixel dimensions

// --- Widget Size Presets ---

export interface WidgetSizePresetDetails {
  targetWidthPx: number;
  targetHeightPx: number;
  description?: string; // Optional description for the preset
}

export type WidgetSizePresetKey =
  | 'icon' | 'small_square' | 'medium_square' | 'large_square' | 'xlarge_square'
  | 'small_wide' | 'medium_wide' | 'large_wide'
  | 'small_tall' | 'medium_tall' | 'large_tall'
  | 'content_driven_medium'
  | 'content_driven_large'
  | 'full_width_short'
  | 'half_width_medium'
  | 'hub_default_size'; // New preset for the hub

// Updated to use WidgetSizePresetDetails type for values
export const WIDGET_SIZE_PRESETS: Record<WidgetSizePresetKey, WidgetSizePresetDetails> = {
  icon: { targetWidthPx: 4 * DEFAULT_CELL_SIZE, targetHeightPx: 4 * DEFAULT_CELL_SIZE, description: "Icon size" },
  small_square: { targetWidthPx: 8 * DEFAULT_CELL_SIZE, targetHeightPx: 8 * DEFAULT_CELL_SIZE, description: "Small Square" },
  medium_square: { targetWidthPx: 12 * DEFAULT_CELL_SIZE, targetHeightPx: 12 * DEFAULT_CELL_SIZE, description: "Medium Square" },
  large_square: { targetWidthPx: 16 * DEFAULT_CELL_SIZE, targetHeightPx: 16 * DEFAULT_CELL_SIZE, description: "Large Square" },
  xlarge_square: { targetWidthPx: 20 * DEFAULT_CELL_SIZE, targetHeightPx: 20 * DEFAULT_CELL_SIZE, description: "X-Large Square" },
  small_wide: { targetWidthPx: 12 * DEFAULT_CELL_SIZE, targetHeightPx: 6 * DEFAULT_CELL_SIZE, description: "Small Wide" },
  medium_wide: { targetWidthPx: 16 * DEFAULT_CELL_SIZE, targetHeightPx: 8 * DEFAULT_CELL_SIZE, description: "Medium Wide" },
  large_wide: { targetWidthPx: 24 * DEFAULT_CELL_SIZE, targetHeightPx: 10 * DEFAULT_CELL_SIZE, description: "Large Wide" },
  small_tall: { targetWidthPx: 6 * DEFAULT_CELL_SIZE, targetHeightPx: 12 * DEFAULT_CELL_SIZE, description: "Small Tall" },
  medium_tall: { targetWidthPx: 10 * DEFAULT_CELL_SIZE, targetHeightPx: 16 * DEFAULT_CELL_SIZE, description: "Medium Tall" },
  large_tall: { targetWidthPx: 12 * DEFAULT_CELL_SIZE, targetHeightPx: 20 * DEFAULT_CELL_SIZE, description: "Large Tall" },
  content_driven_medium: { targetWidthPx: 15 * DEFAULT_CELL_SIZE, targetHeightPx: 18 * DEFAULT_CELL_SIZE, description: "Content Medium" },
  content_driven_large: { targetWidthPx: 40 * DEFAULT_CELL_SIZE, targetHeightPx: 30 * DEFAULT_CELL_SIZE, description: "Content Large" },
  full_width_short: { targetWidthPx: 30 * DEFAULT_CELL_SIZE, targetHeightPx: 8 * DEFAULT_CELL_SIZE, description: "Full Short" },
  half_width_medium: { targetWidthPx: 15 * DEFAULT_CELL_SIZE, targetHeightPx: 12 * DEFAULT_CELL_SIZE, description: "Half Medium" },
  hub_default_size: { targetWidthPx: 25 * DEFAULT_CELL_SIZE, targetHeightPx: 25 * DEFAULT_CELL_SIZE, description: "Google Hub Size" }, // Adjusted size
};

// --- Widget Types and Settings ---
// Alias for NotesWidgetSettings as it was used in page.tsx
export type PageInstanceNotesSettings = NotesWidgetSettings;

export type AllWidgetSettings =
    WeatherWidgetSettings | TodoWidgetSettings | ClockWidgetSettings | CalculatorWidgetSettings |
    PageInstanceNotesSettings | YoutubeWidgetSettings | MinesweeperWidgetSettings | UnitConverterWidgetSettings |
    CountdownStopwatchWidgetSettings | PhotoWidgetSettings | PortfolioWidgetSettings | GeminiChatWidgetSettings |
    GoogleServicesHubWidgetSettings | // Add new settings type
    Record<string, unknown>; // Fallback for generic or unknown settings

export type WidgetType =
    'weather' | 'todo' | 'clock' | 'calculator' | 'notes' | 'youtube' |
    'minesweeper' | 'unitConverter' | 'countdownStopwatch' | 'photo' | 'portfolio' |
    'geminiChat' |
    'googleServicesHub' | // Add new widget type
    'generic';

// --- Widget Configuration Interfaces ---
export interface PageWidgetConfig {
  id: string;
  title: string;
  type: WidgetType;
  colStart: number;
  rowStart: number;
  colSpan: number;
  rowSpan: number;
  minColSpan: number;
  minRowSpan: number;
  settings?: AllWidgetSettings;
  containerSettings?: WidgetContainerSettings; // This will use the updated version from Widget.tsx
  isMinimized?: boolean;
  originalRowSpan?: number;
}

export interface WidgetBlueprint {
  type: WidgetType;
  defaultTitle: string;
  displayName?: string;
  description?: string;
  icon?: React.FC; // React.FC for functional components, or React.ComponentType for class/functional
  defaultSizePreset: WidgetSizePresetKey;
  minColSpan: number; // In grid units, absolute minimum
  minRowSpan: number; // In grid units, absolute minimum
  defaultSettings: AllWidgetSettings | undefined;
}

// --- Default Instance Settings for Specific Widgets ---
export const PHOTO_WIDGET_DEFAULT_INSTANCE_SETTINGS: PhotoWidgetSettings = {
  imageUrl: null, imageName: null, objectFit: 'cover', isSidebarOpen: false
};
export const PORTFOLIO_WIDGET_DEFAULT_INSTANCE_SETTINGS: PortfolioWidgetSettings = {
    accentColor: '#0ea5e9', showAnimatedBackground: true,
};
export const GEMINI_CHAT_WIDGET_DEFAULT_INSTANCE_SETTINGS: GeminiChatWidgetSettings = {
    customSystemPrompt: '',
};
// Define default settings for the new hub widget
export const GOOGLE_SERVICES_HUB_DEFAULT_INSTANCE_SETTINGS: GoogleServicesHubWidgetSettings = {
    animationSpeed: 'normal',
};


// --- Available Widget Definitions ---
export const AVAILABLE_WIDGET_DEFINITIONS: WidgetBlueprint[] = [
  { type: 'weather', defaultTitle: 'New Weather', displayName: 'Weather', description: "Live weather updates and forecasts.", icon: WeatherIcon, defaultSizePreset: 'medium_wide', minColSpan: 6, minRowSpan: 6, defaultSettings: { location: '97504 US', units: 'imperial', useCurrentLocation: true } },
  { type: 'clock', defaultTitle: 'New Clock', displayName: 'Clock', description: "Analog or digital world clock.", icon: ClockIcon, defaultSizePreset: 'small_square', minColSpan: 4, minRowSpan: 4, defaultSettings: { displayType: 'digital', showSeconds: true, hourFormat: '12' } },
  { type: 'calculator', defaultTitle: 'New Calculator', displayName: 'Calculator', description: "Perform quick calculations.", icon: CalculatorIcon, defaultSizePreset: 'medium_tall', minColSpan: 4, minRowSpan: 6, defaultSettings: {} },
  { type: 'todo', defaultTitle: 'Global To-Do List', displayName: 'To-Do List', description: "Organize your tasks.", icon: TodoIcon, defaultSizePreset: 'content_driven_medium', minColSpan: 5, minRowSpan: 6, defaultSettings: { showCompleted: true, sortBy: 'createdAt_desc', defaultFilter: 'all' } },
  { type: 'notes', defaultTitle: 'New Note Pad', displayName: 'Notes', description: "Jot down quick notes and ideas.", icon: NotesIcon, defaultSizePreset: 'content_driven_medium', minColSpan: 6, minRowSpan: 6, defaultSettings: { fontSize: 'base' } },
  { type: 'youtube', defaultTitle: 'YouTube Player', displayName: 'YouTube', description: "Embed YouTube to watch videos.", icon: YoutubeIcon, defaultSizePreset: 'content_driven_medium', minColSpan: 10, minRowSpan: 8, defaultSettings: {} },
  { type: 'minesweeper', defaultTitle: 'Minesweeper', displayName: 'Minesweeper', description: "Classic Minesweeper game.", icon: MinesweeperIcon, defaultSizePreset: 'content_driven_medium', minColSpan: 8, minRowSpan: 10, defaultSettings: { difficulty: 'easy' } },
  { type: 'unitConverter', defaultTitle: 'Unit Converter', displayName: 'Unit Converter', description: "Convert various units.", icon: UnitConverterIcon, defaultSizePreset: 'medium_tall', minColSpan: 6, minRowSpan: 8, defaultSettings: { defaultCategory: 'Length', precision: 4 } as UnitConverterWidgetSettings },
  { type: 'countdownStopwatch', defaultTitle: 'Timer / Stopwatch', displayName: 'Timer/Stopwatch', description: "Countdown timer and stopwatch.", icon: CountdownStopwatchIcon, defaultSizePreset: 'medium_square', minColSpan: 6, minRowSpan: 6, defaultSettings: { defaultCountdownMinutes: 5, playSoundOnFinish: true } as CountdownStopwatchWidgetSettings },
  { type: 'photo', defaultTitle: 'Photo Viewer', displayName: 'Photo Viewer', description: "Display an image from URL or upload.", icon: PhotoIcon, defaultSizePreset: 'content_driven_medium', minColSpan: 6, minRowSpan: 6, defaultSettings: PHOTO_WIDGET_DEFAULT_INSTANCE_SETTINGS },
  { type: 'portfolio', defaultTitle: "Broque's Portfolio", displayName: 'My Portfolio', description: "A showcase of my work and experience.", icon: PortfolioIcon, defaultSizePreset: 'content_driven_large', minColSpan: 18, minRowSpan: 16, defaultSettings: PORTFOLIO_WIDGET_DEFAULT_INSTANCE_SETTINGS },
  { type: 'geminiChat', defaultTitle: 'AI Chat', displayName: 'Gemini AI Chat', description: "Chat with a Gemini-powered AI assistant.", icon: GeminiChatIcon, defaultSizePreset: 'content_driven_medium', minColSpan: 8, minRowSpan: 10, defaultSettings: GEMINI_CHAT_WIDGET_DEFAULT_INSTANCE_SETTINGS },
  // Add the new Google Services Hub blueprint
  {
    type: 'googleServicesHub',
    defaultTitle: 'Google Services',
    displayName: 'Google Hub',
    description: "Access various Google services.",
    icon: GoogleServicesHubIcon, // This icon needs to be created in Icons.tsx
    defaultSizePreset: 'hub_default_size', // Use the new preset
    minColSpan: 15, // Adjusted for better visual appeal of the hub
    minRowSpan: 15,  // Adjusted
    defaultSettings: GOOGLE_SERVICES_HUB_DEFAULT_INSTANCE_SETTINGS,
  },
];
