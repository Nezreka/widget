// src/components/CalculatorWidget.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';

// --- Icons (These might be used by a parent Widget component or for future features) ---
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);


// --- Settings Interface & Defaults ---
export interface CalculatorWidgetSettings {
  mode?: 'simple' | 'scientific';
  angleUnit?: 'deg' | 'rad';
  theme?: 'light' | 'dark' | 'system'; 
  historySize?: number;
  displayPrecision?: number; 
  enableAnimations?: boolean;
}

const DEFAULT_CALCULATOR_SETTINGS: Required<CalculatorWidgetSettings> = {
  mode: 'simple',
  angleUnit: 'deg',
  theme: 'system',
  historySize: 20,
  displayPrecision: 8,
  enableAnimations: true,
};

interface CalculatorWidgetProps {
  settings?: CalculatorWidgetSettings;
  id: string; 
}

interface ButtonConfig {
  label: string;
  action: () => void;
  className?: string;
  title?: string; 
}

const isNumber = (token: string): boolean => !isNaN(parseFloat(token)) && isFinite(Number(token));

const OPERATORS: { [key: string]: { precedence: number; associativity: 'Left' | 'Right'; arity: number; fn: (...args: number[]) => number } } = {
  '+': { precedence: 2, associativity: 'Left', arity: 2, fn: (a, b) => a + b },
  '-': { precedence: 2, associativity: 'Left', arity: 2, fn: (a, b) => a - b },
  '*': { precedence: 3, associativity: 'Left', arity: 2, fn: (a, b) => a * b },
  '/': { precedence: 3, associativity: 'Left', arity: 2, fn: (a, b) => { if (b === 0) throw new Error("Division by zero"); return a / b; } },
  '^': { precedence: 4, associativity: 'Right', arity: 2, fn: (a, b) => Math.pow(a, b) },
  '_': { precedence: 5, associativity: 'Right', arity: 1, fn: a => -a }, 
};

const FUNCTIONS: { [key: string]: { arity: number; fn: (settings: Required<CalculatorWidgetSettings>, ...args: number[]) => number } } = {
  'sqrt': { arity: 1, fn: (_s, a) => { if (a < 0) throw new Error("Sqrt of negative"); return Math.sqrt(a); } },
  'sin': { arity: 1, fn: (s, a) => s.angleUnit === 'deg' ? Math.sin(a * Math.PI / 180) : Math.sin(a) },
  'cos': { arity: 1, fn: (s, a) => s.angleUnit === 'deg' ? Math.cos(a * Math.PI / 180) : Math.cos(a) },
  'tan': { arity: 1, fn: (s, a) => {
      if (s.angleUnit === 'deg') {
          const angleRad = a * Math.PI / 180;
          if (Math.abs(Math.cos(angleRad)) < 1e-12) throw new Error("Tan undefined"); 
          return Math.tan(angleRad);
      } else {
          if (Math.abs(Math.cos(a)) < 1e-12) throw new Error("Tan undefined");
          return Math.tan(a);
      }
  }},
  'asin': { arity: 1, fn: (s, a) => { if (a < -1 || a > 1) throw new Error("Asin domain error"); return s.angleUnit === 'deg' ? Math.asin(a) * 180 / Math.PI : Math.asin(a); }},
  'acos': { arity: 1, fn: (s, a) => { if (a < -1 || a > 1) throw new Error("Acos domain error"); return s.angleUnit === 'deg' ? Math.acos(a) * 180 / Math.PI : Math.acos(a); }},
  'atan': { arity: 1, fn: (s, a) => s.angleUnit === 'deg' ? Math.atan(a) * 180 / Math.PI : Math.atan(a) },
  'log': { arity: 1, fn: (_s, a) => { if (a <= 0) throw new Error("Log domain error"); return Math.log10(a); } }, 
  'ln': { arity: 1, fn: (_s, a) => { if (a <= 0) throw new Error("Ln domain error"); return Math.log(a); } },   
  'fact': { arity: 1, fn: (_s, n) => {
    if (n < 0 || !Number.isInteger(n)) throw new Error("Factorial of non-integer or negative");
    if (n > 170) throw new Error("Factorial overflow"); 
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  }},
  'abs': { arity: 1, fn: (_s, a) => Math.abs(a) },
};

