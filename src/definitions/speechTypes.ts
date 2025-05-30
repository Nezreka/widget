// src/definitions/speechTypes.ts

/**
 * Represents a single recognition result from the speech recognition service.
 */
export interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

/**
 * Represents a single alternative hypothesis for a recognized speech segment.
 */
export interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

/**
 * Represents a list of SpeechRecognitionResult objects.
 */
export interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

/**
 * Represents the event object for the 'result' and 'nomatch' events of the SpeechRecognition interface.
 */
export interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
  readonly interpretation?: unknown; // Deprecated
  readonly emma?: Document; // Deprecated
}

/**
 * Represents the event object for the 'error' event of the SpeechRecognition interface.
 */
export interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string; // Describes the type of error
  readonly message: string; // A human-readable description of the error
}

/**
 * Represents a grammar that the speech recognition service should use.
 */
export interface SpeechGrammar {
  src: string; // URI of the grammar
  weight?: number; // Weight of the grammar
}

/**
 * Represents a list of SpeechGrammar objects.
 */
export interface SpeechGrammarList {
  readonly length: number;
  item(index: number): SpeechGrammar;
  [index: number]: SpeechGrammar;
  addFromString(string: string, weight?: number): void;
  addFromURI(src: string, weight?: number): void;
}

/**
 * Represents the constructor for the SpeechRecognition object.
 */
export interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

/**
 * The main interface for the Web Speech API, providing the ability to recognize voice.
 */
export interface SpeechRecognition extends EventTarget {
  grammars: SpeechGrammarList;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  serviceURI?: string; // Deprecated

  abort(): void;
  start(): void;
  stop(): void;

  onaudiostart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void)
    | null;
  onnomatch:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
    | null;
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
    | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;

  addEventListener<K extends keyof SpeechRecognitionEventMap>(
    type: K,
    listener: (
      this: SpeechRecognition,
      ev: SpeechRecognitionEventMap[K]
    ) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof SpeechRecognitionEventMap>(
    type: K,
    listener: (
      this: SpeechRecognition,
      ev: SpeechRecognitionEventMap[K]
    ) => void,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}

/**
 * Defines the event map for SpeechRecognition events.
 */
export interface SpeechRecognitionEventMap {
  audiostart: Event;
  audioend: Event;
  end: Event;
  error: SpeechRecognitionErrorEvent;
  nomatch: SpeechRecognitionEvent;
  result: SpeechRecognitionEvent;
  soundstart: Event;
  soundend: Event;
  speechstart: Event;
  speechend: Event;
  start: Event;
}

// Augment the global Window interface to include SpeechRecognition-related properties.
// This is necessary because these properties are typically added to the window object by the browser.
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic; // For Safari and older Chrome versions
    SpeechSynthesisUtterance: typeof SpeechSynthesisUtterance; // Related to speech synthesis
    readonly speechSynthesis: SpeechSynthesis; // Related to speech synthesis
  }
}
