// src/components/NotesWidget.tsx
"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react'; // Removed useCallback, kept useMemo

// --- Interfaces ---
export interface Note {
  id: string;
  title: string;
  content: string;
  lastModified: number;
}

export interface NotesWidgetSettings {
  fontSize?: 'sm' | 'base' | 'lg';
}

interface NotesWidgetProps {
  notes: Note[];
  activeNoteId: string | null;
  onNotesChange: (notes: Note[]) => void;
  onActiveNoteIdChange: (id: string | null) => void;
  instanceId: string;
  settings?: NotesWidgetSettings;
}

// --- Helper Functions ---
const generateId = () => `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

// --- Rich Text Editing Icons (using Heroicons-style for a more modern feel) ---
const BoldIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M2.5 4A1.5 1.5 0 001 5.5V6h1.07a2.75 2.75 0 012.596 1.815C4.845 8.533 5 9.186 5 10c0 .814-.155 1.467-.334 2.185A2.75 2.75 0 012.07 14H1v.5A1.5 1.5 0 002.5 16h10a1.5 1.5 0 001.5-1.5v-1c0-.44-.166-.857-.456-1.185a3.001 3.001 0 000-4.63C13.834 7.357 14 6.94 14 6.5v-1A1.5 1.5 0 0012.5 4h-10zm0 1.5h10V6H2.5v-.5zm0 9H12.5v.5h-10v-.5zM2.75 12.5a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5zM11 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>;
const ItalicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M8.209 4.209a.75.75 0 01.958-.538l4.25 1.75a.75.75 0 01.093 1.352l-4.25 1.75a.75.75 0 01-.958-.538L7.25 5.709a.75.75 0 01.958-.538l.001-.001zM6.018 15.42a.75.75 0 01.537-.957l4.25-1.75a.75.75 0 01.957.537l1 4.25a.75.75 0 01-1.352.093L7.162 13.5a.75.75 0 01-.537.957l-1 4.25a.75.75 0 01-1.352-.094l1.74-7.186z" clipRule="evenodd" /></svg>;
const UnderlineIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4 4a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zm0 5.75A.75.75 0 014.75 9h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 9.75zm0 4.5A.75.75 0 014.75 13h10.5a.75.75 0 010 1.5H4.75a.75.75 0 01-.75-.75zM4 17.5a.75.75 0 01.75-.75h5.5a.75.75 0 010 1.5h-5.5a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>;
const StrikethroughIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4 9.75A.75.75 0 014.75 9h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 9.75zM6.06 4.94a.75.75 0 01.94-.22l6 2.5a.75.75 0 01.22.94l-1.25 3.01A2.518 2.518 0 0013.5 10.5a2.5 2.5 0 00-2.5-2.5c-.77 0-1.473.35-1.94.9l-1.25-3.02a.75.75 0 01-.22-.94zm-.84 6.04a.75.75 0 00.94.22l6-2.5a.75.75 0 00.22-.94l-1.25-3.01A2.518 2.518 0 016.5 9.5a2.5 2.5 0 01-2.5 2.5c.77 0 1.473-.35 1.94-.9l1.25 3.02a.75.75 0 00.22.94z" clipRule="evenodd" /></svg>;
const EmojiIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.75 9.25a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm.75 2.25a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75zM8 6.5A.5.5 0 018.5 6h.5a.5.5 0 010 1h-.5A.5.5 0 018 6.5zm4 0a.5.5 0 01.5-.5h.5a.5.5 0 010 1h-.5a.5.5 0 01-.5-.5z" clipRule="evenodd" /></svg>;
const EMOJI_LIST = ['😀', '😂', '😍', '🤔', '🎉', '👍', '❤️', '⭐', '💡', '⚠️', '✅', '❌', '➡️', '⬅️', '⬆️', '⬇️', '➕', '➖', '➗', '✖️', '©️', '®️', '™️', '💲', '💶', '💷', '💴'];

// --- Settings Panel (Manages instance-specific settings like fontSize) ---
export const NotesSettingsPanel: React.FC<{
  widgetInstanceId: string;
  currentSettings: NotesWidgetSettings | undefined;
  onSaveLocalSettings: (newSettings: NotesWidgetSettings) => void;
  onClearAllNotesGlobal?: () => void;
}> = ({ widgetInstanceId, currentSettings, onSaveLocalSettings, onClearAllNotesGlobal }) => {
  // Initialize state with a guaranteed 'sm', 'base', or 'lg'
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>(currentSettings?.fontSize || 'base');

  const handleSave = () => {
    // Pass the correctly typed fontSize to the save function
    onSaveLocalSettings({ fontSize: fontSize });
  };

  return (
    <div className="space-y-6 text-primary"> {/* Increased spacing */}
      <div>
        <label htmlFor={`notes-font-size-${widgetInstanceId}`} className="block text-sm font-medium text-secondary mb-1.5">Editor Font Size</label>
        <select
          id={`notes-font-size-${widgetInstanceId}`}
          value={fontSize}
          // Correctly cast e.target.value to the specific union type expected by setFontSize
          onChange={(e) => setFontSize(e.target.value as 'sm' | 'base' | 'lg')}
          className="mt-1 block w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary sm:text-sm text-primary transition-colors duration-150"
        >
          <option value="sm">Small</option> <option value="base">Normal</option> <option value="lg">Large</option>
        </select>
      </div>
      {onClearAllNotesGlobal && (
        <button
          onClick={() => {
            // Consider using a custom modal here instead of window.confirm for better UX and consistency
            if (window.confirm("Are you sure you want to delete ALL notes globally? This action cannot be undone.")) {
                onClearAllNotesGlobal();
            }
          }}
          className="w-full px-4 py-2.5 bg-red-600/90 text-white rounded-lg hover:bg-red-700/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-dark-surface transition-all duration-150 ease-in-out shadow-md hover:shadow-lg"
        >
          Clear All Notes (Global)
        </button>
      )}
      <button
        onClick={handleSave}
        className="w-full px-4 py-2.5 bg-accent-primary text-on-accent rounded-lg hover:bg-accent-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary focus:ring-offset-dark-surface transition-all duration-150 ease-in-out shadow-md hover:shadow-lg"
      >
        Save Note Settings
      </button>
    </div>
  );
};

// --- Main NotesWidget Component ---
const NotesWidget: React.FC<NotesWidgetProps> = ({
  notes, activeNoteId, onNotesChange, onActiveNoteIdChange,
  instanceId, settings
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const noteToLoad = notes.find(n => n.id === activeNoteId);
    if (editorRef.current) {
      const newContent = noteToLoad ? noteToLoad.content : "<p><br></p>"; // Default to empty paragraph
      if (editorRef.current.innerHTML !== newContent) {
        editorRef.current.innerHTML = newContent;
      }
    }
  }, [activeNoteId, notes]);

  // Debounced content change handler
  const debouncedContentChange = useMemo( // Changed from useCallback to useMemo
    () => debounce(() => {
      if (editorRef.current && activeNoteId) {
        const newContent = editorRef.current.innerHTML;
        const currentNote = notes.find(n => n.id === activeNoteId);
        // Only update if content actually changed to prevent unnecessary re-renders/saves
        if (currentNote && currentNote.content !== newContent) {
          const updatedNotes = notes.map(note =>
            note.id === activeNoteId ? { ...note, content: newContent, lastModified: Date.now() } : note
          ).sort((a, b) => b.lastModified - a.lastModified); // Keep sorting for consistency
          onNotesChange(updatedNotes);
        }
      }
    }, 500),
    [activeNoteId, notes, onNotesChange] // Dependencies for the inner debounced function
  );

  // Title change handler (can be immediate as it's less frequent)
  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (activeNoteId) {
      const newTitle = event.target.value;
      const currentNote = notes.find(n => n.id === activeNoteId);
      if (currentNote && currentNote.title !== newTitle) {
        const updatedNotes = notes.map(note =>
          note.id === activeNoteId ? { ...note, title: newTitle, lastModified: Date.now() } : note
        ).sort((a, b) => b.lastModified - a.lastModified);
        onNotesChange(updatedNotes);
      }
    }
  };

  const handleNewNote = () => {
    const newNoteId = generateId();
    const newNote: Note = { id: newNoteId, title: "Untitled Note", content: "<p><br></p>", lastModified: Date.now() };
    // Add new note to the beginning and then sort (or just sort after adding)
    const updatedNotes = [newNote, ...notes].sort((a, b) => b.lastModified - a.lastModified);
    onNotesChange(updatedNotes);
    onActiveNoteIdChange(newNoteId);
    // Focus and select title input for quick editing
    requestAnimationFrame(() => {
        if (titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
    });
  };

  const handleDeleteNote = () => {
    if (!activeNoteId) {
      // Consider a less obtrusive notification (e.g., a toast or inline message)
      alert("No active note to delete."); return;
    }
    if (notes.length <= 1) {
      alert("Cannot delete the last note. Create a new one first if you wish to delete this one."); return;
    }
    const noteToDelete = notes.find(n => n.id === activeNoteId);
    // Use a custom modal for confirmation if possible
    if (window.confirm(`Are you sure you want to delete "${noteToDelete?.title || 'this note'}"? This action cannot be undone.`)) {
      const updatedNotes = notes.filter(note => note.id !== activeNoteId).sort((a, b) => b.lastModified - a.lastModified);
      onNotesChange(updatedNotes);
      // Set new active note (most recent if available, otherwise null)
      if (updatedNotes.length > 0) {
        onActiveNoteIdChange(updatedNotes[0].id);
      } else {
        // This case should ideally not be reached if we prevent deleting the last note,
        // but as a fallback, create a new default note.
        const newDefaultNoteId = generateId();
        const defaultNote: Note = { id: newDefaultNoteId, title: "My Note", content: "<p><br></p>", lastModified: Date.now() };
        onNotesChange([defaultNote]);
        onActiveNoteIdChange(newDefaultNoteId);
      }
    }
  };

  const applyFormat = (command: string) => {
    document.execCommand(command, false, undefined);
    editorRef.current?.focus();
    debouncedContentChange(); // Trigger debounced save after formatting
  };

  const insertEmoji = (emoji: string) => {
    editorRef.current?.focus();
    document.execCommand('insertText', false, emoji);
    setShowEmojiPicker(false);
    debouncedContentChange(); // Trigger debounced save after inserting emoji
  };

  // Memoize active note to prevent unnecessary re-renders of title input and editor
  const activeNoteForDisplay = React.useMemo(() => {
    return notes.find(n => n.id === activeNoteId);
  }, [notes, activeNoteId]);

  const textSizeClass = settings?.fontSize === 'sm' ? 'text-sm' : settings?.fontSize === 'lg' ? 'text-lg' : 'text-base';

  const formatTimestamp = (timestamp: number): string => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  };

  const toolbarButtonClass = "p-1.5 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white focus:bg-slate-600 focus:text-white focus:outline-none focus:ring-2 focus:ring-accent-primary/70 transition-all duration-150";

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEmojiPicker && !(event.target as HTMLElement).closest('.emoji-picker-container') && !(event.target as HTMLElement).closest('.emoji-toggle-button')) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);


  return (
    <div className="w-full h-full flex flex-col bg-dark-surface/50 backdrop-blur-sm overflow-hidden rounded-lg shadow-lg">
      {/* Toolbar: Enhanced styling */}
      <div className="flex items-center justify-between p-2 border-b border-slate-700/70 space-x-2 shrink-0 bg-slate-800/30">
        <div className="flex items-center space-x-1">
            <button onClick={() => applyFormat('bold')} title="Bold" className={toolbarButtonClass}><BoldIcon/></button>
            <button onClick={() => applyFormat('italic')} title="Italic" className={toolbarButtonClass}><ItalicIcon/></button>
            <button onClick={() => applyFormat('underline')} title="Underline" className={toolbarButtonClass}><UnderlineIcon/></button>
            <button onClick={() => applyFormat('strikeThrough')} title="Strikethrough" className={toolbarButtonClass}><StrikethroughIcon/></button>
            <div className="relative emoji-picker-container"> {/* Added class for click outside logic */}
                <button onClick={() => setShowEmojiPicker(prev => !prev)} title="Insert Emoji/Symbol" className={`${toolbarButtonClass} emoji-toggle-button`}><EmojiIcon/></button> {/* Added class */}
                {showEmojiPicker && (
                    <div className="absolute top-full left-0 mt-1.5 z-30 bg-slate-800 p-2 rounded-lg shadow-2xl grid grid-cols-6 gap-1 w-52 max-h-56 overflow-y-auto border border-slate-700 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700/50">
                        {EMOJI_LIST.map(emoji => ( <button key={emoji} onClick={() => insertEmoji(emoji)} className="p-1.5 text-xl rounded-md hover:bg-slate-700 transition-colors duration-100">{emoji}</button> ))}
                    </div>
                )}
            </div>
        </div>
        <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 mr-1" aria-live="polite">Notes: {notes.length}</span>
            <button
              onClick={handleNewNote}
              className="px-3 py-1.5 text-xs font-medium bg-green-600/80 text-white rounded-md hover:bg-green-500/80 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition-all duration-150 shadow-sm hover:shadow-md"
            >
              New
            </button>
            {/* Delete button enabled only if there's an active note AND more than one note exists */}
            {activeNoteId && notes.length > 1 && (
              <button
                onClick={handleDeleteNote}
                className="px-3 py-1.5 text-xs font-medium bg-red-600/80 text-white rounded-md hover:bg-red-500/80 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 transition-all duration-150 shadow-sm hover:shadow-md"
              >
                Delete
              </button>
            )}
        </div>
      </div>

      {/* Note Selection and Title Input: Enhanced styling */}
      <div className="flex items-center p-2 border-b border-slate-700/70 shrink-0 bg-slate-800/10">
        <select
            value={activeNoteId || ""}
            onChange={(e) => onActiveNoteIdChange(e.target.value || null)}
            className="text-xs py-2 pl-3 pr-8 bg-slate-700/60 border border-slate-600/80 rounded-l-md focus:ring-2 focus:ring-accent-primary focus:border-accent-primary focus:outline-none text-slate-100 flex-shrink min-w-[120px] max-w-[180px] appearance-none transition-colors duration-150 hover:bg-slate-700"
            aria-label="Select Note"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
        >
          {notes.map(note => ( <option key={note.id} value={note.id} className="bg-slate-700 text-slate-100">{(note.title || "Untitled").substring(0,25) + ((note.title || "").length > 25 ? "..." : "")}</option> ))}
        </select>
        <input
          ref={titleInputRef}
          type="text"
          onChange={handleTitleChange}
          placeholder="Note Title..."
          className="flex-grow text-sm py-2 px-3 bg-slate-700/30 border-t border-b border-r border-slate-600/80 rounded-r-md focus:ring-2 focus:ring-inset focus:ring-accent-primary focus:border-accent-primary focus:outline-none text-slate-50 placeholder-slate-400/70 transition-colors duration-150"
          aria-label="Note Title"
          key={`title-${instanceId}-${activeNoteId}`} // Re-key to force re-render on activeNoteId change
          defaultValue={activeNoteForDisplay?.title || ""}
        />
      </div>

      {/* Content Editor Area: Subtle inset shadow for depth */}
      <div
        ref={editorRef}
        contentEditable="true"
        onInput={debouncedContentChange} // Use debounced handler
        className={`w-full h-full p-3.5 ${textSizeClass} text-slate-100 placeholder-slate-500
                    overflow-y-auto focus:outline-none
                    bg-slate-800/20
                    scrollbar-thin scrollbar-thumb-slate-600/70 scrollbar-track-slate-800/30 scrollbar-thumb-rounded-full
                    prose prose-sm sm:prose-base dark:prose-invert max-w-none
                    prose-headings:text-slate-200 prose-p:text-slate-300 prose-strong:text-slate-100 prose-em:text-slate-200
                    prose-a:text-accent-primary hover:prose-a:text-accent-primary-hover prose-blockquote:border-accent-primary/50 prose-code:text-slate-300 prose-code:bg-slate-700/50 prose-code:p-1 prose-code:rounded-sm
                    focus:shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.2)] transition-shadow duration-150`}
        role="textbox" aria-multiline="true" aria-label="Note content area"
        suppressContentEditableWarning={true} style={{minHeight: '150px'}}
        key={`editor-${instanceId}-${activeNoteId}`} // Re-key to force re-render on activeNoteId change
      >
      </div>

      {/* Footer with Last Modified Timestamp: Subtle and clean */}
      {activeNoteForDisplay && (
        <div className="p-2 border-t border-slate-700/70 text-xs text-slate-500 text-right shrink-0 bg-slate-800/30" aria-live="polite">
          Last Modified: <span className="font-medium text-slate-400">{formatTimestamp(activeNoteForDisplay.lastModified)}</span>
        </div>
      )}
    </div>
  );
};

// Debounce utility function
// Changed F extends (...args: any[]) => any  TO  F extends (...args: unknown[]) => unknown
function debounce<F extends (...args: unknown[]) => unknown>(func: F, waitFor: number) {
  let timeout: NodeJS.Timeout | null = null;

  // Parameters<F> will correctly infer unknown[] now
  // ReturnType<F> will correctly infer unknown now
  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => ReturnType<F>;
}


export default NotesWidget;

// Ensure you have Tailwind Typography plugin installed and configured in your tailwind.config.js
// npm install -D @tailwindcss/typography
// In tailwind.config.js:
// module.exports = {
//   // ... other config
//   plugins: [
//     require('@tailwindcss/typography'),
//   ],
// }
