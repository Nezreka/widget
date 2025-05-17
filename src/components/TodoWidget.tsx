// src/components/TodoWidget.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Interfaces & Types ---
export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  isEditing?: boolean;
}

export interface TodoWidgetSettings {
  showCompleted?: boolean;
  sortBy?: 'createdAt_asc' | 'createdAt_desc' | 'alphabetical_asc' | 'alphabetical_desc';
  defaultFilter?: 'all' | 'active' | 'completed';
}

interface TodoWidgetProps {
  instanceId: string; // Still useful for unique keys, ARIA attributes, etc.
  settings?: TodoWidgetSettings;
  // Now receives the single, global list of todos
  todos: TodoItem[]; 
  // Callback to update the single, global list of todos
  onTodosChange: (newTodos: TodoItem[]) => void; 
}

// --- Helper Functions ---
const generateId = (): string => `todo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// --- Icons ---
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.177-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>;

// --- Settings Panel ---
export const TodoSettingsPanel: React.FC<{
  widgetId: string; 
  currentSettings: TodoWidgetSettings | undefined;
  onSave: (newSettings: TodoWidgetSettings) => void; 
  onClearAllTasks: () => void; // This will clear the *global* list of todos
}> = ({ widgetId, currentSettings, onSave, onClearAllTasks }) => {
  const [showCompleted, setShowCompleted] = useState(currentSettings?.showCompleted === undefined ? true : currentSettings.showCompleted);
  const [sortBy, setSortBy] = useState(currentSettings?.sortBy || 'createdAt_desc');
  const [defaultFilter, setDefaultFilter] = useState(currentSettings?.defaultFilter || 'all');

  const handleSaveSettings = () => {
    onSave({ showCompleted, sortBy, defaultFilter });
  };

  return (
    <div className="space-y-5 text-primary">
      <div>
        <label htmlFor={`todo-show-completed-${widgetId}`} className="flex items-center text-sm font-medium text-secondary cursor-pointer">
          <input
            type="checkbox"
            id={`todo-show-completed-${widgetId}`}
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
            className="h-4 w-4 text-accent-primary focus:ring-accent-primary border-border-interactive rounded mr-2.5 bg-widget"
          />
          Show Completed Tasks (in this view)
        </label>
      </div>
      <div>
        <label htmlFor={`todo-sort-by-${widgetId}`} className="block text-sm font-medium text-secondary mb-1.5">Sort Tasks By (in this view)</label>
        <select
          id={`todo-sort-by-${widgetId}`}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as TodoWidgetSettings['sortBy'])}
          className="mt-1 block w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary sm:text-sm text-primary transition-colors duration-150"
        >
          <option value="createdAt_desc">Newest First</option>
          <option value="createdAt_asc">Oldest First</option>
          <option value="alphabetical_asc">Alphabetical (A-Z)</option>
          <option value="alphabetical_desc">Alphabetical (Z-A)</option>
        </select>
      </div>
       <div>
        <label htmlFor={`todo-default-filter-${widgetId}`} className="block text-sm font-medium text-secondary mb-1.5">Default Filter (for this view)</label>
        <select
          id={`todo-default-filter-${widgetId}`}
          value={defaultFilter}
          onChange={(e) => setDefaultFilter(e.target.value as TodoWidgetSettings['defaultFilter'])}
          className="mt-1 block w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary sm:text-sm text-primary transition-colors duration-150"
        >
          <option value="all">All Tasks</option>
          <option value="active">Active Tasks</option>
          <option value="completed">Completed Tasks</option>
        </select>
      </div>
      <button
        onClick={() => {
            if (window.confirm("Are you sure you want to delete ALL tasks in the global list? This action cannot be undone and will affect all To-Do widgets.")) {
                onClearAllTasks(); // This now clears the global list
            }
        }}
        className="w-full mt-3 px-4 py-2.5 bg-red-600/90 text-white rounded-lg hover:bg-red-700/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-dark-surface transition-all duration-150 ease-in-out shadow-md hover:shadow-lg"
      >
        Clear All Tasks (Global)
      </button>
      <button
        onClick={handleSaveSettings}
        className="w-full mt-2 px-4 py-2.5 bg-accent-primary text-on-accent rounded-lg hover:bg-accent-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary focus:ring-offset-dark-surface transition-all duration-150 ease-in-out shadow-md hover:shadow-lg"
      >
        Save View Settings
      </button>
    </div>
  );
};

// --- Main TodoWidget Component ---
const TodoWidget: React.FC<TodoWidgetProps> = ({ instanceId, settings, todos, onTodosChange }) => {
  // Internal UI state for this instance (like input fields, editing state)
  const [newTodoText, setNewTodoText] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>(settings?.defaultFilter || 'all');
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const newTodoInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  
  // Update filter based on settings when they change for this instance
  useEffect(() => {
    setFilter(settings?.defaultFilter || 'all');
  }, [settings?.defaultFilter]);

  // No need for internal 'currentTodos' state derived from props,
  // as 'todos' prop is the single source of truth from page.tsx.
  // Operations will directly call onTodosChange with the new global list.

  const handleAddTodo = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (newTodoText.trim() === '') return;
    const newTodo: TodoItem = {
      id: generateId(),
      text: newTodoText.trim(),
      completed: false,
      createdAt: Date.now(),
    };
    // Prepend to the existing global list and call onTodosChange
    onTodosChange([newTodo, ...todos]);
    setNewTodoText('');
    newTodoInputRef.current?.focus();
  };

  const handleToggleComplete = (todoId: string) => {
    const updatedGlobalTodos = todos.map(todo =>
      todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
    );
    onTodosChange(updatedGlobalTodos);
  };

  const handleDeleteTodo = (todoId: string) => {
    const updatedGlobalTodos = todos.filter(todo => todo.id !== todoId);
    onTodosChange(updatedGlobalTodos);
  };

  const handleStartEdit = (todo: TodoItem) => {
    setEditingTodoId(todo.id);
    setEditingText(todo.text);
  };

  const handleSaveEdit = (todoId: string) => {
    let updatedGlobalTodos;
    if (editingText.trim() === '') {
      updatedGlobalTodos = todos.filter(todo => todo.id !== todoId); // Delete if text is empty
    } else {
      updatedGlobalTodos = todos.map(todo =>
        todo.id === todoId ? { ...todo, text: editingText.trim() } : todo
      );
    }
    onTodosChange(updatedGlobalTodos);
    setEditingTodoId(null);
    setEditingText('');
  };
  
  const handleCancelEdit = () => {
    setEditingTodoId(null);
    setEditingText('');
  };

  useEffect(() => {
    if (editingTodoId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingTodoId]);


  const handleClearCompleted = () => {
    const updatedGlobalTodos = todos.filter(todo => !todo.completed);
    onTodosChange(updatedGlobalTodos);
  };
  
  const filteredAndSortedTodos = useCallback(() => {
    // Start with the global todos list passed as a prop
    let result = [...todos]; 

    // Apply instance-specific filter
    if (filter === 'active') {
      result = result.filter(todo => !todo.completed);
    } else if (filter === 'completed') {
      result = result.filter(todo => todo.completed);
    }
    
    // Apply instance-specific setting for showing/hiding completed tasks
    if (filter !== 'active' && settings?.showCompleted === false) {
        result = result.filter(todo => !todo.completed);
    }

    // Apply instance-specific sorting
    const sortBy = settings?.sortBy || 'createdAt_desc';
    switch (sortBy) {
      case 'createdAt_asc': result.sort((a, b) => a.createdAt - b.createdAt); break;
      case 'createdAt_desc': result.sort((a, b) => b.createdAt - a.createdAt); break;
      case 'alphabetical_asc': result.sort((a, b) => a.text.localeCompare(b.text)); break;
      case 'alphabetical_desc': result.sort((a, b) => b.text.localeCompare(a.text)); break;
    }
    return result;
  }, [todos, filter, settings?.showCompleted, settings?.sortBy]); // Depend on the global 'todos' prop

  const displayTodos = filteredAndSortedTodos();
  // Count active todos from the global list
  const activeTodosCount = todos.filter(todo => !todo.completed).length; 

  const commonInputClass = "w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary sm:text-sm text-primary placeholder-slate-400/70 transition-colors duration-150";
  const buttonClass = "px-3 py-1.5 text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-75 transition-all duration-150 shadow-sm hover:shadow-md";
  const filterButtonClass = (isActive: boolean) => 
    `${buttonClass} ${isActive ? 'bg-accent-primary text-on-accent focus:ring-accent-primary' : 'bg-slate-600/70 hover:bg-slate-500/70 text-slate-200 focus:ring-slate-500'}`;

  return (
    <div className="w-full h-full flex flex-col bg-dark-surface/60 text-primary overflow-hidden p-3.5 space-y-3.5">
      <form onSubmit={handleAddTodo} className="flex space-x-2 items-center">
        <input
          ref={newTodoInputRef}
          type="text"
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          placeholder="Add a new task..."
          className={`${commonInputClass} flex-grow`}
          aria-label="New task input"
        />
        <button
          type="submit"
          className={`${buttonClass} bg-green-600/80 hover:bg-green-500/80 text-white focus:ring-green-500 p-2.5`}
          aria-label="Add task"
        >
          <PlusIcon />
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex space-x-1.5">
          <button onClick={() => setFilter('all')} className={filterButtonClass(filter === 'all')}>All</button>
          <button onClick={() => setFilter('active')} className={filterButtonClass(filter === 'active')}>Active</button>
          <button onClick={() => setFilter('completed')} className={filterButtonClass(filter === 'completed')}>Completed</button>
        </div>
        {todos.some(todo => todo.completed) && ( // Check global todos
          <button
            onClick={handleClearCompleted}
            className={`${buttonClass} bg-red-600/70 hover:bg-red-500/70 text-white focus:ring-red-500`}
          >
            Clear Completed
          </button>
        )}
      </div>

      <div className="flex-grow overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-600/70 scrollbar-track-slate-800/30 scrollbar-thumb-rounded-full">
        {displayTodos.length === 0 && (
          <p className="text-center text-sm text-slate-500 py-4">
            {filter === 'completed' ? 'No completed tasks.' : filter === 'active' ? 'No active tasks. Well done!' : 'Your to-do list is empty!'}
          </p>
        )}
        {displayTodos.map(todo => (
          <div
            key={todo.id}
            className={`flex items-center p-2.5 rounded-lg transition-all duration-200 ease-in-out group ${
              todo.completed ? 'bg-slate-700/40 opacity-70' : 'bg-slate-700/70 hover:bg-slate-600/70'
            } shadow-sm`}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => handleToggleComplete(todo.id)}
              className="h-5 w-5 text-accent-primary bg-slate-600 border-slate-500 rounded focus:ring-accent-primary focus:ring-offset-0 mr-3 cursor-pointer shrink-0"
              aria-label={`Mark task ${todo.text} as ${todo.completed ? 'incomplete' : 'complete'}`}
            />
            {editingTodoId === todo.id ? (
              <input
                ref={editInputRef}
                type="text"
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onBlur={() => handleSaveEdit(todo.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit(todo.id);
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                className={`${commonInputClass} text-sm py-1 flex-grow mr-2`}
                aria-label={`Edit task ${todo.text}`}
              />
            ) : (
              <span
                className={`flex-grow text-sm cursor-pointer ${todo.completed ? 'line-through text-slate-400' : 'text-slate-100'}`}
                onDoubleClick={() => !todo.completed && handleStartEdit(todo)}
                title={todo.completed ? "Task completed" : "Double-click to edit"}
              >
                {todo.text}
              </span>
            )}
            
            <div className="flex items-center space-x-1.5 ml-auto shrink-0">
              {editingTodoId === todo.id ? (
                 <button
                    onClick={() => handleSaveEdit(todo.id)}
                    className={`${buttonClass} bg-green-500/80 hover:bg-green-400/80 text-white p-1.5`}
                    aria-label="Save edit"
                    title="Save"
                  >
                    <CheckIcon />
                  </button>
              ) : (
                !todo.completed && (
                  <button
                    onClick={() => handleStartEdit(todo)}
                    className={`${buttonClass} bg-slate-600 hover:bg-slate-500 text-slate-300 p-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity`}
                    aria-label={`Edit task ${todo.text}`}
                    title="Edit"
                  >
                    <EditIcon />
                  </button>
                )
              )}
              <button
                onClick={() => handleDeleteTodo(todo.id)}
                className={`${buttonClass} bg-red-700/60 hover:bg-red-600/60 text-red-300 hover:text-red-100 p-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity`}
                aria-label={`Delete task ${todo.text}`}
                title="Delete"
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-slate-400 pt-2 border-t border-slate-700/50 text-center">
        {activeTodosCount} {activeTodosCount === 1 ? 'task' : 'tasks'} remaining
      </div>
    </div>
  );
};

export default TodoWidget;
