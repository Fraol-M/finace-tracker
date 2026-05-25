import React, { useState, useMemo, useRef, useEffect } from "react";
import { Transaction } from "../types";
import { useFinance } from "../contexts/FinanceContext";
import { ArrowUp, ArrowDown, Search, ListFilter, ChevronRight, MoreVertical, Briefcase, TrendingUp, Check, X, Trash2, Edit2 } from "lucide-react";
import { getCategoryStyle } from "../utils/categoryHelpers";
import Pagination from "./Pagination";

export default function TablePage() {
  const { transactions, updateTransaction, deleteTransaction } = useFinance();

  // months derived from existing transactions + current month representation
  const monthOptions = useMemo(() => {
    const dates = transactions.map((t) => {
      const parts = t.date.split("-");
      return `${parts[0]}-${parts[1]}`; // YYYY-MM
    });

    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    if (!dates.includes(currentYM)) {
      dates.push(currentYM);
    }

    const uniqueYMs: string[] = Array.from(new Set(dates));

    uniqueYMs.sort((a, b) => b.localeCompare(a));

    return uniqueYMs.map((ym) => {
      const [y, m] = ym.split("-");
      const dateObj = new Date(parseInt(y), parseInt(m) - 1, 1);
      const name = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(dateObj);
      return {
        key: name,
        prefix: ym,
      };
    });
  }, [transactions]);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(now);
  });

  const [currentFilter, setCurrentFilter] = useState<"all" | "income" | "expense">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"title" | "amount" | "date">("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const [editingTxId, setEditingTxId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [activeMenuTxId, setActiveMenuTxId] = useState<number | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuTxId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStartEdit = (t: Transaction) => {
    setEditingTxId(t.id);
    setEditTitle(t.title);
    setEditCategory(t.category);
    setEditAmount(Math.abs(t.amount).toString());
    setEditDate(t.date);
    setActiveMenuTxId(null);
  };

  const handleSaveEdit = (t: Transaction) => {
    if (!editTitle.trim() || !editAmount || parseFloat(editAmount) <= 0) return;

    const realAmount = Math.abs(parseFloat(editAmount));
    const updatedTx: Transaction = {
      ...t,
      title: editTitle.trim(),
      amount: t.type === "expense" ? -realAmount : realAmount,
      category: editCategory,
      date: editDate,
    };

    updateTransaction(updatedTx);
    setEditingTxId(null);
  };

  const handleCancelEdit = () => {
    setEditingTxId(null);
  };

  const handleOpenMenu = (txId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMenuTxId(txId === activeMenuTxId ? null : txId);
  };

  const dynamicCategories = useMemo(() => {
    const existing = transactions.map((t) => t.category);
    const defaults = ["Infrastructure", "Software", "Meals", "Travel", "Consulting", "Operations", "Salary", "Investments", "Revenue", "Marketing"];
    return Array.from(new Set([...defaults, ...existing]));
  }, [transactions]);

  const monthTransactions = useMemo(() => {
    const match = monthOptions.find((o) => o.key === selectedMonth);
    const prefix = match ? match.prefix : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

    return transactions.filter((t) => t.date.startsWith(prefix));
  }, [transactions, selectedMonth, monthOptions]);

  // Compute stats on-the-fly dynamically
  const stats = useMemo(() => {
    if (monthTransactions.length === 0) {
      return {
        income: 0,
        expense: 0,
        net: 0,
      };
    }

    const rawIncome = monthTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);

    const rawExpense = Math.abs(monthTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0));

    return {
      income: rawIncome,
      expense: rawExpense,
      net: rawIncome - rawExpense,
    };
  }, [monthTransactions]);

  // Filter and sort the table content
  const processedTransactions = useMemo(() => {
    let result = [...monthTransactions];

    if (searchQuery.trim() !== "") {
      result = result.filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.category.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (currentFilter !== "all") {
      result = result.filter((t) => t.type === currentFilter);
    }

    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === "title") {
        valA = (valA as string).toLowerCase();
        valB = (valB as string).toLowerCase();
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [monthTransactions, searchQuery, currentFilter, sortField, sortAsc]);

  const totalResults = processedTransactions.length;
  const totalPages = Math.ceil(totalResults / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = processedTransactions.slice(startIndex, startIndex + itemsPerPage);

  const toggleSort = (field: "title" | "amount" | "date") => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#e5e2e1]" id="monthly-title-h2">
            Monthly Transactions
          </h2>
          <p className="text-[#bbcabf] text-sm mt-1">Detailed ledger of all financial activities.</p>
        </div>

        {/* Month Dropdown */}
        <div className="relative">
          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setCurrentPage(1);
            }}
            className="appearance-none bg-[#201f1f] border border-white/10 text-[#e5e2e1] font-sans text-xs rounded-lg pl-4 pr-10 py-2.5 focus:outline-none focus:border-[#4edea3] focus:ring-1 focus:ring-[#4edea3] transition-colors cursor-pointer hover:bg-zinc-800 w-full sm:w-auto"
          >
            {monthOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.key}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#bbcabf]">
            <ChevronRight className="w-4 h-4 rotate-90" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Income */}
        <div className="bg-[#131313] border border-white/5 rounded-xl p-6 relative overflow-hidden group hover:border-[#4edea3]/30 transition-colors">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#4edea3]/5 rounded-full blur-2xl group-hover:bg-[#4edea3]/10 transition-colors"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-[#4edea3]/10 flex items-center justify-center text-[#4edea3]">
              <ArrowUp className="w-5 h-5" />
            </div>
            <h3 className="text-xs text-[#bbcabf] font-mono uppercase tracking-wider">Total Income</h3>
          </div>
          <div className="text-2xl font-bold font-sans tracking-tight text-[#e5e2e1] relative z-10">
            ${stats.income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex items-center gap-1 text-[#4edea3] font-mono text-[10px] uppercase tracking-wider relative z-10">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+12.5% from last month</span>
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-[#131313] border border-white/5 rounded-xl p-6 relative overflow-hidden group hover:border-[#ffb4ab]/30 transition-colors">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-[#ffb4ab]">
              <ArrowDown className="w-5 h-5" />
            </div>
            <h3 className="text-xs text-[#bbcabf] font-mono uppercase tracking-wider">Total Expense</h3>
          </div>
          <div className="text-2xl font-bold font-sans tracking-tight text-[#e5e2e1] relative z-10">
            ${stats.expense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex items-center gap-1 text-[#bbcabf] font-mono text-[10px] uppercase tracking-wider relative z-10">
            <span>Stable compared to average</span>
          </div>
        </div>

        {/* Net Cash Flow */}
        <div className="border border-white/5 bg-[#201f1f]/40 backdrop-blur-md rounded-xl p-6 relative overflow-hidden group hover:border-[#c487ff]/30 transition-all duration-300 shadow-sm hover:shadow-lg">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#c487ff]/5 rounded-full blur-2xl group-hover:bg-[#c487ff]/10 transition-colors"></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-[#c487ff]/10 flex items-center justify-center text-[#c487ff]">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="text-xs text-[#bbcabf] font-mono uppercase tracking-wider">Net Cash Flow</h3>
          </div>
          <div className="text-2xl font-bold font-sans tracking-tight text-[#e5e2e1] relative z-10">${stats.net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>

          {/* Sparkline visualization */}
          <div className="mt-4 w-full h-8 flex items-end gap-1 opacity-60 relative z-10">
            <div className="w-1/6 bg-[#4edea3]/40 h-1/3 rounded-t-sm"></div>
            <div className="w-1/6 bg-[#4edea3]/50 h-1/2 rounded-t-sm"></div>
            <div className="w-1/6 bg-[#4edea3]/70 h-2/3 rounded-t-sm"></div>
            <div className="w-1/6 bg-[#4edea3]/40 h-1/3 rounded-t-sm"></div>
            <div className="w-1/6 bg-[#4edea3]/80 h-full rounded-t-sm"></div>
            <div className="w-1/6 bg-[#4edea3] h-3/4 rounded-t-sm animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Ledger Table Canvas Container */}
      <div className="bg-[#201f1f] rounded-xl border border-white/5 flex flex-col shadow-sm" id="transaction-section">
        <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex p-1 bg-[#353534] rounded-lg inline-flex" id="filter-toggles">
            <button
              onClick={() => {
                setCurrentFilter("all");
                setCurrentPage(1);
              }}
              className={`px-4 py-1.5 rounded-md font-mono text-[11px] uppercase tracking-wider cursor-pointer transition-all ${
                currentFilter === "all" ? "bg-[#1c1b1b] border border-white/10 text-[#e5e2e1] shadow-sm font-bold" : "text-[#bbcabf] hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setCurrentFilter("income");
                setCurrentPage(1);
              }}
              className={`px-4 py-1.5 rounded-md font-mono text-[11px] uppercase tracking-wider cursor-pointer transition-all ${
                currentFilter === "income" ? "bg-[#1c1b1b] border border-white/10 text-[#e5e2e1] shadow-sm font-bold" : "text-[#bbcabf] hover:text-white"
              }`}
            >
              Income
            </button>
            <button
              onClick={() => {
                setCurrentFilter("expense");
                setCurrentPage(1);
              }}
              className={`px-4 py-1.5 rounded-md font-mono text-[11px] uppercase tracking-wider cursor-pointer transition-all ${
                currentFilter === "expense" ? "bg-[#1c1b1b] border border-white/10 text-[#e5e2e1] shadow-sm font-bold" : "text-[#bbcabf] hover:text-white"
              }`}
            >
              Expense
            </button>
          </div>

          {/* Search elements */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbcabf]/50 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-[#1c1b1b] border border-white/10 text-[#e5e2e1] font-sans text-xs rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-[#4edea3] focus:ring-1 focus:ring-[#4edea3] w-full sm:w-64 placeholder:text-[#bbcabf]/40"
                placeholder="Search transactions..."
              />
            </div>
            <button className="p-2 rounded-lg border border-white/10 text-[#bbcabf] hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
              <ListFilter className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b bg-[#1c1b1b]/50 border-white/5">
                <th onClick={() => toggleSort("title")} className="font-mono text-[11px] text-[#bbcabf] py-4 px-6 font-semibold tracking-wider select-none cursor-pointer hover:text-white">
                  <div className="flex items-center gap-1.5">
                    TITLE
                    {sortField === "title" ? <span className="text-[#4edea3] text-[9px]">{sortAsc ? "▲" : "▼"}</span> : <span className="opacity-30 text-[9px]">↕</span>}
                  </div>
                </th>
                <th className="font-mono text-[11px] text-[#bbcabf] py-4 px-6 font-semibold tracking-wider">CATEGORY</th>
                <th onClick={() => toggleSort("amount")} className="font-mono text-[11px] text-[#bbcabf] py-4 px-6 font-semibold tracking-wider text-right select-none cursor-pointer hover:text-white">
                  <div className="flex items-center justify-end gap-1.5">
                    AMOUNT
                    {sortField === "amount" ? <span className="text-[#4edea3] text-[9px]">{sortAsc ? "▲" : "▼"}</span> : <span className="opacity-30 text-[9px]">↕</span>}
                  </div>
                </th>
                <th onClick={() => toggleSort("date")} className="font-mono text-[11px] text-[#bbcabf] py-4 px-6 font-semibold tracking-wider select-none cursor-pointer hover:text-white">
                  <div className="flex items-center gap-1.5">
                    DATE
                    {sortField === "date" ? <span className="text-[#4edea3] text-[9px]">{sortAsc ? "▲" : "▼"}</span> : <span className="opacity-30 text-[9px]">↕</span>}
                  </div>
                </th>
                <th className="py-4 px-6 w-12"></th>
              </tr>
            </thead>
            <tbody className="text-xs text-[#e5e2e1]">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#bbcabf]/50 font-mono text-xs">
                    No matching ledger transactions found.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((t, idx) => {
                  const isEditing = editingTxId === t.id;
                  return (
                    <tr key={t.id} className="border-b even:bg-white/[0.01]/30 hover:bg-white/[0.02] border-white/5 transition-colors group h-14">
                      <td className="py-2 px-6">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="bg-[#161616] border border-white/10 text-white rounded px-2.5 py-1 text-xs outline-none focus:ring-1 focus:ring-[#4edea3] focus:border-[#4edea3] w-full"
                            required
                          />
                        ) : (
                          <span className="font-semibold tracking-tight text-[#e5e2e1]">{t.title}</span>
                        )}
                      </td>

                      <td className="py-2 px-6">
                        {isEditing ? (
                          <>
                            <input
                              type="text"
                              list="table-edit-category-list"
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              className="bg-[#161616] border border-white/10 text-white rounded px-2.5 py-1 text-xs outline-none focus:ring-1 focus:ring-[#4edea3] focus:border-[#4edea3] w-full"
                              required
                            />
                            <datalist id="table-edit-category-list">
                              {dynamicCategories.map((cat) => (
                                <option key={cat} value={cat} />
                              ))}
                            </datalist>
                          </>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-mono lowercase ${getCategoryStyle(t.category)}`}>{t.category}</span>
                        )}
                      </td>

                      <td className="py-2 px-6">
                        {isEditing ? (
                          <div className="flex items-center justify-end">
                            <span className="text-[#bbcabf] mr-1 font-mono">{t.amount < 0 ? "-" : "+"}</span>
                            <input
                              type="number"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              className="bg-[#161616] border border-white/10 text-white rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-[#4edea3] focus:border-[#4edea3] w-24 text-right font-mono"
                              min="0.01"
                              step="0.01"
                              required
                            />
                          </div>
                        ) : (
                          <div className={`text-right font-semibold font-mono ${t.amount < 0 ? "text-[#ffb4ab]" : "text-[#4edea3]"}`}>
                            {t.amount < 0 ? "-" : "+"}${Math.abs(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                        )}
                      </td>

                      <td className="py-2 px-6">
                        {isEditing ? (
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="bg-[#161616] border border-white/10 text-white rounded px-2.5 py-1 text-xs outline-none focus:ring-1 focus:ring-[#4edea3] focus:border-[#4edea3] font-mono"
                            required
                          />
                        ) : (
                          <span className="text-[#bbcabf] font-mono">{new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        )}
                      </td>

                      <td className="py-2 px-6 text-right relative">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleSaveEdit(t)} className="p-1 rounded bg-[#4edea3]/10 text-[#4edea3] hover:bg-[#4edea3]/25 transition-all cursor-pointer" title="Save changes">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={handleCancelEdit} className="p-1 rounded bg-rose-500/10 text-[#ffb4ab] hover:bg-rose-500/25 transition-all cursor-pointer" title="Cancel editing">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="relative inline-block text-left">
                            <button
                              onClick={(e) => handleOpenMenu(t.id, e)}
                              className="text-[#bbcabf] opacity-50 group-hover:opacity-100 hover:text-[#4edea3] transition-all p-1 hover:bg-white/5 rounded-full cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {activeMenuTxId === t.id && (
                              <div ref={menuRef} className="absolute right-0 mt-1 w-28 bg-[#161616] border border-white/10 rounded-lg shadow-xl py-1 z-30 font-sans text-left">
                                <button
                                  onClick={() => handleStartEdit(t)}
                                  className="w-full text-left px-3 py-1.5 text-xs text-[#bbcabf] hover:text-white hover:bg-white/5 flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <Edit2 className="w-3 h-3 text-[#4edea3]" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    if (true) {
                                      deleteTransaction(t.id);
                                    }
                                    setActiveMenuTxId(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:text-white hover:bg-rose-500/10 flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3 text-rose-400" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          startIdx={totalResults > 0 ? startIndex + 1 : 0}
          endIdx={Math.min(startIndex + itemsPerPage, totalResults)}
          totalItems={totalResults}
          containerClassName="p-4 border-t border-white/5 flex items-center justify-between mt-auto bg-[#1c1b1b]/30"
        />
      </div>
    </div>
  );
}
