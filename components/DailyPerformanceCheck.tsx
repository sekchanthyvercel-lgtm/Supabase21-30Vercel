import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Sparkles,
  Check,
  Undo2,
  Trash,
  Eye,
  EyeOff,
  Edit2,
  SlidersHorizontal,
  ArrowUpDown,
  Clock,
  Flame,
  ShieldAlert,
  Tag
} from 'lucide-react';
import { AppData, DailyPerformanceTask } from '../types';
import { startOfWeek, endOfWeek, addDays, format, isSameDay, parseISO } from 'date-fns';

interface DailyPerformanceCheckProps {
  data: AppData;
  onUpdate: (updated: AppData) => void;
}

const PRESET_COLORS = [
  // Blues
  { name: 'Royal Blue', value: '#3b82f6' },
  { name: 'Sky Blue', value: '#0ea5e9' },
  { name: 'Ice Blue', value: '#38bdf8' },
  { name: 'Cobalt', value: '#2563eb' },
  
  // Greens
  { name: 'Emerald', value: '#10b981' },
  { name: 'Mint Green', value: '#34d399' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Forest Green', value: '#059669' },
  { name: 'Sage', value: '#86efac' },

  // Purples
  { name: 'Light Purple', value: '#c084fc' },
  { name: 'Classic Purple', value: '#a855f7' },
  { name: 'Deep Purple', value: '#7c3aed' },
  { name: 'Lilac', value: '#d8b4fe' },
  { name: 'Lavender', value: '#e9d5ff' },
  { name: 'Indigo Violet', value: '#6366f1' },
  { name: 'Plum', value: '#d946ef' },
  { name: 'Amethyst', value: '#8b5cf6' },

  // Reds & Pinks
  { name: 'Crimson Red', value: '#ef4444' },
  { name: 'Rose Pink', value: '#ec4899' },
  { name: 'Blush Pink', value: '#fbcfe8' },
  { name: 'Peach Coral', value: '#fca5a5' },
  { name: 'Hot Pink', value: '#f472b6' },

  // Yellow / Orange / Amber
  { name: 'Golden Yellow', value: '#f59e0b' },
  { name: 'Vibrant Orange', value: '#f97316' },
  { name: 'Amber Gold', value: '#fbbf24' }
];

const DEFAULT_TASKS: DailyPerformanceTask[] = [
  { id: 'dt-1', name: 'Go to sleep early', color: '#3b82f6', priority: 'High' },
  { id: 'dt-2', name: 'Review lesson plans', color: '#10b981', priority: 'Medium' },
  { id: 'dt-3', name: 'Grade assignments', color: '#ef4444', priority: 'High' },
  { id: 'dt-4', name: 'Exercise (20 minutes)', color: '#f59e0b', priority: 'Medium' },
  { id: 'dt-5', name: 'Read 5 pages', color: '#8b5cf6', priority: 'Low' }
];

const BOOSTERS_SUGGESTIONS = [
  { name: "Wake up on first alarm (No Snooze)", color: "#f59e0b", icon: "⏰", priority: 'High' },
  { name: "Deep work focus block (60 Min)", color: "#3b82f6", icon: "💻", priority: 'High' },
  { name: "No screens before sleep", color: "#8b5cf6", icon: "📱", priority: 'Medium' },
  { name: "Drink 3 Liters of water", color: "#14b8a6", icon: "💧", priority: 'Low' },
  { name: "Plan the next day", color: "#f97316", icon: "📝", priority: 'Medium' },
  { name: "Stretching & breathing break", color: "#10b981", icon: "🧘", priority: 'Low' }
];

export const DailyPerformanceCheck: React.FC<DailyPerformanceCheckProps> = ({ data, onUpdate }) => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    // startOfWeek defaults to Sunday, let's start on Monday to match standard self-discipline trackers
    return startOfWeek(new Date(), { weekStartsOn: 1 });
  });

  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskColor, setNewTaskColor] = useState('#3b82f6');
  const [newTaskPriority, setNewTaskPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  
  const [isAdding, setIsAdding] = useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [isActionBarCollapsed, setIsActionBarCollapsed] = useState(false);

  // Editing state for existing tasks
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('');
  const [editingPriority, setEditingPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  // Initialize tasks if not present
  const tasks = data.dailyPerformanceTasks || DEFAULT_TASKS;
  const completions = data.dailyPerformanceCompletions || {};

  // Initialize tomorrow's strategic planning tasks
  const DEFAULT_TOMORROW_TASKS = [
    { id: 'tt-1', name: 'Strategic deep work block (focus for 60 min)', completed: false },
    { id: 'tt-2', name: 'Exercise & morning stretch', completed: false },
    { id: 'tt-3', name: 'Review & adjust lesson schedules', completed: false }
  ];
  const tomorrowTasks = data.tomorrowTasks || DEFAULT_TOMORROW_TASKS;

  const handleUpdateTomorrowTasks = (newTomorrowTasks: { id: string; name: string; completed: boolean }[]) => {
    onUpdate({
      ...data,
      tomorrowTasks: newTomorrowTasks
    });
  };

  const handleToggleTomorrowTask = (id: string) => {
    const updated = tomorrowTasks.map((t) => t.id === id ? { ...t, completed: !t.completed } : t);
    handleUpdateTomorrowTasks(updated);
  };

  const handleEditTomorrowTask = (id: string, name: string) => {
    const updated = tomorrowTasks.map((t) => t.id === id ? { ...t, name } : t);
    handleUpdateTomorrowTasks(updated);
  };


  const handleUpdateTasks = (newTasks: DailyPerformanceTask[]) => {
    onUpdate({
      ...data,
      dailyPerformanceTasks: newTasks
    });
  };

  const handleUpdateCompletions = (newCompletions: Record<string, Record<string, boolean>>) => {
    onUpdate({
      ...data,
      dailyPerformanceCompletions: newCompletions
    });
  };

  const handleAddTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskName.trim()) return;

    const newTask: DailyPerformanceTask = {
      id: `dt-${Date.now()}`,
      name: newTaskName.trim(),
      color: newTaskColor,
      priority: newTaskPriority
    };

    const updatedTasks = [...tasks, newTask];
    handleUpdateTasks(updatedTasks);
    setNewTaskName('');
    setNewTaskPriority('Medium');
    setIsAdding(false);
  };

  const handleSaveTaskEdit = (taskId: string) => {
    if (!editingName.trim()) return;
    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          name: editingName.trim(),
          color: editingColor,
          priority: editingPriority
        };
      }
      return t;
    });
    handleUpdateTasks(updatedTasks);
    setEditingTaskId(null);
  };

  const handleDeleteTask = (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    handleUpdateTasks(updatedTasks);
    if (editingTaskId === taskId) {
      setEditingTaskId(null);
    }
  };

  const toggleCompletion = (dateStr: string, taskId: string) => {
    const dayCompletions = completions[dateStr] || {};
    const updatedDayCompletions = {
      ...dayCompletions,
      [taskId]: !dayCompletions[taskId]
    };

    const updatedCompletions = {
      ...completions,
      [dateStr]: updatedDayCompletions
    };

    handleUpdateCompletions(updatedCompletions);
  };

  // Generate the 7 days of the week starting from Monday
  const daysOfWeek = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));

  const displayedDays = daysOfWeek;

  // Calculate completion count for the current visible week
  let completedCount = 0;
  daysOfWeek.forEach((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayCompletions = completions[dateStr] || {};
    tasks.forEach((task) => {
      if (dayCompletions[task.id]) {
        completedCount++;
      }
    });
  });

  const totalPossible = tasks.length * 7;

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekStart(prev => addDays(prev, direction === 'prev' ? -7 : 7));
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  // Filtered and Sorted Tasks list
  const filteredAndSortedTasks = useMemo(() => {
    const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
    return [...tasks].sort((a, b) => {
      const weightA = priorityWeight[a.priority || 'Medium'] || 2;
      const weightB = priorityWeight[b.priority || 'Medium'] || 2;
      return weightB - weightA; // High to Low
    });
  }, [tasks]);

  // Completion percentage of user's daily tasks over the last 7 days of the VISIBLE week
  const last7DaysStats = useMemo(() => {
    return daysOfWeek.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayCompletions = completions[dateStr] || {};
      
      let comp = 0;
      tasks.forEach((task) => {
        if (dayCompletions[task.id]) {
          comp++;
        }
      });
      
      const pct = tasks.length > 0 ? Math.round((comp / tasks.length) * 100) : 0;
      return {
        dateLabel: format(day, 'EEE dd'),
        isToday: isSameDay(day, new Date()),
        count: comp,
        total: tasks.length,
        percentage: pct,
        rawDate: day
      };
    });
  }, [daysOfWeek, completions, tasks]);

  // Yearly & Morning Overview analytics
  const yearlyAnalytics = useMemo(() => {
    const currentYearStr = format(new Date(), 'yyyy'); // e.g. "2026"
    
    let totalCheckedThisYear = 0;
    let totalPossibleThisYear = 0;
    
    let morningCheckedThisYear = 0;
    let morningPossibleThisYear = 0;
    
    // Breakdown by months of current year
    const monthlyCompletions: Record<string, { checked: number; possible: number }> = {};
    for (let m = 0; m < 12; m++) {
      monthlyCompletions[format(new Date(parseInt(currentYearStr), m, 1), 'yyyy-MM')] = { checked: 0, possible: 0 };
    }
    
    Object.entries(completions).forEach(([dateStr, dayCompletions]) => {
      if (!dateStr.startsWith(currentYearStr)) return;
      const parsedDate = parseISO(dateStr);
      const monthKey = format(parsedDate, 'yyyy-MM');
      
      tasks.forEach((task) => {
        if (monthlyCompletions[monthKey]) {
          monthlyCompletions[monthKey].possible++;
        }
        totalPossibleThisYear++;
        
        const isMorningTask = (task.category || '').toLowerCase() === 'morning' || 
                             (task.name || '').toLowerCase().includes('morning') ||
                             (task.name || '').toLowerCase().includes('wake') ||
                             (task.name || '').toLowerCase().includes('sleep') ||
                             (task.name || '').toLowerCase().includes('early');
                             
        if (isMorningTask) {
          morningPossibleThisYear++;
        }
        
        if (dayCompletions[task.id]) {
          if (monthlyCompletions[monthKey]) {
            monthlyCompletions[monthKey].checked++;
          }
          totalCheckedThisYear++;
          if (isMorningTask) {
            morningCheckedThisYear++;
          }
        }
      });
    });
    
    const overallYearPct = totalPossibleThisYear > 0 
      ? Math.round((totalCheckedThisYear / totalPossibleThisYear) * 100) 
      : 0;
      
    const morningPct = morningPossibleThisYear > 0 
      ? Math.round((morningCheckedThisYear / morningPossibleThisYear) * 100) 
      : 0;
      
    const monthsData = Object.entries(monthlyCompletions).map(([monthKey, val]) => {
      const dateVal = parseISO(`${monthKey}-01`);
      const pct = val.possible > 0 ? Math.round((val.checked / val.possible) * 100) : 0;
      return {
        monthKey,
        name: format(dateVal, 'MMMM'),
        checked: val.checked,
        possible: val.possible,
        percentage: pct,
      };
    });
    
    return {
      overallYearPct,
      totalPossibleThisYear,
      totalCheckedThisYear,
      morningPct,
      morningPossibleThisYear,
      morningCheckedThisYear,
      monthsData
    };
  }, [completions, tasks]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6" id="daily-performance-tracker-container">

      {/* Main tracker table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Desktop View: Full Table (hidden on mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="py-5 px-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider w-[40%]">
                  Task Name
                </th>
                {displayedDays.map((day) => {
                  const isToday = isSameDay(day, new Date());
                  return (
                    <th 
                      key={day.toString()} 
                      className="py-5 px-4 text-center text-[10px] font-black uppercase tracking-wider"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className={isToday ? 'text-indigo-600 font-black' : 'text-slate-400'}>
                          {format(day, 'EEE')}
                        </span>
                        <span className={`text-[11px] w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                          isToday ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25' : 'text-slate-700'
                        }`}>
                          {format(day, 'd')}
                        </span>
                      </div>
                    </th>
                  );
                })}
                <th className="py-5 px-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedTasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="py-4 px-6">
                    {editingTaskId === task.id ? (
                      <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-2xl border border-indigo-200 max-w-[320px] shadow-sm animate-in zoom-in-95 duration-150">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          placeholder="Task name"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveTaskEdit(task.id);
                            if (e.key === 'Escape') setEditingTaskId(null);
                          }}
                        />

                        {/* Inline Priority Selector */}
                        <div className="text-xs">
                          <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Priority</label>
                          <select
                            value={editingPriority}
                            onChange={(e) => setEditingPriority(e.target.value as any)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-700 outline-none"
                          >
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5 mt-2.5">
                          <label className="text-[9px] font-black uppercase text-slate-400 block">Task Color (25 Options)</label>
                          <div className="flex flex-wrap gap-1 bg-white border border-slate-200 rounded-lg p-1.5 max-w-[210px]">
                            {PRESET_COLORS.map((col) => (
                              <button
                                key={col.value}
                                type="button"
                                onClick={() => setEditingColor(col.value)}
                                className="w-4 h-4 rounded-full border transition-all hover:scale-125 hover:shadow-xs active:scale-95"
                                style={{ 
                                  backgroundColor: col.value,
                                  borderColor: editingColor === col.value ? '#1e293b' : 'transparent',
                                  borderWidth: editingColor === col.value ? '2px' : '1px'
                                }}
                                title={col.name}
                              />
                            ))}
                          </div>
                        </div>
                        
                        {/* Mini action buttons */}
                        <div className="flex items-center gap-1.5 mt-3 justify-end">
                            <button
                              onClick={() => handleSaveTaskEdit(task.id)}
                              className="p-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingTaskId(null)}
                              className="p-1 px-2.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                            >
                              Back
                            </button>
                          </div>
                      </div>
                    ) : (
                      <div 
                        className="flex items-center justify-between gap-3 group/task cursor-pointer select-none py-1"
                        onClick={() => {
                          setEditingTaskId(task.id);
                          setEditingName(task.name);
                          setEditingColor(task.color);
                          setEditingPriority(task.priority || 'Medium');
                        }}
                        title="Click to rename task or modify urgency"
                      >
                        <div className="flex items-center gap-3">
                          {/* Colored circle dots inside table row */}
                          <span 
                            className="w-3.5 h-3.5 rounded-full ring-4 shadow-sm shrink-0"
                            style={{ 
                              backgroundColor: task.color,
                              boxShadow: `0 2px 8px ${task.color}50`,
                              borderColor: 'white',
                              borderWidth: '2px'
                            }}
                          />
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-slate-705 text-slate-755 text-slate-700 tracking-tight group-hover/task:text-indigo-600 transition-colors">
                              {task.name}
                            </span>
                            
                            {/* Priority Badge inline next to the name */}
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest leading-none ${
                              (task.priority || 'Medium') === 'High' 
                                ? 'bg-rose-50 text-rose-600 border border-rose-100/80 shadow-xs' 
                                : (task.priority || 'Medium') === 'Medium'
                                  ? 'bg-amber-50 text-amber-600 border border-amber-100/80 shadow-xs'
                                  : 'bg-blue-50 text-blue-605 text-blue-600 border border-blue-100'
                            }`}>
                              {(task.priority || 'Medium')}
                            </span>
                          </div>
                        </div>
                        
                        <Edit2 size={11} className="text-slate-300 group-hover/task:text-indigo-500 opacity-0 group-hover/task:opacity-100 transition-opacity mr-3" />
                      </div>
                    )}
                  </td>
                  
                  {displayedDays.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isCompleted = completions[dateStr]?.[task.id] || false;
                    return (
                      <td key={day.toString()} className="text-center py-4 px-4">
                        <button
                          onClick={() => toggleCompletion(dateStr, task.id)}
                          className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-2 ${
                            isCompleted 
                              ? 'text-white border-transparent' 
                              : 'border-slate-200 hover:border-slate-400 bg-white'
                          }`}
                          style={{
                            backgroundColor: isCompleted ? task.color : undefined,
                            boxShadow: isCompleted ? `0 4px 10px ${task.color}40` : undefined,
                          }}
                        >
                          {isCompleted && (
                            <motion.span
                              initial={{ scale: 0.3 }}
                              animate={{ scale: 1 }}
                              className="font-bold animate-in zoom-in-50 duration-150"
                            >
                              <Check size={14} strokeWidth={3} />
                            </motion.span>
                          )}
                        </button>
                      </td>
                    );
                  })}
 
                  <td className="py-4 px-6 text-center">
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-all active:scale-95"
                      title="Delete task"
                    >
                      <Trash size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              
              {filteredAndSortedTasks.length === 0 && (
                <tr>
                  <td colSpan={displayedDays.length + 2} className="py-12 text-center">
                    <p className="text-sm font-bold text-slate-400">
                      No custom duties added yet. Press "Add Task" to create one!
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: 7-Day Completion Grid under the Task Name (shown on mobile, hidden on desktop) */}
        <div className="block md:hidden divide-y divide-slate-150/60">
          {filteredAndSortedTasks.map((task) => (
            <div key={task.id} className="p-4.5 hover:bg-slate-50/30 transition-colors">
              {editingTaskId === task.id ? (
                <div className="flex flex-col gap-3 bg-slate-50 p-4 rounded-2xl border border-indigo-200 animate-in zoom-in-95 duration-150">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-850 text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="Task name"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTaskEdit(task.id);
                      if (e.key === 'Escape') setEditingTaskId(null);
                    }}
                  />

                  {/* Inline Priority Selector */}
                  <div className="text-xs">
                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Priority</label>
                    <select
                      value={editingPriority}
                      onChange={(e) => setEditingPriority(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-700 outline-none"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-1.5">
                    <label className="text-[9px] font-black uppercase text-slate-400 block">Task Color (25 Options)</label>
                    <div className="flex flex-wrap gap-1 bg-white border border-slate-200 rounded-lg p-1.5 w-full">
                      {PRESET_COLORS.map((col) => (
                        <button
                          key={col.value}
                          type="button"
                          onClick={() => setEditingColor(col.value)}
                          className="w-4 h-4 rounded-full border transition-all hover:scale-125 hover:shadow-xs active:scale-95"
                          style={{ 
                            backgroundColor: col.value,
                            borderColor: editingColor === col.value ? '#1e293b' : 'transparent',
                            borderWidth: editingColor === col.value ? '2px' : '1px'
                          }}
                          title={col.name}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Mini action buttons */}
                  <div className="flex items-center gap-1.5 mt-2 justify-end">
                      <button
                        onClick={() => handleSaveTaskEdit(task.id)}
                        className="p-1 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingTaskId(null)}
                        className="p-1 px-3 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                      >
                        Back
                      </button>
                    </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {/* Top row: Name, priority badge, and delete button */}
                  <div className="flex items-center justify-between gap-2">
                    <div 
                      className="flex items-center gap-2.5 cursor-pointer group/mobile-task flex-1"
                      onClick={() => {
                        setEditingTaskId(task.id);
                        setEditingName(task.name);
                        setEditingColor(task.color);
                        setEditingPriority(task.priority || 'Medium');
                      }}
                      title="Click to rename task"
                    >
                      <span 
                        className="w-3.5 h-3.5 rounded-full ring-4 shadow-sm shrink-0"
                        style={{ 
                          backgroundColor: task.color,
                          boxShadow: `0 2px 8px ${task.color}50`,
                          borderColor: 'white',
                          borderWidth: '2px'
                        }}
                      />
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-sm text-slate-700 tracking-tight group-hover/mobile-task:text-indigo-650 transition-colors">
                          {task.name}
                        </span>
                        
                        <span className={`px-1.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider leading-none ${
                          (task.priority || 'Medium') === 'High' 
                            ? 'bg-rose-50 text-rose-600 border border-rose-100/80 shadow-xs' 
                            : (task.priority || 'Medium') === 'Medium'
                              ? 'bg-amber-50 text-amber-600 border border-amber-100/80 shadow-xs'
                              : 'bg-blue-50 text-blue-600 border border-blue-100'
                        }`}>
                          {(task.priority || 'Medium')}
                        </span>
                      </div>
                      <Edit2 size={10} className="text-slate-300 group-hover/mobile-task:text-indigo-500 opacity-0 group-hover/mobile-task:opacity-100 transition-opacity ml-1" />
                    </div>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-all active:scale-95 shrink-0"
                      title="Delete task"
                    >
                      <Trash size={14} />
                    </button>
                  </div>

                  {/* 7-Day checkpoints directly under the task name */}
                  <div className="bg-slate-50 border border-slate-100/80 rounded-2xl p-2 px-2.5 grid grid-cols-7 gap-1">
                    {displayedDays.map((day) => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const isCompleted = completions[dateStr]?.[task.id] || false;
                      const isToday = isSameDay(day, new Date());
                      return (
                        <div key={day.toString()} className="flex flex-col items-center gap-1">
                          <span className={`text-[8px] font-black uppercase tracking-widest ${
                            isToday ? 'text-indigo-600 font-black' : 'text-slate-400'
                          }`}>
                            {format(day, 'EEE').substring(0, 3)}
                          </span>
                          <button
                            onClick={() => toggleCompletion(dateStr, task.id)}
                            className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all duration-200 outline-none ${
                              isCompleted 
                                ? 'text-white border-transparent' 
                                : 'border-slate-200/80 hover:border-slate-400 bg-white shadow-xs'
                            }`}
                            style={{
                              backgroundColor: isCompleted ? task.color : undefined,
                              boxShadow: isCompleted ? `0 4px 10px ${task.color}30` : undefined,
                            }}
                          >
                            {isCompleted ? (
                              <motion.span
                                initial={{ scale: 0.3 }}
                                animate={{ scale: 1 }}
                              >
                                <Check size={14} strokeWidth={3} />
                              </motion.span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-500">
                                {format(day, 'd')}
                              </span>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
          {filteredAndSortedTasks.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm font-bold text-slate-400">
                No custom duties added yet. Press "Add Task" to create one!
              </p>
            </div>
          )}
        </div>

        {/* Footer info: Total completed */}
        <div className="bg-slate-50/80 px-6 py-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">
              Total Completed:
            </span>
            <div className="flex items-baseline gap-1 bg-white border border-slate-200 rounded-xl px-4 py-1.5 shadow-sm">
              <span className="text-lg font-black text-slate-800">
                {completedCount}
              </span>
              <span className="text-xs text-slate-400 font-bold">
                / {totalPossible}
              </span>
            </div>
          </div>

          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles size={11} className="text-amber-500 animate-spin" style={{ animationDuration: '4s' }} /> Fully responsive week sheets
          </div>
        </div>
      </div>

      {/* Tomorrow's Strategic Planning Container */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md" id="tomorrow-strategic-planning-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-101 pb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 px-2.5 text-[9px] font-black uppercase text-rose-700 bg-rose-50 border border-rose-100 rounded-full">
                Strategic focus
              </span>
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                Tomorrow's Strategic Planning
              </h2>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pl-1 font-mono">
              Daily Planner: commit to 3 high-impact activities
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const id = 'tt-' + Date.now();
                handleUpdateTomorrowTasks([...tomorrowTasks, { id, name: '', completed: false }]);
              }}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
            >
              + Add Goal
            </button>
            <button
              onClick={() => handleUpdateTomorrowTasks(DEFAULT_TOMORROW_TASKS)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
            >
              Reset to Defaults
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tomorrowTasks.map((t, index) => (
            <div 
              key={t.id} 
              className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 group relative ${
                t.completed 
                  ? 'bg-emerald-50/40 border-emerald-200 shadow-xs' 
                  : 'bg-slate-50/50 border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {/* Checkbox and Target Label Header */}
              <div className="flex items-center justify-between gap-2.5">
                <span className={`text-[10px] font-black uppercase tracking-wider ${
                  t.completed ? 'text-emerald-700' : 'text-slate-400'
                }`}>
                  Goal No. {index + 1}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      const updated = tomorrowTasks.filter(item => item.id !== t.id);
                      handleUpdateTomorrowTasks(updated);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white/80 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Delete Goal"
                  >
                    <Trash2 size={12} />
                  </button>

                  <button
                    onClick={() => handleToggleTomorrowTask(t.id)}
                    className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${
                      t.completed
                        ? 'bg-emerald-500 border-transparent text-white shadow-sm shadow-emerald-500/20'
                        : 'border-slate-300 hover:border-slate-500 bg-white'
                    }`}
                  >
                    {t.completed ? (
                      <Check size={14} strokeWidth={3.5} />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Input Text Field */}
              <div className="relative">
                <input
                  type="text"
                  value={t.name}
                  onChange={(e) => handleEditTomorrowTask(t.id, e.target.value)}
                  placeholder={`Define thing #${index + 1} to complete tomorrow`}
                  className={`w-full bg-transparent border-b border-transparent focus:border-indigo-400 py-1 font-extrabold text-xs text-slate-705 text-slate-700 outline-none transition-all ${
                    t.completed ? 'line-through text-slate-400' : ''
                  }`}
                />
              </div>
            </div>
          ))}
          {tomorrowTasks.length === 0 && (
            <div className="col-span-3 text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                No tomorrow tasks defined. Click "+ Add Goal" above.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 7-Day Visual Progress Trend Tracker */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <span className="p-1 px-2.5 text-[9px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full">
              Discipline Velocity
            </span>
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">
              7-Day Completion Trend (%)
            </h2>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:inline font-mono">
            Execution sheet analysis
          </span>
        </div>
        
        <div className="grid grid-cols-7 gap-2 pt-1.5">
          {last7DaysStats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center group/trend relative">
              {/* Tooltip on hover */}
              <div className="absolute -top-10 scale-0 group-hover/trend:scale-100 transition-all bg-slate-800 text-white font-bold text-center py-1 px-2.5 rounded-lg text-[9px] pointer-events-none z-10 shadow-md uppercase tracking-wider">
                {stat.count} / {stat.total} done ({stat.percentage}%)
              </div>

              {/* Date labels on top */}
              <div className="mb-2 text-center select-none">
                <p className={`text-[9px] font-black uppercase tracking-wider ${
                  stat.isToday ? 'text-indigo-600' : 'text-slate-400'
                }`}>
                  {stat.dateLabel.split(' ')[0]}
                </p>
                <p className="text-[10px] font-bold text-slate-600">
                  {stat.dateLabel.split(' ')[1]}
                </p>
              </div>

              {/* The dynamic bar container under the labels */}
              <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-24 relative overflow-hidden flex items-end shadow-inner">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${stat.percentage}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className={`w-full rounded-b-xl transition-all ${
                    stat.isToday 
                      ? 'bg-gradient-to-t from-indigo-500 to-indigo-600 shadow-lg' 
                      : stat.percentage === 100 
                        ? 'bg-emerald-500' 
                        : stat.percentage >= 50 
                          ? 'bg-amber-500' 
                          : 'bg-indigo-400'
                  }`}
                />
                
                {/* Floating percentage label inside/on top */}
                <div className="absolute inset-x-0 bottom-1 flex justify-center pointer-events-none">
                  <span className={`text-[9px] font-black leading-none ${
                    stat.percentage > 30 ? 'text-white drop-shadow-md' : 'text-slate-500'
                  }`}>
                    {stat.percentage}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Year & Morning Analytics Dashboard */}
      <AnimatePresence>
        {showOverview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Annual discipline compliance */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="p-1 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Flame size={16} />
                    </span>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                      Year-To-Date Discipline
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500 font-bold">
                    Historical record of checked duties for the current calendar year.
                  </p>
                </div>
                
                <div className="mt-4 flex items-center gap-4">
                  <div className="relative w-16 h-16 shrink-0 flex items-center justify-center rounded-full bg-slate-50 border-4 border-indigo-100 font-black text-slate-800 text-sm">
                    {yearlyAnalytics.overallYearPct}%
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-800">
                      {yearlyAnalytics.totalCheckedThisYear} / {yearlyAnalytics.totalPossibleThisYear}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Successfully Completed Duty Instances
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Morning performance metrics */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="p-1 bg-amber-50 text-amber-600 rounded-lg">
                      <Clock size={16} />
                    </span>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                      Morning Compliance
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500 font-bold">
                    Overall morning routine tasks, alarms and sleep/wake consistency.
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <div className="relative w-16 h-16 shrink-0 flex items-center justify-center rounded-full bg-slate-50 border-4 border-amber-100 font-black text-amber-700 text-sm">
                    {yearlyAnalytics.morningPct}%
                  </div>
                  <div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      yearlyAnalytics.morningPct >= 80 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : yearlyAnalytics.morningPct >= 50
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}>
                      {yearlyAnalytics.morningPct >= 80 ? '🔥 Strong Mindset' : yearlyAnalytics.morningPct >= 50 ? '⚡ Moderate consistency' : '💤 Needs Focus'}
                    </span>
                    <p className="text-xs text-slate-500 font-bold mt-1.5">
                      {yearlyAnalytics.morningCheckedThisYear} checks logged
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3: Priority statistics radar */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="p-1 bg-emerald-50 text-emerald-600 rounded-lg">
                      <ShieldAlert size={16} />
                    </span>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                      Priority Focus Area
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500 font-bold">
                    Duties grouped by critical urgency and compliance status.
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {['High', 'Medium', 'Low'].map((prio) => {
                    const count = tasks.filter(t => (t.priority || 'Medium') === prio).length;
                    return (
                      <div key={prio} className="bg-slate-50 rounded-2xl p-2 border border-slate-200/50">
                        <p className={`text-[10px] font-black uppercase tracking-wider ${
                          prio === 'High' ? 'text-rose-600' : prio === 'Medium' ? 'text-amber-600' : 'text-blue-600'
                        }`}>
                          {prio}
                        </p>
                        <p className="text-base font-black text-slate-800">
                          {count}
                        </p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                          {count === 1 ? 'Task' : 'Tasks'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Annual compliance grid breakdown */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-slate-800 uppercase tracking-widest">
                  📆 Monthly Execution Heat breakdown ({format(new Date(), 'yyyy')})
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  YTD Trend
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {yearlyAnalytics.monthsData.map((m) => (
                  <div key={m.monthKey} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col justify-between">
                    <span className="text-xs font-black text-slate-700 truncate">{m.name}</span>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-lg font-black text-slate-800">{m.percentage}%</span>
                      <span className="text-[9px] text-slate-400 font-bold">({m.checked}/{m.possible})</span>
                    </div>
                    {/* Tiny micro progress bar */}
                    <div className="w-full bg-slate-200 rounded-full h-1 mt-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          m.percentage >= 80 
                            ? 'bg-emerald-500' 
                            : m.percentage >= 50 
                              ? 'bg-amber-500' 
                              : 'bg-rose-500'
                        }`}
                        style={{ width: `${m.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Adding dialog with suggested boosters */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white border text-left border-slate-200 rounded-3xl p-6 shadow-xl space-y-4"
          >
            <form onSubmit={handleAddTask} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                {/* Title */}
                <div className="md:col-span-7 w-full animate-in fade-in slide-in-from-top-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                    Task Title
                  </label>
                  <input 
                    type="text" 
                    value={newTaskName}
                    onChange={e => setNewTaskName(e.target.value)}
                    placeholder="e.g. Read 5 pages, Meditate, Code..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    autoFocus
                  />
                </div>

                {/* Priority */}
                <div className="md:col-span-5 w-full">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                    Priority Level
                  </label>
                  <div className="flex gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 text-xs">
                    {(['Low', 'Medium', 'High'] as const).map(prio => (
                      <button
                        key={prio}
                        type="button"
                        onClick={() => setNewTaskPriority(prio)}
                        className={`flex-1 py-1 px-2.5 font-black uppercase rounded-lg transition-all text-[10px] text-center ${
                          newTaskPriority === prio
                            ? prio === 'High'
                              ? 'bg-rose-500 text-white shadow-sm'
                              : prio === 'Medium'
                                ? 'bg-amber-500 text-white shadow-sm'
                                : 'bg-blue-500 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {prio}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div className="col-span-12 w-full mt-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                    Task/Category Color (25 Premium Options)
                  </label>
                  <div className="flex flex-wrap gap-2 bg-white border border-slate-200 rounded-xl p-3 min-h-[46px]">
                    {PRESET_COLORS.map((col) => (
                      <button
                        key={col.value}
                        type="button"
                        onClick={() => setNewTaskColor(col.value)}
                        className="w-5.5 h-5.5 rounded-full border transition-all hover:scale-125 focus:outline-none hover:shadow-sm"
                        style={{ 
                          backgroundColor: col.value,
                          borderColor: newTaskColor === col.value ? '#1e293b' : 'transparent',
                          borderWidth: newTaskColor === col.value ? '2px' : '1px'
                        }}
                        title={col.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs tracking-wider uppercase rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-wider uppercase rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
                >
                  Create Duty Task
                </button>
              </div>
            </form>

            {/* Quick boost suggestion chips */}
            <div className="border-t border-slate-100 pt-4">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                🚀 Suggestions to boost self-discipline (click to fill):
              </span>
              <div className="flex flex-wrap gap-1.5 font-bold">
                {BOOSTERS_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug.name}
                    type="button"
                    onClick={() => {
                      setNewTaskName(sug.name);
                      setNewTaskColor(sug.color);
                      setNewTaskPriority((sug.priority || 'Medium') as any);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl text-xs text-slate-600 hover:text-indigo-700 transition-all hover:scale-105 active:scale-95"
                  >
                    <span>{sug.icon}</span>
                    <span className="font-extrabold">{sug.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Universal Compact Controller for Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-50/80 border border-indigo-100 rounded-2xl p-3 px-5 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="p-1 px-2.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider">
            Controls (No. 2)
          </span>
          <span className="text-xs text-slate-600 font-extrabold">
            {isActionBarCollapsed ? "Hidden (Compact Screen)" : "Visible (Settings & Navigation)"}
          </span>
        </div>
        <button
          onClick={() => setIsActionBarCollapsed(!isActionBarCollapsed)}
          className={`px-3 py-1.5 rounded-xl transition-all font-black text-[10px] uppercase tracking-wider flex items-center gap-1 border hover:scale-105 active:scale-95 ${
            isActionBarCollapsed 
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md hover:bg-indigo-700' 
              : 'bg-white hover:bg-slate-100 text-indigo-700 border-indigo-200'
          }`}
        >
          {isActionBarCollapsed ? <Eye size={12} /> : <EyeOff size={12} />}
          <span>{isActionBarCollapsed ? "Show Controls (Number Two)" : "Hide Controls (Number Two)"}</span>
        </button>
      </div>

      {/* Persistent Week navigation & action bar (Number Two) */}
      <AnimatePresence initial={false}>
        {!isActionBarCollapsed && (
          <motion.div 
            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
            animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            className="bg-white/95 backdrop-blur-md rounded-3xl p-4.5 border border-slate-200/80 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => navigateWeek('prev')}
                  className="p-2 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-sm hover:scale-105 active:scale-95 transition-all text-slate-600"
                  title="Previous Week"
                >
                  <ChevronLeft size={16} />
                </button>
                
                <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 text-xs font-black text-slate-700 tracking-wider uppercase min-w-[185px] text-center shadow-inner">
                  {format(daysOfWeek[0], 'MMM dd')} - {format(daysOfWeek[6], 'MMM dd, yyyy')}
                </div>

                <button 
                  onClick={() => navigateWeek('next')}
                  className="p-2 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-sm hover:scale-105 active:scale-95 transition-all text-slate-600"
                  title="Next Week"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
              <button 
                onClick={goToCurrentWeek}
                className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs tracking-wider uppercase rounded-xl border border-indigo-100 shadow-sm transition-all hover:scale-105 active:scale-95"
              >
                Today's Week
              </button>

              <button 
                onClick={() => setShowOverview(!showOverview)}
                className={`px-3.5 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase border shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 ${
                  showOverview 
                    ? 'bg-amber-50 border-amber-300 text-amber-800' 
                    : 'bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                <Clock size={14} />
                <span>{showOverview ? 'Hide Year Overview' : 'Year & Morning Overview'}</span>
              </button>

              <button 
                onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs tracking-wider uppercase rounded-xl border border-slate-200 shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
              >
                {isHeaderCollapsed ? (
                  <>
                    <Eye size={14} />
                    <span>Show About</span>
                  </>
                ) : (
                  <>
                    <EyeOff size={14} />
                    <span>Hide About</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setIsAdding(!isAdding);
                  setNewTaskName('');
                }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider uppercase rounded-xl shadow-lg shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Plus size={14} /> Add Task
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header card with glass effect */}
      <AnimatePresence initial={false}>
        {!isHeaderCollapsed && (
          <motion.div 
            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
            animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            className="bg-white/40 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-2 bg-indigo-500/10 text-indigo-600 rounded-xl">
                  <Calendar size={20} className="text-indigo-600 animate-pulse" />
                </span>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
                  Weekly Self-Discipline Tracker
                </h1>
              </div>
              <p className="text-xs text-slate-500 font-bold tracking-wide uppercase pl-11">
                Measure your daily execution consistency
              </p>
            </div>

            <button
              onClick={() => setIsHeaderCollapsed(true)}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-indigo-600 border border-slate-200/80 rounded-2xl text-xs font-black uppercase tracking-wider shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 self-start md:self-auto"
            >
              <EyeOff size={14} /> Hide About
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

