// src/components/CountdownStopwatchWidget.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Interfaces & Types ---
export interface CountdownStopwatchWidgetSettings {
  defaultCountdownMinutes?: number; // Default minutes for new countdowns
  playSoundOnFinish?: boolean; // Whether to play a sound when countdown ends
}

interface CountdownStopwatchWidgetProps {
  settings?: CountdownStopwatchWidgetSettings;
  id: string;
}

// --- Icons ---
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm6.39-2.908a.75.75 0 01.766.027l3.5 2.5a.75.75 0 010 1.262l-3.5 2.5A.75.75 0 018 12.5v-5a.75.75 0 01.39-.658z" clipRule="evenodd" /></svg>;
const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zM9.25 6.75a.75.75 0 00-1.5 0v6.5a.75.75 0 001.5 0v-6.5zm3 0a.75.75 0 00-1.5 0v6.5a.75.75 0 001.5 0v-6.5z" clipRule="evenodd" /></svg>;
const StopIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm5-2.25A.75.75 0 017.75 7h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5A.75.75 0 017 12.25v-4.5z" clipRule="evenodd" /></svg>;
const ResetIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M15.312 5.312a.75.75 0 010 1.06L11.823 10l3.489 3.628a.75.75 0 11-1.092 1.032l-3.53-3.666a.75.75 0 010-1.032l3.53-3.666a.75.75 0 011.092 0zM6.75 5.25a.75.75 0 01.75.75v8.5a.75.75 0 01-1.5 0V6a.75.75 0 01.75-.75z" clipRule="evenodd" /></svg>; // Using a different reset icon (arrow path reverse)
const TimerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const StopwatchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m-4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75v1.5M16.5 6.375l-1.06 1.06M7.5 6.375L8.56 7.436" /></svg>;


// --- Settings Panel ---
export const CountdownStopwatchSettingsPanel: React.FC<{
  widgetId: string;
  currentSettings: CountdownStopwatchWidgetSettings | undefined;
  onSave: (newSettings: CountdownStopwatchWidgetSettings) => void;
}> = ({ widgetId, currentSettings, onSave }) => {
  const [defaultMinutes, setDefaultMinutes] = useState(currentSettings?.defaultCountdownMinutes || 5);
  const [playSound, setPlaySound] = useState(currentSettings?.playSoundOnFinish === undefined ? true : currentSettings.playSoundOnFinish);

  const handleSave = () => {
    onSave({
      defaultCountdownMinutes: Math.max(1, Math.min(360, defaultMinutes)), // Clamp between 1 min and 6 hours
      playSoundOnFinish: playSound,
    });
  };

  return (
    <div className="space-y-4 text-primary">
      <div>
        <label htmlFor={`cs-default-minutes-${widgetId}`} className="block text-sm font-medium text-secondary mb-1">
          Default Countdown Time (minutes):
        </label>
        <input
          type="number"
          id={`cs-default-minutes-${widgetId}`}
          value={defaultMinutes}
          onChange={(e) => setDefaultMinutes(parseInt(e.target.value, 10))}
          min="1" max="360"
          className="mt-1 block w-full px-3 py-2 bg-widget border border-border-interactive rounded-md shadow-sm focus:outline-none focus:ring-accent-primary focus:border-accent-primary sm:text-sm text-primary"
        />
      </div>
      <div>
        <label htmlFor={`cs-play-sound-${widgetId}`} className="flex items-center text-sm font-medium text-secondary cursor-pointer">
          <input
            type="checkbox"
            id={`cs-play-sound-${widgetId}`}
            checked={playSound}
            onChange={(e) => setPlaySound(e.target.checked)}
            className="h-4 w-4 text-accent-primary focus:ring-accent-primary border-border-interactive rounded mr-2 bg-widget"
          />
          Play Sound on Countdown Finish
        </label>
        <p className="text-xs text-secondary mt-1">Note: Sound functionality requires Tone.js integration in the main page.</p>
      </div>
      <button
        onClick={handleSave}
        className="mt-6 w-full px-4 py-2 bg-accent-primary text-on-accent rounded-md hover:bg-accent-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary focus:ring-offset-dark-surface"
      >
        Save Timer Settings
      </button>
    </div>
  );
};

