import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Barbell, Plus, X } from '@phosphor-icons/react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { WorkoutEntry } from '../types';
import './Sport.css';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function Sport() {
  const [workouts, setWorkouts] = useLocalStorage<WorkoutEntry[]>('sport_data', []);
  const [showAdd, setShowAdd] = useState(false);
  const [exercise, setExercise] = useState('');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const today = new Date().toISOString().slice(0, 10);

  const weekStart = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().slice(0, 10);
  }, []);

  const weekWorkouts = useMemo(
    () => workouts.filter(w => w.date >= weekStart && w.date <= today).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    [workouts, weekStart, today],
  );

  const weekCount = weekWorkouts.length;
  const weekDuration = weekWorkouts.reduce((s, w) => s + w.duration, 0);
  const weekCalories = weekWorkouts.reduce((s, w) => s + (w.calories || 0), 0);

  const addWorkout = () => {
    const dur = parseInt(duration);
    if (!exercise.trim() || !dur || dur <= 0) return;
    const entry: WorkoutEntry = {
      id: generateId(),
      exercise: exercise.trim(),
      duration: dur,
      calories: calories ? parseInt(calories) : undefined,
      date,
      createdAt: new Date().toISOString(),
    };
    setWorkouts(prev => [...prev, entry]);
    setExercise('');
    setDuration('');
    setCalories('');
    setShowAdd(false);
  };

  const deleteWorkout = (id: string) => {
    setWorkouts(prev => prev.filter(w => w.id !== id));
  };

  const exerciseIcons: Record<string, string> = {
    'бег': '🏃', 'ходьба': '🚶', 'прогулка': '🚶',
    'силовая': '🏋️', 'тренажерный': '🏋️', 'качалка': '🏋️',
    'йога': '🧘', 'растяжка': '🧘', 'стретчинг': '🧘',
    'плавание': '🏊', 'бассейн': '🏊',
    'велосипед': '🚴', 'велик': '🚴',
    'танцы': '💃', 'танцевать': '💃',
    'скакалка': '🤸', 'кардио': '❤️',
    'турник': '💪', 'брусья': '💪',
  };

  function getIcon(name: string): string {
    const lower = name.toLowerCase();
    for (const [key, icon] of Object.entries(exerciseIcons)) {
      if (lower.includes(key)) return icon;
    }
    return '🏃';
  }

  return (
    <div className="sport">
      <h2 className="section-title">
        <Barbell size={28} weight="fill" />
        Спорт
      </h2>

      <div className="sport-date">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} max={today} />
      </div>

      <div className="sport-summary">
        <div className="sport-stat">
          <span className="sport-stat-icon">🏋️</span>
          <div>
            <span className="sport-stat-label">Тренировок</span>
            <span className="sport-stat-value">{weekCount}</span>
          </div>
        </div>
        <div className="sport-stat">
          <span className="sport-stat-icon">⏱️</span>
          <div>
            <span className="sport-stat-label">Минут</span>
            <span className="sport-stat-value">{weekDuration}</span>
          </div>
        </div>
        <div className="sport-stat">
          <span className="sport-stat-icon">🔥</span>
          <div>
            <span className="sport-stat-label">Калорий</span>
            <span className="sport-stat-value">{weekCalories}</span>
          </div>
        </div>
      </div>

      <div className="sport-header">
        <span className="sport-subtitle">За неделю</span>
        <motion.button
          className="sport-add-btn"
          onClick={() => setShowAdd(!showAdd)}
          whileTap={{ scale: 0.9 }}
        >
          <Plus size={20} weight="bold" />
        </motion.button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            className="workout-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <input
              className="workout-input" placeholder="Упражнение (бег, йога, ...)" value={exercise}
              onChange={e => setExercise(e.target.value)}
            />
            <div className="workout-form-row">
              <input type="number" className="workout-input" placeholder="Минуты" value={duration} onChange={e => setDuration(e.target.value)} />
              <input type="number" className="workout-input" placeholder="Калории (необ.)" value={calories} onChange={e => setCalories(e.target.value)} />
            </div>
            <motion.button className="workout-submit" onClick={addWorkout} whileTap={{ scale: 0.95 }}>
              💪 Добавить
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="workout-list">
        {weekWorkouts.length === 0 ? (
          <div className="workout-empty">Нет тренировок за эту неделю</div>
        ) : (
          <AnimatePresence>
            {weekWorkouts.map(w => (
              <motion.div
                key={w.id}
                className="workout-item"
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
              >
                <span className="workout-icon">{getIcon(w.exercise)}</span>
                <div className="workout-info">
                  <span className="workout-name">{w.exercise}</span>
                  <span className="workout-meta">{w.date}</span>
                </div>
                <span className="workout-duration">{w.duration} мин</span>
                {w.calories && <span className="workout-cal">{w.calories} ккал</span>}
                <button className="workout-delete" onClick={() => deleteWorkout(w.id)}>
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
