"use client";

import { useState, useEffect, useMemo } from "react";
import { useDuoDaysAuth } from "@/lib/duodays/auth-context";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  addDays,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  getDaysInMonth,
  parseISO,
} from "date-fns";
import { ru } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Heart,
  Sparkles,
  Calendar as CalIcon,
  Clock,
  Check,
  MessageSquare,
  Trash2,
  Flame,
  Zap,
  Star,
  Sun,
  Moon,
  Droplets,
  Wind,
  Gem,
  Crown,
  Target,
  Eye,
  type LucideIcon,
} from "lucide-react";

interface SubType {
  id: string;
  name: string;
}

interface IntimacyType {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  subs?: SubType[];
}

const types: IntimacyType[] = [
  { id: "vaginal", name: "Вагинальный", icon: Flame, color: "#ef4444", gradient: "linear-gradient(135deg, #ef4444, #f97316)" },
  { id: "anal", name: "Анальный", icon: Zap, color: "#8b5cf6", gradient: "linear-gradient(135deg, #8b5cf6, #6366f1)" },
  { id: "masturbation", name: "Мастурбация", icon: Sun, color: "#f59e0b", gradient: "linear-gradient(135deg, #f59e0b, #f97316)", subs: [
    { id: "masturbation-solo", name: "Самостоятельная" },
    { id: "masturbation-partner", name: "Помощь партнёра" },
    { id: "masturbation-toy", name: "С игрушками" },
  ]},
  { id: "oral", name: "Оральный", icon: Droplets, color: "#ec4899", gradient: "linear-gradient(135deg, #ec4899, #f43f5e)", subs: [
    { id: "cunnilingus", name: "Куннилингус" },
    { id: "minet", name: "Минет" },
    { id: "anilingus", name: "Анилингус" },
  ]},
  { id: "bdsm", name: "BDSM", icon: Gem, color: "#1e293b", gradient: "linear-gradient(135deg, #1e293b, #475569)" },
  { id: "threesome", name: "Тройничек", icon: Eye, color: "#7c3aed", gradient: "linear-gradient(135deg, #7c3aed, #6366f1)" },
  { id: "orgy", name: "Оргия", icon: Crown, color: "#dc2626", gradient: "linear-gradient(135deg, #dc2626, #b91c1c)" },
];

interface Feeling {
  id: string;
  name: string;
  color: string;
}

const feelings: Feeling[] = [
  { id: "passionate", name: "Страсть", color: "#ef4444" },
  { id: "romantic", name: "Романтика", color: "#ec4899" },
  { id: "tender", name: "Нежность", color: "#d946ef" },
  { id: "playful", name: "Игривость", color: "#f59e0b" },
  { id: "adventurous", name: "Азарт", color: "#10b981" },
  { id: "intimate", name: "Душевность", color: "#6366f1" },
  { id: "satisfied", name: "Удовлетворение", color: "#14b8a6" },
  { id: "connected", name: "Единение", color: "#0ea5e9" },
  { id: "desired", name: "Желание", color: "#f43f5e" },
  { id: "loved", name: "Любовь", color: "#be123c" },
  { id: "relaxed", name: "Расслабление", color: "#8b5cf6" },
  { id: "excited", name: "Возбуждение", color: "#dc2626" },
  { id: "guilty", name: "Вина", color: "#78716c" },
  { id: "disappointed", name: "Разочарование", color: "#a8a29e" },
  { id: "awkward", name: "Неловкость", color: "#d6d3d1" },
  { id: "empty", name: "Пустота", color: "#57534e" },
];

interface Status {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
}

const statuses: Status[] = [
  { id: "planned", name: "Запланировано", icon: CalIcon, color: "#f59e0b" },
  { id: "occurred", name: "Произошло", icon: Check, color: "#10b981" },
  { id: "cancelled", name: "Отменено", icon: X, color: "#ef4444" },
];

interface IntimacyRecord {
  id: string;
  userId: string;
  date: string;
  type: string;
  feelings: string[];
  status: string;
  comment?: string;
  createdAt: string;
}

interface ResolvedType {
  parent: IntimacyType;
  sub: SubType | null;
  color: string;
  gradient: string;
  icon: LucideIcon;
  name: string;
}

