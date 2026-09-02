"use client";

import { useState, useEffect, useMemo } from 'react';
import { useDuoDaysAuth } from '@/lib/duodays/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { ChevronLeft, ChevronRight, X, Check, Droplets } from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, addDays, isSameDay,
  isToday, addMonths, subMonths, parseISO, differenceInDays,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';

interface PeriodDoc {
  id: string;
  userId?: string;
  startDate: string;
  endDate?: string;
}

interface SymptomDoc {
  id: string;
  userId?: string;
  date?: string;
  categoryId?: string;
  symptomId?: string;
  createdAt?: string;
}

const DAY_MODAL_CATEGORIES = [
  { id: 'sex', name: 'Секс', color: '#ec4899', items: [
    { id: 'none', name: 'Не было' }, { id: 'protected', name: 'С защитой' }, { id: 'unprotected', name: 'Без защиты' },
    { id: 'oral', name: 'Оральный' }, { id: 'anal', name: 'Анальный' }, { id: 'masturbation', name: 'Мастурбация' },
    { id: 'orgasm', name: 'Оргазм' },
  ]},
  { id: 'mood', name: 'Настроение', color: '#8b5cf6', items: [
    { id: 'calm', name: 'Спокойствие' }, { id: 'joy', name: 'Радость' }, { id: 'energy', name: 'Энергия' },
    { id: 'anxiety', name: 'Тревога' }, { id: 'sadness', name: 'Грусть' }, { id: 'irritability', name: 'Раздражение' },
    { id: 'apathy', name: 'Апатия' },
  ]},
  { id: 'physical', name: 'Самочувствие', color: '#f97316', items: [
    { id: 'ok', name: 'Всё в порядке' }, { id: 'cramps', name: 'Спазмы' }, { id: 'headache', name: 'Головная боль' },
    { id: 'fatigue', name: 'Усталость' }, { id: 'bloating', name: 'Вздутие' }, { id: 'back-pain', name: 'Боль в спине' },
    { id: 'breast', name: 'Чувствительная грудь' },
  ]},
  { id: 'discharge', name: 'Выделения', color: '#06b6d4', items: [
    { id: 'none', name: 'Нет' }, { id: 'creamy', name: 'Кремообразные' }, { id: 'watery', name: 'Водянистые' },
    { id: 'sticky', name: 'Липкие' }, { id: 'mucous', name: 'Слизистые' }, { id: 'bloody', name: 'Кровянистые' },
  ]},
  { id: 'digestion', name: 'Пищеварение', color: '#f59e0b', items: [
    { id: 'nausea', name: 'Тошнота' }, { id: 'bloating-d', name: 'Вздутие' },
    { id: 'constipation', name: 'Запор' }, { id: 'diarrhea', name: 'Диарея' },
  ]},
  { id: 'tests', name: 'Тесты', color: '#10b981', items: [
    { id: 'preg-neg', name: 'Тест: отриц.' }, { id: 'preg-pos', name: 'Тест: полож.' },
    { id: 'ovul-not', name: 'Овуляция: нет' }, { id: 'ovul-mark', name: 'Овуляция: да' },
  ]},
  { id: 'activity', name: 'Активность', color: '#3b82f6', items: [
    { id: 'no-training', name: 'Не было' }, { id: 'yoga', name: 'Йога' }, { id: 'gym', name: 'Зал' },
    { id: 'running', name: 'Бег' }, { id: 'walking', name: 'Ходьба' }, { id: 'swimming', name: 'Плавание' },
  ]},
  { id: 'other', name: 'Другое', color: '#6b7280', items: [
    { id: 'stress', name: 'Стресс' }, { id: 'meditation', name: 'Медитация' }, { id: 'kegel', name: 'Кегель' },
    { id: 'journal', name: 'Дневник' },
  ]},
];

interface CycleCalendarProps {
  cycleLength: number;
  periodLength: number;
}

