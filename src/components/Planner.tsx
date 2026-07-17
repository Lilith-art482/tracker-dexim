import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, CalendarBlank, Plus, Trash } from '@phosphor-icons/react';
import type { Task } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { playCompleteSound } from '../utils/sounds';
import './Planner.css';

interface PlannerProps {
  onTaskCompleted?: () => void;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const DAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

export default function Planner({ onTaskCompleted }: PlannerProps) {
  const [tasks, setTasks] = useLocalStorage<Task[]>('planner_tasks', []);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [newTaskText, setNewTaskText] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach(t => {
      const existing = map.get(t.date) || [];
      existing.push(t);
      map.set(t.date, existing);
    });
    return map;
  }, [tasks]);

  const selectedTasks = selectedDate ? (tasksByDate.get(selectedDate) || []) : [];

  const today = formatDate(new Date());

  const addTask = () => {
    if (!newTaskText.trim()) return;
    const date = selectedDate || today;
    const task: Task = {
      id: generateId(),
      text: newTaskText.trim(),
      date,
      completed: false,
      createdAt: new Date().toISOString()
    };
    setTasks(prev => [...prev, task]);
    setNewTaskText('');
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const becomingCompleted = !t.completed;
      if (becomingCompleted) {
        playCompleteSound();
        onTaskCompleted?.();
      }
      return { ...t, completed: becomingCompleted };
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  return (
    <div className="planner">
      <h2 className="section-title">
        <CalendarBlank size={28} weight="fill" />
        Планер
      </h2>

      <div className="planner-layout">
        <div className="calendar-section">
          <div className="calendar-header">
            <button className="cal-nav" onClick={prevMonth}>{'<'}</button>
            <span className="cal-month">{MONTHS[month]} {year}</span>
            <button className="cal-nav" onClick={nextMonth}>{'>'}</button>
          </div>
          <div className="calendar-grid">
            {DAYS.map(d => <div key={d} className="cal-day-header">{d}</div>)}
            {calendarDays.map((d, i) => {
              if (d === null) return <div key={`empty-${i}`} className="cal-cell empty" />;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const dayTasks = tasksByDate.get(dateStr);
              const isToday = dateStr === today;
              const isSelected = dateStr === selectedDate;
              return (
                <motion.button
                  key={dateStr}
                  className={`cal-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${dayTasks ? 'has-tasks' : ''}`}
                  onClick={() => setSelectedDate(dateStr)}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className="cal-num">{d}</span>
                  {dayTasks && dayTasks.length > 0 && (
                    <span className="cal-dot" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="tasks-section">
          <h3 className="tasks-title">
            {selectedDate
              ? `Задачи на ${selectedDate}`
              : 'Все задачи'}
          </h3>

          <div className="task-input-row">
            <input
              type="text"
              className="task-input"
              placeholder="Новая задача..."
              value={newTaskText}
              onChange={e => setNewTaskText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
            />
            <motion.button className="task-add-btn" onClick={addTask} whileTap={{ scale: 0.9 }}>
              <Plus size={20} weight="bold" />
            </motion.button>
          </div>

          <div className="tasks-list">
            <AnimatePresence>
              {(selectedDate ? selectedTasks : tasks).map(task => (
                <motion.div
                  key={task.id}
                  className={`task-item ${task.completed ? 'completed' : ''}`}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: task.completed ? 0.5 : 1, y: task.completed ? -20 : 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  <button className="task-check" onClick={() => toggleTask(task.id)}>
                    <Star
                      size={22}
                      weight={task.completed ? 'fill' : 'regular'}
                      color={task.completed ? '#FFD700' : '#CFBAE1'}
                    />
                  </button>
                  <span className="task-text">{task.text}</span>
                  <button className="task-delete" onClick={() => deleteTask(task.id)}>
                    <Trash size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {(selectedDate ? selectedTasks : tasks).length === 0 && (
              <div className="tasks-empty">Нет задач на этот день</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
