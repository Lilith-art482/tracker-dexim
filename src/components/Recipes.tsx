import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen } from '@phosphor-icons/react';
import { recipes } from '../data/recipes';
import type { Recipe } from '../types';
import './Recipes.css';

const FILTERS = [
  { id: 'all', label: 'Все', icon: '🌸' },
  { id: 'breakfast', label: 'Завтрак', icon: '🌅' },
  { id: 'lunch', label: 'Обед', icon: '🍝' },
  { id: 'dinner', label: 'Ужин', icon: '🍷' },
  { id: 'snack', label: 'Перекус', icon: '🥜' },
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  breakfast: '🌅 Завтрак',
  lunch: '🍝 Обед',
  dinner: '🍷 Ужин',
  snack: '🥜 Перекус',
};

function ingredientUnit(weight: number, unit?: string): string {
  if (unit && unit !== 'г') return `${weight} ${unit}`;
  return `${weight}г`;
}

export default function Recipes() {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all'
    ? recipes
    : recipes.filter(r => r.category === filter);

  return (
    <div className="recipes">
      <h2 className="section-title">
        <BookOpen size={28} weight="fill" />
        Рецепты
      </h2>

      <div className="recipes-filters">
        {FILTERS.map(f => (
          <motion.button
            key={f.id}
            className={`recipes-filter-btn ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}
            whileTap={{ scale: 0.95 }}
          >
            {f.icon} {f.label}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={filter}
          className="recipes-grid"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {filtered.length === 0 ? (
            <div className="recipes-empty">
              <span className="recipes-empty-icon">🧘</span>
              <p>Нет рецептов в этом разделе</p>
            </div>
          ) : (
            filtered.map((recipe, idx) => (
              <RecipeCard key={recipe.id} recipe={recipe} index={idx} />
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function RecipeCard({ recipe, index }: { recipe: Recipe; index: number }) {
  const [expanded, setExpanded] = useState(false);

  const categoryLabel = CATEGORY_LABELS[recipe.category] || recipe.category;

  return (
    <motion.div
      className="recipe-card"
      initial={{ opacity: 0, y: 24, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.03, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      layout
    >
      <div className="recipe-body">
        <div className="recipe-header">
          <h3 className="recipe-title">{recipe.name}</h3>
          <span className="recipe-badge">{categoryLabel}</span>
        </div>

        <div className="recipe-nutrition">
          <span className="nutrition-item">🔥 {recipe.nutrition.calories} <span>ккал</span></span>
          <span className="nutrition-item">🥩 {recipe.nutrition.protein}г</span>
          <span className="nutrition-item">🧈 {recipe.nutrition.fat}г</span>
          <span className="nutrition-item">🍞 {recipe.nutrition.carbs}г</span>
        </div>

        <div className="recipe-ingredients">
          {recipe.ingredients.slice(0, 5).map((ing, i) => (
            <span key={i} className="ingredient-tag">
              {ing.name} <span className="ingredient-weight">{ingredientUnit(ing.weight, ing.unit)}</span>
            </span>
          ))}
          {recipe.ingredients.length > 5 && (
            <span className="ingredient-tag">+{recipe.ingredients.length - 5}</span>
          )}
        </div>

        <div className="recipe-footer">
          <span className="recipe-time">⏱️ {recipe.time} мин</span>
          <span className="recipe-difficulty">{recipe.difficulty}</span>
        </div>

        <div className="recipe-expand" onClick={() => setExpanded(!expanded)}>
          <span>{expanded ? '👆 Свернуть' : '👀 Инструкция'}</span>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              className="recipe-instructions"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <ol>
                {recipe.instructions.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