function tokenize(expression: string): (string | number)[] {
    expression = expression.replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/');
    expression = expression.replace(/([+\-*/^()])/g, ' $1 ');
    expression = expression.replace(/(\d)e([+-])(\d)/gi, '$1E$2$3'); 
    
    const tokens: (string|number)[] = [];
    const parts = expression.trim().split(/\s+/).filter(p => p !== ""); 
    
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (isNumber(part)) {
            tokens.push(parseFloat(part));
        } else if (OPERATORS[part] || FUNCTIONS[part.toLowerCase()] || part === '(' || part === ')') {
            if (part === '-' && (tokens.length === 0 || (typeof tokens[tokens.length - 1] === 'string' && ['(','+','-','*','/','^'].includes(tokens[tokens.length - 1] as string)) )) {
                 tokens.push('_'); 
            } else {
                 tokens.push(part.toLowerCase()); 
            }
        } else if (part.toLowerCase() === 'pi' || part.toLowerCase() === 'π') {
            tokens.push(Math.PI);
        } else if (part.toLowerCase() === 'e') { 
            tokens.push(Math.E);
        } else {
             console.warn("Unknown token:", part);
        }
    }
    return tokens;
}

function shuntingYard(tokens: (string | number)[]): (string | number)[] {
    const outputQueue: (string | number)[] = [];
    const operatorStack: string[] = [];

    tokens.forEach(token => {
        if (typeof token === 'number') {
            outputQueue.push(token);
        } else if (typeof token === 'string' && FUNCTIONS[token]) {
            operatorStack.push(token);
        } else if (typeof token === 'string' && OPERATORS[token]) {
            const op1 = token;
            while (operatorStack.length > 0) {
                const op2 = operatorStack[operatorStack.length - 1];
                if (
                    (FUNCTIONS[op2]) ||
                    (OPERATORS[op2] && OPERATORS[op2].precedence > OPERATORS[op1].precedence) ||
                    (OPERATORS[op2] && OPERATORS[op2].precedence === OPERATORS[op1].precedence && OPERATORS[op1].associativity === 'Left')
                ) {
                    outputQueue.push(operatorStack.pop()!);
                } else {
                    break;
                }
            }
            operatorStack.push(op1);
        } else if (token === '(') {
            operatorStack.push(token);
        } else if (token === ')') {
            while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
                outputQueue.push(operatorStack.pop()!);
            }
            if (operatorStack.length === 0 || operatorStack[operatorStack.length - 1] !== '(') {
                throw new Error("Mismatched parentheses");
            }
            operatorStack.pop(); 
            if (operatorStack.length > 0 && FUNCTIONS[operatorStack[operatorStack.length - 1]]) {
                outputQueue.push(operatorStack.pop()!);
            }
        }
    });

    while (operatorStack.length > 0) {
        const op = operatorStack.pop()!;
        if (op === '(') {
            throw new Error("Mismatched parentheses");
        }
        outputQueue.push(op);
    }
    return outputQueue;
}

function evaluateRPN(rpnQueue: (string | number)[], currentSettings: Required<CalculatorWidgetSettings>): number {
    const stack: number[] = [];

    rpnQueue.forEach(token => {
        if (typeof token === 'number') {
            stack.push(token);
        } else if (typeof token === 'string' && OPERATORS[token]) {
            const opInfo = OPERATORS[token];
            if (stack.length < opInfo.arity) throw new Error(`Insufficient operands for ${token}`);
            const operands = [];
            for (let i = 0; i < opInfo.arity; i++) {
                operands.unshift(stack.pop()!);
            }
            stack.push(opInfo.fn(...operands));
        } else if (typeof token === 'string' && FUNCTIONS[token]) {
            const funcInfo = FUNCTIONS[token];
            if (stack.length < funcInfo.arity) throw new Error(`Insufficient operands for ${token}`);
            const operands = [];
            for (let i = 0; i < funcInfo.arity; i++) {
                operands.unshift(stack.pop()!);
            }
            stack.push(funcInfo.fn(currentSettings, ...operands));
        }
    });

    if (stack.length !== 1) {
        console.error("RPN evaluation error, stack:", stack, "RPN Queue:", rpnQueue);
        throw new Error("Invalid expression (RPN stack error)");
    }
    return stack[0];
}

