import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, Plus, ArrowDownRight, ArrowUpRight,
  Funnel, ChartPieSlice, X
} from '@phosphor-icons/react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type {
  FinanceData, FinanceOperation, OperationType,
  Debt, Saving
} from '../types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, ACCOUNTS } from '../types';
import { playStoneDropSound } from '../utils/sounds';
import './Finances.css';

type Tab = 'operations' | 'debts' | 'savings';
type ModalMode = null | 'debt' | 'saving' | 'payment';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(amount);
}

const DEBT_TYPES = [
  { value: 'credit', label: 'Кредит' },
  { value: 'installment', label: 'Рассрочка' },
  { value: 'utilities', label: 'ЖКУ' },
  { value: 'internet', label: 'Интернет' },
  { value: 'other', label: 'Другое' },
] as const;

const PRIORITIES = [
  { value: 'high', label: '🔥 Срочно' },
  { value: 'medium', label: '📌 Средне' },
  { value: 'low', label: '🌱 Не срочно' },
] as const;

function migrateOldData(stored: unknown): FinanceData {
  if (stored && typeof stored === 'object') {
    const s = stored as Record<string, unknown>;
    return {
      operations: Array.isArray(s.operations) ? s.operations as FinanceOperation[] : [],
      debts: Array.isArray(s.debts) ? s.debts as Debt[] : [],
      savings: Array.isArray(s.savings) ? s.savings as Saving[] : [],
      monthlyExpenses: typeof s.monthlyExpenses === 'number' ? s.monthlyExpenses : undefined,
    };
  }
  const old = stored as { budget?: number; expenses?: Array<{ id: string; amount: number; category: string; date: string; note: string }> } | null;
  if (old?.expenses) {
    return {
      operations: old.expenses.map(e => ({
        id: e.id,
        type: 'expense' as const,
        amount: e.amount,
        category: e.category,
        description: e.note || '',
        date: e.date,
        account: 'Карта',
        createdAt: e.date + 'T00:00:00Z',
      })),
      debts: [],
      savings: [],
    };
  }
  return { operations: [], debts: [], savings: [] };
}

interface ModalState {
  mode: ModalMode;
  editingId?: string;
  debtId?: string;
}

const emptyDebt = (): Omit<Debt, 'id'> => ({
  title: '',
  type: 'credit',
  totalAmount: 0,
  monthlyPayment: undefined,
  remainingAmount: 0,
  startDate: '',
  endDate: '',
  status: 'active',
  notes: '',
});

const emptySaving = (): Omit<Saving, 'id'> => ({
  title: '',
  currentAmount: 0,
  targetAmount: 0,
  monthlyContribution: undefined,
  targetDate: '',
  priority: 'medium',
});

interface FinancesProps {
  onIncomeAdded?: () => void;
  onExpenseAdded?: () => void;
}

