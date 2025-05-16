# Customizable Widget Dashboard

## 🚀 Overview

This project is a dynamic, grid-based dashboard application built with Next.js and React. It allows users to arrange and interact with various widgets on a customizable grid. The dashboard features a sleek, dark-themed UI with a particle background and provides a foundation for a highly personalized user experience.

## ✨ Current Features

* **Grid-Based Layout:** Widgets are placed on a responsive grid that adapts to screen size.
* **Widget Management:**
    * **Move & Resize:** Widgets can be freely moved and resized by the user.
    * **Minimize/Maximize:** Widgets can be minimized to save space or maximized for a focused view.
    * **Delete:** Widgets can be removed from the dashboard.
    * **Focus:** Active widget is highlighted.
* **Settings Modal:** A generic modal system for configuring individual widget settings.
* **Undo/Redo:** Functionality to undo and redo widget layout changes (move, resize, delete, settings changes).
* **Available Widgets:**
    * **Weather Widget:** Displays current weather and hourly forecast for a specified location (supports manual entry or geolocation). Customizable units (Imperial/Metric).
    * **Clock Widget:**
        * **Analog Mode:** Classic analog clock face with hour, minute, and optional second hands.
        * **Digital Mode:** Digital time display with 12/24 hour format and optional seconds.
    * **Calculator Widget:** A functional calculator for basic arithmetic operations.
    * **ToDo Widget (Placeholder):** Basic structure for a to-do list.
* **Aesthetic UI:**
    * Dark theme with CSS variables for easy theming.
    * Dynamic particle background (`GridBackground.tsx`).
    * Tailwind CSS for styling.

## 💻 Tech Stack

* **Framework:** Next.js (App Router)
* **Language:** TypeScript
* **Styling:** Tailwind CSS, CSS Variables
* **State Management:** React Hooks (`useState`, `useEffect`, `useCallback`, `useRef`)
* **Core UI:** React

## 🛠️ Getting Started

This is a Next.js project.

1.  **Clone the repository (if applicable):**
    ```bash
    git clone <your-repository-url>
    cd <project-directory>
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```
3.  **Set up Environment Variables:**
    * Create a `.env.local` file in the root of your project.
    * Add your Tomorrow.io API key for the Weather Widget:
        ```
        NEXT_PUBLIC_TOMORROW_API_KEY=your_api_key_here
        ```
4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🔮 Future Ideas & Enhancements

We have many exciting ideas to expand the dashboard's capabilities:

* **Dynamic Widget Loading & Management:**
    * Implement a "+" button or a widget palette for adding new widgets.
    * Allow users to select and add new widgets to the dashboard dynamically.
    * Widgets define their own default sizes.
    * **Widget Discovery & Search:**
        * Search for widgets by name.
        * Filter widgets by categories (e.g., "Productivity", "Educational", "Entertainment").
    * **Auto-Placement Algorithm:** Intelligently place newly added widgets in available grid space.
* **Client-Side Persistence & Portability:**
    * **Local Storage:** Automatically save the current dashboard layout (widgets, positions, sizes, settings) to the browser's `localStorage` to persist changes between sessions.
    * **Export/Import Layout:** Allow users to export their entire dashboard configuration as a JSON file (a "blob"). This file can be saved, shared, or used to import the layout onto another computer or browser.
* **More Widgets:**
    * Notes/Scratchpad
    * Calendar
    * News Feed (RSS)
    * Countdown Timer
    * Stock Ticker / Crypto Tracker
* **Advanced Clock Widget Features:**
    * Customizable analog clock faces (numerals, hand styles, colors).
    * Selectable fonts for digital display.
    * Date display options.
    * Timezone selection.
* **Theming:** More advanced theming options for the dashboard and widgets.
* **Accessibility Improvements:** Continuously review and enhance accessibility.

## 📁 Project Structure (Key Components)

* `src/app/page.tsx`: The main entry point for the dashboard, manages overall layout, widget state, and interactions.
* `src/components/`: Contains reusable UI components and individual widget components.
    * `Widget.tsx`: The generic wrapper for all widgets, handling move, resize, minimize, maximize, delete, and settings controls.
    * `GridBackground.tsx`: Renders the animated particle background.
    * `SettingsModal.tsx`: Provides the modal UI for widget settings.
    * `WeatherWidget.tsx`: Logic and UI for the weather widget.
    * `ClockWidget.tsx`: Logic and UI for the analog and digital clock widget.
    * `CalculatorWidget.tsx`: Logic and UI for the calculator widget.
* `src/app/globals.css`: Global styles and Tailwind CSS setup, including CSS variables for theming.

---

This README provides a good overview. Feel free to expand on any section as the project grows!
