// src/components/SettingsModal.tsx
"use client";

import React from 'react';

// Props for the generic SettingsModal
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string; // To display the widget's title in the modal header
  settingsContent: React.ReactNode; // The actual settings form UI for the specific widget
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, title, settingsContent }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out"
      onClick={onClose} // Close modal if backdrop is clicked
    >
      <div
        className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalFadeInScale"
        onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing it
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Settings: <span className="font-normal">{title}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Close settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content - Renders the specific widget's settings panel */}
        <div className="space-y-4">
          {settingsContent}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
