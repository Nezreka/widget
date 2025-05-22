// src/components/WidgetContainerSettingsModal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { WidgetContainerSettings } from './Widget'; // Assuming Widget.tsx exports this

// Define a specific type for the padding options
export type InnerPaddingType = 
  | 'p-0' 
  | 'px-1.5 py-1' 
  | 'px-2.5 py-2' 
  | 'px-3.5 py-3' 
  | 'px-5 py-4';

const DEFAULT_INNER_PADDING: InnerPaddingType = 'px-3.5 py-3';

interface WidgetContainerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgetId: string;
  currentSettings?: WidgetContainerSettings;
  onSave: (widgetId: string, newSettings: WidgetContainerSettings) => void;
  widgetTitle?: string; // To display the widget's title
}

const WidgetContainerSettingsModal: React.FC<WidgetContainerSettingsModalProps> = ({
  isOpen,
  onClose,
  widgetId,
  currentSettings,
  onSave,
  widgetTitle,
}) => {
  // Initialize state with current settings or sensible defaults
  const [containerBackgroundColor, setContainerBackgroundColor] = useState(currentSettings?.containerBackgroundColor || '');
  const [alwaysShowTitleBar, setAlwaysShowTitleBar] = useState(currentSettings?.alwaysShowTitleBar ?? false);
  // Use the specific InnerPaddingType for state and provide a default
  const [innerPadding, setInnerPadding] = useState<InnerPaddingType>(
    (currentSettings?.innerPadding as InnerPaddingType) || DEFAULT_INNER_PADDING
  );

  // Effect to reset local state if currentSettings prop changes or when the modal opens
  useEffect(() => {
    if (isOpen) {
        setContainerBackgroundColor(currentSettings?.containerBackgroundColor || '');
        setAlwaysShowTitleBar(currentSettings?.alwaysShowTitleBar ?? false);
        // Ensure innerPadding is set to a valid InnerPaddingType
        setInnerPadding((currentSettings?.innerPadding as InnerPaddingType) || DEFAULT_INNER_PADDING);
    }
  }, [currentSettings, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    onSave(widgetId, {
      // Save undefined if the string is empty, so Widget.tsx uses its default logic (transparent/theme-based)
      containerBackgroundColor: containerBackgroundColor.trim() === '' ? undefined : containerBackgroundColor,
      alwaysShowTitleBar,
      innerPadding, // innerPadding state is already correctly typed
    });
    onClose(); // Close modal after saving
  };

  // Define padding options for the dropdown, ensuring values match InnerPaddingType
  const paddingOptions: { label: string; value: InnerPaddingType }[] = [
    { label: 'None (0px)', value: 'p-0' },
    { label: 'X-Small (6px / 4px)', value: 'px-1.5 py-1'},
    { label: 'Small (10px / 8px)', value: 'px-2.5 py-2' },
    { label: 'Medium (14px / 12px - Default)', value: 'px-3.5 py-3' },
    { label: 'Large (20px / 16px)', value: 'px-5 py-4' },
  ];

  const commonInputClass = "mt-1 block w-full px-3 py-2.5 bg-widget border border-border-interactive rounded-md shadow-sm focus:outline-none focus:ring-accent-primary focus:border-accent-primary sm:text-sm text-primary";
  const commonLabelClass = "block text-sm font-medium text-secondary mb-1";

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalFadeInScale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Appearance: <span className="font-normal">{widgetTitle || 'Widget'}</span>
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

        {/* Modal Content */}
        <div className="space-y-5">
          {/* Background Color Input */}
          <div>
            <label htmlFor={`container-bg-color-${widgetId}`} className={commonLabelClass}>
              Container Background Color:
            </label>
            <div className="flex items-center space-x-2">
              {/* Native color picker, usually a wheel/palette */}
              <input
                type="color"
                id={`container-bg-color-picker-${widgetId}`} // Unique ID for the color picker itself
                value={containerBackgroundColor || '#ffffff'} // Default to white for picker if empty, actual save is based on text input
                onChange={(e) => setContainerBackgroundColor(e.target.value)}
                className="w-10 h-10 p-0 border-none rounded-md cursor-pointer bg-transparent appearance-none"
                aria-label="Select background color"
                style={{backgroundColor: containerBackgroundColor || 'transparent'}} // Show selected color or transparent
              />
              {/* Text input for hex code, or to see current value */}
              <input
                type="text"
                id={`container-bg-color-text-${widgetId}`} // Unique ID for text input
                placeholder="e.g., #RRGGBB or leave empty"
                value={containerBackgroundColor}
                onChange={(e) => setContainerBackgroundColor(e.target.value)}
                className={`${commonInputClass} flex-grow`}
                aria-label="Background color hex code"
              />
              <button
                onClick={() => setContainerBackgroundColor('')}
                className="px-3 py-2 text-xs bg-slate-500 hover:bg-slate-600 text-white rounded-md transition-colors"
                title="Clear background color to use theme default"
              >
                Clear
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Use the color picker or enter a hex code. Clear to use default theme behavior.
            </p>
          </div>

          {/* Always Show Title Bar Toggle */}
          <div>
            <label htmlFor={`always-show-title-${widgetId}`} className="flex items-center text-sm font-medium text-secondary cursor-pointer">
              <input
                type="checkbox"
                id={`always-show-title-${widgetId}`}
                checked={alwaysShowTitleBar}
                onChange={(e) => setAlwaysShowTitleBar(e.target.checked)}
                className="h-4 w-4 text-accent-primary focus:ring-accent-primary border-border-interactive rounded mr-2.5 bg-widget"
              />
              Always Show Title Bar (Overrides Hover/Active Fade)
            </label>
          </div>

          {/* Inner Padding Selector */}
          <div>
            <label htmlFor={`inner-padding-${widgetId}`} className={commonLabelClass}>
              Content Inner Padding:
            </label>
            <select
              id={`inner-padding-${widgetId}`}
              value={innerPadding}
              // Cast e.target.value to the specific InnerPaddingType
              onChange={(e) => setInnerPadding(e.target.value as InnerPaddingType)}
              className={commonInputClass}
            >
              {paddingOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="mt-6 w-full px-4 py-2.5 bg-accent-primary text-on-accent rounded-lg hover:bg-accent-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary focus:ring-offset-dark-surface transition-all duration-150 ease-in-out shadow-md hover:shadow-lg"
          >
            Save Appearance Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default WidgetContainerSettingsModal;
