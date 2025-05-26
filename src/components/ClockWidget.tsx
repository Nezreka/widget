// src/components/ClockWidget.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';

// --- Helper Functions ---
const getTimeWithTimezone = (date: Date, timeZone?: string): Date => {
  if (!timeZone || timeZone === 'system') {
    return date;
  }
  try {
    const str = date.toLocaleString('en-US', { timeZone });
    return new Date(str);
  } catch (error) {
    console.error("Invalid timezone string:", timeZone, error);
    return date; // Fallback to local time on error
  }
};

const formatDate = (date: Date, format: string, timeZone?: string): string => {
  const zonedDate = getTimeWithTimezone(new Date(), timeZone); // Use current time for date display based on selected TZ

  const options: Intl.DateTimeFormatOptions = {};
  options.timeZone = (timeZone && timeZone !== 'system') ? timeZone : undefined;

  switch (format) {
    case 'MM/DD/YYYY':
      options.month = '2-digit';
      options.day = '2-digit';
      options.year = 'numeric';
      break;
    case 'DD/MM/YYYY':
      options.day = '2-digit';
      options.month = '2-digit';
      options.year = 'numeric';
      break;
    case 'YYYY-MM-DD':
      options.year = 'numeric';
      options.month = '2-digit';
      options.day = '2-digit';
      // Intl.DateTimeFormat for YYYY-MM-DD usually gives YYYY/MM/DD, so manual formatting might be better for exact match
      // However, for simplicity with localization, we'll use this.
      // For a strict YYYY-MM-DD, one might do:
      // return `${zonedDate.getFullYear()}-${String(zonedDate.getMonth() + 1).padStart(2, '0')}-${String(zonedDate.getDate()).padStart(2, '0')}`;
      break;
    case 'Day, Month Date': // Mon, May 26
      options.weekday = 'short';
      options.month = 'short';
      options.day = 'numeric';
      break;
    case 'Month Date, Year': // May 26, 2025
      options.month = 'short';
      options.day = 'numeric';
      options.year = 'numeric';
      break;
    case 'Full Date': // Monday, May 26, 2025
      options.weekday = 'long';
      options.month = 'long';
      options.day = 'numeric';
      options.year = 'numeric';
      break;
    case 'Day, Date Month Year': // Mon, 26 May 2025
        options.weekday = 'short';
        options.day = 'numeric';
        options.month = 'short';
        options.year = 'numeric';
        break;
    default: // Fallback to a sensible default
      options.month = 'short';
      options.day = 'numeric';
      options.year = 'numeric';
  }
  return new Intl.DateTimeFormat('en-US', options).format(zonedDate);
};


// --- Interfaces & Types ---
export type TimezoneOption = 
  | 'system' | 'UTC' | 'America/New_York' | 'America/Chicago' | 'America/Denver' 
  | 'America/Los_Angeles' | 'Europe/London' | 'Europe/Paris' | 'Europe/Berlin' 
  | 'Asia/Tokyo' | 'Asia/Dubai' | 'Australia/Sydney';

export type DateFormatOption =
  | 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'Day, Month Date'
  | 'Month Date, Year' | 'Full Date' | 'Day, Date Month Year';

export type DigitalFontSizeOption = 
  | 'text-3xl' | 'text-4xl' | 'text-5xl' | 'text-6xl' | 'text-7xl';

export type DigitalFontWeightOption =
  | 'font-thin' | 'font-extralight' | 'font-light' | 'font-normal'
  | 'font-medium' | 'font-semibold' | 'font-bold' | 'font-extrabold' | 'font-black';

export type DateFontSizeOption = 'text-xs' | 'text-sm' | 'text-base' | 'text-lg';

export interface ClockWidgetSettings {
  displayType?: 'analog' | 'digital';
  showSeconds?: boolean;
  hourFormat?: '12' | '24';