export default function Finances({ onIncomeAdded, onExpenseAdded }: FinancesProps) {
  const [data, setData] = useLocalStorage<FinanceData>(
    'finance_data',
    { operations: [], debts: [], savings: [] },
    migrateOldData,
  );

  const [tab, setTab] = useState<Tab>('operations');
  const [modal, setModal] = useState<ModalState>({ mode: null });

  // Operation form state
  const [opMode, setOpMode] = useState<OperationType>('expense');
  const [showOpForm, setShowOpForm] = useState(false);
  const [opAmount, setOpAmount] = useState('');
  const [opCategory, setOpCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [opDescription, setOpDescription] = useState('');
  const [opDate, setOpDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [opAccount, setOpAccount] = useState(ACCOUNTS[0]);
  const [opFilter, setOpFilter] = useState<'all' | OperationType>('all');

  // Debt form state
  const [debtForm, setDebtForm] = useState(emptyDebt());

  // Saving form state
  const [savingForm, setSavingForm] = useState(emptySaving());

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));

  const opCategories = opMode === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // -- Computed --
  const totalIncome = useMemo(
    () => data.operations.filter(o => o.type === 'income').reduce((s, o) => s + o.amount, 0),
    [data.operations],
  );
  const totalExpense = useMemo(
    () => data.operations.filter(o => o.type === 'expense').reduce((s, o) => s + o.amount, 0),
    [data.operations],
  );
  const balance = totalIncome - totalExpense;
  const healthPercent = totalIncome > 0 ? Math.min(100, (totalExpense / totalIncome) * 100) : 0;

  const activeDebts = useMemo(
    () => data.debts.filter(d => d.status === 'active'),
    [data.debts],
  );
  const totalDebt = useMemo(
    () => activeDebts.reduce((s, d) => s + d.remainingAmount, 0),
    [activeDebts],
  );

  const totalSavings = useMemo(
    () => data.savings.reduce((s, sv) => s + sv.currentAmount, 0),
    [data.savings],
  );

  const monthlyExpenses = data.monthlyExpenses || totalExpense || 30000;
  const emergencyTarget = monthlyExpenses * 6;
  const emergencyProgress = emergencyTarget > 0 ? Math.min(100, (totalSavings / emergencyTarget) * 100) : 0;

  const filteredOps = useMemo(() => {
    let ops = [...data.operations].sort(
      (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
    );
    if (opFilter !== 'all') ops = ops.filter(o => o.type === opFilter);
    return ops;
  }, [data.operations, opFilter]);

  const categoryStats = useMemo(() => {
    const stats: Record<string, { income: number; expense: number }> = {};
    data.operations.forEach(o => {
      if (!stats[o.category]) stats[o.category] = { income: 0, expense: 0 };
      stats[o.category][o.type] += o.amount;
    });
    return stats;
  }, [data.operations]);

  // -- Handlers --
  const addOperation = () => {
    const amt = parseFloat(opAmount);
    if (!amt || amt <= 0) return;
    const op: FinanceOperation = {
      id: generateId(),
      type: opMode,
      amount: amt,
      category: opCategory,
      description: opDescription.trim(),
      date: opDate,
      account: opAccount,
      createdAt: new Date().toISOString(),
    };
    setData(prev => ({ ...prev, operations: [...prev.operations, op] }));
    if (opMode === 'expense') {
      playStoneDropSound();
      onExpenseAdded?.();
    } else {
      onIncomeAdded?.();
    }
    setOpAmount('');
    setOpDescription('');
    setShowOpForm(false);
  };

  const deleteOperation = (id: string) => {
    setData(prev => ({
      ...prev,
      operations: prev.operations.filter(o => o.id !== id),
    }));
  };

  const openModal = useCallback((mode: ModalMode, debtId?: string) => {
    if (mode === 'debt') setDebtForm(emptyDebt());
    if (mode === 'saving') setSavingForm(emptySaving());
    if (mode === 'payment') {
      setPaymentAmount('');
      setPaymentDate(new Date().toISOString().slice(0, 10));
    }
    setModal({ mode, debtId });
  }, []);

  const closeModal = useCallback(() => {
    setModal({ mode: null });
  }, []);

  const addDebt = () => {
    if (!debtForm.title.trim() || debtForm.totalAmount <= 0) return;
    const debt: Debt = {
      id: generateId(),
      ...debtForm,
      totalAmount: debtForm.totalAmount,
      remainingAmount: debtForm.remainingAmount || debtForm.totalAmount,
    };
    setData(prev => ({ ...prev, debts: [...prev.debts, debt] }));
    closeModal();
  };

  const addSaving = () => {
    if (!savingForm.title.trim() || savingForm.targetAmount <= 0) return;
    const saving: Saving = {
      id: generateId(),
      ...savingForm,
    };
    setData(prev => ({ ...prev, savings: [...prev.savings, saving] }));
    closeModal();
  };

  const recordPayment = () => {
    const amt = parseFloat(paymentAmount);
    if (!amt || amt <= 0 || !modal.debtId) return;
    setData(prev => ({
      ...prev,
      debts: prev.debts.map(d => {
        if (d.id !== modal.debtId) return d;
        const newRemaining = Math.max(0, d.remainingAmount - amt);
        return {
          ...d,
          remainingAmount: newRemaining,
          status: newRemaining <= 0 ? 'closed' : d.status,
          payments: [...(d.payments || []), { amount: amt, date: paymentDate }],
        };
      }),
    }));
    closeModal();
  };

  const deleteDebt = (id: string) => {
    setData(prev => ({ ...prev, debts: prev.debts.filter(d => d.id !== id) }));
  };

  // -- Modal fields --
  function renderModalFields() {
    if (modal.mode === 'debt') {
      return (
        <>
          <label>Название</label>
          <input
            value={debtForm.title}
            onChange={e => setDebtForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Кредитная карта, Ипотека..."
          />
          <label>Тип</label>
          <select value={debtForm.type} onChange={e => setDebtForm(f => ({ ...f, type: e.target.value as Debt['type'] }))}>
            {DEBT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <label>Общая сумма долга</label>
          <input
            type="number" min="0"
            value={debtForm.totalAmount || ''}
            onChange={e => setDebtForm(f => ({ ...f, totalAmount: parseFloat(e.target.value) || 0 }))}
          />
          <label>Остаток</label>
          <input
            type="number" min="0"
            value={debtForm.remainingAmount || ''}
            onChange={e => setDebtForm(f => ({ ...f, remainingAmount: parseFloat(e.target.value) || 0 }))}
          />
          <label>Ежемесячный платёж (необязательно)</label>
          <input
            type="number" min="0"
            value={debtForm.monthlyPayment || ''}
            onChange={e => setDebtForm(f => ({ ...f, monthlyPayment: parseFloat(e.target.value) || undefined }))}
          />
          <label>Дата начала</label>
          <input type="date" value={debtForm.startDate} onChange={e => setDebtForm(f => ({ ...f, startDate: e.target.value }))} />
          <label>Дата окончания</label>
          <input type="date" value={debtForm.endDate} onChange={e => setDebtForm(f => ({ ...f, endDate: e.target.value }))} />
          <label>Статус</label>
          <select value={debtForm.status} onChange={e => setDebtForm(f => ({ ...f, status: e.target.value as Debt['status'] }))}>
            <option value="active">Активный</option>
            <option value="closed">Закрыт</option>
            <option value="overdue">Просрочен</option>
          </select>
          <label>Заметки</label>
          <input value={debtForm.notes || ''} onChange={e => setDebtForm(f => ({ ...f, notes: e.target.value }))} placeholder="Банк, ставка..." />
        </>
      );
    }
    if (modal.mode === 'payment') {
      const debt = data.debts.find(d => d.id === modal.debtId);
      if (!debt) return null;
      return (
        <>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontWeight: 600, color: '#3a2a4b' }}>{debt.title}</div>
            <div style={{ fontSize: '0.85rem', color: '#7a6a8b', marginTop: 4 }}>
              Остаток: {formatMoney(debt.remainingAmount)}
            </div>
          </div>
          <label>Сумма платежа</label>
          <input
            type="number" min="0" max={debt.remainingAmount}
            value={paymentAmount}
            onChange={e => setPaymentAmount(e.target.value)}
            placeholder="Сколько внёс?"
          />
          <label>Дата платежа</label>
          <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
        </>
      );
    }
    if (modal.mode === 'saving') {
      return (
        <>
          <label>Название цели</label>
          <input
            value={savingForm.title}
            onChange={e => setSavingForm(f => ({ ...f, title: e.target.value }))}
            placeholder="На машину, на квартиру..."
          />
          <label>Текущая сумма</label>
          <input
            type="number" min="0"
            value={savingForm.currentAmount || ''}
            onChange={e => setSavingForm(f => ({ ...f, currentAmount: parseFloat(e.target.value) || 0 }))}
          />
          <label>Целевая сумма</label>
          <input
            type="number" min="0"
            value={savingForm.targetAmount || ''}
            onChange={e => setSavingForm(f => ({ ...f, targetAmount: parseFloat(e.target.value) || 0 }))}
          />
          <label>Ежемесячное пополнение (необязательно)</label>
          <input
            type="number" min="0"
            value={savingForm.monthlyContribution || ''}
            onChange={e => setSavingForm(f => ({ ...f, monthlyContribution: parseFloat(e.target.value) || undefined }))}
          />
          <label>Дата цели (необязательно)</label>
          <input type="date" value={savingForm.targetDate} onChange={e => setSavingForm(f => ({ ...f, targetDate: e.target.value }))} />
          <label>Срочность</label>
          <select value={savingForm.priority} onChange={e => setSavingForm(f => ({ ...f, priority: e.target.value as Saving['priority'] }))}>
            {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </>
      );
    }
    return null;
  }

  // -- Render helpers --
  function renderOperations() {
    return (
      <div className="operations-section">
        <div className="ops-header">
          <div className="mode-tabs">
            <motion.button
              className={`mode-tab ${opMode === 'expense' ? 'active' : ''}`}
              onClick={() => { setOpMode('expense'); setOpCategory(EXPENSE_CATEGORIES[0]); }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowDownRight size={18} weight="bold" /> Расход
            </motion.button>
            <motion.button
              className={`mode-tab ${opMode === 'income' ? 'active' : ''}`}
              onClick={() => { setOpMode('income'); setOpCategory(INCOME_CATEGORIES[0]); }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowUpRight size={18} weight="bold" /> Доход
            </motion.button>
          </div>
          <motion.button
            className="ops-add-btn"
            onClick={() => setShowOpForm(!showOpForm)}
            whileTap={{ scale: 0.9 }}
          >
            <Plus size={20} weight="bold" />
          </motion.button>
        </div>

        <AnimatePresence>
          {showOpForm && (
            <motion.div
              className="op-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <input type="number" className="op-input" placeholder="Сумма" value={opAmount} onChange={e => setOpAmount(e.target.value)} />
              <select className="op-select" value={opCategory} onChange={e => setOpCategory(e.target.value)}>
                {opCategories.map(c => <option key={c}>{c}</option>)}
              </select>
              <input type="text" className="op-input" placeholder="Описание" value={opDescription} onChange={e => setOpDescription(e.target.value)} />
              <input type="date" className="op-input" value={opDate} onChange={e => setOpDate(e.target.value)} />
              <select className="op-select" value={opAccount} onChange={e => setOpAccount(e.target.value)}>
                {ACCOUNTS.map(a => <option key={a}>{a}</option>)}
              </select>
              <motion.button
                className="op-submit"
                onClick={addOperation}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: opMode === 'income'
                    ? 'linear-gradient(135deg, #B5EAD7, #7ec8a0)'
                    : 'linear-gradient(135deg, #FDE2E4, #f0a0b0)',
                }}
              >
                {opMode === 'income' ? '💰 Добавить доход' : '💸 Добавить расход'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="ops-filter">
          <Funnel size={14} />
          {(['all', 'income', 'expense'] as const).map(f => (
            <button
              key={f}
              className={`filter-btn ${opFilter === f ? 'active' : ''}`}
              onClick={() => setOpFilter(f)}
            >
              {f === 'all' ? 'Все' : f === 'income' ? 'Доходы' : 'Расходы'}
            </button>
          ))}
        </div>

        <div className="ops-list">
          <AnimatePresence>
            {filteredOps.map(op => (
              <motion.div
                key={op.id}
                className={`op-item ${op.type}`}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
              >
                <div className="op-icon" style={{
                  background: op.type === 'income' ? 'rgba(181, 234, 215, 0.3)' : 'rgba(253, 226, 228, 0.3)',
                }}>
                  {op.type === 'income' ? '💰' : '💸'}
                </div>
                <div className="op-info">
                  <span className="op-category">{op.category}</span>
                  <span className="op-meta">{op.description || op.account} · {op.date}</span>
                </div>
                <span className={`op-amount ${op.type}`}>
                  {op.type === 'income' ? '+' : '-'}{op.amount.toLocaleString()} ₽
                </span>
                <button className="op-delete" onClick={() => deleteOperation(op.id)}>
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredOps.length === 0 && (
            <div className="ops-empty">Нет операций</div>
          )}
        </div>
      </div>
    );
  }

  function renderChart() {
    return (
      <div className="chart-section">
        <h3 className="chart-title">
          <ChartPieSlice size={18} weight="fill" />
          По категориям
        </h3>
        <div className="chart-list">
          {Object.entries(categoryStats)
            .sort(([, a], [, b]) => (b.income + b.expense) - (a.income + a.expense))
            .map(([cat, stats]) => {
              const maxTotal = Math.max(
                ...Object.values(categoryStats).map(s => s.income + s.expense),
                1,
              );
              return (
                <div key={cat} className="chart-row">
                  <div className="chart-bar-track">
                    {stats.income > 0 && (
                      <motion.div
                        className="chart-bar income"
                        initial={{ width: 0 }}
                        animate={{ width: `${(stats.income / maxTotal) * 100}%` }}
                        transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                      />
                    )}
                    {stats.expense > 0 && (
                      <motion.div
                        className="chart-bar expense"
                        initial={{ width: 0 }}
                        animate={{ width: `${(stats.expense / maxTotal) * 100}%` }}
                        transition={{ type: 'spring', stiffness: 80, damping: 15, delay: 0.1 }}
                        style={{ left: `${(stats.income / maxTotal) * 100}%` }}
                      />
                    )}
                  </div>
                  <div className="chart-label">
                    <span>{cat}</span>
                    <span className="chart-value">
                      {stats.income > 0 && <span className="income">+{stats.income.toLocaleString()} </span>}
                      {stats.expense > 0 && <span className="expense">-{stats.expense.toLocaleString()}</span>}
                    </span>
                  </div>
                </div>
              );
            })}
          {Object.keys(categoryStats).length === 0 && (
            <div className="chart-empty">Нет данных для графика</div>
          )}
        </div>
      </div>
    );
  }

  function renderDebts() {
    return (
      <div>
        {data.debts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎉</div>
            <div className="empty-text">У тебя нет долгов! Так держать!</div>
          </div>
        ) : (
          <div className="cards-grid">
            {data.debts.map(d => {
              const progress = d.totalAmount > 0
                ? ((d.totalAmount - d.remainingAmount) / d.totalAmount) * 100
                : 0;
              const colorClass = progress < 30 ? 'green' : progress < 70 ? 'yellow' : 'red';
              const statusEmoji = d.status === 'active' ? '🟢' : d.status === 'closed' ? '✅' : '🔴';
              const statusText = d.status === 'active' ? 'Активен' : d.status === 'closed' ? 'Закрыт' : 'Просрочен';
              const typeLabel = DEBT_TYPES.find(t => t.value === d.type)?.label || d.type;

              return (
                <motion.div
                  key={d.id}
                  className="card-item"
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="card-info">
                    <span className="card-title">{statusEmoji} {d.title}</span>
                    <span className="card-sub">{statusText} · {typeLabel}</span>
                    {d.monthlyPayment && (
                      <span className="card-sub">Ежемесячно: {formatMoney(d.monthlyPayment)}</span>
                    )}
                  </div>
                  <div className="progress-wrap">
                    <div className="progress-bar">
                      <div className={`progress-fill ${colorClass}`} style={{ width: `${Math.min(progress, 100)}%` }} />
                    </div>
                    <span className="progress-label">{Math.round(progress)}%</span>
                  </div>
                  <span className="card-amount negative">{formatMoney(d.remainingAmount)}</span>
                  <div className="card-actions">
                    {d.status === 'active' && (
                      <button className="card-action-btn pay" onClick={() => openModal('payment', d.id)} title="Внести платёж">
                        💳
                      </button>
                    )}
                    <button className="card-action-btn delete" onClick={() => deleteDebt(d.id)} title="Удалить">
                      ✕
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
        <motion.button
          className="add-btn"
          onClick={() => openModal('debt')}
          whileTap={{ scale: 0.97 }}
        >
          🏦 + Добавить кредит / обязательство
        </motion.button>
      </div>
    );
  }

  function renderSavings() {
    const isFundReady = totalSavings >= emergencyTarget;

    return (
      <div>
        <div className="emergency-card">
          <div className="emergency-header">
            <span className="emergency-title">🛡️ Подушка безопасности</span>
            <span className="emergency-status">
              {isFundReady ? '✅ Сформирована! 🎉' : totalSavings >= emergencyTarget * 0.5 ? '🌿 Хорошо' : '⚠️ Нужно копить'}
            </span>
          </div>
          <div className="emergency-bar-wrap">
            <div className="progress-bar tall">
              <div className="progress-fill purple" style={{ width: `${emergencyProgress}%` }} />
            </div>
            <div className="emergency-labels">
              <span>{formatMoney(totalSavings)}</span>
              <span>Цель: {formatMoney(emergencyTarget)}</span>
            </div>
          </div>
          {!isFundReady && (
            <div className="emergency-hint">
              {emergencyTarget - totalSavings <= 0
                ? '🎉 Подушка сформирована!'
                : `💡 До подушки безопасности осталось: ${formatMoney(emergencyTarget - totalSavings)}`}
            </div>
          )}
        </div>

        {data.savings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🌱</div>
            <div className="empty-text">Начни копить! Добавь свою первую цель.</div>
          </div>
        ) : (
          <div className="cards-grid">
            {data.savings.map(s => {
              const progress = s.targetAmount > 0 ? (s.currentAmount / s.targetAmount) * 100 : 0;
              const isComplete = progress >= 100;

              return (
                <motion.div
                  key={s.id}
                  className="card-item"
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="card-info">
                    <span className="card-title">{isComplete ? '🎉' : '📂'} {s.title}</span>
                    <span className="card-sub">
                      {s.priority === 'high' ? '🔥 Срочно' : s.priority === 'medium' ? '📌 Средне' : '🌱 Не срочно'}
                      {s.monthlyContribution ? ` · Пополнение: ${formatMoney(s.monthlyContribution)}/мес` : ''}
                    </span>
                    {s.targetDate && (
                      <span className="card-sub">До: {new Date(s.targetDate).toLocaleDateString('ru-RU')}</span>
                    )}
                  </div>
                  <div className="progress-wrap">
                    <div className="progress-bar">
                      <div className={`progress-fill ${isComplete ? 'green' : 'purple'}`} style={{ width: `${Math.min(progress, 100)}%` }} />
                    </div>
                    <span className="progress-label">{Math.round(progress)}%</span>
                  </div>
                  <span className="card-amount positive">
                    {formatMoney(s.currentAmount)} / {formatMoney(s.targetAmount)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
        <motion.button
          className="add-btn"
          onClick={() => openModal('saving')}
          whileTap={{ scale: 0.97 }}
        >
          🐷 + Добавить цель накопления
        </motion.button>
      </div>
    );
  }

  return (
    <div className="finances">
      <h2 className="section-title">
        <Wallet size={28} weight="fill" />
        Финансы
      </h2>

      {/* Summary cards */}
      <div className="finance-summary">
        <div className="summary-card income">
          <ArrowUpRight size={20} weight="bold" />
          <div>
            <span className="summary-label">Доходы</span>
            <span className="summary-value">{totalIncome.toLocaleString()} ₽</span>
          </div>
        </div>
        <div className="summary-card expense">
          <ArrowDownRight size={20} weight="bold" />
          <div>
            <span className="summary-label">Расходы</span>
            <span className="summary-value">{totalExpense.toLocaleString()} ₽</span>
          </div>
        </div>
        <div className={`summary-card balance ${balance >= 0 ? 'positive' : 'negative'}`}>
          <Wallet size={20} weight="fill" />
          <div>
            <span className="summary-label">Баланс</span>
            <span className="summary-value">{balance.toLocaleString()} ₽</span>
          </div>
        </div>
      </div>

      {/* Health bar */}
      <div className="health-bar">
        <div className="health-bar-track">
          <motion.div
            className="health-bar-fill"
            animate={{ width: `${Math.min(100, healthPercent)}%` }}
            transition={{ type: 'spring', stiffness: 60, damping: 15 }}
            style={{
              background: healthPercent <= 70
                ? 'linear-gradient(90deg, #B5EAD7, #7ec8a0)'
                : healthPercent <= 90
                  ? 'linear-gradient(90deg, #FFDFD3, #f0c0a0)'
                  : 'linear-gradient(90deg, #FDE2E4, #f0a0b0)',
            }}
          />
        </div>
        <span className="health-text">
          Здоровье кошелька: {healthPercent <= 70 ? '🌟' : healthPercent <= 90 ? '🌿' : '⚠️'} {Math.round(healthPercent)}%
        </span>
      </div>

      {/* Tabs */}
      <div className="fin-tabs">
        {([
          { id: 'operations' as const, label: '📊 Операции' },
          { id: 'debts' as const, label: `💳 Кредиты ${activeDebts.length > 0 ? `(${activeDebts.length})` : ''}` },
          { id: 'savings' as const, label: `🐷 Накопления ${data.savings.length > 0 ? `(${data.savings.length})` : ''}` },
        ]).map(t => (
          <motion.button
            key={t.id}
            className={`fin-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
            whileTap={{ scale: 0.95 }}
          >
            {t.label}
          </motion.button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          className="fin-tab-content"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'operations' && (
            <div className="finance-layout">
              {renderOperations()}
              {renderChart()}
            </div>
          )}
          {tab === 'debts' && (
            <div className="fin-section">
              <div className="fin-section-summary">
                <div className="summary-card expense">
                  <Wallet size={20} weight="fill" />
                  <div>
                    <span className="summary-label">Всего долгов</span>
                    <span className="summary-value">{totalDebt.toLocaleString()} ₽</span>
                  </div>
                </div>
                <div className="summary-card">
                  <Wallet size={20} weight="fill" />
                  <div>
                    <span className="summary-label">Активных</span>
                    <span className="summary-value">{activeDebts.length}</span>
                  </div>
                </div>
              </div>
              {renderDebts()}
            </div>
          )}
          {tab === 'savings' && (
            <div className="fin-section">
              <div className="fin-section-summary">
                <div className="summary-card positive">
                  <Wallet size={20} weight="fill" />
                  <div>
                    <span className="summary-label">Всего накоплений</span>
                    <span className="summary-value">{totalSavings.toLocaleString()} ₽</span>
                  </div>
                </div>
                <div className="summary-card">
                  <Wallet size={20} weight="fill" />
                  <div>
                    <span className="summary-label">Целей</span>
                    <span className="summary-value">{data.savings.length}</span>
                  </div>
                </div>
              </div>
              {renderSavings()}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {modal.mode && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="modal-content"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>{modal.mode === 'debt' ? '💳 Добавить кредит / обязательство' : modal.mode === 'payment' ? '💳 Внести платёж' : '🐷 Добавить цель накопления'}</h3>
                <button className="modal-close" onClick={closeModal}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                {renderModalFields()}
              </div>
              <div className="modal-actions">
                <motion.button
                  className="modal-btn cancel"
                  onClick={closeModal}
                  whileTap={{ scale: 0.95 }}
                >
                  Отмена
                </motion.button>
                <motion.button
                  className="modal-btn confirm"
                  onClick={modal.mode === 'debt' ? addDebt : modal.mode === 'payment' ? recordPayment : addSaving}
                  whileTap={{ scale: 0.95 }}
                >
                  Сохранить
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