export const CalculatorSettingsPanel: React.FC<{
  widgetId: string;
  currentSettings: CalculatorWidgetSettings | undefined;
  onSave: (newSettings: CalculatorWidgetSettings) => void;
}> = ({ widgetId, currentSettings, onSave }) => {
  const s = { ...DEFAULT_CALCULATOR_SETTINGS, ...currentSettings };

  const [mode, setMode] = useState(s.mode);
  const [angleUnit, setAngleUnit] = useState(s.angleUnit);
  const [displayPrecision, setDisplayPrecision] = useState(s.displayPrecision);
  const [enableAnimations, setEnableAnimations] = useState(s.enableAnimations);

  const handleSave = () => {
    onSave({ mode, angleUnit, displayPrecision, enableAnimations });
  };

  const inputClass = "mt-1 block w-full px-3 py-2 bg-widget border border-border-interactive rounded-md shadow-sm focus:outline-none focus:ring-accent-primary focus:border-accent-primary sm:text-sm text-primary dark:bg-slate-700 dark:border-slate-600 dark:text-slate-50";
  const labelClass = "block text-sm font-medium text-secondary mb-1 dark:text-slate-300";
  const checkboxLabelClass = "flex items-center text-sm font-medium text-secondary cursor-pointer dark:text-slate-300";
  const sectionTitleClass = "text-md font-semibold text-primary mt-4 mb-2 border-b border-border-interactive pb-1 dark:text-slate-100 dark:border-slate-700";

  return (
    <div className="space-y-4 text-primary dark:text-slate-50 max-h-[60vh] overflow-y-auto pr-2">
      <h3 className={sectionTitleClass}>Calculator Mode</h3>
      <div>
        <label htmlFor={`${widgetId}-mode`} className={labelClass}>Mode:</label>
        <select id={`${widgetId}-mode`} value={mode} onChange={(e) => setMode(e.target.value as 'simple' | 'scientific')} className={inputClass}>
          <option value="simple">Simple</option>
          <option value="scientific">Scientific</option>
        </select>
      </div>

      {mode === 'scientific' && (
        <>
          <h3 className={sectionTitleClass}>Scientific Settings</h3>
          <div>
            <label htmlFor={`${widgetId}-angle-unit`} className={labelClass}>Angle Unit:</label>
            <select id={`${widgetId}-angle-unit`} value={angleUnit} onChange={(e) => setAngleUnit(e.target.value as 'deg' | 'rad')} className={inputClass}>
              <option value="deg">Degrees</option>
              <option value="rad">Radians</option>
            </select>
          </div>
        </>
      )}

      <h3 className={sectionTitleClass}>Display & Behavior</h3>
      <div>
        <label htmlFor={`${widgetId}-precision`} className={labelClass}>Result Precision (Decimal Places):</label>
        <input
          type="number"
          id={`${widgetId}-precision`}
          value={displayPrecision}
          onChange={(e) => setDisplayPrecision(Math.max(0, Math.min(15, parseInt(e.target.value, 10))))}
          className={inputClass}
          min="0"
          max="15"
        />
      </div>
       <div>
        <label htmlFor={`${widgetId}-enable-animations`} className={checkboxLabelClass}>
          <input type="checkbox" id={`${widgetId}-enable-animations`} checked={enableAnimations} onChange={(e) => setEnableAnimations(e.target.checked)} className="h-4 w-4 text-accent-primary focus:ring-accent-primary border-border-interactive rounded mr-2 bg-widget dark:bg-slate-600" />
          Enable Animations
        </label>
      </div>

      <button onClick={handleSave} className="mt-6 w-full px-4 py-2 bg-accent-primary text-on-accent rounded-md hover:bg-accent-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary focus:ring-offset-dark-surface dark:bg-blue-600 dark:hover:bg-blue-500">
        Save Calculator Settings
      </button>
    </div>
  );
};

