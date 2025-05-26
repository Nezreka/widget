// src/components/WidgetContainerSettingsModal.tsx
"use client";

import React, { useState, useEffect } from 'react';
// Assuming Widget.tsx exports WidgetContainerSettings and it's in the same directory or adjust path
import { type WidgetContainerSettings } from './Widget'; 

// Import only the types needed from widgetConfig.ts
// The actual WIDGET_SIZE_PRESETS object is expected via the availableSizePresets prop.
import { type WidgetSizePresetKey, type WidgetSizePresetDetails } from '@/definitions/widgetConfig'; 
// Assuming ApplySizePresetIcon is correctly imported from your Icons.tsx
import { ApplySizePresetIcon } from '@/components/Icons'; 

export type InnerPaddingType =
  | 'p-0'
  | 'px-1.5 py-1'
  | 'px-2.5 py-2'
  | 'px-3.5 py-3'
  | 'px-5 py-4';

const DEFAULT_INNER_PADDING: InnerPaddingType = 'px-3.5 py-3';
const DEFAULT_OPACITY: number = 1; // Default opacity is 1 (fully opaque)

interface WidgetContainerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgetId: string;
  currentSettings?: WidgetContainerSettings;
  onSave: (widgetId: string, newSettings: WidgetContainerSettings) => void;
  widgetTitle?: string;
  // This prop receives the WIDGET_SIZE_PRESETS object
  availableSizePresets: Record<WidgetSizePresetKey, WidgetSizePresetDetails>; 
  onApplySizePreset: (widgetId: string, presetKey: WidgetSizePresetKey) => void;
  currentWidgetSize: { colSpan: number; rowSpan: number }; 
}

