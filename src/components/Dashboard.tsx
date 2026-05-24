import React, { useState } from 'react';
import { UserAccount, NewTransaction } from '../types';
import { useFinance } from '../contexts/FinanceContext';
import { currentMonth, currentYear, CURRENT_MONTH_PREFIX } from '../constants/date';
import { getCategoriesForType, defaultCategoryForType } from '../utils/categories';
import { PlusCircle, MinusCircle, Monitor, DollarSign, Calendar, X, Utensils, Plane, Tv, Landmark, HelpCircle, Briefcase, Award } from 'lucide-react';
import { getCategoryIconName, renderCategoryIcon, getCategoryStyle } from '../utils/categoryHelpers';

interface DashboardProps {
  currentUser: UserAccount;
}

export default function Dashboard({ currentUser }: DashboardProps) {
  const { transactions, addTransaction } = useFinance();
  const [filterType, setFilterType] = useState<'expense' | 'income'>('expense');
  
  // Custom Transaction Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'expense' | 'income'>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Filter current month transactions for dynamic calculations
  const currentMonthTransactions = transactions.filter(t => t.date.startsWith(CURRENT_MONTH_PREFIX));
  
  const totalMonthIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalMonthExpense = Math.abs(
    currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const surplus = totalMonthIncome - totalMonthExpense;

  // Weekly Expense sums (approximation for W1, W2, W3, W4 for the current month)
  // Let's dynamically partition the current month's transactions into weeks:
  // Days 1-7: W1, 8-14: W2, 15-21: W3, 22-31: W4
  const getWeeklyExpense = (weekNum: number) => {
    return Math.abs(
      currentMonthTransactions
        .filter(t => {
          if (t.type !== 'expense') return false;
          try {
            const day = parseInt(t.date.split('-')[2]);
            if (isNaN(day)) return false;
            if (weekNum === 1) return day >= 1 && day <= 7;
            if (weekNum === 2) return day >= 8 && day <= 14;
            if (weekNum === 3) return day >= 15 && day <= 21;
            return day >= 22 && day <= 31;
          } catch {
            return false;
          }
        })
        .reduce((sum, t) => sum + t.amount, 0)
    );
  };

  const w1Expense = getWeeklyExpense(1);
  const w2Expense = getWeeklyExpense(2);
  const w3Expense = getWeeklyExpense(3);
  const w4Expense = getWeeklyExpense(4);

  const maxWeekly = Math.max(w1Expense, w2Expense, w3Expense, w4Expense, 1000);

  const dynamicCategories = React.useMemo(
    () => getCategoriesForType(transactions, modalType),
    [transactions, modalType]
  );

  const hasMonthTxs = currentMonthTransactions.length > 0;

  const expenseArcVal = hasMonthTxs && totalMonthExpense > 0
    ? Math.max(10, Math.min(240, (totalMonthExpense / Math.max(1, totalMonthIncome)) * 251.2))
    : 0;

  const incomeArcVal = hasMonthTxs && totalMonthIncome > 0 && surplus > 0
    ? Math.max(50, Math.min(200, (surplus / Math.max(1, totalMonthIncome)) * 251.2))
    : 0;

  // Filtered recent transactions list (limited to 7 most recent ones)
  const recentFiltered = React.useMemo(() => {
    return [...currentMonthTransactions]
      .filter(t => t.type === filterType)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.id - a.id)
      .slice(0, 7);
  }, [currentMonthTransactions, filterType]);

  const openAddModal = (type: 'expense' | 'income') => {
    setModalType(type);
    setIsModalOpen(true);
    setTitle('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setCategory(defaultCategoryForType(type));
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || parseFloat(amount) <= 0) return;

    const realAmount = Math.abs(parseFloat(amount));
    const newTx: NewTransaction = {
      title: title.trim(),
      amount: modalType === 'expense' ? -realAmount : realAmount,
      category: category,
      date: date,
      type: modalType,
      icon: getCategoryIconName(category),
    };

    addTransaction(newTx);
    setIsModalOpen(false);
  };



  return (
    <div className="space-y-6">
      
      {/* Dynamic Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#e5e2e1]" id="dash-greeting-h2">Welcome, {currentUser.fullName}</h2>
          <p className="text-[#bbcabf] text-sm mt-1">Reviewing your financial precision for {currentMonth} {currentYear}.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            id="addExpenseBtn"
            onClick={() => openAddModal('expense')}
            className="bg-[#131313] border border-[#4edea3] text-[#4edea3] font-mono text-xs uppercase tracking-wider px-4 py-2.5 rounded hover:bg-[#4edea3]/10 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <MinusCircle className="w-4 h-4" />
            Add Expense
          </button>
          <button 
            id="addIncomeBtn"
            onClick={() => openAddModal('income')}
            className="bg-[#4edea3] text-[#003824] font-mono text-xs uppercase tracking-wider px-4 py-2.5 rounded hover:bg-[#6ffbbe] transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(78,222,163,0.3)] cursor-pointer font-bold"
          >
            <PlusCircle className="w-4 h-4" />
            Add Income
          </button>
        </div>
      </div>

      {/* Main Stats Bento Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Expenses Graph */}
        <div className="lg:col-span-2 bg-[#201f1f] rounded-xl border border-white/5 p-6 flex flex-col relative overflow-hidden group hover:border-[#4edea3]/20 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-[#4edea3]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-lg font-semibold text-[#e5e4e2] tracking-tight">Weekly Expenses: {currentMonth}</h3>
            <div className="bg-[#2a2a2a] rounded px-3 py-1 border border-white/5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ffb4ab]"></span>
              <span className="font-mono text-[10px] text-[#bbcabf] uppercase tracking-wider">{currentMonth} {currentYear}</span>
            </div>
          </div>

          <div className="flex-1 flex items-end gap-4 h-48 mt-auto relative z-10 pt-6 border-b border-[#353534] pb-2">
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[#bbcabf]/40 font-mono text-[10px] -ml-2 pointer-events-none">
              <span>${(maxWeekly * 1.0).toFixed(0)}</span>
              <span>${(maxWeekly * 0.5).toFixed(0)}</span>
              <span>$0</span>
            </div>

            {/* Week 1 */}
            <div className="flex-1 flex flex-col justify-end h-full group/bar cursor-pointer ml-8 relative">
              <div className="w-full bg-[#2a2a2a] rounded-t relative h-full flex items-end hover:bg-zinc-800 transition-all">
                <div 
                  className="w-full bg-[#4edea3] rounded-t transition-all duration-700 block" 
                  style={{ height: `${Math.min(100, (w1Expense / maxWeekly) * 100)}%` }}
                ></div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 border border-white/10 text-white text-[10px] rounded opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-xl font-mono">
                  ${w1Expense.toFixed(2)}
                </div>
              </div>
              <span className="text-center font-mono text-[11px] text-[#bbcabf] mt-2 block">W1</span>
            </div>

            {/* Week 2 */}
            <div className="flex-1 flex flex-col justify-end h-full group/bar cursor-pointer relative">
              <div className="w-full bg-[#2a2a2a] rounded-t relative h-full flex items-end hover:bg-zinc-800 transition-all">
                <div 
                  className="w-full bg-[#4edea3] rounded-t transition-all duration-700 block" 
                  style={{ height: `${Math.min(100, (w2Expense / maxWeekly) * 100)}%` }}
                ></div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 border border-white/10 text-white text-[10px] rounded opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-xl font-mono">
                  ${w2Expense.toFixed(2)}
                </div>
              </div>
              <span className="text-center font-mono text-[11px] text-[#bbcabf] mt-2 block">W2</span>
            </div>

            {/* Week 3 */}
            <div className="flex-1 flex flex-col justify-end h-full group/bar cursor-pointer relative">
              <div className="w-full bg-[#2a2a2a] rounded-t relative h-full flex items-end hover:bg-zinc-800 transition-all">
                <div 
                  className="w-full bg-[#4edea3] rounded-t transition-all duration-700 block" 
                  style={{ height: `${Math.min(100, (w3Expense / maxWeekly) * 100)}%` }}
                ></div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 border border-white/10 text-white text-[10px] rounded opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-xl font-mono">
                  ${w3Expense.toFixed(2)}
                </div>
              </div>
              <span className="text-center font-mono text-[11px] text-[#bbcabf] mt-2 block">W3</span>
            </div>

            {/* Week 4 */}
            <div className="flex-1 flex flex-col justify-end h-full group/bar cursor-pointer relative">
              <div className="w-full bg-[#2a2a2a] rounded-t relative h-full flex items-end hover:bg-zinc-800 transition-all">
                <div 
                  className="w-full bg-[#4edea3] rounded-t transition-all duration-700 block" 
                  style={{ height: `${Math.min(100, (w4Expense / maxWeekly) * 100)}%` }}
                ></div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 border border-white/10 text-white text-[10px] rounded opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-xl font-mono">
                  ${w4Expense.toFixed(2)}
                </div>
              </div>
              <span className="text-center font-mono text-[11px] text-[#bbcabf] mt-2 block">W4</span>
            </div>

          </div>
        </div>

        {/* Circular Budget Ring */}
        <div className="bg-[#201f1f] rounded-xl border border-white/5 p-6 flex flex-col items-center justify-between relative hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:border-[#c487ff]/20 transition-all duration-300">
          <h3 className="text-lg font-semibold text-[#e5e4e2] w-full text-left">{currentMonth} Budget</h3>
          
          <div className="relative w-44 h-44 my-4">
            <svg className="w-full h-full -rotate-90 drop-shadow-lg" viewBox="0 0 100 100">
              <circle cx="50" cy="50" fill="none" r="40" stroke="rgba(255,255,255,0.03)" strokeWidth="8"></circle>
              {/* Expense arc - Red */}
              <circle 
                cx="50" 
                cy="50" 
                fill="none" 
                r="40" 
                stroke="#ffb4ab" 
                strokeDasharray={`${expenseArcVal} 251.2`} 
                strokeLinecap="round" 
                strokeWidth="8"
                className="transition-all duration-1000"
              ></circle>
              {/* Income arc - Green */}
              <circle 
                cx="50" 
                cy="50" 
                fill="none" 
                r="40" 
                stroke="#4edea3" 
                strokeDasharray={`${incomeArcVal} 251.2`} 
                strokeDashoffset={-40}
                strokeLinecap="round" 
                strokeWidth="8"
                className="transition-all duration-1000"
              ></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#bbcabf] mb-0.5">Surplus</span>
              <span className="text-2xl font-bold text-[#4edea3] tracking-tight">
                ${surplus >= 0 ? '' : '-'}${Math.abs(surplus).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          <div className="w-full space-y-2 mt-2">
            <div className="flex justify-between items-center bg-[#2a2a2a]/40 p-2.5 rounded border border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4edea3]"></span>
                <span className="text-xs text-[#bbcabf]">{currentMonth.slice(0, 3)} Income</span>
              </div>
              <span className="font-mono font-bold text-xs text-[#e5e4e2]">${totalMonthIncome.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center bg-[#2a2a2a]/40 p-2.5 rounded border border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffb4ab]"></span>
                <span className="text-xs text-[#bbcabf]">{currentMonth.slice(0, 3)} Expenses</span>
              </div>
              <span className="font-mono font-bold text-xs text-[#e5e4e2]">${totalMonthExpense.toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Transactions List Ledger */}
      <div className="bg-[#201f1f] rounded-xl border border-white/5 overflow-hidden flex flex-col">
        <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-semibold text-[#e5e4e2]">Transactions: {currentMonth} {currentYear}</h3>
          <div className="flex bg-[#353534] rounded p-1 border border-white/5">
            <button 
              onClick={() => setFilterType('expense')}
              className={`px-4 py-1 rounded font-mono text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
                filterType === 'expense' 
                  ? 'bg-[#1c1b1b] border border-white/10 text-white shadow-sm font-bold' 
                  : 'text-[#bbcabf] hover:text-white'
              }`}
            >
              Expenses
            </button>
            <button 
              onClick={() => setFilterType('income')}
              className={`px-4 py-1 rounded font-mono text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
                filterType === 'income' 
                  ? 'bg-[#1c1b1b] border border-white/10 text-white shadow-sm font-bold' 
                  : 'text-[#bbcabf] hover:text-white'
              }`}
            >
              Income
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {recentFiltered.length === 0 ? (
            <div className="text-center py-12 text-[#bbcabf]/50 text-xs font-mono">
              No transactions added under {filterType} this month yet.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#161616]/30">
                  <th className="py-3 px-6 font-mono text-[11px] text-[#bbcabf] font-semibold uppercase tracking-wider">Title</th>
                  <th className="py-3 px-6 font-mono text-[11px] text-[#bbcabf] font-semibold uppercase tracking-wider">Amount</th>
                  <th className="py-3 px-6 font-mono text-[11px] text-[#bbcabf] font-semibold uppercase tracking-wider">Category</th>
                  <th className="py-3 px-6 font-mono text-[11px] text-[#bbcabf] font-semibold uppercase tracking-wider text-right">Date</th>
                </tr>
              </thead>
              <tbody className="text-[#e5e2e1] text-xs">
                {recentFiltered.map((t) => (
                  <tr 
                    key={t.id} 
                    className="h-12 border-b border-white/5 hover:bg-white/[0.02] transition-colors group cursor-pointer"
                  >
                    <td className="py-2.5 px-6 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center text-[#bbcabf] group-hover:text-[#4edea3] transition-colors">
                        {renderCategoryIcon(t.icon || 'credit_card')}
                      </div>
                      <span className="font-semibold tracking-tight">{t.title}</span>
                    </td>
                    <td className={`py-2 px-6 font-semibold font-mono ${t.amount < 0 ? 'text-[#ffb4ab]' : 'text-[#4edea3]'}`}>
                      {t.amount < 0 ? '-' : '+'}${Math.abs(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono lowercase ${getCategoryStyle(t.category)}`}>
                        {t.category}
                      </span>
                    </td>
                    <td className="py-2 px-6 text-right text-[#bbcabf] font-mono">
                      {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* STATEFUL TRANSACTION DIALOG FORM MODAL */}
      {isModalOpen && (
        <div id="addTransactionModal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#131212]/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="relative w-full max-w-lg bg-[#201f1f] border border-white/10 rounded-xl shadow-2xl overflow-hidden transform transition-all">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#1c1b1b]">
              <h2 className="text-md font-bold text-[#e5e2e1]" id="modal-title-header">
                Add New {modalType === 'expense' ? 'Expense' : 'Income'} ({currentMonth} {currentYear})
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 text-[#bbcabf] hover:text-white transition-colors cursor-pointer border border-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="p-6 space-y-5" id="frmAddTransaction">
              
              <div className="space-y-1.5">
                <label className="block text-xs uppercase tracking-wider font-mono text-[#bbcabf]">
                  Title
                </label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#1c1b1b] border border-white/10 rounded py-2 px-3 text-[#e5e2e1] text-xs focus:ring-1 focus:ring-[#4edea3] focus:border-[#4edea3] transition-all outline-none" 
                  placeholder={modalType === 'expense' ? 'e.g. AWS Cloud Services' : 'e.g. Freelance Consulting'}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase tracking-wider font-mono text-[#bbcabf]">
                    Amount ($)
                  </label>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0.01"
                    step="0.01"
                    className="w-full bg-[#1c1b1b] border border-white/10 rounded py-2 px-3 text-[#e5e2e1] text-xs focus:ring-1 focus:ring-[#4edea3] focus:border-[#4edea3] transition-all outline-none font-mono" 
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase tracking-wider font-mono text-[#bbcabf]">
                    Date
                  </label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#1c1b1b] border border-white/10 rounded py-2 px-3 text-[#e5e2e1] text-xs focus:ring-1 focus:ring-[#4edea3] focus:outline-none focus:border-[#4edea3] transition-all font-mono" 
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs uppercase tracking-wider font-mono text-[#bbcabf]">
                  Category
                </label>
                <input 
                  type="text"
                  list="dash-category-list"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#1c1b1b] border border-white/10 rounded py-2 px-3 text-[#e5e2e1] text-xs focus:ring-1 focus:ring-[#4edea3] focus:border-[#4edea3] transition-all outline-none"
                  placeholder="Type or select a category..."
                  required
                />
                <datalist id="dash-category-list">
                  {dynamicCategories.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-white/10 rounded font-mono text-xs uppercase tracking-wider text-[#bbcabf] hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-[#4edea3] text-[#003824] rounded font-mono text-xs uppercase tracking-wider hover:bg-[#6ffbbe] font-bold transition-all shadow-[0_0_15px_rgba(78,222,163,0.2)] cursor-pointer"
                >
                  Save Transaction
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
