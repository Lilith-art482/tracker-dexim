import { useState } from 'react';
import { motion } from 'framer-motion';
import './Tutorial.css';

const steps = [
  {
    title: 'Добро пожаловать!',
    text: 'Я — твой личный помощник. Буду помогать с задачами, привычками и финансами.',
    emoji: '🤖',
    robotEmotion: 'happy'
  },
  {
    title: 'Планер',
    text: 'Здесь ты можешь записывать задачи и смотреть календарь. Отмечай звёздочками выполненные!',
    emoji: '📋',
    robotEmotion: 'inspired'
  },
  {
    title: 'Здоровье кошелька',
    text: 'Следи за бюджетом в виде аквариума. Каждая трата — камешек на дне.',
    emoji: '🐠',
    robotEmotion: 'thinking'
  },
  {
    title: 'Кристаллы привычек',
    text: 'Создавай привычки-кристаллы. Отмечай каждый день — кристалл будет сиять!',
    emoji: '💎',
    robotEmotion: 'love'
  },
  {
    title: 'Погнали!',
    text: 'Всё сохраняется в твоём браузере. Когда подключишь Firebase, данные будут в облаке.',
    emoji: '🚀',
    robotEmotion: 'happy'
  }
];

export default function Tutorial({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <motion.div
      className="tutorial-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="tutorial-card"
        initial={{ scale: 0.8, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      >
        <motion.div
          className="tutorial-emoji"
          key={step}
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        >
          {current.emoji}
        </motion.div>

        <motion.h3
          className="tutorial-title"
          key={`title-${step}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {current.title}
        </motion.h3>

        <motion.p
          className="tutorial-text"
          key={`text-${step}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {current.text}
        </motion.p>

        <div className="tutorial-dots">
          {steps.map((_, i) => (
            <span key={i} className={`tutorial-dot ${i === step ? 'active' : ''}`} />
          ))}
        </div>

        <div className="tutorial-actions">
          {!isLast && (
            <button className="tutorial-skip" onClick={onFinish}>
              Пропустить
            </button>
          )}
          <motion.button
            className="tutorial-next"
            onClick={() => isLast ? onFinish() : setStep(s => s + 1)}
            whileTap={{ scale: 0.95 }}
          >
            {isLast ? 'Начать!' : 'Далее'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
