# Customizable Widget Dashboard

🚀 ## Overview

This project is a dynamic, grid-based dashboard application built with Next.js and React. It allows users to arrange and interact with various widgets on a customizable grid. The dashboard features a sleek, dark-themed UI with a particle background and provides a foundation for a highly personalized user experience.

✨ ## Current Features

* **Grid-Based Layout**: Widgets are placed on a responsive grid that adapts to screen size.
* **Widget Management**:
    * **Move & Resize**: Widgets can be freely moved and resized by the user.
    * **Minimize/Maximize**: Widgets can be minimized to save space or maximized for a focused view.
    * **Delete**: Widgets can be removed from the dashboard.
    * **Focus**: Active widget is highlighted.
* **Add New Widgets**: Users can dynamically add new widgets to the dashboard from a predefined list.
* **Settings Modals**:
    * **Widget Content Settings**: A generic modal system for configuring individual widget-specific settings.
    * **Widget Container Appearance Settings**: A modal for customizing the appearance of individual widget containers (e.g., background color, title bar visibility, inner padding).
* **Persistence**:
    * **Dashboard Layout**: The entire dashboard layout (widgets, positions, sizes, content settings, and container appearance settings) is saved to `localStorage`.
    * **Global Notes**: Notes created in the NotesWidget are saved globally in `localStorage`.
    * **Global To-Do List**: Tasks in the To-Do widget are saved globally in `localStorage`.
    * **Global Photo History**: The history of images viewed in the PhotoWidget is saved globally in `localStorage`.
* **Undo/Redo**: Functionality to undo and redo widget layout changes (add, move, resize, delete, settings changes).
* **Export/Import Layout**: Users can export their dashboard configuration (including widget layouts and global data like notes, to-dos, and photo history) as a JSON file and import it.
* **Aesthetic UI**:
    * Dark theme with CSS variables for easy theming.
    * Dynamic particle background (`GridBackground.tsx`).
    * Tailwind CSS for styling.
* **Available Widgets**:
    * **Weather Widget**: Displays current weather and hourly forecast. Customizable location (manual/geolocation) and units (Imperial/Metric).
    * **Clock Widget**: Analog and digital clock modes with options for seconds display and 12/24 hour format.
    * **Calculator Widget**: A functional calculator for basic arithmetic operations.
    * **To-Do List Widget**: Global task management with filtering, sorting, and completion status.
    * **Notes Widget**: Rich text editor for jotting down notes, with global storage. Settings for font size and a global clear option.
    * **YouTube Widget**: Search and play YouTube videos. Includes a results panel and settings for default query and max results.
    * **Minesweeper Widget**: Classic Minesweeper game with selectable difficulty levels.
    * **Unit Converter Widget**: Converts values between various units across categories like length, weight, temperature, volume, and speed. Settings for default category and precision.
    * **Countdown/Stopwatch Widget**: Dual-functionality timer and stopwatch. Settings for default countdown time and notification sound.
    * **Photo Widget**: Displays images from URLs or uploads. Features global image history, sidebar, and settings for image display style (object-fit) and clearing history/current image.
    * **Portfolio Widget**: A personal portfolio showcase. Settings for accent color and toggling an animated background.

💻 ## Tech Stack

* **Framework**: Next.js (App Router)
* **Language**: TypeScript
* **Styling**: Tailwind CSS, CSS Variables
* **State Management**: React Hooks (`useState`, `useEffect`, `useCallback`, `useRef`)
* **Core UI**: React
* **Fonts**: Geist Sans, Geist Mono

🛠️ ## Getting Started

This is a Next.js project.

1.  **Clone the repository (if applicable)**:
    ```bash
    git clone <your-repository-url>
    cd <project-directory>
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```
3.  **Set up Environment Variables**:
    * Create a `.env.local` file in the root of your project.
    * Add your Tomorrow.io API key for the Weather Widget:
        ```env
        NEXT_PUBLIC_TOMORROW_API_KEY=your_api_key_here
        ```
    * **Note on YouTube API Key**: The YouTube widget currently uses an API key (`AIzaSyAIsr27eVlsTIgd0kLM9Lq_WDr-vGbJjtI`) directly in the `YoutubeWidget.tsx` file. **WARNING**: Exposing API keys on the client side is insecure for production applications. For a real-world deployment, you should move API calls that require sensitive keys to a backend proxy.

4.  **Run the development server**:
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

🔮 ## Future Ideas & Enhancements

While many features have been implemented, here are some areas for future development:

* **Enhanced Widget Discovery & Management**:
    * Filter widgets in the "Add Widget" menu by categories (e.g., "Productivity", "Entertainment").
    * More sophisticated auto-placement algorithms for new widgets.
* **More Widgets**:
    * Calendar integration.
    * News Feed (RSS).
    * Stock Ticker / Crypto Tracker.
* **Advanced Widget Features**:
    * **Clock**: Customizable analog faces, selectable fonts, date display, timezone selection.
    * **Notes**: More rich text formatting options, potential for tagging/organization.
* **Theming**: More advanced global theming options for the dashboard and widgets.
* **Accessibility Improvements**: Continuously review and enhance accessibility across all components.
* **Performance Optimization**: For dashboards with a large number of widgets or complex data.
* **Backend Integration**: For features requiring server-side logic or secure API key management (especially for the YouTube API).

📁 ## Project Structure (Key Components)

* `src/app/page.tsx`: The main entry point for the dashboard, manages overall layout, widget state, global data (notes, todos, photo history), and interactions like settings modals, undo/redo, import/export.
* `src/components/`: Contains reusable UI components and individual widget components.
    * `Widget.tsx`: The generic wrapper for all widgets, handling move, resize, minimize, maximize, delete, and settings controls for both content and container appearance.
    * `GridBackground.tsx`: Renders the animated particle background.
    * `SettingsModal.tsx`: Provides the modal UI for individual widget content settings.
    * `WidgetContainerSettingsModal.tsx`: Provides the modal UI for widget container (appearance) settings.
    * `WeatherWidget.tsx`, `ClockWidget.tsx`, `CalculatorWidget.tsx`, `TodoWidget.tsx`, `NotesWidget.tsx`, `YoutubeWidget.tsx`, `MinesweeperWidget.tsx`, `UnitConverterWidget.tsx`, `CountdownStopwatchWidget.tsx`, `PhotoWidget.tsx`, `PortfolioWidget.tsx`: Logic and UI for each specific widget and their respective settings panels.
* `src/app/globals.css`: Global styles and Tailwind CSS setup, including CSS variables for theming and animations.
* `src/app/layout.tsx`: Root layout component, sets up global fonts.
