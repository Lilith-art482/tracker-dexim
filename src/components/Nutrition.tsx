import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ForkKnife, Plus, X } from '@phosphor-icons/react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { MealEntry } from '../types';
import { MEAL_TYPES } from '../types';
import './Nutrition.css';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function Nutrition() {
  const [meals, setMeals] = useLocalStorage<MealEntry[]>('nutrition_data', []);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [fats, setFats] = useState('');
  const [carbs, setCarbs] = useState('');
  const [mealType, setMealType] = useState<MealEntry['mealType']>('breakfast');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const today = new Date().toISOString().slice(0, 10);

  const dayMeals = useMemo(
    () => meals.filter(m => m.date === date).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [meals, date],
  );

  const dayCalories = useMemo(
    () => dayMeals.reduce((s, m) => s + m.calories, 0),
    [dayMeals],
  );

  const mealsByType = useMemo(() => {
    const groups: Record<string, MealEntry[]> = {};
    MEAL_TYPES.forEach(mt => { groups[mt.value] = []; });
    dayMeals.forEach(m => {
      if (groups[m.mealType]) groups[m.mealType].push(m);
    });
    return groups;
  }, [dayMeals]);

  const addMeal = () => {
    const cal = parseInt(calories);
    if (!name.trim() || !cal || cal <= 0) return;
    const entry: MealEntry = {
      id: generateId(),
      name: name.trim(),
      calories: cal,
      protein: protein ? parseFloat(protein) : undefined,
      fats: fats ? parseFloat(fats) : undefined,
      carbs: carbs ? parseFloat(carbs) : undefined,
      mealType,
      date,
      createdAt: new Date().toISOString(),
    };
    setMeals(prev => [...prev, entry]);
    setName('');
    setCalories('');
    setProtein('');
    setFats('');
    setCarbs('');
    setShowAdd(false);
  };

  const deleteMeal = (id: string) => {
    setMeals(prev => prev.filter(m => m.id !== id));
  };

  const dailyGoal = 2000;
  const goalPercent = Math.min(100, (dayCalories / dailyGoal) * 100);
  const goalColor = goalPercent <= 80 ? '#7bc8a0' : goalPercent <= 100 ? '#f5d07a' : '#f5a0a8';

  const mealTypeIcon = (type: string) => MEAL_TYPES.find(mt => mt.value === type)?.icon || '🍽️';
  const mealTypeLabel = (type: string) => MEAL_TYPES.find(mt => mt.value === type)?.label || type;

  return (
    <div className="nutrition">
      <h2 className="section-title">
        <ForkKnife size={28} weight="fill" />
        Питание
      </h2>

      <div className="nutrition-date">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} max={today} />
      </div>

      <div className="nutrition-summary">
        <div className="calorie-ring">
          <svg viewBox="0 0 100 100" className="ring-svg">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
            <motion.circle
              cx="50" cy="50" r="42" fill="none"
              stroke={goalColor} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${goalPercent * 2.64} ${264 - goalPercent * 2.64}`}
              transform="rotate(-90 50 50)"
              initial={{ strokeDasharray: '0 264' }}
              animate={{ strokeDasharray: `${goalPercent * 2.64} ${264 - goalPercent * 2.64}` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </svg>
          <div className="ring-text">
            <span className="ring-cal">{dayCalories}</span>
            <span className="ring-label">из {dailyGoal}</span>
          </div>
        </div>
        <div className="calorie-stats">
          {MEAL_TYPES.map(mt => {
            const cal = mealsByType[mt.value].reduce((s, m) => s + m.calories, 0);
            return (
              <div key={mt.value} className="cal-stat">
                <span className="cal-stat-icon">{mt.icon}</span>
                <span className="cal-stat-label">{mt.label}</span>
                <span className="cal-stat-val">{cal}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="nutrition-header">
        <span className="nutrition-subtitle">
          {date === today ? 'Сегодня' : new Date(date).toLocaleDateString('ru-RU')}
        </span>
        <motion.button
          className="nutrition-add-btn"
          onClick={() => setShowAdd(!showAdd)}
          whileTap={{ scale: 0.9 }}
        >
          <Plus size={20} weight="bold" />
        </motion.button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            className="meal-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <input
              className="meal-input" placeholder="Название блюда" value={name}
              onChange={e => setName(e.target.value)}
            />
            <div className="meal-form-row">
              <input type="number" className="meal-input" placeholder="Калории" value={calories} onChange={e => setCalories(e.target.value)} />
              <select className="meal-select" value={mealType} onChange={e => setMealType(e.target.value as MealEntry['mealType'])}>
                {MEAL_TYPES.map(mt => <option key={mt.value} value={mt.value}>{mt.icon} {mt.label}</option>)}
              </select>
            </div>
            <div className="meal-form-row">
              <input type="number" className="meal-input" placeholder="Белки" value={protein} onChange={e => setProtein(e.target.value)} />
              <input type="number" className="meal-input" placeholder="Жиры" value={fats} onChange={e => setFats(e.target.value)} />
              <input type="number" className="meal-input" placeholder="Углеводы" value={carbs} onChange={e => setCarbs(e.target.value)} />
            </div>
            <motion.button className="meal-submit" onClick={addMeal} whileTap={{ scale: 0.95 }}>
              🍽️ Добавить
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="meal-list">
        {dayMeals.length === 0 ? (
          <div className="meal-empty">Нет записей за этот день</div>
        ) : (
          MEAL_TYPES.map(mt => {
            const items = mealsByType[mt.value];
            if (items.length === 0) return null;
            return (
              <div key={mt.value} className="meal-group">
                <div className="meal-group-header">
                  <span>{mt.icon} {mt.label}</span>
                  <span className="meal-group-cal">{items.reduce((s, m) => s + m.calories, 0)} ккал</span>
                </div>
                <AnimatePresence>
                  {items.map(m => (
                    <motion.div
                      key={m.id}
                      className="meal-item"
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 100 }}
                    >
                      <div className="meal-item-info">
                        <span className="meal-item-name">{m.name}</span>
                        {(m.protein || m.fats || m.carbs) && (
                          <span className="meal-item-macro">
                            {m.protein ? `Б: ${m.protein}г` : ''}
                            {m.fats ? ` Ж: ${m.fats}г` : ''}
                            {m.carbs ? ` У: ${m.carbs}г` : ''}
                          </span>
                        )}
                      </div>
                      <span className="meal-item-cal">{m.calories} ккал</span>
                      <button className="meal-delete" onClick={() => deleteMeal(m.id)}>
                        <X size={14} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