const WidgetContainerSettingsModal: React.FC<WidgetContainerSettingsModalProps> = ({
  isOpen,
  onClose,
  widgetId,
  currentSettings,
  onSave,
  widgetTitle,
  availableSizePresets, // This prop is used to access the presets
  onApplySizePreset,
  // currentWidgetSize // Available if needed for more complex logic
}) => {
  const [containerBackgroundColor, setContainerBackgroundColor] = useState(currentSettings?.containerBackgroundColor || '');
  const [alwaysShowTitleBar, setAlwaysShowTitleBar] = useState(currentSettings?.alwaysShowTitleBar ?? false);
  const [innerPadding, setInnerPadding] = useState<InnerPaddingType>(
    (currentSettings?.innerPadding as InnerPaddingType) || DEFAULT_INNER_PADDING
  );
  const [selectedPresetKey, setSelectedPresetKey] = useState<WidgetSizePresetKey | ''>('');
  const [borderColor, setBorderColor] = useState(currentSettings?.borderColor || '');
  const [opacity, setOpacity] = useState(currentSettings?.opacity ?? DEFAULT_OPACITY);


  useEffect(() => {
    if (isOpen) {
        setContainerBackgroundColor(currentSettings?.containerBackgroundColor || '');
        setAlwaysShowTitleBar(currentSettings?.alwaysShowTitleBar ?? false);
        setInnerPadding((currentSettings?.innerPadding as InnerPaddingType) || DEFAULT_INNER_PADDING);
        setBorderColor(currentSettings?.borderColor || '');
        setOpacity(currentSettings?.opacity ?? DEFAULT_OPACITY);
        setSelectedPresetKey(''); 
    }
  }, [currentSettings, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSaveAppearanceSettings = () => {
    onSave(widgetId, {
      containerBackgroundColor: containerBackgroundColor.trim() === '' ? undefined : containerBackgroundColor,
      alwaysShowTitleBar,
      innerPadding,
      borderColor: borderColor.trim() === '' ? undefined : borderColor,
      opacity: opacity,
    });
    // onClose(); // Optional: close modal on save
  };

  const handlePresetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const presetKey = event.target.value as WidgetSizePresetKey;
    setSelectedPresetKey(presetKey); 
    if (presetKey && availableSizePresets[presetKey]) {
      onApplySizePreset(widgetId, presetKey);
    }
  };

  const paddingOptions: { label: string; value: InnerPaddingType }[] = [
    { label: 'None (0px)', value: 'p-0' },
    { label: 'X-Small (6px / 4px)', value: 'px-1.5 py-1'},
    { label: 'Small (10px / 8px)', value: 'px-2.5 py-2' },
    { label: 'Medium (14px / 12px - Default)', value: 'px-3.5 py-3' },
    { label: 'Large (20px / 16px)', value: 'px-5 py-4' },
  ];

  const commonInputClass = "mt-1 block w-full px-3 py-2.5 bg-widget border border-border-interactive rounded-md shadow-sm focus:outline-none focus:ring-accent-primary focus:border-accent-primary sm:text-sm text-primary dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100";
  const commonLabelClass = "block text-sm font-medium text-secondary dark:text-slate-300 mb-1";
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

        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
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
                const presetDetails = availableSizePresets[presetKeyTyped]; 
                return (
                  <option key={key} value={key}>
                    {key.replace(/_/g, ' ')}
                    {presetDetails && ` (${presetDetails.targetWidthPx}px x ${presetDetails.targetHeightPx}px)`}
                  </option>
                );
              })}
            </select>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Applies preset size. May rearrange grid if needed.
            </p>
          </div>

           <hr className="border-slate-200 dark:border-slate-700 my-4" />

          <div>
            <label htmlFor={`container-bg-color-text-${widgetId}`} className={commonLabelClass}>
              Background Color:
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
                placeholder="e.g., #RRGGBB or empty"
                value={containerBackgroundColor}
                onChange={(e) => setContainerBackgroundColor(e.target.value)}
                className={`${commonInputClass} flex-grow`}
                aria-label="Background color hex code"
              />
              <button
                onClick={() => setContainerBackgroundColor('')}
                className="px-3 py-2 text-xs bg-slate-500 hover:bg-slate-600 text-white rounded-md transition-colors dark:bg-slate-600 dark:hover:bg-slate-500"
                title="Clear background color"
              >
                Clear
              </button>
            </div>
          </div>
          
          <div>
            <label htmlFor={`border-color-text-${widgetId}`} className={commonLabelClass}>
              Border Color:
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                id={`border-color-picker-${widgetId}`}
                value={borderColor || '#cccccc'}
                onChange={(e) => setBorderColor(e.target.value)}
                className="w-10 h-10 p-0 border-none rounded-md cursor-pointer bg-transparent appearance-none"
                aria-label="Select border color"
                style={{backgroundColor: borderColor || 'transparent'}}
              />
              <input
                type="text"
                id={`border-color-text-${widgetId}`}
                placeholder="e.g., #RRGGBB or empty"
                value={borderColor}
                onChange={(e) => setBorderColor(e.target.value)}
                className={`${commonInputClass} flex-grow`}
                aria-label="Border color hex code"
              />
              <button
                onClick={() => setBorderColor('')}
                className="px-3 py-2 text-xs bg-slate-500 hover:bg-slate-600 text-white rounded-md transition-colors dark:bg-slate-600 dark:hover:bg-slate-500"
                title="Clear border color to use theme default"
              >
                Clear
              </button>
            </div>
          </div>

          <div>
            <label htmlFor={`opacity-slider-${widgetId}`} className={commonLabelClass}>
              Opacity: <span className="font-normal text-xs">({opacity.toFixed(2)})</span>
            </label>
            <input
              type="range"
              id={`opacity-slider-${widgetId}`}
              min="0"
              max="1"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className={`w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-blue-600 dark:accent-blue-500`}
            />
          </div>

          <div>
            <label htmlFor={`always-show-title-${widgetId}`} className="flex items-center text-sm font-medium text-secondary dark:text-slate-300 cursor-pointer mt-2">
              <input
                type="checkbox"
                id={`always-show-title-${widgetId}`}
                checked={alwaysShowTitleBar}
                onChange={(e) => setAlwaysShowTitleBar(e.target.checked)}
                className="h-4 w-4 text-accent-primary focus:ring-accent-primary border-border-interactive rounded mr-2.5 bg-widget dark:bg-slate-700 dark:border-slate-600"
              />
              Always Show Title Bar
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
            className={`${commonButtonClass} mt-6 w-full bg-accent-primary text-on-accent hover:bg-accent-primary-hover dark:bg-blue-600 dark:hover:bg-blue-500`}
          >
            Save Appearance Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default WidgetContainerSettingsModal;