function findType(typeId: string): ResolvedType {
  for (const t of types) {
    if (t.id === typeId) return { parent: t, sub: null, color: t.color, gradient: t.gradient, icon: t.icon, name: t.name };
    if (t.subs) {
      const sub = t.subs.find((s) => s.id === typeId);
      if (sub) return { parent: t, sub, color: t.color, gradient: t.gradient, icon: t.icon, name: `${t.name} · ${sub.name}` };
    }
  }
  return { parent: types[0], sub: null, color: types[0].color, gradient: types[0].gradient, icon: types[0].icon, name: types[0].name };
}

const maxEntries: Record<string, number> = { free: 1, premium: 5, forever: 10 };

interface ViewRecordModalProps {
  record: IntimacyRecord;
  onClose: () => void;
}

function ViewRecordModal({ record, onClose }: ViewRecordModalProps) {
  const ft = findType(record.type);
  const Icon = ft.icon;
  const statusObj = statuses.find((s) => s.id === record.status);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="crd" style={{ padding: "28px", maxWidth: "420px", width: "100%" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Запись</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X className="w-5 h-5" /></button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: ft.gradient, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon className="w-6 h-6" style={{ color: "white" }} />
          </div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 700 }}>{ft.name}</div>
            {statusObj && <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}><statusObj.icon className="w-3 h-3" style={{ color: statusObj.color }} /><span style={{ fontSize: "12px", color: statusObj.color, fontWeight: 600 }}>{statusObj.name}</span></div>}
          </div>
        </div>

        {record.feelings?.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Чувства и эмоции</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {record.feelings.map((f) => { const feel = feelings.find((x) => x.id === f); return <span key={f} style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "6px", background: feel?.color + "18", color: feel?.color, fontWeight: 500 }}>{feel?.name}</span>; })}
            </div>
          </div>
        )}

        {record.comment && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Комментарий</div>
            <div style={{ padding: "12px", borderRadius: "10px", background: "var(--bg-elevated)", border: "1px solid var(--border)", fontSize: "13px", lineHeight: 1.6 }}>{record.comment}</div>
          </div>
        )}

        <div style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center" }}>{format(parseISO(record.date), "d MMMM yyyy", { locale: ru })}</div>
      </div>
    </div>
  );
}

interface AddModalProps {
  onClose: () => void;
  onAdd: (type: string, feelings: string[], status: string, comment: string, dates: string[]) => void;
  dates: string[];
  canPlan: (d: Date) => boolean;
  canOccur: (d: Date) => boolean;
  maxEntries: number;
  getRecords: (d: Date) => IntimacyRecord[];
}

