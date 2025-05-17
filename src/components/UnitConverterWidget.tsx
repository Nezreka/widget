// src/components/UnitConverterWidget.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';

// --- Interfaces & Types ---
export interface UnitConverterWidgetSettings {
  defaultCategory?: string; // e.g., 'Length'
  precision?: number; // Number of decimal places for results
}

interface UnitConverterWidgetProps {
  settings?: UnitConverterWidgetSettings;
  id: string;
}

interface Unit {
  symbol: string;
  name: string;
  // Factor to convert from this unit to the base unit of its category
  toBase: (value: number) => number;
  // Factor to convert from the base unit to this unit
  fromBase: (value: number) => number;
}

interface ConversionCategory {
  name: string;
  baseUnit: string; // Symbol of the base unit for this category
  units: Unit[];
}

// --- Conversion Data ---
const CONVERSION_CATEGORIES: ConversionCategory[] = [
  {
    name: "Length",
    baseUnit: "m",
    units: [
      { symbol: "m", name: "Meter", toBase: val => val, fromBase: val => val },
      { symbol: "km", name: "Kilometer", toBase: val => val * 1000, fromBase: val => val / 1000 },
      { symbol: "cm", name: "Centimeter", toBase: val => val / 100, fromBase: val => val * 100 },
      { symbol: "mm", name: "Millimeter", toBase: val => val / 1000, fromBase: val => val * 1000 },
      { symbol: "mi", name: "Mile", toBase: val => val * 1609.34, fromBase: val => val / 1609.34 },
      { symbol: "yd", name: "Yard", toBase: val => val * 0.9144, fromBase: val => val / 0.9144 },
      { symbol: "ft", name: "Foot", toBase: val => val * 0.3048, fromBase: val => val / 0.3048 },
      { symbol: "in", name: "Inch", toBase: val => val * 0.0254, fromBase: val => val / 0.0254 },
    ],
  },
  {
    name: "Weight/Mass",
    baseUnit: "kg",
    units: [
      { symbol: "kg", name: "Kilogram", toBase: val => val, fromBase: val => val },
      { symbol: "g", name: "Gram", toBase: val => val / 1000, fromBase: val => val * 1000 },
      { symbol: "mg", name: "Milligram", toBase: val => val / 1000000, fromBase: val => val * 1000000 },
      { symbol: "lb", name: "Pound", toBase: val => val * 0.453592, fromBase: val => val / 0.453592 },
      { symbol: "oz", name: "Ounce", toBase: val => val * 0.0283495, fromBase: val => val / 0.0283495 },
      { symbol: "t", name: "Metric Ton", toBase: val => val * 1000, fromBase: val => val / 1000 },
    ],
  },
  {
    name: "Temperature",
    baseUnit: "C", // Celsius as base for internal conversion logic
    units: [
      { symbol: "C", name: "Celsius", toBase: val => val, fromBase: val => val },
      { symbol: "F", name: "Fahrenheit", toBase: val => (val - 32) * 5/9, fromBase: val => (val * 9/5) + 32 },
      { symbol: "K", name: "Kelvin", toBase: val => val - 273.15, fromBase: val => val + 273.15 },
    ],
  },
  {
    name: "Volume",
    baseUnit: "L",
    units: [
        { symbol: "L", name: "Liter", toBase: val => val, fromBase: val => val },
        { symbol: "mL", name: "Milliliter", toBase: val => val / 1000, fromBase: val => val * 1000 },
        { symbol: "gal", name: "Gallon (US)", toBase: val => val * 3.78541, fromBase: val => val / 3.78541 },
        { symbol: "qt", name: "Quart (US)", toBase: val => val * 0.946353, fromBase: val => val / 0.946353 },
        { symbol: "pt", name: "Pint (US)", toBase: val => val * 0.473176, fromBase: val => val / 0.473176 },
        { symbol: "cup", name: "Cup (US)", toBase: val => val * 0.236588, fromBase: val => val / 0.236588 },
        { symbol: "fl oz", name: "Fluid Ounce (US)", toBase: val => val * 0.0295735, fromBase: val => val / 0.0295735 },
        { symbol: "m³", name: "Cubic Meter", toBase: val => val * 1000, fromBase: val => val / 1000 },
    ],
  },
  {
    name: "Speed",
    baseUnit: "m/s",
    units: [
        { symbol: "m/s", name: "Meter/second", toBase: val => val, fromBase: val => val },
        { symbol: "km/h", name: "Kilometer/hour", toBase: val => val / 3.6, fromBase: val => val * 3.6 },
        { symbol: "mph", name: "Miles/hour", toBase: val => val * 0.44704, fromBase: val => val / 0.44704 },
        { symbol: "knot", name: "Knot", toBase: val => val * 0.514444, fromBase: val => val / 0.514444 },
        { symbol: "ft/s", name: "Feet/second", toBase: val => val * 0.3048, fromBase: val => val / 0.3048 },
    ],
  },
];

