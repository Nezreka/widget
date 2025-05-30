// src/components/AiCommandBar.tsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  MicIcon,
  MicOffIcon,
  SendArrowIcon,
  CloseIcon as AiCloseIcon,
  ProcessingIcon,
} from '@/components/Icons';
import { type PageWidgetConfig } from '@/definitions/widgetConfig'; // Corrected: PageWidgetConfig only
import {
  getGeminiSystemPrompt,
  AI_COMMAND_SCHEMA, // Corrected: Moved from widgetConfig
  type ParsedAiCommand, // Corrected: Moved from widgetConfig
} from '@/definitions/aiCommands';
import {
  type SpeechRecognition,
  type SpeechRecognitionEvent,
  type SpeechRecognitionErrorEvent,
} from "@/definitions/speechTypes";

// Helper function to construct the Gemini system prompt.
const getGeminiSystemPromptForCommandBar = (widgets: PageWidgetConfig[]): string => {
  const basePrompt = getGeminiSystemPrompt(widgets);
  const promptLines = [basePrompt];

  promptLines.push(
    "\n--- YouTube Widget Specific Instructions (CRITICAL - READ CAREFULLY) ---"
  );
  promptLines.push("When the user's command is about YouTube:");
  promptLines.push(
    "1. The action is ALWAYS 'openOrFocusWidget' with 'widgetType': 'youtube'."
  );
  promptLines.push(
    "2. **If the user's command includes ANY phrases like 'search for', 'find videos of', 'show me videos of', 'look for', 'YouTube [something]' or ANY other indication they want to find specific content on YouTube:**"
  );
  promptLines.push(
    "   - You **MUST** extract the search term (e.g., if they say 'YouTube search for epic cat fails', the search term is 'epic cat fails')."
  );
  promptLines.push(
    "   - You **MUST** include the 'initialSettings' field in your JSON command."
  );
  promptLines.push(
    "   - Inside 'initialSettings', you **MUST** include a key named 'defaultSearchQuery'."
  );
  promptLines.push(
    "   - The value for 'defaultSearchQuery' **MUST BE** the exact search term you extracted."
  );
  promptLines.push(
    "   - **THIS IS NOT OPTIONAL. IF A SEARCH IS INTENDED, `initialSettings.defaultSearchQuery` IS REQUIRED.** Failure to include it means the search will NOT happen, and the command is INCORRECT."
  );
  promptLines.push(
    "   - **CORRECT Example** for user prompt 'Show me music videos by Virtual Mage on YouTube':"
  );
  promptLines.push(
    '     `{ "action": "openOrFocusWidget", "widgetType": "youtube", "initialSettings": { "defaultSearchQuery": "music videos by Virtual Mage" }, "feedbackToUser": "Searching YouTube for music videos by Virtual Mage..." }`'
  );
  promptLines.push(
    "   - **INCORRECT Example** for user prompt 'Show me music videos by Virtual Mage on YouTube':"
  );
  promptLines.push(
    '     `{ "action": "openOrFocusWidget", "widgetType": "youtube", "feedbackToUser": "Opening YouTube..." }` <-- WRONG! Missing `initialSettings.defaultSearchQuery`.'
  );
  promptLines.push(
    "3. If, and ONLY IF, the user's command is simply to 'open YouTube' or 'focus on YouTube' WITHOUT ANY search term or search intent mentioned:"
  );
  promptLines.push(
    "   - Then 'initialSettings' can be omitted, or 'defaultSearchQuery' can be an empty string if 'initialSettings' is present for other reasons."
  );
  promptLines.push("   - Example for 'open YouTube':");
  promptLines.push(
    '     `{ "action": "openOrFocusWidget", "widgetType": "youtube", "feedbackToUser": "Opening YouTube..." }`'
  );

  const youtubeWidgets = widgets.filter((w) => w.type === "youtube");
  if (youtubeWidgets.length > 0) {
    promptLines.push("\nExisting YouTube Widgets:");
    youtubeWidgets.forEach((ytWidget) => {
      const currentSearch = (ytWidget.settings as { defaultSearchQuery?: string })
        ?.defaultSearchQuery;
      promptLines.push(
        `- Title: '${ytWidget.title}', ID: '${ytWidget.id}'. Current search: ${
          currentSearch ? `'${currentSearch}'` : "none"
        }. If user wants to search in THIS specific widget, use its ID/title and include the new 'initialSettings.defaultSearchQuery'.`
      );
    });
  } else {
    promptLines.push(
      "\nNo YouTube widgets exist. If user wants to search, you MUST add a new one AND include 'initialSettings.defaultSearchQuery'."
    );
  }
  promptLines.push("--- End YouTube Widget Specific Instructions ---");

  return promptLines.join("\n");
};


