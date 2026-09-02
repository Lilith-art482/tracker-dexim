"use client";

import { useState, useEffect, useRef } from 'react';
import { useDuoDaysAuth } from '@/lib/duodays/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Heart, Activity, Droplets, Thermometer, Moon, Zap, Brain, Bed, Wind, Pill, Eye, FileText, Settings, X, Check, ChevronDown, ChevronUp, Baby } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

interface FeelingItem {
  id: string;
  name: string;
}

interface FeelingCategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  items: FeelingItem[];
}

const FEELING_CATEGORIES: FeelingCategory[] = [
  {
    id: 'sex',
    name: 'Секс и сексуальное желание',
    icon: Heart,
    color: '#ec4899',
    items: [
      { id: 'sex-high', name: 'Повышенное желание' },
      { id: 'sex-normal', name: 'Нормальное' },
      { id: 'sex-low', name: 'Пониженное' },
      { id: 'sex-none', name: 'Отсутствует' },
      { id: 'sex-orgasm', name: 'Оргазм' },
      { id: 'sex-pain', name: 'Боль при сексе' },
    ]
  },
  {
    id: 'symptoms',
    name: 'Симптомы',
    icon: Activity,
    color: '#ef4444',
    items: [
      { id: 'sym-cramps', name: 'Спазмы' },
      { id: 'sym-headache', name: 'Головная боль' },
      { id: 'sym-backpain', name: 'Боль в спине' },
      { id: 'sym-bloating', name: 'Вздутие' },
      { id: 'sym-breast', name: 'Чувствительная грудь' },
      { id: 'sym-acne', name: 'Прыщи' },
      { id: 'sym-fatigue', name: 'Усталость' },
      { id: 'sym-nausea', name: 'Тошнота' },
      { id: 'sym-insomnia', name: 'Бессонница' },
    ]
  },
  {
    id: 'mood',
    name: 'Настроение',
    icon: Brain,
    color: '#8b5cf6',
    items: [
      { id: 'mood-happy', name: 'Радость' },
      { id: 'mood-calm', name: 'Спокойствие' },
      { id: 'mood-energetic', name: 'Энергичность' },
      { id: 'mood-anxious', name: 'Тревога' },
      { id: 'mood-irritable', name: 'Раздражение' },
      { id: 'mood-sad', name: 'Грусть' },
      { id: 'mood-sensitive', name: 'Чувствительность' },
      { id: 'mood-angry', name: 'Злость' },
    ]
  },
  {
    id: 'digestion',
    name: 'Пищеварение и стул',
    icon: Wind,
    color: '#f59e0b',
    items: [
      { id: 'dig-normal', name: 'Нормальное' },
      { id: 'dig-constipation', name: 'Запор' },
      { id: 'dig-diarrhea', name: 'Диарея' },
      { id: 'dig-bloating', name: 'Метеоризм' },
      { id: 'dig-nausea', name: 'Тошнота' },
      { id: 'dig-appetite', name: 'Повышенный аппетит' },
    ]
  },
  {
    id: 'discharge',
    name: 'Вагинальные выделения',
    icon: Droplets,
    color: '#06b6d4',
    items: [
      { id: 'dis-none', name: 'Нет' },
      { id: 'dis-light', name: 'Скудные' },
      { id: 'dis-medium', name: 'Умеренные' },
      { id: 'dis-heavy', name: 'Обильные' },
      { id: 'dis-white', name: 'Белые' },
      { id: 'dis-clear', name: 'Прозрачные' },
      { id: 'dis-brown', name: 'Коричневые' },
    ]
  },
  {
    id: 'ovulation-test',
    name: 'Тест на овуляцию',
    icon: Eye,
    color: '#10b981',
    items: [
      { id: 'ov-pos', name: 'Положительный' },
      { id: 'ov-neg', name: 'Отрицательный' },
      { id: 'ov-half', name: 'Почти положительный' },
    ]
  },
  {
    id: 'pregnancy-test',
    name: 'Тест на беременность',
    icon: Baby,
    color: '#ec4899',
    items: [
      { id: 'preg-pos', name: 'Положительный' },
      { id: 'preg-neg', name: 'Отрицательный' },
      { id: 'preg-half', name: 'Слабоположительный' },
    ]
  },
  {
    id: 'activity',
    name: 'Физическая активность',
    icon: Zap,
    color: '#f97316',
    items: [
      { id: 'act-none', name: 'Нет' },
      { id: 'act-walk', name: 'Прогулка' },
      { id: 'act-yoga', name: 'Йога' },
      { id: 'act-gym', name: 'Тренажёрный зал' },
      { id: 'act-run', name: 'Бег' },
      { id: 'act-swim', name: 'Плавание' },
      { id: 'act-dance', name: 'Танцы' },
    ]
  },
  {
    id: 'contraceptives',
    name: 'Оральные контрацептивы',
    icon: Pill,
    color: '#6366f1',
    items: [
      { id: 'oc-taken', name: 'Приняла' },
      { id: 'oc-missed', name: 'Пропустила' },
      { id: 'oc-na', name: 'Не принимаю' },
    ]
  },
  {
    id: 'pills',
    name: 'Иные таблетки',
    icon: Pill,
    color: '#8b5cf6',
    items: [
      { id: 'pills-taken', name: 'Приняла' },
      { id: 'pills-missed', name: 'Пропустила' },
      { id: 'pills-na', name: 'Не принимаю' },
    ]
  },
  {
    id: 'water',
    name: 'Вода',
    icon: Droplets,
    color: '#0ea5e9',
    items: [
      { id: 'water-low', name: 'Мало (< 1л)' },
      { id: 'water-mid', name: 'Норма (1-2л)' },
      { id: 'water-high', name: 'Много (> 2л)' },
    ]
  },
  {
    id: 'weight',
    name: 'Вес',
    icon: Activity,
    color: '#64748b',
    items: [
      { id: 'weight-up', name: 'Прибавка' },
      { id: 'weight-same', name: 'Без изменений' },
      { id: 'weight-down', name: 'Снижение' },
    ]
  },
  {
    id: 'temperature',
    name: 'Базальная температура',
    icon: Thermometer,
    color: '#ef4444',
    items: [
      { id: 'temp-low', name: 'Низкая (< 36.4)' },
      { id: 'temp-normal', name: 'Норма (36.4-36.7)' },
      { id: 'temp-high', name: 'Высокая (> 36.7)' },
    ]
  },
  {
    id: 'other',
    name: 'Другое',
    icon: Moon,
    color: '#6b7280',
    items: [
      { id: 'oth-cravings', name: 'Тяга к еде' },
      { id: 'oth-hotflash', name: 'Приливы' },
      { id: 'oth-dizzy', name: 'Головокружение' },
      { id: 'oth-allergy', name: 'Аллергия' },
    ]
  },
  {
    id: 'notes',
    name: 'Заметки',
    icon: FileText,
    color: '#a78bfa',
    items: []
  },
];

