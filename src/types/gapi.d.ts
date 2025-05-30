// src/types/gapi.d.ts

/// <reference types="@types/google.maps" />
// It's generally good practice to also include a reference to google.accounts here
// if this file makes direct use of its types, or for clarity,
// even if it's also referenced in other files like your .tsx component.
/// <reference types="@types/google.accounts" />

// --- Google Calendar Event Specific Interface ---
// This is used by the GapiClient.calendar.events.list method
export interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  colorId?: string;
  description?: string;
  attendees?: { email: string; responseStatus: string }[];
  organizer?: { email: string; displayName?: string };
  htmlLink?: string;
  [key: string]: unknown; // For any other properties
}

// --- Common GAPI & GIS Interfaces ---

/**
 * Represents the token object returned by gapi.client.getToken().
 * This is part of the older Google API Client Library (gapi).
 */
interface GapiAuth2TokenObject {
  access_token: string;
  // Include other properties like id_token, expires_in, etc., if your application uses them.
  // example:
  // id_token?: string;
  // expires_in?: number;
  // token_type?: string;
  // scope?: string;
}

/**
 * Custom interface for error responses, potentially from various Google services.
 * If this is specifically for GIS `error_callback`, consider using
 * `google.accounts.oauth2.ClientConfigError` or `google.accounts.oauth2.PopupClosedError` etc.
 * or a union of them.
 */
export interface GapiErrorResponse {
  type?: string; // e.g., 'popup_closed', 'popup_failed_to_open' from GIS
  message?: string; // General message
  error?: string; // Error code or short description
  details?: string; // Detailed error message
  // Add other error properties if needed by any widget or GAPI call
}

/**
 * Custom interface for token responses.
 * For GIS `initTokenClient` callback, `google.accounts.oauth2.TokenResponse` is standard.
 * This GapiTokenResponse might be for other OAuth flows or a generic wrapper.
 */
export interface GapiTokenResponse {
  access_token?: string;
  error?: string; // e.g., 'access_denied', 'invalid_grant'
  error_description?: string;
  expires_in?: number;
  // Add other response properties if needed by any widget
}

/**
 * Interface for user information, typically from `gapi.client.oauth2.userinfo.get()`.
 */
interface GapiUserInfo {
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  email_verified?: boolean;
  picture?: string;
  locale?: string;
  hd?: string; // Hosted domain for G Suite users
  // Add other user info properties if needed by any widget
}

/**
 * Represents the GAPI client, providing access to various Google APIs.
 */
interface GapiClient {
  /** Initializes the GAPI client. */
  init: (args: {
    apiKey: string | undefined;
    discoveryDocs?: string[];
    // clientId?: string; // clientId is usually handled by GIS for OAuth2
    // scope?: string;    // scope is also usually handled by GIS for OAuth2
  }) => Promise<void>;

  /** Loads a GAPI client library (e.g., 'calendar', 'oauth2'). */
  load: (apiName: string, versionOrCallback?: string | (() => void), callback?: () => void) => Promise<void> | void;


  /** OAuth2 specific client methods (part of gapi.client.oauth2). */
  oauth2?: {
    userinfo: {
      get: () => Promise<{ result: GapiUserInfo }>;
    };
    // You might add other gapi.client.oauth2 methods if used, e.g., for token validation
  };

  /** Calendar API specific client methods (part of gapi.client.calendar). */
  calendar?: {
    events: {
      list: (args: {
        calendarId: string;
        timeMin?: string; // ISO date string
        timeMax?: string; // ISO date string
        showDeleted?: boolean;
        singleEvents?: boolean;
        maxResults?: number;
        orderBy?: 'startTime' | 'updated'; // Common values
        q?: string; // Free text search
        pageToken?: string;
      }) => Promise<{ result: { items: GoogleCalendarEvent[]; nextPageToken?: string; summary?: string; } }>;
      // Add other calendar event methods if used (insert, update, delete, get, etc.)
      // e.g. get: (params: { calendarId: string; eventId: string; }) => Promise<{ result: GoogleCalendarEvent }>;
    };
    // Add other calendar resources if used (e.g., calendarList, settings)
  };

  /** Gets the current OAuth2 token object. */
  getToken: () => GapiAuth2TokenObject | null;

  /** Sets the OAuth2 token object for the GAPI client. */
  setToken: (token: GapiAuth2TokenObject | null) => void;

  // Add other GapiClient methods/properties if used by any widget
  // e.g. request: <T = any>(args: { path: string; method?: string; params?: object; headers?: object; body?: any; }) => Promise<{ result: T }>;
}