const CalculatorWidget: React.FC<CalculatorWidgetProps> = ({ settings: initialSettings }) => {
  const s = useMemo(() => ({ ...DEFAULT_CALCULATOR_SETTINGS, ...initialSettings }), [initialSettings]);

  const [expression, setExpression] = useState<string>(""); 
  const [currentInput, setCurrentInput] = useState<string>("0"); 
  const [displayValue, setDisplayValue] = useState<string>("0"); 
  
  const [history, setHistory] = useState<{ expression: string; result: string }[]>([]);
  const [memory, setMemory] = useState<number>(0);
  const [isError, setIsError] = useState<boolean>(false);
  const [justCalculated, setJustCalculated] = useState<boolean>(false); 

  const MAX_DISPLAY_LENGTH = 20; 
  const MAX_EXPRESSION_LENGTH = 60; 

  const clearAll = useCallback(() => {
    setExpression("");
    setCurrentInput("0");
    setDisplayValue("0");
    setIsError(false);
    setJustCalculated(false);
  }, []);

  const formatDisplayNumber = useCallback((num: number | string): string => {
    if (typeof num === 'string' && (num === "Error" || num === "Infinity" || num === "-Infinity" || num === "NaN")) {
        return num;
    }
    const numberToFormat = typeof num === 'string' ? parseFloat(num) : num; 
    if (isNaN(numberToFormat)) return "Error";

    if (Math.abs(numberToFormat) > 1e15 || (Math.abs(numberToFormat) < 1e-6 && numberToFormat !== 0)) { 
        return numberToFormat.toExponential(s.displayPrecision > 0 ? Math.min(s.displayPrecision, 10) : 5); 
    }
    
    const fixed = numberToFormat.toFixed(s.displayPrecision);
    let formatted = parseFloat(fixed).toString(); 
    
    if (formatted.length > MAX_DISPLAY_LENGTH) {
        const diff = formatted.length - MAX_DISPLAY_LENGTH;
        if (formatted.includes('.')) {
            const parts = formatted.split('.');
            const decimalPartLength = parts[1]?.length || 0;
            if (decimalPartLength > diff + 1) { 
                const newPrecision = Math.max(0, decimalPartLength - diff -1); 
                formatted = parseFloat(numberToFormat.toFixed(newPrecision)).toString();
            } else { 
                 formatted = numberToFormat.toExponential(3); 
            }
        } else { 
            formatted = numberToFormat.toExponential(3); 
        }
        if (formatted.length > MAX_DISPLAY_LENGTH) {
            formatted = formatted.slice(0, MAX_DISPLAY_LENGTH - 3) + "...";
        }
    }
    return formatted;
  }, [s.displayPrecision]);

  const handleNumberClick = useCallback((numStr: string) => {
    if (isError) {
      clearAll();
      setCurrentInput(numStr === '.' ? '0.' : numStr);
      setDisplayValue(numStr === '.' ? '0.' : numStr);
      setIsError(false);
      setJustCalculated(false);
      return;
    }

    if (justCalculated) {
        setExpression(""); 
        setCurrentInput(numStr === '.' ? '0.' : numStr);
        setDisplayValue(numStr === '.' ? '0.' : numStr);
        setJustCalculated(false);
        return;
    }

    if (currentInput.length >= MAX_DISPLAY_LENGTH && numStr !== '.') return;
    if (numStr === '.' && currentInput.includes('.')) return;

    const newCurrentInput = (currentInput === "0" && numStr !== '.') ? numStr :
                           (currentInput === "0" && numStr === '.') ? "0." :
                           currentInput + numStr;
    setCurrentInput(newCurrentInput);
    setDisplayValue(newCurrentInput);
  }, [isError, justCalculated, currentInput, clearAll]);

  const handleOperatorClick = useCallback((op: string) => {
    if (isError) return;
    
    if (justCalculated) {
        setExpression(currentInput + " " + op + " ");
        setJustCalculated(false);
    } else {
        if (currentInput !== "" && currentInput !== "0" && !OPERATORS[expression.trim().slice(-1)] ) { 
             setExpression(prev => prev + currentInput + " " + op + " ");
        } else if (expression.trim() !== "" && OPERATORS[expression.trim().slice(-2,-1)] && op !== "-") { 
            setExpression(prev => prev.trim().slice(0, prev.trim().lastIndexOf(' ')) + " " + op + " ");
        } else {
            setExpression(prev => prev + (currentInput || "0") + " " + op + " "); 
        }
    }
    setCurrentInput(""); 
    setDisplayValue(op); 
    setJustCalculated(false);
  }, [isError, justCalculated, currentInput, expression]);

  const handleFunctionClick = useCallback((funcName: string) => {
    if (isError) return;
    
    if (justCalculated && currentInput !== "0" && currentInput !== "") {
        setExpression(`${funcName}(${currentInput})`);
    } else if (currentInput !== "" && currentInput !== "0" && !isNaN(parseFloat(currentInput))) {
        setExpression(prev => prev + `${funcName}(${currentInput})`);
    }
    else {
        setExpression(prev => prev + `${funcName}(`);
    }
    
    setCurrentInput(""); 
    setDisplayValue(funcName + "(");
    setJustCalculated(false);
  }, [isError, justCalculated, currentInput]);
  
  const handleEqualsClick = useCallback(() => {
    if (isError) return;
    let finalExpression = expression;

    if (currentInput !== "" && !isNaN(parseFloat(currentInput))) {
        const lastToken = expression.trim().split(" ").pop();
        if (!OPERATORS[lastToken as string] && lastToken !== '(') {
            finalExpression += currentInput;
        }
    }
    
    const openParenCount = (finalExpression.match(/\(/g) || []).length;
    const closeParenCount = (finalExpression.match(/\)/g) || []).length;
    if (openParenCount > closeParenCount) {
        finalExpression += ')'.repeat(openParenCount - closeParenCount);
    }

    if (finalExpression.trim() === "") {
        setDisplayValue(formatDisplayNumber(currentInput)); 
        return;
    }

    try {
      const tokens = tokenize(finalExpression);
      if (tokens.length === 0 && isNumber(currentInput)) { 
        setDisplayValue(formatDisplayNumber(currentInput));
        setExpression(currentInput);
        setJustCalculated(true);
        return;
      }
      if (tokens.length === 0) {
        setDisplayValue("0");
        return;
      }

      const rpn = shuntingYard(tokens);
      const result = evaluateRPN(rpn, s);
      const formattedResult = formatDisplayNumber(result);

      setDisplayValue(formattedResult);
      setExpression(finalExpression); 
      setCurrentInput(String(result)); 
      
      if (history.length >= s.historySize) {
        setHistory(prev => [...prev.slice(1), { expression: finalExpression, result: formattedResult }]);
      } else {
        setHistory(prev => [...prev, { expression: finalExpression, result: formattedResult }]);
      }
      setIsError(false);
      setJustCalculated(true);

    } catch (e: unknown) { 
      console.error("Calculation error:", e instanceof Error ? e.message : String(e));
      setDisplayValue("Error");
      setExpression(finalExpression);
      setCurrentInput("0");
      setIsError(true);
      setJustCalculated(true); 
    }
  }, [isError, expression, currentInput, s, formatDisplayNumber, history]);


  const clearEntry = useCallback(() => {
    if (isError) {
      clearAll();
      return;
    }
    if (justCalculated) { 
        clearAll();
        return;
    }
    setCurrentInput("0");
    setDisplayValue("0");
  }, [isError, justCalculated, clearAll]);
  
  const handleBackspace = useCallback(() => {
    if (isError || justCalculated) return; 
    if (currentInput.length > 1) {
        const newCurrentInput = currentInput.slice(0, -1);
        setCurrentInput(newCurrentInput);
        setDisplayValue(newCurrentInput);
    } else if (currentInput.length === 1 && currentInput !== "0") {
        setCurrentInput("0");
        setDisplayValue("0");
    }
  }, [isError, justCalculated, currentInput]);

  const handleParenthesis = useCallback((paren: '(' | ')') => {
    if (isError) return;
    if (justCalculated && paren === '(') { 
        setExpression(paren + " "); 
        setCurrentInput("");
        setDisplayValue(paren);
        setJustCalculated(false);
        return;
    }
    if (justCalculated && paren === ')') { 
        return;
    }

    if (paren === '(' && currentInput !== "" && currentInput !== "0" && !isNaN(parseFloat(currentInput)) && !OPERATORS[expression.trim().slice(-1)] && expression.trim().slice(-1) !== '(') {
        setExpression(prev => prev + currentInput + " " + paren + " "); 
    } else {
        setExpression(prev => prev + paren + " "); 
    }
    
    setCurrentInput("");
    setDisplayValue(paren);
    setJustCalculated(false);
  }, [isError, justCalculated, currentInput, expression]);

  const toggleSign = useCallback(() => {
    if (isError || currentInput === "0" && expression === "") return; 
    if (currentInput !== "0" && currentInput !== "") { 
        if (currentInput.startsWith('-')) {
        const newCurrentInput = currentInput.substring(1);
        setCurrentInput(newCurrentInput);
        setDisplayValue(newCurrentInput);
        } else {
        const newCurrentInput = '-' + currentInput;
        setCurrentInput(newCurrentInput);
        setDisplayValue(newCurrentInput);
        }
    } else if (expression.trim() !== "") {
        if (justCalculated) {
            const num = parseFloat(displayValue);
            if (!isNaN(num)) {
                const toggledNum = -num;
                const formattedToggled = formatDisplayNumber(toggledNum);
                setCurrentInput(String(toggledNum));
                setDisplayValue(formattedToggled);
                setExpression(String(toggledNum)); 
                setJustCalculated(false); 
            }
        }
    }
  },[isError, currentInput, expression, justCalculated, displayValue, formatDisplayNumber]);

  const handlePercentage = useCallback(() => {
    if (isError) return;
    try {
        const val = parseFloat(currentInput);
        if (isNaN(val)) throw new Error("Invalid number for %");
        const result = val / 100;
        const formattedResult = formatDisplayNumber(result);
        setCurrentInput(String(result));
        setDisplayValue(formattedResult);
        setJustCalculated(false); 
    } catch (e: unknown) { 
        console.error("Percentage error:", e instanceof Error ? e.message : String(e));
        setDisplayValue("Error");
        setIsError(true);
    }
  }, [isError, currentInput, formatDisplayNumber]);

  const memoryClear = useCallback(() => { setMemory(0); }, []);
  const memoryRecall = useCallback(() => {
    const formattedMemory = formatDisplayNumber(memory);
    setCurrentInput(String(memory)); 
    setDisplayValue(formattedMemory);
    if (justCalculated || isError) {
        setExpression(String(memory)); 
        setJustCalculated(false);
        setIsError(false);
    }
  }, [memory, formatDisplayNumber, justCalculated, isError]);

  const memoryAdd = useCallback(() => {
    try {
      const val = parseFloat(currentInput);
      if (isNaN(val)) throw new Error("Invalid value for M+");
      setMemory(prev => prev + val);
      setJustCalculated(true); 
    } catch (e: unknown) { 
        console.error("MemoryAdd error:", e instanceof Error ? e.message : String(e));
        setDisplayValue("Error"); setIsError(true); 
    }
  }, [currentInput]);

  const memorySubtract = useCallback(() => {
    try {
      const val = parseFloat(currentInput);
      if (isNaN(val)) throw new Error("Invalid value for M-");
      setMemory(prev => prev - val);
      setJustCalculated(true); 
    } catch (e: unknown) { 
        console.error("MemorySubtract error:", e instanceof Error ? e.message : String(e));
        setDisplayValue("Error"); setIsError(true); 
    }
  }, [currentInput]);

  const memoryStore = useCallback(() => { 
    try {
        const val = parseFloat(currentInput);
        if (isNaN(val)) throw new Error("Invalid value for MS");
        setMemory(val);
        setJustCalculated(true);
    } catch (e: unknown) { 
        console.error("MemoryStore error:", e instanceof Error ? e.message : String(e));
        setDisplayValue("Error"); setIsError(true); 
    }
  }, [currentInput]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key;
      if (key >= '0' && key <= '9') handleNumberClick(key);
      else if (key === '.') handleNumberClick('.');
      else if (key === '+') handleOperatorClick('+');
      else if (key === '-') handleOperatorClick('-');
      else if (key === '*') handleOperatorClick('*');
      else if (key === '/') handleOperatorClick('/');
      else if (key === '^') handleOperatorClick('^');
      else if (key === 'Enter' || key === '=') { event.preventDefault(); handleEqualsClick(); }
      else if (key === 'Backspace') handleBackspace();
      else if (key.toLowerCase() === 'c') {
        if (event.altKey || event.metaKey) clearAll(); 
        else clearEntry(); 
      }
      else if (key === 'Escape') clearAll();
      else if (key === '(') handleParenthesis('(');
      else if (key === ')') handleParenthesis(')');
      else if (key === '%') handlePercentage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNumberClick, handleOperatorClick, handleEqualsClick, handleBackspace, clearAll, clearEntry, handleParenthesis, handlePercentage]);


  const simpleButtons: ButtonConfig[] = [
    { label: 'AC', action: clearAll, className: 'col-span-2 bg-red-500/80 hover:bg-red-600/80 dark:bg-red-700/80 dark:hover:bg-red-600/80' },
    { label: 'C', action: clearEntry, className: 'bg-amber-500/80 hover:bg-amber-600/80 dark:bg-amber-600/80 dark:hover:bg-amber-500/80' },
    { label: '÷', action: () => handleOperatorClick('/'), className: 'op-button' },
    { label: '7', action: () => handleNumberClick('7') }, { label: '8', action: () => handleNumberClick('8') },
    { label: '9', action: () => handleNumberClick('9') }, { label: '×', action: () => handleOperatorClick('*'), className: 'op-button' },
    { label: '4', action: () => handleNumberClick('4') }, { label: '5', action: () => handleNumberClick('5') },
    { label: '6', action: () => handleNumberClick('6') }, { label: '−', action: () => handleOperatorClick('-'), className: 'op-button' },
    { label: '1', action: () => handleNumberClick('1') }, { label: '2', action: () => handleNumberClick('2') },
    { label: '3', action: () => handleNumberClick('3') }, { label: '+', action: () => handleOperatorClick('+'), className: 'op-button' },
    { label: '0', action: () => handleNumberClick('0'), className: 'col-span-2' },
    { label: '.', action: () => handleNumberClick('.') },
    { label: '=', action: handleEqualsClick, className: 'bg-green-500/80 hover:bg-green-600/80 dark:bg-green-600/80 dark:hover:bg-green-500/80' },
  ];

  const scientificButtons: ButtonConfig[] = [
    { label: s.angleUnit === 'deg' ? 'Deg' : 'Rad', action: () => {/* Informational only or open settings */}, className: `text-xs ${s.angleUnit === 'deg' ? 'bg-sky-600 ring-2 ring-sky-300' : 'bg-sky-800'} hover:bg-sky-700`, title: `Current unit: ${s.angleUnit}. Change in settings.` },
    { label: 'x!', action: () => handleFunctionClick('fact'), className: 'sci-button' },
    { label: 'sin', action: () => handleFunctionClick('sin'), className: 'sci-button' },
    { label: 'cos', action: () => handleFunctionClick('cos'), className: 'sci-button' },
    { label: 'tan', action: () => handleFunctionClick('tan'), className: 'sci-button' },
    { label: '%', action: handlePercentage, className: 'sci-button' },
    { label: 'AC', action: clearAll, className: 'bg-red-500/80 hover:bg-red-600/80' },

    { label: '(', action: () => handleParenthesis('('), className: 'sci-button' },
    { label: 'ln', action: () => handleFunctionClick('ln'), className: 'sci-button' },
    { label: '7', action: () => handleNumberClick('7') }, { label: '8', action: () => handleNumberClick('8') },
    { label: '9', action: () => handleNumberClick('9') }, { label: '÷', action: () => handleOperatorClick('/'), className: 'op-button' },
    { label: 'C', action: clearEntry, className: 'bg-amber-500/80 hover:bg-amber-600/80' },
    
    { label: ')', action: () => handleParenthesis(')'), className: 'sci-button' },
    { label: 'log', action: () => handleFunctionClick('log'), className: 'sci-button' },
    { label: '4', action: () => handleNumberClick('4') }, { label: '5', action: () => handleNumberClick('5') },
    { label: '6', action: () => handleNumberClick('6') }, { label: '×', action: () => handleOperatorClick('*'), className: 'op-button' },
    { label: '±', action: toggleSign, className: 'op-button' },
    
    { label: '√', action: () => handleFunctionClick('sqrt'), className: 'sci-button' },
    { label: 'x^y', action: () => handleOperatorClick('^'), className: 'sci-button' },
    { label: '1', action: () => handleNumberClick('1') }, { label: '2', action: () => handleNumberClick('2') },
    { label: '3', action: () => handleNumberClick('3') }, { label: '−', action: () => handleOperatorClick('-'), className: 'op-button' },
    { label: 'M+', action: memoryAdd, className: 'mem-button' },
    
    { label: 'π', action: () => { const piStr = String(Math.PI); handleNumberClick(piStr); setExpression(prev => prev + piStr + " ") }, className: 'sci-button' },
    { label: 'e', action: () => { const eStr = String(Math.E); handleNumberClick(eStr); setExpression(prev => prev + eStr + " ") }, className: 'sci-button' },
    { label: '0', action: () => handleNumberClick('0'), className: 'col-span-2' },
    { label: '.', action: () => handleNumberClick('.') }, { label: '+', action: () => handleOperatorClick('+'), className: 'op-button' },
    { label: 'M-', action: memorySubtract, className: 'mem-button' },

    { label: 'MR', action: memoryRecall, className: 'mem-button' },
    { label: 'MC', action: memoryClear, className: 'mem-button' },
    { label: 'MS', action: memoryStore, className: 'mem-button' },
    { label: '⌫', action: handleBackspace, className: 'op-button col-span-2' }, 
    { label: '=', action: handleEqualsClick, className: 'bg-green-500/80 hover:bg-green-600/80 col-span-2' }, 
  ];
  
  const buttonsToRender: ButtonConfig[] = s.mode === 'scientific' ? scientificButtons : simpleButtons;
  const gridColsClass = s.mode === 'scientific' ? 'grid-cols-7' : 'grid-cols-4';

  const baseButtonClass = `text-sm md:text-base font-medium rounded-md p-2 md:p-2.5 active:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-dark-surface dark:focus:ring-offset-slate-900 focus:ring-accent-primary dark:focus:ring-sky-400 transition-all duration-100 ease-in-out text-slate-50`;
  const numberButtonClass = "bg-slate-600/70 hover:bg-slate-500/70 dark:bg-slate-700/70 dark:hover:bg-slate-600/70";
  const opButtonClass = "bg-orange-500/80 hover:bg-orange-600/80 dark:bg-orange-600/80 dark:hover:bg-orange-500/80";
  const sciButtonClass = "bg-sky-700/80 hover:bg-sky-600/80 dark:bg-sky-800/80 dark:hover:bg-sky-700/80";
  const memButtonClass = "bg-purple-600/80 hover:bg-purple-700/80 dark:bg-purple-700/80 dark:hover:bg-purple-600/80";

  const getButtonClass = (btn: ButtonConfig) => {
    if (btn.className?.includes('bg-')) return btn.className.split(' ').filter(c => c.startsWith('bg-') || c.startsWith('hover:bg-') || c.startsWith('dark:bg-') || c.startsWith('dark:hover:bg-') || c.startsWith('ring-')).join(' ');
    if (btn.className === 'op-button') return opButtonClass;
    if (btn.className === 'sci-button') return sciButtonClass;
    if (btn.className === 'mem-button') return memButtonClass;
    return numberButtonClass;
  };
  
  const animationClass = s.enableAnimations ? "transform active:scale-95" : "";

  return (
    <div className="w-full h-full flex flex-col p-2 bg-slate-800/80 dark:bg-slate-900/90 text-primary overflow-hidden rounded-lg shadow-xl">
      <div className={`bg-slate-900/70 dark:bg-black/70 text-right p-3 rounded-t-lg mb-2 shadow-inner`}>
        <div 
            className="h-6 text-xs md:text-sm text-slate-400 dark:text-slate-500 font-mono break-all truncate"
            title={expression}
        >
            {expression.length > MAX_EXPRESSION_LENGTH ? "..." + expression.slice(-MAX_EXPRESSION_LENGTH + 3) : expression}
        </div>
        <div
          className={`block text-2xl md:text-4xl font-mono break-all ${isError ? 'text-red-400 dark:text-red-500' : 'text-slate-50 dark:text-slate-100'} transition-colors duration-200`}
          style={{ minHeight: '2em', lineHeight: '1.25em' }} 
          title={displayValue}
        >
          {displayValue.length > MAX_DISPLAY_LENGTH ? displayValue.slice(0, MAX_DISPLAY_LENGTH -3) + "..." : displayValue}
        </div>
      </div>

      <div className={`grid ${gridColsClass} gap-1.5 flex-grow`}>
        {buttonsToRender.map((btn) => (
          <button
            key={btn.label}
            onClick={btn.action}
            className={`${baseButtonClass} ${getButtonClass(btn)} ${animationClass} ${btn.className && (btn.className.includes('col-span-') || btn.className.includes('row-span-')) ? btn.className.split(' ').filter(c => c.includes('span-')).join(' ') : ''}`}
            aria-label={btn.label}
            title={btn.title || btn.label} 
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CalculatorWidget;
