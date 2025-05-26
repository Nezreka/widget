// src/components/WidgetContainerSettingsModal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { WidgetContainerSettings } from './Widget'; // Assuming Widget.tsx exports this

// UPDATED: Import WIDGET_SIZE_PRESETS and WidgetSizePresetKey from a new definitions file (to be created)
import { WIDGET_SIZE_PRESETS, WidgetSizePresetKey } from '@/definitions/widgetConfig';
// UPDATED: Import ApplySizePresetIcon from the dedicated Icons.tsx file
import { ApplySizePresetIcon } from '@/components/Icons';

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
  widgetTitle?: string;
  // New props for size presets
  availableSizePresets: typeof WIDGET_SIZE_PRESETS;
  onApplySizePreset: (widgetId: string, presetKey: WidgetSizePresetKey) => void;
  currentWidgetSize: { colSpan: number; rowSpan: number }; // To potentially indicate current preset
}

const WidgetContainerSettingsModal: React.FC<WidgetContainerSettingsModalProps> = ({
  isOpen,
  onClose,
  widgetId,
  currentSettings,
  onSave,
  widgetTitle,
  availableSizePresets, // Destructure new props
  onApplySizePreset,
  currentWidgetSize
}) => {
  const [containerBackgroundColor, setContainerBackgroundColor] = useState(currentSettings?.containerBackgroundColor || '');
  const [alwaysShowTitleBar, setAlwaysShowTitleBar] = useState(currentSettings?.alwaysShowTitleBar ?? false);
  const [innerPadding, setInnerPadding] = useState<InnerPaddingType>(
    (currentSettings?.innerPadding as InnerPaddingType) || DEFAULT_INNER_PADDING
  );
  const [selectedPresetKey, setSelectedPresetKey] = useState<WidgetSizePresetKey | ''>('');

  useEffect(() => {
    if (isOpen) {
        setContainerBackgroundColor(currentSettings?.containerBackgroundColor || '');
        setAlwaysShowTitleBar(currentSettings?.alwaysShowTitleBar ?? false);
        setInnerPadding((currentSettings?.innerPadding as InnerPaddingType) || DEFAULT_INNER_PADDING);

        // Determine the matching preset key and assign to a const
        // LINT FIX: Changed 'let matchingKey' to 'const matchingKey' as it's never reassigned.
        const determinedMatchingPreset: WidgetSizePresetKey | '' = (() => {
            const matchingKey: WidgetSizePresetKey | '' = ''; // Initialize as const, will be returned by IIFE
            // Placeholder: Actual matching logic would go here if needed before returning.
            // For the lint error, the key point is that if 'matchingKey' within this IIFE
            // was intended to be reassigned, that logic isn't present.
            // If it's assigned once based on some conditions and then returned, 'const' is fine.
            // The original code had 'let matchingKey: WidgetSizePresetKey | "" = "";'
            // and then potentially a loop that *could* reassign it.
            // However, the loop was commented out or incomplete.
            // For the provided snippet where the loop is commented:
            if (availableSizePresets && typeof availableSizePresets === 'object') {
                for (const key in availableSizePresets) {
                    if (Object.prototype.hasOwnProperty.call(availableSizePresets, key)) {
                        const presetKeyTyped = key as WidgetSizePresetKey;
                        const presetDetails = availableSizePresets[presetKeyTyped];
                        if (presetDetails && typeof presetDetails.targetWidthPx === 'number' && typeof presetDetails.targetHeightPx === 'number') {
                            // Placeholder for actual matching logic.
                            // This needs to be implemented based on how CELL_SIZE is accessed or passed,
                            // and how presets are meant to be matched against currentWidgetSize.
                            // For example:
                            // const CELL_SIZE_HERE = 30; // This needs to come from context or props
                            // const presetColSpan = Math.round(presetDetails.targetWidthPx / CELL_SIZE_HERE);
                            // const presetRowSpan = Math.round(presetDetails.targetHeightPx / CELL_SIZE_HERE);
                            // if (presetColSpan === currentWidgetSize.colSpan && presetRowSpan === currentWidgetSize.rowSpan) {
                            //   // If this assignment happened, 'matchingKey' would need to be 'let'
                            //   // matchingKey = presetKeyTyped;
                            //   // break;
                            // }
                        }
                    }
                }
            }
            return matchingKey; // Returns the initially assigned (or potentially reassigned if logic existed) value
        })();
        setSelectedPresetKey(determinedMatchingPreset);
    }
  }, [currentSettings, isOpen, availableSizePresets, currentWidgetSize]);

  if (!isOpen) {
    return null;
  }

  const handleSaveAppearanceSettings = () => {
    onSave(widgetId, {
      containerBackgroundColor: containerBackgroundColor.trim() === '' ? undefined : containerBackgroundColor,
      alwaysShowTitleBar,
      innerPadding,
    });
    // Note: Applying a preset might close the modal via its own logic in page.tsx
    // If only appearance settings are saved, we might want to keep it open or close it based on UX preference.
    // For now, let's assume saving appearance doesn't auto-close, but applying preset does.
  };

  const handlePresetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const presetKey = event.target.value as WidgetSizePresetKey;
    setSelectedPresetKey(presetKey); // Update local state for the dropdown
    if (presetKey) {
      onApplySizePreset(widgetId, presetKey);
      // The modal will be closed by page.tsx if preset application is successful
    }
  };

  const paddingOptions: { label: string; value: InnerPaddingType }[] = [
    { label: 'None (0px)', value: 'p-0' },
    { label: 'X-Small (6px / 4px)', value: 'px-1.5 py-1'},
    { label: 'Small (10px / 8px)', value: 'px-2.5 py-2' },
    { label: 'Medium (14px / 12px - Default)', value: 'px-3.5 py-3' },
    { label: 'Large (20px / 16px)', value: 'px-5 py-4' },
  ];

  const commonInputClass = "mt-1 block w-full px-3 py-2.5 bg-widget border border-border-interactive rounded-md shadow-sm focus:outline-none focus:ring-accent-primary focus:border-accent-primary sm:text-sm text-primary";
  const commonLabelClass = "block text-sm font-medium text-secondary mb-1";
  const commonButtonClass = "px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-surface";


  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalFadeInScale"
        onClick={(e) => e.stopPropagation()}
      >
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

        <div className="space-y-5">
          {/* Resize to Preset Section */}
          <div>
            <label htmlFor={`widget-size-preset-${widgetId}`} className={`${commonLabelClass} flex items-center`}>
              <ApplySizePresetIcon /> <span className="ml-2">Resize to Preset:</span>
            </label>
            <select
              id={`widget-size-preset-${widgetId}`}
              value={selectedPresetKey}
              onChange={handlePresetChange}
              className={commonInputClass}
            >
              <option value="">-- Select a size preset --</option>
              {availableSizePresets && typeof availableSizePresets === 'object' && Object.keys(availableSizePresets).map((key) => {
                const presetKeyTyped = key as WidgetSizePresetKey;
                // const preset = availableSizePresets[presetKeyTyped]; // 'preset' is assigned a value but never used.
                                                                      // This variable is removed to fix the lint error.
                                                                      // If it's needed for future logic (e.g., displaying targetPx), it should be used.
                const isCurrent = selectedPresetKey === presetKeyTyped;
                return (
                  <option key={key} value={key}>
                    {key.replace(/_/g, ' ')}
                    {/* ({preset.targetWidthPx}px x {preset.targetHeightPx}px) */} {/* This would require 'preset' variable */}
                    {isCurrent ? " (Selected)" : ""}
                  </option>
                );
              })}
            </select>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Applies preset size. May rearrange grid if needed.
            </p>
          </div>

           {/* Divider */}
          <hr className="border-slate-200 dark:border-slate-700 my-4" />


          <div>
            <label htmlFor={`container-bg-color-${widgetId}`} className={commonLabelClass}>
              Container Background Color:
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                id={`container-bg-color-picker-${widgetId}`}
                value={containerBackgroundColor || '#ffffff'}
                onChange={(e) => setContainerBackgroundColor(e.target.value)}
                className="w-10 h-10 p-0 border-none rounded-md cursor-pointer bg-transparent appearance-none"
                aria-label="Select background color"
                style={{backgroundColor: containerBackgroundColor || 'transparent'}}
              />
              <input
                type="text"
                id={`container-bg-color-text-${widgetId}`}
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

          <div>
            <label htmlFor={`inner-padding-${widgetId}`} className={commonLabelClass}>
              Content Inner Padding:
            </label>
            <select
              id={`inner-padding-${widgetId}`}
              value={innerPadding}
              onChange={(e) => setInnerPadding(e.target.value as InnerPaddingType)}
              className={commonInputClass}
            >
              {paddingOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSaveAppearanceSettings}
            className={`${commonButtonClass} mt-6 w-full bg-accent-primary text-on-accent hover:bg-accent-primary-hover`}
          >
            Save Appearance Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default WidgetContainerSettingsModal;
