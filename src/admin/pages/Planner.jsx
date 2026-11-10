import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Sun, CalendarRange, Calendar, CalendarClock, Repeat, BarChart3 } from "lucide-react";

import LifeGate from "../life/LifeGate";
import { useHabits } from "../planner/api";
import { addDays, today } from "../planner/dates";
import { TodayView, WeekView, MonthView, YearView } from "../planner/Views";
import { HabitsTab, HabitEditor } from "../planner/Habits";
import Insights from "../planner/Insights";

/* ========================================
   PLANNER — today, week, month and year
   plans, habits on your own schedule, and
   insights with exportable reports.
========================================= */

const TABS = [
  { id: "today", label: "Today", icon: Sun },
  { id: "week", label: "Week", icon: CalendarRange },
  { id: "month", label: "Month", icon: Calendar },
  { id: "year", label: "Year", icon: CalendarClock },
  { id: "habits", label: "Habits", icon: Repeat },
  { id: "insights", label: "Insights", icon: BarChart3 },
];

const remembered = () => {
  try {
    return localStorage.getItem("planner:tab") || "today";
  } catch {
    return "today";
  }
};

function PlannerBody() {
  const [tab, setTabState] = useState(remembered);
  const [monthAt, setMonthAt] = useState(null);
  const [editingHabit, setEditingHabit] = useState(null);
  const t = today();
  const habitStore = useHabits(addDays(t, -31), t);

  const setTab = (id) => {
    setTabState(id);
    try {
      localStorage.setItem("planner:tab", id);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-heading inline-flex items-center gap-3">
            <CalendarDays size={28} /> Planner
          </h1>
          <p className="text-body mt-2">Plan the day, the week, the year — and build the habits that get you there.</p>
        </div>
      </section>

      <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 print:hidden" role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`relative inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-small transition-colors ${tab === id ? "text-background" : "text-secondary hover:text-primary"}`}>
            {tab === id && <motion.span layoutId="planner-tab" className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <Icon size={15} className="relative" />
            <span className="relative">{label}</span>
          </button>
        ))}
      </nav>

      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        {tab === "today" && <TodayView habitStore={habitStore} onEditHabit={setEditingHabit} />}
        {tab === "week" && <WeekView />}
        {tab === "month" && <MonthView key={monthAt || "now"} initial={monthAt} />}
        {tab === "year" && (
          <YearView
            onOpenMonth={(d) => {
              setMonthAt(d);
              setTab("month");
            }}
          />
        )}
        {tab === "habits" && <HabitsTab store={habitStore} />}
        {tab === "insights" && <Insights />}
      </motion.div>

      {editingHabit && (
        <HabitEditor
          initial={editingHabit}
          onClose={() => setEditingHabit(null)}
          onSaved={() => {
            setEditingHabit(null);
            habitStore.reload();
          }}
        />
      )}
    </div>
  );
}

function Planner() {
  return (
    <LifeGate>
      <PlannerBody />
    </LifeGate>
  );
}

export default Planner;
