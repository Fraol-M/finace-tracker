import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../api/client';
import {
  BudgetBills,
  BudgetCalendarDay,
  BudgetPlan,
  BudgetRecommendation
} from '../types';
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Loader2,
  Plane,
  RefreshCw,
  Sparkles,
  TrendingUp,
  X
} from 'lucide-react';

type BillsInput = {
  rent: string;
  utilities: string;
  transportation: string;
  food: string;
  insurance: string;
  subscriptions: string;
  otherBills: string;
};

type BudgetSummary = Pick<
  BudgetRecommendation,
  'totalFixedExpenses' | 'remainingAfterBills' | 'remainingAfterSavings' | 'remainingAfterVacation' | 'dailySpendingLimit'
>;

const emptyBills: BillsInput = {
  rent: '',
  utilities: '',
  transportation: '',
  food: '',
  insurance: '',
  subscriptions: '',
  otherBills: ''
};

const parseMoney = (value: string) => {
  const num = parseFloat(value);
  return Number.isFinite(num) ? Math.max(0, num) : 0;
};

const toBillsPayload = (bills: BillsInput): BudgetBills => ({
  rent: parseMoney(bills.rent),
  utilities: parseMoney(bills.utilities),
  transportation: parseMoney(bills.transportation),
  food: parseMoney(bills.food),
  insurance: parseMoney(bills.insurance),
  subscriptions: parseMoney(bills.subscriptions),
  otherBills: parseMoney(bills.otherBills)
});

const formatMonthLabel = (month: string) => {
  if (!month) return '';
  const [year, monthValue] = month.split('-');
  if (!year || !monthValue) return month;
  const date = new Date(parseInt(year), parseInt(monthValue) - 1, 1);
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
};

const getTypeMeta = (type?: string) => {
  switch (type) {
    case 'payday':
      return { label: 'Payday', icon: DollarSign, tone: 'text-emerald-300', surface: 'bg-emerald-500/10 border-emerald-500/20' };
    case 'bill-day':
      return { label: 'Bill day', icon: Calendar, tone: 'text-amber-300', surface: 'bg-amber-500/10 border-amber-500/20' };
    case 'savings-day':
      return { label: 'Savings day', icon: TrendingUp, tone: 'text-teal-300', surface: 'bg-teal-500/10 border-teal-500/20' };
    case 'vacation-day':
      return { label: 'Vacation day', icon: Plane, tone: 'text-sky-300', surface: 'bg-sky-500/10 border-sky-500/20' };
    case 'warning':
      return { label: 'Warning', icon: AlertTriangle, tone: 'text-rose-300', surface: 'bg-rose-500/10 border-rose-500/20' };
    case 'milestone':
      return { label: 'Milestone', icon: Sparkles, tone: 'text-violet-300', surface: 'bg-violet-500/10 border-violet-500/20' };
    default:
      return { label: 'On track', icon: Check, tone: 'text-slate-300', surface: 'bg-white/5 border-white/10' };
  }
};