export default function CycleCalendar({ cycleLength, periodLength }: CycleCalendarProps) {
  const { currentUser } = useDuoDaysAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [periods, setPeriods] = useState<PeriodDoc[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);

  const calStart = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'periods'), where('userId', '==', currentUser.uid));
    const unsub = onSnapshot(q, snap => {
      setPeriods(snap.docs.map(d => ({ id: d.id, ...d.data() } as PeriodDoc)));
    }, () => setPeriods([]));
    return unsub;
  }, [currentUser]);

  const periodDays = useMemo(() => {
    const set = new Set<string>();
    periods.forEach(p => {
      const start = parseISO(p.startDate);
      const end = p.endDate ? parseISO(p.endDate) : addDays(start, (periodLength || 5) - 1);
      let d = start;
      while (d <= end) {
        set.add(format(d, 'yyyy-MM-dd'));
        d = addDays(d, 1);
      }
    });
    return set;
  }, [periods, periodLength]);

  const ovulationDays = useMemo(() => {
    if (periods.length < 1) return new Set<string>();
    const sorted = [...periods].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const last = sorted[sorted.length - 1];
    const lastStart = parseISO(last.startDate);
    const set = new Set<string>();

    let avgCycle = cycleLength;
    if (sorted.length >= 2) {
      let totalDays = 0;
      for (let i = 1; i < sorted.length; i++) {
        totalDays += differenceInDays(parseISO(sorted[i].startDate), parseISO(sorted[i - 1].startDate));
      }
      avgCycle = Math.round(totalDays / (sorted.length - 1));
    }

    const ovDay = addDays(lastStart, avgCycle - 14);
    for (let i = -1; i <= 1; i++) {
      set.add(format(addDays(ovDay, i), 'yyyy-MM-dd'));
    }
    return set;
  }, [periods, cycleLength]);

  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    let d = calStart;
    for (let i = 0; i < 42; i++) {
      days.push(d);
      d = addDays(d, 1);
    }
    return days;
  }, [currentMonth]);

  const symptomsOnDay = useMemo(() => {
    const map: Record<string, boolean> = {};
    return map;
  }, []);

  function handleDayClick(day: Date) {
    setSelectedDay(day);
    setShowDayModal(true);
  }

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div className="crd" style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Droplets className="w-4 h-4" style={{ color: '#ef4444' }} /> Календарь
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text)' }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span style={{ fontSize: '13px', fontWeight: 600, minWidth: '120px', textAlign: 'center' }}>
            {format(currentMonth, 'LLLL yyyy', { locale: ru })}
          </span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text)' }}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
        {weekDays.map(d => (
          <div key={d} style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', padding: '6px 0' }}>{d}</div>
        ))}
        {calendarDays.map((day, i) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const inMonth = day.getMonth() === currentMonth.getMonth();
          const today = isToday(day);
          const isPeriod = periodDays.has(dateStr);
          const isOvulation = ovulationDays.has(dateStr);

          let bg = 'transparent';
          let color: string = inMonth ? 'var(--text)' : 'var(--text-muted)';
          let fontWeight: number | string = 'normal';

          if (isPeriod) { bg = '#ef4444'; color = 'white'; fontWeight = 600; }
          if (isOvulation) { bg = '#06b6d4'; color = 'white'; fontWeight = 600; }
          if (today && !isPeriod && !isOvulation) { fontWeight = 700; bg = 'var(--primary)'; color = 'white'; }
          if (today && isPeriod) { fontWeight = 700; }
          if (today && isOvulation) { fontWeight = 700; }

          return (
            <button
              key={i}
              onClick={() => handleDayClick(day)}
              style={{
                background: bg, color, border: 'none', borderRadius: (isPeriod || isOvulation) ? '50%' : '8px',
                width: (isPeriod || isOvulation) ? '32px' : undefined, height: (isPeriod || isOvulation) ? '32px' : undefined,
                padding: (isPeriod || isOvulation) ? '0' : '8px 0',
                margin: (isPeriod || isOvulation) ? '0 auto' : undefined,
                fontSize: '12px', fontWeight, cursor: 'pointer',
                fontFamily: 'inherit', opacity: inMonth ? 1 : 0.35, transition: 'background 0.15s',
              }}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '12px', fontSize: '11px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
          <span style={{ color: 'var(--text-muted)' }}>Месячные</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06b6d4' }} />
          <span style={{ color: 'var(--text-muted)' }}>Овуляция</span>
        </div>
      </div>

      {showDayModal && selectedDay && (
        <DayModal
          day={selectedDay}
          periods={periods}
          userId={currentUser?.uid || ''}
          onClose={() => { setShowDayModal(false); setSelectedDay(null); }}
        />
      )}
    </div>
  );
}

interface DayModalProps {
  day: Date;
  periods: PeriodDoc[];
  userId: string;
  onClose: () => void;
}

function DayModal({ day, periods, userId, onClose }: DayModalProps) {
  const dateStr = format(day, 'yyyy-MM-dd');
  const dateLabel = format(day, 'd MMMM, EEEE', { locale: ru });
  const [activeTab, setActiveTab] = useState<'symptoms' | 'period'>('symptoms');
  const [daySymptoms, setDaySymptoms] = useState<SymptomDoc[]>([]);

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, 'symptoms'), where('userId', '==', userId), where('date', '==', dateStr));
    const unsub = onSnapshot(q, snap => {
      setDaySymptoms(snap.docs.map(d => ({ id: d.id, ...d.data() } as SymptomDoc)));
    }, () => setDaySymptoms([]));
    return unsub;
  }, [userId, dateStr]);

  const existingPeriod = periods.find(p => {
    const start = parseISO(p.startDate);
    const end = p.endDate ? parseISO(p.endDate) : addDays(start, 4);
    return day >= start && day <= end;
  });

  const isPeriodStart = periods.some(p => isSameDay(parseISO(p.startDate), day));

  async function togglePeriodStart() {
    if (isPeriodStart) {
      const p = periods.find(pp => isSameDay(parseISO(pp.startDate), day));
      if (p) await deleteDoc(doc(db, 'periods', p.id));
      toast.success('Отметка убрана');
    } else {
      await addDoc(collection(db, 'periods'), { userId, startDate: dateStr, createdAt: new Date().toISOString() });
      toast.success('Начало месячных отмечено');
    }
  }

  async function markPeriodEnd() {
    if (!existingPeriod) return;
    await updateDoc(doc(db, 'periods', existingPeriod.id), { endDate: dateStr });
    toast.success('Конец месячных отмечен');
  }

  async function toggleSymptom(catId: string, itemId: string) {
    const existing = daySymptoms.find(s => s.categoryId === catId && s.symptomId === itemId);
    if (existing) {
      await deleteDoc(doc(db, 'symptoms', existing.id));
    } else {
      await addDoc(collection(db, 'symptoms'), { userId, date: dateStr, categoryId: catId, symptomId: itemId, createdAt: new Date().toISOString() });
    }
  }

  function isSymptomSelected(catId: string, itemId: string) {
    return daySymptoms.some(s => s.categoryId === catId && s.symptomId === itemId);
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
      <div className="crd" style={{ position: 'relative', width: '100%', maxWidth: '440px', maxHeight: '80vh', overflowY: 'auto', padding: 0, backgroundColor: 'var(--background)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '2px' }}>{dateLabel}</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{dateStr}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}><X className="w-5 h-5" /></button>
        </div>

        <div style={{ display: 'flex', padding: '16px 20px 0', borderBottom: '1px solid var(--border)' }}>
          {(['symptoms', 'period'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              flex: 1, padding: '10px', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit',
              background: 'none', border: 'none', borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer',
            }}>
              {tab === 'period' ? 'Месячные' : 'Симптомы'}
            </button>
          ))}
        </div>

        <div style={{ padding: '16px 20px 20px' }}>
          {activeTab === 'period' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={togglePeriodStart} style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', borderRadius: '12px',
                border: isPeriodStart ? '2px solid #ef4444' : '1px solid var(--border)',
                background: isPeriodStart ? '#ef444418' : 'var(--bg-elevated, var(--card))',
                cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'left',
              }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: isPeriodStart ? '#ef4444' : '#ef444420', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Droplets className="w-4 h-4" style={{ color: isPeriodStart ? 'white' : '#ef4444' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: isPeriodStart ? '#ef4444' : 'var(--text)' }}>
                    {isPeriodStart ? 'Начало отмечено' : 'Отметить начало месячных'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {isPeriodStart ? 'Нажмите, чтобы убрать' : 'День начала менструации'}
                  </div>
                </div>
                {isPeriodStart && <Check className="w-4 h-4" style={{ color: '#ef4444' }} />}
              </button>

              {existingPeriod && !existingPeriod.endDate && (
                <button onClick={markPeriodEnd} style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', borderRadius: '12px',
                  border: '1px solid var(--border)', background: 'var(--bg-elevated, var(--card))',
                  cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'left',
                }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f9731620', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Droplets className="w-4 h-4" style={{ color: '#f97316' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Отметить конец месячных</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Последний день</div>
                  </div>
                </button>
              )}

              {existingPeriod?.endDate && (
                <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#ef444410', border: '1px solid #ef444420', fontSize: '12px', color: '#ef4444' }}>
                  Менструация: {format(parseISO(existingPeriod.startDate), 'd MMM', { locale: ru })} — {format(parseISO(existingPeriod.endDate), 'd MMM', { locale: ru })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'symptoms' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {DAY_MODAL_CATEGORIES.map(cat => (
                <div key={cat.id}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: cat.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{cat.name}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {cat.items.map(item => {
                      const active = isSymptomSelected(cat.id, item.id);
                      return (
                        <button key={item.id} onClick={() => toggleSymptom(cat.id, item.id)} style={{
                          display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '8px',
                          border: active ? `2px solid ${cat.color}` : '1px solid var(--border)',
                          background: active ? cat.color + '18' : 'var(--bg-elevated, var(--card))',
                          cursor: 'pointer', fontSize: '11px', fontWeight: 500,
                          color: active ? cat.color : 'var(--text)', fontFamily: 'inherit',
                        }}>
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
      </div>
    </div>
  );
}