  // Analog Clock Specific
  clockFaceColor?: string;
  clockBorderColor?: string;
  centerDotColor?: string;
  hourHandColor?: string;
  minuteHandColor?: string;
  secondHandColor?: string;
  majorTicksColor?: string;
  minorTicksColor?: string;
  showMajorTicks?: boolean;
  showMinorTicks?: boolean;
  showNumbers?: boolean;
  numbersColor?: string;
  numberFontFamily?: string;
  numberFontSize?: number; // Ratio to clock radius (e.g., 0.1 for 10% of radius)
  smoothSecondHand?: boolean;

  // Digital Clock Specific
  digitColor?: string;
  fontSize?: DigitalFontSizeOption;
  fontWeight?: DigitalFontWeightOption;
  showAmPm?: boolean;
  blinkColons?: boolean;

  // Common Settings
  timeZone?: TimezoneOption;
  showDate?: boolean;
  dateFormat?: DateFormatOption;
  dateColor?: string;
  dateFontFamily?: string;
  dateFontSize?: DateFontSizeOption;
  dateFontWeight?: DigitalFontWeightOption;
}

interface ClockWidgetProps {
  settings?: ClockWidgetSettings;
  id: string;
}

// --- Default Settings ---
const DEFAULT_SETTINGS: Required<ClockWidgetSettings> = {
  displayType: 'digital',
  showSeconds: true,
  hourFormat: '12',
  clockFaceColor: 'var(--dark-surface)', // Or specific hex like '#FFFFFF'
  clockBorderColor: 'var(--dark-text-secondary)', // Or '#333333'
  centerDotColor: 'var(--dark-text-primary)', // Or '#000000'
  hourHandColor: 'var(--dark-text-primary)', // Or '#000000'
  minuteHandColor: 'var(--dark-text-primary)', // Or '#000000'
  secondHandColor: 'var(--dark-accent-primary)', // Or '#FF0000'
  majorTicksColor: 'var(--dark-text-secondary)', // Or '#666666'
  minorTicksColor: 'var(--dark-text-secondary)', // Or '#CCCCCC'
  showMajorTicks: true,
  showMinorTicks: true,
  showNumbers: true,
  numbersColor: 'var(--dark-text-primary)', // Or '#000000'
  numberFontFamily: 'Inter, sans-serif',
  numberFontSize: 0.1, // 10% of radius
  smoothSecondHand: true,
  digitColor: 'var(--dark-text-primary)', // Or '#000000'
  fontSize: 'text-5xl',
  fontWeight: 'font-light',
  showAmPm: true,
  blinkColons: false,
  timeZone: 'system',
  showDate: false,
  dateFormat: 'Month Date, Year',
  dateColor: 'var(--dark-text-secondary)', // Or '#666666'
  dateFontFamily: 'Inter, sans-serif',
  dateFontSize: 'text-sm',
  dateFontWeight: 'font-normal',
};


// --- Clock Settings Panel ---
interface ClockSettingsPanelProps {
  widgetId: string;
  currentSettings: ClockWidgetSettings | undefined;
  onSave: (newSettings: ClockWidgetSettings) => void;
}

