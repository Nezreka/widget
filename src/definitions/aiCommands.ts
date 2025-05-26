// src/definitions/aiCommands.ts

import {
    WidgetType,
    AllWidgetSettings,
    WidgetSizePresetKey,
    PageWidgetConfig,
    AVAILABLE_WIDGET_DEFINITIONS,
    WIDGET_SIZE_PRESETS
} from './widgetConfig'; // Adjust path as needed

export type AiActionType =
  | 'addWidget'
  | 'deleteWidget'
  | 'moveWidget'
  | 'resizeWidget'
  | 'changeWidgetSetting'
  | 'minimizeWidget'
  | 'maximizeWidget'
  | 'restoreWidget' // For restoring minimized/maximized
  | 'changeCellSize'
  | 'undoAction'
  | 'redoAction'
  | 'exportLayout'
  // | 'importLayout' // Import via voice/text is complex, deferring
  | 'autoSortGrid'
  | 'sendChatMessage' // To interact with a specific chat widget
  | 'getWidgetInfo' // To ask questions about a widget's current state/settings
  | 'openOrFocusWidget' // New action for contextual opening/focusing with initial params
  | 'clarifyCommand' // AI indicates it needs more information
  | 'unknown'; // Fallback

// Base interface for any command
export interface BaseAiCommand {
  action: AiActionType;
  confidence?: number; // Optional confidence score from AI
  feedbackToUser?: string; // Message to show/speak to the user (e.g., confirmation, error, clarification question)
}

// --- Specific Command Interfaces ---

export interface AddWidgetAiCommand extends BaseAiCommand {
  action: 'addWidget';
  widgetType: WidgetType;
  title?: string;
  colStart?: number;
  rowStart?: number;
  colSpan?: number;
  rowSpan?: number;
  sizePreset?: WidgetSizePresetKey;
  initialSettings?: Partial<AllWidgetSettings> | string; // Can be object or JSON string from AI
}

export interface TargetWidgetAiCommand extends BaseAiCommand {
  targetWidgetId?: string;
  targetWidgetType?: WidgetType;
  targetWidgetTitle?: string;
}

export interface DeleteWidgetAiCommand extends TargetWidgetAiCommand {
  action: 'deleteWidget';
}

export interface MoveWidgetAiCommand extends TargetWidgetAiCommand {
  action: 'moveWidget';
  newColStart: number;
  newRowStart: number;
}

export interface ResizeWidgetAiCommand extends TargetWidgetAiCommand {
  action: 'resizeWidget';
  newColSpan?: number;
  newRowSpan?: number;
  sizePreset?: WidgetSizePresetKey;
  resizeDirection?: 'larger' | 'smaller' | 'wider' | 'taller' | 'shorter' | 'narrower' | 'resetSize';
}

// More specific type for settingValue
export type PossibleSettingValue = AllWidgetSettings[keyof AllWidgetSettings] | string | number | boolean | null;

export interface ChangeWidgetSettingAiCommand<S extends AllWidgetSettings = AllWidgetSettings> extends TargetWidgetAiCommand {
  action: 'changeWidgetSetting';
  settingName: keyof S | string;
  settingValue: PossibleSettingValue; // Changed from any
}

export interface MinimizeWidgetAiCommand extends TargetWidgetAiCommand {
  action: 'minimizeWidget';
}

export interface MaximizeWidgetAiCommand extends TargetWidgetAiCommand {
  action: 'maximizeWidget';
}

export interface RestoreWidgetAiCommand extends TargetWidgetAiCommand {
  action: 'restoreWidget';
}

export interface ChangeCellSizeAiCommand extends BaseAiCommand {
  action: 'changeCellSize';
  newCellSize?: number;
  densityLabel?: 'Micro' | 'Compact' | 'Default' | 'Spacious' | 'Large';
}

export interface UndoRedoAiCommand extends BaseAiCommand {
  action: 'undoAction' | 'redoAction';
}

export interface ExportLayoutAiCommand extends BaseAiCommand {
  action: 'exportLayout';
}

export interface AutoSortGridAiCommand extends BaseAiCommand {
  action: 'autoSortGrid';
}

export interface SendChatMessageAiCommand extends TargetWidgetAiCommand {
  action: 'sendChatMessage';
  message: string;
  targetWidgetType: 'geminiChat'; // Explicitly for geminiChat
}

export interface GetWidgetInfoAiCommand extends TargetWidgetAiCommand {
  action: 'getWidgetInfo';
  requestedInfo: string;
}