// --- Main Component ---
const CountdownStopwatchWidget: React.FC<CountdownStopwatchWidgetProps> = ({ settings, id }) => {
  const [mode, setMode] = useState<'countdown' | 'stopwatch'>('countdown');
  // Countdown state
  const [countdownSeconds, setCountdownSeconds] = useState((settings?.defaultCountdownMinutes || 5) * 60);
  const [initialCountdownSet, setInitialCountdownSet] = useState((settings?.defaultCountdownMinutes || 5) * 60);
  const [inputHours, setInputHours] = useState(Math.floor((settings?.defaultCountdownMinutes || 5) / 60).toString());
  const [inputMinutes, setInputMinutes] = useState(((settings?.defaultCountdownMinutes || 5) % 60).toString());
  const [inputSeconds, setInputSeconds] = useState("0");

  // Stopwatch state
  const [stopwatchTime, setStopwatchTime] = useState(0); // Time in milliseconds

  // Common state
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);


  const playNotificationSound = useCallback(() => {
    if (!settings?.playSoundOnFinish) return;

    // Simple beep using Web Audio API as Tone.js is not directly available here
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current) {
        if (oscillatorRef.current) {
            oscillatorRef.current.stop();
            oscillatorRef.current.disconnect();
        }
        const oscillator = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();

        oscillator.type = 'sine'; // sine, square, sawtooth, triangle
        oscillator.frequency.setValueAtTime(440, audioContextRef.current.currentTime); // A4 note
        gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime); // Volume
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContextRef.current.currentTime + 0.5);


        oscillator.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);

        oscillator.start();
        oscillator.stop(audioContextRef.current.currentTime + 0.5); // Beep for 0.5 seconds
        oscillatorRef.current = oscillator;
    }
  }, [settings?.playSoundOnFinish]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        if (mode === 'countdown') {
          setCountdownSeconds(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current!);
              setIsRunning(false);
              playNotificationSound();
              return 0;
            }
            return prev - 1;
          });
        } else { // Stopwatch
          setStopwatchTime(prev => prev + 10); // Update every 10ms for smoother display
        }
      }, mode === 'countdown' ? 1000 : 10);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (oscillatorRef.current) { // Clean up oscillator on unmount or effect re-run
          oscillatorRef.current.stop();
          oscillatorRef.current.disconnect();
          oscillatorRef.current = null;
      }
    };
  }, [isRunning, mode, playNotificationSound]);


  const handleSetCountdown = () => {
    const hrs = parseInt(inputHours, 10) || 0;
    const mins = parseInt(inputMinutes, 10) || 0;
    const secs = parseInt(inputSeconds, 10) || 0;
    const totalSeconds = hrs * 3600 + mins * 60 + secs;
    if (totalSeconds > 0) {
        setCountdownSeconds(totalSeconds);
        setInitialCountdownSet(totalSeconds);
        setIsRunning(false); // Stop if running
    } else { // If input is 0 or invalid, reset to default or last set time
        const defaultTotalSeconds = (settings?.defaultCountdownMinutes || 5) * 60;
        setCountdownSeconds(defaultTotalSeconds);
        setInitialCountdownSet(defaultTotalSeconds);
    }
  };

  const handleStartPause = () => setIsRunning(prev => !prev);

  const handleReset = () => {
    setIsRunning(false);
    if (mode === 'countdown') {
      setCountdownSeconds(initialCountdownSet);
    } else {
      setStopwatchTime(0);
    }
  };

  const formatTime = (totalSeconds: number): string => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatStopwatchTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10); // Display hundredths of a second
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
  };

  const commonInputClass = "w-full px-2 py-1.5 bg-slate-700/60 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary text-sm text-primary placeholder-slate-400/70 transition-colors text-center";
  const buttonClass = "px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-surface transition-all duration-150 shadow-md hover:shadow-lg flex-grow basis-0";
  const modeButtonClass = (isActive: boolean) => `px-3 py-1.5 text-xs rounded-md transition-colors ${isActive ? 'bg-accent-primary text-on-accent' : 'bg-slate-600 hover:bg-slate-500 text-slate-200'}`;

  return (
    <div className="w-full h-full flex flex-col p-3.5 bg-transparent text-primary overflow-hidden space-y-4 items-center justify-center">
      {/* Mode Toggle */}
      <div className="flex space-x-2 mb-3">
        <button onClick={() => { setMode('countdown'); handleReset(); }} className={modeButtonClass(mode === 'countdown')}>
          <TimerIcon /> <span className="ml-1">Countdown</span>
        </button>
        <button onClick={() => { setMode('stopwatch'); handleReset(); }} className={modeButtonClass(mode === 'stopwatch')}>
          <StopwatchIcon /> <span className="ml-1">Stopwatch</span>
        </button>
      </div>

      {/* Display */}
      <div className="text-5xl md:text-6xl font-mono font-light text-slate-50 mb-4 tabular-nums tracking-tight p-3 bg-slate-800/50 rounded-lg shadow-inner min-w-[280px] text-center">
        {mode === 'countdown' ? formatTime(countdownSeconds) : formatStopwatchTime(stopwatchTime)}
      </div>

      {/* Countdown Input Fields (only for countdown mode and when not running) */}
      {mode === 'countdown' && !isRunning && (
        <div className="w-full max-w-xs space-y-2 mb-4">
            <div className="grid grid-cols-3 gap-2 items-center">
                <div>
                    <label htmlFor={`cd-hours-${id}`} className="block text-xs text-secondary mb-0.5 text-center">Hours</label>
                    <input type="number" id={`cd-hours-${id}`} value={inputHours} onChange={e => setInputHours(e.target.value)} min="0" max="99" className={commonInputClass} />
                </div>
                <div>
                    <label htmlFor={`cd-minutes-${id}`} className="block text-xs text-secondary mb-0.5 text-center">Minutes</label>
                    <input type="number" id={`cd-minutes-${id}`} value={inputMinutes} onChange={e => setInputMinutes(e.target.value)} min="0" max="59" className={commonInputClass} />
                </div>
                <div>
                    <label htmlFor={`cd-seconds-${id}`} className="block text-xs text-secondary mb-0.5 text-center">Seconds</label>
                    <input type="number" id={`cd-seconds-${id}`} value={inputSeconds} onChange={e => setInputSeconds(e.target.value)} min="0" max="59" className={commonInputClass} />
                </div>
            </div>
            <button onClick={handleSetCountdown} className={`${buttonClass} bg-blue-600 hover:bg-blue-500 text-white w-full mt-1`}>
            Set Countdown
            </button>
        </div>
      )}

      {/* Controls */}
      <div className="flex space-x-3 w-full max-w-xs">
        <button
          onClick={handleStartPause}
          className={`${buttonClass} ${isRunning ? 'bg-yellow-500 hover:bg-yellow-400 text-black' : 'bg-green-600 hover:bg-green-500 text-white'}`}
          aria-label={isRunning ? "Pause" : "Start"}
        >
          {isRunning ? <PauseIcon /> : <PlayIcon />}
          <span className="ml-1.5">{isRunning ? 'Pause' : 'Start'}</span>
        </button>
        <button
          onClick={handleReset}
          disabled={isRunning && mode === 'countdown'} // Allow reset for stopwatch even if running
          className={`${buttonClass} bg-red-600 hover:bg-red-500 text-white disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed`}
          aria-label="Reset"
        >
          <ResetIcon />
          <span className="ml-1.5">Reset</span>
        </button>
      </div>
    </div>
  );
};

export default CountdownStopwatchWidget;
