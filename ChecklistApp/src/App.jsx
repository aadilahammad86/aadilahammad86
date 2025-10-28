import { useState, useEffect } from 'react';
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { Checkbox } from "./components/ui/checkbox";
import { Input } from "./components/ui/input";

export default function ChecklistApp() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('tasks');
    if (saved) setTasks(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: newTask, done: false }]);
    setNewTask('');
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md shadow-md">
        <CardContent className="p-4 space-y-4">
          <h1 className="text-2xl font-semibold text-center mb-2">🧾 Task Checklist</h1>
          <div className="flex gap-2">
            <Input
              placeholder="Enter task..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
            />
            <Button onClick={addTask}>Add</Button>
          </div>

          <div className="space-y-2 mt-4">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
                <Checkbox checked={task.done} onCheckedChange={() => toggleTask(task.id)} />
                <span className={`flex-1 ${task.done ? 'line-through text-gray-400' : ''}`}>{task.text}</span>
              </div>
            ))}

            {tasks.length === 0 && (
              <p className="text-sm text-gray-500 text-center">No tasks yet. Add one above.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