export default function BudgetPlanner() {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [mode, setMode] = useState<'overview' | 'wizard'>('overview');
  const [step, setStep] = useState(1);

  const [month, setMonth] = useState(defaultMonth);
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [bills, setBills] = useState<BillsInput>(emptyBills);
  const [savingsGoal, setSavingsGoal] = useState('');
  const [hasVacation, setHasVacation] = useState(false);
  const [vacationBudget, setVacationBudget] = useState('');

  const [plan, setPlan] = useState<BudgetPlan | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<BudgetRecommendation | null>(null);
  const [calendar, setCalendar] = useState<BudgetCalendarDay[] | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [selectedDay, setSelectedDay] = useState<BudgetCalendarDay | null>(null);

  const totalBills = useMemo(() => {
    const payload = toBillsPayload(bills);
    return Object.values(payload).reduce((sum, val) => sum + val, 0);
  }, [bills]);

  const monthLabel = useMemo(() => formatMonthLabel(month), [month]);

  const previewSummary = useMemo(() => {
    const income = parseMoney(monthlyIncome);
    const savings = parseMoney(savingsGoal);
    const vacation = hasVacation ? parseMoney(vacationBudget) : 0;
    const remainingAfterBills = income - totalBills;
    const remainingAfterSavings = remainingAfterBills - savings;
    const remainingAfterVacation = remainingAfterSavings - vacation;
    const daysInMonth = month ? new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0).getDate() : 30;
    const dailySpendingLimit = daysInMonth > 0 ? Math.max(0, remainingAfterVacation / daysInMonth) : 0;

    return {
      totalFixedExpenses: totalBills,
      remainingAfterBills,
      remainingAfterSavings,
      remainingAfterVacation,
      dailySpendingLimit,
      daysInMonth
    };
  }, [monthlyIncome, savingsGoal, vacationBudget, hasVacation, totalBills, month]);

  const planSummary = useMemo((): BudgetSummary | null => {
    if (!plan) return null;
    const billsTotal = Object.values(plan.bills).reduce((sum, val) => sum + val, 0);
    const remainingAfterBills = plan.monthlyIncome - billsTotal;
    const remainingAfterSavings = remainingAfterBills - plan.savingsGoal;
    const remainingAfterVacation = remainingAfterSavings - (plan.hasVacation ? plan.vacationBudget : 0);
    const [yearStr, monthStr] = plan.month.split('-');
    const daysInMonth = new Date(parseInt(yearStr), parseInt(monthStr), 0).getDate();
    const dailySpendingLimit = daysInMonth > 0 ? Math.max(0, remainingAfterVacation / daysInMonth) : 0;

    return {
      totalFixedExpenses: billsTotal,
      remainingAfterBills,
      remainingAfterSavings,
      remainingAfterVacation,
      dailySpendingLimit
    };
  }, [plan]);

  const calendarMap = useMemo(() => {
    const map: Record<string, BudgetCalendarDay> = {};
    if (!calendar) return map;
    calendar.forEach(day => {
      map[day.date] = day;
    });
    return map;
  }, [calendar]);

  const calendarCells = useMemo(() => {
    if (!month) return [] as (number | null)[];
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr);
    const monthIndex = parseInt(monthStr) - 1;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const firstDay = new Date(year, monthIndex, 1).getDay();

    const cells: (number | null)[] = Array(firstDay).fill(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(day);
    }

    const totalCells = Math.ceil(cells.length / 7) * 7;
    while (cells.length < totalCells) {
      cells.push(null);
    }

    return cells;
  }, [month]);

  const loadPlan = async (targetMonth: string) => {
    if (!targetMonth) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/budget?month=${targetMonth}`);
      setPlan(data.budgetPlan);
      setAiRecommendations(data.aiRecommendations || null);
      setCalendar(data.calendar || null);
      setMode('overview');
    } catch (err: any) {
      const message = err?.message || 'Could not load budget plan';
      if (message.toLowerCase().includes('not found')) {
        setPlan(null);
        setAiRecommendations(null);
        setCalendar(null);
        setMode('wizard');
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (mode === 'overview') {
      loadPlan(month);
    }
  }, [month, mode]);

  const resetForm = (targetMonth?: string) => {
    setMonthlyIncome('');
    setBills(emptyBills);
    setSavingsGoal('');
    setHasVacation(false);
    setVacationBudget('');
    if (targetMonth) {
      setMonth(targetMonth);
    }
  };

  const applyPlanToForm = (planData: BudgetPlan) => {
    setMonth(planData.month);
    setMonthlyIncome(planData.monthlyIncome.toString());
    setBills({
      rent: planData.bills.rent.toString(),
      utilities: planData.bills.utilities.toString(),
      transportation: planData.bills.transportation.toString(),
      food: planData.bills.food.toString(),
      insurance: planData.bills.insurance.toString(),
      subscriptions: planData.bills.subscriptions.toString(),
      otherBills: planData.bills.otherBills.toString()
    });
    setSavingsGoal(planData.savingsGoal.toString());
    setHasVacation(planData.hasVacation);
    setVacationBudget(planData.vacationBudget.toString());
  };

  const startNewPlan = () => {
    setMode('wizard');
    setStep(1);
    setFormError('');
    resetForm(month);
  };

  const startEditPlan = () => {
    if (!plan) return;
    setMode('wizard');
    setStep(1);
    setFormError('');
    applyPlanToForm(plan);
  };

  const validateStep1 = () => {
    if (!month) return 'Select a month to continue.';
    if (parseMoney(monthlyIncome) <= 0) return 'Enter a monthly income greater than 0.';
    return '';
  };

  const validateStep3 = () => {
    if (hasVacation && parseMoney(vacationBudget) <= 0) {
      return 'Enter a vacation budget or turn off vacation.';
    }
    return '';
  };

  const handleNext = () => {
    if (step === 1) {
      const errorText = validateStep1();
      setFormError(errorText);
      if (errorText) return;
    }
    if (step === 3) {
      const errorText = validateStep3();
      setFormError(errorText);
      if (errorText) return;
    }
    setFormError('');
    setStep(prev => Math.min(4, prev + 1));
  };

  const handleBack = () => {
    setFormError('');
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleGeneratePlan = async () => {
    const errorText = validateStep1() || validateStep3();
    setFormError(errorText);
    if (errorText) return;

    setIsSaving(true);
    setError('');
    try {
      const payload = {
        month,
        monthlyIncome: parseMoney(monthlyIncome),
        bills: toBillsPayload(bills),
        savingsGoal: parseMoney(savingsGoal),
        hasVacation,
        vacationBudget: parseMoney(vacationBudget)
      };

      const data = await apiFetch('/budget/create', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setPlan(data.budgetPlan);
      setAiRecommendations(data.aiRecommendations || null);
      setCalendar(data.calendar || null);
      setStep(4);
      setMode('wizard');
    } catch (err: any) {
      setError(err?.message || 'Could not generate plan');
    } finally {
      setIsSaving(false);
    }
  };

  const renderSummary = (source?: BudgetSummary | null) => {
    const summary = source || aiRecommendations || planSummary || previewSummary;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
          <p className="text-[11px] uppercase font-mono text-[#bbcabf]">Fixed expenses</p>
          <p className="text-xl font-semibold text-white mt-2">${summary.totalFixedExpenses.toFixed(2)}</p>
        </div>
        <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
          <p className="text-[11px] uppercase font-mono text-[#bbcabf]">After bills</p>
          <p className="text-xl font-semibold text-white mt-2">${summary.remainingAfterBills.toFixed(2)}</p>
        </div>
        <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
          <p className="text-[11px] uppercase font-mono text-[#bbcabf]">After savings</p>
          <p className="text-xl font-semibold text-white mt-2">${summary.remainingAfterSavings.toFixed(2)}</p>
        </div>
        <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
          <p className="text-[11px] uppercase font-mono text-[#bbcabf]">After vacation</p>
          <p className="text-xl font-semibold text-white mt-2">${summary.remainingAfterVacation.toFixed(2)}</p>
        </div>
        <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
          <p className="text-[11px] uppercase font-mono text-[#bbcabf]">Daily limit</p>
          <p className="text-xl font-semibold text-[#4edea3] mt-2">${summary.dailySpendingLimit.toFixed(2)}</p>
        </div>
      </div>
    );
  };

  const renderInsights = () => {
    const insights = aiRecommendations?.insights || [];
    if (insights.length === 0) return null;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs uppercase font-mono text-[#bbcabf]">
          <Sparkles className="w-4 h-4 text-[#fdcb6e]" />
          AI insights
        </div>
        <div className="space-y-2">
          {insights.map((insight, index) => (
            <div key={index} className="flex gap-2 items-start text-sm text-[#e5e2e1]">
              <span className="mt-0.5 text-[#4edea3]">-</span>
              <p>{insight}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCalendar = () => {
    if (!calendar || calendar.length === 0) {
      return (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 text-sm text-[#bbcabf]">
          Calendar data will appear after the plan is generated.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-white">{monthLabel} calendar</p>
            <p className="text-xs text-[#bbcabf]">Tap a day for details.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#bbcabf]">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            On track
            <div className="w-2 h-2 rounded-full bg-rose-400 ml-4"></div>
            Warning
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-[10px] uppercase font-mono text-[#bbcabf]">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarCells.map((cell, index) => {
            if (!cell) {
              return <div key={`empty-${index}`} className="h-28 rounded-xl bg-white/[0.02] border border-white/5" />;
            }

            const dateKey = `${month}-${String(cell).padStart(2, '0')}`;
            const dayData = calendarMap[dateKey];
            const meta = getTypeMeta(dayData?.type);
            const Icon = meta.icon;

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => dayData && setSelectedDay(dayData)}
                className={`h-28 rounded-xl border text-left p-2 flex flex-col justify-between transition-all ${dayData ? 'hover:border-[#4edea3]/50 hover:bg-[#4edea3]/5' : 'opacity-60'} ${meta.surface}`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs text-white font-semibold">{cell}</span>
                  <Icon className={`w-4 h-4 ${meta.tone}`} />
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] text-white">${dayData ? dayData.availableToSpend.toFixed(0) : '--'}</p>
                  <p className="text-[10px] text-[#bbcabf]">Balance ${dayData ? dayData.runningBalance.toFixed(0) : '--'}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8" style={{ fontFamily: 'var(--font-budget)' }}>
      <section
        className="relative overflow-hidden rounded-2xl border border-white/10 p-6 md:p-8 budget-rise"
        style={{
          background:
            'radial-gradient(circle at top, rgba(78,222,163,0.18), transparent 55%), linear-gradient(120deg, rgba(25,32,29,0.95), rgba(18,18,18,0.95))'
        }}
      >
        <div className="absolute -right-16 -top-20 h-40 w-40 rounded-full bg-[#4edea3]/10 blur-3xl"></div>
        <div className="absolute left-10 bottom-[-90px] h-40 w-40 rounded-full bg-[#fdcb6e]/10 blur-3xl"></div>

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-xs uppercase font-mono tracking-widest text-[#bbcabf]">Smart monthly budget planner</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-white mt-2">Build an AI-guided spending calendar</h2>
            <p className="text-sm text-[#bbcabf] mt-3 max-w-2xl">
              Combine your fixed bills, savings goals, and travel plans into a daily budget you can track.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={startNewPlan}
              className="px-4 py-2 rounded-lg bg-[#4edea3] text-[#003824] text-xs font-mono uppercase tracking-widest font-bold hover:bg-[#6ffbbe] transition-colors"
            >
              New plan
            </button>
            {plan && (
              <button
                onClick={startEditPlan}
                className="px-4 py-2 rounded-lg border border-[#4edea3]/30 text-[#4edea3] text-xs font-mono uppercase tracking-widest hover:bg-[#4edea3]/10 transition-colors"
              >
                Edit plan
              </button>
            )}
          </div>
        </div>
      </section>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-200 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {isLoading && mode === 'overview' ? (
        <div className="flex items-center gap-2 text-[#bbcabf]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading budget plan...
        </div>
      ) : null}

      {mode === 'wizard' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono border ${step >= idx ? 'bg-[#4edea3]/20 text-[#4edea3] border-[#4edea3]/40' : 'bg-white/5 text-[#bbcabf] border-white/10'}`}
                  >
                    {idx}
                  </div>
                  {idx < 4 && <div className="w-8 h-[1px] bg-white/10" />}
                </div>
              ))}
            </div>
            <button
              onClick={() => setMode('overview')}
              className="text-xs text-[#bbcabf] hover:text-white"
            >
              Exit wizard
            </button>
          </div>

          {formError && (
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-xl px-4 py-3 text-sm">
              {formError}
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#1b1b1b] border border-white/10 rounded-2xl p-6 space-y-5">
                <div>
                  <p className="text-xs uppercase font-mono text-[#bbcabf]">Step 1</p>
                  <h3 className="text-xl font-semibold text-white mt-1">Monthly income</h3>
                  <p className="text-sm text-[#bbcabf] mt-2">Select the planning month and total income.</p>
                </div>

                <div className="space-y-4">
                  <label className="block text-xs uppercase font-mono text-[#bbcabf]">
                    Month
                    <input
                      type="month"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="mt-2 w-full bg-[#131313] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </label>

                  <label className="block text-xs uppercase font-mono text-[#bbcabf]">
                    Monthly income
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(e.target.value)}
                      className="mt-2 w-full bg-[#131313] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                      placeholder="6500"
                    />
                  </label>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#1d2220] to-[#171717] border border-white/10 rounded-2xl p-6 space-y-4">
                <p className="text-xs uppercase font-mono text-[#bbcabf]">Preview</p>
                <div className="text-sm text-[#bbcabf]">Budgeting for {monthLabel || 'this month'}.</div>
                <div className="text-3xl font-semibold text-white">${parseMoney(monthlyIncome).toLocaleString()}</div>
                <p className="text-xs text-[#bbcabf]">Income before fixed expenses.</p>
                <div className="mt-6 flex items-center gap-2 text-xs text-[#bbcabf]">
                  <Sparkles className="w-4 h-4 text-[#fdcb6e]" />
                  AI summary appears after generation.
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-[#1b1b1b] border border-white/10 rounded-2xl p-6 space-y-6">
              <div>
                <p className="text-xs uppercase font-mono text-[#bbcabf]">Step 2</p>
                <h3 className="text-xl font-semibold text-white mt-1">Fixed bills and expenses</h3>
                <p className="text-sm text-[#bbcabf] mt-2">Capture your recurring expenses for the month.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {([
                  { key: 'rent', label: 'Rent' },
                  { key: 'utilities', label: 'Utilities' },
                  { key: 'transportation', label: 'Transportation' },
                  { key: 'food', label: 'Food' },
                  { key: 'insurance', label: 'Insurance' },
                  { key: 'subscriptions', label: 'Subscriptions' },
                  { key: 'otherBills', label: 'Other bills' }
                ] as const).map(field => (
                  <label key={field.key} className="block text-xs uppercase font-mono text-[#bbcabf]">
                    {field.label}
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={bills[field.key]}
                      onChange={(e) => setBills(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="mt-2 w-full bg-[#131313] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                      placeholder="0"
                    />
                  </label>
                ))}
              </div>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-t border-white/5 pt-4">
                <p className="text-xs uppercase font-mono text-[#bbcabf]">Total fixed expenses</p>
                <p className="text-2xl font-semibold text-white">${totalBills.toFixed(2)}</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#1b1b1b] border border-white/10 rounded-2xl p-6 space-y-5">
                <div>
                  <p className="text-xs uppercase font-mono text-[#bbcabf]">Step 3</p>
                  <h3 className="text-xl font-semibold text-white mt-1">Savings and goals</h3>
                  <p className="text-sm text-[#bbcabf] mt-2">Set savings targets and optional travel plans.</p>
                </div>

                <label className="block text-xs uppercase font-mono text-[#bbcabf]">
                  Savings goal
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={savingsGoal}
                    onChange={(e) => setSavingsGoal(e.target.value)}
                    className="mt-2 w-full bg-[#131313] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    placeholder="1000"
                  />
                </label>

                <div className="flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-lg p-4">
                  <div>
                    <p className="text-sm text-white">Vacation planned</p>
                    <p className="text-xs text-[#bbcabf]">Toggle to allocate a travel budget.</p>
                  </div>
                  <button
                    onClick={() => setHasVacation(prev => !prev)}
                    className={`w-12 h-6 rounded-full flex items-center transition-all ${hasVacation ? 'bg-[#4edea3]' : 'bg-white/10'}`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full bg-white shadow transform transition-all ${hasVacation ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>

                {hasVacation && (
                  <label className="block text-xs uppercase font-mono text-[#bbcabf]">
                    Vacation budget
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={vacationBudget}
                      onChange={(e) => setVacationBudget(e.target.value)}
                      className="mt-2 w-full bg-[#131313] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                      placeholder="800"
                    />
                  </label>
                )}
              </div>

              <div className="bg-gradient-to-br from-[#1d2220] to-[#171717] border border-white/10 rounded-2xl p-6 space-y-4">
                <p className="text-xs uppercase font-mono text-[#bbcabf]">Preview summary</p>
                {renderSummary(previewSummary)}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="bg-[#1b1b1b] border border-white/10 rounded-2xl p-6 space-y-4">
                <div>
                  <p className="text-xs uppercase font-mono text-[#bbcabf]">Step 4</p>
                  <h3 className="text-xl font-semibold text-white mt-1">Your smart budget plan</h3>
                  <p className="text-sm text-[#bbcabf] mt-2">Review the AI summary and open the calendar.</p>
                </div>
                {renderSummary(aiRecommendations)}
                {renderInsights()}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setMode('overview')}
                  className="px-4 py-2 rounded-lg bg-[#4edea3] text-[#003824] text-xs font-mono uppercase tracking-widest font-bold hover:bg-[#6ffbbe] transition-colors"
                >
                  View calendar
                </button>
                <button
                  onClick={startEditPlan}
                  className="px-4 py-2 rounded-lg border border-[#4edea3]/30 text-[#4edea3] text-xs font-mono uppercase tracking-widest hover:bg-[#4edea3]/10 transition-colors"
                >
                  Adjust plan
                </button>
              </div>
            </div>
          )}

          {step < 4 && (
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                disabled={step === 1}
                className="flex items-center gap-2 text-xs text-[#bbcabf] disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              {step < 3 && (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white text-xs uppercase font-mono tracking-widest hover:bg-white/15 transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {step === 3 && (
                <button
                  onClick={handleGeneratePlan}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4edea3] text-[#003824] text-xs uppercase font-mono tracking-widest font-bold hover:bg-[#6ffbbe] transition-colors disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate plan
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {mode === 'overview' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold text-white">{monthLabel || 'Budget overview'}</h3>
              <p className="text-sm text-[#bbcabf]">Review your AI-generated budget calendar.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs uppercase font-mono text-[#bbcabf]">
                Month
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="mt-1 w-40 bg-[#131313] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </label>
              <button
                onClick={() => loadPlan(month)}
                className="p-2 rounded-lg border border-white/10 text-[#bbcabf] hover:text-white hover:bg-white/5"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!plan && (
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              <p className="text-sm text-[#bbcabf]">No plan saved for this month yet.</p>
              <button
                onClick={startNewPlan}
                className="mt-4 px-4 py-2 rounded-lg bg-[#4edea3] text-[#003824] text-xs font-mono uppercase tracking-widest font-bold hover:bg-[#6ffbbe] transition-colors"
              >
                Create plan
              </button>
            </div>
          )}

          {plan && (
            <div className="space-y-6">
              {renderSummary(aiRecommendations)}
              {renderInsights()}
              {renderCalendar()}
            </div>
          )}
        </div>
      )}

      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1b1b1b] border border-white/10 rounded-2xl p-6 w-full max-w-lg relative">
            <button
              onClick={() => setSelectedDay(null)}
              className="absolute right-4 top-4 text-[#bbcabf] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase font-mono text-[#bbcabf]">{formatMonthLabel(selectedDay.date.slice(0, 7))}</p>
                <h3 className="text-xl font-semibold text-white mt-1">{selectedDay.date}</h3>
              </div>

              <div className="flex items-center gap-2 text-xs uppercase font-mono text-[#bbcabf]">
                {(() => {
                  const meta = getTypeMeta(selectedDay.type);
                  const Icon = meta.icon;
                  return (
                    <span className={`flex items-center gap-2 ${meta.tone}`}>
                      <Icon className="w-4 h-4" />
                      {meta.label}
                    </span>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                  <p className="text-[11px] uppercase font-mono text-[#bbcabf]">Available to spend</p>
                  <p className="text-xl font-semibold text-white mt-2">${selectedDay.availableToSpend.toFixed(2)}</p>
                </div>
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                  <p className="text-[11px] uppercase font-mono text-[#bbcabf]">Running balance</p>
                  <p className="text-xl font-semibold text-white mt-2">${selectedDay.runningBalance.toFixed(2)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase font-mono text-[#bbcabf] mb-2">Planned expenses</p>
                {selectedDay.plannedExpenses && selectedDay.plannedExpenses.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDay.plannedExpenses.map((expense, index) => (
                      <div key={index} className="flex items-center justify-between text-sm text-white">
                        <span>{expense.category}</span>
                        <span>${Number(expense.amount).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#bbcabf]">No scheduled items.</p>
                )}
              </div>

              {selectedDay.notes && (
                <div className="text-sm text-[#bbcabf] border-t border-white/5 pt-4">
                  {selectedDay.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