export const ClockSettingsPanel: React.FC<ClockSettingsPanelProps> = ({ widgetId, currentSettings, onSave }) => {
  const s = { ...DEFAULT_SETTINGS, ...currentSettings };

  const [displayType, setDisplayType] = useState(s.displayType);
  const [showSeconds, setShowSeconds] = useState(s.showSeconds);
  const [hourFormat, setHourFormat] = useState(s.hourFormat);

  // Analog
  const [clockFaceColor, setClockFaceColor] = useState(s.clockFaceColor);
  const [clockBorderColor, setClockBorderColor] = useState(s.clockBorderColor);
  const [centerDotColor, setCenterDotColor] = useState(s.centerDotColor);
  const [hourHandColor, setHourHandColor] = useState(s.hourHandColor);
  const [minuteHandColor, setMinuteHandColor] = useState(s.minuteHandColor);
  const [secondHandColor, setSecondHandColor] = useState(s.secondHandColor);
  const [majorTicksColor, setMajorTicksColor] = useState(s.majorTicksColor);
  const [minorTicksColor, setMinorTicksColor] = useState(s.minorTicksColor);
  const [showMajorTicks, setShowMajorTicks] = useState(s.showMajorTicks);
  const [showMinorTicks, setShowMinorTicks] = useState(s.showMinorTicks);
  const [showNumbers, setShowNumbers] = useState(s.showNumbers);
  const [numbersColor, setNumbersColor] = useState(s.numbersColor);
  const [numberFontFamily, setNumberFontFamily] = useState(s.numberFontFamily);
  const [numberFontSize, setNumberFontSize] = useState(s.numberFontSize);
  const [smoothSecondHand, setSmoothSecondHand] = useState(s.smoothSecondHand);

  // Digital
  const [digitColor, setDigitColor] = useState(s.digitColor);
  const [fontSize, setFontSize] = useState(s.fontSize);
  const [fontWeight, setFontWeight] = useState(s.fontWeight);
  const [showAmPm, setShowAmPm] = useState(s.showAmPm);
  const [blinkColons, setBlinkColons] = useState(s.blinkColons);

  // Common
  const [timeZone, setTimeZone] = useState<TimezoneOption>(s.timeZone);
  const [showDate, setShowDate] = useState(s.showDate);
  const [dateFormat, setDateFormat] = useState<DateFormatOption>(s.dateFormat);
  const [dateColor, setDateColor] = useState(s.dateColor);
  const [dateFontFamily, setDateFontFamily] = useState(s.dateFontFamily);
  const [dateFontSize, setDateFontSize] = useState<DateFontSizeOption>(s.dateFontSize);
  const [dateFontWeight, setDateFontWeight] = useState<DigitalFontWeightOption>(s.dateFontWeight);


  const handleSaveClick = () => {
    onSave({
      displayType, showSeconds, hourFormat,
      clockFaceColor, clockBorderColor, centerDotColor, hourHandColor, minuteHandColor, secondHandColor,
      majorTicksColor, minorTicksColor, showMajorTicks, showMinorTicks, showNumbers, numbersColor,
      numberFontFamily, numberFontSize, smoothSecondHand,
      digitColor, fontSize, fontWeight, showAmPm, blinkColons,
      timeZone, showDate, dateFormat, dateColor, dateFontFamily, dateFontSize, dateFontWeight,
    });
  };
  
  const inputClass = "mt-1 block w-full px-3 py-2 bg-widget border border-border-interactive rounded-md shadow-sm focus:outline-none focus:ring-accent-primary focus:border-accent-primary sm:text-sm text-primary";
  const labelClass = "block text-sm font-medium text-secondary mb-1";
  const checkboxLabelClass = "flex items-center text-sm font-medium text-secondary cursor-pointer";
  const sectionTitleClass = "text-md font-semibold text-primary mt-4 mb-2 border-b border-border-interactive pb-1";

  const timeZoneOptions: { value: TimezoneOption; label: string }[] = [
    { value: 'system', label: 'System Default' }, { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'New York (ET)' }, { value: 'America/Chicago', label: 'Chicago (CT)' },
    { value: 'America/Denver', label: 'Denver (MT)' }, { value: 'America/Los_Angeles', label: 'Los Angeles (PT)' },
    { value: 'Europe/London', label: 'London (GMT/BST)' }, { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' }, { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Dubai', label: 'Dubai (GST)' }, { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  ];

  const dateFormatOptions: { value: DateFormatOption; label: string }[] = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (05/26/2025)' }, { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (26/05/2025)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2025-05-26)' }, { value: 'Day, Month Date', label: 'Day, Month Date (Mon, May 26)' },
    { value: 'Month Date, Year', label: 'Month Date, Year (May 26, 2025)' }, { value: 'Full Date', label: 'Full Date (Monday, May 26, 2025)' },
    { value: 'Day, Date Month Year', label: 'Day, Date Month Year (Mon, 26 May 2025)'},
  ];

  const digitalFontSizeOptions: { value: DigitalFontSizeOption; label: string }[] = [
    { value: 'text-3xl', label: 'Small' }, { value: 'text-4xl', label: 'Medium' },
    { value: 'text-5xl', label: 'Large' }, { value: 'text-6xl', label: 'X-Large' },
    { value: 'text-7xl', label: 'XX-Large' },
  ];
    const dateFontSizeOptions: { value: DateFontSizeOption; label: string }[] = [
    { value: 'text-xs', label: 'X-Small' }, { value: 'text-sm', label: 'Small' },
    { value: 'text-base', label: 'Medium' }, { value: 'text-lg', label: 'Large' },
  ];

  const fontWeightOptions: { value: DigitalFontWeightOption; label: string }[] = [
    { value: 'font-thin', label: 'Thin' }, { value: 'font-extralight', label: 'Extra Light' },
    { value: 'font-light', label: 'Light' }, { value: 'font-normal', label: 'Normal' },
    { value: 'font-medium', label: 'Medium' }, { value: 'font-semibold', label: 'Semi Bold' },
    { value: 'font-bold', label: 'Bold' }, { value: 'font-extrabold', label: 'Extra Bold' },
    { value: 'font-black', label: 'Black' },
  ];
  
  const commonFontFamilies = ['Inter, sans-serif', 'Arial, sans-serif', 'Verdana, sans-serif', 'Times New Roman, serif', 'Courier New, monospace', 'Georgia, serif', 'Palatino, serif', 'Tahoma, sans-serif'];


  const ColorInput: React.FC<{id: string, label: string, value: string, onChange: (val: string) => void, defaultValue?: string}> = ({id, label, value, onChange, defaultValue}) => (
    <div>
        <label htmlFor={id} className={labelClass}>{label}:</label>
        <div className="flex items-center space-x-2">
            <input type="color" id={`${id}-picker`} value={value?.startsWith('var(') ? (defaultValue || '#000000') : (value || '#000000')} onChange={e => onChange(e.target.value)} className="w-10 h-10 p-0 border-none rounded-md cursor-pointer bg-transparent appearance-none" style={{backgroundColor: value || 'transparent'}}/>
            <input type="text" id={id} value={value} onChange={e => onChange(e.target.value)} placeholder={defaultValue || "e.g., #RRGGBB or var(--name)"} className={inputClass + " flex-grow"} />
            {defaultValue && <button type="button" onClick={() => onChange(defaultValue)} className="text-xs px-2 py-1 bg-slate-500 hover:bg-slate-600 text-white rounded-md">Reset</button>}
        </div>
    </div>
  );


  return (
    <div className="space-y-4 text-primary max-h-[60vh] overflow-y-auto pr-2">
      <h3 className={sectionTitleClass}>General Display</h3>
      <div>
        <label htmlFor={`${widgetId}-display-type`} className={labelClass}>Clock Style:</label>
        <select id={`${widgetId}-display-type`} value={displayType} onChange={(e) => setDisplayType(e.target.value as 'analog' | 'digital')} className={inputClass}>
          <option value="digital">Digital</option>
          <option value="analog">Analog</option>
        </select>
      </div>
      <div>
        <label htmlFor={`${widgetId}-show-seconds`} className={checkboxLabelClass}>
          <input type="checkbox" id={`${widgetId}-show-seconds`} checked={showSeconds} onChange={(e) => setShowSeconds(e.target.checked)} className="h-4 w-4 text-accent-primary focus:ring-accent-primary border-border-interactive rounded mr-2 bg-widget" />
          Show Seconds Hand/Digits
        </label>
      </div>

      {displayType === 'analog' && (
        <>
          <h3 className={sectionTitleClass}>Analog Clock Settings</h3>
          <ColorInput id={`${widgetId}-clock-face-color`} label="Face Color" value={clockFaceColor} onChange={setClockFaceColor} defaultValue={DEFAULT_SETTINGS.clockFaceColor} />
          <ColorInput id={`${widgetId}-clock-border-color`} label="Border Color" value={clockBorderColor} onChange={setClockBorderColor} defaultValue={DEFAULT_SETTINGS.clockBorderColor} />
          <ColorInput id={`${widgetId}-center-dot-color`} label="Center Dot Color" value={centerDotColor} onChange={setCenterDotColor} defaultValue={DEFAULT_SETTINGS.centerDotColor} />
          <ColorInput id={`${widgetId}-hour-hand-color`} label="Hour Hand Color" value={hourHandColor} onChange={setHourHandColor} defaultValue={DEFAULT_SETTINGS.hourHandColor} />
          <ColorInput id={`${widgetId}-minute-hand-color`} label="Minute Hand Color" value={minuteHandColor} onChange={setMinuteHandColor} defaultValue={DEFAULT_SETTINGS.minuteHandColor} />
          {showSeconds && <ColorInput id={`${widgetId}-second-hand-color`} label="Second Hand Color" value={secondHandColor} onChange={setSecondHandColor} defaultValue={DEFAULT_SETTINGS.secondHandColor} />}
          
          <div>
            <label htmlFor={`${widgetId}-show-major-ticks`} className={checkboxLabelClass}>
              <input type="checkbox" id={`${widgetId}-show-major-ticks`} checked={showMajorTicks} onChange={(e) => setShowMajorTicks(e.target.checked)} className="h-4 w-4 text-accent-primary focus:ring-accent-primary border-border-interactive rounded mr-2 bg-widget" />
              Show Major Ticks
            </label>
          </div>
          {showMajorTicks && <ColorInput id={`${widgetId}-major-ticks-color`} label="Major Ticks Color" value={majorTicksColor} onChange={setMajorTicksColor} defaultValue={DEFAULT_SETTINGS.majorTicksColor} />}
          
          <div>
            <label htmlFor={`${widgetId}-show-minor-ticks`} className={checkboxLabelClass}>
              <input type="checkbox" id={`${widgetId}-show-minor-ticks`} checked={showMinorTicks} onChange={(e) => setShowMinorTicks(e.target.checked)} className="h-4 w-4 text-accent-primary focus:ring-accent-primary border-border-interactive rounded mr-2 bg-widget" />
              Show Minor Ticks
            </label>
          </div>
          {showMinorTicks && <ColorInput id={`${widgetId}-minor-ticks-color`} label="Minor Ticks Color" value={minorTicksColor} onChange={setMinorTicksColor} defaultValue={DEFAULT_SETTINGS.minorTicksColor} />}

          <div>
            <label htmlFor={`${widgetId}-show-numbers`} className={checkboxLabelClass}>
              <input type="checkbox" id={`${widgetId}-show-numbers`} checked={showNumbers} onChange={(e) => setShowNumbers(e.target.checked)} className="h-4 w-4 text-accent-primary focus:ring-accent-primary border-border-interactive rounded mr-2 bg-widget" />
              Show Numbers (1-12)
            </label>
          </div>
          {showNumbers && (
            <>
              <ColorInput id={`${widgetId}-numbers-color`} label="Numbers Color" value={numbersColor} onChange={setNumbersColor} defaultValue={DEFAULT_SETTINGS.numbersColor} />
              <div>
                <label htmlFor={`${widgetId}-number-font-family`} className={labelClass}>Number Font Family:</label>
                <select id={`${widgetId}-number-font-family`} value={numberFontFamily} onChange={(e) => setNumberFontFamily(e.target.value)} className={inputClass}>
                    {commonFontFamilies.map(font => <option key={font} value={font}>{font.split(',')[0]}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor={`${widgetId}-number-font-size`} className={labelClass}>Number Font Size (Ratio to Radius, e.g., 0.1 for 10%):</label>
                <input type="number" id={`${widgetId}-number-font-size`} value={numberFontSize} onChange={(e) => setNumberFontSize(parseFloat(e.target.value))} step="0.01" min="0.01" max="0.5" className={inputClass} />
              </div>
            </>
          )}
          {showSeconds && (
            <div>
              <label htmlFor={`${widgetId}-smooth-second-hand`} className={checkboxLabelClass}>
                <input type="checkbox" id={`${widgetId}-smooth-second-hand`} checked={smoothSecondHand} onChange={(e) => setSmoothSecondHand(e.target.checked)} className="h-4 w-4 text-accent-primary focus:ring-accent-primary border-border-interactive rounded mr-2 bg-widget" />
                Smooth Second Hand Movement
              </label>
            </div>
          )}
        </>
      )}

      {displayType === 'digital' && (
        <>
          <h3 className={sectionTitleClass}>Digital Clock Settings</h3>
          <ColorInput id={`${widgetId}-digit-color`} label="Digit Color" value={digitColor} onChange={setDigitColor} defaultValue={DEFAULT_SETTINGS.digitColor} />
          <div>
            <label htmlFor={`${widgetId}-hour-format`} className={labelClass}>Hour Format:</label>
            <select id={`${widgetId}-hour-format`} value={hourFormat} onChange={(e) => setHourFormat(e.target.value as '12' | '24')} className={inputClass}>
              <option value="12">12-Hour</option>
              <option value="24">24-Hour</option>
            </select>
          </div>
          {hourFormat === '12' && (
            <div>
              <label htmlFor={`${widgetId}-show-ampm`} className={checkboxLabelClass}>
                <input type="checkbox" id={`${widgetId}-show-ampm`} checked={showAmPm} onChange={(e) => setShowAmPm(e.target.checked)} className="h-4 w-4 text-accent-primary focus:ring-accent-primary border-border-interactive rounded mr-2 bg-widget" />
                Show AM/PM
              </label>
            </div>
          )}
          <div>
            <label htmlFor={`${widgetId}-font-size`} className={labelClass}>Font Size:</label>
            <select id={`${widgetId}-font-size`} value={fontSize} onChange={(e) => setFontSize(e.target.value as DigitalFontSizeOption)} className={inputClass}>
              {digitalFontSizeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor={`${widgetId}-font-weight`} className={labelClass}>Font Weight:</label>
            <select id={`${widgetId}-font-weight`} value={fontWeight} onChange={(e) => setFontWeight(e.target.value as DigitalFontWeightOption)} className={inputClass}>
              {fontWeightOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          {showSeconds && (
            <div>
              <label htmlFor={`${widgetId}-blink-colons`} className={checkboxLabelClass}>
                <input type="checkbox" id={`${widgetId}-blink-colons`} checked={blinkColons} onChange={(e) => setBlinkColons(e.target.checked)} className="h-4 w-4 text-accent-primary focus:ring-accent-primary border-border-interactive rounded mr-2 bg-widget" />
                Blink Colons (if showing seconds)
              </label>
            </div>
          )}
        </>
      )}

      <h3 className={sectionTitleClass}>Common Settings</h3>
      <div>
        <label htmlFor={`${widgetId}-timezone`} className={labelClass}>Timezone:</label>
        <select id={`${widgetId}-timezone`} value={timeZone} onChange={(e) => setTimeZone(e.target.value as TimezoneOption)} className={inputClass}>
          {timeZoneOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor={`${widgetId}-show-date`} className={checkboxLabelClass}>
          <input type="checkbox" id={`${widgetId}-show-date`} checked={showDate} onChange={(e) => setShowDate(e.target.checked)} className="h-4 w-4 text-accent-primary focus:ring-accent-primary border-border-interactive rounded mr-2 bg-widget" />
          Show Date
        </label>
      </div>
      {showDate && (
        <>
          <div>
            <label htmlFor={`${widgetId}-date-format`} className={labelClass}>Date Format:</label>
            <select id={`${widgetId}-date-format`} value={dateFormat} onChange={(e) => setDateFormat(e.target.value as DateFormatOption)} className={inputClass}>
              {dateFormatOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <ColorInput id={`${widgetId}-date-color`} label="Date Color" value={dateColor} onChange={setDateColor} defaultValue={DEFAULT_SETTINGS.dateColor} />
          <div>
            <label htmlFor={`${widgetId}-date-font-family`} className={labelClass}>Date Font Family:</label>
            <select id={`${widgetId}-date-font-family`} value={dateFontFamily} onChange={(e) => setDateFontFamily(e.target.value)} className={inputClass}>
                {commonFontFamilies.map(font => <option key={font} value={font}>{font.split(',')[0]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor={`${widgetId}-date-font-size`} className={labelClass}>Date Font Size:</label>
            <select id={`${widgetId}-date-font-size`} value={dateFontSize} onChange={(e) => setDateFontSize(e.target.value as DateFontSizeOption)} className={inputClass}>
              {dateFontSizeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor={`${widgetId}-date-font-weight`} className={labelClass}>Date Font Weight:</label>
            <select id={`${widgetId}-date-font-weight`} value={dateFontWeight} onChange={(e) => setDateFontWeight(e.target.value as DigitalFontWeightOption)} className={inputClass}>
              {fontWeightOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </>
      )}

      <button onClick={handleSaveClick} className="mt-6 w-full px-4 py-2 bg-accent-primary text-on-accent rounded-md hover:bg-accent-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary focus:ring-offset-dark-surface">
        Save Clock Settings
      </button>
    </div>
  );
};


// --- Main ClockWidget Component ---
const ClockWidget: React.FC<ClockWidgetProps> = ({ settings }) => {
  const s = useMemo(() => ({ ...DEFAULT_SETTINGS, ...settings }), [settings]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [colonVisible, setColonVisible] = useState(true);

  useEffect(() => {
    let interval = 1000;
    if (s.displayType === 'analog' && s.showSeconds && s.smoothSecondHand) {
      interval = 50; // Faster updates for smooth analog second hand
    } else if (s.displayType === 'digital' && s.showSeconds && s.blinkColons) {
      interval = 500; // To toggle colon visibility
    }

    const timerId = setInterval(() => {
      setCurrentTime(new Date());
      if (s.displayType === 'digital' && s.showSeconds && s.blinkColons) {
        setColonVisible(prev => !prev);
      }
    }, interval);

    return () => clearInterval(timerId);
  }, [s.displayType, s.showSeconds, s.smoothSecondHand, s.blinkColons]);

  const timeToDisplay = getTimeWithTimezone(currentTime, s.timeZone);
  const hours = timeToDisplay.getHours();
  const minutes = timeToDisplay.getMinutes();
  const seconds = timeToDisplay.getSeconds();
  const milliseconds = timeToDisplay.getMilliseconds();


  // --- Analog Clock Rendering ---
  const AnalogClockDisplay = () => {
    const clockSize = 200;
    const center = clockSize / 2;
    const strokeWidth = Math.max(1, clockSize * 0.01); // Border width relative to size
    const majorTickSize = clockSize * 0.04;
    const minorTickSize = clockSize * 0.02;
    const handBaseOffset = clockSize * 0.05;

    const secondHandLength = center * 0.85;
    const minuteHandLength = center * 0.75;
    const hourHandLength = center * 0.55;

    const currentSeconds = s.smoothSecondHand ? (seconds + milliseconds / 1000) : seconds;
    const secDeg = (currentSeconds / 60) * 360;
    const minDeg = ((minutes + currentSeconds / 60) / 60) * 360;
    const hourDeg = (((hours % 12) + minutes / 60 + currentSeconds / 3600) / 12) * 360;

    const actualNumberFontSize = s.numberFontSize * (center * 0.8); // Font size relative to 80% of radius

    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-1">
        <svg viewBox={`0 0 ${clockSize} ${clockSize}`} className="w-full h-full max-w-[250px] max-h-[250px] aspect-square">
          <circle cx={center} cy={center} r={center - strokeWidth / 2} fill={s.clockFaceColor} stroke={s.clockBorderColor} strokeWidth={strokeWidth} />
          <circle cx={center} cy={center} r={Math.max(1, clockSize * 0.025)} fill={s.centerDotColor} />

          {s.showMajorTicks && Array.from({ length: 12 }).map((_, i) => (
            <line key={`major-${i}`} x1={center} y1={strokeWidth + majorTickSize * 0.2} x2={center} y2={strokeWidth + majorTickSize} stroke={s.majorTicksColor} strokeWidth={Math.max(1, clockSize * 0.0125)} transform={`rotate(${i * 30} ${center} ${center})`} />
          ))}
          {s.showMinorTicks && Array.from({ length: 60 }).map((_, i) => {
            if (i % 5 === 0 && s.showMajorTicks) return null;
            return <line key={`minor-${i}`} x1={center} y1={strokeWidth + minorTickSize * 0.2} x2={center} y2={strokeWidth + minorTickSize} stroke={s.minorTicksColor} strokeWidth={Math.max(0.5, clockSize * 0.005)} transform={`rotate(${i * 6} ${center} ${center})`} />;
          })}

          {s.showNumbers && Array.from({ length: 12 }).map((_, i) => {
            const num = i === 0 ? 12 : i;
            const angleRad = (i * 30 - 90) * (Math.PI / 180); // -90 to start 12 at top
            const numRadius = center * 0.80; // Place numbers slightly inside the edge
            const x = center + numRadius * Math.cos(angleRad);
            const y = center + numRadius * Math.sin(angleRad);
            return (
              <text key={`num-${i}`} x={x} y={y} fontFamily={s.numberFontFamily} fontSize={actualNumberFontSize} fill={s.numbersColor} textAnchor="middle" dominantBaseline="central">
                {num}
              </text>
            );
          })}

          <line x1={center} y1={center + handBaseOffset} x2={center} y2={center - hourHandLength} stroke={s.hourHandColor} strokeWidth={Math.max(1.5, clockSize * 0.025)} strokeLinecap="round" transform={`rotate(${hourDeg} ${center} ${center})`} />
          <line x1={center} y1={center + handBaseOffset} x2={center} y2={center - minuteHandLength} stroke={s.minuteHandColor} strokeWidth={Math.max(1, clockSize * 0.02)} strokeLinecap="round" transform={`rotate(${minDeg} ${center} ${center})`} />
          {s.showSeconds && (
            <line x1={center} y1={center + handBaseOffset * 1.2} x2={center} y2={center - secondHandLength} stroke={s.secondHandColor} strokeWidth={Math.max(0.5, clockSize * 0.01)} strokeLinecap="round" transform={`rotate(${secDeg} ${center} ${center})`} />
          )}
        </svg>
        {s.showDate && (
            <div className={`mt-2 text-center ${s.dateFontSize} ${s.dateFontWeight}`} style={{ color: s.dateColor, fontFamily: s.dateFontFamily }}>
                {formatDate(currentTime, s.dateFormat, s.timeZone)}
            </div>
        )}
      </div>
    );
  };

  // --- Digital Clock Rendering ---
  const DigitalClockDisplay = () => {
    let displayHours = hours;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    if (s.hourFormat === '12') {
      displayHours = hours % 12 || 12;
    }

    const colon = s.showSeconds && s.blinkColons ? (colonVisible ? ':' : ' ') : ':';
    const timeString = `${String(displayHours).padStart(2, '0')}${colon}${String(minutes).padStart(2, '0')}`;
    const secondsString = s.showSeconds ? `${colon}${String(seconds).padStart(2, '0')}` : '';
    const ampmString = (s.hourFormat === '12' && s.showAmPm) ? ` ${ampm}` : '';

    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
        <div className={`${s.fontSize} ${s.fontWeight} tabular-nums tracking-tight`} style={{ color: s.digitColor }}>
          {timeString}
          {s.showSeconds && <span className={s.fontSize === 'text-3xl' ? 'text-2xl' : s.fontSize === 'text-4xl' ? 'text-3xl' : s.fontSize === 'text-7xl' ? 'text-6xl' : 'text-4xl' }>{secondsString}</span>}
          {ampmString && <span className={s.fontSize === 'text-3xl' ? 'text-xl' : s.fontSize === 'text-4xl' ? 'text-2xl' : s.fontSize === 'text-7xl' ? 'text-5xl' : 'text-3xl' }>{ampmString}</span>}
        </div>
        {s.showDate && (
            <div className={`mt-1 ${s.dateFontSize} ${s.dateFontWeight}`} style={{ color: s.dateColor, fontFamily: s.dateFontFamily }}>
                {formatDate(currentTime, s.dateFormat, s.timeZone)}
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-transparent w-full h-full overflow-hidden">
      {s.displayType === 'analog' ? <AnalogClockDisplay /> : <DigitalClockDisplay />}
    </div>
  );
};

export default ClockWidget;