function AddModal({ onClose, onAdd, dates, canPlan, canOccur, maxEntries: maxEntriesForTier }: AddModalProps) {
  const [selType, setSelType] = useState<string | null>(null);
  const [selSub, setSelSub] = useState<string | null>(null);
  const [selFeelings, setSelFeelings] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [step, setStep] = useState(1);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const allCanPlan = dates.every((d) => d >= todayStr);
  const allCanOccur = dates.every((d) => d <= todayStr);

  useEffect(() => {
    if (allCanPlan && !allCanOccur) setStatus("planned");
    else if (allCanOccur && !allCanPlan) setStatus("occurred");
    else setStatus(null);
  }, [dates, allCanPlan, allCanOccur]);

  function toggleFeeling(id: string) {
    setSelFeelings((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  function handleSubmit() {
    if (!selType || !status) return;
    const typeToSave = selSub || selType;
    onAdd(typeToSave, selFeelings, status, comment, dates);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="crd" style={{ position: "relative", width: "100%", maxWidth: "440px", maxHeight: "85vh", overflowY: "auto", padding: "28px" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-drag-handle" />
        <button onClick={onClose} style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px", zIndex: 1 }}><X className="w-5 h-5" /></button>

        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", boxShadow: "0 4px 20px rgba(99,102,241,0.25)" }}>
            <Sparkles className="w-5 h-5" style={{ color: "white" }} />
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Новая запись</h3>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>{dates.length === 1 ? format(parseISO(dates[0]), "d MMMM", { locale: ru }) : `${dates.length} дат выбрано`}</p>
        </div>

        {step === 1 && (
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Статус</label>
            <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
              {statuses.map((s) => {
                const disabled = (s.id === "planned" && !allCanPlan) || (s.id === "occurred" && !allCanOccur);
                return (
                  <button key={s.id} onClick={() => !disabled && setStatus(s.id)} disabled={disabled} style={{ flex: 1, padding: "14px", borderRadius: "12px", border: status === s.id ? "2px solid " + s.color : "1px solid var(--border)", background: status === s.id ? s.color + "12" : "var(--bg-elevated)", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1, textAlign: "center", transition: "all 0.2s", fontFamily: "inherit" }}>
                    <s.icon className="w-5 h-5" style={{ color: status === s.id ? s.color : "var(--text-muted)", margin: "0 auto 6px" }} />
                    <div style={{ fontSize: "12px", fontWeight: 600, color: status === s.id ? s.color : "var(--text)" }}>{s.name}</div>
                    {disabled && <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>{s.id === "planned" ? "Только сегодня/будущее" : "Только сегодня/прошлое"}</div>}
                  </button>
                );
              })}
            </div>
            {status && (
              <button onClick={() => setStep(2)} className="btn-p btn-pill" style={{ width: "100%", padding: "12px" }}>Далее →</button>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Тип близости</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginBottom: "16px" }}>
              {types.map((t) => {
                const Icon = t.icon;
                const isActive = selType === t.id;
                return (
                  <button key={t.id} onClick={() => { setSelType(t.id); setSelSub(null); }} style={{ padding: "12px 6px", borderRadius: "10px", border: isActive ? "2px solid " + t.color : "1px solid var(--border)", background: isActive ? t.gradient : "var(--bg-elevated)", cursor: "pointer", textAlign: "center", transition: "all 0.2s", fontFamily: "inherit" }}>
                    <Icon className="w-4 h-4" style={{ color: isActive ? "white" : t.color, margin: "0 auto 4px" }} />
                    <div style={{ fontSize: "10px", fontWeight: 600, color: isActive ? "white" : "var(--text)" }}>{t.name}</div>
                  </button>
                );
              })}
            </div>

            {selType && types.find((t) => t.id === selType)?.subs && (
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Вид</label>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {types.find((t) => t.id === selType)!.subs!.map((s) => (
                    <button key={s.id} onClick={() => setSelSub(s.id)} style={{ padding: "8px 14px", borderRadius: "8px", border: selSub === s.id ? "2px solid " + types.find((t) => t.id === selType)!.color : "1px solid var(--border)", background: selSub === s.id ? types.find((t) => t.id === selType)!.gradient : "var(--bg-elevated)", cursor: "pointer", fontSize: "12px", fontWeight: 600, color: selSub === s.id ? "white" : "var(--text)", fontFamily: "inherit", transition: "all 0.2s" }}>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setStep(1)} className="btn-o btn-pill" style={{ flex: 1, padding: "10px" }}>← Назад</button>
              <button onClick={() => selType && setStep(3)} disabled={!selType} className="btn-p btn-pill" style={{ flex: 1, padding: "10px", opacity: selType ? 1 : 0.5 }}>Далее →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Чувства и эмоции</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
              {feelings.map((f) => (
                <button key={f.id} onClick={() => toggleFeeling(f.id)} style={{ padding: "6px 12px", borderRadius: "999px", fontSize: "11px", fontWeight: 500, border: "none", cursor: "pointer", background: selFeelings.includes(f.id) ? f.color : "var(--bg-elevated)", color: selFeelings.includes(f.id) ? "white" : "var(--text-muted)", transition: "all 0.2s", fontFamily: "inherit" }}>{f.name}</button>
              ))}
            </div>

            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Комментарий</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="inp inp-noicon" placeholder="Опишите подробности..." rows={3} style={{ resize: "vertical", marginBottom: "20px", minHeight: "60px" }} />

            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setStep(2)} className="btn-o btn-pill" style={{ flex: 1, padding: "10px" }}>← Назад</button>
              <button onClick={handleSubmit} className="btn-p btn-pill" style={{ flex: 1, padding: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <Check className="w-4 h-4" /> Сохранить
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DuoDaysCalendar() {
  const { currentUser } = useDuoDaysAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [records, setRecords] = useState<IntimacyRecord[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [viewRecord, setViewRecord] = useState<IntimacyRecord | null>(null);
  const [dayModal, setDayModal] = useState(false);
  const [currentTariff, setCurrentTariff] = useState("free");
  const [multiSelect, setMultiSelect] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "intimacy"), where("userId", "==", currentUser.uid));
    return onSnapshot(q, (snap) => setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() } as IntimacyRecord))));
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    getDoc(doc(db, "userSettings", currentUser.uid)).then((snap) => {
      if (snap.exists()) setCurrentTariff((snap.data() as { tariff?: string }).tariff || "free");
    });
  }, [currentUser]);

  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      days.push(addDays(calStart, i));
    }
    return days;
  }, [currentMonth, calStart]);

  const getRecords = (d: Date) => records.filter((r) => r.date === format(d, "yyyy-MM-dd"));
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  function canPlan(d: Date) {
    const dateStr = format(d, "yyyy-MM-dd");
    return dateStr >= todayStr;
  }

  function canOccur(d: Date) {
    const dateStr = format(d, "yyyy-MM-dd");
    return dateStr <= todayStr;
  }

  function toggleMultiDate(d: Date) {
    const dateStr = format(d, "yyyy-MM-dd");
    setSelectedDates((p) => (p.includes(dateStr) ? p.filter((x) => x !== dateStr) : [...p, dateStr]));
  }

  async function addRecord(type: string, selectedFeelings: string[], status: string, comment: string, dates: string[]) {
    if (!currentUser) return;
    const entryLimit = maxEntries[currentTariff] || 1;
    for (const dateStr of dates) {
      const dayRecords = getRecords(parseISO(dateStr));
      if (dayRecords.length >= entryLimit) continue;
      await addDoc(collection(db, "intimacy"), {
        userId: currentUser.uid,
        date: dateStr,
        type,
        feelings: selectedFeelings,
        status,
        comment,
        createdAt: new Date().toISOString(),
      });
    }
    setShowModal(false);
    setMultiSelect(false);
    setSelectedDates([]);
  }

  function getRecordDates() {
    return multiSelect && selectedDates.length > 0 ? selectedDates : selectedDay ? [format(selectedDay, "yyyy-MM-dd")] : [];
  }

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "4px" }}>Календарь</h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Отслеживайте интимные моменты</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <button onClick={() => setCurrentMonth((p) => subMonths(p, 1))} className="thm" style={{ width: "40px", height: "40px" }}><ChevronLeft className="w-5 h-5" /></button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "20px", fontWeight: 700 }}>{format(currentMonth, "LLLL yyyy", { locale: ru })}</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{getDaysInMonth(currentMonth)} дней</div>
        </div>
        <button onClick={() => setCurrentMonth((p) => addMonths(p, 1))} className="thm" style={{ width: "40px", height: "40px" }}><ChevronRight className="w-5 h-5" /></button>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
        <button onClick={() => { setMultiSelect((p) => !p); setSelectedDates([]); }} style={{ padding: "8px 16px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, border: multiSelect ? "2px solid var(--color-primary)" : "1px solid var(--border)", background: multiSelect ? "var(--glow-primary)" : "var(--bg-card)", color: multiSelect ? "var(--color-primary)" : "var(--text-muted)", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "6px" }}>
        <CalIcon className="w-3.5 h-3.5" /> {multiSelect ? `Выбрано: ${selectedDates.length}` : "Выбрать даты"}
      </button>
      </div>

      <div className="calendar-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "24px" }}>
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", padding: "8px 0" }}>{d}</div>
        ))}
        {calendarDays.map((day, i) => {
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          if (!isCurrentMonth) return <div key={i} />;
          const recs = getRecords(day);
          const sel = selectedDay && isSameDay(day, selectedDay);
          const todayMark = isToday(day);
          const isMulti = selectedDates.includes(format(day, "yyyy-MM-dd"));
          const planned = recs.filter((r) => r.status === "planned").length;
          const occurred = recs.filter((r) => r.status === "occurred").length;
          return (
            <button key={i} onClick={() => {
              if (multiSelect) { toggleMultiDate(day); return; }
              setSelectedDay(day);
              setDayModal(true);
            }} style={{ position: "relative", padding: "6px 4px", minHeight: "64px", borderRadius: "10px", border: isMulti ? "2px solid var(--color-primary)" : sel ? "1px solid color-mix(in srgb, var(--color-primary) 40%, transparent)" : todayMark ? "1px solid color-mix(in srgb, var(--color-secondary) 40%, transparent)" : "1px solid transparent", background: isMulti ? "var(--glow-primary)" : sel ? "color-mix(in srgb, var(--color-primary) 15%, transparent)" : todayMark ? "color-mix(in srgb, var(--color-secondary) 10%, transparent)" : "transparent", cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: todayMark ? "var(--color-secondary)" : "var(--text)", marginBottom: "2px" }}>{format(day, "d")}</div>
            {recs.length > 0 && (
              <div style={{ display: "flex", gap: "2px", flexWrap: "wrap", justifyContent: "center" }}>
                {planned > 0 && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f59e0b" }} />}
                {occurred > 0 && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981" }} />}
                {recs.length > 1 && <div style={{ fontSize: "9px", color: "var(--text-muted)", lineHeight: 1 }}>{recs.length}</div>}
              </div>
            )}
            {recs.length === 0 && multiSelect && isMulti && (
              <Check className="w-3 h-3" style={{ color: "var(--color-primary)" }} />
            )}
          </button>
          );
        })}
      </div>

      {dayModal && selectedDay && (
        <div className="modal-overlay" onClick={() => setDayModal(false)}>
          <div className="crd" style={{ padding: "24px", maxWidth: "440px", width: "100%", maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 700 }}>{format(selectedDay, "d MMMM, EEEE", { locale: ru })}</h3>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{getRecords(selectedDay).length} {getRecords(selectedDay).length === 1 ? "запись" : "записей"}</p>
              </div>
              <button onClick={() => setDayModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px", flexShrink: 0 }}><X className="w-5 h-5" /></button>
            </div>

            {getRecords(selectedDay).length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <Heart className="w-10 h-10" style={{ margin: "0 auto 12px", opacity: 0.3, color: "var(--text-muted)" }} />
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>Нет записей на этот день</p>
                <button onClick={() => { setShowModal(true); setDayModal(false); }} className="btn-p btn-pill" style={{ padding: "10px 20px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <Plus className="w-4 h-4" /> Добавить первую запись
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {getRecords(selectedDay).map((r) => {
                  const ft = findType(r.type);
                  const Icon = ft.icon;
                  const statusObj = statuses.find((s) => s.id === r.status);
                  return (
                    <div key={r.id} onClick={() => { setViewRecord(r); setDayModal(false); }} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px", borderRadius: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border)", cursor: "pointer", transition: "all 0.2s" }}>
                      <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: ft.gradient, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon className="w-5 h-5" style={{ color: "white" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "14px", fontWeight: 600 }}>{ft.name}</span>
                          {statusObj && <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: statusObj.color + "18", color: statusObj.color, fontWeight: 600 }}>{statusObj.name}</span>}
                        </div>
                        {r.feelings?.length > 0 && (
                          <div style={{ display: "flex", gap: "4px", marginTop: "4px", flexWrap: "wrap" }}>
                            {r.feelings.slice(0, 3).map((f) => { const feel = feelings.find((x) => x.id === f); return <span key={f} style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: feel?.color + "18", color: feel?.color }}>{feel?.name}</span>; })}
                            {r.feelings.length > 3 && <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>+{r.feelings.length - 3}</span>}
                          </div>
                        )}
                        {r.comment && <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><MessageSquare className="w-3 h-3" style={{ display: "inline", marginRight: "4px" }} />{r.comment}</div>}
                      </div>
                    </div>
                  );
                })}

                {getRecords(selectedDay).length < (maxEntries[currentTariff] || 1) && (
                  <button onClick={() => { setShowModal(true); setDayModal(false); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "12px", borderRadius: "10px", border: "1px dashed var(--border)", background: "transparent", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "var(--text-muted)", fontFamily: "inherit", transition: "all 0.2s" }}>
                    <Plus className="w-4 h-4" /> Добавить ещё
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {multiSelect && selectedDates.length > 0 && (
        <div className="multi-select-bar" style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 16px calc(12px + env(safe-area-inset-bottom, 0px))", background: "var(--bg-card)", borderTop: "1px solid var(--border)", zIndex: 150, display: "flex", justifyContent: "center", backdropFilter: "blur(12px)" }}>
          <button onClick={() => setShowModal(true)} className="btn-p btn-pill" style={{ padding: "12px 24px", fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "8px", width: "100%", maxWidth: "400px", justifyContent: "center" }}>
            <Plus className="w-4 h-4" /> Добавить запись на {selectedDates.length} {selectedDates.length === 1 ? "день" : "дней"}
          </button>
        </div>
      )}

      {viewRecord && <ViewRecordModal record={viewRecord} onClose={() => setViewRecord(null)} />}

      {showModal && <AddModal onClose={() => setShowModal(false)} onAdd={addRecord} dates={getRecordDates()} canPlan={canPlan} canOccur={canOccur} maxEntries={maxEntries[currentTariff] || 1} getRecords={getRecords} />}
    </div>
  );
}