interface AiCommandBarProps {
  isVisible: boolean;
  onToggleVisibility: () => void;
  widgets: PageWidgetConfig[];
  onDispatchCommand: (command: ParsedAiCommand) => void;
  geminiApiKey?: string;
}

const AiCommandBar: React.FC<AiCommandBarProps> = ({
  isVisible,
  onToggleVisibility,
  widgets,
  onDispatchCommand,
  geminiApiKey = '',
}) => {
  const [aiInputValue, setAiInputValue] = useState("");
  const [aiIsListening, setAiIsListening] = useState(false);
  const [aiIsProcessing, setAiIsProcessing] = useState(false);
  const [aiLastFeedback, setAiLastFeedback] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (!isVisible) {
      setAiLastFeedback(null);
      setAiError(null);
      setAiInputValue("");
      if (speechRecognitionRef.current && aiIsListening) {
        speechRecognitionRef.current.stop();
        setAiIsListening(false);
      }
    }
  }, [isVisible, aiIsListening]);


  const startListening = () => {
    if (
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
    ) {
      const SpeechRecognitionImpl =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionImpl) {
        setAiError("Speech recognition is not supported by your browser.");
        setAiLastFeedback("Speech recognition not supported.");
        return;
      }
      if (speechRecognitionRef.current && aiIsListening) {
        speechRecognitionRef.current.stop();
        return;
      }

      speechRecognitionRef.current = new SpeechRecognitionImpl();
      speechRecognitionRef.current.continuous = false;
      speechRecognitionRef.current.interimResults = true;
      speechRecognitionRef.current.lang = "en-US";

      speechRecognitionRef.current.onstart = () => {
        setAiIsListening(true);
        setAiLastFeedback("Listening...");
        setAiError(null);
        setAiInputValue("");
      };

      speechRecognitionRef.current.onresult = (
        event: SpeechRecognitionEvent
      ) => {
        let interimTranscript = "";
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        const currentTranscript = finalTranscript || interimTranscript;
        setAiInputValue(currentTranscript);

      };

      speechRecognitionRef.current.onerror = (
        event: SpeechRecognitionErrorEvent
      ) => {
        console.error("Speech recognition error:", event.error, event.message);
        let errorMsg = `Speech error: ${event.error}.`;
        if (event.error === "no-speech") errorMsg = "No speech detected. Try again.";
        else if (event.error === "audio-capture") errorMsg = "Microphone error. Check permissions.";
        else if (event.error === "not-allowed") errorMsg = "Mic access denied. Enable in browser settings.";
        else if (event.message) errorMsg += ` ${event.message}`;
        
        setAiError(errorMsg);
        setAiLastFeedback(errorMsg);
        setAiIsListening(false);
      };

      speechRecognitionRef.current.onend = () => {
        setAiIsListening(false);
      };

      try {
        speechRecognitionRef.current.start();
      } catch (e) {
        console.error("Error starting speech recognition:", e);
        setAiError("Could not start voice recognition.");
        setAiLastFeedback("Could not start voice recognition.");
        setAiIsListening(false);
      }
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

    const systemPrompt = getGeminiSystemPromptForCommandBar(widgets);
    const fullPrompt = systemPrompt + "\nUser Command: " + commandText;

    try {
      const chatHistory = [{ role: "user", parts: [{ text: fullPrompt }] }];
      const payload = {
        contents: chatHistory,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: AI_COMMAND_SCHEMA,
        },
      };
      
      const apiKeyForCall = geminiApiKey; 

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeyForCall}`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Gemini API Error Response:", errorData);
        const message =
          errorData?.error?.message ||
          `API request failed with status ${response.status}`;
        throw new Error(message);
      }

      const result = await response.json();

      if (
        result.candidates &&
        result.candidates.length > 0 &&
        result.candidates[0].content &&
        result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0 &&
        result.candidates[0].content.parts[0].text
      ) {
        const rawJsonText = result.candidates[0].content.parts[0].text;
        let cleanedJsonText = rawJsonText.trim();
        if (cleanedJsonText.startsWith("```json")) {
            cleanedJsonText = cleanedJsonText.substring(7);
        }
        if (cleanedJsonText.startsWith("```")) {
            const firstNewline = cleanedJsonText.indexOf('\n');
            if (firstNewline !== -1) {
                cleanedJsonText = cleanedJsonText.substring(firstNewline + 1);
            } else {
                 cleanedJsonText = cleanedJsonText.substring(3);
            }
        }
        if (cleanedJsonText.endsWith("```")) {
            cleanedJsonText = cleanedJsonText.substring(0, cleanedJsonText.length - 3);
        }
        cleanedJsonText = cleanedJsonText.trim();

        const parsedCommand = JSON.parse(cleanedJsonText) as ParsedAiCommand;
        setAiLastFeedback(parsedCommand.feedbackToUser || "Command received.");
        onDispatchCommand(parsedCommand);
      } else {
        console.warn("Unexpected Gemini API response structure:", result);
        throw new Error("Received an unexpected response structure from AI.");
      }
    } catch (err: unknown) {
      console.error("Error processing AI command:", err);
      const errorMsg =
        err instanceof Error
          ? err.message
          : "An unknown error occurred with AI.";
      setAiError(`AI Error: ${errorMsg}`);
      setAiLastFeedback(`Error: ${errorMsg}`);
    } finally {
      setAiIsProcessing(false);
      setAiInputValue("");
    }
  };
  
  if (!isVisible) {
    return null;
  }

  return (
    <div
      id="ai-command-bar"
      className="fixed bottom-0 left-0 right-0 bg-slate-800/90 dark:bg-dark-surface/90 backdrop-blur-md p-3 md:p-4 shadow-2xl_top z-[60] border-t border-slate-700 dark:border-dark-border-interactive transition-transform duration-300 ease-out animate-slideUp"
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center space-x-2 md:space-x-3">
          <button
            onClick={startListening}
            disabled={aiIsProcessing}
            className={`p-2.5 md:p-3 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${
              aiIsListening
                ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                : "bg-sky-500 hover:bg-sky-600 text-white"
            } disabled:bg-slate-500 disabled:cursor-not-allowed`}
            aria-label={aiIsListening ? "Stop listening" : "Start voice command"}
            title={aiIsListening ? "Stop listening" : "Start voice command"}
          >
            {aiIsListening ? <MicOffIcon /> : <MicIcon />}
          </button>
          <input
            type="text"
            value={aiInputValue}
            onChange={(e) => setAiInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !aiIsProcessing) {
                handleSendAiCommand(aiInputValue);
              }
            }}
            placeholder={
              aiIsListening
                ? "Listening..."
                : "Type your command or use microphone..."
            }
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
            onClick={onToggleVisibility}
            className="p-2.5 md:p-3 rounded-full bg-slate-600 hover:bg-slate-500 text-slate-300 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            aria-label="Close AI Command Bar"
            title="Close AI Command Bar"
          >
            <AiCloseIcon />
          </button>
        </div>
        {(aiLastFeedback || aiError) && (
          <div
            className={`mt-2.5 p-2.5 rounded-md text-xs ${
              aiError
                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                : "bg-sky-500/10 text-sky-300 border border-sky-500/20"
            }`}
          >
            <strong>
              {aiError
                ? "Error: "
                : aiIsProcessing
                ? "Processing: "
                : aiIsListening && !aiInputValue.trim() 
                ? ""
                : "AI: "}
            </strong>
            {aiError || aiLastFeedback}
          </div>
        )}
      </div>
    </div>
  );
};

export default AiCommandBar;