// New Command for contextual opening/focusing
export interface OpenOrFocusWidgetAiCommand extends BaseAiCommand {
  action: 'openOrFocusWidget';
  widgetType: WidgetType; // The type of widget to open or focus
  targetWidgetTitle?: string; // If user mentions a specific title
  initialSettings?: Partial<AllWidgetSettings> | string; // Can be object or JSON string from AI
  contextualHint?: string; // e.g., "ounces", "New York weather", "Virtual Mage music videos"
}

export interface ClarifyCommandAiCommand extends BaseAiCommand {
  action: 'clarifyCommand';
  originalCommand?: string;
  clarificationNeeded: string;
}

export interface UnknownAiCommand extends BaseAiCommand {
  action: 'unknown';
  originalCommand: string;
}

// Union type for all possible AI commands
export type ParsedAiCommand =
  | AddWidgetAiCommand
  | DeleteWidgetAiCommand
  | MoveWidgetAiCommand
  | ResizeWidgetAiCommand
  | ChangeWidgetSettingAiCommand<AllWidgetSettings> // Used AllWidgetSettings here
  | MinimizeWidgetAiCommand
  | MaximizeWidgetAiCommand
  | RestoreWidgetAiCommand
  | ChangeCellSizeAiCommand
  | UndoRedoAiCommand
  | ExportLayoutAiCommand
  | AutoSortGridAiCommand
  | SendChatMessageAiCommand
  | GetWidgetInfoAiCommand
  | OpenOrFocusWidgetAiCommand
  | ClarifyCommandAiCommand
  | UnknownAiCommand;

// --- JSON Schema for Gemini's Structured Output ---
export const AI_COMMAND_SCHEMA = {
  type: "OBJECT",
  description: "Structured command parsed from user's natural language input to control the dashboard.",
  properties: {
    action: {
      type: "STRING",
      description: "The primary action to be performed on the dashboard or a widget.",
      enum: [
        'addWidget', 'deleteWidget', 'moveWidget', 'resizeWidget', 'changeWidgetSetting',
        'minimizeWidget', 'maximizeWidget', 'restoreWidget', 'changeCellSize',
        'undoAction', 'redoAction', 'exportLayout', 'autoSortGrid', 'sendChatMessage',
        'getWidgetInfo', 'openOrFocusWidget', 'clarifyCommand', 'unknown'
      ]
    },
    targetWidgetId: { type: "STRING", description: "The unique ID of the widget to target (e.g., 'weather-1699897200000'). If known." },
    targetWidgetType: {
      type: "STRING",
      description: "The type of the widget to target (e.g., 'weather', 'clock'). Useful if ID is not known or specified.",
      enum: AVAILABLE_WIDGET_DEFINITIONS.map(w => w.type)
    },
    targetWidgetTitle: { type: "STRING", description: "The title of the widget as potentially spoken by the user (e.g., 'My Main Clock'). Used for fuzzy matching if ID/type is ambiguous. Also used by 'openOrFocusWidget'." },
    widgetType: {
      type: "STRING",
      description: "The type of the widget to add, open, or focus.",
      enum: AVAILABLE_WIDGET_DEFINITIONS.map(w => w.type)
    },
    title: { type: "STRING", description: "Optional title for a new widget when being added." },
    colStart: { type: "NUMBER", description: "Target grid column for adding or moving a widget. (1-indexed)" },
    rowStart: { type: "NUMBER", description: "Target grid row for adding or moving a widget. (1-indexed)" },
    newColStart: { type: "NUMBER", description: "The new column start position for a 'moveWidget' action. (1-indexed)" },
    newRowStart: { type: "NUMBER", description: "The new row start position for a 'moveWidget' action. (1-indexed)" },
    colSpan: { type: "NUMBER", description: "Column span for adding or resizing a widget (in grid units)." },
    rowSpan: { type: "NUMBER", description: "Row span for adding or resizing a widget (in grid units)." },
    newColSpan: { type: "NUMBER", description: "The new column span for a 'resizeWidget' action." },
    newRowSpan: { type: "NUMBER", description: "The new row span for a 'resizeWidget' action." },
    sizePreset: {
      type: "STRING",
      description: "A predefined size preset key (e.g., 'small_square', 'medium_wide') for adding or resizing.",
      enum: Object.keys(WIDGET_SIZE_PRESETS)
    },
    resizeDirection: {
        type: "STRING",
        description: "Relative direction for resizing a widget if specific spans are not given (e.g., 'larger', 'wider').",
        enum: ['larger', 'smaller', 'wider', 'taller', 'shorter', 'narrower', 'resetSize']
    },
    settingName: { type: "STRING", description: "The name of the setting to change for a specific widget (e.g., 'location' for weather, 'displayType' for clock)." },
    settingValue: {
      oneOf: [
        { type: "STRING" }, { type: "NUMBER" }, { type: "BOOLEAN" }, { type: "NULL" }
      ],
      description: "The new value for the specified setting. Type should match the setting's expected type based on system prompt guidance."
    },
    initialSettings: {
        type: "STRING",
        description: "A JSON STRING representing a partial settings object. E.g., '{\"location\":\"Paris\", \"units\":\"metric\"}'. Keys should be valid setting names for the widgetType, and values should match their expected types. For YouTube, this can be '{\"defaultSearchQuery\":\"your search terms\"}'."
    },
    contextualHint: {
        type: "STRING",
        description: "A hint from the user's phrasing that suggests a specific state for the widget (e.g., 'ounces' for unit converter, 'New York' for weather, 'Virtual Mage music videos' for YouTube search)."
    },
    newCellSize: { type: "NUMBER", description: "The new cell size in pixels for the 'changeCellSize' action (grid density)." },
    densityLabel: {
      type: "STRING",
      description: "Label for a grid density preset (e.g., 'Compact', 'Default').",
      enum: ['Micro', 'Compact', 'Default', 'Spacious', 'Large']
    },
    message: { type: "STRING", description: "Message content for 'sendChatMessage' action, to be sent to a chat widget." },
    requestedInfo: { type: "STRING", description: "Specific piece of information requested about a widget for 'getWidgetInfo' action (e.g., 'current location', 'font size')." },
    clarificationNeeded: { type: "STRING", description: "If action is 'clarifyCommand', this field contains the question the AI needs to ask the user to resolve ambiguity." },
    confidence: { type: "NUMBER", description: "AI's confidence in the parsed command (0.0 to 1.0). Optional." },
    feedbackToUser: { type: "STRING", description: "A message to show or speak to the user (e.g., confirmation, error, clarification question from AI). Optional." },
    originalCommand: { type: "STRING", description: "The original text command from the user, especially if the action is 'unknown' or 'clarifyCommand'." }
  },
  required: ["action"]
};

