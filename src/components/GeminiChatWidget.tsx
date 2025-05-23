// src/components/GeminiChatWidget.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';

// --- Icons ---
const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
);

const LoadingIcon = () => (
    <div className="flex space-x-1.5 items-center justify-center h-5">
        <div className="w-2 h-2 bg-amber-300 rounded-full animate-pulse-dot [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-amber-300 rounded-full animate-pulse-dot [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-amber-300 rounded-full animate-pulse-dot"></div>
    </div>
);

const ClearChatIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M3 6h18"></path>
        <path d="M19 6v14c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V6"></path>
        <path d="M8 6V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);


// --- Interfaces & Types ---
// Matches the definition in page.tsx
export interface GeminiChatWidgetSettings {
    customSystemPrompt?: string;
}

interface SessionChatMessage {
    role: 'user' | 'model';
    text: string;
    timestamp: number;
}

// Props expected by this widget when used within the dashboard framework
interface GeminiChatWidgetProps {
    instanceId: string; // Passed from the parent Widget component (which gets it from PageWidgetConfig.id)
    settings?: GeminiChatWidgetSettings;
}

const GeminiChatWidget: React.FC<GeminiChatWidgetProps> = ({ /* instanceId, */ settings }) => {
    // instanceId is passed but not used in this component. Commenting out to satisfy lint.
    // If it's needed for future features (e.g., saving chat history per instance), it can be uncommented.
    const [inputValue, setInputValue] = useState('');
    const [chatMessages, setChatMessages] = useState<SessionChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);

    // Scroll to bottom of chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) {
            return;
        }

        const userMessageText = inputValue.trim();
        const newUserMessage: SessionChatMessage = { role: 'user', text: userMessageText, timestamp: Date.now() };
        setChatMessages(prevMessages => [...prevMessages, newUserMessage]);

        setInputValue('');
        setIsLoading(true);
        setError(null);

        try {
            // Use the latest state of chatMessages for the API call
            const currentChatHistoryForAPI = [...chatMessages, newUserMessage];

            const geminiChatHistory = currentChatHistoryForAPI.map(msg => ({
                role: msg.role,
                parts: [{ text: msg.text }]
            }));

            const systemInstruction = settings?.customSystemPrompt
                ? { role: "system", parts: [{ text: settings.customSystemPrompt }] }
                : null;

            const contentsForApi = systemInstruction
                ? [systemInstruction, ...geminiChatHistory]
                : geminiChatHistory;

            const payload = {
                contents: contentsForApi,
            };
            // Attempt to use the environment variable, fallback to the provided key
            const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyAqX6uGZDMIU942uI-ZZ_Hz43l4RrngnXg";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Gemini API Error:', errorData);
                throw new Error(`API Error: ${errorData?.error?.message || response.statusText}`);
            }

            const result = await response.json();

            let aiResponseText = "Sorry, I couldn't get a response at this moment.";
            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                aiResponseText = result.candidates[0].content.parts[0].text;
            } else {
                console.warn("Unexpected Gemini API response structure:", result);
            }

            const newAiMessage: SessionChatMessage = { role: 'model', text: aiResponseText, timestamp: Date.now() };
            setChatMessages(prevMessages => [...prevMessages, newAiMessage]);

        } catch (err: unknown) { // Changed 'any' to 'unknown'
            console.error('Error in handleSendMessage:', err);
            if (err instanceof Error) {
                setError(`Failed to get response. ${err.message}`);
            } else {
                setError('Failed to get response due to an unknown error.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearCurrentChat = () => {
        setShowClearConfirmModal(true);
    };

    const confirmClearChat = () => {
        setChatMessages([]);
        setError(null);
        setShowClearConfirmModal(false);
    };

    // CSS for animations - This is self-contained for the chat widget's internal elements
    const animationStyles = `
        @keyframes pulse-dot {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(0.8); }
        }
        .animate-pulse-dot {
            animation: pulse-dot 1.4s infinite ease-in-out;
        }
        @keyframes message-entry {
            0% { opacity: 0; transform: translateY(15px) scale(0.95); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .message-animate-enter {
            animation: message-entry 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
        }

        /* Custom Scrollbar for chat area */
        .gemini-chat-scrollbar::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        .gemini-chat-scrollbar::-webkit-scrollbar-track {
            background: transparent; /* Or a very dark slate like #1e293b */
        }
        .gemini-chat-scrollbar::-webkit-scrollbar-thumb {
            background: #4b5563; /* slate-600 */
            border-radius: 10px;
            transition: background 0.2s ease-in-out;
        }
        .gemini-chat-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #6b7280; /* slate-500 */
        }
        .gemini-chat-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #4b5563 transparent; /* thumb track */
        }

        /* Modal animation */
        @keyframes modal-fade-in-scale {
            0% { opacity: 0; transform: scale(0.95); }
            100% { opacity: 1; transform: scale(1); }
        }
        .animate-modal-fade-in-scale {
            animation: modal-fade-in-scale 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
        }
    `;

    return (
        <>
            <style>{animationStyles}</style>
            {/* This div is the main container for the chat content.
                It assumes the parent Widget component handles outer borders, title, etc.
                The \`p-0\` innerPadding on the parent Widget (set in page.tsx for this widget type)
                allows this component to control its own full background and padding.
            */}
            <div className="flex flex-col h-full bg-slate-900 text-slate-200 overflow-hidden">
                {/* Internal Header for the chat widget */}
                <div className="p-3 border-b border-slate-700/70 bg-slate-800/50 flex justify-between items-center shrink-0">
                    <h2 className="text-base font-semibold text-amber-400 tracking-tight">AI Assistant</h2>
                    <button
                        onClick={handleClearCurrentChat}
                        className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-700 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50"
                        title="Clear current chat session"
                        aria-label="Clear current chat session"
                    >
                        <ClearChatIcon />
                    </button>
                </div>

                {/* Chat Messages Area */}
                <div className="flex-grow p-4 md:p-5 space-y-4 overflow-y-auto gemini-chat-scrollbar">
                    {chatMessages.map((msg) => (
                        <div
                            key={msg.timestamp}
                            className={`flex message-animate-enter ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] md:max-w-[75%] py-2.5 px-4 rounded-xl shadow-md break-words ${
                                    msg.role === 'user'
                                        ? 'bg-sky-700 text-white rounded-br-sm'
                                        : 'bg-slate-700 text-slate-200 rounded-bl-sm'
                                }`}
                            >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                {error && <p className="p-3 text-center text-red-400 text-xs bg-slate-800/50 border-t border-slate-700/70 shrink-0">{error}</p>}

                {/* Input Area */}
                <div className="p-3 md:p-4 border-t border-slate-700/70 bg-slate-800/50 shrink-0">
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                            placeholder="Ask anything..."
                            className="flex-grow p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm placeholder-slate-400 transition-all duration-200 shadow-sm text-slate-100"
                            disabled={isLoading}
                            aria-label="Chat input"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={isLoading || !inputValue.trim()}
                            className="p-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-lg disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center aspect-square focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-800 shadow-md hover:shadow-lg"
                            aria-label="Send message"
                        >
                            {isLoading ? <LoadingIcon /> : <SendIcon />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Clear Chat Confirmation Modal */}
            {showClearConfirmModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-modal-fade-in-scale"> {/* Higher z-index for modal */}
                    <div className="bg-slate-800 p-6 rounded-xl shadow-2xl w-full max-w-sm border border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-amber-400">Clear Chat?</h3>
                            <button onClick={() => setShowClearConfirmModal(false)} className="p-1 text-slate-400 hover:text-slate-200 transition-colors rounded-md">
                                <CloseIcon />
                            </button>
                        </div>
                        <p className="text-sm text-slate-300 mb-6">
                            Are you sure you want to clear all messages in this session? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowClearConfirmModal(false)}
                                className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-200 bg-slate-600 hover:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmClearChat}
                                className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                Clear Chat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// Settings Panel for Gemini Chat Widget
// Props match what page.tsx expects for settings panels
interface GeminiChatSettingsPanelProps {
    widgetInstanceId: string;
    currentSettings: GeminiChatWidgetSettings | undefined;
    onSave: (newSettings: GeminiChatWidgetSettings) => void;
}

export const GeminiChatSettingsPanel: React.FC<GeminiChatSettingsPanelProps> = ({ widgetInstanceId, currentSettings, onSave }) => {
    const [systemPrompt, setSystemPrompt] = useState(currentSettings?.customSystemPrompt || '');

    // Update local state if currentSettings prop changes (e.g., due to undo/redo or external update)
    useEffect(() => {
        setSystemPrompt(currentSettings?.customSystemPrompt || '');
    }, [currentSettings]);

    const handleSaveSettings = () => {
        onSave({ customSystemPrompt: systemPrompt });
        // The modal will be closed by the \`onSave\` callback in page.tsx which calls \`handleCloseSettingsModal\`
    };

    // Styling consistent with the masterclass theme for the settings panel itself
    return (
        <div className="space-y-5 text-slate-200"> {/* Adjusted text color for dark modal from page.tsx */}
            <div>
                <label htmlFor={`gemini-system-prompt-${widgetInstanceId}`} className="block text-sm font-medium text-amber-400 mb-1.5">
                    Custom System Prompt (Optional):
                </label>
                <textarea
                    id={`gemini-system-prompt-${widgetInstanceId}`}
                    rows={4} // Increased rows for better usability
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="e.g., You are a master sommelier, guiding me through wine choices."
                    className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-sm placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors duration-200 shadow-sm text-slate-100" // Ensure text is light
                />
                <p className="text-xs text-slate-400 mt-2">
                    This instruction guides the AI&apos;s personality and response style for the current session. It&apos;s sent with each new conversation turn.
                </p>
            </div>

            <button
                onClick={handleSaveSettings}
                className="w-full mt-3 px-4 py-2.5 bg-amber-500 text-slate-900 font-semibold rounded-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 focus:ring-offset-slate-800 transition-all duration-150 ease-in-out shadow-md hover:shadow-lg"
            >
                Save AI Chat Settings
            </button>
        </div>
    );
};

export default GeminiChatWidget;
