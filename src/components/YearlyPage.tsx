import React, { useState, useMemo } from 'react';
import { Landmark, TrendingUp, BarChart2, DollarSign, Activity } from 'lucide-react';
import { useFinance, YEARLY_MONTHS_CONFIG, currentYear } from '../data/financeData';

export default function YearlyPage() {
  const { transactions } = useFinance();
  const [tooltipText, setTooltipText] = useState('');
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);

  // Helper to format chart axis numbers with exactly 1 decimal digit to show half-steps (e.g. 0.5k, 1.5k)
  const formatYAxis = (value: number) => {
    if (Math.abs(value) < 1) return '0';
    const kVal = value / 1000;
    return `${kVal.toFixed(1)}k`;
  };

  // Compute dynamic monthly metrics connected directly to transactions state
  const dynamicMonthlyMetrics = useMemo(() => {
    return YEARLY_MONTHS_CONFIG.map(m => {
      const monthTxs = transactions.filter(t => t.date.startsWith(m.prefix));
      const rawIncome = monthTxs
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const rawExpense = Math.abs(
        monthTxs
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0)
      );

      const income = rawIncome;
      const expense = rawExpense;

      return {
        month: m.name,
        shortMonth: m.short,
        income,
        expense,
        net: income - expense
      };
    });
  }, [transactions]);

  // Aggregate yearly metrics
  const yearlyMetrics = useMemo(() => {
    const totalIncome = dynamicMonthlyMetrics.reduce((sum, m) => sum + m.income, 0);
    const totalExpenses = dynamicMonthlyMetrics.reduce((sum, m) => sum + m.expense, 0);
    const netFlow = totalIncome - totalExpenses;
    
    // Calculate relative growth directly
    const yoyGrowthDeg = totalExpenses > 0 ? (netFlow / totalExpenses) * 100 : 0;
    const yoyGrowth = yoyGrowthDeg >= 0 
      ? `+${yoyGrowthDeg.toFixed(1)}%` 
      : `${yoyGrowthDeg.toFixed(1)}%`;

    return {
      totalIncome,
      totalExpenses,
      netFlow,
      yoyGrowth
    };
  }, [dynamicMonthlyMetrics]);

  // Dynamic maximum caps for graph layouts
  const maxExpenses = useMemo(() => {
    const val = Math.max(...dynamicMonthlyMetrics.map(m => m.expense));
    return val > 0 ? val * 1.15 : 1000;
  }, [dynamicMonthlyMetrics]);

  const maxNetFlow = useMemo(() => {
    const val = Math.max(...dynamicMonthlyMetrics.map(m => Math.abs(m.net)));
    return val > 0 ? val * 1.15 : 1000;
  }, [dynamicMonthlyMetrics]);

  const handleMouseEnterBar = (val: string, e: React.MouseEvent) => {
    setTooltipText(val);
    setShowTooltip(true);
  };

  const handleMouseMoveBar = (e: React.MouseEvent) => {
    setTooltipPos({
      x: e.clientX + 15,
      y: e.clientY - 30
    });
  };

  const handleMouseLeaveBar = () => {
    setShowTooltip(false);
  };

  return (
    <div className="space-y-6 relative font-sans">
      
      {/* Absolute Tooltip rendering floating on window scale */}
      {showTooltip && (
        <div 
          className="fixed bg-zinc-900 border border-white/10 px-3 py-1.5 rounded shadow-2xl text-white font-mono text-xs whitespace-nowrap z-50 pointer-events-none transition-all duration-75 block"
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
        >
          {tooltipText}
        </div>
      )}

      {/* Page Header */}
      <h2 className="text-3xl font-bold text-[#e5e2e1]" id="yearly-main-title">Yearly Analytics</h2>

      {/* Bento Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Main Net cash flow for year */}
        <div className="col-span-1 md:col-span-8 bg-[#201f1f] border border-white/5 rounded-xl p-6 relative overflow-hidden group hover:border-[#4edea3]/30 transition-all duration-300">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#4edea3]/5 rounded-full blur-3xl group-hover:bg-[#4edea3]/10 transition-all duration-700"></div>
          
          <div className="flex flex-col h-full justify-between relative z-10">
            <div>
              <div className="flex items-center gap-3 text-[#bbcabf] font-mono text-xs uppercase tracking-widest mb-4">
                <div className="w-10 h-10 rounded-full bg-[#4edea3]/10 flex items-center justify-center text-[#4edea3] border border-[#4edea3]/20">
                  <Landmark className="w-5 h-5" />
                </div>
                Net Cash Flow for the Year
              </div>

              <div className="mt-4">
                <div className="text-[38px] md:text-[48px] font-bold text-[#e5e2e1] leading-none tracking-tight">
                  ${Math.floor(yearlyMetrics.netFlow).toLocaleString()}.<span className="text-xl text-[#bbcabf] uppercase font-mono">00</span>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <span className="bg-[#4edea3]/10 text-[#4edea3] px-3 py-1 rounded-full font-mono text-[11px] flex items-center gap-1 border border-[#4edea3]/20">
                    <TrendingUp className="w-3 h-3" />
                    {yearlyMetrics.yoyGrowth} YoY
                  </span>
                  <span className="text-xs text-[#bbcabf] ml-2">vs Last Year ($1,093,336)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Total Income & Total Expenses Bento secondary panel */}
        <div className="col-span-1 md:col-span-4 flex flex-col gap-6">
          <div className="bg-[#201f1f] border border-white/5 p-6 rounded-xl flex-1 flex flex-col justify-center hover:border-[#4edea3]/30 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-[#bbcabf]">
              <DollarSign className="w-16 h-16" />
            </div>
            <div className="text-[#bbcabf] font-mono text-[11px] uppercase tracking-wider mb-1 opacity-70">Total Income</div>
            <div className="text-2xl font-bold text-[#4edea3] tracking-tight">${Math.floor(yearlyMetrics.totalIncome).toLocaleString()}</div>
          </div>

          <div className="bg-[#201f1f] border border-white/5 p-6 rounded-xl flex-1 flex flex-col justify-center hover:border-rose-500/30 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-[#bbcabf]">
              <Activity className="w-16 h-16" />
            </div>
            <div className="text-[#bbcabf] font-mono text-[11px] uppercase tracking-wider mb-1 opacity-70">Total Expenses</div>
            <div className="text-2xl font-bold text-[#ffb4ab] tracking-tight">${Math.floor(yearlyMetrics.totalExpenses).toLocaleString()}</div>
          </div>
        </div>

      </div>

      {/* Graphical charts grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Monthly Expenses Bar Graph (Bento block 1) */}
        <div className="bg-[#201f1f] border border-white/5 rounded-xl p-6 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-semibold text-[#e5e4e2] uppercase tracking-wider font-mono flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#ffb4ab]" />
              Monthly Expenses
            </h3>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ffb4ab]/80"></span>
              <span className="text-[10px] text-[#bbcabf] font-mono uppercase tracking-wider">Spending</span>
            </div>
          </div>

          <div className="flex-1 flex gap-4 mt-4 h-full">
            {/* Y Coords */}
            <div className="flex flex-col justify-between text-[10px] text-[#bbcabf]/30 font-mono pr-2 border-r border-[#ffffff]/5 pb-8">
              <span>{formatYAxis(maxExpenses)}</span>
              <span>{formatYAxis(maxExpenses * 0.6)}</span>
              <span>{formatYAxis(maxExpenses * 0.2)}</span>
              <span>0</span>
            </div>

            <div className="flex-1 flex flex-col">
              {/* Bars space */}
              <div className="flex-1 flex items-end justify-between gap-1.5 h-full relative" id="expenses-bars-track">
                {dynamicMonthlyMetrics.map((m, idx) => {
                  const percentHeight = (m.expense / maxExpenses) * 100;
                  return (
                    <div 
                      key={m.month} 
                      className="flex-1 bg-[#2a2a2a] rounded-t relative h-full flex items-end overflow-visible"
                    >
                      <div 
                        onMouseEnter={(e) => handleMouseEnterBar(`$${m.expense.toLocaleString()}`, e)}
                        onMouseMove={handleMouseMoveBar}
                        onMouseLeave={handleMouseLeaveBar}
                        className="w-full bg-[#ffb4ab]/60 hover:bg-[#ffb4ab] transition-all origin-bottom scale-y-100 cursor-pointer rounded-t hover:scale-x-105"
                        style={{ 
                          height: `${percentHeight}%`,
                          animationDelay: `${idx * 0.05}s`
                        }}
                      ></div>
                    </div>
                  );
                })}
              </div>
              
              {/* X axis */}
              <div className="flex justify-between mt-2 text-[10px] text-[#bbcabf] font-mono uppercase tracking-widest font-semibold text-center select-none">
                {dynamicMonthlyMetrics.map(m => (
                  <span key={m.month} className="flex-1 block text-center text-[9px]">{m.month.slice(0, 3)}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Net Cash Flow waterfall representation (Bento block 2) */}
        <div className="bg-[#201f1f] border border-white/5 rounded-xl p-6 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-semibold text-[#e5e4e2] uppercase tracking-wider font-mono flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#4edea3]" />
              Monthly Net Cash Flow
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4edea3]"></span>
                <span className="text-[10px] text-[#bbcabf] font-mono uppercase tracking-wider">Profit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffb4ab]"></span>
                <span className="text-[10px] text-[#bbcabf] font-mono uppercase tracking-wider">Loss</span>
              </div>
            </div>
          </div>

          <div className="flex-1 flex gap-4 mt-4 h-full">
            {/* Y Coords */}
            <div className="flex flex-col justify-between text-[10px] text-[#bbcabf]/30 font-mono pr-2 border-r border-[#ffffff]/5 pb-8 h-full">
              <span>{formatYAxis(maxNetFlow)}</span>
              <span>{formatYAxis(maxNetFlow * 0.5)}</span>
              <span className="text-[#4edea3]/70 font-bold font-mono">0</span>
              <span>{formatYAxis(-maxNetFlow * 0.5)}</span>
              <span>{formatYAxis(-maxNetFlow)}</span>
            </div>

            <div className="flex-1 flex flex-col relative">
              
              {/* Horizontal grid guide lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
                <div className="border-t border-white/5 w-full"></div>
                <div className="border-t border-white/5 w-full"></div>
                {/* 0 Baseline marker */}
                <div className="border-t border-[#4edea3]/30 w-full z-10"></div>
                <div className="border-t border-white/5 w-full"></div>
                <div className="border-t border-white/5 w-full"></div>
              </div>

              {/* Waterfall Bar tracks */}
              <div className="flex-1 flex items-stretch justify-between gap-1.5 h-full z-20 relative pb-8">
                {dynamicMonthlyMetrics.map((m, idx) => {
                  const isProfit = m.net >= 0;
                  const absNet = Math.abs(m.net);
                  const percentHeight = (absNet / maxNetFlow) * 50; // Max 50% up or down
                  
                  return (
                    <div key={m.month} className="flex-1 relative">
                      {isProfit ? (
                        /* Profit grows UP from the 50% baseline center */
                        <div 
                          onMouseEnter={(e) => handleMouseEnterBar(`+$${m.net.toLocaleString()}`, e)}
                          onMouseMove={handleMouseMoveBar}
                          onMouseLeave={handleMouseLeaveBar}
                          className="absolute bottom-[50%] left-0 right-0 bg-[#4edea3]/60 hover:bg-[#4edea3] transition-all rounded hover:scale-x-105 cursor-pointer"
                          style={{ 
                            height: `${percentHeight}%`,
                            animationDelay: `${idx * 0.05}s`
                          }}
                        ></div>
                      ) : (
                        /* Loss drops DOWN from the 50% baseline center */
                        <div 
                          onMouseEnter={(e) => handleMouseEnterBar(`-$${absNet.toLocaleString()}`, e)}
                          onMouseMove={handleMouseMoveBar}
                          onMouseLeave={handleMouseLeaveBar}
                          className="absolute top-[50%] left-0 right-0 bg-[#ffb4ab]/60 hover:bg-[#ffb4ab] transition-all rounded hover:scale-x-105 cursor-pointer"
                          style={{ 
                            height: `${percentHeight}%`,
                            animationDelay: `${idx * 0.05}s`
                          }}
                        ></div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom short labeling names */}
              <div className="flex justify-between text-[10px] text-[#bbcabf] font-mono uppercase tracking-widest font-semibold h-8 items-center text-center select-none">
                {dynamicMonthlyMetrics.map(m => (
                  <span key={m.month} className="flex-1 text-center block text-[9px]">{m.shortMonth}</span>
                ))}
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