// Helper to generate a more detailed system prompt for Gemini
export const getGeminiSystemPrompt = (currentWidgets: PageWidgetConfig[]): string => {
  const widgetDetails = AVAILABLE_WIDGET_DEFINITIONS.map(blueprint => {
    let settingsInfo = "No specific configurable settings listed.";
    if (blueprint.defaultSettings && Object.keys(blueprint.defaultSettings).length > 0) {
      settingsInfo = "Configurable settings (for 'initialSettings' provide as a JSON string, e.g., '{\"settingName\":\"value\"}'):\n" + Object.entries(blueprint.defaultSettings)
        .map(([key, defaultValue]) => {
          const valueType = typeof defaultValue;
          const exampleValue = JSON.stringify(defaultValue);
          let specificDescription = "";
          let enumValues: string | null = null;

          // --- DETAILED SETTING DESCRIPTIONS AND ENUMS ---
          if (blueprint.type === 'weather') {
            if (key === 'location') specificDescription = " (e.g., \"London, UK\", \"97504 US\", or geographical coordinates like \"42.32,-122.87\")";
            if (key === 'units') { specificDescription = " (Units for temperature and speed)"; enumValues = "'imperial' (°F, mph), 'metric' (°C, kph)"; }
            if (key === 'useCurrentLocation') specificDescription = " (Boolean: true/false. If true, ignores manual location and uses device's current geo-coordinates)";
          } else if (blueprint.type === 'clock') {
            if (key === 'displayType') { specificDescription = " (Visual style of the clock)"; enumValues = "'analog', 'digital'";}
            if (key === 'showSeconds') specificDescription = " (Boolean: true/false. Show or hide the seconds hand/digits)";
            if (key === 'hourFormat') { specificDescription = " (For digital display: 12-hour or 24-hour format)"; enumValues = "'12', '24'";}
          } else if (blueprint.type === 'calculator') {
            if (key === 'theme') { specificDescription = " (Visual theme for the calculator, currently not implemented)"; enumValues = "'dark', 'light'";}
          } else if (blueprint.type === 'notes') {
            if (key === 'fontSize') { specificDescription = " (Default font size for notes in the editor)"; enumValues = "'sm', 'base', 'lg'";}
          } else if (blueprint.type === 'todo') {
            if (key === 'showCompleted') specificDescription = " (Boolean: true/false. Show or hide completed tasks in the list)";
            if (key === 'sortBy') { specificDescription = " (Default sort order for tasks)"; enumValues = "'createdAt_asc', 'createdAt_desc', 'alphabetical_asc', 'alphabetical_desc'";}
            if (key === 'defaultFilter') { specificDescription = " (Default filter for tasks shown)"; enumValues = "'all', 'active', 'completed'";}
          } else if (blueprint.type === 'minesweeper') {
            if (key === 'difficulty') { specificDescription = " (Game difficulty level)"; enumValues = "'easy', 'medium', 'hard'";}
          } else if (blueprint.type === 'unitConverter') {
            if (key === 'defaultCategory') {
                specificDescription = " (Default category of units to display)";
                enumValues = "'Length', 'Weight/Mass', 'Temperature', 'Volume', 'Speed'";
            }
            if (key === 'precision') specificDescription = " (Number of decimal places for results, e.g., 2, 4. Min 0, Max 10)";
          } else if (blueprint.type === 'countdownStopwatch') {
            if (key === 'defaultCountdownMinutes') specificDescription = " (Default minutes for new countdown timers, e.g., 5. Min 1, Max 360)";
            if (key === 'playSoundOnFinish') specificDescription = " (Boolean: true/false. Play a sound when countdown timer finishes)";
          } else if (blueprint.type === 'photo') {
            if (key === 'imageUrl') specificDescription = " (URL of the image to display, or null to clear)";
            if (key === 'imageName') specificDescription = " (Display name for the image, or null)";
            if (key === 'objectFit') { specificDescription = " (How the image should fit within its container)"; enumValues = "'contain', 'cover', 'fill', 'scale-down', 'none'";}
            if (key === 'isSidebarOpen') specificDescription = " (Boolean: true/false. Controls visibility of the image history sidebar)";
          } else if (blueprint.type === 'portfolio') {
            if (key === 'accentColor') specificDescription = " (Accent color for the portfolio, hex color string e.g., '#0ea5e9')";
            if (key === 'showAnimatedBackground') specificDescription = " (Boolean: true/false. Enable or disable subtle background animations)";
          } else if (blueprint.type === 'geminiChat') {
            if (key === 'customSystemPrompt') specificDescription = " (Custom instructions for the AI chat, e.g., 'You are a helpful assistant.')";
          } else if (blueprint.type === 'youtube') {
            if (key === 'defaultSearchQuery') specificDescription = " (Initial search query when widget loads, e.g., 'Tech Reviews', 'Virtual Mage music videos')"; // Enhanced example
            if (key === 'maxResults') specificDescription = " (Number of search results to fetch, 1-25)";
            if (key === 'showResultsPanel') specificDescription = " (Boolean: true/false. Show search results panel by default)";
          }
          // --- END DETAILED SETTING DESCRIPTIONS ---

          let settingLine = `    - ${key} (type: ${valueType}`;
          if (enumValues) settingLine += `, enum: [${enumValues}]`;
          settingLine += `, default: ${exampleValue})${specificDescription}`;
          return settingLine;
        }).join("\n");
    }
    return `  Type: "${blueprint.type}" (Display Name: "${blueprint.displayName || blueprint.defaultTitle}")
  Description: ${blueprint.description}
  ${settingsInfo}`;
  }).join("\n\n");

  const currentWidgetStates = currentWidgets.length > 0
    ? "Current widgets on dashboard:\n" + currentWidgets.map(w =>
        `  - ID: "${w.id}", Type: "${w.type}", Title: "${w.title}", Minimized: ${w.isMinimized ?? false}, Col: ${w.colStart}, Row: ${w.rowStart}, Span: ${w.colSpan}x${w.rowSpan}`
      ).join("\n")
    : "No widgets are currently on the dashboard.";

  const cellSizeOptionsPrompt = "Available grid density options (for 'changeCellSize' action with 'densityLabel'): 'Micro' (15px), 'Compact' (20px), 'Default' (30px), 'Spacious' (40px), 'Large' (50px).";

  // Enhanced Intent Examples
  const intentExamplesPrompt = `
Contextual Intent Examples:
- User: "I need to convert kilograms to pounds."
  AI should infer: action: 'openOrFocusWidget', widgetType: 'unitConverter', contextualHint: "kilograms to pounds", initialSettings: "{\\"defaultCategory\\":\\"Weight/Mass\\"}"
- User: "Show me the weather in London."
  AI should infer: action: 'openOrFocusWidget', widgetType: 'weather', contextualHint: "weather in London", initialSettings: "{\\"location\\":\\"London\\", \\"useCurrentLocation\\":false}"
- User: "Set the main clock to analog."
  AI should infer: action: 'changeWidgetSetting', targetWidgetTitle: "Main Clock", settingName: 'displayType', settingValue: 'analog'.
- User: "Add a small timer."
  AI should infer: action: 'addWidget', widgetType: 'countdownStopwatch', sizePreset: 'small_square'.
- User: "Search YouTube for 'latest tech news'."
  AI should infer: action: 'openOrFocusWidget', widgetType: 'youtube', contextualHint: "latest tech news", initialSettings: "{\\"defaultSearchQuery\\":\\"latest tech news\\"}"
- User: "Play music videos by Virtual Mage on YouTube."
  AI should infer: action: 'openOrFocusWidget', widgetType: 'youtube', contextualHint: "Virtual Mage music videos", initialSettings: "{\\"defaultSearchQuery\\":\\"Virtual Mage music videos\\"}"
- User: "Find TypeScript tutorials by The Net Ninja."
  AI should infer: action: 'openOrFocusWidget', widgetType: 'youtube', contextualHint: "TypeScript tutorials The Net Ninja", initialSettings: "{\\"defaultSearchQuery\\":\\"TypeScript tutorials The Net Ninja\\"}"
- User: "Show me some relaxing lofi beats."
  AI should infer: action: 'openOrFocusWidget', widgetType: 'youtube', contextualHint: "relaxing lofi beats", initialSettings: "{\\"defaultSearchQuery\\":\\"relaxing lofi beats\\"}"
- User: "What's the current bitcoin price?"
  AI should infer: action: 'openOrFocusWidget', widgetType: 'geminiChat', contextualHint: "current bitcoin price", initialSettings: "{\\"customSystemPrompt\\":\\"You are a helpful assistant that can provide concise answers. The user wants to know the current bitcoin price. If you can, provide it. If not, say you cannot fetch real-time financial data.\\"}"
  (The application will then send "What's the current bitcoin price?" to the Gemini Chat widget if 'openOrFocusWidget' is chosen, or if a Gemini Chat widget is targeted via 'sendChatMessage')
`;

  return `You are an AI assistant for a customizable widget dashboard. Your task is to parse user commands (text or transcribed voice) and translate them into a structured JSON object based on the provided schema.

Key capabilities:
- Add, delete, move, resize, minimize, maximize, or restore widgets.
- Change settings specific to each widget type. For settings with predefined options (enums), use one of the listed values.
- Open or focus a widget based on context (e.g., "convert pounds" implies Unit Converter, "search for cat videos" implies YouTube). Use 'openOrFocusWidget' for this.
  - If the widget type for 'openOrFocusWidget' doesn't exist, the system will try to add it.
  - For 'initialSettings', provide a valid JSON STRING.
    - Example for Weather: initialSettings: "{\\"location\\":\\"New York\\", \\"units\\":\\"imperial\\"}"
    - Example for YouTube: initialSettings: "{\\"defaultSearchQuery\\":\\"search terms from user query\\"}"
  - Use 'contextualHint' to pass along the user's specific phrasing that implies a state (e.g., "ounces", "New York weather", "cat videos", "Virtual Mage music videos").
- Change grid density, undo/redo, export layout, auto-sort grid.
- Interact with chat widgets using 'sendChatMessage'.
- Query information about widgets using 'getWidgetInfo'.

Widget Identification:
- Prefer 'targetWidgetId' if known.
- Use 'targetWidgetType' if the user refers to a widget by its type (e.g., "the clock widget").
- Use 'targetWidgetTitle' for user-spoken titles.
- If ambiguous (e.g., "delete the clock" with multiple clocks), set action to 'clarifyCommand' and use 'feedbackToUser' and 'clarificationNeeded'.

Available Widget Types and Their Settings:
${widgetDetails}

${cellSizeOptionsPrompt}
${intentExamplesPrompt}

Current Dashboard State:
${currentWidgetStates}

Response Format:
- Always respond with a JSON object matching the schema.
- For 'changeWidgetSetting', 'settingName' must be valid for the target widget. 'settingValue' must match the expected type and be an enum value if provided.
- For 'openOrFocusWidget', if the widget type is not present, the application will attempt to add it. The 'initialSettings' JSON string should contain relevant settings based on the user's command (e.g., 'defaultSearchQuery' for YouTube).
- If a command is clear, provide the action and parameters. Include 'feedbackToUser' for confirmation.
- If slightly ambiguous but a reasonable default can be assumed, proceed but note it in 'feedbackToUser'.
- If critical information is missing or too vague, set action to 'clarifyCommand'.
- If uninterpretable, set action to 'unknown'.

User's command is:
`;
};
