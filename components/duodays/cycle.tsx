"use client";

import { useState, useEffect } from 'react';
import { useDuoDaysAuth } from '@/lib/duodays/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Activity, Calendar, Droplets, Moon, Sun, Heart, Thermometer, Zap, TrendingUp, Settings, X, ChevronRight, Baby, Clock, AlertCircle, Check, Flame, Wind, Brain, Smile, Frown, Meh, Angry, Laugh, Utensils, Bed, Pill, Plus } from 'lucide-react';
import { format, differenceInDays, addDays, subDays, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import DuoDaysDailyFeelings from './daily-feelings';
import CycleCalendar from './cycle-calendar';

interface Phase {
  id: string;
  name: string;
  color: string;
  gradient: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  days: [number, number];
}

const PHASES: Phase[] = [
  { id: 'menstrual', name: 'Менструация', color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #f97316)', icon: Droplets, days: [1, 5] },
  { id: 'follicular', name: 'Фолликулярная', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #f97316)', icon: Sun, days: [6, 13] },
  { id: 'ovulation', name: 'Овуляция', color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #06b6d4)', icon: Flame, days: [14, 16] },
  { id: 'luteal', name: 'Лютеиновая', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)', icon: Moon, days: [17, 28] },
];

interface SymptomGroup {
  name: string;
  items: { id: string; name: string }[];
}

interface SymptomCategory {
  name: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  groups: SymptomGroup[];
}

const SYMPTOM_CATEGORIES: Record<string, SymptomCategory> = {
  sex: {
    name: 'Секс и сексуальное желание', icon: Heart, color: '#ec4899',
    groups: [
      { name: 'Активность', items: [
        { id: 'none', name: 'Не было' }, { id: 'protected', name: 'С защитой' }, { id: 'unprotected', name: 'Без защиты' },
        { id: 'oral', name: 'Оральный' }, { id: 'anal', name: 'Анальный' }, { id: 'masturbation', name: 'Мастурбация' },
        { id: 'touch', name: 'Интимные прикосновения' }, { id: 'toys', name: 'Секс-игрушки' }, { id: 'orgasm', name: 'Оргазм' },
      ]},
      { name: 'Уровень желания', items: [
        { id: 'desire-high', name: 'Сильное' }, { id: 'desire-medium', name: 'Среднее' }, { id: 'desire-low', name: 'Слабое' },
      ]},
    ],
  },
  mood: {
    name: 'Настроение', icon: Brain, color: '#8b5cf6',
    groups: [
      { name: 'Позитивное', items: [
        { id: 'calm', name: 'Спокойствие' }, { id: 'joy', name: 'Радость' }, { id: 'energy', name: 'Много энергии' }, { id: 'playful', name: 'Игривость' },
      ]},
      { name: 'Негативное', items: [
        { id: 'mood-swings', name: 'Перепады настроения' }, { id: 'irritability', name: 'Раздражение' }, { id: 'sadness', name: 'Грусть' }, { id: 'anxiety', name: 'Тревога' },
      ]},
      { name: 'Тяжёлое', items: [
        { id: 'depression', name: 'Подавленность' }, { id: 'guilt', name: 'Чувство вины' }, { id: 'obsessive', name: 'Навязчивые мысли' },
      ]},
      { name: 'Энергия', items: [
        { id: 'low-energy', name: 'Мало энергии' }, { id: 'apathy', name: 'Апатия' }, { id: 'confusion', name: 'Растерянность' }, { id: 'self-criticism', name: 'Жёсткая самокритика' },
      ]},
    ],
  },
  symptoms: {
    name: 'Симптомы', icon: AlertCircle, color: '#f97316',
    groups: [
      { name: '', items: [
        { id: 'ok', name: 'Всё в порядке' }, { id: 'lower-abdomen', name: 'Боли внизу живота' }, { id: 'breast', name: 'Чувствительная грудь' },
        { id: 'headache', name: 'Головная боль' }, { id: 'acne', name: 'Прыщи' }, { id: 'back-pain', name: 'Боль в спине' },
        { id: 'fatigue', name: 'Усталость' }, { id: 'appetite', name: 'Повышенный аппетит' }, { id: 'insomnia', name: 'Бессонница' },
        { id: 'stomach-pain', name: 'Боль в животе' }, { id: 'itching', name: 'Зуд во влагалище' }, { id: 'dryness', name: 'Сухость во влагалище' },
      ]},
    ],
  },
  discharge: {
    name: 'Вагинальные выделения', icon: Droplets, color: '#06b6d4',
    groups: [
      { name: '', items: [
        { id: 'none', name: 'Выделений нет' }, { id: 'creamy', name: 'Кремообразные' }, { id: 'watery', name: 'Водянистые' },
        { id: 'sticky', name: 'Липкие' }, { id: 'mucous', name: 'Слизистые' }, { id: 'bloody', name: 'Кровянистые' },
        { id: 'atypical', name: 'Нетипичные' }, { id: 'white-clumpy', name: 'Белые комковатые' }, { id: 'grey', name: 'Серые' },
      ]},
    ],
  },
  digestion: {
    name: 'Пищеварение и стул', icon: Utensils, color: '#f59e0b',
    groups: [
      { name: '', items: [
        { id: 'nausea', name: 'Тошнота' }, { id: 'bloating', name: 'Вздутие живота' },
        { id: 'constipation', name: 'Запор' }, { id: 'diarrhea', name: 'Диарея' },
      ]},
    ],
  },
  tests: {
    name: 'Тесты', icon: Thermometer, color: '#10b981',
    groups: [
      { name: 'Беременность', items: [
        { id: 'preg-not', name: 'Не делала' }, { id: 'preg-pos', name: 'Положительный' },
        { id: 'preg-neg', name: 'Отрицательный' }, { id: 'preg-faint', name: 'Бледная полоска' },
      ]},
      { name: 'Овуляция', items: [
        { id: 'ovul-not', name: 'Не делала' }, { id: 'ovul-mark', name: 'Отметить тест' },
        { id: 'ovul-method', name: 'Овуляция: мой метод' },
      ]},
    ],
  },
  activity: {
    name: 'Физическая активность', icon: Activity, color: '#3b82f6',
    groups: [
      { name: '', items: [
        { id: 'no-training', name: 'Тренировки не было' }, { id: 'yoga', name: 'Йога' }, { id: 'gym', name: 'Тренажёрный зал' },
        { id: 'aerobics', name: 'Аэробика и танцы' }, { id: 'swimming', name: 'Плавание' }, { id: 'team-sport', name: 'Командный спорт' },
        { id: 'running', name: 'Бег' }, { id: 'cycling', name: 'Велосипед' }, { id: 'walking', name: 'Ходьба' },
      ]},
    ],
  },
  pills: {
    name: 'Оральные контрацептивы', icon: Pill, color: '#a855f7',
    groups: [
      { name: '', items: [
        { id: 'pill-on-time', name: 'Принята вовремя' }, { id: 'pill-yesterday', name: 'Вчерашняя таблетка' },
      ]},
    ],
  },
  other: {
    name: 'Другое', icon: Zap, color: '#6b7280',
    groups: [
      { name: '', items: [
        { id: 'travel', name: 'Путешествие' }, { id: 'stress', name: 'Стресс' }, { id: 'meditation', name: 'Медитация' },
        { id: 'journal', name: 'Ведение дневника' }, { id: 'kegel', name: 'Упражнения Кегеля' },
      ]},
    ],
  },
};

const PHASE_TIPS: Record<string, string[]> = {
  menstrual: [
    'Отдыхай больше — тело восстанавливается',
    'Тёплые компрессы помогут при спазмах',
    'Ешь продукты богатые железом: шпинат, красное мясо',
    'Лёгкие упражнения йоги облегчат состояние',
  ],
  follicular: [
    'Энергия растёт — отличное время для новых начинаний',
    'Начни новый проект или хобби',
    'Интенсивные тренировки сейчас особенно эффективны',
    'Время планирования и стратегий',
  ],
  ovulation: [
    'Пик энергии и привлекательности',
    'Отличное время для социальных мероприятий',
    'Самое высокое либидо в цикле',
    'Овуляция через 1-2 дня — учти при планировании',
  ],
  luteal: [
    'Снизь интенсивность тренировок',
    'Ешь больше сложных углеводов для стабильного настроения',
    'Магний поможет при ПМС',
    'Планируй спокойные занятия на ближайшие дни',
  ],
};

function getPhase(dayInCycle: number): Phase {
  if (dayInCycle <= 5) return PHASES[0];
  if (dayInCycle <= 13) return PHASES[1];
  if (dayInCycle <= 16) return PHASES[2];
  return PHASES[3];
}

function getFertilityLevel(dayInCycle: number): { level: string; color: string; percent: number } {
  if (dayInCycle >= 11 && dayInCycle <= 17) return { level: 'Высокая', color: '#10b981', percent: 90 };
  if (dayInCycle >= 8 && dayInCycle <= 20) return { level: 'Средняя', color: '#f59e0b', percent: 50 };
  return { level: 'Низкая', color: '#6b7280', percent: 10 };
}

interface RingSegment {
  start: number;
  end: number;
  color: string;
  isCurrent: boolean;
}

interface CycleData {
  id: string;
  userId?: string;
  lastPeriod?: string;
  cycleLength?: number;
  periodLength?: number;
  createdAt?: string;
}

interface SymptomDoc {
  id: string;
  userId?: string;
  date?: string;
  categoryId?: string;
  symptomId?: string;
  createdAt?: string;
}

export default function DuoDaysCycle() {
  const { currentUser } = useDuoDaysAuth();
  const [cycleData, setCycleData] = useState<CycleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showSymptoms, setShowSymptoms] = useState(false);
  const [showPregnancy, setShowPregnancy] = useState(false);
  const [showMarkPeriod, setShowMarkPeriod] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [todaySymptoms, setTodaySymptoms] = useState<SymptomDoc[]>([]);

  const [settingsForm, setSettingsForm] = useState({
    lastPeriod: '',
    cycleLength: 28,
    periodLength: 5,
  });

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'cycles'), where('userId', '==', currentUser.uid));
    const unsub = onSnapshot(q, snap => {
      if (!snap.empty) {
        const data = { id: snap.docs[0].id, ...snap.docs[0].data() } as CycleData;
        setCycleData(data);
        setSettingsForm({
          lastPeriod: data.lastPeriod || '',
          cycleLength: data.cycleLength || 28,
          periodLength: data.periodLength || 5,
        });
      } else {
        setCycleData(null);
      }
      setLoading(false);
    }, () => {
      setCycleData(null);
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'symptoms'), where('userId', '==', currentUser.uid), where('date', '==', selectedDate));
    const unsub = onSnapshot(q, snap => {
      setTodaySymptoms(snap.docs.map(d => ({ id: d.id, ...d.data() } as SymptomDoc)));
    }, () => {
      setTodaySymptoms([]);
    });
    return unsub;
  }, [currentUser, selectedDate]);

  const dayInCycle = cycleData?.lastPeriod
    ? ((differenceInDays(new Date(), parseISO(cycleData.lastPeriod)) % (cycleData.cycleLength || 28)) + (cycleData.cycleLength || 28)) % (cycleData.cycleLength || 28) + 1
    : null;

  const phase = dayInCycle ? getPhase(dayInCycle) : null;
  const fertility = dayInCycle ? getFertilityLevel(dayInCycle) : null;
  const cycleLen = cycleData?.cycleLength || 28;
  const periodLen = cycleData?.periodLength || 5;

  const nextPeriod = cycleData?.lastPeriod
    ? addDays(parseISO(cycleData.lastPeriod), Math.ceil(differenceInDays(new Date(), parseISO(cycleData.lastPeriod)) / cycleLen) * cycleLen)
    : null;

  const daysUntilPeriod = nextPeriod ? differenceInDays(nextPeriod, new Date()) : null;
  const isDelayed = daysUntilPeriod !== null && daysUntilPeriod < 0;
  const delayDays = isDelayed ? Math.abs(daysUntilPeriod) : 0;

  const ovulationDay = cycleData?.lastPeriod
    ? addDays(parseISO(cycleData.lastPeriod), Math.floor((differenceInDays(new Date(), parseISO(cycleData.lastPeriod)) / cycleLen)) * cycleLen + 14)
    : null;

  const fertileStart = ovulationDay ? subDays(ovulationDay, 5) : null;
  const fertileEnd = ovulationDay ? addDays(ovulationDay, 1) : null;

  const progress = dayInCycle ? (dayInCycle / cycleLen) * 100 : 0;

  const currentTip = phase ? PHASE_TIPS[phase.id][new Date().getDate() % PHASE_TIPS[phase.id].length] : null;

  async function markPeriodStarted() {
    if (!currentUser) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    if (cycleData) {
      await updateDoc(doc(db, 'cycles', cycleData.id), { lastPeriod: today });
    } else {
      await addDoc(collection(db, 'cycles'), {
        userId: currentUser.uid,
        lastPeriod: today,
        cycleLength: 28,
        periodLength: 5,
        createdAt: new Date().toISOString(),
      });
    }
    await addDoc(collection(db, 'periods'), {
      userId: currentUser.uid,
      startDate: today,
      createdAt: new Date().toISOString(),
    });
    toast.success("Менструация отмечена");
  }

  async function saveSettings() {
    if (!currentUser || !settingsForm.lastPeriod) return;
    if (cycleData) {
      await updateDoc(doc(db, 'cycles', cycleData.id), {
        lastPeriod: settingsForm.lastPeriod,
        cycleLength: Number(settingsForm.cycleLength),
        periodLength: Number(settingsForm.periodLength),
      });
    } else {
      await addDoc(collection(db, 'cycles'), {
        userId: currentUser.uid,
        lastPeriod: settingsForm.lastPeriod,
        cycleLength: Number(settingsForm.cycleLength),
        periodLength: Number(settingsForm.periodLength),
        createdAt: new Date().toISOString(),
      });
    }
    setShowSettings(false);
  }

  async function logSymptom(categoryId: string, symptomId: string) {
    if (!currentUser) return;
    const existing = todaySymptoms.find(s => s.categoryId === categoryId && s.symptomId === symptomId);
    if (existing) {
      await deleteDoc(doc(db, 'symptoms', existing.id));
    } else {
      await addDoc(collection(db, 'symptoms'), {
        userId: currentUser.uid,
        date: selectedDate,
        categoryId,
        symptomId,
        createdAt: new Date().toISOString(),
      });
    }
  }

  function getRingSegments(): RingSegment[] {
    if (!dayInCycle) return [];
    const segments: RingSegment[] = [];
    const segLen = 360 / cycleLen;
    for (let i = 0; i < cycleLen; i++) {
      const dayNum = i + 1;
      const p = getPhase(dayNum);
      segments.push({
        start: i * segLen,
        end: (i + 1) * segLen,
        color: p.color,
        isCurrent: dayNum === dayInCycle,
      });
    }
    return segments;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!cycleData || !cycleData.lastPeriod) {
    return (
      <div>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>Цикл</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Настройте отслеживание</p>
        </div>

        <div className="crd" style={{ marginBottom: '20px', textAlign: 'center', padding: '24px' }}>
          <div style={{ fontSize: '64px', fontWeight: 800, lineHeight: 1, color: 'var(--text)' }}>
            {new Date().getDate()}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {format(new Date(), 'd MMMM, EEEE', { locale: ru })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '20px' }}>
            <button
              onClick={() => setShowMarkPeriod(true)}
              title="Месячные начались"
              style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444, #f97316)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
              }}
            >
              <Droplets className="w-5 h-5" style={{ color: 'white' }} />
            </button>
            <button
              onClick={() => setShowSymptoms(true)}
              title="Симптомы"
              style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
              }}
            >
              <Plus className="w-5 h-5" style={{ color: 'white' }} />
            </button>
          </div>
        </div>

        <CycleCalendar cycleLength={28} periodLength={5} />

        {showSettings && <SettingsModal form={settingsForm} setForm={setSettingsForm} onSave={saveSettings} onClose={() => setShowSettings(false)} />}
        {showSymptoms && <SymptomsModal date={selectedDate} todaySymptoms={todaySymptoms} onLog={logSymptom} onClose={() => setShowSymptoms(false)} />}
        {showMarkPeriod && <MarkPeriodModal onConfirm={() => { markPeriodStarted(); setShowMarkPeriod(false); }} onClose={() => setShowMarkPeriod(false)} />}
      </div>
    );
  }

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>Цикл</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          {format(new Date(), 'd MMMM', { locale: ru })} · День {dayInCycle}
        </p>
      </div>

      {isDelayed && (
        <div style={{ padding: '14px 18px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(249,115,22,0.12))', border: '1px solid rgba(239,68,68,0.25)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #ef4444, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertCircle className="w-5 h-5" style={{ color: 'white' }} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>Задержка {delayDays} {delayDays === 1 ? 'день' : 'дней'}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Менструация началась {format(nextPeriod!, 'd MMMM', { locale: ru })}</div>
          </div>
        </div>
      )}

      <div className="crd" style={{ marginBottom: '20px', textAlign: 'center', padding: '32px 24px' }}>
        <div style={{ position: 'relative', width: '220px', height: '220px', margin: '0 auto 20px' }}>
          <svg viewBox="0 0 220 220" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            {getRingSegments().map((seg, i) => (
              <circle
                key={i}
                cx="110" cy="110" r="95"
                fill="none"
                stroke={seg.isCurrent ? seg.color : seg.color + '40'}
                strokeWidth={seg.isCurrent ? '12' : '8'}
                strokeDasharray={`${(seg.end - seg.start) / 360 * 597} 597`}
                strokeDashoffset={`${-seg.start / 360 * 597}`}
                strokeLinecap="round"
                style={{ transition: 'all 0.3s' }}
              />
            ))}
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: 800, color: phase?.color || 'var(--text)', lineHeight: 1 }}>{dayInCycle}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>день цикла</div>
          </div>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '999px', background: phase?.color + '18', marginBottom: '16px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: phase?.color }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: phase?.color }}>{phase?.name}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px' }}>
          <div style={{ padding: '12px 8px', borderRadius: '12px', background: 'var(--bg-elevated)', textAlign: 'center' }}>
            <Droplets className="w-4 h-4" style={{ color: '#ef4444', margin: '0 auto 4px' }} />
            <div style={{ fontSize: '13px', fontWeight: 700 }}>{daysUntilPeriod !== null ? (isDelayed ? delayDays + 'д. задержки' : 'через ' + daysUntilPeriod + 'д.') : '—'}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Менструация</div>
          </div>
          <div style={{ padding: '12px 8px', borderRadius: '12px', background: 'var(--bg-elevated)', textAlign: 'center' }}>
            <Flame className="w-4 h-4" style={{ color: '#10b981', margin: '0 auto 4px' }} />
            <div style={{ fontSize: '13px', fontWeight: 700, color: fertility?.color }}>{fertility?.level}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Плодородие</div>
          </div>
          <div style={{ padding: '12px 8px', borderRadius: '12px', background: 'var(--bg-elevated)', textAlign: 'center' }}>
            <Calendar className="w-4 h-4" style={{ color: 'var(--color-primary)', margin: '0 auto 4px' }} />
            <div style={{ fontSize: '13px', fontWeight: 700 }}>{cycleLen} дн.</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Цикл</div>
          </div>
        </div>
      </div>

      <div className="crd" style={{ marginBottom: '20px', textAlign: 'center', padding: '24px' }}>
        <div style={{ fontSize: '64px', fontWeight: 800, lineHeight: 1, color: 'var(--text)' }}>
          {new Date().getDate()}
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {format(new Date(), 'd MMMM, EEEE', { locale: ru })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '20px' }}>
          <button
            onClick={() => setShowMarkPeriod(true)}
            title="Месячные начались"
            style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #ef4444, #f97316)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
            }}
          >
            <Droplets className="w-5 h-5" style={{ color: 'white' }} />
          </button>
          <button
            onClick={() => setShowSymptoms(true)}
            title="Симптомы"
            style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
            }}
          >
            <Plus className="w-5 h-5" style={{ color: 'white' }} />
          </button>
        </div>
      </div>

      <CycleCalendar cycleLength={cycleLen} periodLength={periodLen} />

      <div className="crd" style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp className="w-4 h-4" style={{ color: 'var(--color-primary)' }} /> Предсказания
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <PredictionRow icon={<Droplets className="w-4 h-4" />} color="#ef4444" label="Следующая менструация" value={nextPeriod ? format(nextPeriod, 'd MMMM', { locale: ru }) : '—'} sub={nextPeriod ? (daysUntilPeriod! >= 0 ? 'через ' + daysUntilPeriod + ' д.' : 'задержка ' + delayDays + ' д.') : ''} />
          <PredictionRow icon={<Flame className="w-4 h-4" />} color="#10b981" label="Овуляция" value={ovulationDay ? format(ovulationDay, 'd MMMM', { locale: ru }) : '—'} />
          <PredictionRow icon={<Heart className="w-4 h-4" />} color="#ec4899" label="Фертильное окно" value={fertileStart ? `${format(fertileStart, 'd', { locale: ru })}–${format(fertileEnd!, 'd MMM', { locale: ru })}` : '—'} />
        </div>
      </div>

      {currentTip && (
        <div className="crd" style={{ marginBottom: '20px', background: `linear-gradient(135deg, ${phase?.color}08, ${phase?.color}15)`, border: `1px solid ${phase?.color}25` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: phase?.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Brain className="w-4 h-4" style={{ color: 'white' }} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: phase?.color, marginBottom: '4px' }}>Совет дня</div>
              <div style={{ fontSize: '13px', lineHeight: 1.5 }}>{currentTip}</div>
            </div>
          </div>
        </div>
      )}

      <div className="crd" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity className="w-4 h-4" style={{ color: 'var(--color-secondary)' }} /> Сегодня
          </h2>
          <button onClick={() => setShowSymptoms(true)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit' }}>
            Добавить <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {todaySymptoms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            Нет записей за сегодня
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {todaySymptoms.map(s => {
              const cat = SYMPTOM_CATEGORIES[s.categoryId!];
              if (!cat) return null;
              let itemName = s.symptomId;
              for (const g of cat.groups) {
                const found = g.items.find(i => i.id === s.symptomId);
                if (found) { itemName = found.name; break; }
              }
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: cat.color + '15', border: `1px solid ${cat.color}30` }}>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: cat.color }}>{itemName}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="crd" style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>Фазы цикла</h2>
        <div style={{ position: 'relative', paddingLeft: '20px' }}>
          <div style={{ position: 'absolute', left: '6px', top: '8px', bottom: '8px', width: '2px', background: 'var(--border)' }} />
          {PHASES.map((p, i) => {
            const isCurrent = phase?.id === p.id;
            const Icon = p.icon;
            return (
              <div key={p.id} style={{ position: 'relative', marginBottom: i < PHASES.length - 1 ? '16px' : 0, padding: '8px 12px', borderRadius: '10px', background: isCurrent ? p.color + '12' : 'transparent', border: isCurrent ? `1px solid ${p.color}30` : '1px solid transparent' }}>
                <div style={{ position: 'absolute', left: '-17px', top: '12px', width: '10px', height: '10px', borderRadius: '50%', background: isCurrent ? p.color : 'var(--border)', border: isCurrent ? `2px solid ${p.color}` : '2px solid var(--bg-card)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: p.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: 'white' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: isCurrent ? p.color : 'var(--text)' }}>{p.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Дни {p.days[0]}–{p.days[1]}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="crd" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, rgba(236,72,153,0.06), rgba(139,92,246,0.06))', border: '1px dashed rgba(236,72,153,0.25)', cursor: 'pointer' }} onClick={() => setShowPregnancy(true)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Baby className="w-5 h-5" style={{ color: 'white' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>Режим беременности</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Скоро в разработке</div>
          </div>
          <div style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(236,72,153,0.15)', fontSize: '10px', fontWeight: 700, color: '#ec4899' }}>SOON</div>
        </div>
      </div>

      <DuoDaysDailyFeelings selectedDate={format(new Date(), 'yyyy-MM-dd')} />

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <button onClick={() => setShowSettings(true)} className="btn-o btn-pill" style={{ padding: '10px 20px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Settings className="w-4 h-4" /> Настройки цикла
        </button>
      </div>

      {showSettings && <SettingsModal form={settingsForm} setForm={setSettingsForm} onSave={saveSettings} onClose={() => setShowSettings(false)} />}
      {showSymptoms && <SymptomsModal date={selectedDate} todaySymptoms={todaySymptoms} onLog={logSymptom} onClose={() => setShowSymptoms(false)} />}
      {showPregnancy && <PregnancyModal onClose={() => setShowPregnancy(false)} />}
      {showMarkPeriod && <MarkPeriodModal onConfirm={() => { markPeriodStarted(); setShowMarkPeriod(false); }} onClose={() => setShowMarkPeriod(false)} />}

      <div style={{ position: 'fixed', bottom: '80px', right: '20px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 50 }}>
        <button
          onClick={() => setShowSymptoms(true)}
          title="Симптомы"
          style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
          }}
        >
          <Plus className="w-5 h-5" style={{ color: 'white' }} />
        </button>
        <button
          onClick={markPeriodStarted}
          title="Месячные начались"
          style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #ef4444, #f97316)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
          }}
        >
          <Droplets className="w-5 h-5" style={{ color: 'white' }} />
        </button>
      </div>
    </div>
  );
}

interface PredictionRowProps {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: string;
  sub?: string;
}

function PredictionRow({ icon, color, label, value, sub }: PredictionRowProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', background: 'var(--bg-elevated)' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}</div>
        <div style={{ fontSize: '14px', fontWeight: 600 }}>{value}</div>
      </div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

interface SettingsModalProps {
  form: { lastPeriod: string; cycleLength: number; periodLength: number };
  setForm: React.Dispatch<React.SetStateAction<{ lastPeriod: string; cycleLength: number; periodLength: number }>>;
  onSave: () => void;
  onClose: () => void;
}

function SettingsModal({ form, setForm, onSave, onClose }: SettingsModalProps) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
      <div className="crd" style={{ position: 'relative', width: '100%', maxWidth: '420px', padding: '28px', backgroundColor: 'var(--background)' }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}><X className="w-5 h-5" /></button>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Настройки цикла</h3>

        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Последняя менструация</label>
        <input type="date" value={form.lastPeriod} onChange={e => setForm(p => ({ ...p, lastPeriod: e.target.value }))} className="inp inp-noicon" style={{ marginBottom: '16px' }} />

        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Длина цикла (дней)</label>
        <input type="number" min={20} max={45} value={form.cycleLength} onChange={e => setForm(p => ({ ...p, cycleLength: Number(e.target.value) }))} className="inp inp-noicon" style={{ marginBottom: '16px' }} />

        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Длина менструации (дней)</label>
        <input type="number" min={2} max={10} value={form.periodLength} onChange={e => setForm(p => ({ ...p, periodLength: Number(e.target.value) }))} className="inp inp-noicon" style={{ marginBottom: '20px' }} />

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onClose} className="btn-o btn-pill" style={{ flex: 1, padding: '12px' }}>Отмена</button>
          <button onClick={onSave} disabled={!form.lastPeriod} className="btn-p btn-pill" style={{ flex: 1, padding: '12px', opacity: form.lastPeriod ? 1 : 0.5 }}>Сохранить</button>
        </div>
      </div>
    </div>
  );
}

interface SymptomsModalProps {
  date: string;
  todaySymptoms: SymptomDoc[];
  onLog: (categoryId: string, symptomId: string) => void;
  onClose: () => void;
}

function SymptomsModal({ date, todaySymptoms, onLog, onClose }: SymptomsModalProps) {
  const dateStr = format(parseISO(date), 'd MMMM, EEEE', { locale: ru });
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  function isSelected(catId: string, itemId: string) {
    return todaySymptoms.some(s => s.categoryId === catId && s.symptomId === itemId);
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
      <div className="crd" style={{ position: 'relative', width: '100%', maxWidth: '440px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: 0, backgroundColor: 'var(--background)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>Самочувствие</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{dateStr}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}><X className="w-5 h-5" /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {Object.entries(SYMPTOM_CATEGORIES).map(([catId, cat]) => {
            const CatIcon = cat.icon;
            const isExpanded = expandedCat === catId;
            const selectedCount = todaySymptoms.filter(s => s.categoryId === catId).length;

            return (
              <div key={catId} style={{ marginBottom: '12px', borderRadius: '14px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <button
                  onClick={() => setExpandedCat(isExpanded ? null : catId)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px',
                    background: isExpanded ? cat.color + '08' : 'var(--bg-elevated)',
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: cat.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CatIcon className="w-4 h-4" style={{ color: cat.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>{cat.name}</div>
                    {selectedCount > 0 && <div style={{ fontSize: '11px', color: cat.color }}>{selectedCount} выбрано</div>}
                  </div>
                  <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

                {isExpanded && (
                  <div style={{ padding: '0 16px 16px' }}>
                    {cat.groups.map((group, gi) => (
                      <div key={gi} style={{ marginTop: gi > 0 ? '14px' : '8px' }}>
                        {group.name && <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{group.name}</div>}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {group.items.map(item => {
                            const active = isSelected(catId, item.id);
                            return (
                              <button
                                key={item.id}
                                onClick={() => onLog(catId, item.id)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '10px',
                                  border: active ? `2px solid ${cat.color}` : '1px solid var(--border)',
                                  background: active ? cat.color + '18' : 'var(--bg-card)',
                                  cursor: 'pointer', fontSize: '12px', fontWeight: 500,
                                  color: active ? cat.color : 'var(--text)',
                                  fontFamily: 'inherit', transition: 'all 0.15s',
                                }}
                              >
                                {active && <Check className="w-3 h-3" />}
                                {item.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
          <button onClick={onClose} className="btn-p btn-pill" style={{ width: '100%', padding: '12px' }}>Готово</button>
        </div>
      </div>
    </div>
  );
}

function MarkPeriodModal({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
      <div className="crd" style={{ position: 'relative', width: '100%', maxWidth: '380px', padding: '32px', textAlign: 'center', backgroundColor: 'var(--background)' }} onClick={e => e.stopPropagation()}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #ef4444, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Droplets className="w-7 h-7" style={{ color: 'white' }} />
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Отметить месячные</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.6 }}>
          Начало менструации отмечено на сегодня, {format(new Date(), 'd MMMM', { locale: ru })}
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onClose} className="btn-o btn-pill" style={{ flex: 1, padding: '12px' }}>Отмена</button>
          <button onClick={onConfirm} className="btn-p btn-pill" style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #ef4444, #f97316)' }}>Отметить</button>
        </div>
      </div>
    </div>
  );
}

function PregnancyModal({ onClose }: { onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
      <div className="crd" style={{ position: 'relative', width: '100%', maxWidth: '400px', padding: '32px', textAlign: 'center', backgroundColor: 'var(--background)' }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}><X className="w-5 h-5" /></button>
        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Baby className="w-7 h-7" style={{ color: 'white' }} />
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Режим беременности</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.6 }}>
          Эта функция находится в разработке.<br />
          Скоро вы сможете отслеживать:<br /><br />
          • Неделю беременности<br />
          • Размер плода<br />
          • Важные анализы и обследования<br />
          • Советы по каждой неделе
        </p>
        <div style={{ padding: '8px 16px', borderRadius: '999px', background: 'rgba(236,72,153,0.1)', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
          <Clock className="w-3.5 h-3.5" style={{ color: '#ec4899' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#ec4899' }}>Скоро</span>
        </div>
        <div>
          <button onClick={onClose} className="btn-o btn-pill" style={{ padding: '12px 32px' }}>Понятно</button>
        </div>
      </div>
    </div>
  );
}