export default function DuoDaysDailyFeelings({ selectedDate }: { selectedDate: string }) {
  const { currentUser } = useDuoDaysAuth();
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [noteText, setNoteText] = useState('');
  const [disabledCats, setDisabledCats] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser || !selectedDate) return;
    const q = query(collection(db, 'dailyFeelings'), where('userId', '==', currentUser.uid), where('date', '==', selectedDate));
    const unsub = onSnapshot(q, snap => {
      const sel: Record<string, string> = {};
      let note = '';
      snap.docs.forEach(d => {
        const data = d.data();
        if (data.type === 'selection') sel[data.itemId] = d.id;
        if (data.type === 'note') { note = data.text; }
      });
      setSelections(sel);
      setNoteText(note);
    });
    return unsub;
  }, [currentUser, selectedDate]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'userSettings'), where('userId', '==', currentUser.uid));
    const unsub = onSnapshot(q, snap => {
      if (!snap.empty) {
        const data = snap.docs[0].data();
        setDisabledCats(data.disabledFeelings || []);
      }
    });
    return unsub;
  }, [currentUser]);

  async function toggleItem(itemId: string) {
    if (!currentUser) return;
    if (selections[itemId]) {
      await deleteDoc(doc(db, 'dailyFeelings', selections[itemId]));
    } else {
      await addDoc(collection(db, 'dailyFeelings'), {
        userId: currentUser.uid,
        date: selectedDate,
        itemId,
        type: 'selection',
        createdAt: new Date().toISOString(),
      });
    }
  }

  async function saveNote() {
    if (!currentUser) return;
    const q = query(collection(db, 'dailyFeelings'), where('userId', '==', currentUser.uid), where('date', '==', selectedDate), where('type', '==', 'note'));
    const snap = await new Promise<import('firebase/firestore').QuerySnapshot>(resolve => {
      const unsub = onSnapshot(q, s => { unsub(); resolve(s); });
    });
    if (!snap.empty) {
      await deleteDoc(doc(db, 'dailyFeelings', snap.docs[0].id));
    }
    if (noteText.trim()) {
      await addDoc(collection(db, 'dailyFeelings'), {
        userId: currentUser.uid,
        date: selectedDate,
        text: noteText,
        type: 'note',
        createdAt: new Date().toISOString(),
      });
    }
  }

  function toggleCategory(catId: string) {
    setDisabledCats(prev => {
      const next = prev.includes(catId) ? prev.filter(x => x !== catId) : [...prev, catId];
      if (currentUser) {
        getDoc(doc(db, 'userSettings', currentUser.uid)).then(snap => {
          if (snap.exists()) updateDoc(doc(db, 'userSettings', currentUser.uid), { disabledFeelings: next });
        });
      }
      return next;
    });
  }

  const visibleCategories = FEELING_CATEGORIES.filter(c => !disabledCats.includes(c.id));
  const hiddenCategories = FEELING_CATEGORIES.filter(c => disabledCats.includes(c.id));
  const todayStr = format(parseISO(selectedDate), 'd MMMM', { locale: ru });

  return (
    <div className="crd" style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '2px' }}>Как вы себя чувствуете?</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{todayStr}</p>
        </div>
        <button onClick={() => setShowSettings(true)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontFamily: 'inherit' }}>
          <Settings className="w-4 h-4" /> Категории
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {visibleCategories.map(cat => {
          const CatIcon = cat.icon;
          const isExpanded = expandedCat === cat.id;
          const selectedCount = cat.items.filter(item => selections[item.id]).length;
          return (
            <div key={cat.id} style={{ borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', overflow: 'hidden' }}>
              <button onClick={() => setExpandedCat(isExpanded ? null : cat.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: cat.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CatIcon className="w-4 h-4" style={{ color: cat.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{cat.name}</div>
                  {selectedCount > 0 && <div style={{ fontSize: '11px', color: cat.color, marginTop: '1px' }}>{selectedCount} выбрано</div>}
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> : <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
              </button>

              {isExpanded && (
                <div style={{ padding: '0 14px 14px' }}>
                  {cat.id === 'notes' ? (
                    <textarea
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      onBlur={saveNote}
                      placeholder="Ваши заметки..."
                      className="inp inp-noicon"
                      style={{ minHeight: '60px', fontSize: '13px' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {cat.items.map(item => {
                        const isActive = !!selections[item.id];
                        return (
                          <button key={item.id} onClick={() => toggleItem(item.id)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', border: isActive ? '2px solid ' + cat.color : '1px solid var(--border)', background: isActive ? cat.color + '18' : 'transparent', cursor: 'pointer', fontSize: '12px', fontWeight: 500, color: isActive ? cat.color : 'var(--text-muted)', fontFamily: 'inherit', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                            {isActive && <Check className="w-3 h-3" />}
                            {item.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="crd" style={{ position: 'relative', width: '100%', maxWidth: '400px', maxHeight: '80vh', overflowY: 'auto', padding: '24px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-drag-handle" />
            <button onClick={() => setShowSettings(false)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}><X className="w-5 h-5" /></button>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Категории</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Включите или отключите категории</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {FEELING_CATEGORIES.map(cat => {
                const CatIcon = cat.icon;
                const isEnabled = !disabledCats.includes(cat.id);
                return (
                  <button key={cat.id} onClick={() => toggleCategory(cat.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: isEnabled ? cat.color + '08' : 'var(--bg-elevated)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isEnabled ? cat.color + '20' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CatIcon className="w-4 h-4" style={{ color: isEnabled ? cat.color : 'var(--text-muted)' }} />
                    </div>
                    <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: isEnabled ? 'var(--text)' : 'var(--text-muted)', textAlign: 'left' }}>{cat.name}</span>
                    <div style={{ width: '36px', height: '20px', borderRadius: '10px', background: isEnabled ? cat.color : 'var(--border)', position: 'relative', transition: 'all 0.2s', flexShrink: 0 }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: isEnabled ? '18px' : '2px', transition: 'all 0.2s' }} />
                    </div>
                  </button>
                );
              })}
            </div>

            <button onClick={() => setShowSettings(false)} className="btn-p btn-pill" style={{ width: '100%', padding: '12px', marginTop: '16px' }}>Готово</button>
          </div>
        </div>
      )}
    </div>
  );
}
