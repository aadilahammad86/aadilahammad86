import { useState, useEffect } from 'react';
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { Checkbox } from "./components/ui/checkbox";
import { Input } from "./components/ui/input";
import { Sun, Moon, Laptop, Trash2 } from 'lucide-react';
import { clsx} from 'clsx';

export default function ChecklistApp() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');

  // NEW STATE: Track which task is being edited
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskText, setEditingTaskText] = useState('');


    // --- THEME STATE ---
  // Default to 'system', which will be resolved by the useEffect hook
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system');

  // --- NEW STATE for selection ---
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  // --- THEME EFFECT ---
  // This effect applies the theme and listens for system changes
  useEffect(() => {
    const root = window.document.documentElement;
    const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (newTheme) => {
      root.classList.remove('light', 'dark');

      if (newTheme === 'system') {
        const isSystemDark = systemThemeQuery.matches;
        root.classList.add(isSystemDark ? 'dark' : 'light');
      } else {
        root.classList.add(newTheme);
      }
      localStorage.setItem('theme', newTheme);
      setTheme(newTheme);
    };

    const handleSystemThemeChange = (e) => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    // Listen for changes in the OS theme
    systemThemeQuery.addEventListener('change', handleSystemThemeChange);

    // Apply the initial theme
    applyTheme(theme);

    // Cleanup listener on component unmount
    return () => {
      systemThemeQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme]); // Rerun this effect when the user explicitly changes the theme

  const getNextTheme = () => {
    if (theme === 'light') return 'dark';
    if (theme === 'dark') return 'system';
    return 'light';
  };

  useEffect(() => {
    const saved = localStorage.getItem('tasks');
    if (saved) setTasks(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    const trimmedTask = newTask.trim();
    if (!trimmedTask || trimmedTask.length < 10) {
      console.log("Task must be at least 10 characters long.");
      return;
    }
    // if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: newTask, done: false }]);
    setNewTask('');
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  // --- 2. DELETE LOGIC ADDED ---
  const deleteTask = () => {
    // Only delete if a task is actually selected
    if (!selectedTaskId) return;
    setTasks(tasks.filter(task => task.id !== selectedTaskId));
    // Clear the selection after deleting
    setSelectedTaskId(null);
  };
  
  // --- 3. SELECTION LOGIC ADDED ---
  const handleSelectTask = (taskId) => {
    // If the clicked task is already selected, deselect it. Otherwise, select it.
    setSelectedTaskId(prevSelectedId => (prevSelectedId === taskId ? null : taskId));
  };

  // NEW FUNCTION: Handle starting the edit process
  const handleEditStart = (task) => {
    // Only allow editing if the task is not done
    if (!task.done) {
      setEditingTaskId(task.id);
      setEditingTaskText(task.text);
    }
  };

  // NEW FUNCTION: Save the edited task
  const handleEditSave = () => {
    if (!editingTaskText.trim()) return; // Don't save if empty
    setTasks(tasks.map(t =>
      t.id === editingTaskId ? { ...t, text: editingTaskText.trim() } : t
    ));
    // Exit editing mode
    setEditingTaskId(null);
    setEditingTaskText('');
  };

  // NEW FUNCTION: Handle key presses during edit (Enter/Escape)
  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      // Exit editing mode without saving
      setEditingTaskId(null);
      setEditingTaskText('');
    }
  };

  return (
    // The background color is now handled by Tailwind's dark mode on the <html> element
    <div className="min-h-screen w-screen bg-background p-4 flex">
      <Card className="w-full shadow-md flex flex-col flex-grow">
        <CardContent className="p-6 flex flex-col flex-grow">
          <div className="flex flex-grow items-center justify-between w-full">
            <div className="flex-1 text-center">
              <h1 className="text-2xl font-semibold">🧾 Task Checklist</h1>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setTheme(getNextTheme())}>
              {theme === 'light' && <Sun className="h-5 w-5" />}
              {theme === 'dark' && <Moon className="h-5 w-5" />}
              {theme === 'system' && <Laptop className="h-5 w-5" />}
            </Button>
          </div>
          <div className="flex gap-2 mb-4 flex-shrink-0">
            {/* The Input uses `flex-1` to take up all available space. No `w-full` needed. */}
            <Input
              className="flex-1 w-full"
              placeholder="Enter a task (min 10 chars)..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
            />
            <Button onClick={addTask}>Add</Button>
            {selectedTaskId && (
              <Button variant="destructive" onClick={deleteTask} className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
          <div
            className="space-y-2 mt-4 flex-grow overflow-y-auto pr-2"
            onClick={() => setSelectedTaskId(null)} // Click the background to deselect all
          >
            {tasks.map(task => (
              <div
                key={task.id}
                // This uses clsx to conditionally apply highlighting
                className={clsx(
                  "flex items-center gap-4 p-3 rounded cursor-pointer", // Base styles
                  {
                    'bg-accent text-accent-foreground': selectedTaskId === task.id, // Highlight styles
                    'hover:bg-muted': selectedTaskId !== task.id // Hover style only if not selected
                  }
                )}
                onClick={(e) => {
                  e.stopPropagation(); // This is CRITICAL. It prevents the background click from firing.
                  handleSelectTask(task.id);
                }}
              >
                <Checkbox
                  checked={task.done}
                  onCheckedChange={() => toggleTask(task.id)}
                  className="h-5 w-5 rounded-none" 
                />
                {editingTaskId === task.id ? (
                  <Input
                    className="flex-1 h-auto py-1 bg-transparent"
                    value={editingTaskText}
                    onChange={(e) => setEditingTaskText(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    onBlur={handleEditSave}
                    autoFocus
                  />
                ) : (
                  <span
                    className={`flex-1 text-left break-words ${task.done ? 'line-through text-muted-foreground' : ''}`}
                    onDoubleClick={(e) => {
                      e.stopPropagation(); // Also critical here to prevent selection change
                      handleEditStart(task);
                    }}
                  >
                    {task.text}
                  </span>
                )}
              </div>
            ))}
            {tasks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center pt-4">No tasks yet. Add one above.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}