// --- Icons ---
const SwapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M13.5 4.442a.75.75 0 01.037 1.06l-4.25 4.5a.75.75 0 01-1.094.036L3.707 5.53A.75.75 0 114.77 4.47l3.723 3.723 3.723-3.723a.75.75 0 011.285-.028H13.5zm-7 11.116a.75.75 0 01-.037-1.06l4.25-4.5a.75.75 0 011.094-.036l4.486 4.469a.75.75 0 11-1.063 1.06l-3.723-3.723-3.723 3.723a.75.75 0 01-1.285.028H6.5z" clipRule="evenodd" />
  </svg>
);


// --- Settings Panel ---
export const UnitConverterSettingsPanel: React.FC<{
  widgetId: string;
  currentSettings: UnitConverterWidgetSettings | undefined;
  onSave: (newSettings: UnitConverterWidgetSettings) => void;
}> = ({ widgetId, currentSettings, onSave }) => {
  const [defaultCategory, setDefaultCategory] = useState(currentSettings?.defaultCategory || CONVERSION_CATEGORIES[0].name);
  const [precision, setPrecision] = useState(currentSettings?.precision || 4);

  const handleSave = () => {
    onSave({
      defaultCategory,
      precision: Math.max(0, Math.min(10, precision)), // Clamp precision
    });
  };

  return (
    <div className="space-y-4 text-primary">
      <div>
        <label htmlFor={`uc-default-category-${widgetId}`} className="block text-sm font-medium text-secondary mb-1">
          Default Category:
        </label>
        <select
          id={`uc-default-category-${widgetId}`}
          value={defaultCategory}
          onChange={(e) => setDefaultCategory(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-widget border border-border-interactive rounded-md shadow-sm focus:outline-none focus:ring-accent-primary focus:border-accent-primary sm:text-sm text-primary"
        >
          {CONVERSION_CATEGORIES.map(cat => (
            <option key={cat.name} value={cat.name}>{cat.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`uc-precision-${widgetId}`} className="block text-sm font-medium text-secondary mb-1">
          Result Precision (decimal places):
        </label>
        <input
          type="number"
          id={`uc-precision-${widgetId}`}
          value={precision}
          onChange={(e) => setPrecision(parseInt(e.target.value, 10))}
          min="0" max="10"
          className="mt-1 block w-full px-3 py-2 bg-widget border border-border-interactive rounded-md shadow-sm focus:outline-none focus:ring-accent-primary focus:border-accent-primary sm:text-sm text-primary"
        />
      </div>
      <button
        onClick={handleSave}
        className="mt-6 w-full px-4 py-2 bg-accent-primary text-on-accent rounded-md hover:bg-accent-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary focus:ring-offset-dark-surface"
      >
        Save Unit Converter Settings
      </button>
    </div>
  );
};

// --- Main UnitConverterWidget Component ---
const UnitConverterWidget: React.FC<UnitConverterWidgetProps> = ({ settings, id }) => {
  const [selectedCategoryName, setSelectedCategoryName] = useState(settings?.defaultCategory || CONVERSION_CATEGORIES[0].name);
  const [inputValue, setInputValue] = useState<string>("1");
  const [fromUnitSymbol, setFromUnitSymbol] = useState<string>(CONVERSION_CATEGORIES[0].units[0].symbol);
  const [toUnitSymbol, setToUnitSymbol] = useState<string>(CONVERSION_CATEGORIES[0].units[1]?.symbol || CONVERSION_CATEGORIES[0].units[0].symbol);
  const [outputValue, setOutputValue] = useState<string>("");

  const currentCategory = useMemo(() => CONVERSION_CATEGORIES.find(cat => cat.name === selectedCategoryName) || CONVERSION_CATEGORIES[0], [selectedCategoryName]);
  const precision = settings?.precision === undefined ? 4 : Math.max(0, Math.min(10, settings.precision));


  useEffect(() => {
    // When category changes, reset units to the first two in the new category
    const newCategory = CONVERSION_CATEGORIES.find(cat => cat.name === selectedCategoryName) || CONVERSION_CATEGORIES[0];
    setFromUnitSymbol(newCategory.units[0].symbol);
    setToUnitSymbol(newCategory.units[1]?.symbol || newCategory.units[0].symbol);
  }, [selectedCategoryName]);

  useEffect(() => {
    // Perform conversion whenever relevant states change
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue) || !fromUnitSymbol || !toUnitSymbol || !currentCategory) {
      setOutputValue("");
      return;
    }

    const fromUnit = currentCategory.units.find(u => u.symbol === fromUnitSymbol);
    const toUnit = currentCategory.units.find(u => u.symbol === toUnitSymbol);

    if (!fromUnit || !toUnit) {
      setOutputValue("Error: Unit not found");
      return;
    }

    try {
      const valueInBaseUnit = fromUnit.toBase(numValue);
      const convertedValue = toUnit.fromBase(valueInBaseUnit);
      
      // Format with specified precision, removing trailing zeros for whole numbers or numbers with fewer decimals
      let formattedResult = parseFloat(convertedValue.toFixed(precision)).toString();
      setOutputValue(formattedResult);

    } catch (error) {
      console.error("Conversion error:", error);
      setOutputValue("Error");
    }
  }, [inputValue, fromUnitSymbol, toUnitSymbol, currentCategory, precision]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow numbers, decimal point, and negative sign (for temperatures)
    if (/^-?\d*\.?\d*$/.test(val) || val === "") {
      setInputValue(val);
    }
  };

  const handleSwapUnits = () => {
    const currentFrom = fromUnitSymbol;
    setFromUnitSymbol(toUnitSymbol);
    setToUnitSymbol(currentFrom);
    // Optionally, swap input and output values if desired, or just re-trigger conversion
    setInputValue(outputValue); 
  };
  
  const commonSelectClass = "w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary text-sm text-primary placeholder-slate-400/70 transition-colors duration-150 appearance-none";
  const selectArrowSVG = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`;


  return (
    <div className="w-full h-full flex flex-col p-3.5 bg-transparent text-primary overflow-hidden space-y-4">
      {/* Category Selection */}
      <div>
        <label htmlFor={`category-select-${id}`} className="block text-xs font-medium text-secondary mb-1">Category</label>
        <select
          id={`category-select-${id}`}
          value={selectedCategoryName}
          onChange={(e) => setSelectedCategoryName(e.target.value)}
          className={`${commonSelectClass}`}
          style={{ backgroundImage: selectArrowSVG, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em 1em' }}
        >
          {CONVERSION_CATEGORIES.map(cat => (
            <option key={cat.name} value={cat.name} className="bg-slate-800 text-slate-100">
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Input Row */}
      <div className="flex items-end space-x-2">
        <div className="flex-grow">
          <label htmlFor={`input-value-${id}`} className="block text-xs font-medium text-secondary mb-1">From</label>
          <input
            type="text" // Using text to allow more flexible input, validation handles non-numeric
            id={`input-value-${id}`}
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Enter value"
            className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary text-base text-primary placeholder-slate-400/70 transition-colors"
          />
        </div>
        <div className="w-2/5">
          <select
            id={`from-unit-select-${id}`}
            value={fromUnitSymbol}
            onChange={(e) => setFromUnitSymbol(e.target.value)}
            className={`${commonSelectClass} h-[46px]`} // Match height of input
            style={{ backgroundImage: selectArrowSVG, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1em 1em' }}
          >
            {currentCategory.units.map(unit => (
              <option key={unit.symbol} value={unit.symbol} className="bg-slate-800 text-slate-100">
                {unit.name} ({unit.symbol})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Swap Button */}
      <div className="flex justify-center items-center py-1">
        <button
          onClick={handleSwapUnits}
          className="p-2.5 bg-slate-600/70 hover:bg-slate-500/70 text-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-dark-surface transition-all duration-150 shadow-sm hover:shadow-md"
          aria-label="Swap units"
        >
          <SwapIcon />
        </button>
      </div>

      {/* Output Row */}
      <div className="flex items-end space-x-2">
        <div className="flex-grow">
          <label htmlFor={`output-value-${id}`} className="block text-xs font-medium text-secondary mb-1">To</label>
          <input
            type="text"
            id={`output-value-${id}`}
            value={outputValue}
            readOnly
            placeholder="Result"
            className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg shadow-inner text-base text-green-400 placeholder-slate-500 transition-colors"
          />
        </div>
        <div className="w-2/5">
          <select
            id={`to-unit-select-${id}`}
            value={toUnitSymbol}
            onChange={(e) => setToUnitSymbol(e.target.value)}
            className={`${commonSelectClass} h-[46px]`} // Match height of input
            style={{ backgroundImage: selectArrowSVG, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1em 1em' }}
          >
            {currentCategory.units.map(unit => (
              <option key={unit.symbol} value={unit.symbol} className="bg-slate-800 text-slate-100">
                {unit.name} ({unit.symbol})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default UnitConverterWidget;