/**
 * This is your custom interface for a token client.
 * Note: Google Identity Services (GIS) provides `google.accounts.oauth2.TokenClient`.
 * If this is intended to be a wrapper or a different kind of client, its definition is fine.
 * If it's meant to represent the GIS TokenClient, you should align it with
 * or use `google.accounts.oauth2.TokenClient` directly.
 * The GoogleMapsWidget.tsx uses a ref typed as `google.accounts.oauth2.TokenClient`.
 */
export interface GoogleTokenClient {
  requestAccessToken: (options?: { prompt?: string; hint?: string }) => void;
  // Add other methods/properties if needed, e.g., for handling token expiration or refresh
}

/**
 * Interface for `google.accounts.oauth2` namespace from Google Identity Services.
 * This should align with the types provided by `@types/google.accounts`.
 */
interface GoogleAccountsOauth2 {
  /** Initializes a token client for handling OAuth2 flows. */
  initTokenClient: (config: google.accounts.oauth2.TokenClientConfig) => google.accounts.oauth2.TokenClient;

  /** Revokes an OAuth2 token. */
  revoke: (token: string, callback: () => void) => void;

  // Add other google.accounts.oauth2 methods/properties if used
  // e.g. hasGrantedAllScopes, hasGrantedAnyScope
}

/**
 * Interface for `google.accounts.id` namespace from Google Identity Services.
 * This should align with the types provided by `@types/google.accounts`.
 */
interface GoogleAccountsId {
  /** Initializes the Google Sign-In client. */
  initialize: (config: google.accounts.id.IdConfiguration) => void;

  /** Renders a Sign In With Google button. */
  renderButton: (
    parentElement: HTMLElement,
    options: google.accounts.id.GsiButtonConfiguration,
    clickListener?: (event: MouseEvent) => void
  ) => void;

  /** Prompts the user for One Tap sign-in or sign-up. */
  prompt: (notification?: google.accounts.id.PromptMomentNotification) => void;

  /** Disables automatic sign-in (One Tap). */
  disableAutoSelect: () => void;

  /** Signs the user out from the Google session on the browser. */
  revokeToken: (token: string, callback: () => void) => void; // Deprecated, use google.accounts.oauth2.revoke

  /** Stores a session state for the user. */
  storeCredential: (credential: string, callback?: () => void) => void;

  /** Cancels an ongoing One Tap prompt. */
  cancel: () => void;

  // Add other google.accounts.id methods/properties if used
}

// --- Global Window Augmentation ---
declare global {
  interface Window {
    /** Google API Client Library (gapi) */
    gapi: {
      /**
       * Loads the client library interface for a particular API.
       * @param apiName The name of the API to load, e.g., 'client', 'auth2', 'calendar'.
       * @param callbackOrVersion The callback function to call when the API is loaded, or the API version.
       * @param callback If version is provided, this is the callback.
       */
      load: (apiName: string, callbackOrVersion: (() => void) | string, callback?: () => void) => void;

      /** The GAPI client instance, available after `gapi.load('client', ...)` */
      client: GapiClient;

      // If you use gapi.auth2 directly (older library, GIS is preferred for new apps):
      // auth2?: {
      //   init: (params: { client_id: string; scope?: string; ux_mode?: 'popup' | 'redirect'; redirect_uri?: string; }) => google.auth2.GoogleAuth;
      //   getAuthInstance: () => google.auth2.GoogleAuth;
      //   // ... other gapi.auth2 methods
      // };
    };

    /** Google Identity Services (GIS) */
    google: {
      accounts: {
        /** OAuth 2.0 client for Google Identity Services. */
        oauth2: GoogleAccountsOauth2;

        /** Google Sign-In client for Google Identity Services. */
        id?: GoogleAccountsId; // Optional as it might not always be loaded/used

        // Add other google.accounts sub-namespaces if needed
      };

      /**
       * Google Maps JavaScript API namespace.
       * Primarily typed by `@types/google.maps`.
       * This ensures it's part of the `window.google` namespace.
       */
      maps: typeof google.maps & {
        places?: typeof google.maps.places; // Ensure sub-namespaces are available if used directly
        routes?: typeof google.maps.routes;
        // Add other google.maps sub-namespaces if needed, e.g., visualization, drawing
      };
    };

    /** Callback function for Google Maps API script loading. */
    initMap?: () => void; // Standard callback name for Maps API

    /**
     * Optional global reference to a GIS token client.
     * It's often better to manage this within component state or refs.
     */
    tokenClient?: google.accounts.oauth2.TokenClient;

    /**
     * For dynamic callback names (e.g., Google Maps initMap_instanceId).
     * Allows window['someDynamicCallbackName'] = () => { ... };
     */
    [key: string]: (() => void) | unknown;
  }
}

// This export ensures the file is treated as a module, making the global augmentations apply.
export {};
