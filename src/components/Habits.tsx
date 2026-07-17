import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flower, Plus, Sparkle } from '@phosphor-icons/react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Habit } from '../types';
import { playPianoNote } from '../utils/sounds';
import './Habits.css';

interface HabitsProps {
  onHabitChecked?: () => void;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

const habitColors = [
  '#FDE2E4', '#CFBAE1', '#B5EAD7', '#FFDFD3',
  '#C9E4DE', '#F4C2C2', '#E8D5F5', '#B8E0D2'
];

const habitIcons = ['🌸', '🌿', '💧', '☀️', '⭐', '🦋', '🍃', '🌙'];

const pianoNotes = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5];

function getStreakMoon(streak: number): string {
  const phases = ['🌑', '🌒', '🌓', '🌔', '🌕'];
  return phases[Math.min(streak, 4)] || '🌕';
}

function getStreakFlower(streak: number): string {
  const stages = ['🌱', '🌿', '🌻', '🌸', '🌺'];
  return stages[Math.min(streak, 4)] || '🌺';
}

export default function Habits({ onHabitChecked }: HabitsProps) {
  const [habits, setHabits] = useLocalStorage<Habit[]>('habits_data', []);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(0);

  const today = new Date().toISOString().slice(0, 10);

  const addHabit = () => {
    if (!newName.trim()) return;
    const habit: Habit = {
      id: generateId(),
      name: newName.trim(),
      icon: habitIcons[newColor % habitIcons.length],
      streak: 0,
      lastCompleted: null,
      dates: [],
      color: habitColors[newColor % habitColors.length]
    };
    setHabits(prev => [...prev, habit]);
    setNewName('');
    setShowAdd(false);
  };

  const toggleHabit = (id: string) => {
    const noteIndex = habits.findIndex(h => h.id === id) % pianoNotes.length;
    playPianoNote(pianoNotes[noteIndex]);

    const markingDone = !habits.find(h => h.id === id)?.dates.includes(today);
    if (markingDone) {
      onHabitChecked?.();
    }

    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h;
      const alreadyDone = h.dates.includes(today);
      if (alreadyDone) {
        const newDates = h.dates.filter(d => d !== today);
        const streak = recalcStreak(newDates);
        return { ...h, dates: newDates, streak, lastCompleted: newDates.length > 0 ? newDates[newDates.length - 1] : null };
      }
      const newDates = [...h.dates, today];
      const streak = recalcStreak(newDates);
      return { ...h, dates: newDates, streak, lastCompleted: today };
    }));
  };

  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  return (
    <div className="habits">
      <h2 className="section-title">
        <Flower size={28} weight="fill" />
        Кристаллы привычек
      </h2>

      <div className="habits-header">
        <motion.button
          className="habit-add-btn"
          onClick={() => setShowAdd(!showAdd)}
          whileTap={{ scale: 0.9 }}
        >
          <Plus size={20} weight="bold" />
          Новая привычка
        </motion.button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            className="habit-form"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <input
              type="text"
              className="habit-input"
              placeholder="Название привычки..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addHabit()}
            />
            <div className="habit-color-picker">
              {habitColors.map((c, i) => (
                <button
                  key={c}
                  className={`color-dot ${i === newColor ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setNewColor(i)}
                />
              ))}
            </div>
            <motion.button className="habit-submit" onClick={addHabit} whileTap={{ scale: 0.95 }}>
              Создать кристалл
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="crystal-grid">
        <AnimatePresence>
          {habits.map((habit, index) => {
            const isDone = habit.dates.includes(today);
            return (
              <motion.div
                key={habit.id}
                className={`crystal ${isDone ? 'glowing' : ''}`}
                layout
                initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  rotate: 0,
                  boxShadow: isDone
                    ? `0 0 30px ${habit.color}88, 0 0 60px ${habit.color}44`
                    : '0 4px 16px rgba(200, 180, 255, 0.1)'
                }}
                exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20, delay: index * 0.05 }}
                style={{
                  '--crystal-color': habit.color,
                } as React.CSSProperties}
              >
                <motion.button
                  className="crystal-face"
                  onClick={() => toggleHabit(habit.id)}
                  whileTap={{ scale: 0.9 }}
                  animate={isDone ? {
                    rotate: [0, 5, -5, 0],
                  } : {}}
                  transition={{ duration: 0.3 }}
                  style={{ background: `linear-gradient(135deg, ${habit.color}, ${habit.color}cc)` }}
                >
                  <motion.span
                    className="crystal-icon"
                    animate={isDone ? { scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    {habit.icon}
                  </motion.span>
                  <span className="crystal-name">{habit.name}</span>
                </motion.button>

                <div className="crystal-streak">
                  <span className="streak-icon">
                    {habit.streak > 2 ? getStreakFlower(habit.streak) : getStreakMoon(habit.streak)}
                  </span>
                  <span className="streak-count">{habit.streak}</span>
                </div>

                <motion.button
                  className="crystal-delete"
                  onClick={() => deleteHabit(habit.id)}
                  whileHover={{ scale: 1.1 }}
                >
                  ✕
                </motion.button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {habits.length === 0 && (
        <div className="habits-empty">
          <Sparkle size={32} />
          <p>Создайте свою первую привычку!</p>
        </div>
      )}
    </div>
  );
}

function recalcStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...dates].sort().reverse();
  let streak = 1;
  const today = new Date();
  const lastDate = new Date(sorted[0] + 'T00:00:00');
  const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 1) return 0;

  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = new Date(sorted[i] + 'T00:00:00');
    const prev = new Date(sorted[i + 1] + 'T00:00:00');
    const diff = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
