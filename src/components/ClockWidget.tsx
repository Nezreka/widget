// src/components/ClockWidget.tsx
"use client";

import React, { useState, useEffect } from 'react';

// --- Interfaces & Types ---
export interface ClockWidgetSettings {
  displayType?: 'analog' | 'digital';
  showSeconds?: boolean; // Common setting for both
  hourFormat?: '12' | '24'; // For digital clock
}

interface ClockWidgetProps {
  settings?: ClockWidgetSettings;
  id: string; // Widget ID for unique form elements in settings, but might be unused in ClockWidget display itself
}

// --- Clock Settings Panel ---
interface ClockSettingsPanelProps {
  widgetId: string; // To make input IDs unique
  currentSettings: ClockWidgetSettings | undefined;
  onSave: (newSettings: ClockWidgetSettings) => void;
}

export const ClockSettingsPanel: React.FC<ClockSettingsPanelProps> = ({ widgetId, currentSettings, onSave }) => {
  // Initialize state with current settings or defaults
  const [displayType, setDisplayType] = useState<'analog' | 'digital'>(currentSettings?.displayType || 'digital');
  const [showSeconds, setShowSeconds] = useState<boolean>(currentSettings?.showSeconds === undefined ? true : currentSettings.showSeconds);
  const [hourFormat, setHourFormat] = useState<'12' | '24'>(currentSettings?.hourFormat || '12');

  const handleSaveClick = () => {
    onSave({
      displayType,
      showSeconds,
      hourFormat
    });
  };

  // Unique IDs for form elements to ensure proper label association
  const displayTypeId = `clock-display-type-${widgetId}`;
  const showSecondsId = `clock-show-seconds-${widgetId}`;
  const hourFormatId = `clock-hour-format-${widgetId}`;

  return (
    <div className="space-y-4 text-primary">
      {/* Clock Style Selection */}
      <div>
        <label htmlFor={displayTypeId} className="block text-sm font-medium text-secondary mb-1">
          Clock Style:
        </label>
        <select
          id={displayTypeId}
          value={displayType}
          onChange={(e) => setDisplayType(e.target.value as 'analog' | 'digital')}
          className="mt-1 block w-full px-3 py-2 bg-widget border border-border-interactive rounded-md shadow-sm focus:outline-none focus:ring-accent-primary focus:border-accent-primary sm:text-sm text-primary"
        >
          <option value="digital">Digital</option>
          <option value="analog">Analog</option>
        </select>
      </div>

      {/* Show Seconds Toggle */}
      <div>
        <label htmlFor={showSecondsId} className="flex items-center text-sm font-medium text-secondary cursor-pointer">
          <input
            type="checkbox"
            id={showSecondsId}
            checked={showSeconds}
            onChange={(e) => setShowSeconds(e.target.checked)}
            className="h-4 w-4 text-accent-primary focus:ring-accent-primary border-border-interactive rounded mr-2 bg-widget" // Tailwind class for checkbox
          />
          Show Seconds Hand/Digits
        </label>
      </div>

      {/* Hour Format Selection (only for Digital) */}
      {displayType === 'digital' && (
        <div>
          <label htmlFor={hourFormatId} className="block text-sm font-medium text-secondary mb-1">
            Hour Format (Digital):
          </label>
          <select
            id={hourFormatId}
            value={hourFormat}
            onChange={(e) => setHourFormat(e.target.value as '12' | '24')}
            className="mt-1 block w-full px-3 py-2 bg-widget border border-border-interactive rounded-md shadow-sm focus:outline-none focus:ring-accent-primary focus:border-accent-primary sm:text-sm text-primary"
          >
            <option value="12">12-Hour</option>
            <option value="24">24-Hour</option>
          </select>
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSaveClick}
        className="mt-6 w-full px-4 py-2 bg-accent-primary text-on-accent rounded-md hover:bg-accent-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary focus:ring-offset-dark-surface"
      >
        Save Clock Settings
      </button>
    </div>
  );
};


// --- Main ClockWidget Component ---
// Removed 'id' from props destructuring as it's not used within this component
const ClockWidget: React.FC<ClockWidgetProps> = ({ settings }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Apply settings or defaults
  const displayType = settings?.displayType || 'digital';
  const showSecondsSetting = settings?.showSeconds === undefined ? true : settings.showSeconds;
  const hourFormatSetting = settings?.hourFormat || '12';

  // Effect to update time every second
  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    // Cleanup timer on component unmount
    return () => clearInterval(timerId);
  }, []);

  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const seconds = currentTime.getSeconds();

  // --- Analog Clock Rendering ---
  const AnalogClockDisplay = () => {
    const clockSize = 200; // SVG viewport size, can be adjusted
    const center = clockSize / 2;
    const strokeWidth = 2;
    const majorTickSize = 8;
    const minorTickSize = 4;
    const handBaseOffset = 10; // How much hands extend past the center towards the pivot

    // Hand lengths relative to clock radius
    const secondHandLength = center * 0.85;
    const minuteHandLength = center * 0.75;
    const hourHandLength = center * 0.55;

    // Calculate hand rotations
    const secDeg = (seconds / 60) * 360;
    const minDeg = ((minutes + seconds / 60) / 60) * 360; // Include seconds for smoother minute hand
    const hourDeg = (((hours % 12) + minutes / 60 + seconds / 3600) / 12) * 360; // Include minutes and seconds for smoother hour hand

    return (
      <div className="w-full h-full flex items-center justify-center p-2"> {/* Padding for aesthetics */}
        <svg viewBox={`0 0 ${clockSize} ${clockSize}`} className="w-full h-full max-w-[200px] max-h-[200px] aspect-square"> {/* Responsive SVG */}
          {/* Clock Face */}
          <circle cx={center} cy={center} r={center - strokeWidth} fill="var(--dark-surface)" stroke="var(--dark-text-secondary)" strokeWidth={strokeWidth} />
          {/* Center dot */}
          <circle cx={center} cy={center} r={center * 0.05} fill="var(--dark-text-primary)" />

          {/* Hour and Minute Ticks */}
          {Array.from({ length: 12 }).map((_, i) => ( // Major ticks (for hours)
            <line
              key={`major-${i}`}
              x1={center}
              y1={center - (center - strokeWidth - majorTickSize)}
              x2={center}
              y2={center - (center - strokeWidth)}
              stroke="var(--dark-text-secondary)"
              strokeWidth={2.5} // Thicker for major ticks
              transform={`rotate(${i * 30} ${center} ${center})`} // 360/12 = 30 degrees per hour
            />
          ))}
          {Array.from({ length: 60 }).map((_, i) => { // Minor ticks (for minutes)
            if (i % 5 === 0) return null; // Skip positions where major ticks are
            return (
              <line
                key={`minor-${i}`}
                x1={center}
                y1={center - (center - strokeWidth - minorTickSize)}
                x2={center}
                y2={center - (center - strokeWidth)}
                stroke="var(--dark-text-secondary)"
                strokeWidth={1} // Thinner for minor ticks
                transform={`rotate(${i * 6} ${center} ${center})`} // 360/60 = 6 degrees per minute
              />
            );
          })}

          {/* Hour Hand */}
          <line
            x1={center}
            y1={center + handBaseOffset} // Start slightly past center for traditional look
            x2={center}
            y2={center - hourHandLength}
            stroke="var(--dark-text-primary)"
            strokeWidth={5} // Thickest hand
            strokeLinecap="round"
            transform={`rotate(${hourDeg} ${center} ${center})`}
          />
          {/* Minute Hand */}
          <line
            x1={center}
            y1={center + handBaseOffset}
            x2={center}
            y2={center - minuteHandLength}
            stroke="var(--dark-text-primary)"
            strokeWidth={4} // Medium thickness
            strokeLinecap="round"
            transform={`rotate(${minDeg} ${center} ${center})`}
          />
          {/* Second Hand (conditionally rendered) */}
          {showSecondsSetting && (
            <line
              x1={center}
              y1={center + handBaseOffset * 1.2} // Slightly more offset for second hand
              x2={center}
              y2={center - secondHandLength}
              stroke="var(--dark-accent-primary)" // Accent color for second hand
              strokeWidth={2} // Thinnest hand
              strokeLinecap="round"
              transform={`rotate(${secDeg} ${center} ${center})`}
            />
          )}
        </svg>
      </div>
    );
  };

  // --- Digital Clock Rendering ---
  const DigitalClockDisplay = () => {
    let displayHours = hours;
    const ampm = hours >= 12 ? 'PM' : 'AM';

    if (hourFormatSetting === '12') {
      displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM/PM
    }

    // Format time components with leading zeros
    const timeString = `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    const secondsString = showSecondsSetting ? `:${String(seconds).padStart(2, '0')}` : '';
    const ampmString = hourFormatSetting === '12' ? ` ${ampm}` : '';

    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-primary p-4">
        <div className="text-5xl md:text-6xl font-light tabular-nums tracking-tight"> {/* Tabular nums for consistent spacing */}
          {timeString}
          {showSecondsSetting && <span className="text-4xl md:text-5xl">{secondsString}</span>}
        </div>
        {hourFormatSetting === '12' && <div className="text-xl md:text-2xl font-medium tracking-wide">{ampmString}</div>}
      </div>
    );
  };


  return (
    // Container ensures the clock content fills the widget area
    <div className="bg-transparent w-full h-full overflow-hidden">
      {displayType === 'analog' ? <AnalogClockDisplay /> : <DigitalClockDisplay />}
    </div>
  );
};

export default ClockWidget;
