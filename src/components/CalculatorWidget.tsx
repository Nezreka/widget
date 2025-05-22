// src/components/CalculatorWidget.tsx
"use client";

import React, { useState } from 'react';

// Settings interface (even if not used initially, good for consistency)
export interface CalculatorWidgetSettings {
  theme?: 'dark' | 'light'; // Example future setting
}

interface CalculatorWidgetProps {
  settings?: CalculatorWidgetSettings;
  id: string;
}

// No specific settings panel for now, but we can define it for completeness
export const CalculatorSettingsPanel: React.FC<{ widgetId: string, currentSettings: CalculatorWidgetSettings | undefined, onSave: (newSettings: CalculatorWidgetSettings) => void }> = ({ 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  widgetId, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentSettings, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSave 
}) => {
  return (
    <div className="text-primary">
      <p className="text-sm text-secondary">No specific settings available for the calculator widget at this time.</p>
      {/* Example of a future setting:
      <button
        onClick={() => onSave({ theme: currentSettings?.theme === 'dark' ? 'light' : 'dark' })}
        className="mt-4 w-full px-4 py-2 bg-accent-primary text-on-accent rounded-md hover:bg-accent-primary-hover"
      >
        Toggle Theme (Conceptual)
      </button>
      */}
    </div>
  );
};


const CalculatorWidget: React.FC<CalculatorWidgetProps> = ({ 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  settings, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  id 
}) => {
  const [displayValue, setDisplayValue] = useState<string>("0");
  const [operand1, setOperand1] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand2, setWaitingForOperand2] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  const MAX_DISPLAY_LENGTH = 14; // Max characters for the display

  // Handles number button clicks
  const handleNumberClick = (numStr: string) => {
    if (isError) {
      clearAll(); // Clear error state on new number input
      setDisplayValue(numStr === '.' ? '0.' : numStr);
      setIsError(false);
      return;
    }
    if (waitingForOperand2) {
      setDisplayValue(numStr === '.' ? '0.' : numStr);
      setWaitingForOperand2(false);
    } else {
      if (displayValue.length >= MAX_DISPLAY_LENGTH && numStr !== '.') return; // Prevent overflow
      if (numStr === '.' && displayValue.includes('.')) return; // Only one decimal point

      // Handle leading zero and decimal input
      if (displayValue === "0" && numStr !== '.') {
        setDisplayValue(numStr);
      } else if (displayValue === "0" && numStr === '.') {
        setDisplayValue("0.");
      }
      else {
        setDisplayValue(prev => prev + numStr);
      }
    }
  };

  // Handles operator button clicks (+, -, *, /)
  const handleOperatorClick = (op: string) => {
    if (isError) return; // Don't allow operations if in error state

    const currentValue = parseFloat(displayValue);

    if (operand1 === null) {
      setOperand1(currentValue);
    } else if (operator && !waitingForOperand2) { // An operation is pending and we have a second operand
      try {
        const result = calculate(operand1, currentValue, operator);
        setDisplayValue(String(result).slice(0, MAX_DISPLAY_LENGTH));
        setOperand1(result);
      } catch (e: unknown) { // Catch block with typed error
        console.error("Calculation error in handleOperatorClick:", e);
        setDisplayValue("Error");
        setIsError(true);
        setOperand1(null);
        setOperator(null);
        setWaitingForOperand2(false);
        return;
      }
    }
    // If operand1 is set and waitingForOperand2 is true, it means user is changing operator
    // or if operand1 is set and operator is null (after equals, then operator)
    else if (operand1 !== null) {
        setOperand1(currentValue); // Use current display value as new operand1
    }


    setOperator(op);
    setWaitingForOperand2(true);
  };

  // Performs the calculation
  const calculate = (val1: number, val2: number, op: string): number => {
    let result: number;
    switch (op) {
      case '+': result = val1 + val2; break;
      case '-': result = val1 - val2; break;
      case '*': result = val1 * val2; break;
      case '/':
        if (val2 === 0) throw new Error("Division by zero");
        result = val1 / val2;
        break;
      default: throw new Error("Invalid operator");
    }
    // Handle precision for floating point issues, e.g., 0.1 + 0.2
    // Limit to a reasonable number of decimal places if it's a float
    if (!Number.isInteger(result)) {
        const resultStr = String(result);
        if (resultStr.includes('.')) {
            const decimalPart = resultStr.split('.')[1];
            if (decimalPart && decimalPart.length > 8) { // Limit to 8 decimal places
                 return parseFloat(result.toFixed(8));
            }
        }
    }
    return result;
  };

  // Handles equals button click
  const handleEqualsClick = () => {
    if (isError || operand1 === null || operator === null || waitingForOperand2) {
      return;
    }
    const currentValue = parseFloat(displayValue);
    try {
      const result = calculate(operand1, currentValue, operator);
      setDisplayValue(String(result).slice(0, MAX_DISPLAY_LENGTH));
    } catch (e: unknown) { // Catch block with typed error
      console.error("Calculation error in handleEqualsClick:", e);
      setDisplayValue("Error");
      setIsError(true);
    } finally {
      setOperand1(null); 
      setOperator(null);
      setWaitingForOperand2(false); 
    }
  };

  // Clears all calculator state (AC)
  const clearAll = () => {
    setDisplayValue("0");
    setOperand1(null);
    setOperator(null);
    setWaitingForOperand2(false);
    setIsError(false);
  };

  // Button layout configuration
  const buttons = [
    { label: 'AC', action: clearAll, className: 'col-span-2 bg-red-500/80 hover:bg-red-600/80 dark:bg-red-700/80 dark:hover:bg-red-600/80' },
    { label: '÷', action: () => handleOperatorClick('/'), className: 'bg-orange-500/80 hover:bg-orange-600/80 dark:bg-orange-600/80 dark:hover:bg-orange-500/80' },
    { label: '×', action: () => handleOperatorClick('*'), className: 'bg-orange-500/80 hover:bg-orange-600/80 dark:bg-orange-600/80 dark:hover:bg-orange-500/80' },
    { label: '7', action: () => handleNumberClick('7') }, { label: '8', action: () => handleNumberClick('8') },
    { label: '9', action: () => handleNumberClick('9') }, { label: '−', action: () => handleOperatorClick('-'), className: 'bg-orange-500/80 hover:bg-orange-600/80 dark:bg-orange-600/80 dark:hover:bg-orange-500/80' },
    { label: '4', action: () => handleNumberClick('4') }, { label: '5', action: () => handleNumberClick('5') },
    { label: '6', action: () => handleNumberClick('6') }, { label: '+', action: () => handleOperatorClick('+'), className: 'bg-orange-500/80 hover:bg-orange-600/80 dark:bg-orange-600/80 dark:hover:bg-orange-500/80' },
    { label: '1', action: () => handleNumberClick('1') }, { label: '2', action: () => handleNumberClick('2') },
    { label: '3', action: () => handleNumberClick('3') }, { label: '=', action: handleEqualsClick, className: 'row-span-2 bg-green-500/80 hover:bg-green-600/80 dark:bg-green-600/80 dark:hover:bg-green-500/80' },
    { label: '0', action: () => handleNumberClick('0'), className: 'col-span-2' },
    { label: '.', action: () => handleNumberClick('.') },
  ];

  const baseButtonClass = "text-xl md:text-2xl font-medium rounded-lg p-3 active:opacity-80 transition-all duration-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-dark-surface focus:ring-accent-primary";
  const numberButtonClass = "bg-slate-600/70 hover:bg-slate-500/70 dark:bg-slate-700/70 dark:hover:bg-slate-600/70 text-on-accent";

  return (
    <div className="w-full h-full flex flex-col p-3 bg-transparent text-primary overflow-hidden">
      {/* Display Screen */}
      <div className="bg-slate-800/50 dark:bg-black/50 text-right p-4 rounded-t-lg mb-3 shadow-inner">
        <span
          className={`block text-3xl md:text-4xl font-mono break-all ${isError ? 'text-red-400' : 'text-slate-50'}`}
          style={{ minHeight: '2.5em', lineHeight: '1.25em' }} 
        >
          {displayValue}
        </span>
      </div>

      {/* Buttons Grid */}
      <div className="grid grid-cols-4 gap-2 flex-grow">
        {buttons.map((btn) => (
          <button
            key={btn.label}
            onClick={btn.action}
            className={`${baseButtonClass} ${btn.className || numberButtonClass}`}
            aria-label={btn.label === 'AC' ? 'All Clear' : btn.label === '÷' ? 'Divide' : btn.label === '×' ? 'Multiply' : btn.label === '−' ? 'Subtract' : btn.label === '+' ? 'Add' : btn.label === '=' ? 'Equals' : `Number ${btn.label}` }
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CalculatorWidget;
